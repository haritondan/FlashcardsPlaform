from flask import Flask
from db import db
from flask_jwt_extended import JWTManager
from datetime import timedelta
from routes import flashcards_bp
from flask_limiter import Limiter
from flask import request
import requests, os
from flask_socketio import SocketIO, send, emit, join_room, leave_room

ACCESS_EXPIRES = timedelta(minutes=15)

app = Flask(__name__)
socketio = SocketIO(app) 
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://admin:password@flashcards-db:5432/flashcardsdb'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

app.config["JWT_SECRET_KEY"] = "super-secret"  
app.config["JWT_TOKEN_LOCATION"] = ["headers"]  
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = ACCESS_EXPIRES

jwt = JWTManager(app)
db.init_app(app)

def register_service_with_consul():
    # Use container hostname as a unique identifier
    hostname = os.getenv("HOSTNAME", "unknown-host")

    service_data = {
        "ID": f"flashcards-service-{hostname}",  # Unique service ID for each instance
        "Name": "flashcards-service",
        "Address": "flashcards-service",  # Same service name, Docker resolves this
        "Port": 5001,  # Internal port
        "Check": {
            "HTTP": "http://flashcards-service:5001/api/flashcards/status",
            "Interval": "10s",
            "Timeout": "5s"
        }
    }

    try:
        requests.put("http://consul:8500/v1/agent/service/register", json=service_data)
        print(f"flashcards-service-{hostname} registered with Consul")
    except Exception as e:
        print(f"Error registering flashcards-service-{hostname} with Consul: {e}")

def get_ip_from_forwarded():
    if request.headers.getlist("X-Forwarded-For"):
        return request.headers.getlist("X-Forwarded-For")[0]
    return request.remote_addr

limiter = Limiter(key_func=get_ip_from_forwarded, app=app, default_limits=["5 per minute"])

app.register_blueprint(flashcards_bp)

# Handle connection
@socketio.on('connect')
def handle_connect():
    send(f"{request.sid} connected to the WebSocket server!")

# Handle messages
@socketio.on('message')
def handle_message(message):
    send(f"Message: {message}")

# Handle disconnection
@socketio.on('disconnect')
def handle_disconnect():
    send(f"{request.sid} disconnected from the WebSocket server!")

# Notification actions
@socketio.on('join_notification')
def on_join_notification(data):
    user_id = data['user_id']
    room = str(data['room_id'])
    join_room(room)
    send(f"User {user_id} has joined the room {room}", to=room)

@socketio.on('leave_notification')
def on_leave_notification(data):
    user_id = data['user_id']
    room = str(data['room_id'])

    send(f"User {user_id} has left the room {room}", to=room)
    leave_room(room)

# Flashcard actions
@socketio.on('new_flashcard_set')
def handle_new_flashcard_set(data):
    user_id = data['user_id']
    room = str(data['room_id'])
    flashcard_set_title = data['flashcard_set_title']
    emit('new_flashcard_set', f"User {user_id} created a new flashcard set: {flashcard_set_title}", to=room)

@socketio.on('update_flashcard_set')
def handle_update_flashcard_set(data):
    user_id = data['user_id']
    room = str(data['room_id'])
    flashcard_set_title = data['flashcard_set_title']
    emit('update_flashcard_set', f"User {user_id} updated the flashcard set: {flashcard_set_title}", to=room)

@socketio.on('delete_flashcard_set')
def handle_delete_flashcard_set(data):
    user_id = data['user_id']
    room = str(data['room_id'])
    flashcard_set_title = data['flashcard_set_title']
    emit('delete_flashcard_set', f"User {user_id} deleted the flashcard set: {flashcard_set_title}", to=room)


if __name__ == "__main__":
  register_service_with_consul()
  socketio.run(app, debug=True, host="0.0.0.0", port=5001, allow_unsafe_werkzeug=True)
