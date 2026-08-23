"use client";

import { isValidCoordinates, type Coordinates } from "@/features/profile/components/location/types";
import { divIcon, type LeafletMouseEvent, type Marker as LeafletMarker } from "leaflet";
import { useEffect } from "react";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";

const markerIcon = divIcon({
  className: "location-marker",
  html: '<span aria-hidden="true"></span>',
  iconAnchor: [14, 28],
  iconSize: [28, 28],
});
const FALLBACK_LOCATION: Coordinates = { latitude: -6.2, longitude: 106.816666 };

export default function LocationMap({
  editable,
  value,
  onChange,
}: {
  editable: boolean;
  value: Coordinates;
  onChange: (value: Coordinates) => void;
}) {
  const safeValue = isValidCoordinates(value) ? value : FALLBACK_LOCATION;
  return (
    <MapContainer
      center={[safeValue.latitude, safeValue.longitude]}
      className="h-72 w-full"
      scrollWheelZoom={editable}
      zoom={15}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapInteraction editable={editable} onChange={onChange} value={safeValue} />
    </MapContainer>
  );
}

function MapInteraction({
  editable,
  value,
  onChange,
}: {
  editable: boolean;
  value: Coordinates;
  onChange: (value: Coordinates) => void;
}) {
  const map = useMap();

  useEffect(() => {
    const action = editable ? "enable" : "disable";
    map.dragging[action]();
    map.scrollWheelZoom[action]();
    map.doubleClickZoom[action]();
    map.touchZoom[action]();
    map.boxZoom[action]();
    map.keyboard[action]();
  }, [editable, map]);

  useEffect(() => {
    if (!isValidCoordinates(value)) return;
    const container = map.getContainer();
    if (container.clientWidth === 0 || container.clientHeight === 0) return;
    map.setView([value.latitude, value.longitude], 15, { animate: false });
  }, [map, value.latitude, value.longitude]);

  useEffect(() => {
    const container = map.getContainer();
    const resizeObserver = new ResizeObserver(([entry]) => {
      if (!entry || entry.contentRect.width === 0 || entry.contentRect.height === 0) return;
      map.invalidateSize({ animate: false });
      if (isValidCoordinates(value)) {
        map.setView([value.latitude, value.longitude], 15, { animate: false });
      }
    });
    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, [map, value.latitude, value.longitude]);

  useMapEvents({
    click(event: LeafletMouseEvent) {
      if (!editable) return;
      onChange(normalizeCoordinates(event.latlng.lat, event.latlng.lng));
    },
  });

  return (
    <Marker
      draggable={editable}
      eventHandlers={{
        dragend(event) {
          const marker = event.target as LeafletMarker;
          const position = marker.getLatLng();
          onChange(normalizeCoordinates(position.lat, position.lng));
        },
      }}
      icon={markerIcon}
      position={[value.latitude, value.longitude]}
    />
  );
}

function normalizeCoordinates(latitude: number, longitude: number): Coordinates {
  const coordinates = {
    latitude: Number(latitude.toFixed(6)),
    longitude: Number(longitude.toFixed(6)),
  };
  return isValidCoordinates(coordinates) ? coordinates : FALLBACK_LOCATION;
}
