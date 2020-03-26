var utils = require('users/gena/packages:utils')
var colorbrewer = require('users/gena/packages:colorbrewer')

var region = ee.Geometry(Map.getBounds(true))
var scale = Map.getScale()
var vis = {min: 0, max: 1, forceRgbOutput: true}

// add ll-lr line
var coords = ee.Array(region.coordinates()).slice(1, 0, 2).project([1, 2]).toList()
var line = ee.Geometry.LineString(coords)
Map.addLayer(line, {}, 'line')

// generate an image
function f() {
  var x = ee.Image.pixelLonLat().select(0).sin()
  var a = -0.8
  var b = -0.2
  var c = 0.9
  var d = 0.5
  
  return x.pow(3).multiply(a).add(x.pow(2).multiply(b)).add(x.multiply(c)).add(d)
}

var image = f()

Map.addLayer(image, vis, 'f', true)
var profile = utils.reduceImageProfile(image, line, ee.Reducer.first(), scale)
print(ui.Chart.feature.byFeature(profile, 'distance')
  .setChartType('ScatterChart')
  .setOptions({
    title: 'Original',
    pointSize: 1, 
    vAxis: { viewWindow: { min: -0.1, max: 1.1} } 
  })
)

// add some normally distributed noise
var noise = utils.norm().multiply(0.1)
var imageNoisy = image.add(noise)

Map.addLayer(imageNoisy, vis, 'f + noise', true)
var profile = utils.reduceImageProfile(imageNoisy, line, ee.Reducer.first(), scale)
print(ui.Chart.feature.byFeature(profile, 'distance')
  .setChartType('ScatterChart')
  .setOptions({
    title: 'Noisy',
    pointSize: 1, 
    vAxis: { viewWindow: { min: -0.1, max: 1.1} } 
  })
)

// generate training set
var kernel = ee.Kernel.square(5)
var training = imageNoisy.neighborhoodToBands(kernel).addBands(image.rename('y')).sample({
  region: region, 
  scale: scale,
  numPixels: 5000
})

// fit SVM regression
var regressor = ee.Classifier.randomForest(100)
  .setOutputMode('REGRESSION')

// crashes
// var regressor = ee.Classifier.svm({
//   decisionProcedure: 'Margin', 
//   svmType: 'EPSILON_SVR',
//   kernelType: 'RBF'
// }).setOutputMode('REGRESSION')

regressor = regressor.train(training, 'y')

// predict results
var imagePredicted = imageNoisy.neighborhoodToBands(kernel).classify(regressor)

Map.addLayer(imagePredicted, {}, 'predicted image')

var profile = utils.reduceImageProfile(imagePredicted, line, ee.Reducer.first(), scale)
print(ui.Chart.feature.byFeature(profile, 'distance')
  .setChartType('ScatterChart')
  .setOptions({
    title: 'Predicted',
    pointSize: 1,
    vAxis: { viewWindow: { min: -0.1, max: 1.1} } 
  })
)

var error = imagePredicted.subtract(image)
Map.addLayer(error.mask(error.abs().multiply(10)), {min: -0.1, max: 0.1, palette: colorbrewer.Palettes.RdYlGn[5]}, 'error')

var rmse = ee.Number(error.pow(2).reduceRegion(ee.Reducer.mean(), region, scale * 5).get('classification')).sqrt()
print('RMSE: ', rmse)

var minMax = image.reduceRegion(ee.Reducer.minMax(), region, scale * 5)
var range = ee.Number(minMax.values().get(0)).subtract(minMax.values().get(1)).abs()

var nrmse = rmse.divide(range).multiply(100)
print('NRMSE (%): ', nrmse)














/*
// try simple median filter
var imagePredicted = imageNoisy.reduceNeighborhood(ee.Reducer.median(), ee.Kernel.circle(5))
Map.addLayer(imagePredicted, {}, 'image (median filter)', false)

var profile = utils.reduceImageProfile(imagePredicted, line, ee.Reducer.first(), scale)
print(ui.Chart.feature.byFeature(profile, 'distance')
  .setChartType('ScatterChart')
  .setOptions({
    title: 'Predicted (median)',
    pointSize: 1,
    vAxis: { viewWindow: { min: -0.1, max: 1.1} } 
  })
)

var error = imagePredicted.subtract(image)
Map.addLayer(error.mask(error.abs().multiply(10)), {min: -0.1, max: 0.1, palette: colorbrewer.Palettes.RdYlGn[5]}, 'error (median)', false)
var rmse = ee.Number(error.pow(2).reduceRegion(ee.Reducer.mean(), region, scale * 5).get('longitude_median')).sqrt()
print('RMSE: ', rmse)

var minMax = image.reduceRegion(ee.Reducer.minMax(), region, scale * 5)
var range = ee.Number(minMax.values().get(0)).subtract(minMax.values().get(1)).abs()

var nrmse = rmse.divide(range).multiply(100)
print('NRMSE (%): ', nrmse)
*/