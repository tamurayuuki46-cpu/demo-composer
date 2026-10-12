import { withDecisionCandidate } from './decision-candidates.js';
import { sliceProject } from './section-ops.js';
import { getSoundSelection } from './sound-presets.js';
import { pitchLabel } from './melody-analysis.js';
const clone=x=>structuredClone(x);
const signature=n=>[n.pitch,n.startTick,n.durationTick,n.velocity].join(':');
export function createDecisionComparison(project,candidate) {
  const temp=withDecisionCandidate(project,candidate),{kind,startBar,endBar,part}=candidate;
  let summary, changed, detail=[];
  if(kind==='chord') {
    if(candidate.replaceAll) {
      const a=project.chords,b=temp.chords;
      summary=`コード進行全体：${a.length}小節 → ${b.length}小節。他パートの音符・構成は保持します。`;
      detail=Array.from({length:Math.max(a.length,b.length)},(_,i)=>`Bar ${i+1}: ${a[i]?pitchLabel(a[i].root+60).replace(/\d+$/,'')+' '+a[i].quality:'なし'} → ${b[i]?pitchLabel(b[i].root+60).replace(/\d+$/,'')+' '+b[i].quality:'なし'}`);
      changed=JSON.stringify(a)!==JSON.stringify(b);
      return clone({...candidate,projectId:project.id,revision:project.revision,base:project,summary,changed,detail});
    }
    const a=project.chords[startBar],b=temp.chords[startBar];
    summary=`${pitchLabel(a.root+60).replace(/\d+$/,'')} ${a.quality} → ${pitchLabel(b.root+60).replace(/\d+$/,'')} ${b.quality}（位置と長さは保持）`;
    changed=JSON.stringify(a)!==JSON.stringify(b);
  } else if(kind==='sound') {
    const selection=p=>part==='chord-voicing'?(p.instruments.find(i=>i.part===part)??{preset:'center',tone:'natural'}):getSoundSelection(p.instruments,part);
    const a=selection(project),b=selection(temp);
    summary=`${a.preset} / ${a.tone} → ${b.preset} / ${b.tone}。このパートの曲全体に反映します。`;
    changed=a.preset!==b.preset||a.tone!==b.tone;
  } else {
    const ticks=project.basic.ppq*4;
    const notes=p=>(p.tracks.find(t=>t.role===kind)?.notes??[]).filter(n=>n.startTick>=startBar*ticks&&n.startTick<endBar*ticks).sort((a,b)=>a.startTick-b.startTick);
    const a=notes(project),b=notes(temp),remaining=b.map(signature);let same=0;
    for(const note of a){const i=remaining.indexOf(signature(note));if(i>=0){same++;remaining.splice(i,1);}}
    changed=a.length!==b.length||same!==a.length;
    summary=`A ${a.length}音 / B ${b.length}音。同じ音 ${same}・取り除く音 ${a.length-same}・加える音 ${b.length-same}。`;
    for(let i=0;i<Math.max(a.length,b.length);i++) {
      if(a[i]&&b[i]&&signature(a[i])===signature(b[i])) continue;
      const describe=n=>n?`${pitchLabel(n.pitch)} @${((n.startTick-startBar*ticks)/project.basic.ppq+1).toFixed(2)}拍 長さ${(n.durationTick/project.basic.ppq).toFixed(2)} 強さ${n.velocity}`:'なし';
      detail.push(`${describe(a[i])} → ${describe(b[i])}`);
    }
  }
  return clone({...candidate,projectId:project.id,revision:project.revision,base:project,summary,changed,detail});
}
export function comparisonMatches(session,project) { return Boolean(session&&session.projectId===project.id&&session.revision===project.revision); }
export function assertCurrentComparison(session,project) {
  if(!comparisonMatches(session,project)) throw new Error('現在案が変わりました。比較をやり直してください。');
}
export function decisionPreview(session,current,choice) {
  assertCurrentComparison(session,current);
  if(!['A','B'].includes(choice)) throw new Error('案が不正です。');
  const project=choice==='A'?clone(session.base):withDecisionCandidate(session.base,session);
  // Bass保護を採用時に迂回しない。比較は両案で同じくBassを外す。
  if(session.kind==='chord') project.tracks=project.tracks.map(t=>t.role==='bass'?{...t,notes:[]}:t);
  const ticks=project.basic.ppq*4;
  return {project:sliceProject(project,session.startBar*ticks,session.endBar*ticks),lengthTick:(session.endBar-session.startBar)*ticks};
}
