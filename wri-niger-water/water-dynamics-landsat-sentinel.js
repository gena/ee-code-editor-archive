/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var geometry = /* color: #d63000 */ee.Geometry.Point([-3.6787997961185965, 15.829976729692499]),
    geometryPlot = /* color: #98ff00 */ee.Geometry.LineString(
        [[-3.636737022352918, 15.559999300217475],
         [-2.6184417342669803, 15.79535081950305]]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
var palettes = require('users/gena/packages:palettes')
var charting = require('users/gena/packages:charting')
var assets = require('users/gena/packages:assets')

Map.addLayer(ee.Image(0), {}, 'black', true, 0.5)

var catchmentsUpperNiger = ee.FeatureCollection('users/gena/water-niger/wflow/catchments')
Map.addLayer(catchmentsUpperNiger, {}, 'catchments')

var level = 9
var catchments00 = ee.Image("users/rutgerhofste/PCRGlobWB20V04/support/global_Standard_lev00_30sGDALv01")
var catchments = catchments00.divide(ee.Number(10).pow(ee.Number(12).subtract(level))).floor().clipToCollection(catchmentsUpperNiger)
Map.addLayer(catchments.randomVisualizer(), {}, 'catchments', true, 0.5)


// water occurrence
var waterOccurrence = ee.Image("JRC/GSW1_0/GlobalSurfaceWater")
  .select('occurrence')
  .divide(100)
  .unmask(0)
  .resample('bilinear')

Map.addLayer(waterOccurrence.multiply(2).mask(waterOccurrence.multiply(2)), {min: 0, max: 1, palette: palettes.cb.YlOrRd[9].reverse().slice(1) }, 'water occurrence')


var geometrySampling = catchments.int().reduceToVectors({geometry: Map.getBounds(true), scale: 450}).filterBounds(geometry).geometry()
Map.addLayer(geometrySampling)

var start = ee.Date('2000-01-01')
var stop = ee.Date('2013-01-01')

var images = assets.getImages(geometrySampling, {
  missions: ['S2', 'L8', 'L7', 'L5', 'L4'],
  filter: ee.Filter.date(start, stop)
})

// images = assets.excludeMasked(images, geometrySampling, 30)

print(images.size())
//images = assets.getMostlyCleanImages(images, geometrySampling)
//print(images.size())

images = images.map(function(i) {
  var ndwi = i.normalizedDifference(['green', 'swir']).rename('ndwi')
  
  return i.addBands(ndwi)
})

var imagesS2 = images.filter(ee.Filter.eq('MISSION', 'S2'))
var imagesL8 = images.filter(ee.Filter.eq('MISSION', 'L8'))
var imagesL7 = images.filter(ee.Filter.eq('MISSION', 'L7'))
var imagesL5 = images.filter(ee.Filter.eq('MISSION', 'L5'))

var plot = new charting.Plot(geometryPlot.bounds())

plot.setName('Plot 1')

plot.setMinMax(start.millis(), stop.millis(), 0, 1)

// add colorbar CDF plot
var vis = { min: 0.05, max: 0.5, bands: ['swir', 'nir', 'green'] }
// var vis = { min: 0.0, max: 0.35, bands: ['ndwi'], palette: ['ffffff', '0000ff'] }

var N = 500 // number of samples
var w = 300 // column widths as a fraction of chart width
var p = 50 // percentile

plot.addColorbarSeries('colorbar (all)', images, geometrySampling, vis, 30, N, w, p)

images = assets.getMostlyCleanImages(images, geometrySampling, { percentile: 75 })
print(images.size())

plot.addColorbarSeries('colorbar (all, cloudfree)', images, geometrySampling, vis, 30, N, w, p)
 
// plot.addColorbarSeries('colorbar S2', imagesS2, geometrySampling, vis, 10, N, w)
// plot.addColorbarSeries('colorbar L8', imagesL8, geometrySampling, vis, 30, N, w)
// plot.addColorbarSeries('colorbar L7', imagesL7, geometrySampling, vis, 30, N, w)
// plot.addColorbarSeries('colorbar L5', imagesL5, geometrySampling, vis, 30, N, w)

plot.show()