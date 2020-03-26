var p = function(image){return image.log10().multiply(10)};

var pol = 'VV';

var img = ee.ImageCollection('COPERNICUS/S1')
 .filterBounds(ee.Geometry(Map.getBounds(true)).centroid(1))
 .sort('system:time_start', false)

print(img.first()) 
 


var img = ee.ImageCollection('COPERNICUS/S1').
 filter(ee.Filter.eq('transmitterReceiverPolarisation', pol)).
 filterMetadata('instrumentMode', 'equals', 'IW')

/*var dates = ee.FeatureCollection(img.
map(function(i) {
  var f = ee.Feature(null)
  return f.set('date', ee.Date(i.get('SLC_Processing_start')))
}))
print(dates.first())
*/ 
var imgD = img.filterMetadata('orbitProperties_pass', 'equals', 'DESCENDING')//.map(p);
var imgA = img.filterMetadata('orbitProperties_pass', 'equals', 'ASCENDING')//.map(p);

var rgbD = ee.Image(imgD.first())
Map.addLayer(rgbD.select([0, 0, 1], ['r', 'g', 'b']), {min:[], max:[]}, 'DESC, first');

var rgbA = ee.Image(imgA.first())
Map.addLayer(rgbA.select([0, 0, 1], ['r', 'g', 'b']), {}, 'ASC, first');

Map.addLayer(rgbD, {}, 'D raw', false)
Map.addLayer(rgbA, {}, 'A raw', false)

print('D: ', ee.Date(rgbD.get('system:time_start')))
print('A: ', ee.Date(rgbA.get('system:time_start')))

/*
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
Map.addLayer(rgbMax, {min:[-15, -15, -5], max:[5, 5, 5]}, 'MAX');
*/