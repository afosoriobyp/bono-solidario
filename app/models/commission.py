from app import db

class Commission(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    seller_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    amount = db.Column(db.Float, nullable=False)
    paid = db.Column(db.Boolean, default=False)
    # ...otros campos relevantes...
