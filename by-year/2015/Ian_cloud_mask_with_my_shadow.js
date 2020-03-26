var sa = ee.Geometry.Point([-110.72021484375,40.44694705960048])
var vizParamsCO1 = {'min': 0.05,'max': [0.3,0.6,0.35],   'bands':'swir1,nir,red'};
var vizParamsCO2 = {'min': 0.15,'max': [0.35,0.8,0.4],   'bands':'swir1,nir,red', 'gamma': 1.6};
var vizParamsCO3 = {'min': 0.05,'max': [0.3,0.4,0.4],   'bands':'swir1,nir,red', 'gamma':1.6};
var vizParamsFalse = {'min': 0.1,'max': [0.3,0.3,0.3],   'bands':'nir,swir1,red'};
var vizParamsViz = {'min': 0.05, 'max': 0.3,'bands': 'red,green,blue', 'gamma': 1.6};
var vizParams = vizParamsCO3;
var bandNames = ee.List(['blue','green','red','nir','swir1','temp','swir2']);
  var sensor_band_dict =ee.Dictionary({L8 : ee.List([1,2,3,4,5,9,6]),
                        L7 : ee.List([0,1,2,3,4,5,7]),
                        L5 : ee.List([0,1,2,3,4,5,6]),
                        L4 : ee.List([0,1,2,3,4,5,6])
  });
  
//Helper function to not have to use EE list object
//Works al la range in Python 
function range(start, stop, step){
  // start = parseInt(start);
  // stop = parseInt(stop);
    if (typeof stop=='undefined'){
        // one param defined
        stop = start;
        start = 0;
    };
    if (typeof step=='undefined'){
        step = 1;
    };
    if ((step>0 && start>=stop) || (step<0 && start<=stop)){
        return [];
    };
    var result = [];
    for (var i=start; step>0 ? i<stop : i>stop; i+=step){
        result.push(i);
    };
    return result;
};

//////////////////////////////////////////////////
var cloudThresh = 20;
var startYear = 2005;
var endYear = 2005;
var compositingPeriod = 2;
var startJulian = 190;
var endJulian = 200;
var indexName = 'NBR';
var waterThresh = 0.05;

var zShadowThresh = -1;
var spikeThresh = 0.1;//Threshold for how much time series can change in successive years (i.e. 0.1 means timeseries cannot rise and fall or fall and rise more than that)
///////////////////////////////////////////////////
var startDate = ee.Date.fromYMD(startYear,1,1);
var endDate = ee.Date.fromYMD(endYear,12,31);

///////////////////////////////////////////////////

var l5s = ee.ImageCollection('LT5_L1T_TOA')
                  .filterDate(startDate,endDate)
                  .filter(ee.Filter.calendarRange(startJulian,endJulian))
                  .filterBounds(sa)
                  // .select(sensor_band_dict.get('L5'),bandNames)
var l5 = ee.Image(l5s.first())
Map.addLayer(l5.select(sensor_band_dict.get('L5'),bandNames),vizParams,'Orig')

function cloudMask(img,dilatePixels){
    var t = img
    var cs = ee.Algorithms.Landsat.simpleCloudScore(img).select('cloud')
    var out = img.mask().reduce(ee.Reducer.min()).and(cs.lt(cloudThresh)).not()
    out = out.mask(out)
    out = out.focal_max(dilatePixels)
    return ee.Image(out.copyProperties(t))
}

function projectShadows(cloudMask,image, meanAzimuth,offset,dilatePixels){
  var darkPixels = image.select(['nir','swir1']).lt(0.15).reduce(ee.Reducer.sum()).eq(2);

  
  var azimuth =ee.Number(meanAzimuth) .multiply(Math.PI).divide(180.0).add(ee.Number(0.5).multiply(Math.PI ))
  var x = azimuth.cos().multiply(10.).round();
  var y = azimuth.sin().multiply(10.).round();
  var shadow = cloudMask.changeProj(cloudMask.projection(), cloudMask.projection().translate(x.multiply(ee.Number(offset)), y.multiply(ee.Number(offset))))
  shadow = shadow.mask(shadow.mask().and(cloudMask.mask().not()))
  shadow = shadow.focal_max(dilatePixels)
  shadow = shadow.mask(shadow.mask().and(darkPixels))
  return shadow
}

var m = cloudMask(l5,1);
l5 = l5.select(sensor_band_dict.get('L5'),bandNames)
var azimuthField = 'SUN_AZIMUTH';
// print(m.get('SUN_ELEVATION'))
var shadows = projectShadows(m,l5, m.get(azimuthField),5,15);
Map.addLayer(m,{'min':1,'max':1,'palette':'2ffff5'},'clouds')
Map.addLayer(shadows,{'min':1,'max':1,'palette':'404040'},'shadows')


