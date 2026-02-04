from app import app, db
from app.models.user import User
from werkzeug.security import generate_password_hash

with app.app_context():
    # Crear usuarios de prueba
    admin = User(username='admin', email='admin@test.com', password_hash=generate_password_hash('admin123'), role='admin', is_active=True)
    seller = User(username='seller', email='seller@test.com', password_hash=generate_password_hash('seller123'), role='seller', is_active=True)
    buyer = User(username='buyer', email='buyer@test.com', password_hash=generate_password_hash('buyer123'), role='buyer', is_active=True)
    db.session.add_all([admin, seller, buyer])
    db.session.commit()
    print('Usuarios de prueba creados.')
