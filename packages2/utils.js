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

var debug = false;

function setDebug(d) {
   debug = d
}


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
        var mode = ee.Number(ee.Dictionary(edgeGradient.reduceRegion(ee.Reducer.mode(), bounds, scale)).values().get(0));
        var σ = ee.Number(ee.Dictionary(edgeGradient.reduceRegion(ee.Reducer.stdDev(), bounds, scale)).values().get(0));
        var _buckets = 50;
        var significantEdgesMask = edgeGradient.gt(mode);

        edge = edge.updateMask(significantEdgesMask);

        if (debug) {
            // gradient around edges
            if (edgeGradient) {
                print(ui.Chart.image.histogram(edgeGradient, bounds, scale, _buckets));
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
    var hist = ee.Dictionary(ee.Dictionary(imageEdge.reduceRegion(ee.Reducer.histogram(buckets), bounds, scale)).values().get(0));

    var threshold = ee.Algorithms.If(hist.contains('bucketMeans'), otsu(hist), 0.3);
    threshold = ee.Number(threshold); //.add(0.05)

    if (debug) {
        Map.addLayer(edge.mask(edge), { palette: ['ff0000'] }, 'edges', false);

        if (skipShort) {
            Map.addLayer(coonnectedVis, {}, 'edges (connected)', false);
        }

        print('Threshold: ', threshold);

        print(ui.Chart.image.histogram(image, bounds, scale, buckets));
        print(ui.Chart.image.histogram(imageEdge, bounds, scale, buckets));
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

exports.rescale = rescale
exports.show = show
exports.setDebug = setDebug
