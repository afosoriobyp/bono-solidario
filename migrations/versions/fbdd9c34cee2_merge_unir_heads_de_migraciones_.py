"""Merge: Unir heads de migraciones divergentes

Revision ID: fbdd9c34cee2
Revises: 20260204_finalize_ticket_seller_fk, b1c2d3e4f5a6
Create Date: 2026-02-04 10:10:55.737135

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'fbdd9c34cee2'
down_revision = ('20260204_finalize_ticket_seller_fk', 'b1c2d3e4f5a6')
branch_labels = None
depends_on = None


def upgrade():
    pass


def downgrade():
    pass
