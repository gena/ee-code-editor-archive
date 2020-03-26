let app = function () {
    let aoi = ee.Geometry(Map.getBounds(true));

    let start = '2013-01-01';
    let stop = '2019-01-01';

    let resolutionMin = 30;

    print(start + '..' + stop);

    let skip = [
        'ASTER T',
        'ASTER',
        //'Landsat 8',
        'Landsat 7',
        'Landsat 5',
        'Landsat 4',
        //'Sentinel 2',
        //'PROBA-V 100m',
        //'PROBA-V 333m',
        //'MODIS Aqua MYD09GQ',
        //'MODIS Terra MOD09GQ',
        'Sentinel 1 VV',
        'Sentinel 1 VH',  // too noisy
        'Sentinel 1 VV+VH',
        'Sentinel 1 HH+HV',
    ];

    // global filter
    let filter = ee.Filter.and(
        ee.Filter.bounds(aoi),
        ee.Filter.date(start, stop)
    );

    // generate rendered image collections
    let rendered = collections.map(function (collection) {
        if (skip.indexOf(collection.name) !== -1 || collection.resolution > resolutionMin) {
            return ee.ImageCollection([])
        }

        // combine global filter with custom asset filter
        let f = collection.filter ? ee.Filter.and(filter, collection.filter) : filter;

        // render all images
        let rendered = ee.ImageCollection(collection.asset)
            .select(collection.bands.native, collection.bands.readable)

            // filter
            .filter(f)

            // skip empty images
/*
            .map(function (image) {
                let value = ee.Dictionary(image.select(collection.visual.bands[0]).reduceRegion(ee.Reducer.firstNonNull(), aoi.centroid(30), 100)).values().get(0);
                return image.set('any_value', value)
            }).filter(ee.Filter.neq('any_value', null))
*/

            // render
            .map(function (image) {
                return image
            });

        print(collection.name, rendered.aggregate_count('system:id'));

        return rendered
    });


    // merge all rendered collections and sort by time
    function mergeCollection(current, prev) {
        return ee.ImageCollection(prev).merge(current)
    }

    let images = ee.ImageCollection(ee.List(rendered).iterate(mergeCollection, ee.ImageCollection([]))).sort('system:time_start');

    print(images.size());

    let bounds = ee.Geometry(Map.getCenter()).buffer(Map.getScale()*100,100).bounds();

    // gallery options
    let g = {
        rows: 3, columns: 5,
        options: { proj: 'EPSG:3857', flipX: false, flipY: true }
    };

    let minValue = 0.02;
    let maxValue = 0.35;

    let gallery = community.ImageGallery(images, bounds, g.rows, g.columns, g.options);
    Map.addLayer(gallery, {bands: ['swir','nir','green'], min:minValue, max:maxValue}, 'gallery (false)', false);
    Map.addLayer(gallery, {bands: ['red','green','blue'], min:minValue, max:maxValue}, 'gallery (true)', false);

};