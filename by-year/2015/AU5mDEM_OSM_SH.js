/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var au5m = ee.ImageCollection("AU/GA/AUSTRALIA_5M_DEM");
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
  var hue = hsv.select('value')
  var intensity = hs.multiply(weight).multiply(hue);
  var huesat = hsv.select('hue', 'saturation');
  
  return ee.Image.cat(huesat, intensity).hsvtorgb();
}


Map.addLayer(au5m, {}, 'raw', false)

au5m = ee.Image(au5m.first())

var colors_dem = ['006837', '1a9850', '66bd63', 'a6d96a', 'd9ef8b', 'ffffbf', 'fee08b', 'fdae61', 'f46d43', 'd73027', 'a50026', 'ffffff']
var v = au5m.visualize({palette:colors_dem, min:50, max:150, opacity: 1.0});

Map.addLayer(hillshadeit(v, au5m, 2.0, 1.0), {}, 'AU DEM 5m')

var sh = ee.FeatureCollection('ft:1SzuPZQVQsio17Qf_yabvjZ_9f-9S9zG-6DJ10jC7');
Map.addLayer(sh, {color: '0000ff'}, 'Surface Hydrology (lines, major)')

var osm = ee.FeatureCollection('ft:1nlWWjT4VkGjkp-kXKroFuyUuKDUSTqce_DDtmOt1')
  .filter(ee.Filter.neq('waterway', 'riverbank'));
Map.addLayer(osm, {color: 'ffff00'}, 'OpenStreetMap (lines)')

print(Map.getCenter())
Map.setCenter(139.68, -34.12, 14)