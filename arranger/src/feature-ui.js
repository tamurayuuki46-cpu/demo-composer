import { THEORY_METHODS, analyzeReharm } from './reharm-theory.js';
const esc=x=>String(x??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
const names=x=>x.length?x.map(esc).join('・'):'なし';
export function theoryDetails(source,sectionId,suggestion) {
 const analysis=analyzeReharm(source,sectionId,suggestion),method=THEORY_METHODS[suggestion.method];
 return `<details class="theory-explanation"><summary>なぜこのコード？・メロディとの関係</summary>
 ${method?`<p><b>しくみ：</b>${esc(method.principle)}</p><p><b>成立条件：</b>${esc(method.condition)}</p><p><b>聴くポイント：</b>${esc(method.exercise)}</p><p class="attention"><b>注意：</b>${esc(method.caution)}</p>`:''}
 <p>${esc(analysis.summary)}</p>${analysis.coverage===null?'':`<p>主旋律が構成音に重なる時間：元 ${analysis.beforeCoverage}% → 候補 ${analysis.coverage}%</p>`}
 ${analysis.rows.slice(0,24).map(row=>`<article class="chord-analysis"><h4>${esc(row.before)} → ${esc(row.after)} ${row.changed?'':'（保持）'}</h4>
 <div class="note-diff"><span>共通：${names(row.common)}</span><span class="added">追加：${names(row.added)}</span><span class="removed">削除：${names(row.removed)}</span></div>
 <details><summary>最寄り構成音への動き</summary><p>${row.motion.map(esc).join('<br>')}</p><p class="hint">音高クラスの最寄り対応です。実際の声部配置や解決を保証する図ではありません。異名同音は#表記に統一しています。</p></details>
 ${row.melodyCount?`<div class="table-scroll"><table><thead><tr><th>主旋律</th><th>元の役割</th><th>候補の役割</th></tr></thead><tbody>${row.melody.map(n=>`<tr><td>${esc(n.name)}${n.strong?'・強拍':''}${n.long?'・長音':''}</td><td>${esc(n.before)}</td><td>${esc(n.after)}${n.attention?'・要試聴':''}${n.semitone?'・構成音と半音接近':''}</td></tr>`).join('')}</tbody></table></div><p class="hint">表示 ${row.melody.length}/${row.melodyCount}音。強拍・長音の非構成音 ${row.attentionCount}音。</p>`:'<p class="hint">このコード区間に主旋律なし。</p>'}
 ${row.bassOutside.length?`<p class="attention">残したベース ${names(row.bassOutside)} は候補の構成音外。分数コードとして成立する場合もあるため聴いて確認。</p>`:''}
 ${row.rootChanged?'<p class="hint">Rootを変更。元BassのNoteは維持しています。</p>':''}</article>`).join('')}
 ${analysis.rows.length>24?'<p>長い進行のため先頭24コードを表示。</p>':''}
 </details>`;
}
function action(label,action,id,extra='',disabled=false) {return `<button class="mini secondary" data-action="${action}" data-section="${esc(id)}" ${extra} ${disabled?'disabled':''}>${label}</button>`;}
export function sectionFeatures(source,candidate,candidates,section,features={}) {
 const id=section.sectionId,original=source.sections.find(s=>s.id===id);
 const theory=features.theory||[],counter=features.counter||[],chorus=features.chorus||[],subtract=features.subtract||[];
 return `<details class="section-workshop" ${features.open?'open':''}><summary>Sectionの編曲ラボ・7つの機能</summary>
 <div class="feature-block"><h4>Section別の候補採用</h4><p class="hint">このSectionだけ、別案の密度・楽器・リハモ・裏メロ設定をコピーします。</p>
 <label class="field"><span>採用元</span><select data-section-field="donor" data-section="${esc(id)}">${candidates.map((c,index)=>`<option value="${index}">${esc(c.label)}</option>`).join('')}</select></label>${action('このSectionだけ採用','section-adopt',id)}
 ${section.adoptedFrom?`<p>採用元：${esc(section.adoptedFrom)}</p>`:''}</div>
 ${original?.kind==='chorus'?`<div class="feature-block"><h4>サビだけ5案</h4>${action('サビの5案を作る','chorus-show',id)}
 ${chorus.map((c,index)=>`<div class="option-card"><b>${esc(c.label)}</b><p>${esc(c.description)}</p><div class="feature-actions">${action('試聴','chorus-preview',id,`data-option="${index}"`)}${action('このサビへ採用','chorus-apply',id,`data-option="${index}"`)}</div></div>`).join('')}</div>`:''}
 <div class="feature-block"><h4>引き算の編曲</h4>${action('3つの引き算案','subtract-show',id)}
 ${subtract.map((c,index)=>`<div class="option-card"><b>${esc(c.label)}</b><p>${esc(c.reason)}</p><div class="feature-actions">${action('試聴','subtract-preview',id,`data-option="${index}"`)}${action('採用','subtract-apply',id,`data-option="${index}"`)}</div></div>`).join('')}</div>
 <div class="feature-block"><h4>リハモ理論・メロディとの相性</h4><label class="field"><span>試したい手法</span><select data-section-field="method" data-section="${esc(id)}"><option value="all">6手法を比較</option>${Object.entries(THEORY_METHODS).map(([key,m])=>`<option value="${key}" ${features.method===key?'selected':''}>${esc(m.label)}</option>`).join('')}</select></label>
 ${action('理論から候補を作る','theory-show',id)}
 ${theory.map((c,index)=>`<div class="option-card theory-card"><b>${esc(c.label)}</b><p>${esc(c.description)}</p><p class="chord-line">${esc(c.display)}</p>
 ${c.available?`<p>${c.changed}コードを変更</p><div class="feature-actions">${action('元を聴く','theory-preview',id,`data-option="${index}" data-mode="original"`)}${action('候補を聴く','theory-preview',id,`data-option="${index}" data-mode="candidate"`)}${action('3rd・7th・テンション','theory-preview',id,`data-option="${index}" data-mode="guide"`)}${action('残したベース','theory-preview',id,`data-option="${index}" data-mode="bass"`)}${action('リハモを採用','theory-apply',id,`data-option="${index}"`)}</div>`:`<p class="muted">${esc(c.unavailableReason)}</p>`}
 ${theoryDetails(source,id,c)}</div>`).join('')}</div>
 <div class="feature-block"><h4>裏メロのスケール・応答案</h4><p class="hint">元のリズムを保った5案。裏メロがない場合は短い叩き台を生成します。</p>${action('裏メロ5案を作る','counter-show',id)}
 ${counter.map((c,index)=>`<div class="option-card counter-card"><b>${esc(c.label)}</b><p>${esc(c.description)}</p><p>${c.audibleCount}発音区間</p><div class="feature-actions">${action('試聴','counter-preview',id,`data-option="${index}"`)}${action('裏メロへ採用','counter-apply',id,`data-option="${index}"`)}${action('Counter MIDI','counter-midi',id,`data-option="${index}"`)}</div></div>`).join('')}
 ${section.counterArrangement?`<p>採用：${esc(section.counterArrangement.label)}</p>${action('元裏メロへ戻す','counter-clear',id)}`:''}</div>
 <div class="feature-block"><h4>主役の受け渡し・裏メロの休み</h4><div class="feature-actions">${action('主旋律を主役に','lead-apply',id,'data-mode="melody"')}${action('隙間で裏メロへ','lead-apply',id,'data-mode="counter"')}${action('伴奏を主役に','lead-apply',id,'data-mode="harmony"')}${action('休み指定を解除','rest-clear',id)}</div>
 <p>${esc(section.reason||'主旋律を保ち、裏メロの休みと伴奏の出方で主役を決めます。')}</p>
 <p class="hint">現在：${section.restPolicy==='melody-gaps'?'主旋律発音中に裏メロを休ませる':'追加の休み指定なし'}</p></div>
 <label class="field"><span>採用理由・編曲メモ</span><input type="text" maxlength="400" data-action="decision-note" data-section="${esc(id)}" value="${esc(section.decisionNote||'')}" placeholder="例：サビで歌が聞こえやすくなった"></label>
 </details>`;
}
