"""add status and error to notification

Revision ID: zz_add_notification_status_error
Revises: f2a3b4c5d6e7
Create Date: 2026-01-28 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'zz_add_notification_status_error'
down_revision = 'f2a3b4c5d6e7'
branch_labels = None
depends_on = None


def upgrade():
    # Añadir columnas status y error a la tabla notification
    with op.batch_alter_table('notification', schema=None) as batch_op:
        batch_op.add_column(sa.Column('status', sa.String(length=20), nullable=False, server_default='pending'))
        batch_op.add_column(sa.Column('error', sa.Text(), nullable=True))


def downgrade():
    # Eliminar columnas en downgrade
    with op.batch_alter_table('notification', schema=None) as batch_op:
        batch_op.drop_column('error')
        batch_op.drop_column('status')
