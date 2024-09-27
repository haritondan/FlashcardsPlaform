from db import db
from datetime import datetime

class FlashcardSet(db.Model):
    __tablename__ = 'flashcard_sets'

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    subject = db.Column(db.String(255), nullable=False)
    creator_id = db.Column(db.Integer, nullable=False) 
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(datetime.timezone.utc))
    
    # Relationship with Flashcards
    flashcards = db.relationship('Flashcard', backref='flashcard_set', lazy=True, cascade="all, delete-orphan")
