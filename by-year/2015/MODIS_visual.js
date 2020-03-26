/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var etopo = ee.Image("NOAA/NGDC/ETOPO1");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
// Start with an image collection for a 1 month period.
var collection = ee.ImageCollection(ee.ImageCollection('MOD09GA').merge(ee.ImageCollection('MYD09GA')))
                   .filterDate('2010-06-01', '2010-09-01')
                   .select(['sur_refl_b06', 'sur_refl_b05', 'sur_refl_b03']);
                   
Map.addLayer(
     collection.reduce(ee.Reducer.percentile([15])).mask(etopo.select('bedrock').gt(-100))
      ,
    {
     gain: 0.05,
     gamma: 0.9
    },
    'median of masked collection'
  );
