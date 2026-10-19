import React, { useState } from 'react';
import { useErp } from '../context/ErpContext';
import { rng, fm, sum, td, ymd } from '../utils/erpUtils';
import { Bar } from 'react-chartjs-2';

export default function ItemPerformance() {
  const { data } = useErp();
  const [period, setPeriod] = useState('all');

  const r = rng(period);

  // Calculate days in period
  const allDates = [...data.sal, ...data.pur].map((d) => d.date).sort();
  const startDate = period === 'all' ? (allDates[0] || td()) : r[0];
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const endDate = r[1] < ymd(tomorrow) ? r[1] : ymd(tomorrow);
  const numDays = Math.max(1, Math.round((new Date(endDate) - new Date(startDate)) / 864e5));

  const rows = data.products.map((p) => {
    let u = 0;
    let rev = 0;
    let cost = 0;
    let last = '';

    data.sal.forEach((d) => {
      (d.items || []).forEach((i) => {
        if (i.p !== p.id) return;
        if (d.date > last) last = d.date;
        if (d.date >= r[0] && d.date < r[1]) {
          u += i.q;
          rev += i.q * i.r;
          cost += i.q * (i.c || p.cost);
        }
      });
    });

    data.sr.forEach((d) => {
      (d.items || []).forEach((i) => {
        if (i.p === p.id && d.date >= r[0] && d.date < r[1]) {
          u -= i.q;
          rev -= i.q * i.r;
          cost -= i.q * (i.c || p.cost);
        }
      });
    });

    const dailyAvg = u / numDays;
    const cover = u > 0 && dailyAvg > 0 ? Math.round(p.stock / dailyAvg) : null;

    return {
      p,
      u,
      rev,
      pf: rev - cost,
      last,
      cover
    };
  });

  const maxUnits = Math.max(1, ...rows.map((x) => x.u));
  rows.forEach((x) => {
    x.c = x.u <= 0 ? 'none' : x.u >= maxUnits * 0.5 ? 'fast' : 'slow';
  });

  rows.sort((a, b) => b.u - a.u);

  const topSeller = rows[0];
  const fastItems = rows.filter((x) => x.c === 'fast');
  const slowItems = rows.filter((x) => x.c === 'slow');
  const deadItems = rows.filter((x) => x.c === 'none');
  const deadStockValue = sum(deadItems, (x) => x.p.stock * x.p.cost);

  const advice = (x) => {
    if (x.c === 'fast') {
      return x.cover != null && x.cover < 15
        ? 'Reorder immediately (Stock low)'
        : 'Healthy performer, maintain inventory';
    }
    if (x.c === 'slow') {
      return 'Promote or give discounts; reduce purchase size';
    }
    return x.p.stock > 0
      ? 'Dead stock: Clear with clearance sale, stop purchasing'
      : 'No stock and zero sales: Archive item';
  };

  const chartData = {
    labels: rows.map((x) => x.p.name),
    datasets: [
      {
        label: 'Units Sold',
        data: rows.map((x) => x.u),
        backgroundColor: rows.map((x) =>
          x.c === 'fast' ? '#16a34a' : x.c === 'slow' ? '#f59e0b' : '#dc2626'
        ),
        borderRadius: 4
      }
    ]
  };

  return (
    <div>
      <h2 className="top">
        <span>Item Performance & Velocity Analytics</span>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          style={{ width: 'auto' }}
        >
          <option value="all">All Time</option>
          <option value="m">This Month</option>
          <option value="l">Last Month</option>
          <option value="y">This Year</option>
        </select>
      </h2>

      {/* KPI Cards */}
      <div className="kp">
        <div className="kc" style={{ '--k': '#0f766e' }}>
          <small>Top Best Seller</small>
          <b>{topSeller && topSeller.u > 0 ? `${topSeller.p.name} (${topSeller.u} pcs)` : 'None'}</b>
        </div>
        <div className="kc" style={{ '--k': '#16a34a' }}>
          <small>Fast Moving Items</small>
          <b>{fastItems.length}</b>
        </div>
        <div className="kc" style={{ '--k': '#f59e0b' }}>
          <small>Slow Moving Items</small>
          <b>{slowItems.length}</b>
        </div>
        <div className="kc" style={{ '--k': '#dc2626' }}>
          <small>Non-Selling Items</small>
          <b>{deadItems.length}</b>
        </div>
        <div className="kc" style={{ '--k': '#4f46e5' }}>
          <small>Capital Stuck in Dead Stock</small>
          <b style={{ color: 'var(--r)' }}>{fm(deadStockValue)}</b>
        </div>
      </div>

      {/* Horizontal Bar Chart for Velocity */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <b style={{ fontSize: '15px', display: 'block', marginBottom: '12px' }}>
          Net Units Sold per Item
        </b>
        <div style={{ height: `${Math.max(200, rows.length * 36 + 40)}px` }}>
          <Bar
            data={chartData}
            options={{
              indexAxis: 'y',
              maintainAspectRatio: false,
              plugins: { legend: { display: false } }
            }}
          />
        </div>
      </div>

      {/* Velocity Categories Summary */}
      <div className="cols">
        <div className="card tw">
          <span className="bd bg" style={{ marginBottom: '10px' }}>Fast Moving</span>
          <table className="t">
            <tbody>
              {fastItems.length > 0 ? (
                fastItems.map((x) => (
                  <tr key={x.p.id}>
                    <td><b>{x.p.name}</b></td>
                    <td className="r" style={{ color: 'var(--g)', fontWeight: '700' }}>{x.u} units</td>
                  </tr>
                ))
              ) : (
                <tr><td style={{ color: 'var(--m)' }}>None</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="card tw">
          <span className="bd bo" style={{ marginBottom: '10px' }}>Slow Moving</span>
          <table className="t">
            <tbody>
              {slowItems.length > 0 ? (
                slowItems.map((x) => (
                  <tr key={x.p.id}>
                    <td><b>{x.p.name}</b></td>
                    <td className="r" style={{ color: 'var(--o)', fontWeight: '700' }}>{x.u} units</td>
                  </tr>
                ))
              ) : (
                <tr><td style={{ color: 'var(--m)' }}>None</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="card tw">
          <span className="bd br" style={{ marginBottom: '10px' }}>Not Selling (Dead Stock)</span>
          <table className="t">
            <tbody>
              {deadItems.length > 0 ? (
                deadItems.map((x) => (
                  <tr key={x.p.id}>
                    <td><b>{x.p.name}</b></td>
                    <td className="r" style={{ color: 'var(--r)', fontWeight: '700' }}>{x.u} units</td>
                  </tr>
                ))
              ) : (
                <tr><td style={{ color: 'var(--m)' }}>None</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Full Velocity Ledger */}
      <div className="card tw">
        <table className="t">
          <thead>
            <tr>
              <th>#</th>
              <th>Item Name</th>
              <th>Classification</th>
              <th className="r">Units Sold</th>
              <th className="r">Revenue</th>
              <th className="r">Gross Profit</th>
              <th className="r">Live Stock</th>
              <th className="r">Stock Cover</th>
              <th>Last Sold</th>
              <th>AI Strategic Recommendation</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((x, i) => (
              <tr key={x.p.id}>
                <td>{i + 1}</td>
                <td><b>{x.p.name}</b></td>
                <td>
                  <span
                    className={`bd ${
                      x.c === 'fast' ? 'bg' : x.c === 'slow' ? 'bo' : 'br'
                    }`}
                  >
                    {x.c === 'fast' ? 'Fast' : x.c === 'slow' ? 'Slow' : 'Non-Selling'}
                  </span>
                </td>
                <td className="r" style={{ fontWeight: '700' }}>{x.u}</td>
                <td className="r">{fm(x.rev)}</td>
                <td className="r" style={{ color: x.pf < 0 ? 'var(--r)' : 'var(--g)', fontWeight: '600' }}>
                  {fm(x.pf)}
                </td>
                <td className="r">{x.p.stock}</td>
                <td className="r" style={{ fontWeight: '600' }}>
                  {x.cover != null ? `~${x.cover} days` : '-'}
                </td>
                <td>{x.last || 'Never'}</td>
                <td style={{ fontSize: '12.5px', color: 'var(--m)' }}>{advice(x)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <small style={{ display: 'block', marginTop: '10px', color: 'var(--m)' }}>
          Classification rules: Fast = at least 50% of the top seller's units. Slow = sold some units but under 50%. Non-selling = 0 units sold in the period.
        </small>
      </div>
    </div>
  );
}
