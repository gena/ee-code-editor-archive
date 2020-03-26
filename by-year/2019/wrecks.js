/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var s3 = ee.ImageCollection("COPERNICUS/S3/OLCI"),
    geometry = 
    /* color: #d63000 */
    /* displayProperties: [
      {
        "type": "rectangle"
      }
    ] */
    ee.Geometry.Polygon(
        [[[6.150674329900426, 53.745472016901395],
          [6.150674329900426, 53.36859150819561],
          [7.057561384343785, 53.36859150819561],
          [7.057561384343785, 53.745472016901395]]], null, false);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
var gl = require('users/gena/packages:gl')
var animation = require('users/gena/packages:animation')
var assets = require('users/gena/packages:assets')
var charting = require('users/gena/packages:charting')
var utils = require('users/gena/packages:utils')

var land = ee.Image("users/gena/land_polygons_image").mask()

var bounds = ee.Geometry(Map.getBounds(true))
//var bounds = geometry

//var scale = 20
var scale = Map.getScale()

var nearestOnly = false
//var nearestOnly = true

var greenMax = 0.2
var gammaWater = 0.7
var gammaLand = 1.5

var enhanceWater = true
//var enhanceWater = false

//var computeExpectation = true
var computeExpectation = false

var bands = ['red', 'green', 'blue']
// var bands = ['swir', 'nir', 'green']

var emodnet = ee.Image("users/gena/EMODNET"),
    gebco = ee.Image("users/gena/GEBCO_2014_2D");

var palette = ["f7fbff","deebf7","c6dbef","9ecae1","6baed6","4292c6","2171b5","08519c","08306b"].slice(2).reverse()

var min = -25, max = 5

var weight = 1.3
var exaggregation = 2000
var azimuth = 315
var elevation = 45
var shadows = false

// Load EMODNET
var emodnetRGB =  utils.hillshadeRGB(
        emodnet.visualize({min:min, max:max, palette: palette}),  // style
        emodnet, 
        weight, 200, azimuth, elevation, shadows)

Map.addLayer(emodnetRGB, {}, 'EMODNET', false)
Map.addLayer(emodnet, {}, 'EMODNET (RAW)', false)

// Load GEBCO
gebco = gebco.resample('bilinear')

var gebcoRGB = utils.hillshadeRGB(
        gebco.visualize({min:min, max:max, palette: palette}),  // style
        gebco, 
        weight, 200, azimuth, elevation, shadows)

Map.addLayer(gebcoRGB, {}, 'GEBCO', false)

function TerrainAspect(elevation) {
  var step = ee.Image.pixelArea().sqrt()
  
  function radians(img) { 
    return img.toFloat().multiply(Math.PI).divide(180); 
  }
  
  var k_dx = ee.Kernel.fixed(3, 3,
                         [[ 1/8,  0,  -1/8],
                          [ 2/8,  0,  -2/8],
                          [ 1/8,  0,  -1/8]]);
  
  var k_dy = ee.Kernel.fixed(3, 3,
                         [[ -1/8, -2/8,  -1/8],
                          [ 0,    0,    0],
                          [ 1/8, 2/8,   1/8]]);
  
  
  var dx = elevation.convolve(k_dx)
  var dy = elevation.convolve(k_dy)
  
  // var slope = ee.Image().expression("sqrt((x*x + y*y)/(step*step))", {x: dx, y: dy, step: step}).atan()
  
  var aspect = dx.atan2(dy).add(Math.PI)
  
  return aspect
  
  //return {aspect: aspect, slope: slope}
}

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


function unitScale(image, min, max) {
  min = ee.Image.constant(min)
  max = ee.Image.constant(max)
  
  return image.subtract(min).divide(max.subtract(min))
}

function generateImage(start, stop, visible) {
  var images = assets.getImages(bounds, {
    missions: [
      'S2', 
      'L8',
      // 'L7', 
      // 'L5', 
      // 'L4'
    ], 
    filter: ee.Filter.date(start, stop),
    resample: true
  })
  
  var years = ee.List.sequence(2015, 2020)
  // years.getInfo().map(showThumb)
  
  print('Count (all): ', images.size())
  
  images = assets.getMostlyCleanImages(images, bounds, {
    cloudFrequencyThresholdDelta: 0.15
  })
  
  images = images.filter(ee.Filter.calendarRange(180, 240))
  
  print('Count (least cloudy): ', images.size())

  function debugShowImages() {  
    images = images.sort('system:time_start').map(function(i) {
      var label = i.date().format()
      
      var image = i.log()
      
      return ee.ImageCollection([
        // image
        //   .visualize({ bands: ['red', 'green', 'blue'], min: -3.2, max: -1.2})
        //   .set( { label: label }),

        TerrainAspect(ee.Image(1).subtract(image).convolve(ee.Kernel.gaussian(3, 2))).reduce(ee.Reducer.mean())
          .visualize({min:0, max:2*Math.PI, palette:colorsRainbow})
          .set( { label: label }),


        // image
        //   .reproject(ee.Projection('EPSG:3857').atScale(scale * 2))
        //   .convolve(ee.Kernel.laplacian8())
        //   .reproject(ee.Projection('EPSG:3857').atScale(scale * 2))
        //   .resample('bicubic')
        //   .visualize({ bands: ['red', 'green', 'blue'], min: 0, max: 0.1})
        //   .set( { label: label }),
      ])
    }).flatten()
    
    animation.animate(images, { label: 'label', maxFrames: 100 })
  } 
  
  // debugShowImages(); throw(0)
  
  print('Scale: ', scale) 
  
  function pansharpen(i) {
    function pansharpenL8(i) {
      var pan = ee.ImageCollection('LANDSAT/LC08/C01/T1_RT_TOA')
        .filter(ee.Filter.eq('system:time_start', i.get('system:time_start')))
        .first().select('B8')
  
      // Upscale to 4 times original resolution
      var proj = i.select(0).projection();
      var s = proj.nominalScale()
  
      var upscaled = i.reproject(proj.atScale(s.divide(4))).resample('bicubic');
      
      // Upscale to 2 times original resolution
      var p_upscale = pan.reproject(proj.atScale(s.divide(2))).resample('bicubic');
      
      var wght = 1.0/16.0;
      
      var meanKernel = ee.Kernel.fixed(4, 4,
                               [[wght, wght, wght, wght],
                                [wght, wght, wght, wght],
                                [wght, wght, wght, wght],
                                [wght, wght, wght, wght]]);
      // try this
      var pconv = p_upscale.convolve(meanKernel);
  
      /*
      var wght = 1.0/4.0;
      
      var meanKernel = ee.Kernel.fixed(2, 2,
                               [[wght, wght],
                                [wght, wght]]);
      var upscaled = upscaled.convolve(meanKernel);
      */
      
      var psh = upscaled.multiply(p_upscale.divide(pconv));
      
      return psh.copyProperties(i).copyProperties(i, ['system:time_start'])
    }
    
    i = ee.Algorithms.If(ee.String(i.get('MISSION')).index('L8').eq(0), pansharpenL8(i), i)
    
    return ee.Image(i)
  }
  
  function showThumb(year) {
    print(year)
    
    var start = ee.Date.fromYMD(year, 1, 1)
    var stop = start.advance(1, 'year')
    
    // plot
    var rect = ee.Geometry.Rectangle({ coords: [[0, 0], [100, 4]], geodesic: false })
    
    // add rug plots
    var plot = new charting.Plot(rect.bounds(), { 
      area: { width: 1, color: '000000', fillColor: '00000011' }
    })
    
    plot.setMinMax(start.millis(), stop.millis(), 0, 1)
      
    var images2 = images.filterDate(start, stop)
    var times = ee.List(images2.aggregate_array('system:time_start'))
    plot.addRugSeries('', times, { width: 1, color: 'red' }, 1)  
    
    print(plot.getThumbnail({ dimensions: '600x24'}))
  }
  
  function findNearest(images) {
    // Define an allowable time difference
    
    var diffMax = 5 * 60 * 60 * 1000 // 5 hours
    var diffMin = 5 * 60 * 1000 // 5 minutes
    
    // Create a time filter to define a match as overlapping timestamps.
    var timeFilter = ee.Filter.maxDifference({
      difference: diffMax,
      leftField: 'system:time_start',
      rightField: 'system:time_start'
    })
    
    // Define the join.
    var saveAllJoin = ee.Join.saveAll({
      matchesKey: 'matches',
      ordering: 'difference',
      measureKey: 'difference'
    });
    
    // Apply the join.
    images = saveAllJoin.apply(images, images, timeFilter)
    .map(function(i) {
      var matches = ee.ImageCollection(ee.List(i.get('matches'))).filter(ee.Filter.gt('difference', diffMin))
      
      return i.set({matchCount: matches.size() })
    })
    .filter(ee.Filter.gt('matchCount', 0))
    
    print('Count (nearest pairs): ', images.size())
    
    return ee.ImageCollection(images)
  }
  
  if(nearestOnly) {
    images = findNearest(images)
  }
  
  images = images.sort('system:time_start')
  
  //images = images.limit(50)
  
  images = images.map(function(i) {
    var water = i.normalizedDifference(['green', 'nir']).rename('water')
      .unitScale(0, 0.1)
  
    i = pansharpen(i)
  
    if(enhanceWater) {
      var waterArea = water.gt(0.01).multiply(ee.Image.pixelArea()).reduceRegion(ee.Reducer.sum(), bounds, scale * 5).values().get(0)
      var landArea = water.lt(0).multiply(ee.Image.pixelArea()).reduceRegion(ee.Reducer.sum(), bounds, scale * 5).values().get(0)
    }
    
    // TODO: histogram match DOS correction based on both images, match with the SR products 
    
    if(nearestOnly) {
      var dark = ee.ImageCollection(ee.List(i.get('matches'))).median()
    } else {
      var dark = i
    }
    
    //dark = dark.updateMask(water) 
  
    dark = dark
      .updateMask(water.gt(0)) // take dark over water only
      .reduceRegion({
        reducer: ee.Reducer.percentile([0]), 
        geometry: bounds, 
        scale: scale,
        maxPixels: 1e10
      })
      
    i = i
      .set(dark)
      
    if(enhanceWater) {
      i = i
        .set({water: water})
        .set({waterArea: waterArea})
        .set({landArea: landArea})
    }
      
    return i
  })
  
  // images = images.limit(50)
  
  // print(ui.Chart.feature.byFeature(images, 'system:time_start', ['red', 'green', 'blue']))

  //print(ui.Chart.feature.byFeature(images, 'system:time_start', ['waterArea']))
  
  // bad images?
  images = images.filter(ee.Filter.and(
     ee.Filter.gt(bands[0], 0), ee.Filter.gt(bands[1], 0), ee.Filter.gt(bands[2], 0)
  ))
  
  // if(enhanceWater) {
  //   images = images.filter(ee.Filter.gt('waterArea', 100))
  //   images = images.filter(ee.Filter.gt('landArea', 100))
  // }
  
  // print('Count (valid): ', images.size())
  
  // partial atmospheric correction 
  // var darkMedian = ee.List(images.reduceColumns(ee.Reducer.median().repeat(3), ['red', 'green', 'blue']).get('median'))
  // var darkImage = ee.Image.constant([darkMedian.get(0), darkMedian.get(1), darkMedian.get(2)])
  
  function sharpenLoG(i) {
    var s = scale
    var r = s * 4
    var f = s * 2
    
    return i.subtract(i.convolve(ee.Kernel.gaussian(r, f, 'meters')).convolve(ee.Kernel.laplacian8(3))) // LoG
      .copyProperties(i).copyProperties(i, ['system:time_start'])
  }
  
  function fixNull(values, v) {
    return ee.List(values).map(function(o) {
      return ee.Algorithms.If(ee.Algorithms.IsEqual(o, null), v, o)
    })
  }
  
  if(computeExpectation) {
/*
    var bandsAll = images.first().bandNames()
    var percentiles = ee.ImageCollection(ee.List.sequence(0, 100).map(function(i) {
      return images.reduce(ee.Reducer.percentile([i])).rename(bandsAll).set({ percentile: i })
    }))
    Map.addLayer(percentiles, {}, 'percentiles', false)
*/  

    images = assets.addCdfQualityScore(images, 75, 85, true, {erosion: 0, dilation: 0, weight: 200})

    function debug() {  
      images = images.map(function(i) { return ee.ImageCollection([i, i.updateMask(i.select('weight'))]) })
      animation.animate(images.flatten(), {
        vis: { bands: ['red', 'green', 'blue'], min: 0, max: 0.3 }
      })
      // throw(0)
    }
    // debug()

  }
  
  images = images.map(function(i) {
    var t = i.get('system:time_start')
    if(computeExpectation) {
      var weight = i.select('weight').add(utils.focalMaxWeight(land, 30).multiply(0.1))
    }
    
    var darkImage = ee.Image.constant(bands.map(function(n) { return i.get(n) })).rename(bands)
   // var darkImage = ee.Image.constant([red, green, blue])
    
    var mission = i.get('MISSION')
    
    var scaleWaterTo = 'percentiles'
    // var scaleWaterTo = 'sigma'
  
    var scaleLandTo = 'percentiles'
    // var scaleLandTo = 'sigma'
  
    var rangePercentilesLand = [3, 97]
    var rangePercentilesWater = [3, 99]
    
    var rangeSigmaLand = [2, 2]
    var rangeSigmaWater = [1, 1]
    
    if(enhanceWater) {
      var water = ee.Image(i.get('water'))
      var nonWater = water.subtract(1).multiply(-1)
    
      i = i.select(bands).subtract(darkImage).max(0.0001)
    
      var iAll = i

      var water2 = gl.smoothstep(-0.05, 0.2, water)
      var nonWater2 = water2.subtract(1).multiply(-1)


      i = i.log()
    
      var stat1 = i
      
      stat1 = stat1.updateMask(water2.multiply(iAll.select('green').lt(greenMax)))
      
      if(scaleWaterTo === 'percentiles') {
        stat1 = stat1
          .reduceRegion({
            reducer: ee.Reducer.percentile(rangePercentilesWater), 
            geometry: bounds, 
            scale: scale * 3,
            maxPixels: 1e10
          })

        var min1 = [stat1.get(bands[0] + '_p' + rangePercentilesWater[0]), stat1.get(bands[1] + '_p' + rangePercentilesWater[0]), stat1.get(bands[2] + '_p' + rangePercentilesWater[0])]
        var max1 = [stat1.get(bands[0] + '_p' + rangePercentilesWater[1]), stat1.get(bands[1] + '_p'+ rangePercentilesWater[1]), stat1.get(bands[2] + '_p' + rangePercentilesWater[1])]
      }
      
      if(scaleWaterTo === 'sigma') {
        var stat1mean = stat1
          .reduceRegion({
              reducer: ee.Reducer.mean(), 
              geometry: bounds, 
              scale: scale * 3,
              maxPixels: 1e10
            })
          
        var stat1sigma = stat1
          .reduceRegion({
              reducer: ee.Reducer.stdDev(), 
              geometry: bounds, 
              scale: scale * 3,
              maxPixels: 1e10
            })
        var min1 = [
          ee.Number(stat1mean.get(bands[0])).subtract(ee.Number(stat1mean.get(bands[0])).multiply(rangeSigmaWater[0])), 
          ee.Number(stat1mean.get(bands[1])).subtract(ee.Number(stat1mean.get(bands[1])).multiply(rangeSigmaWater[0])), 
          ee.Number(stat1mean.get(bands[2])).subtract(ee.Number(stat1mean.get(bands[2])).multiply(rangeSigmaWater[0])), 
        ]
        var max1 = [
          ee.Number(stat1mean.get(bands[0])).add(ee.Number(stat1mean.get(bands[0])).multiply(rangeSigmaWater[1])), 
          ee.Number(stat1mean.get(bands[1])).add(ee.Number(stat1mean.get(bands[1])).multiply(rangeSigmaWater[1])), 
          ee.Number(stat1mean.get(bands[2])).add(ee.Number(stat1mean.get(bands[2])).multiply(rangeSigmaWater[1])), 
        ]
      }
  
      min1 = fixNull(min1, 0)
      max1 = fixNull(max1, 0.001)
    
      // land
      var stat2 = iAll.updateMask(nonWater2
        .multiply(iAll.select('green').lt(greenMax))
        //.multiply(weight)
      )
      
      if(scaleLandTo === 'percentiles') {
        stat2 = stat2
          .reduceRegion({
              reducer: ee.Reducer.percentile(rangePercentilesLand),
              geometry: bounds, 
              scale: scale * 3,
              maxPixels: 1e10
            })
        
        var min2 = [stat2.get(bands[0] + '_p' + rangePercentilesLand[0]), stat2.get(bands[1] + '_p' + rangePercentilesLand[0]), stat2.get(bands[2] + '_p' + rangePercentilesLand[0])]
        var max2 = [stat2.get(bands[0] + '_p' + rangePercentilesLand[1]), stat2.get(bands[1] + '_p'+ rangePercentilesLand[1]), stat2.get(bands[2] + '_p' + rangePercentilesLand[1])]
      }
      
      if(scaleLandTo === 'sigma') {
        var stat2mean = stat2
          .reduceRegion({
              reducer: ee.Reducer.mean(),
              geometry: bounds, 
              scale: scale * 3,
              maxPixels: 1e10
            })
        var stat2sigma = stat2
          .reduceRegion({
              reducer: ee.Reducer.stdDev(),
              geometry: bounds, 
              scale: scale * 3,
              maxPixels: 1e10
            })
  
        var min2 = [
          ee.Number(stat2mean.get(bands[0])).subtract(ee.Number(stat2mean.get(bands[0])).multiply(rangeSigmaLand[0])), 
          ee.Number(stat2mean.get(bands[1])).subtract(ee.Number(stat2mean.get(bands[1])).multiply(rangeSigmaLand[0])), 
          ee.Number(stat2mean.get(bands[2])).subtract(ee.Number(stat2mean.get(bands[2])).multiply(rangeSigmaLand[0])), 
        ]
        var max2 = [
          ee.Number(stat2mean.get(bands[0])).add(ee.Number(stat2mean.get(bands[0])).multiply(rangeSigmaLand[1])), 
          ee.Number(stat2mean.get(bands[1])).add(ee.Number(stat2mean.get(bands[1])).multiply(rangeSigmaLand[1])), 
          ee.Number(stat2mean.get(bands[2])).add(ee.Number(stat2mean.get(bands[2])).multiply(rangeSigmaLand[1])), 
        ]
      }
  
      min2 = fixNull(min2, 0)
      max2 = fixNull(max2, 0.001)
  
      // var visWater = { bands: bands, min: min1, max: max1, gamma: gammaWater }
      // var iWater = i.visualize(visWater)
      //   .updateMask(water2)

      var iWater = unitScale(i.select(bands), min1, max1)
        .updateMask(water2)
        
      
        
      // var waterEdges = ee.Algorithms.CannyEdgeDetector(
      //   i.select(bands[1])
      //     //.reduceNeighborhood(ee.Reducer.median(), ee.Kernel.circle(45, 'meters'))
      //     .unitScale(min2[1], ee.Number(max2[1]).add(0.001)), 
      //   0.001, 0
      // ).updateMask(i.select(bands[1]).mask().focal_min(1))
      
      //var waterEdges = i.convolve(ee.Kernel.gaussian(3, 2)).convolve(ee.Kernel.laplacian8(3))
      
      // var visLand = { bands: bands, min: min2, max: max2, gamma: gammaLand }
      // var iLand = iAll.visualize(visLand)
      //   .updateMask(nonWater2)

      var iLand = unitScale(iAll.select(bands), min2, max2)
         .updateMask(nonWater2)
      
      i = iWater.blend(iLand)
        .addBands(water.unitScale(-0.05, 0.15).rename('water'))
  
      // var s = scale
      // var r = 10
      // var sigma = 8
      
      // var waterEdges = i.convolve(ee.Kernel.gaussian(r, sigma, 'meters')).convolve(ee.Kernel.laplacian8(3)) // LoG
      
      // var waterEdges = iAll.select(bands).convolve(ee.Kernel.laplacian8())
  
      // i = i
      //   .set({ waterEdges: waterEdges })
        
      if(computeExpectation) {
        i = i
          .addBands(weight)
      }
    } else {
      i = i.subtract(darkImage).max(0.0001)
  
      var stat1 = i
    
      stat1 = stat1.updateMask(i.select('green').lt(greenMax))
  
      stat1 = stat1
        .reduceRegion({
              reducer: ee.Reducer.percentile(rangePercentilesLand),
              geometry: bounds, 
              scale: scale * 3,
              maxPixels: 1e10
            })
            
        
      var min1 = [stat1.get(bands[0] + '_p' + rangePercentilesLand[0]), stat1.get(bands[1] + '_p' + rangePercentilesLand[0]), stat1.get(bands[2] + '_p' + rangePercentilesLand[0])]
      var max1 = [stat1.get(bands[0] + '_p' + rangePercentilesLand[1]), stat1.get(bands[1] + '_p'+ rangePercentilesLand[1]), stat1.get(bands[2] + '_p' + rangePercentilesLand[1])]
  
      var vis = { bands: bands, min: min1, max: max1, gamma: gammaLand }
      
      i = i.visualize(vis)
  
      if(computeExpectation) {
        i = i
          .addBands(weight)
      }
    }  
  
    return i
      .set({ label: ee.Date(t).format().cat(', ').cat(mission) })
      .set({ 'system:time_start': t })
  })
  
  // print(images)
  
  // var waterEdges = images.map(function(i) {
  //   return ee.Image(i.get('waterEdges'))
  // }).sum()
  
  
  // var image = images.reduce(ee.Reducer.percentile([20]))
  // Map.addLayer(image, { min: 0, max: 255 }, 'RGB 20%', false)
  
  // mean = sum(w * x) / sum(w)        
  if(computeExpectation) {
    var image = images.map(function(i) {   
         return i.select(bands).multiply(i.select('weight')).addBands(i.select('water'))
    }).sum().divide(images.select('weight').sum())
    
    Map.addLayer(image.visualize(), { min: 0, max: 255 }, 'E[RGB]', visible)
    Map.addLayer(image.select('water'), { min: 0, max: 1 }, 'E[water]', false)
    
    var name = 'bathymetry_composite_' + start + '_' + stop + '_' + scale + 'm'
    var assetId = 'users/gena/eo-bathymetry/CableX-v3/' + name
    
    Export.image.toAsset({
      image: image, 
      description: name, 
      assetId: assetId, 
      region: geometry, 
      scale: scale, 
      crs: 'EPSG:3857',
      maxPixels: 1e10
    })
  
    // mean = sum(w * x) / sum(w)          
    // var image = images.map(function(i) {   
    //     return ee.Image(i.get('waterEdges')).multiply(i.select('weight'))
    // }).sum().divide(images.select('weight').sum())
    
    // Map.addLayer(image, { min: -0.001, max: 0.01 }, 'E[L]', false)
  } else {
    print(images.first())
    animation.animate(images, { label: 'label', maxFrames: 150 })
      .then(function() {
        var wrecks = ee.FeatureCollection('users/gena/wrecks')
        Map.addLayer(wrecks.style({ pointSize: 2, color: 'yellow', width: 1 }), {}, 'wrecks')
      })
  }
}


function generateMultipleImages() {
  var dates = ee.List.sequence(2015, 2019).map(function(year) {
    return ee.List.sequence(1, 12, 3).map(function(month) {
      var t = ee.Date.fromYMD(year, month, 1)
      return { start: t.format('YYYY-MM-dd'), stop: t.advance(2, 'year').format('YYYY-MM-dd') }
    })
  }).flatten()
  
  dates.evaluate(function(dates) {
    dates.map(function(d) {
      generateImage(d.start, d.stop, false)  
    })
  })
}

//generateMultipleImages()

generateImage('2017-01-01', '2020-01-01', true)  


