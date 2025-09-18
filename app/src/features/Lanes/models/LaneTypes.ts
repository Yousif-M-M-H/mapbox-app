// app/src/features/Lanes/models/LaneTypes.ts

export interface Lane {
  id: string;
  name: string;
  coordinates: [number, number][]; // [longitude, latitude] format for Mapbox
  visible: boolean;
}

export interface LaneStyle {
  color: string;
  width: number;
  opacity?: number;
  lineCap?: 'round' | 'square' | 'butt';
  lineJoin?: 'round' | 'bevel' | 'miter';
}

export interface LaneConfiguration {
  lanes: Lane[];
  defaultStyle: LaneStyle;
  visible: boolean;
}