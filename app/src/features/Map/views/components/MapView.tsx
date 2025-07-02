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
import { TestingVehicleDisplayViewModel } from '../../../../testingFeatures/testingVehicleDisplay/viewmodels/TestingVehicleDisplayViewModel';
import { DirectionGuideViewModel } from '../../../DirectionGuide/viewModels/DirectionGuideViewModel';
import { TurnGuideDisplay } from '../../../DirectionGuide/views/components/TurnGuideDisplay';
import { SpatStatusDisplay } from '../../../SpatService/views/SpatStatusDisplay';
import { SimpleLine } from '../../../PedestrianDetector/views/components/SimpleLine';
import { VehicleMarkers } from '../../../../testingFeatures/testingVehicleDisplay/views/components/VehicleMarker';
import { TestingModeOverlay } from '../../../../testingFeatures/testingUI';
import { 
  CROSSWALK_CENTER, 
  CROSSWALK_POLYGON_COORDS 
} from '../../../Crosswalk/constants/CrosswalkCoordinates';

interface MapViewProps {
  mapViewModel: MapViewModel;
  driverViewModel: DriverViewModel;
  pedestrianDetectorViewModel?: PedestrianDetectorViewModel | null;
  testingPedestrianDetectorViewModel?: TestingPedestrianDetectorViewModel | null;
  testingVehicleDisplayViewModel: TestingVehicleDisplayViewModel | null;
  directionGuideViewModel: DirectionGuideViewModel;
  isTestingMode: boolean;
  children?: React.ReactNode;
}

export const MapViewComponent: React.FC<MapViewProps> = observer(({ 
  mapViewModel,
  driverViewModel,
  pedestrianDetectorViewModel,
  testingPedestrianDetectorViewModel,
  testingVehicleDisplayViewModel,
  directionGuideViewModel,
  isTestingMode,
  children 
}) => {
  const mapRef = useRef<MapboxGL.MapView>(null);
  const cameraRef = useRef<MapboxGL.Camera>(null);
  
  // Get the active detector based on mode
  const activeDetector = isTestingMode ? testingPedestrianDetectorViewModel : pedestrianDetectorViewModel;
  
  // Line coordinates for lane visualization
  const lineCoordinates: [number, number][] = [
    [-85.2922264, 35.0397893],
    [-85.2941284, 35.0404962]
  ];
  
  // GPS tracking setup
  useEffect(() => {
    let locationSubscription: Location.LocationSubscription;
    let updateCount = 0;
    
    const setupLocationTracking = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          return;
        }
        
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

        {/* Vehicle position marker - clean blue marker without testing radius */}
        {userLocationCoordinate[0] !== 0 && userLocationCoordinate[1] !== 0 && (
          <MapboxGL.PointAnnotation
            id="vehicle-position"
            coordinate={userLocationCoordinate}
            anchor={{x: 0.5, y: 0.5}}
          >
            <View style={styles.userLocationMarker}>
              <View style={styles.userLocationInner} />
            </View>
          </MapboxGL.PointAnnotation>
        )}

        {/* Crosswalk polygon - conditionally rendered based on toggle */}
        {mapViewModel.showCrosswalkPolygon && (
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
        )}

        {/* Simple Blue Line */}
        <SimpleLine 
          coordinates={lineCoordinates} 
          lineColor="#0066FF" 
          lineWidth={3} 
        />

        {/* Live Vehicle Markers from SDSM (conditionally rendered) */}
        {testingVehicleDisplayViewModel && (
          <VehicleMarkers viewModel={testingVehicleDisplayViewModel} />
        )}
        
        {/* Pedestrian markers - single consistent color */}
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
      
      {/* Testing mode overlay - separated into its own component */}
      <TestingModeOverlay 
        isTestingMode={isTestingMode}
        testingVehicleDisplayViewModel={testingVehicleDisplayViewModel}
      />
      
      {/* SPaT status display */}
      <SpatStatusDisplay directionGuideViewModel={directionGuideViewModel} />
      
      {/* Turn guidance UI */}
      <TurnGuideDisplay directionGuideViewModel={directionGuideViewModel} />
      
      {/* Pedestrian warning - clean without testing indicators */}
      {pedestriansInCrosswalk > 0 && isVehicleNearPedestrian && (
        <View style={styles.warningContainer}>
          <Text style={styles.warningText}>
            Pedestrian crossing detected!
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
    backgroundColor: '#FF6B35', // Single consistent orange color
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
  },
  warningText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
  },
});