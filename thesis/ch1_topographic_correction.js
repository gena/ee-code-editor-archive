/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var srtm = ee.Image("USGS/SRTMGL1_003"),
    testpoint = /* color: #d63000 */ee.Geometry.Point([-118.73624324798584, 34.49343521954055]),
    testpoint2 = /* color: #98ff00 */ee.Geometry.Point([-105.65002374351025, 40.24829182914809]),
    testpoint3 = /* color: #ff9a6b */ee.Geometry.Point([94.7900390625, 29.49247204748296]),
    ned = ee.Image("USGS/NED"),
    studyArea = /* color: #d63000 */ee.Geometry.LineString(
        [[-118.78229132955528, 34.50825402920384],
         [-118.7240983352612, 34.43976114129313]]),
    locationGradientBar = /* color: #98ff00 */ee.Geometry.LineString(
        [[-118.57183444381752, 34.431407793767804],
         [-118.55535511913445, 34.43296521970976]]),
    locationScalebar = /* color: #0b4a8b */ee.Geometry.LineString(
        [[-118.77456665039062, 34.43098302324201],
         [-118.75731468200684, 34.43139008675723]]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
function app() {
  var bufferSize = 900
  
  //Get angles in radians
  function radians(deg) {
    return deg.multiply(3.1415927).divide(180);
  }
  
  
  //Return constant images of solar zenith and azimuth (in radians) from L1 metadata
  function getSolarGeom(l1timg){
    var az = ee.Number(l1timg.get("SUN_AZIMUTH"));
    var el = ee.Number(l1timg.get("SUN_ELEVATION"));
    var ze = ee.Number(90.0).subtract(el);
    var azimuth = radians(az);
    var elevation = radians(el);
    var zenith = radians(ze);
    var dummy = l1timg.select(0).multiply(ee.Image(0));
    return ee.Image.cat(dummy.add(azimuth), dummy.add(elevation), dummy.add(zenith))
                    .select([0,1,2], ['azimuthrad', 'elevationrad', 'zenithrad'])
                    .set({'system:time_start': l1timg.get("system:time_start"),
                          'system:id': l1timg.get("system:id"),
                          'SUN_AZIMUTH_DEG': az,
                          'SUN_AZIMUTH_RAD': azimuth,
                          'SUN_ZENITH_DEG' : ze,
                          'SUN_ZENITH_RAD' : zenith,
                          'SUN_ELEVATION_DEG':el,
                          'SUN_ELEVATION_RAD':elevation
                    });
  }
  
  
  // Call DEM of choice, in this case SRTM 30m
  // Swap this with other DEM if needed.
  function getTerrain(){
    //var terrain = ee.Algorithms.Terrain(srtm);
    var terrain = ee.Algorithms.Terrain(ned);
    return terrain;
  }
  
  
  //Return constant images of terrain stuff (slope/aspect in radians)
  function getTerrainRads(){
    var terrain = getTerrain();
    var elev = terrain.select(0); 
    var slope = radians(terrain.select(['slope']));
    var aspect = radians(terrain.select(['aspect']));
    var bandnames = ["elevation", "sloperad", "aspectrad"];
    return ee.Image.cat(elev, slope, aspect).select([0,1,2], bandnames);
  }
  
  
  //Return direct illumination factor
  function getDirectFactor(solgeo, normalize, nonegatives){
    var terr = getTerrainRads();
    var direct = solgeo.select('azimuthrad')
                      .subtract(terr.select('aspectrad')).cos()
                      .multiply(terr.select('sloperad').sin())
                      .multiply(solgeo.select('zenithrad').sin())
                      .add(solgeo.select('zenithrad').cos()
                      .multiply(terr.select('sloperad').cos()));
    // Values normalized to horizontal conditions are useful for mapping relative changes in solar radiation.
    var seldirect = ee.Algorithms.If(normalize, 
                                     direct.divide(solgeo.select('zenithrad').cos()),
                                     direct);
    // Negative values do not make physical sense (e.g. when cosine method is appled), 
    // but they should be used in the rotation method
    var finaldirect = ee.Algorithms.If(nonegatives,
                                       ee.Image(seldirect).max(ee.Image(0)),
                                       ee.Image(seldirect));
    return ee.Image(ee.Image(finaldirect).select([0], ['DIRECT']).copyProperties(solgeo))
  } 
  
  
  //Get the parameters of the linear regression between illumination and reflectance.
  function singleBandRotoCorr(singlebandimg, dirillum, fitgeometry){
    var pairimg = ee.Image.cat(dirillum, singlebandimg);
    // fitgeometry = singlebandimg.geometry().buffer(-4000);
    var reduce_args = {
      'reducer':ee.Reducer.linearFit(), 
      'scale':120,
      'tileScale':1,
      'bestEffort':false, 
      'geometry':fitgeometry,
      'maxPixels':1e9
    };
    var rangemask = dirillum.gte(0.25).and(dirillum.lte(1.0))
    var r = pairimg.reduceRegion(reduce_args);
    var scale = ee.Number(r.get('scale'));
    var offset = ee.Number(r.get('offset'));
    var zencos = ee.Number(dirillum.get('SUN_ZENITH_RAD')).cos();
    var rotocorr = singlebandimg.subtract(
      ee.Image.constant(scale).multiply(dirillum.subtract(ee.Image.constant(zencos)))
      );
    return rotocorr.set({
      scale:scale,
      offset:offset
    });
  }
  
  
  function getLandsat(start, stop, startdoy, enddoy, region) {
    var bands = ['swir1', 'nir', 'green'];
    var l8 = ee.ImageCollection('LANDSAT/LC8_L1T_TOA').filterDate(start, stop).select(['B6', 'B5', 'B3'], bands);
    
    var images = l8.filter(ee.Filter.dayOfYear(startdoy, enddoy))
      .filterBounds(region)
      .filter(ee.Filter.lt('SUN_ELEVATION', 60))
      //.filter(ee.Filter.lt('CLOUD_COVER', 5))
      .sort('system:time_start')
      .map(function(i) { return i.resample('bicubic')})
      
      
    return images;
  }
  
  
  
  // var reg = ee.Geometry.Point(94.7955322265625, 29.47314131293348); //China
  // var reg = ee.Geometry.Point(-117.01950056478381, 33.574693507887005); //Southern Cali
  var start = ee.Date.fromYMD(2013,1,1);
  var end = ee.Date.fromYMD(2017,1,1);
  
  var selpoint = testpoint;
  
  var imgcoll_wint = getLandsat(start, end, 1, 70, selpoint);
  var imgcoll_spri = getLandsat(start, end, 70, 120, selpoint);
  var imgcoll_sumr = getLandsat(start, end, 120, 150, selpoint);
  var imgcoll_fall = getLandsat(start, end, 150, 250, selpoint);
  
  var testimg_wint = ee.Image(imgcoll_wint.first());
  var testimg_spri = ee.Image(imgcoll_spri.first());
  var testimg_sumr = ee.Image(imgcoll_sumr.first());
  var testimg_fall = ee.Image(imgcoll_fall.first());
  
  
  var testimg = testimg_fall;
  
  var testimg = ee.Image(ee.ImageCollection('LANDSAT/LC8_L1T_TOA')
    .filter(ee.Filter.lt('SUN_ELEVATION', 45))
    .filterBounds(selpoint)
    .map(function(i) { return i.resample('bicubic')})
    .select(['B6', 'B5', 'B3'], ['swir1', 'nir', 'green'])
    .toList(1,0).get(0));
  
  
  var hs = getDirectFactor(getSolarGeom(testimg), false, false);
  var nircorr = singleBandRotoCorr(testimg.select('nir'), hs, selpoint.buffer(bufferSize));
  var swircorr = singleBandRotoCorr(testimg.select('swir1'), hs, selpoint.buffer(bufferSize));
  var greencorr = singleBandRotoCorr(testimg.select('green'), hs, selpoint.buffer(bufferSize));
  var testimg_corr = ee.Image.cat([nircorr, swircorr, greencorr])
  
  var bg = ee.Image(1)
  Map.addLayer(bg, {palette:['ffffff']}, 'white')
  
  // // Map.addLayer(hs, null, 'HS');
  var viz= {bands:['swir1', 'nir', 'green'], min:0, max:0.4, gamma:0.9}
  Map.addLayer(testimg.clip(studyArea.bounds(1)), viz, 'Original');

  var dx = -7000
  // translate AOI
  studyArea = studyArea.transform('EPSG:3857', 1)

  var translated = studyArea.transform(studyArea.projection().translate(dx, 0), 1)
  var studyArea2 = ee.Geometry.LineString(translated.coordinates(), studyArea.projection())
  
  var translated = studyArea.transform(studyArea.projection().translate(dx*2, 0), 1)
  var studyArea3 = ee.Geometry.LineString(translated.coordinates(), studyArea.projection())

  var translated = studyArea.transform(studyArea.projection().translate(dx*3, 0), 1)
  var studyArea4 = ee.Geometry.LineString(translated.coordinates(), studyArea.projection())

  var translated = studyArea.transform(studyArea.projection().translate(dx*4, 0), 1)
  var studyArea5 = ee.Geometry.LineString(translated.coordinates(), studyArea.projection())

  var testimg_corrVis = testimg_corr
    .reproject('EPSG:3857')
    .translate(-dx, 0, 'meters').clip(studyArea2.bounds(1))
  Map.addLayer(testimg_corrVis, viz, 'Corrected');

  var hs = ee.Algorithms.Terrain(ned).select('hillshade')
  
  var hsVis = hs
    .reproject('EPSG:3857')
    .translate(-dx*2, 0, 'meters').clip(studyArea3.bounds(1))
  Map.addLayer(hsVis, {min:100, max:255, palette:['ffffff', '000000']}, 'hillshade')

  var ndwiOriginal = testimg.normalizedDifference(['green', 'nir'])
    .reproject('EPSG:3857')
    .translate(-dx*3, 0, 'meters').clip(studyArea4.bounds(1))
  Map.addLayer(ndwiOriginal, {min:-0.3, max:0.3}, 'Original (NDWI)');

  var ndwiCorrected = testimg_corr.normalizedDifference(['green', 'nir'])
    .reproject('EPSG:3857')
    .translate(-dx*4, 0, 'meters').clip(studyArea5.bounds(1))
  Map.addLayer(ndwiCorrected, {min:-0.3, max:0.3}, 'Corrected (NDWI)');
  
  
  var terrain = getTerrain();
  var flatmask = terrain.select('slope').eq(0);
  var slopemask = terrain.select('slope').gt(5); 
  
  var testband = 'nir';
  var testcorrimg = ee.Image.cat([
    testimg.select([testband],[testband+'_orig']), 
    testimg_corr.select([testband],[testband+'_corr'])
  ]);
  
  
  print("Flat areas",ui.Chart.image.histogram(testcorrimg.updateMask(flatmask), selpoint.buffer(10000), 30))
  print("Topographic areas",ui.Chart.image.histogram(testcorrimg.updateMask(slopemask), selpoint.buffer(10000), 30))
  
  
  /* Get scatter plot between illumination and reflectance */
  function getCorrScatter(compareimg, dirillum, poly){
    var img = ee.Image.cat(dirillum, compareimg).toArray()
    var result = ee.Image(img).reduceRegion(ee.Reducer.toList(), poly, 30);
    result = result.get('array');
    var array = ee.Array(result.getInfo());
    var xValues = array.slice(1, 0, 1).project([0]);
    var yValues = array.slice(1, 1, 3);
    // var yValues = array.slice(1, 1, 2);
    var chart = ui.Chart.array.values(yValues, 0, xValues);
    chart = chart.setOptions({
      'hAxis': {
        'title': "Illumination Factor",
      },
      'vAxis': {
        'title': 'Reflectance'
      }
    });
    print(chart);
  }
  
  print(testcorrimg)
  
  getCorrScatter(testcorrimg, hs, testpoint.buffer(bufferSize));
  
  Map.addLayer(testpoint.buffer(bufferSize))
  
  // Map.centerObject(selpoint,10)
  
  
  // add decorations
  var frame = new Frame(studyArea.bounds(1), {steps:3, size:3, format: '%.2f', showLeft: true, showTop: true}).draw()
  Map.addLayer(frame, {}, 'frame')
  
  var boundsImage = ee.Image().paint(ee.Geometry(studyArea2).bounds(1), 1, 1)
  Map.addLayer(boundsImage, {palette:['000000']}, 'bounds')
  var boundsImage = ee.Image().paint(ee.Geometry(studyArea3).bounds(1), 1, 1)
  Map.addLayer(boundsImage, {palette:['000000']}, 'bounds')
  var boundsImage = ee.Image().paint(ee.Geometry(studyArea4).bounds(1), 1, 1)
  Map.addLayer(boundsImage, {palette:['000000']}, 'bounds')
  var boundsImage = ee.Image().paint(ee.Geometry(studyArea5).bounds(1), 1, 1)
  Map.addLayer(boundsImage, {palette:['000000']}, 'bounds')

  var scale = Scalebar.draw(locationScalebar, {steps:2, palette: ['5ab4ac', 'f5f5f5'], multiplier: 1000, format: '%.1f', units: 'km'})
  Map.addLayer(scale, {}, 'scale')
  
  var labels = [-0.3, 0.3]
  var gradient = GradientBar.draw(locationGradientBar, {min: -0.3, max: 0.3, palette: ['000000', 'ffffff'], labels: labels, format: '%.1f'})
  Map.addLayer(gradient, {}, 'gradient bar (NDWI/NDSI)')
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
  var margins = ee.List([
    this.getMargin('horizontal', translate(ll, 0, this.marginSize), translate(lr, 0, this.marginSize), 15, 5, this.showBottom), // bottom
    this.getMargin('horizontal', ul, ur, 15, -35, this.showTop), // top
    this.getMargin('vertical', translate(ll, this.marginSize, 0), translate(ul, this.marginSize, 0), 73, -5, this.showLeft), // left
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
    var point = translate(pt1, p.multiply(-8), p.multiply(-15))
    var imageUnits = Text.draw(units, ee.Geometry.Point(point), scale, {
      fontSize:32, textColor: '000000', outlineColor: 'ffffff', outlineWidth: 2.5, outlineOpacity: 0.6})

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
        p.multiply(-35)
      )
      
      var imageLabel = Text.draw(markerText, ee.Geometry.Point(point), scale, {
        fontSize:32, textColor: '000000', outlineColor: 'ffffff', outlineWidth: 2.5, outlineOpacity: 0.6})
      
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
        p.multiply(-38)
      )
      
      var imageLabel = Text.draw(labelText, ee.Geometry.Point(point), scale, {
        fontSize:32, textColor: '000000'})

        //fontSize:18, textColor: 'ffffff', 
        //outlineColor: '000000', outlineWidth: 1.5, outlineOpacity: 0.6})
      
      images = images.add(imageLabel)
    })

    return ee.ImageCollection.fromImages(images).mosaic()
  },
}

app()