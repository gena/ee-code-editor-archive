/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var geometry = /* color: 009999 */ee.Geometry.Point([-3.1862497329711914, 37.07829154503323]),
    geometry2 = /* color: ff00ff */ee.Geometry.Point([-3.200712203979492, 37.08018426265539]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
/***************************************************************************************
**  RANDOM FIELD GENERATOR                                                            **
**                                                                                    **
**  Feel free to use/reuse, but please email Guy Ziv (guy1ziv2 at gmail dot com)      **
**  if you encunter a bug (or suggest improvements)                                   **                                                                                  **
***************************************************************************************/

var AUX={};

AUX.Ran = function(img) {
// function Ran(image)
// Random field generator based on 32-bit Xorshift algorithm with a MLCG successor (J1(G1l)),
// returns uinform distributed values in (0,1) as 'Ran:uniform' band.
//
// To prepare the algorithm, and set the nominal scale (and spatial correlations), it uses a supplied template
// image to prepare seed, with horizontal/vertical correlation of 65535 pixels.
//
// All subsequent requests for random fields should pass the output of previous iteration.
// Do NOT use within a .map() unless you want to add the same field to all elements.
//
// Ref: Numerical Recipes (http://numerical.recipes/) third edition

  var generateRan = function (seed) {
    var state1 = ee.Image(seed).select('Ran:state'),
        state2 = state1.bitwiseXor(state1.leftShift(13)),
        state3 = state2.bitwiseXor(state2.rightShift(17)),
        state4 = state3.bitwiseXor(state3.leftShift(5)),
        state5 = state4.multiply(1597334677).mod(4294967296),
        state6 = state4.addBands(state5.divide(4294967296).select([0],['Ran:uniform']));
    return state6.set('Ran:has_seed',true);
  }
  
  var makeSeed = function(img) { // prepares seed from template
    var template = ee.Image(img), 
        seed0 = ee.Image.pixelCoordinates(template.projection()).int32().add(2147483648).uint32(),
        seed1 = seed0.select(0).bitwiseAnd(65535).leftShift(16).add(seed0.select(1).bitwiseAnd(65535)),
        seed2 = seed1.add(seed1.eq(0).multiply(0x7FFF7FFF)).uint32(), // hack to avoid seed of zero which must be avoided in RNG
        seed3 = seed2.select([0],['Ran:state']).updateMask(template.mask());
    for (var i=0; i<10; i++) {
      seed3 = generateRan(seed3); // ramp up to loss correlation between pixels
    }
    return seed3;
  }
  
  img = ee.Image(img);
  return ee.Image(ee.Algorithms.If(img.get('Ran:has_seed'),generateRan(img),makeSeed(img)));
}

AUX.RanNormal = function (img) {
// function RanNormal(image)
// Normal random field generator based on Box-Muller transform, returns a N(0,1) field
// as 'Ran:normal' band.
//
// To prepare the algorithm, and set the nominal scale (and spatial correlations), it uses a supplied template
// image to prepare seed, with horizontal/vertical correlation of 65535 pixels.
//
// All subsequent requests for random fields should pass the output of previous iteration.
// Do NOT use within a .map() unless you want to add the same field to all elements.
//
// Ref: Wikipedia - https://en.wikipedia.org/wiki/Box%E2%80%93Muller_transform
  
  var state0 = ee.Image(img),
      state1 = ee.Image(ee.Algorithms.If(state0.get('Ran:has_seed'),state0,AUX.Ran(state0))),
      U1a = AUX.Ran(state1), U1 = U1a.select(['Ran:uniform'],['U1']), 
      U2a = AUX.Ran(U1a), U2 = U2a.select(['Ran:uniform'],['U2']),
      Z0 = U1.log().multiply(-2).sqrt().multiply(U2.multiply(2*Math.PI).cos()).select([0],['Ran:normal']),
      state2 = U2a.addBands(Z0,['Ran:normal'],true);
  return state2;
}

/////////////////////////////////////////////////////////

var template = ee.Image(ee.ImageCollection('LANDSAT/LT5_SR').filterBounds(geometry).first()).select(0);

var col = ee.ImageCollection(ee.List(ee.List.sequence(1,100).iterate(function(indx, col) {
      col = ee.List(col);
      return col.add(AUX.RanNormal(col.get(-1)));
    },[template])).slice(1));

print(col);
print(Chart.image.series(col.select('Ran:normal'), geometry, ee.Reducer.mean(), 10, 'system:index'));
print(Chart.image.series(col.select('Ran:normal'), geometry2, ee.Reducer.mean(), 10, 'system:index'));
print(Chart.image.histogram(col.select('Ran:normal').first(), geometry.buffer(500,null,template.projection()), 30));
Map.addLayer(template,null,'template')
Map.addLayer(ee.Image(col.select('Ran:normal').first()),{min:-1.5,max:1.5},'random (first image)')

Map.centerObject(geometry,15)