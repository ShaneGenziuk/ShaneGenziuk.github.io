import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useState } from 'react';
import Navigation from './components/Navigation';
import Dashboard from './pages/Dashboard';
import Applications from './pages/Applications';
import Capabilities from './pages/Capabilities';
import Projects from './pages/Projects';
import { initialApplications, initialCapabilities, initialProjects } from './data/initialData';
import './App.css';

function App() {
  const [applications, setApplications] = useState(initialApplications);
  const [capabilities, setCapabilities] = useState(initialCapabilities);
  const [projects, setProjects] = useState(initialProjects);

  return (
    <Router>
      <div className="app">
        <Navigation />
        <main className="main-content">
          <Routes>
            <Route path="/" element={
              <Dashboard
                applications={applications}
                capabilities={capabilities}
                projects={projects}
              />
            } />
            <Route path="/applications" element={
              <Applications
                applications={applications}
                setApplications={setApplications}
              />
            } />
            <Route path="/capabilities" element={
              <Capabilities
                capabilities={capabilities}
                setCapabilities={setCapabilities}
              />
            } />
            <Route path="/projects" element={
              <Projects
                projects={projects}
                setProjects={setProjects}
              />
            } />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
