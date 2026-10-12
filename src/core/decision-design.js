// 人の作曲意図。音の分析や自動生成の設定とは分けて保存する。
export const DESIGN_FIELDS = Object.freeze({ hook: 'この曲のフック', highlight: '一番聴かせたい場所', tension: '緊張 → 解決ポイント', chorus: 'サビで何を変えるか', reference: '参考曲から借りる考え方' });
export const DESIGN_AXES = Object.freeze({ melody: '主旋律', counter: '裏メロ', harmony: 'コード / ハーモニー', rhythm: 'リズム / グルーヴ', sound: '音色' });
export const MELODY_TAGS = Object.freeze(['隣接進行','跳躍','反復','シーケンス','ガイドトーン','経過音','係留音','アプローチノート','リック','コール＆レスポンス']);
export const HARMONY_PURPOSES = Object.freeze(['安定','緊張','浮遊','切なさ','明るさ','意外性','転調感','解決感']);
export const CHECK_STATES = Object.freeze({ undecided: '未決定', decided: '決定・確認済み', unnecessary: '今回は不要' });
export const SECTION_PURPOSES = Object.freeze({ intro: '期待感', verse: '抑える', prechorus: '緊張を上げる', chorus: '解放', bridge: '意外性', interlude: '息継ぎ', outro: '余韻' });
export const DECISION_LIMIT = 1000;
export function defaultDesign() {
  return { hook:'', highlight:'', tension:'', chorus:'', reference:'', axes: {melody:'',counter:'',harmony:'',rhythm:'',sound:''}, tags:{melody:[],counter:[]}, checks:{counter:'undecided',sound:'undecided',contrast:'undecided'}, decisions:[] };
}
const plain = x => x && typeof x === 'object' && !Array.isArray(x);
export function designOf(project) { return project.metadata.composition ?? defaultDesign(); }
export function validateDesign(design) {
  if (!plain(design)) throw new Error('曲の設計メモが不正です。');
  const text = (value, max, label) => { if(typeof value !== 'string' || value.length > max) throw new Error(`${label}は${max}文字以内にしてください。`); };
  for (const key of Object.keys(DESIGN_FIELDS)) text(design[key], 400, DESIGN_FIELDS[key]);
  if(!plain(design.axes) || !plain(design.tags) || !plain(design.checks)) throw new Error('曲の設計情報が不正です。');
  for(const key of Object.keys(DESIGN_AXES)) text(design.axes[key], 200, DESIGN_AXES[key]);
  for(const role of ['melody','counter']) {
    const tags=design.tags[role];
    if(!Array.isArray(tags) || tags.length > MELODY_TAGS.length || new Set(tags).size !== tags.length || tags.some(tag=>!MELODY_TAGS.includes(tag))) throw new Error('分析タグが不正です。');
  }
  for(const key of ['counter','sound','contrast']) if(!Object.hasOwn(CHECK_STATES,design.checks[key])) throw new Error('未決定項目の状態が不正です。');
  if(!Array.isArray(design.decisions) || design.decisions.length > DECISION_LIMIT) throw new Error('採用履歴が不正です。');
  const ids=new Set();
  for(const log of design.decisions) {
    if(!plain(log) || typeof log.id!=='string' || !log.id || ids.has(log.id)) throw new Error('採用履歴IDが不正です。');
    ids.add(log.id);
    text(log.label,160,'採用内容'); text(log.reason,200,'採用理由'); text(log.summary,400,'差分');
    if(!['chord','melody','counter','sound'].includes(log.kind) || !Number.isInteger(log.startBar) || !Number.isInteger(log.endBar) || log.startBar<0 || log.endBar<=log.startBar || log.endBar>128 || typeof log.date!=='string' || !Number.isFinite(Date.parse(log.date))) throw new Error('採用履歴の範囲が不正です。');
  }
  return true;
}
export function appendDecision(project, session, reason='') {
  const design=structuredClone(designOf(project));
  if(design.decisions.length >= DECISION_LIMIT) throw new Error('採用履歴の上限1000件です。project.jsonで保存し、履歴を整理してください。');
  design.decisions.push({id:globalThis.crypto?.randomUUID?.() ?? `decision-${Date.now()}-${Math.random().toString(16).slice(2)}`,date:new Date().toISOString(),kind:session.kind,label:session.label,startBar:session.startBar,endBar:session.endBar,summary:session.summary,reason});
  validateDesign(design);
  return design;
}
export function undecidedItems(project) {
  const d=designOf(project), items=[];
  for(const [key,label] of Object.entries(DESIGN_FIELDS)) if(!d[key].trim()) items.push({id:key,label:`${label}：未記入`});
  for(const [key,label] of [['counter','裏メロの役割'],['sound','音色の方向性'],['contrast','セクション間の変化']]) if(d.checks[key]==='undecided') items.push({id:key,label:`${label}：未確認`});
  for(const section of project.structure?.sections??[]) if(!section.purpose?.trim()) items.push({id:section.id,label:`${section.name}の役割：未決定`});
  const missing=d.decisions.filter(log=>!log.reason.trim()).length;
  if(missing) items.push({id:'reasons',label:`採用理由未記入：${missing}件`});
  return items;
}
