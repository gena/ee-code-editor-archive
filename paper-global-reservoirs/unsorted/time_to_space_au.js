/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var dem = ee.Image("USGS/NED"),
    geometry = /* color: #98ff00 */ee.Geometry.LineString(
        [[141.84173583984375, -36.132883744079486],
         [141.91337168748805, -36.06089743916559],
         [141.97872161865234, -35.981062266929165]]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
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


function getEdge(mask) {
    var canny = ee.Algorithms.CannyEdgeDetector(mask, 0.99, 0);
    return canny.mask(canny);
}

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

var debug = false

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

    return {
      threshold: minValue ? threshold.max(minValue) : threshold,
      edge: edge
    }
}

//Map.addLayer(dem)
         
var bounds = geometry.bounds()

// var columns = 60
// var rows = 6

var columns = 18
var rows = 10

//var w = 2100
var w = 15000
var h = 15000


function addCloudScore(i) {
  return ee.Algorithms.Landsat.simpleCloudScore(i)
}

var bands = ['swir1', 'nir', 'green', 'red', 'cloud']

var l8 = new ee.ImageCollection('LANDSAT/LC8_L1T_TOA').map(addCloudScore).select(['B6', 'B5', 'B3', 'B4', 'cloud'], bands);
var l7 = new ee.ImageCollection('LANDSAT/LE7_L1T_TOA').map(addCloudScore).select(['B5', 'B4', 'B2', 'B3', 'cloud'], bands);
var l5 = new ee.ImageCollection('LANDSAT/LT5_L1T_TOA').map(addCloudScore).select(['B5', 'B4', 'B2', 'B3', 'cloud'], bands);
var l4 = new ee.ImageCollection('LANDSAT/LT4_L1T_TOA').map(addCloudScore).select(['B5', 'B4', 'B2', 'B3', 'cloud'], bands);

 var images = ee.ImageCollection(l4.merge(l5).merge(l7).merge(l8))
//var images = ee.ImageCollection(l4.merge(l5).merge(l8))
  .filterBounds(bounds.centroid(1))
  .filterDate('2015-01-01', '2017-01-01')
  
var count = ee.Number(columns * rows).min(images.size())

// define offset list
var pos = ee.List.sequence(0, count.subtract(1))
var offsetsX = pos.map(function(i) { return ee.Number(i).mod(columns) })
var offsetsY = pos.map(function(i) { return ee.Number(i).divide(columns).floor() })
var offsets = offsetsX.zip(offsetsY)

// generate image collection gallery
var gallery = function(images, sortProperty, waterOtsu) {
  var imagesSorted = images
  
  // add cloud over area
  images = images.map(function(i) {
    var cloudScore = ee.Dictionary(i.select('cloud').reduceRegion(ee.Reducer.median(), bounds, 300)).values().get(0)
    return i.set('CLOUD_COVER_AOI', cloudScore)
  })

  if(sortProperty) {
    imagesSorted = images
      .sort(sortProperty)
      .limit(count) 
      .sort(sortProperty) // avoid GEE bug, call limit/sort twice
      .limit(count)
  } else {
    imagesSorted = images
      .limit(count)
  }

  var propId = 'system:id'
  
  var ids = ee.List(imagesSorted.aggregate_array(propId))
  var offsetByImage = ee.Dictionary.fromLists(ids, offsets)
  
  var wgs84 = ee.Projection('EPSG:4326')
  
  var boundsImage = ee.Image().toInt().paint(bounds, 1)
    .reproject(ee.Image(imagesSorted.first()).projection())

  var textScale = Map.getScale();
  var textBounds = bounds;
  var textMarginSize = 20; // scale units
  var textLocationCount = 20;
  var textLocations = getLeftMarginLocations(textBounds, textMarginSize, textLocationCount, textScale);
  
  var mosaic = imagesSorted
    .map(function(i) {
    var offset = ee.List(offsetByImage.get(i.get(propId)))
    var xoff = ee.Number(w).multiply(offset.get(0))
    var yoff = ee.Number(h).multiply(offset.get(1))
  
    i = i
      .mask(boundsImage)
      
    var waterScore = i.normalizedDifference(['green', 'nir'])
    //var waterScore = i.normalizedDifference(['green', 'swir1'])
    
    var th = 0
    var edge = ee.Image();
    
    if(waterOtsu) {
      var o = computeThresholdUsingOtsu(waterScore, 30, bounds, 0.8, 2, false, false, -0.1);
      th = o.threshold
    }
    
    var waterMask = waterScore.gt(th)
    var waterEdge = getEdge(waterMask)
    
    // threshold value text
    var str = ee.String('t > ').cat(ee.Number(th).format('%.2f'));
    var pt1 = textLocations.get(1);
    var textThreshold = Text.draw(str, pt1, textScale, {
        outlineColor: '000000',
        outlineWidth: 3,
        outlineOpacity: 0.6,
        fontSize: 16,
        textColor: 'white'
    });
    
    return ee.ImageCollection.fromImages([
        i.visualize({min:0.04, max:0.4}),
        i.select('cloud').mask(i.select('cloud').divide(50)).visualize({palette:['ffff00']}),
        edge.visualize({palette:['ff0000'], forceRgbOutput: true}),
        waterEdge.mask(waterEdge).visualize({palette:['ffffff'], forceRgbOutput: true}),
        textThreshold
      ]).mosaic().translate(xoff, yoff, 'meters', wgs84)
  }).mosaic()
  
  return mosaic;
}

Map.addLayer(gallery(images, 'system:start_time'), {}, 'sorted by time cover', true)
Map.addLayer(gallery(images, 'system:start_time', true), {}, 'sorted by time cover (Otsu)', true)

//Map.addLayer(gallery(images, 'CLOUD_COVER_AOI'), {}, 'sorted by cloud cover', true)
//Map.addLayer(gallery(images, 'CLOUD_COVER_AOI', true), {}, 'sorted by cloud cover (Otsu)', true)

Map.addLayer(bounds, {}, 'reservoir bounds', false)

