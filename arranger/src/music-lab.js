import { MUSIC_LAB_CATALOG } from './music-lab-catalog.js';
import { getContext,noteStats,clone,readPart,putPart,PARTS } from './music-lab-utils.js';
import { applyHarmony } from './harmony-lab.js';
import { applyCounter } from './counter-lab.js';
import { applyDevelopment } from './development-lab.js';
function linked(ctx,id,v) {
 if(id==='x-float'){applyHarmony(ctx,'h-float',v);applyCounter(ctx,'c-sustain',v);putPart(ctx,'drums',readPart(ctx,'drums').filter((_,i)=>i%3===0));}
 if(id==='x-push'){applyHarmony(ctx,'h-resolution',0);applyCounter(ctx,'c-rhythm',0);applyDevelopment(ctx,'d-edge',1);if(v>0)applyDevelopment(ctx,'d-transition',v===1?0:2);}
 if(id==='x-quiet'){applyHarmony(ctx,'h-inner',v);applyCounter(ctx,'c-answer',Math.min(v,2));ctx.target.enabled.drums=false;ctx.target.enabled.color=false;}
 if(id==='x-last'){applyDevelopment(ctx,'d-last-chorus',Math.min(v,2));applyDevelopment(ctx,'d-chorus-repeat',1);}
 if(id==='x-motif'){applyCounter(ctx,'c-grow',Math.min(v,2));applyHarmony(ctx,'h-meaning',Math.min(v,2));applyDevelopment(ctx,'d-part-entry',v);}
 return ctx;
}
function materialSignature(source,candidate,id) {
 const stat=noteStats(source,candidate,[id]);const section=candidate.sections.find(s=>s.sectionId===id);
 return JSON.stringify({notes:stat.notes,chords:(section.reharmonization?.chords?.length?section.reharmonization.chords:source.chords.filter(c=>c.startTick>=source.sections.find(s=>s.id===id).startTick&&c.startTick<source.sections.find(s=>s.id===id).endTick)).map(c=>({root:c.root,quality:c.quality,startTick:c.startTick,durationTick:c.durationTick,voicing:c.voicing||null})),tonalTarget:section.tonalTarget||null});
}
export function generateMusicLabCandidates(source,current,sectionId,methodId) {
 const method=MUSIC_LAB_CATALOG.find(m=>m.id===methodId);if(!method)throw new Error('音楽手法が見つかりません。');
 return method.variants.map((variant,index)=>{
  let ctx=getContext(source,current,sectionId);
  try {
   if(method.category==='harmony')applyHarmony(ctx,method.id,index);
   if(method.category==='counter')applyCounter(ctx,method.id,index);
   if(method.category==='development')applyDevelopment(ctx,method.id,index);
   if(method.category==='linked')linked(ctx,method.id,index);
   validateMusicLabCandidate(source,ctx.candidate);
   const affectedSectionIds=source.sections.filter(s=>materialSignature(source,current,s.id)!==materialSignature(source,ctx.candidate,s.id)).map(s=>s.id);
   const before=noteStats(source,current,affectedSectionIds),after=noteStats(source,ctx.candidate,affectedSectionIds);
   for(const id of affectedSectionIds){const target=ctx.candidate.sections.find(s=>s.sectionId===id);target.musicLab={methodId,variant,label:method.label};}
   return {id:`${methodId}-${index}`,methodId,variant,label:`${method.label}：${variant}`,description:method.description,
    available:affectedSectionIds.length>0,unavailableReason:affectedSectionIds.length?'':'現在の素材では音の変更がありません。別の方向か素材で試してください。',
    candidate:ctx.candidate,affectedSectionIds,warnings:[...new Set(ctx.warnings)],stats:{before:before.count,after:after.count,range:after.range},
    chords:ctx.candidate.sections.find(s=>s.sectionId===sectionId)?.reharmonization?.display||'',
    auditionSectionId:affectedSectionIds[0]||sectionId};
  } catch(error){return{id:`${methodId}-${index}`,methodId,variant,label:`${method.label}：${variant}`,description:method.description,available:false,unavailableReason:error.message,affectedSectionIds:[],warnings:[],stats:{before:0,after:0},candidate:null};}
 });
}
export function adoptMusicLabCandidate(current,choice) {
 if(!choice.available||!choice.candidate)throw new Error(choice.unavailableReason||'候補を採用できません。');
 const next=clone(current);
 const ids=new Set(choice.affectedSectionIds);
 next.sections=next.sections.map(s=>ids.has(s.sectionId)?clone(choice.candidate.sections.find(c=>c.sectionId===s.sectionId)):s);
 return next;
}
export function validateMusicLabCandidate(source,candidate) {
 for(const s of source.sections){const target=candidate.sections.find(t=>t.sectionId===s.id);if(!target)throw new Error('Sectionを失っています。');
  for(const part of PARTS)for(const n of target.partOverrides?.[part]||[]){if(!Number.isInteger(n.pitch)||n.pitch<0||n.pitch>127||!Number.isInteger(n.startTick)||!Number.isInteger(n.durationTick)||n.durationTick<=0||n.startTick<s.startTick||n.startTick+n.durationTick>s.endTick)throw new Error('Noteの音域/時間が範囲外です。');}
  for(const c of target.reharmonization?.chords||[]){if(!Number.isInteger(c.root)||c.root<0||c.root>11||!Number.isInteger(c.startTick)||!Number.isInteger(c.durationTick)||c.durationTick<=0||c.startTick<s.startTick||c.startTick+c.durationTick>s.endTick)throw new Error('Chordの音域/時間が範囲外です。');}
 }
 return true;
}
