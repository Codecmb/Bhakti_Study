(function(global){
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const BOOK_ALIAS={'sb-1':'sb1','sb-2':'sb2','sb-3':'sb3','sb-4':'sb4','sb-5':'sb5','sb-6':'sb6','sb-7':'sb7','sb-8':'sb8','sb-9':'sb9','sb-10':'sb10','sb-11':'sb11','sb-12':'sb12'};
  function sourceBookHref(unit,canonical,lesson){
    if(canonical)return null;
    const book=lesson?.book||BOOK_ALIAS[unit.book]||unit.book||(unit.books||[])[0];
    if(!book)return null;
    const q=new URLSearchParams({book}); if(lesson?.firstRef)q.set('ref',lesson.firstRef);
    return `../../library/reader.html?${q}`;
  }
  async function init(opts){
    const {programId,dataBase='data/',programHref='index.html'}=opts;
    const q=new URLSearchParams(location.search),mode=q.get('mode')||'understanding',ref=q.get('ref')||'';
    const course=await BhaktiProgramData.loadCourse(dataBase),units=course.units||[];
    const uid=q.get('unit')||units[0]?.id||'',unit=units.find(x=>x.id===uid)||units[0];
    if(!unit)throw new Error('This program has no configured study units.');
    const lesson=(course.lessons?.lessons||course.lessons||[]).find(x=>x.unitId===unit.id);
    const canonical=ref&&(SourceResolver?.canon?.(ref)||ref);
    if(!StudyWorkflow.hasMode(course,mode)){
      const fallback=StudyWorkflow.tools(course).find(t=>t.mode)?.mode||'understanding';
      location.replace(`tools.html?unit=${encodeURIComponent(unit.id)}&mode=${encodeURIComponent(fallback)}${canonical?'&ref='+encodeURIComponent(canonical):''}`);return;
    }
    const ctx={program:programId,unit:unit.id,canonical,mode};
    const sourceTarget=canonical?await SourceResolver.resolve(canonical):null;
    const internalBook=sourceBookHref(unit,canonical,lesson);
    const sourceHref=sourceTarget?.href?(sourceTarget.href+(sourceTarget.kind==='internal'?`&program=${encodeURIComponent(programId)}&unit=${encodeURIComponent(unit.id)}`:'')):(internalBook?`${internalBook}&program=${encodeURIComponent(programId)}&unit=${encodeURIComponent(unit.id)}`:'');
    document.querySelector('#heading').textContent=unit.title;
    document.querySelector('#sub').textContent=`${course.title||programId} · ${unit.id}${canonical?' · '+canonical:''}`;
    document.querySelector('#workflowTabs').innerHTML=StudyWorkflow.tabs(course,ctx);
    const ix=units.findIndex(x=>x.id===unit.id),prev=units[ix-1],next=units[ix+1];
    document.querySelector('#unitNav').innerHTML=`${prev?`<a class="button secondary" href="tools.html?unit=${encodeURIComponent(prev.id)}&mode=${encodeURIComponent(mode)}">← Back</a>`:'<span></span>'}<a class="button secondary" href="${programHref}">↑ Program</a>${next?`<a class="button secondary" href="tools.html?unit=${encodeURIComponent(next.id)}&mode=${encodeURIComponent(mode)}">Forward →</a>`:'<span></span>'}`;
    const content=document.querySelector('#content'),scope=canonical||unit.id,studentId=`${programId}.${scope}.${mode}`;
    const returnSource=sourceHref?`<a class="button secondary" href="${esc(sourceHref)}"${sourceTarget?.kind==='external'?' target="_blank" rel="noopener"':''}>Study the Sources</a>`:'';
    if(mode==='read'){
      content.innerHTML=`<h2>Read Source</h2><p><strong>${esc(unit.range||unit.title)}</strong></p><p>The Academy opens its internal source first. External Vedabase is used only when the requested canonical passage is not available internally.</p>${sourceHref?`<a class="button" href="${esc(sourceHref)}"${sourceTarget?.kind==='external'?' target="_blank" rel="noopener"':''}>${sourceTarget?.kind==='external'?'Open external source ↗':'Open internal source'}</a>`:'<p class="small">No internal source route is configured for this unit yet.</p>'}`;
    }else if(mode==='understanding'){
      const old=`bhakti-study.${programId}.${scope}.${mode}`;StudentStore.migrate(old,mode,studentId);
      content.innerHTML=`<h2>My Understanding</h2><p>Write first, then return to the primary source and revise your understanding.</p><textarea id="entry" class="field" placeholder="What do I understand from this study unit${canonical?' / '+esc(canonical):''}?"></textarea><button id="save" class="button lotus">Save Understanding</button> ${returnSource}<p id="msg" class="small"></p>`;
      entry.value=StudentStore.get(mode,studentId,'');save.onclick=()=>{StudentStore.set(mode,studentId,entry.value);msg.textContent='Saved in this browser.'};
    }else if(mode==='my-questions'){
      MyQuestionsUI.render(content,{program:programId,unit:unit.id,canonical,bookIds:unit.books||[unit.book].filter(Boolean)});
    }else if(mode==='notes'){
      content.innerHTML=`<h2>Notes</h2><p>Notes remain independent of the book files and are attached to ${canonical?'the canonical passage':'this study unit'}.</p><textarea id="entry" class="field" placeholder="Study notes"></textarea><button id="save" class="button">Save Notes</button> ${returnSource}<p id="msg" class="small"></p>`;
      entry.value=StudentStore.get('notes',`${programId}.${scope}`,'');save.onclick=()=>{StudentStore.set('notes',`${programId}.${scope}`,entry.value);msg.textContent='Saved in this browser.'};
    }else if(mode==='questions'){
      let banks=[];
      try{
        banks=await DataRegistry.questionBanks(dataBase);
      }catch(err){
        banks=[];
      }

      if(!banks.length){
        content.innerHTML=`<h2>Study Questions</h2><p>Questions are loaded only from verified, attributed question modules. No questions are invented when a provider/unit has not been mapped.</p><div class="notice">This study area is ready for question banks. No verified question bank is registered yet for <strong>${esc(scope)}</strong>.</div>${returnSource}`;
      }else{
        const requestedBank=q.get('bank');
        const activeBank=(requestedBank&&banks.find(b=>b.id===requestedBank))||banks.find(b=>b.default)||banks[0];
        const scopes=QuestionEngine.scopes(canonical,unit.id);
        let loaded=[];

        try{
          loaded=await DataRegistry.questionShards(dataBase,scopes,activeBank.id);
        }catch(err){
          loaded=[];
        }

        const mapped=QuestionEngine.relevant(loaded,canonical,unit.id);
        const clean=QuestionEngine.dedupe(mapped).items;

        content.innerHTML=`<h2>Study Questions</h2>
          ${canonical?`<p class="small"><strong>Active source:</strong> ${esc(canonical)} · question scopes: ${QuestionEngine.scopes(canonical,unit.id).map(esc).join(' → ')}</p>`:''}
          <div class="notice"><strong>Source-first:</strong> answer from the assigned primary reading. Question providers remain separately attributed.</div>
          <div style="margin:1rem 0">
            <label class="small" for="questionBankSelect"><strong>Question Bank</strong></label>
            <select id="questionBankSelect" class="field">
              ${banks.map(b=>`<option value="${esc(b.id)}"${b.id===activeBank.id?' selected':''}>${esc(b.label||b.id)}</option>`).join('')}
            </select>
            ${activeBank.description?`<p class="small">${esc(activeBank.description)}</p>`:''}
          </div>
          <div id="questionList"></div>
          ${returnSource}
          <p id="msg" class="small"></p>`;

        if(clean.length){
          QuestionManagementUI.render(document.querySelector('#questionList'),{
            program:programId,
            scope,
            questions:clean,
            bank:activeBank
          });

          const save=document.querySelector('#saveQuestions');
          if(save)save.onclick=()=>{
            document.querySelectorAll('.qanswer').forEach(el=>
              QuestionEngine.save(programId,scope,el.dataset.qid,el.value)
            );
            const msg=document.querySelector('#msg');
            if(msg)msg.textContent='Answers saved in this browser.';
          };
        }else{
          document.querySelector('#questionList').innerHTML=`<div class="notice">This question bank is registered, but no verified questions are mapped to <strong>${esc(scope)}</strong> yet.</div>`;
        }

        const selector=document.querySelector('#questionBankSelect');
        if(selector)selector.onchange=()=>{
          const next=new URL(location.href);
          next.searchParams.set('bank',selector.value);
          location.href=next.toString();
        };
      }
    }else if(mode==='assessment'){
      const rules=course['completion-rules']?.academyUnitCompletion;
      if(!rules?.enabled){content.innerHTML=`<h2>Assessment</h2><div class="notice">Academy completion requirements for this program have not been configured yet. Official framework information remains separate and is not converted into Academy requirements automatically.</div>${returnSource}`}
      else content.innerHTML=`<h2>Assessment</h2><p>Assessment requirements are configured by this program's completion-rules module.</p>${returnSource}`;
    }
    if(canonical)StudyContext?.set?.({program:programId,unit:unit.id,canonical});
    SourceResolver.linkify(content);
  }
  global.ProgramWorkspace={init};
})(window);
