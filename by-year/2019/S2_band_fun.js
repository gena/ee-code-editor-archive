var images = ee.ImageCollection('COPERNICUS/S2')
  .filterDate('2016-01-01', '2017-01-01')
  .select(['B11', 'B12', 'B8', 'B4', 'B3', 'B2', 'B10', 'B1'], 
    ['swir', 'swir2', 'nir', 'red', 'green', 'blue', 'cirrus', 'blue2'])
  .filterBounds(Map.getBounds(true))

var stddevNdvi = images
  .map(function(i) { return i.divide(10000).normalizedDifference(['nir','red']).updateMask(i.select('nir').lt(4000))})
  .reduce(ee.Reducer.stdDev())


var show = function(image, name) {
  Map.addLayer(image, {min:0, max:0.5}, name)
}

var rescale = function(img, exp, thresholds) {
  img = img.expression(exp, {img: img})
  img = img.subtract(thresholds[0])
  img = img.where(img.lt(0), 0)
  img = img.divide(thresholds[1] - thresholds[0])
  
  return img
};

function computeCloudScore(img) {
  // Compute several indicators of cloudyness and take the minimum of them.
  var score = ee.Image(1.0);

  // Clouds are reasonably bright in the blue band.
  score = score.min(rescale(img, 'img.blue', [0.1, 0.5])).aside(show, 'score');

  // clouds are not sand
  var sand = rescale(stddevNdvi, 'img', [0.0, 0.2])
  score = score.min(sand).aside(show, 'score sand')

  // Clouds are reasonably bright in cirrus band
  score = score.max(rescale(img, 'img.cirrus', [0.0, 0.3])).aside(show, 'score cirrus');

  //Clouds are moist
  // var ndmi = img.normalizedDifference(['nir','swir']);
  //score = score.min(rescale(ndmi, 'img', [-0.05, 0.05])).aside(show, 'score ndmi');


  // var ndmi = img.normalizedDifference(['nir','swir']);
  //score = score.min(rescale(ndmi, 'img', [-0.05, 0.05])).aside(show, 'score ndmi');

  // Clouds are reasonably bright in all infrared bands.
  // score = score.min(rescale(img, 'img.nir + img.swir + img.swir2', [0.2, 0.5])).aside(show, 'score ir');

  return score.rename('cloud_score');
}

function addCloudScore(img) {
  return img.addBands(computeCloudScore(img), ['cloud_score'])
}



var image = ee.Image('COPERNICUS/S2/20160819T105032_20160819T161132_T31UFV')
  .select(['B11', 'B12', 'B8', 'B4', 'B3', 'B2', 'B10', 'B1'], 
    ['swir', 'swir2', 'nir', 'red', 'green', 'blue', 'cirrus', 'blue2'])
    .divide(10000)


Map.addLayer(stddevNdvi, {min:0.0, max:0.1}, 'NDVI STDDEV', false)


//Map.centerObject(image)

Map.addLayer(image.select(['swir', 'nir', 'red']), {min:0.05, max:0.35}, 'image')

Map.addLayer(image.select(['cirrus']), {min:0.0, max:0.1}, 'image (cirrus)', false)


// https://www.researchgate.net/publication/235577590_Sand_dunes_monitoring_using_remote_sensing_and_GIS_techniques_for_some_sites_in_Iraq
Map.addLayer(image.normalizedDifference(['swir','red']), {min:-0.05, max:0.5}, 'NDSI (sand)', false)

Map.addLayer(image.normalizedDifference(['nir','red']), {min:-0.05, max:0.5}, 'NDVI', false)
Map.addLayer(image.normalizedDifference(['nir','swir']), {min:-0.05, max:0.5}, 'NDMI', false)
Map.addLayer(image.normalizedDifference(['swir','swir2']), {min:-0.05, max:0.25}, 'SWIR1 / SWIR2', false)
Map.addLayer(image.normalizedDifference(['blue2','blue']), {min:-0.05, max:0.25}, 'deepblue / blue', false)
Map.addLayer(image.normalizedDifference(['blue2','blue']).multiply(100).int().entropy(ee.Kernel.circle(3)), {min:0, max:2}, 'deepblue / blue entropy', false)

image = addCloudScore(image)
Map.addLayer(image.select('cloud_score'), {min:0, max:0.5}, 'cloud score')

var th = 0.2

Map.addLayer(image.mask(image.select('cloud_score').lt(th)).select(['swir','nir','green']), {min:0, max:0.5}, 'masked')
