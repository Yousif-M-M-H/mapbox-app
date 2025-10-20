// app/src/features/Map/components/HeadingDisplay.tsx

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { HeadingService, HeadingData } from '../services/HeadingService';

interface HeadingDisplayProps {
  speed?: number;
  showSpeed?: boolean;
}

export const HeadingDisplay: React.FC<HeadingDisplayProps> = ({ 
  speed = 0, 
  showSpeed = true 
}) => {
  const [headingData, setHeadingData] = useState<HeadingData>({
    heading: 0,
    accuracy: 0,
    timestamp: Date.now()
  });

  useEffect(() => {
    const unsubscribe = HeadingService.subscribe((data) => {
      setHeadingData(data);
    });

    return unsubscribe;
  }, []);

  const direction = HeadingService.getCardinalDirection(headingData.heading);
  const headingDegrees = Math.round(headingData.heading);
  const speedKmh = (speed * 3.6).toFixed(1);

  return (
    <View style={styles.container}>
      <View style={styles.headingBox}>
        <Text style={styles.label}>HEADING</Text>
        <Text style={styles.value}>{headingDegrees}°</Text>
        <Text style={styles.direction}>{direction}</Text>
      </View>

      {showSpeed && (
        <View style={styles.speedBox}>
          <Text style={styles.label}>SPEED</Text>
          <Text style={styles.speedValue}>{speedKmh}</Text>
          <Text style={styles.unit}>km/h</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 16,
    flexDirection: 'row',
    gap: 8,
    zIndex: 1000,
  },
  headingBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 16,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    alignItems: 'center',
    minWidth: 100,
  },
  speedBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 16,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    alignItems: 'center',
    minWidth: 85,
  },
  label: {
    fontSize: 9,
    fontWeight: '700',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  value: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1e40af',
    marginBottom: 2,
    lineHeight: 32,
  },
  direction: {
    fontSize: 13,
    fontWeight: '800',
    color: '#3b82f6',
    letterSpacing: 1.5,
  },
  speedValue: {
    fontSize: 26,
    fontWeight: '800',
    color: '#059669',
    lineHeight: 30,
  },
  unit: {
    fontSize: 10,
    fontWeight: '700',
    color: '#10b981',
    marginTop: 2,
    letterSpacing: 0.5,
  },
});