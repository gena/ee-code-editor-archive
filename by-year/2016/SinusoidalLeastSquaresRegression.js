/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var geometry = /* color: d63000 */ee.Geometry.Polygon(
        [[[142.27569580078125, -31.846065691309544],
          [142.27294921875, -31.917198867419142],
          [142.36495971679688, -31.912536080050504],
          [142.36907958984375, -31.837899355285064]]]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
// SINUSOIDAL LEAST-SQUARES REGRESSION OF DAY VS LAND-SURFACE TEMPERATURE

// PART 1 - Define functions and standard variables.

var freq = (2 * Math.PI)/365.24;

var getQABits = function(image, start, end, newName) {
    // Compute the bits we need to extract.
    var pattern = 0;
    for (var i = start; i <= end; i++) {
       pattern += Math.pow(2, i);
    }
    return image.select([0], [newName])
                  .bitwiseAnd(pattern)
                  .rightShift(start);
};

// This function masks the input with a threshold on the simple cloud score.
var cloudMask = function(img) {
  var cloudscore = getQABits(img.select(['QC_Day']), 0, 1, 'QC_score').expression("b(0) == 2 || b(0) == 3");
  return img.updateMask(cloudscore.not());
};

// This function adds a band representing the image timestamp in days.
var addTime = function(image) {
  return image.addBands(image.metadata('system:time_start')
    .divide(1000 * 60 * 60 * 24 ));
};

// These three functions add the predictor bands, or gateaux.
var addG0 = function(image) {
  return image.addBands(ee.Image(1));
};

var addG1 = function(image) {
  return image.addBands(image.select(['system:time_start'],['G1']).multiply(freq).cos());
};

var addG2 = function(image) {
  return image.addBands(image.select(['system:time_start'],['G2']).multiply(freq).sin());
};

// This function adds a band representing the uncertainty in the measurements:
// (page 21, http://www.icess.ucsb.edu/modis/LstUsrGuide/MODIS_LST_products_Users_guide_C5.pdf)
// Bit == 0, uncertainty = 1.
// Bit == 1, uncertainty = 2.
// Bit == 2, uncertainty = 3
// Bit == 3, uncertainty > 3
var addUncert = function(image) {
  return image.addBands(getQABits(image.select(['QC_Day']), 6, 7, 'uncertainty_quantification').add(1).float());
};

var addTemp = function(image) {
  return image.addBands(image.select(['LST_Day_1km'],['Temp']).multiply(0.02));
};

// This function prepares the predictors and the response from the input.
var makeVariables = function(image) {
  // Return an image of the predictors followed by the response.
  return image.select(['constant','G1','G2','Temp','uncertainty_quantification'],
                      ['G0','G1','G2','Temp','uncertainty_quantification']);
};

// PART 2 - Perform the calculations

// Load the MODIS LST image collection.
var collection = ee.ImageCollection('MODIS/MOD11A1')
  // Filter to get only one year of data.
  .filterDate('2008-01-01', '2009-01-01')
  // Filter to get only imagery at a point of interest.
  //.map(function(i) { return i.mask(ee.Image(0).toByte().paint(geometry)) })
  .map(cloudMask)
  .map(addTime)
  .map(addTemp)
  .map(addG0)
  .map(addG1)
  .map(addG2)
  .map(addUncert);

// Define the axes of variation in the collection array.
var imageAxis = 0;
var bandAxis = 1;

// Convert the collection to an array.
var array = collection.map(makeVariables).toArray();

// Get slices of the array according to positions along the band axis.
var predictors = array.arraySlice(bandAxis, 0, 3);
var response = array.arraySlice(bandAxis, 3, 4);
var uncertainty = array.arraySlice(bandAxis, 4);
var weight = uncertainty.matrixToDiag().matrixInverse();

// Create new linear system: Am=X
var A = weight.matrixMultiply(predictors);
var X = weight.matrixMultiply(response);

// Compute coefficients the easiest way.
var coefficients = A.matrixSolve(X);
var residuals = X.subtract(A.matrixMultiply(coefficients));

// Compute goodness-of-fit
var freedom = residuals.arrayLength(0).subtract(3);
var chiSquared = residuals.matrixTranspose().matrixMultiply(residuals);
var chiSquared = chiSquared.divide(freedom);

// Rescale the covariance matrix to broaden uncertainties
var lambda = chiSquared.pow(-0.5)
var weight = uncertainty.matrixMultiply(lambda).matrixToDiag().matrixInverse();

// Create new linear system: Am=X
var A = weight.matrixMultiply(predictors);
var X = weight.matrixMultiply(response);

// Compute coefficients the easiest way.
var coefficients = A.matrixSolve(X);
var residuals = X.subtract(A.matrixMultiply(coefficients));

// Compute goodness-of-fit
var freedom = residuals.arrayLength(0).subtract(3);
var chiSquared = residuals.matrixTranspose().matrixMultiply(residuals);
var chiSquared = chiSquared.divide(freedom);

// Compute covariance of model
var covariance = A.matrixTranspose().matrixMultiply(A).matrixInverse();
var covarianceImage = covariance.arrayFlatten([['M1','M2','M3'],['M1','M2','M3']]);
var covarianceImage = covarianceImage.select(['M1_M1','M1_M2','M1_M3','M2_M2','M2_M3','M3_M3']);

// Turn the results into a multi-band image.
var coefficientsImage = coefficients
  // Get rid of the extra dimensions.
  .arrayProject([0])
  .arrayFlatten([
    ['Mean', 'B1', 'B2']
]);

var chiImage = chiSquared.arrayProject([0]).arrayFlatten([['Chi_Squared_red']]);

//Map.addLayer(coefficientsImage);
Map.addLayer(covarianceImage);
