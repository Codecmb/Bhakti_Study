(function(global){
  const S=global.StudentStore;
  const WORK_TYPES={understanding:'My Understanding',reflection:'Revised Understanding',notes:'Notes',answer:'Answer','my-question':'My Question',assessment:'Assessment'};
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function records(){
    if(!S)return[];
    return S.allEntries().filter(r=>WORK_TYPES[r.type]&&String(r.value??'').trim()).map(r=>({
      ...r,label:WORK_TYPES[r.type],ref:r.id,updated:null
    })).sort((a,b)=>a.ref.localeCompare(b.ref)||a.label.localeCompare(b.label));
  }
  function download(name,type,text){
    const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type}));
    a.download=name;document.body.appendChild(a);a.click();
    setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},500);
  }
  function backup(){
    download(`Bhakti_Study_Student_Backup_${new Date().toISOString().slice(0,10)}.json`,'application/json;charset=utf-8',JSON.stringify(S.exportBackup(),null,2));
  }
  async function restore(file,replace=false){
    const data=JSON.parse(await file.text());return S.importBackup(data,{replace});
  }
  const rtfEsc=s=>String(s??'').replace(/\\/g,'\\\\').replace(/{/g,'\\{').replace(/}/g,'\\}').replace(/\r?\n/g,'\\par\n').replace(/[^\x20-\x7E]/g,ch=>'\\u'+ch.charCodeAt(0)+'?');
  function exportRTF(selected=records(),title='Bhakti Study — Student Portfolio'){
    let body=`{\\rtf1\\ansi\\deff0{\\fonttbl{\\f0 Arial;}}\\fs24\\b ${rtfEsc(title)}\\b0\\par\\par`;
    for(const r of selected){
      body+=`\\b ${rtfEsc(r.ref)} — ${rtfEsc(r.label)}\\b0\\par ${rtfEsc(r.value)}\\par\\par`;
    }
    body+='}';
    download(`Bhakti_Study_Student_Portfolio_${new Date().toISOString().slice(0,10)}.rtf`,'application/rtf',body);
  }
  global.StudentPortfolio={records,backup,restore,exportRTF,esc};
})(window);
