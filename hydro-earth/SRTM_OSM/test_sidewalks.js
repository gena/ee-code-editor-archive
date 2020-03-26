/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var one_road = /* color: d63000 */ee.Feature(
        ee.Geometry.LineString(
            [[39.25483703613281, -6.810747930193569],
             [39.257540702819824, -6.805975306161704],
             [39.26342010498047, -6.8053361118396145],
             [39.26736831665039, -6.809640003845275]]),
        {
          "system:index": "0"
        }),
    another_road = /* color: 98ff00 */ee.Feature(
        ee.Geometry.LineString(
            [[39.25608158111572, -6.803674202619801],
             [39.2596435546875, -6.8020122876487426],
             [39.264492988586426, -6.803248071124164],
             [39.267239570617676, -6.806486661006608],
             [39.267754554748535, -6.807083240970554]]),
        {
          "system:index": "0"
        }),
    road_crossing = /* color: 0B4A8B */ee.Feature(
        ee.Geometry.LineString(
            [[39.264020919799805, -6.798347531754202],
             [39.260244369506836, -6.80439862529459],
             [39.26015853881836, -6.807381530674451],
             [39.26264762878418, -6.81062009266857],
             [39.26419258117676, -6.811216667493757]]),
        {
          "system:index": "0"
        });
/***** End of imports. If edited, may not auto-convert in the playground. *****/
var add_property = function(fc, key, value){
  // add a property with a constant value to featureCollection
  var fc_prop_check = fc.map(function(f){return f.set('has_prop', f.propertyNames().contains(key))});
  var fc_prop_exists = fc_prop_check.filter(ee.Filter.eq('has_prop', true));
  var fc_prop_notexists = fc_prop_check.filter(ee.Filter.eq('has_prop', false))
    .map(function(f){return f.set(key, value)});
  return fc_prop_notexists.merge(fc_prop_exists)
}

var multiply_property = function(fc, src_prop, trg_prop, multiplier){
  var fc_mult = fc.map(function(f){
    return f.set(trg_prop,
      ee.Number(f.get(src_prop))
        .multiply(multiplier))

  })
  return fc_mult
}

var offset_property = function(fc, src_prop, trg_prop, offset){
  var fc_offset = fc.map(function(f){
    return f.set(trg_prop,
      ee.Number(f.get(src_prop))
        .add(offset))

  })
  return fc_offset
}

var get_sidewalk = function(f){
  // extend the line a little bit on both sides (make sure extension is much longer than width of a typical road)
  var long_f = extend_ft(f, 0.002);
  // get a polygon (with total width) from the street
  var f_buf = ee.Feature(f).buffer(f.get('width'));
  
  // get a polygon (with driveway width) from the street
  var f_long_buf = long_f.buffer(f.get('drive_width'));
  
  // find the difference (=sidewalk) and return
  return f_buf.difference(f_long_buf.geometry());
  
}

var get_driveway = function(f){
  // extend the line a little bit on both sides (make sure extension is much longer than width of a typical road)
  var long_f = extend_ft(f, 0.002);
  
  // get a polygon (with total width) from the street
  var f_buf = ee.Feature(f).buffer(f.get('width'));
  
  // get a polygon (with driveway width) from the street
  var f_long_buf = long_f.buffer(f.get('drive_width'));
  
  // find the difference (=sidewalk) and return
  return f_buf.intersection(f_long_buf.geometry());

}

var extend_ft = function(ft, extend){
  var coords = ft.geometry().coordinates();
  var coord_end_1 = ee.List(coords.get(-1));
  var coord_end_2 = ee.List(coords.get(-2));
  var coord_end_0 = extend_coord(coord_end_1, coord_end_2, extend);
  
  var coord_start_1 = ee.List(coords.get(0));
  var coord_start_2 = ee.List(coords.get(1));
  var coord_start_0 = extend_coord(coord_start_1, coord_start_2, extend);
  
  var newCoords = coords
    .insert(0, coord_start_0)
    .insert(-1, coord_end_0)
    .swap(-1, -2)
  
  return ee.Feature(
    ee.Geometry.MultiLineString([newCoords]))
}

var extend_coord = function(coord1, coord2, extend){
  // function creates a new coordinate that is an extention of a straight line
  // consisting of coord1 and coord2. The new coordinate can be used to extend
  // for instance a line feature
  // TODO: perform on a projected grid, instead of lat lon
  var x1 = ee.Number(coord1.get(0));
  var y1 = ee.Number(coord1.get(1));
  var x2 = ee.Number(coord2.get(0));
  var y2 = ee.Number(coord2.get(1));
  //var tan_line = ((x1 - x2)^2 + (y1 - y2)^2)^0.5;
  //var tan_line = (x1 - x2)/(y1 - y2)
  //var atan = ee.Number(tan_line).atan()
  var len_x = x1.subtract(x2).pow(2);
  var len_y = y1.subtract(y2).pow(2);
  var len = len_x.add(len_y).pow(0.5);
  var sin = x2.subtract(x1).divide(len);
  var cos = y2.subtract(y1).divide(len);
  var len_scale = len.add(extend).divide(len)
  var x0 = x2.add(x1.subtract(x2).multiply(len_scale));
  var y0 = y2.add(y1.subtract(y2).multiply(len_scale));
  //var x0 = cos.multiply(extend).add(x1)
  //var y0 = sin.multiply(extend).add(y1)
  return ee.List([x0, y0]);
  
}


var burn_map = function(fc, prop, resolution) {
  //make a map with zeroes
  var blank = ee.Image(999);
  // reduce fc to image and burn
  var fc_burn = fc.reduceToImage([prop], ee.Reducer.mean());
  fc_burn = blank.where(fc_burn.gte(1), fc_burn)
  //fc_burn = fc_burn.mask(-100)
    .reproject('EPSG:4326', null, resolution);
  return fc_burn
}

var burn_roads = function(fc,  // line feature collection with roads
  prop_width,  // property of fc containing widths
  default_width,  // default width of roads (in case prop_width=NULL)
  drive_frac,  // fraction of street width containing driveway
  prop_layer,  // property of fc containing the vertical layer of fc (with resp. to other layers)
  default_layer,  // default vertical layer (in case prop_layer=NULL)
  multiply,  // multiplier to convert layer to height (relative to ground)
  sidewalk_offset,  // offset of the sidewalks with resp. to driveway elevation
  resolution){  // resoltuion of Image object returned
  var fc = add_property(fc, prop_width, default_width);  // add a default road width
  var fc = multiply_property(fc, prop_width, 'drive_width', drive_frac);  // add a driveway width
  var fc = add_property(fc, prop_layer, default_layer);  // add a default layer (usually zero)
  var fc = multiply_property(fc, prop_layer, 'height', multiply);  // add a default road height (relative to ground)
  var fc_sidewalks = fc.map(get_sidewalk);  // convert line into polygon sidewalks
  var fc_driveways = fc.map(get_driveway);  // convert line into polygon driveways
  // TODO: split sidewalks in existing sidewalks and non-existing (based on sidewalk='left', 'right', 'bpth)
  var fc_sidewalks = offset_property(fc_sidewalks, 'height', 'height', sidewalk_offset);  // add an offset to the sidewalk heights
  var fc_all = fc_sidewalks.merge(fc_driveways); // return a merge of the sidewalks and driveways
  return burn_map(fc_all, 'height', resolution);

    
  }

var burn_all_roads = function(fc_list,
  prop_width_list,
  default_width_list,
  drive_frac_list,
  prop_layer_list,
  default_layer_list,
  multiply_list,
  sidewalk_offset_list,
  resolution){
  print(fc_list);
  // function maps a list of FeatureCollections, props, default props and multipliers
  // to burn_buildings and returns an ImageCollection of returned images
  // create empty list
  var images = ee.ImageCollection([]);
  // loop through al fc-s
  for(var i = 0; i < ee.List(fc_list).length().getInfo(); i++) {
    // select the i-th FeatureCollection with all other properties
    var fc = fc_list[i];
    var prop_width = prop_width_list[i];
    var default_width = default_width_list[i];
    var drive_frac = drive_frac_list[i];
    var prop_layer = prop_layer_list[i];
    var default_layer = default_layer_list[i];
    var multiply = multiply_list[i];
    var sidewalk_offset = sidewalk_offset_list[i];
    var fc_burn = burn_roads(fc, prop_width, default_width, drive_frac, prop_layer,
      default_layer, multiply, sidewalk_offset, resolution);
    var images = images.merge(ee.ImageCollection([fc_burn]));
    // add layer to list of images
  }
  print(images);
  // convert to ImageCollection and return
  return ee.ImageCollection(images);
}


var default_width = 10; // default width of features in fc
var sidewalk_offset = 0.2;  // difference in elevation of sidewalk v.s. driveway
var prop_width = 'width';  // name of property to change for width
var drive_frac = 0.75;  // fraction of road taken by driveway
var prop_layer = 'layer';  // property of fc that defines the layer
var default_layer = 1;  // default layer of given fc
var multiply = 5;  // multiplier to convert layer into elevation relative to ground

// make two feature collection
var fc1 = ee.FeatureCollection([one_road, another_road]);
var fc2 = ee.FeatureCollection([road_crossing]);

var ic = burn_all_roads([fc1, fc2],
  [prop_width, prop_width],
  [default_width, default_width],
  [drive_frac, drive_frac],
  [prop_layer, prop_layer],
  [default_layer, 2],
  [multiply, multiply],
  [sidewalk_offset, sidewalk_offset],
  0.5);

//var road1 = burn_roads(fc, prop_width, default_width, drive_frac, prop_layer,
//  default_layer, multiply, sidewalk_offset, 0.5);
//var road2 = burn_roads(fc2, prop_width, default_width, drive_frac, prop_layer,
//  0, multiply, sidewalk_offset, 0.5);

//Map.addLayer(fc_all, {}, 'side walks')
var ic_min = ic.reduce(ee.Reducer.min())
Map.addLayer(ic_min.mask(ic_min.neq(999)), {'min': 0, 'max': 10.3, 'opacity': 0.5}, 'burned road1');

//Map.addLayer(fc_sidewalks, {}, 'side walks')
//Map.addLayer(fc_driveways, {}, 'driveways')
//Map.addLayer(driveway, {}, 'driveway')
//Map.addLayer(sidewalk, {}, 'sidewalks')
Map.setCenter(39.264, -6.8057, 14);

//Map.addLayer(fc_buffer)
//Map.centerObject(geometry)
