/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var images = ee.ImageCollection("LANDSAT/LC08/C01/T1_RT_TOA"),
    geometry = /* color: #98ff00 */ee.Geometry.LineString(
        [[-93.74269008636475, 34.86526410650909],
         [-93.73796939849854, 34.86589791969789],
         [-93.73329162597656, 34.8655810137141],
         [-93.72947216033936, 34.864559863903416]]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
var image = ee.Image(images.filterBounds(Map.getCenter()).first())
  .select(['B5','B6','B4'])
  .addBands(ee.Image.pixelLonLat())

Map.addLayer(image, {min: 0, max: 0.25})

var images = regionToImageCollection(image, geometry)

Map.addLayer(images, {}, 'pixels within geometry', false)

// show results for geometry centroid
var scale = Map.getScale()
print(ui.Chart.image.series({
  imageCollection: images.select(['B4','B5','B6']), 
  region: geometry.centroid(), 
  scale: scale, 
  xProperty: 'offset'
}))


// show pixel coordinates
var text = require('users/gena/packages:text');

// get coordinates and indices
var values = image.reduceRegion(ee.Reducer.toList(), geometry)

var centers = ee.List(values.get('longitude')).zip(values.get('latitude')).zip(ee.List.sequence(0, ee.List(values.get('longitude')).length().subtract(1)))
  .map(function(o) {
    o = ee.List(o)
    var xy = o.get(0)
    var offset = o.get(1)
    return ee.Feature(ee.Algorithms.GeometryConstructors.Point(xy), {offset: offset})
  })

centers = ee.FeatureCollection(centers)

Map.addLayer(centers, {}, 'cell centers')

var offsetText = ee.ImageCollection(centers.map(function(i) {
  return text.draw(ee.Number(i.get('offset')).format('%d'), i.geometry(), Map.getScale(), {
    fontSize:12, textColor: '000000', outlineColor: 'ffffff', outlineWidth: 3, outlineOpacity: 0.6
  })
})).mosaic()

Map.addLayer(offsetText, {}, 'offset')

/***
 * Converts pixels withing a region into image collection (image per pixels)
 */
function regionToImageCollection(image, region) {
  var bandNames = image.bandNames()
  
  var values = image.reduceRegion(ee.Reducer.toList(), region)
  var n = ee.List(values.values().get(0)).length()  
  
  // convert lists of band values into a list of constant images
  var images = ee.List.sequence(0, n.subtract(1)).map(function(offset) {
    var row = values.values().map(function(c) { return ee.List(c).get(offset) })
    return ee.Image.constant(row).rename(bandNames).float().set({offset: offset})
  })
    // turn into image collection
  return ee.ImageCollection(images)
}





