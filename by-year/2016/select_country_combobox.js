/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var countries = ee.FeatureCollection("ft:1tdSwUL7MVpOauSgRzqVTOwdfy17KDbw-1d9omPw");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
// get country names
var names = countries.aggregate_array('Country')

// initialize combobox
var select = ui.Select({
  items: names.getInfo(),
  
  onChange: function(key) {
    var selectedCountry = ee.Feature(countries.filter(ee.Filter.eq('Country', key)).first())
    Map.centerObject(selectedCountry);
    
    // show country
    var layer = ui.Map.Layer(selectedCountry, {color:'green'}, 'selected country')
    Map.layers().set(0, layer)
  }
});

// show
select.setPlaceholder('Choose a country ...');
print(select)