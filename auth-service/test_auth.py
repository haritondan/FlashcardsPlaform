import pytest
from flask import Flask
from flask_jwt_extended import JWTManager
from db import db
from routes import auth_bp

# Define a test configuration for the Flask app
@pytest.fixture
def app():
    app = Flask(__name__)

    # Configure in-memory SQLite for testing
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['JWT_SECRET_KEY'] = 'super-secret'

    # Initialize the database and JWT manager
    db.init_app(app)
    jwt = JWTManager(app)

    # Register blueprints (routes)
    app.register_blueprint(auth_bp)

    # Create the in-memory database
    with app.app_context():
        db.create_all()

    yield app

    # Clean up the database after the test
    with app.app_context():
        db.drop_all()

# Create a test client fixture
@pytest.fixture
def client(app):
    return app.test_client()

def test_register_user(client):
    # Simulate a POST request to register a user
    response = client.post('/api/auth/register', json={
        'username': 'testuser',
        'email': 'testuser@example.com',
        'password': 'password123'
    })

    assert response.status_code == 201
    assert response.get_json()['message'] == 'User registered successfully'

    # Test duplicate username
    response = client.post('/api/auth/register', json={
        'username': 'testuser',
        'email': 'testuser2@example.com',
        'password': 'password123'
    })

    assert response.status_code == 400
    assert response.get_json()['message'] == 'Username already exists'

    # Test duplicate email
    response = client.post('/api/auth/register', json={
        'username': 'testuser2',
        'email': 'testuser@example.com',
        'password': 'password123'
    })

    assert response.status_code == 400
    assert response.get_json()['message'] == 'Email already exists'

def test_login_user(client):
    # First, register the user
    client.post('/api/auth/register', json={
        'username': 'testuser',
        'email': 'testuser@example.com',
        'password': 'password123'
    })

    # Now, test logging in with correct credentials
    response = client.post('/api/auth/login', json={
        'email': 'testuser@example.com',
        'password': 'password123'
    })

    assert response.status_code == 200
    assert 'access_token' in response.get_json()

    # Test invalid credentials
    response = client.post('/api/auth/login', json={
        'email': 'testuser@example.com',
        'password': 'wrongpassword'
    })

    assert response.status_code == 401
    assert response.get_json()['message'] == 'Invalid email or password'

def test_status(client):
    # Test if the service status endpoint works
    response = client.get('/api/auth/status')

    assert response.status_code == 200
    assert response.get_json()['servise'] == 'auth'
    assert response.get_json()['status'] == 'running'

def test_get_all_users(client):
    # Register a user first
    client.post('/api/auth/register', json={
        'username': 'testuser',
        'email': 'testuser@example.com',
        'password': 'password123'
    })

    # Get the list of users
    response = client.get('/api/auth/users')

    assert response.status_code == 200
    users = response.get_json()
    assert len(users) == 1
    assert users[0]['username'] == 'testuser'
    assert users[0]['email'] == 'testuser@example.com'

def test_logout_user(client):
    # First, register and login to get the JWT token
    client.post('/api/auth/register', json={
        'username': 'testuser',
        'email': 'testuser@example.com',
        'password': 'password123'
    })

    login_response = client.post('/api/auth/login', json={
        'email': 'testuser@example.com',
        'password': 'password123'
    })

    # Extract the JWT token from the login response
    access_token = login_response.get_json()['access_token']
    
    # Now, log out using the token
    response = client.post('/api/auth/logout', headers={
        'Authorization': f'Bearer {access_token}'
    })

    assert response.status_code == 200
    assert response.get_json()['message'] == 'User logged out'

def test_update_user(client):
    # First, register and login to get the JWT token
    client.post('/api/auth/register', json={
        'username': 'testuser',
        'email': 'testuser@example.com',
        'password': 'password123'
    })

    login_response = client.post('/api/auth/login', json={
        'email': 'testuser@example.com',
        'password': 'password123'
    })

    # Extract the JWT token from the login response
    access_token = login_response.get_json()['access_token']

    # Update the user's username
    response = client.put('/api/auth/users/1', json={
        'username': 'updateduser',
        'email': 'updateduser@example.com'
    }, headers={
        'Authorization': f'Bearer {access_token}'
    })

    assert response.status_code == 200
    assert response.get_json()['message'] == 'User updated successfully'

    # Confirm the update by fetching all users
    users_response = client.get('/api/auth/users')
    users = users_response.get_json()

    assert users[0]['username'] == 'updateduser'
    assert users[0]['email'] == 'updateduser@example.com'

