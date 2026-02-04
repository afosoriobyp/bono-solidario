from app import app, db
from app.models.raffle import Raffle

with app.app_context():
    r = Raffle.query.get(2)
    r.numeracion_boletas_disponibles = '0001-0100'
    db.session.commit()
    print('numeracion:', r.numeracion_boletas_disponibles)
    print('boletas:', r.get_boletas_disponibles())
