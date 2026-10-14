import { SHEETS as SOURCE_SHEETS } from '../v0.4/sheet_content_v0.4.js';
import { normalizeWorkbook, renderMarkdown, escapeHtml } from '../v0.4/sheet_model_v0.4.js';
import { mountSongDataMenu } from '../../../src/shared/song-data-menu.js';
import { createEmptySongProject, mergeSheetChangesIntoSongProject, parseProjectJsonToSongProject, serializeSongProject, songProjectToDemoProject } from '../../../src/shared/song-project.js';
import { downloadMidiBundle } from '../../../src/midi/midi-export.js';
import { createManualIdea, normalizeManualIdeas, removeManualIdea, updateManualIdea } from './manual_ideas_v0.8.js';

const SHEETS=[...SOURCE_SHEETS.filter(p=>p.id==='01_作曲シート_記入用'),...SOURCE_SHEETS.filter(p=>p.id!=='01_作曲シート_記入用')].map(page=>({...page,group:page.id.includes('/')?'アイデア帳':'制作ガイド'}));
const SHEET_IDS=SHEETS.map(page=>page.id);
let songDataMenu=null;
const $=id=>document.getElementById(id), STORAGE='composition-sheet-full-library-v0.4';
let library={activeId:null,projects:Object.create(null)}, project=createEmptySongProject({sourceApp:'composition-sheet',createdFrom:'new-sheet'}), workbook=normalizeWorkbook(), manualIdeas=[], active=SHEETS[0].id;
let ideaScope='current', editingIdeaId=null;
const message=(text)=>{$('message').textContent=text;};

try {const value=JSON.parse(localStorage.getItem(STORAGE)||'null');if(value?.projects&&typeof value.projects==='object'){library={...value,projects:Object.assign(Object.create(null),value.projects)};if(value.projects[value.activeId])project=parseProjectJsonToSongProject(JSON.stringify(value.projects[value.activeId]));}}catch{message('端末の保存データを読み込めませんでした。バックアップJSONから復元できます。');}

function readWorkbook(){
  const raw=project.compatibility?.compositionSheet?.fullWorkbook;
  workbook=normalizeWorkbook(raw);
  manualIdeas=normalizeManualIdeas(raw?.customIdeas,SHEET_IDS);
  editingIdeaId=null;
}
function fillForm(){
  $('song-title').value=project.title==='Untitled Project'?'':project.title||'';
  $('scene').value=project.intent.scene||'';
  $('reference1').value=(project.intent.references||[]).map(r=>typeof r==='string'?r:[r.artist,r.title].filter(Boolean).join(' / ')).filter(Boolean)[0]||'';
  const form=project.compatibility?.compositionSheet?.fullWorkbook?.form;
  $('bpm').value=form?form.bpm||'':project.basic.bpm;
  $('key').value=form?form.key||'':[project.basic.key,project.basic.scale].join(' ');
}
function snapshot(){
  project=mergeSheetChangesIntoSongProject(project,{title:$('song-title').value.trim()||'名前のない曲',scene:$('scene').value,references:[$('reference1').value].filter(Boolean),bpm:$('bpm').value?Number($('bpm').value):null,key:$('key').value});
  project.compatibility={...project.compatibility,compositionSheet:{...project.compatibility?.compositionSheet,fullWorkbook:{...workbook,customIdeas:manualIdeas,form:{bpm:$('bpm').value,key:$('key').value}}}};
  return project;
}
function save(){
  const ready=Boolean($('scene').value.trim()&&$('reference1').value.trim());
  songDataMenu?.setSaveEnabled(true);songDataMenu?.setMidiEnabled(true);songDataMenu?.setNextEnabled(ready);songDataMenu?.setCurrent($('song-title').value||'名前のない曲');
  try {snapshot();library.activeId=project.projectId;library.projects[project.projectId]=project;localStorage.setItem(STORAGE,JSON.stringify(library));$('save-status').textContent='✓ この端末に保存済み';return true;}
  catch{$('save-status').textContent='保存できません。JSONを保存してください';return false;}
}
function picker(){
  const node=$('project-picker');node.replaceChildren();
  for(const [id,p] of Object.entries(library.projects)){const option=document.createElement('option');option.value=id;option.textContent=p.title||'名前のない曲';option.selected=id===project.projectId;node.append(option);}
}
function renderNav(){
  const group=SHEETS.find(p=>p.id===active).group;
  const pages=SHEETS.filter(p=>p.group===group);
  $('sheet-count').textContent=`${group} · ${pages.length}シート`;
  $('sheet-groups').innerHTML=['制作ガイド','アイデア帳'].map(name=>`<button type="button" data-group="${name}" aria-pressed="${name===group}">${name}</button>`).join('');
  $('sheet-nav').innerHTML=pages.map(p=>`<button type="button" role="tab" id="tab-${SHEETS.indexOf(p)}" aria-controls="sheet-panel" aria-selected="${p.id===active}" tabindex="${p.id===active?'0':'-1'}" data-page="${escapeHtml(p.id)}" class="${p.id===active?'active':''}">${escapeHtml(p.title)}</button>`).join('');
  $('sheet-panel').setAttribute('aria-labelledby',`tab-${SHEETS.findIndex(p=>p.id===active)}`);
}
function patchBassIdea(){
  if(active!=='04_アイデア帳/03_ベース')return;
  const body=$('sheet-body');
  if(!body||body.querySelector('#bass-cardigans-weeknd-v07'))return;
  const section=document.createElement('section');
  section.id='bass-cardigans-weeknd-v07';
  section.innerHTML=`<h2>参考アイデア: The Cardigans / The Weeknd</h2><p>共通して、ベースを単なるルート支えではなく、<strong>裏メロ兼グルーヴ・フック</strong>として使う発想がある。</p><ul><li>音を詰めすぎず、休符や裏拍を使う</li><li>3度・5度・経過音まで使って動く</li><li>短いベースモチーフを反復して曲のキャラクターを作る</li><li>キックと完全に同じ動きにせず、少しずらして会話させる</li><li>The Cardigans寄り: 生ベース的なニュアンス、ポップ / ジャズ寄りのコード感と絡める</li><li>The Weeknd寄り: 80s synth-pop / disco / funk寄りで、反復性の強いグルーヴにする</li></ul><p>作るときは「ルート型」だけで考えず、<strong>グルーヴ型 / 裏メロ型 / フック反復型</strong>として考えると近づけやすい。</p>`;
  body.append(section);
}
function resetIdeaForm(){
  editingIdeaId=null;
  $('manual-idea-title').value='';
  $('manual-idea-text').value='';
  $('manual-idea-submit').textContent='＋ アイデアを追加';
  $('manual-idea-cancel').hidden=true;
}
function renderManualIdeas(){
  const page=SHEETS.find(p=>p.id===active)||SHEETS[0];
  $('manual-idea-sheet').textContent=`追加先：${page.title}`;
  for(const button of document.querySelectorAll('[data-idea-scope]'))button.setAttribute('aria-pressed',String(button.dataset.ideaScope===ideaScope));
  const items=ideaScope==='all'?manualIdeas:manualIdeas.filter(idea=>idea.sheetId===active);
  $('manual-idea-count').textContent=ideaScope==='all'?`全 ${manualIdeas.length}件`:`このシート ${items.length}件 / 全 ${manualIdeas.length}件`;
  const list=$('manual-idea-list');
  if(!items.length){list.innerHTML='<p class="manual-idea-empty">まだアイデアはありません。思いついた一言から追加できます。</p>';return;}
  list.innerHTML=items.map(idea=>{
    const sheet=SHEETS.find(page=>page.id===idea.sheetId);
    return `<article class="manual-idea-card" data-idea-id="${escapeHtml(idea.id)}"><div class="manual-idea-card-head"><div><span class="manual-idea-sheet-name">${escapeHtml(sheet?.title||'シート')}</span><h3>${escapeHtml(idea.title||'無題のアイデア')}</h3></div><div class="manual-idea-actions"><button type="button" data-idea-edit="${escapeHtml(idea.id)}">編集</button><button type="button" data-idea-delete="${escapeHtml(idea.id)}">削除</button></div></div><p>${escapeHtml(idea.text).replace(/\n/g,'<br>')}</p>${ideaScope==='all'&&idea.sheetId!==active?`<button type="button" class="manual-idea-open" data-idea-open-sheet="${escapeHtml(idea.sheetId)}">このシートを開く</button>`:''}</article>`;
  }).join('');
}
function renderPage(){
  const page=SHEETS.find(p=>p.id===active)||SHEETS[0];active=page.id;
  $('sheet-body').innerHTML=renderMarkdown(page,workbook.sheets[active]);$('original-text').textContent=page.markdown;$('page-note').value=workbook.sheets[active].note;
  const index=SHEETS.indexOf(page);$('page-position').textContent=`SHEET ${String(index+1).padStart(2,'0')} / ${SHEETS.length}`;$('previous').disabled=index===0;$('next').disabled=index===SHEETS.length-1;renderNav();patchBassIdea();renderManualIdeas();
}
function go(id){if(!SHEETS.some(p=>p.id===id))return;active=id;history.replaceState(null,'',`#sheet=${encodeURIComponent(id)}`);resetIdeaForm();renderPage();}
function hashPage(){try{const id=decodeURIComponent(location.hash.replace(/^#sheet=/,''));if(SHEETS.some(p=>p.id===id))active=id;}catch{}}
function download(){snapshot();const blob=new Blob([serializeSongProject(project)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`${project.title.replace(/[\\/:*?"<>|]/g,'_')}_composition_sheet_v0.8.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);message('31シートの記入・チェック・メモ・手動アイデアを含むSongProject JSONを保存しました。');}
async function shareForDrive(){
 try{
  save();snapshot();
  const file=new File([serializeSongProject(project)],`${project.title.replace(/[\\/:*?"<>|]/g,'_')}_composition_sheet_v0.8.json.txt`,{type:'text/plain'});
  if(typeof navigator.share!=='function'||(navigator.canShare&&!navigator.canShare({files:[file]}))){download();message('JSONを端末に保存しました。Driveの「＋ → アップロード」から選んでください。');return;}
  await navigator.share({files:[file],title:'作曲シートをDriveに保存'});
  message('共有が完了しました。Google Driveを選んだ場合はDriveへ保存されます。.txtのまま読み込めます。');
 }catch(e){if(e.name==='AbortError')message('共有をキャンセルしました。端末の記入内容は残っています。');else {download();message('共有できなかったためJSONを保存しました。Driveからアップロードしてください。');}}
}

$('sheet-groups').addEventListener('click',e=>{const button=e.target.closest('[data-group]');if(button)go(SHEETS.find(p=>p.group===button.dataset.group).id);});
$('sheet-nav').addEventListener('keydown',e=>{const tabs=[...$('sheet-nav').querySelectorAll('[role=tab]')],index=tabs.indexOf(e.target);if(index<0)return;let next;if(e.key==='ArrowRight'||e.key==='ArrowDown')next=(index+1)%tabs.length;else if(e.key==='ArrowLeft'||e.key==='ArrowUp')next=(index+tabs.length-1)%tabs.length;else if(e.key==='Home')next=0;else if(e.key==='End')next=tabs.length-1;else return;e.preventDefault();const id=tabs[next].dataset.page;go(id);[...$('sheet-nav').querySelectorAll('[role=tab]')].find(t=>t.dataset.page===id)?.focus();});
$('sheet-nav').addEventListener('click',e=>{const button=e.target.closest('[data-page]');if(button){go(button.dataset.page);if(matchMedia('(max-width:820px)').matches)$('sheet-panel').scrollIntoView({block:'start'});}});
$('show-tabs').addEventListener('click',()=>$('sheet-groups').scrollIntoView({block:'start'}));
window.addEventListener('hashchange',()=>{hashPage();resetIdeaForm();renderPage();});
$('previous').addEventListener('click',()=>go(SHEETS[SHEETS.findIndex(p=>p.id===active)-1]?.id));$('next').addEventListener('click',()=>go(SHEETS[SHEETS.findIndex(p=>p.id===active)+1]?.id));
$('sheet-body').addEventListener('input',e=>{const cell=e.target.dataset.cell,check=e.target.dataset.check;if(cell){workbook.sheets[active].cells[cell]=e.target.value;if(active.startsWith('01_')){const label=e.target.closest('tr')?.querySelector('td')?.textContent.trim();const target={'仮タイトル':'song-title','場面':'scene','参考曲1':'reference1'}[label];if(target&&(label==='参考曲1'?cell.endsWith(':1'):cell.endsWith(':2')))$(target).value=e.target.value;}}if(check)workbook.sheets[active].checks[check]=e.target.checked;save();});
$('page-note').addEventListener('input',()=>{workbook.sheets[active].note=$('page-note').value;save();});
for(const id of ['song-title','scene','reference1','bpm','key'])$(id).addEventListener('input',()=>{save();if(id==='song-title')picker();});

$('manual-idea-form').addEventListener('submit',e=>{
  e.preventDefault();
  try{
    if(editingIdeaId) manualIdeas=updateManualIdea(manualIdeas,editingIdeaId,{title:$('manual-idea-title').value,text:$('manual-idea-text').value});
    else manualIdeas=createManualIdea(manualIdeas,{sheetId:active,title:$('manual-idea-title').value,text:$('manual-idea-text').value});
    save();resetIdeaForm();renderManualIdeas();message('手動アイデアをこの曲に保存しました。');
  }catch(error){message(error.message||'アイデアを保存できませんでした。');}
});
$('manual-idea-cancel').addEventListener('click',()=>{resetIdeaForm();renderManualIdeas();});
$('manual-idea-scopes').addEventListener('click',e=>{const button=e.target.closest('[data-idea-scope]');if(!button)return;ideaScope=button.dataset.ideaScope;renderManualIdeas();});
$('manual-idea-list').addEventListener('click',e=>{
  const edit=e.target.closest('[data-idea-edit]'),del=e.target.closest('[data-idea-delete]'),open=e.target.closest('[data-idea-open-sheet]');
  if(open){ideaScope='current';go(open.dataset.ideaOpenSheet);return;}
  if(edit){const idea=manualIdeas.find(item=>item.id===edit.dataset.ideaEdit);if(!idea)return;if(idea.sheetId!==active)go(idea.sheetId);editingIdeaId=idea.id;$('manual-idea-title').value=idea.title;$('manual-idea-text').value=idea.text;$('manual-idea-submit').textContent='変更を保存';$('manual-idea-cancel').hidden=false;$('manual-idea-text').focus();return;}
  if(del){manualIdeas=removeManualIdea(manualIdeas,del.dataset.ideaDelete);if(editingIdeaId===del.dataset.ideaDelete)resetIdeaForm();save();renderManualIdeas();message('手動アイデアを削除しました。');}
});

$('save-now').addEventListener('click',()=>{if(save()){picker();message('この端末に保存しました。端末へJSONを保存するとバックアップできます。');}});
$('drive-save').addEventListener('click',shareForDrive);
$('backup').addEventListener('click',()=>{try{save();download();}catch(e){message(e.message);}});
$('open').addEventListener('click',()=>$('file-input').click());
$('file-input').addEventListener('change',async()=>{
 const file=$('file-input').files?.[0];if(!file)return;
 try{if(file.size>10*1024*1024)throw Error('10MB以下のJSONを選んでください。');const next=parseProjectJsonToSongProject(await file.text());
 if(library.projects[next.projectId]){const old=structuredClone(library.projects[next.projectId]);old.projectId=`${old.projectId}-backup-${Date.now()}`;old.title=`${old.title}（読み込み前）`;library.projects[old.projectId]=old;}
 project=next;readWorkbook();fillForm();save();picker();renderPage();message('JSONを読み込みました。既存の作曲・編曲データと手動アイデアも保持します。');
 }catch(e){message(`読み込めませんでした：${e.message}`);}finally{$('file-input').value='';}
});
$('new-project').addEventListener('click',()=>{save();project=createEmptySongProject({sourceApp:'composition-sheet',createdFrom:'new-sheet'});readWorkbook();fillForm();$('bpm').value='';$('key').value='';save();picker();go(SHEETS[0].id);message('新しい曲を作りました。前の曲は「保存した曲」から開けます。');});
$('project-picker').addEventListener('change',()=>{const id=$('project-picker').value;save();if(library.projects[id]){project=parseProjectJsonToSongProject(JSON.stringify(library.projects[id]));readWorkbook();fillForm();save();picker();renderPage();}});
function handoff(){
 if(!$('scene').value.trim()||!$('reference1').value.trim()){message('受け渡しには「場面」と「参考曲1曲」を入力してください。');return;}
 if($('bpm').value&&(!Number.isInteger(Number($('bpm').value))||Number($('bpm').value)<40||Number($('bpm').value)>240)){message('BPMは40〜240の整数で入力してください。');return;}
 try{save();snapshot();localStorage.setItem('music-project-songproject-handoff-v1',JSON.stringify({kind:'music-project-songproject-handoff',schemaVersion:1,sourceApp:'composition-sheet',targetApp:'demo-composer',createdAt:new Date().toISOString(),songProject:project}));download();location.href=new URL('../../../?handoff=composition-sheet',location.href).href;}
 catch{message('一時受け渡しが使えません。JSONを保存し、Demo Composerで読み込んでください。');}
}
$('handoff').addEventListener('click',handoff);
songDataMenu=mountSongDataMenu({getSheetProject:()=>snapshot(),id:'composition-sheet-full-menu',currentLabel:'名前のない曲',midiEnabled:true,saveEnabled:true,nextEnabled:false,nextLabel:'Demo Composerへ進む',nextNote:'全シートの記入と手動アイデアを含む曲データを渡します',onOpen(){ $('file-input').click(); },onMidi(){downloadMidiBundle(songProjectToDemoProject(snapshot()));return '現在の曲のMIDIを保存しました。';},onSave(){ download(); },onNext(){ handoff(); }});
readWorkbook();fillForm();if(!library.activeId){$('bpm').value='';$('key').value='';}save();picker();hashPage();renderPage();
$('sheet-save-bottom').addEventListener('click',()=>$('save-now').click());
$('sheet-drive-bottom').addEventListener('click',shareForDrive);
