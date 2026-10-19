import React, { useState, useEffect } from 'react';
import { ErpProvider, useErp } from './context/ErpContext';
import Sidebar from './components/Sidebar';
import DocumentModal from './components/DocumentModal';
import DocumentViewerModal from './components/DocumentViewerModal';
import ProductModal from './components/ProductModal';
import PaymentModal from './components/PaymentModal';
import PartyModal from './components/PartyModal';

// Pages
import Dashboard from './pages/Dashboard';
import ItemMaster from './pages/ItemMaster';
import Inventory from './pages/Inventory';
import DocumentPage from './pages/DocumentPage';
import ItemTracker from './pages/ItemTracker';
import ItemPerformance from './pages/ItemPerformance';
import Parties from './pages/Parties';
import Expenses from './pages/Expenses';
import ProfitAndLoss from './pages/ProfitAndLoss';
import Settings from './pages/Settings';

function ErpApp() {
  const { toastMessage } = useErp();
  const [tab, setTab] = useState('dash');
  const [theme, setTheme] = useState(() => localStorage.getItem('erp_theme') || 'light');

  // Modal States
  const [docModal, setDocModal] = useState({
    isOpen: false,
    docType: 'sal',
    prefillItems: null,
    prefillParty: null,
    fromQuoId: null
  });

  const [viewerModal, setViewerModal] = useState({
    isOpen: false,
    docType: 'sal',
    doc: null
  });

  const [prodModal, setProdModal] = useState({
    isOpen: false,
    prodId: null
  });

  const [payModal, setPayModal] = useState({
    isOpen: false,
    partyId: null
  });

  const [partyModalOpen, setPartyModalOpen] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('erp_theme', theme);
  }, [theme]);

  // Handlers for modal interactions
  const handleOpenDoc = (type, prefillItems = null, prefillParty = null, fromQuoId = null) => {
    setDocModal({
      isOpen: true,
      docType: type,
      prefillItems,
      prefillParty,
      fromQuoId
    });
  };

  const handleViewDoc = (type, doc) => {
    setViewerModal({
      isOpen: true,
      docType: type,
      doc
    });
  };

  const handleOpenProduct = (prodId = null) => {
    setProdModal({
      isOpen: true,
      prodId
    });
  };

  const handleOpenPay = (partyId) => {
    setPayModal({
      isOpen: true,
      partyId
    });
  };

  const handleConvertQuoToInvoice = (quoDoc) => {
    const items = quoDoc.lay
      ? quoDoc.lay.map((L) => (L.h ? L : quoDoc.items[L.i]))
      : quoDoc.items;
    handleOpenDoc('sal', items, quoDoc.party, quoDoc.id);
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Sidebar Navigation */}
      <Sidebar currentTab={tab} setTab={setTab} theme={theme} setTheme={setTheme} />

      {/* Main Content Area */}
      <main style={{ flex: 1, padding: '24px 28px', minWidth: 0, overflowX: 'hidden' }}>
        {tab === 'dash' && (
          <Dashboard
            onOpenDoc={handleOpenDoc}
            onOpenPay={handleOpenPay}
          />
        )}
        {tab === 'itm' && <ItemMaster onOpenProductModal={handleOpenProduct} />}
        {tab === 'inv' && <Inventory onOpenProductModal={handleOpenProduct} />}
        {tab === 'quo' && (
          <DocumentPage
            type="quo"
            onOpenNewDoc={handleOpenDoc}
            onViewDoc={handleViewDoc}
            onConvertToInvoice={handleConvertQuoToInvoice}
          />
        )}
        {tab === 'sal' && (
          <DocumentPage
            type="sal"
            onOpenNewDoc={handleOpenDoc}
            onViewDoc={handleViewDoc}
          />
        )}
        {tab === 'pur' && (
          <DocumentPage
            type="pur"
            onOpenNewDoc={handleOpenDoc}
            onViewDoc={handleViewDoc}
          />
        )}
        {tab === 'trk' && <ItemTracker />}
        {tab === 'perf' && <ItemPerformance />}
        {tab === 'par' && (
          <Parties
            onOpenPartyModal={() => setPartyModalOpen(true)}
            onOpenPay={handleOpenPay}
          />
        )}
        {tab === 'exp' && <Expenses />}
        {tab === 'pl' && <ProfitAndLoss />}
        {tab === 'set' && <Settings />}
      </main>

      {/* Toast Notification */}
      {toastMessage && <div className="toast-bar">{toastMessage}</div>}

      {/* Modals */}
      {docModal.isOpen && (
        <DocumentModal
          isOpen={docModal.isOpen}
          onClose={() => setDocModal({ ...docModal, isOpen: false })}
          docType={docModal.docType}
          prefillItems={docModal.prefillItems}
          prefillParty={docModal.prefillParty}
          fromQuoId={docModal.fromQuoId}
        />
      )}

      {viewerModal.isOpen && (
        <DocumentViewerModal
          isOpen={viewerModal.isOpen}
          onClose={() => setViewerModal({ ...viewerModal, isOpen: false })}
          docType={viewerModal.docType}
          doc={viewerModal.doc}
        />
      )}

      {prodModal.isOpen && (
        <ProductModal
          isOpen={prodModal.isOpen}
          onClose={() => setProdModal({ ...prodModal, isOpen: false })}
          prodId={prodModal.prodId}
        />
      )}

      {payModal.isOpen && (
        <PaymentModal
          isOpen={payModal.isOpen}
          onClose={() => setPayModal({ ...payModal, isOpen: false })}
          partyId={payModal.partyId}
        />
      )}

      {partyModalOpen && (
        <PartyModal
          isOpen={partyModalOpen}
          onClose={() => setPartyModalOpen(false)}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <ErpProvider>
      <ErpApp />
    </ErpProvider>
  );
}
