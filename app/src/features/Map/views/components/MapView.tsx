// app/src/features/Map/views/components/MapView.tsx

import React, { useEffect, useMemo, useRef, useState } from 'react';
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
import { SpatZone, SpatZoneService } from '../../../SpatService/services/SpatZoneService';
import { MapLegend } from './MapLegend';
import {
  PreemptionButton,
  PreemptionViewModel,
} from '../../../preemption';

interface MapViewProps {
  mapViewModel: MapViewModel;
  pedestrianDetectorViewModel?: PedestrianDetectorViewModel | null;
  testingPedestrianDetectorViewModel?: TestingPedestrianDetectorViewModel | null;
  testingVehicleDisplayViewModel: VehicleDisplayViewModel | null;
  directionGuideViewModel: DirectionGuideViewModel;
  isTestingMode: boolean;
  mainViewModel?: MainViewModel;
  spatViewModel?: SpatViewModel;
  lanesViewModel?: LanesViewModel;
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
  spatViewModel: providedSpatViewModel,
  lanesViewModel: providedLanesViewModel,
  children
}) => {
  const mapRef = useRef<MapboxGL.MapView>(null);
  const cameraRef = useRef<MapboxGL.Camera>(null);
  const spatViewModelRef = useRef<SpatViewModel>(new SpatViewModel());
  const lanesViewModelRef = useRef<LanesViewModel>(new LanesViewModel());
  const preemptionViewModelRef = useRef<PreemptionViewModel>(new PreemptionViewModel());
  
  const spatViewModel = providedSpatViewModel || spatViewModelRef.current;
  const lanesViewModel = providedLanesViewModel || lanesViewModelRef.current;
  const preemptionViewModel = preemptionViewModelRef.current;

  const [userPosition, setUserPosition] = useState<[number, number]>([
    mapViewModel.userLocation.latitude, 
    mapViewModel.userLocation.longitude
  ]);
  const [spatZones, setSpatZones] = useState<SpatZone[]>(() => SpatZoneService.getActiveZones());
  const [activeSpatZoneId, setActiveSpatZoneId] = useState<string | null>(null);

  const configuredPreemptionZone = useMemo(() => {
    const configuredZoneId = preemptionViewModel.configuredZoneId;
    if (!configuredZoneId) return null;
    return spatZones.find((zone) => zone.id === configuredZoneId) || null;
  }, [spatZones, preemptionViewModel.configuredZoneId]);

  const lastCameraUpdate = useRef<number>(0);
  const CAMERA_UPDATE_THROTTLE = 2000;
  const DASHBOARD_INTERSECTION_NUMBER = 1;

  const activeDetector = isTestingMode ? testingPedestrianDetectorViewModel : pedestrianDetectorViewModel;
  const SHOW_SDSM_VEHICLES = true;


  const getZonesSignature = (zones: SpatZone[]): string => (
    zones
      .map((zone) => `${zone.id}:${zone.name}:${zone.signalGroup}:${zone.polygon.length}:${zone.entryLine?.length || 0}:${zone.exitLine?.length || 0}`)
      .join('|')
  );

  const toLngLatLine = (line?: [number, number][]): [number, number][] | null => {
    if (!line || line.length !== 2) return null;
    return line.map(([lat, lng]) => [lng, lat]);
  };

  const createZonePolygonFeature = (zone: SpatZone) => ({
    type: 'Feature' as const,
    properties: {
      zoneId: zone.id,
      name: zone.name,
      signalGroup: zone.signalGroup,
      laneIds: zone.laneIds.join(', '),
    },
    geometry: {
      type: 'Polygon' as const,
      coordinates: [zone.polygon],
    },
  });

  const createLineFeature = (lineCoords: [number, number][], lineType: 'entry' | 'exit') => ({
    type: 'Feature' as const,
    properties: {
      lineType,
    },
    geometry: {
      type: 'LineString' as const,
      coordinates: lineCoords,
    },
  });

  const shouldShowSDSMForViewModel = (_viewModel: VehicleDisplayViewModel): boolean => {
    if (!SHOW_SDSM_VEHICLES || !TESTING_CONFIG.ENABLE_SDSM_API) {
      return false;
    }
    return true;
  };

  const updateCameraPosition = (position: [number, number]) => {
    const now = Date.now();
    
    if (now - lastCameraUpdate.current < CAMERA_UPDATE_THROTTLE) {
      return;
    }
    
    lastCameraUpdate.current = now;
    
    if (cameraRef.current && position[0] !== 0 && position[1] !== 0) {
      cameraRef.current.setCamera({
        centerCoordinate: [position[1], position[0]],
        zoomLevel: 17,
        animationDuration: 1500,
      });
    }
  };

  const updateAllViewModels = (position: [number, number]) => {
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


  useEffect(() => {
    const syncZones = () => {
      const nextZones = SpatZoneService.getActiveZones();
      setSpatZones((previousZones) => (
        getZonesSignature(previousZones) === getZonesSignature(nextZones)
          ? previousZones
          : nextZones
      ));
    };

    syncZones();
    const intervalId = setInterval(syncZones, 1000);

    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    preemptionViewModel.loadZoneConfig(DASHBOARD_INTERSECTION_NUMBER);
  }, [preemptionViewModel, DASHBOARD_INTERSECTION_NUMBER]);

  useEffect(() => {
    if (userPosition[0] === 0 || userPosition[1] === 0) return;

    const activeZone = SpatZoneService.findZoneForPosition(userPosition);
    const nextZoneId = activeZone?.id || null;

    if (nextZoneId !== activeSpatZoneId) {
      if (nextZoneId && activeZone) {
        console.log(`[SPAT] User entered zone: ${activeZone.name} (id=${activeZone.id}, signalGroup=${activeZone.signalGroup})`);
      } else if (activeSpatZoneId) {
        console.log(`[SPAT] User exited zone: ${activeSpatZoneId}`);
      }
      setActiveSpatZoneId(nextZoneId);
    }
  }, [userPosition, spatZones, activeSpatZoneId]);

  useEffect(() => {
    preemptionViewModel.syncPosition(userPosition, configuredPreemptionZone);
  }, [preemptionViewModel, userPosition, configuredPreemptionZone]);

  useEffect(() => {
    let locationSubscription: Location.LocationSubscription;

    const setupLocationTracking = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          console.log('[Location] Permission not granted');
          return;
        }

        // Get initial position first
        try {
          const initialLocation = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.BestForNavigation,
          });
          const { latitude, longitude } = initialLocation.coords;
          const initialPosition: [number, number] = [latitude, longitude];
          setUserPosition(initialPosition);
          updateAllViewModels(initialPosition);
        } catch (posError) {
          console.log('[Location] Could not get initial position:', posError);
        }

        // Then set up continuous tracking
        locationSubscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.BestForNavigation,
            distanceInterval: 1,
            timeInterval: 100
          },
          (location) => {
            const { latitude, longitude } = location.coords;
            const newPosition: [number, number] = [latitude, longitude];

            setUserPosition(newPosition);
            updateAllViewModels(newPosition);
            updateCameraPosition(newPosition);
          }
        );

        if (activeDetector && 'startMonitoring' in activeDetector) {
          activeDetector.startMonitoring();
        }

      } catch (error) {
        console.log('[Location] Setup error:', error);
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
          zoomLevel={17}
          animationMode="flyTo"
          animationDuration={1500}
        />

        {userPosition[0] !== 0 && userPosition[1] !== 0 && (
          <MapboxGL.PointAnnotation
            id="user-location"
            coordinate={[userPosition[1], userPosition[0]]}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View style={styles.userLocationMarker}>
              <View style={[styles.userLocationPulse, activeSpatZoneId ? styles.userLocationPulseInSpat : null]} />
              <View style={[styles.userLocationDot, activeSpatZoneId ? styles.userLocationDotInSpat : null]} />
            </View>
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


        {TESTING_CONFIG.SHOW_SPAT_ZONES && spatZones.map((zone, index) => {
          const zoneId = `spat-zone-${zone.id}-${index}`;
          const entryLine = toLngLatLine(zone.entryLine);
          const exitLine = toLngLatLine(zone.exitLine);
          const isActiveZone = activeSpatZoneId === zone.id;

          return (
            <React.Fragment key={zoneId}>
              <MapboxGL.ShapeSource
                id={`${zoneId}-source`}
                shape={createZonePolygonFeature(zone)}
              >
                <MapboxGL.FillLayer
                  id={`${zoneId}-fill`}
                  style={{
                    fillColor: isActiveZone ? 'rgba(249, 115, 22, 0.32)' : 'rgba(16, 185, 129, 0.16)',
                    fillOutlineColor: isActiveZone ? 'rgba(249, 115, 22, 1)' : 'rgba(16, 185, 129, 0.8)',
                  }}
                />
                <MapboxGL.LineLayer
                  id={`${zoneId}-outline`}
                  style={{
                    lineColor: isActiveZone ? '#F97316' : '#10B981',
                    lineWidth: isActiveZone ? 3 : 2,
                  }}
                />
              </MapboxGL.ShapeSource>

              {entryLine && (
                <MapboxGL.ShapeSource
                  id={`${zoneId}-entry-source`}
                  shape={createLineFeature(entryLine, 'entry')}
                >
                  <MapboxGL.LineLayer
                    id={`${zoneId}-entry`}
                    style={{
                      lineColor: '#22C55E',
                      lineWidth: 4,
                    }}
                  />
                </MapboxGL.ShapeSource>
              )}

              {exitLine && (
                <MapboxGL.ShapeSource
                  id={`${zoneId}-exit-source`}
                  shape={createLineFeature(exitLine, 'exit')}
                >
                  <MapboxGL.LineLayer
                    id={`${zoneId}-exit`}
                    style={{
                      lineColor: '#EF4444',
                      lineWidth: 4,
                    }}
                  />
                </MapboxGL.ShapeSource>
              )}
            </React.Fragment>
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

      {/* SpatStatusDisplay - Hidden in favor of TurnGuideDisplay */}
      {/* <SpatStatusDisplay
        userPosition={userPosition}
        spatViewModel={spatViewModel}
      /> */}

      <TurnGuideDisplay spatViewModel={spatViewModel} />

      <PreemptionButton
        visible={preemptionViewModel.isButtonVisible}
        zoneName={configuredPreemptionZone?.name || preemptionViewModel.configuredZoneName}
        onPress={() => {
          preemptionViewModel.requestPriority(configuredPreemptionZone);
        }}
      />

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
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userLocationPulse: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    borderWidth: 2,
    borderColor: 'rgba(34, 197, 94, 0.4)',
  },
  userLocationPulseInSpat: {
    backgroundColor: 'rgba(249, 115, 22, 0.25)',
    borderColor: 'rgba(249, 115, 22, 0.6)',
  },
  userLocationDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#22C55E',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  userLocationDotInSpat: {
    backgroundColor: '#F97316',
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
