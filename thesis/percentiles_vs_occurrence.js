/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var l8 = ee.ImageCollection("LANDSAT/LC8_L1T_TOA"),
    occurrence = ee.Image("users/gena/water-occurrence-ProsserCreek-2000-01-01_2017-04-01"),
    l5 = ee.ImageCollection("LANDSAT/LT5_L1T_TOA_FMASK"),
    jrc = ee.Image("JRC/GSW1_0/GlobalSurfaceWater"),
    l7 = ee.ImageCollection("LANDSAT/LE7_L1T_TOA"),
    dem = ee.Image("USGS/NED"),
    s2 = ee.ImageCollection("COPERNICUS/S2"),
    aster = ee.ImageCollection("ASTER/AST_L1T_003");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
// Return the DN that maximizes interclass variance in B5 (in the region).
var otsu = function otsu(histogram) {
    histogram = ee.Dictionary(histogram);

    var counts = ee.Array(histogram.get('histogram'));
    var means = ee.Array(histogram.get('bucketMeans'));
    var size = means.length().get([0]);
    var total = counts.reduce(ee.Reducer.sum(), [0]).get([0]);
    var sum = means.multiply(counts).reduce(ee.Reducer.sum(), [0]).get([0]);
    var mean = sum.divide(total);

    var indices = ee.List.sequence(1, size);

    // Compute between sum of squares, where each mean partitions the data.
    var bss = indices.map(function (i) {
        var aCounts = counts.slice(0, 0, i);
        var aCount = aCounts.reduce(ee.Reducer.sum(), [0]).get([0]);
        var aMeans = means.slice(0, 0, i);
        var aMean = aMeans.multiply(aCounts).reduce(ee.Reducer.sum(), [0]).get([0]).divide(aCount);
        var bCount = total.subtract(aCount);
        var bMean = sum.subtract(aCount.multiply(aMean)).divide(bCount);
        return aCount.multiply(aMean.subtract(mean).pow(2)).add(bCount.multiply(bMean.subtract(mean).pow(2)));
    });

    // Return the mean value corresponding to the maximum BSS.
    return means.sort(bss).get([-1]);
};


/***
 * Compute a threshold using Otsu method (bimodal)
 */
function computeThresholdUsingOtsu(image, scale, bounds, th, g, skipShort, weightGradient, minValue) {
    // clip image edges
    var mask = image.mask().gt(0).focal_min(ee.Number(scale).multiply(3), 'circle', 'meters');

    // detect sharp changes
    var edge = ee.Algorithms.CannyEdgeDetector(image, th, g);
    edge = edge.multiply(mask);

    // take the largest changes, estimate gradient around edge and use that as a weight
    if (weightGradient) {
        var gradient = image.gradient().abs();
        var edgeGradient = gradient.select(0).max(gradient.select(1)).mask(edge.gt(th)).reproject(image.projection().scale(2, 2));

        // take the upper percentiles only
        var mode = ee.Number(ee.Dictionary(edgeGradient.reduceRegion(ee.Reducer.mode(), bounds, scale)).values().get(0));
        var Ïƒ = ee.Number(ee.Dictionary(edgeGradient.reduceRegion(ee.Reducer.stdDev(), bounds, scale)).values().get(0));
        var _buckets = 50;
        var significantEdgesMask = edgeGradient.gt(mode);

        edge = edge.updateMask(significantEdgesMask);

        if (debug) {
            // gradient around edges
            if (edgeGradient) {
                print(ui.Chart.image.histogram(edgeGradient, bounds, scale, _buckets));
                Map.addLayer(edgeGradient, {}, 'edge gradient', false);
                Map.addLayer(significantEdgesMask.mask(significantEdgesMask), {}, 'significant edges', false);

                print('Mode: ', mode);
                print('Sigma: ', Ïƒ);
                //Map.addLayer(edgeGradient.updateMask(significantEdgesMask), {min:0, max:mode.add(Ïƒ.multiply(2)), palette:['ffffff', 'ff0000']}, 'edge gradient, upper percentiles', false)
            }
        }
    }

    // advanced, detect edge lengths
    var coonnectedVis = void 0;
    if (skipShort) {
        var connected = edge.mask(edge).lt(0.8).connectedPixelCount(50, true);

        var edgeLong = connected.gte(50);

        edge = edgeLong;

        coonnectedVis = connected.updateMask(edgeLong).visualize({ palette: ['ffffff', 'ff0000'], min: 0, max: 50 });
    }

    // buffer around NDWI edges
    var edgeBuffer = edge.focal_max(ee.Number(scale).multiply(1), 'square', 'meters');
    var imageEdge = image.mask(edgeBuffer);

    // compute threshold using Otsu thresholding
    var buckets = 100;
    var hist = ee.Dictionary(ee.Dictionary(imageEdge.reduceRegion(ee.Reducer.histogram(buckets), bounds, scale)).values().get(0));

    var threshold = ee.Algorithms.If(hist.contains('bucketMeans'), otsu(hist), 0.3);
    threshold = ee.Number(threshold); //.add(0.05)

    if (debug) {
        Map.addLayer(edge.mask(edge), { palette: ['ff0000'] }, 'edges', false);

        if (skipShort) {
            Map.addLayer(coonnectedVis, {}, 'edges (connected)', false);
        }

        print('Threshold: ', threshold);

        print(ui.Chart.image.histogram(image, bounds, scale, buckets));
        print(ui.Chart.image.histogram(imageEdge, bounds, scale, buckets));
        Map.addLayer(mask.mask(mask), { palette: ['000000'] }, 'image mask', false);
    }

    return minValue ? threshold.max(minValue) : threshold;
}

Map.addLayer(dem, {min:1730, max:1780}, 'dem')

var hs = ee.Algorithms.Terrain(dem).select('hillshade')
Map.addLayer(hs, {min:99, max:250, palette:['ffffff', '000000']}, 'hs')

// images

var percentiles = ee.List.sequence(1,100)

var bands = ['swir1', 'nir', 'green']
l8 = l8.select(['B6', 'B5', 'B3'], bands)
l5 = l5.select(['B5', 'B4', 'B2'], bands)
l7 = l7.select(['B5', 'B4', 'B2'], bands)

//aster = aster.select(['B4', 'B3N', 'B1'], bands)
s2 = s2.select(['B11', 'B8', 'B3'], bands).map(function(i) { return i.divide(10000) })

var start = '2000-01-01'
var stop = '2018-01-01'

var images = ee.ImageCollection(l5.merge(l7).merge(l8).merge(s2))
//var images = l8
  .filterDate(start, stop)
  .map(function(i) { return i.resample('bicubic')})


images = percentiles.map(function(p) {
  return images.reduce(ee.Reducer.percentile([p])).rename(bands)
    .set('p', p)
})

images = ee.ImageCollection(images)

var vis = {min:0.05, max:0.3}

Map.addLayer(images, {}, 'percentiles (raw)', false)

ee.List.sequence(1,70,10).getInfo(function(percentiles) {
  // add percentile images
  percentiles.map(function(p) {
    var image = images.filter(ee.Filter.eq('p', p)).first()
    image = ee.Image(image)
    Map.addLayer(image, vis, p.toString(), p === 1)
    
    var ndwi = image.normalizedDifference(['green', 'nir'])
    Map.addLayer(ndwi, {min:-0.5, max:0.5}, p.toString() + ' NDWI', false)
  })
  
  // add occurrences
  
  // JRC
  Map.addLayer(jrc.select('occurrence').divide(100), {min:0, max:1, palette:['ffffff', '0000ff']}, 'occurrence (JRC)')
  Map.addLayer(jrc.select('occurrence').resample('bicubic').divide(100), {min:0, max:1, palette:['ffffff', '0000ff']}, 'occurrence (JRC, resampled)', false)
  
  // ours, P(W|C=0), Otsu
  Map.addLayer(occurrence.mask(occurrence.gt(0.0)), {min:0, max:1, palette:['ffffff', '0000ff']}, 'occurrence')

  // ours, P(W|C=0), estimated from CDF
  var occurrenceCDF = ee.ImageCollection(ee.List.sequence(1,64).map(function(p) {
    return images
      .select(['nir', 'green'])
      .reduce(ee.Reducer.percentile([p]))
      .rename(['nir', 'green'])
      .normalizedDifference(['green', 'nir'])
      .gt(0)
  })).reduce(ee.Reducer.sum()).divide(64).unitScale(0, 1)
  
  Map.addLayer(occurrenceCDF.mask(occurrenceCDF.gt(0)), {min: 0, max:1, palette:['ffffff', '0000ff']}, 'occurrence (computed)')

  // diff
  Map.addLayer(occurrenceCDF.subtract(occurrence), {min:-0.25, max:0.25, palette:['ff0000', 'ffffff', '0000ff']}, 'diff (CDF - combined)')
  Map.addLayer(jrc.select('occurrence').divide(100).subtract(occurrence), {min:-0.25, max:0.25, palette:['ff0000', 'ffffff', '0000ff']}, 'diff (JRC - combined)')
  Map.addLayer(jrc.select('occurrence').resample('bicubic').divide(100).subtract(occurrence), {min:-0.25, max:0.25, palette:['ff0000', 'ffffff', '0000ff']}, 'diff (JRC(resampled) - combined)')
  
  function getEdge(i) {
    var edge = ee.Algorithms.CannyEdgeDetector(i, 0.99, 0)
    
    return edge.mask(edge)
  }
  
  ee.List.sequence(0,50,10).getInfo(function(percentiles) {
    percentiles.map(function(p) {
      Map.addLayer(getEdge(occurrence.gt(p * 0.01)), {palette:['ffffff']}, 'occurrence ' + p + '%', p === 5)
    })
  })
  
  
})

