/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var bound1 = /* color: 98ff00 */ee.Geometry.Polygon(
        [[[39.26037311553955, -6.806699725364562],
          [39.260802268981934, -6.808084641385902],
          [39.26331281661987, -6.808042028644828],
          [39.26316261291504, -6.806145757837196]]]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
// ***** GENERAL filter and set default functions *****
/***
 * filters fc based on property keys & (list of) values
 * note that the filter cannot filter on mutually exclusive keys, in such case two seperate filters should be used
 */
var filter_fc = function(fc, keys, values){
  
  // function to loop over filters
  var filter_multiple = function(i, fc){
  return ee.FeatureCollection(fc).filter(ee.Filter.inList(keys.get(i), values.get(i)))};
  
  // declare keys and props as list and make index
  keys = ee.List(keys);
  values = ee.List(values);
  var index = ee.List.sequence(0,null,1, keys.length());
  
  // iterate over keys and props and return filtered fc
  return ee.FeatureCollection(index.iterate(filter_multiple, fc));
};


/***
 * filters out features from fc based  of property keys & (list of) values
 * note that the filter cannot filter on mutually exclusive keys, in such case two seperate filters should be used
 */
var filter_out_fc = function(fc, keys, values){
  
  // function to loop over filters
  var filter_multiple = function(i, fc){
    return ee.FeatureCollection(fc).filter(ee.Filter.inList(keys.get(i), values.get(i)).not())};
  
  // declare keys and props as list and make index
  keys = ee.List(keys);
  values = ee.List(values);
  var index = ee.List.sequence(0,null,1, keys.length());
  
  // iterate over keys and props and return filtered fc
  return ee.FeatureCollection(index.iterate(filter_multiple, fc));
};


/***
 * splits a feature collection based on filters
 */
var split_fc = function(fc, keys, values){
  
  // function to loop over filters
  var split = function(i, fc){
    // var fc_list = [ee.FeatureCollection(fc), ee.FeatureCollection([])];
    var fc_eq = fc_list[0];
    var fc_neq = fc_list[1];
    return [fc_eq.filter(ee.Filter.inList(keys.get(i), values.get(i))), 
            fc_neq.merge(fc_eq.filter(ee.Filter.inList(keys.get(i), values.get(i)).not()))
            ]; 
    };
  
  // declare keys and props as list and make index
  keys = ee.List(keys);
  values = ee.List(values);
  var index = ee.List.sequence(0,null,1, keys.length());
  
  
  // iterate over keys and props and return filtered fc
  return ee.List(index.iterate(split, [ee.FeatureCollection(fc), ee.FeatureCollection([])]));
};
  
/***
 * split fc based on geographical location
 * use intersect or containedIn function and filter on result
 */
function splitLoc(fc, bound) {

  var fbound = ee.Feature(bound);

  var fc_inside = function(f){
  return ee.Feature(f).set('inbound',ee.Feature(f).intersects(fbound));
    };
    
  fc = fc.map(fc_inside);
  
  return [fc.filter(ee.Filter.eq('inbound', true)), 
          fc.filter(ee.Filter.neq('inbound', true))]; 
} 

// ********* ALL INPUTS START HERE! *********************************
var osm_lines = ee.FeatureCollection('ft:1SapB3BgtFH4koR8rCQrhsdpvshejKWsYV4mCNuVf');
var osm_polys = ee.FeatureCollection('ft:17EfAkPTjmpgXPQEs5oy7VmnJGCIKTEMO26QbIoCw');


//filter some features from lines and polygons
// var osm_highway_primary = filter_fc(osm_lines,['highway'], [['primary']]);
// var osm_kilwa_road = filter_fc(osm_lines, ['highway', 'Name'], [['primary'], ['Kilwa Road']]);
// print(osm_kilwa_road)

var split = function(fc, key, value_list){
  return [fc.filter(ee.Filter.inList(key, value_list)), 
          fc.filter(ee.Filter.inList(key, value_list).not())]; 
  };
  
var split2 = function(fc, key, value_list1, value_list2){
  var all_values = ee.List(value_list1).cat(value_list2)
  return [fc.filter(ee.Filter.inList(key, value_list1)), 
          fc.filter(ee.Filter.inList(key, value_list2)), 
          fc.filter(ee.Filter.inList(key, all_values).not())]; 
  };

var split3 = function(fc, key, value_list1, value_list2, value_list3){
  var all_values = ee.List(value_list1).cat(value_list2).cat(value_list3)
  return [fc.filter(ee.Filter.inList(key, value_list1)), 
          fc.filter(ee.Filter.inList(key, value_list2)), 
          fc.filter(ee.Filter.inList(key, value_list3)), 
          fc.filter(ee.Filter.inList(key, all_values).not())]; 
  };  
  


var osm_buildings = filter_out_fc(osm_polys, ['building'],[['']]);
var fc_list = split3(osm_buildings, 'building', ['residential'],['commercial'],['apartments'])
var res = fc_list[0];
var commercial = fc_list[1]
var appartment = fc_list[2]
// var other

// print(res.first())
// print(commercial.first())
// print(other.first())

// var osm_building_commercial = filter_fc(osm_buildings, ['building'],[['commercial']]);
// var BondeniHotel = filter_fc(osm_building_commercial, ['name'],[['New Bondeni Hotel']]);
// var osm_building_commercial_other = filter_out_fc(osm_building_commercial, ['name'],[['New Bondeni Hotel']]);

// var osm_building_split = split_fc(osm_buildings, ['building','name'],[['commercial'],['New Bondeni Hotel']]);
// var BondeniHotel = osm_building_split[0];
// var osm_building_other = osm_building_split[1];
// print(osm_building_other)
// print(osm_building_other.first())
// print(BondeniHotel)

// centre map to Dar Es Salaam Magomeni area
Map.setCenter(39.262015, -6.808537, 15);

//plot with different colors
// Map.addLayer(osm_highway_primary, {color:'FFD455'}, 'OSM highway primary');
// Map.addLayer(osm_buildings, {color: 'D3D3D3'}, 'all');
// Map.addLayer(other, {color: 'FFFF00'}, 'other');
// Map.addLayer(res, {color: 'FF0000'}, 'res');
// Map.addLayer(commercial, {color:'00FF00'}, 'commercial');


//split based on location and plot

var building_split = splitLoc(osm_buildings, bound1)
var building_inbound = building_split[0]
var building_outbound = building_split[1]
print(building_outbound)
Map.addLayer(osm_buildings, {color: 'D3D3D3'}, 'all');
Map.addLayer(building_inbound, {color: 'FFFF00'}, 'in bounds');
Map.addLayer(building_outbound, {color: 'FF0000'}, 'outside bounds');