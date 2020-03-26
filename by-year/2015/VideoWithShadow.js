/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var l8 = ee.ImageCollection("LANDSAT/LC8_L1T_TOA");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
// VideoWithShadow.js

var pansharpen = function(image) {
    var pan = image.select('pan').multiply(2.0);
    var rgb = image.select('red', 'green', 'blue');
    var hsv  = rgb.rgbtohsv();
    var huesat = hsv.select('hue', 'saturation');
    var upres = ee.Image.cat(huesat, pan).hsvtorgb();
 
    return upres;
}
var bounds = ee.Geometry(Map.getBounds(true)).centroid(100).buffer(1)

l8 = l8
      .filterMetadata('CLOUD_COVER', 'less_than', 5)
      //.filterMetadata('SUN_ELEVATION', 'less_than', 25)

l8 = l8.filterBounds(bounds)
  //.select(['B6', 'B5', 'B3', 'B8'], ['red', 'green', 'blue', 'pan'])

var image = ee.Image(l8.toList(100, 0).get(0))



Map.addLayer(image.select(['B6', 'B5', 'B3']), {min:0, max:0.4})

// ===============================
function radians(img) { return img.toFloat().multiply(3.1415927).divide(180); }

function hillshade(az, ze, slope, aspect) {
  var azimuth = radians(ee.Image(az));
  var zenith = radians(ee.Image(ze));
  return azimuth.subtract(aspect).cos().multiply(slope.sin()).multiply(zenith.sin())
      .add(zenith.cos().multiply(slope.cos()));
}

function hillshadeit(image, elevation, weight, height_multiplier, azimuth, zenith) {
  var hsv  = image.unitScale(0, 255).rgbtohsv();

  var terrain = ee.call('Terrain', elevation.multiply(height_multiplier));
  var slope = radians(terrain.select(['slope']));
  var aspect = radians(terrain.select(['aspect']));
  var hs = hillshade(azimuth, zenith, slope, aspect);

  var intensity = hs.multiply(weight).multiply(hsv.select('value'));
  var huesat = hsv.select('hue', 'saturation');
  
  return ee.Image.cat(huesat, intensity).hsvtorgb();
}

var colors_dem = ['006837', '1a9850', '66bd63', 'a6d96a', 'd9ef8b', 'ffffbf', 'fee08b', 'fdae61', 'f46d43', 'd73027', 'a50026', 'ffffff']
//var shadow_palette = ['fee0d2', 'fc9272', 'de2d26'];
var shadow_palette = ['efedf5','bcbddc','756bb1'];

//var elev = ee.Image('srtm90_v4');
var elev = ee.Image('USGS/SRTMGL1_003');

var terrain = ee.call('Terrain', elev);
var slope = radians(terrain.select(['slope']));
var aspect = radians(terrain.select(['aspect']));

var computeTopoMask = function(image, azimuth, zenith) {
  var hs = hillshade(azimuth, zenith, slope, aspect);

  var hs_mask = hs.lt(0.3); //.focal_max(30, 'square', 'meters').focal_mode(30, 'circle', 'meters');
  //hs_mask = hs_mask.mask(slope.gt(0.2))
  
  return [hs, hs_mask];
}

var azimuth = ee.Number(image.get('SUN_AZIMUTH'));
var zenith = ee.Number(90).subtract(ee.Number(image.get('SUN_ELEVATION')));
print('azimuth:', azimuth)
print('zenith:', zenith)

var h = computeTopoMask(image, azimuth, zenith);
var hs = h[0];
var hs_mask = h[1]




var DEM_MIN = -5; // 100;
var DEM_MAX = 1500;
Map.addLayer(elev, {min:DEM_MIN, max:DEM_MAX}, 'dem', false)
var v = elev.mask(elev.gt(0)).visualize({palette:colors_dem, min:DEM_MIN, max:DEM_MAX, opacity: 1.0});
//var dem_gamma = 1.0 * Math.sin((Math.PI / 2.0) * zenith / 90.0);
Map.addLayer(hillshadeit(v, elev, 1.1, 1.0, azimuth, zenith), {}, 'elevation');
Map.addLayer(hs, {min:0, max:1}, 'hs', false);
Map.addLayer(hs.mask(hs_mask), {palette:shadow_palette, opacity:0.7}, 'hs mask');

var canny = ee.Algorithms.CannyEdgeDetector(hs_mask, 0.99, 0);
canny = canny.mask(canny)
Map.addLayer(canny.mask(canny).focal_max(1), {palette:['ff0000'], opacity:0.7}, 'hs mask (canny)');


var ic = l8.map(function(i) { 
    var azimuth = ee.Number(i.get('SUN_AZIMUTH'));
    var zenith = ee.Number(90).subtract(ee.Number(i.get('SUN_ELEVATION')));
    var h = computeTopoMask(i, azimuth, zenith)
    var hs = h[0]
    var hs_mask = h[1]

    // return hillshadeit(v, elev, 1.1, 2.0, azimuth, zenith).visualize({forceRgbOutput:true})

    var canny = ee.Algorithms.CannyEdgeDetector(hs_mask, 0.99, 0);
    canny = canny.mask(canny)

    return ee.ImageCollection.fromImages([
      hillshadeit(v, elev, 1.1, 2.0, azimuth, zenith).visualize({forceRgbOutput:true}),
      //i.select(['B6', 'B5', 'B3']).visualize({min:0, max:0.4}),
      //i.normalizedDifference(['B5', 'B3']).visualize({min:-0.5, max:0.5, palette:['0000ff', 'ffffff']}),
      //hs.mask(hs_mask).visualize({palette:['ffffff'], opacity:0.8}),
      hs.mask(hs_mask).visualize({palette:shadow_palette, opacity:0.7}),
      canny.visualize({palette:['444444'], opacity:0.8})
      ]).mosaic()
  })


var center = bounds.centroid(1)

var hs_mask_all = l8.map(function(i) { 
    var azimuth = ee.Number(i.get('SUN_AZIMUTH'));
    var zenith = ee.Number(90).subtract(ee.Number(i.get('SUN_ELEVATION')));
    return ee.Feature(center, {azimuth:azimuth, zenith:zenith})
});

/*
print(Chart.feature.histogram(hs_mask_all, 'azimuth', 5))
print(Chart.feature.histogram(hs_mask_all, 'zenith', 5))
*/

/*
var hs_mask_all = l8.map(function(i) { 
    var azimuth = ee.Number(i.get('SUN_AZIMUTH'));
    var zenith = ee.Number(90).subtract(ee.Number(i.get('SUN_ELEVATION')));
    var h = computeTopoMask(i)
    var hs = h[0]
    var hs_mask = h[1]
    return hs_mask
});

var hill_shadows_mask = hs_mask_all.reduce(ee.Reducer.percentile([25]))
Map.addLayer(hill_shadows_mask.mask(hill_shadows_mask), {min:0, max:1, palette:shadow_palette, opacity:0.7}, 'hs mask all', false)
Map.addLayer(slope, {}, 'slope', false)
*/

//var ic = l8.select(['B6', 'B5', 'B3']).map(function(i){return i.visualize({min:0, max:0.4});})

var image = ee.Image(ic.toList(10, 0).get(1))
Map.addLayer(image, {}, 'rendered', false)

// ================
Export.video(
  ic,
  'video_MD02_DEM_HS_mountains_near_Cambera', {
  dimensions: '1024',
  framesPerSecond: 5,
  region: JSON.stringify(Map.getBounds(true))
});
