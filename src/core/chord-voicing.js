// 少数の音域候補だけ。音符の詳細なボイシング編集はDAWへ渡す。
export function chordVoicingOffset(project) {
  return {lower:-12,center:0,upper:12}[project.instruments?.find(i=>i.part==='chord-voicing')?.preset]??0;
}
