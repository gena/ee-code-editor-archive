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
    glcf = ee.ImageCollection("GLCF/GLS_WATER"),
    geometry = /* color: d63000 */ee.Geometry.MultiPoint();

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
  
  Map.addLayer(images.select(0).count(), {min:filterCount, max:200, palette:['ff0000', '00ff00']}, 'count', false)

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
        .normalizedDifference(['green', 'swir1']).rename('water')
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

  print('slope threshold: ', slopeThresholdRatio * slopeThreshold)
  var mask = computeSlopeMask(slopeThresholdRatio * slopeThreshold);

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
  return (15 / (stop - start));  // empiricaly found ratio
}

// ======================================================= PARAMETERS AND SCRIPT

// start / stop times and averaging periods (in months)
var time0 = [ee.Date.fromYMD(2000, 1, 1), 24];
var time1 = [ee.Date.fromYMD(2015, 1, 1), 24];

// larger periods, more robust, slower, may contain less changes (used to compute results reported in the paper)
// var time0 = [ee.Date.fromYMD(1984, 1, 1), 240];
// var time1 = [ee.Date.fromYMD(2013, 1, 1), 48];

var options = {
  // intervals used for averaging and linear regression (the web site may use multiple intervals here)  
  dateIntervals: [
    [time0[0], time0[0].advance(time0[1], 'month')],
    //[time0[0].advance(12, 'month'), time0[0].advance(time0[1]+12, 'month')], 
    //[time1[0].advance(-12, 'month'), time1[0].advance(time1[1]-12, 'month')], 
    [time1[0], ee.Date.fromYMD(2016, 5, 6)] // time1[0].advance(time1[1], 'month')
  ],

  percentile: 15,

  slopeThreshold: 0.025,
  slopeThresholdRatio: getWaterTrendChangeRatio(1984, 2015),

  slopeThresholdRefined: 0.015,

  //refine: true, // more expensive
  refine: false,
  refineFactor: 5,

  ndviFilter: 0.08, // the highest NDVI value for water
  //ndviFilter: -1,

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
Map.addLayer(renderLandsatMosaic(options, 0), {}, options.dateIntervals[0][0].format('YYYY-MM-dd').getInfo(), true);
Map.addLayer(renderLandsatMosaic(options, timeCount - 1), {}, options.dateIntervals[timeCount - 1][0].format('YYYY-MM-dd').getInfo(), true);

// country boundaries
Map.addLayer(countries.map(function(f) { return f.buffer(15000) }), {}, 'countries', false);

// GLCF water
var water = glcf.map(function(i){return i.eq(2)}).mosaic();
Map.addLayer(water.mask(water), {palette:['2020aa'], opacity: 0.5}, 'GLCF water', false);

// surface water change trend
var trend1 = renderWaterTrend(options);
Map.addLayer(trend1.changeVis, {}, '1987 - 2015 (water change)', true);

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


