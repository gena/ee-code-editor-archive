var l8 = ee.ImageCollection("LANDSAT/LC8_L1T_TOA")

// Add a band containing image date as years since 1991.
function createTimeBand(img) {
  var year = ee.Date(img.get('system:time_start')).get('year').subtract(1991);
  return ee.Image(ee.Image(year).rename('year')).byte().addBands(img);
}

// compute wetness
function computeWetness(img) {
  var ndwi = img.normalizedDifference(['B3', 'B6']).rename('wetness')
  
  return ee.Image(img).addBands(ndwi);
}

// compute NDWI
var images = l8
  .filterBounds(Map.getCenter())
  .map(createTimeBand)
  .map(computeWetness)
  .select(['year', 'wetness'])

print(images.first())

var fit = images.reduce(ee.Reducer.linearFit());

// Display trend in red/blue, brightness in green.
Map.addLayer(fit,
         {min: 0, max: [0.18, 20, -0.18], bands: ['scale', 'offset', 'scale']},
         'stable lights trend');

