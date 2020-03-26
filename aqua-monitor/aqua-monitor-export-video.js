/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var pt1 = /* color: #d63000 */ee.Geometry.Point([38.797101974487305, 13.332834518238684]),
    pt2 = /* color: #98ff00 */ee.Geometry.Point([38.796329498291016, 13.276412019361983]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
/***
 * Generates collection of images
 */
function getImages(options) {
  var smoothen = options.smoothen;
  var isRgb = options.isRgb;
  var bounds = options.bounds;
  var start = options.start;
  var stop = options.stop;

  var bands = ['red', 'green', 'blue'];
  var bandsL8 = ['B6', 'B5', 'B3']
  var bandsL7 = ['B5', 'B4', 'B2']
  var bandsS2 = ['B11', 'B8', 'B3']

  if(isRgb) {
    bands = ['swir1', 'nir', 'green'];
    bandsL8 = ['B4', 'B3', 'B2']
    bandsL7 = ['B3', 'B2', 'B1']
    bandsS2 = ['B4', 'B3', 'B2']
  }
  
  var s2 = new ee.ImageCollection('COPERNICUS/S2').filterDate(start, stop).select(bandsL8, bands)
  if(bounds) {
    s2 = s2.filterBounds(bounds)
  }
  if(smoothen) {
    s2 = s2.map(function(i) { return i.resample('bicubic') });
  }
  s2 = s2.map(function(i) { return i.multiply(0.0001) });

  var l8 = new ee.ImageCollection('LANDSAT/LC08/C01/T1_TOA').filterDate(start, stop).select(bandsL8, bands);
  var l7 = new ee.ImageCollection('LANDSAT/LE07/C01/T1_RT_TOA').filterDate(start, stop).select(bandsL7, bands);
  var l5 = new ee.ImageCollection('LANDSAT/LT05/C01/T1_TOA').filterDate(start, stop).select(bandsL7, bands);
  var l4 = new ee.ImageCollection('LANDSAT/LT04/C01/T1_TOA').filterDate(start, stop).select(bandsL7, bands);

  //var images = ee.ImageCollection(l8.merge(l7).merge(l5).merge(l4).merge(s2))
  var images = ee.ImageCollection(l8.merge(l5).merge(l4).merge(s2))
  
  if(bounds) {
    images = images.filterBounds(bounds)
  }
  
  images = images
    .map(function(i) { return i.mask(i.gt(0.0001).and(i.lt(1)))}) // filter-out crappy TOA images

  if(smoothen) {
    images = images.map(function(i) { return i.resample('bicubic'); })
  }

  return images
}

/***
 * Computes percentile composite using all images available for [options.start, options.stop] interval.
 */
function renderLandsatPercentile(options) {
  var percentile = options.percentile;
  var sharpen = options.sharpen;
  var filterCount = options.filterCount;

  var images = getImages(options)  

  var imageEnvelopes = ee.FeatureCollection(images.map(function(i) {
    return ee.Feature(null, {'SUN_AZIMUTH': i.get('SUN_AZIMUTH')})
  }))

  // print(Chart.feature.histogram(imageEnvelopes, 'SUN_AZIMUTH', 50))

  var image = images
    .map(function(i) { return i.mask(i.gt(0.0001).and(i.lt(1)))})
    //.filterMetadata('SUN_AZIMUTH', 'greater_than', 5) // almost empty
    .reduce(ee.Reducer.percentile([percentile]))
    //.rename(bands)

  if(filterCount > 0) {
    image = image.mask(images.select(0).count().gt(filterCount));
    Map.addLayer(images.select(0).count(), {min:filterCount, max:200, palette:['d7191c','fdae61','ffffbf','a6d96a','1a9641']}, 'count', false)
  }

  if(sharpen) {
    // LoG
    image = image.subtract(image.convolve(ee.Kernel.gaussian(40, 30, 'meters')).convolve(ee.Kernel.laplacian8(1)))
  }

  return {
      image: image.visualize({min: 0.05, max: [0.4, 0.4, 0.5], gamma: 1.4, forceRgbOutput: true}),
      count: images.select(0).count()
  }
}

/***
 * Utility function
 */
function pad(n, width, z) {
  z = z || '0';
  n = n + '';
  return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}

/***
 * Draws text
 */
var _0xd087=["\x66\x72\x6F\x6D\x43\x68\x61\x72\x43\x6F\x64\x65","\x31\x36","\x66\x6F\x6E\x74\x53\x69\x7A\x65","\x75\x73\x65\x72\x73\x2F\x67\x65\x6E\x61\x2F\x66\x6F\x6E\x74\x73\x2F\x41\x72\x69\x61\x6C","\x70\x72\x6F\x6A\x65\x63\x74\x69\x6F\x6E","\x73\x63\x61\x6C\x65","\x63\x68\x61\x6E\x67\x65\x50\x72\x6F\x6A","\x68\x65\x69\x67\x68\x74","\x67\x65\x74","\x77\x69\x64\x74\x68","\x63\x65\x6C\x6C\x5F\x68\x65\x69\x67\x68\x74","\x63\x65\x6C\x6C\x5F\x77\x69\x64\x74\x68","\x70\x61\x72\x73\x65","\x4E\x75\x6D\x62\x65\x72","\x6D\x61\x70","\x2C","\x73\x70\x6C\x69\x74","\x63\x68\x61\x72\x5F\x77\x69\x64\x74\x68\x73","\x63\x6F\x6C\x75\x6D\x6E\x73","\x63\x65\x6C\x6C\x57\x69\x64\x74\x68","\x64\x69\x76\x69\x64\x65","\x72\x6F\x77\x73","\x63\x65\x6C\x6C\x48\x65\x69\x67\x68\x74","\x61\x64\x64","\x69\x74\x65\x72\x61\x74\x65","","\x70\x69\x78\x65\x6C\x4C\x6F\x6E\x4C\x61\x74","\x49\x6D\x61\x67\x65","\x72\x6F\x75\x6E\x64","\x66\x6C\x6F\x6F\x72","\x73\x65\x6C\x65\x63\x74","\x6C\x74","\x61\x6E\x64","\x67\x74\x65","\x6D\x75\x6C\x74\x69\x70\x6C\x79","\x73\x75\x62\x74\x72\x61\x63\x74","\x74\x72\x61\x6E\x73\x6C\x61\x74\x65","\x6D\x61\x73\x6B","\x63\x68\x61\x72\x57\x69\x64\x74\x68\x73","\x73\x6C\x69\x63\x65","\x73\x69\x7A\x65","\x73\x65\x71\x75\x65\x6E\x63\x65","\x4C\x69\x73\x74","\x7A\x69\x70","\x6D\x6F\x64","\x63\x6F\x6F\x72\x64\x69\x6E\x61\x74\x65\x73","\x74\x72\x61\x6E\x73\x66\x6F\x72\x6D","\x6D\x6F\x73\x61\x69\x63","\x74\x65\x78\x74\x43\x6F\x6C\x6F\x72","\x66\x66\x66\x66\x66\x66","\x6F\x75\x74\x6C\x69\x6E\x65\x43\x6F\x6C\x6F\x72","\x30\x30\x30\x30\x30\x30","\x6F\x75\x74\x6C\x69\x6E\x65\x57\x69\x64\x74\x68","\x74\x65\x78\x74\x4F\x70\x61\x63\x69\x74\x79","\x74\x65\x78\x74\x57\x69\x64\x74\x68","\x6F\x75\x74\x6C\x69\x6E\x65\x4F\x70\x61\x63\x69\x74\x79","\x76\x69\x73\x75\x61\x6C\x69\x7A\x65","\x66\x6F\x63\x61\x6C\x5F\x6D\x61\x78","\x66\x72\x6F\x6D\x49\x6D\x61\x67\x65\x73","\x49\x6D\x61\x67\x65\x43\x6F\x6C\x6C\x65\x63\x74\x69\x6F\x6E"];var Text={draw:function(_0xf49ax2,_0xf49ax3,_0xf49ax4,_0xf49ax5){_0xf49ax2= ee.String(_0xf49ax2);var _0xf49ax6={};for(var _0xf49ax7=32;_0xf49ax7< 128;_0xf49ax7++){_0xf49ax6[String[_0xd087[0]](_0xf49ax7)]= _0xf49ax7};_0xf49ax6= ee.Dictionary(_0xf49ax6);var _0xf49ax8=_0xd087[1];if(_0xf49ax5&& _0xf49ax5[_0xd087[2]]){_0xf49ax8= _0xf49ax5[_0xd087[2]]};var _0xf49ax9=ee.Image(_0xd087[3]+ _0xf49ax8);var _0xf49axa=_0xf49ax9[_0xd087[4]]();_0xf49ax9= _0xf49ax9[_0xd087[6]](_0xf49axa,_0xf49axa[_0xd087[5]](1,-1));var _0xf49axb={height:ee.Number(_0xf49ax9[_0xd087[8]](_0xd087[7])),width:ee.Number(_0xf49ax9[_0xd087[8]](_0xd087[9])),cellHeight:ee.Number(_0xf49ax9[_0xd087[8]](_0xd087[10])),cellWidth:ee.Number(_0xf49ax9[_0xd087[8]](_0xd087[11])),charWidths:ee.String(_0xf49ax9[_0xd087[8]](_0xd087[17]))[_0xd087[16]](_0xd087[15])[_0xd087[14]](ee[_0xd087[13]][_0xd087[12]])};_0xf49axb[_0xd087[18]]= _0xf49axb[_0xd087[9]][_0xd087[20]](_0xf49axb[_0xd087[19]]);_0xf49axb[_0xd087[21]]= _0xf49axb[_0xd087[7]][_0xd087[20]](_0xf49axb[_0xd087[22]]);function _0xf49axc(_0xf49ax2){return ee.List(_0xf49ax2[_0xd087[16]](_0xd087[25])[_0xd087[24]](function(_0xf49axd,_0xf49axe){return ee.List(_0xf49axe)[_0xd087[23]](_0xf49ax6[_0xd087[8]](_0xf49axd))},ee.List([])))}function _0xf49axf(_0xf49ax10,_0xf49ax11,_0xf49ax12,_0xf49ax13,_0xf49ax14,_0xf49ax15,_0xf49ax16){var _0xf49ax17=ee[_0xd087[27]][_0xd087[26]]();var _0xf49ax18=_0xf49ax17[_0xd087[29]]()[_0xd087[28]]()[_0xd087[6]](_0xf49ax17[_0xd087[4]](),_0xf49ax10[_0xd087[4]]());var _0xf49ax19=_0xf49ax18[_0xd087[30]](0);var _0xf49ax1a=_0xf49ax18[_0xd087[30]](1);var _0xf49ax1b=_0xf49ax19[_0xd087[33]](_0xf49ax11)[_0xd087[32]](_0xf49ax19[_0xd087[31]](_0xf49ax12))[_0xd087[32]](_0xf49ax1a[_0xd087[33]](_0xf49ax13))[_0xd087[32]](_0xf49ax1a[_0xd087[31]](_0xf49ax14));return _0xf49ax10[_0xd087[37]](_0xf49ax1b)[_0xd087[36]](ee.Number(_0xf49ax11)[_0xd087[34]](-1)[_0xd087[23]](_0xf49ax15),ee.Number(_0xf49ax13)[_0xd087[34]](-1)[_0xd087[35]](_0xf49ax16))}var _0xf49ax1c=_0xf49axc(_0xf49ax2);var _0xf49ax1d=_0xf49ax1c[_0xd087[14]](function(_0xf49ax1e){return ee.Number(_0xf49axb[_0xd087[38]][_0xd087[8]](ee.Number(_0xf49ax1e)))});var _0xf49ax1f=ee.List(_0xf49ax1d[_0xd087[24]](function(_0xf49ax20,_0xf49ax21){_0xf49ax21= ee.List(_0xf49ax21);var _0xf49ax22=ee.Number(_0xf49ax21[_0xd087[8]](-1));var _0xf49ax15=_0xf49ax22[_0xd087[23]](_0xf49ax20);return _0xf49ax21[_0xd087[23]](_0xf49ax15)},ee.List([0])))[_0xd087[39]](0,-1);var _0xf49ax23=_0xf49ax1f[_0xd087[43]](ee[_0xd087[42]][_0xd087[41]](0,_0xf49ax1f[_0xd087[40]]()));var _0xf49ax24=_0xf49ax1c[_0xd087[14]](function(_0xf49ax1e){_0xf49ax1e= ee.Number(_0xf49ax1e)[_0xd087[35]](32);var _0xf49ax16=_0xf49ax1e[_0xd087[20]](_0xf49axb[_0xd087[18]])[_0xd087[29]]()[_0xd087[34]](_0xf49axb[_0xd087[22]]);var _0xf49ax15=_0xf49ax1e[_0xd087[44]](_0xf49axb[_0xd087[18]])[_0xd087[34]](_0xf49axb[_0xd087[19]]);return [_0xf49ax15,_0xf49ax16]});var _0xf49ax25=_0xf49ax24[_0xd087[43]](_0xf49ax1d)[_0xd087[43]](_0xf49ax23);_0xf49ax3= ee.Geometry(_0xf49ax3)[_0xd087[46]](_0xf49axa)[_0xd087[45]]();var _0xf49ax26=ee.Number(_0xf49ax3[_0xd087[8]](0));var _0xf49ax27=ee.Number(_0xf49ax3[_0xd087[8]](1));var _0xf49ax28=ee.ImageCollection(_0xf49ax25[_0xd087[14]](function(_0xf49ax29){_0xf49ax29= ee.List(_0xf49ax29);var _0xf49ax2a=ee.List(_0xf49ax29[_0xd087[8]](0));var _0xf49ax2b=ee.Number(_0xf49ax2a[_0xd087[8]](1));var _0xf49ax2c=ee.List(_0xf49ax2a[_0xd087[8]](0));var _0xf49ax2d=ee.Number(_0xf49ax2c[_0xd087[8]](0));var _0xf49ax2e=ee.Number(_0xf49ax2c[_0xd087[8]](1));var _0xf49ax23=ee.List(_0xf49ax29[_0xd087[8]](1));var _0xf49ax15=ee.Number(_0xf49ax23[_0xd087[8]](0));var _0xf49ax7=ee.Number(_0xf49ax23[_0xd087[8]](1));var _0xf49ax2f=_0xf49axf(_0xf49ax9,_0xf49ax2d,_0xf49ax2d[_0xd087[23]](_0xf49ax2b),_0xf49ax2e,_0xf49ax2e[_0xd087[23]](_0xf49axb[_0xd087[22]]),_0xf49ax15,0,_0xf49axa);return _0xf49ax2f[_0xd087[6]](_0xf49axa,_0xf49axa[_0xd087[36]](_0xf49ax26,_0xf49ax27)[_0xd087[5]](_0xf49ax4,_0xf49ax4))}))[_0xd087[47]]();_0xf49ax28= _0xf49ax28[_0xd087[37]](_0xf49ax28);if(_0xf49ax5){_0xf49ax5= {textColor:_0xf49ax5[_0xd087[48]]|| _0xd087[49],outlineColor:_0xf49ax5[_0xd087[50]]|| _0xd087[51],outlineWidth:_0xf49ax5[_0xd087[52]]|| 0,textOpacity:_0xf49ax5[_0xd087[53]]|| 0.9,textWidth:_0xf49ax5[_0xd087[54]]|| 1,outlineOpacity:_0xf49ax5[_0xd087[55]]|| 0.4};var _0xf49ax30=_0xf49ax28[_0xd087[56]]({opacity:_0xf49ax5[_0xd087[53]],palette:[_0xf49ax5[_0xd087[48]]],forceRgbOutput:true});if(_0xf49ax5[_0xd087[54]]> 1){_0xf49ax30[_0xd087[57]](_0xf49ax5[_0xd087[54]])};if(!_0xf49ax5|| (_0xf49ax5&& !_0xf49ax5[_0xd087[52]])){return _0xf49ax30};var _0xf49ax31=_0xf49ax28[_0xd087[57]](_0xf49ax5[_0xd087[52]])[_0xd087[56]]({opacity:_0xf49ax5[_0xd087[55]],palette:[_0xf49ax5[_0xd087[50]]],forceRgbOutput:true});return ee[_0xd087[59]][_0xd087[58]](ee.List([_0xf49ax31,_0xf49ax30]))[_0xd087[47]]()}else {return _0xf49ax28}}}

/***
 * Translates point
 */
function translate(pt, x, y) {
  var x1 = ee.Number(pt.get(0)).subtract(x)
  var y1 = ee.Number(pt.get(1)).subtract(y)
  
  return ee.Algorithms.GeometryConstructors.Point(ee.List([x1, y1]))
}

/***
 * Generates edge around given mask image
 */
function getEdge(i) {
  var canny = ee.Algorithms.CannyEdgeDetector(i, 0.99, 0);
  canny = canny.mask(canny)
  return canny;
}

/***
 * Adds time band, used for linear regression
 */
function createTimeBand(img) {
  var date = ee.Date(img.get('system:time_start'));
  var year = date.get('year').subtract(1970);
  return ee.Image(year).byte().addBands(img)
}

/***
 * A helper to apply an expression and linearly rescale the output.
 */
var rescale = function (img, thresholds) {
  return img.subtract(thresholds[0]).divide(ee.Number(thresholds[1]).subtract(thresholds[0]))
  .copyProperties(img)
  .copyProperties(img, ['system:time_start']);
};

/***
 * Coefficient for trend.
 */
function getWaterTrendChangeRatio(start, stop) {
  return ee.Number(15).divide(ee.Number(stop).subtract(start));  // empiricaly found ratio
}

/***
 * Computes surface water change layer. TODO: split it into smaller functions
 */
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
  var mask = computeSlopeMask(ee.Number(slopeThresholdRatio).multiply(slopeThreshold));

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

    var th = ee.Number(slopeThresholdRefined).multiply(slopeThresholdRatio)
    var maskRefined = computeSlopeMask(th).mask(maskBuffer)

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
        min: ee.Number(slopeThreshold).multiply(-1).multiply(slopeThresholdRatio),
        max: ee.Number(slopeThreshold).multiply(slopeThresholdRatio),
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
      min: ee.Number(slopeThreshold).multiply(-1).multiply(slopeThresholdRatio),
      max: ee.Number(slopeThreshold).multiply(slopeThresholdRatio),
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
      min: ee.Number(slopeThreshold).multiply(-1).multiply(slopeThresholdRatio),
      max: ee.Number(slopeThreshold).multiply(slopeThresholdRatio),
      palette: ['00ff00', '000000', '00d8ff'],
    })

    results.push(change);
  }

  return {changeVis: ee.ImageCollection.fromImages(results).mosaic(), change: scale};
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

// static parameters for algorithm
var options = {
  percentile: 20,

  slopeThreshold: 0.025,

  slopeThresholdRefined: 0.01,

  refine: true, // more expensive
  //refine: false,
  refineFactor: 5,

  //ndviFilter: 0.15, // the highest NDVI value for water
  ndviFilter: -1,

  ndwiMinWater: -0.05, // minimum value of NDWI to assume as water
  ndwiMaxLand: 0.5, // maximum value of NDWI to assume as land

  //filterCount: 10,
  filterCount: 0,
  
  //useSwbdMask: true,
  useSwbdMask: false,
  
  showEdges: true,
  //showEdges: false,

  includeBackgroundSlope: false,
  //includeBackgroundSlope: true,

  backgroundSlopeOpacity: 0.3,

  //smoothen: false,
  smoothen: true,

  //debug: false, // shows a buffer used to refine changes
  debug: false,
  
  //debugMapLayers: true,
  debugMapLayers: false,

  //sharpen: true,
  sharpen: false,
  
  bounds: ee.Geometry(Map.getBounds(true))//.centroid(1)
}

var w = 1920
var h = 1080
var params = generateExportParameters(options.bounds, w, h)
var bounds = params.bounds

var startYear = 2005
var startIntervalLength = 24
var stopYear = 2017
var stopIntervalLength = 24

var stepMonths = 4

options.isRgb = false
//options.isRgb = true

var includeChange = false
//var includeChange = true

// compute dates
var years = ee.List.sequence(startYear, stopYear)
var months = ee.List.sequence(1, 12, stepMonths)

var dates = years.map(function(y) {
  return months.map(function(m) { return ee.Date.fromYMD(y, m, 1) })
}).flatten()

var scale = Map.getScale() * 2.0 

/***
 * Render percentiles, optionally with a trend of surface water changes.
 */
function renderPercentilesTemporal() {
  function render(d) {
    options.start = ee.Date(d)
    options.stop = ee.Date(d).advance(startIntervalLength, 'month')
  
    // render percentile image for current date
    var percentile = renderLandsatPercentile(options)
    
    // add text: date
    var strStart = options.start.format('YYYY-MM-dd')
    var strStop = options.stop.format('YYYY-MM-dd')
    var str = ee.String('Date: ').cat(strStart).cat(' ... ').cat(strStop)
    var textDate = Text.draw(str, pt1, scale, {fontSize:16})
  
    // add text: number of images used
    var imageCount = ee.Dictionary(percentile.count.reduceRegion(ee.Reducer.first(), pt1, 30)).values()
    var imageCount = ee.Algorithms.If(ee.Algorithms.IsEqual(imageCount.length(), 0), 0, imageCount.get(0))
    var str = ee.String('Count: ').cat(imageCount)
    var textCount = Text.draw(str, pt2, scale, {fontSize:16})
  
    // render trend of surface water changes
    var t1 = ee.Date.fromYMD(startYear, 1, 1)
    var t2 = t1.advance(startIntervalLength, 'month')
    options.dateIntervals = [
      [t1, t2],
      [options.start, options.stop]
    ];
  
    options.slopeThresholdRatio = getWaterTrendChangeRatio(startYear, ee.Number(options.start.get('year')).add(1))
  
    var trend = renderWaterTrend(options)
    
    if(includeChange) {
      var images = [percentile.image, trend.changeVis, textDate, textCount]
    } else {
      var images = [percentile.image, textDate, textCount]
    }
    
    return ee.ImageCollection.fromImages(images)
      .mosaic().set('name', strStart.cat(' ... ').cat(strStop))  
  }
  
  print(dates)
  
  return dates.map(render);
}

/***
 * Render percentiles for a single period (firstYear + intervalMonth).
 */
function renderPercentilesSingle() {
  options.start = ee.Date.fromYMD(startYear, 1, 1)
  options.stop = options.start.advance(startIntervalLength, 'month')
  
  var percentiles = ee.List.sequence(0, 100, 1)

  function render(p) {
    options.percentile = p;
    
    // render percentile image for current date
    var percentile = renderLandsatPercentile(options)
    
    // add text: date
    var strStart = options.start.format('YYYY-MM-dd')
    var strStop = options.stop.format('YYYY-MM-dd')
    var str = ee.String('Date: ').cat(strStart).cat(' ... ').cat(strStop)
    var textDate = Text.draw(str, pt1, scale, {fontSize:16})
  
    // add text: number of
    var imageCount = ee.Dictionary(percentile.count.reduceRegion(ee.Reducer.first(), pt1, 30)).values()
    var imageCount = ee.Algorithms.If(ee.Algorithms.IsEqual(imageCount.length(), 0), 0, imageCount.get(0))
    var str = ee.String('Count: ').cat(imageCount).cat(', Percentile: ').cat(p)
    var textCount = Text.draw(str, pt2, scale, {fontSize:16})
  
    // render trend of surface water changes
    var t1 = ee.Date.fromYMD(startYear, 1, 1)
    var t2 = t1.advance(startIntervalLength, 'month')
    options.dateIntervals = [
      [t1, t2],
      [options.start, options.stop]
    ];
  
    var images = [percentile.image, textDate, textCount]

    return ee.ImageCollection.fromImages(images)
      .mosaic().set('name', strStart.cat(' ').cat(p).cat('%'))  
  }
  
  return percentiles.map(render);
}

/***
 * Render the actual images.
 */
function renderActual() {
  options.start = ee.Date.fromYMD(startYear, 1, 1)
  options.stop = ee.Date.fromYMD(stopYear, 1, 1)
  
  var videoFrames = getImages(options)
    .sort('system:time_start')
    .map(function(i) {
      var image = i.visualize({min: 0.05, max: [0.4, 0.4, 0.5], gamma: 1.4, forceRgbOutput: true})
      
      var strDate = ee.Date(i.get('system:time_start')).format('YYYY-MM-dd')
      var str = ee.String('Date: ').cat(strDate)
      var textDate = Text.draw(str, pt1, scale, {fontSize:16})
      
      return ee.ImageCollection.fromImages([
          image,
          textDate
      ]).mosaic().set('name', strDate)
    });
    
  return videoFrames;    
}

//var videoFrames = renderActual()
var videoFrames = renderPercentilesTemporal();
//var videoFrames = renderPercentilesSingle();

videoFrames = ee.ImageCollection(videoFrames)

var name = 'Sudan'

Export.video.toDrive({
    collection: videoFrames,
    description: 'surface-water-changes-' + name,
    dimensions: 1920,
    region: bounds,
    framesPerSecond: 5,
    crs: 'EPSG: 4326',
    maxFrames: 5000
})


// add a few layers to map
var count = 5
var list = videoFrames.toList(count, 0);
for(var i = 0; i < count; i++) {
  var image = ee.Image(list.get(i))

  var name = image.get('name').getInfo()

  Map.addLayer(image, {}, name, i === 0);
}
  
