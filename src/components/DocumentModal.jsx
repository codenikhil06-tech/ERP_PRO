import React, { useState } from 'react';
import Modal from './Modal';
import { useErp } from '../context/ErpContext';
import { td, fm } from '../utils/erpUtils';
import { Trash2, ArrowUp, ArrowDown, Plus } from 'lucide-react';

export default function DocumentModal({ isOpen, onClose, docType, prefillItems, prefillParty, fromQuoId }) {
  const { data, getProduct, createDocument } = useErp();
  const isPurchase = docType === 'pur' || docType === 'pr';
  const isReturn = docType === 'sr' || docType === 'pr';

  const parties = data.parties.filter((p) => p.type === (isPurchase ? 'S' : 'C'));

  const [party, setParty] = useState(prefillParty || (parties[0] ? parties[0].id : ''));
  const [date, setDate] = useState(td());
  const [rows, setRows] = useState(() => {
    if (prefillItems && prefillItems.length > 0) {
      return prefillItems.map((item) => ({
        p: item.p || '',
        q: item.q || 1,
        r: item.r || 0,
        g: item.g || 0,
        isHeader: !!item.h,
        headerLevel: item.h || 1,
        headerText: item.t || ''
      }));
    }
    return [{ p: '', q: 1, r: 0, g: 0 }];
  });

  const [paidAmount, setPaidAmount] = useState('');
  const [manualPaid, setManualPaid] = useState(false);

  // Compute live subtotal, GST, Total
  let subtotal = 0;
  let gstTotal = 0;
  rows.forEach((r) => {
    if (!r.isHeader && r.p && r.q > 0) {
      const a = (Number(r.q) || 0) * (Number(r.r) || 0);
      subtotal += a;
      gstTotal += (a * (Number(r.g) || 0)) / 100;
    }
  });
  const grandTotal = subtotal + gstTotal;

  // Keep paid amount auto-filled unless manually modified
  const currentPaid = manualPaid
    ? Number(paidAmount) || 0
    : isReturn
    ? 0
    : Math.round(grandTotal);

  const handleProductSelect = (index, prodId) => {
    const prod = getProduct(prodId);
    setRows((prev) => {
      const next = [...prev];
      next[index].p = prodId;
      next[index].r = isPurchase ? prod.cost : prod.price;
      next[index].g = prod.g || 0;
      return next;
    });
  };

  const updateRow = (index, field, val) => {
    setRows((prev) => {
      const next = [...prev];
      next[index][field] = val;
      return next;
    });
  };

  const addRow = () => {
    setRows((prev) => [...prev, { p: '', q: 1, r: 0, g: 0 }]);
  };

  const addHeader = (level) => {
    setRows((prev) => [
      ...prev,
      { isHeader: true, headerLevel: level, headerText: '' }
    ]);
  };

  const removeRow = (index) => {
    setRows((prev) => prev.filter((_, i) => i !== index));
  };

  const moveRow = (index, dir) => {
    setRows((prev) => {
      const target = index + dir;
      if (target < 0 || target >= prev.length) return prev;
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[target];
      copy[target] = temp;
      return copy;
    });
  };

  const handleSave = () => {
    if (!party) {
      alert('Please select or add a party first.');
      return;
    }

    const items = [];
    const lay = [];

    rows.forEach((r) => {
      if (r.isHeader) {
        if (r.headerText.trim()) {
          lay.push({ h: r.headerLevel, t: r.headerText.trim() });
        }
      } else if (r.p && Number(r.q) > 0) {
        items.push({
          p: r.p,
          q: Number(r.q),
          r: Number(r.r),
          g: Number(r.g)
        });
        lay.push({ i: items.length - 1 });
      }
    });

    if (items.length === 0) {
      alert('Please add at least one item with a valid product and quantity.');
      return;
    }

    // Check stock availability for sales and purchase returns
    if (docType === 'sal' || docType === 'pr') {
      const required = {};
      items.forEach((i) => {
        required[i.p] = (required[i.p] || 0) + i.q;
      });
      for (const pId in required) {
        const product = getProduct(pId);
        if (product.stock < required[pId]) {
          alert(`Not enough stock for ${product.name}! Available: ${product.stock}, required: ${required[pId]}.`);
          return;
        }
      }
    }

    const docPayload = {
      date,
      party,
      items,
      lay: lay.some((x) => x.h) ? lay : null,
      sub: subtotal,
      tax: gstTotal,
      total: grandTotal,
      paid: docType === 'quo' ? 0 : Math.min(currentPaid, grandTotal),
      ...(docType === 'quo' ? { st: 'Open' } : {})
    };

    createDocument(docType, docPayload, fromQuoId);
    onClose();
  };

  const titleMap = {
    pur: 'New Purchase Order',
    sal: 'New Tax Invoice',
    quo: 'New Quotation',
    sr: 'New Sales Return (Credit Note)',
    pr: 'New Purchase Return (Debit Note)'
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={titleMap[docType] || 'New Document'} maxWidth="840px">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div className="g2">
          <label>
            {isPurchase ? 'Supplier' : 'Customer'}
            <select value={party} onChange={(e) => setParty(e.target.value)}>
              <option value="">Select Party</option>
              {parties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Date
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </label>
        </div>

        {/* Table items */}
        <div className="tw" style={{ border: '1px solid var(--b)' }}>
          <table className="t">
            <thead>
              <tr>
                <th style={{ width: '38%' }}>Item / Section</th>
                <th style={{ width: '12%' }} className="r">Qty</th>
                <th style={{ width: '16%' }} className="r">Rate (ex-GST)</th>
                <th style={{ width: '12%' }} className="r">GST %</th>
                <th style={{ width: '14%' }} className="r">Amount</th>
                <th style={{ width: '8%' }}></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => {
                if (row.isHeader) {
                  return (
                    <tr key={idx} style={{ background: 'var(--p-light)' }}>
                      <td colSpan={5}>
                        <input
                          placeholder={row.headerLevel === 1 ? 'Main Heading (e.g., Premium Collection)' : 'Sub-heading'}
                          value={row.headerText}
                          onChange={(e) => updateRow(idx, 'headerText', e.target.value)}
                          style={{
                            fontWeight: row.headerLevel === 1 ? '700' : '600',
                            marginLeft: row.headerLevel === 2 ? '20px' : '0px',
                            width: row.headerLevel === 2 ? 'calc(100% - 20px)' : '100%'
                          }}
                        />
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }} className="r">
                        <button className="b" onClick={() => moveRow(idx, -1)} title="Move Up"><ArrowUp size={13} /></button>
                        <button className="b" onClick={() => moveRow(idx, 1)} title="Move Down"><ArrowDown size={13} /></button>
                        <button className="b danger" onClick={() => removeRow(idx)}><Trash2 size={13} /></button>
                      </td>
                    </tr>
                  );
                }

                const lineAmt = (Number(row.q) || 0) * (Number(row.r) || 0);

                return (
                  <tr key={idx}>
                    <td>
                      <select value={row.p} onChange={(e) => handleProductSelect(idx, e.target.value)}>
                        <option value="">Select product</option>
                        {data.products
                          .filter((p) => p.on !== false)
                          .map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} (Stock: {p.stock})
                            </option>
                          ))}
                      </select>
                    </td>
                    <td>
                      <input
                        type="number"
                        min="1"
                        value={row.q}
                        onChange={(e) => updateRow(idx, 'q', e.target.value)}
                        className="r"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={row.r}
                        onChange={(e) => updateRow(idx, 'r', e.target.value)}
                        className="r"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={row.g}
                        onChange={(e) => updateRow(idx, 'g', e.target.value)}
                        className="r"
                      />
                    </td>
                    <td className="r" style={{ fontWeight: '600' }}>
                      {fm(lineAmt)}
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }} className="r">
                      <button className="b" onClick={() => moveRow(idx, -1)} title="Move Up"><ArrowUp size={13} /></button>
                      <button className="b" onClick={() => moveRow(idx, 1)} title="Move Down"><ArrowDown size={13} /></button>
                      <button className="b danger" onClick={() => removeRow(idx)}><Trash2 size={13} /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button className="b" onClick={addRow}><Plus size={14} /> Add Item</button>
          <button className="b" onClick={() => addHeader(1)}>+ Section Heading</button>
          <button className="b" onClick={() => addHeader(2)}>+ Sub-heading</button>
        </div>

        {/* Calculation summary */}
        <div
          style={{
            background: 'var(--c)',
            padding: '14px',
            borderRadius: '8px',
            border: '1px solid var(--b)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '14px'
          }}
        >
          <span>Subtotal: <b>{fm(subtotal)}</b> | GST: <b>{fm(gstTotal)}</b></span>
          <span style={{ fontSize: '18px', color: 'var(--p)', fontWeight: '800' }}>
            Grand Total: {fm(grandTotal)}
          </span>
        </div>

        {/* Payment input */}
        {docType !== 'quo' && (
          <label>
            {docType === 'sr'
              ? 'Refund paid to customer now'
              : docType === 'pr'
              ? 'Refund received from supplier now'
              : isPurchase
              ? 'Paid to supplier now'
              : 'Payment received now'}{' '}
            <span style={{ fontWeight: 'normal', color: 'var(--m)' }}>
              {isReturn ? '(leave 0 to record as Credit Note)' : '(Auto-filled, edit for partial/credit)'}
            </span>
            <input
              type="number"
              value={manualPaid ? paidAmount : currentPaid}
              onChange={(e) => {
                setManualPaid(true);
                setPaidAmount(e.target.value);
              }}
            />
          </label>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
          <button className="b" onClick={onClose}>Cancel</button>
          <button className="b pr" onClick={handleSave}>
            Save {docType.toUpperCase()}
          </button>
        </div>
      </div>
    </Modal>
  );
}
