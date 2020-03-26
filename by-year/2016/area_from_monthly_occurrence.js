// morphological internal gradient
function getEdge(mask) {
    return mask.focal_min(15, 'square', 'meters').subtract(mask.focal_min(65, 'square', 'meters')).reproject('EPSG:4326', null, 30)
}

var monthlyWater = ee.ImageCollection('JRC/GSW1_0/MonthlyHistory')

var duration = 5
var start = ee.Date('2005-01-01')
var stop = start.advance(duration, 'year')

var water = monthlyWater.filterDate(start, stop).map(function(i) { return i.eq(2) })

/*
var waterAll = monthlyWater.map(function(i) { return i.eq(2) })
var waterAllNot = monthlyWater.map(function(i) { return i.eq(1) })

var occurrence = waterAll.sum().divide(waterAllNot.sum().add(waterAll.sum()))
Map.addLayer(occurrence.mask(occurrence.gt(0)), {palette:['ffffff', '0000ff']}, 'occurrence')
*/

var palette = ['ffffcc','ffeda0','fed976','feb24c','fd8d3c','fc4e2a','e31a1c','bd0026','800026']

var occurrence = ee.Image('JRC/GSW1_0/GlobalSurfaceWater').select('occurrence').multiply(0.01)
Map.addLayer(occurrence.mask(occurrence.get(0)), {min:1, max:0, palette: palette}, 'occurrence')

return
var aoi = ee.Geometry(Map.getBounds(true))

var i = 12 * 2
var count = 12  * 5
var list = water.toList(count, 0)
for(; i<count; i++) {
  var image = ee.Image(list.get(i))

  // get water edge
  var edge = getEdge(image).focal_min(15, 'square', 'meters')

  // compute most probable occurrence
  // var f = occurrence.mask(edge).reduceRegion(ee.Reducer.frequencyHistogram(), aoi, 15)
  //print(f)
  
  // estimate fill area (compute posterior)
  var occurrenceExpected = occurrence.mask(edge).reduceRegion(ee.Reducer.intervalMean(0, 15), aoi, 15).values().get(0)
  var posterior = occurrence.mask(occurrence.gt(ee.Image.constant(occurrenceExpected)))
  Map.addLayer(posterior, {palette:['ffff00']}, i.toString() + ' fill', false)

  // show histogram of water occurrence along the edge
  // print(i, ui.Chart.image.histogram(occurrence.mask(edge), aoi, 15))
  
  
  Map.addLayer(image.mask(image), {palette:['0000ff']}, i.toString(), false)

  Map.addLayer(edge.mask(edge), {palette:['ffffff']}, i.toString() + 'min', false)
}

