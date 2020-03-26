/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var l8 = ee.ImageCollection("LANDSAT/LC8_L1T_TOA"),
    l7 = ee.ImageCollection("LANDSAT/LE7_L1T_TOA"),
    l5 = ee.ImageCollection("LANDSAT/LT5_L1T_TOA");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
Map.setCenter(73.20, 40.75, 11);
var center = Map.getCenter(true).centroid();
var bounds = ee.Geometry(Map.getBounds(true))

var LC8_BANDS = ['B1',    'B2',   'B3',    'B4',  'B5',  'B6',    'B7',    'B8', 'B10'];
var LC7_BANDS = ['B1',    'B1',   'B2',    'B3',  'B4',  'B5',    'B7',    'B8', 'B6_VCID_1'];
var LC5_BANDS = ['B1',    'B1',   'B2',    'B3',  'B4',  'B5',    'B7',    'B1', 'B6'];
var STD_NAMES = ['blue2', 'blue', 'green', 'red', 'nir', 'swir1', 'swir2', 'pan', 'temp'];

l8 = l8.select(LC8_BANDS, STD_NAMES);
l7 = l7.select(LC7_BANDS, STD_NAMES);
l5 = l5.select(LC5_BANDS, STD_NAMES);

var images = ee.ImageCollection([]);
[l8, l7, l5].forEach(function(element, index, array) { 
  images = ee.ImageCollection(images.merge(element)); 
})

var startDate = '1969-01-01'
var endDate = '2050-01-01'

images = images
  .filterBounds(center)
  .filterDate(startDate, endDate);

var count = images.select(0).count();

var scale = 1000;

var minMax = count.reduceRegion(ee.Reducer.minMax(), bounds, scale)
print(minMax)

print(Chart.image.histogram(count, bounds, scale))

Map.addLayer(count, {min:minMax.get(1), max:minMax.get(0)}, 'count')

print(images.first())


print(images.first())

