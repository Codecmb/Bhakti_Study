(function(global){
  const jsonCache=new Map();
  const valueCache=new Map();
  const stats={networkRequests:0,cacheHits:0};

  function getJSON(url){
    if(jsonCache.has(url)){stats.cacheHits++;return jsonCache.get(url)}
    stats.networkRequests++;
    const p=fetch(url,{cache:'default'}).then(r=>{
      if(!r.ok)throw new Error(`${r.status} ${url}`);
      return r.json();
    }).catch(err=>{jsonCache.delete(url);throw err});
    jsonCache.set(url,p);
    return p;
  }

  function cached(key,loader){
    if(valueCache.has(key)){stats.cacheHits++;return valueCache.get(key)}
    const p=Promise.resolve().then(loader).catch(err=>{valueCache.delete(key);throw err});
    valueCache.set(key,p);return p;
  }

  function preloadJSON(url){getJSON(url).catch(()=>{});}

  async function loadManifestModules(manifestUrl,baseUrl,moduleField='modules'){
    return cached(`manifest:${manifestUrl}`,async()=>{
      const manifest=await getJSON(manifestUrl);
      const modules=manifest[moduleField]||[];
      const parts=await Promise.all(modules.map(m=>getJSON(baseUrl+m.path)));
      return {manifest,parts};
    });
  }

  async function questionShards(base,scopes){
    const manifestUrl=base+'data/questions/manifest.json';
    const manifest=await getJSON(manifestUrl);
    const wanted=new Set(scopes||[]);
    const rows=(manifest.shards||[]).filter(s=>wanted.has(s.scope));
    const parts=await Promise.all(rows.map(s=>getJSON(base+'data/questions/'+s.path)));
    return parts.flatMap(x=>x.questions||[]);
  }

  global.DataRegistry={getJSON,cached,preloadJSON,loadManifestModules,questionShards,stats};
})(window);
