/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var table = ee.FeatureCollection("users/gena/eo-dams/tailing_dams_brazil");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
print(table.aggregate_array('name'))
Map.addLayer(table, { color: 'red' }, 'dams' )

Map.setOptions('HYBRID')
// Map.centerObject(ee.Feature(table.toList(1, 1).get(0)), 15)


var assets = require('users/gena/packages:assets')
var animation = require('users/gena/packages:animation')

var scale = Map.getScale()
var bounds = Map.getCenter().buffer(scale * 200, scale * 5)
Map.addLayer(bounds)


var images = assets.getImages(bounds, { 
    missions: ['S2'],
    // resample: true,
    filterMasked: true,
    scale: scale
  })
    
images = assets.getMostlyCleanImages(images, bounds)

images = images.map(function(i) {
  return i.set({ label: i.date().format('YYYY-MM-dd') })
})

images = images.sort('system:time_start')

print(images.size())  

animation.animate(images, { label: 'label', vis: { min: 0, max: 0.35 }, maxFrames: 150 })


// var years = ee.List.sequence(1985, 2019, 1)

// var images = years.map(function(y) {
//   var start = ee.Date.fromYMD(y, 1, 1)
//   var stop = start.advance(1, 'year')
//   var images = assets.getImages(bounds, { 
//     missions: ['L4', 'L5', 'L7', 'L8', 'S2'], 
//     filter: ee.Filter.date(start, stop),
//     resample: true
//   })
    
//   images = assets.getMostlyCleanImages(images, bounds)
  
//   // images = images.map(assets.pansharpen)
  
//   return images.reduce(ee.Reducer.percentile([25]))
//     .set({label: start.format('YYYY').cat(', ').cat(images.size().format('%d'))})
// })

// images = ee.ImageCollection(images)

// animation.animate(images, { label: 'label', vis: { min: 0, max: 0.35 }, maxFrames: 50 })

