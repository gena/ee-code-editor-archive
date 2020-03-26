var assets = require('users/gena/packages:assets')
var animation = require('users/gena/packages:animation')

var bounds = Map.getBounds(true)

var images = assets.getImages(bounds, { resample: true })

print('images found: ', images.size())

images = assets.getMostlyCleanImages(images, bounds)

print('cleaner images found: ', images.size())

images = images.map(function(i) {
  var ndwi = i.normalizedDifference(['green', 'nir']).rename('ndwi')
  return i.addBands(ndwi)
})

images = ee.ImageCollection(images.sort('system:time_start').distinct('system:time_start'))

// animation.animate(images)



// code snippet derived from https://emaprlab.users.earthengine.app/view/lt-gee-time-series-animator app by Justin Braaten

// NOTE: non-working code

var bnames = ['ndwi', 'swir', 'nir', 'green']
var bnamesVis = ['swir', 'nir', 'green']

var ltParams = { 
    maxSegments:            10,
    spikeThreshold:         0.9,
    vertexCountOvershoot:   3,
    preventOneYearRecovery: true,
    recoveryThreshold:      0.75,
    pvalThreshold:          0.05,
    bestModelProportion:    0.75,
    minObservationsNeeded:  6,
    timeSeries: images.select(bnames)
  };
  
var lt = ee.Algorithms.TemporalSegmentation.LandTrendr(ltParams);

Map.addLayer(lt, {}, 'lt', false)

var years = ee.List.sequence(2016, 2019)

var dates = images.toList(images.size()).map(function(i) {
  return ee.Image(i).date().format()tv
})

// print(dates)

// var r = lt.select([bnamesVis[0]+'_fit']).arrayFlatten([dates]);
// var g = lt.select([bnamesVis[1]+'_fit']).arrayFlatten([dates]);
// var b = lt.select([bnamesVis[2]+'_fit']).arrayFlatten([dates]);

// var rgbList = yearsStr.map(function(year){
//   return r.select([year]).addBands(g.select([year])).addBands(b.select([year])).rename(bnamesVis);
// });

// var rgbColLT = ee.ImageCollection(rgbList.flatten()).map(function(img){
//   return img.visualize({ min: 0.05, max: 0.5})
// });


// Map.addLayer(rgbColLT.first())

