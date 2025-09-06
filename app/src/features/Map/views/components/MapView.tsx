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
import { SimpleLine } from '../../../PedestrianDetector/views/components/SimpleLine';
import { VehicleMarkers } from '../../../SDSM/views/VehicleMarkers'
import { TestingModeOverlay } from '../../../../testingFeatures/testingUI';
import {
  CROSSWALK_CENTER,
  CROSSWALK_POLYGONS
} from '../../../Crosswalk/constants/CrosswalkCoordinates';

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

  // Line coordinates for lane visualization
  const lineCoordinates: [number, number][] = [
    [-85.3082228825378, 35.045758400746536],
    [-85.30808198885602, 35.045705490572416]
  ];

  // Lane 5 coordinates
  const lane5Coordinates: [number, number][] = [
     
    [-85.30823278205297, 35.045747747854335],   // Start
    [-85.30808944380614, 35.04569249636451]   // End
  ];

  // Lane 6 coordinates
  const lane6Coordinates: [number, number][] = [
     
    [-85.30823869222141, 35.04573090520772],   // End
    [-85.30809488188754, 35.045682489370606],   // Start
  
  ];

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

  // Get detector data
  const pedestrians = activeDetector?.pedestrians || [];
  const pedestriansInCrosswalk = activeDetector?.pedestriansInCrosswalk || 0;
  
  // Improved logic: Check if vehicle is near pedestrians specifically IN crosswalk (20m range)
  const isVehicleNearPedestrianInCrosswalk = activeDetector?.isVehicleNearPedestrianInCrosswalk || false;
  const userLocationCoordinate = mapViewModel.userLocationCoordinate;

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
        styleURL="mapbox://styles/mapbox/streets-v12"
        logoEnabled={false}
        attributionEnabled={false}
        compassEnabled={false}
        rotateEnabled={true} // Allow map rotation but don't affect heading
      >
        <MapboxGL.Camera
          ref={cameraRef}
          centerCoordinate={userLocationCoordinate}
          zoomLevel={18}
          animationDuration={300}
        // Don't set bearing - let user control map rotation independently
        />

        {/* User Location Marker with Fixed GPS Heading - Using smoothed coordinates */}
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
                  fillColor: pedestriansInCrosswalk > 0 ?
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

        {/* Lane 4 - Blue Line (Original) */}
        <MapboxGL.ShapeSource id="lane-4-source" shape={{
          type: "Feature",
          properties: {},
          geometry: {
            type: "LineString",
            coordinates: lineCoordinates
          }
        }}>
          <MapboxGL.LineLayer
            id="lane-4-layer"
            style={{
              lineColor: "#0066FF",
              lineWidth: 3,
              lineCap: 'round',
              lineJoin: 'round'
            }}
          />
        </MapboxGL.ShapeSource>

        {/* Lane 5 - Blue Line */}
        <MapboxGL.ShapeSource id="lane-5-source" shape={{
          type: "Feature",
          properties: {},
          geometry: {
            type: "LineString",
            coordinates: lane5Coordinates
          }
        }}>
          <MapboxGL.LineLayer
            id="lane-5-layer"
            style={{
              lineColor: "#0066FF",
              lineWidth: 3,
              lineCap: 'round',
              lineJoin: 'round'
            }}
          />
        </MapboxGL.ShapeSource>

        {/* Lane 6 - Blue Line */}
        <MapboxGL.ShapeSource id="lane-6-source" shape={{
          type: "Feature",
          properties: {},
          geometry: {
            type: "LineString",
            coordinates: lane6Coordinates
          }
        }}>
          <MapboxGL.LineLayer
            id="lane-6-layer"
            style={{
              lineColor: "#0066FF",
              lineWidth: 3,
              lineCap: 'round',
              lineJoin: 'round'
            }}
          />
        </MapboxGL.ShapeSource>

        {/* SDSM Vehicle Markers (Main Feature - FROM SDSM FOLDER ONLY) */}
        {SHOW_SDSM_VEHICLES && mainViewModel?.vehicleDisplayViewModel && (
          <VehicleMarkers viewModel={mainViewModel.vehicleDisplayViewModel} />
        )}

        {SHOW_SDSM_VEHICLES && testingVehicleDisplayViewModel && (
          <VehicleMarkers viewModel={testingVehicleDisplayViewModel as unknown as VehicleDisplayViewModel} />
        )}


        {/* Pedestrian markers */}
        {pedestrians.map((pedestrian) => (
          <MapboxGL.PointAnnotation
            key={`pedestrian-${pedestrian.id}`}
            id={`pedestrian-${pedestrian.id}`}
            coordinate={[pedestrian.coordinates[1], pedestrian.coordinates[0]]}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View style={styles.pedestrianMarker}>
              <View style={styles.markerInner} />
            </View>
          </MapboxGL.PointAnnotation>
        ))}

        {children}
      </MapboxGL.MapView>

      <TestingModeOverlay
        isTestingMode={isTestingMode}
        testingVehicleDisplayViewModel={testingVehicleDisplayViewModel as unknown as VehicleDisplayViewModel}
      />


      {/* SDSM Vehicle Status Display (FROM SDSM FOLDER ONLY) */}


      {/* SPaT status display */}
      <SpatStatusDisplay directionGuideViewModel={directionGuideViewModel} />

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

      {/* Pedestrian warning - Improved Logic */}
      {pedestriansInCrosswalk > 0 && isVehicleNearPedestrianInCrosswalk && (
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

  pedestrianMarker: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FF6B35',
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