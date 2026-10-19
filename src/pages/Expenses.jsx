import React, { useState } from 'react';
import { useErp } from '../context/ErpContext';
import { fm, sum, td, inR } from '../utils/erpUtils';
import { Plus, Trash2 } from 'lucide-react';

export default function Expenses() {
  const { data, addExpense, deleteExpense } = useErp();

  const [date, setDate] = useState(td());
  const [category, setCategory] = useState('Rent');
  const [amount, setAmount] = useState('');

  const thisMonthExpenses = data.exp.filter((e) => inR(e.date, 'm'));
  const thisYearExpenses = data.exp.filter((e) => inR(e.date, 'y'));

  const spentMonth = sum(thisMonthExpenses, (e) => e.amt);
  const spentYear = sum(thisYearExpenses, (e) => e.amt);

  const handleAdd = (e) => {
    e.preventDefault();
    const amtNum = Number(amount);
    if (!amtNum || amtNum <= 0) {
      alert('Please enter a valid expense amount.');
      return;
    }
    addExpense({
      date,
      cat: category,
      amt: amtNum
    });
    setAmount('');
  };

  return (
    <div>
      <h2 className="top">Business Operating Expenses</h2>

      {/* KPI Cards */}
      <div className="kp">
        <div className="kc" style={{ '--k': '#f59e0b' }}>
          <small>Spent This Month</small>
          <b>{fm(spentMonth)}</b>
        </div>
        <div className="kc" style={{ '--k': '#4f46e5' }}>
          <small>Spent This Year</small>
          <b>{fm(spentYear)}</b>
        </div>
        <div className="kc" style={{ '--k': '#0ea5e9' }}>
          <small>Total Recorded Entries</small>
          <b>{data.exp.length}</b>
        </div>
      </div>

      {/* Expense Form */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <b style={{ fontSize: '15px', display: 'block', marginBottom: '12px' }}>
          Record New Expense
        </b>
        <form onSubmit={handleAdd}>
          <div className="g3" style={{ marginBottom: '14px' }}>
            <label>
              Expense Date
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </label>
            <label>
              Category
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                {['Rent', 'Salary', 'Electricity', 'Transport', 'Marketing', 'Office Supplies', 'Maintenance', 'Other'].map(
                  (c) => (
                    <option key={c} value={c}>{c}</option>
                  )
                )}
              </select>
            </label>
            <label>
              Amount (₹)
              <input
                type="number"
                placeholder="e.g. 5000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </label>
          </div>
          <button type="submit" className="b pr">
            <Plus size={15} /> Add Expense
          </button>
        </form>
      </div>

      {/* Expense Ledger */}
      <div className="card tw">
        <b style={{ fontSize: '15px', display: 'block', marginBottom: '10px' }}>
          Expense Audit Trail
        </b>
        <table className="t">
          <thead>
            <tr>
              <th>Date</th>
              <th>Category</th>
              <th className="r">Amount</th>
              <th className="r">Action</th>
            </tr>
          </thead>
          <tbody>
            {data.exp.length > 0 ? (
              data.exp.map((e) => (
                <tr key={e.id}>
                  <td>{e.date}</td>
                  <td>
                    <span className="bd bo">{e.cat}</span>
                  </td>
                  <td className="r" style={{ fontWeight: '700', color: 'var(--r)' }}>
                    {fm(e.amt)}
                  </td>
                  <td className="r">
                    <button className="b danger" onClick={() => deleteExpense(e.id)}>
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', color: 'var(--m)' }}>
                  No expenses recorded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
