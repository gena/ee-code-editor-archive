/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var ned = ee.Image("USGS/NED"),
    locationFrameArea = /* color: #d63000 */ee.Geometry.LineString(
        [[-7.66021728515625, 32.527420967550626],
         [-7.347450256347656, 32.369232999085185]]),
    locationScalebar = /* color: #98ff00 */ee.Geometry.LineString(
        [[-7.647857666015625, 32.38952902092758],
         [-7.585201263427734, 32.38677482820566]]),
    aoi = /* color: #d63000 */ee.Geometry.Polygon(
        [[[-7.655067443847656, 32.4454644308762],
          [-7.655754089355469, 32.40982048303656],
          [-7.6389312744140625, 32.391268467797026],
          [-7.5977325439453125, 32.388369371070056],
          [-7.54486083984375, 32.39039874854987],
          [-7.488899230957031, 32.401124700564964],
          [-7.3903656005859375, 32.41648668224032],
          [-7.356376647949219, 32.439959375222],
          [-7.3505401611328125, 32.46342595776104],
          [-7.3889923095703125, 32.47501213905002],
          [-7.4686431884765625, 32.487465621020846],
          [-7.530097961425781, 32.49615307623967],
          [-7.560310363769531, 32.50455015213679],
          [-7.611122131347656, 32.52307885527122],
          [-7.633781433105469, 32.51584153518403],
          [-7.646827697753906, 32.48312157883687]]]),
    occurrenceAlMassira = ee.Image("users/gena/eo-bathymetry/NDWI/NDWI-4764-v9-Dam-Al-Massira");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
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

var occurrence = occurrenceAlMassira.unitScale(-0.05, 0.33).mask(occurrenceAlMassira.gt(-0.05))
Map.addLayer(occurrence)

var mask = occurrence.mask()
occurrence = occurrence.unmask(0, false).mask(mask.focal_max(20, 'square', 'meters'))

var bgWhite = ee.Image(1).visualize({palette:['202020']})

occurrence = occurrence.unmask().resample('bicubic')
  //.where(occurrence.unmask().gt(0.04).focal_min(4).focal_max(8).not(), 0)
  

var start = '1984-01-01';
var stop = '2018-01-01';

var start = '2017-01-01'; 
var stop = '2017-03-01';


var suffix = ee.Date(new Date().getTime()).format('_YYYY-MM-dd_HH_mm').getInfo()


// default number of layers to show
var layerCount = 1;
var debug = true;

//var layerCount = 10;
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

var maskClouds = true
var maskSnow = true

//var maskClouds = true
//var maskSnow = true

var fixedThreshold = -1
//var fixedThreshold = 0

var cannyTh = 0.4
var cannySigma = 0.6

var scale = 30;

var errorMargin = scale * 0.5;

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
/*
'ASTER',
'Landsat 8',
'Landsat 7',
'Landsat 5',
'Landsat 4',
'Sentinel 2',
*/

'Sentinel 1 VV',
'Sentinel 1 VH',
'Sentinel 1 VV+VH',
'Sentinel 1 HH+HV', // coarser

'PROBA-V 100m', 'PROBA-V 333m', 'MODIS Aqua MYD09GQ', 'MODIS Terra MOD09GQ'];

var utils = require('users/gena/packages2:utils.js')

utils.setAoi(aoi)
utils.setDebug(debug)
utils.setMaskClouds(maskClouds)
utils.setMaskSnow(maskSnow)
utils.setFixedThreshold(fixedThreshold)


var collections = require('users/gena/packages2:collections.js').collections

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



var app = function app() {
      // add frame and scalebar
    

    var frame = new utils.Frame(locationFrameArea.bounds(), {steps:5, size:4, format: '%.3f', showLeft: true, showBottom: true}).draw()
    var scalebar = utils.Scalebar.draw(locationScalebar, {steps:2, palette: ['5ab4ac', 'f5f5f5'], multiplier: 1, format: '%.0f', units: 'm'})

    var translateParams = {x: 5250, y: 0, units: 'meters', proj: 'EPSG:3857'}

    var frame2 = new utils.Frame(locationFrameArea.bounds(), {steps:5, size:4, format: '%.3f'}).draw()
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
                      utils.fillMissingWater(waterImage, output.snowMask, output.cloudMask, output.imageMask, output.edges)
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
                    waterImageVis.get('water_edge_vis'),
                    
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


app()