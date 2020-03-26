var table = 
{
  cols: [
    {type: 'number'},
    {type: 'number'},
    {type: 'string', role: 'annotation'}
  ],
  rows: [
    {c: [{v: 0}, {v: 1}]},
    {c: [{v: 1}, {v: 4}]},
    {c: [{v: 2}, {v: 2}]},
    {c: [{v: 3}, {v: 5}]},
    {c: [{v: 4}, {v: 2}, {v: 'A'}]}
  ]
};

print(ui.Chart(table).setOptions({
  displayAnnotations: true
}))

