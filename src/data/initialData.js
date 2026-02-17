export const initialApplications = [
  {
    id: 1,
    name: 'Customer Relationship Management',
    type: 'Business Application',
    status: 'Production',
    businessCapability: 'Customer Management',
    owner: 'Sales Department',
    criticality: 'High',
    technicalDebt: 'Low',
    lastUpdated: '2024-01-15'
  },
  {
    id: 2,
    name: 'Enterprise Resource Planning',
    type: 'Business Application',
    status: 'Production',
    businessCapability: 'Resource Planning',
    owner: 'Operations',
    criticality: 'Critical',
    technicalDebt: 'Medium',
    lastUpdated: '2024-02-10'
  },
  {
    id: 3,
    name: 'Data Warehouse',
    type: 'Data Platform',
    status: 'Production',
    businessCapability: 'Analytics & Reporting',
    owner: 'IT Department',
    criticality: 'High',
    technicalDebt: 'Low',
    lastUpdated: '2024-01-28'
  },
  {
    id: 4,
    name: 'Legacy Billing System',
    type: 'Business Application',
    status: 'Deprecated',
    businessCapability: 'Financial Management',
    owner: 'Finance',
    criticality: 'Medium',
    technicalDebt: 'High',
    lastUpdated: '2023-11-05'
  },
  {
    id: 5,
    name: 'Cloud Integration Platform',
    type: 'Integration',
    status: 'Production',
    businessCapability: 'System Integration',
    owner: 'IT Department',
    criticality: 'High',
    technicalDebt: 'Low',
    lastUpdated: '2024-02-14'
  }
];

export const initialCapabilities = [
  {
    id: 1,
    name: 'Customer Management',
    level: 'Business',
    description: 'Manage customer relationships and interactions',
    maturity: 'Optimized',
    applications: 3
  },
  {
    id: 2,
    name: 'Resource Planning',
    level: 'Business',
    description: 'Plan and manage organizational resources',
    maturity: 'Managed',
    applications: 2
  },
  {
    id: 3,
    name: 'Analytics & Reporting',
    level: 'Technical',
    description: 'Data analysis and business intelligence',
    maturity: 'Defined',
    applications: 4
  },
  {
    id: 4,
    name: 'Financial Management',
    level: 'Business',
    description: 'Financial planning, budgeting, and accounting',
    maturity: 'Managed',
    applications: 3
  },
  {
    id: 5,
    name: 'System Integration',
    level: 'Technical',
    description: 'Integration between systems and platforms',
    maturity: 'Optimized',
    applications: 1
  }
];

export const initialProjects = [
  {
    id: 1,
    name: 'CRM System Upgrade',
    status: 'In Progress',
    priority: 'High',
    budget: 250000,
    startDate: '2024-01-01',
    endDate: '2024-06-30',
    impactedApplications: 2
  },
  {
    id: 2,
    name: 'Legacy System Migration',
    status: 'Planning',
    priority: 'Critical',
    budget: 500000,
    startDate: '2024-03-01',
    endDate: '2024-12-31',
    impactedApplications: 5
  },
  {
    id: 3,
    name: 'Cloud Data Platform',
    status: 'In Progress',
    priority: 'High',
    budget: 350000,
    startDate: '2023-10-01',
    endDate: '2024-04-30',
    impactedApplications: 3
  }
];
