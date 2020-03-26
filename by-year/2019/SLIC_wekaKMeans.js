/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var geometry = /* color: #d63000 */ee.Geometry.Polygon(
        [[[-122.27116719989635, 47.65968614078764],
          [-122.2154635641615, 47.658197441923726],
          [-122.21663873462592, 47.68715373804341],
          [-122.27218569814158, 47.683487930938085]]]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
/***
 * Implementation of Simple Linear Iterative Clustering Algoritm (SLIC). See Achanta, 2012 (http://ivrl.epfl.ch/research/superpixels).
 * 
 * Author: Gennadii Donchyts
 * License: Apache 2.0
 */

var community = { Algorithms: {} };

/***
 * Constructor.
 */
community.Algorithms.Slic = function(image, opt_scaleFactor, opt_debug) {
  this.scaleFactor = opt_scaleFactor || 15; 
  this.debug = opt_debug || false; // adds map layers
  this.image = image;
  this.cells = null;
  this.result = null; // resulting multiband image containing new labels
  this.iteration = 0;
  
  this.initialize();
}; 

/***
 * Initialize SLIC algorithm.
 */
community.Algorithms.Slic.prototype.initialize = function() {
  this.pixel = ee.Image.pixelLonLat().reproject(this.image.select(0).projection());

  this.initializeCells();
  
  if(this.debug) {
    this.initializeCellsDebug();
  }
}

/***
 * Initialize overlapping cell images around superpixel centroids.
 */
community.Algorithms.Slic.prototype.initializeCells = function() {
  var mapBounds = Map.getBounds();
  var labelMin = mapBounds[0] + mapBounds[1]
  var labelMax = mapBounds[2] + mapBounds[3]

  var wgs84 = ee.Projection('EPSG:4326');
  var proj = this.image.select([0]).projection();
  var shift = ee.Number(Math.floor(this.scaleFactor));
  
  this.cells = ee.List([]);

  var shiftCenter = ee.Number(Math.floor(this.scaleFactor * 3 / 2))
  
  var i = ee.List.repeat(ee.List.sequence(0, 2), 3).flatten();
  var j = ee.List.sequence(0, 2).map(function(jj) { return ee.List.repeat(jj, 3)}).flatten()
  var indices = i.zip(j)
  
  var scale = ee.Number(this.scaleFactor).multiply(3);
  var image = this.image;
  
  this.cells = indices.map(function(idx) {
    var modx = ee.Number(ee.List(idx).get(0))
    var mody = ee.Number(ee.List(idx).get(1))
    
      var projT = proj
        .translate(shift.multiply(modx), shift.multiply(mody))
        .scale(scale, scale)

      var index = ee.Image.pixelLonLat().toInt()
        .mod(scale).abs()
        .changeProj(wgs84, proj.translate(shift.multiply(modx), shift.multiply(mody))) // project to the image
        .rename(['x', 'y']);

      var centroid =  ee.Image.pixelLonLat().floor().toInt()
        .mod(scale).abs().reduce(ee.Reducer.sum())
        .changeProj(wgs84, proj.translate(shift.multiply(modx).add(shiftCenter), shift.multiply(mody).add(shiftCenter))) // project to the image
        .eq(0).rename('centroid'); 
        
      // coordinates of the current center
      var centroidLatLon = ee.Image.pixelLonLat()
        .reproject(projT)

      var cell = ee.Image.pixelLonLat().floor().toInt().reduce(ee.Reducer.sum()).bitwiseAnd(1)
        .changeProj(wgs84, projT); // project to the image

      // grab the first value as a starting average        
      var cellAverage = image.mask(centroid).unmask()
        .reduceResolution(ee.Reducer.first(), true, scale.multiply(scale))
        .reproject(projT)

      var label = ee.Image.pixelLonLat()
        .reduce(ee.Reducer.sum()).multiply(100000).toInt()
        .rename('label')
        .reproject(projT)

      cell = cell
          .addBands(cellAverage)
          .addBands(label)
          .addBands(centroidLatLon)
          .addBands(index)
          .addBands(centroid)
          .set('modx', modx)
          .set('mody', mody)

    return cell;
  })
}

/***
 * Debug function for initializeCells
 */
community.Algorithms.Slic.prototype.initializeCellsDebug = function() {
  var mapBounds = Map.getBounds();
  var labelMin = mapBounds[0] + mapBounds[1]
  var labelMax = mapBounds[2] + mapBounds[3]
  
  var sum = ee.Image(0).toByte();
  for(var modx = 0; modx < 3; modx++) {
    for(var mody = 0; mody < 3; mody++) {
      var cell = ee.Image(this.cells.get(modx * 3 + mody));
      sum = sum.add(cell.select(0))
      
      if(modx !== 0 || mody !== 0) {
        continue;
      }
      
      var centroid = cell.select('centroid')
      
      if(this.debug) {
        Map.addLayer(cell.select(0), {min: 0, max:1, opacity: 0.1}, modx + ' - ' + mody, false)
        //Map.addLayer(cell.select(this.image.bandNames()), this.vis, modx + ' - ' + mody + ' (image)', false)
  
        //Map.addLayer(centroid.mask(centroid), {min: 0, max:1}, modx + ' - ' + mody + ' (centroids)', false)
  
        //Map.addLayer(this.image.mask(centroid), this.vis, modx + ' - ' + mody + ' (centroids image)', false)
        //Map.addLayer(cell.select('latitude'), {min: mapBounds[0], max:mapBounds[2]}, modx + ' - ' + mody + ' (lat)', false)
        //Map.addLayer(cell.select('longitude'), {min: mapBounds[1], max:mapBounds[3]}, modx + ' - ' + mody + ' (lon)', false)
        //Map.addLayer(cell.select('label'), {min:labelMin, max:labelMax}, modx + ' - ' + mody + ' (label)', false)
      }
    }
  }
  
  Map.addLayer(sum, {min: 0, max:9}, 'sum', false)
}

/** 
 * Performs a single iteration of SLIC method
 */
community.Algorithms.Slic.prototype.kMeansAssignLabels = function() {
  var ll = ee.Image.pixelLonLat();
  
  var metersInDegree = 111319; // approximate meters in degree
  var cellSize = ee.Image(this.cells.get(0)).select(0).projection().nominalScale().divide(metersInDegree);

  var neighbors = ee.ImageCollection(this.cells)

  var compactness = this.compactness;
  
  var image = this.image;

  // compute 5D distance
  neighbors = neighbors.map(function(i) {
    var distanceColor = i.expression('sqrt((v1-i1)*(v1-i1) + (v2-i2)*(v2-i2) + (v3-i3)*(v3-i3))',
      {
        v1:i.select(['v1']),v2:i.select(['v2']),v3:i.select(['v3']),
        i1:image.select(['v1']),i2:image.select(['v2']),i3:image.select(['v3'])
      }).divide(compactness).rename('distanceColor')

    var distance = i.expression('sqrt((sx-ix)*(sx-ix) + (sy-iy)*(sy-iy))',
      {
        sx:i.select('longitude'), sy:i.select('latitude'),
        ix:ll.select('longitude'), iy:ll.select('latitude')
      }).rename('distance')
      
    var distanceXY = distance.divide(cellSize.multiply(2)).rename('distanceXY')
    var totalDistance = distanceColor.add(distanceXY).rename('totalDistance')

    return i.addBands(distanceColor).addBands(distanceXY).addBands(totalDistance)
  })

  if(this.debug) {
    var l = neighbors.toList(9, 0)
    if(this.iteration === 1) {
      Map.addLayer(ee.Image(l.get(0)).select('totalDistance'), {}, this.iteration + ' - total distance', false)
      Map.addLayer(ee.Image(l.get(0)).select('distanceXY'), {}, this.iteration + ' - distance XY', false)
      Map.addLayer(ee.Image(l.get(0)).select('distanceColor'), {}, this.iteration + ' - distance color', false)
    }
  }

  // convert collection to an array.
  var array = neighbors.toArray()

  var imageAxis = 0;
  var bandAxis = 1;
  var bandNames = ee.Image(neighbors.first()).bandNames();
  
  // get closest superpixel.
  var bands = array.arraySlice(bandAxis, 0, bandNames.length());
  var distanceScore = array.arraySlice(bandAxis, -1);
  var sorted = bands.arraySort(distanceScore); // sort by 5D distance score
  var closest = sorted.arraySlice(imageAxis, 0, 1);
  
  this.result = closest.arrayProject([bandAxis]).arrayFlatten([bandNames])
}

/** 
 * Compute new centroids and sample new values.
 */
community.Algorithms.Slic.prototype.kMeansUpdateCentroids = function() {
  var computedLabels = this.result.select(['label']).reproject(this.image.select(0).projection())

  var scale = this.scaleFactor * 3
  var image = this.image;

  // for every coarse grid
  this.cells = this.cells.map(function(cell) {
    var c = ee.Image(cell);
    
    var proj = c.select(0).projection();
    
    // compute superpixel blob
    var label = c.select('label')
    var superpixel = computedLabels.eq(label).rename('superpixel');
    
    c = c.addBands(superpixel, ['superpixel'], true)

    // compute new centroids

    // for every pixel of the high-res image compute sum of it's X, Y for every coarse image pixel.
    var coords = c.select(['x', 'y'])

    var coordsAverage = coords.mask(superpixel)
      .reduceResolution(ee.Reducer.median(), true, scale * scale)
      .unmask()
      .reproject(proj)
      .round()
  
    var centroidNew = coords.eq(coordsAverage).reduce(ee.Reducer.bitwiseAnd()).rename('centroid')

/*
    var cellAverageNew = image.mask(centroidNew).unmask()
      .reduceResolution(ee.Reducer.max(), true, scale * scale)
      .reproject(proj)
*/
    var cellAverageNew = image.mask(superpixel)
      //.reduceResolution(ee.Reducer.percentile([35]), true, scale * scale)
      .reduceResolution(ee.Reducer.median(), true, scale * scale)
      .reproject(proj)

    return c.addBands(centroidNew, null, true).addBands(cellAverageNew, null, true)
  })

  return {'image': this.result, 'cells': this.cells};  
}

community.Algorithms.Slic.prototype.iterate = function(opt_iterations) {
  var iterations = opt_iterations || 5; 

  // the for loop should just created a pipeline of processings
  for(var i = 0; i < iterations; i++) {
    this.iteration = i+1;
    this.kMeansAssignLabels()
    var results = this.kMeansUpdateCentroids();

    var closestValue = this.result.select(['v1','v2','v3']).reproject(this.image.select(0).projection())
    
    if(this.debug) {
      Map.addLayer(closestValue, this.vis, this.iteration + ' closest value', i == iterations - 1)
      
      var closestLabel = this.result.select(['label']).reproject(this.image.select(0).projection())
      //Map.addLayer(closestLabel, {}, this.iteration + ' closest label', false)
      
      //var connected = closestLabel.toInt().connectedPixelCount(500, true);
      //Map.addLayer(connected, {palette:['00ff00', '0000ff'], min:100, max:500}, this.iteration + ' connected labels', false)
      
      var closestValueEdge = ee.Algorithms.CannyEdgeDetector(closestLabel, 0.9, 0);
      Map.addLayer(closestValueEdge.mask(closestValueEdge), {opacity: 0.5, palette:['ffffff']}, this.iteration + ' closest value edge', i == iterations - 1)

      if(i != iterations - 1) {
        var blobs = ee.Image(this.cells.get(0)).select('superpixel')
        Map.addLayer(blobs.mask(blobs), {opacity:0.5}, this.iteration + ' superpixel (0, 0)', false)
      } else {
        for(var s = 0; s < 9; s++) {
          var blobs = ee.Image(this.cells.get(s)).select('superpixel')
          Map.addLayer(blobs.mask(blobs), {opacity:0.5}, this.iteration + ' superpixel ' + s, false)
        }
      }

      var centroid = ee.Image(this.cells.get(0)).select('centroid')// .focal_max(1)
      Map.addLayer(centroid.mask(centroid), {opacity:0.5, palette:['ff1010']}, this.iteration + ' centroid (0,0)', false)
    }
  }
  
  return ({repaintedImage: closestValue, results: results})
}

// ====================================================================

/**
 * Adds feature collection as a raster layer to map
 */
function addRasterLayer(fc, name, params) {
  var palette = params.palette || ['ffffff'];
  var visible = !(params.hide || false)
  
  var image = ee.Image(0).toByte();
  if(params.outline) {
    image = image.paint(fc, 1, 1)
  } else {
    image = image.paint(fc, 1)
  }
  if(params.buffer) {
    image = image.focal_max(params.buffer)
  }
  Map.addLayer(image.mask(image), {palette:palette}, name, visible)
}


// ============ LANDSAT 8
function slicExampleLandsat8() {

//Map.setCenter(-123.3, 47.6, 13)
// Map.setCenter(148.80, -34.94, 13) // Murrumbidgee
  // Map.setCenter(-95.55, 35.79, 14) // US, Arkansas River
  
  // get the first image at map center
  var l8 = ee.ImageCollection("LANDSAT/LC8_L1T_TOA");

  var image = ee.Image(l8.filterBounds(Map.getCenter()).first())
    .select(['B6', 'B5', 'B3'])
    .rename(['v1','v2','v3']);

//  var image = ee.Image('LANDSAT/LT5/LT50470282011250PAC01')
  // var image = ee.Image('LANDSAT/LC8/LC80450262013225LGN00')
  //     .select(['B6', 'B5', 'B3'])
  //   .rename(['v1','v2','v3']);





  
  Map.addLayer(image, {min: 0.03, max:0.5}, 'image')
  var vis = {min: 0.03, max:0.5}
  var compactness = 2 // TODO: compute this automatically. This parameters trades off color-similarity and proximity
  var scaleFactor = 3

  return {image: image, vis: vis, compactness: compactness, scaleFactor: scaleFactor}
}


// Sentinel-1
function slicExampleSentinel1() {
  var collection =  ee.ImageCollection('COPERNICUS/S1_GRD').filterBounds(Map.getCenter())
    .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VH'))
    .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VV'))
  
  // A helper to apply an expression and linearly rescale the output.
  var rescale = function(img, thresholds) {
      return img.subtract(thresholds[0]).divide(thresholds[1] - thresholds[0]);
  };

  function rgb(img) {
      var vv = img.select('VV');
      var vh = img.select('VH');
  
      var r = rescale(vv, [-20, 0]);
      var g = rescale(vv.add(vh).divide(2), [-25, -2]);
      var b = rescale(vh, [-30, -5]);
        
      var result = ee.Image.cat(r, g, b);
      
      return result;
  }

  var image =  rgb(ee.Image(collection.first()))
      .rename(['v1','v2','v3']);
  
  Map.addLayer(image, {}, 'Sentinel-1');
  
  image = image
    .focal_median(20, 'circle', 'meters', 5)
  
  print(image)
  
  var vis = {min: 0, max:1.1}
  var compactness = 4
  var scaleFactor = 10

  return {image: image, vis: vis, compactness: compactness, scaleFactor: scaleFactor}
}

// ============ Planet Labs
function slicExamplePlanetLabs() {
  var image = ee.Image('users/gena/PlanetLabs/20151107_200807_0b0a_analytic')
    .select(['b1','b2','b3'])
    .rename(['v1','v2','v3'])
  Map.centerObject(image, 16)
  Map.addLayer(image, {min:60, max:[900,900,1200], gamma:0.6})
  var vis = {min: 60, max:[900,900,1100], gamma:0.6}
  var compactness = 680.0
  var scaleFactor = 10

  return {image: image, vis: vis, compactness: compactness, scaleFactor: scaleFactor}
}


function slicExampleDigitalGlobe() {
  // DigitalGlobe
  var image = ee.ImageCollection('DG_GG_ANNUAL')
    // .select(['N','R','G'])
    .select(['R','G','B'])
    .mosaic()
    .reproject(ee.Projection('EPSG:32615'), null, 0.5)
    .rename(['v1','v2','v3'])
  
  Map.addLayer(image, {min:60, max:800, gamma: 1.0}, 'DigitalGlobe')
  var vis = {min: 100, max:800, gamma:1.0}
  var compactness = 680.0
  var scaleFactor = 10
  
  Map.setCenter(-95.63737, 29.641369, 19)

  return {image: image, vis: vis, compactness: compactness, scaleFactor: scaleFactor}
}

// ========= Terra Bella
function slicExampleTerraBella() {
  var images = ee.ImageCollection('SKYSAT/GEN-A/PUBLIC/ORTHO/MULTISPECTRAL');
  
  var image = ee.Image(images.filterBounds(Map.getBounds(true)).first())
    .select(['R','G','B'])
    .rename(['v1','v2','v3'])
  
  var id = 'SKYSAT/GEN-A/PUBLIC/ORTHO/MULTISPECTRAL/s02_20151221T120326Z';
  
  var image = ee.Image(id)
    .select(['N','G','B'])
    .rename(['v1','v2','v3'])
  
  Map.setCenter(-6.131250858306885, 40.32344859272024,17)
  
  print(image)
  
  var vis = {min:600, max:[2500,2500,6000], gamma: 1.2}
  Map.addLayer(image, vis, 'TerraBella')
  var compactness = 1000.0
  var scaleFactor = 10

  return {image: image, vis: vis, compactness: compactness, scaleFactor: scaleFactor}
}

// =========================== select example
// var input = slicExampleTerraBella();
//var input = slicExampleDigitalGlobe();
//var input = slicExamplePlanetLabs();
//var input = slicExampleSentinel1();
var input = slicExampleLandsat8();

// =========================== instantiate SLIC algorithm and compute superpixels
print(Map.getCenter());

var debug = false;
// var debug = true;

var slic = new community.Algorithms.Slic(input.image, input.scaleFactor, debug);
slic.vis = input.vis;
slic.compactness = input.compactness;
print('Scale factor: ' + slic.scaleFactor);

var theBigCall = slic.iterate(4);
var results = theBigCall.results;
var theRepaintedImage = theBigCall.repaintedImage
Map.addLayer(theRepaintedImage, {min: 0.03, max:0.5}, "repainted")


  var pugetareatemp = /* color: #d63000 */ee.Geometry.Polygon(
        [[[-124.30352972536059, 47.27128166063033],
          [-123.82925991252449, 46.99729412374967],
          [-123.41252757794297, 47.01561045135977],
          [-123.05027483485514, 46.771956019864334],
          [-122.44190923893768, 46.763439270315246],
          [-121.94897256625057, 47.22100723424152],
          [-121.77901836750891, 47.487138539754966],
          [-121.75131153567213, 47.88025613902951],
          [-121.73334011579027, 48.24438682613085],
          [-121.97477014374817, 48.47585180754761],
          [-121.8872009786362, 48.63440708876777],
          [-122.08018971228478, 48.68415986506167],
          [-122.16362767200712, 48.748252827165615],
          [-122.1335388193238, 48.90459170207551],
          [-122.09164888171688, 49.00874288419323],
          [-123.31699205680519, 49.0073000568708],
          [-122.99423732371145, 48.83336138137028],
          [-122.97028555875431, 48.77562055398919],
          [-123.25352154725601, 48.696430820418186],
          [-123.14524526931791, 48.377222174739494],
          [-122.85605336746943, 48.34034389530577],
          [-122.96268407568925, 48.20110486049082],
          [-123.86727220731296, 48.20751922706289],
          [-124.78084798923732, 48.443982161696766],
          [-124.69448407110332, 47.853999226102864],
          [-124.55536931824389, 47.70043015361133],
          [-124.48645933302026, 47.56454360734233]]]);


var numberOfUnsupervisedClusters = 30

// try on original image
var theRepaintedImage = input.image
afn_Kmeans_unsegmented(theRepaintedImage, numberOfUnsupervisedClusters, 'weka kMeans original image') 

// try on SLIC image
var theRepaintedImage = theBigCall.repaintedImage
afn_Kmeans_unsegmented(theRepaintedImage, numberOfUnsupervisedClusters, 'weka SLIC image') 



function afn_Kmeans_unsegmented(input, numberOfUnsupervisedClusters, name) {
  // This function does clustering of the repainted image 

  // Clusterer example
  // theClusterMeans = a set of means of segmentation clusters. ie the mean values in 
  //    an agricultural field. There are many of these.
  // input = an image. In normal use this will be a repainted image that is created from
  //    a segmentation process that happens outside this function. 
  // numberOfUnsupervisedClusters = tuneable parameter for how many clusters to use.

  // make a new sample set on the input. here the sample set is randomly selected spatially. 
  // A future implementation might
  // read in sample points from a fusion table at this point.
  
  // var defaultStudyArea = pugetareatemp
  var defaultStudyArea = geometry

  var nativeScaleOfImage = 30
  var training = input.sample({
    region: defaultStudyArea,
    scale: nativeScaleOfImage,
    numPixels: 100
  });
  
  print(training, "training points for unsup");
  var cluster = ee.Clusterer.wekaKMeans(numberOfUnsupervisedClusters).train(training);
  print("returned from ee.Clusterer", cluster);

  // now apply that clusterer to the means of the segmentation that were also passed in. 
  var c = input.cluster(cluster, "c");
  print("layer c", c)
  Map.addLayer(c.randomVisualizer(), {}, name)

  // create an image from it.
//  var toexport = c.reduceToImage(["c"], ee.Reducer.first());
//  var todraw = toexport.randomVisualizer();
//  Map.addLayer(todraw, {}, "4.Kmeans on repainted");
//  return(toexport);
}

