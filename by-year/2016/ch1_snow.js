/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var locationFrameArea = /* color: #d63000 */ee.Geometry.LineString(
        [[-120.17626477602943, 39.397135184603115],
         [-120.12820707226103, 39.36031976869374]]),
    locationScalebar = /* color: #98ff00 */ee.Geometry.LineString(
        [[-120.17523197751024, 39.35321046554473],
         [-120.15748958574136, 39.35347629397913]]),
    locationAttribution = /* color: #0b4a8b */ee.Geometry.Point([-120.30398368835449, 39.30733924123124]),
    l5_sr = ee.ImageCollection("LANDSAT/LT5_SR"),
    l5 = ee.ImageCollection("LANDSAT/LT5_L1T_TOA"),
    locationGradientBar = /* color: #d63000 */ee.Geometry.LineString(
        [[-120.11918978982129, 39.35321508322609],
         [-120.09035166471114, 39.35440966907849]]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
function app() {
  var poi = ee.Geometry.Polygon([[[-120.15180587768555, 39.37554457862171], [-120.14723539352417, 39.3743669005306],
                              [-120.14463901519775, 39.3809516906138], [-120.14933824539185, 39.381830721387516]]])
               
  //l5_sr = l5_sr.filter(ee.Filter.gt('SUN_ELEVATION', 40))
  //l5 = l5.filter(ee.Filter.gt('SUN_ELEVATION', 40))

  var dx = -5480
  // translate AOI
  locationFrameArea = locationFrameArea.transform('EPSG:3857', 1)

  var translated = locationFrameArea.transform(locationFrameArea.projection().translate(dx, 0), 1)
  var locationFrameArea2 = ee.Geometry.LineString(translated.coordinates(), locationFrameArea.projection())
  
  var translated = locationFrameArea.transform(locationFrameArea.projection().translate(dx*2, 0), 1)
  var locationFrameArea3 = ee.Geometry.LineString(translated.coordinates(), locationFrameArea.projection())
  
  var clipArea = locationFrameArea.bounds(1)
    .union(locationFrameArea2.bounds(1), 1)
    .union(locationFrameArea3.bounds(1), 1)
  Map.centerObject(clipArea, 13)

  // images
  l5_sr = l5_sr.filterDate('2000-11-01', '2001-03-01')
  l5 = l5.filterDate('2000-11-01', '2001-03-01')
  
  var image = ee.Image(l5.filterBounds(locationFrameArea).toList(1,2).get(0))
  
  print(image)
  
  var imageTOA = image
    .clip(locationFrameArea.bounds(1))

  var bg = ee.Image(1).clip(clipArea)
  bg = bg.mask(bg.mask().not())
  Map.addLayer(bg, {palette:['ffffff']}, 'white')


  Map.addLayer(imageTOA, {bands:['B5', 'B4', 'B2'], min:0.03, max:0.7}, 'TOA')

  Map.addLayer(imageTOA, {bands:['B3', 'B2', 'B1'], min:0.03, max:0.7, gamma: 1.5}, 'TOA RGB')

  var imageNDSI = image
    .normalizedDifference(['B2', 'B5'])
    .reproject('EPSG:3857')
    .translate(-dx, 0, 'meters').clip(locationFrameArea2.bounds(1))
  Map.addLayer(imageNDSI, {palette: ['000000', 'ffffff'], min:-0.3, max:0.8}, 'NDSI')

  var imageNDWI = image
    .normalizedDifference(['B2', 'B4'])
    .reproject('EPSG:3857')
    .translate(-dx*2, 0, 'meters').clip(locationFrameArea3.bounds(1))
  Map.addLayer(imageNDWI, {palette: ['000000', 'ffffff'], min:-0.3, max:0.8}, 'NDWI')

  //Map.addLayer(poi)
  //Map.centerObject(poi)
  
  var frame = new Frame(locationFrameArea.bounds(1), {steps:3, size:3, format: '%.2f', showLeft: true, showTop: true}).draw()
  Map.addLayer(frame, {}, 'frame')

  var frame2 = new Frame(locationFrameArea.bounds(1), {steps:4, size:3, format: '%.2f', showRight: true, showTop: true}).draw()
    .reproject('EPSG:3857', null, Map.getScale())
    .translate(-dx, 0, 'meters')
  //Map.addLayer(frame2, {}, 'frame2')
  
  var bounds2Image = ee.Image().paint(locationFrameArea2.bounds(1), 1, 1)
  Map.addLayer(bounds2Image, {palette:['000000']}, 'bounds2')

  var bounds3Image = ee.Image().paint(locationFrameArea3.bounds(1), 1, 1)
  Map.addLayer(bounds3Image, {palette:['000000']}, 'bounds3')
  
  var scale = Scalebar.draw(locationScalebar, {steps:2, palette: ['5ab4ac', 'f5f5f5'], multiplier: 1000, format: '%.1f', units: 'km'})
  Map.addLayer(scale, {}, 'scale')

  var labels = [-0.3, 0.8]
  var gradient = GradientBar.draw(locationGradientBar, {min: -0.3, max: 0.8, palette: ['000000', 'ffffff'], labels: labels, format: '%.1f'})
  Map.addLayer(gradient, {}, 'gradient bar (NDWI/NDSI)')
  
  //var attribution = addGoogleAttribution(locationAttribution)
  //Map.addLayer(attribution, {}, 'attribution')
}






var Text = {
    draw: function draw(text, pos, scale, props) {
        text = ee.String(text);

        var ascii = {};
        for (var i = 32; i < 256; i++) {
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

            var textLine = textImage.visualize({ opacity: props.textOpacity, palette: [props.textColor], forceRgbOutput: true })

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
      this.showTop = props.showTop
      this.showBottom = props.showBottom
      this.showLeft = props.showLeft
      this.showRight = props.showRight
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
    this.getMargin('horizontal', translate(ll, 0, this.marginSize), translate(lr, 0, this.marginSize), 15, 5, this.showBottom), // bottom
    this.getMargin('horizontal', ul, ur, 15, -25, this.showTop), // top
    this.getMargin('vertical', translate(ll, this.marginSize, 0), translate(ul, this.marginSize, 0), 55, -5, this.showLeft), // left
    this.getMargin('vertical', lr, ur, -10, -5, this.showRight) // right
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
    var widthTargetUnits = ee.Number(ur.get(0)).subtract(ee.Number(ll.get(0))).divide(100).floor().multiply(100)
    
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


function addGoogleAttribution(point) {
  var scale = Map.getScale()
  var text = 'Map data ©2015 Google'
  var location = ee.Geometry(point)
  
  return Text.draw(text, location, scale, {
        fontSize:14, 
        textColor: '000000', 
        outlineColor: 'ffffff', 
        outlineWidth: 3, 
        outlineOpacity: 0.6
  })
}

/***
 * Draws gradient bar
 */
var GradientBar = {
  draw: function (pos, props) {
    var scale = Map.getScale()
    var palette = ['000000', 'ffffff']
    var format = '%.0f'
    var round = true
    var labels = []
    var min = 0
    var max = 1

    if(props) {
      labels = props.labels || labels
      scale = props.scale || scale
      palette = props.palette || palette
      format = props.format || format
      round = props.round !== 'undefined' ? props.round : round
      min = props.min || min
      max = props.max || max
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

    var bar = ee.Image.pixelLonLat()
      .subtract(origin).select(0).divide(width).clip(bounds)

    // define base images
    var images = ee.List([
      bar.visualize({min:0, max:1, forceRgbOutput: true, palette: palette}),
      ee.Image().paint(bounds, 1, 1).visualize({palette:['000000']}),
    ])
    
    // add labels
    
    labels.map(function(label) {
      var labelText = ee.Number(label).format(format)
      
      var labelOffset = ee.Number(label).subtract(min).divide(ee.Number(max).subtract(min))
        .multiply(width)
      
      var point = translate(
        pt0, 
        labelOffset.multiply(-1).add(p.multiply(15)), 
        p.multiply(-25)
      )
      
      var imageLabel = Text.draw(labelText, ee.Geometry.Point(point), scale, {
        fontSize:18, textColor: '000000'})

        //fontSize:18, textColor: 'ffffff', 
        //outlineColor: '000000', outlineWidth: 1.5, outlineOpacity: 0.6})
      
      images = images.add(imageLabel)
    })

    return ee.ImageCollection.fromImages(images).mosaic()
  },
}



app()