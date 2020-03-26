/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var roi = /* color: d63000 */ee.Geometry.Point([-122.26821899152128, 37.87222075954954]),
    l8 = ee.ImageCollection("LANDSAT/LC8_L1T_TOA"),
    bare = /* color: 98ff00 */ee.Geometry.Polygon(
        [[[-122.38838195931748, 37.622195503361304],
          [-122.39507675301866, 37.625594549322486],
          [-122.40125656258897, 37.624098988247674],
          [-122.39816665780381, 37.615124989924475],
          [-122.39576339852647, 37.61226939966944],
          [-122.38700866830186, 37.607101862377824],
          [-122.37859726083116, 37.61784449774192]]]),
    water = /* color: 0B4A8B */ee.Geometry.Polygon(
        [[[-122.35010147225694, 37.62287532498734],
          [-122.35164642464952, 37.602069967923796],
          [-122.32469558846788, 37.6023419709207],
          [-122.3260688794835, 37.62328321497886]]]),
    vegetation = /* color: ffc82d */ee.Geometry.Polygon(
        [[[-122.45481491612736, 37.616756706031914],
          [-122.46253967809025, 37.61186144873421],
          [-122.44949341344181, 37.59445347973108],
          [-122.43370056676213, 37.59717374340254],
          [-122.44245529698674, 37.605469933385145],
          [-122.44657517003361, 37.613493236973]]]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
var bands = ['B2', 'B3', 'B4', 'B5', 'B6', 'B7'];

var image = ee.Image(l8.filterBounds(roi)
    .sort('CLOUD_COVER')
    .first())
    .select(bands);
Map.addLayer(image, {bands: ['B4', 'B3', 'B2'], max: 0.3}, 'image');    

var bareMean = image.reduceRegion({
  reducer: ee.Reducer.mean(), 
  geometry: bare, 
  scale: 30
}).values();

var vegMean = image.reduceRegion({
  reducer: ee.Reducer.mean(), 
  geometry: vegetation, 
  scale: 30
}).values();

var waterMean = image.reduceRegion({
  reducer: ee.Reducer.mean(), 
  geometry: water, 
  scale: 30
}).values();

var chart = Chart.image.regions(image, ee.FeatureCollection([
  ee.Feature(bare, {label: 'bare'}),
  ee.Feature(water, {label: 'water'}),
  ee.Feature(vegetation, {label: 'vegetation'})
]), ee.Reducer.mean(), 30, 'label', 
  [0.48, 0.56, 0.65, 0.86, 1.61, 2.2]);
print(chart);

var endmembers = ee.Array.cat([bareMean, vegMean, waterMean], 1);
print(endmembers);

var arrayImage = image.toArray().toArray(1);

var unmixed = ee.Image(endmembers).matrixSolve(arrayImage);

var unconstrained = unmixed.arrayProject([0]).arrayFlatten([['bare', 'veg', 'dark']]);

Map.addLayer(unconstrained);

// Sum-to-one constrained unmixing.  See Keshava and Mustard, 2002.
var z = ee.Array([1]).repeat(1, endmembers.length().get([1])); // 1xM
var inverse = endmembers.transpose().matrixMultiply(endmembers).matrixInverse(); // MxM
var bigMultiplier = inverse.matrixMultiply(z.transpose()) // Mx1
  .matrixMultiply(
    (z.matrixMultiply(inverse).matrixMultiply(z.transpose()))
      .matrixInverse());
      
// Turn the big multiplier into an image.
var adjImage = ee.Image(bigMultiplier)
  .arrayProject([0])
  .arrayFlatten([['bare', 'veg', 'dark']]);
  
// This part is a scalar that needs to multiply every band in bigMultiplier
// equivalent to (Za-1) in Keshava and Mustard (2002)
var sumMinusOne = unconstrained.reduce(ee.Reducer.sum()).subtract(1.0);
var constrained = unconstrained.subtract(adjImage.multiply(sumMinusOne));

// It's constrained to sum-to-one, but each component is not constrained
// to [0,1].  Constrain each component to also be [0,1] with this hack.
var bare = constrained.select([0]);
var veg = constrained.select([1]);
var dark = constrained.select([2]);

// >1
var baregte = bare.gte(1);
var veggte = veg.gte(1);
var darkgte = dark.gte(1);

// if >1, make 1; else if other class >1, make 0
var newbare = bare.where(veggte.or(darkgte), 0).where(baregte, 1);
var newveg = veg.where(baregte.or(darkgte), 0).where(veggte, 1);
var newdark = dark.where(baregte.or(veggte), 0).where(darkgte, 1);

// <0
var barelte = newbare.lt(0);
var veglte = newveg.lt(0);
var darklte = newdark.lt(0);

newveg = newveg.where(barelte, newveg.divide(newbare.abs().add(1)));
newdark = newdark.where(barelte, newdark.divide(newbare.abs().add(1)));
newbare = newbare.where(barelte, 0);

newbare = newbare.where(veglte, newbare.divide(newveg.abs().add(1)));
newdark = newdark.where(veglte, newdark.divide(newveg.abs().add(1)));
newveg = newveg.where(veglte, 0);

newbare = newbare.where(darklte, newbare.divide(newdark.abs().add(1)));
newveg = newveg.where(darklte, newveg.divide(newdark.abs().add(1)));
newdark = newdark.where(darklte, 0);

var constrained = newbare.addBands(newveg).addBands(newdark);

Map.addLayer(constrained);


