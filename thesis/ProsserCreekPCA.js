/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var geometry = /* color: #d63000 */ee.Geometry.LineString(
        [[-120.1783275604248, 39.391764658086885],
         [-120.13730049133301, 39.36798055369459]]),
    prior = ee.Image("users/gena/water-occurrence-ProsserCreek"),
    geometry_scalebar = /* color: #d63000 */ee.Geometry.LineString(
        [[-120.1768251933077, 39.369108566501076],
         [-120.16828561308097, 39.36907539416088]]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
var cutoff = { min: 0.05, max: 0.99 };

Map.addLayer(ee.Image(1), {palette:['ffffff']}, 'background (white)')

prior = prior.unmask().unitScale(cutoff.min, cutoff.max)

var proj = ee.Projection('EPSG:3857', [15, 0, 0, 0, -15, 0])

var Palettes = {
    water: ['f7fbff', 'deebf7', 'c6dbef', '9ecae1', '6baed6', '4292c6', '2171b5', '08519c', '08306b']
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

var debug = false

/***
 * Compute a threshold using Otsu method (bimodal)
 */
function computeThresholdUsingOtsu(image, scale, bounds, th, g, skipShort, weightGradient, minValue, usePrior) {
    // clip image edges
    var mask = image.mask().gt(0).focal_min(ee.Number(scale).multiply(3), 'circle', 'meters');

    // detect sharp changes
    var edge = ee.Algorithms.CannyEdgeDetector(image, th, g);
    edge = edge.multiply(mask);
    
    if(usePrior) {
      edge = edge.multiply(prior).updateMask(prior)
    }

    // take the largest changes, estimate gradient around edge and use that as a weight
    if (weightGradient) {
        var gradient = image.gradient().abs();
        var edgeGradient = gradient.select(0).max(gradient.select(1)).mask(edge.gt(th)).reproject(image.projection().scale(2, 2));

        // take the upper percentiles only
        var mode = ee.Number(ee.Dictionary(edgeGradient.reduceRegion(ee.Reducer.mode(), bounds, scale)).values().get(0));
        // var σ = ee.Number(ee.Dictionary(edgeGradient.reduceRegion(ee.Reducer.stdDev(), bounds, scale)).values().get(0));
        var _buckets = 50;
        
        var significantEdgesMask = ee.Algorithms.If(
            ee.Algorithms.IsEqual(mode, null), 
            edge.mask(), 
            edgeGradient.gt(mode)
        );

        edge = ee.Image(ee.Algorithms.If(
            ee.Algorithms.IsEqual(mode, null), 
            edge,
            edge.updateMask(significantEdgesMask))
        );

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


function getEdge(mask) {
    var canny = ee.Algorithms.CannyEdgeDetector(mask, 0.99, 0);
    return canny.mask(canny).focal_max(1);
}

/***
 * Generates image collection gallery.
 */
/*
var gallery = function(images, region, rows, columns) {
  // var proj = ee.Image(images.first()).select(0).projection()

  var scale = proj.nominalScale()
  
  var e = ee.ErrorMargin(1)

  var bounds = region.transform(proj, e).bounds(e, proj)
  
  var count = ee.Number(columns * rows)
  
  // number of images is less than grid cells
  count = count.min(images.limit(count).size())
  
  images = images.limit(count)

  var indices = ee.List.sequence(0, count.subtract(1))
  
  var offsetsX = indices.map(function(i) { return ee.Number(i).mod(columns) })
  var offsetsY = indices.map(function(i) { return ee.Number(i).divide(columns).floor() })

  var offsets = offsetsX.zip(offsetsY)

  var ids = ee.List(images.aggregate_array('system:index'))
  var offsetByImage = ee.Dictionary.fromLists(ids, offsets)
  
  var coords = ee.List(bounds.coordinates().get(0))

  var w = ee.Number(ee.List(coords.get(1)).get(0)).subtract(ee.List(coords.get(0)).get(0)).floor()
  var h = ee.Number(ee.List(coords.get(2)).get(1)).subtract(ee.List(coords.get(0)).get(1)).floor()
  
  var boundsImage = ee.Image().toInt().paint(bounds, 1).reproject(proj)
  
  // new region
  var ll = ee.List(coords.get(0))
  var ur = [ee.Number(ll.get(0)).add(w.multiply(columns)), ee.Number(ll.get(1)).add(h.multiply(rows))]
  
  var regionNew = ee.Geometry.Rectangle([ll, ur], proj, false)
  
  var mosaic = images
    .map(function(i) {
      var offset = ee.List(offsetByImage.get(i.get('system:index')))
      var xoff = w.multiply(offset.get(0)).multiply(scale)
      var yoff = h.multiply(offset.get(1)).multiply(scale)
  
      i = i.updateMask(boundsImage)
      
      return i.translate(xoff, yoff, 'meters', proj)
  }).mosaic()
  
  return {image: mosaic, region: regionNew};
}
*/

  /***
   * Generates image collection gallery.
   */
  var gallery = function(images, region, rows, columns) {
    // var proj = ee.Image(images.first()).select(0).projection()
    var proj = ee.Projection('EPSG:3857', [15, 0, 0, 0, -15, 0])
    var scale = proj.nominalScale()
    
    var e = ee.ErrorMargin(0.1)
  
    var bounds = region.transform(proj, e).bounds(e, proj)
    
    var count = ee.Number(columns * rows)
    
    // number of images is less than grid cells
    count = count.min(images.limit(count).size())
    
    images = images.limit(count)
  
    var indices = ee.List.sequence(0, count.subtract(1))
    
    var offsetsX = indices.map(function(i) { return ee.Number(i).mod(columns) })
    var offsetsY = indices.map(function(i) { return ee.Number(i).divide(columns).floor() })
    
    var offsets = offsetsX.zip(offsetsY)
  
    var ids = ee.List(images.aggregate_array('system:index'))
    var offsetByImage = ee.Dictionary.fromLists(ids, offsets)
    
    var coords = ee.List(bounds.coordinates().get(0))
  
    var w = ee.Number(ee.List(coords.get(1)).get(0)).subtract(ee.List(coords.get(0)).get(0))//.floor()
    var h = ee.Number(ee.List(coords.get(2)).get(1)).subtract(ee.List(coords.get(0)).get(1))//.floor()
  
    // CRASHES
    // var boundsImage = ee.Image().changeProj('EPSG:4326', proj).toInt().paint(bounds)

    var boundsImage = ee.Image().toInt().paint(bounds, 1).reproject(proj)

    // new region
    var ll = ee.List(coords.get(0))
    var ur = [ee.Number(ll.get(0)).add(w.multiply(columns)), ee.Number(ll.get(1)).add(h.multiply(rows))]
    
    var regionNew = ee.Geometry.Rectangle([ll, ur], proj, false)
    
    var mosaic = images
      .map(function(i) {
        var offset = ee.List(offsetByImage.get(i.get('system:index')))
        var xoff = w.multiply(offset.get(0)).multiply(scale)
        var yoff = h.multiply(offset.get(1)).multiply(scale)
    
        i = i.mask(boundsImage.multiply(i.mask()))

        return i.translate(xoff, yoff, 'meters', proj)
    }).mosaic()
    
    return {image: mosaic, region: regionNew};
  }




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
        urOffsetX = this.marginSize.multiply(-1.5)
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
  
        var imageLabel = Text.draw(markerText, ee.Geometry.Point(point), this.scale, {
          fontSize:18, textColor: '000000', outlineColor: 'ffffff', outlineWidth: 2})
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
    this.getMargin('horizontal', translate(ll, 0, this.marginSize), translate(lr, 0, this.marginSize), 15, 5, false), // bottom
    this.getMargin('horizontal', ul, ur, 15, -25, true), // top
    this.getMargin('vertical', translate(ll, this.marginSize, 0), translate(ul, this.marginSize, 0), 55, -5, true), // left
    this.getMargin('vertical', lr, ur, -10, -5, false) // right
  ]).flatten()
  
  return ee.ImageCollection.fromImages(margins).mosaic()
}


/***
 * Draws a scalebar
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
    var imageUnits = Text.draw(units, ee.Geometry.Point(point), scale, {
      fontSize:18, textColor: '000000', outlineColor: 'ffffff', outlineWidth: 2.5, outlineOpacity: 0.6})

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
    var widthTargetUnits = ee.Number(ur.get(0)).subtract(ee.Number(ll.get(0))).divide(10).floor().multiply(10)
    
    for(var i=0; i<steps+1; i++) {
      var markerText = widthTargetUnits.divide(steps * multiplier).multiply(i).format(format)
      
      var point = translate(
        pt0, 
        width.divide(steps).multiply(i).multiply(-1).add(p.multiply(10)), 
        p.multiply(-20)
      )
      
      var imageLabel = Text.draw(markerText, ee.Geometry.Point(point), scale, {
        fontSize:18, textColor: '000000', outlineColor: 'ffffff', outlineWidth: 2.5, outlineOpacity: 0.6})
      
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






/**
 * Compute the Principal Components of a Landsat 8 image.
 */

var region = ee.Geometry(Map.getBounds(true))
region = geometry

function addAny(i) {
  return i.set('any', i.select(0).mask().reduceRegion(ee.Reducer.anyNonZero(), region).values().get(0))
}

// Load a landsat 8 image, select the bands of interest.
var images = ee.ImageCollection('LANDSAT/LC8_L1T_TOA')
  .filterBounds(region.centroid(1))
  .filterDate('2015-05-01', '2017-01-01')
  .select(['B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8', 'B9', 'B10', 'B11'])
  .map(function(i) { return i
      .addBands(i.normalizedDifference(['B5', 'B4']).rename('NDVI'))
      .addBands(i.normalizedDifference(['B3', 'B6']).rename('MNDWI'))
      .addBands(i.normalizedDifference(['B3', 'B5']).rename('NDWI'))
  })
  .map(addAny)
  .filter(ee.Filter.eq('any', 1))
  
var rows = 5
var columns = 6
var g = gallery(images, region, rows, columns)

region = g.region  

var image = g.image


// var image = ee.Image(images.toList(1, 3).get(0))

/*
image = image
  .addBands(image.normalizedDifference(['B3', 'B5']).rename('NDWI'))
  .addBands(image.normalizedDifference(['B3', 'B6']).rename('MNDWI'))
  .addBands(image.normalizedDifference(['B4', 'B5']).rename('NDVI'))
*/  

var palette = ['000000', 'ff0000', 'ffff00', 'ffffff']
  
Map.addLayer(image, {bands: ['B4', 'B3', 'B2'], min: 0.07, max: 0.5, gamma: 1.3}, 'Original Image');
Map.addLayer(image, {bands: ['B6', 'B5', 'B3'], min: 0.05, max: 0.4}, 'Original Image (swir1/nir/green)');

var ndwi = image.select('NDWI')
var minMax = ee.List(ndwi.reduceRegion(ee.Reducer.percentile([1, 99]), region, 30).values())
ndwi = ndwi.unitScale(minMax.get(0), minMax.get(1))
Map.addLayer(ndwi, {min: 0, max: 1, palette: palette}, 'Original Image (NDWI)');

var mndwi = image.select('MNDWI')
var minMax = ee.List(mndwi.reduceRegion(ee.Reducer.percentile([1, 99]), region, 30).values())
mndwi = mndwi.unitScale(minMax.get(0), minMax.get(1))
Map.addLayer(mndwi, {min: 0, max: 1, palette: palette}, 'Original Image (MNDWI)', false);

// water
var waterMask = image.select('NDWI').gt(0)
Map.addLayer(waterMask.mask(waterMask), {palette:['0000aa']}, 'water, NDWI=0 (mask)', 0.5)

var waterEdge = getEdge(image.select('NDWI').gt(0))
Map.addLayer(waterEdge.mask(waterEdge), {palette: ['ffffff']}, 'water, NDWI=0');

var waterEdge = getEdge(image.select('MNDWI').gt(0))
Map.addLayer(waterEdge.mask(waterEdge), {palette: ['ffffff']}, 'water, MNDWI=0');

var analysisScale = 30

// water Otsu, NDWI
var cannyTh = 0.3
var cannySigma = 0.3
var skipShort = false
var weightGradient = false

var waterEdges = images.map(function(i) {
  var waterScore = i.select('NDWI')
  
  var o = computeThresholdUsingOtsu(waterScore, analysisScale, geometry.bounds(), cannyTh, cannySigma, skipShort, weightGradient, -0.15);
  var th = o.threshold
  var edge = o.edge

  var waterMask = waterScore.gte(th)
  var waterEdge = getEdge(waterMask)
  
  //return waterEdge.mask(waterEdge).visualize({palette:['ffffff'], forceRgbOutput: true})
  
  return ee.ImageCollection.fromImages([
    //edge.mask(edge).visualize({palette:['ff0000'], forceRgbOutput: true}),
    //waterScore,
    waterMask.mask(waterMask).visualize({palette:['0000aa'], opacity: 0.1, forceRgbOutput: true}),
    waterEdge.mask(waterEdge).visualize({palette:['ffffff'], forceRgbOutput: true})
  ]).mosaic()
})

var g = gallery(waterEdges, geometry.bounds(), rows, columns)
Map.addLayer(g.image, {}, 'water, NDWI, Otsu')

// water Otsu, NDWI (+prior)
var waterEdges = images.map(function(i) {
  var waterScore = i.select('NDWI')
  
  var o = computeThresholdUsingOtsu(waterScore, analysisScale, geometry.bounds(), cannyTh, cannySigma, skipShort, weightGradient, -0.15, true);
  var th = o.threshold
  var edge = o.edge

  var waterMask = waterScore.gte(th)
  
  waterMask = waterMask.multiply(prior).gt(0)

  var waterEdge = getEdge(waterMask)

/*
  // estimate fill area (compute posterior)
  var expectedValue = prior.mask(edge.multiply(prior)).reduceRegion(ee.Reducer.intervalMean(15, 25), geometry.bounds(), 30).values().get(0)
  var posterior = ee.Image(ee.Algorithms.If(ee.Algorithms.IsEqual(expectedValue, null), 
    waterMask,
    prior.mask(prior.gt(ee.Image.constant(expectedValue)))
  ))

  waterMask = posterior
  var waterEdge = getEdge(waterMask)
*/  

  waterEdge = waterEdge.focal_max(15, 'circle', 'meters')
  
  //return waterEdge.mask(waterEdge).visualize({palette:['ffffff'], forceRgbOutput: true})
  
  return ee.ImageCollection.fromImages([
    //edge.mask(edge).visualize({palette:['ff0000'], forceRgbOutput: true}),
    waterMask.mask(waterMask).visualize({palette:['0000aa'], opacity: 0.1, forceRgbOutput: true}),
    waterEdge.mask(waterEdge).visualize({palette:['ffffff'], forceRgbOutput: true})
  ]).mosaic()
})

var g = gallery(waterEdges, geometry.bounds(), rows, columns)
Map.addLayer(g.image, {}, 'water, NDWI, Otsu, prior')

// water Otsu, MNDWI
var waterEdges = images.map(function(i) {
  var waterScore = i.select('MNDWI')
  
  var o = computeThresholdUsingOtsu(waterScore, analysisScale, geometry.bounds(), cannyTh, cannySigma, skipShort, weightGradient, -0.15);
  var th = o.threshold
  var edge = o.edge

  var waterMask = waterScore.gte(th)
  var waterEdge = getEdge(waterMask)
  
  //return waterEdge.mask(waterEdge).visualize({palette:['ffffff'], forceRgbOutput: true})
  
  return ee.ImageCollection.fromImages([
    edge.mask(edge).visualize({palette:['ff0000'], forceRgbOutput: true}),
    waterEdge.mask(waterEdge).visualize({palette:['ffffff'], forceRgbOutput: true})
  ]).mosaic()
})

var g = gallery(waterEdges, geometry.bounds(), rows, columns)
Map.addLayer(g.image, {}, 'water, MNDWI, Otsu')


// water Otsu, MNDWI, prior
var waterEdges = images.map(function(i) {
  var waterScore = i.select('MNDWI')
  
  var o = computeThresholdUsingOtsu(waterScore, analysisScale, geometry.bounds(), cannyTh, cannySigma, skipShort, weightGradient, -0.15, true);
  var th = o.threshold
  var edge = o.edge

  var waterMask = waterScore.gte(th)
  var waterEdge = getEdge(waterMask)
  
  //return waterEdge.mask(waterEdge).visualize({palette:['ffffff'], forceRgbOutput: true})
  
  return ee.ImageCollection.fromImages([
    edge.mask(edge).visualize({palette:['ff0000'], forceRgbOutput: true}),
    waterEdge.mask(waterEdge).visualize({palette:['ffffff'], forceRgbOutput: true})
  ]).mosaic()
})

var g = gallery(waterEdges, geometry.bounds(), rows, columns)
Map.addLayer(g.image, {}, 'water, MNDWI, Otsu, prior')

var scale = 15

// Get some information about the input to be used later.
var bandNames = image.bandNames();

// Mean center the data to enable a faster covariance reducer
// and an SD stretch of the principal components.
var meanDict = image.reduceRegion({
    reducer: ee.Reducer.mean(),
    geometry: region,
    scale: scale,
    maxPixels: 1e9,
    //crs: region.projection()
});


var means = ee.Image.constant(meanDict.values(bandNames));
var centered = image.subtract(means);

// This helper function returns a list of new band names.
var getNewBandNames = function(prefix) {
  var seq = ee.List.sequence(1, bandNames.length());
  return seq.map(function(b) {
    return ee.String(prefix).cat(ee.Number(b).int());
  });
};

// This function accepts mean centered imagery, a scale and
// a region in which to perform the analysis.  It returns the
// Principal Components (PC) in the region as a new image.
var getPrincipalComponents = function(centered, scale, region) {
  // Collapse the bands of the image into a 1D array per pixel.
  var arrays = centered.toArray();

  // Compute the covariance of the bands within the region.
  var covar = arrays.reduceRegion({
    reducer: ee.Reducer.centeredCovariance(),
    geometry: region,
    scale: scale,
    maxPixels: 1e9
  });
  
  print(covar)

  // Get the 'array' covariance result and cast to an array.
  // This represents the band-to-band covariance within the region.
  var covarArray = ee.Array(covar.get('array'));
  
  // Perform an eigen analysis and slice apart the values and vectors.
  var eigens = covarArray.eigen();

  // This is a P-length vector of Eigenvalues.
  var eigenValues = eigens.slice(1, 0, 1);
  // This is a PxP matrix with eigenvectors in rows.
  var eigenVectors = eigens.slice(1, 1);

  // Convert the array image to 2D arrays for matrix computations.
  var arrayImage = arrays.toArray(1);

  // Left multiply the image array by the matrix of eigenvectors.
  var principalComponents = ee.Image(eigenVectors).matrixMultiply(arrayImage);

  // Turn the square roots of the Eigenvalues into a P-band image.
  var sdImage = ee.Image(eigenValues.sqrt())
    .arrayProject([0]).arrayFlatten([getNewBandNames('sd')]);

  // Turn the PCs into a P-band image, normalized by SD.
  return principalComponents
    // Throw out an an unneeded dimension, [[]] -> [].
    .arrayProject([0])
    // Make the one band array image a multi-band image, [] -> image.
    .arrayFlatten([getNewBandNames('pc')])
    // Normalize the PCs by their SDs.
    .divide(sdImage);
};

/*
// Get the PCs at the specified scale and in the specified region
var pcImage = getPrincipalComponents(centered, scale, region);

// Plot each PC as a new layer
bandNames.length().getInfo(function(length) {
  pcImage.bandNames().getInfo(function(bandNames) {
    for (var i = 0; i < length; i++) {
      var band = bandNames[i];
      var pc = pcImage.select([band])
      var minMax = ee.List(pc.reduceRegion(ee.Reducer.percentile([1, 99]), region, 30).values())
      print(minMax)
      pc = pc.unitScale(minMax.get(0), minMax.get(1))
      Map.addLayer(pc, {min: 0, max: 1, palette: palette}, band, i === 2);
    }
  })
})
*/

// add outline
var boundsOutline = ee.Image().paint(geometry.bounds(), 1, 2).visualize({palette:['ffffff'], forceRgbOutput: true}).reproject(proj)

var outlines = images.map(function(i) {
  return boundsOutline
})

var g = gallery(outlines, geometry.bounds(), rows, columns)
Map.addLayer(g.image, {}, 'outline')

// rescales to given ranges
var rescale = function rescale(img, exp, thresholds) {
    return img.expression(exp, { img: img }).subtract(thresholds[0]).divide(thresholds[1] - thresholds[0]);
};


Map.addLayer(rescale(prior.mask(prior.gt(cutoff.min)), 'img', [cutoff.min, cutoff.max]), { palette: Palettes.water }, 'water occurrence');


var frame = new Frame(geometry.bounds(), {steps:3, size:2, format: '%.2f'}).draw()
Map.addLayer(frame, {}, 'frame')

var scalebar = Scalebar.draw(geometry_scalebar, {steps:1, palette: ['5ab4ac', 'f5f5f5'], format: '%.1f'})
Map.addLayer(scalebar, {}, 'scale')
