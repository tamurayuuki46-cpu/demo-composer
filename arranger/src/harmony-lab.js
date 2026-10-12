import { CHORD_QUALITY_DEFINITIONS as Q } from './chord-qualities.js';
import { pc,clamp,nearest,chordPC,readPart,putPart,putChords,scalePC,clone } from './music-lab-utils.js';
const names=['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
function melodyAnchor(ctx,c) {
 const notes=readPart(ctx,'melody').filter(n=>n.startTick<c.startTick+c.durationTick&&n.startTick+n.durationTick>c.startTick);
 return notes.sort((a,b)=>b.durationTick-a.durationTick)[0]?.pitch??72+c.root;
}
function bestChord(ctx,c,roots,qualities) {
 const melody=readPart(ctx,'melody').filter(n=>n.startTick<c.startTick+c.durationTick&&n.startTick+n.durationTick>c.startTick);
 let best={...c},score=-Infinity;
 for(const root of roots)for(const quality of qualities){
  const possible={root:pc(root),quality},pcs=chordPC(possible);
  const value=melody.reduce((sum,n)=>sum+(pcs.includes(pc(n.pitch))?n.durationTick:0),0)-Math.min(pc(root-c.root),pc(c.root-root))*3;
  if(value>score){score=value;best={...c,...possible,voicing:null};}
 }
 return best;
}
function chordShape(c,kind,index=0) {
 const ints=Q[c.quality]?.intervals||[0,4,7];let notes=ints.map(i=>48+c.root+i);
 if(kind==='open')notes=notes.map((n,i)=>n+(i%2?12:0));
 if(kind==='low')notes=notes.map(n=>n-12);
 if(kind==='high')notes=notes.map(n=>n+12);
 if(kind==='rootless')notes=notes.slice(1);
 return {...c,voicing:[...new Set(notes.map(n=>clamp(n,24,108)))].sort((a,b)=>a-b)};
}
function endProgression(ctx,roots,qualities) {
 const length=ctx.section.endTick-ctx.section.startTick;
 const start=Math.max(ctx.section.startTick,ctx.section.endTick-Math.min(length,ctx.bar*roots.length));
 const duration=Math.floor((ctx.section.endTick-start)/roots.length);
 const original=ctx.chords.filter(c=>c.startTick<start).map(c=>({...c,durationTick:Math.min(c.durationTick,start-c.startTick)}));
 const end=roots.map((root,i)=>({root:pc(root),quality:qualities[i],startTick:start+i*duration,durationTick:i===roots.length-1?ctx.section.endTick-(start+i*duration):duration}));
 return [...original,...end];
}
export function applyHarmony(ctx,id,v) {
 if(!ctx.chords.length)throw new Error('このSectionにはコードがありません。先にDemo Composerでコードを用意してください。');
 const original=clone(ctx.chords);let chords=clone(original);
 if(id==='h-melody-fit')chords=chords.map(c=>bestChord(ctx,c,v===0?[c.root,ctx.tonic,ctx.tonic+5,ctx.tonic+9]:Array.from({length:12},(_,i)=>i),v===0?['major7','minor7']:v===1?['minor7','minor9','major7']:['dominant7','dominant9','diminished7']));
 if(id==='h-meaning')chords=chords.map(c=>({...c,root:pc(melodyAnchor(ctx,c)-[0,4,10][v]),quality:v===2?'dominant7':'major7',voicing:null}));
 if(id==='h-bass-fixed') {
  const bass=readPart(ctx,'bass');if(!bass.length)throw new Error('固定するBass Noteがありません。');
  chords=chords.map(c=>{const b=bass.find(n=>n.startTick<c.startTick+c.durationTick&&n.startTick+n.durationTick>c.startTick)||bass[0];return bestChord(ctx,c,[pc(b.pitch+[0,5,7][v])],['major7','minor7']);});
  ctx.warnings.push('Bassを保持しています。上部和音との半音接近や分数コードの響きは試聴で判断してください。');
 }
 if(id==='h-bass-line') {
  const scale=scalePC(ctx),bass=[];
  chords=chords.map((c,i)=>{
   const pitch=v===0?nearest(36+ctx.tonic+i*2,scale,28,60):v===1?clamp(48+ctx.tonic-i,24,60):36+ctx.tonic;
   bass.push({pitch,startTick:c.startTick,durationTick:c.durationTick,velocity:88});
   return bestChord(ctx,c,[pc(pitch),pc(pitch+5)],['major7','minor7']);
  });putPart(ctx,'bass',bass);
 }
 if(id==='h-bridge') {
  if(chords.length<2)throw new Error('接続先として2つ以上のコードが必要です。');
  chords=chords.flatMap((c,i)=>{
   const next=original[i+1];if(!next||c.durationTick<2)return[c];
   const length=Math.max(1,Math.min(ctx.beat,Math.floor(c.durationTick/2)));
   return [{...c,durationTick:c.durationTick-length},{root:pc(next.root+[7,-1,2][v]),quality:['dominant7','diminished7','minor7'][v],startTick:c.startTick+c.durationTick-length,durationTick:length}];
  });
 }
 if(id==='h-rhythm') {
  if(v===1) {chords=[];for(let i=0;i<original.length;i+=2){const a=original[i],b=original[i+1];chords.push({...a,durationTick:b?b.startTick+b.durationTick-a.startTick:a.durationTick});}}
  else chords=chords.flatMap(c=>{if((v===2&&c.startTick<(ctx.section.startTick+ctx.section.endTick)/2)||c.durationTick<2)return[c];const half=Math.floor(c.durationTick/2);return[{...c,durationTick:half},{...c,startTick:c.startTick+half,durationTick:c.durationTick-half}];});
 }
 if(id==='h-resolution') {
  const tonic=ctx.tonic,tonicQuality=ctx.minor?'minor':'major';
  const roots=v===0?[tonic+7,tonic]:v===1?[tonic+5,tonic]:v===2?[tonic+7,tonic+(ctx.minor?8:9)]:[tonic+7,tonic+7];
  const qs=v===0?['dominant7',tonicQuality]:v===1?['minor',tonicQuality]:v===2?['dominant7',ctx.minor?'major':'minor']:['dominant7sus4','dominant7'];
  chords=endProgression(ctx,roots,qs);
 }
 if(id==='h-borrow')chords=chords.map((c,i)=>{
  const degree=pc(c.root-ctx.tonic);
  if(!ctx.minor){if(v===0&&degree===5)return{...c,quality:'minor',voicing:null};if(v===1&&i%2===0)return{...c,root:pc(ctx.tonic+10),quality:'major',voicing:null};if(v===2&&i%2===0)return{...c,root:pc(ctx.tonic+8),quality:'major7',voicing:null};}
  else {if(v===0&&degree===0)return{...c,quality:'major',voicing:null};if(v===1&&i%2===0)return{...c,root:pc(ctx.tonic+5),quality:'major',voicing:null};if(v===2&&i%2===0)return{...c,root:ctx.tonic,quality:'major7',voicing:null};}return c;
 });
 if(id==='h-modulate') {
  const target=pc(ctx.tonic+(v===0?7:v===1?(ctx.minor?3:9):2)),minor=v===1?!ctx.minor:ctx.minor;
  chords=endProgression(ctx,v===0?[target+7,target]:[target+2,target+7,target],v===0?['dominant7',minor?'minor':'major']:[minor?'minor7flat5':'minor7','dominant7',minor?'minor':'major']);
  ctx.target.tonalTarget={root:target,scale:minor?'minor':'major',status:'proposal',label:names[target]};
  ctx.warnings.push('主旋律を固定した転調候補です。新しいKeyとメロディの関係を確認し、必要ならDAW側で調整してください。転調成立の自動判定はしません。');
 }
 if(id==='h-common') {const note=melodyAnchor(ctx,chords[0]),offset=[0,4,14][v];chords=chords.map((c,i)=>({...c,root:pc(note-offset+(i%2===1?0:0)),quality:v===2?'major9':i%2?'dominant7':'major7',voicing:null}));ctx.target.commonTone=pc(note);}
 if(id==='h-voicing')chords=chords.map((c,i)=>chordShape(c,['close','open','low','high','rootless'][v],i));
 if(id==='h-topline') {
  const top=72+pc(melodyAnchor(ctx,chords[0]));
  chords=chords.map((c,i)=>{const pcs=chordPC(c),pitch=nearest(top+(v===0?i*2:v===1?-i*2:0),pcs,60,100);const lower=pcs.filter(p=>p!==pc(pitch)).map(p=>nearest(pitch-9,[p],36,pitch-1));return{...c,voicing:[...new Set([...lower,pitch])].sort((a,b)=>a-b)};});
 }
 if(id==='h-inner') {
  chords=chords.map((c,i)=>{
   const shape=chordShape(c,'close'),notes=shape.voicing;
   const step=v===0?1:v===1?-1:i%2?1:-1;
   return {...c,voicing:notes.map((p,j)=>j===0||j===notes.length-1?p:clamp(p+step,notes[0]+1,notes.at(-1)-1))};
  });ctx.warnings.push('内声の半音装飾はコード記号の構成音から外れる場合があります。記号は骨格、Voicingは実際の発音として保存。');
 }
 if(id==='h-float') {
  if(v===0){chords=chords.map(c=>({...c,quality:'sus2',voicing:null}));putPart(ctx,'bass',[{pitch:36+ctx.tonic,startTick:ctx.section.startTick,durationTick:ctx.section.endTick-ctx.section.startTick,velocity:76}]);}
  if(v===1)chords=chords.map(c=>({...c,quality:'quartal4',voicing:null}));
  if(v===2)chords=chords.map((c,i)=>({...c,root:pc(original[0].root+i*2),quality:'major7',voicing:null}));
 }
 putChords(ctx,chords,id);ctx.chords=chords;
 return ctx;
}
