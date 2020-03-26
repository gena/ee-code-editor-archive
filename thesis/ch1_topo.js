/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var srtm = ee.Image("USGS/SRTMGL1_003"),
    testpoint = /* color: #d63000 */ee.Geometry.Point([-118.80889892578125, 34.49246843331577]),
    gallery_bounds = /* color: #d63000 */ee.Geometry.LineString(
        [[-118.77937316894531, 34.4575972631232],
         [-118.72255325317383, 34.52664145105956]]),
    gallery_scale = /* color: #98ff00 */ee.Geometry.LineString(
        [[-118.77456669119346, 34.51914557034834],
         [-118.75345227654338, 34.5190748507687]]),
    ned = ee.Image("USGS/NED"),
    hand1000 = ee.Image("users/gena/GlobalHAND/30m/hand-1000"),
    fa = ee.Image("users/gena/GlobalHAND/90m-global/fa"),
    hand5000 = ee.Image("users/gena/GlobalHAND/30m/hand-5000"),
    fa15 = ee.Image("WWF/HydroSHEDS/15ACC"),
    prior = ee.Image("users/gena/water-occurrence-Piru-2010-01-01_2017-01-01_5m"),
    gallery_bounds_PC = /* color: #d63000 */ee.Geometry.LineString(
        [[-120.17901420593262, 39.392560638560106],
         [-120.135498046875, 39.36827914916013]]),
    gallery_scale_PC = /* color: #98ff00 */ee.Geometry.LineString(
        [[-120.17639454498953, 39.37617434510392],
         [-120.16806820870517, 39.37617434510392]]),
    prior_PC = ee.Image("users/gena/water-occurrence-ProsserCreek"),
    testpoint_PC = /* color: #0b4a8b */ee.Geometry.Point([-120.16090393066406, 39.37876235830346]),
    scale_ndwi = /* color: #d63000 */ee.Geometry.LineString(
        [[-120.04451751708984, 39.3638996210395],
         [-120.01087188720703, 39.36562492247863]]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
// Piru
var dates = [
  '2015-02-12', '2015-12-29', '2016-01-14', '2016-02-15',
  '2013-11-05', '2013-11-21', '2014-01-08', '2014-01-24']
  
var columns = 4
var rows = 2

// Prosser Creek
var columns = 4
var rows = 3
dates = [
  '2016-09-24', '2016-02-13', '2016-02-29', '2016-03-16',
  '2015-10-08', '2015-11-09', '2014-10-21', '2014-11-22',
  '2014-01-22', '2014-02-23', '2013-10-02', '2013-12-05']
//gallery_bounds = gallery_bounds_PC
//gallery_scale = gallery_scale_PC
//testpoint = testpoint_PC
prior = prior_PC

var cutoff = { min: 0.05, max: 0.99 };

prior = prior.unmask().unitScale(cutoff.min, cutoff.max)

var ndwiMin = -0.5
var ndwiMax = 1

var Palettes = {
    water: ['f7fbff', 'deebf7', 'c6dbef', '9ecae1', '6baed6', '4292c6', '2171b5', '08519c', '08306b'],
    ndwi: ['ffffff', '000000']
    // ndwi: ['000000', 'ff0000', 'ffff00', 'ffffff'] // hot
};

function radians(img) { return img.toFloat().multiply(3.1415927).divide(180); }

function hillshade(az, ze, slope, aspect) {
  var azimuth = radians(ee.Image(az));
  var zenith = radians(ee.Image(ze));
  return azimuth.subtract(aspect).cos().multiply(slope.sin()).multiply(zenith.sin())
      .add(zenith.cos().multiply(slope.cos()));
}

function hillshadeit(image, elevation, weight, height_multiplier, azimuth, zenith) {
  var hsv  = image.unitScale(0, 255).rgbtohsv();

  var terrain = ee.Algorithms.Terrain(elevation.multiply(height_multiplier));
  var slope = radians(terrain.select(['slope']));

  var aspect = radians(terrain.select(['aspect'])).resample('bicubic');
  var hs = hillshade(azimuth, zenith, slope, aspect).resample('bicubic');
  
  Map.addLayer(slope, {}, 'slope', false)
  Map.addLayer(aspect, {}, 'apect', false)
  Map.addLayer(hs, {}, 'hs', false)

  var intensity = hs.multiply(weight).multiply(hsv.select('value'));
  var huesat = hsv.select('hue', 'saturation');

  return ee.Image.cat(huesat, intensity).hsvtorgb();
}




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

var dem = ned
//var dem = srtm

// Call DEM of choice, in this case SRTM 30m
// Swap this with other DEM if needed.
function getTerrain(){
  var terrain = ee.Algorithms.Terrain(dem);
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
    'scale':30,
    'tileScale':4,
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


function getLandsat(start, stop, startdoy, enddoy, region, maxSunElevation) {
  var bands = ['swir1', 'nir', 'blue'];
  var l8 = ee.ImageCollection('LANDSAT/LC8_L1T_TOA').filterDate(start, stop).select(['B6', 'B5', 'B2'], bands);
  var images = l8.filter(ee.Filter.dayOfYear(startdoy, enddoy))
    .filterBounds(region)
    //.filter(ee.Filter.lt('CLOUD_COVER', 25))

  if(maxSunElevation) {
    images = images
      .filter(ee.Filter.lt('SUN_ELEVATION', maxSunElevation))
  }

  images = images
    .sort('system:time_start');
    
  return images;
}



// var reg = ee.Geometry.Point(94.7955322265625, 29.47314131293348); //China
// var reg = ee.Geometry.Point(-117.01950056478381, 33.574693507887005); //Southern Cali
var start = ee.Date.fromYMD(2010,1,1);
var end = ee.Date.fromYMD(2018,1,1);

var selpoint = testpoint;

var imgcoll_wint = getLandsat(start, end, 1, 70, selpoint);
var imgcoll_spri = getLandsat(start, end, 70, 120, selpoint);
var imgcoll_sumr = getLandsat(start, end, 120, 150, selpoint);
var imgcoll_fall = getLandsat(start, end, 150, 250, selpoint, 60);

var testimg_wint = ee.Image(imgcoll_wint.first());
var testimg_spri = ee.Image(imgcoll_spri.first());
var testimg_sumr = ee.Image(imgcoll_sumr.first());
var testimg_fall = ee.Image(imgcoll_fall.first());

var testimg = testimg_fall;

var hs = getDirectFactor(getSolarGeom(testimg), false, false);
var nircorr = singleBandRotoCorr(testimg.select('nir'), hs, selpoint.buffer(3000));
var swircorr = singleBandRotoCorr(testimg.select('swir1'), hs, selpoint.buffer(3000));
var bluecorr = singleBandRotoCorr(testimg.select('blue'), hs, selpoint.buffer(3000));
var testimg_corr = ee.Image.cat([nircorr, swircorr, bluecorr])

Map.addLayer(selpoint.buffer(3000), {}, 'rotation area')

Map.addLayer(hs, {min: -0.1, max: 1}, 'hs')


// // Map.addLayer(hs, null, 'HS');
var viz= {bands:['swir1', 'nir', 'blue'], min:0, max:0.4, gamma:0.9}
Map.addLayer(testimg, viz, 'Original');
Map.addLayer(testimg_corr, viz, 'Corrected');

var whiteBackground = ee.Image(1).visualize({palette:['ffffff']})
Map.addLayer(whiteBackground, {}, 'white bg', true, 0.75)

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


// add DEM
var palette = ['d8b365', 'f5f5f5', '5ab4ac']
var demMin = 355
var demMax = 1500
Map.addLayer(dem, {palette: palette, min: demMin, max: demMax}, 'DEM', false)

var demWeight = 1.5 // dem vs hs
var heightMultiplier = 3
var demAzimuth = 0
var demZenith = 25
Map.addLayer(hillshadeit(dem.visualize({palette: palette, min: demMin, max: demMax}), dem, 
  demWeight, heightMultiplier, demAzimuth, demZenith), {}, 'DEM (hillshade)')



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

getCorrScatter(testcorrimg, hs, testpoint.buffer(800));

//Map.centerObject(selpoint,10)

































// ============================= generated: utils-text.js
var Text = {
    draw: function draw(text, pos, scale, props) {
        text = ee.String(text);

        var ascii = {};
        for (var i = 32; i < 128; i++) {
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
    this.getMargin('horizontal', translate(ll, 0, this.marginSize), translate(lr, 0, this.marginSize), 15, 5, true), // bottom
    this.getMargin('horizontal', ul, ur, 15, -25, false), // top
    this.getMargin('vertical', translate(ll, this.marginSize, 0), translate(ul, this.marginSize, 0), 55, -5, true), // left
    this.getMargin('vertical', lr, ur, -10, -5, false) // right
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
      fontSize:18, outlineColor: '000000', textColor: 'ffffff', outlineWidth: 3, outlineOpacity: 0.8})


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
    var widthTargetUnits = ee.Number(ur.get(0)).subtract(ee.Number(ll.get(0))).divide(10).floor().multiply(10)
    
    for(var i=0; i<steps+1; i++) {
      var markerText = widthTargetUnits.divide(steps * multiplier).multiply(i).format(format)
      
      var point = translate(
        pt0, 
        width.divide(steps).multiply(i).multiply(-1).add(p.multiply(10)), 
        p.multiply(-20)
      )
      
      var imageLabel = Text.draw(markerText, ee.Geometry.Point(point), scale, {
        fontSize:18, outlineColor: '000000', textColor: 'ffffff', outlineWidth: 3, outlineOpacity: 0.8})
      
      images = images.add(imageLabel)
    }

    return ee.ImageCollection.fromImages(images).mosaic()
  },
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
        labelOffset.multiply(-1).add(p.multiply(8)), 
        p.multiply(2)
      )
      
      var imageLabel = Text.draw(labelText, ee.Geometry.Point(point), scale, {
        fontSize:18, textColor: '000000', 
        outlineColor: 'ffffff', outlineWidth: 3, outlineOpacity: 0.6})
      
      images = images.add(imageLabel)
    })

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


function getEdge(mask) {
    var canny = ee.Algorithms.CannyEdgeDetector(mask, 0.99, 0);
    return canny.mask(canny);
}

// Return the DN that maximizes interclass variance in B5 (in the region).
var otsu = function otsu(histogram) {
    histogram = ee.Dictionary(histogram);

    var counts = ee.Array(histogram.get('histogram'));
    var means = ee.Array(histogram.get('bucketMeans'));
    var size = means.length().get([0]);
    var total = counts.reduce(ee.Reducer.sum(), [0]).get([0]);
    var sum = means.multiply(counts).reduce(ee.Reducer.sum(), [0]).get([0]);
    var mean = sum.divide(total);

    var indices = ee.List.sequence(1, size);

    // Compute between sum of squares, where each mean partitions the data.
    var bss = indices.map(function (i) {
        var aCounts = counts.slice(0, 0, i);
        var aCount = aCounts.reduce(ee.Reducer.sum(), [0]).get([0]);
        var aMeans = means.slice(0, 0, i);
        var aMean = aMeans.multiply(aCounts).reduce(ee.Reducer.sum(), [0]).get([0]).divide(aCount);
        var bCount = total.subtract(aCount);
        var bMean = sum.subtract(aCount.multiply(aMean)).divide(bCount);
        return aCount.multiply(aMean.subtract(mean).pow(2)).add(bCount.multiply(bMean.subtract(mean).pow(2)));
    });

    // Return the mean value corresponding to the maximum BSS.
    return means.sort(bss).get([-1]);
};

var debug = false



/***
 * Compute a threshold using Otsu method (bimodal)
 */
function computeThresholdUsingOtsu(image, scale, bounds, th, g, skipShort, weightGradient, minValue, usePrior) {
    // clip image edges
    var mask = image.mask().gt(0).focal_min(ee.Number(scale).multiply(3), 'circle', 'meters');

    // detect sharp changes
    var edge = ee.Algorithms.CannyEdgeDetector(image, th, g);
    edge = edge.multiply(mask);

    if(usePrior) {
      edge = edge.multiply(prior).updateMask(prior)
    }

    // take the largest changes, estimate gradient around edge and use that as a weight
    if (weightGradient) {
        var gradient = image.gradient().abs();
        var edgeGradient = gradient.select(0).max(gradient.select(1)).mask(edge.gt(th)).reproject(image.projection().scale(2, 2));

        // take the upper percentiles only
        var mode = ee.Number(ee.Dictionary(edgeGradient.reduceRegion(ee.Reducer.mode(), bounds, scale)).values().get(0));
        var σ = ee.Number(ee.Dictionary(edgeGradient.reduceRegion(ee.Reducer.stdDev(), bounds, scale)).values().get(0));
        var _buckets = 50;
        var significantEdgesMask = edgeGradient.gt(mode);

        edge = edge.updateMask(significantEdgesMask);

        if (debug) {
            // gradient around edges
            if (edgeGradient) {
                print(ui.Chart.image.histogram(edgeGradient, bounds, scale, _buckets));
                Map.addLayer(edgeGradient, {}, 'edge gradient', false);
                Map.addLayer(significantEdgesMask.mask(significantEdgesMask), {}, 'significant edges', false);

                print('Mode: ', mode);
                print('Sigma: ', σ);
                //Map.addLayer(edgeGradient.updateMask(significantEdgesMask), {min:0, max:mode.add(σ.multiply(2)), palette:['ffffff', 'ff0000']}, 'edge gradient, upper percentiles', false)
            }
        }
    }

    // advanced, detect edge lengths
    var coonnectedVis = void 0;
    if (skipShort) {
        var connected = edge.mask(edge).lt(0.8).connectedPixelCount(50, true);

        var edgeLong = connected.gte(50);

        edge = edgeLong;

        coonnectedVis = connected.updateMask(edgeLong).visualize({ palette: ['ffffff', 'ff0000'], min: 0, max: 50 });
    }

    // buffer around NDWI edges
    var edgeBuffer = edge.focal_max(ee.Number(scale).multiply(1), 'square', 'meters');
    var imageEdge = image.mask(edgeBuffer);

    // compute threshold using Otsu thresholding
    var buckets = 100;
    var hist = ee.Dictionary(ee.Dictionary(imageEdge.reduceRegion(ee.Reducer.histogram(buckets), bounds, scale)).values().get(0));

    var threshold = ee.Algorithms.If(hist.contains('bucketMeans'), otsu(hist), 0);
    threshold = ee.Number(threshold); //.add(0.05)

    if (debug) {
        Map.addLayer(edge.mask(edge), { palette: ['ff0000'] }, 'edges', false);

        if (skipShort) {
            Map.addLayer(coonnectedVis, {}, 'edges (connected)', false);
        }

        print('Threshold: ', threshold);

        print(ui.Chart.image.histogram(image, bounds, scale, buckets));
        print(ui.Chart.image.histogram(imageEdge, bounds, scale, buckets));
        Map.addLayer(mask.mask(mask), { palette: ['000000'] }, 'image mask', false);
    }

    return {
      threshold: minValue ? threshold.max(minValue) : threshold,
      edge: edge
    }
}

var handTh = 15 // hill tops

var hand = hand5000
// var hand = hand1000

function fillWater(i) {
  var i1 = i
    .focal_min(30, 'square', 'meters')
    .focal_max(15, 'square', 'meters')
  
  var edge = getEdge(i1)

  // estimate fill area (compute posterior)
  var occurrenceExpected = prior.mask(edge)
    .reduceRegion(ee.Reducer.intervalMean(15, 50), bounds, 15).values().get(0)
  
  
  occurrenceExpected = ee.Algorithms.If(
    ee.Algorithms.IsEqual(occurrenceExpected, null), 
    1, 
    occurrenceExpected)

  // when significant area is updated - use prior as an estimate, otherwise use original mask and only fill-in gaps
  
  var guess = prior.gt(ee.Image.constant(occurrenceExpected))
  
  var guessArea = guess.reduceRegion(ee.Reducer.sum(), bounds, 15).values().get(0)
  var totalArea = i.reduceRegion(ee.Reducer.sum(), bounds, 15).values().get(0)
  var updatedAreaFraction = ee.Number(guessArea).divide(totalArea)
  
  var posterior = ee.Algorithms.If(updatedAreaFraction.gt(1.5),  // 
    prior.gt(ee.Image.constant(occurrenceExpected)), // prior is the best guess
    //i) // no update
    prior.gt(ee.Image.constant(occurrenceExpected)).focal_min(30, 'circle', 'meters').or(i)) // fill-in gaps only

  // copy properties
  posterior = ee.Image(posterior)
    .copyProperties(i)
    .set('occurrence', occurrenceExpected)  
    .set('system:time_start', i.get('system:time_start'))
  
  return {
    area: ee.Algorithms.If(ee.Algorithms.IsEqual(occurrenceExpected, null), null, posterior),
    fraction: updatedAreaFraction
  }

  //return posterior
}


// generate image collection gallery
// BUG: the function is extremely messed up :)
var gallery = function(images, sortProperty, rows, columns, waterOtsu, waterBands, correctTopography, handOnly, handMask, usePrior, showWaterIndex, fillGaps, showRGB, skipThresholds, skipWaterEdge) {
  var count = ee.Number(columns * rows).min(images.size())

  // define offset list
  var pos = ee.List.sequence(0, count.subtract(1))
  
  var offsetsX = pos.map(function(i) { return ee.Number(i).mod(columns) })
  var offsetsY = pos.map(function(i) { return ee.Number(i).divide(columns).floor() })
  var offsets = offsetsX.zip(offsetsY)

  
  var imagesSorted = images
  
  // add cloud over area
  if(sortProperty === 'CLOUD_COVER_AOI') {
    images = images.map(function(i) {
      var cloudScore = ee.Dictionary(i.select('cloud').reduceRegion(ee.Reducer.median(), bounds, 300)).values().get(0)
      return i.set('CLOUD_COVER_AOI', cloudScore)
    })
  }

  if(sortProperty) {
    imagesSorted = images
      .sort(sortProperty)
      .limit(count) 
      .sort(sortProperty) // avoid GEE bug, call limit/sort twice
      .limit(count)
  } else {
    imagesSorted = images
      .limit(count)
  }

  var propId = 'system:id'
  
  var ids = ee.List(imagesSorted.aggregate_array(propId))
  var offsetByImage = ee.Dictionary.fromLists(ids, offsets)
  
  var wgs84 = ee.Projection('EPSG:4326')
  var web = ee.Projection('EPSG:3857')
  
  var boundsImage = ee.Image().toInt().paint(bounds, 1)
    .reproject(ee.Image(imagesSorted.first()).projection())

  var textScale = Map.getScale();
  var scaleFactor = ee.Number(textScale).divide(ee.Image().projection().nominalScale())
  var textBounds = bounds;

  var textMarginSize = 5; // scale units
  var textLocationCount = 10;
  var textLocationsLeft = getMarginLocations(textBounds, 'left', textMarginSize, textLocationCount, textScale);
  var pt1 = textLocationsLeft.get(1);

  var textMarginSize = 5; // scale units
  var textLocationCount = 10;
  var textLocationsLeft = getMarginLocations(textBounds, 'left', textMarginSize, textLocationCount, textScale);
  var pt1_1 = ee.Geometry.Point(translate(ee.Geometry(textLocationsLeft.get(9)).coordinates(), 0, scaleFactor.multiply(-10)));
  
  var textMarginSize = 5; // scale units
  var textLocationCount = 10;
  var textLocationsRight = getMarginLocations(textBounds, 'right', textMarginSize, textLocationCount, textScale);
  var pt2 = ee.Geometry.Point(translate(ee.Geometry(textLocationsRight.get(1)).coordinates(), scaleFactor.multiply(85), 0));

  var pt3 = ee.Geometry.Point(translate(ee.Geometry(textLocationsRight.get(9)).coordinates(), scaleFactor.multiply(50), scaleFactor.multiply(-10)));

  var correctionTrainingRegion = selpoint.buffer(3000)

  var mosaic = imagesSorted
    .map(function(i) {
    var offset = ee.List(offsetByImage.get(i.get(propId)))
    var xoff = ee.Number(w).multiply(offset.get(0))
    var yoff = ee.Number(h).multiply(offset.get(1))
  
    i = i
      //.resample('bicubic')
      .updateMask(boundsImage.multiply(i.mask()))

      
    if(typeof waterBands === 'undefined') {
      //waterBands = ['green', 'swir1']
      waterBands = ['green', 'nir']
    }

    if(correctTopography) {
      var hs = getDirectFactor(getSolarGeom(i), false, false);
      var swir1corr = singleBandRotoCorr(i.select('swir1'), hs, correctionTrainingRegion);
      var nircorr = singleBandRotoCorr(i.select('nir'), hs, correctionTrainingRegion);
      var greencorr = singleBandRotoCorr(i.select('green'), hs, correctionTrainingRegion);
      
      i = i.addBands(ee.Image.cat([swir1corr, nircorr, greencorr]), ['swir1', 'nir', 'green'], true)
    }

    var waterScore = i.normalizedDifference(waterBands)

    if(handMask) {
      waterScore = waterScore.mask(waterScore.mask().multiply(hand.lt(handTh)))
    } else {
      waterScore = waterScore.mask(waterScore.mask())
    }
    
    var th = 0
    var edge = ee.Image();

    var textGuessAreaFraction = ee.Image().visualize({forceRgbOutput: true})
    
    if(waterOtsu) {
      var o = computeThresholdUsingOtsu(waterScore, 30, bounds, 0.4, 0.5, false, false, -0.1, usePrior);
      th = o.threshold
      edge = o.edge.reproject(i.projection().scale(0.5, 0.5))
    }
    
    var waterMask = waterScore.gte(th)

    if(usePrior) {
      waterMask = waterMask.multiply(prior).gt(0)
      
      if(fillGaps) {
        var fill = fillWater(waterMask)
        waterMask = fill.area
    
        var str = ee.String('f=').cat(ee.Number(fill.fraction).format('%.2f'))
        
        textGuessAreaFraction = Text.draw(str, pt3, textScale, {
            outlineColor: '000000',
            outlineWidth: 3,
            outlineOpacity: 0.8,
            fontSize: 18,//16,
            textColor: 'white'
        })
      }
    }

    var waterEdge = getEdge(waterMask).focal_max(1)
    
    // area value text
    var a = ee.Image.pixelArea().mask(waterMask).reduceRegion(ee.Reducer.sum(), bounds, 15).values().get(0)
    
    var str = ee.String('A=').cat(ee.Number(a).multiply(0.0001).format('%.2f')).cat('ha')
    
    var textArea = Text.draw(str, pt1_1, textScale, {
        outlineColor: '000000',
        outlineWidth: 3,
        outlineOpacity: 0.8,
        fontSize: 18,//16,
        textColor: 'white'
    });

    // threshold value text
    var str = ee.String('th=').cat(ee.Number(th).format('%.2f'))
    
    var textThreshold = Text.draw(str, pt1, textScale, {
        outlineColor: '000000',
        outlineWidth: 3,
        outlineOpacity: 0.8,
        fontSize: 18,//16,
        textColor: 'white'
    });

    var str = i.date().format('YYYY-MM-dd')
    
    var textDate = Text.draw(str, pt2, textScale, {
        outlineColor: '000000',
        outlineWidth: 3,
        outlineOpacity: 0.8,
        fontSize: 18,//16,
        textColor: 'white'
    });
    
    if(handOnly) {
      return hand.mask(hand.gt(handTh)).visualize({min:handTh, max:1000})
        .updateMask(boundsImage)
        .translate(xoff, yoff, 'meters', web)
    }
    
    if(showWaterIndex) {
      return ee.ImageCollection.fromImages([
          waterScore.visualize({min:ndwiMin, max:ndwiMax, palette: Palettes.ndwi}),
          textDate,
          boundsOutline
        ]).mosaic().translate(xoff, yoff, 'meters', web)
    }
    
    var imageVis = i.visualize({min:0.04, max:0.4})
    
    if(showRGB) {
      imageVis = i.visualize({bands:['red', 'green', 'blue'], min:0.04, max:0.4})
    }
    
    waterMask = ee.Image(waterMask)
    
    if(skipWaterEdge) {
      var waterEdgeVis = ee.Image().visualize({forceRgbOutput: true})
      var waterMaskVis = ee.Image().visualize({forceRgbOutput: true})
      var textArea = ee.Image().visualize({forceRgbOutput: true})
    } else {
      var waterEdgeVis = waterEdge.mask(waterEdge).visualize({palette:['de2d26'], forceRgbOutput: true})
      var waterMaskVis = waterMask.mask(waterMask).visualize({palette:['0000ff'], opacity:0.3, forceRgbOutput: true})
    }
    
    if(skipThresholds) {
      textThreshold = ee.Image().visualize({forceRgbOutput: true})
    }
    
    return ee.ImageCollection.fromImages([
        imageVis,
        //waterScore.visualize({min:-0.5, max:0.5, forceRgbOutput: true}),
        //i.select('cloud').mask(i.select('cloud').divide(50)).visualize({palette:['ffff00']}),
        //edge.mask(edge).visualize({palette:['ff0000'], forceRgbOutput: true}),
        //ee.Image(1).mask(i.select(0).mask().multiply(hand.gt(handTh))).visualize({palette:['000000'], opacity:0.6, forceRgbOutput: true}),
        //waterEdge.mask(waterEdge).visualize({palette:['ffffff'], forceRgbOutput: true}),
        //waterEdge.mask(waterEdge).visualize({palette:['0000ff'], forceRgbOutput: true}),
        waterMaskVis,
        waterEdgeVis,
        //waterEdge.mask(waterEdge).visualize({palette:['3182bd'], forceRgbOutput: true}),
        textArea,
        textThreshold,
        textDate,
        boundsOutline,
        textGuessAreaFraction
      ]).mosaic().translate(xoff, yoff, 'meters', web)
  }).mosaic()
  
  return mosaic;
}




var scale = Map.getScale()
var error = ee.ErrorMargin(scale)
var bounds = gallery_bounds.bounds()
var boundsOutline = ee.Image().paint(bounds, 1, 3).visualize({palette:['ffffff'], forceRgbOutput: true}).reproject('EPSG:3857', null, Map.getScale())
var boundsMap = gallery_bounds.transform(ee.Projection('EPSG:3857'), error).bounds(error, ee.Projection('EPSG:3857'))
var boundsImage = ee.Image().paint(bounds, 1, 2).reproject('EPSG:3857', null, Map.getScale())
var coords = ee.List(boundsMap.coordinates().get(0))

var w = ee.Number(ee.List(coords.get(1)).get(0)).subtract(ee.List(coords.get(0)).get(0))
var h = ee.Number(ee.List(coords.get(2)).get(1)).subtract(ee.List(coords.get(0)).get(1))

Map.addLayer(boundsOutline)

function addCloudScore(i) {
  return ee.Algorithms.Landsat.simpleCloudScore(i)
}

function addAny(i) {
  return i.set('any', i.select(0).mask().reduceRegion(ee.Reducer.anyNonZero(), bounds).values().get(0))
}

var bands = ['swir1', 'nir', 'green', 'red', 'blue', 'cloud']
var l8 = new ee.ImageCollection('LANDSAT/LC8_L1T_TOA').map(addCloudScore).select(['B6', 'B5', 'B3', 'B4', 'B2', 'cloud'], bands);
var l7 = new ee.ImageCollection('LANDSAT/LE7_L1T_TOA').map(addCloudScore).select(['B5', 'B4', 'B2', 'B3', 'B1', 'cloud'], bands);
var l5 = new ee.ImageCollection('LANDSAT/LT5_L1T_TOA').map(addCloudScore).select(['B5', 'B4', 'B2', 'B3', 'B1', 'cloud'], bands);
var l4 = new ee.ImageCollection('LANDSAT/LT4_L1T_TOA').map(addCloudScore).select(['B5', 'B4', 'B2', 'B3', 'B1', 'cloud'], bands);

//var images = ee.ImageCollection(l4.merge(l5).merge(l7).merge(l8))
//var images = ee.ImageCollection(l4.merge(l5).merge(l8))
//var images = ee.ImageCollection(l7.merge(l8))
var images = l8
//var images = l5
  .filterBounds(bounds.centroid(100))
  .map(addAny)
  .filter(ee.Filter.eq('any', 1))
  .filterDate('2013-01-01', '2017-01-01')
  .filter(ee.Filter.lt('SUN_ELEVATION', 50))
  
if(dates) {
  images = images  
    .filter(ee.Filter.inList('DATE_ACQUIRED', dates))
}

images = images  
  .limit(rows*columns)
  

print(images.first())

var waterBands = ['green', 'nir']


// rgb
var handOnly = false
var handMask = false
var usePrior = false
var showWaterIndex = false
var fillGaps = false
var showRGB = true
var skipThresholds = true
var skipWaterEdge = true
var gallery1 = gallery(images, 'system:start_time', rows, columns, true, waterBands, correctTopography, handOnly, handMask, usePrior, showWaterIndex, fillGaps, showRGB, skipThresholds, skipWaterEdge)
Map.addLayer(gallery1, {}, '0. sorted by time (RGB)', true)

// swir1/nir/green
var showRGB = false
var gallery1 = gallery(images, 'system:start_time', rows, columns, true, waterBands, correctTopography, handOnly, handMask, usePrior, showWaterIndex, fillGaps, showRGB, skipThresholds, skipWaterEdge)
Map.addLayer(gallery1, {}, '0. sorted by time (SWIR/NIR/GREEN)', true)

// NDWI=0
var correctTopography = false
var image1 = gallery(images, 'system:start_time', rows, columns, false, waterBands, correctTopography)
Map.addLayer(image1, {}, '1. sorted by time', true)

var handOnly = false
var handMask = false
var usePrior = false
var showWaterIndex = true
var gallery1 = gallery(images, 'system:start_time', rows, columns, true, waterBands, correctTopography, handOnly, handMask, usePrior, showWaterIndex)
Map.addLayer(gallery1, {}, '1. sorted by time (NDWI)', true)

var handOnly = false
var handMask = false
var usePrior = false
var showWaterIndex = true
var correctTopography = true
var gallery1 = gallery(images, 'system:start_time', rows, columns, true, waterBands, correctTopography, handOnly, handMask, usePrior, showWaterIndex)
Map.addLayer(gallery1, {}, '1. sorted by time (NDWI, topo)', true)

var handOnly = false
var handMask = false
var usePrior = false
var showWaterIndex = true
var correctTopography = false
var gallery1 = gallery(images, 'system:start_time', rows, columns, true, ['green', 'swir1'], correctTopography, handOnly, handMask, usePrior, showWaterIndex)
Map.addLayer(gallery1, {}, '1. sorted by time (MNDWI)', true)

var gallery2 = gallery(images, 'system:start_time', rows, columns, true, waterBands, correctTopography)
Map.addLayer(gallery2, {}, '2. sorted by time (Otsu)', true)

var correctTopography = true
var gallery1 = gallery(images, 'system:start_time', rows, columns, false, waterBands, correctTopography)
Map.addLayer(gallery1, {}, '3. sorted by time (topo)', true)

var gallery2 = gallery(images, 'system:start_time', rows, columns, true, waterBands, correctTopography)
Map.addLayer(gallery2, {}, '4. sorted by time (topo, Otsu)', true)

var handOnly = false
var handMask = true
var gallery1 = gallery(images, 'system:start_time', rows, columns, true, waterBands, correctTopography, handOnly, handMask)
Map.addLayer(gallery1, {}, '5. sorted by time (topo, Otsu, HAND)', true)


var handOnly = false
var handMask = true
var usePrior = true
var gallery1 = gallery(images, 'system:start_time', rows, columns, true, waterBands, correctTopography, handOnly, handMask, usePrior)
Map.addLayer(gallery1, {}, '5. sorted by time (topo, Otsu, HAND, prior)', true)

var handOnly = false
var handMask = true
var usePrior = true
var fillGaps = true
var showWaterIndex = false
var gallery1 = gallery(images, 'system:start_time', rows, columns, true, waterBands, correctTopography, handOnly, handMask, usePrior, showWaterIndex, fillGaps)
Map.addLayer(gallery1, {}, '5. sorted by time (topo, Otsu, HAND, prior, fill)', true)


var handOnly = false
var handMask = true
var usePrior = true
var correctTopography = false
var gallery1 = gallery(images, 'system:start_time', rows, columns, true, waterBands, correctTopography, handOnly, handMask, usePrior)
Map.addLayer(gallery1, {}, '5. sorted by time (Otsu, HAND, prior)', true)

var handOnly = false
var handMask = true
var usePrior = true
var fillGaps = true
var showWaterIndex = false
var correctTopography = false
var gallery1 = gallery(images, 'system:start_time', rows, columns, true, waterBands, correctTopography, handOnly, handMask, usePrior, showWaterIndex, fillGaps)
Map.addLayer(gallery1, {}, '5. sorted by time (Otsu, HAND, prior, fill)', true)


var handOnly = false
var handMask = false
var usePrior = true
var correctTopography = false
var gallery1 = gallery(images, 'system:start_time', rows, columns, true, waterBands, correctTopography, handOnly, handMask, usePrior)
Map.addLayer(gallery1, {}, '5. sorted by time (Otsu, prior)', true)

var handOnly = false
var handMask = false
var usePrior = true
var fillGaps = true
var showWaterIndex = false
var correctTopography = false
var gallery1 = gallery(images, 'system:start_time', rows, columns, true, waterBands, correctTopography, handOnly, handMask, usePrior, showWaterIndex, fillGaps)
Map.addLayer(gallery1, {}, '5. sorted by time (Otsu, prior, fill)', true)

var handOnly = false
var handMask = false
var usePrior = true
var correctTopography = true
var gallery1 = gallery(images, 'system:start_time', rows, columns, true, waterBands, correctTopography, handOnly, handMask, usePrior)
Map.addLayer(gallery1, {}, '5. sorted by time (topo, Otsu, prior)', true)

var handOnly = false
var handMask = true
var correctTopography = false
var gallery1 = gallery(images, 'system:start_time', rows, columns, true, waterBands, correctTopography, handOnly, handMask)
Map.addLayer(gallery1, {}, '6. sorted by time (Otsu, HAND)', true)

var handOnly = false
var handMask = true
var usePrior = true
var correctTopography = false
var gallery1 = gallery(images, 'system:start_time', rows, columns, true, waterBands, correctTopography, handOnly, handMask, usePrior)
Map.addLayer(gallery1, {}, '6. sorted by time (Otsu, HAND, prior)', true)

var handOnly = false
var handMask = true
var usePrior = true
var correctTopography = false
var showWaterIndex = false
var fillGaps = true
var gallery1 = gallery(images, 'system:start_time', rows, columns, true, waterBands, correctTopography, handOnly, handMask, usePrior, showWaterIndex, fillGaps)
Map.addLayer(gallery1, {}, '6. sorted by time (Otsu, HAND, prior, fill)', true)

var handOnly = true
var correctTopography = true
var gallery1 = gallery(images, 'system:start_time', rows, columns, false, waterBands, correctTopography, handOnly)
Map.addLayer(gallery1, {}, '7. hand mask', true)

var frame = new Frame(gallery_bounds.bounds(), {steps:3, size:2, format: '%.2f'}).draw()
Map.addLayer(frame, {}, 'frame')

var scalebar = Scalebar.draw(gallery_scale, {steps:1, palette: ['5ab4ac', 'f5f5f5'], format: '%.0f'})
Map.addLayer(scalebar, {}, 'scale')

var labels = [-0.5, 0, 1]
var gradient = GradientBar.draw(scale_ndwi, {min: ndwiMin, max: ndwiMax, palette: Palettes.ndwi, labels: labels, format: '%.1f'})
Map.addLayer(gradient, {}, 'gradient bar (NDWI)')

Map.addLayer(hand.mask(hand.gt(handTh)), {min:handTh, max:1000}, 'hill tops', false)

var faPalette = ['eff3ff', 'bdd7e7', '6baed6', '3182bd', '08519c']
Map.addLayer(fa.mask(fa.gt(100)), {min:100, max:50000, palette:faPalette}, 'fa > 100', false)

Map.addLayer(fa15.mask(fa15.gt(10)), {min:10, max:5000, palette:faPalette}, 'fa15 > 10', false)



var image = ee.ImageCollection.fromImages([
  whiteBackground,
  image1,
  frame,
  scalebar
]).mosaic()

var name = 'ProsserCreekReservoir-NDWI0.png'
Export.image.toDrive({
    image: image,
    description: name,
    fileNamePrefix: name,
    region: Map.getBounds(true), scale: 15
});
