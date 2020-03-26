/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var buildings1 = /* color: d63000 */ee.Feature(
        ee.Geometry.MultiPolygon(
            [[[[39.26942825317383, -6.799285030108689],
               [39.269256591796875, -6.801415701384754],
               [39.27191734313965, -6.801841834506061],
               [39.27105903625488, -6.800052072856532]]],
             [[[39.26633834838867, -6.80056343400817],
               [39.26445007324219, -6.801074794615539],
               [39.26436424255371, -6.802949778852249],
               [39.26711082458496, -6.80439862529459],
               [39.269256591796875, -6.803375910612559],
               [39.26693916320801, -6.801841834506061]]]]),
        {
          "system:index": "0"
        }),
    buildings2 = /* color: 98ff00 */ee.Feature(
        ee.Geometry.Polygon(
            [[[39.26093101501465, -6.799540711160676],
              [39.264020919799805, -6.7985179861365115],
              [39.260759353637695, -6.796131619283668],
              [39.25861358642578, -6.79843275895292]]]),
        {
          "building:levels": 5,
          "system:index": "0"
        }),
    buildings3 = /* color: 0B4A8B */ee.Feature(
        ee.Geometry.Polygon(
            [[[39.251017570495605, -6.797126384138241],
              [39.25196170806885, -6.798362180180059],
              [39.25264835357666, -6.797126384138241],
              [39.251747131347656, -6.795464446521214]]]),
        {
          "system:index": "0",
          "height": 20
        }),
    buildings4 = /* color: ffc82d */ee.Feature(
        ee.Geometry.Polygon(
            [[[39.24561023712158, -6.801927061084952],
              [39.24762725830078, -6.803461136919245],
              [39.25015926361084, -6.802821939250411],
              [39.25007343292236, -6.800946954514723],
              [39.24543857574463, -6.800776500994039]]]),
        {
          "system:index": "0"
        });
/***** End of imports. If edited, may not auto-convert in the playground. *****/
// test multiply and burn featureCollection with polygons
var add_property_constant = function(fc, trg_key, value){
  // where target key has no value add constant value 
  var fc_prop_check = fc.map(function(f){return f.set('has_prop', f.propertyNames().contains(trg_key))});
  var fc_prop_exists = fc_prop_check.filter(ee.Filter.and(ee.Filter.eq('has_prop', true),ee.Filter.neq(trg_key,null)));
  var fc_prop_notexists = fc_prop_check.filter(ee.Filter.or(ee.Filter.eq('has_prop', false),ee.Filter.eq(trg_key,null)))
    .map(function(f){return f.set(trg_key, value)});
  return fc_prop_notexists.merge(fc_prop_exists);
};

/* deprecated
var multiply_property = function(fc, src_prop, trg_prop, multiplier){
  var fc_mult = fc.map(function(f){
    return f.set(trg_prop,
      ee.Number(f.get(src_prop))
        .multiply(multiplier))

  })
  return fc_mult
}
*/

var add_property_multiply = function(fc, trg_key, src_key, multiplier){
  // where target key has no value add value based on multiplication value source key 
  var fc_prop_check = fc.map(function(f){return f.set('has_prop', f.propertyNames().contains(trg_key))});
  var fc_prop_exists = fc_prop_check.filter(ee.Filter.or(ee.Filter.eq('has_prop', false),ee.Filter.eq(trg_key,null)));
  var fc_prop_notexists = fc_prop_check.filter(ee.Filter.and(ee.Filter.eq('has_prop', true),ee.Filter.neq(trg_key,null)))
  .map(function(f){
    return f.set(trg_key, 
        ee.Number(f.get(src_key)).multiply(ee.Number(multiplier)));
  });
  return fc_prop_notexists.merge(fc_prop_exists);
};

var add_property_copy = function(fc, trg_key, src_key){
  // where src key has value copy to trg_key
  var fc_prop_check = fc.map(function(f){return f.set('has_prop', f.propertyNames().contains(src_key))});
  //  set null if source value does not exist or equals null
  var fc_prop_notexists = fc_prop_check.filter(ee.Filter.or(ee.Filter.eq('has_prop', false),ee.Filter.eq(src_key,null)))
  .map(function(f){return f.set(trg_key, null);
  });
  // copy if source value exist and  not equal to value
  var fc_prop_exists = fc_prop_check.filter(ee.Filter.and(ee.Filter.eq('has_prop', true),ee.Filter.neq(src_key,null)))
  .map(function(f){return f.set(trg_key, ee.Number(f.get(src_key)));
  });
  return fc_prop_notexists.merge(fc_prop_exists);
};

var burn_map = function(fc, prop, resolution) {
  //make a map with zeros
  var blank = ee.Image(0);
  // reduce fc to image and burn
  var fc_burn = fc.reduceToImage([prop], ee.Reducer.mean());
  fc_burn = blank.where(fc_burn.gte(1), fc_burn)
    .reproject('EPSG:4326', null, resolution);
  return fc_burn;
};

/*
var burn_buildings = function(fc, prop, prop_default, multiply, resolution){
  // fill in missings with a default value
  var fc = add_property(fc, prop, prop_default);
  var fc = multiply_property(fc, prop, 'height', multiply);
  return burn_map(fc, 'height', resolution);
}
*/


var burn_all_buildings = function(fc_list, prop_list, prop_default_list, multiply_list, resolution){
  // define function to burn one FeatureCollection
  var burn_buildings = function(i){
    // input is an index value
    // get the inputs for build_buildings with index
    var fc = ee.FeatureCollection(ee.List(fc_list).get(i));
    var prop = ee.List(prop_list).get(i);
    var prop_default = ee.List(prop_default_list).get(i);
    var multiply = ee.Number(ee.List(multiply_list).get(i));
    // add burn_height property based on height estimate property
    fc = add_property_copy(fc, 'burn_height','height');
    // fill in missings storeys property with a default value
    fc = add_property_constant(fc, prop, prop_default);
    // multiply number of storeys with height per storey, map to 'burn_height' where missing
    fc = add_property_multiply(fc, 'burn_height', prop, multiply);
    // return a burned map of 'burn_height'
    return burn_map(fc, 'burn_height', resolution);
  }

  // function maps a list of FeatureCollections, props, default props and multipliers
  // to burn_buildings and returns an ImageCollection of returned images
  var index = ee.List.sequence(0, ee.Number(ee.List(fc_list).length()).subtract(1))
  return ee.ImageCollection(index.map(burn_buildings));
}

// let's burn buildings. Give them a default number of levels (storeys) of 2 and
// each storey has a height of 3 meters

var height_per_level = 3; // amount of height per level of a building
var resolution = 0.5; // resolution of burned image in meters
var fc1 = ee.FeatureCollection([buildings1, buildings2]);
var fc2 = ee.FeatureCollection([buildings3, buildings4]);

var ic = burn_all_buildings([fc1, fc2], ['building:levels', 'building:levels'], [2, 20], [3, 3], 2);
print(ic)
Map.centerObject(fc1);
Map.addLayer(ic.reduce(ee.Reducer.max()), {'min': 0, 'max': 60, 'opacity': 0.5}, 'burned buildings');

//Map.addLayer(fc_burn, {'min': 0, 'max': 15, 'opacity': 0.5}, 'burned buildings')
