import { DESIGN_FIELDS, DESIGN_AXES, MELODY_TAGS, HARMONY_PURPOSES, CHECK_STATES, SECTION_PURPOSES, designOf, undecidedItems } from './decision-design.js';
import { VARIATION_MODES, decisionCandidates } from './decision-candidates.js';
import { createDecisionComparison, comparisonMatches, decisionPreview } from './decision-comparison.js';
import { decisionAnalysis } from './decision-analysis.js';
import { requestAudition } from '../audio/audition.js';
const escape = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clone = value => structuredClone(value);
const MODES_BY_SCREEN = { melody:['last-two','rhythm','pitch'], counter:['counter'], chord:['chord','voicing'], sound:['sound'], hub:[],arrange:[],rhythm:[] };
export function createDecisionSupport({projectStore,rerender,onStop=()=>{},chordPresetCandidate=null,onBeginComparison=()=>{}}) {
  let screen='hub',mode='last-two',startBar=0,bars=1,part='melody',candidates=[],session=null,reason='',message='',lastHeard='';
  const openPanels = new Set();
  const panel = (key, forced = false) => `<details class="decision-details" data-decision-panel="${key}" ${forced || openPanels.has(`${screen}:${key}`) ? 'open' : ''}>`;
  function cancel() { if(session)onStop(); session=null;reason='';lastHeard=''; }
  projectStore.subscribe(project=>{
    candidates=[];
    if(session&&!comparisonMatches(session,project)){cancel();message='現在案が変更されたため比較を閉じました。候補を作り直せます。';}
  });
  const showError=error=>{message=error instanceof Error?error.message:'操作できませんでした。';rerender(screen);};
  function renderDesign(project) {
    const d=designOf(project);
    return `${panel('design')}<summary>曲の設計メモ・5つの個性の軸</summary>
      <p class="hint">言葉で意図を残します。主旋律 × 裏メロ × 音色を中心に、作家名だけに頼らず役割を分けます。</p>
      <form id="decision-design-form">
        ${Object.entries(DESIGN_FIELDS).map(([key,label])=>`<label class="field"><span>${label}</span><textarea data-design-field="${key}" maxlength="400" rows="2">${escape(d[key])}</textarea></label>`).join('')}
        ${Object.entries(DESIGN_AXES).map(([key,label])=>`<label class="field"><span>${label}の方針</span><input data-design-axis="${key}" maxlength="200" value="${escape(d.axes[key])}"></label>`).join('')}
        <button type="submit">設計メモを保存</button>
      </form><p class="hint">参考曲は構造・発想・役割を記録します。既存の自由メモは保持します。project.jsonに保存し、Undoできます。</p>
    </details>`;
  }
  function renderChecklist(project) {
    const d=designOf(project),items=undecidedItems(project);
    return `${panel('checklist')}<summary>未決定項目 ${items.length}件</summary>
      <p class="hint">点数ではありません。音符があっても「決定済み」とは判断しません。不要な要素も明示できます。</p>
      ${items.length?`<ul>${items.map(item=>`<li>${escape(item.label)}</li>`).join('')}</ul>`:'<p>記録した未決定項目はありません。</p>'}
      ${[['counter','裏メロの役割'],['sound','音色の方向性'],['contrast','セクション間の変化']].map(([key,label])=>`<label class="field"><span>${label}</span><select data-decision-check="${key}">${Object.entries(CHECK_STATES).map(([id,label])=>`<option value="${id}" ${d.checks[key]===id?'selected':''}>${label}</option>`).join('')}</select></label>`).join('')}
    </details>`;
  }
  function renderLog(project) {
    const logs=designOf(project).decisions;
    return `${panel('log')}<summary>採用理由・作曲ログ ${logs.length}件</summary><p class="hint">A/B採用時の判断を保存します（上限1000件・表示は最新30件）。ログの小節番号は採用当時の位置です。</p>
      ${logs.length?logs.slice(-30).reverse().map(log=>`<article class="decision-log"><strong>${escape(log.label)}</strong><small>${escape(log.date.slice(0,10))} ・ 当時のBar ${log.startBar+1}〜${log.endBar}</small><p>${escape(log.summary)}</p><label class="field"><span>採用理由（1行）</span><input data-decision-reason="${escape(log.id)}" maxlength="200" value="${escape(log.reason)}" placeholder="なぜこの案を採用したか"></label></article>`).join(''):'<p>まだ採用履歴はありません。</p>'}
    </details>`;
  }
  function renderRoles(project) {
    const sections=project.structure?.sections??[];
    return `${panel('roles')}<summary>セクションの役割</summary><p class="hint">固定の正解ではありません。役割だけを編集し、音符・小節数は変えません。</p>
      ${sections.length?`<form id="decision-section-form">${sections.map(s=>`<label class="field"><span>${escape(s.name)}</span><input data-section-purpose="${escape(s.id)}" maxlength="100" value="${escape(s.purpose)}" placeholder="例：${escape(SECTION_PURPOSES[s.kind])}"></label>`).join('')}<button type="submit">役割を保存</button></form>`:'<p>先にArrangeでセクションを作ってください。</p>'}
    </details>`;
  }
  function renderHarmony(project) {
    const chord=project.chords[startBar];
    return `${panel('harmony')}<summary>このコードを置く目的（感情タグと別）</summary>
      <p class="hint">自動の和声分析とは別に、自分の意図を記録します。音が実際にその印象になるかは試聴して判断します。</p>
      <label class="field"><span>小節</span><select id="decision-purpose-bar">${project.chords.map((_,i)=>`<option value="${i}" ${i===startBar?'selected':''}>Bar ${i+1}</option>`).join('')}</select></label>
      ${chord?`<form id="decision-harmony-form"><div class="decision-tags">${HARMONY_PURPOSES.map(tag=>`<label><input type="checkbox" data-harmony-purpose="${tag}" ${(chord.purposes??[]).includes(tag)?'checked':''}>${tag}</label>`).join('')}</div><button type="submit">目的を保存</button></form>`:'<p>コードを入れると目的を記録できます。</p>'}
    </details>`;
  }
  function renderAnalysis(project,role) {
    const a=decisionAnalysis(project,role),tags=designOf(project).tags[role];
    return `${panel('analysis')}<summary>${role==='counter'?'裏メロ':'主旋律'}の分析タグ</summary>
      <p>${a.notes}音：隣接進行 ${a.steps}回 / 跳躍 ${a.leaps}回 / 同音反復 ${a.repeat}回 / 移高した同型 ${a.sequences}小節</p>
      <p class="hint">隣接進行は1〜2半音、跳躍は3半音以上。既存Analyzerの「4度以上」とは閾値が異なります。シーケンスは3音以上の同じリズム・相対音程を別の高さで反復した候補です。</p>
      ${a.rows.filter(row=>['harmony-role','non-chord-function','phrase-vocabulary'].includes(row.id)).map(row=>`<p><strong>${escape(row.label)}</strong>：${escape(row.value)}<small>${escape(row.comment)}</small></p>`).join('')}
      <p class="hint">リックやコール＆レスポンスは文脈を見て手動でタグ付けします。自動分析は採点せず、係留音などは候補として扱います。</p>
      <form data-analysis-tag-form="${role}"><div class="decision-tags">${MELODY_TAGS.map(tag=>`<label><input type="checkbox" data-analysis-tag="${tag}" ${tags.includes(tag)?'checked':''}>${tag}</label>`).join('')}</div><button type="submit">自分の分析タグを保存</button></form>
    </details>`;
  }
  function renderComparison(project) {
    if(!MODES_BY_SCREEN[screen]?.length)return '';
    const total=Math.max(4,project.chords.length,(project.structure?.sections??[]).reduce((s,x)=>s+x.bars,0),...project.tracks.flatMap(t=>(t.notes??[]).map(n=>Math.ceil((n.startTick+n.durationTick)/(project.basic.ppq*4)))));
    const max=Math.min(128,total);startBar=Math.min(startBar,max-1);bars=Math.min(bars,128-startBar);
    return `${panel('compare', Boolean(session || candidates.length))}<summary>1要素だけ変える → A/B比較</summary>
      <p class="hint">Aは現在案、Bは小さな別案です。試聴だけでは保存しません。詳細編集はCubasis / Cubaseへ渡します。</p>
      <label class="field"><span>変える要素</span><select id="decision-mode">${MODES_BY_SCREEN[screen].map(id=>`<option value="${id}" ${id===mode?'selected':''}>${VARIATION_MODES[id].label}</option>`).join('')}</select></label>
      <div class="decision-grid"><label class="field"><span>開始小節</span><select id="decision-start">${Array.from({length:max},(_,i)=>`<option value="${i}" ${i===startBar?'selected':''}>Bar ${i+1}</option>`).join('')}</select></label>
      <label class="field"><span>比較する長さ</span><select id="decision-bars">${[1,2,4,8].filter(n=>startBar+n<=128).map(n=>`<option value="${n}" ${n===bars?'selected':''}>${n}小節</option>`).join('')}</select></label></div>
      ${mode==='sound'?`<label class="field"><span>音色パート</span><select id="decision-part">${[['melody','主旋律'],['chord','コード'],['bass','ベース']].map(([id,label])=>`<option value="${id}" ${id===part?'selected':''}>${label}</option>`).join('')}</select></label>`:''}
      <button id="decision-generate">小さな別案を作る</button>
      ${screen==='chord' && chordPresetCandidate?'<button id="decision-preset-compare">上で選択したChord PresetとA/B比較</button>':''}
      ${candidates.length?`<div class="decision-candidates">${candidates.map((c,i)=>`<button data-decision-candidate="${i}">${escape(c.label)}<small>${createDecisionComparison(project,c).changed?'現在案と比較':'現在案と同じ音・設定'}</small></button>`).join('')}</div>`:''}
      ${session?`<section class="decision-comparison" aria-label="A/B比較"><h3>A: 現在案 / B: ${escape(session.label)}</h3><p>${escape(session.summary)}</p>${session.detail?.length?`<details><summary>音ごとの差分</summary><ul>${session.detail.slice(0,32).map(text=>`<li>${escape(text)}</li>`).join('')}</ul>${session.detail.length>32?'<p>先頭32件を表示しています。</p>':''}</details>`:''}
      ${session.kind==='chord'?'<p class="hint">Bassは両案の試聴で外します。Bassがある場合、コード採用は保護のため拒否します。</p>':''}
      ${session.kind==='sound'?'<p class="hint">音色・ボイシングの採用は曲全体の対象パートに反映します。コード音域はMIDIにも反映、仮音色はMIDIへ入りません。</p>':'<p class="hint">対象範囲以外・他パート・音色は保持します。</p>'}
      <div class="decision-grid"><button data-decision-play="A" aria-pressed="${lastHeard==='A'}">▶ Aを聴く</button><button data-decision-play="B" aria-pressed="${lastHeard==='B'}">▶ Bを聴く</button></div>
      <label class="field"><span>採用理由（任意の1行）</span><input id="decision-adopt-reason" maxlength="200" value="${escape(reason)}" placeholder="主旋律とぶつからないのでBを採用"></label>
      <div class="decision-grid"><button id="decision-keep">Aを採用・現在案を保持</button><button id="decision-adopt" ${session.changed?'':'disabled'}>Bを採用（↶で戻せる）</button></div><button id="decision-close">比較を閉じる</button></section>`:''}
    </details>`;
  }
  function render(nextScreen) {
    for (const details of document.querySelectorAll('[data-decision-panel]')) {
      const key = `${screen}:${details.dataset.decisionPanel}`;
      if (details.open || details.hasAttribute('open')) openPanels.add(key); else openPanels.delete(key);
    }
    if(nextScreen!==screen){cancel();candidates=[];screen=nextScreen;mode=MODES_BY_SCREEN[screen]?.[0]??'last-two';}
    const project=projectStore.getSnapshot();
    return `<section class="card decision-support"><h2>作曲の判断</h2><p class="status-message" role="status">${escape(message)}</p>
      ${renderComparison(project)}
      ${screen==='hub'?renderDesign(project)+renderChecklist(project)+renderLog(project):''}
      ${screen==='arrange'?renderRoles(project):''}
      ${screen==='chord'?renderHarmony(project):''}
      ${screen==='melody'||screen==='counter'?renderAnalysis(project,screen==='counter'?'counter':'melody'):''}
    </section>`;
  }
  function bind() {
    const query=s=>document.querySelector(s),all=s=>[...document.querySelectorAll(s)];
    const save=(label,action)=>{try{action();message=label;rerender(screen);}catch(error){showError(error);}};
    query('#decision-design-form')?.addEventListener('submit',event=>{event.preventDefault();save('設計メモを保存しました。',()=>{
      const design=clone(designOf(projectStore.getSnapshot()));all('[data-design-field]').forEach(e=>design[e.dataset.designField]=e.value);all('[data-design-axis]').forEach(e=>design.axes[e.dataset.designAxis]=e.value);projectStore.updateDesign(design);
    });});
    all('[data-decision-check]').forEach(select=>select.addEventListener('change',()=>save('未決定項目を更新しました。',()=>{const d=clone(designOf(projectStore.getSnapshot()));d.checks[select.dataset.decisionCheck]=select.value;projectStore.updateDesign(d);})));
    all('[data-decision-reason]').forEach(input=>input.addEventListener('change',()=>save('採用理由を保存しました。',()=>{const d=clone(designOf(projectStore.getSnapshot()));const log=d.decisions.find(l=>l.id===input.dataset.decisionReason);if(!log)throw new Error('履歴が見つかりません。');log.reason=input.value;projectStore.updateDesign(d);})));
    query('#decision-section-form')?.addEventListener('submit',event=>{event.preventDefault();save('セクションの役割を保存しました。',()=>projectStore.updateDecisionAnnotations({sections:all('[data-section-purpose]').map(e=>({id:e.dataset.sectionPurpose,purpose:e.value}))}));});
    query('#decision-purpose-bar')?.addEventListener('change',event=>{cancel();candidates=[];startBar=Number(event.target.value);rerender(screen);});
    query('#decision-harmony-form')?.addEventListener('submit',event=>{event.preventDefault();save('コードを置く目的を保存しました。',()=>projectStore.updateDecisionAnnotations({chords:[{index:startBar,purposes:all('[data-harmony-purpose]').filter(e=>e.checked).map(e=>e.dataset.harmonyPurpose)}]}));});
    all('[data-analysis-tag-form]').forEach(form=>form.addEventListener('submit',event=>{event.preventDefault();save('自分の分析タグを保存しました。',()=>{const d=clone(designOf(projectStore.getSnapshot()));d.tags[form.dataset.analysisTagForm]=[...form.querySelectorAll('[data-analysis-tag]')].filter(e=>e.checked).map(e=>e.dataset.analysisTag);projectStore.updateDesign(d);});}));
    for(const [selector,update] of [['#decision-mode',e=>mode=e.value],['#decision-start',e=>startBar=Number(e.value)],['#decision-bars',e=>bars=Number(e.value)],['#decision-part',e=>part=e.value]])query(selector)?.addEventListener('change',event=>{cancel();candidates=[];update(event.target);rerender(screen);});
    query('#decision-preset-compare')?.addEventListener('click',()=>{try{onBeginComparison();cancel();session=createDecisionComparison(projectStore.getSnapshot(),chordPresetCandidate(projectStore.getSnapshot()));rerender(screen);}catch(error){showError(error);}});
    query('#decision-generate')?.addEventListener('click',()=>{try{cancel();candidates=decisionCandidates(projectStore.getSnapshot(),{mode,startBar,bars:mode==='chord'?1:bars,part});message='候補を選ぶと現在案との比較を開きます。';rerender(screen);}catch(error){showError(error);}});
    all('[data-decision-candidate]').forEach(button=>button.addEventListener('click',()=>{try{const candidate=candidates[Number(button.dataset.decisionCandidate)];onBeginComparison();cancel();session=createDecisionComparison(projectStore.getSnapshot(),candidate);rerender(screen);}catch(error){showError(error);}}));
    query('#decision-adopt-reason')?.addEventListener('input',event=>reason=event.target.value);
    all('[data-decision-play]').forEach(button=>button.addEventListener('click',()=>{if(!session)return;const fixed=session,choice=button.dataset.decisionPlay;requestAudition({label:`${choice}：${fixed.label}`,build:project=>decisionPreview(fixed,project,choice)});lastHeard=choice;rerender(screen);}));
    const keep=()=>{cancel();message='現在案を保持しました。';rerender(screen);};
    query('#decision-keep')?.addEventListener('click',()=>{try{if(session)projectStore.keepDecision(session,reason);keep();}catch(error){showError(error);}});query('#decision-close')?.addEventListener('click',keep);
    query('#decision-adopt')?.addEventListener('click',()=>{try{if(!session)return;onStop();projectStore.adoptDecision(session,reason);cancel();message='Bと採用理由を保存しました。↶でまとめて戻せます。';rerender(screen);}catch(error){showError(error);}});
  }
  return {render,bind,cancel};
}
