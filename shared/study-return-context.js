(function(global){
  const PREFIX='bhakti-study.return.v1';

  function key(program){
    return `${PREFIX}.${program}`;
  }

  function set(program,context){
    if(!program||!context)return null;

    const value={
      ...context,
      program,
      created_at:new Date().toISOString()
    };

    try{
      sessionStorage.setItem(key(program),JSON.stringify(value));
    }catch{}

    return value;
  }

  function get(program){
    if(!program)return null;

    try{
      const raw=sessionStorage.getItem(key(program));
      return raw?JSON.parse(raw):null;
    }catch{
      return null;
    }
  }

  function clear(program){
    if(!program)return;
    try{
      sessionStorage.removeItem(key(program));
    }catch{}
  }

  global.StudyReturnContext={set,get,clear};
})(window);
