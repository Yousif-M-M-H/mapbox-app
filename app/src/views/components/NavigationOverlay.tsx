// src/views/components/NavigationOverlay.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { observer } from 'mobx-react-lite';
import { MapViewModel } from '../../viewModel/MapViewModel';
import { Ionicons } from '@expo/vector-icons';

interface NavigationOverlayProps {
  viewModel: MapViewModel;
}

export const NavigationOverlay: React.FC<NavigationOverlayProps> = observer(({ viewModel }) => {
  if (!viewModel.isNavigating) return null;
  
  const getManeuverIcon = () => {
    if (!viewModel.currentStep) return 'arrow-forward';
    
    const type = viewModel.currentStep.maneuver.type;
    const modifier = viewModel.currentStep.maneuver.modifier || '';
    
    if (type === 'turn') {
      if (modifier.includes('right')) return 'arrow-forward-circle';
      if (modifier.includes('left')) return 'arrow-back-circle';
    } else if (type === 'continue') {
      return 'arrow-up-circle';
    } else if (type === 'merge' || type === 'on ramp') {
      return 'git-merge-outline';
    } else if (type === 'off ramp') {
      return 'exit-outline';
    } else if (type === 'roundabout') {
      return 'refresh-circle';
    } else if (type === 'arrive') {
      return 'flag';
    }
    
    return 'arrow-forward';
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Turn-by-Turn Navigation</Text>
        <TouchableOpacity 
          style={styles.stopButton} 
          onPress={() => viewModel.stopNavigation()}
        >
          <Text style={styles.stopButtonText}>Exit</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.stepContainer}>
        <View style={styles.iconContainer}>
          <Ionicons 
            name={getManeuverIcon()} 
            size={36} 
            color={viewModel.isApproachingStep ? "#FF6B6B" : "#4080FF"} 
          />
        </View>
        <View style={styles.instructionContainer}>
          <Text style={styles.distance}>{viewModel.formattedStepDistance}</Text>
          <Text style={styles.instruction}>
            {viewModel.currentStep?.instructions || "Proceed to route"}
          </Text>
        </View>
      </View>
      
      <View style={styles.summaryContainer}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Remaining</Text>
          <Text style={styles.summaryValue}>{viewModel.formattedRemainingDistance}</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>ETA</Text>
          <Text style={styles.summaryValue}>{viewModel.formattedRemainingDuration}</Text>
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    margin: 10,
    borderRadius: 10,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#4080FF',
  },
  title: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  stopButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  stopButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  stepContainer: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: '#FAFAFA',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  iconContainer: {
    width: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  instructionContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  distance: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  instruction: {
    fontSize: 14,
    color: '#555',
  },
  summaryContainer: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#F0F0F0',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#777',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
});