import { CHORD_QUALITY_DEFINITIONS as Q } from './chord-qualities.js';
import { chordName, updateCandidateSection } from './core.js';

const pc = n => ((n % 12) + 12) % 12;
const NAMES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
const keys = { C:0,'C#':1,Db:1,D:2,'D#':3,Eb:3,E:4,F:5,'F#':6,Gb:6,G:7,'G#':8,Ab:8,A:9,'A#':10,Bb:10,B:11 };
export const THEORY_METHODS = Object.freeze({
  extension: { label:'7th・9thで色を足す', principle:'Rootと三和音の性格を保ち、7thや9thを加える。', condition:'major/minor/major7/minor7/dominant7が対象。', caution:'7thや9thが主旋律と半音で接する場合は、音域と長さを聴いて判断する。', exercise:'元コードと候補で、メロディの同じ音の役割を比べよう。' },
  function: { label:'役割を保つ代理和音', principle:'長調のIとvi、IVとiiの間で、機能の近い和音を置き換える。', condition:'長調の対象となる三和音/7thのみ。今回は最後のコードを保護する。', caution:'同じ機能群でも終止感は同じではない。I→viは着地の印象が弱まることがある。', exercise:'共通音を探し、Rootが変わる効果を聴こう。' },
  secondary: { label:'次へ導くドミナント', principle:'次のRootの完全5度上に7thコードを作り、解決先を強調する。', condition:'同じSection内の次コードがmajor/minor系の三和音または7th。', caution:'主調のI/iへのV7は通常のドミナント。それ以外へのV7が副次ドミナント。一時的主音化は転調の確定ではない。', exercise:'次のコードに進んだときの落ち着き方を聴こう。' },
  borrowed: { label:'同主短調から借りる', principle:'長調のIVを、同じ主音の短調にあるivへ変える。', condition:'長調のIV major/major7を対象に、iv minorへ置換する。', caution:'主旋律が元のIVの長3度を伸ばす場合、借用後の短3度と半音で接する。', exercise:'長3度から短3度への半音下降が、曲の明暗をどう変えるか比べよう。' },
  tritone: { label:'裏コードで半音下降', principle:'解決するV7を、Rootがトライトーン離れた7thへ置換する。3rdと7thの音高クラスを共有する。', condition:'同じSection内で、Rootが完全5度下のmajor/minor系へ進むdominant7のみ。', caution:'元のベースは自動変更しない。新Rootの半音下降を低音で実現するにはDAW側でもベース調整が必要。', exercise:'元のV7と代理7thの3rd/7thを見比べよう。' },
  diminished: { label:'半音下からdim7で接近', principle:'次Rootの半音下にdim7を置き、導音として近づける。', condition:'同じSection内にmajor/minor系の解決先がある場合。', caution:'ここでは導音型dim7を扱う。共通音を装飾するcommon-tone diminishedとは区別する。', exercise:'dim7のRootが次Rootへ半音上がる関係を確かめよう。' },
});
const ordinary = new Set(['major','minor','major7','minor7']);
const isMajor = q => ['major','major7'].includes(q);
const isMinor = q => ['minor','minor7'].includes(q);
function sectionChords(source,id) {
  const section=source.sections.find(s=>s.id===id);
  return section ? source.chords.filter(c=>c.startTick>=section.startTick&&c.startTick<section.endTick).sort((a,b)=>a.startTick-b.startTick) : [];
}
export function buildTheorySuggestions(source,sectionId,method='all') {
  const original=sectionChords(source,sectionId);
  if(!original.length)return [];
  const tonic=keys[source.basic.key];
  const ids=method==='all'?Object.keys(THEORY_METHODS):[method];
  return ids.filter(id=>THEORY_METHODS[id]).map(id=>{
    const chords=original.map((c,i)=>{
      const next=original[i+1], degree=tonic===undefined?null:pc(c.root-tonic);
      let replacement=null;
      if(id==='extension') {
        const quality={major:'major7',minor:'minor7',major7:'major9',minor7:'minor9',dominant7:'dominant9'}[c.quality];
        if(quality)replacement={quality};
      }
      if(id==='function'&&source.basic.scale==='major'&&tonic!==undefined&&next) {
        if(degree===0&&isMajor(c.quality))replacement={root:pc(tonic+9),quality:'minor7'};
        if(degree===9&&isMinor(c.quality))replacement={root:tonic,quality:'major7'};
        if(degree===5&&isMajor(c.quality))replacement={root:pc(tonic+2),quality:'minor7'};
        if(degree===2&&isMinor(c.quality))replacement={root:pc(tonic+5),quality:'major7'};
      }
      if(id==='secondary'&&next&&ordinary.has(next.quality)&&i%2===0)replacement={root:pc(next.root+7),quality:'dominant7'};
      if(id==='borrowed'&&source.basic.scale==='major'&&degree===5&&isMajor(c.quality))replacement={quality:'minor'};
      if(id==='tritone'&&c.quality==='dominant7'&&next&&ordinary.has(next.quality)&&pc(c.root-next.root)===7)replacement={root:pc(c.root+6),quality:'dominant7'};
      if(id==='diminished'&&next&&ordinary.has(next.quality)&&i%2===0)replacement={root:pc(next.root-1),quality:'diminished7'};
      return replacement?{...c,...replacement,degree:''}:{...c};
    });
    const changed=chords.filter((c,i)=>c.root!==original[i].root||c.quality!==original[i].quality).length;
    return {id:`theory-${id}`,method:id,label:THEORY_METHODS[id].label,description:THEORY_METHODS[id].principle,chords,
      display:chords.map(chordName).join(' → '),changed,available:changed>0,
      unavailableReason:changed?'':`今回は変更対象がありません。${THEORY_METHODS[id].condition}`};
  });
}
function tones(c) {return (Q[c.quality]?.intervals||[0,4,7]).map(i=>pc(c.root+i));}
function intervalRole(c,pitch) {
  const interval=pc(pitch-c.root), definition=Q[c.quality]?.intervals||[];
  const tone=definition.find(n=>pc(n)===interval);
  const names={0:'Root',2:'9th',3:'短3度',4:'長3度',5:'4th / 11th',6:'♭5 / #11',7:'5th',8:'#5 / ♭13',9:'6th / 13th',10:'短7度',11:'長7度',13:'♭9',14:'9th',15:'#9',17:'11th',18:'#11',20:'♭13',21:'13th'};
  return {inChord:tone!==undefined,label:tone!==undefined?`${names[tone]||names[interval]||interval}（構成音）`:`非構成音${[2,5,9].includes(interval)?'・テンション候補':''}`};
}
function overlap(n,c,start,end) { return Math.max(0,Math.min(n.startTick+n.durationTick,c.startTick+c.durationTick,end)-Math.max(n.startTick,c.startTick,start)); }
export function analyzeReharm(source,sectionId,suggestion) {
  const section=source.sections.find(s=>s.id===sectionId);
  if(!section)return {rows:[],summary:'Sectionがありません。'};
  const originals=sectionChords(source,sectionId);
  const melody=source.tracks.filter(t=>t.role==='melody').flatMap(t=>t.notes);
  const bass=source.tracks.filter(t=>t.role==='bass').flatMap(t=>t.notes);
  let total=0,matched=0,oldMatched=0;
  const rows=(suggestion.chords||[]).map(c=>{
    const before=originals.find(o=>o.startTick===c.startTick)||c;
    const a=tones(before),b=tones(c), common=a.filter(t=>b.includes(t)),added=b.filter(t=>!a.includes(t)),removed=a.filter(t=>!b.includes(t));
    const observations=melody.filter(n=>overlap(n,c,section.startTick,section.endTick)>0).map(n=>{
      const weight=overlap(n,c,section.startTick,section.endTick);
      const afterRole=intervalRole(c,n.pitch),beforeRole=intervalRole(before,n.pitch);
      total+=weight; if(afterRole.inChord)matched+=weight; if(beforeRole.inChord)oldMatched+=weight;
      const start=Math.max(n.startTick,c.startTick,section.startTick),end=Math.min(n.startTick+n.durationTick,c.startTick+c.durationTick,section.endTick);
      const strong=Math.ceil(start/(source.basic.ppq*2))*(source.basic.ppq*2)<end;
      return {pitch:n.pitch,name:NAMES[pc(n.pitch)],tick:start,before:beforeRole.label,after:afterRole.label,
        attention:!afterRole.inChord&&(strong||weight>=source.basic.ppq),strong,long:weight>=source.basic.ppq,
        semitone:b.some(t=>[1,11].includes(pc(n.pitch-t)))};
    });
    const bassOutside=bass.filter(n=>overlap(n,c,section.startTick,section.endTick)>0&&!b.includes(pc(n.pitch))).map(n=>NAMES[pc(n.pitch)]);
    const motion=a.map(from=>{
      const to=[...b].sort((x,y)=>Math.min(pc(x-from),pc(from-x))-Math.min(pc(y-from),pc(from-y)))[0];
      const step=pc(to-from)>6?pc(to-from)-12:pc(to-from);
      return `${NAMES[from]} → ${NAMES[to]}（${step===0?'共通音':`${step>0?'+':''}${step}半音`}）`;
    });
    return {before:chordName(before),after:chordName(c),startTick:c.startTick,changed:before.root!==c.root||before.quality!==c.quality,
      common:common.map(t=>NAMES[t]),added:added.map(t=>NAMES[t]),removed:removed.map(t=>NAMES[t]),motion,
      melody:observations.slice(0,12),melodyCount:observations.length,attentionCount:observations.filter(o=>o.attention).length,
      bassOutside:[...new Set(bassOutside)],rootChanged:before.root!==c.root};
  });
  return {rows,coverage:total?Math.round(100*matched/total):null,beforeCoverage:total?Math.round(100*oldMatched/total):null,
    summary:total?'構成音に重なる時間の割合。点数や正誤ではありません。経過音・テンションは音楽的に有効な場合があります。':'このSectionには主旋律がありません。メロディとの関係は未評価です。'};
}

// Audition copies only: never adopt/mutate a candidate merely by playing it.
export function theoryAudition(source,candidate,sectionId,suggestion,mode='candidate') {
  const section=source.sections.find(s=>s.id===sectionId);
  if(!section)throw new Error('Sectionがありません。');
  let plan=updateCandidateSection(candidate,sectionId,{reharmonization:mode==='original'?null:suggestion,enabled:{harmony:true}});
  const input=structuredClone(source);
  let parts=['melody','harmony'];
  if(mode==='bass')parts=['bass'];
  if(mode==='guide') {
    const chords=suggestion.chords;
    input.tracks=[{role:'guide',notes:chords.flatMap(c=>(Q[c.quality]?.intervals||[])
      .filter((i,index)=>index===1||index===3||i>=12)
      .map(i=>({pitch:48+c.root+i,startTick:c.startTick,durationTick:c.durationTick,velocity:80})))}];
    parts=['guide'];
  }
  return {source:input,candidate:plan,startTick:section.startTick,endTick:section.endTick,parts};
}
