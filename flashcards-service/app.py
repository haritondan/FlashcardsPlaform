from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from db import db

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://admin:password@flashcardsdb:5432/flashcardsdb'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)


db.init_app(app)

from routes import flashcards_bp
app.register_blueprint(flashcards_bp)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001)
