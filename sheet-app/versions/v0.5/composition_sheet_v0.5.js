import { SHEETS as SOURCE_SHEETS } from '../v0.4/sheet_content_v0.4.js';
import { normalizeWorkbook, renderMarkdown, escapeHtml } from '../v0.4/sheet_model_v0.4.js';
import { mountSongDataMenu } from '../../../src/shared/song-data-menu.js';
import { createEmptySongProject, mergeSheetChangesIntoSongProject, parseProjectJsonToSongProject, serializeSongProject } from '../../../src/shared/song-project.js';
const SHEETS=SOURCE_SHEETS.map(page=>({...page,group:page.id.includes('/')?'アイデア帳':'制作ガイド'}));
let songDataMenu=null;
const $=id=>document.getElementById(id), STORAGE='composition-sheet-full-library-v0.4';
let library={activeId:null,projects:Object.create(null)}, project=createEmptySongProject({sourceApp:'composition-sheet',createdFrom:'new-sheet'}), workbook=normalizeWorkbook(), active=SHEETS[0].id;
const message=(text)=>{$('message').textContent=text;};
try {const value=JSON.parse(localStorage.getItem(STORAGE)||'null');if(value?.projects&&typeof value.projects==='object'){library={...value,projects:Object.assign(Object.create(null),value.projects)};if(value.projects[value.activeId])project=parseProjectJsonToSongProject(JSON.stringify(value.projects[value.activeId]));}}catch{message('端末の保存データを読み込めませんでした。バックアップJSONから復元できます。');}
function readWorkbook(){workbook=normalizeWorkbook(project.compatibility?.compositionSheet?.fullWorkbook);}
function fillForm(){
  $('song-title').value=project.title==='Untitled Project'?'':project.title||'';
  $('scene').value=project.intent.scene||'';
  $('reference1').value=(project.intent.references||[]).map(r=>typeof r==='string'?r:[r.artist,r.title].filter(Boolean).join(' / ')).filter(Boolean)[0]||'';
  const form=project.compatibility?.compositionSheet?.fullWorkbook?.form;
  $('bpm').value=form?form.bpm||'':project.basic.bpm;
  $('key').value=form?form.key||'':[project.basic.key,project.basic.scale].join(' ');
}
function snapshot(){
  project=mergeSheetChangesIntoSongProject(project,{title:$('song-title').value.trim()||'名前のない曲',scene:$('scene').value, references:[$('reference1').value].filter(Boolean),bpm:$('bpm').value?Number($('bpm').value):null,key:$('key').value});
  project.compatibility={...project.compatibility,compositionSheet:{...project.compatibility?.compositionSheet,fullWorkbook:{...workbook,form:{bpm:$('bpm').value,key:$('key').value}}}};
  return project;
}
function save(){
  const ready=Boolean($('scene').value.trim()&&$('reference1').value.trim());
  songDataMenu?.setSaveEnabled(ready);songDataMenu?.setNextEnabled(ready);songDataMenu?.setCurrent($('song-title').value||'名前のない曲');
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
function renderPage(){
  const page=SHEETS.find(p=>p.id===active)||SHEETS[0];active=page.id;
  $('sheet-body').innerHTML=renderMarkdown(page,workbook.sheets[active]);$('original-text').textContent=page.markdown;$('page-note').value=workbook.sheets[active].note;
  const index=SHEETS.indexOf(page);$('page-position').textContent=`SHEET ${String(index+1).padStart(2,'0')} / ${SHEETS.length}`;$('previous').disabled=index===0;$('next').disabled=index===SHEETS.length-1;renderNav();
}
function go(id){if(!SHEETS.some(p=>p.id===id))return;active=id;history.replaceState(null,'',`#sheet=${encodeURIComponent(id)}`);renderPage();}
function hashPage(){try{const id=decodeURIComponent(location.hash.replace(/^#sheet=/,''));if(SHEETS.some(p=>p.id===id))active=id;}catch{}}
function download(){snapshot();const blob=new Blob([serializeSongProject(project)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`${project.title.replace(/[\\/:*?"<>|]/g,'_')}_composition_sheet_v0.5.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);message('31シートの記入・チェック・メモを含むSongProject JSONを保存しました。');}
$('sheet-groups').addEventListener('click',e=>{const button=e.target.closest('[data-group]');if(button)go(SHEETS.find(p=>p.group===button.dataset.group).id);});
$('sheet-nav').addEventListener('keydown',e=>{const tabs=[...$('sheet-nav').querySelectorAll('[role=tab]')],index=tabs.indexOf(e.target);if(index<0)return;let next;if(e.key==='ArrowRight'||e.key==='ArrowDown')next=(index+1)%tabs.length;else if(e.key==='ArrowLeft'||e.key==='ArrowUp')next=(index+tabs.length-1)%tabs.length;else if(e.key==='Home')next=0;else if(e.key==='End')next=tabs.length-1;else return;e.preventDefault();const id=tabs[next].dataset.page;go(id);[...$('sheet-nav').querySelectorAll('[role=tab]')].find(t=>t.dataset.page===id)?.focus();});
$('sheet-nav').addEventListener('click',e=>{const button=e.target.closest('[data-page]');if(button){go(button.dataset.page);if(matchMedia('(max-width:820px)').matches)$('sheet-panel').scrollIntoView({block:'start'});}});
$('show-tabs').addEventListener('click',()=>$('sheet-groups').scrollIntoView({block:'start'}));
window.addEventListener('hashchange',()=>{hashPage();renderPage();});
$('previous').addEventListener('click',()=>go(SHEETS[SHEETS.findIndex(p=>p.id===active)-1]?.id));$('next').addEventListener('click',()=>go(SHEETS[SHEETS.findIndex(p=>p.id===active)+1]?.id));
$('sheet-body').addEventListener('input',e=>{const cell=e.target.dataset.cell,check=e.target.dataset.check;if(cell){workbook.sheets[active].cells[cell]=e.target.value;if(active.startsWith('01_')){const label=e.target.closest('tr')?.querySelector('td')?.textContent.trim();const target={'仮タイトル':'song-title','場面':'scene','参考曲1':'reference1'}[label];if(target)$(target).value=e.target.value;}}if(check)workbook.sheets[active].checks[check]=e.target.checked;save();});
$('page-note').addEventListener('input',()=>{workbook.sheets[active].note=$('page-note').value;save();});
for(const id of ['song-title','scene','reference1','bpm','key'])$(id).addEventListener('input',()=>{save();if(id==='song-title')picker();});
$('backup').addEventListener('click',()=>{try{save();download();}catch(e){message(e.message);}});
$('open').addEventListener('click',()=>$('file-input').click());
$('file-input').addEventListener('change',async()=>{
 const file=$('file-input').files?.[0];if(!file)return;
 try{if(file.size>10*1024*1024)throw Error('10MB以下のJSONを選んでください。');const next=parseProjectJsonToSongProject(await file.text());
 // Save a restore copy when importing a different revision with the same Project ID.
 if(library.projects[next.projectId]){const old=structuredClone(library.projects[next.projectId]);old.projectId=`${old.projectId}-backup-${Date.now()}`;old.title=`${old.title}（読み込み前）`;library.projects[old.projectId]=old;}
 project=next;readWorkbook();fillForm();save();picker();renderPage();message('JSONを読み込みました。既存の作曲・編曲データも保持します。');
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
songDataMenu=mountSongDataMenu({id:'composition-sheet-full-menu',currentLabel:'名前のない曲',saveEnabled:false,nextEnabled:false,nextLabel:'Demo Composerへ進む',nextNote:'全シートの記入を含む曲データを渡します',onOpen(){ $('file-input').click(); },onSave(){ download(); },onNext(){ handoff(); }});
readWorkbook();fillForm();if(!library.activeId){$('bpm').value='';$('key').value='';}save();picker();hashPage();renderPage();
