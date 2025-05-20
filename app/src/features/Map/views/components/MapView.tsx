// app/src/features/Map/views/components/MapView.tsx
import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import MapboxGL from '@rnmapbox/maps';
import { observer } from 'mobx-react-lite';
import * as Location from 'expo-location';
import { MapViewModel } from '../../viewmodels/MapViewModel';
import { DriverViewModel } from '../../../DriverView/models/DriverViewModel';
import { PedestrianDetectorViewModel } from '../../../PedestrianDetector/viewmodels/PedestrianDetectorViewModel';
import { CROSSWALK_POLYGON_COORDS } from '../../../Crosswalk/constants/CrosswalkCoordinates';

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
  // State to store user's current position
  const [userPosition, setUserPosition] = useState<[number, number] | null>(null);
  
  // Request location permissions and start tracking location
  useEffect(() => {
    let locationSubscription: Location.LocationSubscription;
    
    const startLocationTracking = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        
        if (status !== 'granted') {
          console.log('Location permission denied');
          return;
        }
        
        console.log('Location permission granted, starting tracking');
        
        // Get initial location
        const initialLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Highest
        });
        
        const { longitude, latitude } = initialLocation.coords;
        console.log(`Initial location: [${latitude}, ${longitude}]`);
        
        // Store position in [longitude, latitude] format for Mapbox
        setUserPosition([longitude, latitude]);
        
        // Start watching for location updates
        locationSubscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Highest,
            distanceInterval: 5, // Update every 5 meters
            timeInterval: 1000  // or every 1 second
          },
          (location) => {
            const { longitude, latitude } = location.coords;
            console.log(`Updated location: [${latitude}, ${longitude}]`);
            
            // Update state with new position
            setUserPosition([longitude, latitude]);
          }
        );
      } catch (error) {
        console.error('Error setting up location tracking:', error);
      }
    };
    
    startLocationTracking();
    
    // Cleanup
    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, []);

  // Get positions from the viewModel
  const pedestrianPosition = pedestrianDetectorViewModel.pedestrianPosition;
  
  // Convert for MapboxGL (which uses [lon, lat])
  const pedestrianPositionMapbox: [number, number] = [pedestrianPosition[1], pedestrianPosition[0]];

  // Create GeoJSON for crosswalk polygon
  const crosswalkPolygon = {
    type: "Feature" as const,
    properties: {},
    geometry: {
      type: "Polygon" as const,
      coordinates: [CROSSWALK_POLYGON_COORDS]
    }
  };

  // If we have a user position, update the camera
  useEffect(() => {
    if (cameraRef.current && userPosition) {
      cameraRef.current.setCamera({
        centerCoordinate: userPosition,
        zoomLevel: 17,
        animationDuration: 1000,
      });
    }
  }, [userPosition]);

  return (
    <View style={styles.container}>
      <MapboxGL.MapView 
        ref={mapRef}
        style={styles.map} 
        styleURL="mapbox://styles/mapbox/streets-v12"
        logoEnabled={false}
        attributionEnabled={false}
        compassEnabled={true}
      >
        <MapboxGL.Camera 
          ref={cameraRef}
          zoomLevel={17}
        />

        {/* Standard Mapbox user location */}
        <MapboxGL.UserLocation
          visible={true}
          showsUserHeadingIndicator={true}
          minDisplacement={1}
        />
        
        {/* Custom user marker as a fallback */}
        {userPosition && (
          <MapboxGL.PointAnnotation
            id="user-marker"
            coordinate={userPosition}
            anchor={{x: 0.5, y: 0.5}}
          >
            <View style={styles.userMarker}>
              <View style={styles.userMarkerInner} />
            </View>
          </MapboxGL.PointAnnotation>
        )}

        {/* Draw the crosswalk polygon */}
        <MapboxGL.ShapeSource id="crosswalk-polygon-source" shape={crosswalkPolygon}>
          <MapboxGL.FillLayer 
            id="crosswalk-polygon-fill" 
            style={{
              fillColor: 'rgba(255, 255, 0, 0.4)',
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
  userMarker: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#1E88E5', // Blue
    borderWidth: 2,
    borderColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userMarkerInner: {
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
  }
});