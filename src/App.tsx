import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import VirtualTryOn from './components/VirtualTryOn';

function App() {
  return (
    <Router>
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar [cite: 371] */}
        <aside className="w-64 bg-gray-800 text-white flex flex-col">
          <div className="p-4 text-xl font-bold border-b border-gray-700">DineySmart AI</div>
          <nav className="flex-1 p-4 space-y-2">
            <Link to="/" className="block p-2 hover:bg-gray-700 rounded">Dashboard</Link>
            <Link to="/try-on" className="block p-2 hover:bg-gray-700 rounded">Virtual Try-On</Link>
            <div className="block p-2 text-gray-500">Settings</div>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/try-on" element={<VirtualTryOn />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;