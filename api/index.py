import os
import sys

# Add the aiModel directory to the Python path
# This allows 'from predict import ...' to work as it does locally
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'aiModel'))

# Import the Flask app from aiModel/app.py
try:
    from app import app
    print("Successfully imported app from aiModel")
except ImportError as e:
    print(f"Import Error: {e}")
    print(f"Current Path: {sys.path}")
    raise e

@app.route("/api/health")
def health():
    return {"status": "ok", "source": "vercel-api-wrapper"}

# Vercel needs the 'app' object to be available at the top level
# or as a variable named 'handler' or 'app'
# We also disable debug mode for production
app.debug = False

# We don't need app.run() here as Vercel handles the execution
