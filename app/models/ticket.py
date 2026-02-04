from app import db

class Ticket(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    number = db.Column(db.String(20), nullable=False)
    raffle_id = db.Column(db.Integer, db.ForeignKey('raffle.id'))
    # Tras normalización, seller_id referencia a tabla `seller`
    seller_id = db.Column(db.Integer, db.ForeignKey('seller.id'))
    buyer_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    # Nueva relación: referencia a Buyer
    buyer_data_id = db.Column(db.Integer, db.ForeignKey('buyer.id'), nullable=True)
    is_sold = db.Column(db.Boolean, default=False)
    sold_at = db.Column(db.DateTime, nullable=True)  # Fecha y hora de venta
    payment_method = db.Column(db.String(20), nullable=False, default='Virtual')  # Virtual, efectivo, cuotas
    data_authorization_policy = db.Column(db.String(255), nullable=True)  # Política de autorización de datos
    # Relación con premios ganados
    prizes = db.relationship('Prize', backref='ticket', lazy=True)
    # ...otros campos relevantes...
