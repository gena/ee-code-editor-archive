var assets = require('users/gena/packages:assets')

Map.setCenter(89.0093, 31.8367, 11) // Tibetan Plateau

// Add a band containing image date as years since 1991.
function createTimeBand(img) {
  var year = ee.Date(img.get('system:time_start')).get('year').subtract(1980);
  return ee.Image(year).rename('year').byte().addBands(img).copyProperties(img, ['system:time_start']);
}

// compute wetness
function computeWetness(img) {
  var ndwi = img.normalizedDifference(['green', 'nir']).rename('wetness')
  
  return ee.Image(img).addBands(ndwi);
}

// query images
var bounds = Map.getBounds(true)

var images = assets.getImages(bounds, { 
  missions: ['L4', 'L5', 'L7', 'L8' ]
})

print(images.size())

Map.addLayer(images.select(0).count(), { min: 1000, max: 2000 }, 'count', false)

// convert to annual percentiles
var bandNames = images.first().bandNames()
var years = ee.List.sequence(1985, 2015)
images = years.map(function(year) {
  var t0 = ee.Date.fromYMD(year, 1, 1)
  var t1 = t0.advance(1, 'year')
  
  var images2 = images.filterDate(t0, t1)
  
  return images2.reduce(ee.Reducer.percentile([20])).rename(bandNames)
    .set({
      'system:time_start': t0.millis(),
      imageCount: images2.size()
    })
})

images = ee.ImageCollection(images).filter(ee.Filter.gt('imageCount', 0))

// add raw images (for inspection)
Map.addLayer(images, {}, 'raw', false)

// compute NDWI
images = images
  .map(createTimeBand)
  .map(computeWetness)
  .select(['year', 'wetness'])

Map.addLayer(images.select('wetness'), {}, 'raw (NDWI)', false)

var fit = images.reduce(ee.Reducer.linearFit());

// Display trend in red/blue, brightness in green.
Map.addLayer(fit.select('scale'),
         {min: -0.02, max: 0.02, palette: ['00ff00', '000000', '00ffff']},
         'trend');


// TOOD: make scale close to zero transparent

// TODO: add a plot to detect *when* these surface water changes have occured
// TIP: use reduce region (sum) on NDWI applied to the line along the changed area

// TODO: add a plot showing raw and average images
