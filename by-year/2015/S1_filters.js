// GammaMap Speckle Filter conform

function toDB(image) { return image.log10().multiply(10.0); }

function GammaMap(image, enl, ksize) {
  // Cf. https://github.com/senbox-org/s1tbx/blob/master/s1tbx-op-sar-processing/src/main/java/org/esa/s1tbx/sar/gpf/filtering/SpeckleFilters/GammaMap.java
  // which implements Lopes et al, IGARSS 1990, 2409-2412.
  // See: https://www.researchgate.net/publication/224270891_Maximum_A_Posteriori_Speckle_Filtering_And_First_Order_Texture_Models_In_Sar_Images.
  // This is the equivalent of the getGammaMapValue() method
  
  // Convert image from dB to natural values
  var nat_img = ee.Image(10.0).pow(image.divide(10.0));

  // Square kernel, ksize should be odd (typically 3, 5 or 7)
  var weights = ee.List.repeat(ee.List.repeat(1,ksize),ksize);
  
  // ~~(ksize/2) does integer division in JavaScript
  var kernel = ee.Kernel.fixed(ksize,ksize, weights, ~~(ksize/2), ~~(ksize/2), false);

  // Get mean and variance
  var mean = nat_img.reduceNeighborhood(ee.Reducer.mean(), kernel);
  var variance = nat_img.reduceNeighborhood(ee.Reducer.variance(), kernel);

  // "Pure speckle" threshold
  var ci = variance.sqrt().divide(mean);  // square root of inverse of enl

  // If ci <= cu, the kernel lies in a "pure speckle" area -> return simple mean
  var cu = 1.0/Math.sqrt(enl)
  
  // If cu < ci < cmax the kernel lies in the low textured speckle area -> return the filtered value
  var cmax = Math.sqrt(2.0) * cu

  var alpha = ee.Image(1.0 + cu*cu).divide(ci.multiply(ci).subtract(cu*cu));
  var b = alpha.subtract(enl + 1.0)
  var d = mean.multiply(mean).multiply(b).multiply(b).add(alpha.multiply(mean).multiply(nat_img).multiply(4.0*enl));
  var f = b.multiply(mean).add(d.sqrt()).divide(alpha.multiply(2.0));
  
  // If ci > cmax do not filter at all (i.e. we don't do anything, other then masking)
  
  // Compose a 3 band image with the mean filtered "pure speckle", the "low textured" filtered and the unfiltered portions
  return toDB(mean.updateMask(ci.lte(cu))).addBands(toDB(f.updateMask(ci.gt(cu)).updateMask(ci.lt(cmax)))).addBands(image.updateMask(ci.gte(cmax)));
}

// Perona-Malik anisotropic diffusion filter.
// I(n+1, i, j) = I(n, i, j) + lambda * (cN * dN(I) + cS * dS(I) + cE * dE(I), cW * dW(I))
var pmf = function(I, iter, K, opt_method) {
  var method = opt_method || 1;
  
  var dxW = ee.Kernel.fixed(3, 3,
                           [[ 0,  0,  0],
                            [ 1, -1,  0],
                            [ 0,  0,  0]]);
  
  var dxE = ee.Kernel.fixed(3, 3,
                           [[ 0,  0,  0],
                            [ 0, -1,  1],
                            [ 0,  0,  0]]);
  
  var dyN = ee.Kernel.fixed(3, 3,
                           [[ 0,  1,  0],
                            [ 0, -1,  0],
                            [ 0,  0,  0]]);
  
  var dyS = ee.Kernel.fixed(3, 3,
                           [[ 0,  0,  0],
                            [ 0, -1,  0],
                            [ 0,  1,  0]]);

  var lambda = 0.2;

  var k1 = ee.Image(-1.0/K);
  var k2 = ee.Image(K).multiply(ee.Image(K));

  for(var i = 0; i < iter; i++) {
    var dI_W = I.convolve(dxW)
    var dI_E = I.convolve(dxE)
    var dI_N = I.convolve(dyN)
    var dI_S = I.convolve(dyS)

    switch(method) {
      case 1:
        var cW = dI_W.multiply(dI_W).multiply(k1).exp();
        var cE = dI_E.multiply(dI_E).multiply(k1).exp();
        var cN = dI_N.multiply(dI_N).multiply(k1).exp();
        var cS = dI_S.multiply(dI_S).multiply(k1).exp();
    
        I = I.add(ee.Image(lambda).multiply(cN.multiply(dI_N).add(cS.multiply(dI_S)).add(cE.multiply(dI_E)).add(cW.multiply(dI_W))))
        break;
      case 2:
        var cW = ee.Image(1.0).divide(ee.Image(1.0).add(dI_W.multiply(dI_W).divide(k2)));
        var cE = ee.Image(1.0).divide(ee.Image(1.0).add(dI_E.multiply(dI_E).divide(k2)));
        var cN = ee.Image(1.0).divide(ee.Image(1.0).add(dI_N.multiply(dI_N).divide(k2)));
        var cS = ee.Image(1.0).divide(ee.Image(1.0).add(dI_S.multiply(dI_S).divide(k2)));
    
        I = I.add(ee.Image(lambda).multiply(cN.multiply(dI_N).add(cS.multiply(dI_S)).add(cE.multiply(dI_E)).add(cW.multiply(dI_W))))
        break;
    }
  }

  return I;
}

var caslav = ee.Geometry.Point(15.39597, 49.90934); // Center around the CZ city of Caslav

var collection = ee.ImageCollection('COPERNICUS/S1_GRD').filterMetadata('instrumentMode', 'equals', 'IW').
filter(ee.Filter.eq('transmitterReceiverPolarisation', 'VV')).select(['VV', 'angle']).filterBounds(caslav);

// Get some selections for a nice time stack
var img1 = ee.Image(collection.select(0).filterDate('2015-04-01', '2015-04-30').first());
var img2 = ee.Image(collection.select(0).filterDate('2015-05-01', '2015-05-31').first());
var img3 = ee.Image(collection.select(0).filterDate('2015-06-01', '2015-06-30').first());

Map.centerObject(caslav, 12);  // Zoom level 14 gets the 10m pixel spacing. Note how speckle filtering "blurs" lower resolution layers.

// GMAP filter each of the selected images. 
// ENL = 4.9 for IW GRD Full Resolution with 10x10 m spacing
// See: https://sentinel.esa.int/web/sentinel/user-guides/sentinel-1-sar/resolutions/level-1-ground-range-detected

var gmap1 = GammaMap(img1, 5, 7);
var gmap2 = GammaMap(img2, 5, 7);
var gmap3 = GammaMap(img3, 5, 7);

// Here are some example visualizations:
// Display partial filtering results separately
Map.addLayer(gmap1.select(0), {min:-25, max:0}, 'Mean Filtered', false);
Map.addLayer(gmap1.select(1), {min:-25, max:0}, 'GMAP Filtered', false);
Map.addLayer(gmap1.select(2), {min:-25, max:0}, 'Unfiltered', false);
// And assembled into one image:
Map.addLayer(gmap1.reduce(ee.Reducer.sum()), {min:-25, max:0}, 'Composed', false);

// Show the time stack as a composition
Map.addLayer(img1.select(0).addBands(img2.select(0)).addBands(img3.select(0)), {min:-25, max:0}, 'Original time series', true);
// idem, for GMAP filtered version 
Map.addLayer(gmap1.reduce(ee.Reducer.sum()).addBands(gmap2.reduce(ee.Reducer.sum())).addBands(gmap3.reduce(ee.Reducer.sum())), {min:-25, max:0}, 'GMAP filtered time series', true);
// Van Gogh would have loved this!

var K = 3.5
var iterations = 10
var method = 1

Map.addLayer(pmf(img1.select(0).addBands(img2.select(0)).addBands(img3.select(0)), iterations, K, method), {min:-25, max:0}, 'Perona-Malik filtered time series', true);
