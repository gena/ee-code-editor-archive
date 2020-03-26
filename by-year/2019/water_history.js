/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var monthly = ee.ImageCollection("JRC/GSW1_0/MonthlyHistory");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
Map.addLayer(ee.Image(1), { palette: ['black'] }, 'black', true, 0.5)
Map.setOptions('SATELLITE')

var start = ee.Date('1985-01-01')
var stop = ee.Date('2015-10-01')
var range = stop.millis().subtract(start.millis())

var years = ee.List.sequence(1985, 2015)
var images = years.map(function(y) {
  var t0 = ee.Date.fromYMD(y, 1, 1)
  var t1 = t0.advance(1, 'year')
  
  var occurrence = monthly.filterDate(t0, t1).map(function(i) {
    i = i.focal_mode(60, 'circle', 'meters')
    
    return i.eq(2).updateMask(i.neq(0)).float()
  })
  
  occurrence = occurrence.sum().divide(occurrence.count()).gt(0.6).float()
  
  var multiplier = t0.millis().subtract(start.millis()).divide(range)
    //.pow(3)
  
  return occurrence.multiply(multiplier)
})

images = ee.ImageCollection(images)

var total = images.max()

var palette = ["9e0142","d53e4f","f46d43","fdae61","fee08b","ffffbf","e6f598","abdda4","66c2a5","3288bd","5e4fa2"]
//var palette = ["f7fbff","deebf7","c6dbef","9ecae1","6baed6","4292c6","2171b5","08519c","08306b"]
Map.addLayer(total.updateMask(total), { min: 0, max: 1, palette: palette})