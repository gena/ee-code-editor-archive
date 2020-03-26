/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var geometry = /* color: 98ff00 */ee.Geometry.Point([100.92041015625, 59.00662762374203]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
// A helper to apply an expression and linearly rescale the output.
var rescale = function (img, thresholds) {
    return img.subtract(thresholds[0]).divide(ee.Number(thresholds[1]).subtract(thresholds[0]))
      .set('system:time_start', img.get('system:time_start'));
};

function getEdge(i) {
  var canny = ee.Algorithms.CannyEdgeDetector(i, 0.99, 0);
  canny = canny.mask(canny)
  return canny;
}

function renderModisMosaic(percentile, start, end) {
  var bands = ['sur_refl_b01', 'sur_refl_b02']
  var mod = ee.ImageCollection("MODIS/MOD09GQ");
  var myd = ee.ImageCollection("MODIS/MYD09GQ");
  
  var images = mod.select(bands)
  //images = ee.ImageCollection(mod.merge(myd)).select(bands)

  var percentile = images
      .filterDate(start, end)
      .reduce(ee.Reducer.percentile([percentile]))
      .rename(bands);

  return percentile.select([0,1,0], ['r', 'g', 'b']).visualize({min: 0, max: 3000, gamma: 1.4})
}


function renderLandsatMosaic(percentile, start, end) {
    var bands = ['swir1', 'nir', 'green'];
    var l8 = new ee.ImageCollection('LANDSAT/LC8_L1T_TOA').filterDate(start, end).select(['B6', 'B5', 'B3'], bands);
    var l7 = new ee.ImageCollection('LANDSAT/LE7_L1T_TOA').filterDate(start, end).select(['B5', 'B4', 'B2'], bands);
    var l5 = new ee.ImageCollection('LANDSAT/LT5_L1T_TOA').filterDate(start, end).select(['B5', 'B4', 'B2'], bands);

    var images = ee.ImageCollection(l8.merge(l7).merge(l5))
    
    var count = images.select(0).count();
    Map.addLayer(count, {min:0, max:60, palette:['ff0000', '00ff00']}, 'count ' + start, false)
/*
    var minCount = 5;
    var countSmall = count.lt(minCount)
    Map.addLayer(countSmall.mask(countSmall), {palette:['ffa0a0']}, 'count < ' + minCount, false)
*/    
    var percentile = images
        .reduce(ee.Reducer.percentile([percentile]))
        .rename(bands);

    Map.addLayer(percentile, {}, start + ' raw', false)
    
    var highNir = percentile.select('nir').gt(0.13);
    Map.addLayer(highNir.mask(highNir), {}, start + ' highnir', false)

    return percentile.visualize({min: 0.05, max: [0.5, 0.5, 0.6], gamma: 1.4})
}

function renderWaterTrend(percentile, dates, advanceMonths, slopeThreshold, useModis) {
    // Add a band containing image date as years since 1991.
    function createTimeBand(img) {
        var date = ee.Date(img.get('system:time_start'));
        var year = date.get('year').subtract(1991);

        return ee.Image(year).byte()
          .addBands(img);
    }

    var bands = ['B3', 'B6'];
    var images = new ee.ImageCollection('LANDSAT/LC8_L1T_TOA').select(bands);

    var images_l7 = new ee.ImageCollection('LANDSAT/LE7_L1T_TOA').select(['B2', 'B5'], bands);
    images = new ee.ImageCollection(images.merge(images_l7));

    var images_l5 = new ee.ImageCollection('LANDSAT/LT5_L1T_TOA').select(['B2', 'B5'], bands);
    images = new ee.ImageCollection(images.merge(images_l5));

    var scale = [0, 1];
    
    if(useModis) {
      var bands = ['sur_refl_b01', 'sur_refl_b02']
      var mod = ee.ImageCollection("MODIS/MOD09GQ");
      var myd = ee.ImageCollection("MODIS/MYD09GQ");
      
      images = mod.select(bands)
      scale = [0, 10000];
      //images = ee.ImageCollection(mod.merge(myd)).select(bands)
    }

    var years = ee.List(dates);
    var annualPercentile = ee.ImageCollection(years.map(function (y) {
        var start = ee.Date(y);
        var stop = ee.Date(y).advance(advanceMonths, 'month');
        var filtered = images
            .filterDate(start, stop)
        
        var result = filtered
            .reduce(ee.Reducer.percentile([percentile])).rename(bands)
            .unitScale(scale[0], scale[1])
            .normalizedDifference(bands).rename('water')
            .set('system:time_start', start);

        //result = result.mask(filtered.select(0).count().gt(4));

        //return result.addBands(filtered.select('B6'));
        return result
    }));
    
    Map.addLayer(ee.Image(annualPercentile.first()), {}, 'percentile', false)
    
    var annualWetness = annualPercentile.map(function(i) {return i.select(0)})
    var annualSwir1 = annualPercentile.map(function(i) {return i.select(1)})
    print(annualPercentile.first())

    var fit = annualWetness
        .map(function(i) { return rescale(i, [-0.3, 0.8]) })
        .map(createTimeBand)
        .reduce(ee.Reducer.linearFit());

/*
    // swir1
    Map.addLayer(annualSwir1
        .map(createTimeBand)
        .reduce(ee.Reducer.linearFit()).select('offset'), {}, 'offset swir1');
*/

    var smoothen = false;
    // var smoothen = true;

    var scale = fit.select('scale')
    
    if(smoothen) {
      scale = scale.focal_median(25, 'circle', 'meters')
    }    

    //var srtm = ee.Image("CGIAR/SRTM90_V4");
    var srtm = ee.Image("USGS/SRTMGL1_003");
    var slope = ee.Terrain.slope(srtm);
    var slopeMask = slope.gt(25)//.focal_max(3).focal_min(3);

    Map.addLayer(slope.mask(slopeMask), {}, 'slope > 30', false)

    var mask = scale.abs().gt(slopeThreshold)
        .and(annualWetness.max().gt(-0.05)) // at least one value looks like water
        .and(annualWetness.min().lt(0.1)) // at least one value looks like ground
        //.and(slopeMask.not())
        
    // add neighbouring pixels with relaxed threshold
    
    // slow
/*
    var maskClosest1 = mask.focal_max(200, 'circle', 'meters')
    var maskClosest2 = scale.abs().mask(maskClosest1).gt(0.01).focal_max(200, 'circle', 'meters')
    var maskClosest3 = scale.abs().mask(maskClosest2).gt(0.01).and(slopeMask.not())

    Map.addLayer(maskClosest1.mask(maskClosest1), {}, 'm1', false) 
    Map.addLayer(maskClosest2.mask(maskClosest1), {}, 'm2', false)
    Map.addLayer(maskClosest3.mask(maskClosest3), {}, 'm3', false)

    Map.addLayer(scale.mask(maskClosest3), {min: -slopeThreshold*1.5, max: slopeThreshold*1.5, palette:['00ff00', '000000', '00d8ff']}, 'scale (closest)', false)
*/    
    
    // faster
    var mask = mask.reproject(srtm.projection())
    var maskClosest1 = mask
      //.focal_min(60, 'circle', 'meters')
      .reduceResolution(ee.Reducer.max(), true)
      .focal_max(3)
      .focal_min(2)
      .reproject(mask.projection().scale(8, 8))
      
    Map.addLayer(maskClosest1.mask(maskClosest1), {opacity:0.5}, 'm1_large', false)

    var scaleClosest = scale.abs().mask(maskClosest1).gt(0.015)//.and(slopeMask.not())
    Map.addLayer(scale.mask(scaleClosest), {min: -slopeThreshold*1.5, max: slopeThreshold*1.5, palette:['00ff00', '000000', '00d8ff']}, 'scale (closest, fast)', false)

    Map.addLayer(scale, {min: -slopeThreshold*1.5, max: slopeThreshold*1.5, palette:['00ff00', '000000', '00d8ff']}, 'scale (unmasked)', false)
    
    var edgeScale = ee.Algorithms.CannyEdgeDetector(scale.multiply(10), 0.2, 0.6).focal_max(0.8);
    edgeScale = edgeScale.mask(edgeScale).visualize({palette:'ff0000'})
    Map.addLayer(edgeScale, {}, 'edge scale (unmasked)', false);

    Map.addLayer(scale, {}, 'scale (raw)', false)
    Map.addLayer(annualWetness.min(), {}, 'wetness min (raw)', false)
    Map.addLayer(annualWetness.max(), {}, 'wetness max (raw)', false)

    if(smoothen) {
      var maskSmall = mask
          .focal_min(25, 'circle', 'meters').not().multiply(mask)
          .focal_median(15, 'circle', 'meters')
  
      mask = mask
          .focal_median(25, 'circle', 'meters')
  
      mask = mask.or(maskSmall)
    }

/*
    var transparentMask = ee.Image(45).subtract(mask.focal_min(45, 'circle', 'meters').distance(ee.Kernel.euclidean(45, 'meters'))).divide(45).mask(mask);
    Map.addLayer(transparentMask, {min:0, max:1}, 'distance')
    mask = transparentMask;
*/

    // var bg = ee.Image(1).toInt().visualize({palette:'000000', opacity:0.3});

    var bg = scale.visualize({
        min: -slopeThreshold ,
        max: slopeThreshold ,
        palette: ['00ff00', '000000', '00d8ff'], opacity:0.4
      });

    var change = fit.mask(mask)
    scale = scale.mask(mask)


    var change = scale.visualize({min: -slopeThreshold*1.5, max: slopeThreshold*1.5, palette:['00ff00', '000000', '00d8ff']})
    //var change = scale.visualize({min: -slopeThreshold*1.5, max: slopeThreshold*1.5, palette:['00ff00', '000000', '00d8ff'], opacity:0.4})

/*
    var edge = getEdge(mask).visualize({palette:'aaaaaa'})
*/

    var edgeBlue = getEdge(mask.mask(scale.gt(0))).visualize({palette:'00d8ff'})
    var edgeGreen = getEdge(mask.mask(scale.lt(0))).visualize({palette:'00ff00'})


    //var changeWater = scale.mask(scale.gt(slopeThreshold)).visualize({min: slopeThreshold, max: slopeThreshold*1.5, palette:['000000', '1876D0']})
    //var changeLand = scale.mask(scale.lt(slopeThreshold)).visualize({min: -slopeThreshold, max: -slopeThreshold*1.5, palette:['000000', '0CD606']})
    //return ee.ImageCollection.fromImages([bg, changeWater, changeLand]).mosaic();

    //return ee.ImageCollection.fromImages([bg, change, edgeBlue, edgeGreen]).mosaic();

    return ee.ImageCollection.fromImages([bg, change]).mosaic();
}

var p = 15;
Map.addLayer(renderLandsatMosaic(p, '2000-01-01', '2001-01-01'), {}, '2000 ' + p + '%')
Map.addLayer(renderLandsatMosaic(p, '2014-01-01', '2015-01-01'), {}, '2014 ' + p + '%')
Map.addLayer(renderModisMosaic(p, '2005-01-01', '2006-01-01'), {}, '2005-2006 MODIS ' + p + '%', false)
Map.addLayer(renderModisMosaic(p, '2015-01-01', '2016-01-01'), {}, '2015-2016 MODIS ' + p + '%', false)
Map.addLayer(renderWaterTrend(p, ['2005-01-01', '2015-01-01'], 12, 0.035, true), {}, 'water (2yrs) MODIS', false)
//Map.addLayer(renderWaterTrend(p, ['2000-01-01', '2001-01-01', '2014-01-01', '2015-01-01'], 12, 0.035), {}, 'water (4yrs)', false)
//Map.addLayer(renderWaterTrend(p, ['2000-01-01', '2014-01-01'], 12, 0.035), {}, 'water 2000, 2014', true)
Map.addLayer(renderWaterTrend(p, ['1985-01-01', '2014-01-01'], 12, 0.035), {}, 'water 1985, 2014', true)

print(Map.getCenter())
//Map.setCenter(58.01, 26.13, 13)
//Map.setCenter(96.35, 17.23, 9)