/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var aoi = /* color: d63000 */ee.Geometry.Polygon(
        [[[-76.6050910949707, 34.621483814225634],
          [-76.58586502075195, 34.581355096498896],
          [-76.48046493530273, 34.579376418851],
          [-76.48406982421875, 34.65185005068872],
          [-76.60869598388672, 34.65156762530254]]]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
var LC8_BANDS = ['B1', 'B2',   'B3',    'B4',  'B5',  'B6',    'B7',    'B8'];
var LC7_BANDS = ['B1', 'B1',   'B2',    'B3',  'B4',  'B5',    'B7',    'B8'];
var STD_NAMES = ['deepblue', 'blue', 'green', 'red', 'nir', 'swir1', 'swir2', 'pan'];


// var product = 'LANDSAT/LE7_L1T_TOA'
// var bands = LC7_BANDS

var product = 'LANDSAT/LC8_L1T_TOA'
var bands = LC8_BANDS

var images = ee.ImageCollection(product)
  .filterBounds(aoi)
  //.filterDate('2014-05-01', '2015-11-11')
  .select(bands, STD_NAMES);
  
var rgb = images.select(['swir2', 'nir', 'green'])  

Map.addLayer(images, {}, 'images', false)

print(images)
  
Map.addLayer(rgb.reduce(ee.Reducer.intervalMean(10, 11)), {min:0.05, max:0.5, gamma:2.0}, '10%')

Map.addLayer(rgb.reduce(ee.Reducer.intervalMean(50, 51)), {min:0.05, max:0.5, gamma:2.0}, '50%')
