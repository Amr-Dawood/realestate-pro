import { useState, useEffect } from 'react';

const EMPTY_FORM = {
    name: '',
    type: 'apartment',
    bedrooms: 2,
    bathrooms: 2,
    area: 120,
    price: 5000000,
    floor: 1,
    view: '',
    finishingType: 'fully_finished',
    finishingSpecs: '',
    compoundId: '',
    resaleMarket: '',
    priceIncreaseRate: '',
    rateViaMarket: '',
    appreciationRate: '',
    rentYield: '',
    valueForMoney: '',
    locationUnit: '',
    footprint: '',
    constructionUpdate: '',
    paymentPlan: '',
};

export default function Units() {
    const [units, setUnits] = useState([]);
    const [compounds, setCompounds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingUnit, setEditingUnit] = useState(null);
    const [formData, setFormData] = useState(EMPTY_FORM);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [previewImage, setPreviewImage] = useState(null);

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
            const url = editingUnit ? `/api/units/${editingUnit.id}` : '/api/units';
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
                    floor: formData.floor ? parseInt(formData.floor) : null,
                    priceIncreaseRate: formData.priceIncreaseRate !== '' ? parseFloat(formData.priceIncreaseRate) : null,
                    rateViaMarket: formData.rateViaMarket !== '' ? parseFloat(formData.rateViaMarket) : null,
                    appreciationRate: formData.appreciationRate !== '' ? parseFloat(formData.appreciationRate) : null,
                    rentYield: formData.rentYield !== '' ? parseFloat(formData.rentYield) : null,
                    valueForMoney: formData.valueForMoney !== '' ? parseFloat(formData.valueForMoney) : null,
                })
            });

            fetchUnits();
            closeModal();
        } catch (error) {
            console.error('Error saving unit:', error);
        }
    };

    const handleFloorPlanUpload = async (unitId, file) => {
        if (!file) return;
        setUploadingImage(true);
        try {
            const fd = new FormData();
            fd.append('floorPlan', file);
            const res = await fetch(`/api/units/${unitId}/floor-plan`, { method: 'POST', body: fd });
            if (!res.ok) throw new Error('Upload failed');
            const data = await res.json();
            setPreviewImage(data.url);
            fetchUnits();
        } catch (error) {
            alert('Image upload failed: ' + error.message);
        } finally {
            setUploadingImage(false);
        }
    };

    const handleRemoveFloorPlan = async (unitId) => {
        if (!confirm('Remove floor plan image?')) return;
        setUploadingImage(true);
        try {
            await fetch(`/api/units/${unitId}/floor-plan`, { method: 'DELETE' });
            setPreviewImage(null);
            fetchUnits();
        } catch (error) {
            alert('Failed to remove image');
        } finally {
            setUploadingImage(false);
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
            setPreviewImage(unit.floorPlanImage || null);
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
                finishingSpecs: unit.finishingSpecs || '',
                compoundId: unit.compoundId.toString(),
                resaleMarket: unit.resaleMarket || '',
                priceIncreaseRate: unit.priceIncreaseRate ?? '',
                rateViaMarket: unit.rateViaMarket ?? '',
                appreciationRate: unit.appreciationRate ?? '',
                rentYield: unit.rentYield ?? '',
                valueForMoney: unit.valueForMoney ?? '',
                locationUnit: unit.locationUnit || '',
                footprint: unit.footprint || '',
                constructionUpdate: unit.constructionUpdate || '',
                paymentPlan: unit.paymentPlan || '',
            });
        } else {
            setEditingUnit(null);
            setPreviewImage(null);
            setFormData({ ...EMPTY_FORM, compoundId: compounds[0]?.id?.toString() || '' });
        }
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingUnit(null);
        setPreviewImage(null);
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

    const f = (key, value) => setFormData(prev => ({ ...prev, [key]: value }));

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
                    <p className="page-description">Manage individual property units</p>
                </div>
                <button className="btn btn-primary" onClick={() => openModal()}>➕ Add Unit</button>
            </div>

            {units.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">🏠</div>
                    <div className="empty-state-text">No units yet</div>
                    <button className="btn btn-primary" onClick={() => openModal()}>Add your first unit</button>
                </div>
            ) : (
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Property</th>
                                <th>Type</th>
                                <th>Beds</th>
                                <th>Area</th>
                                <th>Price</th>
                                <th>Appreciation</th>
                                <th>Rent Yield</th>
                                <th>Finishing</th>
                                <th>Floor Plan</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {units.map((unit) => (
                                <tr key={unit.id}>
                                    <td>
                                        <div>
                                            <strong>{unit.compound?.name}</strong>
                                            <div className="text-muted" style={{ fontSize: '0.75rem' }}>{unit.compound?.developer?.name}</div>
                                        </div>
                                    </td>
                                    <td>{getTypeBadge(unit.type)}</td>
                                    <td>{unit.bedrooms}</td>
                                    <td>{unit.area} sqm</td>
                                    <td><strong>{formatCurrency(unit.price)}</strong></td>
                                    <td>{unit.appreciationRate != null ? `${unit.appreciationRate}%` : '—'}</td>
                                    <td>{unit.rentYield != null ? `${unit.rentYield}%` : '—'}</td>
                                    <td>{getFinishingBadge(unit.finishingType)}</td>
                                    <td>
                                        {unit.floorPlanImage ? (
                                            <img
                                                src={unit.floorPlanImage}
                                                alt="Floor Plan"
                                                style={{ width: 50, height: 40, objectFit: 'cover', borderRadius: 4, cursor: 'pointer' }}
                                                onClick={() => window.open(unit.floorPlanImage, '_blank')}
                                            />
                                        ) : <span className="text-muted" style={{ fontSize: '0.75rem' }}>—</span>}
                                    </td>
                                    <td>
                                        <div className="actions">
                                            <button className="action-btn" onClick={() => openModal(unit)}>✏️</button>
                                            <button className="action-btn delete" onClick={() => handleDelete(unit.id)}>🗑️</button>
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
                    <div className="modal" style={{ maxWidth: 760, maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">{editingUnit ? 'Edit Unit' : 'Add Unit'}</h2>
                            <button className="modal-close" onClick={closeModal}>×</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">

                                {/* === BASIC INFO === */}
                                <h4 style={{ color: 'var(--color-primary)', marginBottom: 'var(--space-sm)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    🏠 Basic Information
                                </h4>

                                <div className="form-group">
                                    <label className="form-label">Compound *</label>
                                    <select className="form-select" value={formData.compoundId} onChange={(e) => f('compoundId', e.target.value)} required>
                                        <option value="">Select Compound</option>
                                        {compounds.map((c) => (
                                            <option key={c.id} value={c.id}>{c.name} ({c.developer?.name})</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Unit Type *</label>
                                        <select className="form-select" value={formData.type} onChange={(e) => f('type', e.target.value)} required>
                                            <option value="studio">Studio</option>
                                            <option value="apartment">Apartment</option>
                                            <option value="duplex">Duplex</option>
                                            <option value="penthouse">Penthouse</option>
                                            <option value="townhouse">Townhouse</option>
                                            <option value="villa">Villa</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Finishing Type *</label>
                                        <select className="form-select" value={formData.finishingType} onChange={(e) => f('finishingType', e.target.value)} required>
                                            <option value="core_shell">Core & Shell</option>
                                            <option value="semi_finished">Semi-Finished</option>
                                            <option value="fully_finished">Fully Finished</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="form-row-3">
                                    <div className="form-group">
                                        <label className="form-label">Bedrooms *</label>
                                        <input type="number" className="form-input" value={formData.bedrooms} onChange={(e) => f('bedrooms', e.target.value)} required min="0" />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Bathrooms *</label>
                                        <input type="number" className="form-input" value={formData.bathrooms} onChange={(e) => f('bathrooms', e.target.value)} required min="1" />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Floor</label>
                                        <input type="number" className="form-input" value={formData.floor} onChange={(e) => f('floor', e.target.value)} min="0" />
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Area (sqm) *</label>
                                        <input type="number" className="form-input" value={formData.area} onChange={(e) => f('area', e.target.value)} required min="1" step="0.01" />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Price (EGP) *</label>
                                        <input type="number" className="form-input" value={formData.price} onChange={(e) => f('price', e.target.value)} required min="1" />
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">View</label>
                                        <select className="form-select" value={formData.view} onChange={(e) => f('view', e.target.value)}>
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
                                    <div className="form-group">
                                        <label className="form-label">Location Unit</label>
                                        <input type="text" className="form-input" value={formData.locationUnit} onChange={(e) => f('locationUnit', e.target.value)} placeholder="e.g. Building A, East Wing" />
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Finishing Specs</label>
                                        <input type="text" className="form-input" value={formData.finishingSpecs} onChange={(e) => f('finishingSpecs', e.target.value)} placeholder="e.g. Italian marble, branded kitchens, smart home" />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Foot Print / Layout</label>
                                        <input type="text" className="form-input" value={formData.footprint} onChange={(e) => f('footprint', e.target.value)} placeholder="e.g. Open plan, L-shaped" />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Payment Plan</label>
                                    <input type="text" className="form-input" value={formData.paymentPlan} onChange={(e) => f('paymentPlan', e.target.value)} placeholder="e.g. 10% down, 5 years installment" />
                                </div>

                                <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: 'var(--space-lg) 0' }} />

                                {/* === MARKET & INVESTMENT === */}
                                <h4 style={{ color: 'var(--color-primary)', marginBottom: 'var(--space-sm)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    📈 Market &amp; Investment Data
                                </h4>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Resale Market</label>
                                        <input type="text" className="form-input" value={formData.resaleMarket} onChange={(e) => f('resaleMarket', e.target.value)} placeholder="e.g. High demand, limited supply" />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Rate via Market (EGP/sqm)</label>
                                        <input type="number" className="form-input" value={formData.rateViaMarket} onChange={(e) => f('rateViaMarket', e.target.value)} placeholder="e.g. 45000" min="0" step="0.01" />
                                    </div>
                                </div>

                                <div className="form-row-3">
                                    <div className="form-group">
                                        <label className="form-label">Price Increase (%/yr)</label>
                                        <input type="number" className="form-input" value={formData.priceIncreaseRate} onChange={(e) => f('priceIncreaseRate', e.target.value)} placeholder="e.g. 20" min="0" step="0.1" />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Appreciation (%/yr)</label>
                                        <input type="number" className="form-input" value={formData.appreciationRate} onChange={(e) => f('appreciationRate', e.target.value)} placeholder="e.g. 18" min="0" step="0.1" />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Rent Yield (%/yr)</label>
                                        <input type="number" className="form-input" value={formData.rentYield} onChange={(e) => f('rentYield', e.target.value)} placeholder="e.g. 8" min="0" step="0.1" />
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Value for Money (1–10)</label>
                                        <input type="number" className="form-input" value={formData.valueForMoney} onChange={(e) => f('valueForMoney', e.target.value)} placeholder="e.g. 8.5" min="1" max="10" step="0.1" />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Construction Update</label>
                                        <input type="text" className="form-input" value={formData.constructionUpdate} onChange={(e) => f('constructionUpdate', e.target.value)} placeholder="e.g. 70% complete, Q2 2026" />
                                    </div>
                                </div>

                                <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: 'var(--space-lg) 0' }} />

                                {/* === FLOOR PLAN IMAGE === */}
                                <h4 style={{ color: 'var(--color-primary)', marginBottom: 'var(--space-sm)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    🗺️ Unit 2D Floor Plan
                                </h4>

                                {editingUnit ? (
                                    <div>
                                        {previewImage && (
                                            <div style={{ marginBottom: 'var(--space-md)' }}>
                                                <img
                                                    src={previewImage}
                                                    alt="Floor Plan"
                                                    style={{ maxWidth: '100%', maxHeight: 280, objectFit: 'contain', borderRadius: 8, border: '1px solid var(--color-border)' }}
                                                />
                                                <div style={{ marginTop: 'var(--space-sm)' }}>
                                                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => handleRemoveFloorPlan(editingUnit.id)} disabled={uploadingImage}>
                                                        🗑️ Remove Image
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                        {!previewImage && <p className="text-muted" style={{ marginBottom: 'var(--space-sm)', fontSize: '0.85rem' }}>No floor plan uploaded yet.</p>}
                                        <div className="form-group">
                                            <label className="form-label">Upload Floor Plan Image</label>
                                            <input
                                                type="file"
                                                className="form-input"
                                                accept="image/*"
                                                disabled={uploadingImage}
                                                onChange={(e) => { const file = e.target.files[0]; if (file) handleFloorPlanUpload(editingUnit.id, file); }}
                                            />
                                            {uploadingImage && <p style={{ fontSize: '0.8rem', color: 'var(--color-primary)', marginTop: 4 }}>Uploading...</p>}
                                            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: 4 }}>Accepted: JPG, PNG, WEBP. Max 10MB.</p>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-muted" style={{ fontSize: '0.85rem' }}>
                                        💡 Save the unit first, then edit it to upload a floor plan image.
                                    </p>
                                )}
                            </div>

                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
                                <button type="submit" className="btn btn-primary">{editingUnit ? 'Update' : 'Create'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}