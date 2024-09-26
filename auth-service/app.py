from flask import Flask
from flask_jwt_extended import JWTManager
from datetime import timedelta
from db import db  # Import db from db.py
from routes import auth_bp

# Constants
ACCESS_EXPIRES = timedelta(minutes=15)

# Initialize the Flask app
app = Flask(__name__)

# Database configuration
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://admin:password@auth-db:5432/authdb'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# JWT configuration
app.config["JWT_SECRET_KEY"] = "super-secret"
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = ACCESS_EXPIRES

# Initialize extensions
db.init_app(app)  # Initialize the db with the app
jwt = JWTManager(app)

# Register blueprints (routes)
app.register_blueprint(auth_bp)

# Run the app
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
