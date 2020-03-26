/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var roi = /* color: #d63000 */ee.Geometry.Polygon(
        [[[-150.2490234375, 66.51326044311185],
          [-149.94140625, 65.12763795652114],
          [-143.23974609375, 65.68543021881813],
          [-144.4921875, 66.88697184836789]]]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
roi = Map.getBounds(true)

var animation = require('users/gena/packages:animation')
var assets = require('users/gena/packages:assets')

// Set Start and End Dates
var startDate = ee.Date.fromYMD(2016,5,1);  
var endDate = ee.Date.fromYMD(2016,9,1)

// Filter Sentinel-2 Imagery to the Date & Time of Interest
var S2 = ee.ImageCollection('COPERNICUS/S2')
        .filterDate(startDate, endDate)
        .filterBounds(roi)
        //.filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 50))
        //.filter(ee.Filter.lt('MEAN_SOLAR_ZENITH_ANGLE', 60))
        
        .select(['B4','B3','B2','B5', 'B12'])
        .map(function(i) {
          return i.updateMask(i.mask().reduce(ee.Reducer.allNonZero()))
        })

//S2 = assets.mosaicByDate(S2)

// Visualize
var natColorTOA = {min: 500, max: [2000, 2000, 2500]};  //visualization parameters

// Make mosaics
// var composite = S2.median();
var composite = S2.reduce(ee.Reducer.percentile([15]))
Map.addLayer(composite, natColorTOA, 'S2 mosaic');

var qualityBand = 'B2'
var thresholds = ee.ImageCollection('COPERNICUS/S2')
  .filter(ee.Filter.dayOfYear(startDate.getRelative('day', 'year'), endDate.getRelative('day', 'year')))
  .filterBounds(roi)
  .select(qualityBand)

//thresholds = assets.mosaicByDate(thresholds)
  .map(function(i) {
    return i.updateMask(i.mask().reduce(ee.Reducer.allNonZero()))
  })
  .reduce(ee.Reducer.percentile([5, 30])).divide(10000)

// compute weighted average using green band as a weight, adjusted with double sigmoid
var composite = S2.map(function(i) { 
  var q = i.select(qualityBand).divide(10000)
  var k1 = ee.Image.constant(1000)
  var k2 = thresholds.select(1) // clouds
  var weight = ee.Image(1).divide(ee.Image(1).add(q.multiply(k1.multiply(-1)).add(k2.multiply(k1)).exp()))
  
  var k1 = ee.Image.constant(-1000)
  var k2 = thresholds.select(0) // cloud shadows
  var weight2 = ee.Image(1).divide(ee.Image(1).add(q.multiply(k1.multiply(-1)).add(k2.multiply(k1)).exp()))
  
  weight = weight2.max(weight)
  
  weight = ee.Image(1).subtract(weight)

  
  weight = weight.rename('weight')
  return i.multiply(weight).addBands(weight)
})
composite = composite.sum().divide(composite.select('weight').sum())

Map.addLayer(composite, natColorTOA, 'S2 mosaic (expected)');
// Map.centerObject(roi)

// show number of images
Map.addLayer(S2.count(), {min: 2, max: 10}, 'count', false)

// print number of images
print(S2.size())

// visualize all images
var images = S2.map(function(i) { 
  return i.visualize(natColorTOA).set({label: i.date().format()})
})

//animation.animate(images, {maxFrames: 100, label: 'label'})
