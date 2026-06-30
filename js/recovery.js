
(() => {
  'use strict';
  const BUILD = 'v0.5.0';
  const $ = (id) => document.getElementById(id);
  const hide = (id) => { const el=$(id); if(el) el.classList.add('hidden'); };
  const show = (id) => { const el=$(id); if(el) el.classList.remove('hidden'); };

  function forceFullWindow(){
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    document.body.classList.add('fullscreen-mode');
  }

  function closeAllOverlays(){
    document.querySelectorAll('.overlay').forEach(o => { o.classList.add('hidden'); o.style.display=''; });
    document.body.classList.remove('menu-protocol-open');
  }

  function openOverlayDirect(id){
    const target = $(id);
    if(!target){ updateInfo('Missing protocol: ' + id, true); return; }
    hide('bootScreen');
    hide('app');
    hide('mainMenu');
    closeAllOverlays();
    target.classList.remove('hidden');
    target.style.display = 'grid';
    target.style.zIndex = '9000';
    target.style.pointerEvents = 'auto';
    document.body.classList.add('menu-protocol-open');
    updateInfo('Protocol opened. Press Esc or Close to return.');
    try {
      if(id === 'anomalyOverlay' && window.AV && window.AV.openOverlay){ window.AV.openOverlay(id); }
      if(id === 'inventoryOverlay' && window.AV && window.AV.openOverlay){ window.AV.openOverlay(id); }
      if(id === 'progressionOverlay' && window.AV && window.AV.openOverlay){ window.AV.openOverlay(id); }
    } catch(err){ console.warn('AV overlay render fallback:', err); }
  }

  function returnToMenu(){
    closeAllOverlays();
    hide('bootScreen');
    hide('app');
    show('mainMenu');
    document.body.classList.remove('game-active');
    forceFullWindow();
  }

  function startDirect(fresh=true){
    closeAllOverlays();
    hide('bootScreen');
    hide('mainMenu');
    show('app');
    document.body.classList.add('game-active');
    forceFullWindow();
    try{
      if(window.AV && typeof window.AV.startGame === 'function'){
        window.AV.startGame(!!fresh);
      }
    }catch(err){ console.warn('AV start fallback:', err); }
    const canvas=$('game');
    if(canvas){ try{ canvas.focus({preventScroll:true}); }catch(e){ canvas.focus(); } }
  }

  function updateInfo(msg, warn=false){
    const info=$('menuInfo');
    if(info){ info.textContent=msg; info.classList.toggle('warn', !!warn); info.classList.add('ok'); }
  }

  function fullscreen(){
    forceFullWindow();
    try{ if(!document.fullscreenElement && document.documentElement.requestFullscreen){ document.documentElement.requestFullscreen().catch(()=>{}); } }catch(e){}
  }

  const ROUTES = {
    continueBtn: () => startDirect(false),
    newGameBtn: () => startDirect(true),
    launchStart: () => startDirect(true),
    fractureIndexBtn: () => openOverlayDirect('fractureOverlay'),
    operatorFilesBtn: () => openOverlayDirect('operatorOverlay'),
    anomalyIndexBtn: () => openOverlayDirect('anomalyOverlay'),
    inventoryDbBtn: () => openOverlayDirect('inventoryOverlay'),
    progressionBtn: () => openOverlayDirect('progressionOverlay'),
    missionMenuBtn: () => openOverlayDirect('missionOverlay'),
    configBtn: () => openOverlayDirect('configOverlay'),
    menuFullscreenBtn: fullscreen,
    fullscreenBtn: fullscreen,
    missionBtn: () => openOverlayDirect('missionOverlay'),
    progressionTopBtn: () => openOverlayDirect('progressionOverlay'),
    playtestBtn: () => openOverlayDirect('playtestOverlay'),
    menuBtn: returnToMenu
  };

  function routeButton(btn, ev){
    const id = btn && btn.id;
    if(!id || !ROUTES[id]) return false;
    if(ev){ ev.preventDefault(); ev.stopPropagation(); if(ev.stopImmediatePropagation) ev.stopImmediatePropagation(); }
    ROUTES[id]();
    return true;
  }

  function install(){
    forceFullWindow();
    // Correct visible build labels, even if older cached HTML text remains.
    document.querySelectorAll('.boot-header span:last-child').forEach(el => el.textContent = BUILD + ' // MENU FIT PATCH');
    document.querySelectorAll('.ui-kit-note b').forEach(el => el.textContent = 'AVOS UI KIT ' + BUILD);
    const title=document.querySelector('title'); if(title) title.textContent='Project: ASH VECTOR - ' + BUILD;

    Object.keys(ROUTES).forEach(id => {
      const el=$(id);
      if(el){
        el.style.pointerEvents='auto';
        el.onclick = (e) => routeButton(el,e);
      }
    });

    document.addEventListener('click', (e) => {
      const btn = e.target.closest && e.target.closest('button');
      if(btn && routeButton(btn,e)) return;
      if(e.target.closest && e.target.closest('#bootScreen')){
        const logo=$('bootLogo');
        if(logo && !logo.classList.contains('hidden')){ e.preventDefault(); returnToMenu(); }
      }
    }, true);

    document.addEventListener('keydown', (e) => {
      const menuVisible = $('mainMenu') && !$('mainMenu').classList.contains('hidden');
      const bootVisible = $('bootScreen') && !$('bootScreen').classList.contains('hidden');
      if((e.key === 'Enter' || e.key === ' ') && menuVisible){ e.preventDefault(); startDirect(true); return; }
      if((e.key === 'Enter' || e.key === ' ') && bootVisible){ e.preventDefault(); returnToMenu(); return; }
      if(e.key === 'Escape'){
        const overlayOpen = Array.from(document.querySelectorAll('.overlay')).some(o=>!o.classList.contains('hidden'));
        if(overlayOpen){ e.preventDefault(); returnToMenu(); return; }
      }
    }, true);

    document.querySelectorAll('.modal-close').forEach(btn => { btn.onclick = (e) => { e.preventDefault(); returnToMenu(); }; });

    // Failsafe: if the boot screen hangs or the user misses the prompt, expose the menu.
    setTimeout(() => {
      if($('bootScreen') && !$('bootScreen').classList.contains('hidden')){
        const logo=$('bootLogo');
        if(logo) logo.classList.remove('hidden');
      }
    }, 2500);
  }

  window.AV_RECOVERY = { start:startDirect, menu:returnToMenu, open:openOverlayDirect, fullscreen };
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install);
  else install();
})();
