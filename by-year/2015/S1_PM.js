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

function db(image) {
  var bands = image.select("..").bandNames();
  var bias = ee.Image.constant(bands.map(function(pol) {
    return image.get(ee.String(pol).cat('_log_bias'))
  }))
  var gains = ee.Image.constant(bands.map(function(pol) {
    return image.get(ee.String(pol).cat('_log_gain'))
  }))
  var toDecibels = image.addBands(image.select(bands).subtract(bias).divide(gains).float(), null, true);
  return toDecibels.addBands(image.select('angle').resample('bicubic'), null, true);
}

var collection = ee.ImageCollection('COPERNICUS/S1_GRD_INT').filterMetadata('instrumentMode', 'equals', 'IW').
filter(ee.Filter.eq('transmitterReceiverPolarisation', 'VV')).select(['VV', 'angle']);
collection = collection.map(db);


var p1 = collection.select(0).filterDate('2015-02-01', '2015-03-31').mean();
var p2 = collection.select(0).filterDate('2015-04-01', '2015-05-31').mean();
var p3 = collection.select(0).filterDate('2015-06-01', '2015-07-31').mean();

var K = 0.4
var iterations = 15
var p1pm = pmf(p1, iterations, K)
var p2pm = pmf(p2, iterations, K)
var p3pm = pmf(p3, iterations, K)

Map.addLayer(p1, {min:-20, max:-2}, 'VV', false);

Map.addLayer(p1pm, {min:-20, max:-2}, 'VV PM', false);

var rgb = p1.addBands(p2).addBands(p3).visualize({min:-20, max:-2})
Map.addLayer(rgb, {}, 'VV multi');
print(Map.getCenter())
Map.setCenter(5.82, 52.58, 13);

var rgbpm = p1pm.addBands(p2pm).addBands(p3pm).visualize({min:-20, max:-2})
Map.addLayer(rgbpm, {}, 'VV multi PM');

var hsv = rgb.unitScale(0, 255).rgbToHsv()
var intensity = hsv.select('value')
var saturation = hsv.select('value')
var hue = hsv.select('hue')
Map.addLayer(intensity, {}, 'intensity', false)
Map.addLayer(hue, {}, 'hue', false)
Map.addLayer(saturation, {}, 'saturation', false)

var canny = ee.Algorithms.CannyEdgeDetector(p1.add(p2).add(p3), 0.999, 3)
Map.addLayer(canny.mask(canny), {palette:['ff0000']}, 'edges');
