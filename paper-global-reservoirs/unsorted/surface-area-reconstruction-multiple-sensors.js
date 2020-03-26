/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var aoi = /* color: d63000 */ee.Geometry.Polygon(
        [[[-120.13781547546387, 39.37504697058432],
          [-120.13326644897461, 39.37929311183573],
          [-120.13824462890625, 39.38287559262373],
          [-120.13978944325117, 39.38479941281629],
          [-120.1413345336914, 39.389774667175914],
          [-120.14897346496582, 39.39037167040836],
          [-120.1517630200903, 39.38635855593795],
          [-120.16176223754883, 39.389907335002306],
          [-120.16674041013675, 39.38771853899016],
          [-120.17480850219727, 39.39083600272453],
          [-120.17789843439749, 39.391764637908786],
          [-120.1768684387207, 39.38712125767802],
          [-120.17077445983887, 39.38141608560946],
          [-120.1620302615708, 39.37926011043577],
          [-120.15843618830496, 39.37750176036189],
          [-120.16484137400715, 39.37584315724959],
          [-120.17287723584599, 39.37677189069475],
          [-120.17206192016602, 39.373454601030474],
          [-120.16356468200684, 39.36701840406483],
          [-120.15412330627441, 39.37060151475313],
          [-120.15176325507196, 39.37723632094731],
          [-120.14828681945801, 39.37703738145347],
          [-120.14463920832839, 39.37640716332671]]]),
    ned = ee.Image("USGS/NED");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
/***
 * Surface water detection and reconstruction using multiple sensors:
 *  + Landsat 4 (30m)
 *  + Landsat 5 (30m)
 *  + Landsat 7 (15-30m)
 *  + Landsat 8 (15-30m)
 *  - Sentinel 1 (SAR, ~10-30m)
 *  + Sentinel 2 (10-20m)
 *  + ASTER (15m multispectral and 90m thermal)
 *  - PROBA-V (100m and 333m)
 *  - MODIS (250m Terra and Aqua)
 * 
 * Author: Gennadii Donchyts
 * Credits: Ian Housman, Karis Tenneson, Carson Stam, Matt Hancher
 * 
 */ 


var start = '1984-01-01'
//var start = '1996-07-15'
var stop = '2018-01-01'

//var development = true
var development = false

// number of processed images to add for inspection (water detection, count per asset)
var mapLayerCountToAddProcessed = development ? 1 : 0

// number of rendered frames to added before video export
var mapLayerCountToAddRendered = development ? 0 : 1

var debug = true
//var debug = false

//var renderWater = false
var renderWater = true

var errorMargin = Map.getScale()
print('Error margin: ', errorMargin)

var scale = 30

//aoi = ee.Geometry(Map.getBounds(true)).centroid(1)
//aoi = ee.Geometry(Map.getBounds(true)).bounds()
//aoi = ee.Geometry(Map.getBounds(true)).centroid(errorMargin).buffer(Map.getScale() * 200, ee.ErrorMargin(errorMargin))

// when true - use permanent water mask to zoom in to the reservoir within AOI area
//var usePermanentWaterMask = false
var usePermanentWaterMask = true

// where to perform analysis (focal area), defined around permanent water / AOI
var focusSearchDistance = 500
var focusSmoothDistance = 1000

var only = [
  //'ASTER',
  //'Landsat 8',
  //'Landsat 7',
  //'Landsat 5',
  //'Landsat 4',
  //'Sentinel 2', 
  //'ASTER T',
  //'PROBA-V 100m', 
  //'PROBA-V 333m', 
  //'MODIS Aqua MYD09GQ',
  //'MODIS Terra MOD09GQ',
  //'Sentinel 1 VV', 
  //'Sentinel 1 VH', 
  //'Sentinel 1 VV+VH',
  //'Sentinel 1 HH+HV', 
]

var skip = [
  'ASTER T',
  //'ASTER'
  //'Landsat 8',  
  //'Landsat 7',
  //'Landsat 5',
  //'Landsat 4',
  //'Sentinel 2', 
  'PROBA-V 100m', 
  'PROBA-V 333m', 
  'MODIS Aqua MYD09GQ',
  'MODIS Terra MOD09GQ',
  //'Sentinel 1 VV', 
  //'Sentinel 1 VH',  // too noisy
  //'Sentinel 1 VV+VH',
  //'Sentinel 1 HH+HV', 
]

var Palettes = {
  water: ['eff3ff', 'c6dbef', '9ecae1', '6baed6', '3182bd', '08519c']
}

// permanent water mask
var glcf = ee.ImageCollection('GLCF/GLS_WATER')
var waterMaskPermanent = glcf.map(function(i) { return i.eq(2) }).sum().gt(0)
  
if(usePermanentWaterMask) {
  var waterMaskPermanentVector = waterMaskPermanent.mask(waterMaskPermanent)
    .reduceToVectors({geometry: aoi.buffer(focusSearchDistance), scale: errorMargin})
    //.filter(ee.Filter.gt('label', 0)) // skip background
    
} else {
  var waterMaskPermanentVector = ee.FeatureCollection([aoi.buffer(focusSearchDistance)])
}

var waterPermanentCenter = waterMaskPermanentVector.geometry().centroid(30).buffer(180)
  .intersection(waterMaskPermanentVector.geometry(), ee.ErrorMargin(errorMargin));

var focusNearWaterVector = aoi.buffer(focusSearchDistance)

if(usePermanentWaterMask) {
  // focus around permanent water
  var nearWater = waterMaskPermanent.clip(focusNearWaterVector)
    .focal_max(focusSearchDistance, 'circle', 'meters')
    .distance(ee.Kernel.euclidean(focusSmoothDistance, 'meters'), false)
  
  nearWater = ee.Image(focusSmoothDistance).subtract(nearWater).divide(focusSmoothDistance)
    .unmask()
  
  var focusNearWater = nearWater.reproject('EPSG:3857', null, 120)
} else {
  // focus near user-defined AOI
  var focusNearWater = ee.Image().float().paint(focusNearWaterVector, 1).unmask()
}

var b = Map.getBounds()
print('Map w/h ratio: ', (b[2] - b[0])/(b[3]-b[1]))

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

function getEdge(mask) {
  var canny = ee.Algorithms.CannyEdgeDetector(mask, 0.99, 0);
  return canny.mask(canny)
}

// rescales to given ranges
var rescale = function(img, exp, thresholds) {
  return img.expression(exp, {img: img}).subtract(thresholds[0]).divide(thresholds[1] - thresholds[0]);
};


// used as aside function for debugging
var show = function(image, name, vis) {
  if(development && debug) {
    Map.addLayer(image, vis || {}, '  ' + name, false)
  }
  
  return image
}

// Return the DN that maximizes interclass variance in B5 (in the region).
var otsu = function(histogram) {
  histogram = ee.Dictionary(histogram)
  
  var counts = ee.Array(histogram.get('histogram'));
  var means = ee.Array(histogram.get('bucketMeans'));
  var size = means.length().get([0]);
  var total = counts.reduce(ee.Reducer.sum(), [0]).get([0]);
  var sum = means.multiply(counts).reduce(ee.Reducer.sum(), [0]).get([0]);
  var mean = sum.divide(total);
  
  var indices = ee.List.sequence(1, size);
  
  // Compute between sum of squares, where each mean partitions the data.
  var bss = indices.map(function(i) {
    var aCounts = counts.slice(0, 0, i);
    var aCount = aCounts.reduce(ee.Reducer.sum(), [0]).get([0]);
    var aMeans = means.slice(0, 0, i);
    var aMean = aMeans.multiply(aCounts)
        .reduce(ee.Reducer.sum(), [0]).get([0])
        .divide(aCount);
    var bCount = total.subtract(aCount);
    var bMean = sum.subtract(aCount.multiply(aMean)).divide(bCount);
    return aCount.multiply(aMean.subtract(mean).pow(2)).add(
           bCount.multiply(bMean.subtract(mean).pow(2)));
  });
  
  // Return the mean value corresponding to the maximum BSS.
  return means.sort(bss).get([-1]);
};

/***
 * Anisotrophic diffusion (Perona-Malik filter). * Solves diffusion equation numerically using convolution:
 * I(n+1, i, j) = I(n, i, j) + lambda * (cN * dN(I) + cS * dS(I) + cE * dE(I), cW * dW(I))
 */
var removeSpeckleNoisePeronaMalik = function(I, iter, K, opt_method) {
  var method = opt_method || 1;
  
  var dxW = ee.Kernel.fixed(3, 3,
                           [[ 0,  0,  0],
                            [ 1, -1,  0],
                            [ 0,  0,  0]]);
  
  var dxE = ee.Kernel.fixed(3, 3,
                           [[ 0,  0,  0],
                            [ 0, -1,  1],
                            [ 0,  0,  0]]);
  
  var dyN = ee.Kernel.fixed(3, 3,
                           [[ 0,  1,  0],
                            [ 0, -1,  0],
                            [ 0,  0,  0]]);
  
  var dyS = ee.Kernel.fixed(3, 3,
                           [[ 0,  0,  0],
                            [ 0, -1,  0],
                            [ 0,  1,  0]]);

  var lambda = 0.2;

  var k1 = ee.Image(-1.0/K);
  var k2 = ee.Image(K).multiply(ee.Image(K));

  for(var i = 0; i < iter; i++) {
    var dI_W = I.convolve(dxW)
    var dI_E = I.convolve(dxE)
    var dI_N = I.convolve(dyN)
    var dI_S = I.convolve(dyS)

    switch(method) {
      case 1:
        var cW = dI_W.multiply(dI_W).multiply(k1).exp();
        var cE = dI_E.multiply(dI_E).multiply(k1).exp();
        var cN = dI_N.multiply(dI_N).multiply(k1).exp();
        var cS = dI_S.multiply(dI_S).multiply(k1).exp();
    
        I = I.add(ee.Image(lambda).multiply(cN.multiply(dI_N).add(cS.multiply(dI_S)).add(cE.multiply(dI_E)).add(cW.multiply(dI_W))))
        break;
      case 2:
        var cW = ee.Image(1.0).divide(ee.Image(1.0).add(dI_W.multiply(dI_W).divide(k2)));
        var cE = ee.Image(1.0).divide(ee.Image(1.0).add(dI_E.multiply(dI_E).divide(k2)));
        var cN = ee.Image(1.0).divide(ee.Image(1.0).add(dI_N.multiply(dI_N).divide(k2)));
        var cS = ee.Image(1.0).divide(ee.Image(1.0).add(dI_S.multiply(dI_S).divide(k2)));
    
        I = I.add(ee.Image(lambda).multiply(cN.multiply(dI_N).add(cS.multiply(dI_S)).add(cE.multiply(dI_E)).add(cW.multiply(dI_W))))
        break;
    }
  }

  return I;
}


/***
 * Detect cloud shadow by projection cloud (casting) using sun elevation/azimuth.
 * Example: https://code.earthengine.google.com/702e270c6f8a4d09cea2a027a49d3e2f
 * 
 * θ - zenith, degrees
 * φ - azimuth, degrees
 */
function findCloudShadow(cloudMask, cloudHeight, φ, θ) {
  cloudHeight = ee.Number(cloudHeight);

  // convert to radians
  var π = Math.PI
  θ  = ee.Number(0.5).multiply(π).subtract(ee.Number(θ).multiply(π).divide(180.0))
  φ = ee.Number(φ).multiply(π).divide(180.0).add(ee.Number(0.5).multiply(π))

  // compute shadow offset (vector length)
  var offset = θ.tan().multiply(cloudHeight); 
  
  // compute x, y components of the vector
  var proj = cloudMask.projection();
  var nominalScale = proj.nominalScale();
  var x = φ.cos().multiply(offset).divide(nominalScale).round();
  var y = φ.sin().multiply(offset).divide(nominalScale).round();
  
  return cloudMask
    .changeProj(proj, proj.translate(x, y))
    .set('height', cloudHeight);
}

function castShadows(az, zen, cloud) {
  //Find the shadows
  var shadows = cloudHeights.map(function(cloudHeight) { 
    return findCloudShadow(cloud, cloudHeight, az, zen) 
  })

  return shadows;
}

function projectClouds(az, zen, cloudScore, cloudThreshold) {
  var cloudMask = cloudScore.lt(cloudThreshold).not();
  
  var cloudMaskBuffer = cloudMask
    .focal_min(50, 'circle', 'meters')
    .focal_max(250, 'circle', 'meters')
    .reproject(cloudScore.projection())
    
  cloudMaskBuffer = cloudMaskBuffer.mask(cloudMaskBuffer);

  var shadows = ee.ImageCollection(castShadows(az, zen, cloudMaskBuffer)).max();
  
  shadows = shadows.updateMask(cloudMask.not())  // remove clouds

  if(development && debug) {
    Map.addLayer(shadows,
      {min:0, max:0.4, opacity: 0.7, palette:['092d25','03797b', '59f3f5', 'acf9fa']}, 
      'shadows2.max - cloud > 0.1', false)
  }
  
  return shadows
}

// =============================================================
//Set up possible cloud heights in meters
var cloudHeights = ee.List.sequence(100, 2000, 200);

/***
 * Filters feature collection to filterCollection
 */
function filterToIntersection(featureCollection, filterCollection) {
    return featureCollection.map(function(f) { 
      return f.set('intersects', f.intersects(filterCollection.geometry(ee.ErrorMargin(errorMargin)), ee.ErrorMargin(errorMargin)))
    })
    .filter(ee.Filter.eq('intersects', true))  
} 

/***
 * Filters feature collection to filterCollection using maximum intersection fraction
 */
function filterToMaximumAreaFraction(featureCollection, filterCollection) {
    var features = featureCollection.map(function(f) { 
      var intersection = f.intersection(filterCollection.geometry(ee.ErrorMargin(errorMargin)), ee.ErrorMargin(errorMargin))
      return f.set('area_fraction', intersection.area(ee.ErrorMargin(errorMargin)).divide(f.area(ee.ErrorMargin(errorMargin))))
    })

    return features.filter(ee.Filter.gt('area_fraction', 0.4))  
} 

/***
 * Function for finding dark outliers in time series, masks pixels that are dark, and dark outliers.
 * 
 */
function simpleTDOM2(c, zShadowThresh, irSumThresh, dilatePixels){
  var shadowSumBands = ['nir','swir1'];
  
  //Get some pixel-wise stats for the time series
  var irStdDev = c.select(shadowSumBands).reduce(ee.Reducer.stdDev());
  var irMean = c.select(shadowSumBands).mean();
  
  //Mask out dark dark outliers
  c = c.map(function(img){
    var z = img.select(shadowSumBands).subtract(irMean).divide(irStdDev);
    var irSum = img.select(shadowSumBands).reduce(ee.Reducer.sum());
    var m = z.lt(zShadowThresh).reduce(ee.Reducer.sum()).eq(2).and(irSum.lt(irSumThresh)).not();
    m = m.focal_min(dilatePixels);

    return img.addBands(m.rename('TDOMMask'));
  });
  
  return c;
}

/***
 * Basic cloud shadow shift.
 */
function projectShadows(cloudMask, TDOMMask, image, meanAzimuth, meanZenith, cloudHeights, dilatePixels) {
  //Find dark pixels
  var darkPixels = image.select(['nir','swir1','swir2']).reduce(ee.Reducer.sum()).lt(irSumThresh);//.gte(1);
  
  //Get scale of image
  var nominalScale = cloudMask.projection().nominalScale();

  // Find where cloud shadows should be based on solar geometry
  
  //Convert to radians
  var azR =ee.Number(meanAzimuth).multiply(Math.PI).divide(180.0).add(ee.Number(0.5).multiply(Math.PI ));
  var zenR  =ee.Number(0.5).multiply(Math.PI ).subtract(ee.Number(meanZenith).multiply(Math.PI).divide(180.0));
  
  // Find the shadows
  var shadows = cloudHeights.map(function(cloudHeight){
    cloudHeight = ee.Number(cloudHeight);
    
    var shadowCastedDistance = zenR.tan().multiply(cloudHeight);//Distance shadow is cast
    var x = azR.cos().multiply(shadowCastedDistance).divide(nominalScale).round();//X distance of shadow
    var y = azR.sin().multiply(shadowCastedDistance).divide(nominalScale).round();//Y distance of shadow
    return cloudMask.changeProj(cloudMask.projection(), cloudMask.projection().translate(x, y));
  });

  var shadow = ee.ImageCollection.fromImages(shadows).max();
 
  // Create shadow mask
  shadow = shadow.updateMask(shadow.mask().and(cloudMask.mask().not()));
  shadow = shadow.focal_max(dilatePixels);
  shadow = shadow.updateMask(shadow.mask().and(darkPixels).and(TDOMMask));

  return shadow;
}

/***
 * Function for wrapping cloud and shadow masking together 
 * Assumes image has cloud mask band called "cloudMask" and a TDOM mask called "TDOMMask"
 * If TDOM is not being used, TDOMMask just needs to be a constant raster band with value 1
 */ 
function cloudProject(img,dilatePixels,cloudHeights,azimuthField,zenithField){
  
  //Get the cloud mask
  var cloud = img.select('cloudMask').not();
  cloud = cloud.focal_max(dilatePixels);
  cloud = cloud.updateMask(cloud);
  
  //Get TDOM mask
  var TDOMMask = img.select(['TDOMMask']).not();
  
  //Project the shadow finding pixels inside the TDOM mask that are dark and inside the expected area given the solar geometry
  var shadow = projectShadows(cloud,TDOMMask,img, img.get(azimuthField),img.get(zenithField),cloudHeights,dilatePixels);
  
  //Combine the cloud and shadow masks
  var combinedMask = cloud.mask().or(shadow.mask()).eq(0);
  
  //Update the image's mask and return the image
  img = img.updateMask(img.mask().and(combinedMask));
  img = img.addBands(combinedMask.rename(['cloudShadowMask']));
 
  return img;
}

/***
 * Makes offset from the left bounds Geometry margin and splits into count pieces, returns locations.
 */
function getLeftMarginLocations(bounds, marginSize, count, scale) {
  var leftMarginSize = ee.Number(marginSize).multiply(scale)
  var boundsSmall = bounds.buffer(leftMarginSize.multiply(-1)).bounds()
  var coords = ee.List(boundsSmall.coordinates().get(0))
  var pt0 = ee.List(coords.get(0))
  var pt3 = ee.List(coords.get(3))
  var leftMarginLine = ee.Geometry.LineString([pt0, pt3])

  var distances = ee.List.sequence(0, leftMarginLine.length(), leftMarginLine.length().divide(count))
  
  var lineToFirstPoint = function(g) { 
    var coords = ee.Geometry(g).coordinates().get(0)
    return ee.Feature(ee.Algorithms.GeometryConstructors.Point(coords))
  }
  
  var points = ee.FeatureCollection(leftMarginLine.cutLines(distances).geometries().map(lineToFirstPoint))
  
  // Map.addLayer(points, {color: 'green'}, 'text locations')
  
  return points.toList(10).map(function(o) { return ee.Feature(o).geometry() })
}

/***
 * Compute a threshold using Otsu method (bimodal)
 */
function computeThresholdUsingOtsu(image, scale, bounds, th, g, skipShort, weightGradient, minValue) {
  // clip image edges
  var mask = image.mask().gt(0).focal_min(ee.Number(scale).multiply(3), 'circle', 'meters')

  // detect sharp changes
  var edge = ee.Algorithms.CannyEdgeDetector(image, th, g);
  edge = edge.multiply(mask)
  
  // take the largest changes, estimate gradient around edge and use that as a weight
  if(weightGradient) {
    var gradient = image.gradient().abs()
    var edgeGradient = gradient.select(0).max(gradient.select(1)).mask(edge.gt(th))
      .reproject(image.projection().scale(2, 2))

    // take the upper percentiles only
    var scale2 = ee.Number(scale).multiply(2)
    var mode = ee.Number(ee.Dictionary(edgeGradient.reduceRegion(ee.Reducer.mode(), bounds, scale2)).values().get(0))
    var σ = ee.Number(ee.Dictionary(edgeGradient.reduceRegion(ee.Reducer.stdDev(), bounds, scale2)).values().get(0))
    var buckets = 50
    var significantEdgesMask = edgeGradient.gt(mode)

    edge = edge.updateMask(significantEdgesMask)
  }

  // advanced, detect edge lengths
  if(skipShort) {
    var connected = edge.mask(edge).lt(0.8).connectedPixelCount(50, true)
    
    var edgeLong = connected.gte(50)
    
    edge = edgeLong
    
    var coonnectedVis = connected.updateMask(edgeLong).visualize({palette:['ffffff', 'ff0000'], min:0, max:50})
  }
  
  // buffer around NDWI edges
  var edgeBuffer = edge.focal_max(ee.Number(scale).multiply(1), 'square', 'meters');
  var imageEdge = image.mask(edgeBuffer)
  
  // compute threshold using Otsu thresholding
  var buckets = 100
  var hist = ee.Dictionary(ee.Dictionary(imageEdge.reduceRegion(ee.Reducer.histogram(buckets), bounds, scale)).values().get(0))

  var threshold = ee.Algorithms.If(hist.contains('bucketMeans'), otsu(hist), 0.3);
  threshold = ee.Number(threshold)//.add(0.05)

  if(development && debug) {
    Map.addLayer(edge.mask(edge), {palette:['ff0000']}, 'edges', false)

    if(skipShort) {
      Map.addLayer(coonnectedVis, {}, 'edges (connected)', false)
    }

    print('Threshold: ', threshold)
  
    print(ui.Chart.image.histogram(image, bounds, scale, buckets))
    print(ui.Chart.image.histogram(imageEdge, bounds, scale, buckets))
    Map.addLayer(mask.mask(mask), {palette:['000000']}, 'image mask', false)

    // gradient around edges
    if(edgeGradient) {
      print(ui.Chart.image.histogram(edgeGradient, bounds, scale2, buckets))
      Map.addLayer(edgeGradient, {}, 'edge gradient', false)
      Map.addLayer(significantEdgesMask.mask(significantEdgesMask), {}, 'significant edges', false)
      
      print('Mode: ', mode)
      print('Sigma: ', σ)
      //Map.addLayer(edgeGradient.updateMask(significantEdgesMask), {min:0, max:mode.add(σ.multiply(2)), palette:['ffffff', 'ff0000']}, 'edge gradient, upper percentiles', false)
    }
  }

  return minValue ? threshold.max(minValue) : threshold;
}

var ProbaV = {}

/***
 * PROBA-V time offset is stored in TIME band, extract it and update system:time_start
 */
ProbaV.correctTime = function(image) {
  var bounds = ee.Geometry(image.get('bounds'))
  // add offset stored in TIME band and return as system:time_start      
  var time = image.get('system:time_start')
  var offset = image.select('time').reduceRegion(ee.Reducer.first(), aoi.centroid(90), 90).values().get(0)
  
  var timeActual = ee.Algorithms.If(ee.Algorithms.IsEqual(offset, null),
    time,
    ee.Date(time).advance(offset, 'minute').millis()
  )

  return image.set('system:time_start', timeActual)
}

ProbaV.detectClouds = function(image) {
  return image
}
  
ProbaV.detectSnow = function(image) {
  return image  
}
  
ProbaV.detectWater = function(image, info) {
  return image
}

var Landsat = {}

/**
 * Compute a cloud score. Tuned for Landsat sensor.
 */
Landsat.cloudScore = function(img, opt_skipBlue) {
  // Compute several indicators of cloudyness and take the minimum of them.
  var score = ee.Image(1.0);
  
  // Clouds are reasonably bright in the blue band.
  score = score.min(rescale(img, 'img.blue', [0.1, 0.3])).aside(show, 'score blue')

  // Clouds are reasonably bright in all visible bands.
  score = score.min(rescale(img, 'img.red + img.green + img.blue', [0.3, 0.8])).aside(show, 'score vis')

  // Clouds are reasonably bright in all infrared bands.
  score = score.min(rescale(img, 'img.nir + img.swir + img.swir2', [0.3, 0.8])).aside(show, 'score ir')

  // Clouds are reasonably cool in temperature.
  score = score.min(rescale(img, 'img.temp', [293, 268])).aside(show, 'score temp')

  // However, clouds are not snow.
  //var ndsi = img.normalizedDifference(['red', 'swir']);
  //score = score.min(rescale(ndsi, 'img', [0.2, 0.0])).aside(show, 'score ndsi')
  
  var ndsi = img.normalizedDifference(['green', 'swir']);
  return score.min(rescale(ndsi, 'img', [0.8, 0.6]));

  return score;
};

/**
 * Compute a snow score.
 */
Landsat.snowScore = function(img, opt_bands) {
  // Compute several indicators of snowyness and take the minimum of them.
  var score = ee.Image(1.0)
  
  // Snow is reasonably bright in the blue band.
  score = score.min(rescale(img, 'img.blue', [0.1, 0.3])).aside(show, 'score blue')

  // Snow is reasonably bright in all visible bands.
  score = score.min(rescale(img, 'img.red + img.green + img.blue', [0.2, 0.8])).aside(show, 'score vis')

  // Excluded this for snow reasonably bright in all infrared bands.
  score = score.min(rescale(img, 'img.nir + img.swir + img.swir2', [0.2, 0.4])).aside(show, 'score ir')

  // Snow is reasonably cool in temperature.
  // start from 0C
  score = score.min(rescale(img, 'img.temp', [300, 273.15])).aside(show, 'score temp')

  // Snow is high in ndsi.
  var ndsi = img.normalizedDifference(['red', 'swir']);
  ndsi = rescale(ndsi, 'img', [0.3, 0.5]);
  score = score.min(ndsi).aside(show, 'score ndsi').aside(show, 'score ndsi')

  return rescale(score.clamp(0, 0.5), 'img', [0, 0.5]).toFloat()
}

Landsat.vegetationScore = function(i) {
  var ndvi = i.normalizedDifference(['nir', 'red']).rename('ndvi');
  return rescale(ndvi, 'img.ndvi', [0.3, 0.5])
}

Landsat.maskClouds = function(img) { 
  var cloudThreshold = 0.5 // lower - more clouds 
  return cloudScore(img).gt(Landsat.cloudThreshold).rename(['cloud'])
};

Landsat.maskSnow = function(img){
  var snowThresh = 0.5; //Lower number masks more out (0-1)
  return snowScore(img).gt(Landsat.snowThresh).rename(['snow'])
  //return img.mask(img.mask().and(ss.lt(snowThresh)))
}

/***
 * Compute a water score using MNDWI and a few additional bands.
 */
Landsat.waterScore2 = function(img){
  // Compute several indicators of water and take the minimum of them.
  var score = ee.Image(1.0);
  
  //Set up some params
  var darkBands = ['green','red','nir','swir2','swir'];//,'nir','swir','swir2'];
  var brightBand = 'blue';
  var shadowSumBands = ['nir','swir','swir2'];

  //Water tends to be dark
  var sum = img.select(shadowSumBands).reduce(ee.Reducer.sum());
  var sum = rescale(sum,'img',[0.35,0.2]).clamp(0,1)
  score = score.min(sum)
  
  //It also tends to be relatively bright in the blue band
  var mean = img.select(darkBands).reduce(ee.Reducer.mean());
  var std = img.select(darkBands).reduce(ee.Reducer.stdDev());
  var z = (img.select([brightBand]).subtract(std)).divide(mean)
  z = rescale(z,'img',[0,1]).clamp(0,1)
  score = score.min(z)
  
  // Water is at or above freezing
  score = score.min(rescale(img, 'img.temp', [273, 275]));

  // Water is nigh in ndsi
  var ndsi = img.normalizedDifference(['red', 'swir']);
  ndsi = rescale(ndsi, 'img', [0.3, 0.8]);

  score = score.min(ndsi);
  
  return score.clamp(0,1)
}

/***
 * Compute a water score using NDWI only
 */
Landsat.waterScore = function(image, bands) {
  return image.normalizedDifference(['green', 'swir'])
}

Landsat.onLayerAdd = function(image, info) {
  var snow = Landsat.snowScore(image);
  Map.addLayer(snow.mask(snow), {palette:['000000', 'FFFF00'], min:0, max:1}, ' snow score', false);

  var clouds = Landsat.cloudScore(image);
  Map.addLayer(clouds.mask(clouds.unitScale(0.15, 0.25)), {palette:['000000', 'FF0000'], min:0, max:1}, 'cloud score', false);

  var vegetation = Landsat.vegetationScore(image);
  Map.addLayer(vegetation.mask(vegetation), {palette:['000000', '00FF00'], min:0, max:1}, 'vegetation score', false);

  var cloudThreshold = 0.35
  var az = ee.Number(image.get('SUN_AZIMUTH'))
  var zen = ee.Number(image.get('SUN_ELEVATION'))
  var cloudShadows = projectClouds(az, zen, clouds, cloudThreshold)

  var waterScore = Landsat.waterScore2(image)
  //waterScore = rescale(waterScore, 'img', [-0.2, 0.35])
  //waterScore = waterScore.mask(waterScore)
  Map.addLayer(waterScore, {palette: Palettes.water}, 'water score (all bands)', false)

  // NDWI
  var waterScore = image.resample('bicubic').normalizedDifference(['green', 'nir'])
  //var waterScore = rescale(waterScore, 'img', [-0.2, 0.35])
  //waterScore = waterScore.mask(waterScore)
  
  Map.addLayer(waterScore, {palette: Palettes.water}, 'water score (NDWI)', false)

  // MNDWI
  var waterScore = image.normalizedDifference(['green', 'swir'])
  //waterScore = rescale(waterScore, 'img', [-0.2, 0.35])
  //waterScore = waterScore.mask(waterScore)
  Map.addLayer(waterScore, {palette: Palettes.water}, 'water score (MNDWI)', false)

  var i = waterScore
    // .updateMask(cloudShadows.mask().not().and(clouds.lt(cloudThreshold)).multiply(focusNearWater))
    .updateMask(clouds.lt(cloudThreshold).multiply(focusNearWater))
    .clip(aoi)

  var th = computeThresholdUsingOtsu(i, 30, aoi, 0.3, 2, false, false)
  
  var water = i.gte(ee.Image.constant(th))
  Map.addLayer(water.mask(water), {}, 'water mask (NDWI)', false)

  var waterVector = water.mask(water).reduceToVectors({geometry: focusNearWaterVector, scale: errorMargin})
  waterVector = filterToIntersection(waterVector, waterMaskPermanentVector)

  Map.addLayer(waterVector, {color:'blue'}, 'water mask', false, 0.6)
  
  print(Landsat.detectWater(image, info))
}

Landsat.detectWater = function(image, info) {
  var snow = Landsat.snowScore(image);
  var clouds = Landsat.cloudScore(image);
  var vegetation = Landsat.vegetationScore(image);

  var waterScore = image.resample('bicubic').normalizedDifference(['green', 'nir'])
  //var waterScore = image.resample('bicubic').normalizedDifference(['green', 'swir'])

  var cloudThreshold = 0.2
  var snowThreshold = 0.5
  var cloudMask = clouds.gte(cloudThreshold)
  var snowMask = snow.gte(snowThreshold)
  
  var i = waterScore
    .updateMask(cloudMask.not().and(snowMask.not()).multiply(focusNearWater))
    .clip(aoi)

  var th = computeThresholdUsingOtsu(i, 30, aoi, 0.3, 2, false, false)
  
  var water = i.gte(ee.Image.constant(th))
  
  water = water.focal_max(15, 'circle', 'meters')

  var waterVector = water.mask(water).reduceToVectors({geometry: focusNearWaterVector, scale: errorMargin})
  waterVector = filterToIntersection(waterVector, waterMaskPermanentVector)

  var az = ee.Number(image.get('SUN_AZIMUTH'))
  var zen = ee.Number(image.get('SUN_ELEVATION'))
  var cloudShadows = projectClouds(az, zen, clouds, cloudThreshold)
  
  var mask = ee.ImageCollection(image.bandNames().map(function(b) { return image.select([b]).mask().rename('mask') })).product()

  return ee.FeatureCollection(waterVector.copyProperties(image))
    .set('nodata_pixels', ee.Dictionary(mask.not().reduceRegion(ee.Reducer.sum(), waterMaskPermanentVector, scale)).values().get(0))
    .set('cloud_pixels', ee.Dictionary(cloudMask.reduceRegion(ee.Reducer.sum(), waterMaskPermanentVector, scale)).values().get(0))
    .set('cloud_shadow_pixels', ee.Dictionary(cloudShadows.reduceRegion(ee.Reducer.sum(), waterMaskPermanentVector, scale)).values().get(0))
    .set('snow_pixels', ee.Dictionary(snowMask.reduceRegion(ee.Reducer.sum(), waterMaskPermanentVector, scale)).values().get(0))
    .set('water_threshold', th)
}

Landsat.detectClouds = function(image) {
  return image
}

Landsat.detectSnow = function(image) {
  return image  
}
  
var Sentinel2 = {}

/***
 * Cloud masking algorithm for Sentinel2.
 */
Sentinel2.cloudScore = function(img) {
  // Compute several indicators of cloudyness and take the minimum of them.
  var score = ee.Image(1);
  
  // Clouds are reasonably bright in the blue and cirrus bands.
  score = score.min(rescale(img, 'img.blue', [0.1, 0.5])).aside(show, 'score blue')
  score = score.min(rescale(img, 'img.coastal', [0.1, 0.3])).aside(show, 'score coastal')
  score = score.min(rescale(img, 'img.coastal + img.cirrus', [0.15, 0.2])).aside(show, 'score cirrus')
  
  // Clouds are reasonably bright in all visible bands.
  score = score.min(rescale(img, 'img.red + img.green + img.blue', [0.2, 0.8])).aside(show, 'score visible')

  // Clouds are reasonably bright in all infrared bands.
  // score = score.min(rescale(img, 'img.nir2+img.nir + img.swir + img.swir2', [0.3, 0.4]));
  // Map.addLayer(img.select('cb').add(img.select('cirrus')),{'min':0.15,'max':0.25},'cbCirrusSum')
  // Map.addLayer(img.select('cirrus'),{'min':0,'max':0.1},'cirrus')
  // score = score.min(rescale(img, 'img.cirrus', [0.06, 0.09]))
  
  // score = score.max(rescale(img, 'img.cb', [0.4, 0.6]))
  // score = score.min(rescale(img,'img.re1+img.re2+img.re3',[0.6,2]))
  // Map.addLayer(rescale(img,'img.re1+img.re2+img.re3',[0.6,2]),{'min':0,'max':1},'re1')
  // Clouds are reasonably cool in temperature.
  // score = score.min(rescale(img, 'img.temp', [300, 290]));

  // However, clouds are not snow.
  var ndsi = img.normalizedDifference(['red', 'swir']);
  // Map.addLayer(ndsi,{'min':0.6,'max':0.8},'ndsi')
  // score=score.min(rescale(ndsi, 'img', [0.8, 0.6]))

  return score;
}

Sentinel2.onLayerAdd = function(image, info) {
  image = image
    .unitScale(info.unitScale[0], info.unitScale[1])
    .copyProperties(image)
    
  image = ee.Image(image)    

  //var snow = Landsat.snowScore(image2);
  //Map.addLayer(snow.mask(snow), {palette:['000000', 'FFFF00'], min:0, max:1}, ' snow score', false);

  var clouds = Sentinel2.cloudScore(image);
  Map.addLayer(clouds.mask(clouds), {palette:['000000', 'FF0000'], min:0, max:1}, 'cloud score', false);

  //var vegetation = Sentinel2.vegetationScore(image2);
  //Map.addLayer(vegetation.mask(vegetation), {palette:['000000', '00FF00'], min:0, max:1}, 'vegetation score', false);

  var cloudThreshold = 0.1
  var az = ee.Number(image.get('MEAN_SOLAR_AZIMUTH_ANGLE'))
  var zen = ee.Number(image.get('MEAN_SOLAR_ZENITH_ANGLE'))
  var cloudShadows = projectClouds(az, zen, clouds, cloudThreshold)
  
  // MNDWI (20m)
  var waterScore = image.normalizedDifference(['green', 'swir'])
  //waterScore = rescale(waterScore, 'img', [-0.2, 0.35])
  //waterScore = waterScore.mask(waterScore)
  Map.addLayer(waterScore, {palette: Palettes.water}, 'water score (MNDWI)', false)

  // NDWI (10m)
  var waterScore = image.resample('bicubic').normalizedDifference(['green', 'nir'])
  //var waterScore = rescale(waterScore, 'img', [-0.2, 0.35])
  //waterScore = waterScore.mask(waterScore)
  
  Map.addLayer(waterScore, {palette: Palettes.water}, 'water score (NDWI)', false)

  var i = waterScore
    // .updateMask(cloudShadows.mask().not().and(clouds.lt(cloudThreshold)).multiply(focusNearWater))
    .updateMask(clouds.lt(cloudThreshold).multiply(focusNearWater))
    .clip(aoi)

  var th = computeThresholdUsingOtsu(i, 30, aoi, 0.3, 2, false, false)

  var water = i.gte(ee.Image.constant(th))
  Map.addLayer(water.mask(water), {}, 'water mask (NDWI)', false)

  var waterVector = water.mask(water).reduceToVectors({geometry: aoi.buffer(focusSearchDistance), scale: errorMargin})
  waterVector = filterToIntersection(waterVector, waterMaskPermanentVector)

  Map.addLayer(waterVector, {color:'blue'}, 'water mask', false, 0.6)
}

Sentinel2.detectClouds = function(image) {
  return image
}
  
Sentinel2.detectSnow = function(image) {
  return image  
}
  
Sentinel2.detectWater = function(image, info) {
  image = image
    .unitScale(info.unitScale[0], info.unitScale[1])
    .copyProperties(image)
    
  image = ee.Image(image)    

  var clouds = Sentinel2.cloudScore(image);

  var waterScore = image.resample('bicubic').normalizedDifference(['green', 'nir'])

  var cloudThreshold = 0.1
  var cloudMask = clouds.gte(cloudThreshold)
  var i = waterScore
    .updateMask(cloudMask.not().multiply(focusNearWater))
    .clip(aoi)

  var th = computeThresholdUsingOtsu(i, 30, aoi, 0.3, 2, false, false)

  var water = i.gte(ee.Image.constant(th))

  var waterVector = water.mask(water).reduceToVectors({geometry: aoi.buffer(focusSearchDistance), scale: errorMargin})
  waterVector = filterToIntersection(waterVector, waterMaskPermanentVector)

  var az = ee.Number(image.get('MEAN_SOLAR_AZIMUTH_ANGLE'))
  var zen = ee.Number(image.get('MEAN_SOLAR_ZENITH_ANGLE'))
  var cloudShadows = projectClouds(az, zen, clouds, cloudThreshold)

  var mask = ee.ImageCollection(image.bandNames().map(function(b) { return image.select([b]).mask().rename('mask') })).product()

  return ee.FeatureCollection(waterVector.copyProperties(image))
    .set('nodata_pixels', ee.Dictionary(mask.not().reduceRegion(ee.Reducer.sum(), waterMaskPermanentVector, scale)).values().get(0))
    .set('cloud_pixels', ee.Dictionary(cloudMask.reduceRegion(ee.Reducer.sum(), waterMaskPermanentVector, scale)).values().get(0))
    .set('cloud_shadow_pixels', ee.Dictionary(cloudShadows.reduceRegion(ee.Reducer.sum(), waterMaskPermanentVector, scale)).values().get(0))
    .set('snow_pixels', ee.Dictionary(cloudMask.reduceRegion(ee.Reducer.sum(), waterMaskPermanentVector, scale)).values().get(0))
    .set('water_threshold', th)
}


var Aster = {}

Aster.temperatureFromDN = function(image) {
  //var bands = ['B10',  'B11',   'B12',   'B13',   'B14']
  var bands = ['temp', 'temp2', 'temp3', 'temp4', 'temp5']
  var multiplier = ee.Image([0.006822, 0.006780, 0.006590, 0.005693, 0.005225])
  var k1 = ee.Image([3040.136402, 2482.375199, 1935.060183, 866.468575, 641.326517])
  var k2 = ee.Image([1735.337945, 1666.398761, 1585.420044, 1350.069147, 1271.221673])

  var radiance = image.select(bands).subtract(1).multiply(multiplier)
  var t = k2.divide(k1.divide(radiance).add(1).log())
  
  return t.rename(bands)
}

/**
 * Compute a cloud score.
 */
Aster.cloudScore = function(img, opt_skipBlue) {
  // Compute several indicators of cloudyness and take the minimum of them.
  var score = ee.Image(1.0);
  
  // TODO: compute reflectance and add other bands
  
  // Clouds are reasonably bright in all visible bands.
  score = score.min(rescale(img, '(img.red + img.green)/2', [0.5, 1.0])).aside(show, 'score vis')

  // Clouds are reasonably bright in all infrared bands.
  //score = score.min(rescale(img, 'img.nir', [0.7, 1.0])).aside(show, 'score ir')

  // Clouds are reasonably cool in temperature.
  var t = Aster.temperatureFromDN(img.multiply(255))
  //score = score.min(rescale(t, 'img.temp2', [300, 273.15])).aside(show, 'score temp')
  score = score.min(rescale(t, 'img.temp2', [293, 268])).aside(show, 'score temp')

  // However, clouds are not snow.
  //var ndsi = img.normalizedDifference(['red', 'swir']);
  //score = score.min(rescale(ndsi, 'img', [0.8, 0.6])).aside(show, 'score ndsi')

  return score;
};

/**
 * Compute a snow score.
 */
Aster.snowScore = function(img, opt_bands) {
  // Compute several indicators of snowyness and take the minimum of them.
  var score = ee.Image(1.0)
  
  // Snow is reasonably bright in all visible bands.
  score = score.min(rescale(img, 'img.red + img.green', [0.3, 0.8])).aside(show, 'score vis')

  // Excluded this for snow reasonably bright in all infrared bands.
  score = score.min(rescale(img, 'img.nir', [0.3, 0.7])).aside(show, 'score ir')

  // Snow is reasonably cool in temperature.
  // start from 0C
  var t = Aster.temperatureFromDN(img.multiply(255))
  score = score.min(rescale(t, 'img.temp2', [300, 273.15])).aside(show, 'score temp')

  // Snow is high in ndsi.
  // TODO: generate reflectance or at least radiance
  //Map.addLayer(img.select('red'), {}, 'red', false)
  //Map.addLayer(img.select('nir'), {}, 'nir', false)
  //var ndsi = img.normalizedDifference(['red', 'nir']);
  //Map.addLayer(ndsi, {}, 'ndsi', false)
  //score = score.min(rescale(ndsi, 'img', [-1, -0.5])).aside(show, 'score ndsi')

  return score
}

Aster.detectClouds = function(image) {
  return image
}
  
Aster.detectSnow = function(image) {
  return image  
}

// ASTER water detection from temperature band-only  
Aster.detectWater = function(image, info) {
  image = image
    .unitScale(info.unitScale[0], info.unitScale[1]) // TODO: fix temperature
    .copyProperties(image)
    
  image = ee.Image(image)    
    
  var snow = Aster.snowScore(image);

  var clouds = Aster.cloudScore(image);

  var waterScore = image.resample('bicubic').normalizedDifference(['green', 'nir'])

  var cloudThreshold = 0.1
  var snowThreshold = 0.4
  var cloudMask = clouds.gte(cloudThreshold)
  var snowMask = snow.gte(snowThreshold)
  var i = waterScore
    .updateMask(cloudMask.not().and(snowMask.not()).multiply(focusNearWater))
    .clip(aoi)
    
  var th = computeThresholdUsingOtsu(i, 30, aoi, 0.3, 1, true, false)

  var water = i.gte(ee.Image.constant(th))

  var waterVector = water.mask(water).reduceToVectors({geometry: focusNearWaterVector, scale: errorMargin})
  waterVector = filterToMaximumAreaFraction(waterVector, waterMaskPermanentVector)

  var cloudThreshold = 0.1
  var az = ee.Number(image.get('SOLAR_AZIMUTH'))
  var zen = ee.Number(image.get('SOLAR_ELEVATION'))
  var cloudShadows = projectClouds(az, zen, clouds, cloudThreshold)

  var mask = ee.ImageCollection(image.bandNames().map(function(b) { return image.select([b]).mask().rename('mask') })).product()

  return ee.FeatureCollection(waterVector.copyProperties(image))
    .set('nodata_pixels', ee.Dictionary(mask.not().reduceRegion(ee.Reducer.sum(), waterMaskPermanentVector, scale)).values().get(0))
    .set('cloud_pixels', ee.Dictionary(cloudMask.reduceRegion(ee.Reducer.sum(), waterMaskPermanentVector, scale)).values().get(0))
    .set('cloud_shadow_pixels', ee.Dictionary(cloudShadows.reduceRegion(ee.Reducer.sum(), waterMaskPermanentVector, scale)).values().get(0))
    .set('snow_pixels', ee.Dictionary(snowMask.reduceRegion(ee.Reducer.sum(), waterMaskPermanentVector, scale)).values().get(0))
    .set('water_threshold', th)
}

Aster.onLayerAdd = function(image, info) {
  image = image
    .unitScale(info.unitScale[0], info.unitScale[1]) // TODO: fix temperature
    .copyProperties(image)
    
  image = ee.Image(image)    
    
  var snow = Aster.snowScore(image);
  Map.addLayer(snow.mask(snow), {palette:['000000', 'FFFF00'], min:0, max:1}, 'snow score', false);
  
  var clouds = Aster.cloudScore(image);
  Map.addLayer(clouds.mask(clouds), {palette:['000000', 'FF0000'], min:0, max:1}, 'cloud score', false);
  
  var cloudThreshold = 0.1
  var snowThreshold = 0.4
  var az = ee.Number(image.get('SOLAR_AZIMUTH'))
  var zen = ee.Number(image.get('SOLAR_ELEVATION'))
  var cloudShadows = projectClouds(az, zen, clouds, cloudThreshold)

  var vegetation = Landsat.vegetationScore(image);
  Map.addLayer(vegetation.mask(vegetation), {palette:['000000', '00FF00'], min:0, max:1}, 'vegetation score', false);
  
  // NDWI
  var waterScore = image.resample('bicubic').normalizedDifference(['green', 'nir'])
  //var waterScore = rescale(waterScore, 'img', [-0.2, 0.35])
  //waterScore = waterScore.mask(waterScore)

  Map.addLayer(waterScore, {palette: Palettes.water}, 'water score (NDWI)', false)
  
  Map.addLayer(cloudShadows.mask().not(), {}, 'cloud shadows mask', false)

  var i = waterScore
    //.updateMask(cloudShadows.mask().not().and(clouds.lt(cloudThreshold)).multiply(focusNearWater))
    .updateMask(clouds.lt(cloudThreshold).multiply(focusNearWater))
    .clip(aoi)
  
  var th = computeThresholdUsingOtsu(i, 15, aoi, 0.3, 1, true, false, -0.1)

  var water = i.gte(ee.Image.constant(th))
  Map.addLayer(water.mask(water), {}, 'water mask (NDWI)', false)

  var waterVector = water.mask(water).reduceToVectors({geometry: focusNearWaterVector, scale: errorMargin})
  //waterVector = filterToIntersection(waterVector, analysisExtent)
  waterVector = filterToMaximumAreaFraction(waterVector, waterMaskPermanentVector)

  Map.addLayer(waterVector, {color:'blue'}, 'water mask', false, 0.6)
}

var AsterT = {}

AsterT.onLayerAdd = function(image, info) {
  var water = AsterT.detectWater(image.select('temp'), info)

  var waterEdge = water.subtract(water.focal_min(1))

  water = ee.ImageCollection([
    water.mask(water).visualize({palette:['5050ff'], opacity: 0.2}),
    waterEdge.mask(waterEdge).visualize({palette:['ffffff'], opacity: 0.9})
    ]).mosaic()
    
  Map.addLayer(water.mask(water), {}, 'water', false)
}

AsterT.detectWater = function(image, info) {
  image = image.updateMask(focusNearWater).resample('bicubic')

  var t = image.select('temp')

  var clipEdges = false
  //var clipEdges = true
  var th = computeThresholdUsingOtsu(t, 90, aoi, 0.9, 4, clipEdges, false)

  // compute mode in the most probable center of the water and assume this value as water
  var mode = ee.Number(ee.Dictionary(t.reduceRegion(ee.Reducer.mode(), 
    waterPermanentCenter, errorMargin * 5)).get('temp'))

  if(development && debug) {
    print('Mode:', mode)
  }

  // detect water by taking mode and otsu threshold into account  
  var water = ee.Algorithms.If(ee.Algorithms.IsEqual(mode, null), ee.Image().byte(), 
    t.gt(th).multiply(mode.gt(th))
      .add(t.lte(th).multiply(mode.lte(th)))
  )
  
  water = ee.Image(water)
  
  // vectorize
  var waterVector = water.mask(water).reduceToVectors({geometry: focusNearWaterVector, scale: errorMargin})
  
  // filter to overlaps met permanent water center
  //waterVector = filterToIntersection(waterVector, ee.FeatureCollection([waterPermanentCenter]))
  waterVector = filterToMaximumAreaFraction(waterVector, waterMaskPermanentVector)

  water = ee.Image(0).byte().paint(waterVector, 1).rename('water')
  
  return water
}

var Sentinel1 = {}

Sentinel1.detectWater = function(image, info) {
  image = image.select(0)
  
  // remove bad pixel by detecting low entropy areas
  var glcm = image.multiply(10).toInt().glcmTexture({size: 4});
  var lowEntropy = glcm.select(0).lt(0.1)
  image = image.updateMask(lowEntropy)

  var K = 4.5//3.5
  var iterations = 10
  var method = 1

  image = image.clip(aoi)

  image = removeSpeckleNoisePeronaMalik(image, iterations, K, method)

  var scale = image.projection().nominalScale()

  var clipEdges = false
  var th = computeThresholdUsingOtsu(image.select(0), scale, aoi, 0.6, 2, clipEdges, true)

  // detect water by taking darker pixels
  var water = image.lt(th)
  
  // vectorize
  var waterVector = water.mask(water).reduceToVectors({geometry: focusNearWaterVector, scale: errorMargin})
  
  // filter to overlaps met permanent water center
  waterVector = filterToMaximumAreaFraction(waterVector, waterMaskPermanentVector)
  
  // take the largest
  waterVector = ee.Feature(waterVector.map(function(f) {
    return f.set('area', f.geometry().area(ee.ErrorMargin(scale)))
  }).sort('area', false).first())

  water = ee.Image(0).byte().paint(waterVector, 1).rename('water')
    .max(lowEntropy.not().clip(waterVector.convexHull(ee.ErrorMargin(errorMargin)))) // fill-in smooth areas within detected water

  waterVector = water.mask(water).reduceToVectors({geometry: focusNearWaterVector, scale: errorMargin})

  var mask = ee.ImageCollection(image.bandNames().map(function(b) { return image.select([b]).mask().rename('mask') })).product()

  return ee.FeatureCollection(waterVector.copyProperties(image))
    .set('nodata_pixels', ee.Dictionary(mask.not().reduceRegion(ee.Reducer.sum(), waterMaskPermanentVector, scale)).values().get(0))
    .set('cloud_pixels', 0)
    .set('cloud_shadow_pixels', 0)
    .set('snow_pixels', 0)
    .set('water_threshold', th)
}

Sentinel1.onLayerAdd = function(image, info) {
  image = image.select(0)
  
  // remove bad pixel by detecting low entropy areas
  var glcm = image.multiply(10).toInt().glcmTexture({size: 4});
  var lowEntropy = glcm.select(0).lt(0.1)
  image = image.updateMask(lowEntropy)

  var K = 4.5//3.5
  var iterations = 10
  var method = 1

  image = image.clip(aoi)
    //.updateMask(image.select(0).gt(-24))

  image = removeSpeckleNoisePeronaMalik(image, iterations, K, method)

  Map.addLayer(image, {min: info.visual.min, max: info.visual.max}, 'smooth', false);

  var scale = image.projection().nominalScale()

  var clipEdges = false
  //var clipEdges = true
  var th = computeThresholdUsingOtsu(image.select(0), scale, aoi, 0.6, 2, clipEdges, true)

  // detect water by taking darker pixels
  var water = image.lt(th)
  
  // vectorize
  var waterVector = water.mask(water).reduceToVectors({geometry: focusNearWaterVector, scale: errorMargin})
  
  // filter to overlaps met permanent water center
  //waterVector = filterToIntersection(waterVector, ee.FeatureCollection([waterPermanentCenter]))
  waterVector = filterToMaximumAreaFraction(waterVector, waterMaskPermanentVector)
  
  // take the largest
  waterVector = ee.Feature(waterVector.map(function(f) {
    return f.set('area', f.geometry().area(ee.ErrorMargin(scale)))
  }).sort('area', false).first())

  water = ee.Image(0).byte().paint(waterVector, 1).rename('water')
    .max(lowEntropy.not().clip(waterVector.convexHull(ee.ErrorMargin(errorMargin)))) // fill-in smooth areas within detected water

  Map.addLayer(lowEntropy.mask(lowEntropy.not()), {palette:['ffffff']}, 'smooth mask', false)

  water = water.focal_mode(scale, 'circle', 'meters', 3)
  
  Map.addLayer(water.mask(water), {palette:['ffffff']}, 'water', false)

  var waterEdge = water.subtract(water.focal_min(1))

  water = ee.ImageCollection([
    water.mask(water).visualize({palette:['5050ff'], opacity: 0.2}),
    waterEdge.mask(waterEdge).visualize({palette:['ffffff'], opacity: 0.9})
    ]).mosaic()
    
  Map.addLayer(water.mask(water), {}, 'water (vector)', false)

  return image
}

// =========================== asset info

var collectionInfo = {
  values: [
  {
    name: 'Landsat 8',
    asset: 'LANDSAT/LC8_L1T_TOA',
    type: 'optical',
    bands: {
      readable: ['coastal', 'blue', 'green', 'red', 'nir', 'swir', 'swir2', 'pan', 'cirrus', 'temp', 'temp2', 'BQA'],
      native:   ['B1',      'B2',   'B3',    'B4',  'B5',  'B6',   'B7',    'B8',  'B9',     'B10',  'B11',   'BQA']
    },
    visual: {bands: ['swir', 'nir', 'green'], min:0.03, max:0.5},
    transform: function(image) {
      return image
    },
    detectWater: function(image, info) {
      return Landsat.detectWater(image, info)
    },
    onLayerAdd: function(image, info) {
      return Landsat.onLayerAdd(image, info)
    }
  },
  {
    name: 'Landsat 7',
    asset: 'LANDSAT/LE7_L1T_TOA',
    type: 'optical',
    bands: {
      readable: ['blue', 'green', 'red', 'nir', 'swir', 'swir2', 'temp',      'temp2',     'pan'],
      native:   ['B1',   'B2',    'B3',  'B4',  'B5',   'B5',    'B6_VCID_2', 'B6_VCID_2', 'B8']
    },
    visual: {bands: ['swir', 'nir', 'green'], min:0.03, max:0.5},
    transform: function(image) {
      return image
    },
    detectWater: function(image, info) {
      return Landsat.detectWater(image, info)
    },
    onLayerAdd: function(image, info) {
      return Landsat.onLayerAdd(image, info)
    }
  },
  {
    name: 'Landsat 5',
    asset: 'LANDSAT/LT5_L1T_TOA',
    type: 'optical',
    bands: {
      readable: ['blue', 'green', 'red', 'nir', 'swir', 'swir2', 'temp'],
      native:   ['B1',   'B2',    'B3',  'B4',  'B5', 'B5',  'B6']
    },
    visual: {bands: ['swir', 'nir', 'green'], min:0.03, max:0.5},
    transform: function(image) {
      return image
    },
    detectWater: function(image, info) {
      return Landsat.detectWater(image, info)
    },
    onLayerAdd: function(image, info) {
      return Landsat.onLayerAdd(image, info)
    }
  },
  { 
    name: 'Landsat 4',
    asset: 'LANDSAT/LT4_L1T_TOA',
    type: 'optical',
    bands: {
      readable: ['blue', 'green', 'red', 'nir', 'swir', 'swir2', 'temp'],
      native:   ['B1',   'B2',    'B3',  'B4',  'B5', 'B5',  'B6']
    },
    visual: {bands: ['swir', 'nir', 'green'], min:0.03, max:0.5},
    transform: function(image) {
      return image
    },
    detectWater: function(image, info) {
      return Landsat.detectWater(image, info)
    },
    onLayerAdd: function(image, info) {
      return Landsat.onLayerAdd(image, info)
    }
  },
  { 
    name: 'ASTER T',
    asset: 'ASTER/AST_L1T_003',
    type: 'optical',
    filter: ee.Filter.and(
        ee.Filter.listContains('ORIGINAL_BANDS_PRESENT', 'B11'),
        ee.Filter.listContains('ORIGINAL_BANDS_PRESENT', 'B12'),
        ee.Filter.listContains('ORIGINAL_BANDS_PRESENT', 'B13'),
        ee.Filter.and(
          ee.Filter.listContains('ORIGINAL_BANDS_PRESENT', 'B01'),
          ee.Filter.listContains('ORIGINAL_BANDS_PRESENT', 'B3N')
          //ee.Filter.listContains('ORIGINAL_BANDS_PRESENT', 'B04')
        ).not()
    ),
    bands: {
      readable: ['green', 'red', 'nir', 'swir', 'swir2', 'swir3', 'swir4', 'swir5', 'swir6', 'temp', 'temp2', 'temp3', 'temp4', 'temp5'],
      native:   ['B01',   'B02', 'B3N', 'B04',  'B05',   'B06',   'B07',   'B08',   'B09',   'B10',  'B11',   'B12',   'B13',   'B14',],
    },
    visual: {bands: ['temp', 'temp3', 'temp5'], min:600, max:1800, forceRgbOutput: true},
    transform: function(image) {
      return image
    },
    onLayerAdd: function(image, info) {
      return AsterT.onLayerAdd(image, info)
    }
  },
  { 
    name: 'ASTER',
    asset: 'ASTER/AST_L1T_003',
    type: 'optical',
    filter: ee.Filter.and(
        ee.Filter.listContains('ORIGINAL_BANDS_PRESENT', 'B01'),
        ee.Filter.listContains('ORIGINAL_BANDS_PRESENT', 'B3N'),
        //ee.Filter.listContains('ORIGINAL_BANDS_PRESENT', 'B04')
        ee.Filter.gt('SOLAR_ELEVATION', 0) // exclude night scenes

    ),
    bands: {
      readable: ['green', 'red', 'nir', 'swir', 'swir2', 'swir3', 'swir4', 'swir5', 'swir6', 'temp', 'temp2', 'temp3', 'temp4', 'temp5'],
      native:   ['B01',   'B02', 'B3N', 'B04',  'B05',   'B06',   'B07',   'B08',   'B09',   'B10',  'B11',   'B12',   'B13',   'B14',]
    },
    //visual: {bands: ['swir', 'nir', 'green'], min:10, max:255},
    visual: {bands: ['green', 'nir', 'green'], min:10, max:255},
    unitScale: [0, 255],
    transform: function(image) {
      return image
    },
    detectWater: function(image, info) {
      return Aster.detectWater(image, info)
    },
    onLayerAdd: function(image, info) {
      return Aster.onLayerAdd(image, info)
    }
  },  
  { 
    name: 'Sentinel 2', 
    asset: 'COPERNICUS/S2', 
    type: 'optical',
    bands: {
      readable:  ['coastal', 'blue', 'green', 'red', 'red2', 'red3', 'red4', 'nir', 'nir2', 'water_vapour', 'cirrus', 'swir', 'swir2', 'QA10', 'QA20', 'QA60'],
      native: ['B1',      'B2',   'B3',    'B4',  'B5',   'B6',   'B7',   'B8',  'B8A',  'B9',           'B10',    'B11',  'B12',   'QA10', 'QA20', 'QA60']
    },
    visual: {bands: ['green', 'nir', 'green'], min:500, max:7000},
    unitScale: [0, 10000],
    transform: function(image) {
      return image
    },
    detectWater: function(image, info) {
      return Sentinel2.detectWater(image, info)
    },
    onLayerAdd: function(image, info) {
      return Sentinel2.onLayerAdd(image, info)
    }
  },
  { 
    name: 'PROBA-V 100m', 
    asset: 'VITO/PROBAV/S1_TOC_100M', 
    type: 'optical',
    bands: {
      readable:  ['blue', 'red', 'nir', 'swir', 'SM', 'time'],
      native:    ['BLUE', 'RED', 'NIR', 'SWIR', 'SM', 'TIME']
    },
    
    visual: {bands: ['red', 'nir', 'red'], min:10, max:1000},
    unitScale: [0, 1000],
    transform: function(image) { 
      return image
    },
  },
  { 
    name: 'PROBA-V 333m', 
    asset: 'VITO/PROBAV/S1_TOC_333M',
    type: 'optical',
    bands: {
      readable:  ['blue', 'red', 'nir', 'swir', 'SM', 'time'],
      native:    ['BLUE', 'RED', 'NIR', 'SWIR', 'SM', 'TIME']
    },
    visual: {bands: ['red', 'nir', 'red'], min:10, max:500},
    unitScale: [0, 1000],
  },
  { 
    name: 'MODIS Aqua MYD09GQ',
    asset: 'MODIS/MYD09GQ',
    type: 'optical',
    bands: {
      readable:  ['red',          'nir',          'quality', 'coverage'],
      native:    ['sur_refl_b01', 'sur_refl_b02', 'QC_250m', 'obscov']
    },
    visual: {bands: ['red', 'nir', 'red'], min:500, max:5000},
    unitScale: [0, 10000]
  },
  { 
    name: 'MODIS Terra MOD09GQ',
    asset: 'MODIS/MOD09GQ',
    type: 'optical',
    bands: {
      readable:  ['red',          'nir',          'quality', 'coverage'],
      native:    ['sur_refl_b01', 'sur_refl_b02', 'QC_250m', 'obscov']
    },
    visual: {bands: ['red', 'nir', 'red'], min:500, max:5000},
    unitScale: [0, 10000]
  },
  { 
    name: 'Sentinel 1 VV', 
    asset: 'COPERNICUS/S1_GRD', 
    type: 'radar',
    filter: ee.Filter.and(
        ee.Filter.eq('transmitterReceiverPolarisation', 'VV'),
        ee.Filter.eq('transmitterReceiverPolarisation', ['VV', 'VH']).not()
    ),
    bands: { 
      readable: ['VV'],
      native: ['VV']
    },
    visual: {bands: ['VV'], min:-20, max:-5, forceRgbOutput: true},
    transform: function(image) { 
      return image
    },
    detectWater: function(image, info) {
      return Sentinel1.detectWater(image, info)
    },
    onLayerAdd: function(image, info) {
      image = Sentinel1.onLayerAdd(image, info)
      return image
    }
  },
  { 
    name: 'Sentinel 1 VH', 
    asset: 'COPERNICUS/S1_GRD', 
    type: 'radar',
    filter: ee.Filter.and(
        ee.Filter.eq('transmitterReceiverPolarisation', 'VH'),
        ee.Filter.eq('transmitterReceiverPolarisation', ['VV', 'VH']).not()
        ),
    bands: { 
      readable: ['VH'],
      native: ['VH']
    },
    visual: {bands: ['VH'], min:-20, max:-5, forceRgbOutput: true},
    transform: function(image) { 
      return image
    },
    detectWater: function(image, info) {
      return Sentinel1.detectWater(image, info)
    },
    onLayerAdd: function(image, info) {
      image = Sentinel1.onLayerAdd(image, info)
      return image
    }
  },
  { 
    name: 'Sentinel 1 VV+VH', 
    asset: 'COPERNICUS/S1_GRD', 
    type: 'radar',
    filter: ee.Filter.eq('transmitterReceiverPolarisation', ['VV', 'VH']),
    bands: { 
      readable: ['VV', 'VH'],
      native: ['VV', 'VH']
    },
    visual: {bands: ['VV', 'VH', 'VV'], min:-20, max:-5},
    transform: function(image) { 
      return image
    },
    detectWater: function(image, info) {
      return Sentinel1.detectWater(image, info)
    },
    onLayerAdd: function(image, info) {
      image = Sentinel1.onLayerAdd(image, info)
      return image
    }
  },
  { 
    name: 'Sentinel 1 HH+HV', 
    asset: 'COPERNICUS/S1_GRD', 
    type: 'radar',
    filter: ee.Filter.eq('transmitterReceiverPolarisation', ['HH', 'HV']),
    bands: { 
      readable: ['HH', 'HV'],
      native: ['HH', 'HV']
    },
    visual: {bands: ['HH', 'HV', 'HH'], min:-20, max:-5},
    transform: function(image) { 
      return image
    },
    detectWater: function(image, info) {
      return Sentinel1.detectWater(image, info)
    },
    onLayerAdd: function(image, info) {
      image = Sentinel1.onLayerAdd(image, info)
      return image
    }
  }
  ],
  
  getByName: function(name) {
    var values = collectionInfo.values
    
    for(var i = 0; i < values.length; i++) {
      if(values[i].name === name) {
        return values[i]
      }
    }

    return null;
  }
}

// ========================== testing 

var assert = {
  isTrue: function(assertionName, condition) {
    print(ee.String(ee.Algorithms.If(ee.Algorithms.IsEqual(condition, 1), ' passed: ', 'failed: ')).cat(assertionName))
  },
  
  isFalse: function(assertionName, condition) {
    print(ee.String(ee.Algorithms.If(ee.Algorithms.IsEqual(condition, 0), ' passed: ', 'failed: ')).cat(assertionName))
  }
}

var TestSuite = {
  probaTransformExtractTime: function() {
    // find image at location
    var pt = ee.Geometry.Point(-120.16, 39.38)
    var info = collectionInfo.getByName('PROBA-V 100m')
    
    // BUG: filterBounds() does not filter empty image
    var image = ee.Image(ee.ImageCollection(info.asset).select('TIME').filterBounds(pt)
      .map(function(i) {
        var valueExists = i.reduceRegion(ee.Reducer.first(), pt, 90).values().get(0)
        return i.set('value_exists', valueExists)
      }).filter(ee.Filter.neq('value_exists', null)).first())
    
    // get time
    var time = image.get('system:time_start')
    print('Start time: ', ee.Date(time).format('YYYY-MM-dd HH:ss'))
    
    // get time offset
    var offset = image.select('TIME').reduceRegion(ee.Reducer.first(), pt, 90).values().get(0)
    print('Time offset (minutes): ', offset)

    var expected = ee.Date(time).advance(offset, 'minute')
    print('Expected time: ', expected.format('YYYY-MM-dd HH:ss'))
    
    // Asserts, check if transform() changes time in a given image
    image = image.set('bounds', pt) // used within transform()
    
    image = info.transform(image)
    var actual = image.get('system:time_start')
    
    assert.isTrue('transform() should add time offset to system:time_start from TIME band for PROBA images', 
      expected.millis().eq(actual))
    
  },
  
  run: function() {
    Object.keys(TestSuite).map(function(name) { 
      if(name === 'run') {
        return
      }
      
      TestSuite[name]()
    })
  }
}

// TestSuite.run(); return

// ==================================================== main program

print('Date range: ' + start + '..' + stop)

// the actual number of image collections, used for progress
var collectionCount = collectionInfo.values.length
if(only.length > 0) {
  collectionCount = only.length
} else {
  collectionCount = collectionCount - skip.length
}

function exportRendered() {
    // export all images video
  renderedImagesAll = renderedImagesAll.sort('system:time_start')
  
  //print('Total rendered: ', renderedImagesAll.aggregate_count('system:id'))

  // add to map
  mapLayerCountToAddRendered = Math.min(totalImageCount, mapLayerCountToAddRendered)
  
  var list = renderedImagesAll.toList(mapLayerCountToAddRendered, 0)
  for(var i = 0; i < mapLayerCountToAddRendered; i++) {
    var image = ee.Image(list.get(i))
    Map.addLayer(image, {}, 'frame ' + i, i < 5)
    pushLayer(image, ee.Dictionary(image.get('info')).get('name'))
  }

  var resolutionW = 1920
  var fps = 1
  var name = 'multisensor-3-cloudfree-'

  function exportWithoutText() {
    Export.video.toDrive({
      collection: renderedImagesAll,
      description: name + start + '_' + stop + '_fps' + fps,
      
      dimensions: resolutionW,
      region: ee.Geometry(Map.getBounds(true)),
      framesPerSecond: fps,
      crs: 'EPSG: 3857',
      maxFrames: 2000
    })
  }
  exportWithoutText()  

  function exportWithText() {
    var textScale = Map.getScale() * 2
    var textBounds = ee.Geometry(Map.getBounds(true))
    var textMarginSize = 20 // scale units
    var textLocationCount = 20
    var textLocations = getLeftMarginLocations(textBounds, textMarginSize, textLocationCount, textScale)
    
    // add to rendered (for export)
    function renderWithText(i) { 
      var info = ee.Dictionary(i.get('info'))
  
      var startTime = i.get('system:time_start')
      var startTime = i.get('system:id')
      
      var str = ee.Date(startTime).format('YYYY-MM-dd HH:MM')
      var pt1 = textLocations.get(1)
      var textDate = Text.draw(str, pt1, textScale, {outlineColor: '000000', outlineWidth: 3, outlineOpacity: 0.6, fontSize:16, textColor:'white'})
    
      var pt2 = textLocations.get(3)
      var textSensor = Text.draw(info.get('name'), pt2, textScale, {outlineColor: '000000', outlineWidth: 3, outlineOpacity: 0.6, fontSize: 16, textColor:'white'})
  
      //var permenentWaterEdgeBg = waterMaskEdge.focal_max(2)
      //permenentWaterEdgeBg = permenentWaterEdgeBg.mask(permenentWaterEdgeBg).visualize({palette: ['000000'], opacity:0.5})
      //var permenentWaterEdge = waterMaskEdge.mask(waterMaskEdge).visualize({palette: ['ffffff']})
  
      var rendered = ee.ImageCollection.fromImages([
        i,
        //permenentWaterEdgeBg,
        //permenentWaterEdge,
        textDate,
        textSensor
      ]).mosaic()
        .set('system:time_start', startTime)
        .set('info', info)
        .set('system:id', id)
      
      rendered = rendered.copyProperties(i)
              
      return rendered
    }
  
    var renderedImagesAll = renderedImagesAll.map(renderWithText)

    Export.video.toDrive({
      collection: renderedImagesAll,
      description: name + start + '_' + stop + '-text' + '_fps' + fps,
      
      dimensions: resolutionW,
      region: ee.Geometry(Map.getBounds(true)),
      framesPerSecond: fps,
      crs: 'EPSG: 3857',
      maxFrames: 2000
    })
  }

  // exportWithText()
  
  var map = ee.Feature(ee.Geometry(Map.getBounds(true)), {})
  Export.table.toDrive({collection: ee.FeatureCollection(map), description: name + start + '_' + stop + '_extent', fileFormat:'GeoJSON'})

  var features = ee.FeatureCollection(renderedImagesAll)
  Export.table.toDrive({collection: features, description: name + start + '_' + stop + '_info', fileFormat:'GeoJSON'})
  
  // update dates
  updateLayerNames()
}

function addBaseLayers() {
  // lake and reservoir locations retrieved from USGS NWIS: http://maps.waterdata.usgs.gov/mapper/nwisquery.html?URL=http://waterdata.usgs.gov/usa/nwis/current?type=lake&format=sitefile_output&sitefile_output_format=xml&column_name=agency_cd&column_name=site_no&column_name=station_nm&column_name=site_tp_cd&column_name=dec_lat_va&column_name=dec_long_va&column_name=agency_use_cd
  var reservoirs = ee.FeatureCollection('ft:1POcfYkRBhBSZIbnrNudwnozHYtpva9vdyYBMf5QZ')
  
  var index = 3
  var reservoir = ee.Feature(reservoirs.toList(1, index).get(0))
  
  Map.addLayer(reservoirs, {color: 'ff0000', opacity:0.7}, 'USA reservoirs and lakes locations', false)
  
  // add permanent watermask
  Map.addLayer(waterMaskPermanent.mask(waterMaskPermanent), {palette: ['0000aa'], opacity: 0.2}, 'permanent mask water (GLCF)', false)

  Map.addLayer(waterMaskPermanentVector, {palette: ['0000aa'], opacity: 0.2}, 'permanent mask water vector (GLCF)', false)
  
  var waterMaskPermanentEdge = ee.Algorithms.CannyEdgeDetector(waterMaskPermanent, 0.99)
  Map.addLayer(waterMaskPermanentEdge.mask(waterMaskPermanentEdge), {palette: ['ffffff']}, 'permanent water mask edge (GLCF)')

  Map.addLayer(waterPermanentCenter, {}, 'permanent water mask center', false)

  // focus on the images near water
  Map.addLayer(focusNearWater.mask(focusNearWater.subtract(1).multiply(-1)), {min:0, max:1, palette: ['000000']}, 'potential water focus', true, 0.3)
  
  //Map.centerObject(reservoir, 13)
  Map.addLayer(aoi, {}, 'aoi', false)
}

//Map.centerObject(aoi, 14)

Map.setOptions('HYBRID')

// add progress label
function updateProgress() {
  var progressLabel = ui.Label({ 
    value: 'Scanning image collections ' + processedCount + ' of ' + collectionCount,
    style: {fontWeight: 'bold', fontSize: '12px', margin: '10px 5px'} 
  })
  
  progressPanel.clear()
  progressPanel.add(progressLabel)
}

var processedCount = 0
var progressPanel = ui.Panel();
Map.add(progressPanel)
updateProgress()

// keep layer info in order to update dates async
var layerInfos = []
function pushLayer(image, text) {
  var layers = Map.layers();
  layerInfos.push({image: image, text: text, layer: layers.get(layers.length() - 1)})
}

// updates layer names at the end (async), add date
function updateLayerName(layerInfo) {
  function onGetDate(date, error) {
    if(layerInfo.text) {
      ee.String(layerInfo.text).getInfo(function(text) {
        layerInfo.layer.setName(layerInfo.layer.getName() + ' ' + date + ' ' + text);
      })
    } else {
      layerInfo.layer.setName(layerInfo.layer.getName() + ' ' + date);
    }
  }

  ee.Date(layerInfo.image.get('system:time_start')).format('YYYY-MM-dd HH:mm').getInfo(onGetDate);
}

function updateLayerNames() {
  layerInfos.map(updateLayerName);
}

// update progress and add base layers at the end
var totalImageCount = 0
function onProcessed(info) {
  processedCount++
  updateProgress()

  if(processedCount == collectionCount) {
    Map.remove(progressPanel)
    
    exportRendered()
    addBaseLayers()
    
    print('Total images found: ' + totalImageCount)
  }
}

// all rendered images from all sensors
var renderedImagesAll = ee.ImageCollection([])

// process image collection (add layers, export, query)
function processImages(info) {
  if(only.length && only.indexOf(info.name) === -1) {
     return;
  }
  
  if(skip.indexOf(info.name) != -1) {
    return
  }

  // print number of images at AOI
  var images = ee.ImageCollection(info.asset)
    .filterBounds(aoi)
    .select(info.bands.native, info.bands.readable)
    .map(function(i) { return i.set('bounds', aoi)})
    
  if(info.filter) {
    images = images.filter(info.filter)
  }
  
  if(start && stop) {
    images = images.filterDate(start, stop)
  }

  // BUT: EE does image footprints are not alway correct, make sure we have images with values  
  images = images.map(function(image) {
      var value = ee.Dictionary(image.select(info.visual.bands[0]).reduceRegion(ee.Reducer.firstNonNull(), aoi, 100)).values().get(0)
      return image.set('aoi_value', value)
          //.updateMask(focusNearWater)

    }).filter(ee.Filter.neq('aoi_value', null))

  // apply addition transform if needed
  if(info.transform) {
    images = images.map(info.transform)
  }

  renderedImagesAll = renderedImagesAll.merge(images.map(function(i) { 
    var rendered = i.visualize(info.visual)
      .set('info', info)
      .set('system:time_start', i.get('system:time_start'))
      .set('system:id', i.get('system:id')) 
      
    if(renderWater && !development) {
      // add water edge on top
      var waterVector = ee.FeatureCollection(info.detectWater(i, info))
      
      var waterImage = ee.Image(0).byte().paint(waterVector, 1, 1)
      
      rendered = ee.ImageCollection([
        rendered,
        waterImage.mask(waterImage).visualize({palette:'ffffff', forceRgbOutput: true})
      ]).mosaic()
      
      return rendered
        .copyProperties(waterVector)
        .set('info', info)
        .set('system:time_start', i.get('system:time_start'))
        .set('system:id', i.get('system:id'))
        .set('water_area', waterVector.geometry().area(ee.ErrorMargin(errorMargin)))
  
    } else {
      return rendered
        .copyProperties(i)      
        .set('info', info)
        .set('system:time_start', i.get('system:time_start'))
        .set('system:id', i.get('system:id'))
    }
  }))

  .filter(ee.Filter.and(
      ee.Filter.lt('cloud_pixels', 10),
      ee.Filter.gt('water_area', 100),
      ee.Filter.lt('snow_pixels', 10),
      ee.Filter.eq('nodata_pixels', 0)
    ))


  // add to map (client, async)
  function processOnCount(count, error) {
    print(info.name + ': ', count)
    
    if(count === 'undefined') { 
      onProcessed(info);
      return;
    }
    
    totalImageCount += count

    // add a few layers
    var layerCount = Math.min(mapLayerCountToAddProcessed, count)
    var list = images.toList(layerCount, 0)
    for(var i = 0; i < layerCount; i++) {
      var image = ee.Image(list.get(i));
      Map.addLayer(image, info.visual, info.name + ' ' + i, i === 0)

      pushLayer(image, info.name);
      
      if(info.onLayerAdd && development) {
        info.onLayerAdd(image, info)
      }
    }
    
    onProcessed(info);
  }
  
  var count = images.select(0).aggregate_count('system:id')
  count.getInfo(processOnCount)
}

collectionInfo.values.map(processImages)

