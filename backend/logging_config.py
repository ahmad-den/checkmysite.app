# logging_config.py

import logging
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

def configure_logging():
    # Determine the logging level based on the environment
    environment = os.getenv('FLASK_ENV', 'development')
    log_level = os.getenv('LOG_LEVEL', 'DEBUG')  # Default to DEBUG if not specified
    
    if environment == 'production':
        logging_level = getattr(logging, log_level.upper(), logging.WARNING)
    else:
        logging_level = getattr(logging, log_level.upper(), logging.DEBUG)
    
    # Basic logging configuration
    logging.basicConfig(
        level=logging_level,
        format='%(asctime)s %(levelname)s: %(message)s',
        handlers=[
            logging.FileHandler("performance_logs.log") if environment != 'production' else logging.NullHandler(),
            logging.StreamHandler()  # Log to console
        ]
    )

    logging.info(f"Logging initialized. Environment: {environment}, Log Level: {log_level}")

