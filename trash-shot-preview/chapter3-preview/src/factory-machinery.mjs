// Industrial trim in the approved warm steel / teal / safety-amber family.
// Existing world solids remain the only contacts. These secondary dimensions
// are AI approximations fitted to that metre-space envelope, not CAD data.
// The caller supplies scenePrimitives so this module has no renderer imports.
const C=Object.freeze({steel:'#84978f',bright:'#bfccc0',dark:'#355a57',teal:'#397d75',cream:'#e7d9b7',amber:'#d8ad4c',rubber:'#3c504b',chrome:'#d1d7c8',red:'#ad6552',green:'#b6d09a'});
const supported=w=>w?.environment==='factory'&&[26,27,28,29,40,41,42,43,44,45,46].includes(w.worldVersion);
const mod=(value,period)=>((value%period)+period)%period;
function tools(shapes,world,kit){
  const {p,box,limb,cylinder,flat,face}=kit;
  const meta=(machinePart,extra={})=>({decoration:true,equipmentId:world.mechanism.id,machinePart,...extra});
  return {p,
    b:(part,x,y,z,w,h,d,colour=C.steel,extra={})=>box(shapes,x,y,z,w,h,d,colour,meta(part,extra)),
    rod:(part,a,b,r=.025,colour=C.chrome,extra={})=>limb(shapes,a,b,r,colour,meta(part,extra)),
    cy:(part,x,y,z,r,h,colour=C.steel,n=6,extra={})=>cylinder(shapes,x,y,z,r,h,colour,n,meta(part,extra)),
    f:(part,x,y,z,w,d,colour=C.steel,extra={})=>flat(shapes,x,y,z,w,d,colour,meta(part,extra)),
    face:(part,points,colour=C.steel,extra={})=>shapes.push(face(points,colour,null,meta(part,extra))),
  };
}
function motor(t,x,y,z,length=.54){
  // A finned electric motor, output shaft and a separate reduction housing.
  const {p,b,rod}=t;
  rod('motor-casing',p(x,y,z),p(x+length,y,z),.15,C.teal);
  for(let i=0;i<4;i++)b('motor-cooling-fin',x+.08+i*.095,y-.155,z-.16,.035,.31,.32,C.dark);
  b('motor-terminal-box',x+.15,y+.10,z-.10,.20,.18,.20,C.teal);
  for(const dx of [.10,.37])b('motor-foot',x+dx,y-.23,z-.16,.08,.09,.32,C.steel);
  b('motor-gearbox',x+length,y-.20,z-.19,.22,.40,.38,C.steel);
  rod('motor-output-shaft',p(x+length+.22,y,z),p(x+length+.36,y,z),.044,C.chrome);
}
function gusset(t,x,y,z,side=1){
  const {p,face}=t,a=p(x,y,z),b=p(x+side*.27,y,z),c=p(x,y+.34,z),d=.055;
  face('steel-gusset',[a,b,c],C.steel);
  face('steel-gusset',[p(a.x,a.y,z+d),p(c.x,c.y,z+d),p(b.x,b.y,z+d)],C.bright);
  for(const [u,v] of [[a,b],[b,c],[c,a]])face('steel-gusset',[u,v,p(v.x,v.y,z+d),p(u.x,u.y,z+d)],C.dark);
}
function doorFrame(t,world){
  const {p,b,rod,cy}=t,q=world.mechanism,z=q.min.z,w=q.max.x-q.min.x;
  for(const side of [-1,1]){
    const x=side<0?q.min.x-.20:q.max.x+.08;
    // A three-sided steel guide channel, mounting feet and bearing bolts.
    b('guide-channel-web',x,.08,z-.06,.10,5.12,.34,C.dark);
    for(const dz of [-.08,.29])b('guide-channel-flange',x-.035,.08,z+dz,.17,5.12,.045,C.steel);
    b('guide-footplate',x-.16,.018,z-.14,.40,.075,.48,C.steel);
    for(const y of [.32,1.72,3.17,4.78])cy('guide-anchor-bolt',x+.052,y,z-.103,.041,.035,C.bright);
    rod('frame-knee-brace',p(x+.05,4.63,z+.16),p(x-side*.42,5.17,z+.16),.036,C.steel);
    for(let y=.23;y<.94;y+=.24)b('guide-safety-stripe',x-.037,y,z-.128,.174,.09,.014,C.amber);
  }
  b('header-cassette',q.min.x-.25,5.42,z-.16,w+.5,.26,.52,C.teal);
  b('header-front-cover',q.min.x-.20,5.44,z-.184,w+.4,.18,.035,C.steel);
  for(const x of [q.min.x+.13,q.max.x-.21])b('shaft-bearing-pedestal',x,5.12,z-.11,.16,.25,.36,C.dark);
  rod('header-drive-shaft',p(q.min.x-.13,5.24,z+.075),p(q.max.x+.23,5.24,z+.075),.064,C.chrome);
  if(world.factoryType==='shutter'){
    motor(t,q.max.x+.15,5.24,z+.075,.48);
    b('drive-chain-guard',q.max.x+.17,4.72,z-.15,.24,.50,.37,C.amber);
    b('door-service-box',q.min.x-.58,1.13,z-.26,.30,.54,.29,C.teal);
    cy('door-stop-button',q.min.x-.43,1.35,z-.28,.056,.04,C.red);
  }
}
function conveyorStatic(t,world){
  const {p,b,rod,cy}=t,a=world.solids.find(s=>s.kind==='conveyor'),lo=a.min,hi=a.max;
  for(const side of [-1,1]){
    const x=side<0?lo.x-.115:hi.x+.025;
    b('belt-side-chassis',x,.76,lo.z-.06,.09,.29,hi.z-lo.z+.12,C.teal);
    b('belt-safety-edge',x-.01,1.125,lo.z,.11,.064,hi.z-lo.z,C.amber);
    for(const z of [lo.z+.20,hi.z-.28]){
      b('conveyor-leg-column',x+.015,.06,z,.065,.72,.12,C.dark);
      b('conveyor-levelling-foot',x-.06,.02,z-.065,.21,.055,.26,C.steel);
      rod('conveyor-leg-brace',p(x+.05,.20,z+.06),p(x+.05,.77,z+(z<3?.55:-.47)),.026,C.steel);
      cy('leg-lock-nut',x+.05,.075,z+.06,.055,.07,C.bright);
    }
  }
  for(const z of [lo.z+.27,(lo.z+hi.z)/2,hi.z-.27])b('chassis-cross-tie',lo.x-.07,.67,z,.14+hi.x-lo.x,.08,.11,C.steel);
  // Rollers pass across the machine. Their shafts/caps remain visible outside
  // its canonical solid body, while the return run is visible below it.
  for(const z of [lo.z+.14,hi.z-.14]){
    rod('end-roller',p(lo.x-.12,1.054,z),p(hi.x+.12,1.054,z),.132,C.rubber);
    for(const x of [lo.x-.14,hi.x+.12]){
      b('end-bearing-block',x-.045,.93,z-.10,.09,.23,.20,C.steel);
      rod('end-roller-axle',p(x-.05,1.054,z),p(x+.05,1.054,z),.038,C.chrome);
    }
  }
  for(let z=lo.z+.65;z<hi.z-.5;z+=.70)rod('return-idler',p(lo.x-.03,.73,z),p(hi.x+.03,.73,z),.050,C.steel);
  b('belt-return-run',lo.x,.774,lo.z+.12,hi.x-lo.x,.026,hi.z-lo.z-.24,C.rubber);
  motor(t,hi.x+.14,.96,hi.z-.14,.51);
  b('end-drive-guard',hi.x+.77,.79,hi.z-.32,.11,.34,.36,C.amber);
  b('belt-control-pedestal',lo.x-.42,.15,lo.z+.12,.26,.85,.27,C.teal);
  b('belt-control-head',lo.x-.44,1.0,lo.z+.10,.30,.15,.31,C.steel);
}
function bankStatic(t,world){
  const {p,b,rod,cy,face}=t;
  for(const rail of world.solids.filter(s=>s.kind==='bank-rail')){
    const side=rail.min.x<0?-1:1,x=side<0?rail.min.x-.075:rail.max.x+.005,z0=rail.min.z,z1=rail.max.z;
    for(const y of [.20,4.28])b('bank-backbone',x-.04,y,z0-.055,.12,.14,z1-z0+.11,C.teal);
    for(const z of [z0+.13,(z0+z1)/2,z1-.25]){
      b('bank-upright',x-.06,.06,z,.16,4.40,.13,C.dark);
      b('bank-foot',x-.20,.018,z-.10,.44,.08,.36,C.steel);
      for(const y of [.35,4.03])cy('bank-anchor-bolt',x+.015,y,z-.025,.037,.035,C.bright);
      gusset(t,x+side*.025,.23,z,side);
    }
    // The thin engineered impact skin stays on the canonical rail plane.
    const inner=side<0?rail.max.x+.003:rail.min.x-.003;
    for(let z=z0+.055;z<z1-.4;z+=1.02){
      const end=Math.min(z+.94,z1-.055);
      face('bank-impact-liner',[p(inner,.15,z),p(inner,4.18,z),p(inner,4.18,end),p(inner,.15,end)],z%2<1?C.bright:C.steel);
      b('bank-liner-back-rib',x-.055,.16,z+.04,.14,4.07,.065,C.steel);
    }
    // A helical shock mount and its axle communicate an engineered rebound
    // surface. They are beside, rather than inside, the central throw lane.
    for(const y of [1.12,3.32]){
      const z=(z0+z1)/2+.2,start=p(x+side*.025,y,z),end=p(x+side*.37,y,z);
      rod('bank-damper-axle',start,end,.026,C.dark);
      const count=8,at=i=>p(start.x+(end.x-start.x)*i/count,y+Math.cos(i/count*Math.PI*4)*.067,z+Math.sin(i/count*Math.PI*4)*.067);
      for(let i=0;i<count;i++)rod('bank-damper-spring',at(i),at(i+1),.018,C.chrome);
      b('bank-damper-endcap',end.x-.047,y-.105,z-.105,.094,.21,.21,C.teal);
    }
    b('bank-indicator-housing',x-.12,4.50,z0+.025,.26,.18,.22,C.dark);
  }
}
function relayStatic(t,world){
  const {p,b,rod,cy}=t,q=world.mechanism,plate=world.solids.find(s=>s.id===q.plateId),a=plate.min,c=plate.max;
  doorFrame(t,world);
  for(const x of [a.x+.10,c.x-.10])for(const z of [a.z+.10,c.z-.10]){
    rod('plate-spring-guide',p(x,.09,z),p(x,.615,z),.035,C.dark);
    b('plate-foot',x-.10,.02,z-.10,.20,.07,.20,C.steel);
    for(const y of [.26,.40,.54])cy('plate-load-spring',x,y,z,.081,.024,C.chrome,8);
  }
  b('plate-base-bridge',a.x+.04,.14,a.z+.04,c.x-a.x-.08,.095,c.z-a.z-.08,C.teal);
  for(const x of [a.x-.025,c.x-.025])b('plate-safety-edge',x,c.y-.035,a.z,.05,.046,c.z-a.z,C.amber);
  for(const z of [a.z-.025,c.z-.025])b('plate-safety-edge',a.x,c.y-.035,z,c.x-a.x,.046,.05,C.amber);
  // The hydraulic power pack and closed control cabinet sit by the side wall.
  b('relay-control-cabinet',-3.68,.18,2.03,.55,1.57,.39,C.teal);
  b('relay-control-door',-3.64,.23,2.009,.47,1.44,.025,C.steel);
  b('relay-cabinet-handle',-3.23,.83,1.98,.035,.30,.030,C.chrome);
  for(let y=.38;y<.85;y+=.10)b('relay-cabinet-vent',-3.58,y,1.975,.29,.022,.06,C.dark);
  b('hydraulic-oil-reservoir',-3.71,.07,3.66,.57,.43,.70,C.teal);
  cy('hydraulic-filler-cap',-3.54,.50,3.85,.063,.06,C.amber);
  motor(t,-3.66,.75,3.88,.34);
  for(const side of [-1,1]){
    const x=side<0?q.min.x-.34:q.max.x+.34;
    cy('hydraulic-ram-barrel',x,.22,q.min.z+.14,.126,1.70,C.teal,8);
    cy('hydraulic-ram-collar',x,1.84,q.min.z+.14,.150,.11,C.steel,8);
    b('hydraulic-ram-base',x-.20,.04,q.min.z-.06,.40,.13,.40,C.steel);
  }
  const wire=[p(a.x-.04,.10,(a.z+c.z)/2),p(-2.70,.10,(a.z+c.z)/2),p(-2.70,.10,2.22),p(-3.15,.47,2.22)];
  for(let i=0;i<wire.length-1;i++)rod('pressure-plate-signal-cable',wire[i],wire[i+1],.021,C.dark);
  const hose=[p(-3.32,.51,4.08),p(-3.44,.48,4.40),p(-3.54,.48,4.54),p(-3.54,.80,4.54)];
  for(let i=0;i<hose.length-1;i++)rod('hydraulic-feed-hose',hose[i],hose[i+1],.038,C.dark);
}
function rightGuideStatic(t,guide){
  const {p,b,rod,cy,face}=t,lo=guide.min,hi=guide.max,z0=lo.z,z1=hi.z;
  const meta={equipmentId:guide.id,reflectorId:guide.id,routeRole:guide.routeRole};
  // This is a rigid polished guide, not an extra energy source. The six
  // canonical solid faces are drawn by factory-scene. Thin seams highlight
  // that surface; its bearings, ribs and service drive sit behind it.
  for(const z of [z0+.09,(z0+z1)/2,z1-.21]){
    b('right-guide-rear-post',hi.x+.035,.03,z,.12,hi.y+.14,.13,C.teal,meta);
    b('right-guide-footplate',lo.x+.02,.014,z-.10,.39,.075,.34,C.steel,meta);
    rod('right-guide-rear-brace',p(hi.x+.09,.30,z+.07),p(hi.x+.30,1.35,z+.07),.032,C.dark,meta);
  }
  for(const y of [.09,hi.y+.035])b('right-guide-edge-rail',lo.x+.025,y,z0-.16,.26,.10,z1-z0+.32,C.teal,meta);
  for(const z of [z0+.18,(z0+z1)/2,z1-.18])b('right-guide-back-rib',hi.x+.016,.20,z,.04,hi.y-.38,.065,C.steel,meta);
  for(const z of [z0-.10,z1+.10]){
    cy('right-guide-edge-roller',lo.x+.09,.18,z,.062,hi.y-.30,C.chrome,8,meta);
    for(const y of [.09,hi.y-.11])b('right-guide-roller-bearing',lo.x+.022,y,z-.085,.15,.13,.17,C.dark,meta);
  }
  // Narrow highlights communicate the low-friction metal without drawing a
  // second complete reflection plane or extending into the throwing lane.
  for(let z=z0+.32;z<z1-.20;z+=1.02)face('right-guide-polished-seam',[p(lo.x-.002,.23,z),p(lo.x-.002,hi.y-.20,z),p(lo.x-.002,hi.y-.20,z+.013),p(lo.x-.002,.23,z+.013)],C.chrome,meta);
  for(const y of [.18,hi.y-.16])face('right-guide-polished-edge',[p(lo.x-.002,y,z0+.05),p(lo.x-.002,y+.016,z0+.05),p(lo.x-.002,y+.016,z1-.05),p(lo.x-.002,y,z1-.05)],C.bright,meta);
  for(const z of [z0+.11,z1-.11])for(const y of [.28,hi.y-.29])cy('right-guide-fastener',lo.x+.069,y,z,.028,.025,C.amber,6,meta);
  b('right-guide-service-gearbox',hi.x+.03,hi.y+.12,z0+.04,.24,.24,.32,C.teal,meta);
  cy('right-guide-service-motor',hi.x+.15,hi.y+.36,z0+.20,.088,.19,C.steel,6,meta);
  rod('right-guide-service-shaft',p(lo.x+.09,hi.y-.02,z0-.10),p(lo.x+.09,hi.y+.22,z0-.10),.033,C.chrome,meta);
}
function pistonStatic(t,world){
  const {p,b,rod}=t;
  // Two fixed hydraulic cylinders support each impact paddle. The ram itself
  // is drawn from the live collider below, using the shared physics clock.
  for(const q of world.mechanism.pistons){
    const side=q.side==='left'?-1:1,x=side*3.30;
    for(const z of [1.4,5.8]){
      b('piston-anchor-plinth',x-.23,.025,z-.28,.46,.12,.56,C.dark,{pistonId:q.id});
      b('piston-anchor-upright',x-.14,.14,z-.17,.28,2.76,.34,C.teal,{pistonId:q.id});
      for(const y of [1.0,2.6]){
        rod('piston-fixed-barrel',p(x,y,z),p(x-side*.65,y,z),.14,C.teal,{pistonId:q.id});
        rod('piston-barrel-collar',p(x-side*.60,y,z),p(x-side*.69,y,z),.18,C.bright,{pistonId:q.id});
      }
      rod('piston-anchor-brace',p(x,.25,z-.19),p(x,1.9,z-.53),.045,C.steel,{pistonId:q.id});
    }
  }
}
function pistonDynamic(t,motion){
  const {p,b,rod}=t;
  for(const q of motion.pistons??[]){
    const side=q.side==='left'?-1:1,outer=side<0?q.min.x:q.max.x,x=side*3.30,meta={pistonId:q.id,colliderId:q.id,colliderOffset:q.offset};
    for(const z of [1.4,5.8])for(const y of [1.0,2.6]){
      rod('piston-live-chrome-rod',p(x-side*.65,y,z),p(outer,y,z),.065,C.chrome,meta);
      b('piston-live-clevis',outer-.09,y-.12,z-.13,.18,.24,.26,C.dark,meta);
    }
    // The pale impact surface itself is drawn by physicalBox at the exact
    // collider coordinates. Ribs stay behind that plane, never in the lane.
    for(const z of [q.min.z+.07,(q.min.z+q.max.z)/2,q.max.z-.14]){
      const back=outer+side*.025;
      b('piston-paddle-back-rib',back-.045,q.min.y+.12,z,.09,q.max.y-q.min.y-.24,.07,C.teal,meta);
    }
    const front=side<0?q.max.x+.003:q.min.x-.003;
    for(const y of [q.min.y+.13,q.max.y-.20]){
      t.face('piston-paddle-safety-band',[p(front,y,q.min.z+.04),p(front,y+.065,q.min.z+.04),p(front,y+.065,q.max.z-.04),p(front,y,q.max.z-.04)],C.amber,meta);
    }
  }
}
function conveyorFrame(belt){
  const a=belt.min,c=belt.max,v=belt.surfaceVelocity??belt.direction??{x:0,z:1},axis=Math.abs(v.x)>Math.abs(v.z)?'x':'z',sign=(v[axis]||1)>0?1:-1,other=axis==='x'?'z':'x';
  return {a,c,axis,other,sign,length:c[axis]-a[axis],width:c[other]-a[other],at:(along,y,across)=>axis==='x'?{x:along,y,z:across}:{x:across,y,z:along}};
}
function conveyorLineStatic(t,world){
  const {p,b,rod,face}=t;
  for(const belt of world.solids.filter(q=>q.kind==='conveyor')){
    const q=conveyorFrame(belt),{a,c,axis,other,at,length,width}=q,meta={equipmentId:belt.id,beltId:belt.id},railY=c.y-.28;
    const partBox=(part,along,y,across,l,h,w,col)=>{const v=at(along,y,across);b(part,v.x,v.y,v.z,axis==='x'?l:w,h,axis==='x'?w:l,col,meta);};
    for(const edge of [a[other]-.07,c[other]+.015]){
      partBox('line-belt-chassis',a[axis]-.03,railY,edge,length+.06,.22,.055,C.teal);
      partBox('line-belt-safety-edge',a[axis],c.y-.048,edge,length,.045,.055,C.amber);
      for(const z of [a[axis]+.17,c[axis]-.17]){
        partBox('line-belt-leg',z,.06,edge,.07,railY-.06,.055,C.dark);
        partBox('line-belt-foot',z-.055,.018,edge-.07,.18,.055,.19,C.steel);
      }
    }
    for(const end of [a[axis]+.13,c[axis]-.13]){
      rod('line-belt-end-roller',at(end,c.y-.12,a[other]-.07),at(end,c.y-.12,c[other]+.07),.105,C.rubber,meta);
      for(const edge of [a[other]-.10,c[other]+.065])partBox('line-belt-bearing',end-.075,c.y-.23,edge,.15,.20,.045,C.bright);
    }
    partBox('line-belt-return-run',a[axis]+.13,c.y-.33,a[other]+.02,length-.26,.023,width-.04,C.rubber);
    // A compact geared drive is mounted outside each belt, away from the
    // canonical top and transfer overlap. It never becomes a collision proxy.
    const end=c[axis]-.18,edge=c[other]+.18;
    rod('line-belt-drive-motor',at(end-.14,c.y-.18,edge),at(end+.14,c.y-.18,edge),.115,C.teal,meta);
    partBox('line-belt-drive-gearbox',end-.08,c.y-.29,c[other]+.05,.16,.22,.14,C.steel);
    const mid=(a[axis]+c[axis])/2,center=(a[other]+c[other])/2,y=c.y+.012,arrow=.19,half=Math.min(.13,width*.18);
    face('line-belt-direction-mark',[at(mid+q.sign*arrow,y,center),at(mid-q.sign*.12,y,center-half),at(mid-q.sign*.12,y,center+half)],C.cream,{...meta,direction:{...belt.surfaceVelocity}});
  }
  for(const press of world.mechanism.presses??[])pressFrame(t,world,press);
}
function pressFrame(t,world,press){
  const {p,b,rod}=t,a=press.min,c=press.max,across=c.x-a.x>=c.z-a.z?'x':'z',other=across==='x'?'z':'x',center={x:(a.x+c.x)/2,z:(a.z+c.z)/2},mount=c.y+press.lift+.65,meta={pressId:press.id,equipmentId:press.id};
  const at=(v,y,depth)=>across==='x'?p(v,y,depth):p(depth,y,v),width=c[across]-a[across],depth=center[other];
  for(const v of [a[across]-.24,c[across]+.12]){
    const pos=at(v,.04,depth-.16);
    b('press-frame-column',pos.x,pos.y,pos.z,across==='x'?.12:.32,mount+.20,across==='x'?.32:.12,C.teal,meta);
    const foot=at(v-.10,.018,depth-.26);
    b('press-frame-foot',foot.x,foot.y,foot.z,across==='x'?.32:.52,.09,across==='x'?.52:.32,C.dark,meta);
    rod('press-column-inset',at(v+.05,.35,depth-.17),at(v+.05,mount-.10,depth-.17),.025,C.bright,meta);
  }
  const top=at(a[across]-.25,mount+.12,depth-.21);
  b('press-overhead-crosshead',top.x,top.y,top.z,across==='x'?width+.5:.42,.24,across==='x'?.42:width+.5,C.teal,meta);
  rod('press-fixed-hydraulic-barrel',p(center.x,mount+.15,center.z),p(center.x,mount-.50,center.z),.16,C.teal,meta);
  t.cy('press-hydraulic-collar',center.x,mount-.53,center.z,.19,.08,C.bright,8,meta);
  // A small fixed control box establishes the scale of the machine.
  const panel=at(a[across]-.38,1.05,depth-.25);
  b('press-control-box',panel.x,panel.y,panel.z,.22,.38,.12,C.steel,meta);
}
function pressHead(t,world,press){
  const {p,b,rod}=t,definition=world.mechanism.presses.find(q=>q.id===press.id),a=press.min,c=press.max,cx=(a.x+c.x)/2,cz=(a.z+c.z)/2,mount=definition.max.y+definition.lift+.65,meta={pressId:press.id,colliderId:press.id,pressLift:press.lift};
  rod('press-live-hydraulic-rod',p(cx,mount-.50,cz),p(cx,c.y+.015,cz),.075,C.chrome,meta);
  b('press-live-rod-coupler',cx-.14,c.y,cz-.14,.28,.10,.28,C.dark,meta);
  for(const x of [a.x+.035,c.x-.075])b('press-live-crosshead-rib',x,c.y-.16,a.z+.025,.04,.13,c.z-a.z-.05,C.teal,meta);
  // Narrow safety stripes are attached to the actual descending head, rather
  // than independently animated. They mark a hazard without revealing timing.
  const z=a.z-.005;
  t.face('press-live-hazard-band',[p(a.x+.02,a.y+.045,z),p(c.x-.02,a.y+.045,z),p(c.x-.02,a.y+.15,z),p(a.x+.02,a.y+.15,z)],C.amber,meta);
  for(let x=a.x+.06;x<c.x-.10;x+=.28)t.face('press-live-hazard-stripe',[p(x,a.y+.045,z-.001),p(x+.07,a.y+.045,z-.001),p(x+.14,a.y+.15,z-.001),p(x+.07,a.y+.15,z-.001)],C.dark,meta);
}
function conveyorLineDynamic(t,world,motion){
  for(const belt of motion.belts??[]){
    const solid=world.solids.find(q=>q.id===belt.id),q=conveyorFrame(solid),{a,c,at,axis,other,length}=q,gap=.40,offset=mod((belt.offset??0)*q.sign,gap),meta={equipmentId:belt.id,beltId:belt.id};
    for(let v=a[axis]+.08+offset;v<c[axis]-.06;v+=gap){
      t.face('line-belt-moving-link',[at(v,c.y+.007,a[other]+.035),at(v+.018,c.y+.007,a[other]+.035),at(v+.018,c.y+.007,c[other]-.035),at(v,c.y+.007,c[other]-.035)],C.chrome,meta);
    }
    const back=mod(-(belt.offset??0)*q.sign,gap);
    for(let v=a[axis]+.10+back;v<a[axis]+length-.10;v+=gap)t.rod('line-belt-return-link',at(v,c.y-.302,a[other]+.04),at(v,c.y-.302,c[other]-.04),.009,C.bright,meta);
  }
  for(const press of motion.presses??[])pressHead(t,world,press);
}
export function factoryMachineryStatic(world,kit){
  if(!supported(world))return [];
  const shapes=[],t=tools(shapes,world,kit);
  if(world.factoryType==='shutter')doorFrame(t,world);
  if(world.factoryType==='conveyor'&&world.worldVersion!==46)conveyorStatic(t,world);
  if(world.worldVersion===46)conveyorLineStatic(t,world);
  if(world.factoryType==='bank'&&world.worldVersion!==45)bankStatic(t,world);
  if(world.worldVersion===45)pistonStatic(t,world);
  if(world.factoryType==='relay')relayStatic(t,world);
  for(const guide of world.solids.filter(s=>s.kind==='machine-reflector'))rightGuideStatic(t,guide);
  return shapes;
}
function driveSpokes(t,part,center,radius,angle,axis='x',colour=C.bright){
  const {p,rod}=t;
  for(let i=0;i<2;i++){
    const a=angle+i*Math.PI/2,c=Math.cos(a)*radius,s=Math.sin(a)*radius;
    const at=side=>axis==='x'?p(center.x,center.y+side*c,center.z+side*s):p(center.x+side*c,center.y+side*s,center.z);
    rod(part,at(-1),at(1),.015,colour);
  }
}
function doorDynamic(t,world,door){
  const {p,b,rod}=t,w=door.max.x-door.min.x,z=door.min.z-.029;
  for(let y=door.min.y+.36;y<door.max.y-.20;y+=.76)b('door-stiffening-rib',door.min.x+.035,y,z,w-.07,.048,.038,C.steel);
  b('door-bottom-beam',door.min.x+.02,door.min.y+.03,z-.022,w-.04,.075,.080,C.dark);
  for(const side of [-1,1]){
    const x=side<0?door.min.x+.085:door.max.x-.085;
    for(const y of [door.min.y+.32,door.max.y-.32])rod('door-guide-wheel',p(x-.025,y,door.min.z+.09),p(x+.025,y,door.min.z+.09),.086,C.dark);
    b('door-lift-bracket',x-.06,door.min.y+1.86,door.min.z-.044,.12,.23,.054,C.amber);
  }
  if(world.factoryType==='shutter'){
    // The witness is the actual collider lift, never a decorative time sine.
    driveSpokes(t,'shutter-lift-drive-witness',p(door.max.x+.25,5.04,door.min.z-.173),.16,door.lift/.15,'z');
  }
}
function conveyorDynamic(t,world,motion){
  const {p,f}=t,a=world.solids.find(s=>s.kind==='conveyor'),lo=a.min,hi=a.max,gap=.42;
  const span=hi.z-lo.z-.24,forward=mod(motion.belt.offset,gap),back=mod(-motion.belt.offset,gap);
  for(let z=lo.z+.12+forward;z<lo.z+.12+span-.03;z+=gap)f('upper-belt-link',lo.x+.025,hi.y+.008,z,hi.x-lo.x-.05,.025,C.chrome);
  for(let z=lo.z+.12+back;z<lo.z+.12+span-.03;z+=gap)f('return-belt-link',lo.x+.025,.807,z,hi.x-lo.x-.05,.024,C.bright);
  driveSpokes(t,'conveyor-drive-witness',p(hi.x+.88,.96,hi.z-.14),.124,motion.belt.offset/.132);
}
function relayDynamic(t,world,motion){
  const {p,b,rod,cy,f}=t,q=world.mechanism,lift=motion.gate.lift,pressed=!!motion.plate.pressed;
  for(const side of [-1,1]){
    const x=side<0?q.min.x-.34:q.max.x+.34,z=q.min.z+.14;
    // Three nested telescopic ram segments extend with the recorded gate.
    for(let i=0;i<3;i++)rod(`hydraulic-piston-stage-${i+1}`,p(x,1.91+i*lift/3,z),p(x,1.97+(i+1)*lift/3,z),.095-i*.024,C.chrome);
    b('hydraulic-moving-clevis',x-.13,1.94+lift,z-.13,.26,.17,.26,C.steel);
    rod('hydraulic-gate-link',p(x,2.01+lift,z),p(side<0?q.min.x+.06:q.max.x-.06,2.01+lift,z),.052,C.steel);
  }
  cy('relay-live-indicator',-3.50,1.44,1.965,.062,.051,pressed?C.green:C.red,8,{pressed});
  cy('relay-live-indicator-ring',-3.50,1.428,1.965,.081,.010,C.dark,8,{pressed});
  const plate=world.solids.find(s=>s.id===q.plateId);
  f('plate-latched-witness',plate.min.x+.11,plate.max.y+.013,plate.min.z+.11,.17,.17,pressed?C.green:C.dark,{pressed});
}
function rightGuideDynamic(t,guide,time){
  const {p,rod}=t,angle=mod(time,8)*Math.PI,meta={equipmentId:guide.id,reflectorId:guide.id,routeRole:guide.routeRole};
  // The service roller's two small top markers share the eight-second world
  // clock. They do not move or replace the rigid gameplay surface.
  for(const z of [guide.min.z-.10,guide.max.z+.10])for(let i=0;i<2;i++){
    const a=angle+i*Math.PI/2,c=Math.cos(a)*.055,s=Math.sin(a)*.055;
    rod('right-guide-roller-drive-witness',p(guide.min.x+.09-c,guide.max.y+.019,z-s),p(guide.min.x+.09+c,guide.max.y+.019,z+s),.009,C.amber,meta);
  }
}
export function factoryMachineryDynamic(world,motion,time,kit){
  if(!supported(world))return [];
  if(!Number.isFinite(time))throw new TypeError('Factory machinery time must be finite');
  const shapes=[],t=tools(shapes,world,kit);
  const door=motion.shutter??motion.gate;
  if(door)doorDynamic(t,world,door);
  if(motion.belt&&world.worldVersion!==46)conveyorDynamic(t,world,motion);
  if(world.worldVersion===46)conveyorLineDynamic(t,world,motion);
  if(motion.gate)relayDynamic(t,world,motion);
  if(world.worldVersion===45)pistonDynamic(t,motion);
  for(const witness of world.worldVersion===45?[]:motion.bankLights){
    const rail=world.solids.find(s=>s.id===witness.id),side=rail.min.x<0?-1:1,x=side<0?rail.min.x-.060:rail.max.x+.060;
    t.cy('bank-contact-witness',x,4.66,rail.min.z+.135,.078,.041,witness.lit?C.green:C.dark,8,{contactWitnessId:witness.id,lit:!!witness.lit});
    t.cy('bank-contact-bezel',x,4.651,rail.min.z+.135,.105,.013,C.amber,8,{contactWitnessId:witness.id,lit:!!witness.lit});
  }
  for(const guide of world.solids.filter(s=>s.kind==='machine-reflector'))rightGuideDynamic(t,guide,time);
  return shapes;
}
