
var p = function(image){return image.log10().multiply(10)};

var pol = 'VV';

var imgVV = ee.ImageCollection('COPERNICUS/S1_GRD').
 filter(ee.Filter.eq('transmitterReceiverPolarisation', pol)).
 filterMetadata('instrumentMode', 'equals', 'IW');


print(ee.ImageCollection('COPERNICUS/S1_GRD').filterBounds(Map.getBounds(true))
  .aggregate_histogram('transmitterReceiverPolarisation'))
 
var imgD = imgVV.filterMetadata('orbitProperties_pass', 'equals', 'DESCENDING').select(pol).map(p);
var imgA = imgVV.filterMetadata('orbitProperties_pass', 'equals', 'ASCENDING').select(pol).map(p);

var imgDmax = imgD.max();
var imgDmean = imgD.mean();
var imgDmin = imgD.min();

var imgAmax = imgA.max();
var imgAmean = imgA.mean();
var imgAmin = imgA.min();

var rgbD = imgDmax.addBands(imgDmean).addBands(imgDmin)
Map.addLayer(rgbD, {min:[-15, -20, -25], max:[0, -5, -10]}, 'DESC');

var rgbA = imgAmax.addBands(imgAmean).addBands(imgAmin)
Map.addLayer(rgbA, {min:[-15, -20, -25], max:[0, -5, -10]}, 'ASC');

var rgbM = imgDmean.addBands(imgAmean).addBands(imgDmean.subtract(imgAmean));
Map.addLayer(rgbM, {min:[-20, -20, -5], max:[-5, -5, 5]}, 'MIXED');
//Map.setCenter(1.24, 42.16, 10)

var rgbMax = imgDmax.addBands(imgAmax).addBands(imgAmean.subtract(imgDmean));
Map.addLayer(rgbMax, {min:[-15, -15, -5], max:[5, 5, 5]}, 'MAXED');