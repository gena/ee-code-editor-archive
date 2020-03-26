/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var aoi = /* color: #d63000 */ee.Geometry.Polygon(
        [[[-120.13781547546387, 39.37504697058432],
          [-120.13326644897461, 39.37929311183573],
          [-120.13790130615234, 39.38327363469453],
          [-120.13978944325117, 39.38479941281629],
          [-120.1413345336914, 39.389774667175914],
          [-120.15060424804688, 39.39063700353878],
          [-120.1517630200903, 39.38635855593795],
          [-120.16176223754883, 39.389907335002306],
          [-120.16674041013675, 39.38771853899016],
          [-120.17480850219727, 39.39083600272453],
          [-120.17910006403616, 39.39262694967846],
          [-120.17935749837363, 39.39013944402936],
          [-120.1768684387207, 39.38712125767802],
          [-120.17077445983887, 39.38141608560946],
          [-120.1620302615708, 39.37926011043577],
          [-120.15843618830496, 39.37750176036189],
          [-120.16395624778932, 39.37713692616395],
          [-120.16484137400715, 39.37584315724959],
          [-120.16903092535614, 39.37680519316466],
          [-120.17304889722294, 39.37723631349832],
          [-120.17478699690986, 39.374914202554706],
          [-120.17300605773926, 39.37259205235805],
          [-120.16356468200684, 39.36701840406483],
          [-120.15412330627441, 39.37060151475313],
          [-120.15176325507196, 39.37723632094731],
          [-120.14828681945801, 39.37703738145347],
          [-120.14463920832839, 39.37640716332671]]]),
    ned = ee.Image("USGS/NED"),
    occurrence = ee.Image("users/gena/water-occurrence-ProsserCreek-2000-01-01_2017-04-01"),
    locationFrameArea = /* color: #d63000 */ee.Geometry.LineString(
        [[-120.18073081970215, 39.39488219640592],
         [-120.13592720031738, 39.36628848860643]]),
    locationScalebar = /* color: #98ff00 */ee.Geometry.LineString(
        [[-120.14809121937822, 39.36731688906388],
         [-120.1389320095368, 39.3671510240225]]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
var bgWhite = ee.Image(1).visualize({palette:['202020']})

occurrence = occurrence.unmask().resample('bicubic')
  //.where(occurrence.unmask().gt(0.04).focal_min(4).focal_max(8).not(), 0)
  

'use strict';

// ============================= generated: imports.js
// ============================= generated: surface-water.js
/***
 * Surface water detection and reconstruction using multiple sensors:
 *  + Landsat 4 (30m)
 *  + Landsat 5 (30m)
 *  + Landsat 7 (15-30m)
 *  + Landsat 8 (15-30m)
 *  - Sentinel 1 (SAR, ~10-30m)
 *  + Sentinel 2 (10-20m)
 *  + ASTER (15m multispectral and 90m thermal)
 *  - PROBA-V (100m and 333m)
 *  - MODIS (250m Terra and Aqua)
 *
 * Author: Gennadii Donchyts
 * Credits: Ian Housman, Karis Tenneson, Carson Stam, Matt Hancher
 *
 */
 
var start = '1984-01-01';

//var start = '2017-01-01';
var stop = '2018-01-01';

//var start = '2016-06-11';
//var stop = '2016-06-12';

//var start = '2013-10-01';
//var stop = '2014-06-01';

//var start = '2016-10-01'; // S2 cloud
//var stop = '2016-10-15';


//var start = '2015-12-02';
//var stop = '2016-05-01';

//var start = '2015-12-03';
//var stop = '2015-12-04';


var suffix = ee.Date(new Date().getTime()).format('_YYYY-MM-dd_HH_mm').getInfo()

// incorrect estimate
//var start = '2016-07-14';
//var stop = '2016-07-15';

//var start = '2011-01-06';
//var stop = '2011-01-07';

//var start = '2011-04-12';
//var stop = '2011-04-13';

//var start = '2014-09-03';
//var stop = '2014-09-04';


//var start = '2012-01-16'; // snow
//var stop = '2012-01-17';

//var start = '2013-12-05';
//var stop = '2013-12-06';

// improved, L7 with snow
//var start = '2013-03-16';
//var stop = '2013-04-01';

//var start = '2013-12-21';
//var stop = '2013-12-22';

//var start = '2014-12-02';
//var stop = '2014-12-03';

//var start = '2014-07-17';
//var stop = '2014-07-18';

//var start = '2014-08-26';
//var stop = '2014-08-27';

//var start = '2015-04-25';
//var stop = '2015-04-26';

//var start = '2015-06-01';
//var stop = '2015-06-02';

//var start = '2015-06-12'; // S1, little visible
//var stop = '2015-06-13';

//var start = '2016-06-04'; // Sentinel-2, cloudy
//var stop = '2016-06-05'; // 

// s1 jump fixed, threshold 0.3 hack for SAR
//var start = '2016-09-10';
//var stop = '2016-09-12';

// s1
//var start = '2016-10-21';
//var stop = '2016-10-22';

// too high area
//var start = '2011-10-29';
//var stop = '2011-10-30';

// large area
//var start = '2011-08-10';
//var stop = '2011-08-11';

// large area, incorrect
//var start = '2009-01-23'
//var stop = '2009-01-24'

// BAD (snow)
//var start = '2009-12-18'
//var stop = '2009-12-19'

//var start = '2002-07-24'; // a bit too high
//var stop = '2002-07-25';


// almost empty
// var start = '1997-12-09';
// var stop = '1997-12-10';

// too large
//var start = '1997-12-25';
//var stop = '1997-12-26';

//var start = '2017-02-25';
//var stop = '2017-02-26';

// bad false-positives
//var start = '2009-04-06'
//var stop = '2009-04-07'

//var start = '2009-01-16'
//var stop = '2009-01-17'

//var start = '2016-01-12';
//var stop = '2016-01-13'; 

//var start = '2011-01-06';
//var stop = '2011-01-07'; 

//var start = '2015-12-21';
//var stop = '2015-12-22'; 

// large area
//var start = '2006-06-25';
//var stop = '2006-06-26';

// incompletely filled edges
//var start = '2011-09-03';
//var stop = '2011-09-04';

//var start = '2010-06-28';
//var stop = '2010-06-29';

//var start = '2011-11-22';
//var stop = '2012-11-23';

//var start = '2016-08-05';
//var stop = '2016-08-06'; 

//var start = '2016-10-02';
//var stop = '2016-10-03'; 

//var start = '2016-12-31';
//var stop = '2017-01-01';

// ASTER, partial
//var start = '2002-06-22';
//var stop = '2002-06-23';


// S1
//var start = '2015-01-31';
//var stop = '2015-02-01';


//var start = '2016-02-13';
//var stop = '2016-02-14';

//var start = '2006-02-09';
//var stop = '2006-02-10';

//var start = '2007-03-16';
//var stop = '2007-03-17';


//var start = '2015-04-25';
//var stop = '2015-04-26';

//var start = '1986-10-24';
//var stop = '1986-10-25';

var start = '1988-09-11';
var stop = '1988-09-12';

// default number of layers to show
var layerCount = 1;
var debug = true;

//var layerCount = 20;
//var debug = false

//var renderWater = false;
var renderWater = true;

var exportInfoOnly = false
//var exportInfoOnly = true

var updateEdgesWithDensity = true
var gapFilling = true;
var cloudFreeOnly = false;

//var updateEdgesWithDensity = false
//var gapFilling = false;
//var cloudFreeOnly = true;

var maskCouds = true
//var maskSnow = true
var maskSnow = false

var fixedThreshold = -1
//var fixedThreshold = 0

var cannyTh = 0.4
var cannySigma = 0.6

var scale = 30;
var errorMargin = 5 // scale * 0.5;

//aoi = ee.Geometry(Map.getBounds(true)).centroid(1)
//aoi = ee.Geometry(Map.getBounds(true)).bounds()
//aoi = ee.Geometry(Map.getBounds(true)).centroid(errorMargin).buffer(Map.getScale() * 200, ee.ErrorMargin(errorMargin))

// when true - use permanent water mask to zoom in to the reservoir within AOI area
//var usePermanentWaterMask = false
var usePermanentWaterMask = true;

// number of processed images to add for inspection (water detection, count per asset)
var mapLayerCountToAddProcessed = debug ? layerCount : 0;

// number of rendered frames to added before video export
var mapLayerCountToAddRendered = debug ? 0 : layerCount;

// where to perform analysis (focal area), defined around permanent water / AOI
var focusSearchDistance = 500;
var focusSmoothDistance = 1000;

var only = [
    //'ASTER',
    //'Landsat 8',
    //'Landsat 7',
    //'Landsat 5',
    //'Landsat 4',
    //'Sentinel 2',
    //'ASTER T',
    //'PROBA-V 100m',
    //'PROBA-V 333m',
    //'MODIS Aqua MYD09GQ',
    //'MODIS Terra MOD09GQ',
    //'Sentinel 1 VV',
    //'Sentinel 1 VH',
    //'Sentinel 1 VV+VH',
    //'Sentinel 1 HH+HV',
];

var skip = ['ASTER T',
// 'ASTER',
// 'Landsat 8',
// 'Landsat 7',
// 'Landsat 5',
// 'Landsat 4',
// 'Sentinel 2',

// 'Sentinel 1 VV',
// 'Sentinel 1 VH',
// 'Sentinel 1 VV+VH',


'Sentinel 1 HH+HV', // coarser

'PROBA-V 100m', 'PROBA-V 333m', 'MODIS Aqua MYD09GQ', 'MODIS Terra MOD09GQ'];

// permanent water mask, potential water, water occurrence
var glcf = ee.ImageCollection('GLCF/GLS_WATER');
var waterMaskPermanent = glcf.map(function (i) {
    return i.eq(2);
}).sum().gt(0);

// potential maximum water extent
var waterMaskPermanentVector = void 0;

var analysisExtent = void 0;
var focusNearWater = void 0;

if (usePermanentWaterMask) {
    // focus around permanent water
    waterMaskPermanentVector = waterMaskPermanent.mask(waterMaskPermanent).reduceToVectors({ geometry: aoi.buffer(focusSearchDistance), scale: errorMargin });

    // add transparent edge
    analysisExtent = ee.FeatureCollection([aoi.buffer(focusSearchDistance)]);

    var nearWater = waterMaskPermanent.clip(analysisExtent).focal_max(focusSearchDistance, 'circle', 'meters').distance(ee.Kernel.euclidean(focusSmoothDistance, 'meters'), false);
    nearWater = ee.Image(focusSmoothDistance).subtract(nearWater).divide(focusSmoothDistance).unmask();
    focusNearWater = nearWater.reproject('EPSG:3857', null, 120);
} else {
    // focus near user-defined AOI
    waterMaskPermanentVector = ee.FeatureCollection([aoi.buffer(focusSearchDistance)]);

    analysisExtent = ee.FeatureCollection([aoi.buffer(focusSearchDistance)]);
    focusNearWater = ee.Image().float().paint(analysisExtent, 1).unmask();
}
var b = Map.getBounds();

print('Map w/h ratio: ', (b[2] - b[0]) / (b[3] - b[1]));
print('Error margin: ', errorMargin);
print('Date range: ' + start + '..' + stop);

//Map.centerObject(aoi, 14)

Map.setOptions('HYBRID');



/***
 * Makes offset from the left bounds Geometry margin and splits into count pieces, returns locations.
 */
function getMarginLocations(bounds, margin, marginSize, count, scale) {
    var marginSize = ee.Number(marginSize).multiply(scale);
    var boundsSmall = bounds.buffer(marginSize.multiply(-1)).bounds();
    var coords = ee.List(boundsSmall.coordinates().get(0));
    
    if(margin === 'left') {
      var pt0 = ee.List(coords.get(0));
      var pt1 = ee.List(coords.get(3));
    } else if(margin === 'right') {
      var pt0 = ee.List(coords.get(1));
      var pt1 = ee.List(coords.get(2));
    }

    var marginLine = ee.Geometry.LineString([pt0, pt1]);

    var distances = ee.List.sequence(0, marginLine.length(), marginLine.length().divide(count));

    var lineToFirstPoint = function lineToFirstPoint(g) {
        var coords = ee.Geometry(g).coordinates().get(0);
        return ee.Feature(ee.Algorithms.GeometryConstructors.Point(coords));
    };

    var points = ee.FeatureCollection(marginLine.cutLines(distances).geometries().map(lineToFirstPoint));

    //Map.addLayer(points, {color: 'green'}, 'text locations')

    return points.toList(count).map(function (o) {
        return ee.Feature(o).geometry();
    });
}


/*** 
 * Fill missing pixels
 */
function fillMissingWater(i, snowMask, cloudMask, imageMask, edges, pmin, pmax) {
  // detect edge using eroded water mask - avoid overestimation
  var i2 = i.unmask(0, false)
    .focal_min(15, 'square', 'meters')
  
  var edge = edges
  // var edge = getEdge(i2)
  
  edge = edge.unmask()
    .multiply(i.mask().focal_min(35, 'square', 'meters')) // remove boundary edges  
    .focal_max(15, 'square', 'meters') // buffer edges, to avoid wrong intersection 

  pmin = pmin || 35
  pmax = pmax || 45
  
  if(debug) {
    Map.addLayer(edge.focal_max(2).mask(edge.focal_max(2)), {palette:['ffff00']}, 'edge, cleaned', false)
    
    var e = getEdge(i.unmask().eq(1))
    Map.addLayer(e.mask(e), {palette:['ffffff']}, 'water edge, original', false)
  }

  var expectedWaterReducer = ee.Reducer.intervalMean(pmin, pmax)
  //var expectedWaterReducer = ee.Reducer.median()
  //var expectedWaterReducer = ee.Reducer.mode()

  // estimate fill area (compute posterior)
  var occurrenceExpected = occurrence.mask(edge).reduceRegion(
    {reducer:expectedWaterReducer, geometry: aoi, scale: scale, maxPixels: 1e13}
    ).values().get(0)
    
  occurrenceExpected = ee.Algorithms.If(
      ee.Algorithms.IsEqual(occurrenceExpected, null), 
      0, 
      occurrenceExpected)

  // fix for zero value, fallback to water edge
  occurrenceExpected = ee.Algorithms.If(
    ee.Algorithms.IsEqual(occurrenceExpected, 0),
    occurrence.mask(getEdge(i.unmask().eq(1))).reduceRegion({reducer:ee.Reducer.intervalMean(0, 15), geometry: aoi, scale: scale, maxPixels: 1e13}).values().get(0),
    occurrenceExpected
  )
  
  if(debug) {
    print('Occurrence expected: ', occurrenceExpected)
  }

/*
  var expectedWaterReducer = ee.Reducer.median()

  // estimate fill area (compute posterior)
  var occurrenceExpected = occurrence.mask(i).reduceRegion(
    {reducer:expectedWaterReducer, geometry: aoi, scale: scale, maxPixels: 1e13}
    ).values().get(0)

*/      
  //return ee.Feature(null, {'occurrence': occurrenceExpected})
  
  //return ee.Image.constant(occurrenceExpected).float().set('occurrence', occurrenceExpected)  
  //return i.set('occurrence', occurrenceExpected)
  
  occurrenceExpected = ee.Number(ee.Algorithms.If(ee.Algorithms.IsEqual(occurrenceExpected, null), 2, occurrenceExpected))
  occurrenceExpected = ee.Number(ee.Algorithms.If(occurrenceExpected.lte(0), 0.001, occurrenceExpected))
  // occurrenceExpected = ee.Number(ee.Algorithms.If(occurrenceExpected.gt(0.95), 0.95, occurrenceExpected))
  occurrenceExpected = ee.Number(occurrenceExpected)// .max(ee.Number(0.03))
  
  if(debug) {
    print('Occurrence expected: ', occurrenceExpected)
  }
  
  var occurrenceEdge = occurrence.subtract(ee.Image.constant(occurrenceExpected)).zeroCrossing()
  occurrenceEdge = occurrenceEdge.mask(occurrenceEdge)
  
  var cutoff = 0 //0.034

  var bg = occurrence.lte(cutoff)

  //var occurrenceUpdated = ee.Image(1).subtract(occurrence.unitScale(cutoff, occurrenceExpected))
  var occurrenceUpdated = occurrence.subtract(occurrenceExpected).abs()
  
  var edgeMargin = 0.1 // probability margin 
  
  var occurrenceUpdatedMax = ee.Number(occurrenceUpdated.reduceRegion(ee.Reducer.max(), aoi, scale).values().get(0));
  occurrenceUpdatedMax = occurrenceUpdatedMax.min(edgeMargin)
  
  //occurrenceUpdated = occurrenceUpdated.unitScale(0, occurrenceUpdatedMax)//.pow(2) // +/- 15%
  occurrenceUpdated = occurrenceUpdated.divide(occurrenceUpdatedMax)
  occurrenceUpdated = ee.Image(1).subtract(occurrenceUpdated).multiply(occurrence.gt(0))

  if(debug) {
    Map.addLayer(occurrenceUpdated.mask(occurrenceUpdated), {min:0, max:1, palette:['e5f5e0', 'a1d99b','31a354']}, 'occurrenceUpdated', false, 0.7)
  }

  var occurrenceUpdatedRange = occurrenceUpdated.gt(0)
    //.focal_max(30, 'circle', 'meters')


  /*
  var posterior = occurrence.gt(ee.Image.constant(occurrenceExpected))
  var filled = posterior.and(i.unmask(0, false).not())
  filled = filled.mask(filled)
  */
  
  var filled = occurrence.unmask(0, false).gte(occurrenceExpected) // probability is greater than expected
    .multiply(
        occurrenceUpdatedRange.not() // no fill-in within confusion zone
        .or(cloudMask.unmask()) // except if there are clouds
        .or(imageMask.unmask().not()) // except if image is missing
        //.or(snowMask.unmask()) // except if there is snow
      ) 
      
    .multiply(i.unmask(0, true).not()) // water is not present
    
    Map.addLayer(cloudMask.unmask())



/*  var filled = posterior.and(
	      i.unmask(0, false).not() // fill-in if there is no water
	 	        .and(
 	            occurrenceUpdatedRange.multiply(posterior.not()).not() // no fill within margin
 	            .add(imageMask.unmask().not().or(cloudMask.unmask())) // except for missing
 	        ) 
 	    )
*/  

  filled = filled.mask(filled)  
    

  if(debug) {
    Map.addLayer(occurrenceUpdatedRange.mask(occurrenceUpdatedRange), {}, 'occurrenceUpdatedRange', false, 0.7)
  }

  
  var bad = occurrence.unmask(1, false)
    .lt(occurrenceExpected) // probability is smaller than expected
    .multiply(occurrenceUpdatedRange.not()) // outside of confusion zone
    .multiply(i.unmask(0, true)) // water is present

/*  var bad = occurrence.unmask(1, false).lt(occurrenceExpected)
	 	    .multiply(
	 	          occurrenceUpdatedRange.multiply(posterior).not() // no fill within margin
	 	          .add(imageMask.not().or(cloudMask)) // except for missing
	 	        )
	    .multiply(i.unmask(0, true))  
*/
  bad = bad.updateMask(bad)
  
  
  var originalArea = ee.Image.pixelArea().mask(i)
    .reduceRegion(ee.Reducer.sum(), aoi, scale).values().get(0);

  var expectedArea = ee.Image.pixelArea().mask(
      i.unmask(0, false)
        .or(filled.mask())
        .multiply(bad.mask().not())
    )
    .reduceRegion(ee.Reducer.sum(), aoi, scale).values().get(0);

  var filledArea = filled.mask()
    .reduceRegion(ee.Reducer.sum(), aoi, scale).values().get(0);

  var badArea = bad.mask().multiply(i)
    .reduceRegion(ee.Reducer.sum(), aoi, scale).values().get(0);

  if(debug) {
    Map.addLayer(occurrenceEdge, {palette:['31a354'], forceRgbOutput: true}, 'occurrence edge', false)

    Map.addLayer(bad, {palette:['ff0000'], forceRgbOutput: true}, 'bad', false, 0.4)
    Map.addLayer(filled, {palette:['ffff00'], forceRgbOutput: true}, 'filled', false, 0.4)

      // bad.visualize({palette: ['ffffff'], forceRgbOutput: true}),

    Map.addLayer(i.mask(i), {}, 'water area original', false)
    
    var i3 = i.unmask(0, false).or(filled.mask()).multiply(bad.unmask().not())
    Map.addLayer(i3.mask(i3), {}, 'water area expected', false)
  }
  

  var waterNew = i.unmask(0, false).or(filled.mask()).multiply(bad.unmask().not())

  var waterEdgeImage = getEdge(waterNew);
  
  var waterEdgeImageOriginal = getEdge(i.unmask(0, false))
  
  var waterEdgeVis = waterEdgeImage.mask(waterEdgeImage).visualize({ palette: 'ffffff', forceRgbOutput: true })
  
  if(exportInfoOnly) {
    return waterNew.mask(waterNew).visualize({palette: ['3182bd'], opacity:0.8})
          .set('expected_area', expectedArea)
          .set('filled_area', filledArea)
          .set('bad_area', badArea)
          .set('water_edge_vis', waterEdgeVis)
  }

  var paletteMargin = ['ffffcc', 'c2e699', '78c679', '31a354', '006837']
  var paletteExpected = ['006837']
  
  var paletteMargin = ['2ca25f']
  var paletteExpected = ['2ca25f']
  

  return ee.ImageCollection([
      //water 
      //waterNew.mask(waterNew).visualize({palette: ['3182bd'], opacity:0.8}),

      // waterEdgeImageOriginal.mask(waterEdgeImageOriginal).visualize({ palette: '00ff00', opacity: 0.4, forceRgbOutput: true }),

      
      // margin
      occurrenceUpdated.mask(occurrenceUpdated).visualize({min:0, max:1, opacity:0.85, palette:paletteMargin}),
      //occurrenceEdge.visualize({palette:paletteExpected, forceRgbOutput: true}),
      //ee.Image(1).mask(occurrenceUpdatedRange).visualize({min:0, max:1, opacity: 0.3, palette:['ff00ff']}),
      
      bad.visualize({palette: ['ff0000'], opacity: 0.5}),
      filled.visualize({palette: ['ffff00'], opacity: 0.5}),
      cloudMask.mask(cloudMask).visualize({palette: ['ff00ff'], opacity: 0.2}),

      //occurrenceEdge.visualize({palette:['31a354'], forceRgbOutput: true}),
      waterEdgeVis
      ]).mosaic()
        .set('expected_area', expectedArea)
        .set('filled_area', filledArea)
        .set('bad_area', badArea)
        .set('water_edge_vis', waterEdgeVis)

  //return posterior
}



var app = function app() {
      // add frame and scalebar
    

    var frame = new Frame(locationFrameArea.bounds(), {steps:5, size:4, format: '%.3f', showLeft: true, showBottom: true}).draw()
    var scalebar = Scalebar.draw(locationScalebar, {steps:2, palette: ['5ab4ac', 'f5f5f5'], multiplier: 1, format: '%.0f', units: 'm'})

    var translateParams = {x: 5250, y: 0, units: 'meters', proj: 'EPSG:3857'}

    var frame2 = new Frame(locationFrameArea.bounds(), {steps:5, size:4, format: '%.3f'}).draw()
      .translate(translateParams)
    
    var bg = ee.Image(1).clip(locationFrameArea.bounds())
    bg = bg.mask(bg.mask().not())

    // the actual number of image collections, used for progress
    var collectionCount = collections.length;

    if (only.length > 0) {
        collectionCount = only.length;
    } else {
        collectionCount = collectionCount - skip.length;
    }

    function exportRendered() {
        // export all images video
        renderedImagesAll = renderedImagesAll.sort('system:time_start');

        //renderedImagesAll = renderedImagesAll.filter(ee.Filter.gt('expected_area', 0));

        //print('Total rendered: ', renderedImagesAll.aggregate_count('system:id'))

        // add to map
        mapLayerCountToAddRendered = Math.min(totalImageCount, mapLayerCountToAddRendered);

        var list = renderedImagesAll.toList(mapLayerCountToAddRendered, 0);
        for (var i = 0; i < mapLayerCountToAddRendered; i++) {
            var image = ee.Image(list.get(i));
            Map.addLayer(image, {}, 'frame ' + i, i < 5);
            pushLayer(image, ee.Dictionary(image.get('collection')).get('name'));
        }

        var resolutionW = 1920;
        var fps = 1;
        var name = 'multisensor-3-cloudfree-';

        function exportWithoutText() {
            Export.video.toDrive({
                collection: renderedImagesAll,
                description: name + start + '_' + stop + '_fps' + fps + suffix,

                dimensions: resolutionW,
                region: ee.Geometry(Map.getBounds(true)),
                framesPerSecond: fps,
                crs: 'EPSG: 3857',
                maxFrames: 2000
            });
        }

        exportWithoutText();

        function exportWithText() {
            var textScale = Map.getScale() * 2;
            var textBounds = ee.Geometry(Map.getBounds(true));
            var textMarginSize = 20; // scale units
            var textLocationCount = 20;
            var textLocations = getLeftMarginLocations(textBounds, textMarginSize, textLocationCount, textScale);

            // add to rendered (for export)
            function renderWithText(i) {
                var collection = ee.Dictionary(i.get('collection'));

                var startTime = i.get('system:time_start');
                startTime = i.get('system:id');

                var str = ee.Date(startTime).format('YYYY-MM-dd HH:MM');
                var pt1 = textLocations.get(0);
                var textDate = Text.draw(str, pt1, textScale, {
                    outlineColor: '000000',
                    outlineWidth: 3,
                    outlineOpacity: 0.6,
                    fontSize: 16,
                    textColor: 'white'
                });

                var pt2 = textLocations.get(3);
                var textSensor = Text.draw(collection.get('name'), pt2, textScale, {
                    outlineColor: '000000',
                    outlineWidth: 3,
                    outlineOpacity: 0.6,
                    fontSize: 16,
                    textColor: 'white'
                });

                //let permenentWaterEdgeBg = waterMaskEdge.focal_max(2)
                //permenentWaterEdgeBg = permenentWaterEdgeBg.mask(permenentWaterEdgeBg).visualize({palette: ['000000'], opacity:0.5})
                //let permenentWaterEdge = waterMaskEdge.mask(waterMaskEdge).visualize({palette: ['ffffff']})

                var rendered = ee.ImageCollection.fromImages([i,
                //permenentWaterEdgeBg,
                //permenentWaterEdge,
                textDate, textSensor]).mosaic().set('system:time_start', startTime).set('collection', collection).set('system:id', id);

                rendered = rendered.copyProperties(i);

                return rendered;
            }

            var renderedImagesAll = renderedImagesAll.map(renderWithText);

            Export.video.toDrive({
                collection: renderedImagesAll,
                description: name + start + '_' + stop + '-text' + '_fps' + fps + suffix,

                dimensions: resolutionW,
                region: ee.Geometry(Map.getBounds(true)),
                framesPerSecond: fps,
                crs: 'EPSG: 3857',
                maxFrames: 2000
            });
        }

        // exportWithText()

        var map = ee.Feature(ee.Geometry(Map.getBounds(true)), {});
        Export.table.toDrive({
            collection: ee.FeatureCollection(map),
            description: name + start + '_' + stop + '_extent' + suffix,
            fileFormat: 'GeoJSON'
        });

        var features = ee.FeatureCollection(renderedImagesAll);
        Export.table.toDrive({
            collection: features,
            description: name + start + '_' + stop + '_info' + suffix,
            fileFormat: 'GeoJSON'
        });

        // update dates
        updateLayerNames();
    }

    function addBaseLayers() {
        // lake and reservoir locations retrieved from USGS NWIS: http://maps.waterdata.usgs.gov/mapper/nwisquery.html?URL=http://waterdata.usgs.gov/usa/nwis/current?type=lake&format=sitefile_output&sitefile_output_format=xml&column_name=agency_cd&column_name=site_no&column_name=station_nm&column_name=site_tp_cd&column_name=dec_lat_va&column_name=dec_long_va&column_name=agency_use_cd
        var reservoirs = ee.FeatureCollection('ft:1POcfYkRBhBSZIbnrNudwnozHYtpva9vdyYBMf5QZ');

        var index = 3;
        var reservoir = ee.Feature(reservoirs.toList(1, index).get(0));

        Map.addLayer(reservoirs, { color: 'ff0000', opacity: 0.7 }, 'USA reservoirs and lakes locations', false);

        // add permanent watermask
        Map.addLayer(waterMaskPermanent.mask(waterMaskPermanent), {
            palette: ['0000aa'],
            opacity: 0.2
        }, 'permanent mask water (GLCF)', false);

        Map.addLayer(waterMaskPermanentVector, {
            palette: ['0000aa'],
            opacity: 0.2
        }, 'permanent mask water vector (GLCF)', false);

        var waterMaskPermanentEdge = ee.Algorithms.CannyEdgeDetector(waterMaskPermanent, 0.99);
        Map.addLayer(waterMaskPermanentEdge.mask(waterMaskPermanentEdge), { palette: ['ffffff'] }, 'permanent water mask edge (GLCF)', false);

        // focus on the images near water
        Map.addLayer(focusNearWater.mask(focusNearWater.subtract(1).multiply(-1)), {
            min: 0,
            max: 1,
            palette: ['000000']
        }, 'potential water focus', false, 0.3);

        //Map.centerObject(reservoir, 13)
        Map.addLayer(aoi, {}, 'aoi', false);
    }

    // UI

    // add progress label
    function updateProgress() {
        var progressLabel = ui.Label({
            value: 'Scanning image collections ' + processedCount + ' of ' + collectionCount,
            style: { fontWeight: 'bold', fontSize: '12px', margin: '10px 5px' }
        });

        progressPanel.clear();
        progressPanel.add(progressLabel);
    }

    var processedCount = 0;
    var progressPanel = ui.Panel();
    Map.add(progressPanel);
    updateProgress();

    // keep layer info in order to update layer names async
    var layerInfos = [];

    function pushLayer(image, text) {
        var layers = Map.layers();
        layerInfos.push({ image: image, text: text, layer: layers.get(layers.length() - 1) });
    }

    // updates layer names at the end (async), add date
    function updateLayerName(layerInfo) {
        function onGetDate(date, error) {
            if (layerInfo.text) {
                ee.String(layerInfo.text).getInfo(function (text) {
                    layerInfo.layer.setName(layerInfo.layer.getName() + ' ' + date + ' ' + text);
                });
            } else {
                layerInfo.layer.setName(layerInfo.layer.getName() + ' ' + date);
            }
        }

        ee.Date(layerInfo.image.get('system:time_start')).format('YYYY-MM-dd HH:mm').getInfo(onGetDate);
    }

    function updateLayerNames() {
        layerInfos.map(updateLayerName);

      Map.addLayer(occurrence.mask(occurrence.gt(0)), {palette:['ffffff', '0000ff'], forceRgbOutput: true}, 'occurrence', false)
    }

    // update progress and add base layers
    var totalImageCount = 0;

    function onProcessed(collection) {
        processedCount++;
        updateProgress();

        if (processedCount == collectionCount) {
            Map.remove(progressPanel);

            exportRendered();
            addBaseLayers();

            print('Total images found: ' + totalImageCount);
        }
    }

    // all rendered images from all sensors
    var renderedImagesAll = ee.ImageCollection([]);

    // process image collection (add layers, export, query)
    function processImages(collection) {
        if (only.length && only.indexOf(collection.name) === -1) {
            return;
        }

        if (skip.indexOf(collection.name) != -1) {
            return;
        }

        // print number of images at AOI
        var images = ee.ImageCollection(collection.asset).filterBounds(aoi).select(collection.bands.native, collection.bands.readable).map(function (i) {
            return i.set('bounds', aoi);
        });

        if (collection.filter) {
            images = images.filter(collection.filter);
        }

        if (start && stop) {
            images = images.filterDate(start, stop);
        }

        // BUT: EE does image footprints are not alway correct, make sure we have images with values
        images = images.map(function (image) {
            var value = ee.Dictionary(image.select(collection.visual.bands[0]).reduceRegion(ee.Reducer.firstNonNull(), aoi, 100)).values().get(0);
            return image.set('aoi_value', value);
            //.updateMask(focusNearWater)
        }).filter(ee.Filter.neq('aoi_value', null));

        // apply addition transform if needed
        if (collection.transform) {
            images = images.map(collection.transform);
        }

        renderedImagesAll = renderedImagesAll.merge(images.map(function (i) {
            var rendered = i.visualize(collection.visual).set('collection', collection).set('system:time_start', i.get('system:time_start')).set('system:id', i.get('system:id'));

/*
            var output = collection.algorithms.detectWater(i, collection)
            var waterVector = ee.FeatureCollection(output.waterMask);
            var waterImage = ee.Image(0).byte().paint(waterVector, 1)

            return ee.ImageCollection([
                    rendered, 
                    waterImage.mask(waterImage).visualize({palette:['0000ff'], opacity:0.5})
            ]).mosaic();
*/
            if (renderWater && !debug) {
                // add water edge on top
                var output = collection.algorithms.detectWater(i, collection)
                
                var waterVector = ee.FeatureCollection(output.waterMask);

                var waterImage = ee.Image(0).byte().paint(waterVector, 1)
                
                waterImage = waterImage.updateMask(output.imageMask)


                // estimate filled pixels
                if(gapFilling) {
                    var waterImageVis = ee.Image(ee.Algorithms.If(
                      ee.Algorithms.IsEqual(waterVector.geometry().area(scale), 0),
                      ee.Image().visualize({forceRgbOutput: true}),
                      fillMissingWater(waterImage, output.snowMask, output.cloudMask, output.imageMask, output.edges)
                    ))
                } else {
                  //var waterEdgeImage = ee.Image(0).byte().paint(waterVector, 1, 1);
                  var waterImageVis = waterImage.mask(waterImage).visualize({ palette: '0000ff', opacity:0.5, forceRgbOutput: true })
                }

                var str = ee.String('Time: ').cat(ee.Date(i.date()).format('YYYY-MM-dd HH:MM'));

                var leftMargin = getMarginLocations(aoi.bounds(), 'left', 5, 15, Map.getScale()) 
                var pt1 = leftMargin.get(1)

                var textDate = Text.draw(str, pt1, Map.getScale(), {
                    outlineColor: '000000',
                    outlineWidth: 3,
                    outlineOpacity: 0.6,
                    fontSize: 18,
                    textColor: 'white'
                });
              
                // area
                // var str = ee.String(occurrenceExpected)
                var expectedArea = waterImageVis.get('expected_area')
                expectedArea = ee.Algorithms.If(ee.Algorithms.IsEqual(expectedArea, null), 0, expectedArea)
                var strArea = ee.String('Area: ').cat(ee.Number(expectedArea).multiply(0.0001).format('%.2f').cat(' ha'))
                
                var leftMargin = getMarginLocations(aoi.bounds(), 'left', 5, 10, Map.getScale()) 
                var pt1 = leftMargin.get(2)
          
                var textArea = Text.draw(strArea, pt1, Map.getScale(), {
                    outlineColor: '000000',
                    outlineWidth: 3,
                    outlineOpacity: 0.6,
                    fontSize: 18,
                    textColor: 'white'
                });

                var expectedAreaFraction = ee.Algorithms.If(
                  ee.Algorithms.IsEqual(waterImageVis.get('expected_area'), null),
                  0,
                  waterVector.geometry().area(ee.ErrorMargin(errorMargin)).divide(waterImageVis.get('expected_area'))
                )

                if(exportInfoOnly) {
                  return rendered
                    .copyProperties(waterVector)
                    .set('collection', collection)
                    .set('system:time_start', i.get('system:time_start'))
                    .set('system:id', i.get('system:id'))
                    .set('water_area', waterVector.geometry().area(ee.ErrorMargin(errorMargin)))
                    .set('expected_area', waterImageVis.get('expected_area'))
                    .set('filled_area', waterImageVis.get('filled_area'))
                    .set('bad_area', waterImageVis.get('bad_area'))
                    .set('expected_area_fraction', expectedAreaFraction)
                    .set('asset', collection.nameShort)
                }

                rendered = ee.ImageCollection([
                    bgWhite,
                    rendered, 
                    //waterImageVis.get('water_edge_vis'),
                    
                    // old water 
                    //ee.Image(1).mask(getEdge(waterImage)).visualize({palette:['ffffff']}),
                    
                    frame,
                    scalebar,
                    textDate,
                    textArea,
                    
                    
                    bgWhite.clip(locationFrameArea.bounds()).translate(translateParams),
                    rendered.clip(locationFrameArea.bounds()).translate(translateParams),
                    waterImageVis.clip(locationFrameArea.bounds()).translate(translateParams),
                    frame2,
                    
                    //waterImageVis
                  ]).mosaic();
                  
                return rendered
                  .copyProperties(waterVector)
                  .set('collection', collection)
                  .set('system:time_start', i.get('system:time_start'))
                  .set('system:id', i.get('system:id'))
                  .set('water_area', waterVector.geometry().area(ee.ErrorMargin(errorMargin)))
                  .set('expected_area', waterImageVis.get('expected_area'))
                  .set('filled_area', waterImageVis.get('filled_area'))
                  .set('bad_area', waterImageVis.get('bad_area'))
                  .set('expected_area_fraction', expectedAreaFraction)
                  .set('asset', collection.nameShort)
            } else {
                return rendered.copyProperties(i).set('collection', collection).set('system:time_start', i.get('system:time_start')).set('system:id', i.get('system:id'));
            }
        }));

        if (cloudFreeOnly) {
            renderedImagesAll = renderedImagesAll.filter(ee.Filter.and(ee.Filter.lt('cloud_pixels', 10), ee.Filter.gt('water_area', 100), ee.Filter.lt('snow_pixels', 10), ee.Filter.eq('nodata_pixels', 0)));
        }
        
        // filter-out bad images
        renderedImagesAll = renderedImagesAll
          .filter(ee.Filter.and(
              //ee.Filter.lt('cloud_pixels', 10), 
              ee.Filter.gt('water_area', 100), 
              ee.Filter.gt('expected_area_fraction', 0.01)
              //ee.Filter.lt('snow_pixels', 10), 
              //ee.Filter.eq('nodata_pixels', 0)
          ));

        // add to map (client, async)
        function processOnCount(count, error) {
            print(collection.name + ': ', count);

            if (count === 'undefined') {
                onProcessed(collection);
                return;
            }

            totalImageCount += count;

            // add a few layers
            var layerCount = Math.min(mapLayerCountToAddProcessed, count);
            var list = images.toList(layerCount, 0);
            for (var i = 0; i < layerCount; i++) {
                var image = ee.Image(list.get(i));
                Map.addLayer(image, collection.visual, collection.name + ' ' + i, i === 0);

                pushLayer(image, collection.name);

                if (collection.algorithms.onLayerAdd && debug) {
                    collection.algorithms.onLayerAdd(image, collection);
                }
            }

            onProcessed(collection);
        }

        var count = images.select(0).aggregate_count('system:id');
        count.getInfo(processOnCount);
    }

    collections.map(processImages);
};

// ============================= generated: utils.js
/***
 * Returns distinct values
 * @param values
 * @returns {Array}
 */
function distinct(values) {
    var unique = [];

    values.map(function (o) {
        if (unique.indexOf(o) === -1) {
            unique.push(o);
        }
    });

    return unique;
}

/***
 * Basic queue
 */
function Queue() {
    this.items = [];

    this.dequeue = function () {
        return this.items.pop();
    };

    this.enqueue = function (item) {
        this.items.unshift(item);
    };

    this.length = function () {
        return this.items.length;
    };
}

var Palettes = {
    water: ['f7fbff', 'deebf7', 'c6dbef', '9ecae1', '6baed6', '4292c6', '2171b5', '08519c', '08306b']
};

function getEdge(mask) {
    var canny = ee.Algorithms.CannyEdgeDetector(mask, 0.99, 0);
    return canny.mask(canny);
}

// rescales to given ranges
var rescale = function rescale(img, exp, thresholds) {
    return img.expression(exp, { img: img }).subtract(thresholds[0]).divide(thresholds[1] - thresholds[0]);
};

// used as aside function for debugging
var show = function show(image, name, vis) {
    if (debug) {
        Map.addLayer(image, vis || {}, '  ' + name, false);
    }

    return image;
};

// Return the DN that maximizes interclass variance in B5 (in the region).
var otsu = function otsu(histogram) {
    histogram = ee.Dictionary(histogram);

    var counts = ee.Array(histogram.get('histogram'));
    var means = ee.Array(histogram.get('bucketMeans'));
    var size = means.length().get([0]);
    var total = counts.reduce(ee.Reducer.sum(), [0]).get([0]);
    var sum = means.multiply(counts).reduce(ee.Reducer.sum(), [0]).get([0]);
    var mean = sum.divide(total);

    var indices = ee.List.sequence(1, size);

    // Compute between sum of squares, where each mean partitions the data.
    var bss = indices.map(function (i) {
        var aCounts = counts.slice(0, 0, i);
        var aCount = aCounts.reduce(ee.Reducer.sum(), [0]).get([0]);
        var aMeans = means.slice(0, 0, i);
        var aMean = aMeans.multiply(aCounts).reduce(ee.Reducer.sum(), [0]).get([0]).divide(aCount);
        var bCount = total.subtract(aCount);
        var bMean = sum.subtract(aCount.multiply(aMean)).divide(bCount);
        return aCount.multiply(aMean.subtract(mean).pow(2)).add(bCount.multiply(bMean.subtract(mean).pow(2)));
    });

    // Return the mean value corresponding to the maximum BSS.
    return means.sort(bss).get([-1]);
};

/***
 * Anisotrophic diffusion (Perona-Malik filter). * Solves diffusion equation numerically using convolution:
 * I(n+1, i, j) = I(n, i, j) + lambda * (cN * dN(I) + cS * dS(I) + cE * dE(I), cW * dW(I))
 */
var removeSpeckleNoisePeronaMalik = function removeSpeckleNoisePeronaMalik(I, iter, K, opt_method) {
    var method = opt_method || 1;

    var dxW = ee.Kernel.fixed(3, 3, [[0, 0, 0], [1, -1, 0], [0, 0, 0]]);

    var dxE = ee.Kernel.fixed(3, 3, [[0, 0, 0], [0, -1, 1], [0, 0, 0]]);

    var dyN = ee.Kernel.fixed(3, 3, [[0, 1, 0], [0, -1, 0], [0, 0, 0]]);

    var dyS = ee.Kernel.fixed(3, 3, [[0, 0, 0], [0, -1, 0], [0, 1, 0]]);

    var lambda = 0.2;

    var k1 = ee.Image(-1.0 / K);
    var k2 = ee.Image(K).multiply(ee.Image(K));

    for (var i = 0; i < iter; i++) {
        var dI_W = I.convolve(dxW);
        var dI_E = I.convolve(dxE);
        var dI_N = I.convolve(dyN);
        var dI_S = I.convolve(dyS);

        var cW = void 0;
        var cE = void 0;
        var cN = void 0;
        var cS = void 0;
        if (method === 1) {
            cW = dI_W.multiply(dI_W).multiply(k1).exp();
            cE = dI_E.multiply(dI_E).multiply(k1).exp();
            cN = dI_N.multiply(dI_N).multiply(k1).exp();
            cS = dI_S.multiply(dI_S).multiply(k1).exp();
            I = I.add(ee.Image(lambda).multiply(cN.multiply(dI_N).add(cS.multiply(dI_S)).add(cE.multiply(dI_E)).add(cW.multiply(dI_W))));
        } else if (method === 2) {
            cW = ee.Image(1.0).divide(ee.Image(1.0).add(dI_W.multiply(dI_W).divide(k2)));
            cE = ee.Image(1.0).divide(ee.Image(1.0).add(dI_E.multiply(dI_E).divide(k2)));
            cN = ee.Image(1.0).divide(ee.Image(1.0).add(dI_N.multiply(dI_N).divide(k2)));
            cS = ee.Image(1.0).divide(ee.Image(1.0).add(dI_S.multiply(dI_S).divide(k2)));
            I = I.add(ee.Image(lambda).multiply(cN.multiply(dI_N).add(cS.multiply(dI_S)).add(cE.multiply(dI_E)).add(cW.multiply(dI_W))));
        }
    }

    return I;
};

/***
 * Detect cloud shadow by projection cloud (casting) using sun elevation/azimuth.
 * Example: https://code.earthengine.google.com/702e270c6f8a4d09cea2a027a49d3e2f
 *
 * θ - zenith, degrees
 * φ - azimuth, degrees
 */
function findCloudShadow(cloudMask, cloudHeight, φ, θ) {
    cloudHeight = ee.Number(cloudHeight);

    // convert to radians
    var π = Math.PI;
    θ = ee.Number(0.5).multiply(π).subtract(ee.Number(θ).multiply(π).divide(180.0));
    φ = ee.Number(φ).multiply(π).divide(180.0).add(ee.Number(0.5).multiply(π));

    // compute shadow offset (vector length)
    var offset = θ.tan().multiply(cloudHeight);

    // compute x, y components of the vector
    var proj = cloudMask.projection();
    var nominalScale = proj.nominalScale();
    var x = φ.cos().multiply(offset).divide(nominalScale).round();
    var y = φ.sin().multiply(offset).divide(nominalScale).round();

    return cloudMask.changeProj(proj, proj.translate(x, y)).set('height', cloudHeight);
}

function castShadows(az, zen, cloud) {
    return cloudHeights.map(function (cloudHeight) {
        return findCloudShadow(cloud, cloudHeight, az, zen);
    });
}

function projectClouds(az, zen, cloudScore, cloudThreshold) {
    var cloudMask = cloudScore.lt(cloudThreshold).not();

    var cloudMaskBuffer = cloudMask.focal_min(50, 'circle', 'meters').focal_max(60, 'circle', 'meters', 4).reproject(cloudScore.projection());

    cloudMaskBuffer = cloudMaskBuffer.mask(cloudMaskBuffer);

    var shadows = ee.ImageCollection(castShadows(az, zen, cloudMaskBuffer)).max();

    shadows = shadows.updateMask(cloudMask.not()); // remove clouds

    if (debug) {
        Map.addLayer(shadows, { min: 0, max: 0.4, opacity: 0.7, palette: ['092d25', '03797b', '59f3f5', 'acf9fa'] }, 'shadows2.max - cloud > 0.1', false);
    }

    return shadows;
}

//Set up possible cloud heights in meters
var cloudHeights = ee.List.sequence(100, 2000, 200);

/***
 * Filters feature collection to filterCollection
 */
function filterToIntersection(featureCollection, filterCollection) {
    return featureCollection.map(function (f) {
        return f.set('intersects', f.intersects(filterCollection.geometry(ee.ErrorMargin(errorMargin)), ee.ErrorMargin(errorMargin)));
    }).filter(ee.Filter.eq('intersects', true));
}

/***
 * Filters feature collection to filterCollection using maximum intersection fraction
 */
function filterToMaximumAreaFraction(featureCollection, filterCollection) {
    var features = featureCollection.map(function (f) {
        var intersection = f.intersection(filterCollection.geometry(ee.ErrorMargin(errorMargin)), ee.ErrorMargin(errorMargin));
        return f.set('area_fraction', intersection.area(ee.ErrorMargin(errorMargin)).divide(f.area(ee.ErrorMargin(errorMargin))));
    });

    return features.filter(ee.Filter.gt('area_fraction', 0.4));
}

/***
 * Function for finding dark outliers in time series, masks pixels that are dark, and dark outliers.
 *
 */
function simpleTDOM2(c, zShadowThresh, irSumThresh, dilatePixels) {
    var shadowSumBands = ['nir', 'swir1'];

    //Get some pixel-wise stats for the time series
    var irStdDev = c.select(shadowSumBands).reduce(ee.Reducer.stdDev());
    var irMean = c.select(shadowSumBands).mean();

    //Mask out dark dark outliers
    c = c.map(function (img) {
        var z = img.select(shadowSumBands).subtract(irMean).divide(irStdDev);
        var irSum = img.select(shadowSumBands).reduce(ee.Reducer.sum());
        var m = z.lt(zShadowThresh).reduce(ee.Reducer.sum()).eq(2).and(irSum.lt(irSumThresh)).not();
        m = m.focal_min(dilatePixels);

        return img.addBands(m.rename('TDOMMask'));
    });

    return c;
}

/***
 * Basic cloud shadow shift.
 */
function projectShadows(cloudMask, TDOMMask, image, meanAzimuth, meanZenith, cloudHeights, dilatePixels) {
    //Find dark pixels
    var darkPixels = image.select(['nir', 'swir1', 'swir2']).reduce(ee.Reducer.sum()).lt(irSumThresh); //.gte(1);

    //Get scale of image
    var nominalScale = cloudMask.projection().nominalScale();

    // Find where cloud shadows should be based on solar geometry

    //Convert to radians
    var azR = ee.Number(meanAzimuth).multiply(Math.PI).divide(180.0).add(ee.Number(0.5).multiply(Math.PI));
    var zenR = ee.Number(0.5).multiply(Math.PI).subtract(ee.Number(meanZenith).multiply(Math.PI).divide(180.0));

    // Find the shadows
    var shadows = cloudHeights.map(function (cloudHeight) {
        cloudHeight = ee.Number(cloudHeight);

        var shadowCastedDistance = zenR.tan().multiply(cloudHeight); //Distance shadow is cast
        var x = azR.cos().multiply(shadowCastedDistance).divide(nominalScale).round(); //X distance of shadow
        var y = azR.sin().multiply(shadowCastedDistance).divide(nominalScale).round(); //Y distance of shadow
        return cloudMask.changeProj(cloudMask.projection(), cloudMask.projection().translate(x, y));
    });

    var shadow = ee.ImageCollection.fromImages(shadows).max();

    // Create shadow mask
    shadow = shadow.updateMask(shadow.mask().and(cloudMask.mask().not()));
    shadow = shadow.focal_max(dilatePixels);
    shadow = shadow.updateMask(shadow.mask().and(darkPixels).and(TDOMMask));

    return shadow;
}

/***
 * Function for wrapping cloud and shadow masking together
 * Assumes image has cloud mask band called "cloudMask" and a TDOM mask called "TDOMMask"
 * If TDOM is not being used, TDOMMask just needs to be a constant raster band with value 1
 */
function cloudProject(img, dilatePixels, cloudHeights, azimuthField, zenithField) {

    //Get the cloud mask
    var cloud = img.select('cloudMask').not();
    cloud = cloud.focal_max(dilatePixels);
    cloud = cloud.updateMask(cloud);

    //Get TDOM mask
    var TDOMMask = img.select(['TDOMMask']).not();

    //Project the shadow finding pixels inside the TDOM mask that are dark and inside the expected area given the solar geometry
    var shadow = projectShadows(cloud, TDOMMask, img, img.get(azimuthField), img.get(zenithField), cloudHeights, dilatePixels);

    //Combine the cloud and shadow masks
    var combinedMask = cloud.mask().or(shadow.mask()).eq(0);

    //Update the image's mask and return the image
    img = img.updateMask(img.mask().and(combinedMask));
    img = img.addBands(combinedMask.rename(['cloudShadowMask']));

    return img;
}

/***
 * Compute a threshold using Otsu method (bimodal)
 */
function computeThresholdUsingOtsu(image, scale, bounds, th, g, skipShort, weightGradient, minValue, useLowValues) {
    if(fixedThreshold !== -1) {
      return fixedThreshold;
    }

    // clip image edges
    var mask = image.mask().gt(0)
      .focal_min(ee.Number(scale).multiply(1.5), 'circle', 'meters');
    
    // detect sharp changes
    var edge = ee.Algorithms.CannyEdgeDetector(image, th, g);
    edge = edge.multiply(mask);
    
    if(debug) {
      print(ui.Chart.image.histogram(edge.mask(edge.gt(0)), bounds, scale, buckets).setOptions({title:'edge values'}));
    }
 
    if(debug) {
      Map.addLayer(edge.mask(edge), { palette: ['ff0000'] }, 'edges (original)', false);
    }

    // remove bad edges
    edge = edge.multiply(occurrence.gt(0))

    if(debug) {
      Map.addLayer(edge.mask(edge), { palette: ['ff0000'] }, 'edges (original, non-zero density)', false);
    }

    // fall-back to most probable edges only
    if(updateEdgesWithDensity && !useLowValues) {
      /*
      // get the major edges (skip <25%)
      var edgesMajorTh = edge.mask(edge.gt(0)).reduceRegion(ee.Reducer.percentile([25]), bounds, scale).values().get(0)
  	  edge = ee.Image(ee.Algorithms.If(ee.Algorithms.IsEqual(edgesMajorTh, null),
	 	    edge,
	 	    edge.multiply(edge.gt(ee.Image.constant(edgesMajorTh)))
	 	 ))      
	 	 
      if(debug) {
	 	          print('Edges 25%: ', edgesMajorTh)
	 	        }	 	 
	 	 */
      
      // take most probable edges only    
      var occurrenceEdge = occurrence.unmask(0, true).mask(edge.gt(0))

      var occurrenceEdgePercentile = occurrenceEdge.reduceRegion(ee.Reducer.median(), bounds, scale).values().get(0)
      //var occurrenceEdgePercentile = occurrenceEdge.reduceRegion(ee.Reducer.intervalMean(55, 95), bounds, scale).values().get(0)
      
      skipShort = false
      //weightGradient = false
  
      edge = ee.Image(ee.Algorithms.If(
        ee.Algorithms.IsEqual(occurrenceEdgePercentile, null),
        edge,
        edge.multiply(occurrence.subtract(ee.Image.constant(occurrenceEdgePercentile)).abs().lt(0.1)) // 10% around most probable
      ))
      
      if(debug) {
        // show histogram of density along edges
        print('Edge density espected: ', occurrenceEdgePercentile)
        
        print(ui.Chart.image.histogram(occurrenceEdge, bounds, scale, buckets).setOptions({title:'density, edges'}));

        var margin = occurrence.subtract(ee.Image.constant(occurrenceEdgePercentile)).abs().lt(0.1)
        Map.addLayer(margin.mask(margin), { palette: ['ffffff'] }, 'density margin, edge expected', false);

        Map.addLayer(occurrenceEdge.mask(occurrenceEdge.lt(0.008)).focal_max(1), { palette: ['ff0000'] }, 'occurrence edge small', false);

        Map.addLayer(edge.mask(edge), { palette: ['ff0000'] }, 'edges (after density update)', false);
      }
    }

    // advanced, detect edge lengths
    var coonnectedVis = void 0;
    if (skipShort) {
        var connected = edge.mask(edge).lt(0.8).connectedPixelCount(50, true);

        var edgeLong = connected.gte(30);

        edge = edgeLong;

        coonnectedVis = connected.updateMask(edgeLong).visualize({ palette: ['ffffff', 'ff0000'], min: 0, max: 50 });

        if (debug) {
            Map.addLayer(coonnectedVis, {}, 'edges (connected)', false);
        }
    }

    // take the largest changes, estimate gradient around edge and use that as a weight
    if (weightGradient) {
        if(useLowValues) {
/*
          // edges with max values
          var edgeValues = image.mask(edge)//.reproject(image.projection().scale(2, 2));
  
          // take the brightest
          var percentile = 5;
          
          var p = ee.Number(ee.Dictionary(edgeValues.reduceRegion(ee.Reducer.percentile([percentile]), bounds, scale)).values().get(0));
          var significantEdgesMask = ee.Image(ee.Algorithms.If(
              ee.Algorithms.IsEqual(p, null),
              ee.Image(0),
              
              edgeValues.lt(p)
          ));
*/          

          //var edgeGradient = image.reduceNeighborhood(ee.Reducer.stdDev(), ee.Kernel.circle(3))
          //    .reduceNeighborhood(ee.Reducer.max(), ee.Kernel.circle(3))//.mask(edge)
          
          var edgeGradient = image.gradient().abs();
          edgeGradient = edgeGradient.select(0).max(edgeGradient.select(1))
            .mask(edge.focal_max(1)) 
            .reproject(image.projection().scale(2, 2));
            
          //var edgeGradient = edgeGradient.reduceNeighborhood(ee.Reducer.max(), ee.Kernel.circle(1)).mask(edge)

          // take the highest gradient percentiles only
          var percentile = 85
          var p = ee.Number(ee.Dictionary(edgeGradient.reduceRegion(ee.Reducer.percentile([percentile]), bounds, scale)).values().get(0));
          var significantEdgesMask = ee.Image(ee.Algorithms.If(
              ee.Algorithms.IsEqual(p, null),
              ee.Image(0),
              edgeGradient.gt(p)
          ));

          // gradient around edges
          if (debug) {
              print(ui.Chart.image.histogram(edgeGradient, bounds, scale, _buckets));
              Map.addLayer(edgeGradient, {}, 'edge gradient', false);
              Map.addLayer(significantEdgesMask.mask(significantEdgesMask), {}, 'significant edges', false);

              //print('Mode: ', mode);
              //print('Sigma: ', σ);
              //Map.addLayer(edgeGradient.updateMask(significantEdgesMask), {min:0, max:mode.add(σ.multiply(2)), palette:['ffffff', 'ff0000']}, 'edge gradient, upper percentiles', false)
          }

        } else {
          // edges with max values
          var edgeValues = image.mask(edge.gt(th))//.reproject(image.projection().scale(2, 2));
  
          // take the brightest
          var percentile = 75;
          
          var p = ee.Number(ee.Dictionary(edgeValues.reduceRegion(ee.Reducer.percentile([percentile]), bounds, scale)).values().get(0));
          var significantEdgesMask = ee.Image(ee.Algorithms.If(
              ee.Algorithms.IsEqual(p, null),
              ee.Image(0),
              
              edgeValues.gt(p)
          ));

        }
        
        //var mode = ee.Number(ee.Dictionary(edgeGradient.reduceRegion(ee.Reducer.mode(), bounds, scale)).values().get(0));
        //var σ = ee.Number(ee.Dictionary(edgeGradient.reduceRegion(ee.Reducer.stdDev(), bounds, scale)).values().get(0));
        var _buckets = 50;

        // var mode = ee.Number(ee.Dictionary(edgeGradient.reduceRegion(ee.Reducer.mode(), bounds, scale)).values().get(0));
        //var σ = ee.Number(ee.Dictionary(edgeGradient.reduceRegion(ee.Reducer.stdDev(), bounds, scale)).values().get(0));
        //var _buckets = 50;
        //var significantEdgesMask = edgeGradient.gt(mode);

        edge = edge.updateMask(significantEdgesMask);
    }

    // buffer around NDWI edges
    var edgeBuffer = edge.focal_max(ee.Number(scale).multiply(1), 'square', 'meters');
    var imageEdge = image.mask(edgeBuffer.mask());

    // compute threshold using Otsu thresholding
    var buckets = 100;
    var hist = ee.Dictionary(ee.Dictionary(imageEdge.reduceRegion(ee.Reducer.histogram(buckets), bounds, scale)).values().get(0));

    var threshold = ee.Algorithms.If(hist.contains('bucketMeans'), otsu(hist), 0.3);
    threshold = ee.Number(threshold); //.add(0.05)

    if (debug) {
        Map.addLayer(edge.mask(edge), { palette: ['ff0000'] }, 'edges', false);

        print('Threshold: ', threshold);

        print(ui.Chart.image.histogram(image, bounds, scale, buckets).setOptions({title:'image, bounds'}));
        print(ui.Chart.image.histogram(imageEdge, bounds, scale, buckets).setOptions({title:'image, edges'}));
        Map.addLayer(mask.mask(mask), { palette: ['000000'] }, 'image mask', false);
    }
    
    return {
      threshold: minValue ? threshold.max(minValue) : threshold,
      edges: edge
    }
}

/***
 * Makes offset from the left bounds Geometry margin and splits into count pieces, returns locations.
 */
function getLeftMarginLocations(bounds, marginSize, count, scale) {
    var leftMarginSize = ee.Number(marginSize).multiply(scale);
    var boundsSmall = bounds.buffer(leftMarginSize.multiply(-1)).bounds();
    var coords = ee.List(boundsSmall.coordinates().get(0));
    var pt0 = ee.List(coords.get(0));
    var pt3 = ee.List(coords.get(3));
    var leftMarginLine = ee.Geometry.LineString([pt0, pt3]);

    var distances = ee.List.sequence(0, leftMarginLine.length(), leftMarginLine.length().divide(count));

    var lineToFirstPoint = function lineToFirstPoint(g) {
        var coords = ee.Geometry(g).coordinates().get(0);
        return ee.Feature(ee.Algorithms.GeometryConstructors.Point(coords));
    };

    var points = ee.FeatureCollection(leftMarginLine.cutLines(distances).geometries().map(lineToFirstPoint));

    // Map.addLayer(points, {color: 'green'}, 'text locations')

    return points.toList(10).map(function (o) {
        return ee.Feature(o).geometry();
    });
}

// ============================= generated: utils-text.js
var Text = {
    draw: function draw(text, pos, scale, props) {
        text = ee.String(text);

        var ascii = {};
        for (var i = 32; i < 128; i++) {
            ascii[String.fromCharCode(i)] = i;
        }
        ascii = ee.Dictionary(ascii);

        var fontSize = '16';

        if (props && props.fontSize) {
            fontSize = props.fontSize;
        }

        var glyphs = ee.Image('users/gena/fonts/Arial' + fontSize);

        var proj = glyphs.projection();
        glyphs = glyphs.changeProj(proj, proj.scale(1, -1));

        // get font info
        var font = {
            height: ee.Number(glyphs.get('height')),
            width: ee.Number(glyphs.get('width')),
            cellHeight: ee.Number(glyphs.get('cell_height')),
            cellWidth: ee.Number(glyphs.get('cell_width')),
            charWidths: ee.String(glyphs.get('char_widths')).split(',').map(ee.Number.parse)
        };

        font.columns = font.width.divide(font.cellWidth);
        font.rows = font.height.divide(font.cellHeight);

        function toAscii(text) {
            return ee.List(text.split('').iterate(function (char, prev) {
                return ee.List(prev).add(ascii.get(char));
            }, ee.List([])));
        }

        function moveChar(image, xmin, xmax, ymin, ymax, x, y) {
            var ll = ee.Image.pixelLonLat();
            var nxy = ll.floor().round().changeProj(ll.projection(), image.projection());
            var nx = nxy.select(0);
            var ny = nxy.select(1);
            var mask = nx.gte(xmin).and(nx.lt(xmax)).and(ny.gte(ymin)).and(ny.lt(ymax));

            return image.mask(mask).translate(ee.Number(xmin).multiply(-1).add(x), ee.Number(ymin).multiply(-1).subtract(y));
        }

        var codes = toAscii(text);

        // compute width for every char
        var charWidths = codes.map(function (code) {
            return ee.Number(font.charWidths.get(ee.Number(code)));
        });

        // compute xpos for every char
        var charX = ee.List(charWidths.iterate(function (w, list) {
            list = ee.List(list);
            var lastX = ee.Number(list.get(-1));
            var x = lastX.add(w);

            return list.add(x);
        }, ee.List([0]))).slice(0, -1);

        var charPositions = charX.zip(ee.List.sequence(0, charX.size()));

        // compute char glyph positions
        var charGlyphPositions = codes.map(function (code) {
            code = ee.Number(code).subtract(32); // subtract start star (32)
            var y = code.divide(font.columns).floor().multiply(font.cellHeight);
            var x = code.mod(font.columns).multiply(font.cellWidth);

            return [x, y];
        });

        var charGlyphInfo = charGlyphPositions.zip(charWidths).zip(charPositions);

        pos = ee.Geometry(pos).transform(proj).coordinates();
        var xpos = ee.Number(pos.get(0));
        var ypos = ee.Number(pos.get(1));

        // 'look-up' and draw char glyphs
        var textImage = ee.ImageCollection(charGlyphInfo.map(function (o) {
            o = ee.List(o);

            var glyphInfo = ee.List(o.get(0));
            var gw = ee.Number(glyphInfo.get(1));
            var glyphPosition = ee.List(glyphInfo.get(0));
            var gx = ee.Number(glyphPosition.get(0));
            var gy = ee.Number(glyphPosition.get(1));

            var charPositions = ee.List(o.get(1));
            var x = ee.Number(charPositions.get(0));
            var i = ee.Number(charPositions.get(1));

            var glyph = moveChar(glyphs, gx, gx.add(gw), gy, gy.add(font.cellHeight), x, 0, proj);

            return glyph.changeProj(proj, proj.translate(xpos, ypos).scale(scale, scale));
        })).mosaic();

        textImage = textImage.mask(textImage);

        if (props) {
            props = {
                textColor: props.textColor || 'ffffff',
                outlineColor: props.outlineColor || '000000',
                outlineWidth: props.outlineWidth || 0,
                textOpacity: props.textOpacity || 0.9,
                textWidth: props.textWidth || 1,
                outlineOpacity: props.outlineOpacity || 0.4
            };

            var textLine = textImage.visualize({ opacity: props.textOpacity, palette: [props.textColor], forceRgbOutput: true });

            if (props.textWidth > 1) {
                textLine.focal_max(props.textWidth);
            }

            if (!props || props && !props.outlineWidth) {
                return textLine;
            }

            var textOutline = textImage.focal_max(props.outlineWidth).visualize({ opacity: props.outlineOpacity, palette: [props.outlineColor], forceRgbOutput: true });

            return ee.ImageCollection.fromImages(ee.List([textOutline, textLine])).mosaic();
        } else {
            return textImage;
        }
    }
};

// ============================= generated: algorithms.js
var Algorithms = {
    Aster: {},
    AsterT: {},
    Landsat: {},
    Sentinel1: {},
    Sentinel2: {},
    Proba: {},
    Modis: {}
};

Algorithms.filter = function (images, collection, geometry, options) {
    // filter out images with no data wihin aoi
    if (options.skipEmpty) {
        images = images.map(function (image) {
            var value = ee.Dictionary(image.select(collection.visual.bands[0]).reduceRegion(ee.Reducer.firstNonNull(), geometry, 100)).values().get(0);
            return image.set('any_value', value);
        }).filter(ee.Filter.neq('any_value', null));
    }

    // filter out images with missing values
    if (options.maxNoDataPixels >= 0) {
        if (!collection.algorithms.getNoDataPixelCount) {
            print('Warning: getNoDataPixelCount is not implemented for ' + collection.name);
        } else {
            images = images.map(function (image) {
                return image.set('nodata_pixel_count', collection.algorithms.getNoDataPixelCount(image, collection));
            }).filter(ee.Filter.lte('nodata_pixel_count', 50));
        }
    }

    // filter snow/ice images
    if (options.maxSnowPixels >= 0) {
        if (!collection.algorithms.getSnowPixelCount) {
            print('Warning: getSnowPixelCount  is not implemented for ' + collection.name);
        } else {
            images = images.map(function (image) {
                return image.set('snow_pixel_count', collection.algorithms.getSnowPixelCount(image, collection));
            }).filter(ee.Filter.lte('snow_pixel_count', options.maxSnowPixels));
        }
    }

    // filter cloudy images
    if (options.maxCloudPixels >= 0) {
        if (!collection.algorithms.getCloudPixelCount) {
            print('Warning: getCloudixelCount  is not implemented for ' + collection.name);
        } else {
            images = images.map(function (image) {
                return image.set('cloud_pixel_count', collection.algorithms.getCloudPixelCount(image, collection));
            }).filter(ee.Filter.lte('cloud_pixel_count', options.maxCloudPixels));
        }
    }

    return images;
};
// ============================= generated: algorithms-aster.js

Algorithms.Aster.radianceFromDN = function (image, opt_skipBlue) {
  // Gain coefficients are dynamic (i.e. can be high, normal, low_1 or low_2)
  var multiplier = ee.Image([
    ee.Number(image.get('GAIN_COEFFICIENT_B01')).float(),
    ee.Number(image.get('GAIN_COEFFICIENT_B02')).float(),
    ee.Number(image.get('GAIN_COEFFICIENT_B3N')).float()
    ])
  
  // Apply correction
  var radiance = image.select(['green', 'red', 'nir']).subtract(1).multiply(multiplier)
  
  // Define properties required for reflectance calculation
  var timeStamp = image.get('system:time_start')
  var solar_z = ee.Number(90).subtract(image.get('SOLAR_ELEVATION'))
  
  return radiance.set({
    'timeStamp':timeStamp,
    'solar_zenith':solar_z
  })
}

Algorithms.Aster.reflectanceFromRadiance = function (rad) {
  // calculate day of year from time stamp
  var date = ee.Date(rad.get('timeStamp'));
  var jan01 = ee.Date.fromYMD(date.get('year'),1,1);
  var doy = date.difference(jan01,'day').add(1);

  // Earth-Sun distance squared (d2) 
  var d = ee.Number(doy).subtract(4).multiply(0.017202).cos().multiply(-0.01672).add(1) // http://physics.stackexchange.com/questions/177949/earth-sun-distance-on-a-given-day-of-the-year
  var d2 = d.multiply(d)  
  
  // mean exoatmospheric solar irradiance (ESUN)
  var ESUN = [1847,1553,1118]//from Thome et al (A) see http://www.pancroma.com/downloads/ASTER%20Temperature%20and%20Reflectance.pdf
  
  // cosine of solar zenith angle (cosz)
  var solar_z = ee.Number(rad.get('solar_zenith'))
  var cosz = solar_z.multiply(Math.PI).divide(180).cos()

  // calculate reflectance
  var scalarFactors = ee.Number(Math.PI).multiply(d2).divide(cosz)
  var scalarApplied = rad.multiply(scalarFactors)
  var reflectance = scalarApplied.divide(ESUN)
  
  return reflectance
}
  
/**
 * Compute a cloud score.
 */
Algorithms.Aster.cloudScore = function (img, opt_skipBlue) {
    // Compute several indicators of cloudyness and take the minimum of them.
    var score = ee.Image(1.0);

    // TODO: compute DN > reflectance and add other bands

    // Clouds are reasonably bright in all visible bands.
    score = score.min(rescale(img, '(img.red + img.green)/2', [0.5, 1.0])).aside(show, 'score vis');

    // Clouds are reasonably bright in all infrared bands.
    //score = score.min(rescale(img, 'img.nir', [0.7, 1.0])).aside(show, 'score ir')

    // Clouds are reasonably cool in temperature.
    var t = Algorithms.AsterT.temperatureFromDN(img.multiply(255));
    //score = score.min(rescale(t, 'img.temp2', [300, 273.15])).aside(show, 'score temp')
    score = score.min(rescale(t, 'img.temp2', [293, 268])).aside(show, 'score temp');

    // However, clouds are not snow.
    //let ndsi = img.normalizedDifference(['red', 'swir']);
    //score = score.min(rescale(ndsi, 'img', [0.8, 0.6])).aside(show, 'score ndsi')

    return score;
};

/**
 * Compute a snow score.
 */
Algorithms.Aster.snowScore = function (img, opt_bands) {
    // Compute several indicators of snowyness and take the minimum of them.
    var score = ee.Image(1.0);

    // Snow is reasonably bright in all visible bands.
    score = score.min(rescale(img, 'img.red + img.green', [0.3, 0.8])).aside(show, 'score vis');

    // Excluded this for snow reasonably bright in all infrared bands.
    score = score.min(rescale(img, 'img.nir', [0.3, 0.7])).aside(show, 'score ir');

    // Snow is reasonably cool in temperature.
    // start from 0C
    var t = Algorithms.AsterT.temperatureFromDN(img.multiply(255));
    score = score.min(rescale(t, 'img.temp2', [300, 273.15])).aside(show, 'score temp');

    // Snow is high in ndsi.
    // TODO: generate reflectance or at least radiance
    //Map.addLayer(img.select('red'), {}, 'red', false)
    //Map.addLayer(img.select('nir'), {}, 'nir', false)
    //let ndsi = img.normalizedDifference(['red', 'nir']);
    //Map.addLayer(ndsi, {}, 'ndsi', false)
    //score = score.min(rescale(ndsi, 'img', [-1, -0.5])).aside(show, 'score ndsi')

    return score;
};

Algorithms.Aster.detectClouds = function (image) {
    return image;
};

Algorithms.Aster.detectSnow = function (image) {
    return image;
};

// ASTER water detection from temperature band-only
Algorithms.Aster.detectWater = function (image, info, returnImage) {
    var radiance = Algorithms.Aster.radianceFromDN(image)
    var reflectance = Algorithms.Aster.reflectanceFromRadiance(radiance)

    image = image.unitScale(info.unitScale[0], info.unitScale[1]) // TODO: fix temperature
    .copyProperties(image)
    .set('system:time_start', image.get('system:time_start'));

    image = ee.Image(image);

    var snow = Algorithms.Aster.snowScore(image);

    var clouds = Algorithms.Aster.cloudScore(image);

    var waterScore = reflectance.resample('bicubic').normalizedDifference(['green', 'nir']);

    var cloudThreshold = 0.1;
    var snowThreshold = 0.4;
    var cloudMask = clouds.gte(cloudThreshold);
    var snowMask = snow.gte(snowThreshold);
    
    i = waterScore.clip(aoi)
    
    if(maskCouds) {
      var i = i.updateMask(cloudMask.not());
    }

    if(maskSnow) {
      var i = i.updateMask(snowMask.not());
    }

    var results = computeThresholdUsingOtsu(i, 30, aoi, cannyTh, cannySigma, false, true);
    var th = results.threshold;

    var water = i.gte(ee.Image.constant(th));

    var az = ee.Number(image.get('SOLAR_AZIMUTH'));
    var zen = ee.Number(image.get('SOLAR_ELEVATION'));
    var cloudShadows = projectClouds(az, zen, clouds, cloudThreshold);

    var mask = ee.ImageCollection(image.bandNames().map(function (b) {
        return image.select([b]).mask().rename('mask');
    })).product();

    if (returnImage) {
        return water.set('system:time_start', image.get('system:time_start')).set('nodata_pixels', ee.Dictionary(mask.not().reduceRegion(ee.Reducer.sum(), analysisExtent, scale)).values().get(0)).set('cloud_pixels', ee.Dictionary(cloudMask.reduceRegion(ee.Reducer.sum(), analysisExtent, scale)).values().get(0))
        //.set('cloud_shadow_pixels', ee.Dictionary(cloudShadows.reduceRegion(ee.Reducer.sum(), analysisExtent, scale)).values().get(0))
        .set('snow_pixels', ee.Dictionary(snowMask.reduceRegion(ee.Reducer.sum(), analysisExtent, scale)).values().get(0)).set('water_threshold', th);
    }

    var waterVector = water.mask(water).reduceToVectors({ geometry: analysisExtent, scale: errorMargin });
    waterVector = filterToMaximumAreaFraction(waterVector, analysisExtent);

    return {
      waterMask: ee.FeatureCollection(waterVector.copyProperties(image)).set('system:time_start', image.get('system:time_start')).set('nodata_pixels', ee.Dictionary(mask.not().reduceRegion(ee.Reducer.sum(), analysisExtent, scale)).values().get(0)).set('cloud_pixels', ee.Dictionary(cloudMask.reduceRegion(ee.Reducer.sum(), analysisExtent, scale)).values().get(0)).set('cloud_shadow_pixels', ee.Dictionary(cloudShadows.reduceRegion(ee.Reducer.sum(), analysisExtent, scale)).values().get(0)).set('snow_pixels', ee.Dictionary(snowMask.reduceRegion(ee.Reducer.sum(), analysisExtent, scale)).values().get(0)).set('water_threshold', th),
      snowMask: snowMask,
      cloudMask: cloudMask,
      imageMask: mask, // image.select(0).mask(),
      edges: results.edges
    }
};

Algorithms.Aster.getCloudPixelCount = function (image, info) {
    image = image.unitScale(info.unitScale[0], info.unitScale[1]) // TODO: fix temperature
    .copyProperties(image);

    image = ee.Image(image);

    var clouds = Algorithms.Aster.cloudScore(image);

    var cloudThreshold = 0.1;
    var cloudMask = clouds.gte(cloudThreshold);

    return ee.Dictionary(cloudMask.reduceRegion(ee.Reducer.sum(), analysisExtent, scale)).values().get(0);
};

Algorithms.Aster.getSnowPixelCount = function (image, info) {
    image = image.unitScale(info.unitScale[0], info.unitScale[1]) // TODO: fix temperature
    .copyProperties(image);

    image = ee.Image(image);

    var snow = Algorithms.Aster.snowScore(image);

    var snowThreshold = 0.4;
    var snowMask = snow.gte(snowThreshold);

    return ee.Dictionary(snowMask.reduceRegion(ee.Reducer.sum(), analysisExtent, scale)).values().get(0);
};

Algorithms.Aster.getNoDataPixelCount = function (image, info) {
    // TODO: check required bands only
    var mask = image.mask(); //ee.ImageCollection(image.bandNames().map(function(b) { return image.select([b]).mask().rename('mask') })).product();

    return ee.Dictionary(mask.not().reduceRegion(ee.Reducer.sum(), analysisExtent, scale)).values().get(0);
};

Algorithms.Aster.onLayerAdd = function (image, info) {
    var radiance = Algorithms.Aster.radianceFromDN(image)
    var reflectance = Algorithms.Aster.reflectanceFromRadiance(radiance)

    image = image.unitScale(info.unitScale[0], info.unitScale[1]) // TODO: fix temperature
    .copyProperties(image)
    .set('system:time_start', image.get('system:time_start'));

    image = ee.Image(image);

    var snow = Algorithms.Aster.snowScore(image);
    Map.addLayer(snow.mask(snow), { palette: ['000000', 'FFFF00'], min: 0, max: 1 }, 'snow score', false);

    var clouds = Algorithms.Aster.cloudScore(image);
    Map.addLayer(clouds.mask(clouds), { palette: ['000000', 'FF0000'], min: 0, max: 1 }, 'cloud score', false);

    var cloudThreshold = 0.1;
    var snowThreshold = 0.4;
    var az = ee.Number(image.get('SOLAR_AZIMUTH'));
    var zen = ee.Number(image.get('SOLAR_ELEVATION'));
    var cloudShadows = projectClouds(az, zen, clouds, cloudThreshold);

    var vegetation = Algorithms.Landsat.vegetationScore(image);
    Map.addLayer(vegetation.mask(vegetation), { palette: ['000000', '00FF00'], min: 0, max: 1 }, 'vegetation score', false);

    // NDWI
    var waterScore = reflectance.resample('bicubic').normalizedDifference(['green', 'nir']);

    //var waterScore = image.resample('bicubic').normalizedDifference(['green', 'nir']);
    //let waterScore = rescale(waterScore, 'img', [-0.2, 0.35])
    //waterScore = waterScore.mask(waterScore)

    Map.addLayer(waterScore, { palette: Palettes.water }, 'water score (NDWI)', false);

    Map.addLayer(cloudShadows.mask().not(), {}, 'cloud shadows mask', false);

    var cloudMask = clouds.lt(cloudThreshold)

    i = waterScore.clip(aoi)
    
    if(maskCouds) {
      var i = i.updateMask(cloudMask.not());
    }

    var results = computeThresholdUsingOtsu(i, 15, aoi, cannyTh, cannySigma, false, true, -0.1);
    var th = results.threshold;

    var water = i.gte(ee.Image.constant(th));
    Map.addLayer(water.mask(water), {}, 'water mask (NDWI)', false);

    var waterVector = water.mask(water).reduceToVectors({ geometry: analysisExtent, scale: errorMargin });
    //waterVector = filterToIntersection(waterVector, analysisExtent)
    waterVector = filterToMaximumAreaFraction(waterVector, analysisExtent);
    
    // print('Water area (vector): ', waterVector.geometry().area(1))
    
    var area = waterVector.geometry().area(1)

    // fill
    var waterImageVis = ee.Image(ee.Algorithms.If(
      ee.Algorithms.IsEqual(area, 0),
      ee.Image(),
      fillMissingWater(water, snow, clouds, water.mask(), results.edges)
    ))
      
    Map.addLayer(waterImageVis, {}, 'water filled', false)

    Map.addLayer(waterVector, { color: '5050ff' }, 'water mask', false, 0.6);
};

// ============================= generated: algorithms-asterT.js
Algorithms.AsterT.temperatureFromDN = function (image) {
    //let bands = ['B10',  'B11',   'B12',   'B13',   'B14']
    var bands = ['temp', 'temp2', 'temp3', 'temp4', 'temp5'];
    var multiplier = ee.Image([0.006822, 0.006780, 0.006590, 0.005693, 0.005225]);
    var k1 = ee.Image([3040.136402, 2482.375199, 1935.060183, 866.468575, 641.326517]);
    var k2 = ee.Image([1735.337945, 1666.398761, 1585.420044, 1350.069147, 1271.221673]);

    var radiance = image.select(bands).subtract(1).multiply(multiplier);
    var t = k2.divide(k1.divide(radiance).add(1).log());

    return t.rename(bands);
};


Algorithms.AsterT.onLayerAdd = function (image, info) {
    var water = Algorithms.AsterT.detectWater(image.select('temp'), info);

    var waterEdge = water.subtract(water.focal_min(1));

    water = ee.ImageCollection([water.mask(water).visualize({ palette: ['5050ff'], opacity: 0.2 }), waterEdge.mask(waterEdge).visualize({ palette: ['ffffff'], opacity: 0.9 })]).mosaic();

    Map.addLayer(water.mask(water), {}, 'water', false);
};

Algorithms.AsterT.detectWater = function (image, info, returnImage) {
    image = image.clip(aoi).resample('bicubic');

    var t = image.select('temp');

    var clipEdges = false;
    //let clipEdges = true
    var th = computeThresholdUsingOtsu(t, 90, aoi, 0.9, 4, clipEdges, false);

    // compute mode in the most probable center of the water and assume this value as water
    var waterPermanentCenter = analysisExtent.geometry().centroid(30).buffer(180).intersection(analysisExtent.geometry(), ee.ErrorMargin(errorMargin));

    var mode = ee.Number(ee.Dictionary(t.reduceRegion(ee.Reducer.mode(), waterPermanentCenter, errorMargin * 5)).get('temp'));

    if (debug) {
        print('Mode:', mode);
    }

    // detect water by taking mode and otsu threshold into account
    var water = ee.Algorithms.If(ee.Algorithms.IsEqual(mode, null), ee.Image().byte(), t.gt(th).multiply(mode.gt(th)).add(t.lte(th).multiply(mode.lte(th))));

    water = ee.Image(water);

    if (returnImage) {
        return water.set('system:time_start', image.get('system:time_start')).set('nodata_pixels', 0).set('cloud_pixels', 0).set('cloud_shadow_pixels', 0).set('snow_pixels', 0).set('water_threshold', th);
    }

    // vectorize
    var waterVector = water.mask(water).reduceToVectors({ geometry: analysisExtent, scale: errorMargin });

    // filter to overlaps met permanent water center
    waterVector = filterToMaximumAreaFraction(waterVector, analysisExtent);

    var snowMask = ee.Image()
    var cloudMask = ee.Image()

    return {
      waterMask: waterVector.set('system:time_start', image.get('system:time_start')).set('nodata_pixels', 0).set('cloud_pixels', 0).set('cloud_shadow_pixels', 0).set('snow_pixels', 0).set('water_threshold', th),
      snowMask: snowMask,
      cloudMask: cloudMask,
      imageMask: image.mask()
    }
    
};

// ============================= generated: algorithms-landsat.js
/**
 * Compute a cloud score. Tuned for Landsat sensor.
 */
Algorithms.Landsat.cloudScore = function (img, opt_skipBlue) {
    // Compute several indicators of cloudyness and take the minimum of them.
    var score = ee.Image(1.0);

    // Clouds are reasonably bright in the blue band.
    score = score.min(rescale(img, 'img.blue', [0.1, 0.3])).aside(show, 'score blue');

    // Clouds are reasonably bright in all visible bands.
    score = score.min(rescale(img, 'img.red + img.green + img.blue', [0.3, 0.8])).aside(show, 'score vis');

    // Clouds are reasonably bright in all infrared bands.
    score = score.min(rescale(img, 'img.nir + img.swir + img.swir2', [0.3, 0.8])).aside(show, 'score ir');

    // Clouds are reasonably cool in temperature.
    score = score.min(rescale(img, 'img.temp', [293, 268])).aside(show, 'score temp');

    // However, clouds are not snow.
    //let ndsi = img.normalizedDifference(['red', 'swir']);
    //score = score.min(rescale(ndsi, 'img', [0.2, 0.0])).aside(show, 'score ndsi')

    var ndsi = img.normalizedDifference(['green', 'swir']);
    return score.min(rescale(ndsi, 'img', [0.8, 0.6]));

    return score;
};

/**
 * Compute a snow score.
 */
Algorithms.Landsat.snowScore = function (img, opt_bands) {
    // Compute several indicators of snowyness and take the minimum of them.
    var score = ee.Image(1.0);

    // Snow is reasonably bright in the blue band.
    score = score.min(rescale(img, 'img.blue', [0.1, 0.3])).aside(show, 'score blue');

    // Snow is reasonably bright in all visible bands.
    score = score.min(rescale(img, 'img.red + img.green + img.blue', [0.2, 0.8])).aside(show, 'score vis');

    // Excluded this for snow reasonably bright in all infrared bands.
    score = score.min(rescale(img, 'img.nir + img.swir + img.swir2', [0.2, 0.4])).aside(show, 'score ir');

    // Snow is reasonably cool in temperature.
    // start from 0C
    score = score.min(rescale(img, 'img.temp', [300, 273.15])).aside(show, 'score temp');

    // Snow is high in ndsi.
    var ndsi = img.normalizedDifference(['red', 'swir']);
    ndsi = rescale(ndsi, 'img', [0.3, 0.5]);
    score = score.min(ndsi).aside(show, 'score ndsi').aside(show, 'score ndsi');

    return rescale(score.clamp(0, 0.5), 'img', [0, 0.5]).toFloat();
};

Algorithms.Landsat.vegetationScore = function (i) {
    var ndvi = i.normalizedDifference(['nir', 'red']).rename('ndvi');
    return rescale(ndvi, 'img.ndvi', [0.3, 0.5]);
};

Algorithms.Landsat.maskClouds = function (img) {
    var cloudThreshold = 0.5; // lower - more clouds
    return cloudScore(img).gt(Algorithms.Landsat.cloudThreshold).rename(['cloud']);
};

Algorithms.Landsat.maskSnow = function (img) {
    var snowThresh = 0.5; //Lower number masks more out (0-1)
    return snowScore(img).gt(Algorithms.Landsat.snowThresh).rename(['snow']);
    //return img.mask(img.mask().and(ss.lt(snowThresh)))
};

/***
 * Compute a water score using MNDWI and a few additional bands.
 */
Algorithms.Landsat.waterScore2 = function (img) {
    // Compute several indicators of water and take the minimum of them.
    var score = ee.Image(1.0);

    //Set up some params
    var darkBands = ['green', 'red', 'nir', 'swir2', 'swir']; //,'nir','swir','swir2'];
    var brightBand = 'blue';
    var shadowSumBands = ['nir', 'swir', 'swir2'];

    //Water tends to be dark
    var sum = img.select(shadowSumBands).reduce(ee.Reducer.sum());
    sum = rescale(sum, 'img', [0.35, 0.2]).clamp(0, 1);
    score = score.min(sum);

    //It also tends to be relatively bright in the blue band
    var mean = img.select(darkBands).reduce(ee.Reducer.mean());
    var std = img.select(darkBands).reduce(ee.Reducer.stdDev());
    var z = img.select([brightBand]).subtract(std).divide(mean);
    z = rescale(z, 'img', [0, 1]).clamp(0, 1);
    score = score.min(z);

    // Water is at or above freezing
    score = score.min(rescale(img, 'img.temp', [273, 275]));

    // Water is nigh in ndsi
    var ndsi = img.normalizedDifference(['red', 'swir']);
    ndsi = rescale(ndsi, 'img', [0.3, 0.8]);

    score = score.min(ndsi);

    return score.clamp(0, 1);
};

/***
 * Compute a water score using NDWI only
 */
Algorithms.Landsat.waterScore = function (image, bands) {
    return image.normalizedDifference(['green', 'swir']);
};

Algorithms.Landsat.onLayerAdd = function (image, info) {
    var snow = Algorithms.Landsat.snowScore(image);
    Map.addLayer(snow.mask(snow), { palette: ['000000', 'FFFF00'], min: 0, max: 1 }, ' snow score', false);

    var snowThreshold = 0.5;
    var snowMask = snow.gte(snowThreshold);

    Map.addLayer(snowMask.mask(snowMask), { palette: ['000000', 'FFFF00'], min: 0, max: 1 }, ' snow mask', false);

    var clouds = Algorithms.Landsat.cloudScore(image);
    Map.addLayer(clouds.mask(clouds.unitScale(0.15, 0.25)), { palette: ['000000', 'FF0000'], min: 0, max: 1 }, 'cloud score', false);
    
    var cloudThreshold = 0.35; 
    var cloudMask = clouds.gte(cloudThreshold)
    Map.addLayer(cloudMask.mask(cloudMask), { palette: ['000000', 'FFFF00'], min: 0, max: 1 }, ' cloud mask', false);

    var vegetation = Algorithms.Landsat.vegetationScore(image);
    Map.addLayer(vegetation.mask(vegetation), { palette: ['000000', '00FF00'], min: 0, max: 1 }, 'vegetation score', false);

    var az = ee.Number(image.get('SUN_AZIMUTH'));
    var zen = ee.Number(image.get('SUN_ELEVATION'));
    var cloudShadows = projectClouds(az, zen, clouds, cloudThreshold);

    // MNDWI
    var mndwi = image.resample('bicubic').normalizedDifference(['green', 'swir']);
    //waterScore = rescale(waterScore, 'img', [-0.2, 0.35])
    //waterScore = waterScore.mask(waterScore)
    Map.addLayer(mndwi, { palette: Palettes.water }, 'water score (MNDWI)', false);

    // NDWI
    var ndwi = image.resample('bicubic').normalizedDifference(['green', 'nir']);
    //let waterScore = rescale(waterScore, 'img', [-0.2, 0.35])
    //waterScore = waterScore.mask(waterScore)

    Map.addLayer(ndwi, { palette: Palettes.water }, 'water score (NDWI)', false);
    
    var waterScore = ndwi
    //var waterScore = mndwi

    //var i = waterScore
    // .updateMask(cloudShadows.mask().not().and(clouds.lt(cloudThreshold)).multiply(focusNearWater))
    //  .updateMask(cloudMask.not()).clip(aoi);

    i = waterScore.clip(aoi)
    
    if(maskCouds) {
      var i = i.updateMask(cloudMask.not());
    }

    if(maskSnow) {
      var i = i.updateMask(snowMask.not());
    }

    var results = computeThresholdUsingOtsu(i, 30, aoi, cannyTh, cannySigma, false, true);
    var th = results.threshold;
    
    var water = i.gte(ee.Image.constant(th));

    // bias correction for LANDSAT
    water = water.focal_max(15, 'circle', 'meters');

    var mask = ee.ImageCollection(image.bandNames().map(function (b) {
        return image.select([b]).mask().rename('mask');
    })).product();

    Map.addLayer(water.mask(water), {}, 'water mask (NDWI)', false);

    var waterVector = water.mask(water).reduceToVectors({ geometry: analysisExtent, scale: errorMargin });
    waterVector = filterToIntersection(waterVector, analysisExtent);

    Map.addLayer(waterVector, { color: '5050ff' }, 'water vector', false, 0.6);
    
    // when a lot of snow - fall-back to zero and take the largest blob
    /*
    // TODO: add snow check
    var waterVector = waterVector.map(function(f) {
      return f.set('area', f.area(errorMargin))
    }).sort('area', false).limit(waterVector.size().multiply(1/4).toInt())

    water = ee.Image(0).byte().paint(waterVector, 1)
    results.edges = getEdge(water)

    Map.addLayer(waterVector, { color: '5050ff' }, 'water vector (major)', false, 0.6);
    */

    // fill
    var area = waterVector.geometry().area(errorMargin)
    var waterImageVis = ee.Image(ee.Algorithms.If(
      ee.Algorithms.IsEqual(area, 0),
      ee.Image(),
      fillMissingWater(water, snowMask, cloudMask, mask, results.edges)
    ))
    Map.addLayer(waterImageVis, {}, 'water filled', false)

    print(Algorithms.Landsat.detectWater(image, info));
};

Algorithms.Landsat.detectWater = function (image, info, returnImage) {
    var snow = Algorithms.Landsat.snowScore(image);
    var clouds = Algorithms.Landsat.cloudScore(image);
    var vegetation = Algorithms.Landsat.vegetationScore(image);

    var waterScore = image.resample('bicubic').normalizedDifference(['green', 'nir']);
    //let waterScore = image.resample('bicubic').normalizedDifference(['green', 'swir'])

    var cloudThreshold = 0.25;
    var cloudMask = clouds.gte(cloudThreshold);

    var snowThreshold = 0.5;
    var snowMask = snow.gte(snowThreshold);

    i = waterScore.clip(aoi)
    
    if(maskCouds) {
      var i = i.updateMask(cloudMask.not());
    }

    if(maskSnow) {
      var i = i.updateMask(snowMask.not());
    }

    var results = computeThresholdUsingOtsu(i, 30, aoi, cannyTh, cannySigma, false, true);
    var th = results.threshold;

    var water = i.gte(ee.Image.constant(th));

    // bias correction for LANDSAT
    water = water.focal_max(15, 'circle', 'meters');

    var mask = ee.ImageCollection(image.bandNames().map(function (b) {
        return image.select([b]).mask().rename('mask');
    })).product();

    var az = ee.Number(image.get('SUN_AZIMUTH'));
    var zen = ee.Number(image.get('SUN_ELEVATION'));
    var cloudShadows = projectClouds(az, zen, clouds, cloudThreshold);

    if (returnImage) {
        return water.set('system:time_start', image.get('system:time_start')).set('nodata_pixels', ee.Dictionary(mask.not().reduceRegion(ee.Reducer.sum(), analysisExtent, scale)).values().get(0)).set('cloud_pixels', ee.Dictionary(cloudMask.reduceRegion(ee.Reducer.sum(), analysisExtent, scale)).values().get(0))
        //.set('cloud_shadow_pixels', ee.Dictionary(cloudShadows.reduceRegion(ee.Reducer.sum(), analysisExtent, scale)).values().get(0))
        .set('snow_pixels', ee.Dictionary(snowMask.reduceRegion(ee.Reducer.sum(), analysisExtent, scale)).values().get(0)).set('water_threshold', th);
    }

    var waterVector = water.mask(water).reduceToVectors({ geometry: analysisExtent, scale: errorMargin });
    waterVector = filterToIntersection(waterVector, analysisExtent);

    return {
      waterMask: ee.FeatureCollection(waterVector.copyProperties(image))
        .set('system:time_start', image.get('system:time_start'))
        .set('nodata_pixels', ee.Dictionary(mask.not().reduceRegion(ee.Reducer.sum(), analysisExtent, scale)).values().get(0))
        .set('cloud_pixels', ee.Dictionary(cloudMask.reduceRegion(ee.Reducer.sum(), analysisExtent, scale)).values().get(0))
        .set('cloud_shadow_pixels', ee.Dictionary(cloudShadows.reduceRegion(ee.Reducer.sum(), analysisExtent, scale)).values().get(0))
        .set('snow_pixels', ee.Dictionary(snowMask.reduceRegion(ee.Reducer.sum(), analysisExtent, scale)).values().get(0))
        .set('water_threshold', th),
      snowMask: snowMask,
      cloudMask: cloudMask,
      imageMask: mask, //image.select(0).mask(),
      edges: results.edges
    }
};

Algorithms.Landsat.getCloudPixelCount = function (image, info) {
    var clouds = Algorithms.Landsat.cloudScore(image);

    var cloudThreshold = 0.2;
    var cloudMask = clouds.gte(cloudThreshold);

    return ee.Dictionary(cloudMask.reduceRegion(ee.Reducer.sum(), analysisExtent, scale)).values().get(0);
};

Algorithms.Landsat.getSnowPixelCount = function (image, info) {
    var snow = Algorithms.Landsat.snowScore(image);

    var snowThreshold = 0.5;
    var snowMask = snow.gte(snowThreshold);

    return ee.Dictionary(snowMask.reduceRegion(ee.Reducer.sum(), analysisExtent, scale)).values().get(0);
};

Algorithms.Landsat.getNoDataPixelCount = function (image, info) {
    var mask = ee.ImageCollection(image.bandNames().map(function (b) {
        return image.select([b]).mask().rename('mask');
    })).product();
    return ee.Dictionary(mask.not().reduceRegion(ee.Reducer.sum(), analysisExtent, scale)).values().get(0);
};

// ============================= generated: algorithms-modis.js

// ============================= generated: algorithms-proba.js

// ============================= generated: algorithms-sentinel1.js
Algorithms.Sentinel1.detectWater = function (image, info, returnImage) {
    image = image.select(0);
    
    image = image.updateMask(image.mask().focal_min(60, 'square', 'meters'))

    var entropy = image.multiply(10).int()
      .entropy(ee.Kernel.square(3));
    var lowEntropy = entropy.lt(0.05)
      .focal_min(90, 'circle', 'meters',1)
      .focal_max(90, 'circle', 'meters',4)
      //.reproject(image.projection().scale(3,3));

    //image = image.updateMask(lowEntropy.not());

    var K = 1.5; //3.5
    var iterations = 20;

    var K = 10
    var method = 1;

    image = image.clip(aoi);

    //.updateMask(image.select(0).gt(-24))

    image = removeSpeckleNoisePeronaMalik(image, iterations, K, method);

    //var scale = image.projection().nominalScale();

    //var clipEdges = false;
    var clipEdges = true
    var results = computeThresholdUsingOtsu(image.select(0), scale, aoi, 0.95, 3, clipEdges, true, null, true);
    var th = results.threshold;

    // detect water by taking darker pixels
    // hack :(, TODO: parametrize Otsu function to get min/max
    var water = ee.Image(ee.Algorithms.If(th.eq(0.3), image.lt(-20), image.lt(th)));

    // vectorize
    var waterVector = water.mask(water).reduceToVectors({ geometry: analysisExtent, scale: errorMargin });

    // filter to overlaps met permanent water center
    waterVector = filterToMaximumAreaFraction(waterVector, analysisExtent);

    var mask = image.mask()


    // take the largest
    var features = ee.FeatureCollection(waterVector.map(function (f) {
        return f.set('area', f.geometry().area(ee.ErrorMargin(scale)));
    }).sort('area', false))

    function toVector() {
        var waterVector = features.limit(1)

        water = ee.Image(0).byte().paint(waterVector, 1).rename('water')
          //.max(lowEntropy.clip(waterVector.convexHull(ee.ErrorMargin(errorMargin)))); // fill-in smooth areas within detected water
    
        waterVector = water.mask(water).reduceToVectors({ geometry: analysisExtent, scale: errorMargin });
        
        return waterVector
    }

    waterVector = ee.FeatureCollection(ee.Algorithms.If(ee.Algorithms.IsEqual(features.size(), 0),
      ee.FeatureCollection([]),
      toVector()
      ));
      
    return {
      waterMask: ee.FeatureCollection(waterVector.copyProperties(image)).set('system:time_start', 
        image.get('system:time_start')).set('nodata_pixels', ee.Dictionary(water.mask().not().reduceRegion(ee.Reducer.sum(), analysisExtent, scale)).values().get(0)).set('cloud_pixels', 0).set('cloud_shadow_pixels', 0).set('snow_pixels', 0).set('water_threshold', th),
      snowMask: ee.Image(),
      cloudMask: ee.Image(),
      imageMask: image.mask(),
      edges: results.edges
    }
}

Algorithms.Sentinel1.onLayerAdd = function (image, info) {
    image = image.select(0);

    Map.addLayer(image, { min: info.visual.min, max: info.visual.max }, 'original', false);

/*    var glcm = image.multiply(10).toInt().glcmTexture({ size: 4 }).reproject(image.projection());
*/
    // remove bad pixel by detecting low entropy areas

    //Map.addLayer(entropy, {}, 'entropy', false);

    Map.addLayer(
        image.reduceNeighborhood(ee.Reducer.stdDev(), ee.Kernel.square(4))
        .lt(1)
        , {}, 'stdev', false);


    var entropy = image.multiply(10).int()
      .entropy(ee.Kernel.square(3));
    
    var lowEntropy = entropy.lt(0.05)
      .focal_min(90, 'square', 'meters',1)
      .focal_max(90, 'square', 'meters',4)
      //.reproject(image.projection().scale(3,3))

    //image = image.updateMask(lowEntropy.not());

    Map.addLayer(entropy, {}, 'entropy', false);
    Map.addLayer(lowEntropy.mask(lowEntropy), {}, 'low entropy mask', false);

    Map.addLayer(aoi, {}, 'aoi', false);

    var K = 1.5; //3.5
    var iterations = 20;

    var K = 10
    var method = 1;

    image = image.clip(aoi);
    //.updateMask(image.select(0).gt(-24))

    image = removeSpeckleNoisePeronaMalik(image, iterations, K, method);

    Map.addLayer(image, { min: info.visual.min, max: info.visual.max }, 'smooth', false);

    //var scale = image.projection().nominalScale();

    //var clipEdges = false;
    var clipEdges = true
    var results = computeThresholdUsingOtsu(image, scale, aoi, 0.95, 3, clipEdges, true, null, true);
    var th = results.threshold;

    // detect water by taking darker pixels
    //var water = image.lt(th);

    // hack :(, TODO: parametrize Otsu function to get min/max
    var water = ee.Image(ee.Algorithms.If(th.eq(0.3), image.lt(-20), image.lt(th)));

    // vectorize
    var waterVector = water.mask(water).reduceToVectors({ geometry: analysisExtent, scale: errorMargin });


    // filter to overlaps met permanent water center
    waterVector = filterToMaximumAreaFraction(waterVector, analysisExtent);

    var mask = image.mask()

    // take the largest
    var features = ee.FeatureCollection(waterVector.map(function (f) {
        return f.set('area', f.geometry().area(ee.ErrorMargin(scale)));
    }).sort('area', false))

    function toVector() {
        var waterVector = ee.Feature(features.first())

        water = ee.Image(0).byte().paint(waterVector, 1).rename('water')
          //.max(lowEntropy.clip(waterVector.convexHull(ee.ErrorMargin(errorMargin)))); // fill-in smooth areas within detected water
    
        waterVector = water.mask(water).reduceToVectors({ geometry: analysisExtent, scale: errorMargin });
        
        return waterVector
    }

    waterVector = ee.FeatureCollection(ee.Algorithms.If(ee.Algorithms.IsEqual(features.size(), 0),
      ee.FeatureCollection([]),
      toVector()
      ));

    print('Water vector: ', waterVector)

    var waterImage = ee.Image(0).byte().paint(waterVector, 1)
    //waterImage = waterImage.updateMask(water.mask())
    
    // fill
    var area = waterVector.geometry().area(1)
    var waterImageVis = ee.Image(ee.Algorithms.If(
      ee.Algorithms.IsEqual(area, 0),
      ee.Image(),
      fillMissingWater(waterImage, ee.Image(), ee.Image(), image.mask(), results.edges)
    ))


    Map.addLayer(waterImageVis, {}, 'water filled', false)


/*    return {
      waterMask: ee.FeatureCollection(waterVector.copyProperties(image)).set('system:time_start', 
        image.get('system:time_start')).set('nodata_pixels', ee.Dictionary(water.mask().not().reduceRegion(ee.Reducer.sum(), analysisExtent, scale)).values().get(0)).set('cloud_pixels', 0).set('cloud_shadow_pixels', 0).set('snow_pixels', 0).set('water_threshold', th),
      snowMask: ee.Image(),
      cloudMask: ee.Image(),
      imageMask: water.mask(),
      edges: results.edges
    }
*/
    return image;

/*
    // detect water by taking darker pixels
    var water = image.lt(th);
    
    // vectorize
    var waterVector = water.mask(water).reduceToVectors({ geometry: analysisExtent, scale: errorMargin });

    // filter to overlaps met permanent water center
    //waterVector = filterToIntersection(waterVector, ee.FeatureCollection([waterPermanentCenter]))
    waterVector = filterToMaximumAreaFraction(waterVector, analysisExtent);

    // take the largest
    waterVector = ee.Feature(waterVector.map(function (f) {
        return f.set('area', f.geometry().area(ee.ErrorMargin(scale)));
    }).sort('area', false).first());

    water = ee.Image(0).byte().paint(waterVector, 1).rename('water')
      .max(lowEntropy.clip(waterVector.convexHull(ee.ErrorMargin(errorMargin)))); // fill-in smooth areas within detected water

    //water = water.focal_mode(scale, 'circle', 'meters', 3);

    Map.addLayer(water.mask(water), { palette: ['ffffff'] }, 'water', false);

    var waterEdge = water.subtract(water.focal_min(1));

    // fill
    var waterImageVis = fillMissingWater(water, ee.Image(), ee.Image(), water.mask(), results.edges)
    Map.addLayer(waterImageVis, {}, 'water filled', false)

    water = ee.ImageCollection([water.mask(water).visualize({ palette: ['5050ff'], opacity: 0.2 }), waterEdge.mask(waterEdge).visualize({ palette: ['ffffff'], opacity: 0.9 })]).mosaic();
    Map.addLayer(water.mask(water), {}, 'water (vector)', false);


    return image;
*/    
};;

// ============================= generated: algorithms-sentinel2.js
/***
 * Cloud masking algorithm for Sentinel2.
 */
Algorithms.Sentinel2.cloudScore = function (img) {
    // Compute several indicators of cloudyness and take the minimum of them.
    var score = ee.Image(1);

    // Clouds are reasonably bright in the blue and cirrus bands.
    score = score.min(rescale(img, 'img.blue', [0.1, 0.5])).aside(show, 'score blue');
    score = score.min(rescale(img, 'img.coastal', [0.1, 0.3])).aside(show, 'score coastal');
    score = score.min(rescale(img, 'img.coastal + img.cirrus', [0.15, 0.2])).aside(show, 'score cirrus');

    // Clouds are reasonably bright in all visible bands.
    score = score.min(rescale(img, 'img.red + img.green + img.blue', [0.2, 0.8])).aside(show, 'score visible');

    // Clouds are reasonably bright in all infrared bands.
    // score = score.min(rescale(img, 'img.nir2+img.nir + img.swir + img.swir2', [0.3, 0.4]));
    // Map.addLayer(img.select('cb').add(img.select('cirrus')),{'min':0.15,'max':0.25},'cbCirrusSum')
    //Map.addLayer(img.select('nir'),{'min':0,'max':0.1},'nir')
    // score = score.min(rescale(img, 'img.cirrus', [0.06, 0.09]))

    // score = score.max(rescale(img, 'img.cb', [0.4, 0.6]))
    // score = score.min(rescale(img,'img.re1+img.re2+img.re3',[0.6,2]))
    // Map.addLayer(rescale(img,'img.re1+img.re2+img.re3',[0.6,2]),{'min':0,'max':1},'re1')
    // Clouds are reasonably cool in temperature.
    // score = score.min(rescale(img, 'img.temp', [300, 290]));

    // However, clouds are not snow.
    var ndsi = img.normalizedDifference(['red', 'swir']);
    // Map.addLayer(ndsi,{'min':0.6,'max':0.8},'ndsi')
    // score=score.min(rescale(ndsi, 'img', [0.8, 0.6]))

    return score;
};

Algorithms.Sentinel2.onLayerAdd = function (image, info) {
    image = image.unitScale(info.unitScale[0], info.unitScale[1]).copyProperties(image);

    image = ee.Image(image);

    //let snow = Landsat.snowScore(image2);
    //Map.addLayer(snow.mask(snow), {palette:['000000', 'FFFF00'], min:0, max:1}, ' snow score', false);

    var clouds = Algorithms.Sentinel2.cloudScore(image);
    Map.addLayer(clouds.mask(clouds), { palette: ['000000', 'FF0000'], min: 0, max: 1 }, 'cloud score', false);

    //let vegetation = Sentinel2.vegetationScore(image2);
    //Map.addLayer(vegetation.mask(vegetation), {palette:['000000', '00FF00'], min:0, max:1}, 'vegetation score', false);

    var cloudThreshold = 0.1;
    var az = ee.Number(image.get('MEAN_SOLAR_AZIMUTH_ANGLE'));
    var zen = ee.Number(image.get('MEAN_SOLAR_ZENITH_ANGLE'));
    var cloudShadows = projectClouds(az, zen, clouds, cloudThreshold);

    // MNDWI (20m)
    var mndwi = image.normalizedDifference(['green', 'swir']);
    //waterScore = rescale(waterScore, 'img', [-0.2, 0.35])
    //waterScore = waterScore.mask(waterScore)
    Map.addLayer(mndwi, { palette: Palettes.water }, 'water score (MNDWI)', false);

    // NDWI (10m)
    var ndwi = image.resample('bicubic').normalizedDifference(['green', 'nir']);
    //let waterScore = rescale(waterScore, 'img', [-0.2, 0.35])
    //waterScore = waterScore.mask(waterScore)

    Map.addLayer(ndwi, { palette: Palettes.water }, 'water score (NDWI)', false);

    var i = ndwi

    var cloudMask = clouds.gt(cloudThreshold)
    Map.addLayer(cloudMask.mask(cloudMask), { palette: ['000000', 'FF0000'], min: 0, max: 1 }, 'cloud mask', false);

    i = i.clip(aoi)
    
    if(maskCouds) {
      var i = i.updateMask(cloudMask.not());
    }

    var results = computeThresholdUsingOtsu(i, 10, aoi, cannyTh, cannySigma, false, true);
    var th = results.threshold

    var water = i.gte(ee.Image.constant(th));
    Map.addLayer(water.mask(water), {}, 'water mask (NDWI)', false);


    var waterVector = water.mask(water).reduceToVectors({ geometry: analysisExtent, scale: errorMargin });
    waterVector = filterToIntersection(waterVector, analysisExtent);

    Map.addLayer(waterVector, { color: '5050ff' }, 'water mask', false, 0.6);

    // fill
    var area = waterVector.geometry().area(1)
    var waterImageVis = ee.Image(ee.Algorithms.If(
      ee.Algorithms.IsEqual(area, 0),
      ee.Image(),
      fillMissingWater(water, clouds, ee.Image(), water.mask(), results.edges)
    ))

    Map.addLayer(waterImageVis, {}, 'water filled', false)
  
};

Algorithms.Sentinel2.detectWater = function (image, info, returnImage) {
    image = image.unitScale(info.unitScale[0], info.unitScale[1]).copyProperties(image);

    image = ee.Image(image);

    var clouds = Algorithms.Sentinel2.cloudScore(image);

    var waterScore = image.resample('bicubic').normalizedDifference(['green', 'nir']);

    var cloudThreshold = 0.1;
    var cloudMask = clouds.gte(cloudThreshold);

    var i = waterScore.clip(aoi)
    
    if(maskCouds) {
      var i = i.updateMask(cloudMask.not());
    }

    var results = computeThresholdUsingOtsu(i, 10, aoi, cannyTh, cannySigma, false, true);
    var th = results.threshold;

    var water = i.gte(ee.Image.constant(th));

    var az = ee.Number(image.get('MEAN_SOLAR_AZIMUTH_ANGLE'));
    var zen = ee.Number(image.get('MEAN_SOLAR_ZENITH_ANGLE'));
    var cloudShadows = projectClouds(az, zen, clouds, cloudThreshold);

    var mask = ee.ImageCollection(image.bandNames().map(function (b) {
        return image.select([b]).mask().rename('mask');
    })).product();

    if (returnImage) {
        return water.set('system:time_start', image.get('system:time_start')).set('nodata_pixels', ee.Dictionary(mask.not().reduceRegion(ee.Reducer.sum(), analysisExtent, scale)).values().get(0)).set('cloud_pixels', ee.Dictionary(cloudMask.reduceRegion(ee.Reducer.sum(), analysisExtent, scale)).values().get(0))
        //.set('cloud_shadow_pixels', ee.Dictionary(cloudShadows.reduceRegion(ee.Reducer.sum(), analysisExtent, scale)).values().get(0))
        .set('snow_pixels', ee.Dictionary(cloudMask.reduceRegion(ee.Reducer.sum(), analysisExtent, scale)).values().get(0)).set('water_threshold', th);
    }

    var waterVector = water.mask(water).reduceToVectors({ geometry: analysisExtent, scale: errorMargin });
    waterVector = filterToIntersection(waterVector, analysisExtent);

    var waterMask = ee.FeatureCollection(waterVector.copyProperties(image)).set('system:time_start', image.get('system:time_start')).set('nodata_pixels', ee.Dictionary(mask.not().reduceRegion(ee.Reducer.sum(), analysisExtent, scale)).values().get(0)).set('cloud_pixels', ee.Dictionary(cloudMask.reduceRegion(ee.Reducer.sum(), analysisExtent, scale)).values().get(0))
    //.set('cloud_shadow_pixels', ee.Dictionary(cloudShadows.reduceRegion(ee.Reducer.sum(), analysisExtent, scale)).values().get(0))
    .set('snow_pixels', ee.Dictionary(cloudMask.reduceRegion(ee.Reducer.sum(), analysisExtent, scale)).values().get(0)).set('water_threshold', th);

    return {
      waterMask: waterMask,
      snowMask: ee.Image(0).int(),
      cloudMask: cloudMask,
      imageMask: mask, // image.select(0).mask(),
      edges: results.edges
    }
};

Algorithms.Sentinel2.getCloudPixelCount = function (image, info) {
    image = image.unitScale(info.unitScale[0], info.unitScale[1]);

    var clouds = Algorithms.Sentinel2.cloudScore(image);

    var cloudThreshold = 0.1;
    var cloudMask = clouds.gte(cloudThreshold);

    return ee.Dictionary(cloudMask.reduceRegion(ee.Reducer.sum(), analysisExtent, scale)).values().get(0);
};

Algorithms.Sentinel2.getSnowPixelCount = function (image, info) {
    return ee.Number(0);
};

Algorithms.Sentinel2.getNoDataPixelCount = function (image, info) {
    var mask = ee.ImageCollection(image.bandNames().map(function (b) {
        return image.select([b]).mask().rename('mask');
    })).product();
    return ee.Dictionary(mask.not().reduceRegion(ee.Reducer.sum(), analysisExtent, scale)).values().get(0);
};

// ============================= generated: collections.js
var collections = [{
    name: 'Sentinel 1 VV',
    nameShort: 'S1VV',
    asset: 'COPERNICUS/S1_GRD',
    type: 'radar',
    resolution: 10,
    filter: ee.Filter.and(
      ee.Filter.eq('transmitterReceiverPolarisation', 'VV'), 
      //ee.Filter.eq('system:index', 'S1A_IW_GRDH_1SSV_20150401T135830_20150401T135855_005291_006B13_303B')
      ee.Filter.eq('transmitterReceiverPolarisation', ['VV', 'VH']).not()
      ),
    bands: {
        readable: ['VV'],
        native: ['VV']
    },
    visual: { bands: ['VV'], min: -20, max: -5, forceRgbOutput: true },
    algorithms: Algorithms.Sentinel1
}, {
    name: 'Sentinel 1 VH',
    nameShort: 'S1VH',
    asset: 'COPERNICUS/S1_GRD',
    type: 'radar',
    resolution: 10,
    filter: ee.Filter.and(
      ee.Filter.eq('transmitterReceiverPolarisation', 'VH'), 
      ee.Filter.eq('transmitterReceiverPolarisation', ['VV', 'VH']).not()),
    bands: {
        readable: ['VH'],
        native: ['VH']
    },
    visual: { bands: ['VH'], min: -20, max: -5, forceRgbOutput: true },
    algorithms: Algorithms.Sentinel1
}, {
    name: 'Sentinel 1 VV+VH',
    nameShort: 'S1VVVH',
    asset: 'COPERNICUS/S1_GRD',
    type: 'radar',
    resolution: 10,
    filter: ee.Filter.and(
      ee.Filter.eq('transmitterReceiverPolarisation', ['VV', 'VH'])
    ),
    bands: {
        readable: ['VV', 'VH'],
        native: ['VV', 'VH']
    },
    visual: { bands: ['VV', 'VH', 'VV'], min: -20, max: -5 },
    algorithms: Algorithms.Sentinel1
}, {
    name: 'Sentinel 1 HH+HV',
    nameShort: 'S1HHHV',
    asset: 'COPERNICUS/S1_GRD',
    type: 'radar',
    resolution: 10,
    filter: ee.Filter.eq('transmitterReceiverPolarisation', ['HH', 'HV']),
    bands: {
        readable: ['HH', 'HV'],
        native: ['HH', 'HV']
    },
    visual: { bands: ['HH', 'HV', 'HH'], min: -20, max: -5 },
    algorithms: Algorithms.Sentinel1
}, {
    name: 'Landsat 8',
    nameShort: 'L8',
    asset: 'LANDSAT/LC8_L1T_TOA',
    type: 'optical',
    resolution: 15,
    bands: {
        readable: ['coastal', 'blue', 'green', 'red', 'nir', 'swir', 'swir2', 'pan', 'cirrus', 'temp', 'temp2', 'BQA'],
        native: ['B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8', 'B9', 'B10', 'B11', 'BQA']
    },
    visual: { bands: ['swir', 'nir', 'green'], min: 0.03, max: 0.5 },
    algorithms: Algorithms.Landsat
}, {
    name: 'Landsat 7',
    nameShort: 'L7',
    asset: 'LANDSAT/LE7_L1T_TOA',
    type: 'optical',
    resolution: 15,
    bands: {
        readable: ['blue', 'green', 'red', 'nir', 'swir', 'swir2', 'temp', 'temp2', 'pan'],
        native: ['B1', 'B2', 'B3', 'B4', 'B5', 'B5', 'B6_VCID_2', 'B6_VCID_2', 'B8']
    },
    visual: { bands: ['swir', 'nir', 'green'], min: 0.03, max: 0.5 },
    algorithms: Algorithms.Landsat
}, {
    name: 'Landsat 5',
    nameShort: 'L5',
    asset: 'LANDSAT/LT5_L1T_TOA',
    type: 'optical',
    resolution: 30,
    bands: {
        readable: ['blue', 'green', 'red', 'nir', 'swir', 'swir2', 'temp'],
        native: ['B1', 'B2', 'B3', 'B4', 'B5', 'B5', 'B6']
    },
    visual: { bands: ['swir', 'nir', 'green'], min: 0.03, max: 0.5 },
    algorithms: Algorithms.Landsat
}, {
    name: 'Landsat 4',
    nameShort: 'L4',
    asset: 'LANDSAT/LT4_L1T_TOA',
    type: 'optical',
    resolution: 30,
    bands: {
        readable: ['blue', 'green', 'red', 'nir', 'swir', 'swir2', 'temp'],
        native: ['B1', 'B2', 'B3', 'B4', 'B5', 'B5', 'B6']
    },
    visual: { bands: ['swir', 'nir', 'green'], min: 0.03, max: 0.5 },
    algorithms: Algorithms.Landsat
}, {
    name: 'Sentinel 2',
    nameShort: 'S2',
    asset: 'COPERNICUS/S2',
    type: 'optical',
    resolution: 10,
    bands: {
        readable: ['coastal', 'blue', 'green', 'red', 'red2', 'red3', 'red4', 'nir', 'nir2', 'water_vapour', 'cirrus', 'swir', 'swir2', 'QA10', 'QA20', 'QA60'],
        native: ['B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8', 'B8A', 'B9', 'B10', 'B11', 'B12', 'QA10', 'QA20', 'QA60']
    },
    visual: { bands: ['green', 'nir', 'green'], min: 500, max: 7000 },
    unitScale: [0, 10000],
    algorithms: Algorithms.Sentinel2
}, {
    name: 'ASTER',
    nameShort: 'ASTER',
    asset: 'ASTER/AST_L1T_003',
    type: 'optical',
    resolution: 15,
    filter: ee.Filter.and(ee.Filter.listContains('ORIGINAL_BANDS_PRESENT', 'B01'), ee.Filter.listContains('ORIGINAL_BANDS_PRESENT', 'B3N'), ee.Filter.listContains('ORIGINAL_BANDS_PRESENT', 'B10'),
    //ee.Filter.listContains('ORIGINAL_BANDS_PRESENT', 'B04')
    ee.Filter.gt('SOLAR_ELEVATION', 0) // exclude night scenes

    ),
    bands: {
        readable: ['green', 'red', 'nir', 'swir', 'swir2', 'swir3', 'swir4', 'swir5', 'swir6', 'temp', 'temp2', 'temp3', 'temp4', 'temp5'],
        native: ['B01', 'B02', 'B3N', 'B04', 'B05', 'B06', 'B07', 'B08', 'B09', 'B10', 'B11', 'B12', 'B13', 'B14']
    },
    //visual: {bands: ['swir', 'nir', 'green'], min:10, max:255},
    visual: { bands: ['green', 'nir', 'green'], min: 10, max: 255 },
    unitScale: [0, 255],
    algorithms: Algorithms.Aster
}, {
    name: 'ASTER T',
    nameShort: 'ASTER T',
    asset: 'ASTER/AST_L1T_003',
    type: 'optical',
    resolution: 90,
    filter: ee.Filter.and(ee.Filter.listContains('ORIGINAL_BANDS_PRESENT', 'B11'), ee.Filter.listContains('ORIGINAL_BANDS_PRESENT', 'B12'), ee.Filter.listContains('ORIGINAL_BANDS_PRESENT', 'B13'), ee.Filter.and(ee.Filter.listContains('ORIGINAL_BANDS_PRESENT', 'B01'), ee.Filter.listContains('ORIGINAL_BANDS_PRESENT', 'B3N')
    //ee.Filter.listContains('ORIGINAL_BANDS_PRESENT', 'B04')
    ).not()),
    bands: {
        readable: ['green', 'red', 'nir', 'swir', 'swir2', 'swir3', 'swir4', 'swir5', 'swir6', 'temp', 'temp2', 'temp3', 'temp4', 'temp5'],
        native: ['B01', 'B02', 'B3N', 'B04', 'B05', 'B06', 'B07', 'B08', 'B09', 'B10', 'B11', 'B12', 'B13', 'B14']
    },
    visual: { bands: ['temp', 'temp3', 'temp5'], min: 600, max: 1800, forceRgbOutput: true },
    algorithms: Algorithms.AsterT
}, {
    name: 'PROBA-V 100m',
    nameShort: 'P1',
    asset: 'VITO/PROBAV/S1_TOC_100M',
    type: 'optical',
    resolution: 100,
    bands: {
        readable: ['blue', 'red', 'nir', 'swir', 'SM', 'time'],
        native: ['BLUE', 'RED', 'NIR', 'SWIR', 'SM', 'TIME']
    },

    visual: { bands: ['red', 'nir', 'red'], min: 10, max: 1000 },
    unitScale: [0, 1000],
    algorithms: Algorithms.Proba
}, {
    name: 'PROBA-V 333m',
    nameShort: 'P2',
    asset: 'VITO/PROBAV/S1_TOC_333M',
    type: 'optical',
    resolution: 333,
    bands: {
        readable: ['blue', 'red', 'nir', 'swir', 'SM', 'time'],
        native: ['BLUE', 'RED', 'NIR', 'SWIR', 'SM', 'TIME']
    },
    visual: { bands: ['red', 'nir', 'red'], min: 10, max: 500 },
    unitScale: [0, 1000],
    algorithms: Algorithms.Proba
}, {
    name: 'MODIS Aqua MYD09GQ',
    nameShort: 'AQUA',
    asset: 'MODIS/MYD09GQ',
    type: 'optical',
    resolution: 250,
    bands: {
        readable: ['red', 'nir', 'quality', 'coverage'],
        native: ['sur_refl_b01', 'sur_refl_b02', 'QC_250m', 'obscov']
    },
    visual: { bands: ['red', 'nir', 'red'], min: 500, max: 5000 },
    unitScale: [0, 10000],
    algorithms: Algorithms.Modis
}, {
    name: 'MODIS Terra MOD09GQ',
    nameShort: 'TERRA',
    asset: 'MODIS/MOD09GQ',
    type: 'optical',
    resolution: 250,
    bands: {
        readable: ['red', 'nir', 'quality', 'coverage'],
        native: ['sur_refl_b01', 'sur_refl_b02', 'QC_250m', 'obscov']
    },
    visual: { bands: ['red', 'nir', 'red'], min: 500, max: 5000 },
    unitScale: [0, 10000],
    algorithms: Algorithms.Modis
}];

function translate(coord, x, y) {
  var x1 = ee.Number(coord.get(0)).subtract(x)
  var y1 = ee.Number(coord.get(1)).subtract(y)
  
  return ee.List([x1, y1])
}

/***
 * Draws frame for publishing purposes
 */

var Frame = function(bounds, props) {
  this.bounds = bounds 
  this.scale = Map.getScale()
  this.steps = 10
  this.palette = ['000000', 'ffffff']
  this.format = '%.1f'
  this.round = true
  this.size = 5
  this.showLeft = true
  this.showRight = false
  this.showTop = false
  this.showBottom = true
  
  this.parseProperties(props)
  
  // degree to meter multiplier
  this.scaleFactor = ee.Number(this.scale).divide(ee.Image().projection().nominalScale())
  this.marginSize = ee.Number(this.size).multiply(this.scaleFactor)
}

Frame.prototype.parseProperties = function(props) {
    if(props) {
      this.size = props.size || this.size
      this.scale = props.scale || this.scale
      this.steps = props.steps || this.steps
      this.palette = props.palette || this.palette
      this.format = props.format || this.format
      this.round = props.round !== 'undefined' ? props.round : this.round
      this.showLeft = props.showLeft !== 'undefined' ? props.showLeft : this.showLeft
      this.showRight = props.showRight !== 'undefined' ? props.showRight : this.showRight
      this.showTop = props.showTop !== 'undefined' ? props.showTop : this.showTop
      this.showBottom = props.showBottom !== 'undefined' ? props.showBottom : this.showBottom
    }
}

Frame.prototype.getMargin = function(orientation, pt0, pt1, labelMarginX, labelMarginY, showLabels) {
    var urOffsetX = 0
    var urOffsetY = 0
    var stepsX = 1
    var stepsY = 1
    var coord = 0

    switch(orientation) {
      case 'horizontal': 
        stepsX = this.steps
        stepsY = 1
        urOffsetX = 0
        urOffsetY = this.marginSize.multiply(-1)
        coord = 0
        break;
      case 'vertical': 
        stepsX = 1
        stepsY = this.steps
        urOffsetX = this.marginSize.multiply(-1.5)
        urOffsetY = 0
        coord = 1
        break;
    }
    
    var ll = pt0
    var ur = translate(pt1, urOffsetX, urOffsetY)

    var bounds = ee.Geometry.Rectangle([ll, ur], null, false)
    
    var width = ee.Number(ur.get(0)).subtract(ll.get(0))
    var height = ee.Number(ur.get(1)).subtract(ll.get(1))
    var origin = ee.Image.constant(pt0.get(0)).addBands(ee.Image.constant(pt0.get(1)))

    var margin = ee.Image.pixelLonLat()
      .subtract(origin)
      .divide([width, height]).multiply([stepsX, stepsY])
      .toInt().reduce(ee.Reducer.sum()).bitwiseAnd(1)
      .clip(bounds)

    // define base images
    var images = ee.List([
      margin.visualize({min:0, max:1, forceRgbOutput: true, palette: this.palette}),
      ee.Image().paint(bounds, 1, 1).visualize({palette:['000000']}),
    ])

    // add labels
    if(showLabels) {
      var start = ee.Number(pt0.get(coord))
      
      var offset = [
        width.divide(this.steps).multiply(1 - coord),
        height.divide(this.steps).multiply(coord),
      ]
      
      var stepSize = offset[0].add(offset[1])
  
      for(var i=0; i<this.steps+1; i++) {
        var markerText = start.add(stepSize.multiply(i)).format(this.format)
  
        var point = translate(
          pt0, 
          ee.Number(offset[0]).multiply(i).multiply(-1).add(ee.Number(labelMarginX).multiply(this.scaleFactor)),
          ee.Number(offset[1]).multiply(i).multiply(-1).add(ee.Number(labelMarginY).multiply(this.scaleFactor))
        )
  
        var imageLabel = Text.draw(markerText, ee.Geometry.Point(point), this.scale, {
          //fontSize:18, textColor: '000000', outlineColor: 'ffffff', outlineWidth: 2})
          fontSize:18, outlineColor: '000000', textColor: 'ffffff', outlineWidth: 3, outlineOpacity: 0.8})
          
        images = images.add(imageLabel)
      }
    }
    
    return images
}

Frame.prototype.draw = function() {
  var coords = ee.List(this.bounds.coordinates().get(0))
  var ll = ee.List(coords.get(0))
  var lr = ee.List(coords.get(1))
  var ur = ee.List(coords.get(2))
  var ul = ee.List(coords.get(3))

  // margin
  var margins = ee.List([
    this.getMargin('horizontal', translate(ll, 0, this.marginSize), translate(lr, 0, this.marginSize), 15, 5, this.showBottom), // bottom
    this.getMargin('horizontal', ul, ur, 15, -25, this.showTop), // top
    this.getMargin('vertical', translate(ll, this.marginSize, 0), translate(ul, this.marginSize, 0), 55, -5, this.showLeft), // left
    this.getMargin('vertical', lr, ur, -10, -5, this.showRight) // right
  ]).flatten()
  
  return ee.ImageCollection.fromImages(margins).mosaic()
}


/***
 * Draws a scalebar
 */
var Scalebar = {
  draw: function (pos, props) {
    var scale = Map.getScale()
    var units = 'km'
    var steps = 5
    var multiplier = 1000
    var palette = ['000000', 'ffffff']
    var format = '%.0f'
    var round = true

    if(props) {
      scale = props.scale || scale
      units = props.units || units
      steps = props.steps || steps
      multiplier = props.multiplier || multiplier
      palette = props.palette || palette
      format = props.format || format
      round = props.round !== 'undefined' ? props.round : round
    }

    var p = ee.Number(Map.getScale()).divide(ee.Image().projection().nominalScale())
    var pt0 = ee.List(pos.coordinates().get(0))
    var pt1 = ee.List(pos.coordinates().get(1))

    // scalebar
    var bounds = pos.buffer(Map.getScale() * 2).bounds()
    var ll = ee.List(ee.List(bounds.coordinates().get(0)).get(0))
    var ur = ee.List(ee.List(bounds.coordinates().get(0)).get(2))
    var width = ee.Number(ur.get(0)).subtract(ll.get(0))
    var height = ee.Number(ur.get(1)).subtract(ll.get(1))

    var origin = ee.Image.constant(ll.get(0)).addBands(ee.Image.constant(ll.get(1)))

    var scalebar = ee.Image.pixelLonLat()
      .subtract(origin)
      .divide([width, height]).multiply([steps, 1])
      .toInt().reduce(ee.Reducer.sum()).bitwiseAnd(1)
      .clip(bounds)

    // units
    var point = translate(pt1, p.multiply(-8), p.multiply(-7))
    var imageUnits = Text.draw(units, ee.Geometry.Point(point), scale, {
      fontSize:18, outlineColor: '000000', textColor: 'ffffff', outlineWidth: 3, outlineOpacity: 0.8})


    // define base images
    var images = ee.List([
      scalebar.visualize({min:0, max:1, forceRgbOutput: true, palette: palette}),
      ee.Image().paint(bounds, 1, 1).visualize({palette:['000000']}),
      imageUnits,
    ])
    
    // add labels
    var boundsMeters = bounds.transform(ee.Projection('EPSG:3857'), ee.ErrorMargin(1))
    var ll = ee.List(ee.List(boundsMeters.coordinates().get(0)).get(0))
    var ur = ee.List(ee.List(boundsMeters.coordinates().get(0)).get(2))
    var widthTargetUnits = ee.Number(ur.get(0)).subtract(ee.Number(ll.get(0))).divide(100).floor().multiply(100)
    
    for(var i=0; i<steps+1; i++) {
      var markerText = widthTargetUnits.divide(steps * multiplier).multiply(i).format(format)
      
      var point = translate(
        pt0, 
        width.divide(steps).multiply(i).multiply(-1).add(p.multiply(10)), 
        p.multiply(-20)
      )
      
      var imageLabel = Text.draw(markerText, ee.Geometry.Point(point), scale, {
        fontSize:18, outlineColor: '000000', textColor: 'ffffff', outlineWidth: 3, outlineOpacity: 0.8})
      
      images = images.add(imageLabel)
    }

    return ee.ImageCollection.fromImages(images).mosaic()
  },
}


/***
 * Draws gradient bar
 */
var GradientBar = {
  draw: function (pos, props) {
    var scale = Map.getScale()
    var palette = ['000000', 'ffffff']
    var format = '%.0f'
    var round = true
    var labels = []
    var min = 0
    var max = 1

    if(props) {
      labels = props.labels || labels
      scale = props.scale || scale
      palette = props.palette || palette
      format = props.format || format
      round = props.round !== 'undefined' ? props.round : round
      min = props.min || min
      max = props.max || max
    }

    var p = ee.Number(Map.getScale()).divide(ee.Image().projection().nominalScale())
    var pt0 = ee.List(pos.coordinates().get(0))
    var pt1 = ee.List(pos.coordinates().get(1))

    // scalebar
    var bounds = pos.buffer(Map.getScale() * 2).bounds()
    var ll = ee.List(ee.List(bounds.coordinates().get(0)).get(0))
    var ur = ee.List(ee.List(bounds.coordinates().get(0)).get(2))
    var width = ee.Number(ur.get(0)).subtract(ll.get(0))
    var height = ee.Number(ur.get(1)).subtract(ll.get(1))

    var origin = ee.Image.constant(ll.get(0)).addBands(ee.Image.constant(ll.get(1)))

    var bar = ee.Image.pixelLonLat()
      .subtract(origin).select(0).divide(width).clip(bounds)

    // define base images
    var images = ee.List([
      bar.visualize({min:0, max:1, forceRgbOutput: true, palette: palette}),
      ee.Image().paint(bounds, 1, 1).visualize({palette:['000000']}),
    ])
    
    // add labels
    
    labels.map(function(label) {
      var labelText = ee.Number(label).format(format)
      
      var labelOffset = ee.Number(label).subtract(min).divide(ee.Number(max).subtract(min))
        .multiply(width)
      
      var point = translate(
        pt0, 
        labelOffset.multiply(-1).add(p.multiply(8)), 
        p.multiply(2)
      )
      
      var imageLabel = Text.draw(labelText, ee.Geometry.Point(point), scale, {
        fontSize:18, textColor: '000000', 
        outlineColor: 'ffffff', outlineWidth: 3, outlineOpacity: 0.6})
      
      images = images.add(imageLabel)
    })

    return ee.ImageCollection.fromImages(images).mosaic()
  },
}

/***
 * Makes offset from the left bounds Geometry margin and splits into count pieces, returns locations.
 */
function getMarginLocations(bounds, margin, marginSize, count, scale) {
    var marginSize = ee.Number(marginSize).multiply(scale);
    var boundsSmall = bounds.buffer(marginSize.multiply(-1)).bounds();
    var coords = ee.List(boundsSmall.coordinates().get(0));
    
    if(margin === 'left') {
      var pt0 = ee.List(coords.get(0));
      var pt1 = ee.List(coords.get(3));
    } else if(margin === 'right') {
      var pt0 = ee.List(coords.get(1));
      var pt1 = ee.List(coords.get(2));
    }

    var marginLine = ee.Geometry.LineString([pt0, pt1]);

    var distances = ee.List.sequence(0, marginLine.length(), marginLine.length().divide(count));

    var lineToFirstPoint = function lineToFirstPoint(g) {
        var coords = ee.Geometry(g).coordinates().get(0);
        return ee.Feature(ee.Algorithms.GeometryConstructors.Point(coords));
    };

    var points = ee.FeatureCollection(marginLine.cutLines(distances).geometries().map(lineToFirstPoint));

    //Map.addLayer(points, {color: 'green'}, 'text locations')

    return points.toList(count).map(function (o) {
        return ee.Feature(o).geometry();
    });
}


// ============================= generated: surface-water-footer.js
app();