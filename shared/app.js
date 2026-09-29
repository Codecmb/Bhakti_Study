function appRoot(){
  const p=location.pathname.replace(/\\/g,'/');
  if(p.includes('/programs/')) return '../../';
  if(p.includes('/library/books/')) return '../../';
  if(p.includes('/library/')) return '../';
  if(p.includes('/student/')||p.includes('/admin/')||p.includes('/certificates/')||p.includes('/slokas/')) return '../';
  return './';
}
const ROOT=appRoot();
async function json(p){let r=await fetch(p);if(!r.ok)throw Error(p);return r.json()}
function sidebar(a='home',rootOverride=null){
 const R=rootOverride||ROOT;
 let x=[['home','Academy Home',R+'index.html'],['bhakti-sastri','Bhakti Śāstrī',R+'programs/bhakti-sastri/index.html'],['bhakti-vaibhava','Bhakti Vaibhava',R+'programs/bhakti-vaibhava/index.html'],['bhakti-vedanta','Bhakti Vedānta',R+'programs/bhakti-vedanta/index.html'],['bhakti-sarvabhauma','Bhakti Sārvabhauma',R+'programs/bhakti-sarvabhauma/index.html'],['sat-sandarbhas','Ṣaṭ Sandarbhas',R+'programs/sat-sandarbhas/index.html'],['library','Books & Library',R+'library/index.html'],['slokas','Śloka Lab',R+'slokas/index.html'],['portfolio','My Work',R+'student/portfolio.html'],['progress','My Progress',R+'student/progress.html'],['certificates','Certificates',R+'certificates/index.html'],['manage','Manage Academy',R+'admin/index.html']];
 document.querySelector('.sidebar').innerHTML='<div class="brand">Bhakti Study</div><nav class="nav">'+x.map(i=>`<a class="${i[0]===a?'active':''}" href="${i[2]}">${i[1]}</a>`).join('')+'</nav>'
}
async function renderProgram(id){
 sidebar(id);let [ps,bs]=await Promise.all([json('../../data/programs.json'),json('../../data/books.json')]),p=ps.find(x=>x.id===id),m=Object.fromEntries(bs.map(b=>[b.id,b]));
 title.textContent=p.title;subtitle.textContent=p.subtitle;
 books.innerHTML=p.books.map(id=>{let b=m[id]||{id,title:id.toUpperCase(),status:'not registered'};let ready=b.status==='imported';return `<article class="card"><span class="tag">${b.status}</span><h3>${b.title}</h3><p class="small">${b.source||'Ready for plug-and-play registration.'}</p>${ready?`<a class="button secondary" href="../../library/reader.html?book=${encodeURIComponent(b.id)}">Open Book</a>`:'<button class="button secondary" disabled>Source Needed</button>'}</article>`}).join('')
}

// Universal escape navigation: additive only; does not replace page-specific navigation.
(function installQuickNav(){
  function add(){
    if(document.querySelector('.academy-quick-nav')) return;
    const box=document.createElement('div'); box.className='academy-quick-nav';
    box.style.cssText='position:fixed;right:14px;bottom:14px;z-index:9999;display:flex;gap:7px;flex-wrap:wrap;justify-content:flex-end;background:rgba(255,255,255,.96);padding:8px;border:1px solid #ddd3c2;border-radius:12px;box-shadow:0 5px 18px rgba(0,0,0,.12)';
    const home=document.createElement('a');home.className='button secondary';home.href=R+'index.html';home.textContent='🏠 Academy Home';box.appendChild(home);
    if(location.pathname.includes('/programs/bhakti-sastri/')){const program=document.createElement('a');program.className='button secondary';program.href='index.html';program.textContent='↑ Bhakti Śāstrī Program';box.insertBefore(program,home)}
    document.body.appendChild(box);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',add);else add();
})();
