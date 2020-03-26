/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var l5 = ee.ImageCollection("LANDSAT/LT5_L1T_TOA"),
    l7 = ee.ImageCollection("LANDSAT/LE7_L1T_TOA"),
    l8 = ee.ImageCollection("LANDSAT/LC8_L1T_TOA"),
    geometry = /* color: #d63000 */ee.Geometry.MultiPoint(
        [[80.7685661315918, 26.86037098759474],
         [85.08499145507812, 24.96240520191578],
         [87.42233276367188, 25.761556561592343]]),
    aqua = ee.ImageCollection("MODIS/MYD09GQ"),
    terra = ee.ImageCollection("MODIS/MOD09GQ"),
    terra500 = ee.ImageCollection("MODIS/MOD09GA"),
    aqua500 = ee.ImageCollection("MODIS/MYD09GA"),
    ncep = ee.ImageCollection("NOAA/CFSV2/FOR6H"),
    proba100 = ee.ImageCollection("VITO/PROBAV/C1/S1_TOC_100M"),
    proba300 = ee.ImageCollection("VITO/PROBAV/C1/S1_TOC_333M"),
    s1 = ee.ImageCollection("COPERNICUS/S1_GRD"),
    s2 = ee.ImageCollection("COPERNICUS/S2");
/***** End of imports. If edited, may not auto-convert in the playground. *****/

var month = {from: 6, to: 9}

var weekly = ee.List.sequence(2014, 2017).map(function(y) {
  return ee.List.sequence(month.from, month.to).map(function(m) {
    return ee.List(
        [ 
          ee.Date.fromYMD(y, m, 1), 
          ee.Date.fromYMD(y, m, 7),
          ee.Date.fromYMD(y, m, 14),
          ee.Date.fromYMD(y, m, 21)
        ]
    )
  })
}).flatten()

var length = 14 // days
var intervals = weekly.map(function(d) {
  return [d, ee.Date(d).advance(length, 'day')]
})

intervals = ee.List(intervals).slice(20)




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




var images = ee.ImageCollection(l5.merge(l7))//.filterDate('2008-01-01','2009-01-01')
//var images = l5.filterDate('2008-01-01','2009-01-01')

images = images.filterBounds(Map.getBounds(true))

images = images
  .map(function(i){
    return i.clip(i.select(0).geometry().buffer(-5000)).updateMask(i.lt(0.3))
  })


Map.addLayer(images.select(['B5','B4','B2']).min(), {min:0.04, max:0.3, gamma:0.8}, 'LANDSAT min', false)

var i = images.select(['B5','B4','B2']).reduce(ee.Reducer.percentile([1]))
Map.addLayer(i, {min:0.04, max:0.3, gamma:0.8}, 'LANDSAT 1%', false)

var i = images.select(['B5','B4','B2']).reduce(ee.Reducer.percentile([5]))
Map.addLayer(i, {min:0.04, max:0.3, gamma:0.8}, 'LANDSAT 5%', false)

var i = images.select(['B5','B4','B2']).reduce(ee.Reducer.percentile([15]))
Map.addLayer(i, {min:0.04, max:0.3, gamma:0.8}, 'LANDSAT 15%', false)


var w = i.normalizedDifference(['B2_p15','B5_p15'])
//Map.addLayer(w.mask(w.gt(0)))


var pansharpen = function(image) {
    var hsv  = image.select(0,1,2).rgbToHsv();
    var huesat = hsv.select('hue', 'saturation');
    var upres = ee.Image.cat(huesat, image.select('pan')).hsvToRgb();
 
    return upres.set('system:time_start', image.get('system:time_start'));
}


function addDateText(image) {
  var str = image.date().format('YYYY-MM-dd')
  
  var imageLabel = Text.draw(str, geometry, Map.getScale(), {
          fontSize:32, textColor: '000000', outlineColor: 'ffffff', outlineWidth: 2, outlineOpacity:0.7})

  return ee.ImageCollection.fromImages([
    image.visualize({min:0.02, max:0.3}), 
    imageLabel
  ]).mosaic()
}

l5 = l5.select(['B5','B4','B2','B7'], ['swir1', 'nir', 'green', 'pan'])
l7 = l7.select(['B5','B4','B2','B7'], ['swir1', 'nir', 'green', 'pan'])
l8 = l8.select(['B6','B5','B3','B8'], ['swir1', 'nir', 'green', 'pan'])

var images2 = ee.ImageCollection(l5.merge(l7).merge(l8))
  .filterDate('2008-01-01','2009-01-01')
  .filterBounds(Map.getCenter())
  .sort('system:time_start')

images2 = images2
  .map(pansharpen)
  .map(addDateText)

var count = 50
var list = images2.toList(count)

ee.List.sequence(0, count-1).getInfo(function(indices) {  
  indices.map(function(i) {
    var image = ee.Image(list.get(i))
    //Map.addLayer(image, {}, i.toString(), i===0)
  })
})


Export.video.toDrive({
  collection: images2, 
  description: 'India-Lucknow-all', 
  fileNamePrefix: 'India-Lucknow-all', 
  framesPerSecond: 5, 
  dimensions: 1920, 
  region: Map.getBounds(true), 
  maxFrames: 2000})


// MODIS

var modis = ee.ImageCollection(terra500.merge(aqua500)).select(['sur_refl_b03', 'sur_refl_b02', 'sur_refl_b01'])
  .filterDate('2008-08-25','2008-09-01')
  .sort('system:time_start')

/*
var modisWeekly = ee.List.sequence(2008, 2009).map(function(y) {
  return ee.List.sequence(1, 12).map(function(m) {
    return ee.List([ee.Date.fromYMD(), 10, 20])
  })
})

print(modisWeekly)*/

Export.video.toDrive({
  collection: images2, 
  description: 'India-Lucknow-all', 
  fileNamePrefix: 'India-Lucknow-all', 
  framesPerSecond: 5, 
  dimensions: 1920, 
  region: Map.getBounds(true), 
  maxFrames: 2000})

var list2 = modis.toList(count)

ee.List.sequence(0, count-1).getInfo(function(indices) {  
  indices.map(function(i) {
    var image = ee.Image(list2.get(i))
    //Map.addLayer(image, {min:500, max:5000}, 'MODIS' + i.toString(), i===0)
  })
})



// Sentinel-2

s2 = s2.select(['B11','B8','B3'])
//  .filterDate('2015-01-01','2016-01-01')
  .filter(ee.Filter.dayOfYear(200, 270))
  .filterBounds(Map.getBounds(true))

print(s2.size())

var listS2 = s2.toList(count)



ee.List.sequence(0, count-1).getInfo(function(indices) {  
  indices.map(function(i) {
    var image = ee.Image(listS2.get(i))
    var layer = ui.Map.Layer(image, {min:600, max:3700}, 'S2 ' + i.toString(), false)

    var date = image.date()
    date.format('YYYY-MM-dd').getInfo(function(d) {
      layer = layer.setName('S2 ' + i.toString() + '-' + d)
    })
    
    Map.layers().add(layer)
  })
})


// PROBA-V

var proba = ee.ImageCollection(proba300.merge(proba100)).select(['SWIR', 'NIR', 'BLUE'])
//var proba = proba100.select(['SWIR', 'NIR', 'BLUE'])
  //.filter(ee.Filter.dayOfYear(6,9))
  //.filterDate('2016-07-01', '2016-9-01')

Map.addLayer(proba.reduce(ee.Reducer.percentile([1])), {min:100, max:800}, 'PROBA 1', false)
Map.addLayer(proba.reduce(ee.Reducer.percentile([5])), {min:100, max:800}, 'PROBA 5', false)
Map.addLayer(proba.reduce(ee.Reducer.percentile([10])), {min:100, max:800}, 'PROBA 10', false)  


proba = proba
  .map(function(i) { return i.set('not_empty', i.select(0).reduceRegion(ee.Reducer.anyNonZero(), Map.getBounds(true), Map.getScale()*100).values().get(0)) })
  .filter(ee.Filter.eq('not_empty', 1))
  .sort('system:time_start')

var list3 = proba.toList(count)

ee.List.sequence(0, count-1).getInfo(function(indices) {  
  indices.map(function(i) {
    var image = ee.Image(list3.get(i))
    var layer = ui.Map.Layer(image, {min:100, max:800}, 'PROBA' + i.toString(), false)

    var date = image.date()
    date.format('YYYY-MM-dd').getInfo(function(d) {
      layer = layer.setName('PROBA' + i.toString() + '-' + d)
    })
    
    //Map.layers().add(layer)
  })
})



// Sentinel-1

s1 = s1.select(0)
  //.filterDate('2016-07-01', '2016-9-01')
  .filterBounds(Map.getBounds(true))
  .map(function(i) { return i.clip(i.geometry().buffer(-10000))})
  //.sort('system:time_start')
  
  
Map.addLayer(s1.reduce(ee.Reducer.percentile([0])), {min:-25, max:0}, 'S1 1%', false)
Map.addLayer(s1.reduce(ee.Reducer.percentile([5])), {min:-25, max:0}, 'S1 5%', false)
Map.addLayer(s1.reduce(ee.Reducer.percentile([10])), {min:-25, max:0}, 'S1 10%', false)  
  
  throw('stop')
  
// var list4 = s1.toList(count)

var list4 = intervals.map(function(interval) {
  var l = ee.List(interval)
  var from = ee.Date(l.get(0))
  var to = ee.Date(l.get(1))
  return s1.filterDate(from, to)
    .mosaic().set('label', from.format('YYYY-MM-dd').cat(' - ').cat(to.format('YYYY-MM-dd')))
})

ee.List.sequence(0, count-1).getInfo(function(indices) {  
  indices.map(function(i) {
    var image = ee.Image(list4.get(i))
    var layer = ui.Map.Layer(image, {min:-20, max:0}, 'S1 ' + i.toString(), false)

    image.get('label').getInfo(function(l) {
      layer = layer.setName('S1 ' + i.toString() + '-' + l)
    })
    
    Map.layers().add(layer)
  })
})
