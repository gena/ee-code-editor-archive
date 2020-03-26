/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var s2 = ee.ImageCollection("COPERNICUS/S2"),
    location = /* color: #d63000 */ee.Geometry.Point([29.216905155664108, -1.4215563274389142]),
    clouds = ee.Image("users/gena/MODCF_meanannual"),
    l5 = ee.ImageCollection("LANDSAT/LT05/C01/T1_TOA");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
var image = s2
  .filterDate('2015-01-01', '2018-01-01')
  .select(['B11','B8','B4'])
  .reduce(ee.Reducer.percentile([10]))
  .divide(10000)

Map.addLayer(image, {min: 0.03, max:0.4}, '2016')

print(clouds.reduceRegion(ee.Reducer.first(), location, Map.getScale()).values().get(0))

var assets = require('users/gena/packages:assets')

// get mostly cloud-free images
var gallery = require('users/gena/packages:gallery')

var clean = true
var images = assets.getImages(location, clean, ['S2', 'L8', 'L7'])
var scale = Map.getScale()
Map.addLayer(gallery.draw(images, location.buffer(scale*100).bounds(), 5, 9, scale), {min: 0.03, max: 0.4}, 'gallery')


// add labels
var text = require('users/gena/packages:text')

var imagesTime = images.map(function(i) { 
  var str = ee.Date(i.get('system:time_start')).format('YYYY-MM-dd')
  var props = {fontSize:12, textColor: 'ffffff', outlineColor: '000000', outlineWidth: 3, outlineOpacity: 0.6}
  
  return text.draw(str, location, Map.getScale(), props)
})

Map.addLayer(gallery.draw(images, location.buffer(scale*100).bounds(), 9, 5, scale), {}, 'gallery (time)')


  