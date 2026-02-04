from app import db

class Buyer(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    identificacion = db.Column(db.String(32), nullable=True)
    nombre = db.Column(db.String(128), nullable=False)
    direccion = db.Column(db.String(255), nullable=True)
    telefono = db.Column(db.String(32), nullable=True)
    email = db.Column(db.String(120), nullable=False)
    # Relación opcional con User: buyer.user_id -> user.id
    user_id = db.Column(db.Integer, db.ForeignKey('user.id', ondelete='SET NULL'), nullable=True)
    user = db.relationship('User', backref=db.backref('buyer_profile', uselist=False))
    # Relación: un comprador puede tener muchos tickets
    tickets = db.relationship('Ticket', backref='buyer_obj', lazy=True)

    def __init__(self, identificacion, nombre, direccion, telefono, email, user_id=None):
        # Si identificacion es nula, usar el número de celular
        if not identificacion and telefono:
            identificacion = telefono
        self.identificacion = identificacion
        self.nombre = nombre
        self.direccion = direccion
        self.telefono = telefono
        self.email = email
        self.user_id = user_id