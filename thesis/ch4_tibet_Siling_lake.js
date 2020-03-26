/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var geometry = /* color: #d63000 */ee.Geometry.Point([94.7955322265625, 29.431225474131686]),
    hand = ee.Image("users/gena/GlobalHAND/30m/hand-1000"),
    hand5000 = ee.Image("users/gena/GlobalHAND/30m/hand-5000"),
    fa = ee.Image("users/gena/GlobalHAND/90m-global/fa"),
    bounds = /* color: #d63000 */ee.Geometry.MultiPoint(),
    geometry2 = /* color: #ff6565 */ee.Geometry.Point([89.27970886230469, 31.76495361511195]),
    geometry3 = /* color: #0b4a8b */ee.Geometry.Polygon(
        [[[89.21859741210938, 31.520020155192828],
          [89.29000854492188, 31.655719366285815],
          [89.36141967773438, 31.71765404259447],
          [89.38339233398438, 31.777212523418644],
          [89.36416625976562, 31.868227816180678],
          [89.22821044921875, 31.964978808081984],
          [89.18289184570312, 32.05930026106165],
          [89.10186767578125, 32.13143129714792],
          [89.04830932617188, 32.14654832170697],
          [88.87664794921875, 32.06977442847062],
          [88.84918212890625, 32.00225320314841],
          [88.86978149414062, 31.959153316146658],
          [88.86428833007812, 31.91953017247695],
          [88.80661010742188, 31.895048522832873],
          [88.75167846679688, 31.912536080050494],
          [88.65692138671875, 31.912536080050494],
          [88.55804443359375, 31.910204597744382],
          [88.40560913085938, 31.828565514766165],
          [88.41384887695312, 31.76787255014206],
          [88.49212646484375, 31.79238796850967],
          [88.54019165039062, 31.743350634409595],
          [88.59512329101562, 31.702466343795514],
          [88.65280151367188, 31.689613271441928],
          [88.70223999023438, 31.69779270531287],
          [88.74069213867188, 31.689613271441928],
          [88.78738403320312, 31.676758418795515],
          [88.868408203125, 31.690781806136822],
          [88.89312744140625, 31.62181309470652],
          [88.86978149414062, 31.529385064020936],
          [88.90411376953125, 31.4766952421678],
          [89.0386962890625, 31.48606449178399]]]),
    geometry4 = /* color: #ffc82d */ee.Geometry.LineString(
        [[89.19181823730469, 31.77779624043677],
         [89.2803955078125, 31.7544446866299]]),
    srtm = ee.Image("USGS/SRTMGL1_003"),
    geometry5 = /* color: #00ffff */ee.Geometry.Point([88.66104125976562, 31.638183183107085]),
    bounds_gallery = /* color: #bf04c2 */ee.Geometry.LineString(
        [[89.33120727539062, 31.557474155953212],
         [88.61297607421875, 32.118638011730745]]),
    scalebar = /* color: #ff0000 */ee.Geometry.LineString(
        [[88.67296230733541, 30.91513520540745],
         [88.85300052002083, 30.916612087950146]]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
print(scalebar.length(1, 'EPSG:3857'))


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
  //var offsetTop = -35
  //var offsetLeft = 73
  var offsetTop = -25
  var offsetLeft = 43

  
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
      fontSize:18, textColor: '000000', outlineColor: 'ffffff', outlineWidth: 2.5, outlineOpacity: 0.7})

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
      var markerText = widthTargetUnits.divide(steps * multiplier).multiply(i).divide(10).floor().multiply(10).format(format)
      
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


// vis = {min:0.03, max:0.3}
var   vis = {min:0.06, max:0.4, gamma:0.8}


var aoi = geometry3

var bands = ['swir1', 'nir', 'green'];

function addPercentilesAndFalseColor() {
  var l8 = new ee.ImageCollection('LANDSAT/LC8_L1T_TOA').select(['B6', 'B5', 'B3'], bands);
  var l7 = new ee.ImageCollection('LANDSAT/LE7_L1T_TOA').select(['B5', 'B4', 'B2'], bands);
  var l5 = new ee.ImageCollection('LANDSAT/LT5_L1T_TOA').select(['B5', 'B4', 'B2'], bands);
  
  var l4 = new ee.ImageCollection('LANDSAT/LT4_L1T_TOA').select(['B5', 'B4', 'B2'], bands);
  var all = ee.ImageCollection(l8.merge(l5).merge(l4))
    .filterBounds(aoi)
    .sort('system:time_start')
  
  Map.addLayer(ee.Algorithms.Terrain(srtm).select('hillshade'), {min:255, max:100}, 'hillshade', false)
  
  Map.addLayer(ee.Image(1), {palette:'ffffff'}, 'white', false)
  
  // actual
  var allRendered = all
    .filter(ee.Filter.and(ee.Filter.eq('WRS_PATH', 139), ee.Filter.eq('WRS_ROW', 38)))
    .map(function(i) {
      var text = Text.draw(i.date().format('YYYY-MM-dd'), geometry5, Map.getScale(), {fontSize:18, outlineWidth: 3, outlineOpacity: 0.7})
      var bounds = ee.Image().paint(bounds_gallery.bounds(), 1, 1).visualize({forceRgbOutput: true})
      return ee.ImageCollection.fromImages([i.visualize(vis), bounds, text]).mosaic().clip(bounds_gallery.bounds())
    })
  
  print(all.size())
  
  var count = 10
  var list = allRendered.toList(count)
  
  var rows = 2
  var columns = 4
  var region = bounds_gallery.bounds()
  
  var gallery = community.ImageGallery(allRendered, region, rows, columns)
  Map.addLayer(gallery, {}, 'gallery', false)
  
  // percentiles
  var percentilesRendered = ee.List([20, 30, 40, 50, 60, 70, 80, 90]).map(function(p) {
    var i = all.reduce(ee.Reducer.percentile([p]))
    var text = Text.draw(ee.Number(p).format('%d').cat('%'), geometry5, Map.getScale(), {fontSize:18, outlineWidth: 3, outlineOpacity: 0.7})
    return ee.ImageCollection.fromImages([i.visualize(vis), text]).mosaic().clip(bounds_gallery.bounds())
  })
  
  var count = 10
  var list = allRendered.toList(count)
  
  var rows = 2
  var columns = 4
  var region = bounds_gallery.bounds()
  
  var gallery = community.ImageGallery(ee.ImageCollection(percentilesRendered), region, rows, columns)
  Map.addLayer(gallery, {}, 'gallery (percentiles)', false)
  
  
  // add decorations
  var frame = new Frame(bounds_gallery.bounds(), {steps:2, size:4, format: '%.2f', showLeft: true, showTop:true}).draw()
  Map.addLayer(frame, {}, 'frame', false)
  
  var scale = Scalebar.draw(scalebar, {steps:2, palette: ['5ab4ac', 'f5f5f5'], multiplier: 1000, format: '%.0f', units: 'km'})
  Map.addLayer(scale, {}, 'scale', false)
  
  
  
  
  
  /*
  ee.List.sequence(0, count-1).getInfo(function(indices) {
    indices.map(function(i) {
      var image = ee.Image(list.get(i))
      Map.addLayer(image, {}, i.toString(), false)
    })
  })
  */
    
  Map.addLayer(all.select('green'), {}, 'all (nir)', false)

  var p = 20
  var annual = ee.ImageCollection(ee.List.sequence(1987, 2016).map(function(i) {
    var filtered = all.filterDate(ee.Date.fromYMD(i, 1, 1), ee.Date.fromYMD(ee.Number(i).add(1), 1, 1))
    
    return filtered.reduce(ee.Reducer.percentile([p]))
      .set('system:time_start', ee.Date.fromYMD(i, 1, 1))
      .set('year', i)
      .set('size', filtered.size())
  })).filter(ee.Filter.gt('size', 0))
  
  Export.video.toDrive({
    collection: annual.map(function(i) { return i.visualize(vis)}), 
    description: 'tibet-percentiles', 
    fileNamePrefix: 'tibet-percentiles', 
    framesPerSecond: 5, 
    dimensions: 1024, 
    region: geometry3, 
  })
  
  ee.List.sequence(1990, 2016).getInfo(function(years) {
    years.map(function(year) {
      Map.addLayer(annual.filter(ee.Filter.eq('year', year)), vis, year.toString(), false)
    })
  })
  
  Map.addLayer(ee.ImageCollection(annual), {}, 'annual (nir)', false)
  
  geometry2 = geometry2.buffer(120)
  
  print(ui.Chart.image.series({imageCollection: all, region: geometry2, scale: 30}).setOptions(
    {pointSize:3, lineSize:0, title:'TOA reflectance', vAxis: { title: null }}))
  print(ui.Chart.image.series({imageCollection: annual, region: geometry2, scale: 30}).setOptions(
    {pointSize:3, lineSize:0, title:'Annually averaged (percentiles)', vAxis: { title: null }}))
  
  var annualndwi = annual.map(function(i) { 
    return ee.Image(i).normalizedDifference(['green_p'+p, 'nir_p' +p]).set('system:time_start', i.get('system:time_start'))
  })
  
  print(ui.Chart.image.series({imageCollection: annualndwi, region: geometry2, scale: 30}).setOptions({
    pointSize:3, lineSize:0, title:'NDWI', vAxis: { title: null }}))
  
  print(ui.Chart.image.series({imageCollection: annualndwi, region: geometry4, scale: 30}).setOptions({
    pointSize:3, lineSize:0, title:'NDWI', vAxis: { title: null }}))
  
  print(Chart.feature.byFeature(ee.FeatureCollection(all), 'system:time_start', ['SUN_AZIMUTH', 'SUN_ELEVATION']).setOptions({
    pointSize: 3, lineSize:0, vAxis: { viewWindowMode:'explicit', lineSize: 0, viewWindow:{min:0, max: 200}}}))
  print(Chart.feature.histogram(ee.FeatureCollection(all), 'SUN_ELEVATION', 30))
  print(Chart.feature.histogram(ee.FeatureCollection(all), 'SUN_AZIMUTH', 30))
  
}


addPercentilesAndFalseColor()

  
  
  
//return

function getPercentile(p, start, stop) {
  var bands = ['swir1', 'nir', 'green'];
  var l8 = new ee.ImageCollection('LANDSAT/LC8_L1T_TOA').filterDate(start, stop).select(['B6', 'B5', 'B3'], bands);
  var l7 = new ee.ImageCollection('LANDSAT/LE7_L1T_TOA').filterDate(start, stop).select(['B5', 'B4', 'B2'], bands);
  var l5 = new ee.ImageCollection('LANDSAT/LT5_L1T_TOA').filterDate(start, stop).select(['B5', 'B4', 'B2'], bands);
  var l4 = new ee.ImageCollection('LANDSAT/LT4_L1T_TOA').filterDate(start, stop).select(['B5', 'B4', 'B2'], bands);
  var images = ee.ImageCollection(l8.merge(l5).merge(l4))
    .filterBounds(aoi)
    //.filter(ee.Filter.gt('SUN_AZIMUTH', 100))
    //.filter(ee.Filter.gt('SUN_ELEVATION', 40))
    .sort('system:time_start')
    .map(function(i) { return i.resample('bicubic')})
    
  var features = ee.FeatureCollection(images)
    .filterBounds(aoi)
  
  print(features.size())
  print(Chart.feature.byFeature(features, 'system:time_start', ['SUN_AZIMUTH', 'SUN_ELEVATION']).setOptions({pointSize: 3, lineWidth:1, vAxis: { viewWindowMode:'explicit', viewWindow:{min:0, max: 200}}}))
  print(Chart.feature.histogram(features, 'SUN_ELEVATION', 20))
  
  print('15% SUN_ELEVATION: ', features.reduceColumns({reducer: ee.Reducer.percentile([p]), selectors: ['SUN_ELEVATION']}).get('p' + p.toString()))

  return images.reduce(ee.Reducer.percentile([p])).rename(bands)
}

var percentile = 20





var p1 = getPercentile(percentile, '1990', '1995')
Map.addLayer(p1, vis, '1990-1995')
var ndwi1 = p1.normalizedDifference(['green', 'nir'])
Map.addLayer(ndwi1, {min:-0.1, max:0.2}, 'NDWI 1990-1995', false)

var p2 = getPercentile(percentile, '2000', '2005')
Map.addLayer(p2, vis, '2000-2005', false)
var ndwi2 = p2.normalizedDifference(['green', 'nir'])
Map.addLayer(ndwi2, {min:-0.1, max:0.2}, 'NDWI 2000-2005', false)

var p3 = getPercentile(percentile, '2010', '2015')
Map.addLayer(p3, vis, '2010-2015', false)
var ndwi3 = p3.normalizedDifference(['green', 'nir'])
Map.addLayer(ndwi3, {min:-0.1, max:0.2}, 'NDWI 2010-2015', false)

var p4 = getPercentile(percentile, '2014', '2015')
Map.addLayer(p4, vis, '2014-2015', false)
var ndwi4 = p4.normalizedDifference(['green', 'nir'])
Map.addLayer(ndwi4, {min:-0.1, max:0.2}, 'NDWI 2014-2015', false)

var p5 = getPercentile(percentile, '2015', '2016')
Map.addLayer(p5, vis, '2015-2016')
var ndwi5 = p5.normalizedDifference(['green', 'nir'])
Map.addLayer(ndwi5, {min:-0.1, max:0.2}, 'NDWI 2015-2016', false)

var waterTh = -0.05


var diff32 = ndwi3.subtract(ndwi2)
  .updateMask(ndwi3.gt(waterTh).or(ndwi2.gt(waterTh)))
Map.addLayer(diff32.mask(diff32.abs().unitScale(0, 0.2)), {min:-0.35, max:0.35, palette:['00ff00','000000', '33ccff']}, '3-2')
var diff31 = ndwi3.subtract(ndwi1)
  .updateMask(ndwi3.gt(waterTh).or(ndwi1.gt(waterTh)))
Map.addLayer(diff31.mask(diff31.abs().unitScale(0, 0.2)), {min:-0.35, max:0.35, palette:['00ff00','000000', '33ccff']}, '3-1')
var diff21 = ndwi2.subtract(ndwi1)
  .updateMask(ndwi2.gt(waterTh).or(ndwi1.gt(waterTh)))
Map.addLayer(diff21.mask(diff21.abs().unitScale(0, 0.2)), {min:-0.35, max:0.35, palette:['00ff00','000000', '33ccff']}, '2-1')
var diff51 = ndwi5.subtract(ndwi1)
  .updateMask(ndwi5.gt(waterTh).or(ndwi1.gt(waterTh)))
  .updateMask(
      ee.Image(1).subtract(ndwi5.gt(0.05).and(ndwi1.gt(0.05)))
    ) // both water
  
var mask = diff51.mask(diff51.abs().unitScale(0, 0.2))
print('Area:', mask.multiply(ee.Image.pixelArea()).reduceRegion(ee.Reducer.sum(), geometry3, 30))


Map.addLayer(ee.ImageCollection.fromImages([
  ee.Image(1).visualize({forceRgbOutput:true, palette:['000000'], opacity:0.7}),
  mask.visualize({min:-0.35, max:0.35, palette:['00ff00','000000', '33ccff']})
  ]).mosaic(), {}, '5-1')

var edge = ee.Algorithms.CannyEdgeDetector(mask, 0.99, 0)
Map.addLayer(edge.mask(edge), {palette:['ffffff']}, '5-1 edge')


var bounds = ee.Geometry(aoi)
var scale = 90
/*
print('3-2')
print(ui.Chart.image.histogram(diff32, bounds, scale))

print('3-1')
print(ui.Chart.image.histogram(diff31, bounds, scale))

print('2-1')
print(ui.Chart.image.histogram(diff21, bounds, scale))

var confidence = [45,55]

var diff32Range = ee.List(diff32.reduceRegion(ee.Reducer.percentile(confidence), bounds, scale).values())
print(diff32Range)
Map.addLayer(diff32.lte(ee.Image.constant(diff32Range.get(0))).or(diff32.gte(ee.Image.constant(diff32Range.get(1)))), {}, '3-2')

var diff31Range = ee.List(diff31.reduceRegion(ee.Reducer.percentile(confidence), bounds, scale).values())
Map.addLayer(diff31.lte(ee.Image.constant(diff31Range.get(0))).or(diff31.gte(ee.Image.constant(diff31Range.get(1)))), {}, '3-1')

var diff21Range = ee.List(diff21.reduceRegion(ee.Reducer.percentile(confidence), bounds, scale).values())
Map.addLayer(diff21.lte(ee.Image.constant(diff21Range.get(0))).or(diff21.gte(ee.Image.constant(diff21Range.get(1)))), {}, '2-1')
*/
var th = 50
Map.addLayer(hand.mask(hand.gt(th)), {palette: ['006666']}, 'HAND 1000 > ' + th, false, 0.5)
Map.addLayer(hand5000.mask(hand5000.gt(th)), {palette: ['006666']}, 'HAND 5000 > ' + th, false, 0.5)

var hand5000closed = hand5000.mask(hand5000.gt(th).focal_max(5).focal_min(5))
Map.addLayer(hand5000closed, {palette: ['006666']}, 'HAND 5000 > ' + th + ' (closing)', false, 0.5)

Map.addLayer(fa.mask(fa.gt(5000)), {}, 'fa', false)