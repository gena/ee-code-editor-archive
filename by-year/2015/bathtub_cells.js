/**
 * Interpolate a set of points using IDW algorithm.
 *
 * w_i = 1/d_i ^ p
 * x = sum(w_i * x_i) / sum(w_i)
 * 
 * @param {ee.FeatureCollection} points - Points to be interpolated.
 * @param {string} property - Property containing values to interpolate.
 * @param {ee.Projection=} opt_crs - Projection to use for rasters during interpolation. The default value is Web Mercator.
 * @param {number=} opt_distance - Maximum distance to search around points. The default value is 3000000
 * @param {number=} opt_step - Step to use. The default values is 50000.
 * @param {number=} opt_power - Power. The default values is 3.
 * 
 * @return {ee.Image} Image containing interpolated values.
 */
 var idw = function(points, property, opt_crs, opt_distance, opt_step, opt_power) {
    var crs = opt_crs || ee.Projection("EPSG:3857");
    var distance = opt_distance || 500000;
    var step = opt_step || 20000;
    var crs_transform = [step, 0, 0, 0, -step, 0]

/*
    var info = srtm_30.getInfo().bands[0]
    var crs = ee.Projection(info.crs);
    var t = info.crs_transform
    var crs_transform = [t[0] * 1000, t[1], t[2], t[3], t[4] * 1000, t[5]]
*/
    var power = opt_power || 2;

    return ee.ImageCollection(points.map(function(f){
      var pointImage = ee.FeatureCollection([f]).reduceToImage([property], ee.Reducer.max());
      
      var dilation = pointImage
          .focal_max(distance, 'circle', 'meters')

      var d = dilation.mask().not()
        .distance(ee.Kernel.euclidean(distance, 'meters'))
        .mask(dilation).subtract(distance).multiply(-1);
    
      var w = ee.Image(1.0).divide(d.pow(power));
      
      var wv = dilation.multiply(w);
    
      return wv.addBands(w)
  })).sum().expression("b(0)/b(1)").reproject(crs, crs_transform)
}


// loop over tiles and interpolate features within tiles with IDW
// load fusion table with extreme values
//var dflow_ev = ee.FeatureCollection('ft:1l0utifkn8YcJ0pbTD8UmzWRvThxoHbzIy40_FX-M');
var dflow_ev = ee.FeatureCollection('ft:1Q8uxqC5K_hfecO7IYDQY6sJ_zXACgt0X1PgvSjv8');
// Load the SRTM 30 meter data
var srtm_30 = new ee.Image('USGS/SRTMGL1_003');

var srtm_30_reproj = srtm_30.reproject('EPSG:4326', null, 900).float()
//Map.centerObject(dflow_ev, 5)

//dflow_ev = dflow_ev.filterBounds(Map.getBounds(true))

//print(dflow_ev)

// grid
// Bounding coordinates:
/*
var lon_start = -180;
var lon_end = 180;
var lat_start = -90;
var lat_end = 90;
*/

var lon_start = 0;
var lon_end = 5;
var lat_start = 50;
var lat_end = 55;


// Cell size (edge of a square) in degrees
var dx = 0.5;
var dy = 0.5;
var dx_overlap = 0.25;
var dy_overlap = 0.25;

var polys = [];
for (var lon = lon_start; lon < lon_end; lon += dx) {
  var x1 = lon - dx/2 - dx_overlap;
  var x2 = lon + dx/2 + dx_overlap;
  for (var lat = lat_start; lat < lat_end; lat += dy) {
    var y1 = lat - dy/2 - dy_overlap;
    var y2 = lat + dy/2 + dy_overlap;
    polys.push(ee.Geometry.Rectangle(x1, y1, x2, y2));
  }
}

var grid = ee.FeatureCollection(polys);

var compute_minmax_elev = function(feature) {
  // add property containing grid cell minimum value
  // reduce SRTM by region
  var minMax = srtm_30_reproj.reduceRegion(ee.Reducer.minMax(), feature.geometry())

  // set value to feature and return
  return feature
    .set('elevation_min', minMax.get('elevation_min'))
    .set('elevation_max', minMax.get('elevation_max'))
}

grid = grid.map(compute_minmax_elev);
grid = grid.filter(ee.Filter.and(ee.Filter.lt('elevation_min', 10), ee.Filter.gt('elevation_max', 0)))

// Now only coastal areas are within the grid
var idw_per_cell = function(grid_cell) {
  var dflow_cell = dflow_ev.filterBounds(ee.FeatureCollection([grid_cell]))
  
  if (ee.Algorithms.If(dflow_cell.toList(1).length().gt(0))){
    var idw_cell = idw(dflow_cell, 'rp00100')
    print(idw_cell)
    return idw_cell
  }

  return ee.Image(0)
}

print(idw_per_cell(ee.Feature(grid.first())))
var interpolated_data = grid.map(idw_per_cell);
Map.addLayer(interpolated_data)

print(interpolated_data)
// MOSAICING DOES NOT WORK YET!!!

var mos = ee.ImageCollection(interpolated_data).mosaic();

// add mosaiced interpolated data
Map.addLayer(mos, {
  min: 0,
  max: 6,
  palette: ['000000, 00FF00']
  },
  'interpolated_data')

/*
// get the first from the grid polygons used
var grid_cell = grid.first();

Map.addLayer(ee.FeatureCollection([grid_cell]), {
  palette: 'FF0000'
}, 'grid_cell');


Map.addLayer(dflow_cell.reduceToImage(['rp00100'],
  ee.Reducer.max()).focal_max(5),
  {min: 0, max: 6, palette: ['000000, 00FF00'], opacity: 0.5},
  'rp 100');

Map.addLayer(average.clip(grid_cell), {
  min: 0,
  max: 6,
  palette: ['000000, 00FF00'],
  opacity: 0.8},
  'rp_100_average',
  true);

Map.addLayer(average.clip(Map.getBounds(true)), {
  min: 0,
  max: 6,
  palette: ['000000, 00FF00'],
  opacity: 0.8},
  'rp_100_average',
  false);
*/

Map.addLayer(grid, {}, 'grid', false);
Map.centerObject(grid, 7);

/*


Map.addLayer(grid.reduceToImage({
  properties: ['min_elevation'],
  reducer: ee.Reducer.max()}).reproject('EPSG:4326', null, 900), {
  min: 0,
  max: 30,
  palette: ['000000, 00FF00, 0000FF']},
//  opacity: 0.5},
  'elevation_min',
  false);

Map.addLayer(dflow_ev.reduceToImage(['rp00100'],
  ee.Reducer.max()).focal_max(5),
  {min: 0, max: 6, palette: ['000000, 00FF00'], opacity: 0.5},
  'rp 100');
*/
