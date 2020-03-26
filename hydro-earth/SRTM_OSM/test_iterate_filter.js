/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var f1 = /* color: d63000 */ee.Feature(
        ee.Geometry.LineString(
            [[39.24445152282715, -6.806486661006608],
             [39.2521333694458, -6.8094269407926715],
             [39.25960063934326, -6.805549176708213],
             [39.25166130065918, -6.803588976350924]]),
        {
          "system:index": "0",
          "key2": 2,
          "key3": 3,
          "key1": ""
        }),
    f2 = /* color: 98ff00 */ee.Feature(
        ee.Geometry.LineString(
            [[39.26140308380127, -6.809171265004681],
             [39.26882743835449, -6.805719628534997],
             [39.27444934844971, -6.808361624110618]]),
        {
          "system:index": "0",
          "key1": 1,
          "key2": 2,
          "key3": 4
        });
/***** End of imports. If edited, may not auto-convert in the playground. *****/

var accumulate = function(i, e){
  return ee.Number(e).add(ee.Number(var2.get(i)));
}

var filter_multiple = function(i, fc){
  return ee.FeatureCollection(fc).filter(ee.Filter.inList(keys.get(i), props.get(i)));
}

// // try with numbers
// var index0 = ee.List.sequence(0,3);
// var e = ee.Number(0)
// var var2 = ee.List([10, 100, 50, 20]);
// // iterate functions uses output from last iteration as input for new
// var e_changed = index0.iterate(accumulate, e);
// // answer should be sum of var2 = 180
// print(e_changed);

// // try with feature collection, keys and props
// var keys = ee.List(['key1','key2','key3']);
// var props = ee.List([[1],[2],[3]]);
// var index = ee.List.sequence(0,null,1, keys.length());
// var fc = ee.FeatureCollection([f1, f2]);
// var fc_filtered = index.iterate(filter_multiple,fc)
// print(fc_filtered)


/***
 *split feature collection based on wheather property exist (isnull) 
 */
function splitIsNull(fc, prop) {
  return [
    fc.filter(ee.Filter.neq(prop, null)).cache(), // not NULL
    fc.filter(ee.Filter.eq(prop, null)).cache()   // NULL
    ];
}


f1 = f1.set('burn_height',2)
var fc = ee.FeatureCollection([f1, f2]);

var split = splitIsNull(fc, "burn_height");
var notnull = split[0];
var isnull = split[1];
print(isnull)

