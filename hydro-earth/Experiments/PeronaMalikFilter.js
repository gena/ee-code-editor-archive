// Perona-Malik filter
// see http://image.diku.dk/imagecanon/material/PeronaMalik1990.pdf

// Map.setCenter(148.95, -35.25, 13)

var image = ee.Image(ee.ImageCollection('LANDSAT/LC8_L1T_TOA')
      .filterBounds(Map.getBounds(true))
      .filterMetadata('CLOUD_COVER', 'less_than', 1).first());

print(image)

// add RGB
Map.addLayer(image.select('B4', 'B3', 'B2'), {gamma:1.5, min:0.05, max:0.4}, ' RGB', false)

// add HSV pan-sharpened
var rgb = image.select('B4', 'B3', 'B2');
var pan = image.select('B8');
var hsv  = rgb.rgbtohsv();
var huesat = hsv.select('hue', 'saturation');
var intensity = pan.add(hsv.select('value').multiply(0.5));
var upres = ee.Image.cat(huesat, intensity).hsvtorgb();
Map.addLayer(upres, {gamma:1.5, min:[0.05,0.05,0.05], max:[0.4,0.4,0.6]}, 'RGB (HSV)', false)


// I(n+1, i, j) = I(n, i, j) + lambda * (cN * dN(I) + cS * dS(I) + cE * dE(I), cW * dW(I))
var peronaMalikFilter = function(I, iter, K, method) {
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

Map.addLayer(peronaMalikFilter(upres, 15, 0.001, 1), {gamma:1.5, min:[0.05,0.05,0.05], max:[0.4,0.4,0.6]}, 'RGB (HSV, Perona-Malik)')

var mndwi = image.normalizedDifference(['B6', 'B3']);
Map.addLayer(mndwi, {gamma:1.5, min:-0.5, max:0.5}, 'MNDWI')

var mndwiFiltered = peronaMalikFilter(mndwi, 35, 0.02, 2);
Map.addLayer(mndwiFiltered, {gamma:1.5, min:-0.5, max:0.5}, 'MNDWI (Perona-Malik)')

var cannyOriginal = ee.Algorithms.CannyEdgeDetector(mndwi, 0.25, 1);
Map.addLayer(cannyOriginal.mask(cannyOriginal).focal_max({radius:15, units:'meters'}), {min:0, max:0.4, palette: ['220000', 'FF0000']}, 'Canny (MNDWI)')

var cannyFiltered = ee.Algorithms.CannyEdgeDetector(mndwiFiltered, 0.25, 1);
Map.addLayer(cannyFiltered.mask(cannyFiltered).focal_max({radius:15, units:'meters'}), {min:0, max:0.4, palette: ['220000', 'FF0000']}, 'Canny (MNDWI (Perona-Malik))');

