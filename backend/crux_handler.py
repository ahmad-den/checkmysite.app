import requests
import logging

def get_field_data(url, api_key):
    platforms = ['mobile', 'desktop']
    field_data_results = {}

    for platform in platforms:
        crux_api_url = f"https://chromeuxreport.googleapis.com/v1/records:queryRecord?key={api_key}"
        form_factor = "PHONE" if platform == 'mobile' else "DESKTOP"
        
        crux_payload = {
            "origin": url,
            "formFactor": form_factor,
            "metrics": [
                "largest_contentful_paint",
                "first_contentful_paint",
                "cumulative_layout_shift",
                "experimental_time_to_first_byte"
            ]
        }

        try:
            crux_response = requests.post(crux_api_url, json=crux_payload)
            if crux_response.status_code == 404:
                logging.info(f"Field Data not available for {url} ({platform}).")
                field_data_results[platform] = "Field Data Not Present"
            else:
                crux_response.raise_for_status()
                crux_data = crux_response.json()

                if 'record' in crux_data and 'metrics' in crux_data['record']:
                    field_data_metrics = crux_data['record']['metrics']

                    def get_metric_value(metric_key):
                        value = field_data_metrics.get(metric_key, {}).get('percentiles', {}).get('p75', 'N/A')
                        try:
                            return float(value) / 1000 if isinstance(value, (int, float)) else value
                        except (ValueError, TypeError):
                            return value

                    field_data = {
                        'FCP': get_metric_value('first_contentful_paint'),
                        'LCP': get_metric_value('largest_contentful_paint'),
                        'CLS': field_data_metrics.get('cumulative_layout_shift', {}).get('percentiles', {}).get('p75', 'N/A'),
                        'TTFB': get_metric_value('experimental_time_to_first_byte')
                    }

                    logging.info(f"Field Data for {url} ({platform}): FCP = {field_data['FCP']}s, LCP = {field_data['LCP']}s, CLS = {field_data['CLS']}, TTFB = {field_data['TTFB']}s")
                    field_data_results[platform] = field_data
                else:
                    logging.info(f"Field Data not available for {url} ({platform}).")
                    field_data_results[platform] = "Field Data Not Present"

        except requests.exceptions.RequestException as e:
            logging.error(f"Error fetching Field Data for {url} ({platform}): {e}")
            field_data_results[platform] = None

    return field_data_results

