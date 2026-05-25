# Quick Start - Extract Location in 3 Steps

## Step 1: Add API Key
Edit `.env`:
```env
GOOGLE_MAPS_API_KEY=your_google_api_key
```

## Step 2: Restart Backend
```bash
cd backend
npm start
```

## Step 3: Use Component
```jsx
import LocationPickerOptimized from './components/Maps/LocationPickerOptimized';

<LocationPickerOptimized 
  onLocationSelect={(location) => {
    console.log('Exact location:', location);
    // {
    //   latitude: "27.7172417",
    //   longitude: "85.3240134",
    //   accuracy: 12,
    //   address: "Kathmandu, Nepal"
    // }
  }}
  required={true}
/>
```

## That's It! 🎉

- Click "Extract Location" button
- Allow GPS permission
- Get exact coordinates + address
- Or click map for manual selection

## Files Overview
- **`LocationPickerOptimized.js`** - Clean React component (150 lines)
- **`locationService.js`** - Node.js service (70 lines)
- **`routes/location.js`** - API endpoint (35 lines)

**Total: 255 lines - NO redundancy!**

---

For detailed setup, see: `LOCATION_COMPONENT_SETUP.md`
