/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var geometry = /* color: #d63000 */ee.Geometry.LineString(
        [[-118.74366760253906, 34.508254118465544],
         [-118.76289367675781, 34.45731417753458]]),
    dem = ee.Image("USGS/NED");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
function getEdge(mask) {
    var canny = ee.Algorithms.CannyEdgeDetector(mask, 0.99, 0);
    return canny.mask(canny);
}

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

var debug = false

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
        var σ = ee.Number(ee.Dictionary(edgeGradient.reduceRegion(ee.Reducer.stdDev(), bounds, scale)).values().get(0));
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
                print('Sigma: ', σ);
                //Map.addLayer(edgeGradient.updateMask(significantEdgesMask), {min:0, max:mode.add(σ.multiply(2)), palette:['ffffff', 'ff0000']}, 'edge gradient, upper percentiles', false)
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

//Map.addLayer(dem)
         
var bounds = geometry.bounds()

// var columns = 60
// var rows = 6

var columns = 100
var rows = 10

var w = 2100
var h = 5600


function addCloudScore(i) {
  return ee.Algorithms.Landsat.simpleCloudScore(i)
}

var bands = ['swir1', 'nir', 'green', 'cloud']

var l8 = new ee.ImageCollection('LANDSAT/LC8_L1T_TOA').map(addCloudScore).select(['B6', 'B5', 'B3', 'cloud'], bands);
var l7 = new ee.ImageCollection('LANDSAT/LE7_L1T_TOA').map(addCloudScore).select(['B5', 'B4', 'B2', 'cloud'], bands);
var l5 = new ee.ImageCollection('LANDSAT/LT5_L1T_TOA').map(addCloudScore).select(['B5', 'B4', 'B2', 'cloud'], bands);
var l4 = new ee.ImageCollection('LANDSAT/LT4_L1T_TOA').map(addCloudScore).select(['B5', 'B4', 'B2', 'cloud'], bands);

// var images = ee.ImageCollection(l4.merge(l5).merge(l7).merge(l8))
var images = ee.ImageCollection(l4.merge(l5).merge(l8))
  .filterBounds(bounds.centroid(1));
  
var count = ee.Number(columns * rows).min(images.size())

// define offset list
var pos = ee.List.sequence(0, count.subtract(1))
var offsetsX = pos.map(function(i) { return ee.Number(i).mod(columns) })
var offsetsY = pos.map(function(i) { return ee.Number(i).divide(columns).floor() })
var offsets = offsetsX.zip(offsetsY)

// generate image collection gallery
var gallery = function(images, sortProperty, waterOtsu) {
  var imagesSorted = images
  
  // add cloud over area
  images = images.map(function(i) {
    var cloudScore = ee.Dictionary(i.select('cloud').reduceRegion(ee.Reducer.median(), bounds, 300)).values().get(0)
    return i.set('CLOUD_COVER_AOI', cloudScore)
  })

  if(sortProperty) {
    imagesSorted = images
      .sort(sortProperty)
      .limit(count) 
      .sort(sortProperty) // avoid GEE bug, call limit/sort twice
      .limit(count)
  } else {
    imagesSorted = images
      .limit(count)
  }

  var propId = 'system:id'
  
  var ids = ee.List(imagesSorted.aggregate_array(propId))
  var offsetByImage = ee.Dictionary.fromLists(ids, offsets)
  
  var wgs84 = ee.Projection('EPSG:4326')
  
  var boundsImage = ee.Image().toInt().paint(bounds, 1)
    .reproject(ee.Image(imagesSorted.first()).projection())
  
  var mosaic = imagesSorted
    .map(function(i) {
    var offset = ee.List(offsetByImage.get(i.get(propId)))
    var xoff = ee.Number(w).multiply(offset.get(0))
    var yoff = ee.Number(h).multiply(offset.get(1))
  
    i = i
      .mask(boundsImage)
      
    var waterScore = i.normalizedDifference(['green', 'swir1']).updateMask(dem.lt(343))
    
    var th = 0
    if(waterOtsu) {
      th = computeThresholdUsingOtsu(waterScore, 30, bounds, 0.3, 1, false, false, -0.1);
    }
    
    var waterMask = waterScore.gt(th)
    var waterEdge = getEdge(waterMask)
    
    return ee.ImageCollection.fromImages([
        i.visualize({min:0.04, max:0.4}),
        waterEdge.mask(waterEdge).visualize({palette:['ffffff'], forceRgbOutput: true})
      ]).mosaic().translate(xoff, yoff, 'meters', wgs84)
    
  }).mosaic()
  
  return mosaic;
}

Map.addLayer(gallery(images, 'system:start_time'), {}, 'sorted by time')
Map.addLayer(gallery(images, 'CLOUD_COVER_AOI'), {}, 'sorted by cloud cover', false)
Map.addLayer(gallery(images, 'CLOUD_COVER_AOI', true), {}, 'sorted by cloud cover (Otsu)', false)

Map.addLayer(bounds, {}, 'reservoir bounds')
