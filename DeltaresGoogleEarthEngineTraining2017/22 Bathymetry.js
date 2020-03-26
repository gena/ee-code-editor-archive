/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var transect = /* color: #d63000 */ee.Geometry.LineString(
        [[6.01565288548727, 53.52009969563908],
         [6.0749803734909165, 53.4254029956657]]),
    emodnet = ee.Image("users/gena/EMODNET"),
    ahn = ee.Image("AHN/AHN2_05M_RUW"),
    gebco = ee.Image("users/gena/GEBCO_2014_2D"),
    coastline = ee.FeatureCollection("users/gena/eo-bathymetry/osm-coastline"),
    vaklodingen = ee.ImageCollection("users/gena/vaklodingen"),
    srtm = ee.Image("USGS/SRTMGL1_003");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
print(vaklodingen)
Map.addLayer(vaklodingen, {}, 'vaklodingen', false)


function app() {
  var bathymetryMin = -5
  
  Map.addLayer(gebco, {min:5, max:bathymetryMin, palette: Palettes.water}, 'GEBCO', true)
  Map.addLayer(hillshadeit(gebco.visualize({min:5, max:bathymetryMin, palette: Palettes.water}), 
    gebco, 1.5, 30, 0, 45), {}, 'GEBCO (hillshade)', false)
  
  Map.addLayer(emodnet, {min:5, max:bathymetryMin, palette: Palettes.water}, 'EMODNET', true)
  Map.addLayer(hillshadeit(emodnet.visualize({min:5, max:bathymetryMin, palette: Palettes.water}), 
    emodnet, 1.5, 30, 0, 45), {}, 'EMODNET (hillshade)', false)
  
  // load Dutch bathymetry (vaklodingen, measured annually)
  var images = ee.ImageCollection('users/gena/vaklodingen')
    .filterDate('2010-01-01', '2018-01-01')
  images = images.sort('system:time_start', false)
  var bathymetry = images.mean().divide(100)
  Map.addLayer(bathymetry, {min:5, max:bathymetryMin, palette: Palettes.water}, 'bathymetry, RWS', true)
  Map.addLayer(hillshadeit(bathymetry.visualize({min:5, max:bathymetryMin, palette: Palettes.water}), 
    bathymetry.reproject('EPSG:3857', null, 20), 1.5, 30, 0, 45), {}, 'bathymetry, RWS (hillshade)', false)
    
  
  // Dutch LiDAR topogrpahy (0.5m)
  Map.addLayer(ahn, {min:5, max:bathymetryMin, palette: Palettes.water}, 'AHN', true);
  Map.addLayer(hillshadeit(ahn.visualize({min:5, max:bathymetryMin, palette: Palettes.water}), 
    ahn, 1.5, 30, 0, 45), {}, 'AHN (hillshade)', false)
  
  // global coastline (OpenStreetMap - large)
  Map.addLayer(ee.Image().paint(coastline,1,1), {palette:['ffff00']}, 'coastline', true)
  
  // // water occurrence for 10m inter-tidal bathymetry (work in progress)
  // var p = require('users/gena/packages:water-occurrence')
  // var waterOccurrence = p.getWaterOccurrence()
  
  // var deepWater = gebco.lt(-5)
  //   .focal_min({radius: 3, kernelType: 'circle', iterations: 3})
  //   //.focal_max({radius: 5, kernelType: 'circle', iterations: 2})
  //   .reproject(gebco.projection())
  
  // var lowLand = srtm.unmask().lt(5)
  //   .focal_min({radius: 3, kernelType: 'circle', iterations: 3})
  //   .reproject(srtm.projection())
  
  // Map.addLayer(waterOccurrence, {min:0, max:1, palette: Palettes.water}, 'water occurrence', false)



  // p.showIsolines(waterOccurrence)
  
  Map.setOptions('SATELLITE')
  
  // compute 50 locations along the transect  
  var distances = ee.List.sequence({start: 0, end: transect.length(), count: 50})
  var lines = transect.cutLines(distances).geometries()
  var locations = lines.map(function(g) { return ee.Feature(ee.Geometry(g).centroid()) })
  locations = ee.FeatureCollection(locations)
  
  Map.addLayer(locations, {}, 'transect locations', false)
  
  print(locations)

  // plot chart
  var combined = ee.Image([ahn.rename('AHN'), bathymetry.rename('RWS')]).unmask()
  var features = combined.unmask().reduceRegions(locations, ee.Reducer.first())
  
  // TODO: plot a new chart showing values of Vaklodingen and AHN along the transect geometry, use features generated along the line as locations

  // TODO, ADVANCED: plot offsets in meters along the x axis
}






function radians(img) { 
  return img.toFloat().multiply(3.1415927).divide(180); 
}

function hillshade(az, ze, slope, aspect) {
  var azimuth = radians(ee.Image(az));
  var zenith = radians(ee.Image(ze));
  return azimuth.subtract(aspect).cos().multiply(slope.sin()).multiply(zenith.sin())
      .add(zenith.cos().multiply(slope.cos()));
}

function hillshadeit(image, elevation, weight, height_multiplier, azimuth, zenith) {
  var hsv  = image.unitScale(0, 255).rgbToHsv();

  var terrain = ee.Algorithms.Terrain(elevation.multiply(height_multiplier));
  var slope = radians(terrain.select(['slope']));

  var aspect = radians(terrain.select(['aspect'])).resample('bicubic');
  var hs = hillshade(azimuth, zenith, slope, aspect).resample('bicubic');
  
  var intensity = hs.multiply(weight).multiply(hsv.select('value'));
  var huesat = hsv.select('hue', 'saturation');

  return ee.Image.cat(huesat, intensity).hsvToRgb();
}

var Palettes = {
  water: ['f7fbff', 'deebf7', 'c6dbef', '9ecae1', '6baed6', '4292c6', '2171b5', '08519c', '08306b']
};

app();