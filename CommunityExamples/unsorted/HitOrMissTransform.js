/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var pt1 = /* color: #d63000 */ee.Geometry.Point([-93.33479573937996, 30.04755049279832]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
/***
 * Hit-or-miss transform (http://en.wikipedia.org/wiki/Hit-or-miss_transform)
 * 
 * HoM = erode(A, SE1).and(erode(not(A), SE2)
 * 
 * @author Gennadii Donchyts (gennadiy.donchyts@gmail.com)
 * 
 */

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
  
  if (crs !== null) {
    result = image.reproject(crs, crs_transform);
  }

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

// get L8 image
print(ee.Geometry(Map.getBounds(true)).centroid(1e-3))

Map.setCenter(148.82, -34.96, 13)
//Map.centerObject(pt1, 13)

var images = ee.ImageCollection('LANDSAT/LC8_L1T_TOA')
      .filterBounds(Map.getCenter())
      .filterMetadata('CLOUD_COVER', 'less_than', 1);

var image = ee.Image(images.toList(30, 0).get(13));

print(image)
var info = image.getInfo();

var crs = info.bands[0].crs;
var crs_transform = info.bands[0].crs_transform;

Map.addLayer(image.select('B7', 'B5', 'B2'), {gamma:1.2}, info.id)
Map.addLayer(image.select('B8'), {gamma:2.0}, info.id + ' pan', false)

// compute water mask
var ndwi = image.normalizedDifference(['B5', 'B3'])
Map.addLayer(ndwi, {min:-0.5, max:0.5, color:'000044'}, 'ndwi', false)

var threshold = 0.0;
var water = ndwi.lt(threshold);
Map.addLayer(water.mask(water), {palette:['ffffff', '000099'], opacity:0.7}, 'water')

water = water.clip(Map.getBounds(true))

var skel = skeletonize(water, 20, 2, crs, crs_transform);
Map.addLayer(skel.mask(skel), {palette:'fec44f', opacity: 0.7}, 'skeleton', true);
