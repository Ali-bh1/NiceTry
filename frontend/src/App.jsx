import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Scanner from './pages/Scanner.jsx';
import ThreatGraph from './pages/ThreatGraph.jsx';
import Reports from './pages/Reports.jsx';
import About from './pages/About.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/scan" element={<Scanner />} />
        <Route path="/graph" element={<ThreatGraph />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/about" element={<About />} />
      </Route>
    </Routes>
  );
}
