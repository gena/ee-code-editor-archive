/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var geometry = /* color: #d63000 */ee.Geometry.Point([67.03033447265625, 41.21482073580286]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
/***
 * Surface water change detection (copied from http://aqua-monitor.appspot.com)
 * 
 * Citation: Donchyts, Gennadii, et al. "Earth's surface water change over the past 30 years." Nature Climate Change 6.9 (2016): 810-813.
 *
 * License: GPL
 * 
 */

var hand = ee.ImageCollection("users/gena/global-hand/hand-100"),
    countries = ee.FeatureCollection("ft:1tdSwUL7MVpOauSgRzqVTOwdfy17KDbw-1d9omPw"),
    glcf = ee.ImageCollection("GLCF/GLS_WATER");

function renderLandsatMosaic(options, dateIntervalIndex) {
  var percentile = options.percentile;
  var start = options.dateIntervals[dateIntervalIndex][0];
  var stop = options.dateIntervals[dateIntervalIndex][1];
  var sharpen = options.sharpen;
  var smoothen = options.smoothen;
  var filterCount = options.filterCount;
  
  var bands = ['swir1', 'nir', 'green'];
  var l8 = new ee.ImageCollection('LANDSAT/LC8_L1T_TOA').filterDate(start, stop).select(['B6', 'B5', 'B3'], bands);
  var l7 = new ee.ImageCollection('LANDSAT/LE7_L1T_TOA').filterDate(start, stop).select(['B5', 'B4', 'B2'], bands);
  var l5 = new ee.ImageCollection('LANDSAT/LT5_L1T_TOA').filterDate(start, stop).select(['B5', 'B4', 'B2'], bands);
  var l4 = new ee.ImageCollection('LANDSAT/LT4_L1T_TOA').filterDate(start, stop).select(['B5', 'B4', 'B2'], bands);

  var images = ee.ImageCollection(l8.merge(l7).merge(l5).merge(l4))
  
  //images = ee.ImageCollection(images.limit(100))
  
  //var images = ee.ImageCollection(l7.merge(l5).merge(l4))

  if(smoothen) {
    images = images.map(function(i) { return i.resample('bicubic'); })
  }

  var image = images
    //.filterMetadata('SUN_AZIMUTH', 'greater_than', 5) // almost empty
    .reduce(ee.Reducer.percentile([percentile]))
    .rename(bands)

  if(filterCount > 0) {
    image = image.mask(images.select(0).count().gt(filterCount));
  }
  
  if(options.showCount) {
    Map.addLayer(images.select(0).count(), {min:filterCount, max:200, palette:['ff0000', '00ff00']}, 'count', false)
  }

  if(sharpen) {
    // LoG
    image = image.subtract(image.convolve(ee.Kernel.gaussian(30, 20, 'meters')).convolve(ee.Kernel.laplacian8(0.4)))
  }

  return image.visualize({min: 0.05, max: [0.5, 0.5, 0.6], gamma: 1.4})
}

// A helper to apply an expression and linearly rescale the output.
var rescale = function (img, thresholds) {
  return img.subtract(thresholds[0]).divide(ee.Number(thresholds[1]).subtract(thresholds[0]))
  .copyProperties(img)
  .copyProperties(img, ['system:time_start']);
};

function pad(n, width, z) {
  z = z || '0';
  n = n + '';
  return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}

var generateGrid = function(xmin, ymin, xmax, ymax, dx, dy) {
  var xx = ee.List.sequence(xmin, ee.Number(xmax).subtract(dx), dx);
  var yy = ee.List.sequence(ymin, ee.Number(ymax).subtract(dx), dy);
  var polys = xx.map(function(x) {
    return yy.map(function(y) {
      var x1 = ee.Number(x)
      var x2 = ee.Number(x).add(dx)
      var y1 = ee.Number(y)
      var y2 = ee.Number(y).add(dy)
      
      var coords = ee.List([x1, y1, x2, y2]);

      return ee.Feature(ee.Algorithms.GeometryConstructors.Rectangle(coords));
    })
  }).flatten()

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

  //var bands = ['green', 'swir1'];
  //var bands8 = ['B3', 'B6'];
  //var bands7 = ['B2', 'B5'];

  var bands = ['green', 'nir'];
  var bands8 = ['B3', 'B5'];
  var bands7 = ['B2', 'B4'];

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
  
      var filtered = images.filterDate(start, stop)
  
      var percentiles = ee.List.sequence(0, 100, 1)
  
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
        .normalizedDifference(['green', 'nir']).rename('water')
        .set('system:time_start', start);

    if(ndviFilter > -1) {
      var ndvi = image.normalizedDifference(['nir', 'red']).rename('ndvi');
      result = result.addBands(ndvi)
    }

    if(filterCount > 0) {
        result = result.addBands(filtered.select(0).count().rename('count'));
    }

    return result
  }));
  
  var mndwi = annualPercentile.select('water')

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
      .focal_max(10000, 'square', 'meters').reproject('EPSG:4326', null, 1000)
  }  

  // computes a mask representing a surface water change using a given slope (linear fit scale) threshold
  function computeSlopeMask(threshold) {
    var minWaterMask = mndwiMax.gt(ndwiMinWater) // maximum looks like water
    var maxLandMask = mndwiMin.lt(ndwiMaxLand) // minimum looks like land
    
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

  //print('slope threshold: ', ee.Number(slopeThresholdRatio).multiply(slopeThreshold))
  var mask = computeSlopeMask(ee.Number(slopeThresholdRatio).multiply(slopeThreshold));

  if(refine) {
    // this should be easier, maybe use SRTM projection
    mask = mask.reproject('EPSG:4326', null, 30)
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

  return {changeVis: ee.ImageCollection.fromImages(results).mosaic(), change: scale.toFloat()};
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
    
    return {water: changeAggregatedWater.toFloat(), land: changeAggregatedLand.toFloat()};
}

function getWaterTrendChangeRatio(start, stop) {
  return (ee.Number(15).divide(ee.Number(stop).subtract(start)));  // empiricaly found ratio
}

// ======================================================= PARAMETERS AND SCRIPT

// start / stop times and averaging periods (in months)
var time0 = [ee.Date.fromYMD(2013, 1, 1), 12];
var time1 = [ee.Date.fromYMD(2014, 1, 1), 12];

// larger periods, more robust, slower, may contain less changes (used to compute results reported in the paper)
// var time0 = [ee.Date.fromYMD(1984, 1, 1), 240];
// var time1 = [ee.Date.fromYMD(2013, 1, 1), 48];

var options = {
  // intervals used for averaging and linear regression (the web site may use multiple intervals here)  
  dateIntervals: [
    [time0[0], time0[0].advance(time0[1], 'month')],
    //[time0[0].advance(12, 'month'), time0[0].advance(time0[1]+12, 'month')], 
    //[time1[0].advance(-12, 'month'), time1[0].advance(time1[1]-12, 'month')], 
    [time1[0], time1[0].advance(time1[1], 'month')]
  ],

  percentile: 15,

  slopeThreshold: 0.015,
  slopeThresholdRatio: getWaterTrendChangeRatio(2013, 2014),

  slopeThresholdRefined: 0.015,

  //refine: true, // more expensive
  refine: false,
  refineFactor: 5,

  //ndviFilter: 0.08, // the highest NDVI value for water
  ndviFilter: -1,

  ndwiMinWater: -0.05, // minimum value of NDWI to assume as water
  ndwiMaxLand: 0.5, // maximum value of NDWI to assume as land

  filterCount: 10,
  
  //useSwbdMask: true,
  useSwbdMask: false,
  
  //showEdges: true,
  showEdges: false,

  includeBackgroundSlope: false,
  //includeBackgroundSlope: true,

  backgroundSlopeOpacity: 0.5,

  smoothen: false,
  //smoothen: true,

  //debug: false, // shows a buffer used to refine changes
  debug: false,
  //debugMapLayers: true,
  debugMapLayers: false,

  sharpen: true,
  //sharpen: false,
};

print(options.dateIntervals[0][0].format('YYYY-MM-dd').getInfo() + ' - ' + options.dateIntervals[0][1].format('YYYY-MM-dd').getInfo());
print(options.dateIntervals[1][0].format('YYYY-MM-dd').getInfo() + ' - ' + options.dateIntervals[1][1].format('YYYY-MM-dd').getInfo());

// background
Map.addLayer(ee.Image(1).toInt(), {palette:['000000']}, 'bg (black)', false);
Map.addLayer(ee.Image(1).toInt(), {palette:['ffffff']}, 'bg (white)', false);

// average images
var timeCount = options.dateIntervals.length;
options.showCount = true
Map.addLayer(renderLandsatMosaic(options, 0), {}, options.dateIntervals[0][0].format('YYYY-MM-dd').getInfo(), true);
Map.addLayer(renderLandsatMosaic(options, timeCount - 1), {}, options.dateIntervals[timeCount - 1][0].format('YYYY-MM-dd').getInfo(), true);
options.showCount = false

// country boundaries
Map.addLayer(countries.map(function(f) { return f.buffer(15000) }), {}, 'countries', false);

// GLCF water
var water = glcf.map(function(i){return i.eq(2)}).mosaic();
Map.addLayer(water.mask(water), {palette:['2020aa'], opacity: 0.5}, 'GLCF water', false);

// export

/***
 * Draws text
 */
var _0xd087=["\x66\x72\x6F\x6D\x43\x68\x61\x72\x43\x6F\x64\x65","\x31\x36","\x66\x6F\x6E\x74\x53\x69\x7A\x65","\x75\x73\x65\x72\x73\x2F\x67\x65\x6E\x61\x2F\x66\x6F\x6E\x74\x73\x2F\x41\x72\x69\x61\x6C","\x70\x72\x6F\x6A\x65\x63\x74\x69\x6F\x6E","\x73\x63\x61\x6C\x65","\x63\x68\x61\x6E\x67\x65\x50\x72\x6F\x6A","\x68\x65\x69\x67\x68\x74","\x67\x65\x74","\x77\x69\x64\x74\x68","\x63\x65\x6C\x6C\x5F\x68\x65\x69\x67\x68\x74","\x63\x65\x6C\x6C\x5F\x77\x69\x64\x74\x68","\x70\x61\x72\x73\x65","\x4E\x75\x6D\x62\x65\x72","\x6D\x61\x70","\x2C","\x73\x70\x6C\x69\x74","\x63\x68\x61\x72\x5F\x77\x69\x64\x74\x68\x73","\x63\x6F\x6C\x75\x6D\x6E\x73","\x63\x65\x6C\x6C\x57\x69\x64\x74\x68","\x64\x69\x76\x69\x64\x65","\x72\x6F\x77\x73","\x63\x65\x6C\x6C\x48\x65\x69\x67\x68\x74","\x61\x64\x64","\x69\x74\x65\x72\x61\x74\x65","","\x70\x69\x78\x65\x6C\x4C\x6F\x6E\x4C\x61\x74","\x49\x6D\x61\x67\x65","\x72\x6F\x75\x6E\x64","\x66\x6C\x6F\x6F\x72","\x73\x65\x6C\x65\x63\x74","\x6C\x74","\x61\x6E\x64","\x67\x74\x65","\x6D\x75\x6C\x74\x69\x70\x6C\x79","\x73\x75\x62\x74\x72\x61\x63\x74","\x74\x72\x61\x6E\x73\x6C\x61\x74\x65","\x6D\x61\x73\x6B","\x63\x68\x61\x72\x57\x69\x64\x74\x68\x73","\x73\x6C\x69\x63\x65","\x73\x69\x7A\x65","\x73\x65\x71\x75\x65\x6E\x63\x65","\x4C\x69\x73\x74","\x7A\x69\x70","\x6D\x6F\x64","\x63\x6F\x6F\x72\x64\x69\x6E\x61\x74\x65\x73","\x74\x72\x61\x6E\x73\x66\x6F\x72\x6D","\x6D\x6F\x73\x61\x69\x63","\x74\x65\x78\x74\x43\x6F\x6C\x6F\x72","\x66\x66\x66\x66\x66\x66","\x6F\x75\x74\x6C\x69\x6E\x65\x43\x6F\x6C\x6F\x72","\x30\x30\x30\x30\x30\x30","\x6F\x75\x74\x6C\x69\x6E\x65\x57\x69\x64\x74\x68","\x74\x65\x78\x74\x4F\x70\x61\x63\x69\x74\x79","\x74\x65\x78\x74\x57\x69\x64\x74\x68","\x6F\x75\x74\x6C\x69\x6E\x65\x4F\x70\x61\x63\x69\x74\x79","\x76\x69\x73\x75\x61\x6C\x69\x7A\x65","\x66\x6F\x63\x61\x6C\x5F\x6D\x61\x78","\x66\x72\x6F\x6D\x49\x6D\x61\x67\x65\x73","\x49\x6D\x61\x67\x65\x43\x6F\x6C\x6C\x65\x63\x74\x69\x6F\x6E"];var Text={draw:function(_0xf49ax2,_0xf49ax3,_0xf49ax4,_0xf49ax5){_0xf49ax2= ee.String(_0xf49ax2);var _0xf49ax6={};for(var _0xf49ax7=32;_0xf49ax7< 128;_0xf49ax7++){_0xf49ax6[String[_0xd087[0]](_0xf49ax7)]= _0xf49ax7};_0xf49ax6= ee.Dictionary(_0xf49ax6);var _0xf49ax8=_0xd087[1];if(_0xf49ax5&& _0xf49ax5[_0xd087[2]]){_0xf49ax8= _0xf49ax5[_0xd087[2]]};var _0xf49ax9=ee.Image(_0xd087[3]+ _0xf49ax8);var _0xf49axa=_0xf49ax9[_0xd087[4]]();_0xf49ax9= _0xf49ax9[_0xd087[6]](_0xf49axa,_0xf49axa[_0xd087[5]](1,-1));var _0xf49axb={height:ee.Number(_0xf49ax9[_0xd087[8]](_0xd087[7])),width:ee.Number(_0xf49ax9[_0xd087[8]](_0xd087[9])),cellHeight:ee.Number(_0xf49ax9[_0xd087[8]](_0xd087[10])),cellWidth:ee.Number(_0xf49ax9[_0xd087[8]](_0xd087[11])),charWidths:ee.String(_0xf49ax9[_0xd087[8]](_0xd087[17]))[_0xd087[16]](_0xd087[15])[_0xd087[14]](ee[_0xd087[13]][_0xd087[12]])};_0xf49axb[_0xd087[18]]= _0xf49axb[_0xd087[9]][_0xd087[20]](_0xf49axb[_0xd087[19]]);_0xf49axb[_0xd087[21]]= _0xf49axb[_0xd087[7]][_0xd087[20]](_0xf49axb[_0xd087[22]]);function _0xf49axc(_0xf49ax2){return ee.List(_0xf49ax2[_0xd087[16]](_0xd087[25])[_0xd087[24]](function(_0xf49axd,_0xf49axe){return ee.List(_0xf49axe)[_0xd087[23]](_0xf49ax6[_0xd087[8]](_0xf49axd))},ee.List([])))}function _0xf49axf(_0xf49ax10,_0xf49ax11,_0xf49ax12,_0xf49ax13,_0xf49ax14,_0xf49ax15,_0xf49ax16){var _0xf49ax17=ee[_0xd087[27]][_0xd087[26]]();var _0xf49ax18=_0xf49ax17[_0xd087[29]]()[_0xd087[28]]()[_0xd087[6]](_0xf49ax17[_0xd087[4]](),_0xf49ax10[_0xd087[4]]());var _0xf49ax19=_0xf49ax18[_0xd087[30]](0);var _0xf49ax1a=_0xf49ax18[_0xd087[30]](1);var _0xf49ax1b=_0xf49ax19[_0xd087[33]](_0xf49ax11)[_0xd087[32]](_0xf49ax19[_0xd087[31]](_0xf49ax12))[_0xd087[32]](_0xf49ax1a[_0xd087[33]](_0xf49ax13))[_0xd087[32]](_0xf49ax1a[_0xd087[31]](_0xf49ax14));return _0xf49ax10[_0xd087[37]](_0xf49ax1b)[_0xd087[36]](ee.Number(_0xf49ax11)[_0xd087[34]](-1)[_0xd087[23]](_0xf49ax15),ee.Number(_0xf49ax13)[_0xd087[34]](-1)[_0xd087[35]](_0xf49ax16))}var _0xf49ax1c=_0xf49axc(_0xf49ax2);var _0xf49ax1d=_0xf49ax1c[_0xd087[14]](function(_0xf49ax1e){return ee.Number(_0xf49axb[_0xd087[38]][_0xd087[8]](ee.Number(_0xf49ax1e)))});var _0xf49ax1f=ee.List(_0xf49ax1d[_0xd087[24]](function(_0xf49ax20,_0xf49ax21){_0xf49ax21= ee.List(_0xf49ax21);var _0xf49ax22=ee.Number(_0xf49ax21[_0xd087[8]](-1));var _0xf49ax15=_0xf49ax22[_0xd087[23]](_0xf49ax20);return _0xf49ax21[_0xd087[23]](_0xf49ax15)},ee.List([0])))[_0xd087[39]](0,-1);var _0xf49ax23=_0xf49ax1f[_0xd087[43]](ee[_0xd087[42]][_0xd087[41]](0,_0xf49ax1f[_0xd087[40]]()));var _0xf49ax24=_0xf49ax1c[_0xd087[14]](function(_0xf49ax1e){_0xf49ax1e= ee.Number(_0xf49ax1e)[_0xd087[35]](32);var _0xf49ax16=_0xf49ax1e[_0xd087[20]](_0xf49axb[_0xd087[18]])[_0xd087[29]]()[_0xd087[34]](_0xf49axb[_0xd087[22]]);var _0xf49ax15=_0xf49ax1e[_0xd087[44]](_0xf49axb[_0xd087[18]])[_0xd087[34]](_0xf49axb[_0xd087[19]]);return [_0xf49ax15,_0xf49ax16]});var _0xf49ax25=_0xf49ax24[_0xd087[43]](_0xf49ax1d)[_0xd087[43]](_0xf49ax23);_0xf49ax3= ee.Geometry(_0xf49ax3)[_0xd087[46]](_0xf49axa)[_0xd087[45]]();var _0xf49ax26=ee.Number(_0xf49ax3[_0xd087[8]](0));var _0xf49ax27=ee.Number(_0xf49ax3[_0xd087[8]](1));var _0xf49ax28=ee.ImageCollection(_0xf49ax25[_0xd087[14]](function(_0xf49ax29){_0xf49ax29= ee.List(_0xf49ax29);var _0xf49ax2a=ee.List(_0xf49ax29[_0xd087[8]](0));var _0xf49ax2b=ee.Number(_0xf49ax2a[_0xd087[8]](1));var _0xf49ax2c=ee.List(_0xf49ax2a[_0xd087[8]](0));var _0xf49ax2d=ee.Number(_0xf49ax2c[_0xd087[8]](0));var _0xf49ax2e=ee.Number(_0xf49ax2c[_0xd087[8]](1));var _0xf49ax23=ee.List(_0xf49ax29[_0xd087[8]](1));var _0xf49ax15=ee.Number(_0xf49ax23[_0xd087[8]](0));var _0xf49ax7=ee.Number(_0xf49ax23[_0xd087[8]](1));var _0xf49ax2f=_0xf49axf(_0xf49ax9,_0xf49ax2d,_0xf49ax2d[_0xd087[23]](_0xf49ax2b),_0xf49ax2e,_0xf49ax2e[_0xd087[23]](_0xf49axb[_0xd087[22]]),_0xf49ax15,0,_0xf49axa);return _0xf49ax2f[_0xd087[6]](_0xf49axa,_0xf49axa[_0xd087[36]](_0xf49ax26,_0xf49ax27)[_0xd087[5]](_0xf49ax4,_0xf49ax4))}))[_0xd087[47]]();_0xf49ax28= _0xf49ax28[_0xd087[37]](_0xf49ax28);if(_0xf49ax5){_0xf49ax5= {textColor:_0xf49ax5[_0xd087[48]]|| _0xd087[49],outlineColor:_0xf49ax5[_0xd087[50]]|| _0xd087[51],outlineWidth:_0xf49ax5[_0xd087[52]]|| 0,textOpacity:_0xf49ax5[_0xd087[53]]|| 0.9,textWidth:_0xf49ax5[_0xd087[54]]|| 1,outlineOpacity:_0xf49ax5[_0xd087[55]]|| 0.4};var _0xf49ax30=_0xf49ax28[_0xd087[56]]({opacity:_0xf49ax5[_0xd087[53]],palette:[_0xf49ax5[_0xd087[48]]],forceRgbOutput:true});if(_0xf49ax5[_0xd087[54]]> 1){_0xf49ax30[_0xd087[57]](_0xf49ax5[_0xd087[54]])};if(!_0xf49ax5|| (_0xf49ax5&& !_0xf49ax5[_0xd087[52]])){return _0xf49ax30};var _0xf49ax31=_0xf49ax28[_0xd087[57]](_0xf49ax5[_0xd087[52]])[_0xd087[56]]({opacity:_0xf49ax5[_0xd087[55]],palette:[_0xf49ax5[_0xd087[50]]],forceRgbOutput:true});return ee[_0xd087[59]][_0xd087[58]](ee.List([_0xf49ax31,_0xf49ax30]))[_0xd087[47]]()}else {return _0xf49ax28}}}

var startYear = 2013
var stopYear = 2017

var start = ee.Date.fromYMD(startYear, 1, 1)
var stop = ee.Date.fromYMD(stopYear, 1, 1)

var stepMonth = 4
var totalMonth = stop.difference(start, 'month').int().getInfo()

var intervals = ee.List.sequence(0, totalMonth, stepMonth).map(function(m) {
  return [start, start.advance(m, 'month')]
})

print(intervals)

var time0 = [start, 12];
var time1 = [stop, 12];

options.dateIntervals = [
  [time0[0], time0[0].advance(time0[1], 'month')],
  [time1[0], time1[0].advance(time1[1], 'month')]
]

var textLocation = geometry // ee.Geometry(Map.getCenter(true))
var scale = Map.getScale()

// prepare images to export
var percentileFrames = intervals.map(function(i) {
  var t = ee.Date(ee.List(i).get(1))
  
  options.dateIntervals = [
    [time0[0], time0[0].advance(time0[1], 'month')],
    [t, t.advance(time0[1], 'month')]
  ]
  
  options.slopeThresholdRatio = getWaterTrendChangeRatio(time0[0].get('year'), t.get('year'))
  
  var imageTrend = renderWaterTrend(options);
  
  var imagePercentile = renderLandsatMosaic(options, 1)
  
  // add text: date
  var strStart = options.dateIntervals[0][0].format('YYYY-MM-dd')
  var strStop = options.dateIntervals[1][0].format('YYYY-MM-dd')
  var str = ee.String('Date: ').cat(strStart).cat(' ... ').cat(strStop)
  var textDate = Text.draw(str, textLocation, scale, {fontSize:16, outlineWidth: 2, outlineOpacity: 0.5})
  
  return ee.Feature(null, {
    trend: imageTrend.change,
    trendVis: imageTrend.changeVis,
    percentile: imagePercentile,
    date: textDate,
    start: strStart,
    stop: strStop
  })
})


var features = ee.FeatureCollection(percentileFrames)

// export percentiles with dates

var videoFrames = features.map(function(f) {
  var percentile = ee.Image(ee.Feature(f).get('percentile'))
  var date = ee.Image(ee.Feature(f).get('date'))
  
  return ee.ImageCollection.fromImages([percentile, date]).mosaic()
})

Map.addLayer(ee.Image(videoFrames.first()))

var bounds = Map.getBounds(true)
var name = 'Uzbekistan-' + startYear + '-' + stopYear

Export.video.toDrive({
    collection: videoFrames,
    description: name,
    dimensions: 1920,
    region: bounds,
    framesPerSecond: 2,
    crs: 'EPSG: 3857',
    maxFrames: 5000
})


// export trends
features.select(['start', 'stop']).getInfo(function(fc) {
  fc.features.map(function(f) {
    var start = f.properties.start
    var stop = f.properties.stop
    var name = 'Uzbekistan-change-' + start + '-' + stop
  
    print('Adding task: ' + name)

    var f = ee.Feature(features
      .filter(ee.Filter.and(ee.Filter.eq('start', start), ee.Filter.eq('stop', stop)))
      .first())
    
    Map.addLayer(ee.Image(f.get('percentile')), {}, name + 'percentile', false)
    
    var vis = {
      min: -options.slopeThreshold * options.slopeThresholdRatio,
      max: options.slopeThreshold * options.slopeThresholdRatio,
      palette: ['00ff00', '000000', '00d8ff']
    }

    var trend = ee.Image(f.get('trend'))
    Map.addLayer(trend, vis, name, false)
    
    Export.image(trend, name, {
      scale: 30,
      region: Map.getBounds(true),
      driveFileNamePrefix: name,
      maxPixels: 1e12
    })
  }) 
})




return

// export global images


/*
options.refine = false;
options.debugMapLayers = false;
var trend1 = renderWaterTrend(options)[0];
Map.addLayer(trend1.changeVis, {}, '1987 - 2015 (water change, no refine)', true)
*/

// temporary compute aggregated version here
var trend1Aggregated = computeAggregatedSurfaceWaterChangeArea(trend1.change, options);

// HAND
var handThreshold = 50;
var handBuffer = 150;
Map.addLayer(ee.Image(1).mask(hand.mosaic().gt(handThreshold)
  .focal_max(handBuffer, 'circle', 'meters')
  .focal_min(handBuffer, 'circle', 'meters')
  ), 
  {palette:['000000']}, 'HAND > ' + handThreshold + ' (+' + handBuffer + 'm closing)', false);

Map.addLayer(ee.Image(1).mask(hand.mosaic().gt(50)), {palette:['000000']}, 'HAND > ' + handThreshold + 'm', false);

// set map options
Map.setOptions('SATELLITE')

// center to a specific location
print(Map.getCenter())

// Map.setCenter(55.06, 25.04, 12) // Dubai

// export

return // skip 

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
  var offset = 125
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


