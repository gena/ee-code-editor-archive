// Load in a fusion table with lines

// Below we define a function to filter featureCollections on
// one or several attributes and display them with paint on a map

var add_property = function(fc, key, value){
  // add a property with a constant value to featureCollection
  var fc_prop_check = fc.map(function(f){return f.set('has_prop', f.propertyNames().contains(key))});
  var fc_prop_exists = fc_prop_check.filter(ee.Filter.eq('has_prop', true));
  var fc_prop_notexists = fc_prop_check.filter(ee.Filter.eq('has_prop', false))
    .map(function(f){return f.set(key, value)});
  return fc_prop_notexists.merge(fc_prop_exists)
}


var burn_map = function(fc, key) {
  //fc.propertyNames().contains(key)
  var blank = ee.Image(0);
  // now reduce to image and burn
  var fc_burn = fc.reduceToImage([key], ee.Reducer.mean());
  fc_burn = blank.where(fc_burn.gte(1), fc_burn)
    .reproject('EPSG:4326', null, 0.5);
  return fc_burn
}

var fc_burn_line = function(fc, width_key, height_key, default_width, default_height){
  var buffer = fc.map(function(f) {
    return f.buffer(ee.Algorithms.If(f.get('width'), f.get('width'), default_width))
    })
  // burn height in zero map
  burn_line_fc = burn_map(buffer, height_key, default_height)
}
    
    


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

var filter_feature = function(feat_coll, keys, values, width, color, label) {
  var filter_feature = feat_coll;
  for (var i = 0; i < ee.List(keys).length().getInfo(); i++) //
    {var filter_feature = filter_feature
       .filter(ee.Filter.inList(keys[i], values[i]));
    print(i)
  }

  // var filter_feature = feat_coll
  //   .filter(ee.Filter.inList(key, value));
  var paint_feature = ee.Image(0).mask(0).toByte()
              .paint(filter_feature, 0, width);
  Map.addLayer(paint_feature, {palette:[color], opacity: 0.7}, label, false)
  return filter_feature
}

var style_dem = '\
<RasterSymbolizer>\
  <ColorMap  type="intervals" extended="false" >\
    <ColorMapEntry color="#cef2ff" quantity="-2" label="-2m"/>\
    <ColorMapEntry color="#9cd1a4" quantity="0" label="0m"/>\
    <ColorMapEntry color="#7fc089" quantity="0.05" label="0.05m" />\
    <ColorMapEntry color="#9cc78d" quantity="0.1" label="0.1m" />\
    <ColorMapEntry color="#b8cd95" quantity="0.25" label="0.25m" />\
    <ColorMapEntry color="#d0d8aa" quantity="0.5" label="0.5m" />\
    <ColorMapEntry color="#e1e5b4" quantity="0.75" label="0.75m" />\
    <ColorMapEntry color="#f1ecbf" quantity="1.0" label="1.0m" />\
    <ColorMapEntry color="#e2d7a2" quantity="1.5" label="1.5m" />\
    <ColorMapEntry color="#d1ba80" quantity="2.0" label="2.m" />\
    <ColorMapEntry color="#d1ba80" quantity="5.0" label="5.0m" />\
  </ColorMap>\
</RasterSymbolizer>';

// ********* ALL INPUTS START HERE! *********************************
var azimuth = 90;
var zenith = 60;

var osm_lines = ee.FeatureCollection('ft:1SapB3BgtFH4koR8rCQrhsdpvshejKWsYV4mCNuVf');
var osm_polys = ee.FeatureCollection('ft:1RvpBw-GK43EV0CpXWi6La-txXdD-TE2xiy7JiGd1');

// Load the SRTM 30 meter data
var srtm_30 = new ee.Image('USGS/SRTMGL1_003');

//var osm_highway_primary = osm_lines
//  .filter(ee.Filter.inList('highway', ['primary']));
var osm_highway_primary = filter_feature(osm_lines, ['highway', 'Name'], [['primary'], ['Kilwa Road ']], 2, 'FFD455', 'OSM highways primary')

var osm_building_residential = filter_feature(osm_polys, ['building'], [['residential']])

// var osm_highway_primary_image = ee.Image(0).mask(0).toByte()
//                 .paint(osm_highway_primary, 0, 5.0);

var osm_residential_burn = add_property(osm_building_residential, 'height', 5)
var residential_burn = burn_map(osm_residential_burn, 'height')

var osm_building_residential_image = ee.Image(0).mask(0).toByte()
                .paint(osm_building_residential, 1, 0.0);

//Map.addLayer(osm_lines_image, {palette:['80d9ff'], opacity: 0.7}, 'OSM lines', true);
//Map.addLayer(osm_highway_primary_image, {palette:['FFD455'], opacity: 0.7}, 'OSM highway primary', true);
//Map.addLayer(osm_building_residential_image, {palette:['CC926E'], opacity: 0.7}, 'OSM building residential', true);
Map.addLayer(hillshadeit(residential_burn.sldStyle(style_dem), residential_burn, 1.5, 4.0), {opacity: 0.5}, 'building residential burned');
Map.addLayer(osm_building_residential, {}, 'polygons')
Map.setCenter(39.264, -6.8057, 15);

print(osm_highway_primary)