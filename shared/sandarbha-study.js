(function(){
  const esc=s=>String(s??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]));
  const work=window.SANDARBHA_WORK;
  const key=id=>`bhakti:sandarbha:${work}:${id}`;
  Promise.all([fetch('course.json').then(r=>r.json()), fetch('references.json').then(r=>r.json()).catch(()=>({items:[]}))]).then(([c,refs])=>{
    document.title=c.title;
    const title=document.getElementById('courseTitle'); if(title) title.textContent=c.displayTitle||c.title;
    const intro=document.getElementById('courseIntro'); if(intro) intro.textContent=`${c.unitCount} unidades canónicas. El texto primario permanece separado de tus notas y progreso.`;
    const app=document.getElementById('app');
    app.innerHTML=c.units.map(u=>{
      const verified=u.sourceHeadingVerified!==false;
      return `<section class="unit" id="${esc(u.id)}"><div class="unit-head"><h2>${esc(u.id)}</h2><span class="source-state ${verified?'verified':'reserved'}">${verified?'Encabezado verificado':'Identidad canónica · encabezado no verificado'}</span></div>${u.sourceLabel?`<p class="muted">Fuente: ${esc(u.sourceLabel)}</p>`:''}<div class="lens">${u.studyMethod.advancedLens.map(x=>`<span>${esc(x)}</span>`).join('')}</div><h3>Mi comprensión inicial</h3><p>${esc(u.studyMethod.beforeReading[0])}</p><textarea data-id="${esc(u.id)}" data-field="initialUnderstanding" placeholder="Escribe antes de consultar tus notas…"></textarea><h3>Estudia la fuente</h3><ul>${u.studyMethod.sourceStudy.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>${verified&&u.sourcePointer?`<p class="muted">Referencia interna de fuente: ${esc(u.sourcePointer.sourceId||'fuente')} · ${u.sourcePointer.startLine?'línea '+esc(u.sourcePointer.startLine):'unidad '+esc(u.number)}</p>`:`<p class="notice">La extracción disponible no verificó un encabezado independiente para esta unidad. No se inventó texto ni posición de fuente.</p>`}<h3>Comprensión revisada</h3><p>${esc(u.studyMethod.afterReading[0])}</p><textarea data-id="${esc(u.id)}" data-field="revisedUnderstanding" placeholder="Después de volver a la fuente…"></textarea><label><input type="checkbox" data-id="${esc(u.id)}" data-field="completed"> Completado</label></section>`;
    }).join('');
    document.querySelectorAll('[data-id]').forEach(el=>{let d=JSON.parse(localStorage.getItem(key(el.dataset.id))||'{}'); if(el.type==='checkbox')el.checked=!!d[el.dataset.field]; else el.value=d[el.dataset.field]||''; el.addEventListener('change',save); el.addEventListener('input',save)});
    const refBox=document.getElementById('references'); if(refBox&&refs.items?.length) refBox.innerHTML='<h2>Referencias opcionales</h2>'+refs.items.map(x=>`<p>${esc(x.label||x.title)}${x.url?` · <a href="${esc(x.url)}" target="_blank" rel="noopener">recurso externo ↗</a>`:''}</p>`).join('');
  });
  function save(e){let el=e.target,k=key(el.dataset.id),d=JSON.parse(localStorage.getItem(k)||'{}');d[el.dataset.field]=el.type==='checkbox'?el.checked:el.value;d.lastStudiedAt=new Date().toISOString();localStorage.setItem(k,JSON.stringify(d));}
})();
