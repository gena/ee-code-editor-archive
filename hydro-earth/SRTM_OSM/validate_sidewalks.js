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
        }),
    srtm_30 = ee.Image("USGS/SRTMGL1_003"),
    bounds = /* color: ffc82d */ee.Geometry.Polygon(
        [[[39.26033020019531, -6.868143527957247],
          [39.29388999938965, -6.868654816279271],
          [39.294190406799316, -6.8494811284248085],
          [39.26118850708008, -6.849310692184702]]]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/



// ***** some plot functionality ******
function radians(img) { return img.toFloat().multiply(3.1415927).divide(180); }

function hillshade(az, ze, slope, aspect) {
  var azimuth = radians(ee.Image(az));
  var zenith = radians(ee.Image(ze));
  return azimuth.subtract(aspect).cos().multiply(slope.sin()).multiply(zenith.sin())
      .add(zenith.cos().multiply(slope.cos()));
}

function hillshadeit(image, elevation, weight, height_multiplier) {
  var hsv  = image.unitScale(0, 255).rgbtohsv();

  var terrain = ee.call('Terrain', elevation.multiply(height_multiplier));
  var slope = radians(terrain.select(['slope']));
  var aspect = radians(terrain.select(['aspect']));
  var hs = hillshade(azimuth, zenith, slope, aspect);

  var intensity = hs.multiply(weight).multiply(hsv.select('value'));
  var huesat = hsv.select('hue', 'saturation');
  
  return ee.Image.cat(huesat, intensity).hsvtorgb();
}

var azimuth = 90;
var zenith = 60;

// visualization settings (elevation)

// function to visualize the specific DEM
var colors_dem = ['006837', '1a9850', '66bd63', 'a6d96a', 'd9ef8b', 'ffffbf', 'fee08b', 'fdae61', 'f46d43', 'd73027', 'a50026', 'ffffff']
var dem_min = 0;
var dem_max = 100;

var addDem = function(dem, name, visible) {
  var im = dem.visualize({palette:colors_dem, min:dem_min, max:dem_max, opacity: 1.0});
  var hillshade_im = hillshadeit(im, dem, 2.0, 2.0);
  Map.addLayer(hillshade_im, {}, name, visible);
  return hillshade_im;
};


// ******* functioanlity start here *******************
/***
 * filters fc based on property keys & (list of) values
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
 *split feature collection based on wheather property exist (isnull) 
 */
function splitIsNull(fc, prop) {
  return [
    fc.filter(ee.Filter.neq(prop, null)).cache(), // not NULL
    fc.filter(ee.Filter.eq(prop, null)).cache()   // NULL
    ];
}


/***
 * Set property (trg_key)  to default if missing 
 */
var set_property_constant = function(fc, trg_key, default_value){
  var split = splitIsNull(fc, trg_key);

  var notnull = ee.FeatureCollection(split[0]);
  var isnull = ee.FeatureCollection(split[1]);
  
  return notnull.merge(isnull.map(function(f){return f.set(trg_key, default_value)}));
};


/***
 * Set property (trg_key) with multiply of other property
 */
var set_property_multiply = function(fc, trg_key, prop, multiplier){
  
  function compute_property(f) {
    return f.set(trg_key, ee.Number(f.get(prop)).multiply(ee.Number(multiplier)));
  }

  var split = splitIsNull(fc, trg_key);
  var notnull = ee.FeatureCollection(split[0]);
  var isnull = ee.FeatureCollection(split[1]);
  
  return notnull.merge(isnull.map(compute_property));
};


/***
 * Set property (trg_key) with offset of other property
 */
var set_property_offset = function(fc, trg_key, prop, offset){
  var fc_offset = fc.map(function(f){
    return f.set(trg_key,
      ee.Number(f.get(prop))
        .add(offset))

  })
  return fc_offset
}


/***
 * functions to translate osm road (line) to drive_Way (polygon) & sidewalk (polygon)
 * (total) width and drive_width are properties of line features
 * functions are seperated becasue map function requires only one feature as output!! 
 */
var get_driveway = function(f) {
  return f.buffer(ee.Number(f.get('drive_width')));
};
var get_sidewalk = function(f) {
  // extend the line a little bit on both sides (make sure extension is much longer than width of a typical road)
  var long_f = extend_ft(f, 0.002);
  
  // get a polygon (with total width) from the street
  var f_buf = f.buffer(ee.Number(f.get('width')));
  
  // get a polygon (with driveway width) from the street
  var driveway = long_f.buffer(ee.Number(f.get('drive_width')));
  
  // find the difference (=sidewalk) and return
  return f_buf.difference(driveway.geometry());
};


/***
 * extend line elements based on local direction on both sides
 */
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
    .swap(-1, -2);
  
  return ee.Feature(
    ee.Geometry.MultiLineString([newCoords]));
};


/***
 * function creates a new coordinate that is an extention of a straight line
 * consisting of coord1 and coord2. The new coordinate can be used to extend
 * for instance a line feature
 */
var extend_coord = function(coord1, coord2, extend){
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
  var len_scale = len.add(extend).divide(len);
  var x0 = x2.add(x1.subtract(x2).multiply(len_scale));
  var y0 = y2.add(y1.subtract(y2).multiply(len_scale));
  //var x0 = cos.multiply(extend).add(x1)
  //var y0 = sin.multiply(extend).add(y1)
  return ee.List([x0, y0]);
};


var set_width_roads = function(fc, default_width, drive_frac) {
  // add a default road width if value is null
  fc = set_property_constant(fc, 'width', default_width);  
  // add a driveway width
  fc = set_property_multiply(fc, 'drive_width', 'width', drive_frac);  
  return fc
};

/***
 * function creates roads (multi poolygons) from lines and set 'burn height' property
 * burn_hieght is set based on the 'layer' property and a default offset for sidewalks
 */
var set_height_AllRoads = function(fc_list, default_width_list, drive_frac_list,
                                  default_layer_list, default_layer_height_list, sidewalk_offset_list) {
 
  var set_height_road = function(i, fc_in){
    var fc = ee.FeatureCollection(ee.List(fc_list).get(i));
    var default_width = ee.Number(ee.List(default_width_list).get(i));  // default width of roads (in case prop_width=NULL)
    var drive_frac = ee.Number(ee.List(drive_frac_list).get(i));  // fraction of street width containing driveway
    var default_layer = ee.Number(ee.List(default_layer_list).get(i));   // default vertical layer (in case prop_layer=NULL)
    var default_layer_height = ee.Number(ee.List(default_layer_height_list).get(i));  // multiplier to convert layer to height (relative to ground)
    var sidewalk_offset = ee.Number(ee.List(sidewalk_offset_list).get(i));   

    // add a default road width if value is null
    fc = set_property_constant(fc, 'width', default_width);  
    // add a driveway width
    fc = set_property_multiply(fc, 'drive_width', 'width', drive_frac);  
    // add a default layer (usually zero)
    fc = set_property_constant(fc, 'layer', default_layer); 
    // add a default road height (relative to ground)
    fc = set_property_multiply(fc, 'burn_height', 'layer' ,default_layer_height); 
    // convert lines into road polygons
    var fc_sidewalks = fc.map(get_sidewalk);
    var fc_driveways = fc.map(get_driveway);
    // add an offset to the sidewalk heights
    // TODO: split sidewalks in existing sidewalks and non-existing (based on sidewalk='left', 'right', 'bpth)
    fc_sidewalks = set_property_offset(fc_sidewalks, 'burn_height', 'burn_height', sidewalk_offset); 
    
    // return a merge of the sidewalks and driveways
    return  ee.FeatureCollection(fc_sidewalks.merge(fc_driveways)).merge(ee.FeatureCollection(fc_in)); 
  };
  
  // iterate over list and return enriched merged fc; start with empty fc
  var index = ee.List.sequence(0,null,1, ee.List(fc_list).length());
  return ee.FeatureCollection(index.iterate(set_height_road, ee.FeatureCollection([])));
};


/***
 * burn property value of feature collection to map
 * fill value is zero; if multiple features take the max property value
 * 
 * inputs: feature collection with buildings, burn property, resolution
 */
var burn_map_max = function(fc, prop, resolution) {
  //make a map with zeros
  var blank = ee.Image(0);
  // reduce fc to image and burn
  var fc_burn = fc.reduceToImage([prop], ee.Reducer.max());
  fc_burn = blank.where(fc_burn.gt(0), fc_burn)
    .reproject('EPSG:4326', null, resolution);
  return fc_burn;
};


/***
 * burn property value of feature collection to map
 * fill value is zero; if multiple features take the min property value
 * 
 * inputs: feature collection with buildings, burn property, resolution
 */
var burn_map_min = function(fc, prop, resolution) {
  //make a map with zeros
  // var blank = ee.Image(0);
  // reduce fc to image and burn
  var fc_burn = fc.reduceToImage([prop], ee.Reducer.min())
  // fc_burn = blank.where(fc_burn.gt(0), fc_burn)
    .reproject('EPSG:4326', null, resolution);
  return fc_burn;
};


/* functions below are deprecated
replaced by line2road
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
var burn_map = function(fc, prop, resolution) {
  //make a map with zeroes
  var blank = ee.Image(999);
  // reduce fc to image and burn
  var fc_burn = fc.reduceToImage([prop], ee.Reducer.mean());
  fc_burn = blank.where(fc_burn.neq(0), fc_burn)
  //fc_burn = fc_burn.mask(-100)
    .reproject('EPSG:4326', null, resolution);
  return fc_burn
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
}*/



// ********* ALL INPUTS START HERE! *********************************

// set main variables
var res = ee.Number(0.5);
Map.setCenter(39.28, -6.86, 16);

// make two feature collection
var fc1 = ee.FeatureCollection([one_road, another_road]);
var fc2 = ee.FeatureCollection([road_crossing]);
var neighbourhood = ee.Geometry.Rectangle(39.25209, -6.81275, 39.27406, -6.79238);
// Map.addLayer(neighbourhood)

// var osm_lines = ee.FeatureCollection('ft:1SkMF-NggF4s8oPhWsv-ypKcQqSlBLvOyOphftxVn');
var osm_lines = ee.FeatureCollection('ft:1SapB3BgtFH4koR8rCQrhsdpvshejKWsYV4mCNuVf');
// var osm_polys = ee.FeatureCollection('ft:1RvpBw-GK43EV0CpXWi6La-txXdD-TE2xiy7JiGd1');


// *** test 1 *****
//filter some features from lines and polygons
var osm_nelsonM_road = ee.FeatureCollection(filter_fc(osm_lines,['highway', 'Name'], 
                                                    [['primary'], ['Nelson Mandela Road']])).filterBounds(bounds);
var osm_kilwa_road = ee.FeatureCollection(filter_fc(osm_lines, ['highway', 'Name'], 
                                                    [['primary'], ['Kilwa Road']])).filterBounds(bounds);
Map.addLayer(osm_nelsonM_road,{}, 'osm_nelsonM_road', false);
Map.addLayer(osm_kilwa_road,{color: 'FF0000'}, 'osm_kilwa_road', false);

// set width property to roads
var osm_roads = set_width_roads(osm_nelsonM_road, 5, 0.75);
var fc_sidewalks = osm_roads.map(get_sidewalk);
Map.addLayer(fc_sidewalks, {color: 'FF0000'}, 'sidewalk', true);
var fc_driveways = osm_roads.map(get_driveway);
Map.addLayer(fc_driveways, {}, 'driveway', true);


// set height estimates to roads
var osm_roads = set_height_AllRoads([ osm_nelsonM_road, osm_kilwa_road],
                                    [5, 5], // width
                                    [0.75, 0.75], // drive_frac
                                    [0, 1], // default layer
                                    [5, 5], // layer height
                                    [0.2, 0.2]); // sidewalk_offset

print('example road polygon');
print(osm_roads.first());

var osm_min_height = burn_map_min(osm_roads, 'burn_height', res);
addDem(osm_min_height, 'burned roads', false);

// **** test 2
var osm_motorway = filter_fc(osm_lines,['highway'], [['motorway']])
              .merge( filter_fc(osm_lines, ['highway'], [['trunk']])).filterBounds(bounds);
var osm_primary = filter_fc(osm_lines,['highway'], [['primary']]).filterBounds(bounds);
var osm_secondary = filter_fc(osm_lines, ['highway'], [['secondary']])
            .merge( filter_fc(osm_lines, ['highway'], [['tertiary']])).filterBounds(bounds);
var osm_residential = filter_fc(osm_lines, ['highway'], [['residential']])
            .merge( filter_fc(osm_lines, ['highway'], [['unclassified']])).filterBounds(bounds);


var osm_roads = set_height_AllRoads([ osm_primary, osm_secondary, osm_residential],
                                    [8, 5, 4], // width
                                    [0.75, 0.75, 0.75], // drive_frac
                                    [0, 0, 0], // default layer
                                    [5, 5, 5], // layer height
                                    [0.2, 0.2, 0.2]); // sidewalk_offset

print('example road polygon');
print(osm_roads.first());

var osm_motorway = filter_fc(osm_roads,['highway'], [['motorway']]) 
              .merge( filter_fc(osm_roads, ['highway'], [['trunk']]));
var osm_primary = filter_fc(osm_roads,['highway'], [['primary']]); 
var osm_secondary = filter_fc(osm_roads, ['highway'], [['secondary']])
            .merge( filter_fc(osm_roads, ['highway'], [['tertiary']])); 
var osm_residential = filter_fc(osm_roads, ['highway'], [['residential']])
            .merge( filter_fc(osm_roads, ['highway'], [['unclassified']]));

Map.addLayer(osm_motorway,{color: 'FF0000'}, 'osm_motorway', true);
Map.addLayer(osm_primary,{color: 'E5E500'}, 'osm_primary', true);
Map.addLayer(osm_secondary,{color: 'FFFFB2'}, 'osm_secondary', true);
Map.addLayer(osm_residential ,{color: 'B7B799'}, 'osm_residential ', true);


var osm_min_height = burn_map_min(osm_roads, 'burn_height', res);
addDem(osm_min_height, 'burned roads', false);