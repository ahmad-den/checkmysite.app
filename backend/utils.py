import re
import os
import logging
import urllib.parse
from datetime import datetime

def log_request(url, data):
    parsed_url = urllib.parse.urlparse(url)
    cleaned_url = re.sub(r'\W+', '_', parsed_url.netloc + parsed_url.path)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"{cleaned_url}_{timestamp}.log"
    log_dir = "logs"
    if not os.path.exists(log_dir):
        os.makedirs(log_dir)
    filepath = os.path.join(log_dir, filename)
    with open(filepath, 'w') as f:
        f.write(f"URL: {url}\n\n")
        f.write(f"Data:\n{data}\n")
    logging.info(f"Request data logged to {filepath}")

def is_valid_url(url):
    return re.match(r'^https:\/\/[^\s$.?#].[^\s]*$', url)

def get_cwv_color(metric, value):
    try:
        value = float(value)
    except ValueError:
        return "gray"

    if metric == "CLS":
        return "green" if value <= 0.1 else "orange" if value <= 0.25 else "red"
    elif metric == "LCP":
        return "green" if value <= 2.5 else "orange" if value <= 4.0 else "red"
    elif metric == "FID":
        return "green" if value <= 100 else "orange" if value <= 300 else "red"
    elif metric == "TBT":
        return "green" if value <= 0.2 else "orange" if value <= 0.6 else "red"
    elif metric == "FCP":
        return "green" if value <= 1.8 else "orange" if value <= 3.0 else "red"
    elif metric == "TTFB":
        return "green" if value <= 0.2 else "orange" if value <= 0.6 else "red"
    
    return "gray"

def get_score_color(score):
    if score >= 90:
        return "green"
    elif score >= 50:
        return "orange"
    return "red"

