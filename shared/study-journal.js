(function(global){
  'use strict';

  const TYPE='study-journal';

  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({
    '&':'&amp;',
    '<':'&lt;',
    '>':'&gt;',
    '"':'&quot;',
    "'":'&#39;'
  }[c]));

  const uid=()=>`journal-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
  const now=()=>new Date().toISOString();

  function normalize(entry={}){
    return {
      id:entry.id||uid(),
      title:entry.title||'',
      program:entry.program||'',
      unit:entry.unit||'',
      book:entry.book||'',
      bookTitle:entry.bookTitle||'',
      section:entry.section||'',
      canonical:entry.canonical||'',
      notes:entry.notes||'',
      tags:Array.isArray(entry.tags)
        ? [...new Set(entry.tags.map(tag=>String(tag).trim()).filter(Boolean))]
        : [],
      questions:Array.isArray(entry.questions)
        ? entry.questions.map(q=>({
            id:q.id||uid(),
            text:q.text||'',
            answer:q.answer||''
          }))
        : [],
      createdAt:entry.createdAt||now(),
      updatedAt:entry.updatedAt||now()
    };
  }

  function save(entry){
    const rec=normalize(entry);
    rec.updatedAt=now();

    if(!global.StudentStore)
      throw new Error('StudentStore is unavailable.');

    StudentStore.setJSON(TYPE,rec.id,rec);
    return rec;
  }

  function get(id){
    if(!global.StudentStore||!id)return null;
    const rec=StudentStore.getJSON(TYPE,id,null);
    return rec?normalize(rec):null;
  }

  function list(){
    if(!global.StudentStore)return [];

    return StudentStore.entries(TYPE)
      .map(item=>{
        try{
          if(item && typeof item==='object' && 'value' in item){
            const value=item.value;
            return normalize(
              typeof value==='string'
                ? JSON.parse(value)
                : value
            );
          }

          return null;
        }catch{
          return null;
        }
      })
      .filter(Boolean)
      .sort((a,b)=>String(b.updatedAt).localeCompare(String(a.updatedAt)));
  }

  function remove(id){
    if(global.StudentStore&&id)
      StudentStore.remove(TYPE,id);
  }

  function addQuestion(entry,text=''){
    const rec=normalize(entry);

    rec.questions.push({
      id:uid(),
      text,
      answer:''
    });

    return rec;
  }

  function cleanName(s){
    return String(s||'Journal')
      .replace(/[^\w.-]+/g,'_')
      .replace(/^_+|_+$/g,'')
      .slice(0,80)||'Journal';
  }

  function download(filename,type,text){
    const blob=new Blob([text],{type});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');

    a.href=url;
    a.download=filename;
    document.body.appendChild(a);
    a.click();
    a.remove();

    setTimeout(()=>URL.revokeObjectURL(url),1000);
  }

  function rtfEsc(s){
    return String(s??'')
      .replace(/\\/g,'\\\\')
      .replace(/{/g,'\\{')
      .replace(/}/g,'\\}')
      .replace(/\r?\n/g,'\\par\n');
  }

  function displayTitle(e){
    return e.title||e.canonical||e.section||e.bookTitle||'Study Journal';
  }

  function exportRTF(entry){
    const e=normalize(entry);

    let body='{\\rtf1\\ansi\\deff0\n';
    body+='{\\fonttbl{\\f0 Arial;}}\n';
    body+='\\fs24\n';

    const heading=t=>{
      body+=`\\par\\b\\fs28 ${rtfEsc(t)}\\b0\\fs24\\par\n`;
    };

    const field=(label,value)=>{
      if(value)
        body+=`\\b ${rtfEsc(label)}:\\b0\\~${rtfEsc(value)}\\par\n`;
    };

    body+='\\b\\fs36 Academia Master Siddhānta Gauḍīya\\b0\\fs24\\par\n';
    body+='Study Journal\\par\\par\n';

    field('Title',displayTitle(e));
    field('Book',e.bookTitle||e.book);

    const exportSection=String(e.section||'')
      .replace(/^(Chapter\\s+\\d+):\\s+\\1:\\s*/i,'$1: ');

    field('Section',exportSection);
    field('Reference',e.canonical);
    field('Study Area',e.program);
    field('Tags',(e.tags||[]).join(', '));

    heading('My Notes');
    body+=(e.notes?rtfEsc(e.notes):'')+'\\par\n';

    heading('My Questions');

    if(!e.questions.length){
      body+='No questions recorded.\\par\n';
    }else{
      e.questions.forEach((q,i)=>{
        body+=`\\par\\b Question ${i+1}:\\b0 ${rtfEsc(q.text)}\\par\n`;
        body+=`\\b My Answer / Working Notes:\\b0 ${rtfEsc(q.answer)}\\par\n`;
      });
    }

    heading('AI Review Instructions');
    body+=rtfEsc(
      'Please review my study notes and questions. Distinguish clearly between what I wrote, what the cited source supports, and any additional explanation you provide. Identify misunderstandings or points that need clarification.'
    );

    body+='}';

    const base=cleanName(displayTitle(e));

    download(
      `Academia_Study_Journal_${base}_${new Date().toISOString().slice(0,10)}.rtf`,
      'application/rtf',
      body
    );
  }

  global.StudyJournal={
    TYPE,
    esc,
    normalize,
    save,
    get,
    list,
    remove,
    addQuestion,
    exportRTF
  };
})(window);
