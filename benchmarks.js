/* Shared benchmark data and interactions for the Project and Blog versions.
   Source: paper Tables 1–2 / author slides 8–9. Times are reported runs. */
(() => {
'use strict';
const root = document.querySelector('#results');
if (!root) return;
const $ = selector => root.querySelector(selector);
const $$ = selector => [...root.querySelectorAll(selector)];
const methods=['ConvE','RotatE','AnyBURL','AMIE','NeuralLP','NCRL','RNNLogic','PRA / PathRank','MINERVA','NBFNet','NSR'];
const benchmarks={
  Nations:{mrr:[.8029,.5351,.7994,.8559,.6841,.4571,.7216,.5933,.5865,.7479,.8142],hits:[69.05,33.23,69.15,77.11,52.74,25.37,61.65,38.31,44.28,62.19,71.64],time:[26,24,64,2160,40,134,32,34,3240,29,3],timeLabels:['26 s','24 s','64 s','0.6 h','40 s','134 s','32 s','34 s','0.9 h','29 s','3 s'],context:'Second-highest MRR among the compared methods on Nations.'},
  Kinship:{mrr:[.7927,.7598,.6768,.6767,.6072,.605,.669,.6296,.6253,.7445,.6515],hits:[68.11,63.37,54.10,55.03,47.30,45.81,54.94,46.83,46.37,62.38,54.21],time:[64,84,63,2,26,99,82,86,4320,77,11],timeLabels:['64 s','84 s','63 s','2 s','26 s','99 s','82 s','86 s','1.2 h','77 s','11 s'],context:'ConvE leads on Kinship. NSR reaches MRR 0.6515, with an 11-second reported training time.'},
  'YAGO3-10':{mrr:[.6365,.1812,.5589,.5473,null,.380,.5625,.4678,null,.4946,.5893],hits:[59.03,9.98,50.78,49.58,null,27.40,49.56,37.39,null,37.96,52.80],time:[37080,5400,1000,83,null,null,16200,239,null,8280,1080],timeLabels:['10.3 h','1.5 h','1000 s','83 s','—','—','4.5 h','239 s','—','2.3 h','0.3 h'],context:'Second-highest MRR in this comparison, on a graph with over 120,000 entities.'},
  'FB15k-237':{mrr:[.4095,.3368,.332,.217,.3166,.300,.3276,.0972,.2734,.5114,.3649],hits:[31.61,27.07,24.7,16.57,24.45,20.9,23.49,6.35,19.77,41.64,28.45],time:[991,5400,1000,8,42840,null,2160,229,11880,37440,2160],timeLabels:['991 s','1.5 h','1000 s','8 s','11.9 h','—','0.6 h','229 s','3.3 h','10.4 h','0.6 h'],context:'Third-highest MRR in this comparison. NBFNet and ConvE achieve higher MRR.'}
};
let dataset='YAGO3-10',metric='mrr',comparison=0;
function starred(i,m){return dataset==='YAGO3-10'&&i===5&&m!=='time'||dataset==='FB15k-237'&&(i===2||i===5&&m!=='time');}
function formatValue(d,i,m){const v=d[m][i];if(v===null)return '—';return (m==='time'?d.timeLabels[i]:m==='hits'?v.toFixed(2)+'%':v.toFixed(4))+(starred(i,m)?'*':'');}
function timeDisplay(d,i){return (d.time[i]===1080?'18 min':d.timeLabels[i]).replace(/ (s|min|h)(\*)?$/, ' <small>$1$2</small>');}
function pointDescription(i){const d=benchmarks[dataset];return `${methods[i]} · ${metric==='mrr'?'MRR':'Hits@1'} ${formatValue(d,i,metric)} · ${formatValue(d,i,'time')} reported training time`;}
function selectComparison(i){if(i===10)return;comparison=i;drawResults();}
function drawResults(){
  const d=benchmarks[dataset];
  const rows=methods.map((name,i)=>({name,i,v:d[metric][i],time:d.time[i]})).filter(p=>p.v!==null&&p.time!==null);
  if(!rows.some(p=>p.i===comparison))comparison=rows.find(p=>p.i!==10).i;
  $('#compare-select').innerHTML=rows.filter(p=>p.i!==10).map(p=>`<option value="${p.i}"${p.i===comparison?' selected':''}>${p.name}</option>`).join('');
  const compact=$('#benchmark-chart').clientWidth<500,W=compact?480:700,H=compact?390:420;
  const x0=52,x1=W-30,y0=35,y1=H-75;
  const logMin=Math.floor(Math.log10(Math.min(...rows.map(p=>p.time)))),logMax=Math.ceil(Math.log10(Math.max(...rows.map(p=>p.time))));
  const maxY=metric==='mrr'?1:100;
  const px=time=>x0+(Math.log10(time)-logMin)/(logMax-logMin)*(x1-x0),py=value=>y1-value/maxY*(y1-y0);
  let svg=`<svg viewBox="0 0 ${W} ${H}" role="group" aria-label="${dataset}: accuracy versus reported training time. Select a baseline point to compare it with NSR."><text x="${x0}" y="14" class="plot-axis-title">${metric==='mrr'?'MRR':'Hits@1 (%)'} ↑</text>`;
  for(let j=0;j<=4;j++){const v=j*maxY/4,y=py(v);svg+=`<line x1="${x0}" y1="${y}" x2="${x1}" y2="${y}" class="plot-grid"/><text x="${x0-12}" y="${y+4}" text-anchor="end" class="plot-tick">${metric==='mrr'?v.toFixed(2):v}</text>`;}
  const ticks=[[1,'1 s'],[10,'10 s'],[60,'1 min'],[600,'10 min'],[3600,'1 h'],[36000,'10 h'],[86400,'24 h']];
  let lastTick=-100;
  ticks.filter(([v])=>Math.log10(v)>=logMin&&Math.log10(v)<=logMax).forEach(([v,name])=>{const x=px(v);if(x-lastTick<48)return;lastTick=x;svg+=`<line x1="${x}" y1="${y0}" x2="${x}" y2="${y1}" class="plot-grid vertical"/><text x="${x}" y="${y1+23}" text-anchor="middle" class="plot-tick">${name}</text>`;});
  svg+=`<text x="${(x0+x1)/2}" y="${H-12}" text-anchor="middle" class="plot-axis-title">Reported training time → <tspan class="plot-tick">(log scale)</tspan></text>`;
  const a={x:px(d.time[10]),y:py(d[metric][10])},b={x:px(d.time[comparison]),y:py(d[metric][comparison])};
  svg+=`<path d="M${a.x} ${a.y}L${b.x} ${b.y}" class="comparison-line"/>`;
  // Place the emphasized labels first; other labels avoid their boxes and all dots.
  const positions=rows.map(p=>({...p,x:px(p.time),y:py(p.v)})),occupied=positions.map(p=>({x:p.x-8,y:p.y-8,w:16,h:16}));
  const labelOrder=[...positions].sort((a,b)=>(b.i===10?3:b.i===comparison?2:0)-(a.i===10?3:a.i===comparison?2:0));
  const labels=new Map();
  labelOrder.forEach(p=>{
    if(compact&&p.i!==10&&p.i!==comparison)return;
    const tw=p.name.length*6.4+10,th=19;
    const candidates=[[12,-10],[-tw-12,-10],[-tw/2,-32],[-tw/2,13],[12,-30],[-tw-12,13],[12,17],[-tw/2,31]];
    for(const [dx,dy] of candidates){const r={x:p.x+dx,y:p.y+dy,w:tw,h:th};if(r.x<x0-15||r.x+r.w>x1+23||r.y<y0-13||r.y+r.h>y1+5)continue;if(occupied.some(o=>r.x<o.x+o.w+3&&r.x+r.w+3>o.x&&r.y<o.y+o.h+2&&r.y+r.h+2>o.y))continue;labels.set(p.i,r);occupied.push(r);break;}
  });
  // Selected points render last so nearby methods cannot hide the comparison.
  positions.sort((a,b)=>(a.i===10?3:a.i===comparison?2:0)-(b.i===10?3:b.i===comparison?2:0)).forEach(p=>{
    const nsr=p.i===10,selected=p.i===comparison,r=labels.get(p.i);
    svg+=`<g class="plot-point ${nsr?'nsr':selected?'selected':''}" data-method="${p.i}" ${nsr?'role="img"':'role="button" tabindex="0"'} aria-label="${pointDescription(p.i)}${nsr?'':'. Compare with NSR.'}"><title>${pointDescription(p.i)}</title><circle class="point-target" cx="${p.x}" cy="${p.y}" r="15"/>${nsr||selected?`<circle class="point-halo" cx="${p.x}" cy="${p.y}" r="${nsr?13:11}"/>`:''}<circle class="point-dot" cx="${p.x}" cy="${p.y}" r="${nsr?6.5:selected?5.5:4}"/>`;
    if(r)svg+=`<rect class="point-label-bg" x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" rx="3"/><text x="${r.x+5}" y="${r.y+13}" class="point-label">${p.name}</text>`;
    svg+='</g>';
  });
  $('#benchmark-chart').innerHTML=svg+'</svg>';
  $('#plot-readout').textContent=pointDescription(comparison);
  $$('.plot-point').forEach(el=>{
    const i=Number(el.dataset.method);
    el.addEventListener('pointerenter',()=>$('#plot-readout').textContent=pointDescription(i));
    el.addEventListener('pointerleave',()=>$('#plot-readout').textContent=pointDescription(comparison));
    el.addEventListener('focus',()=>$('#plot-readout').textContent=pointDescription(i));
    el.addEventListener('click',()=>selectComparison(i));
    el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();selectComparison(i);$(`[data-method="${i}"]`)?.focus();}});
  });
  $('#nsr-time').innerHTML=timeDisplay(d,10);$('#baseline-time').innerHTML=timeDisplay(d,comparison);
  $('#baseline-name').textContent=methods[comparison];$('#comparison-name').textContent=methods[comparison];
  $('#accuracy-label').textContent=metric==='mrr'?'MRR ↑':'Hits@1 ↑';
  $('#nsr-accuracy').textContent=formatValue(d,10,metric);$('#baseline-accuracy').textContent=formatValue(d,comparison,metric);
  const faster=d.time[10]<d.time[comparison],equal=d.time[10]===d.time[comparison];
  const ratio=faster?d.time[comparison]/d.time[10]:d.time[10]/d.time[comparison];
  $('#time-ratio').textContent=equal?'1:1':ratio.toFixed(1)+'×';
  $('#ratio-description').textContent=equal?'Equal reported training time':`${faster?methods[comparison]+' / NSR':'NSR / '+methods[comparison]} reported training time`;
  const fraction=(100*d.time[10]/d.time[comparison]).toFixed(1);
  $('#result-context').textContent=equal?`Both methods report ${d.timeLabels[10]} on ${dataset}.` : faster?`On ${dataset}, NSR takes ${fraction}% of ${methods[comparison]}’s reported training time. Compare the accuracy alongside it.`:`On ${dataset}, NSR takes ${ratio.toFixed(1)}× as long as ${methods[comparison]} in the reported runs. Compare the accuracy alongside it.`;
  $('.time-ratio').classList.toggle('longer',!faster&&!equal);
  $('#benchmark-table').innerHTML=`<table><caption class="sr-only">${dataset} reported benchmark results</caption><thead><tr><th scope="col">Method</th><th scope="col">MRR ↑</th><th scope="col">Hits@1 ↑</th><th scope="col">Training time ↓</th></tr></thead><tbody>${methods.map((n,i)=>`<tr class="${n==='NSR'?'highlight':''}"><th scope="row">${n}</th><td>${formatValue(d,i,'mrr')}</td><td>${formatValue(d,i,'hits')}</td><td>${formatValue(d,i,'time')}</td></tr>`).join('')}</tbody></table>`;
}
$$('[data-dataset]').forEach(b=>b.addEventListener('click',()=>{dataset=b.dataset.dataset;$$('[data-dataset]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));drawResults();}));
$('#metric-select').addEventListener('change',e=>{metric=e.target.value;drawResults();});
$('#compare-select').addEventListener('change',e=>selectComparison(Number(e.target.value)));
let chartWidth=0;new ResizeObserver(([entry])=>{const w=Math.round(entry.contentRect.width);if(w!==chartWidth){chartWidth=w;drawResults();}}).observe($('#benchmark-chart'));
drawResults();

})();
