(function(){
  const norm=s=>(s||'').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/^\s*(question\s*)?\d+[.)-]?\s*/i,'').replace(/[^a-z0-9\s]/g,' ').replace(/\s+/g,' ').trim();
  const hash=s=>{let h=2166136261;for(const c of s){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return (h>>>0).toString(36)};
  const tokens=s=>new Set(norm(s).split(' ').filter(x=>x.length>2));
  const arr=v=>Array.isArray(v)?v.filter(Boolean):(v?[v]:[]);
  function similarity(a,b){const A=tokens(a),B=tokens(b);if(!A.size||!B.size)return 0;let inter=0;for(const x of A)if(B.has(x))inter++;return inter/(A.size+B.size-inter)}
  function normalizeRecord(q={}){
    const provider=q.provider||'academy';
    const canonicalSources=arr(q.canonical_sources||q.refs).map(String);
    if(!canonicalSources.length&&q.canonical_ref&&!/^[A-Z]+\.U\d+$/i.test(q.canonical_ref))canonicalSources.push(q.canonical_ref);
    const provenance=q.provenance||{
      provider,
      title:q.source_title||q.source||'',
      source_file:q.source_file||'',
      source_url:q.source_url||'',
      source_question_id:q.source_question_id||''
    };
    const id=q.id||`${provider}-${hash((q.canonical_ref||'')+'|'+norm(q.question))}`;
    return {...q,id,provider,canonical_sources:[...new Set(canonicalSources)],concepts:arr(q.concepts),study_sources:arr(q.study_sources),provenance};
  }
  function dedupe(items){
    const seenSource=new Set(),seenText=new Map(),out=[],near=[];
    for(const raw of items){
      const q=normalizeRecord(raw),sk=[q.provider,q.source_url,q.source_question_id].filter(Boolean).join('|');
      if(sk&&seenSource.has(sk))continue;if(sk)seenSource.add(sk);
      const n=norm(q.question);if(!n)continue;
      if(seenText.has(n)){const prev=seenText.get(n);prev.duplicate_sources=prev.duplicate_sources||[];prev.duplicate_sources.push({provider:q.provider,url:q.source_url,id:q.source_question_id});continue}
      for(const prior of out){const score=similarity(prior.question,q.question);if(score>=0.82)near.push({a:prior.id,b:q.id,score:+score.toFixed(3),canonical_ref:q.canonical_ref||prior.canonical_ref||''})}
      seenText.set(n,q);out.push(q);
    }
    return {items:out,near_duplicates:near};
  }
  function scopes(canonical,unit){
    const out=[];if(canonical){out.push(canonical);const p=canonical.split('.');
      if(p[0]==='BG'&&p.length>=3)out.push(`BG.${p[1]}`);
      if(p[0]==='SB'&&p.length>=4)out.push(`SB.${p[1]}.${p[2]}`);
      if(p[0]==='CC'&&p.length>=4)out.push(`CC.${p[1]}.${p[2]}`);
      if((p[0]==='ISO'||p[0]==='NOI'||p[0]==='NOD')&&p.length>=2)out.push(p[0]);
    }
    if(unit)out.push(unit);return [...new Set(out)];
  }
  function relevant(items,canonical,unit){const ss=scopes(canonical,unit),rank=r=>{const i=ss.indexOf(r);return i<0?999:i};return items.map(normalizeRecord).filter(q=>!q.canonical_ref||ss.includes(q.canonical_ref)).sort((a,b)=>rank(a.canonical_ref)-rank(b.canonical_ref))}

  // Migrate answers from the retired standalone BG 1–6 BOEX workspace.
  // Legacy:
  //   bhaktiStudy:boex:<chapter>:<section-type>:<zero-based-index>:answer|revised
  // Modern qid:
  //   boex-bg-1-6.<chapter>.<zero-based-section-index>.<one-based-question-number>
  //
  // The section order below is the order in the canonical BOEX JSON.
  // Existing modern work always wins; migration never overwrites it.
  function migrateLegacyBgBoex(){
    if(!window.StudentStore)return;

    const program='bhakti-sastri';
    const sheet='boex-bg-1-6';
    const sectionTypes=[
      'Closed Book Short',
      'Closed Book Questions',
      'Open Book Essays'
    ];

    const chapters=['1','2','3','4','5','6','1-6'];

    chapters.forEach(chapter=>{
      sectionTypes.forEach((type,sectionIndex)=>{
        for(let i=0;i<500;i++){
          const base=`bhaktiStudy:boex:${chapter}:${type}:${i}`;
          const oldAnswer=localStorage.getItem(`${base}:answer`);
          const oldRevision=localStorage.getItem(`${base}:revised`);

          if(oldAnswer===null && oldRevision===null){
            if(i===0)break;
            break;
          }

          const qid=`${sheet}.${chapter}.${sectionIndex}.${i+1}`;
          const wid=`${program}.${qid}`;

          if(oldAnswer!==null &&
             !StudentStore.has('question-answer',wid)){
            StudentStore.set('question-answer',wid,oldAnswer);
          }

          if(oldRevision!==null &&
             !StudentStore.has('question-revision',wid)){
            StudentStore.set('question-revision',wid,oldRevision);
          }
        }
      });
    });
  }

  migrateLegacyBgBoex();

  // Legacy answer API remains intact. Answers belong to stable question identity.
  function storageKey(program,qid){return `bhakti-study.questions.${program}.${qid}`}
  function legacyStorageKey(program,scope,qid){return `bhakti-study.questions.${program}.${scope}.${qid}`}
  function workId(program,qid){return `${program}.${qid}`}
  function saveMeta(program,qid,meta={}){
    if(!window.StudentStore)return;
    const id=workId(program,qid);
    const current=StudentStore.getJSON('question-meta',id,{})||{};
    StudentStore.setJSON('question-meta',id,{
      ...current,
      ...meta,
      program,
      question_id:qid
    });
  }
  function loadMeta(program,qid){
    return window.StudentStore?.getJSON(
      'question-meta',
      workId(program,qid),
      {}
    )||{};
  }
  function load(program,scope,qid){
    const modern=window.StudentStore?.get('question-answer',workId(program,qid),null);
    if(modern!==null&&modern!==undefined)return modern;
    const stable=localStorage.getItem(storageKey(program,qid));
    if(stable!==null){window.StudentStore?.set('question-answer',workId(program,qid),stable);return stable}
    const legacy=localStorage.getItem(legacyStorageKey(program,scope,qid));
    if(legacy!==null){localStorage.setItem(storageKey(program,qid),legacy);window.StudentStore?.set('question-answer',workId(program,qid),legacy);return legacy}
    return '';
  }
  function save(program,scope,qid,value,meta={}){
    if(window.StudentStore){
      StudentStore.set('question-answer',workId(program,qid),value);
      saveMeta(program,qid,{scope,...meta});
    }else{
      localStorage.setItem(storageKey(program,qid),value);
    }
    const state=loadState(program,qid);if(!state.completed)saveState(program,qid,{...state,status:String(value||'').trim()?'answered':'unanswered'});
  }

  // Finite learning lifecycle: answer -> optional guided review -> one revision -> complete.
  // A completed response never starts another remediation cycle automatically.
  function loadState(program,qid){
    const fallback={schema:'bhakti-study.question-work.v1',status:'unanswered',completed:false,completion_reason:'',revision_count:0};
    return window.StudentStore?.getJSON('question-state',workId(program,qid),fallback)||fallback;
  }
  function saveState(program,qid,state){window.StudentStore?.setJSON('question-state',workId(program,qid),state);return state}
  function markUnderstood(program,qid){
    const state=loadState(program,qid);return saveState(program,qid,{...state,status:'complete',completed:true,completion_reason:'understood',completed_at:new Date().toISOString()});
  }
  function beginReview(program,qid){
    const state=loadState(program,qid);if(state.completed)return state;
    return saveState(program,qid,{...state,status:'review',review_started_at:state.review_started_at||new Date().toISOString()});
  }
  function saveRevision(program,qid,value){
    if(window.StudentStore)StudentStore.set('question-revision',workId(program,qid),value);
    const state=loadState(program,qid);
    return saveState(program,qid,{...state,status:'complete',completed:true,completion_reason:'revised',revision_count:1,completed_at:state.completed_at||new Date().toISOString()});
  }
  function loadRevision(program,qid){return window.StudentStore?.get('question-revision',workId(program,qid),'')||''}
  function work(program,scope,qid){
    const answer=load(program,scope,qid),revision=loadRevision(program,qid),state=loadState(program,qid);
    return {answer,revision,...state};
  }

  // Student question management. Canonical question banks remain immutable;
  // personal delete/duplicate decisions are stored as reversible question state.
  function flagDuplicate(program,qid,duplicateOf=''){
    const state=loadState(program,qid);
    return saveState(program,qid,{...state,duplicate:true,duplicate_of:duplicateOf||'',duplicate_flagged_at:new Date().toISOString()});
  }
  function clearDuplicate(program,qid){
    const state=loadState(program,qid);
    const next={...state,duplicate:false,duplicate_of:''};
    delete next.duplicate_flagged_at;
    return saveState(program,qid,next);
  }
  function deleteQuestion(program,qid,question=null){
    const state=loadState(program,qid);
    return saveState(program,qid,{
      ...state,
      deleted:true,
      deleted_at:new Date().toISOString(),
      deleted_question:question?{
        id:qid,
        question:question.question||'',
        canonical_ref:question.canonical_ref||'',
        provider:question.provider||''
      }:(state.deleted_question||null)
    });
  }
  function restoreQuestion(program,qid){
    const state=loadState(program,qid);
    const next={...state,deleted:false};
    delete next.deleted_at;
    return saveState(program,qid,next);
  }
  function deletedQuestions(program){
    if(!window.StudentStore)return [];
    const prefix=program+'.';
    return StudentStore.entries('question-state').flatMap(r=>{
      if(!r.id.startsWith(prefix))return [];
      try{
        const state=JSON.parse(r.value);
        if(!state?.deleted)return [];
        const qid=r.id.slice(prefix.length);
        return [{qid,state,question:state.deleted_question||null}];
      }catch{return []}
    });
  }
  function isDeleted(program,qid){return !!loadState(program,qid).deleted}
  function isDuplicate(program,qid){return !!loadState(program,qid).duplicate}
  function active(items,program){
    return items.map(normalizeRecord).filter(q=>!isDeleted(program,q.id));
  }

  window.QuestionEngine={
    normalize:norm,normalizeRecord,similarity,dedupe,scopes,relevant,
    load,save,saveMeta,loadMeta,work,loadState,markUnderstood,beginReview,loadRevision,saveRevision,
    flagDuplicate,clearDuplicate,deleteQuestion,restoreQuestion,deletedQuestions,isDeleted,isDuplicate,active
  };
})();
