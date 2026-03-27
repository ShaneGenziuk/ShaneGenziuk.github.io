import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import Table from '../components/Table';

function Projects({ projects, setProjects }) {
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    status: 'Planning',
    priority: 'Medium',
    budget: 0,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    impactedApplications: 0
  });

  const columns = [
    { key: 'name', label: 'Name' },
    {
      key: 'status',
      label: 'Status',
      render: (value) => {
        const badgeClass = value === 'In Progress' ? 'badge-info' :
          value === 'Planning' ? 'badge-warning' :
            value === 'Completed' ? 'badge-success' : 'badge-secondary';
        return <span className={`badge ${badgeClass}`}>{value}</span>;
      }
    },
    {
      key: 'priority',
      label: 'Priority',
      render: (value) => {
        const badgeClass = value === 'Critical' ? 'badge-danger' :
          value === 'High' ? 'badge-warning' : 'badge-info';
        return <span className={`badge ${badgeClass}`}>{value}</span>;
      }
    },
    {
      key: 'budget',
      label: 'Budget',
      render: (value) => `$${value.toLocaleString()}`
    },
    { key: 'startDate', label: 'Start Date' },
    { key: 'endDate', label: 'End Date' },
    { key: 'impactedApplications', label: 'Impacted Apps' }
  ];

  const handleAdd = () => {
    setEditingProject(null);
    setFormData({
      name: '',
      status: 'Planning',
      priority: 'Medium',
      budget: 0,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      impactedApplications: 0
    });
    setShowModal(true);
  };

  const handleEdit = (project) => {
    setEditingProject(project);
    setFormData(project);
    setShowModal(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      setProjects(projects.filter(proj => proj.id !== id));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingProject) {
      setProjects(projects.map(proj =>
        proj.id === editingProject.id ? { ...formData, id: proj.id } : proj
      ));
    } else {
      const newProject = {
        ...formData,
        id: Math.max(...projects.map(p => p.id), 0) + 1
      };
      setProjects([...projects, newProject]);
    }
    setShowModal(false);
  };

  const handleChange = (e) => {
    const value = ['budget', 'impactedApplications'].includes(e.target.name)
      ? parseInt(e.target.value)
      : e.target.value;
    setFormData({
      ...formData,
      [e.target.name]: value
    });
  };

  return (
    <div>
      <div className="page-actions">
        <div>
          <h1>Projects</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
            Track strategic initiatives and transformations
          </p>
        </div>
        <button className="btn btn-primary" onClick={handleAdd}>
          <Plus size={20} />
          Add Project
        </button>
      </div>

      <div className="card">
        <Table
          columns={columns}
          data={projects}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingProject ? 'Edit Project' : 'Add Project'}</h2>
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
                <label>Status *</label>
                <select name="status" value={formData.status} onChange={handleChange}>
                  <option>Planning</option>
                  <option>In Progress</option>
                  <option>On Hold</option>
                  <option>Completed</option>
                  <option>Cancelled</option>
                </select>
              </div>
              <div className="form-group">
                <label>Priority *</label>
                <select name="priority" value={formData.priority} onChange={handleChange}>
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                  <option>Critical</option>
                </select>
              </div>
              <div className="form-group">
                <label>Budget *</label>
                <input
                  type="number"
                  name="budget"
                  value={formData.budget}
                  onChange={handleChange}
                  min="0"
                  required
                />
              </div>
              <div className="form-group">
                <label>Start Date *</label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>End Date *</label>
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Impacted Applications</label>
                <input
                  type="number"
                  name="impactedApplications"
                  value={formData.impactedApplications}
                  onChange={handleChange}
                  min="0"
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingProject ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Projects;
