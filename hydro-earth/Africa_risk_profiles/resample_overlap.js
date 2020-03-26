// Import a flood map and resample with averaging to 2x2 pixels with overlap

var fine_scale = [0.00083333333333333333333333333, 0, -180, 0, -0.00083333333333333333333333333, 60]
var scale_15_arc = [0.0041666666666667, 0, -180, 0, -0.0041666666666667, 60]
var scale_30_arc = [0.0083333333333333, 0, -180, 0, -0.00833333333333333333, 60]
var scale_60_arc = [0.01666666666666667, 0, -179.9958333333333333, 0, -0.01666666666666667, 59.9958333333333333]
//var scale_60_arc = [0.01666666666666667, 0, -180, 0, -0.01666666666666667, 60]
//var scale_60_arc = [0.05, 0, -180, 0, -0.05, 60]

// load map layers
var flood = ee.Image(ee.Image('GME/images/12702757807442970300-16555504137828543390').select(['b1']));
var dem = ee.Image('srtm90_v4');


// small area to reduce to
var poly_small = ee.Geometry.Rectangle(20.008333333333333333333, -20.008333333333334, 20.0166666666666666667, -19.9999999999999999999);
var poly = ee.Geometry.Rectangle(20.0083333333, -20.0041666666666667, 21.008333333333, -19);
//var poly_small = ee.Geometry.Rectangle(20.000416666666667, -20.0079166666666666667, 20.007916666666666666667, -20.0004166666666666667);
//var poly_medium = ee.Geometry.Rectangle(19.9, -20.1, 20.1, -19.9);
var poly_medium = ee.Geometry.Rectangle(23.004166666666666667, -15.0041666666666667, 24.0041666666666666667, -14);

// resample flood maps
var flood_60 = flood.clip(poly_medium)
  .toFloat().divide(10)
  .focal_mean(10, 'square', 'pixels')
  .toFloat()
  .reproject('EPSG:4326', fine_scale)
  .reproject('EPSG:4326', scale_60_arc)

var flood_60 = flood_60.mask(flood_60.gt(0))

Map.centerObject(flood_60)
  
// resample DEM
var dem_min = dem.clip(poly_medium)
  .toFloat()
  .focal_min(10, 'square', 'pixels')
  .reproject('EPSG:4326', fine_scale)
  .reproject('EPSG:4326', scale_60_arc)
  
var dem_max = dem.clip(poly_medium)
  .toFloat()
  .focal_max(10, 'square', 'pixels')
  .reproject('EPSG:4326', fine_scale)
  .reproject('EPSG:4326', scale_60_arc)
//var poly_small = ee.Geometry.Rectangle(20.000416666666667, -20.0079166666666666667, 20.5, -19.5);

var dem_min = dem.clip(poly_medium)
  .toFloat()
  .focal_min(10, 'square', 'pixels')
  .reproject('EPSG:4326', fine_scale)
  .reproject('EPSG:4326', scale_60_arc)

// normalize DEM
var dem_norm = dem.clip(poly_medium)
  .toFloat()
  .subtract(dem_min)

//Map.addLayer(dem_norm, {palette: colors_dem, min: 0, max: 100}, 'norm dem')

var dem_max = ee.Image(10).mask(flood_60.neq(0)).reproject('EPSG:4326', scale_60_arc).clip(poly_medium);
var dem_min = ee.Image(0).reproject('EPSG:4326', scale_60_arc).clip(poly_medium);

var iter = 10
// loop over min/max
for(var i = 0; i < iter; i++) {
  //Map.addLayer(dem_min, {min:0, max: 50}, 'min')
  //Map.addLayer(dem_max, {min:0, max: 50}, 'max')
  var flood_level = (dem_min.add(dem_max)).divide(2).reproject('EPSG:4326', scale_60_arc)
  //Map.addLayer(flood_level, {min: 0, max: 5}, 'flood layer');
  // compute depth values in small scale cells and compute average
  var depth_av = ((flood_level.subtract(dem_norm)).max(0))
    .toFloat()  // convert to floats
  .focal_mean(10, 'square', 'pixels')  // estimate moving mean at very fine resolution
  .reproject('EPSG:4326', fine_scale)  // select very fine resolution (10 meter)
  .reproject('EPSG:4326', scale_60_arc);  // then upscale again to the 900 (0.0083333 deg.) meter scale
  var error = flood_60.subtract(depth_av).reproject('EPSG:4326', scale_60_arc);
  var err_positive = error.gt(0);
  var dem_min = dem_min.where(err_positive, flood_level);
  var dem_max = dem_max.where(err_positive.not(), flood_level);
  //print(dem_max)
  var error_abs = error.abs();
  //Map.addLayer(error_abs, {min: 0, max: 5}, 'error');
  
}
var flood_depth = (flood_level.subtract(dem_norm)).max(0).reproject('EPSG:4326', fine_scale);

Map.addLayer(flood_60, {   //
    min: 0, max: 5, palette: ['00ff00', '0000ff']},
    'flood_60', false);
Map.addLayer(flood.mask(flood), {
    min: 0, max: 5, palette: ['00ff00', '0000ff']},
    'flood_30', false);
Map.addLayer(flood_depth.mask(flood_depth.neq(0)), {min: 0, max: 5, palette: 'FFFFFF, FF04AA'}, 'flood_distr', true);
print(flood_depth)

/*
Map.addLayer(dem_mean_30, {
    min:1186, max: 1190}, '30 arcsec')
Map.addLayer(dem_mean_60, {
    min:1186, max: 1190}, '60 arcsec')
*/
/*
var path = flood_depth.getDownloadURL();
print('Download link flood depth')
print(path);
*/