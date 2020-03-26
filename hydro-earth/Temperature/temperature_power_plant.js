/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var jrc = ee.Image("JRC/GSW1_0/GlobalSurfaceWater"),
    pt = /* color: #d63000 */ee.Geometry.Point([-87.1164670324219, 34.712848657496195]),
    bounds = /* color: #98ff00 */ee.Geometry.LineString(
        [[-87.20809936523438, 34.67444096363744],
         [-87.04399108886719, 34.73738060944725]]),
    ptTmin = /* color: #0b4a8b */ee.Geometry.Point([-87.20088958740234, 34.71791112677534]),
    ptTmax = /* color: #ffc82d */ee.Geometry.Point([-87.20088958740234, 34.711420280232005]),
    ptDate = /* color: #00ffff */ee.Geometry.Point([-87.20088958740234, 34.70379994079758]),
    aster = ee.ImageCollection("ASTER/AST_L1T_003"),
    geometry = /* color: #bf04c2 */ee.FeatureCollection(
        [ee.Feature(
            ee.Geometry.Point([-87.14020729064941, 34.71579460235715]),
            {
              "system:index": "0"
            }),
        ee.Feature(
            ee.Geometry.Point([-87.13746070861816, 34.71120861361568]),
            {
              "system:index": "1"
            }),
        ee.Feature(
            ee.Geometry.Point([-87.13428497314453, 34.70577565175994]),
            {
              "system:index": "2"
            }),
        ee.Feature(
            ee.Geometry.Point([-87.12956428527832, 34.70076572138278]),
            {
              "system:index": "3"
            }),
        ee.Feature(
            ee.Geometry.Point([-87.12347030639648, 34.6951203659321]),
            {
              "system:index": "4"
            }),
        ee.Feature(
            ee.Geometry.Point([-87.11488723754883, 34.69010979040657]),
            {
              "system:index": "5"
            })]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
var white = ee.Image(1).visualize({palette:['ffffff']})

var aoi = bounds.bounds()

var imageGallery = require('users/gena/packages:gallery');
var text = require('users/gena/packages:text')
var utils = require('users/gena/packages:utils')


var Aster = {
  temperature: {
    fromDN: function(image) {
      var bands = ['temp', 'temp2', 'temp3', 'temp4', 'temp5']
      var multiplier = ee.Image([0.006822, 0.006780, 0.006590, 0.005693, 0.005225])
      var k1 = ee.Image([3040.136402, 2482.375199, 1935.060183, 866.468575, 641.326517])
      var k2 = ee.Image([1735.337945, 1666.398761, 1585.420044, 1350.069147, 1271.221673])
  
      var radiance = image.select(bands).subtract(1).multiply(multiplier)
      var t = k2.divide(k1.divide(radiance).add(1).log())
      
      return t.rename(bands)
    }
  },

  cloudScore: function (img, opt_skipBlue) {
    // Compute several indicators of cloudyness and take the minimum of them.
    var score = ee.Image(1.0);

    // TODO: compute DN > reflectance and add other bands

    // Clouds are reasonably bright in all visible bands.
    score = score.min(utils.rescale(img, '(img.red + img.green)/2', [0.5, 1.0])).aside(show, 'score vis');

    // Clouds are reasonably bright in all infrared bands.
    //score = score.min(rescale(img, 'img.nir', [0.7, 1.0])).aside(show, 'score ir')

    // Clouds are reasonably cool in temperature.
    //score = score.min(utils.rescale(t, 'img.temp2', [300, 273.15])).aside(show, 'score temp')
    score = score.min(utils.rescale(img, 'img.temp2', [293, 268])).aside(show, 'score temp');

    // However, clouds are not snow.
    //let ndsi = img.normalizedDifference(['red', 'swir']);
    //score = score.min(rescale(ndsi, 'img', [0.8, 0.6])).aside(show, 'score ndsi')

    return score.rename('cloud_score')
  }
}

function show(image, name) {
  // ...
}

function computeCloudScore(img) {
    // Compute several indicators of cloudyness and take the minimum of them.
    var score = ee.Image(1.0);

    // Clouds are reasonably bright in the blue band.
    score = score.min(utils.rescale(img, 'img.blue', [0.15, 0.8]).aside(show, 'blue')).aside(show, 'score blue');

    // Clouds are reasonably bright in all visible bands.
    score = score.min(utils.rescale(img, 'img.red + img.green + img.blue', [0.4, 0.8]).aside(show, 'vis')).aside(show, 'score vis');

    // Clouds are reasonably bright in all infrared bands.
    score = score.min(utils.rescale(img, 'img.nir + img.swir + img.swir2', [0.2, 0.8]).aside(show, 'ir')).aside(show, 'score ir');

    // Clouds are reasonably cool in temperature.
    // score = score.min(utils.rescale(img, 'img.temp', [293, 268])).aside(show, 'score temp')

    // NDWI
    // var ndwi = img.normalizedDifference(['green', 'nir']).rename('ndwi').aside(show, 'ndwi')
    // score = score.where(ndwi.gt(0.1), 0).aside(show, 'score ndwi')

    // NDVI
    //var ndvi = img.normalizedDifference(['nir', 'red']).rename('ndvi').aside(show, 'ndvi')
    // score = score.where(ndvi.gt(0.2), 0).aside(show, 'score ndvi')

    // Clouds have high value in cirrus band
    var cirrus = utils.rescale(img, 'img.cirrus', [0.03, 0.1]).aside(show, 'cirrus')
    score = score.max(cirrus).aside(show, 'score cirrus')
    

    // check if current value differs a lot from an average value
    // score = average.subtract(img).abs().select('blue')

    // However, clouds are not snow.
    //var ndsi = img.normalizedDifference(['red', 'swir']);
    //score = score.min(utils.rescale(ndsi, 'img', [0.2, 0.0])).aside(show, 'score ndsi')

    //var ndsi = img.normalizedDifference(['green', 'swir']);
    //return score.min(utils.rescale(ndsi, 'img', [0.8, 0.6]));

    return score.rename('cloud_score');
};


var images = ee.ImageCollection('LANDSAT/LC8_L1T_TOA')
  .filterBounds(aoi)
  
// var images = ee.ImageCollection('LANDSAT/LT05/C01/T1_TOA')
//   .filterBounds(aoi)

  
print('count: ', images.size())
  
var water = jrc.select('occurrence')/*.resample('bicubic')*/.divide(100)

water = water.updateMask(water.gt(0).focal_mode(2))//.focal_max(2))
Map.addLayer(water, {palette:['0000aa']}, 'water', false)
  
var palette = ['0000ff', 'ffff00', 'ff0000']
var tmin = 292
var tmax = 296


function analyzeExampleImage() {
  //var image = ee.Image(images.toList(1, 1).get(0))//.resample('bicubic')
  var image = ee.Image(images.filterDate('2016-05-25', '2016-05-30').first())
  print(image)
  
  Map.addLayer(image, {bands: ['B6','B5','B3'], min:0.03, max:0.4}, 'image (SNG)', false)
  Map.addLayer(image, {bands: ['B4','B3','B2'], min:0.03, max:0.25}, 'image (RGB)', false)
    
  var temperature = image.select('B10') // temperature
    
  //Map.addLayer(temperature.mask(temperature.lt(292)), {min:288, max:292, palette:['0000ff', 'ffff00', 'ff0000']}, 'temperature 15%')
  Map.addLayer(temperature, {min:tmin, max:tmax, palette:palette}, 'temperature 15% (all)', false)
  
  temperature = temperature.updateMask(water)
  Map.addLayer(temperature, {min:tmin, max:tmax, palette:['0000ff', 'ffff00', 'ff0000']}, 'temperature 15%')
  
  var img = ee.Image().toByte();
  var addIso = function(image, level) {
    var crossing = image.subtract(level).focal_median(5).zeroCrossing();
    var exact = image.eq(level);
    
    return ee.Image(level).float().mask(crossing.or(exact))
  };
  
  var levels = ee.List.sequence(tmin, tmax, 0.5);
  
  var isoImages = ee.ImageCollection(ee.List(levels).map(function(l) {
    return addIso(temperature, ee.Number(l))
  }))
  
  var isolinesLayer = ui.Map.Layer(isoImages.mosaic(), {min:tmin, max:tmax, palette: palette}, 'isolines', false, 0.3)
  Map.layers().add(isolinesLayer)
}

//analyzeExampleImage()

function analyzeModis() {
  var modis = ee.ImageCollection('MODIS/MYD11A1')
  
  Map.addLayer(modis.select('LST_Day_1km').limit(2500), {}, 'MODIS LST', false)
  
  modis = modis
    .filterDate('2016-05-25', '2016-05-30')
  
  modis.getInfo(function(images) {
    images.features.map(function(i) {
      var image = ee.Image(i.id).updateMask(water)
      Map.addLayer(image.select('LST_Day_1km'), {min:14690, max:15700, palette:['0000ff', 'ffff00', 'ff0000']}, i.id, false)
    })
    
  })
}

// analyzeModis()

var images = ee.ImageCollection('LANDSAT/LC8_L1T_TOA')
  .filterBounds(bounds.bounds())
  .select(
    ['B6', 'B7', 'B5', 'B4', 'B3', 'B2', 'B9', 'B1', 'B10'], 
    ['swir', 'swir2', 'nir', 'red', 'green', 'blue', 'cirrus', 'coastal', 'temp'])

// var images = ee.ImageCollection('LANDSAT/LT05/C01/T1_TOA')
//   .filterBounds(aoi)
//   .select(
//     ['B5', 'B7', 'B4', 'B3', 'B2', 'B1', 'B6'], 
//     ['swir', 'swir2', 'nir', 'red', 'green', 'blue', 'temp'])
    
    
// var images = ee.ImageCollection('LANDSAT/LE07/C01/T1_TOA')
//   .filterBounds(aoi)
//   .select(
//     ['B5', 'B7', 'B4', 'B3', 'B2', 'B1', 'B6_VCID_1'], 
//     ['swir', 'swir2', 'nir', 'red', 'green', 'blue', 'temp'])
        
// skip empty
function addCount(i) { 
  return i.set('count', i.select(0).mask().reduceRegion(ee.Reducer.sum(), aoi, 60).values().get(0)) 
}
images = images.map(addCount).filter(ee.Filter.gt('count', 5))

images = images.map(function(i) { return i.addBands(computeCloudScore(i)) })

var cloudThreshold = 0.05

images = images.map(function(i) {
  var cloud = i.select('cloud_score').gt(cloudThreshold)
  var cloudPixelCount = cloud.multiply(water)
    .reduceRegion(ee.Reducer.sum(), bounds, 30).get('cloud_score')

  return i.set('cloud_pixel_count', cloudPixelCount)
})

    
print(images.toList(1000).map(function(i) { return ee.Image(i).date()}))  

function drawFrame(image) {
  var rgb = image.visualize({min:0.03, max: 0.3, bands: ['red','green','blue']})
  
  var palette = ['0000ff', 'ffff00', 'ff0000']
  
  var cloud = image.select('cloud_score').gt(cloudThreshold)
  
  var temp = image.select('temp').updateMask(water.and(cloud.not()))
  
  var percentiles = temp.reduceRegion(ee.Reducer.percentile([10,90]), bounds, 30)
  var tmin = percentiles.get('temp_p10')
  var tmax = percentiles.get('temp_p90')
  
  //var tmin = 274
  //var tmax = 300
  
  tmin = ee.Number(ee.Algorithms.If(ee.Algorithms.IsEqual(tmin, null), 0, tmin))
  tmax = ee.Number(ee.Algorithms.If(ee.Algorithms.IsEqual(tmax, null), 0, tmax))

  temp = temp.visualize({min: tmin, max:tmax, palette: palette})
  
  var strTmin = ee.Number(tmin).format('%.2f')
  var strTmax = ee.Number(tmax).format('%.2f')
  var strDate = image.date().format('YYYY-MM-dd')

  var imageTmin = text.draw(ee.String('T min: ').cat(strTmin), ptTmin, Map.getScale(), {
      fontSize:14, textColor: 'ffffff', outlineColor: '000000', outlineWidth: 2, outlineOpacity: 0.6})
  
  var imageTmax = text.draw(ee.String('T max: ').cat(strTmax), ptTmax, Map.getScale(), {
      fontSize:14, textColor: 'ffffff', outlineColor: '000000', outlineWidth: 2, outlineOpacity: 0.6})
  
  var imageDate = text.draw(ee.String('Date: ').cat(strDate), ptDate, Map.getScale(), {
      fontSize:14, textColor: 'ffffff', outlineColor: '000000', outlineWidth: 2, outlineOpacity: 0.6})
  
  return ee.ImageCollection.fromImages([white, rgb, temp, imageTmin, imageTmax, imageDate]).mosaic()
    .set('system:time_start', image.get('system:time_satrt'))
    .set('temp_range', percentiles)
    .set('cloud_pixel_count', image.get('cloud_pixel_count'))
}

var rows = 10
var columns = 8
var scale = Map.getScale()
var min = 0.03
var max = 0.25

// show as a gallery
var options = {proj: 'EPSG:3857', flipX: false, flipY: true }
var gallery = imageGallery.draw(images, aoi, rows, columns, scale, options)

Map.addLayer(gallery, {bands: ['swir', 'nir', 'blue'], min: min, max: max}, 'gallery (false)', false);
Map.addLayer(gallery, {bands: ['red', 'green', 'blue'], min: min, max: max}, 'gallery (true)', false);

Map.addLayer(gallery, {bands: ['cloud_score'], min: 0, max: 1}, 'gallery (cloud score)', false);
Map.addLayer(gallery.updateMask(gallery.select('cloud_score').gt(cloudThreshold)), {bands: ['cloud_score'], min: 0, max: 1, palette:['ffffff', 'ffff00']}, 'gallery (cloud mask)', false);

var frames = images.map(drawFrame)

print(frames.first())

print(frames.aggregate_array('cloud_pixel_count'))

print('cloud_pixel_count', ui.Chart.feature.histogram(frames, 'cloud_pixel_count'))

var gallery = imageGallery.draw(frames, aoi, rows, columns, scale, options)
Map.addLayer(gallery, {}, 'gallery (true + temp)', false);

var framesLessClouds = frames.filter(ee.Filter.lt('cloud_pixel_count', 50))
print('less clouds:', framesLessClouds.size())

Export.video.toDrive({
  collection: framesLessClouds, 
  description: 'temperature-npp', 
  fileNamePrefix: 'temperature-npp', 
  framesPerSecond: 1, 
  dimensions: 1920, 
  region: Map.getBounds(true)
})

var tempGood = images.select('temp').filter(ee.Filter.lt('cloud_pixel_count', 50))
print(ui.Chart.image.seriesByRegion(tempGood, geometry, ee.Reducer.first(), 'temp', 30))

Map.addLayer(tempGood, {}, 'less cloudy', false)

var gallery = imageGallery.draw(framesLessClouds, aoi, rows, columns, scale, options)
Map.addLayer(gallery, {}, 'gallery (true + temp), filtered');


function analyzeAster() {
  aster = aster.filterBounds(aoi)
  
  print('ASTER image count:', aster.size())
  
  aster = aster.filter(
    ee.Filter.and(
      ee.Filter.listContains('ORIGINAL_BANDS_PRESENT', 'B01'), 
      ee.Filter.listContains('ORIGINAL_BANDS_PRESENT', 'B3N'), 
      ee.Filter.listContains('ORIGINAL_BANDS_PRESENT', 'B10')
    )
  )
  
  aster = aster.select(
    ['B01', 'B02', 'B3N', 'B04', 'B05', 'B06', 'B07', 'B08', 'B09', 'B10', 'B11', 'B12', 'B13', 'B14'],
    ['green', 'red', 'nir', 'swir', 'swir2', 'swir3', 'swir4', 'swir5', 'swir6', 'temp', 'temp2', 'temp3', 'temp4', 'temp5']
  )
  
  aster = aster.map(function(i) {
    var tempBandNames = ['temp', 'temp2', 'temp3', 'temp4', 'temp5']
    var temp = Aster.temperature.fromDN(i.select(tempBandNames))
    return i
      .divide(255)
      .addBands(temp, tempBandNames, true)
      .set('system:time_start', i.get('system:time_start'))
  })  
  
  aster = aster.map(addCount).filter(ee.Filter.gt('count', 5))
  
  aster = aster.map(function(i) { return i.addBands(Aster.cloudScore(i)) })
  
  var gallery = imageGallery.draw(aster, aoi, rows, columns, scale, options)
  
  Map.addLayer(gallery, {bands: ['swir', 'nir', 'red'], min: 0, max: 1}, 'ASTER, gallery (false)', false);
  
  Map.addLayer(gallery, {bands: ['temp'], palette: palette, min: tmin, max: tmax}, 'ASTER, gallery (temp)', false);
  Map.addLayer(gallery, {bands: ['temp2'], palette: palette, min: tmin, max: tmax}, 'ASTER, gallery (temp2)', false);
  Map.addLayer(gallery, {bands: ['temp3'], palette: palette, min: tmin, max: tmax}, 'ASTER, gallery (temp3)', false);
  Map.addLayer(gallery, {bands: ['temp4'], palette: palette, min: tmin, max: tmax}, 'ASTER, gallery (temp4)', false);
  Map.addLayer(gallery, {bands: ['temp5'], palette: palette, min: tmin, max: tmax}, 'ASTER, gallery (temp5)', false);
  
  Map.addLayer(gallery.select('cloud_score'), {min: 0, max: 1}, 'ASTER, gallery (cloud score)', false);
  
  //var t = Aster.temperature.fromDN(aster)
  
  
  function drawFrameAster(image) {
    var rgb = image.visualize({min:0.03, max: 0.6, bands: ['swir','nir','red']})
    
    var palette = ['0000ff', 'ffff00', 'ff0000']
    
    var cloud = image.select('cloud_score').gt(0)
    
    var cloudPixelCount = cloud.multiply(water)
      .reduceRegion(ee.Reducer.sum(), bounds, 30).get('cloud_score')
    
    var temp = image.select('temp2').updateMask(water.and(cloud.not()))
  
    var percentiles = temp.reduceRegion(ee.Reducer.percentile([10,90]), bounds, 30)
    var tmin = percentiles.get('temp2_p10')
    var tmax = percentiles.get('temp2_p90')
    
    // var tmin = 274
    // var tmax = 300
    
    tmin = ee.Number(ee.Algorithms.If(ee.Algorithms.IsEqual(tmin, null), 0, tmin))
    tmax = ee.Number(ee.Algorithms.If(ee.Algorithms.IsEqual(tmax, null), 0, tmax))
  
    temp = temp.visualize({min: tmin, max:tmax, palette: palette})
    
    var strTmin = ee.Number(tmin).format('%.2f')
    var strTmax = ee.Number(tmax).format('%.2f')
    var strDate = image.date().format('YYYY-MM-dd')
  
    var imageTmin = text.draw(ee.String('T min: ').cat(strTmin), ptTmin, Map.getScale(), {
        fontSize:14, textColor: 'ffffff', outlineColor: '000000', outlineWidth: 2, outlineOpacity: 0.6})
    
    var imageTmax = text.draw(ee.String('T max: ').cat(strTmax), ptTmax, Map.getScale(), {
        fontSize:14, textColor: 'ffffff', outlineColor: '000000', outlineWidth: 2, outlineOpacity: 0.6})
    
    var imageDate = text.draw(ee.String('Date: ').cat(strDate), ptDate, Map.getScale(), {
        fontSize:14, textColor: 'ffffff', outlineColor: '000000', outlineWidth: 2, outlineOpacity: 0.6})
    
    return ee.ImageCollection.fromImages([white, /*rgb, */temp, imageTmin, imageTmax, imageDate]).mosaic()
      .set('system:time_start', image.get('system:time_satrt'))
      .set('temp_range', percentiles)
      .set('cloud_pixel_count', cloudPixelCount)
  }
  
  var frames = aster.map(drawFrameAster)
  
  print('cloud_pixel_count', ui.Chart.feature.histogram(frames, 'cloud_pixel_count'))
  
  var gallery = imageGallery.draw(frames, aoi, rows, columns, scale, options)
  Map.addLayer(gallery, {}, 'ASTER, gallery (true + temp)', false);
  
  var framesLessClouds = frames.filter(ee.Filter.lt('cloud_pixel_count', 50))
  print('less clouds:', framesLessClouds.size())
  var gallery = imageGallery.draw(framesLessClouds, aoi, rows, columns, scale, options)
  Map.addLayer(gallery, {}, 'ASTER, gallery (true + temp), filtered', false);
}

// analyzeAster()