/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var geometry = /* color: #d63000 */ee.Geometry.MultiPoint();
/***** End of imports. If edited, may not auto-convert in the playground. *****/
var app = function() {
  Map.setOptions("HYBRID")

  var tool = new DrawAreaTool(Map)
  
  // subscribe to selection
  tool.onFinished(function(area) {
    checkbox.setValue(false, false)
    print(area)
    Map.addLayer(area, {}, new Date())
  })
  
  // add checkbox to activate selector when checkbox is clicked
  var checkbox = ui.Checkbox({label: 'Draw area', style: {position: 'top-center'}});

  checkbox.onChange(function(checked) {
    if(checked) {
      tool.startDrawing()
    } else {
      tool.stopDrawing()
    }
  });
  
  ui.root.setLayout(ui.Panel.Layout.absolute());
  ui.root.add(checkbox)
}






var DrawAreaTool = function(map) {
  this.map = map
  this.layer = ui.Map.Layer({name: 'area selection tool', visParams: { color:'yellow' }})
  this.selection = null
  this.active = false
  this.points = []
  this.area = null
  
  this.listeners = []

  var tool = this;
  
  this.initialize = function() {
    this.map.onClick(this.onMouseClick)
    this.map.layers().add(this.layer)
  }
  
  this.startDrawing = function() {
    this.active = true
    this.points = []

    this.map.style().set('cursor', 'crosshair');
    this.layer.setShown(true)
  }
  
  this.stopDrawing = function() {
    tool.active = false
    tool.map.style().set('cursor', 'hand');

    tool.area = ee.Geometry.Polygon(tool.points)
    tool.layer.setEeObject(tool.area)

    tool.listeners.map(function(listener) {
      listener(tool.area)
    })
  }
  
  /***
   * Mouse click event handler
   */
  this.onMouseClick = function(coords) {
    if(!tool.active) {
      return
    }
    
    tool.points.push([coords.lon, coords.lat])

    var geom = tool.points.length > 1 ? ee.Geometry.LineString(tool.points) : ee.Geometry.Point(tool.points[0])
    tool.layer.setEeObject(geom)
    
    var l = ee.Geometry.LineString([tool.points[0], tool.points[tool.points.length-1]]).length(1).getInfo()

    if(tool.points.length > 1 && l / Map.getScale() < 5) {
       tool.stopDrawing()
    }
  }
  
  /***
   * Adds a new event handler, fired on feature selection. 
   */
  this.onFinished = function(listener) {
    tool.listeners.push(listener)
  }
  
  this.initialize()
}


app()