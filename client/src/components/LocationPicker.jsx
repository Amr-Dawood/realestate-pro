import { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';

// Fix leaflet default marker icons (Vite/webpack asset path issue)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

/** Moves the map view when position changes */
function FlyTo({ position }) {
    const map = useMap();
    useEffect(() => {
        if (position) map.flyTo(position, 15, { duration: 1 });
    }, [position]);
    return null;
}

/** Places marker on click */
function ClickHandler({ onPick }) {
    useMapEvents({
        click(e) { onPick([e.latlng.lat, e.latlng.lng]); }
    });
    return null;
}

export default function LocationPicker({ value, onChange, onClose }) {
    const [position, setPosition] = useState(null);   // [lat, lng]
    const [label, setLabel] = useState(value || '');  // display name
    const [search, setSearch] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [searching, setSearching] = useState(false);
    const debounceRef = useRef(null);

    // Reverse-geocode a lat/lng → human-readable name
    const reverseGeocode = useCallback(async ([lat, lng]) => {
        try {
            const res = await fetch(
                `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
                { headers: { 'Accept-Language': 'en' } }
            );
            const data = await res.json();
            return data.display_name?.split(',').slice(0, 3).join(', ') || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
        } catch {
            return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
        }
    }, []);

    // Search suggestions via Nominatim
    const fetchSuggestions = useCallback(async (q) => {
        if (q.length < 3) { setSuggestions([]); return; }
        setSearching(true);
        try {
            const res = await fetch(
                `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5`,
                { headers: { 'Accept-Language': 'en' } }
            );
            const data = await res.json();
            setSuggestions(data);
        } catch {
            setSuggestions([]);
        } finally {
            setSearching(false);
        }
    }, []);

    const handleSearchChange = (e) => {
        const q = e.target.value;
        setSearch(q);
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => fetchSuggestions(q), 350);
    };

    const handleSuggestionClick = (item) => {
        const pos = [parseFloat(item.lat), parseFloat(item.lon)];
        const name = item.display_name.split(',').slice(0, 3).join(', ');
        setPosition(pos);
        setLabel(name);
        setSearch('');
        setSuggestions([]);
    };

    const handleMapClick = async (pos) => {
        setPosition(pos);
        const name = await reverseGeocode(pos);
        setLabel(name);
        setSearch('');
        setSuggestions([]);
    };

    const handleConfirm = () => {
        onChange(label);
        onClose();
    };

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.75)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '16px',
        }}>
            <div style={{
                background: 'var(--color-bg-secondary)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)',
                width: '100%', maxWidth: 680,
                display: 'flex', flexDirection: 'column',
                maxHeight: '90vh',
                overflow: 'hidden',
            }}>
                {/* Header */}
                <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '14px 18px',
                    borderBottom: '1px solid var(--color-border)',
                }}>
                    <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--color-text-primary)' }}>
                        📍 Pick Location
                    </h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', fontSize: '1.3rem', lineHeight: 1 }}>×</button>
                </div>

                {/* Search box */}
                <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--color-border)', position: 'relative' }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <input
                            type="text"
                            className="form-input"
                            style={{ flex: 1 }}
                            placeholder="Search for a location..."
                            value={search}
                            onChange={handleSearchChange}
                            autoFocus
                        />
                        {searching && (
                            <div style={{ display: 'flex', alignItems: 'center', fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                                Searching…
                            </div>
                        )}
                    </div>

                    {suggestions.length > 0 && (
                        <div style={{
                            position: 'absolute', top: '100%', left: 18, right: 18, zIndex: 1000,
                            background: 'var(--color-bg-primary)',
                            border: '1px solid var(--color-border)',
                            borderRadius: 'var(--radius-md)',
                            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                            maxHeight: 220,
                            overflowY: 'auto',
                        }}>
                            {suggestions.map((item) => (
                                <div
                                    key={item.place_id}
                                    onClick={() => handleSuggestionClick(item)}
                                    style={{
                                        padding: '10px 14px',
                                        cursor: 'pointer',
                                        fontSize: '0.83rem',
                                        color: 'var(--color-text-primary)',
                                        borderBottom: '1px solid var(--color-border-light)',
                                        transition: 'background 0.15s',
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'var(--color-bg-secondary)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                >
                                    {item.display_name}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Map */}
                <div style={{ flex: 1, minHeight: 320, position: 'relative' }}>
                    <MapContainer
                        center={position || [30.0444, 31.2357]}
                        zoom={position ? 15 : 6}
                        style={{ height: '100%', minHeight: 320, width: '100%' }}
                        zoomControl={true}
                    >
                        <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            attribution='© <a href="https://openstreetmap.org">OpenStreetMap</a>'
                        />
                        <ClickHandler onPick={handleMapClick} />
                        {position && <FlyTo position={position} />}
                        {position && <Marker position={position} />}
                    </MapContainer>
                    {!position && (
                        <div style={{
                            position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)',
                            background: 'rgba(0,0,0,0.65)', color: '#fff',
                            fontSize: '0.75rem', padding: '5px 12px', borderRadius: 20,
                            pointerEvents: 'none', zIndex: 500,
                        }}>
                            Search above or click on the map to pin a location
                        </div>
                    )}
                </div>

                {/* Selected label + actions */}
                <div style={{
                    padding: '12px 18px',
                    borderTop: '1px solid var(--color-border)',
                    display: 'flex', gap: 10, alignItems: 'center',
                }}>
                    <input
                        type="text"
                        className="form-input"
                        style={{ flex: 1 }}
                        placeholder="Selected location name…"
                        value={label}
                        onChange={e => setLabel(e.target.value)}
                    />
                    <button className="btn btn-secondary btn-sm" onClick={onClose}>Cancel</button>
                    <button
                        className="btn btn-primary btn-sm"
                        onClick={handleConfirm}
                        disabled={!label.trim()}
                    >
                        Confirm
                    </button>
                </div>
            </div>
        </div>
    );
}
