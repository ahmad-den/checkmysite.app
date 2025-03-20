import aiohttp
import asyncio
import logging
import aiodns
import ujson  # Faster JSON parsing
from time import time
from logging_config import configure_logging  # Import the logging configuration function

# Configure logging
configure_logging()

# Asynchronous function to fetch PSI data
async def fetch_psi_data_async(url, api_key, platform, retries=3):
    start_time = time()  # Track start time
    logging.info(f"PSI_LOGS: Starting async PSI request for {url} ({platform})")

    psi_api_url = f"https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url={url}&key={api_key}&strategy={platform}"

    # Use aiodns with aiohttp for asynchronous DNS resolution
    resolver = aiodns.DNSResolver()  # Initialize the aiodns resolver
    connector = aiohttp.TCPConnector(
        resolver=aiohttp.AsyncResolver(),
        limit=100,  # Limit total simultaneous connections
        limit_per_host=50,  # Limit per host
        ttl_dns_cache=300  # Enable DNS caching for 5 minutes
    )

    # Define a timeout for the request
    timeout = aiohttp.ClientTimeout(total=30)  # Total timeout of 30 seconds

    try:
        async with aiohttp.ClientSession(connector=connector, json_serialize=ujson.dumps, timeout=timeout) as session:
            async with session.get(psi_api_url) as response:
                response.raise_for_status()  # Raise an error for non-2xx responses
                psi_data = await response.json(loads=ujson.loads)  # Use ujson for faster JSON parsing

                lighthouse_metrics = psi_data['lighthouseResult']['audits']
                overall_score = psi_data['lighthouseResult']['categories']['performance']['score'] * 100

                cwv_scores = {
                    'LCP': lighthouse_metrics['largest-contentful-paint']['numericValue'] / 1000,  # ms to seconds
                    'CLS': lighthouse_metrics['cumulative-layout-shift']['numericValue'],
                    'TBT': lighthouse_metrics['total-blocking-time']['numericValue'] / 1000,  # ms to seconds
                    'overall_score': overall_score
                }

                end_time = time()  # Track end time
                total_time = end_time - start_time  # Calculate total time taken
                logging.info(f"PSI_LOGS: Finished async PSI request for {url} ({platform}) in {total_time:.2f} seconds")
                logging.info(f"PSI_LOGS: Core Web Vitals for {url} ({platform}): LCP = {cwv_scores['LCP']}s, CLS = {cwv_scores['CLS']}, TBT = {cwv_scores['TBT']}s, Overall Score = {overall_score}")

                # Log performance to file in readable format
                logging.info(f"PERF_LOG: Site URL: {url} -- Platform: {platform} -- Total Time: {total_time:.2f} seconds\n")

                return platform, cwv_scores
    except aiohttp.ClientError as e:
        # Retry logic in case of failure
        if retries > 0:
            wait_time = 2 ** (3 - retries)  # Exponential backoff
            logging.info(f"PSI_LOGS: Retrying {platform} for {url} after failure: {e}. Waiting {wait_time} seconds.")
            await asyncio.sleep(wait_time)
            return await fetch_psi_data_async(url, api_key, platform, retries - 1)
        else:
            end_time = time()
            total_time = end_time - start_time
            logging.error(f"PSI_LOGS: Error fetching CWV scores for {url} ({platform}) after {total_time:.2f} seconds: {e}")
            logging.info(f"PERF_LOG: Site URL: {url} -- Platform: {platform} -- Failed after {total_time:.2f} seconds\n")
            return platform, None

# Asynchronous function to run PSI tests for mobile and desktop
async def get_cwv_score(url, api_key):
    platforms = ['mobile', 'desktop']
    tasks = []

    # Launch both requests asynchronously
    for platform in platforms:
        tasks.append(fetch_psi_data_async(url, api_key, platform))

    results = await asyncio.gather(*tasks)  # Run tasks concurrently

    return {platform: cwv_scores for platform, cwv_scores in results if cwv_scores is not None}

