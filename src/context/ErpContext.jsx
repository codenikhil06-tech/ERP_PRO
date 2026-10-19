import React, { createContext, useContext, useState, useEffect } from 'react';
import { uid, td, ago, tot, K } from '../utils/erpUtils';

const ErpContext = createContext();

export function getInitialSeed() {
  const D = {
    co: 'My Business',
    n: { pur: 0, sal: 0, quo: 0, sr: 0, pr: 0 },
    products: [],
    parties: [],
    pur: [],
    sal: [],
    quo: [],
    sr: [],
    pr: [],
    exp: []
  };

  const defaultProds = [
    { name: 'Cotton Shirt', sku: 'SH-01', cat: 'Apparel', brand: 'Arrow', unit: 'pcs', hsn: '6205', cost: 420, price: 799, mrp: 999, g: 12, min: 10 },
    { name: 'Denim Jeans', sku: 'JN-01', cat: 'Apparel', brand: 'Levi', unit: 'pcs', hsn: '6203', cost: 650, price: 1299, mrp: 1599, g: 12, min: 10 },
    { name: 'T-Shirt', sku: 'TS-01', cat: 'Casuals', brand: 'Puma', unit: 'pcs', hsn: '6109', cost: 180, price: 399, mrp: 499, g: 5, min: 15 },
    { name: 'Jacket', sku: 'JK-01', cat: 'Winterwear', brand: 'Zara', unit: 'pcs', hsn: '6201', cost: 1100, price: 2199, mrp: 2799, g: 12, min: 5 },
    { name: 'Sneakers', sku: 'SN-01', cat: 'Footwear', brand: 'Nike', unit: 'pair', hsn: '6404', cost: 900, price: 1799, mrp: 2199, g: 18, min: 6 }
  ];

  defaultProds.forEach(a => {
    D.products.push({
      id: uid(),
      name: a.name,
      sku: a.sku,
      cat: a.cat,
      brand: a.brand,
      unit: a.unit,
      hsn: a.hsn,
      cost: a.cost,
      price: a.price,
      mrp: a.mrp,
      g: a.g,
      stock: 0,
      open: 0,
      min: a.min,
      on: true,
      desc: '',
      sup: ''
    });
  });

  const defaultParties = [
    { name: 'Apex Textiles', type: 'S', phone: '9876543210' },
    { name: 'Urban Wholesale', type: 'S', phone: '9876543211' },
    { name: 'Ravi Sharma', type: 'C', phone: '9123456789' },
    { name: 'Style Hub', type: 'C', phone: '9123456780' },
    { name: 'Meena Boutique', type: 'C', phone: '9123456781' }
  ];

  defaultParties.forEach(a => {
    D.parties.push({ id: uid(), name: a.name, type: a.type, phone: a.phone });
  });

  // Helper post for seeding
  const seedPost = (t, d) => {
    D.n[t]++;
    const prefixes = { pur: 'PUR', sal: 'INV', quo: 'QUO', sr: 'SRN', pr: 'PRN' };
    d.no = prefixes[t] + '-' + String(D.n[t]).padStart(4, '0');
    if (t === 'pur') {
      d.items.forEach(i => {
        const p = D.products.find(x => x.id === i.p);
        if (p) {
          const s = Math.max(p.stock, 0);
          p.cost = (s * p.cost + i.q * i.r) / (s + i.q);
          p.stock += i.q;
        }
      });
    }
    if (t === 'sal') {
      d.items.forEach(i => {
        const p = D.products.find(x => x.id === i.p);
        if (p) {
          i.c = p.cost;
          p.stock -= i.q;
        }
      });
    }
    if (t === 'sr') {
      d.items.forEach(i => {
        const p = D.products.find(x => x.id === i.p);
        if (p) {
          i.c = p.cost;
          p.stock += i.q;
        }
      });
    }
    if (t === 'pr') {
      d.items.forEach(i => {
        const p = D.products.find(x => x.id === i.p);
        if (p) p.stock -= i.q;
      });
    }
    D[t].unshift(d);
  };

  let s = 7;
  const rnd = () => {
    s = (s * 9301) % 49297;
    return s / 49297;
  };
  const S = D.parties.filter(p => p.type === 'S');
  const C = D.parties.filter(p => p.type === 'C');

  for (let m = 5; m >= 0; m--) {
    if (m % 2) {
      const it = D.products.map(p => ({
        p: p.id,
        q: 25 + Math.floor(rnd() * 15),
        r: p.cost,
        g: p.g
      }));
      const d = { id: uid(), date: ago(m, 2), party: S[m % 2 ? 0 : 1].id, items: it, ...tot(it) };
      d.paid = d.total;
      seedPost('pur', d);
    }
    for (let k = 0; k < 4; k++) {
      const it = [];
      D.products.forEach(p => {
        if (rnd() < 0.5) {
          const q = Math.min(p.stock, 1 + Math.floor(rnd() * 12));
          if (q > 0) it.push({ p: p.id, q, r: p.price, g: p.g });
        }
      });
      if (!it.length) continue;
      const d = { id: uid(), date: ago(m, 4 + k * 6), party: C[Math.floor(rnd() * 3)].id, items: it, ...tot(it) };
      d.paid = m || k < 3 ? d.total : Math.round(d.total / 2);
      seedPost('sal', d);
    }
    D.exp.push(
      { id: uid(), date: ago(m, 1), cat: 'Rent', amt: 15000 },
      { id: uid(), date: ago(m, 1), cat: 'Salary', amt: 30000 },
      { id: uid(), date: ago(m, 10), cat: 'Electricity', amt: Math.round(2500 + rnd() * 1500) }
    );
  }

  // Sample quotation
  const quoIt = [{ p: D.products[1].id, q: 5, r: D.products[1].price, g: 12 }];
  seedPost('quo', { id: uid(), date: td(), party: C[0].id, items: quoIt, ...tot(quoIt), st: 'Open' });

  // Migrate opening stocks
  D.products.forEach(p => {
    if (p.open == null) {
      const purQty = D.pur.reduce((acc, d) => acc + d.items.filter(i => i.p === p.id).reduce((q, i) => q + i.q, 0), 0);
      const salQty = D.sal.reduce((acc, d) => acc + d.items.filter(i => i.p === p.id).reduce((q, i) => q + i.q, 0), 0);
      p.open = p.stock - purQty + salQty;
    }
  });

  return D;
}

export function ErpProvider({ children }) {
  const [data, setData] = useState(() => {
    try {
      const saved = localStorage.getItem(K);
      if (saved) {
        const parsed = JSON.parse(saved);
        parsed.sr = parsed.sr || [];
        parsed.pr = parsed.pr || [];
        parsed.n = parsed.n || { pur: 0, sal: 0, quo: 0, sr: 0, pr: 0 };
        return parsed;
      }
    } catch (e) {
      console.error('Failed to parse localStorage data', e);
    }
    return getInitialSeed();
  });

  const [toastMessage, setToastMessage] = useState(null);

  const toast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 3000);
  };

  useEffect(() => {
    try {
      localStorage.setItem(K, JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save to localStorage', e);
    }
  }, [data]);

  const getProduct = (id) =>
    data.products.find(p => p.id === id) || { name: '?', stock: 0, cost: 0, price: 0, g: 0, min: 0 };

  const getPartyName = (id) =>
    (data.parties.find(p => p.id === id) || { name: '?' }).name;

  const getPartyBalance = (party) => {
    if (!party) return 0;
    const isCust = party.type === 'C';
    const docs = isCust ? data.sal : data.pur;
    const rets = isCust ? data.sr : data.pr;
    const billDue = docs.filter(d => d.party === party.id).reduce((s, d) => s + ((d.total || 0) - (d.paid || 0)), 0);
    const retDue = rets.filter(d => d.party === party.id).reduce((s, d) => s + ((d.total || 0) - (d.paid || 0)), 0);
    return billDue - retDue;
  };

  // Create document: purchase, sale, quotation, sales return, purchase return
  const createDocument = (t, docData, fromQuoId = null) => {
    setData(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      next.n[t] = (next.n[t] || 0) + 1;
      const prefixes = { pur: 'PUR', sal: 'INV', quo: 'QUO', sr: 'SRN', pr: 'PRN' };
      const docNo = prefixes[t] + '-' + String(next.n[t]).padStart(4, '0');

      const newDoc = {
        ...docData,
        id: uid(),
        no: docNo,
        date: docData.date || td()
      };

      if (t === 'pur') {
        newDoc.items.forEach(i => {
          const p = next.products.find(x => x.id === i.p);
          if (p) {
            const s = Math.max(p.stock, 0);
            p.cost = (s * p.cost + i.q * i.r) / (s + i.q);
            p.stock += i.q;
          }
        });
      } else if (t === 'sal') {
        newDoc.items.forEach(i => {
          const p = next.products.find(x => x.id === i.p);
          if (p) {
            i.c = p.cost;
            p.stock -= i.q;
          }
        });
      } else if (t === 'sr') {
        newDoc.items.forEach(i => {
          const p = next.products.find(x => x.id === i.p);
          if (p) {
            i.c = p.cost;
            p.stock += i.q;
          }
        });
      } else if (t === 'pr') {
        newDoc.items.forEach(i => {
          const p = next.products.find(x => x.id === i.p);
          if (p) {
            p.stock -= i.q;
          }
        });
      }

      if (t === 'sal' && fromQuoId) {
        const q = next.quo.find(x => x.id === fromQuoId);
        if (q) q.st = 'Invoiced';
      }

      next[t].unshift(newDoc);
      return next;
    });
    toast(`${t.toUpperCase()} saved. Stock & ledger updated.`);
  };

  // Delete/Void document
  const voidDocument = (t, id) => {
    setData(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      const doc = next[t].find(x => x.id === id);
      if (!doc) return prev;

      if (t === 'pur') {
        doc.items.forEach(i => {
          const p = next.products.find(x => x.id === i.p);
          if (p) p.stock -= i.q;
        });
      } else if (t === 'sal') {
        doc.items.forEach(i => {
          const p = next.products.find(x => x.id === i.p);
          if (p) p.stock += i.q;
        });
      } else if (t === 'sr') {
        doc.items.forEach(i => {
          const p = next.products.find(x => x.id === i.p);
          if (p) p.stock -= i.q;
        });
      } else if (t === 'pr') {
        doc.items.forEach(i => {
          const p = next.products.find(x => x.id === i.p);
          if (p) p.stock += i.q;
        });
      }

      next[t] = next[t].filter(x => x.id !== id);
      return next;
    });
    toast('Document deleted and stock reversed.');
  };

  // Record payment against oldest unpaid invoices/bills
  const recordPayment = (partyId, amount) => {
    let rem = +amount;
    if (!(rem > 0)) {
      toast('Please enter a valid amount.');
      return false;
    }

    setData(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      const party = next.parties.find(x => x.id === partyId);
      if (!party) return prev;

      const targetList = party.type === 'C' ? next.sal : next.pur;
      const unpaid = targetList.filter(d => d.party === partyId && (d.total - d.paid) > 0.5).reverse();

      for (const d of unpaid) {
        const due = d.total - d.paid;
        const alloc = Math.min(rem, due);
        d.paid += alloc;
        rem -= alloc;
        if (rem <= 0) break;
      }
      return next;
    });
    toast('Payment recorded successfully.');
    return true;
  };

  // Product CRUD
  const saveProduct = (prodData, id = null) => {
    setData(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      if (id) {
        const item = next.products.find(x => x.id === id);
        if (item) {
          item.open = (item.open || 0) + (prodData.stock - item.stock);
          Object.assign(item, prodData);
        }
      } else {
        next.products.push({
          id: uid(),
          ...prodData,
          open: prodData.stock
        });
      }
      return next;
    });
    toast('Product saved.');
  };

  const deleteProduct = (id) => {
    const isUsed = ['pur', 'sal', 'quo', 'sr', 'pr'].some(t =>
      data[t].some(d => d.items.some(i => i.p === id))
    );
    if (isUsed) {
      toast('Item is used in documents. Deactivate it instead.');
      return false;
    }
    setData(prev => ({
      ...prev,
      products: prev.products.filter(x => x.id !== id)
    }));
    toast('Product deleted.');
    return true;
  };

  const copyProduct = (id) => {
    const p = getProduct(id);
    let n = 2;
    let s = p.sku + '-' + n;
    while (data.products.some(x => x.sku === s)) {
      s = p.sku + '-' + (++n);
    }
    const copy = {
      ...p,
      id: uid(),
      name: p.name + ' (copy)',
      sku: s,
      stock: 0,
      open: 0
    };
    setData(prev => ({ ...prev, products: [...prev.products, copy] }));
    toast('Copy created.');
  };

  const toggleProductActive = (id) => {
    setData(prev => ({
      ...prev,
      products: prev.products.map(p =>
        p.id === id ? { ...p, on: p.on === false } : p
      )
    }));
  };

  const bulkUpdatePrice = (category, percent) => {
    setData(prev => ({
      ...prev,
      products: prev.products.map(p => {
        if (!category || p.cat === category) {
          return {
            ...p,
            price: Math.max(0, Math.round(p.price * (1 + percent / 100)))
          };
        }
        return p;
      })
    }));
    toast(`Sale prices updated by ${percent}%.`);
  };

  // Party CRUD
  const saveParty = (partyData) => {
    setData(prev => ({
      ...prev,
      parties: [...prev.parties, { id: uid(), ...partyData }]
    }));
    toast('Party added.');
  };

  // Expense CRUD
  const addExpense = (exp) => {
    setData(prev => ({
      ...prev,
      exp: [{ id: uid(), ...exp }, ...prev.exp]
    }));
    toast('Expense added.');
  };

  const deleteExpense = (id) => {
    setData(prev => ({
      ...prev,
      exp: prev.exp.filter(x => x.id !== id)
    }));
    toast('Expense removed.');
  };

  // Business Name update
  const updateBusinessName = (name) => {
    setData(prev => ({ ...prev, co: name }));
    toast('Business details updated.');
  };

  // Reset to demo
  const resetToDemo = () => {
    const fresh = getInitialSeed();
    setData(fresh);
    toast('Reset to demo data.');
  };

  // Restore backup
  const restoreBackup = (jsonString) => {
    try {
      const parsed = JSON.parse(jsonString);
      parsed.sr = parsed.sr || [];
      parsed.pr = parsed.pr || [];
      parsed.n = parsed.n || { pur: 0, sal: 0, quo: 0, sr: 0, pr: 0 };
      setData(parsed);
      toast('Backup restored successfully.');
      return true;
    } catch (e) {
      toast('Invalid backup JSON format.');
      return false;
    }
  };

  return (
    <ErpContext.Provider
      value={{
        data,
        toast,
        toastMessage,
        getProduct,
        getPartyName,
        getPartyBalance,
        createDocument,
        voidDocument,
        recordPayment,
        saveProduct,
        deleteProduct,
        copyProduct,
        toggleProductActive,
        bulkUpdatePrice,
        saveParty,
        addExpense,
        deleteExpense,
        updateBusinessName,
        resetToDemo,
        restoreBackup
      }}
    >
      {children}
    </ErpContext.Provider>
  );
}

export const useErp = () => useContext(ErpContext);















