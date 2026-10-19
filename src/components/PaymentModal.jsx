import React, { useState } from 'react';
import Modal from './Modal';
import { useErp } from '../context/ErpContext';
import { fm } from '../utils/erpUtils';

export default function PaymentModal({ isOpen, onClose, partyId }) {
  const { data, getPartyBalance, recordPayment } = useErp();
  const party = partyId ? data.parties.find((p) => p.id === partyId) : null;
  const balance = party ? getPartyBalance(party) : 0;

  const [amount, setAmount] = useState(balance > 0 ? Math.round(balance) : 0);

  if (!party) return null;

  const isCustomer = party.type === 'C';

  const handleRecord = () => {
    if (!amount || Number(amount) <= 0) {
      alert('Please enter a valid amount.');
      return;
    }
    const success = recordPayment(partyId, amount);
    if (success) {
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isCustomer ? `Receive Payment from ${party.name}` : `Pay Supplier: ${party.name}`}
      maxWidth="480px"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div
          style={{
            background: 'var(--bg)',
            padding: '14px',
            borderRadius: '8px',
            border: '1px solid var(--b)',
          }}
        >
          <div style={{ color: 'var(--m)', fontSize: '13px' }}>Current Outstanding Balance</div>
          <div style={{ fontSize: '24px', fontWeight: '800', color: balance > 0 ? 'var(--r)' : 'var(--g)', marginTop: '4px' }}>
            {fm(balance)}
          </div>
          <small style={{ color: 'var(--m)', marginTop: '6px', display: 'block' }}>
            Payments are automatically applied to the oldest unpaid invoices/bills first.
          </small>
        </div>

        <label>
          Amount to {isCustomer ? 'Receive' : 'Pay'} (₹)
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter payment amount"
            autoFocus
          />
        </label>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button className="b" onClick={onClose}>Cancel</button>
          <button className="b pr" onClick={handleRecord}>
            Record Payment
          </button>
        </div>
      </div>
    </Modal>
  );
}
