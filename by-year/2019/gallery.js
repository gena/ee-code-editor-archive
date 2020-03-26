/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var s2 = ee.ImageCollection("COPERNICUS/S2"),
    s1 = ee.ImageCollection("COPERNICUS/S1_GRD"),
    bounds = /* color: #d63000 */ee.Geometry.LineString(
        [[6.0126238918335275, 53.48293323091769],
         [6.06753754693932, 53.45412481793448]]),
    geometry = /* color: #98ff00 */ee.Geometry.MultiPoint();
/***** End of imports. If edited, may not auto-convert in the playground. *****/
function app() {
  // select least cloudy images
  var images = s2
    .filterBounds(bounds)
    //.filterDate('2016-01-01', '2017-01-01')
    .select(['B2','B3','B4','B8','B12'])
    //.filter(ee.Filter.eq('SENSING_ORBIT_DIRECTION', 'DESCENDING'))
  
  print(images.first())
  
  var images = ee.ImageCollection(images.distinct('system:time_start'))
    
  // percentile
  function computePercentile(p) {
    return images.reduce(ee.Reducer.percentile([p]))
      .rename(bandNames)
      .set({percentile: p})
  }
  
  var bandNames = ee.Image(images.first()).bandNames()
  var percentiles = ee.ImageCollection(ee.List.sequence(0, 100, 5).map(computePercentile))

  var average = ee.Image(images.reduce(ee.Reducer.intervalMean(10,25)).rename(bandNames))
  //var average = ee.Image(computePercentile(15))
  //var stddev = images.reduce(ee.Reducer.stdDev())
  var stddev = ee.Image(computePercentile(10)).subtract(ee.Image(computePercentile(25))).abs()
  
  Map.addLayer(average, {bands: ['B12','B8','B3'], min:300, max:3000}, 'average, S2', false)
  var diff = images.map(function(i) {
    return i.subtract(average).divide(stddev).abs()
      .reproject('EPSG:3857', null, Map.getScale())
  })

  images = images
    .map(function(i) { 
      return i.set({
          // score: i.select('B3').reduceRegion(ee.Reducer.percentile([90]), bounds.bounds(), 10).values().get(0)})
          //score: i.subtract(average).divide(stddev).abs().select('B8').reduceRegion(ee.Reducer.percentile([98]), bounds.bounds(), 10).values().get(0)})
          score: i.subtract(average).divide(stddev).abs().select('B3').reduceRegion(ee.Reducer.percentile([98]), bounds.bounds(), 10).values().get(0)})
          // score: i.normalizedDifference(['B3','B8']).subtract(average.normalizedDifference(['B3','B8'])).abs().reduceRegion(ee.Reducer.percentile([95]), bounds.bounds(), 10).values().get(0)}) 
    })
    .sort('score')
    //.filter(ee.Filter.rangeContains('green', 1000, 2500))

  // convert image collection to a single image (image gallery)
  var options = { 
    proj: 'EPSG:3857', scale: 30, 
    flipX: false, flipY: true 
  }

  var rows = 10
  var columns = 14

  var gallery = community.ImageGallery(images, bounds, rows, columns, options)
    
      
  Map.addLayer(gallery, {bands: ['B12','B8','B3'], min:300, max:3000}, 'gallery, S2', false)
  Map.addLayer(gallery, {bands: ['B4','B3','B2'], min:300, max:3000}, 'gallery, S2 (true)')


  // add score
  var scoreImages = images.map(function(i) {
    return Text.draw(ee.Number(i.get('score')).format('%.2f'), bounds.centroid(1), Map.getScale(), {
        fontSize:18, textColor: 'ffffff', outlineColor: '000000', outlineWidth: 3, outlineOpacity: 0.6})
  })
  
  var scoreGallery = community.ImageGallery(scoreImages, bounds, rows, columns, options)
  Map.addLayer(scoreGallery, {}, 'score', false)
  
  var gallery = community.ImageGallery(diff, bounds, rows, columns, options)
  Map.addLayer(gallery, {bands: ['B4','B3','B2'], min:0, max:10}, 'gallery, S2 dist (true)', false)
  //Map.addLayer(gallery, {min:0, max:10}, 'gallery, S2 dist (true)')

  
  //print(ui.Chart.image.histogram(gallery.select('B8'), ee.Geometry(Map.getBounds(true)), Map.getScale()*2))
  
  var gallery = community.ImageGallery(percentiles, bounds, rows, columns, options)
  Map.addLayer(gallery, {bands: ['B4','B3','B2'], min:300, max:3000}, 'gallery, S2 (percentiles)', false)

  s1 = s1.filterBounds(bounds)
  var filter = ee.Filter.eq('transmitterReceiverPolarisation', ['VV', 'VH'])
  var gallery = community.ImageGallery(s1.filter(filter).sort('system:time_start').select(0), bounds, rows, columns, options)
  var gallery2 = community.ImageGallery(s1.filter(filter).sort('system:time_start').select(1), bounds, rows, columns, options)
  Map.addLayer(ee.Image([gallery, gallery2, gallery]) , {min:-25, max:0}, 'gallery, S1', false)


}


















var community = { }

/***
 * Generates image collection gallery.
 */
community.ImageGallery = function(images, region, rows, columns, options) {
  images = images.filterBounds(region)

  var flipX = false
  var flipY = false
  
  var proj = ee.Image(images.first()).select(0).projection()

  if(options) {  
    flipX = typeof options.flipX !== 'undefined' ? options.flipX : flipX
    flipY = typeof options.flipY !== 'undefined' ? options.flipY : flipY

    proj = options.proj ? ee.Projection(options.proj) : proj
    proj = options.scale ? proj.atScale(options.scale) : proj
  }  
  
  var scale = proj.nominalScale()

  var e = ee.ErrorMargin(scale)

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
      var xoff = w.multiply(offset.get(0)).multiply(scale).multiply(flipX ? -1 : 1)
      var yoff = h.multiply(offset.get(1)).multiply(scale).multiply(flipY ? -1 : 1)
  
      i = i.updateMask(boundsImage)
      
      return i.translate(xoff, yoff, 'meters', proj)
  }).mosaic()
  
  return mosaic;
}

var Text = {
    draw: function draw(text, pos, scale, props) {
        text = ee.String(text);

        var ascii = {};
        for (var i = 32; i < 256; i++) {
            ascii[String.fromCharCode(i)] = i;
        }
        ascii = ee.Dictionary(ascii);

        var fontSize = '18';

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


app()