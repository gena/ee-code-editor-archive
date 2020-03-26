/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var s2 = ee.ImageCollection("COPERNICUS/S2"),
    geometry = /* color: d63000 */ee.Geometry.MultiPoint();
/***** End of imports. If edited, may not auto-convert in the playground. *****/
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

var skeletonize = function(image, iterations, crs, crs_transform) {
  if (typeof crs === 'undefined') { crs = null; }

  var se1w = [[2, 2, 2], 
              [0, 1, 0], 
              [0, 1, 0]];

  var se11 = ee.Kernel.fixed(3, 3, splitKernel(se1w, 1));
  var se12 = ee.Kernel.fixed(3, 3, splitKernel(se1w, 2));
  
  var se2w = [[2, 2, 0], 
              [2, 1, 1], 
              [0, 1, 1]];

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

// ==================================================================

var image = ee.Image(s2
  .filterBounds(Map.getBounds(true))
  .first())
  

Map.addLayer(image.select(['B11','B8','B3']), {min:500, max:5000}, 's2')

var water = image.normalizedDifference(['B3', 'B11']).gt(0)
Map.addLayer(water.mask(water), {palette:['0000ff'], opacity: 0.5}, 'water')

var info = image.select('B3').getInfo();
var crs = info.bands[0].crs;
var crs_transform = info.bands[0].crs_transform;

var skel = skeletonize(water, 20, crs, crs_transform);
Map.addLayer(skel.mask(skel), {palette:'fec44f', opacity: 0.7}, 'skeleton');

var water = water.focal_mode(15, 'square', 'meters', 3).reproject(crs, crs_transform)
Map.addLayer(water.mask(water), {palette:['0000ff'], opacity: 0.5}, 'water (smooth)')

var skel = skeletonize(water, 20, crs, crs_transform);
Map.addLayer(skel.mask(skel), {palette:'ff0000', opacity: 0.7}, 'skeleton (smooth)');
