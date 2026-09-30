(function(global){
  function render(container,{program,scope,questions=[],bank=null}={}){
    if(!container||!global.QuestionEngine)return;

    const active=QuestionEngine.active(questions,program);
    const deleted=QuestionEngine.deletedQuestions(program).map(d=>{
      const current=questions.find(q=>q.id===d.qid);
      return current||d.question||{id:d.qid,question:'Deleted question',canonical_ref:''};
    });

    container.innerHTML=
      `<h3>${bank?.label||'Study Questions'}</h3>`+
      active.map((x,i)=>`<article class="question-card" data-qid="${x.id}">
        <p><strong>${i+1}. ${x.question}</strong></p>
        <textarea class="field qanswer" data-qid="${x.id}" placeholder="Answer from the primary source…"></textarea>
        <p><button class="button secondary clearAnswer" type="button" data-qid="${x.id}">Clear Answer</button></p>
        <div class="small">${x.canonical_ref||''}${bank?.provenance_label?' · '+bank.provenance_label:''}${x.kind?' · '+x.kind:''}${x.provenance?.title?' · Source: '+x.provenance.title:''}${x.provenance?.author?' · '+x.provenance.author:''}</div>
        <p>
          <button class="button secondary flagDuplicate" data-qid="${x.id}">
            ${QuestionEngine.isDuplicate(program,x.id)?'Unflag Duplicate':'Flag Duplicate'}
          </button>
          <button class="button secondary deleteQuestion" data-qid="${x.id}">Delete Question</button>
        </p>
      </article>`).join('')+
      (active.length?`<p class="question-navigation">
        <button id="previousQuestion" type="button" class="button secondary">← Previous Question</button>
        <button id="nextUnanswered" type="button" class="button secondary">Next Unanswered</button>
        <button id="nextQuestion" type="button" class="button secondary">Next Question →</button>
      </p>`:'')+
      '<p><button id="saveQuestions" class="button">Save Answers</button></p>'+
      (deleted.length?`<details>
        <summary><strong>Deleted Questions (${deleted.length})</strong></summary>
        ${deleted.map(x=>`<article class="question-card">
          <p>${x.question}</p>
          <button class="button secondary restoreQuestion" data-qid="${x.id}">Restore</button>
        </article>`).join('')}
      </details>`:'');

    container.querySelectorAll('.qanswer').forEach(el=>{
      el.value=QuestionEngine.load(program,scope,el.dataset.qid);

      if(global.StudentWorkDraft){
        StudentWorkDraft.track({
          id:`question.${program}.${scope}.${el.dataset.qid}`,
          field:el
        });
      }
    });

    container.querySelectorAll('.clearAnswer').forEach(btn=>btn.onclick=()=>{
      const answer=container.querySelector(`.qanswer[data-qid="${btn.dataset.qid}"]`);
      if(!answer || !answer.value)return;
      if(!confirm('Clear this answer? The saved answer will remain unchanged until you save answers.'))return;
      answer.value='';
      answer.focus();
    });

    const cards=[...container.querySelectorAll('.question-card[data-qid]')];

    function currentIndex(){
      const focused=document.activeElement?.closest?.('.question-card[data-qid]');
      if(focused){
        const ix=cards.indexOf(focused);
        if(ix>=0)return ix;
      }

      const visible=cards.findIndex(card=>{
        const r=card.getBoundingClientRect();
        return r.bottom>0 && r.top<window.innerHeight;
      });
      return visible>=0?visible:0;
    }

    function goTo(ix){
      if(ix<0 || ix>=cards.length)return;
      cards[ix].scrollIntoView({behavior:'smooth',block:'center'});
      cards[ix].querySelector('.qanswer')?.focus({preventScroll:true});
    }

    container.querySelector('#previousQuestion')?.addEventListener('click',()=>{
      goTo(Math.max(0,currentIndex()-1));
    });

    container.querySelector('#nextQuestion')?.addEventListener('click',()=>{
      goTo(Math.min(cards.length-1,currentIndex()+1));
    });

    container.querySelector('#nextUnanswered')?.addEventListener('click',()=>{
      if(!cards.length)return;

      const start=currentIndex();
      const unanswered=card=>{
        const field=card.querySelector('.qanswer');
        return !String(field?.value||'').trim();
      };

      for(let offset=1;offset<=cards.length;offset++){
        const ix=(start+offset)%cards.length;
        if(unanswered(cards[ix])){
          goTo(ix);
          return;
        }
      }
    });

    container.querySelectorAll('.flagDuplicate').forEach(btn=>btn.onclick=()=>{
      if(QuestionEngine.isDuplicate(program,btn.dataset.qid)){
        QuestionEngine.clearDuplicate(program,btn.dataset.qid);
        btn.textContent='Flag Duplicate';
      }else{
        QuestionEngine.flagDuplicate(program,btn.dataset.qid);
        btn.textContent='Unflag Duplicate';
      }
    });

    container.querySelectorAll('.deleteQuestion').forEach(btn=>btn.onclick=()=>{
      if(!confirm('Delete this question from your study collection? You can restore it later.'))return;
      const item=questions.find(x=>x.id===btn.dataset.qid);
      QuestionEngine.deleteQuestion(program,btn.dataset.qid,item||null);
      render(container,{program,scope,questions,bank});
    });

    container.querySelectorAll('.restoreQuestion').forEach(btn=>btn.onclick=()=>{
      QuestionEngine.restoreQuestion(program,btn.dataset.qid);
      render(container,{program,scope,questions,bank});
    });
  }

  function clearAnswerDrafts(container,{program,scope}={}){
    if(!container||!global.StudentWorkDraft)return;

    container.querySelectorAll('.qanswer').forEach(el=>{
      StudentWorkDraft.clear(`question.${program}.${scope}.${el.dataset.qid}`);
    });
  }

  global.QuestionManagementUI={render,clearAnswerDrafts};
})(window);
