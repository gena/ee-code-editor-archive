/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var dem = ee.Image("USGS/NED"),
    geometry = /* color: #98ff00 */ee.Geometry.LineString(
        [[141.56845092773438, -34.14434518053806],
         [141.59643173217773, -34.12573177107601]]),
    scale = /* color: #ffc82d */ee.Geometry.LineString(
        [[141.58239840936199, -34.14306652751738],
         [141.59214026622067, -34.14313756482404]]),
    demAU = ee.ImageCollection("AU/GA/AUSTRALIA_5M_DEM");
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

function translate(coord, x, y) {
  var x1 = ee.Number(coord.get(0)).subtract(x)
  var y1 = ee.Number(coord.get(1)).subtract(y)
  
  return ee.List([x1, y1])
}

/***
 * Draws frame for publishing purposes
 */

var Frame = function(bounds, props) {
  this.bounds = bounds 
  this.scale = Map.getScale()
  this.steps = 10
  this.palette = ['000000', 'ffffff']
  this.format = '%.1f'
  this.round = true
  this.size = 5

  this.parseProperties(props)
  
  // degree to meter multiplier
  this.scaleFactor = ee.Number(this.scale).divide(ee.Image().projection().nominalScale())
  this.marginSize = ee.Number(this.size).multiply(this.scaleFactor)
}

Frame.prototype.parseProperties = function(props) {
    if(props) {
      this.size = props.size || this.size
      this.scale = props.scale || this.scale
      this.steps = props.steps || this.steps
      this.palette = props.palette || this.palette
      this.format = props.format || this.format
      this.round = props.round !== 'undefined' ? props.round : this.round
    }
}

Frame.prototype.getMargin = function(orientation, pt0, pt1, labelMarginX, labelMarginY, showLabels) {
    var urOffsetX = 0
    var urOffsetY = 0
    var stepsX = 1
    var stepsY = 1
    var coord = 0

    switch(orientation) {
      case 'horizontal': 
        stepsX = this.steps
        stepsY = 1
        urOffsetX = 0
        urOffsetY = this.marginSize.multiply(-1)
        coord = 0
        break;
      case 'vertical': 
        stepsX = 1
        stepsY = this.steps
        urOffsetX = this.marginSize.multiply(-1)
        urOffsetY = 0
        coord = 1
        break;
    }
    
    var ll = pt0
    var ur = translate(pt1, urOffsetX, urOffsetY)

    var bounds = ee.Geometry.Rectangle([ll, ur], null, false)
    
    var width = ee.Number(ur.get(0)).subtract(ll.get(0))
    var height = ee.Number(ur.get(1)).subtract(ll.get(1))
    var origin = ee.Image.constant(pt0.get(0)).addBands(ee.Image.constant(pt0.get(1)))

    var margin = ee.Image.pixelLonLat()
      .subtract(origin)
      .divide([width, height]).multiply([stepsX, stepsY])
      .toInt().reduce(ee.Reducer.sum()).bitwiseAnd(1)
      .clip(bounds)

    // define base images
    var images = ee.List([
      margin.visualize({min:0, max:1, forceRgbOutput: true, palette: this.palette}),
      ee.Image().paint(bounds, 1, 1).visualize({palette:['000000']}),
    ])

    // add labels
    if(showLabels) {
      var start = ee.Number(pt0.get(coord))
      
      var offset = [
        width.divide(this.steps).multiply(1 - coord),
        height.divide(this.steps).multiply(coord),
      ]
      
      var stepSize = offset[0].add(offset[1])
  
      for(var i=0; i<this.steps+1; i++) {
        var markerText = start.add(stepSize.multiply(i)).format(this.format)
  
        var point = translate(
          pt0, 
          ee.Number(offset[0]).multiply(i).multiply(-1).add(ee.Number(labelMarginX).multiply(this.scaleFactor)),
          ee.Number(offset[1]).multiply(i).multiply(-1).add(ee.Number(labelMarginY).multiply(this.scaleFactor))
        )
  
        var imageLabel = Text.draw(markerText, ee.Geometry.Point(point), this.scale, {fontSize:14, textColor: '000000'})
        images = images.add(imageLabel)
      }
    }
    
    return images
}

Frame.prototype.draw = function() {
  var coords = ee.List(this.bounds.coordinates().get(0))
  var ll = ee.List(coords.get(0))
  var lr = ee.List(coords.get(1))
  var ur = ee.List(coords.get(2))
  var ul = ee.List(coords.get(3))

    // margin
    var margins = ee.List([
      this.getMargin('horizontal', translate(ll, 0, this.marginSize), translate(lr, 0, this.marginSize), 0, 5, true), // bottom
      this.getMargin('horizontal', ul, ur, 0, -18, false), // top
      this.getMargin('vertical', translate(ll, this.marginSize, 0), translate(ul, this.marginSize, 0), 35, -5, true), // left
      this.getMargin('vertical', lr, ur, -10, -5, false) // right
    ]).flatten()
    
    return ee.ImageCollection.fromImages(margins).mosaic()
  
}


/***
 * Draws scalebar
 */
var Scalebar = {
  draw: function (pos, props) {
    var scale = Map.getScale()
    var units = 'km'
    var steps = 5
    var multiplier = 1000
    var palette = ['000000', 'ffffff']
    var format = '%.0f'
    var round = true

    if(props) {
      scale = props.scale || scale
      units = props.units || units
      steps = props.steps || steps
      multiplier = props.multiplier || multiplier
      palette = props.palette || palette
      format = props.format || format
      round = props.round !== 'undefined' ? props.round : round
    }

    var p = ee.Number(Map.getScale()).divide(ee.Image().projection().nominalScale())
    var pt0 = ee.List(pos.coordinates().get(0))
    var pt1 = ee.List(pos.coordinates().get(1))

    // scalebar
    var bounds = pos.buffer(Map.getScale() * 2).bounds()
    var ll = ee.List(ee.List(bounds.coordinates().get(0)).get(0))
    var ur = ee.List(ee.List(bounds.coordinates().get(0)).get(2))
    var width = ee.Number(ur.get(0)).subtract(ll.get(0))
    var height = ee.Number(ur.get(1)).subtract(ll.get(1))

    var origin = ee.Image.constant(ll.get(0)).addBands(ee.Image.constant(ll.get(1)))

    var scalebar = ee.Image.pixelLonLat()
      .subtract(origin)
      .divide([width, height]).multiply([steps, 1])
      .toInt().reduce(ee.Reducer.sum()).bitwiseAnd(1)
      .clip(bounds)

    // units
    var point = translate(pt1, p.multiply(-8), p.multiply(-7))
    var imageUnits = Text.draw(units, ee.Geometry.Point(point), scale, {fontSize:14, textColor: '000000', outlineColor: 'ffffff', outlineWidth: 2.5, outlineOpacity: 0.6})

    // define base images
    var images = ee.List([
      scalebar.visualize({min:0, max:1, forceRgbOutput: true, palette: palette}),
      ee.Image().paint(bounds, 1, 1).visualize({palette:['000000']}),
      imageUnits,
    ])
    
    // add labels
    var boundsMeters = bounds.transform(ee.Projection('EPSG:3857'), ee.ErrorMargin(1))
    var ll = ee.List(ee.List(boundsMeters.coordinates().get(0)).get(0))
    var ur = ee.List(ee.List(boundsMeters.coordinates().get(0)).get(2))
    var widthTargetUnits = ee.Number(ur.get(0)).floor().subtract(ee.Number(ll.get(0)).ceil())
    
    for(var i=0; i<steps+1; i++) {
      var markerText = widthTargetUnits.divide(steps * multiplier).multiply(i).format(format)
      
      var point = translate(
        pt0, 
        width.divide(steps).multiply(i).multiply(-1).add(p.multiply(5)), 
        p.multiply(-15)
      )
      
      var imageLabel = Text.draw(markerText, ee.Geometry.Point(point), scale, {fontSize:14, textColor: '000000', outlineColor: 'ffffff', outlineWidth: 2.5, outlineOpacity: 0.6})
      
      images = images.add(imageLabel)
    }

    return ee.ImageCollection.fromImages(images).mosaic()
  },
}

/***
 * Makes offset from the left bounds Geometry margin and splits into count pieces, returns locations.
 */
function getMarginLocations(bounds, margin, marginSize, count, scale) {
    var marginSize = ee.Number(marginSize).multiply(scale);
    var boundsSmall = bounds.buffer(marginSize.multiply(-1)).bounds();
    var coords = ee.List(boundsSmall.coordinates().get(0));
    
    if(margin === 'left') {
      var pt0 = ee.List(coords.get(0));
      var pt1 = ee.List(coords.get(3));
    } else if(margin === 'right') {
      var pt0 = ee.List(coords.get(1));
      var pt1 = ee.List(coords.get(2));
    }

    var marginLine = ee.Geometry.LineString([pt0, pt1]);

    var distances = ee.List.sequence(0, marginLine.length(), marginLine.length().divide(count));

    var lineToFirstPoint = function lineToFirstPoint(g) {
        var coords = ee.Geometry(g).coordinates().get(0);
        return ee.Feature(ee.Algorithms.GeometryConstructors.Point(coords));
    };

    var points = ee.FeatureCollection(marginLine.cutLines(distances).geometries().map(lineToFirstPoint));

    //Map.addLayer(points, {color: 'green'}, 'text locations')

    return points.toList(count).map(function (o) {
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

    var threshold = ee.Algorithms.If(hist.contains('bucketMeans'), otsu(hist), 0);
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


function radians(img) { return img.toFloat().multiply(3.1415927).divide(180); }

function hillshade(az, ze, slope, aspect) {
  var azimuth = radians(ee.Image(az));
  var zenith = radians(ee.Image(ze));
  return azimuth.subtract(aspect).cos().multiply(slope.sin()).multiply(zenith.sin())
      .add(zenith.cos().multiply(slope.cos()));
}

function hillshadeit(image, elevation, weight, height_multiplier, azimuth, zenith) {
  var hsv  = image.unitScale(0, 255).rgbtohsv();

  var terrain = ee.Algorithms.Terrain(elevation.multiply(height_multiplier));
  var slope = radians(terrain.select(['slope']));

  var aspect = radians(terrain.select(['aspect'])).resample('bicubic');
  var hs = hillshade(azimuth, zenith, slope, aspect).resample('bicubic');
  
  Map.addLayer(slope, {}, 'slope', false)
  Map.addLayer(aspect, {}, 'apect', false)
  Map.addLayer(hs, {}, 'hs', false)

  var intensity = hs.multiply(weight).multiply(hsv.select('value'));
  var huesat = hsv.select('hue', 'saturation');

  return ee.Image.cat(huesat, intensity).hsvtorgb();
}

var dem = demAU.mosaic().reproject('EPSG:3857')
var palette = ['d8b365', 'f5f5f5', '5ab4ac']
Map.addLayer(dem, {palette: palette, min: 26, max: 35}, 'DEM', false)
Map.addLayer(hillshadeit(dem.visualize({palette: palette, min:26, max:35}), dem, 1, 5, 0, 40), {}, 'DEM (hillshade)')
         
var error = ee.ErrorMargin(Map.getScale())
var bounds = geometry.bounds()

var boundsOutline = ee.Image().paint(bounds, 1, 1).visualize({palette:['000000'], forceRgbOutput: true}).reproject('EPSG:3857', null, Map.getScale())

Map.addLayer(boundsOutline)

// var columns = 60
// var rows = 6

// var columns = 11
// var rows = 15

var rows = 10 
var columns = 5

var boundsMap = geometry.transform(ee.Projection('EPSG:3857'), error).bounds(error, ee.Projection('EPSG:3857'))
var coords = ee.List(boundsMap.coordinates().get(0))

var w = ee.Number(ee.List(coords.get(1)).get(0)).subtract(ee.List(coords.get(0)).get(0))
var h = ee.Number(ee.List(coords.get(2)).get(1)).subtract(ee.List(coords.get(0)).get(1))


var boundsImage = ee.Image().paint(bounds, 1, 2).reproject('EPSG:3857', null, Map.getScale())

//bounds = bounds.buffer(100)

function addCloudScore(i) {
  return ee.Algorithms.Landsat.simpleCloudScore(i)
}

function addAny(i) {
  return i.set('any', i.select(0).mask().reduceRegion(ee.Reducer.anyNonZero(), bounds).values().get(0))
}

var bands = ['swir1', 'nir', 'green', 'red', 'blue', 'swir2']

var l8 = new ee.ImageCollection('LANDSAT/LC8_L1T_TOA').select(['B6', 'B5', 'B3', 'B4', 'B2', 'B7'], bands);
var l7 = new ee.ImageCollection('LANDSAT/LE7_L1T_TOA').select(['B5', 'B4', 'B2', 'B3', 'B1', 'B7'], bands);
var l5 = new ee.ImageCollection('LANDSAT/LT5_L1T_TOA').select(['B5', 'B4', 'B2', 'B3', 'B1', 'B7'], bands);
var l4 = new ee.ImageCollection('LANDSAT/LT4_L1T_TOA').select(['B5', 'B4', 'B2', 'B3', 'B1', 'B7'], bands);

var s2 = new ee.ImageCollection('COPERNICUS/S2').select(['B11', 'B8', 'B3', 'B4', 'B2', 'B12'], bands)
  .map(function(i) { 
      return i
        .reproject(i.select(0).projection())
        .divide(10000).copyProperties(i).copyProperties(i, ['system:time_start', 'system:index'])})

var analysisScale = 10
// var analysisScale = 30

//var images = ee.ImageCollection(l4.merge(l5).merge(l7).merge(l8))
//var images = ee.ImageCollection(l4.merge(l5).merge(l8))
//var images = ee.ImageCollection(l7.merge(l8))
var images = l8
var images = s2
//var images = l5
  .filterBounds(bounds.centroid(100))
  .map(addAny)
  .filter(ee.Filter.eq('any', 1))
  //.filterDate('2016-01-01', '2017-01-01')
  
print(images)  
  
var count = ee.Number(columns * rows).min(images.size())

print(count)

// define offset list
var pos = ee.List.sequence(0, count.subtract(1))
var offsetsX = pos.map(function(i) { return ee.Number(i).mod(columns) })
var offsetsY = pos.map(function(i) { return ee.Number(i).divide(columns).floor() })
var offsets = offsetsX.zip(offsetsY)

// generate image collection gallery
var gallery = function(images, sortProperty, waterOtsu, waterBands) {
  var imagesSorted = images
  
  // add cloud over area
  if(sortProperty === 'CLOUD_COVER_AOI') {
    images = images.map(function(i) {
      var cloudScore = ee.Dictionary(i.select('cloud').reduceRegion(ee.Reducer.median(), bounds, 300)).values().get(0)
      return i.set('CLOUD_COVER_AOI', cloudScore)
    })
  }

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

  var propId = 'system:index'
  
  var ids = ee.List(imagesSorted.aggregate_array(propId))
  var offsetByImage = ee.Dictionary.fromLists(ids, offsets)
  
  var wgs84 = ee.Projection('EPSG:4326')
  var web = ee.Projection('EPSG:3857')
  
  var boundsImage = ee.Image().toInt().paint(bounds, 1)
    .reproject(ee.Image(imagesSorted.first()).select(0).projection())

  var textScale = Map.getScale();
  var textBounds = bounds;

  var textMarginSize = 5; // scale units
  var textLocationCount = 10;
  var textLocationsLeft = getMarginLocations(textBounds, 'left', textMarginSize, textLocationCount, textScale);
  var pt1 = textLocationsLeft.get(1);
  
  var textMarginSize = 5; // scale units
  var textLocationCount = 10;
  var scaleFactor = ee.Number(textScale).divide(ee.Image().projection().nominalScale())
  var textLocationsRight = getMarginLocations(textBounds, 'right', textMarginSize, textLocationCount, textScale);
  var pt2 = ee.Geometry.Point(translate(ee.Geometry(textLocationsRight.get(1)).coordinates(), scaleFactor.multiply(50), 0));
  
  var mosaic = imagesSorted
    .map(function(i) {

    var offset = ee.List(offsetByImage.get(i.get(propId)))
    var xoff = ee.Number(w).multiply(offset.get(0))
    var yoff = ee.Number(h).multiply(offset.get(1))
  
    i = i
      .updateMask(boundsImage)

    if(typeof waterBands === 'undefined') {
      //waterBands = ['green', 'swir1']
      waterBands = ['green', 'nir']
    }
    
    var waterScore = i.normalizedDifference(waterBands)
    
    var th = 0
    var edge = ee.Image();
    
    if(waterOtsu) {
      var o = computeThresholdUsingOtsu(waterScore, analysisScale, bounds, 0.3, 0.5, false, false, -0.1);
      th = o.threshold
      edge = o.edge.reproject(i.projection().scale(0.5, 0.5))
    }
    
    var waterMask = waterScore.gte(th)
    var waterEdge = getEdge(waterMask)
    
    // threshold value text
    var str = ee.String('th=').cat(ee.Number(th).format('%.2f'))
    
    var textThreshold = Text.draw(str, pt1, textScale, {
        outlineColor: '000000',
        outlineWidth: 2,
        outlineOpacity: 0.6,
        fontSize: 14,//16,
        textColor: 'white'
    });

    var str = i.date().format('YYYY-MM-dd')
    
    var textDate = Text.draw(str, pt2, textScale, {
        outlineColor: '000000',
        outlineWidth: 2,
        outlineOpacity: 0.6,
        fontSize: 14,//16,
        textColor: 'white'
    });
    
    return ee.ImageCollection.fromImages([
        i.visualize({min:0.04, max:0.4, bands: ['red', 'green', 'blue']}),
        //i.visualize({min:0.04, max:0.4, bands: ['swir1', 'nir', 'green']}),
        //waterScore.visualize({min:-0.5, max:0.5, forceRgbOutput: true}),
        //i.select('cloud').mask(i.select('cloud').divide(50)).visualize({palette:['ffff00']}),

        edge.mask(edge).visualize({palette:['ff0000'], forceRgbOutput: true}),
        waterEdge.mask(waterEdge).visualize({palette:['ffffff'], forceRgbOutput: true}),
        textThreshold,
        textDate,
        boundsOutline
      ]).mosaic().translate(xoff, yoff, 'meters', web)
  }).mosaic()
  
  return mosaic;
}

var gallery1 = gallery(images, null)
Map.addLayer(gallery1, {}, 'sorted by time', true)

var gallery2 = gallery(images, null, true)
Map.addLayer(gallery2, {}, 'sorted by time (Otsu)', true)

//Map.addLayer(gallery(images, 'CLOUD_COVER_AOI'), {}, 'sorted by cloud cover', true)
//Map.addLayer(gallery(images, 'CLOUD_COVER_AOI', true), {}, 'sorted by cloud cover (Otsu)', true)

Map.addLayer(bounds, {}, 'reservoir bounds', false)


var frame = new Frame(geometry.bounds(), {steps:3, size:2, format: '%.2f'}).draw()
Map.addLayer(frame, {}, 'frame')


var scalebar = Scalebar.draw(scale, {steps:3, palette: ['5ab4ac', 'f5f5f5'], format: '%.1f'})
Map.addLayer(scalebar, {}, 'scale')

return

var gallery3 = gallery(images, 'system:start_time', false, ['green', 'nir'])
var gallery4 = gallery(images, 'system:start_time', true, ['green', 'nir'])

var gallery5 = gallery(images, 'system:start_time', false, ['green', 'swir2'])
var gallery6 = gallery(images, 'system:start_time', true, ['green', 'swir2'])

var white = ee.Image(1).visualize({palette:['ffffff'], forceRgbOutput: true})

var exports = [
  {image: ee.ImageCollection.fromImages([white, gallery1, frame, scalebar]).mosaic(), name: 'AU_sort_by_time_NDWI_swir1'},
  {image: ee.ImageCollection.fromImages([white, gallery2, frame, scalebar]).mosaic(), name: 'AU_sort_by_time_NDWI_swir1_dynamic'},
  {image: ee.ImageCollection.fromImages([white, gallery3, frame, scalebar]).mosaic(), name: 'AU_sort_by_time_NDWI_nir'},
  {image: ee.ImageCollection.fromImages([white, gallery4, frame, scalebar]).mosaic(), name: 'AU_sort_by_time_NDWI_nir_dynamic'},
  //{image: ee.ImageCollection.fromImages([white, gallery5, frame, scalebar]).mosaic(), name: 'AU_sort_by_time_NDWI_swir2'},
  //{image: ee.ImageCollection.fromImages([white, gallery6, frame, scalebar]).mosaic(), name: 'AU_sort_by_time_NDWI_swir2_dynamic'},
]

exports.map(function(e) {
  Map.addLayer(e.image, {}, 'export ' + e.name, false)
  
  Export.image.toDrive({
    image: e.image, 
    description: e.name+'_4k', 
    fileNamePrefix: e.name+'_4k', 
    dimensions: 3840, // 1920, 
    region: Map.getBounds(true),
    crs: 'EPSG:3857'
  })
})
