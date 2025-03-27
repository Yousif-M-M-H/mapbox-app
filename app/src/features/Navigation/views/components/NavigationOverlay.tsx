// src/features/Navigation/views/components/NavigationOverlay.tsx
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { observer } from 'mobx-react-lite';
import { styles } from '../../styles';
import { NavigationViewModel } from '../../viewmodels/NavigationViewModel';
import { Ionicons } from '@expo/vector-icons';

interface NavigationOverlayProps {
  navigationViewModel: NavigationViewModel;
}

export const NavigationOverlay: React.FC<NavigationOverlayProps> = observer(({ navigationViewModel }) => {
  if (!navigationViewModel.isNavigating) return null;
  
  const getManeuverIcon = () => {
    if (!navigationViewModel.currentStep) return 'arrow-forward';
    
    const type = navigationViewModel.currentStep.maneuver.type;
    const modifier = navigationViewModel.currentStep.maneuver.modifier || '';
    
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
          onPress={() => navigationViewModel.stopNavigation()}
        >
          <Text style={styles.stopButtonText}>Exit</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.stepContainer}>
        <View style={styles.iconContainer}>
          <Ionicons 
            name={getManeuverIcon()} 
            size={36} 
            color={navigationViewModel.isApproachingStep ? "#FF6B6B" : "#4080FF"} 
          />
        </View>
        <View style={styles.instructionContainer}>
          <Text style={styles.distance}>{navigationViewModel.formattedStepDistance}</Text>
          <Text style={styles.instruction}>
            {navigationViewModel.currentStep?.instructions || "Proceed to route"}
          </Text>
        </View>
      </View>
      
      <View style={styles.summaryContainer}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Remaining</Text>
          <Text style={styles.summaryValue}>{navigationViewModel.formattedRemainingDistance}</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>ETA</Text>
          <Text style={styles.summaryValue}>{navigationViewModel.formattedRemainingDuration}</Text>
        </View>
      </View>
    </View>
  );
});