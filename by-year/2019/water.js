/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var s2 = ee.ImageCollection("COPERNICUS/S2"),
    l8 = ee.ImageCollection("LANDSAT/LC08/C01/T1_RT_TOA"),
    coastline = ee.FeatureCollection("users/gena/eo-bathymetry/osm-coastline"),
    boundsGallery = /* color: #98ff00 */ee.Geometry.MultiPoint(),
    jrc = ee.Image("JRC/GSW1_0/GlobalSurfaceWater"),
    l8_toa = ee.ImageCollection("LANDSAT/LC8_L1T_TOA");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
l8 = l8_toa

function app() {
  var bounds = ee.Geometry(Map.getBounds(true))

  var bandNames = ['swir', 'nir', 'green', 'red', 'blue']
  s2 = s2.filterBounds(bounds).select(['B11', 'B8', 'B3', 'B4','B2'], bandNames).map(function(i) { return i.divide(10000).copyProperties(i, ['system:time_start']) })
  l8 = l8.filterBounds(bounds).select(['B6', 'B5', 'B3', 'B3', 'B2'], bandNames) // start from S2
  
  var images = ee.ImageCollection(s2.merge(l8))
    .map(function(i) { return i.float() }) // strange non-homonegeous collection error
    
  //images = images.filterDate('2015-06-01', '2016-06-01')    

  var waterOccurrenceMax = 0.5
    
  var images = s2

  var waterBands = ['green', 'nir']
  var waterOccurrenceMax = 0.45
  
  //var waterBands = ['green', 'swir']
  //var waterOccurrenceMax = 0.8


  //var images = l8
  
  print('Image count: ', images.size())

  Map.addLayer(images, {}, 'raw', false)

  var waterScore = images.map(function(i) {
    return i
      .resample('bicubic')
      .normalizedDifference(waterBands)
      .add(0.05)
      .rename('water_score')
      .set('system:time_start', i.get('system:time_start'))
  })
  

  var waterOccurrence = waterScore.select('water_score')
    .mean()

  var Palettes = {
      water: ['f7fbff', 'deebf7', 'c6dbef', '9ecae1', '6baed6', '4292c6', '2171b5', '08519c', '08306b']
  };
  
  Map.addLayer(jrc.select('occurrence'), {min: 0, max: 100, palette: Palettes.water }, 'water occurrence (JRC)', false);
  Map.addLayer(waterOccurrence
      //.mask(
      //waterOccurrence.gt(0.0)
      //.focal_max(60, 'circle', 'meters')
      //)
      , 
    {min: -0.1, max: waterOccurrenceMax, palette: Palettes.water }, 'water occurrence', true);
  
/*  var cannyTh = 0.02
  var cannySigma = 0
  var scale = 30
  
  var threshold = computeThresholdUsingOtsu(waterOccurrence, scale, bounds, cannyTh, cannySigma, false, false, 0).threshold;
  
  print(threshold)
  
  Map.addLayer(waterOccurrence.mask(waterOccurrence.gt(ee.Number(threshold).max(-0.05))), {min: 0, max: 0.5, palette: Palettes.water }, 'water occurrence, Canny + Otsu', false);
*/  
  
  // add images
  function preview() {
    var count = 10
    var list = images.toList(10)
    for(var i=0; i<count; i++) {
      var image = ee.Image(list.get(i))
      // Map.addLayer(image, {min: 0.05, max: 0.25, bands: ['swir', 'nir', 'green']}, i.toString(), false)
      Map.addLayer(image, {min: 0.05, max: 0.4, bands: ['nir', 'nir', 'green']}, i.toString(), false)
      Map.addLayer(image, {min: 0.05, max: 0.4, bands: ['red', 'green', 'blue']}, i.toString() + 'rgb', false)
    }
  }
  
  //preview()

  Map.addLayer(coastline, {color: 'brown'}, 'coastline')

  function previewGallery() {
    print('Adding gallery ...')
    
      images = images.filterBounds(boundsGallery)
        .map(function(i) { 
            return i.set({green: i.select('green').reduceRegion(ee.Reducer.percentile([90]), boundsGallery, 100).values().get(0)}).set('system:time_start', i.get('system:time_start')) })
        .sort('green')
        .filter(ee.Filter.lt('green', 0.2))
        .sort('system:time_start')
    
      // convert image collection to a single image (image gallery)
      var options = { 
        //proj: 'EPSG:3857', scale: Map.getScale(), 
        flipX: false, flipY: true,
        margin: 3
      }
    
      var rows = 4
      var columns = 6
    
      var gallery = community.ImageGallery(images, boundsGallery, rows, columns, options)
      Map.addLayer(gallery, {bands: ['swir','nir','green'], min:0.05, max:0.35}, 'gallery, S2')
      Map.addLayer(gallery, {bands: ['red','green','blue'], min:0.05, max:0.35}, 'gallery, S2 (RGB)', false)
    
/*      s1 = s1.filterBounds(bounds)
      var filter = ee.Filter.eq('transmitterReceiverPolarisation', ['VV', 'VH'])
      var gallery = community.ImageGallery(s1.filter(filter).sort('system:time_start').select(0), bounds, rows, columns, options)
      var gallery2 = community.ImageGallery(s1.filter(filter).sort('system:time_start').select(1), bounds, rows, columns, options)
      Map.addLayer(ee.Image([gallery, gallery2, gallery]) , {min:-25, max:0}, 'gallery, S1')
*/
  }
  
  // linear fit

  // Add time band.
  var createTimeBand = function(image) {
    // Scale milliseconds by a large constant.
    return image.addBands(image.metadata('system:time_start').divide(1e18));
  };
  

/*
  // new style

  // Add constant band.
  var createConstantBand = function(image) {
    return ee.Image(1).addBands(image);
  };

  var fit = waterScore.map(createTimeBand).map(createConstantBand)
    // Select the predictors and the responses.
    .select(['constant', 'system:time_start', 'water_score'])
    .reduce(ee.Reducer.linearRegression(2, 1));
    //.reduce(ee.Reducer.robustLinearRegression(2, 1));

  var bandNames = [['constant', 'time'], // 0-axis variation.
                   ['water_score']];      // 1-axis variation.
    
  var coefficients = fit.select(['coefficients']).arrayFlatten(bandNames);

  Map.addLayer(
      coefficients.select('constant_water_score').mask(coefficients.select('constant_water_score').abs().divide(10).pow(2)),
      {min:10, max:-10, palette: ['00ff00', '000000', '0000ff']},
        //.mask(coefficients.select('time_water_score').abs().divide(3000000)), 
        // {min: 0, max: [20, -3000000, 3000000], bands: ['constant_water_score', 'time_water_score', 'time_water_score'] }, 
  'fit', true)
*/  
  // old style
  var fit = waterScore.map(createTimeBand).select(['system:time_start', 'water_score'])
    .reduce(ee.Reducer.linearFit()).divide(1e7);
    
  // Display trend in red/blue, brightness in green.
  Map.addLayer(fit.mask(fit.select('scale').abs().add(0.2).multiply(waterOccurrence.gt(0))),
           {min: 0, max: [0, -0.5, 0.5], bands: ['scale', 'scale', 'scale']},
           'water changes', false);  

  
  if(boundsGallery.coordinates().size().getInfo() > 0) {
    previewGallery()
  }

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

var debug = true
var maxPixels = 1e10

/***
 * Compute a threshold using Otsu method (bimodal)
 */
function computeThresholdUsingOtsu(image, scale, bounds, th, g, skipShort, weightGradient, minValue, useLowValues) {
    // clip image edges
    var mask = image.mask().gt(0).focal_min(ee.Number(scale).multiply(3), 'circle', 'meters');
    
    // detect sharp changes
    var edge = ee.Algorithms.CannyEdgeDetector(image, th, g);
    edge = edge.multiply(mask);
    
    // remove bad edges
    // edge = edge.multiply(occurrence.gt(0))
    
    // advanced, detect edge lengths
    var coonnectedVis = void 0;
    if (skipShort) {
        var connected = edge.mask(edge).lt(0.8).connectedPixelCount(50, true);

        var edgeLong = connected.gte(50);

        edge = edgeLong;

        coonnectedVis = connected.updateMask(edgeLong).visualize({ palette: ['ffffff', 'ff0000'], min: 0, max: 50 });

        if (debug) {
            Map.addLayer(coonnectedVis, {}, 'edges (connected)', false);
        }
    }

    // take the largest changes, estimate gradient around edge and use that as a weight
    if (weightGradient) {
        if(useLowValues) {
          // edges with max values
          var edgeValues = image.mask(edge)//.reproject(image.projection().scale(2, 2));
  
          // take the brightest
          var percentile = 5;
          
          var p = ee.Number(ee.Dictionary(edgeValues.reduceRegion(
            {maxPixels: maxPixels, reducer: ee.Reducer.percentile([percentile]), geometry: bounds, scale: scale})).values().get(0));
          var significantEdgesMask = ee.Image(ee.Algorithms.If(
              ee.Algorithms.IsEqual(p, null),
              ee.Image(0),
              
              edgeValues.lt(p)
          ));
        } else {
          // edges with max values
          var edgeValues = image.mask(edge.gt(th))//.reproject(image.projection().scale(2, 2));
  
          // take the brightest
          var percentile = 95;
          
          var p = ee.Number(ee.Dictionary(edgeValues.reduceRegion({maxPixels: maxPixels, reducer: ee.Reducer.percentile([percentile]), geometry: bounds, scale: scale})).values().get(0));
          var significantEdgesMask = ee.Image(ee.Algorithms.If(
              ee.Algorithms.IsEqual(p, null),
              ee.Image(0),
              
              edgeValues.gt(p)
          ));

        }
        
        //var mode = ee.Number(ee.Dictionary(edgeGradient.reduceRegion(ee.Reducer.mode(), bounds, scale)).values().get(0));
        //var σ = ee.Number(ee.Dictionary(edgeGradient.reduceRegion(ee.Reducer.stdDev(), bounds, scale)).values().get(0));
        var _buckets = 50;

        // var mode = ee.Number(ee.Dictionary(edgeGradient.reduceRegion(ee.Reducer.mode(), bounds, scale)).values().get(0));
        //var σ = ee.Number(ee.Dictionary(edgeGradient.reduceRegion(ee.Reducer.stdDev(), bounds, scale)).values().get(0));
        //var _buckets = 50;
        //var significantEdgesMask = edgeGradient.gt(mode);

        edge = edge.updateMask(significantEdgesMask);
    }

    // buffer around NDWI edges
    var edgeBuffer = edge.focal_max(ee.Number(scale).multiply(1), 'square', 'meters');
    var imageEdge = image.mask(edgeBuffer);

    // compute threshold using Otsu thresholding
    var buckets = 100;
    var hist = ee.Dictionary(ee.Dictionary(imageEdge.reduceRegion(
      {maxPixels: maxPixels, reducer: ee.Reducer.histogram(buckets), geometry: bounds, scale: scale}
      )).values().get(0));

    var threshold = ee.Algorithms.If(hist.contains('bucketMeans'), otsu(hist), 0.3);
    threshold = ee.Number(threshold); //.add(0.05)
    
    if (debug) {
        Map.addLayer(edge.mask(edge), { palette: ['ff0000'] }, 'edges', false);

        print('Threshold: ', threshold);

        print(ui.Chart.image.histogram(image, bounds, scale, buckets).setOptions({title:'image, bounds'}));
        print(ui.Chart.image.histogram(imageEdge, bounds, scale, buckets).setOptions({title:'image, edges'}));
        Map.addLayer(mask.mask(mask), { palette: ['000000'] }, 'image mask', false);
    }

    return {
      threshold: ee.Number(minValue ? threshold.max(minValue) : threshold),
      edges: edge
    }
}

var community = { }

/***
 * Generates image collection gallery.
 */
community.ImageGallery = function(images, region, rows, columns, options) {
  images = images.filterBounds(region)

  var flipX = false
  var flipY = false
  var margin = 0
  
  var proj = ee.Image(images.first()).select(0).projection()

  if(options) {  
    flipX = typeof options.flipX !== 'undefined' ? options.flipX : flipX
    flipY = typeof options.flipY !== 'undefined' ? options.flipY : flipY

    proj = options.proj ? ee.Projection(options.proj) : proj
    proj = options.scale ? proj.atScale(options.scale) : proj
    
    margin = options.margin ? options.margin : margin
  }  
  
  var scale = proj.nominalScale()

  var e = ee.ErrorMargin(scale)

  var bounds = region.transform(proj, e).bounds(e, proj)
  
  var count = ee.Number(columns * rows)
  
  // number of images is less than grid cells
  count = count.min(images.limit(count).size())
  
  images = images.limit(count)

  var indices = ee.List.sequence(0, count.subtract(1))
  
  var offsetsX = indices.map(function(i) { return ee.Number(i).mod(columns) })
  var offsetsY = indices.map(function(i) { return ee.Number(i).divide(columns).floor() })

  var offsets = offsetsX.zip(offsetsY)

  var ids = ee.List(images.aggregate_array('system:index'))
  var offsetByImage = ee.Dictionary.fromLists(ids, offsets)
  
  var coords = ee.List(bounds.coordinates().get(0))

  var w = ee.Number(ee.List(coords.get(1)).get(0)).subtract(ee.List(coords.get(0)).get(0)).floor().add(margin)
  var h = ee.Number(ee.List(coords.get(2)).get(1)).subtract(ee.List(coords.get(0)).get(1)).floor().add(margin)
  
  var boundsImage = ee.Image().toInt().paint(bounds, 1).reproject(proj)
  
  // new region
  var ll = ee.List(coords.get(0))
  var ur = [ee.Number(ll.get(0)).add(w.multiply(columns)), ee.Number(ll.get(1)).add(h.multiply(rows))]
  
  var regionNew = ee.Geometry.Rectangle([ll, ur], proj, false)
  
  var mosaic = images
    .map(function(i) {
      var offset = ee.List(offsetByImage.get(i.get('system:index')))
      var xoff = w.multiply(offset.get(0)).multiply(scale).multiply(flipX ? -1 : 1)
      var yoff = h.multiply(offset.get(1)).multiply(scale).multiply(flipY ? -1 : 1)
  
      i = i.updateMask(boundsImage)
      
      return i.translate(xoff, yoff, 'meters', proj)
  }).mosaic()
  
  return mosaic;
}





app()




