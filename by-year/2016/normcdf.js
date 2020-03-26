/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var srtm = ee.Image("USGS/SRTMGL1_003"),
    geometry = /* color: d63000 */ee.Geometry.Polygon(
        [[[-111.72065735911019, 35.28155515718865],
          [-111.60942078684457, 35.27875248411599],
          [-111.60530091379769, 35.37118946170597],
          [-111.721344004618, 35.372869155560835]]]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
var stats = srtm.reduceRegion({
  geometry: geometry,
  reducer: ee.Reducer.mean()
      .combine(ee.Reducer.stdDev(), null, true)
      .combine(ee.Reducer.min(), null, true)
      .combine(ee.Reducer.max(), null, true),
  scale: 1000
});


print(stats);
var mu = ee.Number(stats.get('elevation_mean'));
var sigma = ee.Number(stats.get('elevation_stdDev'));
var min = ee.Number(stats.get('elevation_min'));
var max = ee.Number(stats.get('elevation_max'));


// http://stackoverflow.com/a/3525548/3145360
function normcdf(x, mu, sigma){
    x = ee.Image(x);
    mu = ee.Image(mu);
    sigma = ee.Image(sigma);
    
    var t = x.subtract(mu);
    var y = ee.Image(0.5).multiply(t.multiply(-1).divide(sigma.multiply(ee.Image(2).sqrt())).erfc());
    return y
    
}

srtm = srtm.addBands(normcdf(srtm.select('elevation'),mu, sigma).select([0],['cdf']));


Map.addLayer(srtm.select('cdf'),{min:0, max:1}, 'cdf')
Map.addLayer(srtm.select('elevation'), {min:min.getInfo(), max:max.getInfo()}, 'elevation')