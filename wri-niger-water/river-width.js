/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var crossSection = /* color: #98ff00 */ee.Geometry.LineString(
        [[-8.034204644560305, 12.63552086182635],
         [-8.002275628447023, 12.587275171812818]]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
var hydro = require('users/gena/packages:hydro')

/*
TODO:
- sort images in animation to date
- make some animations
- SLICK (segmentation algorithm). USe super pixels to classify per segment to which class it belongs
- 
- test a cloud / cloud shadow filter on one image (FMASK / Gena's script for shadow)
- 
*/ 


var assets = require('users/gena/packages:assets')
var animation = require('users/gena/packages:animation')
var palettes = require('users/gena/packages:colorbrewer').Palettes

var start = '2000-01-01'
var stop = '2019-01-01'

var images = assets.getImages(crossSection, { 
  resample: true,
  missions: [
    'L5', 
    'L4', 
    'L8', 
    'S2', 
    'L7'
  ],
  filter: ee.Filter.date(start, stop)
})

print('Count: ', images.size())

var bounds = Map.getBounds(true)

images = assets.getMostlyCleanImages(images, crossSection.buffer(300), {
  cloudFrequencyThresholdDelta: 0 // -0.15
})

print('Count (clean): ', images.size())

var thresholding = require('users/gena/packages:thresholding')

var scale = 10

function showWidth(images, bands, useDynamicThresholding) {
  var images = images.map(function(i) { 
    var ndwi = i.normalizedDifference(bands).rename('ndwi')

    var water = ndwi.gt(0)

    if(useDynamicThresholding) {
      var th = thresholding.computeThresholdUsingOtsu(ndwi, scale * 3, crossSection.buffer(300), 0.5, 0.7, -0.2)
      var water = ndwi.gt(th)
    }    

    var width = water.reduceRegion(ee.Reducer.sum(), crossSection, scale).values().get(0)

    
    return i
      .addBands(ndwi)
      .set({width: width})
  })
  
  print(ui.Chart.feature.byFeature(images, 'system:time_start', ['width']).setChartType('ScatterChart').setOptions({
    pointSize: 1,
    vAxis: { viewWindow: { min: 0, max: 200 } }
  }))
  
  return images
}

images = showWidth(images, ['green', 'swir'])
//images = showWidth(images, ['green', 'nir'])

showWidth(images, ['green', 'swir'], true)
//showWidth(images, ['green', 'nir'], true)

//showWidth(images, ['green', 'swir'], true)

/*var proba100 = ee.ImageCollection('VITO/PROBAV/C1/S1_TOC_100M')
  .filterDate('2013-01-01', '2019-01-01')
  .map(function(i) { return i.resample('bicubic') })
showWidth(proba100, ['RED', 'SWIR'])

Map.addLayer(ee.Image(proba100.first()).normalizedDifference(['RED', 'SWIR']))

*/

var start = '2015-01-01'
var stop = '2018-01-01'

images = images
  .filterDate(start, stop)
  .sort('system:time_start')
  .map(function(i) {
    var image = i.visualize({bands: ['swir', 'nir', 'green'], min: 0.0, max: 0.5})
    
    return image
       .set({label: i.date().format('YYYY-MM-dd').cat(', width: ').cat(ee.Number(i.get('width')).format('%.2f'))})
    
    // var water = ee.Image(1).float().mask(i.select('ndwi')).visualize({min: -0.05, max: 0.5, palette: palettes.Blues[9]})
    // var rgb = ee.ImageCollection.fromImages([
    //   image,
    //   water
    // ]).mosaic()
    
    // return rgb
    //   .set({label: i.date().format().cat(', width: ').cat(ee.Number(i.get('width')).format('%.2f'))})
  })

animation.animate(images, {label: 'label', maxFrames: 100})
  .then(function() {
    Map.addLayer(ee.Image(1), {palette: ['black']}, 'black', true, 0.5)
    hydro.Map.addWaterOccurrenceMax({ percentile: 100 })
  })

