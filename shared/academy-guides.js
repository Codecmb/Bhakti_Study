(function(){
const KEY='bhakti_academy_guides_v1';
function load(){try{return JSON.parse(localStorage.getItem(KEY)||'[]')}catch(e){return []}}
function save(x){localStorage.setItem(KEY,JSON.stringify(x));return x}
function id(){return 'guide-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7)}
function refs(text){const found=[];const re=/\b(?:BG|Bhagavad[- ]g(?:ī|i)t(?:ā|a))\s*\.?\s*(\d{1,2})\s*[.:]\s*(\d{1,3})(?:\s*[-–]\s*(\d{1,3}))?/gi;let m;while((m=re.exec(text||''))){let r='BG.'+m[1]+'.'+m[2];if(!found.includes(r))found.push(r)}return found}
function questions(text){return (text||'').split(/\n+/).map(s=>s.trim().replace(/^[-•*\d.)\s]+/,'' )).filter(s=>s.length>8&&s.includes('?')).map(q=>({id:id(),text:q,refs:refs(q),required:true}))}
function internalHref(ref){return 'bg-1-6.html?ref='+encodeURIComponent(ref)}
window.AcademyGuides={load,save,id,refs,questions,internalHref,add(g){const a=load();a.push(g);return save(a)},remove(gid){return save(load().filter(x=>x.id!==gid))},get(gid){return load().find(x=>x.id===gid)}};
})();
