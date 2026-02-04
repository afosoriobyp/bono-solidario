import os

class Config:
    # Configuración para Flask-Mail
    MAIL_SERVER = os.environ.get('MAIL_SERVER', 'smtp.gmail.com')
    MAIL_PORT = int(os.environ.get('MAIL_PORT', 587))
    MAIL_USE_TLS = True
    MAIL_USERNAME = os.environ.get('MAIL_USERNAME')
    MAIL_PASSWORD = os.environ.get('MAIL_PASSWORD')
    MAIL_DEFAULT_SENDER = os.environ.get('MAIL_DEFAULT_SENDER')
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'supersecretkey'
    
    # Configuración de base de datos
    # Render usa DATABASE_URL con postgres://, pero SQLAlchemy requiere postgresql://
    database_url = os.environ.get('DATABASE_URL')
    if database_url:
        if database_url.startswith('postgres://'):
            database_url = database_url.replace('postgres://', 'postgresql://', 1)
        
        # Agregar parámetros SSL si no están presentes (requerido por Render PostgreSQL)
        if 'sslmode' not in database_url and 'render.com' in database_url:
            # Añadir sslmode=require para conexiones Render
            separator = '&' if '?' in database_url else '?'
            database_url = f"{database_url}{separator}sslmode=require"
        
        SQLALCHEMY_DATABASE_URI = database_url
        # Opciones de pool solo para PostgreSQL
        SQLALCHEMY_ENGINE_OPTIONS = {
            'pool_pre_ping': True,
            'pool_recycle': 300,
            'pool_size': 10,
            'max_overflow': 20,
        }
    else:
        # Fallback para desarrollo local con SQLite
        SQLALCHEMY_DATABASE_URI = 'sqlite:///bonos.db'
        SQLALCHEMY_ENGINE_OPTIONS = {}
    
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Configuración para Flask-SocketIO
    SOCKETIO_MESSAGE_QUEUE = os.environ.get('SOCKETIO_MESSAGE_QUEUE')
    
    # Configuración de producción
    DEBUG = os.environ.get('FLASK_DEBUG', 'False').lower() == 'true'
    TESTING = False

config = Config
