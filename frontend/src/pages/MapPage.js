import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import { Search, X, Filter, MapPin, Clock, Star, Shield, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import ReviewSection from '@/components/ReviewSection';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const SAFETY_COLORS = { SAFE: '#10B981', CAUTION: '#F59E0B', AVOID: '#EF4444' };
const TYPE_OPTIONS = ['MOSQUE', 'PALACE', 'MUSEUM', 'MARKET', 'GARDEN', 'RUIN', 'MOUNTAIN', 'BEACH', 'MEDINA', 'RESTAURANT', 'RIAD'];
const TYPE_EMOJI = { MOSQUE: '🕌', PALACE: '🏰', MUSEUM: '🏛', MARKET: '🛍', GARDEN: '🌿', RUIN: '🏚', MOUNTAIN: '⛰', BEACH: '🏖', MEDINA: '🏘', RESTAURANT: '🍽', RIAD: '🏠' };

function FlyToMarker({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.flyTo(position, 14, { duration: 0.8 });
  }, [position, map]);
  return null;
}

export default function MapPage() {
  const [landmarks, setLandmarks] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState([]);
  const [safetyFilter, setSafetyFilter] = useState(['SAFE', 'CAUTION']);
  const [selected, setSelected] = useState(null);
  const [flyTo, setFlyTo] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    axios.get(`${API}/landmarks`).then(r => {
      setLandmarks(r.data.landmarks);
      setFiltered(r.data.landmarks);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    let result = landmarks;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(l => l.name.toLowerCase().includes(q) || l.city.toLowerCase().includes(q) || l.description.toLowerCase().includes(q));
    }
    if (typeFilter.length > 0) result = result.filter(l => typeFilter.includes(l.type));
    if (safetyFilter.length > 0) result = result.filter(l => safetyFilter.includes(l.safety_level));
    setFiltered(result);
  }, [search, typeFilter, safetyFilter, landmarks]);

  const handleMarkerClick = (lm) => {
    setSelected(lm);
    setFlyTo([lm.lat, lm.lng]);
  };

  const toggleType = (t) => setTypeFilter(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
  const toggleSafety = (s) => setSafetyFilter(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);

  return (
    <div data-testid="map-page" className="flex flex-col lg:flex-row" style={{ height: 'calc(100vh - 64px)' }}>
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-full lg:w-80' : 'w-0 overflow-hidden'} bg-white border-r border-stone-100 flex flex-col transition-all duration-300 max-h-[40vh] lg:max-h-full`}>
        <div className="p-4 border-b border-stone-100 space-y-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input
              data-testid="map-search"
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search landmarks..."
              className="w-full h-10 pl-9 pr-8 border border-stone-200 rounded-xl text-sm bg-stone-50 focus:ring-2 focus:ring-terracotta-200 focus:border-terracotta-400 outline-none"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="w-4 h-4 text-stone-400" />
              </button>
            )}
          </div>

          {/* Safety filter */}
          <div className="flex gap-1.5">
            {['SAFE', 'CAUTION', 'AVOID'].map(s => (
              <button
                key={s}
                data-testid={`safety-filter-${s.toLowerCase()}`}
                onClick={() => toggleSafety(s)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all ${
                  safetyFilter.includes(s)
                    ? s === 'SAFE' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      s === 'CAUTION' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                      'bg-red-50 text-red-700 border-red-200'
                    : 'bg-stone-50 text-stone-400 border-stone-200'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: SAFETY_COLORS[s] }} />
                {s.charAt(0) + s.slice(1).toLowerCase()}
              </button>
            ))}
          </div>

          {/* Type filter */}
          <div className="flex flex-wrap gap-1">
            {TYPE_OPTIONS.map(t => (
              <button
                key={t}
                onClick={() => toggleType(t)}
                className={`px-2 py-0.5 rounded text-[10px] font-medium border transition-all ${
                  typeFilter.includes(t) ? 'bg-terracotta-50 text-terracotta-600 border-terracotta-200' : 'bg-stone-50 text-stone-500 border-stone-200'
                }`}
              >
                {TYPE_EMOJI[t] || ''} {t.charAt(0) + t.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-stone-400">{filtered.length} landmarks</p>
        </div>

        {/* Landmark list */}
        <div className="flex-1 overflow-y-auto">
          {filtered.map(lm => (
            <button
              key={lm.id}
              data-testid={`landmark-item-${lm.id}`}
              onClick={() => handleMarkerClick(lm)}
              className={`w-full text-left px-4 py-3 border-b border-stone-50 hover:bg-stone-50 transition-colors flex items-center gap-3 ${
                selected?.id === lm.id ? 'bg-terracotta-50 border-l-2 border-l-terracotta-500' : ''
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: SAFETY_COLORS[lm.safety_level] }} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-midnight-500 truncate">{lm.name}</p>
                <p className="text-[11px] text-stone-400">{lm.city} &middot; {lm.type.charAt(0) + lm.type.slice(1).toLowerCase()}</p>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-stone-300 flex-shrink-0" />
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="p-6 text-center">
              <p className="text-4xl mb-2">📍</p>
              <p className="text-sm text-stone-500">No landmarks match your filters</p>
              <button onClick={() => { setSearch(''); setTypeFilter([]); setSafetyFilter(['SAFE', 'CAUTION']); }} className="text-xs text-terracotta-500 mt-2 hover:underline">
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        <MapContainer
          center={[31.6295, -7.9811]}
          zoom={6}
          className="w-full h-full"
          zoomControl={false}
          data-testid="leaflet-map"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {flyTo && <FlyToMarker position={flyTo} />}
          {filtered.map(lm => (
            <CircleMarker
              key={lm.id}
              center={[lm.lat, lm.lng]}
              radius={selected?.id === lm.id ? 10 : 7}
              pathOptions={{
                fillColor: SAFETY_COLORS[lm.safety_level],
                color: 'white',
                weight: 2,
                fillOpacity: 0.9,
              }}
              eventHandlers={{ click: () => handleMarkerClick(lm) }}
            >
              <Popup>
                <div className="min-w-[200px]">
                  <p className="font-bold text-sm">{lm.name}</p>
                  <p className="text-xs text-gray-500">{lm.city} &middot; {lm.type}</p>
                  <p className="text-xs mt-1">{lm.description?.slice(0, 100)}...</p>
                  <div className="flex gap-2 mt-2 text-[11px]">
                    {lm.visit_duration && <span>⏱ {lm.visit_duration}min</span>}
                    {lm.entry_fee !== undefined && <span>💰 {lm.entry_fee > 0 ? `${lm.entry_fee} MAD` : 'Free'}</span>}
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>

        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg shadow-md px-3 py-2 text-xs z-[1000]" data-testid="map-legend">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-safety-safe" /> Safe</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-safety-caution" /> Caution</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-safety-avoid" /> Avoid</span>
          </div>
        </div>

        {/* Toggle sidebar btn (mobile) */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="lg:hidden absolute top-4 left-4 z-[1000] bg-white rounded-lg shadow-md p-2"
        >
          <Filter className="w-4 h-4 text-stone-600" />
        </button>

        {/* Selected landmark detail */}
        {selected && (
          <div data-testid="landmark-detail" className="absolute bottom-4 right-4 bg-white rounded-2xl shadow-xl border border-stone-100 p-4 w-80 z-[1000] animate-slide-in-right">
            <button onClick={() => setSelected(null)} className="absolute top-3 right-3 text-stone-400 hover:text-stone-600"><X className="w-4 h-4" /></button>
            {selected.cover_image && <img src={selected.cover_image} alt={`${selected.name} ${selected.city} Morocco - ${selected.type} landmark - Visit duration ${selected.visit_duration}min`} title={`${selected.name} - ${selected.city} Morocco travel guide`} className="w-full h-32 object-cover rounded-xl mb-3" loading="lazy" width="600" height="300" />}
            <h3 className="text-lg font-bold text-midnight-500">{selected.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                selected.safety_level === 'SAFE' ? 'bg-emerald-50 text-emerald-700' :
                selected.safety_level === 'CAUTION' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'
              }`}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: SAFETY_COLORS[selected.safety_level] }} />
                {selected.safety_level}
              </span>
              {selected.rating && <span className="text-xs text-saffron-600 flex items-center gap-0.5"><Star className="w-3 h-3 fill-saffron-400" />{selected.rating}</span>}
            </div>
            <p className="text-xs text-stone-500 mt-2 leading-relaxed">{selected.description}</p>
            <div className="flex items-center gap-4 mt-3 text-xs text-stone-400">
              {selected.visit_duration && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{selected.visit_duration}min</span>}
              <span>{selected.entry_fee > 0 ? `${selected.entry_fee} MAD` : 'Free entry'}</span>
            </div>
            <ReviewSection targetType="landmark" targetId={selected.id} compact={true} />
          </div>
        )}
      </div>
    </div>
  );
}
