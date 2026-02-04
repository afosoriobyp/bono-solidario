"""finalize ticket seller fk: rename seller_data_id -> seller_id and add FK

Revision ID: 20260204_finalize_ticket_seller_fk
Revises: 20260204_migrate_ticket_seller_fk
Create Date: 2026-02-04 01:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '20260204_finalize_ticket_seller_fk'
down_revision = '20260204_migrate_ticket_seller_fk'
branch_labels = None
depends_on = None


def upgrade():
    # Use batch_alter_table so Alembic can recreate the table on SQLite safely
    with op.batch_alter_table('ticket', schema=None) as batch_op:
        # Drop legacy seller_id (that referenced user) if present
        try:
            batch_op.drop_column('seller_id')
        except Exception:
            pass
        # Rename seller_data_id -> seller_id
        batch_op.alter_column('seller_data_id', new_column_name='seller_id', existing_type=sa.Integer(), nullable=True)
        # Create FK to seller(id)
        batch_op.create_foreign_key('fk_ticket_seller_id_seller', 'seller', ['seller_id'], ['id'])


def downgrade():
    # Reverse: drop FK and rename back to seller_data_id; recreate a nullable legacy seller_id
    with op.batch_alter_table('ticket', schema=None) as batch_op:
        try:
            batch_op.drop_constraint('fk_ticket_seller_id_seller', type_='foreignkey')
        except Exception:
            pass
        # Rename back
        batch_op.alter_column('seller_id', new_column_name='seller_data_id', existing_type=sa.Integer(), nullable=True)
        # Recreate legacy seller_id column (nullable) without FK
        try:
            batch_op.add_column(sa.Column('seller_id', sa.Integer(), nullable=True))
        except Exception:
            pass
