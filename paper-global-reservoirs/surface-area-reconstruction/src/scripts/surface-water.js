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
//let start = '1984-01-01';
let start = '2016-07-15';
let stop = '2018-01-01';

// default number of layers to show
let layerCount = 2;

let debug = true;
//let debug = false

let renderWater = false;
//let renderWater = true;

//let cloudFreeOnly = true;
let cloudFreeOnly = false;

let errorMargin = Map.getScale();

let scale = 30;

//aoi = ee.Geometry(Map.getBounds(true)).centroid(1)
//aoi = ee.Geometry(Map.getBounds(true)).bounds()
//aoi = ee.Geometry(Map.getBounds(true)).centroid(errorMargin).buffer(Map.getScale() * 200, ee.ErrorMargin(errorMargin))

// when true - use permanent water mask to zoom in to the reservoir within AOI area
//var usePermanentWaterMask = false
let usePermanentWaterMask = true;

// number of processed images to add for inspection (water detection, count per asset)
let mapLayerCountToAddProcessed = debug ? layerCount : 0;

// number of rendered frames to added before video export
let mapLayerCountToAddRendered = debug ? 0 : layerCount ;

// where to perform analysis (focal area), defined around permanent water / AOI
let focusSearchDistance = 500;
let focusSmoothDistance = 1000;

let only = [
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

let skip = [
    'ASTER T',
    //'ASTER'
    //'Landsat 8',
    //'Landsat 7',
    //'Landsat 5',
    //'Landsat 4',
    //'Sentinel 2',
    'PROBA-V 100m',
    'PROBA-V 333m',
    'MODIS Aqua MYD09GQ',
    'MODIS Terra MOD09GQ',
    //'Sentinel 1 VV',
    //'Sentinel 1 VH',  // too noisy
    //'Sentinel 1 VV+VH',
    //'Sentinel 1 HH+HV',
];

// permanent water mask, potential water, water occurrence
let glcf = ee.ImageCollection('GLCF/GLS_WATER');
let waterMaskPermanent = glcf.map((i) => { return i.eq(2)}).sum().gt(0);

// potential maximum water extent
let waterMaskPermanentVector;

let analysisExtent;
let focusNearWater;

if (usePermanentWaterMask) {
    // focus around permanent water
    waterMaskPermanentVector = waterMaskPermanent.mask(waterMaskPermanent).reduceToVectors({geometry: aoi.buffer(focusSearchDistance), scale: errorMargin});

    // add transparent edge
    analysisExtent = ee.FeatureCollection([aoi.buffer(focusSearchDistance)]);

    let nearWater = waterMaskPermanent.clip(analysisExtent).focal_max(focusSearchDistance, 'circle', 'meters').distance(ee.Kernel.euclidean(focusSmoothDistance, 'meters'), false);
    nearWater = ee.Image(focusSmoothDistance).subtract(nearWater).divide(focusSmoothDistance).unmask();
    focusNearWater = nearWater.reproject('EPSG:3857', null, 120);
} else {
    // focus near user-defined AOI
    waterMaskPermanentVector = ee.FeatureCollection([aoi.buffer(focusSearchDistance)]);

    analysisExtent = ee.FeatureCollection([aoi.buffer(focusSearchDistance)]);
    focusNearWater = ee.Image().float().paint(analysisExtent, 1).unmask();
}
let b = Map.getBounds();

print('Map w/h ratio: ', (b[2] - b[0]) / (b[3] - b[1]));
print('Error margin: ', errorMargin);
print('Date range: ' + start + '..' + stop);

//Map.centerObject(aoi, 14)

Map.setOptions('HYBRID');

let app = function () {
    // the actual number of image collections, used for progress
    let collectionCount = collections.length;

    if (only.length > 0) {
        collectionCount = only.length
    } else {
        collectionCount = collectionCount - skip.length
    }

    function exportRendered() {
        // export all images video
        renderedImagesAll = renderedImagesAll.sort('system:time_start');

        print('Total rendered: ', renderedImagesAll.aggregate_count('system:id'))

        let resolutionW = 1920;
        let fps = 1;
        let name = 'multisensor-3-cloudfree-';

        function exportWithoutText() {
            Export.video.toDrive({
                collection: renderedImagesAll,
                description: name + start + '_' + stop + '_fps' + fps,

                dimensions: resolutionW,
                region: ee.Geometry(Map.getBounds(true)),
                framesPerSecond: fps,
                crs: 'EPSG: 3857',
                maxFrames: 2000
            })
        }

        //exportWithoutText();

        function exportWithText() {
            let textScale = Map.getScale() * 2;
            let textBounds = ee.Geometry(Map.getBounds(true));
            let textMarginSize = 20; // scale units
            let textLocationCount = 20;
            let textLocations = getLeftMarginLocations(textBounds, textMarginSize, textLocationCount, textScale);

            // add to rendered (for export)
            function renderWithText(i) {
                let id = i.get('system:id');

                let collection = ee.Dictionary(i.get('collection'));

                let startTime = i.get('system:time_start');

                let str = ee.Date(startTime).format('YYYY-MM-dd HH:MM');
                let pt1 = textLocations.get(1);
                let textDate = Text.draw(str, pt1, textScale, {
                    outlineColor: '000000',
                    outlineWidth: 3,
                    outlineOpacity: 0.6,
                    fontSize: 16,
                    textColor: 'white'
                });

                let pt2 = textLocations.get(3);
                let textSensor = Text.draw(collection.get('name'), pt2, textScale, {
                    outlineColor: '000000',
                    outlineWidth: 3,
                    outlineOpacity: 0.6,
                    fontSize: 16,
                    textColor: 'white'
                });

                //let permenentWaterEdgeBg = waterMaskEdge.focal_max(2)
                //permenentWaterEdgeBg = permenentWaterEdgeBg.mask(permenentWaterEdgeBg).visualize({palette: ['000000'], opacity:0.5})
                //let permenentWaterEdge = waterMaskEdge.mask(waterMaskEdge).visualize({palette: ['ffffff']})

                let rendered = ee.ImageCollection.fromImages([
                    i,
                    //permenentWaterEdgeBg,
                    permenentWaterEdge,
                    textDate,
                    textSensor
                ]).mosaic()
                    .set('system:time_start', startTime)
                    .set('collection', collection)
                    .set('system:id', id);

                rendered = rendered.copyProperties(i);

                return rendered
            }

/*
            let renderedImagesAll = renderedImagesAll.map(renderWithText);

            Export.video.toDrive({
                collection: renderedImagesAll,
                description: name + start + '_' + stop + '-text' + '_fps' + fps,

                dimensions: resolutionW,
                region: ee.Geometry(Map.getBounds(true)),
                framesPerSecond: fps,
                crs: 'EPSG: 3857',
                maxFrames: 2000
            })
*/
        }

        exportWithText()

        let map = ee.Feature(ee.Geometry(Map.getBounds(true)), {});
        Export.table.toDrive({
            collection: ee.FeatureCollection(map),
            description: name + start + '_' + stop + '_extent',
            fileFormat: 'GeoJSON'
        });

        let features = ee.FeatureCollection(renderedImagesAll);
        Export.table.toDrive({
            collection: features,
            description: name + start + '_' + stop + '_info',
            fileFormat: 'GeoJSON'
        });

        // add to map
        mapLayerCountToAddRendered = Math.min(totalImageCount, mapLayerCountToAddRendered);

        let list = renderedImagesAll.toList(mapLayerCountToAddRendered, 0);
        for (let i = 0; i < mapLayerCountToAddRendered; i++) {
            let image = ee.Image(list.get(i));
            Map.addLayer(image, {}, 'frame ' + i, i < 5);
            pushLayer(image, ee.Dictionary(image.get('collection')).get('name'))
        }

        // update dates
        updateLayerNames()
    }

    function addBaseLayers() {
        // lake and reservoir locations retrieved from USGS NWIS: http://maps.waterdata.usgs.gov/mapper/nwisquery.html?URL=http://waterdata.usgs.gov/usa/nwis/current?type=lake&format=sitefile_output&sitefile_output_format=xml&column_name=agency_cd&column_name=site_no&column_name=station_nm&column_name=site_tp_cd&column_name=dec_lat_va&column_name=dec_long_va&column_name=agency_use_cd
        let reservoirs = ee.FeatureCollection('ft:1POcfYkRBhBSZIbnrNudwnozHYtpva9vdyYBMf5QZ');

        let index = 3;
        let reservoir = ee.Feature(reservoirs.toList(1, index).get(0));

        Map.addLayer(reservoirs, {color: 'ff0000', opacity: 0.7}, 'USA reservoirs and lakes locations', false);

        // add permanent watermask
        Map.addLayer(waterMaskPermanent.mask(waterMaskPermanent), {
            palette: ['0000aa'],
            opacity: 0.2
        }, 'permanent mask water (GLCF)', false);

        Map.addLayer(waterMaskPermanentVector, {
            palette: ['0000aa'],
            opacity: 0.2
        }, 'permanent mask water vector (GLCF)', false);

        let waterMaskPermanentEdge = ee.Algorithms.CannyEdgeDetector(waterMaskPermanent, 0.99);
        Map.addLayer(waterMaskPermanentEdge.mask(waterMaskPermanentEdge), {palette: ['ffffff']}, 'permanent water mask edge (GLCF)');

        // focus on the images near water
        Map.addLayer(focusNearWater.mask(focusNearWater.subtract(1).multiply(-1)), {
            min: 0,
            max: 1,
            palette: ['000000']
        }, 'potential water focus', true, 0.3);

        //Map.centerObject(reservoir, 13)
        Map.addLayer(aoi, {}, 'aoi', false)
    }

    // UI

    // add progress label
    function updateProgress() {
        let progressLabel = ui.Label({
            value: 'Scanning image collections ' + processedCount + ' of ' + collectionCount,
            style: {fontWeight: 'bold', fontSize: '12px', margin: '10px 5px'}
        });

        progressPanel.clear();
        progressPanel.add(progressLabel)
    }

    let processedCount = 0;
    let progressPanel = ui.Panel();
    Map.add(progressPanel);
    updateProgress();

    // keep layer info in order to update layer names async
    let layerInfos = [];

    function pushLayer(image, text) {
        let layers = Map.layers();
        layerInfos.push({image: image, text: text, layer: layers.get(layers.length() - 1)})
    }

    // updates layer names at the end (async), add date
    function updateLayerName(layerInfo) {
        function onGetDate(date, error) {
            if (layerInfo.text) {
                ee.String(layerInfo.text).getInfo(function (text) {
                    layerInfo.layer.setName(layerInfo.layer.getName() + ' ' + date + ' ' + text);
                })
            } else {
                layerInfo.layer.setName(layerInfo.layer.getName() + ' ' + date);
            }
        }

        ee.Date(layerInfo.image.get('system:time_start')).format('YYYY-MM-dd HH:mm').getInfo(onGetDate);
    }

    function updateLayerNames() {
        layerInfos.map(updateLayerName);
    }

    // update progress and add base layers
    let totalImageCount = 0;

    function onProcessed(collection) {
        processedCount++;
        updateProgress();

        if (processedCount == collectionCount) {
            Map.remove(progressPanel);

            exportRendered();
            addBaseLayers();

            print('Total images found: ' + totalImageCount)
        }
    }

    // all rendered images from all sensors
    let renderedImagesAll = ee.ImageCollection([]);

    // process image collection (add layers, export, query)
    function processImages(collection) {
        if (only.length && only.indexOf(collection.name) === -1) {
            return;
        }

        if (skip.indexOf(collection.name) != -1) {
            return
        }

        // print number of images at AOI
        let images = ee.ImageCollection(collection.asset)
            .filterBounds(aoi)
            .select(collection.bands.native, collection.bands.readable)
            .map(function (i) {
                return i.set('bounds', aoi)
            });

        if (collection.filter) {
            images = images.filter(collection.filter)
        }

        if (start && stop) {
            images = images.filterDate(start, stop)
        }

        // BUT: EE does image footprints are not alway correct, make sure we have images with values
        images = images.map(function (image) {
            let value = ee.Dictionary(image.select(collection.visual.bands[0]).reduceRegion(ee.Reducer.firstNonNull(), aoi, 100)).values().get(0);
            return image.set('aoi_value', value);
            //.updateMask(focusNearWater)

        }).filter(ee.Filter.neq('aoi_value', null));

        // apply addition transform if needed
        if (collection.transform) {
            images = images.map(collection.transform)
        }

        renderedImagesAll = renderedImagesAll.merge(images.map(function (i) {
            let rendered = i.visualize(collection.visual)
                .set('collection', collection)
                .set('system:time_start', i.get('system:time_start'))
                .set('system:id', i.get('system:id'));

            if (renderWater && !debug) {
                // add water edge on top
                let waterVector = ee.FeatureCollection(collection.algorithms.detectWater(i, collection));

                let waterImage = ee.Image(0).byte().paint(waterVector, 1, 1);

                rendered = ee.ImageCollection([
                    rendered,
                    waterImage.mask(waterImage).visualize({palette: 'ffffff', forceRgbOutput: true})
                ]).mosaic();

                return rendered
                    .copyProperties(waterVector)
                    .set('collection', collection)
                    .set('system:time_start', i.get('system:time_start'))
                    .set('system:id', i.get('system:id'))
                    .set('water_area', waterVector.geometry().area(ee.ErrorMargin(errorMargin)))

            } else {
                return rendered
                    .copyProperties(i)
                    .set('collection', collection)
                    .set('system:time_start', i.get('system:time_start'))
                    .set('system:id', i.get('system:id'))
            }
        }));

        if (cloudFreeOnly) {
            renderedImagesAll = renderedImagesAll
                .filter(ee.Filter.and(
                    ee.Filter.lt('cloud_pixels', 10),
                    ee.Filter.gt('water_area', 100),
                    ee.Filter.lt('snow_pixels', 10),
                    ee.Filter.eq('nodata_pixels', 0)
                ));
        }

        // add to map (client, async)
        function processOnCount(count, error) {
            print(collection.name + ': ', count);

            if (count === 'undefined') {
                onProcessed(collection);
                return;
            }

            totalImageCount += count;

            // add a few layers
            let layerCount = Math.min(mapLayerCountToAddProcessed, count);
            let list = images.toList(layerCount, 0);
            for (let i = 0; i < layerCount; i++) {
                let image = ee.Image(list.get(i));
                Map.addLayer(image, collection.visual, collection.name + ' ' + i, i === 0);

                pushLayer(image, collection.name);

                if (collection.algorithms.onLayerAdd && debug) {
                    collection.algorithms.onLayerAdd(image, collection)
                }
            }

            onProcessed(collection);
        }

        let count = images.select(0).aggregate_count('system:id');
        count.getInfo(processOnCount)
    }

    collections.map(processImages);
};