/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var l8 = ee.ImageCollection("LANDSAT/LC8_L1T_TOA"),
    l7 = ee.ImageCollection("LANDSAT/LE7_L1T_TOA");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
//var resolution = 30
var resolution = 15

var panOnly = false;
//var panOnly = true;

//var pansharpenOutput = true;
var pansharpenOutput = false;

var skipClouds = false
//var skipClouds = true

//var rgb = true
var rgb = false

if(rgb) {
  var bands = ['red', 'green', 'blue']
  var min = 0.05
  
  if(pansharpenOutput) {
    var max = [0.6, 0.6, 0.7] // for pansharpened
  } else {
    var max = [0.4, 0.4, 0.5] // for non-pansharpened
  }
  
  var gamma = 1.0
} else {
  var bands = ['swir1', 'nir', 'green']
  var min = 0.05
  var max = [0.5, 0.5, 0.5]
  var gamma = 1.0
}

if(panOnly) {
  var max = [0.4, 0.4, 0.5]
}

var pansharpen = function(image) {
    var pan = image.select('pan');
    var rgb = image.select(bands);

    var hsv  = rgb.rgbtohsv();
    var huesat = hsv.select('hue', 'saturation');
    var upres = ee.Image.cat(huesat, pan.multiply(2)).hsvtorgb();
 
    return upres;
}

var LC8_BANDS = ['B1',    'B2',   'B3',    'B4',  'B5',  'B6',    'B7',    'B8', 'B10', 'BQA'];
var LC7_BANDS = ['B1',    'B1',   'B2',    'B3',  'B4',  'B5',    'B7',    'B8', 'B8', 'B7'];
var STD_NAMES = ['blue2', 'blue', 'green', 'red', 'nir', 'swir1', 'swir2', 'pan', 'temp', 'BQA'];

l8 = l8
  .filterBounds(ee.Geometry(Map.getBounds(true)))
  .select(LC8_BANDS, STD_NAMES)

l7 = l7
  .filterBounds(ee.Geometry(Map.getBounds(true)))
  .select(LC7_BANDS, STD_NAMES)

//var images = l8
//var images = l7
var images = ee.ImageCollection(l7.merge(l8))
  .filterDate('2013-01-01', '2017-01-01')

images = images
  .sort('DATE_ACQUIRED', true)
  .filterBounds(Map.getCenter())

// compute number of cloud pixels
var bad = [61440,59424,57344,56320,53248,52256,52224,49184,49152,45056,28672];
//var bad = [61440,59424,57344,56320,53248,52256,52224,49184,49152];
var maskClouds = function(img) { return img.select('BQA').eq(bad).reduce('max'); };

var percentile = 15
var average = l8
  //.filterDate('2013-01-01', '2014-01-01') // LC8
  .reduce(ee.Reducer.percentile([percentile])).rename(STD_NAMES);

Map.addLayer(pansharpen(average).visualize({min:min, max:max}), {}, 'average', false)
Map.addLayer(l8.count(), {}, 'count', false)

var averageVis = average.select('red','green','blue').visualize({min:min, max:max, gamma:1.0})

var dem30 = ee.Image('USGS/SRTMGL1_003');
var dem_th = 900;

var averageWaterMndwi = average.normalizedDifference(['green', 'nir'])
var water_th = 0.1
Map.addLayer(averageWaterMndwi, {min:-0.5, max:0.5}, percentile + '% MNDWI', false)
var averageWater = averageWaterMndwi.gt(water_th).and(dem30.lt(dem_th))

Map.addLayer(dem30, {}, 'dem', false)

Map.addLayer(ee.Image(0).mask(dem30.lt(dem_th)), {}, 'dem < ' + dem_th, false)

Map.addLayer(averageWater.mask(averageWater), {palette:['0000ff']}, percentile + '% water mask', false)

images = images.map(function(image) {
    var cloudPixelCount = 0;
    
    if(skipClouds) {
      var clouds = maskClouds(image);
      cloudPixelCount = ee.Dictionary(clouds.multiply(averageWater).reduceRegion(ee.Reducer.sum(), Map.getBounds(true))).get('max')
    }

    return image.set('cloud_pixels', cloudPixelCount)
})

if(skipClouds) {
    var max_cloud_pixels_over_water = 100;
} else {
    var max_cloud_pixels_over_water = -1;
}

print('With clouds:', images.aggregate_count('cloud_pixels')); 

if(max_cloud_pixels_over_water > 0) {
  images = images.filterMetadata('cloud_pixels', 'less_than', max_cloud_pixels_over_water);
  print('Without clouds:', images.aggregate_count('cloud_pixels'));
}


images = images
  .map(function(i) {
    if(panOnly) {
      var image = i.select('pan').visualize({min:min, max:max[0], gamma:gamma, forceRgbOutput:true})      
    } else {
      if(pansharpenOutput) {
        var image = pansharpen(i).visualize({min:min, max:max, gamma:gamma})
      } else {
        var image = i.select(bands).visualize({min:min, max:max, gamma:gamma})      }
    }

    // detect water
    var water = i.normalizedDifference(['green', 'swir1']).gt(water_th)//.and(dem30.lt(dem_th))
    water = water.mask(water)
    
    var waterVis = water.visualize({palette:['0000ff'], opacity: 0.2})
    
    var waterEdge = ee.Algorithms.CannyEdgeDetector(water, 0.9)
    waterEdge = waterEdge.mask(waterEdge)
    
    var waterEdgeVis = waterEdge.visualize({palette:['0000ff'], opacity:0.5})

    return image;
    //return ee.ImageCollection.fromImages([/*averageVis, */image, waterEdgeVis]).mosaic();
  })


var bounds = Map.getBounds();
var region = '[['+bounds[0]+', '+bounds[1]+'], ['+bounds[2]+', '+bounds[1]+'], ['+bounds[2]+', '+bounds[3]+'], ['+bounds[0]+', ' + bounds[3] + ']]';

var geom = ee.Geometry(Map.getBounds(true))
var coords = ee.List(geom.bounds(1, ee.Projection('EPSG:3857')).coordinates().get(0)).getInfo()
var w = Math.round((coords[1][0] - coords[0][0])/resolution)
var h = Math.round((coords[2][1] - coords[1][1])/resolution)
print(w + 'x' + h)

// export video without clouds
Export.video(images, 'video', {
  dimensions: w + 'x' + h,
  framesPerSecond: 5,
  region: region /*JSON.stringify(polygon.getInfo())*/ });


Map.addLayer(ee.Image(images.toList(1, 0).get(0)), {}, '0')
Map.addLayer(ee.Image(images.toList(1, 1).get(0)), {}, '1')
Map.addLayer(ee.Image(images.toList(1, 2).get(0)), {}, '2')
