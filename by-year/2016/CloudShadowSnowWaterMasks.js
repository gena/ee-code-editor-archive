/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var geometry = /* color: d63000 */ee.Geometry.Polygon(
        [[[-113.9996337890625, 47.83126056434314],
          [-114.0106201171875, 46.912409699254255],
          [-112.2418212890625, 46.81851593425503],
          [-112.5823974609375, 47.904961172960874]]]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/



////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//cloud,shadow,snow, mask function
var cloudMask = function(image) {  
  var mask = image.select('cfmask').lt(1);
  image = image.mask(mask);
  return image;
};
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//tassel cap transformations for each landsat sensor
//Baig 2014 coeffs - TOA refl (http://www.tandfonline.com/doi/pdf/10.1080/2150704X.2014.915434)
var l8_tc_coeffs = [ee.Image([0.3029, 0.2786, 0.4733, 0.5599, 0.508, 0.1872]),
                    ee.Image([-0.2941, -0.243, -0.5424, 0.7276, 0.0713, -0.1608]),
                    ee.Image([ 0.1511, 0.1973, 0.3283, 0.3407, -0.7117, -0.4559])
                    ];
//Huang 2002 coeffs - TOA refl (http://landcover.usgs.gov/pdf/tasseled.pdf)
var l7_tc_coeffs = [ee.Image([0.3561, 0.3972, 0.3904, 0.6966, 0.2286, 0.1596]),
                    ee.Image([-0.3344, -0.3544, -0.4556, 0.6966, -0.0242, -0.2630]),
                    ee.Image([0.2626, 0.2141, 0.0926, 0.0656, -0.7629, -0.5388])
                    ];

//Crist 1985 coeffs - TOA refl (http://www.gis.usu.edu/~doug/RS5750/assign/OLD/RSE(17)-301.pdf)
var l5_tc_coeffs = [ee.Image([0.2043, 0.4158, 0.5524, 0.5741, 0.3124, 0.2303]),
                    ee.Image([-0.1603, -0.2819, -0.4934, 0.7940, -0.0002, -0.1446]),
                    ee.Image([0.0315, 0.2021, 0.3102, 0.1594, -0.6806, -0.6109])
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

////////////////////////////////////////////////////////////////////////////////
//add additional indices for possible use
/////////////////////////////////////////////////////////////////////////
function addIndicesL5(in_image){
    in_image = in_image.addBands(in_image.normalizedDifference(['nir', 'red']).select([0],['NDVI']));
    in_image = in_image.addBands(in_image.normalizedDifference(['nir', 'swir2']).select([0],['NBR']));
    in_image = in_image.addBands(in_image.normalizedDifference(['nir', 'swir1']).select([0],['NDMI']));
    in_image = in_image.addBands(in_image.normalizedDifference(['green', 'swir1']).select([0],['NDSI']));
    in_image = in_image.addBands(tc(in_image.select([0,1,2,3,4,5]),'L5'));
    return in_image;
}
function addIndicesL7(in_image){
    in_image = in_image.addBands(in_image.normalizedDifference(['nir', 'red']).select([0],['NDVI']));
    in_image = in_image.addBands(in_image.normalizedDifference(['nir', 'swir2']).select([0],['NBR']));
    in_image = in_image.addBands(in_image.normalizedDifference(['nir', 'swir1']).select([0],['NDMI']));
    in_image = in_image.addBands(in_image.normalizedDifference(['green', 'swir1']).select([0],['NDSI']));
    in_image = in_image.addBands(tc(in_image.select([0,1,2,3,4,5]),'L7'));
    return in_image;
}
function addIndicesL8(in_image){
    in_image = in_image.addBands(in_image.normalizedDifference(['nir', 'red']).select([0],['NDVI']));
    in_image = in_image.addBands(in_image.normalizedDifference(['nir', 'swir2']).select([0],['NBR']));
    in_image = in_image.addBands(in_image.normalizedDifference(['nir', 'swir1']).select([0],['NDMI']));
    in_image = in_image.addBands(in_image.normalizedDifference(['green', 'swir1']).select([0],['NDSI']));
    in_image = in_image.addBands(tc(in_image.select([0,1,2,3,4,5]),'L8'));
    return in_image;
}

/////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////
//Adds the float year with julian proportion to image AND sensor information
function addDateBand(img){
  var d = ee.Date(img.get('system:time_start'));
  var y = d.get('year');
  var db = ee.Image.constant(y).select([0],['year']).float();
  return img.addBands(db)
  .copyProperties(img);
}

//gather Landsat 5,7, and 8, mask water/cloud/shadows/snow
var l5Ndvi = ee.ImageCollection("LANDSAT/LT5_SR")
  .filterBounds(geometry)
  .map(cloudMask)
  .select([0,1,2,3,4,5], ['blue','green','red','nir','swir1','swir2'])
  .map(addIndicesL5)
  .map(addDateBand);
print(l5Ndvi);
var l7Ndvi = ee.ImageCollection("LANDSAT/LE7_SR")
  .filterBounds(geometry)
  .map(cloudMask)
  .select([0,1,2,3,4,5], ['blue','green','red','nir','swir1','swir2'])
  .map(addIndicesL7)
  .map(addDateBand);
print(l7Ndvi);
var l8Ndvi = ee.ImageCollection("LANDSAT/LC8_SR")
  .filterBounds(geometry)
  .map(cloudMask)
  .select([1,2,3,4,5,6], ['blue','green','red','nir','swir1','swir2'])
  .map(addIndicesL8)
  .map(addDateBand);
print(l8Ndvi);

//merge the collection together
var collection = l5Ndvi.merge(l7Ndvi.merge(l8Ndvi));
print(collection);
////////////////////////////////////////////////////////////////////////////////////////////////////////
//variable selection stuff here
var startMonth = 6;
var endMonth = 9;
var years = ee.List.sequence(1984, 2015);
print(years);
/////////////////////////////////////////////////////////////////////////////////////////////////////////
//functions for different date combinations
function yearlyfilterMax(year){
    var yearCollection = collection
    .filter(ee.Filter.and(ee.Filter.calendarRange(year,year,'year'),
    ee.Filter.calendarRange(startMonth,endMonth,'month')));
    yearCollection = ee.ImageCollection(yearCollection).max();
    return(yearCollection);
}

function yearlyfilterMedian(year){
    var yearCollection = collection
    .filter(ee.Filter.and(ee.Filter.calendarRange(year,year,'year'),
    ee.Filter.calendarRange(startMonth,endMonth,'month')));
    yearCollection = ee.ImageCollection(yearCollection).median();
    return(yearCollection);
}

function yearlyfilterPerc(year){
    var yearCollection = collection
    .filter(ee.Filter.and(ee.Filter.calendarRange(year,year,'year'),
    ee.Filter.calendarRange(startMonth,endMonth,'month')));
    var reducePerc = ee.Reducer.percentile([75]);
    yearCollection = ee.ImageCollection(yearCollection).reduce(reducePerc);
    return(yearCollection);
}

var yearsImagesMax = ee.ImageCollection.fromImages(years.map(yearlyfilterMax));
var yearsImagesMed = ee.ImageCollection.fromImages(years.map(yearlyfilterMedian));
var yearsImages75perc = ee.ImageCollection.fromImages(years.map(yearlyfilterPerc));

function vizVar(image){
      image = image.select('year').eq(2015);
      vizVarYears = yearsImagesMax.filter(image);
      return image;
}
function convert(img){
   return ee.Image(img.set("year", img.get('year')));
}
var yearsImagesMax1 = yearsImagesMax.map(convert);
print(yearsImagesMax);
print(yearsImagesMax1);
//print(yearsImagesMed);
//print(yearsImages75perc);
Map.addLayer(ee.Image(yearsImagesMax.first()).select('NBR'), null, 'NBR');
print(Chart.image.series(yearsImagesMax1, geometry, ee.Reducer.mean(),500,'year'));
print(Chart.image.series(yearsImagesMed, geometry, ee.Reducer.mean(),500,'system:index'));
print(Chart.image.series(yearsImages75perc, geometry, ee.Reducer.mean(),500,'system:index'));
//////
//questions for brady: when getting the max for one image, what band or value is used to calculate that max? - gets the max for all images
//evaluate what information best equates to monitor forest disturbance, median, max, percentile, different months, different variables
//I need to add at least the year band on right?