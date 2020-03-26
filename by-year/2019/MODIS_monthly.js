/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var images = ee.ImageCollection("MODIS/MOD09GA"),
    dem = ee.Image("NOAA/NGDC/ETOPO1");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
images = images.select(['sur_refl_b05', 'sur_refl_b02', 'sur_refl_b04'])

// generate monthly dates
var dates = ee.List.sequence(2003, 2014).map(function(y) {
  return ee.List.sequence(1,12).map(function(m) {
    return ee.Date.fromYMD(y, m, 1)
  })
}).flatten()

/*
// generate January 1st dates
var dates = ee.List.sequence(2003, 2014).map(function(y) {
  return ee.Date.fromYMD(y, 1, 1)
}).flatten()
*/

print(dates)

// generate monthly composites (5% percentiles)
var imagesMonthly = dates.map(function(d) {
  var from = ee.Date(d)
  var to = from.advance(1, 'month')

  return images.filterDate(from, to).reduce(ee.Reducer.percentile([5]))
})

// add 10 monthly images as layers
for(var i=0; i<10; i++) {
  var image = ee.Image(imagesMonthly.get(i))
  Map.addLayer(image, {min:500, max:5000}, ee.Date(dates.get(i)).format('YYYY-MM').getInfo(), i === 0)
}
