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
  
  // GPS tracking setup
  useEffect(() => {
    let locationSubscription: Location.LocationSubscription;
    let updateCount = 0;
    
    const setupLocationTracking = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          console.log('Location permission denied');
          return;
        }
        
        console.log('Starting GPS tracking for turn guidance');
        
        locationSubscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            distanceInterval: 1,
            timeInterval: 500
          },
          (location) => {
            updateCount++;
            const { latitude, longitude } = location.coords;
            
            // Log every 10th update to avoid spam
            if (updateCount % 10 === 1) {
              console.log(`GPS: [${latitude.toFixed(6)}, ${longitude.toFixed(6)}] (Update #${updateCount})`);
            }
            
            // Update DirectionGuide with live GPS
            directionGuideViewModel.setVehiclePosition([latitude, longitude]);
            
            // Update other components
            if (activeDetector && 'setVehiclePosition' in activeDetector) {
              activeDetector.setVehiclePosition([latitude, longitude]);
            }
            
            // Update map for blue marker
            mapViewModel.setUserLocation({
              latitude,
              longitude,
              heading: location.coords.heading || undefined
            });
          }
        );
        
        // Start pedestrian monitoring
        if (activeDetector && 'startMonitoring' in activeDetector) {
          activeDetector.startMonitoring();
        }
        
        console.log('GPS tracking started successfully');
        
      } catch (error) {
        console.error('GPS setup error:', error);
      }
    };
    
    setupLocationTracking();
    
    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
      if (activeDetector && 'stopMonitoring' in activeDetector) {
        activeDetector.stopMonitoring();
      }
    };
  }, [directionGuideViewModel, activeDetector, mapViewModel, isTestingMode]);

  // Get detector data
  const pedestrians = activeDetector?.pedestrians || [];
  const vehiclePosition = activeDetector?.vehiclePosition || [0, 0];
  const pedestriansInCrosswalk = activeDetector?.pedestriansInCrosswalk || 0;
  const isVehicleNearPedestrian = activeDetector?.isVehicleNearPedestrian || false;
  const userLocationCoordinate = mapViewModel.userLocationCoordinate;

  // Crosswalk polygon
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

        {/* Vehicle position marker */}
        {userLocationCoordinate[0] !== 0 && userLocationCoordinate[1] !== 0 && (
          <MapboxGL.PointAnnotation
            id="vehicle-position"
            coordinate={userLocationCoordinate}
            anchor={{x: 0.5, y: 0.5}}
          >
            <View style={[
              styles.userLocationMarker, 
              isTestingMode ? styles.testingMarker : {}
            ]}>
              <View style={styles.userLocationInner} />
            </View>
          </MapboxGL.PointAnnotation>
        )}

        {/* Crosswalk polygon */}
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
        
        {/* Pedestrian markers */}
        {pedestrians.map((pedestrian) => (
          <MapboxGL.PointAnnotation
            key={`pedestrian-${pedestrian.id}`}
            id={`pedestrian-${pedestrian.id}`}
            coordinate={[pedestrian.coordinates[1], pedestrian.coordinates[0]]}
            anchor={{x: 0.5, y: 0.5}}
          >
            <View style={styles.pedestrianMarker}>
              <View style={styles.markerInner} />
            </View>
          </MapboxGL.PointAnnotation>
        ))}
        
        {children}
      </MapboxGL.MapView>
      
      {/* Testing mode indicator */}
      {isTestingMode && (
        <View style={styles.testingIndicator}>
          <Text style={styles.testingText}>🧪 TESTING MODE</Text>
        </View>
      )}
      
      {/* Turn guidance UI */}
      <TurnGuideDisplay directionGuideViewModel={directionGuideViewModel} />
      
      {/* Pedestrian warning */}
      {pedestriansInCrosswalk > 0 && isVehicleNearPedestrian && (
        <View style={[styles.warningContainer, isTestingMode ? styles.testingWarning : {}]}>
          <Text style={styles.warningText}>
            {isTestingMode ? '🧪 TESTING: ' : ''}Pedestrian crossing detected!
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
  userLocationMarker: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#4285F4',
    borderWidth: 3,
    borderColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  testingMarker: {
    borderColor: '#FF9800',
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
    backgroundColor: '#FF9800',
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
});