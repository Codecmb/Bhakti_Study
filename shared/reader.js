sidebar('library');
const qs=new URLSearchParams(location.search), bookId=qs.get('book'), targetRef=qs.get('ref')||'', programId=qs.get('program')||'', unitId=qs.get('unit')||'';
let book,meta,sectionIndex=0,verseIndex=0;
const el={status:document.getElementById('status'),reader:document.getElementById('reader'),bookTitle:document.getElementById('bookTitle'),bookMeta:document.getElementById('bookMeta'),chapters:document.getElementById('chapters'),sectionHeader:document.getElementById('sectionHeader'),verses:document.getElementById('verses'),passage:document.getElementById('passage'),back:document.getElementById('back')};
const cleanText=s=>(s??'').toString().replace(/\\n/g,'\n');
const esc=s=>cleanText(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function noteKey(v){return canonicalOf(v)}
function reflectionLoad(v){const id=noteKey(v),legacy=`bhakti-study.reflection.${id}`;return StudentStore?.migrate?StudentStore.migrate(legacy,'reflection',id)||'':localStorage.getItem(legacy)||''}
function canonicalOf(v){let r=String(v.reference||'');if(meta.canonicalId==='BG')return 'BG.'+r;if(meta.canonicalId?.startsWith('SB.'))return 'SB.'+r;if(meta.canonicalId?.startsWith('CC.')){let m=r.match(/(adi|madhya|antya)\.(\d+)\.(\d+(?:-\d+)?)/i);if(m)return `CC.${m[1].toUpperCase()}.${m[2]}.${m[3]}`}if(meta.canonicalId==='ISO'||meta.canonicalId==='NOI'){let m=r.match(/(\d+)/);if(m)return `${meta.canonicalId}.${m[1]}`}if(meta.canonicalId==='NOD'){if(/^NOD\.(?:Dedication|Preface|Introduction|\d+)$/i.test(v.id||''))return v.id;let m=r.match(/^\s*(\d+)/);if(m)return `NOD.${m[1]}`}return v.id||r}
async function load(){
 if(!bookId){el.status.textContent='No book selected.';return}
 try{
  const catalog=await json('../data/books.json'); meta=catalog.find(b=>b.id===bookId);
  if(!meta||meta.status!=='imported'){el.status.textContent='This book source has not been registered yet.';return}
  book=await json('../'+meta.dataPath); el.bookTitle.textContent=book.title; el.bookMeta.textContent=[book.creator,book.publisher,`Internal source: ${meta.source}`,`Format: ${book.source_format}`].filter(Boolean).join(' · ');
  el.status.hidden=true;el.reader.hidden=false;renderSections(); if(!openTarget()) openSection(0);
 }catch(e){el.status.textContent='Unable to load this book. '+e.message}
}
function openTarget(){if(!targetRef)return false;let want=targetRef.toUpperCase().replace(/Ā/g,'A');for(let si=0;si<book.sections.length;si++){const vs=book.sections[si].verses||[];for(let vi=0;vi<vs.length;vi++){if(canonicalOf(vs[vi]).toUpperCase().replace(/Ā/g,'A')===want){openSection(si,false);openVerse(vi);return true}}}return false}
function renderSections(){el.chapters.innerHTML=book.sections.map((s,i)=>`<button class="chapter-btn" data-i="${i}">${esc(s.title||`Section ${i+1}`)}</button>`).join('');el.chapters.onclick=e=>{let b=e.target.closest('.chapter-btn');if(b)openSection(+b.dataset.i)}}
function openSection(i,first=true){sectionIndex=i;verseIndex=0;[...el.chapters.children].forEach((b,j)=>b.classList.toggle('active',j===i));let s=book.sections[i];el.sectionHeader.innerHTML=`<h2>${esc(s.title)}</h2><p class="small muted">${esc(s.kind||'section')} · ${s.verses?.length||0} study record(s)</p>`;el.verses.innerHTML=(s.verses||[]).map((v,j)=>`<button class="verse-btn" data-i="${j}">${esc(v.reference||v.id||`Text ${j+1}`)}</button>`).join('');el.verses.onclick=e=>{let b=e.target.closest('.verse-btn');if(b)openVerse(+b.dataset.i)};if(first){if(s.verses?.length)openVerse(0);else el.passage.innerHTML='<p>No verse-level record in this section.</p>'}}
function neighbor(delta){let si=sectionIndex,vi=verseIndex+delta;while(si>=0&&si<book.sections.length){let vs=book.sections[si].verses||[];if(vi>=0&&vi<vs.length)return {si,vi,v:vs[vi]};if(delta>0){si++;vi=0}else{si--;if(si>=0)vi=(book.sections[si].verses||[]).length-1}}return null}
function jump(n){if(!n)return;if(n.si!==sectionIndex)openSection(n.si,false);openVerse(n.vi)}

function returnToQuestion(){
 const ctx=window.StudyReturnContext?.get?.(programId);
 if(!ctx || ctx.mode!=='questions' || !ctx.questionId || !ctx.unit)return '';

 const q=new URLSearchParams({
   unit:ctx.unit,
   mode:'questions',
   question:ctx.questionId
 });

 if(ctx.scope && ctx.scope!==ctx.unit)q.set('ref',ctx.scope);

 const tools=`../programs/${encodeURIComponent(programId)}/tools.html`;
 return `<a class="button lotus" href="${tools}?${q.toString()}">← Return to Question</a>`;
}

function renderStudyContext(canonical){
 const host=document.querySelector('#studyContext'); if(!host)return;
 if(programId&&unitId){
   const q=`unit=${encodeURIComponent(unitId)}&ref=${encodeURIComponent(canonical)}`;
   const tools=`../programs/${encodeURIComponent(programId)}/tools.html`;
   host.innerHTML=`<div class="card"><div class="eyebrow">Study this passage</div><div class="action-grid"><a class="button lotus" href="${tools}?${q}&mode=understanding">My Understanding</a><a class="button secondary" href="${tools}?${q}&mode=questions">Study Questions</a><a class="button secondary" href="${tools}?${q}&mode=my-questions">My Questions</a><a class="button secondary" href="${tools}?${q}&mode=notes">Notes</a><a class="button secondary" href="${tools}?${q}&mode=assessment">Assessment</a></div></div>`;
 } else host.innerHTML='';
}

async function openVerse(i){verseIndex=i;let s=book.sections[sectionIndex],v=s.verses[i];[...el.verses.children].forEach((b,j)=>b.classList.toggle('active',j===i));let saved=reflectionLoad(v),prev=neighbor(-1),next=neighbor(1),canonical=canonicalOf(v);
 renderStudyContext(canonical);
 if(window.StudyContext)StudyContext.write({program:programId,unit:unitId,canonical,book:bookId});
 el.passage.innerHTML=`<div class="study-nav">${returnToQuestion()}<span>${prev?'<button id="prevVerse" class="button secondary">← Previous Verse</button>':'<button class="button secondary" disabled>← Previous Verse</button>'}</span>${programId&&unitId?`<a class="button secondary" href="../programs/${encodeURIComponent(programId)}/index.html#${encodeURIComponent(unitId)}">Back to Study Unit</a>`:''}<a class="button secondary" href="../programs/${encodeURIComponent(programId||'bhakti-sastri')}/index.html">↑ Program</a><a class="button secondary" href="../index.html">Academy Home</a>${SourceResolver.external(canonical)?`<a class="button secondary" href="${SourceResolver.external(canonical)}" target="_blank" rel="noopener">Vedabase ↗</a>`:''}${/^BG\.\d+\.\d+$/.test(canonical)?`<a class="button secondary" href="https://vanipedia.org/wiki/ES/${canonical.replaceAll('.', '_')}" target="_blank" rel="noopener">Vanipedia ↗</a>`:''}<span>${next?'<button id="nextVerse" class="button secondary">Next Verse →</button>':'<button class="button secondary" disabled>Next Verse →</button>'}</span></div><div class="eyebrow">Internal Academy Source</div><h2>${esc(canonical)}</h2>${v.source_text?`<h3>Source Text</h3><div class="scripture source-linkable">${esc(v.source_text)}</div>`:''}${v.devanagari?`<h3>Text</h3><div class="scripture">${esc(v.devanagari)}</div>`:''}${v.transliteration?`<h3>Transliteration</h3><div class="scripture">${esc(v.transliteration)}</div>`:''}${v.synonyms?`<h3>Word-for-word</h3><div class="purport source-linkable">${esc(v.synonyms)}</div>`:''}${v.translation?`<h3>Translation</h3><div class="purport source-linkable">${esc(v.translation)}</div>`:''}${v.purport?`<h3>${/Bhaktivedanta Swami Prabhup/i.test(book.creator||'')?"Śrīla Prabhupāda's Purport":'Purport'}</h3><div class="purport source-linkable">${esc(v.purport)}</div>`:''}${v.content?`<div class="purport source-linkable">${esc(v.content)}</div>`:''}<hr><h3>My Understanding</h3><p class="small">Write your own understanding after studying the internal source. This note is stored only in this browser.</p><textarea id="reflection" class="reflection" placeholder="My understanding…">${esc(saved)}</textarea><div class="reader-actions"><button id="saveReflection" class="button secondary">Save reflection</button><button id="markStudied" class="button saffron">Mark passage studied</button><button id="clearReflection" class="button secondary">Clear</button></div><p id="saveMsg" class="small muted"></p>`;
 document.querySelector('#prevVerse')?.addEventListener('click',()=>jump(prev));document.querySelector('#nextVerse')?.addEventListener('click',()=>jump(next));const reflection=document.getElementById('reflection'),saveMsg=document.getElementById('saveMsg'); if(window.VoiceInput)VoiceInput.attach(reflection);
 document.getElementById('saveReflection')?.addEventListener('click',()=>{StudentStore.set('reflection',noteKey(v),reflection.value);saveMsg.textContent='Saved in this browser.'});
 document.getElementById('markStudied')?.addEventListener('click',()=>{StudentStore.set('reading',canonical,'1');saveMsg.textContent=canonical+' marked studied.'});
 document.getElementById('clearReflection')?.addEventListener('click',()=>{reflection.value='';StudentStore.remove('reflection',noteKey(v));saveMsg.textContent='Reflection cleared.'});
 await SourceResolver.linkify(el.passage);
 const keep=new URLSearchParams({book:bookId,ref:canonical});if(programId)keep.set('program',programId);if(unitId)keep.set('unit',unitId);history.replaceState(null,'',`reader.html?${keep.toString()}`);
}
load();
