/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var sa = /* color: 98ff00 */ee.Geometry.Polygon(
        [[[-60.278887782005995, 60.50311200859714],
          [-39.734124149675495, 58.18237530466364],
          [-38.29324294416898, 60.29599666484623],
          [-58.56127165894793, 62.42067144893329],
          [-60.42517974874892, 60.977442639127986]]]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
//Written by: Ian Housman
//and Carson Stam

//Purpose: Mask clouds and cloud shadows in Landsat data and export composite

//RedCastle Resources, Inc.

//Working onsite at:
//USDA Forest Service
//Remote Sensing Applications Center (RSAC)
//2222 West 2300 South
//Salt Lake City, UT 84119
//Office: (801) 975-3366
//Email: ihousman@fs.fed.us or castam@fs.fed.us
//RSAC FS Intranet website: http://fsweb.rsac.fs.fed.us/
//RSAC FS Internet website: http://www.fs.fed.us/eng/rsac/
/////////////////////////////////////////////////////////////////
//Project funding source: Operational Remote Sensing project in partnership with the 
//Forest Health Technology Enterprise Team
///////////////////////////////////////////////////////////////////////////////

//Convert geometry to geoJSON for downloading
var regionJSON = sa.toGeoJSONString();
///////////////////////////////////////////////////////////////////

//Some visualization parameters for stretching Landsat-like images
var vizParamsCO1 = {'min': 0.05,'max': [0.3,0.6,0.35],   'bands':'swir1,nir,red'};
var vizParamsCO2 = {'min': 0.15,'max': [0.35,0.8,0.4],   'bands':'swir1,nir,red', 'gamma': 1.6};
var vizParamsCO3 = {'min': 0.05,'max': [0.3,0.4,0.4],   'bands':'swir1,nir,red', 'gamma':1.6};
var vizParamsFalse = {'min': 0.1,'max': [0.3,0.3,0.3],   'bands':['nir','swir1','green']};
var vizParamsRGB = {'min': 0.05, 'max': 0.3,'bands': ['red','green','blue'], 'gamma': 1.6};
var vizParams = vizParamsRGB;

/////////////////////////////////////////////////////////////////////////
//Common band names
var bandNames = ee.List(['blue','green','red','nir','swir1','temp','swir2']);
var bandNumbers = [0,1,2,3,4,5,6];
//////////////////////////////////////////////////////////////
//Band combinations for each sensor corresponding to final selected corresponding bands                        
  var sensor_band_dict =ee.Dictionary({L8 : ee.List([1,2,3,4,5,9,6]),
                        L7 : ee.List([0,1,2,3,4,5,7]),
                        L5 : ee.List([0,1,2,3,4,5,6]),
                        L4 : ee.List([0,1,2,3,4,5,6])
  });
////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////
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


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//Function to rescale image between 0 and 1
function rescale(img, exp, thresholds) {
    return img.expression(exp, {img: img})
        .subtract(thresholds[0]).divide(thresholds[1] - thresholds[0]);
  };
/////////////////////////////////////////////////////////////
//Function to compute the "snowiness" of a pixel
//Uses most logic from the Google cloud score algorithm
//Calibrated in AK so may need calibration if used elsewhere
function snowScore(img){
      // Compute several indicators of snowyness and take the minimum of them.
      var score = ee.Image(1.0);
      // Snow is reasonably bright in the blue band.
      score = score.min(rescale(img, 'img.blue', [0.1, 0.3]));
    
      // Snow is reasonably bright in all visible bands.
      score = score.min(rescale(img, 'img.red + img.green + img.blue', [0.2, 0.8]));
    
      // // Excluded this for snow reasonably bright in all infrared bands.
      // score = score.min(
      //     rescale(img, 'img.nir + img.swir1 + img.swir2', [0.3, 0.8]));
    
      // Snow is reasonably cool in temperature.
      //Changed from [300,290] to [290,275] for AK
      score = score.min(rescale(img, 'img.temp', [300, 285]));
      
      
       // Snow is high in ndsi.
      var ndsi = img.normalizedDifference(['green', 'swir1']);
      ndsi = rescale(ndsi, 'img', [0.5, 0.7]);
      score = score.min(ndsi);
      
      return score.clamp(0,1)
      
      }
////////////////////////////////////////////////////// 
//Algorithm to compute liklihood of water
//Builds on logic from Google cloudScore algorithm
function waterScore(img){
      // Compute several indicators of water and take the minimum of them.
      var score = ee.Image(1.0);
      
      
      //Set up some params
      var darkBands = ['green','red','nir','swir2','swir1'];//,'nir','swir1','swir2'];
      var brightBand = 'blue';
      var shadowSumBands = ['nir','swir1','swir2'];
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
      

      // // Water is at or above freezing
      score = score.min(rescale(img, 'img.temp', [273, 275]));
      
      
      // // Water is nigh in ndsi (aka mndwi)
      var ndsi = img.normalizedDifference(['green', 'swir1']);
      ndsi = rescale(ndsi, 'img', [0.3, 0.8]);
      
      
      score = score.min(ndsi);
      
      return score.clamp(0,1)
      
      }
//////////////////////////////////////////////////////////////////////////
//Helper functions for masking snow and water
//Thresholds between 0-1 where lower number masks more out
//////////////////////////////////////////////////////////////////
function maskSnow(img){
  var ss = snowScore(img)
  return img.mask(img.mask().and(ss.lt(snowThresh)))
}
//////////////////////////////////////////////////////////////////
function maskWater(img){
  var ws = waterScore(img)
  return img.mask(img.mask().and(ws.lt(waterThresh)))
}
/////////////////////////////////////////////////////////////////
//Basic cloud busting function
function bustClouds(img){
    var t = img
    var cs = ee.Algorithms.Landsat.simpleCloudScore(img).select('cloud')
    var out = img.mask(img.mask().and(cs.lt(cloudThresh)))
    return out.copyProperties(t)
}
////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////
//Function to handle empty collections that will cause subsequent processes to fail
//If the collection is empty, will fill it with an empty image
function fillEmptyCollections(inCollection,dummyImage){                       
  var dummyCollection = ee.ImageCollection([dummyImage.mask(ee.Image(0))])
  var imageCount = inCollection.toList(1).length()
  return ee.ImageCollection(ee.Algorithms.If(imageCount.gt(0),inCollection,dummyCollection))

}
//////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//var bandNumbers = [0,1,2,3,4,5,6];
var tcBandNumbers = [0,1,2,3,4,6];

////////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////
//Functions for computing tasseled cap transform
//Author:  Ian Housman
/////////////////////////////////////////////////////////////////////////
//Baig 2014 coeffs - TOA refl (http://www.tandfonline.com/doi/pdf/10.1080/2150704X.2014.915434)
var l8_tc_coeffs = [ee.Image([0.3029, 0.2786, 0.4733, 0.5599, 0.508, 0.1872]),
                    ee.Image([-0.2941, -0.243, -0.5424, 0.7276, 0.0713, -0.1608]),
                    ee.Image([ 0.1511, 0.1973, 0.3283, 0.3407, -0.7117, -0.4559])
                    // ee.Image([-0.8239, 0.0849, 0.4396, -0.058, 0.2013, -0.2773]),
                    // ee.Image([-0.3294, 0.0557, 0.1056, 0.1855, -0.4349, 0.8085]),
                    // ee.Image([0.1079, -0.9023, 0.4119, 0.0575, -0.0259, 0.0252])
                    ];
//Huang 2002 coeffs - TOA refl (http://landcover.usgs.gov/pdf/tasseled.pdf)
var l7_tc_coeffs = [ee.Image([0.3561, 0.3972, 0.3904, 0.6966, 0.2286, 0.1596]),
                    ee.Image([-0.3344, -0.3544, -0.4556, 0.6966, -0.0242, -0.2630]),
                    ee.Image([0.2626, 0.2141, 0.0926, 0.0656, -0.7629, -0.5388])
                    // ee.Image([0.0805, -0.0498, 0.1950, -0.1327, 0.5752, -0.7775]),
                    // ee.Image([-0.7252, -0.0202, 0.6683, 0.0631, -0.1494, -0.0274]),
                    // ee.Image([0.4000, -0.8172, 0.3832, 0.0602, -0.1095, 0.0985])
                    ];

//Crist 1985 coeffs - TOA refl (http://www.gis.usu.edu/~doug/RS5750/assign/OLD/RSE(17)-301.pdf)
var l5_tc_coeffs = [ee.Image([0.2043, 0.4158, 0.5524, 0.5741, 0.3124, 0.2303]),
                    ee.Image([-0.1603, -0.2819, -0.4934, 0.7940, -0.0002, -0.1446]),
                    ee.Image([0.0315, 0.2021, 0.3102, 0.1594, -0.6806, -0.6109])
                    // ee.Image([-0.2117, -0.0284, 0.1302, -0.1007, 0.6529, -0.7078]),
                    // ee.Image([-0.8669, -0.1835, 0.3856, 0.0408, -0.1132, 0.2272]),
                    // ee.Image([0.3677, -0.8200, 0.4354, 0.0518, -0.0066, -0.0104])
                    ];
/////////////////////////////////////////////////////////////////////////////////                    
var tc_coeff_dict = {L5: l5_tc_coeffs,L7: l7_tc_coeffs, L8: l8_tc_coeffs};
var tc_names = ['Brightness','Greenness', 'Wetness'];//, 'TCT4','TCT5','TCT6'];
var tc_names_a = ['Brightness','Greenness', 'Wetness','Angle'];//, 'TCT4','TCT5','TCT6','Angle'];
/////////////////////////////////////////////////////////////////////////////////
//Function to compute tc transformation using the coeffs above
var tc = function(image, sensor){
  //Nested function to do the multiplication and addition
  var mult_sum = function(matrix){
    return image.multiply(matrix).reduce(ee.call("Reducer.sum"));
    };
  //Find the coeffs
  var coeffs = tc_coeff_dict[sensor];
  
  //Compute the tc transformation and give it useful names
  var tco = ee.Image(coeffs.map(mult_sum)).select([0,1,2], tc_names);
  
  
  //From: http://www.fs.fed.us/rm/pubs_other/rmrs_2010_powell_s001.pdf
  var angle = tco.select('Greenness').divide(tco.select('Brightness')).atan();
  tco = tco.addBands(angle).select([0,1,2,3],tc_names_a);
  
  return tco;
};
/////////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////
//Function for adding common indices
function addIndices(in_image){
    in_image = in_image.addBands(in_image.normalizedDifference(['nir', 'red']).select([0],['NDVI']));
    in_image = in_image.addBands(in_image.normalizedDifference(['nir', 'swir2']).select([0],['NBR']));
    in_image = in_image.addBands(in_image.normalizedDifference(['nir', 'swir1']).select([0],['NDMI']));
    in_image = in_image.addBands(in_image.normalizedDifference(['green', 'swir1']).select([0],['NDSI']));
    // in_image = in_image.addBands(in_image.normalizedDifference(['red', 'blue']).select([0],['NDWFI']));
    
    //EVI algorithm taken from: http://landsat.usgs.gov/documents/si_product_guide.pdf
    //EVI = (Band 4 – Band 3) / (Band 4 + 6 * Band 3 – 7.5 * Band 1 + 1)
    // var nir = in_image.select(['nir']).multiply(10000);
    // var red = in_image.select(['red']).multiply(10000);
    // var evi = (nir.subtract(red)).divide((nir))
    in_image = in_image.addBands(tc(in_image.select(tcBandNumbers),'L5'));
    
    //Algorithm from Vincent2004 to estimate phycocyanin content (PC) from a linear combination of LANDSAT bands
    //in_image = in_image.addBands(in_image.expression("47.7-9.21*b('red')/b('blue')+29.7 * b('nir')/b('blue')-118*b('nir')/b('red')-6.81*b('swir1')/b('red')+41.9*b('swir2')/b('red')-14.7*b('swir2')/b('nir')").select([0],['PC']));
    
    return in_image;
  
};
/////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////
//Adds the float year with julian proportion to image
function addDateBand(img){
  var d = ee.Date(img.get('system:time_start'));
  var y = d.get('year');
  var prop = d.getFraction('year');
  var i = ee.Image(y.add(prop)).float();
  return img.addBands(i.select([0],['year']))
}
///////////////////////////////////////////////////
//Defringe algorithm credits:
// #
// # Author:
// #
// # Bonnie Ruefenacht, PhD
// # Senior Specialist
// # RedCastle Resources, Inc.
// # Working onsite at: 
// # USDA Forest Service 
// # Remote Sensing Applications Center (RSAC) 
// # 2222 West 2300 South
// # Salt Lake City, UT 84119
// # Office: (801) 975-3828 
// # Mobile: (801) 694-9215
// # Email: bruefenacht@fs.fed.us
// # RSAC FS Intranet website: http://fsweb.rsac.fs.fed.us/
// # RSAC FS Internet website: http://www.fs.fed.us/eng/rsac/
// #
// # Purpose: Remove the fringes of landsat 5 and 7 scenes.
// #
//Kernel for masking fringes found and L5 and L7 imagery
var k = ee.Kernel.fixed(41, 41, 
[[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], 
[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], 
[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], 
[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], 
[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], 
[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], 
[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], 
[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], 
[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], 
[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], 
[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], 
[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], 
[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], 
[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], 
[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], 
[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], 
[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], 
[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], 
[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], 
[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], 
[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], 
[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], 
[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], 
[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], 
[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], 
[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], 
[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], 
[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], 
[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], 
[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], 
[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], 
[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], 
[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], 
[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], 
[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], 
[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], 
[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], 
[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], 
[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]]
);
//////////////////////////////////////////////
//Algorithm to mask fringes in L5 and L7
function defringeLandsat(img){
  //Find any pixel without
  var m = img.mask().reduce(ee.Reducer.min());
  var sum = m.reduceNeighborhood(ee.Reducer.sum(), k, 'kernel')
  sum = sum.gte(fringeCountThreshold)
  img = img.mask(img.mask().and(sum))
  return img;
}
//////////////////////////////////////////////////////
//Function to remove cloud shadows
//Works by identifying dark outliers in the infrared bands
function simpleTDOM(collection,zShadowThresh,zCloudThresh,maskAllDarkPixels){
  //Set up some variables
      var shadowSumBands = ['nir','swir1','swir2']
      var sSName = 'shadowSum'
      var startBandNames = ee.Image(collection.first()).bandNames();
      
      //Add the sum of the infrared to all images
      var collection = collection.map(function(img){
        var shadowSum = img.select(shadowSumBands).reduce(ee.Reducer.sum()).select([0],[sSName])
        return img.addBands(shadowSum);
      })
      
      //If a first cut of masking very dark pixels is chosen, then mask all very dark pixels
      //This works kind of like the two-step approach in Fmask with individual image-based
      //masking and then a time series-based method
      if(maskAllDarkPixels === true){
        collection = collection.map(function(img){
          return img.mask(img.mask().and(img.select([sSName]).gt(shadowThresh)))
        })
      }
      
      //Compute the stdDev and mean of the sum of the infrared bands fo z-score analysis
      var shadowStd = collection.select(sSName).reduce(ee.Reducer.stdDev());
      var shadowMean = collection.select(sSName).mean();
      
      //Compute z-score and mask pixels falling below a specified threshold
      collection = collection.map(function(img){
        var tShadowSum = img.select(shadowSumBands).reduce(ee.Reducer.sum()).select([0],['shadowSumT']);
        var zScore = tShadowSum.subtract(shadowMean).divide(shadowStd).select([0],['zShadow']);
        var m = zScore.gt(zShadowThresh).and(zScore.lt(zCloudThresh));
        return img.mask(img.mask().and(m)).select(startBandNames);
      })
      return collection
    } 
//////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////
//Function for gathering, cloud masking, and cloud shadow masking Landsat imagery
function simpleCloudShadowFreeImages(startDate,endDate,startJulian,endJulian){
  //Get available L5 images
  var l5 = ee.ImageCollection('LT5_L1T_TOA')
        .filterDate(startDate,endDate)
        .filter(ee.Filter.calendarRange(startJulian,endJulian))
        .filterBounds(sa)
        
        //Defringe imagery if elected
        if(runDefringe === true){
          print('Running defringe on L5')
          l5 = l5.map(defringeLandsat);
        }
        //Bust clouds
        l5 = l5
        .map(bustClouds)
        .select(sensor_band_dict.get('L5'),bandNames)
  
  //Get L7 images      
  var l7 = ee.ImageCollection('LE7_L1T_TOA')
        .filterDate(startDate,endDate)
        .filter(ee.Filter.calendarRange(startJulian,endJulian))
        .filterBounds(sa)
        //May or may not want to run defringe on L7
        // if(runDefringe === true){
        //   print('Running defringe on L7')
        //   l7 = l7.map(defringeLandsat);
        // }
        //Bust clouds
        l7 = l7
        .map(bustClouds)
        .select(sensor_band_dict.get('L7'),bandNames)
  
  //Get L8 images and bust clouds
  var l8 = ee.ImageCollection('LC8_L1T_TOA')
        .filterDate(startDate,endDate)
        .filter(ee.Filter.calendarRange(startJulian,endJulian))
        .filterBounds(sa)
        .map(bustClouds)
        .select(sensor_band_dict.get('L8'),bandNames)
  
  //Merge collections 
  var ls = ee.ImageCollection(l5.merge(l7).merge(l8));
  
  //Mask snow and/or water of elected
  if(shouldMaskSnow === true){
    print('Masking snow');
    ls = ls.map(maskSnow);
  }

  if(shouldMaskWater === true){
    print('Masking water');
    ls = ls.map(maskWater);
  }
  
  //Temporal Dark Outlier Mask (TDOM)
  //Z-score based cloud shadow removal
  if(runTDOM === true){
    ls =simpleTDOM(ls,zShadowThresh,zCloudThresh,maskAllDarkPixels)
  }
  ls = ls.map(addIndices);
  return ls
}
//////////////////////////////////////////////////////////
//Function to manually set null value to specified number
//since noData values are not set properly with all data types
function setNoData(image,noDataValue){
  var m = image.mask();
  image = image.mask(ee.Image(1));
  image = image.where(m.not(),noDataValue);
  return image;
}
/////////////////////////////////////////////////////
function exportLandsatComposite(composite,name,res,crs,noData){
  // var composite =simpleCloudShadowFreeImages(startDate,endDate,startJulian,endJulian).median();
  addToMap(composite,vizParams,name)
  print(composite.bandNames());
  
  var forExport = composite.select([0,1,2,3,4,6]).multiply(10000);//Multiply refl bands by 10k to reduce to 16 bit
  forExport = forExport.addBands(composite.select([5])).select([0,1,2,3,4,6,5]).int16();//Add thermal back in and cast to 16 bit
  var m = forExport.mask();//Get current null values
  forExport = forExport.mask(ee.Image(1));//Get rid of all null values
  forExport = forExport.where(m.not(),noData);//Reset null values to no data value
  
  Export.image(forExport,name,{'crs':crs,'region':regionJSON,'scale':res,'maxPixels':1e13})
  
  var exportViz = forExport.float().divide(10000).clip(sa).visualize(vizParams);
  addToMap(exportViz,{},name+'-8-bit',false)
  //Get URL for PNG 
  var url =exportViz.getThumbURL({'dimensions':1500,'region':regionJSON,'format':'png'})
  print(url)
}
//////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////
//Parameters
var startDate = ee.Date.fromYMD(2014,1,1);
var endDate = ee.Date.fromYMD(2015,12,31);
var startJulian = 245;
var endJulian = 365;
var cloudThresh = 20;//Threshold for cloud masking (lower number masks more clouds)

var runTDOM = true;//Whether to run TDOM cloud shadow masking
var runDefringe = true;//Whether to run defringe algorithm on L5 and L7
var fringeCountThreshold = 279;//Define number of non null observations for pixel to not be classified as a fringe
var runTDOM = true;//Whether to run TDOM
var maskAllDarkPixels = false;//Whether to perform a first cut masking of all dark pixels for shadow masking

var shadowThresh = 0.1;//If maskAllDarkPixels == true, a first cut of cloud shadow masking.  Generally 0.1-0.15 works well
var zShadowThresh = -0.8;//Z-score threshold for cloud shadows. Generally -0.8 to -2.0 works well.  Masks more as it approaches 0
var zCloudThresh = 3;//Z-score threshold for masking any missed clouds.  Generally 3-4 works well

var minNumberObservationsNeeded = 5;//Min number of observations needed for pixel to be included in analysis
var shouldMaskSnow = false;//Whether to mask snow
var shouldMaskWater = false;//Whether to mask water
var waterThresh = 0.05;//Lower number masks more out  (0-1)
var snowThresh = 0.05;//Lower number masks more out (0-1)

var exportWhichBands = ['NDVI','NBR','Angle'];//Choose from: blue green red nir swir1 temp swir2 NDVI NBR NDMI NDSI Brightness Greenness Wetness Angle
var crs = 'EPSG:4326'//Projection info for export
var outNoData = -9999//Null value on export
var outputName = 'Java_Composite_2013_2015';//Descriptive name for export
//Get all images and cloud and shadow mask them
var allImages = simpleCloudShadowFreeImages(startDate,endDate,startJulian,endJulian)
  .select(vizParams.bands)
addToMap(allImages.reduce(ee.Reducer.percentile([25])).rename(vizParams.bands),vizParams,outputName)


//////////////////////////////////////////////////////////////////////////
//Edits made 26-1-16 to document pixel value source for median composite
//Function to add a sensor and date combo band
//Format for band is sensorYYYY.DDDDD where year is integer year and DDD is the proportion of the year
//Ex. Landsat 7, year 2005, julian date 162 would be something like 72005.5 
function addDateAndSensorBand(img){
  var number = ee.String(img.get('SPACECRAFT_ID')).slice(-1,null);//Get sensor number (not name and will not handle > 9)
  var d = ee.Date(img.get('system:time_start'));//Get date of acquisition
  var y = d.get('year');//Get year
  var prop = d.getFraction('year');//Get date as proportion of year
  var yProp = ee.String(y.add(prop))//Combine the year and date proportion
  var sensorDate = ee.Image(ee.Number.parse(number.cat(yProp)))
                  .select([0],['sensorDate']).float()//Concatenate and convert to an image
  return img.addBands(sensorDate)//Add it as a band
 
}
/////////////////////////////////////////////////////
//Function for converting a collection to an image
//Takes a collection and set of band names
function collectionToImage(collection,bns1){
  collection = ee.ImageCollection(collection);
  var i = collection.toArray();
  var bns2 = ee.Image(collection.first()).bandNames();
  var il = ee.List(collection.toList(100000));
  // var bns1 = ee.List.sequence(1,il.length())
  // .map(function(bn){return ee.String(ee.Number(bn).int16())});
  
  var o = i
  // .arrayProject([0])
  .arrayFlatten([bns1,bns2]);
  return o
}
/////////////////////////////////////////////////////
//Call on functions
var allImages = allImages.map(addDateAndSensorBand);//Add date sensor band


var composite = allImages.median();//Compute composite


//Add the band-wise absolute difference- except for the sensor date band
var bns = ee.Image(allImages.first()).bandNames();
bns = bns.remove('sensorDate')

var absDiff = allImages.map(function(img){
  var diff = img.subtract(composite).abs().multiply(-1).float();//Get difference and multiply by -1 so closest values are highest
  return diff.select(bns).addBands(img.select(['sensorDate'])).float()
});

//Find when and from where each band comes from
var whenAndFromWhere =bns.map(function(nm){
  var forQuality = absDiff.select([nm,'sensorDate']);
  var withQuality = forQuality.qualityMosaic(nm)
  return withQuality.select('sensorDate').float();
})

//Convert list to collection and then image
whenAndFromWhere = ee.ImageCollection.fromImages(whenAndFromWhere);
//Reset null to -9999 since conversion cannot handle null values
whenAndFromWhere = whenAndFromWhere.map(function(img){
  var m = img.mask();
  img = img.mask(ee.Image(1));
  img = img.where(m.eq(0),-9999);
  return img
})
//Convert to image
whenAndFromWhere = ee.Image(collectionToImage(whenAndFromWhere,bns));
//Reset nulls
whenAndFromWhere = whenAndFromWhere.mask(whenAndFromWhere.neq(-9999))

//Export image
var theseToo = exportWhichBands.map(function(bn){
  return ee.String(bn).cat('_sensorDate')
})

//Select the bands wanted for export
var forExportComposite = composite.select(exportWhichBands);
var forExportSensorDate = whenAndFromWhere.select(theseToo);
addToMap(forExportSensorDate,{'min':52013,'max':82015},'whenAndFromWhere')

var forExport = forExportComposite.addBands(forExportSensorDate).clip(sa).float();

//Set nodata
forExport = setNoData(forExport,outNoData);
//Export the image
Export.image(forExport,outputName,{'crs':crs,'region':regionJSON,'scale':30,'maxPixels':1e13})
  
Map.centerObject(sa)
Map.addLayer(forExport)