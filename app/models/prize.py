from app import db

class Prize(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.String(255), nullable=True)
    raffle_id = db.Column(db.Integer, db.ForeignKey('raffle.id'), nullable=False)
    ticket_id = db.Column(db.Integer, db.ForeignKey('ticket.id'), nullable=True)  # Boleto ganador
    awarded_at = db.Column(db.DateTime, nullable=True)  # Fecha de asignación
    # ...otros campos relevantes...
