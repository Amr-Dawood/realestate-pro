import { useState, useEffect } from 'react';

export default function Comparison() {
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState(null);
    const [summary, setSummary] = useState(null);
    const [generatingPdf, setGeneratingPdf] = useState(false);
    const [requirements, setRequirements] = useState({
        customerName: '',
        email: '',
        phone: '',
        minBedrooms: '',
        maxBedrooms: '',
        minBathrooms: '',
        maxBathrooms: '',
        minArea: '',
        maxArea: '',
        minBudget: '',
        maxBudget: '',
        preferredLocations: [],
        preferredTypes: [],
        finishingType: '',
        notes: ''
    });

    const locations = ['New Cairo', '6th of October City', 'Sheikh Zayed', 'Giza', 'Cairo'];
    const unitTypes = ['studio', 'apartment', 'duplex', 'penthouse', 'townhouse', 'villa'];

    const handleLocationToggle = (loc) => {
        setRequirements(prev => ({
            ...prev,
            preferredLocations: prev.preferredLocations.includes(loc)
                ? prev.preferredLocations.filter(l => l !== loc)
                : [...prev.preferredLocations, loc]
        }));
    };

    const handleTypeToggle = (type) => {
        setRequirements(prev => ({
            ...prev,
            preferredTypes: prev.preferredTypes.includes(type)
                ? prev.preferredTypes.filter(t => t !== type)
                : [...prev.preferredTypes, type]
        }));
    };

    const handleCompare = async () => {
        if (!requirements.customerName) {
            alert('Please enter customer name');
            return;
        }

        setLoading(true);
        try {
            const payload = {
                ...requirements,
                minBedrooms: requirements.minBedrooms ? parseInt(requirements.minBedrooms) : null,
                maxBedrooms: requirements.maxBedrooms ? parseInt(requirements.maxBedrooms) : null,
                minBathrooms: requirements.minBathrooms ? parseInt(requirements.minBathrooms) : null,
                maxBathrooms: requirements.maxBathrooms ? parseInt(requirements.maxBathrooms) : null,
                minArea: requirements.minArea ? parseFloat(requirements.minArea) : null,
                maxArea: requirements.maxArea ? parseFloat(requirements.maxArea) : null,
                minBudget: requirements.minBudget ? parseFloat(requirements.minBudget) : null,
                maxBudget: requirements.maxBudget ? parseFloat(requirements.maxBudget) : null,
                preferredLocations: JSON.stringify(requirements.preferredLocations),
                preferredTypes: JSON.stringify(requirements.preferredTypes)
            };

            const res = await fetch('/api/compare', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            setResults(data.results);
            setSummary(data.summary);
        } catch (error) {
            console.error('Error running comparison:', error);
            alert('Error running comparison');
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadPdf = async () => {
        if (!results) return;

        setGeneratingPdf(true);
        try {
            const res = await fetch('/api/reports/pdf', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    requirements: {
                        ...requirements,
                        preferredLocations: JSON.stringify(requirements.preferredLocations),
                        preferredTypes: JSON.stringify(requirements.preferredTypes)
                    },
                    results,
                    summary
                })
            });

            if (!res.ok) {
                const errorText = await res.text();
                throw new Error(errorText || 'Failed to generate PDF');
            }

            // Get filename from server header or generate one
            const contentDisposition = res.headers.get('Content-Disposition');
            let filename = 'comparison-report.pdf';
            if (contentDisposition) {
                const match = contentDisposition.match(/filename="?([^";\n]+)"?/);
                if (match && match[1]) {
                    filename = match[1];
                }
            } else {
                const customerName = requirements.customerName.replace(/[^a-zA-Z0-9]/g, '-').replace(/-+/g, '-');
                const timestamp = new Date().toISOString().split('T')[0];
                filename = `comparison-report-${customerName}-${timestamp}.pdf`;
            }

            // Use arrayBuffer for reliable binary handling
            const arrayBuffer = await res.arrayBuffer();
            const blob = new Blob([arrayBuffer], { type: 'application/pdf' });

            // Create object URL
            const url = URL.createObjectURL(blob);

            // Create hidden link and trigger download
            const link = document.createElement('a');
            link.style.display = 'none';
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();

            // Cleanup after delay
            setTimeout(() => {
                URL.revokeObjectURL(url);
                document.body.removeChild(link);
            }, 200);

        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Error generating PDF: ' + error.message);
        } finally {
            setGeneratingPdf(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-EG', {
            style: 'currency',
            currency: 'EGP',
            maximumFractionDigits: 0
        }).format(amount);
    };

    const getMatchClass = (percentage) => {
        if (percentage >= 90) return 'excellent';
        if (percentage >= 75) return 'good';
        if (percentage >= 60) return 'fair';
        return 'poor';
    };

    const getScoreBarClass = (value) => {
        if (value >= 0.9) return 'excellent';
        if (value >= 0.75) return 'good';
        if (value >= 0.6) return 'fair';
        return 'poor';
    };

    const infoBox = { background: 'var(--nawy-bg, #f8fafc)', borderRadius: 6, padding: '6px 10px', border: '1px solid var(--nawy-border, #e2e8f0)' };
    const infoLabel = { display: 'block', fontSize: '0.68rem', color: 'var(--nawy-text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 2 };
    const infoValue = { display: 'block', fontSize: '0.82rem', color: 'var(--nawy-text-primary)', fontWeight: 500 };

    const formatPricePerSqm = (result) => {
        const ppsqm = result.unit.pricePerSqm || (result.unit.price && result.unit.area ? result.unit.price / result.unit.area : null);
        if (!ppsqm) return null;
        return new Intl.NumberFormat('en-EG', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 }).format(ppsqm);
    };

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Property Comparison</h1>
                <p className="page-description">
                    Enter customer requirements to find matching properties and generate reports
                </p>
            </div>

            {/* Requirements Form */}
            <div className="card mb-lg">
                <div className="card-header">
                    <h3 className="card-title">📋 Customer Requirements</h3>
                </div>

                <div className="form-row-3">
                    <div className="form-group">
                        <label className="form-label">Customer Name *</label>
                        <input
                            type="text"
                            className="form-input"
                            value={requirements.customerName}
                            onChange={(e) => setRequirements({ ...requirements, customerName: e.target.value })}
                            placeholder="John Doe"
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Email</label>
                        <input
                            type="email"
                            className="form-input"
                            value={requirements.email}
                            onChange={(e) => setRequirements({ ...requirements, email: e.target.value })}
                            placeholder="john@example.com"
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Phone</label>
                        <input
                            type="tel"
                            className="form-input"
                            value={requirements.phone}
                            onChange={(e) => setRequirements({ ...requirements, phone: e.target.value })}
                            placeholder="+20 100 123 4567"
                        />
                    </div>
                </div>

                <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: 'var(--space-lg) 0' }} />

                <h4 style={{ marginBottom: 'var(--space-md)', color: 'var(--color-text-secondary)' }}>
                    🏠 Property Requirements
                </h4>

                <div className="form-row">
                    <div className="form-group">
                        <label className="form-label">Bedrooms (Min - Max)</label>
                        <div className="flex gap-sm">
                            <input
                                type="number"
                                className="form-input"
                                value={requirements.minBedrooms}
                                onChange={(e) => setRequirements({ ...requirements, minBedrooms: e.target.value })}
                                placeholder="Min"
                                min="0"
                            />
                            <input
                                type="number"
                                className="form-input"
                                value={requirements.maxBedrooms}
                                onChange={(e) => setRequirements({ ...requirements, maxBedrooms: e.target.value })}
                                placeholder="Max"
                                min="0"
                            />
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Bathrooms (Min - Max)</label>
                        <div className="flex gap-sm">
                            <input
                                type="number"
                                className="form-input"
                                value={requirements.minBathrooms}
                                onChange={(e) => setRequirements({ ...requirements, minBathrooms: e.target.value })}
                                placeholder="Min"
                                min="0"
                            />
                            <input
                                type="number"
                                className="form-input"
                                value={requirements.maxBathrooms}
                                onChange={(e) => setRequirements({ ...requirements, maxBathrooms: e.target.value })}
                                placeholder="Max"
                                min="0"
                            />
                        </div>
                    </div>
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label className="form-label">Area in sqm (Min - Max)</label>
                        <div className="flex gap-sm">
                            <input
                                type="number"
                                className="form-input"
                                value={requirements.minArea}
                                onChange={(e) => setRequirements({ ...requirements, minArea: e.target.value })}
                                placeholder="Min"
                                min="0"
                            />
                            <input
                                type="number"
                                className="form-input"
                                value={requirements.maxArea}
                                onChange={(e) => setRequirements({ ...requirements, maxArea: e.target.value })}
                                placeholder="Max"
                                min="0"
                            />
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Budget in EGP (Min - Max)</label>
                        <div className="flex gap-sm">
                            <input
                                type="number"
                                className="form-input"
                                value={requirements.minBudget}
                                onChange={(e) => setRequirements({ ...requirements, minBudget: e.target.value })}
                                placeholder="Min"
                                min="0"
                            />
                            <input
                                type="number"
                                className="form-input"
                                value={requirements.maxBudget}
                                onChange={(e) => setRequirements({ ...requirements, maxBudget: e.target.value })}
                                placeholder="Max"
                                min="0"
                            />
                        </div>
                    </div>
                </div>

                <div className="form-group">
                    <label className="form-label">Preferred Locations</label>
                    <div className="flex gap-sm" style={{ flexWrap: 'wrap' }}>
                        {locations.map((loc) => (
                            <button
                                key={loc}
                                type="button"
                                className={`btn btn-sm ${requirements.preferredLocations.includes(loc) ? 'btn-primary' : 'btn-secondary'}`}
                                onClick={() => handleLocationToggle(loc)}
                            >
                                {loc}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="form-group">
                    <label className="form-label">Preferred Property Types</label>
                    <div className="flex gap-sm" style={{ flexWrap: 'wrap' }}>
                        {unitTypes.map((type) => (
                            <button
                                key={type}
                                type="button"
                                className={`btn btn-sm ${requirements.preferredTypes.includes(type) ? 'btn-primary' : 'btn-secondary'}`}
                                onClick={() => handleTypeToggle(type)}
                            >
                                {type.charAt(0).toUpperCase() + type.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label className="form-label">Preferred Finishing</label>
                        <select
                            className="form-select"
                            value={requirements.finishingType}
                            onChange={(e) => setRequirements({ ...requirements, finishingType: e.target.value })}
                        >
                            <option value="">Any</option>
                            <option value="core_shell">Core & Shell</option>
                            <option value="semi_finished">Semi-Finished</option>
                            <option value="fully_finished">Fully Finished</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Additional Notes</label>
                        <input
                            type="text"
                            className="form-input"
                            value={requirements.notes}
                            onChange={(e) => setRequirements({ ...requirements, notes: e.target.value })}
                            placeholder="Any special requirements..."
                        />
                    </div>
                </div>

                <div className="flex justify-between items-center mt-lg">
                    <button
                        className="btn btn-primary btn-lg"
                        onClick={handleCompare}
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <div className="spinner" style={{ width: 20, height: 20 }}></div>
                                Searching...
                            </>
                        ) : (
                            <>🔍 Find Matching Properties</>
                        )}
                    </button>

                    {results && results.length > 0 && (
                        <button
                            className="btn btn-accent btn-lg"
                            onClick={handleDownloadPdf}
                            disabled={generatingPdf}
                        >
                            {generatingPdf ? (
                                <>
                                    <div className="spinner" style={{ width: 20, height: 20 }}></div>
                                    Generating...
                                </>
                            ) : (
                                <>📄 Download PDF Report</>
                            )}
                        </button>
                    )}
                </div>
            </div>

            {/* Results Summary */}
            {summary && (
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-icon primary">🏠</div>
                        <div className="stat-content">
                            <div className="stat-value">{summary.totalMatches}</div>
                            <div className="stat-label">Total Matches</div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon accent">⭐</div>
                        <div className="stat-content">
                            <div className="stat-value">{summary.excellentMatches}</div>
                            <div className="stat-label">Excellent Matches (90%+)</div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon warning">👍</div>
                        <div className="stat-content">
                            <div className="stat-value">{summary.goodMatches}</div>
                            <div className="stat-label">Good Matches (75%+)</div>
                        </div>
                    </div>
                    {summary.priceRange && (
                        <div className="stat-card">
                            <div className="stat-icon danger">💰</div>
                            <div className="stat-content">
                                <div className="stat-value" style={{ fontSize: '1rem' }}>
                                    {formatCurrency(summary.priceRange.min)} - {formatCurrency(summary.priceRange.max)}
                                </div>
                                <div className="stat-label">Price Range</div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Results List */}
            {results && results.length > 0 && (
                <div className="comparison-results">
                    <h2 style={{ marginBottom: 'var(--space-lg)', color: 'var(--nawy-text-primary)' }}>
                        Matching Properties ({results.length})
                    </h2>

                    {results.map((result, index) => {
                        const matchClass = getMatchClass(result.matchPercentage);
                        const isTop = index === 0;
                        const ppsqm = formatPricePerSqm(result);

                        return (
                            <div key={result.unit.id} className={`result-card ${matchClass}`}>
                                {/* Rank */}
                                <div className={`result-card-rank${isTop ? ' top' : ''}`}>
                                    {isTop ? 'TOP' : `#${index + 1}`}
                                </div>

                                {/* Match Score */}
                                <div className="result-card-score">
                                    <div className={`match-score ${matchClass}`}>
                                        {result.matchPercentage}%
                                    </div>
                                    <div className="text-muted" style={{ fontSize: '0.7rem', marginTop: '4px', textAlign: 'center' }}>
                                        {result.recommendation.text}
                                    </div>
                                </div>

                                {/* Main content */}
                                <div className="result-card-content">
                                    {/* Header */}
                                    <div className="result-card-header">
                                        <div>
                                            {isTop && <span className="top-pick-badge">Top Pick</span>}
                                            <h3 className="result-card-title">
                                                {result.unit.compound?.name}
                                                <span style={{ fontWeight: 400, fontSize: '0.9rem', marginLeft: 8, color: 'var(--nawy-text-secondary)' }}>
                                                    — {result.unit.type.charAt(0).toUpperCase() + result.unit.type.slice(1)}
                                                </span>
                                            </h3>
                                            <div className="result-card-subtitle">
                                                {result.unit.compound?.location} &nbsp;|&nbsp; {result.unit.compound?.developer?.name}
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                            <div className="price-main">
                                                {formatCurrency(result.unit.price)}
                                            </div>
                                            {ppsqm && (
                                                <div style={{ fontSize: '0.75rem', color: 'var(--nawy-text-secondary)' }}>
                                                    {ppsqm}/sqm
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Spec boxes */}
                                    <div className="spec-boxes">
                                        <div className="spec-box">
                                            <span className="spec-box-label">Beds</span>
                                            <span className="spec-box-value">{result.unit.bedrooms}</span>
                                        </div>
                                        <div className="spec-box">
                                            <span className="spec-box-label">Baths</span>
                                            <span className="spec-box-value">{result.unit.bathrooms}</span>
                                        </div>
                                        <div className="spec-box">
                                            <span className="spec-box-label">Area</span>
                                            <span className="spec-box-value">{result.unit.area} sqm</span>
                                        </div>
                                        {result.unit.floor && (
                                            <div className="spec-box">
                                                <span className="spec-box-label">Floor</span>
                                                <span className="spec-box-value">{result.unit.floor}</span>
                                            </div>
                                        )}
                                        {result.unit.view && (
                                            <div className="spec-box">
                                                <span className="spec-box-label">View</span>
                                                <span className="spec-box-value" style={{ fontSize: '0.8rem' }}>
                                                    {result.unit.view.charAt(0).toUpperCase() + result.unit.view.slice(1)}
                                                </span>
                                            </div>
                                        )}
                                        <div className="spec-box">
                                            <span className="spec-box-label">Finishing</span>
                                            <span className="spec-box-value" style={{ fontSize: '0.75rem' }}>
                                                {result.unit.finishingType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                            </span>
                                        </div>
                                        {result.unit.appreciationRate != null && (
                                            <div className="spec-box">
                                                <span className="spec-box-label">Appreciation</span>
                                                <span className="spec-box-value" style={{ color: '#10b981' }}>{result.unit.appreciationRate}%</span>
                                            </div>
                                        )}
                                        {result.unit.rentYield != null && (
                                            <div className="spec-box">
                                                <span className="spec-box-label">Rent Yield</span>
                                                <span className="spec-box-value" style={{ color: '#3b82f6' }}>{result.unit.rentYield}%</span>
                                            </div>
                                        )}
                                        {result.unit.valueForMoney != null && (
                                            <div className="spec-box">
                                                <span className="spec-box-label">Value/Money</span>
                                                <span className="spec-box-value">{result.unit.valueForMoney}/10</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Extended Info Grid */}
                                    {(result.unit.resaleMarket || result.unit.priceIncreaseRate != null || result.unit.rateViaMarket != null ||
                                      result.unit.locationUnit || result.unit.footprint || result.unit.constructionUpdate ||
                                      result.unit.finishingSpecs || result.unit.paymentPlan ||
                                      result.unit.compound?.community || result.unit.compound?.masterPlan ||
                                      result.unit.compound?.developer?.description) && (
                                        <div style={{ marginTop: 'var(--space-md)', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 'var(--space-sm)' }}>
                                            {result.unit.resaleMarket && (
                                                <div style={infoBox}>
                                                    <span style={infoLabel}>🏷️ Resale Market</span>
                                                    <span style={infoValue}>{result.unit.resaleMarket}</span>
                                                </div>
                                            )}
                                            {result.unit.priceIncreaseRate != null && (
                                                <div style={infoBox}>
                                                    <span style={infoLabel}>📈 Price Increase</span>
                                                    <span style={infoValue}>{result.unit.priceIncreaseRate}% / yr</span>
                                                </div>
                                            )}
                                            {result.unit.rateViaMarket != null && (
                                                <div style={infoBox}>
                                                    <span style={infoLabel}>📊 Market Rate</span>
                                                    <span style={infoValue}>{new Intl.NumberFormat('en-EG', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 }).format(result.unit.rateViaMarket)} /sqm</span>
                                                </div>
                                            )}
                                            {result.unit.locationUnit && (
                                                <div style={infoBox}>
                                                    <span style={infoLabel}>📍 Location Unit</span>
                                                    <span style={infoValue}>{result.unit.locationUnit}</span>
                                                </div>
                                            )}
                                            {result.unit.footprint && (
                                                <div style={infoBox}>
                                                    <span style={infoLabel}>🔲 Foot Print</span>
                                                    <span style={infoValue}>{result.unit.footprint}</span>
                                                </div>
                                            )}
                                            {result.unit.constructionUpdate && (
                                                <div style={infoBox}>
                                                    <span style={infoLabel}>🏗️ Construction</span>
                                                    <span style={infoValue}>{result.unit.constructionUpdate}</span>
                                                </div>
                                            )}
                                            {result.unit.finishingSpecs && (
                                                <div style={infoBox}>
                                                    <span style={infoLabel}>✨ Finishing Specs</span>
                                                    <span style={infoValue}>{result.unit.finishingSpecs}</span>
                                                </div>
                                            )}
                                            {result.unit.paymentPlan && (
                                                <div style={infoBox}>
                                                    <span style={infoLabel}>💳 Payment Plan</span>
                                                    <span style={infoValue}>{result.unit.paymentPlan}</span>
                                                </div>
                                            )}
                                            {result.unit.compound?.community && (
                                                <div style={infoBox}>
                                                    <span style={infoLabel}>🏘️ Community</span>
                                                    <span style={infoValue}>{result.unit.compound.community}</span>
                                                </div>
                                            )}
                                            {result.unit.compound?.masterPlan && (
                                                <div style={infoBox}>
                                                    <span style={infoLabel}>🗺️ Master Plan</span>
                                                    <span style={infoValue}>{result.unit.compound.masterPlan}</span>
                                                </div>
                                            )}
                                            {result.unit.compound?.developer?.description && (
                                                <div style={{ ...infoBox, gridColumn: '1 / -1' }}>
                                                    <span style={infoLabel}>🏢 Developer History</span>
                                                    <span style={infoValue}>{result.unit.compound.developer.description}</span>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Floor Plan Image */}
                                    {result.unit.floorPlanImage && (
                                        <div style={{ marginTop: 'var(--space-md)', paddingTop: 'var(--space-md)', borderTop: '1px solid var(--nawy-border)' }}>
                                            <div style={{ fontSize: '0.72rem', color: 'var(--nawy-text-secondary)', marginBottom: 'var(--space-sm)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                🗺️ Unit 2D Floor Plan
                                            </div>
                                            <img
                                                src={result.unit.floorPlanImage}
                                                alt="Floor Plan"
                                                style={{ maxWidth: '100%', maxHeight: 300, objectFit: 'contain', borderRadius: 8, border: '1px solid var(--nawy-border)', cursor: 'pointer' }}
                                                onClick={() => window.open(result.unit.floorPlanImage, '_blank')}
                                            />
                                        </div>
                                    )}

                                    {/* Highlights & Concerns */}
                                    {(result.highlights?.highlights?.length > 0 || result.highlights?.concerns?.length > 0) && (
                                        <div className="result-card-highlights">
                                            {result.highlights?.highlights?.map((h, i) => (
                                                <div key={i} className="highlight positive">
                                                    ✓ {h}
                                                </div>
                                            ))}
                                            {result.highlights?.concerns?.map((c, i) => (
                                                <div key={i} className="highlight negative">
                                                    ! {c}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Score breakdown bars */}
                                    <div style={{ marginTop: 'var(--space-md)', paddingTop: 'var(--space-md)', borderTop: '1px solid var(--nawy-border)' }}>
                                        <div style={{ fontSize: '0.72rem', color: 'var(--nawy-text-secondary)', marginBottom: 'var(--space-sm)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                            Score Breakdown
                                        </div>
                                        <div className="score-bars">
                                            {Object.entries(result.scores).map(([key, value]) => {
                                                const cls = getScoreBarClass(value);
                                                return (
                                                    <div key={key} className="score-bar-item">
                                                        <span className="score-bar-label">{key}</span>
                                                        <div className="score-bar-track">
                                                            <div
                                                                className={`score-bar-fill ${cls}`}
                                                                style={{ width: `${Math.round(value * 100)}%` }}
                                                            />
                                                        </div>
                                                        <span className="score-bar-pct">{Math.round(value * 100)}%</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {results && results.length === 0 && (
                <div className="empty-state">
                    <div className="empty-state-icon">😔</div>
                    <div className="empty-state-text">No matching properties found</div>
                    <p className="text-muted">Try adjusting your requirements</p>
                </div>
            )}
        </div>
    );
}
