import os
from dotenv import load_dotenv

load_dotenv()  # Load environment variables from .env file

# Google OAuth Configuration
GOOGLE_CLIENT_ID = os.getenv('GOOGLE_CLIENT_ID')
GOOGLE_CLIENT_SECRET = os.getenv('GOOGLE_CLIENT_SECRET')
GOOGLE_DISCOVERY_URL = "https://accounts.google.com/.well-known/openid-configuration"

# Supabase Configuration
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_KEY')

# Flask Configuration
SECRET_KEY = os.getenv('SECRET_KEY', 'dev-key-for-testing')