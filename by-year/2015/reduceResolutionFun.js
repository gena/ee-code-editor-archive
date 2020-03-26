var wgs84 = ee.Projection('EPSG:4326');
var utm15n = ee.Projection('EPSG:32615')

var size = 13

// cells
var cells = ee.Image.pixelLonLat().ceil().toInt().reduce(ee.Reducer.sum()).bitwiseAnd(1)
  .changeProj(wgs84, utm15n.scale(30 * size, 30 * size));

var cellsSmall = ee.Image.pixelLonLat().floor().toInt().reduce(ee.Reducer.sum()).bitwiseAnd(1)
  .changeProj(wgs84, utm15n.scale(30, 30));

// centers
var centroids =  ee.Image.pixelLonLat().floor().toInt().mod(size).abs().reduce(ee.Reducer.sum())
  .changeProj(wgs84, utm15n.scale(30, 30).translate((size - 1)/2, (size - 1)/2)).eq(0)

// indices
var indices =  ee.Image.pixelLonLat().toInt().mod(size).abs()
  .changeProj(wgs84, utm15n.scale(30, 30))

// blobs
var blobs = indices.mask(indices.gte(4).and(indices.lt(size-4)))

// compute cell centers using geometric mean
var mean = indices.mask(blobs)
  .reduceResolution(ee.Reducer.mean(), true, size * size)
  .unmask()
  .reproject(cells.projection())
  .round()

var centroidsNew = indices.eq(mean).reduce(ee.Reducer.bitwiseAnd())


// center of UTM 15N zone
Map.setCenter(-48.0000, -4.0000, 16)

Map.addLayer(cellsSmall, {opacity:0.5, min:0, max:1}, 'cells (small)')
Map.addLayer(cells, {opacity:0.5, min:0, max:1}, 'cells')
Map.addLayer(indices, {opacity:0.5}, 'indices', false)
Map.addLayer(blobs.mask(blobs), {opacity:0.5}, 'blobs')
Map.addLayer(centroids.mask(centroids), {}, 'centroids')

Map.addLayer(mean, {}, 'blob mean coordinates', false)
Map.addLayer(centroidsNew.mask(centroidsNew), {min:0, max:1, palette:['ff0000']}, 'new centroid')


