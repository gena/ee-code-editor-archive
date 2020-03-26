/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var geometry = /* color: #98ff00 */ee.Geometry.Point([6.902503967285156, 53.59983990501686]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
/***
 * Utility function
 */
function pad(n, width, z) {
  z = z || '0';
  n = n + '';
  return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}

// construct CDF image collection
var cdf = ee.ImageCollection.fromImages(
  ee.List.sequence(0, 100, 5).remove(5).getInfo().map(function(p) {
    var image = ee.Image('users/gena/eo-bathymetry/CDF-' + pad(p, 3)).resample('bicubic') 
    return image.addBands(ee.Image.constant(image.get('percentile')).divide(100).float().rename('P'))
  })
)

var cdfArray = cdf.toArray()

Map.addLayer(cdf.select(['red','green','blue','nir']), {}, 'CDF (raw)', false)

var vis = {bands: ['swir1', 'nir', 'red'], min: 0.03, max:0.4}
Map.addLayer(cdf.filter(ee.Filter.eq('percentile', 15)), vis, '15%', false)

function focalMaxWeight(image, radius) {
  var distance = image.fastDistanceTransform().sqrt()
  var dilation = distance.where(distance.gte(radius), radius)
  
  dilation = ee.Image(radius).subtract(dilation).divide(radius)
  
  return dilation
}

// var geometry = /* color: #d63000 */ee.Geometry.Point([6.5650177001953125, 53.97370742935838]);


function app() {
  var scale = Map.getScale()
  
  // define area of interest
  var aoi = geometry.buffer(scale*40).bounds()

  // get images for that area
  var s2 = ee.ImageCollection('COPERNICUS/S2')
    .filterBounds(aoi)
    //.filterDate('2017-08-01', '2018-01-01')
    .select(
      ['B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8', 'B8A', 'B9', 'B10', 'B11', 'B12'],
      ['coastal', 'blue', 'green', 'red', 'red2', 'red3', 'red4', 'nir', 'nir2', 'water_vapour', 'cirrus', 'swir', 'swir2']
    )

  s2 = s2.map(function(i) {
    var time = i.get('system:time_start')
    
    i = i.resample('bicubic').divide(10000)

    return i
      .set('system:time_start', time)
  })
  
  // merge by time
  s2 = mosaicByTime(s2)
  print('Image size (merged by time):', s2.size())

  var l8 = ee.ImageCollection('LANDSAT/LC08/C01/T1_TOA')
  
  l8 = l8.map(function(i) {
    var time = i.get('system:time_start')

    return i
      .set('system:time_start', time)
  })
  
  l8 = l8
    .filterBounds(aoi)
    .select(['B6', 'B7', 'B5', 'B4', 'B3', 'B2', 'B9', 'B1'], 
      ['swir', 'swir2', 'nir', 'red', 'green', 'blue', 'cirrus', 'coastal'])

  //var images = s2
  //var images = l8
  
  var images = ee.ImageCollection(l8.merge(s2))
  
    
  var cloudFrequency = 70
    
  // naive groupping of overlapping images - S2 scenes are split
  //images = ee.ImageCollection(images.distinct('system:time_start'))
  

  print('Image size:', images.size())

  var rows = 6
  var columns = 12
  images = images.limit(rows*columns)
  
  // skip empty
  function addAny(i) { 
    return i.set('any', i.select(0).mask().reduceRegion(ee.Reducer.allNonZero(), aoi, scale).values().get(0)) 
  }
  images = images.map(addAny).filter(ee.Filter.eq('any', 1))

  // add some quality score (cloudness, greeness, etc.)
  images = addSpatialQualityScore(images, aoi, scale)

  // sort
  images = images.sort('quality')
  //images = images.sort('system:time_start')
  
  print(images.aggregate_array('quality'))
  
  print(ui.Chart.feature.histogram(images, 'quality', 30))
  
  // TODO: determine from cloud frequency
  var qualityThreshold = 3500
  
  // filter cloudy images
  // images = images.filter(ee.Filter.lt('quality', qualityThreshold))
  
  images = images.limit(rows*columns)
  
/*  images = images.map(function(i) { 
    return i.addBands(computeCloudScore(i))
  })
*/
  var minReflectance = 0.05
  var maxReflectance = 0.5
  
  // show as a gallery
  var options = {proj: 'EPSG:3857', flipX: false, flipY: true }
  var gallery = imageGallery(images, aoi, rows, columns, scale, options)
  
  gallery = gallery
    .addBands(computeCloudScore(gallery))
    
  Map.addLayer(gallery, {bands: ['swir', 'nir', 'blue'], min: minReflectance, max: maxReflectance}, 'gallery (false)', true);
  Map.addLayer(gallery, {bands: ['red', 'green', 'blue'], min: minReflectance, max: maxReflectance}, 'gallery (true)', false);

  // var cloudScore = computeCloudScore(gallery)
  var cloudScore = gallery.select('cloud_score')

  Map.addLayer(cloudScore.mask(cloudScore), {min: 0.0, max: 0.5, palette:['000000', 'ffff00']}, 'gallery (cloud)', false);
  Map.addLayer(cloudScore, {min: 0.0, max: 0.5, palette:['000000', 'ffffff']}, 'gallery (cloud, no mask)', false);
  Map.addLayer(cloudScore.mask(cloudScore.gt(0.15)), {min: 0.0, max: 1, palette:['000000', 'ffff00']}, 'gallery (cloud > 0.15)', false);
  Map.addLayer(cloudScore.mask(cloudScore.gt(0.1)), {min: 0.0, max: 1, palette:['000000', 'ffff00']}, 'gallery (cloud > 0.1)', false);
  Map.addLayer(cloudScore.mask(cloudScore.gt(0.4)), {min: 0.0, max: 1, palette:['000000', 'ffff00']}, 'gallery (cloud > 0.4)', false);

  var mean = images.map(function(i) { 
    return i.updateMask(i.select('cloud_score').lt(0.5))
  }).mean()

  var ndwi = images.map(function(i) { 
    var ndwi = i.updateMask(i.select('cloud_score').lt(0.4)).normalizedDifference(['green', 'nir'])
      
    ndwi = ndwi
      .where(ndwi.gt(0.35), 0.35)
      .where(ndwi.lt(-0.05), -0.05)
      
    return ndwi
  }).mean()
  
  Map.addLayer(mean, {bands: ['swir', 'nir', 'blue'], min: minReflectance, max: maxReflectance}, 'masked', false);

  var Palettes = {
      water: ['f7fbff', 'deebf7', 'c6dbef', '9ecae1', '6baed6', '4292c6', '2171b5', '08519c', '08306b']
  };
  Map.addLayer(ndwi, {min: 0, max: 0.4, palette: Palettes.water}, 'masked, ndwi', false);



  
  var radius = 30
  var stddev = cloudScore.reduceNeighborhood(ee.Reducer.stdDev(), ee.Kernel.circle(radius, 'meters'))
  Map.addLayer(stddev, {min: 0, max: 0.05}, 'cloudScore stddev neighborhood', false)  

  
  function renderLabel(i) {
    //var str = i.id()
    var str = i.date().format('YYYY-MM-dd')
    //var str = ee.Number(i.get('score')).format('%.2f')
    
    return Text.draw(str, location, scale, {
        fontSize:14, textColor: 'ffffff', outlineColor: '000000', outlineWidth: 2, outlineOpacity: 0.6})
  }
  
  var locations = getMarginLocations(aoi, 'left', 10, 10, scale)
  var location = locations.get(8)
  var labelImages = images.map(renderLabel)
  var galleryLabel = imageGallery(labelImages, aoi, rows, columns, scale, options)
  Map.addLayer(galleryLabel, {}, 'gallery, label', true)


  var cloudScoreText = ee.Image()
  var cloudScoreTextLayer = ui.Map.Layer(cloudScoreText, {}, 'cloud score text')
  Map.layers().add(cloudScoreTextLayer)

  var cloudScorePoiLayer = ui.Map.Layer(null, {palette: ['ff0000']}, 'cloud score text location', 0.3)
  Map.layers().add(cloudScorePoiLayer)
  
  Map.onClick(function(pt) {
    cloudScoreTextLayer.setEeObject(ee.Image())
  
    pt = ee.Dictionary(pt)
    var lat = pt.get('lat')
    var lon = pt.get('lon')
    
    var poi = ee.Geometry.Point([lon, lat])//.buffer(150)
    
    var region = poi.buffer(Map.getScale()*5)
  
    cloudScorePoiLayer.setEeObject(ee.Image().paint(poi, 1, 1))
  
    var cloudScoreValue = cloudScore
      .reduceRegion({reducer: ee.Reducer.first(), geometry: poi, scale: Map.getScale(), crs: 'EPSG:3857'}).values().get(0)

    print(cloudScoreValue)

    var text = Text.draw(ee.Number(cloudScoreValue).format('%.3f'), poi, Map.getScale(), {
        fontSize:14, textColor: 'ffff00', outlineColor: '000000', outlineWidth: 2, outlineOpacity: 0.6})

    cloudScoreTextLayer.setEeObject(text)
  })
}

var rescale = function(img, exp, thresholds) {
  img = img.expression(exp, {img: img})
  img = img.subtract(thresholds[0])
  img = img.where(img.lt(0), 0)
  img = img.divide(thresholds[1] - thresholds[0])
  
  return img
};

var show = function(image, name) {
  Map.addLayer(image, {min:0, max:1}, name, false)
}

function getProbabilityFromCdf(image, band) {
  var j = image.select(band)

  return cdf.select(['P', band]).map(function(i) {
    return i.select(0).mask(i.select(band).gt(image.select(band)))
  }).reduce(ee.Reducer.min()).rename('p')
}


/***
 * Match current image values with the CDF.
 */
function computeCloudScoreCdf(img) {
    var score = ee.Image(1.0);
    
    // find matching percentiles
    score = score.min(getProbabilityFromCdf(img, 'nir'))
    score = score.min(getProbabilityFromCdf(img, 'green'))
    score = score.min(getProbabilityFromCdf(img, 'blue'))
    
    return score.rename('cloud_score')
}

function computeCloudScore(img) {
    //return computeCloudScoreCdf(img)
  
    // Compute several indicators of cloudyness and take the minimum of them.
    var score = ee.Image(1.0);

    // Clouds are reasonably bright in the blue band.
    score = score.min(rescale(img, 'img.blue', [0.15, 0.8]).aside(show, 'blue')).aside(show, 'score blue');

    // Clouds are reasonably bright in all visible bands.
    score = score.min(rescale(img, 'img.red + img.green + img.blue', [0.4, 0.8]).aside(show, 'vis')).aside(show, 'score vis');

    // Clouds are reasonably bright in all infrared bands.
    // score = score.min(rescale(img, 'img.nir + img.swir + img.swir2', [0.2, 0.8]).aside(show, 'ir')).aside(show, 'score ir');

    // Clouds are reasonably cool in temperature.
    //score = ee.Image(ee.Algorithms.If(img.bandNames().contains('temp'),
    //    score.min(rescale(img, 'img.temp', [293, 268])).aside(show, 'score temp'),
    //    score
    //))

    // NDWI
    // var ndwi = img.normalizedDifference(['green', 'nir']).rename('ndwi').aside(show, 'ndwi')
    // score = score.where(ndwi.gt(0.1), 0).aside(show, 'score ndwi')

    // NDVI
    var ndvi = img.normalizedDifference(['nir', 'red']).rename('ndvi').aside(show, 'ndvi')
    score = score.where(ndvi.gt(0.2), 0).aside(show, 'score ndvi')

    // NDWI
    var ndwi = img.normalizedDifference(['green', 'nir']).rename('ndwi').aside(show, 'ndwi')

    // Clouds have high value in cirrus band
    var cirrus = rescale(img, 'img.cirrus', [0.03, 0.1]).aside(show, 'cirrus')
    score = score.max(cirrus).aside(show, 'score cirrus')
    
    // clouds are not sand (bright in nir, but not cirrus)
    var sand = ee.Image(1)
    //sand = sand.multiply(img.select('nir').gt(img.select('blue'))).aside(show, 'sand1')
    //sand = sand.multiply(img.select('blue').gt(img.select('coastal'))).aside(show, 'sand2')
    //sand = sand.multiply(img.select('blue').lt(0.43)).aside(show, 'sand3')
    //sand = sand.multiply(img.select('nir').lt(0.65)).aside(show, 'sand4')
    sand = sand.multiply(img.select('coastal').lt(0.35)).aside(show, 'sand3')
    sand = sand.multiply(rescale(img.select('nir').subtract(img.select('blue')), 'img', [0.05, 0.1])).aside(show, 'sand5')
    sand = sand.multiply(rescale(img.select('red').subtract(img.select('coastal')), 'img', [0.05, 0.2])).aside(show, 'sand6')
    sand = focalMaxWeight(sand.gt(0.01), 15).aside(show, 'sand7')
    score = score.multiply(ee.Image(1).subtract(sand))
    
    //score = score.min(rescale(sand, 'img.sand', [0.3, 0.4])).aside(show, 'score sand')
    
      
/*    var time = img.date()
    var images = getImages(selection).filterDate(
        time.advance(-60, 'day'),
        time.advance(60, 'day')
        )
        
    score = images.select('green').reduce(ee.Reducer.percentile([percentile])).rename('green')
      .subtract(img.select('green')).abs()
*/
    
    // check if current value differs a lot from an average value
    // score = average.subtract(img).abs().select('blue')

    // However, clouds are not snow.
    //let ndsi = img.normalizedDifference(['red', 'swir']);
    //score = score.min(rescale(ndsi, 'img', [0.2, 0.0])).aside(show, 'score ndsi')

    //var ndsi = img.normalizedDifference(['green', 'swir']);
    //return score.min(rescale(ndsi, 'img', [0.8, 0.6]));

    return score.rename('cloud_score');
};

/***
 * Estimates quality score for a given area.
 */
function addSpatialQualityScore(images, g, scale) {
  return images  
    .map(function(i) { 
      return i.set({
        quality: i.select('green').reduceRegion(ee.Reducer.mean(), g, scale).values().get(0)
        //quality: i.select('cloud_score').reduceRegion(ee.Reducer.sum(), g, scale).values().get(0)
      })
    })
}

/***
 * Generates image collection gallery.
 */
function imageGallery(images, region, rows, columns, scale, options) {
    var proj = ee.Projection('EPSG:3857', [scale, 0, 0, 0, -scale, 0]);
    var scale = proj.nominalScale();

    var e = ee.ErrorMargin(scale);

    var bounds = region.transform(proj, e).bounds(e, proj);

    var count = ee.Number(columns * rows);

    images = images.limit(count);

    // number of images is less than grid cells
    count = count.min(images.size());

    var ids = ee.List(images.aggregate_array('system:index'));

    var indices = ee.List.sequence(0, count.subtract(1));

    var offsetsX = indices.map(function (i) {
        return ee.Number(i).mod(columns);
    });
    var offsetsY = indices.map(function (i) {
        return ee.Number(i).divide(columns).floor();
    });

    var offsets = offsetsX.zip(offsetsY);

    var offsetByImage = ee.Dictionary.fromLists(ids, offsets);

    var coords = ee.List(bounds.coordinates().get(0));

    var w = ee.Number(ee.List(coords.get(1)).get(0)).subtract(ee.List(coords.get(0)).get(0));
    var h = ee.Number(ee.List(coords.get(2)).get(1)).subtract(ee.List(coords.get(0)).get(1));

    var boundsImage = ee.Image().toInt().paint(bounds, 1).reproject(proj);

    // new region
    var ll = ee.List(coords.get(0));
    var ur = [ee.Number(ll.get(0)).add(w.multiply(columns)), ee.Number(ll.get(1)).add(h.multiply(rows))];

    var regionNew = ee.Geometry.Rectangle([ll, ur], proj, false);

    var mosaic = images.map(function (i) {
        var offset = ee.List(offsetByImage.get(i.get('system:index')));
        var xoff = w.multiply(offset.get(0)).multiply(scale);
        var yoff = h.multiply(offset.get(1)).multiply(scale);

        i = i.mask(boundsImage.multiply(i.mask())).paint(bounds, 1, 1);

        return i.translate(xoff, yoff, 'meters', proj);
    }).mosaic();

    return mosaic;
};

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

    var distances = ee.List.sequence(0, marginLine.length(), marginLine.length().divide(count-1));

    var lineToFirstPoint = function lineToFirstPoint(g) {
        var coords = ee.Geometry(g).coordinates().get(0);
        return ee.Feature(ee.Algorithms.GeometryConstructors.Point(coords));
    };

    var points = ee.FeatureCollection(marginLine.cutLines(distances).geometries().map(lineToFirstPoint));

    // Map.addLayer(points, {color: 'green'}, 'text locations')

    return points.toList(count).map(function (o) {
        return ee.Feature(o).geometry();
    });
}

/***
 * Sentinel-2 produces multiple images, resultsing sometimes 4x more images than the actual size. 
 * This is bad for any statistical analysis.
 * 
 * This function mosaics images by time. 
 */
function mosaicByTime(images) {
  var TIME_FIELD = 'system:time_start'

  var distinct = images.distinct([TIME_FIELD])

  var filter = ee.Filter.equals({ leftField: TIME_FIELD, rightField: TIME_FIELD });
  var join = ee.Join.saveAll('matches')
  var results = join.apply(distinct, images, filter)

  // mosaic
  results = results.map(function(i) {
    var mosaic = ee.ImageCollection.fromImages(i.get('matches')).sort('system:index').mosaic()
    
    return mosaic.copyProperties(i).set(TIME_FIELD, i.get(TIME_FIELD))
  })
  
  return ee.ImageCollection(results)
}

app()