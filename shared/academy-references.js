(function(global){
  const KEY='bhakti_academy_references_v1';

  function load(){
    try{
      const data=JSON.parse(localStorage.getItem(KEY)||'[]');
      return Array.isArray(data)?data:[];
    }catch{
      return [];
    }
  }

  function save(items){
    localStorage.setItem(KEY,JSON.stringify(items));
    return items;
  }

  function id(){
    return 'reference-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7);
  }

  function add(reference){
    const items=load();
    const item={
      id:id(),
      title:String(reference?.title||'').trim(),
      url:String(reference?.url||'').trim(),
      author:String(reference?.author||'').trim(),
      purpose:String(reference?.purpose||'').trim(),
      scope:String(reference?.scope||'academy').trim()||'academy',
      category:String(reference?.category||'').trim(),
      provenance:'Academy Administrator',
      created_at:new Date().toISOString()
    };
    items.push(item);
    save(items);
    return item;
  }

  function update(referenceId,patch={}){
    const items=load();
    const index=items.findIndex(item=>item.id===referenceId);
    if(index<0)return null;

    const current=items[index];

    items[index]={
      ...current,
      ...patch,
      id:current.id,
      provenance:current.provenance,
      created_at:current.created_at
    };

    save(items);
    return items[index];
  }

  function remove(referenceId){
    return save(load().filter(item=>item.id!==referenceId));
  }

  function get(referenceId){
    return load().find(item=>item.id===referenceId);
  }

  function forScope(scope){
    return load().filter(item=>item.scope==='academy'||item.scope===scope);
  }

  global.AcademyReferences={load,save,add,update,remove,get,forScope};
})(window);
