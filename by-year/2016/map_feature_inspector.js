/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var geometry = /* color: #d63000 */ee.Geometry.MultiPoint();
/***** End of imports. If edited, may not auto-convert in the playground. *****/
var app = function() {
  // switch to hybrid map  
  Map.setOptions("HYBRID")

  // add feature collection
  var basins = ee.FeatureCollection('ft:1IHRHUiWkgPXOzwNweeM89CzPYSfokjLlz7_0OTQl')
  var basinsImage = ee.Image().float().paint(basins, 0).paint(basins, 1, 1)
  Map.addLayer(basinsImage, {palette:['000000', 'ffffff']}, 'basins', true, 0.5)

  // create feature selector
  var selector = new MapFeatureSelector('basins', Map, basins)
  
  // subscribe to selection
  selector.onSelect(function(selection) {
    print('Current selection: ', ee.Feature(selection.first()))
  })
  
  // add checkbox to activate selector when checkbox is clicked
  var checkbox = ui.Checkbox({label: 'Select features', style: {position: 'top-center'}});

  checkbox.onChange(function(checked) {
    selector.setActive(checked) // activate/deactivate selector
  });
  
  ui.root.setLayout(ui.Panel.Layout.absolute());
  ui.root.add(checkbox)
}






/***
 * Listens to map selection, adds selection layer, fires feature selection events
 * 
 * @name {string} selector name, used as a name for the selection map layer
 * @map {ui.Map} map to be inspected
 * @features {ui.FeatureCollection} features to be inspected
 */
var MapFeatureSelector = function(name, map, features) {
  this.features = features
  this.map = map
  this.name = name
  this.selectionLayer = ui.Map.Layer({name: 'selector selection, ' + name, visParams: { color:'yellow' }})
  this.selection = null
  this.listeners = []

  var selector = this;
  
  /***
   * Initializes map feature selector
   */
  this.initialize = function() {
    this.map.onClick(this.onMouseClick)
    this.map.layers().add(this.selectionLayer)
  }
  
  /***
   * Activates or deactivates selector
   * 
   * @active {bool} true or false
   */
  this.setActive = function(active) {
    this.active = active
    this.map.style().set('cursor', active ? 'crosshair' : 'hand');
    this.selectionLayer.setShown(active)
  }
  
  /***
   * Mouse click event handler
   */
  this.onMouseClick = function(coords) {
    if(!selector.active) {
      return
    }
    
    var selection = ee.FeatureCollection(selector.features).filterBounds(ee.Geometry.Point(coords.lon, coords.lat))
    selector.selectionLayer.setEeObject(selection)
    
    selector.selection = selection
    
    // fire listeners
    selector.listeners.map(function(listener) {
      listener(selection)
    })
  }
  
  /***
   * Adds a new event handler, fired on feature selection. 
   */
  this.onSelect = function(listener) {
    selector.listeners.push(listener)
  }
  
  this.initialize()
}


app()