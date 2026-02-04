from app import app, db
from app.models.user import User
from app.models.ticket import Ticket
from app.models.commission import Commission
from datetime import datetime

with app.app_context():
    seller = User.query.filter_by(username='seller').first()
    tickets = Ticket.query.filter_by(seller_id=seller.id).all()
    # Crear comisión por cada ticket vendido
    for ticket in tickets:
        commission = Commission(
            seller_id=seller.id,
            amount=10000.0,  # Monto fijo de ejemplo
            paid=False
        )
        db.session.add(commission)
    db.session.commit()
    print('Comisiones de prueba creadas para el vendedor.')
