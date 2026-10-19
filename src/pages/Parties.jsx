import React from 'react';
import { useErp } from '../context/ErpContext';
import { fm, sum } from '../utils/erpUtils';
import { Plus, Phone, CreditCard } from 'lucide-react';

export default function Parties({ onOpenPartyModal, onOpenPay }) {
  const { data, getPartyBalance } = useErp();

  const customers = data.parties.filter((p) => p.type === 'C');
  const suppliers = data.parties.filter((p) => p.type === 'S');

  const toReceive = sum(customers, (p) => Math.max(getPartyBalance(p), 0));
  const toPay = sum(suppliers, (p) => Math.max(getPartyBalance(p), 0));

  return (
    <div>
      <h2 className="top">
        <span>Parties & Ledger Balances</span>
        <button className="b pr" onClick={onOpenPartyModal}>
          <Plus size={15} /> Add Party
        </button>
      </h2>

      {/* KPI Cards */}
      <div className="kp">
        <div className="kc" style={{ '--k': '#0f766e' }}>
          <small>Total Customers</small>
          <b>{customers.length}</b>
        </div>
        <div className="kc" style={{ '--k': '#4f46e5' }}>
          <small>Total Suppliers</small>
          <b>{suppliers.length}</b>
        </div>
        <div className="kc" style={{ '--k': '#16a34a' }}>
          <small>Total to Receive (Debtors)</small>
          <b>{fm(toReceive)}</b>
        </div>
        <div className="kc" style={{ '--k': '#dc2626' }}>
          <small>Total to Pay (Creditors)</small>
          <b>{fm(toPay)}</b>
        </div>
      </div>

      {/* Parties Table */}
      <div className="card tw">
        <table className="t">
          <thead>
            <tr>
              <th>Party Name</th>
              <th>Type</th>
              <th>Contact Phone</th>
              <th className="r">Net Balance Due</th>
              <th className="r">Action</th>
            </tr>
          </thead>
          <tbody>
            {data.parties.length > 0 ? (
              data.parties.map((p) => {
                const bal = getPartyBalance(p);
                const isCust = p.type === 'C';
                return (
                  <tr key={p.id}>
                    <td>
                      <b style={{ fontSize: '14.5px' }}>{p.name}</b>
                    </td>
                    <td>
                      <span className={`bd ${isCust ? 'bg' : 'bo'}`}>
                        {isCust ? 'Customer' : 'Supplier'}
                      </span>
                    </td>
                    <td>
                      {p.phone ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Phone size={13} style={{ color: 'var(--m)' }} />
                          {p.phone}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--m)' }}>-</span>
                      )}
                    </td>
                    <td
                      className="r"
                      style={{
                        fontWeight: '700',
                        fontSize: '14px',
                        color: bal > 0.5 ? (isCust ? 'var(--g)' : 'var(--r)') : 'inherit'
                      }}
                    >
                      {fm(bal)}
                    </td>
                    <td className="r">
                      {bal > 0.5 ? (
                        <button className="b pr" onClick={() => onOpenPay(p.id)}>
                          <CreditCard size={13} /> {isCust ? 'Receive Payment' : 'Make Payment'}
                        </button>
                      ) : (
                        <span style={{ color: 'var(--m)', fontSize: '12px' }}>Settled</span>
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', color: 'var(--m)' }}>
                  No parties registered yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
