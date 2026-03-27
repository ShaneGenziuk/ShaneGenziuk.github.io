import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Boxes, Layers, FolderKanban } from 'lucide-react';
import './Navigation.css';

function Navigation() {
  const location = useLocation();

  const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/applications', icon: Boxes, label: 'Applications' },
    { path: '/capabilities', icon: Layers, label: 'Capabilities' },
    { path: '/projects', icon: FolderKanban, label: 'Projects' },
  ];

  return (
    <nav className="navigation">
      <div className="nav-header">
        <h1 className="nav-title">EA Tool</h1>
        <p className="nav-subtitle">Enterprise Architecture</p>
      </div>
      <ul className="nav-menu">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <li key={item.path}>
              <Link
                to={item.path}
                className={`nav-link ${isActive ? 'active' : ''}`}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export default Navigation;
