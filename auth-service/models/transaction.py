from db import db  

class Transaction(db.Model):
    __tablename__ = 'transactions'

    transaction_id = db.Column(db.String(255), primary_key=True)
    status = db.Column(db.String(255), nullable=False)  # 'pending', 'prepared', 'committed', 'aborted'
    data = db.Column(db.JSON, nullable=True)  # Stores the transaction data as JSON for simplicity