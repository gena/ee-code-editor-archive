let Algorithms = {
    Aster: {},
    AsterT: {},
    Landsat: {},
    Sentinel1: {},
    Sentinel2: {},
    Proba: {},
    Modis: {},
};

Algorithms.filter = (images, collection, geometry, options) => {
    // filter out images with no data wihin aoi
    if (options.skipEmpty) {
        images = images
            .map((image) => {
                let value = ee.Dictionary(image.select(collection.visual.bands[0]).reduceRegion(ee.Reducer.firstNonNull(), geometry, 100)).values().get(0);
                return image.set('any_value', value);
            }).filter(ee.Filter.neq('any_value', null))
    }

    // filter out images with missing values
    if (options.maxNoDataPixels >= 0) {
        if (!collection.algorithms.getNoDataPixelCount) {
            print('Warning: getNoDataPixelCount is not implemented for ' + collection.name);
        } else {
            images = images
                .map(function (image) {
                    return image.set('nodata_pixel_count', collection.algorithms.getNoDataPixelCount(image, collection));
                }).filter(ee.Filter.lte('nodata_pixel_count', 50))
        }
    }

    // filter snow/ice images
    if (options.maxSnowPixels >= 0) {
        if (!collection.algorithms.getSnowPixelCount) {
            print('Warning: getSnowPixelCount  is not implemented for ' + collection.name);
        } else {
            images = images
                .map((image) => {
                    return image.set('snow_pixel_count', collection.algorithms.getSnowPixelCount(image, collection))
                }).filter(ee.Filter.lte('snow_pixel_count', options.maxSnowPixels));
        }
    }

    // filter cloudy images
    if (options.maxCloudPixels >= 0) {
        if (!collection.algorithms.getCloudPixelCount) {
            print('Warning: getCloudixelCount  is not implemented for ' + collection.name);
        } else {
            images = images
                .map((image) => {
                    return image.set('cloud_pixel_count', collection.algorithms.getCloudPixelCount(image, collection))
                }).filter(ee.Filter.lte('cloud_pixel_count', options.maxCloudPixels));
        }
    }

    return images;
};