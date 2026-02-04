"""migrate ticket seller fk from user -> seller

Revision ID: 20260204_migrate_ticket_seller_fk
Revises: 20260204_add_seller_table
Create Date: 2026-02-04 00:30:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.sql import text

# revision identifiers, used by Alembic.
revision = '20260204_migrate_ticket_seller_fk'
down_revision = '20260204_add_seller_table'
branch_labels = None
depends_on = None


def upgrade():
    conn = op.get_bind()
    # 1) Añadir columna seller_data_id (sin crear FK para evitar recrear la tabla en SQLite)
    try:
        op.add_column('ticket', sa.Column('seller_data_id', sa.Integer(), nullable=True))
    except Exception:
        # Si ya existe, continuar
        pass

    # 2) Backfill: para cada ticket con seller_id (user.id), buscar/crear seller y asignar seller_data_id
    tickets = conn.execute(text('SELECT id, seller_id FROM ticket WHERE seller_id IS NOT NULL')).fetchall()
    for tid, uid in tickets:
        # buscar user
        user = conn.execute(text('SELECT username, email FROM "user" WHERE id = :uid'), {'uid': uid}).fetchone()
        if not user:
            continue
        email = user[1]
        nombre = user[0] or (email.split('@')[0] if email else f'user{uid}')
        # buscar seller existente por email
        seller_row = None
        if email:
            seller_row = conn.execute(text('SELECT id FROM seller WHERE email = :email'), {'email': email}).fetchone()
        if seller_row:
            sid = seller_row[0]
        else:
            conn.execute(text('INSERT INTO seller (identificacion, nombre, direccion, telefono, email, tratamiento_datos, estado) VALUES (:ident, :nombre, NULL, NULL, :email, 0, :estado)'),
                         {'ident': None, 'nombre': nombre, 'email': email, 'estado': 'activo'})
            sid = conn.execute(text('SELECT id FROM seller WHERE email = :email ORDER BY id DESC LIMIT 1'), {'email': email}).fetchone()[0]
        conn.execute(text('UPDATE ticket SET seller_data_id = :sid WHERE id = :tid'), {'sid': sid, 'tid': tid})

    # NOTA: No renombramos ni eliminamos columnas aquí para evitar recrear la tabla.
    # La normalización completa (crear FK y renombrar) se hará en una migración posterior
    # una vez verificado el backfill.


def downgrade():
    conn = op.get_bind()
    # revertir: crear columna temporal user_seller_id y backfill desde seller
    with op.batch_alter_table('ticket', schema=None) as batch_op:
        batch_op.add_column(sa.Column('user_seller_id', sa.Integer(), nullable=True))
        # no intentamos crear FK a user aquí

    tickets = conn.execute(text('SELECT id, seller_id FROM ticket WHERE seller_id IS NOT NULL')).fetchall()
    for tid, sid in tickets:
        # intentar mapear seller -> user por email
        seller = conn.execute(text('SELECT email FROM seller WHERE id = :sid'), {'sid': sid}).fetchone()
        if not seller:
            continue
        email = seller[0]
        user_row = None
        if email:
            user_row = conn.execute(text('SELECT id FROM "user" WHERE email = :email'), {'email': email}).fetchone()
        if user_row:
            uid = user_row[0]
            conn.execute(text('UPDATE ticket SET user_seller_id = :uid WHERE id = :tid'), {'uid': uid, 'tid': tid})

    with op.batch_alter_table('ticket', schema=None) as batch_op:
        try:
            batch_op.drop_column('seller_id')
        except Exception:
            pass
        batch_op.alter_column('user_seller_id', new_column_name='seller_id')