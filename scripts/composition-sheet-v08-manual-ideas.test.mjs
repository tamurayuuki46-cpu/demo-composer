import assert from 'node:assert/strict';
import { createManualIdea, normalizeManualIdeas, removeManualIdea, updateManualIdea } from '../sheet-app/versions/v0.8/manual_ideas_v0.8.js';

const ids=['01_作曲シート_記入用','04_アイデア帳/03_ベース'];
assert.deepEqual(normalizeManualIdeas(null,ids),[]);
assert.deepEqual(normalizeManualIdeas([{id:'x',sheetId:'unknown',text:'no'}],ids),[]);
let ideas=createManualIdea([],{sheetId:ids[0],title:'サビ前',text:'1拍休む'},{id:'idea-1',now:'2026-10-14T00:00:00.000Z'});
assert.equal(ideas.length,1);assert.equal(ideas[0].title,'サビ前');assert.equal(ideas[0].text,'1拍休む');
ideas=updateManualIdea(ideas,'idea-1',{title:'サビ直前',text:'2拍休んでサビへ'},'2026-10-14T01:00:00.000Z');
assert.equal(ideas[0].title,'サビ直前');assert.equal(ideas[0].updatedAt,'2026-10-14T01:00:00.000Z');
const normalized=normalizeManualIdeas([...ideas,{...ideas[0]},{id:'idea-2',sheetId:ids[1],title:'Bass',text:'裏拍を使う'}],ids);
assert.equal(normalized.length,2);assert.equal(normalized[1].sheetId,ids[1]);
assert.deepEqual(removeManualIdea(normalized,'idea-1').map(x=>x.id),['idea-2']);
assert.throws(()=>createManualIdea([],{sheetId:ids[0],text:'   '}),/アイデア/);
console.log('PASS composition sheet v0.8 manual idea model: normalize/add/edit/delete and validation');
