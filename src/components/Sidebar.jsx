import React from 'react';
import {
  LayoutDashboard,
  Tag,
  Boxes,
  FileText,
  ShoppingCart,
  Receipt,
  RotateCcw,
  Users,
  Wallet,
  TrendingUp,
  Search,
  Award,
  Settings,
  Sun,
  Moon
} from 'lucide-react';

export default function Sidebar({ currentTab, setTab, theme, setTheme }) {
  const navItems = [
    { id: 'dash', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'itm', label: 'Item Master', icon: Tag },
    { id: 'inv', label: 'Inventory', icon: Boxes },
    { id: 'quo', label: 'Quotations', icon: FileText },
    { id: 'sal', label: 'Sales & Returns', icon: Receipt },
    { id: 'pur', label: 'Purchases & Returns', icon: ShoppingCart },
    // { id: 'exp', label: 'Expenses', icon: Wallet },
    { id: 'trk', label: 'Item Tracker', icon: Search },
    { id: 'perf', label: 'Item Performance', icon: Award },
    { id: 'par', label: 'Parties', icon: Users },
    { id: 'pl', label: 'Profit & Loss', icon: TrendingUp },
    { id: 'set', label: 'Settings', icon: Settings },
  ];

  return (
    <nav
      style={{
        width: '240px',
        background: 'var(--c)',
        borderRight: '1px solid var(--b)',
        padding: '20px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        flexShrink: 0,
        minHeight: '100vh',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 8px 16px',
          borderBottom: '1px solid var(--b)',
          marginBottom: '10px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, var(--p), #4f46e5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 'bold',
              fontSize: '16px',
            }}
          >
            E
          </div>
          <span
            style={{
              fontSize: '18px',
              fontWeight: '800',
              letterSpacing: '-0.3px',
              background: 'linear-gradient(135deg, var(--p), #4f46e5)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            ERP Pro
          </span>
        </div>

        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="b"
          title="Toggle Theme"
          style={{ padding: '6px', borderRadius: '8px' }}
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', flex: 1 }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '9px 12px',
                borderRadius: '8px',
                border: 'none',
                background: isActive ? 'var(--p-light)' : 'transparent',
                color: isActive ? 'var(--p)' : 'var(--m)',
                fontWeight: isActive ? '700' : '500',
                fontSize: '13.5px',
                cursor: 'pointer',
                textAlign: 'left',
                width: '100%',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.backgroundColor = 'var(--b)';
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <Icon size={18} style={{ color: isActive ? 'var(--p)' : 'var(--m)' }} />
              {item.label}
            </button>
          );
        })}
      </div>

      <div
        style={{
          borderTop: '1px solid var(--b)',
          paddingTop: '12px',
          color: 'var(--m)',
          fontSize: '11px',
          textAlign: 'center',
        }}
      >
        ERP Pro React v2.0 • Indian GST Ready
      </div>
    </nav>
  );
}
