"""change notification user_id -> buyer_id and add raffle_id

Revision ID: a1b2c3d4e5f6
Revises: f2a3b4c5d6e7
Create Date: 2026-01-28 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'a1b2c3d4e5f6'
down_revision = 'f2a3b4c5d6e7'
branch_labels = None
depends_on = None


def upgrade():
    # Use batch mode for SQLite compatibility
    with op.batch_alter_table('notification', schema=None) as batch_op:
        # add new columns
        batch_op.add_column(sa.Column('buyer_id', sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column('raffle_id', sa.Integer(), nullable=True))
        # create foreign keys
        batch_op.create_foreign_key('fk_notification_buyer_id_buyer', 'buyer', ['buyer_id'], ['id'])
        batch_op.create_foreign_key('fk_notification_raffle_id_raffle', 'raffle', ['raffle_id'], ['id'])
        # drop old column if exists
        try:
            batch_op.drop_column('user_id')
        except Exception:
            pass


def downgrade():
    with op.batch_alter_table('notification', schema=None) as batch_op:
        # recreate user_id column (nullable)
        batch_op.add_column(sa.Column('user_id', sa.Integer(), nullable=True))
        batch_op.create_foreign_key('fk_notification_user_id_user', 'user', ['user_id'], ['id'])
        # drop new columns and constraints
        try:
            batch_op.drop_constraint('fk_notification_raffle_id_raffle', type_='foreignkey')
        except Exception:
            pass
        try:
            batch_op.drop_constraint('fk_notification_buyer_id_buyer', type_='foreignkey')
        except Exception:
            pass
        try:
            batch_op.drop_column('raffle_id')
        except Exception:
            pass
        try:
            batch_op.drop_column('buyer_id')
        except Exception:
            pass
