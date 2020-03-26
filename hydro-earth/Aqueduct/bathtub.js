//bathtub test for Aqueduct coastal inundation

var colors_dem = ['006837', '1a9850', '66bd63', 'a6d96a', 'd9ef8b', 'ffffbf', 'fee08b', 'fdae61', 'f46d43', 'd73027', 'a50026', 'ffffff']
//Map.setCenter(39.75, -5, 10);

// Load the SRTM 30 meter data
var srtm_30 = new ee.Image('USGS/SRTMGL1_003');

// load fusion table with extreme values
//var dflow_ev = ee.FeatureCollection('ft:1l0utifkn8YcJ0pbTD8UmzWRvThxoHbzIy40_FX-M');
var dflow_ev = ee.FeatureCollection('ft:1Q8uxqC5K_hfecO7IYDQY6sJ_zXACgt0X1PgvSjv8');

Map.centerObject(dflow_ev, 5)

dflow_ev = dflow_ev.filterBounds(Map.getBounds(true))

print(dflow_ev)

/*
var crs = ee.Projection("EPSG:3857");
var distance = 1500000;
var step = 100000;
var crs_transform = [step, 0, 0, 0, -step, 0]

var pointImage = ee.FeatureCollection([ee.Feature(dflow_ev.first())]).reduceToImage(['rp00100'], ee.Reducer.max());
      
var dilation = pointImage
   .focal_max(distance, 'circle', 'meters')
   
Map.addLayer(dilation.reproject(crs, crs_transform), {}, 'dilation')   
Map.addLayer(dilation.mask().not().reproject(crs, crs_transform), {min:0, max:1, palette:['000000','ffffff']}, 'dilation mask not')   

var d = dilation.mask().not()
        .distance(ee.Kernel.euclidean(distance, 'meters'))
        .mask(dilation).subtract(distance).multiply(-1);

Map.addLayer(d.reproject(crs, crs_transform), {min:0, max:distance, palette:['000000', 'ffffff']}, 'distance')   
*/



// TODO: generate regular grid and group points by grid cells, then run IDW per grid cell

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
    var distance = opt_distance || 1500000;
    var step = opt_step || 100000;
    var crs_transform = [step, 0, 0, 0, -step, 0]

/*
    var info = srtm_30.getInfo().bands[0]
    var crs = ee.Projection(info.crs);
    var t = info.crs_transform
    var crs_transform = [t[0] * 1000, t[1], t[2], t[3], t[4] * 1000, t[5]]
*/
    var power = opt_power || 3;

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

var average = idw(dflow_ev, 'rp00100')

Map.addLayer(average.clip(Map.getBounds(true)), {min: 0, max: 6, palette: ['000000, 00FF00'], opacity: 0.8}, 'S10_average', false)

/*
var crs = ee.Projection("EPSG:3857")
var crs_transform = [50000,0,0,0,50000,0]

var d = 3000000;

var featureImage = dflow_ev.reduceToImage(['S10'], ee.Reducer.max());
  
var dilation = featureImage
      .focal_mean(d, 'circle', 'meters')
      .reproject(crs, crs_transform);

var distance = dilation.mask().not()
    .distance(ee.Kernel.euclidean(d, 'meters'))
    .reproject(crs, crs_transform).mask(dilation);

Map.addLayer(dilation, {min: 4, max: 6, palette: ['000000', 'FF0000']}, 'S10_dilation', false)
Map.addLayer(distance, {min: 0, max: d, palette: ['000000', 'FF0000']}, 'S10_distance')
*/

Map.addLayer(dflow_ev.reduceToImage(['rp00100'], ee.Reducer.max()).focal_max(5), {min: 0, max: 6, palette: ['000000, 00FF00'], opacity: 0.5}, 'rp 100');
Map.addLayer(srtm_30, {min:-2, max: 500, palette: colors_dem, opacity: 0.5}, 'srtm', true);




/* grid
// Bounding coordinates:
var lon_start = -25;
var lon_end = 50;
var lat_start = 35;
var lat_end = 72;

// Cell size (edge of a square) in degrees
var dx = 20;
var dy = 10;

var polys = [];
for (var lon = lon_start; lon < lon_end; lon += dx) {
  var x1 = lon - dx/2;
  var x2 = lon + dx/2;
  for (var lat = lat_start; lat < lat_end; lat += dy) {
    var y1 = lat - dy/2;
    var y2 = lat + dy/2;
    polys.push(ee.Geometry.Rectangle(x1, y1, x2, y2));
  }
}
var grid = ee.FeatureCollection(polys);

Map.addLayer(grid)
Map.centerObject(grid, 5)


polys.map(function(cell)
{
  points.filterBounds(cell)
    .map()
})

*/