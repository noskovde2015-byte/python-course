"""remove server default from task type

Revision ID: e7e9e63a7160
Revises: 5fedc5041895
Create Date: 2026-04-10 11:23:25.762301

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "e7e9e63a7160"
down_revision: Union[str, Sequence[str], None] = "5fedc5041895"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    op.alter_column("tasks", "type", server_default=None)


def downgrade():
    op.alter_column("tasks", "type", server_default="quiz")
