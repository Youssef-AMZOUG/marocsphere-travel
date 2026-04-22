import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Star, Shield, Clock, ChevronDown, Loader2, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Helmet } from 'react-helmet';
import ReviewSection from '@/components/ReviewSection';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const SAFETY_COLORS = {
  SAFE: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Safe' },
  CAUTION: { bg: 'bg-saffron-100', text: 'text-saffron-700', label: 'Caution' },
  WARNING: { bg: 'bg-red-100', text: 'text-red-700', label: 'Warning' },
};

function DestinationCard({ dest, isExpanded, onToggle }) {
  const safety = SAFETY_COLORS[dest.safety] || SAFETY_COLORS.SAFE;

  return (
    <div data-testid={`destination-card-${dest.id}`} className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      <div className="relative h-52 overflow-hidden">
        <img
          src={dest.image}
          alt={dest.name}
          className="w-full h-full object-cover transition-transform hover:scale-105 duration-500"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className="absolute bottom-3 left-3 right-3">
          <h3 className="text-lg font-bold text-white">{dest.name}</h3>
          <p className="text-white/80 text-sm">{dest.subtitle}</p>
        </div>
        <div className="absolute top-3 right-3 flex gap-2">
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${safety.bg} ${safety.text} flex items-center gap-1`}>
            <Shield className="w-3 h-3" /> {safety.label}
          </span>
        </div>
      </div>

      <div className="p-4">
        <p className="text-sm text-stone-600 leading-relaxed">{dest.description}</p>

        <div className="flex items-center justify-between mt-3 py-3 border-t border-stone-100">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 text-sm">
              <Star className="w-4 h-4 fill-saffron-400 text-saffron-400" />
              <span className="font-semibold text-midnight-500">{dest.rating}</span>
            </div>
            <div className="flex items-center gap-1 text-sm text-stone-500">
              <MapPin className="w-3.5 h-3.5" />
              {dest.landmarks_count} landmarks
            </div>
            <div className="flex items-center gap-1 text-sm text-stone-500">
              <Clock className="w-3.5 h-3.5" />
              {dest.best_time}
            </div>
          </div>
          <button
            data-testid={`toggle-reviews-${dest.id}`}
            onClick={onToggle}
            className="flex items-center gap-1 text-xs font-medium text-terracotta-600 hover:text-terracotta-700"
          >
            Reviews <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {isExpanded && (
          <div className="pt-2 border-t border-stone-100">
            <ReviewSection targetType="destination" targetId={dest.id} compact={false} />
          </div>
        )}

        <div className="mt-3 flex gap-2">
          <Link to={`/map?lat=${dest.lat}&lng=${dest.lng}`} className="flex-1">
            <Button variant="outline" size="sm" className="w-full text-xs rounded-lg border-stone-200 text-midnight-500 hover:bg-stone-50">
              <MapPin className="w-3.5 h-3.5 mr-1" /> View on Map
            </Button>
          </Link>
          <Link to={`/concierge?destination=${dest.name}`} className="flex-1">
            <Button size="sm" className="w-full text-xs rounded-lg bg-terracotta-500 hover:bg-terracotta-600 text-white">
              Plan Trip
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function DestinationsPage() {
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    axios.get(`${API}/destinations`)
      .then(r => setDestinations(r.data.destinations || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Top Morocco Destinations',
    description: 'Discover the best destinations across Morocco — from ancient medinas to Saharan dunes.',
    numberOfItems: destinations.length,
    itemListElement: destinations.map((d, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'TouristDestination',
        name: d.name,
        description: d.description,
        image: d.image,
        geo: { '@type': 'GeoCoordinates', latitude: d.lat, longitude: d.lng },
        aggregateRating: { '@type': 'AggregateRating', ratingValue: d.rating, bestRating: 5, ratingCount: d.landmarks_count },
      }
    })),
  };

  return (
    <>
      <Helmet>
        <title>Morocco Destinations 2026 | Marrakech, Fes, Sahara, Chefchaouen | MarocSphere</title>
        <meta name="description" content="Explore top Moroccan destinations 2026: Marrakech hors sentiers battus, Fes medina guide pratique, Chefchaouen, Essaouira, Merzouga Sahara, Taghazout luxe. Reviews, safety info, AI trip planning. Destinations voyage Maroc." />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      <div data-testid="destinations-page" className="min-h-screen bg-stone-50">
        {/* Hero */}
        <div className="relative bg-midnight-500 text-white overflow-hidden">
          <div className="absolute inset-0">
            <img
              src="https://images.unsplash.com/photo-1489749798305-4fea3ae63d43?w=1400&q=70"
              alt="Morocco landscape"
              className="w-full h-full object-cover opacity-30"
            />
          </div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2 text-terracotta-300 text-sm font-medium mb-3">
                <Camera className="w-4 h-4" /> Curated Destinations
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight">
                Discover <span className="text-terracotta-400">Morocco</span>
              </h1>
              <p className="text-base text-midnight-200 mt-4 max-w-lg">
                From the vibrant souks of Marrakech to the endless Saharan dunes — explore the destinations that make Morocco unforgettable.
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-terracotta-500" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {destinations.map(dest => (
                <DestinationCard
                  key={dest.id}
                  dest={dest}
                  isExpanded={expandedId === dest.id}
                  onToggle={() => setExpandedId(expandedId === dest.id ? null : dest.id)}
                />
              ))}
            </div>
          )}

          {!loading && destinations.length === 0 && (
            <div className="text-center py-20">
              <MapPin className="w-12 h-12 text-stone-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-midnight-500 mb-2">No destinations found</h3>
              <p className="text-stone-500">Check back soon for new destinations!</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
