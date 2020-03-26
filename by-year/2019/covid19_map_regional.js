/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var table = ee.FeatureCollection("users/gena/covid19/areas/country_areas_AT"),
    table2 = ee.FeatureCollection("users/gena/covid19/areas/country_areas_DE"),
    table3 = ee.FeatureCollection("users/gena/covid19/areas/country_areas_FR"),
    table4 = ee.FeatureCollection("users/gena/covid19/areas/country_areas_IT"),
    table5 = ee.FeatureCollection("users/gena/covid19/areas/country_areas_NL"),
    table6 = ee.FeatureCollection("users/gena/covid19/areas/country_areas_UK"),
    geometry = /* color: #d63000 */ee.Geometry.MultiPoint();
/***** End of imports. If edited, may not auto-convert in the playground. *****/

// ref: http://stackoverflow.com/a/1293163/2343
// This will parse a delimited string into an array of
// arrays. The default delimiter is the comma, but this
// can be overriden in the second argument.
function CSVToArray( strData, strDelimiter ){
    // Check to see if the delimiter is defined. If not,
    // then default to comma.
    strDelimiter = (strDelimiter || ",");

    // Create a regular expression to parse the CSV values.
    var objPattern = new RegExp(
        (
            // Delimiters.
            "(\\" + strDelimiter + "|\\r?\\n|\\r|^)" +

            // Quoted fields.
            "(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" +

            // Standard fields.
            "([^\"\\" + strDelimiter + "\\r\\n]*))"
        ),
        "gi"
        );


    // Create an array to hold our data. Give the array
    // a default empty first row.
    var arrData = [[]];

    // Create an array to hold our individual pattern
    // matching groups.
    var arrMatches = null;


    // Keep looping over the regular expression matches
    // until we can no longer find a match.
    while (arrMatches = objPattern.exec( strData )){

        // Get the delimiter that was found.
        var strMatchedDelimiter = arrMatches[ 1 ];

        // Check to see if the given delimiter has a length
        // (is not the start of string) and if it matches
        // field delimiter. If id does not, then we know
        // that this delimiter is a row delimiter.
        if (
            strMatchedDelimiter.length &&
            strMatchedDelimiter !== strDelimiter
            ){

            // Since we have reached a new row of data,
            // add an empty row to our data array.
            arrData.push( [] );

        }

        var strMatchedValue;

        // Now that we have our delimiter out of the way,
        // let's check to see which kind of value we
        // captured (quoted or unquoted).
        if (arrMatches[ 2 ]){

            // We found a quoted value. When we capture
            // this value, unescape any double quotes.
            strMatchedValue = arrMatches[ 2 ].replace(
                new RegExp( "\"\"", "g" ),
                "\""
                );

        } else {

            // We found a non-quoted value.
            strMatchedValue = arrMatches[ 3 ];

        }


        // Now that we have our value string, let's add
        // it to the data array.
        arrData[ arrData.length - 1 ].push( strMatchedValue );
    }

    // Return the parsed data.
    return( arrData );
}

Map.addLayer(ee.Image(1), { palette: ['000000']}, 'black', true, 0.25)

var palettes = require('users/gena/packages:palettes')
var style = require('users/gena/packages:style')
var animation = require('users/gena/packages:animation')

style.SetMapStyleDark(Map)

var features = table.merge(table2).merge(table3).merge(table4).merge(table5).merge(table6)

// Map.addLayer(features)

// Map.addLayer(table)
// Map.addLayer(table2)
// Map.addLayer(table3)
// Map.addLayer(table4)
// Map.addLayer(table5)
// Map.addLayer(table6)

var blob = ee.Blob('gs://deltares-video-map/covid19_region_map.csv')

function exportNew() {
  blob.string().evaluate(function(str) {
    var data = CSVToArray(str, ',')
    
    function show(featuresValue) {
      // print(ee.List(featuresValue.aggregate_array('name')).zip(featuresValue.aggregate_array('value')))
      
      // Use an equals filter to define how the collections match.
      var filter = ee.Filter.equals({
        leftField: 'original',
        rightField: 'name'
      });
      
      // Create the join.
      var join = ee.Join.saveFirst({
        matchKey: 'match'
      });
      
      // Apply the join.
      var results = join.apply(features, featuresValue, filter).map(function(f) {
        return f.set({ value: ee.Feature(f.get('match')).get('value') })
      })
      
      results = results.filter(ee.Filter.neq('value', ''))
      
      results = results.map(function(f) {
        return f.set({ value: ee.Number.parse(f.get('value')) })
      })
      
      // Display the result.
      // print('Join: ', results);
      
      results = results.filter(ee.Filter.gt('value', 0))
      
      // print(results.aggregate_array('value'))
      
      var imageConfirmed = style.Feature.linear(results, 'value', { 
            palette: palettes.cb.RdPu[9],
            width: 0, opacity: 0.75, valueMin: 1, valueMax: 1500,
      })
  
      // return imageConfirmed
    
      // Map.addLayer(imageConfirmed, {}, 'styled', true, 0.5)
    
      var confirmedMax_r = Math.sqrt(5000)
      
      results = results.map(function(f) {
        return f.centroid().set({ value_r: ee.Number(f.get('value')).divide(Math.PI).sqrt() })
      })
    
      // var r = '#ffffff'
      var r = palettes.cb.Reds[9][8]
      var p = [r,r,r,r,r,r,r,r,r,r,r,r,r,r,r,r,r,r,r,r,r,r,r,r,r,r,r,r,r,r,r,r,r,r,r,r,r,r,r,r,r,r,r,r,r,r,r,r,r,r,r,r,r]
      var imageConfirmed = style.Feature.linear(results, 'value_r',
          { palette: p, pointSizeMin: 1, pointSizeMax: 30, width: 1, opacity: 0.75, valueMin: 1, valueMax: confirmedMax_r })  
    
      // Map.addLayer(imageConfirmed, {}, 'styled, point')
      
      // Map.addLayer(results, {}, 'raw', false)
      
      return imageConfirmed
    }  
  
    var frames = []
  
    for(var d=data[0].length-4; d<data[0].length; d++) {  
      var date = data[0][d]
    
      var featuresValue = []  
      for(var i=2; i<data.length-1; i++) {
        var name = data[i][1]
        var value = data[i][d]
        
        value = ee.String(value).replace('1 to 4', '4')
        
        featuresValue.push(ee.Feature(null, { name: name, value: value }))
      }
      featuresValue = ee.FeatureCollection(featuresValue)
      var image = show(featuresValue)
      image = image.set({ label: date })
      
      print(featuresValue)
  
      exportTiles(image, date, 0, 10)
      
      frames.push(image)
    }
    
    frames = ee.ImageCollection(frames)
    // print(frames)
  
    animation.animate(frames, { label: 'label' })
      .then(function() {
        renderFromRastarTiles()
      })
  })  
  
  
  function exportTiles(image, date, minZoom, maxZoom) {
    var name = 'corona-virus-' + date
    
    var boundsEU = ee.Geometry.Polygon(
          [[[-11.337683410337771, 71.90298300873718],
            [-11.337683410337771, 33.63001754538135],
            [41.308800964662225, 33.63001754538135],
            [41.308800964662225, 71.90298300873718]]], null, false);
  
    Export.map.toCloudStorage({
      image: image, 
      description: name, 
      bucket: 'deltares-video-map', 
      fileFormat: 'auto', 
      path: 'corona-virus-regional/' + name, 
      writePublicTiles: false, 
      minZoom: minZoom, 
      maxZoom: maxZoom, 
      skipEmptyTiles: true, 
      mapsApiKey: 'AIzaSyDItV6jEwI7jdCEqLWL4zO-ZzPvKC4193E',
      region: boundsEU
    })
  }

}

function renderFromRastarTiles() {
  // blob.string().evaluate(function(str) {
  
  var str = blob.string().getInfo()
    var data = CSVToArray(str, ',')
    
    var dates = data[0].slice(1)

    var currentLayer = null
    var layers = []
  
    function onChangeDate(v) {
      if(currentLayer == null) {
        return
      }
      currentLayer.setOpacity(0)
      currentLayer = layers[v-1]
      currentLayer.setOpacity(1)
  
      labelDate.setValue(dates[v-1])
    }

    dates.map(function(date, i) {
      var layer = ui.Map.CloudStorageLayer({
        bucket: 'deltares-video-map', 
        path: 'corona-virus/v3_regional/corona-virus-' + date, 
        maxZoom: 8, 
        name: 'corona-virus-' + date, 
        shown: true, 
        opacity: i === dates.length-1 ? 1 : 0
      })
      Map.layers().add(layer)
      layers.push(layer)
      
      if(i === dates.length-1) {
        currentLayer = layer
      }
    })

    var labelDate = ui.Label('')

    var slider = ui.Slider(1, dates.length, dates.length, 1)
    slider.onSlide(onChangeDate)
    
    slider.style().set({
      width: '200px',
      'background-color': '#00000022'
    })
    
    var panel = ui.Panel([slider, labelDate])
    
    Map.add(panel)
  // })
}


// renderFromRastarTiles()

exportNew()
