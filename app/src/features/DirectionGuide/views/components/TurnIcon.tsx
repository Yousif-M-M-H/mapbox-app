// app/src/features/DirectionGuide/views/components/TurnIcon.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';

// Traffic signal states for turns
export enum TurnSignalState {
  ALLOWED = 'allowed',     // Green
  PROHIBITED = 'prohibited', // Red
  WARNING = 'warning',     // Yellow/Amber
}

// Turn icon configurations
export interface TurnIconConfig {
  leftTurn: TurnSignalState;
  straightTurn: TurnSignalState;
  size?: number;
}

// Predefined turn icon variants for easy use
export const TURN_ICON_VARIANTS = {
  // Both allowed (green)
  BOTH_ALLOWED: {
    leftTurn: TurnSignalState.ALLOWED,
    straightTurn: TurnSignalState.ALLOWED,
  },
  
  // Both prohibited (red)
  BOTH_PROHIBITED: {
    leftTurn: TurnSignalState.PROHIBITED,
    straightTurn: TurnSignalState.PROHIBITED,
  },
  
  // Both warning (yellow)
  BOTH_WARNING: {
    leftTurn: TurnSignalState.WARNING,
    straightTurn: TurnSignalState.WARNING,
  },
  
  // Left allowed, straight prohibited
  LEFT_ONLY: {
    leftTurn: TurnSignalState.ALLOWED,
    straightTurn: TurnSignalState.PROHIBITED,
  },
  
  // Straight allowed, left prohibited
  STRAIGHT_ONLY: {
    leftTurn: TurnSignalState.PROHIBITED,
    straightTurn: TurnSignalState.ALLOWED,
  },
  
  // Left warning, straight allowed
  LEFT_WARNING_STRAIGHT_ALLOWED: {
    leftTurn: TurnSignalState.WARNING,
    straightTurn: TurnSignalState.ALLOWED,
  },
  
  // Left allowed, straight warning
  LEFT_ALLOWED_STRAIGHT_WARNING: {
    leftTurn: TurnSignalState.ALLOWED,
    straightTurn: TurnSignalState.WARNING,
  },
  
  // Left warning, straight prohibited
  LEFT_WARNING_STRAIGHT_PROHIBITED: {
    leftTurn: TurnSignalState.WARNING,
    straightTurn: TurnSignalState.PROHIBITED,
  },
  
  // Left prohibited, straight warning
  LEFT_PROHIBITED_STRAIGHT_WARNING: {
    leftTurn: TurnSignalState.PROHIBITED,
    straightTurn: TurnSignalState.WARNING,
  },
} as const;

interface TurnIconProps extends TurnIconConfig {}

export const TurnIcon: React.FC<TurnIconProps> = ({
  leftTurn,
  straightTurn,
  size = 50,
}) => {
  // Get colors based on signal state
  const getStateColor = (state: TurnSignalState): string => {
    switch (state) {
      case TurnSignalState.ALLOWED:
        return '#22c55e'; // Green
      case TurnSignalState.PROHIBITED:
        return '#ef4444'; // Red
      case TurnSignalState.WARNING:
        return '#f59e0b'; // Amber/Yellow
      default:
        return '#6b7280'; // Gray fallback
    }
  };

  const leftColor = getStateColor(leftTurn);
  const straightColor = getStateColor(straightTurn);

  // Arrowhead helper: given tip (tx, ty) and angle (deg), returns triangle path
  const triangle = (tx: number, ty: number, angleDeg: number, scale = 1) => {
    const w = 6 * scale; // length
    const h = 4 * scale; // half height
    const pts = [
      [0, 0],
      [w, -h],
      [w, h],
    ];

    const rad = (Math.PI / 180) * angleDeg;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    const rot = pts.map(([x, y]) => [
      tx + x * cos - y * sin,
      ty + x * sin + y * cos,
    ]);

    return `M ${rot[0][0]},${rot[0][1]} L ${rot[1][0]},${rot[1][1]} L ${rot[2][0]},${rot[2][1]} Z`;
  };

  // Straight arrow: line from (25,40) to (25,12), head points up (-90° from +x is 270°, or -90)
  const straightHead = triangle(25, 5, -270, 1.3);

  // Left curve: simple quad curve to (10,25), approximate head pointing left (180°)
  const leftHead = triangle(2, 25, -360, 1.3);

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox="0 0 50 50">
        {/* Straight shaft */}
        <Path
          d="M25 40 L25 12"
          stroke={straightColor}
          strokeWidth={4}
          strokeLinecap="round"
          fill="none"
        />
        {/* Straight head */}
        <Path d={straightHead} fill={straightColor} />

        {/* Left curved shaft */}
        <Path
          d="M25 40 Q25 25 10 25"
          stroke={leftColor}
          strokeWidth={4}
          strokeLinecap="round"
          fill="none"
        />
        {/* Left head */}
        <Path d={leftHead} fill={leftColor} />

        {/* Start dot */}
        <Circle cx={25} cy={40} r={3} fill="#666" />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
});

// ========================================
// Convenience Components for Common States
// ========================================

// Basic green/red combinations
export const BothAllowedTurnIcon: React.FC<{ size?: number }> = ({ size = 50 }) => (
  <TurnIcon {...TURN_ICON_VARIANTS.BOTH_ALLOWED} size={size} />
);

export const BothProhibitedTurnIcon: React.FC<{ size?: number }> = ({ size = 50 }) => (
  <TurnIcon {...TURN_ICON_VARIANTS.BOTH_PROHIBITED} size={size} />
);

export const LeftOnlyTurnIcon: React.FC<{ size?: number }> = ({ size = 50 }) => (
  <TurnIcon {...TURN_ICON_VARIANTS.LEFT_ONLY} size={size} />
);

export const StraightOnlyTurnIcon: React.FC<{ size?: number }> = ({ size = 50 }) => (
  <TurnIcon {...TURN_ICON_VARIANTS.STRAIGHT_ONLY} size={size} />
);

// Yellow/warning combinations
export const BothWarningTurnIcon: React.FC<{ size?: number }> = ({ size = 50 }) => (
  <TurnIcon {...TURN_ICON_VARIANTS.BOTH_WARNING} size={size} />
);

export const LeftWarningTurnIcon: React.FC<{ size?: number }> = ({ size = 50 }) => (
  <TurnIcon {...TURN_ICON_VARIANTS.LEFT_WARNING_STRAIGHT_ALLOWED} size={size} />
);

export const StraightWarningTurnIcon: React.FC<{ size?: number }> = ({ size = 50 }) => (
  <TurnIcon {...TURN_ICON_VARIANTS.LEFT_ALLOWED_STRAIGHT_WARNING} size={size} />
);

export const LeftWarningOnlyTurnIcon: React.FC<{ size?: number }> = ({ size = 50 }) => (
  <TurnIcon {...TURN_ICON_VARIANTS.LEFT_WARNING_STRAIGHT_PROHIBITED} size={size} />
);

export const StraightWarningOnlyTurnIcon: React.FC<{ size?: number }> = ({ size = 50 }) => (
  <TurnIcon {...TURN_ICON_VARIANTS.LEFT_PROHIBITED_STRAIGHT_WARNING} size={size} />
);

// ========================================
// Traffic Signal Integration Helper
// ========================================

/**
 * Helper function to convert traffic signal data to turn icon config
 * Enhanced to support warning states
 */
export const createTurnConfigFromSignals = (
  leftSignalAllowed: boolean,
  straightSignalAllowed: boolean,
  leftSignalWarning?: boolean,
  straightSignalWarning?: boolean
): TurnIconConfig => {
  const getSignalState = (allowed: boolean, warning?: boolean): TurnSignalState => {
    if (warning) return TurnSignalState.WARNING;
    return allowed ? TurnSignalState.ALLOWED : TurnSignalState.PROHIBITED;
  };

  return {
    leftTurn: getSignalState(leftSignalAllowed, leftSignalWarning),
    straightTurn: getSignalState(straightSignalAllowed, straightSignalWarning),
  };
};

// ========================================
// Usage Examples in Comments
// ========================================

/*
// Basic usage with custom states:
<TurnIcon 
  leftTurn={TurnSignalState.WARNING} 
  straightTurn={TurnSignalState.ALLOWED} 
  size={60} 
/>

// Using predefined variants:
<LeftOnlyTurnIcon size={60} />
<StraightOnlyTurnIcon size={60} />
<BothAllowedTurnIcon size={60} />
<BothProhibitedTurnIcon size={60} />
<BothWarningTurnIcon size={60} />
<LeftWarningTurnIcon size={60} />
<StraightWarningTurnIcon size={60} />
<LeftWarningOnlyTurnIcon size={60} />
<StraightWarningOnlyTurnIcon size={60} />

// Creating from traffic signal data:
const config = createTurnConfigFromSignals(
  isLeftAllowed, 
  isStraightAllowed, 
  isLeftWarning, 
  isStraightWarning
);
<TurnIcon {...config} size={60} />
*/