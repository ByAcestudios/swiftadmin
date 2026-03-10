'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

function markerColor(rider) {
  if (rider.status !== 'online') return '#6b7280'; // gray offline
  if (rider.tripState === 'on_trip') return '#2563eb'; // blue on trip
  return '#16a34a'; // green idle
}

function createCustomIcon(rider) {
  const color = markerColor(rider);
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="background-color:${color};width:24px;height:24px;border-radius:50%;border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.3);"></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}

function RiderMarkers({ riders }) {
  if (!riders?.length) return null;
  return riders.map((r) => {
    if (r.latitude == null || r.longitude == null) return null;
    return (
      <Marker
        key={r.riderId}
        position={[r.latitude, r.longitude]}
        icon={createCustomIcon(r)}
      >
        <Popup>
          <div className="text-sm min-w-[180px]">
            <p className="font-semibold">{r.name || 'Rider'}</p>
            <p className="text-gray-600">{r.email}</p>
            <p className="text-gray-600">{r.phoneNumber}</p>
            <p>
              <span className={`font-medium ${r.status === 'online' ? 'text-green-600' : 'text-gray-500'}`}>
                {r.status === 'online' ? 'Online' : 'Offline'}
              </span>
              {' · '}
              <span className={r.tripState === 'on_trip' ? 'text-blue-600' : 'text-gray-600'}>
                {r.tripState === 'on_trip' ? 'On trip' : 'Idle'}
              </span>
            </p>
            {r.currentOrder && (
              <p className="mt-2 pt-2 border-t text-xs">
                Order: {r.currentOrder.orderNumber}<br />
                {r.currentOrder.pickupAddress}
              </p>
            )}
          </div>
        </Popup>
      </Marker>
    );
  });
}

export default function BirdsEyeMap({ riders, center, zoom }) {
  const defaultCenter = center || [6.5244, 3.3792];
  const defaultZoom = zoom ?? 12;

  return (
    <div className="w-full h-full rounded-lg overflow-hidden border border-gray-200 shadow">
      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        className="w-full h-full min-h-[400px]"
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <RiderMarkers riders={riders} />
      </MapContainer>
    </div>
  );
}
