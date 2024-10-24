from flask import Flask
from flask_jwt_extended import JWTManager
from datetime import timedelta
from db import db 
from routes import auth_bp
from flask_limiter import Limiter
from flask import request
import requests

ACCESS_EXPIRES = timedelta(minutes=15)

app = Flask(__name__)

app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://admin:password@auth-db:5432/authdb'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config["JWT_SECRET_KEY"] = "super-secret"
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = ACCESS_EXPIRES


db.init_app(app)  
jwt = JWTManager(app)

def get_ip_from_forwarded():
    if request.headers.getlist("X-Forwarded-For"):
        return request.headers.getlist("X-Forwarded-For")[0]
    return request.remote_addr

limiter = Limiter(key_func=get_ip_from_forwarded, app=app, default_limits=["5 per minute"])

def register_service_with_consul():
    service_data = {
        "ID": "auth-service",
        "Name": "auth-service",
        "Address": "auth-service",
        "Port": 5000,
        "Check": {
            "HTTP": "http://auth-service:5000/api/auth/status",
            "Interval": "10s",
            "Timeout": "5s"
        }
    }

    # Register the service with Consul
    try:
        requests.put("http://consul:8500/v1/agent/service/register", json=service_data)
        print("auth-service registered with Consul")
    except Exception as e:
        print(f"Error registering auth-service with Consul: {e}")

app.register_blueprint(auth_bp)

if __name__ == '__main__':
    register_service_with_consul()
    app.run(host='0.0.0.0', port=5000)
