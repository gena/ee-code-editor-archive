/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var geometry = /* color: #d63000 */ee.Geometry.LineString(
        [[-120.17309188842773, 39.389907335002306],
         [-120.13781547546387, 39.37000434240616]]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
/***
 * Generates image collection gallery.
 */
var gallery = function(images, region, rows, columns) {
  var proj = ee.Image(images.first()).select(0).projection()
  var scale = proj.nominalScale()
  
  var e = ee.ErrorMargin(1)

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

  var w = ee.Number(ee.List(coords.get(1)).get(0)).subtract(ee.List(coords.get(0)).get(0))
  var h = ee.Number(ee.List(coords.get(2)).get(1)).subtract(ee.List(coords.get(0)).get(1))
  
  var boundsImage = ee.Image().toInt().paint(bounds, 1).reproject(proj)
  
  // new region
  var ll = ee.List(coords.get(0))
  var ur = [ee.Number(ll.get(0)).add(w.multiply(columns)), ee.Number(ll.get(1)).add(h.multiply(rows))]
  
  var regionNew = ee.Geometry.Rectangle([ll, ur], proj, false)
  
  var mosaic = images
    .map(function(i) {
      var offset = ee.List(offsetByImage.get(i.get('system:index')))
      var xoff = w.multiply(offset.get(0)).multiply(scale)
      var yoff = h.multiply(offset.get(1)).multiply(scale)
  
      i = i.updateMask(boundsImage)
      
      return i.translate(xoff, yoff, 'meters', proj)
  }).mosaic()
  
  return {image: mosaic, region: regionNew};
}

/**
 * Compute the Principal Components of a Landsat 8 image.
 */

var region = ee.Geometry(Map.getBounds(true))
region = geometry

function addAny(i) {
  return i.set('any', i.select(0).mask().reduceRegion(ee.Reducer.anyNonZero(), region).values().get(0))
}

// Load a landsat 8 image, select the bands of interest.
var images = ee.ImageCollection('LANDSAT/LC8_L1T_TOA').filterBounds(region.centroid(1))
  .filterDate('2015-01-01', '2017-01-01')
  .select(['B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8', 'B9', 'B10', 'B11'])
  .map(function(i) { return i
      .addBands(i.normalizedDifference(['B5', 'B4']).rename('NDVI'))
      .addBands(i.normalizedDifference(['B6', 'B3']).rename('MNDWI'))
      .addBands(i.normalizedDifference(['B5', 'B3']).rename('NDWI'))
  })
  .map(addAny)
  .filter(ee.Filter.eq('any', 1))

var rows = 5
var columns = 8
var g = gallery(images, region, rows, columns)

region = g.region  

var image = g.image
// var image = ee.Image(images.toList(1, 3).get(0))

/*
image = image
  .addBands(image.normalizedDifference(['B3', 'B5']).rename('NDWI'))
  .addBands(image.normalizedDifference(['B3', 'B6']).rename('MNDWI'))
  .addBands(image.normalizedDifference(['B4', 'B5']).rename('NDVI'))
*/  

var palette = ['000000', 'ff0000', 'ffff00', 'ffffff']
  
Map.addLayer(image, {bands: ['B4', 'B3', 'B2'], min: 0.05, max: 0.4}, 'Original Image');
Map.addLayer(image, {bands: ['B6', 'B5', 'B3'], min: 0.05, max: 0.4}, 'Original Image (swir1/nir/green)');

var ndwi = image.select('NDWI')
var minMax = ee.List(ndwi.reduceRegion(ee.Reducer.percentile([1, 99]), region, 30).values())
ndwi = ndwi.unitScale(minMax.get(0), minMax.get(1))
Map.addLayer(ndwi, {min: 1, max: 0, palette: palette}, 'Original Image (NDWI)');

var mndwi = image.select('MNDWI')
var minMax = ee.List(mndwi.reduceRegion(ee.Reducer.percentile([1, 99]), region, 30).values())
mndwi = mndwi.unitScale(minMax.get(0), minMax.get(1))
Map.addLayer(mndwi, {min: 1, max: 0, palette: palette}, 'Original Image (MNDWI)', false);

var scale = 15

// Get some information about the input to be used later.
var bandNames = image.bandNames();

// Mean center the data to enable a faster covariance reducer
// and an SD stretch of the principal components.
var meanDict = image.reduceRegion({
    reducer: ee.Reducer.mean(),
    geometry: region,
    scale: scale,
    maxPixels: 1e9,
    //crs: region.projection()
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
// a region in which to perform the analysis.  It returns the
// Principal Components (PC) in the region as a new image.
var getPrincipalComponents = function(centered, scale, region) {
  // Collapse the bands of the image into a 1D array per pixel.
  var arrays = centered.toArray();

  // Compute the covariance of the bands within the region.
  var covar = arrays.reduceRegion({
    reducer: ee.Reducer.centeredCovariance(),
    geometry: region,
    scale: scale,
    maxPixels: 1e9
  });
  
  print(covar)

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

// Get the PCs at the specified scale and in the specified region
var pcImage = getPrincipalComponents(centered, scale, region);

// Plot each PC as a new layer
bandNames.length().getInfo(function(length) {
  pcImage.bandNames().getInfo(function(bandNames) {
    for (var i = 0; i < length; i++) {
      var band = bandNames[i];
      var pc = pcImage.select([band])
      var minMax = ee.List(pc.reduceRegion(ee.Reducer.percentile([1, 99]), region, 30).values())
      print(minMax)
      pc = pc.unitScale(minMax.get(0), minMax.get(1))
      Map.addLayer(pc, {min: 0, max: 1, palette: palette}, band, i === 2);
    }
  })
})

