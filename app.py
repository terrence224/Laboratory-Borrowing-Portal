from flask import Flask, render_template, redirect, url_for, session, request, jsonify, make_response
from authlib.integrations.flask_client import OAuth
import requests
import json
import os
from datetime import datetime, timedelta
from functools import wraps
from supabase import create_client, Client
import config
import traceback
import sys

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
        

        if email in config.ALLOWED_CUSTODIAN_EMAILS:
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
def borrower_items_display():
    try:
        # Fetch categories and items from Supabase
        categories_response = supabase.table('categories').select('*').execute()
        items_response = (
            supabase
            .table('items')
            .select('*')
            .order('name', desc=False)   # specify ascending order
            .execute()
        )        
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
        
        return render_template('borrower/items_display.html', 
                               categories=categories, 
                               items_by_category=items_by_category)
    
    except Exception as e:
        print(f"Error fetching items: {e}")
        return render_template('error.html', error='Unable to fetch items at this time')




@app.route('/submit_borrowing_request', methods=['POST'])
@login_required
def submit_borrowing_request():
    try:
        # 1) Extract required form fields
        laboratory    = request.form.get('laboratory')
        borrower_name = request.form.get('borrower_name')
        faculty_name  = request.form.get('faculty_name')
        subject       = request.form.get('subject')
        section       = request.form.get('section')
        date_filed    = request.form.get('date_filed')
        date_needed   = request.form.get('date_needed')

        # 2) Validate presence of each
        for field, val in [
            ('laboratory', laboratory),
            ('borrower_name', borrower_name),
            ('faculty_name', faculty_name),
            ('subject', subject),
            ('section', section),
            ('date_filed', date_filed),
            ('date_needed', date_needed),
        ]:
            if not val:
                return jsonify({
                    'success': False,
                    'message': f'Missing required field: {field}'
                }), 400

        # 3) Parse cart items JSON
        items_json = request.form.get('items')
        if not items_json:
            return jsonify({'success': False, 'message': 'No items provided'}), 400
        items = json.loads(items_json)

        user_email = session.get('user', {}).get('email')
        if not user_email:
            return jsonify({
                'success': False,
                'message': 'Cannot identify your email—please log in again'
            }), 401
        
        # 4) Build the borrowing_request record
        borrowing_data = {
            'laboratory':    laboratory,
            'borrower_name': borrower_name,
            'faculty_name':  faculty_name,
            'subject':       subject,
            'section':       section,
            'date_filed':    date_filed,
            'date_needed':   date_needed,
            'status':        'pending',
            'user_email':    user_email
        }

        # 5) Insert the borrowing request, catching any Supabase/API errors
        try:
            resp = supabase.table('borrowing_requests') \
                           .insert(borrowing_data) \
                           .execute()
            borrowing_id = resp.data[0]['id']
        except APIError as e:
            app.logger.error('Supabase insert failed: %s', e)
            return jsonify({'success': False, 'message': str(e)}), 400

        # 6) Insert each item in borrowing_items
        for item in items:
            supabase.table('borrowing_items') \
                    .insert({
                        'borrowing_id': borrowing_id,
                        'item_id':      item['id'],
                        'quantity':     item['quantity']
                    }) \
                    .execute()

        # 7) Return success JSON
        return jsonify({
            'success':      True,
            'message':      'Borrowing request submitted successfully!',
            'borrowing_id': borrowing_id
        }), 200

    except Exception as e:
        app.logger.exception('Unhandled error in submit_borrowing_request')
        return jsonify({'success': False, 'message': str(e)}), 500
    
    
    
    




@app.route('/borrower/history')
@login_required
def borrower_history():
    try:
        user_email = session['user']['email']

        resp = (
            supabase
            .table('borrowing_requests')
            .select('*')
            .eq('user_email', user_email)
            .order('id', desc=True)
            .execute()
        )
        # NO parentheses here:
        borrowing_requests = resp.data

        for req in borrowing_requests:
            items_resp = (
                supabase
                .table('borrowing_items')
                .select('*, items(id, name)')
                .eq('borrowing_id', req['id'])
                .execute()
            )
            raw_items = items_resp.data

            items = []
            for bi in raw_items:
                item = bi['items']
                items.append({
                    'id': item['id'],
                    'name': item['name'],
                    'quantity': bi['quantity'],
                    'broken': bi.get('broken_qty', 0),
                    'lost': bi.get('lost_qty', 0),
                    'returned_quantity': bi.get('returned_qty', 0),
                    'remarks': bi.get('remarks', '')
                })

            req['items'] = items
            req['date_filed']  = datetime.strptime(req['date_filed'], '%Y-%m-%d').date()
            req['date_needed'] = datetime.strptime(req['date_needed'], '%Y-%m-%dT%H:%M:%S')

        return render_template(
            'borrower/borrowing_history.html',
            borrowing_requests=borrowing_requests
        )

    except Exception as e:
        print(f"Error fetching borrowing history: {e}", file=sys.stderr)
        traceback.print_exc()
        return render_template('error.html',
                               error='Unable to fetch borrowing history at this time')



@app.route('/api/borrowing_request/<int:request_id>')
@login_required
def get_borrowing_request(request_id):
    try:
        user_email = session['user']['email']

        # Fetch the specific borrowing request
        resp = (
            supabase
            .table('borrowing_requests')
            .select('*')
            .eq('id', request_id)
            .execute()
        )
        data_list = resp.data          
        if not data_list:
            return jsonify({'success': False, 'message': 'Request not found'})

        request_data = data_list[0]
        if request_data['user_email'] != user_email:
            return jsonify({'success': False, 'message': 'Unauthorized access'})

        # Fetch items linked to this request
        items_resp = (
            supabase
            .table('borrowing_items')
            .select('*, items(id, name)')
            .eq('borrowing_id', request_id)
            .execute()
        )
        raw_items = items_resp.data      

        # Process items to simplify structure
        items = []
        for bi in raw_items:
            item = bi['items']
            items.append({
                'id':               item['id'],
                'name':             item['name'],
                'quantity':         bi['quantity'],
                'broken':           bi.get('broken_qty', 0),
                'lost':             bi.get('lost_qty', 0),
                'returned_quantity': bi.get('returned_qty', 0),
                'remarks':          bi.get('remarks', '')
            })

        request_data['items'] = items

        # If returned, add placeholder return info
        return_info = {}
        if request_data.get('status') == 'returned':
            now = datetime.now()
            return_info = {
                'return_date': now.strftime('%Y-%m-%d'),
                'return_time': now.strftime('%H:%M')
            }

        return jsonify({
            'success': True,
            'request': {**request_data, **return_info}
        })

    except Exception as e:
        print(f"Error fetching request details: {e}", file=sys.stderr)
        return jsonify({'success': False, 'message': f'Error fetching request details: {str(e)}'})


@app.route('/api/borrowing_request/<int:request_id>', methods=['DELETE'])
@login_required
def delete_borrowing_request(request_id):
    try:
        user_email = session['user']['email']

        # 1. Verify the request belongs to the current user
        resp = (
            supabase
            .table('borrowing_requests')
            .select('user_email')
            .eq('id', request_id)
            .execute()
        )
        records = resp.data
        if not records or records[0]['user_email'] != user_email:
            return jsonify({'success': False, 'message': 'Unauthorized or not found'}), 403

        # 2. Delete child items first
        items_del = (
            supabase
            .table('borrowing_items')
            .delete()
            .eq('borrowing_id', request_id)
            .execute()
        )

        # 3. Delete the main request row
        req_del = (
            supabase
            .table('borrowing_requests')
            .delete()
            .eq('id', request_id)
            .execute()
        )

        return jsonify({'success': True})
    except Exception as e:
        print(f"Error deleting borrowing request: {e}", file=sys.stderr)
        return jsonify({'success': False, 'message': 'Server error'}), 500






@app.route('/custodian/inventory')
@login_required
def inventory_management():
    try:
        # Fetch categories and items from database
        categories_response = supabase.table('categories').select('*').execute()
        items_response = (
            supabase
            .table('items')
            .select('*')
            .order('name', desc=False)   # specify ascending order
            .execute()
        )        
        categories = categories_response.data
        items = items_response.data
        
        # Group items by category for easier rendering
        items_by_category = {}
        for category in categories:
            category_id = category['id']
            category_name = category['name']
            items_by_category[category_id] = []
            
            for item in items:
                if item['category_id'] == category_id:
                    # Add image basename for loading images
                    item['image_basename'] = item['name'].lower().replace(' ', '_')
                    items_by_category[category_id].append(item)
        
        return render_template('custodian/inventory_management.html', 
                              categories=categories, 
                              items_by_category=items_by_category)
    
    except Exception as e:
        print(f"Error fetching items: {e}")
        return render_template('error.html', error='Unable to fetch items at this time')

# API Routes for Items Management
@app.route('/api/items/<item_id>', methods=['GET'])
@login_required
def get_item(item_id):
    try:
        # Fetch item data
        item_response = supabase.table('items').select('*').eq('id', item_id).execute()
        
        if not item_response.data:
            return jsonify({'success': False, 'message': 'Item not found'}), 404
            
        item = item_response.data[0]
        
        return jsonify(item), 200
            
    except Exception as e:
        app.logger.error(f"Error fetching item: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/items/<item_id>', methods=['PUT'])
@login_required
def update_item(item_id):
    try:
        # Check if item exists
        item_check = supabase.table('items').select('*').eq('id', item_id).execute()
        if not item_check.data:
            return jsonify({'success': False, 'message': 'Item not found'}), 404
           
        # Extract JSON data
        data = request.json
        
        # Get existing item data to use as defaults
        existing_item = item_check.data[0]
        
        # Use existing values as defaults if fields are not provided
        item_name = data.get('item_name', existing_item['name'])
        category_id = data.get('category_id', existing_item['category_id'])
        total_quantity = data.get('total_quantity', existing_item['total_quantity'])
        available_quantity = data.get('available_quantity', existing_item['available_quantity'])
        status = data.get('status', existing_item['status'])
       
        # Validate data - now we only check if fields are valid, not if they're all provided
        if available_quantity > total_quantity:
            return jsonify({'success': False, 'message': 'Available quantity cannot exceed total quantity'}), 400
       
        # Create update data
        update_data = {
            'name': item_name,
            'category_id': category_id,
            'total_quantity': total_quantity,
            'available_quantity': available_quantity,
            'status': status,
        }
       
        # Update in database
        result = supabase.table('items').update(update_data).eq('id', item_id).execute()
       
        return jsonify({'success': True, 'message': 'Item updated successfully', 'item': result.data[0]}), 200
           
    except Exception as e:
        app.logger.error(f"Error updating item: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

    
    

# Error handlers
@app.errorhandler(404)
def page_not_found(e):
    return render_template('error.html', error='Page not found'), 404

@app.errorhandler(500)
def server_error(e):
    return render_template('error.html', error='Internal server error'), 500

if __name__ == '__main__':
    app.run(debug=True)