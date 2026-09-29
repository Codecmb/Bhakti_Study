(function(){
  const esc=s=>String(s??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]));
  const work=window.SANDARBHA_WORK;
  const ROOT='../../../';
  const prefixes={tattva:'TS',bhagavat:'BGS',paramatma:'PAS',krsna:'KS',bhakti:'BHS',priti:'PS'};
  const legacyKey=id=>`bhakti:sandarbha:${work}:${id}`;
  const loadScript=src=>new Promise((ok,fail)=>{if(window.StudentStore)return ok();const s=document.createElement('script');s.src=src;s.onload=ok;s.onerror=fail;document.head.appendChild(s)});
  const readJSON=async url=>{const r=await fetch(url);if(!r.ok)throw new Error(`${r.status} ${url}`);return r.json()};
  function storeGet(type,id,fallback=''){
    if(window.StudentStore)return StudentStore.get(type,id,fallback);
    const v=localStorage.getItem(`bhakti-study.student.v1.${type}.${id}`);return v===null?fallback:v;
  }
  function storeSet(type,id,value){
    if(window.StudentStore)return StudentStore.set(type,id,value);
    localStorage.setItem(`bhakti-study.student.v1.${type}.${id}`,String(value??''));
  }
  function migrateLegacy(id){
    const old=localStorage.getItem(legacyKey(id));if(!old)return;
    try{const d=JSON.parse(old);if(d.initialUnderstanding&&!storeGet('understanding',id,''))storeSet('understanding',id,d.initialUnderstanding);if(d.revisedUnderstanding&&!storeGet('reflection',id,''))storeSet('reflection',id,d.revisedUnderstanding);if(d.completed)storeSet('completion',`sat-sandarbhas.${id}`,'1')}catch{}
  }
  function canonicalNumber(id){const m=String(id||'').match(/\.(\d+)$/);return m?+m[1]:0}
  async function init(){
    if(!work)throw new Error('Missing SANDARBHA_WORK');
    await loadScript(ROOT+'shared/student-store.js').catch(()=>{});
    const [course,source,registry]=await Promise.all([
      readJSON('course.json'),
      readJSON(`${ROOT}sandarbhas/sources/english-reader/${work}.json`),
      readJSON(`${ROOT}sandarbhas/english-source-registry.json`).catch(()=>({works:[]}))
    ]);
    document.documentElement.lang='en';document.title=course.title;
    const title=document.getElementById('courseTitle');if(title)title.textContent=course.displayTitle||course.title;
    const intro=document.getElementById('courseIntro');if(intro)intro.textContent=`${source.unitCount} canonical anuccheda units · English-first source study · student work stored separately.`;
    const oldNotice=document.querySelector('.notice');if(oldNotice)oldNotice.innerHTML='<b>Method:</b> Viṣaya → Saṁśaya → Pūrvapakṣa → Siddhānta → Pramāṇa → Samanvaya → Application. Source text and student synthesis remain visibly separate.';
    const app=document.getElementById('app');
    if(!document.getElementById('sandarbha-reader-layout')){const style=document.createElement('style');style.id='sandarbha-reader-layout';style.textContent=`.sandarbha-reader-shell{display:grid;grid-template-columns:minmax(0,1fr) minmax(300px,380px);gap:1rem;align-items:start}.sandarbha-study-panel{position:sticky;top:1rem;max-height:calc(100vh - 2rem);overflow:auto}.sandarbha-study-panel textarea{width:100%;box-sizing:border-box}.sandarbha-study-fab,.study-close{display:none}@media(max-width:800px){.sandarbha-reader-shell{display:block}.sandarbha-study-panel{display:none;position:fixed;z-index:1001;inset:auto 0 0 0;top:12vh;max-height:88vh;overflow:auto;border-radius:18px 18px 0 0;margin:0}.sandarbha-study-panel.open{display:block}.sandarbha-study-fab{display:block;position:fixed;z-index:1000;right:1rem;bottom:1rem;box-shadow:0 4px 18px rgba(0,0,0,.2)}.study-close{display:block;float:right;border:0;background:transparent;font-size:2rem;line-height:1;cursor:pointer}}`;document.head.appendChild(style)}
    const sourceByNum=new Map(source.records.map(r=>[r.number,r]));
    const units=course.units||[];
    let selected=Math.max(1,Math.min(source.unitCount,+new URLSearchParams(location.search).get('n')||1));
    function unitFor(n){return units.find(u=>canonicalNumber(u.id)===n)||units[n-1]||{id:`${prefixes[work]}.${n}`,number:n,studyMethod:{advancedLens:[],beforeReading:['What is Jīva Gosvāmī establishing here?'],sourceStudy:['Read the source carefully and identify the claim and evidence.'],afterReading:['State the siddhānta in your own words and cite the supporting source.']}}}
    function render(){
      const r=sourceByNum.get(selected),u=unitFor(selected),id=u.id||`${prefixes[work]}.${selected}`;migrateLegacy(id);
      const verified=!!r?.sourceHeadingVerified&&!!r?.content;
      const draftKey=`bhakti-study:sandarbha-draft:${id}`;
      let draft={};try{draft=JSON.parse(sessionStorage.getItem(draftKey)||'{}')}catch{}
      const before=draft.understanding??storeGet('understanding',id,''),after=draft.reflection??storeGet('reflection',id,''),notes=draft.notes??storeGet('notes',`sat-sandarbhas.${id}`,''),done=storeGet('completion',`sat-sandarbhas.${id}`,'')==='1';
      const lens=u.studyMethod?.advancedLens||[];
      app.innerHTML=`<section class="card"><div class="eyebrow">${esc(course.title)} · English Source Reader</div><div style="display:flex;gap:.6rem;flex-wrap:wrap;align-items:center"><button class="button secondary" id="prev" ${selected<=1?'disabled':''}>← Previous</button><label>Canonical unit <select id="unitSelect">${Array.from({length:source.unitCount},(_,i)=>`<option value="${i+1}" ${i+1===selected?'selected':''}>${esc(prefixes[work])}.${i+1}</option>`).join('')}</select></label><button class="button secondary" id="next" ${selected>=source.unitCount?'disabled':''}>Next →</button></div><h2>${esc(id)} · ${esc(r?.sourceLabel||`Anuccheda ${selected}`)}</h2>${verified?'<span class="source-state verified">English source segment verified</span>':'<p class="notice"><b>Canonical identity preserved.</b> This edition does not expose an independently verified heading boundary for this unit, so Bhakti Study does not invent a source segment.</p>'}${lens.length?`<div class="lens">${lens.map(x=>`<span>${esc(x)}</span>`).join('')}</div>`:''}</section><div class="sandarbha-reader-shell"><main>${verified?`<section class="card"><div class="eyebrow">Primary Study Source</div><h2>Source text</h2><p class="muted">${esc(source.sourceFile)} · English study source · ${esc(id)}</p><div style="white-space:pre-wrap;line-height:1.65">${esc(r.content)}</div></section>`:''}<section class="card"><div class="eyebrow">Provenance</div><p><b>Author:</b> Śrī Jīva Gosvāmī</p><p><b>Study source:</b> ${esc(source.sourceFile)}</p><p><b>Canonical identity:</b> ${esc(id)}</p><p><b>Segmentation:</b> ${verified?'Source heading/boundary independently detected.':'Canonical placeholder only; no source boundary guessed.'}</p><p class="muted">Bhakti Study reflections and summaries are student/application synthesis and are not quotations from the source.</p></section></main><aside class="sandarbha-study-panel card" id="studyPanel"><button class="study-close" id="studyClose" aria-label="Close study panel">×</button><div class="eyebrow">Study Workspace</div><h2>Study</h2><h3>My Understanding</h3><p>${esc(u.studyMethod?.beforeReading?.[0]||'What is Jīva Gosvāmī establishing here?')}</p><textarea id="understanding" rows="6" placeholder="Write your understanding before consulting additional notes…">${esc(before)}</textarea><h3>Source Study</h3><ul>${(u.studyMethod?.sourceStudy||['Identify the principal claim, scriptural evidence, and conclusion.']).map(x=>`<li>${esc(x)}</li>`).join('')}</ul><h3>Revised Understanding</h3><p>${esc(u.studyMethod?.afterReading?.[0]||'State the siddhānta in your own words and cite the supporting source.')}</p><textarea id="reflection" rows="6" placeholder="After returning to the source…">${esc(after)}</textarea><h3>Notes</h3><textarea id="notes" rows="6" placeholder="Personal notes…">${esc(notes)}</textarea><div style="display:flex;gap:.75rem;align-items:center;margin-top:1rem;flex-wrap:wrap"><button class="button" id="saveStudy" type="button">Save</button><span id="saveStatus" class="muted" role="status" aria-live="polite">${Object.keys(draft).length?'Unsaved draft':'Saved'}</span></div><label style="display:block;margin-top:1rem"><input type="checkbox" id="completed" ${done?'checked':''}> Study unit completed</label></aside></div><button class="button sandarbha-study-fab" id="studyOpen" aria-controls="studyPanel">Study</button>`;
      const panel=document.getElementById('studyPanel');document.getElementById('studyOpen')?.addEventListener('click',()=>panel?.classList.add('open'));document.getElementById('studyClose')?.addEventListener('click',()=>panel?.classList.remove('open'));
      const fields=['understanding','reflection','notes'];
      const saveStatus=document.getElementById('saveStatus');
      const captureDraft=()=>{const d={};fields.forEach(f=>d[f]=document.getElementById(f)?.value||'');sessionStorage.setItem(draftKey,JSON.stringify(d));if(saveStatus)saveStatus.textContent='Unsaved changes';};
      fields.forEach(f=>document.getElementById(f)?.addEventListener('input',captureDraft));
      document.getElementById('saveStudy')?.addEventListener('click',()=>{
        storeSet('understanding',id,document.getElementById('understanding')?.value||'');
        storeSet('reflection',id,document.getElementById('reflection')?.value||'');
        storeSet('notes',`sat-sandarbhas.${id}`,document.getElementById('notes')?.value||'');
        sessionStorage.removeItem(draftKey);
        if(saveStatus)saveStatus.textContent='Saved ✓';
      });
      document.getElementById('completed')?.addEventListener('change',e=>storeSet('completion',`sat-sandarbhas.${id}`,e.target.checked?'1':'0'));
      const go=n=>{selected=n;const q=new URLSearchParams(location.search);q.set('n',n);history.replaceState(null,'','?'+q);render();scrollTo({top:0,behavior:'smooth'})};
      document.getElementById('prev')?.addEventListener('click',()=>go(selected-1));document.getElementById('next')?.addEventListener('click',()=>go(selected+1));document.getElementById('unitSelect')?.addEventListener('change',e=>go(+e.target.value));
    }
    render();
    const refBox=document.getElementById('references');if(refBox)refBox.innerHTML='<div class="notice"><b>Internal-first:</b> canonical BG/SB cross-reference linking and the full Study Inspector will attach to this same canonical Sandarbha identity; source text is not duplicated into those systems.</div>';
  }
  init().catch(err=>{const app=document.getElementById('app');if(app)app.innerHTML=`<p class="notice"><b>Sandarbha reader error:</b> ${esc(err.message)}</p>`;console.error(err)});
})();
