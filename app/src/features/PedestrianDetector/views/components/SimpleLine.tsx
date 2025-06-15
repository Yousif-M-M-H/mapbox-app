// app/src/features/PedestrianDetector/views/components/SimpleLine.tsx
import React from 'react';
import MapboxGL from '@rnmapbox/maps';

interface SimpleLineProps {
  coordinates: [number, number][]; // [longitude, latitude] format
  lineColor?: string;
  lineWidth?: number;
}

export const SimpleLine: React.FC<SimpleLineProps> = ({ 
  coordinates, 
  lineColor = '#0066FF', // Blue color
  lineWidth = 3 
}) => {
  // Create GeoJSON LineString
  const lineGeoJSON = {
    type: "Feature" as const,
    properties: {},
    geometry: {
      type: "LineString" as const,
      coordinates: coordinates // Already in [lng, lat] format
    }
  };

  return (
    <MapboxGL.ShapeSource id="simple-line-source" shape={lineGeoJSON}>
      <MapboxGL.LineLayer 
        id="simple-line-layer" 
        style={{
          lineColor: lineColor,
          lineWidth: lineWidth,
          lineCap: 'round',
          lineJoin: 'round'
        }} 
      />
    </MapboxGL.ShapeSource>
  );
};