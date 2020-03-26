/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var geometry = /* color: #d63000 */ee.Geometry.MultiPoint(),
    grid = ee.FeatureCollection("users/gena/global_grid"),
    geometry2 = /* color: #d63000 */ee.Geometry.Point([120.20786862887394, 14.650476085337646]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
// var geometry = geometry2;
var geometry = Map.getBounds(true)
    
grid = grid.filterBounds(geometry) 

var g = require('users/gena/packages:grid')
var cells = g.splitGridCells(grid, 2, 0, 0)
  .filterBounds(geometry)

Map.addLayer(cells, {}, 'bounds')

var gridCellId = ee.String(ee.Feature(grid.first()).get('id'))

print(gridCellId)

var gridCellName = gridCellId.cat('-0').getInfo()

//Map.setCenter(31.75885, -11.21445, 15)

var palettes = require('users/gena/packages:palettes')
var assets = require('users/gena/packages:assets')
var animation = require('users/gena/packages:animation')

Map.addLayer(ee.Image(1), {palette: ['000000']}, 'black', true, 0.5)

var waterOccurrence = ee.Image("JRC/GSW1_0/GlobalSurfaceWater")
  .select('occurrence')
  .resample('bilinear')

Map.addLayer(waterOccurrence, {min: 0, max: 100, palette: palettes.colorbrewer.PuBu[9]}, 'JRC', false)

addIsolines(waterOccurrence.unitScale(0, 100), 'JRC')

var min = -0.3
var max = 0.4
 
var bandNamesImages = ['swir', 'nir', 'red', 'green', 'blue']

function getCleanImages(region, start, stop, scale) {
  var images = assets.getImages(region, {
    resample: true,
    filter: ee.Filter.date(start, stop),
    //clipBufferSizeL7: 90, 
    //clipBufferSize: 12000,
    missions: [
      //'L4', 
      //'L5', 
      //'L7', 
      'L8', 
      'S2'
  ]
  })
  
  //print('Image count: ', images.size())

  images = assets.getMostlyCleanImages(images, region, {
     cloudFrequencyThresholdDelta: 0 //0.15
  })
  
  //print('Image count (clean): ', images.size())
  
  return images  
}

/***
 * Clip an image by displacing a mask (fast).
 */

function refineMask(i) {
  var mask = i.select(['green', 'red', 'nir', 'swir']).mask().reduce(ee.Reducer.allNonZero())
  
  i = i.updateMask(mask)
  
  return i
}

var bandNames = ['NDWI', 'NDVI', 'MNDWI']

function computeWaterOccurrence(reducer) {
  return function(images) {
    var indices = images.map(function(i) {
      //i = refineMask(i)
      
      var ndwi = i.normalizedDifference(['green', 'nir']).clamp(min, max)
      var mndwi = i.normalizedDifference(['green', 'swir']).clamp(min, max)
      var ndvi = i.normalizedDifference(['red', 'nir']).clamp(min, max)
      
      return ee.Image([ndwi, ndvi, mndwi]).rename(bandNames)
    })
    
    return indices.reduce(reducer)
  }
}

function computeWaterOccurrence2(images) {
  var indices = images.map(function(i) {
    //i = refineMask(i)
    
    var ndwi = i.normalizedDifference(['green', 'nir']).clamp(min, max)
    var mndwi = i.normalizedDifference(['green', 'swir']).clamp(min, max)
    var ndvi = i.normalizedDifference(['red', 'nir']).clamp(min, max)
    
    return ee.Image([ndwi, ndvi, mndwi]).rename(bandNames)
  })
  
  var percentiles = ee.List.sequence(15, 85, 5)
  
  var results = percentiles.map(function(p) {
    return indices.reduce(ee.Reducer.percentile([p])).rename(bandNames)
  })
  
  return ee.ImageCollection(results).mean()
}


var region = Map.getBounds(true)
var scale = Map.getScale()

// var region = cells.geometry()
// var scale = 20

// var start = '1985-01-01'
// var stop = '1990-01-01'

//var step = 1/4
var step = 0.1
var duration = 0.5

//region = geometry


/*var images = getCleanImages(region, '2016-01-01', '2019-01-01', scale)  
var index = computeWaterOccurrence(images)
Map.addLayer(index, { min: min, max: max }, 'index')
throw('stop')*/


//var startYear = 1984
var startYear = 2013
var stopYear = 2020
//var stopYear = 2018

function showWaterOccurrenceCDF() {
  startYear = 2015
  var start = ee.Date.fromYMD(startYear, 1, 1)
  var stop = start.advance(2, 'year')

  var images = getCleanImages(region, start, stop, scale)  
  
  var percentiles = ee.List.sequence(15, 85, 5)

  var results = percentiles.map(function(p) {
    return computeWaterOccurrence(ee.Reducer.percentile([p]))(images)
  })
  
  results = ee.ImageCollection(results).map(function(i) { 
    return i.rename(bandNames) 
  })
  
  Map.addLayer(results.mean(), { min: min, max: max }, 'CDF mean')
  
  results = results
    .map(function(i) { 
      return i.set({ label: ee.Number(i.get('percentile')).format('%d') })
    })

  animation.animate(results, { maxFrames: 50, vis: { min: min, max: max }, label: 'label' })

  throw(1)  
}

// showWaterOccurrenceCDF()

function computeWaterOccurrenceAll(p) {
  var imageCollections = ee.List.sequence(startYear, stopYear - duration, step).map(function(y) {
    var start = ee.Date.fromYMD(startYear, 1, 1).advance(ee.Number(y).subtract(startYear), 'year')
    var stop = start.advance(duration, 'year')
  
    var images = getCleanImages(region, start, stop, scale)  
    
    return images
      .set({
        timeStart: start,
        timeStop: stop
      })
  })
  
  var waterOccurrences = imageCollections.map(function(imageCollection) {
    imageCollection = ee.ImageCollection(imageCollection)
    var start = ee.Date(imageCollection.get('timeStart'))
    var stop = ee.Date(imageCollection.get('timeStop'))
    
    var index = computeWaterOccurrence(ee.Reducer.percentile([p]))(imageCollection)

    var size = imageCollection.size()
    
    return index//.unitScale(min, max)
      .clip(region)
      .set({ label: start.format('YYYY-MM').cat(' - ').cat(stop.format('YYYY-MM')).cat(size.format(', count: %d')) })
      .set({ size: size})
      .set({ 'system:time_start': start.millis() })
      .set({ 'system:time_end': stop.millis() })
  })

  waterOccurrences = ee.ImageCollection(waterOccurrences)
    .filter(ee.Filter.gt('size', 0))
  
  Map.addLayer(waterOccurrences, {}, 'p ' + p, false)
  
  function show(percentile) {
    var values = waterOccurrences.reduce(ee.Reducer.percentile([percentile]))
    
    var mask = values.reduce(ee.Reducer.max()).unitScale(min, max).multiply(4)
    
    return values// .mask(mask)
  }
  
  Map.addLayer(show(0), { min: min, max: max }, 'water occurrence (0%) ' + p, false)
  Map.addLayer(show(5), { min: min, max: max }, 'water occurrence (5%) ' + p, false)
  Map.addLayer(show(25), { min: min, max: max }, 'water occurrence (25%) ' + p, false)
  Map.addLayer(show(50), { min: min, max: max }, 'water occurrence (50%) ' + p, false)
  Map.addLayer(show(85), { min: min, max: max }, 'water occurrence (85%) ' + p, false)
  Map.addLayer(show(95), { min: min, max: max }, 'water occurrence (95%) ' + p, false)
  Map.addLayer(show(100), { min: min, max: max }, 'water occurrence (100%) ' + p, false)

  var m = waterOccurrences.mean()
  var mask = m.reduce(ee.Reducer.max()).unitScale(min, max).multiply(4)
  m = m.mask(mask)
  
  Map.addLayer(m, { min: min, max: max }, 'water occurrence (mean) ' + p, false)
  
  waterOccurrences = waterOccurrences.map(function(i) {
    var mask = i.reduce(ee.Reducer.max()).unitScale(min, max).multiply(4)
    return i.mask(mask)
  })
  
  // composite images
  var compositeImages = imageCollections.map(function(imageCollection) {
    imageCollection = ee.ImageCollection(imageCollection)
    var start = ee.Date(imageCollection.get('timeStart'))
    var stop = ee.Date(imageCollection.get('timeStop'))

    var size = imageCollection.size()
    
    var image = imageCollection.reduce(ee.Reducer.percentile([40])).rename(bandNamesImages)
    
    return image
      .clip(region)
      .set({ label: start.format('YYYY-MM').cat(' - ').cat(stop.format('YYYY-MM')).cat(size.format(', count: %d')).cat(' IMAGES') })
      .set({ size: size})
      .set({ 'system:time_start': start.millis() })
      .set({ 'system:time_end': stop.millis() })
  })

  compositeImages = ee.ImageCollection(compositeImages)
    .filter(ee.Filter.gt('size', 0))
  
  // animation.animate(compositeImages, { maxFrames: 50, position: 'bottom-center', vis: { min: 0.03, max: 0.35 }, label: 'label' })

  compositeImages.size().evaluate(function(count) {
    var compositeImagesList = compositeImages.toList(count)

    for(var i=0; i<count; i++) {
      var path = 'users/gena/manila-bay-atlas/composite-p40-' + i + '-' + gridCellName
      Export.image.toAsset({
        image: compositeImagesList.get(i), 
        description: 'image-' + i, 
        assetId: path, 
        region: region, 
        scale: 20
      })

      // var waterOccurrencesList = waterOccurrences.toList(count)
      // var path = 'users/gena/manila-bay-atlas/water-occurrence-' + i + '-' + gridCellName
      // Export.image.toAsset({
      //   image: waterOccurrencesList.get(i), 
      //   description: 'water-occurrence-' + i, 
      //   assetId: path, 
      //   region: region, 
      //   scale: 20
      // })
    }
    
  })

  return waterOccurrences
}

var p = computeWaterOccurrenceAll(50)
//var p = computeWaterOccurrenceAll(85)
//var p = computeWaterOccurrenceAll(95)
//var p = computeWaterOccurrenceAll(95)

// throw(2)

addIsolines(p.mean().select(0).unitScale(min, max), 'water occurrence')


function addIsolines(i, name) {
  var img = ee.Image().toByte();
  var addIso = function(image, level) {
    var crossing = image.subtract(level)
      .focal_median(3)
      .zeroCrossing();
    var exact = image.eq(level);
    
    return ee.Image(level).float().mask(crossing.or(exact))
  };
  
  var colors = ['f7fcf0','e0f3db','ccebc5','a8ddb5','7bccc4','4eb3d3','2b8cbe','0868ac','084081']
  
  var levels = ee.List.sequence(0, 1, 0.05);
  var isoImages = ee.ImageCollection(ee.List(levels).map(function(l) {
    return addIso(i, ee.Number(l))
  }))
  
  // var isoPolygons =   levels.map(function(l) {
  //   var features = i.gt(l).int().reduceToVectors({
  //     geometry: region, 
  //     scale: scale, 
  //     tileScale: 4
  //   })

  //   features = features.map(function(f) {
  //     return f.set({ value: l })
  //   })

  //   return features
  // })
  
  // Map.addLayer(isoPolygons.flatten(), {}, 'features')
  
  // print(isoPolygons.flatten())
  
  var isolinesLayer = ui.Map.Layer(isoImages.mosaic(), {min:0.95, max:0, palette: colors}, 'isolines ' + name, false, 0.3)
  
  Map.layers().add(isolinesLayer)
}

function animateWaterOccurrence() {
  animation.animate(p, { maxFrames: 100, vis: { min: min, max: max }, label: 'label' })
  // .then(function() {
  //     var table = ee.FeatureCollection("users/gena/eo-reservoirs/waterbodies-points-12-03-validation"),
  //         table2 = ee.FeatureCollection("users/gena/eo-reservoirs/waterbodies-12-03-validation"),
  //         table3 = ee.FeatureCollection("users/gena/HydroLAKES_polys_v10");
          
  //     Map.addLayer(table, {color:'red'})
  //     Map.addLayer(table2)
  //     Map.addLayer(table3.style({color:'cyan'}))    
  //   })
}

animateWaterOccurrence()

// throw('stop')

// first composite images
// animation.animate(ee.ImageCollection(p.first().get('images')), { maxFrames: 50, vis: { min: 0.05, max: 0.5 }, position: 'bottom-right', preload: false, label: 'label' })

// throw(0)

// JRC 
var jrcMonthly = ee.ImageCollection('JRC/GSW1_0/MonthlyHistory')

var p = ee.List.sequence(startYear, stopYear - duration, step).map(function(y) {
  var start = ee.Date.fromYMD(startYear, 1, 1).advance(ee.Number(y).subtract(startYear), 'year')
  var stop = start.advance(duration, 'year')

  var water = jrcMonthly.filterDate(start, stop).map(function(i) {
    return i.eq(2)
  })
  .sum()

  var waterNot = jrcMonthly.filterDate(start, stop).map(function(i) {
    return i.eq(1)
  })
  .sum()
  
  var waterOccurrence = water.divide(waterNot.add(water))

  return waterOccurrence.mask(waterOccurrence).visualize({min: 0, max: 1, palette: ['000000', '00ffff']})
    .set({ label: start.format('YYYY-MM').cat(' - ').cat(stop.format('YYYY-MM')) })
})

// JRC water occurrence
animation.animate(p, { maxFrames: 50, position: 'bottom-center', preload: false, label: 'label' })

throw('stop')

// false
var f = ee.List.sequence(startYear, stopYear - duration, step).map(function(y) {
  var start = ee.Date.fromYMD(startYear, 1, 1).advance(ee.Number(y).subtract(startYear), 'year')
  var stop = start.advance(duration, 'year')
  
  var images = getCleanImages(region, start, stop, scale)  

  var size = images.size()

  return images.select(['swir', 'nir', 'green']).mean()
    .set({ label: start.format('YYYY-MM').cat(' - ').cat(stop.format('YYYY-MM')).cat(size.format(', count: %d')) })
    .set({ size: size})
})

//animation.animate(f.filter(ee.Filter.gt('size', 0)), { maxFrames: 50, vis: { min: 0.05, max: 0.5 }, preload: false, position: 'bottom-center', label: 'label' })
 



