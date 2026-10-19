import React, { useState } from 'react';
import { useErp } from '../context/ErpContext';
import { calcStockMovement } from '../utils/erpEngine';
import { fm, sum } from '../utils/erpUtils';
import { Plus } from 'lucide-react';
import { Bar } from 'react-chartjs-2';

export default function Inventory({ onOpenProductModal }) {
  const { data } = useErp();
  const [period, setPeriod] = useState('m');

  const rows = data.products.map((p) => ({
    p,
    m: calcStockMovement(p, data, period)
  }));

  const sumKey = (k) => sum(rows, (r) => r.m[k] || 0);

  const totalStockValue = sum(data.products, (p) => p.stock * p.cost);
  const totalUnits = sum(data.products, (p) => p.stock);
  const lowOrOut = data.products.filter((p) => p.stock <= p.min).length;
  const netSoldPeriod = sumKey('sa') - sumKey('sr');

  const chartData = {
    labels: data.products.map((p) => p.name),
    datasets: [
      {
        type: 'bar',
        label: 'Current Stock',
        data: data.products.map((p) => p.stock),
        backgroundColor: data.products.map((p) => (p.stock <= p.min ? '#f59e0b' : '#0f766e')),
        borderRadius: 4
      },
      {
        type: 'line',
        label: 'Reorder Level',
        data: data.products.map((p) => p.min),
        borderColor: '#dc2626',
        borderDash: [5, 4],
        borderWidth: 2,
        pointRadius: 3
      }
    ]
  };

  return (
    <div>
      <h2 className="top">
        <span>Inventory & Stock Ledger</span>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            style={{ width: 'auto' }}
          >
            <option value="m">This Month</option>
            <option value="l">Last Month</option>
            <option value="y">This Year</option>
            <option value="all">All Time</option>
          </select>
          <button className="b pr" onClick={() => onOpenProductModal(null)}>
            <Plus size={15} /> New Product
          </button>
        </div>
      </h2>

      {/* KPI Cards */}
      <div className="kp">
        <div className="kc" style={{ '--k': '#0f766e' }}>
          <small>Stock Value Live</small>
          <b>{fm(totalStockValue)}</b>
        </div>
        <div className="kc" style={{ '--k': '#4f46e5' }}>
          <small>Total Units in Stock</small>
          <b>{totalUnits}</b>
        </div>
        <div className="kc" style={{ '--k': '#f59e0b' }}>
          <small>Low or Out of Stock</small>
          <b style={{ color: lowOrOut > 0 ? 'var(--o)' : 'inherit' }}>{lowOrOut}</b>
        </div>
        <div className="kc" style={{ '--k': '#0ea5e9' }}>
          <small>Net Units Sold (Period)</small>
          <b>{netSoldPeriod}</b>
        </div>
      </div>

      {/* Stock vs Reorder Chart */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <b style={{ display: 'block', marginBottom: '12px', fontSize: '15px' }}>
          Current Stock vs Reorder Level
        </b>
        <div style={{ height: '240px' }}>
          <Bar data={chartData} options={{ maintainAspectRatio: false, responsive: true }} />
        </div>
      </div>

      {/* Live Movement Ledger Table */}
      <div className="card tw">
        <table className="t">
          <thead>
            <tr>
              <th>Product Details</th>
              <th className="r">Opening (+)</th>
              <th className="r">Purchase (+)</th>
              <th className="r">Sales (−)</th>
              <th className="r">Sales Return (+)</th>
              <th className="r">Pur Return (−)</th>
              <th className="r">Live Stock</th>
              <th className="r">Stock Value</th>
              <th>Status</th>
              <th className="r">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ p, m }) => (
              <tr key={p.id}>
                <td>
                  <b>{p.name}</b>
                  <br />
                  <small style={{ color: 'var(--m)' }}>
                    {p.sku} | Cost: {fm(p.cost)} | Price: {fm(p.price)}
                  </small>
                </td>
                <td className="r">{m.op}</td>
                <td className="r pos">+{m.pu}</td>
                <td className="r neg">-{m.sa}</td>
                <td className="r pos">+{m.sr}</td>
                <td className="r neg">-{m.pr}</td>
                <td className="r">
                  <b style={{ fontSize: '15px' }}>{p.stock}</b>
                </td>
                <td className="r">{fm(p.stock * p.cost)}</td>
                <td>
                  <span
                    className={`bd ${
                      p.stock <= 0 ? 'br' : p.stock <= p.min ? 'bo' : 'bg'
                    }`}
                  >
                    {p.stock <= 0 ? 'Out of stock' : p.stock <= p.min ? 'Low stock' : 'OK'}
                  </span>
                </td>
                <td className="r">
                  <button className="b" onClick={() => onOpenProductModal(p.id)}>
                    Edit
                  </button>
                </td>
              </tr>
            ))}
            <tr style={{ background: 'var(--p-light)', fontWeight: '700' }}>
              <td>Total</td>
              <td className="r">{sumKey('op')}</td>
              <td className="r pos">+{sumKey('pu')}</td>
              <td className="r neg">-{sumKey('sa')}</td>
              <td className="r pos">+{sumKey('sr')}</td>
              <td className="r neg">-{sumKey('pr')}</td>
              <td className="r">{sum(data.products, (p) => p.stock)}</td>
              <td className="r">{fm(totalStockValue)}</td>
              <td></td>
              <td></td>
            </tr>
          </tbody>
        </table>
      </div>
      <small style={{ display: 'block', marginTop: '10px', color: 'var(--m)' }}>
        Opening and movement columns update dynamically according to the selected period. Live stock is current inventory.
      </small>
    </div>
  );
}
