import { listRecoveries, parseSlotKey, sectionKey, elementKey, getStatus } from '../convergence/index.js';
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export function mountConvergence(session, { changed, preview }) {
  const panel = document.createElement('section');
  panel.id = 'convergence-panel'; panel.className = 'panel'; panel.setAttribute('aria-label', '収束モード Current Plan');
  panel.innerHTML = `<h2>収束モード / Current Plan</h2><p>候補を聴き、全体・Section・個別の順で自分で決めます。</p>
    <p id="convergence-warning" role="alert" hidden></p><div id="convergence-recoveries"></div>
    <div class="convergence-controls"><label>判断する範囲<select id="convergence-scope"><option value="global">全体</option></select></label>
    <label>理由（任意）<select id="convergence-reason"><option value="">理由なし</option><option>余白がある</option><option>主旋律が聴きやすい</option><option>勢いがある</option><option>つながりが自然</option><option>もう一度比較</option></select></label></div>
    <button id="convergence-release" class="secondary" hidden>上書き解除</button>
    <p id="convergence-current-label"></p><div id="convergence-provenance"></div>
    <button id="current-plan-preview" class="secondary">▶ Current Planを試聴</button>
    <p class="hint">収束補助状態はPlan JSONだけでは別端末へ移りません。</p>`;
  document.querySelector('#candidate-tabs').closest('.panel').after(panel);
  const bar = document.createElement('div'); bar.id = 'convergence-bar'; bar.hidden = true;
  bar.innerHTML = `<small id="convergence-target"></small><div><button data-convergence-status="adopted">採用</button><button data-convergence-status="hold" class="secondary">まだ迷う</button><button data-convergence-status="rejected" class="secondary">不採用</button></div>`;
  document.body.append(bar);
  const undo = document.createElement('div'); undo.id = 'convergence-undo'; undo.hidden = true; undo.setAttribute('role', 'status');
  undo.innerHTML = '判断を変更しました <button>元に戻す</button>'; document.body.append(undo);
  const scope = panel.querySelector('#convergence-scope');
  const run = action => { try { action(); changed(); render(); undo.hidden = !session.undo; } catch (error) { session.notify(error.message, true); } };
  scope.addEventListener('change', render);
  bar.addEventListener('click', event => { const status = event.target.closest('[data-convergence-status]')?.dataset.convergenceStatus; if (status) run(() => session.decide(scope.value, status, [panel.querySelector('#convergence-reason').value].filter(Boolean))); });
  panel.querySelector('#convergence-release').addEventListener('click', () => run(() => session.release(scope.value)));
  undo.querySelector('button').addEventListener('click', () => run(() => session.undoDecision()));
  panel.querySelector('#current-plan-preview').addEventListener('click', () => { try { preview(session.current()); } catch (error) { session.notify(error.message, true); } });
  panel.querySelector('#convergence-recoveries').addEventListener('click', event => { const key = event.target.closest('[data-recovery]')?.dataset.recovery; if (key) run(() => session.recover(key)); });
  function render() {
    const active = !!session.validationReady && !!session.selected;
    panel.hidden = !active; bar.hidden = !active; if (!active) { undo.hidden = true; return; }
    const value = scope.value;
    scope.innerHTML = '<option value="global">全体</option>' + session.model.source.sections.map(s => `<option value="${esc(sectionKey(s.id))}">Section: ${esc(s.name)}</option><option value="${esc(elementKey(s.id, 'drums'))}">個別: ${esc(s.name)} / Drums</option><option value="${esc(elementKey(s.id, 'counter'))}">個別: ${esc(s.name)} / 裏メロ</option>`).join('');
    if ([...scope.options].some(o => o.value === value)) scope.value = value;
    panel.querySelector('#convergence-release').hidden = scope.value === 'global';
    const result = session.current({ save: false });
    panel.querySelector('#convergence-current-label').textContent = result.tentativeLabel || 'Current Plan（採用判断を反映）';
    panel.querySelector('#convergence-provenance').innerHTML = result.provenance.map(p => {
      const name = session.model.source.sections.find(s => s.id === p.sectionId)?.name;
      const describe = item => `${{ global: '全体', section: 'Section', element: '個別', default: '仮' }[item.origin]}: ${session.model.candidates.find(c => c.id === item.candidateId)?.label || item.candidateId}`;
      return `<p class="convergence-origin"><strong>${esc(name)}</strong> <small>${esc(describe(p.base))} / Drums ${esc(describe(p.elements.drums))} / 裏メロ ${esc(describe(p.elements.counter))}</small></p>`;
    }).join('');
    const warning = panel.querySelector('#convergence-warning'); warning.hidden = !session.warning; warning.textContent = session.warning || '';
    panel.querySelector('#convergence-recoveries').innerHTML = [...listRecoveries(session.state, Date.now()).map(r => ({ key: r.key, label: `${r.sectionId || '全体'}: 判断の復元候補` })), ...(session.structureOffer ? [{ key: 'structure', label: '元の構成の判断があります' }] : [])].map(r => `<div class="convergence-recovery"><span>${esc(r.label)}</span><button data-recovery="${esc(r.key)}">元の判断のまま採用</button></div>`).join('');
    bar.querySelector('#convergence-target').textContent = `${scope.selectedOptions[0]?.textContent} / ${session.selected.label} / ${{ adopted: '採用', hold: 'まだ迷う', rejected: '不採用', undecided: '未判断' }[getStatus(session.state, scope.value, session.selected.id)]}`;
    undo.hidden = !session.undo;
  }
  async function confirmExport() {
    let result = session.current();
    if (!result.unresolved.length && !session.warning) return true;
    return new Promise(resolve => {
      const dialog = document.createElement('dialog'); dialog.id = 'convergence-export-dialog';
      let warningAcknowledged = !session.warning;
      const finish = ok => { dialog.close(); dialog.remove(); resolve(ok); };
      function draw() {
        result = session.current({ save: false });
        const items = [...new Map(result.unresolved.map(item => [item.key, item])).values()];
        dialog.innerHTML = `<h2>書き出し前の確認</h2>${!warningAcknowledged ? `<p role="alert">${esc(session.warning)}</p><button data-ack>警告を確認して続ける</button>` : ''}
          ${items.map(item => `<div class="convergence-unresolved"><p>${esc(item.sectionId || '全体')} ${esc(item.element || '')}（未決定）</p><button data-lab="${esc(item.key)}">Labで決める</button><button data-daw="${esc(item.key)}">DAWで決める</button></div>`).join('')}
          <button data-continue ${items.length || !warningAcknowledged ? 'disabled' : ''}>書き出す</button><button data-cancel class="secondary">戻る</button>`;
      }
      dialog.addEventListener('cancel', event => { event.preventDefault(); finish(false); });
      dialog.addEventListener('click', event => {
        const b = event.target.closest('button'); if (!b) return;
        if (b.hasAttribute('data-cancel')) finish(false);
        else if (b.hasAttribute('data-continue')) { if (warningAcknowledged && !session.current({ save: false }).unresolved.length) { session.warning = null; render(); finish(true); } }
        else if (b.hasAttribute('data-ack')) { warningAcknowledged = true; draw(); }
        else if (b.dataset.lab) { scope.value = b.dataset.lab; render(); panel.scrollIntoView({ behavior: 'smooth', block: 'center' }); finish(false); }
        else if (b.dataset.daw) { run(() => session.carry(b.dataset.daw)); draw(); }
      });
      document.body.append(dialog); draw(); dialog.showModal();
    });
  }
  return { render, confirmExport };
}
