/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var road = /* color: d63000 */ee.Geometry.LineString(
        [[-120.14062643051147, 47.25888834524454],
         [-120.12942439501967, 47.25351459143011],
         [-120.12560365222402, 47.255014725396805],
         [-120.12517175445362, 47.25667503995735],
         [-120.11950131655811, 47.25644171988543],
         [-120.11798858642578, 47.255276588323774],
         [-120.1170015335083, 47.25502899918972],
         [-120.11558532714844, 47.25542222845011],
         [-120.11492013931274, 47.255451356427294],
         [-120.11425495147705, 47.25553874026278],
         [-120.11367559432983, 47.2554076644555],
         [-120.1130747795105, 47.25559699607296],
         [-120.11294603347778, 47.255990221115454],
         [-120.11233448982233, 47.25686404408872],
         [-120.11067161755471, 47.257308275005215],
         [-120.10929295338502, 47.25787258539146],
         [-120.10717391967773, 47.25893203434443]]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
Map.centerObject(road, 15)

var azimuth = 90;
var zenith = 40;

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
  var aspect = radians(terrain.select(['aspect']))// .resample('bicubic');
  var hs = hillshade(azimuth, zenith, slope, aspect)//.resample('bicubic');

  var intensity = hs.multiply(weight).multiply(hsv.select('value'));
  var huesat = hsv.select('hue', 'saturation');
  
  return ee.Image.cat(huesat, intensity).hsvtorgb();
}


// =========== dem

var dem_min = 100;
var dem_max = 5000;

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

// =========== add DEM
var dem = ee.Image('USGS/NED');
Map.addLayer(hillshadeit(dem.mask(dem.gt(0)).sldStyle(style_dem), dem, 1.3, 4.0), {}, 'elevation NED 10m (sld)');

var srtm = ee.Image('USGS/SRTMGL1_003');
Map.addLayer(hillshadeit(srtm.mask(srtm.gt(0)).sldStyle(style_dem), srtm, 1.3, 4.0), {}, 'elevation SRTM 30m (sld)');

var dem_30 = dem.reproject(srtm.projection())
Map.addLayer(hillshadeit(dem_30.mask(dem_30.gt(0)).sldStyle(style_dem), dem_30, 1.3, 4.0), {}, 'elevation NED resmapled to 30m (sld)');

var info = dem.getInfo().bands[0]
var crs = info.crs
var crs_transform = info.crs_transform

print(info)

var width = 20
var roadEdgeFraction = 0.5
var roadBuffer = road.buffer(width)

var roadImage = 
  dem.clip(roadBuffer)
    .reduceNeighborhood(ee.Reducer.mean(), ee.Kernel .circle(2*width,'meters'))
    .rename('elevation')

var demWithRoad = ee.ImageCollection.fromImages([
  dem,
  roadImage//.unmask()
  ]).mosaic()
  .reproject(crs, crs_transform)

Map.addLayer(hillshadeit(demWithRoad.sldStyle(style_dem), demWithRoad, 1.3, 4.0), {}, 'dem with road');

/*
var roadEdgeImage = 
  roadImage.
  dem.clip(roadEdgePolygon)
    .reduceNeighborhood(ee.Reducer.mean(), ee.Kernel.circle(2*width,'meters'))
    .rename('elevation')

*/

var roadEdgePolygon = road.buffer(width*(1+roadEdgeFraction)).difference(roadBuffer)

var roadEdgeDistance = ee.FeatureCollection([road])
    .distance()
      .subtract(width)
      .divide(width*roadEdgeFraction)
      .clip(roadEdgePolygon)
        
Map.addLayer(roadEdgeDistance, {min:0, max:1}, 'road edge distance', false)

var roadWithEdge = roadImage.unmask()
  .focal_min(width*roadEdgeFraction, 'circle', 'meters')
  .focal_max(width*(1+2 * roadEdgeFraction), 'circle', 'meters')

var roadMinMax = dem.reduceRegion(ee.Reducer.minMax(), roadBuffer, null, crs, crs_transform).getInfo()
var roadMin = roadMinMax['elevation_min']
var roadMax = roadMinMax['elevation_max']

Map.addLayer(roadWithEdge, {min:roadMin, max:roadMax}, 'road with edge (dem)', false)

Map.addLayer(hillshadeit(roadWithEdge.sldStyle(style_dem), roadWithEdge, 1.3, 4.0), {}, 'road with edge', false);

Map.addLayer(roadBuffer, {}, 'road buffer', false)

Map.addLayer(roadImage, {}, 'road image', false)

