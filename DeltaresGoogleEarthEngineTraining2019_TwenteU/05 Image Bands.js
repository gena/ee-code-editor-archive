/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var l8 = ee.ImageCollection("LANDSAT/LC08/C01/T1_TOA"),
    point = /* color: #98ff00 */ee.Geometry.Point([6.850943511372975, 52.24032978304532]),
    s2 = ee.ImageCollection("COPERNICUS/S2");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
Map.centerObject(point, 14)

// Select bands to visualize, Google for wavelengths used for different satellite missions

// See http://landsat.gsfc.nasa.gov/?p=10643 for a list of bands.
var filtered = l8.filterBounds(point).filterDate('2018-07-01', '2018-10-01').first();

Map.addLayer(filtered, {min:0, max:0.4, gamma: 1.4, bands:['B4','B3','B2']}, 'RGB');
Map.addLayer(filtered, {min:0, max:0.4, gamma: 1.4, bands:['B5','B4','B3']}, 'False Color');


// TODO: add Sentinel 2 image collection instead of Landsat 8. 

// TODO: Which bands do we need to use to create the same composites as for Landsat 8 (hint - check description)?









// TODO: uncomment the following code and inspect multiple S2 images for Twente

/* 

// The animation package is coming from http://bit.ly/ee-toolbox

var animation = require('users/gena/packages:animation')
var assets = require('users/gena/packages:assets')

var images = assets.getImages(point, { 
  missions: [
    'S2', 
    // 'L8'
  ],
  filter: ee.Filter.date('2018-07-01', '2018-10-01')
})

images = images
  .sort('system:time_start')
  .map(function(i) { return i.set({ label: i.date().format() })})

animation.animate(images, { 
  vis: { min:0.05, max: 0.4, bands: ['swir', 'nir', 'red'] }, 
  preload: false,
  label: 'label' 
})


*/