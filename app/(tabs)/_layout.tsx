import React from 'react';
import { StatusBar, SafeAreaView, StyleSheet } from 'react-native';
import { MainScreen } from '../src/Main/views/screens/MainScreen';
import { RouteViewModel } from '../src/features/Route/viewmodels/RouteViewModel';
import { initMapbox } from '../src/core/api/mapbox';

// Initialize Mapbox configuration
initMapbox();

// Create a singleton instance of the RouteViewModel
const routeViewModel = new RouteViewModel();

const App = () => {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <MainScreen viewModel={routeViewModel} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;