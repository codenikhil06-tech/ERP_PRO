import React from 'react';
import { useErp } from '../context/ErpContext';
import { calcPL, calcMonthMetrics } from '../utils/erpEngine';
import { fm, sum } from '../utils/erpUtils';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  BarController,
  LineController,
  DoughnutController
} from 'chart.js';
import { Chart, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  BarController,
  LineController,
  DoughnutController
);

export default function Dashboard({ onOpenDoc, onOpenPay }) {
  const { data, getPartyBalance } = useErp();

  const m = calcPL(data, 'm');
  const lowStockProducts = data.products.filter((p) => p.stock <= p.min);

  const stockValue = sum(data.products, (p) => p.stock * p.cost);
  const toReceive = sum(
    data.parties.filter((p) => p.type === 'C'),
    (p) => Math.max(getPartyBalance(p), 0)
  );
  const toPay = sum(
    data.parties.filter((p) => p.type === 'S'),
    (p) => Math.max(getPartyBalance(p), 0)
  );

  // 6 months revenue, purchases, net profit
  const now = new Date();
  const monthsArr = [5, 4, 3, 2, 1, 0].map(
    (i) => new Date(now.getFullYear(), now.getMonth() - i, 1)
  );
  const monthlyMetrics = monthsArr.map((d) => calcMonthMetrics(data, d));

  const multiChartData = {
    labels: monthsArr.map((d) => d.toLocaleString('en', { month: 'short' })),
    datasets: [
      {
        type: 'bar',
        label: 'Sales',
        data: monthlyMetrics.map((x) => x.rev),
        backgroundColor: '#0f766e',
        borderRadius: 4
      },
      {
        type: 'bar',
        label: 'Purchases',
        data: monthlyMetrics.map((x) => x.pur),
        backgroundColor: '#f59e0b',
        borderRadius: 4
      },
      {
        type: 'line',
        label: 'Net Profit',
        data: monthlyMetrics.map((x) => x.net),
        borderColor: '#dc2626',
        backgroundColor: '#dc2626',
        tension: 0.3,
        borderWidth: 2
      }
    ]
  };

  // Top products by revenue
  const topSalesMap = {};
  data.sal.forEach((d) => {
    (d.items || []).forEach((i) => {
      topSalesMap[i.p] = (topSalesMap[i.p] || 0) + i.q * i.r;
    });
  });
  const topSorted = Object.entries(topSalesMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const doughnutData = {
    labels: topSorted.map(([id]) => {
      const p = data.products.find((prod) => prod.id === id);
      return p ? p.name : 'Unknown';
    }),
    datasets: [
      {
        data: topSorted.map(([, val]) => Math.round(val)),
        backgroundColor: ['#0f766e', '#f59e0b', '#4f46e5', '#dc2626', '#0ea5e9']
      }
    ]
  };

  const handleReorder = (prodList) => {
    const prefill = prodList.map((p) => ({
      p: p.id,
      q: Math.max(p.min * 3 - p.stock, 1),
      r: Math.round(p.cost),
      g: p.g
    }));
    onOpenDoc('pur', prefill, prodList[0]?.sup || '');
  };

  return (
    <div>
      <h2 className="top">
        <span>Dashboard</span>
        <span style={{ fontSize: '13px', color: 'var(--m)', fontWeight: '400' }}>
          {new Date().toDateString()}
        </span>
      </h2>

      {/* KPI Cards */}
      <div className="kp">
        <div className="kc" style={{ '--k': '#0f766e' }}>
          <small>Sales this month</small>
          <b>{fm(m.rev)}</b>
        </div>
        <div className="kc" style={{ '--k': '#4f46e5' }}>
          <small>Gross profit</small>
          <b>{fm(m.gp)}</b>
        </div>
        <div className="kc" style={{ '--k': '#16a34a' }}>
          <small>Net profit</small>
          <b style={{ color: m.net < 0 ? 'var(--r)' : 'var(--g)' }}>{fm(m.net)}</b>
        </div>
        <div className="kc" style={{ '--k': '#f59e0b' }}>
          <small>Stock value</small>
          <b>{fm(stockValue)}</b>
        </div>
        <div className="kc" style={{ '--k': '#0ea5e9' }}>
          <small>To receive</small>
          <b>{fm(toReceive)}</b>
        </div>
        <div className="kc" style={{ '--k': '#dc2626' }}>
          <small>To pay</small>
          <b>{fm(toPay)}</b>
        </div>
        <div className="kc" style={{ '--k': '#c2710c' }}>
          <small>Items to reorder</small>
          <b style={{ color: lowStockProducts.length ? 'var(--o)' : 'inherit' }}>
            {lowStockProducts.length}
          </b>
        </div>
      </div>

      {/* Charts Section */}
      <div className="cols">
        <div className="card">
          <b style={{ display: 'block', marginBottom: '14px', fontSize: '15px' }}>
            Sales, Purchases and Net Profit (6 months)
          </b>
          <div style={{ height: '260px' }}>
            <Chart type="bar" data={multiChartData} options={{ maintainAspectRatio: false, responsive: true }} />
          </div>
        </div>

        <div className="card">
          <b style={{ display: 'block', marginBottom: '14px', fontSize: '15px' }}>
            Top Products by Revenue
          </b>
          <div style={{ height: '260px', display: 'flex', justifyContent: 'center' }}>
            {topSorted.length > 0 ? (
              <Doughnut data={doughnutData} options={{ maintainAspectRatio: false }} />
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', color: 'var(--m)' }}>No sales data yet</div>
            )}
          </div>
        </div>
      </div>

      {/* Low Stock & Outstanding Balances */}
      <div className="cols">
        <div className="card tw">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <b style={{ fontSize: '15px' }}>Low Stock Alert</b>
            {lowStockProducts.length > 0 && (
              <button className="b pr" onClick={() => handleReorder(lowStockProducts)}>
                Create Purchase for All
              </button>
            )}
          </div>
          <table className="t">
            <thead>
              <tr>
                <th>Product</th>
                <th className="r">Stock</th>
                <th className="r">Min Level</th>
                <th className="r">Action</th>
              </tr>
            </thead>
            <tbody>
              {lowStockProducts.length > 0 ? (
                lowStockProducts.map((p) => (
                  <tr key={p.id}>
                    <td><b>{p.name}</b></td>
                    <td className="r" style={{ color: 'var(--r)', fontWeight: '700' }}>{p.stock}</td>
                    <td className="r">{p.min}</td>
                    <td className="r">
                      <button className="b" onClick={() => handleReorder([p])}>
                        Reorder
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} style={{ color: 'var(--m)', textAlign: 'center' }}>
                    All items are above reorder level.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="card tw">
          <b style={{ display: 'block', marginBottom: '10px', fontSize: '15px' }}>
            Outstanding Dues & Balances
          </b>
          <table className="t">
            <thead>
              <tr>
                <th>Party</th>
                <th>Type</th>
                <th className="r">Amount Due</th>
                <th className="r">Action</th>
              </tr>
            </thead>
            <tbody>
              {data.parties.filter((p) => getPartyBalance(p) > 0.5).length > 0 ? (
                data.parties
                  .filter((p) => getPartyBalance(p) > 0.5)
                  .map((p) => {
                    const bal = getPartyBalance(p);
                    return (
                      <tr key={p.id}>
                        <td><b>{p.name}</b></td>
                        <td>
                          <span className={`bd ${p.type === 'C' ? 'bg' : 'bo'}`}>
                            {p.type === 'C' ? 'Customer' : 'Supplier'}
                          </span>
                        </td>
                        <td className="r" style={{ fontWeight: '700', color: p.type === 'C' ? 'var(--g)' : 'var(--r)' }}>
                          {fm(bal)}
                        </td>
                        <td className="r">
                          <button className="b pr" onClick={() => onOpenPay(p.id)}>
                            {p.type === 'C' ? 'Receive' : 'Pay'}
                          </button>
                        </td>
                      </tr>
                    );
                  })
              ) : (
                <tr>
                  <td colSpan={4} style={{ color: 'var(--m)', textAlign: 'center' }}>
                    No dues pending. All settled!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
