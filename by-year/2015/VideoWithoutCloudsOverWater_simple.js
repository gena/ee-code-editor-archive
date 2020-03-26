// video on all images, except when there are clouds on water pixels

var azimuth = 90;
var zenith = 25;

function radians(img) { return img.toFloat().multiply(3.1415927).divide(180); }

function slopeAspect(img, step) {
  var k_dx = ee.Kernel.fixed(3, 3,
                       [[ 1/8,  0,  -1/8],
                        [ 2/8,  0,  -2/8],
                        [ 1/8,  0,  -1/8]]);

  var k_dy = ee.Kernel.fixed(3, 3,
                         [[ -1/8, -2/8,  -1/8],
                          [ 0,    0,    0],
                          [ 1/8, 2/8,   1/8]]);
  
  
  var dx = img.convolve(k_dx)
  var dy = img.convolve(k_dy)
  var slope = ee.Image().expression("x*x + y*y", {x: dx, y: dy}).divide(ee.Image.pixelArea()).sqrt().atan()

  var aspect = dx.atan2(dy)
    
  return [slope, aspect];
}

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
  //var slope = radians(terrain.select(['slope']));
  //var aspect = radians(terrain.select(['aspect']));
  
  var sa = slopeAspect(elevation.multiply(height_multiplier))
  var slope = sa[0]
  var aspect = sa[1]
  
  var hs = hillshade(azimuth, zenith, slope, aspect);

  var intensity = hs.multiply(weight).multiply(hsv.select('value'));
  var huesat = hsv.select('hue', 'saturation');
  
  return ee.Image.cat(huesat, intensity).hsvtorgb();
}

var dem = ee.Image('USGS/SRTMGL1_003');

function renderDem() {
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

  //var gaussianKernel = ee.Kernel.gaussian(2, 1, 'pixels', true, 2);
  //dem = dem.convolve(gaussianKernel);

  dem = dem.mask(dem.unmask().gte(0.1))

  var demRendered = dem.sldStyle(style_dem);
  //return hillshadeit(demRendered, dem, 1.1, 10.0, azimuth, zenith);

  var water_min = -5000;
  var sea_level = 0.1;
  var colors_water = ['023858', '045a8d', '0570b0', '3690c0', '74a9cf', 'a6bddb'/*, 'd0d1e6', 'ece7f2', 'fff7fb'*/];
  var bathymetry = ee.Image('NOAA/NGDC/ETOPO1').select('bedrock').rename('elevation')
    .mask(dem.unmask().lt(0.1))
  
  var v = ee.ImageCollection.fromImages([
      bathymetry.visualize({palette:colors_water, min:water_min, max:sea_level, opacity: 1.0}),
      dem.sldStyle(style_dem)
      ]).mosaic();
  
  var demCombined = ee.ImageCollection.fromImages([
    bathymetry,
    dem
    ]).mosaic()
  
  return hillshadeit(v, demCombined, 1.1, 5.0, azimuth, zenith);
}




function pansharpen(i) {
  //var rgb = i.select(['red', 'green', 'blue']);
  var rgb = i.select(['swir1', 'nir', 'green']);
  var pan = i.select('pan')
  var hsv = rgb.rgbToHsv()
  var huesat = hsv.select('hue', 'saturation');
  var pansharpened = ee.Image.cat(huesat, pan).hsvtorgb();
  return pansharpened.rename(['red', 'green', 'blue']).addBands(i, ['BQA']);
}

function sharpen(i, radius, sigma) {
  return i
    .subtract(image.convolve(ee.Kernel.gaussian(radius, sigma, 'meters'))
    .convolve(ee.Kernel.laplacian8(0.4)))
}

var LC8_BANDS = ['B1',    'B2',   'B3',    'B4',  'B5',  'B6',    'B7',    'B8', 'B10', 'BQA'];
var LC7_BANDS = ['B1',    'B1',   'B2',    'B3',  'B4',  'B5',    'B7',    'B8', 'B8', 'B7'];
var STD_NAMES = ['blue2', 'blue', 'green', 'red', 'nir', 'swir1', 'swir2', 'pan', 'temp', 'BQA'];

//var featureId = 2348
//var featureId = 3742
//var featureId = 4202
//var featureId = 1600
//var featureId = 210

// little water
// var featureId = 1957
//var featureId = 1891

// wide river
//var featureId = 3215

// snow
//var featureId = 3108
// var featureId = 3175
// var scale = 180
// var scale = 900
var scale = 15

//var max_cloud_pixels = 50000
var max_cloud_pixels = -1
//var usePercentiles = true
var usePercentiles = false
var useWaterIndex = false
//var index = 'NDWI'
var index = 'MNDWI'

var prefix = 'Mekong_'

if(usePercentiles) {
  var fileName = prefix + '_percentiles' 
} else {
  var fileName = prefix
}

if(useWaterIndex) {
  if(index == 'NDWI') {
    fileName = fileName + '_NDWI'
  } else {
    fileName = fileName + '_MNDWI'
  }
}

if(max_cloud_pixels != -1) {
  fileName = fileName + '_less_clouds'
}

var water_index_min = -1.0
var water_index_max = 1.0
var water_index_vis = {min: water_index_min, max: water_index_max}

var water_index_style = '\
<RasterSymbolizer>\
  <ColorMap extended="true" >\
    <ColorMapEntry color="#ffffd9" quantity="-1.0" label="-1"/>\
    <ColorMapEntry color="#edf8b1" quantity="-0.8" label="-1"/>\
    <ColorMapEntry color="#c7e9b4" quantity="-0.6" label="-1"/>\
    <ColorMapEntry color="#7fcdbb" quantity="-0.4" label="-1"/>\
    <ColorMapEntry color="#41b6c4" quantity="-0.2" label="-1"/>\
    <ColorMapEntry color="#1d91c0" quantity="0.0" label="-1"/>\
    <ColorMapEntry color="#225ea8" quantity="0.2" label="-1"/>\
    <ColorMapEntry color="#253494" quantity="0.4" label="-1"/>\
    <ColorMapEntry color="#081d58" quantity="0.6" label="-1"/>\
    <ColorMapEntry color="#081dff" quantity="1.0" label="-1"/>\
  </ColorMap>\
</RasterSymbolizer>';

var grid = ee.FeatureCollection('ft:1EI0slUr477ZKM3IWv-OOh0invsIXbUoaW9tixrzT')
//var aoi = ee.Geometry(ee.Feature(grid.filter(ee.Filter.eq('id', featureId)).first()).geometry());
var aoi = ee.Geometry(Map.getBounds(true));

var basinsLevel3 = ee.FeatureCollection('ft:13dShZ5yGqCEqk3dsJvYEL3lsa1hEmpMRldxK7aSa') // Asia, level 3
  .filter(ee.Filter.or(
        ee.Filter.eq('PFAF_ID', 442), // Mekong
        ee.Filter.eq('PFAF_ID', 441), // Ho Chi Minh
        ee.Filter.eq('PFAF_ID', 443) // Thailand
        )).geometry()
  .intersection(aoi, 1000);

//Map.addLayer(aoi, {}, 'bounds', true)

//Map.centerObject(aoi, 12)

var l7 = ee.ImageCollection('LANDSAT/LE7_L1T_TOA')
  .select(LC7_BANDS, STD_NAMES)

var l8 = ee.ImageCollection('LC8_L1T_TOA')
  .select(LC8_BANDS, STD_NAMES)


var images = 
  l8
  //.filterDate('2013-07-01', '2013-12-01')
  //ee.ImageCollection(l7.merge(l8))
  //.filterBounds(aoi.centroid(1))
  .filterBounds(basinsLevel3)
  // .filterBounds(ee.Geometry(aoi.centroid(30).buffer(100)))
  .sort('system:time_start')

var I_min = 0.06
//var I_max = [0.35,0.35,0.60]
var I_max = 0.55
//var I_max = [0.25,0.25,0.35]
var gamma = 1.4

//var bands = ['red','green','blue']
var bands = ['swir1','nir','green']

images = images.map(pansharpen).map(sharpen)

var I_min_clouds = 0.05
var I_max_clouds = 0.9
var gamma_clouds = 2.0

// compute number of cloud pixels
var bad = [61440,59424,57344,56320,53248,52256,52224,49184,49152,45056,28672];
var maskClouds = function(img) { return img.select('BQA').eq(bad).reduce('max'); };


var demRendered = renderDem().visualize();

var getRealImages = function() {
  // load Landsat 8 imagery
  var collection = images
    .map(function(i){
      if(max_cloud_pixels != -1) {
        var clouds = maskClouds(i);
        var cloudPixelCount = ee.Dictionary(clouds.reduceRegion(ee.Reducer.sum(), aoi, scale)).get('max')
      } else {
        var cloudPixelCount = -2;
      }
      
      var result = ee.ImageCollection.fromImages([
        demRendered, 
        ee.Image().toByte().paint(basinsLevel3, 1, 2).visualize({forceRgbOutput:true}),
        i.select(bands).visualize({min:I_min, max:I_max, gamma:gamma}) 
        ]).mosaic()
  
      return result
        .set('cloud_pixels', cloudPixelCount);
    });
  
  // filter images with clouds over area
  print('With clouds:', collection.aggregate_count('cloud_pixels')); 
  
  var firstImage = ee.Image(collection.filterMetadata('cloud_pixels', 'greater_than', max_cloud_pixels).first());
  Map.addLayer(firstImage, {}, 'with clouds');
  
  collection = collection.filterMetadata('cloud_pixels', 'less_than', max_cloud_pixels);
  print('Without clouds:', collection.aggregate_count('cloud_pixels'));
  
  var firstImage = ee.Image(collection.first());
  Map.addLayer(firstImage, {}, 'without clouds');
  
  return collection;
}

var getPercentileImages = function() {
  var percentiles = [];
  
  var start = 0;
  var stop = 100;
  var step = 2;
  for(var p = start; p <= stop; p += step) {
    percentiles.push(p)
  }
  
  print(percentiles)
  
  var percentileImages = images.select([5,4,2]).reduce(ee.Reducer.percentile(percentiles))

  var collection = ee.ImageCollection(percentiles.map(function(p) {
    var result = ee.Image();
    if(useWaterIndex) {
      if(index == 'NDWI') {
        result = percentileImages.normalizedDifference(['green_p' + p, 'nir_p' + p]).sldStyle(water_index_style);
      } else {
        result = percentileImages.normalizedDifference(['green_p' + p, 'swir1_p' + p]).sldStyle(water_index_style);
      }
    } else {
      result = percentileImages.select(['swir1_p' + p, 'nir_p' + p, 'green_p' + p]).visualize({min:I_min, max:I_max, gamma:gamma});
    }
    
    return ee.ImageCollection.fromImages([
      demRendered, 
      ee.Image().toByte().paint(basinsLevel3, 1, 2).visualize({forceRgbOutput:true}),
      result.clip(basinsLevel3) 
    ]).mosaic()

    //return result;
  }));
  
  var list = collection.toList(15, 0);
  Map.addLayer(ee.Image(list.get(0)), {}, '0', false)
  Map.addLayer(ee.Image(list.get(5)), {}, '10', true)
  Map.addLayer(ee.Image(list.get(7)), {}, '14', false)
  Map.addLayer(ee.Image(list.get(14)), {}, '28', true)

  return collection;
}

if(usePercentiles) {
  var collection = getPercentileImages()
} else {
  var collection = getRealImages();
}

var region = JSON.stringify(ee.Geometry(aoi).bounds(1).getInfo().coordinates[0]);

var geom = aoi
var coords = ee.List(geom.bounds(1, ee.Projection('EPSG:3857')).coordinates().get(0)).getInfo()
var w = Math.round((coords[1][0] - coords[0][0])/scale)
var h = Math.round((coords[2][1] - coords[1][1])/scale)
print(w + 'x' + h)

// export video without clouds
Export.video(collection, fileName, {
  dimensions: w + 'x' + h,
  framesPerSecond: 5,
  region: region
});
  