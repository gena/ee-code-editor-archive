/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var geometry = /* color: #d63000 */ee.Geometry.Point([60.0787353515625, 45.26328853149688]),
    geometry2 = /* color: #98ff00 */ee.Geometry.MultiPoint(
        [[57.3046875, 47.16730970131579],
         [62.16064453125, 43.12504316740127]]),
    geometry3 = /* color: #0B4A8B */ee.Geometry.LineString(
        [[65.00649016297336, 42.72277632693461],
         [66.38892309678647, 42.71473626041897]]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
// ch4-ara.js


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
          fontSize:32, textColor: '000000', outlineColor: 'ffffff', outlineWidth: 2})
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
  var offsetTop = -35
  var offsetLeft = 73
  //var offsetTop = -25
  //var offsetLeft = 43

  
  var margins = ee.List([
    this.getMargin('horizontal', translate(ll, 0, this.marginSize), translate(lr, 0, this.marginSize), 15, 5, this.showBottom), // bottom
    this.getMargin('horizontal', ul, ur, 15, offsetTop, this.showTop), // top
    this.getMargin('vertical', translate(ll, this.marginSize, 0), translate(ul, this.marginSize, 0), offsetLeft, -5, this.showLeft), // left
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
      fontSize:32, textColor: '000000', outlineColor: 'ffffff', outlineWidth: 2.5, outlineOpacity: 0.7})

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
    var widthTargetUnits = ee.Number(ur.get(0)).subtract(ee.Number(ll.get(0)))
    
    for(var i=0; i<steps+1; i++) {
      var markerText = widthTargetUnits.divide(steps * multiplier).multiply(i).divide(100).floor().multiply(100).format(format)
      
      var point = translate(
        pt0, 
        width.divide(steps).multiply(i).multiply(-1).add(p.multiply(10)), 
        p.multiply(-30)
      )
      
      var imageLabel = Text.draw(markerText, ee.Geometry.Point(point), scale, {
        fontSize:32, textColor: '000000', outlineColor: 'ffffff', outlineWidth: 2.5, outlineOpacity: 0.6})
      
      images = images.add(imageLabel)
    }

    return ee.ImageCollection.fromImages(images).mosaic()
  },
}

var community = { }

/***
 * Generates image collection gallery.
 */
community.ImageGallery = function(images, region, rows, columns) {
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
      
      i = ee.ImageCollection([i, ee.Image().paint(bounds, 1, 1).visualize({forceRgbOutput: true})]).mosaic()

      return i.translate(xoff, yoff, 'meters', proj)
  }).mosaic()
  
  return mosaic;
}

// Text {
var Text = {
  draw: function (text, pos, scale, props) {
    text = ee.String(text)
    
    var ascii = {};
    for (var i = 32; i < 128; i++) {
        ascii[String.fromCharCode(i)] = i;
    }
    ascii = ee.Dictionary(ascii);
    
    var fontSize = '16';

    if(props && props.fontSize) {
      fontSize = props.fontSize
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
      charWidths: ee.String(glyphs.get('char_widths')).split(',').map(ee.Number.parse),
    };
    
    font.columns = font.width.divide(font.cellWidth);
    font.rows = font.height.divide(font.cellHeight);
   
    function toAscii(text) {
      return ee.List(text.split('')
        .iterate(function(char, prev) { return ee.List(prev).add(ascii.get(char)); }, ee.List([])));
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
    var charWidths = codes.map(function(code) { return ee.Number(font.charWidths.get(ee.Number(code))); });
    
    // compute xpos for every char
    var charX = ee.List(charWidths.iterate(function(w, list) { 
      list = ee.List(list);
      var lastX = ee.Number(list.get(-1));
      var x = lastX.add(w);
      
      return list.add(x);
    }, ee.List([0]))).slice(0, -1);
    
    var charPositions = charX.zip(ee.List.sequence(0, charX.size()));
    
    // compute char glyph positions
    var charGlyphPositions = codes.map(function(code) {
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
    var textImage = ee.ImageCollection(charGlyphInfo.map(function(o) {
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
  
    textImage = textImage.mask(textImage)
  
    if(props) {
      props = { 
        textColor: props.textColor || 'ffffff', 
        outlineColor: props.outlineColor || '000000', 
        outlineWidth: props.outlineWidth || 0, 
        textOpacity: props.textOpacity || 0.9,
        textWidth: props.textWidth || 1, 
        outlineOpacity: props.outlineOpacity || 0.4 
      };

      var textLine = textImage
        .visualize({opacity:props.textOpacity, palette: [props.textColor], forceRgbOutput:true})
        
      if(props.textWidth > 1) {
        textLine.focal_max(props.textWidth)
      }

      if(!props || (props && !props.outlineWidth)) {
        return textLine;
      }

      var textOutline = textImage.focal_max(props.outlineWidth)
        .visualize({opacity:props.outlineOpacity, palette: [props.outlineColor], forceRgbOutput:true})

        
      return ee.ImageCollection.fromImages(ee.List([textOutline, textLine])).mosaic()
    } else {
      return textImage;
    }
  }
}



var bands = ['swir1', 'nir', 'green']
// var aoi = ee.Geometry(Map.getBounds(true))
var aoi = geometry2.bounds(30)

var l8 = new ee.ImageCollection('LANDSAT/LC8_L1T_TOA').select(['B6', 'B5', 'B3'], bands);
var l7 = new ee.ImageCollection('LANDSAT/LE7_L1T_TOA').select(['B5', 'B4', 'B2'], bands);
var l5 = new ee.ImageCollection('LANDSAT/LT5_L1T_TOA').select(['B5', 'B4', 'B2'], bands);
var l4 = new ee.ImageCollection('LANDSAT/LT4_L1T_TOA').select(['B5', 'B4', 'B2'], bands);
var all = ee.ImageCollection(l8.merge(l5).merge(l4))
  .filterBounds(aoi)
  .sort('system:time_start')
  
print(all.size())

print(ui.Chart.image.series({ imageCollection: all, region: geometry.buffer(120), scale: 30 }).setOptions({title:'TOA reflectance', vAxis: {label: null}}))


var allNDWI = all.map(function(i) { return i.normalizedDifference(['green', 'nir']).set('system:time_start', i.get('system:time_start'))})
print(ui.Chart.image.series({ imageCollection: allNDWI, region: geometry.buffer(300), scale: 90 }).setOptions({title: 'NDWI'}))

var vis = {min:0.03, max:0.4, gamma:0.7}

var image = all.filterDate('2013-01-01', '2017-01-01')
  .select(['swir1', 'nir', 'green'])
  .reduce(ee.Reducer.percentile([20]))
  .visualize(vis)
  
image = ee.ImageCollection([
  image,
  ee.Image().paint(geometry.buffer(5000), 1).visualize({palette: ['ff0000'], opacity:0.7})
  ]).mosaic()

Map.addLayer(image, {}, 'Aral')

var image2 = all.filterDate('1984-01-01', '1995-01-01')
  .select(['swir1', 'nir', 'green'])
  .reduce(ee.Reducer.percentile([20]))
  .visualize(vis)

image2 = ee.ImageCollection([
  image2,
  ee.Image().paint(geometry.buffer(5000), 1).visualize({palette: ['ff0000'], opacity:0.7})
  ]).mosaic()

Map.addLayer(image2, {}, 'Aral (1984-1995)')

Map.addLayer(ee.Image(1), {palette: ['ffffff']}, 'white')

var region = geometry2.bounds()
var rows = 1
var columns = 2
var gallery = community.ImageGallery(ee.ImageCollection([image2, image]), region, rows, columns)
Map.addLayer(gallery, {}, 'gallery')


// add scalebar
var scale = Scalebar.draw(geometry3, {steps:1, palette: ['5ab4ac', 'f5f5f5'], multiplier: 1000, format: '%.0f', units: 'km'})
Map.addLayer(scale, {}, 'scale')
