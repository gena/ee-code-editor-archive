/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var geometry = /* color: #ff0202 */ee.Geometry.LineString(
        [[-118.74366760253906, 34.508254118465544],
         [-118.76289367675781, 34.45731417753458]]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
/***
 * Generates image collection gallery.
 */
var gallery = function(images, region, rows, columns) {
  var proj = ee.Image(images.first()).select(0).projection()
  var scale = proj.nominalScale()
  
  var e = ee.ErrorMargin(0.1)

  var bounds = region.transform(proj, e).bounds(e, proj)
  
  var count = ee.Number(columns * rows)
  
  // number of images is less than grid cells
  count = count.min(images.limit(count).size())
  
  images = images.limit(count)

  var indices = ee.List.sequence(0, count.subtract(1))
  
  var offsetsX = indices.map(function(i) { return ee.Number(i).mod(columns) })
  var offsetsY = indices.map(function(i) { return ee.Number(i).divide(columns).floor() })

  var offsets = offsetsX.zip(offsetsY)

  var ids = ee.List(images.aggregate_array('system:index'))
  var offsetByImage = ee.Dictionary.fromLists(ids, offsets)
  
  var coords = ee.List(bounds.coordinates().get(0))

  var w = ee.Number(ee.List(coords.get(1)).get(0)).subtract(ee.List(coords.get(0)).get(0)).floor()
  var h = ee.Number(ee.List(coords.get(2)).get(1)).subtract(ee.List(coords.get(0)).get(1)).floor()
  
  var boundsImage = ee.Image().toInt().paint(bounds, 1).reproject(proj)
  
  var mosaic = images
    .map(function(i) {
      var offset = ee.List(offsetByImage.get(i.get('system:index')))
      var xoff = w.multiply(offset.get(0)).multiply(scale)
      var yoff = h.multiply(offset.get(1)).multiply(scale)
  
      i = i.updateMask(boundsImage)

      return i.translate(xoff, yoff, 'meters', proj)
  }).mosaic()
  
  return mosaic
}

// ================================ script
// build collection
var images = new ee.ImageCollection('LANDSAT/LC8_L1T_TOA').select(['B6', 'B5', 'B3'])
  .filterBounds(geometry.centroid(1)).limit(100);
  
// flatten image collection into a single image over a given area
var columns = 20
var rows = 5
var combined = gallery(images, geometry.bounds(), rows, columns)

Map.addLayer(combined, {min:0.04, max:0.4}, 'image collection gallery')
