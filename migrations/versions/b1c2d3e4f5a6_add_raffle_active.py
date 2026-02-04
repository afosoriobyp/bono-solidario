"""add active column to raffle

Revision ID: b1c2d3e4f5a6
Revises: a1b2c3d4e5f6
Create Date: 2026-01-28 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'b1c2d3e4f5a6'
down_revision = 'a1b2c3d4e5f6'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('raffle', schema=None) as batch_op:
        batch_op.add_column(sa.Column('active', sa.Boolean(), nullable=False, server_default=sa.true()))
    # remove server_default to rely on application defaults
    with op.batch_alter_table('raffle', schema=None) as batch_op:
        batch_op.alter_column('active', server_default=None)


def downgrade():
    with op.batch_alter_table('raffle', schema=None) as batch_op:
        batch_op.drop_column('active')
