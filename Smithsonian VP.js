///////////////////////////////////////////////////////////////
//            1) Load GEDI image collection                  //
///////////////////////////////////////////////////////////////
var gediVerticalProfile = ee.ImageCollection("LARSE/GEDI/GEDI02_B_002_MONTHLY"); // GEDI data for vertical profile

// Define masking function to only retrieve high-quality data points
var verticalProfileMask = function(im) {
  return im.updateMask(im.select('l2b_quality_flag').eq(1))
      .updateMask(im.select('degrade_flag').eq(0));
};

// Apply masks to the dataset
gediVerticalProfile = gediVerticalProfile.map(verticalProfileMask);
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
// Filter data by buffers
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
function reducer(image, radius){
  return image.reduceNeighborhood({
  reducer: combinedReducers,
  kernel: ee.Kernel.circle(radius, 'meters')
})}

// After spending half a day of searching on the interect, 
// I wasn't able to fully debug the reducer for correct aggregation.
// I tried to compute mean/standardDev over the whole buffer using reduceRegions, but ran into run-time error.
// function reducer(image){
//   return image.reduceRegions({
//   collection: onehundredBuffer,
//   reducer: combinedReducers
// })}

var onehundredVPReducedAgbd = reducer(onehundredVP.mosaic(), 100);
var threehundredVPReducedAgbd = reducer(threehundredVP.mosaic(), 300);
var fivehundredVPReducedAgbd = reducer(fivehundredVP.mosaic(), 500);
var onethousandVPReducedAgbd = reducer(onethousandVP.mosaic(), 1000);

///////////////////////////////////////////////////////////////
//            4) Visualize the aggregated data               //
///////////////////////////////////////////////////////////////

// Display the location of data points
// Set visualization parameters
var vpMeanParams = {
  bands:['cover_mean'], // visualize Total canopy cover mean
  min: 0,
  max: 1,
  palette:'white, #006600',
};

var vpSDParams = {
  bands:['cover_stdDev'], // visualize Total canopy cover standard deviation
  min: 0,
  max: 1,
  palette:'white, #0000FF',
};

// Clip to show only the data points within the buffers.
Map.addLayer(onehundredVPReducedAgbd.clip(onehundredBuffer), 
             vpMeanParams, 
             'Mean Canopy Cover 100 meter'); // Add 100 meter buffer
Map.addLayer(threehundredVPReducedAgbd.clip(threehundredBuffer), 
             vpMeanParams, 
             'Mean Canopy Cover 300 meter'); // Add 300 meter buffer
Map.addLayer(fivehundredVPReducedAgbd.clip(fivehundredBuffer), 
             vpMeanParams, 
             'Mean Canopy Cover 500 meter'); // Add 500 meter buffer
Map.addLayer(onethousandVPReducedAgbd.clip(onethousandBuffer), 
             vpMeanParams, 
             'Mean Canopy Cover 1000 meter'); // Add 1000 meter buffer
             
Map.addLayer(onehundredVPReducedAgbd.clip(onehundredBuffer), 
             vpSDParams, 
             'SdDev Canopy Cover 100 meter'); // Add 100 meter buffer
Map.addLayer(threehundredVPReducedAgbd.clip(threehundredBuffer), 
             vpSDParams, 
             'SdDev Canopy Cover 300 meter'); // Add 300 meter buffer
Map.addLayer(fivehundredVPReducedAgbd.clip(fivehundredBuffer), 
             vpSDParams, 
             'SdDev Canopy Cover 500 meter'); // Add 500 meter buffer
Map.addLayer(onethousandVPReducedAgbd.clip(onethousandBuffer), 
             vpSDParams, 
             'SdDev Canopy Cover 1000 meter'); // Add 1000 meter buffer

Map.addLayer(onethousandBuffer, 
             {color:'0000FF'}, 
             'Alternative SdDev Canopy Cover 1000 meter'); // Alternative aggregation method I was hoping to achieve
Map.addLayer(fivehundredBuffer, 
             {color:'006600'},
             'Alternative Mean Canopy Cover 1000 meter'); // Alternative aggregation method I was hoping to achieve

///////////////////////////////////////////////////////////////
//            5) Make panel to display legends               //
///////////////////////////////////////////////////////////////
// I referenced the UI hosted on https://glad.earthengine.app/view/global-forest-canopy-height-2019

function makeColorBarParams(palette){return {bbox: [0, 0, 1, 100],dimensions: '15x150',format: 'png',min: vpMeanParams.min,max: vpMeanParams.max,palette: palette,};}
var colorBar = ui.Thumbnail({
  image: ee.Image.pixelLonLat().select('latitude').multiply((vpMeanParams.max-vpMeanParams.min)/100.0).add(vpMeanParams.min),
  params: makeColorBarParams(['white','006600']),
  style: {stretch: 'vertical', margin: '8px 0px 8px 4px', height: '100px', width: '15px'},
}); 

var colorBarB = ui.Thumbnail({
  image: ee.Image.pixelLonLat().select('latitude').multiply((vpSDParams.max-vpSDParams.min)/100.0).add(vpSDParams.min),
  params: makeColorBarParams(['white','0000FF']),
  style: {stretch: 'vertical', margin: '8px 0px 8px 4px', height: '100px', width: '15px'},
}); 

var legendLabels = ui.Panel({
  widgets: [ui.Label('100', {margin: '1px 4px 32px'}),
    ui.Label((vpMeanParams.max*100+vpMeanParams.min*100)/2,{margin: '0px 4px 32px', textAlign: 'center', stretch: 'vertical'}),
    ui.Label(vpMeanParams.min*100, {margin: '0px 4px'})],
  layout: ui.Panel.Layout.flow('vertical'),
  style:{}
});
var legendLabelsB = ui.Panel({
  widgets: [ui.Label('100', {margin: '1px 4px 32px'}),
    ui.Label((vpSDParams.max*100+vpSDParams.min*100)/2,{margin: '0px 4px 32px', textAlign: 'center', stretch: 'vertical'}),
    ui.Label(vpSDParams.min*100, {margin: '0px 4px'})],
  layout: ui.Panel.Layout.flow('vertical'),
  style:{}
});

var legendTitle = ui.Label('Total canopy cover (%)',{color: '292929', fontSize: '16px', fontWeight: '500'});
var southlabel = ui.Panel([ui.Label('AGBD Mean',{margin: '2px 8px'})],'flow',{margin: '4px 0px',width:'78px'});
var boreallabel = ui.Panel([ui.Label('AGBD Standard Deviation',{margin: '2px 8px'})],
  'flow',{margin: '4px 0px 4px 12px',width:'85px'});


var legend = ui.Panel([southlabel,colorBar, legendLabels], ui.Panel.Layout.flow('horizontal'));
var legendB = ui.Panel([boreallabel,colorBarB, legendLabelsB], ui.Panel.Layout.flow('horizontal'));
var legendPanel = ui.Panel([legend,legendB],ui.Panel.Layout.flow('horizontal',true),{});
var mainText = ui.Label('This dashboard maps the total canopy cover measured by the GEDI sensors aboard the International Space Station.',
                        {width: '300px', stretch: 'horizontal'});
var citation = ui.Label('Dubayah, R., Tang, H., Armston, J., Luthcke, S., Hofton, M., Blair, J. (2021). GEDI L2B Canopy Cover and Vertical Profile Metrics Data Global Footprint Level V002 [Data set]. NASA EOSDIS Land Processes Distributed Active Archive Center. Accessed 2023-11-16 from https://doi.org/10.5067/GEDI/GEDI02_B.002',
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
