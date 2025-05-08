// app/src/features/Crosswalk/constants/CrosswalkCoordinates.ts

// Vertices of your KML polygon (plus repeat of first to close the ring)
export const MLK_CENTRAL_CROSSWALK_COORDINATES: [number, number][] = [
    [ -85.2922277761168, 35.03972096221774 ],
    [ -85.2922264174708, 35.03970854354564 ],
    [ -85.29212739284407, 35.0398872341007 ],
    [ -85.29213838396562, 35.03988251214048 ],
    [ -85.29215548477382, 35.03987781026519 ],
    [ -85.29217050419861, 35.03987989259621 ],
    [ -85.29224635359721, 35.03974242581815 ],
    [ -85.2922277761168, 35.03972096221774 ], // closing point
  ];
  
  // Centroid for camera centering / flyTo (average of unique vertices)
  export const CROSSWALK_CENTER: [number, number] = [
    -85.29218461613813,  // avg longitude
     35.03981419724059,  // avg latitude
  ];
  