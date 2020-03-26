var l8 = ee.ImageCollection("LANDSAT/LC8_L1T_TOA");

var STD_NAMES = ['blue', 'green', 'red', 'nir', 'swir1', 'pan'];
var L8_NAMES =  ['B2',   'B3',    'B4',  'B5',  'B6',    'B8'];

l8 = l8
  .select(L8_NAMES, STD_NAMES)
  .filterBounds(Map.getBounds(true))
  .filterMetadata('CLOUD_COVER', 'less_than', 20)
  .select(['red', 'green', 'blue', 'nir'])

var image = ee.Image(l8.first())

var vis = {min:0.05, max:0.25};

Map.addLayer(image, vis, 'L8')

print(image)

image = image
  .visualize(vis)
  .clip(Map.getBounds(true))

var id = image.get('LANDSAT_SCENE_ID').getInfo()

// new, async way
Export.image.toDrive({
  image: image,
  description: id,
  scale: 30,
  region: Map.getBounds(true)
});

// old, sync way
print(image.getDownloadURL({format:'png'}))
