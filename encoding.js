/* Triple encoding follows paper §3.2 / Eq. 3 and NSR_Dynamic.py::encode_triples.
   The reveal sequence is explanatory; no measured activations or training are simulated. */
(() => {
  'use strict';
  const root = document.querySelector('#encoding');
  if (!root) return;
  const $ = selector => root.querySelector(selector);
  const $$ = selector => [...root.querySelectorAll(selector)];
  const colors = {E:'#397bbb', R:'#4e8750', Z:'#ca762f', C:'#8750ac'};
  const examples = [
    {h:'Paris', r:'capital_of', t:'France'},
    {h:'France', r:'located_in', t:'Europe'},
    {h:'Berlin', r:'capital_of', t:'Germany'}
  ];
  const fields = {h:$('#encoding-head'), r:$('#encoding-relation'), t:$('#encoding-tail')};
  let fact = {...examples[0]}, step = 0, playing = false, timer = null;
  let touched = false, seen = false, previousWidth = 0;
  const safe = text => String(text).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const shorten = (text, n) => [...text].length > n ? [...text].slice(0,n-1).join('')+'…' : text;
  const tidy = text => text.replace(/\s+/g,' ').trim();
  const stages = [
    {title:'Keep the entities.', description:()=>fact.h===fact.t?'Here, head and tail are the same entity, so they share one E neuron. Its E–Z connections to all of its relation-indexed binding neurons are already fixed.':'The head and tail each have an entity neuron. E–Z connections are already fixed: each entity connects to its own relation-indexed binding neurons.', notation:()=>`<span>E<sub>${safe(fact.h)}</sub></span>${fact.h===fact.t?'':`<span>E<sub>${safe(fact.t)}</sub></span>`}`, color:colors.E},
    {title:'Give the relation two directions.', description:()=>`R represents ${fact.r} and its inverse. The inverse reverses the roles of head and tail; it does not assert a second, independent fact.`, notation:()=>`<span>R<sub>${safe(fact.r)}</sub></span><span>R<sub>${safe(fact.r)}⁻¹</sub></span>`, color:colors.R},
    {title:'Bind each entity to its role.', description:()=>'Select the head–forward and tail–inverse bindings in Z. Encoding writes a connection of weight 1 between each binding and its matching R neuron.', notation:()=>`<span>Z<sub>(${safe(fact.h)}, ${safe(fact.r)})</sub></span><span>Z<sub>(${safe(fact.t)}, ${safe(fact.r)}⁻¹)</sub></span>`, color:colors.Z},
    {title:'A fact becomes a connection.', description:()=>'Join the two Z bindings in both directions, with weight 1 in each direction. This persistent connection stores the triple and supports its inverse.', notation:()=>`<span>Z<sub>(h, r)</sub> ↔ Z<sub>(t, r⁻¹)</sub></span><small>W<sub>ZZ</sub> = 1 in both directions</small>`, color:colors.Z}
  ];

  function drawDiagram(previousStep = step) {
    const compact = $('.encoding-figure').clientWidth < 560;
    const W = compact ? 520 : 800, H = 510, depth = 54, tilt = compact ? 16 : 25;
    const levels = {C:65, R:175, Z:310, E:445};
    const pos = (u,v,key) => ({x:W*(.15+.69*u+.10*(v-.5)), y:levels[key]+depth*(v-.5)-tilt*(u-.5)});
    const entities = Array.from({length:5},(_,i)=>({name:`e${['₁','₂','₃','₄','₅'][i]}`,role:'context',u:.08+i*.21}));
    const hi=1, ti=fact.h===fact.t?1:3;
    entities[hi].name=fact.h;entities[hi].role=hi===ti?'head-tail':'head';
    entities[ti].name=fact.t;if(ti!==hi)entities[ti].role='tail';
    const relations = [{name:fact.r,label:'r',role:'forward'},{name:'another relation',label:'s',role:'context'},{name:fact.r+'⁻¹',label:'r⁻¹',role:'inverse'},{name:'another inverse relation',label:'s⁻¹',role:'context'}];
    const z=(e,r)=>pos(entities[e].u,.06+r*.29,'Z');
    const e=i=>pos(entities[i].u,.5,'E');
    const r=i=>pos(.18+i*.21,.5,'R');
    const head=z(hi,0),tail=z(ti,2);
    const arrow=(id,col)=>`<marker id="${id}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M2 1L9 5L2 9" fill="none" stroke="${col}" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></marker>`;
    let svg=`<defs>${arrow('enc-arrow-r',colors.R)}${arrow('enc-arrow-z',colors.Z)}</defs>`;
    const planeNames={C:'compositions · PFC',R:'directed relations · ATL',Z:'entity × relation · EC',E:'entities · HPC'};
    for(const key of ['C','R','Z','E']){
      const corners=[[0,-.18],[1,-.18],[1,1.18],[0,1.18]].map(([u,v])=>pos(u,v,key));
      const back=corners[0],right=corners[1];
      svg+=`<g class="${key==='C'?'is-muted':''}" style="--node-color:${colors[key]}"><polygon class="enc-plane" points="${corners.map(p=>`${p.x},${p.y}`).join(' ')}"/><text class="enc-layer-letter" x="${back.x-13}" y="${back.y+8}" text-anchor="end">${key}</text><text class="enc-layer-name" x="${right.x}" y="${right.y-11}" text-anchor="end">${planeNames[key]}</text>`;
      if(key==='Z')for(const en of entities){const a=pos(en.u,-.05,key),b=pos(en.u,1.05,key);svg+=`<path class="enc-grid" d="M${a.x} ${a.y}L${b.x} ${b.y}"/>`;}
      if(key==='C')for(let i=0;i<6;i++){const p=pos(.1+i*.16,.5,'C');svg+=`<circle cx="${p.x}" cy="${p.y}" r="3.5" fill="${colors.C}" opacity=".42"/>`;}
      svg+='</g>';
    }
    // Initialization: every entity is coupled to all of its relation-indexed Z cells.
    entities.forEach((entity,ei)=>relations.forEach((_,ri)=>{
      const a=e(ei),b=z(ei,ri);
      svg+=`<path class="enc-fixed ${ei===hi||ei===ti?'is-selected':''}" data-connection="fixed" data-entity="${ei}" data-relation="${ri}" data-weight="1" d="M${a.x} ${a.y}L${b.x} ${b.y}"/>`;
    }));
    // Eq. 3: R↔Z is written by the fact, rather than globally prewired.
    [[r(0),head,'head'],[r(2),tail,'tail']].forEach(([a,b,role])=>{
      svg+=`<path class="enc-rz ${step>=2?'is-visible':''} ${previousStep<2&&step>=2?'enc-write':''}" data-connection="relation" data-role="${role}" data-weight="${step>=2?1:0}" pathLength="1" d="M${a.x} ${a.y+7}L${b.x} ${b.y-7}" marker-start="url(#enc-arrow-r)" marker-end="url(#enc-arrow-r)"/>`;
      if(step>=2)svg+=`<text class="enc-weight-label" x="${(a.x+b.x)/2+10}" y="${(a.y+b.y)/2}" fill="${colors.R}">1</text>`;
    });
    const bend=compact?38:48,mid={x:(head.x+tail.x)/2,y:(head.y+tail.y)/2-bend};
    svg+=`<path class="enc-zz ${step>=3?'is-visible':''} ${previousStep<3&&step>=3?'enc-write':''}" data-connection="fact" data-weight-forward="${step>=3?1:0}" data-weight-inverse="${step>=3?1:0}" pathLength="1" d="M${head.x+7} ${head.y}Q${mid.x} ${mid.y} ${tail.x-7} ${tail.y}" marker-start="url(#enc-arrow-z)" marker-end="url(#enc-arrow-z)"/>`;
    if(step>=3){const y=(head.y+2*mid.y+tail.y)/4;svg+=`<rect x="${mid.x-20}" y="${y-19}" width="40" height="19" rx="9" fill="#f7f6f0"/><text class="enc-weight-label" x="${mid.x}" y="${y-5}" text-anchor="middle" fill="${colors.Z}">w = 1</text>`;}

    function neuron(p,key,id,name,description,selected,labelText,meaningful=false) {
      const rad=key==='Z'?4:5.5;
      svg+=`<g class="enc-node ${selected?'is-selected':''}" style="--node-color:${colors[key]}" data-neuron="${id}" data-description="${safe(description)}" ${meaningful?'role="button" tabindex="0"':'aria-hidden="true"'} aria-label="${safe(name+'. '+description)}"><title>${safe(description)}</title><circle class="enc-hit" cx="${p.x}" cy="${p.y}" r="14"/><circle class="enc-ring" cx="${p.x}" cy="${p.y}" r="${rad+5}"/><circle class="enc-dot" cx="${p.x}" cy="${p.y}" r="${rad}"/>`;
      if(labelText)svg+=`<text class="enc-node-label" x="${p.x}" y="${p.y+(key==='R'?-16:23)}" text-anchor="middle">${safe(labelText)}</text>`;
      svg+='</g>';
    }
    entities.forEach((entity,i)=>{
      const meaningful=i===hi||i===ti;
      const name=meaningful?entity.name:`Other entity ${entity.name}`;
      const detail=meaningful?`E · ${entity.name}. Entity identity; its E–Z connections are fixed before facts are encoded.`:`E · ${entity.name}. Another entity with its own prewired binding cells.`;
      neuron(e(i),'E',`e-${i}`,name,detail,meaningful,shorten(entity.name,compact?9:16),meaningful);
      if(meaningful)svg+=`<text class="enc-role-label" x="${e(i).x}" y="${e(i).y+38}" text-anchor="middle">${hi===ti?'h = t':i===hi?'h · head':'t · tail'}</text>`;
    });
    relations.forEach((relation,i)=>{
      const meaningful=i===0||i===2;
      const description=i===0?`R · ${fact.r}. The forward relation r.`:i===2?`R · ${fact.r}⁻¹. The inverse direction reverses head and tail.`:`R · ${relation.label}. A different directed relation, unused by this fact.`;
      neuron(r(i),'R',`r-${i}`,relation.label,description,meaningful&&step>=1,relation.label,meaningful);
    });
    entities.forEach((entity,ei)=>relations.forEach((relation,ri)=>{
      const isHead=ei===hi&&ri===0,isTail=ei===ti&&ri===2,meaningful=isHead||isTail;
      const name=`Z(${entity.name}, ${relation.label})`;
      const description=meaningful?`Z · (${entity.name}, ${relation.name}). The ${isHead?'head–forward':'tail–inverse'} binding. ${step>=2?'Its matching R–Z connection has weight 1.':'Encoding will connect it to its matching relation neuron.'}`:`Z · (${entity.name}, ${relation.label}). A different entity–relation binding; this fact writes no connection here.`;
      neuron(z(ei,ri),'Z',`z-${ei}-${ri}`,name,description,meaningful&&step>=2,'',meaningful);
    }));
    if(step>=2){
      [[head,'Z(h, r)',-16],[tail,'Z(t, r⁻¹)',23]].forEach(([p,text,offset])=>{
        svg+=`<text class="enc-binding-label" x="${p.x}" y="${p.y+offset}" text-anchor="middle">${text}</text>`;
      });
    }
    $('#encoding-svg').setAttribute('viewBox',`0 0 ${W} ${H}`);
    $('#encoding-svg').innerHTML=svg;
    $('#encoding-svg').setAttribute('aria-label',`Illustrative encoding of (${fact.h}, ${fact.r}, ${fact.t}). Stage ${step+1}: ${stages[step].title} Select a neuron to inspect its role.`);
    $$('.enc-node').forEach(node=>{
      const inspect=()=>{
        $$('.enc-node').forEach(n=>n.classList.toggle('is-inspected',n===node));
        $('#encoding-inspector').textContent=node.dataset.description;
      };
      node.addEventListener('pointerenter',inspect);
      node.addEventListener('focus',inspect);
      node.addEventListener('click',inspect);
      node.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();inspect();}});
    });
  }

  function updatePlayButton() {
    $('#encoding-play').innerHTML=playing?'Pause <span aria-hidden="true">Ⅱ</span>':step===3?'Replay encoding <span aria-hidden="true">↶</span>':step===0?'Encode this fact <span aria-hidden="true">▶</span>':'Continue encoding <span aria-hidden="true">▶</span>';
    $('#encoding-play').setAttribute('aria-label',playing?'Pause the encoding animation':step===3?'Replay the encoding animation':'Play the encoding animation');
  }
  function showStep(next) {
    const prev=step;step=next;root.dataset.stage=step;
    root.style.setProperty('--encoding-stage-color',stages[step].color);
    $('#encoding-number').textContent=`0${step+1} / 04`;
    $('#encoding-step-title').textContent=stages[step].title;
    $('#encoding-description').textContent=stages[step].description();
    $('#encoding-notation').innerHTML=stages[step].notation();
    $('#encoding-inverse').textContent=`(${fact.t}, ${fact.r}⁻¹, ${fact.h})`;
    $('#encoding-receipt').hidden=step!==3;
    $$('.encoding-steps button').forEach((button,i)=>{
      if(i===step)button.setAttribute('aria-current','step');else button.removeAttribute('aria-current');
      button.classList.toggle('is-done',i<step);
    });
    $('#encoding-inspector').textContent='Select a neuron to inspect its role.';
    updatePlayButton();drawDiagram(prev);
  }
  function stop() {playing=false;clearTimeout(timer);timer=null;updatePlayButton();}
  function play() {
    stop();if(step===3)showStep(0);playing=true;updatePlayButton();
    const advance=()=>{
      showStep(step+1);
      if(step===3)stop();else timer=setTimeout(advance,2300);
    };
    timer=setTimeout(advance,2300);
  }
  function readInputs() {
    Object.entries(fields).forEach(([key,input])=>{
      input.setCustomValidity(tidy(input.value)?'':'Please enter a name.');
      fact[key]=tidy(input.value)||key;
    });
    $$('.encoding-examples button').forEach((button,i)=>button.setAttribute('aria-pressed',String(Object.keys(fact).every(key=>fact[key]===examples[i][key]))));
  }
  $('#encoding-form').addEventListener('submit',event=>{
    event.preventDefault();touched=true;readInputs();if(!$('#encoding-form').reportValidity())return;
    if(playing)stop();else play();
  });
  Object.values(fields).forEach(input=>input.addEventListener('input',()=>{touched=true;stop();readInputs();showStep(0);}));
  $$('.encoding-examples button').forEach((button,i)=>button.addEventListener('click',()=>{
    touched=true;stop();Object.keys(fields).forEach(key=>fields[key].value=examples[i][key]);readInputs();showStep(0);if(motion)play();
  }));
  $$('.encoding-steps button').forEach((button,i)=>{
    button.addEventListener('click',()=>{touched=true;stop();showStep(i);});
    button.addEventListener('keydown',event=>{
      if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
      event.preventDefault();const next=event.key==='Home'?0:event.key==='End'?3:(i+(event.key==='ArrowRight'?1:3))%4;
      touched=true;stop();showStep(next);$$('.encoding-steps button')[next].focus();
    });
  });
  $('#encoding-reset').addEventListener('click',()=>{touched=true;stop();showStep(0);});
  document.querySelector('#motion-toggle').addEventListener('click',()=>{if(!motion)stop();});
  reduceMotion.addEventListener('change',event=>{if(event.matches)stop();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
  // An introductory reveal runs once when the circuit itself comes into view.
  new IntersectionObserver(([entry])=>{
    if(!entry.isIntersecting){if(playing)stop();return;}
    if(!seen){seen=true;if(!touched&&motion)play();}
  },{threshold:.45}).observe($('.encoding-figure'));
  new ResizeObserver(([entry])=>{
    const width=Math.round(entry.contentRect.width);
    if(width!==previousWidth){previousWidth=width;drawDiagram();}
  }).observe($('.encoding-figure'));
  showStep(0);
})();
