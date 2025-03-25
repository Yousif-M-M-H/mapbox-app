// src/styles/mapStyles.ts
import { StyleSheet } from 'react-native';

export const mapStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  userMarker: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4285F4',
    borderWidth: 2,
    borderColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  destinationMarker: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#EA4335',
    borderWidth: 2,
    borderColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  markerInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'white',
  },
  titleContainer: {
    position: 'absolute',
    top: 120, // Moved down to make room for the search bar
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 12,
    margin: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  title: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Add to mapStyles.ts
navigatingMarker: { 
  width: 24,
  height: 24,
  borderRadius: 12,
  backgroundColor: '#4285F4',
  borderWidth: 2,
  borderColor: '#FFFF00', // Yellow border to indicate navigation mode
  justifyContent: 'center',
  alignItems: 'center',
  position: 'relative',
},
directionIndicator: {
  position: 'absolute',
  width: 0,
  height: 0,
  backgroundColor: 'transparent',
  borderStyle: 'solid',
  borderLeftWidth: 6,
  borderRightWidth: 6,
  borderBottomWidth: 12,
  borderLeftColor: 'transparent',
  borderRightColor: 'transparent',
  borderBottomColor: '#FFFF00',
  transform: [{ rotate: '180deg' }],
  top: -14,
},
});