/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var table = ee.FeatureCollection("users/gena/eo-dams/tailing_dams_brazil");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
Map.addLayer(table, { color: 'red' }, 'dams' )

Map.setOptions('HYBRID')
// Map.centerObject(ee.Feature(table.toList(1, 1).get(0)), 15)

var assets = require('users/gena/packages:assets')
var animation = require('users/gena/packages:animation')

var bounds = Map.getBounds(true)

var years = ee.List.sequence(1985, 2019, 1)

var images = years.map(function(y) {
  var start = ee.Date.fromYMD(y, 1, 1)
  var stop = start.advance(1, 'year')
  var images = assets.getImages(bounds, { 
    missions: ['L4', 'L5', 'L7', 'L8', 'S2'], 
    filter: ee.Filter.date(start, stop),
    resample: true
  })
    
  images = assets.getMostlyCleanImages(images, bounds)
  
  return images.reduce(ee.Reducer.percentile([25]))
    .set({label: start.format('YYYY').cat(', ').cat(images.size().format('%d'))})
})

images = ee.ImageCollection(images)

animation.animate(images, { label: 'label', vis: { min: 0, max: 0.35 }, maxFrames: 50 })

