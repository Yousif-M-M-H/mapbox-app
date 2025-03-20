import React from 'react';
import { View, Text } from 'react-native';
import { mapStyles } from '../../styles/mapStyles';
import { MapViewModel } from '../../viewModel/MapViewModel';
import { observer } from "mobx-react-lite";


interface TitleBarProps {
  viewModel: MapViewModel;
}

export const TitleBar: React.FC<TitleBarProps> = observer(({ viewModel }) => {
  return (
    <View style={mapStyles.titleContainer}>
      <Text style={mapStyles.title}>
        {viewModel ? viewModel.destinationTitle : 'Enter a destination'}
      </Text>
    </View>
  );
});