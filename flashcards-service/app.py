from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from db import db
from flask_jwt_extended import JWTManager
from datetime import timedelta
from routes import flashcards_bp

ACCESS_EXPIRES = timedelta(minutes=15)

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://admin:password@flashcards-db:5432/flashcardsdb'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

app.config["JWT_SECRET_KEY"] = "super-secret"  
app.config["JWT_TOKEN_LOCATION"] = ["headers"]  
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = ACCESS_EXPIRES

jwt = JWTManager(app)
db.init_app(app)

app.register_blueprint(flashcards_bp)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001)
