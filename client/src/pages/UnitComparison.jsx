import { useState, useEffect } from 'react';

const MAX_SELECT = 4;

const formatCurrency = (v) =>
    v != null ? new Intl.NumberFormat('en-EG', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 }).format(v) : '—';

const typeLabel = {
    studio: '🏨 Studio', apartment: '🏠 Apartment', duplex: '🏡 Duplex',
    penthouse: '🌆 Penthouse', townhouse: '🏘️ Townhouse', villa: '🏰 Villa'
};

const finishingLabel = {
    core_shell: 'Core & Shell', semi_finished: 'Semi-Finished', fully_finished: 'Fully Finished'
};

const viewLabel = {
    garden: 'Garden', pool: 'Pool', lake: 'Lake', sea: 'Sea',
    golf: 'Golf Course', city: 'City', street: 'Street', park: 'Park'
};

/** Return indices of the best (max) and worst (min) non-null values */
function getBestWorst(values, higherIsBetter = true) {
    const nums = values.map((v) => (v != null && v !== '' ? Number(v) : null));
    const valid = nums.filter((v) => v !== null);
    if (valid.length < 2) return { best: null, worst: null };
    const maxVal = Math.max(...valid);
    const minVal = Math.min(...valid);
    return {
        best: higherIsBetter ? maxVal : minVal,
        worst: higherIsBetter ? minVal : maxVal,
    };
}

function CellStyle(value, best, worst) {
    if (value == null || value === '') return {};
    const n = Number(value);
    if (n === best) return { color: '#10b981', fontWeight: 700 };
    if (n === worst) return { color: '#ef4444' };
    return {};
}

/** A single row in the comparison table */
function CompareRow({ label, values, higherIsBetter, format }) {
    const { best, worst } = getBestWorst(values, higherIsBetter);
    return (
        <tr>
            <td className="compare-row-label">{label}</td>
            {values.map((v, i) => (
                <td key={i} className="compare-cell" style={v != null && v !== '' ? CellStyle(v, best, worst) : { color: 'var(--color-text-muted)' }}>
                    {v != null && v !== '' ? (format ? format(v) : v) : '—'}
                </td>
            ))}
        </tr>
    );
}

/** A text-only row (no highlighting) */
function CompareRowText({ label, values, format }) {
    return (
        <tr>
            <td className="compare-row-label">{label}</td>
            {values.map((v, i) => (
                <td key={i} className="compare-cell" style={!v ? { color: 'var(--color-text-muted)' } : {}}>
                    {v ? (format ? format(v) : v) : '—'}
                </td>
            ))}
        </tr>
    );
}

/** Small metric box inside ROI card */
function RoiMetric({ label, value, accent }) {
    return (
        <div style={{ background: 'var(--color-bg-tertiary)', borderRadius: 6, padding: '6px 8px' }}>
            <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 2 }}>{label}</div>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: accent ? '#10b981' : 'var(--color-text-primary)' }}>{value}</div>
        </div>
    );
}

/** Projection column inside ROI card */
function RoiProjection({ horizon, projValue, totalReturn, roi, price }) {
    return (
        <div style={{ background: 'rgba(59,130,246,0.07)', borderRadius: 6, padding: '6px 8px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.65rem', color: 'var(--color-primary)', fontWeight: 700, marginBottom: 4 }}>{horizon}</div>
            {projValue != null && (
                <div style={{ fontSize: '0.72rem', color: 'var(--color-text-primary)', fontWeight: 600 }}>
                    {new Intl.NumberFormat('en-EG', { notation: 'compact', currency: 'EGP', style: 'currency', maximumFractionDigits: 1 }).format(projValue)}
                </div>
            )}
            {totalReturn != null && (
                <div style={{ fontSize: '0.68rem', color: '#10b981', marginTop: 2 }}>
                    +{new Intl.NumberFormat('en-EG', { notation: 'compact', currency: 'EGP', style: 'currency', maximumFractionDigits: 1 }).format(totalReturn)}
                </div>
            )}
            {roi != null && (
                <div style={{ fontSize: '0.68rem', color: '#f59e0b', fontWeight: 700, marginTop: 2 }}>{roi.toFixed(0)}% ROI</div>
            )}
        </div>
    );
}

/**
 * ROI Calculator
 * Inputs: price, rentYield (%/yr), appreciationRate (%/yr)
 * Returns all derived investment metrics.
 */
function calcROI(u) {
    const price = u.price;
    const ry = u.rentYield;         // annual rental yield %
    const ar = u.appreciationRate;  // annual capital appreciation %

    if (!price) return null;

    const annualRent     = ry != null ? price * ry / 100 : null;
    const annualCapGain  = ar != null ? price * ar / 100 : null;
    const combinedROI    = ry != null && ar != null ? ry + ar
                         : ry != null ? ry
                         : ar != null ? ar
                         : null;
    const totalAnnualReturn = annualRent != null && annualCapGain != null
                            ? annualRent + annualCapGain
                            : annualRent ?? annualCapGain ?? null;

    // Compound appreciation projections
    const val1yr = ar != null ? price * Math.pow(1 + ar / 100, 1) : null;
    const val3yr = ar != null ? price * Math.pow(1 + ar / 100, 3) : null;
    const val5yr = ar != null ? price * Math.pow(1 + ar / 100, 5) : null;

    // Cumulative rental income (simple, not compounded)
    const rent3yr = annualRent != null ? annualRent * 3 : null;
    const rent5yr = annualRent != null ? annualRent * 5 : null;

    // Total return = capital gain + cumulative rent
    const total3yr = val3yr != null && rent3yr != null ? (val3yr - price) + rent3yr
                   : val3yr != null ? val3yr - price
                   : rent3yr ?? null;
    const total5yr = val5yr != null && rent5yr != null ? (val5yr - price) + rent5yr
                   : val5yr != null ? val5yr - price
                   : rent5yr ?? null;

    const roi3yr = total3yr != null ? (total3yr / price) * 100 : null;
    const roi5yr = total5yr != null ? (total5yr / price) * 100 : null;

    return { annualRent, annualCapGain, combinedROI, totalAnnualReturn, val1yr, val3yr, val5yr, rent3yr, rent5yr, total3yr, total5yr, roi3yr, roi5yr };
}

/** Section header row spanning all columns */
function SectionRow({ label, colSpan }) {
    return (
        <tr>
            <td
                colSpan={colSpan + 1}
                style={{
                    background: 'rgba(59,130,246,0.08)',
                    color: 'var(--color-primary)',
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    padding: '8px 16px',
                    borderTop: '2px solid var(--color-primary)',
                }}
            >
                {label}
            </td>
        </tr>
    );
}

const PREF_CRITERIA = [
    { key: 'price',           label: 'Price',            higherIsBetter: false },
    { key: 'area',            label: 'Area (sqm)',        higherIsBetter: true  },
    { key: 'bedrooms',        label: 'Bedrooms',          higherIsBetter: true  },
    { key: 'bathrooms',       label: 'Bathrooms',         higherIsBetter: true  },
    { key: 'rentYield',       label: 'Rent Yield',        higherIsBetter: true  },
    { key: 'appreciationRate',label: 'Appreciation Rate', higherIsBetter: true  },
    { key: 'valueForMoney',   label: 'Value for Money',   higherIsBetter: true  },
];

const DEFAULT_PREFS = Object.fromEntries(PREF_CRITERIA.map((c) => [c.key, 5]));

function computeScores(units, prefs) {
    return units.map((u) => {
        let total = 0;
        let maxPossible = 0;
        PREF_CRITERIA.forEach(({ key, higherIsBetter }) => {
            const weight = prefs[key] ?? 5;
            if (weight === 0) return;
            const vals = units.map((x) => x[key]).filter((v) => v != null);
            if (vals.length < 2) return;
            const min = Math.min(...vals);
            const max = Math.max(...vals);
            if (max === min) return; // all same — skip
            const v = u[key];
            if (v == null) return;
            const norm = (v - min) / (max - min); // 0..1
            const score = higherIsBetter ? norm : 1 - norm;
            total += score * weight;
            maxPossible += weight;
        });
        return { unit: u, score: maxPossible > 0 ? (total / maxPossible) * 100 : 0 };
    });
}

export default function UnitComparison() {
    const [units, setUnits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState([]); // array of unit objects
    const [search, setSearch] = useState('');
    const [filterType, setFilterType] = useState('');
    const [filterCompound, setFilterCompound] = useState('');
    const [prefs, setPrefs] = useState(DEFAULT_PREFS);

    useEffect(() => {
        fetch('/api/units')
            .then((r) => r.json())
            .then((data) => setUnits(data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const compounds = [...new Map(units.map((u) => [u.compoundId, u.compound?.name])).entries()]
        .map(([id, name]) => ({ id, name }));

    const filtered = units.filter((u) => {
        const q = search.toLowerCase();
        const matchSearch =
            !q ||
            u.compound?.name?.toLowerCase().includes(q) ||
            u.compound?.developer?.name?.toLowerCase().includes(q) ||
            u.compound?.location?.toLowerCase().includes(q) ||
            u.type?.toLowerCase().includes(q);
        const matchType = !filterType || u.type === filterType;
        const matchCompound = !filterCompound || u.compoundId === parseInt(filterCompound);
        return matchSearch && matchType && matchCompound;
    });

    const isSelected = (u) => selected.some((s) => s.id === u.id);

    const toggleSelect = (u) => {
        if (isSelected(u)) {
            setSelected((prev) => prev.filter((s) => s.id !== u.id));
        } else {
            if (selected.length >= MAX_SELECT) {
                alert(`You can compare up to ${MAX_SELECT} units at a time.`);
                return;
            }
            setSelected((prev) => [...prev, u]);
        }
    };

    const removeSelected = (id) => setSelected((prev) => prev.filter((s) => s.id !== id));

    const [pdfLoading, setPdfLoading] = useState(false);

    const downloadPDF = async () => {
        if (selected.length < 2) return;
        setPdfLoading(true);
        try {
            const res = await fetch('/api/reports/unit-pdf', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ unitIds: selected.map((u) => u.id) }),
            });
            if (!res.ok) throw new Error('PDF generation failed');
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `unit-comparison-${new Date().toISOString().split('T')[0]}.pdf`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            alert('Failed to generate PDF: ' + err.message);
        } finally {
            setPdfLoading(false);
        }
    };

    const get = (u, key) => u[key];

    if (loading) {
        return (
            <div className="loading">
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div>
            {/* Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">Unit Comparison</h1>
                    <p className="page-description">
                        Select up to {MAX_SELECT} units to compare side-by-side
                    </p>
                </div>
                {selected.length > 0 && (
                    <div style={{ display: 'flex', gap: 8 }}>
                        {selected.length >= 2 && (
                            <button
                                className="btn btn-primary btn-sm"
                                onClick={downloadPDF}
                                disabled={pdfLoading}
                            >
                                {pdfLoading ? 'Generating…' : '⬇ Download PDF'}
                            </button>
                        )}
                        <button className="btn btn-secondary btn-sm" onClick={() => setSelected([])}>
                            Clear Selection
                        </button>
                    </div>
                )}
            </div>

            {/* Selected chips */}
            {selected.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 'var(--space-lg)' }}>
                    {selected.map((u) => (
                        <div
                            key={u.id}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                background: 'rgba(59,130,246,0.15)',
                                border: '1px solid var(--color-primary)',
                                borderRadius: 20,
                                padding: '4px 12px',
                                fontSize: '0.82rem',
                                color: 'var(--color-primary)',
                            }}
                        >
                            <span>{u.compound?.name} — {typeLabel[u.type] || u.type}</span>
                            <button
                                onClick={() => removeSelected(u.id)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary)', fontSize: '1rem', lineHeight: 1, padding: 0 }}
                            >
                                ×
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* ---- ROI SUMMARY CARDS ---- */}
            {selected.length >= 2 && selected.some(u => u.rentYield != null || u.appreciationRate != null) && (
                <div className="card mb-lg">
                    <div className="card-header">
                        <h3 className="card-title">📈 ROI Analysis</h3>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                            Based on appreciation rate &amp; rental yield
                        </span>
                    </div>
                    <div style={{ padding: 'var(--space-md)', display: 'grid', gridTemplateColumns: `repeat(${selected.length}, 1fr)`, gap: 'var(--space-md)' }}>
                        {selected.map((u) => {
                            const roi = calcROI(u);
                            return (
                                <div key={u.id} style={{ background: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-md)', border: '1px solid var(--color-border)' }}>
                                    <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: 'var(--space-sm)', color: 'var(--color-text-primary)' }}>
                                        {u.compound?.name}
                                        <span style={{ fontWeight: 400, color: 'var(--color-text-muted)', fontSize: '0.75rem', marginLeft: 6 }}>{typeLabel[u.type] || u.type}</span>
                                    </div>

                                    {roi ? (
                                        <>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 'var(--space-sm)' }}>
                                                <RoiMetric label="Combined ROI/yr" value={roi.combinedROI != null ? `${roi.combinedROI.toFixed(1)}%` : '—'} accent />
                                                <RoiMetric label="Annual Return" value={roi.totalAnnualReturn != null ? formatCurrency(roi.totalAnnualReturn) : '—'} />
                                                <RoiMetric label="Annual Rental" value={roi.annualRent != null ? formatCurrency(roi.annualRent) : '—'} />
                                                <RoiMetric label="Annual Cap. Gain" value={roi.annualCapGain != null ? formatCurrency(roi.annualCapGain) : '—'} />
                                            </div>

                                            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-sm)', marginTop: 'var(--space-sm)' }}>
                                                <div style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Projections</div>
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4 }}>
                                                    <RoiProjection horizon="1 yr" projValue={roi.val1yr} totalReturn={roi.val1yr != null ? roi.val1yr - u.price : null} roi={null} price={u.price} />
                                                    <RoiProjection horizon="3 yr" projValue={roi.val3yr} totalReturn={roi.total3yr} roi={roi.roi3yr} price={u.price} />
                                                    <RoiProjection horizon="5 yr" projValue={roi.val5yr} totalReturn={roi.total5yr} roi={roi.roi5yr} price={u.price} />
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>No investment data available.</p>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ---- PREFERENCES & RECOMMENDATION ---- */}
            {selected.length >= 2 && (() => {
                const scores = computeScores(selected, prefs);
                const sorted = [...scores].sort((a, b) => b.score - a.score);
                const winner = sorted[0];
                const allZero = PREF_CRITERIA.every((c) => (prefs[c.key] ?? 5) === 0);
                return (
                    <div className="card mb-lg">
                        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                            <h3 className="card-title">🎯 Preferences &amp; Recommendation</h3>
                            <button
                                className="btn btn-secondary btn-sm"
                                onClick={() => setPrefs(DEFAULT_PREFS)}
                                style={{ fontSize: '0.72rem' }}
                            >
                                Reset
                            </button>
                        </div>
                        <div style={{ padding: 'var(--space-md)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-lg)' }}>
                            {/* Sliders */}
                            <div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: 'var(--space-sm)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Set your priorities (0 = not important, 10 = critical)
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                    {PREF_CRITERIA.map(({ key, label, higherIsBetter }) => (
                                        <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <div style={{ width: 140, fontSize: '0.8rem', color: 'var(--color-text-secondary)', flexShrink: 0 }}>
                                                {label}
                                                <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', marginLeft: 4 }}>
                                                    ({higherIsBetter ? '↑ higher' : '↓ lower'})
                                                </span>
                                            </div>
                                            <input
                                                type="range"
                                                min="0"
                                                max="10"
                                                step="1"
                                                value={prefs[key] ?? 5}
                                                onChange={(e) => setPrefs((p) => ({ ...p, [key]: Number(e.target.value) }))}
                                                style={{ flex: 1, accentColor: 'var(--color-primary)', cursor: 'pointer' }}
                                            />
                                            <span style={{ width: 22, textAlign: 'right', fontSize: '0.82rem', fontWeight: 700, color: prefs[key] === 0 ? 'var(--color-text-muted)' : 'var(--color-primary)' }}>
                                                {prefs[key] ?? 5}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Recommendation result */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                                {allZero ? (
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                                        Set at least one preference weight above 0.
                                    </div>
                                ) : (
                                    <>
                                        {/* Winner banner */}
                                        <div style={{
                                            background: 'linear-gradient(135deg, rgba(16,185,129,0.12), rgba(59,130,246,0.08))',
                                            border: '1px solid #10b981',
                                            borderRadius: 'var(--radius-lg)',
                                            padding: 'var(--space-md)',
                                        }}>
                                            <div style={{ fontSize: '0.68rem', color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4, fontWeight: 700 }}>
                                                ✅ Recommended
                                            </div>
                                            <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--color-text-primary)' }}>
                                                {winner.unit.compound?.name}
                                            </div>
                                            <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', marginTop: 2 }}>
                                                {typeLabel[winner.unit.type] || winner.unit.type} · {winner.unit.compound?.developer?.name}
                                            </div>
                                            <div style={{ marginTop: 8, display: 'flex', gap: 12, fontSize: '0.78rem' }}>
                                                <span style={{ color: '#10b981', fontWeight: 700 }}>Score: {winner.score.toFixed(0)}%</span>
                                                <span style={{ color: 'var(--color-text-muted)' }}>{formatCurrency(winner.unit.price)}</span>
                                                {winner.unit.area && <span style={{ color: 'var(--color-text-muted)' }}>{winner.unit.area} sqm</span>}
                                            </div>
                                        </div>

                                        {/* All scores ranked */}
                                        <div>
                                            <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>All units ranked</div>
                                            {sorted.map(({ unit: u, score }, rank) => (
                                                <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                                                    <span style={{ width: 18, fontSize: '0.72rem', color: rank === 0 ? '#f59e0b' : 'var(--color-text-muted)', fontWeight: 700, textAlign: 'center' }}>
                                                        {rank === 0 ? '🥇' : rank === 1 ? '🥈' : rank === 2 ? '🥉' : `#${rank + 1}`}
                                                    </span>
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ fontSize: '0.78rem', color: 'var(--color-text-primary)', fontWeight: rank === 0 ? 700 : 400 }}>
                                                            {u.compound?.name}
                                                        </div>
                                                        <div style={{ height: 4, borderRadius: 2, background: 'var(--color-bg-tertiary)', marginTop: 3, overflow: 'hidden' }}>
                                                            <div style={{ height: '100%', width: `${score}%`, background: rank === 0 ? '#10b981' : rank === 1 ? '#3b82f6' : '#64748b', borderRadius: 2, transition: 'width 0.3s ease' }} />
                                                        </div>
                                                    </div>
                                                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: rank === 0 ? '#10b981' : 'var(--color-text-secondary)', width: 36, textAlign: 'right' }}>
                                                        {score.toFixed(0)}%
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })()}

            {/* ---- COMPARISON TABLE ---- */}
            {selected.length >= 2 && (
                <div className="card mb-lg" style={{ overflowX: 'auto' }}>
                    <div className="card-header">
                        <h3 className="card-title">Side-by-Side Comparison</h3>
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
                        <thead>
                            <tr>
                                <th className="compare-th-label"></th>
                                {selected.map((u, i) => (
                                    <th key={u.id} className="compare-th-unit">
                                        <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                                            {i === 0 && <span style={{ color: '#f59e0b', fontSize: '0.65rem', display: 'block', marginBottom: 2 }}>★ BASE</span>}
                                            {u.compound?.name}
                                        </div>
                                        <div style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)', marginTop: 2 }}>
                                            {typeLabel[u.type] || u.type}
                                        </div>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: 2 }}>
                                            {u.compound?.developer?.name}
                                        </div>
                                        <button
                                            onClick={() => removeSelected(u.id)}
                                            style={{ marginTop: 6, background: 'none', border: '1px solid var(--color-border)', borderRadius: 4, cursor: 'pointer', color: 'var(--color-text-muted)', fontSize: '0.7rem', padding: '2px 6px' }}
                                        >
                                            Remove
                                        </button>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            <SectionRow label="Basic Details" colSpan={selected.length} />
                            <CompareRowText label="Compound" values={selected.map(u => u.compound?.name)} />
                            <CompareRowText label="Developer" values={selected.map(u => u.compound?.developer?.name)} />
                            <CompareRowText label="Location" values={selected.map(u => u.compound?.location)} />
                            <CompareRowText label="Type" values={selected.map(u => typeLabel[u.type] || u.type)} />
                            <CompareRowText label="Finishing" values={selected.map(u => finishingLabel[u.finishingType] || u.finishingType)} />
                            <CompareRow label="Bedrooms" values={selected.map(u => u.bedrooms)} higherIsBetter={true} />
                            <CompareRow label="Bathrooms" values={selected.map(u => u.bathrooms)} higherIsBetter={true} />
                            <CompareRow label="Area (sqm)" values={selected.map(u => u.area)} higherIsBetter={true} format={v => `${v} sqm`} />
                            <CompareRowText label="Floor" values={selected.map(u => u.floor != null ? `Floor ${u.floor}` : null)} />
                            <CompareRowText label="View" values={selected.map(u => u.view ? (viewLabel[u.view] || u.view) : null)} />
                            <CompareRowText label="Location Unit" values={selected.map(u => u.locationUnit)} />
                            <CompareRowText label="Footprint" values={selected.map(u => u.footprint)} />
                            <CompareRowText label="Finishing Specs" values={selected.map(u => u.finishingSpecs)} />

                            <SectionRow label="Pricing" colSpan={selected.length} />
                            <CompareRow
                                label="Price (EGP)"
                                values={selected.map(u => u.price)}
                                higherIsBetter={false}
                                format={formatCurrency}
                            />
                            <CompareRow
                                label="Price / sqm"
                                values={selected.map(u => u.pricePerSqm || (u.price && u.area ? u.price / u.area : null))}
                                higherIsBetter={false}
                                format={v => `${new Intl.NumberFormat('en-EG', { maximumFractionDigits: 0 }).format(v)} EGP/sqm`}
                            />
                            <CompareRowText label="Payment Plan" values={selected.map(u => u.paymentPlan)} />

                            <SectionRow label="Market & Investment" colSpan={selected.length} />
                            <CompareRow label="Appreciation (%/yr)" values={selected.map(u => u.appreciationRate)} higherIsBetter={true} format={v => `${v}%`} />
                            <CompareRow label="Rent Yield (%/yr)" values={selected.map(u => u.rentYield)} higherIsBetter={true} format={v => `${v}%`} />
                            <CompareRow label="Price Increase (%/yr)" values={selected.map(u => u.priceIncreaseRate)} higherIsBetter={true} format={v => `${v}%`} />
                            <CompareRow label="Rate via Market (EGP/sqm)" values={selected.map(u => u.rateViaMarket)} higherIsBetter={false} format={formatCurrency} />
                            <CompareRow label="Value for Money (1-10)" values={selected.map(u => u.valueForMoney)} higherIsBetter={true} format={v => `${v}/10`} />
                            <CompareRowText label="Resale Market" values={selected.map(u => u.resaleMarket)} />

                            <SectionRow label="ROI Analysis" colSpan={selected.length} />
                            <CompareRow
                                label="Combined ROI (%/yr)"
                                values={selected.map(u => calcROI(u)?.combinedROI ?? null)}
                                higherIsBetter={true}
                                format={v => `${Number(v).toFixed(1)}%`}
                            />
                            <CompareRow
                                label="Annual Rental Income"
                                values={selected.map(u => calcROI(u)?.annualRent ?? null)}
                                higherIsBetter={true}
                                format={formatCurrency}
                            />
                            <CompareRow
                                label="Annual Capital Gain"
                                values={selected.map(u => calcROI(u)?.annualCapGain ?? null)}
                                higherIsBetter={true}
                                format={formatCurrency}
                            />
                            <CompareRow
                                label="Total Annual Return"
                                values={selected.map(u => calcROI(u)?.totalAnnualReturn ?? null)}
                                higherIsBetter={true}
                                format={formatCurrency}
                            />
                            <CompareRow
                                label="3-yr Projected Value"
                                values={selected.map(u => calcROI(u)?.val3yr ?? null)}
                                higherIsBetter={true}
                                format={formatCurrency}
                            />
                            <CompareRow
                                label="3-yr Total Return"
                                values={selected.map(u => calcROI(u)?.total3yr ?? null)}
                                higherIsBetter={true}
                                format={formatCurrency}
                            />
                            <CompareRow
                                label="3-yr ROI %"
                                values={selected.map(u => calcROI(u)?.roi3yr ?? null)}
                                higherIsBetter={true}
                                format={v => `${Number(v).toFixed(1)}%`}
                            />
                            <CompareRow
                                label="5-yr Projected Value"
                                values={selected.map(u => calcROI(u)?.val5yr ?? null)}
                                higherIsBetter={true}
                                format={formatCurrency}
                            />
                            <CompareRow
                                label="5-yr Cumulative Rent"
                                values={selected.map(u => calcROI(u)?.rent5yr ?? null)}
                                higherIsBetter={true}
                                format={formatCurrency}
                            />
                            <CompareRow
                                label="5-yr Total Return"
                                values={selected.map(u => calcROI(u)?.total5yr ?? null)}
                                higherIsBetter={true}
                                format={formatCurrency}
                            />
                            <CompareRow
                                label="5-yr ROI %"
                                values={selected.map(u => calcROI(u)?.roi5yr ?? null)}
                                higherIsBetter={true}
                                format={v => `${Number(v).toFixed(1)}%`}
                            />

                            <SectionRow label="Construction" colSpan={selected.length} />
                            <CompareRowText label="Construction Update" values={selected.map(u => u.constructionUpdate)} />
                            <CompareRowText label="Compound Status" values={selected.map(u => u.compound?.status?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || null)} />
                            <CompareRowText label="Delivery Date" values={selected.map(u => u.compound?.deliveryDate)} />

                            {/* Floor plans */}
                            {selected.some(u => u.floorPlanImage) && (
                                <>
                                    <SectionRow label="Floor Plan" colSpan={selected.length} />
                                    <tr>
                                        <td className="compare-row-label">2D Floor Plan</td>
                                        {selected.map((u) => (
                                            <td key={u.id} className="compare-cell">
                                                {u.floorPlanImage ? (
                                                    <img
                                                        src={u.floorPlanImage}
                                                        alt="Floor Plan"
                                                        style={{ maxWidth: 180, maxHeight: 140, objectFit: 'contain', borderRadius: 6, border: '1px solid var(--color-border)', cursor: 'pointer' }}
                                                        onClick={() => window.open(u.floorPlanImage, '_blank')}
                                                    />
                                                ) : (
                                                    <span style={{ color: 'var(--color-text-muted)' }}>—</span>
                                                )}
                                            </td>
                                        ))}
                                    </tr>
                                </>
                            )}
                        </tbody>
                    </table>

                    {/* Legend */}
                    <div style={{ padding: '12px 16px', display: 'flex', gap: 20, fontSize: '0.75rem', borderTop: '1px solid var(--color-border)' }}>
                        <span style={{ color: '#10b981', fontWeight: 700 }}>● Best value</span>
                        <span style={{ color: '#ef4444' }}>● Worst value</span>
                        <span style={{ color: 'var(--color-text-secondary)' }}>● Middle / neutral</span>
                    </div>
                </div>
            )}

            {selected.length === 1 && (
                <div className="card mb-lg" style={{ textAlign: 'center', padding: 'var(--space-xl)' }}>
                    <div style={{ fontSize: '2rem', marginBottom: 8 }}>👈</div>
                    <p style={{ color: 'var(--color-text-secondary)' }}>Select at least one more unit below to start comparing.</p>
                </div>
            )}

            {/* ---- UNIT SELECTION ---- */}
            <div className="card">
                <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                    <h3 className="card-title">
                        All Units
                        <span style={{ fontSize: '0.78rem', fontWeight: 400, color: 'var(--color-text-muted)', marginLeft: 8 }}>
                            {selected.length}/{MAX_SELECT} selected
                        </span>
                    </h3>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <input
                            type="text"
                            className="form-input"
                            style={{ width: 200 }}
                            placeholder="Search..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        <select className="form-select" style={{ width: 140 }} value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                            <option value="">All Types</option>
                            {Object.entries(typeLabel).map(([v, l]) => (
                                <option key={v} value={v}>{l}</option>
                            ))}
                        </select>
                        <select className="form-select" style={{ width: 180 }} value={filterCompound} onChange={(e) => setFilterCompound(e.target.value)}>
                            <option value="">All Compounds</option>
                            {compounds.map((c) => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {filtered.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">🏠</div>
                        <div className="empty-state-text">No units found</div>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-md)', padding: 'var(--space-md)' }}>
                        {filtered.map((u) => {
                            const sel = isSelected(u);
                            const ppsqm = u.pricePerSqm || (u.price && u.area ? u.price / u.area : null);
                            return (
                                <div
                                    key={u.id}
                                    onClick={() => toggleSelect(u)}
                                    style={{
                                        background: sel ? 'rgba(59,130,246,0.12)' : 'var(--color-bg-secondary)',
                                        border: sel ? '2px solid var(--color-primary)' : '2px solid var(--color-border)',
                                        borderRadius: 'var(--radius-lg)',
                                        padding: 'var(--space-md)',
                                        cursor: 'pointer',
                                        transition: 'all var(--transition-base)',
                                        position: 'relative',
                                    }}
                                >
                                    {/* Checkbox indicator */}
                                    <div style={{
                                        position: 'absolute',
                                        top: 10,
                                        right: 10,
                                        width: 22,
                                        height: 22,
                                        borderRadius: '50%',
                                        background: sel ? 'var(--color-primary)' : 'transparent',
                                        border: `2px solid ${sel ? 'var(--color-primary)' : 'var(--color-border)'}`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '0.75rem',
                                        color: '#fff',
                                        fontWeight: 700,
                                        flexShrink: 0,
                                    }}>
                                        {sel ? '✓' : ''}
                                    </div>

                                    <div style={{ fontWeight: 700, fontSize: '0.95rem', paddingRight: 30 }}>{u.compound?.name}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: 2, marginBottom: 8 }}>
                                        {u.compound?.developer?.name} · {u.compound?.location}
                                    </div>

                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                                        <span style={{ fontSize: '0.75rem', background: 'rgba(59,130,246,0.15)', color: 'var(--color-primary)', borderRadius: 4, padding: '2px 7px' }}>
                                            {typeLabel[u.type] || u.type}
                                        </span>
                                        <span style={{ fontSize: '0.75rem', background: 'rgba(148,163,184,0.1)', color: 'var(--color-text-secondary)', borderRadius: 4, padding: '2px 7px' }}>
                                            {finishingLabel[u.finishingType] || u.finishingType}
                                        </span>
                                    </div>

                                    <div style={{ display: 'flex', gap: 12, fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: 8 }}>
                                        <span>🛏 {u.bedrooms}</span>
                                        <span>🚿 {u.bathrooms}</span>
                                        <span>📐 {u.area} sqm</span>
                                        {u.floor != null && <span>🏢 Fl.{u.floor}</span>}
                                    </div>

                                    <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--color-accent)' }}>
                                        {formatCurrency(u.price)}
                                    </div>
                                    {ppsqm && (
                                        <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: 2 }}>
                                            {new Intl.NumberFormat('en-EG', { maximumFractionDigits: 0 }).format(ppsqm)} EGP/sqm
                                        </div>
                                    )}

                                    {(u.appreciationRate != null || u.rentYield != null) && (
                                        <div style={{ display: 'flex', gap: 10, marginTop: 8, fontSize: '0.75rem' }}>
                                            {u.appreciationRate != null && (
                                                <span style={{ color: '#10b981' }}>↑ {u.appreciationRate}% apprec.</span>
                                            )}
                                            {u.rentYield != null && (
                                                <span style={{ color: '#3b82f6' }}>↑ {u.rentYield}% yield</span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <style>{`
                .compare-th-label {
                    width: 180px;
                    min-width: 140px;
                    padding: 10px 16px;
                    background: var(--color-bg-tertiary);
                    border-bottom: 2px solid var(--color-border);
                    text-align: left;
                    font-size: 0.75rem;
                    color: var(--color-text-muted);
                    text-transform: uppercase;
                    letter-spacing: 0.04em;
                }
                .compare-th-unit {
                    padding: 12px 16px;
                    background: var(--color-bg-secondary);
                    border-bottom: 2px solid var(--color-primary);
                    text-align: center;
                    vertical-align: top;
                    min-width: 180px;
                }
                .compare-row-label {
                    padding: 9px 16px;
                    font-size: 0.78rem;
                    color: var(--color-text-secondary);
                    white-space: nowrap;
                    border-bottom: 1px solid var(--color-border-light);
                    background: var(--color-bg-tertiary);
                    font-weight: 500;
                }
                .compare-cell {
                    padding: 9px 16px;
                    text-align: center;
                    font-size: 0.85rem;
                    border-bottom: 1px solid var(--color-border-light);
                    transition: background var(--transition-fast);
                }
                tbody tr:hover .compare-cell,
                tbody tr:hover .compare-row-label {
                    background: rgba(255,255,255,0.03);
                }
            `}</style>
        </div>
    );
}
