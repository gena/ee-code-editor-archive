/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var l8 = ee.ImageCollection("LANDSAT/LC8_L1T_TOA"),
    l7 = ee.ImageCollection("LANDSAT/LE7_L1T_TOA"),
    l5 = ee.ImageCollection("LANDSAT/LT5_L1T_TOA"),
    customReservoirs_Andijan = /* color: d63000 */ee.Feature(
        ee.Geometry.Polygon(
            [[[73.03688323935432, 40.779259898260655],
              [73.09589278155818, 40.71064216741924],
              [73.16450152503637, 40.710403060431965],
              [73.202597955496, 40.73404645349448],
              [73.21597211270932, 40.80264511225435],
              [73.19006540107353, 40.836345714681656],
              [73.09316151380551, 40.81044518778853]]]),
        {
          "name": "Andijan",
          "country": "Uzbekistan",
          "year": 1969,
          "zoom": 12,
          "scale": 30,
          "system:index": "0"
        }),
    customReservoirs_BullLake = /* color: 98ff00 */ee.Feature(
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
    customReservoirs_CanyonFerry = /* color: 0B4A8B */ee.Feature(
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
    customReservoirs_Chardara = /* color: ffc82d */ee.Feature(
        ee.Geometry.Polygon(
            [[[68.50754353224352, 40.989078433161104],
              [68.63357535029513, 41.05079604219915],
              [68.57265043979487, 41.102760985803116],
              [68.3875557804638, 41.153075316734885],
              [68.21767409055121, 41.2351808950402],
              [67.94046122001771, 41.29800876823261],
              [67.82546997070312, 41.21895280774118],
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
    customReservoirs_Charvak = /* color: 00ffff */ee.Feature(
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
    customReservoirs_Kayrakkum = /* color: bf04c2 */ee.Feature(
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
    customReservoirs_Nurek = /* color: ff0000 */ee.Feature(
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
    customReservoirs_Seminoe = /* color: 00ff00 */ee.Feature(
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
    customReservoirs_Toktogul = /* color: 0000ff */ee.Feature(
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
        });
/***** End of imports. If edited, may not auto-convert in the playground. *****/
function getPercentileImages(images, percentiles, bandNames) {
  var percentileImages = images.select(bandNames).reduce(ee.Reducer.percentile(percentiles))
  var result = [];
  for(var i = 0; i < percentiles.length; i++) {
    var percentileBandNames = [];
    for(var j = 0; j < bandNames.length; j++) {
      percentileBandNames.push(bandNames[j] + '_p' + percentiles[i])
    }
    
    result.push(percentileImages.select(percentileBandNames).rename(bandNames))
  }
  
  return ee.ImageCollection(result);
}

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

function exportImagesToVideo(images, fileName, background, scale, showLabels) {
  var bounds = Map.getBounds();
  print(bounds)

  var I_min = 0.05
  var I_max = 0.4
  var gamma = 2.0

  var rendered = images.map(function(i){
    var rgb = i.visualize({gamma:gamma, min:I_min, max:I_max})
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

  var count = 10
  
  var list = rendered.toList(count, 0);
  for(var i = 0; i < count; i++) {
    Map.addLayer(ee.Image(list.get(i)), {}, i.toString(), i === 0);
  }

  var region = '[['+bounds[0]+', '+bounds[1]+'], ['+bounds[2]+', '+bounds[1]+'], ['+bounds[2]+', '+bounds[3]+'], ['+bounds[0]+', ' + bounds[3] + ']]';
  
  var geom = ee.Geometry(Map.getBounds(true))
  var coords = ee.List(geom.bounds(1, ee.Projection('EPSG:3857')).coordinates().get(0)).getInfo()
  var w = Math.round((coords[1][0] - coords[0][0])/scale)
  var h = Math.round((coords[2][1] - coords[1][1])/scale)
  print(w + 'x' + h)
  
  Export.video(rendered, fileName.replace(' ', ''), {dimensions: w + 'x' + h, framesPerSecond: 1, region: region});
}

function getAllImages(array) {
  var all = ee.ImageCollection([]);
    array.forEach(function(element, index, array) { 
    all = ee.ImageCollection(all.merge(element)); 
  })
  
  return all;
}

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

print('reservoir:', reservoir)
print('country:', country)
print('year: ', year)
print('zoom: ', zoom)

Map.centerObject(feature, zoom)


var LC8_BANDS = ['B1',    'B2',   'B3',    'B4',  'B5',  'B6',    'B7',    'B8', 'B10'];
var LC7_BANDS = ['B1',    'B1',   'B2',    'B3',  'B4',  'B5',    'B7',    'B8', 'B6_VCID_1'];
var LC5_BANDS = ['B1',    'B1',   'B2',    'B3',  'B4',  'B5',    'B7',    'B1', 'B6'];
var STD_NAMES = ['blue2', 'blue', 'green', 'red', 'nir', 'swir1', 'swir2', 'pan', 'temp'];

l8 = l8.select(LC8_BANDS, STD_NAMES);
l7 = l7.select(LC7_BANDS, STD_NAMES);
l5 = l5.select(LC5_BANDS, STD_NAMES);

var bounds = Map.getBounds(true)

var prefix = ''

//var suffix = '_l5'
var suffix = '_l7'
//var suffix = '_l8'
//var suffix = '_all'

var ic = l7
//var ic = getAllImages([l8, l7, l5])
    //.filterBounds(Map.getBounds(true))
    .filterBounds(feature.geometry())
    .filterDate((year - 1) + '-01-01', '3000-01-01')
    //.filterMetadata('CLOUD_COVER', 'not_greater_than', 80)
    .select(['swir1', 'nir', 'green'])
    .sort('DATE_ACQUIRED')

var background = ee.Image(1).visualize({palette:['ffffff']})

print(ic)
print('Number of images: ', ic.aggregate_count('system:index'))

var showLabels = false
//exportImagesToVideo(ic, prefix + reservoir + suffix + '_' + zoom + '_' + scale, background, scale, showLabels)

var bandNames = ['swir1', 'nir', 'green']

var percentiles = ee.List.sequence(1, 100, 1).getInfo()
var ic = getPercentileImages(ic, percentiles, bandNames)

print(ic.first())

var showLabels = false
var prefix = 'precentiles_'
exportImagesToVideo(ic, prefix + reservoir + suffix + '_' + zoom + '_' + scale, background, scale, showLabels)
