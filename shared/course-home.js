(function(global){
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const params=o=>{const p=new URLSearchParams();Object.entries(o).forEach(([k,v])=>{if(v)p.set(k,v)});return p.toString()};
  function lessonCard(program,course,l){
    const read=(program==='bhakti-sastri' && l.book==='bg')
      ? `bg-1-6.html?ref=${encodeURIComponent(l.firstRef)}`
      : `../../library/reader.html?${params({book:l.book,ref:l.firstRef,program,unit:l.unitId})}`;
    const study=`tools.html?${params({unit:l.unitId,mode:'understanding',ref:l.firstRef})}`;
    const questions=`tools.html?${params({unit:l.unitId,mode:'questions',ref:l.firstRef})}`;
    return `<article class="lesson-card"><div class="lesson-number">Lesson ${l.order}</div><h4>${esc(l.title)}</h4><p class="small"><strong>${esc(l.firstRef)}</strong>${l.lastRef&&l.lastRef!==l.firstRef?' → '+esc(l.lastRef):''} · ${l.recordCount} study record${l.recordCount===1?'':'s'}</p><div class="lesson-actions"><a class="button" href="${read}">Read</a><a class="button secondary" href="${study}">Study</a>${StudyWorkflow.hasMode(course,'questions')?`<a class="button secondary" href="${questions}">Questions</a>`:''}</div></article>`;
  }
  async function init({programId,dataBase='data/'}){
    sidebar(programId);
    const course=await BhaktiProgramData.loadCourse(dataBase), units=course.units||[], lessons=course.lessons?.lessons||course.lessons||[];
    document.querySelector('#courseTitle').textContent=course.title||programId;
    const meta=document.querySelector('#courseMeta');
    meta.textContent=`${units.length} study units · ${lessons.length} lessons · canonical-library source model`;
    const host=document.querySelector('#lessonOutline');
    host.innerHTML=units.map((u,ui)=>{
      const ls=lessons.filter(l=>l.unitId===u.id);
      const first=ls[0];
      const continueHref=first?`../../library/reader.html?${params({book:first.book,ref:first.firstRef,program:programId,unit:u.id})}`:`tools.html?${params({unit:u.id,mode:'read'})}`;
      const groups=[];
      ls.forEach(l=>{
        const ref=String(l.firstRef||'');
        const m=ref.match(/^(?:BG|SB|CC(?:\.ADI|\.MADHYA|\.ANTYA)?)[. ]?(\d+)/i);
        const key=m?m[1]:'Other';
        let g=groups.find(x=>x.key===key);
        if(!g){g={key,lessons:[]};groups.push(g)}
        g.lessons.push(l);
      });

      const chapterContent=groups.length>1
        ? `<div class="chapter-groups">${groups.map(g=>`
            <section class="chapter-group">
              <button class="chapter-toggle" type="button" aria-expanded="false">
                <span><strong>Chapter ${esc(g.key)}</strong><small>${g.lessons.length} lesson${g.lessons.length===1?'':'s'}</small></span>
                <span class="chapter-chevron">⌄</span>
              </button>
              <div class="chapter-lessons" hidden>
                <div class="lesson-grid">${g.lessons.map(l=>lessonCard(programId,course,l)).join('')}</div>
              </div>
            </section>`).join('')}</div>`
        : `<div class="lesson-grid">${ls.map(l=>lessonCard(programId,course,l)).join('')||'<div class="notice">Lesson outline is not configured for this unit yet.</div>'}</div>`;

      return `<section class="course-unit" id="${esc(u.id)}"><button class="unit-toggle" type="button" aria-expanded="false"><span><span class="eyebrow">${esc(u.id)}</span><strong>${esc(u.title)}</strong><small>${esc(u.range||'')} · ${ls.length} lessons</small></span><span class="unit-chevron">⌄</span></button><div class="unit-lessons" hidden><div class="unit-intro"><p>Follow the lesson outline in order, or open any lesson directly. Scripture remains in the canonical library; the course stores only curriculum references.</p><a class="button saffron" href="${continueHref}">Begin / Continue Unit</a> ${StudyWorkflow.buttons(course,{program:programId,unit:u.id})}</div>${chapterContent}</div></section>`;
    }).join('');
    host.addEventListener('click',e=>{
      const chapter=e.target.closest('.chapter-toggle');
      if(chapter){
        const panel=chapter.nextElementSibling;
        const open=panel.hidden;
        chapter.closest('.chapter-groups').querySelectorAll('.chapter-toggle').forEach(b=>{
          b.setAttribute('aria-expanded','false');
          b.nextElementSibling.hidden=true;
        });
        if(open){
          panel.hidden=false;
          chapter.setAttribute('aria-expanded','true');
        }
        return;
      }

      const b=e.target.closest('.unit-toggle');
      if(!b)return;
      const panel=b.nextElementSibling;
      const open=panel.hidden;

      host.querySelectorAll('.unit-toggle').forEach(x=>{
        x.setAttribute('aria-expanded','false');
        x.nextElementSibling.hidden=true;
      });

      if(open){
        panel.hidden=false;
        b.setAttribute('aria-expanded','true');
      }
    });
    const first=lessons[0]; if(first){document.querySelector('#continueStudy').href=`../../library/reader.html?${params({book:first.book,ref:first.firstRef,program:programId,unit:first.unitId})}`}
  }
  global.CourseHome={init};
})(window);
