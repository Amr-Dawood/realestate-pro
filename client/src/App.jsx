import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Dashboard from './pages/Dashboard';
import Developers from './pages/Developers';
import Compounds from './pages/Compounds';
import Units from './pages/Units';
import Comparison from './pages/Comparison';

function App() {
    return (
        <BrowserRouter>
            <div className="app-layout">
                <Sidebar />
                <main className="main-content">
                    <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/developers" element={<Developers />} />
                        <Route path="/compounds" element={<Compounds />} />
                        <Route path="/units" element={<Units />} />
                        <Route path="/comparison" element={<Comparison />} />
                    </Routes>
                </main>
            </div>
        </BrowserRouter>
    );
}

function Sidebar() {
    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <div className="sidebar-logo">🏠 RealEstate Pro</div>
            </div>
            <nav className="sidebar-nav">
                <div className="nav-section">
                    <div className="nav-section-title">Overview</div>
                    <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                        <span className="nav-icon">📊</span>
                        Dashboard
                    </NavLink>
                </div>

                <div className="nav-section">
                    <div className="nav-section-title">Data Management</div>
                    <NavLink to="/developers" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                        <span className="nav-icon">🏢</span>
                        Developers
                    </NavLink>
                    <NavLink to="/compounds" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                        <span className="nav-icon">🏘️</span>
                        Compounds
                    </NavLink>
                    <NavLink to="/units" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                        <span className="nav-icon">🏠</span>
                        Units
                    </NavLink>
                </div>

                <div className="nav-section">
                    <div className="nav-section-title">Analysis</div>
                    <NavLink to="/comparison" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                        <span className="nav-icon">📋</span>
                        Comparison
                    </NavLink>
                </div>
            </nav>
        </aside>
    );
}

export default App;
