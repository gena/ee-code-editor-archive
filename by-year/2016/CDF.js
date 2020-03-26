/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var aoi = /* color: #d63000 */ee.Geometry.Point([4.161994457244873, 51.95557262739817]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
var community = {}

community.Algorithms = { Landsat: {} }

/***
 * Approximate: http://www.asprs.org/a/publications/proceedings/tampa2007/0079.pdf
 */
var dsun = function(doy) {
  return ee.Number(1).subtract(
    ee.Number(0.01672).multiply(
      //ee.Number(2).multiply(Math.PI).multiply(ee.Number(doy).subtract(93.5)).divide(365).sin()
      ee.Number(0.9856).multiply(doy).subtract(4).multiply(Math.PI).divide(180).cos()
    )
  )
}

/***
 * DN -> reflectance for L7, L8, follow: http://dx.doi.org.sci-hub.cc/10.1016/j.rse.2009.01.007
 */
community.Algorithms.Landsat.TOA = function(i, sirradiances, max) {
  // get linear transform coefficients
  var bandNames = i.bandNames()
  var add = bandNames.map(function(b) { 
    return ee.Number(i.get(ee.String('RADIANCE_ADD_BAND_').cat(ee.String(b).slice(1))))
  })
  var mult = bandNames.map(function(b) { 
    return ee.Number(i.get(ee.String('RADIANCE_MULT_BAND_').cat(ee.String(b).slice(1))))
  })

  // convert to images  
  sirradiances = ee.Image.constant(sirradiances).rename(i.bandNames()).float()
  mult = ee.Image.constant(mult).rename(i.bandNames()).float()
  add = ee.Image.constant(add).rename(i.bandNames()).float()

  // remove noise
  if(max) {
    i = i.updateMask(i.lt(max))
  }

  // compute radiance
  var radiance = i.multiply(mult).add(add)

  // compute dsun
  var doy = i.date().getRelative('day', 'day')
  var d = dsun(doy)

  // sun elevation correction  
  var szenith = ee.Number(i.get('SUN_ELEVATION')).multiply(Math.PI).divide(180).sin()

  // compute reflectance
  var reflectance = radiance.multiply(Math.PI).multiply(d.pow(2)).divide(sirradiances).divide(szenith)

  return reflectance
}

// ================================================================================
// MAIN
// ================================================================================

var bands = {
  all: ['red', 'green', 'blue', 'nir', 'swir1', 'swir2', 'temp'],
  reflectance: ['red', 'green', 'blue', 'nir', 'swir1', 'swir2'],
  temp: ['temp']
}

// define info for image collection groupped by type
var info = [
  {
    name: 'TOA',
    assets: [
      { id: 'COPERNICUS/S2', bands: ['B2', 'B3', 'B4', 'B8', 'B11', 'B12', 'B_temp'], multiplier: 1/10000 },
      { id: 'LANDSAT/LC8_L1T_TOA', bands: ['B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B10'] },
      //{ id: 'LANDSAT/LE7_L1T_TOA', bands: ['B1', 'B2', 'B3', 'B4', 'B5', 'B7', 'B6_VCID_1']  },
      //{ id: 'LANDSAT/LT5_L1T_TOA', bands: ['B1', 'B2', 'B3', 'B4', 'B5', 'B7', 'B6']  },
      //{ id: 'LANDSAT/LT4_L1T_TOA', bands: ['B1', 'B2', 'B3', 'B4', 'B5', 'B7', 'B6']  }
    ]
  },
  {
    name: 'SR',
    assets: [
      { id: 'LANDSAT/LC8_SR', bands: ['B2', 'B3', 'B4', 'B5', 'B6', 'B7'], multiplier: 0.0001 },
      { id: 'LANDSAT/LE7_SR', bands: ['B1', 'B2', 'B3', 'B4', 'B5', 'B7'], multiplier: 0.0001  },
      { id: 'LANDSAT/LT5_SR', bands: ['B1', 'B2', 'B3', 'B4', 'B5', 'B7'], multiplier: 0.0001  },
      { id: 'LANDSAT/LT4_SR', bands: ['B1', 'B2', 'B3', 'B4', 'B5', 'B7'], multiplier: 0.0001  }
    ]
  },
  {
    name: 'DN',
    assets: [
      { id: 'LANDSAT/LC8_L1T', bands: ['B2', 'B3', 'B4', 'B5', 'B6', 'B7'], multiplier: 1/65535 },
      { id: 'LANDSAT/LE7_L1T', bands: ['B1', 'B2', 'B3', 'B4', 'B5', 'B7'], multiplier: 1/255  },
      { id: 'LANDSAT/LT5_L1T', bands: ['B1', 'B2', 'B3', 'B4', 'B5', 'B7'], multiplier: 1/255  },
      { id: 'LANDSAT/LT4_L1T', bands: ['B1', 'B2', 'B3', 'B4', 'B5', 'B7'], multiplier: 1/255  }
    ]
  },
  {
    name: 'DN -> TOA',
    assets: [
      { id: 'LANDSAT/LC8_L1T', bands: ['B2', 'B3', 'B4', 'B5', 'B6', 'B7'], irradiances: [1996, 1807, 1536, 955.8, 235.1, 83.38] },
      { id: 'LANDSAT/LE7_L1T', bands: ['B1', 'B2', 'B3', 'B4', 'B5', 'B7'], irradiances: [1997, 1812, 1533, 1039, 230.8, 84.9], max: 254}, 
      { id: 'LANDSAT/LT5_L1T', bands: ['B1', 'B2', 'B3', 'B4', 'B5', 'B7'], irradiances: [1983, 1796, 1536, 1031, 220, 83.44]},
      { id: 'LANDSAT/LT4_L1T', bands: ['B1', 'B2', 'B3', 'B4', 'B5', 'B7'], irradiances: [1983, 1759, 1539, 1028, 219.8, 83.49]},
    ],
    algorithm: community.Algorithms.Landsat.TOA
  }
]

var only = [
  //'DN -> TOA',
  //'DN',
  'TOA',
  //'SR'
]

if(only.length) {
  info = info.filter(function(i) {
    return only.indexOf(i.name) != -1
  })
}

function createImageCollection(info) {
  var assets = info.assets
  
  // initialize collections
  var collections = assets.map(function(asset) {
    var images = ee.ImageCollection.load(asset.id)
      .filterBounds(aoi)
      .map(function(i) { return i.resample('bicubic')})

    // add fake empty temperature for consistency
    if(asset.id === 'COPERNICUS/S2') {
      images = images.map(function(i) {
        return i.addBands(ee.Image().float().rename('B_temp'))
      })
    }

    images = images
      .select(asset.bands).map(function(i) { return i.float() })

    if(asset.multiplier) {
      images = images.map(function(i) { 
        return i.multiply(asset.multiplier)
          .copyProperties(i)
          .copyProperties(i, ['system:time_start'])
          .copyProperties(i, ['system:id'])
      })
    }

    if(info.algorithm) {
      images = images.map(function(i) { 
        return info.algorithm(i, asset.irradiances, asset.max)
          .copyProperties(i)
          .copyProperties(i, ['system:time_start'])
          .copyProperties(i, ['system:id'])
      })
    }

    return images.select(asset.bands, bands.all.slice(0, asset.bands.length))
  })
  
  // merge collections
  var collection = ee.List(collections).iterate(function(c, p) {
    return ee.ImageCollection(p).merge(c)
  }, ee.ImageCollection([]))
  collection = ee.ImageCollection(collection)
  
  // get images
  collection = collection
    .filterDate('2013-01-01', '2018-01-01')

  return collection
}

// initialize image collections
info = info.map(function(i) {
  i.collection = createImageCollection(i)
  return i
})

function toCelsius(i) { 
  var result = i.subtract(273.15).copyProperties(i)
  
  var time = i.get('system:time_start')
  result = ee.Algorithms.If(ee.Algorithms.IsEqual(time, null), result, result.set('system:time_start', i.get('system:time_start')))

  return result
}

var images = info[0].collection

var percentiles = ee.List.sequence(0, 99, 5)

print(ui.Chart.image.series(images.select(bands.reflectance), aoi, ee.Reducer.first(), 20)
  .setOptions({title: 'TOA', lineWidth: 1, vAxis: { viewWindowMode:'explicit', viewWindow: {min:0, max:1}}}))

print(ui.Chart.image.series(images.select(bands.temp).map(toCelsius), aoi, ee.Reducer.first(), 20)
  .setOptions({title: 'temperature', lineWidth: 1,}))

// CDFs
var cdf = ee.ImageCollection(percentiles.map(function(p) {
  return images.reduce(ee.Reducer.percentile([p])).rename(bands.all).set('percentile', p)
}))

var vis = {min:0, max:0.5, bands:['swir1', 'nir', 'green']}
//var vis = {min:0.02, max:[0.35, 0.35, 0.25], bands:['red', 'green', 'blue']}
Map.addLayer(cdf.filter(ee.Filter.eq('percentile', 10)), vis, '10%', false)
Map.addLayer(cdf.filter(ee.Filter.eq('percentile', 20)), vis, '20%')
Map.addLayer(cdf.filter(ee.Filter.eq('percentile', 30)), vis, '30%', false)
Map.addLayer(cdf.filter(ee.Filter.eq('percentile', 40)), vis, '40%', false)
Map.addLayer(cdf.filter(ee.Filter.eq('percentile', 50)), vis, '50%', false)
Map.addLayer(cdf.filter(ee.Filter.eq('percentile', 60)), vis, '60%', false)
Map.addLayer(cdf.filter(ee.Filter.eq('percentile', 70)), vis, '70%', false)
Map.addLayer(cdf.filter(ee.Filter.eq('percentile', 80)), vis, '80%', false)
Map.addLayer(cdf.filter(ee.Filter.eq('percentile', 90)), vis, '90%', false)

print(ui.Chart.image.series(cdf.select(bands.temp).map(toCelsius), aoi, ee.Reducer.first(), 20, 'percentile')
  .setOptions({title: 'CDF, temperature', lineWidth: 1}))

print(ui.Chart.image.series(cdf.select(bands.reflectance), aoi, ee.Reducer.first(), 20, 'percentile')
  .setOptions({title: 'CDF, reflectances', lineWidth: 1}))

// CDF, bandwise
function getPercentileBandwise(collection, percentile, bandIndex) {
  var bandNames = ee.Image(collection.first()).bandNames();

  var axes = {image:0, band:1}

  var array = collection.toArray()

  // sort array by the given band
  var sort = array.arraySlice(axes.band, bandIndex, ee.Number(bandIndex).add(1)); 
  var sorted = array.arraySort(sort);
  
  // Map.addLayer(array, {}, 'unsorted', false)
  // Map.addLayer(sorted, {}, 'sorted', false)

  // find index of the percentile
  var index = sorted.arrayLength(axes.image).multiply(ee.Number(percentile).multiply(0.01)).int();
  
  // get values of all bands
  var values = sorted.arraySlice(axes.image, index, index.add(1));
  
  return values.arrayProject([axes.band]).arrayFlatten([bandNames])
}

// bandwise, conditional on specific band

// GEE crashes with smaller percentile step
var cdf = ee.ImageCollection(percentiles.map(function(p) {
  return getPercentileBandwise(images, p, bands.all.indexOf('nir')).set('percentile', p)
}))

print(cdf.getRegion(aoi, 20))

//Map.addLayer(cdf.filter(ee.Filter.eq('percentile', 60)), {min:0, max:0.5, bands:['swir1', 'nir', 'green']}, '60% | CDF(nir)')
//Map.addLayer(getPercentileBandwise(images, 60, bands.all.indexOf('nir')), {min:0, max:0.5, bands:['swir1', 'nir', 'green']}, '60% | CDF(nir)')


print(ui.Chart.image.series(cdf.select(bands.temp).map(toCelsius), aoi, ee.Reducer.first(), 20, 'percentile')
  .setOptions({title: 'temperature | CDF(nir)', lineWidth: 1}))

print(ui.Chart.image.series(cdf.select(bands.reflectance), aoi, ee.Reducer.first(), 20, 'percentile')
  .setOptions({title: 'reflectance | CDF(nir)', lineWidth: 1, vAxis: { viewWindowMode:'explicit', viewWindow: {min:0, max:1}}}))
  
var cdf = ee.ImageCollection(percentiles.map(function(p) {
  return getPercentileBandwise(images, p, bands.all.indexOf('swir1')).set('percentile', p)
}))

print(ui.Chart.image.series(cdf.select(bands.reflectance), aoi, ee.Reducer.first(), 20, 'percentile')
  .setOptions({title: 'reflectance | CDF(swir1)', lineWidth: 1, vAxis: { viewWindowMode:'explicit', viewWindow: {min:0, max:1}}}))

//Map.addLayer(getPercentileBandwise(images, 60, bands.all.indexOf('swir1')), {min:0, max:0.5, bands:['swir1', 'nir', 'green']}, '60% | CDF(swir1)')


var cdf = ee.ImageCollection(percentiles.map(function(p) {
  return getPercentileBandwise(images, p, bands.all.indexOf('blue')).set('percentile', p)
}))

print(ui.Chart.image.series(cdf.select(bands.reflectance), aoi, ee.Reducer.first(), 20, 'percentile')
  .setOptions({title: 'reflectance | CDF(blue)', lineWidth: 1, vAxis: { viewWindowMode:'explicit', viewWindow: {min:0, max:1}}}))




// export percentiles

var region = ee.Feature(ee.FeatureCollection('users/gena/eo-bathymetry/global_coastline_grid_3x2_1').filterBounds(aoi).first())
Map.addLayer(ee.Image().paint(region, 1, 1), {palette: ['ff0000']}, 'region')

region = ee.Geometry(Map.getBounds(true))

/***
 * Utility function
 */
function pad(n, width, z) {
  z = z || '0';
  n = n + '';
  return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}

// export CDF
function exportCdf() {
  var percentiles = ee.List.sequence(0, 100, 5)
  percentiles.evaluate(function(percentiles) {
    percentiles.map(function(p) {
      var image = images.reduce(ee.Reducer.percentile([p])).rename(bands.all).set('percentile', p)
      
      Export.image.toAsset({
        image: image, 
        description: 'asset-CDF-' + pad(p,3), 
        assetId: 'eo-bathymetry/CDF-' + pad(p,3),
        region: region, 
        scale: 10, 
        crs: 'EPSG:4326',
        maxPixels:1e10
      })
    })
  })
}

//exportCdf();

