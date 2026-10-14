import { SHEETS, SOURCE_COMMIT } from './sheet_content_v0.4.js';
export const WORKBOOK_VERSION = 1;
export const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function normalizeWorkbook(value = {}) {
  const sheets = Object.create(null);
  for (const page of SHEETS) {
    const saved = value?.sheets?.[page.id] || {};
    const cells = Object.create(null), checks = Object.create(null);
    for (const [key, text] of Object.entries(saved.cells || {})) if (/^\d+:\d+$/.test(key) && typeof text === 'string') cells[key] = text.slice(0,20000);
    for (const [key, checked] of Object.entries(saved.checks || {})) if (/^\d+$/.test(key) && typeof checked === 'boolean') checks[key] = checked;
    sheets[page.id] = { note: typeof saved.note === 'string' ? saved.note.slice(0,20000) : '', cells, checks };
  }
  return { version: WORKBOOK_VERSION, sourceCommit: SOURCE_COMMIT, sheets };
}
export function inline(text, page) {
  const safe = escapeHtml(text);
  return safe.replace(/`([^`]+)`|\*\*([^*]+)\*\*|\[([^\]]+)\]\((.*?\.md)\)|\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, (_m, code, bold, label, path, webLabel, url) => {
    if (code) return `<code>${code}</code>`;
    if (bold) return `<strong>${bold}</strong>`;
    if (url) return `<a href="${url}" target="_blank" rel="noopener noreferrer">${webLabel}</a>`;
    const segments = page.id.split('/'); segments.pop();
    for (const part of path.split('/')) { if (part === '..') segments.pop(); else if(part !== '.') segments.push(part); }
    const id = segments.join('/').replace(/\.md$/, '');
    return SHEETS.some(p=>p.id===id) ? `<a href="#sheet=${encodeURIComponent(id)}">${label}</a>` : label;
  });
}
const rowCells = (line) => line.trim().replace(/^\||\|$/g, '').split('|').map(x=>x.trim());
export function renderMarkdown(page, saved) {
  const lines=page.markdown.split('\n'); let html='', list='', fence=false, headers=[];
  const closeList=()=>{if(list){html+=`</${list}>`;list='';}};
  for(let i=0;i<lines.length;i++) {
    const line=lines[i];
    if(line.startsWith('```')) {closeList();html+=fence?'</code></pre>':'<pre><code>';fence=!fence;continue;}
    if(fence){html+=escapeHtml(line)+'\n';continue;}
    if(/^\s*\|/.test(line)) {
      closeList();headers=rowCells(line);html+='<div class="table-wrap"><table><thead><tr>'+headers.map(c=>`<th>${inline(c,page)}</th>`).join('')+'</tr></thead><tbody>';
      if(/^\s*\|[\s|:\-]+\|\s*$/.test(lines[i+1]||''))i++;
      while(/^\s*\|/.test(lines[i+1]||'')) {
        i++; const cells=rowCells(lines[i]);
        html+='<tr>'+cells.map((cell,col)=>{
          const key=`${i}:${col}`, label=escapeHtml(`${page.title}・${cells[0]||'自分のアイデア'}・${headers[col]||col+1}`);
          if(!cell) return `<td><textarea data-cell="${key}" aria-label="${label}" placeholder="まだ決めない" maxlength="20000">${escapeHtml(saved.cells[key]||'')}</textarea></td>`;
          if(cell==='低 / 中 / 高')return `<td><select data-cell="${key}" aria-label="${label}">${['','低','中','高'].map(v=>`<option value="${v}"${saved.cells[key]===v?' selected':''}>${v||'未定'}</option>`).join('')}</select></td>`;
          return `<td>${inline(cell,page)}</td>`;
        }).join('')+'</tr>';
      }
      html+='</tbody></table></div>';continue;
    }
    const heading=line.match(/^(#{1,6})\s+(.*)/);
    if(heading){closeList();const n=heading[1].length;html+=`<h${n}>${inline(heading[2].replace(/^\[Claude\]\s*/,''),page)}</h${n}>`;continue;}
    const check=line.match(/^\s*- \[([ xX])\]\s+(.*)/), bullet=line.match(/^\s*[-*]\s+(.*)/), ordered=line.match(/^\s*\d+\.\s+(.*)/);
    if(check||bullet||ordered) {
      const type=ordered?'ol':'ul';if(list!==type){closeList();html+=`<${type}>`;list=type;}
      if(check){const checked=saved.checks[String(i)] ?? check[1].toLowerCase()==='x';html+=`<li class="check-item"><label><input type="checkbox" data-check="${i}"${checked?' checked':''}><span>${inline(check[2],page)}</span></label></li>`;}
      else html+=`<li>${inline((bullet||ordered)[1],page)}</li>`;
      continue;
    }
    closeList(); if(line.trim())html+=`<p>${inline(line,page)}</p>`;
  }
  closeList();return html;
}
export function filteredSheets(query) { const q=query.trim().toLocaleLowerCase();return SHEETS.filter(p=>(p.title+'\n'+p.markdown).toLocaleLowerCase().includes(q)); }
