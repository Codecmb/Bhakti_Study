(function(global){
  const PREFIX='bhakti-study.draft.v1';

  function key(id){
    return `${PREFIX}.${id}`;
  }

  function read(id,fallback=''){
    try{
      const value=sessionStorage.getItem(key(id));
      return value===null ? fallback : value;
    }catch{
      return fallback;
    }
  }

  function write(id,value){
    try{
      sessionStorage.setItem(key(id),String(value??''));
    }catch{}
    return value;
  }

  function clear(id){
    try{
      sessionStorage.removeItem(key(id));
    }catch{}
  }

  function attach({id,field,status,onSave}){
    if(!id || !field)return null;

    const draft=read(id,null);
    if(draft!==null){
      field.value=draft;
      if(status)status.textContent='Unsaved changes restored.';
    }

    field.addEventListener('input',()=>{
      write(id,field.value);
      if(status)status.textContent='Unsaved changes';
    });

    function save(){
      if(typeof onSave==='function')onSave(field.value);
      clear(id);
      if(status)status.textContent='Saved in this browser.';
    }

    return {save,clear:()=>clear(id)};
  }

  global.StudentWorkDraft={read,write,clear,attach};
})(window);
