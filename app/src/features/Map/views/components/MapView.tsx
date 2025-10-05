// app/src/features/Map/views/components/MapView.tsx

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

  const [gpsHeading, setGpsHeading] = useState<number | null>(null);
  const [lastKnownHeading, setLastKnownHeading] = useState<number | null>(null);
  
  const [smoothedLocation, setSmoothedLocation] = useState<[number, number]>([
    mapViewModel.userLocation.latitude, 
    mapViewModel.userLocation.longitude
  ]);
  const locationHistory = useRef<Array<{coords: [number, number], timestamp: number}>>([]);

  const activeDetector = isTestingMode ? testingPedestrianDetectorViewModel : pedestrianDetectorViewModel;

  const SHOW_SDSM_VEHICLES = true;

  const lanesViewModel = useRef(new LanesViewModel()).current;

  const shouldShowSDSMForViewModel = (viewModel: VehicleDisplayViewModel): boolean => {
    if (!SHOW_SDSM_VEHICLES || !TESTING_CONFIG.ENABLE_SDSM_API) {
      return false;
    }
    
    // All SDSM is now Georgia-only, so always show if enabled
    return true;
  };

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
            accuracy: Location.Accuracy.BestForNavigation,
            distanceInterval: 0.5,
            timeInterval: 250
          },
          (location) => {
            const { latitude, longitude, heading, accuracy } = location.coords;

            if (heading !== null && heading !== undefined) {
              setGpsHeading(heading);
              setLastKnownHeading(heading);
            }

            const newCoords: [number, number] = [latitude, longitude];
            const smoothedCoords = applySmoothingFilter(newCoords, accuracy || 10);
            
            setSmoothedLocation(smoothedCoords);

            directionGuideViewModel.setVehiclePosition(smoothedCoords);

            spatViewModel.setUserPosition(smoothedCoords);

            if (activeDetector && 'setVehiclePosition' in activeDetector) {
              activeDetector.setVehiclePosition(smoothedCoords);
            }

            mapViewModel.setUserLocation({
              latitude: smoothedCoords[0],
              longitude: smoothedCoords[1],
              heading: undefined
            });
          }
        );

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

  const applySmoothingFilter = (newCoords: [number, number], accuracy: number): [number, number] => {
    const now = Date.now();
    const history = locationHistory.current;
    
    history.push({ coords: newCoords, timestamp: now });
    locationHistory.current = history.filter(item => now - item.timestamp < 5000);
    
    if (accuracy < 5) {
      return newCoords;
    }
    
    if (locationHistory.current.length < 2) {
      return newCoords;
    }
    
    const recentHistory = locationHistory.current.slice(-3);
    let totalWeight = 0;
    let weightedLat = 0;
    let weightedLng = 0;
    
    recentHistory.forEach((point, index) => {
      const weight = index + 1;
      weightedLat += point.coords[0] * weight;
      weightedLng += point.coords[1] * weight;
      totalWeight += weight;
    });
    
    return [weightedLat / totalWeight, weightedLng / totalWeight];
  };

  const displayHeading = gpsHeading || lastKnownHeading;

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

        {smoothedLocation[0] !== 0 && smoothedLocation[1] !== 0 && (
          <MapboxGL.PointAnnotation
            id="vehicle-position"
            coordinate={[smoothedLocation[1], smoothedLocation[0]]}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            {displayHeading !== null ? (
              <View style={styles.userLocationContainer}>
                <View style={[
                  styles.headingArrow,
                  {
                    transform: [{
                      rotate: `${displayHeading}deg`
                    }]
                  }
                ]}>
                  <View style={styles.arrowPoint} />
                  <View style={styles.arrowBase} />
                </View>
              </View>
            ) : (
              <View style={styles.userLocationMarker}>
                <View style={styles.userLocationInner} />
              </View>
            )}
          </MapboxGL.PointAnnotation>
        )}

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
        userPosition={smoothedLocation} 
        spatViewModel={spatViewModel}
      />

      <TurnGuideDisplay spatViewModel={spatViewModel} />

      {displayHeading !== null && (
        <View style={styles.headingContainer}>
          <Text style={styles.headingText}>
            🧭 {displayHeading.toFixed(0)}° GPS
          </Text>
        </View>
      )}

      {(() => {
        const vehiclePos: [number, number] = [smoothedLocation[0], smoothedLocation[1]];

        if (smoothedLocation[0] === 0) return null;

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
  userLocationContainer: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headingArrow: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowPoint: {
    width: 0,
    height: 0,
    borderLeftWidth: 7,
    borderRightWidth: 7,
    borderBottomWidth: 14,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#4285F4',
    borderStyle: 'solid',
  },
  arrowBase: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#4285F4',
    borderWidth: 2,
    borderColor: 'white',
    marginTop: -3,
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
  headingContainer: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  headingText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
});