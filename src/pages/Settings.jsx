import React, { useState } from 'react';
import { useErp } from '../context/ErpContext';
import { RefreshCw, Download, Upload, Check } from 'lucide-react';

export default function Settings() {
  const { data, updateBusinessName, resetToDemo, restoreBackup } = useErp();

  const [businessName, setBusinessName] = useState(data.co);
  const [backupText, setBackupText] = useState(JSON.stringify(data, null, 2));
  const [copied, setCopied] = useState(false);

  const handleSaveName = (e) => {
    e.preventDefault();
    updateBusinessName(businessName);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(data));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRestore = () => {
    if (window.confirm('Restoring will overwrite current browser data with this backup. Continue?')) {
      restoreBackup(backupText);
    }
  };

  const handleReset = () => {
    if (window.confirm('Resetting will clear all changes and restore original demo products and orders. Proceed?')) {
      resetToDemo();
    }
  };

  return (
    <div>
      <h2 className="top">System Settings & Data Management</h2>

      {/* Business Name Configuration */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <b style={{ fontSize: '15px', display: 'block', marginBottom: '10px' }}>
          Company / Business Details
        </b>
        <form onSubmit={handleSaveName} style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
          <label style={{ flex: 1 }}>
            Business Name (Printed on invoices and tax documents)
            <input
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="e.g. My Business Pvt Ltd"
            />
          </label>
          <button type="submit" className="b pr">
            Save Name
          </button>
        </form>
      </div>

      {/* Backup and Restore */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <b style={{ fontSize: '15px', display: 'block', marginBottom: '8px' }}>
          Local Database Backup & Restore
        </b>
        <p style={{ color: 'var(--m)', fontSize: '13.5px', marginBottom: '14px' }}>
          All data is securely stored locally in your browser storage. You can copy the full JSON database backup text below or paste a previous backup to restore your data anytime.
        </p>

        <textarea
          style={{ height: '180px', fontFamily: 'var(--font-mono)', fontSize: '12px', marginBottom: '14px' }}
          value={backupText}
          onChange={(e) => setBackupText(e.target.value)}
        />

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button className="b pr" onClick={handleRestore}>
            <Upload size={14} /> Restore from Text
          </button>
          <button className="b" onClick={handleCopy}>
            {copied ? <Check size={14} color="var(--g)" /> : <Download size={14} />}
            {copied ? 'Copied to Clipboard!' : 'Copy Backup to Clipboard'}
          </button>
          <button className="b danger" onClick={handleReset}>
            <RefreshCw size={14} /> Reset to Demo Data
          </button>
        </div>
      </div>
    </div>
  );
}
