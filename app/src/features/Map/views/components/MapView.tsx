// app/src/features/Map/views/components/MapView.tsx
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MapboxGL from '@rnmapbox/maps';
import { observer } from 'mobx-react-lite';
import * as Location from 'expo-location';
import { MapViewModel } from '../../viewmodels/MapViewModel';
import { DriverViewModel } from '../../../DriverView/models/DriverViewModel';
import { PedestrianDetectorViewModel } from '../../../PedestrianDetector/viewmodels/PedestrianDetectorViewModel';
import { 
  CROSSWALK_CENTER, 
  CROSSWALK_POLYGON_COORDS 
} from '../../../Crosswalk/constants/CrosswalkCoordinates';

interface MapViewProps {
  mapViewModel: MapViewModel;
  driverViewModel: DriverViewModel;
  pedestrianDetectorViewModel: PedestrianDetectorViewModel;
  children?: React.ReactNode;
}

export const MapViewComponent: React.FC<MapViewProps> = observer(({ 
  mapViewModel,
  driverViewModel,
  pedestrianDetectorViewModel,
  children 
}) => {
  const mapRef = useRef<MapboxGL.MapView>(null);
  const cameraRef = useRef<MapboxGL.Camera>(null);
  
  // Request location permissions and start tracking
  useEffect(() => {
    let locationSubscription: Location.LocationSubscription;
    
    const setupLocationTracking = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          console.log('Location permission denied');
          return;
        }
        
        console.log('Starting location tracking');
        
        // Start watching position
        locationSubscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Highest,
            distanceInterval: 5,  // Update every 5 meters
            timeInterval: 1000    // Or every 1 second
          },
          (location) => {
            const { latitude, longitude } = location.coords;
            
            // Update the vehicle position in the pedestrian detector
            pedestrianDetectorViewModel.setVehiclePosition([latitude, longitude]);
            
            console.log(`Location updated: [${latitude}, ${longitude}]`);
          }
        );
        
        // Start monitoring for pedestrians
        pedestrianDetectorViewModel.startMonitoring();
        
      } catch (error) {
        console.error('Error setting up location:', error);
      }
    };
    
    setupLocationTracking();
    
    // Cleanup
    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
      pedestrianDetectorViewModel.stopMonitoring();
    };
  }, [pedestrianDetectorViewModel]);

  // Get positions from the viewModel
  const pedestrianPosition = pedestrianDetectorViewModel.pedestrianPosition;
  const vehiclePosition = pedestrianDetectorViewModel.vehiclePosition;
  
  // Convert for MapboxGL (which uses [lon, lat])
  const pedestrianPositionMapbox: [number, number] = [pedestrianPosition[1], pedestrianPosition[0]];
  const vehiclePositionMapbox: [number, number] = [vehiclePosition[1], vehiclePosition[0]];

  // Create GeoJSON for crosswalk polygon
  const crosswalkPolygon = {
    type: "Feature" as const,
    properties: {},
    geometry: {
      type: "Polygon" as const,
      coordinates: [CROSSWALK_POLYGON_COORDS]
    }
  };

  return (
    <View style={styles.container}>
      <MapboxGL.MapView 
        ref={mapRef}
        style={styles.map} 
        styleURL="mapbox://styles/mapbox/streets-v12"
        logoEnabled={false}
        attributionEnabled={false}
        compassEnabled={false}
      >
        <MapboxGL.Camera 
          ref={cameraRef}
          followUserLocation={true}
          followZoomLevel={18}
        />

        {/* User location from Mapbox */}
        <MapboxGL.UserLocation
          visible={true}
          showsUserHeadingIndicator={true}
        />
        {/* Custom marker for user's position (vehicle) */}
{vehiclePosition[0] !== 0 && vehiclePosition[1] !== 0 && (
  <MapboxGL.PointAnnotation
    id="vehicle-marker"
    coordinate={[vehiclePosition[1], vehiclePosition[0]]} // Convert to [lon, lat]
    anchor={{x: 0.5, y: 0.5}}
  >
    <View style={styles.vehicleMarker}>
      <View style={styles.vehicleMarkerInner} />
    </View>
  </MapboxGL.PointAnnotation>
)}

        {/* Draw the crosswalk polygon */}
        <MapboxGL.ShapeSource id="crosswalk-polygon-source" shape={crosswalkPolygon}>
          <MapboxGL.FillLayer 
            id="crosswalk-polygon-fill" 
            style={{
              fillColor: pedestrianDetectorViewModel.pedestriansInCrosswalk > 0 ? 
                'rgba(255, 59, 48, 0.4)' : 'rgba(255, 255, 0, 0.4)',
              fillOutlineColor: '#FFCC00'
            }} 
          />
          <MapboxGL.LineLayer 
            id="crosswalk-polygon-outline" 
            style={{
              lineColor: '#FFCC00',
              lineWidth: 2
            }} 
          />
        </MapboxGL.ShapeSource>
        
        {/* Display fixed pedestrian */}
        <MapboxGL.PointAnnotation
          id="pedestrian-fixed"
          coordinate={pedestrianPositionMapbox}
          anchor={{x: 0.5, y: 0.5}}
        >
          <View style={styles.pedestrianMarker}>
            <View style={styles.markerInner} />
          </View>
        </MapboxGL.PointAnnotation>
        
        {children}
      </MapboxGL.MapView>
      
      {/* Warning message - ONLY shows when BOTH conditions are met */}
      {pedestrianDetectorViewModel.pedestriansInCrosswalk > 0 && 
       pedestrianDetectorViewModel.isVehicleNearPedestrian && (
        <View style={styles.warningContainer}>
          <Text style={styles.warningText}>
            Pedestrian is crossing the crosswalk!
          </Text>
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  // Add to the styles object:
vehicleMarker: {
  width: 24,
  height: 24,
  borderRadius: 12,
  backgroundColor: '#4285F4', // Blue
  borderWidth: 2,
  borderColor: 'white',
  justifyContent: 'center',
  alignItems: 'center',
},
vehicleMarkerInner: {
  width: 12,
  height: 12,
  borderRadius: 6,
  backgroundColor: '#2196F3',
},
  pedestrianMarker: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FF9800', // Orange
    borderWidth: 2,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  markerInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'white',
  },
  warningContainer: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 59, 48, 0.9)',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  warningText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
  }
});