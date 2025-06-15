// app/src/features/SpatService/views/SpatComponents.tsx

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SignalState } from '../models/SpatModels';

// ========================================
// Signal Icon Component
// ========================================

interface SpatIconProps {
  signalState: SignalState;
  size?: 'sm' | 'md' | 'lg';
  style?: any;
}

export const SpatIcon: React.FC<SpatIconProps> = ({ 
  signalState, 
  size = 'sm',
  style = {} 
}) => {
  const getSizeStyle = () => {
    switch (size) {
      case 'sm': return { width: 12, height: 12 };
      case 'md': return { width: 16, height: 16 };
      case 'lg': return { width: 24, height: 24 };
      default: return { width: 12, height: 12 };
    }
  };

  const getSignalStyle = () => {
    switch (signalState) {
      case SignalState.GREEN:
        return { backgroundColor: '#22c55e' };
      case SignalState.YELLOW:
        return { backgroundColor: '#eab308' };
      case SignalState.RED:
        return { backgroundColor: '#ef4444' };
      default:
        return { backgroundColor: '#9ca3af' };
    }
  };

  return (
    <View 
      style={[
        styles.spatIcon,
        getSizeStyle(),
        getSignalStyle(),
        style
      ]}
    />
  );
};

// ========================================
// Signal Status Badge
// ========================================

interface SpatStatusBadgeProps {
  signalState: SignalState;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const SpatStatusBadge: React.FC<SpatStatusBadgeProps> = ({ 
  signalState, 
  showText = false,
  size = 'sm'
}) => {
  const getStatusText = () => {
    switch (signalState) {
      case SignalState.GREEN: return 'GO';
      case SignalState.YELLOW: return 'CAUTION';
      case SignalState.RED: return 'STOP';
      default: return '';
    }
  };

  const getTextColor = () => {
    switch (signalState) {
      case SignalState.GREEN: return '#22c55e';
      case SignalState.YELLOW: return '#eab308';
      case SignalState.RED: return '#ef4444';
      default: return '#9ca3af';
    }
  };

  return (
    <View style={styles.statusBadge}>
      <SpatIcon signalState={signalState} size={size} />
      {showText && (
        <Text style={[styles.statusText, { color: getTextColor() }]}>
          {getStatusText()}
        </Text>
      )}
    </View>
  );
};

// ========================================
// Signal Status Display
// ========================================

interface SpatStatusDisplayProps {
  signalState: SignalState;
  approachName?: string;
  lastUpdate?: number;
  style?: any;
}

export const SpatStatusDisplay: React.FC<SpatStatusDisplayProps> = ({
  signalState,
  approachName,
  lastUpdate,
  style = {}
}) => {
  const getBackgroundColor = () => {
    switch (signalState) {
      case SignalState.GREEN: return '#f0fdf4';
      case SignalState.YELLOW: return '#fefce8';
      case SignalState.RED: return '#fef2f2';
      default: return '#f9fafb';
    }
  };

  const getBorderColor = () => {
    switch (signalState) {
      case SignalState.GREEN: return '#bbf7d0';
      case SignalState.YELLOW: return '#fef08a';
      case SignalState.RED: return '#fecaca';
      default: return '#e5e7eb';
    }
  };

  const formatLastUpdate = () => {
    if (!lastUpdate) return '';
    const seconds = Math.floor((Date.now() - lastUpdate) / 1000);
    return `${seconds}s ago`;
  };

  return (
    <View style={[
      styles.statusDisplay,
      { 
        backgroundColor: getBackgroundColor(),
        borderColor: getBorderColor()
      },
      style
    ]}>
      <View style={styles.statusHeader}>
        <View style={styles.statusLeft}>
          <SpatIcon signalState={signalState} size="md" />
          <View style={styles.statusTextContainer}>
            <Text style={styles.statusMainText}>
              {signalState === SignalState.UNKNOWN ? 'No Signal Data' : 
               `Signal: ${signalState}`}
            </Text>
            {approachName && (
              <Text style={styles.statusSubText}>{approachName}</Text>
            )}
          </View>
        </View>
        
        {lastUpdate && (
          <Text style={styles.statusTime}>
            {formatLastUpdate()}
          </Text>
        )}
      </View>
    </View>
  );
};

// ========================================
// Styles
// ========================================

const styles = StyleSheet.create({
  spatIcon: {
    borderRadius: 50,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  statusDisplay: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusTextContainer: {
    marginLeft: 8,
    flex: 1,
  },
  statusMainText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  statusSubText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  statusTime: {
    fontSize: 10,
    color: '#9ca3af',
  },
});