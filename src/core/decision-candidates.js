// 1要素だけを変える。現在案は書き換えず、候補の部品だけ返す。
import { chordIntervals } from './chord-qualities.js';
import { getSoundPart, getSoundSelection } from './sound-presets.js';
import { counterCandidates } from './counter-melody.js';
const KEYS=['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
export const VARIATION_MODES = Object.freeze({
  'last-two': {label:'最後の2音の音高だけ',kind:'melody'},
  rhythm: {label:'主旋律のリズムだけ',kind:'melody'},
  pitch: {label:'主旋律の音高だけ',kind:'melody'},
  counter: {label:'裏メロだけ',kind:'counter'},
  chord: {label:'コード1個だけ',kind:'chord'},
  voicing: {label:'ボイシングの音域だけ',kind:'sound'},
  sound: {label:'音色だけ',kind:'sound'}
});
const clone=x=>structuredClone(x);
const notesOf=(p,r)=>p.tracks.find(t=>t.role===r)?.notes??[];
function changedPitches(project, notes, variant, lastOnly) {
  const tonic=KEYS.indexOf(project.basic.key), scale=project.basic.scale==='minor'?[0,2,3,5,7,8,10]:[0,2,4,5,7,9,11];
  const from=lastOnly?Math.max(0,notes.length-2):0;
  return notes.map((note,index)=>{
    if(index<from) return clone(note);
    const direction=variant===1?-1:1;
    const allowed=Array.from({length:128},(_,i)=>i).filter(p=>scale.includes((p-tonic+120)%12));
    const pool=allowed.filter(p=> direction>0?p>note.pitch:p<note.pitch).sort((a,b)=>Math.abs(a-note.pitch)-Math.abs(b-note.pitch));
    return {...note,pitch:pool[Math.min(variant===2?1:0,pool.length-1)]??note.pitch};
  });
}
export function decisionCandidates(project,{mode='last-two',startBar=0,bars=1,part='melody'}={}) {
  if(!Object.hasOwn(VARIATION_MODES,mode) || !Number.isInteger(startBar)||startBar<0||startBar>=128 || !Number.isInteger(bars)||bars<1||startBar+bars>128) throw new Error('候補の範囲が不正です。');
  const barTicks=project.basic.ppq*4, endBar=startBar+bars, start=startBar*barTicks,end=endBar*barTicks;
  const descriptor=VARIATION_MODES[mode];
  const base={kind:descriptor.kind,startBar,endBar,part};
  if(mode==='counter') {
    return counterCandidates(project,{startBar,endBar}).filter(c=>['sparse','active','answer'].includes(c.id)).map(c=>({...base,label:c.label,data:clone(c.notes),mode}));
  }
  if(['last-two','rhythm','pitch'].includes(mode)) {
    const notes=notesOf(project,'melody').filter(n=>n.startTick>=start && n.startTick<end).sort((a,b)=>a.startTick-b.startTick);
    if(!notes.length) throw new Error('この範囲に主旋律がありません。先に入力してください。');
    return [0,1,2].map(variant=>{
      let data;
      if(mode==='rhythm') {
        // 前後の音と重ならない余地だけ開始位置をずらす。音高・長さ・強さは保持。
        data=notes.map((note,i)=>{
          const earliest=i?notes[i-1].startTick+notes[i-1].durationTick:start;
          const latest=i+1<notes.length?notes[i+1].startTick-note.durationTick:end-note.durationTick;
          const shift=(variant===1?-1:1)*(variant===2?240:120);
          const desired=note.startTick+shift;
          // 同時に隣接音を動かしても衝突しないよう、元の空白の半分までにする。
          const lo=Math.ceil((earliest+note.startTick)/2/120)*120,hi=Math.floor((latest+note.startTick)/2/120)*120;
          return {...note,startTick:lo<=hi && note.startTick>=start && note.startTick+note.durationTick<=end?Math.max(lo,Math.min(hi,desired)):note.startTick};
        });
      } else data=changedPitches(project,notes,variant,mode==='last-two');
      return {...base,mode,label:`${descriptor.label}：${(mode==='rhythm'?['少し後ろへ','少し前へ','もう少し後ろへ']:['少し上げる','少し下げる','もう少し上げる'])[variant]}`,data};
    });
  }
  if(mode==='chord') {
    const chord=project.chords[startBar]; if(!chord) throw new Error('この小節にコードがありません。');
    return [chord.quality==='minor'?'minor7':'major7','sus2','sus4'].map(quality=>({...base,endBar:startBar+1,mode,label:`同じルートで${quality}`,data:{...clone(chord),quality}}));
  }
  if(mode==='voicing') {
    const original=project.instruments.find(i=>i.part==='chord-voicing')?.preset??'center';
    return ['lower','center','upper'].filter(p=>p!==original).map(preset=>({...base,part:'chord-voicing',mode,label:`コード音域：${{lower:'低め',center:'標準',upper:'高め'}[preset]}`,data:{part:'chord-voicing',preset,tone:'natural'}}));
  }
  const definition=getSoundPart(part);if(!definition) throw new Error('音色パートが不正です。');
  const selected=getSoundSelection(project.instruments,part);
  return definition.presets.filter(p=>p.id!==selected.preset).slice(0,3).map(p=>({...base,mode,label:`${definition.label}：${p.label}`,data:{...selected,preset:p.id}}));
}
export function validateCandidate(candidate,project) {
  const {kind,startBar,endBar,part,data}=candidate??{};
  if(!['melody','counter','chord','sound'].includes(kind)||!Number.isInteger(startBar)||!Number.isInteger(endBar)||startBar<0||endBar<=startBar||endBar>128||typeof candidate.label!=='string'||candidate.label.length>160) throw new Error('候補が不正です。');
  if(kind==='chord' && candidate.replaceAll && (startBar!==0 || !Array.isArray(data) || data.length<1 || data.length>128 || data.some((c,i)=>c.startTick!==i*project.basic.ppq*4 || c.durationTick!==project.basic.ppq*4))) throw new Error('コード進行候補が不正です。');
  if(kind==='chord' && !candidate.replaceAll && (endBar!==startBar+1 || !project.chords[startBar] || data?.startTick!==project.chords[startBar].startTick || data?.durationTick!==project.chords[startBar].durationTick)) throw new Error('コード候補は1個だけ変更してください。');
  if(kind==='sound' && (!['chord','melody','bass','chord-voicing'].includes(part)||data?.part!==part)) throw new Error('音色候補が不正です。');
  if(kind==='sound' && part==='chord-voicing' && !['lower','center','upper'].includes(data.preset)) throw new Error('ボイシング音域が不正です。');
  if(kind==='melody'||kind==='counter') {
    const start=startBar*project.basic.ppq*4,end=endBar*project.basic.ppq*4;
    if(!Array.isArray(data)||data.some(n=>n.startTick<start||n.startTick>=end)) throw new Error('範囲外の候補Noteです。');
  }
}
export function withDecisionCandidate(project,candidate) {
  validateCandidate(candidate,project);
  const next=clone(project),{kind,startBar,endBar,data,part}=candidate;
  if(kind==='chord') { if(candidate.replaceAll) next.chords=clone(data);else next.chords[startBar]=clone(data); }
  else if(kind==='sound') {
    const index=next.instruments.findIndex(i=>i.part===part);
    if(index<0) next.instruments.push(clone(data));else next.instruments[index]=clone(data);
  } else {
    const start=startBar*project.basic.ppq*4,end=endBar*project.basic.ppq*4;
    let track=next.tracks.find(t=>t.role===kind);
    if(!track){track={role:kind,name:kind==='counter'?'Counter Melody':'Melody',midiChannel:kind==='counter'?4:2,instrumentId:null,mute:false,solo:false,volume:1,pan:0,notes:[]};next.tracks.push(track);}
    track.notes=[...(track.notes??[]).filter(n=>n.startTick<start||n.startTick>=end),...clone(data)].sort((a,b)=>a.startTick-b.startTick||a.pitch-b.pitch);
  }
  return next;
}
