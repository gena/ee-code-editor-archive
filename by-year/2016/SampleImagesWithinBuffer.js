/*--------------
Define functions
--------------*/

// Feature builder (BUild a feature with geometry from a geometry-less feature but with lon lat as attributes)
var featureBuilder = function(f) { 
  return ee.Feature(ee.Geometry.Point([f.get('longitude'), f.get('latitude')]), f.toDictionary());
};

// For each feature: buffer, clip, sample, extract Landsat
var bufferClipSampleExtract = function(feature) {
  // Buffer feature
  var buffer = feature.buffer(20000);
  // Clip gain (imported below) using buffer
  var gain_sub = gain.clip(buffer);
  // Sample points
  var samples = gain_sub.addBands(ee.Image.pixelLonLat())
  .sample({'scale': 30, 'numPixels' : 50000, 'region': buffer.geometry()})
  .limit(50)
  .map(featureBuilder);
  
  return(samples);
};

// Clean LEDAPS collection using QA band
var maskBadData = function(image) {
  var invalid = image.select('QA').bitwiseAnd(0x6).neq(0);
  var clean = image.mask(invalid.not());
  return(clean);
};
  
  
// Reducer to extract Landsat time-series (To be mapped over an image collection)
var getMeans = function(image) {
  return ee.Image(image)
  .reduceRegions({collection: samples, // samples is a featureCollection generated below
                  reducer: ee.Reducer.first(),
                  scale: 30,
                  crs: 'EPSG:4326'});
};


/*------------
IMport objects
------------*/

// Fusion table of sites (filtered for example)
var sites = ee.FeatureCollection('ft:1kxwV92VTVARKuO0PvroplF_0lACXpblJuJkoAx6M')
   .filterMetadata('AGB_percent', 'less_than', 30);
// var sites = ee.FeatureCollection('ft:1Y8xoT2iBE49C5F1b5AtRAGlHvEejIGFm7NZayBiY');

// Tree cover layer
var hansen = ee.Image('UMD/hansen/global_forest_change_2015')
  .select('gain');
  
// Mask tree cover gain layer
var gain = hansen.mask(hansen);

// IMport, clean, subset LEDAPS collections
var LT5 = ee.ImageCollection("LEDAPS/LT5_L1T_SR")
    .filterDate('1988-05-01', '1990-01-01')
    .filterBounds(sites)
    .map(maskBadData)
    .select(['B1', 'B2', 'B3', 'B4', 'B5', 'B7']);
    
var LE7 = ee.ImageCollection("LEDAPS/LE7_L1T_SR")
    .filterDate('2000-01-01', '2003-05-01')
    .filterBounds(sites)
    .map(maskBadData)
    .select(['B1', 'B2', 'B3', 'B4', 'B5', 'B7']);
    
/*---------------
Process data
---------------*/

// Generate samples from sites featureCollection
var samples = sites.map(bufferClipSampleExtract)
  .flatten();

Map.addLayer(samples)  

// Extract time-series using 'samples' featureCollection
var ts = samples.map(function(f) {
  return f
})

function addTimeBand(image) {
    return ee.Image.constant(image.get('system:time_start')).toLong().addBands(image)
}

function reduceToTimeSeries(imageCollection, params) {
  return imageCollection.map(addTimeBand).toArray().reduceRegions(params);
}

var LT5_ts = reduceToTimeSeries(LT5, {collection: samples, reducer: ee.Reducer.first(), scale: 30, crs: 'EPSG:4326'})

/* 
var LT5_ts = LT5
  .map(getMeans)
  .flatten()
  .filter(ee.Filter.neq("B1", null));
*/  

var LE7_ts = reduceToTimeSeries(LE7, {collection: samples, reducer: ee.Reducer.first(), scale: 30, crs: 'EPSG:4326'})

/*  .map(getMeans)
  .flatten()
  .filter(ee.Filter.neq("B1", null));
*/

/*----------
INspect
----------*/
// console.log(samples);
console.log(sites);

/*----------
Visualize
----------*/
Map.addLayer(sites);


/*----------
Export
----------*/
Export.table(LT5_ts, 'LT5_export', {fileFormat: 'GeoJSON',
                                    //driveFolder: 'GEE',
                                    driveFileNamePrefix: 'latin_america_sites_LT5'
});


Export.table(LE7_ts, 'LE7_export', {fileFormat: 'GeoJSON',
                                    driveFolder: 'GEE',
                                    driveFileNamePrefix: 'latin_america_sites_LE7'
});
