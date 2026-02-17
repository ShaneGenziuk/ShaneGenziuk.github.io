import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, AlertTriangle, CheckCircle, Activity } from 'lucide-react';

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

function Dashboard({ applications, capabilities, projects }) {
  const statusData = applications.reduce((acc, app) => {
    const status = app.status;
    const existing = acc.find(item => item.name === status);
    if (existing) {
      existing.value += 1;
    } else {
      acc.push({ name: status, value: 1 });
    }
    return acc;
  }, []);

  const criticalityData = applications.reduce((acc, app) => {
    const crit = app.criticality;
    const existing = acc.find(item => item.name === crit);
    if (existing) {
      existing.value += 1;
    } else {
      acc.push({ name: crit, value: 1 });
    }
    return acc;
  }, []);

  const technicalDebtData = [
    { name: 'Low', value: applications.filter(a => a.technicalDebt === 'Low').length },
    { name: 'Medium', value: applications.filter(a => a.technicalDebt === 'Medium').length },
    { name: 'High', value: applications.filter(a => a.technicalDebt === 'High').length },
  ];

  const capabilityMaturityData = capabilities.map(cap => ({
    name: cap.name,
    applications: cap.applications,
    maturity: cap.maturity === 'Optimized' ? 5 : cap.maturity === 'Managed' ? 4 : cap.maturity === 'Defined' ? 3 : 2
  }));

  const criticalApps = applications.filter(a => a.criticality === 'Critical').length;
  const highDebtApps = applications.filter(a => a.technicalDebt === 'High').length;
  const activeProjects = projects.filter(p => p.status === 'In Progress').length;
  const totalBudget = projects.reduce((sum, p) => sum + p.budget, 0);

  return (
    <div className="dashboard">
      <div className="page-header">
        <h1>Enterprise Architecture Dashboard</h1>
        <p>Overview of your IT landscape and strategic initiatives</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Applications</div>
          <div className="stat-value">{applications.length}</div>
          <div className="stat-change">
            <Activity size={16} style={{ display: 'inline', marginRight: '4px' }} />
            Across {capabilities.length} capabilities
          </div>
        </div>

        <div className="stat-card warning">
          <div className="stat-label">Critical Applications</div>
          <div className="stat-value">{criticalApps}</div>
          <div className="stat-change">
            <AlertTriangle size={16} style={{ display: 'inline', marginRight: '4px' }} />
            Require immediate attention
          </div>
        </div>

        <div className="stat-card danger">
          <div className="stat-label">High Technical Debt</div>
          <div className="stat-value">{highDebtApps}</div>
          <div className="stat-change">
            <TrendingUp size={16} style={{ display: 'inline', marginRight: '4px' }} />
            Need modernization
          </div>
        </div>

        <div className="stat-card success">
          <div className="stat-label">Active Projects</div>
          <div className="stat-value">{activeProjects}</div>
          <div className="stat-change">
            <CheckCircle size={16} style={{ display: 'inline', marginRight: '4px' }} />
            ${(totalBudget / 1000000).toFixed(1)}M budget
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="card">
          <h2>Application Status Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h2>Application Criticality</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={criticalityData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#2563eb" name="Applications" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h2>Technical Debt Analysis</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={technicalDebtData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {technicalDebtData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h2>Business Capability Maturity</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={capabilityMaturityData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="maturity" fill="#10b981" name="Maturity Level" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
