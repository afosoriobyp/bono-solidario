from app import db

class Notification(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    buyer_id = db.Column(db.Integer, db.ForeignKey('buyer.id'))
    raffle_id = db.Column(db.Integer, db.ForeignKey('raffle.id'))
    message = db.Column(db.String(255), nullable=False)
    sent_at = db.Column(db.DateTime)
    status = db.Column(db.String(20), nullable=False, default='pending')
    error = db.Column(db.Text, nullable=True)
    # ...otros campos relevantes...
