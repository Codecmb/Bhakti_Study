(function(global){
  const DEFAULT=[];
  function tools(course){return Array.isArray(course?.workflow?.tools)?course.workflow.tools:DEFAULT}
  function enabled(course,context={}){return tools(course).filter(t=>t.enabled!==false && (!t.requiresCanonical||context.canonical))}
  function href(tool,{program,unit,canonical}={}){
    const p=new URLSearchParams();
    if(unit)p.set('unit',unit);
    if(tool.mode)p.set('mode',tool.mode);
    if(canonical)p.set('ref',canonical);
    if(tool.route==='progress'){
      const q=new URLSearchParams(); if(program)q.set('program',program); if(unit)q.set('unit',unit); if(canonical)q.set('ref',canonical);
      return `../../student/progress.html?${q}`;
    }
    if(tool.route==='slokas'){
      const q=new URLSearchParams(); if(canonical)q.set('ref',canonical); return `../../slokas/index.html${q.toString()?`?${q}`:''}`;
    }
    return `tools.html?${p}`;
  }
  function buttons(course,ctx={}){
    return enabled(course,ctx).filter(t=>t.showInUnit!==false).map(t=>`<a class="button ${t.className||'secondary'}" href="${href(t,ctx)}">${t.label}</a>`).join('');
  }
  function tabs(course,ctx={}){
    return enabled(course,ctx).filter(t=>t.showInWorkspace!==false).map(t=>`<a class="button ${t.mode===ctx.mode?'saffron':'secondary'}" href="${href(t,ctx)}">${t.label}</a>`).join('');
  }
  function hasMode(course,mode){return tools(course).some(t=>t.mode===mode&&t.enabled!==false)}
  global.StudyWorkflow={tools,enabled,href,buttons,tabs,hasMode};
})(window);
