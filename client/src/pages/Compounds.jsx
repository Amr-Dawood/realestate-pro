import { useState, useEffect } from 'react';

export default function Compounds() {
    const [compounds, setCompounds] = useState([]);
    const [developers, setDevelopers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingCompound, setEditingCompound] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        location: '',
        city: '',
        type: 'residential',
        status: 'under_construction',
        deliveryDate: '',
        description: '',
        developerId: ''
    });

    useEffect(() => {
        Promise.all([fetchCompounds(), fetchDevelopers()]);
    }, []);

    const fetchCompounds = async () => {
        try {
            const res = await fetch('/api/compounds');
            const data = await res.json();
            setCompounds(data);
        } catch (error) {
            console.error('Error fetching compounds:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchDevelopers = async () => {
        try {
            const res = await fetch('/api/developers');
            const data = await res.json();
            setDevelopers(data);
        } catch (error) {
            console.error('Error fetching developers:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const url = editingCompound
                ? `/api/compounds/${editingCompound.id}`
                : '/api/compounds';
            const method = editingCompound ? 'PUT' : 'POST';

            await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    developerId: parseInt(formData.developerId)
                })
            });

            fetchCompounds();
            closeModal();
        } catch (error) {
            console.error('Error saving compound:', error);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this compound?')) return;
        try {
            await fetch(`/api/compounds/${id}`, { method: 'DELETE' });
            fetchCompounds();
        } catch (error) {
            console.error('Error deleting compound:', error);
        }
    };

    const openModal = (compound = null) => {
        if (compound) {
            setEditingCompound(compound);
            setFormData({
                name: compound.name,
                location: compound.location,
                city: compound.city || '',
                type: compound.type,
                status: compound.status || 'under_construction',
                deliveryDate: compound.deliveryDate || '',
                description: compound.description || '',
                developerId: compound.developerId.toString()
            });
        } else {
            setEditingCompound(null);
            setFormData({
                name: '',
                location: '',
                city: '',
                type: 'residential',
                status: 'under_construction',
                deliveryDate: '',
                description: '',
                developerId: developers[0]?.id?.toString() || ''
            });
        }
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingCompound(null);
    };

    const getStatusBadge = (status) => {
        const badges = {
            ready: { class: 'badge-accent', text: 'Ready' },
            under_construction: { class: 'badge-warning', text: 'Under Construction' },
            launching: { class: 'badge-primary', text: 'Launching' }
        };
        const badge = badges[status] || badges.under_construction;
        return <span className={`badge ${badge.class}`}>{badge.text}</span>;
    };

    const getTypeBadge = (type) => {
        const badges = {
            residential: { class: 'badge-primary', text: '🏠 Residential' },
            commercial: { class: 'badge-warning', text: '🏢 Commercial' },
            mixed: { class: 'badge-accent', text: '🏘️ Mixed' }
        };
        const badge = badges[type] || badges.residential;
        return <span className={`badge ${badge.class}`}>{badge.text}</span>;
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
                    <h1 className="page-title">Compounds</h1>
                    <p className="page-description">
                        Manage compound projects and their details
                    </p>
                </div>
                <button className="btn btn-primary" onClick={() => openModal()}>
                    ➕ Add Compound
                </button>
            </div>

            {compounds.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">🏘️</div>
                    <div className="empty-state-text">No compounds yet</div>
                    <button className="btn btn-primary" onClick={() => openModal()}>
                        Add your first compound
                    </button>
                </div>
            ) : (
                <div className="card-grid">
                    {compounds.map((compound) => (
                        <div key={compound.id} className="card">
                            <div className="card-header">
                                <h3 className="card-title">{compound.name}</h3>
                                <div className="actions">
                                    <button className="action-btn" onClick={() => openModal(compound)}>
                                        ✏️
                                    </button>
                                    <button className="action-btn delete" onClick={() => handleDelete(compound.id)}>
                                        🗑️
                                    </button>
                                </div>
                            </div>

                            <div className="flex gap-sm mb-md">
                                {getTypeBadge(compound.type)}
                                {getStatusBadge(compound.status)}
                            </div>

                            <p className="text-muted mb-md">
                                📍 {compound.location}{compound.city && `, ${compound.city}`}
                            </p>

                            {compound.description && (
                                <p className="text-muted mb-md" style={{ fontSize: '0.875rem' }}>
                                    {compound.description.slice(0, 100)}...
                                </p>
                            )}

                            <div className="result-card-details">
                                <div className="result-card-detail">
                                    <span className="result-card-detail-icon">🏢</span>
                                    {compound.developer?.name}
                                </div>
                                <div className="result-card-detail">
                                    <span className="result-card-detail-icon">🏠</span>
                                    {compound._count?.units || 0} Units
                                </div>
                                {compound.deliveryDate && (
                                    <div className="result-card-detail">
                                        <span className="result-card-detail-icon">📅</span>
                                        {compound.deliveryDate}
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
                                {editingCompound ? 'Edit Compound' : 'Add Compound'}
                            </h2>
                            <button className="modal-close" onClick={closeModal}>×</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label">Developer *</label>
                                    <select
                                        className="form-select"
                                        value={formData.developerId}
                                        onChange={(e) => setFormData({ ...formData, developerId: e.target.value })}
                                        required
                                    >
                                        <option value="">Select Developer</option>
                                        {developers.map((dev) => (
                                            <option key={dev.id} value={dev.id}>{dev.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Compound Name *</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                        placeholder="e.g., Palm Hills October"
                                    />
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Location *</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={formData.location}
                                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                            required
                                            placeholder="e.g., 6th of October City"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">City</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={formData.city}
                                            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                            placeholder="e.g., Giza"
                                        />
                                    </div>
                                </div>
                                <div className="form-row-3">
                                    <div className="form-group">
                                        <label className="form-label">Type *</label>
                                        <select
                                            className="form-select"
                                            value={formData.type}
                                            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                            required
                                        >
                                            <option value="residential">Residential</option>
                                            <option value="commercial">Commercial</option>
                                            <option value="mixed">Mixed</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Status</label>
                                        <select
                                            className="form-select"
                                            value={formData.status}
                                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                        >
                                            <option value="under_construction">Under Construction</option>
                                            <option value="ready">Ready</option>
                                            <option value="launching">Launching</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Delivery Date</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={formData.deliveryDate}
                                            onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
                                            placeholder="e.g., 2026"
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Description</label>
                                    <textarea
                                        className="form-textarea"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Brief description of the compound"
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    {editingCompound ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
