/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var crossSections = ee.FeatureCollection("users/gena/water-niger/river_cross_sections"),
    riverSegments = ee.FeatureCollection("users/gena/water-niger/river_segments"),
    catchments = ee.FeatureCollection("users/gena/water-niger/wflow/catchments"),
    bounds = /* color: #98ff00 */ee.Geometry.Polygon(
        [[[-4.2143848714241585, 12.950972586781644],
          [-3.0884084740288245, 14.685709581839166],
          [-2.0177857398527976, 15.060310057821269],
          [-1.9328825705206327, 15.673108540202147],
          [-2.335088385899212, 15.863747326229497],
          [-2.4382527141510764, 16.53531142062331],
          [-1.5812850123579665, 16.845299669674066],
          [-1.5992349193300015, 17.09660086822934],
          [-3.659658544130366, 17.03552923118011],
          [-4.84643435653129, 16.649337774227185],
          [-5.256846628543599, 15.90468816097854],
          [-5.816796873123735, 15.901983555439672],
          [-6.3103713487842015, 15.728918997675057],
          [-6.433416387343982, 15.480682246085602],
          [-6.259896207420297, 15.190089473324969],
          [-6.936694704280853, 14.753491539631995],
          [-6.748712544741011, 13.959565236121719],
          [-8.025589516134687, 13.514395099321261],
          [-8.93182526487044, 12.448636338567338],
          [-8.737290020756745, 11.993536798694873],
          [-9.533349755163272, 11.612830069659369],
          [-10.166185466236357, 12.002112307796354],
          [-10.615943326976094, 11.85850677958666],
          [-11.38353337823969, 11.333526798777294],
          [-11.676126736410993, 10.441248444171688],
          [-10.794593851511422, 9.013066423540096],
          [-9.5225846177633, 8.9310852550235],
          [-9.279487347457575, 8.586689257014939],
          [-8.766972060387388, 8.436420965134536],
          [-7.792551631885772, 8.827888288368786],
          [-7.17869260622831, 9.567960758540751],
          [-7.0898892419020285, 9.318461562967594],
          [-6.496130360395227, 9.144521584387455],
          [-5.216075035961694, 10.31044296609454],
          [-5.2284569385396935, 11.139983505238686],
          [-4.46535586741129, 11.688051334596867],
          [-4.2143848714241585, 12.950972586781644]]]),
    geometry = /* color: #d63000 */ee.Geometry.Point([-3.389120882856332, 16.252350420528348]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
var assets = require('users/gena/packages:assets')
var animation = require('users/gena/packages:animation')
var palettes = require('users/gena/packages:palettes')

Map.setOptions('HYBRID')

var scale = 10

function addSupplementaryLayers() {
  // catchments
  Map.addLayer(catchments, {}, 'catchments (features)', false)
  Map.addLayer(ee.Image().int().paint(catchments, 1), { palette: ['black'] }, 'catchments (black)', true, 0.75)
  Map.addLayer(ee.Image().int().paint(catchments, 'HYBAS_ID').randomVisualizer(), {}, 'catchments', false, 0.5)
  
  // water occurrence
  var waterOccurrence = ee.Image("JRC/GSW1_0/GlobalSurfaceWater")
    .select('occurrence')
    .divide(100)
    .unmask(0)
    .resample('bilinear')
  
  Map.addLayer(waterOccurrence.multiply(2).mask(waterOccurrence.multiply(2)), {min: 0, max: 1, palette: palettes.cb.YlOrRd[9].reverse().slice(1) }, 'water occurrence')
  
  // rivers
  var rivers = ee.FeatureCollection('users/gena/HydroEngine/riv_15s_lev05')
    .filterBounds(bounds)
  
  // smoothen
  rivers = rivers.map(function(f) {
    return f.simplify(650)
  })
  
  Map.addLayer(rivers.style({ width: 1, color: 'cyan' }), {}, 'rivers', false)
  
  var riversFA = ee.Image().int().paint(rivers, 'UP_CELLS')
  Map.addLayer(riversFA.updateMask(riversFA.divide(2000)), { min: 10, max: 10000, palette: ['ffffff'] }, 'rivers (flow accumulation)')  
  
  Map.addLayer(crossSections.style({ width: 1, color: 'cyan' }), {}, 'cross-sections', false)
  
  var crossSectionWithWidth = crossSections.filter(ee.Filter.gt('width', 0))
  var crossSectionWithWidthImage = ee.Image().float().paint(crossSectionWithWidth, 'width')
  Map.addLayer(crossSectionWithWidthImage, { min: 0, max: 500, palette: palettes.cb.YlOrRd[9].reverse().slice(1) }, 'cross-section width')

  var stationsGRDC = ee.FeatureCollection('ft:1sLCtbxs9GWGMWq8JAJL1ivn8lQ5pVuZRdHgRdiSS')
  Map.addLayer(stationsGRDC, { color: 'blue' }, 'stations (GRDC)')
}

/***
 * Returns combined image collection for a given area
 */
function getImages(bounds) {
  var start = '2000-01-01'
  var stop = '2019-01-01'
  
  //var bounds = catchments.geometry().dissolve(10000).buffer(10000).simplify(50000)
  //print(bounds)
  //Map.addLayer(bounds)
  
  var images = assets.getImages(bounds, { 
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

  return images  
}

/***
 * For every cross-section that overlaps with a given catchment, generate cross-section widths
 */
function generateWidthForCatchment(c, index, crossSections) {
  var bounds = c.geometry()
  
  crossSections = crossSections.filterBounds(bounds)

  crossSections.size().evaluate(function(size) {
    print(index)
    
    if(!size) {
      print('<no cross-sections detected>')
      return
    }
    
    var images = getImages(bounds)  
    
    print('Number of images covering catchment: ', images.size())
    
    // for every cross-section, estimate widths
    
    var fn = etimateWidthForImages(images)
    
    var results = crossSections.map(fn)
    
    var id = c.get('HYBAS_ID')
    
    id.evaluate(function(id) {
      Export.table.toDrive({
        collection: results, 
        description: 'widths-' + id, 
        folder: 'water-Niger-river-widths', 
        fileNamePrefix: 'widths-' + id, 
        fileFormat: 'GeoJSON'
      })
    })
  })  
}  


var crs = ee.Projection('EPSG:3857').atScale(scale)

/***
 * Given images and cross-section, estimate widths
 */
function getWidthTimeSeries(images, crossSection) {
  var geom = crossSection.geometry()

  var imagesClean = images.filterBounds(geom)
  
  imagesClean = assets.getMostlyCleanImages(imagesClean, geom.buffer(300), {
    cloudFrequencyThresholdDelta: 0 // -0.15
  }).sort('system:time_start')
  
  var length = crossSection.length()

  var timeSeries = imagesClean.map(function(i) { 
    var ndwi = i.normalizedDifference(['green', 'swir']).rename('mndwi')

    // ... a bit strange way to compute widths, double-check this
    var all = ee.Image.constant(1).float().reduceRegion(ee.Reducer.sum(), geom, scale, crs).values().get(0)

    var mask = i.select('green').mask().rename('mask')
    var maskedValid = ee.Number(mask.reduceRegion(ee.Reducer.sum(), geom, scale, crs).values().get(0))
    var masked = maskedValid.divide(all)
    
    var water = ndwi.gt(0)
    var widthValue = ee.Number(water.reduceRegion(ee.Reducer.sum(), geom, scale, crs).values().get(0))
    var width = widthValue.divide(all).multiply(length)

    return i.set({
      width: width,
      masked: masked
    })
  })
  
  animation.animate(timeSeries.filterDate('2018-04-01', '2018-10-01'), { maxFrames: 50 })
  // print(ui.Chart.feature.byFeature(timeSeries, 'system:time_start', ['masked', 'quality_score']))
  

  return timeSeries  
}

/***
 * Estimates cross-section widths given image collection (higher-order function).
 */
function etimateWidthForImages(images) {
  return function(crossSection) {
    var timeSeries = getWidthTimeSeries(images, crossSection)    
    
    var widths = timeSeries.aggregate_array('width')
    var widths_masked = timeSeries.aggregate_array('masked')
    var times = timeSeries.aggregate_array('system:time_start')
    var quality = timeSeries.aggregate_array('quality_score')
    var mission = timeSeries.aggregate_array('MISSION')
    
    return crossSection.set({ 
      times: times,
      widths: widths,
      widths_masked: widths_masked,
      quality: quality,
      mission: mission
    })
  }
}

/***
 * Test, generate cross-section widths for a single cross-section
 */
function testSingleCrossSection() {
  var f = ee.Feature(crossSections.filterBounds(geometry.buffer(200)).first())

  var images = getImages(f.geometry())

  print('Number of images covering cross-section: ', images.size())

  f = etimateWidthForImages(images)(f)
  
  print(f)
  
  var t = ee.List(f.get('times'))
  var w = ee.List(f.get('widths'))

  var chartFeatures = t.zip(w).map(function(o) {
    o = ee.List(o)
    
    return ee.Feature(null, {
      'system:time_start': o.get(0),
      width: o.get(1)
    })
  })
  
  chartFeatures = ee.FeatureCollection(chartFeatures).sort('system:time_start')

  print(ui.Chart.feature.byFeature(chartFeatures, 'system:time_start', 'width').setOptions({
    lineWidth: 0,
    pointSize: 1
  }))
}

testSingleCrossSection()

/***
 * Test, generate cross-section widths for all cross-sections of a single catchment
 */
function testSingleCatchment() {
  var catchment = ee.Feature(catchments.filter(ee.Filter.eq('HYBAS_ID', 1060779970)).first())
  Map.centerObject(catchment)
  Map.addLayer(catchment, { color: 'yellow' }, 'current catchment')
  
  var crossSectionWithWidth = crossSections.filter(ee.Filter.gt('width', 0))
  generateWidthForCatchment(catchment, 0, crossSectionWithWidth)
}

// testSingleCatchment()


// ===================================== RUN

addSupplementaryLayers();

/***
 * Exports cross-sections for all catchments
 */
function exportAll() {
  // use only cross-sections where estimated widths is non-zero accouding to JRC
  var crossSectionWithWidth = crossSections.filter(ee.Filter.gt('width', 0))
  print('Number of non-empty cross-sections: ', crossSectionWithWidth.size())
  
  // for every catchment, estimate width time series for all overlapping cross-sections
  print('Number of catchments: ', catchments.size())
  
  var count = 65
  var catchmentsList = catchments.toList(count)
  
  for(var i=0; i<count; i++) {
    var catchment = ee.Feature(catchmentsList.get(i))
    generateWidthForCatchment(catchment, i, crossSectionWithWidth)
  }
}

// exportAll()


