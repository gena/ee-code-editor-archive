/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var l8 = ee.ImageCollection("LANDSAT/LC8_L1T_TOA"),
    l7 = ee.ImageCollection("LANDSAT/LE7_L1T_TOA"),
    l5 = ee.ImageCollection("LANDSAT/LT5_L1T_TOA"),
    l4 = ee.ImageCollection("LANDSAT/LT4_L1T_TOA"),
    geometry = /* color: #d63000 */ee.Geometry.Point([79.96673583984375, 33.47727218776036]),
    srtm = ee.Image("USGS/SRTMGL1_003"),
    bounds = /* color: #98ff00 */ee.Geometry.MultiPoint(
        [[76.563720703125, 37.94419750075405],
         [97.49267578125, 29.773913869992246]]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
//Map.centerObject(bounds.bounds().buffer(-1000), 7)

bounds = ee.Geometry(Map.getBounds(true))

var hillshade = ee.Algorithms.Terrain(srtm).select('hillshade').visualize({min:250, max:100, forceRgbOutput:true})

Map.addLayer(hillshade, {}, 'hillshade')

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

var g = bounds.bounds()
l8 = l8.filterBounds(g)
l7 = l7.filterBounds(g)
l5 = l5.filterBounds(g)
l4 = l4.filterBounds(g)


var images = ee.ImageCollection(l8.select(['B6','B5','B3'], ['swir1', 'nir', 'green'])
    .merge(l7.select(['B5','B4','B2'], ['swir1', 'nir', 'green']))
    .merge(l5.select(['B5','B4','B2'], ['swir1', 'nir', 'green']))
    .merge(l4.select(['B5','B4','B2'], ['swir1', 'nir', 'green'])))
    .sort('system:time_start')
    
var percentile = 5

function getPercentile(images, percentile) {
  return images.reduce(ee.Reducer.percentile([percentile])).visualize({min: 0.03, max: 0.3})
}

print(images.filterDate('1990-01-01', '2000-01-01').size())
print(images.filterDate('2007-01-01', '2017-01-01').size())

var images1 = images.filterDate('1990-01-01', '2000-01-01')
var images2 = images.filterDate('2007-01-01', '2017-01-01')

var p1 = getPercentile(images1, percentile)
var p2 = getPercentile(images2, percentile)

Map.addLayer(p1, {}, '1990-2000')
Map.addLayer(p2, {}, '2007-2017')

function exportImage(image, name) {
  Export.image.toDrive({
    image: image,
    fileNamePrefix: name,
    dimensions: 1920,
    region: bounds.bounds(),
    description: name
  })
}

exportImage(p1, 'Tibet-1990-2000-' + percentile)
exportImage(p2, 'Tibet-2007-2017-' + percentile)

function exportVideo(images, name, fps) {
  Export.video.toDrive({ 
    collection: images.limit(5000),
    framesPerSecond: fps || 24,
    dimensions: 1920,
    region: bounds.bounds(),
    fileNamePrefix: name,
    maxFrames: 5000,
    description: name
  })
}

//exportVideo(images1.map(function(i) { return i.visualize({min:0.03, max:0.3})}), 'Tibet-1990-2000')
//exportVideo(images2.map(function(i) { return i.visualize({min:0.03, max:0.3})}), 'Tibet-2007-2017')


function getMonthlyMosaics(images, from, to) {
  from = ee.Date(from)
  to = ee.Date(to)
  var count = to.difference(from, 'month')
  
  var imagesMonthly = ee.List.sequence(0, count).map(function(duration) {
    var monthly = images.filterDate(from.advance(duration, 'month'), from.advance(ee.Number(duration).add(1), 'month'))
      .map(function(i) {
        return ee.ImageCollection([i.visualize({min: 0.03, max: 0.5}), ee.Image().paint(i.geometry(), 1, 1).visualize({opacity:0.5, forceRgbOutput:true})]).mosaic()
      })
      .mosaic()
      
    var text = Text.draw(from.advance(duration, 'month').format('YYYY, MMMM'), geometry, Map.getScale(), {fontSize:32, outlineWidth: 2})
    
    return ee.ImageCollection([hillshade, monthly, text]).mosaic()
  })
  
  return ee.ImageCollection(imagesMonthly)
}

var images1Monthly = getMonthlyMosaics(images1, '1990-01-01', '2000-01-01', 10)
var images2Monthly = getMonthlyMosaics(images2, '2007-01-01', '2017-01-01', 10)

exportVideo(images1Monthly, 'Tibet-1990-2000', 12)
exportVideo(images2Monthly, 'Tibet-2007-2017', 12)

Map.addLayer(ee.Image(images1Monthly.toList(10).get(8)), {}, 'monthly 1')
Map.addLayer(ee.Image(images2Monthly.first()), {}, 'monthly 2')

// export percentiles video
function getPercentileImages(images, pmin, pmax) {
  return ee.ImageCollection(ee.List.sequence(pmin, pmax).map(function(p) {
    return getPercentile(images, p)
  }))
}

var images1Percentiles = getPercentileImages(images1, 0, 50)
var images2Percentiles = getPercentileImages(images2, 0, 50)

Map.addLayer(ee.Image(images1Percentiles.toList(1).get(0)), {}, 'p0')
Map.addLayer(ee.Image(images1Percentiles.toList(5).get(4)), {}, 'p5')
Map.addLayer(ee.Image(images1Percentiles.toList(10).get(9)), {}, 'p10')

exportVideo(images1Percentiles, 'Tibet-1990-2000-p0-50', 5)
exportVideo(images2Percentiles, 'Tibet-2007-2017-p0-50', 5)

var ndwi = images.map(function(i) {return i.normalizedDifference(['green', 'nir']).set('system:time_start', i.get('system:time_start'))})

Map.addLayer(images, {}, 'raw', false)
Map.addLayer(ndwi, {}, 'ndwi', false)