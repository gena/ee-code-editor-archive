function app() {
  var bounds = Map.getBounds(true)
  var name = 'NewOrleans'
  
  var mapLayerCount = 5
  
  var minYear = 1999
  var maxYear = 2001
  var stepMonths = 6
  var windowMonths = 12
  var percentile = 15
  
  
  var bands = ['red', 'green', 'blue'];
  var bandsL8 = ['B6', 'B5', 'B3']
  var bandsL7 = ['B5', 'B4', 'B2']
  
  var l8 = new ee.ImageCollection('LANDSAT/LC8_L1T_TOA').select(bandsL8, bands);
  var l7 = new ee.ImageCollection('LANDSAT/LE7_L1T_TOA').select(bandsL7, bands);
  var l5 = new ee.ImageCollection('LANDSAT/LT5_L1T_TOA').select(bandsL7, bands);
  var l4 = new ee.ImageCollection('LANDSAT/LT4_L1T_TOA').select(bandsL7, bands);
  
  var images = ee.ImageCollection(l8.merge(l7).merge(l5).merge(l4)).filterBounds(bounds)
  
  var years = ee.List.sequence(minYear, maxYear)
  var months = ee.List.sequence(1, 12, stepMonths)
  
  var dates = years.map(function(y) {
    return months.map(function(m) { return ee.Date.fromYMD(y, m, 1) })
  }).flatten()
  
  var frames = ee.ImageCollection(dates.map(function(date) {
      date = ee.Date(date)
  
      var from = date;
      var to = date.advance(windowMonths, 'month')
      
      return renderFrame(images, from, to, 15)
  }))
  
  // add to map
  var list = frames.toList(mapLayerCount, 0)
  ee.List.sequence(0, mapLayerCount-1).getInfo().map(function(i) {
    var frame = ee.Image(list.get(i)).clip(bounds);
    Map.addLayer(frame, {}, frame.get('date').getInfo(), i == 0)
  })
  
  Export.video.toDrive({
    collection: frames, 
    description: name,
    scale: Map.getScale(),
    crs: 'EPSG:3857',
    region: bounds,
    fileNamePrefix: name,
    framesPerSecond:12
  })
}  




/***
 * Renders a single video frame
 */
function renderFrame(images, from, to, percentile) {
  var filtered = images.filterDate(from, to)

  var result = ee.Algorithms.If(
    ee.Algorithms.IsEqual(filtered.first(), null),
    ee.Image(0),
    annotate(filtered.reduce(ee.Reducer.percentile([percentile])).visualize({min: 0.05, max:0.3}), 
      from.format('YYYY-MM-dd').cat(' ... ').cat(to.format('YYYY-MM-dd')))
  )
  
  return ee.Image(result).set('date', from.format('YYYY-MM-dd'))
}


/***
 * Adds annotations to the image, currently this is only date
 */ 
function annotate(image, text) {
  var scale = Map.getScale()

  // draw text
  var pos = getMapCorner(100, 100)
  var props = { fontSize: 32, textColor: 'ffffff', outlineColor: '000000', outlineWidth: 2.5, outlineOpacity: 0.6}
  var textImage = Text.draw(text, pos, scale, props)
  
  return ee.ImageCollection([
    image, 
    textImage
  ]).mosaic()
}

/***
 * Returns a point with an offset given in map scale units relative to lower left corner
 */
function getMapCorner(offsetX, offsetY) {
  var bounds = ee.List(Map.getBounds())
  var ll = ee.Geometry.Point([bounds.get(0), bounds.get(1)]) // lower-left
  var scale = Map.getScale()
  
  var posWeb = ll.transform(
      ee.Projection('EPSG:3857').translate(ee.Number(offsetX).multiply(-scale), ee.Number(offsetY).multiply(-scale))
    ).coordinates()
    
  return ee.Geometry.Point(posWeb, 'EPSG:3857')
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

// } 

app()