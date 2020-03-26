/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var l8 = ee.ImageCollection("LANDSAT/LC8_L1T_TOA"),
    f_water = /* color: d63000 */ee.Feature(
        ee.Geometry.Polygon(
            [[[148.82492065429688, -35.462452644201576],
              [148.82440567016602, -35.459900934601436],
              [148.82534982011111, -35.45944649346043],
              [148.8259935274598, -35.45633539366755],
              [148.8252639932732, -35.458257997463086],
              [148.82384777069092, -35.4595513790376],
              [148.82419109344482, -35.46115932205461],
              [148.82367610931396, -35.46224291769848]]]),
        {
          "system:index": "0"
        }),
    f_land = /* color: 98ff00 */ee.Feature(
        ee.Geometry.Polygon(
            [[[148.85285846334875, -35.44252589442484],
              [148.8546175200945, -35.4425608480687],
              [148.85496075069068, -35.4419666342135],
              [148.85247232893232, -35.44074323890345],
              [148.85105650275364, -35.44116269082719],
              [148.85182877158945, -35.44203654194536]]]),
        {
          "system:index": "0"
        });
/***** End of imports. If edited, may not auto-convert in the playground. *****/
// automatic_NDWI.js

//require('./training')
//var commandLine = true;
var commandLine = false;

var aoi = ee.FeatureCollection('ft:1778IyIZLZKSKVgko9X3aIV94E7jcm28uniyD6ycp') // 3
    .filter(ee.Filter.eq('HYBAS_ID', 5030073410));
    
var not_aoi = ee.FeatureCollection('ft:1778IyIZLZKSKVgko9X3aIV94E7jcm28uniyD6ycp')
    .filter(ee.Filter.neq('HYBAS_ID', 5030073410)); 

var LC8_BANDS = ['B1',    'B2',   'B3',    'B4',  'B5',  'B6',    'B7',    'B8', 'B10', 'BQA'];
var LC7_BANDS = ['B1',    'B1',   'B2',    'B3',  'B4',  'B5',    'B7',    'B8', 'B8', 'B7'];
var STD_NAMES = ['blue2', 'blue', 'green', 'red', 'nir', 'swir1', 'swir2', 'pan', 'temp', 'BQA'];

var images = l8
  .filterBounds(aoi)
  .filterDate('2013-06-01', '2015-06-01')
  .select(LC8_BANDS, STD_NAMES)


/*
var images = l7
  .filterBounds(aoi)
  //.filterDate('2001-01-01', '2003-01-01')
  .select(LC7_BANDS, STD_NAMES)
*/  

var dem = ee.Image('USGS/SRTMGL1_003');
var info = dem.getInfo()
var crs = info.bands[0].crs
var crs_transform = info.bands[0].crs_transform
crs_transform = [crs_transform[0], crs_transform[1], 0.0, crs_transform[3], crs_transform[4], 0.0];

function pad(n, width, z) {
  z = z || '0';
  n = n + '';
  return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}

print(Map.getCenter())

//Map.setCenter(141.53, -34.19, 13) // Murray, near lake Viktoria
// Map.setCenter(90.513512, 29.14274, 12) // somewhere in China, mountains + lake
// Map.setCenter(147.06, -29.13, 12) // M&D north
// Map.setCenter(-60.6613104, -9.2981289, 12) // Roosvelt river

var max_I = 0.5

//var clipBounds = false;
var clipBounds = true;

var percentile = null;
var water_index_name = null;

if(commandLine) {
  percentile = null // specified using args
  water_index_name = null; // specified using args
} 

var classifyManual = true
//var classifyManual = false

// 10-03-2015
var rivers_lines_osm = ee.FeatureCollection('ft:1nlWWjT4VkGjkp-kXKroFuyUuKDUSTqce_DDtmOt1')
  .filter(ee.Filter.inList('waterway', ['river', 'stream', 'drain', 'canal', 'drain', 'creek', 'ditch']))
var rivers_polygons_osm = ee.FeatureCollection('ft:1gUbHjPLpeC4Vzi59vE5JSFfLRDtcrngyWfSn8mQC');

var rivers_lines_osm_segments = ee.FeatureCollection('ft:1HbkaK1HfwdlaPB741WwUbltm-XN8aL-ro-UmwZYW')
  .filter(ee.Filter.inList('waterway', ['river', 'stream', 'drain', 'canal', 'drain', 'creek', 'ditch']))

var crsTransformSetStep = function(step, t) {
  return [step, t[1], t[2], t[3], -step, t[5]];
}

// adds vectors as rasters to map
var addToMapAsRaster = function(shapes, name, palette, width, opacity, filled, visible) {
  var outline = width;
  var img; 
  
  if (filled) {
    img = ee.Image().toByte();
    img = img.paint(shapes, 1); // paint fill
    img = img.paint(shapes, 0, outline + 1); // paint outline
  } else {
    img = ee.Image(0).mask(0);
    img = img.paint(shapes, 0, width);
  }

  var options = {
    palette: palette,
    max: 1,
    opacity: opacity
  };

  Map.addLayer(img, options, name, visible);

  return img;
}

Map.addLayer(ee.Image(1).toByte(), {palette:['ffffff']}, 'map (white)', false);

var pansharpen = function(image) {
    var pan = image.select('pan');
    var rgb = image.select('red', 'green', 'blue');
    var hsv  = rgb.rgbtohsv();
    var huesat = hsv.select('hue', 'saturation');
    var upres = ee.Image.cat(huesat, pan.multiply(2)).hsvtorgb();
 
    return upres;
}

var sumAll = function (a, start, end) {
    var sum = 0;
    for (var i = start; i < end; i++)
        sum += a[i];
    return sum;
};

function otsu(histogram) {
    var total = sumAll(histogram, 0, histogram.length);
    console.log(total)

    var sum = 0;
    for (var i = 1; i < histogram.length; ++i) {
        sum += i * histogram[i];
    }

    var sumB = 0;
    var wB = 0;
    var wF = 0;
    var mB;
    var mF;
    var max = 0.0;
    var between = 0.0;
    var threshold1 = 0.0;
    var threshold2 = 0.0;

    for (var j = 0; j < histogram.length; ++j) {
        wB += histogram[j];
        if (wB == 0)
            continue;

        wF = total - wB;
        if (wF == 0)
            break;
        sumB += j * histogram[j];
        mB = sumB / wB;
        mF = (sum - sumB) / wF;
        between = wB * wF * Math.pow(mB - mF, 2);
        if ( between >= max ) {
            threshold1 = j;
            if ( between > max ) {
                threshold2 = j;
            }
            max = between;            
        }
    }
    return ( threshold1 + threshold2 ) / 2.0;
}

/* server-side

function otsu(histogram) {
    histogram = ee.Array(histogram)
    var length = histogram.length().get([0])
    var total = histogram.slice(0, 0, length).accum(0).get([-1])

    print(length)
    print(total)
    var sum = 0;
    for (var i = ee.Number(1); i.lt(length) == 1; i = i.add(1)) {
        print(i)
        sum += i * histogram[i];
    }

    var sumB = 0;
    var wB = 0;
    var wF = 0;
    var mB;
    var mF;
    var max = 0.0;
    var between = 0.0;
    var threshold1 = 0.0;
    var threshold2 = 0.0;

    for (var j = 0; j < histogram.length; ++j) {
        wB += histogram[j];
        if (wB == 0)
            continue;

        wF = total - wB;
        if (wF == 0)
            break;
        sumB += j * histogram[j];
        mB = sumB / wB;
        mF = (sum - sumB) / wF;
        between = wB * wF * Math.pow(mB - mF, 2);
        if ( between >= max ) {
            threshold1 = j;
            if ( between > max ) {
                threshold2 = j;
            }
            max = between;            
        }
    }
    return ( threshold1 + threshold2 ) / 2.0;
}
*/

var trainClassifier = function(i, bandNames) {
  f_water = f_water.map(function(f) { return f.set('class', 0) })
  f_water_5 = f_water_5.map(function(f) { return f.set('class', 0) })
  f_water_15 = f_water_15.map(function(f) { return f.set('class', 0) })
  f_water_25 = f_water_25.map(function(f) { return f.set('class', 0) })
  f_water_35 = f_water_35.map(function(f) { return f.set('class', 0) })
  f_land = f_land.map(function(f) { return f.set('class', 1) })
  f_land_5 = f_land_5.map(function(f) { return f.set('class', 1) })
  f_land_15 = f_land_15.map(function(f) { return f.set('class', 1) })
  f_land_45 = f_land_45.map(function(f) { return f.set('class', 1) })
  f_snow_5 = f_snow_5.map(function(f) { return f.set('class', 2) })
  f_snow_15 = f_snow_15.map(function(f) { return f.set('class', 2) })
  f_snow_25 = f_snow_25.map(function(f) { return f.set('class', 2) })
  f_snow_35 = f_snow_35.map(function(f) { return f.set('class', 2) })
  f_snow_45 = f_snow_45.map(function(f) { return f.set('class', 2) })

  var trainingSetWater = f_water
  var trainingSetLand = f_land
  var trainingSetSnow = ee.FeatureCollection([])

  if(percentile <= 5) {
    trainingSetWater = trainingSetWater.merge(f_water_5)
  }

  if(percentile <= 15) {
    trainingSetWater = trainingSetWater.merge(f_water_15)
  }

  if(percentile <= 25) {
    trainingSetWater = trainingSetWater.merge(f_water_25)
  }

  if(percentile <= 35) {
    trainingSetWater = trainingSetWater.merge(f_water_35)
  }

  if(percentile == 45) {
      trainingSetLand = trainingSetLand.merge(f_land_45)
  }

  if(percentile == 5) {
      trainingSetLand = trainingSetLand.merge(f_land_5)
  }

  if(percentile == 15) {
      trainingSetLand = trainingSetLand.merge(f_land_15)
  }

  if(percentile == 5) {
    trainingSetSnow = trainingSetSnow.merge(f_snow_5)
  }

  if(percentile >= 15) {
    trainingSetSnow = trainingSetSnow.merge(f_snow_15)
  }

  if(percentile >= 25) {
    trainingSetSnow = trainingSetSnow.merge(f_snow_25)
  }

  if(percentile >= 35) {
    trainingSetSnow = trainingSetSnow.merge(f_snow_35)
  }

  if(percentile >= 45) {
    trainingSetSnow = trainingSetSnow.merge(f_snow_45)
  }

  var trainingSet = trainingSetWater.merge(trainingSetLand).merge(trainingSetSnow);
  
/*
  print('Training set land area:', trainingSetLand.geometry().area())
  
  var ndvi03land = i.normalizedDifference(['B5', 'B4']).gt(0.4).clip(trainingSetLand)
      .reduceToVectors({geometry:trainingSetLand})
      
  print('Training set land x NDWI > 0.3 area:', ndvi03land.geometry().area(10))
*/

/*  print('Training set water area:', trainingSetWater.geometry().area())
  
  var ndvi03water = i.normalizedDifference(['B5', 'B4']).gt(0.3).clip(trainingSetWater)
      .reduceToVectors({geometry:trainingSetWater})
      
  Map.addLayer(ndvi03water)
  
  //Map.centerObject(ndvi03water.first())
      
  print('Training set water x NDWI > 0.3 area:', ndvi03water.geometry().area(10))
*/
  var training = i.select(bandNames).sampleRegions(trainingSet, ['class']);
  
  //var w = f_water.merge(f_water_5)
  //Map.addLayer(i.clip(w).normalizedDifference(['B3', 'B5']).lt(-0.1), {}, 'ndwi < -0.1')
  
  //Export.table(training)
  
  // Train a CART classifier with default parameters.
  var classifier = ee.Classifier.cart({maxDepth:20}).train(training, 'class', bandNames);

  var trainAccuracy = classifier.confusionMatrix();
  if(commandLine) {
    print('Resubstitution error matrix: ' + trainAccuracy.getInfo());
    print('Training overall accuracy: ' + trainAccuracy.accuracy().getInfo());
  } else {
    print('Resubstitution error matrix: ', trainAccuracy);
    print('Training overall accuracy: ', trainAccuracy.accuracy());
  }

  // check mismatches
  
  //var classToCheck = 1 // water
  //var trainingSetToCheck = trainingSetWater

  /*
  var trainingImage = trainingSet.reduceToImage({
    properties: ['class'],
    reducer: ee.Reducer.first()
  });

  Map.addLayer(trainingImage, {palette: ['0000FF','00FF00','FFFFFF'], min:1, max: 3 }, 'training', false)

  var trainingClassified = i.select(bandNames).clip(trainingSet).classify(classifier)
  Map.addLayer(trainingClassified.mask(trainingClassified), {palette: ['0000FF','00FF00','FFFFFF'], min:1, max: 3 }, 'training, classified', false)

  var trainingError = trainingClassified.neq(trainingImage).clip(trainingSet)

  Map.addLayer(trainingError.mask(trainingError).focal_max(3), {palette:['ff0000']}, 'training error (buffer)')
  Map.addLayer(trainingError.mask(trainingError), {palette:['ff0000']}, 'training error', false)
  
  Export.image(trainingImage)
  */

  //Map.addLayer(trainingErrorWaterVector, {}, 'training error vector (water)')
  //Map.centerObject(ee.Feature(trainingErrorWaterVector.toList(2, 0).get(0)).geometry())
  
  return classifier;
}


function classify(i, classifier, bandNames) {
  return i.select(bandNames).classify(classifier);
}

function rescale(img, exp, thresholds) {
    return img.expression(exp, {img: img})
        .subtract(thresholds[0]).divide(thresholds[1] - thresholds[0]);
  };

function snowScore(img){
      // Compute several indicators of snowyness and take the minimum of them.
      var score = ee.Image(1.0).reproject(crs, crs_transform);
      // Snow is reasonably bright in the blue band.
      score = score.min(rescale(img, 'img.blue', [0.1, 0.3]));
    
      // Snow is reasonably bright in all visible bands.
      score = score.min(rescale(img, 'img.red + img.green + img.blue', [0.2, 0.8]));
    
      // // Excluded this for snow reasonably bright in all infrared bands.
      // score = score.min(
      //     rescale(img, 'img.nir + img.swir1 + img.swir2', [0.3, 0.8]));
    
      // Snow is reasonably cool in temperature.
      //Changed from [300,290] to [290,275] for AK
      //score = score.min(rescale(img, 'img.temp', [300, 285]));
      
      // Snow is high in ndsi.
      var ndsi = img.normalizedDifference(['green', 'swir1']);
      ndsi = rescale(ndsi, 'img', [0.5, 0.7]);
      score = score.min(ndsi);
      
      return score.clamp(0,1).toFloat()
      
      }

var snowThresh = 0.05;//Lower number masks more out (0-1)

function maskSnow(img){
  var ss = snowScore(img)
  return img.mask(img.mask().and(ss.lt(snowThresh)))
}

function getSimpleEdge(i, b) {
  var canny = ee.Algorithms.CannyEdgeDetector(i, 0.99, 0);
  canny = canny.mask(canny).clip(b)
  return canny;

/* does not work for small rivers
  var delta = 30;
  var edge = i.subtract(i.focal_min(delta, 'square', 'meters'));
  return edge.mask(edge)
*/
}



var water_index_min = -0.5
var water_index_max = 0.5
var water_index_vis = {min: water_index_min, max: water_index_max, palette: ['ffffff', '000000']}

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

var thresholds = ee.FeatureCollection('ft:1z147mbk6XboYzZaw-zY5tctKB35mTPt97vaqKbqg')

var colors_hand = ['023858', '006837', '1a9850', '66bd63', 'a6d96a', 'd9ef8b', 'ffffbf', 'fee08b', 'fdae61', 'f46d43', 'd73027'];
var hand = ee.ImageCollection('GME/layers/02769936315533645832-01676697048325678532').mosaic(); // HAND, M&D
var hand_vis = hand.visualize({min:-1, max:30, palette:colors_hand});

function radians(img) { return img.toFloat().multiply(3.1415927).divide(180); }

var dem = ee.Image('USGS/SRTMGL1_003');
var terrain = ee.call('Terrain', dem);
var slope = radians(terrain.select(['slope']));

var handMask = ee.Image(1);
var slopeMask = ee.Image(1)
var image = ee.Image();
var imageAll = ee.Image();
var mndwi = ee.Image();
var ndwi = ee.Image();
var ndvi = ee.Image();
var ndvi_threshold = 0.35;
var imageClassify = ee.Image();
var trainedClassifier = ee.Image(0);

var classifierBandNames = ['nir', 'swir1', 'green', 'hand', 'slope', 'red', 'blue', 'swir2', 'pan', 'temp'];
var handBuffer = 300
var handThreshold = 50

var slopeThreshold = 0.25
var slopeBuffer = 300

function prepareBaseData(featureId) {
  if(!classifyManual) {
    var feature = ee.Feature(grid.filter(ee.Filter.eq('id', featureId)).first());
    var bounds = ee.Geometry(feature.geometry().buffer(30));
    images = images.filterBounds(bounds)
  }

  image = images.reduce(ee.Reducer.percentile([percentile]))
  var names = []
  for(var i=0; i<STD_NAMES.length;i++) {
    names.push(STD_NAMES[i] + '_p' + percentile.toString())
  }
  image = image.select(names, STD_NAMES)
  
  imageAll = image; // remember for later use
  
  image = image.reproject(crs, crs_transform)

  if(classifyManual) {
      imageClassify = imageAll
              .addBands(hand.max(ee.Image(10.0)).rename(['hand']), ['hand'])
              .addBands(slope)
            .reproject(crs, crs_transform)

      trainedClassifier = trainClassifier(imageClassify, classifierBandNames)
  }

  if(percentile <= 15) {
    handThreshold = 30
    handBuffer = 400
    slopeBuffer = 400
  }
  
  if(percentile <= 5) {
    handThreshold = 15
    handBuffer = 600
  }

  handMask = hand.gt(handThreshold)
      .reduceNeighborhood(ee.Reducer.max(), ee.Kernel.circle(handBuffer / 2.0, 'meters'))
      .reduceNeighborhood(ee.Reducer.max(), ee.Kernel.circle(handBuffer / 2.0, 'meters'))
      
  handMask = handMask.mask(handMask)

  slopeMask = slope.gt(slopeThreshold)
      .reduceNeighborhood(ee.Reducer.max(), ee.Kernel.circle(slopeBuffer / 2.0, 'meters'))
      .reduceNeighborhood(ee.Reducer.max(), ee.Kernel.circle(slopeBuffer / 2.0, 'meters'))

  slopeMask = slopeMask.mask(slopeMask)

  ndwi = image.normalizedDifference(['green', 'nir'])
  mndwi = image.normalizedDifference(['green', 'swir1'])
  ndvi = image.normalizedDifference(['nir', 'red'])
}

function addHand() {
  Map.addLayer(hand_vis, {}, 'hand', false)
  Map.addLayer(ee.Image(1).mask(hand.gt(50)), {palette:['101010']}, 'hand > 50m', false)
  Map.addLayer(ee.Image(1).mask(hand.gt(30)), {palette:['101010']}, 'hand > 30m', false)
  
  Map.addLayer(handMask, {palette:['101010']}, 'hand > ' + handThreshold + 'm (buffer ' + handBuffer + 'm)', false)
  
  var s = slope.gt(slopeThreshold);
  Map.addLayer(s.mask(s), {opacity:0.7, palette:['000000']}, 'slope > ' + slopeThreshold, false)
  
  Map.addLayer(slopeMask, {opacity:0.7, palette:['000000']}, 'slope mask', false)

  Map.addLayer(ee.Image(1).mask(hand.gt(20)), {palette:['101010']}, 'hand > 20m', false)
  Map.addLayer(ee.Image(1).mask(hand.gt(10)), {palette:['101010']}, 'hand > 10m', false)
  Map.addLayer(ee.Image(1).mask(hand.gt(5)), {palette:['101010']}, 'hand > 5m', false)
  Map.addLayer(ee.Image(1).mask(hand.lt(2)), {palette:['aaaaff']}, 'hand < 2m', false)
  Map.addLayer(ee.Image(1).mask(hand.lt(1)), {palette:['aaaaff']}, 'hand < 1m', false)
  //var dem = ee.Image('USGS/SRTMGL1_003')
}

function processTile(featureId) {
  print('Feature: ' + featureId);

  var feature = ee.Feature(grid.filter(ee.Filter.eq('id', featureId)).first());
  
  if(!commandLine) {
    Map.centerObject(feature, 13)
  }

  // or specified geometry
  var bounds = ee.Geometry(feature.geometry().buffer(30)); // add small buffer to avoid missing pixels
  var boundsAoi = bounds.intersection(aoi)
  Map.addLayer(boundsAoi, {}, 'bounds', true)

  //var imagesInBounds = images.filterBounds(boundsAoi)
  //Map.addLayer(imagesInBounds, {}, 'images (raw)', false)
  //print(imagesInBounds.aggregate_count('system:index'))  
  
  //print(image)
  
  Map.addLayer(image.clip(boundsAoi), {min:0.05, max:0.5}, 'image (swir1_nir_green)', false)
  
  Map.addLayer(image.clip(boundsAoi).select(['swir1', 'nir', 'green']), {min:0.05, max:[max_I, max_I, max_I + 0.1], gamma:1.5}, 'image', true)
  
  var pan = pansharpen(imageAll.select(['red', 'green', 'blue', 'pan'], ['red', 'green', 'blue', 'pan']));
  Map.addLayer(pan.clip(boundsAoi), {min:0.05, max:[max_I, max_I, max_I + 0.4], gamma:1.5}, 'image (pan)', false)
  
  var bufferSize = ee.Geometry(bounds).area(600, ee.Projection("EPSG:3857")).sqrt().multiply(0.01).getInfo();
  
  bufferSize = 30;

  var bounds2 = ee.Geometry(boundsAoi).buffer(-bufferSize);
  

  /*
  var scores = images.map(function(i) { return snowScore(i.select(LC8_BANDS, STD_NAMES)) })
  //var score = scores.reduce(ee.Reducer.percentile([percentile]))
  var score = ee.Image((percentile + 5) / 100.0).multiply(scores.sum().divide(scores.count()));
  
  Map.addLayer(score, {min: 0, max: 0.5}, 'snow score', false);
  
  var snowMask = score.gt(0.04)//.multiply(dem.gt(300)).focal_mode(2).focal_max(3).focal_min(2)
  
  Map.addLayer(snowMask.mask(snowMask), {min: 0, max: 1, palette: '000000, FF0000', opacity:0.6}, 'snow', false);
  
  Map.addLayer(getSimpleEdge(snowMask, bounds2), {min: 0, max: 1, palette: 'FF0000'}, 'snow (edge)', false);
  
  var score2 = snowScore(image.select(LC8_BANDS, STD_NAMES))
  var snowMask2 = score2.gt(0.04)
  Map.addLayer(score2, {min: 0, max: 0.5}, 'snow2 score', false);
  Map.addLayer(snowMask2.mask(snowMask2), {min: 0, max: 1, palette: '000000, FF0000', opacity:0.6}, 'snow2', false);
  */

  var detectWater = function(water_index, water_index_name, visible, show_charts) {
    var waterEdgeDetectionThreshold = 0.99
    var waterEdgeDetectionSigma = 0.7
    
    var minimizeEdgePixelCount = false
    
    var waterEdgeMaxPixelRatio = 1.0
    var waterEdgeMinPixelRatio = 0.8
  
    var waterEdgeMinPixelCountBeforeRelaxation = 100
    var waterEdgeRelaxationValue = 0.05
    var waterEdgeRelaxationFactor = 0.2
    var minWaterEdgePixels = 4
    
    var minIndexValue = 0.0
    var maxIndexValue = 0.4
    
    // prevent relaxation
    //waterEdgeRelaxationMinValue = 1.0
  
    //var methodScale = 15
    var methodScale = 30

    water_index = water_index.clip(boundsAoi)

    var ndvi_mask = ndvi.gt(ndvi_threshold); 
  
    if(!commandLine) {
      Map.addLayer(water_index.sldStyle(water_index_style), {}, water_index_name, false)
      Map.addLayer(water_index, water_index_vis, water_index_name + ' (B/W)', false)
    }
    
    var water0 = water_index.gt(0)
    var edge0 = getSimpleEdge(water0, bounds2)
    
    Map.addLayer(image.mask(water0).clip(boundsAoi), {min:[0.03,0.03,0.03], max:[0.4,0.4,0.3], gamma:1.5}, 'water (0)', false)
    Map.addLayer(edge0/*.focal_max(1)*/, {palette:'ff0000'}, 'water, ' + water_index_name + '=0 (boundary)', false)
  
    var canny1 = ee.Algorithms.CannyEdgeDetector(water_index, waterEdgeDetectionThreshold, waterEdgeDetectionSigma);
    
    // skip edges which are actually at vegetation that behaves like water
    
    var canny = canny1
        .mask(ndvi_mask.not())
        .mask(hand.lt(50))
        .clip(bounds2)

      //.reproject(crs, crsTransformSetStep(crs_transform[0] / 2, crs_transform))
      //.reproject(crs, crs_transform)

    var boundsIsEmpty = (bounds2.coordinates().getInfo().length == 0);
    
    var cannyCount = 0;
    if(!boundsIsEmpty) {
      var cannyCount = canny.reduceRegion(ee.Reducer.count(), boundsAoi, methodScale).getInfo()['nd'];
    }
    print('number of Canny pixels: ' + cannyCount)
  
    if(cannyCount >= minWaterEdgePixels) {
      Map.addLayer(canny1.mask(canny1).clip(bounds2), {min: 0, max: 1, palette: 'FF0000'}, 'canny original ' + water_index_name, false);
      Map.addLayer(canny.mask(canny), {min: 0, max: 1, palette: 'FF0000'}, 'canny ' + water_index_name, false);
      
      //var cannySmallRiver = canny.focal_max(40, 'square', 'meters')
      //Map.addLayer(cannyRiver.mask(cannySmallRiver), {}, 'canny max', true);
    
      var cannyBuffer = canny.focal_max(methodScale, 'square', 'meters');
    
      var water_index_canny = water_index.mask(cannyBuffer)
      .clip(bounds2);
      
      if(!commandLine) {
        if(show_charts) {
          // print(Chart.image.histogram(water_index, bounds2, methodScale, 255).setOptions({title: water_index_name, vAxis: { gridlines: { count: 0 } }, hAxis: { gridlines: { count: 0 }, viewWindow:{max:-1, min:1} }}));
          print(Chart.image.histogram(water_index_canny, bounds2, methodScale, 255).setOptions({title: water_index_name + ' around canny', vAxis: { gridlines: { count: 0 } }, hAxis: { gridlines: { count: 0 },viewWindow:{max:-1, min:1} }}));
        }
      
        Map.addLayer(water_index_canny, water_index_vis, water_index_name + ' around canny', false);
      }
    }
    
    // Otsu using all values
    var computeThreshold = function(water_index, name, bounds) {
      if(cannyCount < minWaterEdgePixels) {
        hist_info = { "error" : "Too few canny edges detected.", "threshold" : 1 }
        return [1, hist_info];
      }
      
      var hist_info = water_index.reduceRegion(ee.Reducer.histogram(255), bounds, methodScale).getInfo()['nd'];
  
      var error = null;
    
      if(hist_info === null) { 
        error = 'No water edges detected!'
        threshold = 1;
      } else {
        var hist = hist_info['histogram'] 
        var threshold_index = otsu(hist)
        var threshold = hist_info['bucketMeans'][Math.round(threshold_index)]; 
    
        print(water_index_name + ', ' + name + ': ' + threshold)
      }
    
  
      if(commandLine) {
        if(threshold != 1) {
           hist_info.threshold = threshold;
        } else {
           hist_info = { "threshold" : 1 }
        }
    
        if(error != null) {
          hist_info.error = error;
        }
      }
  
      return [threshold, hist_info];
    }
  
    var th = computeThreshold(water_index_canny, 'canny', bounds2);
    var hist_info = th[1]
    var water_index_threshold = th[0];
  
    water = ee.Image(0).clip(boundsAoi)
    var waterEdge = ee.Image(0).mask(ee.Image(0)).clip(boundsAoi)
    var waterEdgeCount = 0;
    
    // decrease threshold  if we have too many edges in the thresholded image to avoid misclassification
    var iteration = 0
    var increased = false
    var decreased = false
    if(water_index_threshold != 1) {
      do {
        var water = water_index.gt(water_index_threshold)
  
        waterEdge = getSimpleEdge(water, bounds2)
        waterEdgeCount = waterEdge.reduceRegion(ee.Reducer.count(), boundsAoi, methodScale).getInfo()['nd'];
        print('number of water Canny pixels: ' + waterEdgeCount)
  
        if(clipBounds) {
          water = water.clip(boundsAoi)
        }
        
        if(!minimizeEdgePixelCount) {
          break;
        }
        
        if(waterEdgeCount > cannyCount * waterEdgeMaxPixelRatio && waterEdgeCount > waterEdgeMinPixelCountBeforeRelaxation ) {
            if(decreased) { // change sign - reduce step
              waterEdgeRelaxationValue = waterEdgeRelaxationValue * waterEdgeRelaxationFactor
            }
  
            print('Increasing threshold by ' + waterEdgeRelaxationValue + ', number of edges around water is < ' + waterEdgeMinPixelRatio + 'x number of detected edges!')
  
            water_index_threshold = water_index_threshold + waterEdgeRelaxationValue
            
            increased = true
            decreased = false
        } else if(waterEdgeCount < cannyCount * waterEdgeMinPixelRatio) {
            if(increased) { // change sign - reduce step
              waterEdgeRelaxationValue = waterEdgeRelaxationValue * waterEdgeRelaxationFactor
            }
  
            print('Decreasing threshold by ' + waterEdgeRelaxationValue + ', number of edges around water is > ' + waterEdgeMaxPixelRatio + 'x number of detected edges!')
            water_index_threshold = water_index_threshold - waterEdgeRelaxationValue
  
            increased = false
            decreased = true
        } else {
          print(water_index_name + ': ' + water_index_threshold)
          break;
        }
        
        iteration = iteration + 1
        
        if(iteration > 10) {
          print('Stopped after 10 iterations')
          print(water_index_name + ': ' + water_index_threshold)
          break;
        }
        
      } while(true)
    }
  
    if(water_index_threshold < minIndexValue) {
      water_index_threshold = minIndexValue;
      print('Threshold is < ' + minIndexValue + ', resetting to ' + minIndexValue)
      var water = water_index.gt(water_index_threshold)
      if(clipBounds) {
        water = water.clip(boundsAoi)
      }
    }
  
    if(water_index_threshold > maxIndexValue) {
      print('Threshold is > ' + maxIndexValue + ', resetting to ' + maxIndexValue)
      water_index_threshold = maxIndexValue;
      var water = water_index.gt(water_index_threshold)
      if(clipBounds) {
        water = water.clip(boundsAoi)
      }
    }
  
    if(commandLine) {
      hist_info.canny_count = cannyCount
      hist_info.canny_count_water = waterEdgeCount
      hist_info.threshold_original = hist_info.threshold
      hist_info.threshold = water_index_threshold;
  
      save(JSON.stringify(hist_info), pad(featureId, 5) + '_water_' + percentile + '_histogram.json');  
    }
    
    if(!commandLine) {

      Map.addLayer(image.select(['swir1', 'nir', 'green']).mask(water), {min:[0.03,0.03,0.03], max:[0.4,0.4,0.5], gamma:1.5}, 'water ' + water_index_name, false)
    }
  
    Map.addLayer(ndvi, water_index_vis, 'NDVI (B/W)', false)
    
    var ndvi_rescaled = rescale(ndvi.rename(['ndvi']), 'img.ndvi', [-1, 1])
    Map.addLayer(image.addBands(ndvi_rescaled).select(['nir', 'ndvi', 'green']),
      {min:0, max:1}, 'NDVI (composite)', false)
    Map.addLayer(ndvi_mask.mask(ndvi_mask).clip(bounds), {palette:['000000'], opacity: 0.5}, 'NDVI (B/W) > ' + ndvi_threshold, false)

    if(classifyManual) {
      var classified = classify(imageClassify.mask(water), trainedClassifier, classifierBandNames).clip(boundsAoi)

      Map.addLayer(classified, {palette: ['0000FF','00FF00','FFFFFF'], min:0, max: 2 }, water_index_name + ' classified', false);
      // Map.addLayer(classified.reduceNeighborhood(ee.Reducer.mode(), ee.Kernel.square(35, 'meters')), {palette: ['0000FF','00FF00','FFFFFF'], min:1, max: 3 }, water_index_name + ' classified (mode)', false);

      classified = classified
        .reduceNeighborhood(ee.Reducer.mode(), ee.Kernel.square(35, 'meters'))
        
      Map.addLayer(classified, {palette: ['0000FF','00FF00','FFFFFF'], min:0, max: 2 }, water_index_name + ' classified (mode)', false);

      var snow = classified.eq(2)

      /*var classifiedNoSlope = classified.mask(slopeMask.mask().or(slopeMask.mask().not().and(snow)))
      Map.addLayer(classifiedNoSlope, {palette: ['0000FF','00FF00','FFFFFF'], min:0, max: 2 }, water_index_name + ' classified (SLOPE)', false);

      var waterNoSlope = water.mask(slopeMask.mask().not()).eq(0)
      waterNoSlope = waterNoSlope.mask(snow.not())
      Map.addLayer(waterNoSlope.mask(waterNoSlope), {palette: ['000000', '0000FF'], min:0, max: 1  }, water_index_name + ' water outside SLOPE', false);
      
      var water2 = classified.eq(0).multiply(slopeMask.mask())
                      .add(water.multiply(slopeMask.mask().not()).and(snow.not())).and(ndvi_mask.not())
*/
      var classifiedNoHand = classified.mask(handMask.mask().or(handMask.mask().not().and(snow)))
      Map.addLayer(classifiedNoHand, {palette: ['0000FF','00FF00','FFFFFF'], min:0, max: 2 }, water_index_name + ' classified (HAND)', false);

      var waterNoHand = water.mask(handMask.mask().not()).eq(0)
      waterNoHand = waterNoHand.mask(snow.not())
      Map.addLayer(waterNoHand.mask(waterNoHand), {palette: ['000000', '0000FF'], min:0, max: 1  }, water_index_name + ' water outside HAND', false);
      
      var water2 = classified.eq(0).multiply(handMask.mask())
                      .add(water.multiply(handMask.mask().not()).and(snow.not())).and(ndvi_mask.not())
  
      Map.addLayer(water2.mask(water2), {palette: ['0000FF'], min:0, max: 1  }, water_index_name + ' water new', true);
      
      Map.addLayer(waterEdge/*.focal_max(1)*/, {palette:'aaaaff'}, 'water (boundary), original ' + water_index_name, false)
  
      waterEdge = getSimpleEdge(water2, bounds2)
      water = water2

    }
    
    /*
    var all = intersectedWithCount.filter(ee.Filter.gt('feature_count', 0))
    var first = ee.Feature(all.first());
    var clippedRivers = ee.FeatureCollection(ee.List(first.get('clipped_features')));
    Map.addLayer(clippedRivers, {palette:'aaaaff'}, 'rivers (clipped)');
    */
  
    
    // detect larger blobs
    /*
    var waterBlobs = water.connectedPixelCount(300, true).clip(bounds);
    
    print(Chart.image.histogram(waterBlobs, bounds, 30, 255).setOptions({title: 'water blobs'}));
    Map.addLayer(waterBlobs.mask(water), {min:1, max:300}, 'water blobs');
  
    var waterBlobs = water.connectedComponents(ee.Kernel.square(60, 'meters'), 256).clip(bounds);
    
    print(Chart.image.histogram(waterBlobs, bounds, 30, 255).setOptions({title: 'water blobs'}));
    Map.addLayer(waterBlobs.mask(water), {min:1, max:300}, 'water blobs');
    */
  
  
    // add water edge
    Map.addLayer(waterEdge/*.focal_max(1)*/, {palette:'aaaaff'}, 'water (boundary) ' + water_index_name, visible)
    Map.addLayer(waterEdge/*.focal_max(1)*/, {palette:'ff0000'}, 'water (boundary), red ' + water_index_name, false)
    Map.addLayer(waterEdge, {palette:'0000ff'}, 'water (boundary), blue ' + water_index_name, false)

    image = image.select(['swir1', 'nir', 'green'])
  
    var name = pad(featureId, 5) + '_water_' + percentile;
    var url = image.mask(water).visualize({min:[0.03,0.03,0.03], max:[0.4,0.4,0.3], gamma:2.0}).clip(boundsAoi).getDownloadURL({
      name: name,
      crs: crs,
      format: 'png',
      //crs_transform: JSON.stringify(crsTransformSetStep(crs_transform[0] / 2, crs_transform)),
      crs_transform: JSON.stringify(crs_transform),
      region: JSON.stringify(bounds.coordinates().getInfo()[0]),
    });

    if(commandLine) {
       download(url, name + '.zip')
       validate_zip(name + '.zip')
    } else {
       // print(url);
    }

    var name = pad(featureId, 5) + '_' + water_index_name + '_' + percentile;
    var url = water_index.clip(boundsAoi).getDownloadURL({
      name: name,
      crs: crs,
      //crs_transform: JSON.stringify(crsTransformSetStep(crs_transform[0] / 2, crs_transform)),
      crs_transform: JSON.stringify(crs_transform),
      region: JSON.stringify(bounds.coordinates().getInfo()[0]),
    });

    if(commandLine) {
       download(url, name + '.zip')
       validate_zip(name + '.zip')
    } else {
       // print(url);
    }

    if(water_index_name == 'mndwi') { // download just once, TODO: move to arguments
      var im = image.visualize({min:0.05, max:[max_I, max_I, max_I + 0.1], gamma:1.5}).clip(boundsAoi);
      
      var name = pad(featureId, 5) + '_swir1_nir_green_' + percentile
      var url = im.getDownloadURL({
        name: name,
        format: 'png',
        crs: crs,
        //crs_transform: JSON.stringify(crsTransformSetStep(crs_transform[0] / 2, crs_transform)),
        crs_transform: JSON.stringify(crs_transform),
        region: JSON.stringify(bounds.coordinates().getInfo()[0]),
      });
  
      if(commandLine) {
         download(url, name + '.zip')
         validate_zip(name + '.zip')
      } else {
         // print(url);
      }

      if(!boundsIsEmpty) {
        var combined = ee.ImageCollection.fromImages([
            im,
            waterEdge.visualize({palette:['aaaaff']}).clip(boundsAoi)
        ]).mosaic();
  
        var name = pad(featureId, 5) + '_swir1_nir_green_combined' + percentile
        var url = combined.getDownloadURL({
          name: name,
          format: 'jpg',
          crs: crs,
          crs_transform: JSON.stringify(crsTransformSetStep(crs_transform[0] / 2, crs_transform)),
          //crs_transform: JSON.stringify(crs_transform),
          region: JSON.stringify(bounds.coordinates().getInfo()[0]),
        });
    
        if(commandLine) {
           download(url, name + '.zip')
           validate_zip(name + '.zip')
        } else {
           // print(url);
        }
      }
    }
  }
  
  // water_index, water_index_name, visible, show_charts
  if (water_index_name == 'ndwi') {
    detectWater(ndwi, 'ndwi', true, true)
  } else if (water_index_name == 'mndwi') {
    detectWater(mndwi, 'mndwi', false, true)
  }
}

function analyzeOsmRivers() {
    var boundsCollection = ee.FeatureCollection([ee.Feature(bounds)])
  
    var spatialFilter = ee.Filter.intersects({leftField: '.geo', rightField: '.geo', maxError: 10});
    var saveAllJoin = ee.Join.saveAll({matchesKey: 'features'});
    var intersectJoined = saveAllJoin.apply(boundsCollection, rivers_lines_osm, spatialFilter);
  
    var waterMask = water.mask(water)
    
    var intersectedWithCount = intersectJoined.map(function(f) {
      var features = ee.List(f.get('features'));
      var count = features.length()
      var clippedFeatures = features.map(function(f2) { 
        var clippedFeature = ee.Feature(f2).intersection(f);
        
        // for every clipped feature compute intersection with water for a number of buffers
        var buffers = [30, 60, 90, 120, 150] 
        
        var countPrev = ee.Number(0.0)
        for(var i=0; i<buffers.length;i++) {
          var buffer = clippedFeature.buffer(buffers[i]).geometry()
          var count = ee.Number(waterMask.reduceRegion(ee.Reducer.count(), buffer, 30).get('nd'));
          
          // compute difference only
          var countDiff = count.subtract(countPrev);
  
          clippedFeature = clippedFeature.set('water_buffer_' + buffers[i], countDiff);
  
          countPrev = count;
        }
        
        return clippedFeature;
      });
      
  
      return f.set('feature_count', count).set('clipped_features', clippedFeatures)
    })
  
    var clippedRivers = ee.FeatureCollection(ee.List(ee.Feature(intersectedWithCount.first()).get('clipped_features')))
    
    Map.addLayer(clippedRivers, {palette:'aaaaff'}, 'rivers (clipped)');
    Map.addLayer(clippedRivers.map(function(f) { return f.buffer(300) }), {palette:'aaaaff'}, 'rivers (clipped, buffer=300m)');
    
    print(clippedRivers)
}

if(commandLine) {
  var downloadMissing = (args[1] === "missing");
  
  percentile = parseInt(args[2])
   
  water_index_name = args[3]
  
  var path = require('path');

  prepareBaseData()
  
  if(downloadMissing) {
      var config = require(path.join(process.cwd(), "missing.json"))
      var missing = config.missing;
  
      for(var i = 0; i < missing.length; i++) {
        var id = missing[i];
        print('Processing: ' + id)
        processTile(id)
      }
  } else {
      var start_index = parseInt(args[4]);
      var max_index = parseInt(args[5]);
   
      var count = grid.aggregate_count('id').getInfo()
  
      if(max_index > 0) {
         count = max_index + 1;
      }
  
      var features = grid.sort('id').toList(count, 0);
  
      for(var i = start_index; i < count; i++) {
        print('Processing: ' + i)
        var feature = ee.Feature(features.get(i));
        var featureId = feature.get('id').getInfo();
        processTile(featureId)
  
        var idx_path = path.join(process.cwd(), 'download_water.js.last');
        save(i + 1, idx_path)
      }
  }

  var featureId = feature.get('id').getInfo();  

  
} else {
  percentile = 15 // check AVERAGE_CLOUD_COVER
  water_index_name = 'mndwi';
  //water_index_name = 'ndwi';
  
  //var featureId = 4202
  //var featureId = 2592 // little water
  //var featureId = 1281
  //var featureId = 2120 // broken river parts
  //var featureId = 1079 // thin broken river and reservoir
  
  //var featureId = 80 // tiny reservoirs
  //var featureId = 82 // small reservoirs
  
  // 45%, NDWI
  //var featureId = 3215 // intermittent water
  //var featureId = 1007 // no water for 45%
  //var featureId = 2515 // false detection in city
  //var featureId = 3283 // slight overclassification, wider river, canals and reservoirs
  //var featureId = 3873
  
  // 15%, NDWI
  //var featureId = 2062 // false water
  //var featureId = 4001
  //var featureId = 1211 // false water
  //var featureId = 2714 // city, compare performance of MNDWI with NDWI
  //var featureId = 2779 // city, hills, water
  //var featureId = 3873 // false water, fields
  //var featureId = 2184 // false water, urban
  //var featureId = 1666
  //var featureId = 3261 // false water, urban
  //var featureId = 2123 // fields, NDWI, false-MNDWI
  
  // 45%, MNDWI
  //var featureId = 2443 // clouds
  //var featureId = 3108 // snow
  //var featureId = 2509 // mountain shadows only
  //var featureId = 1794 // broken river and small reservoirs
  //var featureId = 3933 // hills
  //var featureId = 2449 // thin river
  //var featureId = 2314 // hills
  //var featureId = 2714 // city, compare performance of MNDWI with NDWI
  
  // 15% MNDWI
  //var featureId = 2908 // shadows
  
  //var featureId = 2648 // city, nice example for different water types
  //var featureId = 2185 // city
  //var featureId = 1064 //lake
  
  // used during buffer code development (river + reserviors)
  //var featureId = 3008 
  //var featureId = 678
  
  // Training tiles for hills
  //var featureId = 2709
  //var featureId = 2908 // intermittent reservoir, river
  //var featureId = 3311
  //var featureId = 2711
  //var featureId = 3852
  //var featureId = 2909
  //var featureId = 2976 // only land
  //var featureId = 3718
  //var featureId = 3247
  //var featureId = 4337 // example of HAND masked (+classified) and water in non-hilly areas
  //var featureId = 1191
  //var featureId = 2378 // reservoir, boats, vegetation, hills
  //var featureId = 2379
  //var featureId = 2512 // reservoir in the middle of the hills
  //var featureId = 2313
  //var featureId = 2380
  //var featureId = 3115 // thin river, training
  
  //var featureId = 3177 // snow
  //var featureId = 2776 // snow
  //var featureId = 2842 // snow
  //var featureId = 3108 // snow
  //var featureId = 3175 // snow
  //var featureId = 2397 // inland, reservoir, river (5%)
  //var featureId = 1215 // inland, reservoir, river
  //var featureId = 810 // lake Viktoria
  //var featureId = 2384 // city, clouds
  //var featureId = 3113 
  //var featureId = 2348
  //var featureId = 3406
  //var featureId = 2454 // lake, NDWI / MNDWI differences
  //var featureId = 2520
  //var featureId = 1599 // training, flat thin river
  //var featureId = 4199 // hills, small river
  //var featureId = 2115 // hills, river (example of a combination HAND + classifier)
  //var featureId = 3384 // hills, HAND + flat
  //var featureId = 2779
  //var featureId = 3178
  //var featureId = 2910
  //var featureId = 2777
  //var featureId = 2580
  
  // misclassified (green), add NDVI > ndvi_threshold
  // var exceptions = ee.List([3649, 3583, 3519, 2979, 2980, 3517, 3505, 3246, 3648, 2114])

  //var featureId = 3649
  //var featureId = 3246
  
  //var featureId = 2714
  //var featureId = 3455 // strange forest low left
  
  //var featureId = 3610 // bad SRTM above water
  //var featureId = 3676 // bad SRTM above water

  //var featureId = 2256
  //var featureId = 1666
  
  //var featureId = 3440
  
  //var featureId = 2517
  //var featureId = 3313 // north of Canberra
  //var featureId = 2909
  //var featureId = 2508
  //var featureId = 3242
  
  var featureId = 2847

  prepareBaseData(featureId)

  print(featureId)
  processTile(featureId)
  
  addHand()
}






// Murray & Darling testing
//Map.addLayer(grid.reduceToImage(['NDWI_NIR_GREEN_MIN_20p'], ee.Reducer.first()), {min:-0.5, max:0.5, palette: ['0000ff', 'ffffff']}, 'NDWI min 20% (pre-computed)', false);
//Map.addLayer(grid.reduceToImage(['NDWI_NIR_GREEN_MIN_50p'], ee.Reducer.first()), {min:-0.5, max:0.5, palette: ['0000ff', 'ffffff']}, 'NDWI min 50% (pre-computed)', false);
Map.addLayer(grid, {}, 'grid (M&D)', false)


// OSM
var rivers_lines_osm_segments_image = ee.Image(0).mask(0).toByte();
rivers_lines_osm_segments_image = rivers_lines_osm_segments_image.paint(rivers_lines_osm_segments, 0, 2.0);
Map.addLayer(rivers_lines_osm_segments_image, {palette:['c60000'], opacity: 0.7}, 'rivers_lines', false);


Map.addLayer(ee.Image(0).mask(0).toByte()
                .paint(rivers_polygons_osm, 'fill')
                .paint(rivers_polygons_osm, 1, 1), 
{palette: ['c60000'], 'opacity': 0.7}, 'rivers_polygons', false);


