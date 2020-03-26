// Map.setCenter(80.933102,36.169547,17) // china, mountains

var assets = require('users/gena/packages:assets')
var hydro = require('users/gena/packages:hydro')
var imageGallery = require('users/gena/packages:gallery')


var v = 0.75
var gamma = 1

var one = ee.Image.constant(1).float()

var fixShadows = false
//var fixShadows = true

var dem = hydro.Map.addDem({layer: {visible: false, name: 'DEM SRTM' }, asset: 'SRTM30'})

var dem = hydro.Map.addDem({layer: {visible: false, name: 'DEM NED' }, asset: 'NED'})

var dem = hydro.Map.addDem({layer: {visible: false, name: 'DEM AHN' }, asset: 'AHN'})

var dem = hydro.Map.addDem({layer: {visible: false, name: 'DEM ALOS' }, asset: 'ALOS'})

// Map.addLayer(dem.map(function(i) { return i.mask() }).reduce(ee.Reducer.sum()), {min: 0, max: 3}, 'DEM footprints', false)
//dem = dem.mosaic()

function computeDemNormals(i) { 
  var di = i.gradient().multiply(-1)//.multiply(ee.Image.pixelArea().sqrt())
  
  var z = one.rename('z')
  var v = di.addBands(z)
  
  //var n = v.divide(v.pow(2).reduce(ee.Reducer.sum()).sqrt())
  
  return v
}

/***
 * Solve ny(z(x, y)−z(x + 1, y)) = nx(z(x, y) − z(x, y + 1)) for a given region
 */
function demFromNormals(normals, region, scale) {
  // for a given region, setup 
  
  
}


// get images 
var bounds = Map.getBounds(true)
var clean = true

function generateDEM(dateStart, dateStop, show) {
  //var options = {filter: ee.Filter.and(ee.Filter.date('2015-01-01', '2017-01-01'), ee.Filter.dayOfYear(120, 240))}
  //var options = {filter: ee.Filter.date('2015-01-01', '2017-01-01')}
  //var options = {filter: ee.Filter.date('2017-01-01', '2018-01-01'), resample: true}
  //var options = null
  
  //var options = {filter: ee.Filter.date(dateStart, dateStop), usePanL8: true, only: ['S2']}
  //var options = {filter: ee.Filter.date(dateStart, dateStop)}
  
  var options = {
    missions: [
      'S2', 
      'L8'
    ], 
    resample: true,
    filter: ee.Filter.date('2013-01-01', '2020-01-01')    
  }

  //var bandName = 'pan'
  var bandName = 'green'
  //var bandName = 'nir'
  //var bandName = 'swir'
  
  //var bandNames = ['red', 'green', 'blue']
  var bandNames = ['nir', 'green', 'blue']
  //var bandNames = ['red', 'green', 'blue']
  //var bandNames = ['green']
  
  var images = assets.getImages(bounds, options)
    .filter(ee.Filter.gte('SUN_ELEVATION', 0))
    .select(['red','green','blue','swir','nir'])
    .map(function(i) {
      return i.updateMask(i.select(bandNames).mask().reduce(ee.Reducer.product()))
    })
    
    //.filterDate('2016-01-01', '2018-01-01')
    .filterDate('2016-01-01', '2020-01-01')
    //.filter(ee.Filter.dayOfYear(0, 150))
    //.filter(ee.Filter.and(ee.Filter.lt('SUN_AZIMUTH', 55), ee.Filter.lt('SUN_AZIMUTH', 55)))
   //.filter(ee.Filter.lt('SUN_ELEVATION', 50))
   
   
  print('Number of images: ', images.size())
  
  //var maxBadPixelCountPercentile = 50 // higher - more images
  //images = assets.filterBadPixelImages(images, bounds, 0, 98, 0, 0, maxBadPixelCountPercentile)
  //images = assets.filterBadPixelImages(images, bounds, 2, 98, 0, 0, maxBadPixelCountPercentile)
  //print('Number of images: ', images.size())
  
  images = assets.getMostlyCleanImages(images, bounds, { 
    //cloudFrequencyThresholdDelta: 0.2
  })
  
  print('Number of clean images: ', images.size())
  
  //images = images.filterDate('2016-01-01', '2020-01-01')
  print('Number of clean images: ', images.size())
  
  // var thMin = 45 // CDF thredholds
  // var thMax = 65
  // var includeNeighborhood = false
  // images = assets.addCdfQualityScore(images, thMin, thMax, includeNeighborhood)
  
  // images = images.map(function(i) {
  //   var weight = i.select('weight')
  //   // weight = weight.mask(ee.Image.constant(1).subtract(weight))
  
  //   return i.updateMask(weight)
  // })
  

  //images = assets.clampImages(images, 5, 75, 5, 50, 100)
  //images = assets.clampImages(images, 5, 85, 10, 50)
  //images = assets.clampImages(images, 5, 85)
  //images = assets.clampImages(images, 0, 85)
  //images = assets.clampImages(images, 5, 35)
  
  
  
  function getImagesById() {
    var images = ee.ImageCollection.fromImages([
      ee.Image('LANDSAT/LC08/C01/T1_TOA/LC08_170078_20150714').select(['B6', 'B5', 'B4', 'B3', 'B2'], ['swir', 'nir', 'red', 'green', 'blue']),
      ee.Image('LANDSAT/LC08/C01/T1_TOA/LC08_170078_20150324').select(['B6', 'B5', 'B4', 'B3', 'B2'], ['swir', 'nir', 'red', 'green', 'blue']),
      ee.Image('LANDSAT/LC08/C01/T1_TOA/LC08_170078_20150308').select(['B6', 'B5', 'B4', 'B3', 'B2'], ['swir', 'nir', 'red', 'green', 'blue'])
    ])
    
    return images
  }
    
  //images = getImagesById()
    
  var rows = 5
  var columns = 10
  // var gallery = imageGallery.draw(images, ee.Geometry(Map.getCenter()).buffer(1000).bounds(), rows, columns, { proj: 'EPSG:3857', flipX: false, flipY: true })
  // Map.addLayer(gallery, {bands: ['swir','nir','green'], min:0.0, max:0.5}, 'gallery (false)', false)
  
  var min = 0.05
  var max = 0.45
  
  Map.addLayer(images.select(['swir','nir','green']).reduce(ee.Reducer.percentile([15])), {min:min, max:max}, '15% (false)', false)
  Map.addLayer(images.select(['swir','nir','green']).reduce(ee.Reducer.percentile([35])), {min:min, max:max}, '35% (false)', false)
  Map.addLayer(images.select(['swir','nir','green']).reduce(ee.Reducer.percentile([55])), {min:min, max:max}, '55% (false)', false)
  Map.addLayer(images.select(['swir','nir','green']).reduce(ee.Reducer.percentile([85])), {min:min, max:max}, '85% (false)', false)

  Map.addLayer(images.select(['red','green','blue']).reduce(ee.Reducer.percentile([15])), {min:min, max:max}, '15% (true)', false)
  Map.addLayer(images.select(['red','green','blue']).reduce(ee.Reducer.percentile([35])), {min:min, max:max}, '35% (true)', false)
  Map.addLayer(images.select(['red','green','blue']).reduce(ee.Reducer.percentile([55])), {min:min, max:max}, '55% (true)', false)
  Map.addLayer(images.select(['red','green','blue']).reduce(ee.Reducer.percentile([85])), {min:min, max:max}, '85% (true)', false)
  
  var chart = ui.Chart.feature.groups(images, 'SUN_AZIMUTH', 'SUN_ELEVATION', 'MISSION')
  .setChartType('ScatterChart')
  .setOptions({
      pointSize: 1,
      hAxis: {
        viewWindow: {
          min: 0,
          max: 360
        }
      },
      vAxis: {
        viewWindow: {
          min: 0,
          max: 90
        }
      }
  })

  print(chart)
  
  var I = images.select(bandNames)
  
  I = I.map(function(i) {
    var beta = ee.Number(i.get('SUN_ELEVATION')).multiply(Math.PI).divide(180)
    return i.multiply(beta.sin()).copyProperties(i) // multiply back
  })
  
  var L = I.map(function(i) {
    var alpha = ee.Number(i.get('SUN_AZIMUTH')).multiply(Math.PI).divide(180)
    var beta = ee.Number(i.get('SUN_ELEVATION')).multiply(Math.PI).divide(180)
    
    var x = alpha.cos().multiply(beta.cos());
    var y = alpha.sin().multiply(beta.cos());
    var z = beta.sin();
  
    var mask = i.select(bandName).mask()

    var result = ee.Image.constant([x,y,z]).float().mask(mask).rename(['x','y','z'])

    if(fixShadows) {
      result = result.multiply(i.select(bandName)) 
    }
      
    return result
  })
  
  if(fixShadows) {
    I = I.map(function(i) { return i.multiply(i) })
  }
  
  L = L.toArray()
  
  var I = I.toArray()

  var Lt = L.matrixTranspose()

  var n = Lt.matrixMultiply(L).matrixInverse().matrixMultiply(Lt).matrixMultiply(I)
  
  // TODO: enforce constraint n1 = n2 = n3 by concatenating equations for multiple bands instead of solving simultaneously
  
  var n1 = n
    .arraySlice(1, 0, 1)
    .arrayProject([0]).arrayFlatten([['x','y','z']])

  var n2 = n
    .arraySlice(1, 1, 2)
    .arrayProject([0]).arrayFlatten([['x','y','z']])

  var n3 = n
    .arraySlice(1, 2, 3)
    .arrayProject([0]).arrayFlatten([['x','y','z']])

  // var n4 = n
  //   .arraySlice(1, 3, 4)
  //   .arrayProject([0]).arrayFlatten([['x','y','z']])
  
  var albedo1 = n1.pow(2).reduce(ee.Reducer.sum()).sqrt()
  var albedo2 = n2.pow(2).reduce(ee.Reducer.sum()).sqrt()
  var albedo3 = n3.pow(2).reduce(ee.Reducer.sum()).sqrt()
  // var albedo4 = n4.pow(2).reduce(ee.Reducer.sum()).sqrt()

  Map.addLayer(ee.Image([albedo1, albedo2, albedo3]), {min:min, max:max}, 'albedo', true)

  // make it a unit vector
  n1 = n1.divide(albedo1)
  n2 = n2.divide(albedo2)
  n3 = n3.divide(albedo3)
  // n4 = n3.divide(albedo4)

  //var luminance = n.toArray().arrayDotProduct(ee.Image([0,0,1]).toArray()) 
  //Map.addLayer(luminance, {min: 0.6, max: 1}, 'luminance', false)

  //var luminanceDEM = demNormals.toArray().arrayDotProduct(ee.Image([0,0,1]).toArray())
  //Map.addLayer(luminanceDEM, {min: 0.6, max: 1}, 'luminance (DEM)', false)


  Map.addLayer(n1, {min:[-v, -v, 0], max:[v, v, v], bands: ['x', 'y', 'z'], gamma: gamma}, 'n1 + ' + dateStart + '-' + dateStop, false)
  Map.addLayer(n2, {min:[-v, -v, 0], max:[v, v, v], bands: ['x', 'y', 'z'], gamma: gamma}, 'n2 + ' + dateStart + '-' + dateStop, false)
  Map.addLayer(n3, {min:[-v, -v, 0], max:[v, v, v], bands: ['x', 'y', 'z'], gamma: gamma}, 'n3 + ' + dateStart + '-' + dateStop, false)

  // Map.addLayer(n1, {min:[-v, -v, 0], max:[v, v, v], gamma: gamma}, 'n1 + ' + dateStart + '-' + dateStop, false)
  // Map.addLayer(n2, {min:[-v, -v, 0], max:[v, v, v], gamma: gamma}, 'n2 + ' + dateStart + '-' + dateStop, false)
  // Map.addLayer(n3, {min:[-v, -v, 0], max:[v, v, v], gamma: gamma}, 'n3 + ' + dateStart + '-' + dateStop, false)

  // Map.addLayer(n4, {min:[-v, -v, 0], max:[v, v, v], gamma: gamma}, 'n4 + ' + dateStart + '-' + dateStop, false)

  n = n1.add(n2).add(n3).divide(3)
  // n = n1.add(n2).add(n3).add(n4).divide(4).multiply([-1, -1, 1])
  Map.addLayer(n.divide(n.select([2])), {min:[-v, v, 0], max:[v, -v, v], bands: ['x', 'y', 'z'], gamma: gamma}, 'mean(n) + ' + dateStart + '-' + dateStop, false)

  function toTangentVector(name, n) {
    var nt = n//.divide(n.select('z').abs())
    var x = nt.select('x')//.add(0.4)
    var y = nt.select('y')//.subtract(0.4)
    var z = one
    nt = ee.Image([y, x, z])
    Map.addLayer(nt, {min:[-v, -v, 0], max:[v, v, v], gamma: gamma}, name + ' n tangent + ' + dateStart + '-' + dateStop, false)
    return nt
  }
  
  var nt1 = toTangentVector(bandNames[0], n1)
  var nt2 = toTangentVector(bandNames[1], n2)
  var nt3 = toTangentVector(bandNames[2], n3)
  // var nt4 = toTangentVector('red', n4)

  // var nt = nt1.add(nt2).add(nt3).add(nt4).divide(4)
  var nt = nt1.add(nt2).add(nt3).divide(3)
  Map.addLayer(nt, {min:[-v, -v, 0], max:[v, v, v], gamma: gamma}, 'mean(n tangent) + ' + dateStart + '-' + dateStop, true)

  var demALOS = ee.Image('JAXA/ALOS/AW3D30_V1_1').select('MED').float().resample('bicubic')
  var demNormals = computeDemNormals(demALOS)
  Map.addLayer(demNormals, { min: [-v, -v, 0], max: [v, v, v] }, 'n dem', false)

  var ntMean = nt.add(demNormals).multiply(0.5)
  Map.addLayer(ntMean, {min:[-v, -v, 0], max:[v, v, v], gamma: gamma}, 'mean(n tangent, dem tangent) + ' + dateStart + '-' + dateStop, false)

  // Map.addLayer(nt1.add(demNormals).multiply(0.5), {min:[-v, -v, 0], max:[v, v, v], gamma: gamma}, 'n fused + ' + dateStart + '-' + dateStop, false)

/*  
  // aggregate
  function upscale(i, reducer, scale1, scale2) {
    return i
      .reproject(ee.Projection('EPSG:3857').atScale(scale1))
      .resample('bicubic')
      .reduceResolution(reducer, false, ee.Number(scale2).divide(scale1).floor().pow(2))
      .reproject(ee.Projection('EPSG:3857').atScale(scale2))
      .resample('bicubic')
  }

*/
  // var n10 = upscale(n, ee.Reducer.median(), Map.getScale(), Map.getScale()*5)
  // Map.addLayer(n10, {min:[v, v, -v], max:[-v, -v, v], gamma: gamma}, 'upscale(n, mean) + ' + dateStart + '-' + dateStop, false)
  
  
}


//generateDEM('1999-01-01', '2018-01-01', true)
//generateDEM('2013-01-01', '2015-01-01', false)
//generateDEM('2014-01-01', '2016-01-01', false)
//generateDEM('2015-01-01', '2017-01-01', false)
//generateDEM('2016-01-01', '2018-01-01', true)

generateDEM('2010-01-01', '2018-01-01', true)






function arrayTests() {
// Image arrays
  var A = ee.ImageCollection([ee.Image([1,1,1])]).toArray()
  Map.addLayer(A, {}, 'A', false)
  
  var AT = A.arrayTranspose(0)
  Map.addLayer(AT, {}, 'AT', false)
  
  // define vector via angles
  var alpha = 45
  var beta = 45
  var x = Math.cos(alpha)*Math.cos(beta);
  var z = Math.sin(alpha)*Math.cos(beta);
  var y = Math.sin(beta);
  
  print(x,y,z)
  
  
  // Overdetermined system, Ax = y
  A = ee.Array([[2, 1], [-3, 1], [-1, 1]])
  var y = ee.Array([[-1], [-2], [1]])
  
  // using pseudoinverse
  var A_pi = A.matrixPseudoInverse()
  print('A_pi', A_pi)
  print('A_pi * A', A_pi.matrixMultiply(A))
  print('solution, x: ', A_pi.matrixMultiply(y))
  
  // using OLS
  print('OLS', A.matrixTranspose().matrixMultiply(A).matrixInverse()
    .matrixMultiply(A.matrixTranspose()).matrixMultiply(y))
    
  // using QR
  // ...
}

// arrayTests()


// ROADMAP
//
// * extend to anizotropic surfaces (non-Lambertian)
// * implement algorithm for multiple bands: http://www2.ee.ic.ac.uk/publications/p4689.pdf
// * fuse with existing DEM (ALOS / SRTM)
