"""Aumentar longitud de password_hash a 256 caracteres

Revision ID: 74883545c149
Revises: fbdd9c34cee2
Create Date: 2026-02-04 11:22:35.234397

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '74883545c149'
down_revision = 'fbdd9c34cee2'
branch_labels = None
depends_on = None


def upgrade():
    # Solo aumentar longitud de password_hash
    with op.batch_alter_table('user', schema=None) as batch_op:
        batch_op.alter_column('password_hash',
               existing_type=sa.VARCHAR(length=128),
               type_=sa.String(length=256),
               existing_nullable=False)


def downgrade():
    with op.batch_alter_table('user', schema=None) as batch_op:
        batch_op.alter_column('password_hash',
               existing_type=sa.String(length=256),
               type_=sa.VARCHAR(length=128),
               existing_nullable=False)
        batch_op.create_index(batch_op.f('ix_seller_email'), ['email'], unique=1)
        batch_op.alter_column('estado',
               existing_type=sa.VARCHAR(length=20),
               nullable=False,
               existing_server_default=sa.text("'activo'"))
        batch_op.alter_column('tratamiento_datos',
               existing_type=sa.BOOLEAN(),
               nullable=False,
               existing_server_default=sa.text('0'))

    with op.batch_alter_table('buyer', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_buyer_email'), ['email'], unique=False)

    # ### end Alembic commands ###
