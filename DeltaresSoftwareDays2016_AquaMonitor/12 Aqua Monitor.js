/***
 * Surface water change detection (copied from http://aqua-monitor.appspot.com)
 */

function radians(img) { return img.toFloat().multiply(3.1415927).divide(180); }

function hillshade(az, ze, slope, aspect) {
  var azimuth = radians(ee.Image(az));
  var zenith = radians(ee.Image(ze));
  return azimuth.subtract(aspect).cos().multiply(slope.sin()).multiply(zenith.sin())
      .add(zenith.cos().multiply(slope.cos()));
}

function hillshadeit(image, elevation, weight, height_multiplier) {
  var hsv  = image.unitScale(0, 255).rgbtohsv();

  var terrain = ee.call('Terrain', elevation.multiply(height_multiplier));
  var slope = radians(terrain.select(['slope']));
  var aspect = radians(terrain.select(['aspect']));
  var hs = hillshade(azimuth, zenith, slope, aspect);

  var intensity = hs.multiply(weight).multiply(hsv.select('value'));
  var huesat = hsv.select('hue', 'saturation');
  
  return ee.Image.cat(huesat, intensity).hsvtorgb();
}

var hand = ee.ImageCollection("users/gena/global-hand/hand-100")

var handThreshold = 40;
var handClosingBuffer = 800;
var slopeThreshold = 20
var slopeClosingBuffer = 120;

var handMask = 
  ee.Image(1)
  hand.mosaic().lt(50)

var handMaskClosed = 
  ee.Image(1)
  //hand.mosaic().gt(handThreshold).and(noHandMask.not())
  //    .focal_max(handClosingBuffer, 'circle', 'meters').focal_min(handClosingBuffer, 'circle', 'meters').not()

// slope
var demImages = [
  ee.Image('users/gena/ViewfinderpanoramaDEM/VFP_DEM1'),
  ee.Image('users/gena/ViewfinderpanoramaDEM/VFP_DEM2'),
  ee.Image('users/gena/ViewfinderpanoramaDEM/VFP_DEM3'),
  ee.Image('users/gena/ViewfinderpanoramaDEM/VFP_DEM4'),
  ee.Image('users/gena/ViewfinderpanoramaDEM/VFP_DEM5'),
  ee.Image('users/gena/ViewfinderpanoramaDEM/VFP_DEM6'),
  ee.Image('users/gena/ViewfinderpanoramaDEM/VFP_DEM7'),
  ee.Image('users/gena/ViewfinderpanoramaDEM/VFP_DEM8'),
  ee.Image('USGS/SRTMGL1_003')
];

// fix cache
var slope = ee.ImageCollection(demImages).map(function(i) { 
  var dem = i.rename('elevation').add(0)
  var terrain = ee.call('Terrain', dem);
  return terrain.select(['slope']);
}).mosaic()

/*
// sigmoid
var k = 0.4
var x0 = 25
var slopeMask = ee.Image.constant(1.0).divide(ee.Image.constant(Math.E).pow(slope.subtract(x0).multiply(-k)))
*/

var slopeMask = slope.gt(slopeThreshold)

slopeMask = slopeMask
  .focal_max(slopeClosingBuffer, 'circle', 'meters')
  .focal_min(slopeClosingBuffer, 'circle', 'meters')


var hand = ee.ImageCollection("users/gena/global-hand/hand-100"),
    countries = ee.FeatureCollection("ft:1tdSwUL7MVpOauSgRzqVTOwdfy17KDbw-1d9omPw"),
    glcf = ee.ImageCollection("GLCF/GLS_WATER"),
    geometry = /* color: d63000 */ee.Geometry.MultiPoint();

function renderLandsatPercentile(options) {
  var percentile = options.percentile;
  var start = options.start;
  var stop = options.stop;
  var sharpen = options.sharpen;
  var smoothen = options.smoothen;
  var filterCount = options.filterCount;
  var isRgb = options.isRgb;
  
  var bands = ['red', 'green', 'blue'];
  var bandsL8 = ['B6', 'B5', 'B3']
  var bandsL7 = ['B5', 'B4', 'B2']

  if(isRgb) {
    bands = ['swir1', 'nir', 'green'];
    bandsL8 = ['B4', 'B3', 'B2']
    bandsL7 = ['B3', 'B2', 'B1']
  }
  
  var l8 = new ee.ImageCollection('LANDSAT/LC8_L1T_TOA').filterDate(start, stop).select(bandsL8, bands);
  var l7 = new ee.ImageCollection('LANDSAT/LE7_L1T_TOA').filterDate(start, stop).select(bandsL7, bands);
  var l5 = new ee.ImageCollection('LANDSAT/LT5_L1T_TOA').filterDate(start, stop).select(bandsL7, bands);
  var l4 = new ee.ImageCollection('LANDSAT/LT4_L1T_TOA').filterDate(start, stop).select(bandsL7, bands);

  var images = ee.ImageCollection(l8.merge(l7).merge(l5).merge(l4))
    .map(function(i) { return i.mask(i.gt(0.0001).and(i.lt(1)))}) // filter-out crappy TOA images

  var imageEnvelopes = ee.FeatureCollection(images.filterBounds(geometry).map(function(i) {
    return ee.Feature(null, {'SUN_AZIMUTH': i.get('SUN_AZIMUTH')})
  }))

  // print(Chart.feature.histogram(imageEnvelopes, 'SUN_AZIMUTH', 50))
    
  //images = ee.ImageCollection(images.limit(100))
  
  //var images = ee.ImageCollection(l7.merge(l5).merge(l4))

  if(smoothen) {
    images = images.map(function(i) { return i.resample('bicubic'); })
  }

  var image = images
    .map(function(i) { return i.mask(i.gt(0.0001).and(i.lt(1)))})
    //.filterMetadata('SUN_AZIMUTH', 'greater_than', 5) // almost empty
    .reduce(ee.Reducer.percentile([percentile]))
    .rename(bands)

  if(filterCount > 0) {
    image = image.mask(images.select(0).count().gt(filterCount));
    Map.addLayer(images.select(0).count(), {min:filterCount, max:200, palette:['d7191c','fdae61','ffffbf','a6d96a','1a9641']}, 'count', false)
  }

  if(sharpen) {
    // LoG
    image = image.subtract(image.convolve(ee.Kernel.gaussian(40, 30, 'meters')).convolve(ee.Kernel.laplacian8(0.4)))
  }

  return image.visualize({min: 0.05, max: [0.4, 0.4, 0.5], gamma: 1.4})
}

function pad(n, width, z) {
  z = z || '0';
  n = n + '';
  return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}

var generateGrid = function(xmin, ymin, xmax, ymax, dx, dy) {
  var polys = [];
  for (var x = xmin; x < xmax; x += dx) {
    var x1 = Math.max(-179.99, Math.min(179.99, x));
    var x2 = Math.max(-179.99, Math.min(179.99, x + dx));
    
    for (var y = ymin; y < ymax; y += dy) {
      var y1 = Math.max(-89.99, Math.min(89.99, y));
      var y2 = Math.max(-89.99, Math.min(89.99, y + dy));

      polys.push(ee.Feature(ee.Geometry.Rectangle(x1, y1, x2, y2)));
    }
  }
  print("Cell count: " + polys.length)

  return ee.FeatureCollection(polys);
}

function getIntersection(left, right) {
  var spatialFilter = ee.Filter.intersects({leftField: '.geo', rightField: '.geo', maxError: 1000});
  var saveAllJoin = ee.Join.saveAll({matchesKey: 'match'});
  var intersectJoined = saveAllJoin.apply(left, right, spatialFilter);

  return intersectJoined.map(function(f) { 
    var match = ee.List(f.get('match'));
    return f.set('count', match.length())
  }).filter(ee.Filter.gt('count', 0))
}

function getEdge(i) {
  var canny = ee.Algorithms.CannyEdgeDetector(i, 0.99, 0);
  canny = canny.mask(canny)
  return canny;
}

function createTimeBand(img) {
  var date = ee.Date(img.get('system:time_start'));
  var year = date.get('year').subtract(1970);
  return ee.Image(year).byte().addBands(img)
}

// A helper to apply an expression and linearly rescale the output.
var rescale = function (img, thresholds) {
  return img.subtract(thresholds[0]).divide(ee.Number(thresholds[1]).subtract(thresholds[0]))
  .copyProperties(img)
  .copyProperties(img, ['system:time_start']);
};

function getWaterTrendChangeRatio(start, stop) {
  return (15 / (stop - start));  // empiricaly found ratio
}

// TODO: split it into smaller functions
function renderWaterTrend(options) {
  var dateIntervals = options.dateIntervals;
  var percentile = options.percentile;
  
  var slopeThreshold = options.slopeThreshold;
  var slopeThresholdRatio = options.slopeThresholdRatio;
  var refine = options.refine;
  var slopeThresholdRefined = options.slopeThresholdRefined;
  
  var ndviFilter = options.ndviFilter;
  var filterCount = options.filterCount;

  var showEdges = options.showEdges;
  var smoothen = options.smoothen;
  var includeBackgroundSlope = options.includeBackgroundSlope;
  var backgroundSlopeOpacity = options.backgroundSlopeOpacity;
  var refineFactor = options.refineFactor;
  
  var ndwiMaxLand = options.ndwiMaxLand;
  var ndwiMinWater = options.ndwiMinWater;

  var bands = ['green', 'swir1'];
  var bands8 = ['B3', 'B6'];
  var bands7 = ['B2', 'B5'];

  if(ndviFilter > -1) {
    bands = ['green', 'swir1', 'nir', 'red'];
    bands8 = ['B3', 'B6', 'B5', 'B4'];
    bands7 = ['B2', 'B5', 'B4', 'B3'];
  }
  
  var images = new ee.ImageCollection([])

  var images_l8 = new ee.ImageCollection('LANDSAT/LC8_L1T_TOA').select(bands8, bands);
  images = new ee.ImageCollection(images.merge(images_l8));

  var images_l7 = new ee.ImageCollection('LANDSAT/LE7_L1T_TOA').select(bands7, bands);
  images = new ee.ImageCollection(images.merge(images_l7));

  var images_l5 = new ee.ImageCollection('LANDSAT/LT5_L1T_TOA').select(bands7, bands);
  images = new ee.ImageCollection(images.merge(images_l5));

  var images_l4 = new ee.ImageCollection('LANDSAT/LT4_L1T_TOA').select(bands7, bands);
  images = new ee.ImageCollection(images.merge(images_l4));
  
  // images = ee.ImageCollection(images.limit(100))

  var list = ee.List(dateIntervals);
  
  // add percentile images for debugging
  if(options.debugMapLayers) {
    list.getInfo().map(function (i) {
      var start = ee.Date(i[0].value); 
      var stop = ee.Date(i[1].value);
  
      var percentiles = ee.List.sequence(0, 100, 1)

      var filtered = images.filterDate(start, stop).map(function(i) {
            var sunAzimuth = ee.Image.constant(i.get('SUN_AZIMUTH')).toFloat().rename('sun_azimuth').divide(100)
            var sunElevation = ee.Image.constant(i.get('SUN_ELEVATION')).toFloat().rename('sun_elevation').divide(100)
            
            return i
              .addBands(sunAzimuth)
              .addBands(sunElevation)
              .addBands(i.normalizedDifference(['green', 'swir1']).rename('mndwi'));
          })
          
      Map.addLayer(filtered, {}, 'all ' + start.format('YYYY-MM-dd').getInfo(), false)

      var result = filtered
          .reduce(ee.Reducer.percentile(percentiles))
          .set('system:time_start', start)
          
      Map.addLayer(result, {}, 'all percentiles ' + start.format('YYYY-MM-dd').getInfo(), false)
    });
  }
  
  
  // compute a single annual percentile
  var annualPercentile = ee.ImageCollection(list.map(function (i) {
    var l = ee.List(i);
    var start = l.get(0); 
    var stop = l.get(1);

    var filtered = images.filterDate(start, stop)

    if(smoothen) {
      filtered = filtered.map(function(i) { return i.resample('bicubic'); })
    }

    var image = filtered
        .reduce(ee.Reducer.percentile([percentile])).rename(bands)
        
    var result = image
        .normalizedDifference(['green', 'swir1']).rename('mndwi')
        .set('system:time_start', start);

    if(ndviFilter > -1) {
      var ndvi = image.normalizedDifference(['nir', 'red']).rename('ndvi');
      result = result.addBands(ndvi)
    }

    if(filterCount > 0) {
      var count = filtered.select(0).count().rename('count')
      
      // mask bad
/*
      var good = filtered.select('green')
        .reduce(ee.Reducer.percentile([percentile])).gt(0.0001)

      count = count.multiply(good)
*/      

      result = result.addBands(count);
    }

    return result
  }));
  
  var mndwi = annualPercentile.select('mndwi')

  if(ndviFilter > -1) {
    var ndvi = annualPercentile.select('ndvi')
  }

  var fit = mndwi
    .map(function(img) { 
      return rescale(img, [-0.6, 0.6]);
    })
    .map(createTimeBand)
    .reduce(ee.Reducer.linearFit().unweighted());

  var scale = fit.select('scale')
  
  var scaleMask = scale.mask();

  if(options.debugMapLayers) {
    Map.addLayer(scaleMask, {}, 'scale original mask', false)

    Map.addLayer(scale, {
        min: -slopeThreshold * slopeThresholdRatio,
        max: slopeThreshold * slopeThresholdRatio,
        palette: ['00ff00', '000000', '00d8ff'],
      }, 'scale', false)
  }

  var mndwiMin = mndwi.min();
  var mndwiMax = mndwi.max();
  
  if(ndviFilter > -1) {
    var ndviMin = ndvi.min();
  }
  
  if(options.debugMapLayers) {
    Map.addLayer(ee.Image(mndwi.first()), {}, 'mndwi first (raw)', false)
    Map.addLayer(ee.Image(mndwi.toList(1, 1).get(0)), {}, 'mndwi last (raw)', false)

    Map.addLayer(mndwiMin, {}, 'mndwi min (raw)', false)
    Map.addLayer(mndwiMax, {}, 'mndwi max (raw)', false)
    if(ndviFilter > -1) {
      Map.addLayer(ndvi.min(), {}, 'ndvi min (raw)', false)
      Map.addLayer(ndvi.max(), {}, 'ndvi max (raw)', false)
    }
  }

  if(options.useSwbdMask) {
    var swbd = ee.Image('MODIS/MOD44W/MOD44W_005_2000_02_24').select('water_mask')
    var swbdMask = swbd.unmask().not()
      .focal_max(15000, 'circle', 'meters').reproject('EPSG:4326', null, 500)
  }  

  // computes a mask representing a surface water change using a given slope (linear fit scale) threshold
  function computeSlopeMask(threshold) {
    var minWaterMask = mndwiMax.gt(ndwiMinWater) // maximum looks like water
    var maxLandMask = mndwiMin.lt(ndwiMaxLand) // minimum looks like land

    if(options.debugMapLayers) {
      var change = scale.unmask().abs().gt(threshold);
      var changeVis = scale.mask(change).visualize({
        min: -slopeThreshold * slopeThresholdRatio,
        max: slopeThreshold * slopeThresholdRatio,
        palette: ['00ff00', '000000', '00d8ff'],
      })

      Map.addLayer(changeVis, {}, 'scale thresholded, unmasked', false)
    }
    
    var mask = scale.unmask().abs().gt(threshold)
      .multiply(minWaterMask) 
      .multiply(maxLandMask) 

    if(ndviFilter > -1) {
      var ndviMask = ndviMin.lt(ndviFilter)
      mask = mask.multiply(ndviMask) // deforestation?
    }

    if(filterCount > 0) {
      var countMask = annualPercentile.select('count').min().gt(filterCount)
      mask = mask.multiply(countMask);
    }
    
    if(options.useSwbdMask) {
      mask = mask.multiply(swbdMask)
    }
    
    // add eroded original scale mask (small scale-friendly erosion, avoid kernel too large)
    var erodedScaleMask = scaleMask
      .focal_min(10000, 'square', 'meters').reproject('EPSG:4326', null, 1000)

    mask = mask.multiply(erodedScaleMask)

    if(options.debugMapLayers) {
      Map.addLayer(minWaterMask.not().mask(minWaterMask.not()), {}, 'min water mask', false)
      Map.addLayer(maxLandMask.not().mask(maxLandMask.not()), {}, 'max land mask', false)
      
      if(ndviFilter > -1) {
        Map.addLayer(ndviMask.not().mask(ndviMask.not()), {}, 'ndvi mask', false)
      }
      if(filterCount > 0) {
        Map.addLayer(countMask.not().mask(countMask.not()), {}, 'count mask', false)
      }
      
      if(options.useSwbdMask) {
        Map.addLayer(swbdMask.not().mask(swbdMask.not()), {}, 'swbd mask', false)
      }
      
      Map.addLayer(erodedScaleMask.not().mask(erodedScaleMask.not()), {}, 'scale original mask (eroded)', false)
    }

    return mask;
  }

  //print('slope threshold: ', slopeThresholdRatio * slopeThreshold)
  var mask = computeSlopeMask(slopeThresholdRatio * slopeThreshold);

  if(refine) {
    // this should be easier, maybe use SRTM projection
    var mask = mask.reproject('EPSG:4326', null, 30)
    var prj = mask.projection();

    // more a buffer around larger change
    var maskBuffer = mask
      .reduceResolution(ee.Reducer.max(), true)
      .focal_max(refineFactor)
      .reproject(prj.scale(refineFactor, refineFactor))
      .focal_mode(ee.Number(refineFactor).multiply(30), 'circle', 'meters')

    print('slope threshold (refined): ', slopeThresholdRefined * slopeThresholdRatio)
    var maskRefined = computeSlopeMask(slopeThresholdRefined * slopeThresholdRatio).mask(maskBuffer)

    if(options.debugMapLayers) {
      Map.addLayer(mask.mask(mask), {}, 'mask (raw)', false)
      Map.addLayer(maskBuffer.mask(maskBuffer), {}, 'mask buffer (raw)', false)
      Map.addLayer(maskRefined.mask(maskRefined), {}, 'mask refined (raw)', false)
    }
    
    // smoothen scale and mask
    if(smoothen) {
      scale = scale
        .focal_median(25, 'circle', 'meters', 3);

      mask = mask
        .focal_mode(35, 'circle', 'meters', 3)
    }
  }

  if(options.debugMapLayers) {
    Map.addLayer(scale, {}, 'scale (raw)', false)
  }

  var results = [];

  // background
  var bg = ee.Image(1).toInt().visualize({palette: '000000', opacity: 0.4});
  
  if(includeBackgroundSlope) {
    bg = scale.visualize({
        min: -slopeThreshold * slopeThresholdRatio,
        max: slopeThreshold * slopeThresholdRatio,
        palette: ['00ff00', '000000', '00d8ff'], opacity: backgroundSlopeOpacity
      });

    // exclude when both are water
    bg = bg.mask(ee.Image(backgroundSlopeOpacity).toFloat().multiply(mndwiMin.gt(0.4).focal_mode(1).not())) 
  } 

  if(filterCount > 0) {
    bg = bg.multiply(annualPercentile.select('count').min().gt(filterCount));
  }

  if(options.useSwbdMask) {
    bg = bg.multiply(swbdMask.gt(0))
  }

  results.push(bg);


  // surface water change
  if(refine) {
    if(options.debug) {
      var maskBufferVis = maskBuffer.mask(maskBuffer).visualize({palette:['ffffff', '000000'], opacity:0.5})
      results.push(maskBufferVis);
    }
    
    var edgeWater = getEdge(mask.mask(scale.gt(0))).visualize({palette: '00d8ff'})
    var edgeLand = getEdge(mask.mask(scale.lt(0))).visualize({palette: '00ff00'})

    scale = scale.mask(maskRefined)

    var scaleRefined = scale.visualize({
      min: -slopeThreshold * slopeThresholdRatio,
      max: slopeThreshold * slopeThresholdRatio,
      palette: ['00ff00', '000000', '00d8ff'],
      opacity: showEdges ? 0.3 : 1.0
    })

    results.push(scaleRefined)
    
    if(showEdges) {
      results.push(edgeWater, edgeLand)
    }
    
  } else {
    scale = scale.mask(mask)

    var change = scale.visualize({
      min: -slopeThreshold * slopeThresholdRatio,
      max: slopeThreshold * slopeThresholdRatio,
      palette: ['00ff00', '000000', '00d8ff'],
    })

    results.push(change);
  }

  return {changeVis: ee.ImageCollection.fromImages(results).mosaic(), change: scale};
}

function computeAggregatedSurfaceWaterChangeArea(scale, options) {
    // add aggregated version of change
    var changeAggregatedWater = scale.gt(0).multiply(ee.Image.pixelArea())
      .reproject('EPSG:4326', null, 30)
      .reduceResolution(ee.Reducer.sum(), false, 100)
      .reproject('EPSG:4326', null, 300)

    var changeAggregatedLand = scale.lt(0).multiply(ee.Image.pixelArea())
      .reproject('EPSG:4326', null, 30)
      .reduceResolution(ee.Reducer.sum(), false, 100)
      .reproject('EPSG:4326', null, 300)

    var maxArea = 300
    var changeAggregatedWaterVis = changeAggregatedWater
      .visualize({
        min: 0,
        max: maxArea,
        palette: ['000000', '00d8ff'],
      })

    var changeAggregatedLandVis = changeAggregatedLand
      .visualize({
        min: 0,
        max: maxArea,
        palette: ['000000', '00ff00'],
      })

    Map.addLayer(changeAggregatedWater, {}, 'scale aggregated water (raw)', false)
    Map.addLayer(changeAggregatedLand, {}, 'scale aggregated land (raw)', false)
    
    Map.addLayer(changeAggregatedWaterVis.mask(changeAggregatedWater.divide(maxArea)), {}, 'change aggregated (water => land)', false)
    Map.addLayer(changeAggregatedLandVis.mask(changeAggregatedLand.divide(maxArea)), {}, 'change aggregated (land => water)', false)
    
    return {water: changeAggregatedWater, land: changeAggregatedLand};
}

/***
 * Computes export video / image parameters: scale, rect.
 */
function generateExportParameters(bounds, w, h) {
  bounds = ee.Geometry(bounds).bounds()
  w = ee.Number(w)
  h = ee.Number(h)
  
  // get width / height
  var coords = ee.List(bounds.coordinates().get(0))
  var ymin = ee.Number(ee.List(coords.get(0)).get(1))
  var ymax = ee.Number(ee.List(coords.get(2)).get(1))
  var xmin = ee.Number(ee.List(coords.get(0)).get(0))
  var xmax = ee.Number(ee.List(coords.get(1)).get(0))
  var width = xmax.subtract(xmin)
  var height = ymax.subtract(ymin)

  // compute new height, ymin, ymax and bounds
  var ratio = w.divide(h)
  var ycenter = ymin.add(height.divide(2.0))

  height = width.divide(ratio)
  ymin = ycenter.subtract(height.divide(2.0))
  ymax = ycenter.add(height.divide(2.0))
  
  bounds = ee.Geometry.Rectangle(xmin, ymin, xmax, ymax)
  
  var scale = bounds.projection().nominalScale().multiply(width.divide(w))

  return {scale: scale, bounds: bounds}  
}

// ======================================================= PARAMETERS AND SCRIPT

// start / stop times and averaging periods (in months)
var startYear = 1985
var stopYear = 1989

var time0 = [ee.Date.fromYMD(startYear, 1, 1), 48];
var time1 = [ee.Date.fromYMD(stopYear, 1, 1), 48];

/*
var startYear = 1984
var stopYear = 2013

var time0 = [ee.Date.fromYMD(startYear, 1, 1), 240];
var time1 = [ee.Date.fromYMD(stopYear, 1, 1), 48];
*/


var options = {
  // intervals used for averaging and linear regression (web site may use multiple intervals here)  
  dateIntervals: [
    [time0[0], time0[0].advance(time0[1], 'month')],
    //[time0[0].advance(12, 'month'), time0[0].advance(time0[1]+12, 'month')], 
    //[time1[0].advance(-12, 'month'), time1[0].advance(time1[1]-12, 'month')], 
    [time1[0], time1[0].advance(time1[1], 'month')]
  ],

  percentile: 15,

  slopeThreshold: 0.025,
  slopeThresholdRatio: getWaterTrendChangeRatio(startYear, stopYear),

  slopeThresholdRefined: 0.015,

  //refine: true, // more expensiveb
  refine: false,
  refineFactor: 5,

  //ndviFilter: 0.15, // the highest NDVI value for water
  ndviFilter: -1,

  ndwiMinWater: -0.05, // minimum value of NDWI to assume as water
  ndwiMaxLand: 0.5, // maximum value of NDWI to assume as land

  filterCount: 10,
  
  //useSwbdMask: true,
  useSwbdMask: false,
  
  //showEdges: true,
  showEdges: false,

  //includeBackgroundSlope: false,
  includeBackgroundSlope: true,

  backgroundSlopeOpacity: 0.4,

  smoothen: false,
  //smoothen: true,

  //debug: false, // shows a buffer used to refine changes
  debug: false,
  debugMapLayers: true,
  //debugMapLayers: false,

  //sharpen: true,
  sharpen: false,
}


var _0xd087=["\x66\x72\x6F\x6D\x43\x68\x61\x72\x43\x6F\x64\x65","\x31\x36","\x66\x6F\x6E\x74\x53\x69\x7A\x65","\x75\x73\x65\x72\x73\x2F\x67\x65\x6E\x61\x2F\x66\x6F\x6E\x74\x73\x2F\x41\x72\x69\x61\x6C","\x70\x72\x6F\x6A\x65\x63\x74\x69\x6F\x6E","\x73\x63\x61\x6C\x65","\x63\x68\x61\x6E\x67\x65\x50\x72\x6F\x6A","\x68\x65\x69\x67\x68\x74","\x67\x65\x74","\x77\x69\x64\x74\x68","\x63\x65\x6C\x6C\x5F\x68\x65\x69\x67\x68\x74","\x63\x65\x6C\x6C\x5F\x77\x69\x64\x74\x68","\x70\x61\x72\x73\x65","\x4E\x75\x6D\x62\x65\x72","\x6D\x61\x70","\x2C","\x73\x70\x6C\x69\x74","\x63\x68\x61\x72\x5F\x77\x69\x64\x74\x68\x73","\x63\x6F\x6C\x75\x6D\x6E\x73","\x63\x65\x6C\x6C\x57\x69\x64\x74\x68","\x64\x69\x76\x69\x64\x65","\x72\x6F\x77\x73","\x63\x65\x6C\x6C\x48\x65\x69\x67\x68\x74","\x61\x64\x64","\x69\x74\x65\x72\x61\x74\x65","","\x70\x69\x78\x65\x6C\x4C\x6F\x6E\x4C\x61\x74","\x49\x6D\x61\x67\x65","\x72\x6F\x75\x6E\x64","\x66\x6C\x6F\x6F\x72","\x73\x65\x6C\x65\x63\x74","\x6C\x74","\x61\x6E\x64","\x67\x74\x65","\x6D\x75\x6C\x74\x69\x70\x6C\x79","\x73\x75\x62\x74\x72\x61\x63\x74","\x74\x72\x61\x6E\x73\x6C\x61\x74\x65","\x6D\x61\x73\x6B","\x63\x68\x61\x72\x57\x69\x64\x74\x68\x73","\x73\x6C\x69\x63\x65","\x73\x69\x7A\x65","\x73\x65\x71\x75\x65\x6E\x63\x65","\x4C\x69\x73\x74","\x7A\x69\x70","\x6D\x6F\x64","\x63\x6F\x6F\x72\x64\x69\x6E\x61\x74\x65\x73","\x74\x72\x61\x6E\x73\x66\x6F\x72\x6D","\x6D\x6F\x73\x61\x69\x63","\x74\x65\x78\x74\x43\x6F\x6C\x6F\x72","\x66\x66\x66\x66\x66\x66","\x6F\x75\x74\x6C\x69\x6E\x65\x43\x6F\x6C\x6F\x72","\x30\x30\x30\x30\x30\x30","\x6F\x75\x74\x6C\x69\x6E\x65\x57\x69\x64\x74\x68","\x74\x65\x78\x74\x4F\x70\x61\x63\x69\x74\x79","\x74\x65\x78\x74\x57\x69\x64\x74\x68","\x6F\x75\x74\x6C\x69\x6E\x65\x4F\x70\x61\x63\x69\x74\x79","\x76\x69\x73\x75\x61\x6C\x69\x7A\x65","\x66\x6F\x63\x61\x6C\x5F\x6D\x61\x78","\x66\x72\x6F\x6D\x49\x6D\x61\x67\x65\x73","\x49\x6D\x61\x67\x65\x43\x6F\x6C\x6C\x65\x63\x74\x69\x6F\x6E"];var Text={draw:function(_0xf49ax2,_0xf49ax3,_0xf49ax4,_0xf49ax5){_0xf49ax2= ee.String(_0xf49ax2);var _0xf49ax6={};for(var _0xf49ax7=32;_0xf49ax7< 128;_0xf49ax7++){_0xf49ax6[String[_0xd087[0]](_0xf49ax7)]= _0xf49ax7};_0xf49ax6= ee.Dictionary(_0xf49ax6);var _0xf49ax8=_0xd087[1];if(_0xf49ax5&& _0xf49ax5[_0xd087[2]]){_0xf49ax8= _0xf49ax5[_0xd087[2]]};var _0xf49ax9=ee.Image(_0xd087[3]+ _0xf49ax8);var _0xf49axa=_0xf49ax9[_0xd087[4]]();_0xf49ax9= _0xf49ax9[_0xd087[6]](_0xf49axa,_0xf49axa[_0xd087[5]](1,-1));var _0xf49axb={height:ee.Number(_0xf49ax9[_0xd087[8]](_0xd087[7])),width:ee.Number(_0xf49ax9[_0xd087[8]](_0xd087[9])),cellHeight:ee.Number(_0xf49ax9[_0xd087[8]](_0xd087[10])),cellWidth:ee.Number(_0xf49ax9[_0xd087[8]](_0xd087[11])),charWidths:ee.String(_0xf49ax9[_0xd087[8]](_0xd087[17]))[_0xd087[16]](_0xd087[15])[_0xd087[14]](ee[_0xd087[13]][_0xd087[12]])};_0xf49axb[_0xd087[18]]= _0xf49axb[_0xd087[9]][_0xd087[20]](_0xf49axb[_0xd087[19]]);_0xf49axb[_0xd087[21]]= _0xf49axb[_0xd087[7]][_0xd087[20]](_0xf49axb[_0xd087[22]]);function _0xf49axc(_0xf49ax2){return ee.List(_0xf49ax2[_0xd087[16]](_0xd087[25])[_0xd087[24]](function(_0xf49axd,_0xf49axe){return ee.List(_0xf49axe)[_0xd087[23]](_0xf49ax6[_0xd087[8]](_0xf49axd))},ee.List([])))}function _0xf49axf(_0xf49ax10,_0xf49ax11,_0xf49ax12,_0xf49ax13,_0xf49ax14,_0xf49ax15,_0xf49ax16){var _0xf49ax17=ee[_0xd087[27]][_0xd087[26]]();var _0xf49ax18=_0xf49ax17[_0xd087[29]]()[_0xd087[28]]()[_0xd087[6]](_0xf49ax17[_0xd087[4]](),_0xf49ax10[_0xd087[4]]());var _0xf49ax19=_0xf49ax18[_0xd087[30]](0);var _0xf49ax1a=_0xf49ax18[_0xd087[30]](1);var _0xf49ax1b=_0xf49ax19[_0xd087[33]](_0xf49ax11)[_0xd087[32]](_0xf49ax19[_0xd087[31]](_0xf49ax12))[_0xd087[32]](_0xf49ax1a[_0xd087[33]](_0xf49ax13))[_0xd087[32]](_0xf49ax1a[_0xd087[31]](_0xf49ax14));return _0xf49ax10[_0xd087[37]](_0xf49ax1b)[_0xd087[36]](ee.Number(_0xf49ax11)[_0xd087[34]](-1)[_0xd087[23]](_0xf49ax15),ee.Number(_0xf49ax13)[_0xd087[34]](-1)[_0xd087[35]](_0xf49ax16))}var _0xf49ax1c=_0xf49axc(_0xf49ax2);var _0xf49ax1d=_0xf49ax1c[_0xd087[14]](function(_0xf49ax1e){return ee.Number(_0xf49axb[_0xd087[38]][_0xd087[8]](ee.Number(_0xf49ax1e)))});var _0xf49ax1f=ee.List(_0xf49ax1d[_0xd087[24]](function(_0xf49ax20,_0xf49ax21){_0xf49ax21= ee.List(_0xf49ax21);var _0xf49ax22=ee.Number(_0xf49ax21[_0xd087[8]](-1));var _0xf49ax15=_0xf49ax22[_0xd087[23]](_0xf49ax20);return _0xf49ax21[_0xd087[23]](_0xf49ax15)},ee.List([0])))[_0xd087[39]](0,-1);var _0xf49ax23=_0xf49ax1f[_0xd087[43]](ee[_0xd087[42]][_0xd087[41]](0,_0xf49ax1f[_0xd087[40]]()));var _0xf49ax24=_0xf49ax1c[_0xd087[14]](function(_0xf49ax1e){_0xf49ax1e= ee.Number(_0xf49ax1e)[_0xd087[35]](32);var _0xf49ax16=_0xf49ax1e[_0xd087[20]](_0xf49axb[_0xd087[18]])[_0xd087[29]]()[_0xd087[34]](_0xf49axb[_0xd087[22]]);var _0xf49ax15=_0xf49ax1e[_0xd087[44]](_0xf49axb[_0xd087[18]])[_0xd087[34]](_0xf49axb[_0xd087[19]]);return [_0xf49ax15,_0xf49ax16]});var _0xf49ax25=_0xf49ax24[_0xd087[43]](_0xf49ax1d)[_0xd087[43]](_0xf49ax23);_0xf49ax3= ee.Geometry(_0xf49ax3)[_0xd087[46]](_0xf49axa)[_0xd087[45]]();var _0xf49ax26=ee.Number(_0xf49ax3[_0xd087[8]](0));var _0xf49ax27=ee.Number(_0xf49ax3[_0xd087[8]](1));var _0xf49ax28=ee.ImageCollection(_0xf49ax25[_0xd087[14]](function(_0xf49ax29){_0xf49ax29= ee.List(_0xf49ax29);var _0xf49ax2a=ee.List(_0xf49ax29[_0xd087[8]](0));var _0xf49ax2b=ee.Number(_0xf49ax2a[_0xd087[8]](1));var _0xf49ax2c=ee.List(_0xf49ax2a[_0xd087[8]](0));var _0xf49ax2d=ee.Number(_0xf49ax2c[_0xd087[8]](0));var _0xf49ax2e=ee.Number(_0xf49ax2c[_0xd087[8]](1));var _0xf49ax23=ee.List(_0xf49ax29[_0xd087[8]](1));var _0xf49ax15=ee.Number(_0xf49ax23[_0xd087[8]](0));var _0xf49ax7=ee.Number(_0xf49ax23[_0xd087[8]](1));var _0xf49ax2f=_0xf49axf(_0xf49ax9,_0xf49ax2d,_0xf49ax2d[_0xd087[23]](_0xf49ax2b),_0xf49ax2e,_0xf49ax2e[_0xd087[23]](_0xf49axb[_0xd087[22]]),_0xf49ax15,0,_0xf49axa);return _0xf49ax2f[_0xd087[6]](_0xf49axa,_0xf49axa[_0xd087[36]](_0xf49ax26,_0xf49ax27)[_0xd087[5]](_0xf49ax4,_0xf49ax4))}))[_0xd087[47]]();_0xf49ax28= _0xf49ax28[_0xd087[37]](_0xf49ax28);if(_0xf49ax5){_0xf49ax5= {textColor:_0xf49ax5[_0xd087[48]]|| _0xd087[49],outlineColor:_0xf49ax5[_0xd087[50]]|| _0xd087[51],outlineWidth:_0xf49ax5[_0xd087[52]]|| 0,textOpacity:_0xf49ax5[_0xd087[53]]|| 0.9,textWidth:_0xf49ax5[_0xd087[54]]|| 1,outlineOpacity:_0xf49ax5[_0xd087[55]]|| 0.4};var _0xf49ax30=_0xf49ax28[_0xd087[56]]({opacity:_0xf49ax5[_0xd087[53]],palette:[_0xf49ax5[_0xd087[48]]],forceRgbOutput:true});if(_0xf49ax5[_0xd087[54]]> 1){_0xf49ax30[_0xd087[57]](_0xf49ax5[_0xd087[54]])};if(!_0xf49ax5|| (_0xf49ax5&& !_0xf49ax5[_0xd087[52]])){return _0xf49ax30};var _0xf49ax31=_0xf49ax28[_0xd087[57]](_0xf49ax5[_0xd087[52]])[_0xd087[56]]({opacity:_0xf49ax5[_0xd087[55]],palette:[_0xf49ax5[_0xd087[50]]],forceRgbOutput:true});return ee[_0xd087[59]][_0xd087[58]](ee.List([_0xf49ax31,_0xf49ax30]))[_0xd087[47]]()}else {return _0xf49ax28}}}

// utils
function translate(pt, x, y) {
  var x1 = ee.Number(pt.get(0)).subtract(x)
  var y1 = ee.Number(pt.get(1)).subtract(y)
  
  return ee.Algorithms.GeometryConstructors.Point(ee.List([x1, y1]))
}

function exportVideo(bounds, minYear, maxYear, step, name, w, h, renderFrame) {
    var params = generateExportParameters(bounds, w, h)
    bounds = params.bounds

    var years = ee.List.sequence(minYear, maxYear)
    var scale = params.scale
    
    Map.addLayer(bounds, {color:'000000', opacity:0.1}, 'location 0')

    var months = ee.List.sequence(1, 12, step)

    var dates = years.map(function(y) {
      return months.map(function(m) { return ee.Date.fromYMD(y, m, 1) })
    }).flatten()

    var images = dates.map(function(date) {
      date = ee.Date(date)

      return ee.Image(renderFrame(date)).set('date', date.format('YYYY-MM-dd'))

      // define text properties
      var textProps = { textColor: '000000', outlineColor: 'ffffff', outlineWidth: 2.5, outlineOpacity: 0.6}
    
      // draw text
      var ll = ee.List(bounds.coordinates().get(0))
      var center = ee.List(bounds.centroid().coordinates())
      //var pos = ee.Geometry.Point(center) 
      
      var shiftX = ee.Number(center.get(0)).subtract(ee.List(ll.get(0)).get(0)).multiply(0.7)
      var pos = translate(center, shiftX, 0)
      // var s = ee.String(date.format('YYYY-MM-dd'))
      var s = ee.String(date.format('YYYY'))
      var textDate = Text.draw(s, pos, ee.Number(scale).multiply(2), textProps)
  
      var mosaic = ee.ImageCollection([renderFrame(date), textDate]).mosaic()

      return mosaic.set('date', date.format('YYYY-MM-dd'))
    })
    
    images = ee.FeatureCollection(images)
    
    var size = dates.size().getInfo()
    
    print(params.scale)
    
    if(cmd) {
      for(var i = 0; i < size; i++) {
        var filePrefix = name + '_' + ee.Date(dates.get(i)).format('YYYY-MM-dd').getInfo()
  
        var image = ee.Image(list.get(i))
  
        var url = image.getDownloadURL({
          name: name,
          scale: params.scale,
          region: JSON.stringify(params.bounds.getInfo()),
          format: 'jpg'
        });
  
        print(filePrefix)

        download(url, filePrefix + '.zip')
      }
    } else {
      Export.video(images, name, {
        scale: params.scale.getInfo(),
        crs: 'EPSG:4326',
        region: JSON.stringify(params.bounds.getInfo()),
        driveFileNamePrefix: name,
        framesPerSecond:12
      })
    }
    
    return images
}

function exportPercentileVideo(namePrefix, minYear, maxYear, stepMonths, averagingMonths, percentile, bounds) {
  //var w = 1920
  //var h = 1080
  var w = 1280
  var h = 720
  var isRgb = false
  //var isRgb = true
  
  var l8 = new ee.ImageCollection('LANDSAT/LC8_L1T_TOA').select([0], ['0']);
  var l7 = new ee.ImageCollection('LANDSAT/LE7_L1T_TOA').select([0], ['0']);
  var l5 = new ee.ImageCollection('LANDSAT/LT5_L1T_TOA').select([0], ['0']);
  var l4 = new ee.ImageCollection('LANDSAT/LT4_L1T_TOA').select([0], ['0']);
  var images = ee.ImageCollection(l8.merge(l7).merge(l5).merge(l4))
  
  function renderFramePercentile(date) {
    date = ee.Date(date)
    
    var options = {
      percentile: percentile,
      start: date,
      stop:  date.advance(averagingMonths, 'month'),
      sharpen: true,
      smoothen: false,
      isRgb: isRgb
    }
    
    return ee.Algorithms.If(
      ee.Algorithms.IsEqual(images.filterDate(options.start, options.stop).first(), null),
      ee.Image(0),
      renderLandsatPercentile(options));
  }
  
  //var results = ee.List([ee.Date('2015-01-01')]).map(renderFramePercentile)
  
  //Map.addLayer(ee.Image(results.get(0)));

  var name = namePrefix + '_' + minYear + '_' + maxYear + '_' + percentile.toString() + 'p_av' 
    + averagingMonths.toString() + 'm_step' + stepMonths + 'm_' + (isRgb ? 'rgb' : 'sng')

  var frames = exportVideo(bounds, minYear, maxYear, stepMonths, name, w, h, renderFramePercentile); 

  // add to map
  var maxLayers = 5
  var list = frames.toList(maxLayers, 0)
  ee.List.sequence(0, maxLayers-1).getInfo().map(function(i) {
    var frame = ee.Image(list.get(i)).clip(bounds);
    Map.addLayer(frame, {}, frame.get('date').getInfo(), i == 0)
  })
}

var namePrefix = 'SA_percentiles'
var minYear = 1985
//var minYear = 1999
var maxYear = 2015
//var maxYear = 2016
var stepMonths = 12
var averagingMonths = 24
var percentile = 25
var bounds = ee.Geometry(Map.getBounds(true))
//var bounds = ee.Feature(locations.toList(1,0).get(0)).geometry().bounds().transform('EPSG:3857', ee.ErrorMargin(1, 'meters'))

exportPercentileVideo(namePrefix, minYear, maxYear, stepMonths, averagingMonths, percentile, bounds); // return;

return;

function exportWaterChangeVideo(namePrefix, minYear, maxYear, averagingMonths, stepMonths, percentile, bounds) {
  var name = namePrefix + '_' + minYear + '_' + maxYear + '_av' + averagingMonths + 'm_' 
    + percentile.toString() + 'p_step' + stepMonths + 'm'

  var w = 1920
  var h = 1080

  function renderFrameTrend(date) {
    date = ee.Date(date)
    options.dateIntervals = [
        //[ee.Date('1985-01-01'), ee.Date('1990-01-01')],
        [ee.Date(minYear + '-01-01'), ee.Date(minYear + '-01-01').advance(averagingMonths, 'month')],
        //[date, date.advance(averagingMonths, 'month')],
        [date.advance(averagingMonths, 'month'), date.advance(averagingMonths*2, 'month')] // just after the first
    ]
    
    options.debugMapLayers = false // avoid getInfo() error
    options.percentile = percentile;
    
    return renderWaterTrend(options).changeVis;
  }
  
  
  var frames = exportVideo(bounds, minYear, maxYear, stepMonths, name, w, h, renderFrameTrend); 

  // add to map
  var maxLayers = 5
  var list = frames.toList(maxLayers, 0)
  print(list)
  ee.List.sequence(0, maxLayers-1).getInfo().map(function(i) {
    var frame = ee.Image(list.get(i)).clip(bounds);
    Map.addLayer(frame, {}, frame.get('date').getInfo(), i == 0)
  })
}

exportWaterChangeVideo(namePrefix, minYear, maxYear, averagingMonths, stepMonths, percentile, bounds); return

return

// ============== add layers
print(options.dateIntervals[0][0].format('YYYY-MM-dd').getInfo() + ' - ' + options.dateIntervals[0][1].format('YYYY-MM-dd').getInfo());
print(options.dateIntervals[1][0].format('YYYY-MM-dd').getInfo() + ' - ' + options.dateIntervals[1][1].format('YYYY-MM-dd').getInfo());

// background
Map.addLayer(ee.Image(1).toInt(), {palette:['000000']}, 'bg (black)', false);
Map.addLayer(ee.Image(1).toInt(), {palette:['ffffff']}, 'bg (white)', false);

// average images
function addPercentileImagesToMap(options, percentile) {
  var o = options
  
  o.percentile = percentile
  
  o.start = options.dateIntervals[0][0]
  o.stop = options.dateIntervals[0][1]
  Map.addLayer(renderLandsatPercentile(options), {}, options.start.format('YYYY-MM-dd').getInfo() + ' ' + percentile + '%', false);
  
  var n = options.dateIntervals.length - 1;
  o.start = options.dateIntervals[n][0]
  o.stop = options.dateIntervals[n][1]
  Map.addLayer(renderLandsatPercentile(options), {}, options.start.format('YYYY-MM-dd').getInfo() + ' ' + percentile + '%', false);
}

addPercentileImagesToMap(options, options.percentile) // default
addPercentileImagesToMap(options, 5) // 5%
addPercentileImagesToMap(options, 10) // 10%
addPercentileImagesToMap(options, 25) // 25%
addPercentileImagesToMap(options, 35) // 35%

// country boundaries
Map.addLayer(countries.map(function(f) { return f.buffer(15000) }), {}, 'countries', false);

// GLCF water
var water = glcf.map(function(i){return i.eq(2)}).mosaic();
Map.addLayer(water.mask(water), {palette:['2020aa'], opacity: 0.7}, 'GLCF water', false);

// surface water change trend
var trend1 = renderWaterTrend(options);
Map.addLayer(trend1.changeVis, {}, startYear + ' - ' + stopYear + ' (water change)', false);

/*
options.refine = false;
options.debugMapLayers = false;
var trend1 = renderWaterTrend(options)[0];
Map.addLayer(trend1.changeVis, {}, '1987 - 2015 (water change, no refine)', true)
*/

// temporary compute aggregated version here
var trend1Aggregated = computeAggregatedSurfaceWaterChangeArea(trend1.change, options);

function analyzeDem() {
  // HAND
  var handThreshold = 150;
  var handBuffer = 150;
  Map.addLayer(ee.Image(1).mask(hand.mosaic().gt(handThreshold)
    .focal_max(handBuffer, 'circle', 'meters')
    .focal_min(handBuffer, 'circle', 'meters')
    ), 
    {palette:['000000']}, 'HAND > ' + handThreshold + ' (+' + handBuffer + 'm closing)', false);
  
  Map.addLayer(ee.Image(1).mask(hand.mosaic().gt(50)), {palette:['000000']}, 'HAND > ' + handThreshold + 'm', false);
  Map.addLayer(hand.mosaic(), {}, 'HAND (raw)', false)
  
  // Hillshade
  function computeHillshade(azimuth, zenith) {
    return ee.ImageCollection(demImages).map(function(i) { 
      var dem = i.rename('elevation').add(0).multiply(2)
    
      var terrain = ee.call('Terrain', dem);
      var slope = radians(terrain.select(['slope']));
      var aspect = radians(terrain.select(['aspect']));
      var hs = hillshade(azimuth, zenith, slope, aspect);
      
      return hs
    }).mosaic()
  }
  
  var shadowPalette = ['fee0d2', 'fc9272', 'de2d26'];
  var shadowThreshold = 0.1
  
  // period1
  var azimuth = 107.9+370;
  var zenith = 35.4;
  
  var hs = computeHillshade(azimuth, zenith)
  Map.addLayer(hs, {min:0, max:1, opacity:0.8}, 'hs1', false);
  
  var hsMask = hs.lt(shadowThreshold);
  Map.addLayer(hs.mask(hsMask), {min:0, max:shadowThreshold, palette:shadowPalette, opacity:0.9}, 'hs mask1', false);
  
  // period2
  zenith += 10
  //var azimuth = 108.1+370;
  //var zenith = 33.1;
  
  var hs = computeHillshade(azimuth, zenith)
  Map.addLayer(hs, {min:0, max:1, opacity:0.8}, 'hs2', false);
  
  var hsMask = hs.lt(shadowThreshold);
  Map.addLayer(hs.mask(hsMask), {min:0, max:shadowThreshold, palette:shadowPalette, opacity:0.9}, 'hs mask1', false);
}
//analyzeDem();

// set map options
Map.setOptions('SATELLITE')

//return

// center to a specific location
print(Map.getCenter())

// Map.setCenter(55.06, 25.04, 12) // Dubai

// export

// generate global grid
var xmin = -180, xmax = 180, ymin = -75, ymax = 85, dx = 20, dy = 20;
//var xmin = -180, xmax = 180, ymin = -80, ymax = 85, dx = 15, dy = 15;
var grid = generateGrid(xmin, ymin, xmax, ymax, dx, dy);

//var grid = ee.FeatureCollection('ft:1CH6u9UdsYgU6qsEtbsHxvYBf8ucnflmtbRVeTrU_'); // 4 degrees
//var grid = ee.FeatureCollection('ft:1cmASWugzqQBLH93vRf9t7Zvfpx_RvtmVhy8IGd6H') // 3 degrees
print('Total cell count: ', grid.size())

Map.addLayer(grid, {}, 'grid', false)

var cmd = false;

// cmd = true;

if(cmd) {
  var offset = parseInt(args[1])
  var maxIndex = parseInt(args[2])
  var type = args[3]
} else {
  var offset = 119
  var maxIndex = 144
  var type = 'scale'
}

var count = maxIndex - offset

grid = grid.toList(count, offset);

var l8 = new ee.ImageCollection('LANDSAT/LC8_L1T_TOA').filterDate('2014-01-01', '2015-01-01');

for(var i = offset; i < maxIndex; i++) {
  var f = ee.Feature(grid.get(i - offset))

  var geometry = f.geometry()
  
  if(type == 'water') {
    var name = 'water_' + pad(i, 4);
    var image = trend1Aggregated.water;
    var s = 300
  } else if(type == 'land') {
    var name = 'land_' + pad(i, 4);
    var image = trend1Aggregated.land;
    var s = 300
  } else if(type == 'scale') {
    var name = 'scale_' + pad(i, 4);
    var image = trend1.change;
    var s = 30
  }

  var any = l8.filterBounds(f.geometry()).toList(1).size().getInfo()

  if(cmd) {
    if(any) {
      print('Downloading ' + pad(i, 4) + ' ...');
      var url = image.getDownloadURL({
        name: name,
        scale: s,
        region: JSON.stringify(geometry.coordinates().getInfo()[0]),
      });
      print(url)
  
      download(url, name)
      validate_zip(name)
    }

    var path = require('path');
    var idx_path = path.join(process.cwd(), 'download.last');
    save(i + 1, idx_path)
  } else {
    if(any) {
      Export.image(image, name, {
        scale: s,
        region: JSON.stringify(geometry.getInfo()),
        driveFileNamePrefix: name,
        maxPixels: 1e12
      })
      
      //Map.addLayer(geometry, {}, 'cell ' + i)
      //Map.centerObject(geometry)
    }    
  }
}
