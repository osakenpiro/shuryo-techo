// Pure presentation geometry. The engine's rotated shape remains the authority.
export function footprintEdges(cells){
 const occupied=new Set(cells.map(([x,y])=>x+','+y)),edges=[];
 for(const [x,y] of cells){
  if(!occupied.has(x+','+(y-1)))edges.push([x,y,x+1,y]);
  if(!occupied.has((x+1)+','+y))edges.push([x+1,y,x+1,y+1]);
  if(!occupied.has(x+','+(y+1)))edges.push([x+1,y+1,x,y+1]);
  if(!occupied.has((x-1)+','+y))edges.push([x,y+1,x,y]);
 }
 return edges;
}

export function footprintMarkup(cells){
 if(!cells.length)return '';
 const w=Math.max(...cells.map(([x])=>x))+1,h=Math.max(...cells.map(([,y])=>y))+1;
 const view='viewBox="0 0 '+w+' '+h+'" preserveAspectRatio="none" aria-hidden="true" focusable="false"';
 const fill=cells.map(([x,y])=>'M'+x+' '+y+'h1v1h-1z').join('');
 const contour=footprintEdges(cells).map(([x,y,a,b])=>'M'+x+' '+y+'L'+a+' '+b).join('');
 return '<svg class="bag-occupancy-fill" '+view+'><path d="'+fill+'"/></svg>'+
  '<svg class="bag-occupancy-contour" '+view+'><path d="'+contour+'" vector-effect="non-scaling-stroke"/></svg>';
}
