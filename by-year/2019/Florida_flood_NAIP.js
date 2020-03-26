/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var naip = ee.ImageCollection("USDA/NAIP/DOQQ");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
var animation = require('users/gena/packages:animation')

naip = naip.filterBounds(Map.getBounds(true))

naip = naip.map(function(i) {
  return i.set({ hasN: i.bandNames().contains('N') })
})
.filter(ee.Filter.eq('hasN', true))
.select(['N', 'R', 'G'])

var years = ee.List([2010, 2013, 2015, 2017])
var images = years.map(function(y) {
  var t0 = ee.Date.fromYMD(y, 1, 1)
  var t1 = t0.advance(1, 'year')
  
  return naip.filterDate(t0, t1).mosaic().set('system:time_start', t0.millis())
})


images = ee.ImageCollection(images).map(function(i) {
  return i.set({ label: i.date().format() })
}).sort('system:time_start')

animation.animate(images, { vis: {min: 0, max: 255}, label: 'label' })
