/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var area1_cloud32 = /* color: d63000 */ee.Geometry.Point([143.25742721557617, -36.82921061605876]),
    area2_clouds4 = /* color: 98ff00 */ee.Geometry.Point([148.6614990234375, -27.909182129672057]),
    zoomin_percentiles = /* color: 0B4A8B */ee.Geometry.MultiPoint(),
    lakeYarrunga = /* color: ffc82d */ee.Geometry.Point([150.28069496154785, -34.77390877796464]),
    water = ee.Image("users/gena/AU_Murray_Darling/MNDWI_15_water_WGS"),
    g3wbm = ee.Image("users/gena/G3WBM");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
// OSM_stat_per_catchment.js

// use CRS of SRTM WGS84
var dem = ee.Image('USGS/SRTMGL1_003');
var info = dem.getInfo()
var crs = info.bands[0].crs
var crs_transform = info.bands[0].crs_transform

var sumAll = function (a, start, end) {
    var sum = 0;
    for (var i = start; i < end; i++)
        sum += a[i];
    return sum;
};

function otsu(histogram) {
    var total = sumAll(histogram, 0, histogram.length);
    console.log(total)

    var sum = 0;
    for (var i = 1; i < histogram.length; ++i) {
        sum += i * histogram[i];
    }

    var sumB = 0;
    var wB = 0;
    var wF = 0;
    var mB;
    var mF;
    var max = 0.0;
    var between = 0.0;
    var threshold1 = 0.0;
    var threshold2 = 0.0;

    for (var j = 0; j < histogram.length; ++j) {
        wB += histogram[j];
        if (wB == 0)
            continue;

        wF = total - wB;
        if (wF == 0)
            break;
        sumB += j * histogram[j];
        mB = sumB / wB;
        mF = (sum - sumB) / wF;
        between = wB * wF * Math.pow(mB - mF, 2);
        if ( between >= max ) {
            threshold1 = j;
            if ( between > max ) {
                threshold2 = j;
            }
            max = between;            
        }
    }
    return ( threshold1 + threshold2 ) / 2.0;
}

// adds vectors as rasters to map
var addToMapAsRaster = function(shapes, name, palette, width, opacity, filled, visible) {
  var outline = width;
  var img; 
  
  if (filled) {
    img = ee.Image().toByte();
    img = img.paint(shapes, 1); // paint fill
    img = img.paint(shapes, 0, outline + 1); // paint outline
  } else {
    img = ee.Image(0).mask(0);
    img = img.paint(shapes, 0, width);
  }

  var options = {
    palette: palette,
    max: 1,
    opacity: opacity
  };

  Map.addLayer(img, options, name, visible);

  return img;
}

var generateGrid = function(bounds, dx, dy) {
  var lon_start = bounds[0][0];
  var lon_end = bounds[1][0];
  var lat_start = bounds[0][1];
  var lat_end = bounds[2][1];
  
  var polys = [];
  for (var lon = lon_start; lon < lon_end; lon += dx) {
    var x1 = lon - dx/2;
    var x2 = lon + dx/2;
    for (var lat = lat_start; lat < lat_end; lat += dy) {
      var y1 = lat - dy/2;
      var y2 = lat + dy/2;
      polys.push(ee.Geometry.Rectangle(x1, y1, x2, y2));
    }
  }
  print("Cell count: " + polys.length)

  return ee.FeatureCollection(polys);
}

var basins_au = [
  null, // 0
  null, // 1
  ee.FeatureCollection('ft:1Dq_Q2JvvYkYO-kFX7L4E4Nzycwc50j9hfhSsBQJW'), // 2
  ee.FeatureCollection('ft:1778IyIZLZKSKVgko9X3aIV94E7jcm28uniyD6ycp'), // 3
  ee.FeatureCollection('ft:1WZ4Utbbatdl3vFVK7kTmAyHDyRjhMVfXeJeJTnBa'), // 4
  ee.FeatureCollection('ft:1rrk-yEOb8ILSolV_kSVD1qGxszHcy0cSL9UnUxIh'), // 5
  ee.FeatureCollection('ft:1-aMEhsi4usdxVUSSjKkJGC8pir3duCi_5oItnxtT'), // 6
  ee.FeatureCollection('ft:1YDeXF2LN8gDeJAOJTX0Kwp9QwV_-ZFI2llKilTGu'), // 7
  ee.FeatureCollection('ft:1YQ1qpXis4Z9z0NvKLdz-FjxFP5q2_fABi6aNSFn0') // 8
];

// processing scale
var scale = 3000; 

// REGION1 Murray & Darling Catchment
//var region = { catchments: basins_au[3], main: 564, sub: basins_au[7], sub_min: 5640000, sub_max: 5649999, zoom: 6 };
var region = { catchments: basins_au[3], main: 564, sub: basins_au[8], sub_min: 56400000, sub_max: 56499999, zoom: 6 };
//var region = { catchments: basins_au[4], main: 5642, sub: basins_au[8], sub_min: 56410000, sub_max: 56419999, zoom: 7 };
//var region = { catchments: basins_au[6], main: 564105, sub: basins_au[8], sub_min: 56410500, sub_max: 56410599, zoom: 9 };

//var region = { catchments: basins_au[4], main: 5640, sub: basins_au[7], sub_min: 5640000, sub_max: 5640999, zoom: 7 };
//var region = { catchments: basins_au[4], main: 5641, sub: basins_au[7], sub_min: 5641000, sub_max: 5641999, zoom: 7 };
//var region = { catchments: basins_au[4], main: 5642, sub: basins_au[7], sub_min: 5642000, sub_max: 5642999, zoom: 7 };
//var region = { catchments: basins_au[4], main: 5643, sub: basins_au[7], sub_min: 5643000, sub_max: 5643999, zoom: 7 };
//var region = { catchments: basins_au[4], main: 5644, sub: basins_au[7], sub_min: 5644000, sub_max: 5644999, zoom: 7 };
//var region = { catchments: basins_au[4], main: 5645, sub: basins_au[7], sub_min: 5645000, sub_max: 5645999, zoom: 7 };
//var region = { catchments: basins_au[4], main: 5646, sub: basins_au[7], sub_min: 5646000, sub_max: 5646999, zoom: 7 };
//var region = { catchments: basins_au[4], main: 5647, sub: basins_au[7], sub_min: 5647000, sub_max: 5647999, zoom: 7 };
//var region = { catchments: basins_au[4], main: 5648, sub: basins_au[7], sub_min: 5648000, sub_max: 5648999, zoom: 7 };
//var region = { catchments: basins_au[4], main: 5649, sub: basins_au[7], sub_min: 5649000, sub_max: 5649999, zoom: 7 };

var aoi_features = region['catchments'];
var aoi = aoi_features.filter(ee.Filter.eq('PFAF_ID', region['main']));
var not_aoi = aoi_features.filter(ee.Filter.neq('PFAF_ID', region['main']));
var main_catchment_pfaf_min = region['sub_min'];
var main_catchment_pfaf_max = region['sub_max'];

print('Area: ', aoi.geometry().area())
print('Pixels: ', Math.round(aoi.geometry().area().getInfo() / (30.0*30.0)))


var aoiBounds = aoi.geometry().bounds().coordinates().get(0).getInfo()

var compute = false;

if(compute) {
  var grid = generateGrid(aoiBounds, 0.2, 0.2).filterBounds(aoi);
} else {
  var grid = ee.FeatureCollection('ft:1EI0slUr477ZKM3IWv-OOh0invsIXbUoaW9tixrzT')
    //.filterBounds(aoi.geometry().simplify(1000))
}

//Map.centerObject(aoi, region['zoom']);

print(Map.getCenter())

var subcatchments = region.sub
  .filter(ee.Filter.rangeContains('PFAF_ID', main_catchment_pfaf_min, main_catchment_pfaf_max))
  //.limit(10);

var addBG = function() {
  addToMapAsRaster(ee.FeatureCollection(ee.Geometry(Map.getBounds(true))), 'map (white)', 'ffffff', 0, 1, true, false);
  addToMapAsRaster(aoi, 'aoi (black)', '000000', 0, 1, true, false);
}

var addSmallCatchments = function() {
  addToMapAsRaster(not_aoi, 'not aoi', '000000,101010', 0, 0.5, true, true);
  addToMapAsRaster(subcatchments, 'catchments', '101030,000000', 1, 0.9, false, false);
  addToMapAsRaster(subcatchments, 'catchments (light)', 'a0a0ff,000000', 1, 0.9, false, false);
}

var LC8_BANDS = ['B2',   'B3',    'B4',  'B5',  'B6',    'B7',    'B8', 'B10', 'BQA'];
var LC7_BANDS = ['B1',   'B2',    'B3',  'B4',  'B5',    'B7',    'B8', 'B8',  'B7'];
var STD_NAMES = ['blue', 'green', 'red', 'nir', 'swir1', 'swir2', 'pan', 'temp', 'BQA'];
var images = ee.ImageCollection('LANDSAT/LC8_L1T_TOA')
  //.filterDate("2014-01-01", "2015-01-01")
  .filterBounds(aoi)
  //.filterBounds(Map.getBounds(true))
  .select(LC8_BANDS, STD_NAMES);

var maxImageCount = 100;

// sun azimuth/elevation stat
var sunParameters = function() {
  var sun = images.map(function(i) { 
    var azimuth = ee.Number(i.get('SUN_AZIMUTH'));
    var zenith = ee.Number(i.get('SUN_ELEVATION'));
    return ee.Feature(null, {azimuth:azimuth, zenith:zenith})
  });
  print(Chart.feature.histogram(sun, 'azimuth', 100)
    .setOptions({title: 'Sun azimuth', 
      hAxis: { title: 'azimuth', gridlines: { count: 10 }, viewWindow:{min:0, max:360} }, 
      vAxis: { title: 'frequency', gridlines: { count: 10 }} })
  )
  print(Chart.feature.histogram(sun, 'zenith', 100)
    .setOptions({title: 'Sun zenith', 
      hAxis: { title: 'zenith', gridlines: { count: 10 }, viewWindow:{min:0, max:90} }, 
      vAxis: { title: 'frequency', gridlines: { count: 10 }} })
  )
}

// sunParameters()

// compute cloud cover
var addClouds = function(features) {
  // total number of images
  var count = images.select('BQA').count().clip(aoi);
  Map.addLayer(count, {min:0, max:maxImageCount, palette:'cbc9e2,9e9ac8,6a51a3', opacity:0.9}, 'pixel count', false);

  var chart = Chart.image.histogram(count, aoi, scale, 50); 
  chart = chart.setOptions({ title: 'Pixel Count' });
  //chart.setChartType('PieChart');
  print(chart)
  
  // number of clean pixels using BQA
  var bad = [61440,59424,57344,56320,53248,52256,52224,49184,49152,39936,31744,28590,26656]
                               
  var clearFn = function(img) { return img.select('BQA').eq(bad).reduce('max').not(); };
  var clear = images.select('BQA').map(clearFn).sum().clip(aoi);

  // Map.addLayer(clear, {min:0, max:maxImageCount, palette:'cbc9e2,9e9ac8,6a51a3', opacity:0.9}, 'clear', false)

  var cloudRatio = ee.Image(1.0).subtract(clear.divide(count));
  //var cloudRatio = clear.divide(count);
  //Map.addLayer(cloudRatio.mask(cloudRatio), {min:0, max: 1, palette:'FFFFFF'}, 'clouds ratio', false)
  Map.addLayer(cloudRatio, {min:0, max:0.5, palette:['000000', 'FFFFFF']}, 'clouds ratio', false)
  
  var chart = Chart.image.histogram(cloudRatio, aoi, scale, 100);
  chart = chart.setOptions({ title: 'Cloud Cover' });
  print(chart)

  for(var th = 0.1; th <= 0.9; th += 0.1) {
     Map.addLayer(cloudRatio.mask(cloudRatio.gte(th)).mask(cloudRatio.mask(cloudRatio.gte(th))), {min:0, max:1, palette:'FFFFFF'}, 'clouds > ' + Math.round(th*100) + '%', false);
  }
  
  // compute mean cloud ratio per sub-catchment
  features = features.map(function(feature){
    var featureCloudRatioMean = cloudRatio.reduceRegion(ee.Reducer.mean(), feature.geometry(), 300).get('constant');
    return feature.set('AVERAGE_CLOUD_COVER', featureCloudRatioMean);
  })

  var cloudRatioPerCell = features.reduceToImage(['AVERAGE_CLOUD_COVER'], ee.Reducer.first()).clip(aoi);
  Map.addLayer(cloudRatioPerCell, {min:0, max:0.5, palette: [ '000000', 'ffffff']}, 'cloud ratio (mean)', false);
  
  return features;
}

// compute NDWI min/max/mean, use cloud ratio to select percentiles
var waterIndices = function(features, scale, percentile) {
  var mean = images.reduce(ee.Reducer.intervalMean(percentile, percentile+1)).clip(aoi);
//var ndwi = mean.normalizedDifference(['nir_mean', 'red_mean']) // NDVI
  var ndwi = mean.normalizedDifference(['nir_mean', 'green_mean']) // NDWI
//var ndwi = mean.normalizedDifference(['swir1_mean', 'green_mean']) // MNDWI
  Map.addLayer(ndwi, {min:-0.5, max:0.5, palette: ['0000ff', 'ffffff']}, 'NDWI (' + percentile + '%)', false);
  
  var mean10 = images.reduce(ee.Reducer.intervalMean(10, 11)).clip(aoi);
//var ndwi = mean.normalizedDifference(['nir_mean', 'red_mean']) // NDVI
  var ndwi10 = mean10.normalizedDifference(['nir_mean', 'green_mean']) // NDWI
//var ndwi = mean.normalizedDifference(['swir1_mean', 'green_mean']) // MNDWI
  Map.addLayer(ndwi10, {min:-0.5, max:0.5, palette: ['0000ff', 'ffffff']}, 'NDWI (10%)', false);
  
  var ndwiMinName = 'NDWI_NIR_GREEN_MIN_' + percentile + 'p';
  
  var computeNDWI = function(feature) {
    var ndwiMin = ndwi.reduceRegion(ee.Reducer.min(), feature.geometry(), scale).get('nd');
    //var ndwiMax = ndwi.reduceRegion(ee.Reducer.max(), feature.geometry(), scale).get('nd');

    return feature
      .set(ndwiMinName, ndwiMin)
      //.set('NDWI_max', ndwiMax);
  }
  
  // compute mean cloud ratio per sub-catchment
  features = features.map(computeNDWI)

  //Map.addLayer(features.reduceToImage(['NDWI_var'], ee.Reducer.first()), {min:0, max:0.1, palette: ['000000', 'ffffff']}, 'NDWI var', false);
  //Map.addLayer(features.reduceToImage(['NDWI_min'], ee.Reducer.first()), {min:-0.5, max:0.1, palette: ['0000ff', 'ffffff']}, 'NDWI min', false);
  Map.addLayer(features.reduceToImage([ndwiMinName], ee.Reducer.first()).clip(aoi), {min:-0.5, max:0.5, palette: ['0000ff', 'ffffff']}, 'NDWI min ' +percentile +'% (features)', false);

  //Map.addLayer(features.reduceToImage(['NDWI_max'], ee.Reducer.first()), {min:0.1, max:0.5, palette: ['ffffff', '00ff00']}, 'NDWI max', false);
  Map.addLayer(features.filter(ee.Filter.gt(ndwiMinName, 0.2))
    .reduceToImage(['NDWI_min'], ee.Reducer.first()), {palette: ['ffffff']}, 'NDWI ' + percentile + '% min > 0.2', false);


  return features;
}

var addPercentiles = function() {
  var images_sng = images.select('swir2', 'nir', 'green')

  var addPercentile = function(p) { Map.addLayer(images_sng.reduce(ee.Reducer.intervalMean(p, p+1)).clip(aoi), {min:0.05, max:0.5}, 'image(' + p + '%)', false) }
  
  addPercentile(5)
  for(var i=10; i<100; i+=10) {
    addPercentile(i)
  }
}

var addWaterMask = function(features) {
  var mean = images.select(['swir1', 'nir', 'green']).reduce(ee.Reducer.intervalMean(20, 21)).clip(aoi);
  Map.addLayer(mean, {min:0.05, max:0.5}, 'image (20%)', false)

//var ndwi = mean.normalizedDifference(['nir_mean', 'red_mean']) // NDVI
 var ndwi = mean.normalizedDifference(['nir_mean', 'green_mean']) // NDWI
  //var ndwi = mean.normalizedDifference(['swir1_mean', 'green_mean']) // MNDWI
  Map.addLayer(ndwi, {min:-0.5, max:0.5, palette: ['0000ff', 'ffffff']}, 'NDWI (20%)', false);

  var ndwi_min = -1;
  var ndwi_max = 0.2;

  var computeStatsAroundEdges = function(feature) {
    var canny = ee.Algorithms.CannyEdgeDetector(ndwi.clip(feature), 0.99, 1);
    canny = canny.mask(canny).reproject(crs, crs_transform)
    
    print(canny.aggregate_count(0))
    
    var cannyBuffer = canny.focal_max(30, 'square', 'meters');
    // var gaussianKernel = ee.Kernel.gaussian(120, 90, 'meters');
    var ndwi_canny = ndwi.mask(cannyBuffer)
      //.convolve(gaussianKernel);
    
    // compute threshold
    var geom = ee.Geometry(feature.geometry());
    
    Map.addLayer(geom)
    
    var histogram = ndwi_canny.reduceRegion(ee.Reducer.histogram(255), geom, 30);

    var chart = Chart.image.histogram(ndwi_canny, geom, 30, 255)
      .setOptions({title: 'NDWI around edges', vAxis: { gridlines: { count: 0 } }, hAxis: { gridlines: { count: 0 }, 
      viewWindow:{max:-1, min:1} }})
    print(chart);

    var histogram = ndwi.reduceRegion(ee.Reducer.histogram(255), geom, 30);

    var chart = Chart.image.histogram(ndwi, geom, 30, 255)
      .setOptions({title: 'NDWI (cell)', vAxis: { gridlines: { count: 0 } }, hAxis: { gridlines: { count: 0 }, 
      viewWindow:{max:-1, min:1} }})
    print(chart);
    
    
    
    //var chart = Chart.image.histogram(ndwi_canny, geom, scale, 30); 
    //chart.setChartType('PieChart');
    //print(chart)


    return feature.set('hist', histogram);

    
    //return feature.set('canny_area', canny.mask().reduceRegion(ee.Reducer.sum()));
  }
  
/*  var threshold_index = otsu(ndwi_hist)
  var ndwi_threshold = ndwi_hist_info['bucketMeans'][Math.round(threshold_index)];
  ndwi_threshold = Math.min(ndwi_max, Math.max(ndwi_min, ndwi_threshold))
*/
  
  features = features.filter(ee.Filter.eq('id', 1074));
  computeStatsAroundEdges(ee.Feature(features.first()))

  
  //features = features.map(computeStatsAroundEdges);
  //Export.table(features, 'OSM_AU_canny_area', {driveFolder:'GIS (Gena)', driveFileNamePrefix: 'OSM_AU_canny_area', fileFormat: 'KML'})

/*  
  features = features.filter(ee.Filter.and(ee.Filter.gte('id', 1500), ee.Filter.lt('id', 2000)));
  print(features.aggregate_count('id'))
  features = features.map(computeStatsAroundEdges);
  Export.table(features, 'OSM_AU_NDWI_hist', {driveFolder:'GIS (Gena)', driveFileNamePrefix: 'OSM_AU_NDWI_hist', fileFormat: 'KML'})
*/
  //var feature = ee.Feature(features.first());
  //feature = computeHistogramsAroundEdges(feature)
  
  //var hist = feature.get('NDWI_HIST_20p').getInfo();
  
  //print(hist)
  
/*  var water = ndwi.lt(ndwi_threshold)

  // visualize
  Map.addLayer(canny, {min: 0, max: 1, palette: 'FF0000'}, 'canny NDWI', false);

  print(Chart.image.histogram(ndwi_canny, feature, 30).setOptions({title: 'NDWI around canny'}));
  Map.addLayer(ndwi_canny, {min: -0.3, max: 0.3, palette: ['0000FF', 'FFFFFF']}, 'NDWI around canny', false);
  
  Map.addLayer(mean.mask(water), {min:[0.03,0.03,0.03], max:[0.4,0.4,0.3], gamma:1.5}, 'water')
  
  var cannyW = ee.Algorithms.CannyEdgeDetector(water, 0.99, 0.3);
  cannyW = cannyW.mask(cannyW)
  Map.addLayer(cannyW, {palette:'aaaaff'}, 'water (boundary)')
*/
  
  return features;
}

function getWaterAreaPerCell() {
  var water_mask = water.expression('r+g+b', {r:water.select(0), g:water.select(1), b:water.select(2)}).gt(0)
  var info = water_mask.getInfo().bands[0]
  var crs = info.crs;
  var crs_transform = info.crs_transform;
  
  var waterPerCell = grid.map(function(f){
    var feature = ee.Feature(f);
    var area = ee.Image.pixelArea().mask(water_mask)
        .reduceRegion({reducer: ee.Reducer.sum(), geometry: feature.geometry(), crs: crs, crsTransform: crs_transform})
    
    return feature.set('water_area', area.get(area.keys().get(0)))
  })

  return waterPerCell;
}

function computeOverlapOsmLandsat() {
  var water_mask = water.expression('r+g+b', {r:water.select(0), g:water.select(1), b:water.select(2)}).gt(0)
  Map.addLayer(water_mask.mask(water_mask), {palette:['0000ff']}, "water (landsat)")

  var info = water_mask.getInfo().bands[0]
  var crs = info.crs;
  var crs_transform = info.crs_transform;

  var rivers_lines_osm = ee.FeatureCollection('ft:1nlWWjT4VkGjkp-kXKroFuyUuKDUSTqce_DDtmOt1')
  var rivers_polygons_osm = ee.FeatureCollection('ft:1gUbHjPLpeC4Vzi59vE5JSFfLRDtcrngyWfSn8mQC');

  var rivers_image = ee.Image(0).mask(0).toByte();
  rivers_image = rivers_image.paint(rivers_lines_osm, 1, 1).focal_max({radius: 15, units: 'meters', kernelType: 'square'});
  rivers_image = rivers_image.paint(rivers_polygons_osm, 1);
  //rivers_image = rivers_image.reproject(crs, crs_transform)
  Map.addLayer(rivers_image.mask(rivers_image), {palette:['00aa00']}, "water (osm)")

  var osm = rivers_image.select(0).toByte().unmask()
  var landsat = water_mask.select(0).toByte().unmask()
  var osm_no_landsat = osm.eq(1).and(landsat.eq(0))
  var landsat_no_osm = osm.eq(0).and(landsat.eq(1))
  var osm_and_landsat = osm.eq(1).and(landsat.eq(1))

  var stat = grid.map(function(f){
    var feature = ee.Feature(f);

    var area1 = ee.Image.pixelArea().mask(osm_no_landsat)
        .reduceRegion({reducer: ee.Reducer.sum(), geometry: feature.geometry(), crs: crs, crsTransform: crs_transform})
    feature = feature.set('osm_no_landsat', area1.get(area1.keys().get(0)))
    
    var area2 = ee.Image.pixelArea().mask(landsat_no_osm)
        .reduceRegion({reducer: ee.Reducer.sum(), geometry: feature.geometry(), crs: crs, crsTransform: crs_transform})
    feature = feature.set('landsat_no_osm', area2.get(area2.keys().get(0)))

    var area3 = ee.Image.pixelArea().mask(osm_and_landsat)
        .reduceRegion({reducer: ee.Reducer.sum(), geometry: feature.geometry(), crs: crs, crsTransform: crs_transform})
    feature = feature.set('osm_and_landsat', area3.get(area3.keys().get(0)))

    var area4 = ee.Image.pixelArea().mask(osm)
        .reduceRegion({reducer: ee.Reducer.sum(), geometry: feature.geometry(), crs: crs, crsTransform: crs_transform})
    feature = feature.set('osm_total', area4.get(area4.keys().get(0)))

    var area5 = ee.Image.pixelArea().mask(landsat)
        .reduceRegion({reducer: ee.Reducer.sum(), geometry: feature.geometry(), crs: crs, crsTransform: crs_transform})
    feature = feature.set('landsat_total', area5.get(area5.keys().get(0)))

    var water = [50, 40];
    var g3wbm_water = g3wbm.eq(water).reduce('max');

    var area6 = ee.Image.pixelArea().mask(g3wbm_water)
        .reduceRegion({reducer: ee.Reducer.sum(), geometry: feature.geometry(), crs: crs, crsTransform: crs_transform})
    feature = feature.set('g3wbm_total', area6.get(area6.keys().get(0)))

    var area7 = 
      ee.Number(area3.get(area3.keys().get(0))) // LANDSAT & OSM
      .divide(
        ee.Number(area4.get(area4.keys().get(0))) // OSM
          .add(ee.Number(area2.get(area2.keys().get(0)))) // LANDSAT. no OSM
      )
    feature = feature.set('landsat_osm_agreement', area7);

    var area8 = 
      ee.Number(area2.get(area2.keys().get(0))) // LANDSAT, no OSM
      .divide(
        ee.Number(area4.get(area4.keys().get(0))) // OSM
          .add(ee.Number(area2.get(area2.keys().get(0)))) // LANDSAT. no OSM
      )
    feature = feature.set('landsat_disagreement', area8);

    var area9 = 
      ee.Number(area1.get(area1.keys().get(0))) // OSM, no LANDSAT
      .divide(
        ee.Number(area4.get(area4.keys().get(0))) // OSM
          .add(ee.Number(area2.get(area2.keys().get(0)))) // LANDSAT. no OSM
      )
    feature = feature.set('osm_disagreement', area9);

    return feature;
  })
  
  return stat;
}

// show pre-computed values
Map.addLayer(grid.reduceToImage(['AVERAGE_CLOUD_COVER'], ee.Reducer.first()).clip(aoi), {min:0, max:0.5, palette: [ '000000', 'ffffff']}, 'cloud-ratio (pre-computed)', false);

Map.addLayer(grid.reduceToImage(['NDWI_NIR_GREEN_MIN_20p'], ee.Reducer.first()).clip(aoi), {min:-0.5, max:0.5, palette: ['0000ff', 'ffffff']}, 'NDWI min 20% (pre-computed)', false);
Map.addLayer(grid.reduceToImage(['NDWI_NIR_GREEN_MIN_50p'], ee.Reducer.first()).clip(aoi), {min:-0.5, max:0.5, palette: ['0000ff', 'ffffff']}, 'NDWI min 50% (pre-computed)', false);

var water_max_ndwi = 0.15
Map.addLayer(grid.filter(ee.Filter.gt('NDWI_NIR_GREEN_MIN_20p', water_max_ndwi))
  .reduceToImage(['NDWI_NIR_GREEN_MIN_20p'], ee.Reducer.first()), {palette: ['ffffff']}, 'NDWI 20% min > ' + water_max_ndwi, false);
Map.addLayer(grid.filter(ee.Filter.gt('NDWI_NIR_GREEN_MIN_50p', water_max_ndwi))
  .reduceToImage(['NDWI_NIR_GREEN_MIN_50p'], ee.Reducer.first()), {palette: ['ffffff']}, 'NDWI 50% min > ' + water_max_ndwi, false);

//var features = subcatchments
var features = grid

addBG()
addPercentiles()
features = waterIndices(features, 300, 20)
//features = addClouds(features)
addSmallCatchments()
//features = addWaterMask(features)

Map.addLayer(getWaterAreaPerCell().reduceToImage(['water_area'], ee.Reducer.first()).clip(aoi), {min:0, max:1000000, palette: [ '000000', '0000ff']}, 'water area', false);

var results = computeOverlapOsmLandsat()
Map.addLayer(results.reduceToImage(['osm_no_landsat'], ee.Reducer.first()).clip(aoi), {min:0, max:3000000, palette: [ 'ffffff', '0000ff']}, 'osm_no_landsat', false);
Map.addLayer(results.reduceToImage(['landsat_no_osm'], ee.Reducer.first()).clip(aoi), {min:0, max:3000000, palette: [ 'ffffff', '0000ff']}, 'landsat_no_osm', false);
Map.addLayer(results.reduceToImage(['osm_and_landsat'], ee.Reducer.first()).clip(aoi), {min:0, max:3000000, palette: [ 'ffffff', '0000ff']}, 'osm_and_landsat', false);
Map.addLayer(results.reduceToImage(['landsat_osm_agreement'], ee.Reducer.first()).clip(aoi), {min:0, max:1, palette: [ 'ffffff', '000000']}, 'landsat_osm_agreement', false);
Map.addLayer(results.reduceToImage(['landsat_disagreement'], ee.Reducer.first()).clip(aoi), {min:0, max:1, palette: [ 'ffffff', '000000']}, 'landsat_disagreement', false);
Map.addLayer(results.reduceToImage(['osm_disagreement'], ee.Reducer.first()).clip(aoi), {min:0, max:1, palette: [ 'ffffff', '000000']}, 'osm_disagreement', false);

Export.table(results, 'OSM_VS_LANDSAT_MD', {driveFileNamePrefix: 'OSM_VS_LANDSAT_MD', fileFormat: 'GeoJSON'})
  
addToMapAsRaster(grid, 'grid', ['000000', 'ffffff'], 1, 0.5, true, false)
Map.addLayer(grid, {}, 'grid', false)
addToMapAsRaster(grid, 'grid (outline)', ['000000', 'ffffff'], 1, 0.5, false, false)
addToMapAsRaster(aoi, 'aoi (outline)', ['000000', 'ffffff'], 1, 0.5, false, false)

