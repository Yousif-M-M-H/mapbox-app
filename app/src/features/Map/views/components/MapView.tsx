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
  
  // Get the active detector based on mode
  const activeDetector = isTestingMode ? testingPedestrianDetectorViewModel : pedestrianDetectorViewModel;
  
  // Line coordinates for lane visualization
  const lineCoordinates: [number, number][] = [
    [-85.30825029306017, 35.045775324733555],
    [-85.30784442216404, 35.04562375468416]
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
distanceInterval: 1, // Update every meter
timeInterval: 1000 // Update every second
          },
          (location) => {
            updateCount++;
            const { latitude, longitude, heading } = location.coords;
            
            // Capture GPS heading independently
            if (heading !== null && heading !== undefined) {
              setGpsHeading(heading);
              setLastKnownHeading(heading);
              
              // Log heading updates
              if (updateCount % 5 === 1) {
                console.log(`🧭 GPS Heading: ${heading.toFixed(1)}° (Fixed to GPS)`);
              }
            }
            
            // Log GPS updates less frequently
            if (updateCount % 10 === 1) {
              console.log(`GPS: [${latitude.toFixed(6)}, ${longitude.toFixed(6)}] (Update #${updateCount})`);
            }
            
            // Update DirectionGuide with live GPS
            directionGuideViewModel.setVehiclePosition([latitude, longitude]);
            
            // Update other components
            if (activeDetector && 'setVehiclePosition' in activeDetector) {
              activeDetector.setVehiclePosition([latitude, longitude]);
            }
            
            // Update map for blue marker (without heading to avoid conflicts)
            mapViewModel.setUserLocation({
              latitude,
              longitude,
              heading: undefined // Don't pass heading to avoid map-based rotation
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
          animationDuration={1000}
          // Don't set bearing - let user control map rotation independently
        />

        {/* User Location Marker with Fixed GPS Heading */}
        {userLocationCoordinate[0] !== 0 && userLocationCoordinate[1] !== 0 && (
          <MapboxGL.PointAnnotation
            id="vehicle-position"
            coordinate={userLocationCoordinate}
            anchor={{x: 0.5, y: 0.5}}
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

        {/* Simple Blue Line */}
        <SimpleLine 
          coordinates={lineCoordinates} 
          lineColor="#0066FF" 
          lineWidth={3} 
        />

        {/* SDSM Vehicle Markers (Main Feature - FROM SDSM FOLDER ONLY) */}
        {mainViewModel?.vehicleDisplayViewModel && (
          <VehicleMarkers viewModel={mainViewModel.vehicleDisplayViewModel} />
        )}

      {testingVehicleDisplayViewModel && (
  <VehicleMarkers viewModel={testingVehicleDisplayViewModel as unknown as VehicleDisplayViewModel} />
)}

        
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
      
      {/* Pedestrian warning */}
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