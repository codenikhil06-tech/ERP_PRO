import React from 'react';
import Modal from './Modal';
import { useErp } from '../context/ErpContext';
import { fm } from '../utils/erpUtils';
import { Printer } from 'lucide-react';

export default function DocumentViewerModal({ isOpen, onClose, docType, doc }) {
  const { data, getProduct, getPartyName } = useErp();
  if (!doc) return null;

  const typeLabels = {
    pur: 'PURCHASE ORDER',
    sal: 'TAX INVOICE',
    quo: 'QUOTATION',
    sr: 'SALES RETURN (CREDIT NOTE)',
    pr: 'PURCHASE RETURN (DEBIT NOTE)'
  };

  const isPurchase = docType === 'pur' || docType === 'pr';

  const itemsLayout = doc.lay || (doc.items || []).map((_, idx) => ({ i: idx }));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Document Preview" maxWidth="800px">
      <div id="print-area" style={{ padding: '8px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            borderBottom: '2px solid var(--p)',
            paddingBottom: '14px',
            marginBottom: '18px'
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '800', color: 'var(--p)' }}>
              {data.co}
            </h2>
            <div style={{ fontSize: '12px', color: 'var(--m)', marginTop: '4px' }}>
              Original Document • GST Compliant
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span
              style={{
                display: 'inline-block',
                background: 'var(--p-light)',
                color: 'var(--p)',
                fontWeight: '700',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '13px'
              }}
            >
              {typeLabels[docType] || 'DOCUMENT'}
            </span>
            <h4 style={{ margin: '6px 0 0', fontSize: '16px' }}>{doc.no}</h4>
            <div style={{ fontSize: '13px', color: 'var(--m)' }}>Date: {doc.date}</div>
          </div>
        </div>

        <div style={{ marginBottom: '18px', fontSize: '13.5px' }}>
          <span style={{ color: 'var(--m)' }}>{isPurchase ? 'Supplier' : 'Billed To'}:</span>{' '}
          <strong style={{ fontSize: '15px' }}>{getPartyName(doc.party)}</strong>
        </div>

        <div className="tw" style={{ border: '1px solid var(--b)', borderRadius: '8px', marginBottom: '18px' }}>
          <table className="t">
            <thead>
              <tr>
                <th>Item Details</th>
                <th className="r">Qty</th>
                <th className="r">Rate</th>
                <th className="r">GST %</th>
                <th className="r">Amount</th>
              </tr>
            </thead>
            <tbody>
              {itemsLayout.map((L, idx) => {
                if (L.h) {
                  return (
                    <tr
                      key={idx}
                      style={{
                        background: L.h === 1 ? 'var(--p-light)' : 'transparent',
                        fontWeight: L.h === 1 ? '800' : '600'
                      }}
                    >
                      <td colSpan={5} style={{ paddingLeft: L.h === 2 ? '24px' : '14px' }}>
                        {L.t}
                      </td>
                    </tr>
                  );
                }
                const item = doc.items[L.i];
                if (!item) return null;
                const prod = getProduct(item.p);
                return (
                  <tr key={idx}>
                    <td>
                      <b>{prod.name}</b>
                      {prod.sku && <small style={{ display: 'block', color: 'var(--m)' }}>Code: {prod.sku}</small>}
                    </td>
                    <td className="r">{item.q}</td>
                    <td className="r">{fm(item.r)}</td>
                    <td className="r">{item.g}%</td>
                    <td className="r" style={{ fontWeight: '600' }}>
                      {fm(item.q * item.r)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }}>
          <div style={{ width: '280px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--m)' }}>Subtotal:</span>
              <span>{fm(doc.sub)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--m)' }}>Total Tax (GST):</span>
              <span>{fm(doc.tax)}</span>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                borderTop: '1px solid var(--b)',
                paddingTop: '6px',
                fontWeight: '800',
                fontSize: '16px',
                color: 'var(--p)'
              }}
            >
              <span>Grand Total:</span>
              <span>{fm(doc.total)}</span>
            </div>
            {docType !== 'quo' && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--m)' }}>
                    {docType === 'sr' || docType === 'pr' ? 'Refunded:' : 'Paid:'}
                  </span>
                  <span>{fm(doc.paid || 0)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '600', color: (doc.total - (doc.paid || 0)) > 0 ? 'var(--r)' : 'var(--g)' }}>
                  <span>
                    {docType === 'sr' || docType === 'pr' ? 'Credit left:' : 'Balance Due:'}
                  </span>
                  <span>{fm(doc.total - (doc.paid || 0))}</span>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="nop" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button className="b pr" onClick={() => window.print()}>
            <Printer size={15} /> Print / Save as PDF
          </button>
          <button className="b" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}
