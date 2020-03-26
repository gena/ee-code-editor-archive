var fcs = ee.FeatureCollection('ft:1xge8-FksrM8SRGVkK-71jJNploVmvv4r0c4pGRfi', 'geometry').
//  filter(ee.Filter.eq('STUSPS', 'CA')). //start with just CA
  filter(ee.Filter.neq('STUSPS', 'AK')). //Alaska
  filter(ee.Filter.neq('STUSPS', 'AS')). //American Samoa
  filter(ee.Filter.neq('STUSPS', 'GU')). //Guam
  filter(ee.Filter.neq('STUSPS', 'HI')). //Hawaii
  filter(ee.Filter.neq('STUSPS', 'MP')). //Mariana Islands
  filter(ee.Filter.neq('STUSPS', 'PR')). //Puerto rico
  filter(ee.Filter.neq('STUSPS', 'VI')); //Virgin Islands;
  //filter(ee.Filter.or(ee.Filter.eq('STUSPS', 'MA'),ee.Filter.eq('STUSPS', 'CT'))); //filter to MA & CT for testing
 
var fcc = ee.FeatureCollection('ft:1LLW1z0UxOS4rEpBv4B7ybE6dzeAvwoPR5IkiC-rT').
//  filter(ee.Filter.eq('STATEFP', 06)). //start with just california
  filter(ee.Filter.neq('STATEFP', 02)). //Alaska
  filter(ee.Filter.neq('STATEFP',15)). //Hawaii
  filter(ee.Filter.neq('CLASSFP', '')).
  //filter(ee.Filter.neq('CLASSFP', 'U1')).
  //filter(ee.Filter.neq('CLASSFP', 'U2')).
  filter(ee.Filter.neq('CLASSFP', 'M2'));

//===============calculate electricity=====================
var filterDate = ee.Filter.or(ee.Filter.date('2013-01-01', '2013-04-01'), ee.Filter.date('2013-09-01', '2013-12-02'))
var viirs_2013 = ee.ImageCollection('NOAA/VIIRS/DNB/MONTHLY_V1/VCMCFG').filter(filterDate)
var mean = viirs_2013.mean().select('avg_rad')
var properties = ['elec_slope_mwh_p_km2_L', 'fuel_slope_mwh_p_km2_L']
var city_energy = fcc.reduceToImage(properties, ee.Reducer.first().forEach(properties)).multiply(mean)
var state_energy = fcs.reduceToImage(properties, ee.Reducer.first().forEach(properties)).multiply(mean)
var final_image = city_energy.mask(city_energy.gt(1)).unmask(state_energy, false).rename(['elec_mwh_km2','fuel_mwh_km2'])



var palette_e = ['black','blue','teal','green','yellow','orange','maroon','red'];
var min_e = 0;
var max_e = 100000;
var vis_e = {min: min_e, max: max_e, palette: palette_e};

var palette_f = ['black','blue','teal','green','yellow','orange','maroon','red'];
var min_f = 0;
var max_f = 100000;
var vis_f = {min: min_f, max: max_f, palette: palette_f};

var bands_en = ['elec_mwh_km2','fuel_mwh_km2'];
var min_en = 0;
var max_en = 150000;
var vis_en = {min: min_en, max: max_en, bands: bands_en};

//Display electricity.
Map.setCenter(-115,38,6);
Map.addLayer(final_image.select(0),vis_e);

//Display fuel
//Map.addLayer(ic.select(1),vis_f);

//Display both electricity and fuel
//Map.addLayer(ic,vis_en);

//PRINT HERE=========================================
var region = ee.Geometry.Rectangle([-125, 50, -65, 25]);

var thumb = ee.Image(final_image.select(0)).visualize(vis_e);
//Export.image.toDrive({
//  image: thumb,
//  description: 'Greenest_pixel_composite',
//  scale: 463
//});

// Print a thumbnail to the console.
//print(ui.Thumbnail({
//  image: thumb,
//  params: {
//    //dimensions: '256x256',
//    region: region.toGeoJSON(),
//    format: 'png',
//    scale: 463
//  },
  //style: {height: '300px', width: '300px'}
//}));
