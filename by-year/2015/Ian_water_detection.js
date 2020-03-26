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
function maskWater(img){
  var ws = waterScore(img)
  return img.mask(img.mask().and(ws.lt(waterThresh)))
}
/////////////////////////////////////////////////////////////////