/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var refpoly = /* color: ffc82d */ee.Geometry.Polygon(
        [[[-117.86407, 33.24443],
          [-116.60202, 33.24443],
          [-116.60202, 33.885],
          [-117.86407, 33.885]]]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
//TEST: Thermal analysis - new
// Author: George Azzari
// Center on Food Security and the Environment
// Department of Earth System Science
// Stanford University

/* Based on: Jimenez-Munoz, J.C.; Cristobal, J.; Sobrino, J.A.; Soria, G.; Ninyerola, M.; Pons, X.; Pons, X., 
             "Revision of the Single-Channel Algorithm for Land Surface Temperature Retrieval 
             From Landsat Thermal-Infrared Data," 
             Geoscience and Remote Sensing, 
             IEEE Transactions on , vol.47, no.1, pp.339,349, Jan. 2009
             doi: 10.1109/TGRS.2008.2007125 */
             
//---------------------------------------------------------------------------------------------------------
//---------------------------------------Joining Collections-----------------------------------------------
function filterCollection(imgcoll, start_date, end_date, poly){
  return imgcoll.filterDate(start_date, end_date)
                .filterBounds(poly.centroid()); //using the polygon only would go bananas
                // .filter(ee.Filter.lt('CLOUD_COVER', 10));
}

// Return a Landsat 5 calibrated radiance collection with only thermal (radiative temp).
// Collection is filtered by given dates and by given polygon.
function getLandsatRAD(startdate, enddate, poly){
  var radcoll = filterCollection(ee.ImageCollection("LT5_L1T"), startdate, enddate, poly);
  return radcoll.map(function(img){
        return ee.Algorithms.Landsat.calibratedRadiance(img)
                .select(['B6'], ['B6_RAD'])
                .set({'system:time_start':img.get('system:time_start')});
                });
}

// Return a Landsat 5 TOA collection with only thermal (brightness temp)
// and cloud score band. Collection is filtered by given dates and
// by given polygon.
function getLandsatTOA(startdate, enddate, poly){
  var l5toas = filterCollection(ee.ImageCollection('LANDSAT/LT5_L1T_TOA'), startdate, enddate, poly)
               .map(ee.Algorithms.Landsat.simpleCloudScore)
               .select([5,7], ["B6_BRT","CLOUDSC"]);
  return ee.ImageCollection(l5toas);
}

//Return a Landsat 5 SR collection of surface reflectance and 
//quality bands. Collection is filtered by given dates and
//by given polygon. 
function getLandsatSR(startdate, enddate, poly){
  var bnames = ["B1","B2","B3","B4","B5","B7","AO","QA"];
  var bnumbers = [0,1,2,3,4,5,6,7];
  var l5s = filterCollection(ee.ImageCollection('LEDAPS/LT5_L1T_SR'), startdate, enddate, poly)
            .select(bnumbers, bnames);
  return ee.ImageCollection(l5s);
}

//Stick atmospheric metadata to image as bands.
function addAtmosBands(srimg){
  // var ozone = ee.Image(srimg.get('ozone')).select([0], ['OZONE']);
  var tair = ee.Image(ee.List(srimg.get('surface_temp')).get(0))
              .select([0], ['SRTAIR00'])
            .addBands(ee.Image(ee.List(srimg.get('surface_temp')).get(1))
              .select([0], ['SRTAIR06']))
            .addBands(ee.Image(ee.List(srimg.get('surface_temp')).get(2))
              .select([0], ['SRTAIR12']))
            .addBands(ee.Image(ee.List(srimg.get('surface_temp')).get(3))
              .select([0], ['SRTAIR18']));
  var wv = ee.Image(ee.List(srimg.get('surface_wv')).get(0))
              .select([0], ['SRWVAP00'])
            .addBands(ee.Image(ee.List(srimg.get('surface_wv')).get(1))
              .select([0], ['SRWVAP06']))
            .addBands(ee.Image(ee.List(srimg.get('surface_wv')).get(2))
              .select([0], ['SRWVAP12']))
            .addBands(ee.Image(ee.List(srimg.get('surface_wv')).get(3))
              .select([0], ['SRWVAP18']));
  return srimg.addBands(tair).addBands(wv);
}

//Join Landsat collections based on system:time_start
function joinLandsatCollections(coll1, coll2){
  var eqfilter = ee.Filter.equals({'rightField':'system:time_start',
                                   'leftField':'system:time_start'});
  var join = ee.Join.inner();
  var joined = ee.ImageCollection(join.apply(coll1, coll2, eqfilter));
  //Inner join returns a FeatureCollection with a primary and secondary set of 
  //properties. Properties are collapsed into different bands of an image.
  return joined.map(function(element){
                      return ee.Image.cat(element.get('primary'), element.get('secondary'));
                    })
          .sort('system:time_start');
}

//Compute NDVI from a Landsat image.
function addNDVI(lndstimg){
  var ndvi =  lndstimg.normalizedDifference(['B4', 'B3']);
  return lndstimg.addBands(ndvi.select([0],['NDVI']));
}

//---------------------------------------------------------------------------------------------------------
//-----------------------------------------------Thermal---------------------------------------------------

//Compute emissivity from NDVI
//Note: NDVImin, NDVImax should be actually extracted from the image histogram.
//      Esoil, Eveg can be found in the literature.
function coreEmissivity(reflimg, NDVImin, NDVImax, Esoil, Eveg){
  var ndvi_min = ee.Image(ee.Number(NDVImin));
  var ndvi_max = ee.Image(ee.Number(NDVImax));
  var ndvi = reflimg.normalizedDifference(["B4", "B3"]);
  var fvc =  ndvi.subtract(ndvi_min)
             .divide(ndvi_max.subtract(ndvi_min))
             .pow(ee.Image(2));
  var e = ee.Image(Esoil).multiply(ee.Image(1).subtract(fvc)).add(ee.Image(Eveg).multiply(fvc));
  return e.select([0], ['emissivity']);
}

//Convenience function for mapping emissivity computation over collection
function getEmissivity(reflimg){
  return coreEmissivity(reflimg, 0.18, 0.85, 0.97, 0.99, 0.55); 
}

//Compute psi functions
function getPsis(joinedimg){
  // WTR in NCEP data is in kg/m^2, 
  // LST method needs g/cm^2: 1 kg/m2 = 10^-1 g/cm^2
  // NCEP values need to be unpacked first:
  //      + offset = 277.65 
  //      + scale =0.01 for all images.
  var wv = joinedimg.select('SRWVAP18') //CAREFUL: TIME OF DAY HARDCODED (SHOULD TAKE AVERAGE?)
           .multiply(0.01) //scale
           .add(277.65) //offset
           .multiply(ee.Image(0.1)); //conversion to g/cm2
  var psi1 = ee.Image(0.14714).multiply(wv.pow(ee.Image(2)))
            .add(ee.Image(-0.15583).multiply(wv))
            .add(ee.Image(1.1234));
  var psi2 = ee.Image(-1.1836).multiply(wv.pow(ee.Image(2)))
            .add(ee.Image(-0.37607).multiply(wv))
            .add(ee.Image(-0.52894));
  var psi3 = ee.Image(-0.04554).multiply(wv.pow(ee.Image(2)))
            .add(ee.Image(1.8719).multiply(wv))
            .add(ee.Image(-0.39071));
  return ee.Image.cat([wv, psi1, psi2, psi3])
        .select([0,1,2,3], ["wv_gcm-2", "psi1", "psi2", "psi3"])
        .set({'system:time_start':joinedimg.get('system:time_start')});
}

//Compute surface temperature (output in degrees Kelvin)
function getSurfaceTemp(joinedimg){
  var brightemp = joinedimg.select('B6_BRT');
  var radtemp = joinedimg.select('B6_RAD');
  var c1 = ee.Image(1.19104); // W um^4 m^-2
  var c2 = ee.Image(14387.7); // um K
  var lambda = ee.Image(11.457); //um (effective wavelength of TM B6)
  var beta = ee.Image(1256); //K
  var gamma = radtemp.multiply(c2).divide(brightemp.pow(2))
              .multiply(radtemp.multiply(lambda.pow(4)).divide(c1)
                        .add(lambda.pow(-1)))
              .pow(-1);
  var delta = brightemp.subtract(radtemp.multiply(gamma));
  var psis = getPsis(joinedimg);
  var e = getEmissivity(joinedimg);
  var toctemp = gamma.multiply(psis.select('psi1').multiply(radtemp)
                                .add(psis.select('psi2'))
                                .divide(e)
                                .add(psis.select('psi3')))
                .add(delta);
  var sigma = 5.67e-8; //W/m2/K4
  var tocrad = ee.Image(sigma).multiply(e)
                    .multiply(toctemp.pow(ee.Image(4)))
                    .divide(ee.Image(Math.PI));
  return ee.Image.cat(toctemp, brightemp, e, tocrad, radtemp)
            .select([0,1,2,3,4], ['TOCtemp', 'TOAtemp', 'emiss', 'TOCrad', 'TOArad'])
            .set({
              'DATE_ACQUIRED':joinedimg.get('DATE_ACQUIRED'),
              'LANDSAT_SCENE_ID':joinedimg.get('LANDSAT_SCENE_ID'),
              'SUN_AZIMUTH':joinedimg.get("SUN_AZIMUTH"),
              'SUN_ELEVATION':joinedimg.get("SUN_ELEVATION"),
              'system:time_start':joinedimg.get('system:time_start'),
            });
}

//---------------------------------------------------------------------------------------------------------
//----------------------------------------------Testing----------------------------------------------------

//-------------Initialize base collections
var start_date = ee.Date.fromYMD(2008,1,1); 
var end_date = ee.Date.fromYMD(2012,1,1);
var jcoll = joinLandsatCollections(getLandsatTOA(start_date, end_date , refpoly), 
                                   getLandsatSR(start_date, end_date, refpoly)
                                   .map(addAtmosBands));
jcoll = joinLandsatCollections(jcoll, getLandsatRAD(start_date, end_date , refpoly));

var tcoll = jcoll.map(function(jimg){return getSurfaceTemp(jimg)});

//---Test single image
var jimg = ee.Image(jcoll.first());
var timg = ee.Image(tcoll.first());
// print(jimg);
print(timg);

//---Visualization
Map.centerObject(refpoly, 9);
var thpalette = ["000066", "00FFFF","FFFF00", "FF0000"];
var empalette = ['000000', 'FFD700', 'F0FFFF'];
Map.addLayer(timg.select('emiss'),{min:0.968, max:0.985, palette:empalette},"Surface Emissivity");
Map.addLayer(timg.select('TOCtemp'), {min:250, max:300, palette:thpalette}, "Surface Temperature (K)");




