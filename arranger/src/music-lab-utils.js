import { arrangedNotes, chordName } from './core.js';
import { CHORD_QUALITY_DEFINITIONS as Q } from './chord-qualities.js';
export const pc=n=>((Math.round(n)%12)+12)%12;
export const clamp=(n,lo,hi)=>Math.max(lo,Math.min(hi,Math.round(n)));
export const KEYS={C:0,'C#':1,Db:1,D:2,'D#':3,Eb:3,E:4,F:5,'F#':6,Gb:6,G:7,'G#':8,Ab:8,A:9,'A#':10,Bb:10,B:11};
export const PARTS=['melody','counter','bass','drums','harmony'];
export const chordPC=c=>(Q[c.quality]?.intervals||[0,4,7]).map(i=>pc(c.root+i));
export const clone=x=>structuredClone(x);
export function nearest(pitch,allowed,lo=36,hi=96) {
 const choices=[];for(let p=lo;p<=hi;p++)if(allowed.includes(pc(p)))choices.push(p);
 return choices.sort((a,b)=>Math.abs(a-pitch)-Math.abs(b-pitch)||a-b)[0]??clamp(pitch,lo,hi);
}
export function clipNotes(notes,section) {return notes.filter(Boolean).map((n,i)=>{
 const startTick=Math.max(section.startTick,Math.round(n.startTick)),end=Math.min(section.endTick,Math.round(n.startTick+n.durationTick));
 return {...n,id:n.id||`lab-${section.id}-${i}`,pitch:clamp(n.pitch,0,127),velocity:clamp(n.velocity??80,1,127),startTick,durationTick:end-startTick};
 }).filter(n=>Number.isFinite(n.startTick)&&Number.isFinite(n.durationTick)&&n.durationTick>0).sort((a,b)=>a.startTick-b.startTick||a.pitch-b.pitch);}
export function getContext(source,candidate,sectionId) {
 const section=source.sections.find(s=>s.id===sectionId);if(!section)throw new Error('対象Sectionがありません。');
 const plan=candidate.sections.find(s=>s.sectionId===sectionId);if(!plan)throw new Error('編曲Sectionがありません。');
 const next=clone(candidate),target=next.sections.find(s=>s.sectionId===sectionId);
 const raw=plan.reharmonization?.chords?.length?plan.reharmonization.chords:source.chords;
 const chords=raw.filter(c=>c.startTick<section.endTick&&c.startTick+c.durationTick>section.startTick).map(c=>({...c,startTick:Math.max(c.startTick,section.startTick),durationTick:Math.min(c.startTick+c.durationTick,section.endTick)-Math.max(c.startTick,section.startTick)})).sort((a,b)=>a.startTick-b.startTick);
 return {source,current:candidate,candidate:next,section,target,chords,tonic:KEYS[source.basic.key]??0,minor:source.basic.scale==='minor',beat:source.basic.ppq,bar:source.basic.ppq*4,warnings:[]};
}
export function readPart(ctx,part,section=ctx.section) {return clipNotes(arrangedNotes(ctx.source,ctx.candidate,part),section);}
export function putPart(ctx,part,notes,section=ctx.section) {
 const target=ctx.candidate.sections.find(s=>s.sectionId===section.id);
 target.partOverrides={...target.partOverrides,[part]:clipNotes(notes,section)};
 if(part==='counter'){target.counterArrangement=null;target.restPolicy='none';}
 if(part!=='melody')target.enabled={...target.enabled,[part]:true};
}
export function putChords(ctx,chords,label) {
 const clean=chords.filter(c=>c.durationTick>0).map(c=>({...c,root:pc(c.root),degree:''}));
 ctx.target.reharmonization={id:`lab-${label}`,label,chords:clean,display:clean.map(chordName).join(' → ')};
 if(ctx.target.partOverrides)delete ctx.target.partOverrides.harmony;
 ctx.target.enabled.harmony=true;
}
export function chordAt(ctx,tick) {return ctx.chords.find(c=>tick>=c.startTick&&tick<c.startTick+c.durationTick)||ctx.chords.at(-1);}
export function scalePC(ctx,kind='key',chord=null) {
 if(chord&&kind==='chord')return chordPC(chord);
 if(chord&&kind==='per-chord'){
 const intervals=chord.quality.includes('minor')?[0,2,3,5,7,9,10]:chord.quality.startsWith('dominant')?[0,2,4,5,7,9,10]:[0,2,4,5,7,9,11];return intervals.map(i=>pc(chord.root+i));}
 const ints=kind==='penta'?(ctx.minor?[0,3,5,7,10]:[0,2,4,7,9]):ctx.minor?[0,2,3,5,7,8,10]:[0,2,4,5,7,9,11];return ints.map(i=>pc(ctx.tonic+i));
}
export function counterMaterial(ctx,section=ctx.section) {
 let notes=readPart(ctx,'counter',section);if(notes.length)return notes;
 const melody=readPart(ctx,'melody',section);
 if(melody.length){ctx.warnings.push('元裏メロがないため主旋律の断片を叩き台にしています。');return melody.slice(0,256).map(n=>({...n,pitch:clamp(n.pitch+12,0,127),velocity:70}));}
 ctx.warnings.push('旋律素材がないためKey内の短い裏メロを生成しています。');
 notes=[];for(let t=section.startTick,i=0;t<section.endTick&&i<256;t+=ctx.beat,i++)notes.push({pitch:nearest(72+[0,2,4,7][i%4]+ctx.tonic,scalePC(ctx)),startTick:t,durationTick:Math.min(ctx.beat/2,section.endTick-t),velocity:72});return notes;
}
export function removeRange(notes,start,end) {return notes.flatMap(n=>{
 const a=Math.max(n.startTick,start),b=Math.min(n.startTick+n.durationTick,end);if(b<=a)return[n];
 return [{...n,durationTick:a-n.startTick},{...n,startTick:b,durationTick:n.startTick+n.durationTick-b}].filter(n=>n.durationTick>0);
 });}
export function onlyGaps(notes,melody) {let result=notes;for(const n of melody)result=removeRange(result,n.startTick,n.startTick+n.durationTick);return result;}
export function noteStats(source,candidate,ids) {
 const sections=source.sections.filter(s=>ids.includes(s.id));
 const notes=PARTS.flatMap(part=>arrangedNotes(source,candidate,part).filter(n=>sections.some(s=>n.startTick<s.endTick&&n.startTick+n.durationTick>s.startTick)).map(n=>({part,pitch:n.pitch,startTick:n.startTick,durationTick:n.durationTick,velocity:n.velocity,voice:n.voice||''})));
 return {notes,count:notes.length,range:notes.length?[Math.min(...notes.map(n=>n.pitch)),Math.max(...notes.map(n=>n.pitch))]:null};
}
