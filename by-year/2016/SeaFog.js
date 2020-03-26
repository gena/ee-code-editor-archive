/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var geometry = /* color: #d63000 */ee.Geometry.Point([15.908203125, -25.005972656239177]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
var collection = ee.Image('MODIS/MOD09GA/MOD09GA_005_2016_01_05');

var vizParams = {
  bands: ['sur_refl_b01', 'sur_refl_b06', 'sur_refl_b02'],
  min: -100,
  max: 16000
};

//Add the mean of the collection
Map.addLayer(collection, vizParams);
Map.centerObject(geometry, 5);

//This calculates the NDSI
var collection = collection.addBands(collection.normalizedDifference(['sur_refl_b06', 'sur_refl_b01']));
print(collection);

var vizParams2 = {
  bands: ['nd'],
  min: -1,
  max: 1
};

Map.addLayer(collection, vizParams2, 'NDSI');

// Masking over the collection.
var maskedCollection = collection.updateMask(collection.select(['nd']).gt(-0.15).and(collection.select(['nd']).lt(0.2)));

Map.addLayer(maskedCollection, vizParams2, 'NDSImask');

//Apply IF fucntion to produce new conditional mask

var conditional = function(image) {
  var ref = image.select('sur_refl_b01')
  var percRef = ref.divide(16000).multiply(100)
  var mask1 = function(image) {
    return image.updateMask(image.select(['nd']).gt(-0.15).and(image.select(['nd']).lt(0.4)))
    };
  var mask2 = function(image) {
    return image.updateMask(image.select(['nd']).gt(-0.15).and(image.select(['nd']).lt(0.2)))
    };
  return ee.Algorithms.If(percRef.lt(30),
                          mask1(image),
                          mask2(image));
};

var result = conditional(collection);
print(result);