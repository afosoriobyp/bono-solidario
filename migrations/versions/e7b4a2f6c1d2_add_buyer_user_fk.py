"""add buyer.user_id FK and backfill from users

Revision ID: e7b4a2f6c1d2
Revises: c3f1b2d4e6a7
Create Date: 2026-01-28 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.sql import text

# revision identifiers, used by Alembic.
revision = 'e7b4a2f6c1d2'
down_revision = 'c3f1b2d4e6a7'
branch_labels = None
depends_on = None


def upgrade():
    # Añadir columna user_id a buyer y crear FK en modo batch (SQLite)
    with op.batch_alter_table('buyer', schema=None) as batch_op:
        batch_op.add_column(sa.Column('user_id', sa.Integer(), nullable=True))
        batch_op.create_foreign_key('fk_buyer_user_id_user', 'user', ['user_id'], ['id'], ondelete='SET NULL')

    # Backfill: para cada User con role='buyer', vincular o crear Buyer
    conn = op.get_bind()
    users = conn.execute(text("SELECT id, username, email FROM \"user\" WHERE role = 'buyer' ")).fetchall()
    for uid, username, email in users:
        # Buscar buyer por email
        if email:
            buyer_row = conn.execute(text('SELECT id FROM buyer WHERE email = :email'), {'email': email}).fetchone()
        else:
            buyer_row = None
        if buyer_row:
            conn.execute(text('UPDATE buyer SET user_id = :uid WHERE id = :bid'), {'uid': uid, 'bid': buyer_row[0]})
        else:
            nombre = username or (email.split('@')[0] if email else f'buyer{uid}')
            conn.execute(text('INSERT INTO buyer (identificacion, nombre, direccion, telefono, email, user_id) VALUES (:ident, :nombre, :direccion, :telefono, :email, :uid)'),
                         {'ident': None, 'nombre': nombre, 'direccion': None, 'telefono': None, 'email': email, 'uid': uid})


def downgrade():
    # Eliminar FK y columna en modo batch (SQLite)
    with op.batch_alter_table('buyer', schema=None) as batch_op:
        batch_op.drop_constraint('fk_buyer_user_id_user', type_='foreignkey')
        batch_op.drop_column('user_id')
