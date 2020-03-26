// SimpleCloudScore, an example of computing a cloud-free composite with L8
// by selecting the least-cloudy pixel from the collection.

// A mapping from a common name to the sensor-specific bands.
var S2_BANDS = [ 'B2',  'B3',   'B4', 'B8', 'B11',   'B12',   'B1', 'B10'];
var STD_NAMES = ['blue', 'green', 'red', 'nir', 'swir1', 'swir2', 'cb',  'cirrus'];

// Compute a cloud score.  This expects the input image to have the common
// band names: ["red", "blue", etc], so it can work across sensors.
var cloudScore = function(img) {
  img = img.select(S2_BANDS, STD_NAMES)
  // A helper to apply an expression and linearly rescale the output.
  var rescale = function(img, exp, thresholds) {
    return img.expression(exp, {img: img})
        .subtract(thresholds[0]).divide(thresholds[1] - thresholds[0]);
  };
  var score = ee.Image(1.0);
  score = score.min(rescale(img, 'img.cirrus', [0, 0.1]))
  score = score.min(rescale(img, 'img.cb', [0.5, 0.8]))
  return score.min(rescale(img.normalizedDifference(['green', 'swir1']), 'img', [0.8, 0.6]));
};

// Filter the TOA collection to a time-range and add the cloudscore band.
var collection = ee.ImageCollection('COPERNICUS/S2').select("B.*")
    .filterDate('2016-01-01', '2016-02-01')
    .map(function(img) {
      img = img.divide(10000)
      // Invert the cloudscore so 1 is least cloudy, and rename the band.
      var score = cloudScore(img);
      score = ee.Image(1).subtract(score).select([0], ['cloudscore']);
      return img.addBands(score);
    });

// Define visualization parameters for a true color image.
var vizParams = {'bands': ['B4', 'B3', 'B2'], 'max': 0.4, 'gamma': 1.6};
Map.addLayer(collection, vizParams, "collection", false);
Map.addLayer(collection.qualityMosaic('cloudscore'), vizParams);
