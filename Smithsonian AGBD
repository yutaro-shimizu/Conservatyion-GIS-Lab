///////////////////////////////////////////////////////////////
//            1) Load GEDI image collection                  //
///////////////////////////////////////////////////////////////
var gediDensity = ee.ImageCollection("LARSE/GEDI/GEDI04_A_002_MONTHLY"); // GEDI data for aboveground density

// Define masking function to only retrieve high-quality data points
var desntiyMask = function(im) {
  return im.updateMask(im.select('l4_quality_flag').eq(1))
      .updateMask(im.select('degrade_flag').eq(0));
};

// Apply masks to the dataset
gediDensity = gediDensity.map(desntiyMask);
///////////////////////////////////////////////////////////////
//            2) Add points of interest                      //
///////////////////////////////////////////////////////////////

// !First, convert PointCoordinates.xlsx to CSV and upload it as an asset!
var smithsCoords = ee.FeatureCollection(table).geometry(); // Load the dataset with coordinates across the US
print(smithsCoords);

// Create buffeers around the coordinates
var onehundredBuffer = smithsCoords.buffer(100); // 100 meter radius
var threehundredBuffer = smithsCoords.buffer(300); // 300 meter radius
var fivehundredBuffer = smithsCoords.buffer(500); // 500 meter radius
var onethousandBuffer = smithsCoords.buffer(1000); // 1000 meter radius

// Visualize coordinates on the map
Map.addLayer(smithsCoords, {color:'a70000'}, 'coordinates'); // Display coordinates from the PointCoordinates sheet
Map.centerObject(smithsCoords, 4);

Map.setOptions('Satellite'); // Set up satellite to visually confirm foret presence
Map.style().set('cursor', 'crosshair'); // Change cursor to crosshair for precision

///////////////////////////////////////////////////////////////
//            3) Aggregate data                              //
///////////////////////////////////////////////////////////////
// Filter data by bounds
var onehundredDensity = gediDensity.filterBounds(onehundredBuffer);
var threehundredDensity = gediDensity.filterBounds(threehundredBuffer);
var fivehundredDensity = gediDensity.filterBounds(fivehundredBuffer);
var onethousandDensity = gediDensity.filterBounds(onethousandBuffer);

// Combine the mean and standard deviation reducers.
var combinedReducers = ee.Reducer.mean().combine({
  reducer2: ee.Reducer.stdDev(),
  sharedInputs: true
});

// Use the combined reducer to get the mean and SD of the image.
function reducer(image, radius){
  return image.reduceNeighborhood({
  reducer: combinedReducers,
  kernel: ee.Kernel.circle(radius, 'meters')
})}

// After spending half a day of searching on the interect, 
// I wasn't able to fully debug the reducer for correct aggregation.
// I tried to compute mean/standardDev over the whole buffer using reduceRegions, but ran into run-time error.
// This is one of the solutions I tried, but it didn't work.
// function reducer(image){
//   return image.reduceRegions({
//   collection: onehundredBuffer,
//   reducer: combinedReducers
// })}

var onehundredDensityReducedAgbd = reducer(onehundredDensity.mosaic(), 100);
var threehundredDensityReducedAgbd = reducer(threehundredDensity.mosaic(), 300);
var fivehundredDensityReducedAgbd = reducer(fivehundredDensity.mosaic(), 500);
var onethousandDensityReducedAgbd = reducer(onethousandDensity.mosaic(), 1000);

///////////////////////////////////////////////////////////////
//            4) Visualize the aggregated data               //
///////////////////////////////////////////////////////////////

// Display the location of data points
// Set visualization parameters
var densityMeanParams = {
  bands:['agbd_mean'], // visualize aboveground biomass density mean
  min: 0,
  max: 100,
  palette:'white, #006600',
};

var densitySDParams = {
  bands:['agbd_stdDev'], // visualize aboveground biomass density standard deviation
  min: 0,
  max: 50,
  palette:'white, #0000FF',
};

// Clip to show only the data points within the buffers.
Map.addLayer(onehundredDensityReducedAgbd.clip(onehundredBuffer), 
             densityMeanParams, 
             'Mean AGBD 100 meter'); // Add 100 meter buffer
Map.addLayer(threehundredDensityReducedAgbd.clip(threehundredBuffer), 
             densityMeanParams, 
             'Mean AGBD 300 meter'); // Add 300 meter buffer
Map.addLayer(fivehundredDensityReducedAgbd.clip(fivehundredBuffer), 
             densityMeanParams, 
             'Mean AGBD 500 meter'); // Add 500 meter buffer
Map.addLayer(onethousandDensityReducedAgbd.clip(onethousandBuffer), 
             densityMeanParams, 
             'Mean AGBD 1000 meter'); // Add 1000 meter buffer
             
Map.addLayer(onehundredDensityReducedAgbd.clip(onehundredBuffer), 
             densitySDParams, 
             'SdDev AGBD 100 meter'); // Add 100 meter buffer
Map.addLayer(threehundredDensityReducedAgbd.clip(threehundredBuffer), 
             densitySDParams, 
             'SdDev AGBD 300 meter'); // Add 300 meter buffer
Map.addLayer(fivehundredDensityReducedAgbd.clip(fivehundredBuffer), 
             densitySDParams, 
             'SdDev AGBD 500 meter'); // Add 500 meter buffer
Map.addLayer(onethousandDensityReducedAgbd.clip(onethousandBuffer), 
             densitySDParams, 
             'SdDev AGBD 1000 meter'); // Add 1000 meter buffer
             
Map.addLayer(onethousandBuffer, 
             {color:'0000FF'}, 
             'Alternative SdDev AGBD 1000 meter'); // Alternative aggregation method I was hoping to achieve
Map.addLayer(fivehundredBuffer, 
             {color:'006600'},
             'Alternative Mean AGBD 1000 meter'); // Alternative aggregation method I was hoping to achieve

///////////////////////////////////////////////////////////////
//            5) Make panel to display legends               //
///////////////////////////////////////////////////////////////
// I referenced the UI hosted on https://glad.earthengine.app/view/global-forest-canopy-height-2019

function makeColorBarParams(palette){return {bbox: [0, 0, 1, 100],dimensions: '15x150',format: 'png',min: densityMeanParams.min,max: densityMeanParams.max,palette: palette,};}
var colorBar = ui.Thumbnail({
  image: ee.Image.pixelLonLat().select('latitude').multiply((densityMeanParams.max-densityMeanParams.min)/100.0).add(densityMeanParams.min),
  params: makeColorBarParams(['white','006600']),
  style: {stretch: 'vertical', margin: '8px 0px 8px 4px', height: '100px', width: '15px'},
}); 

var colorBarB = ui.Thumbnail({
  image: ee.Image.pixelLonLat().select('latitude').multiply((densityMeanParams.max-densityMeanParams.min)/100.0).add(densityMeanParams.min),
  params: makeColorBarParams(['white','0000FF']),
  style: {stretch: 'vertical', margin: '8px 0px 8px 4px', height: '100px', width: '15px'},
}); 

var legendLabels = ui.Panel({
  widgets: [ui.Label('≥100', {margin: '1px 4px 32px'}),
    ui.Label((densityMeanParams.max+densityMeanParams.min)/2,{margin: '0px 4px 32px', textAlign: 'center', stretch: 'vertical'}),
    ui.Label(densityMeanParams.min, {margin: '0px 4px'})],
  layout: ui.Panel.Layout.flow('vertical'),
  style:{}
});
var legendLabelsB = ui.Panel({
  widgets: [ui.Label('≥50', {margin: '1px 4px 32px'}),
    ui.Label((densitySDParams.max+densitySDParams.min)/2,{margin: '0px 4px 32px', textAlign: 'center', stretch: 'vertical'}),
    ui.Label(densitySDParams.min, {margin: '0px 4px'})],
  layout: ui.Panel.Layout.flow('vertical'),
  style:{}
});

var legendTitle = ui.Label('Aboveground Biomass Density (Mg/ha)',{color: '292929', fontSize: '16px', fontWeight: '500'});
var southlabel = ui.Panel([ui.Label('AGBD Mean',{margin: '2px 8px'})],'flow',{margin: '4px 0px',width:'78px'});
var boreallabel = ui.Panel([ui.Label('AGBD Standard Deviation',{margin: '2px 8px'})],
  'flow',{margin: '4px 0px 4px 12px',width:'85px'});


var legend = ui.Panel([southlabel,colorBar, legendLabels], ui.Panel.Layout.flow('horizontal'));
var legendB = ui.Panel([boreallabel,colorBarB, legendLabelsB], ui.Panel.Layout.flow('horizontal'));
var legendPanel = ui.Panel([legend,legendB],ui.Panel.Layout.flow('horizontal',true),{});
var mainText = ui.Label('This dashboard maps the predicted aboveground biomass density measured by the GEDI sensors aboard the International Space Station.',
                        {width: '300px', stretch: 'horizontal'});
var citation = ui.Label('Dubayah, R.O., J. Armston, J.R. Kellner, L. Duncanson, S.P. Healey, P.L. Patterson, S. Hancock, H. Tang, J. Bruening, M.A. Hofton, J.B. Blair, and S.B.Luthcke. 2022. GEDI L4A Footprint Level Aboveground Biomass Density, Version 2.1. ORNL DAAC, Oak Ridge, Tennessee, USA. https://doi.org/10.3334/ORNLDAAC/2056',
                        {width: '300px', stretch: 'horizontal'});

var panel = ui.Panel();
panel.style().set({
  position: 'top-right'
});

panel.add(legendTitle)
     .add(legendPanel)
     .add(mainText)
     .add(citation);
     
Map.add(panel);
