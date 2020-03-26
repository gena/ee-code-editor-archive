
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



// The goal of this script is to use RegionGrow to grow superpixels. It takes a sample
// input image and grows clusters within it, basing the clustering on multiple bands. 
var imageOriginal1 = ee.Image('LEDAPS/LT5_L1T_SR/LT50470282011250PAC01').select(['B7', 'B4', 'B5'])
var imageOriginal2 = ee.Image('LANDSAT/LC8/LC80470282015229LGN00').select(['B7', 'B4', 'B5'])
var imageOriginal3 = ee.Image('LANDSAT/LC8/LC80470282016232LGN00').select(['B7', 'B4', 'B5'])
var bands = ['B7', 'B4', 'B5']

//**************************************************

var nativeScaleOfImage = 30
var theDifferenceThreshold = bands.length * 0.001
var usePCA = false

var image = imageOriginal1

var numberOfUnsupervisedClusters = 10
var zoomLevel = 14
var circleSize = 2
var maxObjectSize = 500; // the size of the largest superpixel. Lower number makes more pixels

//var sfPoint = ee.Geometry.Point(thex, they);
//Map.setCenter(thex, they, zoomLevel);

print(image)
var defaultStudyArea = image.geometry()
Map.centerObject(defaultStudyArea, zoomLevel);

var vis = {min:0, max:5000, gamma: 1.2}

Map.addLayer(image, vis, "Original Image")
//Map.addLayer(imageOriginal.select(1, 2, 3))
// see coloring choices at 
// http://web.pdx.edu/~emch/ip1/bandcombinations.html

var thePC = afn_doPCA(image)
Map.addLayer(thePC, {}, "PCA");
print(ee.Image(thePC))

if (usePCA === true) {
    imageOriginal = thePC
}

///////////////////// MAIN CODE outside of functions
afn_RegionGrowRepaintAndCluster(imageOriginal1.clip(defaultStudyArea), true, theDifferenceThreshold)
//.reproject("EPSG:4326", null, nativeScaleOfImage)
//afn_Kmeans_unsegmented(imageOriginal.clip(defaultStudyArea), numberOfUnsupervisedClusters)

//afn_RegionGrowRepaintAndCluster(thePC.clip(defaultStudyArea).rename(bands), false, 2.0).reproject("EPSG:4326", null, nativeScaleOfImage)

//.reproject("EPSG:4326", null, nativeScaleOfImage)

///////////////////// END of MAIN CODE outside of functions

function afn_doPCA(image) {
    // Get some information about the input to be used later.
    var nominalScale = image.projection().nominalScale();
    var bandNames = image.bandNames(); 

    // Mean center the data to enable a faster covariance reducer 
    // and an SD stretch of the principal components.
    var meanDict = image.reduceRegion({
        reducer: ee.Reducer.mean()
        , geometry: defaultStudyArea
        , scale: nominalScale
        , tileScale: 16
        , maxPixels: 1e9
    });
    var means = ee.Image.constant(meanDict.values(bandNames));
    var centered = image.subtract(means);

    // This helper function returns a list of new band names.
    var getNewBandNames = function(prefix) {
        var seq = ee.List.sequence(1, bandNames.length());
        return seq.map(function(b) {
            return ee.String(prefix).cat(ee.Number(b).int());
        });
    };

    // This function accepts mean centered imagery, a scale and 
    // a defaultStudyArea in which to perform the analysis.  It returns the 
    // Principal Components (PC) in the defaultStudyArea as a new image.
    // [START principal_components]
    var getPrincipalComponents = function(centered, scale, region) {
        // Collapse the bands of the image into a 1D array per pixel.
        var arrays = centered.toArray();

        // Compute the covariance of the bands within the region.
        var covar = arrays.reduceRegion({
            reducer: ee.Reducer.centeredCovariance()
            , geometry: region
            , scale: scale
            , maxPixels: 1e9
        });

        // Get the 'array' covariance result and cast to an array.
        // This represents the band-to-band covariance within the region.
        var covarArray = ee.Array(covar.get('array'));

        // Perform an eigen analysis and slice apart the values and vectors.
        var eigens = covarArray.eigen();

        // This is a P-length vector of Eigenvalues.
        var eigenValues = eigens.slice(1, 0, 1);
        // This is a PxP matrix with eigenvectors in rows.
        var eigenVectors = eigens.slice(1, 1);

        // Convert the array image to 2D arrays for matrix computations.
        var arrayImage = arrays.toArray(1);

        // Left multiply the image array by the matrix of eigenvectors.
        var principalComponents = ee.Image(eigenVectors).matrixMultiply(arrayImage);

        // Turn the square roots of the Eigenvalues into a P-band image.
        var sdImage = ee.Image(eigenValues.sqrt())
            .arrayProject([0]).arrayFlatten([getNewBandNames('sd')]);

        // Turn the PCs into a P-band image, normalized by SD.
        return principalComponents
            // Throw out an an unneeded dimension, [[]] -> [].
            .arrayProject([0])
            // Make the one band array image a multi-band image, [] -> image.
            .arrayFlatten([getNewBandNames('pc')])
            // Normalize the PCs by their SDs.
            .divide(sdImage);
    };
    // [END principal_components]

    // Get the PCs at the specified scale and in the specified region
    var pcImage = getPrincipalComponents(centered, nominalScale, defaultStudyArea);

    // Plot each PC as a new layer
    for (var i = 0; i < bandNames.length().getInfo(); i++) {
        var band = pcImage.bandNames().get(i).getInfo();
        Map.addLayer(pcImage.select([band]), {
            min: -2
            , max: 2
        }, band);
    }
    return (pcImage)
}

function afn_regiongrowing(imageOriginal, objectMaxSize, useCosineYN, theRegionThreshold) {

    //print(imageOriginal)
    // The RegionGrow algorithm has these arguments:
    // threshold - The maximum distance for inclusion in the current cluster.
    // useCosine - Whether to use cosine distance instead of euclidean distance
    //     when computing the spectral distance.
    // secondPass - Apply a refinement pass to the clustering results.
    var imageClustered = ee.apply("Test.Clustering.RegionGrow", {
        "image": imageOriginal
        , "useCosine": useCosineYN
        , "threshold": theRegionThreshold
        , secondPass: true
        , "maxObjectSize": objectMaxSize
    });
    var imageConsistent = ee.apply("Test.Clustering.SpatialConsistency", {
        "image": imageClustered
        , "maxObjectSize": objectMaxSize
    });
    return (imageConsistent)
}
//Map.addLayer(imageOriginal, {}, "Original");

function afn_RegionGrowRepaintAndCluster(imageOriginal, useCosineYN, theRegionThreshold) {
    var imageClustered = afn_regiongrowing(imageOriginal, maxObjectSize, useCosineYN, theRegionThreshold)
    var clusterImage = imageClustered.select('clusters')
    //Map.addLayer(clusterImage.randomVisualizer(), {}, "Uncleaned Clusters");

    // here you can either clean very small clusters, or not. 
    var cleanEnough = clusterImage // or, to clean it, leave in the line below
    var cleanEnough = afn_cleanClustering(clusterImage)

    var newImageforGrouping = cleanEnough.addBands(imageOriginal).clip(defaultStudyArea);

    var painted = afn_repaintImage(newImageforGrouping)
    var themeans = painted.means
    print(themeans, 'the Means')
    var clusterOnRepainted = afn_Kmeans(themeans, bands, numberOfUnsupervisedClusters)
}

function afn_repaintImage(newImageforGrouping) {
    var means = newImageforGrouping.reduceToVectors({
        reducer: ee.Reducer.mean()
        , geometry: defaultStudyArea
        , scale: nativeScaleOfImage
        , maxPixels: 1e8
        , tileScale: 16
        , maxPixels: 1e12
    })
    print(means.size())

    var painted = means.reduceToImage(bands, ee.Reducer.first().forEachBand(imageOriginal1))

    print(painted)
    //Map.addLayer(painted.select(0, 1, 2), {}, "Repainted Image")
    Map.addLayer(painted, {}, "Repainted Image")

    // Map.addLayer(painted.select(0, 1, 2), {
    //         bands: bands
    //     }, "Repainted Image")
    //Map.addLayer(imageOriginal.select(1, 2, 3))

    Map.addLayer(painted.randomVisualizer().reproject("EPSG:4326", null, nativeScaleOfImage), {}, "A static look at the Groups", 1);
    return ({
        repaintedImage: painted
        , means: means
    })
}

function afn_Kmeans(themeans, bands, numberOfUnsupervisedClusters) {
    print(themeans, "painted means")
    var cluster = ee.Clusterer.wekaKMeans(numberOfUnsupervisedClusters).train(themeans, bands)
    print("returned from ee.Clusterer", cluster)

    var c = themeans.cluster(cluster, "c")
    Map.addLayer(c.reduceToImage(["c"], ee.Reducer.first()).randomVisualizer(), {}, "Kmeans on repainted")
}

function afn_Kmeans_unsegmented(input, numberOfUnsupervisedClusters) {
    // Clusterer example

    var training = input.sample({
        region: defaultStudyArea
        , scale: nativeScaleOfImage
        , numPixels: 5000
    })
    var cluster = ee.Clusterer.wekaKMeans(numberOfUnsupervisedClusters).train(training)
    print("returned from ee.Clusterer", cluster)
    var result = input.cluster(cluster);

    Map.addLayer(result.randomVisualizer())
    Map.addLayer(ee.Image().paint(defaultStudyArea, 0, 2))
}

function afn_MapLayer(imageToMap, theMin, theMax, thePalette, theLabel, YNdraw) { // a simple drawer, just to simplify the appearance of the code to be a one-line call to draw.
    // print("hello")
    //     print(imageToMap)
    //       print(theMin)
    //       print(theMax)
    //       print(thePalette)
    //       print(theLabel)
    //       print(YNdraw)
    //       print("bye")
    Map.addLayer(imageToMap, {
        'min': theMin
        , 'max': theMax
        , 'palette': thePalette
    }, theLabel, YNdraw, 1);
}

function afn_cleanClustering(imageClustered) {

    // jc put reduceneighborhood back in
    var cleaned = imageClustered.reduceNeighborhood({
        reducer: ee.Reducer.mode()
        , kernel: ee.Kernel.circle(circleSize, "pixels")
    })
    //Map.addLayer(cleaned.randomVisualizer(), {}, "Cleaned");

    // Uncomment this line to see the per-tile clustering output
    // select bands, add cluster values, for mapping back to the values.
    // jc changed /cluster.addbands to cleaned.addbands
    return (cleaned)
}


var compactness = vis.max * 0.7
var scaleFactor = 5
var iterationCount = 4
var debug = false;
//var debug = true;

var image = image
  .rename(['v1','v2','v3'])

var slic = new community.Algorithms.Slic(image, scaleFactor, debug);
slic.vis = vis
slic.compactness = compactness;

var results = slic.iterate(iterationCount);
var closestValue = results.image.select(['v1','v2','v3']);

var closestLabel = results.image.select(['label'])
var closestValueEdge = ee.Algorithms.CannyEdgeDetector(closestLabel, 0.5, 0)
var edge = closestValueEdge.mask(closestValueEdge).visualize({palette:['ffffff'], opacity:0.6});

var centroid = ee.ImageCollection(results.cells).sum().select('centroid')

Map.addLayer(edge.mask(edge).visualize({opacity:0.6}), {}, 'edge');
Map.addLayer(closestValue.visualize(slic.vis), {}, 'segmented');
Map.addLayer(centroid.mask(centroid).visualize({opacity:0.8, palette:['ff1010']}), {}, 'centroid')
