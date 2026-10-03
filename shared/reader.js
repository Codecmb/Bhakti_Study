sidebar('library');
const qs=new URLSearchParams(location.search), bookId=qs.get('book'), targetRef=qs.get('ref')||'', programId=qs.get('program')||'', unitId=qs.get('unit')||'';
let book,meta,sectionIndex=0,verseIndex=0;
const el={status:document.getElementById('status'),reader:document.getElementById('reader'),bookTitle:document.getElementById('bookTitle'),bookMeta:document.getElementById('bookMeta'),chapters:document.getElementById('chapters'),sectionHeader:document.getElementById('sectionHeader'),verses:document.getElementById('verses'),passage:document.getElementById('passage'),back:document.getElementById('back')};
const cleanText=s=>(s??'').toString().replace(/\\n/g,'\n');
const esc=s=>cleanText(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
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
 const ctx=
   window.StudyReturnContext?.get?.(programId) ||
   window.StudyReturnContext?.latest?.();

 if(!ctx?.returnHref)return '';

 return `<a class="button lotus" href="${esc(ctx.returnHref)}">← Return to Question Bank</a>`;
}

function renderStudyContext(canonical){
 const host=document.querySelector('#studyContext');
 if(!host)return;

 const study=programId&&unitId
   ? `<a class="button lotus" href="../programs/${encodeURIComponent(programId)}/tools.html?unit=${encodeURIComponent(unitId)}&ref=${encodeURIComponent(canonical)}&mode=understanding">Study</a>`
   : '';

 const studied=window.StudentStore
   ? `<button id="markPassageStudied" class="button secondary" type="button">Mark passage studied</button>`
   : '';

 host.innerHTML=(study||studied)
   ? `<div class="reader-actions" style="margin:10px 0 18px">${study}${studied}<span id="studyProgressMessage" class="small"></span></div>`
   : '';

 const mark=document.getElementById('markPassageStudied');

 if(mark){
   const already=StudentStore.get('reading',canonical)==='1';

   if(already){
     mark.textContent='✓ Passage studied';
   }

   mark.onclick=()=>{
     StudentStore.set('reading',canonical,'1');
     mark.textContent='✓ Passage studied';

     const message=document.getElementById('studyProgressMessage');
     if(message)message.textContent='Saved to your reading progress.';
   };
 }
}

async function openVerse(i){verseIndex=i;let s=book.sections[sectionIndex],v=s.verses[i];[...el.verses.children].forEach((b,j)=>b.classList.toggle('active',j===i));let prev=neighbor(-1),next=neighbor(1),canonical=canonicalOf(v);
 renderStudyContext(canonical);
 if(window.StudyContext)StudyContext.write({program:programId,unit:unitId,canonical,book:bookId});
 el.passage.innerHTML=`<div class="study-nav">${returnToQuestion()}<span>${prev?'<button id="prevVerse" class="button secondary">← Previous Verse</button>':'<button class="button secondary" disabled>← Previous Verse</button>'}</span>${programId&&unitId?`<a class="button secondary" href="../programs/${encodeURIComponent(programId)}/index.html#${encodeURIComponent(unitId)}">Back to Study Unit</a>`:''}<a class="button secondary" href="../programs/${encodeURIComponent(programId||'bhakti-sastri')}/index.html">↑ Program</a><a class="button secondary" href="../index.html">Academy Home</a>${SourceResolver.external(canonical)?`<a class="button secondary" href="${SourceResolver.external(canonical)}" target="_blank" rel="noopener">Vedabase ↗</a>`:''}${/^BG\.\d+\.\d+$/.test(canonical)?`<a class="button secondary" href="https://vanipedia.org/wiki/ES/${canonical.replaceAll('.', '_')}" target="_blank" rel="noopener">Vanipedia ↗</a>`:''}<span>${next?'<button id="nextVerse" class="button secondary">Next Verse →</button>':'<button class="button secondary" disabled>Next Verse →</button>'}</span></div><div class="eyebrow">Internal Academy Source</div><h2>${esc(canonical)}</h2>${v.source_text?`<h3>Source Text</h3><div class="scripture source-linkable">${esc(v.source_text)}</div>`:''}${v.devanagari?`<h3>Text</h3><div class="scripture">${esc(v.devanagari)}</div>`:''}${v.transliteration?`<h3>Transliteration</h3><div class="scripture">${esc(v.transliteration)}</div>`:''}${v.synonyms?`<h3>Word-for-word</h3><div class="purport source-linkable">${esc(v.synonyms).replace(/\n/g,' ')}</div>`:''}${v.translation?`<h3>Translation</h3><div class="purport source-linkable">${esc(v.translation)}</div>`:''}${v.purport?`<h3>${/Bhaktivedanta Swami Prabhup/i.test(book.creator||'')?"Śrīla Prabhupāda's Purport":'Purport'}</h3><div class="purport source-linkable">${esc(v.purport).replace(/\n/g,' ')}</div>`:''}${v.content?`<div class="purport source-linkable">${esc(v.content)}</div>`:''}`;
 document.querySelector('#prevVerse')?.addEventListener('click',()=>jump(prev));document.querySelector('#nextVerse')?.addEventListener('click',()=>jump(next));
 await SourceResolver.linkify(el.passage);
 const keep=new URLSearchParams({book:bookId,ref:canonical});if(programId)keep.set('program',programId);if(unitId)keep.set('unit',unitId);history.replaceState(null,'',`reader.html?${keep.toString()}`);
}
load();
