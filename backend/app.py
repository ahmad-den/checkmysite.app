from flask import Flask, request, session, jsonify, render_template
import requests
import py_compile
import re
import uuid
from bs4 import BeautifulSoup
import logging
from dotenv import load_dotenv
from flask_cors import CORS
import os
from utils import log_request, is_valid_url
from concurrent.futures import ThreadPoolExecutor
from urllib.parse import urlparse

from logging_config import configure_logging

load_dotenv()  # Load environment variables from .env

# Initialize logging
configure_logging()

app = Flask(__name__)
CORS(app)  # Enable CORS for cross-origin requests (required for frontend-backend communication)

executor = ThreadPoolExecutor(max_workers=10)  # ThreadPoolExecutor for async PSI score fetching

app.secret_key = os.getenv('SECRET_KEY', 'supersecretkey')
API_KEY = os.getenv('API_KEY')

# Disable Werkzeug logging (optional)
log = logging.getLogger('werkzeug')
log.disabled = False

# Helper functions and exclusion_list remain the same
from exclusion_list import exclusion_list

def strip_query_params(url):
    """Helper function to remove query parameters from a URL."""
    parsed_url = urlparse(url)
    return parsed_url.path  # Return only the path without query parameters

def categorize_script(script_src, script_id, plugin_or_theme, js_list):
    """Categorizes the script based on the provided list for the specific plugin or theme."""
    # Normalize to lowercase for consistency
    plugin_or_theme = plugin_or_theme.lower()
    script_src = script_src.lower()
    script_id = script_id.lower()

    log.debug(f"Processing script_src: {script_src}, script_id: {script_id}, plugin_or_theme: {plugin_or_theme}")

    # Check if the script matches any of the JS files/IDs in the provided list for the specific plugin/theme
    for js_item in js_list:
        js_item = js_item.lower()  # Normalize JS item to lowercase
        log.debug(f"Checking if {js_item} is in {script_src} or {script_id}")
        if js_item in script_src or js_item in script_id:
            log.debug(f"Match found: {js_item} for {plugin_or_theme}")
            return plugin_or_theme, js_item  # Return the matching plugin/theme and JS item

    # If no match is found, return None to indicate no match
    return None, None


def process_plugin_or_theme(soup, plugin_or_theme, exclusion_list):
    """
    Process all scripts for a specific plugin or theme, checking against the exclusion list.
    Returns a list of recommendations (either 'Exclude from delay' or 'No changes needed').
    """
    recommendations = []
    processed_scripts = set()  # Keep track of processed scripts to avoid duplication

    plugin_or_theme = plugin_or_theme.lower()  # Normalize the plugin/theme name for consistent matching
    log.debug(f"Processing plugin_or_theme: {plugin_or_theme}")

    # Iterate over all <script> tags in the page source
    for script in soup.find_all('script'):
        script_src = strip_query_params(script.get('src', '')).lower()  # Normalize script src
        script_id = script.get('id', '').lower()  # Normalize script ID
        is_delayed = script.get('type') == 'pmdelayedscript'

        log.debug(f"Script detected: src={script_src}, id={script_id}, delayed={is_delayed}")

        # Check if the script matches the exclusion list for this plugin or theme
        match_found, matched_script = categorize_script(script_src, script_id, plugin_or_theme, exclusion_list)

        # If a match is found and hasn't been processed yet, determine the recommendation
        if match_found and matched_script not in processed_scripts:
            recommendation_identifier = script_id if script_id else matched_script  # Prioritize ID over matched_script
            if is_delayed:
                recommendations.append(f"{plugin_or_theme}: {recommendation_identifier} - Exclude from delay")
            else:
                recommendations.append(f"{plugin_or_theme}: {recommendation_identifier} - No changes needed")
            processed_scripts.add(matched_script)

    # For items in the exclusion list but not found in the page source
    for js_item in exclusion_list:
        if js_item not in processed_scripts:
            recommendations.append(f"{plugin_or_theme}: {js_item} - Be aware of this: Not found in page source")

    log.debug(f"Recommendations for {plugin_or_theme}: {recommendations}")
    return recommendations



def check_exclusions(page_source, loaded_plugins, loaded_themes):
    """
    Checks the page source for all loaded plugins and themes, processing exclusions for each.
    """
    soup = BeautifulSoup(page_source, 'html.parser')
    all_recommendations = []

    # Print out loaded plugins and themes for debugging
    log.info(f"Loaded plugins: {loaded_plugins}")
    log.info(f"Loaded themes: {loaded_themes}")

    # Process all plugins
    for plugin in loaded_plugins:
        plugin_key = f"plugins/{plugin.lower()}"  # Ensure case-insensitive comparison
        if plugin_key in exclusion_list:
            js_exclusion_list = exclusion_list[plugin_key]  # Get the JS list for the plugin
            log.debug(f"Processing plugin: {plugin}")
            recommendations = process_plugin_or_theme(soup, plugin, js_exclusion_list)
            all_recommendations.extend(recommendations)

    # Process all themes
    for theme in loaded_themes:
        theme_key = f"themes/{theme.lower()}"  # Ensure case-insensitive comparison
        if theme_key in exclusion_list:
            js_exclusion_list = exclusion_list[theme_key]  # Get the JS list for the theme
            log.debug(f"Processing theme: {theme}")
            recommendations = process_plugin_or_theme(soup, theme, js_exclusion_list)
            all_recommendations.extend(recommendations)

    return all_recommendations

def flatten_recommendations(recommendations):
    """Flattens the recommendation list for easy display."""
    flattened = []
    for rec in recommendations:
        flattened.append(rec)
    return flattened

@app.route('/pm_exclusions/')
def pm_exclusions():
    try:
        with open('pm_exclusions.py', 'r') as f:
            content = f.read()
    except FileNotFoundError:
        content = ""  # If the file doesn't exist, start with an empty string
    return render_template('pm_exclusions.html', content=content)

@app.route('/validate_syntax', methods=['POST'])
def validate_syntax():
    content = request.form['editor_content']
    
    # Save to temporary file for validation
    temp_file = 'temp_validation.py'
    with open(temp_file, 'w') as f:
        f.write(content)
    
    # Use py_compile to check Python syntax
    try:
        py_compile.compile(temp_file, doraise=True)
        os.remove(temp_file)  # Remove the temp file if no error
        return jsonify({"valid": True}), 200
    except py_compile.PyCompileError as e:
        os.remove(temp_file)  # Clean up temp file
        # Return the error message in JSON format
        return jsonify({"valid": False, "error": str(e)}), 400

@app.route('/save_pm_exclusions', methods=['POST'])
def save_pm_exclusions():
    content = request.form['editor_content']
    
    # Save the Python file after validation
    try:
        with open('pm_exclusions.py', 'w') as f:
            f.write(content)
        return jsonify({"message": "File saved successfully!"}), 200
    except Exception as e:
        return jsonify({"error": f"Failed to save file: {str(e)}"}), 500

# API endpoint to analyze the URL and return JSON data
@app.route('/api/analyze', methods=['POST'])
def analyze():
    # Add logging at the beginning of the function
    app.logger.info("API request received for /api/analyze")
    
    try:
        data = request.json  # Get JSON data from the request
        app.logger.info(f"Request data: {data}")
        
        url = data.get('url')
        run_psi = data.get('run_psi', False)  # Get run_psi option from the request
        app.logger.info(f"Processing URL: {url}, Run PSI: {run_psi}")

        # Validate URL
        if not is_valid_url(url):
            app.logger.warning(f"Invalid URL provided: {url}")
            return jsonify({"error": "Please enter a valid URL starting with https://"}), 400

        # Modify URL based on options (if any)
        option = data.get('option', 'default')
        if option == 'perfmattersoff':
            url += '?perfmattersoff'
        elif option == 'nocache':
            url += '?nocache'
        app.logger.info(f"Modified URL with option '{option}': {url}")

        # Initialize variables
        js_ids = set()
        css_ids = set()
        inline_scripts = []
        cache_status = ''
        bigscoots_cache_status = ''
        cache_plan = ''
        performance_tools = ''
        plugins = set()
        themes = set()
        recommendations = {}

        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'
        }

        # Fetch the page and check cache statuses
        app.logger.info(f"Sending request to {url}")
        response = requests.get(url, headers=headers)
        app.logger.info(f"Response status code: {response.status_code}")
        response.raise_for_status()

        cf_cache_status = response.headers.get('cf-cache-status', 'Not Found')
        bigscoots_cache_status = response.headers.get('X-Bigscoots-Cache-Status', 'Not Found')
        bigscoots_cache_plan = response.headers.get('x-bigscoots-cache-plan', '')
        app.logger.info(f"Cache headers - CF: {cf_cache_status}, BigScoots: {bigscoots_cache_status}, Plan: {bigscoots_cache_plan}")

        cache_status = f"CF-CACHE: {cf_cache_status}" if cf_cache_status else "CF-CACHE: Not Found"
        bigscoots_cache_status = f"X-Bigscoots-Cache-Status: {bigscoots_cache_status}"

        if bigscoots_cache_plan == 'Performance+':
            cache_plan = "Performance Plus"

        # Process page content
        app.logger.info("Processing page content")
        page_source = response.text.lower()
        found_perfmatters = '/plugins/perfmatters' in page_source
        found_wp_rocket = '/plugins/wp-rocket' in page_source
        performance_tools = "Perfmatters + WP Rocket" if found_perfmatters and found_wp_rocket else "Perfmatters" if found_perfmatters else "WP Rocket" if found_wp_rocket else "No Perfmatters"
        app.logger.info(f"Performance tools detected: {performance_tools}")

        # Parse scripts and CSS IDs
        app.logger.info("Parsing HTML with BeautifulSoup")
        try:
            soup = BeautifulSoup(response.text, 'html.parser')
            
            app.logger.info("Processing delayed scripts")
            for script in soup.find_all('script', {'type': 'pmdelayedscript'}):
                if not script.has_attr('src'):
                    inline_scripts.append(str(script))

            app.logger.info("Processing script IDs")
            for script in soup.find_all('script', id=True):
                if script['id'] and "perfmatters" not in script['id'] and not script['id'].endswith('-extra'):
                    if script.get('type') == 'pmdelayedscript':
                        js_ids.add(f"{script['id']} --- pmdelayed")
                    else:
                        js_ids.add(script['id'])

            app.logger.info("Processing CSS IDs")
            for link in soup.find_all('link', rel='stylesheet', attrs={'data-pmdelayedstyle': True}):
                if link.has_attr('id'):
                    css_ids.add(f"{link['id']} --- pmdelayedstyle")

            app.logger.info("Extracting plugins and themes")
            plugins.update(re.findall(r'/wp-content/plugins/([^/]+)', response.text))
            themes.update(re.findall(r'/wp-content/themes/([^/]+)', response.text))
        except Exception as bs_error:
            app.logger.error(f"BeautifulSoup parsing error: {bs_error}")
            return jsonify({"error": f"HTML parsing failed: {bs_error}"}), 500

        # Check exclusions
        app.logger.info("Checking for exclusions")
        loaded_plugins = sorted(plugins)
        loaded_themes = sorted(themes)
        try:
            recommendations = check_exclusions(page_source, loaded_plugins, loaded_themes)
            flattened_recommendations = flatten_recommendations(recommendations)
            app.logger.info(f"Generated {len(flattened_recommendations)} recommendations")
        except Exception as exclusion_error:
            app.logger.error(f"Error in exclusion checks: {exclusion_error}")
            return jsonify({"error": f"Exclusion check failed: {exclusion_error}"}), 500

        # Log the request (optional)
        log_message = f"Cache Status: {cache_status}\n{bigscoots_cache_status}\nCache Plan: {cache_plan}"
        app.logger.info(f"Logging request details for URL: {url}\n{log_message}")
        log_request(url, log_message)

        # Prepare response
        response_data = {
            "js_ids": sorted(js_ids),
            "css_ids": sorted(css_ids),
            "inline_scripts": inline_scripts,
            "cache_status": cache_status,
            "bigscoots_cache_status": bigscoots_cache_status,
            "cache_plan": cache_plan,
            "performance_tools": performance_tools,
            "plugins": sorted(plugins),
            "themes": sorted(themes),
            "recommendations": flattened_recommendations
        }
        app.logger.info("Successfully processed request, returning response")
        return jsonify(response_data)

    except requests.exceptions.RequestException as e:
        app.logger.error(f"Request failed: {e}")
        return jsonify({"error": f"Request failed: {e}"}), 500
    except Exception as e:
        app.logger.error(f"Unexpected error in analyze endpoint: {e}", exc_info=True)
        return jsonify({"error": f"An unexpected error occurred: {e}"}), 500

if __name__ == '__main__':
    app.run(debug=True)

