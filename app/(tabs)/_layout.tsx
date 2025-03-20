import React, { useEffect } from 'react';
import { initMapbox } from '../src/utils/mapboxConfig';  
import { MapScreen } from '../src/views/screen/MapScreen'; 

const App = () => {
  useEffect(() => {
   
    initMapbox();
  }, []);

  return <MapScreen />;
};

export default App;

