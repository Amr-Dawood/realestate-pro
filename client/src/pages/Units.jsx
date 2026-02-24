import { useState, useEffect } from 'react';

export default function Units() {
    const [units, setUnits] = useState([]);
    const [compounds, setCompounds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingUnit, setEditingUnit] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        type: 'apartment',
        bedrooms: 2,
        bathrooms: 2,
        area: 120,
        price: 5000000,
        floor: 1,
        view: '',
        finishingType: 'fully_finished',
        compoundId: ''
    });

    useEffect(() => {
        Promise.all([fetchUnits(), fetchCompounds()]);
    }, []);

    const fetchUnits = async () => {
        try {
            const res = await fetch('/api/units');
            const data = await res.json();
            setUnits(data);
        } catch (error) {
            console.error('Error fetching units:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchCompounds = async () => {
        try {
            const res = await fetch('/api/compounds');
            const data = await res.json();
            setCompounds(data);
        } catch (error) {
            console.error('Error fetching compounds:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const url = editingUnit
                ? `/api/units/${editingUnit.id}`
                : '/api/units';
            const method = editingUnit ? 'PUT' : 'POST';

            await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    compoundId: parseInt(formData.compoundId),
                    bedrooms: parseInt(formData.bedrooms),
                    bathrooms: parseInt(formData.bathrooms),
                    area: parseFloat(formData.area),
                    price: parseFloat(formData.price),
                    floor: formData.floor ? parseInt(formData.floor) : null
                })
            });

            fetchUnits();
            closeModal();
        } catch (error) {
            console.error('Error saving unit:', error);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this unit?')) return;
        try {
            await fetch(`/api/units/${id}`, { method: 'DELETE' });
            fetchUnits();
        } catch (error) {
            console.error('Error deleting unit:', error);
        }
    };

    const openModal = (unit = null) => {
        if (unit) {
            setEditingUnit(unit);
            setFormData({
                name: unit.name || '',
                type: unit.type,
                bedrooms: unit.bedrooms,
                bathrooms: unit.bathrooms,
                area: unit.area,
                price: unit.price,
                floor: unit.floor || '',
                view: unit.view || '',
                finishingType: unit.finishingType,
                compoundId: unit.compoundId.toString()
            });
        } else {
            setEditingUnit(null);
            setFormData({
                name: '',
                type: 'apartment',
                bedrooms: 2,
                bathrooms: 2,
                area: 120,
                price: 5000000,
                floor: 1,
                view: '',
                finishingType: 'fully_finished',
                compoundId: compounds[0]?.id?.toString() || ''
            });
        }
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingUnit(null);
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-EG', {
            style: 'currency',
            currency: 'EGP',
            maximumFractionDigits: 0
        }).format(amount);
    };

    const getTypeBadge = (type) => {
        const types = {
            studio: '🏨 Studio',
            apartment: '🏠 Apartment',
            duplex: '🏡 Duplex',
            penthouse: '🌆 Penthouse',
            townhouse: '🏘️ Townhouse',
            villa: '🏰 Villa'
        };
        return types[type] || type;
    };

    const getFinishingBadge = (finishing) => {
        const badges = {
            core_shell: { class: 'badge-danger', text: 'Core & Shell' },
            semi_finished: { class: 'badge-warning', text: 'Semi-Finished' },
            fully_finished: { class: 'badge-accent', text: 'Fully Finished' }
        };
        const badge = badges[finishing] || badges.semi_finished;
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
                    <h1 className="page-title">Units</h1>
                    <p className="page-description">
                        Manage individual property units
                    </p>
                </div>
                <button className="btn btn-primary" onClick={() => openModal()}>
                    ➕ Add Unit
                </button>
            </div>

            {units.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">🏠</div>
                    <div className="empty-state-text">No units yet</div>
                    <button className="btn btn-primary" onClick={() => openModal()}>
                        Add your first unit
                    </button>
                </div>
            ) : (
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Property</th>
                                <th>Type</th>
                                <th>Beds</th>
                                <th>Baths</th>
                                <th>Area</th>
                                <th>Price</th>
                                <th>Finishing</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {units.map((unit) => (
                                <tr key={unit.id}>
                                    <td>
                                        <div>
                                            <strong>{unit.compound?.name}</strong>
                                            <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                                                {unit.compound?.developer?.name}
                                            </div>
                                        </div>
                                    </td>
                                    <td>{getTypeBadge(unit.type)}</td>
                                    <td>{unit.bedrooms}</td>
                                    <td>{unit.bathrooms}</td>
                                    <td>{unit.area} sqm</td>
                                    <td><strong>{formatCurrency(unit.price)}</strong></td>
                                    <td>{getFinishingBadge(unit.finishingType)}</td>
                                    <td>
                                        <div className="actions">
                                            <button className="action-btn" onClick={() => openModal(unit)}>
                                                ✏️
                                            </button>
                                            <button className="action-btn delete" onClick={() => handleDelete(unit.id)}>
                                                🗑️
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {showModal && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">
                                {editingUnit ? 'Edit Unit' : 'Add Unit'}
                            </h2>
                            <button className="modal-close" onClick={closeModal}>×</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label">Compound *</label>
                                    <select
                                        className="form-select"
                                        value={formData.compoundId}
                                        onChange={(e) => setFormData({ ...formData, compoundId: e.target.value })}
                                        required
                                    >
                                        <option value="">Select Compound</option>
                                        {compounds.map((c) => (
                                            <option key={c.id} value={c.id}>
                                                {c.name} ({c.developer?.name})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Unit Type *</label>
                                        <select
                                            className="form-select"
                                            value={formData.type}
                                            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                            required
                                        >
                                            <option value="studio">Studio</option>
                                            <option value="apartment">Apartment</option>
                                            <option value="duplex">Duplex</option>
                                            <option value="penthouse">Penthouse</option>
                                            <option value="townhouse">Townhouse</option>
                                            <option value="villa">Villa</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Finishing *</label>
                                        <select
                                            className="form-select"
                                            value={formData.finishingType}
                                            onChange={(e) => setFormData({ ...formData, finishingType: e.target.value })}
                                            required
                                        >
                                            <option value="core_shell">Core & Shell</option>
                                            <option value="semi_finished">Semi-Finished</option>
                                            <option value="fully_finished">Fully Finished</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="form-row-3">
                                    <div className="form-group">
                                        <label className="form-label">Bedrooms *</label>
                                        <input
                                            type="number"
                                            className="form-input"
                                            value={formData.bedrooms}
                                            onChange={(e) => setFormData({ ...formData, bedrooms: e.target.value })}
                                            required
                                            min="0"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Bathrooms *</label>
                                        <input
                                            type="number"
                                            className="form-input"
                                            value={formData.bathrooms}
                                            onChange={(e) => setFormData({ ...formData, bathrooms: e.target.value })}
                                            required
                                            min="1"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Floor</label>
                                        <input
                                            type="number"
                                            className="form-input"
                                            value={formData.floor}
                                            onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                                            min="0"
                                        />
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Area (sqm) *</label>
                                        <input
                                            type="number"
                                            className="form-input"
                                            value={formData.area}
                                            onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                                            required
                                            min="1"
                                            step="0.01"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Price (EGP) *</label>
                                        <input
                                            type="number"
                                            className="form-input"
                                            value={formData.price}
                                            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                            required
                                            min="1"
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">View</label>
                                    <select
                                        className="form-select"
                                        value={formData.view}
                                        onChange={(e) => setFormData({ ...formData, view: e.target.value })}
                                    >
                                        <option value="">Select View</option>
                                        <option value="garden">Garden</option>
                                        <option value="pool">Pool</option>
                                        <option value="lake">Lake</option>
                                        <option value="sea">Sea</option>
                                        <option value="golf">Golf Course</option>
                                        <option value="city">City</option>
                                        <option value="street">Street</option>
                                        <option value="park">Park</option>
                                    </select>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    {editingUnit ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
