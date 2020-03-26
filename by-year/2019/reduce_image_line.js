/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var line = /* color: #d63000 */ee.Geometry.LineString(
        [[-114.38432042297927, 36.425770357946675],
         [-114.3616653145275, 36.42204162586376],
         [-114.35145335239042, 36.42031530110272],
         [-114.34192790857225, 36.41997003174591],
         [-114.3116352816624, 36.422801199435874]]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
var utils = require('users/gena/packages:utils')

// test
var dem = ee.Image('USGS/NED')
var images = ee.ImageCollection('COPERNICUS/S2').filterBounds(line)
var image = ee.Image(images.first()).select(['B11','B8','B4']).divide(10000)

// combine dem and S2 images
var combined = dem.addBands(image.select('B8'))

// generate profile
var scale = 10
var profile = utils.reduceImageProfile(combined, line, ee.Reducer.max(), scale)

// show profile in two charts for two image bands, distance represents distance along the line
print(ui.Chart.feature.byFeature(profile, 'distance', ['elevation']))
print(ui.Chart.feature.byFeature(profile, 'distance', ['B8']))

// show map layers
Map.addLayer(dem, {min: 300, max: 500}, 'DEM')
Map.addLayer(image, {min: 0.05, max: 0.4}, 'image')

