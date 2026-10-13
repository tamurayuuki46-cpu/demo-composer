import { CHORD_QUALITY_DEFINITIONS as Q } from './chord-qualities.js';
import { pc,clamp,nearest,chordPC,readPart,putPart,scalePC,counterMaterial,chordAt,onlyGaps,clipNotes } from './music-lab-utils.js';
function atMelody(melody,tick) {return melody.find(n=>n.startTick<=tick&&tick<n.startTick+n.durationTick)||[...melody].reverse().find(n=>n.startTick<=tick)||melody[0];}
function repeats(ctx,motif,offset=0,factor=1) {
 if(!motif.length)return [];
 const anchor=motif[0].startTick,period=Math.max(ctx.beat,Math.max(...motif.map(n=>n.startTick+n.durationTick))-anchor);
 const result=[];
 for(let t=ctx.section.startTick+offset;t<ctx.section.endTick&&result.length<1024;t+=period*factor){for(const n of motif)result.push({...n,startTick:Math.round(t+(n.startTick-anchor)*factor),durationTick:Math.max(1,Math.round(n.durationTick*factor))});}
 return clipNotes(result,ctx.section);
}
export function applyCounter(ctx,id,v) {
 let notes=counterMaterial(ctx),original=notes.map(n=>({...n}));const melody=readPart(ctx,'melody'),scale=scalePC(ctx);
 const allowedAt=(n,kind='chord')=>scalePC(ctx,kind,chordAt(ctx,n.startTick));
 if(id==='c-blend')notes=notes.map((n,i)=>{
  const c=chordAt(ctx,n.startTick),chord=c?chordPC(c):scale;
  const allowed=v===0?(i%4===0?chord:scale):v===1?(i%4===0?scale:chord):c?[...chord,pc(c.root+2),pc(c.root+9)]:scale;
  const target=v===2&&c&&i%3===0?nearest(n.pitch,[pc(c.root+2),pc(c.root+9)]):n.pitch;
  return{...n,pitch:nearest(target,allowed)};
 });
 if(id==='c-per-chord')notes=notes.map(n=>{
  const c=chordAt(ctx,n.startTick);let allowed=allowedAt(n,v===2?'chord':'per-chord');
  if(v===1&&c)allowed=(c.quality.includes('minor')?[0,2,3,5,7,8,11]:c.quality.startsWith('dominant')?[0,1,3,4,6,8,10]:[0,2,4,6,7,9,11]).map(i=>pc(c.root+i));
  return {...n,pitch:nearest(n.pitch,allowed)};
 });
 if(id==='c-follow') {
  if(v===0){const raw=ctx.source.tracks.filter(t=>t.role==='counter').flatMap(t=>t.notes);notes=raw.length?clipNotes(raw,ctx.section):original;}
  else notes=notes.map(n=>{const c=chordAt(ctx,n.startTick);const allowed=c?(v===1?chordPC(c):[...chordPC(c),pc(c.root+2),pc(c.root+9)]):scale;return{...n,pitch:nearest(n.pitch,allowed)};});
 }
 if(id==='c-contour') {
  let previous=nearest(notes[0]?.pitch+(v===1?12:0),v===2?scalePC(ctx,'penta'):scale);
  notes=notes.map((n,i)=>{
   const allowed=v===2?scalePC(ctx,'penta'):scale;if(!i)return{...n,pitch:previous};
   const direction=Math.sign(n.pitch-original[i-1].pitch);
   let target=nearest(previous+(direction===0?0:direction*Math.max(1,Math.abs(n.pitch-original[i-1].pitch))),allowed,24,108);
   if(direction>0&&target<=previous)target=nearest(previous+2,allowed,Math.min(108,previous+1),108);
   if(direction<0&&target>=previous)target=nearest(previous-2,allowed,24,Math.max(24,previous-1));
   if(direction===0)target=previous;previous=target;return{...n,pitch:target};
  });
 }
 if(id==='c-rhythm')notes=notes.map((n,i)=>({...n,pitch:v===2?nearest(72+ctx.tonic+[0,4,7][i%3],allowedAt(n)):nearest(60+ctx.tonic+(v===0?i*2:-i*2),scale,36,96)}));
 if(id==='c-motion') {
  if(!melody.length)throw new Error('主旋律の動きを参照するNoteがありません。');
  const anchor=melody[0].pitch;
  notes=notes.map(n=>{const m=atMelody(melody,n.startTick);return{...n,pitch:nearest(v===0?anchor+12-(m.pitch-anchor):v===1?anchor+7:m.pitch+7,scale,36,108)};});
 }
 if(id==='c-answer') {
  if(!melody.length)throw new Error('応答の元となる主旋律がありません。');
  notes=[];const ordered=[...melody].sort((a,b)=>a.startTick-b.startTick);
  for(let i=0;i<ordered.length;i++){
   const m=ordered[i],start=m.startTick+m.durationTick,next=ordered[i+1]?.startTick??ctx.section.endTick;
   if(next-start<ctx.beat/2)continue;
   const count=v===0?2:v===1?4:1,step=Math.min(ctx.beat/2,(next-start)/count);
   for(let j=0;j<count;j++)notes.push({pitch:nearest(m.pitch+[2,4,2,0][j%4],scale,48,96),startTick:Math.round(start+j*step),durationTick:Math.max(1,Math.round(v===2?next-start:step*.8)),velocity:75});
  }
  if(!notes.length)throw new Error('主旋律の語尾のあとに半拍以上の隙間がありません。');
 }
 if(id==='c-entry') {
  if(v===2)notes=onlyGaps(notes,melody);
  else notes=notes.map(n=>({...n,startTick:n.startTick+(v===0?-ctx.beat/2:ctx.beat/2)}));
 }
 if(id==='c-motif') {
  const anchor=notes[0]?.pitch??72;
  if(v===0)notes=notes.map(n=>({...n,pitch:nearest(anchor*2-n.pitch,scale,36,108)}));
  if(v===1)notes=notes.map(n=>({...n,pitch:clamp(n.pitch+5,0,127)}));
  if(v===2||v===3){const factor=v===2?2:.5;notes=notes.map(n=>({...n,startTick:ctx.section.startTick+Math.round((n.startTick-ctx.section.startTick)*factor),durationTick:Math.max(1,Math.round(n.durationTick*factor))}));}
  if(v===4)notes=repeats(ctx,notes.slice(0,2),ctx.beat/2);
 }
 if(id==='c-sustain') {
  notes=[];
  if(v===0)notes=[{pitch:72+ctx.tonic,startTick:ctx.section.startTick,durationTick:ctx.section.endTick-ctx.section.startTick,velocity:65}];
  else if(v===1&&ctx.chords.length)notes=ctx.chords.map(c=>({pitch:nearest(72,[pc(c.root+(c.quality==='diminished7'||c.quality==='diminished'?9:(Q[c.quality]?.intervals||[]).find(i=>i===10||i===11)??(c.quality.startsWith('minor')||c.quality.startsWith('dominant')?10:11)))]),startTick:c.startTick,durationTick:c.durationTick,velocity:68}));
  else for(let t=ctx.section.startTick,i=0;t<ctx.section.endTick;t+=ctx.bar*2,i++)notes.push({pitch:nearest(72+ctx.tonic+[0,7][i%2],scale),startTick:t,durationTick:Math.min(ctx.bar*2,ctx.section.endTick-t),velocity:68});
 }
 if(id==='c-register')notes=notes.map(n=>({...n,pitch:nearest(n.pitch,v===0?[pc(n.pitch)]:[pc(n.pitch)],...(v===0?[84,108]:v===1?[60,83]:[36,59]))}));
 if(id==='c-repair')notes=notes.flatMap(n=>{
  const close=melody.filter(m=>n.startTick<m.startTick+m.durationTick&&m.startTick<n.startTick+n.durationTick&&Math.abs(n.pitch-m.pitch)<=2);
  if(!close.length)return[n];
  if(v===0){const c=chordAt(ctx,n.startTick),allowed=(c?chordPC(c):scale);let possibilities=[];for(let pitch=48;pitch<=96;pitch++)if(allowed.includes(pc(pitch))&&close.every(m=>Math.abs(m.pitch-pitch)>2))possibilities.push(pitch);return possibilities.length?[{...n,pitch:possibilities.sort((a,b)=>Math.abs(a-n.pitch)-Math.abs(b-n.pitch))[0]}]:[];}
  if(v===1){const pitch=[n.pitch+12,n.pitch-12].find(p=>p>=0&&p<=127&&close.every(m=>Math.abs(m.pitch-p)>2));return pitch===undefined?[]:[{...n,pitch}];}
  if(v===2){const end=Math.min(...close.map(m=>m.startTick));return end>n.startTick?[{...n,durationTick:end-n.startTick}]:[];}
  return onlyGaps([n],close);
 });
 if(id==='c-independence') {
  if(v===0&&melody.length)notes=melody.map(n=>({...n,pitch:nearest(n.pitch-5,scale,48,84),velocity:65}));
  if(v===1)notes=repeats(ctx,original.slice(0,3),ctx.beat/2);
  if(v===2){notes=notes.map((n,i)=>({...n,pitch:nearest(72+ctx.tonic+[0,4,2,7,5,9][i%6],scale),startTick:n.startTick+(i%2?ctx.beat/4:0)}));}
 }
 if(id==='c-grow') {
  const at=ctx.source.sections.findIndex(s=>s.id===ctx.section.id),donor=ctx.source.sections.slice(0,at).reverse().find(s=>readPart(ctx,'counter',s).length||readPart(ctx,'melody',s).length);
  if(!donor)throw new Error('先行Sectionに再利用できる旋律素材がありません。');
  const motif=(readPart(ctx,'counter',donor).length?readPart(ctx,'counter',donor):readPart(ctx,'melody',donor)).slice(0,8);
  notes=repeats(ctx,motif,0,v===1?.5:1).map((n,i)=>({...n,pitch:nearest(n.pitch+(v===0?5:v===2?12+(i%2)*5:0),scale,36,108)}));
 }
 if(id==='c-limit') {
  if(v===0){const palette=[pc(ctx.tonic),pc(ctx.tonic+(ctx.minor?3:4)),pc(ctx.tonic+7)];notes=notes.map(n=>({...n,pitch:nearest(n.pitch,palette)}));}
  if(v===1){const bars=new Set();notes=notes.filter(n=>{const bar=Math.floor((n.startTick-ctx.section.startTick)/ctx.bar);if(bars.has(bar))return false;bars.add(bar);return true;});}
  if(v===2)notes=notes.map(n=>({...n,pitch:original[0].pitch}));
 }
 if(id==='c-voices') {
  const mono=notes.map((n,i)=>({...n,durationTick:Math.min(n.durationTick,(notes[i+1]?.startTick??ctx.section.endTick)-n.startTick)})).filter(n=>n.durationTick>0);
  notes=mono.map((n,i)=>({...n,voice:v===0?(i%2?'B':'A'):v===1?(n.startTick<(ctx.section.startTick+ctx.section.endTick)/2?'A':'B'):(Math.floor((n.startTick-ctx.section.startTick)/ctx.bar)%2?'B':'A')}));
  ctx.target.voiceRoles={A:'裏メロA：先行・応答',B:'裏メロB：受け渡し'};
 }
 putPart(ctx,'counter',notes);
 return ctx;
}
