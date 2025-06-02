// app/src/features/Map/views/components/MapView.tsx
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MapboxGL from '@rnmapbox/maps';
import { observer } from 'mobx-react-lite';
import * as Location from 'expo-location';
import { MapViewModel } from '../../viewmodels/MapViewModel';
import { DriverViewModel } from '../../../DriverView/models/DriverViewModel';
import { PedestrianDetectorViewModel } from '../../../PedestrianDetector/viewmodels/PedestrianDetectorViewModel';
import { TestingPedestrianDetectorViewModel } from '../../../../testingFeatures/testingPedestrianDetectorFeatureTest/viewmodels/TestingPedestrianDetectorViewModel';
import { DirectionGuideViewModel } from '../../../DirectionGuide/viewModels/DirectionGuideViewModel';
import { TurnGuideDisplay } from '../../../DirectionGuide/views/components/TurnGuideDisplay';
import { 
  CROSSWALK_CENTER, 
  CROSSWALK_POLYGON_COORDS 
} from '../../../Crosswalk/constants/CrosswalkCoordinates';

interface MapViewProps {
  mapViewModel: MapViewModel;
  driverViewModel: DriverViewModel;
  pedestrianDetectorViewModel?: PedestrianDetectorViewModel | null;
  testingPedestrianDetectorViewModel?: TestingPedestrianDetectorViewModel | null;
  directionGuideViewModel: DirectionGuideViewModel;
  isTestingMode: boolean;
  children?: React.ReactNode;
}

export const MapViewComponent: React.FC<MapViewProps> = observer(({ 
  mapViewModel,
  driverViewModel,
  pedestrianDetectorViewModel,
  testingPedestrianDetectorViewModel,
  directionGuideViewModel,
  isTestingMode,
  children 
}) => {
  const mapRef = useRef<MapboxGL.MapView>(null);
  const cameraRef = useRef<MapboxGL.Camera>(null);
  
  // Get the active detector based on mode
  const activeDetector = isTestingMode ? testingPedestrianDetectorViewModel : pedestrianDetectorViewModel;
  
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
        
        console.log(`🌍 Starting live GPS tracking (${isTestingMode ? 'TESTING' : 'PRODUCTION'} mode)`);
        
        // Start watching position with real GPS
        locationSubscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Highest,
            distanceInterval: 3,  // Update every 3 meters for responsive polygon detection
            timeInterval: 1000    // Or every 1 second
          },
          (location) => {
            const { latitude, longitude } = location.coords;
            
            // 🎯 UPDATE DIRECTION GUIDE WITH REAL GPS POSITION
            directionGuideViewModel.setVehiclePosition([latitude, longitude]);
            
            // Update the vehicle position in the active pedestrian detector
            if (activeDetector && 'setVehiclePosition' in activeDetector) {
              activeDetector.setVehiclePosition([latitude, longitude]);
            }
            
            // Also update the map view model
            mapViewModel.setUserLocation({
              latitude,
              longitude,
              heading: location.coords.heading || undefined
            });
            
            console.log(`📍 GPS Update: [${latitude.toFixed(6)}, ${longitude.toFixed(6)}] - Turn Guide: ${directionGuideViewModel.showTurnGuide ? 'ON' : 'OFF'}`);
          }
        );
        
        // Start monitoring for pedestrians
        if (activeDetector && 'startMonitoring' in activeDetector) {
          activeDetector.startMonitoring();
        }
        
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
      if (activeDetector && 'stopMonitoring' in activeDetector) {
        activeDetector.stopMonitoring();
      }
    };
  }, [activeDetector, directionGuideViewModel, mapViewModel, isTestingMode]);

  // Get data from the active detector
  const pedestrians = activeDetector?.pedestrians || [];
  const vehiclePosition = activeDetector?.vehiclePosition || [0, 0];
  const pedestriansInCrosswalk = activeDetector?.pedestriansInCrosswalk || 0;
  const isVehicleNearPedestrian = activeDetector?.isVehicleNearPedestrian || false;
  const userLocationCoordinate = mapViewModel.userLocationCoordinate;

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
          centerCoordinate={userLocationCoordinate}
          zoomLevel={18}
          animationDuration={1000}
        />

        {/* 🚗 Real GPS User Location Marker (Blue Marker) */}
        {userLocationCoordinate[0] !== 0 && userLocationCoordinate[1] !== 0 && (
          <MapboxGL.PointAnnotation
            id="user-location"
            coordinate={userLocationCoordinate}
            anchor={{x: 0.5, y: 0.5}}
          >
            <View style={[styles.userLocationMarker, isTestingMode ? styles.testingMarker : {}]}>
              <View style={styles.userLocationInner} />
            </View>
          </MapboxGL.PointAnnotation>
        )}

        {/* Draw the crosswalk polygon */}
        <MapboxGL.ShapeSource id="crosswalk-polygon-source" shape={crosswalkPolygon}>
          <MapboxGL.FillLayer 
            id="crosswalk-polygon-fill" 
            style={{
              fillColor: pedestriansInCrosswalk > 0 ? 
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
        
        {/* Display all real pedestrians from SDSM data */}
        {pedestrians.map((pedestrian) => (
          <MapboxGL.PointAnnotation
            key={`pedestrian-${pedestrian.id}`}
            id={`pedestrian-${pedestrian.id}`}
            coordinate={[pedestrian.coordinates[1], pedestrian.coordinates[0]]} // Convert [lat, lon] to [lon, lat]
            anchor={{x: 0.5, y: 0.5}}
          >
            <View style={styles.pedestrianMarker}>
              <View style={styles.markerInner} />
            </View>
          </MapboxGL.PointAnnotation>
        ))}
        
        {children}
      </MapboxGL.MapView>
      
      {/* Mode indicator */}
      {isTestingMode && (
        <View style={styles.testingIndicator}>
          <Text style={styles.testingText}>🧪 TESTING MODE (30m)</Text>
        </View>
      )}
      
      {/* 🎯 REAL GPS TURN GUIDE DISPLAY - Shows when vehicle enters polygon */}
      <TurnGuideDisplay directionGuideViewModel={directionGuideViewModel} />
      
      {/* Warning message - ONLY shows when BOTH conditions are met */}
      {pedestriansInCrosswalk > 0 && isVehicleNearPedestrian && (
        <View style={[styles.warningContainer, isTestingMode ? styles.testingWarning : {}]}>
          <Text style={styles.warningText}>
            {isTestingMode ? '🧪 TESTING: ' : ''}Pedestrian is crossing the crosswalk!
          </Text>
          {isTestingMode && (
            <Text style={styles.testingSubtext}>
              (30-meter threshold active)
            </Text>
          )}
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
  userLocationMarker: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#4285F4', // Blue
    borderWidth: 3,
    borderColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  testingMarker: {
    borderColor: '#FF9800', // Orange border for testing mode
    borderWidth: 4,
  },
  userLocationInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'white',
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
  testingIndicator: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(255, 152, 0, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    elevation: 3,
  },
  testingText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
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
  testingWarning: {
    borderWidth: 2,
    borderColor: '#FF9800',
  },
  warningText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
  },
  testingSubtext: {
    color: '#FFDD44',
    fontWeight: 'bold',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
});