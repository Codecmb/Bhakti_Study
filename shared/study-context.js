(function(global){
  const KEY='bhakti-study.context.v2';

  function all(){
    try{return JSON.parse(localStorage.getItem(KEY)||'{}')}
    catch{return {}}
  }

  function save(data){
    localStorage.setItem(KEY,JSON.stringify(data));
    return data;
  }

  function read(program){
    const data=all();
    return program ? (data[program]||{}) : data;
  }

  function set(patch){
    if(!patch?.program)return null;

    const data=all();
    const current=data[patch.program]||{};

    data[patch.program]={
      ...current,
      ...patch,
      updated_at:new Date().toISOString()
    };

    save(data);
    return data[patch.program];
  }

  function write(patch){
    return set(patch);
  }

  function clear(program){
    if(!program){
      localStorage.removeItem(KEY);
      return;
    }

    const data=all();
    delete data[program];
    save(data);
  }

  function fromLocation(){
    const q=new URLSearchParams(location.search);
    return {
      program:q.get('program')||'',
      unit:q.get('unit')||'',
      canonical:q.get('ref')||''
    };
  }

  global.StudyContext={read,set,write,clear,fromLocation};
})(window);
