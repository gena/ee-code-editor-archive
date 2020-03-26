/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var s2 = ee.ImageCollection("COPERNICUS/S2"),
    mod = ee.ImageCollection("MODIS/MOD09GQ"),
    myd = ee.ImageCollection("MODIS/MYD09GQ"),
    geometry = /* color: d63000 */ee.Geometry.MultiPoint();
/***** End of imports. If edited, may not auto-convert in the playground. *****/
Export.video.toDrive({
  collection: s2.filterBounds(Map.getBounds(true)).map(function(i) {
    return i.visualize({min:0, max:5000, bands:['B4', 'B3', 'B2']}).resample('bicubic')
  }), 
  fileNamePrefix: 'test', 
  framesPerSecond: 5, 
  region: Map.getBounds(true), 
  scale: 5});

var image = ee.Image(s2.filterBounds(Map.getBounds(true)).toList(1,1).get(0))
  .visualize({min:0, max:5000, bands:['B8', 'B8', 'B3']})

Map.addLayer(image)

Map.addLayer(image.resample('bicubic'))

var bounds = Map.getBounds()
var scale = Map.getScale()
var w = bounds[3] - bounds[1]
var h = bounds[2] - bounds[0]
var ratio = w / h
print(ratio)

var w = 256
var h = Math.round(w * ratio)

var bounds = Map.getBounds(true)
print(image.getThumbURL({dimensions: w + 'x' + h, region: bounds, format:'png'}))

var image = ee.Image(mod.filterBounds(Map.getBounds(true)).toList(1,20).get(0))
  .visualize({min:0, max:5000, bands:['sur_refl_b01','sur_refl_b02','sur_refl_b01']})

Map.addLayer(image)


var image = ee.Image(mod.filterBounds(Map.getBounds(true)).toList(1,20).get(0))
  .visualize({min:0, max:5000, bands:['sur_refl_b01','sur_refl_b02','sur_refl_b01']}).reproject(ee.Projection('EPSG:4326'), null, 250)

Map.addLayer(image)

var bounds = Map.getBounds(true)
print(image.getThumbURL({dimensions: w + 'x' + h, region: bounds, format:'png'}))

var image = ee.ImageCollection(mod.merge(myd))
  .filterDate('2015-01-01', '2015-03-01')
  .select(['sur_refl_b01','sur_refl_b02'])
  .map(function(i) { return i.reproject(ee.Projection('EPSG:4326'), null, 10) })
  .reduce(ee.Reducer.percentile([5]))
  .rename(['sur_refl_b01','sur_refl_b02'])
  .visualize({min:0, max:5000, bands:['sur_refl_b01','sur_refl_b02','sur_refl_b01']})

Map.addLayer(image)
