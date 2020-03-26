/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var geometry = /* color: d63000 */ee.Geometry.MultiPoint(
        [[4.941401481628418, 51.963387193947455],
         [4.980411529541016, 51.96526460257143],
         [4.913206100463867, 51.94394742740646],
         [5.016117095947266, 51.97462402987746]]),
    srtm = ee.Image("USGS/SRTMGL1_003"),
    geometry2 = /* color: 98ff00 */ee.Geometry.Point([4.214286804199219, 52.06684451000505]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
var azimuth = 90;
var zenith = 60;

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

var colors_dem = ['006837', '1a9850', '66bd63', 'a6d96a', 'd9ef8b', 'ffffbf', 'fee08b', 'fdae61', 'f46d43', 'd73027', 'a50026', 'ffffff']
//var colors_dem = ['0000ff', '00ff00']

var addDem = function(dem, name, min, max, visible) {
  var im = dem.visualize({palette:colors_dem, min:min, max:max, opacity: 1.0});
  Map.addLayer(hillshadeit(im, dem, 2.0, 4.0), {}, name, visible);
}


// Map.centerObject(geometry, 17)

var ahn_raw = ee.Image('AHN/AHN2_05M_RUW') // raw
var ahn_int = ee.Image('AHN/AHN2_05M_INT') // interpolated

Map.addLayer(ahn_raw, {}, 'AHN RAW (raw)', false)

var ahnMask = ahn_raw.mask().gt(0.99)


var min = 0
var max = 30

//var ahn_raw_and_srtm
addDem(srtm, 'SRTM', min, max, false)


// ahn_raw = ahn_raw.unmask().multiply(ahnMask).add(srtm.unmask().multiply(ahnMask.not()))

var ahn_raw_and_srtm = ahnMask.not().multiply(srtm)
  .add(ahn_raw.unmask().multiply(ahnMask)).reproject('EPSG:4326', null, 1)
  //.mask(ahnMask.not())

addDem(ahn_raw_and_srtm, 'AHN and SRTM', min, max, true)


addDem(ahn_raw, 'AHN RAW (land)', min, max, false)

addDem(ahn_int, 'AHN (land)', min, max, false)

// fill holes using max + Gaussian

// compute image to be used to fill holes
var radius = 30
var ahn_int_fill = ahn_int.unmask()
  .reduceNeighborhood(ee.Reducer.max(), ee.Kernel.circle(radius, 'meters')) // fill values using max 
  .convolve(ee.Kernel.gaussian(5, 2, 'meters')) // smoothen

// combine original image with the one for holes, only for holes
ahn_int_fill = ahn_int.unmask()
  .add(ahn_int_fill.multiply(ahn_int.mask().not()))
  .mask(ahn_int.mask().focal_max(radius, 'circle', 'meters')) // exclude default values

addDem(ahn_int_fill, 'AHN (land) filled', min, max, false)

function evaluateSeaLevelRiseScenario(seaLevel, showBlobs) {
  var water = ahn_raw.lte(seaLevel).unmask().or(ahnMask.not())
  Map.addLayer(water.mask(water), {palette:['223BE4'], opacity: 0.7}, 'sea level, ' + seaLevel + ' m', false)
  
  var mapGeometry = ee.Geometry(Map.getBounds(true))
  if(showBlobs) {
    var waterVector = water.reduceToVectors({geometry: mapGeometry, scale: 10})
      .map(function(g) { return g.set('is_flood', g.intersects(geometry2))})
      .filter(ee.Filter.eq('is_flood', true))
    Map.addLayer(waterVector, {color: 'blue', opacity:0.6}, 'flood', false)
  }
}

evaluateSeaLevelRiseScenario(0.0, true)
evaluateSeaLevelRiseScenario(0.5, true)
evaluateSeaLevelRiseScenario(1.0, true)
evaluateSeaLevelRiseScenario(2.0, true)
evaluateSeaLevelRiseScenario(3.0, true)
evaluateSeaLevelRiseScenario(4.0, true)
evaluateSeaLevelRiseScenario(5.0, true)
evaluateSeaLevelRiseScenario(6.0, true)



// fill using comulative cost algorithm
/*
var min_elevation = 0
var max_elevation = 5

var mapMask = ee.Image().byte().paint(ee.Geometry(Map.getBounds(true)))

var potential = ahn_raw_and_srtm
  .gt(min_elevation).and(ahn_raw_and_srtm.lt(max_elevation))
    .updateMask(ahn_raw_and_srtm.lt(max_elevation)      //.and(dam_image.mask().not()) 
    );

var source = ee.Image().byte().paint(geometry, 1, 1)

var cost = potential
  .cumulativeCost({
  source: source,
  maxDistance: 2000
});

Map.addLayer(potential, {min:0, max:2}, 'potential pixels v2', false);
Map.addLayer(ahn_raw_and_srtm.updateMask(cost.mask()), {min: min_elevation, max: max_elevation, palette:"black, blue"}, 'flooded region');


*/