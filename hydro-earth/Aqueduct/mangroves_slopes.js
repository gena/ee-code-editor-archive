function dilate(f) { 
  return ee.Feature(f.geometry().buffer(5000, 1000)) 
}

function clean_f(f) {
  return ee.Feature(f.geometry()).set('CLSFID', ee.Number(f.get('CLSFID')).toInt())
}

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

var compute_minmax_elev = function(feature) {
  // add property containing grid cell minimum value
  // reduce SRTM by region
  var minMax = srtm_30_reproj.reduceRegion(ee.Reducer.minMax(), feature.geometry())

  // set value to feature and return
  return feature
    .set('elevation_min', minMax.get('elevation_min'))
    .set('elevation_max', minMax.get('elevation_max'))
}

var add_percentiles_in_buffer = function(fc, buffer, prop, image, percentile) {
  var coarse_scale = [0.0083333333333333333333333333, 0, -180, 0, -0.0083333333333333333333333333, 90];
  // derive percentiles from grid
  function compute_percentiles(f) {
    var f_geom_dilate = f.geometry().buffer(5000, 1000)
    var perc = ee.Dictionary(image.reduceRegion({
        reducer: ee.Reducer.percentile([percentile], ['p']),
        geometry: f_geom_dilate,
        // scale: 2000,
        crs: 'EPSG:4326',
        crsTransform: coarse_scale,
        maxPixels: 1e8
      }))
    return ee.Feature(f).set(prop, perc.get(perc.keys().get(0)));
      // return f.set(prop, ee.Number(
      // image.reduceRegion(
      //   ee.Reducer.percentile([percentile], ['p']), f_dilate.geometry()
      //   ).get(band_name)
  }
  return fc.map(compute_percentiles)
}

var add_mean_in_buffer = function(fc, buffer, prop, image) {
  // derive mean from grid
  var coarse_scale = [0.0083333333333333333333333333, 0, -180, 0, -0.0083333333333333333333333333, 90];
  function compute_mean(f) {
    var f_geom_dilate = f.geometry().buffer(25000, 1000)
    var mean = ee.Dictionary(image.reduceRegion({
        reducer: ee.Reducer.mean(),
        geometry: f_geom_dilate,
        // scale: 2000,
        crs: 'EPSG:4326',
        crsTransform: coarse_scale,
        maxPixels: 1e8
      }))

    // return ee.Feature(f).set(prop, mean.get(mean.keys().get(0)));
    return ee.Feature(f).set(prop, mean.get(mean.keys().get(0)));
  }
  return fc.map(compute_mean)
}

var add_mode_in_buffer = function(fc, buffer, prop, image) {
  // derive mean from grid
  var coarse_scale = [0.0083333333333333333333333333, 0, -180, 0, -0.0083333333333333333333333333, 90];
  function compute_mean(f) {
    var f_geom_dilate = f.geometry().buffer(5000, 1000)
    var mean = ee.Dictionary(image.reduceRegion({
        reducer: ee.Reducer.mode(100, 1, 100),
        geometry: f_geom_dilate,
        // scale: 2000,
        crs: 'EPSG:4326',
        crsTransform: coarse_scale,
        maxPixels: 1e8
      }))

    // return ee.Feature(f).set(prop, mean.get(mean.keys().get(0)));
    return ee.Feature(f).set(prop, mean.get(mean.keys().get(0)));
  }
  return fc.map(compute_mean)
}

// make a color style, good for elevation data
var style_dem = '\
<RasterSymbolizer>\
  <ColorMap  type="intervals" extended="false" >\
    <ColorMapEntry color="#cef2ff" quantity="-5" label="-2m"/>\
    <ColorMapEntry color="#9cd1a4" quantity="0" label="0m"/>\
    <ColorMapEntry color="#7fc089" quantity="1" label="0.5m" />\
    <ColorMapEntry color="#9cc78d" quantity="3" label="1m" />\
    <ColorMapEntry color="#b8cd95" quantity="10" label="2.5m" />\
    <ColorMapEntry color="#d0d8aa" quantity="25" label="5m" />\
    <ColorMapEntry color="#e1e5b4" quantity="50" label="7.5m" />\
    <ColorMapEntry color="#f1ecbf" quantity="100" label="10m" />\
    <ColorMapEntry color="#e2d7a2" quantity="200" label="12.5m" />\
    <ColorMapEntry color="#d1ba80" quantity="500" label="15m" />\
    <ColorMapEntry color="#d1ba80" quantity="1000" label="100m" />\
  </ColorMap>\
</RasterSymbolizer>';

// set angles for hill shading
var azimuth = 90;
var zenith = 60;

// set resolution over which to resample for a reasonable  statistic
// with .reproject, resampling is done by averaging as default
var coarse_scale = [0.0083333333333333333333333333, 0, -180, 0, -0.0083333333333333333333333333, 90];

var diva = ee.FeatureCollection('ft:1ZmbRYQQ8o0DuTAixGNSVTWhEGj4z9HR2LAtoXA6P')

// dilate by 5000 meters with a low accuracy
//var diva_buffer = diva.map(dilate);
var sed = ee.Image("users/hcwinsemius/aqueduct/sedthick_world_v2");
sed = sed.mask(sed.neq(-9999));
var glim = ee.Image("users/hcwinsemius/aqueduct/GLIM");
var temperature = ee.Image("users/hcwinsemius/aqueduct/worldclim_tmean_stack");
//print(temperature.select("b2"));
glim = glim.mask(glim.neq(-9999.))
var mangrove_30m = ee.ImageCollection("LANDSAT/MANGROVE_FORESTS").mosaic()
var mangrove = ee.Image("users/hcwinsemius/aqueduct/MangrovesUSGS2011")
var srtm = ee.Image("USGS/SRTMGL1_003");
var srtm_v90 = ee.Image("CGIAR/SRTM90_V4");
var srtm_reduce = srtm.mask(mangrove_30m.eq(1));
var coral = ee.Image("users/hcwinsemius/aqueduct/CoralReefsUSGS2010");
var seagrass = ee.Image("users/hcwinsemius/aqueduct/SeagrassPolygonsUSGS2005");
var salinity = ee.Image("users/hcwinsemius/aqueduct/salinity_annual");
salinity = salinity.mask(salinity.neq(-9999));
// temperature (min/max/mean)
// coral reefs
// mangrove map of world
// gena's stuff
// slope
// mangrove = mangrove.first();

mangrove = mangrove.mask(srtm_v90.mask())
//  .reproject('EPSG:4326', coarse_scale);
// coral = coral.mask(srtm_v90.mask());
// seagrass = seagrass.mask(srtm_v90.mask());
srtm = srtm.mask(srtm_v90.mask())
//   .reproject('EPSG:4326', coarse_scale)

// Add reducer output to the Features in the collection.
// var diva_extend = srtm.reduceRegions({
//   collection: diva_buffer,
//   reducer: ee.Reducer.mean(),
//   scale: 2000,
//   tileScale: 4
// });

// Map.addLayer(hillshadeit(srtm.sldStyle(style_dem), srtm, 1.5, 4.0), {}, 'elevation SRTM30m resampled 90m (sld)', false);
// Map.addLayer(srtm, {min:0, max:1000}, 'elevation SRTM30m resampled 900m');
// Map.addLayer(srtm_v90, {min:0, max:1000}, 'elevation srtm 90m');
// Map.addLayer(mangrove, {min:0, max:1}, 'Mangrove')

// var taskParams = {
//     'driveFolder' : 'Aqueduct',
//     'driveFileNamePrefix': 'diva_mang_seag_coral',
//     'fileFormat' : 'KML'
//   };

// print(ee.Feature(diva_extend.first()));

// var diva_new = diva.map(clean_f);
// // Map.addLayer(glim, {min: 0, max: 10}, 'GLIM', true);

// //Map.addLayer(sed, {min: 0, max: 100}, 'sediment thickness', true);
// Map.addLayer(srtm_reduce, {min: 0, max: 10}, 'srtm at mangroves', true);
// Map.addLayer(mangrove, {min: 0, max: 1}, 'mangrove', true);
// Map.addLayer(seagrass.min(1.), {min: 0, max: 5}, 'seagrass', true);
// Map.addLayer(coral.min(1.), {min: 0, max: 5}, 'coral', true);

// // Map.addLayer(temperature.select("b10").mask(temperature.select("b1").neq(-9999)), {min: -500, max: 500}, 'temperature jan', true);
// diva_new = add_mean_in_buffer(diva_new, 5000, 'mang_mean', mangrove);
// diva_new = add_mean_in_buffer(diva_new, 5000, 'coral_mean', coral.min(1.));
// diva_new = add_mean_in_buffer(diva_new, 5000, 'seagrass_mean', seagrass.min(1.));

// Export.table(diva_new, 'diva_mang_seag_coral', taskParams);


var taskParams = {
    'driveFolder' : 'Aqueduct',
    'driveFileNamePrefix': 'diva_salinity',
    'fileFormat' : 'KML'
  };

// print(ee.Feature(diva_extend.first()));
var diva_new = diva.map(clean_f);
// Map.addLayer(glim, {min: 0, max: 10}, 'GLIM', true);

//Map.addLayer(sed, {min: 0, max: 100}, 'sediment thickness', true);
Map.addLayer(salinity, {min: 30, max: 40}, 'salinity', true);

// Map.addLayer(temperature.select("b10").mask(temperature.select("b1").neq(-9999)), {min: -500, max: 500}, 'temperature jan', true);
diva_new = add_mean_in_buffer(diva_new, 25000, 'salinity', salinity);

Export.table(diva_new, 'diva_salinity', taskParams);

// var taskParams = {
//     'driveFolder' : 'Aqueduct',
//     'driveFileNamePrefix': 'diva_GLIM',
//     'fileFormat' : 'KML'
//   };

// // print(ee.Feature(diva_extend.first()));
// var diva_new = diva.map(clean_f);
// // Map.addLayer(glim, {min: 0, max: 10}, 'GLIM', true);

// //Map.addLayer(sed, {min: 0, max: 100}, 'sediment thickness', true);
// Map.addLayer(glim, {min: 0, max: 15}, 'GLIM', true);

// // Map.addLayer(temperature.select("b10").mask(temperature.select("b1").neq(-9999)), {min: -500, max: 500}, 'temperature jan', true);
// diva_new = add_mode_in_buffer(diva_new, 5000, 'GLIM', glim);

// Export.table(diva_new, 'diva_GLIM', taskParams);



// Map.addLayer(diva_new.map(dilate), {}, 'DIVA dilated', false);
// diva_new = add_mean_in_buffer(diva_new, 5000, 'sed_mean', sed.select('b1'));
// diva_new = add_percentiles_in_buffer(diva_new, 5000, 'sed_50', sed.select('b1'), 50);

// diva_new = add_percentiles_in_buffer(diva_new, 5000, 'srtm_05', srtm, 5);
// diva_new = add_percentiles_in_buffer(diva_new, 5000, 'srtm_50', srtm, 50);
// diva_new = add_percentiles_in_buffer(diva_new, 5000, 'srtm_95', srtm, 95);
// diva_new = add_percentiles_in_buffer(diva_new, 5000, 'srtm_05_mang', srtm_reduce, 5);
// diva_new = add_percentiles_in_buffer(diva_new, 5000, 'srtm_50_mang', srtm_reduce, 50);
// diva_new = add_percentiles_in_buffer(diva_new, 5000, 'srtm_95_mang', srtm_reduce, 95);

// var taskParams = {
//     'driveFolder' : 'Aqueduct',
//     'driveFileNamePrefix': 'diva_srtm',
//     'fileFormat' : 'KML'
//   };
// Export.table(diva_new, 'diva_srtm', taskParams);


// // add temperature
// diva_new = add_mean_in_buffer(diva_new, 5000, 'temp_01', temperature.select("b1").mask(temperature.select("b1").neq(-9999)));
// diva_new = add_mean_in_buffer(diva_new, 5000, 'temp_02', temperature.select("b2").mask(temperature.select("b1").neq(-9999)));
// diva_new = add_mean_in_buffer(diva_new, 5000, 'temp_03', temperature.select("b3").mask(temperature.select("b1").neq(-9999)));
// diva_new = add_mean_in_buffer(diva_new, 5000, 'temp_04', temperature.select("b4").mask(temperature.select("b1").neq(-9999)));
// diva_new = add_mean_in_buffer(diva_new, 5000, 'temp_05', temperature.select("b5").mask(temperature.select("b1").neq(-9999)));
// diva_new = add_mean_in_buffer(diva_new, 5000, 'temp_06', temperature.select("b6").mask(temperature.select("b1").neq(-9999)));
// diva_new = add_mean_in_buffer(diva_new, 5000, 'temp_07', temperature.select("b7").mask(temperature.select("b1").neq(-9999)));
// diva_new = add_mean_in_buffer(diva_new, 5000, 'temp_08', temperature.select("b8").mask(temperature.select("b1").neq(-9999)));
// diva_new = add_mean_in_buffer(diva_new, 5000, 'temp_09', temperature.select("b9").mask(temperature.select("b1").neq(-9999)));
// diva_new = add_mean_in_buffer(diva_new, 5000, 'temp_10', temperature.select("b10").mask(temperature.select("b1").neq(-9999)));
// diva_new = add_mean_in_buffer(diva_new, 5000, 'temp_11', temperature.select("b11").mask(temperature.select("b1").neq(-9999)));
// diva_new = add_mean_in_buffer(diva_new, 5000, 'temp_12', temperature.select("b12").mask(temperature.select("b1").neq(-9999)));


// diva_new.copyProperties(diva, ['CLSFID']);
// diva_new.copyProperties(diva_buffer, ['mangrove_mean']);

// print(diva_new
//   .filter(ee.Filter.neq('mangrove_mean', null))
//   .filter(ee.Filter.neq('mangrove_mean', 0)).limit(10)

// print(diva_new
//   .filter(ee.Filter.neq('srtm_50', null)).limit(10)
//   )
//print(ee.FeatureCollection(diva_new.toList(1000, 1010)));

// Export.table(ee.FeatureCollection(diva_new.toList(100, 1000)), 'diva_srtm', taskParams);
// Export.table(diva_new, 'diva_srtm_temp', taskParams);
//print(ee.FeatureCollection(diva_new.toList(1000, 1000)))
//Map.centerObject(ee.FeatureCollection(diva_new.toList(1000, 1005)))
// print(ee.FeatureCollection(diva_new
//   .filter(ee.Filter.neq('mangrove_mean', null))
//   .filter(ee.Filter.neq('mangrove_mean', 0))).getDownloadURL('csv', ['CLSFID', 'mangrove_mean'], 'mangrove_srtm'))
// print(diva.getDownloadURL('kml', ['CLSFID', 'mangrove_mean'], 'mangrove_srtm'))


// export in parts:
    // for(var i = 0; i < 21; i++) { 
    //   var river_with_buffers = ee.FeatureCollection(river_segments.toList(5000, i*5000))
    //     .map(computeBufferScores)
      
//       var fileName = analysisName + i;
//       Export.table(river_with_buffers, fileName,
//         { fileFormat: 'GeoJSON', driveFileNamePrefix: fileName})
//     }

// }
