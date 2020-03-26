var Algorithms = {
    Aster: require('users/gena/packages2:algorithms-aster.js').Algorithms,
    AsterT: require('users/gena/packages2:algorithms-asterT.js').Algorithms,
    Landsat: require('users/gena/packages2:algorithms-landsat.js').Algorithms,
    Sentinel1: require('users/gena/packages2:algorithms-sentinel1.js').Algorithms,
    Sentinel2: require('users/gena/packages2:algorithms-sentinel2.js').Algorithms,
    // Proba: {},
    // Modis: {}
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


exports.Algorithms = Algorithms

