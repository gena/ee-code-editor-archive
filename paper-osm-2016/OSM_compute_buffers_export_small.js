var water_15 = ee.Image("users/gena/AU_Murray_Darling/MNDWI_15_water_WGS")

// OSM
var river_segments = ee.FeatureCollection('ft:1HbkaK1HfwdlaPB741WwUbltm-XN8aL-ro-UmwZYW')  // 0.02, ~2.2km
//var river_segments = ee.FeatureCollection('ft:1JVnpA09X5d6BVeb5nmRcYzW_YKKLeSRUMRGyG5M_') // 0.01, ~1.0km
river_segments = river_segments
  .filter(ee.Filter.inList('waterway', ['river', 'stream', 'drain', 'canal', 'drain', 'creek', 'ditch']))
var analysisName = 'OSM_vs_L8_'  

// Surface Hydrology AU
//var river_segments = ee.FeatureCollection('ft:1SzuPZQVQsio17Qf_yabvjZ_9f-9S9zG-6DJ10jC7')
//var analysisName = 'SH_vs_L8_'  

//river_segments = river_segments.filterBounds(Map.getBounds(true))
//analysisName = analysisName + 'test_'

// HAND
var fa = ee.Image("users/gena/AU_Murray_Darling/SRTM_30_Murray_Darling_flow_accumulation")
var hand = ee.ImageCollection('GME/layers/02769936315533645832-01676697048325678532').mosaic(); // HAND, M&D
//analysisName = 'OSM_vs_HAND'

function makeOrthogonalLine(points, length) {
  var pt1 = ee.List(ee.List(points).get(0))
  var pt2 = ee.List(ee.List(points).get(1))
  
  var x1 = ee.Number(pt1.get(0))
  var y1 = ee.Number(pt1.get(1))
  var x2 = ee.Number(pt2.get(0))
  var y2 = ee.Number(pt2.get(1))
  
  // c - hypothenuse, wx, wy - lengths of adjacent and opposite legs
  var wx = x1.subtract(x2).abs()
  var wy = y1.subtract(y2).abs()
  var c = wx.multiply(wx).add(wy.multiply(wy)).sqrt()
  
  var sin = x2.subtract(x1).divide(c)
  var cos = y2.subtract(y1).divide(c)
  
  var pt = ee.List(points.get(0))
  var ptx = ee.Number(pt.get(0))
  var pty = ee.Number(pt.get(1))
  
  var pt1x = ptx.subtract(cos.multiply(length).multiply(0.5));
  var pt1y = pty.add(sin.multiply(length).multiply(0.5));
  var pt2x = ptx.add(cos.multiply(length).multiply(0.5));
  var pt2y = pty.subtract(sin.multiply(length).multiply(0.5));
  
  return ee.Algorithms.GeometryConstructors.LineString(ee.List([pt1x, pt1y, pt2x, pt2y]))
}

function bufferButtCap(lineFeature, bufferSize) {
  bufferSize = ee.Number(bufferSize)
  var geom = ee.Feature(lineFeature).geometry();
  var buffer = geom.buffer(bufferSize);
  var coords = geom.coordinates()

  var lineLength = ee.Number(bufferSize).divide(ee.Projection('EPSG:4326').nominalScale()).multiply(3)

  var begin = makeOrthogonalLine(coords, lineLength)
  var end = makeOrthogonalLine(coords.slice(-2).reverse(), lineLength)
 
  var bufferSizeLine = bufferSize.multiply(0.01)
  var split = buffer.difference(begin.buffer(bufferSizeLine)).difference(end.buffer(bufferSizeLine))

  return ee.FeatureCollection(split.geometries()
        .map(function(o) {
          return ee.Feature(ee.Geometry(o), {'length': geom.intersection(o).length()})
        })).sort('length', false).first();
}

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
  
  for(var i=0; i<iterations; i++) {
    for(var j=0; j<4; j++) { // rotate kernels
      result = result.subtract(hitOrMiss(result, se11, se12, crs, crs_transform));
      se11 = se11.rotate(1);
      se12 = se12.rotate(1);
  
      result = result.subtract(hitOrMiss(result, se21, se22, crs, crs_transform));
      se21 = se21.rotate(1);
      se22 = se22.rotate(1);
    }
  }
  
  return result;
}

var water_mask_15 = water_15.expression('r+g+b', {r:water_15.select(0), g:water_15.select(1), b:water_15.select(2)}).gt(0)

function smoothImage(image) {
  image = image
    //.focal_max({radius: 5, units: 'meters'})
    //.focal_mode({radius: 25, units: 'meters', iterations: 10})
    //.focal_min({radius: 5, units: 'meters'})
    .focal_max({radius: 14, units: 'meters'})
    .focal_mode({radius: 30, units: 'meters', iterations: 5})
    .focal_min({radius: 14, units: 'meters'})

    //.reproject(crs, crsTransformSetStep(0.15 * crs_transform[0], crs_transform))

  return image;
}

function getValidDemWater(opt_useFlowAccumulation) {
  var useFlowAccumulation = opt_useFlowAccumulation || false;
  
  // remove hand outside of handBuffer area around minHand
  var handWater = hand.lt(1);
  
  // limit HAND to only high values, drainage network created around low hand values has errors
  var handBuffer = 300
  var handConfidence = 20; // m
  
/*
  if(useFlowAccumulation) {
    handBuffer = 400
    handConfidence = 10
  }
*/

  var validHandMask = hand.gte(handConfidence).focal_max({radius: handBuffer, units: 'meters'})
  
  validHandMask = validHandMask
  .not()
  //.focal_min({radius: 0.5 * handBuffer, units: 'meters'})
  .focal_mode({radius: 0.5 * handBuffer, units:'meters', iterations:5})
  .focal_max({radius: 0.5 * handBuffer, units: 'meters'})
  .not()

  // take water only with the high confidence
  hand = hand.mask(validHandMask)
  handWater = hand.lt(1);

  if(useFlowAccumulation) {
    var minFlowAccumulation = 10000
    handWater = handWater.updateMask(handWater.mask().or(fa.gt(minFlowAccumulation)))
  }

  return handWater
}

var dem = ee.Image('USGS/SRTMGL1_003');
var info = dem.getInfo()
var crs = info.bands[0].crs
var crs_transform = info.bands[0].crs_transform
crs_transform = [crs_transform[0], crs_transform[1], 0.0, crs_transform[3], crs_transform[4], 0.0];
  
//var scaleFactor = 6; // 5m
//var scaleFactor = 3; // 10m
var scaleFactor = 2; // 15m
//var scaleFactor = 1;
//crs_transform = crsTransformSetStep(crs_transform[0] / scaleFactor, crs_transform)

var smoothedWater = true;

if(smoothedWater) {
  var smooth = smoothImage(water_mask_15).reproject(crs, crs_transform)
                .focal_max({radius: 30, units: 'meters'})
                .focal_min({radius: 15, units: 'meters'})
                .or(water_mask_15); // add a single pixel
  
  var smooth_skel = skeletonize(smooth, 15, 2).reproject(crs, crs_transform);
  
  var skel = smooth_skel;
} else {
  //var skel = skeletonize(water_mask_15, 20, 2).reproject(crs, crs_transform);
  var skel = skeletonize(water_mask_15, 10, 2).reproject(crs, crs_transform);
}

//var skel = water_mask_15

var au_catchments_level3 = ee.FeatureCollection('ft:1778IyIZLZKSKVgko9X3aIV94E7jcm28uniyD6ycp')
var aoi = au_catchments_level3
    .filter(ee.Filter.eq('HYBAS_ID', 5030073410));
var aoiRegion = aoi.geometry(1).bounds(1).coordinates().getInfo()[0];


function show() {
  Map.addLayer(water_mask_15.mask(water_mask_15), {palette:['a0a0c0']}, 'water')
  if(smoothedWater) {
    Map.addLayer(smooth.mask(smooth), {palette:['a0a0c0']}, 'water (smooth)')
  }
  Map.addLayer(skel.mask(skel), {palette:['000000']}, 'skel')
  
  Map.addLayer(river_segments, {palette:['ff0000']}, 'river segments')

  var dem_water = getValidDemWater(false)
  Map.addLayer(dem_water.mask(dem_water), {palette:['0000ff']}, 'water (DEM)')
}

show();

// OSM
function performBufferOverlayAnalysis(analyzeDrainageNetwork, useFlowAccumulation) {
  var analysisScale = 30
  var minPixelCount = 5

  //var buffers = [30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150]
  var buffers = [30, 40, 50, 60, 70, 80, 90, 100]
  //var buffers = [110, 120, 130, 140, 150]
  var bufferNames = []
  var bufferMaxSize = 100
  
  for(var i = 0; i < buffers.length; i++) {
    bufferNames.push('' + buffers[i])
  }

  if(analyzeDrainageNetwork) {
    var riverRaster = getValidDemWater(useFlowAccumulation);
  } else {
    var riverRaster = skel;
  }

  function computeBufferScores(f) {
      // compute max
      var bufferMax = bufferButtCap(f, bufferMaxSize)
      
      var result = riverRaster.mask(riverRaster).reduceRegion(ee.Reducer.count(), bufferMax.geometry(), analysisScale)
      var max = ee.Number(result.get(result.keys().get(0)));

      // for every clipped feature compute intersection with water for a number of buffers
      var countPrev = ee.Number(0.0)
      
      if(useFlowAccumulation) {
        minPixelCount = f.length(30).divide(30).multiply(0.5)
      }
      
      var compute = max.gt(minPixelCount);
      
      f = f.set('L', f.length(1e-3));
      
      //print('greater')
      var distance = ee.Number(-1);
      var score_th = 0.85;
      for(var i = 0; i < buffers.length; i++) {
        var buffer = ee.Algorithms.If(compute, bufferButtCap(f, buffers[i]).geometry(), null)
        var result = ee.Dictionary(ee.Algorithms.If(compute, riverRaster.mask(riverRaster).reduceRegion(ee.Reducer.count(), buffer, analysisScale), {'c':0}))
        var count = ee.Number(ee.Algorithms.If(compute, ee.Number(result.get(result.keys().get(0))), 0.0));
        //var countDiff = count.subtract(countPrev);
        
        var score = ee.Algorithms.If(max.gt(minPixelCount), count.divide(max), ee.Number(0))

        f = f.set('N_' + bufferNames[i], count);
        //f = f.set('D_' + bufferNames[i], countDiff);
        f = f.set('S_' + bufferNames[i], score);
        
        distance = ee.Number(ee.Algorithms.If(distance.eq(-1), 
          ee.Algorithms.If(ee.Number(score).gt(score_th), buffers[i], distance),
          distance))

        countPrev = count;
      }
      
      f = f.set('distance', distance)

      return f;
  }

    //print(computeBufferScores(ee.Feature(river_segments.first())))

/*      var river_with_buffers = ee.FeatureCollection(river_segments.toList(10, 0))
        .map(computeBufferScores)

      print(river_with_buffers)
      
      var fileName = 'OSM_AU_river_buffers_i20_smooth10_and_single_pixel';
      Export.table(river_with_buffers, fileName,
        { fileFormat: 'GeoJSON', driveFileNamePrefix: fileName})
*/
    for(var i = 0; i < 21; i++) { 
      var river_with_buffers = ee.FeatureCollection(river_segments.toList(5000, i*5000))
        .map(computeBufferScores)
      
      var fileName = analysisName + i;
      Export.table(river_with_buffers, fileName,
        { fileFormat: 'GeoJSON', driveFileNamePrefix: fileName})
    }

}

var analyzeDrainageNetwork = false
var useFlowAccumulation = false

performBufferOverlayAnalysis(analyzeDrainageNetwork, useFlowAccumulation)

//Map.centerObject(river_segments)