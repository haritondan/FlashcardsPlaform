import json
import redis, time
from flask import Blueprint, request, jsonify
from db import db
from models.flashcard_set import FlashcardSet
from models.flashcard import Flashcard
from sqlalchemy import text
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask_limiter import Limiter  
from flask_limiter.util import get_remote_address
import threading
import uuid
from models.transaction import Transaction

max_concurrent_tasks = 10
semaphore = threading.BoundedSemaphore(value=max_concurrent_tasks)


flashcards_bp = Blueprint('flashcards_bp', __name__)

limiter = Limiter(get_remote_address)

cache = redis.Redis(host='redis', port=6379, decode_responses=True)
CACHE_KEY_PREFIX = 'flashcard_set_'



@flashcards_bp.route("/api/flashcards/prepare", methods=["POST"])
def prepare():
    transaction_id = request.json.get("transaction_id")
    data = request.json.get("data")

    try:
        # Create and save transaction as "prepared"
        transaction = Transaction(transaction_id=transaction_id, status="prepared", data=data)
        db.session.add(transaction)
        db.session.commit()

        return jsonify({"transaction_id": transaction_id, "status": "prepared"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@flashcards_bp.route("/api/flashcards/commit", methods=["POST"])
def commit():
    transaction_id = request.json.get("transaction_id")

    try:
        transaction = Transaction.query.get(transaction_id)
        if transaction and transaction.status == "prepared":
            # Update status to "committed"
            transaction.status = "committed"
            db.session.commit()
            return jsonify({"status": "committed"}), 200
        else:
            return jsonify({"error": "Transaction not found or not prepared"}), 404
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@flashcards_bp.route("/api/flashcards/abort", methods=["POST"])
def abort():
    transaction_id = request.json.get("transaction_id")

    try:
        # Retrieve the transaction by ID
        transaction = Transaction.query.get(transaction_id)
        if transaction:
            # Update status to "aborted" and commit
            transaction.status = "aborted"
            db.session.commit()

            # Delete the transaction entry from the table
            Transaction.query.filter_by(transaction_id=transaction_id).delete()
            db.session.commit()

            return jsonify({"status": "aborted and deleted"}), 200
        else:
            return jsonify({"error": "Transaction not found"}), 404
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


# Get all flashcard sets
@flashcards_bp.route('/api/flashcards', methods=['GET'])
@limiter.limit("5 per minute")
def get_flashcard_sets():
    try:
        semaphore.acquire()
        flashcard_sets = FlashcardSet.query.all()
        # time.sleep(6)  # Simulate a slow request
        results = [
            {
                "setId": fs.id,
                "title": fs.title,
                "subject": fs.subject,
                "creatorId": fs.creator_id,
                "cards": [{"cardId": card.id, "question": card.question, "answer": card.answer} for card in fs.flashcards]
            }
            for fs in flashcard_sets
        ]
        return jsonify({"flashcardSets": results}), 200
    finally:
        semaphore.release()

# Get a single flashcard set by ID
@flashcards_bp.route('/api/flashcards/<int:set_id>', methods=['GET'])
@limiter.limit("5 per minute")
def get_flashcard_set(set_id):
    try:
        semaphore.acquire()
        cache_key = f"{CACHE_KEY_PREFIX}{set_id}"

        # Check if flashcard set exists in cache
        cached_flashcard_set = cache.get(cache_key)
        
        if cached_flashcard_set:
            flashcard_set_data = json.loads(cached_flashcard_set)
            return jsonify({"data": flashcard_set_data, "source": "redis"}), 200
        
        flashcard_set = FlashcardSet.query.get_or_404(set_id)
        result = {
            "setId": flashcard_set.id,
            "title": flashcard_set.title,
            "subject": flashcard_set.subject,
            "creatorId": flashcard_set.creator_id,
            "cards": [{"cardId": card.id, "question": card.question, "answer": card.answer} for card in flashcard_set.flashcards]
        }

        cache.setex(cache_key, 300, json.dumps(result))
        return jsonify(result), 200
    finally:
        semaphore.release()

# Create a new flashcard set
@flashcards_bp.route('/api/flashcards', methods=['POST'])
@limiter.limit("5 per minute")
@jwt_required()
def create_flashcard_set():
    try:
        semaphore.acquire()
        data = request.get_json()
        title = data.get('title')
        subject = data.get('subject')
        cards_data = data.get('cards', [])

        creator_id = get_jwt_identity()

        new_flashcard_set = FlashcardSet(title=title, subject=subject, creator_id=creator_id)
        db.session.add(new_flashcard_set)
        db.session.commit()

        # Add the flashcards to the set
        for card in cards_data:
            new_flashcard = Flashcard(set_id=new_flashcard_set.id, question=card['question'], answer=card['answer'])
            db.session.add(new_flashcard)
        
        db.session.commit()

        return jsonify({"message": "Flashcard set created successfully", "title": title}), 201
    finally:
        semaphore.release()

# Update a flashcard set
@flashcards_bp.route('/api/flashcards/<int:set_id>', methods=['PUT'])
@limiter.limit("5 per minute")
def update_flashcard_set(set_id):
    try:
        semaphore.acquire()
        flashcard_set = FlashcardSet.query.get_or_404(set_id)
        data = request.get_json()

        flashcard_set.title = data.get('title', flashcard_set.title)
        flashcard_set.subject = data.get('subject', flashcard_set.subject)

        # Update or create flashcards
        for card_data in data.get('cards', []):
            flashcard = Flashcard.query.filter_by(id=card_data['cardId'], set_id=set_id).first()
            if flashcard:
                flashcard.question = card_data.get('question', flashcard.question)
                flashcard.answer = card_data.get('answer', flashcard.answer)
            else:
                new_card = Flashcard(set_id=set_id, question=card_data['question'], answer=card_data['answer'])
                db.session.add(new_card)

        db.session.commit()
        cache.delete(f"{CACHE_KEY_PREFIX}{set_id}")
        return jsonify({"message": "Flashcard set updated successfully"}), 200
    finally:
        semaphore.release()

# Delete a flashcard set
@flashcards_bp.route('/api/flashcards/<int:set_id>', methods=['DELETE'])
@limiter.limit("5 per minute")
def delete_flashcard_set(set_id):
    try:
        semaphore.acquire()
        flashcard_set = FlashcardSet.query.get_or_404(set_id)
        db.session.delete(flashcard_set)
        db.session.commit()
        return jsonify({"message": "Flashcard set deleted successfully"}), 200
    finally:
        semaphore.release()



@flashcards_bp.route('/api/flashcards/status', methods=['GET'])
@limiter.limit("5 per minute")
def status():
    try:
        semaphore.acquire()
        try:
            with db.engine.connect() as connection:
                result = connection.execute(text('SELECT 1')).fetchone()
            if result and result[0] == 1:
                return jsonify({
                    "service": "flashcards",
                    "status": "running"
                }), 200
            else:
                return jsonify({
                    "service": "flashcards",
                    "status": "ERROR",
                    "database": "Connected but query returned unexpected result"
                }), 500
        except Exception as e:
            return jsonify({
                "service": "flashcards",
                "status": "ERROR",
                "database": "Not connected",
                "error": str(e)
            }), 500
    finally:
        semaphore.release()

