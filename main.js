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

///////////////////////////////////////////////////////////////
//            3) Aggregate data                              //
///////////////////////////////////////////////////////////////
// Filter Height data
var onehundredHeight = gediHeight.select(['rh50','rh100']).filterBounds(onehundredBuffer);
var threehundredHeight = gediHeight.select(['rh50','rh100']).filterBounds(threehundredBuffer);
var fivehundredHeight = gediHeight.select(['rh50','rh100']).filterBounds(fivehundredBuffer);
var onethousandHeight = gediHeight.select(['rh50','rh100']).filterBounds(onethousandBuffer);

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

///////////////////////////////////////////////////////////////
//            4) Visualize the aggregated data               //
///////////////////////////////////////////////////////////////

// Display the location of data points
// Set visualization parameters
var heightMean = {
  bands:['rh100_mean'], // visualize the height of top canopy
  min: onehundredReducedheight.select(['rh100_mean']).min(),
  max: onehundredReducedheight.select(['rh100_mean']).max(),
  palette: 'darkred,red,orange,green,darkgreen',
};

var gediVis = {
  bands:['rh100_stdDev'], // visualize the height of top canopy
  min: onehundredReducedheight.select(['rh100_mean']).min(),
  max: onehundredReducedheight.select(['rh100_mean']).max(),
  palette: 'darkred,red,orange,green,darkgreen',
};

// Clip to show only the data points within the buffers.
// Mean top of canopy (RH100=Height at whuch 100% of the waveform has been returned)
Map.addLayer(onehundredReducedheight.clip(onehundredBuffer), 
             heightMean, 
             'Mean Top Canopy Height 100 meter'); // Add 100 meter buffer
Map.addLayer(threehundredReducedheight.clip(threehundredBuffer), 
             heightMean, 
             'Mean Top Canopy Height 300 meter'); // Add 300 meter buffer
Map.addLayer(fivehundredReducedheight.clip(fivehundredBuffer), 
             heightMean, 
             'Mean Top Canopy Height 500 meter'); // Add 500 meter buffer
Map.addLayer(onethousantReducedheight.clip(onethousandBuffer), 
             heightMean, 
             'Mean Top Canopy Height 1000 meter'); // Add 1000 meter buffer
             
Map.addLayer(onehundredReducedheight.clip(onehundredBuffer), 
             heightMean, 
             'StdDev Top Canopy Height 100 meter'); // Add 100 meter buffer
Map.addLayer(threehundredReducedheight.clip(threehundredBuffer), 
             heightMean, 
             'StdDev Top Canopy Height 300 meter'); // Add 300 meter buffer
Map.addLayer(fivehundredReducedheight.clip(fivehundredBuffer), 
             heightMean, 
             'StdDev Top Canopy Height 500 meter'); // Add 500 meter buffer
Map.addLayer(onethousantReducedheight.clip(onethousandBuffer), 
             heightMean, 
             'StdDev Top Canopy Height 1000 meter'); // Add 1000 meter buffer
