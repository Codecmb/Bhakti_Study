(function(global){
  function parseRange(range=''){
    const m=String(range).match(/^(BG|SB|CC)\.([A-Za-z]+\.)?(\d+)(?:\.(\d+))?\s*[–-]\s*(?:\1\.)?(?:([A-Za-z]+)\.)?(\d+)(?:\.(\d+))?$/i);
    if(!m)return null;
    const kind=m[1].toUpperCase(), division=(m[2]||'').replace(/\.$/,'').toUpperCase();
    if(kind==='BG')return {kind,division,start:+m[3],end:+m[6]};
    if(kind==='SB')return {kind,canto:+m[3],start:+m[4],end:+m[7]};
    if(kind==='CC')return {kind,division,start:+m[3],end:+m[6]};
    return null;
  }
  function inUnit(ref,unit){
    ref=String(ref||'').toUpperCase();
    const r=parseRange(unit?.range||'');
    if(r?.kind==='BG'){const m=ref.match(/^BG\.(\d+)\./);return !!m&&+m[1]>=r.start&&+m[1]<=r.end}
    if(r?.kind==='SB'){const m=ref.match(/^SB\.(\d+)\.(\d+)\./);return !!m&&+m[1]===r.canto&&+m[2]>=r.start&&+m[2]<=r.end}
    if(r?.kind==='CC'){const m=ref.match(/^CC\.([A-Z]+)\.(\d+)\./);return !!m&&m[1]===r.division&&+m[2]>=r.start&&+m[2]<=r.end}
    if(unit?.book==='iso'||unit?.books?.includes('iso'))if(/^ISO\.\d+$/i.test(ref))return true;
    if(unit?.book==='noi'||unit?.books?.includes('noi'))if(/^NOI\.\d+$/i.test(ref))return true;
    if(unit?.book==='nod'||unit?.books?.includes('nod'))if(/^NOD\.\d+$/i.test(ref))return true;
    return false;
  }
  function nonEmpty(type,filter=()=>true){return StudentStore.entries(type).filter(x=>filter(x)&&String(x.value||'').trim()!=='')}
  function completionConfig(course){return course?.academyUnitCompletion||{enabled:false,requirements:[]}}
  function requirementState(programId,unit,course){
    const config=completionConfig(course), assessmentId=`${programId}.${unit.id}`;
    const assessment=StudentStore.getJSON('assessment',assessmentId,{})||{};
    const requirements=(config.requirements||[]).map(r=>({...r,checked:!!assessment[r.id]}));
    return {config,assessmentId,assessment,requirements,checked:requirements.filter(r=>r.checked).length,total:requirements.length,all:!!config.enabled&&requirements.length>0&&requirements.every(r=>r.checked)};
  }
  function unitSummary(programId,unit,course={}){
    const req=requirementState(programId,unit,course);
    const reading=nonEmpty('reading',x=>inUnit(x.id,unit)).length;
    const reflections=nonEmpty('reflection',x=>inUnit(x.id,unit)).length;
    const understandings=nonEmpty('understanding',x=>x.id.startsWith(`${programId}.`)&&(x.id.includes(`.${unit.id}.`)||inUnit(x.id.split('.')[1]||'',unit))).length;
    const notes=nonEmpty('notes',x=>x.id.startsWith(`${programId}.`)&&(x.id.includes(`.${unit.id}.`)||[...StudentStore.entries('reading')].some(r=>x.id.includes(r.id)&&inUnit(r.id,unit)))).length;
    const answered=nonEmpty('question-answer',x=>{
      if(!x.id.startsWith(`${programId}.`))return false;

      const meta=StudentStore.getJSON('question-meta',x.id,{})||{};

      if(meta.unit===unit.id)return true;

      const refs=[
        meta.canonical_ref,
        ...(Array.isArray(meta.canonical_sources)
          ? meta.canonical_sources
          : [])
      ].filter(Boolean);

      return refs.some(ref=>inUnit(ref,unit));
    }).length;
    const storedComplete=StudentStore.get('completion',req.assessmentId,'')==='1'||localStorage.getItem('bhakti-study.complete.'+unit.id)==='1';
    const complete=req.config.enabled?storedComplete&&req.all:false;
    return {unitId:unit.id,title:unit.title,complete,completionEnabled:!!req.config.enabled,assessmentChecks:req.checked,assessmentTotal:req.total,reading,reflections,understandings,notes,answered};
  }
  function programSummary(programId,units=[],course={}){
    const rows=units.map(u=>unitSummary(programId,u,course));
    const trackable=rows.filter(x=>x.completionEnabled),complete=trackable.filter(x=>x.complete).length,total=trackable.length;
    return {programId,total,complete,pct:total?Math.round(complete/total*100):0,completionEnabled:total>0,units:rows,
      reading:nonEmpty('reading').length,reflections:nonEmpty('reflection').length,
      notes:nonEmpty('notes',x=>x.id.startsWith(programId+'.')).length,
      answered:nonEmpty('question-answer',x=>x.id.startsWith(programId+'.')).length};
  }
  global.ProgressEngine={parseRange,inUnit,completionConfig,requirementState,unitSummary,programSummary};
})(window);
