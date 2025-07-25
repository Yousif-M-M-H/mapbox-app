// app/src/testingFeatures/testingPedestrianDetectorFeatureTest/viewmodels/TestingPedestrianDetectorViewModel.ts
import { makeAutoObservable, action, runInAction } from 'mobx';
import { CROSSWALK_POLYGON_COORDS } from '../../../features/Crosswalk/constants/CrosswalkCoordinates';
import { TESTING_CONFIG } from '../../TestingConfig';

const TESTING_PROXIMITY_WARNING_DISTANCE = 0.0003; // ~30 meters for testing

export interface TestingPedestrianData {
  id: number;
  coordinates: [number, number]; // [latitude, longitude]
  timestamp: string;
  heading?: number;
  speed?: number;
}

interface DetectionLatencyTest {
  hasRunTest: boolean;
  zoneEntryTime: number | null;
  detectionTime: number | null;
  latencyResult: number | null;
}

export class TestingPedestrianDetectorViewModel {
  // Observable state
  isMonitoring = false;
  pedestriansInCrosswalk = 0;
  pedestrians: TestingPedestrianData[] = [];

  // Private state
  private _vehiclePosition: [number, number] = [0, 0];
  private monitoringInterval: NodeJS.Timeout | null = null;
  private detectionLatencyTest: DetectionLatencyTest = {
    hasRunTest: false,
    zoneEntryTime: null,
    detectionTime: null,
    latencyResult: null
  };
  private previouslyInZone = false;

  constructor() {
    makeAutoObservable(this);
    this.setupFixedPedestrianData();
    console.log('🧪 TestingPedestrianDetectorViewModel initialized');
  }

  // Getters
  get vehiclePosition(): [number, number] {
    return this._vehiclePosition;
  }

  get isVehicleNearPedestrian(): boolean {
    return this.pedestrians.some(pedestrian =>
      this.isVehicleCloseToPosition(pedestrian.coordinates)
    );
  }

  // Actions
  setVehiclePosition = action((position: [number, number]): void => {
    this._vehiclePosition = position;
    this.checkConditions();
  });

  startMonitoring = action((): void => {
    if (this.isMonitoring) return;
    this.isMonitoring = true;
    this.setupFixedPedestrianData();
    this.monitoringInterval = setInterval(() => {
      this.checkConditions();
      this.runDetectionLatencyTest();
    }, 100);
  });

  stopMonitoring = action((): void => {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.isMonitoring = false;
    console.log('🧪 Stopped testing mode monitoring');
  });

  cleanup = action((): void => {
    this.stopMonitoring();
    console.log('🧪 ViewModel cleaned up');
  });

  // --- Detection Latency Logic ---

  private runDetectionLatencyTest(): void {
    if (this.detectionLatencyTest.hasRunTest || this.pedestrians.length === 0) return;
    const pedestrian = this.pedestrians[0];
    const isCurrentlyInZone = this.isPointInCrosswalk(pedestrian.coordinates);
    // Step 1: Track zone entry
    if (!this.previouslyInZone && isCurrentlyInZone) {
      this.detectionLatencyTest.zoneEntryTime = performance.now();
      console.log('🔍 ZONE ENTRY: Pedestrian entered detection zone');
    }
    // Step 2: Track detection
    if (
      this.detectionLatencyTest.zoneEntryTime &&
      this.pedestriansInCrosswalk > 0 &&
      !this.detectionLatencyTest.detectionTime
    ) {
      this.detectionLatencyTest.detectionTime = performance.now();
      const latency = this.detectionLatencyTest.detectionTime - this.detectionLatencyTest.zoneEntryTime;
      this.detectionLatencyTest.latencyResult = latency;
      this.detectionLatencyTest.hasRunTest = true;
      this.logDetectionLatencyResult(latency);
    }
    this.previouslyInZone = isCurrentlyInZone;
  }

  private logDetectionLatencyResult(latency: number): void {
    console.log(`\n🎯 ======= DETECTION LATENCY TEST RESULT =======`);
    console.log(`🎯 Detection Latency: ${latency.toFixed(2)}ms`);
    console.log(`🎯 Zone Entry Time: ${this.detectionLatencyTest.zoneEntryTime?.toFixed(2)}ms`);
    console.log(`🎯 Detection Time: ${this.detectionLatencyTest.detectionTime?.toFixed(2)}ms`);
    console.log('🎯 Test completed successfully!');
    console.log('🎯 =============================================\n');
  }

  // --- Public API for test results ---

  public getDetectionLatencyResult(): number | null {
    return this.detectionLatencyTest.latencyResult;
  }

  public hasCompletedDetectionLatencyTest(): boolean {
    return this.detectionLatencyTest.hasRunTest;
  }

  // --- Pedestrian Data Management ---

  private setupFixedPedestrianData(): void {
    const fixedPedestrianData: TestingPedestrianData = {
      id: 99999,
      coordinates: [35.04574821897141, -85.30823649580637],
      timestamp: new Date().toISOString(),
      heading: 0,
      speed: 0
    };
    runInAction(() => {
      this.pedestrians = [fixedPedestrianData];
    });
    console.log('🧪 Fixed pedestrian data set up');
  }

  // --- Crosswalk & Proximity Logic ---

  getPedestriansInCrosswalk(): TestingPedestrianData[] {
    return this.pedestrians.filter(p => this.isPointInCrosswalk(p.coordinates));
  }

  private isPointInCrosswalk(coordinates: [number, number]): boolean {
    try {
      return this.isPointInPolygon(coordinates, CROSSWALK_POLYGON_COORDS);
    } catch {
      return false;
    }
  }

  private isPointInPolygon(point: [number, number], polygon: [number, number][]): boolean {
    const [pointLat, pointLng] = point;
    let inside = false;
    // Convert polygon from [lng, lat] to [lat, lng]
    const vertices: [number, number][] = polygon.map(([lng, lat]) => [lat, lng]);
    // Remove duplicate last point if exists
    const cleanVertices = vertices.length > 0 &&
      vertices[0][0] === vertices[vertices.length - 1][0] &&
      vertices[0][1] === vertices[vertices.length - 1][1]
      ? vertices.slice(0, -1)
      : vertices;
    for (let i = 0, j = cleanVertices.length - 1; i < cleanVertices.length; j = i++) {
      const [latI, lngI] = cleanVertices[i];
      const [latJ, lngJ] = cleanVertices[j];
      if (((latI > pointLat) !== (latJ > pointLat)) &&
        (pointLng < (lngJ - lngI) * (pointLat - latI) / (latJ - latI) + lngI)) {
        inside = !inside;
      }
    }
    return inside;
  }

  private isVehicleCloseToPosition(pedestrianPosition: [number, number]): boolean {
    try {
      return this.distanceBetweenPoints(
        pedestrianPosition[0], pedestrianPosition[1],
        this._vehiclePosition[0], this._vehiclePosition[1]
      ) <= TESTING_PROXIMITY_WARNING_DISTANCE;
    } catch {
      return false;
    }
  }

  private distanceBetweenPoints(
    lat1: number, lon1: number,
    lat2: number, lon2: number
  ): number {
    return Math.sqrt(
      Math.pow(lat2 - lat1, 2) +
      Math.pow(lon2 - lon1, 2)
    );
  }

  // --- Main crosswalk check ---

  checkConditions(): void {
    const count = this.pedestrians.filter(p => this.isPointInCrosswalk(p.coordinates)).length;
    runInAction(() => {
      this.pedestriansInCrosswalk = count;
    });
  }
}
