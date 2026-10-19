import React, { useState } from 'react';
import { useErp } from '../context/ErpContext';
import { calcPL, calcMonthMetrics } from '../utils/erpEngine';
import { fm } from '../utils/erpUtils';
import { Bar, Doughnut } from 'react-chartjs-2';

export default function ProfitAndLoss() {
  const { data } = useErp();
  const [period, setPeriod] = useState('m');

  const x = calcPL(data, period);

  const expenseBreakdown = {};
  x.E.forEach((e) => {
    expenseBreakdown[e.cat] = (expenseBreakdown[e.cat] || 0) + e.amt;
  });

  const grossMargin = x.rev > 0 ? Math.round((x.gp / x.rev) * 100) : 0;
  const netMargin = x.rev > 0 ? Math.round((x.net / x.rev) * 100) : 0;

  // 6 months chart
  const now = new Date();
  const monthsArr = [5, 4, 3, 2, 1, 0].map(
    (i) => new Date(now.getFullYear(), now.getMonth() - i, 1)
  );
  const monthlyData = monthsArr.map((d) => calcMonthMetrics(data, d));

  const multiChartData = {
    labels: monthsArr.map((d) => d.toLocaleString('en', { month: 'short' })),
    datasets: [
      {
        type: 'bar',
        label: 'Revenue',
        data: monthlyData.map((m) => m.rev),
        backgroundColor: '#0f766e',
        borderRadius: 4
      },
      {
        type: 'bar',
        label: 'COGS + Expenses',
        data: monthlyData.map((m) => m.cogs + m.ex),
        backgroundColor: '#f59e0b',
        borderRadius: 4
      },
      {
        type: 'line',
        label: 'Net Profit',
        data: monthlyData.map((m) => m.net),
        borderColor: '#dc2626',
        backgroundColor: '#dc2626',
        tension: 0.3,
        borderWidth: 2
      }
    ]
  };

  // Doughnut: Where revenue went
  const doughnutLabels = ['Cost of Goods (COGS)', ...Object.keys(expenseBreakdown), 'Net Profit'];
  const doughnutValues = [
    x.cogs,
    ...Object.values(expenseBreakdown),
    Math.max(x.net, 0)
  ];
  const doughnutColors = [
    '#f59e0b',
    '#4f46e5',
    '#0ea5e9',
    '#a855f7',
    '#ec4899',
    '#64748b',
    '#14b8a6',
    '#16a34a'
  ];

  const doughnutData = {
    labels: doughnutLabels,
    datasets: [
      {
        data: doughnutValues.map(Math.round),
        backgroundColor: doughnutValues.map((_, idx) =>
          idx === doughnutValues.length - 1 ? '#16a34a' : doughnutColors[idx % doughnutColors.length]
        )
      }
    ]
  };

  return (
    <div>
      <h2 className="top">
        <span>Profit and Loss Financial Statement</span>
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
      </h2>

      {/* KPI Cards */}
      <div className="kp">
        <div className="kc" style={{ '--k': '#0f766e' }}>
          <small>Net Revenue</small>
          <b>{fm(x.rev)}</b>
        </div>
        <div className="kc" style={{ '--k': '#4f46e5' }}>
          <small>Gross Profit</small>
          <b>{fm(x.gp)}</b>
        </div>
        <div className="kc" style={{ '--k': '#f59e0b' }}>
          <small>Total Operating Expenses</small>
          <b>{fm(x.ex)}</b>
        </div>
        <div className="kc" style={{ '--k': x.net < 0 ? '#dc2626' : '#16a34a' }}>
          <small>Net Profit</small>
          <b style={{ color: x.net < 0 ? 'var(--r)' : 'var(--g)' }}>{fm(x.net)}</b>
        </div>
        <div className="kc" style={{ '--k': '#0ea5e9' }}>
          <small>Net Profit Margin</small>
          <b>{netMargin}%</b>
        </div>
      </div>

      {/* Charts */}
      <div className="cols">
        <div className="card">
          <b style={{ fontSize: '15px', display: 'block', marginBottom: '12px' }}>
            Last 6 Months: Revenue, Costs & Net Profit
          </b>
          <div style={{ height: '270px' }}>
            <Bar data={multiChartData} options={{ maintainAspectRatio: false, responsive: true }} />
          </div>
        </div>

        <div className="card">
          <b style={{ fontSize: '15px', display: 'block', marginBottom: '12px' }}>
            Where Revenue Went (Selected Period)
          </b>
          <div style={{ height: '270px', display: 'flex', justifyContent: 'center' }}>
            {x.rev > 0 ? (
              <Doughnut data={doughnutData} options={{ maintainAspectRatio: false }} />
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', color: 'var(--m)' }}>
                No revenue in this period
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tables: Income Statement & GST */}
      <div className="cols">
        <div className="card tw">
          <b style={{ fontSize: '15px', display: 'block', marginBottom: '12px' }}>
            Income Statement
          </b>
          <table className="t">
            <tbody>
              <tr>
                <td>Sales (ex-GST)</td>
                <td className="r">{fm(x.gs)}</td>
              </tr>
              <tr>
                <td>Less: Sales Returns</td>
                <td className="r neg">-{fm(x.srt)}</td>
              </tr>
              <tr style={{ background: 'var(--p-light)', fontWeight: '700' }}>
                <td>Net Revenue</td>
                <td className="r">{fm(x.rev)}</td>
              </tr>
              <tr>
                <td>Less: Cost of Goods Sold (COGS)</td>
                <td className="r neg">-{fm(x.cogs)}</td>
              </tr>
              <tr style={{ background: 'var(--p-light)', fontWeight: '700' }}>
                <td>Gross Profit</td>
                <td className="r pos">{fm(x.gp)}</td>
              </tr>
              <tr>
                <td><small>Gross Margin %</small></td>
                <td className="r">{grossMargin}%</td>
              </tr>

              {Object.entries(expenseBreakdown).map(([cat, amt]) => (
                <tr key={cat}>
                  <td>Less: {cat}</td>
                  <td className="r neg">-{fm(amt)}</td>
                </tr>
              ))}

              <tr style={{ fontWeight: '600' }}>
                <td>Total Operating Expenses</td>
                <td className="r neg">-{fm(x.ex)}</td>
              </tr>
              <tr style={{ background: 'var(--p-light)', fontWeight: '800', fontSize: '15px' }}>
                <td>Net Profit</td>
                <td className={`r ${x.net < 0 ? 'neg' : 'pos'}`}>{fm(x.net)}</td>
              </tr>
              <tr>
                <td><small>Net Margin %</small></td>
                <td className="r">{netMargin}%</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="card tw">
          <b style={{ fontSize: '15px', display: 'block', marginBottom: '12px' }}>
            GST & Procurement Summary
          </b>
          <table className="t">
            <tbody>
              <tr>
                <td>GST Collected on Sales (Output GST)</td>
                <td className="r">{fm(x.out)}</td>
              </tr>
              <tr>
                <td>GST Paid on Purchases (Input Tax Credit)</td>
                <td className="r">{fm(x.inp)}</td>
              </tr>
              <tr style={{ background: 'var(--p-light)', fontWeight: '700' }}>
                <td>Net GST Payable / (Credit)</td>
                <td className="r" style={{ color: (x.out - x.inp) > 0 ? 'var(--r)' : 'var(--g)' }}>
                  {fm(x.out - x.inp)}
                </td>
              </tr>
              <tr>
                <td>Purchases (ex-GST, net of returns)</td>
                <td className="r">{fm(x.pur)}</td>
              </tr>
              <tr>
                <td>Of which Purchase Returns (Debit notes)</td>
                <td className="r">{fm(x.prt)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
