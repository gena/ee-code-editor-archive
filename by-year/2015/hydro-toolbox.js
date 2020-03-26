// hydrological functions

Map.setCenter(148.97, -35.25, 13)

var azimuth = 90;
var zenith = 60;

function degrees(img) { return img.toFloat().multiply(180).divide(Math.PI); }

function radians(img) { return img.toFloat().multiply(Math.PI).divide(180); }

// DEM Hillshade function - Compute hillshade for the given illumination az, el.
function hillshade(az, ze, slope, aspect) {
  var azimuth = radians(ee.Image(az));
  var zenith = radians(ee.Image(ze));
  return azimuth.subtract(aspect).cos().multiply(slope.sin()).multiply(zenith.sin())
      .add(zenith.cos().multiply(slope.cos()));
}

function hillshadeit(image, elevation, weight) {
  var hsv  = image.unitScale(0, 255).rgbtohsv();

  var terrain = ee.call('Terrain', elevation);
  var slope = radians(terrain.select(['slope']));
  var aspect = radians(terrain.select(['aspect']));
  var hs = hillshade(azimuth, zenith, slope, aspect);

  var intensity = hs.multiply(weight).multiply(hsv.select('value'));
  var huesat = hsv.select('hue', 'saturation');
  
  return ee.Image.cat(huesat, intensity).hsvtorgb();
}

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

  if(method == 1) {
    var k1 = ee.Image(-1.0/K);

    for(var i = 0; i < iter; i++) {
      var dI_W = I.convolve(dxW)
      var dI_E = I.convolve(dxE)
      var dI_N = I.convolve(dyN)
      var dI_S = I.convolve(dyS)
      
      var cW = dI_W.multiply(dI_W).multiply(k1).exp();
      var cE = dI_E.multiply(dI_E).multiply(k1).exp();
      var cN = dI_N.multiply(dI_N).multiply(k1).exp();
      var cS = dI_S.multiply(dI_S).multiply(k1).exp();
  
      I = I.add(ee.Image(lambda).multiply(cN.multiply(dI_N).add(cS.multiply(dI_S)).add(cE.multiply(dI_E)).add(cW.multiply(dI_W))))
    }
  }
  else if(method == 2) {
    var k2 = ee.Image(K).multiply(ee.Image(K));

    for(var i = 0; i < iter; i++) {
      var dI_W = I.convolve(dxW)
      var dI_E = I.convolve(dxE)
      var dI_N = I.convolve(dyN)
      var dI_S = I.convolve(dyS)
      
      var cW = ee.Image(1.0).divide(ee.Image(1.0).add(dI_W.multiply(dI_W).divide(k2)));
      var cE = ee.Image(1.0).divide(ee.Image(1.0).add(dI_E.multiply(dI_E).divide(k2)));
      var cN = ee.Image(1.0).divide(ee.Image(1.0).add(dI_N.multiply(dI_N).divide(k2)));
      var cS = ee.Image(1.0).divide(ee.Image(1.0).add(dI_S.multiply(dI_S).divide(k2)));
  
      I = I.add(ee.Image(lambda).multiply(cN.multiply(dI_N).add(cS.multiply(dI_S)).add(cE.multiply(dI_E)).add(cW.multiply(dI_W))))
    }
  }
  
  return I;
}



// =========== dem
//var dem = ee.Image('USGS/SRTMGL1_003');
//var dem = ee.Image('USGS/NED');
//var dem = ee.Image('srtm90_v4');
//var dem = ee.Image('NOAA/NGDC/ETOPO1').select('bedrock');
var dem = ee.Image('WWF/HydroSHEDS/03CONDEM');


var multiplier = 50.0;
var dem = peronaMalikFilter(dem.multiply(1/multiplier), 20, 0.01, 2).multiply(multiplier)


var etopo = ee.Image('NOAA/NGDC/ETOPO1').select('bedrock');

var dem_min = -20;
var dem_max = 500;

var water_min = -5000;
var sea_level = 0;

var colors_dem = ['006837', '1a9850', '66bd63', 'a6d96a', 'd9ef8b', 'ffffbf', 'fee08b', 'fdae61', 'f46d43', 'd73027', 'a50026', 'ffffff']
var colors_water = ['023858', '045a8d', '0570b0', '3690c0', '74a9cf', 'a6bddb'/*, 'd0d1e6', 'ece7f2', 'fff7fb'*/];

// ===========  add ETOPO1 where we don't have SRTM
var v = etopo.mask(etopo.gt(sea_level)).visualize({palette:colors_dem, min:dem_min, max:dem_max, opacity: 1.0});
Map.addLayer(hillshadeit(v, etopo, 2.0), {}, 'elevation (rest)', false);

// =========== add DEM on top
var v = dem.mask(dem.gt(sea_level)).visualize({palette:colors_dem, min:dem_min, max:dem_max, opacity: 1.0});
Map.addLayer(hillshadeit(v, dem, 2.0), {}, 'elevation');

// =========== add bathymetry
var bathymetry = ee.Image('NOAA/NGDC/ETOPO1').select('bedrock');
v = bathymetry.mask(bathymetry.lt(sea_level)).visualize({palette:colors_water, min:water_min, max:sea_level, opacity: 1.0});
Map.addLayer(hillshadeit(v, bathymetry, 1.2), {}, 'bathymetry', false);

// =========== show aspects

// add smoothing
var radius = 90;
var sigma = 60;
var gaussianKernel = ee.Kernel.gaussian(radius, sigma, 'meters', true, 1);
var dem = dem.convolve(gaussianKernel);

var terrain = ee.call('Terrain', dem);

var slope = radians(terrain.select(['slope']));
Map.addLayer(slope, {}, 'slope')

//var slope_valleys = slope.lt(Math.PI / 32.0);
//Map.addLayer(slope_valleys.mask(slope_valleys), {}, 'slope < 11.25%')

var aspect = radians(terrain.select(['aspect']));

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
Map.addLayer(aspect, {min:0, max:2*Math.PI, palette:colorsRainbow}, 'aspect')

// Generate histograms
var bounds = ee.Geometry(Map.getBounds(true));

var hist = Chart.image.histogram(degrees(slope), bounds, 30, 100);
hist = hist.setOptions({title: 'Slope'});
print(hist);

var hist = Chart.image.histogram(degrees(aspect), bounds, 30, 100);
hist = hist.setOptions({title: 'Aspect'});
print(hist);

// =========== find depression points (pits) using second derivative
var terrain2 = ee.call('Terrain', aspect.select(['aspect'], ['aspect_dem']));
var slope2 = radians(terrain2.select(['slope']));
var aspect2 = radians(terrain2.select(['aspect']));
var th = 0.015
Map.addLayer(slope2.mask(slope2.gt(th)), {min:0, max:1, opacity:0.6, palette:['000000']}, 'slope2')
Map.addLayer(aspect2, {min:0, max:2*Math.PI, palette:colorsRainbow}, 'aspect2')

var hist = Chart.image.histogram(degrees(slope2), bounds, 30, 100);
hist = hist.setOptions({title: 'Slope2'});
print(hist);

var canny = ee.Algorithms.CannyEdgeDetector(aspect, 0.01, 1);
Map.addLayer(canny.mask(canny), {palette: ['000000', 'FF0000']}, 'canny on aspect', true);


// ============ FLOW ACCUMULATION
