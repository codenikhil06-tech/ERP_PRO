// Core utility functions for ERP Pro
export const K = 'erp_pro_v1';

export const sum = (a, f) => (a || []).reduce((s, x) => s + f(x), 0);

export const fm = (n) =>
  (n < 0 ? '-' : '') + '₹' + Math.abs(Math.round(+n || 0)).toLocaleString('en-IN');

export const uid = () => Math.random().toString(36).slice(2, 9);

export const ymd = (x) =>
  x.getFullYear() +
  '-' +
  String(x.getMonth() + 1).padStart(2, '0') +
  '-' +
  String(x.getDate()).padStart(2, '0');

export const td = () => ymd(new Date());

export const ago = (m, d) => {
  const x = new Date();
  x.setDate(1);
  x.setMonth(x.getMonth() - m);
  x.setDate(m ? d : Math.min(d, new Date().getDate()));
  return ymd(x);
};

export const tot = (items) => {
  let s = 0;
  let t = 0;
  (items || []).forEach((i) => {
    const a = (i.q || 0) * (i.r || 0);
    s += a;
    t += (a * (i.g || 0)) / 100;
  });
  return { sub: s, tax: t, total: s + t };
};

export const stc = (d) =>
  (d.total || 0) - (d.paid || 0) < 0.5
    ? { label: 'Paid', color: 'success' }
    : (d.paid || 0) > 0
    ? { label: 'Partial', color: 'warning' }
    : { label: 'Due', color: 'danger' };

export const rng = (p) => {
  const n = new Date();
  const Y = n.getFullYear();
  const M = n.getMonth();
  const k = (y, m) => ymd(new Date(y, m, 1));
  switch (p) {
    case 'm':
      return [k(Y, M), k(Y, M + 1)];
    case 'l':
      return [k(Y, M - 1), k(Y, M)];
    case 'y':
      return [k(Y, 0), k(Y + 1, 0)];
    case 'all':
    default:
      return ['0000', '9999'];
  }
};

export const inR = (d, p) => {
  const n = new Date();
  const k = (x) =>
    x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0');
  if (p === 'all') return true;
  if (p === 'm') return (d || '').startsWith(k(n));
  if (p === 'l')
    return (d || '').startsWith(k(new Date(n.getFullYear(), n.getMonth() - 1, 1)));
  if (p === 'y') return (d || '').startsWith('' + n.getFullYear());
  return true;
};
