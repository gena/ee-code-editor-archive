/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var srtm_30 = ee.Image("USGS/SRTMGL1_003");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
// ***** some plot functionality ******
function radians(img) { return img.toFloat().multiply(3.1415927).divide(180); }

function hillshade(az, ze, slope, aspect) {
  var azimuth = radians(ee.Image(az));
  var zenith = radians(ee.Image(ze));
  return azimuth.subtract(aspect).cos().multiply(slope.sin()).multiply(zenith.sin())
      .add(zenith.cos().multiply(slope.cos()));
}

function hillshadeit(image, elevation, weight, height_multiplier) {
  var hsv  = image.unitScale(0, 255).rgbtohsv();

  var terrain = ee.call('Terrain', elevation.multiply(height_multiplier));
  var slope = radians(terrain.select(['slope']));
  var aspect = radians(terrain.select(['aspect']));
  var hs = hillshade(azimuth, zenith, slope, aspect);

  var intensity = hs.multiply(weight).multiply(hsv.select('value'));
  var huesat = hsv.select('hue', 'saturation');
  
  return ee.Image.cat(huesat, intensity).hsvtorgb();
}

var azimuth = 90;
var zenith = 60;

// visualization settings (elevation)

// function to visualize the specific DEM
var colors_dem = ['006837', '1a9850', '66bd63', 'a6d96a', 'd9ef8b', 'ffffbf', 'fee08b', 'fdae61', 'f46d43', 'd73027', 'a50026', 'ffffff']
var dem_min = 0;
var dem_max = 500;

var addDem = function(dem, name, visible) {
  var im = dem.visualize({palette:colors_dem, min:dem_min, max:dem_max, opacity: 1.0});
  var hillshade_im = hillshadeit(im, dem, 2.0, 2.0);
  Map.addLayer(hillshade_im, {}, name, visible);
  return hillshade_im;
};

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
    
        I = I.add(ee.Image(lambda).multiply(cN.multiply(dI_N).add(cS.multiply(dI_S)).add(cE.multiply(dI_E)).add(cW.multiply(dI_W))));
        break;
    }
  }

  return I;
};


// ********* ALL INPUTS START HERE! *********
// Map.setCenter(39.265, -6.804, 16);
addDem(srtm_30, 'srtm_30', false);




// resample -> resampled srtm called dem
// * bilinear of bicubic maak heel weinig verschil. verder met bicubic
var res = ee.Number(0.5); // resolution in meter
var info = srtm_30.getInfo().bands[0];

// test direct resampling srtm_30 with bicubic, then gaussian smoothing
// var dem = srtm_30.resample('bicubic').reproject(info.crs, null ,res);
// addDem(dem, 'dem', false);
var dem_gaus = srtm_30.convolve(ee.Kernel.gaussian(30, 15, 'meters'))
  .resample('bicubic').reproject(info.crs, null ,res);
addDem(dem_gaus, 'dem_gaus', false);


// test first PM filter then bicubic resampling dem
var multiplier = 10;
var srtm_30_pm = peronaMalikFilter(srtm_30.multiply(1/multiplier), 5, 2, 2).multiply(multiplier);
// addDem(srtm_30_pm, 'srtm_30_pm', false);
var dem_pm = srtm_30_pm.resample('bicubic').reproject(info.crs, null ,res);
addDem(dem_pm, 'dem_pm_multiplier', true);


var srtm_30_pm = peronaMalikFilter(srtm_30, 5, 2, 2);
// addDem(srtm_30_pm, 'srtm_30_pm', false);
var dem_pm = srtm_30_pm.resample('bicubic').reproject(info.crs, null ,res);
addDem(dem_pm, 'dem_pm', false);


var srtm_30_pm = peronaMalikFilter(srtm_30, 15, 4, 2);
// addDem(srtm_30_pm, 'srtm_30_pm', false);
var dem_pm = srtm_30_pm.resample('bicubic').reproject(info.crs, null ,res);
addDem(dem_pm, 'dem_pm_K4_iter15', false);


var srtm_30_pm = peronaMalikFilter(srtm_30, 10, 10, 2);
// addDem(srtm_30_pm, 'srtm_30_pm', false);
var dem_pm = srtm_30_pm.resample('bicubic').reproject(info.crs, null ,res);
addDem(dem_pm, 'dem_pm_K10_iter10', false);


// addDem(dem_bicubic_pm, 'dem_bicubic_pm', true);

