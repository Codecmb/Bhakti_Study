(function(global){
  const root=()=>location.pathname.includes('/programs/sat-sandarbhas/')?'../../../':location.pathname.includes('/programs/')?'../../':location.pathname.includes('/library/')||location.pathname.includes('/student/')?'../':'./';
  const stop=new Set('the a an and or but of to in on for with from by is are was were be been being what why how who when where which does do did this that these those it its as at into about can could should would krishna krsna lord'.split(' '));
  const tokens=s=>[...new Set(String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9\s-]/g,' ').split(/\s+/).filter(x=>x.length>2&&!stop.has(x)))];
  const bookKey=id=>String(id||'').toLowerCase().replace(/^sb(?:-canto)?-?(\d+)$/,'sb$1');
  async function catalog(){const d=await DataRegistry.getJSON(root()+'data/books.json');return Array.isArray(d)?d:(d.books||[])}
  function canonicalOf(meta,v){const r=String(v.reference||'');if(meta.canonicalId==='BG')return 'BG.'+r;if(meta.canonicalId?.startsWith('SB.'))return 'SB.'+r;if(meta.canonicalId?.startsWith('CC.')){const m=r.match(/(adi|madhya|antya)\.(\d+)\.(\d+(?:-\d+)?)/i);if(m)return `CC.${m[1].toUpperCase()}.${m[2]}.${m[3]}`}if(['ISO','NOI'].includes(meta.canonicalId)){const m=r.match(/(\d+)/);if(m)return `${meta.canonicalId}.${m[1]}`}if(meta.canonicalId==='NOD'){const m=r.match(/^\s*(\d+)/);if(m)return `NOD.${m[1]}`}return v.id||r}
  async function loadBook(meta){return DataRegistry.getJSON(root()+meta.dataPath)}
  function chapterPrefix(c){if(!c)return '';const p=c.split('.');if(p[0]==='BG')return p.slice(0,2).join('.')+'.';if(p[0]==='SB')return p.slice(0,3).join('.')+'.';if(p[0]==='CC')return p.slice(0,3).join('.')+'.';return c}
  async function search(question,{bookIds=[],canonical='',scope='book',limit=8}={}){
    const ts=tokens(question);if(!ts.length)return [];
    const cat=await catalog();let metas=cat.filter(x=>x.status==='imported');if(scope!=='library'&&bookIds.length){const wanted=new Set(bookIds.map(bookKey));metas=metas.filter(x=>wanted.has(bookKey(x.id)))}
    const prefix=scope==='chapter'?chapterPrefix(canonical):scope==='passage'?canonical:'';
    const books=await Promise.all(metas.map(async m=>[m,await loadBook(m).catch(()=>null)]));const out=[];
    for(const [m,b] of books){if(!b)continue;for(const s of b.sections||[])for(const v of s.verses||[]){const c=canonicalOf(m,v);if(prefix&&!(scope==='passage'?c===prefix:c.startsWith(prefix)))continue;const text=[v.translation,v.purport,v.synonyms,v.source_text,v.transliteration].filter(Boolean).join(' ');const low=text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');let score=0;for(const t of ts){if(low.includes(t))score+=t.length>6?3:2}if(c===canonical)score+=4;if(score){const snippet=(v.translation||v.source_text||v.purport||'').replace(/\s+/g,' ').slice(0,260);out.push({canonical:c,book:m.id,title:b.title||m.title,score,snippet})}}
    }
    return out.sort((a,b)=>b.score-a.score||a.canonical.localeCompare(b.canonical)).slice(0,limit);
  }
  global.InternalSourceSearch={search,tokens};
})(window);
