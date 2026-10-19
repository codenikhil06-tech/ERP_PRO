import React, { useState } from 'react';
import Modal from './Modal';
import { useErp } from '../context/ErpContext';

export default function PartyModal({ isOpen, onClose }) {
  const { saveParty } = useErp();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [type, setType] = useState('C');

  const handleSave = () => {
    if (!name.trim()) {
      alert('Please enter party name.');
      return;
    }
    saveParty({
      name: name.trim(),
      phone: phone.trim(),
      type
    });
    setName('');
    setPhone('');
    setType('C');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Party" maxWidth="480px">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <label>
          Party Name *
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Apex Textiles or Ramesh Traders"
            autoFocus
          />
        </label>
        <label>
          Phone Number
          <input
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="e.g. 9876543210"
          />
        </label>
        <label>
          Party Type
          <select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="C">Customer</option>
            <option value="S">Supplier</option>
          </select>
        </label>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
          <button className="b" onClick={onClose}>Cancel</button>
          <button className="b pr" onClick={handleSave}>
            Save Party
          </button>
        </div>
      </div>
    </Modal>
  );
}
