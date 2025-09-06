# Test Vehicles Implementation

## Overview
Two test vehicles have been successfully implemented for coordinate plotting testing.

## Implementation Details

### File Structure
- **Main Component**: `app/src/features/Map/views/components/TestVehicles.tsx`
- **Integration**: Added to `MapView.tsx` component
- **Export**: Available through `app/src/features/Map/index.ts`

### Vehicle Coordinates
- **Vehicle 1**: `[-85.3082615, 35.0457707]` (longitude, latitude)
- **Vehicle 2**: `[-85.3082476, 35.0457707]` (longitude, latitude)

### Toggle Control
```typescript
const ENABLE_TEST_VEHICLES = true; // Set to false to completely disable
```

#### Behavior:
- **When `true`**: Both vehicles are displayed and processed normally
- **When `false`**: Vehicles are completely excluded from both map display and logic processing (early return `null`)

### Visual Appearance
- **Icon**: Mapbox built-in car icon (`car-15`)
- **Color**: Distinctive orange (`#FF6B35`)
- **Size**: 1.5x scale for visibility
- **Labels**: "Test Vehicle 1" and "Test Vehicle 2" with white text and black outline

### Code Organization
- Clean, self-contained component
- No clutter added to existing large files
- Follows React best practices
- Includes utility functions for external access:
  - `getTestVehicles()`: Returns array of test vehicles (empty if disabled)
  - `isTestVehiclesEnabled()`: Returns boolean toggle state
  - `getTestVehicleCount()`: Returns count of active test vehicles

### Integration
The component is rendered in `MapView.tsx` right after the SDSM Vehicle Markers:
```tsx
{/* Test Vehicles for Coordinate Testing */}
<TestVehicles />
```

### Non-Disruptive Design
- Uses separate data source and layer
- Independent of existing vehicle logic
- Can be toggled without affecting other functionality
- Follows existing code patterns and conventions

## Usage
To disable test vehicles, simply change the toggle in `TestVehicles.tsx`:
```typescript
const ENABLE_TEST_VEHICLES = false;
```

To modify coordinates or add more vehicles, update the `TEST_VEHICLES` array in the same file.