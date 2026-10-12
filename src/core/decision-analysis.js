import { analyzeMelody, describeMelody } from './melody-analysis.js';
export function decisionAnalysis(project,role='melody') {
  if(!['melody','counter'].includes(role)) throw new Error('分析パートが不正です。');
  const temp=structuredClone(project);
  // 既存Analyzerを同じ条件で再利用。正本と他パートは変更しない。
  temp.tracks=temp.tracks.filter(t=>t.role!=='melody' || role==='melody').map(t=>t.role===role?{...t,role:'melody'}:t);
  const notes=(project.tracks.find(t=>t.role===role)?.notes??[]).slice().sort((a,b)=>a.startTick-b.startTick);
  let steps=0,leaps=0,repeat=0;
  for(let i=1;i<notes.length;i++) {const delta=Math.abs(notes[i].pitch-notes[i-1].pitch);if(delta===0)repeat++;else if(delta<=2)steps++;else leaps++;}
  const bars=new Map(),ticks=project.basic.ppq*4;
  for(const note of notes){const bar=Math.floor(note.startTick/ticks);if(!bars.has(bar))bars.set(bar,[]);bars.get(bar).push(note);}
  let sequences=0;const shapes=new Map();
  for(const ns of bars.values()){
    if(ns.length<3)continue;
    const shape=ns.map(n=>`${n.pitch-ns[0].pitch}:${n.startTick%ticks}:${n.durationTick}`).join('|');
    if(shapes.has(shape)&&shapes.get(shape)!==ns[0].pitch)sequences++;
    else shapes.set(shape,ns[0].pitch);
  }
  return {notes:notes.length,steps,leaps,repeat,sequences,rows:describeMelody(analyzeMelody(temp))};
}
