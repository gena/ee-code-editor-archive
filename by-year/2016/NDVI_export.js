
//NDVI map created with Landsat 5 Data
//created to filtered variables to subtract and find the difference between NDVI in 2000 versus NDVI in 2010 
 
var collection = ee.ImageCollection('LANDSAT/LT5_L1T_32DAY_NDVI');
var filtered2000 = collection.filterDate('1984-01-01', '1984-12-31');
var filtered2010= collection. filterDate('2011-01-01', '2011-12-31');

//filter 2000 and 2010 data to find the median of each year 
var ndvi2000 = filtered2000.median();
var ndvi2010= filtered2010.median();

//subtract ndvi 2010- ndvi 2000
var difference= ndvi2010.subtract(ndvi2000);

//masking water values so they are transparent. Values with a NDVI value less than zero will be rendered transparent. 

var hansenImage = ee.Image('UMD/hansen/global_forest_change_2013');
var data = hansenImage.select('datamask');
var mask = data.eq(1);

var maskedDifference = difference.mask(mask);

//Clip NDVI difference to Denver Neighboorhoods
var denver = ee.FeatureCollection('ft:113WzfP6ci7wQK4hFg2KVu9G37Qm2UIKccWCATTdB');
var clippedDifference= maskedDifference.clip(denver);

//Calculate Average Change for each feature class; find by going to Console and searching under feature property, change
var averageChange = denver.map(function(feature) {
  var change = difference.reduceRegion(ee.Reducer.mean(), feature.geometry(), 30);
  return feature.set({'change': change});
});

print(averageChange);


//Difference between year 2000 Landsat 5 NDVI and year 2010 Landsat 5 NDVI. Decreased NDVI (or decreased vegetation is red). 
//Increased NDVI (or increased vegetation) is green. 
Map.setCenter (-105.01, 39.76, 11);
Map.addLayer(clippedDifference, {palette:'FF0000, 000000, 00FF00', min: -0.3, max: 0.3});

//adding colorramp

var sld_ramp = '\
<RasterSymbolizer>\
  <ColorMap type="ramp" extended="false" >\
    <ColorMapEntry color="#0000ff" quantity="0" label="lte 0" opacity="1"/>\
    <ColorMapEntry color="#00ff00" quantity="10" label="10" />\
    <ColorMapEntry color="#007f30" quantity="20" label="20" />\
    <ColorMapEntry color="#30b855" quantity="30" label="30" />\
    <ColorMapEntry color="#ff0000" quantity="40" label="40" />\
    <ColorMapEntry color="#ffff00" quantity="50" label="50" />\
  </ColorMap>\
</RasterSymbolizer>';

var sld_intervals = '\
<RasterSymbolizer>\
  <ColorMap  type="intervals" extended="false" >\
    <ColorMapEntry color="#0000ff" quantity="0" label="lte 0" opacity="1"/>\
    <ColorMapEntry color="#00ff00" quantity="10" label="1-10" />\
    <ColorMapEntry color="#007f30" quantity="20" label="11-20" />\
    <ColorMapEntry color="#30b855" quantity="30" label="21-30" />\
    <ColorMapEntry color="#ff0000" quantity="40" label="31-40" />\
    <ColorMapEntry color="#ffff00" quantity="50" label="41-50" />\
  </ColorMap>\
</RasterSymbolizer>';

addToMap(clippedDifference.sldStyle(sld_ramp), {}, 'SLD ramp');
addToMap(clippedDifference.sldStyle(sld_intervals), {}, 'SLD intervals');

//Exporting image

var imageToExport = clippedDifference.visualize({palette:'FF0000, 000000, 00FF00', min: -0.3, max: 0.3});
Map.addLayer(imageToExport,{},'difference', true,'jpg');
var geometry=ee.Geometry

//Export table 
var filenamePrefix = 'Average_NDVI_Change_1984_2011_Landsat5';

var taskParams = {
  'driveFolder' : 'Thesis',
  'fileFormat' : 'CVS'
};
  
Export.table(averageChange, filenamePrefix, taskParams);

