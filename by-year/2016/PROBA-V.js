/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var proba = ee.ImageCollection("VITO/PROBAV/S1_TOC_100M"),
    mod = ee.ImageCollection("MODIS/MOD09GQ"),
    myd = ee.ImageCollection("MODIS/MYD09GQ"),
    proba330 = ee.ImageCollection("VITO/PROBAV/S1_TOC_333M");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
function Proba() {
  Map.addLayer(proba.select(0).count(), {min:0, max:300, palette:['ff0000', '00ff00']}, 'count', false)
  Map.addLayer(proba, {}, 'all', false)
  Map.addLayer(ee.Image(proba.first()).select(0).geometry(), {}, 'first geom', false)
  Map.addLayer(ee.Image(proba.first()).select(['SWIR', 'NIR', 'RED']), {min:30, max:1000}, 'first', false)
  
  var bands = ['NIR', 'RED']
  var props = {min:-0.1, max:0.6}
/*  Map.addLayer(ee.Image(proba.first()).select(bands).select(bands).normalizedDifference(bands), props, 'first NDWI', false)
  Map.addLayer(ee.Image(proba.select(bands).reduce(ee.Reducer.percentile([5]))).rename(bands).normalizedDifference(bands), props, 'NDWI 5%', false)
  Map.addLayer(ee.Image(proba.select(bands).reduce(ee.Reducer.percentile([15]))).rename(bands).normalizedDifference(bands), props, 'NDWI 15%', false)
  Map.addLayer(ee.Image(proba.select(bands).reduce(ee.Reducer.percentile([35]))).rename(bands).normalizedDifference(bands), props, 'NDWI 35%', false)
  Map.addLayer(ee.Image(proba.select(bands).reduce(ee.Reducer.percentile([55]))).rename(bands).normalizedDifference(bands), props, 'NDWI 55%', false)

  Map.addLayer(proba330.select(0).count(), {min:0, max:300, palette:['ff0000', '00ff00']}, 'count 330', false)
  Map.addLayer(proba330, {}, 'all', false)
  Map.addLayer(ee.Image(proba330.first()).select(0).geometry(), {}, 'first geom', false)
  Map.addLayer(ee.Image(proba330.first()).select(['SWIR', 'NIR', 'RED']), {min:30, max:1000}, 'first', false)
  
  var bands = ['NIR', 'RED']
  var props = {min:-0.1, max:0.6}
  Map.addLayer(ee.Image(proba330.first()).select(bands).select(bands).normalizedDifference(bands), props, 'first NDWI', false)
  Map.addLayer(ee.Image(proba330.select(bands).reduce(ee.Reducer.percentile([5]))).rename(bands).normalizedDifference(bands), props, 'NDWI 5%', false)
  Map.addLayer(ee.Image(proba330.select(bands).reduce(ee.Reducer.percentile([15]))).rename(bands).normalizedDifference(bands), props, 'NDWI 15%', false)
  Map.addLayer(ee.Image(proba330.select(bands).reduce(ee.Reducer.percentile([35]))).rename(bands).normalizedDifference(bands), props, 'NDWI 35%', false)
  Map.addLayer(ee.Image(proba330.select(bands).reduce(ee.Reducer.percentile([55]))).rename(bands).normalizedDifference(bands), props, 'NDWI 55%', false)
*/
  proba = ee.ImageCollection(proba.merge(proba330)).sort('system:time_start')
  
  print(proba.first())
  
  var videoFrames = proba
    .map(function(i) {
      var any = i.select(0).reduceRegion(ee.Reducer.anyNonZero(), ee.Geometry(Map.getBounds(true)).centroid(1)).values().get(0)
      
      return i.select(['SWIR', 'NIR', 'RED']).visualize({min:30, max:1000})
        .set('any', any)
    }).filter(ee.Filter.eq('any', 1))
    
  var count = 20
  var list = videoFrames.toList(count, 0)
  
  ee.List.sequence(0, count-1).getInfo().map(function(i) {
    Map.addLayer(ee.Image(list.get(i)), {}, i.toString(), i === 0)
  })
    
  Export.video.toDrive({ 
    collection: videoFrames,
    description: 'proba-test', 
    fileNamePrefix: 'proba-test', 
    framesPerSecond: '12', 
    region: Map.getBounds(true), 
    scale: 50
  })
}

// ============= MODIS
  print(mod.first())

function Modis() {
  var bounds = Map.getBounds(true)
  var modis = ee.ImageCollection(mod.merge(myd))
    .filterDate('2015-01-01', '2016-01-01')
    .select(['sur_refl_b01','sur_refl_b02'])
    .sort('system:time_start')
    .map(function(i) {
      var any = ee.Image(i).reduceRegion(ee.Reducer.anyNonZero(), bounds).values().get(0)
      return i
        .visualize({min:800, max:8000, bands:['sur_refl_b01', 'sur_refl_b02', 'sur_refl_b01']})
        .set('has_values', any)
        .set('system:time_start', i.get('system:time_start'))
    })

  Export.video.toDrive({ 
    collection: modis,
    description: 'modis-test', 
    fileNamePrefix: 'modis-test', 
    framesPerSecond: '12', 
    region: Map.getBounds(true), 
    scale: 100
  })
  
  var count = 5
  var list = modis
    .filter(ee.Filter.eq('has_values', 1))
    .toList(count, 0)

  ee.List.sequence(0, count-1).getInfo().map(function(i) {
    var image = ee.Image(list.get(i))
    var name = ee.Date(image.get('system:time_start')).format('YYYY-MM-dd').getInfo()
    Map.addLayer(image, {}, name, i === 0)
  })

  
}


Proba()
//Modis()