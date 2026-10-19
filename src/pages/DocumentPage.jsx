import React, { useState } from 'react';
import { useErp } from '../context/ErpContext';
import { fm, sum, inR, stc } from '../utils/erpUtils';
import { Plus, Eye, Trash2, ArrowRight } from 'lucide-react';

export default function DocumentPage({
  type, // 'sal' | 'pur' | 'quo'
  onOpenNewDoc,
  onViewDoc,
  onConvertToInvoice
}) {
  const { data, getPartyName, voidDocument } = useErp();
  const [subTab, setSubTab] = useState('docs'); // 'docs' | 'rets'

  const isSales = type === 'sal';
  const isPur = type === 'pur';
  const isQuo = type === 'quo';

  // Config mapping
  const titles = {
    sal: {
      title: 'Sales & Invoices',
      btn: 'New Invoice',
      partyCol: 'Customer',
      docKey: 'sal',
      retKey: 'sr',
      retTitle: 'Sales Returns (Credit Notes)',
      retBtn: 'New Sales Return'
    },
    pur: {
      title: 'Purchases & Bills',
      btn: 'New Purchase Order',
      partyCol: 'Supplier',
      docKey: 'pur',
      retKey: 'pr',
      retTitle: 'Purchase Returns (Debit Notes)',
      retBtn: 'New Purchase Return'
    },
    quo: {
      title: 'Quotations & Estimates',
      btn: 'New Quotation',
      partyCol: 'Customer',
      docKey: 'quo'
    }
  }[type];

  const docs = data[titles.docKey] || [];
  const rets = titles.retKey ? data[titles.retKey] || [] : [];

  // KPIs
  let kpis = [];
  if (isSales) {
    const thisMonth = docs.filter((d) => inR(d.date, 'm'));
    kpis = [
      ['Total Invoices', docs.length, '#0f766e'],
      ['Billed This Month', fm(sum(thisMonth, (x) => x.total)), '#4f46e5'],
      ['Payment Collected', fm(sum(docs, (x) => x.paid)), '#16a34a'],
      ['Pending Receivable', fm(sum(docs, (x) => x.total - x.paid)), '#dc2626']
    ];
  } else if (isPur) {
    const thisMonth = docs.filter((d) => inR(d.date, 'm'));
    kpis = [
      ['Total Purchases', docs.length, '#0f766e'],
      ['Bought This Month', fm(sum(thisMonth, (x) => x.total)), '#4f46e5'],
      ['Total Paid', fm(sum(docs, (x) => x.paid)), '#16a34a'],
      ['Total Payable', fm(sum(docs, (x) => x.total - x.paid)), '#dc2626']
    ];
  } else if (isQuo) {
    const open = docs.filter((x) => x.st === 'Open');
    kpis = [
      ['Open Quotations', open.length, '#f59e0b'],
      ['Open Value', fm(sum(open, (x) => x.total)), '#4f46e5'],
      ['Converted to Invoice', docs.filter((x) => x.st !== 'Open').length, '#16a34a']
    ];
  }

  const handleDelete = (t, doc) => {
    if (window.confirm(`Are you sure you want to delete ${doc.no}? Stock changes will be automatically reversed.`)) {
      voidDocument(t, doc.id);
    }
  };

  return (
    <div>
      <h2 className="top">
        <span>{titles.title}</span>
        <button
          className="b pr"
          onClick={() =>
            onOpenNewDoc(
              subTab === 'rets' ? titles.retKey : titles.docKey
            )
          }
        >
          <Plus size={15} /> {subTab === 'rets' ? titles.retBtn : titles.btn}
        </button>
      </h2>

      {/* Sub Tabs for Invoices vs Returns */}
      {!isQuo && (
        <div style={{ display: 'flex', gap: '8px', marginBottom: '18px' }}>
          <button
            className={`b ${subTab === 'docs' ? 'pr' : ''}`}
            onClick={() => setSubTab('docs')}
            style={{ padding: '8px 18px' }}
          >
            {isSales ? `🧾 Invoices (${docs.length})` : `🛒 Purchases (${docs.length})`}
          </button>
          <button
            className={`b ${subTab === 'rets' ? 'pr' : ''}`}
            onClick={() => setSubTab('rets')}
            style={{ padding: '8px 18px' }}
          >
            {isSales ? `↩️ Sales Returns (${rets.length})` : `↪️ Purchase Returns (${rets.length})`}
          </button>
        </div>
      )}

      {/* KPIs */}
      {subTab === 'docs' ? (
        <div className="kp">
          {kpis.map((k, i) => (
            <div key={i} className="kc" style={{ '--k': k[2] }}>
              <small>{k[0]}</small>
              <b>{k[1]}</b>
            </div>
          ))}
        </div>
      ) : (
        <div className="kp">
          <div className="kc" style={{ '--k': isSales ? '#dc2626' : '#f59e0b' }}>
            <small>Total Returned</small>
            <b>{fm(sum(rets, (d) => d.total))}</b>
          </div>
          <div className="kc" style={{ '--k': '#4f46e5' }}>
            <small>Open Credit/Debit Left</small>
            <b>{fm(sum(rets, (d) => d.total - d.paid))}</b>
          </div>
          <div className="kc" style={{ '--k': '#0ea5e9' }}>
            <small>Total Entries</small>
            <b>{rets.length}</b>
          </div>
        </div>
      )}

      {/* Primary Documents Table */}
      {subTab === 'docs' && (
        <div className="card tw">
          <table className="t">
            <thead>
              <tr>
                <th>Doc No</th>
                <th>Date</th>
                <th>{titles.partyCol}</th>
                <th className="r">Total Amount</th>
                {!isQuo && <th className="r">Due Amount</th>}
                <th>Status</th>
                <th className="r">Actions</th>
              </tr>
            </thead>
            <tbody>
              {docs.length > 0 ? (
                docs.map((d) => {
                  const statusInfo = stc(d);
                  return (
                    <tr key={d.id}>
                      <td>
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: '700' }}>
                          {d.no}
                        </span>
                      </td>
                      <td>{d.date}</td>
                      <td><b>{getPartyName(d.party)}</b></td>
                      <td className="r" style={{ fontWeight: '600' }}>{fm(d.total)}</td>
                      {!isQuo && (
                        <td className="r" style={{ color: (d.total - d.paid) > 0.5 ? 'var(--r)' : 'inherit', fontWeight: '600' }}>
                          {fm(d.total - d.paid)}
                        </td>
                      )}
                      <td>
                        {isQuo ? (
                          <span className={`bd ${d.st === 'Open' ? 'bo' : 'bg'}`}>
                            {d.st}
                          </span>
                        ) : (
                          <span
                            className={`bd ${
                              statusInfo.color === 'success'
                                ? 'bg'
                                : statusInfo.color === 'warning'
                                ? 'bo'
                                : 'br'
                            }`}
                          >
                            {statusInfo.label}
                          </span>
                        )}
                      </td>
                      <td className="r" style={{ whiteSpace: 'nowrap' }}>
                        <button className="b" onClick={() => onViewDoc(titles.docKey, d)}>
                          <Eye size={13} /> View
                        </button>
                        {isQuo && d.st === 'Open' && (
                          <button
                            className="b pr"
                            onClick={() => onConvertToInvoice(d)}
                            title="Convert quotation directly into invoice"
                          >
                            <ArrowRight size={13} /> Make Invoice
                          </button>
                        )}
                        <button
                          className="b danger"
                          onClick={() => handleDelete(titles.docKey, d)}
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', color: 'var(--m)' }}>
                    Nothing recorded here yet. Click above to create the first one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Returns Table */}
      {subTab === 'rets' && (
        <div className="card tw">
          <table className="t">
            <thead>
              <tr>
                <th>Doc No</th>
                <th>Date</th>
                <th>{isSales ? 'Customer' : 'Supplier'}</th>
                <th>Items Returned</th>
                <th className="r">Total</th>
                <th className="r">{isSales ? 'Refunded' : 'Refund Received'}</th>
                <th className="r">Credit Balance</th>
                <th className="r">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rets.length > 0 ? (
                rets.map((d) => (
                  <tr key={d.id}>
                    <td>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: '700' }}>
                        {d.no}
                      </span>
                    </td>
                    <td>{d.date}</td>
                    <td><b>{getPartyName(d.party)}</b></td>
                    <td>
                      <small>
                        {(d.items || []).map((i) => `${data.products.find(p=>p.id===i.p)?.name || '?'} x${i.q}`).join(', ')}
                      </small>
                    </td>
                    <td className="r" style={{ fontWeight: '600' }}>{fm(d.total)}</td>
                    <td className="r">{fm(d.paid)}</td>
                    <td className="r" style={{ color: 'var(--o)', fontWeight: '600' }}>{fm(d.total - d.paid)}</td>
                    <td className="r" style={{ whiteSpace: 'nowrap' }}>
                      <button className="b" onClick={() => onViewDoc(titles.retKey, d)}>
                        <Eye size={13} /> View
                      </button>
                      <button
                        className="b danger"
                        onClick={() => handleDelete(titles.retKey, d)}
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', color: 'var(--m)' }}>
                    No return notes recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
