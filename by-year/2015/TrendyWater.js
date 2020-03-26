/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var ndwi = ee.ImageCollection("MODIS/MCD43A4_NDWI"),
    etopo = ee.Image("NOAA/NGDC/ETOPO1"),
    mod = ee.ImageCollection("MODIS/MOD09GQ"),
    myd = ee.ImageCollection("MODIS/MYD09GQ"),
    l7 = ee.ImageCollection("LANDSAT/LE7_L1T_TOA");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
// Add a band containing image date as years since 1991.
function createTimeBand(img) {
  var date = ee.Date(img.get('system:time_start'))
  var year = date.get('year').subtract(1991);
  
  return ee.Image(year).byte().addBands(img);
}

function addMonthFilter(img) {
  var startMonth = 6;
  var stopMonth = 9

  var date = ee.Date(img.get('system:time_start'))
  var month = date.get('month')
  var filter = month.gte(startMonth).and(month.lte(stopMonth))

  return img.set('filter', filter);
}

function smoothen(img) {
  return img.convolve(ee.Kernel.gaussian(3, 2))
}

var computeFit = function(images, start, stop, showMap) {
  // Fit a linear trend
  var fit = images
    .filterDate(start, stop)
    .map(createTimeBand)
    .reduce(ee.Reducer.linearFit());


  Map.addLayer(ee.Image(images.filterDate(start, stop).first()).mask(land),
           {min: 0, max: 0.5},
           'first ' + start + ' ' + stop, false);

/*
  Map.addLayer(ee.Image(images.filterDate(start, stop).min()).mask(land),
           {min: -0.5, max: 0.5},
           'min ' + start + ' ' + stop, false);

  Map.addLayer(ee.Image(images.filterDate(start, stop).max()).mask(land),
           {min: -0.5, max: 0.5},
           'max ' + start + ' ' + stop, false);
*/  
  // Display trend in red/blue, brightness in green.
  Map.addLayer(fit.mask(land),
           {min: 0, max: [-0.2, 0, 0.2], bands: ['scale', 'offset', 'scale']},
           'stable water trend ' + start + ' ' + stop, showMap);
}

var land = etopo.select('bedrock').gt(-5).focal_max(4).focal_min(4).focal_mode(4)
Map.addLayer(land.mask(land), {}, 'land', false);

// MODIS percentile NDWI
var bands = ['sur_refl_b01', 'sur_refl_b02']
var modis = ee.ImageCollection(mod.merge(myd))
  .select(bands)

var bands = ['B2', 'B4']

var modis = l7
  .select(bands)

var years = ee.List.sequence(2001, 2015)

var percentile = 25

var annualPercentile = ee.ImageCollection(years.map(function(y) {
  var start = ee.String(ee.Number(y)).slice(0, 4).cat('-01-01')
  var stop = ee.String(ee.Number(y).add(1)).slice(0, 4).cat('-01-01')
  var result = modis
  .filterDate(start, stop)
  .reduce(ee.Reducer.percentile([percentile])).rename(bands)
  .normalizedDifference(bands)
  .set('system:time_start', start)

  return result.mask(result.gt(-0.1))
}))//.map(smoothen)

Map.addLayer(annualPercentile, {}, 'NDWI annual ' + percentile + '%', false)

var yearsWindow = 2

for (var i = 2001; i <= 2015; i+=yearsWindow) {
  computeFit(annualPercentile, i.toString() + '-01-01', (i + yearsWindow).toString() + '-01-01', i == 2001)
}

// MODIS NDWI 16-day
Map.addLayer(ndwi, {}, 'NDWI', false);


var annualPercentileFitRendered = ee.ImageCollection(years.map(function(y) {
  var start = ee.String(ee.Number(y)).slice(0, 4).cat('-01-01')
  var stop = ee.String(ee.Number(y).add(1)).slice(0, 4).cat('-01-01')

  var fit = annualPercentile
    .filterDate(start, stop)
    .map(createTimeBand)
    .reduce(ee.Reducer.linearFit());

  return fit
    .mask(land)
    .visualize({min: 0, max: [-0.3, 0, 0.3], bands: ['scale', 'offset', 'scale']})
    .clip(Map.getBounds(true));
}))

Export.video(annualPercentileFitRendered)

/*

Map.addLayer(ee.Image(ndwi.first()), {min:-0.5, max:0.5}, 'NDWI (first)', false);

ndwi = ee.ImageCollection('MODIS/MCD43A4_NDWI')
  //.map(smoothen)
  .map(addMonthFilter)
  //.filterMetadata('filter', 'equals', 1)
  .select('NDWI')

Map.addLayer(ndwi, {}, 'NDWI', false);
Map.addLayer(ee.Image(ndwi.first()), {}, 'NDWI (first)', false);

for (var i = 2001; i <= 2015; i+=yearsWindow) {
  computeFit(ndwi, i.toString() + '-01-01', (i + yearsWindow).toString() + '-01-01', i == 2002)
}
*/


