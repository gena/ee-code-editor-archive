/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var s2 = ee.ImageCollection("COPERNICUS/S2"),
    geometry = /* color: #d63000 */ee.Geometry.LineString(
        [[5.996818542480469, 53.48722843308561],
         [6.080589294433594, 53.436741822872065]]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
function app() {

s2 = s2
  .filterBounds(geometry)
  .select(['B4','B3','B2'])
  
Map.addLayer(s2.select(1).count(), {min:10, max:300, palette:['ff5050', '50ff50']}, 'count')
Map.addLayer(s2.select(1).map(function(i) { return ee.Image(1).mask(i.paint(i.geometry(), 1, 1))}), {}, 'footprints')
  
s2 = ee.ImageCollection(s2.distinct('system:time_start'))
print(s2.size())  

Map.addLayer(s2.select(1).count(), {min:10, max:300, palette:['ff5050', '50ff50']}, 'count, filtered')  
Map.addLayer(s2.select(1).map(function(i) { return ee.Image(1).mask(i.paint(i.geometry(), 1, 1))}), {}, 'footprints, filtered')
var images = s2  

var rows = 15
var columns = 30

var imageGallery = gallery(images, geometry.bounds(), rows, columns)
Map.addLayer(imageGallery.image, {min:300, max:3000}, 'images')

}


/***
 * Generates image collection gallery.
 */
var gallery = function(images, region, rows, columns) {
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

  var w = ee.Number(ee.List(coords.get(1)).get(0)).subtract(ee.List(coords.get(0)).get(0))//.floor()
  var h = ee.Number(ee.List(coords.get(2)).get(1)).subtract(ee.List(coords.get(0)).get(1))//.floor()

  // CRASHES
  // var boundsImage = ee.Image().changeProj('EPSG:4326', proj).toInt().paint(bounds)

  var boundsImage = ee.Image().toInt().reproject(proj).paint(bounds, 1)

  // new region
  var ll = ee.List(coords.get(0))
  var ur = [ee.Number(ll.get(0)).add(w.multiply(columns)), ee.Number(ll.get(1)).add(h.multiply(rows))]
  
  var regionNew = ee.Geometry.Rectangle([ll, ur], proj, false)
  
  var mosaic = images
    .map(function(i) {
      var offset = ee.List(offsetByImage.get(i.get('system:index')))
      var xoff = w.multiply(offset.get(0)).multiply(scale)
      var yoff = h.multiply(offset.get(1)).multiply(scale)
  
      i = i.mask(boundsImage.multiply(i.mask()))

      return i.translate(xoff, yoff, 'meters', proj)
  }).mosaic()
  
  return {image: mosaic, region: regionNew};
}

app()