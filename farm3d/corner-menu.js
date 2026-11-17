// Preview-only corner menus. Reuse real controls; never copy handlers or game state.
export function installCornerMenus(doc) {
  if (doc.getElementById('preview-tools-menu')) return false;
  const probe=doc.createElement('dialog');
  if (typeof probe.showModal!=='function' || typeof probe.close!=='function') return false;
  const specs=[
    {key:'tools',root:'.side',title:'Explore & tools',label:'Menu',icon:'☰',groups:[
      {name:'Play',items:[['#walkBtn','Walk'],['#editBtn','Edit farm'],['#questBtn','Quests'],['#photoBtn','Photo']]},
      {name:'Options',items:[['[data-p="settings"]','Settings'],['#soundBtn','Sound'],['#friendsBtn','Friends'],['#verifiedBtn','Verified']]}
    ]},
    {key:'barn',root:'.dock',title:'Barn & shop',label:'Barn & shop',icon:'🧺',groups:[
      {name:'',items:[['[data-p="orders"]','Orders'],['[data-p="barn"]','Barn'],['[data-p="decor"]','Decor'],['[data-p="shop"]','Shop']]}
    ]}
  ];
  // Validate every source control before moving any. Unsupported layouts keep the old UI.
  for(const spec of specs){
    spec.host=doc.querySelector(spec.root);if(!spec.host)return false;
    for(const group of spec.groups)for(const item of group.items){item.push(spec.host.querySelector(item[0]));if(!item[2])return false;}
  }
  for(const spec of specs){
    const dialog=doc.createElement('dialog');dialog.id='preview-'+spec.key+'-menu';dialog.className='preview-menu';
    dialog.setAttribute('aria-labelledby',dialog.id+'-title');
    const launch=doc.createElement('button');launch.type='button';launch.className='preview-launcher';launch.id='preview-'+spec.key+'-launch';
    launch.setAttribute('aria-label',spec.title);launch.setAttribute('aria-haspopup','dialog');launch.setAttribute('aria-controls',dialog.id);launch.setAttribute('aria-expanded','false');
    const icon=doc.createElement('span');icon.className='preview-launch-icon';icon.setAttribute('aria-hidden','true');icon.textContent=spec.icon;
    const label=doc.createElement('span');label.className='preview-launch-label';label.textContent=spec.label;
    const notice=doc.createElement('span');notice.className='preview-menu-notice';notice.hidden=true;notice.setAttribute('aria-hidden','true');launch.append(icon,label,notice);
    const head=doc.createElement('header');head.className='preview-menu-head';
    const title=doc.createElement('h2');title.id=dialog.id+'-title';title.textContent=spec.title;
    const close=doc.createElement('button');close.type='button';close.className='preview-menu-close';close.textContent='✕';close.setAttribute('aria-label','Close '+spec.title);close.autofocus=true;head.append(title,close);
    const groups=doc.createElement('div');groups.className='preview-menu-groups';if(spec.groups.length===1)groups.classList.add('single');
    const buttons=[];
    for(const group of spec.groups){
      const section=doc.createElement('section');
      if(group.name){const h=doc.createElement('h3');h.textContent=group.name;section.append(h);}
      const actions=doc.createElement('div');actions.className='preview-menu-actions';
      for(const [,name,button] of group.items){button.dataset.menuLabel=name;buttons.push(button);actions.append(button);}
      section.append(actions);groups.append(section);
    }
    dialog.append(head,groups);
    // Dialogs stay in their original containers: existing selectors and mode hiding survive.
    spec.host.append(launch,dialog);spec.host.dataset.menuReady='true';
    const shut=()=>{if(dialog.open)dialog.close();launch.setAttribute('aria-expanded','false');};
    launch.addEventListener('click',()=>{if(dialog.open){shut();return;}dialog.showModal();launch.setAttribute('aria-expanded','true');});
    close.addEventListener('click',shut);dialog.addEventListener('close',()=>launch.setAttribute('aria-expanded',String(dialog.open)));
    dialog.addEventListener('click',event=>{
      if(event.target.closest?.('.preview-menu-actions button'))shut();
      else if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)shut();}
    },true);
    // Keep new game commands out while preserving native Tab/Escape and activation.
    // Let keyup reach the existing keys.delete handler so a held movement key cannot stick.
    dialog.addEventListener('keydown',event=>event.stopPropagation());
    // Native dialog focus can enter browser chrome at a Tab boundary. Keep the
    // menu's action sequence cyclic without intercepting browser shortcuts.
    dialog.addEventListener('keydown',event=>{
      if(event.key!=='Tab'||!dialog.open||event.altKey||event.ctrlKey||event.metaKey)return;
      const focusable=[...dialog.querySelectorAll('button')].filter(b=>!b.disabled&&!b.hidden&&b.tabIndex>=0&&b.getClientRects().length);
      if(!focusable.length)return;
      const first=focusable[0],last=focusable.at(-1),active=doc.activeElement;
      if((event.shiftKey&&active===first)||(!event.shiftKey&&active===last)||!focusable.includes(active)){
        event.preventDefault();(event.shiftKey?last:first).focus();
      }
    });
    const updateNotice=()=>{
      const active=buttons.some(button=>!button.hidden&&[...button.querySelectorAll('.badge')].some(b=>b.textContent.trim()));
      notice.hidden=!active;launch.setAttribute('aria-label',spec.title+(active?', updates available':''));
    };
    if(typeof MutationObserver==='function')new MutationObserver(updateNotice).observe(dialog,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['hidden']});
    updateNotice();
  }
  return true;
}
if(typeof document!=='undefined'){
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>installCornerMenus(document),{once:true});
  else installCornerMenus(document);
}
