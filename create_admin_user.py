"""
Script para crear usuario administrador de prueba en producción
Ejecutar en Render Shell con: python create_admin_user.py
"""
from app import create_app, db
from app.models.user import User
from werkzeug.security import generate_password_hash

def create_admin():
    app = create_app()
    with app.app_context():
        # Verificar si ya existe el admin
        existing = User.query.filter_by(username='admin').first()
        if existing:
            print(f"✓ Usuario 'admin' ya existe (ID: {existing.id})")
            print(f"  Email: {existing.email}")
            print(f"  Rol: {existing.role}")
            return
        
        # Crear nuevo usuario admin
        admin = User(
            username='admin',
            email='admin@bonos.com',
            password_hash=generate_password_hash('admin123'),
            role='admin'
        )
        
        db.session.add(admin)
        db.session.commit()
        
        print("✓ Usuario administrador creado exitosamente!")
        print(f"  Usuario: admin")
        print(f"  Password: admin123")
        print(f"  Email: admin@bonos.com")
        print(f"  Rol: admin")
        print(f"  ID: {admin.id}")
        print("\n⚠️  IMPORTANTE: Cambia la contraseña después del primer login")

if __name__ == '__main__':
    create_admin()
