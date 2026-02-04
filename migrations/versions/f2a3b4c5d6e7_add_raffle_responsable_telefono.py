"""add responsable and telefono to raffle

Revision ID: f2a3b4c5d6e7
Revises: e7b4a2f6c1d2
Create Date: 2026-01-28 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'f2a3b4c5d6e7'
down_revision = 'e7b4a2f6c1d2'
branch_labels = None
depends_on = None


def upgrade():
    # Añadir columnas responsable y telefono a la tabla raffle
    with op.batch_alter_table('raffle', schema=None) as batch_op:
        batch_op.add_column(sa.Column('responsable', sa.String(length=100), nullable=True))
        batch_op.add_column(sa.Column('telefono', sa.String(length=50), nullable=True))


def downgrade():
    # Eliminar columnas en downgrade
    with op.batch_alter_table('raffle', schema=None) as batch_op:
        batch_op.drop_column('telefono')
        batch_op.drop_column('responsable')
