// app/src/features/SDSM/views/SimpleCSVTesting.tsx
// Simple CSV reader and plotter for vehicles (blue) and VRUs (red)

import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import MapboxGL from '@rnmapbox/maps';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system';

interface CSVDataPoint {
  type: 'vehicle' | 'vru';
  latitude: number;
  longitude: number;
  id: string; // Changed to string to support unique composite IDs
}

export const SimpleCSVTesting: React.FC = () => {
  const [dataPoints, setDataPoints] = useState<CSVDataPoint[]>([]);

  useEffect(() => {
    loadCSVData();
  }, []);

  const loadCSVData = async () => {
    try {
      // Load the CSV file as an asset
      const asset = Asset.fromModule(require('../../../../../assets/data/sdsm_data2.csv'));
      await asset.downloadAsync();

      // Read the CSV content
      const csvContent = await FileSystem.readAsStringAsync(asset.localUri || asset.uri);
      
      // Parse CSV
      const lines = csvContent.trim().split('\n');
      const header = lines[0].split(',');
      
      // Find column indices based on actual CSV structure
      const typeIndex = header.findIndex((col: string) => col.toLowerCase() === 'type');
      const latIndex = header.findIndex((col: string) => col === 'location.coordinates[0]');
      const lngIndex = header.findIndex((col: string) => col === 'location.coordinates[1]');
      const idIndex = header.findIndex((col: string) => col.toLowerCase() === 'objectid');

      const points: CSVDataPoint[] = [];

      // Parse data rows
      for (let i = 1; i < lines.length; i++) {
        const row = lines[i].split(',');
        
        const type = row[typeIndex]?.trim();
        const latitude = parseFloat(row[latIndex]);
        const longitude = parseFloat(row[lngIndex]);
        const id = parseInt(row[idIndex]) || i;

        // Validate data
        if ((type === 'vehicle' || type === 'vru') &&
            !isNaN(latitude) && !isNaN(longitude) &&
            latitude !== 0 && longitude !== 0) {

          points.push({
            type: type as 'vehicle' | 'vru',
            latitude,
            longitude,
            id: `${id}-${i}` // Make ID unique by combining objectID with row index
          });
        }
      }

      setDataPoints(points);
      console.log(`Loaded ${points.length} data points`);
      console.log(`Vehicles: ${points.filter(p => p.type === 'vehicle').length}`);
      console.log(`VRUs: ${points.filter(p => p.type === 'vru').length}`);

    } catch (error) {
      console.error('Failed to load CSV:', error);
    }
  };

  if (dataPoints.length === 0) {
    return null;
  }

  return (
    <>
      {dataPoints.map((point) => (
        <MapboxGL.PointAnnotation
          key={`csv-${point.type}-${point.id}`}
          id={`csv-${point.type}-${point.id}`}
          coordinate={[point.longitude, point.latitude]} // [lng, lat] for Mapbox
          anchor={{ x: 0.5, y: 0.5 }}
        >
          <View style={[
            styles.dot,
            point.type === 'vehicle' ? styles.vehicleDot : styles.vruDot
          ]} />
        </MapboxGL.PointAnnotation>
      ))}
    </>
  );
};

const styles = StyleSheet.create({
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  vehicleDot: {
    backgroundColor: '#2563EB', // Blue for vehicles
  },
  vruDot: {
    backgroundColor: '#DC2626', // Red for VRUs
  },
});