/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var s2 = ee.ImageCollection("COPERNICUS/S2"),
    l8 = ee.ImageCollection("LANDSAT/LC8_L1T_TOA"),
    center = /* color: 0B4A8B */ee.Geometry.Point([-118.75272274017334, 34.473165492385505]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
var geometry = /* color: d63000 */ee.Geometry.Polygon(
        [[[-118.76362323760986, 34.46092344689756],
          [-118.74203681945801, 34.46099421532544],
          [-118.74246597290039, 34.486325457246096],
          [-118.76392364501953, 34.48643157755693]]]);

Map.centerObject(center, 15)
          
var bounds = Map.getBounds(true)

/*
var index = 0
var image = ee.Image(s2.filterBounds(bounds).toList(1, index).get(0))
var bands = ['B3', 'B8', 'B2']
var min = 500
var max = 2000

Map.addLayer(image, {bands: bands, min:min, max:max, gamma: 1.2}, 'S2')
var ndwi = image.select(['B2', 'B8']).normalizedDifference(['B8', 'B2'])
*/

//var bands = ['B6', 'B5', 'B3']
var bands = ['B6', 'B5', 'B8']
var min = 0.03
var max = 0.4
var index = 0

var image = ee.Image(l8.filterBounds(bounds).toList(1, index).get(0))
Map.addLayer(image.select(bands), {min:min, max:max, gamma: 1.2}, 'L8')
var ndwi = image.normalizedDifference(['B6', 'B3'])

var scale = 30


/*

Map.addLayer(ndwi, {min:-0.1, max:0.5}, 'NDWI', false)

var training = image.sample({region: bounds, scale: scale, numPixels: 1000})
var clusterer = ee.Clusterer.wekaKMeans(10).train(training)

var result = image.cluster(clusterer)
Map.addLayer(result.randomVisualizer(), {}, 'clusters', false)

result = result.reduceToVectors({geometry: bounds, scale: scale, maxPixels: 1e10}).filterBounds(geometry);
Map.addLayer(result, {}, 'vector', false)


// region growing
var maxObjectSize = 100;
// The RegionGrow algorithm has these arguments:
// threshold - The maximum distance for inclusion in the current cluster.
// useCosine - Whether to use cosine distance instead of euclidean distance
//     when computing the spectral distance.
// secondPass - Apply a refinement pass to the clustering results.
var imageClustered = ee.apply("Test.Clustering.RegionGrow", 
  {  "image": ndwi
   , "useCosine": true
   , "threshold": 0.0005
   , "maxObjectSize": maxObjectSize
, });
var imageConsistent = ee.apply("Test.Clustering.SpatialConsistency", {
   "image": imageClustered
   , "maxObjectSize": maxObjectSize
});



var clusterImage = imageConsistent.select('clusters')
Map.addLayer(clusterImage.randomVisualizer(), {}, "Consistent", false);

var cleaned = clusterImage.reduceNeighborhood({
  reducer: ee.Reducer.mode(),
  kernel: ee.Kernel.circle(1, "pixels")
})
Map.addLayer(cleaned.randomVisualizer(), {}, "Cleaned",false);


*/




// SLIC

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

    if(this.debug) {
      var closestValue = this.result.select(['v1','v2','v3']).reproject(this.image.select(0).projection())
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
  
  return results;
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

// ========= start SLIC

var vis = {min:min, max:max, gamma: 1.2}
var compactness = max * 0.9

var scaleFactor = 8
var iterationCount = 3

var proj = ee.Projection('EPSG:3857')

// ================================ export video
var debug = false;

var images = l8.filterBounds(bounds);

var maxFrames = 30
var maxFramsAsLayers = 5

var imagesRendered = images.limit(maxFrames).map(function(i) {
  var image = ee.Image(i)
    .select(bands)
    .rename(['v1','v2','v3'])

  var coarse = image

  image = image
    .resample('bicubic')
    .reproject(i.select(0).projection().scale(0.5, 0.5))
    
  var slic = new community.Algorithms.Slic(image, scaleFactor, debug);
  slic.vis = vis;
  slic.compactness = compactness;

  var results = slic.iterate(iterationCount);

  var closestValue = results.image.select(['v1','v2','v3']);
  
  var closestLabel = results.image.select(['label'])
  var closestValueEdge = ee.Algorithms.CannyEdgeDetector(closestLabel, 0.5, 0)
  var edge = closestValueEdge.mask(closestValueEdge).visualize({palette:['ffffff'], opacity:0.6});

  var edgeAoi = ee.Image().paint(geometry, 1, 1).visualize({forceRgbOutput: true})

  var centroid = ee.ImageCollection(results.cells).sum().select('centroid')

  return ee.ImageCollection.fromImages([
      image.visualize(vis),
      edge.clip(geometry).visualize({opacity:0.6}),
      edgeAoi,
      closestValue.visualize(vis).clip(geometry).translate(2500, 0, 'meters', proj),
      edge.clip(geometry).visualize({opacity:0.6}).translate(2500, 0, 'meters', proj),
      centroid.mask(centroid).visualize({opacity:0.8, palette:['ff1010']}).clip(geometry).translate(2500, 0, 'meters', proj),
      edgeAoi.translate(2500, 0, 'meters', proj),
      
      coarse.visualize(vis).clip(geometry).translate(-2500, 0, 'meters', proj),
      edgeAoi.translate(-2500, 0, 'meters', proj)
    ]).mosaic();
});

var scale = 5
Export.video(imagesRendered, 'slic', {scale:scale, region:Map.getBounds(true)});

var frames = imagesRendered.toList(maxFramsAsLayers, 0);
for(var i = 0; i < maxFramsAsLayers; i++) {
  Map.addLayer(ee.Image(frames.get(i)), {}, 'video frame ' + i.toString(), false)
}







// ===========================  instantiate SLIC algorithm and compute superpixels
var image = ee.Image(l8.filterBounds(bounds).toList(1, index).get(0))
  .select(bands).rename(['v1', 'v2', 'v3'])

image = image.reproject(image.select(0).projection()) // B8 is 15m

function slicAndGraphCuts() {
  print(Map.getCenter());
  
  //var debug = false;
  var debug = true;
  
  var slic = new community.Algorithms.Slic(image.reproject(image.select(0).projection().scale(0.5, 0.5)), scaleFactor, debug);
  slic.vis = vis;
  slic.compactness = compactness;
  print('Scale factor: ' + slic.scaleFactor);
  
  var results = slic.iterate(iterationCount);
  
  
  // show results
  Map.addLayer(results.image.select(['v1','v2','v3']), vis, 'results', false)
  
  // show centroids
  
  var centroid = ee.ImageCollection(results.cells).sum().select('centroid')
  Map.addLayer(centroid.mask(centroid), {opacity:0.5, palette:['ff1010']}, 'centroids', false)
  
  // compute adjacent superpixels edges
  var labels = results.image.select('label').toLong()
  
  var superpixelVector = labels//.mask(labels)
    .reduceToVectors({crs:proj, scale: 30, geometry: Map.getBounds(true)})
    .map(function(f) {
      var geom = f.geometry().centroid(30)
      var value = results.image.reduceRegion(ee.Reducer.first(), geom, 30, proj)
      return f.set('value', ee.Number(value.get('v1')).divide(value.get('v3')))
    })
    
  print('Superpixel count: ', superpixelVector.size())
  
  var edges = superpixelVector
    .map(function(f) {
      // find nearest
      var nearest = superpixelVector.filterBounds(f.geometry()) // <== bottleneck?
      
      var coordsTarget = f.geometry().centroid(30)
      
      var value = f.get('value')
      
      // construct edges
      var edges = nearest.map(function(n) {
        var coords = ee.List([
          n.geometry().centroid(scale),
          coordsTarget
          ])
        
        return ee.Feature(ee.Algorithms.GeometryConstructors.LineString(coords), {
          diff: ee.Number(n.get('value')).subtract(value)
        });
      });
      
      return edges;
  }).flatten();
    
  Map.addLayer(edges, {opacity:0.8, color:'green'}, 'edges (vector)', false)
  
  print('Edges count: ', edges.size())
  
  var rescale = function (img, thresholds) {
      return img.subtract(thresholds[0]).divide(ee.Number(thresholds[1]).subtract(thresholds[0]))
        .set('system:time_start', img.get('system:time_start'));
  };
  
  var edgesRaster = ee.Image().toFloat().paint(edges, 'diff', 2).abs()
  Map.addLayer(edgesRaster.mask(rescale(edgesRaster, [0.5, 0.0])), {min:0, max:0.5, palette:['00ff00', 'ff0000']}, 'edges (raster)', true)
  
  // vectorise centroids and compute points
  var centroidPoints = superpixelVector.map(function(f) { return f.centroid(30) })
  
  Map.addLayer(centroidPoints, {opacity:0.8, color:'red'}, 'centroids (points)', true)
}

slicAndGraphCuts()