const TILE = 42;
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const logBox = document.getElementById('log');
const statsBox = document.getElementById('stats');
const invBox = document.getElementById('inventory');
const rosterBox = document.getElementById('roster');
const overlay = document.getElementById('battleOverlay');
const battleEnemyImg = document.getElementById('battleEnemy');
const battleTitle = document.getElementById('battleTitle');
const battleText = document.getElementById('battleText');
const battleHp = document.getElementById('battleHp');
const attackButtons = document.getElementById('attackButtons');

const bootScreen = document.getElementById('bootScreen');
const mainMenu = document.getElementById('mainMenu');
const app = document.getElementById('app');
const bootTerminal = document.getElementById('bootTerminal');
const bootLines = document.getElementById('bootLines');
const bootProgress = document.querySelector('#bootProgress span');
const bootLogo = document.getElementById('bootLogo');
const enterBtn = document.getElementById('enterBtn');
const menuInfo = document.getElementById('menuInfo');

const SAVE_KEY = 'project_ashvector_archive_001';
const BOOT_SEQUENCE = [
  {t:'ASH VECTOR OPERATING SYSTEM', glitch:false},
  {t:'Version 0.0.1 // Developer Build', glitch:false},
  {t:'', glitch:false},
  {t:'Initializing...', glitch:false},
  {t:'████████████████████ 100%', glitch:false},
  {t:'Connecting to ASH Network...', glitch:false},
  {t:'Connection Established.', glitch:false},
  {t:'Loading Classified Archives...', glitch:false},
  {t:'Operator Database... ONLINE', glitch:false},
  {t:'Anomaly Database... ONLINE', glitch:false},
  {t:'Reality Integrity...', glitch:false},
  {t:'ERROR', glitch:true},
  {t:'Reality Integrity: 18%', glitch:true},
  {t:'', glitch:false},
  {t:'WARNING', glitch:true},
  {t:'Unauthorized access detected.', glitch:true},
  {t:'', glitch:false},
  {t:'Can you hear me...?', glitch:false},
  {t:'', glitch:false},
  {t:'PROJECT:', glitch:false},
  {t:'ASH VECTOR', glitch:true}
];
let bootComplete = false;
let audioCtx = null;
function beep(freq=520, dur=0.035, type='square'){
  try{
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type; osc.frequency.value = freq;
    gain.gain.value = 0.035;
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + dur);
    osc.stop(audioCtx.currentTime + dur);
  }catch(e){}
}
function typeLine(line, done){
  let j=0;
  const text=line.t;
  if(!text){ bootLines.textContent += '\n'; done(); return; }
  const typer=setInterval(()=>{
    bootLines.textContent += text[j] || '';
    if(text[j] && text[j] !== ' ') beep(line.glitch?180+Math.random()*80:460+Math.random()*120, .025, line.glitch?'sawtooth':'square');
    j++;
    if(j>text.length){
      clearInterval(typer);
      bootLines.textContent += '\n';
      if(line.glitch){ bootTerminal.classList.add('glitch-hit'); setTimeout(()=>bootTerminal.classList.remove('glitch-hit'),300); }
      done();
    }
  }, line.glitch?18:26);
}
function runBoot(){
  let i=0;
  bootLines.textContent='';
  bootProgress.style.width='0%';
  function next(){
    bootProgress.style.width=Math.floor((i/BOOT_SEQUENCE.length)*100)+'%';
    if(i>=BOOT_SEQUENCE.length){
      bootProgress.style.width='100%';
      setTimeout(()=>{bootLogo.classList.remove('hidden'); bootComplete=true; beep(880,.08,'triangle');},450);
      return;
    }
    typeLine(BOOT_SEQUENCE[i++], next);
  }
  next();
}
function enterArchive(){
  if(!bootComplete){
    bootLines.textContent = BOOT_SEQUENCE.map(x=>x.t).join('\n')+'\n';
    bootProgress.style.width='100%';
    bootLogo.classList.remove('hidden');
    bootComplete=true;
    return;
  }
  bootScreen.classList.add('hidden');
  mainMenu.classList.remove('hidden');
  beep(700,.08,'triangle');
}
function openGame(loadExisting=false){
  mainMenu.classList.add('hidden');
  app.classList.remove('hidden');
  if(loadExisting) load(false);
  setTimeout(()=>canvas.focus?.(),50);
  draw();
}
function showMenuInfo(text){ menuInfo.textContent=text; beep(520,.035,'square'); }

const DATA = {
  character: {
    id:'vyra', name:'Vyra', rarity:'Starter', element:'Void', role:'Fast damage dealer',
    portrait:'assets/characters/vyra/portrait.png', battle:'assets/characters/vyra/battle.png', icon:'assets/characters/vyra/icon.png', spriteSheet:'assets/characters/vyra/sprite_sheet.png',
    baseStats:{hp:42, atk:9, def:4, spd:8, luck:3},
    attacks:[
      {name:'Neon Slash', power:9, type:'attack', line:'Vyra cuts the air so hard the sewer asks for therapy.'},
      {name:'Trash Talk', power:5, type:'debuff', line:'Vyra insults the enemy\'s entire bloodline and questionable smell.'},
      {name:'Void Kick', power:13, type:'attack', line:'A kick powered by bad decisions and premium neon.'},
      {name:'Emergency Flex', power:10, type:'heal', line:'Vyra heals herself by pretending this was all planned.'}
    ]
  },
  enemies: {
    toxic_slime:{id:'toxic_slime', name:'Toxic Slime', hp:24, atk:5, def:1, xp:12, asset:'assets/enemies/toxic_slime/battle.png', loot:['med_patch'], line:'It bubbles like expired soda and looks personally offended.'},
    rust_rat:{id:'rust_rat', name:'Rust Rat', hp:32, atk:7, def:2, xp:18, asset:'assets/enemies/rust_rat/battle.png', loot:['credit_chip'], line:'A rat wearing scrap metal like it pays rent here.'},
    cable_wraith:{id:'cable_wraith', name:'Cable Wraith', hp:38, atk:8, def:3, xp:24, asset:'assets/enemies/cable_wraith/battle.png', loot:['stale_energy_drink'], line:'A haunted cable bundle. Somehow still charges microtransactions.'},
    sewer_king:{id:'sewer_king', name:'The Sewer King', hp:75, atk:10, def:4, xp:60, asset:'assets/bosses/sewer_king/battle.png', loot:['toxic_core'], line:'He rules a kingdom of sludge. Honestly, still better than some landlords.'}
  },
  items: {
    med_patch:{id:'med_patch', name:'Med Patch', type:'heal', value:20, asset:'assets/items/med_patch.png'},
    stale_energy_drink:{id:'stale_energy_drink', name:'Stale Energy Drink', type:'buff', value:4, asset:'assets/items/stale_energy_drink.png'},
    rust_key:{id:'rust_key', name:'Rust Key', type:'key', value:1, asset:'assets/items/rust_key.png'},
    credit_chip:{id:'credit_chip', name:'Credit Chip', type:'currency', value:10, asset:'assets/items/credit_chip.png'},
    toxic_core:{id:'toxic_core', name:'Toxic Core', type:'quest', value:1, asset:'assets/items/toxic_core.png'}
  }
};

const mapRows = [
"########################",
"#P....C......#.........#",
"#..####..E...#..C......#",
"#...........###........#",
"#..E.....K.......####..#",
"#..........#####.......#",
"#....####...........E..#",
"#....#..C.....N........#",
"#....#.............#####",
"#........#####.........#",
"#..####......#.........#",
"#.........C..#....B.D..#",
"########################"
];

const imgCache = {};
function image(src){ if(!imgCache[src]){ const im=new Image(); im.src=src; imgCache[src]=im; } return imgCache[src]; }

let state = {
  player:{x:1,y:1,level:1,xp:0,nextXp:35,hp:42,maxHp:42,atk:9,def:4,spd:8,luck:3,character:'vyra'},
  unlocked:['vyra'],
  inventory:{med_patch:1},
  flags:{},
  map: mapRows.map(r=>r.split('')),
  message:'ACCESS GRANTED: Sector 001 loaded. The smell is classified.'
};
let battle = null;
function log(msg){ state.message=msg; const div=document.createElement('div'); div.className='logline'; div.textContent=msg; logBox.prepend(div); while(logBox.children.length>7) logBox.lastChild.remove(); }

function draw(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle='rgba(2,6,23,.95)'; ctx.fillRect(0,0,canvas.width,28); ctx.fillStyle='#67e8f9'; ctx.font='16px Consolas'; ctx.fillText('PROJECT: ASH VECTOR // SECTOR 001 // ARROW KEYS OR WASD TO MOVE',12,20);
  const W=state.map[0].length, H=state.map.length;
  for(let y=0;y<H;y++) for(let x=0;x<W;x++){
    const ch=state.map[y][x]; const px=x*TILE, py=y*TILE;
    ctx.fillStyle = ch==='#' ? '#172033' : '#0d1d1b'; ctx.fillRect(px,py,TILE,TILE);
    ctx.strokeStyle = ch==='#' ? 'rgba(168,85,247,.45)' : 'rgba(52,211,153,.15)'; ctx.strokeRect(px,py,TILE,TILE);
    if(ch==='#'){ ctx.fillStyle='rgba(168,85,247,.12)'; ctx.fillRect(px+5,py+5,TILE-10,TILE-10); }
    if(ch==='C'||ch==='K'){ ctx.fillStyle= ch==='K'?'#facc15':'#a855f7'; ctx.fillRect(px+10,py+12,22,20); ctx.fillStyle='#fff'; ctx.font='16px Arial'; ctx.fillText(ch==='K'?'K':'?',px+16,py+29); }
    if(ch==='E'||ch==='B'){ ctx.fillStyle= ch==='B'?'#fb7185':'#34d399'; ctx.beginPath(); ctx.arc(px+21,py+22,ch==='B'?17:13,0,Math.PI*2); ctx.fill(); ctx.fillStyle='#020617'; ctx.fillRect(px+14,py+18,5,5); ctx.fillRect(px+24,py+18,5,5); }
    if(ch==='D'){ ctx.fillStyle='#7c2d12'; ctx.fillRect(px+8,py+4,26,34); ctx.fillStyle='#facc15'; ctx.fillRect(px+28,py+21,4,4); }
    if(ch==='N'){ ctx.fillStyle='#22d3ee'; ctx.fillRect(px+12,py+10,18,24); ctx.fillStyle='#fff'; ctx.fillText('!',px+18,py+10); }
  }
  // player
  const p=state.player; const px=p.x*TILE, py=p.y*TILE;
  ctx.fillStyle='#f5f3ff'; ctx.beginPath(); ctx.arc(px+21,py+13,10,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#6d28d9'; ctx.fillRect(px+11,py+24,20,16); ctx.strokeStyle='#c084fc'; ctx.strokeRect(px+11,py+24,20,16);
  ctx.fillStyle='#fff'; ctx.font='12px Arial'; ctx.fillText('V',px+17,py+36);
  ctx.fillStyle='rgba(2,6,23,.72)'; ctx.fillRect(0,canvas.height-34,canvas.width,34); ctx.fillStyle='#fff'; ctx.font='18px Arial'; ctx.fillText(state.message,14,canvas.height-12);
  updateUI();
}

function updateUI(){
  const p=state.player;
  statsBox.innerHTML = ['Sync Lv '+p.level,'Sync '+p.xp+'/'+p.nextXp,'HP '+p.hp+'/'+p.maxHp,'PWR '+p.atk,'ARM '+p.def,'SPD '+p.spd,'RNG '+p.luck].map(s=>`<div class="stat">${s}</div>`).join('');
  rosterBox.innerHTML = `<div class="slot"><b>Vyra</b><br>Unlocked • Active Operator</div><div class="slot locked"><b>???</b><br>Locked Operator file</div><div class="slot locked"><b>???</b><br>Future Operator</div>`;
  invBox.innerHTML = Object.entries(state.inventory).filter(([k,v])=>v>0).map(([id,qty])=>{const it=DATA.items[id]; return `<div class="item"><img src="${it.asset}"><span>${it.name} x${qty}</span></div>`}).join('') || '<div class="slot">No records found. Tragic.</div>';
}

function move(dx,dy){ if(battle) return; const nx=state.player.x+dx, ny=state.player.y+dy; const tile=state.map[ny]?.[nx]; if(!tile || tile==='#') return log('ACCESS DENIED: wall-class object refuses to negotiate.');
  if(tile==='D'){ if(state.inventory.rust_key>0){ log('Rust Key authenticated. Door protocol failed successfully.'); state.inventory.rust_key--; state.map[ny][nx]='.'; } else return log('ACCESS DENIED: Rust Key required. Door is being dramatic.'); }
  if(tile==='C'){ const loot=['med_patch','credit_chip','stale_energy_drink'][Math.floor(Math.random()*3)]; addItem(loot,1); state.map[ny][nx]='.'; log('Archive crate decrypted. '+DATA.items[loot].name+' acquired. Probably legal. Probably.'); }
  if(tile==='K'){ addItem('rust_key',1); state.map[ny][nx]='.'; log('Rust Key acquired. Smells like tetanus and plot progression.'); }
  if(tile==='N'){ log('ARCHIVE WITNESS: The Sewer King is ahead. Mostly sludge, partly unresolved childhood issues.'); }
  if(tile==='E'){ state.map[ny][nx]='.'; startBattle(randomEnemy()); }
  if(tile==='B'){ state.map[ny][nx]='.'; startBattle(DATA.enemies.sewer_king,true); }
  state.player.x=nx; state.player.y=ny; draw(); }
function randomEnemy(){ const arr=[DATA.enemies.toxic_slime,DATA.enemies.rust_rat,DATA.enemies.cable_wraith]; return JSON.parse(JSON.stringify(arr[Math.floor(Math.random()*arr.length)])); }
function addItem(id,qty){ state.inventory[id]=(state.inventory[id]||0)+qty; }

function startBattle(enemy,isBoss=false){ battle={enemy:{...enemy,hp:enemy.hp,maxHp:enemy.hp}, isBoss, turn:'player'}; battleEnemyImg.src=enemy.asset; battleTitle.textContent=enemy.name; battleText.textContent=enemy.line; overlay.classList.remove('hidden'); renderBattle(); log('COMBAT PROTOCOL ENGAGED: '+enemy.name); }
function renderBattle(){ const p=state.player, e=battle.enemy; battleHp.innerHTML=`<b>OPERATOR HP</b><div class="hpbar"><span style="width:${Math.max(0,p.hp/p.maxHp*100)}%"></span></div><b>${e.name} HP</b><div class="hpbar"><span style="width:${Math.max(0,e.hp/e.maxHp*100)}%"></span></div>`; attackButtons.innerHTML=DATA.character.attacks.map((a,i)=>`<button onclick="useAttack(${i})">${a.name}</button>`).join(''); }
window.useAttack=function(i){ if(!battle || battle.turn!=='player')return; const p=state.player, e=battle.enemy, a=DATA.character.attacks[i]; let text=a.line+' '; if(a.type==='heal'){ const heal=Math.min(p.maxHp-p.hp,a.power+p.level*2); p.hp+=heal; text+='Healed '+heal+' HP.'; } else if(a.type==='debuff'){ const dmg=Math.max(1,Math.floor((p.atk+a.power-e.def)/2)); e.hp-=dmg; e.atk=Math.max(1,e.atk-1); text+='Dealt '+dmg+' damage and lowered enemy ATK.'; } else { const dmg=Math.max(1,p.atk+a.power-e.def+Math.floor(Math.random()*4)); e.hp-=dmg; text+='Dealt '+dmg+' damage.'; }
  battleText.textContent=text; if(e.hp<=0) return winBattle(); battle.turn='enemy'; renderBattle(); setTimeout(enemyTurn,650); }
function enemyTurn(){ if(!battle)return; const p=state.player,e=battle.enemy; const dmg=Math.max(1,e.atk-p.def+Math.floor(Math.random()*3)); p.hp-=dmg; battleText.textContent=`${e.name} hits for ${dmg}. Rude, but technically fair.`; if(p.hp<=0) return loseBattle(); battle.turn='player'; renderBattle(); draw(); }
function winBattle(){ const e=battle.enemy; battleText.textContent=`${e.name} defeated. The sewer briefly becomes 3% less embarrassing.`; state.player.xp+=e.xp; (e.loot||[]).forEach(id=>addItem(id,1)); log(`Hostile erased. +${e.xp} XP. Loot: ${(e.loot||[]).map(id=>DATA.items[id].name).join(', ')||'none'}`); levelCheck(); setTimeout(()=>{overlay.classList.add('hidden'); battle=null; draw();},900); }
function loseBattle(){ log('Vyra got dropped. Respawned at start because this is a prototype, not a tax audit.'); state.player.hp=state.player.maxHp; state.player.x=1; state.player.y=1; overlay.classList.add('hidden'); battle=null; draw(); }
function levelCheck(){ const p=state.player; while(p.xp>=p.nextXp){ p.xp-=p.nextXp; p.level++; p.nextXp=Math.floor(p.nextXp*1.45); p.maxHp+=8; p.hp=p.maxHp; p.atk+=3; p.def+=1; p.spd+=1; log('SYNC INCREASED: Vyra reached level '+p.level+'. Ego expansion detected.'); }}

function save(){ localStorage.setItem(SAVE_KEY,JSON.stringify(state)); log('VECTOR ARCHIVE UPDATED. Future you owes present you a snack.'); }
function load(drawAfter=true){ const s=localStorage.getItem(SAVE_KEY); if(s){ state=JSON.parse(s); log('VECTOR ARCHIVE RESTORED. Time travel, but with paperwork.'); if(drawAfter) draw(); return true; } else { log('NO VECTOR ARCHIVE FOUND. Empty like a loot box after rent.'); return false; } }
function reset(){ localStorage.removeItem(SAVE_KEY); location.reload(); }

document.addEventListener('keydown',e=>{ if(!bootScreen.classList.contains('hidden')){ if(e.key==='Enter' || e.key===' '){ enterArchive(); } return; } if(!mainMenu.classList.contains('hidden')){ if(e.key==='Enter'){ openGame(true); } return; } if(e.key==='Escape'){ app.classList.add('hidden'); mainMenu.classList.remove('hidden'); return; } if(e.key==='ArrowUp'||e.key.toLowerCase()==='w')move(0,-1); if(e.key==='ArrowDown'||e.key.toLowerCase()==='s')move(0,1); if(e.key==='ArrowLeft'||e.key.toLowerCase()==='a')move(-1,0); if(e.key==='ArrowRight'||e.key.toLowerCase()==='d')move(1,0); });
document.querySelectorAll('[data-move]').forEach(b=>b.addEventListener('click',()=>{const m=b.dataset.move; if(m==='up')move(0,-1); if(m==='down')move(0,1); if(m==='left')move(-1,0); if(m==='right')move(1,0);}));
document.getElementById('saveBtn').onclick=save; document.getElementById('loadBtn').onclick=()=>load(true); document.getElementById('resetBtn').onclick=reset; document.getElementById('menuBtn').onclick=()=>{app.classList.add('hidden'); mainMenu.classList.remove('hidden');};
enterBtn.onclick=enterArchive; bootScreen.addEventListener('click',(e)=>{ if(e.target===bootScreen) enterArchive(); });
document.getElementById('continueBtn').onclick=()=>openGame(true);
document.getElementById('newGameBtn').onclick=()=>openGame(false);
document.getElementById('archiveBtn').onclick=()=>showMenuInfo(localStorage.getItem(SAVE_KEY)?'VECTOR ARCHIVE 001 located. Status: recoverable. Smell: still classified.':'No archive found. Initialize Operator to begin.');
document.getElementById('operatorFilesBtn').onclick=()=>showMenuInfo('OPERATOR FILES: Vyra unlocked. Additional Operator records are encrypted for future builds.');
document.getElementById('anomalyIndexBtn').onclick=()=>showMenuInfo('ANOMALY INDEX: Toxic Slime, Rust Rat, Cable Wraith, Sewer King. All gross.');
document.getElementById('configBtn').onclick=()=>showMenuInfo('CONFIGURATION: Audio beeps enabled by interaction. Press ESC in-game to return to database menu.');
runBoot();
log(state.message); draw();
