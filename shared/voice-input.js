/* Optional voice input adapter. Typing always remains available. */
window.VoiceInput={
  attach(textarea,opts={}){
    if(!textarea||textarea.dataset.voiceAttached)return;
    textarea.dataset.voiceAttached='1';
    const bar=document.createElement('div');bar.className='voice-input-bar';
    const btn=document.createElement('button');btn.type='button';btn.className='button secondary';btn.textContent='🎙 Speak';
    const msg=document.createElement('span');msg.className='small muted';msg.textContent=' Optional voice input';
    bar.append(btn,msg);textarea.insertAdjacentElement('afterend',bar);
    const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
    if(!SR){btn.disabled=true;btn.title='Speech-to-text is not available in this browser.';msg.textContent=' Microphone transcription is not available in this browser; typing still works.';return}
    let rec=null;
    btn.addEventListener('click',()=>{
      if(rec){rec.stop();return}
      rec=new SR();rec.lang=opts.lang||document.documentElement.lang||'en-US';rec.interimResults=true;rec.continuous=false;
      const before=textarea.value.trim();let finalText='';btn.textContent='■ Stop';msg.textContent=' Listening…';
      rec.onresult=e=>{let interim='';for(let i=e.resultIndex;i<e.results.length;i++){const t=e.results[i][0].transcript;if(e.results[i].isFinal)finalText+=t;else interim+=t}textarea.value=[before,finalText||interim].filter(Boolean).join(before?' ':'');};
      rec.onerror=e=>{msg.textContent=' Microphone unavailable: '+e.error;};
      rec.onend=()=>{rec=null;btn.textContent='🎙 Speak';msg.textContent=' Review/edit the transcription before saving.';textarea.dispatchEvent(new Event('input',{bubbles:true}));};
      rec.start();
    });
  },
  attachAll(root=document){root.querySelectorAll('textarea').forEach(t=>this.attach(t));}
};
