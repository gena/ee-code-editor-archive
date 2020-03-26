// Map.addLayer(ee.Image(1), {palette: ['000000']}, 'bg', true, 0.6)

function app() {

  var map = ee.Geometry(Map.getBounds(true))
  
  // IMPORTED: lebel 6
  var basin = ee.Feature(ee.FeatureCollection("users/gena/hybas_lev06_v1c")
    .filter(ee.Filter.eq('hybas_id', 7060061520)).first())

  // IMPORTED: only one feature
  // var basin = ee.Feature(ee.FeatureCollection("users/gena/test").first())
    
  var coords = basin.geometry().coordinates()
  
  var scale = Map.getScale()
  
  print(coords)
  
  Map.addLayer(basin)
  
  // vertex indices
  var indexText = ee.ImageCollection(coords.map(function(polygon) {
    polygon = ee.List(polygon)
    
    return ee.ImageCollection(ee.List.sequence(0, polygon.size().subtract(1)).map(function(j) {
      var ring = ee.List(polygon.get(j))

      var centerIndex = Text.draw(ee.Number(j).format('%d'), ee.Algorithms.GeometryConstructors.Polygon(ring).centroid(1), scale)
      
      return centerIndex
      
/*      return ee.ImageCollection(ee.List.sequence(0, ring.size().subtract(1)).map(function(i) {
        var coord = ring.get(i)
        
        return Text.draw(ee.Number(i).format('%d'), ee.Algorithms.GeometryConstructors.Point(coord), scale)
      }))//.merge(ee.ImageCollection.fromImages([centerIndex]))
*/    })).mosaic()
  }).flatten()).mosaic()
  
  print(indexText)
  Map.addLayer(indexText)
  return

  
  var polygons = coords.map(function(l) {
    return ee.Feature(ee.Algorithms.GeometryConstructors.Polygon(ee.List(l)))
  })
  
  Map.addLayer(ee.FeatureCollection(polygons), {color: 'gray'}, 'outer')
  
  Map.addLayer(ee.Geometry.MultiPoint(coords.flatten()), {color: 'white'}, 'coords')
}


// Text {
var Text = {
  draw: function (text, pos, scale, props) {
    text = ee.String(text)
    
    var ascii = {};
    for (var i = 32; i < 256; i++) {
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