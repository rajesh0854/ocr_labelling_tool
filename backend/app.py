from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
import datetime
import os
import json
from functools import wraps
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app, resources={
    r"/api/*": {"origins": os.getenv('ALLOWED_ORIGINS', 'http://localhost:3000').split(',')},
    r"/images/*": {"origins": os.getenv('ALLOWED_ORIGINS', 'http://localhost:3000').split(',')}
})
app.config['SECRET_KEY'] = os.getenv('FLASK_SECRET_KEY', 'your-secret-key')

# Get the absolute path of the current directory
BASE_DIR = os.path.abspath(os.path.dirname(__file__))

# Create images directory if it doesn't exist
IMAGES_DIR = os.path.join(BASE_DIR, os.getenv('IMAGES_DIR', 'images'))
os.makedirs(IMAGES_DIR, exist_ok=True)

# Load config from JSON file or create a default one if it doesn't exist
CONFIG_FILE = os.path.join(BASE_DIR, 'config.json')

# Default configuration with users and their batches
default_config = {
    "users": [
        {
            "username": "user1",
            "password": "user1",
            "batch_id": "batch1",
            "batch_folder": "batch1"
        },
        {
            "username": "user2",
            "password": "user2",
            "batch_id": "batch2", 
            "batch_folder": "batch2"
        },
        {
            "username": "user3",
            "password": "user3",
            "batch_id": "batch3",
            "batch_folder": "batch3"
        },
        {
            "username": "user4",
            "password": "user4",
            "batch_id": "batch4",
            "batch_folder": "batch4"
        }
    ]
}

# Create or load the config file
if not os.path.exists(CONFIG_FILE):
    with open(CONFIG_FILE, 'w') as f:
        json.dump(default_config, f, indent=2)
    config = default_config
else:
    with open(CONFIG_FILE, 'r') as f:
        config = json.load(f)

# Create user lookup dictionaries for faster access
users = {}
batch_mappings = {}

# Process configuration to build lookup dictionaries
for user_config in config["users"]:
    username = user_config["username"]
    is_admin = user_config.get("is_admin", False)
    
    # Create user entry
    users[username] = {
        "password": generate_password_hash(user_config["password"]),
        "is_admin": is_admin,
        "role": user_config.get("role", "annotator"),
        "batches": [user_config["batch_id"]] if "batch_id" in user_config else []
    }
    
    # Skip batch creation for admin users
    if is_admin:
        continue
        
    # Create batch entry
    batch_id = user_config["batch_id"]
    batch_folder = user_config["batch_folder"]
    batch_folder_path = os.path.join(IMAGES_DIR, batch_folder)
    os.makedirs(batch_folder_path, exist_ok=True)
    
    if batch_id not in batch_mappings:
        batch_mappings[batch_id] = {
            "folder_path": batch_folder_path,
            "users": [username]
        }
    else:
        batch_mappings[batch_id]["users"].append(username)

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'message': 'Token is missing'}), 401
        try:
            data = jwt.decode(token.split(" ")[1], app.config['SECRET_KEY'], algorithms=["HS256"])
            current_user = data['username']
        except:
            return jsonify({'message': 'Token is invalid'}), 401
        return f(current_user, *args, **kwargs)
    return decorated

@app.route('/api/login', methods=['POST'])
def login():
    auth = request.json
    if not auth or not auth.get('username') or not auth.get('password'):
        return jsonify({'message': 'Could not verify'}), 401

    if auth['username'] not in users:
        return jsonify({'message': 'User not found'}), 404

    if check_password_hash(users[auth['username']]['password'], auth['password']):
        token = jwt.encode({
            'username': auth['username'],
            'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24),
            'is_admin': users[auth['username']].get('is_admin', False),
            'role': users[auth['username']].get('role', 'annotator')
        }, app.config['SECRET_KEY'])
        
        return jsonify({
            'token': token,
            'username': auth['username'],
            'batches': users[auth['username']]['batches'],
            'is_admin': users[auth['username']].get('is_admin', False),
            'role': users[auth['username']].get('role', 'annotator')
        })

    return jsonify({'message': 'Invalid credentials'}), 401

@app.route('/api/images/<batch_id>', methods=['GET'])
@token_required
def get_batch_images(current_user, batch_id):
    if batch_id not in batch_mappings or current_user not in batch_mappings[batch_id]['users']:
        return jsonify({'message': 'Unauthorized access to batch'}), 403

    folder_path = batch_mappings[batch_id]['folder_path']
    label_file = os.path.join(folder_path, 'labels.json')
    
    # Load existing labels
    labels = {}
    if os.path.exists(label_file):
        with open(label_file, 'r') as f:
            labels = json.load(f)

    # Get all images in the batch
    images = []
    if os.path.exists(folder_path):
        for file in os.listdir(folder_path):
            if file.lower().endswith(('.png', '.jpg', '.jpeg')):
                images.append({
                    'name': file,
                    'labeled': file in labels
                })

    return jsonify({
        'images': images,
        'labels': labels
    })

@app.route('/api/labels/<batch_id>', methods=['POST'])
@token_required
def save_label(current_user, batch_id):
    if batch_id not in batch_mappings or current_user not in batch_mappings[batch_id]['users']:
        return jsonify({'message': 'Unauthorized access to batch'}), 403

    data = request.json
    image_name = data.get('image_name')
    label_text = data.get('label_text')

    if not image_name or not label_text:
        return jsonify({'message': 'Missing required fields'}), 400

    folder_path = batch_mappings[batch_id]['folder_path']
    label_file = os.path.join(folder_path, 'labels.json')

    # Load existing labels
    labels = {}
    if os.path.exists(label_file):
        with open(label_file, 'r') as f:
            labels = json.load(f)

    # Update label
    labels[image_name] = {
        'text': label_text,
        'updated_by': current_user,
        'updated_at': datetime.datetime.utcnow().isoformat()
    }

    # Save labels - ensure directory exists
    os.makedirs(os.path.dirname(label_file), exist_ok=True)
    with open(label_file, 'w') as f:
        json.dump(labels, f, indent=2)

    return jsonify({'message': 'Label saved successfully'})

@app.route('/images/<batch_id>/<path:filename>')
def serve_image(batch_id, filename):
    token = request.args.get('token')
    if not token:
        return jsonify({'message': 'Token is missing'}), 401
    
    try:
        data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
        current_user = data['username']
    except Exception as e:
        app.logger.error(f"Token decode error: {str(e)}")
        return jsonify({'message': 'Token is invalid'}), 401

    if batch_id not in batch_mappings or current_user not in batch_mappings[batch_id]['users']:
        return jsonify({'message': 'Unauthorized access to image'}), 403
    
    folder_path = batch_mappings[batch_id]['folder_path']
    try:
        app.logger.info(f"Serving image from {folder_path}, filename: {filename}")
        return send_from_directory(folder_path, filename)
    except FileNotFoundError as e:
        app.logger.error(f"File not found: {os.path.join(folder_path, filename)}")
        return jsonify({'message': 'Image not found'}), 404
    except Exception as e:
        app.logger.error(f"Error serving image: {str(e)}")
        return jsonify({'message': 'Error serving image'}), 500

# API endpoint to get configuration (for admin purposes)
@app.route('/api/config', methods=['GET'])
def get_config():
    # In production, add authentication for this endpoint
    return jsonify(config)

# Admin API: Get all users' progress
@app.route('/api/admin/progress', methods=['GET'])
@token_required
def get_all_progress(current_user):
    # Check if user is admin
    if not users.get(current_user, {}).get('is_admin', False):
        return jsonify({'message': 'Unauthorized access'}), 403
    
    # Get progress for all batches
    progress_data = []
    
    for batch_id, batch_info in batch_mappings.items():
        folder_path = batch_info['folder_path']
        label_file = os.path.join(folder_path, 'labels.json')
        
        # Count total images in the batch
        total_images = 0
        valid_labeled = 0
        invalid_marked = 0
        
        # Get all images in the batch
        image_files = []
        if os.path.exists(folder_path):
            for file in os.listdir(folder_path):
                if file.lower().endswith(('.png', '.jpg', '.jpeg')):
                    total_images += 1
                    image_files.append(file)
        
        # Load existing labels
        labels = {}
        if os.path.exists(label_file):
            with open(label_file, 'r') as f:
                labels = json.load(f)
                
        # Count labeled images
        labeled_count = len(labels)
        
        # Count valid vs invalid
        for image_name, label_info in labels.items():
            if label_info.get('text') == 'INVALID':
                invalid_marked += 1
            else:
                valid_labeled += 1
                
        # Find the user assigned to this batch
        assigned_users = batch_info['users']
        
        # Create progress entry
        for user in assigned_users:
            progress_data.append({
                'user': user,
                'batch_id': batch_id,
                'total_images': total_images,
                'labeled_count': labeled_count,
                'valid_labeled': valid_labeled,
                'invalid_marked': invalid_marked,
                'completion_percentage': (labeled_count / total_images * 100) if total_images > 0 else 0,
                'last_update': max([label_info.get('updated_at', '2000-01-01') for label_info in labels.values()]) if labels else None
            })
    
    return jsonify({
        'progress': progress_data
    })

if __name__ == '__main__':
    host = os.getenv('FLASK_HOST', '0.0.0.0')
    port = int(os.getenv('FLASK_PORT', 5000))
    debug = os.getenv('FLASK_DEBUG', 'False').lower() in ('true', '1', 't')
    
    app.run(host=host, port=port, debug=debug) 