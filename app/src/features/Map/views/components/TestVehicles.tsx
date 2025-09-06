// app/src/features/Map/views/components/TestVehicles.tsx
import React from 'react';
import { ShapeSource, SymbolLayer } from '@rnmapbox/maps';

// Configuration and toggle
const ENABLE_TEST_VEHICLES = true; // Toggle flag - set to false to completely disable

interface TestVehicle {
  id: string;
  coordinates: [number, number]; // [longitude, latitude]
  name: string;
}

// Test vehicle data with specified coordinates
const TEST_VEHICLES: TestVehicle[] = [
  {
    id: 'test-vehicle-1',
    coordinates: [-85.3082615, 35.0457707],
    name: 'Test Vehicle 1'
  },
  {
    id: 'test-vehicle-2', 
    coordinates: [-85.3082476, 35.0457707],
    name: 'Test Vehicle 2'
  }
];

interface TestVehiclesProps {
  // No props needed - self-contained component
}

export const TestVehicles: React.FC<TestVehiclesProps> = () => {
  // Early return if test vehicles are disabled
  if (!ENABLE_TEST_VEHICLES) {
    return null;
  }

  // Create GeoJSON FeatureCollection for the test vehicles
  const testVehicleGeoJSON = {
    type: 'FeatureCollection' as const,
    features: TEST_VEHICLES.map((vehicle) => ({
      type: 'Feature' as const,
      id: vehicle.id,
      properties: {
        id: vehicle.id,
        name: vehicle.name,
        type: 'test-vehicle'
      },
      geometry: {
        type: 'Point' as const,
        coordinates: vehicle.coordinates
      }
    }))
  };

  return (
    <ShapeSource
      id="test-vehicles-source"
      shape={testVehicleGeoJSON}
    >
      <SymbolLayer
        id="test-vehicles-layer"
        style={{
          iconImage: 'car-15', // Using Mapbox's built-in car icon
          iconSize: 1.5,
          iconColor: '#FF6B35', // Distinct orange color for test vehicles
          iconAllowOverlap: true,
          iconIgnorePlacement: true,
          textField: ['get', 'name'],
          textFont: ['Open Sans Regular'],
          textSize: 12,
          textColor: '#FFFFFF',
          textHaloColor: '#000000',
          textHaloWidth: 1,
          textOffset: [0, 2],
          textAllowOverlap: true,
          textIgnorePlacement: true
        }}
      />
    </ShapeSource>
  );
};

// Utility functions for external access (if needed)
export const getTestVehicles = (): TestVehicle[] => {
  return ENABLE_TEST_VEHICLES ? TEST_VEHICLES : [];
};

export const isTestVehiclesEnabled = (): boolean => {
  return ENABLE_TEST_VEHICLES;
};

export const getTestVehicleCount = (): number => {
  return ENABLE_TEST_VEHICLES ? TEST_VEHICLES.length : 0;
};