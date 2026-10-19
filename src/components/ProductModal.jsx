import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { useErp } from '../context/ErpContext';
import { fm } from '../utils/erpUtils';

export default function ProductModal({ isOpen, onClose, prodId }) {
  const { data, getProduct, saveProduct } = useErp();
  const existing = prodId ? getProduct(prodId) : null;

  const [form, setForm] = useState({
    name: '',
    sku: '',
    cat: '',
    brand: '',
    unit: 'pcs',
    hsn: '',
    cost: 0,
    price: 0,
    mrp: 0,
    g: 12,
    stock: 0,
    min: 5,
    sup: '',
    desc: '',
    on: true
  });

  useEffect(() => {
    if (existing) {
      setForm({
        name: existing.name || '',
        sku: existing.sku || '',
        cat: existing.cat || '',
        brand: existing.brand || '',
        unit: existing.unit || 'pcs',
        hsn: existing.hsn || '',
        cost: existing.cost || 0,
        price: existing.price || 0,
        mrp: existing.mrp || 0,
        g: existing.g ?? 12,
        stock: existing.stock || 0,
        min: existing.min || 5,
        sup: existing.sup || '',
        desc: existing.desc || '',
        on: existing.on !== false
      });
    } else {
      setForm({
        name: '',
        sku: '',
        cat: '',
        brand: '',
        unit: 'pcs',
        hsn: '',
        cost: 0,
        price: 0,
        mrp: 0,
        g: 12,
        stock: 0,
        min: 5,
        sup: '',
        desc: '',
        on: true
      });
    }
  }, [prodId, existing, isOpen]);

  const categories = [...new Set(data.products.map((p) => p.cat).filter(Boolean))].sort();

  const cost = Number(form.cost) || 0;
  const price = Number(form.price) || 0;
  const marginPct = price > 0 ? Math.round(((price - cost) / price) * 100) : 0;
  const profitPerUnit = price - cost;
  const priceWithGst = price * (1 + (Number(form.g) || 0) / 100);

  const handleSave = () => {
    if (!form.name.trim()) {
      alert('Please enter an item name.');
      return;
    }

    let sku = form.sku.trim();
    if (!sku) {
      const prefix =
        form.name.replace(/[^a-zA-Z]/g, '').slice(0, 2).toUpperCase() || 'IT';
      let n = data.products.length + 1;
      do {
        sku = `${prefix}-${String(n++).padStart(2, '0')}`;
      } while (data.products.some((x) => x.sku === sku));
    }

    if (data.products.some((x) => x.sku === sku && x.id !== prodId)) {
      alert(`SKU/Code "${sku}" is already used by another item.`);
      return;
    }

    const payload = {
      ...form,
      sku,
      cost: Number(form.cost) || 0,
      price: Number(form.price) || 0,
      mrp: Number(form.mrp) || 0,
      g: Number(form.g) || 0,
      stock: Number(form.stock) || 0,
      min: Number(form.min) || 0
    };

    saveProduct(payload, prodId);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={prodId ? 'Edit Product' : 'New Product'} maxWidth="680px">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div className="g2">
          <label>
            Item Name *
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Cotton Shirt"
            />
          </label>
          <label>
            Item Code / SKU (Auto if empty)
            <input
              type="text"
              value={form.sku}
              onChange={(e) => setForm({ ...form, sku: e.target.value })}
              placeholder="e.g. SH-01"
            />
          </label>
        </div>

        <div className="g2">
          <label>
            Category
            <input
              type="text"
              list="cat-list"
              value={form.cat}
              onChange={(e) => setForm({ ...form, cat: e.target.value })}
              placeholder="Select or type"
            />
            <datalist id="cat-list">
              {categories.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </label>
          <label>
            Brand
            <input
              type="text"
              value={form.brand}
              onChange={(e) => setForm({ ...form, brand: e.target.value })}
            />
          </label>
        </div>

        <div className="g3">
          <label>
            Unit
            <select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}>
              {['pcs', 'kg', 'g', 'litre', 'meter', 'box', 'dozen', 'pair', 'set'].map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </label>
          <label>
            HSN Code
            <input
              type="text"
              value={form.hsn}
              onChange={(e) => setForm({ ...form, hsn: e.target.value })}
            />
          </label>
          <label>
            GST Rate %
            <select
              value={form.g}
              onChange={(e) => setForm({ ...form, g: Number(e.target.value) })}
            >
              {[0, 5, 12, 18, 28].map((gst) => (
                <option key={gst} value={gst}>{gst}%</option>
              ))}
            </select>
          </label>
        </div>

        <div className="g3">
          <label>
            Cost Price (ex-GST)
            <input
              type="number"
              value={form.cost}
              onChange={(e) => setForm({ ...form, cost: e.target.value })}
            />
          </label>
          <label>
            Sale Price (ex-GST)
            <input
              type="number"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
            />
          </label>
          <label>
            MRP
            <input
              type="number"
              value={form.mrp}
              onChange={(e) => setForm({ ...form, mrp: e.target.value })}
            />
          </label>
        </div>

        <div className="g3">
          <label>
            {prodId ? 'Live Stock' : 'Opening Stock'}
            <input
              type="number"
              value={form.stock}
              onChange={(e) => setForm({ ...form, stock: e.target.value })}
            />
          </label>
          <label>
            Reorder Level
            <input
              type="number"
              value={form.min}
              onChange={(e) => setForm({ ...form, min: e.target.value })}
            />
          </label>
          <label>
            Default Supplier
            <select
              value={form.sup}
              onChange={(e) => setForm({ ...form, sup: e.target.value })}
            >
              <option value="">None</option>
              {data.parties
                .filter((p) => p.type === 'S')
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
            </select>
          </label>
        </div>

        {/* Real-time Margin & Price with GST indicator */}
        <div
          style={{
            background: 'var(--p-light)',
            padding: '10px 14px',
            borderRadius: '8px',
            fontSize: '13px',
            color: 'var(--p)',
            fontWeight: '600'
          }}
        >
          Margin: <b>{marginPct}%</b> &nbsp;|&nbsp; Profit / unit: <b>{fm(profitPerUnit)}</b> &nbsp;|&nbsp; Price with GST: <b>{fm(priceWithGst)}</b>
        </div>

        <label>
          Notes / Description
          <input
            type="text"
            value={form.desc}
            onChange={(e) => setForm({ ...form, desc: e.target.value })}
          />
        </label>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
          <button className="b" onClick={onClose}>Cancel</button>
          <button className="b pr" onClick={handleSave}>
            Save Product
          </button>
        </div>
      </div>
    </Modal>
  );
}
