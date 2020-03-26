/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var Forested = /* color: 98ff00 */ee.FeatureCollection(
        [ee.Feature(
            ee.Geometry.Point([-54.68994140625, -12.0178303377682]),
            {
              "forested": 1,
              "system:index": "0"
            }),
        ee.Feature(
            ee.Geometry.Point([-54.6240234375, -11.60919340793894]),
            {
              "forested": 1,
              "system:index": "1"
            }),
        ee.Feature(
            ee.Geometry.Point([-54.953269958496094, -12.172924166046865]),
            {
              "forested": 1,
              "system:index": "2"
            }),
        ee.Feature(
            ee.Geometry.Point([-54.950523376464844, -12.185341200193289]),
            {
              "forested": 1,
              "system:index": "3"
            }),
        ee.Feature(
            ee.Geometry.Point([-54.933013916015625, -12.224602049269444]),
            {
              "forested": 1,
              "system:index": "4"
            }),
        ee.Feature(
            ee.Geometry.Point([-55.06072998046875, -12.226615269200764]),
            {
              "forested": 1,
              "system:index": "5"
            }),
        ee.Feature(
            ee.Geometry.Point([-55.05626678466797, -12.180978524651163]),
            {
              "forested": 1,
              "system:index": "6"
            }),
        ee.Feature(
            ee.Geometry.Point([-55.092315673828125, -12.22728633910496]),
            {
              "forested": 1,
              "system:index": "7"
            }),
        ee.Feature(
            ee.Geometry.Point([-54.890785217285156, -12.217220111747977]),
            {
              "forested": 1,
              "system:index": "8"
            }),
        ee.Feature(
            ee.Geometry.Point([-54.88048553466797, -12.224937586989059]),
            {
              "forested": 1,
              "system:index": "9"
            }),
        ee.Feature(
            ee.Geometry.Point([-54.80598449707031, -12.216884564239379]),
            {
              "forested": 1,
              "system:index": "10"
            }),
        ee.Feature(
            ee.Geometry.Point([-55.27153015136719, -12.168225677390106]),
            {
              "forested": 1,
              "system:index": "11"
            })]),
    NonForested = /* color: 0b4a8b */ee.FeatureCollection(
        [ee.Feature(
            ee.Geometry.Point([-55.152740478515625, -12.254127737657367]),
            {
              "forested": 0,
              "system:index": "0"
            }),
        ee.Feature(
            ee.Geometry.Point([-55.13969421386719, -12.243391505623274]),
            {
              "forested": 0,
              "system:index": "1"
            }),
        ee.Feature(
            ee.Geometry.Point([-55.15205383300781, -12.273586044299293]),
            {
              "forested": 0,
              "system:index": "2"
            }),
        ee.Feature(
            ee.Geometry.Point([-55.15342712402344, -12.256140732531454]),
            {
              "forested": 0,
              "system:index": "3"
            }),
        ee.Feature(
            ee.Geometry.Point([-55.2996826171875, -12.270902225352646]),
            {
              "forested": 0,
              "system:index": "4"
            }),
        ee.Feature(
            ee.Geometry.Point([-55.30998229980469, -12.240707379385759]),
            {
              "forested": 0,
              "system:index": "5"
            }),
        ee.Feature(
            ee.Geometry.Point([-55.325775146484375, -12.22728633910496]),
            {
              "forested": 0,
              "system:index": "6"
            }),
        ee.Feature(
            ee.Geometry.Point([-55.25505065917969, -12.170910538226316]),
            {
              "forested": 0,
              "system:index": "7"
            }),
        ee.Feature(
            ee.Geometry.Point([-55.17608642578125, -12.096395598951426]),
            {
              "forested": 0,
              "system:index": "8"
            }),
        ee.Feature(
            ee.Geometry.Point([-55.15205383300781, -12.0990811835433]),
            {
              "forested": 0,
              "system:index": "9"
            }),
        ee.Feature(
            ee.Geometry.Point([-55.26466369628906, -12.10848051708012]),
            {
              "forested": 0,
              "system:index": "10"
            }),
        ee.Feature(
            ee.Geometry.Point([-54.663848876953125, -12.251443720597468]),
            {
              "forested": 0,
              "system:index": "11"
            })]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
// Select the Landsat 5 collection.
var collection = ee.ImageCollection('LANDSAT/LT5_L1T')
  .filterDate('1984-08-12', '1985-07-28');

// Call SimpleLandsatComposite
var composite = ee.Algorithms.Landsat.simpleComposite(collection, 50, 23);

// Clip to the Cerrado boundary.
var boundary = ee.FeatureCollection('ft:1sc1S9Hqzsb2LTPYitmgLDUTq5HurFGdMx73tdCrH');
var image = composite.clip(boundary.geometry());

// Select the red, green and blue bands.
var image = image.select('B3', 'B2', 'B1');

addToMap(image, {min:0, max:50}, 'Simple Composite2');

var trainingData = image.sampleRegions(Forested.merge(NonForested), ['forested'], 30);
var classifier = ee.Classifier.cart().train(trainingData, 'forested', ['B3', 'B2', 'B1']);
var classified=image.classify(classifier)

Map.addLayer(classified, {min: 0, max: 1});

Export.image(image, 'export1985gs', { 
  'crs' : 'EPSG:4326',
  'scale': 30,
  'region': boundary.geometry().getInfo(),
  'maxPixels' : 40000000000,
  'driveFolder' : 'CalEnergy'
});