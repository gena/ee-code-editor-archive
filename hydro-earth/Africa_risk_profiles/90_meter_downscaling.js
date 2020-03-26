var azimuth = 90;
var zenith = 60;
//var fine_scale = [0.00027777777777777777777777776, 0, -180, 0, -0.00027777777777777777777777776, 60]
var fine_scale = [0.00083333333333333333333333333, 0, -180, 0, -0.00083333333333333333333333333, 60]
var coarse_scale = [0.0083333333333333, 0, -180, 0, -0.00833333333333333333, 60]
var colors_dem = ['006837', '1a9850', '66bd63', 'a6d96a', 'd9ef8b', 'ffffbf', 'fee08b', 'fdae61', 'f46d43', 'd73027', 'a50026', 'ffffff']
// hypothetical 0.5 meter flooding everywhere

//var flood = ee.Image(0.5).reproject('EPSG:4326', coarse_scale)  // meters average over pixel

// real 100-yr flood
var flood = ee.Image('GME/images/12702757807442970300-16555504137828543390').divide(10);

var dem_senegal = ee.Image('GME/images/12702757807442970300-04328481494314888890')
var dem_niger = ee.Image('GME/images/12702757807442970300-07321328812910646410')
var dem_horn = ee.Image('GME/images/12702757807442970300-15376670774087721723')

var hand = ee.ImageCollection.fromImages([dem_senegal, dem_niger, dem_horn]);

var dem = hand.mosaic().reproject('EPSG:4326', fine_scale)

/*var dem = ee.Image('srtm90_v4');
var dem = dem_horn;
// var dem = dem_senegal.mosaic()
*/
print(flood);

//load the admin1 polygons of target countries Senegal, Niger, Ethiopia, Kenya and Uganda
var admin1 = ee.FeatureCollection('ft:1zEDcUlSsLAQwrpxAZfpUJNLEghCxUGraceB2bFfc')
/*
function flood_fill(flood_depth, elevation) {
  
}
*/
function radians(img) { return img.toFloat().multiply(3.1415927).divide(180); }

// DEM Hillshade function - Compute hillshade for the given illumination az, el.
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
//intervals
var style_dem = '\
<RasterSymbolizer>\
  <ColorMap  type="graduated" extended="false" >\
    <ColorMapEntry color="#cef2ff" quantity="-20" label="-200m"/>\
    <ColorMapEntry color="#9cd1a4" quantity="0" label="0m"/>\
    <ColorMapEntry color="#7fc089" quantity="5" label="50m" />\
    <ColorMapEntry color="#9cc78d" quantity="10" label="100m" />\
    <ColorMapEntry color="#b8cd95" quantity="25" label="250m" />\
    <ColorMapEntry color="#d0d8aa" quantity="50" label="500m" />\
    <ColorMapEntry color="#e1e5b4" quantity="75" label="750m" />\
    <ColorMapEntry color="#f1ecbf" quantity="100" label="1000m" />\
    <ColorMapEntry color="#e2d7a2" quantity="125" label="1250m" />\
    <ColorMapEntry color="#d1ba80" quantity="150" label="1500m" />\
    <ColorMapEntry color="#d1ba80" quantity="1000" label="10000m" />\
  </ColorMap>\
</RasterSymbolizer>';

// The region to reduce within.
//var poly_small = ee.Geometry.Rectangle(20.0000000000000001, -20.008333333333334, 20.0083333333334, -19.9999999999999999999);
var poly_small = ee.Geometry.Rectangle(20.008333333333333333333, -20.008333333333334, 20.0166666666666666667, -19.9999999999999999999);
var poly = ee.Geometry.Rectangle(20.0083333333, -20.0041666666666667, 21.008333333333, -19);
//var poly_small = ee.Geometry.Rectangle(20.000416666666667, -20.0079166666666666667, 20.007916666666666666667, -20.0004166666666666667);
//var poly_medium = ee.Geometry.Rectangle(19.9, -20.1, 20.1, -19.9);
var poly_medium = ee.Geometry.Rectangle(20.0083333333, -20.0041666666666667, 21.008333333333, -19);
var dem_medium_mean = dem.clip(poly_medium)
/*
  .toFloat()
  .focal_mean(14.5, 'square', 'pixels')
  .reproject('EPSG:4326', fine_scale)
  .reproject('EPSG:4326', coarse_scale)

var dem_medium_mean2 = dem_medium_mean
  .reproject('EPSG:4326', fine_scale)
  .focal_mean(14.5, 'square', 'pixels')
  .reproject('EPSG:4326', fine_scale)
  .reproject('EPSG:4326', coarse_scale)

var diff = dem_medium_mean.subtract(dem_medium_mean2)
Map.centerObject(diff)
Map.addLayer(diff, {min:-0.001, max: 0.001}, 'diff')

Map.addLayer(dem_medium_mean, {min:1180, max: 1200}, 'mean 1')
Map.addLayer(dem_medium_mean2, {min:1180, max: 1200}, 'mean 2')
var sum_diff = diff.reduceRegion(ee.Reducer.sum(), poly_medium, 30);
print(sum_diff)
*/

var dem_min = dem.clip(poly_medium)
  .toFloat()
  .focal_min(4.5, 'square', 'pixels')
  .reproject('EPSG:4326', fine_scale)
  .reproject('EPSG:4326', coarse_scale)
  
var dem_max = dem.clip(poly_medium)
  .toFloat()
  .focal_max(4.5, 'square', 'pixels')
  .reproject('EPSG:4326', fine_scale)
  .reproject('EPSG:4326', coarse_scale)
//var poly_small = ee.Geometry.Rectangle(20.000416666666667, -20.0079166666666666667, 20.5, -19.5);

/*
Map.addLayer(hillshadeit(dem.clip(poly_small).sldStyle(style_dem), dem, 1.5, 4.0), {}, 'small polygon')
Map.addLayer(dem.clip(poly_small)
  .toFloat()
  .focal_mean(14.5, 'square', 'pixels')
  .reproject('EPSG:4326', fine_scale)
  .reproject('EPSG:4326', coarse_scale), {
    min:1186, max: 1190},
    'small reproject')
*/


// normalize DEM
var dem_norm = dem.clip(poly_medium).subtract(dem_min)
//Map.centerObject(dem_norm)

//Map.addLayer(dem_norm, {palette: colors_dem, min: 0, max: 100}, 'norm dem')

var dem_max = ee.Image(10).mask(flood.neq(0)).reproject('EPSG:4326', coarse_scale).clip(poly_medium);
var dem_min = ee.Image(0).reproject('EPSG:4326', coarse_scale).clip(poly_medium);

var iter = 10
// loop over min/max
for(var i = 0; i < iter; i++) {
  //Map.addLayer(dem_min, {min:0, max: 50}, 'min')
  //Map.addLayer(dem_max, {min:0, max: 50}, 'max')
  var flood_level = (dem_min.add(dem_max)).divide(2)
  //Map.addLayer(flood_level, {min: 0, max: 5}, 'flood layer');
  // compute depth values in small scale cells and compute average
  var depth_av = ((flood_level.subtract(dem_norm)).max(0))
    .toFloat()  // convert to floats
  .focal_mean(4.5, 'square', 'pixels')  // estimate moving mean at very fine resolution
  .reproject('EPSG:4326', fine_scale)  // select very fine resolution (10 meter)
  .reproject('EPSG:4326', coarse_scale);  // then upscale again to the 900 (0.0083333 deg.) meter scale
  var error = flood.subtract(depth_av);
  var err_positive = error.gt(0);
  var dem_min = dem_min.where(err_positive, flood_level);
  var dem_max = dem_max.where(err_positive.not(), flood_level);
  //print(dem_max)
  var error_abs = error.abs();
  //Map.addLayer(error_abs, {min: 0, max: 5}, 'error');
  
}
var flood_depth = (flood_level.subtract(dem_norm)).max(0);

Map.addLayer(hillshadeit(dem.sldStyle(style_dem), dem, 1.5, 4.0), {}, 'elevation HydroSHEDS conditioned (sld)', true);
Map.addLayer(admin1)

Map.addLayer(flood_depth.mask(flood_depth.neq(0)), {min: 0, max: 1, palette: 'FFFFFF, 0404FF'}, 'flood_distr', false);
//Map.addLayer(i.mask(i.divide(10)), {min:0, max:50, palette: ['00ff00', '0000ff']})
Map.addLayer(flood.mask(flood), {min: 0, max: 5, palette: ['00ff00', '0000ff']}, 'flood', true);


/*
#            while np.logical_and(error_abs > error_thres, dem_min < dem_max):
#                dem_av = (dem_min + dem_max)/2
#                # compute value at dem_av
#                average_depth_cell = np.mean(np.maximum(dem_av - dem_vals, 0))
#                error = (depth_cell-average_depth_cell)/depth_cell
#                # check if the error is positive (more water is needed) or negative (less water!)
#                if error > 0:
#                    dem_min = dem_av
#                else:
#                    dem_max = dem_av
#                error_abs = np.abs(error)
#                #print('Error = {:f}, min={:f}, max={:f}').format(error, dem_min, dem_max)
#                if dem_min == dem_max:
#                    print('convergence not reached in cell {:d}, probably a coastal cell!').format(cell)
#                    continue
#            flood_map[yidx, xidx] = np.maximum(dem_av - dem_norm[yidx, xidx], 0)
*/

/*

Map.addLayer(dem_mean, {
    min:1186, max: 1190},
    'medium reproject')
Map.addLayer(dem_medium_min, {
    min:1186, max: 1190},
    'min medium reproject')

Map.addLayer(dem_max, {
    min:1186, max: 1190},
    'max medium reproject')



Map.addLayer(dem.clip(poly_small), {min:1186, max: 1190}, 'small polygon values')


*/

/*

var dem_array = dem.clip(poly_small).toFloat().select('elevation').toArray().arrayProject([0])
print(dem_array)
*/

//var path = dem.clip(poly_small).getDownloadURL()
//print(path);
var mean = dem.reduceRegion(ee.Reducer.mean(), poly_small, 30);

//create a blank image to paint reserve onto
var adm1Img = ee.Image().toByte();

// paint the feature image with colour 1 from the palette
var adm1Fill = adm1Img.paint(admin1, 1);

// outline the feature with colour 0 and width 3
var adm1Comp = adm1Fill.paint(admin1,2, 4);

// Display the reserve.
addToMap(adm1Comp,{
    palette: '000000,FF0000,00FF00,0000FF',
    max: 3, //max on value mapped in FF.  See ee.dataGetMapId to get help on these parameters
    opacity: 0.4
    },
    'countries_coloured');
    
print(admin1)
// Print the result to the console.
print(mean);
