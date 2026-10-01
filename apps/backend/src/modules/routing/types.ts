/**
 * Routing and Navigation Type Definitions
 * Aligned with docs/API_CONTRACT.md and docs/playbook/xavier.md
 */

export type TrafficStatus = 'Light' | 'Moderate' | 'Heavy';

export interface DrivingRoute {
  polyline: string;
  distanceMeters: number;
  durationMinutes: number;
  trafficStatus: TrafficStatus;
  summary?: string;
  alternatives?: DrivingRoute[];
}

export interface WalkingRoute {
  polyline: string;
  distanceMeters: number;
  durationMinutes: number;
}

export interface Coordinates {
  lat: number;
  lng: number;
}

