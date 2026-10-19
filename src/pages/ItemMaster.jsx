import React, { useState } from 'react';
import { useErp } from '../context/ErpContext';
import { fm, sum } from '../utils/erpUtils';
import { Plus, Search, Copy, Edit2, Trash2 } from 'lucide-react';

export default function ItemMaster({ onOpenProductModal }) {
  const { data, deleteProduct, copyProduct, toggleProductActive, bulkUpdatePrice } = useErp();

  const [query, setQuery] = useState('');
  const [selectedCat, setSelectedCat] = useState('');
  const [bulkPercent, setBulkPercent] = useState('');
  const [bulkCat, setBulkCat] = useState('');

  const categories = [...new Set(data.products.map((p) => p.cat).filter(Boolean))].sort();
  const activeProducts = data.products.filter((p) => p.on !== false);

  const filtered = data.products.filter((p) => {
    const q = query.toLowerCase();
    const matchesCat = !selectedCat || p.cat === selectedCat;
    const matchesSearch =
      !q ||
      (p.name + ' ' + p.sku + ' ' + (p.brand || '') + ' ' + (p.hsn || ''))
        .toLowerCase()
        .includes(q);
    return matchesCat && matchesSearch;
  });

  const avgMargin =
    activeProducts.length > 0
      ? Math.round(
          sum(activeProducts, (p) =>
            p.price > 0 ? Math.round(((p.price - p.cost) / p.price) * 100) : 0
          ) / activeProducts.length
        )
      : 0;

  const handleBulkApply = () => {
    const pct = Number(bulkPercent);
    if (!pct) {
      alert('Please enter a percentage number.');
      return;
    }
    bulkUpdatePrice(bulkCat, pct);
    setBulkPercent('');
  };

  return (
    <div>
      <h2 className="top">
        <span>Item Master</span>
        <button className="b pr" onClick={() => onOpenProductModal(null)}>
          <Plus size={15} /> New Item
        </button>
      </h2>

      {/* KPI Cards */}
      <div className="kp">
        <div className="kc" style={{ '--k': '#0f766e' }}>
          <small>Total Items</small>
          <b>{data.products.length}</b>
        </div>
        <div className="kc" style={{ '--k': '#16a34a' }}>
          <small>Active Items</small>
          <b>{activeProducts.length}</b>
        </div>
        <div className="kc" style={{ '--k': '#4f46e5' }}>
          <small>Categories</small>
          <b>{categories.length}</b>
        </div>
        <div className="kc" style={{ '--k': '#0ea5e9' }}>
          <small>Average Margin</small>
          <b>{avgMargin}%</b>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: '18px' }}>
        <div className="g2">
          <label>
            Search Item
            <input
              type="text"
              placeholder="Search by name, SKU, brand, or HSN..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <label>
            Filter by Category
            <select value={selectedCat} onChange={(e) => setSelectedCat(e.target.value)}>
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {/* Item Table */}
      <div className="card tw" style={{ marginBottom: '20px' }}>
        <table className="t">
          <thead>
            <tr>
              <th>SKU / Code</th>
              <th>Item Name</th>
              <th>Category</th>
              <th>Unit</th>
              <th>HSN</th>
              <th className="r">Cost</th>
              <th className="r">Sale Price</th>
              <th className="r">GST</th>
              <th className="r">Margin</th>
              <th className="r">Reorder</th>
              <th className="r">Live Stock</th>
              <th>Status</th>
              <th className="r">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length > 0 ? (
              filtered.map((p) => {
                const margin = p.price > 0 ? Math.round(((p.price - p.cost) / p.price) * 100) : 0;
                return (
                  <tr key={p.id} style={{ opacity: p.on === false ? 0.6 : 1 }}>
                    <td><span style={{ fontFamily: 'var(--font-mono)', fontWeight: '600' }}>{p.sku}</span></td>
                    <td>
                      <b>{p.name}</b>
                      {p.brand && <small style={{ display: 'block', color: 'var(--m)' }}>Brand: {p.brand}</small>}
                    </td>
                    <td>{p.cat || '-'}</td>
                    <td>{p.unit || 'pcs'}</td>
                    <td>{p.hsn || '-'}</td>
                    <td className="r">{fm(p.cost)}</td>
                    <td className="r">{fm(p.price)}</td>
                    <td className="r">{p.g}%</td>
                    <td className="r" style={{ fontWeight: '600', color: margin < 15 ? 'var(--o)' : 'var(--g)' }}>
                      {margin}%
                    </td>
                    <td className="r">{p.min}</td>
                    <td className="r" style={{ fontWeight: '700' }}>{p.stock}</td>
                    <td>
                      <span className={`bd ${p.on === false ? 'br' : 'bg'}`}>
                        {p.on === false ? 'Inactive' : 'Active'}
                      </span>
                    </td>
                    <td className="r" style={{ whiteSpace: 'nowrap' }}>
                      <button className="b" onClick={() => onOpenProductModal(p.id)} title="Edit">
                        <Edit2 size={13} />
                      </button>
                      <button className="b" onClick={() => copyProduct(p.id)} title="Clone">
                        <Copy size={13} />
                      </button>
                      <button className="b" onClick={() => toggleProductActive(p.id)}>
                        {p.on === false ? 'Activate' : 'Deactivate'}
                      </button>
                      <button className="b danger" onClick={() => deleteProduct(p.id)} title="Delete">
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={13} style={{ textAlign: 'center', color: 'var(--m)' }}>
                  No items match this search or category filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Bulk Price Update Card */}
      <div className="card">
        <b style={{ fontSize: '15px', display: 'block', marginBottom: '10px' }}>
          Bulk Price Update Tool
        </b>
        <div className="g2" style={{ marginBottom: '12px' }}>
          <label>
            Apply to Category
            <select value={bulkCat} onChange={(e) => setBulkCat(e.target.value)}>
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>
          <label>
            Increase / Decrease Sale Price by (%)
            <input
              type="number"
              placeholder="e.g. 10 (for +10%) or -5 (for -5%)"
              value={bulkPercent}
              onChange={(e) => setBulkPercent(e.target.value)}
            />
          </label>
        </div>
        <button className="b pr" onClick={handleBulkApply}>
          Apply Bulk Price Update
        </button>
        <small style={{ marginLeft: '12px', color: 'var(--m)' }}>
          Rounds to nearest Rupee. Cost and inventory stocks remain intact.
        </small>
      </div>
    </div>
  );
}
