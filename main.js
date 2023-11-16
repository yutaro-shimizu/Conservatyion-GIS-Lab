///////////////////////////////////////////////////////////////
//            1) Load GEDI image collections                 //
///////////////////////////////////////////////////////////////
var gediHeight = ee.ImageCollection("LARSE/GEDI/GEDI02_A_002_MONTHLY"); // GEDI data for canopy height
var gediDensity = ee.ImageCollection("LARSE/GEDI/GEDI04_A_002_MONTHLY"); // GEDI data for aboveground density
var gediVerticalProfile = ee.ImageCollection("LARSE/GEDI/GEDI02_B_002_MONTHLY"); // GEDI data for vertical profile

// Define masking function to only retrieve high-quality data points
var heightMask = function(im) {
  return im.updateMask(im.select('quality_flag').eq(1))
      .updateMask(im.select('degrade_flag').eq(0));
};

var verticalProfileMask = function(im) {
  return im.updateMask(im.select('l2b_quality_flag').eq(1))
      .updateMask(im.select('degrade_flag').eq(0));
};

var desntiyMask = function(im) {
  return im.updateMask(im.select('l4_quality_flag').eq(1))
      .updateMask(im.select('degrade_flag').eq(0));
};

// Apply masks to the dataset
gediHeight = gediHeight.map(heightMask);
gediVerticalProfile = gediVerticalProfile.map(verticalProfileMask);
gediDensity = gediDensity.map(desntiyMask);

///////////////////////////////////////////////////////////////
//            2) Add points of interest                      //
///////////////////////////////////////////////////////////////

// !First, convert PointCoordinates.xlsx to CSV and upload it as an asset!
var smithsCoords = ee.FeatureCollection(table).geometry(); // Load the dataset with coordinates across the US
print(smithsCoords)

// Create buffeers around the coordinates
var onehundredBuffer = smithsCoords.buffer(100); // 100 meter radius
var threehundredBuffer = smithsCoords.buffer(300); // 300 meter radius
var fivehundredBuffer = smithsCoords.buffer(500); // 500 meter radius
var onethousandBuffer = smithsCoords.buffer(1000); // 1000 meter radius

// Visualize coordinates on the map
Map.addLayer(smithsCoords, {color:'a70000'}, 'coordinates'); // Display coordinates from the PointCoordinates sheet
Map.centerObject(smithsCoords,5);

// Visualize buffers on the map
Map.addLayer(onehundredBuffer, {color:'ff0000'}, '100 meter buffer'); // Add 100 meter buffer
Map.addLayer(threehundredBuffer, {color:'ff5252'}, '300 meter buffer'); // Add 300 meter buffer
Map.addLayer(fivehundredBuffer, {color:'ff7b7b'}, '500 meter buffer'); // Add 500 meter buffer
Map.addLayer(onethousandBuffer, {color:'ffbaba'}, '1000 meter buffer'); // Add 1000 meter buffer


///////////////////////////////////////////////////////////////
//            3) Filter data with the buffers                //
///////////////////////////////////////////////////////////////
// Filter Height data
var onehundredHeight = gediHeight.filterBounds(onehundredBuffer);
var threehundredHeight = gediHeight.filterBounds(threehundredBuffer);
var fivehundredHeight = gediHeight.filterBounds(fivehundredBuffer);
var onethousandHeight = gediHeight.filterBounds(onethousandBuffer);

// Filter Density data
var onehundredDensity = gediDensity.filterBounds(onehundredBuffer);
var threehundredDensity = gediDensity.filterBounds(threehundredBuffer);
var fivehundredDensity = gediDensity.filterBounds(fivehundredBuffer);
var onethousantDensity = gediDensity.filterBounds(onethousandBuffer);

// Filter Vertical Profile data
var onehundredVP = gediVerticalProfile.filterBounds(onehundredBuffer);
var threehundredVP = gediVerticalProfile.filterBounds(threehundredBuffer);
var fivehundredVP = gediVerticalProfile.filterBounds(fivehundredBuffer);
var onethousandVP = gediVerticalProfile.filterBounds(onethousandBuffer);

// Display the location of data points
// Set visualization parameters
var gediVis = {
  bands:['rh100'], // visualize the height of top canopy
  min: 1,
  max: 60,
  palette: 'darkred,red,orange,green,darkgreen',
};

// Only add Height dataset, as the other two are just processed differently with identical locations 
// Clip to show only the data points within the buffers.
Map.addLayer(onehundredHeight.median().clip(onehundredBuffer), 
             gediVis, 
             'Canopy 100 meter'); // Add 100 meter buffer
Map.addLayer(threehundredHeight.median().clip(threehundredBuffer), 
             gediVis, 
             'Canopy 300 meter'); // Add 300 meter buffer
Map.addLayer(fivehundredHeight.median().clip(fivehundredBuffer), 
             gediVis, 
             'Canopy 500 meter'); // Add 500 meter buffer
Map.addLayer(onethousandHeight.median().clip(onethousandBuffer), 
             gediVis, 
             'Canopy 1000 meter'); // Add 1000 meter buffer

///////////////////////////////////////////////////////////////
//            4) Aggregate image collection by buffer        //
///////////////////////////////////////////////////////////////

// Combine the mean and standard deviation reducers.
var combinedReducers = ee.Reducer.mean().combine({
  reducer2: ee.Reducer.stdDev(),
  sharedInputs: true
});

// Use the combined reducer to get the mean and SD of the image.
function reducer(image){
  return image.reduce({
  reducer: combinedReducers
})}

// Aggregate Height data
var onehundredReducedheight = reducer(onehundredHeight, onehundredBuffer);
var threehundredReducedheight = reducer(threehundredHeight, threehundredBuffer);
var fivehundredReducedheight = reducer(fivehundredHeight, fivehundredBuffer);
var onethousantReducedheight = reducer(onethousandHeight, onethousandBuffer);

// Aggregate Desnity data
var onehundredReduceddensity = reducer(onehundredDensity, onehundredBuffer);
var threehundredReduceddensity = reducer(threehundredDensity, threehundredBuffer);
var fivehundredReduceddensity = reducer(fivehundredDensity, fivehundredBuffer);
var onethousantReduceddensity = reducer(onethousantDensity, onethousandBuffer);

// Aggregate Vertical Profile data
var onehundredReducedVP = reducer(onehundredVP, onehundredBuffer);
var threehundredReducedVP = reducer(threehundredVP, threehundredBuffer);
var fivehundredReducedVP = reducer(fivehundredVP, fivehundredBuffer);
var onethousantReducedVP = reducer(onethousandVP, onethousandBuffer);
print(onethousantReducedVP)
///////////////////////////////////////////////////////////////
//            5) Export the aggregated data               //
///////////////////////////////////////////////////////////////
function export_helper(image, imagebuffer){
Export.image.toAsset({
  image: image,
  description: image,
  assetId: image,
  crs: projection.crs,
  crsTransform: projection.transform
})}
