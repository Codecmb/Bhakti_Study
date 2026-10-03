(function(global){
  const S=global.StudentStore;
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function mount(opts){
    if(!S||!opts||!opts.ref||!opts.host)return;
    const host=typeof opts.host==='string'?document.querySelector(opts.host):opts.host;
    if(!host)return;
    document.querySelector('.academy-study-shell')?.remove();
    document.querySelector('.academy-study-fab')?.remove();
    document.querySelector('.academy-study-backdrop')?.remove();

    const ref=opts.ref, unit=(typeof opts.unit==='object'?(opts.unit?.id||''):opts.unit)||'', tools=opts.toolsUrl||'tools.html';
    const draftKey=`bhakti-study:academy-draft:${ref}`;
    let draft={}; try{draft=JSON.parse(sessionStorage.getItem(draftKey)||'{}')}catch{}
    const understanding=draft.understanding??S.get('understanding',ref,'');
    const reflection=draft.reflection??S.get('reflection',ref,'');
    const notes=draft.notes??S.get('notes',ref,'');
    const qs=`${tools}?unit=${encodeURIComponent(unit)}&mode=questions&ref=${encodeURIComponent(ref)}`;
    const myq=`${tools}?unit=${encodeURIComponent(unit)}&mode=my-questions&ref=${encodeURIComponent(ref)}`;

    const shell=document.createElement('aside');
    shell.className='academy-study-shell card';
    shell.innerHTML=`<div class="academy-study-head"><div><div class="eyebrow">Study Workspace</div><h2>${esc(ref)}</h2></div><button class="academy-study-close" type="button" aria-label="Close study workspace">×</button></div>
      <label><strong>My Understanding</strong><textarea id="academyUnderstanding" rows="6" placeholder="Explain this passage in your own words…">${esc(understanding)}</textarea></label>
      <label><strong>Revised Understanding</strong><textarea id="academyReflection" rows="5" placeholder="What changed after further study?">${esc(reflection)}</textarea></label>
      <label><strong>Notes</strong><textarea id="academyNotes" rows="6" placeholder="Personal notes…">${esc(notes)}</textarea></label>
      <div class="academy-study-save"><button class="button" id="academySave" type="button">Save</button><span id="academySaveStatus" class="muted" role="status" aria-live="polite">${Object.keys(draft).length?'Unsaved draft':'Saved'}</span></div>
      <div class="academy-study-links"><a class="button secondary" href="${qs}">Study Questions</a><a class="button secondary" href="${myq}">My Questions</a></div>`;
    // Reuse the existing reading wrapper when navigating between passages.
    // Without this check, every passage change nests another .academy-reading-area
    // inside the previous one, progressively collapsing the source-text pane.
    let area=host.parentElement?.classList?.contains('academy-reading-area')
      ? host.parentElement
      : host.parentElement?.querySelector(':scope > .academy-reading-area');
    if(!area){
      area=document.createElement('div');
      area.className='academy-reading-area';
      host.parentNode.insertBefore(area,host);
      area.appendChild(host);
    }
    area.appendChild(shell);

    const backdrop=document.createElement('button');
    backdrop.className='academy-study-backdrop'; backdrop.type='button'; backdrop.setAttribute('aria-label','Close study workspace');
    document.body.appendChild(backdrop);
    const fab=document.createElement('button');
    fab.className='academy-study-fab button'; fab.type='button'; fab.textContent='Study';
    document.body.appendChild(fab);

    const fields={understanding:'#academyUnderstanding',reflection:'#academyReflection',notes:'#academyNotes'};
    const status=shell.querySelector('#academySaveStatus');
    function capture(){
      const d={}; for(const [k,sel] of Object.entries(fields)) d[k]=shell.querySelector(sel)?.value||'';
      sessionStorage.setItem(draftKey,JSON.stringify(d)); status.textContent='Unsaved changes';
    }
    Object.values(fields).forEach(sel=>shell.querySelector(sel)?.addEventListener('input',capture));
    shell.querySelector('#academySave')?.addEventListener('click',()=>{
      S.set('understanding',ref,shell.querySelector(fields.understanding)?.value||'');
      S.set('reflection',ref,shell.querySelector(fields.reflection)?.value||'');
      S.set('notes',ref,shell.querySelector(fields.notes)?.value||'');
      sessionStorage.removeItem(draftKey); status.textContent='Saved ✓';
    });
    const stateKey='bhakti-study:workspace-open';
    const desktop=()=>window.matchMedia('(min-width:1201px)').matches;
    const open=()=>{
      shell.classList.add('open');
      area.classList.add('study-open');
      if(desktop()) localStorage.setItem(stateKey,'1');
      else backdrop.classList.add('open');
    };
    const close=()=>{
      shell.classList.remove('open');
      area.classList.remove('study-open');
      backdrop.classList.remove('open');
      if(desktop()) localStorage.setItem(stateKey,'0');
    };
    fab.addEventListener('click',open); backdrop.addEventListener('click',close);
    shell.querySelector('.academy-study-close')?.addEventListener('click',close);
    if(desktop()){
      if(localStorage.getItem(stateKey)!=='0') open();
      else close();
    } else {
      close();
    }
  }
  global.AcademyStudyWorkspace={mount};
})(window);
