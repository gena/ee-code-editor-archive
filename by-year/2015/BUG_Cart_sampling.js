/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var l8 = ee.ImageCollection("LANDSAT/LC8_L1T_TOA"),
    water = /* color: d63000 */ee.FeatureCollection(
        [ee.Feature(
            ee.Geometry.Polygon(
                [[[13.928432110350286, 46.658626630955006],
                  [13.940105504817211, 46.66322146531567],
                  [13.93821702394257, 46.66640255300673],
                  [13.925685374949808, 46.663457157921705]]]),
            {
              "system:index": "0"
            })]),
    cloud_shadow = /* color: 98ff00 */ee.FeatureCollection(
        [ee.Feature(
            ee.Geometry.Polygon(
                [[[13.90268325805664, 46.707499459182635],
                  [13.903026580810547, 46.70879427751824],
                  [13.900279998779297, 46.711030708757704],
                  [13.89993667602539, 46.70820572757977]]]),
            {
              "system:index": "0"
            })]),
    cloud = /* color: 0b4a8b */ee.FeatureCollection(
        [ee.Feature(
            ee.Geometry.Polygon(
                [[[13.914356231689453, 46.697492997441415],
                  [13.912124633789062, 46.699729896899235],
                  [13.911609649658203, 46.69808166417803],
                  [13.914356231689453, 46.69584469643743]]]),
            {
              "system:index": "0"
            })]),
    land = /* color: ffc82d */ee.FeatureCollection(
        [ee.Feature(
            ee.Geometry.Polygon(
                [[[13.957786560058594, 46.66852266867603],
                  [13.95040512084961, 46.686778141551585],
                  [13.934097290039062, 46.68147880091785],
                  [13.946456909179688, 46.665106443674155]]]),
            {
              "system:index": "0"
            })]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
print(Map.getCenter())
Map.setCenter(13.95, 46.68, 13)

var bounds = Map.getBounds(true);

/*
var image = ee.Image(l8.select(['B6','B5','B3'])
    .filterBounds(ee.Geometry(bounds).centroid(1))
    .filterMetadata('CLOUD_COVER', 'less_than', 10).first())
    .clip(bounds)
print(image)
*/    

var image = ee.Image('LANDSAT/LC8_L1T_TOA/LC81910272013208LGN00').select(['B6','B5','B3']);

Map.addLayer(image, {min:0.05, max:0.5}, 'image')

function setClass(featureCollection, value) {
  return featureCollection.map(function(f) { return f.set('class', value) })
}

var water = setClass(water, 1)
var land = setClass(land, 2)
var cloud = setClass(cloud, 3)
var cloud_shadow = setClass(cloud_shadow, 4)

var trainingFeatures = water.merge(land).merge(cloud).merge(cloud_shadow)
Map.addLayer(trainingFeatures, {}, 'training (features)', false)

var training = image.sampleRegions(trainingFeatures, ['class']);

var classifier = ee.Classifier.cart({maxDepth:20}).train(training, 'class');
  
var trainAccuracy = classifier.confusionMatrix();
print('Resubstitution error matrix: ', trainAccuracy);
print('Training overall accuracy: ', trainAccuracy.accuracy());

var p = {palette: ['0000FF','00FF00','FFFFFF', '000000'], min:1, max: 4}

var trainingImage = trainingFeatures.reduceToImage({properties: ['class'], reducer: ee.Reducer.first()});
Map.addLayer(trainingImage, p, 'training', false)

var trainingClassified = image.clip(trainingFeatures).classify(classifier)
Map.addLayer(trainingClassified.mask(trainingClassified), p, 'training, classified', false)

var trainingError = trainingClassified.neq(trainingImage)
trainingError = trainingError.mask(trainingError)

Map.addLayer(trainingError, {palette:['ff0000']}, 'training error (buffer)')
