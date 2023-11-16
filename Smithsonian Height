///////////////////////////////////////////////////////////////
//            1) Load GEDI image collection                  //
///////////////////////////////////////////////////////////////
var gediHeight = ee.ImageCollection("LARSE/GEDI/GEDI02_A_002_MONTHLY"); // GEDI data for canopy height

// Define masking function to only retrieve high-quality data points
var heightMask = function(im) {
  return im.updateMask(im.select('quality_flag').eq(1))
      .updateMask(im.select('degrade_flag').eq(0));
};

// Apply masks to the dataset
gediHeight = gediHeight.map(heightMask);
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
var onehundredHeight = gediHeight.filterBounds(onehundredBuffer);
var threehundredHeight = gediHeight.filterBounds(threehundredBuffer);
var fivehundredHeight = gediHeight.filterBounds(fivehundredBuffer);
var onethousandHeight = gediHeight.filterBounds(onethousandBuffer);

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

var onehundredHeightReduced = reducer(onehundredHeight.mosaic(), 100);
var threehundredHeightReduced = reducer(threehundredHeight.mosaic(), 300);
var fivehundredHeightReduced = reducer(fivehundredHeight.mosaic(), 500);
var onethousandHeightReduced = reducer(onethousandHeight.mosaic(), 1000);

///////////////////////////////////////////////////////////////
//            4) Visualize the aggregated data               //
///////////////////////////////////////////////////////////////

// Display the location of data points
// Set visualization parameters
var heightMeanParams = {
  bands:['rh100_mean'], // Mean of top height. (RH100=Height at whuch 100% of the waveform has been returned)
  min: 0,
  max: 100,
  palette:'white, #006600',
};

var heightSDParams = {
  bands:['rh100_stdDev'], // Standard deviation of top height. (RH100=Height at whuch 100% of the waveform has been returned)
  min: 0,
  max: 50,
  palette:'white, #0000FF',
};

// Clip to show only the data points within the buffers.
Map.addLayer(onehundredHeightReduced.clip(onehundredBuffer), 
             heightMeanParams, 
             'Mean RH100 100 meter'); // Add 100 meter buffer
Map.addLayer(threehundredHeightReduced.clip(threehundredBuffer), 
             heightMeanParams, 
             'Mean RH100 300 meter'); // Add 300 meter buffer
Map.addLayer(fivehundredHeightReduced.clip(fivehundredBuffer), 
             heightMeanParams, 
             'Mean RH100 500 meter'); // Add 500 meter buffer
Map.addLayer(onethousandHeightReduced.clip(onethousandBuffer), 
             heightMeanParams, 
             'Mean RH100 1000 meter'); // Add 1000 meter buffer
             
Map.addLayer(onehundredHeightReduced.clip(onehundredBuffer), 
             heightSDParams, 
             'SdDev RH100 100 meter'); // Add 100 meter buffer
Map.addLayer(threehundredHeightReduced.clip(threehundredBuffer), 
             heightSDParams, 
             'SdDev RH100 300 meter'); // Add 300 meter buffer
Map.addLayer(fivehundredHeightReduced.clip(fivehundredBuffer), 
             heightSDParams, 
             'SdDev RH100 500 meter'); // Add 500 meter buffer
Map.addLayer(onethousandHeightReduced.clip(onethousandBuffer), 
             heightSDParams, 
             'SdDev RH100 1000 meter'); // Add 1000 meter buffer
             
Map.addLayer(onethousandBuffer, 
             {color:'0000FF'}, 
             'Alternative SdDev RH100 1000 meter'); // Alternative aggregation method I was hoping to achieve
Map.addLayer(fivehundredBuffer, 
             {color:'006600'},
             'Alternative Mean RH100 1000 meter'); // Alternative aggregation method I was hoping to achieve

///////////////////////////////////////////////////////////////
//            5) Make panel to display legends               //
///////////////////////////////////////////////////////////////
// I referenced the UI hosted on https://glad.earthengine.app/view/global-forest-canopy-height-2019

function makeColorBarParams(palette){return {bbox: [0, 0, 1, 100],dimensions: '15x150',format: 'png',min: heightMeanParams.min,max: heightMeanParams.max,palette: palette,};}
var colorBar = ui.Thumbnail({
  image: ee.Image.pixelLonLat().select('latitude').multiply((heightMeanParams.max-heightMeanParams.min)/100.0).add(heightMeanParams.min),
  params: makeColorBarParams(['white','006600']),
  style: {stretch: 'vertical', margin: '8px 0px 8px 4px', height: '100px', width: '15px'},
}); 

var colorBarB = ui.Thumbnail({
  image: ee.Image.pixelLonLat().select('latitude').multiply((heightMeanParams.max-heightMeanParams.min)/100.0).add(heightMeanParams.min),
  params: makeColorBarParams(['white','0000FF']),
  style: {stretch: 'vertical', margin: '8px 0px 8px 4px', height: '100px', width: '15px'},
}); 

var legendLabels = ui.Panel({
  widgets: [ui.Label('≥100', {margin: '1px 4px 32px'}),
    ui.Label((heightMeanParams.max+heightMeanParams.min)/2,{margin: '0px 4px 32px', textAlign: 'center', stretch: 'vertical'}),
    ui.Label(heightMeanParams.min, {margin: '0px 4px'})],
  layout: ui.Panel.Layout.flow('vertical'),
  style:{}
});
var legendLabelsB = ui.Panel({
  widgets: [ui.Label('≥50', {margin: '1px 4px 32px'}),
    ui.Label((heightSDParams.max+heightSDParams.min)/2,{margin: '0px 4px 32px', textAlign: 'center', stretch: 'vertical'}),
    ui.Label(heightSDParams.min, {margin: '0px 4px'})],
  layout: ui.Panel.Layout.flow('vertical'),
  style:{}
});

var legendTitle = ui.Label('Relative height metrics at 100% (m)',{color: '292929', fontSize: '16px', fontWeight: '500'});
var southlabel = ui.Panel([ui.Label('RH100 Mean',{margin: '2px 8px'})],'flow',{margin: '4px 0px',width:'78px'});
var boreallabel = ui.Panel([ui.Label('RH100 Standard Deviation',{margin: '2px 8px'})],
  'flow',{margin: '4px 0px 4px 12px',width:'85px'});


var legend = ui.Panel([southlabel,colorBar, legendLabels], ui.Panel.Layout.flow('horizontal'));
var legendB = ui.Panel([boreallabel,colorBarB, legendLabelsB], ui.Panel.Layout.flow('horizontal'));
var legendPanel = ui.Panel([legend,legendB],ui.Panel.Layout.flow('horizontal',true),{});
var mainText = ui.Label('This dashboard maps the relative height metrics measured by the GEDI sensors aboard the International Space Station.',
                        {width: '300px', stretch: 'horizontal'});
var citation = ui.Label('Dubayah, R., Hofton, M., Blair, J., Armston, J., Tang, H., Luthcke, S. (2021). GEDI L2A Elevation and Height Metrics Data Global Footprint Level V002 [Data set]. NASA EOSDIS Land Processes Distributed Active Archive Center. Accessed 2023-11-16 from https://doi.org/10.5067/GEDI/GEDI02_A.002',
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
