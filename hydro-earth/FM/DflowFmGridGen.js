// perform hit-or-miss
var hitOrMiss = function(image, se1, se2, crs, crs_transform) {
  if (typeof crs === 'undefined') { crs = null; }

  var e1 = image.reduceNeighborhood(ee.Reducer.min(), se1);
  var e2 = image.not().reduceNeighborhood(ee.Reducer.min(), se2);
  var result = e1.and(e2);
  
  if(crs !== null) {
    result = result.reproject(crs, crs_transform);
  }
  
  return result;
}

function findJunctions(input, crs, crs_transform) {
  function findJunctionsForSE(input2) {
    var le11 = ee.Kernel.fixed(3, 3, le11w);
    var le12 = ee.Kernel.fixed(3, 3, le12w);
    
    var result = hitOrMiss(input2, le11, le12, crs, crs_transform);
  
    for(var j=0; j<3; j++) { // rotate kernels
        le11 = le11.rotate(1);
        le12 = le12.rotate(1);
        result = result.or(hitOrMiss(input2, le11, le12, crs, crs_transform));
    }
    
    return result;
  }

  // pattern1
  var le11w = [[1, 0, 1], 
               [0, 1, 0], 
               [0, 1, 0]];
  
  var le12w = [[0, 1, 0], 
               [0, 0, 0], 
               [1, 0, 1]];

  var result1 = findJunctionsForSE(input, le11w, le12w)

  // pattern2
  var le11w = [[0, 1, 0], 
               [0, 1, 1], 
               [1, 0, 0]];
  
  var le12w = [[1, 0, 1], 
               [0, 0, 0], 
               [0, 0, 1]];

  var result2 = findJunctionsForSE(input, le11w, le12w)

  // pattern3
  var le11w = [[1, 0, 0], 
               [0, 1, 0], 
               [1, 0, 1]];
  
  var le12w = [[0, 1, 1], 
               [1, 0, 1], 
               [0, 1, 0]];

  var result3 = findJunctionsForSE(input, le11w, le12w)

   /*
  // pattern4
  var le11w = [[1, 1, 1], 
               [0, 1, 0], 
               [0, 0, 0]];
  
  var le12w = [[0, 0, 0], 
               [1, 0, 1], 
               [1, 1, 1]];

  var result4 = findJunctionsForSE(input, le11w, le12w)
  */

  // pattern4
  var le11w = [[0, 1, 0], 
               [1, 1, 1], 
               [0, 0, 0]];
  
  var le12w = [[1, 0, 0], 
               [0, 0, 0], 
               [0, 0, 0]];

  var result4 = findJunctionsForSE(input, le11w, le12w)

  return result1.or(result2).or(result3).or(result4);
}

var crsTransformSetStep = function(step, t) {
  return [step, t[1], t[2], t[3], -step, t[5]];
}

var splitKernel = function(kernel, value) {
  var result = [];
  for(var r=0; r<kernel.length; r++) {
      
      var row = [];
      for(var c=0; c<kernel.length; c++) {
          row.push(kernel[r][c] == value ? 1 : 0);
      }
      result.push(row);
  }
  
  return result;
}

var skeletonize = function(image, iterations, method, crs, crs_transform) {
  if (typeof crs === 'undefined') { crs = null; }

  var se1w = [[2, 2, 2], 
              [0, 1, 0], 
              [1, 1, 1]];
  
  if(method == 2) {
    se1w = [[2, 2, 2], 
            [0, 1, 0], 
            [0, 1, 0]];
  }
  var se11 = ee.Kernel.fixed(3, 3, splitKernel(se1w, 1));
  var se12 = ee.Kernel.fixed(3, 3, splitKernel(se1w, 2));
  
  var se2w = [[2, 2, 0], 
              [2, 1, 1], 
              [0, 1, 0]];
  
  if(method == 2) {
       se2w = [[2, 2, 0], 
               [2, 1, 1], 
               [0, 1, 1]];
  }
  
  var se21 = ee.Kernel.fixed(3, 3, splitKernel(se2w, 1));
  var se22 = ee.Kernel.fixed(3, 3, splitKernel(se2w, 2));
  
  var result = image;
  
  if (crs !== null) {
    // ee.Image(0).or(image)
    
    //result = image.reproject(crs, crs_transform);
  }

  for(var i=0; i<iterations; i++) {
    for(var j=0; j<4; j++) { // rotate kernels
      result = result.subtract(hitOrMiss(result, se11, se12, crs, crs_transform));
      se11 = se11.rotate(1);
      se12 = se12.rotate(1);
  
      result = result.subtract(hitOrMiss(result, se21, se22, crs, crs_transform));
      se21 = se21.rotate(1);
      se22 = se22.rotate(1);

      //result = result.mask(mask);
    }
    
  
/*
if (i%5 === 0) {
      var color = 'fec4' + pad(parseInt(100.0 * i/iterations), 2);
      print(color)
      Map.addLayer(result.mask(result), {palette:color, opacity: 0.5}, 'thining' + i);
    }  
*/
  }
  
  return result;
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

addToMapAsRaster(ee.FeatureCollection(ee.Geometry(Map.getBounds(true))), 'map (white)', 'ffffff', 0, 1, true, false);

function getSimpleEdge(i, b) {
  var canny = ee.Algorithms.CannyEdgeDetector(i, 0.99, 0);
  canny = canny.mask(canny).clip(b)
  return canny;
}

function rescale(img, exp, thresholds) {
    return img.expression(exp, {img: img})
        .subtract(thresholds[0]).divide(thresholds[1] - thresholds[0]);
};

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

var methodScale = Map.getScale()

function detectWater(image, bounds, visible, show_charts) {
        var commandLine = false
        var clipBounds = true;
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

        var waterEdgeDetectionThreshold = 0.9
        var waterEdgeDetectionSigma = 0.7

        var minimizeEdgePixelCount = false

        var waterEdgeMaxPixelRatio = 1.0
        var waterEdgeMinPixelRatio = 0.8

        var waterEdgeMinPixelCountBeforeRelaxation = 100
        var waterEdgeRelaxationValue = 0.05
        var waterEdgeRelaxationFactor = 0.2
        var minWaterEdgePixels = 4

        var minIndexValue = -0.4
        var maxIndexValue = 0.4

        // prevent relaxation
        //waterEdgeRelaxationMinValue = 1.0

        var ndvi_threshold = 0.35;

        var bufferSize = methodScale;
        var bounds2 = ee.Geometry(bounds).buffer(-bufferSize);

        //var water_index_name = 'PMNDWI';
        var water_index_name = 'MNDWI';

        var canny_band_name = null
        var water_index = null

        if(water_index_name === 'PMNDWI') {
          methodScale = 15
          canny_band_name = 'pan'
          water_index = image.expression('float(float(pan * green) / float(red + green + blue) - float(swir1)) / (float(pan * green) / float(red + green + blue) + float(swir1))',
                      {'swir1': image.select('swir1'), 
                      'pan': image.select('pan'),
                      'red': image.select('red'),
                      'green': image.select('green'),
                      'blue': image.select('blue')
                       });
        } 

        if(water_index_name === 'MNDWI') {
          methodScale = 30
          canny_band_name = 'nd'
          water_index = image.normalizedDifference(['green', 'swir1'])
        }
  
        water_index = water_index.clip(bounds)
        
        var ndvi = image.normalizedDifference(['nir', 'red'])
        var ndvi_mask = ndvi.gt(ndvi_threshold);

        Map.addLayer(water_index.sldStyle(water_index_style), {}, water_index_name, false)
        Map.addLayer(water_index, water_index_vis, water_index_name + ' (B/W)', false)

        var canny1 = ee.Algorithms.CannyEdgeDetector(water_index, waterEdgeDetectionThreshold, waterEdgeDetectionSigma);

        // skip edges which are actually vegetation behaving like water
        var canny = canny1
            //.mask(ndvi_mask.not())
            // .mask(hand.lt(50))
            .clip(bounds2)

        //.reproject(crs, crsTransformSetStep(crs_transform[0] / 2, crs_transform))
        //.reproject(crs, crs_transform)

        var boundsIsEmpty = (bounds2.coordinates().getInfo().length == 0);

        var cannyCount = 0;
        if(!boundsIsEmpty) {
            var cannyCount = canny.reduceRegion(ee.Reducer.count(), bounds, methodScale).getInfo()[canny_band_name];
        }
        print('number of Canny pixels: ' + cannyCount)

        if(cannyCount >= minWaterEdgePixels) {
            Map.addLayer(canny1.mask(canny1).clip(bounds2), {min: 0, max: 1, palette: 'FF0000'}, 'canny original ' + water_index_name, false);
            Map.addLayer(canny.mask(canny), {min: 0, max: 1, palette: 'FF0000'}, 'canny ' + water_index_name, false);

            var cannyBuffer = canny.focal_max(methodScale, 'square', 'meters');

            var water_index_canny = water_index.mask(cannyBuffer)
                .clip(bounds2);
                
            if(show_charts) {
                // print(Chart.image.histogram(water_index, bounds2, methodScale, 255).setOptions({title: water_index_name, vAxis: { gridlines: { count: 0 } }, hAxis: { gridlines: { count: 0 }, viewWindow:{max:-1, min:1} }}));
                print(Chart.image.histogram(water_index_canny, bounds2, methodScale, 255).setOptions({title: water_index_name + ' around canny', vAxis: { gridlines: { count: 0 } }, hAxis: { gridlines: { count: 0 },viewWindow:{max:-1, min:1} }}));
            }

            Map.addLayer(water_index_canny, water_index_vis, water_index_name + ' around canny', false);
        }

        // Otsu using all values
        var computeThreshold = function(water_index, name, bounds) {
            if(cannyCount < minWaterEdgePixels) {
                hist_info = { "error" : "Too few canny edges detected.", "threshold" : 1 }
                return [1, hist_info];
            }

            var hist_info = water_index.reduceRegion(ee.Reducer.histogram(255), bounds, methodScale).getInfo()[canny_band_name];

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

        water = ee.Image(0).clip(bounds)
        var waterEdge = ee.Image(0).mask(ee.Image(0)).clip(bounds)
        var waterEdgeCount = 0;

        // decrease threshold  if we have too many edges in the thresholded image to avoid misclassification
        var iteration = 0
        var increased = false
        var decreased = false
        if(water_index_threshold != 1) {
            do {
                var water = water_index.gt(water_index_threshold)

                waterEdge = getSimpleEdge(water, bounds2)
                waterEdgeCount = waterEdge.reduceRegion(ee.Reducer.count(), bounds, methodScale).getInfo()[canny_band_name];
                print('number of water Canny pixels: ' + waterEdgeCount)

                if(clipBounds) {
                    water = water.clip(bounds)
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
                water = water.clip(bounds)
            }
        }

        if(water_index_threshold > maxIndexValue) {
            print('Threshold is > ' + maxIndexValue + ', resetting to ' + maxIndexValue)
            water_index_threshold = maxIndexValue;
            var water = water_index.gt(water_index_threshold)
            if(clipBounds) {
                water = water.clip(bounds)
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
            Map.addLayer(water.mask(water), {palette:['6666ff']}, 'water mask ' + water_index_name, false)
        }

        print(bounds)
        
        var boundsInfo = bounds.bounds(1e-2).coordinates().getInfo()[0];
        var w = Math.round((boundsInfo[1][0] - boundsInfo[0][0])/-crs_transform[4]);
        var h = Math.round((boundsInfo[2][1] - boundsInfo[1][1])/crs_transform[0]);
        var dimensions = w + 'x' + h;
        print(dimensions)

        var url = water.getDownloadURL({
          name: 'water_mask',
          crs: crs,
          format: 'tif',
          crs_transform: JSON.stringify(crs_transform),
          region: JSON.stringify(bounds.coordinates().getInfo()[0]),
        });

        print(url)
        

        Map.addLayer(ndvi, water_index_vis, 'NDVI (B/W)', false)

        var ndvi_rescaled = rescale(ndvi.rename(['ndvi']), 'img.ndvi', [-1, 1])
        Map.addLayer(image.addBands(ndvi_rescaled).select(['nir', 'ndvi', 'green']), {min:0, max:1}, 'NDVI (composite)', false)
        Map.addLayer(ndvi_mask.mask(ndvi_mask).clip(bounds), {palette:['000000'], opacity: 0.5}, 'NDVI (B/W) > ' + ndvi_threshold, false)

        Map.addLayer(waterEdge/*.focal_max(1)*/, {palette:'aaaaff'}, 'water (boundary) ' + water_index_name, visible)
        Map.addLayer(waterEdge/*.focal_max(1)*/, {palette:'ff0000'}, 'water (boundary), red ' + water_index_name, false)
        Map.addLayer(waterEdge, {palette:'0000ff'}, 'water (boundary), blue ' + water_index_name, false)

        return water;
    }

// ==================================================

// Compute percentile image using Landsat 8
print(Map.getCenter())
//Map.setCenter(48.81, 30.32, 13)
//Map.setCenter(-89.57, 30.18, 13)

var BAND_NAMES = ['B6',    'B5',  'B3', 'B4', 'B2', 'B8']
var STD_NAMES =  ['swir1', 'nir', 'green', 'red', 'blue', 'pan']
var VIS = {min:0.03, max:[0.35, 0.35, 0.45]}
var VIS_PAN = {min:0.05, max:[0.15, 0.15, 0.25], gamma:1.3}

var bounds = ee.Geometry(Map.getBounds(true))

var dem = ee.Image('USGS/SRTMGL1_003');
var info = dem.getInfo()
var crs = info.bands[0].crs
var crs_transform = info.bands[0].crs_transform
crs_transform = [crs_transform[0], crs_transform[1], 0.0, crs_transform[3], crs_transform[4], 0.0];

var images = ee.ImageCollection('LANDSAT/LC08/C01/T1_TOA')
    .filterBounds(ee.Geometry(Map.getBounds(true)).centroid(1))
    .select(BAND_NAMES, STD_NAMES)

var p = 20
var image_name = p + '%'
var image = images
    .filterDate('2013-06-01', '2017-10-01')
    .reduce(ee.Reducer.percentile([p])).rename(STD_NAMES)

/*
var image_name = 'landsat 8'
var image = ee.Image(ee.ImageCollection('LANDSAT/LC8_L1T_TOA')
    .filterBounds(bounds.centroid(1))
    .select(BAND_NAMES, STD_NAMES)
    .filterMetadata('CLOUD_COVER', 'less_than', 10)
    .first())
    ; 
*/
Map.addLayer(image, VIS, image_name)

// pansharpen
var rgb = image.select(['red','green','blue'])
var pan = image.select('pan')

var hsv  = rgb.rgbToHsv();
var huesat = hsv.select('hue', 'saturation');
var pansharpened = ee.Image.cat(huesat, pan).hsvToRgb();

Map.addLayer(pansharpened, VIS_PAN, 'pansharpened', false)


// Detect water mask
var visible = false
var show_charts = true
var water = detectWater(image, bounds, visible, show_charts);


// Convert to vector, take the largerst blob
water = water
          .focal_max({radius:methodScale * 0.4, units:'meters'})
          .focal_mode({radius:methodScale + methodScale * 0.3, units:'meters', iterations:5})
          .focal_mode({radius:methodScale + methodScale * 0.5, units:'meters', iterations:5})
          .focal_min({radius:methodScale * 0.4, units:'meters'})
          //.focal_min({radius:35, units:'meters'})

var min_small_feature_size = 10000 // m^2
var min_large_feature_size = 1000000 // m^2

var land_boundary = ee.FeatureCollection(water
        .reduceToVectors({scale: methodScale * 0.5, geometry: bounds, maxPixels:1e10}))
        .filter(ee.Filter.eq('label', 1))
        .map(function(f) { var g = ee.Feature(f).geometry(); return f.set('area', g.area(10)) })
        .filter(ee.Filter.gt('area', min_small_feature_size))        

var land_boundary_buffer = land_boundary
  .filter(ee.Filter.gt('area', min_large_feature_size)) // take only large features
  .map(function(f) { return f.buffer(90, 15); }) // buffer them
  .geometry();

land_boundary = land_boundary.map(function(f) {
  return f.set('within_buffer', f.geometry().intersects(land_boundary_buffer, methodScale))
}).filter(ee.Filter.eq('within_buffer', true))


Map.addLayer(land_boundary, {}, 'land boundary (features)', false)
addToMapAsRaster(land_boundary, 'land boundary', ['ffffff', '4040ff'], 0, 0.5, true, true)

function detectTopology() {
  Export.table(land_boundary)
  
  var iterations = 25
  var multiplier = 1 // scale multiplier for skeleton
  crs_transform = crsTransformSetStep(multiplier * crs_transform[0], crs_transform)
  
  // Skeletonize
  var land_boundary_mask = ee.Image(0).toByte().paint(land_boundary, 1)
    .reproject(crs, crs_transform);
    
  var skel = skeletonize(land_boundary_mask, iterations, 2, crs, crs_transform);
  
  var blobs = skel
    .reproject(crs, crs_transform)
    .focal_min({radius:multiplier * 35, units:'meters'})
    .focal_max({radius:(iterations + 1) * multiplier * 30, units:'meters'})
    .reproject(crs, crs_transform)
  
  Map.addLayer(skel.mask(skel), {palette:'fec44f'}, 'skeleton', true);
  // Map.addLayer(skel.mask(skel.and(blobs.not())), {palette:'fec44f'}, 'skeleton', false);
  
  Map.addLayer(blobs.mask(blobs), {palette:'ffffff', opacity: 0.7}, 'blobs', false);
  
  var skel_no_blob = skel.where(blobs, 0)
  Map.addLayer(skel_no_blob.mask(skel_no_blob), {palette:'fec44f'}, 'skeleton (no blobs)', false);
  
  
  var junctions = findJunctions(skel, crs, crs_transform);
  Map.addLayer(junctions.mask(junctions).focal_max(2), {palette:'ff5050'}, 'junctions', true);
  
  // Compute distance transform, slope, aspect
  var units = 'meters'
  var step = methodScale
  var maxDistance = 2000
  var d = water.not().clip(land_boundary).distance(ee.Kernel.euclidean(maxDistance, "meters"))
  Map.addLayer(d, {min:0, max:maxDistance}, 'distance', false)
  
  function radians(img) { return img.toFloat().multiply(Math.PI).divide(180); }
  var radius = step*3;
  var sigma = step*0.5;
  
  var terrain = ee.Algorithms.Terrain(d);
  
  var k_dx = ee.Kernel.fixed(3, 3,
                         [[ 1/8,  0,  -1/8],
                          [ 2/8,  0,  -2/8],
                          [ 1/8,  0,  -1/8]]);
  
  var k_dy = ee.Kernel.fixed(3, 3,
                         [[ -1/8, -2/8,  -1/8],
                          [ 0,    0,    0],
                          [ 1/8, 2/8,   1/8]]);
  
  
  var dx = d.convolve(k_dx)
  var dy = d.convolve(k_dy)
  
  var slope = ee.Image().expression("sqrt((x*x + y*y)/(step*step))", {x: dx, y: dy, step: step}).atan()
    .reproject(crs, crs_transform).clip(bounds);
  
  Map.addLayer(slope.mask(slope.lt(Math.PI*0.243)), {palette:['ff0000','000000']}, 'slope', false)
  
  var aspect = dx.atan2(dy).add(Math.PI)
    .reproject(crs, crs_transform).clip(bounds);
  
  var colorsRainbow = [
  'F26C4F', // Light Red
  'F68E55', // Light Red Orange	
  'FBAF5C', // Light Yellow Orange
  'FFF467', // Light Yellow
  'ACD372', // Light Pea Green
  '7CC576', // Light Yellow Green
  '3BB878', // Light Green
  '1ABBB4', // Light Green Cyan
  '00BFF3', // Light Cyan
  '438CCA', // Light Cyan Blue
  '5574B9', // Light Blue
  '605CA8', // Light Blue Violet
  '855FA8', // Light Violet
  'A763A8', // Light Violet Magenta
  'F06EA9', // Light Magenta
  'F26D7D'  // Light Magenta Red
  ];
  Map.addLayer(aspect, {min:0, max:2*Math.PI, palette:colorsRainbow}, 'aspect', false)
  
}

detectTopology()