from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from models.user import User
from sqlalchemy import text
from db import db 

auth_bp = Blueprint('auth', __name__)

# Register a user
@auth_bp.route('/api/auth/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    email = data.get('email')
    password = data.get('password') 

    # Check if username or email already exists
    if User.query.filter_by(username=username).first():
        return jsonify({'message': 'Username already exists'}), 400
    if User.query.filter_by(email=email).first():
        return jsonify({'message': 'Email already exists'}), 400

    # Create new user
    new_user = User(username=username, email=email, password=password)
    db.session.add(new_user)
    db.session.commit()

    return jsonify({'message': 'User registered successfully'}), 201

# Log in a user
@auth_bp.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    user = User.query.filter_by(email=email).first()

    if user and user.password == password:
        # Create JWT token
        access_token = create_access_token(identity=user.id)
        return jsonify({'message': 'Login successful', 'access_token': access_token, 'user': user.username}), 200
    else:
        return jsonify({'message': 'Invalid email or password'}), 401

# Log out a user (dummy route, no JWT revocation here)
@auth_bp.route('/api/auth/logout', methods=['POST'])
@jwt_required()
def logout():
    return jsonify({'message': 'User logged out'}), 200

# Status endpoint
@auth_bp.route('/api/auth/status', methods=['GET'])
def status():
    try:
        db.session.execute(text('SELECT 1'))  
        return jsonify({'servise': 'auth','status': 'running'}), 200
    except Exception as e:
        return jsonify({'status': 'ERROR', 'database': 'Not connected', 'error': str(e)}), 500

# Get all users
@auth_bp.route('/api/auth/users', methods=['GET'])
def get_all_users():
    users = User.query.all()
    user_list = [{'id': user.id, 'username': user.username, 'email': user.email} for user in users]
    return jsonify(user_list), 200

# Update a user
@auth_bp.route('/api/auth/users/<int:id>', methods=['PUT'])
@jwt_required()
def update_user(id):
    data = request.get_json()
    user = User.query.get(id)

    if not user:
        return jsonify({'message': 'User not found'}), 404

    if 'username' in data:
        user.username = data['username']
    if 'email' in data:
        user.email = data['email']
    if 'password' in data:
        user.password = data['password']  # In a real-world app, hash this

    db.session.commit()
    return jsonify({'message': 'User updated successfully'}), 200



# @auth_bp.route('/api/auth/users/<int:user_id>', methods=['DELETE'])
# @jwt_required()
# def delete_user(user_id):
#     user = User.query.get_or_404(user_id)
#     db.session.delete(user)
#     db.session.commit()
#     return jsonify({'message': 'User deleted successfully'}), 200