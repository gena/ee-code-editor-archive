/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var table = ee.FeatureCollection("users/gena/eo-dams/tailing_dams_brazil");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
var tiler = require('users/gena/packages:tiler')

var tiles = tiler.getTilesForGeometry(ee.Geometry(Map.getCenter()).buffer(Map.getScale() * 100), 13)
Map.addLayer(tiles)

print(table.aggregate_array('name'))
Map.addLayer(table, { color: 'red' }, 'dams' )

Map.setOptions('HYBRID')
// Map.centerObject(ee.Feature(table.toList(1, 1).get(0)), 15)


var assets = require('users/gena/packages:assets')
var animation = require('users/gena/packages:animation')

var bounds = Map.getBounds(true)

var years = ee.List.sequence(1985, 2019, 1)

years.evaluate(function(years) {
  var images = years.map(function(y) {
    var start = ee.Date.fromYMD(y, 1, 1)
    var stop = start.advance(1, 'year')
    var images = assets.getImages(bounds, { 
      missions: ['L4', 'L5', 'L7', 'L8', 'S2'], 
      filter: ee.Filter.date(start, stop),
      resample: true
    })
      
    images = assets.getMostlyCleanImages(images, bounds)
    
    // images = images.map(assets.pansharpen)
    
    var image = images.reduce(ee.Reducer.percentile([25]))
      .set({label: start.format('YYYY').cat(', ').cat(images.size().format('%d'))})
      
    start.format('YYYY').evaluate(function(start) {
      var name = 'dams-brazil-1-' + start
      
      Export.map.toCloudStorage({
         image: image.visualize({min: 0, max: 0.35}), 
         description: name, 
         bucket: 'deltares-video-map', 
         fileFormat: 'png', 
         path: 'dams-brazil/' + name, 
         writePublicTiles: true, 
         minZoom: 13, 
         maxZoom: 14, // ~10m
         region: tiles.geometry().bounds(1),
         skipEmptyTiles: true
      })
    })

    return image
  })
  
  images = ee.ImageCollection(images)
  
  animation.animate(images, { 
    preload: false, 
    label: 'label', 
    vis: { min: 0, max: 0.35 }, 
    maxFrames: 50 
  })
})

