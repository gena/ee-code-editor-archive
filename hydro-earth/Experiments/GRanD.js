/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var l8 = ee.ImageCollection("LANDSAT/LC8_L1T_TOA"),
    l7 = ee.ImageCollection("LANDSAT/LE7_L1T_TOA"),
    l5 = ee.ImageCollection("LANDSAT/LT5_L1T_TOA"),
    customReservoirs_BullLake = /* color: ff9999 */ee.Feature(
        ee.Geometry.Polygon(
            [[[-109.02488708496094, 43.24620305791017],
              [-109.06059265136719, 43.22644338283114],
              [-109.11209106445312, 43.2161858360268],
              [-109.20684814453125, 43.185152509372955],
              [-109.20719146728516, 43.158861947471785],
              [-109.14436340332031, 43.160865436189155],
              [-109.07398223876953, 43.18340015734588],
              [-109.03038024902344, 43.19741756512383],
              [-109.0169906616211, 43.21893803017322],
              [-109.0169906616211, 43.235198459790425]]]),
        {
          "name": "Bull Lake",
          "country": "USA",
          "year": 1938,
          "zoom": 12,
          "scale": 30,
          "system:index": "0"
        }),
    customReservoirs_CanyonFerry = /* color: 99ff99 */ee.Feature(
        ee.Geometry.Polygon(
            [[[-111.47621154785156, 46.36777895261494],
              [-111.46247863769531, 46.405196622368194],
              [-111.46865844726562, 46.452523981411225],
              [-111.50848388671875, 46.51068027820581],
              [-111.56204223632812, 46.58387814658056],
              [-111.64169311523438, 46.63717954716511],
              [-111.69387817382812, 46.66074749832071],
              [-111.73782348632812, 46.66263249079177],
              [-111.75361633300781, 46.64283679198892],
              [-111.71310424804688, 46.59331584323286],
              [-111.64512634277344, 46.51351558059737],
              [-111.59912109375, 46.463876433008494],
              [-111.59156799316406, 46.39809397414284],
              [-111.56341552734375, 46.33886927924262],
              [-111.52427673339844, 46.32891323009468]]]),
        {
          "name": "Canyon Ferry",
          "country": "USA",
          "year": 1954,
          "zoom": 11,
          "scale": 60,
          "system:index": "0"
        }),
    customReservoirs_Chardara = /* color: 9999ff */ee.Feature(
        ee.Geometry.Polygon(
            [[[68.53088947950914, 40.96626912216185],
              [68.7091063561545, 41.03318786234104],
              [68.66878081088862, 41.19789525594883],
              [68.3875557804638, 41.153075316734885],
              [68.21767409055121, 41.2351808950402],
              [67.88827616142396, 41.361945015615255],
              [67.7471923828125, 41.21998578493921],
              [67.90924072265625, 41.10315614062359],
              [67.95974686583759, 41.02394103906159],
              [68.01567077636719, 41.009957022453015],
              [68.08056278595268, 41.062313181032444],
              [68.2196044921875, 41.00477542222949]]]),
        {
          "name": "Chardara",
          "country": "Kazakhstan",
          "year": "",
          "zoom": 11,
          "scale": 60,
          "system:index": "0"
        }),
    customReservoirs_Charvak = /* color: ffff99 */ee.Feature(
        ee.Geometry.Polygon(
            [[[70.03955841064453, 41.60543123630148],
              [70.09380340576172, 41.582579601430346],
              [70.0982666015625, 41.55175560133366],
              [70.11955261230469, 41.56408696606436],
              [70.1144027709961, 41.58720193303142],
              [70.07801055908203, 41.625965127039095],
              [70.05500793457031, 41.66367910784373],
              [70.06977081298828, 41.681886797701594],
              [70.09449005126953, 41.69983299902505],
              [70.07698059082031, 41.70367796221136],
              [70.0429916381836, 41.681117562906515],
              [70.0265121459961, 41.67393759473024],
              [70.00865936279297, 41.6536755092821],
              [69.96299743652344, 41.63879548894791],
              [69.94857788085938, 41.62673502076991],
              [69.97844696044922, 41.611848779396716],
              [70.02410888671875, 41.611335399441735]]]),
        {
          "name": "Charvak",
          "country": "Uzbekistan",
          "year": "",
          "zoom": 12,
          "scale": 60,
          "system:index": "0"
        }),
    customReservoirs_Kayrakkum = /* color: 99ffff */ee.Feature(
        ee.Geometry.Polygon(
            [[[70.16075134277344, 40.242846824049785],
              [70.26718139648438, 40.272715386988686],
              [70.3564453125, 40.31042524979981],
              [70.32142639160156, 40.35073056591789],
              [70.23353576660156, 40.440676262682395],
              [70.05020141601562, 40.365381076021734],
              [69.81674194335938, 40.327701904195926],
              [69.774169921875, 40.260140757021894],
              [69.80232238769531, 40.21506247190585],
              [69.97055053710938, 40.20142824550515]]]),
        {
          "name": "Kayrakkum",
          "country": "Tajikistan",
          "year": "",
          "zoom": 11,
          "scale": 60,
          "system:index": "0"
        }),
    customReservoirs_Nurek = /* color: ff99ff */ee.Feature(
        ee.Geometry.Polygon(
            [[[69.42054748535156, 38.316339750609366],
              [69.49607849121094, 38.38203645248709],
              [69.54002380371094, 38.41916639395372],
              [69.57984924316406, 38.449286817153556],
              [69.65675354003906, 38.50465406475561],
              [69.62860107421875, 38.537424323873275],
              [69.58465576171875, 38.50304202775689],
              [69.49607849121094, 38.47133130139452],
              [69.38346862792969, 38.407867995932854],
              [69.290771484375, 38.41109628993052],
              [69.246826171875, 38.35996470164025],
              [69.24407958984375, 38.309874561004726],
              [69.26742553710938, 38.25112269630296],
              [69.35737609863281, 38.28131307922969]]]),
        {
          "name": "Nurek",
          "country": "Tajikistan",
          "year": "",
          "zoom": 11,
          "scale": 60,
          "system:index": "0"
        }),
    customReservoirs_Seminoe = /* color: d63000 */ee.Feature(
        ee.Geometry.Polygon(
            [[[-106.8585205078125, 41.91811793408036],
              [-106.79878234863281, 41.93548729665268],
              [-106.76101684570312, 41.98807738309159],
              [-106.70402526855469, 42.01818224766322],
              [-106.74179077148438, 42.04776297550285],
              [-106.798095703125, 42.089560512484425],
              [-106.82418823242188, 42.125219560849956],
              [-106.85714721679688, 42.1333673840616],
              [-106.8804931640625, 42.156786537824686],
              [-106.90864562988281, 42.14660536151124],
              [-106.93611145019531, 42.07325255290759],
              [-106.93130493164062, 42.039094188385945],
              [-106.87637329101562, 41.97940045674709],
              [-106.85920715332031, 41.94876655946857],
              [-106.875, 41.932933275212996],
              [-106.87774658203125, 41.923737951221014]]]),
        {
          "name": "Seminoe",
          "country": "USA",
          "year": "",
          "zoom": 12,
          "scale": 30,
          "system:index": "0"
        }),
    customReservoirs_Toktogul = /* color: 98ff00 */ee.Feature(
        ee.Geometry.Polygon(
            [[[73.23348999023438, 41.74979958661997],
              [73.30215454101562, 41.764141783336456],
              [73.2843017578125, 41.7856490686444],
              [73.07281494140625, 41.84296656785943],
              [72.95539855957031, 41.876718930343934],
              [72.81875610351562, 41.87927520155063],
              [72.69721984863281, 41.87518511853951],
              [72.65876770019531, 41.864447405239375],
              [72.68417358398438, 41.766190406938684],
              [72.59696960449219, 41.69752591075902],
              [72.61344909667969, 41.65034063112265],
              [72.65327453613281, 41.65136676586814],
              [72.85858154296875, 41.72213058512578],
              [72.98835754394531, 41.75492216766298]]]),
        {
          "name": "Toktogul",
          "country": "Kyrgystan",
          "year": "",
          "zoom": 11,
          "scale": 60,
          "system:index": "0"
        }),
    customReservoirs_Andijan = /* color: 0B4A8B */ee.Feature(
        ee.Geometry.Polygon(
            [[[73.06380356635646, 40.75323772153718],
              [73.06543350219727, 40.739713634293814],
              [73.06989669799805, 40.73216945026676],
              [73.07161331176758, 40.74010382743943],
              [73.07350158691406, 40.75388918270174],
              [73.07315826416016, 40.76104083532429],
              [73.08963775634766, 40.75570967636433],
              [73.09993743896484, 40.757790179509335],
              [73.10234069824219, 40.74699686227002],
              [73.11023712158203, 40.74491602137377],
              [73.10783386230469, 40.729697893611245],
              [73.1088638305664, 40.72267296820732],
              [73.1220817565918, 40.71421605600625],
              [73.12594388620585, 40.705823300059286],
              [73.14577102661133, 40.71200407096384],
              [73.15246566528185, 40.727876682390736],
              [73.14577102661133, 40.73268976628568],
              [73.14199447631836, 40.73685214795608],
              [73.13547134399414, 40.74465591168391],
              [73.12517166137695, 40.75870037916103],
              [73.1308364868164, 40.765071427764255],
              [73.1389045715332, 40.77027183102676],
              [73.15092086791992, 40.772611879721836],
              [73.16516876220703, 40.76559148640381],
              [73.17864404931925, 40.75440932632266],
              [73.18418061203226, 40.7581798101684],
              [73.19246292114258, 40.763121171621314],
              [73.19435119628906, 40.77053184050704],
              [73.1962392749117, 40.77859146490433],
              [73.1802749633789, 40.78639049480198],
              [73.16825866699219, 40.793408690380836],
              [73.17641188970742, 40.79997140113218],
              [73.21134567260742, 40.809521739444556],
              [73.22113088538981, 40.81991605676695],
              [73.20130402681798, 40.82465791467763],
              [73.18456649780273, 40.82186376767478],
              [73.16551208496094, 40.81419898875185],
              [73.15658569335938, 40.80822244501176],
              [73.14611434936523, 40.798217025760515],
              [73.13409805297852, 40.79119933844256],
              [73.12482833862305, 40.789769718601505],
              [73.11058044433594, 40.78704035888754],
              [73.10028076171875, 40.78418090934269],
              [73.08380126953125, 40.77807167284969],
              [73.06835174560547, 40.77495184600458],
              [73.0535888671875, 40.7743018636372],
              [73.05341720581055, 40.76793169992044]]]),
        {
          "name": "Andijan",
          "country": "Uzbekistan",
          "year": 1969,
          "zoom": 12,
          "scale": 30,
          "system:index": "0"
        });
/***** End of imports. If edited, may not auto-convert in the playground. *****/
/**
 * Translates and scales polygon geometry.
 */
function movePolygon(poly, x, y, scaleX, scaleY) {
  var coordLists = ee.List(poly.coordinates())

  coordLists = coordLists.map(function(list) {
    return ee.List(list).map(function(o) {
      var pt = ee.List(o)
      return ee.List([
        ee.Number(pt.get(0)).multiply(scaleX).add(x), 
        ee.Number(pt.get(1)).multiply(scaleY).add(y)
      ]);
    })
  })
  
  return ee.Algorithms.GeometryConstructors.Polygon(coordLists);
}

/**
 * Translates and scales MultiPolygon geometry.
 */
function moveTo(geom, x, y, scaleX, scaleY) {
  var geoms = geom.geometries();
  
  geoms = geoms.map(function(g) {
    return movePolygon(ee.Geometry(g), x, y, scaleX, scaleY);
  })
  
  return ee.Feature(ee.Algorithms.GeometryConstructors.MultiPolygon(geoms))
}

/**
 * Converts character to a geospatial feature.
 */
function charToFeature(characters, char) {
  return ee.Feature(characters.filter(ee.Filter.stringContains('char', char)).first());
}

/**
 * Converts text string to a feature collection using position, scale and space between characters.
 */
function textToFeatures(text, x, y, opt_args) {
  var args = opt_args || {};
  var font = args['font'] || 'ProductSans'

  var fonts = {
    'ProductSans' : ee.FeatureCollection('ft:1LwsANQcu6eheWHrqGxZ9fNX5FEjNBTxTEVOClWRw'),
    'Hacker' : ee.FeatureCollection('ft:1GKzZFxab7pSiKdv-s1UpyWHbEHXDwQ4ll37bVZnF'),
    'Helvetica' : ee.FeatureCollection('ft:1ouSXtIXd8syBi6dI2XQYkW5Z7i3bt7sPy2aXEGdS'),
    'HelveticaBold' : ee.FeatureCollection('ft:1JrMdGhJN5O0QPutmzBpC1nebcXY9-N86X0Zb5bLP'),
    'HelveticaBoldItalic' : ee.FeatureCollection('ft:1YKBnGW6txEmb-csXRlWVkeovqzAmaNEppKwpJB9I'),
    'HelveticaItalic' : ee.FeatureCollection('ft:1AnCP7EJcke-hzfVUezweHuwTqSjGWqPpnBrn4PMq'),
    'Consolas' : ee.FeatureCollection('ft:1QseQFRqhtKaYS7z54ohheB_Oy802bL1AcuFyudeK'),
    'CourrierNew' : ee.FeatureCollection('ft:1VAK4EIsvjRr57E-vkhJVLwAp82HAMMktFrGSPB4H'),
  }

  var sizeX = args['sizeX'] || 0.1;
  var sizeY = args['sizeY'] || 0.1;
  var charSpace = args['charSpace'] || 0.1;

  charSpace = ee.Number(charSpace)
  
  var scaleX = sizeX, scaleY = sizeY; // TODO: regenerate fonts so that their size will be known
  
  var chars = ee.String(text).split('');
  var features = ee.List([]);
  var offsetX = ee.Number(x);
  var offsetY = ee.Number(y);

  var charFeatures = ee.List(ee.List(chars).slice(1).iterate(function(char, prev) { 
    return ee.List(prev).add(charToFeature(fonts[font], char)); 
  }, ee.List([])))
  
  var offsetsX = ee.List(charFeatures.iterate(function(f, prev) { 
    var w = ee.Number(ee.Feature(f).get('width')).multiply(scaleX)
    
    var list = ee.List(prev)
    var last = ee.Number(list.get(list.length().subtract(1)))
    
    return list.add(last.add(w).add(charSpace))
  }, ee.List([offsetX]))).slice(0, chars.length())

  var newCharFeatures = charFeatures.zip(offsetsX).map(function(o) {
    var list = ee.List(o)
    var f = ee.Feature(list.get(0))
    var x = list.get(1)
    
    return moveTo(f.geometry(), x, offsetY, scaleX, scaleY);
  })

  return ee.FeatureCollection(newCharFeatures);
}
  
/**
 * Converts text string to an image layer using position, scale and space between characters.
 */
function textToImage(text, x, y, opt_args) {
  var features = textToFeatures(text, x, y, opt_args)

  var args = opt_args || {};
  var filled = typeof args['filled'] == 'undefined' ? true : args['filled'];

  var image = ee.Image(0).toByte();

  if(filled) {
    image = image.paint(features, 1); // paint fill
  }

  image = image.paint(features, 1, 1); // paint outline
  image = image.mask(image);
  
  return image;
}

function exportImagesToVideo(images, bounds, fileName, background, scale, showLabels, opt_showOnMap, opt_showOnMapStart, opt_showOnMapCount) {
  var showOnMap = opt_showOnMap || false  
  var showOnMapStart = opt_showOnMapStart || 0
  var showOnMapCount = opt_showOnMapCount || 10
  
  var I_min = 0.05
  var I_max = 0.4
  var gamma = 2.0

  var rendered = images.map(function(i){
    var rgb = i.visualize({gamma:gamma, min:I_min, max:I_max})
      .clip(bounds)

    var image = rgb;
      
    if(showLabels) {
      var date = ee.String(i.get('DATE_ACQUIRED'));
  
      var textDate = textToImage(date, 
              bounds[0] + (bounds[2]-bounds[0]) * 0.05, 
              bounds[1] + (bounds[3]-bounds[1]) * 0.05,
              {sizeX:0.001, sizeY:0.001, charSpace:0.005, font:'CourrierNew'})
        .visualize({palette:['000000']})
  
      var id = ee.String(i.get('LANDSAT_SCENE_ID'));
  
      var textId = textToImage(id, 
              bounds[0] + (bounds[2]-bounds[0]) * 0.05, 
              bounds[1] + (bounds[3]-bounds[1]) * 0.1,
              {sizeX:0.001, sizeY:0.001, charSpace:0.005, font:'CourrierNew'})
        .visualize({palette:['000000']})
      
      image = ee.ImageCollection.fromImages([
        background.visualize({}),
        rgb,
        textDate,
        textId
      ]).mosaic();
    }
    
    return image;
  });

  if(showOnMap) {
    var list = rendered.toList(showOnMapCount, showOnMapStart);
    for(var i = 0; i < showOnMapCount; i++) {
      var image = ee.Image(list.get(i));
      Map.addLayer(image, {}, i.toString(), i === 0);
    }
  }

  var coords = ee.List(bounds.bounds(1, ee.Projection('EPSG:3857')).coordinates().get(0)).getInfo()
  var w = Math.round((coords[1][0] - coords[0][0])/scale)
  var h = Math.round((coords[2][1] - coords[1][1])/scale)
  print(w + 'x' + h)

  Export.video(rendered, fileName.replace(' ', ''), {
    dimensions: w + 'x' + h, 
    framesPerSecond: 2, 
    region: JSON.stringify(bounds.getInfo())
  });
}

// A helper to apply an expression and linearly rescale the output.
var rescale = function(img, exp, thresholds) {
  return img.expression(exp, {img: img})
      .subtract(thresholds[0]).divide(thresholds[1] - thresholds[0]);
};

var cloudScore = function(img) {
  // Compute several indicators of cloudyness and take the minimum of them.
  var score = ee.Image(1.0);
  
  // Clouds are reasonably bright in the blue band.
  score = score.min(rescale(img, 'img.blue', [0.2, 0.3]));

  // Clouds are reasonably bright in all visible bands.
  //score = score.min(rescale(img, 'img.red + img.green + img.blue', [0.3, 0.8]));
  score = score.min(rescale(img, 'img.pan', [0.1, 0.3]));

  // Clouds are reasonably bright in all infrared bands.
  score = score.min(rescale(img, 'img.nir + img.swir1 + img.swir2', [0.3, 0.8]));

  // Clouds are reasonably cool in temperature.
  score = score.min(rescale(img, 'img.temp', [300, 290]));

  // var rescale_nir = rescale(img, 'img.nir', [1, -.1]);
  //score = score.where(img.select('nir').lte(0.02),rescale_nir);

  // However, clouds are not snow.
  var ndsi = img.normalizedDifference(['green', 'swir1']);
  
  return score.min(rescale(ndsi, 'img', [0.8, 0.6]));
};

var cloudShadowScore = function(img) {
  // Compute several indicators of cloudyness and take the minimum of them.
  var score = ee.Image(1.0);
  
  var rescale_nir = rescale(img, 'img.nir', [1, -.1]);
  score = score.where(img.select('nir').lte(0.02), rescale_nir);
  
  return score;
}

var vegetationScore = function(img) {
  var ndvi = img.normalizedDifference(['nir', 'red'])
  
  // Compute several indicators of cloudyness and take the minimum of them.
  var score = ee.Image(1.0);

  // vegetation
  score = score.min(rescale(ndvi, 'img', [0.3, 0.6]));
  
  return score;
};

function snowScore(img, opt_addLayers){
    var addLayers = opt_addLayers || false;
  
    // Compute several indicators of snowyness and take the minimum of them.
    var score = ee.Image(1.0)//.reproject(crs, crs_transform); 
    
    // Snow is reasonably bright in the blue band.
    score = score.min(rescale(img, 'img.blue', [0.1, 0.3]));
  
    // Snow is reasonably bright in all visible bands.
    score = score.min(rescale(img, 'img.red + img.green + img.blue', [0.2, 0.8]));
  
    // snow reasonably bright in all infrared bands.
    score = score.min(rescale(img, 'img.nir + img.swir1 + img.swir2', [0.2, 0.8]));
  
    // Snow is reasonably cool in temperature.
    //Changed from [300,290] to [290,275] for AK
    score = score.min(rescale(img, 'img.temp', [300, 285]));
    
    // Snow is high in ndsi.
    var ndsi = img.normalizedDifference(['green', 'swir1']);
    ndsi = rescale(ndsi, 'img', [0.5, 0.7]);
    score = score.min(ndsi);
    
    //var addSnowLayers = false;
    if(addLayers) {
      Map.addLayer(rescale(img, 'img.blue', [0.1, 0.3]), {min: 0, max: 1, palette:['000000', 'ffffff']}, 'snow, blue', false);
      Map.addLayer(rescale(img, 'img.red + img.green + img.blue', [0.2, 0.8]), {min: 0, max: 1, palette:['000000', 'ffffff']}, 'snow (rgb)', false);
      Map.addLayer(rescale(img, 'img.nir + img.swir1 + img.swir2', [0.2, 0.8]), {min: 0, max: 1, palette:['000000', 'ffffff']}, 'snow (ir)', false);
      Map.addLayer(rescale(img, 'img.temp', [300, 285]), {min: 0, max: 1, palette:['000000', 'ffffff']}, 'snow (temp)', false);
      Map.addLayer(rescale(ndsi, 'img', [0.5, 0.7]), {min: 0, max: 1, palette:['000000', 'ffffff']}, 'snow (NDSI)', false);
    }

    return score.clamp(0,1).toFloat()
}

var snowThresh = 0.03;//Lower number masks more out (0-1)

function maskSnow(img){
  var ss = snowScore(img)
  return img.mask(img.mask().and(ss.lt(snowThresh)))
}

function getFeature(fc, i) {
  return ee.Feature(fc.toList(1, i).get(0))
}

var pansharpen = function(image) {
    var pan = image.select('pan');
    var rgb = image.select('red', 'green', 'blue');
    var hsv  = rgb.rgbtohsv();
    var huesat = hsv.select('hue', 'saturation');
    var upres = ee.Image.cat(huesat, pan.multiply(2)).hsvtorgb();
 
    return upres;
}

function getPercentileImages(images, percentiles, bandNames) {
  // compute percentiles separately due to timeout; much slower, but scales better
  var percentileImages = ee.List(percentiles).map(function(p) {
    var pp = ee.List([]);
    pp = pp.add(p)
    var percentileImage = images.select(bandNames).reduce(ee.Reducer.percentile(pp))
    return percentileImage.rename(bandNames).set('percentile', p);
  })

/*
  var percentileImages = images.select(bandNames).reduce(ee.Reducer.percentile(percentiles))
  var result = [];
  for(var i = 0; i < percentiles.length; i++) {
    var percentileBandNames = [];
    for(var j = 0; j < bandNames.length; j++) {
      percentileBandNames.push(bandNames[j] + '_p' + percentiles[i])
    }
    
    result.push(percentileImages.select(percentileBandNames).rename(bandNames))
  }
*/  
  return ee.ImageCollection(percentileImages);
}

function radians(img) { return img.toFloat().multiply(3.1415927).divide(180); }

function hillshade(az, ze, slope, aspect) {
  var azimuth = radians(ee.Image(az));
  var zenith = radians(ee.Image(ze));
  return azimuth.subtract(aspect).cos().multiply(slope.sin()).multiply(zenith.sin())
      .add(zenith.cos().multiply(slope.cos()));
}

function hillshadeit(image, elevation, azimuth, zenith, weight, height_multiplier) {
  var hsv  = image.unitScale(0, 255).rgbtohsv();

  var terrain = ee.call('Terrain', elevation.multiply(height_multiplier));
  var slope = radians(terrain.select(['slope']));
  var aspect = radians(terrain.select(['aspect']));
  var hs = hillshade(azimuth, zenith, slope, aspect);

  var intensity = hs.multiply(weight).multiply(hsv.select('value'));
  var huesat = hsv.select('hue', 'saturation');
  
  return ee.Image.cat(huesat, intensity).hsvtorgb();
}

var sumAll = function (a, start, end) {
    var sum = 0;
    for (var i = start; i < end; i++)
        sum += a[i];
    return sum;
};

function otsu(histogram) {
    var total = sumAll(histogram, 0, histogram.length);
    console.log(total)

    var sum = 0;
    for (var i = 1; i < histogram.length; ++i) {
        sum += i * histogram[i];
    }

    var sumB = 0;
    var wB = 0;
    var wF = 0;
    var mB;
    var mF;
    var max = 0.0;
    var between = 0.0;
    var threshold1 = 0.0;
    var threshold2 = 0.0;

    for (var j = 0; j < histogram.length; ++j) {
        wB += histogram[j];
        if (wB == 0)
            continue;

        wF = total - wB;
        if (wF == 0)
            break;
        sumB += j * histogram[j];
        mB = sumB / wB;
        mF = (sum - sumB) / wF;
        between = wB * wF * Math.pow(mB - mF, 2);
        if ( between >= max ) {
            threshold1 = j;
            if ( between > max ) {
                threshold2 = j;
            }
            max = between;            
        }
    }
    return ( threshold1 + threshold2 ) / 2.0;
}

function getSlopeMask(dem, slope_threshold) {
  var slope = radians(ee.call('Terrain', dem).select(['slope']));
  var slopeMask = slope.gt(slope_threshold)
    //.focal_max({radius:90, units: 'meters'}).focal_min({radius:90, units: 'meters'})
  slopeMask = slopeMask.mask(slopeMask)
  
  return slopeMask;
}

var dem = ee.Image('USGS/SRTMGL1_003');
var slope_threshold = 0.3
var slopeMask = getSlopeMask(dem, slope_threshold)

function getWaterThreshold(waterIndexImage, bounds, land, cloud, snow) {
  var waterEdgeDetectionThreshold = 0.99
  var waterEdgeDetectionSigma = 0.7
  var methodScale = 30

  // compute index and edges
  var canny = ee.Algorithms.CannyEdgeDetector(waterIndexImage, waterEdgeDetectionThreshold, waterEdgeDetectionSigma);

  Map.addLayer(canny.mask(canny).clip(bounds), {min: 0, max: 1, palette: 'FF0000'}, 'canny water index', false);

  canny = canny
    .and(slopeMask.mask()/*.focal_max({radius:60, units:'meters'})*/.not()) // edges on slope
    .and(cloud.focal_max({radius:60, units:'meters'}).not()) // edges just near clouds
    .and(snow.focal_max({radius:60, units:'meters'}).not()) // edges just near snow

  Map.addLayer(canny.mask(canny).clip(bounds), {min: 0, max: 1, palette: 'FF0000'}, 'canny water index (no slope)', false);
  
  var cannyBuffer = canny.focal_max(methodScale, 'square', 'meters');
    
  var water_index_canny = waterIndexImage.mask(cannyBuffer)
    .clip(bounds.buffer(-30));

  print(Chart.image.histogram(water_index_canny, bounds, methodScale, 255).setOptions({title: 'around canny', vAxis: { gridlines: { count: 0 } }, hAxis: { gridlines: { count: 0 },viewWindow:{max:-1, min:1} }}));

  var hist_info = water_index_canny.reduceRegion({reducer:ee.Reducer.histogram(255), geometry:bounds, scale:methodScale, maxPixels:1e+9}).getInfo()['nd'];
  var hist = hist_info['histogram'] 
  var threshold_index = otsu(hist)

  var threshold = hist_info['bucketMeans'][Math.round(threshold_index)]; 
  //var threshold = Math.max(0, hist_info['bucketMeans'][Math.round(threshold_index)]); 

  print('water threshold: ' + threshold)
  
  return threshold;
}

function getSimpleEdge(image, bounds) {
  var canny = ee.Algorithms.CannyEdgeDetector(image, 0.99, 0);
  canny = canny.mask(canny).clip(bounds)
  return canny;
}

function printDamInfo(f) {
  print(f)
  print(f.get('DAM_NAME'))
  print(f.get('COUNTRY'))
  print(f.get('YEAR'))
  print(f.get('CATCH_SKM'))
}

function addScores(ic) {
  return ic
    .map(function(img) {
      // Invert the cloudscore so 1 is least cloudy, and rename the band.
      var score = cloudScore(img);

      // add cloud score      
      score = ee.Image(1).subtract(score).select([0], ['cloudscore']);
      img = img.addBands(score);
      
      // add vegetation score
      score = vegetationScore(img).rename(['vegetationscore'])
      img = img.addBands(score);
      
      // add snow score
      score = snowScore(img).rename(['snowscore'])
      img = img.addBands(score)

      return img;
    });
}

// ===========================================================================

var LC8_BANDS = ['B1',    'B2',   'B3',    'B4',  'B5',  'B6',    'B7',    'B8', 'B10'];
var LC7_BANDS = ['B1',    'B1',   'B2',    'B3',  'B4',  'B5',    'B7',    'B8', 'B6_VCID_1'];
var LC5_BANDS = ['B1',    'B1',   'B2',    'B3',  'B4',  'B5',    'B7',    'B1', 'B6'];
var STD_NAMES = ['blue2', 'blue', 'green', 'red', 'nir', 'swir1', 'swir2', 'pan', 'temp'];

l8 = l8.select(LC8_BANDS, STD_NAMES);
l8 = addScores(l8)

l7 = l7.select(LC7_BANDS, STD_NAMES);
l7 = addScores(l7)

l5 = l5.select(LC5_BANDS, STD_NAMES);
l5 = addScores(l5)

function getAllImages(array) {
  var all = ee.ImageCollection([]);
    array.forEach(function(element, index, array) { 
    all = ee.ImageCollection(all.merge(element)); 
  })
  
  return all;
}

/*function getAllImages(bounds, dateStart) {
  function mergeCollections(collections, dateStart, bounds) {
    var images = collections[0]
    for(var i = 1; i < collections.length; i++) {
      images = images.merge(collections[i]
                              .filterBounds(bounds)
                              .filterDate(dateStart, '2020-01-01'))
    }
  
    return ee.ImageCollection(images)
  }

  var images = mergeCollections([l8, l7, l5], dateStart, bounds)
    //.sort('system:time_start')

  return images;
}
*/

var dams = ee.FeatureCollection('ft:1gtV2qZY2sVBpz-_1_1jndm0eJmuvJ7hN6s5ooV9I')
var reservoirs = ee.FeatureCollection('ft:1vvzk6Azsg4ckL619iQnMgTobrsn_5Kcb_umPFYxK')

function addGrandLayers() {
  Map.addLayer(dams, {}, 'dams')
  Map.addLayer(reservoirs, {}, 'reservoirs', false)
}

var vis = {min:0.05, max:[0.5, 0.5, 0.6], gamma:1.0}

function getDamAfter2000() {
  var dams2000 = dams
    .filterMetadata('YEAR', 'greater_than', 2000)
    .sort('YEAR', false)
  
  Map.addLayer(dams2000, {}, 'dams after 2000')
  
  print(dams2000)
  
  //var index = 5; // Canada, Peribonka (snow)
  //var index = 6; // India, Khuga
  //var index = 9; // India, Bansagar Dam (large)
  //var index = 10; // India, Tehri
  //var index = 14; // South Korea, Hoengsong (shallow)
  //var index = 17; // Brazil, Jundiai
  //var index = 20; // Brazil, Manso (large)
  var index = 24; // Iran, Karoon 3
  //var index = 25; // Angola, Capanda
  //var index = 27; // China, Three Gorges Dam
  //var index = 28; // India, Bennithora
  //var index = 29; // Macedonie, Kozjak
  //var index = 30; // Spain, Rules
  //var index = 34; // Brazil (not on Google Map)
  //var index = 38; // China, Jinpen (nice)
  //var index = 39; // China, Xiaolangdi (very nice)
  //var index = 42; // Portugal, Alqueva
  //var index = 45; // Brazil, Cana Brava
  //var index = 50; // Japan, Sannokai
  //var index = 53; // China, Baishi
  
  var dam = getFeature(dams2000, index)
  printDamInfo(getFeature(dams2000, index))
  
  return dam
}

function addPercentileImages(images, percentiles) {
  var bandNames = ['swir1', 'nir', 'green'];
  //var bandNames = STD_NAMES
  var percentileImages = getPercentileImages(images, percentiles, bandNames)

  for(var i = 0; i < 1/*percentiles.length*/; i++) {
    print(percentileImages[i])
    Map.addLayer(ee.Image(percentileImages[i]), vis, percentiles[i] + '%', false)
  }
  
  return images;
}

function analyzeDamsAfter2000(bounds) {
  var maxCloudCover = 5

  var beforeConstruction = ee.Image(l7
      .filterDate('1999-01-01', '2000-01-01') // SRTM flew on Febuary, 2000
      .filterBounds(ee.Geometry(bounds).centroid(1e-5))
      .filterMetadata('CLOUD_COVER', 'not_greater_than', maxCloudCover)
      .first())
  Map.addLayer(beforeConstruction.select(['swir1', 'nir', 'green']), vis, 'before construction')
  
  var beforeConstruction = ee.Image(l5
      .filterDate('1990-01-01', '1995-01-01') // SRTM flew on Febuary, 2000
      .filterBounds(ee.Geometry(bounds).centroid(1e-5))
      .filterMetadata('CLOUD_COVER', 'not_greater_than', maxCloudCover)
      .first())
  Map.addLayer(beforeConstruction.select(['swir1', 'nir', 'green']), vis, 'before construction (L5)', false)

  l8 = l8
      .filterBounds(ee.Geometry(bounds).centroid(1e-5))

  var afterConstruction = ee.Image(l8
      .filterMetadata('CLOUD_COVER', 'not_greater_than', maxCloudCover)
      .toList(1, 1).get(0))
    
  Map.addLayer(snowScore(afterConstruction, true), {palette:['000000', 'ffffff']}, 'snow score')

  Map.addLayer(afterConstruction, {}, 'after construction (raw)', false)

  print(afterConstruction)
  

  Map.addLayer(afterConstruction.select(['swir1', 'nir', 'green']), vis, 'after construction')

  Map.addLayer(pansharpen(afterConstruction), vis, 'after construction (pan)', false)

  return [beforeConstruction, afterConstruction]
}

function addDemScaledToBounds(bounds) {
  var azimuth = 90;
  var zenith = 30;
  
  var dem = ee.Image('USGS/SRTMGL1_003'); var dem_name = 'SRTM 30m'
  //var dem = ee.Image('srtm90_v4');
  //var dem = ee.Image('USGS/NED');
  //var dem = ee.Image('NOAA/NGDC/ETOPO1').select('bedrock');
  //var dem = ee.Image('WWF/HydroSHEDS/03CONDEM');

  // check if we have 30m here, otherwise switch to 90m
  var demMinMax = dem.reduceRegion(ee.Reducer.minMax(), bounds, 10000).getInfo()
/*  dem_min = demMinMax['elevation_min']
  if(dem_min === null) {
    dem = ee.Image('srtm90_v4');
    dem_name = 'SRTM 90m';
  }
*/  
  Map.addLayer(dem, {}, 'dem (raw)', false)
  
  var dem_min = 100;
  var dem_max = 800;
  
  // compute min/max dynamically
  var demMinMax = dem.reduceRegion(ee.Reducer.minMax(), bounds, 300).getInfo()
  dem_min = demMinMax['elevation_min']
  dem_max = demMinMax['elevation_max']
  print('dem min: ' + dem_min)
  print('dem max: ' + dem_max)
  var colors_dem = ['006837', '1a9850', '66bd63', 'a6d96a', 'd9ef8b', 'ffffbf', 'fee08b', 'fdae61', 'f46d43', 'd73027', 'a50026', 'ffffff']
  var v = dem.visualize({palette:colors_dem, min:dem_min, max:dem_max, opacity: 1.0});
  var demRendered = hillshadeit(v, dem, azimuth, zenith, 1.0, 3.0);
  Map.addLayer(demRendered, {}, 'elevation ' + dem_name);
  
  return demRendered;
}

function analyzeCloudsAndWater(bounds, image) {
  var cloudscore = ee.Image(1).subtract(image.select('cloudscore'))
  var vegetationscore = image.select('vegetationscore');
  var snowscore = image.select('snowscore');

  var cloudmask = cloudscore.gt(0)
  var vegetationmask = vegetationscore.gt(0)

  var land = vegetationmask // TODO: add other land types (rocks/sand, buildings, ice/snow?)
  var cloud = cloudmask // TODO: add cloud shadows
  var snow = snowscore.gt(snowThresh)
  
  var water_index = image.normalizedDifference(['green', 'swir1']) // MNDWI
  //var water_index = image.normalizedDifference(['green', 'nir']) // NDWI
  
  var water_index_min = -0.5
  var water_index_max = 0.5
  var water_index_vis = {min: water_index_min, max: water_index_max, palette: ['ffffff', '000000']}
  
  Map.addLayer(water_index, water_index_vis, 'water index (B/W)', false)
  
  var ndvi = image.normalizedDifference(['nir', 'red'])
  var ndvi_vis = {min: -0.5, max: 0.5, palette: ['000000', '00ff00']}
  Map.addLayer(ndvi, ndvi_vis, 'NDVI', false)
  
  var satvi = image.expression('(1 + swir1) * (swir1 - red) / (swir1 + red + L) - swir2 / 2',
    {
      'swir1': image.select('swir1'),
      'swir2': image.select('swir2'),
      'red': image.select('red'),
      'L': 0.5
    }
  )
  var satvi_vis = {min: -0.2, max: 0.2, palette: ['000000', '00ff00']}
  //Map.addLayer(satvi, satvi_vis, 'SATVI', false)

  
  //var threshold = getWaterThreshold(water_index, bounds)  
  
  var threshold = getWaterThreshold(water_index, bounds, land, cloud, snow)  

  var water = water_index.gt(threshold)
    .mask(land.not())
    .mask(cloud.not())
    .mask(snow.not())
  
  var waterEdge = getSimpleEdge(water, bounds)
  
  //var waterEdgeVector = waterEdge.reduceToVectors()
  //Map.addLayer(waterEdgeVector, {}, 'water (boundary), vector')
  
  Map.addLayer(image.select(['swir1', 'nir', 'green']).mask(water).clip(bounds), vis, 'water', false)
  Map.addLayer(water.mask(water).clip(bounds), {palette:'0000ff', opacity: 0.5}, 'water (mask)', false)
  Map.addLayer(waterEdge, {palette:'0000ff'}, 'water (boundary) ', false)
  
  var waterBlobs = water.mask(water)
    //.focal_max({radius:35, kernelType:'square', units:'meters'}) // 
    //.focal_min(90, 'circle', 'meters') // remove small objects
    //.focal_max(90, 'circle', 'meters') // connect small gaps
    .connectedPixelCount(300, true).clip(bounds);
  

  //waterBlobs = waterBlobs.mask(water) 
  
  var blobMinMax = waterBlobs.reduceRegion(ee.Reducer.minMax(), bounds, 30).getInfo()
  var maxBlobNumber = blobMinMax['nd_max']
  Map.addLayer(waterBlobs.mask(water), {min:1, max:maxBlobNumber}, 'water blobs', false);
  
  print('Max blob:', maxBlobNumber)
  var largestBlob = waterBlobs.eq(maxBlobNumber);
  largestBlob = water.mask(largestBlob) // get original water masked by the largest blob
  
  var largestBlobEdge = getSimpleEdge(largestBlob, bounds)
  Map.addLayer(largestBlob, {palette:'0000ff', opacity: 0.5}, 'water, largest blob (mask)')
  Map.addLayer(largestBlobEdge, {palette:'0000ff', opacity: 0.9}, 'water, largest blob (boundary) ')
  
  Map.addLayer(cloudscore.mask(cloudscore), {palette:['ff0000', 'ff0000'], min:0, max:2}, 'cloud score', false);
  
  Map.addLayer(vegetationscore.mask(vegetationscore), {palette:'00ff00'}, 'vegetation score', false)
  Map.addLayer(snowscore, {palette:['000000', 'ffffff'],min:0.0, max:0.5}, 'snow score', false)
  
  Map.addLayer(vegetationmask.mask(vegetationmask), {palette:['00ff00']}, 'vegetation mask', false)
  
  Map.addLayer(cloudmask.mask(cloudmask), {palette:['ff0000']}, 'cloud mask', false);

  Map.addLayer(snow.mask(snow), {palette:['ffffff']}, 'snow mask', false);
}

// select and analyze GranD dam
function analyzeGranD() {
  var zoomLevel = 12
  var dam = getDamAfter2000()
  //Map.centerObject(dam, zoomLevel)
  var bounds = ee.Geometry(Map.getBounds(true))
  
  var images = analyzeDamsAfter2000(bounds)
  var beforeConstruction = images[0]
  var afterConstruction = images[1]

  var percentiles = [10, 20, 30, 40, 50, 60, 70, 80, 90]
  var percentileImages = addPercentileImages(l8, percentiles)

  var useRealImage = true;
  
  if(useRealImage) {
    var image = afterConstruction;
    var cloudscore = ee.Image(1).subtract(image.select('cloudscore'))
    var vegetationscore = image.select('vegetationscore');
  } else {
    var image = percentileImages[0]
    var cloudscore = ee.Image(0)
    var vegetationscore = vegetationScore(image);
  }
  
  addDemScaledToBounds(bounds)

  analyzeCloudsAndWater(bounds, image)
}

function analyzeCustomReservoir() {
  var feature = customReservoirs_Andijan;
  //var feature = customReservoirs_BullLake
  //var feature = customReservoirs_CanyonFerry
  //var feature = customReservoirs_Chardara
  //var feature = customReservoirs_Charvak
  //var feature = customReservoirs_Kayrakkum
  //var feature = customReservoirs_Nurek
  //var feature = customReservoirs_Seminoe
  //var feature = customReservoirs_Toktogul
  
  
  var reservoir = feature.get('name').getInfo();
  var year = feature.get('year').getInfo();
  var country = feature.get('country');
  var scale = feature.get('scale').getInfo();
  var zoom = feature.get('zoom').getInfo();
  
  //Map.setCenter(50.09, 31.8, 12)

  var useMap = true;
  //var useMap = false;
  if(useMap) {
    feature = ee.Feature(Map.getBounds(true));
    reservoir = '-'
    year = 2005
    country = '-'
    scale = 30
    zoom = 12
    var bounds = ee.Geometry(Map.getBounds(true))
  } else {
    Map.centerObject(feature, zoom)
    var bounds = feature.geometry().bounds().buffer(1000).bounds();
  }

  print('reservoir:', reservoir)
  print('country:', country)
  print('year: ', year)
  print('zoom: ', zoom)

  var demRendered = addDemScaledToBounds(bounds)
  
  var prefix = ''
  
  //var suffix = '_l5'
  //var suffix = '_l7'
  var suffix = '_l8'
  //var suffix = '_l7_8'
  //var suffix = '_all'
  
  //var ic = l7
  var ic = l8
  //var ic = getAllImages([l8, l7])
  //var ic = getAllImages([l8, l7, l5])
      //.filterBounds(Map.getBounds(true))
      .filterBounds(feature.geometry())
      //.filterDate('2013-06-01', '3000-01-01')
      .filterDate(year + '-01-01', '3000-01-01')
      //.filterMetadata('CLOUD_COVER', 'not_greater_than', 80)
      .select(['swir1', 'nir', 'green', 'red', 'cloudscore', 'vegetationscore', 'snowscore'])
      .sort('DATE_ACQUIRED')
  
  var background = ee.Image(1).visualize({palette:['ffffff']})
  
  print(ic)
  print('Number of images: ', ic.aggregate_count('system:index'))
  
  var showLabels = false
  var showOnMap = true
  var showOnMapStart = 0
  var showOnMapCount = 10
  exportImagesToVideo(ic, bounds, prefix + reservoir + suffix + '_' + zoom + '_' + scale, background, scale, showLabels, showOnMap, showOnMapStart, showOnMapCount)
  
  var bandNames = ['swir1', 'nir', 'green']
  
  var percentiles = ee.List([10]).getInfo()
  //var percentiles = ee.List.sequence(1, 100, 1).getInfo()
  //var percentiles = ee.List.sequence(1, 20, 1)
  var icPercentiles = getPercentileImages(ic, percentiles, bandNames)
    .sort('percentile')
  
  var showLabels = false
  suffix =  '_precentiles' + suffix
  exportImagesToVideo(icPercentiles, bounds, reservoir + suffix + '_' + zoom + '_' + scale, background, scale, showLabels)

  Map.addLayer(feature, {}, 'reservoir region', false)

  function showCount() {
    var count = ic.select(0).count();
    var scale = 1000;
    var minMax = count.reduceRegion(ee.Reducer.minMax(), bounds, scale)
    var min = minMax.get(minMax.keys().get(1)).getInfo()
    var max = minMax.get(minMax.keys().get(0)).getInfo()
    
    print('min: ' + min)
    print('min: ' + max)
  
    print(Chart.image.histogram(count, bounds, scale))
    
    Map.addLayer(count, {min:min, max:max}, 'count', false)
  }
  
  //showCount()

  print('Number of images: ', ic.aggregate_count('system:index'))
  
  function addFirstLastImagesToMap() {
    var asc = ic.sort('DATE_ACQUIRED').select(['swir1', 'nir', 'green'])
    var desc = ic.sort('DATE_ACQUIRED', false).select(['swir1', 'nir', 'green'])
    
    function addLayerByIndex(images, index, name) {
      var image = ee.Image(images.toList(1, index).get(0))
      Map.addLayer(image, vis, name, false)
    }
    
    exportImagesToVideo(asc, bounds, name, demRendered)
    
    addLayerByIndex(desc, 0, 'last');
    addLayerByIndex(desc, 1, 'last - 1');
    addLayerByIndex(desc, 2, 'last - 2');
    addLayerByIndex(asc, 2, 'first + 2');
    addLayerByIndex(asc, 1, 'first + 1');
    addLayerByIndex(asc, 0, 'first');
    
    print(asc.first());
  }
  
  // addFirstLastImagesToMap();

  function imageToFeature(i) {
    var geom = i.geometry();

    var f = ee.Feature(geom);
    
    f = f.set('scene', i.get('LANDSAT_SCENE_ID'))
    f = f.set('time', i.get('DATE_ACQUIRED'))

    return f;
  }
  
  Export.table(ic.map(imageToFeature), reservoir + suffix, {fileFormat:'GeoJSON'})

  var index = 2
  var image = ee.Image(ic.toList(1, index).get(0))
  
  analyzeCloudsAndWater(bounds, image)
}

analyzeGranD()

//analyzeCustomReservoir()

Map.addLayer(slopeMask, {opacity:0.7, palette:['000000']}, 'slope > ' + slope_threshold, false);

print('Map center: ', Map.getCenter())
print('Map scale: ', Map.getScale())

addGrandLayers()

