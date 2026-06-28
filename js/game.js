const TILE = 42;
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const $ = id => document.getElementById(id);
const logBox = $('log'), statsBox = $('stats'), invBox = $('inventory'), rosterBox = $('roster'), fractureStatus = $('fractureStatus');
const overlay = $('battleOverlay'), battleEnemyImg = $('battleEnemy'), battleTitle = $('battleTitle'), battleText = $('battleText'), battleHp = $('battleHp'), attackButtons = $('attackButtons');
const anomalyOverlay = $('anomalyOverlay'), anomalyList = $('anomalyList'), anomalyFile = $('anomalyFile');
const operatorOverlay = $('operatorOverlay'), fractureOverlay = $('fractureOverlay');
const bootScreen = $('bootScreen'), mainMenu = $('mainMenu'), app = $('app'), bootTerminal = $('bootTerminal'), bootLines = $('bootLines'), bootProgress = document.querySelector('#bootProgress span'), bootLogo = $('bootLogo'), enterBtn = $('enterBtn'), menuInfo = $('menuInfo');

const SAVE_KEY = 'project_ashvector_archive_001';
const BOOT_SEQUENCE = [
  {t:'ASH VECTOR OPERATING SYSTEM'}, {t:'Version 0.0.1 // Developer Build'}, {t:''},
  {t:'Initializing...'}, {t:'████████████████████ 100%'}, {t:'Connecting to ASH Network...'}, {t:'Connection Established.'},
  {t:'Loading Classified Archives...'}, {t:'Operator Database... ONLINE'}, {t:'Anomaly Database... ONLINE'}, {t:'Fracture Index... ONLINE'},
  {t:'Reality Integrity...'}, {t:'ERROR', glitch:true}, {t:'Reality Integrity: 18%', glitch:true}, {t:''},
  {t:'WARNING', glitch:true}, {t:'Unauthorized access detected.', glitch:true}, {t:''}, {t:'Can you hear me...?'}, {t:''}, {t:'PROJECT:'}, {t:'ASH VECTOR', glitch:true}
];
let bootComplete = false, audioCtx = null;
function beep(freq=520, dur=0.035, type='square'){ try{ audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)(); const osc=audioCtx.createOscillator(), gain=audioCtx.createGain(); osc.type=type; osc.frequency.value=freq; gain.gain.value=0.035; osc.connect(gain); gain.connect(audioCtx.destination); osc.start(); gain.gain.exponentialRampToValueAtTime(0.0001,audioCtx.currentTime+dur); osc.stop(audioCtx.currentTime+dur); }catch(e){} }
function typeLine(line, done){ let j=0, text=line.t; if(!text){ bootLines.textContent+='\n'; done(); return; } const typer=setInterval(()=>{ bootLines.textContent += text[j] || ''; if(text[j] && text[j] !== ' ') beep(line.glitch?180+Math.random()*80:460+Math.random()*120,.02,line.glitch?'sawtooth':'square'); j++; if(j>text.length){ clearInterval(typer); bootLines.textContent+='\n'; if(line.glitch){ bootTerminal.classList.add('glitch-hit'); setTimeout(()=>bootTerminal.classList.remove('glitch-hit'),300); } done(); } }, line.glitch?16:24); }
function runBoot(){ let i=0; bootLines.textContent=''; bootProgress.style.width='0%'; function next(){ bootProgress.style.width=Math.floor((i/BOOT_SEQUENCE.length)*100)+'%'; if(i>=BOOT_SEQUENCE.length){ bootProgress.style.width='100%'; setTimeout(()=>{ bootLogo.classList.remove('hidden'); bootComplete=true; beep(880,.08,'triangle');},450); return; } typeLine(BOOT_SEQUENCE[i++], next); } next(); }
function enterArchive(){ if(!bootComplete){ bootLines.textContent=BOOT_SEQUENCE.map(x=>x.t).join('\n')+'\n'; bootProgress.style.width='100%'; bootLogo.classList.remove('hidden'); bootComplete=true; return; } bootScreen.classList.add('hidden'); mainMenu.classList.remove('hidden'); beep(700,.08,'triangle'); }
function openGame(loadExisting=false){ mainMenu.classList.add('hidden'); app.classList.remove('hidden'); if(loadExisting) load(false); draw(); }
function showMenuInfo(text){ menuInfo.textContent=text; beep(520,.035,'square'); }

const DATA = {
  character:{ id:'vyra', name:'Vyra', operatorId:'AV-001', callSign:'Black Neon', status:'ACTIVE', rarity:'Starter / 5-Star Prototype', element:'Void', role:'Fast damage dealer', clearance:'Level 5', portrait:'assets/operators/vyra/portrait.png', battle:'assets/operators/vyra/battle.png', icon:'assets/operators/vyra/icon.png', spriteSheet:'assets/operators/vyra/sprite_sheet.png', baseStats:{hp:42,atk:9,def:4,spd:8,luck:3}, attacks:[ {name:'Neon Slash', power:9, type:'attack', line:'Vyra cuts the air so hard the sewer asks for therapy.'}, {name:'Trash Talk', power:5, type:'debuff', line:'Vyra insults the enemy\'s entire bloodline and questionable smell.'}, {name:'Void Kick', power:13, type:'attack', line:'A kick powered by bad decisions and premium neon.'}, {name:'Emergency Flex', power:10, type:'heal', line:'Vyra heals herself by pretending this was all planned.'} ] },
  enemies:{
    toxic_slime:{id:'toxic_slime',name:'Toxic Slime',hp:24,atk:5,def:1,xp:12,classification:'BIOHAZARD GEL',threatLevel:'D',asset:'assets/anomalies/toxic_slime/battle.png',icon:'assets/anomalies/toxic_slime/icon.png',profile:'assets/anomalies/toxic_slime/profile.png',loot:['med_patch'],line:'It bubbles like expired soda and looks personally offended.',description:'A sewer-born acidic gel that smells like expired soda and poor municipal planning.'},
    rust_rat:{id:'rust_rat',name:'Rust Rat',hp:32,atk:7,def:2,xp:18,classification:'SCRAP VERMIN',threatLevel:'C',asset:'assets/anomalies/rust_rat/battle.png',icon:'assets/anomalies/rust_rat/icon.png',profile:'assets/anomalies/rust_rat/profile.png',loot:['credit_chip'],line:'A rat wearing scrap metal like it pays rent here.',description:'A metal-chewing rat wearing scrap armor like it has a tiny apocalypse appointment.'},
    cable_wraith:{id:'cable_wraith',name:'Cable Wraith',hp:38,atk:8,def:3,xp:24,classification:'TECHNO-PHANTOM',threatLevel:'B',asset:'assets/anomalies/cable_wraith/battle.png',icon:'assets/anomalies/cable_wraith/icon.png',profile:'assets/anomalies/cable_wraith/profile.png',loot:['stale_energy_drink'],line:'A haunted cable bundle. Somehow still charges microtransactions.',description:'A ghost-like knot of cables, static, and bad customer support energy.'},
    sewer_king:{id:'sewer_king',name:'The Sewer King',hp:75,atk:10,def:4,xp:60,classification:'BOSS-CLASS ABYSSAL',threatLevel:'A',asset:'assets/anomalies/sewer_king/battle.png',icon:'assets/anomalies/sewer_king/icon.png',profile:'assets/anomalies/sewer_king/profile.png',loot:['toxic_core'],line:'He rules a kingdom of sludge. Honestly, still better than some landlords.',description:'A sludge monarch squatting in Sector 001 with a crown, a smell, and absolutely no valid leadership skills.'}
  },
  items:{ med_patch:{id:'med_patch',name:'Med Patch',type:'heal',value:20,asset:'assets/items/med_patch.png'}, stale_energy_drink:{id:'stale_energy_drink',name:'Stale Energy Drink',type:'buff',value:4,asset:'assets/items/stale_energy_drink.png'}, rust_key:{id:'rust_key',name:'Rust Key',type:'key',value:1,asset:'assets/items/rust_key.png'}, credit_chip:{id:'credit_chip',name:'Credit Chip',type:'currency',value:10,asset:'assets/items/credit_chip.png'}, toxic_core:{id:'toxic_core',name:'Toxic Core',type:'quest',value:1,asset:'assets/items/toxic_core.png'} }
};

const FRACTURE = {
  id:'fracture001', name:'F-001 // Toxic Sewers', threat:'LOW', integrity:81,
  rooms:['Entry Tunnel','Overflow Pipes','Broken Pump Room','Maintenance Station','Waste Reservoir','Boss Room'],
  layout:[
    '####################################',
    '#P....C........#.............L.....#',
    '#..####..E.....#..C..######.......#',
    '#.......####...#.....#....#.......#',
    '#..E....#..#.........#....#..E....#',
    '#.......#..#####..####....####....#',
    '#....####...............S.........#',
    '#....#..C....#####....H....#####..#',
    '#....#.......#...#.........#...#..#',
    '#............#...#####..####...#..#',
    '#..####......#...............C.#..#',
    '#.....K......#####..##########.#..#',
    '#####..########.....#..........#..#',
    '#.............#..E..#..####......#',
    '#..#########..#.....#.....#..D...#',
    '#..#.......#..#######.....#..B...#',
    '#..#..C....#..............#......#',
    '#..#.......###########....#...X..#',
    '#................................#',
    '####################################'
  ]
};
const ENEMY_ROTATION=['toxic_slime','rust_rat','cable_wraith'];

const imgCache = {};
function image(src){ if(!imgCache[src]){ const im=new Image(); im.src=src; imgCache[src]=im; } return imgCache[src]; }
function newState(){ const map=FRACTURE.layout.map(r=>r.split('')); let start={x:1,y:1}; for(let y=0;y<map.length;y++) for(let x=0;x<map[y].length;x++) if(map[y][x]==='P'){ start={x,y}; map[y][x]='.'; } return { player:{x:start.x,y:start.y,level:1,xp:0,nextXp:35,hp:42,maxHp:42,atk:9,def:4,spd:8,luck:3,character:'vyra'}, unlocked:['vyra'], inventory:{med_patch:1}, flags:{visited:{}, chests:0, anomalies:0, boss:false}, map, message:'ACCESS GRANTED: Fracture 001 loaded. The smell is classified.' }; }
let state = newState(); let battle = null;
function log(msg){ state.message=msg; const div=document.createElement('div'); div.className='logline'; div.textContent=msg; logBox.prepend(div); while(logBox.children.length>8) logBox.lastChild.remove(); }
function passable(ch){ return ch !== '#'; }
function camera(){ const worldW=state.map[0].length*TILE, worldH=state.map.length*TILE; let x=state.player.x*TILE + TILE/2 - canvas.width/2, y=state.player.y*TILE + TILE/2 - canvas.height/2; x=Math.max(0,Math.min(x,Math.max(0,worldW-canvas.width))); y=Math.max(0,Math.min(y,Math.max(0,worldH-canvas.height))); return {x,y}; }
function tileColor(ch){ return ch==='#'?'#172033': ch==='~'?'#103d3f':'#0d1d1b'; }
function draw(){
  ctx.clearRect(0,0,canvas.width,canvas.height); const cam=camera();
  const startX=Math.floor(cam.x/TILE), endX=Math.ceil((cam.x+canvas.width)/TILE); const startY=Math.floor(cam.y/TILE), endY=Math.ceil((cam.y+canvas.height)/TILE);
  ctx.fillStyle='#020617'; ctx.fillRect(0,0,canvas.width,canvas.height);
  for(let y=startY;y<=endY;y++) for(let x=startX;x<=endX;x++){
    if(!state.map[y] || state.map[y][x]===undefined) continue; const ch=state.map[y][x]; const px=x*TILE-cam.x, py=y*TILE-cam.y;
    ctx.fillStyle=tileColor(ch); ctx.fillRect(px,py,TILE,TILE); ctx.strokeStyle=ch==='#'?'rgba(168,85,247,.45)':'rgba(52,211,153,.13)'; ctx.strokeRect(px,py,TILE,TILE);
    if(ch==='#'){ ctx.fillStyle='rgba(168,85,247,.12)'; ctx.fillRect(px+5,py+5,TILE-10,TILE-10); }
    if(ch==='C'||ch==='K'){ ctx.fillStyle= ch==='K'?'#facc15':'#a855f7'; ctx.fillRect(px+10,py+12,22,20); ctx.fillStyle='#fff'; ctx.font='16px Arial'; ctx.fillText(ch==='K'?'K':'?',px+16,py+29); }
    if(ch==='D'){ ctx.fillStyle='#7f1d1d'; ctx.fillRect(px+6,py+4,30,34); ctx.fillStyle='#facc15'; ctx.fillText('D',px+16,py+27); }
    if(ch==='S'||ch==='H'||ch==='L'||ch==='X'){ ctx.fillStyle= ch==='S'?'#22d3ee':ch==='H'?'#22c55e':ch==='L'?'#f97316':'#ef4444'; ctx.fillRect(px+8,py+8,26,26); ctx.fillStyle='#020617'; ctx.font='bold 18px Consolas'; ctx.fillText(ch,px+15,py+28); }
    if(ch==='E'||ch==='B'){ ctx.fillStyle= ch==='B'?'#ef4444':'#fb7185'; ctx.beginPath(); ctx.arc(px+21,py+21,ch==='B'?17:13,0,Math.PI*2); ctx.fill(); ctx.fillStyle='#020617'; ctx.font='bold 15px Consolas'; ctx.fillText(ch,px+16,py+27); }
  }
  const pX=state.player.x*TILE-cam.x, pY=state.player.y*TILE-cam.y; const hero=image(DATA.character.icon); if(hero.complete) ctx.drawImage(hero,pX+4,pY+4,34,34); else { ctx.fillStyle='#67e8f9'; ctx.fillRect(pX+7,pY+7,28,28); }
  ctx.fillStyle='rgba(2,6,23,.90)'; ctx.fillRect(0,0,canvas.width,31); ctx.fillStyle='#67e8f9'; ctx.font='15px Consolas'; ctx.fillText(`PROJECT: ASH VECTOR // ${FRACTURE.name} // CAMERA ONLINE`,12,21);
  ctx.fillStyle='rgba(2,6,23,.76)'; ctx.fillRect(canvas.width-190,42,172,88); ctx.strokeStyle='rgba(34,211,238,.35)'; ctx.strokeRect(canvas.width-190,42,172,88); ctx.fillStyle='#cbd5e1'; ctx.font='11px Consolas'; ctx.fillText('MINIMAP // SCAN',canvas.width-178,60); drawMiniMap(canvas.width-178,68,148,48);
  updateUI();
}
function drawMiniMap(mx,my,mw,mh){ const W=state.map[0].length,H=state.map.length, sx=mw/W, sy=mh/H; for(let y=0;y<H;y++) for(let x=0;x<W;x++){ const key=x+','+y; if(!state.flags.visited[key]) continue; const ch=state.map[y][x]; ctx.fillStyle= ch==='#'?'#475569': ch==='B'?'#ef4444': ch==='E'?'#fb7185':'#22d3ee'; ctx.fillRect(mx+x*sx,my+y*sy,Math.max(1,sx),Math.max(1,sy)); } ctx.fillStyle='#facc15'; ctx.fillRect(mx+state.player.x*sx,my+state.player.y*sy,4,4); }
function visitTile(){ state.flags.visited[state.player.x+','+state.player.y]=true; }
function updateUI(){
  const p=state.player; statsBox.innerHTML = `<div class="stat">HP <b>${p.hp}/${p.maxHp}</b></div><div class="stat">SYNC LV <b>${p.level}</b></div><div class="stat">XP <b>${p.xp}/${p.nextXp}</b></div><div class="stat">ATK <b>${p.atk}</b></div><div class="stat">DEF <b>${p.def}</b></div><div class="stat">SPD <b>${p.spd}</b></div>`;
  invBox.innerHTML = Object.keys(DATA.items).map(id=>`<div class="item"><img src="${DATA.items[id].asset}" alt="${DATA.items[id].name}"><span>${DATA.items[id].name}</span><b>x${state.inventory[id]||0}</b></div>`).join('');
  rosterBox.innerHTML = `<button class="operator-card-button" onclick="openOperatorDb()"><b>Vyra</b><br><small>ACTIVE // Shadow Hunter // replace assets in assets/operators/vyra/</small></button><div class="slot locked"><b>Future Operator</b><br><small>Gacha system ready later.</small></div>`;
  const totalTiles=state.map.flat().filter(c=>c!== '#').length, seen=Object.keys(state.flags.visited).length, pct=Math.min(100,Math.round(seen/totalTiles*100));
  fractureStatus.innerHTML = `<div><b>${FRACTURE.name}</b></div><div>Explored: ${pct}%</div><div>Chests: ${state.flags.chests || 0}</div><div>Anomalies cleared: ${state.flags.anomalies || 0}</div>`;
  const sync=$('operatorSync'); if(sync) sync.textContent = `${Math.min(100,Math.round((p.xp/p.nextXp)*100))}%`;
  const explore=$('fractureExplore'); if(explore) explore.textContent=`Explored ${pct}%`;
}
function move(dx,dy){ if(!app || app.classList.contains('hidden') || battle) return; const nx=state.player.x+dx, ny=state.player.y+dy; const ch=state.map[ny]?.[nx]; if(ch===undefined) return; if(ch==='#'){ log('Wall detected. The wall wins this argument.'); return; } if(ch==='D' && !(state.inventory.rust_key>0)){ log('Locked door. Needs Rust Key. Door smugness level: unbearable.'); return; } if(ch==='D'){ state.inventory.rust_key--; log('Rust Key consumed. Door defeated with basic literacy.'); state.map[ny][nx]='.'; }
  state.player.x=nx; state.player.y=ny; visitTile(); handleTile(ch,nx,ny); draw(); }
function handleTile(ch,x,y){
  if(ch==='C'){ state.map[y][x]='.'; state.flags.chests++; const loot = state.flags.chests%2===0?'credit_chip':'med_patch'; addItem(loot,1); log(`Chest opened: ${DATA.items[loot].name}. Surprisingly not a mimic. Suspicious.`); }
  if(ch==='K'){ state.map[y][x]='.'; addItem('rust_key',1); log('Rust Key acquired. It is somehow both rusty and overconfident.'); }
  if(ch==='S'){ save(); log('Recovery Terminal: VECTOR ARCHIVE UPDATED.'); }
  if(ch==='H'){ state.player.hp=state.player.maxHp; log('Healing Station used. Vyra pretends she did not need it.'); }
  if(ch==='L'){ log('Lore Terminal: Project ASH VECTOR tried to weaponize reality. Reality filed a complaint.'); }
  if(ch==='X'){ log('Exit found. Demo route complete. Boss core still required for full extraction.'); }
  if(ch==='E'){ state.map[y][x]='.'; const id=ENEMY_ROTATION[(state.flags.anomalies||0)%ENEMY_ROTATION.length]; startBattle(id,false); }
  if(ch==='B'){ startBattle('sewer_king',true); }
}
function addItem(id,n=1){ state.inventory[id]=(state.inventory[id]||0)+n; }
function startBattle(id,isBoss=false){ const e=JSON.parse(JSON.stringify(DATA.enemies[id])); battle={enemy:e,maxHp:e.hp,isBoss}; overlay.classList.remove('hidden'); battleEnemyImg.src=e.asset; battleTitle.textContent=e.name; battleText.textContent=e.line; renderBattle(); beep(180,.09,'sawtooth'); }
function renderBattle(){ const e=battle.enemy, p=state.player; battleHp.innerHTML = `<div class="battle-operator-mini"><img src="${DATA.character.icon}"><div><b>${DATA.character.name}</b><br><span>HP ${p.hp}/${p.maxHp} // SYNC LV ${p.level}</span></div></div><div>${e.name} HP ${Math.max(0,e.hp)}/${battle.maxHp}</div><div class="hpbar"><span style="width:${Math.max(0,e.hp/battle.maxHp*100)}%"></span></div>`; attackButtons.innerHTML = DATA.character.attacks.map((a,i)=>`<button onclick="attack(${i})">${a.name}<br><small>${a.type.toUpperCase()} // PWR ${a.power}</small></button>`).join(''); }
function attack(i){ if(!battle) return; const atk=DATA.character.attacks[i], p=state.player, e=battle.enemy; if(atk.type==='heal'){ const heal=Math.min(p.maxHp-p.hp, atk.power+p.level*3); p.hp+=heal; battleText.textContent=`${atk.line} Recovered ${heal} HP.`; } else { let dmg=Math.max(1, atk.power+p.atk-e.def+Math.floor(Math.random()*4)); if(atk.type==='debuff'){ dmg=Math.max(1,Math.floor(dmg*.75)); e.atk=Math.max(1,e.atk-1); } if(Math.random()<0.08+p.luck/100){ dmg=Math.floor(dmg*1.7); battleText.textContent='CRITICAL VECTOR HIT. '; } else battleText.textContent=''; e.hp-=dmg; battleText.textContent += `${atk.line} ${e.name} took ${dmg} damage.`; }
  if(e.hp<=0){ winBattle(); return; } setTimeout(enemyTurn,450); renderBattle(); }
function enemyTurn(){ if(!battle) return; const e=battle.enemy,p=state.player; const dmg=Math.max(1,e.atk-p.def+Math.floor(Math.random()*4)); p.hp-=dmg; battleText.textContent += ` ${e.name} hits back for ${dmg}. Rude but legally allowed.`; if(p.hp<=0){ p.hp=1; overlay.classList.add('hidden'); log('Operator down. Emergency system revived you at 1 HP. Embarrassing but useful.'); battle=null; } renderBattle(); draw(); }
function winBattle(){ const e=battle.enemy; state.player.xp+=e.xp; state.flags.anomalies=(state.flags.anomalies||0)+1; e.loot.forEach(id=>addItem(id,1)); if(e.id==='sewer_king'){ state.flags.boss=true; state.map[state.player.y][state.player.x]='.'; } overlay.classList.add('hidden'); log(`ANOMALY CLEARED: ${e.name}. XP +${e.xp}. Loot: ${e.loot.map(id=>DATA.items[id].name).join(', ')}.`); while(state.player.xp>=state.player.nextXp){ state.player.xp-=state.player.nextXp; levelUp(); } battle=null; draw(); }
function levelUp(){ const p=state.player; p.level++; p.nextXp=Math.floor(p.nextXp*1.35+20); p.maxHp+=8; p.hp=p.maxHp; p.atk+=2; p.def+=1; log(`SYNCHRONIZATION INCREASED: Level ${p.level}. Vyra is now statistically more annoying.`); beep(880,.12,'triangle'); }
function save(){ localStorage.setItem(SAVE_KEY,JSON.stringify(state)); }
function load(show=true){ const data=localStorage.getItem(SAVE_KEY); if(!data){ if(show) log('No archive found. The database shrugged.'); return false; } state=JSON.parse(data); if(show) log('VECTOR ARCHIVE LOADED. Welcome back, Operator.'); draw(); return true; }
function reset(){ if(confirm('Purge local archive and restart?')){ localStorage.removeItem(SAVE_KEY); state=newState(); logBox.innerHTML=''; log('Archive purged. Fresh disaster initialized.'); draw(); } }
function openOperatorDb(){ operatorOverlay.classList.remove('hidden'); updateUI(); }
function openAnomalyDb(){ anomalyOverlay.classList.remove('hidden'); anomalyList.innerHTML=Object.values(DATA.enemies).map(e=>`<button class="anomaly-record-btn" onclick="selectAnomaly('${e.id}')"><img src="${e.icon}" alt="${e.name}"><span><b>${e.name}</b><small>${e.classification} // THREAT ${e.threatLevel}</small></span></button>`).join(''); }
function selectAnomaly(id){ const e=DATA.enemies[id]; anomalyFile.innerHTML=`<div class="anomaly-profile-grid"><div class="anomaly-art"><img src="${e.profile}" alt="${e.name}"></div><div class="anomaly-data"><div class="record-kicker">ANOMALY FILE // ${e.id.toUpperCase()}</div><h2>${e.name}</h2><p>${e.description}</p><div class="record-grid"><div><b>Classification</b><span>${e.classification}</span></div><div><b>Threat</b><span>${e.threatLevel}</span></div><div><b>HP</b><span>${e.hp}</span></div><div><b>Loot</b><span>${e.loot.map(x=>DATA.items[x].name).join(', ')}</span></div></div><h3>Final Replaceable Asset Paths</h3><code class="asset-code">assets/anomalies/${e.id}/profile.png\nassets/anomalies/${e.id}/battle.png\nassets/anomalies/${e.id}/icon.png\ndata/anomalies/${e.id}.json</code></div></div>`; }
function openFractureDb(){ fractureOverlay.classList.remove('hidden'); updateUI(); }
function keyHandler(e){ const k=e.key.toLowerCase(); if(bootScreen && !bootScreen.classList.contains('hidden') && (e.key==='Enter'||e.key===' ')){ enterArchive(); return; } if(k==='arrowup'||k==='w') move(0,-1); if(k==='arrowdown'||k==='s') move(0,1); if(k==='arrowleft'||k==='a') move(-1,0); if(k==='arrowright'||k==='d') move(1,0); }

$('continueBtn').onclick=()=>openGame(true); $('newGameBtn').onclick=()=>{state=newState(); openGame(false); log('INITIALIZED: Operator Vyra deployed into F-001 Toxic Sewers.');}; $('operatorFilesBtn').onclick=openOperatorDb; $('anomalyIndexBtn').onclick=openAnomalyDb; $('fractureIndexBtn').onclick=openFractureDb; $('configBtn').onclick=()=>showMenuInfo('Configuration module placeholder. Audio, controls, and accessibility settings will live here.'); $('saveBtn').onclick=()=>{save();log('VECTOR ARCHIVE UPDATED.');draw();}; $('loadBtn').onclick=()=>load(true); $('resetBtn').onclick=reset; $('menuBtn').onclick=()=>{app.classList.add('hidden');mainMenu.classList.remove('hidden');}; $('closeOperatorDb').onclick=()=>operatorOverlay.classList.add('hidden'); $('closeAnomalyDb').onclick=()=>anomalyOverlay.classList.add('hidden'); $('closeFractureDb').onclick=()=>fractureOverlay.classList.add('hidden'); enterBtn.onclick=enterArchive; document.addEventListener('keydown',keyHandler); document.querySelectorAll('[data-move]').forEach(b=>b.onclick=()=>{ const d=b.dataset.move; move(d==='right'?1:d==='left'?-1:0,d==='down'?1:d==='up'?-1:0); });
window.attack=attack; window.openOperatorDb=openOperatorDb; window.selectAnomaly=selectAnomaly;
visitTile(); runBoot(); updateUI();
