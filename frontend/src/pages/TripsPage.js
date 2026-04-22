import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Calendar, MapPin, Clock, Trash2 } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/sonner';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const STATUS_STYLES = {
  PLANNED: 'bg-blue-50 text-blue-700',
  ONGOING: 'bg-emerald-50 text-emerald-700',
  COMPLETED: 'bg-stone-100 text-stone-600',
  CANCELLED: 'bg-red-50 text-red-600',
};

const DEST_GRADIENTS = {
  Marrakech: 'from-terracotta-400 to-terracotta-600',
  Fes: 'from-midnight-400 to-midnight-600',
  Chefchaouen: 'from-blue-400 to-blue-600',
  Essaouira: 'from-teal-400 to-teal-600',
  Merzouga: 'from-amber-400 to-amber-600',
  Ouarzazate: 'from-stone-500 to-stone-700',
  default: 'from-terracotta-400 to-midnight-500',
};

export default function TripsPage() {
  const navigate = useNavigate();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    axios.get(`${API}/itineraries`).then(r => {
      setTrips(r.data.itineraries || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    try {
      await axios.delete(`${API}/itineraries/${id}`);
      setTrips(prev => prev.filter(t => t.id !== id));
      toast.success('Trip deleted');
    } catch {
      toast.error('Failed to delete trip');
    }
  };

  const filtered = filter === 'all' ? trips : trips.filter(t => t.status === filter.toUpperCase());

  return (
    <div data-testid="trips-page" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-sm font-bold uppercase tracking-widest text-saffron-500 mb-1">My Journeys</p>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-midnight-500">My Trips</h1>
        </div>
        <Button
          data-testid="new-trip-btn"
          onClick={() => navigate('/concierge')}
          className="bg-terracotta-500 hover:bg-terracotta-600 text-white rounded-xl font-semibold btn-press"
        >
          <Plus className="w-4 h-4 mr-1" /> New Trip
        </Button>
      </div>

      <Tabs defaultValue="all" onValueChange={setFilter} className="mb-6">
        <TabsList className="bg-stone-100 rounded-xl p-1">
          <TabsTrigger value="all" className="rounded-lg text-xs font-semibold data-[state=active]:bg-white data-[state=active]:shadow-sm">All</TabsTrigger>
          <TabsTrigger value="planned" className="rounded-lg text-xs font-semibold data-[state=active]:bg-white data-[state=active]:shadow-sm">Planned</TabsTrigger>
          <TabsTrigger value="ongoing" className="rounded-lg text-xs font-semibold data-[state=active]:bg-white data-[state=active]:shadow-sm">Ongoing</TabsTrigger>
          <TabsTrigger value="completed" className="rounded-lg text-xs font-semibold data-[state=active]:bg-white data-[state=active]:shadow-sm">Completed</TabsTrigger>
        </TabsList>
      </Tabs>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-2xl overflow-hidden border border-stone-100">
              <Skeleton className="h-40 rounded-none" />
              <div className="p-5 space-y-3">
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div data-testid="trips-empty" className="flex flex-col items-center justify-center text-center py-20 bg-white rounded-2xl border border-stone-100">
          <div className="text-6xl mb-4">🧳</div>
          <h3 className="text-xl font-bold text-midnight-500 mb-2">No trips yet</h3>
          <p className="text-sm text-stone-500 mb-6 max-w-xs">Plan your first Moroccan adventure with our AI concierge.</p>
          <Button
            onClick={() => navigate('/concierge')}
            className="bg-terracotta-500 hover:bg-terracotta-600 text-white rounded-xl font-semibold btn-press"
          >
            Start Planning
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(trip => {
            const gradient = DEST_GRADIENTS[trip.destination] || DEST_GRADIENTS.default;
            const title = trip.data?.title || `${trip.duration}-Day ${trip.destination}`;
            return (
              <div
                key={trip.id}
                data-testid={`trip-card-${trip.id}`}
                className="bg-white rounded-2xl overflow-hidden border border-stone-100 shadow-sm card-hover cursor-pointer group"
                onClick={() => navigate(`/concierge`)}
              >
                <div className={`relative h-36 bg-gradient-to-br ${gradient}`}>
                  <div className="absolute inset-0 flex items-center justify-center text-5xl opacity-30">🗺</div>
                  <div className="absolute top-3 right-3">
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${STATUS_STYLES[trip.status] || STATUS_STYLES.PLANNED}`}>
                      {trip.status}
                    </span>
                  </div>
                  <button
                    onClick={(e) => handleDelete(trip.id, e)}
                    className="absolute top-3 left-3 p-1.5 bg-white/20 rounded-lg backdrop-blur-sm text-white/80 hover:text-white hover:bg-white/30 transition-all opacity-0 group-hover:opacity-100"
                    data-testid={`delete-trip-${trip.id}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="p-5">
                  <h3 className="text-base font-bold text-midnight-500 line-clamp-2">{title}</h3>
                  <p className="text-xs text-stone-500 mt-1 flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {trip.destination}
                  </p>
                  <div className="flex items-center gap-4 mt-3 pt-3 border-t border-stone-50 text-xs text-stone-400">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{trip.start_date}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{trip.duration} days</span>
                  </div>
                </div>
              </div>
            );
          })}

          {/* New Trip Card */}
          <div
            data-testid="new-trip-card"
            onClick={() => navigate('/concierge')}
            className="border-2 border-dashed border-stone-200 rounded-2xl flex flex-col items-center justify-center py-16 cursor-pointer hover:border-terracotta-400 hover:bg-terracotta-50/30 transition-all"
          >
            <Plus className="w-10 h-10 text-stone-300 mb-2" />
            <p className="text-sm text-stone-500 font-medium">Plan a new trip</p>
          </div>
        </div>
      )}
    </div>
  );
}
