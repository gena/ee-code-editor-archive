/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var geometry = /* color: #d63000 */ee.Geometry.Polygon(
        [[[77.37523951366927, 12.541176099711334],
          [77.34920899428641, 13.193087907162527],
          [76.61872336677948, 13.12359705269376],
          [76.61869247222205, 12.54392165568901]]]),
    geometry2 = /* color: #98ff00 */ee.Geometry.LineString(
        [[77.57171630859375, 12.447304850701258],
         [78.59893798828125, 13.223903512667825]]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
var app = function() {
  //Load landsat 7
  var l7rf = ee.Image('LANDSAT/LE7_L1T/LE71440512001014SGS00')
  var real = {"opacity":1,"bands":["B1","B4","B7"]};//rea
  //Map.setCenter(77.40, 13.14, 8);
  Map.addLayer(l7rf,{},'raw');
  //print("Filtered image", l7rf)
  
  var extent = l7rf.geometry();
  //Map.addLayer(extent, {},'extent')
  
  //elevation of weather station
  var z_sl= 921;
  var Press=101.3*((293-0.0065*z_sl)/293)^5.26;
  
  //NDVI thresholds
  var ndviM=0.5; //cold zone veg. cover 100%
  var ndvim=0.2; //hot zone veg. cover 0%
  
  var pi=3.141516;
  
  var date=ee.Date(l7rf.get('system:time_start'));
  //print(date)
  var doy=date.getRelative('day', 'year');
  
  //*******************************************************************************
  //  Cloud masking using fmask
  //*******************************************************************************
    //Load data with Fmask
    //https://explorer.earthengine.google.com/#detail/LANDSAT%2FLE7_L1T_TOA_FMASK
    var fmask = ee.Image('LANDSAT/LE7_L1T_TOA_FMASK/LE71440512001014SGS00');
    //Map.addLayer(fmask, {}, 'fmask')  
    //where pixel values are 0=clear, 1=water, 2=shadow, 3=snow, 4=cloud
    var data = fmask.select('fmask');
    var cloudMask = data.lt(2);  //filter clear and water areas
    var raw = l7rf.updateMask(cloudMask);
  
    
  //*******************************************************************************
  //  Incoming shortwave radiation, R.ins
  //*******************************************************************************
    var theta=ee.Number(90).subtract(ee.Number(raw.get('SUN_ELEVATION'))).multiply(ee.Number(2*pi/360)); //Sun incidence angle
    var dr=ee.Number(1).add(ee.Number(doy.multiply(ee.Number(2*pi/365))).cos().multiply(ee.Number(0.033)));
    var tau_sw=0.75+0.00002*z_sl; //Atmosperic transmissivity
    var R_ins = ee.Number(1367).multiply(theta.cos()).multiply(dr).multiply(tau_sw);
    //print(R_ins)
  
  //*******************************************************************************    
  //  Radiance
  //*******************************************************************************
    var L1=raw.expression('G*DN+B',{'G':ee.Number(raw.get('RADIANCE_MULT_BAND_1')),'DN':raw.select('B1'),'B':ee.Number(raw.get('RADIANCE_ADD_BAND_1'))});
    var L2=raw.expression('G*DN+B',{'G':ee.Number(raw.get('RADIANCE_MULT_BAND_2')),'DN':raw.select('B2'),'B':ee.Number(raw.get('RADIANCE_ADD_BAND_2'))});
    var L3=raw.expression('G*DN+B',{'G':ee.Number(raw.get('RADIANCE_MULT_BAND_3')),'DN':raw.select('B3'),'B':ee.Number(raw.get('RADIANCE_ADD_BAND_3'))});
    var L4=raw.expression('G*DN+B',{'G':ee.Number(raw.get('RADIANCE_MULT_BAND_4')),'DN':raw.select('B4'),'B':ee.Number(raw.get('RADIANCE_ADD_BAND_4'))});
    var L5=raw.expression('G*DN+B',{'G':ee.Number(raw.get('RADIANCE_MULT_BAND_5')),'DN':raw.select('B5'),'B':ee.Number(raw.get('RADIANCE_ADD_BAND_5'))});
    var L7=raw.expression('G*DN+B',{'G':ee.Number(raw.get('RADIANCE_MULT_BAND_7')),'DN':raw.select('B7'),'B':ee.Number(raw.get('RADIANCE_ADD_BAND_7'))});
    var L8=raw.expression('G*DN+B',{'G':ee.Number(raw.get('RADIANCE_MULT_BAND_8')),'DN':raw.select('B8'),'B':ee.Number(raw.get('RADIANCE_ADD_BAND_8'))});
    var r1=L1.expression('pi*L/(ESUN*cos(th)*dr)',{'pi':pi,'L':L1,'ESUN':1970,'th':theta,'dr':dr});
    var r2=L2.expression('pi*L/(ESUN*cos(th)*dr)',{'pi':pi,'L':L2,'ESUN':1842,'th':theta,'dr':dr});
    var r3=L3.expression('pi*L/(ESUN*cos(th)*dr)',{'pi':pi,'L':L3,'ESUN':1547,'th':theta,'dr':dr});
    var r4=L4.expression('pi*L/(ESUN*cos(th)*dr)',{'pi':pi,'L':L4,'ESUN':1044,'th':theta,'dr':dr});
    var r5=L5.expression('pi*L/(ESUN*cos(th)*dr)',{'pi':pi,'L':L5,'ESUN':225.7,'th':theta,'dr':dr});
    var r7=L7.expression('pi*L/(ESUN*cos(th)*dr)',{'pi':pi,'L':L7,'ESUN':82.06,'th':theta,'dr':dr});
    var r8=L8.expression('pi*L/(ESUN*cos(th)*dr)',{'pi':pi,'L':L8,'ESUN':1369,'th':theta,'dr':dr});
  
  //*******************************************************************************
  //  NDWI and NDVI
  //*******************************************************************************
  //NDVI - Normalized Difference Vegetation Index
    var ndvi=r4.expression('(r4-r3)/(r4+r3)',{'r4':r4,'r3':r3});  
  //Map.addLayer(ndvi, {}, 'ndvi')
  
    var ndviPv=ndvi.multiply(ndvi.lt(ndviM).multiply(ndvi.gt(ndvim))).add(ndvi.gt(ndviM).multiply(ndviM)).add(ndvi.lt(ndvim).multiply(ndvim));
    var pv=ndviPv.expression("((N-ndvim)/(ndviM-ndvim))*((N-ndvim)/(ndviM-ndvim))",{'N':ndviPv, 'ndviM': ndviM, 'ndvim': ndvim});
    var em = pv.multiply(0.004).add(0.986);//
    
    
    //Land surface temperature
    var sigma=5.6697e-08;
    var Qm=ee.Number(raw.get('QUANTIZE_CAL_MIN_BAND_6_VCID_1'));
    var QM=ee.Number(raw.get('QUANTIZE_CAL_MAX_BAND_6_VCID_1'));
    var LM=ee.Number(raw.get('RADIANCE_MAXIMUM_BAND_6_VCID_1'));
    var Lm=ee.Number(raw.get('RADIANCE_MINIMUM_BAND_6_VCID_1'));
    var L6=raw.expression('(LM-Lm)/(QM-Qm)*(Th-Qm)+Lm',{'LM':LM,'Lm':Lm,'Qm':Qm,'QM':QM,'Th':raw.select(['B6_VCID_1'])});
    var T_b=L6.expression('K2/log(K1/L6+1)',{'K2':1282.71,'K1':666.09 ,'L6':L6}); //K1=607.76 , K2=1260.56 for L5
    var LST = T_b.expression('T_b/ (1+(lemit*T_b/a)*c)-273.15',{'T_b':T_b,'lemit':11.335e-06,'a':0.0143,'c':em.log()}); //lemit= 11.435e-06 for L5
  
  Map.addLayer(ndvi, {min:-1, max:+1}, 'ndvi')
  Map.addLayer(LST, {min:15, max:65}, 'temp')


  // make 2-band image and pass plot it  
  var image = LST.unitScale(15, 35).rename('temp')
    .addBands(ndvi.unitScale(-1, 1).rename('ndvi'))
  
  var images = ee.ImageCollection.fromImages([image])
  
  var plotArea = geometry2.bounds()
  var plot = new community.Charts.Scatter(Map, plotArea);
  plot.plotArea() // area + grid
  plot.samplingScale = 30 // m
  plot.pointSize = 300

  //var samplingArea = geometry
  var samplingArea = ee.FeatureCollection.randomPoints(geometry, 25000)
  Map.addLayer(ee.Image().paint(samplingArea, 1, 1), {palette:['ffff00']}, 'sampling locations')

  //var renderBands = ['temp']
  //var renderVis = {palette:['0000ff', 'ffff00', 'ff0000']}

  var renderBands = ['ndvi'] 
  var renderVis = {palette:['a6611a', 'dfc27d', 'f5f5f5', '80cdc1', '018571']}
  plot.plotValues(images, samplingArea, ['temp', 'ndvi'], renderBands, renderVis, 'temp vs ndvi')
}


/***
 * Charting
 */
var community = { Charts: {} }

/***
 * Constructor.
 */
community.Charts.Scatter = function(map, bounds) {
  this.bounds = bounds 
  this.map = map       
  this.vranges = {xmin: 0, xmax: 1, ymin: 0, ymax: 1}   
  this.pointSize = 30 // meters
  this.samplingScale = 30
}

community.Charts.Scatter.prototype.getCorners = function() {
  return {
    ll: ee.List(ee.List(this.bounds.coordinates().get(0)).get(0)),
    ur: ee.List(ee.List(this.bounds.coordinates().get(0)).get(2))
  }
}

community.Charts.Scatter.prototype.getOrigin = function() {
  var xy = this.getCorners().ll
  return {x: ee.Number(xy.get(0)), y: ee.Number(xy.get(1))}
}

community.Charts.Scatter.prototype.getWidth = function() {
  var v = this.getCorners()
  return ee.Number(v.ur.get(0)).subtract(v.ll.get(0))
}

community.Charts.Scatter.prototype.getHeight = function() {
  var v = this.getCorners()
  return ee.Number(v.ur.get(1)).subtract(v.ll.get(1))
}

/***
 * plot area + grid
 */
community.Charts.Scatter.prototype.plotArea = function() {
  // grid
  this.renderGrid()
  
  // area
  var bg = ee.Image().int().paint(this.bounds, 1)
  this.map.addLayer(bg.focal_max(1, 'square'), {palette:['000000']}, ' area', true, 0.85)
} 

/***
 * plot values
 */
community.Charts.Scatter.prototype.plotValues = function(collection, region, axesBands, renderBands, vis, name, opt_visible) {
  var visible = (typeof opt_visible === 'undefined');
  
  var wgs84 = ee.Projection('EPSG:4326');
  
  var w = this.getWidth()
  var h = this.getHeight()

  var origin = this.getOrigin()
  
  var vr = this.vranges
  var xr = vr.xmax - vr.xmin
  var yr = vr.ymax - vr.ymin
  
  var pointSize = this.pointSize
  
  var values = collection.getRegion(region, this.samplingScale).slice(1)

  var bandNames = ee.Image(collection.first()).bandNames()
  var bandX = axesBands[0]
  var bandY = axesBands[1]
  var indexX = bandNames.indexOf(bandX)
  var indexY = bandNames.indexOf(bandY)

  var features = values.map(function(o) {
    o = ee.List(o).slice(4)
    var vx = o.get(indexX)
    var vy = o.get(indexY)
      
    // fix empty :(
    vx = ee.Algorithms.If(ee.Algorithms.IsEqual(vx, null), 0, vx)
    vy = ee.Algorithms.If(ee.Algorithms.IsEqual(vy, null), 0, vy)
  
    var x = ee.Number(vx).multiply(w).divide(xr).add(origin.x)
    var y = ee.Number(vy).multiply(h).divide(yr).add(origin.y)
    
    var g = ee.Algorithms.GeometryConstructors.Point([x, y])

    return ee.Feature(g, ee.Dictionary.fromLists(bandNames, o))
  })
  
  features = ee.FeatureCollection(features)
  
  if(renderBands.length === 1) {
    var image = ee.Image().float().paint(features, renderBands[0])
  } else {
    var image = features.reduceToImage(renderBands, ee.Reducer.max(3))
  }
  
  image = image.reproject('EPSG:3857', null, this.pointSize)

  this.map.addLayer(image, vis, name + ' values', visible)
}

/***
 * render grid
 */
community.Charts.Scatter.prototype.renderGrid = function(ic, points, bandX, bandY) {
  var ll = this.getCorners().ll
  var origin = ee.Image.constant(ll.get(0)).addBands(ee.Image.constant(ll.get(1)))

  var grid = ee.Image.pixelLonLat()
    .subtract(origin)
    .divide([this.getWidth(), this.getHeight()]).multiply([10, 10])
    .toInt().reduce(ee.Reducer.sum()).bitwiseAnd(1)
    .clip(this.bounds)
  
  this.map.addLayer(grid, {min:0, max:1}, 'grid')
}


app()