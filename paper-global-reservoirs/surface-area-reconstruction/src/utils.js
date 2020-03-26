/***
 * Returns distinct values
 * @param values
 * @returns {Array}
 */
function distinct(values) {
    let unique = [];

    values.map(function (o) {
        if (unique.indexOf(o) === -1) {
            unique.push(o)
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
    }
}

let Palettes = {
    water: ['f7fbff', 'deebf7', 'c6dbef', '9ecae1', '6baed6', '4292c6', '2171b5', '08519c', '08306b']
};

function getEdge(mask) {
    let canny = ee.Algorithms.CannyEdgeDetector(mask, 0.99, 0);
    return canny.mask(canny)
}

// rescales to given ranges
let rescale = function(img, exp, thresholds) {
    return img.expression(exp, {img: img}).subtract(thresholds[0]).divide(thresholds[1] - thresholds[0]);
};


// used as aside function for debugging
let show = function(image, name, vis) {
    if(debug) {
        Map.addLayer(image, vis || {}, '  ' + name, false)
    }

    return image
};

// Return the DN that maximizes interclass variance in B5 (in the region).
let otsu = function(histogram) {
    histogram = ee.Dictionary(histogram);

    let counts = ee.Array(histogram.get('histogram'));
    let means = ee.Array(histogram.get('bucketMeans'));
    let size = means.length().get([0]);
    let total = counts.reduce(ee.Reducer.sum(), [0]).get([0]);
    let sum = means.multiply(counts).reduce(ee.Reducer.sum(), [0]).get([0]);
    let mean = sum.divide(total);

    let indices = ee.List.sequence(1, size);

    // Compute between sum of squares, where each mean partitions the data.
    let bss = indices.map(function(i) {
        let aCounts = counts.slice(0, 0, i);
        let aCount = aCounts.reduce(ee.Reducer.sum(), [0]).get([0]);
        let aMeans = means.slice(0, 0, i);
        let aMean = aMeans.multiply(aCounts)
            .reduce(ee.Reducer.sum(), [0]).get([0])
            .divide(aCount);
        let bCount = total.subtract(aCount);
        let bMean = sum.subtract(aCount.multiply(aMean)).divide(bCount);
        return aCount.multiply(aMean.subtract(mean).pow(2)).add(
            bCount.multiply(bMean.subtract(mean).pow(2)));
    });

    // Return the mean value corresponding to the maximum BSS.
    return means.sort(bss).get([-1]);
};

/***
 * Anisotrophic diffusion (Perona-Malik filter). * Solves diffusion equation numerically using convolution:
 * I(n+1, i, j) = I(n, i, j) + lambda * (cN * dN(I) + cS * dS(I) + cE * dE(I), cW * dW(I))
 */
let removeSpeckleNoisePeronaMalik = function(I, iter, K, opt_method) {
    let method = opt_method || 1;

    let dxW = ee.Kernel.fixed(3, 3,
        [[ 0,  0,  0],
            [ 1, -1,  0],
            [ 0,  0,  0]]);

    let dxE = ee.Kernel.fixed(3, 3,
        [[ 0,  0,  0],
            [ 0, -1,  1],
            [ 0,  0,  0]]);

    let dyN = ee.Kernel.fixed(3, 3,
        [[ 0,  1,  0],
            [ 0, -1,  0],
            [ 0,  0,  0]]);

    let dyS = ee.Kernel.fixed(3, 3,
        [[ 0,  0,  0],
            [ 0, -1,  0],
            [ 0,  1,  0]]);

    let lambda = 0.2;

    let k1 = ee.Image(-1.0/K);
    let k2 = ee.Image(K).multiply(ee.Image(K));

    for(let i = 0; i < iter; i++) {
        let dI_W = I.convolve(dxW);
        let dI_E = I.convolve(dxE);
        let dI_N = I.convolve(dyN);
        let dI_S = I.convolve(dyS);

        let cW;
        let cE;
        let cN;
        let cS;
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
    let π = Math.PI;
    θ  = ee.Number(0.5).multiply(π).subtract(ee.Number(θ).multiply(π).divide(180.0));
    φ = ee.Number(φ).multiply(π).divide(180.0).add(ee.Number(0.5).multiply(π));

    // compute shadow offset (vector length)
    let offset = θ.tan().multiply(cloudHeight);

    // compute x, y components of the vector
    let proj = cloudMask.projection();
    let nominalScale = proj.nominalScale();
    let x = φ.cos().multiply(offset).divide(nominalScale).round();
    let y = φ.sin().multiply(offset).divide(nominalScale).round();

    return cloudMask
        .changeProj(proj, proj.translate(x, y))
        .set('height', cloudHeight);
}

function castShadows(az, zen, cloud) {
    return cloudHeights.map(function (cloudHeight) {
        return findCloudShadow(cloud, cloudHeight, az, zen)
    });
}

function projectClouds(az, zen, cloudScore, cloudThreshold) {
    let cloudMask = cloudScore.lt(cloudThreshold).not();

    let cloudMaskBuffer = cloudMask
        .focal_min(50, 'circle', 'meters')
        .focal_max(250, 'circle', 'meters')
        .reproject(cloudScore.projection());

    cloudMaskBuffer = cloudMaskBuffer.mask(cloudMaskBuffer);

    let shadows = ee.ImageCollection(castShadows(az, zen, cloudMaskBuffer)).max();

    shadows = shadows.updateMask(cloudMask.not());  // remove clouds

    if(debug) {
        Map.addLayer(shadows,
            {min:0, max:0.4, opacity: 0.7, palette:['092d25','03797b', '59f3f5', 'acf9fa']},
            'shadows2.max - cloud > 0.1', false)
    }

    return shadows
}

//Set up possible cloud heights in meters
let cloudHeights = ee.List.sequence(100, 2000, 200);

/***
 * Filters feature collection to filterCollection
 */
function filterToIntersection(featureCollection, filterCollection) {
    return featureCollection.map(function(f) {
        return f.set('intersects', f.intersects(filterCollection.geometry(ee.ErrorMargin(errorMargin)), ee.ErrorMargin(errorMargin)))
    })
        .filter(ee.Filter.eq('intersects', true))
}

/***
 * Filters feature collection to filterCollection using maximum intersection fraction
 */
function filterToMaximumAreaFraction(featureCollection, filterCollection) {
    let features = featureCollection.map(function(f) {
        let intersection = f.intersection(filterCollection.geometry(ee.ErrorMargin(errorMargin)), ee.ErrorMargin(errorMargin));
        return f.set('area_fraction', intersection.area(ee.ErrorMargin(errorMargin)).divide(f.area(ee.ErrorMargin(errorMargin))))
    });

    return features.filter(ee.Filter.gt('area_fraction', 0.4))
}

/***
 * Function for finding dark outliers in time series, masks pixels that are dark, and dark outliers.
 *
 */
function simpleTDOM2(c, zShadowThresh, irSumThresh, dilatePixels){
    let shadowSumBands = ['nir','swir1'];

    //Get some pixel-wise stats for the time series
    let irStdDev = c.select(shadowSumBands).reduce(ee.Reducer.stdDev());
    let irMean = c.select(shadowSumBands).mean();

    //Mask out dark dark outliers
    c = c.map(function(img){
        let z = img.select(shadowSumBands).subtract(irMean).divide(irStdDev);
        let irSum = img.select(shadowSumBands).reduce(ee.Reducer.sum());
        let m = z.lt(zShadowThresh).reduce(ee.Reducer.sum()).eq(2).and(irSum.lt(irSumThresh)).not();
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
    let darkPixels = image.select(['nir','swir1','swir2']).reduce(ee.Reducer.sum()).lt(irSumThresh);//.gte(1);

    //Get scale of image
    let nominalScale = cloudMask.projection().nominalScale();

    // Find where cloud shadows should be based on solar geometry

    //Convert to radians
    let azR =ee.Number(meanAzimuth).multiply(Math.PI).divide(180.0).add(ee.Number(0.5).multiply(Math.PI ));
    let zenR  =ee.Number(0.5).multiply(Math.PI ).subtract(ee.Number(meanZenith).multiply(Math.PI).divide(180.0));

    // Find the shadows
    let shadows = cloudHeights.map(function(cloudHeight){
        cloudHeight = ee.Number(cloudHeight);

        let shadowCastedDistance = zenR.tan().multiply(cloudHeight);//Distance shadow is cast
        let x = azR.cos().multiply(shadowCastedDistance).divide(nominalScale).round();//X distance of shadow
        let y = azR.sin().multiply(shadowCastedDistance).divide(nominalScale).round();//Y distance of shadow
        return cloudMask.changeProj(cloudMask.projection(), cloudMask.projection().translate(x, y));
    });

    let shadow = ee.ImageCollection.fromImages(shadows).max();

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
function cloudProject(img,dilatePixels,cloudHeights,azimuthField,zenithField){

    //Get the cloud mask
    let cloud = img.select('cloudMask').not();
    cloud = cloud.focal_max(dilatePixels);
    cloud = cloud.updateMask(cloud);

    //Get TDOM mask
    let TDOMMask = img.select(['TDOMMask']).not();

    //Project the shadow finding pixels inside the TDOM mask that are dark and inside the expected area given the solar geometry
    let shadow = projectShadows(cloud,TDOMMask,img, img.get(azimuthField),img.get(zenithField),cloudHeights,dilatePixels);

    //Combine the cloud and shadow masks
    let combinedMask = cloud.mask().or(shadow.mask()).eq(0);

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
    let mask = image.mask().gt(0).focal_min(ee.Number(scale).multiply(3), 'circle', 'meters');

    // detect sharp changes
    var edge = ee.Algorithms.CannyEdgeDetector(image, th, g);
    edge = edge.multiply(mask);

    // take the largest changes, estimate gradient around edge and use that as a weight
    if(weightGradient) {
        let gradient = image.gradient().abs();
        let edgeGradient = gradient.select(0).max(gradient.select(1)).mask(edge.gt(th))
            .reproject(image.projection().scale(2, 2));

        // take the upper percentiles only
        let mode = ee.Number(ee.Dictionary(edgeGradient.reduceRegion(ee.Reducer.mode(), bounds, scale)).values().get(0));
        let σ = ee.Number(ee.Dictionary(edgeGradient.reduceRegion(ee.Reducer.stdDev(), bounds, scale)).values().get(0));
        let buckets = 50;
        let significantEdgesMask = edgeGradient.gt(mode);

        edge = edge.updateMask(significantEdgesMask);

        if(debug) {
            // gradient around edges
            if(edgeGradient) {
                print(ui.Chart.image.histogram(edgeGradient, bounds, scale, buckets));
                Map.addLayer(edgeGradient, {}, 'edge gradient', false);
                Map.addLayer(significantEdgesMask.mask(significantEdgesMask), {}, 'significant edges', false);

                print('Mode: ', mode);
                print('Sigma: ', σ);
                //Map.addLayer(edgeGradient.updateMask(significantEdgesMask), {min:0, max:mode.add(σ.multiply(2)), palette:['ffffff', 'ff0000']}, 'edge gradient, upper percentiles', false)
            }
        }
    }

    // advanced, detect edge lengths
    let coonnectedVis;
    if(skipShort) {
        let connected = edge.mask(edge).lt(0.8).connectedPixelCount(50, true);

        let edgeLong = connected.gte(50);

        edge = edgeLong;

        coonnectedVis = connected.updateMask(edgeLong).visualize({palette: ['ffffff', 'ff0000'], min: 0, max: 50});
    }

    // buffer around NDWI edges
    let edgeBuffer = edge.focal_max(ee.Number(scale).multiply(1), 'square', 'meters');
    let imageEdge = image.mask(edgeBuffer);

    // compute threshold using Otsu thresholding
    let buckets = 100;
    let hist = ee.Dictionary(ee.Dictionary(imageEdge.reduceRegion(ee.Reducer.histogram(buckets), bounds, scale)).values().get(0));

    let threshold = ee.Algorithms.If(hist.contains('bucketMeans'), otsu(hist), 0.3);
    threshold = ee.Number(threshold)//.add(0.05)

    if(debug) {
        Map.addLayer(edge.mask(edge), {palette:['ff0000']}, 'edges', false);

        if(skipShort) {
            Map.addLayer(coonnectedVis, {}, 'edges (connected)', false)
        }

        print('Threshold: ', threshold);

        print(ui.Chart.image.histogram(image, bounds, scale, buckets));
        print(ui.Chart.image.histogram(imageEdge, bounds, scale, buckets));
        Map.addLayer(mask.mask(mask), {palette:['000000']}, 'image mask', false);
    }

    return minValue ? threshold.max(minValue) : threshold;
}

/***
 * Makes offset from the left bounds Geometry margin and splits into count pieces, returns locations.
 */
function getLeftMarginLocations(bounds, marginSize, count, scale) {
    let leftMarginSize = ee.Number(marginSize).multiply(scale);
    let boundsSmall = bounds.buffer(leftMarginSize.multiply(-1)).bounds();
    let coords = ee.List(boundsSmall.coordinates().get(0));
    let pt0 = ee.List(coords.get(0));
    let pt3 = ee.List(coords.get(3));
    let leftMarginLine = ee.Geometry.LineString([pt0, pt3]);

    let distances = ee.List.sequence(0, leftMarginLine.length(), leftMarginLine.length().divide(count));

    let lineToFirstPoint = function (g) {
        let coords = ee.Geometry(g).coordinates().get(0);
        return ee.Feature(ee.Algorithms.GeometryConstructors.Point(coords))
    };

    let points = ee.FeatureCollection(leftMarginLine.cutLines(distances).geometries().map(lineToFirstPoint));

    // Map.addLayer(points, {color: 'green'}, 'text locations')

    return points.toList(10).map(function (o) {
        return ee.Feature(o).geometry()
    })
}
