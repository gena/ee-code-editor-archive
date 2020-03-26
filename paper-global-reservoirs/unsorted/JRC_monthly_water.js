/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var prior_ProsserCreek_fusion = ee.Image("users/gena/water-occurrence-ProsserCreek"),
    geometryLaos = /* color: #d63000 */ee.Geometry.Polygon(
        [[[101.92557334899902, 20.665553459115724],
          [101.93321228027344, 20.669247583604506],
          [101.93492889404297, 20.675591631210878],
          [101.93106651306152, 20.688359227112937],
          [101.91784858703613, 20.689403071099637],
          [101.8930435180664, 20.687797154299272],
          [101.88291549682617, 20.6871547828197],
          [101.87579154968262, 20.68466556765],
          [101.87956809997559, 20.675270419981036],
          [101.87982559204102, 20.668364214182986],
          [101.88652038574219, 20.666838382171672],
          [101.89424514770508, 20.66796268092927],
          [101.8985366821289, 20.66579438301664],
          [101.90437316894531, 20.666517152426678]]]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
var styles = require('users/gena/packages:styles')
var hydro = require('users/gena/packages:hydro')
var utils = require('users/gena/packages:utils')

// add rivers
var rivers = ee.FeatureCollection('ft:1yMXz_cItkAJFvmeXNcsuW2i7kK5i1iJ0QcYK3g')
Map.addLayer(rivers, {color: 'lightblue'}, 'rivers (Natural Earth)', false)  

// add basins
var basins4 = hydro.getCatchmments({level: 4});
utils.Map.addAsImage(basins4, 'HydroBASINS L4', {outline: true, fill: false, palette: ['ffffff', 'ffffff'], layer: {visible: false}})


var geometryProsserCreek = ee.Geometry.Polygon(
        [[[-120.14545440673828, 39.36707923135866],
          [-120.12983322143555, 39.377031853962784],
          [-120.135498046875, 39.39136113808911],
          [-120.15721321105957, 39.39474401195064],
          [-120.1820182800293, 39.39600425635537],
          [-120.1845932006836, 39.38326810769769],
          [-120.16691207885742, 39.367278297713526]]]);
          
var geometryRengali = ee.Geometry.Polygon(
[[[84.8741038310202, 21.380228561034507],
[84.89907382308957, 21.367151150997675],
[84.90437676821227, 21.34227486839844],
[84.91429152610112, 21.330252317542],
[84.92724815885526, 21.31707969669722],
[85.00404791269284, 21.27861110273916],
[85.05103209799017, 21.266714817305097],
[85.1116092986781, 21.269079584595428],
[85.12268167946331, 21.28305948778949],
[85.13165182039461, 21.299008376721012],
[85.14094318786874, 21.30410606377268],
[85.13666295734129, 21.31689122409577],
[85.13383448893273, 21.337035778780418],
[85.078125, 21.363570998122675],
[85.09735107421875, 21.36421046118655],
[85.09220123291016, 21.370285221044913],
[85.09254455566406, 21.375720318880305],
[85.09288787841797, 21.381474908405597],
[85.08430480957031, 21.389147342439845],
[85.09151458740234, 21.390106368403334],
[85.09838104248047, 21.381155214923442],
[85.12069702148438, 21.37188380017664],
[85.12584686279297, 21.374761198630097],
[85.12104034423828, 21.388507988304525],
[85.11795043945312, 21.395860392136676],
[85.10284423828125, 21.405130287471582],
[85.11383056640625, 21.41024446085053],
[85.12104034423828, 21.423668314313243],
[85.13236999511719, 21.426225098900133],
[85.13683319091797, 21.43741050498168],
[85.1436996459961, 21.447316862986145],
[85.1333999633789, 21.45274909625535],
[85.12378692626953, 21.448595053724944],
[85.10833740234375, 21.44348222355954],
[85.09597778320312, 21.44635821258066],
[85.09082794189453, 21.44252354795169],
[85.09082794189453, 21.43133853375149],
[85.08533477783203, 21.438369214187027],
[85.07640838623047, 21.4380496451518],
[85.0722885131836, 21.444121337131314],
[85.07503509521484, 21.449873233261155],
[85.06816864013672, 21.460737306938082],
[85.05615234375, 21.459459222645663],
[85.0510025024414, 21.441564866043823],
[85.05237579345703, 21.41919383356479],
[85.04688262939453, 21.417276156993665],
[85.03246307373047, 21.42782306653108],
[85.0177001953125, 21.42079187814096],
[85.02799987792969, 21.408007032018528],
[85.02182006835938, 21.405449928550762],
[85.02113342285156, 21.413440728324687],
[85.01564025878906, 21.413440728324687],
[85.01049041748047, 21.419833053493488],
[85.00293731689453, 21.41376035122644],
[84.99778747558594, 21.42750347440408],
[84.98611450195312, 21.42079187814096],
[84.97856140136719, 21.40992483025764],
[84.97547149658203, 21.399376628522422],
[84.97203826904297, 21.41376035122644],
[84.9631118774414, 21.41919383356479],
[84.95452880859375, 21.426225098900133],
[84.9627685546875, 21.43229728284547],
[84.96551513671875, 21.428142657958453],
[84.97444152832031, 21.433575605174475],
[84.9847412109375, 21.44028661370037],
[84.9905776977539, 21.44028661370037],
[84.98783111572266, 21.449873233261155],
[84.99092102050781, 21.449873233261155],
[84.99675750732422, 21.442203988015734],
[85.00362396240234, 21.44795595975583],
[85.00877380371094, 21.454027239379393],
[85.0067138671875, 21.461376344881433],
[84.99984741210938, 21.462654412362106],
[85.00019073486328, 21.46648854755088],
[85.00568389892578, 21.472239561158673],
[85.0118637084961, 21.479268269440546],
[85.00911712646484, 21.48374090716327],
[84.99778747558594, 21.489491239462165],
[85.00328063964844, 21.49332466810842],
[85.01392364501953, 21.493963563064465],
[85.02559661865234, 21.48597717449624],
[85.03074645996094, 21.500991222408437],
[85.0345230102539, 21.514726121552133],
[85.03658294677734, 21.52430784078625],
[85.02422332763672, 21.52845972288302],
[85.01838684082031, 21.52941783266715],
[85.00911712646484, 21.528779093513325],
[85.00877380371094, 21.53452764476301],
[85.01701354980469, 21.54346938321975],
[84.98851776123047, 21.54410805774636],
[84.96723175048828, 21.535805069691538],
[84.95555877685547, 21.527501606778536],
[84.97238159179688, 21.523988460325043],
[84.9679183959961, 21.519197669154597],
[84.957275390625, 21.515364922490104],
[84.95075225830078, 21.500352358315695],
[84.92671966552734, 21.505782613653068],
[84.92019653320312, 21.497477435173998],
[84.93324279785156, 21.49013015124931],
[84.93083953857422, 21.485018778417395],
[84.92156982421875, 21.48469931165551],
[84.9184799194336, 21.474476005134676],
[84.91573333740234, 21.470961577754945],
[84.91264343261719, 21.485338244478132],
[84.90234375, 21.48821340747312],
[84.8917007446289, 21.478309829195904],
[84.88414764404297, 21.474795494327946],
[84.88037109375, 21.46936408273346],
[84.8862075805664, 21.45338816921794],
[84.88723754882812, 21.446038661045275],
[84.88998413085938, 21.441245304007914],
[84.90921020507812, 21.435493067674805],
[84.9078369140625, 21.43133853375149],
[84.90131378173828, 21.431018949320737],
[84.89067077636719, 21.434214762140414],
[84.87178802490234, 21.43165811748253],
[84.8697280883789, 21.43741050498168],
[84.8752212524414, 21.44795595975583],
[84.86457824707031, 21.453068633086783],
[84.85908508300781, 21.457222548166992],
[84.86045837402344, 21.46936408273346],
[84.85771179199219, 21.47799034771245],
[84.84912872314453, 21.47255905525765],
[84.8419189453125, 21.46936408273346],
[84.83299255371094, 21.45754207519376],
[84.8250961303711, 21.447636411721067],
[84.814453125, 21.443162665723605],
[84.81376647949219, 21.43517349234091],
[84.82612609863281, 21.435493067674805],
[84.83196258544922, 21.431018949320737],
[84.83470916748047, 21.41695654178407],
[84.85118865966797, 21.3984176633486]]]);

var geometryKremenchutske = ee.Geometry.Polygon(
        [[[32.106170654296875, 49.346598848332924],
          [32.40966796875, 49.25346477497736],
          [32.68157958984375, 49.12062427498834],
          [32.7557373046875, 49.06486885623367],
          [32.8436279296875, 49.038768211951094],
          [33.013916015625, 49.04056869631683],
          [33.057861328125, 49.00995159747052],
          [32.9864501953125, 48.97030150372132],
          [33.034515380859375, 48.94505319583951],
          [33.167724609375, 48.93603284572104],
          [33.207550048828125, 48.9612857179903],
          [33.1787109375, 49.0306652257167],
          [33.25286865234375, 49.057670047140604],
          [33.25286865234375, 49.165542715508344],
          [33.1292724609375, 49.256153800301036],
          [32.98919677734375, 49.334966713917225],
          [32.9644775390625, 49.434198772487406],
          [32.894439697265625, 49.48686218444083],
          [32.792816162109375, 49.52877389852215],
          [32.803802490234375, 49.5937996327826],
          [32.77496337890625, 49.66673899228791],
          [32.647247314453125, 49.65162639183048],
          [32.630767822265625, 49.598250281733705],
          [32.6458740234375, 49.51094351526262],
          [32.649993896484375, 49.46009125091839],
          [32.633514404296875, 49.435091844215194],
          [32.658233642578125, 49.384160800744986],
          [32.5909423828125, 49.38952445158216],
          [32.4481201171875, 49.44670029695474],
          [32.398681640625, 49.49043053676264],
          [32.336883544921875, 49.49489061140408],
          [32.328643798828125, 49.514510112029],
          [32.303924560546875, 49.532339195028115],
          [32.259979248046875, 49.52342546618327],
          [32.125396728515625, 49.54927080239457],
          [31.949615478515625, 49.629393452568486],
          [31.869964599609375, 49.63828784645708],
          [31.82464599609375, 49.54748880420736],
          [31.949615478515625, 49.49667452747045]]]);


// var geometry = geometryRengali
//var geometry = geometryProsserCreek
//var geometry = geometryKremenchutske
//var geometry = geometryLaos
//Map.centerObject(geometry)

var geometry = ee.Geometry(Map.getBounds(true))


var scale = 30

// morphological internal gradient
function getEdge(mask) {
    return mask.focal_min(15, 'square', 'meters').subtract(mask.focal_min(65, 'square', 'meters')).reproject('EPSG:4326', null, 30)
}

/*
function getEdge(mask) {
    var canny = ee.Algorithms.CannyEdgeDetector(mask, 0.99, 0);
    return canny.mask(canny)
}
*/

//var palette = ['000000', 'f03b20', 'fd8d3c', 'fecc5c', 'ffffb2', 'ffffff']
var palette = ['000000',  'f03b20', 'ffff55', 'ffffb2', 'ffffee']
//var palette = ['000000', 'ffffff']

var occurrence = ee.Image('JRC/GSW1_0/GlobalSurfaceWater').select('occurrence').unmask()/*.resample('bicubic')*/.multiply(0.01)

Map.addLayer(occurrence.mask(occurrence.gt(0)), {min:0, max:1, palette:palette}, 'occurrence')
var occurrence2 = occurrence.resample('bicubic')
var occurrence2Mask = occurrence2.gt(0).focal_min(35, 'circle', 'meters').focal_max(35, 'circle', 'meters')
//.focal_mode(45, 'circle', 'meters', 3)
Map.addLayer(occurrence2.mask(occurrence2Mask), {min:0, max:1, palette:palette}, 'occurrence2')

var monthlyWater = ee.ImageCollection('JRC/GSW1_0/MonthlyHistory')

var duration = 2
var start = ee.Date('2012-01-01')
var stop = start.advance(duration, 'year')

var water = monthlyWater.filterDate(start, stop) // .map(function(i) { return i.eq(2) })

/*
var waterAll = monthlyWater.map(function(i) { return i.eq(2) })
var waterNotAll = monthlyWater.map(function(i) { return i.eq(1) })
var occurrence = waterAll.sum().divide(waterAllNot.sum().add(waterAll.sum()))
Map.addLayer(occurrence.mask(occurrence.gt(0)), {palette:['ffffff', '0000ff']}, 'occurrence')
*/

// add 25% cut-off to exclude fully intermitten water
var occurrence = ee.Image('JRC/GSW1_0/GlobalSurfaceWater')
occurrence = occurrence.select('occurrence')
var occurrence25 = occurrence.mask(occurrence.gt(25).focal_max(5, 'square', 'pixels').reproject(occurrence.projection()))
occurrence25 = occurrence25.updateMask(occurrence25.gt(0))

Map.addLayer(occurrence, {}, 'water occurrence', false)
Map.addLayer(occurrence25, {}, 'water occurrence > 20')

var blobs = occurrence25.mask()
  .reduceResolution(ee.Reducer.anyNonZero(), true)
  .reproject(occurrence.projection().scale(10,10))
  
//Map.addLayer(blobs)  



var vectors = blobs.reduceToVectors(
  {geometry: geometry, scale: 300, eightConnected: false})
  .filterBounds(geometry)
  
Map.addLayer(vectors)

var aoi = vectors.geometry()

// var aoi = ee.Geometry(Map.getBounds(true))



var occurrence = occurrence.unmask()
  //.convolve(ee.Kernel.gaussian(30, 15, 'meters'))
  
// var expectedWaterReducer = ee.Reducer.intervalMean(25, 35)
var expectedWaterReducer = ee.Reducer.intervalMean(15, 25)

function preview() {
  var i = 4 * 2
  var count = 4  * 5
  var list = water.toList(count, 0)
  for(; i<count; i++) {
    var image = ee.Image(list.get(i))
  
    var w = image.eq(2)//.unmask().convolve(ee.Kernel.gaussian(90, 60, 'meters'))
  
    // get water edge
    var edge = getEdge(w).focal_min(15, 'square', 'meters')
  
    // compute most probable occurrence
    // var f = occurrence.mask(edge).reduceRegion(ee.Reducer.frequencyHistogram(), aoi, 15)
    //print(f)
    
    // estimate fill area (compute posterior)
    var occurrenceExpected = occurrence
      .mask(edge)
      //.multiply(w)
      .reduceRegion({reducer:expectedWaterReducer, geometry: aoi, scale: scale, maxPixels: 1e13})
      .values().get(0)
      
    if(occurrenceExpected.getInfo() === null) {
      continue
    }

    var posterior = occurrence.mask(occurrence.gt(ee.Image.constant(occurrenceExpected)))
    Map.addLayer(posterior, {palette:['ffff00']}, i.toString() + ' fill', false)
    Map.addLayer(posterior, {palette:['0000ff']}, i.toString() + ' fill', false) 
  
    // show histogram of water occurrence along the 
    if(i === 33) {
      print(i, ui.Chart.image.histogram(occurrence.mask(edge), aoi, 30))
      print(occurrenceExpected)
    }
    
    
    Map.addLayer(image.eq(2).mask(image.eq(2)), {palette:['0000ff']}, i.toString(), false)
    Map.addLayer(image.eq(0).mask(image.eq(0)), {palette:['000000']}, i.toString() + ' no data', false)
    Map.addLayer(image.eq(1).mask(image.eq(1)), {palette:['ff0000']}, i.toString() + ' not water', false)
  
    Map.addLayer(edge.mask(edge), {palette:['aa0000']}, i.toString() + 'min', false)
  }
}

preview();

//return

// EXPORT
monthlyWater = monthlyWater.map(function(i) { 
    return i.eq(2) 
    .copyProperties(i)
    .set('system:time_start', i.get('system:time_start'))
  
})

monthlyWater = monthlyWater.map(function(i) {
  return i.set('any', i.reduceRegion(
    {reducer: ee.Reducer.anyNonZero(), geometry: aoi, scale: scale, maxPixels: 1e13}).values().get(0))
    .copyProperties(i)
    .set('system:time_start', i.get('system:time_start'))
}).filter(ee.Filter.eq('any', 1))


//occurrence = prior_ProsserCreek_fusion

function fillWater(i) {
  var edge = getEdge(i).focal_min(15, 'square', 'meters')

  // estimate fill area (compute posterior)
  var occurrenceExpected = occurrence.mask(edge).reduceRegion(
    {reducer:expectedWaterReducer, geometry: aoi, scale: scale, maxPixels: 1e13}
    ).values().get(0)
  
  //return ee.Feature(null, {'occurrence': occurrenceExpected})
  
  //return ee.Image.constant(occurrenceExpected).float().set('occurrence', occurrenceExpected)  
  //return i.set('occurrence', occurrenceExpected)
  
  var posterior = occurrence.gt(ee.Image.constant(occurrenceExpected)).or(i)
    .copyProperties(i)
    .set('occurrence', occurrenceExpected)  
    .set('system:time_start', i.get('system:time_start'))
    
  return ee.Algorithms.If(ee.Algorithms.IsEqual(occurrenceExpected, null), null, posterior)

  //return posterior
}

var waterFilled = monthlyWater.map(fillWater, true)

//Map.addLayer(waterFilled.sum().divide(waterFilled.count()))

var waterFilled = waterFilled.map(function(i) { 
  var area = ee.Image.pixelArea().mask(ee.Image(i)).reduceRegion(
    {reducer:ee.Reducer.sum(), geometry: aoi, scale: scale, maxPixels: 1e13}).values().get(0)
  
  //var area = ee.Image(i).reduceRegion(
  //  {reducer:ee.Reducer.sum(), geometry: aoi, scale: scale, maxPixels: 1e13}).values().get(0)
    
  return i
    .copyProperties(i)
    .set('area', area)
    .set('system:time_start', i.get('system:time_start'))
})

print(waterFilled)

print(waterFilled.size())
print(waterFilled.aggregate_array('occurrence'))

print(ui.Chart.feature.byFeature(ee.FeatureCollection(waterFilled), 'system:time_start', 'area'))

//return

Export.table.toDrive(waterFilled)

Export.video.toDrive(
  {
    collection: waterFilled.map(function(i) { return i.mask(i).visualize({palette:['ffffff'] })}), 
    region: aoi.bounds(),
    description: 'limpopo',
    fileNamePrefix: 'limpopo', 
    framesPerSecond: 5, 
    dimensions: 1920    
})

// unfilled
var waterUnfilled = monthlyWater.map(function(i) { 
  var area = ee.Image(i).reduceRegion(
    {reducer:ee.Reducer.sum(), geometry: aoi, scale: scale, maxPixels: 1e13}).values().get(0)
  return i
    .copyProperties(i)
    .set('area', area)
    .set('system:time_start', i.get('system:time_start'))
})

Export.table.toDrive(
  {
    collection: waterUnfilled,
    description: 'unfilled',
    fileNamePrefix: 'unfilled'
  }
)
