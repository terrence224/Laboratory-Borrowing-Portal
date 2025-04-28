from flask import Flask, render_template, redirect, url_for, session, request
from authlib.integrations.flask_client import OAuth
import requests
import json
import os
from datetime import datetime, timedelta
from functools import wraps
from supabase import create_client, Client
import config

app = Flask(__name__)
app.secret_key = config.SECRET_KEY
app.config['SESSION_COOKIE_SECURE'] = False  # Set to True in production with HTTPS
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(days=7)

# Setup OAuth
oauth = OAuth(app)
google = oauth.register(
    name='google',
    client_id=config.GOOGLE_CLIENT_ID,
    client_secret=config.GOOGLE_CLIENT_SECRET,
    access_token_url='https://accounts.google.com/o/oauth2/token',
    access_token_params=None,
    authorize_url='https://accounts.google.com/o/oauth2/auth',
    authorize_params=None,
    api_base_url='https://www.googleapis.com/oauth2/v1/',
    client_kwargs={'scope': 'openid email profile'},
)

# Initialize Supabase client
supabase: Client = create_client(config.SUPABASE_URL, config.SUPABASE_KEY)

# Login required decorator
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user' not in session:
            return redirect(url_for('login', next=request.url))
        return f(*args, **kwargs)
    return decorated_function

# Routes
@app.route('/')
def index():
    if 'user' in session:
        user_type = session.get('user_type')
        if user_type == 'custodian':
            return redirect(url_for('custodian_dashboard'))
        else:
            return redirect(url_for('borrower_dashboard'))
    return redirect(url_for('login'))

@app.route('/login')
def login():
    return render_template('login.html')

@app.route('/login/google')
def login_with_google():
    redirect_uri = url_for('authorize', _external=True)
    return google.authorize_redirect(redirect_uri)

@app.route('/authorize')
def authorize():
    try:
        token = google.authorize_access_token()
        resp = google.get('userinfo')
        user_info = resp.json()
        
        # Store user info in session
        session['user'] = user_info
        session.permanent = True
        
        # Check if user exists in database and determine user type
        email = user_info.get('email')
        
        # For simplicity, let's determine user type based on email domain
        # In a real application, you would check against your database
        if email.endswith('@custodian.example.com'):
            session['user_type'] = 'custodian'
            return redirect(url_for('custodian_dashboard'))
        else:
            session['user_type'] = 'borrower'
            return redirect(url_for('borrower_dashboard'))
            
    except Exception as e:
        print(f"Error during authorization: {e}")
        return redirect(url_for('login', error='Authentication failed'))

@app.route('/logout')
def logout():
    session.pop('user', None)
    session.pop('user_type', None)
    return redirect(url_for('login'))

# Borrower routes
@app.route('/borrower/dashboard')
@login_required
def borrower_dashboard():
    # For now, just render a placeholder page
    return render_template('borrower/dashboard.html')

# Custodian routes
@app.route('/custodian/dashboard')
@login_required
def custodian_dashboard():
    # For now, just render a placeholder page
    return render_template('custodian/dashboard.html')

@app.route('/borrower/items_display')
@login_required
def borrower_items():
    try:
        # Fetch categories and items from Supabase
        categories_response = supabase.table('categories').select('*').execute()
        items_response = supabase.table('items').select('*').execute()
        
        categories = categories_response.data
        items = items_response.data
        
        # Group items by category for easier rendering
        items_by_category = {}
        for category in categories:
            category_id = category['id']
            category_name = category['name']  # Get the category name
            items_by_category[category_id] = []
            
            for item in items:
                if item['category_id'] == category_id:
                    # Add image path - we'll check multiple extensions in the template
                    item['image_basename'] = item['name'].lower().replace(' ', '_')
                    item['category'] = category_name  # Add category name to the item
                    items_by_category[category_id].append(item)
        
        return render_template('borrower/items/display.html', 
                               categories=categories, 
                               items_by_category=items_by_category)
    
    except Exception as e:
        print(f"Error fetching items: {e}")
        return render_template('error.html', error='Unable to fetch items at this time')

# Error handlers
@app.errorhandler(404)
def page_not_found(e):
    return render_template('error.html', error='Page not found'), 404

@app.errorhandler(500)
def server_error(e):
    return render_template('error.html', error='Internal server error'), 500

if __name__ == '__main__':
    app.run(debug=True)