from flask import Flask
from flask_jwt_extended import JWTManager
from datetime import timedelta
from db import db 
from routes import auth_bp
from flask_limiter import Limiter
from flask import request

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


app.register_blueprint(auth_bp)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
