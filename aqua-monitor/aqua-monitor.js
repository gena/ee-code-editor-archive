/***
 * Surface water change detection (copied from http://aqua-monitor.appspot.com)
 * 
 * Suggestions from Noel:
 * 1) Map a function to update the mask of each image to be the min mask of all bands that you use (but don't include bands you don't otherwise use)
 * s
 *      masked everything using original mask eroded by 10kmre
 * 
 * 3) Make sure you're not including nighttime images; limit SUN_ELEVATION to > 0 and maybe > ~30.
 * 
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
var time0 = [ee.Date.fromYMD(1984, 1, 1), 180];
//var time0 = [ee.Date.fromYMD(1984, 1, 1), 240];
var time1 = [ee.Date.fromYMD(2013, 1, 1), 48];

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
  slopeThresholdRatio: getWaterTrendChangeRatio(1984, 2013),

  slopeThresholdRefined: 0.015,

  refine: true, // more expensive
  //refine: false,
  refineFactor: 5,

  //ndviFilter: 0.15, // the highest NDVI value for water
  ndviFilter: -1,

  ndwiMinWater: -0.05, // minimum value of NDWI to assume as water
  ndwiMaxLand: 0.5, // maximum value of NDWI to assume as land

  // filterCount: 10,
  filterCount: 0,
  
  //useSwbdMask: true,
  useSwbdMask: false,
  
  showEdges: true,
  //showEdges: false,

  includeBackgroundSlope: false,
  //includeBackgroundSlope: true,

  backgroundSlopeOpacity: 0.5,

  // mask by AND of band masks
  maskBandMasks: true,
  //maskBandMasks: false,

  //smoothen: false,
  smoothen: true,

  //debug: false,
  debug: true, // shows a buffer used to refine changes
  debugMapLayers: true,
  //debugMapLayers: false,

  sharpen: true,
  //sharpen: false,
}

print(options.dateIntervals[0][0].format('YYYY-MM-dd').getInfo() + ' - ' + options.dateIntervals[0][1].format('YYYY-MM-dd').getInfo())
print(options.dateIntervals[1][0].format('YYYY-MM-dd').getInfo() + ' - ' + options.dateIntervals[1][1].format('YYYY-MM-dd').getInfo())

// background
Map.addLayer(ee.Image(1).toInt(), {palette:['000000']}, 'bg (black)', false)
Map.addLayer(ee.Image(1).toInt(), {palette:['ffffff']}, 'bg (white)', false)

// average images
var timeCount = options.dateIntervals.length
options.start = options.dateIntervals[0][0]
options.stop = options.dateIntervals[0][1]
Map.addLayer(renderLandsatPercentile(options), {}, options.start.format('YYYY-MM-dd').getInfo(), false);

var n = options.dateIntervals.length - 1;
options.start = options.dateIntervals[n][0]
options.stop = options.dateIntervals[n][1]
Map.addLayer(renderLandsatPercentile(options), {}, options.start.format('YYYY-MM-dd').getInfo(), false);

// country boundaries
Map.addLayer(countries.map(function(f) { return f.buffer(15000) }), {}, 'countries', false)

// GLCF water
var water = glcf.map(function(i){return i.eq(2)}).mosaic()
Map.addLayer(water.mask(water), {palette:['2020aa'], opacity: 0.7}, 'GLCF water', false)

// surface water change trend
var trend1 = renderWaterTrend(options);
Map.addLayer(trend1.changeVis, {}, '1987 - 2015 (water change)', true);

/*
options.refine = false;
options.debugMapLayers = false;
var trend1 = renderWaterTrend(options);
Map.addLayer(trend1.changeVis, {}, '1987 - 2015 (water change, no refine)', true)
*/

// temporary compute aggregated version here
var trend1Aggregated = computeAggregatedSurfaceWaterChangeArea(trend1.change, options);

// HAND, slope
var handThreshold = 30;
var handClosingBuffer = 500;

var slopeThreshold = 20
var slopeClosingBuffer = 120;

Map.addLayer(ee.Image(1).mask(hand.mosaic().gt(handThreshold)
  .focal_max(handClosingBuffer, 'circle', 'meters')
  .focal_min(handClosingBuffer, 'circle', 'meters')
  //.focal_mode(handClosingBuffer, 'circle', 'meters')
  ), 
  {palette:['000000']}, 'HAND > ' + handThreshold + ' (+' + handClosingBuffer + 'm closing)', false);

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
var slopeMask = ee.Image.constant(1.0)
  .divide(
      ee.Image.constant(Math.E)
        .pow(slope.subtract(x0).multiply(-k)))
*/
var slopeMask = slope.gt(slopeThreshold)
Map.addLayer(slopeMask.mask(slopeMask), {palette:['ffffff','000000']}, 'slope > ' + slopeThreshold, false)

slopeMask = slopeMask
  .focal_max(slopeClosingBuffer, 'circle', 'meters')
  .focal_min(slopeClosingBuffer, 'circle', 'meters')
Map.addLayer(slopeMask.mask(slopeMask), {palette:['ffffff','000000']}, 'slope > ' + slopeThreshold + ' (+' + slopeClosingBuffer + 'm closing)', false)

Map.addLayer(ee.Image(1).mask(hand.mosaic().gt(50)), {palette:['000000']}, 'HAND > ' + handThreshold + 'm', false);

// set map options
Map.setOptions('SATELLITE')

// center to a specific location
print(Map.getCenter())

// Map.setCenter(55.06, 25.04, 12) // Dubai




/*

var time0 = [ee.Date.fromYMD(1985, 1, 1), 140];
var time1 = [ee.Date.fromYMD(2014, 1, 1), 24];

options.dateIntervals = [
    [time0[0], time0[0].advance(time0[1], 'month')],
    //[time0[0].advance(12, 'month'), time0[0].advance(time0[1]+12, 'month')], 
    //[time1[0].advance(-12, 'month'), time1[0].advance(time1[1]-12, 'month')], 
    [time1[0], time1[0].advance(time1[1], 'month')]
  ];
  
// surface water change trend
var trend1 = renderWaterTrend(options);
Map.addLayer(trend1, {}, '1987 (140) - 2015 (24) (water change)', true)

*/