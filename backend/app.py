from flask import Flask, request, jsonify, send_from_directory, Response
from flask_cors import CORS
import mysql.connector
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
import hashlib
import jwt
from datetime import datetime, timedelta
import os
import json
import pytz
import requests
import base64

app = Flask(__name__)
CORS(app)  # Enable CORS for React frontend
app.config['SECRET_KEY'] = 'your-secret-key-here'  # Change this in production

# Database configuration
DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',  # Your MySQL username
    'password': '',  # Your MySQL password
    'database': 'dig_id'
}

# M-Pesa configuration
MPESA_CONFIG = {
    'consumer_key': 'xFlasGrjVLDUQKqTxb6cjeCkBPKHtYQGp6R3SKEeAEZmMSNZ',
    'consumer_secret': 'KCf3QHZLVJ1adOdNAEPElPGNdcZKlp0br3B7NlwBdR2kyBGx0AbxmSAh7KGRnFYc',
    'business_shortcode': '174379',  # Test shortcode
    'passkey': 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919',  # Test passkey
    'base_url': 'https://sandbox.safaricom.co.ke',  # Use production URL in production
    'callback_url': 'https://webhook.site/3c1f62b5-4214-47d6-9f26-71c1f4b9c8f0'
}

def get_db_connection():
    return mysql.connector.connect(**DB_CONFIG)

def get_mpesa_access_token():
    """Get M-Pesa access token"""
    try:
        print("Attempting to get M-Pesa access token...")
        url = f"{MPESA_CONFIG['base_url']}/oauth/v1/generate?grant_type=client_credentials"
        credentials = base64.b64encode(
            f"{MPESA_CONFIG['consumer_key']}:{MPESA_CONFIG['consumer_secret']}".encode()
        ).decode('utf-8')
        
        headers = {
            'Authorization': f'Basic {credentials}',
            'Content-Type': 'application/json'
        }
        
        print(f"M-Pesa token URL: {url}")
        response = requests.get(url, headers=headers)
        print(f"M-Pesa token response status: {response.status_code}")
        print(f"M-Pesa token response: {response.text}")
        
        response.raise_for_status()
        token_data = response.json()
        access_token = token_data.get('access_token')
        print(f"Successfully got access token: {access_token[:10]}..." if access_token else "No access token received")
        return access_token
    except Exception as e:
        print(f"Error getting M-Pesa token: {str(e)}")
        return None

def initiate_stk_push(phone_number, amount, account_reference, transaction_desc):
    """Initiate M-Pesa STK push"""
    try:
        print(f"Initiating STK push for phone: {phone_number}, amount: {amount}")
        access_token = get_mpesa_access_token()
        if not access_token:
            print("Failed to get access token")
            return {'success': False, 'error': 'Failed to get access token'}
        
        timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
        password = base64.b64encode(
            f"{MPESA_CONFIG['business_shortcode']}{MPESA_CONFIG['passkey']}{timestamp}".encode()
        ).decode('utf-8')
        
        url = f"{MPESA_CONFIG['base_url']}/mpesa/stkpush/v1/processrequest"
        headers = {
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json'
        }
        
        payload = {
            'BusinessShortCode': MPESA_CONFIG['business_shortcode'],
            'Password': password,
            'Timestamp': timestamp,
            'TransactionType': 'CustomerPayBillOnline',
            'Amount': amount,
            'PartyA': phone_number,
            'PartyB': MPESA_CONFIG['business_shortcode'],
            'PhoneNumber': phone_number,
            'CallBackURL': MPESA_CONFIG['callback_url'],
            'AccountReference': account_reference,
            'TransactionDesc': transaction_desc
        }
        
        print(f"STK push URL: {url}")
        print(f"STK push payload: {payload}")
        
        response = requests.post(url, json=payload, headers=headers)
        print(f"STK push response status: {response.status_code}")
        print(f"STK push response: {response.text}")
        
        response_data = response.json()
        
        # Check if the request was successful
        if response.status_code == 200 and response_data.get('ResponseCode') == '0':
            print("STK push initiated successfully")
            return response_data
        else:
            print(f"STK push failed: {response_data}")
            return {'success': False, 'error': response_data.get('errorMessage', 'STK push failed')}
            
    except Exception as e:
        print(f"Error initiating STK push: {str(e)}")
        return {'success': False, 'error': str(e)}

# Officer Authentication Routes
@app.route('/api/officer/signup', methods=['POST'])
def officer_signup():
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['idNumber', 'email', 'phoneNumber', 'fullName', 'station', 'constituency', 'password']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if officer already exists
        cursor.execute("SELECT id FROM officers WHERE id_number = %s OR email = %s", 
                      (data['idNumber'], data['email']))
        if cursor.fetchone():
            return jsonify({'error': 'Officer with this ID number or email already exists'}), 400
        
        # Hash password
        hashed_password = generate_password_hash(data['password'])
        
        # Insert new officer (pending approval)
        cursor.execute("""
            INSERT INTO officers (id_number, email, phone_number, full_name, station, constituency, password_hash, status, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, 'pending', %s)
        """, (data['idNumber'], data['email'], data['phoneNumber'], 
              data['fullName'], data['station'], data['constituency'], hashed_password, datetime.now()))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({'message': 'Application submitted successfully. Awaiting admin approval.'}), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/officer/login', methods=['POST'])
def officer_login():
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')
        
        if not email or not password:
            return jsonify({'error': 'Email and password are required'}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Get officer details including constituency
        cursor.execute("""
            SELECT id, email, full_name, station, constituency, password_hash, status 
            FROM officers WHERE email = %s
        """, (email,))
        officer = cursor.fetchone()
        
        cursor.close()
        conn.close()
        
        if not officer:
            return jsonify({'error': 'Invalid credentials'}), 401
        
        if officer['status'] == 'suspended':
            return jsonify({'error': 'Account suspended. Contact admin.'}), 403
        if officer['status'] != 'approved':
            return jsonify({'error': 'Account not approved by admin'}), 403
        
        if not check_password_hash(officer['password_hash'], password):
            return jsonify({'error': 'Invalid credentials'}), 401
        
        # Generate JWT token
        token = jwt.encode({
            'officer_id': officer['id'],
            'email': officer['email'],
            'role': 'officer',
            'exp': datetime.utcnow() + timedelta(hours=24)
        }, app.config['SECRET_KEY'], algorithm='HS256')
        
        return jsonify({
            'token': token,
            'officer': {
                'id': officer['id'],
                'email': officer['email'],
                'fullName': officer['full_name'],
                'station': officer['station'],
                'constituency': officer['constituency']
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Admin Authentication
@app.route('/api/admin/login', methods=['POST'])
def admin_login():
    try:
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')
        
        if not username or not password:
            return jsonify({'error': 'Username and password are required'}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Get admin details
        cursor.execute("""
            SELECT id, username, full_name, password_hash 
            FROM admins WHERE username = %s
        """, (username,))
        admin = cursor.fetchone()
        
        cursor.close()
        conn.close()
        
        if not admin:
            return jsonify({'error': 'Invalid credentials'}), 401
        
        if not check_password_hash(admin['password_hash'], password):
            return jsonify({'error': 'Invalid credentials'}), 401
        
        # Generate JWT token
        token = jwt.encode({
            'admin_id': admin['id'],
            'username': admin['username'],
            'role': 'admin',
            'exp': datetime.utcnow() + timedelta(hours=24)
        }, app.config['SECRET_KEY'], algorithm='HS256')
        
        return jsonify({
            'token': token,
            'admin': {
                'id': admin['id'],
                'username': admin['username'],
                'fullName': admin['full_name']
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Constituency Management Routes
@app.route('/api/constituencies', methods=['GET'])
def get_constituencies():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute("SELECT id, name, created_at FROM constituencies ORDER BY name")
        constituencies = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        return jsonify({'constituencies': constituencies}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/constituencies', methods=['POST'])
def add_constituency():
    try:
        data = request.get_json()
        name = data.get('name')
        
        if not name:
            return jsonify({'error': 'Constituency name is required'}), 400
            
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if constituency already exists
        cursor.execute("SELECT id FROM constituencies WHERE name = %s", (name,))
        if cursor.fetchone():
            cursor.close()
            conn.close()
            return jsonify({'error': 'Constituency already exists'}), 400
        
        cursor.execute("INSERT INTO constituencies (name, created_at) VALUES (%s, %s)", 
                      (name, datetime.now()))
        conn.commit()
        
        cursor.close()
        conn.close()
        
        return jsonify({'message': 'Constituency added successfully'}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/constituencies/<int:constituency_id>', methods=['DELETE'])
def delete_constituency(constituency_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("DELETE FROM constituencies WHERE id = %s", (constituency_id,))
        if cursor.rowcount == 0:
            cursor.close()
            conn.close()
            return jsonify({'error': 'Constituency not found'}), 404
            
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({'message': 'Constituency deleted successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Admin Routes
@app.route('/api/admin/officers/pending', methods=['GET'])
def get_pending_officers():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute("""
            SELECT id, id_number, email, phone_number, full_name, station, created_at
            FROM officers WHERE status = 'pending'
            ORDER BY created_at DESC
        """)
        officers = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        return jsonify({'officers': officers}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/officers/<int:officer_id>/approve', methods=['PUT'])
def approve_officer(officer_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("UPDATE officers SET status = 'approved' WHERE id = %s", (officer_id,))
        conn.commit()
        
        cursor.close()
        conn.close()
        
        return jsonify({'message': 'Officer approved successfully'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/officers/<int:officer_id>/reject', methods=['PUT'])
def reject_officer(officer_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("UPDATE officers SET status = 'rejected' WHERE id = %s", (officer_id,))
        conn.commit()
        
        cursor.close()
        conn.close()
        
        return jsonify({'message': 'Officer rejected'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Application Routes
@app.route('/api/applications', methods=['POST'])
def submit_application():
    try:
        print("Received request:", request.method, request.content_type)
        
        # Check content type
        if request.content_type and 'application/json' in request.content_type:
            # Handle JSON data
            data = request.get_json()
            files = {}
            print("Processing JSON data:", list(data.keys()) if data else "No data")
        else:
            # Handle form data with files
            data = request.form.to_dict()
            files = request.files
            print("Processing form data:", list(data.keys()) if data else "No data")
        
        # Validate required fields
        required_fields = ['fullNames', 'dateOfBirth', 'gender', 'fatherName', 'motherName', 
                          'districtOfBirth', 'tribe', 'homeDistrict', 'division', 
                          'constituency', 'location', 'subLocation', 'villageEstate', 'occupation']
        
        missing_fields = [field for field in required_fields if not data.get(field)]
        if missing_fields:
            print("Missing required fields:", missing_fields)
            return jsonify({'error': f'Missing required fields: {", ".join(missing_fields)}'}), 400
        
        # Open connection
        conn = get_db_connection()
        cursor = conn.cursor()

        # Determine submitting officer
        officer_id = None

        # Try JWT from Authorization header
        auth_header = request.headers.get('Authorization', '')
        if auth_header.startswith('Bearer '):
            try:
                token = auth_header.split(' ')[1]
                payload = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
                officer_id = payload.get('officer_id')
            except Exception as e:
                print('JWT decode failed:', e)

        # Fallback to explicit officerId in payload
        if not officer_id:
            officer_id = data.get('officerId')

        # Validate officer
        if not officer_id:
            cursor.close()
            conn.close()
            return jsonify({'error': 'Officer ID missing'}), 400

        cursor.execute("SELECT id FROM officers WHERE id = %s AND status = 'approved'", (officer_id,))
        officer_result = cursor.fetchone()
        if not officer_result:
            cursor.close()
            conn.close()
            return jsonify({'error': 'Invalid or unapproved officer'}), 400

        # Generate application number (sequential per total count)
        cursor.execute("SELECT COUNT(*) FROM applications")
        count = cursor.fetchone()[0]
        application_number = f"APP{datetime.now().year}{count + 1:06d}"
        
        print(f"Generated application number: {application_number}")
        
        # Insert application
        cursor.execute("""
            INSERT INTO applications (
                application_number, officer_id, application_type,
                full_names, date_of_birth, gender, father_name, mother_name,
                marital_status, husband_name, husband_id_no,
                district_of_birth, tribe, clan, family, home_district,
                division, constituency, location, sub_location, village_estate,
                home_address, occupation, supporting_documents, status, created_at
            ) VALUES (
                %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
                %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
            )
        """, (
            application_number, officer_id, 'new',
            data['fullNames'], data['dateOfBirth'], data['gender'],
            data['fatherName'], data['motherName'], data.get('maritalStatus'),
            data.get('husbandName'), data.get('husbandIdNo'),
            data['districtOfBirth'], data['tribe'], data.get('clan'),
            data.get('family'), data['homeDistrict'], data['division'],
            data['constituency'], data['location'], data['subLocation'],
            data['villageEstate'], data.get('homeAddress'), data['occupation'],
            json.dumps(data.get('supportingDocuments', {})), 'submitted', datetime.now()
        ))
        
        application_id = cursor.lastrowid
        
        # Handle file uploads (only if files were sent)
        upload_dir = 'uploads'
        os.makedirs(upload_dir, exist_ok=True)
        
        for file_key, file in files.items():
            if file and file.filename:
                # Create safe filename
                filename = f"{application_number}_{file_key}_{file.filename}"
                file_path = os.path.join(upload_dir, filename)
                file.save(file_path)
                
                # Map file types
                doc_type_mapping = {
                    'passportPhoto': 'passport_photo',
                    'birthCertificate': 'birth_certificate', 
                    'parentsId': 'parent_id_front'
                }
                
                doc_type = doc_type_mapping.get(file_key, file_key)
                
                # Insert document record - store only filename for URL serving
                cursor.execute("""
                    INSERT INTO documents (application_id, document_type, file_path)
                    VALUES (%s, %s, %s)
                """, (application_id, doc_type, filename))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({
            'message': 'Application submitted successfully',
            'applicationNumber': application_number
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/applications/track/<application_number>', methods=['GET'])
def track_application(application_number):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute("""
            SELECT application_number, full_names, status, created_at, updated_at
            FROM applications WHERE application_number = %s
        """, (application_number,))
        
        application = cursor.fetchone()
        cursor.close()
        conn.close()
        
        if not application:
            return jsonify({'error': 'Application not found'}), 404
            
        return jsonify({'application': application}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/officers/approved', methods=['GET'])
def get_approved_officers():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute("""
            SELECT id, id_number, email, phone_number, full_name, station, status, created_at
            FROM officers WHERE status IN ('approved', 'suspended')
            ORDER BY created_at DESC
        """)
        officers = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        return jsonify({'officers': officers}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/applications', methods=['GET'])
def get_all_applications():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Get only pending applications (submitted status)
        cursor.execute("""
            SELECT a.id, a.application_number, a.full_names, a.status, 
                   a.application_type, a.created_at, a.updated_at,
                   o.full_name as officer_name
            FROM applications a 
            LEFT JOIN officers o ON a.officer_id = o.id
            WHERE a.status = 'submitted'
            ORDER BY a.created_at DESC
        """)
        
        applications = cursor.fetchall()
        cursor.close()
        conn.close()
        
        return jsonify({'applications': applications}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/applications/history', methods=['GET'])
def get_application_history():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Get all applications regardless of status
        cursor.execute("""
            SELECT a.id, a.application_number, a.full_names, a.status, 
                   a.application_type, a.created_at, a.updated_at,
                   a.generated_id_number, o.full_name as officer_name
            FROM applications a 
            LEFT JOIN officers o ON a.officer_id = o.id
            ORDER BY a.created_at DESC
        """)
        
        applications = cursor.fetchall()
        cursor.close()
        conn.close()
        
        return jsonify({'applications': applications}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/applications/<int:application_id>', methods=['GET'])
def get_application_details(application_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Get application details
        cursor.execute("""
            SELECT a.*, o.full_name as officer_name
            FROM applications a 
            LEFT JOIN officers o ON a.officer_id = o.id
            WHERE a.id = %s
        """, (application_id,))
        
        application = cursor.fetchone()
        
        if not application:
            cursor.close()
            conn.close()
            return jsonify({'error': 'Application not found'}), 404
        
        # Get supporting documents
        cursor.execute("""
            SELECT document_type, file_path
            FROM documents WHERE application_id = %s
        """, (application_id,))
        
        documents = cursor.fetchall()
        application['documents'] = documents
        
        cursor.close()
        conn.close()
        
        return jsonify({'application': application}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/applications/<int:application_id>/approve', methods=['PUT'])
def approve_application(application_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        print(f"[approve_application] Start - application_id={application_id}")

        # Get application details to check if it's a renewal
        cursor.execute("""
            SELECT application_type, existing_id_number 
            FROM applications 
            WHERE id = %s
        """, (application_id,))
        app_details = cursor.fetchone()
        print(f"[approve_application] app_details={app_details}")

        if not app_details:
            cursor.close()
            conn.close()
            return jsonify({'error': 'Application not found'}), 404

        # Handle approvals differently for new applications vs renewals
        if app_details['application_type'] == 'renewal' and app_details['existing_id_number']:
            # For renewals, just update status - don't change the generated_id_number
            id_number = app_details['existing_id_number']
            cursor.execute("""
                UPDATE applications 
                SET status = 'approved', updated_at = %s
                WHERE id = %s
            """, (datetime.now(), application_id))
        else:
            # Generate new ID number for new applications using proper sequence
            year = datetime.now().year
            prefix = f"ID{year}"

            # Note: avoid passing a value with '%' via params; use CONCAT to append wildcard in SQL.
            cursor.execute("""
                SELECT COALESCE(MAX(CAST(SUBSTRING(generated_id_number, 7) AS UNSIGNED)), 0) AS max_id
                FROM applications
                WHERE generated_id_number LIKE CONCAT(%s, '%%')
            """, (prefix,))
            result = cursor.fetchone()
            max_id = result['max_id'] if result and result['max_id'] is not None else 0

            print(f"[approve_application] year={year}, prefix={prefix}, max_id={max_id}")

            # Build next ID number
            id_number = f"{prefix}{int(max_id) + 1:08d}"

            # Update application status and assign new ID number
            cursor.execute("""
                UPDATE applications 
                SET status = 'approved', generated_id_number = %s, updated_at = %s
                WHERE id = %s
            """, (id_number, datetime.now(), application_id))

        if cursor.rowcount == 0:
            cursor.close()
            conn.close()
            return jsonify({'error': 'Application not found'}), 404

        conn.commit()
        cursor.close()
        conn.close()

        print(f"[approve_application] Success - application_id={application_id}, id_number={id_number}")

        return jsonify({
            'message': 'Application approved successfully',
            'id_number': id_number
        }), 200

    except Exception as e:
        # Log the error for debugging
        print(f"[approve_application] Error - application_id={application_id}, error={e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/applications/<int:application_id>/reject', methods=['PUT'])
def reject_application(application_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Update application status
        cursor.execute("""
            UPDATE applications 
            SET status = 'rejected', updated_at = %s
            WHERE id = %s
        """, (datetime.now(), application_id))
        
        if cursor.rowcount == 0:
            cursor.close()
            conn.close()
            return jsonify({'error': 'Application not found'}), 404
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({'message': 'Application rejected successfully'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/applications/dispatch', methods=['GET'])
def get_dispatch_applications():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        query = """
            SELECT a.id, a.application_number, a.full_names, a.application_type, 
                   a.generated_id_number, a.created_at, a.updated_at, o.full_name as officer_name
            FROM applications a
            LEFT JOIN officers o ON a.officer_id = o.id
            WHERE a.status = 'ready_for_dispatch'
            ORDER BY a.updated_at DESC
        """
        
        cursor.execute(query)
        applications = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        return jsonify({'applications': applications}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/applications/preview', methods=['GET'])
def get_preview_applications():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        query = """
            SELECT a.id, a.application_number, a.full_names, a.application_type, 
                   a.generated_id_number, a.created_at, a.updated_at, o.full_name as officer_name
            FROM applications a
            LEFT JOIN officers o ON a.officer_id = o.id
            WHERE a.status = 'approved'
            ORDER BY a.updated_at DESC
        """
        
        cursor.execute(query)
        applications = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        return jsonify({'applications': applications}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/applications/<int:application_id>/print', methods=['PUT'])
def print_application(application_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Update application status to 'ready_for_dispatch' (printed, ready for dispatch)
        cursor.execute("""
            UPDATE applications 
            SET status = 'ready_for_dispatch', updated_at = %s
            WHERE id = %s AND status = 'approved'
        """, (datetime.now(), application_id))
        
        if cursor.rowcount == 0:
            cursor.close()
            conn.close()
            return jsonify({'error': 'Application not found or not in approved status'}), 404
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({'message': 'Application marked as printed successfully'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/applications/<int:application_id>/dispatch', methods=['PUT'])
def dispatch_application(application_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Update application status to dispatched
        cursor.execute("""
            UPDATE applications 
            SET status = 'dispatched', updated_at = %s
            WHERE id = %s AND status = 'ready_for_dispatch'
        """, (datetime.now(), application_id))
        
        if cursor.rowcount == 0:
            cursor.close()
            conn.close()
            return jsonify({'error': 'Application not found or not approved'}), 404
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({'message': 'Application dispatched successfully'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Officer Application Management Routes
@app.route('/api/officer/applications', methods=['GET'])
def get_officer_applications():
    try:
        # In a real app, get officer_id from JWT token
        officer_id = request.args.get('officer_id', 1)
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # First get the officer's constituency and station
        cursor.execute("SELECT station, constituency FROM officers WHERE id = %s", (officer_id,))
        officer_result = cursor.fetchone()
        
        if not officer_result:
            cursor.close()
            conn.close()
            return jsonify({'error': 'Officer not found'}), 404
        
        officer_station = (officer_result[0] or '').strip()
        officer_constituency = (officer_result[1] or '').strip()
        
        # Prefer constituency, but fall back to station if constituency is missing
        location_key = officer_constituency if officer_constituency else officer_station
        
        if not location_key:
            cursor.close()
            conn.close()
            return jsonify({'error': 'Officer has no constituency or station set'}), 400
        
        # Get all applications from the officer's constituency or ones processed by this officer
        cursor.execute("""
            SELECT id, application_number, full_names, status, created_at, 
                   updated_at, generated_id_number
            FROM applications 
            WHERE (TRIM(constituency) = %s OR officer_id = %s)
            ORDER BY created_at DESC
        """, (location_key, officer_id,))
        
        applications = []
        for row in cursor.fetchall():
            app = {
                'id': row[0],
                'application_number': row[1],
                'full_names': row[2],
                'status': row[3],
                'created_at': row[4].isoformat() if row[4] else None,
                'updated_at': row[5].isoformat() if row[5] else None,
                'generated_id_number': row[6]
            }
            applications.append(app)
        
        cursor.close()
        conn.close()
        
        return jsonify(applications), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/officer/applications/<int:application_id>/card-arrived', methods=['PUT'])
def mark_card_arrived(application_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            UPDATE applications 
            SET status = 'ready_for_collection', updated_at = %s 
            WHERE id = %s AND status = 'dispatched'
        """, (datetime.now(), application_id))
        
        if cursor.rowcount == 0:
            return jsonify({'error': 'Application not found or not in dispatched status'}), 404
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({'message': 'Card arrival confirmed'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/officer/applications/<int:application_id>/card-collected', methods=['PUT'])
def mark_card_collected(application_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            UPDATE applications 
            SET status = 'collected', updated_at = %s 
            WHERE id = %s AND (status = 'ready_for_collection' OR (status IN ('', 'dispatched') AND generated_id_number IS NOT NULL))
        """, (datetime.now(), application_id))
        
        if cursor.rowcount == 0:
            return jsonify({'error': 'Application not found or card not arrived yet'}), 404
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({'message': 'Card collection confirmed'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Lost ID Replacement Routes
@app.route('/api/applications/search-by-id/<id_number>', methods=['GET'])
def search_application_by_id(id_number):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute("""
            SELECT id, application_number, full_names, date_of_birth, gender,
                   generated_id_number, status, father_name, mother_name, 
                   home_district, district_of_birth, division, constituency,
                   location, sub_location, tribe, village_estate, marital_status, occupation
            FROM applications 
            WHERE generated_id_number = %s AND status IN ('approved', 'dispatched', 'ready_for_collection', 'collected')
        """, (id_number,))
        
        application = cursor.fetchone()
        cursor.close()
        conn.close()
        
        if not application:
            return jsonify({'error': 'ID not found or not issued yet'}), 404
        
        # Format date_of_birth properly for frontend consumption
        if application['date_of_birth'] and application['date_of_birth'] != '0000-00-00':
            try:
                if isinstance(application['date_of_birth'], str):
                    # If it's already a string, try to parse it
                    parsed_date = datetime.strptime(application['date_of_birth'], '%Y-%m-%d')
                else:
                    # If it's a date object, use it directly
                    parsed_date = application['date_of_birth']
                
                # Convert to YYYY-MM-DD format for consistent handling
                application['date_of_birth'] = parsed_date.strftime('%Y-%m-%d')
            except (ValueError, TypeError):
                print(f"Error formatting date_of_birth: {application['date_of_birth']}")
                application['date_of_birth'] = None
        else:
            application['date_of_birth'] = None
            
        return jsonify({'application': application}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/applications/lost-id', methods=['POST'])
def submit_lost_id_application():
    try:
        print("Received lost ID application request")
        
        # Handle form data with files
        data = request.form.to_dict()
        files = request.files
        print("Processing lost ID form data:", list(data.keys()) if data else "No data")
        print("Date of birth value:", data.get('date_of_birth'))
        print("Full names value:", data.get('full_names'))
        
        # Set up EAT timezone
        eat_tz = pytz.timezone('Africa/Nairobi')
        current_time = datetime.now(eat_tz)
        
        # Handle date_of_birth format - ensure it's properly formatted for MySQL
        date_of_birth = data.get('date_of_birth')
        print(f"Raw date_of_birth received: '{date_of_birth}' (type: {type(date_of_birth)})")
        
        if date_of_birth and date_of_birth != 'null' and date_of_birth != 'None' and str(date_of_birth).strip():
            try:
                # Try to parse different date formats
                if 'T' in str(date_of_birth):  # ISO format
                    parsed_date = datetime.fromisoformat(str(date_of_birth).replace('Z', '+00:00'))
                    date_of_birth = parsed_date.strftime('%Y-%m-%d')
                elif len(str(date_of_birth)) == 10 and str(date_of_birth).count('-') == 2:  # YYYY-MM-DD
                    # Validate the date format
                    datetime.strptime(str(date_of_birth), '%Y-%m-%d')
                    date_of_birth = str(date_of_birth)
                else:
                    print(f"Invalid date format: {date_of_birth}")
                    date_of_birth = None
            except (ValueError, TypeError) as e:
                print(f"Error parsing date_of_birth: {e}")
                date_of_birth = None
        else:
            print("Date of birth is null, empty, or invalid")
            date_of_birth = None
        
        print("Processed date of birth:", date_of_birth)
        
        # Validate required fields
        required_fields = ['existing_id_number', 'ob_number', 'full_names']
        missing_fields = [field for field in required_fields if not data.get(field)]
        if missing_fields:
            print("Missing required fields:", missing_fields)
            return jsonify({'error': f'Missing required fields: {", ".join(missing_fields)}'}), 400
        
        # Get officer ID from JWT token if provided; otherwise leave as NULL
        officer_id = None
        auth_header = request.headers.get('Authorization', '')
        if auth_header.startswith('Bearer '):
            try:
                token = auth_header.split(' ')[1]
                payload = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
                officer_id = payload.get('officer_id')
            except Exception as e:
                print('JWT decode failed in lost-id:', e)
        
        # Open DB connection
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Validate officer_id (must exist and be approved) or set to NULL
        if officer_id:
            cursor.execute("SELECT id FROM officers WHERE id = %s AND status = 'approved'", (officer_id,))
            if cursor.fetchone() is None:
                officer_id = None
        
        # Get current count for application number
        cursor.execute("SELECT COUNT(*) FROM applications WHERE application_type = 'renewal'")
        count = cursor.fetchone()[0]
        application_number = f"REP{datetime.now().year}{count + 1:06d}"
        
        print(f"Generated application number: {application_number}")
        
        # Insert lost ID application
        cursor.execute("""
            INSERT INTO applications (
                application_number, officer_id, application_type,
                full_names, date_of_birth, gender, father_name, mother_name, 
                marital_status, district_of_birth, tribe, home_district,
                division, constituency, location, sub_location, village_estate,
                occupation, existing_id_number, generated_id_number, renewal_reason, ob_number,
                status, created_at
            ) VALUES (
                %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
            )
        """, (
            application_number, officer_id, 'renewal',
            data['full_names'], date_of_birth, data.get('gender'),
            data.get('father_name'), data.get('mother_name'), data.get('marital_status'),
            data.get('district_of_birth'), data.get('tribe'), data.get('home_district'),
            data.get('division'), data.get('constituency'), data.get('location'),
            data.get('sub_location'), data.get('village_estate'), data.get('occupation'),
            data['existing_id_number'], None, 'lost', data['ob_number'],
            'submitted', current_time
        ))
        
        application_id = cursor.lastrowid
        
        # Handle file uploads
        upload_dir = 'uploads'
        os.makedirs(upload_dir, exist_ok=True)
        
        # Define expected files for lost ID applications
        file_mappings = {
            'ob_photo': 'ob_photo',
            'passport_photo': 'passport_photo', 
            'birth_certificate': 'birth_certificate'
        }
        
        for file_key, doc_type in file_mappings.items():
            if file_key in files and files[file_key].filename:
                file = files[file_key]
                # Create safe filename
                filename = f"{application_number}_{file_key}_{file.filename}"
                file_path = os.path.join(upload_dir, filename)
                file.save(file_path)
                
                # Insert document record - store only filename for URL serving
                cursor.execute("""
                    INSERT INTO documents (application_id, document_type, file_path)
                    VALUES (%s, %s, %s)
                """, (application_id, doc_type, filename))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({
            'message': 'Lost ID application submitted successfully',
            'applicationNumber': application_number,
            'applicationId': application_id
        }), 201
        
    except Exception as e:
        print(f"Error in lost ID application: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/payments', methods=['POST'])
def submit_payment():
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['application_id', 'amount', 'payment_method']
        if data.get('payment_method') == 'mpesa':
            required_fields.append('phone_number')
        
        missing_fields = [field for field in required_fields if not data.get(field)]
        if missing_fields:
            return jsonify({'error': f'Missing required fields: {", ".join(missing_fields)}'}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Insert payment record
        cursor.execute("""
            INSERT INTO payments (application_id, amount, payment_method, status, created_at)
            VALUES (%s, %s, %s, %s, %s)
        """, (
            data['application_id'], data['amount'], data['payment_method'], 
            'pending', datetime.now()
        ))
        
        payment_id = cursor.lastrowid
        conn.commit()
        
        # Handle M-Pesa payment
        if data['payment_method'] == 'mpesa':
            phone_number = data['phone_number']
            print(f"Processing M-Pesa payment for phone: {phone_number}")
            
            # Format phone number (remove leading 0 and add 254)
            if phone_number.startswith('0'):
                phone_number = '254' + phone_number[1:]
            elif not phone_number.startswith('254'):
                phone_number = '254' + phone_number
            
            print(f"Formatted phone number: {phone_number}")
            
            # Get application details for reference
            cursor.execute("SELECT application_number FROM applications WHERE id = %s", (data['application_id'],))
            app_result = cursor.fetchone()
            account_reference = app_result[0] if app_result else f"APP{data['application_id']}"
            
            print(f"Account reference: {account_reference}")
            
            # Initiate STK push
            stk_response = initiate_stk_push(
                phone_number, 
                int(data['amount']), 
                account_reference,
                "ID Renewal Payment"
            )
            
            print(f"STK push response: {stk_response}")
            
            # Check if STK push was successful
            if stk_response.get('CheckoutRequestID'):
                cursor.execute("""
                    UPDATE payments SET mpesa_checkout_id = %s WHERE id = %s
                """, (stk_response['CheckoutRequestID'], payment_id))
                conn.commit()
                print(f"Updated payment {payment_id} with checkout ID: {stk_response['CheckoutRequestID']}")
            else:
                # STK push failed
                print(f"STK push failed: {stk_response}")
                cursor.execute("""
                    UPDATE payments SET status = 'failed' WHERE id = %s
                """, (payment_id,))
                conn.commit()
                cursor.close()
                conn.close()
                return jsonify({
                    'error': f"M-Pesa payment failed: {stk_response.get('error', 'Unknown error')}",
                    'details': stk_response
                }), 400
        
        cursor.close()
        conn.close()
        
        return jsonify({
            'message': 'Payment initiated successfully',
            'paymentId': payment_id,
            'mpesa_response': stk_response if data['payment_method'] == 'mpesa' else None
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/mpesa/callback', methods=['POST'])
def mpesa_callback():
    """Handle M-Pesa callback"""
    try:
        data = request.get_json()
        
        # Extract callback data
        stk_callback = data.get('Body', {}).get('stkCallback', {})
        checkout_request_id = stk_callback.get('CheckoutRequestID')
        result_code = stk_callback.get('ResultCode')
        
        if checkout_request_id:
            conn = get_db_connection()
            cursor = conn.cursor()
            
            # Update payment status based on result
            if result_code == 0:  # Success
                # Extract transaction details
                callback_metadata = stk_callback.get('CallbackMetadata', {}).get('Item', [])
                mpesa_receipt_number = None
                for item in callback_metadata:
                    if item.get('Name') == 'MpesaReceiptNumber':
                        mpesa_receipt_number = item.get('Value')
                        break
                
                # Update payment and application status
                cursor.execute("""
                    UPDATE payments 
                    SET status = 'completed', mpesa_receipt = %s, updated_at = %s
                    WHERE mpesa_checkout_id = %s
                """, (mpesa_receipt_number, datetime.now(), checkout_request_id))
                
                # Get application ID to update status
                cursor.execute("SELECT application_id FROM payments WHERE mpesa_checkout_id = %s", (checkout_request_id,))
                payment_result = cursor.fetchone()
                
                if payment_result:
                    application_id = payment_result[0]
                    cursor.execute("""
                        UPDATE applications 
                        SET status = 'submitted', updated_at = %s
                        WHERE id = %s
                    """, (datetime.now(), application_id))
            else:
                # Payment failed
                cursor.execute("""
                    UPDATE payments 
                    SET status = 'failed', updated_at = %s
                    WHERE mpesa_checkout_id = %s
                """, (datetime.now(), checkout_request_id))
            
            conn.commit()
            cursor.close()
            conn.close()
        
        return jsonify({'ResultCode': 0, 'ResultDesc': 'Success'}), 200
        
    except Exception as e:
        print(f"M-Pesa callback error: {str(e)}")
        return jsonify({'ResultCode': 1, 'ResultDesc': 'Error'}), 500

@app.route('/api/applications/<int:application_id>/submit-for-approval', methods=['PUT'])
def submit_for_approval(application_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Update application status to indicate it's submitted for approval
        cursor.execute("""
            UPDATE applications 
            SET status = 'submitted', updated_at = %s
            WHERE id = %s
        """, (datetime.now(), application_id))
        
        if cursor.rowcount == 0:
            cursor.close()
            conn.close()
            return jsonify({'error': 'Application not found'}), 404
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({'message': 'Application submitted for approval'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/officers/<int:officer_id>/suspend', methods=['PUT'])
def suspend_officer(officer_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("UPDATE officers SET status = 'suspended' WHERE id = %s", (officer_id,))
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({'message': 'Officer suspended successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/officers/<int:officer_id>/unsuspend', methods=['PUT'])
def unsuspend_officer(officer_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("UPDATE officers SET status = 'approved' WHERE id = %s", (officer_id,))
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({'message': 'Officer unsuspended successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/officers/<int:officer_id>', methods=['DELETE'])
def delete_officer(officer_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM officers WHERE id = %s", (officer_id,))
        if cursor.rowcount == 0:
            cursor.close()
            conn.close()
            return jsonify({'error': 'Officer not found'}), 404
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({'message': 'Officer deleted successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# File serving route
@app.route('/uploads/<filename>')
def serve_uploaded_file(filename):
    try:
        return send_from_directory('uploads', filename)
    except Exception as e:
        return jsonify({'error': 'File not found'}), 404

# Reports endpoints
@app.route('/api/admin/reports', methods=['GET'])
def get_admin_reports():
    try:
        # Get query parameters
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        status = request.args.get('status', 'all')
        report_type = request.args.get('report_type', 'applications')
        constituency = request.args.get('constituency', 'all')
        
        if not start_date or not end_date:
            return jsonify({'error': 'Start date and end date are required'}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Base query
        base_query = '''
            SELECT a.id, a.application_number, a.full_names, a.status, 
                   a.application_type, a.created_at, a.updated_at, 
                   o.full_name as officer_name, a.generated_id_number
            FROM applications a
            LEFT JOIN officers o ON a.officer_id = o.id
            WHERE DATE(a.created_at) BETWEEN %s AND %s
        '''
        
        params = [start_date, end_date]
        
        # Add status filter if not 'all'
        if status != 'all':
            base_query += ' AND a.status = %s'
            params.append(status)
        
        # Add constituency filter if not 'all'
        if constituency != 'all':
            base_query += ' AND a.constituency = %s'
            params.append(constituency)
        
        # Add report type filter
        if report_type == 'renewals':
            base_query += ' AND a.application_type = %s'
            params.append('renewal')
        elif report_type == 'new_applications':
            base_query += ' AND a.application_type = %s'
            params.append('new')
        
        base_query += ' ORDER BY a.created_at DESC'
        
        cursor.execute(base_query, params)
        applications = cursor.fetchall()
        
        # Get statistics
        stats_query = '''
            SELECT 
                COUNT(*) as total,
                COUNT(CASE WHEN status = 'submitted' THEN 1 END) as pending,
                COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved,
                COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected,
                COUNT(CASE WHEN status = 'dispatched' THEN 1 END) as dispatched,
                COUNT(CASE WHEN status = 'collected' THEN 1 END) as collected
            FROM applications
            WHERE DATE(created_at) BETWEEN %s AND %s
        '''
        
        stats_params = [start_date, end_date]
        
        if status != 'all':
            stats_query += ' AND status = %s'
            stats_params.append(status)
        
        if constituency != 'all':
            stats_query += ' AND constituency = %s'
            stats_params.append(constituency)
            
        if report_type == 'renewals':
            stats_query += ' AND application_type = %s'
            stats_params.append('renewal')
        elif report_type == 'new_applications':
            stats_query += ' AND application_type = %s'
            stats_params.append('new')
        
        cursor.execute(stats_query, stats_params)
        stats = cursor.fetchone()
        
        cursor.close()
        conn.close()
        
        # Convert applications to list of dictionaries
        application_list = []
        for app in applications:
            if report_type == 'officers_by_constituency':
                # Special handling for officers report - different column structure
                application_list.append({
                    'id': app[3],  # o.id
                    'application_number': app[0],  # o.station (station)
                    'full_names': app[1],  # o.full_name (officer name)
                    'status': app[2],  # o.status (officer status)
                    'application_type': app[8],  # 'officer_report'
                    'created_at': app[9].isoformat() if app[9] else None,
                    'updated_at': app[10].isoformat() if app[10] else None,
                    'officer_name': app[1],  # o.full_name
                    'generated_id_number': app[7]  # o.id_number
                })
            else:
                # Standard application structure
                application_list.append({
                    'id': app[0],
                    'application_number': app[1],
                    'full_names': app[2],
                    'status': app[3],
                    'application_type': app[4],
                    'created_at': app[5].isoformat() if app[5] else None,
                    'updated_at': app[6].isoformat() if app[6] else None,
                    'officer_name': app[7] or 'N/A',
                    'generated_id_number': app[8]
                })
        
        return jsonify({
            'applications': application_list,
            'stats': {
                'total': stats[0] or 0,
                'pending': stats[1] or 0,
                'approved': stats[2] or 0,
                'rejected': stats[3] or 0,
                'dispatched': stats[4] or 0,
                'collected': stats[5] or 0
            }
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/reports/export', methods=['GET'])
def export_admin_reports():
    try:
        # Get query parameters
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        status = request.args.get('status', 'all')
        report_type = request.args.get('report_type', 'applications')
        constituency = request.args.get('constituency', 'all')
        export_format = request.args.get('format', 'csv')
        
        if not start_date or not end_date:
            return jsonify({'error': 'Start date and end date are required'}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Same query as the reports endpoint
        base_query = '''
            SELECT a.application_number, a.full_names, a.status, 
                   a.application_type, a.created_at, 
                   o.full_name as officer_name, a.generated_id_number
            FROM applications a
            LEFT JOIN officers o ON a.officer_id = o.id
            WHERE DATE(a.created_at) BETWEEN %s AND %s
        '''
        
        params = [start_date, end_date]
        
        if status != 'all':
            base_query += ' AND a.status = %s'
            params.append(status)
        
        if constituency != 'all':
            base_query += ' AND a.constituency = %s'
            params.append(constituency)
        
        if report_type == 'renewals':
            base_query += ' AND a.application_type = %s'
            params.append('renewal')
        elif report_type == 'new_applications':
            base_query += ' AND a.application_type = %s'
            params.append('new')
        
        base_query += ' ORDER BY a.created_at DESC'
        
        cursor.execute(base_query, params)
        applications = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        if export_format == 'csv':
            import io
            import csv
            
            output = io.StringIO()
            writer = csv.writer(output)
            
            # Write header
            writer.writerow([
                'Application Number', 'Applicant Name', 'Status', 
                'Application Type', 'Created Date', 'Officer Name', 'ID Number'
            ])
            
            # Write data
            for app in applications:
                writer.writerow([
                    app[0], app[1], app[2], app[3], 
                    app[4].strftime('%Y-%m-%d %H:%M:%S') if app[4] else '',
                    app[5] or 'N/A', app[6] or 'N/A'
                ])
            
            output.seek(0)
            
            return Response(
                output.getvalue(),
                mimetype='text/csv',
                headers={'Content-Disposition': f'attachment; filename={report_type}_report_{start_date}_to_{end_date}.csv'}
            )
        
        elif export_format == 'pdf':
            from reportlab.lib.pagesizes import letter, A4
            from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
            from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
            from reportlab.lib import colors
            from reportlab.lib.units import inch
            import io
            
            # Create PDF buffer
            buffer = io.BytesIO()
            
            # Create PDF document
            doc = SimpleDocTemplate(buffer, pagesize=A4)
            elements = []
            
            # Get styles
            styles = getSampleStyleSheet()
            title_style = ParagraphStyle(
                'CustomTitle',
                parent=styles['Heading1'],
                fontSize=16,
                spaceAfter=30,
                alignment=1  # Center alignment
            )
            
            # Add title
            title_text = f"{report_type.replace('_', ' ').title()} Report"
            if status != 'all':
                title_text += f" - {status.title()} Status"
            if constituency != 'all':
                title_text += f" - {constituency}"
            title_text += f"<br/>Period: {start_date} to {end_date}"
            
            title = Paragraph(title_text, title_style)
            elements.append(title)
            elements.append(Spacer(1, 20))
            
            # Prepare table data
            table_data = [
                ['Application #', 'Applicant Name', 'Status', 'Type', 'Date', 'Officer', 'ID Number']
            ]
            
            for app in applications:
                table_data.append([
                    app[0] or 'N/A',  # application_number
                    app[1] or 'N/A',  # full_names
                    app[2].upper() if app[2] else 'N/A',  # status
                    app[3].replace('_', ' ').title() if app[3] else 'N/A',  # application_type
                    app[4].strftime('%Y-%m-%d') if app[4] else 'N/A',  # created_at
                    app[5] or 'N/A',  # officer_name
                    app[6] or 'N/A'   # generated_id_number
                ])
            
            # Create table
            table = Table(table_data, colWidths=[1.0*inch, 1.5*inch, 0.8*inch, 1.0*inch, 0.8*inch, 1.2*inch, 1.0*inch])
            
            # Style the table
            table.setStyle(TableStyle([
                # Header row styling
                ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 10),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                
                # Data rows styling
                ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 1), (-1, -1), 8),
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                
                # Alternating row colors
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.lightgrey]),
            ]))
            
            elements.append(table)
            
            # Add summary statistics
            elements.append(Spacer(1, 30))
            summary_style = ParagraphStyle(
                'Summary',
                parent=styles['Normal'],
                fontSize=10,
                spaceAfter=6
            )
            
            # Get stats for summary - use same filters as main query
            stats_query = '''
                SELECT 
                    COUNT(*) as total,
                    COUNT(CASE WHEN status = 'submitted' THEN 1 END) as pending,
                    COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved,
                    COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected,
                    COUNT(CASE WHEN status = 'dispatched' THEN 1 END) as dispatched,
                    COUNT(CASE WHEN status = 'collected' THEN 1 END) as collected
                FROM applications
                WHERE DATE(created_at) BETWEEN %s AND %s
            '''
            
            stats_params = [start_date, end_date]
            
            # Apply same filters as main report query
            if status != 'all':
                stats_query += ' AND status = %s'
                stats_params.append(status)
            
            if constituency != 'all':
                stats_query += ' AND constituency = %s'
                stats_params.append(constituency)
                
            if report_type == 'renewals':
                stats_query += ' AND application_type = %s'
                stats_params.append('renewal')
            elif report_type == 'new_applications':
                stats_query += ' AND application_type = %s'
                stats_params.append('new')
            
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute(stats_query, stats_params)
            stats = cursor.fetchone()
            cursor.close()
            conn.close()
            
            summary_title = Paragraph("<b>Report Summary:</b>", summary_style)
            elements.append(summary_title)
            
            summary_data = [
                ['Metric', 'Count'],
                ['Total Applications', str(stats[0] or 0)],
                ['Pending', str(stats[1] or 0)],
                ['Approved', str(stats[2] or 0)],
                ['Rejected', str(stats[3] or 0)],
                ['Dispatched', str(stats[4] or 0)],
                ['Collected', str(stats[5] or 0)]
            ]
            
            summary_table = Table(summary_data, colWidths=[2*inch, 1*inch])
            summary_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.lightblue),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.black),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 0), (-1, -1), 10),
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ]))
            
            elements.append(summary_table)
            
            # Add footer with generation timestamp
            elements.append(Spacer(1, 20))
            footer_text = f"Report generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
            footer = Paragraph(footer_text, styles['Normal'])
            elements.append(footer)
            
            # Build PDF
            doc.build(elements)
            
            # Get PDF content
            buffer.seek(0)
            pdf_content = buffer.getvalue()
            buffer.close()
            
            return Response(
                pdf_content,
                mimetype='application/pdf',
                headers={'Content-Disposition': f'attachment; filename={report_type}_report_{start_date}_to_{end_date}.pdf'}
            )
        
        else:
            return jsonify({'error': 'Invalid export format. Use csv or pdf.'}), 400
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='localhost', port=5000)
