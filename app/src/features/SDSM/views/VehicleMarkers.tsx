// app/src/features/SDSM/views/VehicleMarkers.tsx
import React, { useMemo } from 'react';
import MapboxGL from '@rnmapbox/maps';
import { observer } from 'mobx-react-lite';
import { VehicleDisplayViewModel } from '../viewmodels/VehicleDisplayViewModel';

interface VehicleMarkersProps {
  viewModel: VehicleDisplayViewModel;
}

export const VehicleMarkers: React.FC<VehicleMarkersProps> = observer(({ viewModel }) => {
  const vehicleGeoJSON = useMemo(() => {
    if (!viewModel?.isActive || viewModel.vehicles.length === 0) {
      return { type: 'FeatureCollection' as const, features: [] };
    }

    const features = viewModel.vehicles
      .map((vehicle) => {
        const mapboxCoords = viewModel.getMapboxCoordinates(vehicle);
        if (!mapboxCoords || mapboxCoords[0] === 0 || mapboxCoords[1] === 0) return null;

        return {
          type: 'Feature' as const,
          id: vehicle.id,
          properties: {
            id: vehicle.id,
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
            iconAllowOverlap: true,
            iconIgnorePlacement: true,
          }}
        />
      </MapboxGL.ShapeSource>
    </>
  );
});