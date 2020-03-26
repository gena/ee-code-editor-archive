/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var geometry = /* color: #d63000 */ee.Geometry.LineString(
        [[4.172916412353516, 52.0691660526751],
         [4.205360412597656, 52.03390781966253]]),
    images = ee.ImageCollection("LANDSAT/LC8_L1T_TOA");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
function app() {
  images = community.filterMask(images, geometry, 'all')

  var rows = 3
  var columns = 15
  var region = geometry.bounds()
  
  var gallery = community.ImageGallery(images, region, rows, columns)
  
  Map.addLayer(gallery, {bands: ['B6', 'B5', 'B3'], min: 0.03, max: 0.5}, 'sentinel 2')
}























var community = { }

/***
 * Generates image collection gallery.
 */
community.ImageGallery = function(images, region, rows, columns) {
  // var proj = ee.Image(images.first()).select(0).projection()
  var proj = ee.Projection('EPSG:3857', [15, 0, 0, 0, -15, 0])
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
  
  // new region
  var ll = ee.List(coords.get(0))
  var ur = [ee.Number(ll.get(0)).add(w.multiply(columns)), ee.Number(ll.get(1)).add(h.multiply(rows))]
  
  var regionNew = ee.Geometry.Rectangle([ll, ur], proj, false)
  
  var mosaic = images
    .map(function(i) {
      var offset = ee.List(offsetByImage.get(i.get('system:index')))
      var xoff = w.multiply(offset.get(0)).multiply(scale)
      var yoff = h.multiply(offset.get(1)).multiply(scale)
  
      i = i.updateMask(boundsImage)
      
      return i.translate(xoff, yoff, 'meters', proj)
  }).mosaic()
  
  return mosaic;
}

/***
 * Filters image collection using bounds and mask
 */
community.filterMask = function(images, region, method) {
  // filter using bounds
  images = images
    .filterBounds(region)  

  var reducers = {
    'any': ee.Reducer.anyNonZero(),
    'all': ee.Reducer.allNonZero()
  }
  
  var reducer = reducers[method]

  // filter using mask of the first band
  images = images
    .map(function(i) { 
      return i.set('mask_filter', i.select(0).mask().reduceRegion(reducer, region).values().get(0)) })
    .filter(ee.Filter.eq('mask_filter', 1))

  return images
}



app()