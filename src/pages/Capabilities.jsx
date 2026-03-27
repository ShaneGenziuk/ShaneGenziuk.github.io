import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import Table from '../components/Table';

function Capabilities({ capabilities, setCapabilities }) {
  const [showModal, setShowModal] = useState(false);
  const [editingCap, setEditingCap] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    level: 'Business',
    description: '',
    maturity: 'Defined',
    applications: 0
  });

  const columns = [
    { key: 'name', label: 'Name' },
    {
      key: 'level',
      label: 'Level',
      render: (value) => (
        <span className={`badge ${value === 'Business' ? 'badge-info' : 'badge-secondary'}`}>
          {value}
        </span>
      )
    },
    { key: 'description', label: 'Description' },
    {
      key: 'maturity',
      label: 'Maturity',
      render: (value) => {
        const badgeClass = value === 'Optimized' ? 'badge-success' :
          value === 'Managed' ? 'badge-info' : 'badge-warning';
        return <span className={`badge ${badgeClass}`}>{value}</span>;
      }
    },
    { key: 'applications', label: 'Applications' }
  ];

  const handleAdd = () => {
    setEditingCap(null);
    setFormData({
      name: '',
      level: 'Business',
      description: '',
      maturity: 'Defined',
      applications: 0
    });
    setShowModal(true);
  };

  const handleEdit = (cap) => {
    setEditingCap(cap);
    setFormData(cap);
    setShowModal(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this capability?')) {
      setCapabilities(capabilities.filter(cap => cap.id !== id));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingCap) {
      setCapabilities(capabilities.map(cap =>
        cap.id === editingCap.id ? { ...formData, id: cap.id } : cap
      ));
    } else {
      const newCap = {
        ...formData,
        id: Math.max(...capabilities.map(c => c.id), 0) + 1
      };
      setCapabilities([...capabilities, newCap]);
    }
    setShowModal(false);
  };

  const handleChange = (e) => {
    const value = e.target.name === 'applications' ? parseInt(e.target.value) : e.target.value;
    setFormData({
      ...formData,
      [e.target.name]: value
    });
  };

  return (
    <div>
      <div className="page-actions">
        <div>
          <h1>Business Capabilities</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
            Manage your business and technical capabilities
          </p>
        </div>
        <button className="btn btn-primary" onClick={handleAdd}>
          <Plus size={20} />
          Add Capability
        </button>
      </div>

      <div className="card">
        <Table
          columns={columns}
          data={capabilities}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingCap ? 'Edit Capability' : 'Add Capability'}</h2>
              <button className="btn-icon" onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Level *</label>
                <select name="level" value={formData.level} onChange={handleChange}>
                  <option>Business</option>
                  <option>Technical</option>
                </select>
              </div>
              <div className="form-group">
                <label>Description *</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="3"
                  required
                />
              </div>
              <div className="form-group">
                <label>Maturity Level *</label>
                <select name="maturity" value={formData.maturity} onChange={handleChange}>
                  <option>Initial</option>
                  <option>Defined</option>
                  <option>Managed</option>
                  <option>Optimized</option>
                </select>
              </div>
              <div className="form-group">
                <label>Number of Applications</label>
                <input
                  type="number"
                  name="applications"
                  value={formData.applications}
                  onChange={handleChange}
                  min="0"
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingCap ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Capabilities;
