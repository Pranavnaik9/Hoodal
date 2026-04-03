import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import { Link } from 'react-router-dom';
import { Store, MapPin, Package, ArrowRight, Locate, Search } from 'lucide-react';
import apiClient from '../lib/api';
import { Shop } from '../types';

// Fix default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function formatDistance(d: number): string {
    return d < 1 ? `${Math.round(d * 1000)}m away` : `${d.toFixed(1)}km away`;
}

export function CustomerExplorePage() {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);
    const markersRef = useRef<L.Marker[]>([]);

    const [userLocation, setUserLocation] = useState<[number, number]>([20.5937, 78.9629]);
    const [hasUserLocation, setHasUserLocation] = useState(false);
    const [shops, setShops] = useState<Shop[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedShop, setSelectedShop] = useState<string | null>(null);

    // Fetch shops
    useEffect(() => {
        const fetchShops = async () => {
            try {
                setLoading(true);
                const res = await apiClient.get('/shops');
                setShops(res.data.data || []);
            } catch (err) {
                console.error('Failed to fetch shops', err);
            } finally {
                setLoading(false);
            }
        };
        fetchShops();
    }, []);

    // Get user location
    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const loc: [number, number] = [pos.coords.latitude, pos.coords.longitude];
                    setUserLocation(loc);
                    setHasUserLocation(true);
                },
                () => {},
                { timeout: 10000, enableHighAccuracy: true }
            );
        }
    }, []);

    // Initialize Leaflet map (vanilla, no react-leaflet)
    useEffect(() => {
        if (!mapContainerRef.current || mapInstanceRef.current) return;

        const map = L.map(mapContainerRef.current, {
            center: userLocation,
            zoom: hasUserLocation ? 14 : 5,
            zoomControl: false,
        });

        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
            maxZoom: 19,
        }).addTo(map);

        // Add zoom control to bottom-right
        L.control.zoom({ position: 'bottomright' }).addTo(map);

        mapInstanceRef.current = map;

        return () => {
            map.remove();
            mapInstanceRef.current = null;
        };
    }, []); // only run once on mount

    // Recenter map when user location is found
    useEffect(() => {
        if (hasUserLocation && mapInstanceRef.current) {
            mapInstanceRef.current.flyTo(userLocation, 14, { duration: 1.5 });

            // Add user location marker
            const userIcon = L.divIcon({
                html: `<div style="
                    width: 18px; height: 18px;
                    background: #3b82f6;
                    border: 3px solid white;
                    border-radius: 50%;
                    box-shadow: 0 0 0 8px rgba(59,130,246,0.25), 0 2px 8px rgba(0,0,0,0.3);
                "></div>`,
                className: '',
                iconSize: [18, 18],
                iconAnchor: [9, 9],
            });

            L.marker(userLocation, { icon: userIcon })
                .addTo(mapInstanceRef.current)
                .bindPopup('<strong style="color:#3b82f6">You are here</strong>');
        }
    }, [hasUserLocation, userLocation]);

    // Update shop markers when shops or search changes
    const shopsWithCoords = shops.filter(s => s.latitude != null && s.longitude != null);
    const filteredShops = search
        ? shopsWithCoords.filter(
              s =>
                  s.name.toLowerCase().includes(search.toLowerCase()) ||
                  (s.address || '').toLowerCase().includes(search.toLowerCase())
          )
        : shopsWithCoords;

    useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map) return;

        // Remove old markers
        markersRef.current.forEach(m => m.remove());
        markersRef.current = [];

        const shopIcon = L.divIcon({
            html: `<div style="
                background: linear-gradient(135deg, #6366f1, #8b5cf6);
                width: 34px; height: 34px;
                border-radius: 50% 50% 50% 0;
                transform: rotate(-45deg);
                border: 3px solid white;
                box-shadow: 0 4px 12px rgba(99,102,241,0.5);
                display: flex; align-items: center; justify-content: center;
            ">
                <svg style="transform: rotate(45deg); width: 14px; height: 14px;" viewBox="0 0 24 24" fill="white">
                    <path d="M4 21V10.08l8-6.96 8 6.96V21h-6v-6h-4v6H4z"/>
                </svg>
            </div>`,
            className: '',
            iconSize: [34, 34],
            iconAnchor: [17, 34],
            popupAnchor: [0, -34],
        });

        filteredShops.forEach(shop => {
            const distStr = hasUserLocation
                ? (() => {
                      const d = getDistance(userLocation[0], userLocation[1], shop.latitude!, shop.longitude!);
                      return `<p style="font-size:11px;color:#6366f1;margin-top:6px;font-weight:500;">${
                          d < 1 ? `${Math.round(d * 1000)}m from you` : `${d.toFixed(1)}km from you`
                      }</p>`;
                  })()
                : '';

            const popupContent = `
                <div style="font-family:Inter,system-ui,sans-serif;padding:4px;min-width:180px;">
                    <h3 style="font-size:15px;font-weight:700;color:#1e293b;margin:0 0 4px;line-height:1.3;">
                        ${shop.name}
                    </h3>
                    ${shop.address ? `<p style="font-size:12px;color:#64748b;margin:0 0 6px;line-height:1.4;">📍 ${shop.address}</p>` : ''}
                    ${shop.deliverySlots ? `<div style="font-size:11px;color:#6366f1;background:rgba(99,102,241,0.1);padding:4px 6px;border-radius:4px;margin-bottom:6px;font-weight:500;">⏱️ Slots: ${shop.deliverySlots}</div>` : ''}
                    <div style="display:flex;align-items:center;justify-content:space-between;border-top:1px solid #e2e8f0;padding-top:8px;margin-top:4px;">
                        <span style="font-size:12px;color:#94a3b8;">📦 ${shop._count?.products || 0} products</span>
                        <a href="/shop/${shop.id}" style="font-size:12px;font-weight:600;color:#6366f1;text-decoration:none;">Browse →</a>
                    </div>
                    ${distStr}
                </div>
            `;

            const marker = L.marker([shop.latitude!, shop.longitude!], { icon: shopIcon })
                .addTo(map)
                .bindPopup(popupContent, { maxWidth: 280, minWidth: 200 });

            markersRef.current.push(marker);
        });
    }, [filteredShops, hasUserLocation, userLocation]);

    const sortedShops = hasUserLocation
        ? [...filteredShops].sort((a, b) => {
              const distA = getDistance(userLocation[0], userLocation[1], a.latitude!, a.longitude!);
              const distB = getDistance(userLocation[0], userLocation[1], b.latitude!, b.longitude!);
              return distA - distB;
          })
        : filteredShops;

    const handleLocateMe = () => {
        if (hasUserLocation && mapInstanceRef.current) {
            mapInstanceRef.current.flyTo(userLocation, 15, { duration: 1.5 });
        } else {
            navigator.geolocation?.getCurrentPosition(
                (pos) => {
                    const loc: [number, number] = [pos.coords.latitude, pos.coords.longitude];
                    setUserLocation(loc);
                    setHasUserLocation(true);
                },
                () => alert('Could not get your location. Please enable location services.'),
                { timeout: 10000, enableHighAccuracy: true }
            );
        }
    };

    const handleFocusShop = (shop: Shop) => {
        if (shop.latitude != null && shop.longitude != null && mapInstanceRef.current) {
            mapInstanceRef.current.flyTo([shop.latitude, shop.longitude], 16, { duration: 1.2 });
            setSelectedShop(shop.id);

            // Open the matching marker's popup
            markersRef.current.forEach(m => {
                const pos = m.getLatLng();
                if (
                    Math.abs(pos.lat - shop.latitude!) < 0.0001 &&
                    Math.abs(pos.lng - shop.longitude!) < 0.0001
                ) {
                    m.openPopup();
                }
            });
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 flex flex-col" style={{ paddingTop: '64px' }}>
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600/15 to-purple-600/15 border-b border-white/10 py-4 px-4 md:px-8 z-20 relative">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="bg-indigo-500/20 p-2.5 rounded-xl">
                            <MapPin className="h-6 w-6 text-indigo-400" />
                        </div>
                        <div>
                            <h1 className="text-xl md:text-2xl font-bold text-white">Explore Nearby</h1>
                            <p className="text-sm text-gray-400">
                                {loading
                                    ? 'Loading shops...'
                                    : `${shopsWithCoords.length} shop${shopsWithCoords.length !== 1 ? 's' : ''} on map`}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="relative flex-1 md:w-72">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search shops..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-white/10 backdrop-blur-xl border border-white/15 rounded-xl text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            />
                        </div>
                        <button
                            onClick={handleLocateMe}
                            className="flex items-center gap-2 bg-indigo-500/15 text-indigo-400 px-3 py-2 rounded-xl hover:bg-indigo-500/25 transition-all text-sm font-medium border border-indigo-500/20 whitespace-nowrap"
                        >
                            <Locate className="h-4 w-4" />
                            <span className="hidden sm:inline">My Location</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col lg:flex-row relative" style={{ height: 'calc(100vh - 64px - 73px)' }}>
                {/* Shop List Sidebar */}
                <div
                    className="lg:w-80 xl:w-96 bg-slate-900/95 backdrop-blur-xl border-r border-white/5 overflow-y-auto z-10"
                    style={{ maxHeight: '100%' }}
                >
                    <div className="p-3">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-12">
                                <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-500 border-t-transparent mb-3"></div>
                                <p className="text-gray-500 text-sm">Finding nearby shops...</p>
                            </div>
                        ) : sortedShops.length === 0 ? (
                            <div className="text-center py-12">
                                <Store className="h-10 w-10 text-gray-600 mx-auto mb-3" />
                                <p className="text-gray-400 text-sm font-medium">No shops found on map</p>
                                <p className="text-gray-600 text-xs mt-1">
                                    {shops.length > 0
                                        ? "Shops haven't set their location yet"
                                        : 'No shops registered yet'}
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {sortedShops.map((shop) => {
                                    const dist = hasUserLocation
                                        ? getDistance(userLocation[0], userLocation[1], shop.latitude!, shop.longitude!)
                                        : null;
                                    return (
                                        <button
                                            key={shop.id}
                                            onClick={() => handleFocusShop(shop)}
                                            className={`w-full text-left p-3 rounded-xl border transition-all duration-200 group ${
                                                selectedShop === shop.id
                                                    ? 'bg-indigo-500/15 border-indigo-500/40 shadow-lg shadow-indigo-500/10'
                                                    : 'bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.06] hover:border-white/10'
                                            }`}
                                        >
                                            <div className="flex items-start gap-3">
                                                <div
                                                    className={`p-2 rounded-lg shrink-0 ${
                                                        selectedShop === shop.id
                                                            ? 'bg-indigo-500/20'
                                                            : 'bg-white/[0.05] group-hover:bg-indigo-500/10'
                                                    }`}
                                                >
                                                    <Store
                                                        className={`h-4 w-4 ${
                                                            selectedShop === shop.id
                                                                ? 'text-indigo-400'
                                                                : 'text-gray-400 group-hover:text-indigo-400'
                                                        }`}
                                                    />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-0.5">
                                                        <h4
                                                            className={`font-semibold text-sm truncate ${
                                                                selectedShop === shop.id
                                                                    ? 'text-indigo-300'
                                                                    : 'text-gray-200 group-hover:text-white'
                                                            }`}
                                                        >
                                                            {shop.name}
                                                        </h4>
                                                        {!shop.isActive && (
                                                            <span className="px-1.5 py-0.5 bg-red-500/20 border border-red-500/30 text-red-500 text-[8px] font-bold rounded uppercase tracking-tighter">
                                                                Offline
                                                            </span>
                                                        )}
                                                    </div>
                                                    {shop.address && (
                                                        <p className="text-xs text-gray-500 mt-0.5 truncate">
                                                            {shop.address}
                                                        </p>
                                                    )}
                                                    <div className="flex items-center gap-3 mt-1.5">
                                                        <span className="text-xs text-gray-500 flex items-center gap-1">
                                                            <Package className="h-3 w-3" />
                                                            {shop._count?.products || 0} items
                                                        </span>
                                                        {dist !== null && (
                                                            <span className="text-xs text-indigo-400 font-medium shrink-0">
                                                                {formatDistance(dist)}
                                                            </span>
                                                        )}
                                                        {shop.deliverySlots && (
                                                            <span className="text-[10px] text-indigo-300/80 truncate border-l border-white/20 pl-2 ml-1">
                                                                ⏱️ {shop.deliverySlots}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <ArrowRight
                                                    className={`h-4 w-4 shrink-0 mt-1 transition-transform ${
                                                        selectedShop === shop.id
                                                            ? 'text-indigo-400 translate-x-0.5'
                                                            : 'text-gray-600 group-hover:text-gray-400 group-hover:translate-x-0.5'
                                                    }`}
                                                />
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Map Container - vanilla Leaflet */}
                <div className="flex-1 relative" style={{ minHeight: '400px' }}>
                    <div ref={mapContainerRef} style={{ height: '100%', width: '100%', position: 'absolute', inset: 0 }} />

                    {/* Overlay when no shops have coordinates */}
                    {!loading && shopsWithCoords.length === 0 && shops.length > 0 && (
                        <div className="absolute inset-0 flex items-center justify-center z-[1000] pointer-events-none">
                            <div className="bg-slate-800/90 backdrop-blur-xl border border-white/10 rounded-2xl p-8 max-w-sm text-center pointer-events-auto shadow-2xl">
                                <MapPin className="h-12 w-12 text-indigo-400 mx-auto mb-4" />
                                <h3 className="text-lg font-bold text-white mb-2">No Shop Locations Yet</h3>
                                <p className="text-gray-400 text-sm">
                                    Shops haven't set their map coordinates yet. Check back soon or browse the{' '}
                                    <Link to="/marketplace" className="text-indigo-400 hover:underline font-medium">
                                        marketplace
                                    </Link>{' '}
                                    instead.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
