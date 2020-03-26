// center map to San Francisco
print(Map.getCenter())
//Map.setCenter(-122.43, 37.79, 13)

// select first Landsat 8 scene
var images = ee.ImageCollection('LANDSAT/LC8_L1T_TOA')
  .filterBounds(Map.getBounds(true))
  .select(['B6', 'B5', 'B3']);

// select a single image
var image = ee.Image(images.first())

// select percentile
var image = ee.Image(images.reduce(ee.Reducer.percentile([15])))
  .rename(['B6', 'B5', 'B3'])
  .reproject(ee.Image(images.first()).projection());

// add image as a map layer
var vis = {min: 0.03, max: [0.4, 0.4, 0.6]}
Map.addLayer(image, vis, 'image')

// generate CDF on a coarser grid
function cdfScaled(i, opt_scale) {
  var scale = opt_scale || 10;
  var prj = i.projection().scale(scale, scale);
  var percentiles = ee.List.sequence(0, 100, 2);
  var percentileNames = percentiles.map(function(p) { return ee.String(ee.Number(p).toInt()) })
  var percentileImages = i
    .reduceResolution({reducer: ee.Reducer.percentile(percentiles), maxPixels: 100})
    .reproject(prj)
    .rename(percentileNames);
    
  return ee.ImageCollection(percentileImages)
}

// add results to map
Map.addLayer(cdfScaled(image.select('B6')), {min: 0.03, max:0.4}, 'cdf (swir1)', true)
Map.addLayer(cdfScaled(image.select('B5')), {min: 0.03, max:0.4}, 'cdf (nir)', false)
Map.addLayer(cdfScaled(image.select('B3')), {min: 0.03, max:0.4}, 'cdf (green)', false)
