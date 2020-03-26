/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var s2 = ee.ImageCollection("COPERNICUS/S2");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
Map.setCenter(4.8885, 52.9673, 11)

var image = ee.Image(s2.filterBounds(Map.getCenter()).toList(1, 0).get(0)).resample('bicubic').divide(10000)

Map.addLayer(image, { bands: ['B11', 'B8', 'B4'], min: 0, max: 0.35 })
Map.addLayer(image.normalizedDifference(['B11','B3']), { min: -1, max: 1 }, 'MNDWI')

var scale = Map.getScale()

var region = Map.getBounds(true)

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

Map.addLayer(pcImage, { bands: ['pc3', 'pc2', 'pc1'], min: 0, max: 1}, 'PC321')
Map.addLayer(pcImage, { bands: ['pc4', 'pc5', 'pc6'], min: 0, max: 1}, 'PC456')

var palette = ['000000', 'ff0000', 'ffff00', 'ffffff']

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
