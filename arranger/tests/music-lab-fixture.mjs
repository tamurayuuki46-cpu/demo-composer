export function fixture(ppq=480) {
 const bar=ppq*4,kinds=['intro','verse','chorus','bridge','chorus','outro'];
 const data={id:'labs',revision:8,basic:{ppq,bpm:120,key:'C',scale:'major'},metadata:{title:'Music lab regression'},structure:{sections:kinds.map((kind,i)=>({id:`s${i}`,kind,name:`${kind}${i}`,bars:4,energy:kind==='chorus'?'high':'mid'}))},chords:[],tracks:['melody','counter','bass','drums'].map(role=>({role,midiChannel:role==='drums'?10:role==='counter'?4:role==='bass'?3:2,notes:[]}))};
 for(let b=0;b<kinds.length*4;b++){
  const root=[5,7,0,9][b%4],quality=['major','dominant7','major','minor'][b%4];data.chords.push({root,quality,startTick:b*bar,durationTick:bar});
  for(let beat=0;beat<4;beat++){
   const tick=b*bar+beat*ppq,pitch=60+root+(beat%2?7:4);
   if(beat<2)data.tracks[0].notes.push({id:`m${b}-${beat}`,pitch,startTick:tick,durationTick:Math.max(1,Math.round(ppq/2)),velocity:96});
   data.tracks[1].notes.push({id:`c${b}-${beat}`,pitch:pitch+1,startTick:tick,durationTick:Math.max(1,Math.round(ppq*.75)),velocity:83});
   data.tracks[2].notes.push({id:`b${b}-${beat}`,pitch:36+root,startTick:tick,durationTick:Math.max(1,Math.round(ppq*.8)),velocity:90});
   data.tracks[3].notes.push({id:`d${b}-${beat}`,pitch:beat%2?38:36,startTick:tick,durationTick:Math.max(1,Math.round(ppq/4)),velocity:90});
  }
 }
 return data;
}
