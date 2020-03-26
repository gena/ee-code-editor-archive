/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var l8 = ee.ImageCollection("LANDSAT/LC8_L1T_TOA"),
    geometry = /* color: d63000 */ee.Geometry.Point([-111.24755859375, 37.081475648860525]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
function run() {
  Map.centerObject(geometry, 15)
  
  // add a few images as map layers
  var count = 10
  var images = l8.filterBounds(geometry).toList(count)

  for(var i=0; i<count; i++) {
    var image = ee.Image(images.get(i))
    addLayer(image) 
  }
}

function  addLayer(image) {
  Map.addLayer(image, {bands: ['B4', 'B3', 'B2'], min: 0.05, max:0.5}, 'loading ...')

  // get last layer
  var layers = Map.layers()
  var layer = layers.get(layers.length()-1)
  
  function updateLayerName(name) {
    print('Changing layer name from ' + layer.getName() + ' to ' + name)
    print('Map layer count: ' + layers.length())
    layer.setName(name)
  }
  
  // update layer name using image date
  ee.Date(image.get('system:time_start')).format('YYYY-MM-dd').getInfo(updateLayerName)
}

run()