print(Map.getCenter())
//Map.setCenter(117.83, 38.97, 10)

Map.addLayer(ee.Image(1).byte(), {palette:'000000'}, 'black')

// A helper to apply an expression and linearly rescale the output.
var rescale = function (img, thresholds) {
  return img.subtract(thresholds[0]).divide(ee.Number(thresholds[1]).subtract(thresholds[0]));
};

function getEdge(i) {
  var canny = ee.Algorithms.CannyEdgeDetector(i, 0.99, 0);
  canny = canny.mask(canny)
  return canny;
}

function renderLandsatMosaic(percentile, start, end, sharpen) {
  var bands = ['swir1', 'nir', 'green'];

  var l8 = new ee.ImageCollection('LANDSAT/LC8_L1T_TOA').filterDate(start, end).select(['B6', 'B5', 'B3'], bands);
  var l7 = new ee.ImageCollection('LANDSAT/LE7_L1T_TOA').filterDate(start, end).select(['B5', 'B4', 'B2'], bands);
  var l5 = new ee.ImageCollection('LANDSAT/LT5_L1T_TOA').filterDate(start, end).select(['B5', 'B4', 'B2'], bands);
  var l4 = new ee.ImageCollection('LANDSAT/LT4_L1T_TOA').filterDate(start, end).select(['B5', 'B4', 'B2'], bands);

  var images = ee.ImageCollection(l8.merge(l7).merge(l5).merge(l4))
  //var images = ee.ImageCollection(l7.merge(l5).merge(l4))

  var image = images
    //.filterMetadata('SUN_AZIMUTH', 'greater_than', 5)
    .reduce(ee.Reducer.percentile([percentile]))
    .rename(bands)

  /*
  image = image
    .mask(image.mask().focal_min(10, 'square'))
  */

  if(filterCount > 0) {
    image = image.mask(images.select(0).count().gt(filterCount));
  }


  if(sharpen) {
    image = image.subtract(image.convolve(ee.Kernel.gaussian(30, 20, 'meters')).convolve(ee.Kernel.laplacian8(0.4)))
  }

  return image.visualize({min: 0.05, max: [0.5, 0.5, 0.6], gamma: 1.4})
}


function renderWaterTrend(percentile, datesAndPeriods, slopeThreshold, slopeThresholdSensitive, slopeThresholdRatio, sensitive) {
  // Add a band containing image date as years since 1991.
  function createTimeBand(img) {
    var date = ee.Date(img.get('system:time_start'));
    var year = date.get('year').subtract(1970);

    return ee.Image(year).byte()
       .addBands(rescale(img, [-0.6, 0.6])) // add rescaled MNDWI image
  }

  if(ndviFilter > -1) {
    var bands = ['green', 'swir1', 'red', 'nir'];
    var bands8 = ['B3', 'B6', 'B4', 'B5'];
    var bands7 = ['B2', 'B5', 'B3', 'B4'];
  } else {
    var bands = ['green', 'swir1'];
    var bands8 = ['B3', 'B6'];
    var bands7 = ['B2', 'B5'];
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

  var list = ee.List(datesAndPeriods);
  
  function getPercentile(i, showMap) {
    var l = ee.List(i);
    var year = l.get(0); 
    var months = l.get(1);
    var start = ee.Date(year);
    var stop = ee.Date(year).advance(months, 'month');

    var filtered = images
        .filterDate(start, stop)

    var image = filtered
        .reduce(ee.Reducer.percentile([percentile])).rename(bands)

    image = image.mask(
      image.select(0).mask().multiply(image.select(1).mask()).focal_min(15)
    )


    /*
    image = image
        .mask(image.mask().focal_min(10, 'square'))
    */
    
    var result = image
        .normalizedDifference(['green', 'swir1']).rename('water')
        .set('system:time_start', start);
        
    if(showMap) {
      Map.addLayer(image.select(['swir1','nir','green']), {min: 0.05, max: 0.25}, ee.String(year).getInfo() + ' (swir1 nir green)')
      Map.addLayer(image.select(['green']), {min: 0.05, max: 0.25, palette:['000000', '00ff00']}, ee.String(year).getInfo() + ' (green)', false)
      Map.addLayer(image.select(['swir1']), {min: 0.05, max: 0.25, palette:['000000', 'ffff00']}, ee.String(year).getInfo() + ' (swir1)', false)
      Map.addLayer(filtered.select(0).count(), {min: 0, max: 50}, ee.String(year).getInfo() + ' (count)', false)
      Map.addLayer(result, {min: -0.5, max: 0.5}, ee.String(year).getInfo(), false)
    }

    if(ndviFilter > -1) {
      var ndvi = image.normalizedDifference(['nir', 'red']).rename('ndvi');
      result = result.addBands(ndvi)
    }

    if(filterCount > 0) {
        result = result.addBands(filtered.select(0).count().rename('count'));
    }

    /*
    1) Map a function to update the mask of each image to be the min mask of all bands that you use
       (but don't include bands you don't otherwise use)

    2) clip to a negative buffer of 6km.

    3) Make sure you're not including nighttime images; limit SUN_ELEVATION to > 0 and maybe > ~30.
    */

    return result
  }
  
  // add maps
  //getPercentile(list.get(0), true)
  //getPercentile(list.get(1), true)

  var annualPercentile = ee.ImageCollection(list.map(function(i) { return getPercentile(i, false) } ));

  var mndwi = annualPercentile.select('water')

  if(ndviFilter > -1) {
    var ndvi = annualPercentile.select('ndvi')
  }

  var fit = mndwi
    .map(createTimeBand)
    .reduce(ee.Reducer.linearFit().unweighted());

  var scale = fit.select('scale')

  var mndwiMin = mndwi.min();
  var mndwiMax = mndwi.max();

  var mask = scale.abs().gt(slopeThresholdRatio.multiply(slopeThreshold))
    .and(mndwiMax.gt(-0.05)) // at least one value looks like water
    .and(mndwiMin.lt(0.1)) // at least one value looks like ground

  mask = mask.multiply(mndwi.map(function(i) { return i.mask(); }).sum().gt(0));

  if(filterCount > 0) {
    mask = mask
      .and(annualPercentile.select('count').min().gt(filterCount));
  }

  if(ndviFilter > -1) {
     mask = mask.and(ndvi.max().gt(ndviFilter)) // darkest is not vegetation
  }

  if (sensitive && refine) {
    var maskSensitive = null;

    mask = mask.reproject('EPSG:4326', null, 30)
    var maskProjection = mask.projection();

    // more sensitive mask around change
    maskSensitive = mask
      .reduceResolution(ee.Reducer.max(), true)
      .focal_max(6)
      .reproject(maskProjection.scale(6, 6))
      .focal_median(150, 'circle', 'meters')

    //mask = scale.abs().gt(0.008).mask(maskSensitive.reproject(maskProjection))
    mask = scale.abs().gt(slopeThresholdRatio.multiply(slopeThresholdSensitive)).mask(maskSensitive.reproject(maskProjection))
      .and(mndwiMax.gt(-0.05)) // at least one value looks like water
      .and(mndwiMin.lt(0.1)) // at least one value looks like ground

    if(ndviFilter > -1) {
     mask = mask.and(ndvi.max().gt(ndviFilter)) // darkest is not vegetation
    }

    // smoothen scale and mask
    if(smoothen === true || smoothen === 1) {
/*
      scale = scale
        .focal_median(25, 'circle', 'meters', 3)

      mask = mask
        .focal_mode(25, 'circle', 'meters', 3)
*/
      scale = scale
        .focal_median(25, 'circle', 'meters', 3);

      mask = mask
        //.focal_mode(20, 'circle', 'meters', 10)
        //.focal_mode(25, 'circle', 'meters', 3)
        .focal_mode(35, 'circle', 'meters', 3)
    }
  }

  // var bg = ee.Image(1).toInt().visualize({palette: '000000', opacity: 0.4});

  var bg = scale.visualize({
      min: slopeThresholdRatio.multiply(ee.Number(-slopeThreshold)),
      max: slopeThresholdRatio.multiply(ee.Number(slopeThreshold)),
      palette: ['00ff00', '000000', '00d8ff'], opacity: waterSlopeOpacity
    });

  if(!sensitive) {
  var swbd = ee.Image('MODIS/MOD44W/MOD44W_005_2000_02_24').select('water_mask')
    var swbdMask = swbd.unmask().not().focal_max(15).focal_median(5, 'circle', 'pixels', 3); // .add(0.2);
    bg = bg.mask(ee.Image(waterSlopeOpacity).toFloat().multiply(
      swbdMask
    ))
    // also remove large changes
    //mask = mask.multiply(swbdMask)
  } else {
    bg = bg
  	.mask(ee.Image(waterSlopeOpacity).toFloat().multiply(
            mndwiMin.gt(0.4).focal_mode(1).not() /* .add(0.2) */) // exclude when both are water
        ) 
  }

  scale = scale.mask(mask)

  // var edge = getEdge(mask).visualize({palette:'aaaaaa'})

  //var changeWater = scale.mask(scale.gt(slopeThreshold)).visualize({min: slopeThreshold, max: slopeThreshold*1.5, palette:['000000', '1876D0']})
  //var changeLand = scale.mask(scale.lt(slopeThreshold)).visualize({min: -slopeThreshold, max: -slopeThreshold*1.5, palette:['000000', '0CD606']})
  //return ee.ImageCollection.fromImages([bg, changeWater, changeLand]).mosaic();

  //return ee.ImageCollection.fromImages([bg, change, edgeBlue, edgeGreen]).mosaic();

  if(sensitive && refine) {
    /*
    var edgeScale = ee.Algorithms.CannyEdgeDetector(scale.unmask().multiply(10), 0.3, 0.5)
      //.reduceResolution(ee.Reducer.max(), true)
      //.reproject(maskProjection.scale(4, 4))
        //.mask(mask);

    var dist = edgeScale //mask
        .distance(ee.Kernel.euclidean(960, 'meters'))
        .divide(960)

    var distVis = dist
        //.reproject(maskProjection.scale(4, 4))
        .visualize({palette:['ffffff', '000000'], min:0, max:0.3, opacity:0.5})
    */

      var edgeWater= getEdge(mask.mask(scale.gt(0))).visualize({palette: '00d8ff'})
      var edgeLand = getEdge(mask.mask(scale.lt(0))).visualize({palette: '00ff00'})

      var change = scale.visualize({
        min: slopeThresholdRatio.multiply(ee.Number(-slopeThreshold)),
        max: slopeThresholdRatio.multiply(ee.Number(slopeThreshold)),
        palette: ['00ff00', '000000', '00d8ff'],
        opacity: 0.3
      })

    //var change = scale.visualize({min: -slopeThreshold*1.5, max: slopeThreshold*1.5, palette:['00ff00', '000000', '00d8ff'], opacity:0.4})

    if(debug) {
      var maskSensitiveVis = maskSensitive.mask(maskSensitive).visualize({palette:['ffffff', '000000'], opacity:0.5})
      return ee.ImageCollection.fromImages([bg, maskSensitiveVis, change, edgeWater, edgeLand]).mosaic();
    } else {
      return ee.ImageCollection.fromImages([bg, change, edgeWater, edgeLand]).mosaic();
    }

    //return ee.ImageCollection.fromImages([maskSensitiveVis, bg, change]).mosaic();
  } else {
    var change = scale.visualize({
      min: slopeThresholdRatio.multiply(ee.Number(-slopeThreshold)),
      max: slopeThresholdRatio.multiply(ee.Number(slopeThreshold)),
      palette: ['00ff00', '000000', '00d8ff'],
    })
    //var change = scale.visualize({min: -slopeThreshold*1.5, max: slopeThreshold*1.5, palette:['00ff00', '000000', '00d8ff'], opacity:0.4})

    return ee.ImageCollection.fromImages([bg, change]).mosaic();
  }
}

function getWaterTrendChangeRatio(start, stop) {
  return (ee.Number(15).divide(ee.Number(stop).subtract(ee.Number(start))));  // empiricaly found ratio
}

var ndviFilter = 0
var filterCount = 0
var waterSlopeOpacity = 0.6

var slopeThreshold = 0.03
var slopeThresholdSensitive = 0.02
var slopeThresholdRatio = getWaterTrendChangeRatio(1999, 2013)
// var sensitive = false;
var sensitive = true;
var refine = true
var smoothen = true
var debug = false

var dates = [
  ['1999-01-01', 24],
  ['2013-01-01', 24],
  ]

var trend = renderWaterTrend(25, dates, slopeThreshold, slopeThresholdSensitive, slopeThresholdRatio, sensitive);

Map.addLayer(trend, {}, 'trend')

//var years = ee.List.sequence(1985, 2011);
var years = ee.List.sequence(1989, 2013);
var images = ee.ImageCollection(years.map(function(y) {
/*  var dates = [
    [ee.String(y).slice(0, 4).cat('-01-01'), 24],
    ['2013-01-01', 24],
    ]
*/
  var dates = ee.List([
    ['1987-01-01', 24],
    [ee.String(y).slice(0, 4).cat('-01-01'), 24],
    ])
    
  slopeThresholdRatio = getWaterTrendChangeRatio(1987, y)
  
  return renderWaterTrend(25, dates, slopeThreshold, slopeThresholdSensitive, slopeThresholdRatio, sensitive)
  
/*  return ee.ImageCollection([
    renderLandsatMosaic(25, dates[0][0], dates[1][0], true),
    renderWaterTrend(25, dates, slopeThreshold, slopeThresholdSensitive, slopeThresholdRatio, sensitive)
    ]).mosaic();
*/}))

Map.addLayer(ee.Image(images.first()))

Export.video(images)

