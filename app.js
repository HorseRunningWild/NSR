/* NSR project page · buildless, dependency-free browser interactions. */
'use strict';
const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
let motion = !reduceMotion.matches;
try { if (localStorage.getItem('nsr-motion') === 'off') motion = false; } catch (_) {}
const palette = {ink:'#243b36', teal:'#39796b', coral:'#c96849', paper:'#f7f6f0'};
// Population identity follows the biological figure everywhere on the page.
const populationColors = {E:'#397bbb', Z:'#ca762f', R:'#4e8750', C:'#8750ac'};
const populationLights = {E:'#8ebce7', Z:'#efb278', R:'#a8ca91', C:'#c8a4e4'};
let traces = null, queryIndex = 0, traceStep = 0, playing = false, playTimer = null;
let heroAngle = -.2, heroDrag = false, dragX = 0, burst = 0;
let tracePoints = [], pointer = {x:-1000,y:-1000};

const boot = $('#boot');
if (motion) boot.classList.add('active');
function finishBoot() { boot.classList.add('done'); setTimeout(() => boot.remove(), 500); }
const bootTimeout = setTimeout(finishBoot, 1800);
Promise.race([document.fonts.ready, new Promise(resolve => setTimeout(resolve, 1100))]).then(() => { setTimeout(() => {clearTimeout(bootTimeout); finishBoot();}, 450); });

function setMotion(next) {
  motion = next;
  $('#motion-toggle').setAttribute('aria-pressed', String(!motion));
  $('#motion-toggle').setAttribute('aria-label', motion ? 'Pause decorative animation' : 'Resume decorative animation');
  $('#motion-label').textContent = motion ? 'Motion on' : 'Motion off';
  document.body.classList.toggle('motion-paused', !motion);
  try { localStorage.setItem('nsr-motion', motion ? 'on' : 'off'); } catch (_) {}
  drawAmbient(0); drawHero(0);
}
$('#motion-toggle').addEventListener('click', () => setMotion(!motion));
reduceMotion.addEventListener('change', e => { if(e.matches) {setMotion(false); stopTrace();} });
$$('.brand').forEach(a => a.addEventListener('click', () => { burst = 2.4; if(!motion) drawHero(1); }));

function setupCanvas(id) {
  const canvas = $(id), ctx = canvas.getContext('2d');
  const state = {canvas,ctx,w:0,h:0,visible:true};
  const resize = () => { const b=canvas.getBoundingClientRect(), d=Math.min(devicePixelRatio||1,2); state.w=b.width;state.h=b.height;canvas.width=Math.round(b.width*d);canvas.height=Math.round(b.height*d);ctx.setTransform(d,0,0,d,0,0); };
  new ResizeObserver(() => { resize(); redraw(); }).observe(canvas);
  new IntersectionObserver(([entry]) => state.visible=entry.isIntersecting, {rootMargin:'100px'}).observe(canvas);
  resize(); return state;
}
let ready = false;
function redraw(){if(!ready)return; drawHero(performance.now()/1000);drawAmbient(performance.now()/1000);drawTrace();}
const hero = setupCanvas('#hero-network'), ambient = setupCanvas('#ambient'), trace = setupCanvas('#trace-canvas');
ready = true;

function line(ctx,a,b,color,width=1) {ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();}
function circle(ctx,p,r,color){ctx.beginPath();ctx.arc(p.x,p.y,r,0,Math.PI*2);ctx.fillStyle=color;ctx.fill();}
function label(ctx,text,x,y,size,color,align='left',font='Inter, Arial, sans-serif'){ctx.font=`${size}px ${font}`;ctx.textAlign=align;ctx.fillStyle=color;ctx.fillText(text,x,y);}
function drawAmbient(t) {
  const {ctx,w,h}=ambient;ctx.clearRect(0,0,w,h);
  const pts=[];
  for(let i=0;i<40;i++){const x=((Math.sin(i*12.9898)*43758.5453)%1+1)%1*w,y=((Math.sin(i*4.114)*23421.631)%1+1)%1*h;pts.push({x:x+Math.sin(t*.16+i)*5,y:y+Math.cos(t*.1+i)*4});}
  pts.forEach((p,i)=>{const near=Math.max(0,1-Math.hypot(p.x-pointer.x,p.y-pointer.y)/200);circle(ctx,p,1.3+near,near>.25?'#b27d5860':'#39796b22');pts.slice(i+1).forEach(q=>{const d=Math.hypot(p.x-q.x,p.y-q.y);if(d<150)line(ctx,p,q,`rgba(57,121,107,${(.035+near*.10)*(1-d/150)})`,.7);});});
}
window.addEventListener('pointermove',e=>{pointer={x:e.clientX,y:e.clientY};},{passive:true});
function drawHero(t) {
  const {ctx,w,h}=hero;ctx.clearRect(0,0,w,h);if(!w)return;
  const s=Math.min(w/540,h/470), angle=heroAngle+(motion&&!heroDrag?Math.sin(t*.15)*.08:0);
  const project=(x,y,z)=>({x:w*.51+(x*Math.cos(angle)+z*Math.sin(angle))*s,y:h*.51+(y+(z*Math.cos(angle)-x*Math.sin(angle))*.5)*s});
  const layers=[{y:132,key:'E',name:'entities',rows:1,cols:10,color:populationColors.E},{y:40,key:'Z',name:'bindings',rows:7,cols:13,color:populationColors.Z},{y:-51,key:'R',name:'relations',rows:3,cols:10,color:populationColors.R},{y:-142,key:'C',name:'compositions',rows:2,cols:6,color:populationColors.C}];
  const centers=[];
  layers.forEach((l,li)=>{
    const corners=[project(-172,l.y,-70),project(172,l.y,-70),project(172,l.y,70),project(-172,l.y,70)];
    ctx.beginPath();corners.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.fillStyle=l.color+'09';ctx.fill();ctx.strokeStyle=l.color+'70';ctx.lineWidth=.8;ctx.stroke();
    const points=[];
    for(let r=0;r<l.rows;r++)for(let c=0;c<l.cols;c++){
      const x=-145+c*290/Math.max(l.cols-1,1),z=l.rows===1?0:-48+r*96/(l.rows-1),p=project(x,l.y,z);
      points.push(p);const phase=((c*3+r*5+li*4)%17)/17, wave=motion?Math.max(0,1-Math.abs((t*.18+phase)%1-.5)*9):0;
      const active=(c===Math.floor(l.cols*.56)&&r===Math.floor(l.rows/2))||wave>.4;
      if(active){const gl=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,(13+burst*3)*s);gl.addColorStop(0,'#cf896e50');gl.addColorStop(1,'#cf896e00');ctx.fillStyle=gl;ctx.fillRect(p.x-18*s,p.y-18*s,36*s,36*s);}
      circle(ctx,p,(li===1?1.9:3.2)*s,active?'#c77755':l.color);
    }
    centers.push(points[Math.floor(points.length*.55)]);
    for(let k=0;k<(l.key==='R'||l.key==='Z'?3:0);k++){let a=points[(k*5+2)%points.length],b=points[(k*5+5)%points.length];ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.quadraticCurveTo((a.x+b.x)/2,(a.y+b.y)/2-12*s,b.x,b.y);ctx.strokeStyle=l.color+'60';ctx.lineWidth=.7;ctx.stroke();}
    if(li>0){for(let k=0;k<4;k++){const a=points[(k*7+3)%points.length];const b=project(-90+k*65,layers[li-1].y,15+k*3);line(ctx,a,b,k===1?'#c38e6a80':'#7f9d8a55',.8);if(motion){const f=(t*.28+k*.21)%1;circle(ctx,{x:a.x+(b.x-a.x)*f,y:a.y+(b.y-a.y)*f},2*s,'#c77d59');}}}
    const lp=project(-190,l.y,79);label(ctx,l.key,lp.x,lp.y+4,16*s,l.color,'right','Georgia, serif');
    const rp=project(180,l.y,20);label(ctx,l.name,rp.x,rp.y+3,8*s,'#6f8373');
  });
  if(burst>0){burst=Math.max(0,burst-.025);centers.forEach(p=>{ctx.beginPath();ctx.arc(p.x,p.y,(2.4-burst)*40*s,0,Math.PI*2);ctx.strokeStyle=`rgba(201,104,73,${burst/5})`;ctx.lineWidth=.8;ctx.stroke();});}
}
hero.canvas.addEventListener('pointerdown',e=>{heroDrag=true;dragX=e.clientX;hero.canvas.setPointerCapture(e.pointerId);});
hero.canvas.addEventListener('pointermove',e=>{if(heroDrag){heroAngle+=(e.clientX-dragX)*.007;heroAngle=Math.max(-.8,Math.min(.8,heroAngle));dragX=e.clientX;drawHero(performance.now()/1000);}});
['pointerup','pointercancel','lostpointercapture'].forEach(type=>hero.canvas.addEventListener(type,()=>heroDrag=false));

// A deliberately illustrative morph: topology and vector representations.
function drawCompression() {
  const p=Number($('#compress-range').value)/100, svg=$('#compression-svg');
  const nodes=[{name:'Paris',x:180,y:130,code:'48.86° N',shape:'paris'},{name:'France',x:500,y:80,code:'country',shape:'france'},{name:'Europe',x:820,y:145,code:'continent',shape:'europe'}];
  let content='<defs><marker id="arrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0 0L7 3.5L0 7" fill="none" stroke="#688f79"/></marker></defs>';
  const alpha=1-p;
  content+=`<g opacity="${alpha}"><path d="M240 117Q340 63 440 76" fill="none" stroke="#688f79" stroke-width="1.5" marker-end="url(#arrow)"/><text x="337" y="61" text-anchor="middle" font-size="13" fill="#597764" font-family="Inter, sans-serif">capital of</text><path d="M560 90Q660 76 758 124" fill="none" stroke="#688f79" stroke-width="1.5" marker-end="url(#arrow)"/><text x="666" y="68" text-anchor="middle" font-size="13" fill="#597764" font-family="Inter, sans-serif">located in</text><path d="M213 183Q500 300 795 197" fill="none" stroke="#c38b67" stroke-dasharray="5 5" stroke-width="1.3" marker-end="url(#arrow)"/><text x="500" y="254" text-anchor="middle" font-size="13" fill="#b47b58" font-family="Newsreader, Georgia, serif" font-style="italic">so, Paris is in Europe.</text></g>`;
  nodes.forEach((n,i)=>{const y=n.y+(130-n.y)*p;const x=n.x;
    content+=`<g transform="translate(${x},${y})"><g opacity="${alpha}"><circle r="48" fill="#e4e9dc" stroke="#b9c9b3" stroke-width="1"/>`;
    if(i===0)content+='<path d="M-17 21L0-27L17 21M-10 2H10M-5-12H5M-21 21H21M-11 21Q0-5 11 21" fill="none" stroke="#527c65" stroke-width="1.5"/>';
    if(i===1)content+='<path d="M-6-28L19-19L24 6L7 28L-22 12L-25-10Z" fill="#bacdb2" stroke="#6e9779" stroke-width="1.3"/><circle cx="0" cy="-9" r="3" fill="#c96849"/>';
    if(i===2)content+='<circle r="27" fill="none" stroke="#75977b" stroke-width="1.3"/><ellipse rx="11" ry="27" fill="none" stroke="#75977b"/><path d="M-27 0H27M-23-14H23M-23 14H23" stroke="#75977b" stroke-width="1"/>';
    content+=`</g><g opacity="${p}"><text x="-86" y="12" fill="#7f9883" font-family="Georgia" font-size="65" font-weight="200">[</text>`;
    for(let k=0;k<8;k++){const v=(Math.sin(k*7+i*4)+1)/2;content+=`<rect x="${-63+k*17}" y="-22" width="13" height="44" rx="1" fill="${i===1?'#7eaaa0':'#84a88a'}" opacity="${.25+v*.65}"/>`;}
    content+='<text x="75" y="12" fill="#7f9883" font-family="Georgia" font-size="65">]</text></g>';
    content+=`<text x="0" y="${76-25*p}" text-anchor="middle" fill="#2d4d3d" font-size="23" font-family="Newsreader, Georgia, serif">${n.name}</text><text x="0" y="${99-25*p}" text-anchor="middle" fill="#87937e" font-size="10" font-family="Inter, sans-serif">${p>.5?'illustrative vector':n.code}</text></g>`;
  });
  svg.innerHTML=content;
  $('#compression-caption').textContent=p<.25?'Follow the arrows: Paris → France → Europe. The path is right there.':p<.75?'The representation changes. The relationships move into numerical patterns.':'The vectors may encode the relations. The path is no longer explicit in the display.';
}
$('#compress-range').addEventListener('input',drawCompression);
$('#restore-structure').addEventListener('click',()=>{$('#compress-range').value=0;drawCompression();});
drawCompression();

const layers={
  E:{brain:'HIPPOCAMPUS → ENTITY POPULATION',title:'Give every entity<br>a place to belong.',description:'A dedicated neuron represents each entity. Stable identities let the network refer to the same thing across different facts and queries.',example:'E<sub>Paris</sub> · E<sub>France</sub> · E<sub>Europe</sub>'},
  Z:{brain:'ENTORHINAL CORTEX → BINDING POPULATION',title:'A place where entities<br>meet their relations.',description:'Conjunctive neurons bind an entity to a directed relation. Fact-encoded connections link these bindings, allowing activity to move through relational space in a path-integration-inspired process.',example:'Z<sub>(Paris, capital_of)</sub> ↔ Z<sub>(France, capital_of⁻¹)</sub>'},
  R:{brain:'ANTERIOR TEMPORAL LOBE → RELATION POPULATION',title:'Relations with<br>their own identities.',description:'Relations and their inverses have dedicated neurons. Local learning associates relations that support similar predictions, giving the network alternative ways to approach a query.',example:'R<sub>capital_of</sub> · R<sub>located_in</sub> · R<sub>located_in⁻¹</sub>'},
  C:{brain:'PREFRONTAL CORTEX → COMPOSITION POPULATION',title:'Learn how relations<br>work together.',description:'The composition population captures reusable combinations of relations. Learned connections let multi-step relational patterns contribute to inference beyond directly observed facts.',example:'father_of + father_of → grandfather_of'}
};
let selectedLayer='E';
function drawArchitecture(){
  const keys=['C','R','Z','E'];
  // A shared plane basis makes all four layers exact translated copies.
  const point=(u,v,i)=>({x:115+285*u+52*v,y:27+68*i-8*u+30*v});
  let svg='';
  keys.forEach((key,i)=>{
    const active=key===selectedLayer,col=populationColors[key],corners=[[0,0],[1,0],[1,1],[0,1]].map(([u,v])=>point(u,v,i));
    svg+=`<g><polygon points="${corners.map(p=>`${p.x},${p.y}`).join(' ')}" fill="${col}" fill-opacity="${active?.09:.035}" stroke="${col}" stroke-opacity="${active?.8:.35}" stroke-width="${active?1.5:1}"/><text x="84" y="${46+i*68}" font-family="Newsreader, Georgia, serif" fill="${col}" font-size="29">${key}</text><text x="473" y="${46+i*68}" font-family="Inter, sans-serif" fill="${col}" font-size="9">${{C:'rules',R:'relations',Z:'bindings',E:'entities'}[key]}</text>`;
    for(let j=0;j<6;j++){
      const p=point(.12+j*.15,.5,i);
      if(i<3){const next=point(.12+j*.15+(j%2?.05:-.05),.5,i+1);svg+=`<path d="M${p.x} ${p.y}L${next.x} ${next.y}" stroke="${col}" stroke-opacity=".35" stroke-width=".9" stroke-dasharray="${i===0?'3 3':'none'}"/>`;}
      if((key==='R'||key==='Z')&&(j===1||j===3)){const next=point(.12+(j+1)*.15,.5,i);svg+=`<path d="M${p.x} ${p.y}Q${(p.x+next.x)/2} ${p.y-17} ${next.x} ${next.y}" fill="none" stroke="${col}" stroke-opacity=".6" stroke-width="1"/>`;}
      svg+=`<circle cx="${p.x}" cy="${p.y}" r="${key==='Z'?3.6:5}" fill="${col}" opacity="${active?1:.65}"/>`;
      if(key==='Z')for(const row of [.2,.8]){const z=point(.12+j*.15,row,i);svg+=`<circle cx="${z.x}" cy="${z.y}" r="2" fill="${col}" opacity=".5"/>`;}
    }
    svg+='</g>';
  });
  $('#architecture-svg').innerHTML=svg;
}
function chooseLayer(key){selectedLayer=key;$('#layer-panel').style.setProperty('--population-color',populationColors[key]);const d=layers[key];$$('[data-layer]').forEach(b=>{const on=b.dataset.layer===key;b.setAttribute('aria-selected',String(on));b.tabIndex=on?0:-1;});$('#layer-panel').setAttribute('aria-labelledby',`tab-${key}`);$('#layer-symbol').textContent=key;$('#layer-brain').textContent=d.brain;$('#layer-title').innerHTML=d.title;$('#layer-description').textContent=d.description;$('#layer-example').innerHTML=d.example;drawArchitecture();}
$$('[data-layer]').forEach((b,i)=>{b.addEventListener('click',()=>chooseLayer(b.dataset.layer));b.addEventListener('keydown',e=>{if(!['ArrowRight','ArrowLeft','Home','End'].includes(e.key))return;e.preventDefault();const idx=e.key==='Home'?0:e.key==='End'?3:(i+(e.key==='ArrowRight'?1:3))%4;const next=$$('[data-layer]')[idx];chooseLayer(next.dataset.layer);next.focus();});});
chooseLayer('E');

// Genuine model data, discretely replayed. No fabricated intermediate activations.
const relName=(id)=>traces.relations[id%traces.relations.length]+(id>=traces.relations.length?'⁻¹':'');
const entName=(id)=>traces.entities[id];
function activityColor(v){if(v<.001)return '#5d7765';const a=Math.min(v,1);const stops=[[99,179,141],[188,215,164],[240,160,117]];let t=a<.5?a*2:(a-.5)*2;let x=a<.5?stops[0]:stops[1],y=a<.5?stops[1]:stops[2];return `rgb(${x.map((n,i)=>Math.round(n+(y[i]-n)*t)).join(',')})`;}
function drawTrace(){
  const {ctx,w,h}=trace;ctx.clearRect(0,0,w,h);tracePoints=[];if(!traces||!w)return;
  const item=traces.items[queryIndex],state=item.steps[traceStep],m=traces.relations.length,k=m*2,mobile=w<600;
  const planeDepth=mobile?49:78,tilt=mobile?15:26;
  const levels={R:h*.24,Z:h*.51,E:h*.78};
  // One affine projection, one footprint, three translations: parallel planes.
  const project=(u,v,type)=>({x:w*.17+u*w*.65+(v-.5)*w*.12,y:levels[type]+(v-.5)*planeDepth+(0.5-u)*tilt});
  function plane(type,name){
    const points=[[-.025,-.12],[1.025,-.12],[1.025,1.12],[-.025,1.12]].map(([u,v])=>project(u,v,type));
    const col=populationLights[type];
    ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.fillStyle=col+'06';ctx.fill();ctx.strokeStyle=col+'55';ctx.lineWidth=.8;ctx.stroke();
    // A few faint grid lines establish a common perspective without visual clutter.
    for(const u of [.25,.5,.75])line(ctx,project(u,0,type),project(u,1,type),col+'13',.6);
    const p=points[0],right=points[1];
    label(ctx,type,p.x-(mobile?8:17),p.y+7,mobile?20:27,col,'right','Georgia, serif');
    label(ctx,name,right.x,right.y-10,mobile?8:10,col,'right');
  }
  plane('R','relations · ATL');plane('Z','bindings · EC');plane('E','entities · HPC');
  const rPositions={},zPositions={},ePositions={};
  item.columns.forEach((code,col)=>rPositions[code]=project((col%12)/11,Math.floor(col/12)?0.82:0.18,'R'));
  for(let e=0;e<traces.entities.length;e++)item.columns.forEach((code,col)=>zPositions[`${e},${code}`]=project(col/(item.columns.length-1),e/(traces.entities.length-1),'Z'));
  traces.entities.forEach((_,e)=>ePositions[e]=project(e/(traces.entities.length-1),.5,'E'));
  function connection(a,b,color,within=false,dashed=false){
    if(!a||!b)return;ctx.save();ctx.beginPath();ctx.moveTo(a.x,a.y);
    if(within){const bend=Math.min(mobile?26:42,Math.max(14,Math.abs(b.x-a.x)*.12));ctx.quadraticCurveTo((a.x+b.x)/2,(a.y+b.y)/2-bend,b.x,b.y);}
    else ctx.lineTo(b.x,b.y);
    ctx.strokeStyle=color;ctx.lineWidth=mobile?1.2:1.6;ctx.shadowBlur=5;ctx.shadowColor=color+'40';ctx.setLineDash(dashed?[3,4]:[]);ctx.stroke();ctx.restore();
  }
  const q=item.query,r2=item.r2,inv=r2<m?r2+m:r2-m;
  // Selected route only; these edges are schematic, not a weight-matrix export.
  if(traceStep>=1)connection(rPositions[q.r1],rPositions[r2],populationLights.R,true,true);
  if(traceStep>=2){connection(rPositions[r2],zPositions[`${q.h},${r2}`],populationLights.R);connection(ePositions[q.h],zPositions[`${q.h},${r2}`],populationLights.E);}
  if(traceStep>=3)connection(zPositions[`${q.h},${r2}`],zPositions[`${q.t},${inv}`],populationLights.Z,true);
  if(traceStep>=4)connection(zPositions[`${q.t},${inv}`],ePositions[q.t],populationLights.E);
  function neuron(p,v,name,type){
    const radius=type==='Z'?(mobile?1.35:2.2):(mobile?3:4.1);
    if(v>.02){const glow=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,radius*4);glow.addColorStop(0,activityColor(v).replace('rgb','rgba').replace(')',',0.25)'));glow.addColorStop(1,'#d7bb8a00');ctx.fillStyle=glow;ctx.fillRect(p.x-radius*4,p.y-radius*4,radius*8,radius*8);}
    circle(ctx,p,radius,v<.001?populationLights[type]+'66':activityColor(v));
    if(v>.4){ctx.beginPath();ctx.arc(p.x,p.y,radius+2,0,Math.PI*2);ctx.strokeStyle=activityColor(v);ctx.lineWidth=.65;ctx.stroke();}
    tracePoints.push({...p,value:v,name,type,radius});
  }
  item.columns.forEach(code=>neuron(rPositions[code],state.X_R[code],relName(code),'R'));
  for(let e=0;e<traces.entities.length;e++)item.columns.forEach(code=>neuron(zPositions[`${e},${code}`],state.X_Z[e*k+code],`${entName(e)} × ${relName(code)}`,'Z'));
  traces.entities.forEach((name,e)=>{const p=ePositions[e];neuron(p,state.X_E[e],name,'E');if(e===q.h||e===q.t||(!mobile&&e%3===0))label(ctx,name,p.x,p.y+18,mobile?7:9,e===q.t&&traceStep===4?'#edb697':'#a3bdce','center');});
  if(traceStep<=1){const p=rPositions[traceStep===0?q.r1:r2];label(ctx,relName(traceStep===0?q.r1:r2),p.x,p.y-14,mobile?7:10,'#e0b28b','center','monospace');}
  if(traceStep===4){const p=ePositions[q.t];ctx.beginPath();ctx.arc(p.x,p.y,mobile?9:13,0,Math.PI*2);ctx.strokeStyle='#dfb185';ctx.lineWidth=1;ctx.stroke();}
}
function showStep(){
  if(!traces)return;const item=traces.items[queryIndex],q=item.query,st=item.steps[traceStep];
  const info=[
    ['Cue the relation.',`The query relation ${relName(q.r1)} is activated in R. This is the first recorded state of the inference.`],
    ['Add the entity. Recruit related relations.',`${entName(q.h)} is activated in E. Learned R–R connections recruit related candidates, including ${relName(item.r2)}, whose recorded activity is ${st.X_R[item.r2].toFixed(3)}.`],
    ['Form entity–relation bindings.',`The preceding entity and relation cues produce activity in Z, including the binding of ${entName(q.h)} to ${relName(item.r2)}.`],
    ['Propagate through encoded connections.',`Activity propagates across fact-encoded Z–Z connections. The displayed pathway connects a binding for ${entName(q.h)} to one for ${entName(q.t)}.`],
    ['Read the answer from the activity.',`${entName(q.t)} is the strongest entity in this recorded readout, with activation ${st.X_E[q.t].toFixed(3)}. Other candidates retain their own scores.`]
  ][traceStep];
  $('#trace-title').textContent=info[0];$('#trace-description').textContent=info[1];$('#trace-number').textContent=String(traceStep+1).padStart(2,'0');$('#step-count').textContent=`${traceStep+1} / 5`;$('#trace-step').value=traceStep;
  $('#answer-value').textContent=traceStep===4?entName(q.t):'?';$('#trace-next').textContent=traceStep===4?'Replay ↶':'Next step →';
  const sorted=st.X_E.map((v,i)=>({v,i})).sort((a,b)=>b.v-a.v).slice(0,3);
  $('#readout-strip').innerHTML='<span>E POPULATION / TOP ACTIVATIONS</span>'+sorted.map(({v,i})=>`<span>${entName(i)} <strong>${v.toFixed(3)}</strong></span>`).join('');
  $('#trace-inspector').textContent='Hover a neuron to inspect its activity';drawTrace();
}
function stopTrace(){playing=false;clearInterval(playTimer);$('#trace-play').textContent='▶';$('#trace-play').setAttribute('aria-label','Play recorded inference');}
function startTrace(){stopTrace();if(traceStep===4)traceStep=0;playing=true;showStep();$('#trace-play').textContent='Ⅱ';$('#trace-play').setAttribute('aria-label','Pause recorded inference');playTimer=setInterval(()=>{if(traceStep<4){traceStep++;showStep();}else stopTrace();},1500);}
$('#trace-play').addEventListener('click',()=>playing?stopTrace():startTrace());
$('#trace-reset').addEventListener('click',()=>{stopTrace();traceStep=0;showStep();});
$('#trace-next').addEventListener('click',()=>{stopTrace();traceStep=(traceStep+1)%5;showStep();});
$('#trace-step').addEventListener('input',e=>{stopTrace();traceStep=Number(e.target.value);showStep();});
$('#query-select').addEventListener('change',e=>{stopTrace();queryIndex=Number(e.target.value);traceStep=0;showStep();});
trace.canvas.addEventListener('pointermove',e=>{const b=trace.canvas.getBoundingClientRect(),x=e.clientX-b.left,y=e.clientY-b.top;let closest=null,d=15;tracePoints.forEach(p=>{const dist=Math.hypot(p.x-x,p.y-y);if(dist<d){d=dist;closest=p;}});$('#trace-inspector').textContent=closest?`${closest.type} · ${closest.name} · activation ${closest.value.toFixed(4)}`:'Hover a neuron to inspect its activity';});
trace.canvas.addEventListener('pointerleave',()=>$('#trace-inspector').textContent='Hover a neuron to inspect its activity');
fetch('data/traces.json').then(r=>{if(!r.ok)throw new Error('Trace data unavailable');return r.json();}).then(data=>{traces=data;$('#query-select').innerHTML=data.items.map((it,i)=>`<option value="${i}">(${entName(it.query.h)}, ${relName(it.query.r1)}, ?)</option>`).join('');['#query-select','#trace-play','#trace-reset','#trace-next','#trace-step'].forEach(s=>$(s).disabled=false);showStep();}).catch(()=>{$('#query-select').innerHTML='<option>Trace data could not be loaded</option>';$('#trace-description').textContent='Please reload the page to try again. You can also open the original animation or download the recorded data below.';});

// Every value is transcribed from slides 8–9, including mixed baseline sources.
function copyFallback(text) {
  const ta=document.createElement('textarea');ta.value=text;ta.style.position='fixed';ta.style.opacity='0';document.body.append(ta);ta.focus();ta.select();const ok=document.execCommand('copy');ta.remove();$('#copy-citation').focus();return ok;
}
$('#copy-citation').addEventListener('click',async()=>{
  const text=$('#citation-text').textContent;let copied=false;
  try{if(navigator.clipboard&&window.isSecureContext){await navigator.clipboard.writeText(text);copied=true;}}catch(_){}
  if(!copied){try{copied=copyFallback(text);}catch(_){}}
  if(copied){$('#copy-citation').textContent='Copied ✓';$('#copy-status').textContent='BibTeX copied to clipboard.';setTimeout(()=>$('#copy-citation').innerHTML='Copy BibTeX <span>⧉</span>',2200);}
  else{const selection=window.getSelection(),range=document.createRange();range.selectNodeContents($('#citation-text'));selection.removeAllRanges();selection.addRange(range);$('#copy-status').textContent='Citation selected. Press Control C or Command C to copy.';$('#copy-citation').textContent='Citation selected';}
});
const dialog=$('#prototype-dialog');
$('#open-prototype').addEventListener('click',()=>{$('#prototype-image').src=motion?'assets/prototype.gif':'assets/prototype-static.png';dialog.showModal();});
$('#close-prototype').addEventListener('click',()=>dialog.close());
dialog.addEventListener('click',e=>{if(e.target===dialog){const b=dialog.getBoundingClientRect();if(e.clientX<b.left||e.clientX>b.right||e.clientY<b.top||e.clientY>b.bottom)dialog.close();}});
dialog.addEventListener('close',()=>$('#prototype-image').src='assets/prototype-static.png');
document.addEventListener('visibilitychange',()=>{if(document.hidden)stopTrace();});
$('#author-video').addEventListener('play',stopTrace);
$$('[data-time]').forEach(button=>button.addEventListener('click',()=>{const v=$('#author-video');v.currentTime=Number(button.dataset.time);v.play().catch(()=>{});}));

if('IntersectionObserver' in window){const revealObserver=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');revealObserver.unobserve(e.target);}}),{threshold:.05});$$('.section-intro,.learning-grid,.closing-top').forEach(el=>{if(!reduceMotion.matches){el.classList.add('reveal');revealObserver.observe(el);}});}
let lastFrame=0;
function animate(now){requestAnimationFrame(animate);if(document.hidden||!motion||now-lastFrame<32)return;lastFrame=now;const t=now/1000;if(hero.visible)drawHero(t);if(ambient.visible)drawAmbient(t);}
setMotion(motion);drawTrace();requestAnimationFrame(animate);
