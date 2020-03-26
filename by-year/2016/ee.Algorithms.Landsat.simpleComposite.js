// The implementation of ee.Algorithms.Landsat.simpleComposite
function TOAComposite(collection,
                      asFloat,
                      percentile,
                      cloudScoreRange,
                      maxDepth) {

  // Select a sufficient set of images, and compute TOA and cloudScore.
  var prepared =
      ee.Algorithms.Landsat.pathRowLimit(collection, maxDepth, 4 * maxDepth)
                   .map(ee.Algorithms.Landsat.TOA)
                   .map(ee.Algorithms.Landsat.simpleCloudScore);

  // Determine the per-pixel cloud score threshold.
  var cloudThreshold = prepared.reduce(ee.Reducer.min())
                               .select('cloud_min')
                               .add(cloudScoreRange);

  // Mask out pixels above the cloud score threshold, and update the mask of
  // the remaining pixels to be no higher than the cloud score mask.
  function updateMask(image) {
    var cloud = image.select('cloud');
    var cloudMask = cloud.mask().min(cloud.lte(cloudThreshold));
    // Drop the cloud band and QA bands.
    image = image.select('B[0-9].*');
    return image.mask(image.mask().min(cloudMask));
  }
  var masked = prepared.map(updateMask);

  // Take the (mask-weighted) median (or other percentile)
  // of the good pixels.
  var result = masked.reduce(ee.Reducer.percentile([percentile]));

  // Force the mask up to 1 if it's non-zero, to hide L7 SLC artifacts
  result = result.mask(result.mask().gt(0));

  // Clean up the band names by removing the suffix that reduce() added.
  var badNames = result.bandNames();
  var goodNames = badNames.map(
          function(x) { return ee.String(x).replace('_[^_]*$', ''); });
  result = result.select(badNames, goodNames);

  if (!asFloat) {
    // Scale reflective bands by 255, and offset thermal bands by -100.
    // These lists are only correct for Landsat 8; different lists are
    // used for the other instruments.
    var scale = [ 255, 255, 255, 255, 255, 255, 255, 255, 255, 1, 1 ];
    var offset = [ 0, 0, 0, 0, 0, 0, 0, 0, 0, -100, -100 ];
    result = result.multiply(scale).add(offset).round().uint8();
  }
  return result;
}

// For example, here's a simple composite of Landsat 8 imagery
// from 6 months of 2015.
var imgs = ee.ImageCollection('LANDSAT/LC8_L1T')
      .filterDate('2015-04-01', '2015-10-01');
// These are the default values used by the original algorithm,
// except for asFloat.
var comp = TOAComposite(imgs, true, 50, 10, 40);

Map.addLayer(comp, {bands:['B4', 'B3', 'B2'], max: 0.3});
