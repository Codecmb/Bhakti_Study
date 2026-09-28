(function(global){
  const KEY='bhakti-study.context.v1';
  function read(){try{return JSON.parse(sessionStorage.getItem(KEY)||'{}')}catch{return {}}}
  function write(patch){const next={...read(),...patch,updated_at:new Date().toISOString()};sessionStorage.setItem(KEY,JSON.stringify(next));return next}
  function clear(){sessionStorage.removeItem(KEY)}
  function fromLocation(){const q=new URLSearchParams(location.search);return {program:q.get('program')||'',unit:q.get('unit')||'',canonical:q.get('ref')||''}}
  global.StudyContext={read,write,clear,fromLocation};
})(window);
