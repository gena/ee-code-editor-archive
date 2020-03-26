var dataTable = {
  cols: [{id: 'x', type: 'number'},
         {id: 'y', type: 'number'},
         {id: 'i0', type: 'number', role: 'interval'},
         {id: 'i1', type: 'number', role: 'interval'}]
};

var values = [  
    [1, 100, 90, 110],  
    [2, 120, 95, 130],  
    [3, 130, 105, 140],  
    [4, 90, 85, 95],  
    [5, 70, 74, 63],  
    [6, 30, 39, 22],  
    [7, 80, 77, 83],  
    [8, 100, 90, 110]
]

dataTable.rows = values.map(function(row) {
  return { c: row.map(function(o) { return { v: o } }) }
})

print(dataTable)

var options = {  
    title:'Area, Interval',  
    curveType:'function',  
    series: [{'color': '#000000'}],  
    intervals: { 'style':'area' },  
    legend: 'none',  
};  

print(ui.Chart(dataTable, 'LineChart', options));
