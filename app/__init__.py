
from dotenv import load_dotenv
import os
from flask import Flask

from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_mail import Mail
from flask_socketio import SocketIO
from flask_login import LoginManager



# Cargar variables de entorno desde .env automáticamente
dotenv_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env')
load_dotenv(dotenv_path)

# Inicialización de extensiones

app = Flask(__name__)
app.config.from_object('config.Config')
db = SQLAlchemy(app)
migrate = Migrate(app, db)
mail = Mail(app)
socketio = SocketIO(app)

# Inicializar LoginManager
login_manager = LoginManager(app)
login_manager.login_view = 'auth.login'
login_manager.login_message_category = 'info'

from app.models.user import User
@login_manager.user_loader
def load_user(user_id):
	return User.query.get(int(user_id))

# Importar Blueprints
from app.blueprints.auth import auth_bp
from app.blueprints.admin import admin_bp
from app.blueprints.seller import seller_bp
from app.blueprints.buyer import buyer_bp



# Registrar Blueprints
app.register_blueprint(auth_bp)
app.register_blueprint(admin_bp)
app.register_blueprint(seller_bp)
app.register_blueprint(buyer_bp)

# Context processor para 'now'
from datetime import datetime
@app.context_processor
def inject_now():
	return {'now': datetime.now}

# Redirigir '/' al login
@app.route('/')
def index():
	from flask import redirect, url_for
	return redirect(url_for('auth.login'))
