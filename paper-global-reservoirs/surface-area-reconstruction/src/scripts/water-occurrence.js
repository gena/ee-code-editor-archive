let start = '2010-01-01';
let stop = '2017-01-01';

let debug = false;

let errorMargin = Map.getScale();

let scale = 10;

// maximun extent there the analysis is performed
let analysisExtent = ee.FeatureCollection([aoi.buffer(500)]);

Map.centerObject(aoi, 15);

let app = function () {
    // select image collection to use
    collections = collections.filter((c) => {
        return c.type === 'optical' && c.resolution <= 30
    });

    // global filter
    let filter = ee.Filter.and(
        ee.Filter.bounds(aoi),
        ee.Filter.date(start, stop)
    );

    let results = collections.map(function (collection) {
        // render all images, keep id and time
        let images = ee.ImageCollection(collection.asset)
            .select(collection.bands.native, collection.bands.readable)
            .filter(filter);

        if (collection.filter) {
            images = images.filter(collection.filter)
        }

        images = Algorithms.filter(images, collection, aoi, {
            skipEmpty: true,
            maxNoDataPixels: 10, // e.g. Landsat 7
            maxCloudPixels: 10,
            maxSnowPixels: 10,
        });

        print(collection.name, images.toList(5000, 0).size());

        // rendered image
        let renderedImages =  images.map(function(image) {
            return image.visualize(collection.visual).set('system:index', image.get('system:index'));
        });

        // water as an image
        let waterImages = images.map(function (image) {
            let  waterMask = ee.Image(collection.algorithms.detectWater(image, collection, true));
            return waterMask.rename('water').addBands(waterMask.mask().rename('mask'))
                .set('system:index', image.get('system:index'))
                .set('system:time_start', image.get('system:time_start'));
        });

        // water as a feature
        let waterFeatures = images.map((image)  => {
            return ee.Image(collection.algorithms.detectWater(image, collection))
        });

        // add to map (image, mask, edge, feature)
        images.getInfo(function (images) {
            count = Math.min(20, images.features.length);

            let listRendered = ee.ImageCollection(renderedImages).toList(count, 0);
            let listWater = ee.ImageCollection(waterImages).toList(count, 0);
            // let listWaterFeatures = ee.FeatureCollection(waterFeatures).toList(count, 0);

            for(let i = 0; i < count; i++) {
                // preview image
                // BUG for S2
                // var rendered = ee.Image(listRendered.get(i));
                // Map.addLayer(rendered, {}, collection.name + ' image', false);

                Map.addLayer(ee.Image(images.features[i].id).select(collection.bands.native, collection.bands.readable), collection.visual, collection.name + ' image', false);

                //collection.algorithms.onLayerAdd(rendered, collection);

                // preview water mask
                let water = ee.Image(listWater.get(i));
                let waterMask = water.select('water');
                let waterEdge = getEdge(waterMask);
                Map.addLayer(waterEdge.mask(waterEdge), { palette: ['ffffff'] }, collection.name + ' water mask edge', false);
                Map.addLayer(waterMask.mask(waterMask), { palette: ['ffffff'] }, collection.name + ' water mask', false);

                // preview water feature
                // let waterFeature = ee.FeatureCollection(listWaterFeatures.get(i));
                // let waterFeatureImage = ee.Image().paint(waterFeature, 1, 1);
                // Map.addLayer(waterFeatureImage.mask(waterFeatureImage), { palette: ['ffffff'] }, collection.name + ' water mask (feature)', false);
            }
        });

        return {waterImages: waterImages, waterFeatures: waterFeatures, renderedImages: renderedImages };
    });

    // merge all image and feature collections
    let merge = (items, t) => {
        return t(ee.List(items).iterate((current, prev) => {
            return t(t(current).merge(prev)) }, t([])
        ));
    };

    let renderedImages = merge(results.map((o) => { return o.renderedImages }), ee.ImageCollection);
    let waterImages = merge(results.map((o) => { return o.waterImages }), ee.ImageCollection);

    print('total 1: ', renderedImages.size());
    print('total 2: ', renderedImages.toList(5000, 0).size());
    print('total 3: ', renderedImages.map(function(i) { return i.select(0).mask() }).sum().reduceRegion(ee.Reducer.max(), aoi, 30).values().get(0));

    // compute water occurrence
    let waterOccurrence = waterImages.select(['water']).sum().divide(waterImages.select(['mask']).sum());
    print(ui.Chart.image.histogram(waterOccurrence, aoi, 10, 100));
    var cutoff = { min: 0.04, max: 0.99 };
    let mask = waterOccurrence.gt(cutoff.min).unmask().focal_mode(3, 'circle', 'pixels', 3);
    Map.addLayer(rescale(waterOccurrence, 'img', [cutoff.min, cutoff.max]).mask(mask), { palette: Palettes.water }, 'water occurrence');

    // show water occurrence histogram for every edge
    let plotEdgeHistograms = function() {
        renderedImages.size().getInfo(function(count) {
            let listWater = ee.ImageCollection(waterImages).sort('system:time_start').toList(count, 0);
            let listRendered = ee.ImageCollection(renderedImages).sort('system:time_start').toList(count, 0);

            for (let i = 0; i < 68; i++) {
                // preview image
                let rendered = ee.Image(listRendered.get(i));
                Map.addLayer(rendered, {}, i + ' image', false);

                //collection.algorithms.onLayerAdd(rendered, collection);

                // preview water mask
                let water = ee.Image(listWater.get(i));
                let waterMask = water.select('water');
                let waterEdge = getEdge(waterMask);
                Map.addLayer(waterEdge.mask(waterEdge), { palette: ['ffffff'] }, i + ' water mask edge', false);
                // Map.addLayer(waterMask.mask(waterMask), { palette: ['ffffff'] }, collection.name + ' water mask', false);

                // plot water occurrence values at the edge
                print(i);
                print(ui.Chart.image.histogram(waterOccurrence.mask(waterEdge), aoi, scale, 50))
            }
        })
    };

    // plotEdgeHistograms();


    // export
    Export.video.toDrive({
        collection: renderedImages,
        description: 'reservioir-images-' + start + '_' + stop,
        dimensions: 1920,
        region: ee.Geometry(Map.getBounds(true)),
        framesPerSecond: 1,
        crs: 'EPSG: 3857',
        maxFrames: 2000
    });

    Export.image.toDrive({
        image: waterOccurrence,
        description: 'reservoir-water-occurrence-' + start + '_' + stop,
        fileNamePrefix: 'reservoir-water-occurrence-' + start + '_' + stop,
        region: Map.getBounds(true), scale: scale
    });

    Export.table.toDrive({
        collection: ee.FeatureCollection([ee.Geometry(Map.getBounds(true))]),
        description: 'reservioir-images-extent-' + start + '_' + stop,
        fileFormat: 'GeoJSON'
    });

    /*
    let waterFeatures = merge(results.map((o) => { return o.waterFeatures }), ee.FeatureCollection);
    Export.table.toDrive({
        collection: waterFeatures,
        description: 'reservoir-water-' + start + '_' + stop,
        fileFormat: 'GeoJSON'
    });
    */
};


























