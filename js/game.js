const TILE = 42;
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const $ = id => document.getElementById(id);
const logBox = $('log'), statsBox = $('stats'), invBox = $('inventory'), rosterBox = $('roster'), fractureStatus = $('fractureStatus');
const overlay = $('battleOverlay'), battleEnemyImg = $('battleEnemy'), battleTitle = $('battleTitle'), battleText = $('battleText'), battleHp = $('battleHp'), attackButtons = $('attackButtons');
const anomalyOverlay = $('anomalyOverlay'), anomalyList = $('anomalyList'), anomalyFile = $('anomalyFile');
const operatorOverlay = $('operatorOverlay'), fractureOverlay = $('fractureOverlay'), inventoryOverlay = $('inventoryOverlay'), inventoryDatabaseList = $('inventoryDatabaseList');
const bootScreen = $('bootScreen'), mainMenu = $('mainMenu'), app = $('app'), bootTerminal = $('bootTerminal'), bootLines = $('bootLines'), bootProgress = document.querySelector('#bootProgress span'), bootLogo = $('bootLogo'), enterBtn = $('enterBtn'), menuInfo = $('menuInfo');

const SAVE_KEY = 'project_ashvector_archive_001';
const BOOT_SEQUENCE = [
  {t:'ASH VECTOR OPERATING SYSTEM'}, {t:'Version 0.0.1 // Developer Build'}, {t:''},
  {t:'Initializing...'}, {t:'████████████████████ 100%'}, {t:'Connecting to ASH Network...'}, {t:'Connection Established.'},
  {t:'Loading Classified Archives...'}, {t:'Operator Database... ONLINE'}, {t:'Anomaly Database... ONLINE'}, {t:'Fracture Index... ONLINE'},
  {t:'Combat Engine v2... ONLINE'}, {t:'Inventory & Loot Engine v1... ONLINE'}, {t:'Reality Integrity...'}, {t:'ERROR', glitch:true}, {t:'Reality Integrity: 18%', glitch:true}, {t:''},
  {t:'WARNING', glitch:true}, {t:'Unauthorized access detected.', glitch:true}, {t:''}, {t:'Can you hear me...?'}, {t:''}, {t:'PROJECT:'}, {t:'ASH VECTOR', glitch:true}
];
let bootComplete = false, audioCtx = null;
function beep(freq=520, dur=0.035, type='square'){
  try{
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const osc=audioCtx.createOscillator(), gain=audioCtx.createGain();
    osc.type=type; osc.frequency.value=freq; gain.gain.value=0.035;
    osc.connect(gain); gain.connect(audioCtx.destination); osc.start();
    gain.gain.exponentialRampToValueAtTime(0.0001,audioCtx.currentTime+dur);
    osc.stop(audioCtx.currentTime+dur);
  }catch(e){}
}
function typeLine(line, done){
  let j=0, text=line.t;
  if(!text){ bootLines.textContent+='\n'; done(); return; }
  const typer=setInterval(()=>{
    bootLines.textContent += text[j] || '';
    if(text[j] && text[j] !== ' ') beep(line.glitch?180+Math.random()*80:460+Math.random()*120,.02,line.glitch?'sawtooth':'square');
    j++;
    if(j>text.length){
      clearInterval(typer); bootLines.textContent+='\n';
      if(line.glitch){ bootTerminal.classList.add('glitch-hit'); setTimeout(()=>bootTerminal.classList.remove('glitch-hit'),300); }
      done();
    }
  }, line.glitch?16:24);
}
function runBoot(){
  let i=0; bootLines.textContent=''; bootProgress.style.width='0%';
  function next(){
    bootProgress.style.width=Math.floor((i/BOOT_SEQUENCE.length)*100)+'%';
    if(i>=BOOT_SEQUENCE.length){ bootProgress.style.width='100%'; setTimeout(()=>{ bootLogo.classList.remove('hidden'); bootComplete=true; beep(880,.08,'triangle');},450); return; }
    typeLine(BOOT_SEQUENCE[i++], next);
  }
  next();
}
function enterArchive(){
  if(!bootComplete){ bootLines.textContent=BOOT_SEQUENCE.map(x=>x.t).join('\n')+'\n'; bootProgress.style.width='100%'; bootLogo.classList.remove('hidden'); bootComplete=true; return; }
  bootScreen.classList.add('hidden'); mainMenu.classList.remove('hidden'); beep(700,.08,'triangle');
}
function openGame(loadExisting=false){ mainMenu.classList.add('hidden'); app.classList.remove('hidden'); if(loadExisting) load(false); draw(); }
function showMenuInfo(text){ menuInfo.textContent=text; beep(520,.035,'square'); }

const DATA = {
  character:{
    id:'vyra', name:'Vyra', operatorId:'AV-001', callSign:'Black Neon', status:'ACTIVE', rarity:'Starter / 5-Star Prototype', element:'Void', role:'Fast damage dealer', clearance:'Level 5',
    portrait:'assets/operators/vyra/portrait.png', battle:'assets/operators/vyra/battle.png', icon:'assets/operators/vyra/icon.png', spriteSheet:'assets/operators/vyra/sprite_sheet.png',
    baseStats:{hp:42,atk:9,def:4,spd:8,luck:3},
    attacks:[
      {id:'neon_slash', name:'Neon Slash', power:9, type:'attack', element:'Void', accuracy:.95, critBonus:.05, status:null, line:'Vyra cuts the air so hard the sewer asks for therapy.'},
      {id:'trash_talk', name:'Trash Talk', power:5, type:'debuff', element:'Psych', accuracy:.9, critBonus:.02, status:{name:'Corruption',chance:.65,turns:3,power:2}, line:'Vyra insults the enemy\'s entire bloodline and questionable smell.'},
      {id:'void_kick', name:'Void Kick', power:13, type:'attack', element:'Void', accuracy:.82, critBonus:.10, status:{name:'Shock',chance:.25,turns:2,power:0}, line:'A kick powered by bad decisions and premium neon.'},
      {id:'emergency_flex', name:'Emergency Flex', power:10, type:'heal', element:'Ego', accuracy:1, critBonus:0, status:null, line:'Vyra heals herself by pretending this was all planned.'}
    ]
  },
  enemies:{
    toxic_slime:{id:'toxic_slime',name:'Toxic Slime',hp:24,atk:5,def:1,spd:3,luck:1,xp:12,classification:'BIOHAZARD GEL',threatLevel:'D',asset:'assets/anomalies/toxic_slime/battle.png',icon:'assets/anomalies/toxic_slime/icon.png',profile:'assets/anomalies/toxic_slime/profile.png',loot:['med_patch','scrap_metal'],line:'It bubbles like expired soda and looks personally offended.',description:'A sewer-born acidic gel that smells like expired soda and poor municipal planning.',skills:[{name:'Acid Burp',power:6,accuracy:.9,status:{name:'Burn',chance:.25,turns:2,power:2}},{name:'Wet Slap',power:4,accuracy:.95}]},
    rust_rat:{id:'rust_rat',name:'Rust Rat',hp:32,atk:7,def:2,spd:7,luck:2,xp:18,classification:'SCRAP VERMIN',threatLevel:'C',asset:'assets/anomalies/rust_rat/battle.png',icon:'assets/anomalies/rust_rat/icon.png',profile:'assets/anomalies/rust_rat/profile.png',loot:['credit_chip','corroded_wiring'],line:'A rat wearing scrap metal like it pays rent here.',description:'A metal-chewing rat wearing scrap armor like it has a tiny apocalypse appointment.',skills:[{name:'Rabid Dash',power:7,accuracy:.85},{name:'Rust Bite',power:5,accuracy:.95,status:{name:'Corruption',chance:.25,turns:3,power:1}}]},
    cable_wraith:{id:'cable_wraith',name:'Cable Wraith',hp:38,atk:8,def:3,spd:6,luck:3,xp:24,classification:'TECHNO-PHANTOM',threatLevel:'B',asset:'assets/anomalies/cable_wraith/battle.png',icon:'assets/anomalies/cable_wraith/icon.png',profile:'assets/anomalies/cable_wraith/profile.png',loot:['stale_energy_drink','rust_core'],line:'A haunted cable bundle. Somehow still charges microtransactions.',description:'A ghost-like knot of cables, static, and bad customer support energy.',skills:[{name:'Static Claw',power:8,accuracy:.88,status:{name:'Shock',chance:.35,turns:2,power:0}},{name:'Lag Spike',power:6,accuracy:.92}]},
    sewer_king:{id:'sewer_king',name:'The Sewer King',hp:75,atk:10,def:4,spd:5,luck:3,xp:60,classification:'BOSS-CLASS ABYSSAL',threatLevel:'A',asset:'assets/anomalies/sewer_king/battle.png',icon:'assets/anomalies/sewer_king/icon.png',profile:'assets/anomalies/sewer_king/profile.png',loot:['toxic_core','corrupted_catalyst','operator_shard_vyra'],line:'He rules a kingdom of sludge. Honestly, still better than some landlords.',description:'A sludge monarch squatting in Sector 001 with a crown, a smell, and absolutely no valid leadership skills.',skills:[{name:'Royal Stench',power:9,accuracy:.88,status:{name:'Corruption',chance:.4,turns:3,power:2}},{name:'Crown Bash',power:11,accuracy:.8},{name:'Sludge Tax',power:7,accuracy:.95,status:{name:'Freeze',chance:.2,turns:1,power:0}}]}
  },
  items:{
    med_patch:{id:'med_patch',name:'Med Patch',category:'Consumable',type:'heal',rarity:'Common',value:20,asset:'assets/items/med_patch.png',desc:'Emergency healing patch. Smells like hospital and panic.'},
    stale_energy_drink:{id:'stale_energy_drink',name:'Stale Energy Drink',category:'Consumable',type:'buff',rarity:'Common',value:4,asset:'assets/items/stale_energy_drink.png',desc:'Boosts future speed systems. May legally count as a war crime.'},
    credit_chip:{id:'credit_chip',name:'Credit Chip',category:'Credits',type:'currency',rarity:'Common',value:10,asset:'assets/items/credit_chip.png',desc:'ASH VECTOR currency fragment. Somehow still taxable.'},
    scrap_metal:{id:'scrap_metal',name:'Scrap Metal',category:'Catalyst',type:'material',rarity:'Common',value:1,asset:'assets/items/scrap_metal.png',desc:'Useful upgrade junk. The database calls it character building.'},
    corroded_wiring:{id:'corroded_wiring',name:'Corroded Wiring',category:'Catalyst',type:'material',rarity:'Common',value:1,asset:'assets/items/corroded_wiring.png',desc:'Old wiring that probably remembers dial-up.'},
    rust_core:{id:'rust_core',name:'Rust Core',category:'Catalyst',type:'material',rarity:'Rare',value:1,asset:'assets/items/rust_core.png',desc:'A dense anomaly core. Definitely not snack-safe.'},
    corrupted_catalyst:{id:'corrupted_catalyst',name:'Corrupted Catalyst',category:'Catalyst',type:'material',rarity:'Epic',value:1,asset:'assets/items/corrupted_catalyst.png',desc:'Upgrade material pulsing with bad ideas.'},
    rust_key:{id:'rust_key',name:'Rust Key',category:'Key Item',type:'key',rarity:'Key',value:1,asset:'assets/items/rust_key.png',desc:'Opens rusty doors and worse conversations.'},
    keycard_lv1:{id:'keycard_lv1',name:'Keycard LV1',category:'Key Item',type:'key',rarity:'Key',value:1,asset:'assets/items/keycard_lv1.png',desc:'Low clearance access card. Still acts superior.'},
    archive_log_001:{id:'archive_log_001',name:'Archive Log 001',category:'Archive',type:'lore',rarity:'Archive',value:1,asset:'assets/items/archive_log_001.png',desc:'Recovered classified lore file from the Toxic Sewers.'},
    operator_shard_vyra:{id:'operator_shard_vyra',name:'Vyra Operator Shard',category:'Operator Shard',type:'shard',rarity:'Rare',value:1,asset:'assets/items/operator_shard_vyra.png',desc:'Future gacha/upgrade shard for Vyra.'},
    legendary_vault_core:{id:'legendary_vault_core',name:'Legendary Vault Core',category:'Vault',type:'rare',rarity:'Legendary',value:1,asset:'assets/items/legendary_vault_core.png',desc:'A high-tier vault reward placeholder.'},
    toxic_core:{id:'toxic_core',name:'Toxic Core',category:'Key Item',type:'quest',rarity:'Boss',value:1,asset:'assets/items/toxic_core.png',desc:'Boss objective item. It hums like a microwave full of regret.'}
  },
  lootTables:{
    standard_cache:[{id:'med_patch',qty:1},{id:'credit_chip',qty:1},{id:'scrap_metal',qty:1}],
    military_cache:[{id:'med_patch',qty:2},{id:'corroded_wiring',qty:1},{id:'keycard_lv1',qty:1}],
    corrupted_cache:[{id:'corrupted_catalyst',qty:1},{id:'operator_shard_vyra',qty:1},{id:'credit_chip',qty:3}],
    legendary_vault:[{id:'legendary_vault_core',qty:1},{id:'operator_shard_vyra',qty:3},{id:'corrupted_catalyst',qty:2}]
  }
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
function newState(){
  const map=FRACTURE.layout.map(r=>r.split('')); let start={x:1,y:1};
  for(let y=0;y<map.length;y++) for(let x=0;x<map[y].length;x++) if(map[y][x]==='P'){ start={x,y}; map[y][x]='.'; }
  return { player:{x:start.x,y:start.y,level:1,xp:0,nextXp:35,hp:42,maxHp:42,atk:9,def:4,spd:8,luck:3,character:'vyra',guard:false,statuses:[]}, unlocked:['vyra'], inventory:{med_patch:1, credit_chip:0, scrap_metal:0}, flags:{visited:{}, chests:0, anomalies:0, boss:false}, map, message:'ACCESS GRANTED: Fracture 001 loaded. The smell is classified.' };
}
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
    ctx.fillStyle=tileColor(ch); ctx.fillRect(px,py,TILE,TILE);
    ctx.strokeStyle='rgba(34,211,238,.06)'; ctx.strokeRect(px,py,TILE,TILE);
    ctx.fillStyle='rgba(255,255,255,.08)';
    if(ch==='#'){ ctx.fillStyle='rgba(148,163,184,.12)'; ctx.fillRect(px+4,py+4,TILE-8,TILE-8); }
    if('CEBKDSHLX'.includes(ch)) drawToken(ch,px,py);
  }
  const pX=state.player.x*TILE-cam.x, pY=state.player.y*TILE-cam.y;
  const hero=image(DATA.character.icon);
  if(hero.complete) ctx.drawImage(hero,pX+5,pY+5,TILE-10,TILE-10); else { ctx.fillStyle='#ef4444'; ctx.fillRect(pX+8,pY+8,TILE-16,TILE-16); }
  ctx.strokeStyle='#22d3ee'; ctx.lineWidth=2; ctx.strokeRect(pX+4,pY+4,TILE-8,TILE-8);
  ctx.fillStyle='rgba(2,6,23,.82)'; ctx.fillRect(12,12,210,66); ctx.strokeStyle='rgba(34,211,238,.35)'; ctx.strokeRect(12,12,210,66);
  ctx.fillStyle='#dbeafe'; ctx.font='13px Consolas'; ctx.fillText(FRACTURE.name,24,34); ctx.fillText(`HP ${state.player.hp}/${state.player.maxHp}  LV ${state.player.level}`,24,56);
  drawMiniMap(canvas.width-190,14,172,96);
  updateUI();
}
function drawToken(ch,px,py){
  const labels={C:'CHEST',E:'HOSTILE',B:'BOSS',K:'KEY',D:'LOCK',S:'SAVE',H:'HEAL',L:'LORE',X:'EXIT'};
  const colors={C:'#facc15',E:'#fb7185',B:'#ef4444',K:'#fbbf24',D:'#94a3b8',S:'#22d3ee',H:'#34d399',L:'#a78bfa',X:'#f8fafc'};
  ctx.fillStyle=colors[ch]||'#fff'; ctx.beginPath(); ctx.arc(px+TILE/2,py+TILE/2,13,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#020617'; ctx.font='bold 14px Consolas'; ctx.textAlign='center'; ctx.fillText(ch,px+TILE/2,py+TILE/2+5); ctx.textAlign='left';
  if(ch==='B'){ ctx.fillStyle='rgba(239,68,68,.22)'; ctx.fillRect(px+2,py+2,TILE-4,TILE-4); }
}
function drawMiniMap(mx,my,mw,mh){ const W=state.map[0].length,H=state.map.length, sx=mw/W, sy=mh/H; ctx.fillStyle='rgba(2,6,23,.85)'; ctx.fillRect(mx-8,my-8,mw+16,mh+16); ctx.strokeStyle='rgba(34,211,238,.35)'; ctx.strokeRect(mx-8,my-8,mw+16,mh+16); for(let y=0;y<H;y++) for(let x=0;x<W;x++){ const key=x+','+y; if(!state.flags.visited[key]) continue; const ch=state.map[y][x]; ctx.fillStyle= ch==='#'?'#475569': ch==='B'?'#ef4444': ch==='E'?'#fb7185':'#22d3ee'; ctx.fillRect(mx+x*sx,my+y*sy,Math.max(1,sx),Math.max(1,sy)); } ctx.fillStyle='#facc15'; ctx.fillRect(mx+state.player.x*sx,my+state.player.y*sy,4,4); }
function visitTile(){ state.flags.visited[state.player.x+','+state.player.y]=true; }
function updateUI(){
  const p=state.player; statsBox.innerHTML = `<div class="stat">HP <b>${p.hp}/${p.maxHp}</b></div><div class="stat">SYNC LV <b>${p.level}</b></div><div class="stat">XP <b>${p.xp}/${p.nextXp}</b></div><div class="stat">ATK <b>${p.atk}</b></div><div class="stat">DEF <b>${p.def}</b></div><div class="stat">SPD <b>${p.spd}</b></div>`;
  const ownedItems = Object.keys(DATA.items).filter(id => (state.inventory[id]||0)>0 || ['med_patch','credit_chip','rust_key','toxic_core'].includes(id));
  invBox.innerHTML = ownedItems.map(id=>`<div class="item ${DATA.items[id].rarity?.toLowerCase()||''}"><img src="${DATA.items[id].asset}" alt="${DATA.items[id].name}"><span>${DATA.items[id].name}<small>${DATA.items[id].category}</small></span><b>x${state.inventory[id]||0}</b></div>`).join('') + `<button class="operator-card-button" onclick="openInventoryDb()"><b>Open Full Inventory Database</b><br><small>Consumables // Catalysts // Key Items // Archives // Shards</small></button>`;
  rosterBox.innerHTML = `<button class="operator-card-button" onclick="openOperatorDb()"><b>Vyra</b><br><small>ACTIVE // Shadow Hunter // replace assets in assets/operators/vyra/</small></button><div class="slot locked"><b>Future Operator</b><br><small>Gacha system ready later.</small></div>`;
  const totalTiles=state.map.flat().filter(c=>c!== '#').length, seen=Object.keys(state.flags.visited).length, pct=Math.min(100,Math.round(seen/totalTiles*100));
  fractureStatus.innerHTML = `<div><b>${FRACTURE.name}</b></div><div>Explored: ${pct}%</div><div>Chests: ${state.flags.chests || 0}</div><div>Anomalies cleared: ${state.flags.anomalies || 0}</div>`;
  const sync=$('operatorSync'); if(sync) sync.textContent = `${Math.min(100,Math.round((p.xp/p.nextXp)*100))}%`;
  const explore=$('fractureExplore'); if(explore) explore.textContent=`Explored ${pct}%`;
}
function move(dx,dy){ if(!app || app.classList.contains('hidden') || battle) return; const nx=state.player.x+dx, ny=state.player.y+dy; const ch=state.map[ny]?.[nx]; if(ch===undefined) return; if(ch==='#'){ log('Wall detected. The wall wins this argument.'); return; } if(ch==='D' && !(state.inventory.rust_key>0)){ log('Locked door. Needs Rust Key. Door smugness level: unbearable.'); return; } if(ch==='D'){ state.inventory.rust_key--; log('Rust Key consumed. Door defeated with basic literacy.'); state.map[ny][nx]='.'; }
  state.player.x=nx; state.player.y=ny; visitTile(); handleTile(ch,nx,ny); draw(); }
function handleTile(ch,x,y){
  if(ch==='C'){
    state.map[y][x]='.'; state.flags.chests++;
    const tableName = state.flags.chests % 4 === 0 ? 'military_cache' : 'standard_cache';
    const drops = rollLootTable(tableName);
    drops.forEach(d=>addItem(d.id,d.qty));
    log(`CACHE OPENED [${tableName.toUpperCase()}]: ${drops.map(d=>`${DATA.items[d.id].name} x${d.qty}`).join(', ')}. Still not a mimic. That makes it more suspicious.`);
  }
  if(ch==='K'){ state.map[y][x]='.'; addItem('rust_key',1); log('Rust Key acquired. It is somehow both rusty and overconfident.'); }
  if(ch==='S'){ save(); log('Recovery Terminal: VECTOR ARCHIVE UPDATED.'); }
  if(ch==='H'){ state.player.hp=state.player.maxHp; state.player.statuses=[]; log('Healing Station used. Vyra pretends she did not need it. Status corruption cleared.'); }
  if(ch==='L'){ addItem('archive_log_001',1); state.map[y][x]='.'; log('ARCHIVE RECOVERED: Log 001. Project ASH VECTOR tried to weaponize reality. Reality filed a complaint.'); }
  if(ch==='X'){ log('Exit found. Demo route complete. Boss core still required for full extraction.'); }
  if(ch==='E'){ state.map[y][x]='.'; const id=ENEMY_ROTATION[(state.flags.anomalies||0)%ENEMY_ROTATION.length]; startBattle(id,false); }
  if(ch==='B'){ startBattle('sewer_king',true); }
}
function addItem(id,n=1){ state.inventory[id]=(state.inventory[id]||0)+n; }
function rollLootTable(tableName){
  const table = DATA.lootTables[tableName] || DATA.lootTables.standard_cache;
  const first = table[Math.floor(Math.random()*table.length)];
  const drops=[{id:first.id, qty:first.qty||1}];
  if(Math.random()<0.32 && table.length>1){ const extra=table[Math.floor(Math.random()*table.length)]; drops.push({id:extra.id, qty:extra.qty||1}); }
  return drops;
}
function statusText(statuses){ return statuses && statuses.length ? statuses.map(s=>`${s.name}(${s.turns})`).join(' // ') : 'CLEAR'; }
function startBattle(id,isBoss=false){
  const e=JSON.parse(JSON.stringify(DATA.enemies[id])); e.statuses=[]; e.maxHp=e.hp;
  battle={enemy:e,maxHp:e.hp,isBoss,turn:'player',round:1,log:[],ended:false,transition:true};
  overlay.classList.remove('hidden'); overlay.classList.add('battle-intro'); setTimeout(()=>overlay.classList.remove('battle-intro'),700);
  battleEnemyImg.src=e.asset; battleTitle.textContent=e.name; battleText.textContent=`${e.line} // Combat Engine v2 initialized.`;
  renderBattle(); beep(180,.09,'sawtooth');
}
function renderBattle(){
  if(!battle) return;
  const e=battle.enemy, p=state.player;
  const pStatus=statusText(p.statuses), eStatus=statusText(e.statuses);
  battleHp.innerHTML = `<div class="battle-operator-mini"><img src="${DATA.character.icon}"><div><b>${DATA.character.name}</b><br><span>HP ${p.hp}/${p.maxHp} // SYNC LV ${p.level} // ${pStatus}</span><div class="hpbar"><span style="width:${Math.max(0,p.hp/p.maxHp*100)}%"></span></div></div></div><div><b>${e.name}</b> // ${e.classification} // STATUS ${eStatus}</div><div class="hpbar enemy-hp"><span style="width:${Math.max(0,e.hp/battle.maxHp*100)}%"></span></div><div class="battle-round">ROUND ${battle.round} // TURN: ${battle.turn.toUpperCase()}</div>`;
  if(battle.ended) return;
  attackButtons.innerHTML = DATA.character.attacks.map((a,i)=>`<button onclick="attack(${i})" ${battle.turn!=='player'?'disabled':''}>${a.name}<br><small>${a.element.toUpperCase()} // ${a.type.toUpperCase()} // PWR ${a.power}</small></button>`).join('') + `<button onclick="useMedPatch()" ${battle.turn!=='player' || !(state.inventory.med_patch>0)?'disabled':''}>Use Med Patch<br><small>ITEM // x${state.inventory.med_patch||0}</small></button><button onclick="guard()" ${battle.turn!=='player'?'disabled':''}>Guard<br><small>DEFENSE // 50% DMG</small></button>`;
}
function pushBattle(msg){ if(!battle) return; battle.log.unshift(msg); battle.log=battle.log.slice(0,5); battleText.innerHTML = battle.log.join('<br>'); }
function tickStatuses(target, label){
  if(!target.statuses) target.statuses=[];
  let lines=[];
  target.statuses.forEach(s=>{
    if(['Burn','Corruption'].includes(s.name)){ const dmg=Math.max(1,s.power||1); target.hp-=dmg; lines.push(`${label} suffers ${dmg} ${s.name} damage.`); }
    s.turns--;
  });
  target.statuses=target.statuses.filter(s=>s.turns>0);
  return lines;
}
function applyStatus(target, status, label){
  if(!status || Math.random()>status.chance) return '';
  const existing=(target.statuses||[]).find(s=>s.name===status.name);
  if(existing){ existing.turns=Math.max(existing.turns,status.turns); existing.power=Math.max(existing.power||0,status.power||0); }
  else { target.statuses=target.statuses||[]; target.statuses.push({name:status.name,turns:status.turns,power:status.power||0}); }
  return `${label} afflicted with ${status.name}.`;
}
function canActFromStatus(target,label){
  const frozen=(target.statuses||[]).find(s=>s.name==='Freeze');
  if(frozen && Math.random()<0.55) return `${label} is frozen and loses the turn.`;
  const shocked=(target.statuses||[]).find(s=>s.name==='Shock');
  if(shocked && Math.random()<0.25) return `${label} short-circuits from Shock and whiffs the turn.`;
  return '';
}
function attack(i){
  if(!battle || battle.turn!=='player' || battle.ended) return;
  const atk=DATA.character.attacks[i], p=state.player, e=battle.enemy;
  battle.turn='resolving';
  const dotLines=tickStatuses(p,'Vyra');
  if(p.hp<=0){ defeat(); return; }
  const skip=canActFromStatus(p,'Vyra');
  if(skip){ pushBattle([...dotLines,skip].join('<br>')); setTimeout(enemyTurn,650); renderBattle(); return; }
  if(atk.type==='heal'){
    const heal=Math.min(p.maxHp-p.hp, atk.power+p.level*3); p.hp+=heal;
    pushBattle([...dotLines,`${atk.line} Recovered ${heal} HP.`].join('<br>'));
  } else {
    if(Math.random()>atk.accuracy){ pushBattle([...dotLines,`${atk.name} missed. The sewer pretends it didn't see that.`].join('<br>')); setTimeout(enemyTurn,650); renderBattle(); return; }
    let dmg=Math.max(1, atk.power+p.atk-e.def+Math.floor(Math.random()*4));
    let extras=[];
    if(atk.type==='debuff'){ dmg=Math.max(1,Math.floor(dmg*.75)); e.atk=Math.max(1,e.atk-1); extras.push(`${e.name} ATK reduced.`); }
    const critChance=0.08+p.luck/100+(atk.critBonus||0);
    if(Math.random()<critChance){ dmg=Math.floor(dmg*1.75); extras.push('CRITICAL VECTOR HIT.'); beep(920,.06,'triangle'); }
    e.hp-=dmg;
    const statusLine=applyStatus(e,atk.status,e.name); if(statusLine) extras.push(statusLine);
    pushBattle([...dotLines,`${atk.line} ${e.name} took ${dmg} damage.`,...extras].join('<br>'));
  }
  if(e.hp<=0){ winBattle(); return; }
  setTimeout(enemyTurn,700); renderBattle();
}
function enemyTurn(){
  if(!battle || battle.ended) return;
  const e=battle.enemy,p=state.player;
  battle.turn='enemy'; renderBattle();
  let lines=tickStatuses(e,e.name);
  if(e.hp<=0){ winBattle(); return; }
  const skip=canActFromStatus(e,e.name);
  if(skip){ lines.push(skip); endEnemyTurn(lines); return; }
  const skill=e.skills[Math.floor(Math.random()*e.skills.length)];
  if(Math.random()>skill.accuracy){ lines.push(`${e.name} used ${skill.name}, missed, and immediately blamed the lighting.`); endEnemyTurn(lines); return; }
  if(Math.random()<Math.min(.35,p.spd/100+.06)){ lines.push(`DODGE: Vyra sidestepped ${skill.name}. Stylish and deeply unnecessary.`); endEnemyTurn(lines); return; }
  let dmg=Math.max(1,skill.power+e.atk-p.def+Math.floor(Math.random()*4));
  if(p.guard){ dmg=Math.ceil(dmg*.5); p.guard=false; lines.push('Guard protocol reduced incoming damage.'); }
  if(Math.random()<0.06+(e.luck||0)/100){ dmg=Math.floor(dmg*1.6); lines.push('Enemy critical hit. Very cringe.'); }
  p.hp-=dmg; lines.push(`${e.name} used ${skill.name} for ${dmg} damage.`);
  const statusLine=applyStatus(p,skill.status,'Vyra'); if(statusLine) lines.push(statusLine);
  if(p.hp<=0){ pushBattle(lines.join('<br>')); setTimeout(defeat,700); return; }
  endEnemyTurn(lines);
}
function endEnemyTurn(lines){ battle.round++; battle.turn='player'; pushBattle(lines.join('<br>')); renderBattle(); draw(); }
function guard(){ if(!battle || battle.turn!=='player') return; state.player.guard=true; battle.turn='resolving'; pushBattle('Vyra activates Guard Protocol. Finally, a responsible decision.'); setTimeout(enemyTurn,550); renderBattle(); }
function useMedPatch(){ if(!battle || battle.turn!=='player' || !(state.inventory.med_patch>0)) return; state.inventory.med_patch--; const heal=Math.min(state.player.maxHp-state.player.hp, DATA.items.med_patch.value); state.player.hp+=heal; battle.turn='resolving'; pushBattle(`Med Patch used. Recovered ${heal} HP. The database calls this "basic survival."`); setTimeout(enemyTurn,550); renderBattle(); }
function winBattle(){
  const e=battle.enemy; battle.ended=true; battle.turn='victory';
  state.player.xp+=e.xp; state.flags.anomalies=(state.flags.anomalies||0)+1; e.loot.forEach(id=>addItem(id,1));
  if(e.id==='sewer_king'){ state.flags.boss=true; state.map[state.player.y][state.player.x]='.'; }
  const leveled=[]; while(state.player.xp>=state.player.nextXp){ state.player.xp-=state.player.nextXp; levelUp(false); leveled.push(`SYNC LEVEL ${state.player.level}`); }
  const loot=e.loot.map(id=>DATA.items[id].name).join(', ');
  battleTitle.textContent='VICTORY // ANOMALY CLEARED';
  battleText.innerHTML=`<b>${e.name}</b> neutralized.<br>Synchronization +${e.xp}.<br>Recovered: ${loot}.${leveled.length?'<br>'+leveled.join('<br>'):''}<br><i>Vyra: “Cool. Now can we leave before the sewer unionizes?”</i>`;
  attackButtons.innerHTML='<button onclick="closeBattleVictory()">Return to Fracture</button>';
  renderBattle(); beep(880,.12,'triangle'); log(`ANOMALY CLEARED: ${e.name}. XP +${e.xp}. Loot: ${loot}.`);
}
function closeBattleVictory(){ overlay.classList.add('hidden'); battle=null; draw(); }
function defeat(){
  const lost=Math.min(state.player.xp, Math.ceil(state.player.nextXp*.15)); state.player.xp-=lost; state.player.hp=1; state.player.statuses=[]; state.player.guard=false;
  overlay.classList.add('hidden'); log(`OPERATOR DOWN. Emergency recovery restored Vyra at 1 HP. Sync lost: ${lost}. Absolutely tragic.`); battle=null; draw();
}
function levelUp(withLog=true){ const p=state.player; p.level++; p.nextXp=Math.floor(p.nextXp*1.35+20); p.maxHp+=8; p.hp=p.maxHp; p.atk+=2; p.def+=1; p.spd+=1; if(withLog) log(`SYNCHRONIZATION INCREASED: Level ${p.level}. Vyra is now statistically more annoying.`); beep(880,.12,'triangle'); }
function save(){ localStorage.setItem(SAVE_KEY,JSON.stringify(state)); }
function load(show=true){ const data=localStorage.getItem(SAVE_KEY); if(!data){ if(show) log('No archive found. The database shrugged.'); return false; } state=JSON.parse(data); state.player.statuses=state.player.statuses||[]; if(show) log('VECTOR ARCHIVE LOADED. Welcome back, Operator.'); draw(); return true; }
function reset(){ if(confirm('Purge local archive and restart?')){ localStorage.removeItem(SAVE_KEY); state=newState(); logBox.innerHTML=''; log('Archive purged. Fresh disaster initialized.'); draw(); } }
function openOperatorDb(){ operatorOverlay.classList.remove('hidden'); updateUI(); }
function openAnomalyDb(){ anomalyOverlay.classList.remove('hidden'); anomalyList.innerHTML=Object.values(DATA.enemies).map(e=>`<button class="anomaly-record-btn" onclick="selectAnomaly('${e.id}')"><img src="${e.icon}" alt="${e.name}"><span><b>${e.name}</b><small>${e.classification} // THREAT ${e.threatLevel}</small></span></button>`).join(''); }
function selectAnomaly(id){ const e=DATA.enemies[id]; anomalyFile.innerHTML=`<div class="anomaly-profile-grid"><div class="anomaly-art"><img src="${e.profile}" alt="${e.name}"></div><div class="anomaly-data"><div class="record-kicker">ANOMALY FILE // ${e.id.toUpperCase()}</div><h2>${e.name}</h2><p>${e.description}</p><div class="record-grid"><div><b>Classification</b><span>${e.classification}</span></div><div><b>Threat</b><span>${e.threatLevel}</span></div><div><b>HP</b><span>${e.hp}</span></div><div><b>Combat Protocols</b><span>${e.skills.map(s=>s.name).join(', ')}</span></div><div><b>Loot</b><span>${e.loot.map(x=>DATA.items[x].name).join(', ')}</span></div><div><b>Status Risk</b><span>${e.skills.map(s=>s.status?.name).filter(Boolean).join(', ') || 'None'}</span></div></div><h3>Final Replaceable Asset Paths</h3><code class="asset-code">assets/anomalies/${e.id}/profile.png\nassets/anomalies/${e.id}/battle.png\nassets/anomalies/${e.id}/icon.png\ndata/anomalies/${e.id}.json</code></div></div>`; }
function openFractureDb(){ fractureOverlay.classList.remove('hidden'); updateUI(); }

function openInventoryDb(){
  inventoryOverlay.classList.remove('hidden');
  const groups={};
  Object.values(DATA.items).forEach(item=>{ groups[item.category]=groups[item.category]||[]; groups[item.category].push(item); });
  inventoryDatabaseList.innerHTML = Object.entries(groups).map(([cat,items])=>`<div class="inventory-category"><h3>${cat}</h3>${items.map(item=>`<div class="inventory-record"><img src="${item.asset}" alt="${item.name}"><div><b>${item.name}</b><span>${item.rarity} // Owned x${state.inventory[item.id]||0}</span><p>${item.desc}</p><code>assets/items/${item.id}.png</code></div></div>`).join('')}</div>`).join('');
  updateUI();
}

function keyHandler(e){ const k=e.key.toLowerCase(); if(bootScreen && !bootScreen.classList.contains('hidden') && (e.key==='Enter'||e.key===' ')){ enterArchive(); return; } if(k==='arrowup'||k==='w') move(0,-1); if(k==='arrowdown'||k==='s') move(0,1); if(k==='arrowleft'||k==='a') move(-1,0); if(k==='arrowright'||k==='d') move(1,0); }

$('continueBtn').onclick=()=>openGame(true); $('newGameBtn').onclick=()=>{state=newState(); openGame(false); log('INITIALIZED: Operator Vyra deployed into F-001 Toxic Sewers.');}; $('operatorFilesBtn').onclick=openOperatorDb; $('anomalyIndexBtn').onclick=openAnomalyDb; $('fractureIndexBtn').onclick=openFractureDb; $('inventoryDbBtn').onclick=openInventoryDb; $('configBtn').onclick=()=>showMenuInfo('Configuration module placeholder. Audio, controls, and accessibility settings will live here.'); $('saveBtn').onclick=()=>{save();log('VECTOR ARCHIVE UPDATED.');draw();}; $('loadBtn').onclick=()=>load(true); $('resetBtn').onclick=reset; $('menuBtn').onclick=()=>{app.classList.add('hidden');mainMenu.classList.remove('hidden');}; $('closeOperatorDb').onclick=()=>operatorOverlay.classList.add('hidden'); $('closeAnomalyDb').onclick=()=>anomalyOverlay.classList.add('hidden'); $('closeFractureDb').onclick=()=>fractureOverlay.classList.add('hidden'); $('closeInventoryDb').onclick=()=>inventoryOverlay.classList.add('hidden'); enterBtn.onclick=enterArchive; document.addEventListener('keydown',keyHandler); document.querySelectorAll('[data-move]').forEach(b=>b.onclick=()=>{ const d=b.dataset.move; move(d==='right'?1:d==='left'?-1:0,d==='down'?1:d==='up'?-1:0); });
window.attack=attack; window.guard=guard; window.useMedPatch=useMedPatch; window.closeBattleVictory=closeBattleVictory; window.openOperatorDb=openOperatorDb; window.openInventoryDb=openInventoryDb; window.selectAnomaly=selectAnomaly;
visitTile(); runBoot(); updateUI();
