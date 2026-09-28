(function(){
  const norm=s=>(s||'').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/^\s*(question\s*)?\d+[.)-]?\s*/i,'').replace(/[^a-z0-9\s]/g,' ').replace(/\s+/g,' ').trim();
  const hash=s=>{let h=2166136261;for(const c of s){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return (h>>>0).toString(36)};
  const tokens=s=>new Set(norm(s).split(' ').filter(x=>x.length>2));
  function similarity(a,b){const A=tokens(a),B=tokens(b);if(!A.size||!B.size)return 0;let inter=0;for(const x of A)if(B.has(x))inter++;return inter/(A.size+B.size-inter)}
  function dedupe(items){
    const seenSource=new Set(),seenText=new Map(),out=[],near=[];
    for(const q of items){
      const sk=[q.provider,q.source_url,q.source_question_id].filter(Boolean).join('|');
      if(sk&&seenSource.has(sk))continue;
      if(sk)seenSource.add(sk);
      const n=norm(q.question);if(!n)continue;
      if(seenText.has(n)){
        const prev=seenText.get(n);prev.duplicate_sources=prev.duplicate_sources||[];
        prev.duplicate_sources.push({provider:q.provider,url:q.source_url,id:q.source_question_id});continue;
      }
      const x={...q,id:q.id||`${q.provider||'q'}-${hash((q.canonical_ref||'')+'|'+n)}`};
      for(const prior of out){const score=similarity(prior.question,x.question);if(score>=0.82)near.push({a:prior.id,b:x.id,score:+score.toFixed(3),canonical_ref:x.canonical_ref||prior.canonical_ref||''})}
      seenText.set(n,x);out.push(x);
    }
    return {items:out,near_duplicates:near};
  }
  function scopes(canonical,unit){
    const out=[]; if(canonical){out.push(canonical);const p=canonical.split('.');
      if(p[0]==='BG'&&p.length>=3)out.push(`BG.${p[1]}`);
      if(p[0]==='SB'&&p.length>=4)out.push(`SB.${p[1]}.${p[2]}`);
      if(p[0]==='CC'&&p.length>=4)out.push(`CC.${p[1]}.${p[2]}`);
      if((p[0]==='ISO'||p[0]==='NOI'||p[0]==='NOD')&&p.length>=2)out.push(p[0]);
    }
    if(unit)out.push(unit);return [...new Set(out)];
  }
  function relevant(items,canonical,unit){const ss=scopes(canonical,unit);const rank=r=>{const i=ss.indexOf(r);return i<0?999:i};return items.filter(q=>!q.canonical_ref||ss.includes(q.canonical_ref)).sort((a,b)=>rank(a.canonical_ref)-rank(b.canonical_ref))}
  // Question responses belong to the stable question identity, not to the page/verse
  // from which the learner happened to open the question. This prevents the same
  // chapter/unit question from creating separate answers on adjacent verse pages.
  function storageKey(program,qid){return `bhakti-study.questions.${program}.${qid}`}
  function legacyStorageKey(program,scope,qid){return `bhakti-study.questions.${program}.${scope}.${qid}`}
  function load(program,scope,qid){
    const modern=window.StudentStore?.get('question-answer',`${program}.${qid}`,null);
    if(modern!==null&&modern!==undefined)return modern;
    const stable=localStorage.getItem(storageKey(program,qid));
    if(stable!==null){window.StudentStore?.set('question-answer',`${program}.${qid}`,stable);return stable;}
    // One-way compatibility with checkpoints that stored answers under page scope.
    const legacy=localStorage.getItem(legacyStorageKey(program,scope,qid));
    if(legacy!==null){localStorage.setItem(storageKey(program,qid),legacy);return legacy}
    return '';
  }
  function save(program,scope,qid,value){
    if(window.StudentStore)StudentStore.set('question-answer',`${program}.${qid}`,value);
    else localStorage.setItem(storageKey(program,qid),value);
  }
  window.QuestionEngine={normalize:norm,similarity,dedupe,scopes,relevant,load,save};
})();
