// app/src/features/Map/views/components/HeadingDisplay.tsx

import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { HeadingService } from '../../services/HeadingService';

interface HeadingDisplayProps {
  showDebug?: boolean;
}

export const HeadingDisplay: React.FC<HeadingDisplayProps> = ({ showDebug = true }) => {
  const [heading, setHeading] = useState<number>(0);
  const [cardinal, setCardinal] = useState<string>('N');
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [isTracking, setIsTracking] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check if heading is in Lane 4/5 range (200-250°)
  const isInLane45Range = heading >= 200 && heading <= 250;
  // Check if heading is in Lane 10/11 range (100-190°)
  const isInLane1011Range = heading >= 100 && heading <= 190;

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    const initHeading = async () => {
      try {
        await HeadingService.startTracking();
        setIsTracking(true);
        setError(null);

        unsubscribe = HeadingService.subscribe((headingData) => {
          const roundedHeading = Math.round(headingData.heading);
          setHeading(roundedHeading);
          setCardinal(HeadingService.getCardinalDirection(roundedHeading));

          setIsUpdating(true);

          Animated.sequence([
            Animated.timing(pulseAnim, {
              toValue: 1,
              duration: 100,
              useNativeDriver: true,
            }),
            Animated.timing(pulseAnim, {
              toValue: 0,
              duration: 100,
              useNativeDriver: true,
            }),
          ]).start();

          if (updateTimeoutRef.current) {
            clearTimeout(updateTimeoutRef.current);
          }
          updateTimeoutRef.current = setTimeout(() => {
            setIsUpdating(false);
          }, 300);
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to track heading');
        setIsTracking(false);
      }
    };

    initHeading();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, []);

  const pulseScale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.3],
  });

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorLabel}>HEADING</Text>
        <Text style={styles.errorText}>Error</Text>
      </View>
    );
  }

  if (!isTracking) {
    return (
      <View style={styles.container}>
        <Text style={styles.label}>HEADING</Text>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.label}>HEADING</Text>
        <Animated.View
          style={[
            styles.updateIndicator,
            {
              backgroundColor: isUpdating ? '#22c55e' : '#9ca3af',
              transform: [{ scale: pulseScale }],
            },
          ]}
        />
      </View>
      <View style={styles.headingRow}>
        <Text style={styles.heading}>{heading}°</Text>
        <Text style={styles.cardinal}>{cardinal}</Text>
      </View>
      {showDebug && (
        <View style={styles.debugRow}>
          {isInLane45Range && (
            <Text style={styles.debugBadge}>L4/5 ✓</Text>
          )}
          {isInLane1011Range && (
            <Text style={styles.debugBadge}>L10/11 ✓</Text>
          )}
          {!isInLane45Range && !isInLane1011Range && (
            <Text style={styles.debugBadgeInactive}>No Match</Text>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    borderWidth: 0.5,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    minWidth: 95,
    zIndex: 999,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  label: {
    fontSize: 9,
    fontWeight: '600',
    color: '#6b7280',
    letterSpacing: 0.5,
  },
  updateIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  headingRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
  },
  heading: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    letterSpacing: 0.3,
  },
  cardinal: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6b7280',
    marginLeft: 4,
  },
  loadingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    textAlign: 'center',
  },
  errorLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: '#ef4444',
    letterSpacing: 0.5,
    marginBottom: 2,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ef4444',
    textAlign: 'center',
  },
  debugRow: {
    marginTop: 4,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
    alignItems: 'center',
  },
  debugBadge: {
    fontSize: 9,
    fontWeight: '700',
    color: '#22c55e',
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  debugBadgeInactive: {
    fontSize: 9,
    fontWeight: '600',
    color: '#9ca3af',
    backgroundColor: 'rgba(156, 163, 175, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
});
