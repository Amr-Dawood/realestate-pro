import { useState, useEffect } from 'react';

export default function Developers() {
    const [developers, setDevelopers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingDeveloper, setEditingDeveloper] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        website: '',
        phone: '',
        email: '',
        address: ''
    });

    useEffect(() => {
        fetchDevelopers();
    }, []);

    const fetchDevelopers = async () => {
        try {
            const res = await fetch('/api/developers');
            const data = await res.json();
            setDevelopers(data);
        } catch (error) {
            console.error('Error fetching developers:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const url = editingDeveloper
                ? `/api/developers/${editingDeveloper.id}`
                : '/api/developers';
            const method = editingDeveloper ? 'PUT' : 'POST';

            await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            fetchDevelopers();
            closeModal();
        } catch (error) {
            console.error('Error saving developer:', error);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this developer?')) return;
        try {
            await fetch(`/api/developers/${id}`, { method: 'DELETE' });
            fetchDevelopers();
        } catch (error) {
            console.error('Error deleting developer:', error);
        }
    };

    const openModal = (developer = null) => {
        if (developer) {
            setEditingDeveloper(developer);
            setFormData({
                name: developer.name,
                description: developer.description || '',
                website: developer.website || '',
                phone: developer.phone || '',
                email: developer.email || '',
                address: developer.address || ''
            });
        } else {
            setEditingDeveloper(null);
            setFormData({
                name: '',
                description: '',
                website: '',
                phone: '',
                email: '',
                address: ''
            });
        }
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingDeveloper(null);
    };

    if (loading) {
        return (
            <div className="loading">
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div>
            <div className="page-header flex justify-between items-center">
                <div>
                    <h1 className="page-title">Developers</h1>
                    <p className="page-description">
                        Manage real estate developers and their information
                    </p>
                </div>
                <button className="btn btn-primary" onClick={() => openModal()}>
                    ➕ Add Developer
                </button>
            </div>

            {developers.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">🏢</div>
                    <div className="empty-state-text">No developers yet</div>
                    <button className="btn btn-primary" onClick={() => openModal()}>
                        Add your first developer
                    </button>
                </div>
            ) : (
                <div className="card-grid">
                    {developers.map((dev) => (
                        <div key={dev.id} className="card">
                            <div className="card-header">
                                <h3 className="card-title">{dev.name}</h3>
                                <div className="actions">
                                    <button className="action-btn" onClick={() => openModal(dev)}>
                                        ✏️
                                    </button>
                                    <button className="action-btn delete" onClick={() => handleDelete(dev.id)}>
                                        🗑️
                                    </button>
                                </div>
                            </div>
                            {dev.description && (
                                <p className="text-muted mb-md">{dev.description}</p>
                            )}
                            <div className="result-card-details">
                                <div className="result-card-detail">
                                    <span className="result-card-detail-icon">🏘️</span>
                                    {dev.compounds?.length || 0} Compounds
                                </div>
                                <div className="result-card-detail">
                                    <span className="result-card-detail-icon">🏠</span>
                                    {dev.compounds?.reduce((sum, c) => sum + (c._count?.units || 0), 0)} Units
                                </div>
                                {dev.phone && (
                                    <div className="result-card-detail">
                                        <span className="result-card-detail-icon">📞</span>
                                        {dev.phone}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showModal && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">
                                {editingDeveloper ? 'Edit Developer' : 'Add Developer'}
                            </h2>
                            <button className="modal-close" onClick={closeModal}>×</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label">Name *</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                        placeholder="e.g., Palm Hills Developments"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Description</label>
                                    <textarea
                                        className="form-textarea"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Brief description of the developer"
                                    />
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Website</label>
                                        <input
                                            type="url"
                                            className="form-input"
                                            value={formData.website}
                                            onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                                            placeholder="https://example.com"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Phone</label>
                                        <input
                                            type="tel"
                                            className="form-input"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            placeholder="+20 2 1234 5678"
                                        />
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Email</label>
                                        <input
                                            type="email"
                                            className="form-input"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            placeholder="info@example.com"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Address</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={formData.address}
                                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                            placeholder="Cairo, Egypt"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    {editingDeveloper ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
