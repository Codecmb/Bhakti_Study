function appRoot(){
  const p=location.pathname.replace(/\\/g,'/');
  if(p.includes('/programs/sat-sandarbhas/') && /\/programs\/sat-sandarbhas\/[^/]+\//.test(p)) return '../../../';
  if(p.includes('/programs/')) return '../../';
  if(p.includes('/library/books/')) return '../../';
  if(p.includes('/library/')) return '../';
  if(p.includes('/student/')||p.includes('/admin/')||p.includes('/certificates/')||p.includes('/slokas/')||p.includes('/references/')||p.includes('/question-bank/')||p.includes('/study/')) return '../';
  return './';
}
const ROOT=appRoot();
async function json(p){
  const local=location.hostname==='localhost'||location.hostname==='127.0.0.1';
  let r=await fetch(p,local?{cache:'no-store'}:undefined);
  if(!r.ok)throw Error(p);
  return r.json()
}
function sidebar(a='home',rootOverride=null){
 const R=rootOverride||ROOT;
 const link=i=>`<a class="${i[0]===a?'active':''}" href="${i[2]}">${i[1]}</a>`;
 const home=['home','Academy Home',R+'index.html'];
 const groups=[
   ['Study',[
     ['bhakti-sastri','Bhakti Śāstrī',R+'programs/bhakti-sastri/index.html'],
     ['bhakti-vaibhava','Bhakti Vaibhava',R+'programs/bhakti-vaibhava/index.html'],
     ['bhakti-vedanta','Bhakti Vedānta',R+'programs/bhakti-vedanta/index.html'],
     ['bhakti-sarvabhauma','Bhakti Sārvabhauma',R+'programs/bhakti-sarvabhauma/index.html'],
     ['sat-sandarbhas','Ṣaṭ Sandarbhas',R+'programs/sat-sandarbhas/index.html']
   ]],
   ['My Study',[
     ['study','Study',R+'study/index.html'],
     ['portfolio','My Work',R+'student/portfolio.html'],
     ['classroom','Study Classroom',R+'student/aula-estudio.html'],
     ['journal','Study Journal',(()=>{
       const url=new URL(R+'student/journal.html',location.href);
       const ref=new URLSearchParams(location.search).get('ref');
       const path=location.pathname;
       const parts=(ref||'').split('.');

       let context=null;

       if(path.endsWith('/bhakti-sastri/bg-1-6.html')
          && /^BG\.\d+\.\d+$/i.test(ref||'')){
         context={
           program:'Bhakti Śāstrī',
           unit:'bg-'+parts[1],
           book:'bg',
           bookTitle:'Bhagavad-gītā As It Is',
           section:'Chapter '+parts[1]
         };
       }

       if(path.endsWith('/bhakti-vaibhava/sb.html')
          && /^SB\.\d+\.\d+\.\d+$/i.test(ref||'')){
         context={
           program:'Bhakti Vaibhava',
           unit:new URLSearchParams(location.search).get('unit')||'',
           book:'sb-canto-'+parts[1],
           bookTitle:'Śrīmad-Bhāgavatam',
           section:'Canto '+parts[1]+', Chapter '+parts[2]
         };
       }

       if(path.endsWith('/bhakti-vedanta/sb.html')
          && /^SB\.\d+\.\d+\.\d+$/i.test(ref||'')){
         context={
           program:'Bhakti Vedānta',
           unit:new URLSearchParams(location.search).get('unit')||'',
           book:'sb-canto-'+parts[1],
           bookTitle:'Śrīmad-Bhāgavatam',
           section:'Canto '+parts[1]+', Chapter '+parts[2]
         };
       }

       if(path.endsWith('/bhakti-sarvabhauma/cc.html')
          && /^CC\.[A-Za-z]+\.\d+\.\d+$/i.test(ref||'')){
         context={
           program:'Bhakti Sārvabhauma',
           unit:new URLSearchParams(location.search).get('unit')||'',
           book:'cc-'+parts[1].toLowerCase(),
           bookTitle:'Śrī Caitanya-caritāmṛta',
           section:parts[1].toUpperCase()+', Chapter '+parts[2]
         };
       }

       if(context){
         Object.entries({...context,ref}).forEach(([key,value])=>{
           url.searchParams.set(key,value);
         });
       }
       return url.href;
     })()],
     ['question-bank','Question Bank',R+'question-bank/index.html'],
     ['progress','My Progress',R+'student/progress.html'],
     ['certificates','Certificates',R+'certificates/index.html']
   ]],
   ['Resources',[
     ['library','Books & Library',R+'library/index.html'],
     ['references','References & Further Study',R+'references/index.html'],
     ['slokas','Śloka Lab',R+'slokas/index.html']
   ]],
   ['Academy',[
     ['manage','Manage Academy',R+'admin/index.html']
   ]]
 ];
 const grouped=groups.map(([label,items])=>`<div class="nav-group"><div class="nav-label">${label}</div>${items.map(link).join('')}</div>`).join('');
 document.querySelector('.sidebar').innerHTML=`<div class="brand"><img src="${R}assets/bhakti-study-logo.png" alt="Bhakti Study Academy" style="display:block;width:118px;height:118px;object-fit:contain;margin:0 auto 10px"><div>Bhakti Study</div></div><nav class="nav">${link(home)}${grouped}</nav>`;

 bhaktiMobileNavigation();
 const journalLink=document.querySelector('.sidebar a[href*="student/journal.html"]');
 if(journalLink){
   journalLink.addEventListener('click',function(event){
     event.preventDefault();

     // Resolve the current reader context at click time.
     const url=new URL(R+'student/journal.html',location.href);
     const params=new URLSearchParams(location.search);
     const ref=params.get('ref')||'';
     const path=location.pathname;
     const parts=ref.split('.');
     let context=null;

     if(path.endsWith('/bhakti-sastri/bg-1-6.html')
        && /^BG\.\d+\.\d+$/i.test(ref)){
       context={
         program:'Bhakti Śāstrī',
         unit:'bg-'+parts[1],
         book:'bg',
         bookTitle:'Bhagavad-gītā As It Is',
         section:'Chapter '+parts[1]
       };
     }else if(path.endsWith('/bhakti-vaibhava/sb.html')
        && /^SB\.\d+\.\d+\.\d+$/i.test(ref)){
       context={
         program:'Bhakti Vaibhava',
         unit:params.get('unit')||'',
         book:'sb-canto-'+parts[1],
         bookTitle:'Śrīmad-Bhāgavatam',
         section:'Canto '+parts[1]+', Chapter '+parts[2]
       };
     }else if(path.endsWith('/bhakti-vedanta/sb.html')
        && /^SB\.\d+\.\d+\.\d+$/i.test(ref)){
       context={
         program:'Bhakti Vedānta',
         unit:params.get('unit')||'',
         book:'sb-canto-'+parts[1],
         bookTitle:'Śrīmad-Bhāgavatam',
         section:'Canto '+parts[1]+', Chapter '+parts[2]
       };
     }else if(path.endsWith('/bhakti-sarvabhauma/cc.html')
        && /^CC\.[A-Za-z]+\.\d+\.\d+$/i.test(ref)){
       context={
         program:'Bhakti Sārvabhauma',
         unit:params.get('unit')||'',
         book:'cc-'+parts[1].toLowerCase(),
         bookTitle:'Śrī Caitanya-caritāmṛta',
         section:parts[1].toUpperCase()+', Chapter '+parts[2]
       };
     }

     if(context){
       Object.entries({...context,ref}).forEach(([key,value])=>{
         url.searchParams.set(key,value);
       });
     }

     journalLink.href=url.href;
     const popup=window.open(
       url.href,
       '_blank',
       'popup=yes,width=760,height=900,left=20,top=20,resizable=yes,scrollbars=yes,toolbar=no,menubar=no,location=no,status=no'
     );
     if(popup)popup.focus();
   });
 }

 const main=document.querySelector('.main');
 if(main && !main.querySelector('.academy-creator-credit')){
   const credit=document.createElement('div');
   credit.className='academy-creator-credit';
   credit.innerHTML='<strong>Madhuha Dasa A. (HDG)</strong><span>Academia Master Siddhānta Gauḍīya</span>';
   main.prepend(credit);
 }
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

    const box=document.createElement('div');
    box.className='academy-quick-nav';
    box.style.cssText='position:fixed;right:14px;bottom:14px;z-index:9999;display:flex;gap:7px;flex-wrap:wrap;justify-content:flex-end;background:rgba(255,255,255,.96);padding:8px;border:1px solid #ddd3c2;border-radius:12px;box-shadow:0 5px 18px rgba(0,0,0,.12)';

    const path=location.pathname.replace(/\\/g,'/');
    const match=path.match(/\/programs\/([^/]+)\//);

    if(match){
      const program=document.createElement('a');
      program.className='button secondary';
      program.href=ROOT+'programs/'+encodeURIComponent(match[1])+'/index.html';
      program.textContent='↑ Program Home';
      box.appendChild(program);
    }

    const home=document.createElement('a');
    home.className='button secondary';
    home.href=ROOT+'index.html';
    home.textContent='🏠 Academy Home';
    box.appendChild(home);

    document.body.appendChild(box);
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',add);
  }else{
    add();
  }
})();
