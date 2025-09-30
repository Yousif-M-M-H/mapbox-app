// app/src/features/SDSM/views/VehicleMarkers.tsx
import React, { useMemo, useRef } from 'react';
import MapboxGL from '@rnmapbox/maps';
import { observer } from 'mobx-react-lite';
import { VehicleDisplayViewModel } from '../viewmodels/VehicleDisplayViewModel';

interface VehicleMarkersProps {
  viewModel: VehicleDisplayViewModel;
}

// --- helpers ---
const normalizeDeg = (d: number) => {
  let x = d % 360;
  if (x < 0) x += 360;
  return x;
};
const angleDiff = (a: number, b: number) => {
  // smallest signed difference a->b in degrees (-180..+180)
  let d = normalizeDeg(b) - normalizeDeg(a);
  if (d > 180) d -= 360;
  if (d < -180) d += 360;
  return d;
};
// snap to 5° to calm mapbox re-renders
const snapDeg = (d: number, step: number = 5) => Math.round(d / step) * step;

// Heading smoothing: only accept updates when moving and change > minDelta
const nextStableHeading = (
  prev: number | undefined,
  raw: number,
  moving: boolean,
  minDelta: number = 10, // ignore micro-jitter
  alpha: number = 0.25   // EMA strength for visual smoothness
) => {
  const target = normalizeDeg(raw);
  if (!moving) return prev ?? target; // hold last when stopped
  if (prev == null) return target;

  const d = angleDiff(prev, target);
  if (Math.abs(d) < minDelta) return prev; // too small, ignore

  // EMA along the shortest arc
  const updated = normalizeDeg(prev + d * alpha);
  return updated;
};

// Check if vehicle is moving based on speed (m/s)
const isVehicleMoving = (speed: number | undefined, threshold: number = 0.5) => {
  // 0.5 m/s ≈ 1.8 km/h; beneath this, GPS heading is garbage
  return speed !== undefined && speed > threshold;
};

// Convert API heading (1/80° units) to degrees, handle "unavailable"
const headingFromApi = (heading: number | undefined) => {
  if (heading == null) return undefined;
  // Common sentinel values: 8191/28800 in some feeds; treat large/sentinel as unavailable
  if (heading === 8191 || heading === 28800 || heading < 0) return undefined;
  return normalizeDeg(heading / 80);
};

export const VehicleMarkers: React.FC<VehicleMarkersProps> = observer(({ viewModel }) => {
  // cache of last stable heading per vehicle
  const lastHeadingRef = useRef<Map<string | number, number>>(new Map());

  const vehicleGeoJSON = useMemo(() => {
    if (!viewModel?.isActive || viewModel.vehicles.length === 0) {
      return { type: 'FeatureCollection' as const, features: [] };
    }

    const features = viewModel.vehicles
      .map((vehicle) => {
        const mapboxCoords = viewModel.getMapboxCoordinates(vehicle);
        if (!mapboxCoords || mapboxCoords[0] === 0 || mapboxCoords[1] === 0) return null;

        const id = vehicle.id;
        const rawHeading = headingFromApi(vehicle.heading);
        const moving = isVehicleMoving(vehicle.speed);

        // use last value if current heading is unavailable
        const prev = lastHeadingRef.current.get(id);

        // If heading is unavailable and we have a previous stable one, keep it; otherwise default to 0.
        const candidate = rawHeading ?? prev ?? 0;

        // Update the stable value (only moves when actually moving + delta large enough)
        const stable = snapDeg(
          nextStableHeading(prev, candidate, moving, /*minDelta*/ 10, /*alpha*/ 0.25),
          5
        );

        // store back for next render
        lastHeadingRef.current.set(id, stable);

        return {
          type: 'Feature' as const,
          id,
          properties: {
            id,
            // KEY: always use the stable heading, even when stopped
            heading: stable,
            moving,
            type: 'sdsm-vehicle'
          },
          geometry: { type: 'Point' as const, coordinates: mapboxCoords }
        };
      })
      .filter((f): f is NonNullable<typeof f> => f !== null);

    if (__DEV__) {
      console.log(`🚗 Rendering ${features.length} SDSM vehicles`);
    }

    return { type: 'FeatureCollection' as const, features };
  }, [viewModel, viewModel?.isActive, viewModel?.vehicles]);

  if (vehicleGeoJSON.features.length === 0) return null;

  return (
    <>
      <MapboxGL.Images
        images={{ 'vehicle-icon': require('../../../../../assets/images/bluecar.png') }}
      />

      <MapboxGL.ShapeSource id="sdsm-vehicles-source" shape={vehicleGeoJSON}>
        <MapboxGL.SymbolLayer
          id="sdsm-vehicles-layer"
          style={{
            iconImage: 'vehicle-icon',
            iconSize: 0.15,
            iconRotate: ['get', 'heading'],
            iconRotationAlignment: 'map', // keep orientation relative to map north
            iconAllowOverlap: true,
            iconIgnorePlacement: true,
          }}
        />
      </MapboxGL.ShapeSource>
    </>
  );
});
