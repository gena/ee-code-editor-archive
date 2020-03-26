/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var l8 = ee.ImageCollection("LANDSAT/LC8_L1T_TOA"),
    dem = ee.Image("USGS/SRTMGL1_003"),
    LowerMekong_basin = ee.FeatureCollection("ft:1QlKl6goe2qPc1iVadVHbETNoiEQZGG6uO3aT-40O"),
    LowerMekong_basin_lvl8 = ee.FeatureCollection("ft:1Zk6y1LN13wepOwyj66R6d1gpV9Won-ZVaiGzs30h"),
    LowerMekong_basin_lvl8_thresholds = ee.FeatureCollection("ft:1So2xXdIcRnJpq_GOzly3bXuvnR17PCeYA1uSEVIh"),
    CountriesLowerMekong_basin = ee.FeatureCollection("ft:1nrjAesEg6hU_R7bt76AlNDN2hZl6o5-Ljw_Dglc4"),
    CountriesLowerMekong_basin_lvl8 = ee.FeatureCollection("ft:1Sq-rInjyMcX_f_szJxRVyMlqyGVVYycABsnocLOX"),
    geometry = /* color: 0B4A8B */ee.Geometry.MultiPoint(),
    l7 = ee.ImageCollection("LANDSAT/LE7_L1T_TOA"),
    hand100 = ee.ImageCollection("users/gena/global-hand/hand-100"),
    hand1000 = ee.Image("users/gena/GlobalHAND/30m/hand-1000"),
    hand1000_90m = ee.Image("users/gena/GlobalHAND/90m-global/hand-1000"),
    fa = ee.Image("WWF/HydroSHEDS/15ACC");
/***** End of imports. If edited, may not auto-convert in the playground. *****/


// Writing Otsu flood map for SERVIR-Mekong from scratch (part 2: using pre-calculated MNDWI thresholds to construct maps) 

// ---------------------------------------------------------------------------------------------------- //
// Set parameters
// ---------------------------------------------------------------------------------------------------- //

// bounds
var outer_bounds           = LowerMekong_basin;
var inner_bounds           = LowerMekong_basin_lvl8;
var thresholds_fc          = LowerMekong_basin_lvl8_thresholds;
// var outer_bounds           = CountriesLowerMekong_basin;
// var inner_bounds           = CountriesLowerMekong_basin_lvl8;
// var thresholds_fc          = CountriesLowerMekong_basin_lvl8_thresholds; // does not exist yet, still exporting!

// specify whether to use Landsat 7, 8 or both (0=l7, 1=l8, 2=both)

var l7_l8_or_both          = 1

var static_mndwi_threshold = 0.3;


// date range
var l7_date_range          = ['2013-07-01', '2015-09-30'];  // data available between 1999-04-01 and 2015-12-08 (sensor failure after 2003-05-30)
var l8_date_range          = ['2013-01-01', '2016-12-31']; // data available between 2013-04-11 and 2015-12-08 (as of 2015-12-22)

var date_range          = ['2008-01-01', '2013-12-31'];

// percentiles
var percentile_low         = 8;
var percentile_high        = 40;

// scale
var methodScale            = 30;

// threshold values
var static_mndwi_threshold = 0.3;

// Landsat band names
var LC7_BANDS             = ['B1',    'B1',   'B2',    'B3',  'B4',  'B5',    'B7',    'B8', 'B8', 'B7'];
var LC8_BANDS             = ['B1',    'B2',   'B3',    'B4',  'B5',  'B6',    'B7',    'B8', 'B10', 'BQA'];
var STD_NAMES             = ['blue2', 'blue', 'green', 'red', 'nir', 'swir1', 'swir2', 'pan', 'temp', 'BQA'];


// filter images based on specified criteria
function filterImages(imgs, bounds, dates, bands) {
  if (bounds !== null) {
    imgs = imgs.filterBounds(bounds);
    //print('filtering images on specified bounds...');
  }
  if (dates !== null) {
    imgs = imgs.filterDate(dates[0], dates[1]);
    //print('filtering images on specified dates...', dates[0], dates[1]);
  }
  if (bands !== null) {
    imgs = imgs.select(bands[0], bands[1]);
    //print('selecting and renaming bands...');
  }
  return imgs;
}

// Landsat images within bounds with selected bands
if (l7_l8_or_both === 0) {
  //print('Landsat 7');
  var images    = filterImages(l7, outer_bounds, l7_date_range, [LC7_BANDS, STD_NAMES]);
} else if (l7_l8_or_both == 1) {
  //print('Landsat 8');
  var images    = filterImages(l8, outer_bounds, l8_date_range, [LC8_BANDS, STD_NAMES]);
} else if (l7_l8_or_both == 2) {
  //print('Landsat 7 and 8');
  var images_l7 = filterImages(l7, outer_bounds, l7_date_range, [LC7_BANDS, STD_NAMES]);
  var images_l8 = filterImages(l8, outer_bounds, l8_date_range, [LC8_BANDS, STD_NAMES]);
  var images    = ee.ImageCollection(images_l7.merge(images_l8));
}


// ---------------------------------------------------------------------------------------------------- //
// Functions
// ---------------------------------------------------------------------------------------------------- //

// apply calculated thresholds per sub-basin on MNDWI and obtain water/flood maps
function getWaterMapsFromThresholdsLow (i) {
  // get MNDWI threshold
  var temp_thresh = ee.Number(ee.Feature(i).get('MNDWI_low'));
  // get geometry
  var temp_geom   = ee.Feature(i).geometry();//.buffer(methodScale);    // TEST: buffer to fix issue with no data along edges
  // clip MNDWI image
  var temp_MNDWI  = MNDWI_low.clip(temp_geom);
  // apply threshold
  return temp_MNDWI.gt(temp_thresh);
}
function getWaterMapsFromThresholdsHigh (i) {
  // get MNDWI threshold
  var temp_thresh = ee.Number(ee.Feature(i).get('MNDWI_high'));
  // get geometry
  var temp_geom   = ee.Feature(i).geometry();//.buffer(methodScale);    // TEST: buffer to fix issue with no data along edges
  // clip MNDWI image
  var temp_MNDWI  = MNDWI_high.clip(temp_geom);
  // apply threshold
  return temp_MNDWI.gt(temp_thresh);
}

// ---------------------------------------------------------------------------------------------------- //
// Loading data
// ---------------------------------------------------------------------------------------------------- //

// get geometry of outer bounds
var outer_bounds_geometry        = outer_bounds.geometry();

// Landsat images within bounds
var images   = images.filterBounds(outer_bounds_geometry).filterDate(date_range[0], date_range[1]);
//print('images:', images);

// ---------------------------------------------------------------------------------------------------- //
// Get percentile images and MNDWI
// ---------------------------------------------------------------------------------------------------- //

// percentile images
var percentileMap_low   = images.reduce(ee.Reducer.percentile([percentile_low])).rename(STD_NAMES);
var percentileMap_high  = images.reduce(ee.Reducer.percentile([percentile_high])).rename(STD_NAMES);

// MNDWI
var MNDWI_low           = percentileMap_low.normalizedDifference(['green', 'swir1']);
var MNDWI_high          = percentileMap_high.normalizedDifference(['green', 'swir1']);

// ---------------------------------------------------------------------------------------------------- //
// Static water mask
// ---------------------------------------------------------------------------------------------------- //

var water_mask_static_low  = MNDWI_low.clip(outer_bounds_geometry).gt(static_mndwi_threshold);
var water_mask_static_high = MNDWI_high.clip(outer_bounds_geometry).gt(static_mndwi_threshold);

var water_mask_static_both = water_mask_static_high.add(water_mask_static_low);

// ---------------------------------------------------------------------------------------------------- //
// Dynamic water mask
// ---------------------------------------------------------------------------------------------------- //

// convert FC to list (so it can be mapped over to create a list of images)
var thresholds_list = ee.List(thresholds_fc.toList(thresholds_fc.size()));
// thresholds_list = thresholds_list.slice(0,100);    // FOR TESTING ONLY!!

// obtain list of images
var water_mask_dynamic_low_list  = thresholds_list.map(getWaterMapsFromThresholdsLow);
var water_mask_dynamic_high_list = thresholds_list.map(getWaterMapsFromThresholdsHigh);

// convert to single image
var water_mask_dynamic_low_ic    = ee.ImageCollection(water_mask_dynamic_low_list);
var water_mask_dynamic_high_ic   = ee.ImageCollection(water_mask_dynamic_high_list);
var water_mask_dynamic_low       = water_mask_dynamic_low_ic.reduce(ee.Reducer.max()).rename(['water']).clip(outer_bounds_geometry);
var water_mask_dynamic_high      = water_mask_dynamic_high_ic.reduce(ee.Reducer.max()).rename(['water']).clip(outer_bounds_geometry);

var water_mask_dynamic_both      = water_mask_dynamic_high.add(water_mask_dynamic_low);

// ---------------------------------------------------------------------------------------------------- //
// Export/download data
// ---------------------------------------------------------------------------------------------------- //

Export.image.toDrive({image:water_mask_dynamic_both,
                      description:'SERVIR_Mekong_WaterMask_dynamic',
                      folder:'EarthEngine',
                      fileNamePrefix:'SERVIR_Mekong_WaterMask_dynamic',
                      // dimensions:,
                      region:geometry,
                      scale:30,
                      crs:'EPSG:4326',
                      // crsTransform:,
                      maxPixels:1e12
});

// ---------------------------------------------------------------------------------------------------- //
// Show data/results on map
// ---------------------------------------------------------------------------------------------------- //

// visual properties
var visProps = {min:0.06, max:0.5, gamma:1.5};

var water_index_style = '\
<RasterSymbolizer>\
  <ColorMap extended="true" >\
    <ColorMapEntry color="#ffffd9" quantity="-1.0" label="-1"/>\
    <ColorMapEntry color="#edf8b1" quantity="-0.8" label="-1"/>\
    <ColorMapEntry color="#c7e9b4" quantity="-0.6" label="-1"/>\
    <ColorMapEntry color="#7fcdbb" quantity="-0.4" label="-1"/>\
    <ColorMapEntry color="#41b6c4" quantity="-0.2" label="-1"/>\
    <ColorMapEntry color="#1d91c0" quantity="0.0" label="-1"/>\
    <ColorMapEntry color="#225ea8" quantity="0.2" label="-1"/>\
    <ColorMapEntry color="#253494" quantity="0.4" label="-1"/>\
    <ColorMapEntry color="#081d58" quantity="0.6" label="-1"/>\
    <ColorMapEntry color="#081dff" quantity="1.0" label="-1"/>\
  </ColorMap>\
</RasterSymbolizer>';

var watermask_style = '\
<RasterSymbolizer>\
  <ColorMap extended="true" >\
    <ColorMapEntry color="#ffffff" quantity="0.0" label="-1"/>\
    <ColorMapEntry color="#bcbddc" quantity="1.0" label="-1"/>\
    <ColorMapEntry color="#756bb1" quantity="2.0" label="-1"/>\
  </ColorMap>\
</RasterSymbolizer>';


//Map.centerObject(outer_bounds_geometry, 6);

// percentile maps
Map.addLayer(percentileMap_high.select(['swir1', 'nir', 'green']), visProps, 'swir1_nir_green ' + percentile_high + '%', true);
Map.addLayer(percentileMap_low.select(['swir1', 'nir', 'green']), visProps, 'swir1_nir_green ' + percentile_low + '%', false);

// MNDWI
// Map.addLayer(MNDWI_high, {}, 'mndwi ' + percentile_high + '%', false);
// Map.addLayer(MNDWI_low, {}, 'mndwi ' + percentile_low + '%', false);
Map.addLayer(MNDWI_high.sldStyle(water_index_style), {}, 'mndwi ' + percentile_high + '%  (styled)', false);
Map.addLayer(MNDWI_low.sldStyle(water_index_style), {}, 'mndwi ' + percentile_low + '% (styled)', false);

// static water maps
// Map.addLayer(water_mask_static_high, {min:0, max:1, palette:['ffffff', '0000aa']},
//               'water ' + percentile_high + '% (static)', false);
// Map.addLayer(water_mask_static_low, {min:0, max:1, palette:['ffffff', '0000ff']},
//               'water ' + percentile_low + '% (static)', false);
Map.addLayer(water_mask_static_both.sldStyle(watermask_style), {}, 
              'water ' + percentile_low + '% + ' + percentile_high + '% (static)', false);
// Map.addLayer(water_mask_static_both.updateMask(water_mask_static_both).sldStyle(watermask_style), {}, 
//               'water ' + percentile_low + '% + ' + percentile_high + '% (static, masked)', false);

// dynamic water maps
// Map.addLayer(water_mask_dynamic_high, {min:0, max:1, palette:['ffffff', '0000aa']},
//               'water ' + percentile_high + '% (dynamic)', false);
// Map.addLayer(water_mask_dynamic_low, {min:0, max:1, palette:['ffffff', '0000ff']},
//               'water ' + percentile_low + '% (dynamic)', false);
Map.addLayer(water_mask_dynamic_both.sldStyle(watermask_style).mask(water_mask_dynamic_both), {}, 
              'water ' + percentile_low + '% + ' + percentile_high + '% (dynamic)', false);
// Map.addLayer(water_mask_dynamic_both.updateMask(water_mask_dynamic_both).sldStyle(watermask_style), {}, 
//               'water ' + percentile_low + '% + ' + percentile_high + '% (dynamic, masked)', false);

Map.addLayer(thresholds_fc, {}, 'thresholds', false);
Map.addLayer(ee.Image().byte().paint(inner_bounds, 0, 1), {}, 'inner bounds', false);
Map.addLayer(ee.Image().byte().paint(outer_bounds, 0, 3), {}, 'outer bounds', false);


// estimate cloud frequency using L8
function clearFn(img) { 
  return img.select('BQA').eq(bad).reduce('max').not(); 
}

var rescale = function (img, thresholds) {
    return img.subtract(thresholds[0]).divide(ee.Number(thresholds[1]).subtract(thresholds[0]))
};

// see http://landsat.usgs.gov/qualityband.php for codes
var bad = [
  61440, 59424, 57344, 56320, 53248, // clouds
  // 31744, 28590, 28672, // cirrus
  39936, 31744, 28590, 26656 // snow/ice
  ];

var imagesBqa = filterImages(l8, outer_bounds, l8_date_range, [LC8_BANDS, STD_NAMES]).select('BQA')
var clearCount = imagesBqa.map(clearFn).sum();
var cloudFrequency = ee.Image(1).toFloat().subtract(clearCount.divide(imagesBqa.count()))

var cloudMin = 0.25
var cloudMax = 0.5
Map.addLayer(cloudFrequency.mask(rescale(cloudFrequency, [cloudMin, cloudMax])), {min: cloudMin, max: cloudMax, palette:['ffffff', 'ffff00']}, 'cloud frequency')

// blobs for cloud_frequency > 40%
var cloudThreshold = 0.4
var cloudBlobs = cloudFrequency.gte(cloudThreshold)
  .focal_min(300, 'circle', 'meters')
  .focal_max(1000, 'circle', 'meters')
  
Map.addLayer(cloudBlobs.mask(cloudBlobs), {palette:['ffff00']}, 'cloud blobs', false)

// HAND
var handMask = hand1000_90m.gt(50)
Map.addLayer(handMask.mask(handMask), {palette:'000000', opacity:0.7}, 'HAND > 50m')

handMask = handMask
  .focal_max(300, 'circle', 'meters')
  .focal_min(300, 'circle', 'meters')
  .multiply(fa.lt(700).focal_min(300, 'circle', 'meters'))
Map.addLayer(handMask.mask(handMask), {palette:'000000', opacity:0.7}, 'HAND > 50m & FA < 700 (+300m)')

Map.addLayer(fa.mask(fa.gt(700)), {palette:'000000', opacity:0.7}, 'FA > 700', false)
