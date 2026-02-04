"""add buyer index and backfill buyer_data_id for tickets

Revision ID: c3f1b2d4e6a7
Revises: 9acefe68d374
Create Date: 2026-01-28 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.sql import text

# revision identifiers, used by Alembic.
revision = 'c3f1b2d4e6a7'
down_revision = '9acefe68d374'
branch_labels = None
depends_on = None


def upgrade():
    # Crear índice sobre buyer.email
    op.create_index('ix_buyer_email', 'buyer', ['email'], unique=False)

    # Backfill: para tickets con buyer_id definido y buyer_data_id NULL, crear/usar buyer y asignar
    conn = op.get_bind()
    tickets = conn.execute(text("SELECT id, buyer_id FROM ticket WHERE buyer_id IS NOT NULL AND (buyer_data_id IS NULL) ")).fetchall()
    for tid, uid in tickets:
        user = conn.execute(text('SELECT username, email FROM "user" WHERE id = :uid'), {'uid': uid}).fetchone()
        if not user:
            continue
        email = user['email']
        if not email:
            continue
        # Buscar buyer existente por email
        buyer_row = conn.execute(text('SELECT id FROM buyer WHERE email = :email'), {'email': email}).fetchone()
        if buyer_row:
            bid = buyer_row['id']
        else:
            username = user['username'] or email.split('@')[0]
            conn.execute(text('INSERT INTO buyer (identificacion, nombre, direccion, telefono, email) VALUES (:ident, :nombre, :direccion, :telefono, :email)'),
                         {'ident': None, 'nombre': username, 'direccion': None, 'telefono': None, 'email': email})
            bid = conn.execute(text('SELECT id FROM buyer WHERE email = :email ORDER BY id DESC LIMIT 1'), {'email': email}).fetchone()['id']
        conn.execute(text('UPDATE ticket SET buyer_data_id = :bid WHERE id = :tid'), {'bid': bid, 'tid': tid})


def downgrade():
    # Eliminar índice (no revertimos el backfill)
    op.drop_index('ix_buyer_email', table_name='buyer')
