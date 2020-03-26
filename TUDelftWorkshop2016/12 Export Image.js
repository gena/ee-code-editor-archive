// https://developers.google.com/earth-engine/exporting#to-drive

var l8 = ee.ImageCollection("LANDSAT/LC8_L1T_TOA");

var STD_NAMES = ['blue', 'green', 'red', 'nir', 'swir1', 'pan'];
var L8_NAMES =  ['B2',   'B3',    'B4',  'B5',  'B6',    'B8'];

var bounds = Map.getBounds(true)

l8 = l8
  .select(L8_NAMES, STD_NAMES)
  .filterBounds(bounds)
  .filterMetadata('CLOUD_COVER', 'less_than', 20)
  .select(['red', 'green', 'blue', 'nir'])

var image = ee.Image(l8.first())

var vis = {min:0.05, max:[0.15, 0.15, 0.2]};

Map.addLayer(image, vis, 'L8')

print(image)


var fileName = image.get('LANDSAT_SCENE_ID').getInfo()

print(fileName)

var imageRendered = image.visualize(vis)

Export.image.toDrive({
  image: imageRendered,
  description: fileName,
  fileNamePrefix: fileName,
  scale: 30,
  region: bounds
});