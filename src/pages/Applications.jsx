import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import Table from '../components/Table';

function Applications({ applications, setApplications }) {
  const [showModal, setShowModal] = useState(false);
  const [editingApp, setEditingApp] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'Business Application',
    status: 'Production',
    businessCapability: '',
    owner: '',
    criticality: 'Medium',
    technicalDebt: 'Low',
    lastUpdated: new Date().toISOString().split('T')[0]
  });

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'type', label: 'Type' },
    {
      key: 'status',
      label: 'Status',
      render: (value) => {
        const badgeClass = value === 'Production' ? 'badge-success' :
          value === 'Deprecated' ? 'badge-danger' : 'badge-warning';
        return <span className={`badge ${badgeClass}`}>{value}</span>;
      }
    },
    { key: 'businessCapability', label: 'Business Capability' },
    { key: 'owner', label: 'Owner' },
    {
      key: 'criticality',
      label: 'Criticality',
      render: (value) => {
        const badgeClass = value === 'Critical' ? 'badge-danger' :
          value === 'High' ? 'badge-warning' : 'badge-info';
        return <span className={`badge ${badgeClass}`}>{value}</span>;
      }
    },
    {
      key: 'technicalDebt',
      label: 'Technical Debt',
      render: (value) => {
        const badgeClass = value === 'High' ? 'badge-danger' :
          value === 'Medium' ? 'badge-warning' : 'badge-success';
        return <span className={`badge ${badgeClass}`}>{value}</span>;
      }
    }
  ];

  const handleAdd = () => {
    setEditingApp(null);
    setFormData({
      name: '',
      type: 'Business Application',
      status: 'Production',
      businessCapability: '',
      owner: '',
      criticality: 'Medium',
      technicalDebt: 'Low',
      lastUpdated: new Date().toISOString().split('T')[0]
    });
    setShowModal(true);
  };

  const handleEdit = (app) => {
    setEditingApp(app);
    setFormData(app);
    setShowModal(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this application?')) {
      setApplications(applications.filter(app => app.id !== id));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingApp) {
      setApplications(applications.map(app =>
        app.id === editingApp.id ? { ...formData, id: app.id } : app
      ));
    } else {
      const newApp = {
        ...formData,
        id: Math.max(...applications.map(a => a.id), 0) + 1
      };
      setApplications([...applications, newApp]);
    }
    setShowModal(false);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div>
      <div className="page-actions">
        <div>
          <h1>Applications</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
            Manage your application portfolio
          </p>
        </div>
        <button className="btn btn-primary" onClick={handleAdd}>
          <Plus size={20} />
          Add Application
        </button>
      </div>

      <div className="card">
        <Table
          columns={columns}
          data={applications}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingApp ? 'Edit Application' : 'Add Application'}</h2>
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
                <label>Type *</label>
                <select name="type" value={formData.type} onChange={handleChange}>
                  <option>Business Application</option>
                  <option>Data Platform</option>
                  <option>Integration</option>
                  <option>Infrastructure</option>
                </select>
              </div>
              <div className="form-group">
                <label>Status *</label>
                <select name="status" value={formData.status} onChange={handleChange}>
                  <option>Production</option>
                  <option>Development</option>
                  <option>Deprecated</option>
                  <option>Retired</option>
                </select>
              </div>
              <div className="form-group">
                <label>Business Capability *</label>
                <input
                  type="text"
                  name="businessCapability"
                  value={formData.businessCapability}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Owner *</label>
                <input
                  type="text"
                  name="owner"
                  value={formData.owner}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Criticality *</label>
                <select name="criticality" value={formData.criticality} onChange={handleChange}>
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                  <option>Critical</option>
                </select>
              </div>
              <div className="form-group">
                <label>Technical Debt *</label>
                <select name="technicalDebt" value={formData.technicalDebt} onChange={handleChange}>
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingApp ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Applications;
