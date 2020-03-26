/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var geometry = /* color: #98ff00 */ee.Geometry.Point([7.384185791015625, 53.29559325210353]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
var imageGallery = require('users/gena/packages:gallery');
var text = require('users/gena/packages:text')
var utils = require('users/gena/packages:utils')

// construct CDF image collection
/*
  var cdf = ee.ImageCollection.fromImages(
  ee.List.sequence(0, 100, 5).remove(5).getInfo().map(function(p) {
    var image = ee.Image('users/gena/eo-bathymetry/CDF-' + utils.pad(p, 3)).resample('bicubic') 
    return image.addBands(ee.Image.constant(image.get('percentile')).divide(100).float().rename('P'))
  })
  )
  
  var cdfArray = cdf.toArray()
  Map.addLayer(cdf.select(['red','green','blue','nir']), {}, 'CDF (raw)', false)
*/

/*
var vis = {bands: ['swir1', 'nir', 'red'], min: 0.03, max:0.4}
Map.addLayer(cdf.filter(ee.Filter.eq('percentile', 15)), vis, '15%', false)

 var results = cdf.map(function(i) { return i.select('P').addBands(i.normalizedDifference(['red', 'nir'])) })
   .reduce(ee.Reducer.linearFit())
 Map.addLayer(results, {bands:['scale', 'scale', 'offset'], min: [-0.8, -0.8, -0.3], max: [0.6, 0.6, 0.6]}, 'CDF regression', false)
*/


//return

function focalMaxWeight(image, radius) {
  var distance = image.fastDistanceTransform().sqrt()
  var dilation = distance.where(distance.gte(radius), radius)
  
  dilation = ee.Image(radius).subtract(dilation).divide(radius)
  
  return dilation
}

// var geometry = /* color: #d63000 */ee.Geometry.Point([6.5650177001953125, 53.97370742935838]);


function app() {
  var scale = Map.getScale()
  
  // define area of interest
  var aoi = geometry.buffer(scale*40).bounds()

  // get images for that area
  var s2 = ee.ImageCollection('COPERNICUS/S2')
    .filterBounds(aoi)
    //.filterDate('2017-08-01', '2018-01-01')
    .select(
      ['B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8', 'B8A', 'B9', 'B10', 'B11', 'B12'],
      ['coastal', 'blue', 'green', 'red', 'red2', 'red3', 'red4', 'nir', 'nir2', 'water_vapour', 'cirrus', 'swir', 'swir2']
    )

  s2 = s2.map(function(i) {
    var time = i.get('system:time_start')
    
    i = i.resample('bicubic').divide(10000)

    return i
      .set('system:time_start', time)
  })
  
  // merge by time
  s2 = mosaicByTime(s2)
  print('Image size (merged by time):', s2.size())

  var l8 = ee.ImageCollection('LANDSAT/LC08/C01/T1_TOA')
  
  l8 = l8.map(function(i) {
    var time = i.get('system:time_start')

    return i.resample('bicubic')
      .set('system:time_start', time)
  })
  
  l8 = l8
    .filterBounds(aoi)
    .select(['B6', 'B7', 'B5', 'B4', 'B3', 'B2', 'B9', 'B1'], 
      ['swir', 'swir2', 'nir', 'red', 'green', 'blue', 'cirrus', 'coastal'])

  var images = s2
  //var images = l8
  //var images = ee.ImageCollection(l8.merge(s2))
  
    
  var cloudFrequency = 70
    
  // naive groupping of overlapping images - S2 scenes are split
  //images = ee.ImageCollection(images.distinct('system:time_start'))
  

  print('Image size:', images.size())

  var rows = 10
  var columns = 15
  images = images.limit(rows*columns)
  
  // skip empty
  function addAny(i) { 
    return i.set('any', i.select(0).mask().reduceRegion(ee.Reducer.anyNonZero(), aoi, scale).values().get(0)) 
  }
  images = images.map(addAny).filter(ee.Filter.eq('any', 1))

  // add some quality score (cloudness, greeness, etc.)
  images = addSpatialQualityScore(images, aoi, scale)

  // sort
  images = images.sort('quality')
  //images = images.sort('system:time_start')
  
  print(images.aggregate_array('quality'))
  
  print(ui.Chart.feature.histogram(images, 'quality', 30))
  
  // TODO: determine from cloud frequency
  var qualityThreshold = 0.35
  
  var minReflectance = 0.05
  var maxReflectance = 0.15
  
  // show as a gallery
  var options = {proj: 'EPSG:3857', flipX: false, flipY: true }
  var gallery = imageGallery.draw(images, aoi, rows, columns, scale, options)

  Map.addLayer(gallery, {bands: ['red', 'green', 'blue'], min: minReflectance, max: maxReflectance}, 'gallery (true), all', false);

  // filter cloudy images
  images = images.filter(ee.Filter.lt('quality', qualityThreshold))

  print('Image size (filtered):', images.size())
  
  //images = images.limit(rows*columns)
  
  
  Map.addLayer(gallery, {bands: ['swir', 'nir', 'blue'], min: minReflectance, max: maxReflectance}, 'gallery (false)', true);
  Map.addLayer(gallery, {bands: ['red', 'green', 'blue'], min: minReflectance, max: maxReflectance}, 'gallery (true)', false);

  var cloudScore = computeCloudScore(gallery)
  var cloudScore = gallery.select('cloud_score')

  Map.addLayer(cloudScore.mask(cloudScore), {min: 0.0, max: 0.5, palette:['000000', 'ffff00']}, 'gallery (cloud)', false);
  Map.addLayer(cloudScore, {min: 0.0, max: 0.5, palette:['000000', 'ffffff']}, 'gallery (cloud, no mask)', false);
  Map.addLayer(cloudScore.mask(cloudScore.gt(0.15)), {min: 0.0, max: 1, palette:['000000', 'ffff00']}, 'gallery (cloud > 0.15)', false);
  Map.addLayer(cloudScore.mask(cloudScore.gt(0.1)), {min: 0.0, max: 1, palette:['000000', 'ffff00']}, 'gallery (cloud > 0.1)', false);
  Map.addLayer(cloudScore.mask(cloudScore.gt(0.4)), {min: 0.0, max: 1, palette:['000000', 'ffff00']}, 'gallery (cloud > 0.4)', false);

  var mean = images.map(function(i) { 
    return i.updateMask(i.select('cloud_score').lt(0.5))
  }).mean()


  var focalMax = function(image, radius) {
    var dilation = image.fastDistanceTransform().sqrt().lte(radius)
    return dilation
  }
  
  var focalMin = function(image, radius) {
    var erosion = image.unmask().not().fastDistanceTransform().sqrt().lte(radius).not()
    return erosion
  }
  


  var ndwi = images.map(function(i) { 
    // var ndwi = i.updateMask(focalMax(focalMin(i.select('cloud_score').gte(0.5), 10), 300).not()).normalizedDifference(['green', 'nir'])
    var ndwi = i.updateMask(i.select('cloud_score').lt(0.5)).normalizedDifference(['green', 'nir'])
    
    ndwi = ndwi
      .where(ndwi.gt(0.3), 0.3)
      .where(ndwi.lt(-0.05), -0.05)
      
    return ndwi
  }).mean()
  
  Map.addLayer(mean, {bands: ['swir', 'nir', 'blue'], min: minReflectance, max: maxReflectance}, 'masked', false);

  var Palettes = {
      water: ['f7fbff', 'deebf7', 'c6dbef', '9ecae1', '6baed6', '4292c6', '2171b5', '08519c', '08306b']
  };
  Map.addLayer(ndwi, {min: 0, max: 0.3, palette: Palettes.water}, 'masked, ndwi', false);



  
  var radius = 30
  var stddev = cloudScore.reduceNeighborhood(ee.Reducer.stdDev(), ee.Kernel.circle(radius, 'meters'))
  Map.addLayer(stddev, {min: 0, max: 0.05}, 'cloudScore stddev neighborhood', false)  

  
  function renderLabel(i) {
    //var str = i.id()
    var str = i.date().format('YYYY-MM-dd')
    //var str = ee.Number(i.get('score')).format('%.2f')
    
    return text.draw(str, location, scale, {
        fontSize:14, textColor: 'ffffff', outlineColor: '000000', outlineWidth: 2, outlineOpacity: 0.6})
  }
  
  var locations = getMarginLocations(aoi, 'left', 10, 10, scale)
  var location = locations.get(8)
  var labelImages = images.map(renderLabel)
  var galleryLabel = imageGallery.draw(labelImages, aoi, rows, columns, scale, options)
  Map.addLayer(galleryLabel, {}, 'gallery, label', true)


  var cloudScoreText = ee.Image()
  var cloudScoreTextLayer = ui.Map.Layer(cloudScoreText, {}, 'cloud score text')
  Map.layers().add(cloudScoreTextLayer)

  var cloudScorePoiLayer = ui.Map.Layer(null, {palette: ['ff0000']}, 'cloud score text location', 0.3)
  Map.layers().add(cloudScorePoiLayer)
  
  Map.onClick(function(pt) {
    cloudScoreTextLayer.setEeObject(ee.Image())
  
    pt = ee.Dictionary(pt)
    var lat = pt.get('lat')
    var lon = pt.get('lon')
    
    var poi = ee.Geometry.Point([lon, lat])//.buffer(150)
    
    var region = poi.buffer(Map.getScale()*5)
  
    cloudScorePoiLayer.setEeObject(ee.Image().paint(poi, 1, 1))
  
    var cloudScoreValue = cloudScore
      .reduceRegion({reducer: ee.Reducer.first(), geometry: poi, scale: Map.getScale(), crs: 'EPSG:3857'}).values().get(0)

    print(cloudScoreValue)

    var text = Text.draw(ee.Number(cloudScoreValue).format('%.3f'), poi, Map.getScale(), {
        fontSize:14, textColor: 'ffff00', outlineColor: '000000', outlineWidth: 2, outlineOpacity: 0.6})

    cloudScoreTextLayer.setEeObject(text)
  })
}

var show = function(image, name, opt_vis) {
  var vis = opt_vis || {min:0, max:1}
  Map.addLayer(image, vis, name, false)
}

function getProbabilityFromCdf(image, band) {
  var j = image.select(band)

  return cdf.select(['P', band]).map(function(i) {
    return i.select(0).mask(i.select(band).gt(image.select(band)))
  }).reduce(ee.Reducer.min()).rename('p')
}


/***
 * Match current image values with the CDF.
 */
function computeCloudScoreCdf(img) {
    var score = ee.Image(1.0);
    
    // find matching percentiles
    score = score.min(getProbabilityFromCdf(img, 'nir'))
    score = score.min(getProbabilityFromCdf(img, 'green'))
    score = score.min(getProbabilityFromCdf(img, 'blue'))
    
    return score.rename('cloud_score')
}

function computeCloudScore(img) {
    //return computeCloudScoreCdf(img)
  
    // Compute several indicators of cloudyness and take the minimum of them.
    var score = ee.Image(1.0);

    // Clouds are reasonably bright in the blue band.
    score = score.min(utils.rescale(img, 'img.blue', [0.15, 0.8]).aside(show, 'blue')).aside(show, 'score blue');

    // Clouds are reasonably bright in all visible bands.
    score = score.min(utils.rescale(img, 'img.red + img.green + img.blue', [0.4, 0.8]).aside(show, 'vis')).aside(show, 'score vis');

    // Clouds are reasonably bright in all infrared bands.
    // score = score.min(utils.rescale(img, 'img.nir + img.swir + img.swir2', [0.2, 0.8]).aside(show, 'ir')).aside(show, 'score ir');

    // Clouds are reasonably cool in temperature.
    //score = ee.Image(ee.Algorithms.If(img.bandNames().contains('temp'),
    //    score.min(utils.rescale(img, 'img.temp', [293, 268])).aside(show, 'score temp'),
    //    score
    //))

    // NDWI
    // var ndwi = img.normalizedDifference(['green', 'nir']).rename('ndwi').aside(show, 'ndwi')
    // score = score.where(ndwi.gt(0.1), 0).aside(show, 'score ndwi')

    // NDVI
    var ndvi = img.normalizedDifference(['nir', 'red']).rename('ndvi').aside(show, 'ndvi')
    score = score.where(ndvi.gt(0.2), 0).aside(show, 'score ndvi')

    // NDWI
    var ndwi = img.normalizedDifference(['green', 'nir']).rename('ndwi').aside(show, 'ndwi', {min:-0.15, max:0.15})

    // MNDWI
    var mndwi = img.normalizedDifference(['green', 'swir']).rename('mndwi').aside(show, 'mndwi', {min: -0.25, max:0.25})
    
    var awei =  img.expression('4 * (img.green - img.swir) - (0.25 * img.nir + 2.75 * img.swir)', {img: img}).aside(show, 'awei', min:-0.5, max:0.5)


    // Clouds have high value in cirrus band
    var cirrus = utils.rescale(img, 'img.cirrus', [0.03, 0.1]).aside(show, 'cirrus')
    score = score.max(cirrus).aside(show, 'score cirrus')
    
    // clouds are not sand (bright in nir, but not cirrus)
    var sand = ee.Image(1)
    //sand = sand.multiply(img.select('nir').gt(img.select('blue'))).aside(show, 'sand1')
    //sand = sand.multiply(img.select('blue').gt(img.select('coastal'))).aside(show, 'sand2')
    //sand = sand.multiply(img.select('blue').lt(0.43)).aside(show, 'sand3')
    //sand = sand.multiply(img.select('nir').lt(0.65)).aside(show, 'sand4')
    sand = sand.multiply(img.select('coastal').lt(0.35)).aside(show, 'sand3')
    sand = sand.multiply(utils.rescale(img.select('nir').subtract(img.select('blue')), 'img', [0.05, 0.1])).aside(show, 'sand5')
    sand = sand.multiply(utils.rescale(img.select('red').subtract(img.select('coastal')), 'img', [0.05, 0.2])).aside(show, 'sand6')
    //sand = focalMaxWeight(sand.gt(0.01), 15).aside(show, 'sand7')
    score = score.multiply(ee.Image(1).subtract(sand))
    
    
    //score = score.min(utils.rescale(sand, 'img.sand', [0.3, 0.4])).aside(show, 'score sand')
    
      
/*    var time = img.date()
    var images = getImages(selection).filterDate(
        time.advance(-60, 'day'),
        time.advance(60, 'day')
        )
        
    score = images.select('green').reduce(ee.Reducer.percentile([percentile])).rename('green')
      .subtract(img.select('green')).abs()
*/
    
    // check if current value differs a lot from an average value
    // score = average.subtract(img).abs().select('blue')

    // However, clouds are not snow.
    //let ndsi = img.normalizedDifference(['red', 'swir']);
    //score = score.min(utils.rescale(ndsi, 'img', [0.2, 0.0])).aside(show, 'score ndsi')

    //var ndsi = img.normalizedDifference(['green', 'swir']);
    //return score.min(utils.rescale(ndsi, 'img', [0.8, 0.6]));

    return score.rename('cloud_score');
};

/***
 * Estimates quality score for a given area.
 */
function addSpatialQualityScore(images, g, scale) {
  return images  
    .map(function(i) { 
      return i.set({
        quality: i.select('green').reduceRegion(ee.Reducer.percentile([90]), g, scale).values().get(0)
        //quality: i.select('cloud_score').reduceRegion(ee.Reducer.sum(), g, scale).values().get(0)
      })
    })
}

/***
 * Makes offset from the left bounds Geometry margin and splits into count pieces, returns locations.
 */
function getMarginLocations(bounds, margin, marginSize, count, scale) {
    var marginSize = ee.Number(marginSize).multiply(scale);
    var boundsSmall = bounds.buffer(marginSize.multiply(-1)).bounds();
    var coords = ee.List(boundsSmall.coordinates().get(0));
    
    if(margin === 'left') {
      var pt0 = ee.List(coords.get(0));
      var pt1 = ee.List(coords.get(3));
    } else if(margin === 'right') {
      var pt0 = ee.List(coords.get(1));
      var pt1 = ee.List(coords.get(2));
    }

    var marginLine = ee.Geometry.LineString([pt0, pt1]);

    var distances = ee.List.sequence(0, marginLine.length(), marginLine.length().divide(count-1));

    var lineToFirstPoint = function lineToFirstPoint(g) {
        var coords = ee.Geometry(g).coordinates().get(0);
        return ee.Feature(ee.Algorithms.GeometryConstructors.Point(coords));
    };

    var points = ee.FeatureCollection(marginLine.cutLines(distances).geometries().map(lineToFirstPoint));

    // Map.addLayer(points, {color: 'green'}, 'text locations')

    return points.toList(count).map(function (o) {
        return ee.Feature(o).geometry();
    });
}

/***
 * Sentinel-2 produces multiple images, resultsing sometimes 4x more images than the actual size. 
 * This is bad for any statistical analysis.
 * 
 * This function mosaics images by time. 
 */
function mosaicByTime(images) {
  var TIME_FIELD = 'system:time_start'

  var distinct = images.distinct([TIME_FIELD])

  var filter = ee.Filter.equals({ leftField: TIME_FIELD, rightField: TIME_FIELD });
  var join = ee.Join.saveAll('matches')
  var results = join.apply(distinct, images, filter)

  // mosaic
  results = results.map(function(i) {
    var mosaic = ee.ImageCollection.fromImages(i.get('matches')).sort('system:index').mosaic()
    
    return mosaic.copyProperties(i).set(TIME_FIELD, i.get(TIME_FIELD))
  })
  
  return ee.ImageCollection(results)
}

app()