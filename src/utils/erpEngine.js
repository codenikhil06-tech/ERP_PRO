import { sum, inR, rng } from './erpUtils';

export function calcPL(data, period) {
  const S = data.sal.filter(d => inR(d.date, period));
  const B = data.pur.filter(d => inR(d.date, period));
  const E = data.exp.filter(d => inR(d.date, period));
  const SR = data.sr.filter(d => inR(d.date, period));
  const PR = data.pr.filter(d => inR(d.date, period));

  const gs = sum(S, d => d.sub || 0);
  const srt = sum(SR, d => d.sub || 0);
  const rev = gs - srt;

  const cogs =
    sum(S, d => sum(d.items, i => (i.q || 0) * (i.c || 0))) -
    sum(SR, d => sum(d.items, i => (i.q || 0) * (i.c || 0)));

  const ex = sum(E, e => e.amt || 0);
  const gp = rev - cogs;
  const net = gp - ex;

  const out = sum(S, d => d.tax || 0) - sum(SR, d => d.tax || 0);
  const inp = sum(B, d => d.tax || 0) - sum(PR, d => d.tax || 0);
  const pur = sum(B, d => d.sub || 0) - sum(PR, d => d.sub || 0);
  const prt = sum(PR, d => d.sub || 0);

  return {
    rev,
    cogs,
    gp,
    ex,
    net,
    out,
    inp,
    pur,
    gs,
    srt,
    prt,
    E
  };
}

export function calcMonthMetrics(data, dateObj) {
  const k = dateObj.getFullYear() + '-' + String(dateObj.getMonth() + 1).padStart(2, '0');
  const f = a => (a || []).filter(d => (d.date || '').startsWith(k));
  const cg = a => sum(a, d => sum(d.items, i => (i.q || 0) * (i.c || 0)));

  const S = f(data.sal);
  const Rt = f(data.sr);
  const rev = sum(S, d => d.sub || 0) - sum(Rt, d => d.sub || 0);
  const cogs = cg(S) - cg(Rt);
  const ex = sum(f(data.exp), e => e.amt || 0);
  const pur = sum(f(data.pur), d => d.sub || 0) - sum(f(data.pr), d => d.sub || 0);

  return {
    rev,
    cogs,
    ex,
    net: rev - cogs - ex,
    pur
  };
}

export function calcStockMovement(product, data, period) {
  const r = rng(period);
  const o = { pu: 0, sa: 0, sr: 0, pr: 0, bef: 0 };
  const actions = [
    ['pur', 'pu', 1],
    ['sal', 'sa', -1],
    ['sr', 'sr', 1],
    ['pr', 'pr', -1]
  ];

  actions.forEach(a => {
    (data[a[0]] || []).forEach(d => {
      (d.items || []).forEach(i => {
        if (i.p !== product.id) return;
        if (d.date < r[0]) {
          o.bef += a[2] * i.q;
        } else if (d.date < r[1]) {
          o[a[1]] += i.q;
        }
      });
    });
  });

  const openStock = product.open || 0;
  o.op = openStock + o.bef;
  o.cl = o.op + o.pu - o.sa + o.sr - o.pr;
  return o;
}
