from app import db


class Seller(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    identificacion = db.Column(db.String(32), nullable=True)
    nombre = db.Column(db.String(128), nullable=False)
    direccion = db.Column(db.String(255), nullable=True)
    telefono = db.Column(db.String(32), nullable=True)
    email = db.Column(db.String(120), nullable=False, unique=True)
    tratamiento_datos = db.Column(db.Boolean, default=False)
    estado = db.Column(db.String(20), default='activo')

    # Nota: quitamos relación directa a `Ticket` para evitar problemas de mapeo
    # y mantener compatibilidad con la base de datos actual. Se puede añadir
    # una relación explícita más adelante con `primaryjoin` si se normaliza el esquema.

    def __init__(self, identificacion, nombre, direccion, telefono, email, tratamiento_datos=False, estado='activo'):
        if not identificacion and telefono:
            identificacion = telefono
        self.identificacion = identificacion
        self.nombre = nombre
        self.direccion = direccion
        self.telefono = telefono
        self.email = email
        self.tratamiento_datos = tratamiento_datos
        self.estado = estado
