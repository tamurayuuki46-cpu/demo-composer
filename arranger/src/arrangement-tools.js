import { arrangedNotes, updateCandidateSection, makeId } from './core.js';
import { CHORD_QUALITY_DEFINITIONS as Q } from './chord-qualities.js';
const clone = x => structuredClone(x);
const pc = n => ((n % 12)+12)%12;
const KEYS = {C:0,'C#':1,Db:1,D:2,'D#':3,Eb:3,E:4,F:5,'F#':6,Gb:6,G:7,'G#':8,Ab:8,A:9,'A#':10,Bb:10,B:11};
export const COUNTER_STYLES = {
 key: {label:'Keyのスケール',description:'元のリズムを保ち、曲の長調/自然短調へ寄せる。'},
 pentatonic: {label:'ペンタトニック',description:'5音に絞り、半音の接近を減らす。衝突がなくなる保証ではない。'},
 color: {label:'モードで色付け',description:'長調はLydianの#4、短調はDorianの長6度を候補にする。和音との相性を聴く。'},
 chord: {label:'採用コードの構成音',description:'選択したリハモを含む和音の構成音へ寄せる。'},
 response: {label:'主旋律の隙間で応答',description:'コード構成音へ寄せ、主旋律の発音中は休む。'},
};
export function adoptSectionFrom(current, donor, sectionId) {
 const section=donor?.sections.find(s=>s.sectionId===sectionId);
 if(!section||!current.sections.some(s=>s.sectionId===sectionId))throw new Error('同じSectionの候補がありません。');
 const next=clone(current);
 next.sections=next.sections.map(s=>s.sectionId===sectionId?{...clone(section),adoptedFrom:donor.label}:s);
 return next;
}
export function buildChorusCandidates(source,current,sectionId) {
 const section=source.sections.find(s=>s.id===sectionId);
 if(section?.kind!=='chorus')return [];
 const styles=[
  {id:'wide',label:'壮大',density:'full',enabled:{drums:true,bass:true,harmony:true,counter:true,color:true},harmonyPattern:'sustain'},
  {id:'drive',label:'疾走',density:'full',enabled:{drums:true,bass:true,harmony:true,counter:true,color:false},harmonyPattern:'pulse'},
  {id:'float',label:'浮遊',density:'standard',enabled:{drums:false,bass:true,harmony:true,counter:true,color:true},harmonyPattern:'arpeggio'},
  {id:'quiet',label:'静かな熱量',density:'thin',enabled:{drums:false,bass:true,harmony:true,counter:false,color:false},harmonyPattern:'sustain'},
  {id:'dance',label:'踊れる',density:'standard',enabled:{drums:true,bass:true,harmony:true,counter:false,color:false},harmonyPattern:'offbeat'},
 ];
 return styles.map(style=>{
  const candidate=updateCandidateSection(current,sectionId,style);
  const target=candidate.sections.find(s=>s.sectionId===sectionId);
  Object.assign(target,{harmonyPattern:style.harmonyPattern,chorusDirection:style.label});
  return {...candidate,id:makeId(),label:`${section.name}: ${style.label}`,description:`このサビだけ変更。伴奏は${{sustain:'持続',pulse:'8分刻み',arpeggio:'分散',offbeat:'裏拍'}[style.harmonyPattern]}。`,sourceCandidateIds:[current.id]};
 });
}
export function buildSubtractionCandidates(source,current,sectionId) {
 const section=current.sections.find(s=>s.sectionId===sectionId);
 if(!section)return [];
 const choices=[
  {id:'space',label:'伴奏と歌の余白',density:'thin',enabled:{counter:false,color:false},reason:'裏メロと色付けを引き、主旋律と伴奏の関係を確かめる。'},
  {id:'low',label:'低音を休ませる',enabled:{bass:false,drums:false},reason:'低音とドラムを休ませ、次Sectionの入口との差を作る。'},
  {id:'answer',label:'裏メロを隙間だけに',restPolicy:'melody-gaps',reason:'主旋律が鳴っている区間から裏メロを引く。'},
 ];
 return choices.map(choice=>({id:choice.id,label:choice.label,reason:choice.reason,patch:choice,
  candidate:updateCandidateSection(current,sectionId,choice)}));
}
function nearest(pitch,allowed) {
 const choices=[];
 for(let n=Math.max(0,pitch-12);n<=Math.min(127,pitch+12);n++)if(allowed.includes(pc(n)))choices.push(n);
 return choices.sort((a,b)=>Math.abs(a-pitch)-Math.abs(b-pitch)||a-b)[0]??pitch;
}
function chordAt(source,plan,tick) {
 const section=source.sections.find(s=>tick>=s.startTick&&tick<s.endTick);
 const arrangement=plan.sections.find(s=>s.sectionId===section?.id);
 const chords=arrangement?.reharmonization?.chords?.length?arrangement.reharmonization.chords:source.chords;
 return chords.find(c=>tick>=c.startTick&&tick<c.startTick+c.durationTick);
}
export function buildCounterScaleCandidates(source,current,sectionId) {
 const section=source.sections.find(s=>s.id===sectionId);
 if(!section)return [];
 const root=KEYS[source.basic.key];
 if(root===undefined)return [];
 const minor=source.basic.scale==='minor';
 const scales={key:minor?[0,2,3,5,7,8,10]:[0,2,4,5,7,9,11],pentatonic:minor?[0,3,5,7,10]:[0,2,4,7,9],color:minor?[0,2,3,5,7,9,10]:[0,2,4,6,7,9,11]};
 let original=source.tracks.filter(t=>t.role==='counter').flatMap(t=>t.notes)
  .filter(n=>n.startTick<section.endTick&&n.startTick+n.durationTick>section.startTick)
  .map(n=>({...n,startTick:Math.max(n.startTick,section.startTick),durationTick:Math.min(n.startTick+n.durationTick,section.endTick)-Math.max(n.startTick,section.startTick)}));
 const generated=original.length===0;
 if(generated) {
  // A small response draft when no counter exists. Rest filtering is shared with exports.
  original=[];
  for(let tick=section.startTick+source.basic.ppq*2;tick<section.endTick&&original.length<128;tick+=source.basic.ppq*2)
   original.push({id:makeId(),pitch:72+root,startTick:tick,durationTick:Math.min(source.basic.ppq,section.endTick-tick),velocity:72});
 }
 return Object.entries(COUNTER_STYLES).map(([id,style])=>{
  const notes=original.map(n=>{
   const chord=chordAt(source,current,n.startTick);
   const allowed=(id==='chord'||id==='response')&&chord?(Q[chord.quality]?.intervals||[0,4,7]).map(i=>pc(chord.root+i)):(scales[id]||scales.key).map(i=>pc(root+i));
   return {...n,pitch:nearest(n.pitch,allowed)};
  });
  let candidate=updateCandidateSection(current,sectionId,{enabled:{counter:true},counterArrangement:{id,label:style.label,notes,generated},restPolicy:id==='response'?'melody-gaps':'none'});
  return {id,label:style.label,description:style.description+(generated?' 元裏メロがないため短い叩き台を作成。':''),notes,
    audibleCount:arrangedNotes(source,candidate,'counter').filter(n=>n.startTick>=section.startTick&&n.startTick<section.endTick).length,candidate};
 });
}
export function leadHandoffCandidate(current,sectionId,mode) {
 const modes={
  melody:{leadRole:'melody',restPolicy:'melody-gaps',label:'主旋律を主役に',reason:'主旋律の発音中は裏メロを休ませる。'},
  counter:{leadRole:'counter',restPolicy:'melody-gaps',label:'隙間で裏メロへ受け渡す',reason:'主旋律が休む区間で裏メロを主役にし、伴奏のVelocityを少し下げる。'},
  harmony:{leadRole:'harmony',restPolicy:'none',label:'伴奏の響きを主役に',reason:'裏メロを休ませ、和音の響きを前に出す。'},
 };
 const choice=modes[mode];if(!choice)throw new Error('主役の指定が正しくありません。');
 return updateCandidateSection(current,sectionId,{...choice,enabled:mode==='harmony'?{counter:false,harmony:true}:{counter:true}});
}
