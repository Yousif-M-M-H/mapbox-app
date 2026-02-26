import { makeAutoObservable, runInAction } from 'mobx';
import type { SpatZone } from '../../SpatService/services/SpatZoneService';
import { SpatZoneService } from '../../SpatService/services/SpatZoneService';
import type {
  PreemptionPayloadPreview,
  PreemptionZoneConfig,
} from '../models/PreemptionModels';
import { PreemptionApiService } from '../services/PreemptionApiService';
import { PreemptionConfigService } from '../services/PreemptionConfigService';

export class PreemptionViewModel {
  isButtonVisible = false;
  isLoading = false;
  error: string | null = null;
  config: PreemptionZoneConfig | null = null;
  payloadPreview: PreemptionPayloadPreview | null = null;
  activeRequestId: number | null = null;
  activeRequestZoneId: string | null = null;

  private previousPosition: [number, number] | null = null;
  private currentPosition: [number, number] = [0, 0];
  private gateOpen = false;
  private trackedZoneId: string | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  get configuredZoneId(): string | null {
    return this.config?.spatZoneId ?? null;
  }

  get configuredZoneName(): string {
    return this.config?.zoneName ?? '';
  }

  async loadZoneConfig(intersectionNumber: number): Promise<void> {
    runInAction(() => {
      this.isLoading = true;
      this.error = null;
    });

    try {
      const config =
        await PreemptionConfigService.fetchZoneConfigByIntersectionNumber(
          intersectionNumber,
        );

      runInAction(() => {
        this.config = config;
        this.isLoading = false;
        this.error = null;
      });

      this.resetTracking();
    } catch (error) {
      runInAction(() => {
        this.config = null;
        this.isLoading = false;
        this.error =
          error instanceof Error ? error.message : 'Failed to load preemption config';
      });
      this.resetTracking();
    }
  }

  syncPosition(
    currentPosition: [number, number],
    configuredZone: SpatZone | null,
  ): void {
    const previousVisibility = this.isButtonVisible;

    if (
      !this.config ||
      !configuredZone ||
      !Number.isFinite(currentPosition[0]) ||
      !Number.isFinite(currentPosition[1]) ||
      (currentPosition[0] === 0 && currentPosition[1] === 0)
    ) {
      this.isButtonVisible = false;
      this.maybeSendCancellation(configuredZone, previousVisibility);
      this.previousPosition = currentPosition;
      return;
    }

    if (configuredZone.id !== this.trackedZoneId) {
      this.trackedZoneId = configuredZone.id;
      this.gateOpen = false;
      this.previousPosition = null;
    }

    const previousPosition = this.previousPosition;
    const hasEntryExitLines =
      Array.isArray(configuredZone.entryLine) &&
      configuredZone.entryLine.length === 2 &&
      Array.isArray(configuredZone.exitLine) &&
      configuredZone.exitLine.length === 2;

    if (
      hasEntryExitLines &&
      previousPosition &&
      previousPosition[0] !== 0 &&
      previousPosition[1] !== 0
    ) {
      const crossedEntry = SpatZoneService.crossesEntryLine(
        previousPosition,
        currentPosition,
        configuredZone,
      );
      const crossedExit = SpatZoneService.crossesExitLine(
        previousPosition,
        currentPosition,
        configuredZone,
      );

      if (crossedEntry && crossedExit) {
        this.gateOpen = SpatZoneService.isPointInZone(currentPosition, configuredZone);
      } else if (crossedEntry) {
        this.gateOpen = true;
      } else if (crossedExit) {
        this.gateOpen = false;
      }
    }

    const isInsideZone = SpatZoneService.isPointInZone(
      currentPosition,
      configuredZone,
    );
    this.isButtonVisible = hasEntryExitLines ? isInsideZone && this.gateOpen : isInsideZone;
    this.maybeSendCancellation(configuredZone, previousVisibility);
    this.previousPosition = currentPosition;
    this.currentPosition = currentPosition;
  }

  requestPriority(zone: SpatZone | null): void {
    if (!this.config || !zone) {
      this.error = 'Preemption zone is not configured.';
      return;
    }

    this.payloadPreview = PreemptionApiService.buildRequestPreview({
      intersectionNumber: this.config.intersectionNumber,
      zone,
      position: this.currentPosition,
    });
    this.activeRequestId =
      this.payloadPreview.payload.requests[0].request.requestID;
    this.activeRequestZoneId = zone.id;
    console.log('[Preemption] POST endpoint:', this.payloadPreview.endpoint);
    console.log(
      '[Preemption] POST payload:',
      JSON.stringify(this.payloadPreview.payload),
    );
  }

  private maybeSendCancellation(
    zone: SpatZone | null,
    previousVisibility: boolean,
  ): void {
    if (!previousVisibility || this.isButtonVisible) return;
    if (!this.activeRequestId || !this.config) return;
    const targetZone =
      zone ??
      (this.activeRequestZoneId
        ? SpatZoneService.findZoneById(this.activeRequestZoneId)
        : null);
    if (!targetZone) return;

    const cancelPreview = PreemptionApiService.buildRequestPreview({
      intersectionNumber: this.config.intersectionNumber,
      zone: targetZone,
      position: this.currentPosition,
      options: {
        requestType: 'priorityCancellation',
        requestId: this.activeRequestId,
      },
    });

    this.payloadPreview = cancelPreview;
    console.log('[Preemption] Auto-cancel endpoint:', cancelPreview.endpoint);
    console.log('[Preemption] Auto-cancel payload:', JSON.stringify(cancelPreview.payload));
    this.activeRequestId = null;
    this.activeRequestZoneId = null;
  }

  private resetTracking(): void {
    this.isButtonVisible = false;
    this.previousPosition = null;
    this.gateOpen = false;
    this.trackedZoneId = null;
    this.activeRequestId = null;
    this.activeRequestZoneId = null;
  }
}
