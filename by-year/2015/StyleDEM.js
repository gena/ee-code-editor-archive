// style DEM

var azimuth = 90;
var zenith = 60;

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


// =========== dem
var dem30 = ee.Image('USGS/SRTMGL1_003');

var dem = ee.Image('USGS/NED'); var name = 'NED 10m'
//var dem = ee.Image('srtm90_v4');
//var dem = ee.Image('NOAA/NGDC/ETOPO1').select('bedrock');
//var dem = ee.Image('WWF/HydroSHEDS/03CONDEM');

//var dem = ee.ImageCollection('AU/GA/AUSTRALIA_5M_DEM').mosaic(), name = 'AU 5m';
// var dem = ee.Image('NASA/ASTER_GED/AG100_003').select('elevation'), name='ASTER 100';
print(dem)

Map.addLayer(dem, {}, name + ' (raw)', false)

var etopo = ee.Image('NOAA/NGDC/ETOPO1').select('bedrock');

var dem_min = 100;
var dem_max = 5000;

var water_min = -5000;
var sea_level = -20;

var colors_dem = ['006837', '1a9850', '66bd63', 'a6d96a', 'd9ef8b', 'ffffbf', 'fee08b', 'fdae61', 'f46d43', 'd73027', 'a50026', 'ffffff']
var colors_water = ['023858', '045a8d', '0570b0', '3690c0', '74a9cf', 'a6bddb'/*, 'd0d1e6', 'ece7f2', 'fff7fb'*/];

// ===========  add ETOPO1 where we don't have SRTM
var v = etopo.mask(etopo.gt(sea_level)).visualize({palette:colors_dem, min:dem_min, max:dem_max, opacity: 1.0});
Map.addLayer(hillshadeit(v, etopo, 2.0, 1.0), {}, 'elevation (rest)');

// =========== add DEM on top
var v = dem.mask(dem.gt(sea_level)).visualize({palette:colors_dem, min:dem_min, max:dem_max, opacity: 1.0});
Map.addLayer(hillshadeit(v, dem, 2.0, 1.0), {}, 'elevation ' + name);


var style_dem = '\
<RasterSymbolizer>\
  <ColorMap  type="intervals" extended="false" >\
    <ColorMapEntry color="#cef2ff" quantity="-200" label="-200m"/>\
    <ColorMapEntry color="#9cd1a4" quantity="0" label="0m"/>\
    <ColorMapEntry color="#7fc089" quantity="50" label="50m" />\
    <ColorMapEntry color="#9cc78d" quantity="100" label="100m" />\
    <ColorMapEntry color="#b8cd95" quantity="250" label="250m" />\
    <ColorMapEntry color="#d0d8aa" quantity="500" label="500m" />\
    <ColorMapEntry color="#e1e5b4" quantity="750" label="750m" />\
    <ColorMapEntry color="#f1ecbf" quantity="1000" label="1000m" />\
    <ColorMapEntry color="#e2d7a2" quantity="1250" label="1250m" />\
    <ColorMapEntry color="#d1ba80" quantity="1500" label="1500m" />\
    <ColorMapEntry color="#d1ba80" quantity="10000" label="10000m" />\
  </ColorMap>\
</RasterSymbolizer>';



var style_dem = '\
<RasterSymbolizer>\
  <ColorMap  type="intervals" extended="false" >\
    <ColorMapEntry color="#cef2ff" quantity="-20" label="-20m"/>\
    <ColorMapEntry color="#0000ff" quantity="0" label="0m"/>\
    <ColorMapEntry color="#0000ff" quantity="1" label="1m" />\
    <ColorMapEntry color="#0000ff" quantity="2" label="2m" />\
    <ColorMapEntry color="#b8cd95" quantity="3" label="3m" />\
    <ColorMapEntry color="#d0d8aa" quantity="5" label="5m" />\
    <ColorMapEntry color="#e1e5b4" quantity="10" label="10m" />\
    <ColorMapEntry color="#f1ecbf" quantity="50" label="50m" />\
    <ColorMapEntry color="#e2d7a2" quantity="1250" label="1250m" />\
    <ColorMapEntry color="#d1ba80" quantity="1500" label="1500m" />\
    <ColorMapEntry color="#d1ba80" quantity="10000" label="10000m" />\
  </ColorMap>\
</RasterSymbolizer>';


// var v = dem.mask(dem);
Map.addLayer(hillshadeit(dem.sldStyle(style_dem), dem, 1.5, 4.0), {}, 'elevation (sld) ' + name);


var style_dem = '\
<RasterSymbolizer>\
  <ColorMap  type="intervals" extended="false" >\
    <ColorMapEntry color="#cef2ff" quantity="-20" label="-20m"/>\
    <ColorMapEntry color="#0000ff" quantity="0" label="0m"/>\
    <ColorMapEntry color="#0000ff" quantity="1" label="1m" />\
    <ColorMapEntry color="#0000ff" quantity="2" label="2m" />\
    <ColorMapEntry color="#0000ff" quantity="3" label="3m" />\
    <ColorMapEntry color="#0000ff" quantity="5" label="5m" />\
    <ColorMapEntry color="#e1e5b4" quantity="10" label="6m" />\
    <ColorMapEntry color="#f1ecbf" quantity="50" label="50m" />\
    <ColorMapEntry color="#e2d7a2" quantity="1250" label="1250m" />\
    <ColorMapEntry color="#d1ba80" quantity="1500" label="1500m" />\
    <ColorMapEntry color="#d1ba80" quantity="10000" label="10000m" />\
  </ColorMap>\
</RasterSymbolizer>';
 // var v = dem.mask(dem);
Map.addLayer(hillshadeit(dem.sldStyle(style_dem), dem, 1.5, 4.0), {}, 'elevation (sld) +5m' + name);

var dem = ee.Image('WWF/HydroSHEDS/03CONDEM');
//var v = dem.mask(dem);
Map.addLayer(hillshadeit(dem.sldStyle(style_dem), dem, 1.5, 4.0), {}, 'elevation HydroSHEDS conditioned (sld)');


// =========== add bathymetry

var bathymetry = ee.Image('NOAA/NGDC/ETOPO1').select('bedrock')
/*    .focal_max({radius: 1000, units: 'meters'})
    .focal_mode({radius: 1000, units: 'meters', iterations: 5})
    .focal_min({radius: 1000, units: 'meters'})
*/

v = bathymetry/*.mask(bathymetry.lt(sea_level))*/.visualize({palette:colors_water, min:water_min, max:sea_level, opacity: 1.0});
Map.addLayer(hillshadeit(v, bathymetry, 1.2, 1.0), {}, 'bathymetry');

// =========== add DEM (30m) on top
Map.addLayer(hillshadeit(dem30.mask(dem30.gt(sea_level)).sldStyle(style_dem), dem30, 1.5, 4.0), {}, 'elevation 30m (sld)');


// =========== add Viewfinderpanorama DEM (90m) 
var demVFP = ee.ImageCollection.fromImages([
  ee.Image('users/gena/ViewfinderpanoramaDEM/VFP_DEM1'),
  ee.Image('users/gena/ViewfinderpanoramaDEM/VFP_DEM2'),
  ee.Image('users/gena/ViewfinderpanoramaDEM/VFP_DEM3'),
  ee.Image('users/gena/ViewfinderpanoramaDEM/VFP_DEM4'),
  ee.Image('users/gena/ViewfinderpanoramaDEM/VFP_DEM5'),
  ee.Image('users/gena/ViewfinderpanoramaDEM/VFP_DEM6'),
  ee.Image('users/gena/ViewfinderpanoramaDEM/VFP_DEM7'),
  ee.Image('users/gena/ViewfinderpanoramaDEM/VFP_DEM8')
  ]).mosaic()

//BUG in EE  
//Map.addLayer(hillshadeit(demVFP.mask(demVFP.gt(sea_level)).sldStyle(style_dem), demVFP, 1.5, 4.0), {}, 'elevation Viewfinderpanorama 90m (sld)');

for (var i = 1; i <= 8; i++) {
  var g = ee.Image('users/gena/ViewfinderpanoramaDEM/VFP_DEM' + i);
  Map.addLayer(hillshadeit(g.mask(g.gt(sea_level)).sldStyle(style_dem), g, 1.5, 4.0), {}, 'elevation Viewfinderpanorama 90m (sld) ' + i, false);
}

// ========== add catchments
//var catchments_sa = ee.FeatureCollection('ft:1jIrJzKPsmXmClq6MnCU5hr46pv47P_B56AQsVD99')
//Map.addLayer(catchments_sa)



Map.addLayer(ee.Image().paint(ee.FeatureCollection('TIGER/2016/Roads'),1,1), {palette:['ffffff']}, 'roads')
Map.addLayer(ee.Image().paint(ee.FeatureCollection('TIGER/2010/Blocks'),1,1), {palette: ['ffff00']}, 'blocks')