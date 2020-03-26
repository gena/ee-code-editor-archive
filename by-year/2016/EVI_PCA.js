// Load a Fusion Table from the ID using the FeatureCollection constructor.
var fc = ee.FeatureCollection('ft:1LZJ-YYH_trQ1m_Hvo6a4ZIgfIlCqolB2HpTBOIlH', 'geometry');

// Load the full collection of Landsat 5 EVI annual composites
var eviCollection = ee.ImageCollection('LANDSAT/LT5_L1T_ANNUAL_EVI')
  .filterBounds(fc);

// Display the input imagery and the region in which to do the PCA.
var region = ee.Feature(fc.first());
var regionGeom = region.geometry();
Map.centerObject(region, 11);
Map.addLayer(ee.Image().paint(region, 0, 2), {}, 'Region');

// Get some information about the input to be used later.

var scale = 90 // ee.Image(eviCollection.first()).select(0).projection().nominalScale();

// drop empty
function dropEmpty(collection, region, scale) {
  var crs = ee.Image(collection.first()).projection()
  
  function addAny(i) {
    var any = i
      .reduceRegion({
          reducer: ee.Reducer.anyNonZero(), 
          geometry: region, 
          scale: scale
      }).values().get(0)

    return i.set('any', any)
  }
  
  return collection
    .map(addAny)
    .filter(ee.Filter.eq('any', 1))
}

eviCollection = dropEmpty(eviCollection, regionGeom, 300)

function getCenteredCovariance(image) {
  var meanDict = image.reduceRegion({
      reducer: ee.Reducer.mean(),
      geometry: regionGeom,
      scale: scale,
      maxPixels: 1e9
  });
  
  var meanImage = ee.Image.constant(meanDict.values()).float()
  
  return image.subtract(meanImage)
}

// Mean center the data to enable a faster covariance reducer
// and an SD stretch of the principal components.

var eviCollCentered = eviCollection.map(getCenteredCovariance);

// This helper function returns a list of new band names.
var getNewBandNames = function(prefix) {
  var seq = ee.List.sequence(1, eviCollection.size());
  return seq.map(function(b) {
    return ee.String(prefix).cat(ee.Number(b).int());
  });
};

// This function accepts mean centered imagery, a scale and
// a region in which to perform the analysis.  It returns the
// Principal Components (PC) in the region as a new image.
var getPrincipalComponents = function(centered, scale, regionGeom) {
  // Collapse the bands of the image into a 1D array per pixel.
  var arrays = centered.toArray();
  
  // Compute the covariance of the bands within the region.
  var covar = arrays.reduceRegion({
    reducer: ee.Reducer.centeredCovariance(),
    geometry: regionGeom,
    scale: scale,
    maxPixels: 1e9
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
    .arrayProject([0]);

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

// reduceRegion() does not work for image collection, but you can turn time steps into bands
var bandNames = ee.List.sequence(1, eviCollCentered.size()).map(function(i) {
  return ee.String('EVI').cat(ee.Number(i).format('%d'))
})

// fill in all values so that we can turn image collection into multiband image
var eviCollCentered = eviCollCentered.map(function(i) {
  return i.unmask(0, false)
})

// turn image collection into multiband image, with a band per time step
var multiband = eviCollCentered
  .toArray()
  .matrixTranspose(0, 1).arrayProject([1]).arrayFlatten([bandNames])

var pcImage = getPrincipalComponents(multiband, scale, regionGeom)
  .clip(regionGeom);

// add PCs to map
pcImage.bandNames().getInfo().map(function(band) {
  Map.addLayer(pcImage.select(band), {min: -2, max: 2}, band, band === 'pc1')
})
