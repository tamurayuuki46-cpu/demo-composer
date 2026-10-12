import { MUSIC_LAB_CATALOG,MUSIC_LAB_CATEGORIES } from './music-lab-catalog.js';
const esc=x=>String(x??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
function button(label,action,id,index){return `<button class="mini secondary" data-action="${action}" data-section="${esc(id)}" data-option="${index}">${label}</button>`;}
export function musicLabControls(source,section,state={}) {
 const id=section.sectionId,category=state.musicCategory||'harmony',methods=MUSIC_LAB_CATALOG.filter(m=>m.category===category);
 const method=methods.find(m=>m.id===state.musicMethod)||methods[0];
 return `<div class="feature-block music-lab"><h4>音楽の中身を変える：50手法</h4>
 <p class="hint">②14手法・③16手法・④15手法・連動5セット。候補は採用するまで曲を変更しません。</p>
 <label class="field"><span>音楽ラボ</span><select data-action="music-category" data-section="${esc(id)}">${Object.entries(MUSIC_LAB_CATEGORIES).map(([key,name])=>`<option value="${key}" ${category===key?'selected':''}>${esc(name)}</option>`).join('')}</select></label>
 <label class="field"><span>試したい変化</span><select data-action="music-method" data-section="${esc(id)}">${methods.map(m=>`<option value="${m.id}" ${method.id===m.id?'selected':''}>${esc(m.label)}</option>`).join('')}</select></label>
 <p>${esc(method.description)}</p>${button('この手法の複数案を作る','music-generate',id,0)}
 ${(state.musicChoices||[]).map((choice,index)=>`<div class="option-card music-choice"><b>${esc(choice.label)}</b><p>${esc(choice.description)}</p>
 ${choice.available?`<p>対象：${choice.affectedSectionIds.map(id=>esc(source.sections.find(s=>s.id===id)?.name||id)).join('・')}</p><p>発音区間 ${choice.stats.before} → ${choice.stats.after}${choice.stats.range?` / MIDI音域 ${choice.stats.range[0]}–${choice.stats.range[1]}`:''}</p>
 ${choice.chords?`<p class="chord-line">${esc(choice.chords)}</p>`:''}
 <div class="feature-actions">${button('元の案を試聴','music-original',id,index)}${button('候補を試聴','music-preview',id,index)}${button('対象Sectionへ採用','music-apply',id,index)}</div>
 <label class="field"><span>この候補のMIDI</span><select data-music-part="${index}" data-section="${esc(id)}"><option value="harmony">Harmony</option><option value="counter">Counter</option><option value="bass">Bass</option><option value="drums">Drums</option><option value="melody">Melody</option><option value="counter-a">裏メロA</option><option value="counter-b">裏メロB</option></select></label>${button('候補MIDIを書き出す','music-midi',id,index)}`:`<p class="attention">${esc(choice.unavailableReason)}</p>`}
 ${choice.warnings.map(w=>`<p class="attention">${esc(w)}</p>`).join('')}</div>`).join('')}
 ${section.musicLab?`<p>採用中：${esc(section.musicLab.label)} / ${esc(section.musicLab.variant)}</p>`:''}
 ${section.voiceRoles?`<p>裏メロA/Bを分担中。Counter.midに加えて個別MIDIを選択できます。</p>`:''}
 <p class="hint">転調やテンションは候補として要試聴。試聴は最初の対象Sectionから最大16秒です。</p></div>`;
}
