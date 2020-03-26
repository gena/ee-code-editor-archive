/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var hyperion = ee.ImageCollection("EO1/HYPERION"),
    jrc = ee.Image("JRC/GSW1_0/GlobalSurfaceWater"),
    pt1 = /* color: #d63000 */ee.Geometry.Point([-122.18461990356445, 37.39208423213654]),
    image_area = /* color: #98ff00 */ee.Geometry.LineString(
        [[-122.1884822845459, 37.39590290677035],
         [-122.17977046966553, 37.387753892497166]]),
    scalebar = /* color: #d63000 */ee.Geometry.LineString(
        [[-122.18582125283098, 37.38841878710935],
         [-122.18152473656409, 37.388393213721415]]),
    pt_date = /* color: #98ff00 */ee.Geometry.Point([-122.18805313110352, 37.395493772365036]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
function app() {
  var λ = [426.8200, 436.9900, 447.1700, 457.3400, 467.5200, 477.6900, 487.8700, 498.0400, 508.2200, 518.3900, 528.5700, 538.7400, 548.9200, 559.0900, 569.2700, 579.4500, 589.6200, 599.8000, 609.9700, 620.1500, 630.3200, 640.5000, 650.6700, 660.8500, 671.0200, 681.2000, 691.3700, 701.5500, 711.7200, 721.9000, 732.0700, 742.2500, 752.4300, 762.6000, 772.7800, 782.9500, 793.1300, 803.3000, 813.4800, 823.6500, 833.8300, 844.0000, 854.1800, 864.3500, 874.5300, 884.7000, 894.8800, 905.0500, 915.2300, 925.4100, 912.4500, 922.5400, 932.6400, 942.7300, 952.8200, 962.9100, 972.9900, 983.0800, 993.1700, 1003.300,1013.300, 1023.400,1033.490,1043.590, 1053.690, 1063.790, 1073.890, 1083.990, 1094.090, 1104.190, 1114.190, 1124.280,1134.3800, 1144.4800, 1154.5800, 1164.6800, 1174.7700, 1184.8700, 1194.9700, 1205.0700, 1215.1700, 1225.1700, 1235.2700, 1245.3600, 1255.4600, 1265.5600, 1275.6600, 1285.7600, 1295.8600, 1305.9600, 1316.0500, 1326.0500, 1336.1500, 1346.2500, 1356.3500, 1366.4500, 1376.5500, 1386.6500, 1396.7400, 1406.8400, 1416.9400, 1426.9400, 1437.0400, 1447.1400, 1457.2300, 1467.3300, 1477.4300, 1487.5300, 1497.6300, 1507.7300, 1517.8300, 1527.9200, 1537.9200, 1548.0200, 1558.1200, 1568.2200, 1578.3200, 1588.4200, 1598.5100, 1608.6100, 1618.7100, 1628.8100, 1638.8100, 1648.9000, 1659.0000, 1669.1000, 1679.2000, 1689.3000, 1699.4000, 1709.5000, 1719.6000, 1729.7000, 1739.7000, 1749.7900, 1759.8900, 1769.9900, 1780.0900, 1790.1900, 1800.2900, 1810.3800, 1820.4800, 1830.5800, 1840.5800, 1850.6800, 1860.7800, 1870.8700, 1880.9800, 1891.0700, 1901.1700, 1911.2700, 1921.3700, 1931.4700, 1941.5700, 1951.5700, 1961.6600, 1971.7600, 1981.8600, 1991.9600, 2002.0600, 2012.1500, 2022.2500, 2032.3500, 2042.4500, 2052.4500, 2062.5500, 2072.6500, 2082.7500, 2092.8400, 2102.9400, 2113.0400, 2123.1400, 2133.2400, 2143.3400, 2153.3400, 2163.4300, 2173.5300, 2183.6300, 2193.7300, 2203.8300, 2213.9300, 2224.0300, 2234.1200, 2244.2200, 2254.2200, 2264.3200, 2274.4200, 2284.5200, 2294.6100, 2304.7100, 2314.8100, 2324.9100, 2335.0100, 2345.1100, 2355.2100, 2365.2000, 2375.3000, 2385.4000, 2395.5000]
  var irradiances = [1650.52,1714.9,1994.52,2034.72,1970.12,2036.22,1860.24,1953.29,1953.55,1804.56,1905.51,1877.5,1883.51,1821.99,1841.92,1847.51,1779.99,1761.45,1740.8,1708.88,1672.09,1632.83,1591.92,1557.66,1525.41,1470.93,1450.37,1393.18,1372.75,1235.63,1266.13,1279.02,1265.22,1235.37,1202.29,1194.08,1143.6,1128.16,1108.48,1068.5,1039.7,1023.84,938.96,949.97,949.74,929.54,917.32,892.69,877.59,834.6,876.1,839.34,841.54,810.2,802.22,784.44,772.22,758.6,743.88,721.76,714.26,698.69,682.41,669.61,657.86,643.48,623.13,603.89,582.63,579.58,571.8,562.3,551.4,540.52,534.17,519.74,511.29,497.28,492.82,479.41,479.56,469.01,461.6,451,444.06,435.25,429.29,415.69,412.87,405.4,396.94,391.94,386.79,380.65,370.96,365.57,358.42,355.18,349.04,342.1,336,325.94,325.71,318.27,312.12,308.08,300.52,292.27,293.28,282.14,285.6,280.41,275.87,271.97,265.73,260.2,251.62,244.11,247.83,242.85,238.15,239.29,227.38,226.69,225.48,218.69,209.07,210.62,206.98,201.59,198.09,191.77,184.02,184.91,182.75,180.09,175.18,173,168.87,165.19,156.3,159.01,155.22,152.62,149.14,141.63,139.43,139.22,137.97,136.73,133.96,130.29,124.5,124.75,123.92,121.95,118.96,117.78,115.56,114.52,111.65,109.21,107.69,106.13,103.7,102.42,100.42,98.27,97.37,95.44,93.55,92.35,90.93,89.37,84.64,85.47,84.49,83.43,81.62,80.67,79.32,78.11,76.69,75.35,74.15,73.25,71.67,70.13,69.52,68.28,66.39,65.76,65.23,63.09,62.9,61.68,60,59.94]
  
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
  
  
  /***
   * EO-1, Hyperion, compute radiance (rescale)
   * 
   * VNIR bands (B008-B057 (426.82nm - 925.41nm): L = Digital Number / 40
   * SWIR bands (B077-B224 (912.45nm - 2395.50nm): L = Digital Number / 80
   * 
   */
  function toRadiance(image) {
    var kVNIR = ee.List.repeat(40, 57-8+1)
    var kSWIR = ee.List.repeat(80, 224-77+1)
    var k = kVNIR.cat(kSWIR)
    
    return image.toFloat().divide(ee.Image.constant(k).rename(image.bandNames()))
      .set('system:time_start', image.get('system:time_start'))
      .copyProperties(image)
  }
  
  /***
   * EO-1, Hyperion, convert radiances to reflectances
   * 
   */
  function toReflectance(image) {
      // calculate day of year from time stamp
      var date = ee.Date(image.get('system:time_start'));
      var jan01 = ee.Date.fromYMD(date.get('year'), 1, 1);
      var doy = date.difference(jan01,'day').add(1);
  
      // Earth-Sun distance squared (d2) 
      // http://physics.stackexchange.com/questions/177949/earth-sun-distance-on-a-given-day-of-the-year
      var d = ee.Number(doy).subtract(4).multiply(0.017202).cos().multiply(-0.01672).add(1) 
      
      var d2 = d.multiply(d)  
      
      // mean exoatmospheric solar irradiance (ESUN)
      // https://eo1.usgs.gov/faq/question?id=21
      var ESUN = irradiances
      
      // cosine of solar zenith angle (cosz)
      var solar_z = ee.Number(ee.Number(90).subtract(image.get('SUN_ELEVATION')))
      var cosz = solar_z.multiply(Math.PI).divide(180).cos()
  
      // calculate reflectance
      var scalarFactors = ee.Number(Math.PI).multiply(d2).divide(cosz)
      var scalarApplied = ee.Image(image).toFloat().multiply(scalarFactors)
      var reflectance = scalarApplied.divide(ESUN)
  
      return reflectance
        .set('system:time_start', image.get('system:time_start'))
        .copyProperties(image)
  }
  
  // add raw images (for inspection)
  Map.addLayer(hyperion, {}, 'hyperion', false)
  
  // compute count
  var count = hyperion.select(0).count()
  Map.addLayer(count, {min:0, max:40, palette: ['ff0000', '002200']}, 'count', false)
  Map.addLayer(count.mask(count.gt(40)), {min:40, max:100, palette: ['002200', '00ff00']}, 'count > 40', false)
  
  // define area to sample values for plot
  var aoi = pt1 // .buffer(30)
  Map.addLayer(aoi, {}, 'AOI')
  
  // filter to AOI
  hyperion = hyperion.filterBounds(aoi)

  // add date
  hyperion = hyperion.map(function(i) { return i.set('DATE', i.date().format('YYYY-MM-dd')) })
  
  print(hyperion.aggregate_array('DATE'))  
  
  // exclude some scenes
  hyperion = hyperion.filter(ee.Filter.inList('DATE', [
      '2002-04-26'
    ]).not())
  
  
  // select only images at a given point
  function addAny(i) { 
    return i.set('any', i.select(0).mask().reduceRegion(ee.Reducer.allNonZero(), image_area.bounds()).values().get(0)) 
  }
  hyperion = hyperion.map(addAny).filter(ee.Filter.eq('any', 1))
  
  // DN > Radiance
  hyperion = hyperion.map(toRadiance)
  
  // buffer around aoi
  var bufferSize = 90
  
  // plot radiance values
  var result = hyperion
    .map(function(i) { return i.reduceNeighborhood(ee.Reducer.mean(), ee.Kernel.circle(bufferSize, 'meters'))})
    .getRegion(aoi, 30).slice(1).map(function(l) { return ee.List(l).slice(4) })
  var chart = ui.Chart.array.values(result, 1, λ)
  chart.setOptions({title: 'Radiance', pointsVisible: false, lineWidth: 1, hAxis: { viewWindow: {min:0, max:2400}} })
  print(chart)
  
  // Radiance > Reflectance
  hyperion = hyperion.map(toReflectance)
  
  // plot reflectance values
  var result = hyperion
    .map(function(i) { return i.reduceNeighborhood(ee.Reducer.mean(), ee.Kernel.circle(bufferSize, 'meters'))})
    .getRegion(aoi, 30).slice(1).map(function(l) { return ee.List(l).slice(4) })
  var chart = ui.Chart.array.values(result, 1, λ)
  chart.setOptions({title: 'Reflectance', pointsVisible: false, lineWidth: 1, 
    hAxis: { viewWindow: {min:0, max:2400}}, 
    vAxis: { viewWindow: {min:0, max:1}}})
  print(chart)
  
  // add example image
  Map.addLayer(ee.Image(hyperion.toList(1,1).get(0)), {min:0, max:1, bands:['B050', 'B040', 'B030']}, 'hyperion, example')
  
  Map.setOptions('SATELLITE')
  
  
  // add water occurence, JRC
  var p = jrc.select('occurrence')
  Map.addLayer(p.mask(p), {palette:['000011', '0000aa']}, 'occurrence', true, 0.50)
  
  
  function addNDWI(i) { 
    return i
      .addBands(i.normalizedDifference(['B018', 'B054']).rename('NDWI1')) // McFeters
      .addBands(i.normalizedDifference(['B024', 'B050']).rename('NDWI2'))
  }
  
  // plot NDWI values
  var ndwi = hyperion.map(addNDWI).select(['NDWI1', 'NDWI2'])
  var chart = ui.Chart.image.series(ndwi, pt1, ee.Reducer.first(), 10)
  chart.setOptions({title: 'NDWI', pointsVisible: false, lineWidth: 1, vAxis: { viewWindow: {min:-1, max:1}} })
  print(chart)
  
  // plot reflectance values
  var result = hyperion
    //.map(function(i) { return i.reduceNeighborhood(ee.Reducer.mean(), ee.Kernel.circle(120, 'meters')).rename(i.bandNames()) })
    .map(function(i) { 
      return i.set('NDWI', i.normalizedDifference(['B030', 'B050']).reduceRegion(ee.Reducer.mean(), pt1).values().get(0)) 
    }).filter(ee.Filter.gt('NDWI', 0))
    .getRegion(aoi, 30).slice(1).map(function(l) { return ee.List(l).slice(4) })
  var chart = ui.Chart.array.values(result, 1, λ)
  chart.setOptions({title: 'Reflectance (NDWI > 0)', pointsVisible: false, lineWidth: 1, 
    hAxis: { viewWindow: {min:0, max:2400}},
    vAxis: { viewWindow: {min:0, max:1}}})
  print(chart)
  
  // add gallery
  var rows = 10
  var columns = 8
  var images = hyperion
  
  Map.addLayer(ee.Image(1), {palette:['ffffff']}, 'white')
  
  var g = gallery(images, image_area.bounds(), rows, columns, true)
  var image = g.image
  Map.addLayer(image, {bands: ['B145', 'B044', 'B020'], min: 0.07, max: 0.5, gamma: 1.3}, 'gallery');
  
  
  var waterBandsPairs = [
      //['B025', 'B045', 'ffff00'],
      ['B024', 'B050', 'ffff00'],
      //['B025', 'B055', '00ff00'],
      //['B018', 'B043', 'ffff00'],
      //['B018', 'B045', 'ffff00'],
      //['B018', 'B050', '0000ff'],
      ['B018', 'B054', '00ff00'],
      ['B018', 'B055', '00ff00'],
      //['B041', 'B055', 'ffff00'],
    ]
  
  waterBandsPairs.map(function(waterBands) {
    var suffix = ', ' + waterBands[0] + '_' + waterBands[1]
    var color = waterBands[2]
    
    var ndwi = image.normalizedDifference([waterBands[0], waterBands[1]])
    Map.addLayer(ndwi, {min: -0.2, max: 0.5}, 'ndwi ' + suffix, false);
    
    var water = ndwi.gt(0)
    Map.addLayer(water.mask(water), {palette:['006994']}, 'water' + suffix, false);
  
    var waterEdge = getEdge(water).focal_max(1)
    Map.addLayer(waterEdge.mask(waterEdge), {palette:[color]}, 'water edge' + suffix, false);
  })
  
  var images = hyperion.map(function(i) { 
    var b044 = ee.Number(i.select('B044').reduceRegion(ee.Reducer.first(), pt1).values().get(0))
    
    var result = ee.Algorithms.If(b044.lte(0.217), 
      ee.Image(1).visualize({palette: ['00ff00'], forceRgbOutput: true}), 
      ee.Image(1).visualize({palette: ['ff0000'], forceRgbOutput: true})
    )
    
    return ee.Image(result).clip(pt1.buffer(bufferSize))
  })
  
  var g = gallery(images, image_area.bounds(), rows, columns, false)
  var image = g.image
  Map.addLayer(image, {}, 'gallery (B044 < 0.217)');
  
  // text images
  var textScale = Map.getScale()
  var images = hyperion.map(function(i) { 
    var str = i.date().format('YYYY-MM-dd')
    var textDate = Text.draw(str, pt_date, textScale, {
        outlineColor: '000000',
        outlineWidth: 2,
        outlineOpacity: 0.6,
        fontSize: 18,
        textColor: 'white'
    });

    return textDate
  })
  
  var g = gallery(images, image_area.bounds(), rows, columns, false)
  var image = g.image
  Map.addLayer(image, {}, 'gallery text');
  
  var frame = new Frame(image_area.bounds(), {steps:2, size:4, format: '%.3f'}).draw()
  Map.addLayer(frame, {}, 'frame')

  var scale = Scalebar.draw(scalebar, {steps:2, palette: ['5ab4ac', 'f5f5f5'], multiplier: 1, format: '%.0f', units: 'm'})
  Map.addLayer(scale, {}, 'scale')
  
  Map.addLayer(aoi.buffer(bufferSize), {}, 'aoi + ' + bufferSize + 'm')
}

























// ============================= generated: utils-text.js
var Text = {
    draw: function draw(text, pos, scale, props) {
        text = ee.String(text);

        var ascii = {};
        for (var i = 32; i < 128; i++) {
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
      fontSize:18, textColor: '000000', outlineColor: 'ffffff', outlineWidth: 2.5, outlineOpacity: 0.6})

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
        fontSize:18, textColor: '000000', outlineColor: 'ffffff', outlineWidth: 2.5, outlineOpacity: 0.6})
      
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


function getEdge(mask) {
    var canny = ee.Algorithms.CannyEdgeDetector(mask, 0.99, 0);
    return canny.mask(canny);
}


app()