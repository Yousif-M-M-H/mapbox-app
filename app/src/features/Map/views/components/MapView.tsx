// app/src/features/Map/views/components/MapView.tsx

import React, { useEffect, useRef, useState } from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import MapboxGL from "@rnmapbox/maps";
import { observer } from "mobx-react-lite";
import * as Location from "expo-location";
import { MapViewModel } from "../../viewmodels/MapViewModel";
import { PedestrianDetectorViewModel } from "../../../PedestrianDetector/viewmodels/PedestrianDetectorViewModel";
import { TestingPedestrianDetectorViewModel } from "../../../../testingFeatures/testingPedestrianDetectorFeatureTest/viewmodels/TestingPedestrianDetectorViewModel";
import { VehicleDisplayViewModel } from "../../../SDSM/viewmodels/VehicleDisplayViewModel";
import { DirectionGuideViewModel } from "../../../DirectionGuide/viewModels/DirectionGuideViewModel";
import { TurnGuideDisplay } from "../../../DirectionGuide/views/components/TurnGuideDisplay";
import { SpatViewModel } from "../../../SpatService/viewModels/SpatViewModel";
import { VehicleMarkers } from "../../../SDSM/views/VehicleMarkers";
import { VRUMarkers } from "../../../SDSM/views/VRUMarkers";
import { TestingModeOverlay } from "../../../../testingFeatures/testingUI";
import { LaneOverlay } from "../../../Lanes/views/components/LaneOverlay";
import { LanesViewModel } from "../../../Lanes/viewmodels/LanesViewModel";
import { CROSSWALK_POLYGONS } from "../../../Crosswalk/constants/CrosswalkCoordinates";
import { CrosswalkDetectionService } from "../../../PedestrianDetector/services/CrosswalkDetectionService";
import { ProximityDetectionService } from "../../../PedestrianDetector/services/ProximityDetectionService";
import { TESTING_CONFIG } from "../../../../testingFeatures/TestingConfig";
import { MainViewModel } from "../../../../Main/viewmodels/MainViewModel";

import { MapLegend } from "./MapLegend";
import { MapOverlayMenu } from "./MapOverlayMenu";
import { SearchBar } from "./SearchBar";
import { ZoomControls } from "./mapoverlay/ZoomControls";

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

export const MapViewComponent: React.FC<MapViewProps> = observer(
  ({
    mapViewModel,
    pedestrianDetectorViewModel,
    testingPedestrianDetectorViewModel,
    testingVehicleDisplayViewModel,
    directionGuideViewModel,
    isTestingMode,
    mainViewModel,
    spatViewModel: providedSpatViewModel,
    lanesViewModel: providedLanesViewModel,
    children,
  }) => {
    const mapRef = useRef<MapboxGL.MapView>(null);
    const cameraRef = useRef<MapboxGL.Camera>(null);
    const spatViewModelRef = useRef<SpatViewModel>(new SpatViewModel());
    const lanesViewModelRef = useRef<LanesViewModel>(new LanesViewModel());

    const spatViewModel = providedSpatViewModel || spatViewModelRef.current;
    const lanesViewModel = providedLanesViewModel || lanesViewModelRef.current;

    const [userPosition, setUserPosition] = useState<[number, number]>([
      mapViewModel.userLocation.latitude,
      mapViewModel.userLocation.longitude,
    ]);

    const [isDarkMode, setIsDarkMode] = useState(false);
    const [userHeading, setUserHeading] = useState(0);
    const zoomLevelRef = useRef(17);

    const handleZoomIn = () => {
      zoomLevelRef.current = Math.min(zoomLevelRef.current + 1, 22);
      cameraRef.current?.setCamera({
        zoomLevel: zoomLevelRef.current,
        animationDuration: 300,
      });
    };

    const handleZoomOut = () => {
      zoomLevelRef.current = Math.max(zoomLevelRef.current - 1, 1);
      cameraRef.current?.setCamera({
        zoomLevel: zoomLevelRef.current,
        animationDuration: 300,
      });
    };

    const handleLocateUser = () => {
      if (userPosition[0] !== 0 && userPosition[1] !== 0) {
        cameraRef.current?.setCamera({
          centerCoordinate: [userPosition[1], userPosition[0]],
          zoomLevel: 17,
          animationDuration: 600,
        });
        zoomLevelRef.current = 17;
      }
    };
    const [mapLayer, setMapLayer] = useState<"outdoors" | "satellite" | "streets">("outdoors");

    const cycleMapLayer = () => {
      setMapLayer((prev) => {
        if (prev === "outdoors") return "satellite";
        if (prev === "satellite") return "streets";
        return "outdoors";
      });
    };

    const MAP_STYLE_URLS = {
      outdoors: "mapbox://styles/mapbox/outdoors-v12",
      satellite: "mapbox://styles/mapbox/satellite-streets-v12",
      streets: "mapbox://styles/mapbox/streets-v12",
      dark: "mapbox://styles/mapbox/dark-v11",
    };

    const lastCameraUpdate = useRef<number>(0);
    const CAMERA_UPDATE_THROTTLE = 2000;

    const activeDetector = isTestingMode
      ? testingPedestrianDetectorViewModel
      : pedestrianDetectorViewModel;
    const SHOW_SDSM_VEHICLES = true;

    const shouldShowSDSMForViewModel = (
      viewModel: VehicleDisplayViewModel,
    ): boolean => {
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

      if (activeDetector && "setVehiclePosition" in activeDetector) {
        activeDetector.setVehiclePosition(position);
      }

      mapViewModel.setUserLocation({
        latitude: position[0],
        longitude: position[1],
        heading: undefined,
      });
    };

    useEffect(() => {
      let locationSubscription: Location.LocationSubscription;

      const setupLocationTracking = async () => {
        try {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status !== "granted") {
            return;
          }

          locationSubscription = await Location.watchPositionAsync(
            {
              accuracy: Location.Accuracy.BestForNavigation,
              distanceInterval: 1,
              timeInterval: 100,
            },
            (location) => {
              const { latitude, longitude, heading } = location.coords;
              const newPosition: [number, number] = [latitude, longitude];

              setUserPosition(newPosition);
              updateAllViewModels(newPosition);
              updateCameraPosition(newPosition);

              if (heading != null && heading >= 0) {
                setUserHeading(heading);
              }
            },
          );

          if (activeDetector && "startMonitoring" in activeDetector) {
            activeDetector.startMonitoring();
          }
        } catch (error) {
          // Silent error handling
        }
      };

      setupLocationTracking();

      return () => {
        if (locationSubscription) {
          locationSubscription.remove();
        }
        if (activeDetector && "stopMonitoring" in activeDetector) {
          activeDetector.stopMonitoring();
        }
      };
    }, [
      directionGuideViewModel,
      activeDetector,
      mapViewModel,
      isTestingMode,
      spatViewModel,
    ]);

    useEffect(() => {
      if (!activeDetector) return;

      let allVRUs: any[] = [];

      if (TESTING_CONFIG.ENABLE_SDSM_API) {
        const vehicleDisplayVM =
          mainViewModel?.vehicleDisplayViewModel ||
          testingVehicleDisplayViewModel;
        if (vehicleDisplayVM?.vrus) {
          if (shouldShowSDSMForViewModel(vehicleDisplayVM)) {
            allVRUs = [...allVRUs, ...vehicleDisplayVM.vrus];
          }
        }
      }

      if (
        TESTING_CONFIG.SHOW_FIXED_PEDESTRIAN &&
        testingPedestrianDetectorViewModel?.vrus
      ) {
        allVRUs = [...allVRUs, ...testingPedestrianDetectorViewModel.vrus];
      }

      activeDetector.updateVRUData(allVRUs);
    }, [
      activeDetector,
      mainViewModel?.vehicleDisplayViewModel?.vrus,
      testingVehicleDisplayViewModel?.vrus,
      testingPedestrianDetectorViewModel?.vrus,
      TESTING_CONFIG.ENABLE_SDSM_API,
      TESTING_CONFIG.SHOW_FIXED_PEDESTRIAN,
    ]);

    return (
      <View style={styles.container}>
        <MapLegend />
        <SearchBar isDarkMode={isDarkMode} />
        <ZoomControls
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onLocateUser={handleLocateUser}
        />
        <MapOverlayMenu
          isDarkMode={isDarkMode}
          onToggleDarkMode={() => setIsDarkMode((prev) => !prev)}
          userHeading={userHeading}
          onCycleLayer={cycleMapLayer}
        />

        <MapboxGL.MapView
          ref={mapRef}
          style={styles.map}
          styleURL={isDarkMode ? MAP_STYLE_URLS.dark : MAP_STYLE_URLS[mapLayer]}
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
              id="vehicle-position"
              coordinate={[userPosition[1], userPosition[0]]}
              anchor={{ x: 0.5, y: 0.5 }}
            >
              <View
                style={[
                  styles.userMarkerWrapper,
                  { transform: [{ rotate: `${userHeading}deg` }] },
                ]}
              >
                {/* Directional cone pointing in direction of travel */}
                <View style={styles.directionCone} />
                {/* User icon tinted orange */}
                <Image
                  source={require("@/assets/images/usericon.png")}
                  style={styles.userIcon}
                  resizeMode="contain"
                />
              </View>
            </MapboxGL.PointAnnotation>
          )}

          {mapViewModel.showCrosswalkPolygon &&
            CROSSWALK_POLYGONS.map((polygonCoords, index) => {
              let allVRUs: any[] = [];

              if (TESTING_CONFIG.ENABLE_SDSM_API) {
                const vehicleDisplayVM =
                  mainViewModel?.vehicleDisplayViewModel ||
                  testingVehicleDisplayViewModel;
                if (
                  vehicleDisplayVM?.vrus &&
                  shouldShowSDSMForViewModel(vehicleDisplayVM)
                ) {
                  allVRUs = [...allVRUs, ...vehicleDisplayVM.vrus];
                }
              }

              if (
                TESTING_CONFIG.SHOW_FIXED_PEDESTRIAN &&
                testingPedestrianDetectorViewModel?.vrus
              ) {
                allVRUs = [
                  ...allVRUs,
                  ...testingPedestrianDetectorViewModel.vrus,
                ];
              }

              const pedestriansInThisCrosswalk =
                CrosswalkDetectionService.countPedestriansInSpecificCrosswalk(
                  allVRUs,
                  index,
                );

              const crosswalkPolygon = {
                type: "Feature" as const,
                properties: {
                  crosswalkId: index,
                  name: `Crosswalk ${index + 1}`,
                },
                geometry: {
                  type: "Polygon" as const,
                  coordinates: [polygonCoords],
                },
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
                      fillColor:
                        pedestriansInThisCrosswalk > 0
                          ? "rgba(255, 59, 48, 0.4)"
                          : "rgba(255, 255, 0, 0.4)",
                      fillOutlineColor: "#FFCC00",
                    }}
                  />
                  <MapboxGL.LineLayer
                    id={`crosswalk-polygon-outline-${index}`}
                    style={{
                      lineColor: "#FFCC00",
                      lineWidth: 2,
                    }}
                  />
                </MapboxGL.ShapeSource>
              );
            })}

          <LaneOverlay lanesViewModel={lanesViewModel} />

          {mainViewModel?.vehicleDisplayViewModel &&
            shouldShowSDSMForViewModel(
              mainViewModel.vehicleDisplayViewModel,
            ) && (
              <VehicleMarkers
                viewModel={mainViewModel.vehicleDisplayViewModel}
              />
            )}

          {testingVehicleDisplayViewModel &&
            shouldShowSDSMForViewModel(testingVehicleDisplayViewModel) && (
              <VehicleMarkers viewModel={testingVehicleDisplayViewModel} />
            )}

          {mainViewModel?.vehicleDisplayViewModel &&
            shouldShowSDSMForViewModel(
              mainViewModel.vehicleDisplayViewModel,
            ) && (
              <VRUMarkers
                vrus={mainViewModel.vehicleDisplayViewModel.vrus}
                isActive={mainViewModel.vehicleDisplayViewModel.isActive}
                getMapboxCoordinates={mainViewModel.vehicleDisplayViewModel.getMapboxCoordinates.bind(
                  mainViewModel.vehicleDisplayViewModel,
                )}
              />
            )}

          {testingVehicleDisplayViewModel &&
            shouldShowSDSMForViewModel(testingVehicleDisplayViewModel) && (
              <VRUMarkers
                vrus={testingVehicleDisplayViewModel.vrus}
                isActive={testingVehicleDisplayViewModel.isActive}
                getMapboxCoordinates={testingVehicleDisplayViewModel.getMapboxCoordinates.bind(
                  testingVehicleDisplayViewModel,
                )}
              />
            )}

          {TESTING_CONFIG.SHOW_FIXED_PEDESTRIAN &&
            testingPedestrianDetectorViewModel && (
              <VRUMarkers
                vrus={testingPedestrianDetectorViewModel.vrus}
                isActive={true}
                getMapboxCoordinates={(vru) => [
                  vru.coordinates[1],
                  vru.coordinates[0],
                ]}
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

        {(() => {
          const vehiclePos: [number, number] = [
            userPosition[0],
            userPosition[1],
          ];

          if (userPosition[0] === 0) return null;

          let allVRUs: any[] = [];

          if (TESTING_CONFIG.ENABLE_SDSM_API) {
            const vehicleDisplayVM =
              mainViewModel?.vehicleDisplayViewModel ||
              testingVehicleDisplayViewModel;
            if (
              vehicleDisplayVM?.vrus &&
              shouldShowSDSMForViewModel(vehicleDisplayVM)
            ) {
              allVRUs = [...allVRUs, ...vehicleDisplayVM.vrus];
            }
          }

          if (
            TESTING_CONFIG.SHOW_FIXED_PEDESTRIAN &&
            testingPedestrianDetectorViewModel?.vrus
          ) {
            allVRUs = [...allVRUs, ...testingPedestrianDetectorViewModel.vrus];
          }

          const hasPedestriansNearby = allVRUs.some((vru) => {
            const isPedestrianInCrosswalk =
              CrosswalkDetectionService.isInCrosswalk(vru.coordinates);
            if (!isPedestrianInCrosswalk) return false;

            const isVehicleNearPedestrian =
              ProximityDetectionService.isVehicleCloseToPosition(
                vehiclePos,
                vru.coordinates,
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
  },
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  userMarkerWrapper: {
    alignItems: "center",
  },
  directionCone: {
    width: 0,
    height: 0,
    borderLeftWidth: 9,
    borderRightWidth: 9,
    borderBottomWidth: 18,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: "rgba(255, 140, 0, 0.85)",
    marginBottom: 2,
  },
  userIcon: {
    width: 32,
    height: 40,
    tintColor: "#FF8C00",
  },
  warningContainer: {
    position: "absolute",
    top: 50,
    left: 20,
    right: 20,
    backgroundColor: "rgba(255, 59, 48, 0.9)",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  warningText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
    textAlign: "center",
  },
});
