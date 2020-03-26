/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var modis = ee.ImageCollection("MODIS/MOD09GA"),
    planet = ee.Image("users/gena/PlanetLabs/20161026_180025_0e1f_analytic"),
    proba = ee.ImageCollection("VITO/PROBAV/S1_TOC_100M"),
    s2 = ee.ImageCollection("COPERNICUS/S2"),
    l8 = ee.ImageCollection("LANDSAT/LC8_L1T_TOA"),
    geometryBounds = /* color: #d63000 */ee.Geometry.LineString(
        [[-120.17592430114746, 39.39070333666375],
         [-120.13378143310547, 39.37020340042263]]),
    s1 = ee.ImageCollection("COPERNICUS/S1_GRD"),
    geometryScalebar = /* color: #98ff00 */ee.Geometry.LineString(
        [[-120.17446375016499, 39.34724146991185],
         [-120.16955388813068, 39.34724149393274]]),
    geometryLabel = /* color: #0b4a8b */ee.Geometry.Point([-120.17480850219727, 39.38984100112062]),
    geometryDate = /* color: #d63000 */ee.Geometry.Point([-120.17480850219727, 39.388248969042635]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
function app() {
  var imageModis = ee.Image(modis.filterDate('2016-08-03', '2016-08-10').toList(1, 0).get(0))
  
  imageModis = imageModis
    .visualize({bands: ['sur_refl_b06', 'sur_refl_b02', 'sur_refl_b01'], min:200, max:8000})
    .set('system:time_start', imageModis.get('system:time_start'))

  Map.addLayer(imageModis, {}, 'MODIS', false)

  var imagePlanet = planet.select(['b1', 'b2', 'b3']).mask(planet.select(0).gt(0))
  //var min = imagePlanet.reduceRegion(ee.Reducer.percentile([1]), Map.getBounds(true), 30).values().getInfo()
  //var max = imagePlanet.reduceRegion(ee.Reducer.percentile([99]), Map.getBounds(true), 30).values().getInfo()
  //print(min, max)
  imagePlanet = imagePlanet
    .visualize({min: [211, 400, 333], max: [795, 955, 661]})
    .set('system:time_start', ee.Date.fromYMD(2016, 10, 26).millis())
    
  Map.addLayer(imagePlanet, {}, 'Planet', false)
  
  var imageProba = ee.Image(proba.toList(1,6).get(0)).select(['SWIR', 'NIR', 'RED'])
  imageProba = imageProba
    .visualize({min:5, max:500})
    .set('system:time_start', imageProba.get('system:time_start'))
    
  Map.addLayer(imageProba, {}, 'PROBA-V', false)
  
  var imageLandsat8 = ee.Image(l8.filterBounds(Map.getBounds(true)).toList(1,2).get(0)).select(['B6', 'B5', 'B3'])
  
  imageLandsat8 = imageLandsat8
    .visualize({min:0.05, max:0.3})
    .set('system:time_start', imageLandsat8.get('system:time_start'))
    
  Map.addLayer(imageLandsat8, {}, 'Landsat 8', false)
  
  var imageSentinel1 = ee.Image(s1.filterBounds(ee.Geometry(Map.getBounds(true)).centroid(1))
    .filter(ee.Filter.eq('resolution', 'H'))
    .filter(ee.Filter.eq('transmitterReceiverPolarisation', ['VV', 'VH'])).toList(1,2).get(0))

  imageSentinel1 = imageSentinel1
    .visualize({bands: ['VV', 'VV', 'VH'], min: -20, max: -5})
    .set('system:time_start', imageSentinel1.get('system:time_start'))

  Map.addLayer(ee.Image(imageSentinel1), {}, 'Sentinel 1', false)
  
  var imageSentinel2 = ee.Image(s2.filterBounds(Map.getBounds(true)).toList(1,2).get(0)).select(['B11', 'B8', 'B3'])
  
  imageSentinel2 = imageSentinel2
    .visualize({min:300, max:2500})
    .set('system:time_start', imageSentinel2.get('system:time_start'))

  Map.addLayer(imageSentinel2, {}, 'Sentinel 2', false)

  var bg = ee.Image(1).clip(geometryBounds.bounds())
  bg = bg.mask(bg.mask().not())
  Map.addLayer(bg, {palette:['ffffff']}, 'white')

  // add image gallery
  var images = ee.ImageCollection.fromImages([
    imageModis, imageProba, imageLandsat8,
    imageSentinel1, imageSentinel2, imagePlanet
    ])
    
  var imageGallery = gallery(images, geometryBounds.bounds(), 2, 3)
  Map.addLayer(imageGallery.image, {}, 'images')
  
  // add labels
  var labels = [
    'MODIS Terra Surface Reflectance, [1628nm, 841nm, 620nm], 500m', 'PROBA-V top of cannopy [1570nm, 777nm, 610nm], 100m', 'LANDSAT 8, top of atmosphere [swir1, nir, green], 30m',
    'Sentinel-1 polarimetric, [VV, VV, VH], 10m', 'Sentinel-2 top of atmosphere, [1610nm, 842nm, 560nm], 10m', 'Planet, [610nm, 500nm, 420nm], 3m'
  ]

  var labelImages = ee.List(labels).map(function(label) {
    return Text.draw(label, geometryLabel, Map.getScale(), {
        fontSize:18, textColor: 'ffffff', outlineColor: '000000', outlineWidth: 3, outlineOpacity: 0.6})
  })

  var labelGallery = gallery(ee.ImageCollection.fromImages(labelImages), geometryBounds.bounds(), 2, 3)
  Map.addLayer(labelGallery.image, {}, 'labels')

  // add date
  var dateImages = images.map(function(i) {
    return Text.draw(i.date().format('YYYY-MM-dd'), geometryDate, Map.getScale(), {
        fontSize:18, textColor: 'ffffff', outlineColor: '000000', outlineWidth: 3, outlineOpacity: 0.6})
  })
  
  var dateGallery = gallery(dateImages, geometryBounds.bounds(), 2, 3)
  Map.addLayer(dateGallery.image, {}, 'dates')

  // add frame
  var frame = new Frame(geometryBounds.bounds(), {steps:5, size:4, format: '%.3f'}).draw()
  Map.addLayer(frame, {}, 'frame')

  // add scalebar
  var scale = Scalebar.draw(geometryScalebar, {steps:1, palette: ['5ab4ac', 'f5f5f5'], multiplier: 1, format: '%.0f', units: 'm'})
  Map.addLayer(scale, {}, 'scale')
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
 * Draws scalebar
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
    
    // make sure that we have correct line from left to right
    pos = ee.Geometry.LineString(ee.List(pos.bounds().coordinates().get(0)).slice(0, 2))
    
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
      fontSize:18, textColor: '000000', outlineColor: 'ffffff', outlineWidth: 2, outlineOpacity: 0.6})

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
        width.divide(steps).multiply(i).multiply(-1).add(p.multiply(5)), 
        p.multiply(-20)
      )
      
      var imageLabel = Text.draw(markerText, ee.Geometry.Point(point), scale, {
        fontSize:18, textColor: '000000', outlineColor: 'ffffff', outlineWidth: 2, outlineOpacity: 0.6})
      
      images = images.add(imageLabel)
    }

    return ee.ImageCollection.fromImages(images).mosaic()
  },
}

function addGoogleAttribution(point) {
  var scale = Map.getScale()
  var text = 'Map data ©2015 Google'
  var location = ee.Geometry(point)
  
  return Text.draw(text, location, scale, {
        fontSize:18, 
        textColor: '000000', 
        outlineColor: 'ffffff', 
        outlineWidth: 3, 
        outlineOpacity: 0.6
  })
}

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

    var boundsImage = ee.Image().toInt().reproject(proj).paint(bounds, 1)

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

app()