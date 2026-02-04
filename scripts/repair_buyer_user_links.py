from app import app, db
from app.models.user import User
from app.models.buyer import Buyer

def main():
    with app.app_context():
        print('Users with role=buyer:')
        buyers_users = User.query.filter_by(role='buyer').all()
        for u in buyers_users:
            bp = getattr(u, 'buyer_profile', None)
            print(f'User id={u.id} username={u.username} email={u.email} has_buyer_profile={bool(bp)}')

        print('\nBuyer rows:')
        buyers = Buyer.query.all()
        for b in buyers:
            print(f'Buyer id={b.id} nombre={b.nombre} email={b.email} user_id={b.user_id}')

        # Backfill: link buyers to users by email and create Buyer for users without one
        created = 0
        linked = 0
        for u in buyers_users:
            bp = getattr(u, 'buyer_profile', None)
            if bp:
                continue
            # try find buyer by email
            if u.email:
                b = Buyer.query.filter_by(email=u.email).first()
            else:
                b = None
            if b:
                if not b.user_id:
                    b.user_id = u.id
                    db.session.add(b)
                    linked += 1
            else:
                # create buyer row
                nombre = u.username or (u.email.split('@')[0] if u.email else f'buyer{u.id}')
                newb = Buyer(identificacion=None, nombre=nombre, direccion=None, telefono=None, email=u.email, user_id=u.id)
                db.session.add(newb)
                created += 1

        if linked or created:
            db.session.commit()

        print(f'Linked: {linked}, Created: {created}')

if __name__ == '__main__':
    main()
