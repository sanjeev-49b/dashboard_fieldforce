#!/bin/bash

# Azure App Service startup script
echo "Starting Field Intelligence Platform..."

# Set environment variables
export HOST=0.0.0.0
export DEBUG=False

# Start Gunicorn with Flask app
gunicorn --bind=0.0.0.0:8000 --timeout 600 --workers=4 backend:app





