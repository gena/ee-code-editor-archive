/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var l5 = ee.ImageCollection("LANDSAT/LT5_L1T_TOA"),
    l8 = ee.ImageCollection("LANDSAT/LC8_L1T_TOA"),
    geometry = /* color: #d63000 */ee.Geometry.Polygon(
        [[[54.9479913450067, 24.966450932522008],
          [55.033221869935346, 24.968473996381835],
          [55.03219188111382, 25.04027115853971],
          [54.947991344041725, 25.039571272982638]]]),
    geometry2 = /* color: #d63000 */ee.Geometry.Polygon(
        [[[54.933657428488345, 24.973414958866105],
          [54.993310588821714, 24.973531660945184],
          [54.99373973409104, 24.994849089217624],
          [54.93365743585241, 24.995082463109263]]]),
    l5f = ee.ImageCollection("LANDSAT/LT5_L1T_TOA_FMASK"),
    l4f = ee.ImageCollection("LANDSAT/LT4_L1T_TOA_FMASK"),
    l8f = ee.ImageCollection("LANDSAT/LC8_L1T_TOA_FMASK"),
    l7f = ee.ImageCollection("LANDSAT/LE7_L1T_TOA_FMASK");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
function app() {
/*
  var bands = ['swir1', 'nir', 'green', 'fmask']
  
  var collections = [
    //{ images: l4f, bands: ['B5', 'B4', 'B2', 'fmask'] },
    //{ images: l5f, bands: ['B5', 'B4', 'B2', 'fmask'] },
    //{ images: l7f, bands: ['B5', 'B4', 'B2', 'fmask'] },
    { images: l8f, bands: ['B6', 'B5', 'B3', 'fmask'] },
    ]

  var images = ee.List(collections.map(function(c) {
    return c.images.select(c.bands, bands)
  })).iterate(function(ic, prev) {
    return ee.ImageCollection(ic).merge(prev)
  }, ee.ImageCollection([]))
  
  images = ee.ImageCollection(images)
  
  var g = ee.Geometry(Map.getBounds(true))
  
  images = images.filterBounds(g.centroid(100))
  
  Map.addLayer(images, {}, 'raw', false)
  
  images = images.map(function(i) {
    return i.set('cloud_count', i.select('fmask').eq(4).reduceRegion(ee.Reducer.count(), g, 300).values().get(0))
  }).sort('cloud_count')//.sort('SUN_ELEVATION')
  
var count = 10
  ee.List.sequence(0, 10).getInfo().map(function(i) {
    var image = ee.Image(images.toList(1, i).get(0))
    var cloud = image.select('fmask')

    var image2 = ee.ImageCollection.fromImages([
      image.visualize(),
      cloud.mask(cloud).visualize({palette:['ffff00'], opacity: 0.5})
      ]).mosaic()
    
    Map.addLayer(image2, {}, i.toString(), i === 0)
  })
  
  return
*/  
  
  Map.addLayer(ee.Image(1), {palette:['ffffff']}, 'bg', false)

  var g = ee.Geometry(Map.getBounds(true)).centroid(10)

  l8 = l8
    .filterBounds(g)
    .filterDate('2014-01-01', '2015-01-01')
    .filter(ee.Filter.lt('SUN_ELEVATION', 40))
    // .map(function(i) { return i.resample('bicubic')})
   
  //var image = l8.reduce(ee.Reducer.percentile([20])).rename(ee.Image(l8.first()).bandNames())
  var image = ee.Image(l8.toList(1,2).get(0))

  print(image.date())
  print(image.get('SUN_ELEVATION'))
  
  // Map.addLayer(image, {bands:['B4', 'B3', 'B2'], min: 0.03, max:0.5})
  Map.addLayer(image, {bands:['B6', 'B5', 'B3'], min: 0.03, max:0.5})
  
  var ndwi = image.normalizedDifference(['B3', 'B5'])
  Map.addLayer(ndwi, {min: -0.5, max:0.5}, 'ndwi', false)

  var ndwi = image.normalizedDifference(['B3', 'B6'])
  Map.addLayer(ndwi, {min: -0.5, max:0.5}, 'mndwi', false)
  
  var edgeNdwi0 = ndwi.zeroCrossing()
  Map.addLayer(edgeNdwi0.mask(edgeNdwi0), {palette:['ffffff']}, 'ndwi = 0')
  
  var water0 = ndwi.gt(0)
  Map.addLayer(water0.mask(water0), {palette:['0000ff']}, 'water0', true, 0.7)


  var thresholds = ee.List.sequence(-0.1, 0.3, 0.1).getInfo()

/*
  thresholds.map(function(t) {
    var im = ndwi.reproject(ee.Projection('EPSG:3857').atScale(Map.getScale())).subtract(t).zeroCrossing()
    Map.addLayer(ee.Image.constant(t).reproject(ee.Projection('EPSG:3857').atScale(Map.getScale())).mask(im), {min:-0.7, max:0.2, palette:['ffff00', 'ffffff']}, 'ndwi = ' + t)  
  })
  
*/  
  var edge = ee.Algorithms.CannyEdgeDetector(ndwi, 0.7, 1)
  
  Map.addLayer(edge.mask(edge), {palette:['ff0000']}, 'ndwi edges')

  var ndwiBuffer = ndwi.mask(edge.focal_max(30, 'square', 'meters'))
  Map.addLayer(ndwiBuffer, {min: -0.5, max:0.5}, 'ndwi (buffer)', false)
  
  //var g = geometry.bounds()
  var g = ee.Geometry(Map.getBounds(true))
  var scale = 30
  var hist = ndwiBuffer.reduceRegion(ee.Reducer.histogram(100), g, scale)
  print(ui.Chart.image.histogram(ndwiBuffer, g, scale).setOptions({ hAxis: { title: "NDWI, Ostu, local", viewWindowMode:'explicit', viewWindow:{ min:-1, max:1 }}}))
  print(ui.Chart.image.histogram(ndwi, g, scale).setOptions({ hAxis: { title: "NDWI, Ostu, global", viewWindowMode:'explicit', viewWindow:{ min:-1, max:1 }}}))
  
  var th = otsu(hist.values().get(0))
  var water = ndwi.gt(th)
  Map.addLayer(water.mask(water), {palette:['0000ff']}, 'water', false, 0.7)
  
  var waterEdge = ee.Algorithms.CannyEdgeDetector(water, 1,0)
  Map.addLayer(waterEdge.mask(waterEdge), {palette:['ffffff']}, 'water edge', true)

  // remove short edges
  var connected = edge.mask(edge).lt(0.8).connectedPixelCount(50, true);
  var edgeLong = connected.gte(50);
  edge = edgeLong;

  Map.addLayer(edge.mask(edge), {palette:['ff0000']}, 'ndwi edges (short)')

  var ndwiBuffer = ndwi.mask(edge.focal_max(30, 'square', 'meters'))
  Map.addLayer(ndwiBuffer, {min: -0.5, max:0.5}, 'ndwi (buffer)', false)
  
  //var g = geometry.bounds()
  var g = ee.Geometry(Map.getBounds(true))
  var scale = 30
  var hist = ndwiBuffer.reduceRegion(ee.Reducer.histogram(100), g, scale)
  print(ui.Chart.image.histogram(ndwiBuffer, g, scale).setOptions({ hAxis: { title: "NDWI, Ostu, local", viewWindowMode:'explicit', viewWindow:{ min:-1, max:1 }}}))
  print(ui.Chart.image.histogram(ndwi, g, scale).setOptions({ hAxis: { title: "NDWI, Ostu, global", viewWindowMode:'explicit', viewWindow:{ min:-1, max:1 }}}))
  
  var th = otsu(hist.values().get(0))
  var water = ndwi.gt(th)
  Map.addLayer(water.mask(water), {palette:['0000ff']}, 'water', false, 0.7)
  
  var waterEdge = ee.Algorithms.CannyEdgeDetector(water, 1,0)
  Map.addLayer(waterEdge.mask(waterEdge), {palette:['ffffff']}, 'water edge', true)
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


app()


