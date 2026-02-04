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
            # Actualizar para asegurar que esté activo
            existing.is_active = True
            existing.password_hash = generate_password_hash('admin123')
            db.session.commit()
            print(f"✓ Usuario 'admin' actualizado (ID: {existing.id})")
            print(f"  Email: {existing.email}")
            print(f"  Rol: {existing.role}")
            print(f"  Activo: {existing.is_active}")
            print(f"  Password actualizado a: admin123")
            return
        
        # Crear nuevo usuario admin
        admin = User(
            username='admin',
            email='admin@bonos.com',
            password_hash=generate_password_hash('admin123'),
            role='admin',
            is_active=True  # Asegurar que esté activo
        )
        
        db.session.add(admin)
        db.session.commit()
        
        print("✓ Usuario administrador creado exitosamente!")
        print(f"  Usuario: admin")
        print(f"  Password: admin123")
        print(f"  Email: admin@bonos.com")
        print(f"  Rol: admin")
        print(f"  Activo: {admin.is_active}")
        print(f"  ID: {admin.id}")
        print("\n⚠️  IMPORTANTE: Cambia la contraseña después del primer login")

if __name__ == '__main__':
    create_admin()
