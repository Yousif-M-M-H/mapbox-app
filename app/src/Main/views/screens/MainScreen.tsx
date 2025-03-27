// src/Main/views/screens/MainScreen.tsx
import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { observer } from 'mobx-react-lite';
import { MapViewComponent } from '../../../features/Map/views/components/MapView';
import { SearchBar } from '../../../features/Search/views/components/SearchBar';
import { RouteInfo } from '../../../features/Route/views/components/RouteInfo';
import { NavigationOverlay } from '../../../features/Navigation/views/components/NavigationOverlay';
import { LoadingScreen } from '../components/LoadingScreen';
import { MainViewModel } from '../../viewmodels/MainViewModel';
import { MongoDBService } from '../../../core/services/MongoDBService';

interface MainScreenProps {
  viewModel: MainViewModel;
}

export const MainScreen: React.FC<MainScreenProps> = observer(({ viewModel }) => {
  useEffect(() => {
    // Check MongoDB connection silently when component mounts
    checkMongoDBConnection();
  }, []);

  const checkMongoDBConnection = async () => {
    try {
      console.log('Checking MongoDB connection silently...');
      const status = await MongoDBService.checkConnection();
      
      // Just log the result without showing an alert
      console.log('MongoDB connection status:', status.connected ? 'Connected' : 'Not connected');
      console.log('Status message:', status.message);
    } catch (error) {
      console.error('Failed to check MongoDB connection:', error);
    }
  };

  if (!viewModel.isInitialized) {
    return <LoadingScreen />;
  }

  return (
    <View style={styles.container}>
      <MapViewComponent 
        mapViewModel={viewModel.mapViewModel} 
        routeViewModel={viewModel.routeViewModel}
        navigationViewModel={viewModel.navigationViewModel}
      />
      
      {!viewModel.isNavigating && (
        <SearchBar searchViewModel={viewModel.searchViewModel} />
      )}
      
      <RouteInfo 
        routeViewModel={viewModel.routeViewModel} 
        navigationViewModel={viewModel.navigationViewModel}
        destinationTitle={viewModel.destinationTitle}
      />
      
      <NavigationOverlay navigationViewModel={viewModel.navigationViewModel} />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});