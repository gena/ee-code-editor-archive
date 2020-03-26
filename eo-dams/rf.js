/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var classVegetation = /* color: #d63000 */ee.FeatureCollection(
        [ee.Feature(
            ee.Geometry.Polygon(
                [[[-43.45819221936273, -20.22571905024346],
                  [-43.45660435162591, -20.225759319333516],
                  [-43.45634685956048, -20.224833127623857],
                  [-43.45810638867425, -20.224994204839174]]]),
            {
              "class": 1,
              "system:index": "0"
            }),
        ee.Feature(
            ee.Geometry.Polygon(
                [[[-43.48311073990379, -20.23095762320154],
                  [-43.48448403091942, -20.231078426370377],
                  [-43.48461277695213, -20.232366987663745]]]),
            {
              "class": 1,
              "system:index": "1"
            }),
        ee.Feature(
            ee.Geometry.Polygon(
                [[[-43.463392902302814, -20.217958217399417],
                  [-43.46269552795894, -20.217505166813357],
                  [-43.46324269859798, -20.216951436527676]]]),
            {
              "class": 1,
              "system:index": "2"
            })]),
    classWater = /* color: #98ff00 */ee.FeatureCollection(
        [ee.Feature(
            ee.Geometry.Polygon(
                [[[-43.45093952618646, -20.21935640304298],
                  [-43.45123993359613, -20.219275861536868],
                  [-43.45162617169427, -20.220363168350907]]]),
            {
              "class": 2,
              "system:index": "0"
            }),
        ee.Feature(
            ee.Geometry.Polygon(
                [[[-43.43995319806146, -20.219316132295127],
                  [-43.44038235150384, -20.219195319989055],
                  [-43.44068275891351, -20.21971883930443]]]),
            {
              "class": 2,
              "system:index": "1"
            }),
        ee.Feature(
            ee.Geometry.Polygon(
                [[[-43.477032055483335, -20.21967856865042],
                  [-43.477804531679624, -20.21967856865042],
                  [-43.477761616335385, -20.220483979749986]]]),
            {
              "class": 2,
              "system:index": "2"
            }),
        ee.Feature(
            ee.Geometry.Polygon(
                [[[-43.40340626002262, -20.194639607666208],
                  [-43.403792498120765, -20.194629538381534],
                  [-43.403792498120765, -20.194720161920046],
                  [-43.40336334467838, -20.194720161920046]]]),
            {
              "class": 2,
              "system:index": "3"
            }),
        ee.Feature(
            ee.Geometry.Polygon(
                [[[-43.44137382949418, -20.194701908119544],
                  [-43.441320185313884, -20.194248789846704],
                  [-43.44172788108415, -20.194248789846704],
                  [-43.44172788108415, -20.194762323789668]]]),
            {
              "class": 2,
              "system:index": "4"
            })]),
    classSoil = /* color: #0b4a8b */ee.FeatureCollection(
        [ee.Feature(
            ee.Geometry.Polygon(
                [[[-43.442828526125425, -20.23047073088451],
                  [-43.44415890179681, -20.230551266593054],
                  [-43.44424473248529, -20.231598227007595]]]),
            {
              "class": 3,
              "system:index": "0"
            }),
        ee.Feature(
            ee.Geometry.Polygon(
                [[[-43.434588780031675, -20.233450524314673],
                  [-43.43518959485101, -20.233450524314673],
                  [-43.435103764162534, -20.23437666469138]]]),
            {
              "class": 3,
              "system:index": "1"
            }),
        ee.Feature(
            ee.Geometry.Polygon(
                [[[-43.46844898663568, -20.21601389549769],
                  [-43.46771942578363, -20.215248733067337],
                  [-43.46814857922601, -20.214725198710113],
                  [-43.46849190197992, -20.21573199398745]]]),
            {
              "class": 3,
              "system:index": "2"
            }),
        ee.Feature(
            ee.Geometry.Polygon(
                [[[-43.45488773785638, -20.220161815810563],
                  [-43.455574383364194, -20.21992019241814],
                  [-43.45626102887201, -20.220886683735973]]]),
            {
              "class": 3,
              "system:index": "3"
            }),
        ee.Feature(
            ee.Geometry.Polygon(
                [[[-43.438376686044535, -20.218765750454935],
                  [-43.439106246896586, -20.218705344099906],
                  [-43.43917061991294, -20.219188594283345],
                  [-43.43841960138877, -20.21943021881211]]]),
            {
              "class": 3,
              "system:index": "4"
            }),
        ee.Feature(
            ee.Geometry.Polygon(
                [[[-43.46164685726461, -20.209103650445243],
                  [-43.46334201336202, -20.208862009880935],
                  [-43.46336347103414, -20.20950638388544],
                  [-43.46171123028097, -20.20970775021475]]]),
            {
              "class": 3,
              "system:index": "5"
            }),
        ee.Feature(
            ee.Geometry.Polygon(
                [[[-43.439852966984404, -20.199881491951228],
                  [-43.439810051640166, -20.199116250217106],
                  [-43.44023920508255, -20.199559285363616]]]),
            {
              "class": 3,
              "system:index": "6"
            }),
        ee.Feature(
            ee.Geometry.Polygon(
                [[[-43.46521593542923, -20.20616438714998],
                  [-43.46560217352737, -20.20604356463333],
                  [-43.46616007300247, -20.20672822432113]]]),
            {
              "class": 3,
              "system:index": "7"
            }),
        ee.Feature(
            ee.Geometry.Polygon(
                [[[-43.457237720140256, -20.196331548093575],
                  [-43.45740401709918, -20.196558104365405],
                  [-43.45712506736163, -20.1966789342423],
                  [-43.456765651353635, -20.196633623049436]]]),
            {
              "class": 3,
              "system:index": "8"
            })]),
    classCloud = /* color: #ffc82d */ee.FeatureCollection(
        [ee.Feature(
            ee.Geometry.Polygon(
                [[[-43.47870800626521, -20.19596915382541],
                  [-43.47913715970759, -20.197439249852128],
                  [-43.476776815774485, -20.198647537566803]]]),
            {
              "class": 4,
              "system:index": "0"
            })]),
    classCloudShadow = /* color: #00ffff */ee.FeatureCollection(
        [ee.Feature(
            ee.Geometry.Polygon(
                [[[-43.479506745060576, -20.20044535187542],
                  [-43.4803221366011, -20.200928658756837],
                  [-43.480279221256865, -20.20266049609689]]]),
            {
              "class": 5,
              "system:index": "0"
            })]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
var image = ee.ImageCollection('COPERNICUS/S2')
  .filterBounds(Map.getCenter())
  .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 30))
  .first()
  .resample('bicubic')

print(image)
  
Map.addLayer(image, { min:0, max: 5000, bands: ['B12', 'B8', 'B4'] })

var features = classSoil.merge(classVegetation).merge(classWater).merge(classCloud).merge(classCloudShadow)

var samples = image.select('B.*').sampleRegions({
  collection: features, 
  scale: 10
})

print(samples.size())

var classifier = ee.Classifier.randomForest(5)

classifier = classifier.train(samples, 'class')

print(classifier.confusionMatrix())

var classes = image.classify(classifier)

Map.addLayer(classes.randomVisualizer())