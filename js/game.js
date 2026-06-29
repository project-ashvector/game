(() => {
  const $ = id => document.getElementById(id);
  const canvas = $('game');
  const ctx = canvas.getContext('2d');
  const mini = $('minimap');
  const mctx = mini.getContext('2d');
  const TILE = 42;
  const VIEW_W = canvas.width, VIEW_H = canvas.height;
  const bootLines = [
    'ASH VECTOR OPERATING SYSTEM',
    'Version 0.3.0 // REAL ENGINE SPRINT',
    'Initializing...',
    'Connecting to ASH Network...',
    'Connection Established.',
    'Loading Classified Archives...',
    'Operator Database... ONLINE',
    'Anomaly Database... ONLINE',
    'Reality Integrity...',
    'ERROR',
    'Reality Integrity: 18%',
    'WARNING: Unauthorized access detected.',
    'Can you hear me...?',
  ];
  const baseMap = [
    '########################################',
    '#P....C......#...............L.........#',
    '#.######.###.#.###########.#####.#####.#',
    '#......#...#.#.....E.....#.....#.....#.#',
    '######.###.#.#####.#####.#####.###.#.#.#',
    '#......#...#.....#.....#.....#...#.#...#',
    '#.######.#######.#####.#####.###.#.###.#',
    '#......#.......#.....#.....#.....#...#.#',
    '#.####.#######.#####.#####.#########.#.#',
    '#.#..#.......#.....#.....#.....C.....#.#',
    '#.#S.#######.#####.#####.###########.#.#',
    '#.#..#.....#.....#.....#.....E.....#.#.#',
    '#.##.#.###.#####.#####.#########.#.#.#.#',
    '#....#...#.....#.....#.........#.#.#...#',
    '########.#####.#####.#########.#.#.#####',
    '#......#.....#.....#.....H...#.#.#.....#',
    '#.####.#####.#####.#######.###.#.#####.#',
    '#....#.....#.....#.......#.....#.....#.#',
    '#.##.#####.#####.#######.###########.#.#',
    '#..#.....#.....#.....E.#.............#.#',
    '##.#####.#####.#######.###############.#',
    '#......#.....#.......#.................#',
    '#.####.#####.#######.###############D###',
    '#....#.......#.................B.......X#',
    '########################################'
  ];
  const enemyDefs = {
    E: {id:'an001_rust_hound', name:'AN-001 Rust Hound', hp:34, maxHp:34, atk:8, xp:18, credits:12, img:'assets/anomalies/an001_rust_hound/battle.png', loot:['Scrap Metal']},
    B: {id:'boss001_rust_mother', name:'BOSS-001 Rust Mother', hp:90, maxHp:90, atk:13, xp:80, credits:80, img:'assets/anomalies/boss001_rust_mother/battle.png', loot:['Rust Core','Corrupted Catalyst']}
  };
  const attacks = [
    {name:'Vector Slash', dmg:12, ep:0, text:'Vyra cuts through corrupted air.'},
    {name:'Phantom Dash', dmg:9, ep:4, status:'dodge', text:'Vyra becomes everyone else\'s problem.'},
    {name:'Crimson Cascade', dmg:18, ep:8, text:'A red arc crashes into the target.'},
    {name:'Emergency Flex', dmg:-18, ep:6, heal:true, text:'Weaponized ego restores HP.'}
  ];
  let state = newGameState();
  let battle = null; let camera = {x:0,y:0}; let bootDone=false;
  const images = {};
  function newGameState(){
    const map = baseMap.map(r => r.split(''));
    let px=1,py=1;
    map.forEach((row,y)=>row.forEach((c,x)=>{if(c==='P'){px=x;py=y;map[y][x]='.';}}));
    return {map, player:{x:px,y:py,level:1,xp:0,nextXp:45,hp:60,maxHp:60,ep:20,maxEp:20,atk:10,def:3,credits:0}, inventory:{'Med Patch':2}, flags:{terminal:false,lore:false,key:false,bossUnlocked:false,chapterComplete:false,anomaliesCleared:0,chests:0}, log:['AVOS connection established.'], visited:{}, settings:{crt:true,reducedMotion:false,largeText:false}};
  }
  function loadImages(){
    const paths = ['assets/operators/av001/portrait.png','assets/operators/av001/battle.png','assets/anomalies/an001_rust_hound/battle.png','assets/anomalies/boss001_rust_mother/battle.png'];
    paths.forEach(p=>{const im=new Image(); im.src=p; images[p]=im;});
  }
  function save(){localStorage.setItem('ashVectorSave', JSON.stringify(state)); toast('Archive saved.'); renderUI();}
  function load(){const s=localStorage.getItem('ashVectorSave'); if(s){state=JSON.parse(s); toast('Archive loaded.'); applySettings(); renderAll();} else toast('No archive found.');}
  function log(msg){state.log.unshift(msg); state.log=state.log.slice(0,7); renderUI();}
  function toast(msg){let t=document.createElement('div');t.className='toast';t.textContent=msg;document.body.appendChild(t);setTimeout(()=>t.remove(),1800)}
  function boot(){
    let i=0; const lines=$('bootLines'); const prog=$('bootProgress').firstElementChild;
    function step(){
      if(i<bootLines.length){lines.textContent += '> '+bootLines[i++]+'\n'; prog.style.width=Math.min(100, i/bootLines.length*100)+'%'; setTimeout(step, state.settings.reducedMotion?30:260);} else {$('bootLogo').classList.remove('hidden'); bootDone=true;}}
    step();
  }
  function showMenu(){hideAll(); document.body.classList.remove('game-active'); $('mainMenu').classList.remove('hidden');}
  function startGame(fresh=false){if(fresh) state=newGameState(); hideAll(); document.body.classList.add('game-active'); $('app').classList.remove('hidden'); canvas.focus({preventScroll:true}); renderAll();}
  function hideAll(){['bootScreen','mainMenu','app'].forEach(id=>$(id)?.classList.add('hidden')); document.querySelectorAll('.overlay').forEach(o=>o.classList.add('hidden'));}
  function tileAt(x,y){return state.map[y]?.[x] ?? '#';}
  function setTile(x,y,v){if(state.map[y]) state.map[y][x]=v;}
  function isBlocked(c){return c==='#' || c==='D';}
  function tryMove(dx,dy){if(battle) return; const nx=state.player.x+dx, ny=state.player.y+dy; const c=tileAt(nx,ny); if(isBlocked(c)){if(c==='D') handleDoor(nx,ny); else toast('Blocked.'); return;} state.player.x=nx; state.player.y=ny; state.visited[`${nx},${ny}`]=1; handleTile(c,nx,ny); renderAll();}
  function handleDoor(x,y){ if(state.flags.bossUnlocked || state.flags.key || state.flags.anomaliesCleared>=3){setTile(x,y,'.'); state.flags.bossUnlocked=true; log('Boss route unlocked. Door security embarrassed itself.'); renderAll();} else toast('Boss gate locked. Clear 3 anomalies or find access.'); }
  function handleTile(c,x,y){
    if(c==='C'){setTile(x,y,'.'); state.flags.chests++; addItem('Med Patch',1); addCredits(20); log('Standard Cache opened: Med Patch + 20 credits.');}
    if(c==='S'){state.flags.terminal=true; save(); log('Recovery Terminal synced your archive.');}
    if(c==='H'){state.player.hp=state.player.maxHp; state.player.ep=state.player.maxEp; log('Healing station restored HP/EP.');}
    if(c==='L'){setTile(x,y,'.'); state.flags.lore=true; addItem('Archive Log 001',1); log('Recovered Archive 001: The First Vector.');}
    if(c==='E'||c==='B'){startBattle(c,x,y);}
    if(c==='X'){ if(state.flags.chapterComplete){toast('Chapter already complete.');} else if(state.flags.bossUnlocked && state.flags.anomaliesCleared>=3){state.flags.chapterComplete=true; log('Chapter 1 complete: Toxic Core recovered.'); toast('CHAPTER 1 COMPLETE');} else toast('Exit protocol denied. Finish the objective.');}
  }
  function addItem(name,n=1){state.inventory[name]=(state.inventory[name]||0)+n;}
  function addCredits(n){state.player.credits+=n;}
  function startBattle(code,x,y){ const def=JSON.parse(JSON.stringify(enemyDefs[code])); battle={code,x,y,enemy:def,turn:'player',guard:false}; $('battleTitle').textContent=def.name; $('battleEnemy').src=def.img; $('battleHero').src='assets/operators/av001/battle.png'; $('battleText').textContent='Choose a combat protocol.'; document.querySelectorAll('.overlay').forEach(o=>o.classList.add('hidden')); $('battleOverlay').classList.remove('hidden'); renderBattle(); }
  function renderBattle(){ if(!battle)return; $('battleHp').innerHTML=`<div class="statrow">${battle.enemy.name} HP ${battle.enemy.hp}/${battle.enemy.maxHp}<div class="bar"><span style="width:${100*battle.enemy.hp/battle.enemy.maxHp}%"></span></div></div><div class="statrow">Vyra HP ${state.player.hp}/${state.player.maxHp}<div class="bar"><span style="width:${100*state.player.hp/state.player.maxHp}%"></span></div></div><div class="statrow">EP ${state.player.ep}/${state.player.maxEp}<div class="bar ep"><span style="width:${100*state.player.ep/state.player.maxEp}%"></span></div></div>`;
    $('attackButtons').innerHTML=''; attacks.forEach((a,i)=>{let b=document.createElement('button'); b.textContent=`${a.name}${a.ep?' - '+a.ep+'EP':''}`; b.disabled=state.player.ep<a.ep; b.onclick=()=>playerAttack(i); $('attackButtons').appendChild(b);}); }
  function playerAttack(i){ if(!battle||battle.turn!=='player')return; const a=attacks[i]; if(state.player.ep<a.ep){toast('Not enough EP.');return;} state.player.ep-=a.ep; if(a.heal){state.player.hp=Math.min(state.player.maxHp,state.player.hp+18); $('battleText').textContent=a.text;} else {let crit=Math.random()<0.15; let dmg=Math.max(1,a.dmg+state.player.atk-3+(crit?8:0)); battle.enemy.hp=Math.max(0,battle.enemy.hp-dmg); $('battleText').textContent=`${a.text} ${crit?'CRITICAL ':''}-${dmg} HP.`;}
    renderBattle(); if(battle.enemy.hp<=0){winBattle();} else {battle.turn='enemy'; setTimeout(enemyTurn,650);} }
  function enemyTurn(){ if(!battle)return; let dodge = Math.random()<0.08; let dmg = dodge?0:Math.max(1,battle.enemy.atk-state.player.def+Math.floor(Math.random()*5)); if(dmg) state.player.hp=Math.max(0,state.player.hp-dmg); $('battleText').textContent = dodge ? 'Vyra dodged. The anomaly looked personally offended.' : `${battle.enemy.name} attacks. -${dmg} HP.`; if(state.player.hp<=0){state.player.hp=1; $('battleText').textContent+=' Emergency archive recovery prevented death.'; log('Defeat prevented by developer build mercy.');} battle.turn='player'; renderBattle(); renderUI(); }
  function winBattle(){ const e=battle.enemy; setTile(battle.x,battle.y,'.'); state.flags.anomaliesCleared += battle.code==='E'?1:0; if(battle.code==='B'){state.flags.bossUnlocked=true; addItem('Rust Core',1);} gainXp(e.xp); addCredits(e.credits); e.loot.forEach(item=>addItem(item,1)); log(`Victory: ${e.name}. +${e.xp} Sync, +${e.credits} credits, loot recovered.`); battle=null; $('battleOverlay').classList.add('hidden'); renderAll(); }
  function gainXp(n){ state.player.xp+=n; while(state.player.xp>=state.player.nextXp){state.player.xp-=state.player.nextXp; state.player.level++; state.player.nextXp=Math.floor(state.player.nextXp*1.35); state.player.maxHp+=10; state.player.maxEp+=4; state.player.atk+=2; state.player.def+=1; state.player.hp=state.player.maxHp; state.player.ep=state.player.maxEp; log(`Synchronization increased. Level ${state.player.level}.`);} }
  function useMedPatch(){ if((state.inventory['Med Patch']||0)<=0){toast('No Med Patch available.');return;} if(state.player.hp>=state.player.maxHp){toast('HP already full.');return;} state.inventory['Med Patch']--; state.player.hp=Math.min(state.player.maxHp,state.player.hp+25); log('Used Med Patch. +25 HP.'); renderAll(); }
  function render(){
    ctx.clearRect(0,0,VIEW_W,VIEW_H); camera.x=Math.max(0, Math.min(state.player.x*TILE - VIEW_W/2, state.map[0].length*TILE - VIEW_W)); camera.y=Math.max(0, Math.min(state.player.y*TILE - VIEW_H/2, state.map.length*TILE - VIEW_H));
    ctx.save(); ctx.translate(-camera.x,-camera.y);
    for(let y=0;y<state.map.length;y++) for(let x=0;x<state.map[y].length;x++){drawTile(state.map[y][x],x*TILE,y*TILE,x,y)}
    // player
    const px=state.player.x*TILE, py=state.player.y*TILE; ctx.fillStyle='#eee'; ctx.fillRect(px+8,py+6,26,30); ctx.fillStyle='#bd1f2d'; ctx.fillRect(px+5,py+24,32,14); ctx.fillStyle='#111'; ctx.fillRect(px+13,py+12,5,5); ctx.fillRect(px+24,py+12,5,5); ctx.strokeStyle='#ff3048'; ctx.lineWidth=3; ctx.strokeRect(px+4,py+4,34,34);
    ctx.restore();
  }
  function drawTile(c,x,y,tx,ty){
    const floor=((tx+ty)%2)?'#20252b':'#242a31'; ctx.fillStyle=floor; ctx.fillRect(x,y,TILE,TILE); ctx.strokeStyle='rgba(255,255,255,.04)'; ctx.strokeRect(x,y,TILE,TILE);
    if(c==='#'){ctx.fillStyle='#101318';ctx.fillRect(x,y,TILE,TILE);ctx.fillStyle='#2d333b';ctx.fillRect(x+4,y+4,TILE-8,TILE-8)}
    if(c==='C'){ctx.fillStyle='#9b6b22';ctx.fillRect(x+9,y+13,24,20);ctx.strokeStyle='#e0b64b';ctx.strokeRect(x+9,y+13,24,20)}
    if(c==='S'){ctx.fillStyle='#25567d';ctx.fillRect(x+8,y+6,26,30);ctx.fillStyle='#70d7ff';ctx.fillRect(x+13,y+12,16,8)}
    if(c==='H'){ctx.fillStyle='#216d45';ctx.fillRect(x+8,y+8,26,26);ctx.fillStyle='#fff';ctx.fillRect(x+18,y+12,6,18);ctx.fillRect(x+12,y+18,18,6)}
    if(c==='L'){ctx.fillStyle='#4b316f';ctx.fillRect(x+11,y+8,20,28);ctx.fillStyle='#d2a8ff';ctx.fillRect(x+15,y+13,12,3);ctx.fillRect(x+15,y+20,12,3)}
    if(c==='E'||c==='B'){ctx.fillStyle=c==='B'?'#72202b':'#5c4e41';ctx.beginPath();ctx.arc(x+21,y+21,c==='B'?18:14,0,Math.PI*2);ctx.fill();ctx.fillStyle='#ff3048';ctx.fillRect(x+13,y+16,6,4);ctx.fillRect(x+24,y+16,6,4)}
    if(c==='D'){ctx.fillStyle='#5a3422';ctx.fillRect(x+6,y+2,30,38);ctx.fillStyle='#e0b64b';ctx.fillRect(x+29,y+20,4,4)}
    if(c==='X'){ctx.fillStyle='#eee';ctx.fillRect(x+6,y+6,30,30);ctx.fillStyle='#050608';ctx.fillText('X',x+16,y+27)}
  }
  function renderMini(){
    const w=state.map[0].length,h=state.map.length; mctx.clearRect(0,0,mini.width,mini.height); const sx=mini.width/w, sy=mini.height/h;
    for(let y=0;y<h;y++) for(let x=0;x<w;x++){const c=tileAt(x,y); mctx.fillStyle=c==='#'?'#111':c==='C'?'#e0b64b':c==='E'||c==='B'?'#bd1f2d':c==='X'?'#fff':'#303842'; mctx.fillRect(x*sx,y*sy,Math.ceil(sx),Math.ceil(sy));}
    mctx.fillStyle='#ff3048'; mctx.fillRect(state.player.x*sx,state.player.y*sy,Math.ceil(sx*2),Math.ceil(sy*2));
  }
  function renderUI(){ const p=state.player; $('stats').innerHTML=`<div class="statrow">Level ${p.level} // Credits ${p.credits}</div><div class="statrow">HP ${p.hp}/${p.maxHp}<div class="bar"><span style="width:${100*p.hp/p.maxHp}%"></span></div></div><div class="statrow">EP ${p.ep}/${p.maxEp}<div class="bar ep"><span style="width:${100*p.ep/p.maxEp}%"></span></div></div><div class="statrow">Sync ${p.xp}/${p.nextXp}<div class="bar xp"><span style="width:${100*p.xp/p.nextXp}%"></span></div></div>`;
    $('fractureStatus').innerHTML=`<div class="statrow">Anomalies Cleared: ${state.flags.anomaliesCleared}/3</div><div class="statrow">Boss Route: ${state.flags.bossUnlocked?'Unlocked':'Locked'}</div><div class="statrow">Chapter: ${state.flags.chapterComplete?'Complete':'Active'}</div>`;
    $('inventory').innerHTML=Object.entries(state.inventory).map(([k,v])=>`<div class="invrow"><b>${k}</b> x${v} ${k==='Med Patch'?'<button onclick="window.AV.useMedPatch()">Use</button>':''}</div>`).join('')||'<div class="invrow">No recovered assets.</div>';
    $('log').innerHTML=state.log.map(l=>`<div class="logrow">${l}</div>`).join('');
    $('roster').innerHTML='<div class="statrow"><b>AV-001 Vyra</b><br>Active Operator</div>';
    const objectives=[['Reach recovery terminal',state.flags.terminal],['Clear 3 Rust Hounds',state.flags.anomaliesCleared>=3],['Unlock boss gate',state.flags.bossUnlocked],['Defeat Rust Mother / reach exit',state.flags.chapterComplete]];
    $('objectiveTracker').innerHTML=objectives.map(([t,done])=>`${done?'✅':'⬜'} ${t}`).join(' &nbsp; ');
    $('missionProgress').innerHTML=objectives.map(([t,done])=>`<div class="mission-row">${done?'✅':'⬜'} ${t}</div>`).join('');
    $('missionChecklist') && ($('missionChecklist').innerHTML=$('missionProgress').innerHTML);
    $('qaState') && ($('qaState').innerHTML=`<div class="statrow">Position: ${p.x}, ${p.y}</div><div class="statrow">HP: ${p.hp}/${p.maxHp}</div><div class="statrow">Flags: ${JSON.stringify(state.flags)}</div>`);
  }
  function renderAll(){render(); renderMini(); renderUI();}
  function openOverlay(id){document.querySelectorAll('.overlay').forEach(o=>o.classList.add('hidden')); $(id).classList.remove('hidden'); if(id==='anomalyOverlay') renderAnomalyDb(); if(id==='inventoryOverlay') renderInventoryDb(); if(id==='missionOverlay') renderUI(); if(id==='playtestOverlay') renderUI();}
  function renderAnomalyDb(){ $('anomalyList').innerHTML='<button data-a="E">AN-001 Rust Hound</button><button data-a="B">BOSS-001 Rust Mother</button>'; document.querySelectorAll('#anomalyList button').forEach(b=>b.onclick=()=>{const d=enemyDefs[b.dataset.a]; $('anomalyFile').innerHTML=`<div class="record-kicker">${d.id}</div><h2>${d.name}</h2><img src="${d.img}" style="max-width:220px"><div class="record-grid"><div><b>HP</b><span>${d.maxHp}</span></div><div><b>ATK</b><span>${d.atk}</span></div><div><b>Loot</b><span>${d.loot.join(', ')}</span></div><div><b>Credits</b><span>${d.credits}</span></div></div>`;});}
  function renderInventoryDb(){ $('inventoryDatabaseList').innerHTML=Object.entries(state.inventory).map(([k,v])=>`<div class="invrow"><b>${k}</b><br>Quantity: ${v}</div>`).join('')||'No items.'; }
  function applySettings(){ document.body.classList.toggle('no-crt', !state.settings.crt); document.body.classList.toggle('reduced-motion', !!state.settings.reducedMotion); document.body.classList.toggle('large-text', !!state.settings.largeText); }
  function bind(){
    $('enterBtn').onclick=showMenu; document.addEventListener('keydown',e=>{
      const gameIsOpen = !$('app').classList.contains('hidden');
      const overlayOpen = Array.from(document.querySelectorAll('.overlay')).some(o=>!o.classList.contains('hidden'));
      if(e.key==='Enter' && bootDone && !$('bootScreen').classList.contains('hidden')){ e.preventDefault(); showMenu(); return; }
      if(e.key==='F9'){ e.preventDefault(); openOverlay('playtestOverlay'); return; }
      if(gameIsOpen && !overlayOpen && ['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key)){
        e.preventDefault();
        if(e.key==='ArrowUp')tryMove(0,-1);
        if(e.key==='ArrowDown')tryMove(0,1);
        if(e.key==='ArrowLeft')tryMove(-1,0);
        if(e.key==='ArrowRight')tryMove(1,0);
      }
    }, {passive:false});
    $('newGameBtn').onclick=()=>startGame(true); $('continueBtn').onclick=()=>{load(); startGame(false)}; $('menuBtn').onclick=showMenu; $('saveBtn').onclick=save; $('loadBtn').onclick=load; $('resetBtn').onclick=()=>{localStorage.removeItem('ashVectorSave'); state=newGameState(); renderAll(); toast('Archive purged.');};
    $('operatorFilesBtn').onclick=()=>openOverlay('operatorOverlay'); $('anomalyIndexBtn').onclick=()=>openOverlay('anomalyOverlay'); $('fractureIndexBtn').onclick=()=>openOverlay('fractureOverlay'); $('inventoryDbBtn').onclick=()=>openOverlay('inventoryOverlay'); $('missionMenuBtn').onclick=()=>openOverlay('missionOverlay'); $('missionBtn').onclick=()=>openOverlay('missionOverlay'); $('configBtn').onclick=()=>openOverlay('configOverlay'); $('playtestBtn').onclick=()=>openOverlay('playtestOverlay');
    ['closeOperatorDb','closeAnomalyDb','closeFractureDb','closeInventoryDb','closeMission','closePlaytest','closeConfig'].forEach(id=>$(id) && ($(id).onclick=()=>document.querySelectorAll('.overlay').forEach(o=>o.classList.add('hidden'))));
    document.querySelectorAll('[data-move]').forEach(b=>b.onclick=()=>({up:()=>tryMove(0,-1),down:()=>tryMove(0,1),left:()=>tryMove(-1,0),right:()=>tryMove(1,0)}[b.dataset.move]()));
    $('settingCrt').onchange=e=>{state.settings.crt=e.target.checked;applySettings()}; $('settingMotion').onchange=e=>{state.settings.reducedMotion=e.target.checked;applySettings()}; $('settingLargeText').onchange=e=>{state.settings.largeText=e.target.checked;applySettings()};
    $('qaHeal').onclick=()=>{state.player.hp=state.player.maxHp;state.player.ep=state.player.maxEp;renderAll();}; $('qaCredits').onclick=()=>{addCredits(100);renderAll();}; $('qaClearAnomalies').onclick=()=>{state.flags.anomaliesCleared=3;state.flags.bossUnlocked=true;renderAll();}; $('qaBossReady').onclick=()=>{state.flags.bossUnlocked=true;renderAll();}; $('qaCompleteChapter').onclick=()=>{state.flags.chapterComplete=true;renderAll();}; $('qaResetRun').onclick=()=>{state=newGameState();renderAll();}; $('qaPath').onclick=()=>toast('Route: Terminal → 3 Anomalies → Door → Boss → Exit');
  }
  window.AV={useMedPatch}; loadImages(); bind(); applySettings(); boot(); renderAll();
})();
