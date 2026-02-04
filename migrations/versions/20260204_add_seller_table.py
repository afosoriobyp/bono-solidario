"""add seller table

Revision ID: 20260204_add_seller_table
Revises: zz_add_notification_status_error
Create Date: 2026-02-04 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '20260204_add_seller_table'
down_revision = 'zz_add_notification_status_error'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'seller',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('identificacion', sa.String(length=32), nullable=True),
        sa.Column('nombre', sa.String(length=128), nullable=False),
        sa.Column('direccion', sa.String(length=255), nullable=True),
        sa.Column('telefono', sa.String(length=32), nullable=True),
        sa.Column('email', sa.String(length=120), nullable=False),
        sa.Column('tratamiento_datos', sa.Boolean(), nullable=False, server_default=sa.text('0')),
        sa.Column('estado', sa.String(length=20), nullable=False, server_default='activo')
    )
    # crear índice sobre email
    op.create_index('ix_seller_email', 'seller', ['email'], unique=True)


def downgrade():
    op.drop_index('ix_seller_email', table_name='seller')
    op.drop_table('seller')
