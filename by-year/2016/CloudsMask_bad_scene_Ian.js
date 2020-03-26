/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var geometry = /* color: #d63000 */ee.Geometry.Point([-100.96710205078125, 40.765981527712825]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
// Landsat SR cloud masks


// get imagery
// landsat 5 SR
var l5_0 = ee.ImageCollection('LANDSAT/LT5_SR')
    .filterDate('1996-08-01', '1996-08-31')
    .filterBounds(geometry);
    
// landsat 5 TOA
var toa = ee.ImageCollection('LANDSAT/LT5_L1T_TOA_FMASK')
    .filterDate('1996-08-01', '1996-08-31')
    .filterBounds(geometry);    
print(toa)    
    
// create function to mask clouds, cloud shadows, snow using the cfmask layer in SR products
var maskClouds = function(image){
  var cfmask = image.select('cfmask');    
  return image.updateMask(cfmask.lt(2));   // keep clear (0) and water (1) pixels
};

// function to add greenness indices and time, and clip to polygon boundary
var addNDVI = function(image) {
  return image.addBands(image.normalizedDifference(['B4','B3']).rename('NDVI'))
  // system time
  .addBands(image.metadata('system:time_start').rename("time"))
};

// apply functions over the image collection
var l5 = l5_0
  .map(addNDVI)
  .map(maskClouds);
print(l5)

// get maximum value composites
var maxNDVI = l5.select('NDVI').max();
  
// visualize
Map.centerObject(geometry, 9);

var palette = [
  'FFFFFF', 'CE7E45', 'DF923D', 'F1B555', 'FCD163', '99B718',
  '74A901', '66A000', '529400', '3E8601', '207401', '056201',
  '004C00', '023B01', '012E01', '011D01', '011301'];

Map.addLayer(toa, {bands: ['fmask'],'min':0,'max':4}, 'toa fmask',false)
Map.addLayer(toa, {bands: ['B6'], min: 270, max: 315}, 'thermal',false)
Map.addLayer(l5_0, {bands: ['B3','B2','B1'], min: 0, max: 3000}, 'tcc',false)
Map.addLayer(maxNDVI, {min:-1, max:1, palette: palette}, 'ndvi',false);

// landsat 5 TOA
var toa2 = ee.ImageCollection('LANDSAT/LT5_L1T_TOA')
    .filterDate('1996-08-01', '1996-08-31')
    .filterBounds(geometry);    
var toaImage = ee.Image(toa2.first())
Map.addLayer(toaImage, {bands: ['B3','B2','B1'], min: 0, max: 0.3}, 'toa2',false)

var cs = ee.Algorithms.Landsat.simpleCloudScore(toaImage).select('cloud')
Map.addLayer(cs.mask(cs.divide(100)),{'min':0,'max':100, palette:['ffff00']},'Cloud Score 2',false);

var cloudScore = toa.map(ee.Algorithms.Landsat.simpleCloudScore);
Map.addLayer(cloudScore.select(['cloud']),{'min':5,'max':20},'Cloud Score',false);
var cloudMasked = cloudScore.map(function(img){
      var cloud = img.select(['cloud']);
      var cloudMask = cloud.gt(10);
      return img.updateMask(cloudMask.not())
})
Map.addLayer(cloudMasked,{bands: ['B3','B2','B1'], min: 0, max: 0.3}, 'After cloud score masked',false);
