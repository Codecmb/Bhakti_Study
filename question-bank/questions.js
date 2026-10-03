(async()=>{
  const host=document.getElementById('questionWorkspace');
  const params=new URLSearchParams(location.search);

  const sheetId=params.get('sheet');
  const groupId=params.get('group');
  const sectionParam=params.get('section');
  const ref=params.get('ref');
  const kind=params.get('kind');

  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));

  const PROGRAM_LABELS={
    'bhakti-sastri':'Bhakti Śāstrī',
    'bhakti-vaibhava':'Bhakti Vaibhava',
    'bhakti-vedanta':'Bhakti Vedānta',
    'bhakti-sarvabhauma':'Bhakti Sārvabhauma'
  };

  const BOOK_LABELS={
    bg:'Bhagavad-gītā',
    sb1:'Śrīmad-Bhāgavatam · Canto 1',
    sb2:'Śrīmad-Bhāgavatam · Canto 2',
    sb3:'Śrīmad-Bhāgavatam · Canto 3',
    sb4:'Śrīmad-Bhāgavatam · Canto 4',
    sb5:'Śrīmad-Bhāgavatam · Canto 5',
    sb6:'Śrīmad-Bhāgavatam · Canto 6'
  };

  const KIND_LABELS={
    'closed-book-short':'Closed Book Short',
    'closed-book':'Closed Book Questions',
    'open-book-essay':'Open Book Essays',
    'open-book':'Open Book Questions',
    'study-question':'Study Questions'
  };

  async function loadSheet(){
    const registryResponse=await fetch('../data/question-sheet-registry.json');
    if(!registryResponse.ok){
      throw new Error(`Registry HTTP ${registryResponse.status}`);
    }

    const registry=await registryResponse.json();
    const record=(registry.sheets||[]).find(x=>x.id===sheetId);

    if(!record)throw new Error('Question sheet not found.');

    const dataResponse=await fetch('../'+record.data);
    if(!dataResponse.ok){
      throw new Error(`Question sheet HTTP ${dataResponse.status}`);
    }

    return {record,data:await dataResponse.json()};
  }

  function structured(record,data){
    const sectionIndex=Number(sectionParam);

    if(!groupId || sectionParam===null || !Number.isInteger(sectionIndex)){
      return null;
    }

    const group=data.groups?.find(g=>String(g.chapter)===groupId);
    const section=group?.sections?.[sectionIndex];

    if(!group || !section)return null;

    const scope=`${sheetId}.${groupId}.${sectionIndex}`;

    const questions=section.questions.map((q,i)=>{
      const canonical=q.refs?.[0]||'';

      return QuestionEngine.normalizeRecord({
        id:`${sheetId}.${groupId}.${sectionIndex}.${i+1}`,
        provider:'boex',
        source_question_id:`${groupId}-${sectionIndex+1}-${i+1}`,
        question:q.q,
        canonical_ref:canonical,
        canonical_sources:q.refs||[],
        kind:section.type,
        provenance:{
          title:data.title,
          author:data.provider
        }
      });
    });

    const groupLabel=groupId==='1-6'
      ? 'Bhagavad-gītā 1–6 · Thematic Questions'
      : `Bhagavad-gītā Chapter ${groupId}`;

    return {
      scope,
      questions,
      heading:groupLabel,
      type:section.type
    };
  }

  function flatCanonical(record,data){
    if(!ref || !kind)return null;

    const selected=(data.questions||[]).filter(q=>
      (q.canonical_ref||record.scope||'General')===ref &&
      (q.kind||'study-question')===kind
    );

    if(!selected.length)return null;

    const scope=`${sheetId}.${ref}.${kind}`;

    const questions=selected.map((q,i)=>
      QuestionEngine.normalizeRecord({
        id:q.source_question_id || `${sheetId}.${ref}.${kind}.${i+1}`,
        provider:q.provider || data.provider || 'boex',
        source_question_id:q.source_question_id || `${i+1}`,
        question:q.question,
        canonical_ref:q.canonical_ref || '',
        canonical_sources:q.canonical_sources ||
          (q.canonical_ref && /^SB\.\d+\.\d+/.test(q.canonical_ref)
            ? [q.canonical_ref]
            : []),
        kind:q.kind || kind,
        provenance:q.provenance || {
          title:data.source_title || data.title || sheetId,
          author:data.provider || ''
        }
      })
    );

    const chapterMatch=String(ref).match(/^SB\.(\d+)\.(\d+)$/);

    const heading=chapterMatch
      ? `Śrīmad-Bhāgavatam Canto ${chapterMatch[1]} · Chapter ${chapterMatch[2]}`
      : ref===record.scope
        ? 'Introduction / General'
        : ref;

    return {
      scope,
      questions,
      heading,
      type:KIND_LABELS[kind]||kind
    };
  }

  try{
    if(!sheetId){
      host.innerHTML='<div class="card missing">Question section not found.</div>';
      return;
    }

    const {record,data}=await loadSheet();

    const section=record.adapter==='flat-canonical'
      ? flatCanonical(record,data)
      : structured(record,data);

    if(!section){
      host.innerHTML='<div class="card missing">Question section not found.</div>';
      return;
    }

    const title=data.title||data.source_title||record.id;
    const programLabel=PROGRAM_LABELS[record.program]||record.program;
    const bookLabel=BOOK_LABELS[record.book]||record.book;
    const provenance=data.provider||'Question Bank';

    host.innerHTML=`
      <p>
        <a href="sheet.html?sheet=${encodeURIComponent(sheetId)}">
          ← ${esc(title)}
        </a>
      </p>

      <section class="card">
        <div class="eyebrow">
          ${esc(programLabel)} · ${esc(bookLabel)}
        </div>

        <h1>${esc(section.heading)}</h1>
        <h2>${esc(section.type)}</h2>

        <p class="small">
          ${section.questions.length}
          question${section.questions.length===1?'':'s'}
          · ${esc(provenance)}
        </p>

        <div id="questionList"></div>
        <p id="msg" class="small"></p>
      </section>
    `;

    const list=document.getElementById('questionList');

    QuestionManagementUI.render(list,{
      program:record.program,
      unit:record.scope||'',
      scope:section.scope,
      questions:section.questions,
      bank:{
        id:sheetId,
        label:section.type,
        provenance_label:provenance
      }
    });

    const save=list.querySelector('#saveQuestions');

    if(save){
      save.onclick=()=>{
        list.querySelectorAll('.qanswer').forEach(el=>{
          QuestionEngine.save(
            record.program,
            section.scope,
            el.dataset.qid,
            el.value
          );
        });

        QuestionManagementUI.clearAnswerDrafts?.(
          list,
          {program:record.program,scope:section.scope}
        );

        document.getElementById('msg').textContent=
          'Answers saved in this browser.';
      };
    }

  }catch(error){
    host.innerHTML=
      `<div class="card missing">Could not load questions: ${esc(error.message)}</div>`;
  }
})();
