from app import app, db
from app.models.user import User
from app.models.raffle import Raffle
from app.models.ticket import Ticket
from app.models.prize import Prize
from werkzeug.security import generate_password_hash
from datetime import datetime

with app.app_context():
    # Obtener usuarios
    admin = User.query.filter_by(username='admin').first()
    seller = User.query.filter_by(username='seller').first()
    buyer = User.query.filter_by(username='buyer').first()

    # Crear rifa de prueba
    raffle = Raffle(name='Rifa de Prueba', commission_pct=10.0)
    db.session.add(raffle)
    db.session.commit()

    # Crear tickets vendidos al comprador
    tickets = []
    for i in range(1, 6):
        ticket = Ticket(
            number=f'TK-{i}',
            raffle_id=raffle.id,
            seller_id=seller.id,
            buyer_id=buyer.id,
            is_sold=True,
            sold_at=datetime(2026, 1, 20 + i),
            payment_method='Virtual',
            data_authorization_policy='Aceptada'
        )
        db.session.add(ticket)
        tickets.append(ticket)
    db.session.commit()

    # Crear premios para algunos tickets
    prize1 = Prize(name='Premio 1', description='TV 50"', raffle_id=raffle.id, ticket_id=tickets[0].id, awarded_at=datetime(2026, 1, 25))
    prize2 = Prize(name='Premio 2', description='Bicicleta', raffle_id=raffle.id, ticket_id=tickets[2].id, awarded_at=datetime(2026, 1, 26))
    db.session.add_all([prize1, prize2])
    db.session.commit()

    print('Rifa, tickets y premios de prueba creados.')
