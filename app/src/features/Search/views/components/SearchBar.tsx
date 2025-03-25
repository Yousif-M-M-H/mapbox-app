import React from 'react';
import { View, TextInput, ActivityIndicator, FlatList, Text, TouchableOpacity } from 'react-native';
import { observer } from 'mobx-react-lite';
import { styles } from '../../styles';
import { RouteViewModel } from '../../../Route/viewmodels/RouteViewModel';

interface SearchBarProps {
  viewModel: RouteViewModel;
}

export const SearchBar: React.FC<SearchBarProps> = observer(({ viewModel }) => {
  // Format distance to be human readable
  const formatDistance = (distance?: number) => {
    if (!distance) return '';
    
    if (distance < 1) {
      return ` (${Math.round(distance * 1000)} m)`;
    } else {
      return ` (${distance.toFixed(1)} km)`;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <TextInput 
          style={styles.input}
          placeholder="Enter destination address"
          value={viewModel.searchQuery}
          onChangeText={(text) => viewModel.setSearchQuery(text)}
          placeholderTextColor="#888"
        />
        
        {viewModel.searchQuery.length > 0 && (
          <TouchableOpacity 
            style={styles.clearButton} 
            onPress={() => viewModel.clearSearch()}
          >
            <Text style={styles.clearButtonText}>✕</Text>
          </TouchableOpacity>
        )}
        
        {viewModel.isSearching && (
          <ActivityIndicator 
            style={styles.spinner} 
            size="small" 
            color="#3B82F6" 
          />
        )}
      </View>
      
      {viewModel.searchResults.length > 0 && (
        <FlatList
          data={viewModel.searchResults}
          keyExtractor={(item, index) => `result-${index}`}
          style={styles.resultsList}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.resultItem}
              onPress={() => viewModel.selectDestination(item)}
            >
              <Text style={styles.resultText}>
                {item.placeName}
                <Text style={styles.distanceText}>
                  {formatDistance(item.distance)}
                </Text>
              </Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
});