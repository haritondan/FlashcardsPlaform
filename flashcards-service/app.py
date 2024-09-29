from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from db import db
from routes import flashcards_bp

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://admin:password@flashcards-db:5432/flashcardsdb'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)

app.register_blueprint(flashcards_bp)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001)
