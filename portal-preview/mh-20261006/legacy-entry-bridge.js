(() => {
 'use strict';
 const choice=document.getElementById('memory-choice');
 const open=document.querySelector('.memory-open');
 if(choice&&open){
  const targets=[...document.querySelectorAll('#shelf > .hot'),document.getElementById('psp')].filter(Boolean);
  choice.replaceChildren(...targets.map((target,index)=>{const option=document.createElement('option');option.value=String(index);option.textContent=target.getAttribute('aria-label');return option;}));
  open.addEventListener('click',()=>{const target=targets[Number(choice.value)];if(target)target.click();});
 }
 const aliases={'#memory':'history.html'};
 if(location.pathname.endsWith('/index.html')||location.pathname.endsWith('/')){
  const target=aliases[location.hash];if(target)location.replace(target);
 }
})();
