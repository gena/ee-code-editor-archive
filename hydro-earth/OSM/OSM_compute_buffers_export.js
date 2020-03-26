var water_15 = ee.Image("users/gena/AU_Murray_Darling/MNDWI_15_water_WGS")
var fa = ee.Image("users/gena/AU_Murray_Darling/SRTM_30_Murray_Darling_flow_accumulation")
var hand = ee.ImageCollection('GME/layers/02769936315533645832-01676697048325678532').mosaic(); // HAND, M&D

// OSM
/*
var river_segments = ee.FeatureCollection('ft:1HbkaK1HfwdlaPB741WwUbltm-XN8aL-ro-UmwZYW')
river_segments = river_segments
  .filter(ee.Filter.inList('waterway', ['river', 'stream', 'drain', 'canal', 'drain', 'creek', 'ditch']))
*/

// Surface Hydrology AU
var river_segments = ee.FeatureCollection('ft:1SzuPZQVQsio17Qf_yabvjZ_9f-9S9zG-6DJ10jC7')


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

//var skel = skeletonize(water_mask_15, 15, 2)

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

var dem = ee.Image('USGS/SRTMGL1_003');
var info = dem.getInfo()
var crs = info.bands[0].crs
var crs_transform = info.bands[0].crs_transform
crs_transform = [crs_transform[0], crs_transform[1], 0.0, crs_transform[3], crs_transform[4], 0.0];
  
//var scaleFactor = 6; // 5m
//var scaleFactor = 3; // 10m
var scaleFactor = 2; // 15m
//crs_transform = crsTransformSetStep(crs_transform[0] / scaleFactor, crs_transform)
  
var smooth = smoothImage(water_mask_15).reproject(crs, crs_transform)
              .focal_max({radius: 30, units: 'meters'}).or(water_mask_15); // add single pixels

var smooth_skel = skeletonize(smooth, 20, 2).reproject(crs, crs_transform);

var skel = smooth_skel;

var au_catchments_level3 = ee.FeatureCollection('ft:1778IyIZLZKSKVgko9X3aIV94E7jcm28uniyD6ycp')
var aoi = au_catchments_level3
    .filter(ee.Filter.eq('HYBAS_ID', 5030073410));
var aoiRegion = aoi.geometry(1).bounds(1).coordinates().getInfo()[0];

function exportSkeleton() {
  var name = 'AU_water_skeleton'

  Export.image(skel, name, 
  { 
    driveFileNamePrefix: name, 
    crs: crs, 
    crs_transform: JSON.stringify(crs_transform), 
    region: aoiRegion,
    maxPixels:1e12
  });
}

exportSkeleton();

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

// variance of HAND within buffer
var topo_par = river_segments.map(function(f) {
  var bufferMax = 150
  var buffer = f.buffer(bufferMax).geometry()
  var res1 = hand.reduceRegion(ee.Reducer.stdDev(), buffer, 30)
  var res2 = fa.reduceRegion(ee.Reducer.stdDev(), buffer, 30)
  res2 = ee.Number(res2.get(res2.keys().get(0)))
  return f
    .set('hand_stddev', res1.get(res1.keys().get(0)))
    .set('fa_stddev', ee.Algorithms.If(ee.Algorithms.IsEqual(res2, null), 0, res2.min(5000).divide(50)))
})

var topo_segments = topo_par.filter(ee.Filter.or(ee.Filter.gte('hand_stddev', 15), ee.Filter.gte('fa_stddev', 50)))
//river_segments = topo_segments

//Map.addLayer(rivers_segments, {color:'ff0000'}, 'river segments, hilly area')

function show() {
  Map.addLayer(water_mask_15.mask(water_mask_15), {palette:['a0a0c0']}, 'water')
  Map.addLayer(smooth.mask(smooth), {palette:['a0a0c0']}, 'water (smooth)')
  Map.addLayer(skel.mask(skel), {palette:['000000']}, 'skel')
  
  Map.addLayer(river_segments, {palette:['ff0000']}, 'river segments')

  var faWater = getValidDemWater(true)
  Map.addLayer(faWater.mask(faWater), {palette:['0000ff']}, 'water (flow accumulation)')
  
  Map.addLayer(topo_par, {}, 'topo_par', false)

  Map.addLayer(ee.Image(0).mask(0).toByte()
                .paint(topo_par, 'hand_stddev', 2), {min:1, max:15, palette:['000000', 'ffffff']}, 'hand_stddev');

  Map.addLayer(ee.Image(0).mask(0).toByte()
                .paint(topo_par, 'fa_stddev', 2), {min:0, max:100, palette:['000000', 'ffffff']}, 'fa_stddev');

  Map.addLayer(ee.Image(0).mask(0).toByte()
                .paint(topo_segments), {palette:['00ff00']}, 'valid segments');
}

show();

// OSM
function performBufferOverlayAnalysis(analyzeDrainageNetwork, useFlowAccumulation) {
  var analysisScale = 30
  var minPixelCount = 5

  var buffers = [30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150]
  var bufferNames = []
  var bufferMax = 150
  
  for(var i = 0; i < buffers.length; i++) {
    bufferNames.push('water_buffer_' + buffers[i])
  }

  if(analyzeDrainageNetwork) {
    var riverRaster = getValidDemWater(useFlowAccumulation);
  } else {
    var riverRaster = skel;
  }

  function computeBufferScores(f) {
      // compute max
      var result = riverRaster.mask(riverRaster).reduceRegion(ee.Reducer.count(), f.buffer(bufferMax).geometry(), analysisScale)
      var max = ee.Number(result.get(result.keys().get(0)));

      // for every clipped feature compute intersection with water for a number of buffers
      var countPrev = ee.Number(0.0)
      
      if(useFlowAccumulation) {
        minPixelCount = f.length(30).divide(30).multiply(0.5)
      }
      
      var compute = max.gt(minPixelCount);
      
      //print('greater')
      var distance = ee.Number(-1);
      var score_th = 0.85;
      for(var i = 0; i < buffers.length; i++) {
        var buffer = ee.Algorithms.If(compute, f.buffer(buffers[i]).geometry(), null)
        var result = ee.Dictionary(ee.Algorithms.If(compute, riverRaster.mask(riverRaster).reduceRegion(ee.Reducer.count(), buffer, analysisScale), {'c':0}))
        var count = ee.Number(ee.Algorithms.If(compute, ee.Number(result.get(result.keys().get(0))), 0.0));
        //var countDiff = count.subtract(countPrev);
        var score = ee.Algorithms.If(count.gte(ee.Number(minPixelCount).divide(analysisScale)), count.divide(max), ee.Number(0))

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

  print(computeBufferScores(ee.Feature(river_segments.first())))


  //var river_with_buffers = ee.FeatureCollection(rivers_segments.toList(1000, 0))
  //  .map(computeBufferScores)

  //print(river_with_buffers.filter(ee.Filter.neq('N_water_buffer_150', 0)).first())

  //var river_with_buffers = ee.FeatureCollection(rivers_segments)
  //    .map(computeBufferScores)
    
  //  var fileName = 'OSM_AU_river_buffers';
  //  Export.table(river_with_buffers, fileName,
  //    { fileFormat: 'GeoJSON', driveFileNamePrefix: fileName})
 
  if(!analyzeDrainageNetwork) {
    for(var i = 0; i < 7; i++) { 
      var river_with_buffers = ee.FeatureCollection(river_segments.toList(5000, i*5000))
        .map(computeBufferScores)
      
      var fileName = 'OSM_AU_river_buffers_i20_smooth10_and_single_pixel' + i;
      Export.table(river_with_buffers, fileName,
        { fileFormat: 'GeoJSON', driveFileNamePrefix: fileName})
    }
  } else {
    for(var i = 0; i < 7; i++) { 
      var river_with_buffers = ee.FeatureCollection(rivers_segments.toList(5000, i*5000))
        .map(computeBufferScores)
      
      var fileName = 'OSM_AU_river_buffers_fa_' + i;
      Export.table(river_with_buffers, fileName,
        { fileFormat: 'GeoJSON', driveFileNamePrefix: fileName})
    }
  }
}

var analyzeDrainageNetwork = false
var useFlowAccumulation = false

performBufferOverlayAnalysis(analyzeDrainageNetwork, useFlowAccumulation)

//Map.centerObject(river_segments)