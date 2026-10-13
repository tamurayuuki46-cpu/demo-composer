import { getContext,readPart,putPart,pc,clamp,nearest,scalePC,removeRange,counterMaterial,clipNotes,PARTS } from './music-lab-utils.js';
import { applyHarmony } from './harmony-lab.js';
import { applyCounter } from './counter-lab.js';
function elsewhere(ctx,section,operation) {
 const sub=getContext(ctx.source,ctx.candidate,section.id);operation(sub);ctx.candidate=sub.candidate;
 ctx.target=ctx.candidate.sections.find(s=>s.sectionId===ctx.section.id);ctx.warnings.push(...sub.warnings);
}
function thin(notes,ratio=2) {const ticks=[...new Set(notes.map(n=>n.startTick))].sort((a,b)=>a-b);return notes.filter(n=>ticks.indexOf(n.startTick)%ratio===0);}
function split(notes,step) {return notes.flatMap(n=>{const result=[];for(let t=n.startTick;t<n.startTick+n.durationTick;t+=step)result.push({...n,startTick:t,durationTick:Math.min(Math.round(step*.8),n.startTick+n.durationTick-t)});return result;});}
function silence(ctx,parts,start,end) {for(const part of parts)putPart(ctx,part,removeRange(readPart(ctx,part),start,end));}
function fill(ctx) {
 const start=Math.max(ctx.section.startTick,ctx.section.endTick-ctx.beat),step=Math.max(1,Math.round(ctx.beat/4));
 const drums=removeRange(readPart(ctx,'drums'),start,ctx.section.endTick);
 for(let t=start,i=0;t<ctx.section.endTick;t+=step,i++)drums.push({pitch:[38,45,47,50][i%4],startTick:t,durationTick:Math.min(step/2,ctx.section.endTick-t),velocity:80+i*6});
 putPart(ctx,'drums',drums);
}
function shapeCurve(ctx,v) {
 const duration=ctx.section.endTick-ctx.section.startTick;
 for(const part of ['harmony','counter','bass','drums']){
 const notes=readPart(ctx,part);putPart(ctx,part,notes.filter((n,i)=>{
  const x=(n.startTick-ctx.section.startTick)/duration,y=v===0?x:v===1?1-Math.abs(x*2-1):1-x;return y>.55||i%3===0;
 }).map(n=>{const x=(n.startTick-ctx.section.startTick)/duration,y=v===0?x:v===1?1-Math.abs(x*2-1):1-x;return{...n,velocity:clamp(55+y*45,1,127),pitch:part==='drums'||part==='bass'?n.pitch:clamp(n.pitch+(y>.7?12:0),0,127)};}));
 }
}
function rangeCurve(ctx,v) {
 const duration=ctx.section.endTick-ctx.section.startTick;
 for(const part of ['harmony','counter'])putPart(ctx,part,readPart(ctx,part).map((n,i)=>{
 const x=(n.startTick-ctx.section.startTick)/duration,wide=v===0?x>.5:v===1?x<.5:ctx.section.kind==='chorus';
 return{...n,pitch:wide?clamp(n.pitch+(i%2?12:-12),24,108):nearest(66,[pc(n.pitch)],54,78)};
 }));
}
export function applyDevelopment(ctx,id,v) {
 const start=ctx.section.startTick,end=ctx.section.endTick,mid=Math.round((start+end)/2);
 if(id==='d-curve')shapeCurve(ctx,v);
 if(id==='d-same-count') {
  const enabled={...ctx.target.enabled};
  for(const part of ['harmony','counter','bass','drums']){
   let notes=readPart(ctx,part);
   if(v===0)notes=split(notes,Math.max(1,Math.round(ctx.beat/2)));
   if(v===1&&part!=='drums')notes=notes.map((n,i)=>({...n,pitch:clamp(n.pitch+(i%2?12:-12),24,108)}));
   if(v===2)notes=notes.map((n,i)=>({...n,durationTick:Math.max(1,Math.min((notes[i+1]?.startTick>n.startTick?notes[i+1].startTick:end)-n.startTick,ctx.bar*2))}));
   putPart(ctx,part,notes);
  }ctx.target.enabled=enabled;
 }
 if(id==='d-edge') {
  if(v===0||v===2)silence(ctx,['bass','drums','counter'],start,Math.min(end,start+ctx.beat*2));
  if(v===1||v===2)silence(ctx,['bass','drums','harmony'],Math.max(start,end-ctx.beat),end);
 }
 if(id==='d-transition') {
  if(v===0)fill(ctx);
  if(v===1){const harmony=readPart(ctx,'harmony'),lastTick=Math.max(start,...harmony.map(n=>n.startTick));putPart(ctx,'harmony',harmony.map(n=>n.startTick===lastTick?{...n,durationTick:end-n.startTick}:n));ctx.warnings.push('Section終端まで持続させます。次Sectionを越える音はDAW側で延長してください。');}
  if(v===2){const begin=Math.max(start,end-ctx.bar);const notes=removeRange(counterMaterial(ctx),begin,end);for(let t=begin,i=0;t<end;t+=ctx.beat/2,i++)notes.push({pitch:nearest(60+ctx.tonic+i*2,scalePC(ctx),48,96),startTick:t,durationTick:ctx.beat*.4,velocity:80+i});putPart(ctx,'counter',notes);}
 }
 if(id==='d-pre-drop') {
  const at=ctx.source.sections.findIndex(s=>s.id===ctx.section.id);
  const section=ctx.section.kind==='chorus'?ctx.source.sections[at-1]:ctx.source.sections[at+1]?.kind==='chorus'?ctx.section:null;
  if(!section)throw new Error('直前Sectionを持つサビ、または次がサビのSectionを選んでください。');
  elsewhere(ctx,section,c=>silence(c,v===0?['bass']:v===1?['drums']:PARTS,Math.max(section.startTick,section.endTick-c.beat),section.endTick));
 }
 if(id==='d-chorus-repeat') {
  const sections=ctx.source.sections.filter(s=>s.kind==='chorus');if(sections.length<2)throw new Error('2つ以上のchorus Sectionが必要です。');
  sections.forEach((section,i)=>elsewhere(ctx,section,c=>{
   if(v===0){const notes=i===0?[]:counterMaterial(c).map(n=>({...n,pitch:clamp(n.pitch+(i===sections.length-1?12:0),0,127)}));putPart(c,'counter',notes);}
   if(v===1){shapeCurve(c,i===0?2:0);c.target.density=i===0?'thin':i===sections.length-1?'full':'standard';}
   if(v===2)rangeCurve(c,i===0?1:0);
  }));
 }
 if(id==='d-last-chorus') {
  const section=ctx.source.sections.filter(s=>s.kind==='chorus').at(-1);if(!section)throw new Error('chorus Sectionがありません。');
  elsewhere(ctx,section,c=>{if(v===0)applyHarmony(c,'h-voicing',1);if(v===1)applyCounter(c,'c-grow',2);if(v===2)applyHarmony(c,'h-modulate',2);rangeCurve(c,0);});
 }
 if(id==='d-leaders') {
  const notes=counterMaterial(ctx);
  putPart(ctx,'counter',v===0?notes.filter(n=>n.startTick>=mid):v===1?[]:notes.filter(n=>n.startTick<mid));
  putPart(ctx,'harmony',readPart(ctx,'harmony').map(n=>({...n,velocity:clamp(n.velocity*(v===0?(n.startTick>=mid?.65:1):v===1?(n.startTick<mid?.6:1):n.startTick<mid?.55:1),1,127)})));
  ctx.target.leadSchedule=v===0?'前半：主旋律 / 後半：裏メロ':v===1?'前半：主旋律 / 後半：伴奏':'前半：裏メロ / 後半：伴奏';
 }
 if(id==='d-part-entry') {
  ['harmony','bass','drums','counter'].forEach((part,index)=>{
   let notes=part==='counter'?counterMaterial(ctx):readPart(ctx,part);
   if(v===0)notes=notes.filter(n=>n.startTick>=start+(end-start)*index/4);
   if(v===1)notes=removeRange(notes,start+(end-start)/3,start+2*(end-start)/3);
   if(v===2)notes=notes.filter(n=>n.startTick>=mid);
   putPart(ctx,part,notes);
  });
 }
 if(id==='d-density') {
  if(v===0)for(const part of ['counter','bass','drums','harmony'])putPart(ctx,part,split(readPart(ctx,part),Math.max(1,Math.round(ctx.beat/2))));
  if(v===1){const notes=readPart(ctx,'harmony'),ticks=[...new Set(notes.map(n=>n.startTick))];putPart(ctx,'harmony',ticks.flatMap(t=>notes.filter(n=>n.startTick===t).sort((a,b)=>a.pitch-b.pitch).slice(0,2)));}
  if(v===2)rangeCurve(ctx,0);
  if(v===3){ctx.target.enabled={...ctx.target.enabled,drums:false,counter:false,color:false};}
 }
 if(id==='d-range')rangeCurve(ctx,v);
 if(id==='d-once') {
  const begin=Math.max(start,mid-ctx.beat/2),finish=Math.min(end,begin+ctx.beat);
  if(v===0)silence(ctx,PARTS,begin,finish);
  if(v===1)silence(ctx,['bass','drums','harmony'],begin,finish);
  if(v===2){silence(ctx,['harmony','drums'],begin,finish);const notes=counterMaterial(ctx);putPart(ctx,'counter',notes.map(n=>({...n,velocity:n.startTick>=begin&&n.startTick<finish?100:n.velocity})));}
 }
 if(id==='d-recall') {
  const donor=ctx.source.sections[0];let material=readPart(ctx,'counter',donor);if(!material.length)material=readPart(ctx,'melody',donor);if(!material.length)material=readPart(ctx,'harmony',donor);
  if(!material.length)throw new Error('冒頭Sectionに再利用できる旋律/伴奏Noteがありません。');
  const motif=material.slice(0,8),origin=motif[0].startTick,begin=v===2?Math.max(start,end-ctx.bar):start;
  const mapped=motif.map(n=>({...n,pitch:clamp(n.pitch+(v===0?12:0),0,127),startTick:begin+n.startTick-origin}));
  if(v===1)putPart(ctx,'harmony',[...readPart(ctx,'harmony'),...mapped]);else putPart(ctx,'counter',[...removeRange(readPart(ctx,'counter'),begin,Math.min(end,begin+ctx.bar)),...mapped]);
 }
 if(id==='d-interlude') {
  if(v===0){ctx.target.enabled.drums=false;ctx.target.enabled.counter=false;putPart(ctx,'harmony',thin(readPart(ctx,'harmony')));}
  if(v===1){applyCounter(ctx,'c-rhythm',0);fill(ctx);shapeCurve(ctx,0);}
  if(v===2){applyHarmony(ctx,'h-modulate',0);applyCounter(ctx,'c-entry',1);}
  if(v===3)applyDevelopment(ctx,'d-recall',0);
 }
 if(id==='d-ending') {
  const section=ctx.source.sections.at(-1);
  elsewhere(ctx,section,c=>{
   const begin=Math.max(section.startTick,section.endTick-c.bar);
   if(v===0)silence(c,PARTS,Math.max(section.startTick,section.endTick-c.beat),section.endTick);
   if(v===1)for(const part of PARTS)putPart(c,part,readPart(c,part).map(n=>({...n,velocity:clamp(n.velocity*(1-.75*(n.startTick-section.startTick)/(section.endTick-section.startTick)),1,127)})));
   if(v===2)for(const part of ['harmony','counter','bass']){const notes=readPart(c,part);const last=Math.max(section.startTick,...notes.map(n=>n.startTick));putPart(c,part,notes.map(n=>n.startTick===last?{...n,durationTick:section.endTick-n.startTick}:n));}
   if(v===3)for(const part of ['harmony','counter','bass']){const notes=readPart(c,part),tail=notes.filter(n=>n.startTick>=begin);putPart(c,part,[...notes.filter(n=>n.startTick<begin),...tail.flatMap(n=>[{...n,durationTick:Math.max(1,Math.round(n.durationTick/2)),startTick:begin+Math.round((n.startTick-begin)/2)},{...n,durationTick:Math.max(1,Math.round(n.durationTick/2)),startTick:begin+c.bar/2+Math.round((n.startTick-begin)/2)}])]);}
   if(v===4)applyHarmony(c,'h-resolution',3);
  });
 }
 return ctx;
}
