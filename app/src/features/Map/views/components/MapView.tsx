// app/src/features/Map/views/components/MapView.tsx
// OPTIMIZED VERSION - Fixed GPS accuracy and smoothness

import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MapboxGL from '@rnmapbox/maps';
import { observer } from 'mobx-react-lite';
import * as Location from 'expo-location';
import { MapViewModel } from '../../viewmodels/MapViewModel';
import { PedestrianDetectorViewModel } from '../../../PedestrianDetector/viewmodels/PedestrianDetectorViewModel';
import { TestingPedestrianDetectorViewModel } from '../../../../testingFeatures/testingPedestrianDetectorFeatureTest/viewmodels/TestingPedestrianDetectorViewModel';
import { VehicleDisplayViewModel } from '../../../SDSM/viewmodels/VehicleDisplayViewModel';
import { DirectionGuideViewModel } from '../../../DirectionGuide/viewModels/DirectionGuideViewModel';
import { TurnGuideDisplay } from '../../../DirectionGuide/views/components/TurnGuideDisplay';
import { SpatStatusDisplay } from '../../../SpatService/views/SpatStatusDisplay';
import { SpatViewModel } from '../../../SpatService/viewModels/SpatViewModel';
import { VehicleMarkers } from '../../../SDSM/views/VehicleMarkers';
import { VRUMarkers } from '../../../SDSM/views/VRUMarkers';
import { TestingModeOverlay } from '../../../../testingFeatures/testingUI';
import { LaneOverlay } from '../../../Lanes/views/components/LaneOverlay';
import { LanesViewModel } from '../../../Lanes/viewmodels/LanesViewModel';
import { CROSSWALK_POLYGONS } from '../../../Crosswalk/constants/CrosswalkCoordinates';
import { CrosswalkDetectionService } from '../../../PedestrianDetector/services/CrosswalkDetectionService';
import { ProximityDetectionService } from '../../../PedestrianDetector/services/ProximityDetectionService';
import { TESTING_CONFIG } from '../../../../testingFeatures/TestingConfig';
import { MainViewModel } from '../../../../Main/viewmodels/MainViewModel';
import { MapLegend } from './MapLegend';

interface MapViewProps {
  mapViewModel: MapViewModel;
  pedestrianDetectorViewModel?: PedestrianDetectorViewModel | null;
  testingPedestrianDetectorViewModel?: TestingPedestrianDetectorViewModel | null;
  testingVehicleDisplayViewModel: VehicleDisplayViewModel | null;
  directionGuideViewModel: DirectionGuideViewModel;
  isTestingMode: boolean;
  mainViewModel?: MainViewModel;
  children?: React.ReactNode;
}

export const MapViewComponent: React.FC<MapViewProps> = observer(({
  mapViewModel,
  pedestrianDetectorViewModel,
  testingPedestrianDetectorViewModel,
  testingVehicleDisplayViewModel,
  directionGuideViewModel,
  isTestingMode,
  mainViewModel,
  children
}) => {
  const mapRef = useRef<MapboxGL.MapView>(null);
  const cameraRef = useRef<MapboxGL.Camera>(null);

  const spatViewModel = useRef(new SpatViewModel()).current;

  // Single source of truth for user position
  const [userPosition, setUserPosition] = useState<[number, number]>([
    mapViewModel.userLocation.latitude, 
    mapViewModel.userLocation.longitude
  ]);

  const activeDetector = isTestingMode ? testingPedestrianDetectorViewModel : pedestrianDetectorViewModel;

  const SHOW_SDSM_VEHICLES = true;

  const lanesViewModel = useRef(new LanesViewModel()).current;

  const shouldShowSDSMForViewModel = (viewModel: VehicleDisplayViewModel): boolean => {
    if (!SHOW_SDSM_VEHICLES || !TESTING_CONFIG.ENABLE_SDSM_API) {
      return false;
    }
    return true;
  };

  // ========================================
  // MINIMAL SMOOTHING (Only for poor GPS)
  // ========================================
  const lastValidPosition = useRef<[number, number]>([0, 0]);

  const applyMinimalSmoothing = (
    newPosition: [number, number], 
    accuracy: number
  ): [number, number] => {
    // If no previous position, use new position
    if (lastValidPosition.current[0] === 0) {
      lastValidPosition.current = newPosition;
      return newPosition;
    }

    // For very poor accuracy (>15m), blend 70% new, 30% old
    // This is MUCH less aggressive than the previous weighted average
    const blend = accuracy > 25 ? 0.7 : 0.85;
    
    const smoothed: [number, number] = [
      newPosition[0] * blend + lastValidPosition.current[0] * (1 - blend),
      newPosition[1] * blend + lastValidPosition.current[1] * (1 - blend)
    ];

    lastValidPosition.current = smoothed;
    return smoothed;
  };

  // ========================================
  // BATCHED VIEWMODEL UPDATES
  // ========================================
  const updateAllViewModels = (position: [number, number]) => {
    // Update all ViewModels in a single batch
    directionGuideViewModel.setVehiclePosition(position);
    spatViewModel.setUserPosition(position);
    
    if (activeDetector && 'setVehiclePosition' in activeDetector) {
      activeDetector.setVehiclePosition(position);
    }

    mapViewModel.setUserLocation({
      latitude: position[0],
      longitude: position[1],
      heading: undefined
    });
  };

  // ========================================
  // OPTIMIZED GPS TRACKING
  // ========================================
  useEffect(() => {
    let locationSubscription: Location.LocationSubscription;

    const setupLocationTracking = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          return;
        }

        locationSubscription = await Location.watchPositionAsync(
          {
            // OPTIMIZED: Best accuracy without over-polling
            accuracy: Location.Accuracy.BestForNavigation,
            distanceInterval: 2, // Changed from 0.5 to 2 meters (reasonable movement threshold)
            timeInterval: 500    // Changed from 250ms to 500ms (2 updates/sec is smooth enough)
          },
          (location) => {
            const { latitude, longitude, accuracy } = location.coords;

            // CRITICAL FIX: Use raw GPS coordinates directly
            // Modern GPS is accurate enough - smoothing causes lag and position shifts
            const newPosition: [number, number] = [latitude, longitude];

            // Only apply minimal smoothing for very poor accuracy
            const finalPosition = accuracy && accuracy > 15 
              ? applyMinimalSmoothing(newPosition, accuracy)
              : newPosition;

            // Single state update
            setUserPosition(finalPosition);

            // Batch all ViewModel updates together
            updateAllViewModels(finalPosition);
          }
        );

        // Start monitoring
        if (activeDetector && 'startMonitoring' in activeDetector) {
          activeDetector.startMonitoring();
        }
        spatViewModel.startMonitoring();

      } catch (error) {
        console.error('Location tracking error:', error);
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
      spatViewModel.cleanup();
    };
  }, [directionGuideViewModel, activeDetector, mapViewModel, isTestingMode, spatViewModel]);

  // ========================================
  // VRU DATA UPDATES
  // ========================================
  useEffect(() => {
    if (!activeDetector) return;

    let allVRUs: any[] = [];

    if (TESTING_CONFIG.ENABLE_SDSM_API) {
      const vehicleDisplayVM = mainViewModel?.vehicleDisplayViewModel || testingVehicleDisplayViewModel;
      if (vehicleDisplayVM?.vrus) {
        if (shouldShowSDSMForViewModel(vehicleDisplayVM)) {
          allVRUs = [...allVRUs, ...vehicleDisplayVM.vrus];
        }
      }
    }

    if (TESTING_CONFIG.SHOW_FIXED_PEDESTRIAN && testingPedestrianDetectorViewModel?.vrus) {
      allVRUs = [...allVRUs, ...testingPedestrianDetectorViewModel.vrus];
    }

    activeDetector.updateVRUData(allVRUs);
  }, [
    activeDetector,
    mainViewModel?.vehicleDisplayViewModel?.vrus,
    testingVehicleDisplayViewModel?.vrus,
    testingPedestrianDetectorViewModel?.vrus,
    TESTING_CONFIG.ENABLE_SDSM_API,
    TESTING_CONFIG.SHOW_FIXED_PEDESTRIAN
  ]);

  return (
    <View style={styles.container}>
      <MapLegend />

      <MapboxGL.MapView
        ref={mapRef}
        style={styles.map}
        styleURL="mapbox://styles/mapbox/outdoors-v12"
        logoEnabled={false}
        attributionEnabled={false}
        compassEnabled={false}
        rotateEnabled={true}
        scrollEnabled={true}
        pitchEnabled={true}
        zoomEnabled={true}
      >
        <MapboxGL.Camera
          ref={cameraRef}
          centerCoordinate={[-85.3075, 35.0454]}
          zoomLevel={16}
          animationDuration={300}
        />

        {/* User Position Marker - Simple Blue Dot */}
        {userPosition[0] !== 0 && userPosition[1] !== 0 && (
          <MapboxGL.PointAnnotation
            id="vehicle-position"
            coordinate={[userPosition[1], userPosition[0]]}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View style={styles.userLocationMarker}>
              <View style={styles.userLocationInner} />
            </View>
          </MapboxGL.PointAnnotation>
        )}

        {/* Crosswalk Polygons */}
        {mapViewModel.showCrosswalkPolygon && CROSSWALK_POLYGONS.map((polygonCoords, index) => {
          let allVRUs: any[] = [];

          if (TESTING_CONFIG.ENABLE_SDSM_API) {
            const vehicleDisplayVM = mainViewModel?.vehicleDisplayViewModel || testingVehicleDisplayViewModel;
            if (vehicleDisplayVM?.vrus && shouldShowSDSMForViewModel(vehicleDisplayVM)) {
              allVRUs = [...allVRUs, ...vehicleDisplayVM.vrus];
            }
          }

          if (TESTING_CONFIG.SHOW_FIXED_PEDESTRIAN && testingPedestrianDetectorViewModel?.vrus) {
            allVRUs = [...allVRUs, ...testingPedestrianDetectorViewModel.vrus];
          }

          const pedestriansInThisCrosswalk = CrosswalkDetectionService.countPedestriansInSpecificCrosswalk(allVRUs, index);

          const crosswalkPolygon = {
            type: "Feature" as const,
            properties: {
              crosswalkId: index,
              name: `Crosswalk ${index + 1}`
            },
            geometry: {
              type: "Polygon" as const,
              coordinates: [polygonCoords]
            }
          };

          return (
            <MapboxGL.ShapeSource
              key={`crosswalk-${index}`}
              id={`crosswalk-polygon-source-${index}`}
              shape={crosswalkPolygon}
            >
              <MapboxGL.FillLayer
                id={`crosswalk-polygon-fill-${index}`}
                style={{
                  fillColor: pedestriansInThisCrosswalk > 0 ?
                    'rgba(255, 59, 48, 0.4)' : 'rgba(255, 255, 0, 0.4)',
                  fillOutlineColor: '#FFCC00'
                }}
              />
              <MapboxGL.LineLayer
                id={`crosswalk-polygon-outline-${index}`}
                style={{
                  lineColor: '#FFCC00',
                  lineWidth: 2
                }}
              />
            </MapboxGL.ShapeSource>
          );
        })}

        <LaneOverlay lanesViewModel={lanesViewModel} />

        {mainViewModel?.vehicleDisplayViewModel && shouldShowSDSMForViewModel(mainViewModel.vehicleDisplayViewModel) && (
          <VehicleMarkers viewModel={mainViewModel.vehicleDisplayViewModel} />
        )}

        {testingVehicleDisplayViewModel && shouldShowSDSMForViewModel(testingVehicleDisplayViewModel) && (
          <VehicleMarkers viewModel={testingVehicleDisplayViewModel} />
        )}

        {mainViewModel?.vehicleDisplayViewModel && shouldShowSDSMForViewModel(mainViewModel.vehicleDisplayViewModel) && (
          <VRUMarkers
            vrus={mainViewModel.vehicleDisplayViewModel.vrus}
            isActive={mainViewModel.vehicleDisplayViewModel.isActive}
            getMapboxCoordinates={mainViewModel.vehicleDisplayViewModel.getMapboxCoordinates.bind(mainViewModel.vehicleDisplayViewModel)}
          />
        )}

        {testingVehicleDisplayViewModel && shouldShowSDSMForViewModel(testingVehicleDisplayViewModel) && (
          <VRUMarkers
            vrus={testingVehicleDisplayViewModel.vrus}
            isActive={testingVehicleDisplayViewModel.isActive}
            getMapboxCoordinates={testingVehicleDisplayViewModel.getMapboxCoordinates.bind(testingVehicleDisplayViewModel)}
          />
        )}

        {TESTING_CONFIG.SHOW_FIXED_PEDESTRIAN && testingPedestrianDetectorViewModel && (
          <VRUMarkers
            vrus={testingPedestrianDetectorViewModel.vrus}
            isActive={true}
            getMapboxCoordinates={(vru) => [vru.coordinates[1], vru.coordinates[0]]}
          />
        )}

        {children}
      </MapboxGL.MapView>

      <TestingModeOverlay
        isTestingMode={isTestingMode}
        testingVehicleDisplayViewModel={testingVehicleDisplayViewModel}
      />

      <SpatStatusDisplay 
        userPosition={userPosition} 
        spatViewModel={spatViewModel}
      />

      <TurnGuideDisplay spatViewModel={spatViewModel} />

      {/* Pedestrian Warning */}
      {(() => {
        const vehiclePos: [number, number] = [userPosition[0], userPosition[1]];

        if (userPosition[0] === 0) return null;

        let allVRUs: any[] = [];

        if (TESTING_CONFIG.ENABLE_SDSM_API) {
          const vehicleDisplayVM = mainViewModel?.vehicleDisplayViewModel || testingVehicleDisplayViewModel;
          if (vehicleDisplayVM?.vrus && shouldShowSDSMForViewModel(vehicleDisplayVM)) {
            allVRUs = [...allVRUs, ...vehicleDisplayVM.vrus];
          }
        }

        if (TESTING_CONFIG.SHOW_FIXED_PEDESTRIAN && testingPedestrianDetectorViewModel?.vrus) {
          allVRUs = [...allVRUs, ...testingPedestrianDetectorViewModel.vrus];
        }

        const hasPedestriansNearby = allVRUs.some(vru => {
          const isPedestrianInCrosswalk = CrosswalkDetectionService.isInCrosswalk(vru.coordinates);
          if (!isPedestrianInCrosswalk) return false;

          const isVehicleNearPedestrian = ProximityDetectionService.isVehicleCloseToPosition(
            vehiclePos,
            vru.coordinates
          );

          return isVehicleNearPedestrian;
        });

        return hasPedestriansNearby ? (
          <View style={styles.warningContainer}>
            <Text style={styles.warningText}>
              ⚠️ Pedestrian crossing detected ahead!
            </Text>
          </View>
        ) : null;
      })()}
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
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  userLocationInner: {
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
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  warningText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
  },
});