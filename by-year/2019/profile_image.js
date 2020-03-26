/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var line = /* color: #d63000 */ee.Geometry.LineString(
        [[-114.38071574170414, 36.42577017009133],
         [-114.35806063330716, 36.4220414380084],
         [-114.34784867119481, 36.42031511324735],
         [-114.33832322739971, 36.41996984389055],
         [-114.30803060056314, 36.42280101158056]]);
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
Map.addLayer(ee.Terrain.hillshade(dem), {min: 0, max: 255}, 'hillshade')
Map.addLayer(image, {min: 0.05, max: 0.4}, 'image')

