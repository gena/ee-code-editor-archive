var panel1 = ui.Panel([ui.Label('Bla-bla-bla'), ui.Button('Press Me!')],  null, {
  position: 'top-center'
})
Map.add(panel1)

var panel2 = ui.Panel([ui.Label('Lo-lo-lo'), ui.Button('Test')],  null, {
  position: 'bottom-left'
})
Map.add(panel2)

function onToggleControlsClick() {
  var shown = !panel1.style().get('shown')
  panel1.style().set({shown: shown})
  panel2.style().set({shown: shown})
}

var buttonToggleControls = ui.Button('👁️', onToggleControlsClick, false, {
  position: 'bottom-right',
  padding: '0px'
})

Map.add(buttonToggleControls)