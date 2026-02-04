from app import app, db
from sqlalchemy import text

with app.app_context():
    print('DB:', app.config.get('SQLALCHEMY_DATABASE_URI'))
    print('alembic_version:', db.session.execute(text('SELECT version_num FROM alembic_version')).fetchone())
    print('\nPRAGMA table_info(buyer):')
    for row in db.session.execute(text("PRAGMA table_info(buyer)")):
        print(row)
    print('\nPRAGMA foreign_key_list(buyer):')
    for row in db.session.execute(text("PRAGMA foreign_key_list(buyer)")):
        print(row)
