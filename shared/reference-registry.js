(function(global){
  const ROOT={
    'bhakti-sastri':'programs/bhakti-sastri/data/',
    'bhakti-vaibhava':'programs/bhakti-vaibhava/data/',
    'bhakti-vedanta':'programs/bhakti-vedanta/data/',
    'bhakti-sarvabhauma':'programs/bhakti-sarvabhauma/data/'
  };

  function root(){
    const p=location.pathname;
    if(p.includes('/programs/sat-sandarbhas/') && !p.endsWith('/sat-sandarbhas/index.html'))return '../../../';
    if(p.includes('/programs/'))return '../../';
    if(p.includes('/library/')||p.includes('/student/')||p.includes('/slokas/')||
       p.includes('/certificates/')||p.includes('/admin/')||p.includes('/scholars/'))return '../';
    return './';
  }

  async function loadJSON(path){
    const r=await fetch(path);
    if(!r.ok)throw Error(path);
    return r.json();
  }

  function normalizeOfficial(data){
    if(!data||typeof data!=='object')return [];

    const source=Array.isArray(data.resources)
      ? data.resources
      : Array.isArray(data.official)
        ? data.official
        : [];

    return source.map((item,index)=>({
      id:item.id||`official-${index+1}`,
      kind:'official',
      type:item.type||'resource',
      title:item.title||'Official Resource',
      url:item.url||'',
      purpose:item.purpose||item.contentPolicy||'',
      provenance:data.label||'Official Resource',
      enabled:item.enabled!==false
    }));
  }

  function normalizeReferences(data){
    if(!data||!Array.isArray(data.items))return [];

    return data.items.map((item,index)=>({
      id:item.id||`reference-${index+1}`,
      kind:'reference',
      type:item.type||'reference',
      title:item.title||item.label||'Reference',
      url:item.url||'',
      purpose:item.purpose||item.description||'',
      author:item.author||'',
      source:item.source||'',
      enabled:item.enabled!==false,
      raw:item
    }));
  }

  async function scholars(){
    const data=await loadJSON(root()+'scholars/scholars.json');
    return Array.isArray(data)
      ? data.filter(x=>x&&x.enabled!==false)
      : [];
  }

  async function official(program){
    const base=ROOT[program];
    if(!base)return [];

    try{
      return normalizeOfficial(
        await loadJSON(root()+base+'official-resources.json')
      );
    }catch(e){
      return [];
    }
  }

  async function sandarbha(work){
    if(!work)return [];

    try{
      return normalizeReferences(
        await loadJSON(
          root()+
          'programs/sat-sandarbhas/'+
          encodeURIComponent(work)+
          '/references.json'
        )
      );
    }catch(e){
      return [];
    }
  }

  global.ReferenceRegistry={
    scholars,
    official,
    sandarbha,
    normalizeOfficial,
    normalizeReferences
  };
})(window);
