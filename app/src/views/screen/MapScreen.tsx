// src/views/screens/MapScreen.tsx
import React from 'react';
import { View } from 'react-native';
import { observer } from 'mobx-react-lite';
import { MapViewModel } from '../../viewModel/MapViewModel';
import { MapViewComponent } from '../components/MapView';
import { TitleBar } from '../components/TitleBar';
import { RouteInfo } from '../components/RouteInfo';
import { mapStyles } from '../../styles/mapStyles';
import { SearchBar } from '../components/SearchBar';
import { LoadingScreen } from '../components/LoadingScreen';


export const MapScreen: React.FC = observer(() => {
  // Create and store the ViewModel instance
  const viewModel = React.useMemo(() => new MapViewModel(), []);

  // If not initialized, show loading screen
  if (!viewModel.isInitialized) {
    return <LoadingScreen />;
  }

  return (
    <View style={mapStyles.container}>
      <MapViewComponent viewModel={viewModel} />
      
      <SearchBar viewModel={viewModel} />
      
      <TitleBar viewModel={viewModel} />
      
      <RouteInfo viewModel={viewModel} />
    </View>
  );
});