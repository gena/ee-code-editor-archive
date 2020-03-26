/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var images = ee.ImageCollection("LANDSAT/LC8_L1T_TOA");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
function initMap(map) {
  map.setCenter(6.71, 7.17, 15)
}

initMap(Map)

var image = ee.Image(images.filterBounds(Map.getBounds(true)).filter(ee.Filter.lt('CLOUD_COVER', 10)).toList(1,1).get(0))

//Map.addLayer(image.select(['B6','B5','B2']))
//return

function createMapBlocky() {
  var map = new ui.Map()

  map.addLayer(image.select(['B6','B5','B8']), {}, 'image')

  var water = image.expression('(b(7)-b(4))/(b(7)+b(4)) > -0.05')
  
  map.addLayer(water.mask(water), {palette:['3182bd']}, 'blocky')
  
  var vector = water.mask(water).reduceToVectors({geometry: Map.getBounds(true), scale: Map.getScale()})
  print('Blocky vector vertex count:', vector.geometry().coordinates().flatten().size())
  map.addLayer(vector, {}, 'blocky (vector)')
  
  var points = ee.Geometry.MultiPoint(vector.geometry().coordinates().flatten())
  map.addLayer(ee.Image().paint(points), {palette:['ffffff']}, 'points')
  
  map.add(ui.Label('blocky', {position:'bottom-center'}))
  
  return map
}


function createMapPretty() {
  var map = new ui.Map()

  map.addLayer(image.resample('bicubic').select(['B6','B5','B8']), {}, 'image')

  var water = image.resample('bicubic').expression('(b(7)-b(4))/(b(7)+b(4)) > 0')
    //.focal_mode(20, 'circle', 'meters', 3)
  
  map.addLayer(water.mask(water), {palette:['3182bd']}, 'pretty')
  
  var vector = water.mask(water).reduceToVectors({geometry: Map.getBounds(true), scale: Map.getScale() * 0.5 })
  print('Pretty vector vertex count:', vector.geometry().coordinates().flatten().size())
  
  map.addLayer(vector, {}, 'finer (vector)')

  var points = ee.Geometry.MultiPoint(vector.geometry().coordinates().flatten())
  map.addLayer(ee.Image().paint(points), {palette:['ffffff']}, 'points')

  map.add(ui.Label('pretty', {position:'bottom-center'}))
  
  return map
}

function createMapSmall() {
  var map = new ui.Map()

  map.addLayer(image.resample('bicubic').select(['B6','B5','B8']), {}, 'image')

  var water = image.resample('bicubic').expression('(b(7)-b(4))/(b(7)+b(4)) > 0')

  map.addLayer(water.mask(water), {palette:['3182bd']}, 'pretty')

  var vector = water.mask(water).reduceToVectors({geometry: Map.getBounds(true), scale: Map.getScale() * 0.5 })
  var vector = vector.map(function(f) { return f.simplify(Map.getScale()*3)})
  print('Small vector vertex count:', vector.geometry().coordinates().flatten().size())
  
  map.addLayer(vector, {}, 'smaller (vector)')

  var points = ee.Geometry.MultiPoint(vector.geometry().coordinates().flatten())
  map.addLayer(ee.Image().paint(points), {palette:['ffffff']}, 'points')

  map.add(ui.Label('prettier', {position:'bottom-center'}))

  return map
}


// add maps
function createMap(title) {
  var map = ui.Map()
  var title = ui.Label(title, {position:'top-center'})
  map.add(title)

  return map  
}

function getMapSize() {
  var scale = Map.getScale()
  var bounds = ee.Geometry(Map.getBounds(true)).transform('EPSG:3857', scale).coordinates().get(0).getInfo()
  
  var ll = bounds[0]
  var ur = bounds[2]
  var width = (ur[0] - ll[0]) / scale
  var height = (ur[1] - ll[1]) / scale
  
  return { w: Math.floor(width), h: Math.floor(height) }
}

var maps = [createMapBlocky(), createMapPretty(), createMapSmall()]

var height = getMapSize().h

print()

// Create a panel with vertical flow layout.
var panel = ui.Panel({
  layout: ui.Panel.Layout.flow('horizontal'),
  style: {width: '100vw', height: height + 'px'}
});

var linker = ui.Map.Linker(maps)

maps.map(function(map) { 
  initMap(map)
  map.setOptions('HYBRID')
  panel.add(map)
})
  
ui.root.clear();
ui.root.add(panel);

