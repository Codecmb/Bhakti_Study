(function(global){
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const params=o=>{const p=new URLSearchParams();Object.entries(o).forEach(([k,v])=>{if(v)p.set(k,v)});return p.toString()};
  function lessonCard(program,course,l){
    const read=`../../library/reader.html?${params({book:l.book,ref:l.firstRef,program,unit:l.unitId})}`;
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
      return `<section class="course-unit" id="${esc(u.id)}"><button class="unit-toggle" type="button" aria-expanded="${ui===0?'true':'false'}"><span><span class="eyebrow">${esc(u.id)}</span><strong>${esc(u.title)}</strong><small>${esc(u.range||'')} · ${ls.length} lessons</small></span><span class="unit-chevron">⌄</span></button><div class="unit-lessons" ${ui===0?'':'hidden'}><div class="unit-intro"><p>Follow the lesson outline in order, or open any lesson directly. Scripture remains in the canonical library; the course stores only curriculum references.</p><a class="button saffron" href="${continueHref}">Begin / Continue Unit</a> ${StudyWorkflow.buttons(course,{program:programId,unit:u.id})}</div><div class="lesson-grid">${ls.map(l=>lessonCard(programId,course,l)).join('')||'<div class="notice">Lesson outline is not configured for this unit yet.</div>'}</div></div></section>`;
    }).join('');
    host.addEventListener('click',e=>{const b=e.target.closest('.unit-toggle');if(!b)return;const panel=b.nextElementSibling,open=panel.hidden;panel.hidden=!open;b.setAttribute('aria-expanded',String(open));});
    const first=lessons[0]; if(first){document.querySelector('#continueStudy').href=`../../library/reader.html?${params({book:first.book,ref:first.firstRef,program:programId,unit:first.unitId})}`}
  }
  global.CourseHome={init};
})(window);
