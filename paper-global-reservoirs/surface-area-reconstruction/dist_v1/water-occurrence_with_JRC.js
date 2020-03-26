/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var aoi = /* color: #d63000 */ee.Geometry.MultiPoint(),
    ned = ee.Image("USGS/NED"),
    occurrence = ee.Image("JRC/GSW1_0/GlobalSurfaceWater"),
    dam = /* color: #d63000 */ee.Geometry.Point([-121.48063659667969, 39.54283784718952]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
// add 25% cut-off to exclude fully intermitten water
occurrence = occurrence.select('occurrence')
var occurrence25 = occurrence.mask(occurrence.gt(25).focal_max(5, 'square', 'pixels').reproject(occurrence.projection()))
occurrence25 = occurrence25.updateMask(occurrence25.gt(0))
 
Map.addLayer(occurrence, {}, 'water occurrence', false)
Map.addLayer(occurrence25, {}, 'water occurrence > 20')

var blobs = occurrence25.mask()
  .reduceResolution(ee.Reducer.anyNonZero(), true)
  .reproject(occurrence.projection().scale(10,10))
  
//Map.addLayer(blobs)  

var vectors = blobs.reduceToVectors({geometry: Map.getBounds(true), scale: 300, eightConnected: false})
Map.addLayer(vectors.filterBounds(dam))

var aoi = vectors.geometry()
// var aoi = ee.Geometry(Map.getBounds(true))

'use strict';

// ============================= generated: imports.js
// ============================= generated: water-occurrence.js
var start = '2010-01-01';
var stop = '2017-01-01';

var debug = false;
//var debug = true;

var errorMargin = Map.getScale();

var scale = 30;

// maximun extent there the analysis is performed
var analysisExtent = ee.FeatureCollection([aoi.buffer(500)]);

//Map.centerObject(aoi, 15);

var app = function app() {
    // select image collection to use
    collections = collections.filter(function (c) {
        return c.type === 'optical' && c.resolution <= 30 // && c.nameShort == 'S2';
    });

    // global filter
    var filter = ee.Filter.and(ee.Filter.bounds(aoi), ee.Filter.date(start, stop));

    var results = collections.map(function (collection) {
        // render all images, keep id and time
        var images = ee.ImageCollection(collection.asset).select(collection.bands.native, collection.bands.readable).filter(filter);

        if (collection.filter) {
            images = images.filter(collection.filter);
        }

        images = Algorithms.filter(images, collection, aoi, {
            skipEmpty: true,
            maxNoDataPixels: 10, // e.g. Landsat 7
            maxCloudPixels: 10,
            maxSnowPixels: 10
        });

        print(collection.name, images.toList(5000, 0).size());

        // rendered image
        var renderedImages = images.map(function (image) {
            return image.visualize(collection.visual).set('system:index', image.get('system:index'));
        });

        // water as an image
        var waterImages = images.map(function (image) {
            var waterMask = ee.Image(collection.algorithms.detectWater(image, collection, true));
            return waterMask.rename('water').addBands(waterMask.mask().rename('mask')).set('system:index', image.get('system:index')).set('system:time_start', image.get('system:time_start'));
        });

        // water as a feature
        var waterFeatures = images.map(function (image) {
            return ee.Image(collection.algorithms.detectWater(image, collection));
        });

        // add to map (image, mask, edge, feature)
        images.getInfo(function (images) {
            var count = Math.min(20, images.features.length);

            var listRendered = ee.ImageCollection(renderedImages).toList(count, 0);
            var listWater = ee.ImageCollection(waterImages).toList(count, 0);
            // let listWaterFeatures = ee.FeatureCollection(waterFeatures).toList(count, 0);

            for (var i = 0; i < count; i++) {
                // preview image
                
                // BUG for S2
                // var rendered = ee.Image(listRendered.get(i));
                // Map.addLayer(rendered, {}, collection.name + ' image', false);
                
                Map.addLayer(ee.Image(images.features[i].id).select(collection.bands.native, collection.bands.readable), collection.visual, collection.name + ' image', false);

                //collection.algorithms.onLayerAdd(rendered, collection);

                // preview water mask
                var water = ee.Image(listWater.get(i));
                var waterMask = water.select('water');
                var waterEdge = getEdge(waterMask);
                Map.addLayer(waterEdge.mask(waterEdge), { palette: ['ffffff'] }, collection.name + ' water mask edge', false);
                Map.addLayer(waterMask.mask(waterMask), { palette: ['ffffff'] }, collection.name + ' water mask', false);

                // preview water feature
                // let waterFeature = ee.FeatureCollection(listWaterFeatures.get(i));
                // let waterFeatureImage = ee.Image().paint(waterFeature, 1, 1);
                // Map.addLayer(waterFeatureImage.mask(waterFeatureImage), { palette: ['ffffff'] }, collection.name + ' water mask (feature)', false);
            }
        });

        return { waterImages: waterImages, waterFeatures: waterFeatures, renderedImages: renderedImages };
    });

    // merge all image and feature collections
    var merge = function merge(items, t) {
        return t(ee.List(items).iterate(function (current, prev) {
            return t(t(current).merge(prev));
        }, t([])));
    };

    var renderedImages = merge(results.map(function (o) {
        return o.renderedImages;
    }), ee.ImageCollection);
    var waterImages = merge(results.map(function (o) {
        return o.waterImages;
    }), ee.ImageCollection);

    print('total 1: ', renderedImages.size());
    print('total 2: ', renderedImages.toList(5000, 0).size());
    
    /*
    print('total 3: ', renderedImages.map(function (i) {
        return i.select(0).mask();
    }).sum().reduceRegion(ee.Reducer.max(), aoi, 30).values().get(0));
    */

    // compute water occurrence
    var waterOccurrence = waterImages.select(['water']).sum().divide(waterImages.select(['mask']).sum());
    //print(ui.Chart.image.histogram(waterOccurrence, aoi, 10, 100));
    var cutoff = { min: 0.05, max: 0.99 };
    var mask = waterOccurrence.gt(cutoff.min).unmask().focal_mode(3, 'circle', 'pixels', 3);
    Map.addLayer(rescale(waterOccurrence, 'img', [cutoff.min, cutoff.max]).mask(mask), { palette: Palettes.water }, 'water occurrence');

    // show water occurrence histogram for every edge
    var plotEdgeHistograms = function plotEdgeHistograms() {
        renderedImages.size().getInfo(function (count) {
            var listWater = ee.ImageCollection(waterImages).sort('system:time_start').toList(count, 0);
            var listRendered = ee.ImageCollection(renderedImages).sort('system:time_start').toList(count, 0);

            for (var i = 0; i < 84; i++) {
                // preview image
                var rendered = ee.Image(listRendered.get(i));
                Map.addLayer(rendered, {}, i + ' image', false);

                //collection.algorithms.onLayerAdd(rendered, collection);

                // preview water mask
                var water = ee.Image(listWater.get(i));
                var waterMask = water.select('water');
                var waterEdge = getEdge(waterMask);
                Map.addLayer(waterEdge.mask(waterEdge), { palette: ['ffffff'] }, i + ' water mask edge', false);
                // Map.addLayer(waterMask.mask(waterMask), { palette: ['ffffff'] }, collection.name + ' water mask', false);

                // plot water occurrence values at the edge
                //print(i);
                //print(ui.Chart.image.histogram(waterOccurrence.mask(waterEdge), aoi, scale, 50));
            }
        });
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

    var cloudMaskBuffer = cloudMask.focal_min(50, 'circle', 'meters').focal_max(250, 'circle', 'meters').reproject(cloudScore.projection());

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
function computeThresholdUsingOtsu(image, scale, bounds, th, g, skipShort, weightGradient, minValue) {
    // clip image edges
    var mask = image.mask().gt(0).focal_min(ee.Number(scale).multiply(3), 'circle', 'meters');

    // detect sharp changes
    var edge = ee.Algorithms.CannyEdgeDetector(image, th, g);
    edge = edge.multiply(mask);

    // take the largest changes, estimate gradient around edge and use that as a weight
    if (weightGradient) {
        var gradient = image.gradient().abs();
        var edgeGradient = gradient.select(0).max(gradient.select(1)).mask(edge.gt(th)).reproject(image.projection().scale(2, 2));

        // take the upper percentiles only
        var mode = ee.Number(ee.Dictionary(edgeGradient.reduceRegion({maxPixels: 1e9, reducer: ee.Reducer.mode(), geometry: bounds, scale: scale})).values().get(0));
        var σ = ee.Number(ee.Dictionary(edgeGradient.reduceRegion({maxPixels: 1e9, reducer: ee.Reducer.stdDev(), geometry: bounds, scale: scale})).values().get(0));
        var _buckets = 50;
        var significantEdgesMask = edgeGradient.gt(mode);

        edge = edge.updateMask(significantEdgesMask);

        if (debug) {
            // gradient around edges
            if (edgeGradient) {
                //print(ui.Chart.image.histogram(edgeGradient, bounds, scale, _buckets));
                Map.addLayer(edgeGradient, {}, 'edge gradient', false);
                Map.addLayer(significantEdgesMask.mask(significantEdgesMask), {}, 'significant edges', false);

                print('Mode: ', mode);
                print('Sigma: ', σ);
                //Map.addLayer(edgeGradient.updateMask(significantEdgesMask), {min:0, max:mode.add(σ.multiply(2)), palette:['ffffff', 'ff0000']}, 'edge gradient, upper percentiles', false)
            }
        }
    }

    // advanced, detect edge lengths
    var coonnectedVis = void 0;
    if (skipShort) {
        var connected = edge.mask(edge).lt(0.8).connectedPixelCount(50, true);

        var edgeLong = connected.gte(50);

        edge = edgeLong;

        coonnectedVis = connected.updateMask(edgeLong).visualize({ palette: ['ffffff', 'ff0000'], min: 0, max: 50 });
    }

    // buffer around NDWI edges
    var edgeBuffer = edge.focal_max(ee.Number(scale).multiply(1), 'square', 'meters');
    var imageEdge = image.mask(edgeBuffer);

    // compute threshold using Otsu thresholding
    var buckets = 100;
    var hist = ee.Dictionary(ee.Dictionary(imageEdge.reduceRegion({maxPixels: 1e9, reducer: ee.Reducer.histogram(buckets), geometry: bounds, scale: scale})).values().get(0));

    var threshold = ee.Algorithms.If(hist.contains('bucketMeans'), otsu(hist), 0.3);
    threshold = ee.Number(threshold); //.add(0.05)

    if (debug) {
        Map.addLayer(edge.mask(edge), { palette: ['ff0000'] }, 'edges', false);

        if (skipShort) {
            Map.addLayer(coonnectedVis, {}, 'edges (connected)', false);
        }

        print('Threshold: ', threshold);

        //print(ui.Chart.image.histogram(image, bounds, scale, buckets));
        //print(ui.Chart.image.histogram(imageEdge, bounds, scale, buckets));
        Map.addLayer(mask.mask(mask), { palette: ['000000'] }, 'image mask', false);
    }

    return minValue ? threshold.max(minValue) : threshold;
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
            var value = ee.Dictionary(image.select(collection.visual.bands[0]).reduceRegion({maxPixels: 1e9, reducer: ee.Reducer.firstNonNull(), geometry: geometry, scale: 100})).values().get(0);
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
    image = image.unitScale(info.unitScale[0], info.unitScale[1]) // TODO: fix temperature
    .copyProperties(image);

    image = ee.Image(image);

    var snow = Algorithms.Aster.snowScore(image);

    var clouds = Algorithms.Aster.cloudScore(image);

    var waterScore = image.resample('bicubic').normalizedDifference(['green', 'nir']);

    var cloudThreshold = 0.1;
    var snowThreshold = 0.4;
    var cloudMask = clouds.gte(cloudThreshold);
    var snowMask = snow.gte(snowThreshold);
    var i = waterScore.updateMask(cloudMask.not().and(snowMask.not())).clip(aoi);

    var th = computeThresholdUsingOtsu(i, 30, aoi, 0.3, 1, true, false);

    var water = i.gte(ee.Image.constant(th));

    var az = ee.Number(image.get('SOLAR_AZIMUTH'));
    var zen = ee.Number(image.get('SOLAR_ELEVATION'));
    var cloudShadows = projectClouds(az, zen, clouds, cloudThreshold);

    var mask = ee.ImageCollection(image.bandNames().map(function (b) {
        return image.select([b]).mask().rename('mask');
    })).product();

    if (returnImage) {
        return water.set('system:time_start', image.get('system:time_start')).set('nodata_pixels', ee.Dictionary(mask.not().reduceRegion({maxPixels: 1e9, reducer: ee.Reducer.sum(), geometry: analysisExtent, scale: scale})).values().get(0)).set('cloud_pixels', ee.Dictionary(cloudMask.reduceRegion(ee.Reducer.sum(), analysisExtent, scale)).values().get(0))
        //.set('cloud_shadow_pixels', ee.Dictionary(cloudShadows.reduceRegion(ee.Reducer.sum(), analysisExtent, scale)).values().get(0))
        .set('snow_pixels', ee.Dictionary(snowMask.reduceRegion({reducer: ee.Reducer.sum(), geometry: analysisExtent, scale: scale})).values().get(0)).set('water_threshold', th);
    }

    var waterVector = water.mask(water).reduceToVectors({maxPixels:1e9, geometry: analysisExtent, scale: errorMargin });
    waterVector = filterToMaximumAreaFraction(waterVector, analysisExtent);

    return ee.FeatureCollection(waterVector.copyProperties(image)).set('system:time_start', image.get('system:time_start')).set('nodata_pixels', ee.Dictionary(mask.not().reduceRegion({maxPixels: 1e9, reducer: ee.Reducer.sum(), geometry: analysisExtent, scale: scale})).values().get(0)).set('cloud_pixels', ee.Dictionary(cloudMask.reduceRegion(ee.Reducer.sum(), analysisExtent, scale)).values().get(0)).set('cloud_shadow_pixels', ee.Dictionary(cloudShadows.reduceRegion(ee.Reducer.sum(), analysisExtent, scale)).values().get(0)).set('snow_pixels', ee.Dictionary(snowMask.reduceRegion(ee.Reducer.sum(), analysisExtent, scale)).values().get(0)).set('water_threshold', th);
};

Algorithms.Aster.getCloudPixelCount = function (image, info) {
    image = image.unitScale(info.unitScale[0], info.unitScale[1]) // TODO: fix temperature
    .copyProperties(image);

    image = ee.Image(image);

    var clouds = Algorithms.Aster.cloudScore(image);

    var cloudThreshold = 0.1;
    var cloudMask = clouds.gte(cloudThreshold);

    return ee.Dictionary(cloudMask.reduceRegion({maxPixels: 1e9, reducer: ee.Reducer.sum(), geometry: analysisExtent, scale: scale})).values().get(0);
};

Algorithms.Aster.getSnowPixelCount = function (image, info) {
    image = image.unitScale(info.unitScale[0], info.unitScale[1]) // TODO: fix temperature
    .copyProperties(image);

    image = ee.Image(image);

    var snow = Algorithms.Aster.snowScore(image);

    var snowThreshold = 0.4;
    var snowMask = snow.gte(snowThreshold);

    return ee.Dictionary(snowMask.reduceRegion({maxPixels: 1e9, reducer: ee.Reducer.sum(), geometry: analysisExtent, scale: scale})).values().get(0);
};

Algorithms.Aster.getNoDataPixelCount = function (image, info) {
    // TODO: check required bands only
    var mask = image.mask(); //ee.ImageCollection(image.bandNames().map(function(b) { return image.select([b]).mask().rename('mask') })).product();

    return ee.Dictionary(mask.not().reduceRegion({maxPixels: 1e9, reducer: ee.Reducer.sum(), geometry: analysisExtent, scale: scale})).values().get(0);
};

Algorithms.Aster.onLayerAdd = function (image, info) {
    image = image.unitScale(info.unitScale[0], info.unitScale[1]) // TODO: fix temperature
    .copyProperties(image);

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
    var waterScore = image.resample('bicubic').normalizedDifference(['green', 'nir']);
    //let waterScore = rescale(waterScore, 'img', [-0.2, 0.35])
    //waterScore = waterScore.mask(waterScore)

    Map.addLayer(waterScore, { palette: Palettes.water }, 'water score (NDWI)', false);

    Map.addLayer(cloudShadows.mask().not(), {}, 'cloud shadows mask', false);

    var i = waterScore
    //.updateMask(cloudShadows.mask().not().and(clouds.lt(cloudThreshold)).multiply(focusNearWater))
    .updateMask(clouds.lt(cloudThreshold)).clip(aoi);

    var th = computeThresholdUsingOtsu(i, 15, aoi, 0.3, 1, true, false, -0.1);

    var water = i.gte(ee.Image.constant(th));
    Map.addLayer(water.mask(water), {}, 'water mask (NDWI)', false);

    var waterVector = water.mask(water).reduceToVectors({maxPixels:1e9, geometry: analysisExtent, scale: errorMargin });
    //waterVector = filterToIntersection(waterVector, analysisExtent)
    waterVector = filterToMaximumAreaFraction(waterVector, analysisExtent);

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

    var mode = ee.Number(ee.Dictionary(t.reduceRegion({maxPixels: 1e9, reducer: ee.Reducer.mode(), geometry: waterPermanentCenter, scale: errorMargin * 5})).get('temp'));

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
    var waterVector = water.mask(water).reduceToVectors({maxPixels:1e9, geometry: analysisExtent, scale: errorMargin });

    // filter to overlaps met permanent water center
    waterVector = filterToMaximumAreaFraction(waterVector, analysisExtent);

    return waterVector.set('system:time_start', image.get('system:time_start')).set('nodata_pixels', 0).set('cloud_pixels', 0).set('cloud_shadow_pixels', 0).set('snow_pixels', 0).set('water_threshold', th);
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

    var clouds = Algorithms.Landsat.cloudScore(image);
    Map.addLayer(clouds.mask(clouds.unitScale(0.15, 0.25)), { palette: ['000000', 'FF0000'], min: 0, max: 1 }, 'cloud score', false);

    var vegetation = Algorithms.Landsat.vegetationScore(image);
    Map.addLayer(vegetation.mask(vegetation), { palette: ['000000', '00FF00'], min: 0, max: 1 }, 'vegetation score', false);

    var cloudThreshold = 0.35;
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

    var i = mndwi
    // .updateMask(cloudShadows.mask().not().and(clouds.lt(cloudThreshold)).multiply(focusNearWater))
    .updateMask(clouds.lt(cloudThreshold)).clip(aoi);

    var th = computeThresholdUsingOtsu(i, 30, aoi, 0.3, 2, false, false);

    var water = i.gte(ee.Image.constant(th));
    Map.addLayer(water.mask(water), {}, 'water mask (NDWI)', false);

    var waterVector = water.mask(water).reduceToVectors({maxPixels:1e9, geometry: analysisExtent, scale: errorMargin });
    waterVector = filterToIntersection(waterVector, analysisExtent);

    Map.addLayer(waterVector, { color: '5050ff' }, 'water mask', false, 0.6);

    print(Algorithms.Landsat.detectWater(image, info));
};

Algorithms.Landsat.detectWater = function (image, info, returnImage) {
    var snow = Algorithms.Landsat.snowScore(image);
    var clouds = Algorithms.Landsat.cloudScore(image);
    var vegetation = Algorithms.Landsat.vegetationScore(image);

    var waterScore = image.resample('bicubic').normalizedDifference(['green', 'nir']);
    //let waterScore = image.resample('bicubic').normalizedDifference(['green', 'swir'])

    var cloudThreshold = 0.2;
    var snowThreshold = 0.5;
    var cloudMask = clouds.gte(cloudThreshold);
    var snowMask = snow.gte(snowThreshold);

    var i = waterScore.updateMask(cloudMask.not().and(snowMask.not())).clip(aoi);

    var th = computeThresholdUsingOtsu(i, 30, aoi, 0.3, 2, false, false);

    var water = i.gte(ee.Image.constant(th));

    water = water.focal_max(15, 'circle', 'meters');

    var mask = ee.ImageCollection(image.bandNames().map(function (b) {
        return image.select([b]).mask().rename('mask');
    })).product();

    var az = ee.Number(image.get('SUN_AZIMUTH'));
    var zen = ee.Number(image.get('SUN_ELEVATION'));
    var cloudShadows = projectClouds(az, zen, clouds, cloudThreshold);

    if (returnImage) {
        return water.set('system:time_start', image.get('system:time_start')).set('nodata_pixels', ee.Dictionary(mask.not().reduceRegion({maxPixels: 1e9, reducer: ee.Reducer.sum(), geometry: analysisExtent, scale: scale})).values().get(0)).set('cloud_pixels', ee.Dictionary(cloudMask.reduceRegion(ee.Reducer.sum(), analysisExtent, scale)).values().get(0))
        //.set('cloud_shadow_pixels', ee.Dictionary(cloudShadows.reduceRegion(ee.Reducer.sum(), analysisExtent, scale)).values().get(0))
        .set('snow_pixels', ee.Dictionary(snowMask.reduceRegion(ee.Reducer.sum(), analysisExtent, scale)).values().get(0)).set('water_threshold', th);
    }

    var waterVector = water.mask(water).reduceToVectors({maxPixels:1e9, geometry: analysisExtent, scale: errorMargin });
    waterVector = filterToIntersection(waterVector, analysisExtent);

    return ee.FeatureCollection(waterVector.copyProperties(image)).set('system:time_start', image.get('system:time_start')).set('nodata_pixels', ee.Dictionary(mask.not().reduceRegion({maxPixels: 1e9, reducer: ee.Reducer.sum(), geometry: analysisExtent, scale: scale})).values().get(0)).set('cloud_pixels', ee.Dictionary(cloudMask.reduceRegion(ee.Reducer.sum(), analysisExtent, scale)).values().get(0)).set('cloud_shadow_pixels', ee.Dictionary(cloudShadows.reduceRegion(ee.Reducer.sum(), analysisExtent, scale)).values().get(0)).set('snow_pixels', ee.Dictionary(snowMask.reduceRegion(ee.Reducer.sum(), analysisExtent, scale)).values().get(0)).set('water_threshold', th);
};

Algorithms.Landsat.getCloudPixelCount = function (image, info) {
    var clouds = Algorithms.Landsat.cloudScore(image);

    var cloudThreshold = 0.2;
    var cloudMask = clouds.gte(cloudThreshold);

    return ee.Dictionary(cloudMask.reduceRegion({maxPixels: 1e9, reducer: ee.Reducer.sum(), geometry: analysisExtent, scale: scale})).values().get(0);
};

Algorithms.Landsat.getSnowPixelCount = function (image, info) {
    var snow = Algorithms.Landsat.snowScore(image);

    var snowThreshold = 0.5;
    var snowMask = snow.gte(snowThreshold);

    return ee.Dictionary(snowMask.reduceRegion({maxPixels: 1e9, reducer: ee.Reducer.sum(), geometry: analysisExtent, scale: scale})).values().get(0);
};

Algorithms.Landsat.getNoDataPixelCount = function (image, info) {
    var mask = ee.ImageCollection(image.bandNames().map(function (b) {
        return image.select([b]).mask().rename('mask');
    })).product();
    return ee.Dictionary(mask.not().reduceRegion({maxPixels: 1e9, reducer: ee.Reducer.sum(), geometry: analysisExtent, scale: scale})).values().get(0);
};

// ============================= generated: algorithms-modis.js

// ============================= generated: algorithms-proba.js

// ============================= generated: algorithms-sentinel1.js
Algorithms.Sentinel1.detectWater = function (image, info, returnImage) {
    image = image.select(0);

    // remove bad pixel by detecting low entropy areas
    var glcm = image.multiply(10).toInt().glcmTexture({ size: 4 });
    var lowEntropy = glcm.select(0).lt(0.1);
    image = image.updateMask(lowEntropy);

    var K = 4.5; //3.5
    var iterations = 10;
    var method = 1;

    image = image.clip(aoi);

    image = removeSpeckleNoisePeronaMalik(image, iterations, K, method);

    var scale = image.projection().nominalScale();

    var clipEdges = false;
    var th = computeThresholdUsingOtsu(image.select(0), scale, aoi, 0.6, 2, clipEdges, true);

    // detect water by taking darker pixels
    var water = image.lt(th);

    // vectorize
    var waterVector = water.mask(water).reduceToVectors({maxPixels:1e9, geometry: analysisExtent, scale: errorMargin });

    // filter to overlaps met permanent water center
    waterVector = filterToMaximumAreaFraction(waterVector, analysisExtent);

    // take the largest
    waterVector = ee.Feature(waterVector.map(function (f) {
        return f.set('area', f.geometry().area(ee.ErrorMargin(scale)));
    }).sort('area', false).first());

    water = ee.Image(0).byte().paint(waterVector, 1).rename('water').max(lowEntropy.not().clip(waterVector.convexHull(ee.ErrorMargin(errorMargin)))); // fill-in smooth areas within detected water

    var mask = ee.ImageCollection(image.bandNames().map(function (b) {
        return image.select([b]).mask().rename('mask');
    })).product();

    if (returnImage) {
        return water.set('system:time_start', image.get('system:time_start')).set('nodata_pixels', ee.Dictionary(mask.not().reduceRegion(
            {maxPixels: 1e9, reducer: ee.Reducer.sum(), geometry: analysisExtent, scale: scale})).values().get(0)).set('cloud_pixels', 0).set('cloud_shadow_pixels', 0).set('snow_pixels', 0).set('water_threshold', th);
    }

    waterVector = water.mask(water).reduceToVectors({maxPixels:1e9, geometry: analysisExtent, scale: errorMargin });

    return ee.FeatureCollection(waterVector.copyProperties(image)).set('system:time_start', image.get('system:time_start')).set('nodata_pixels', ee.Dictionary(mask.not().reduceRegion(
        {maxPixels: 1e9, reducer: ee.Reducer.sum(), geometry: analysisExtent, scale: scale})).values().get(0)).set('cloud_pixels', 0).set('cloud_shadow_pixels', 0).set('snow_pixels', 0).set('water_threshold', th);
};;

Algorithms.Sentinel1.onLayerAdd = function (image, info) {
    image = image.select(0);

    Map.addLayer(image, { min: info.visual.min, max: info.visual.max }, 'original', false);

    // remove bad pixel by detecting low entropy areas
    var glcm = image.multiply(10).toInt().glcmTexture({ size: 4 }).reproject(image.projection());

    var asmBandName = ee.String(image.bandNames().get(0)).cat('_asm');

    // Homogeneity, Angular Second Moment (ASM)
    Map.addLayer(glcm.select(asmBandName), {}, 'homogeneity', false);

    var homogene = glcm.select(asmBandName).lt(0.1);
    image = image.updateMask(homogene);

    Map.addLayer(homogene.mask(homogene), {}, 'homogeneity mask', false);

    Map.addLayer(aoi, {}, 'aoi', false);

    var K = 4.5; //3.5
    var iterations = 10;
    var method = 1;

    image = image.clip(aoi);
    //.updateMask(image.select(0).gt(-24))

    image = removeSpeckleNoisePeronaMalik(image, iterations, K, method);

    Map.addLayer(image, { min: info.visual.min, max: info.visual.max }, 'smooth', false);

    var scale = image.projection().nominalScale();

    var clipEdges = false;
    //let clipEdges = true
    var th = computeThresholdUsingOtsu(image.select(0), scale, aoi, 0.6, 2, clipEdges, true);

    // detect water by taking darker pixels
    var water = image.lt(th);

    // vectorize
    var waterVector = water.mask(water).reduceToVectors({maxPixels:1e9, geometry: analysisExtent, scale: errorMargin });

    // filter to overlaps met permanent water center
    //waterVector = filterToIntersection(waterVector, ee.FeatureCollection([waterPermanentCenter]))
    waterVector = filterToMaximumAreaFraction(waterVector, analysisExtent);

    // take the largest
    waterVector = ee.Feature(waterVector.map(function (f) {
        return f.set('area', f.geometry().area(ee.ErrorMargin(scale)));
    }).sort('area', false).first());

    water = ee.Image(0).byte().paint(waterVector, 1).rename('water').max(homogene.not().clip(waterVector.convexHull(ee.ErrorMargin(errorMargin)))); // fill-in smooth areas within detected water

    Map.addLayer(homogene.mask(homogene.not()), { palette: ['ffffff'] }, 'smooth mask', false);

    water = water.focal_mode(scale, 'circle', 'meters', 3);

    Map.addLayer(water.mask(water), { palette: ['ffffff'] }, 'water', false);

    var waterEdge = water.subtract(water.focal_min(1));

    water = ee.ImageCollection([water.mask(water).visualize({ palette: ['5050ff'], opacity: 0.2 }), waterEdge.mask(waterEdge).visualize({ palette: ['ffffff'], opacity: 0.9 })]).mosaic();

    Map.addLayer(water.mask(water), {}, 'water (vector)', false);

    return image;
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
    // Map.addLayer(img.select('cirrus'),{'min':0,'max':0.1},'cirrus')
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
    // .updateMask(cloudShadows.mask().not().and(clouds.lt(cloudThreshold)).multiply(focusNearWater))
    .updateMask(clouds.lt(cloudThreshold)).clip(aoi);

    var th = computeThresholdUsingOtsu(i, 30, aoi, 0.3, 2, false, false);

    var water = i.gte(ee.Image.constant(th));
    Map.addLayer(water.mask(water), {}, 'water mask (NDWI)', false);

    var waterVector = water.mask(water).reduceToVectors({maxPixels:1e9, geometry: analysisExtent, scale: errorMargin });
    waterVector = filterToIntersection(waterVector, analysisExtent);

    Map.addLayer(waterVector, { color: '5050ff' }, 'water mask', false, 0.6);
};

Algorithms.Sentinel2.detectWater = function (image, info, returnImage) {
    image = image.unitScale(info.unitScale[0], info.unitScale[1]).copyProperties(image);

    image = ee.Image(image);

    var clouds = Algorithms.Sentinel2.cloudScore(image);

    var waterScore = image.resample('bicubic').normalizedDifference(['green', 'nir']);

    var cloudThreshold = 0.1;
    var cloudMask = clouds.gte(cloudThreshold);
    var i = waterScore.updateMask(cloudMask.not()).clip(aoi);

    var th = computeThresholdUsingOtsu(i, 30, aoi, 0.3, 2, false, false);

    var water = i.gte(ee.Image.constant(th));

    var az = ee.Number(image.get('MEAN_SOLAR_AZIMUTH_ANGLE'));
    var zen = ee.Number(image.get('MEAN_SOLAR_ZENITH_ANGLE'));
    var cloudShadows = projectClouds(az, zen, clouds, cloudThreshold);

    var mask = ee.ImageCollection(image.bandNames().map(function (b) {
        return image.select([b]).mask().rename('mask');
    })).product();

    if (returnImage) {
        return water.set('system:time_start', image.get('system:time_start')).set('nodata_pixels', ee.Dictionary(mask.not().reduceRegion(
            {maxPixels: 1e9, reducer: ee.Reducer.sum(), geometry: analysisExtent, scale: scale})).values().get(0)).set('cloud_pixels', ee.Dictionary(cloudMask.reduceRegion(ee.Reducer.sum(), analysisExtent, scale)).values().get(0))
        //.set('cloud_shadow_pixels', ee.Dictionary(cloudShadows.reduceRegion(ee.Reducer.sum(), analysisExtent, scale)).values().get(0))
        .set('snow_pixels', ee.Dictionary(cloudMask.reduceRegion(
            {maxPixels: 1e9, reducer: ee.Reducer.sum(), geometry: analysisExtent, scale: scale})).values().get(0)).set('water_threshold', th);
    }

    var waterVector = water.mask(water).reduceToVectors({maxPixels:1e9, geometry: analysisExtent, scale: errorMargin });
    waterVector = filterToIntersection(waterVector, analysisExtent);

    return ee.FeatureCollection(waterVector.copyProperties(image)).set('system:time_start', image.get('system:time_start')).set('nodata_pixels', ee.Dictionary(mask.not().reduceRegion(
        {maxPixels: 1e9, reducer: ee.Reducer.sum(), geometry: analysisExtent, scale: scale})).values().get(0)).set('cloud_pixels', ee.Dictionary(cloudMask.reduceRegion(ee.Reducer.sum(), analysisExtent, scale)).values().get(0))
    //.set('cloud_shadow_pixels', ee.Dictionary(cloudShadows.reduceRegion(ee.Reducer.sum(), analysisExtent, scale)).values().get(0))
    .set('snow_pixels', ee.Dictionary(cloudMask.reduceRegion(
      {maxPixels: 1e9, reducer: ee.Reducer.sum(), geometry: analysisExtent, scale: scale})).values().get(0)).set('water_threshold', th);
};

Algorithms.Sentinel2.getCloudPixelCount = function (image, info) {
    image = image.unitScale(info.unitScale[0], info.unitScale[1]);

    var clouds = Algorithms.Sentinel2.cloudScore(image);

    var cloudThreshold = 0.1;
    var cloudMask = clouds.gte(cloudThreshold);

    return ee.Dictionary(cloudMask.reduceRegion(
        {maxPixels: 1e9, reducer: ee.Reducer.sum(), geometry: analysisExtent, scale: scale})).values().get(0);
};

Algorithms.Sentinel2.getSnowPixelCount = function (image, info) {
    return ee.Number(0);
};

Algorithms.Sentinel2.getNoDataPixelCount = function (image, info) {
    var mask = ee.ImageCollection(image.bandNames().map(function (b) {
        return image.select([b]).mask().rename('mask');
    })).product();
    return ee.Dictionary(mask.not().reduceRegion(
        {maxPixels: 1e9, reducer: ee.Reducer.sum(), geometry: analysisExtent, scale: scale})).values().get(0);
};

// ============================= generated: collections.js
var collections = [{
    name: 'Sentinel 1 VV',
    nameShort: 'S1VV',
    asset: 'COPERNICUS/S1_GRD',
    type: 'radar',
    resolution: 10,
    filter: ee.Filter.and(ee.Filter.eq('transmitterReceiverPolarisation', 'VV'), ee.Filter.eq('transmitterReceiverPolarisation', ['VV', 'VH']).not()),
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
    filter: ee.Filter.and(ee.Filter.eq('transmitterReceiverPolarisation', 'VH'), ee.Filter.eq('transmitterReceiverPolarisation', ['VV', 'VH']).not()),
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
    filter: ee.Filter.eq('transmitterReceiverPolarisation', ['VV', 'VH']),
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
// ============================= generated: water-occurrence-footer.js
app();