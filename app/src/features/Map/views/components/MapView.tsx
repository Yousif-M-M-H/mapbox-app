// app/src/features/Map/views/components/MapView.tsx
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MapboxGL from '@rnmapbox/maps';
import { observer } from 'mobx-react-lite';
import * as Location from 'expo-location';
import { MapViewModel } from '../../viewmodels/MapViewModel';
import { PedestrianDetectorViewModel } from '../../../PedestrianDetector/viewmodels/PedestrianDetectorViewModel';
import { TestingPedestrianDetectorViewModel } from '../../../../testingFeatures/testingPedestrianDetectorFeatureTest/viewmodels/TestingPedestrianDetectorViewModel';
import { VehicleDisplayViewModel } from '../../../SDSM/viewmodels/VehicleDisplayViewModel'
import { DirectionGuideViewModel } from '../../../DirectionGuide/viewModels/DirectionGuideViewModel';
import { TurnGuideDisplay } from '../../../DirectionGuide/views/components/TurnGuideDisplay';
import { SpatStatusDisplay } from '../../../SpatService/views/SpatStatusDisplay';
import { VehicleMarkers } from '../../../SDSM/views/VehicleMarkers'
import { VRUMarkers } from '../../../SDSM/views/VRUMarkers'
import { TestingModeOverlay } from '../../../../testingFeatures/testingUI';
import { LaneOverlay } from '../../../Lanes/views/components/LaneOverlay';
import { LanesViewModel } from '../../../Lanes/viewmodels/LanesViewModel';
import {
  CROSSWALK_POLYGONS
} from '../../../Crosswalk/constants/CrosswalkCoordinates';
import { CrosswalkDetectionService } from '../../../PedestrianDetector/services/CrosswalkDetectionService';
import { ProximityDetectionService } from '../../../PedestrianDetector/services/ProximityDetectionService';
import { TESTING_CONFIG } from '../../../../testingFeatures/TestingConfig';

// Import MainViewModel for user heading
import { MainViewModel } from '../../../../Main/viewmodels/MainViewModel';



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

  // State for GPS heading (independent of camera)
  const [gpsHeading, setGpsHeading] = useState<number | null>(null);
  const [lastKnownHeading, setLastKnownHeading] = useState<number | null>(null);
  
  // State for smooth location tracking - initialize with user's current location
  const [smoothedLocation, setSmoothedLocation] = useState<[number, number]>([
    mapViewModel.userLocation.latitude, 
    mapViewModel.userLocation.longitude
  ]);
  const locationHistory = useRef<Array<{coords: [number, number], timestamp: number}>>([]);

  // Get the active detector based on mode
  const activeDetector = isTestingMode ? testingPedestrianDetectorViewModel : pedestrianDetectorViewModel;

  // Simple toggle to control SDSM vehicle visibility on map
  // Set to false to hide vehicles from map while keeping background functionality
  const SHOW_SDSM_VEHICLES = true;

  // Initialize Lanes ViewModel
  const lanesViewModel = useRef(new LanesViewModel()).current;



  // GPS tracking setup with heading capture
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
            accuracy: Location.Accuracy.BestForNavigation,
            distanceInterval: 0.5, // Update every half meter for smoother tracking  
            timeInterval: 250 // Update every 250ms to sync with lane detection throttle
          },
          (location) => {
            updateCount++;
            const { latitude, longitude, heading, accuracy } = location.coords;

            // Capture GPS heading independently
            if (heading !== null && heading !== undefined) {
              setGpsHeading(heading);
              setLastKnownHeading(heading);
            }

            // Apply coordinate smoothing for better lane alignment
            const newCoords: [number, number] = [latitude, longitude];
            const smoothedCoords = applySmoothingFilter(newCoords, accuracy || 10);
            
            setSmoothedLocation(smoothedCoords);

            // Update DirectionGuide with smoothed coordinates
            directionGuideViewModel.setVehiclePosition(smoothedCoords);

            // Update other components with smoothed coordinates
            if (activeDetector && 'setVehiclePosition' in activeDetector) {
              activeDetector.setVehiclePosition(smoothedCoords);
            }

            // Update map for blue marker with smoothed coordinates
            mapViewModel.setUserLocation({
              latitude: smoothedCoords[0],
              longitude: smoothedCoords[1],
              heading: undefined
            });
          }
        );

        // Start pedestrian monitoring
        if (activeDetector && 'startMonitoring' in activeDetector) {
          activeDetector.startMonitoring();
        }

      } catch (error) {
        // Removed error logging
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

  // Update PedestrianDetector with VRU data from SDSM and testing pedestrians
  useEffect(() => {
    if (!activeDetector) return;

    // Collect VRU data from multiple sources
    let allVRUs: any[] = [];

    // Add SDSM VRU data if API is enabled
    if (TESTING_CONFIG.ENABLE_SDSM_API) {
      const vehicleDisplayVM = mainViewModel?.vehicleDisplayViewModel || testingVehicleDisplayViewModel;
      if (vehicleDisplayVM?.vrus) {
        allVRUs = [...allVRUs, ...vehicleDisplayVM.vrus];
      }
    }

    // Add testing pedestrian VRU data if enabled
    if (TESTING_CONFIG.SHOW_FIXED_PEDESTRIAN && testingPedestrianDetectorViewModel?.vrus) {
      allVRUs = [...allVRUs, ...testingPedestrianDetectorViewModel.vrus];
    }

    // Update detector with combined VRU data
    activeDetector.updateVRUData(allVRUs);
  }, [
    activeDetector,
    mainViewModel?.vehicleDisplayViewModel?.vrus,
    testingVehicleDisplayViewModel?.vrus,
    testingPedestrianDetectorViewModel?.vrus,
    TESTING_CONFIG.ENABLE_SDSM_API,
    TESTING_CONFIG.SHOW_FIXED_PEDESTRIAN
  ]);


  // Note: Individual crosswalk detection is now handled per-crosswalk in the rendering loop

  // Coordinate smoothing function for better lane alignment
  const applySmoothingFilter = (newCoords: [number, number], accuracy: number): [number, number] => {
    const now = Date.now();
    const history = locationHistory.current;
    
    // Add new coordinates to history
    history.push({ coords: newCoords, timestamp: now });
    
    // Keep only last 5 seconds of data
    locationHistory.current = history.filter(item => now - item.timestamp < 5000);
    
    // If accuracy is good (< 5 meters), use coordinates directly
    if (accuracy < 5) {
      return newCoords;
    }
    
    // For poor accuracy, apply weighted average with recent history
    if (locationHistory.current.length < 2) {
      return newCoords;
    }
    
    const recentHistory = locationHistory.current.slice(-3); // Last 3 points
    let totalWeight = 0;
    let weightedLat = 0;
    let weightedLng = 0;
    
    recentHistory.forEach((point, index) => {
      const weight = index + 1; // More recent points have higher weight
      weightedLat += point.coords[0] * weight;
      weightedLng += point.coords[1] * weight;
      totalWeight += weight;
    });
    
    return [weightedLat / totalWeight, weightedLng / totalWeight];
  };

  // Use GPS heading (camera-independent)
  const displayHeading = gpsHeading || lastKnownHeading;

  return (
    <View style={styles.container}>
      <MapboxGL.MapView
        ref={mapRef}
        style={styles.map}
        styleURL="mapbox://styles/mapbox/outdoors-v12"
        logoEnabled={false}
        attributionEnabled={false}
        compassEnabled={false}
        rotateEnabled={true} // Allow map rotation but don't affect heading
        scrollEnabled={true} // Enable panning/scrolling
        pitchEnabled={true} // Enable pitch/tilt
        zoomEnabled={true} // Enable zoom gestures
      >
        <MapboxGL.Camera
          ref={cameraRef}
          centerCoordinate={[-85.3075, 35.0454]}
          zoomLevel={16}
          animationDuration={300}

        />

        {/* User Location Marker with Fixed GPS Heading - Independent of Camera Position */}
        {/* This marker shows the user's actual location but doesn't control the camera */}
        {smoothedLocation[0] !== 0 && smoothedLocation[1] !== 0 && (
          <MapboxGL.PointAnnotation
            id="vehicle-position"
            coordinate={[smoothedLocation[1], smoothedLocation[0]]} // [lng, lat] for Mapbox
            anchor={{ x: 0.5, y: 0.5 }}
          >
            {displayHeading !== null ? (
              // GPS-based heading arrow (fixed to real-world direction)
              <View style={styles.userLocationContainer}>
                <View style={[
                  styles.headingArrow,
                  {
                    transform: [{
                      rotate: `${displayHeading}deg` // Direct GPS heading, no map compensation
                    }]
                  }
                ]}>
                  <View style={styles.arrowPoint} />
                  <View style={styles.arrowBase} />
                </View>
              </View>
            ) : (
              // Simple circular marker when no heading available
              <View style={styles.userLocationMarker}>
                <View style={styles.userLocationInner} />
              </View>
            )}
          </MapboxGL.PointAnnotation>
        )}

        {/* Multiple crosswalk polygons */}
        {mapViewModel.showCrosswalkPolygon && CROSSWALK_POLYGONS.map((polygonCoords, index) => {
          // Get pedestrian data for specific crosswalk independent calculation
          // Collect VRU data from multiple sources (same logic as useEffect above)
          let allVRUs: any[] = [];

          // Add SDSM VRU data if API is enabled
          if (TESTING_CONFIG.ENABLE_SDSM_API) {
            const vehicleDisplayVM = mainViewModel?.vehicleDisplayViewModel || testingVehicleDisplayViewModel;
            if (vehicleDisplayVM?.vrus) {
              allVRUs = [...allVRUs, ...vehicleDisplayVM.vrus];
            }
          }

          // Add testing pedestrian VRU data if enabled
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

        {/* Lane Overlays */}
        <LaneOverlay lanesViewModel={lanesViewModel} />

        {/* SDSM Vehicle Markers (Main Feature - FROM SDSM FOLDER ONLY) */}
        {SHOW_SDSM_VEHICLES && TESTING_CONFIG.ENABLE_SDSM_API && mainViewModel?.vehicleDisplayViewModel && (
          <VehicleMarkers viewModel={mainViewModel.vehicleDisplayViewModel} />
        )}

        {SHOW_SDSM_VEHICLES && TESTING_CONFIG.ENABLE_SDSM_API && testingVehicleDisplayViewModel && (
          <VehicleMarkers viewModel={testingVehicleDisplayViewModel as unknown as VehicleDisplayViewModel} />
        )}

        {/* SDSM VRU/Pedestrian Markers */}
        {SHOW_SDSM_VEHICLES && TESTING_CONFIG.ENABLE_SDSM_API && mainViewModel?.vehicleDisplayViewModel && (
          <VRUMarkers
            vrus={mainViewModel.vehicleDisplayViewModel.vrus}
            isActive={mainViewModel.vehicleDisplayViewModel.isActive}
            getMapboxCoordinates={mainViewModel.vehicleDisplayViewModel.getMapboxCoordinates.bind(mainViewModel.vehicleDisplayViewModel)}
          />
        )}

        {SHOW_SDSM_VEHICLES && TESTING_CONFIG.ENABLE_SDSM_API && testingVehicleDisplayViewModel && (
          <VRUMarkers
            vrus={testingVehicleDisplayViewModel.vrus}
            isActive={testingVehicleDisplayViewModel.isActive}
            getMapboxCoordinates={testingVehicleDisplayViewModel.getMapboxCoordinates.bind(testingVehicleDisplayViewModel)}
          />
        )}

        {/* Fixed Testing Pedestrian VRU Markers */}
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
        testingVehicleDisplayViewModel={testingVehicleDisplayViewModel as unknown as VehicleDisplayViewModel}
      />


      {/* SDSM Vehicle Status Display (FROM SDSM FOLDER ONLY) */}


      {/* SPaT status display */}
      <SpatStatusDisplay userPosition={[mapViewModel.userLocation.latitude, mapViewModel.userLocation.longitude]} />

      {/* Turn guidance UI */}
      <TurnGuideDisplay directionGuideViewModel={directionGuideViewModel} />

      {/* GPS Heading Display (Fixed) */}
      {displayHeading !== null && (
        <View style={styles.headingContainer}>
          <Text style={styles.headingText}>
            🧭 {displayHeading.toFixed(0)}° GPS
          </Text>
        </View>
      )}

      {/* Pedestrian warning - Simple Proximity Logic */}
      {(() => {
        const vehiclePos: [number, number] = [smoothedLocation[0], smoothedLocation[1]];

        if (smoothedLocation[0] === 0) return null;

        // Collect VRU data from multiple sources
        let allVRUs: any[] = [];

        // Add SDSM VRU data if API is enabled
        if (TESTING_CONFIG.ENABLE_SDSM_API) {
          const vehicleDisplayVM = mainViewModel?.vehicleDisplayViewModel || testingVehicleDisplayViewModel;
          if (vehicleDisplayVM?.vrus) {
            allVRUs = [...allVRUs, ...vehicleDisplayVM.vrus];
          }
        }

        // Add testing pedestrian VRU data if enabled
        if (TESTING_CONFIG.SHOW_FIXED_PEDESTRIAN && testingPedestrianDetectorViewModel?.vrus) {
          allVRUs = [...allVRUs, ...testingPedestrianDetectorViewModel.vrus];
        }

        // Check if any pedestrian is in crosswalk and vehicle is within 10 meters of that pedestrian
        const hasPedestriansNearby = allVRUs.some(vru => {
          // Check if pedestrian is in any crosswalk
          const isPedestrianInCrosswalk = CrosswalkDetectionService.isInCrosswalk(vru.coordinates);
          if (!isPedestrianInCrosswalk) return false;

          // Check if vehicle is within 10 meters of this pedestrian
          const isVehicleNearPedestrian = ProximityDetectionService.isVehicleCloseToPosition(
            vehiclePos,
            vru.coordinates
          );

          return isVehicleNearPedestrian;
        });

        return hasPedestriansNearby ? (
          <View style={styles.warningContainer}>
            <Text style={styles.warningText}>
              Pedestrian crossing detected ahead!
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

  // Container for heading arrow (fixed positioning)
  userLocationContainer: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // GPS-based heading arrow (Google Maps style)
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

  // Simple circular marker (no heading)
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