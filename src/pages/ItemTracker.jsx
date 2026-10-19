import React, { useState } from 'react';
import { useErp } from '../context/ErpContext';
import { rng, fm, sum } from '../utils/erpUtils';

export default function ItemTracker() {
  const { data, getProduct, getPartyName } = useErp();

  const [filterItem, setFilterItem] = useState('');
  const [filterPeriod, setFilterPeriod] = useState('all');
  const [filterType, setFilterType] = useState('');

  const r = rng(filterPeriod);
  const movements = [];

  ['pur', 'sal', 'sr', 'pr'].forEach((t) => {
    if (filterType && filterType !== t) return;
    (data[t] || []).forEach((d) => {
      if (d.date < r[0] || d.date >= r[1]) return;
      (d.items || []).forEach((i) => {
        if (filterItem && i.p !== filterItem) return;
        movements.push({ t, d, i });
      });
    });
  });

  movements.sort(
    (a, b) =>
      b.d.date.localeCompare(a.d.date) || b.d.no.localeCompare(a.d.no)
  );

  const sumQty = (type) =>
    sum(movements.filter((x) => x.t === type), (x) => x.i.q);

  const purQty = sumQty('pur');
  const salQty = sumQty('sal');
  const srQty = sumQty('sr');
  const prQty = sumQty('pr');
  const netMovement = purQty + srQty - salQty - prQty;

  // Party aggregate
  const partyMap = {};
  const itemMap = {};

  movements.forEach((x) => {
    // Party
    const partyObj =
      (partyMap[x.d.party] = partyMap[x.d.party] || {
        pur: 0,
        sal: 0,
        sr: 0,
        pr: 0,
        purv: 0,
        salv: 0,
        srv: 0,
        prv: 0
      });
    partyObj[x.t] += x.i.q;
    partyObj[x.t + 'v'] += x.i.q * x.i.r;

    // Item
    const itmObj =
      (itemMap[x.i.p] = itemMap[x.i.p] || {
        pur: 0,
        sal: 0,
        sr: 0,
        pr: 0
      });
    itmObj[x.t] += x.i.q;
  });

  const typeLabels = {
    pur: ['Purchase', 'bb'],
    sal: ['Sale', 'bg'],
    sr: ['Sales Return', 'bo'],
    pr: ['Pur Return', 'br']
  };

  return (
    <div>
      <h2 className="top">Item Tracker & Movement History</h2>

      {/* Filters */}
      <div className="card" style={{ marginBottom: '18px' }}>
        <div className="g3">
          <label>
            Filter Item
            <select value={filterItem} onChange={(e) => setFilterItem(e.target.value)}>
              <option value="">All Items</option>
              {data.products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Period
            <select value={filterPeriod} onChange={(e) => setFilterPeriod(e.target.value)}>
              <option value="all">All Time</option>
              <option value="m">This Month</option>
              <option value="l">Last Month</option>
              <option value="y">This Year</option>
            </select>
          </label>
          <label>
            Movement Type
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
              <option value="">All Movements</option>
              <option value="pur">Purchases</option>
              <option value="sal">Sales</option>
              <option value="sr">Sales Returns</option>
              <option value="pr">Purchase Returns</option>
            </select>
          </label>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="kp">
        <div className="kc" style={{ '--k': '#0ea5e9' }}>
          <small>Purchased Units</small>
          <b>{purQty}</b>
        </div>
        <div className="kc" style={{ '--k': '#16a34a' }}>
          <small>Sold Units</small>
          <b>{salQty}</b>
        </div>
        <div className="kc" style={{ '--k': '#f59e0b' }}>
          <small>Sales Returned</small>
          <b>{srQty}</b>
        </div>
        <div className="kc" style={{ '--k': '#dc2626' }}>
          <small>Purchase Returned</small>
          <b>{prQty}</b>
        </div>
        <div className="kc" style={{ '--k': '#4f46e5' }}>
          <small>Net Stock Movement</small>
          <b style={{ color: netMovement < 0 ? 'var(--r)' : 'var(--g)' }}>{netMovement}</b>
        </div>
      </div>

      {/* Items Summary Units */}
      {!filterItem && (
        <div className="card tw" style={{ marginBottom: '20px' }}>
          <b style={{ fontSize: '15px', display: 'block', marginBottom: '10px' }}>
            Item Summary (Units in Period)
          </b>
          <table className="t">
            <thead>
              <tr>
                <th>Item Name</th>
                <th className="r">Purchased</th>
                <th className="r">Sold</th>
                <th className="r">Sales Return</th>
                <th className="r">Pur Return</th>
                <th className="r">Net Sold</th>
                <th className="r">Quick Action</th>
              </tr>
            </thead>
            <tbody>
              {Object.keys(itemMap).length > 0 ? (
                Object.entries(itemMap).map(([pId, m]) => (
                  <tr key={pId}>
                    <td><b>{getProduct(pId).name}</b></td>
                    <td className="r">{m.pur}</td>
                    <td className="r">{m.sal}</td>
                    <td className="r">{m.sr}</td>
                    <td className="r">{m.pr}</td>
                    <td className="r" style={{ fontWeight: '700' }}>{m.sal - m.sr}</td>
                    <td className="r">
                      <button className="b" onClick={() => setFilterItem(pId)}>
                        Track Item
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', color: 'var(--m)' }}>
                    No movements for the selected filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Party Distribution */}
      <div className="card tw" style={{ marginBottom: '20px' }}>
        <b style={{ fontSize: '15px', display: 'block', marginBottom: '10px' }}>
          Party Distribution Breakdown
        </b>
        <table className="t">
          <thead>
            <tr>
              <th>Party</th>
              <th>Type</th>
              <th className="r">Purchased</th>
              <th className="r">Sold</th>
              <th className="r">Sales Return</th>
              <th className="r">Pur Return</th>
              <th className="r">Net Qty</th>
              <th className="r">Net Value (ex-GST)</th>
            </tr>
          </thead>
          <tbody>
            {Object.keys(partyMap).length > 0 ? (
              Object.entries(partyMap).map(([partyId, o]) => {
                const party = data.parties.find((p) => p.id === partyId) || {};
                const isCust = party.type === 'C';
                const nq = isCust ? o.sal - o.sr : o.pur - o.pr;
                const nv = isCust ? o.salv - o.srv : o.purv - o.prv;

                return (
                  <tr key={partyId}>
                    <td><b>{party.name || 'Unknown'}</b></td>
                    <td>
                      <span className={`bd ${isCust ? 'bg' : 'bo'}`}>
                        {isCust ? 'Customer' : 'Supplier'}
                      </span>
                    </td>
                    <td className="r">{o.pur}</td>
                    <td className="r">{o.sal}</td>
                    <td className="r">{o.sr}</td>
                    <td className="r">{o.pr}</td>
                    <td className="r"><b>{nq}</b></td>
                    <td className="r" style={{ fontWeight: '600' }}>{fm(nv)}</td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', color: 'var(--m)' }}>
                  No movement for this filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Movement Log */}
      <div className="card tw">
        <b style={{ fontSize: '15px', display: 'block', marginBottom: '10px' }}>
          Movement Audit Log (Latest 200 Entries)
        </b>
        <table className="t">
          <thead>
            <tr>
              <th>Date</th>
              <th>Type</th>
              <th>Doc No</th>
              <th>Party</th>
              <th>Item</th>
              <th className="r">Quantity</th>
              <th className="r">Rate</th>
              <th className="r">Amount</th>
            </tr>
          </thead>
          <tbody>
            {movements.length > 0 ? (
              movements.slice(0, 200).map((x, idx) => {
                const isIncoming = x.t === 'pur' || x.t === 'sr';
                const badge = typeLabels[x.t] || ['Doc', 'bb'];
                return (
                  <tr key={idx}>
                    <td>{x.d.date}</td>
                    <td><span className={`bd ${badge[1]}`}>{badge[0]}</span></td>
                    <td><span style={{ fontFamily: 'var(--font-mono)' }}>{x.d.no}</span></td>
                    <td>{getPartyName(x.d.party)}</td>
                    <td><b>{getProduct(x.i.p).name}</b></td>
                    <td className={`r ${isIncoming ? 'pos' : 'neg'}`} style={{ fontWeight: '700' }}>
                      {isIncoming ? '+' : '-'}{x.i.q}
                    </td>
                    <td className="r">{fm(x.i.r)}</td>
                    <td className="r">{fm(x.i.q * x.i.r)}</td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', color: 'var(--m)' }}>
                  No records match the current criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
