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
    'Version 0.9.1 // TILE FLOOR PASS',
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

  // v58: hard audio recovery manager.
  // Browser rule: music cannot begin until the first real click/key/tap.
  // This manager keeps a desired track queued, unlocks from any gesture/SFX,
  // and force-resumes the current track whenever the game state changes.
  const BUILD_VERSION = '0.9.1';
  const MAP_VERSION = 'sector_stage_v7';
  const MUSIC = {
    intro: 'assets/music/intro.mp3',
    level1: 'assets/music/level1.mp3',
    battle: 'assets/music/battle.mp3',
    boss: 'assets/music/boss.mp3',
    pause: 'assets/music/pause.mp3'
  };

  const AudioManager = {
    tracks: {},
    current: null,
    requested: 'intro',
    unlocked: false,
    volume: 0.58,
    fadeToken: 0,
    watchdogTimer: null,
    musicStopped: false,

    init(){
      Object.entries(MUSIC).forEach(([key, src]) => {
        const audio = new Audio(`${src}?v=${BUILD_VERSION}`);
        audio.loop = true;
        audio.preload = 'auto';
        audio.volume = 0;
        audio.muted = false;
        audio.setAttribute('playsinline', 'true');
        audio.addEventListener('ended', () => this.recover(key));
        audio.addEventListener('pause', () => { if(this.unlocked && this.requested === key) setTimeout(() => this.recover(key), 180); });
        audio.addEventListener('stalled', () => this.recover(key));
        audio.addEventListener('error', () => console.warn('[AV Audio] File error:', key, audio.error));
        this.tracks[key] = audio;
      });

      const unlock = () => {
        this.unlock();
        this.forceResume();
      };
      ['pointerdown','mousedown','click','touchstart','keydown'].forEach(evt => {
        window.addEventListener(evt, unlock, { capture:true, passive:true });
      });

      document.addEventListener('visibilitychange', () => {
        if(!document.hidden) this.forceResume();
      });
      window.addEventListener('focus', () => this.forceResume());

      if(!this.watchdogTimer){
        this.watchdogTimer = setInterval(() => this.watchdog(), 900);
      }
      window.AV_AUDIO = this;
    },

    unlock(){
      if(this.unlocked) return;
      this.unlocked = true;
      this.forceResume();
    },

    force(key){
      if(key) this.requested = key;
      this.unlocked = true;
      return this.play(this.requested, true);
    },

    forceResume(){
      if(!this.unlocked) return;
      try{ if(typeof activeMusicForState === 'function') this.requested = activeMusicForState(); }catch(err){}
      if(!this.requested) this.requested = 'intro';
      return this.play(this.requested, true);
    },

    play(key, immediate=false){
      if(!key || !this.tracks[key]) return;
      this.requested = key;
      this.musicStopped = false;
      if(!this.unlocked) return;

      const next = this.tracks[key];
      next.loop = true;
      next.muted = false;

      // Stop all non-requested tracks immediately when doing recovery-style switches.
      Object.entries(this.tracks).forEach(([name, audio]) => {
        if(name !== key){
          if(immediate){
            audio.pause();
            audio.volume = 0;
          } else if(!audio.paused || audio.volume > 0){
            const token = ++this.fadeToken;
            this.fade(audio, audio.volume || 0, 0, 400, () => {
              if(token === this.fadeToken){
                audio.pause();
                audio.volume = 0;
              }
            });
          }
        }
      });

      this.current = key;
      const startPlayback = () => {
        try{
          // Keep currentTime untouched so loops continue naturally.
          const promise = next.play();
          if(promise && promise.catch){
            promise.catch(err => {
              console.warn('[AV Audio] Music blocked/failed:', key, err);
            });
          }
        }catch(err){
          console.warn('[AV Audio] Music error:', key, err);
        }
      };
      startPlayback();
      this.fade(next, next.volume || 0, this.volume, immediate ? 80 : 520);
    },

    fade(audio, from, to, ms=500, done){
      const start = performance.now();
      const safeFrom = Math.max(0, Math.min(1, Number.isFinite(from) ? from : 0));
      const safeTo = Math.max(0, Math.min(1, to));
      const tick = now => {
        const t = Math.min(1, (now - start) / Math.max(1, ms));
        audio.volume = safeFrom + (safeTo - safeFrom) * t;
        if(t < 1) requestAnimationFrame(tick);
        else { audio.volume = safeTo; if(done) done(); }
      };
      requestAnimationFrame(tick);
    },

    recover(key){
      if(this.musicStopped || !this.unlocked) return;
      const wanted = this.requested || key || 'intro';
      if(key && key !== wanted) return;
      const audio = this.tracks[wanted];
      if(!audio) return;
      audio.loop = true;
      audio.muted = false;
      if(audio.volume <= 0.02) audio.volume = this.volume;
      try{
        const promise = audio.play();
        if(promise && promise.catch) promise.catch(()=>{});
      }catch(err){}
    },

    watchdog(){
      if(this.musicStopped || !this.unlocked) return;
      try{ if(typeof activeMusicForState === 'function') this.requested = activeMusicForState(); }catch(err){}
      const key = this.requested || 'intro';
      const audio = this.tracks[key];
      if(!audio) return;

      Object.entries(this.tracks).forEach(([name, track]) => {
        if(name !== key && !track.paused){
          track.pause();
          track.volume = 0;
        }
      });

      audio.loop = true;
      audio.muted = false;
      if(audio.volume < this.volume * 0.55) audio.volume = this.volume;
      if(audio.paused || audio.ended || audio.readyState === 0){
        this.recover(key);
      }
      if(Number.isFinite(audio.duration) && audio.duration > 0 && audio.currentTime >= audio.duration - 0.08){
        try{ audio.currentTime = 0; }catch(err){}
        this.recover(key);
      }
    },

    setVolume(v){
      this.volume = Math.max(0, Math.min(1, v));
      if(this.current && this.tracks[this.current]) this.tracks[this.current].volume = this.volume;
    },

    stopMusic(){
      this.musicStopped = true;
      this.current = null;
      Object.values(this.tracks).forEach(a => { a.pause(); a.volume = 0; });
    },

    pauseAll(){
      // Kept for old calls. Do not forget the requested track; the next state change can resume.
      this.current = null;
      Object.values(this.tracks).forEach(a => { a.pause(); a.volume = 0; });
    },

    status(){
      return {
        requested: this.requested,
        current: this.current,
        unlocked: this.unlocked,
        tracks: Object.fromEntries(Object.entries(this.tracks).map(([k,a]) => [k, {paused:a.paused, volume:a.volume, time:a.currentTime, src:a.currentSrc||a.src}]))
      };
    }
  };
  AudioManager.init();

  // v55/v56: Sound effects manager. Uses short one-shot clones so effects can overlap.
  const SFX = {
    step: 'assets/sound fx/steps.mp3',
    item: 'assets/sound fx/item-pickup.mp3',
    battleWin: 'assets/sound fx/battle-win.mp3',
    levelWin: 'assets/sound fx/level-win.mp3',
    death: 'assets/sound fx/death.mp3',
    slashes: [
      'assets/sound fx/slash1.mp3',
      'assets/sound fx/slash2.mp3',
      'assets/sound fx/slash3.mp3',
      'assets/sound fx/slash4.mp3'
    ]
  };

  const SfxManager = {
    cache: {},
    volume: 0.72,
    muted: false,
    lastStep: 0,

    init(){
      const all = [SFX.step, SFX.item, SFX.battleWin, SFX.levelWin, SFX.death, ...SFX.slashes];
      all.forEach(src => {
        const audio = new Audio(`${src}?v=${BUILD_VERSION}`);
        audio.preload = 'auto';
        audio.volume = this.volume;
        this.cache[src] = audio;
      });
      window.AV_SFX = this;
    },

    play(src, volume=this.volume, playbackRate=1){
      if(!src || this.muted || this.volume <= 0.001) return;
      AudioManager.unlock();
      try{
        const base = this.cache[src] || new Audio(`${src}?v=${BUILD_VERSION}`);
        const a = base.cloneNode(true);
        const scale = this.volume / 0.72;
        a.volume = Math.max(0, Math.min(1, volume * scale));
        a.playbackRate = Math.max(0.55, Math.min(1.55, Number.isFinite(playbackRate) ? playbackRate : 1));
        a.play().catch(()=>{});
      }catch(err){}
    },

    setVolume(v){
      this.volume = Math.max(0, Math.min(1, Number.isFinite(v) ? v : 0.72));
      Object.values(this.cache).forEach(a => { a.volume = this.volume; });
    },

    setMuted(flag){
      this.muted = !!flag;
    },

    step(){
      const now = performance.now();
      if(now - this.lastStep < 115) return;
      this.lastStep = now;
      this.play(SFX.step, 0.45);
    },

    slash(){
      const pick = SFX.slashes[Math.floor(Math.random() * SFX.slashes.length)];
      this.play(pick, 0.82, 0.95 + Math.random() * 0.18);
    },

    enemyAttack(isBoss=false, dodged=false){
      // v77: enemy/boss attacks now have audio too. Uses the existing slash bank,
      // pitched lower for boss hits so no new SFX files are required.
      const pick = SFX.slashes[Math.floor(Math.random() * SFX.slashes.length)];
      const rate = isBoss ? (0.68 + Math.random() * 0.10) : (0.78 + Math.random() * 0.22);
      const volume = isBoss ? 0.98 : 0.76;
      this.play(pick, dodged ? volume * 0.55 : volume, rate);
    },

    item(){ this.play(SFX.item, 0.75); },
    battleWin(){ this.play(SFX.battleWin, 0.82); },
    levelWin(){ this.play(SFX.levelWin, 0.86); },
    death(){ this.play(SFX.death, 0.9); }
  };
  SfxManager.init();

  const uiState = { mode: 'boot', returnStack: [] };
  let gameStarted = false;
  function activeMusicForState(){
    // v58: music follows real UI/game state.
    // Before the first game start, closing any menu/database always returns to intro.mp3.
    if(battle) return battle.code === 'B' ? 'boss' : 'battle';
    if(uiState.mode === 'overlay') return 'pause';
    if(uiState.mode === 'game' && gameStarted && !$('app').classList.contains('hidden')) return 'level1';
    if(uiState.mode === 'menu' || !document.querySelector('#mainMenu.hidden')) return 'intro';
    return gameStarted ? 'level1' : 'intro';
  }
  function refreshMusic(){ AudioManager.play(activeMusicForState()); }

  function ensureSettings(){
    state.settings ||= {};
    if(typeof state.settings.crt !== 'boolean') state.settings.crt = true;
    if(typeof state.settings.reducedMotion !== 'boolean') state.settings.reducedMotion = false;
    if(typeof state.settings.largeText !== 'boolean') state.settings.largeText = false;
    if(typeof state.settings.musicVolume !== 'number') state.settings.musicVolume = 0.58;
    if(typeof state.settings.sfxVolume !== 'number') state.settings.sfxVolume = 0.72;
    if(typeof state.settings.musicMuted !== 'boolean') state.settings.musicMuted = false;
    if(typeof state.settings.sfxMuted !== 'boolean') state.settings.sfxMuted = false;
  }

  function applyAudioSettings(){
    if(!state) return;
    ensureSettings();
    AudioManager.setVolume(state.settings.musicMuted ? 0 : state.settings.musicVolume);
    SfxManager.setVolume(state.settings.sfxVolume);
    SfxManager.setMuted(state.settings.sfxMuted);
    if(state.settings.musicMuted) AudioManager.pauseAll();
    else AudioManager.forceResume();
  }

  function setAudioSetting(key, value){
    ensureSettings();
    if(key === 'musicVolume') state.settings.musicVolume = Math.max(0, Math.min(1, Number(value)));
    if(key === 'sfxVolume') state.settings.sfxVolume = Math.max(0, Math.min(1, Number(value)));
    if(key === 'musicMuted') state.settings.musicMuted = !!value;
    if(key === 'sfxMuted') state.settings.sfxMuted = !!value;
    applyAudioSettings();
    renderAudioMixer();
    queueAutosave();
  }

  function testSfxSetting(){ SfxManager.item(); }
  function testMusicSetting(){ AudioManager.force(activeMusicForState()); }

  // v53: Maze-first F-001 layout. Walls are collision first, art second.
  // v90: proper level layout pass.
  // The old routes were functional, but they read like maze noise after the tileset swap.
  // These maps use bigger rooms, clear corridors, locked boss yards, and obvious landmarks.
  const baseMap = [
    '########################################',
    '#........###############################',
    '#.P................#####################',
    '#....S.........C...#####################',
    '#..................#####################',
    '#.........#........#####################',
    '#######...#...E....#####################',
    '#######...#........#####################',
    '#######...###...########################',
    '#######...###...#...........############',
    '####............#...........############',
    '####................C.......############',
    '####........................############',
    '####....E................E..############',
    '####........H.###...........############',
    '####..........###...........############',
    '####..........#######...################',
    '#######...###########...################',
    '#######...###########...########.......#',
    '#######...###########...########.......#',
    '##.............................D..B..X.#',
    '##...L.....................#####.......#',
    '##.......................C.#####.......#',
    '##.........................#####.......#',
    '########################################'
  ];

  // v66: stage definitions now drive a real multi-map route.
  // v90: F-002 and F-003 were rebuilt from maze corridors into readable encounter arenas.
  const stage2Map = [
    '########################################',
    '#...........############################',
    '#...........#.............##############',
    '#.P....S..................#...........##',
    '#.................C.......#...........##',
    '#.....................................##',
    '#...........#.........................##',
    '#########...#.........E...............##',
    '#########...#.............#...........##',
    '#########...###########...#...........##',
    '#########...###########...##############',
    '#####.............#............#########',
    '#####.............#..........E.#########',
    '#####..........................#########',
    '#####.....E...............H....#########',
    '#####..........................#########',
    '#####..........C..#............#########',
    '#####.............#............#########',
    '########...############...######.......#',
    '########...############...######.......#',
    '####...........................D..B..X.#',
    '####...L.................#######.......#',
    '####...................C.#######.......#',
    '####.....................#######.......#',
    '########################################'
  ];

  const stage3Map = [
    '########################################',
    '#.........##...........#################',
    '#.P....................##..............#',
    '#.....S.........C......................#',
    '#......................................#',
    '#.........##........E..................#',
    '######...###...........##..............#',
    '######...#############.................#',
    '######...########.............##########',
    '###............##.............##########',
    '###...........................##########',
    '###........................E..##########',
    '###.......E...................##########',
    '###............##.............##########',
    '###............##.............##########',
    '###............##.............##########',
    '###########...########...###############',
    '###########...########...###############',
    '####.................#..........#......#',
    '####.........................C..#......#',
    '####.L..........................D..B..X#',
    '####.....................H......#......#',
    '####...........C.....##.........#......#',
    '####.................##.........#......#',
    '########################################'
  ];

  function normalizeMapRows(rows){
    const width = Math.max(...rows.map(r=>r.length));
    return rows.map(r => (r + '#'.repeat(width)).slice(0,width));
  }
  const STAGE_DEFS = {
    f001: {key:'f001', id:'F-001', title:'Forbidden Graveyard', chapter:'Chapter 1 // The Awakening', levelReq:1, map:normalizeMapRows(baseMap), threat:'LOW → BOSS CLASS', objective:'grave terminal → 3 anomalies → boss → extraction', reward:'40 Credits, Rust Core, Corrupted Catalyst, Vyra Shards', rewardCredits:40, rewardShards:3, clearXp:220, nextKey:'f002', bg:'assets/battle_backgrounds/toxic_sewers_battle.png'},
    f002: {key:'f002', id:'F-002', title:'Ash Wastes Outpost', chapter:'Chapter 2 // Broken Signal', levelReq:5, map:normalizeMapRows(stage2Map), threat:'MEDIUM // OUTPOST CLASS', objective:'outpost terminal → three imported anomalies → existing boss → extraction', reward:'95 Credits, Burnt Alloy, Outpost Access Chip, Ashveil Mother Core chance, Vyra Shards', rewardCredits:95, rewardShards:6, clearXp:360, nextKey:'f003', bg:'assets/battle_backgrounds/ash_wastes_battle.png'},
    f003: {key:'f003', id:'F-003', title:'Neon Graveyard', chapter:'Chapter 3 // Dead Frequencies', levelReq:12, map:normalizeMapRows(stage3Map), threat:'HIGH // GRAVEYARD CLASS', objective:'grave terminal → 3 existing-library anomalies → shade boss → extraction', reward:'120 Credits, 2 Rust Cores, 2 Catalysts, 7 Vyra Shards', rewardCredits:120, rewardShards:7, clearXp:550, nextKey:null, bg:'assets/battle_backgrounds/neon_graveyard_battle.png'}
  };
  function currentStageKey(){ return state?.currentStage || 'f001'; }
  function stageDef(key=currentStageKey()){ return STAGE_DEFS[key] || STAGE_DEFS.f001; }
  function battleBgForStage(key=currentStageKey()){ return stageDef(key).bg || STAGE_DEFS.f001.bg; }
  function parseStageMap(key){
    const def=stageDef(key); const map=def.map.map(r=>r.split(''));
    let px=1,py=1;
    map.forEach((row,y)=>row.forEach((c,x)=>{ if(c==='P'){ px=x; py=y; map[y][x]='.'; }}));
    return {map, px, py};
  }


  // v74/v75: NPC contact system. NPCs are drawn on the map, can be clicked,
  // or can be talked to by standing near them and pressing E. v75 moves them deeper
  // into each route and supports alternating speaker portraits during dialog.
  // v76 moves the talk prompt to Fermilat's feet and adds one-time NPC stash rewards.
  const NPC_DEFS = {
    fermilat: {
      id: 'fermilat',
      name: 'Fermilat',
      asset: 'assets/npcs/fermilat.png',
      stages: {
        // v75: Fermilat is deeper in each route now, closer to the boss side-path.
        // He is meant to feel like a weird optional NPC you find, not a spawn greeter.
        f001: {x:30, y:22, scene:'fermilatF001'},
        f002: {x:31, y:20, scene:'fermilatF002'},
        f003: {x:27, y:21, scene:'fermilatF003'}
      }
    }
  };

  // v81: lightweight side quest journal. Fermilat now offers a small optional
  // grind objective per stage after you find him near the boss route.
  const FERMILAT_FAVOR_DEFS = {
    f001:{title:"Fermilat\'s Suspicious Favor", target:3, credits:35, syncXp:70, skillXp:120, items:{'Vector Cell':1,'Med Patch':1}, ask:'Fermilat wants you to defeat 3 anomalies before he "trusts your footwork."', done:'Fermilat is weirdly proud of your graveyard footwork.'},
    f002:{title:'Ash Wastes Footwork', target:4, credits:65, syncXp:115, skillXp:180, items:{'Vector Cell':2,'Burnt Alloy':2}, ask:'Fermilat wants proof you can survive the dry outpost without sending evidence.', done:'Fermilat says the ash is terrible for "collectible preservation."'},
    f003:{title:'Graveyard Toe-tal Chaos', target:5, credits:95, syncXp:165, skillXp:260, items:{'Vector Cell':2,'Corrupted Catalyst':1}, ask:'Fermilat wants 5 graveyard anomalies deleted. He calls it "spooky foot traffic control."', done:'Fermilat congratulates you in the least normal way possible.'}
  };
  function sideQuestKey(stage=currentStageKey()){ return `fermilat:${stage}`; }
  function ensureSideQuests(){
    if(!state) return;
    state.sideQuests ||= {};
    Object.entries(FERMILAT_FAVOR_DEFS).forEach(([stage,def]) => {
      const key=sideQuestKey(stage);
      state.sideQuests[key] ||= {id:key, stage, npc:'fermilat', title:def.title, status:'locked', progress:0, target:def.target, claimed:false};
      const q=state.sideQuests[key];
      q.title=def.title; q.target=def.target; q.stage=stage; q.npc='fermilat';
      if(q.claimed) q.status='claimed';
      else if(q.status !== 'active' && q.status !== 'complete') q.status = (state.npcTalks?.[`fermilat:${stage}`] ? 'active' : 'locked');
      if(q.status === 'active' && q.progress >= q.target) q.status='complete';
    });
  }
  function fermilatQuest(stage=currentStageKey()){ ensureSideQuests(); return state.sideQuests[sideQuestKey(stage)]; }
  function startFermilatQuest(stage=currentStageKey()){
    ensureSideQuests();
    const q=fermilatQuest(stage);
    if(!q || q.claimed || q.status === 'active' || q.status === 'complete') return false;
    q.status='active'; q.progress=Math.max(0, q.progress||0);
    log(`Side quest started: ${q.title}.`);
    toast(`Side quest started: ${q.title}`);
    queueAutosave();
    return true;
  }
  function advanceSideQuests(enemyName='Anomaly'){
    ensureSideQuests();
    const q=fermilatQuest(currentStageKey());
    if(!q || q.status !== 'active') return;
    q.progress=Math.min(q.target, (q.progress||0)+1);
    q.lastTarget=enemyName;
    if(q.progress >= q.target){
      q.status='complete';
      log(`${q.title} complete. Return to Fermilat for a reward.`);
      toast('Side quest complete. Return to Fermilat.');
    }
    queueAutosave();
  }
  function claimFermilatQuest(stage=currentStageKey()){
    ensureSideQuests();
    const q=fermilatQuest(stage);
    const def=FERMILAT_FAVOR_DEFS[stage];
    if(!q || q.status !== 'complete' || q.claimed) return false;
    q.status='claimed'; q.claimed=true; q.claimedAt=Date.now();
    addCredits(def.credits||0);
    if(def.syncXp) gainXp(def.syncXp);
    if(def.skillXp) grantStyleXp('slayer', def.skillXp);
    Object.entries(def.items||{}).forEach(([name,qty])=>addItem(name,qty));
    log(`Side quest reward claimed: ${def.title}. +${def.credits||0} credits.`);
    toast(`Quest reward claimed: ${def.title}`);
    save(true);
    return true;
  }
  function sideQuestStatusText(stage=currentStageKey()){
    const q=fermilatQuest(stage); const def=FERMILAT_FAVOR_DEFS[stage];
    if(!q || !def) return 'No side quest available.';
    if(q.status === 'claimed') return `✅ ${q.title}: claimed`;
    if(q.status === 'complete') return `✅ ${q.title}: return to Fermilat`;
    if(q.status === 'active') return `⬜ ${q.title}: ${q.progress}/${q.target} anomalies`;
    return `⬜ Find Fermilat near the boss route to unlock his side quest.`;
  }
  function sideQuestHtml(stage=currentStageKey()){
    const q=fermilatQuest(stage); const def=FERMILAT_FAVOR_DEFS[stage] || FERMILAT_FAVOR_DEFS.f001;
    const pct=q ? Math.min(100, Math.floor((q.progress||0)/Math.max(1,q.target||def.target)*100)) : 0;
    const reward=`${def.credits} credits // ${def.syncXp} Sync XP // ${def.skillXp} Anomaly Hunting XP${Object.entries(def.items||{}).map(([n,qty])=>` // ${qty} ${n}`).join('')}`;
    return `<section class="fracture-card side-quest-board"><div class="record-kicker">SIDE QUEST // FERMILAT FAVOR</div><h3>${safeHtml(def.title)}</h3><p>${safeHtml(q?.status==='claimed' ? def.done : def.ask)}</p><div class="statrow">Progress ${q?.progress||0}/${q?.target||def.target}<div class="bar xp"><span style="width:${pct}%"></span></div></div><div class="protocol-list"><div><b>Status</b><span>${safeHtml(sideQuestStatusText(stage))}</span></div><div><b>Reward</b><span>${safeHtml(reward)}</span></div></div><button onclick="window.AV.claimFermilatQuest('${stage}')" ${q?.status==='complete'?'':'disabled'}>${q?.status==='complete'?'Claim Reward':'Talk / Hunt to Progress'}</button></section>`;
  }

  function stageNpcs(key=currentStageKey()){
    return Object.values(NPC_DEFS).map(n => {
      const pos = n.stages[key];
      return pos ? {...n, ...pos, stage:key} : null;
    }).filter(Boolean);
  }
  function npcAt(x,y,key=currentStageKey()){
    return stageNpcs(key).find(n => n.x === x && n.y === y) || null;
  }
  function nearbyNpc(){
    const px = state.player.x, py = state.player.y;
    return stageNpcs().find(n => Math.max(Math.abs(n.x-px), Math.abs(n.y-py)) <= 1) || null;
  }
  function npcPlayerNearby(npc){
    if(!state?.player || !npc) return false;
    return Math.max(Math.abs(npc.x-state.player.x), Math.abs(npc.y-state.player.y)) <= 1;
  }
  function ensureNpcState(){
    if(!state) return;
    state.npcTalks ||= {};
    state.npcRewards ||= {};
    state.sideQuests ||= {};
  }
  function npcRewardKey(npc){ return `${npc.id}:${npc.stage}`; }
  function talkToNpc(npc){
    if(storyActive || battle || !npc) return false;
    ensureNpcState();
    const key=npcRewardKey(npc);
    state.npcTalks[key]=(state.npcTalks[key]||0)+1;
    showStory(npc.scene, () => finishNpcTalk(npc));
    queueAutosave();
    return true;
  }
  function finishNpcTalk(npc){
    ensureNpcState(); ensureSideQuests();
    const key=npcRewardKey(npc);
    const q=fermilatQuest(npc.stage);
    const claimedQuest=claimFermilatQuest(npc.stage);
    if(!claimedQuest){
      if(q?.status === 'locked') startFermilatQuest(npc.stage);
      else if(q?.status === 'active') log(`${npc.name} side quest: ${q.progress}/${q.target} anomalies deleted.`);
      else if(q?.status === 'claimed') log(`${npc.name} side quest already claimed on ${stageDef(npc.stage).id}.`);
    }
    if(state.npcRewards[key]){
      if(!claimedQuest) toast(sideQuestStatusText(npc.stage));
      renderAll();
      return;
    }
    const rewards = {
      f001:{credits:15, items:{'Vector Cell':1,'Med Patch':1}, label:'Fermilat Creep Stash'},
      f002:{credits:30, items:{'Vector Cell':2,'Burnt Alloy':1}, label:'Fermilat Ash Stash'},
      f003:{credits:45, items:{'Vector Cell':2,'Corrupted Catalyst':1}, label:'Fermilat Grave Stash'}
    }[npc.stage] || {credits:15, items:{'Vector Cell':1}, label:'Fermilat Stash'};
    state.npcRewards[key]=true;
    addCredits(rewards.credits||0);
    Object.entries(rewards.items||{}).forEach(([name,qty])=>addItem(name,qty));
    log(`${rewards.label} recovered. Fermilat says this is absolutely not weird. +${rewards.credits||0} credits.`);
    toast(`${rewards.label} recovered.`);
    save(true);
    renderAll();
  }
  function interactNearbyNpc(){
    if(storyActive || battle) return false;
    const npc = nearbyNpc();
    if(!npc){ toast('No NPC close enough. Find Fermilat deeper in the route and press E.'); return false; }
    talkToNpc(npc);
    return true;
  }
  function drawNpc(npc){
    const x = npc.x * TILE, y = npc.y * TILE;
    const im = images[npc.asset];
    const drawW = 48;
    const drawH = 76;
    const dx = x + (TILE-drawW)/2;
    const dy = y + TILE - drawH + 6;
    ctx.save();
    ctx.fillStyle='rgba(0,0,0,.48)';
    ctx.beginPath();
    ctx.ellipse(x+TILE/2,y+TILE-4,18,7,0,0,Math.PI*2);
    ctx.fill();
    ctx.shadowColor='#94ff62';
    ctx.shadowBlur=13;
    if(im && im.complete && im.naturalWidth){
      const oldSmooth = ctx.imageSmoothingEnabled;
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(im, dx, dy, drawW, drawH);
      ctx.imageSmoothingEnabled = oldSmooth;
    } else {
      ctx.fillStyle='#1c3b20'; ctx.fillRect(x+9,y+2,24,38);
      ctx.fillStyle='#94ff62'; ctx.fillRect(x+13,y+11,16,6);
    }
    ctx.shadowBlur=0;
    const near = npcPlayerNearby(npc);
    if(near){
      // v76: prompt moved down to Fermilat's feet so it no longer covers nearby caches/stashes.
      const labelW=64, labelH=14;
      const labelX=x+(TILE-labelW)/2;
      const labelY=y+TILE-12;
      ctx.fillStyle='rgba(8,12,14,.84)';
      ctx.fillRect(labelX,labelY,labelW,labelH);
      ctx.strokeStyle='rgba(148,255,98,.72)';
      ctx.strokeRect(labelX+.5,labelY+.5,labelW-1,labelH-1);
      ctx.fillStyle='#b9ff7c';
      ctx.font='10px monospace';
      ctx.textAlign='center';
      ctx.fillText('PRESS E', x+TILE/2, labelY+10);
    }
    ctx.strokeStyle=near?'rgba(148,255,98,.88)':'rgba(148,255,98,.38)';
    ctx.lineWidth=near?2:1;
    ctx.strokeRect(x+5,y+4,TILE-10,TILE-8);
    ctx.restore();
  }
  function drawNpcs(){ stageNpcs().forEach(drawNpc); }
  function handleCanvasNpcClick(evt){
    if(storyActive || battle || $('app').classList.contains('hidden')) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const mx = (evt.clientX - rect.left) * scaleX + camera.x;
    const my = (evt.clientY - rect.top) * scaleY + camera.y;
    const tx = Math.floor(mx / TILE), ty = Math.floor(my / TILE);
    const npc = npcAt(tx,ty);
    if(npc){ evt.preventDefault(); talkToNpc(npc); }
  }


  const mapArt = {
    ground: [
      'assets/imported/environment/ground/ground_01.png',
      'assets/imported/environment/ground/ground_02.png',
      'assets/imported/environment/ground/ground_03.png',
      'assets/imported/environment/ground/ground_04.png',
      'assets/imported/environment/ground/ground_05.png',
      'assets/imported/environment/ground/ground_06.png'
    ],
    blocked: [
      'assets/imported/environment/rocks/rock_01.png',
      'assets/imported/environment/rocks/rock_02.png',
      'assets/imported/environment/rocks/rock_03.png',
      'assets/imported/environment/trees/tree_small.png',
      'assets/imported/environment/trees/tree_medium.png',
      'assets/imported/environment/bushes/bushes_large.png'
    ],
    chest: 'assets/imported/props/loot/treasure_chest.png',
    med: 'assets/imported/items/medicine/medicine_1.png',
    lore: 'assets/imported/props/signage/blue_banner.png',
    terminal: 'assets/imported/props/buildings/magic_stone_tower.png',
    door: 'assets/imported/environment/fences/wooden_fence_horizontal.png',
    exit: 'assets/imported/props/signage/flag.png',
    // v53: non-colliding decorative prop stamps disabled.
    // Map blockers now come from # tiles only, so visuals match collision.
    props: []
  };


  // v88: selected CraftPix tileset integration.
  // Only the PNGs actually used by the game are shipped in the patch.
  // F-001 now uses the Forbidden Graveyard pack; F-002 uses cursed land; F-003 uses undead graveyard.
  const stageVisualPacks = {
    f001: {
      ground: [
        'assets/tilesets/forbidden/ground_01.png',
        'assets/tilesets/forbidden/ground_02.png',
        'assets/tilesets/forbidden/ground_03.png',
        'assets/tilesets/forbidden/ground_04.png',
        'assets/tilesets/forbidden/ground_05.png'
      ],
      blocked: [
        'assets/tilesets/forbidden/tree_01.png',
        'assets/tilesets/forbidden/tree_02.png',
        'assets/tilesets/forbidden/crypt_01.png',
        'assets/tilesets/forbidden/stone_fence_01.png',
        'assets/tilesets/forbidden/stone_fence_02.png',
        'assets/tilesets/forbidden/headstone_01.png',
        'assets/tilesets/forbidden/headstone_02.png',
        'assets/tilesets/forbidden/rock_01.png',
        'assets/tilesets/forbidden/rock_02.png'
      ],
      chest: 'assets/tilesets/forbidden/locked_chest_01.png',
      med: 'assets/tilesets/forbidden/life_01.png',
      lore: 'assets/tilesets/forbidden/signpost_02.png',
      terminal: 'assets/tilesets/forbidden/lantern_01.png',
      door: 'assets/tilesets/forbidden/stone_fence_01.png',
      exit: 'assets/tilesets/forbidden/signpost_01.png',
      floorTint: 'rgba(24, 18, 32, .22)',
      pathTint: 'rgba(86, 55, 122, .16)',
      wallTint: 'rgba(13, 9, 18, .96)',
      wallEdge: 'rgba(160, 118, 255, .30)',
      props: [
        {x:3,y:3,img:'assets/tilesets/forbidden/skull_01.png',w:36,h:36},
        {x:8,y:4,img:'assets/tilesets/forbidden/headstone_03.png',w:36,h:40},
        {x:17,y:6,img:'assets/tilesets/forbidden/bone_01.png',w:44,h:38},
        {x:25,y:9,img:'assets/tilesets/forbidden/coffin_01.png',w:64,h:62},
        {x:10,y:12,img:'assets/tilesets/forbidden/fire_01.png',w:34,h:34},
        {x:28,y:14,img:'assets/tilesets/forbidden/bush_01.png',w:44,h:40},
        {x:6,y:18,img:'assets/tilesets/forbidden/rock_03.png',w:38,h:34},
        {x:30,y:20,img:'assets/tilesets/forbidden/bush_02.png',w:44,h:40},
        {x:35,y:22,img:'assets/tilesets/forbidden/spike_01.png',w:42,h:26}
      ]
    },
    f002: {
      ground: [
        'assets/tilesets/cursed/ground_01.png',
        'assets/tilesets/cursed/ground_02.png',
        'assets/tilesets/cursed/ground_03.png',
        'assets/tilesets/cursed/ground_04.png'
      ],
      blocked: [
        'assets/tilesets/cursed/rock_eyes_01.png',
        'assets/tilesets/cursed/ruins_01.png',
        'assets/tilesets/cursed/jaws_plant_01.png',
        'assets/tilesets/cursed/spike_plant_01.png'
      ],
      floorTint: 'rgba(70, 19, 24, .18)',
      pathTint: 'rgba(255, 120, 62, .13)',
      wallTint: 'rgba(24, 9, 12, .96)',
      wallEdge: 'rgba(255, 122, 66, .28)',
      props: [
        {x:5,y:4,img:'assets/tilesets/cursed/eye_plant_01.png',w:42,h:42},
        {x:20,y:6,img:'assets/tilesets/cursed/tentacle_plant_01.png',w:52,h:48},
        {x:18,y:12,img:'assets/tilesets/cursed/meat_flower_01.png',w:48,h:48},
        {x:8,y:15,img:'assets/tilesets/cursed/bones_01.png',w:54,h:42},
        {x:29,y:17,img:'assets/tilesets/cursed/rock_eyes_01.png',w:58,h:50},
        {x:31,y:20,img:'assets/tilesets/cursed/spike_plant_01.png',w:54,h:48}
      ]
    },
    f003: {
      ground: [
        'assets/tilesets/undead/ground_01.png',
        'assets/tilesets/undead/ground_02.png',
        'assets/tilesets/undead/ground_03.png',
        'assets/tilesets/undead/ground_04.png'
      ],
      blocked: [
        'assets/tilesets/undead/dead_tree_01.png',
        'assets/tilesets/undead/dead_tree_02.png',
        'assets/tilesets/undead/broken_tree_01.png',
        'assets/tilesets/undead/grave_01.png',
        'assets/tilesets/undead/grave_02.png'
      ],
      floorTint: 'rgba(18, 22, 34, .20)',
      pathTint: 'rgba(95, 140, 255, .13)',
      wallTint: 'rgba(8, 11, 18, .96)',
      wallEdge: 'rgba(120, 170, 255, .26)',
      props: [
        {x:5,y:3,img:'assets/tilesets/undead/bones_01.png',w:44,h:34},
        {x:16,y:3,img:'assets/tilesets/undead/grave_01.png',w:38,h:40},
        {x:3,y:11,img:'assets/tilesets/undead/bones_02.png',w:48,h:34},
        {x:14,y:17,img:'assets/tilesets/undead/crystal_01.png',w:44,h:44},
        {x:24,y:20,img:'assets/tilesets/undead/dead_tree_02.png',w:58,h:66},
        {x:34,y:21,img:'assets/tilesets/undead/grave_02.png',w:38,h:40}
      ]
    }
  };
  function stageVisualPack(){ return stageVisualPacks[state?.currentStage || ''] || null; }
  function stageVisualAssetPaths(){
    return Object.values(stageVisualPacks).flatMap(pack => [
      ...(pack.ground || []),
      ...(pack.blocked || []),
      pack.chest, pack.med, pack.lore, pack.terminal, pack.door, pack.exit,
      ...((pack.props || []).map(p => p.img))
    ]).filter(Boolean);
  }

  // v91: the imported ground PNGs include edge/corner/platform pieces.
  // Drawing those randomly made the map look like broken floating blocks.
  // Walkable tiles now use one consistent procedural ground per stage, while props/interactables still use the imported art.
  const stageFloorStyles = {
    f001: {base:'#1b1721', alt:'#211b2a', grit:'rgba(202,184,255,.085)', line:'rgba(255,255,255,.045)'},
    f002: {base:'#22130f', alt:'#2b1710', grit:'rgba(255,180,112,.08)', line:'rgba(255,163,77,.045)'},
    f003: {base:'#101722', alt:'#141d2b', grit:'rgba(130,180,255,.08)', line:'rgba(112,215,255,.045)'}
  };
  function hashTile(tx,ty,salt=0){
    let n = ((tx+31) * 73856093) ^ ((ty+47) * 19349663) ^ (salt * 83492791);
    n = (n << 13) ^ n;
    return Math.abs((n * (n * n * 15731 + 789221) + 1376312589) & 0x7fffffff);
  }
  function drawUniformGround(x,y,tx,ty,c){
    const s = stageFloorStyles[currentStageKey()] || stageFloorStyles.f001;
    ctx.fillStyle = ((tx + ty) & 1) ? s.alt : s.base;
    ctx.fillRect(x,y,TILE,TILE);
    const h1 = hashTile(tx,ty,1);
    const h2 = hashTile(tx,ty,2);
    ctx.fillStyle = s.grit;
    ctx.fillRect(x + 6 + (h1 % 25), y + 7 + ((h1 >> 5) % 24), 2, 2);
    ctx.fillRect(x + 8 + (h2 % 23), y + 9 + ((h2 >> 4) % 22), 1, 1);
    if((h1 % 5) === 0){
      ctx.strokeStyle = s.line;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x + 8, y + 12 + (h2 % 19));
      ctx.lineTo(x + TILE - 9, y + 13 + (h2 % 19));
      ctx.stroke();
    }
    // Important tiles get a slightly brighter floor pad so they read as grounded, not pasted on.
    if(c !== '.'){
      ctx.fillStyle='rgba(255,255,255,.035)';
      ctx.fillRect(x+4,y+4,TILE-8,TILE-8);
    }
  }

  // v89: readability helpers. The imported tilesets look good, but random large props
  // on every wall made the maps feel messy. These helpers keep walkable paths,
  // blocked tiles, and interactables visually obvious on every stage.
  function hasWalkableNeighbor(tx,ty){
    return [[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy]) => {
      const c = tileAt(tx+dx, ty+dy);
      return c && c !== '#' && c !== 'D';
    });
  }
  function tileCenter(x,y){ return {cx:x+TILE/2, cy:y+TILE/2}; }
  function drawPathOverlay(x,y,tx,ty,c){
    const pack = stageVisualPack();
    const alpha = c === '.' ? .18 : .10;
    ctx.fillStyle = (pack && pack.pathTint) || `rgba(0,217,255,${alpha})`;
    ctx.fillRect(x+2,y+2,TILE-4,TILE-4);
    const openN = tileAt(tx,ty-1) !== '#';
    const openS = tileAt(tx,ty+1) !== '#';
    const openW = tileAt(tx-1,ty) !== '#';
    const openE = tileAt(tx+1,ty) !== '#';
    ctx.strokeStyle='rgba(255,255,255,.055)';
    ctx.lineWidth=1;
    if(!openN){ ctx.beginPath(); ctx.moveTo(x+5,y+5); ctx.lineTo(x+TILE-5,y+5); ctx.stroke(); }
    if(!openS){ ctx.beginPath(); ctx.moveTo(x+5,y+TILE-5); ctx.lineTo(x+TILE-5,y+TILE-5); ctx.stroke(); }
    if(!openW){ ctx.beginPath(); ctx.moveTo(x+5,y+5); ctx.lineTo(x+5,y+TILE-5); ctx.stroke(); }
    if(!openE){ ctx.beginPath(); ctx.moveTo(x+TILE-5,y+5); ctx.lineTo(x+TILE-5,y+TILE-5); ctx.stroke(); }
    if((tx + ty) % 2 === 0){
      ctx.fillStyle='rgba(255,255,255,.032)';
      ctx.fillRect(x+7,y+7,TILE-14,TILE-14);
    }
  }
  function drawWallBase(x,y,tx,ty){
    const pack = stageVisualPack();
    const edge = hasWalkableNeighbor(tx,ty);
    ctx.fillStyle = (pack && pack.wallTint) || 'rgba(8,10,13,.96)';
    ctx.fillRect(x,y,TILE,TILE);
    ctx.strokeStyle = edge ? ((pack && pack.wallEdge) || 'rgba(0,217,255,.18)') : 'rgba(0,0,0,.24)';
    ctx.lineWidth = edge ? 2 : 1;
    ctx.strokeRect(x+1,y+1,TILE-2,TILE-2);
    if(edge){
      ctx.fillStyle='rgba(255,255,255,.045)';
      ctx.fillRect(x+3,y+3,TILE-6,3);
      ctx.fillStyle='rgba(0,0,0,.22)';
      ctx.fillRect(x+3,y+TILE-7,TILE-6,4);
    }
  }
  function drawInteractMarker(label,x,y,color='rgba(0,217,255,.9)'){
    const {cx,cy}=tileCenter(x,y);
    ctx.save();
    ctx.shadowColor=color;
    ctx.shadowBlur=12;
    ctx.strokeStyle=color;
    ctx.lineWidth=2;
    ctx.beginPath();
    ctx.arc(cx,cy,17,0,Math.PI*2);
    ctx.stroke();
    ctx.fillStyle='rgba(3,7,12,.72)';
    ctx.beginPath();
    ctx.arc(cx,cy,12,0,Math.PI*2);
    ctx.fill();
    ctx.shadowBlur=0;
    ctx.font='700 11px Orbitron, Arial, sans-serif';
    ctx.textAlign='center';
    ctx.textBaseline='middle';
    ctx.fillStyle='#f6fbff';
    ctx.fillText(label,cx,cy+1);
    ctx.restore();
  }

  function imgFor(path){ return images[path]; }
  function drawAsset(path,x,y,w,h,anchorBottom=false){
    const im=imgFor(path);
    if(im && im.complete && im.naturalWidth){
      const dx = anchorBottom ? x + (TILE-w)/2 : x + (TILE-w)/2;
      const dy = anchorBottom ? y + TILE - h + 5 : y + (TILE-h)/2;
      ctx.drawImage(im, dx, dy, w, h);
      return true;
    }
    return false;
  }
  function pickAsset(list,tx,ty){ return list[Math.abs((tx*13 + ty*7) % list.length)]; }

  const ENCOUNTER_SLOTS = {
    f001: {
      '29,5': {type:'anomaly', index:0},
      '19,13': {type:'anomaly', index:6},
      '33,19': {type:'anomaly', index:14},
      '33,22': {type:'boss', index:0}
    },
    f002: {
      '31,5': {type:'anomaly', index:18},
      '25,11': {type:'anomaly', index:24},
      '13,19': {type:'anomaly', index:31},
      '35,20': {type:'boss', index:5}
    },
    f003: {
      '27,3': {type:'anomaly', index:42},
      '6,13': {type:'anomaly', index:53},
      '30,19': {type:'anomaly', index:58},
      '31,21': {type:'boss', index:18}
    }
  };
  function encounterSlotFor(x,y,code){
    const slots = ENCOUNTER_SLOTS[currentStageKey()] || ENCOUNTER_SLOTS.f001;
    return slots[`${x},${y}`] || (code === 'B' ? {type:'boss', index:0} : {type:'anomaly', index:0});
  }

  // v73: F-002 and F-003 both use the imported creature/boss library only; no invented monster names.
  const STAGE_ENCOUNTER_DEFS = {
    f002: {
      '31,5': {id:'AN-020', display:'Charnel Spawn', hp:150, atk:19, xp:44, credits:38, loot:['Scrap Metal','Burnt Alloy'], note:'Imported anomaly record selected for the Ash Wastes route. Its biomass is doing something gross and absolutely not OSHA-approved.'},
      '25,11': {id:'AN-026', display:'Crypt Darter', hp:132, atk:22, xp:48, credits:42, loot:['Scrap Metal','Outpost Access Chip'], note:'Imported anomaly record selected for the outpost patrol lane. Fast, ugly, and way too proud of both.'},
      '13,19': {id:'AN-033', display:'Cryptmire Beast', hp:178, atk:20, xp:54, credits:45, loot:['Burnt Alloy','Med Patch'], note:'Imported anomaly record selected for the ruined waste channel. It smells like bad decisions with claws.'},
      '35,20': {id:'BOSS-007', display:'Ashveil Spider Mother', hp:360, atk:30, xp:150, credits:95, loot:['Ashveil Mother Core','Corrupted Catalyst','Burnt Alloy'], bossReward:'Ashveil Mother Core', note:'Imported boss-class record. Large, venomous, and apparently upset that you walked into her landfill nursery.'}
    },
    f003: {
      '27,3': {id:'AN-044', display:'Frostgrave Abomination', hp:245, atk:29, xp:82, credits:66, loot:['Corrupted Catalyst','Vector Cell'], note:'Imported anomaly record assigned to Neon Graveyard. Cold corpse energy, hot attitude, zero social skills.'},
      '6,13': {id:'AN-055', display:'Hollow Revenant', hp:260, atk:31, xp:88, credits:72, loot:['Rust Core','Scrap Metal'], note:'Imported anomaly record assigned to the dead-frequency lane. It keeps walking like rent is due in the afterlife.'},
      '30,19': {id:'AN-060', display:'Mireclaw', hp:285, atk:33, xp:96, credits:78, loot:['Corrupted Catalyst','Med Patch'], note:'Imported anomaly record assigned to the graveyard relay path. AVOS says it is bitey. Vyra says she noticed.'},
      '31,21': {id:'BOSS-020', display:'Duskwither Shade Wraith', hp:540, atk:42, xp:240, credits:140, loot:['Rust Core','Corrupted Catalyst','Vector Cell'], bossReward:'Duskwither Wraith Core', note:'Imported boss-class record. It is basically a haunted software update with teeth. Delete it.'}
    }
  };
  function stageEncounterOverride(x,y){
    return (STAGE_ENCOUNTER_DEFS[currentStageKey()] || {})[`${x},${y}`] || null;
  }

  // v68: monster respawn/training loop. Normal anomaly tiles rebuild after 3 seconds
  // so players can grind XP, skill levels, credits, and drops without resetting a map.
  const RESPAWN_DELAY_MS = 3000;
  function respawnKey(stage,x,y){ return `${stage}:${x},${y}`; }
  function ensureRespawnState(){
    if(!state) return;
    state.respawns ||= {};
    state.enemyKills ||= {};
  }
  function clearStageRespawns(key=currentStageKey()){
    ensureRespawnState();
    ensureResearch();
    Object.keys(state.respawns || {}).forEach(k => { if(k.startsWith(key+':')) delete state.respawns[k]; });
  }
  function scheduleEncounterRespawn(code,x,y,label='Anomaly'){
    if(code !== 'E' || !state || !state.map) return;
    ensureRespawnState();
    const stage=currentStageKey();
    const key=respawnKey(stage,x,y);
    state.respawns[key]={stage,x,y,code:'E',readyAt:Date.now()+RESPAWN_DELAY_MS,label};
    queueAutosave();
    setTimeout(processRespawns, RESPAWN_DELAY_MS + 80);
  }
  function pendingRespawnsForStage(key=currentStageKey()){
    ensureRespawnState();
    const now=Date.now();
    return Object.values(state.respawns || {}).filter(r => r && r.stage === key).map(r => ({...r, seconds:Math.max(0, Math.ceil((r.readyAt-now)/1000))}));
  }
  function processRespawns(){
    if(!state || !state.map) return;
    ensureRespawnState();
    const now=Date.now();
    let changed=false, deferred=false;
    Object.entries({...state.respawns}).forEach(([key,r]) => {
      if(!r || now < r.readyAt) return;
      if(r.stage !== currentStageKey()) return;
      if(battle || storyActive || (state.player.x === r.x && state.player.y === r.y)){
        r.readyAt = now + 750;
        state.respawns[key] = r;
        deferred = true;
        return;
      }
      const current = tileAt(r.x,r.y);
      if(current === '.'){
        setTile(r.x,r.y,'E');
        delete state.respawns[key];
        changed = true;
        log(`Anomaly signature respawned: ${r.label || 'hostile record'}.`);
      } else {
        delete state.respawns[key];
        changed = true;
      }
    });
    if(changed){ renderAll(); queueAutosave(); }
    if(deferred) setTimeout(processRespawns, 850);
  }

  const importedAnomalyRoster = [{"id": "AN-002", "name": "Ashborn Revenant", "battle": "assets/anomalies/an002_ashborn_revenant/battle.png", "hp": 28, "atk": 7, "credits": 9, "loot": ["Scrap Metal", "Corrupted Catalyst"]}, {"id": "AN-003", "name": "Ashen Horror", "battle": "assets/anomalies/an003_ashen_horror/battle.png", "hp": 31, "atk": 8, "credits": 10, "loot": ["Scrap Metal", "Corrupted Catalyst"]}, {"id": "AN-004", "name": "Ashen Revenant", "battle": "assets/anomalies/an004_ashen_revenant/battle.png", "hp": 34, "atk": 9, "credits": 11, "loot": ["Scrap Metal", "Corrupted Catalyst"]}, {"id": "AN-005", "name": "Ashen Whelp", "battle": "assets/anomalies/an005_ashen_whelp/battle.png", "hp": 37, "atk": 10, "credits": 12, "loot": ["Scrap Metal", "Corrupted Catalyst"]}, {"id": "AN-006", "name": "Ashfang Serpent", "battle": "assets/anomalies/an006_ashfang_serpent/battle.png", "hp": 40, "atk": 11, "credits": 13, "loot": ["Scrap Metal", "Corrupted Catalyst"]}, {"id": "AN-007", "name": "Ashveil Spider", "battle": "assets/anomalies/an007_ashveil_spider/battle.png", "hp": 43, "atk": 12, "credits": 14, "loot": ["Scrap Metal", "Corrupted Catalyst"]}, {"id": "AN-008", "name": "Bilebrood", "battle": "assets/anomalies/an008_bilebrood/battle.png", "hp": 46, "atk": 13, "credits": 15, "loot": ["Scrap Metal", "Corrupted Catalyst"]}, {"id": "AN-009", "name": "Blight Rat", "battle": "assets/anomalies/an009_blight_rat/battle.png", "hp": 49, "atk": 14, "credits": 16, "loot": ["Scrap Metal", "Corrupted Catalyst"]}, {"id": "AN-010", "name": "Blight Widow", "battle": "assets/anomalies/an010_blight_widow/battle.png", "hp": 52, "atk": 15, "credits": 17, "loot": ["Scrap Metal", "Corrupted Catalyst"]}, {"id": "AN-011", "name": "Blightclaw Ravager", "battle": "assets/anomalies/an011_blightclaw_ravager/battle.png", "hp": 55, "atk": 7, "credits": 18, "loot": ["Scrap Metal", "Corrupted Catalyst"]}, {"id": "AN-012", "name": "Blightdrake", "battle": "assets/anomalies/an012_blightdrake/battle.png", "hp": 58, "atk": 8, "credits": 19, "loot": ["Scrap Metal", "Corrupted Catalyst"]}, {"id": "AN-013", "name": "Blistercoil Drake", "battle": "assets/anomalies/an013_blistercoil_drake/battle.png", "hp": 61, "atk": 9, "credits": 20, "loot": ["Scrap Metal", "Corrupted Catalyst"]}, {"id": "AN-014", "name": "Blistergrub", "battle": "assets/anomalies/an014_blistergrub/battle.png", "hp": 64, "atk": 10, "credits": 21, "loot": ["Scrap Metal", "Corrupted Catalyst"]}, {"id": "AN-015", "name": "Bloodreaver Scarab", "battle": "assets/anomalies/an015_bloodreaver_scarab/battle.png", "hp": 67, "atk": 11, "credits": 22, "loot": ["Scrap Metal", "Corrupted Catalyst"]}, {"id": "AN-016", "name": "Bonegnasher", "battle": "assets/anomalies/an016_bonegnasher/battle.png", "hp": 70, "atk": 12, "credits": 23, "loot": ["Scrap Metal", "Corrupted Catalyst"]}, {"id": "AN-017", "name": "Bramblechoke Horror", "battle": "assets/anomalies/an017_bramblechoke_horror/battle.png", "hp": 73, "atk": 13, "credits": 24, "loot": ["Scrap Metal", "Corrupted Catalyst"]}, {"id": "AN-018", "name": "Carrion Scarab", "battle": "assets/anomalies/an018_carrion_scarab/battle.png", "hp": 76, "atk": 14, "credits": 25, "loot": ["Scrap Metal", "Corrupted Catalyst"]}, {"id": "AN-019", "name": "Carrion Weaver", "battle": "assets/anomalies/an019_carrion_weaver/battle.png", "hp": 79, "atk": 15, "credits": 26, "loot": ["Scrap Metal", "Corrupted Catalyst"]}, {"id": "AN-020", "name": "Charnel Spawn", "battle": "assets/anomalies/an020_charnel_spawn/battle.png", "hp": 82, "atk": 7, "credits": 27, "loot": ["Scrap Metal", "Corrupted Catalyst"]}, {"id": "AN-021", "name": "Cindershade Horror", "battle": "assets/anomalies/an021_cindershade_horror/battle.png", "hp": 85, "atk": 8, "credits": 28, "loot": ["Scrap Metal", "Corrupted Catalyst"]}, {"id": "AN-022", "name": "Cindershroud Wisp", "battle": "assets/anomalies/an022_cindershroud_wisp/battle.png", "hp": 88, "atk": 9, "credits": 29, "loot": ["Scrap Metal", "Corrupted Catalyst"]}, {"id": "AN-023", "name": "Cragjaw", "battle": "assets/anomalies/an023_cragjaw/battle.png", "hp": 91, "atk": 10, "credits": 30, "loot": ["Scrap Metal", "Corrupted Catalyst"]}, {"id": "AN-024", "name": "Cragrot Shambler", "battle": "assets/anomalies/an024_cragrot_shambler/battle.png", "hp": 94, "atk": 11, "credits": 31, "loot": ["Scrap Metal", "Corrupted Catalyst"]}, {"id": "AN-025", "name": "Crypt Blight", "battle": "assets/anomalies/an025_crypt_blight/battle.png", "hp": 97, "atk": 12, "credits": 32, "loot": ["Scrap Metal", "Corrupted Catalyst"]}, {"id": "AN-026", "name": "Crypt Darter", "battle": "assets/anomalies/an026_crypt_darter/battle.png", "hp": 100, "atk": 13, "credits": 33, "loot": ["Scrap Metal", "Corrupted Catalyst"]}, {"id": "AN-027", "name": "Crypt Ghast", "battle": "assets/anomalies/an027_crypt_ghast/battle.png", "hp": 103, "atk": 14, "credits": 34, "loot": ["Scrap Metal", "Corrupted Catalyst"]}, {"id": "AN-028", "name": "Crypt Howler", "battle": "assets/anomalies/an028_crypt_howler/battle.png", "hp": 106, "atk": 15, "credits": 35, "loot": ["Scrap Metal", "Corrupted Catalyst"]}, {"id": "AN-029", "name": "Crypt Ravager", "battle": "assets/anomalies/an029_crypt_ravager/battle.png", "hp": 109, "atk": 7, "credits": 36, "loot": ["Scrap Metal", "Corrupted Catalyst"]}, {"id": "AN-030", "name": "Crypt Serpent", "battle": "assets/anomalies/an030_crypt_serpent/battle.png", "hp": 112, "atk": 8, "credits": 37, "loot": ["Scrap Metal", "Corrupted Catalyst"]}, {"id": "AN-031", "name": "Crypt Widow", "battle": "assets/anomalies/an031_crypt_widow/battle.png", "hp": 115, "atk": 9, "credits": 38, "loot": ["Scrap Metal", "Corrupted Catalyst"]}, {"id": "AN-032", "name": "Cryptbane Spider", "battle": "assets/anomalies/an032_cryptbane_spider/battle.png", "hp": 118, "atk": 10, "credits": 39, "loot": ["Scrap Metal", "Corrupted Catalyst"]}, {"id": "AN-033", "name": "Cryptmire Beast", "battle": "assets/anomalies/an033_cryptmire_beast/battle.png", "hp": 121, "atk": 11, "credits": 40, "loot": ["Scrap Metal", "Corrupted Catalyst"]}, {"id": "AN-034", "name": "Deathrot Spawn", "battle": "assets/anomalies/an034_deathrot_spawn/battle.png", "hp": 124, "atk": 12, "credits": 41, "loot": ["Scrap Metal", "Corrupted Catalyst"]}, {"id": "AN-035", "name": "Dreadthorn Lurker", "battle": "assets/anomalies/an035_dreadthorn_lurker/battle.png", "hp": 127, "atk": 13, "credits": 42, "loot": ["Scrap Metal", "Corrupted Catalyst"]}, {"id": "AN-036", "name": "Duskgloom Howler", "battle": "assets/anomalies/an036_duskgloom_howler/battle.png", "hp": 130, "atk": 14, "credits": 43, "loot": ["Scrap Metal", "Corrupted Catalyst"]}, {"id": "AN-037", "name": "Duskthorn Beast", "battle": "assets/anomalies/an037_duskthorn_beast/battle.png", "hp": 133, "atk": 15, "credits": 44, "loot": ["Scrap Metal", "Corrupted Catalyst"]}, {"id": "AN-038", "name": "Duskwatch Bettle", "battle": "assets/anomalies/an038_duskwatch_bettle/battle.png", "hp": 136, "atk": 7, "credits": 45, "loot": ["Scrap Metal", "Corrupted Catalyst"]}, {"id": "AN-039", "name": "Duskwither", "battle": "assets/anomalies/an039_duskwither/battle.png", "hp": 139, "atk": 8, "credits": 46, "loot": ["Scrap Metal", "Corrupted Catalyst"]}, {"id": "AN-040", "name": "Duskwither Shade", "battle": "assets/anomalies/an040_duskwither_shade/battle.png", "hp": 142, "atk": 9, "credits": 47, "loot": ["Scrap Metal", "Corrupted Catalyst"]}, {"id": "AN-041", "name": "Duskworm", "battle": "assets/anomalies/an041_duskworm/battle.png", "hp": 145, "atk": 10, "credits": 48, "loot": ["Scrap Metal", "Corrupted Catalyst"]}, {"id": "AN-042", "name": "Ember Beetle", "battle": "assets/anomalies/an042_ember_beetle/battle.png", "hp": 148, "atk": 11, "credits": 49, "loot": ["Scrap Metal", "Corrupted Catalyst"]}, {"id": "AN-043", "name": "Embergnash Scarab", "battle": "assets/anomalies/an043_embergnash_scarab/battle.png", "hp": 151, "atk": 12, "credits": 50, "loot": ["Scrap Metal", "Corrupted Catalyst"]}, {"id": "AN-044", "name": "Frostgrave Abomination", "battle": "assets/anomalies/an044_frostgrave_abomination/battle.png", "hp": 154, "atk": 13, "credits": 51, "loot": ["Scrap Metal", "Corrupted Catalyst"]}, {"id": "AN-045", "name": "Gloomwing", "battle": "assets/anomalies/an045_gloomwing/battle.png", "hp": 157, "atk": 14, "credits": 52, "loot": ["Scrap Metal", "Corrupted Catalyst"]}, {"id": "AN-046", "name": "Grave Vulture", "battle": "assets/anomalies/an046_grave_vulture/battle.png", "hp": 160, "atk": 15, "credits": 53, "loot": ["Scrap Metal", "Corrupted Catalyst"]}, {"id": "AN-047", "name": "Graveblade Stalker", "battle": "assets/anomalies/an047_graveblade_stalker/battle.png", "hp": 163, "atk": 7, "credits": 54, "loot": ["Scrap Metal", "Corrupted Catalyst"]}, {"id": "AN-048", "name": "Gravebloom Horror", "battle": "assets/anomalies/an048_gravebloom_horror/battle.png", "hp": 166, "atk": 8, "credits": 55, "loot": ["Scrap Metal", "Corrupted Catalyst"]}, {"id": "AN-049", "name": "Graveborn Wretch", "battle": "assets/anomalies/an049_graveborn_wretch/battle.png", "hp": 169, "atk": 9, "credits": 56, "loot": ["Scrap Metal", "Corrupted Catalyst"]}, {"id": "AN-050", "name": "Gravecoil", "battle": "assets/anomalies/an050_gravecoil/battle.png", "hp": 172, "atk": 10, "credits": 57, "loot": ["Scrap Metal", "Corrupted Catalyst"]}, {"id": "AN-051", "name": "Gravemarrow", "battle": "assets/anomalies/an051_gravemarrow/battle.png", "hp": 175, "atk": 11, "credits": 58, "loot": ["Scrap Metal", "Corrupted Catalyst"]}, {"id": "AN-052", "name": "Gravemist Wyrm", "battle": "assets/anomalies/an052_gravemist_wyrm/battle.png", "hp": 178, "atk": 12, "credits": 59, "loot": ["Scrap Metal", "Corrupted Catalyst"]}, {"id": "AN-053", "name": "Grime Crawler", "battle": "assets/anomalies/an053_grime_crawler/battle.png", "hp": 181, "atk": 13, "credits": 60, "loot": ["Scrap Metal", "Corrupted Catalyst"]}, {"id": "AN-054", "name": "Hollow Hound", "battle": "assets/anomalies/an054_hollow_hound/battle.png", "hp": 184, "atk": 14, "credits": 61, "loot": ["Scrap Metal", "Corrupted Catalyst"]}, {"id": "AN-055", "name": "Hollow Revenant", "battle": "assets/anomalies/an055_hollow_revenant/battle.png", "hp": 187, "atk": 15, "credits": 62, "loot": ["Scrap Metal", "Corrupted Catalyst"]}, {"id": "AN-056", "name": "Hollow Scarab", "battle": "assets/anomalies/an056_hollow_scarab/battle.png", "hp": 190, "atk": 7, "credits": 63, "loot": ["Scrap Metal", "Corrupted Catalyst"]}, {"id": "AN-057", "name": "Hollow Weaver", "battle": "assets/anomalies/an057_hollow_weaver/battle.png", "hp": 193, "atk": 8, "credits": 64, "loot": ["Scrap Metal", "Corrupted Catalyst"]}, {"id": "AN-058", "name": "Hollowfang", "battle": "assets/anomalies/an058_hollowfang/battle.png", "hp": 196, "atk": 9, "credits": 65, "loot": ["Scrap Metal", "Corrupted Catalyst"]}, {"id": "AN-059", "name": "Mire Thrasher", "battle": "assets/anomalies/an059_mire_thrasher/battle.png", "hp": 199, "atk": 10, "credits": 66, "loot": ["Scrap Metal", "Corrupted Catalyst"]}, {"id": "AN-060", "name": "Mireclaw", "battle": "assets/anomalies/an060_mireclaw/battle.png", "hp": 202, "atk": 11, "credits": 67, "loot": ["Scrap Metal", "Corrupted Catalyst"]}, {"id": "AN-061", "name": "Miregulper Beast", "battle": "assets/anomalies/an061_miregulper_beast/battle.png", "hp": 205, "atk": 12, "credits": 68, "loot": ["Scrap Metal", "Corrupted Catalyst"]}];
  const importedBossRoster = [{"id": "BOSS-002", "name": "Ashborn Revenant Lord", "battle": "assets/bosses/boss002_ashborn_revenant_lord/battle.png", "hp": 120, "atk": 16, "credits": 40, "loot": ["Rust Core", "Corrupted Catalyst"]}, {"id": "BOSS-003", "name": "Ashen Horror Overlord", "battle": "assets/bosses/boss003_ashen_horror_overlord/battle.png", "hp": 138, "atk": 17, "credits": 46, "loot": ["Rust Core", "Corrupted Catalyst"]}, {"id": "BOSS-004", "name": "Ashen Revenant Titan", "battle": "assets/bosses/boss004_ashen_revenant_titan/battle.png", "hp": 156, "atk": 18, "credits": 52, "loot": ["Rust Core", "Corrupted Catalyst"]}, {"id": "BOSS-005", "name": "Ashen Whelp Matriarch", "battle": "assets/bosses/boss005_ashen_whelp_matriarch/battle.png", "hp": 174, "atk": 19, "credits": 58, "loot": ["Rust Core", "Corrupted Catalyst"]}, {"id": "BOSS-006", "name": "Ashfang Serpent Alpha", "battle": "assets/bosses/boss006_ashfang_serpent_alpha/battle.png", "hp": 192, "atk": 20, "credits": 64, "loot": ["Rust Core", "Corrupted Catalyst"]}, {"id": "BOSS-007", "name": "Ashveil Spider Mother", "battle": "assets/bosses/boss007_ashveil_spider_mother/battle.png", "hp": 210, "atk": 21, "credits": 70, "loot": ["Rust Core", "Corrupted Catalyst"]}, {"id": "BOSS-008", "name": "Bilebrood Overfiend", "battle": "assets/bosses/boss008_bilebrood_overfiend/battle.png", "hp": 228, "atk": 22, "credits": 76, "loot": ["Rust Core", "Corrupted Catalyst"]}, {"id": "BOSS-009", "name": "Blight Widow Queen", "battle": "assets/bosses/boss009_blight_widow_queen/battle.png", "hp": 246, "atk": 23, "credits": 82, "loot": ["Rust Core", "Corrupted Catalyst"]}, {"id": "BOSS-010", "name": "Blightclaw Ravager Alpha", "battle": "assets/bosses/boss010_blightclaw_ravager_alpha/battle.png", "hp": 264, "atk": 24, "credits": 88, "loot": ["Rust Core", "Corrupted Catalyst"]}, {"id": "BOSS-011", "name": "Blightdrake Abomination", "battle": "assets/bosses/boss011_blightdrake_abomination/battle.png", "hp": 282, "atk": 25, "credits": 94, "loot": ["Rust Core", "Corrupted Catalyst"]}, {"id": "BOSS-012", "name": "Cindershade Horror King", "battle": "assets/bosses/boss012_cindershade_horror_king/battle.png", "hp": 300, "atk": 26, "credits": 100, "loot": ["Rust Core", "Corrupted Catalyst"]}, {"id": "BOSS-013", "name": "Crypt Blight Overlord", "battle": "assets/bosses/boss013_crypt_blight_overlord/battle.png", "hp": 318, "atk": 27, "credits": 106, "loot": ["Rust Core", "Corrupted Catalyst"]}, {"id": "BOSS-014", "name": "Crypt Ghast Lord", "battle": "assets/bosses/boss014_crypt_ghast_lord/battle.png", "hp": 336, "atk": 16, "credits": 112, "loot": ["Rust Core", "Corrupted Catalyst"]}, {"id": "BOSS-015", "name": "Crypt Ravager Dreadknight", "battle": "assets/bosses/boss015_crypt_ravager_dreadknight/battle.png", "hp": 354, "atk": 17, "credits": 118, "loot": ["Rust Core", "Corrupted Catalyst"]}, {"id": "BOSS-016", "name": "Cryptmire Beast Alpha", "battle": "assets/bosses/boss016_cryptmire_beast_alpha/battle.png", "hp": 372, "atk": 18, "credits": 124, "loot": ["Rust Core", "Corrupted Catalyst"]}, {"id": "BOSS-017", "name": "Deathrot Spawn Colossus", "battle": "assets/bosses/boss017_deathrot_spawn_colossus/battle.png", "hp": 390, "atk": 19, "credits": 130, "loot": ["Rust Core", "Corrupted Catalyst"]}, {"id": "BOSS-018", "name": "Dreadthorn Lurker Alpha", "battle": "assets/bosses/boss018_dreadthorn_lurker_alpha/battle.png", "hp": 408, "atk": 20, "credits": 136, "loot": ["Rust Core", "Corrupted Catalyst"]}, {"id": "BOSS-019", "name": "Duskgloom Howler Alpha", "battle": "assets/bosses/boss019_duskgloom_howler_alpha/battle.png", "hp": 426, "atk": 21, "credits": 142, "loot": ["Rust Core", "Corrupted Catalyst"]}, {"id": "BOSS-020", "name": "Duskwither Shade Wraith", "battle": "assets/bosses/boss020_duskwither_shade_wraith/battle.png", "hp": 444, "atk": 22, "credits": 148, "loot": ["Rust Core", "Corrupted Catalyst"]}, {"id": "BOSS-021", "name": "Eldrith Oracle Of The End", "battle": "assets/bosses/boss021_eldrith_oracle_of_the_end/battle.png", "hp": 462, "atk": 23, "credits": 154, "loot": ["Rust Core", "Corrupted Catalyst"]}, {"id": "BOSS-022", "name": "Frostgrave Abomination Titan", "battle": "assets/bosses/boss022_frostgrave_abomination_titan/battle.png", "hp": 480, "atk": 24, "credits": 160, "loot": ["Rust Core", "Corrupted Catalyst"]}, {"id": "BOSS-023", "name": "Gloomwing Tyrant", "battle": "assets/bosses/boss023_gloomwing_tyrant/battle.png", "hp": 498, "atk": 25, "credits": 166, "loot": ["Rust Core", "Corrupted Catalyst"]}, {"id": "BOSS-024", "name": "Gravecoil Overlord", "battle": "assets/bosses/boss024_gravecoil_overlord/battle.png", "hp": 516, "atk": 26, "credits": 172, "loot": ["Rust Core", "Corrupted Catalyst"]}, {"id": "BOSS-025", "name": "Gravemarrow Ancient", "battle": "assets/bosses/boss025_gravemarrow_ancient/battle.png", "hp": 534, "atk": 27, "credits": 178, "loot": ["Rust Core", "Corrupted Catalyst"]}, {"id": "BOSS-026", "name": "Gravemist Wyrm Overlord", "battle": "assets/bosses/boss026_gravemist_wyrm_overlord/battle.png", "hp": 552, "atk": 16, "credits": 184, "loot": ["Rust Core", "Corrupted Catalyst"]}, {"id": "BOSS-027", "name": "Korr Magoth World Butcher", "battle": "assets/bosses/boss027_korr_magoth_world_butcher/battle.png", "hp": 570, "atk": 17, "credits": 190, "loot": ["Rust Core", "Corrupted Catalyst"]}, {"id": "BOSS-028", "name": "Mirevenom Broodmother", "battle": "assets/bosses/boss028_mirevenom_broodmother/battle.png", "hp": 588, "atk": 18, "credits": 196, "loot": ["Rust Core", "Corrupted Catalyst"]}, {"id": "BOSS-029", "name": "Mol Gorath The Searing Maw", "battle": "assets/bosses/boss029_mol_gorath_the_searing_maw/battle.png", "hp": 606, "atk": 19, "credits": 202, "loot": ["Rust Core", "Corrupted Catalyst"]}, {"id": "BOSS-030", "name": "Nocturn Husk Alpha", "battle": "assets/bosses/boss030_nocturn_husk_alpha/battle.png", "hp": 624, "atk": 20, "credits": 208, "loot": ["Rust Core", "Corrupted Catalyst"]}, {"id": "BOSS-031", "name": "Noxious Bloom Ancient", "battle": "assets/bosses/boss031_noxious_bloom_ancient/battle.png", "hp": 642, "atk": 21, "credits": 214, "loot": ["Rust Core", "Corrupted Catalyst"]}, {"id": "BOSS-032", "name": "Noxmire Spawn Broodking", "battle": "assets/bosses/boss032_noxmire_spawn_broodking/battle.png", "hp": 660, "atk": 22, "credits": 220, "loot": ["Rust Core", "Corrupted Catalyst"]}, {"id": "BOSS-033", "name": "Nyxaris Shadowed Crown", "battle": "assets/bosses/boss033_nyxaris_shadowed_crown/battle.png", "hp": 678, "atk": 23, "credits": 226, "loot": ["Rust Core", "Corrupted Catalyst"]}, {"id": "BOSS-034", "name": "Rimeclaw Stalker Alpha", "battle": "assets/bosses/boss034_rimeclaw_stalker_alpha/battle.png", "hp": 696, "atk": 24, "credits": 232, "loot": ["Rust Core", "Corrupted Catalyst"]}, {"id": "BOSS-035", "name": "Rotlash Creeper Warlord", "battle": "assets/bosses/boss035_rotlash_creeper_warlord/battle.png", "hp": 714, "atk": 25, "credits": 238, "loot": ["Rust Core", "Corrupted Catalyst"]}, {"id": "BOSS-036", "name": "Scorchbloom Horror Overlord", "battle": "assets/bosses/boss036_scorchbloom_horror_overlord/battle.png", "hp": 732, "atk": 26, "credits": 244, "loot": ["Rust Core", "Corrupted Catalyst"]}];

  function displayId(prefix, index){
    return `${prefix}-${String(index + 1).padStart(3, '0')}`;
  }
  function iconPathFor(creature){
    return (creature.battle || '').replace('/battle.png','/icon.png');
  }
  function toBattleDef(creature, displayIdValue, fallbackType){
    // v58: encounter tuning pass. Earlier enemies died too fast, so the
    // player could almost never reach 0 HP. These minimums keep early fights
    // winnable but make death possible if the player ignores HP/EP.
    const rawHp = Number(creature.hp || (fallbackType === 'boss' ? 120 : 30));
    const rawAtk = Number(creature.atk || (fallbackType === 'boss' ? 16 : 7));
    const hp = Math.max(rawHp, fallbackType === 'boss' ? 180 : 60);
    const atk = Math.max(rawAtk, fallbackType === 'boss' ? 22 : 13);
    return {
      id: displayIdValue,
      name: `${displayIdValue} ${creature.name}`,
      hp,
      maxHp: hp,
      atk,
      xp: fallbackType === 'boss' ? 90 : 18,
      credits: Number(creature.credits || (fallbackType === 'boss' ? 40 : 9)),
      img: creature.battle,
      icon: iconPathFor(creature),
      loot: creature.loot || ['Scrap Metal']
    };
  }
  function getEncounterDef(code, x, y){
    const slot = encounterSlotFor(x,y,code);
    const custom = stageEncounterOverride(x,y);
    if(slot.type === 'boss'){
      const creature = importedBossRoster[slot.index] || importedBossRoster[0];
      const base = toBattleDef(creature, displayId('BOSS', slot.index), 'boss');
      if(custom){
        return {...base, id:custom.id, name:custom.display, hp:custom.hp, maxHp:custom.hp, atk:custom.atk, xp:custom.xp, credits:custom.credits, loot:custom.loot, bossReward:custom.bossReward, note:custom.note};
      }
      return base;
    }
    const creature = importedAnomalyRoster[slot.index] || importedAnomalyRoster[0];
    const base = toBattleDef(creature, displayId('AN', slot.index), 'anomaly');
    if(custom){
      return {...base, id:custom.id, name:custom.display, hp:custom.hp, maxHp:custom.hp, atk:custom.atk, xp:custom.xp, credits:custom.credits, loot:custom.loot, note:custom.note};
    }
    return base;
  }
  function getMapCreatureImage(code, x, y){
    const def = getEncounterDef(code, x, y);
    return images[def.icon] || images[def.img];
  }
  const attacks = [
    {name:'Vector Slash', dmg:13, ep:0, text:'Vyra carves a cyan vector through the target.'},
    {name:'Phantom Dash', dmg:10, ep:4, status:'dodge', text:'Vyra disappears into a cyan afterimage.'},
    {name:'Crimson Cascade', dmg:18, ep:8, text:'A red arc crashes into the target.'},
    {name:'Emergency Flex', dmg:-18, ep:6, heal:true, text:'Weaponized ego restores HP.'}
  ];

  // v78: lightweight battle status system. No new assets required.
  // Status effects make fights less repetitive and give Guard / Vector Cell more value.
  const STATUS_DEFS = {
    bleed: {label:'Bleed', icon:'🩸', tick:'bleeds', color:'crimson'},
    corrosion: {label:'Corrosion', icon:'☣', tick:'corrodes', color:'toxic'},
    poison: {label:'Poison', icon:'☠', tick:'poison burns', color:'toxic'},
    burn: {label:'Burn', icon:'🔥', tick:'burns', color:'fire'},
    shock: {label:'Shock', icon:'⚡', tick:'short-circuits', color:'shock'}
  };

  function ensureBattleStatus(){
    if(!battle) return;
    battle.enemyStatus ||= {};
    battle.playerStatus ||= {};
    battle.evadeNext ||= false;
  }
  function statusSummary(box={}){
    const entries=Object.entries(box||{}).filter(([,s])=>s && s.turns>0);
    if(!entries.length) return '';
    return entries.map(([key,s])=>`${STATUS_DEFS[key]?.icon||'•'} ${STATUS_DEFS[key]?.label||key} ${s.turns}t`).join(' // ');
  }
  function addBattleStatus(target,key,turns=2,potency=3){
    ensureBattleStatus(); if(!battle || !STATUS_DEFS[key]) return '';
    const box = target === 'enemy' ? battle.enemyStatus : battle.playerStatus;
    const old = box[key] || {turns:0,potency:0};
    box[key] = {turns:Math.max(old.turns||0, turns), potency:Math.max(old.potency||0, potency)};
    const who = target === 'enemy' ? battle.enemy.name : 'Vyra';
    return `${who} afflicted with ${STATUS_DEFS[key].label}.`;
  }
  function tickBattleStatus(target){
    ensureBattleStatus();
    const out=[]; if(!battle) return out;
    const box = target === 'enemy' ? battle.enemyStatus : battle.playerStatus;
    const owner = target === 'enemy' ? battle.enemy : state.player;
    Object.entries({...box}).forEach(([key,s])=>{
      if(!s || s.turns<=0){ delete box[key]; return; }
      let dmg=Math.max(1, Number(s.potency||2));
      if(key==='shock') dmg=Math.max(1, Math.ceil(dmg*0.7));
      if(key==='corrosion') dmg=Math.max(2, dmg+1);
      if(target === 'enemy') battle.enemy.hp=Math.max(0,battle.enemy.hp-dmg);
      else state.player.hp=Math.max(0,state.player.hp-dmg);
      out.push(`${owner.name || 'Vyra'} ${STATUS_DEFS[key].tick} for ${dmg}.`);
      s.turns -= 1;
      if(s.turns<=0) delete box[key]; else box[key]=s;
    });
    return out;
  }
  function applyPlayerStatusFromAttack(index,dmg){
    ensureBattleStatus(); if(!battle || dmg<=0) return '';
    const level = skillLevel(state.combatStyle || 'attack');
    const power = Math.max(2, Math.floor(dmg/7) + Math.floor(level/18));
    if(index===0 && Math.random()<0.28) return addBattleStatus('enemy','bleed',2,power);
    if(index===1){ battle.evadeNext = true; if(Math.random()<0.18) return addBattleStatus('enemy','shock',1,Math.max(2,power-1)); return 'Vyra is primed to evade the next strike.'; }
    if(index===2 && Math.random()<0.38) return addBattleStatus('enemy','corrosion',3,power+1);
    return '';
  }
  function enemyStatusForStage(){
    const key=currentStageKey();
    if(key==='f001') return {key:'poison', chance:battle?.code==='B'?0.32:0.20, turns:2, potency:3, text:'grave rot'};
    if(key==='f002') return {key:'burn', chance:battle?.code==='B'?0.34:0.22, turns:2, potency:4, text:'ash burn'};
    if(key==='f003') return {key:'shock', chance:battle?.code==='B'?0.38:0.24, turns:2, potency:4, text:'dead-frequency shock'};
    return {key:'poison', chance:0.18, turns:2, potency:3, text:'fracture sickness'};
  }
  function applyEnemyStatusAfterHit(dmg,dodged){
    ensureBattleStatus(); if(!battle || dodged || dmg<=0) return '';
    const hazard=enemyStatusForStage();
    if(Math.random() < hazard.chance) return addBattleStatus('player', hazard.key, hazard.turns, hazard.potency + Math.floor((battle.enemy.atk||0)/18));
    return '';
  }
  function cleansePlayerStatuses(){
    ensureBattleStatus(); if(!battle) return 0;
    const count=Object.keys(battle.playerStatus||{}).length;
    battle.playerStatus = {};
    return count;
  }

  // v79: Overdrive gives long fights a payoff and makes status/guard loops matter.
  function ensureOverdrive(){
    if(!state?.player) return;
    state.player.maxOverdrive ||= 100;
    state.player.overdrive = Math.max(0, Math.min(state.player.maxOverdrive, Number(state.player.overdrive || 0)));
  }
  function chargeOverdrive(amount=0, reason=''){
    ensureOverdrive();
    const before = state.player.overdrive || 0;
    state.player.overdrive = Math.min(state.player.maxOverdrive || 100, before + Math.max(0, Math.floor(amount)));
    if(before < (state.player.maxOverdrive || 100) && state.player.overdrive >= (state.player.maxOverdrive || 100)){
      toast('Overdrive ready: Null Vector Execution');
    }
  }
  function overdriveReady(){ ensureOverdrive(); return (state.player.overdrive || 0) >= (state.player.maxOverdrive || 100); }
  function overdrivePct(){ ensureOverdrive(); return Math.max(0, Math.min(100, Math.floor(100 * (state.player.overdrive || 0) / (state.player.maxOverdrive || 100)))); }
  function useOverdriveBattle(){
    if(!battle || battle.turn !== 'player') return;
    ensureBattleStatus(); ensureOverdrive();
    if(!overdriveReady()){ toast(`Overdrive ${state.player.overdrive}/${state.player.maxOverdrive}`); return; }
    const stats = combatStatBlock();
    const skill = skillLevel('attack') + skillLevel('strength') + skillLevel('magic');
    const dmg = Math.max(35, 32 + stats.atk + stats.strBonus + Math.floor(skill / 4) + gearPower() % 18);
    state.player.overdrive = 0;
    SfxManager.slash();
    setTimeout(()=>SfxManager.slash(), 110);
    setTimeout(()=>SfxManager.slash(), 220);
    battle.enemy.hp = Math.max(0, battle.enemy.hp - dmg);
    const bleed = addBattleStatus('enemy','bleed',3,Math.max(4,Math.floor(dmg/12)));
    const corrosion = addBattleStatus('enemy','corrosion',3,Math.max(4,Math.floor(dmg/14)));
    const shock = addBattleStatus('enemy','shock',2,Math.max(3,Math.floor(dmg/16)));
    $('battleText').textContent = `OVERDRIVE: Null Vector Execution hits for -${dmg} HP. ${bleed} ${corrosion} ${shock}`;
    showDamage('enemy', `OVERDRIVE -${dmg}`, 'crit');
    flashCombatant('battleEnemy');
    shakeBattle(560);
    grantStyleXp('attack', 14);
    grantStyleXp('strength', 14);
    grantStyleXp('magic', 10);
    renderBattle();
    if(battle.enemy.hp<=0){ setTimeout(winBattle,420); return; }
    battle.turn='enemy';
    setTimeout(enemyTurn, 900);
  }

  // v80: Anomaly Research turns repeated kills into long-term collection progress.
  // No new monster names or assets: this reads the existing imported anomaly/boss library.
  const RESEARCH_THRESHOLDS = [1, 5, 10, 25, 50];
  function ensureResearch(){
    if(!state) return;
    state.anomalyResearch ||= {};
  }
  function researchKey(idOrEnemy){
    if(!idOrEnemy) return 'UNKNOWN';
    if(typeof idOrEnemy === 'string') return idOrEnemy;
    return idOrEnemy.id || idOrEnemy.name || 'UNKNOWN';
  }
  function researchRecordFor(id, fallbackName='', type='Anomaly'){
    ensureResearch();
    const key = researchKey(id);
    state.anomalyResearch[key] ||= {id:key, name:fallbackName || key, type, kills:0, claimed:[], stages:{}, firstSeen:0, lastSeen:0};
    const rec = state.anomalyResearch[key];
    rec.name ||= fallbackName || key;
    rec.type ||= type;
    rec.claimed ||= [];
    rec.stages ||= {};
    return rec;
  }
  function researchRank(kills=0){
    return RESEARCH_THRESHOLDS.filter(t => Number(kills||0) >= t).length;
  }
  function nextResearchThreshold(kills=0){
    return RESEARCH_THRESHOLDS.find(t => Number(kills||0) < t) || null;
  }
  function researchRewardFor(threshold, wasBoss=false){
    const credits = wasBoss ? 30 + threshold * 8 : 12 + threshold * 4;
    const skillXp = wasBoss ? 40 + threshold * 18 : 18 + threshold * 10;
    const items = [];
    if(threshold === 5) items.push(['Vector Cell', 1]);
    if(threshold === 10) items.push(['Med Patch', 1]);
    if(threshold === 25) items.push([wasBoss ? 'Rust Core' : 'Corrupted Catalyst', 1]);
    if(threshold === 50) items.push(['Operator Shard: Vyra', wasBoss ? 2 : 1]);
    return {credits, skillXp, items};
  }
  function recordAnomalyResearch(enemy, wasBoss=false){
    ensureResearch();
    if(!enemy) return null;
    const key = researchKey(enemy);
    const rec = researchRecordFor(key, enemy.name, wasBoss ? 'Boss' : 'Anomaly');
    const before = rec.kills || 0;
    rec.name = enemy.name || rec.name;
    rec.type = wasBoss ? 'Boss' : 'Anomaly';
    rec.kills = before + 1;
    rec.lastSeen = Date.now();
    if(!rec.firstSeen) rec.firstSeen = rec.lastSeen;
    rec.stages ||= {};
    rec.stages[stageDef().id] = (rec.stages[stageDef().id] || 0) + 1;
    const rewards=[];
    RESEARCH_THRESHOLDS.forEach(threshold => {
      if(rec.kills >= threshold && !(rec.claimed||[]).includes(threshold)){
        rec.claimed.push(threshold);
        const reward = researchRewardFor(threshold, wasBoss);
        addCredits(reward.credits);
        grantStyleXp('slayer', reward.skillXp);
        reward.items.forEach(([name, qty]) => addItem(name, qty));
        rewards.push(`Rank ${researchRank(rec.kills)} reward: +${reward.credits} credits, +${reward.skillXp} Hunt XP${reward.items.length ? ', '+reward.items.map(([n,q])=>`${q} ${n}`).join(', ') : ''}`);
      }
    });
    if(before === 0){ log(`Research unlocked: ${rec.name}.`); }
    if(rewards.length){ log(`Research advanced: ${rec.name} // ${rec.kills} kills. ${rewards[rewards.length-1]}`); toast(`Research rank up: ${rec.name}`); }
    queueAutosave();
    return rec;
  }
  function researchSummary(){
    ensureResearch();
    const all = (typeof getCreatureLibrary === 'function') ? getCreatureLibrary() : [];
    const records = Object.values(state.anomalyResearch || {});
    const discovered = records.filter(r => (r.kills||0) > 0).length;
    const kills = records.reduce((sum,r)=>sum+(r.kills||0),0);
    const ranks = records.reduce((sum,r)=>sum+researchRank(r.kills||0),0);
    return {discovered, total:all.length||0, kills, ranks};
  }
  function researchLineForCreature(d){
    ensureResearch();
    const rec = state.anomalyResearch?.[d.id];
    const kills = rec?.kills || 0;
    const rank = researchRank(kills);
    const next = nextResearchThreshold(kills);
    return {kills, rank, next, text: next ? `${kills}/${next} to next research reward` : `${kills} kills // complete`};
  }

  // Reused/adapted from Cryptic Idle Worlds: RuneScape-style XP table + skill matrix.
  const xpTable = Array(100).fill(0).map((_, level) => {
    let xp = 0;
    for (let i = 1; i < level; i++) xp += Math.floor(i + 300 * Math.pow(2, i / 7));
    return Math.floor(xp / 4);
  });
  const skillList = {
    attack: { name: 'Attack', short:'ATK', emblem:'A', icon:'assets/skills/attack.png', type: 'combat', bonus: 'Improves hit quality, crit chance, and unlocks stronger stage scaling.' },
    strength: { name: 'Strength', short:'STR', emblem:'S', icon:'assets/skills/strength.png', type: 'combat', bonus: 'Raises blade damage and physical pressure.' },
    defense: { name: 'Defense', short:'DEF', emblem:'D', icon:'assets/skills/defense.png', type: 'combat', bonus: 'Reduces incoming damage and improves survival.' },
    health: { name: 'Health', short:'HP', emblem:'H', icon:'assets/skills/health.png', type: 'combat', bonus: 'Raises max HP as the operator survives combat.' },
    magic: { name: 'Neurohex', short:'HEX', emblem:'N', icon:'assets/skills/magic.png', type: 'combat', bonus: 'Improves EP efficiency and protocol damage.' },
    ranged: { name: 'Precision', short:'PRC', emblem:'P', icon:'assets/skills/ranged.png', type: 'combat', bonus: 'Improves dodge chance and ranged/aimed protocol accuracy.' },
    slayer: { name: 'Anomaly Hunting', short:'HNT', emblem:'X', icon:'assets/skills/slayer.png', type: 'noncombat', bonus: 'Tracks creature takedowns and future slayer tasks.' },
    cryptomining: { name: 'Cryptomining', short:'MIN', emblem:'M', icon:'assets/skills/cryptomining.png', type: 'noncombat', bonus: 'Future resource loop.' },
    datafishing: { name: 'Datafishing', short:'DAT', emblem:'F', icon:'assets/skills/datafishing.png', type: 'noncombat', bonus: 'Future data recovery loop.' },
    codecraft: { name: 'Codecraft', short:'CRF', emblem:'C', icon:'assets/skills/codecraft.png', type: 'noncombat', bonus: 'Future crafting loop.' },
    forgenetics: { name: 'Forgenetics', short:'BIO', emblem:'G', icon:'assets/skills/forgenetics.png', type: 'noncombat', bonus: 'Future bio-upgrade loop.' },
    system_hacking: { name: 'System Hacking', short:'SYS', emblem:'Y', icon:'assets/skills/system_hacking.png', type: 'noncombat', bonus: 'Future terminal loop.' }
  };


  // v69: repeatable Anomaly Contracts give respawning monsters a real grind loop.
  // Contracts use the existing imported creature roster and do not add new monster names/assets.
  const CONTRACT_POOLS = {
    f001: [
      {title:'Grave Sweep', desc:'Neutralize repeat anomaly signatures inside Forbidden Graveyard.', target:5, credits:28, syncXp:24, skillXp:90, item:'Scrap Metal', itemQty:2},
      {title:'Overflow Cleanup', desc:'Farm respawns until AVOS stops screaming about biohazards.', target:8, credits:46, syncXp:38, skillXp:140, item:'Med Patch', itemQty:1},
      {title:'Shard Static', desc:'Collect enough anomaly readings to stabilize Vyra sync fragments.', target:10, credits:64, syncXp:55, skillXp:190, item:'Operator Shard: Vyra', itemQty:1}
    ],
    f002: [
      {title:'Outpost Suppression', desc:'Thin the Ash Wastes patrol signatures using the imported creature roster.', target:7, credits:70, syncXp:62, skillXp:210, item:'Burnt Alloy', itemQty:2},
      {title:'Signal Cleanup', desc:'Break hostile readings around the outpost relay route.', target:10, credits:96, syncXp:88, skillXp:300, item:'Outpost Access Chip', itemQty:1},
      {title:'Core Hunt', desc:'Grind stronger signatures for a better chance at crafting materials.', target:12, credits:120, syncXp:110, skillXp:390, item:'Rust Core', itemQty:1}
    ],
    f003: [
      {title:'Dead Frequency Sweep', desc:'Neutralize repeat signatures inside Neon Graveyard using the existing imported roster.', target:9, credits:130, syncXp:120, skillXp:420, item:'Corrupted Catalyst', itemQty:1},
      {title:'Wraith Static Cleanup', desc:'Grind graveyard respawns until the dead-frequency signal stabilizes.', target:12, credits:165, syncXp:155, skillXp:540, item:'Rust Core', itemQty:1},
      {title:'Neon Core Harvest', desc:'High-threat contract for late-stage training and rare material recovery.', target:15, credits:210, syncXp:210, skillXp:720, item:'Operator Shard: Vyra', itemQty:2}
    ]
  };

  function buildContract(stageKey=currentStageKey()){
    const pool = CONTRACT_POOLS[stageKey] || CONTRACT_POOLS.f001;
    state.contractCounter = (state.contractCounter || 0) + 1;
    const pick = pool[(state.contractCounter - 1) % pool.length];
    return {
      id:`${stageKey}-contract-${state.contractCounter}`,
      stage:stageKey,
      title:pick.title,
      desc:pick.desc,
      target:pick.target,
      progress:0,
      credits:pick.credits,
      syncXp:pick.syncXp,
      skillXp:pick.skillXp,
      item:pick.item,
      itemQty:pick.itemQty || 1,
      complete:false,
      claimed:false,
      createdAt:Date.now()
    };
  }

  function ensureContracts(){
    state.contracts ||= {};
    state.contractHistory ||= [];
    state.contractCounter ||= 0;
    Object.keys(STAGE_DEFS).forEach(key => {
      const c = state.contracts[key];
      if(!c || c.claimed || c.stage !== key) state.contracts[key] = buildContract(key);
      state.contracts[key].target = Math.max(1, Number(state.contracts[key].target || 5));
      state.contracts[key].progress = Math.max(0, Number(state.contracts[key].progress || 0));
      state.contracts[key].complete = state.contracts[key].progress >= state.contracts[key].target;
    });
  }

  function activeContract(stageKey=currentStageKey()){
    ensureContracts();
    return state.contracts[stageKey] || state.contracts.f001;
  }

  function advanceContract(enemyName='Anomaly'){
    ensureContracts();
    const c = activeContract();
    if(!c || c.complete || c.claimed) return;
    c.progress = Math.min(c.target, (c.progress || 0) + 1);
    c.lastTarget = enemyName;
    if(c.progress >= c.target){
      c.complete = true;
      log(`Contract complete: ${c.title}. Claim it from Mission Briefing.`);
      toast(`Contract complete: ${c.title}`);
    }
  }

  function claimContract(stageKey=currentStageKey()){
    ensureContracts();
    const c = activeContract(stageKey);
    if(!c.complete){ toast(`${c.title}: ${c.progress}/${c.target}`); return; }
    addCredits(c.credits || 0);
    gainXp(c.syncXp || 0);
    grantStyleXp('slayer', c.skillXp || 0);
    if(c.item) addItem(c.item, c.itemQty || 1);
    c.claimed = true;
    state.contractHistory.unshift({title:c.title, stage:stageDef(stageKey).id, claimedAt:Date.now(), credits:c.credits, item:c.item, itemQty:c.itemQty});
    state.contractHistory = state.contractHistory.slice(0, 12);
    state.contracts[stageKey] = buildContract(stageKey);
    log(`Contract reward claimed: ${c.title}.`);
    save(true); renderAll(); renderMissionContractPanel(); toast('Contract claimed. New contract loaded.');
  }

  function rerollContract(stageKey=currentStageKey()){
    ensureContracts();
    const cost = Math.max(10, 10 + (stageDef(stageKey).levelReq || 1) * 2);
    if(state.player.credits < cost){ toast(`Need ${cost} credits to reroll contract.`); return; }
    state.player.credits -= cost;
    state.contracts[stageKey] = buildContract(stageKey);
    log(`Contract rerolled for ${stageDef(stageKey).id}.`);
    save(true); renderAll(); renderMissionContractPanel();
  }

  function contractHtml(stageKey=currentStageKey()){
    const c = activeContract(stageKey);
    const def = stageDef(stageKey);
    const pct = Math.min(100, Math.floor((c.progress / c.target) * 100));
    const reward = `${c.credits} credits // ${c.syncXp} Sync XP // ${c.skillXp} Anomaly Hunting XP${c.item ? ' // '+c.itemQty+' '+c.item : ''}`;
    return `<section class="fracture-card contract-board"><div class="record-kicker">REPEATABLE CONTRACT // ${safeHtml(def.id)}</div><h3>${safeHtml(c.title)}</h3><p>${safeHtml(c.desc)}</p><div class="statrow">Progress ${c.progress}/${c.target}<div class="bar xp"><span style="width:${pct}%"></span></div></div><div class="protocol-list"><div><b>Reward</b><span>${safeHtml(reward)}</span></div><div><b>Status</b><span>${c.complete?'Ready to claim':'Hunt respawning anomalies to progress'}</span></div></div><button onclick="window.AV.claimContract('${stageKey}')" ${c.complete?'':'disabled'}>${c.complete?'Claim Contract':'Incomplete'}</button><button onclick="window.AV.rerollContract('${stageKey}')">Reroll Contract</button></section>`;
  }

  function renderMissionContractPanel(){
    ensureContracts();
    const grid = document.querySelector('#missionOverlay .fracture-grid');
    if(!grid) return;
    let panel = $('missionContractBoard');
    if(!panel){ panel = document.createElement('div'); panel.id = 'missionContractBoard'; grid.appendChild(panel); }
    panel.innerHTML = contractHtml() + sideQuestHtml();
  }

  function createSkillData(){
    const data = {};
    Object.keys(skillList).forEach(k => data[k] = { xp: 0, level: 1 });
    return data;
  }
  function ensureProgression(){
    if(!state.skillData) state.skillData = createSkillData();
    Object.keys(skillList).forEach(k => state.skillData[k] ||= {xp:0,level:1});
    // v63 migration: old saves did not have Health. Start it at the player's current level so HP feels consistent.
    state.skillData.health ||= {xp:0, level:Math.max(1, state.player?.level || 1)};
    state.combatStyle ||= 'attack';
    state.currentStage ||= 'f001';
    state.stages ||= {f001:{unlocked:true,complete:false}, f002:{unlocked:false,complete:false}};
    state.stages.f001 ||= {unlocked:true,complete:false};
    state.stages.f001.unlocked = true;
    state.stages.f002 ||= {unlocked:false,complete:false};
    if(state.flags?.chapterComplete && state.player?.level >= STAGE_DEFS.f002.levelReq) state.stages.f002.unlocked = true;
    ensureStoryFlags();
    ensureUpgrades();
    ensureEquipment();
    ensureOverdrive();
    ensureRespawnState();
    ensureNpcState();
    ensureSideQuests();
  }
  function ensureStoryFlags(){
    state.flags ||= {};
    state.flags.storySeen ||= {};
    state.flags.bossDefeated ||= false;
    state.flags.chapterRewardsClaimed ||= false;
    state.flags.chapterClearSeen ||= false;
  }
  const UPGRADE_DEFS = {
    blade:{name:'Blade Calibration', max:5, base:25, step:20, desc:'+2 ATK each rank.', apply(){state.player.atk += 2;}},
    armor:{name:'Carbon Skin Plating', max:5, base:30, step:25, desc:'+8 Max HP and +1 DEF each rank.', apply(){state.player.maxHp += 8; state.player.hp = Math.min(state.player.maxHp, state.player.hp + 8); state.player.def += 1;}},
    energy:{name:'Vector Cell Expansion', max:5, base:25, step:20, desc:'+5 Max EP each rank.', apply(){state.player.maxEp += 5; state.player.ep = Math.min(state.player.maxEp, state.player.ep + 5);}},
    medtech:{name:'Med Patch Efficiency', max:3, base:35, step:30, desc:'+10 HP healed by Med Patch each rank.', apply(){}}
  };
  function ensureUpgrades(){
    state.upgrades ||= {};
    Object.keys(UPGRADE_DEFS).forEach(k => state.upgrades[k] ||= 0);
    state.checkpoint ||= null;
  }
  function upgradeCost(key){
    ensureUpgrades();
    const d=UPGRADE_DEFS[key];
    const rank=state.upgrades[key]||0;
    return d.base + d.step * rank;
  }
  function buyUpgrade(key){
    ensureUpgrades();
    const d=UPGRADE_DEFS[key];
    if(!d) return;
    const rank=state.upgrades[key]||0;
    if(rank >= d.max){ toast('Upgrade already maxed.'); return; }
    const cost=upgradeCost(key);
    if(state.player.credits < cost){ toast(`Need ${cost} credits.`); return; }
    state.player.credits -= cost;
    state.upgrades[key] = rank + 1;
    d.apply();
    if(state.checkpoint?.snapshot){
      state.checkpoint.snapshot.player = JSON.parse(JSON.stringify(state.player));
      state.checkpoint.snapshot.inventory = JSON.parse(JSON.stringify(state.inventory));
      state.checkpoint.snapshot.upgrades = JSON.parse(JSON.stringify(state.upgrades));
      state.checkpoint.snapshot.skillData = JSON.parse(JSON.stringify(state.skillData));
      state.checkpoint.snapshot.combatStyle = state.combatStyle;
    }
    log(`${d.name} upgraded to rank ${state.upgrades[key]}/${d.max}.`);
    renderProgressionDb(); renderUI(); save(true);
  }
  function setCheckpoint(label='Checkpoint'){
    ensureProgression();
    const snap = JSON.parse(JSON.stringify({...state, checkpoint:null, lastSave:Date.now()}));
    state.checkpoint = {label, savedAt:Date.now(), snapshot:snap};
    log(`${label} checkpoint synced.`);
  }
  function restoreCheckpoint(){
    ensureProgression();
    const cp = state.checkpoint;
    if(!cp || !cp.snapshot) return false;
    state = JSON.parse(JSON.stringify(cp.snapshot));
    state.checkpoint = cp;
    ensureProgression();
    const caps=combatStatBlock();
    state.player.hp = Math.max(1, Math.min(caps.maxHp, state.player.hp || caps.maxHp));
    state.player.ep = Math.max(0, Math.min(caps.maxEp||state.player.maxEp, state.player.ep || (caps.maxEp||state.player.maxEp)));
    toast(`Restored: ${cp.label}`);
    return true;
  }
  function grantStyleXp(style, xp){
    ensureProgression();
    if(!skillList[style]) return;
    const data = state.skillData[style] || (state.skillData[style] = {xp:0,level:1});
    const oldLevel=data.level;
    data.xp = Math.min(xpTable[99], data.xp + Math.max(0, xp));
    for(let lvl=1; lvl<=99; lvl++){
      if(data.xp >= xpTable[lvl] && data.level < lvl){
        data.level = lvl;
        const skillName = skillList[style]?.name || style;
        log(`${skillName} reached Lv. ${lvl}.`);
        toast(`${skillName} Lv. ${lvl}`);
      }
    }
    levelBenefit(style, oldLevel, data.level);
    queueAutosave();
  }
  function stylePercent(k){ return skillXpToNext(k).pct; }
  function setCombatStyle(k){ ensureProgression(); state.combatStyle = k; renderProgressionDb(); renderUI(); toast(`Training focus: ${skillList[k].name}`); save(true); }

  function skillLevel(k){ ensureProgression(); return (state.skillData[k] || {level:1}).level || 1; }
  function combatModifiers(){
    const focus = state.combatStyle || 'attack';
    const lvl = skillLevel(focus);
    return {
      focus,
      level: lvl,
      damageBonus: focus === 'strength' ? Math.floor(lvl / 2) : focus === 'attack' ? Math.floor(lvl / 3) : focus === 'magic' ? Math.floor(lvl / 4) : 0,
      critBonus: focus === 'attack' ? Math.min(0.18, lvl * 0.006) : focus === 'ranged' ? Math.min(0.12, lvl * 0.004) : 0,
      dodgeBonus: focus === 'ranged' ? Math.min(0.18, lvl * 0.006) : 0,
      damageReduction: focus === 'defense' ? Math.floor(lvl / 3) : 0,
      epDiscount: focus === 'magic' ? Math.min(3, Math.floor(lvl / 12)) : 0
    };
  }


  function skillEmblem(key){
    const info=skillList[key] || {short:'?', emblem:'?'};
    const label=safeHtml(info.name||key);
    const glyph=safeHtml(info.emblem||info.short||'?');
    const img=info.icon ? `<img src="${safeHtml(info.icon)}?v=${BUILD_VERSION}" alt="${label}" onerror="this.remove();this.parentElement.classList.add('missing-icon')">` : '';
    return `<span class="skill-emblem skill-${key}" aria-label="${label}">${img}<b>${glyph}</b></span>`;
  }
  function skillXpToNext(key){
    ensureProgression();
    const d=state.skillData[key] || {xp:0,level:1};
    if(d.level >= 99) return {prev:xpTable[99], next:xpTable[99], remaining:0, pct:100};
    const prev=xpTable[d.level] || 0;
    const next=xpTable[d.level+1] || xpTable[99];
    return {prev,next,remaining:Math.max(0,next-d.xp),pct:Math.max(0,Math.min(100,((d.xp-prev)/Math.max(1,next-prev))*100))};
  }
  function combatStatBlock(){
    ensureProgression();
    const atkLv=skillLevel('attack'), strLv=skillLevel('strength'), defLv=skillLevel('defense'), hpLv=skillLevel('health');
    const gear=equipmentBonuses();
    return {
      atkLv,strLv,defLv,hpLv,
      atk: state.player.atk + Math.floor((atkLv-1)/5) + gear.atk,
      strBonus: Math.floor((strLv-1)/3) + gear.str,
      def: state.player.def + Math.floor((defLv-1)/4) + gear.def,
      maxHp: state.player.maxHp + Math.floor((hpLv-1)*2.5) + gear.hp,
      maxEp: state.player.maxEp + gear.ep,
      hpBonus: Math.floor((hpLv-1)*2.5) + gear.hp,
      crit: Math.min(0.35, 0.08 + atkLv * 0.0025 + gear.crit),
      xpBonus: gear.xpBonus || 0,
      block: Math.floor((defLv-1)/5)
    };
  }
  function syncHpCap(){
    const stats=combatStatBlock();
    if(state.player.hp > stats.maxHp) state.player.hp = stats.maxHp;
    if(stats.maxEp && state.player.ep > stats.maxEp) state.player.ep = stats.maxEp;
    return stats;
  }
  let autosaveQueued=false;
  function queueAutosave(){
    if(autosaveQueued) return;
    autosaveQueued=true;
    setTimeout(()=>{ autosaveQueued=false; try{ save(true); }catch(e){} }, 350);
  }
  function levelBenefit(skill, oldLevel, newLevel){
    if(newLevel <= oldLevel) return;
    const gained = newLevel - oldLevel;
    if(skill === 'health'){
      const hpGain = gained * 3;
      state.player.maxHp += hpGain;
      state.player.hp = Math.min(combatStatBlock().maxHp, state.player.hp + hpGain);
      log(`Health training raised Max HP by ${hpGain}.`);
    }
    if(skill === 'defense' && Math.floor(newLevel/5) > Math.floor(oldLevel/5)){
      state.player.def += 1;
      log('Defense training improved base DEF by 1.');
    }
    if((skill === 'attack' || skill === 'strength') && Math.floor(newLevel/5) > Math.floor(oldLevel/5)){
      state.player.atk += 1;
      log(`${skillList[skill].name} training improved base ATK by 1.`);
    }
  }
  function playerMeetsStageRequirement(key){
    const def=stageDef(key);
    ensureProgression();
    return key === 'f001' || (state.player.level >= def.levelReq && !!state.stages[key]?.unlocked);
  }
  function loadStage(key, opts={}){
    ensureProgression();
    const force=!!opts.force;
    if(!force) unlockNextStages();
    const def=stageDef(key);
    if(force){ state.stages ||= {}; state.stages[key] ||= {unlocked:true,complete:false}; state.stages[key].unlocked = true; }
    if(!force && !playerMeetsStageRequirement(key)){
      toast(`${def.id} locked. Requires Player Lv. ${def.levelReq} and previous mission clear.`);
      return false;
    }
    const parsed=parseStageMap(key);
    state.currentStage=key;
    state.mapVersion=MAP_VERSION;
    state.map=parsed.map;
    clearStageRespawns(key);
    state.player.x=parsed.px; state.player.y=parsed.py; state.player.facing='down';
    state.player.hp=Math.min(combatStatBlock().maxHp,state.player.hp || combatStatBlock().maxHp);
    state.player.ep=Math.min(combatStatBlock().maxEp||state.player.maxEp,state.player.ep || (combatStatBlock().maxEp||state.player.maxEp));
    state.flags={terminal:false,lore:false,key:false,bossUnlocked:false,bossDefeated:false,chapterComplete:false,chapterRewardsClaimed:false,chapterClearSeen:false,storySeen:{},anomaliesCleared:0,chests:0};
    state.visited={[`${parsed.px},${parsed.py}`]:1};
    battle=null;
    setCheckpoint(`${def.id} Entry`);
    log(`${def.id} // ${def.title} loaded${force?' from QA console':''}.`);
    save(true);
    hideAll(); uiState.mode='game'; gameStarted=true; document.body.classList.add('game-active','fullscreen-mode'); $('app').classList.remove('hidden');
    document.body.dataset.stage=def.key; ensureMobileActionPad(); setMobilePlayMode(); renderAll(); AudioManager.play('level1'); pulseObjective(currentObjectiveText()); if(key !== 'f001') setTimeout(()=>showStoryOnce(key+'Intro'), 260);
    return true;
  }
  function qaLoadStage(key){
    ensureProgression();
    const def=stageDef(key);
    state.stages ||= {};
    state.stages[key] ||= {unlocked:true,complete:false};
    state.stages[key].unlocked = true;
    state.player.level = Math.max(state.player.level || 1, def.levelReq || 1);
    syncHpCap();
    const ok = loadStage(key, {force:true});
    if(ok) toast(`QA loaded ${def.id}.`);
    return ok;
  }
  function qaUnlockAllStages(){
    ensureProgression();
    Object.keys(STAGE_DEFS).forEach(key => {
      state.stages[key] ||= {unlocked:true,complete:false};
      state.stages[key].unlocked = true;
    });
    toast('QA stages unlocked.');
    renderAll();
    queueAutosave();
  }
  function renderQaStagePicker(){
    const select=$('qaStageSelect');
    if(!select || !state) return;
    const current=currentStageKey();
    select.innerHTML=Object.entries(STAGE_DEFS).map(([key,d])=>`<option value="${key}">${d.id} // ${d.title} // Req Lv ${d.levelReq}</option>`).join('');
    select.value=current;
  }
  function unlockNextStages(){
    state.stages ||= {};
    const order=Object.keys(STAGE_DEFS);
    order.forEach((key,i)=>{
      state.stages[key] ||= {unlocked:i===0,complete:false};
      if(i===0) state.stages[key].unlocked=true;
      const prev=order[i-1];
      if(prev && state.stages[prev]?.complete && state.player.level >= STAGE_DEFS[key].levelReq){ state.stages[key].unlocked=true; }
      if(prev && !state.stages[prev]?.complete && i>0){ state.stages[key].unlocked=false; }
    });
  }



  const coreItemRegistry = [
    {id:'IT-001', name:'Med Patch', type:'Consumable', category:'Medical', slot:'Quick Use', rarity:'Common', stackSize:99, sellPrice:8, asset:'assets/items/med_patch.png', source:'assets/source/items/med_patch.png', status:'production-icon', desc:'Emergency field patch. Restores 25 HP.'},
    {id:'IT-010', name:'Vector Cell', type:'Consumable', category:'Energy', slot:'Quick Use', rarity:'Common', stackSize:99, sellPrice:10, asset:'assets/items/imported/consumables/consumables/common/it-1043_vector_cell.png', source:'assets/items/imported/consumables/consumables/common/it-1043_vector_cell.png', status:'production-art', desc:'Vector Cell energy capsule. Restores EP during fights or exploration.'},
    {id:'IT-002', name:'Scrap Metal', type:'Material', category:'Crafting', slot:'Stack', rarity:'Common', stackSize:999, sellPrice:2, asset:'assets/items/scrap_metal.png', source:'assets/source/items/scrap_metal.png', status:'production-icon', desc:'Recovered industrial scrap used for upgrades.'},
    {id:'IT-003', name:'Corrupted Catalyst', type:'Material', category:'Catalyst', slot:'Stack', rarity:'Epic', stackSize:99, sellPrice:40, asset:'assets/items/corrupted_catalyst.png', source:'assets/source/items/corrupted_catalyst.png', status:'production-icon', desc:'Unstable upgrade material pulled from corrupted systems.'},
    {id:'IT-004', name:'Keycard LV1', type:'Key Item', category:'Access', slot:'Story', rarity:'Uncommon', stackSize:1, sellPrice:0, asset:'assets/items/keycard_lv1.png', source:'assets/source/items/keycard_lv1.png', status:'production-icon', desc:'Level-one access credential for sealed maintenance zones.'},
    {id:'IT-005', name:'Archive Log 001', type:'Archive', category:'Lore', slot:'Database', rarity:'Rare', stackSize:1, sellPrice:0, asset:'assets/items/archive_log_001.png', source:'assets/source/items/archive_log_001.png', status:'production-icon', desc:'Recovered classified AVOS archive fragment.'},
    {id:'IT-006', name:'Operator Shard: Vyra', type:'Shard', category:'Operator', slot:'Recruitment', rarity:'Legendary', stackSize:999, sellPrice:75, asset:'assets/items/operator_shard_vyra.png', source:'assets/source/items/operator_shard_vyra.png', status:'production-icon', desc:'A synchronization shard keyed to Operator AV-001.'},
    {id:'IT-007', name:'Rust Core', type:'Material', category:'Anomaly Core', slot:'Stack', rarity:'Rare', stackSize:99, sellPrice:25, asset:'assets/items/rust_core.png', source:'assets/source/items/rust_core.png', status:'production-icon', desc:'Dense anomaly core used in future crafting and operator growth.'},
    {id:'EQ-001', name:'Vector Training Blade', type:'Weapon', category:'Weapons', slot:'Weapon', rarity:'Common', stackSize:1, sellPrice:12, asset:'assets/items/imported/weapons/weapons/uncommon/it-1132_emberfang_dagger.png', status:'gameplay-gear', levelReq:1, stats:{atk:3,str:1}, desc:'Starter blade tuned for Vyra. Good enough to make graveyard monsters sign medical waivers.'},
    {id:'EQ-002', name:'Sewer Guard Vest', type:'Equipment', category:'Armor', slot:'Chest', rarity:'Common', stackSize:1, sellPrice:10, asset:'assets/items/imported/armor/chest/common/it-1007_chest_common.png', status:'gameplay-gear', levelReq:1, stats:{def:2,hp:8}, desc:'A cleaned-up vest from an unlucky guard. Smells like plot progression.'},
    {id:'EQ-003', name:'Rustcore Blade', type:'Weapon', category:'Weapons', slot:'Weapon', rarity:'Rare', stackSize:1, sellPrice:55, asset:'assets/items/imported/weapons/weapons/rare/it-1108_duskhowl_blade.png', status:'crafted-gear', levelReq:3, stats:{atk:8,str:4,crit:0.03}, desc:'Crafted from anomaly metal. The edge hums like it knows your browser history.'},
    {id:'EQ-004', name:'Catalyst Core', type:'Equipment', category:'Core', slot:'Core', rarity:'Epic', stackSize:1, sellPrice:90, asset:'assets/items/corrupted_catalyst.png', status:'crafted-gear', levelReq:5, stats:{atk:3,def:2,hp:20,ep:10}, desc:'A dangerous core module that boosts every important stat and probably voids warranties.'},
    {id:'EQ-005', name:'Toxic Monarch Relic', type:'Equipment', category:'Relic', slot:'Relic', rarity:'Legendary', stackSize:1, sellPrice:140, asset:'assets/items/rust_core.png', status:'boss-gear', levelReq:5, stats:{atk:5,str:5,def:3,hp:25,crit:0.05,xpBonus:0.05}, desc:'Boss-class relic. It whispers motivational insults before every fight.'},
    {id:'IT-008', name:'Burnt Alloy', type:'Material', category:'Crafting', slot:'Stack', rarity:'Uncommon', stackSize:999, sellPrice:6, asset:'assets/items/scrap_metal.png', status:'f002-material', desc:'Heat-scarred outpost metal used for Ash Wastes gear.'},
    {id:'IT-009', name:'Outpost Access Chip', type:'Key Item', category:'Access', slot:'Story', rarity:'Rare', stackSize:99, sellPrice:0, asset:'assets/items/keycard_lv1.png', status:'f002-key', desc:'Recovered access chip from the Ash Wastes Outpost route.'},
    {id:'EQ-006', name:'Ash-Plated Blade', type:'Weapon', category:'Weapons', slot:'Weapon', rarity:'Rare', stackSize:1, sellPrice:75, asset:'assets/items/imported/weapons/weapons/rare/it-1108_duskhowl_blade.png', status:'f002-gear', levelReq:5, stats:{atk:11,str:6,crit:0.04}, desc:'A heavier ash-wrapped blade tuned for F-002 anomaly armor.'},
    {id:'EQ-007', name:'Wasteland Guard Helm', type:'Equipment', category:'Armor', slot:'Helm', rarity:'Rare', stackSize:1, sellPrice:65, asset:'assets/items/imported/armor/helm/rare/it-1023_helm_rare.png', status:'f002-gear', levelReq:5, stats:{def:5,hp:18,ep:4}, desc:'Outpost helm with the HUD cracked but the skull protection still online.'},
    {id:'EQ-008', name:'Ashveil Mother Core', type:'Equipment', category:'Core', slot:'Core', rarity:'Legendary', stackSize:1, sellPrice:180, asset:'assets/items/rust_core.png', status:'f002-boss-gear', levelReq:7, stats:{atk:7,str:4,def:4,hp:36,ep:14,crit:0.04,xpBonus:0.06}, desc:'Boss-class core recovered from the imported Ashveil Spider Mother record. It pulses like an engine trying to insult you.'},
    {id:'EQ-009', name:'Duskwither Wraith Core', type:'Equipment', category:'Core', slot:'Core', rarity:'Legendary', stackSize:1, sellPrice:220, asset:'assets/items/rust_core.png', status:'f003-boss-gear', levelReq:12, stats:{atk:9,str:6,def:6,hp:46,ep:18,crit:0.06,xpBonus:0.08}, desc:'Boss-class core recovered from the imported Duskwither Shade Wraith record. It hums like a haunted GPU and boosts late-stage training.'}
  ];

  const importedItemRegistry = [{"id":"IT-1001","name":"Common Cape","type":"Equipment","category":"Armor","slot":"Cape","rarity":"Common","stackSize":1,"sellPrice":5,"asset":"assets/items/imported/armor/cape/common/it-1001_cape_common.png","status":"placeholder-art"},{"id":"IT-1002","name":"Epic Cape","type":"Equipment","category":"Armor","slot":"Cape","rarity":"Epic","stackSize":1,"sellPrice":40,"asset":"assets/items/imported/armor/cape/epic/it-1002_cape_epic.png","status":"placeholder-art"},{"id":"IT-1003","name":"Legendary Cape","type":"Equipment","category":"Armor","slot":"Cape","rarity":"Legendary","stackSize":1,"sellPrice":80,"asset":"assets/items/imported/armor/cape/legendary/it-1003_cape_legendary.png","status":"placeholder-art"},{"id":"IT-1004","name":"Mythic Cape","type":"Equipment","category":"Armor","slot":"Cape","rarity":"Mythic","stackSize":1,"sellPrice":160,"asset":"assets/items/imported/armor/cape/mythic/it-1004_cape_mythic.png","status":"placeholder-art"},{"id":"IT-1005","name":"Rare Cape","type":"Equipment","category":"Armor","slot":"Cape","rarity":"Rare","stackSize":1,"sellPrice":20,"asset":"assets/items/imported/armor/cape/rare/it-1005_cape_rare.png","status":"placeholder-art"},{"id":"IT-1006","name":"Uncommon Cape","type":"Equipment","category":"Armor","slot":"Cape","rarity":"Uncommon","stackSize":1,"sellPrice":10,"asset":"assets/items/imported/armor/cape/uncommon/it-1006_cape_uncommon.png","status":"placeholder-art"},{"id":"IT-1007","name":"Common Chest","type":"Equipment","category":"Armor","slot":"Chest","rarity":"Common","stackSize":1,"sellPrice":5,"asset":"assets/items/imported/armor/chest/common/it-1007_chest_common.png","status":"placeholder-art"},{"id":"IT-1008","name":"Epic Chest","type":"Equipment","category":"Armor","slot":"Chest","rarity":"Epic","stackSize":1,"sellPrice":40,"asset":"assets/items/imported/armor/chest/epic/it-1008_chest_epic.png","status":"placeholder-art"},{"id":"IT-1009","name":"Legendary Chest","type":"Equipment","category":"Armor","slot":"Chest","rarity":"Legendary","stackSize":1,"sellPrice":80,"asset":"assets/items/imported/armor/chest/legendary/it-1009_chest_legendary.png","status":"placeholder-art"},{"id":"IT-1010","name":"Mythic Chest","type":"Equipment","category":"Armor","slot":"Chest","rarity":"Mythic","stackSize":1,"sellPrice":160,"asset":"assets/items/imported/armor/chest/mythic/it-1010_chest_mythic.png","status":"placeholder-art"},{"id":"IT-1011","name":"Rare Chest","type":"Equipment","category":"Armor","slot":"Chest","rarity":"Rare","stackSize":1,"sellPrice":20,"asset":"assets/items/imported/armor/chest/rare/it-1011_chest_rare.png","status":"placeholder-art"},{"id":"IT-1012","name":"Uncommon Chest","type":"Equipment","category":"Armor","slot":"Chest","rarity":"Uncommon","stackSize":1,"sellPrice":10,"asset":"assets/items/imported/armor/chest/uncommon/it-1012_chest_uncommon.png","status":"placeholder-art"},{"id":"IT-1013","name":"Common Gloves","type":"Equipment","category":"Armor","slot":"Gloves","rarity":"Common","stackSize":1,"sellPrice":5,"asset":"assets/items/imported/armor/gloves/common/it-1013_gloves_common.png","status":"placeholder-art"},{"id":"IT-1014","name":"Epic Gloves","type":"Equipment","category":"Armor","slot":"Gloves","rarity":"Epic","stackSize":1,"sellPrice":40,"asset":"assets/items/imported/armor/gloves/epic/it-1014_gloves_epic.png","status":"placeholder-art"},{"id":"IT-1015","name":"Legendary Gloves","type":"Equipment","category":"Armor","slot":"Gloves","rarity":"Legendary","stackSize":1,"sellPrice":80,"asset":"assets/items/imported/armor/gloves/legendary/it-1015_gloves_legendary.png","status":"placeholder-art"},{"id":"IT-1016","name":"Mythic Gloves","type":"Equipment","category":"Armor","slot":"Gloves","rarity":"Mythic","stackSize":1,"sellPrice":160,"asset":"assets/items/imported/armor/gloves/mythic/it-1016_gloves_mythic.png","status":"placeholder-art"},{"id":"IT-1017","name":"Rare Gloves","type":"Equipment","category":"Armor","slot":"Gloves","rarity":"Rare","stackSize":1,"sellPrice":20,"asset":"assets/items/imported/armor/gloves/rare/it-1017_gloves_rare.png","status":"placeholder-art"},{"id":"IT-1018","name":"Uncommon Gloves","type":"Equipment","category":"Armor","slot":"Gloves","rarity":"Uncommon","stackSize":1,"sellPrice":10,"asset":"assets/items/imported/armor/gloves/uncommon/it-1018_gloves_uncommon.png","status":"placeholder-art"},{"id":"IT-1019","name":"Common Helm","type":"Equipment","category":"Armor","slot":"Helm","rarity":"Common","stackSize":1,"sellPrice":5,"asset":"assets/items/imported/armor/helm/common/it-1019_helm_common.png","status":"placeholder-art"},{"id":"IT-1020","name":"Epic Helm","type":"Equipment","category":"Armor","slot":"Helm","rarity":"Epic","stackSize":1,"sellPrice":40,"asset":"assets/items/imported/armor/helm/epic/it-1020_helm_epic.png","status":"placeholder-art"},{"id":"IT-1021","name":"Legendary Helm","type":"Equipment","category":"Armor","slot":"Helm","rarity":"Legendary","stackSize":1,"sellPrice":80,"asset":"assets/items/imported/armor/helm/legendary/it-1021_helm_legendary.png","status":"placeholder-art"},{"id":"IT-1022","name":"Mythic Helm","type":"Equipment","category":"Armor","slot":"Helm","rarity":"Mythic","stackSize":1,"sellPrice":160,"asset":"assets/items/imported/armor/helm/mythic/it-1022_helm_mythic.png","status":"placeholder-art"},{"id":"IT-1023","name":"Rare Helm","type":"Equipment","category":"Armor","slot":"Helm","rarity":"Rare","stackSize":1,"sellPrice":20,"asset":"assets/items/imported/armor/helm/rare/it-1023_helm_rare.png","status":"placeholder-art"},{"id":"IT-1024","name":"Uncommon Helm","type":"Equipment","category":"Armor","slot":"Helm","rarity":"Uncommon","stackSize":1,"sellPrice":10,"asset":"assets/items/imported/armor/helm/uncommon/it-1024_helm_uncommon.png","status":"placeholder-art"},{"id":"IT-1025","name":"Common Legs","type":"Equipment","category":"Armor","slot":"Legs","rarity":"Common","stackSize":1,"sellPrice":5,"asset":"assets/items/imported/armor/legs/common/it-1025_legs_common.png","status":"placeholder-art"},{"id":"IT-1026","name":"Epic Legs","type":"Equipment","category":"Armor","slot":"Legs","rarity":"Epic","stackSize":1,"sellPrice":40,"asset":"assets/items/imported/armor/legs/epic/it-1026_legs_epic.png","status":"placeholder-art"},{"id":"IT-1027","name":"Legendary Legs","type":"Equipment","category":"Armor","slot":"Legs","rarity":"Legendary","stackSize":1,"sellPrice":80,"asset":"assets/items/imported/armor/legs/legendary/it-1027_legs_legendary.png","status":"placeholder-art"},{"id":"IT-1028","name":"Mythic Legs","type":"Equipment","category":"Armor","slot":"Legs","rarity":"Mythic","stackSize":1,"sellPrice":160,"asset":"assets/items/imported/armor/legs/mythic/it-1028_legs_mythic.png","status":"placeholder-art"},{"id":"IT-1029","name":"Rare Legs","type":"Equipment","category":"Armor","slot":"Legs","rarity":"Rare","stackSize":1,"sellPrice":20,"asset":"assets/items/imported/armor/legs/rare/it-1029_legs_rare.png","status":"placeholder-art"},{"id":"IT-1030","name":"Uncommon Legs","type":"Equipment","category":"Armor","slot":"Legs","rarity":"Uncommon","stackSize":1,"sellPrice":10,"asset":"assets/items/imported/armor/legs/uncommon/it-1030_legs_uncommon.png","status":"placeholder-art"},{"id":"IT-1031","name":"Common Neckless","type":"Equipment","category":"Armor","slot":"Neckless","rarity":"Common","stackSize":1,"sellPrice":5,"asset":"assets/items/imported/armor/neckless/common/it-1031_neckless_common.png","status":"placeholder-art"},{"id":"IT-1032","name":"Epic Neckless","type":"Equipment","category":"Armor","slot":"Neckless","rarity":"Epic","stackSize":1,"sellPrice":40,"asset":"assets/items/imported/armor/neckless/epic/it-1032_neckless_epic.png","status":"placeholder-art"},{"id":"IT-1033","name":"Legendary Neckless","type":"Equipment","category":"Armor","slot":"Neckless","rarity":"Legendary","stackSize":1,"sellPrice":80,"asset":"assets/items/imported/armor/neckless/legendary/it-1033_neckless_legendary.png","status":"placeholder-art"},{"id":"IT-1034","name":"Mythic Neckless","type":"Equipment","category":"Armor","slot":"Neckless","rarity":"Mythic","stackSize":1,"sellPrice":160,"asset":"assets/items/imported/armor/neckless/mythic/it-1034_neckless_mythic.png","status":"placeholder-art"},{"id":"IT-1035","name":"Rare Neckless","type":"Equipment","category":"Armor","slot":"Neckless","rarity":"Rare","stackSize":1,"sellPrice":20,"asset":"assets/items/imported/armor/neckless/rare/it-1035_neckless_rare.png","status":"placeholder-art"},{"id":"IT-1036","name":"Uncommon Neckless","type":"Equipment","category":"Armor","slot":"Neckless","rarity":"Uncommon","stackSize":1,"sellPrice":10,"asset":"assets/items/imported/armor/neckless/uncommon/it-1036_neckless_uncommon.png","status":"placeholder-art"},{"id":"IT-1037","name":"Common Ring","type":"Equipment","category":"Armor","slot":"Ring","rarity":"Common","stackSize":1,"sellPrice":5,"asset":"assets/items/imported/armor/ring/common/it-1037_ring_common.png","status":"placeholder-art"},{"id":"IT-1038","name":"Epic Ring","type":"Equipment","category":"Armor","slot":"Ring","rarity":"Epic","stackSize":1,"sellPrice":40,"asset":"assets/items/imported/armor/ring/epic/it-1038_ring_epic.png","status":"placeholder-art"},{"id":"IT-1039","name":"Legendary Ring","type":"Equipment","category":"Armor","slot":"Ring","rarity":"Legendary","stackSize":1,"sellPrice":80,"asset":"assets/items/imported/armor/ring/legendary/it-1039_ring_legendary.png","status":"placeholder-art"},{"id":"IT-1040","name":"Mythic Ring","type":"Equipment","category":"Armor","slot":"Ring","rarity":"Mythic","stackSize":1,"sellPrice":160,"asset":"assets/items/imported/armor/ring/mythic/it-1040_ring_mythic.png","status":"placeholder-art"},{"id":"IT-1041","name":"Rare Ring","type":"Equipment","category":"Armor","slot":"Ring","rarity":"Rare","stackSize":1,"sellPrice":20,"asset":"assets/items/imported/armor/ring/rare/it-1041_ring_rare.png","status":"placeholder-art"},{"id":"IT-1042","name":"Uncommon Ring","type":"Equipment","category":"Armor","slot":"Ring","rarity":"Uncommon","stackSize":1,"sellPrice":10,"asset":"assets/items/imported/armor/ring/uncommon/it-1042_ring_uncommon.png","status":"placeholder-art"},{"id":"IT-1043","name":"Vector Cell","type":"Consumable","category":"Energy","slot":"Quick Use","rarity":"Common","stackSize":99,"sellPrice":10,"asset":"assets/items/imported/consumables/consumables/common/it-1043_vector_cell.png","status":"production-art","desc":"Vector Cell energy capsule. Restores EP during fights or exploration."},{"id":"IT-1044","name":"Ashthorn Dagger","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Common","stackSize":1,"sellPrice":5,"asset":"assets/items/imported/weapons/weapons/common/it-1044_ashthorn_dagger.png","status":"production-art"},{"id":"IT-1045","name":"Blightweave Staff","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Common","stackSize":1,"sellPrice":5,"asset":"assets/items/imported/weapons/weapons/common/it-1045_blightweave_staff.png","status":"production-art"},{"id":"IT-1046","name":"Bloodrot Sword","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Common","stackSize":1,"sellPrice":5,"asset":"assets/items/imported/weapons/weapons/common/it-1046_bloodrot_sword.png","status":"production-art"},{"id":"IT-1047","name":"Cinderbite Dagger","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Common","stackSize":1,"sellPrice":5,"asset":"assets/items/imported/weapons/weapons/common/it-1047_cinderbite_dagger.png","status":"production-art"},{"id":"IT-1048","name":"Deathbloom Staff","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Common","stackSize":1,"sellPrice":5,"asset":"assets/items/imported/weapons/weapons/common/it-1048_deathbloom_staff.png","status":"production-art"},{"id":"IT-1049","name":"Duskbranch Staff","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Common","stackSize":1,"sellPrice":5,"asset":"assets/items/imported/weapons/weapons/common/it-1049_duskbranch_staff.png","status":"production-art"},{"id":"IT-1050","name":"Duskfang Blade","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Common","stackSize":1,"sellPrice":5,"asset":"assets/items/imported/weapons/weapons/common/it-1050_duskfang_blade.png","status":"production-art"},{"id":"IT-1051","name":"Embercrack Axe","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Common","stackSize":1,"sellPrice":5,"asset":"assets/items/imported/weapons/weapons/common/it-1051_embercrack_axe.png","status":"production-art"},{"id":"IT-1052","name":"Frostbite Blade","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Common","stackSize":1,"sellPrice":5,"asset":"assets/items/imported/weapons/weapons/common/it-1052_frostbite_blade.png","status":"production-art"},{"id":"IT-1053","name":"Gloomroot Bow","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Common","stackSize":1,"sellPrice":5,"asset":"assets/items/imported/weapons/weapons/common/it-1053_gloomroot_bow.png","status":"production-art"},{"id":"IT-1054","name":"Gloomspire Scepter","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Common","stackSize":1,"sellPrice":5,"asset":"assets/items/imported/weapons/weapons/common/it-1054_gloomspire_scepter.png","status":"production-art"},{"id":"IT-1055","name":"Gravemarrow Spear","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Common","stackSize":1,"sellPrice":5,"asset":"assets/items/imported/weapons/weapons/common/it-1055_gravemarrow_spear.png","status":"production-art"},{"id":"IT-1056","name":"Gravethorn Warblade","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Common","stackSize":1,"sellPrice":5,"asset":"assets/items/imported/weapons/weapons/common/it-1056_gravethorn_warblade.png","status":"production-art"},{"id":"IT-1057","name":"Marshfang Dagger","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Common","stackSize":1,"sellPrice":5,"asset":"assets/items/imported/weapons/weapons/common/it-1057_marshfang_dagger.png","status":"production-art"},{"id":"IT-1058","name":"Mirefang Spear","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Common","stackSize":1,"sellPrice":5,"asset":"assets/items/imported/weapons/weapons/common/it-1058_mirefang_spear.png","status":"production-art"},{"id":"IT-1059","name":"Mirewood Staff","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Common","stackSize":1,"sellPrice":5,"asset":"assets/items/imported/weapons/weapons/common/it-1059_mirewood_staff.png","status":"production-art"},{"id":"IT-1060","name":"Nightthorn Bow","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Common","stackSize":1,"sellPrice":5,"asset":"assets/items/imported/weapons/weapons/common/it-1060_nightthorn_bow.png","status":"production-art"},{"id":"IT-1061","name":"Plaguefang Claw","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Common","stackSize":1,"sellPrice":5,"asset":"assets/items/imported/weapons/weapons/common/it-1061_plaguefang_claw.png","status":"production-art"},{"id":"IT-1062","name":"Shardstone Mace","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Common","stackSize":1,"sellPrice":5,"asset":"assets/items/imported/weapons/weapons/common/it-1062_shardstone_mace.png","status":"production-art"},{"id":"IT-1063","name":"Smogcoil Whip","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Common","stackSize":1,"sellPrice":5,"asset":"assets/items/imported/weapons/weapons/common/it-1063_smogcoil_whip.png","status":"production-art"},{"id":"IT-1064","name":"Sootveil Blade","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Common","stackSize":1,"sellPrice":5,"asset":"assets/items/imported/weapons/weapons/common/it-1064_sootveil_blade.png","status":"production-art"},{"id":"IT-1065","name":"Soulshard Wand","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Common","stackSize":1,"sellPrice":5,"asset":"assets/items/imported/weapons/weapons/common/it-1065_soulshard_wand.png","status":"production-art"},{"id":"IT-1066","name":"Soulspike Dagger","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Common","stackSize":1,"sellPrice":5,"asset":"assets/items/imported/weapons/weapons/common/it-1066_soulspike_dagger.png","status":"production-art"},{"id":"IT-1067","name":"Thornrend Axe","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Common","stackSize":1,"sellPrice":5,"asset":"assets/items/imported/weapons/weapons/common/it-1067_thornrend_axe.png","status":"production-art"},{"id":"IT-1068","name":"Thornslicer Saber","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Common","stackSize":1,"sellPrice":5,"asset":"assets/items/imported/weapons/weapons/common/it-1068_thornslicer_saber.png","status":"production-art"},{"id":"IT-1069","name":"Bloodshard Warhammer","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Epic","stackSize":1,"sellPrice":40,"asset":"assets/items/imported/weapons/weapons/epic/it-1069_bloodshard_warhammer.png","status":"production-art"},{"id":"IT-1070","name":"Duskdrift Longbow","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Epic","stackSize":1,"sellPrice":40,"asset":"assets/items/imported/weapons/weapons/epic/it-1070_duskdrift_longbow.png","status":"production-art"},{"id":"IT-1071","name":"Duskspire Catalyst","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Epic","stackSize":1,"sellPrice":40,"asset":"assets/items/imported/weapons/weapons/epic/it-1071_duskspire_catalyst.png","status":"production-art"},{"id":"IT-1072","name":"Emberwrath Crossbow","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Epic","stackSize":1,"sellPrice":40,"asset":"assets/items/imported/weapons/weapons/epic/it-1072_emberwrath_crossbow.png","status":"production-art"},{"id":"IT-1073","name":"Gloomthorn Warblade","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Epic","stackSize":1,"sellPrice":40,"asset":"assets/items/imported/weapons/weapons/epic/it-1073_gloomthorn_warblade.png","status":"production-art"},{"id":"IT-1074","name":"Gravetide Pike","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Epic","stackSize":1,"sellPrice":40,"asset":"assets/items/imported/weapons/weapons/epic/it-1074_gravetide_pike.png","status":"production-art"},{"id":"IT-1075","name":"Mirethorn Greatblade","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Epic","stackSize":1,"sellPrice":40,"asset":"assets/items/imported/weapons/weapons/epic/it-1075_mirethorn_greatblade.png","status":"production-art"},{"id":"IT-1076","name":"Plaguewrought Glaive","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Epic","stackSize":1,"sellPrice":40,"asset":"assets/items/imported/weapons/weapons/epic/it-1076_plaguewrought_glaive.png","status":"production-art"},{"id":"IT-1077","name":"Shardrift Longspear","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Epic","stackSize":1,"sellPrice":40,"asset":"assets/items/imported/weapons/weapons/epic/it-1077_shardrift_longspear.png","status":"production-art"},{"id":"IT-1078","name":"Soulflare Bow","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Epic","stackSize":1,"sellPrice":40,"asset":"assets/items/imported/weapons/weapons/epic/it-1078_soulflare_bow.png","status":"production-art"},{"id":"IT-1079","name":"Soulreaver Scythe","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Epic","stackSize":1,"sellPrice":40,"asset":"assets/items/imported/weapons/weapons/epic/it-1079_soulreaver_scythe.png","status":"production-art"},{"id":"IT-1080","name":"Soulshatter Claws","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Epic","stackSize":1,"sellPrice":40,"asset":"assets/items/imported/weapons/weapons/epic/it-1080_soulshatter_claws.png","status":"production-art"},{"id":"IT-1081","name":"Venomspire Spear","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Epic","stackSize":1,"sellPrice":40,"asset":"assets/items/imported/weapons/weapons/epic/it-1081_venomspire_spear.png","status":"production-art"},{"id":"IT-1082","name":"Voidcarver Blade","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Epic","stackSize":1,"sellPrice":40,"asset":"assets/items/imported/weapons/weapons/epic/it-1082_voidcarver_blade.png","status":"production-art"},{"id":"IT-1083","name":"Wraithvine Staff","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Epic","stackSize":1,"sellPrice":40,"asset":"assets/items/imported/weapons/weapons/epic/it-1083_wraithvine_staff.png","status":"production-art"},{"id":"IT-1084","name":"Ashvenom Saber","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Legendary","stackSize":1,"sellPrice":80,"asset":"assets/items/imported/weapons/weapons/legendary/it-1084_ashvenom_saber.png","status":"production-art"},{"id":"IT-1085","name":"Bloodspire Blade","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Legendary","stackSize":1,"sellPrice":80,"asset":"assets/items/imported/weapons/weapons/legendary/it-1085_bloodspire_blade.png","status":"production-art"},{"id":"IT-1086","name":"Duskfang Scythe","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Legendary","stackSize":1,"sellPrice":80,"asset":"assets/items/imported/weapons/weapons/legendary/it-1086_duskfang_scythe.png","status":"production-art"},{"id":"IT-1087","name":"Duskthorn Pike","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Legendary","stackSize":1,"sellPrice":80,"asset":"assets/items/imported/weapons/weapons/legendary/it-1087_duskthorn_pike.png","status":"production-art"},{"id":"IT-1088","name":"Gravemarrow Halberd","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Legendary","stackSize":1,"sellPrice":80,"asset":"assets/items/imported/weapons/weapons/legendary/it-1088_gravemarrow_halberd.png","status":"production-art"},{"id":"IT-1089","name":"Soulforge Staff","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Legendary","stackSize":1,"sellPrice":80,"asset":"assets/items/imported/weapons/weapons/legendary/it-1089_soulforge_staff.png","status":"production-art"},{"id":"IT-1090","name":"Soulrend Longbow","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Legendary","stackSize":1,"sellPrice":80,"asset":"assets/items/imported/weapons/weapons/legendary/it-1090_soulrend_longbow.png","status":"production-art"},{"id":"IT-1091","name":"Voidheart Greataxe","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Legendary","stackSize":1,"sellPrice":80,"asset":"assets/items/imported/weapons/weapons/legendary/it-1091_voidheart_greataxe.png","status":"production-art"},{"id":"IT-1092","name":"Voidlash Crossbow","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Legendary","stackSize":1,"sellPrice":80,"asset":"assets/items/imported/weapons/weapons/legendary/it-1092_voidlash_crossbow.png","status":"production-art"},{"id":"IT-1093","name":"Wraithbound Blades","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Legendary","stackSize":1,"sellPrice":80,"asset":"assets/items/imported/weapons/weapons/legendary/it-1093_wraithbound_blades.png","status":"production-art"},{"id":"IT-1094","name":"Ashbreaker Pike","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Mythic","stackSize":1,"sellPrice":160,"asset":"assets/items/imported/weapons/weapons/mythic/it-1094_ashbreaker_pike.png","status":"production-art"},{"id":"IT-1095","name":"Duskveil Longbow","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Mythic","stackSize":1,"sellPrice":160,"asset":"assets/items/imported/weapons/weapons/mythic/it-1095_duskveil_longbow.png","status":"production-art"},{"id":"IT-1096","name":"Gravemind Scepter","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Mythic","stackSize":1,"sellPrice":160,"asset":"assets/items/imported/weapons/weapons/mythic/it-1096_gravemind_scepter.png","status":"production-art"},{"id":"IT-1097","name":"Shardking Blade","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Mythic","stackSize":1,"sellPrice":160,"asset":"assets/items/imported/weapons/weapons/mythic/it-1097_shardking_blade.png","status":"production-art"},{"id":"IT-1098","name":"Smolderthorn Glaive","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Mythic","stackSize":1,"sellPrice":160,"asset":"assets/items/imported/weapons/weapons/mythic/it-1098_smolderthorn_glaive.png","status":"production-art"},{"id":"IT-1099","name":"Soulreign Bow","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Mythic","stackSize":1,"sellPrice":160,"asset":"assets/items/imported/weapons/weapons/mythic/it-1099_soulreign_bow.png","status":"production-art"},{"id":"IT-1100","name":"Soulshatter Greatblade","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Mythic","stackSize":1,"sellPrice":160,"asset":"assets/items/imported/weapons/weapons/mythic/it-1100_soulshatter_greatblade.png","status":"production-art"},{"id":"IT-1101","name":"Voidborne Scythe","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Mythic","stackSize":1,"sellPrice":160,"asset":"assets/items/imported/weapons/weapons/mythic/it-1101_voidborne_scythe.png","status":"production-art"},{"id":"IT-1102","name":"Voidrend Warhammer","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Mythic","stackSize":1,"sellPrice":160,"asset":"assets/items/imported/weapons/weapons/mythic/it-1102_voidrend_warhammer.png","status":"production-art"},{"id":"IT-1103","name":"Wraithforged Twinblades","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Mythic","stackSize":1,"sellPrice":160,"asset":"assets/items/imported/weapons/weapons/mythic/it-1103_wraithforged_twinblades.png","status":"production-art"},{"id":"IT-1104","name":"Ashdrift Longspear","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Rare","stackSize":1,"sellPrice":20,"asset":"assets/items/imported/weapons/weapons/rare/it-1104_ashdrift_longspear.png","status":"production-art"},{"id":"IT-1105","name":"Ashgloom Warblade","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Rare","stackSize":1,"sellPrice":20,"asset":"assets/items/imported/weapons/weapons/rare/it-1105_ashgloom_warblade.png","status":"production-art"},{"id":"IT-1106","name":"Bloodcurse Wand","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Rare","stackSize":1,"sellPrice":20,"asset":"assets/items/imported/weapons/weapons/rare/it-1106_bloodcurse_wand.png","status":"production-art"},{"id":"IT-1107","name":"Bloodveil Greataxe","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Rare","stackSize":1,"sellPrice":20,"asset":"assets/items/imported/weapons/weapons/rare/it-1107_bloodveil_greataxe.png","status":"production-art"},{"id":"IT-1108","name":"Duskhowl Blade","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Rare","stackSize":1,"sellPrice":20,"asset":"assets/items/imported/weapons/weapons/rare/it-1108_duskhowl_blade.png","status":"production-art"},{"id":"IT-1109","name":"Duskshard Glaive","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Rare","stackSize":1,"sellPrice":20,"asset":"assets/items/imported/weapons/weapons/rare/it-1109_duskshard_glaive.png","status":"production-art"},{"id":"IT-1110","name":"Duskthorn Longbow","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Rare","stackSize":1,"sellPrice":20,"asset":"assets/items/imported/weapons/weapons/rare/it-1110_duskthorn_longbow.png","status":"production-art"},{"id":"IT-1111","name":"Embershard Crossbow","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Rare","stackSize":1,"sellPrice":20,"asset":"assets/items/imported/weapons/weapons/rare/it-1111_embershard_crossbow.png","status":"production-art"},{"id":"IT-1112","name":"Gravemist Scythe","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Rare","stackSize":1,"sellPrice":20,"asset":"assets/items/imported/weapons/weapons/rare/it-1112_gravemist_scythe.png","status":"production-art"},{"id":"IT-1113","name":"Gravethorn Cleaver","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Rare","stackSize":1,"sellPrice":20,"asset":"assets/items/imported/weapons/weapons/rare/it-1113_gravethorn_cleaver.png","status":"production-art"},{"id":"IT-1114","name":"Mirefang Longsword","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Rare","stackSize":1,"sellPrice":20,"asset":"assets/items/imported/weapons/weapons/rare/it-1114_mirefang_longsword.png","status":"production-art"},{"id":"IT-1115","name":"Rotfang Claws","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Rare","stackSize":1,"sellPrice":20,"asset":"assets/items/imported/weapons/weapons/rare/it-1115_rotfang_claws.png","status":"production-art"},{"id":"IT-1116","name":"Shatterspike Blade","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Rare","stackSize":1,"sellPrice":20,"asset":"assets/items/imported/weapons/weapons/rare/it-1116_shatterspike_blade.png","status":"production-art"},{"id":"IT-1117","name":"Soulbind Bow","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Rare","stackSize":1,"sellPrice":20,"asset":"assets/items/imported/weapons/weapons/rare/it-1117_soulbind_bow.png","status":"production-art"},{"id":"IT-1118","name":"Soulpiercer Longbow","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Rare","stackSize":1,"sellPrice":20,"asset":"assets/items/imported/weapons/weapons/rare/it-1118_soulpiercer_longbow.png","status":"production-art"},{"id":"IT-1119","name":"Soulshard Catalyst","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Rare","stackSize":1,"sellPrice":20,"asset":"assets/items/imported/weapons/weapons/rare/it-1119_soulshard_catalyst.png","status":"production-art"},{"id":"IT-1120","name":"Venomspire Pike","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Rare","stackSize":1,"sellPrice":20,"asset":"assets/items/imported/weapons/weapons/rare/it-1120_venomspire_pike.png","status":"production-art"},{"id":"IT-1121","name":"Venomthorn Saber","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Rare","stackSize":1,"sellPrice":20,"asset":"assets/items/imported/weapons/weapons/rare/it-1121_venomthorn_saber.png","status":"production-art"},{"id":"IT-1122","name":"Voidreaver Blade","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Rare","stackSize":1,"sellPrice":20,"asset":"assets/items/imported/weapons/weapons/rare/it-1122_voidreaver_blade.png","status":"production-art"},{"id":"IT-1123","name":"Wraithbone Staff","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Rare","stackSize":1,"sellPrice":20,"asset":"assets/items/imported/weapons/weapons/rare/it-1123_wraithbone_staff.png","status":"production-art"},{"id":"IT-1124","name":"Ashwrought Greataxe","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Uncommon","stackSize":1,"sellPrice":10,"asset":"assets/items/imported/weapons/weapons/uncommon/it-1124_ashwrought_greataxe.png","status":"production-art"},{"id":"IT-1125","name":"Blightthorn Bow","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Uncommon","stackSize":1,"sellPrice":10,"asset":"assets/items/imported/weapons/weapons/uncommon/it-1125_blightthorn_bow.png","status":"production-art"},{"id":"IT-1126","name":"Bloodthorn Longbow","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Uncommon","stackSize":1,"sellPrice":10,"asset":"assets/items/imported/weapons/weapons/uncommon/it-1126_bloodthorn_longbow.png","status":"production-art"},{"id":"IT-1127","name":"Cinderspine Crossbow","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Uncommon","stackSize":1,"sellPrice":10,"asset":"assets/items/imported/weapons/weapons/uncommon/it-1127_cinderspine_crossbow.png","status":"production-art"},{"id":"IT-1128","name":"Cryptvine Bow","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Uncommon","stackSize":1,"sellPrice":10,"asset":"assets/items/imported/weapons/weapons/uncommon/it-1128_cryptvine_bow.png","status":"production-art"},{"id":"IT-1129","name":"Duskchill Knife","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Uncommon","stackSize":1,"sellPrice":10,"asset":"assets/items/imported/weapons/weapons/uncommon/it-1129_duskchill_knife.png","status":"production-art"},{"id":"IT-1130","name":"Duskroot Wand","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Uncommon","stackSize":1,"sellPrice":10,"asset":"assets/items/imported/weapons/weapons/uncommon/it-1130_duskroot_wand.png","status":"production-art"},{"id":"IT-1131","name":"Duskveil Glaive","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Uncommon","stackSize":1,"sellPrice":10,"asset":"assets/items/imported/weapons/weapons/uncommon/it-1131_duskveil_glaive.png","status":"production-art"},{"id":"IT-1132","name":"Emberfang Dagger","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Uncommon","stackSize":1,"sellPrice":10,"asset":"assets/items/imported/weapons/weapons/uncommon/it-1132_emberfang_dagger.png","status":"production-art"},{"id":"IT-1133","name":"Gravemind Flail","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Uncommon","stackSize":1,"sellPrice":10,"asset":"assets/items/imported/weapons/weapons/uncommon/it-1133_gravemind_flail.png","status":"production-art"},{"id":"IT-1134","name":"Gravetide Mace","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Uncommon","stackSize":1,"sellPrice":10,"asset":"assets/items/imported/weapons/weapons/uncommon/it-1134_gravetide_mace.png","status":"production-art"},{"id":"IT-1135","name":"Marrowshard Blade","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Uncommon","stackSize":1,"sellPrice":10,"asset":"assets/items/imported/weapons/weapons/uncommon/it-1135_marrowshard_blade.png","status":"production-art"},{"id":"IT-1136","name":"Mirethorn Longbow","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Uncommon","stackSize":1,"sellPrice":10,"asset":"assets/items/imported/weapons/weapons/uncommon/it-1136_mirethorn_longbow.png","status":"production-art"},{"id":"IT-1137","name":"Mireweaver Staff","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Uncommon","stackSize":1,"sellPrice":10,"asset":"assets/items/imported/weapons/weapons/uncommon/it-1137_mireweaver_staff.png","status":"production-art"},{"id":"IT-1138","name":"Plaguebite Axe","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Uncommon","stackSize":1,"sellPrice":10,"asset":"assets/items/imported/weapons/weapons/uncommon/it-1138_plaguebite_axe.png","status":"production-art"},{"id":"IT-1139","name":"Shardfang Rapier","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Uncommon","stackSize":1,"sellPrice":10,"asset":"assets/items/imported/weapons/weapons/uncommon/it-1139_shardfang_rapier.png","status":"production-art"},{"id":"IT-1140","name":"Sootcrack Warhammer","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Uncommon","stackSize":1,"sellPrice":10,"asset":"assets/items/imported/weapons/weapons/uncommon/it-1140_sootcrack_warhammer.png","status":"production-art"},{"id":"IT-1141","name":"Thornpierce Lance","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Uncommon","stackSize":1,"sellPrice":10,"asset":"assets/items/imported/weapons/weapons/uncommon/it-1141_thornpierce_lance.png","status":"production-art"},{"id":"IT-1142","name":"Voidpiercer Spear","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Uncommon","stackSize":1,"sellPrice":10,"asset":"assets/items/imported/weapons/weapons/uncommon/it-1142_voidpiercer_spear.png","status":"production-art"},{"id":"IT-1143","name":"Voidwhisper Staff","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Uncommon","stackSize":1,"sellPrice":10,"asset":"assets/items/imported/weapons/weapons/uncommon/it-1143_voidwhisper_staff.png","status":"production-art"}];



  // v65: Equipment, drops, vendor/crafting, and operator shard sync.
  const EQUIPMENT_SLOTS = ['Weapon','Helmet','Chest','Legs','Gloves','Boots','Cape','Ring','Core','Relic'];
  const SLOT_LABELS = {Weapon:'Weapon',Helmet:'Helmet',Chest:'Chest',Legs:'Legs',Gloves:'Gloves',Boots:'Boots',Cape:'Cape',Ring:'Ring',Core:'Core',Relic:'Relic'};
  const RARITY_POWER = {Common:1,Uncommon:2,Rare:4,Epic:7,Legendary:11,Mythic:16,Relic:20,Singularity:26};
  const SHOP_STOCK = [
    {name:'Med Patch', price:18, qty:1, label:'Buy Med Patch'},
    {name:'Vector Cell', price:20, qty:1, label:'Buy Vector Cell'},
    {name:'Vector Training Blade', price:45, qty:1, label:'Buy Training Blade'},
    {name:'Sewer Guard Vest', price:40, qty:1, label:'Buy Guard Vest'}
  ];
  const CRAFTING_RECIPES = [
    {id:'rustcore_blade', name:'Rustcore Blade', makes:'Rustcore Blade', cost:{'Scrap Metal':6,'Rust Core':1,'Corrupted Catalyst':1}, credits:35},
    {id:'catalyst_core', name:'Catalyst Core', makes:'Catalyst Core', cost:{'Scrap Metal':10,'Rust Core':2,'Corrupted Catalyst':2}, credits:70},
    {id:'ash_plated_blade', name:'Ash-Plated Blade', makes:'Ash-Plated Blade', cost:{'Burnt Alloy':4,'Scrap Metal':8,'Rust Core':1}, credits:70},
    {id:'wasteland_helm', name:'Wasteland Guard Helm', makes:'Wasteland Guard Helm', cost:{'Burnt Alloy':3,'Outpost Access Chip':1}, credits:60}
  ];
  function createEmptyEquipment(){ const o={}; EQUIPMENT_SLOTS.forEach(s=>o[s]=null); return o; }
  function normalizeEquipSlot(slot, itemType=''){
    const s=String(slot||itemType||'').toLowerCase();
    if(s.includes('weapon')) return 'Weapon';
    if(s.includes('helm')) return 'Helmet';
    if(s.includes('chest')) return 'Chest';
    if(s.includes('leg')) return 'Legs';
    if(s.includes('glove')) return 'Gloves';
    if(s.includes('boot')) return 'Boots';
    if(s.includes('cape')) return 'Cape';
    if(s.includes('ring')) return 'Ring';
    if(s.includes('core')) return 'Core';
    if(s.includes('relic') || s.includes('neck')) return 'Relic';
    return '';
  }
  function isEquipmentLike(item){ return !!normalizeEquipSlot(item?.slot, item?.type) || item?.type === 'Weapon' || item?.type === 'Equipment'; }
  function rarityPower(r){ return RARITY_POWER[r] || 1; }
  function generatedGearStats(item){
    const slot=normalizeEquipSlot(item.slot, item.type);
    if(!slot) return {};
    const p=rarityPower(item.rarity);
    if(slot==='Weapon') return {atk:2+p*2, str:Math.max(1,Math.floor(p/2)), crit:Math.min(.12, p*.006)};
    if(slot==='Core') return {atk:Math.ceil(p/2), def:Math.ceil(p/2), hp:6+p*3, ep:4+p*2};
    if(slot==='Ring' || slot==='Relic') return {atk:Math.ceil(p/2), ep:5+p*2, crit:Math.min(.09, p*.005), xpBonus:Math.min(.12, p*.006)};
    if(slot==='Cape') return {def:Math.ceil(p/2), hp:5+p*3, ep:p};
    return {def:1+p, hp:4+p*4};
  }
  function gearLevelReq(item){
    if(item.levelReq) return item.levelReq;
    const r=String(item.rarity||'Common');
    return ({Common:1,Uncommon:2,Rare:4,Epic:7,Legendary:10,Mythic:15,Relic:20,Singularity:30}[r] || 1);
  }
  function statSummary(stats={}){
    const parts=[];
    [['atk','ATK'],['str','STR'],['def','DEF'],['hp','HP'],['ep','EP']].forEach(([k,l])=>{ if(stats[k]) parts.push(`+${stats[k]} ${l}`); });
    if(stats.crit) parts.push(`+${Math.round(stats.crit*100)}% Crit`);
    if(stats.xpBonus) parts.push(`+${Math.round(stats.xpBonus*100)}% XP`);
    return parts.join(' // ') || 'No stat bonus';
  }
  function ensureEquipment(){
    state.equipment ||= createEmptyEquipment();
    EQUIPMENT_SLOTS.forEach(s=>{ if(!(s in state.equipment)) state.equipment[s]=null; });
    state.operatorSyncRank ||= 0;
    state.unlockedOperators ||= {vyra:true};
    state.inventory ||= {};
    if(!state._v65StarterGear){
      if(!state.inventory['Vector Training Blade']) state.inventory['Vector Training Blade']=1;
      if(!state.inventory['Sewer Guard Vest']) state.inventory['Sewer Guard Vest']=1;
      state.equipment.Weapon ||= 'Vector Training Blade';
      state.equipment.Chest ||= 'Sewer Guard Vest';
      state._v65StarterGear=true;
    }
    // v72: Vector Cell now has final art. Convert any old Bread stacks into Vector Cells.
    if(state.inventory['Bread']){
      state.inventory['Vector Cell'] = (state.inventory['Vector Cell'] || 0) + state.inventory['Bread'];
      delete state.inventory['Bread'];
    }
    // v70/v71: old saves get starter EP cells once, and new saves include them from newGameState.
    if(!state._v70EnergyCells || !state._v71EnergyCellFix){
      state.inventory['Vector Cell'] = Math.max(state.inventory['Vector Cell'] || 0, 2);
      state._v70EnergyCells = true;
      state._v71EnergyCellFix = true;
    }
  }
  function equippedItems(){ ensureEquipment(); return Object.entries(state.equipment).filter(([,name])=>!!name).map(([slot,name])=>({slot,name,item:findItemRecord(name)})); }
  function equipmentBonuses(){
    ensureEquipment();
    const total={atk:0,str:0,def:0,hp:0,ep:0,crit:0,xpBonus:0};
    equippedItems().forEach(({item})=>{
      const stats=item.stats || generatedGearStats(item);
      Object.keys(total).forEach(k=> total[k] += Number(stats[k]||0));
    });
    const sync=state.operatorSyncRank||0;
    total.atk += sync*2;
    total.def += sync;
    total.hp += sync*8;
    total.ep += sync*3;
    return total;
  }
  function gearPower(){ const b=equipmentBonuses(); return b.atk*3 + b.str*2 + b.def*3 + Math.floor(b.hp/4) + Math.floor(b.ep/3) + Math.round((b.crit+b.xpBonus)*100); }
  function canEquipItem(item){
    const slot=normalizeEquipSlot(item.slot, item.type);
    if(!slot) return {ok:false, reason:'Not equipment'};
    if(state.player.level < gearLevelReq(item)) return {ok:false, reason:`Requires Player Lv. ${gearLevelReq(item)}`};
    return {ok:true, slot};
  }
  function equipItem(name){
    ensureEquipment();
    if(!state.inventory[name]){ toast('You do not own that gear.'); return; }
    const item=findItemRecord(name);
    const check=canEquipItem(item);
    if(!check.ok){ toast(check.reason); return; }
    state.equipment[check.slot]=name;
    syncHpCap();
    log(`Equipped ${name} in ${check.slot}.`);
    save(true); renderAll(); renderInventoryDb(); toast(`Equipped: ${name}`);
  }
  function unequipSlot(slot){
    ensureEquipment();
    if(!state.equipment[slot]) return;
    const old=state.equipment[slot];
    state.equipment[slot]=null;
    syncHpCap();
    log(`Unequipped ${old}.`);
    save(true); renderAll(); renderInventoryDb();
  }
  function gearRegistry(){ return [...coreItemRegistry, ...importedItemRegistry].map(normalizeItem).filter(isEquipmentLike); }
  function pickGearDrop(wasBoss=false){
    const stage=stageDef();
    const pool=gearRegistry().filter(item=>{
      const req=gearLevelReq(item);
      if(req > Math.max(state.player.level+3, stage.levelReq+4)) return false;
      if(!wasBoss && ['Legendary','Mythic','Relic','Singularity'].includes(item.rarity)) return false;
      return true;
    });
    if(!pool.length) return null;
    const roll=Math.random();
    const targetRarity = wasBoss ? (roll<.12?'Legendary':roll<.45?'Epic':'Rare') : (roll<.18?'Rare':roll<.48?'Uncommon':'Common');
    const rarityPool=pool.filter(i=>i.rarity===targetRarity);
    const chosen=(rarityPool.length?rarityPool:pool)[Math.floor(Math.random()*(rarityPool.length?rarityPool.length:pool.length))];
    return chosen;
  }
  function buyShopItem(name){
    const entry=SHOP_STOCK.find(x=>x.name===name); if(!entry) return;
    if(state.player.credits < entry.price){ toast(`Need ${entry.price} credits.`); return; }
    state.player.credits -= entry.price; addItem(entry.name, entry.qty||1); log(`Purchased ${entry.name}.`); save(true); renderAll(); renderInventoryDb();
  }
  function canCraft(recipe){
    const missing=[];
    Object.entries(recipe.cost).forEach(([name,qty])=>{ if((state.inventory[name]||0)<qty) missing.push(`${qty} ${name}`); });
    if(state.player.credits < recipe.credits) missing.push(`${recipe.credits} credits`);
    return missing;
  }
  function craftRecipe(id){
    const r=CRAFTING_RECIPES.find(x=>x.id===id); if(!r) return;
    const missing=canCraft(r);
    if(missing.length){ toast(`Need: ${missing.join(', ')}`); return; }
    Object.entries(r.cost).forEach(([name,qty])=>{ state.inventory[name]-=qty; if(state.inventory[name]<=0) delete state.inventory[name]; });
    state.player.credits -= r.credits;
    addItem(r.makes,1);
    log(`Crafted ${r.makes}.`);
    save(true); renderAll(); renderInventoryDb(); toast(`Crafted: ${r.makes}`);
  }
  function syncVyra(){
    ensureEquipment();
    const cost = 5 + (state.operatorSyncRank||0)*3;
    const owned = state.inventory['Operator Shard: Vyra'] || 0;
    if(state.operatorSyncRank >= 10){ toast('Vyra sync is maxed for this build.'); return; }
    if(owned < cost){ toast(`Need ${cost} Vyra Shards.`); return; }
    state.inventory['Operator Shard: Vyra'] -= cost;
    if(state.inventory['Operator Shard: Vyra'] <= 0) delete state.inventory['Operator Shard: Vyra'];
    state.operatorSyncRank++;
    state.player.hp = Math.min(combatStatBlock().maxHp, state.player.hp + 12);
    log(`Vyra Sync raised to Rank ${state.operatorSyncRank}.`);
    save(true); renderAll(); renderOperatorDb(); toast(`Vyra Sync Rank ${state.operatorSyncRank}`);
  }
  function renderEquipmentPanel(){
    ensureEquipment();
    const rows=EQUIPMENT_SLOTS.map(slot=>{
      const name=state.equipment[slot];
      if(!name) return `<div class="equip-slot empty"><b>${slot}</b><span>Empty</span></div>`;
      const item=findItemRecord(name);
      return `<div class="equip-slot ${rarityClass(item.rarity)}"><b>${slot}</b>${itemIconHtml(item)}<span>${safeHtml(name)}</span><small>${statSummary(item.stats)}</small><button data-unequip-slot="${slot}" onclick="window.AV.unequipSlot('${slot}')">Unequip</button></div>`;
    }).join('');
    const b=equipmentBonuses();
    return `<section class="equipment-panel"><div class="record-kicker">EQUIPPED GEAR</div><h3>Operator Loadout</h3><div class="equipment-grid">${rows}</div><div class="gear-statline">Gear Power ${gearPower()} // Gear: +${b.atk} ATK, +${b.str} STR, +${b.def} DEF, +${b.hp} HP, +${b.ep} EP</div></section>`;
  }
  function renderDropLogPanel(){
    state.dropLog ||= [];
    state.bossKills ||= {};
    const bossRows=Object.entries(STAGE_DEFS).map(([key,d])=>`<div><b>${d.id}</b><span>Boss kills: ${state.bossKills[key]||0} // ${state.stages?.[key]?.complete?'Complete':(state.stages?.[key]?.unlocked?'Unlocked':'Locked')}</span></div>`).join('');
    const drops=state.dropLog.slice(0,8).map(d=>`<div class="drop-log-row ${rarityClass(d.rarity)}"><b>${safeHtml(d.name)}</b><span>${safeHtml(d.rarity||'Drop')} // ${safeHtml(d.source||'Recovered')} // ${safeHtml(d.stage||'F-???')}</span></div>`).join('') || '<div class="drop-log-row"><b>No rare drops yet</b><span>Bosses, gear drops, and stage clears will appear here.</span></div>';
    return `<section class="drop-log-panel"><div class="record-kicker">RARE DROP ARCHIVE</div><h3>Collection Log</h3><div class="protocol-list">${bossRows}</div><div class="drop-log-list">${drops}</div></section>`;
  }
  function renderWorkshopPanel(){
    const shop=SHOP_STOCK.map(s=>`<button onclick="window.AV.buyShopItem('${s.name}')"><b>${s.label}</b><span>${s.price} credits</span></button>`).join('');
    const recipes=CRAFTING_RECIPES.map(r=>`<button onclick="window.AV.craftRecipe('${r.id}')"><b>Craft ${r.name}</b><span>${Object.entries(r.cost).map(([n,q])=>q+' '+n).join(', ')} + ${r.credits} credits</span></button>`).join('');
    return `<section class="workshop-panel"><div class="record-kicker">FIELD VENDOR / CRAFTING</div><h3>Gear Terminal</h3><div class="workshop-grid"><div><b>Vendor</b>${shop}</div><div><b>Crafting</b>${recipes}</div></div></section>`;
  }
  function renderOperatorDb(){
    ensureEquipment();
    const sync=$('operatorSync'); if(sync) sync.textContent=`Rank ${state.operatorSyncRank}/10`;
    const host=document.querySelector('#operatorOverlay .operator-data'); if(!host) return;
    let panel=$('operatorShardPanel');
    if(!panel){ panel=document.createElement('div'); panel.id='operatorShardPanel'; panel.className='operator-shard-panel protocol-list'; host.appendChild(panel); }
    const cost=5+(state.operatorSyncRank||0)*3;
    const owned=state.inventory['Operator Shard: Vyra']||0;
    panel.innerHTML=`<div><b>Shard Sync</b><span>Owned ${owned} // Next rank cost ${cost} shards</span></div><div><b>Rank Bonus</b><span>Each rank adds +2 ATK, +1 DEF, +8 HP, +3 EP.</span></div><button onclick="window.AV.syncVyra()" ${owned<cost?'disabled':''}>Synchronize Vyra</button>`;
  }
  let state = newGameState();
  let battle = null; let camera = {x:0,y:0}; let bootDone=false; let storyActive=false; let pendingStoryAfter=null;
  const images = {};
  function newGameState(){
    const parsed = parseStageMap('f001');
    return {mapVersion:MAP_VERSION, currentStage:'f001', stages:{f001:{unlocked:true,complete:false}, f002:{unlocked:false,complete:false}, f003:{unlocked:false,complete:false}}, map:parsed.map, player:{x:parsed.px,y:parsed.py,facing:'down',level:1,xp:0,nextXp:45,hp:60,maxHp:60,ep:20,maxEp:20,overdrive:0,maxOverdrive:100,atk:10,def:3,credits:0}, inventory:{'Med Patch':2,'Vector Cell':2,'Vector Training Blade':1,'Sewer Guard Vest':1}, equipment:createEmptyEquipment(), operatorSyncRank:0, dropLog:[], bossKills:{}, enemyKills:{}, respawns:{}, contracts:{}, contractHistory:[], contractCounter:0, anomalyResearch:{}, npcTalks:{}, npcRewards:{}, sideQuests:{}, flags:{terminal:false,lore:false,key:false,bossUnlocked:false,bossDefeated:false,chapterComplete:false,chapterRewardsClaimed:false,chapterClearSeen:false,storySeen:{},anomaliesCleared:0,chests:0}, log:['AVOS connection established.'], visited:{[`${parsed.px},${parsed.py}`]:1}, settings:{crt:true,reducedMotion:false,largeText:false,musicVolume:0.58,sfxVolume:0.72,musicMuted:false,sfxMuted:false}, skillData:createSkillData(), combatStyle:'attack', upgrades:{blade:0,armor:0,energy:0,medtech:0}, checkpoint:null, lastSave:Date.now()};
  }
  function loadImages(){
    const paths = [
      'assets/operators/av001/portrait.png',
      'assets/operators/av001/battle.png',
      'assets/operators/av001/sprites/map_sprite.png',
      NPC_DEFS.fermilat.asset,
      ...mapArt.ground,
      ...mapArt.blocked,
      mapArt.chest, mapArt.med, mapArt.lore, mapArt.terminal, mapArt.door, mapArt.exit,
      ...mapArt.props.map(p => p.img),
      ...stageVisualAssetPaths(),
      ...importedAnomalyRoster.slice(0,80).flatMap(c => [c.battle, iconPathFor(c)]),
      ...importedBossRoster.slice(0,20).flatMap(c => [c.battle, iconPathFor(c)])
    ];
    [...new Set(paths)].filter(Boolean).forEach(p=>{
      const im = new Image();
      im.onload = () => renderAll();
      im.onerror = () => console.warn('Missing creature asset:', p);
      im.src = p;
      images[p] = im;
    });
  }
  function save(silent=false){state.lastSave = Date.now(); localStorage.setItem('ashVectorSave', JSON.stringify(state)); if(!silent) toast('Archive saved.'); renderUI();}
  function load(){const s=localStorage.getItem('ashVectorSave'); if(s){state=JSON.parse(s); ensureProgression(); state.dropLog ||= []; state.bossKills ||= {}; state.anomalyResearch ||= {}; state.contracts ||= {}; state.contractHistory ||= []; state.contractCounter ||= 0; state.npcTalks ||= {}; state.npcRewards ||= {}; state.sideQuests ||= {}; ensureContracts(); state.stages ||= {}; Object.keys(STAGE_DEFS).forEach((k,i)=> state.stages[k] ||= {unlocked:i===0,complete:false}); const rebuildRoute=()=>{ const key=state.currentStage||'f001'; const parsed=parseStageMap(key); state.map=parsed.map; state.player.x=parsed.px; state.player.y=parsed.py; state.flags={terminal:false,lore:false,key:false,bossUnlocked:false,bossDefeated:false,chapterComplete:false,chapterRewardsClaimed:false,chapterClearSeen:false,storySeen:{},anomaliesCleared:0,chests:0}; state.visited={[`${parsed.px},${parsed.py}`]:1}; state.checkpoint=null; state.mapVersion=MAP_VERSION; log(`${stageDef(key).id} route rebuilt for v0.9.1 tile floor pass.`); }; if(!state.map || !Array.isArray(state.map)){ const keep={player:state.player,inventory:state.inventory,equipment:state.equipment,operatorSyncRank:state.operatorSyncRank,dropLog:state.dropLog,bossKills:state.bossKills,contracts:state.contracts,contractHistory:state.contractHistory,contractCounter:state.contractCounter,npcTalks:state.npcTalks,npcRewards:state.npcRewards,sideQuests:state.sideQuests,settings:state.settings,skillData:state.skillData,upgrades:state.upgrades,stages:state.stages,currentStage:state.currentStage}; state=newGameState(); Object.assign(state, keep); rebuildRoute(); } else if(state.mapVersion!==MAP_VERSION){ rebuildRoute(); } state.mapVersion=MAP_VERSION; state.lastSave ||= Date.now(); syncHpCap(); unlockNextStages(); toast('Archive loaded.'); applySettings(); renderAll();} else toast('No archive found.');}

  // v85: save slots + export/import backup terminal.
  // This is useful for GitHub Pages/mobile testing because localStorage is device/browser-specific.
  function saveSlotKey(n){ return `ashVectorSave_slot${n}`; }
  function saveSummaryFromData(data){
    const p=data?.player || {};
    const stage=STAGE_DEFS[data?.currentStage || 'f001'] || STAGE_DEFS.f001;
    const when=data?.lastSave ? new Date(data.lastSave).toLocaleString() : 'Never';
    return {level:p.level||1, credits:p.credits||0, stage:stage.id, title:stage.title, when};
  }
  function saveToSlot(n){
    save(true);
    localStorage.setItem(saveSlotKey(n), JSON.stringify(state));
    toast(`Saved to Slot ${n}.`);
    renderSaveHub();
  }
  function loadFromSlot(n){
    const raw=localStorage.getItem(saveSlotKey(n));
    if(!raw){ toast(`Slot ${n} is empty.`); return; }
    localStorage.setItem('ashVectorSave', raw);
    load();
    toast(`Loaded Slot ${n}.`);
    renderSaveHub();
  }
  function deleteSaveSlot(n){
    if(!localStorage.getItem(saveSlotKey(n))){ toast(`Slot ${n} is already empty.`); return; }
    if(!confirm(`Delete save slot ${n}?`)) return;
    localStorage.removeItem(saveSlotKey(n));
    toast(`Slot ${n} deleted.`);
    renderSaveHub();
  }
  function encodeSaveData(data=state){
    return btoa(unescape(encodeURIComponent(JSON.stringify(data))));
  }
  function decodeSaveData(input){
    const raw=String(input||'').trim();
    if(!raw) throw new Error('No save code pasted.');
    if(raw.startsWith('{')) return JSON.parse(raw);
    return JSON.parse(decodeURIComponent(escape(atob(raw))));
  }
  function openSaveCodePanel(mode='export'){
    let panel=$('saveCodeOverlay');
    if(!panel){
      panel=document.createElement('div');
      panel.id='saveCodeOverlay';
      panel.className='overlay save-code-overlay hidden';
      panel.innerHTML=`<div class="database-modal avos-crt save-code-modal"><button id="closeSaveCode" class="modal-close">Close</button><div class="db-header"><div id="saveCodeTitle">SAVE BACKUP</div><div>LOCAL ARCHIVE // v0.8.5</div></div><p id="saveCodeHelp" class="menu-info"></p><textarea id="saveCodeText" spellcheck="false"></textarea><div class="save-code-actions"><button id="copySaveCode">Copy Code</button><button id="importSaveCodeBtn">Import Pasted Save</button></div></div>`;
      document.body.appendChild(panel);
      $('closeSaveCode').onclick=()=>panel.classList.add('hidden');
      $('copySaveCode').onclick=async()=>{ const txt=$('saveCodeText'); txt.select(); try{ await navigator.clipboard.writeText(txt.value); toast('Save code copied.'); }catch(err){ document.execCommand('copy'); toast('Save code selected.'); } };
      $('importSaveCodeBtn').onclick=()=>importSaveCodeFromText();
    }
    if(mode === 'export'){
      save(true);
      $('saveCodeTitle').textContent='EXPORT SAVE BACKUP';
      $('saveCodeHelp').textContent='Copy this code somewhere safe. You can paste it back on another browser/device to restore progress.';
      $('saveCodeText').value=encodeSaveData(state);
      $('copySaveCode').style.display='';
      $('importSaveCodeBtn').style.display='none';
    } else {
      $('saveCodeTitle').textContent='IMPORT SAVE BACKUP';
      $('saveCodeHelp').textContent='Paste a save code or raw save JSON below. Importing replaces the active local save.';
      $('saveCodeText').value='';
      $('copySaveCode').style.display='none';
      $('importSaveCodeBtn').style.display='';
    }
    panel.classList.remove('hidden');
    $('saveCodeText').focus();
  }
  function exportSaveCode(){ openSaveCodePanel('export'); }
  function importSaveCode(){ openSaveCodePanel('import'); }
  function importSaveCodeFromText(){
    try{
      const imported=decodeSaveData($('saveCodeText').value);
      if(!imported || !imported.player) throw new Error('Save data is missing player info.');
      localStorage.setItem('ashVectorSave', JSON.stringify(imported));
      load();
      $('saveCodeOverlay')?.classList.add('hidden');
      toast('Save imported.');
      renderSaveHub();
    }catch(err){ toast(`Import failed: ${err.message || err}`); }
  }
  function renderAudioMixer(){
    const grid=document.querySelector('#configOverlay .fracture-grid');
    if(!grid) return;
    ensureSettings();
    let panel=$('audioMixerPanel');
    if(!panel){
      panel=document.createElement('section');
      panel.id='audioMixerPanel';
      panel.className='fracture-card audio-mixer-panel';
      const savePanel=$('saveHubPanel');
      if(savePanel && savePanel.parentElement === grid) savePanel.insertAdjacentElement('afterend', panel);
      else grid.prepend(panel);
    }
    const musicPct=Math.round((state.settings.musicVolume||0)*100);
    const sfxPct=Math.round((state.settings.sfxVolume||0)*100);
    panel.innerHTML=`<div class="record-kicker">AUDIO MIXER // LOCAL SETTINGS</div><h2>Music + Sound FX</h2><p>Control music and SFX separately. Settings save with the active archive and backup slots.</p><div class="audio-mixer-grid"><label class="audio-row"><span>Music Volume</span><input id="musicVolumeRange" type="range" min="0" max="100" value="${musicPct}"><b>${musicPct}%</b></label><label class="audio-row"><span>SFX Volume</span><input id="sfxVolumeRange" type="range" min="0" max="100" value="${sfxPct}"><b>${sfxPct}%</b></label></div><div class="audio-actions"><button id="musicMuteToggle">${state.settings.musicMuted?'Unmute Music':'Mute Music'}</button><button id="sfxMuteToggle">${state.settings.sfxMuted?'Unmute SFX':'Mute SFX'}</button><button id="testMusicBtn">Test Music</button><button id="testSfxBtn">Test SFX</button></div><p class="fineprint">Browser audio still starts after the first tap/click. The watchdog will keep the selected track alive after unlock.</p>`;
    $('musicVolumeRange').oninput=e=>setAudioSetting('musicVolume', Number(e.target.value)/100);
    $('sfxVolumeRange').oninput=e=>setAudioSetting('sfxVolume', Number(e.target.value)/100);
    $('musicMuteToggle').onclick=()=>setAudioSetting('musicMuted', !state.settings.musicMuted);
    $('sfxMuteToggle').onclick=()=>setAudioSetting('sfxMuted', !state.settings.sfxMuted);
    $('testMusicBtn').onclick=testMusicSetting;
    $('testSfxBtn').onclick=testSfxSetting;
  }

  function renderSaveHub(){
    const grid=document.querySelector('#configOverlay .fracture-grid');
    if(!grid) return;
    let panel=$('saveHubPanel');
    if(!panel){ panel=document.createElement('section'); panel.id='saveHubPanel'; panel.className='fracture-card save-hub-panel'; grid.prepend(panel); }
    const main=saveSummaryFromData(state);
    const slotCards=[1,2,3].map(n=>{
      const raw=localStorage.getItem(saveSlotKey(n));
      let body='Empty slot';
      let extra='';
      if(raw){
        try{ const s=saveSummaryFromData(JSON.parse(raw)); body=`${s.stage} ${s.title} // Player Lv ${s.level} // ${s.credits} Credits`; extra=`<small>Saved ${safeHtml(s.when)}</small>`; }
        catch(err){ body='Corrupted / unreadable slot'; }
      }
      return `<div class="save-slot"><b>Slot ${n}</b><span>${safeHtml(body)}</span>${extra}<div><button onclick="window.AV.saveToSlot(${n})">Save Here</button><button onclick="window.AV.loadFromSlot(${n})" ${raw?'':'disabled'}>Load</button><button onclick="window.AV.deleteSaveSlot(${n})" ${raw?'':'disabled'}>Delete</button></div></div>`;
    }).join('');
    panel.innerHTML=`<div class="record-kicker">ARCHIVE BACKUP TERMINAL</div><h2>Save Slots + Transfer Code</h2><p>Active Save: ${safeHtml(main.stage)} ${safeHtml(main.title)} // Player Lv ${main.level} // ${main.credits} Credits // ${safeHtml(main.when)}</p><div class="save-slot-grid">${slotCards}</div><div class="save-hub-actions"><button onclick="window.AV.exportSaveCode()">Export Save Code</button><button onclick="window.AV.importSaveCode()">Import Save Code</button><button onclick="window.AV.save()">Save Active Archive</button></div><p class="fineprint">Slots and backup codes use browser localStorage. Export a code before clearing cache, switching phones, or testing risky patches.</p>`;
  }
  function log(msg){state.log.unshift(msg); state.log=state.log.slice(0,7); renderUI();}
  function toast(msg){let t=document.createElement('div');t.className='toast';t.textContent=msg;document.body.appendChild(t);setTimeout(()=>t.remove(),1800)}
  function boot(){
    uiState.mode='boot'; AudioManager.play('intro');
    let i=0; const lines=$('bootLines'); const prog=$('bootProgress').firstElementChild;
    function step(){
      if(i<bootLines.length){lines.textContent += '> '+bootLines[i++]+'\n'; prog.style.width=Math.min(100, i/bootLines.length*100)+'%'; setTimeout(step, state.settings.reducedMotion?30:260);} else {$('bootLogo').classList.remove('hidden'); bootDone=true;}}
    step();
  }
  function requestNativeFullscreen(){
    // Browsers only allow true fullscreen after a click/key press.
    // We still force CSS fullscreen immediately, then request native fullscreen when allowed.
    document.body.classList.add('fullscreen-mode');
    try{
      if(!document.fullscreenElement && document.documentElement.requestFullscreen){
        document.documentElement.requestFullscreen().catch(()=>{});
      }
    }catch(err){}
  }
  function showMenu(){hideAll(); uiState.mode='menu'; uiState.returnStack.length=0; document.body.classList.remove('game-active'); document.body.classList.add('fullscreen-mode'); $('mainMenu').classList.remove('hidden'); AudioManager.play('intro');}
  function startGame(fresh=false){if(fresh) state=newGameState(); gameStarted=true; ensureProgression(); if(fresh && !state.checkpoint) setCheckpoint('Fracture Entry'); hideAll(); uiState.mode='game'; uiState.returnStack.length=0; document.body.classList.add('game-active','fullscreen-mode'); document.body.dataset.stage=stageDef().key; ensureFullscreenUi(); ensureMobileActionPad(); setMobilePlayMode(); requestNativeFullscreen(); $('app').classList.remove('hidden'); canvas.focus({preventScroll:true}); renderAll(); AudioManager.play('level1'); if(fresh) setTimeout(()=>showStoryOnce('intro'), 320); else setTimeout(()=>pulseObjective(currentObjectiveText()), 240);}
  function hideAll(){['bootScreen','mainMenu','app'].forEach(id=>$(id)?.classList.add('hidden')); document.querySelectorAll('.overlay').forEach(o=>o.classList.add('hidden')); $('preBattleOverlay')?.classList.add('hidden');}
  function tileAt(x,y){return state.map[y]?.[x] ?? '#';}
  function setTile(x,y,v){if(state.map[y]) state.map[y][x]=v;}
  function isBlocked(c){return c==='#' || c==='D';}
  function tryMove(dx,dy){if(storyActive) return; if(battle) return; state.player.facing = dx>0?'right':dx<0?'left':dy<0?'up':'down'; const nx=state.player.x+dx, ny=state.player.y+dy; const c=tileAt(nx,ny); const npcBlock=npcAt(nx,ny); if(npcBlock){toast('Fermilat is blocking the route. Press E to talk.'); renderAll(); return;} if(isBlocked(c)){if(c==='D') handleDoor(nx,ny); else toast('Blocked.'); renderAll(); return;} state.player.x=nx; state.player.y=ny; SfxManager.step(); state.visited[`${nx},${ny}`]=1; handleTile(c,nx,ny); renderAll(); queueAutosave();}
  function handleDoor(x,y){ if(state.flags.bossUnlocked || state.flags.key || state.flags.anomaliesCleared>=3){setTile(x,y,'.'); state.flags.bossUnlocked=true; log('Boss route unlocked. Door security embarrassed itself.'); renderAll();} else toast('Boss gate locked. Clear 3 anomalies or find access.'); }
  function handleTile(c,x,y){
    ensureStoryFlags();
    if(c==='C'){setTile(x,y,'.'); state.flags.chests++; addItem('Med Patch',1); const cellDrop=Math.random()<0.65; if(cellDrop) addItem('Vector Cell',1); addCredits(20); const g=Math.random()<0.35?pickGearDrop(false):null; const supplies='Med Patch'+(cellDrop?' + Vector Cell':'')+' + 20 credits'; if(g){addItem(g.name,1); recordDrop(g.name, 'Standard Cache', g.rarity || 'Uncommon'); log('Standard Cache opened: '+supplies+' + '+g.name+'.');} else log('Standard Cache opened: '+supplies+'.'); pulseObjective('Cache recovered. HP/EP supplies stocked. Keep moving toward the anomaly signatures.');}
    if(c==='S'){state.flags.terminal=true; setCheckpoint('Recovery Terminal'); save(); log('Recovery Terminal synced your archive.'); showStoryOnce(stageStoryKey('terminal')); pulseObjective(currentObjectiveText());}
    if(c==='H'){state.player.hp=combatStatBlock().maxHp; state.player.ep=combatStatBlock().maxEp||state.player.maxEp; setCheckpoint('Healing Station'); log('Healing station restored HP/EP and checkpointed your route.'); pulseObjective('HP/EP restored. Get back in there, graveyard champion.');}
    if(c==='L'){setTile(x,y,'.'); state.flags.lore=true; addItem('Archive Log 001',1); log('Recovered Archive 001: The First Vector.'); showStoryOnce(stageStoryKey('lore'));}
    if(c==='E'||c==='B'){startEncounterTile(c,x,y);}
    if(c==='X'){ if(state.flags.chapterComplete){showChapterClearPanel();} else if(state.flags.bossDefeated && state.flags.bossUnlocked && state.flags.anomaliesCleared>=3){completeChapter();} else toast('Exit protocol denied. Finish the objective.');}
  }
  function startEncounterTile(code,x,y){
    ensureStoryFlags();
    if(code==='B' && !state.flags.bossUnlocked){toast('Boss route locked. Clear three anomalies first.'); return;}
    const engage=()=>showPreBattleDialog(code,x,y);
    if(code==='B' && !state.flags.storySeen[stageStoryKey('bossIntro')]){showStoryOnce(stageStoryKey('bossIntro'), engage); return;}
    engage();
  }
  function showPreBattleDialog(code,x,y){
    const def=JSON.parse(JSON.stringify(getEncounterDef(code,x,y)));
    const stage=stageDef();
    let overlay=$('preBattleOverlay');
    if(!overlay){
      overlay=document.createElement('div'); overlay.id='preBattleOverlay'; overlay.className='overlay pre-battle-overlay hidden';
      overlay.innerHTML=`<div class="pre-battle-card avos-crt"><button id="preBattleBack" class="modal-close">Back Out</button><div class="db-header"><div id="preBattleHeader">ANOMALY CONTACT</div><div>PRE-BATTLE SCAN</div></div><div class="pre-battle-layout"><img id="preBattleImg" alt="enemy preview"><section><div class="record-kicker" id="preBattleKicker"></div><h2 id="preBattleName"></h2><p id="preBattleText"></p><div id="preBattleStats" class="record-grid"></div><div class="story-actions"><button id="preBattleStart">Engage</button><button id="preBattleCancel">Retreat</button></div></section></div></div>`;
      document.body.appendChild(overlay);
      $('preBattleBack').onclick=$('preBattleCancel').onclick=()=>{overlay.classList.add('hidden'); uiState.mode='game'; AudioManager.play(activeMusicForState()); renderAll();};
    }
    const s=combatStatBlock();
    $('preBattleHeader').textContent=code==='B'?'BOSS CONTACT':'ANOMALY CONTACT';
    $('preBattleImg').src=def.img;
    $('preBattleKicker').textContent=`${stage.id} // ${code==='B'?'BOSS CLASS':'HOSTILE ENTITY'}`;
    $('preBattleName').textContent=def.name;
    $('preBattleText').textContent=def.note || (code==='B'?'AVOS: Boss-class signature confirmed. This is where confidence gets expensive.':'AVOS: Hostile signature ahead. Verify HP, pick a training focus, then make it regret spawning.');
    const research=researchLineForCreature({id:def.id,name:def.name,type:code==='B'?'Boss':'Anomaly'});
    $('preBattleStats').innerHTML=`<div><b>Enemy HP</b><span>${def.hp}</span></div><div><b>Enemy ATK</b><span>${def.atk}</span></div><div><b>Reward XP</b><span>${def.xp}</span></div><div><b>Research</b><span>Rank ${research.rank} // ${research.text}</span></div><div><b>Vyra</b><span>Lv ${state.player.level} // HP ${state.player.hp}/${s.maxHp}</span></div><div><b>Focus</b><span>${skillList[state.combatStyle].name} Lv ${skillLevel(state.combatStyle)}</span></div><div><b>Gear Power</b><span>${gearPower()}</span></div><div><b>Hazard</b><span>${safeHtml(enemyStatusForStage().text)} status chance</span></div><div><b>Stage Req</b><span>Player Lv ${stage.levelReq}</span></div>`;
    $('preBattleStart').onclick=()=>{overlay.classList.add('hidden'); startBattle(code,x,y);};
    uiState.mode='overlay'; overlay.classList.remove('hidden'); overlay.style.display='grid'; AudioManager.play('pause');
  }
  function addItem(name,n=1){state.inventory[name]=(state.inventory[name]||0)+n; SfxManager.item(); queueAutosave();}
  function addCredits(n){state.player.credits+=n; queueAutosave();}
  function recordDrop(name, source='Recovered', rarity='Common'){
    state.dropLog ||= [];
    const entry={name, source, rarity, stage:stageDef().id, time:Date.now()};
    state.dropLog.unshift(entry);
    state.dropLog=state.dropLog.slice(0,50);
  }

  const STORY_SCENES = {
    intro: {
      kicker:'CHAPTER 1 // THE AWAKENING', speaker:'AVOS',
      lines:['Operator AV-001 online. Memory integrity is... disgusting.', 'Vyra, you are inside Fracture 001: Forbidden Graveyard. Find the lantern terminal before reality finishes buffering.', 'Mission route: sync terminal, clear three anomalies, breach the boss gate, extract the Toxic Core. Try not to die in sewage. It\'s bad branding.']
    },
    terminal: {
      kicker:'RECOVERY TERMINAL // SYNCED', speaker:'VYRA',
      lines:['Archive link restored. I remember blades. I remember fire. I do not remember signing up for a haunted graveyard tour.', 'AVOS: Great news. You are cleared for violence. Three anomaly signatures are locking the boss route. Remove them. Politely, with swords.']
    },
    lore: {
      kicker:'ARCHIVE LOG 001', speaker:'AVOS',
      lines:['Recovered file: The First Vector. Subject Vyra survived the first ash event and became the prototype for Operator synchronization.', 'AVOS note: Whoever wrote this file used way too many redactions. Very mysterious. Very annoying.']
    },
    firstAnomaly: {
      kicker:'ANOMALY NEUTRALIZED', speaker:'VYRA',
      lines:['One down. The fracture is reacting.', 'AVOS: It hated that. Excellent work. Two more anomaly signatures remain before the boss route can open.']
    },
    allAnomalies: {
      kicker:'BOSS ROUTE UNLOCKED', speaker:'AVOS',
      lines:['Three anomaly signatures erased. Boss gate override accepted.', 'Warning: boss-class entity ahead. Also warning: it smells worse than the rest of this place, somehow.']
    },
    bossIntro: {
      kicker:'BOSS ENCOUNTER // GRAVE CORE', speaker:'VYRA',
      lines:['That thing is carrying the Grave Core.', 'AVOS: Correct. Recommended tactic: hit it until the health bar experiences a personal tragedy.']
    },
    f002Intro: {
      kicker:'CHAPTER 2 // BROKEN SIGNAL', speaker:'AVOS',
      lines:['Welcome to Fracture 002: Ash Wastes Outpost. Everything here is dry, hostile, and somehow still sticky.', 'The outpost signal is jamming the ASH route map. Sync the terminal, delete three stronger anomalies, then breach the ash gate boss.']
    },
    f003Intro: {
      kicker:'CHAPTER 3 // DEAD FREQUENCIES', speaker:'VYRA',
      lines:['This place is quiet. Not peaceful quiet. More like somebody muted a scream.', 'AVOS: Neon Graveyard is now live as a full combat route. Same imported creature library. New reason to make terrible life choices.', 'Mission route: sync the grave terminal, erase three dead-frequency anomalies, defeat the shade boss, then extract before the graveyard starts talking back.']
    },
    f003Terminal: {
      kicker:'GRAVE TERMINAL // DEAD SIGNAL SYNCED', speaker:'AVOS',
      lines:['Neon Graveyard terminal linked. Audio feed contains 3,912 whispers and one guy asking about extended warranties.', 'Three dead-frequency anomaly signatures are pinning the shade gate. Clear them and the boss route opens. Please do not negotiate with ghosts.']
    },
    f003Lore: {
      kicker:'NEON GRAVEYARD LOG // DEAD FREQUENCIES', speaker:'VYRA',
      lines:['Recovered graveyard archive. The city buried failed operators here after the ash event, then connected the memorial grid to the network.', 'AVOS: Because apparently nobody on Earth has watched a horror movie. The memorial signal woke up hungry.']
    },
    f003BossIntro: {
      kicker:'BOSS ENCOUNTER // SHADE GATE', speaker:'AVOS',
      lines:['BOSS-020 Duskwither Shade Wraith detected. Imported boss record confirmed.', 'This thing is death, static, and bad UI design compressed into one hostile file. Hit delete with swords.']
    },
    f003BossDefeated: {
      kicker:'DUSKWITHER WRAITH CORE RECOVERED', speaker:'VYRA',
      lines:['The grave signal is collapsing. Core secured.', 'AVOS: Excellent. You have successfully punched a ghost into localStorage. Extraction route is open.']
    },
    f002Terminal: {
      kicker:'OUTPOST TERMINAL // SIGNAL SYNCED', speaker:'AVOS',
      lines:['Outpost uplink stabilized. Signal quality: crispy, burnt, and only slightly haunted.', 'Three ash signatures are feeding the scrap gate. Shut them down and the boss door opens. Preferably before the outpost notices you are stealing its Wi-Fi.']
    },
    f002Lore: {
      kicker:'ASH WASTES LOG // BROKEN SIGNAL', speaker:'VYRA',
      lines:['Recovered outpost file. Survivors tried to build a safe checkpoint here after the first ash fall.', 'AVOS: Then the junk started walking. Historical note: never trust a pile of scrap with glowing eyes.']
    },
    f002BossIntro: {
      kicker:'BOSS ENCOUNTER // SCRAP GATE', speaker:'AVOS',
      lines:['BOSS-006 Ashveil Spider Mother detected. Imported boss record confirmed. That is a spider problem wearing a health bar.', 'Recommended tactic: remove the core and try not to become wall decoration.']
    },
    f002BossDefeated: {
      kicker:'ASHVEIL MOTHER CORE RECOVERED', speaker:'VYRA',
      lines:['The gate is down. Core secured.', 'AVOS: Excellent. You have defeated a trash king. The resume writes itself. Extraction route is open.']
    },
    fermilatF001: {
      kicker:'NPC CONTACT // F-001 FORBIDDEN GRAVEYARD', speaker:'FERMILAT',
      lines:[
        {speaker:'FERMILAT', portrait:'fermilat', text:'hey got any feet pics i can sniff—i mean have?'},
        {speaker:'VYRA', portrait:'vyra', text:'I fought through a haunted graveyard and the hidden NPC near the boss is asking for feet pics?'},
        {speaker:'FERMILAT', portrait:'fermilat', text:'Hidden? No. Strategically stationed. Also the word is “collectibles.”'},
        {speaker:'VYRA', portrait:'vyra', text:'Ask again and I am marking you as a hostile object on the minimap.'}
      ]
    },
    fermilatF002: {
      kicker:'NPC CONTACT // F-002 ASH WASTES OUTPOST', speaker:'FERMILAT',
      lines:[
        {speaker:'FERMILAT', portrait:'fermilat', text:'i still want them feet pics.'},
        {speaker:'VYRA', portrait:'vyra', text:'You crossed into the ash wastes for this?'},
        {speaker:'FERMILAT', portrait:'fermilat', text:'The grind is real. The outpost is dry. The collection remains tragically empty.'},
        {speaker:'VYRA', portrait:'vyra', text:'AVOS, remind me to install an ignore button.'}
      ]
    },
    fermilatF003: {
      kicker:'NPC CONTACT // F-003 NEON GRAVEYARD', speaker:'FERMILAT',
      lines:[
        {speaker:'FERMILAT', portrait:'fermilat', text:'dead frequencies, neon graves, zero feet pics. this is basically endgame suffering.'},
        {speaker:'VYRA', portrait:'vyra', text:'You are hiding beside a boss gate in a haunted graveyard and that is still your main concern?'},
        {speaker:'FERMILAT', portrait:'fermilat', text:'Consistency is important for character development.'},
        {speaker:'VYRA', portrait:'vyra', text:'Your character development needs a patch note and a warning label.'}
      ]
    },
    bossDefeated: {
      kicker:'GRAVE CORE RECOVERED', speaker:'AVOS',
      lines:['Boss-class entity deleted. Grave Core stabilized.', 'Extraction route is now authorized. Head to the white exit marker before the graveyard develops opinions again.']
    }
  };
  function safeHtml(v){return String(v).replace(/[&<>"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]));}
  function stageStoryKey(base){
    const key=currentStageKey();
    if(key === 'f001') return base;
    const named = key + base.charAt(0).toUpperCase() + base.slice(1);
    return STORY_SCENES[named] ? named : base;
  }
  function showStoryOnce(key, after){
    ensureStoryFlags();
    if(state.flags.storySeen[key]){ if(after) after(); return; }
    state.flags.storySeen[key]=true;
    showStory(key, after);
  }
  function showStory(key, after){
    const scene = STORY_SCENES[key];
    if(!scene){ if(after) after(); return; }
    storyActive=true; pendingStoryAfter=after||null;
    let i=0;
    let overlay=$('storyOverlay');
    if(!overlay){
      overlay=document.createElement('div');
      overlay.id='storyOverlay';
      overlay.className='story-overlay hidden';
      overlay.innerHTML=`<div class="story-card avos-crt"><div class="story-kicker" id="storyKicker"></div><div class="story-body"><img src="assets/operators/av001/portrait.png" alt="Vyra portrait"><div><div class="story-speaker" id="storySpeaker"></div><p id="storyLine"></p></div></div><div class="story-actions"><button id="storyNext">Continue</button><button id="storySkip">Skip</button></div></div>`;
      document.body.appendChild(overlay);
      $('storyNext').onclick=advanceStory;
      $('storySkip').onclick=finishStory;
    }
    const storyPortrait = document.querySelector('#storyOverlay .story-body img');
    const lineData = raw => {
      if(raw && typeof raw === 'object') return raw;
      const speaker = scene.speaker || (key.startsWith('fermilat') ? 'FERMILAT' : 'VYRA');
      return {speaker, portrait:key.startsWith('fermilat') ? 'fermilat' : 'vyra', text:String(raw || '')};
    };
    const portraitSrc = line => line.portrait === 'fermilat' || String(line.speaker||'').toUpperCase().includes('FERMILAT')
      ? NPC_DEFS.fermilat.asset
      : 'assets/operators/av001/portrait.png';
    $('storyKicker').textContent=scene.kicker;
    overlay.classList.remove('hidden');
    document.body.classList.add('story-open');
    const draw=()=>{
      const line=lineData(scene.lines[i]);
      if(storyPortrait){ storyPortrait.src = portraitSrc(line); storyPortrait.alt = `${line.speaker || 'Speaker'} portrait`; }
      $('storySpeaker').textContent=line.speaker || scene.speaker || 'AVOS';
      $('storyLine').textContent=line.text || '';
      $('storyNext').textContent = i >= scene.lines.length-1 ? 'Close' : 'Continue';
    };
    overlay._advance=()=>{ i++; if(i>=scene.lines.length) finishStory(); else draw(); };
    draw();
  }
  function advanceStory(){ const overlay=$('storyOverlay'); if(overlay && overlay._advance) overlay._advance(); }
  function finishStory(){
    const overlay=$('storyOverlay');
    if(overlay) overlay.classList.add('hidden');
    document.body.classList.remove('story-open');
    storyActive=false;
    const after=pendingStoryAfter; pendingStoryAfter=null;
    renderAll();
    if(after) setTimeout(after, 80);
  }
  function currentObjectiveText(){
    ensureStoryFlags();
    const def=stageDef();
    if(!state.flags.terminal) return `Objective: Find and sync the ${def.id} recovery terminal.`;
    const cleared=Math.min(3, state.flags.anomaliesCleared || 0);
    if(cleared < 3) return `Objective: Clear anomaly signatures (${cleared}/3).`;
    if(!state.flags.bossDefeated) return `Objective: Boss route open. Defeat the ${def.id} guardian.`;
    if(!state.flags.chapterComplete) return 'Objective: Extract through the white exit marker.';
    return `${def.id} complete. Use Fracture Index to select the next stage.`;
  }


  // v84: objective beacon for mobile/desktop navigation.
  // It finds the next main mission target and shows a compass/ping without adding new assets.
  function findTilesByCode(code){
    const results=[];
    if(!state || !state.map) return results;
    for(let y=0;y<state.map.length;y++){
      for(let x=0;x<(state.map[y]||[]).length;x++){
        if(tileAt(x,y)===code) results.push({x,y,code});
      }
    }
    return results;
  }
  function nearestTile(code){
    const tiles=findTilesByCode(code);
    if(!tiles.length) return null;
    return tiles.sort((a,b)=>(Math.abs(a.x-state.player.x)+Math.abs(a.y-state.player.y))-(Math.abs(b.x-state.player.x)+Math.abs(b.y-state.player.y)))[0];
  }
  function objectiveTarget(){
    if(!state || !state.player || battle) return null;
    const def=stageDef();
    let target=null;
    if(!state.flags.terminal) target={...nearestTile('S'), label:'Recovery Terminal', kind:'terminal'};
    else if(Math.min(3,state.flags.anomaliesCleared||0) < 3) target={...nearestTile('E'), label:'Nearest Anomaly', kind:'anomaly'};
    else if(!state.flags.bossDefeated) target={...nearestTile('B'), label:'Boss Gate', kind:'boss'};
    else if(!state.flags.chapterComplete) target={...nearestTile('X'), label:'Extraction', kind:'exit'};
    else {
      const nextKey=def.nextKey;
      const next=nextKey ? STAGE_DEFS[nextKey] : null;
      return {x:state.player.x,y:state.player.y,label:next?`${next.id} available in Fracture Index`:'Stage complete',kind:'complete',distance:0,arrow:'✓'};
    }
    if(!target || target.x == null || target.y == null) return null;
    const dx=target.x-state.player.x, dy=target.y-state.player.y;
    target.distance=Math.abs(dx)+Math.abs(dy);
    target.arrow=directionArrow(dx,dy);
    target.stage=def.id;
    return target;
  }
  function directionArrow(dx,dy){
    if(dx===0 && dy===0) return '●';
    const ax=Math.abs(dx), ay=Math.abs(dy);
    if(ax > ay*1.7) return dx>0?'→':'←';
    if(ay > ax*1.7) return dy>0?'↓':'↑';
    if(dx>0 && dy>0) return '↘';
    if(dx>0 && dy<0) return '↗';
    if(dx<0 && dy>0) return '↙';
    return '↖';
  }
  function ensureObjectiveCompass(){
    let c=$('objectiveCompass');
    if(c) return c;
    c=document.createElement('button');
    c.id='objectiveCompass';
    c.className='objective-compass';
    c.type='button';
    c.innerHTML='<b>?</b><span>Target</span><em>--</em>';
    c.onclick=()=>showObjectivePing();
    document.body.appendChild(c);
    return c;
  }
  function renderObjectiveCompass(){
    const c=ensureObjectiveCompass();
    const target=objectiveTarget();
    if(!target || $('app').classList.contains('hidden') || battle){ c.classList.add('hidden'); return; }
    c.classList.remove('hidden');
    c.dataset.kind=target.kind || 'target';
    c.innerHTML=`<b>${safeHtml(target.arrow||'•')}</b><span>${safeHtml(target.label)}</span><em>${Number(target.distance||0)} tiles</em>`;
  }
  function showObjectivePing(){
    const target=objectiveTarget();
    if(!target){ toast('No active target.'); return; }
    toast(`${target.label}: ${target.arrow} ${target.distance||0} tiles`);
    const c=ensureObjectiveCompass();
    c.classList.remove('objective-ping'); void c.offsetWidth; c.classList.add('objective-ping');
  }
  function drawObjectiveBeacon(){
    const target=objectiveTarget();
    if(!target || target.x == null || target.y == null || target.kind==='complete') return;
    const cx=target.x*TILE + TILE/2;
    const cy=target.y*TILE + TILE/2;
    const pulse=(Math.sin(Date.now()/180)+1)/2;
    ctx.save();
    ctx.strokeStyle=target.kind==='boss'?'rgba(255,48,72,.95)':target.kind==='exit'?'rgba(255,255,255,.95)':'rgba(0,217,255,.95)';
    ctx.fillStyle=target.kind==='boss'?'rgba(255,48,72,.14)':target.kind==='exit'?'rgba(255,255,255,.12)':'rgba(0,217,255,.14)';
    ctx.lineWidth=2;
    ctx.beginPath(); ctx.arc(cx,cy,15+pulse*7,0,Math.PI*2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(cx,cy,24+pulse*9,0,Math.PI*2); ctx.stroke();
    ctx.restore();
  }
  function pulseObjective(msg){
    if(!msg) msg=currentObjectiveText();
    const tracker=$('objectiveTracker');
    if(tracker){ tracker.classList.remove('objective-pulse'); void tracker.offsetWidth; tracker.classList.add('objective-pulse'); }
    toast(msg);
  }
  function completeChapter(){
    ensureStoryFlags(); ensureProgression();
    const def=stageDef();
    if(!state.flags.chapterRewardsClaimed){
      const credits=def.rewardCredits || 50;
      addCredits(credits);
      addItem('Rust Core', def.key==='f003'?2:1);
      addItem('Operator Shard: Vyra', def.rewardShards || 3);
      addItem('Corrupted Catalyst', def.key==='f003'?2:1);
      if(def.key==='f002'){ addItem('Keycard LV1',1); addItem('Outpost Access Chip',1); addItem('Burnt Alloy',3); }
      if(def.key==='f003'){ addItem('Vector Cell',2); addItem('Duskwither Wraith Core',1); }
      if(def.clearXp) gainXp(def.clearXp);
      recordDrop(`${def.id} Clear Reward`, 'Stage Clear', 'Legendary');
      state.flags.chapterRewardsClaimed=true;
    }
    state.flags.chapterComplete=true;
    state.flags.chapterClearSeen=true;
    state.stages[def.key] ||= {unlocked:true,complete:false};
    state.stages[def.key].complete=true;
    unlockNextStages();
    SfxManager.levelWin();
    log(`${def.id} complete: Core recovered. Rewards delivered to inventory.`);
    save(true); renderAll(); showChapterClearPanel();
  }

  function showChapterClearPanel(){
    const def=stageDef();
    const order=Object.keys(STAGE_DEFS);
    const nextKey=def.nextKey || order[order.indexOf(def.key)+1];
    const next=nextKey ? STAGE_DEFS[nextKey] : null;
    const nextReady = !!next && playerMeetsStageRequirement(next.key);
    let panel=$('chapterClearOverlay');
    if(!panel){
      panel=document.createElement('div');
      panel.id='chapterClearOverlay';
      panel.className='overlay chapter-clear-overlay hidden';
      panel.innerHTML=`<div class="chapter-clear-card avos-crt"><div class="record-kicker" id="chapterClearKicker"></div><h2 id="chapterClearTitle"></h2><p id="chapterClearCopy"></p><div class="victory-loot chapter-rewards" id="chapterRewardList"></div><div class="story-actions"><button id="chapterContinueBtn">Continue Exploring</button><button id="chapterNextBtn">Start Next Fracture</button><button id="chapterMenuBtn">Return to Main Menu</button></div></div>`;
      document.body.appendChild(panel);
      $('chapterContinueBtn').onclick=()=>{ panel.classList.add('hidden'); uiState.mode='game'; $('app').classList.remove('hidden'); AudioManager.play(activeMusicForState()); renderAll(); };
      $('chapterNextBtn').onclick=()=>{ if(nextReady){ panel.classList.add('hidden'); loadStage(next.key); } else if(next){ toast(`${next.id} requires Player Lv. ${next.levelReq} and previous stage clear.`); } else toast('Next fracture coming soon.'); };
      $('chapterMenuBtn').onclick=()=>{ panel.classList.add('hidden'); gameStarted=false; showMenu(); };
    }
    $('chapterClearKicker').textContent=`STAGE COMPLETE // ${def.id} STABILIZED`;
    $('chapterClearTitle').textContent=def.chapter.replace(/^Chapter \d+ \/\/\s*/, '').toUpperCase();
    $('chapterClearCopy').textContent=`${def.title} cleared. Progress saved locally. ${next ? (nextReady ? next.id+' is available now.' : next.id+' requires Player Lv. '+next.levelReq+'. Train more if it is locked.') : 'More fractures are coming in a future build.'}`;
    const rewards=[`${def.rewardCredits||50} Credits`, `${def.clearXp||0} Sync XP`, def.key==='f003'?'Rust Core x2':'Rust Core', `Operator Shard: Vyra x${def.rewardShards||3}`, def.key==='f003'?'Corrupted Catalyst x2':'Corrupted Catalyst'];
    if(def.key==='f002') rewards.push('Keycard LV1','Outpost Access Chip','Burnt Alloy x3');
    if(def.key==='f003') rewards.push('Vector Cell x2','Duskwither Wraith Core');
    $('chapterRewardList').innerHTML=rewards.map(name=>`<div class="victory-loot-item"><span>${safeHtml(name)}</span></div>`).join('');
    const btn=$('chapterNextBtn'); if(btn){ btn.disabled=!next; btn.textContent=next ? (nextReady?`Start ${next.id}`:`${next.id} Locked: Lv. ${next.levelReq}`) : 'Next Fracture Coming Soon'; }
    panel.classList.remove('hidden');
  }

  function startBattle(code,x,y){
    const def=JSON.parse(JSON.stringify(getEncounterDef(code,x,y)));
    const stage=stageDef();
    const battlePanel=$('battlePanel');
    if(battlePanel) battlePanel.style.backgroundImage=`url('${battleBgForStage(stage.key)}?v=${BUILD_VERSION}')`;
    const loc=document.querySelector('.battle-location'); if(loc) loc.textContent=`${stage.id} // ${stage.title.toUpperCase()}`;
    const scale = Math.max(1, stage.levelReq);
    if(stage.key !== 'f001'){ def.hp = Math.floor(def.hp * (1 + scale*0.18)); def.maxHp = def.hp; def.atk = Math.floor(def.atk * (1 + scale*0.10)); def.xp = Math.floor(def.xp * (1 + scale*0.35)); def.credits = Math.floor(def.credits * (1 + scale*0.25)); }
    battle={code,x,y,enemy:def,turn:'player',guard:false,enemyStatus:{},playerStatus:{},evadeNext:false};
    uiState.mode='combat'; AudioManager.play(code==='B'?'boss':'battle');
    $('battleTitle').textContent=`${def.id || 'AN'} // ${def.name}`;
    if($('battleEnemyLabel')) $('battleEnemyLabel').textContent = def.id || 'ANOMALY';
    $('battleEnemy').src=def.img;
    $('battleEnemy').onerror=()=>{ $('battleText').textContent='Creature art missing: '+def.img; };
    $('battleHero').src='assets/operators/av001/battle.png';
    $('battleText').textContent='Choose a combat protocol.';
    $('battleVictory')?.classList.add('hidden');
    $('battlePanel')?.classList.remove('battle-shake');
    document.addEventListener('fullscreenchange',()=>{ if(!document.fullscreenElement) document.body.classList.remove('fullscreen-mode'); });
    document.querySelectorAll('.overlay').forEach(o=>o.classList.add('hidden'));
    $('battleOverlay').classList.remove('hidden');
    renderBattle();
  }
  function renderBattle(){
    if(!battle)return;
    const mod=combatModifiers();
    const enemyPct = Math.max(0, Math.min(100, 100*battle.enemy.hp/battle.enemy.maxHp));
    const heroMax = combatStatBlock().maxHp; const heroPct = Math.max(0, Math.min(100, 100*state.player.hp/heroMax));
    const epMax = combatStatBlock().maxEp || state.player.maxEp; const epPct = Math.max(0, Math.min(100, 100*state.player.ep/epMax));
    const enemyStatusText = statusSummary(battle.enemyStatus);
    const playerStatusText = statusSummary(battle.playerStatus);
    $('battleHp').innerHTML=`
      <div class="battle-meter enemy-meter"><div><b>${battle.enemy.name}</b><span>${battle.enemy.id || 'ANOMALY'} // HP ${battle.enemy.hp}/${battle.enemy.maxHp}${enemyStatusText?' // '+enemyStatusText:''}</span></div><div class="bar big"><span style="width:${enemyPct}%"></span></div></div>
      <div class="battle-meter hero-meter"><div><b>Vyra</b><span>AV-001 // Lv ${state.player.level} // HP ${state.player.hp}/${combatStatBlock().maxHp}${playerStatusText?' // '+playerStatusText:''}</span></div><div class="bar big"><span style="width:${heroPct}%"></span></div></div>
      <div class="battle-meter ep-meter"><div><b>Energy</b><span>EP ${state.player.ep}/${epMax}</span></div><div class="bar big ep"><span style="width:${epPct}%"></span></div></div>
      <div class="battle-meter ep-meter"><div><b>Overdrive</b><span>${state.player.overdrive || 0}/${state.player.maxOverdrive || 100}${overdriveReady()?' // READY':''}</span></div><div class="bar big ep"><span style="width:${overdrivePct()}%"></span></div></div>
      <div class="battle-meter focus-meter"><b>Focus</b><span>${skillList[mod.focus].name} Lv. ${mod.level} // Gear ${gearPower()}</span></div>`;
    $('attackButtons').innerHTML='';
    attacks.forEach((a,i)=>{
      let b=document.createElement('button');
      const cost=Math.max(0,a.ep-mod.epDiscount);
      b.innerHTML=`<b>${a.name}</b><span>${cost?cost+' EP':'Free'} // ${a.heal?'Recovery':'Strike'}</span>`;
      b.disabled=state.player.ep<cost;
      b.onclick=()=>playerAttack(i);
      $('attackButtons').appendChild(b);
    });
    const cellQty=state.inventory['Vector Cell']||0;
    const cell=document.createElement('button');
    cell.className='battle-item-button';
    cell.innerHTML=`<b>Use Vector Cell</b><span>${cellQty} owned // Restore EP</span>`;
    cell.disabled=!cellQty || state.player.ep>=epMax || battle.turn!=='player';
    cell.onclick=useVectorCellBattle;
    $('attackButtons').appendChild(cell);

    const guard=document.createElement('button');
    guard.className='battle-guard-button';
    guard.innerHTML=`<b>Guard</b><span>G // block next hit + regain 2 EP</span>`;
    guard.disabled=battle.turn!=='player';
    guard.onclick=guardBattle;
    $('attackButtons').appendChild(guard);

    const overdrive=document.createElement('button');
    overdrive.className='battle-overdrive-button';
    overdrive.innerHTML=`<b>Null Vector Execution</b><span>5/U // Overdrive ${state.player.overdrive || 0}/${state.player.maxOverdrive || 100}</span>`;
    overdrive.disabled=battle.turn!=='player' || !overdriveReady();
    overdrive.onclick=useOverdriveBattle;
    $('attackButtons').appendChild(overdrive);
  }
  function playerAttack(i){
    if(!battle||battle.turn!=='player')return;
    const a=attacks[i]; const mod=combatModifiers(); const cost=Math.max(0,a.ep-mod.epDiscount);
    if(state.player.ep<cost){toast('Not enough EP.');return;}
    state.player.ep-=cost;
    if(a.heal){
      const heal = 18+Math.floor(mod.level/4);
      state.player.hp=Math.min(combatStatBlock().maxHp,state.player.hp+heal);
      const cleansed = cleansePlayerStatuses();
      $('battleText').textContent=a.text + (cleansed ? ` Cleansed ${cleansed} status effect${cleansed>1?'s':''}.` : '');
      showDamage('hero', `+${heal}`, 'heal');
      chargeOverdrive(5, 'recovery');
      grantStyleXp(mod.focus, 3);
    } else {
      SfxManager.slash();
      const stats=combatStatBlock(); let crit=Math.random()<(stats.crit+mod.critBonus); let dmg=Math.max(1,a.dmg+stats.atk+stats.strBonus-3+mod.damageBonus+(crit?8+Math.floor(mod.level/5):0));
      battle.enemy.hp=Math.max(0,battle.enemy.hp-dmg);
      const statusNote = applyPlayerStatusFromAttack(i,dmg);
      $('battleText').textContent=`${a.text} ${crit?'CRITICAL ':''}-${dmg} HP. ${skillList[mod.focus].name} +${Math.max(3,Math.floor(dmg/3))} XP.${statusNote?' '+statusNote:''}`;
      showDamage('enemy', `${crit?'CRIT ':''}-${dmg}`, crit?'crit':'hit');
      flashCombatant('battleEnemy');
      shakeBattle(crit ? 420 : 260);
      chargeOverdrive(8 + (crit ? 5 : 0), 'attack');
      grantStyleXp(mod.focus, Math.max(3,Math.floor(dmg/3))); grantStyleXp('health', Math.max(1, Math.floor(dmg/5)));
    }
    renderBattle();
    if(battle.enemy.hp<=0){setTimeout(winBattle,420);} else {battle.turn='enemy'; setTimeout(enemyTurn,760);}
  }
  function guardBattle(){
    if(!battle || battle.turn!=='player') return;
    const epMax = combatStatBlock().maxEp || state.player.maxEp;
    battle.guard = true;
    state.player.ep = Math.min(epMax, state.player.ep + 2);
    $('battleText').textContent = 'Vyra braces behind a Vector Guard. Next incoming hit is reduced.';
    showDamage('hero', 'GUARD', 'dodge');
    chargeOverdrive(12, 'guard');
    grantStyleXp('defense', 5);
    battle.turn='enemy';
    renderBattle();
    setTimeout(enemyTurn, 680);
  }
  function enemyTurn(){
    if(!battle)return;
    ensureBattleStatus();
    const enemyTicks = tickBattleStatus('enemy');
    if(enemyTicks.length){
      $('battleText').textContent = enemyTicks.join(' ');
      showDamage('enemy', 'STATUS', 'hit');
      renderBattle();
      if(battle.enemy.hp<=0){ setTimeout(winBattle,420); return; }
    }
    const mod=combatModifiers();
    let dodge = battle.evadeNext || Math.random()<(0.08+mod.dodgeBonus);
    const evadedByDash = !!battle.evadeNext;
    battle.evadeNext = false;
    SfxManager.enemyAttack(battle.code === 'B', dodge);
    const stats=combatStatBlock(); let dmg = dodge?0:Math.max(1,battle.enemy.atk-stats.def+Math.floor(Math.random()*5)-mod.damageReduction-stats.block);
    let guardText = '';
    if(battle.guard && dmg>0){
      const blocked = Math.max(1, Math.ceil(dmg * 0.5));
      dmg = Math.max(0, dmg - blocked);
      guardText = ` // Guard blocked ${blocked}`;
      battle.guard = false;
      grantStyleXp('defense', 4 + blocked);
    } else {
      battle.guard = false;
    }
    if(dmg) state.player.hp=Math.max(0,state.player.hp-dmg);
    const enemyStatusNote = applyEnemyStatusAfterHit(dmg,dodge);
    const playerTicks = tickBattleStatus('player');
    const tickText = playerTicks.length ? ' ' + playerTicks.join(' ') : '';
    $('battleText').textContent = dodge ? (evadedByDash ? 'Phantom Dash avoided the incoming hit.' : 'Vyra dodged. The anomaly looked personally offended.') : `${battle.enemy.name} attacks. -${dmg} HP${mod.damageReduction?` (${mod.damageReduction} blocked)`:''}${guardText}.${enemyStatusNote?' '+enemyStatusNote:''}${tickText}`;
    if(dmg){ showDamage('hero', `-${dmg}`, 'hit'); flashCombatant('battleHero'); shakeBattle(battle.code==='B'?320:220); chargeOverdrive(Math.min(18, 6 + Math.floor(dmg/3)), 'damage taken'); grantStyleXp('defense', Math.max(1, Math.floor(dmg/2))); grantStyleXp('health', Math.max(1, Math.floor(dmg/3))); }
    else { chargeOverdrive(6, 'dodge'); showDamage('hero', evadedByDash ? 'PHANTOM' : 'DODGE', 'dodge'); }
    if(playerTicks.length) showDamage('hero', 'STATUS', 'hit');
    if(state.player.hp<=0){
      handlePlayerDeath();
      return;
    }
    battle.turn='player'; renderBattle(); renderUI();
  }

  function handlePlayerDeath(){
    if(!battle) return;
    battle.turn='defeated';
    setBattleMobileMode(false);
    state.player.hp = 0;
    SfxManager.death();
    AudioManager.stopMusic();
    $('battleText').textContent = 'Vyra has fallen. Archive synchronization failed.';
    renderBattle();
    const panel=$('battleVictory');
    const retryLabel = state.checkpoint?.label ? `Retry from ${safeHtml(state.checkpoint.label)}` : 'Retry Fracture';
    panel.innerHTML = `<div class="victory-card defeat-card"><div class="record-kicker">DEFEAT // OPERATOR DOWN</div><h2>ARCHIVE COLLAPSE</h2><p>Vyra was overwhelmed. The run has ended.</p><div class="protocol-list"><div><b>Status</b><span>HP reached 0. Developer mercy disabled.</span></div><div><b>Recovery</b><span>${state.checkpoint?.label ? 'Checkpoint found: '+safeHtml(state.checkpoint.label) : 'No checkpoint found. Restart from Fracture Entry.'}</span></div></div><button id="deathRetryBtn">${retryLabel}</button><button id="deathMenuBtn">Return to Main Menu</button></div>`;
    panel.classList.remove('hidden');
    const retry=$('deathRetryBtn');
    const menu=$('deathMenuBtn');
    if(retry) retry.onclick=()=>{ const restored=restoreCheckpoint(); battle=null; setBattleMobileMode(false); if(!restored) state=newGameState(); gameStarted=true; uiState.mode='game'; panel.classList.add('hidden'); $('battleOverlay').classList.add('hidden'); $('app').classList.remove('hidden'); renderAll(); AudioManager.play(activeMusicForState()); };
    if(menu) menu.onclick=()=>{ battle=null; setBattleMobileMode(false); panel.classList.add('hidden'); $('battleOverlay').classList.add('hidden'); gameStarted=false; showMenu(); };
  }

  function winBattle(){
    if(!battle) return;
    SfxManager.battleWin();
    const e=battle.enemy;
    const loot=[...e.loot];
    setTile(battle.x,battle.y,'.');
    const wasBoss = battle.code === 'B';
    const wasAnomaly = battle.code === 'E';
    recordAnomalyResearch(e, wasBoss);
    ensureRespawnState();
    if(wasAnomaly){
      state.flags.anomaliesCleared = Math.min(3, (state.flags.anomaliesCleared || 0) + 1);
      const stageKey = stageDef().key;
      state.enemyKills[stageKey] = (state.enemyKills[stageKey] || 0) + 1;
      advanceContract(e.name);
      advanceSideQuests(e.name);
      scheduleEncounterRespawn('E', battle.x, battle.y, e.name);
    }
    if(wasAnomaly && state.flags.anomaliesCleared >= 3 && !state.flags.bossUnlocked){state.flags.bossUnlocked=true; log('AVOS forced the boss route open. Somebody in security is getting demoted.'); pulseObjective(currentObjectiveText());}
    if(wasBoss){state.flags.bossUnlocked=true; state.flags.bossDefeated=true; state.bossKills ||= {}; state.bossKills[stageDef().key]=(state.bossKills[stageDef().key]||0)+1; loot.push('Corrupted Catalyst'); addItem('Corrupted Catalyst',1); recordDrop('Corrupted Catalyst', battle.enemy.name, 'Epic'); const bossReward=battle.enemy.bossReward || (stageDef().key==='f002'?'Ashveil Mother Core':'Toxic Monarch Relic'); if(!state.inventory[bossReward]){ loot.push(bossReward); addItem(bossReward,1); recordDrop(bossReward, battle.enemy.name, 'Relic'); }}
    const gearDrop = (!wasBoss && Math.random() < 0.42) ? pickGearDrop(false) : (wasBoss ? pickGearDrop(true) : null);
    if(gearDrop && !loot.includes(gearDrop.name)){ loot.push(gearDrop.name); addItem(gearDrop.name,1); recordDrop(gearDrop.name, battle.enemy.name, gearDrop.rarity || 'Rare'); }
    const cellQty = wasBoss ? 2 : (wasAnomaly && Math.random()<0.38 ? 1 : 0);
    if(cellQty){
      for(let i=0;i<cellQty;i++) loot.push('Vector Cell');
      addItem('Vector Cell', cellQty);
    }
    const xpGain = Math.floor(e.xp * (1 + (combatStatBlock().xpBonus||0)));
    gainXp(xpGain); grantStyleXp(state.combatStyle || 'attack', xpGain); addCredits(e.credits); e.loot.forEach(item=>addItem(item,1));
    log(`Victory: ${e.name}. +${xpGain} Sync, +${e.credits} credits, loot recovered.`);
    showVictoryPanel(e, loot, {wasBoss, wasAnomaly}); queueAutosave();
  }

  function showDamage(side, text, type='hit'){
    const layer = $('damageLayer');
    if(!layer) return;
    const pop=document.createElement('div');
    pop.className=`damage-number ${type} ${side}`;
    pop.textContent=text;
    layer.appendChild(pop);
    setTimeout(()=>pop.remove(),900);
  }
  function flashCombatant(id){
    const el=$(id); if(!el) return;
    el.classList.remove('hit-flash'); void el.offsetWidth; el.classList.add('hit-flash');
    setTimeout(()=>el.classList.remove('hit-flash'),360);
  }
  function shakeBattle(ms=260){
    const el=$('battlePanel'); if(!el || state.settings.reducedMotion) return;
    el.classList.remove('battle-shake'); void el.offsetWidth; el.classList.add('battle-shake');
    setTimeout(()=>el.classList.remove('battle-shake'),ms);
  }
  function showVictoryPanel(enemy, loot, meta={}){
    const panel=$('battleVictory');
    const uniqueLoot = [...new Set(loot)];
    const nextLabel = meta.wasBoss ? 'Recover Grave Core' : 'Return to Fracture';
    const research = researchLineForCreature({id:enemy.id, name:enemy.name, type:meta.wasBoss?'Boss':'Anomaly'});
    panel.innerHTML = `<div class="victory-card"><div class="record-kicker">VICTORY // THREAT NEUTRALIZED</div><h2>${enemy.name}</h2><p>Synchronization +${Math.floor(enemy.xp * (1 + (combatStatBlock().xpBonus||0)))} // Credits +${enemy.credits}</p><p class="fineprint">Research Rank ${research.rank} // ${research.text}</p><div class="victory-loot">${uniqueLoot.map(name=>{const item=findItemRecord(name); return `<div class="victory-loot-item ${rarityClass(item.rarity)}">${itemIconHtml(item,1)}<span>${name}</span></div>`}).join('') || '<span>No loot recovered.</span>'}</div><button id="continueBattleBtn">${nextLabel}</button></div>`;
    panel.classList.remove('hidden');
    const btn=$('continueBattleBtn');
    if(btn) btn.onclick=()=>{
      battle=null; setBattleMobileMode(false); uiState.mode='game'; panel.classList.add('hidden'); $('battleOverlay').classList.add('hidden'); renderAll(); AudioManager.play(activeMusicForState());
      if(meta.wasBoss){showStoryOnce(stageStoryKey('bossDefeated')); pulseObjective(currentObjectiveText());}
      else if(meta.wasAnomaly && state.flags.anomaliesCleared===1){showStoryOnce('firstAnomaly');}
      else if(meta.wasAnomaly && state.flags.anomaliesCleared>=3){showStoryOnce('allAnomalies');}
      else {pulseObjective(currentObjectiveText());}
    };
  }

  function gainXp(n){ state.player.xp+=n; while(state.player.xp>=state.player.nextXp){state.player.xp-=state.player.nextXp; state.player.level++; state.player.nextXp=Math.floor(state.player.nextXp*1.35); state.player.maxHp+=8; state.player.maxEp+=4; state.player.atk+=1; state.player.def+=1; state.player.hp=combatStatBlock().maxHp; state.player.ep=combatStatBlock().maxEp||state.player.maxEp; log(`Player Level increased to ${state.player.level}.`); unlockNextStages();} queueAutosave(); }
  function useMedPatch(){ ensureUpgrades(); if((state.inventory['Med Patch']||0)<=0){toast('No Med Patch available.');return false;} if(state.player.hp>=combatStatBlock().maxHp){toast('HP already full.');return false;} const heal=25+(state.upgrades.medtech||0)*10; const before=state.player.hp; state.inventory['Med Patch']--; if(state.inventory['Med Patch']<=0) delete state.inventory['Med Patch']; state.player.hp=Math.min(combatStatBlock().maxHp,state.player.hp+heal); const gained=state.player.hp-before; SfxManager.item(); log(`Used Med Patch. +${gained} HP.`); renderAll(); return gained; }
  function useVectorCell(mode='field'){
    ensureUpgrades(); ensureEquipment();
    if((state.inventory['Vector Cell']||0)<=0){toast('No Vector Cell available.'); return 0;}
    const epMax=combatStatBlock().maxEp||state.player.maxEp;
    if(state.player.ep>=epMax){toast('EP already full.'); return 0;}
    const restore=Math.max(12, Math.ceil(epMax*0.55) + (state.upgrades.energy||0)*4);
    const before=state.player.ep;
    state.inventory['Vector Cell']--;
    if(state.inventory['Vector Cell']<=0) delete state.inventory['Vector Cell'];
    state.player.ep=Math.min(epMax,state.player.ep+restore);
    const gained=state.player.ep-before;
    SfxManager.item();
    log(`Used Vector Cell. +${gained} EP.`);
    if(mode !== 'battle') renderAll(); else renderUI();
    queueAutosave();
    return gained;
  }
  function useVectorCellBattle(){
    if(!battle || battle.turn!=='player') return;
    const gained=useVectorCell('battle');
    if(!gained) return;
    $('battleText').textContent=`Vyra burns a Vector Cell. +${gained} EP restored.`;
    showDamage('hero', `+${gained} EP`, 'heal');
    battle.turn='enemy';
    renderBattle();
    setTimeout(enemyTurn,760);
  }
  function consumableButtonHtml(name){
    if(name==='Med Patch') return '<button onclick="window.AV.useMedPatch()">Use HP</button>';
    if(name==='Vector Cell') return '<button onclick="window.AV.useVectorCell()">Use EP</button>';
    return '';
  }
  function render(){
    ctx.clearRect(0,0,VIEW_W,VIEW_H); camera.x=Math.max(0, Math.min(state.player.x*TILE - VIEW_W/2, state.map[0].length*TILE - VIEW_W)); camera.y=Math.max(0, Math.min(state.player.y*TILE - VIEW_H/2, state.map.length*TILE - VIEW_H));
    ctx.save(); ctx.translate(-camera.x,-camera.y);
    for(let y=0;y<state.map.length;y++) for(let x=0;x<state.map[y].length;x++){drawTile(state.map[y][x],x*TILE,y*TILE,x,y)}
    drawMapProps();
    drawNpcs();
    // player / AV-001 Vyra exploration sprite
    drawPlayerSprite(state.player.x*TILE, state.player.y*TILE);
    drawObjectiveBeacon();
    ctx.restore();
    drawMapAtmosphere();
  }

  function drawMapAtmosphere(){
    // v88: global fog/tint pass. Keeps imported tiles readable while making F-001 feel haunted.
    const t = Date.now() * 0.00025;
    ctx.save();
    ctx.fillStyle='rgba(5,10,15,.34)';
    ctx.fillRect(0,0,VIEW_W,VIEW_H);
    const vignette = ctx.createRadialGradient(VIEW_W/2, VIEW_H/2, VIEW_W*0.18, VIEW_W/2, VIEW_H/2, VIEW_W*0.72);
    vignette.addColorStop(0,'rgba(0,0,0,0)');
    vignette.addColorStop(0.62,'rgba(0,0,0,.18)');
    vignette.addColorStop(1,'rgba(0,0,0,.58)');
    ctx.fillStyle=vignette;
    ctx.fillRect(0,0,VIEW_W,VIEW_H);
    for(let i=0;i<7;i++){
      const y=(i*91 + (t*70)%91) % (VIEW_H+80) - 40;
      const grd=ctx.createLinearGradient(0,y,VIEW_W,y+42);
      grd.addColorStop(0,'rgba(120,190,190,0)');
      grd.addColorStop(0.5,'rgba(120,190,190,.055)');
      grd.addColorStop(1,'rgba(120,190,190,0)');
      ctx.fillStyle=grd;
      ctx.fillRect(0,y,VIEW_W,42);
    }
    ctx.restore();
  }

  function drawPlayerSprite(x,y){
    const spritePath = 'assets/operators/av001/sprites/map_sprite.png';
    const im = images[spritePath];
    // feet anchored to tile bottom; sprite can be taller than one tile
    const drawW = 48;
    const drawH = 60;
    const dx = x + (TILE-drawW)/2;
    const dy = y + TILE - drawH + 4;
    ctx.save();
    ctx.fillStyle='rgba(0,0,0,.45)';
    ctx.beginPath();
    ctx.ellipse(x+TILE/2,y+TILE-4,18,7,0,0,Math.PI*2);
    ctx.fill();
    ctx.shadowColor='#00d9ff';
    ctx.shadowBlur=12;
    if(im && im.complete && im.naturalWidth){
      const oldSmooth = ctx.imageSmoothingEnabled;
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(im, dx, dy, drawW, drawH);
      ctx.imageSmoothingEnabled = oldSmooth;
    } else {
      // fallback only if asset fails to load
      ctx.fillStyle='#111820';ctx.fillRect(x+8,y+6,26,30);ctx.fillStyle='#00d9ff';ctx.fillRect(x+12,y+16,18,5);ctx.strokeStyle='#00d9ff';ctx.strokeRect(x+5,y+4,32,34);
    }
    ctx.strokeStyle='rgba(0,217,255,.75)';
    ctx.lineWidth=1;
    ctx.strokeRect(x+5,y+4,TILE-10,TILE-8);
    ctx.restore();
  }


  function drawMapProps(){
    const pack = stageVisualPack();
    const props = [...mapArt.props, ...((pack && pack.props) || [])];
    props.forEach(p=>{
      const tile = tileAt(p.x,p.y);
      // Only draw decorative props on open floor so they never cover caches, NPCs, doors, or exits.
      if(tile !== '.') return;
      drawAsset(p.img, p.x*TILE, p.y*TILE, p.w, p.h, true);
    });
  }

  function drawTile(c,x,y,tx,ty){
    const pack = stageVisualPack();

    // v91: blocked tiles no longer draw the random floor/platform art underneath.
    // That was the main reason the graveyard looked like mismatched slopes instead of solid ground.
    if(c==='#'){
      drawWallBase(x,y,tx,ty);
      const edgeWall = hasWalkableNeighbor(tx,ty);
      const shouldDecorate = (edgeWall && ((tx*13 + ty*19) % 4 === 0)) || (!edgeWall && ((tx*17 + ty*23) % 11 === 0));
      if(shouldDecorate){
        const blockList = (pack && pack.blocked && pack.blocked.length) ? pack.blocked : mapArt.blocked;
        const block = pickAsset(blockList,tx,ty);
        // Keep blockers inside/near their own tile so trees/crypts do not hide paths or caches.
        const wide = /tree|crypt|ruins|jaws|plant|dead/i.test(block);
        const w = wide ? 48 : 42;
        const h = wide ? 52 : 42;
        if(!drawAsset(block,x,y,w,h,true)){
          ctx.fillStyle='rgba(35,42,50,.88)';ctx.fillRect(x+5,y+5,TILE-10,TILE-10);
        }
      }
      ctx.fillStyle='rgba(0,0,0,.20)'; ctx.fillRect(x,y,TILE,TILE);
      return;
    }

    drawUniformGround(x,y,tx,ty,c);
    if(pack && pack.floorTint){ ctx.fillStyle = pack.floorTint; ctx.fillRect(x,y,TILE,TILE); }
    drawPathOverlay(x,y,tx,ty,c);
    ctx.strokeStyle='rgba(255,255,255,.07)'; ctx.lineWidth=1; ctx.strokeRect(x,y,TILE,TILE);

    if(c==='C'){
      if(!drawAsset((pack&&pack.chest)||mapArt.chest,x,y,38,34,true)){ctx.fillStyle='#9b6b22';ctx.fillRect(x+9,y+13,24,20);ctx.strokeStyle='#e0b64b';ctx.strokeRect(x+9,y+13,24,20)}
      drawInteractMarker('C',x,y,'rgba(255,202,69,.95)');
    }
    if(c==='S'){
      if(!drawAsset((pack&&pack.terminal)||mapArt.terminal,x,y,38,48,true)){ctx.fillStyle='#25567d';ctx.fillRect(x+8,y+6,26,30);ctx.fillStyle='#70d7ff';ctx.fillRect(x+13,y+12,16,8)}
      drawInteractMarker('S',x,y,'rgba(112,215,255,.95)');
    }
    if(c==='H'){
      if(!drawAsset((pack&&pack.med)||mapArt.med,x,y,32,32,false)){ctx.fillStyle='#216d45';ctx.fillRect(x+8,y+8,26,26);ctx.fillStyle='#fff';ctx.fillRect(x+18,y+12,6,18);ctx.fillRect(x+12,y+18,18,6)}
      drawInteractMarker('H',x,y,'rgba(89,255,160,.95)');
    }
    if(c==='L'){
      if(!drawAsset((pack&&pack.lore)||mapArt.lore,x,y,32,44,true)){ctx.fillStyle='#4b316f';ctx.fillRect(x+11,y+8,20,28);ctx.fillStyle='#d2a8ff';ctx.fillRect(x+15,y+13,12,3);ctx.fillRect(x+15,y+20,12,3)}
      drawInteractMarker('L',x,y,'rgba(210,168,255,.95)');
    }
    if(c==='E'||c==='B'){
      const im = getMapCreatureImage(c,tx,ty);
      if(im && im.complete && im.naturalWidth){
        ctx.save();
        ctx.shadowColor = c==='B' ? '#ff3048' : '#bd1f2d';
        ctx.shadowBlur = c==='B' ? 16 : 10;
        ctx.drawImage(im, x+5, y+5, TILE-10, TILE-10);
        ctx.restore();
      } else {
        ctx.fillStyle=c==='B'?'#72202b':'#5c4e41';ctx.beginPath();ctx.arc(x+21,y+21,c==='B'?18:14,0,Math.PI*2);ctx.fill();ctx.fillStyle='#ff3048';ctx.fillRect(x+13,y+16,6,4);ctx.fillRect(x+24,y+16,6,4);
      }
      drawInteractMarker(c==='B'?'B':'E',x,y,c==='B'?'rgba(255,48,72,.98)':'rgba(255,87,112,.94)');
    }
    if(c==='D'){
      if(!drawAsset((pack&&pack.door)||mapArt.door,x,y,42,32,false)){ctx.fillStyle='#5a3422';ctx.fillRect(x+6,y+2,30,38);ctx.fillStyle='#e0b64b';ctx.fillRect(x+29,y+20,4,4)}
      drawInteractMarker('D',x,y,'rgba(255,184,64,.95)');
    }
    if(c==='X'){
      if(!drawAsset((pack&&pack.exit)||mapArt.exit,x,y,32,46,true)){ctx.fillStyle='#eee';ctx.fillRect(x+6,y+6,30,30);ctx.fillStyle='#050608';ctx.fillText('X',x+16,y+27)}
      drawInteractMarker('X',x,y,'rgba(255,255,255,.98)');
    }
  }
  function renderMini(){
    const w=state.map[0].length,h=state.map.length; mctx.clearRect(0,0,mini.width,mini.height); const sx=mini.width/w, sy=mini.height/h;
    for(let y=0;y<h;y++) for(let x=0;x<w;x++){
      const c=tileAt(x,y);
      mctx.fillStyle=c==='#'?'#05080c':c==='C'?'#e0b64b':c==='S'?'#70d7ff':c==='H'?'#59ffa0':c==='L'?'#d2a8ff':c==='D'?'#ffb840':c==='E'||c==='B'?'#bd1f2d':c==='X'?'#fff':'#31424c';
      mctx.fillRect(x*sx,y*sy,Math.ceil(sx),Math.ceil(sy));
    }
    stageNpcs().forEach(n=>{ mctx.fillStyle='#94ff62'; mctx.fillRect(n.x*sx,n.y*sy,Math.ceil(sx*2),Math.ceil(sy*2)); });
    const navTarget=objectiveTarget();
    if(navTarget && navTarget.x != null){ mctx.strokeStyle='#00d9ff'; mctx.lineWidth=2; mctx.strokeRect(navTarget.x*sx-1,navTarget.y*sy-1,Math.ceil(sx*3),Math.ceil(sy*3)); }
    mctx.fillStyle='#ff3048'; mctx.fillRect(state.player.x*sx,state.player.y*sy,Math.ceil(sx*2),Math.ceil(sy*2));
  }
  function renderUI(){
    ensureProgression(); ensureContracts(); ensureResearch(); syncHpCap(); unlockNextStages(); ensureStoryFlags();
    const p=state.player; const stats=combatStatBlock(); const def=stageDef();
    const saveAge=Math.floor((Date.now()-(state.lastSave||Date.now()))/1000);
    const upTotal=Object.values(state.upgrades||{}).reduce((a,b)=>a+(b||0),0);
    const anomalyClears=Math.min(3, state.flags.anomaliesCleared || 0);
    const stageKills=(state.enemyKills||{})[def.key] || 0;
    const pendingRespawns=pendingRespawnsForStage(def.key);
    const nextRespawn=pendingRespawns.length ? Math.min(...pendingRespawns.map(r=>r.seconds)) : 0;
    const respawnText=pendingRespawns.length ? `Pending ${pendingRespawns.length} // next ${nextRespawn}s` : 'Ready';
    const researchStats = researchSummary();
    if($('sectorName')) $('sectorName').textContent=`${def.id}:`;
    if($('sectorObjective')) $('sectorObjective').textContent=`// Objective: ${def.objective}`;
    $('stats').innerHTML=`<div class="statrow stat-hero-line"><b>Player Lv. ${p.level}</b> // ${def.id} ${def.title}</div><div class="statrow">Credits ${p.credits} // Focus ${(skillList[state.combatStyle||'attack']||{}).name||'Attack'} // Upgrades ${upTotal}</div><div class="statrow">ATK ${stats.atk}+${stats.strBonus} // DEF ${stats.def} // Gear ${gearPower()} // Autosave ${saveAge}s</div><div class="statrow">Kills ${stageKills} // Research ${researchStats.discovered}/${researchStats.total}</div><div class="statrow">Respawn ${respawnText} // Research Kills ${researchStats.kills}</div><div class="statrow">HP ${p.hp}/${stats.maxHp}<div class="bar"><span style="width:${100*p.hp/stats.maxHp}%"></span></div></div><div class="statrow">EP ${p.ep}/${stats.maxEp||p.maxEp}<div class="bar ep"><span style="width:${100*p.ep/(stats.maxEp||p.maxEp)}%"></span></div></div><div class="statrow">Sync ${p.xp}/${p.nextXp}<div class="bar xp"><span style="width:${100*p.xp/p.nextXp}%"></span></div></div>`;
    $('fractureStatus').innerHTML=`<div class="statrow">Stage: ${def.id} // ${def.title}</div><div class="statrow">Required Lv: ${def.levelReq} // Threat: ${def.threat}</div><div class="statrow">Anomalies Cleared: ${anomalyClears}/3 // Total Kills ${stageKills}</div><div class="statrow">Respawn Queue: ${respawnText}</div><div class="statrow">Research: ${researchStats.discovered}/${researchStats.total} entries // ${researchStats.kills} kills // ${researchStats.ranks} ranks</div><div class="statrow">Boss Route: ${state.flags.bossUnlocked?'Unlocked':'Locked'}</div><div class="statrow">Boss Defeated: ${state.flags.bossDefeated?'Yes':'No'}</div><div class="statrow">Stage Clear: ${state.flags.chapterComplete?'Complete':'Active'}</div><div class="statrow">Checkpoint: ${state.checkpoint?.label || 'None'}</div><div class="statrow">Side Quest: ${safeHtml(sideQuestStatusText())}</div>`;
    $('inventory').innerHTML=Object.entries(state.inventory).map(([k,v])=>{
      const item=findItemRecord(k);
      return `<div class="invrow invrow-polished ${rarityClass(item.rarity)}" title="${item.desc}">${itemIconHtml(item,v)}<div><b>${k}</b><small>${item.rarity} // ${item.type}</small></div>${consumableButtonHtml(k) || (isEquipmentLike(item)?`<button onclick="window.AV.equipItem('${safeHtml(k)}')">Equip</button>`:'')}</div>`;
    }).join('')||'<div class="invrow">No recovered assets.</div>';
    $('log').innerHTML=state.log.map(l=>`<div class="logrow">${l}</div>`).join('');
    $('roster').innerHTML='<div class="statrow"><b>AV-001 Vyra</b><br>Active Operator</div>';
    const objectives=[['Reach recovery terminal',state.flags.terminal],[`Clear 3 anomalies (${anomalyClears}/3)`,anomalyClears>=3],['Unlock boss gate',state.flags.bossUnlocked],['Defeat boss',state.flags.bossDefeated],['Extract / Stage Complete',state.flags.chapterComplete]];
    const activeText=currentObjectiveText();
    const contract=activeContract();
    const contractLine=`📜 Contract: ${safeHtml(contract.title)} (${contract.progress}/${contract.target})${contract.complete?' — ready to claim':''}`;
    const questLine=safeHtml(sideQuestStatusText());
    $('objectiveTracker').innerHTML=`<b>${activeText}</b><br>` + objectives.map(([t,done])=>`${done?'✅':'⬜'} ${t}`).join(' &nbsp; ') + ` &nbsp; ${contractLine} &nbsp; 🧾 ${questLine}`;
    $('missionProgress').innerHTML=objectives.map(([t,done])=>`<div class="mission-row">${done?'✅':'⬜'} ${t}</div>`).join('') + `<div class="mission-row">${contract.complete?'✅':'⬜'} ${contractLine}</div><div class="mission-row">${questLine}</div>`;
    $('missionChecklist') && ($('missionChecklist').innerHTML=$('missionProgress').innerHTML);
    renderMissionContractPanel();
    $('missionActiveHint') && ($('missionActiveHint').textContent=activeText);
    $('qaState') && ($('qaState').innerHTML=`<div class="statrow">Stage: ${def.id} // ${def.title}</div><div class="statrow">Position: ${p.x}, ${p.y}</div><div class="statrow">HP: ${p.hp}/${stats.maxHp} // EP ${p.ep}/${stats.maxEp||p.maxEp}</div><div class="statrow">Map Version: ${state.mapVersion || MAP_VERSION}</div><div class="statrow">Flags: ${JSON.stringify(state.flags)}</div>`); renderQaStagePicker();
    renderFullscreenHud();
    renderObjectiveCompass();
    renderOperatorDb();
  }
  function renderAll(){render(); renderMini(); renderUI(); renderFullscreenHud();}
  function openOverlay(id){
    const target=$(id);
    if(!target){toast('Protocol missing: '+id); return;}

    const menu=$('mainMenu');
    const app=$('app');
    const openedFromGame = app && !app.classList.contains('hidden');
    const openedFromMenu = menu && !menu.classList.contains('hidden');
    uiState.returnStack.push(openedFromGame ? 'game' : openedFromMenu ? 'menu' : uiState.mode || 'menu');
    uiState.mode = 'overlay';

    if(openedFromMenu) menu.classList.add('hidden');
    if(openedFromGame) document.body.classList.add('game-active');

    document.querySelectorAll('.overlay').forEach(o=>{ o.classList.add('hidden'); o.style.display=''; });
    target.classList.remove('hidden');
    target.style.display='grid';
    target.style.zIndex='9000';
    target.style.pointerEvents='auto';
    document.body.classList.add('menu-protocol-open');
    AudioManager.play(activeMusicForState());

    try{
      if(id==='anomalyOverlay') renderAnomalyDb();
      if(id==='inventoryOverlay') renderInventoryDb();
      if(id==='operatorOverlay') renderOperatorDb();
      if(id==='fractureOverlay') renderFractureDb();
      if(id==='missionOverlay'){ renderUI(); renderMissionContractPanel(); }
      if(id==='playtestOverlay') renderUI();
      if(id==='progressionOverlay') renderProgressionDb();
      if(id==='configOverlay'){ renderSaveHub(); renderAudioMixer(); }
    }catch(err){
      console.error('Overlay render failed:', id, err);
      target.querySelector('.database-modal')?.insertAdjacentHTML('beforeend', `<p class="menu-info warn">Overlay opened, but a render error occurred: ${String(err.message||err)}</p>`);
    }

    const info=$('menuInfo');
    if(info){info.textContent='Protocol opened. Press Esc or Close to return.'; info.classList.add('ok');}
  }

  function closeOverlays(){
    document.querySelectorAll('.overlay').forEach(o=>{ o.classList.add('hidden'); o.style.display=''; });
    document.body.classList.remove('menu-protocol-open');
    const previous = uiState.returnStack.pop() || (gameStarted && !$('app').classList.contains('hidden') ? 'game' : 'menu');
    if(previous === 'game' && gameStarted){
      $('mainMenu').classList.add('hidden');
      $('app').classList.remove('hidden');
      document.body.classList.add('game-active','fullscreen-mode');
      uiState.mode='game';
      canvas.focus({preventScroll:true});
      renderAll();
    } else {
      $('app').classList.add('hidden');
      $('mainMenu').classList.remove('hidden');
      document.body.classList.remove('game-active');
      uiState.mode='menu';
    }
    AudioManager.play(activeMusicForState());
    const info=$('menuInfo');
    if(info){info.textContent='Select a database protocol.'; info.classList.remove('ok','warn');}
  }

  function getCreatureLibrary(){
    const anomalies = importedAnomalyRoster.map((x,i)=>({...x,id:displayId('AN', i),type:'Anomaly', icon:iconPathFor(x)}));
    const bosses = importedBossRoster.map((x,i)=>({...x,id:displayId('BOSS', i),type:'Boss', icon:iconPathFor(x)}));
    return anomalies.concat(bosses);
  }
  function showCreatureFile(d){
    ensureResearch();
    const img = d.battle;
    const icon = d.icon || iconPathFor(d);
    const research = researchLineForCreature(d);
    const rec = state.anomalyResearch?.[d.id] || null;
    const stageHistory = rec?.stages ? Object.entries(rec.stages).map(([stage,kills])=>`${stage}: ${kills}`).join(' // ') : 'Not encountered yet';
    $('anomalyFile').innerHTML=`<div class="creature-card-file"><div class="record-kicker">${d.id} // ${d.type||'Anomaly'}</div><h2>${d.name}</h2><div class="creature-preview"><img src="${img}" alt="${d.name}" onerror="this.onerror=null;this.src='${icon}'"></div><div class="record-grid"><div><b>HP</b><span>${d.hp}</span></div><div><b>ATK</b><span>${d.atk}</span></div><div><b>Credits</b><span>${d.credits}</span></div><div><b>Loot</b><span>${(d.loot||[]).join(', ')}</span></div><div><b>Research Kills</b><span>${research.kills}</span></div><div><b>Research Rank</b><span>${research.rank}/${RESEARCH_THRESHOLDS.length}</span></div><div><b>Next Reward</b><span>${research.next ? research.kills+'/'+research.next+' kills' : 'Complete'}</span></div><div><b>Seen In</b><span>${stageHistory}</span></div></div><div class="protocol-list"><div><b>Battle Asset</b><span>${img}</span></div><div><b>Icon Asset</b><span>${icon}</span></div><div><b>Research Rewards</b><span>Ranks unlock at ${RESEARCH_THRESHOLDS.join(', ')} kills and grant credits, Anomaly Hunting XP, and supplies.</span></div><div><b>Pipeline Status</b><span>Imported creature library // active in Fracture encounters.</span></div></div><p class="fineprint">This creature is loaded from the imported monster/boss library and can be assigned to any Fracture encounter tile.</p></div>`;
  }
  function renderAnomalyDb(){
    ensureResearch();
    const all = getCreatureLibrary();
    const summary = researchSummary();
    $('anomalyList').innerHTML=`<div class="creature-tools"><input id="creatureSearch" placeholder="Search anomalies / bosses..."><select id="creatureFilter"><option value="all">All records</option><option value="Anomaly">Anomalies</option><option value="Boss">Bosses</option><option value="Chapter 1">Chapter 1</option></select><div class="creature-count"></div><div class="fineprint">Research: ${summary.discovered}/${summary.total} entries // ${summary.kills} total kills // ${summary.ranks} ranks</div></div><div id="creatureListButtons" class="creature-list-buttons"></div>`;
    const drawList=()=>{
      const q=($('creatureSearch').value||'').toLowerCase();
      const f=$('creatureFilter').value;
      const filtered=all.filter(d=>(f==='all'||d.type===f) && (`${d.id} ${d.name}`.toLowerCase().includes(q)));
      document.querySelector('#anomalyList .creature-count').textContent=`${filtered.length} / ${all.length} records`;
      $('creatureListButtons').innerHTML=filtered.slice(0,160).map((d,i)=>{ const r=researchLineForCreature(d); return `<button data-id="${d.id}"><span>${d.id}</span><b>${d.name}</b><small>${r.kills} kills // Rank ${r.rank}</small></button>`; }).join('') || '<p class="menu-info">No matching records.</p>';
      document.querySelectorAll('#creatureListButtons button').forEach(b=>b.onclick=()=>showCreatureFile(all.find(d=>d.id===b.dataset.id)));
      if(filtered[0]) showCreatureFile(filtered[0]);
    };
    $('creatureSearch').oninput=drawList; $('creatureFilter').onchange=drawList; drawList();
  }


  function renderFractureDb(){
    const host=document.querySelector('#fractureOverlay .fracture-grid');
    if(!host) return;
    let panel=$('stageSelectPanel');
    if(!panel){
      panel=document.createElement('section'); panel.id='stageSelectPanel'; panel.className='fracture-card stage-select-panel'; host.prepend(panel);
    }
    ensureProgression(); unlockNextStages();
    panel.innerHTML=`<div class="record-kicker">FRACTURE ROUTE SELECT</div><h2>Stage / Map System</h2><p>Stages save to localStorage. Clear a fracture, meet the Player Level requirement, then launch the next map from here.</p><div class="stage-grid">${Object.entries(STAGE_DEFS).map(([key,d])=>{
      const unlocked=playerMeetsStageRequirement(key);
      const active=currentStageKey()===key;
      const complete=!!state.stages[key]?.complete;
      const kills=state.bossKills?.[key] || 0;
      return `<button class="stage-card ${active?'active':''} ${unlocked?'':'locked'}" data-stage="${key}" ${unlocked?'':'disabled'}><b>${d.id}</b><span>${d.title}</span><small>${d.chapter} // Req Lv. ${d.levelReq}</small><small>${complete?'Complete':(unlocked?'Available':'Locked')} // ${d.threat} // Boss Kills ${kills}</small><small>Objective: ${d.objective}</small><small>Reward: ${d.reward}</small><em>${unlocked?(active?'Current':'Start Stage'):'Locked'}</em></button>`;
    }).join('')}</div>`;
    panel.querySelectorAll('[data-stage]').forEach(btn=>btn.onclick=()=>loadStage(btn.dataset.stage));
  }

  function renderUpgradeStation(){
    const root=$('upgradeStation');
    if(!root) return;
    ensureProgression();
    const rows=Object.entries(UPGRADE_DEFS).map(([key,d])=>{
      const rank=state.upgrades[key]||0;
      const maxed=rank>=d.max;
      const cost=upgradeCost(key);
      return `<div class="upgrade-card ${maxed?'maxed':''}"><div><b>${safeHtml(d.name)}</b><span>Rank ${rank}/${d.max} // ${safeHtml(d.desc)}</span><div class="upgrade-pips">${Array.from({length:d.max},(_,i)=>`<i class="${i<rank?'on':''}"></i>`).join('')}</div></div><button data-upgrade="${key}" ${maxed?'disabled':''}>${maxed?'MAX':cost+' credits'}</button></div>`;
    }).join('');
    root.innerHTML=`<h3>Operator Upgrade Matrix</h3><p class="menu-info">Spend recovered credits to permanently improve Vyra. Checkpoints preserve purchased upgrades.</p>${rows}<div class="upgrade-statline">ATK ${state.player.atk} // DEF ${state.player.def} // HP ${state.player.maxHp} // EP ${state.player.maxEp}</div>`;
    root.querySelectorAll('[data-upgrade]').forEach(btn=>btn.onclick=()=>buyUpgrade(btn.dataset.upgrade));
  }

  function renderProgressionDb(){
    ensureProgression(); unlockNextStages();
    const styleKeys = ['attack','strength','defense','health','magic','ranged'];
    if($('combatStylePicker')) $('combatStylePicker').innerHTML = styleKeys.map(k => {
      const active = state.combatStyle === k ? ' active' : '';
      const d=state.skillData[k];
      return `<button class="style-card${active}" data-style="${k}">${skillEmblem(k)}<span><b>${skillList[k].name}</b><small>Lv. ${d.level}</small></span></button>`;
    }).join('');
    document.querySelectorAll('#combatStylePicker [data-style]').forEach(b => b.onclick = () => setCombatStyle(b.dataset.style));
    const rows = Object.entries(skillList).map(([k,info]) => {
      const d = state.skillData[k] || {xp:0,level:1};
      const next=skillXpToNext(k);
      return `<div class="skill-row ${info.type}">${skillEmblem(k)}<div><b>${info.name} <em>${info.short}</em></b><span>${info.type.toUpperCase()} // Lv. ${d.level}/99 // XP ${d.xp.toLocaleString()} // ${d.level>=99?'MAX':next.remaining.toLocaleString()+' to next'}</span><div class="bar xp"><span style="width:${next.pct}%"></span></div><small>${info.bonus}</small></div></div>`;
    }).join('');
    if($('progressionList')) $('progressionList').innerHTML = rows;
    renderUpgradeStation();
    renderFractureDb();
  }

  function findItemRecord(name){
    const found = coreItemRegistry.find(i=>i.name===name) || importedItemRegistry.find(i=>i.name===name);
    if(found) return normalizeItem(found);
    return normalizeItem({name, asset:'assets/items/scrap_metal.png', rarity:'Common', type:'Recovered Asset', description:'Recovered item registered by AVOS.'});
  }
  function normalizeItem(item){
    const base = {
      ...item,
      type: item.type || item.category || 'Item',
      rarity: item.rarity || rarityFromCategory(item.category),
      desc: item.desc || item.description || item.effect?.description || 'No field notes available.',
      stackSize: item.stackSize || item.stack || (item.type === 'Equipment' ? 1 : 999),
      sellPrice: item.sellPrice || item.value || 0
    };
    const slot=normalizeEquipSlot(base.slot, base.type);
    if(slot){
      base.equipSlot=slot;
      base.stats = base.stats || generatedGearStats(base);
      base.levelReq = gearLevelReq(base);
      if(!String(base.desc||'').includes('Stats:')) base.desc = `${base.desc} Stats: ${statSummary(base.stats)}. Requires Player Lv. ${base.levelReq}.`;
    }
    return base;
  }
  function rarityFromCategory(category){
    const c = String(category||'').toLowerCase();
    if(c.includes('archive')) return 'Rare';
    if(c.includes('shard')) return 'Epic';
    if(c.includes('key')) return 'Uncommon';
    if(c.includes('catalyst')) return 'Rare';
    if(c.includes('consumable')) return 'Common';
    return 'Common';
  }
  function rarityClass(rarity){ return `rarity-${String(rarity||'common').toLowerCase().replace(/\s+/g,'-')}`; }
  function itemIconHtml(item, qty=''){
    const count = qty ? `<span class="item-qty">x${qty}</span>` : '';
    return `<div class="item-icon-shell ${rarityClass(item.rarity)}"><img src="${item.asset}" alt="${item.name}">${count}</div>`;
  }
  function renderInventoryDb(){
    const owned = Object.entries(state.inventory).map(([k,v])=>{
      const item=findItemRecord(k);
      return `<button class="owned-item ${rarityClass(item.rarity)}" data-item-name="${k}" title="${item.desc}">${itemIconHtml(item,v)}<div><b>${k}</b><span>${item.rarity} // ${item.type}</span><small>${item.desc}</small></div>${(k==='Med Patch'||k==='Vector Cell')?'<em>Usable</em>':(Object.values(state.equipment||{}).includes(k)?'<em>Equipped</em>':(isEquipmentLike(item)?'<em>Gear</em>':'<em>Stored</em>'))}</button>`;
    }).join('') || '<div class="invrow">No recovered assets yet.</div>';
    const fullRegistry=[...coreItemRegistry.map(normalizeItem), ...importedItemRegistry.map(normalizeItem)];
    const stats=combatStatBlock(); const epMax=stats.maxEp||state.player.maxEp; const equipmentPanel=renderEquipmentPanel(); const workshopPanel=renderWorkshopPanel(); const dropLogPanel=renderDropLogPanel(); const skillMini=['attack','strength','defense','health'].map(k=>{const d=state.skillData[k]; return `<div>${skillEmblem(k)}<span>${skillList[k].short} Lv ${d.level}</span></div>`}).join('');
    $('inventoryDatabaseList').innerHTML=`
      <div class="inventory-hero-panel"><div><div class="record-kicker">OPERATOR STATUS</div><h2>Vyra // Player Lv. ${state.player.level}</h2><p>HP ${state.player.hp}/${stats.maxHp} // EP ${state.player.ep}/${epMax} // Credits ${state.player.credits}</p><div class="record-grid"><div><b>ATK</b><span>${stats.atk}+${stats.strBonus}</span></div><div><b>DEF</b><span>${stats.def}</span></div><div><b>Stage</b><span>${stageDef().id}</span></div><div><b>Save</b><span>${state.lastSave?new Date(state.lastSave).toLocaleTimeString():'new'}</span></div></div></div><div class="inventory-skill-strip">${skillMini}</div></div>${equipmentPanel}${workshopPanel}${dropLogPanel}<div class="item-tools">
        <input id="itemSearch" placeholder="Search items / weapons / armor...">
        <div class="item-filter-row">
          <select id="itemFilter"><option value="all">All categories</option><option value="Weapon">Weapons</option><option value="Equipment">Equipment</option><option value="Consumable">Consumables</option><option value="Material">Materials</option><option value="Key Item">Key Items</option><option value="Archive">Archives</option><option value="Shard">Operator Shards</option></select>
          <select id="rarityFilter"><option value="all">All rarities</option><option>Common</option><option>Uncommon</option><option>Rare</option><option>Epic</option><option>Legendary</option><option>Mythic</option><option>Relic</option><option>Singularity</option></select>
        </div>
        <div class="item-count"></div>
      </div>
      <div class="inventory-layout-pro">
        <section class="owned-items"><h3>Recovered Assets</h3><div class="owned-grid">${owned}</div></section>
        <section class="item-detail-panel" id="itemDetailPanel"><div class="record-kicker">ITEM FILE</div><h2>Select an item</h2><p>Choose a recovered asset or registry entry to inspect its data.</p></section>
      </div>
      <h3>Full Item Registry</h3>
      <div id="itemRegistryButtons" class="item-grid"></div>`;
    const showItemDetail=(itemNameOrId)=>{
      const item = fullRegistry.find(d=>d.id===itemNameOrId || d.name===itemNameOrId) || findItemRecord(itemNameOrId);
      $('itemDetailPanel').innerHTML=`<div class="record-kicker">${item.id || 'RECOVERED'} // ${item.rarity}</div><div class="item-detail-top">${itemIconHtml(item)}<div><h2>${item.name}</h2><p>${item.type} ${item.category?`// ${item.category}`:''} ${item.equipSlot?`// ${item.equipSlot}`:''}</p></div></div><p>${item.desc}</p><div class="record-grid"><div><b>Stack</b><span>${item.stackSize}</span></div><div><b>Sell</b><span>${item.sellPrice} credits</span></div><div><b>Req Lv</b><span>${item.levelReq || '-'}</span></div><div><b>Asset</b><span>${item.asset}</span></div></div>${item.equipSlot?`<div class="gear-compare"><b>Stats</b><span>${statSummary(item.stats)}</span><small>Current ${item.equipSlot}: ${state.equipment?.[item.equipSlot] || 'Empty'}</small></div><button onclick="window.AV.equipItem('${safeHtml(item.name)}')">Equip ${item.equipSlot}</button>`:''}${consumableButtonHtml(item.name)}`;
    };
    const drawItems=()=>{
      const q=($('itemSearch').value||'').toLowerCase();
      const f=$('itemFilter').value;
      const rf=$('rarityFilter').value;
      const filtered=fullRegistry.filter(d=>(f==='all'||d.type===f||d.category===f) && (rf==='all'||d.rarity===rf) && (`${d.id} ${d.name} ${d.category||''} ${d.slot||''} ${d.rarity||''}`.toLowerCase().includes(q)));
      document.querySelector('#inventoryDatabaseList .item-count').textContent=`${filtered.length} / ${fullRegistry.length} item records`;
      $('itemRegistryButtons').innerHTML=filtered.slice(0,240).map(d=>`<button class="item-card ${rarityClass(d.rarity)}" data-item-id="${d.id}" title="${d.desc}">${itemIconHtml(d)}<span>${d.id}</span><b>${d.name}</b><em>${d.rarity} ${d.type}</em><small>${d.category||d.status||'registered'}${d.slot?' // '+d.slot:''}</small></button>`).join('') || '<p class="menu-info">No matching items.</p>';
      document.querySelectorAll('#itemRegistryButtons .item-card').forEach(btn=>btn.onclick=()=>showItemDetail(btn.dataset.itemId));
    };
    document.querySelectorAll('#inventoryDatabaseList .owned-item').forEach(btn=>btn.onclick=()=>showItemDetail(btn.dataset.itemName));
    $('itemSearch').oninput=drawItems; $('itemFilter').onchange=drawItems; $('rarityFilter').onchange=drawItems; drawItems();
    const firstOwned = Object.keys(state.inventory)[0]; if(firstOwned) showItemDetail(firstOwned);
  }

  // v82: phone/mobile playability helpers.
  // Keeps the canvas scaled to the phone viewport, adds hold-to-walk touch movement,
  // and exposes the important hotkeys as tap buttons.
  let mobileMoveTimer = null;
  let mobileResizeTimer = null;
  function isPhoneLike(){
    return window.matchMedia && window.matchMedia('(max-width: 900px), (pointer: coarse)').matches;
  }
  function setMobilePlayMode(){
    const mobile = isPhoneLike();
    document.body.classList.toggle('mobile-play', !!mobile);
    if(mobile && gameStarted && uiState.mode === 'game'){
      document.body.classList.add('fullscreen-mode');
      ensureMobileActionPad();
    }
    try{ canvas.style.touchAction = 'none'; }catch(err){}
    clearTimeout(mobileResizeTimer);
    mobileResizeTimer = setTimeout(()=>{ try{ renderAll(); }catch(err){} }, 90);
  }
  function moveByName(dir){
    const moves={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]};
    const m=moves[dir];
    if(!m) return;
    tryMove(m[0],m[1]);
  }
  function stopMobileMove(){
    if(mobileMoveTimer){ clearInterval(mobileMoveTimer); mobileMoveTimer=null; }
  }
  function bindMobileMoveButtons(){
    document.querySelectorAll('[data-move]').forEach(btn=>{
      if(btn.dataset.mobileBound === '1') return;
      btn.dataset.mobileBound = '1';
      btn.setAttribute('type','button');
      const start=(e)=>{
        if(e){ e.preventDefault(); e.stopPropagation(); }
        AudioManager.unlock();
        stopMobileMove();
        moveByName(btn.dataset.move);
        mobileMoveTimer=setInterval(()=>moveByName(btn.dataset.move), 210);
        try{ btn.setPointerCapture && e.pointerId != null && btn.setPointerCapture(e.pointerId); }catch(err){}
      };
      const stop=(e)=>{ if(e){ e.preventDefault(); e.stopPropagation(); } stopMobileMove(); };
      btn.addEventListener('pointerdown', start, {passive:false});
      btn.addEventListener('touchstart', start, {passive:false});
      ['pointerup','pointercancel','pointerleave','touchend','touchcancel'].forEach(evt=>btn.addEventListener(evt, stop, {passive:false}));
      btn.addEventListener('click', e=>{ e.preventDefault(); e.stopPropagation(); }, {passive:false});
    });
  }
  function ensureMobileActionPad(){
    if(document.getElementById('mobileActionPad')) return;
    const pad=document.createElement('div');
    pad.id='mobileActionPad';
    pad.className='mobile-action-pad';
    pad.innerHTML=`
      <button type="button" data-mobile-action="talk"><b>E</b><span>Talk</span></button>
      <button type="button" data-mobile-action="med"><b>Q</b><span>HP</span></button>
      <button type="button" data-mobile-action="cell"><b>R</b><span>EP</span></button>
      <button type="button" data-mobile-action="track"><b>N</b><span>Target</span></button>
      <button type="button" data-mobile-action="inv"><b>I</b><span>Inv</span></button>
      <button type="button" data-mobile-action="map"><b>M</b><span>Map</span></button>`;
    document.body.appendChild(pad);
    pad.querySelectorAll('button').forEach(btn=>{
      btn.addEventListener('pointerdown', e=>{
        e.preventDefault(); e.stopPropagation();
        AudioManager.unlock();
        const action=btn.dataset.mobileAction;
        if(action==='talk') interactNearbyNpc();
        if(action==='med') useMedPatch();
        if(action==='cell') useVectorCell();
        if(action==='track') showObjectivePing();
        if(action==='inv') openOverlay('inventoryOverlay');
        if(action==='map') toggleSideHud();
      }, {passive:false});
    });
  }
  function setupMobilePlayability(){
    bindMobileMoveButtons();
    ensureMobileActionPad();
    ensureMobileBattlePad();
    setMobilePlayMode();
    window.addEventListener('resize', setMobilePlayMode, {passive:true});
    window.addEventListener('orientationchange', () => setTimeout(setMobilePlayMode, 220), {passive:true});
    window.addEventListener('blur', stopMobileMove, {passive:true});
    document.addEventListener('visibilitychange', () => { if(document.hidden) stopMobileMove(); });
  }


  // v83: mobile battle quick pad. Gives phone players tappable combat shortcuts
  // without relying on tiny keyboard-style hotkeys during fights.
  function setBattleMobileMode(on){
    document.body.classList.toggle('battle-mode', !!on);
    if(on) ensureMobileBattlePad();
  }
  function ensureMobileBattlePad(){
    if(document.getElementById('mobileBattlePad')) return;
    const pad=document.createElement('div');
    pad.id='mobileBattlePad';
    pad.className='mobile-battle-pad';
    pad.innerHTML=`
      <button type="button" data-battle-action="atk1"><b>1</b><span>Slash</span></button>
      <button type="button" data-battle-action="atk2"><b>2</b><span>Dash</span></button>
      <button type="button" data-battle-action="atk3"><b>3</b><span>Crimson</span></button>
      <button type="button" data-battle-action="atk4"><b>4</b><span>Flex</span></button>
      <button type="button" data-battle-action="over"><b>U</b><span>Ultra</span></button>
      <button type="button" data-battle-action="guard"><b>G</b><span>Guard</span></button>
      <button type="button" data-battle-action="cell"><b>R</b><span>EP</span></button>`;
    document.body.appendChild(pad);
    pad.querySelectorAll('button').forEach(btn=>{
      btn.addEventListener('pointerdown', e=>{
        e.preventDefault(); e.stopPropagation();
        AudioManager.unlock();
        if(!battle || battle.turn !== 'player') return;
        const action=btn.dataset.battleAction;
        if(action && action.startsWith('atk')) playerAttack(Number(action.slice(3))-1);
        if(action==='over') useOverdriveBattle();
        if(action==='guard') guardBattle();
        if(action==='cell') useVectorCellBattle();
      }, {passive:false});
    });
  }

  function showFullscreenHint(msg){
    const old=document.querySelector('.fullscreen-hint'); if(old) old.remove();
    const h=document.createElement('div'); h.className='fullscreen-hint'; h.textContent=msg; document.body.appendChild(h); setTimeout(()=>h.remove(),2300);
  }
  async function toggleFullscreenMode(){
    document.body.classList.toggle('fullscreen-mode');
    const wantFs=document.body.classList.contains('fullscreen-mode');
    try{
      if(wantFs && !document.fullscreenElement && document.documentElement.requestFullscreen){ await document.documentElement.requestFullscreen(); }
      if(!wantFs && document.fullscreenElement && document.exitFullscreen){ await document.exitFullscreen(); }
    }catch(err){ /* Browser may block fullscreen unless user clicked. CSS mode still works. */ }
    if(wantFs){ showFullscreenHint('Fullscreen layout on • browser fullscreen starts after click/Enter'); }
    else { showFullscreenHint('Fullscreen mode off'); }
    setTimeout(()=>{ try{ canvas.focus({preventScroll:true}); }catch(e){} renderAll(); },80);
  }

  function ensureFullscreenUi(){
    if(!document.getElementById('fsQuickbar')){
      const q=document.createElement('div');
      q.id='fsQuickbar';
      q.className='fullscreen-quickbar';
      q.innerHTML=`
        <button data-hot="map"><b>M</b>Map</button>
        <button data-hot="inv"><b>I</b>Inventory</button>
        <button data-hot="db"><b>V</b>Anomalies</button>
        <button data-hot="op"><b>O</b>Operator</button>
        <button data-hot="prog"><b>P</b>Progress</button>
        <button data-hot="brief"><b>B</b>Briefing</button>
        <button data-hot="help"><b>H</b>Help</button>`;
      document.body.appendChild(q);
      q.querySelector('[data-hot="map"]').onclick=toggleSideHud;
      q.querySelector('[data-hot="inv"]').onclick=()=>openOverlay('inventoryOverlay');
      q.querySelector('[data-hot="db"]').onclick=()=>openOverlay('anomalyOverlay');
      q.querySelector('[data-hot="op"]').onclick=()=>openOverlay('operatorOverlay');
      q.querySelector('[data-hot="prog"]').onclick=()=>openOverlay('progressionOverlay');
      q.querySelector('[data-hot="brief"]').onclick=()=>openOverlay('missionOverlay');
      q.querySelector('[data-hot="help"]').onclick=toggleFullscreenHelp;
    }
    if(!document.getElementById('fsPersistentStats')){ const ps=document.createElement('div'); ps.id='fsPersistentStats'; ps.className='fs-persistent-stats'; document.body.appendChild(ps); }
    if(!document.getElementById('fsSidehud')){
      const h=document.createElement('div');
      h.id='fsSidehud';
      h.className='fullscreen-sidehud hidden';
      h.innerHTML=`<h3>Field HUD</h3><div id="fsHudStats" class="fs-mini-section"></div><canvas id="fsMinimap" width="300" height="120" class="minimap"></canvas><div class="mini-hint">M hides this panel. I opens inventory. V opens database.</div>`;
      document.body.appendChild(h);
    }
    if(!document.getElementById('fsHelp')){
      const help=document.createElement('div');
      help.id='fsHelp';
      help.className='fullscreen-help hidden';
      help.innerHTML=`<b>ASH VECTOR HOTKEYS</b><br><kbd>Arrow Keys</kbd>/<kbd>WASD</kbd> Move <kbd>M</kbd> Map/HUD <kbd>I</kbd> Inventory <kbd>V</kbd> Anomaly Database <kbd>O</kbd> Operator <kbd>P</kbd> Progress <kbd>B</kbd> Mission <kbd>F</kbd> Fullscreen <kbd>N</kbd> Target Ping <kbd>Q</kbd> Med Patch <kbd>R</kbd> Vector Cell <kbd>Esc</kbd> Close panels`;
      document.body.appendChild(help);
    }
  }
  function toggleSideHud(){ ensureFullscreenUi(); const el=$('fsSidehud'); el.classList.toggle('hidden'); renderFullscreenHud(); }
  function toggleFullscreenHelp(){ ensureFullscreenUi(); $('fsHelp').classList.toggle('hidden'); }
  function renderFullscreenHud(){
    ensureProgression(); const p=state.player; const s=combatStatBlock(); const def=stageDef();
    const persist=$('fsPersistentStats'); if(persist){ persist.innerHTML=`<b>Lv ${p.level}</b><span>HP ${p.hp}/${s.maxHp}</span><span>EP ${p.ep}/${s.maxEp||p.maxEp}</span><em>${def.id}</em>`; }
    const hud=$('fsSidehud'); if(!hud || hud.classList.contains('hidden')) return;
    $('fsHudStats').innerHTML=`
      <div class="fs-row"><b>Vyra</b><br>Player Lv ${p.level} // Credits ${p.credits}</div>
      <div class="fs-row">HP ${p.hp}/${s.maxHp}<div class="bar"><span style="width:${100*p.hp/s.maxHp}%"></span></div></div>
      <div class="fs-row">EP ${p.ep}/${s.maxEp||p.maxEp}<div class="bar ep"><span style="width:${100*p.ep/(s.maxEp||p.maxEp)}%"></span></div></div>
      <div class="fs-row">ATK ${s.atk}+${s.strBonus} // DEF ${s.def}<br>Anomalies: ${Math.min(3, state.flags.anomaliesCleared||0)}/3 // Kills ${(state.enemyKills||{})[def.key]||0} // Boss: ${state.flags.bossUnlocked?'Open':'Locked'}<br>Contract: ${activeContract().progress}/${activeContract().target}</div>`;
    const c=$('fsMinimap'); if(!c) return;
    const x=c.getContext('2d'); const w=c.width,h=c.height; x.clearRect(0,0,w,h); const rows=state.map.length, cols=state.map[0].length; const sx=w/cols, sy=h/rows;
    for(let y=0;y<rows;y++)for(let xx=0;xx<cols;xx++){const t=tileAt(xx,y); x.fillStyle=t==='#'?'#303944':t==='C'?'#c49328':t==='E'||t==='B'?'#9d1b2a':t==='X'?'#fff':'#10151b'; x.fillRect(xx*sx,y*sy,Math.max(1,sx),Math.max(1,sy));}
    const navTarget=objectiveTarget();
    if(navTarget && navTarget.x != null){ x.strokeStyle='#00d9ff'; x.lineWidth=2; x.strokeRect(navTarget.x*sx-1,navTarget.y*sy-1,Math.max(4,sx*3),Math.max(4,sy*3)); }
    x.fillStyle='#ff3048'; x.fillRect(state.player.x*sx,state.player.y*sy,Math.max(3,sx*2),Math.max(3,sy*2));
  }
  function applySettings(){ ensureSettings(); document.body.classList.toggle('no-crt', !state.settings.crt); document.body.classList.toggle('reduced-motion', !!state.settings.reducedMotion); document.body.classList.toggle('large-text', !!state.settings.largeText); applyAudioSettings(); }
  let autosaveStarted=false;
  function startAutosave(){
    if(autosaveStarted) return;
    autosaveStarted=true;
    setInterval(()=>{ if(!$('app').classList.contains('hidden')) save(true); }, 30000);
    setInterval(()=>{ processRespawns(); renderUI(); }, 1000);
    setInterval(processRespawns, 500);
  }

  // v47: hard menu router. This runs in capture phase so menu protocols work
  // even if old button handlers, overlays, or fullscreen CSS intercept clicks.
  function menuProtocolFallback(title, body){
    let panel=$('protocolQuickPanel');
    if(!panel){
      panel=document.createElement('div');
      panel.id='protocolQuickPanel';
      panel.className='overlay protocol-quick-panel hidden';
      panel.innerHTML=`<div class="database-modal avos-crt"><button id="closeProtocolQuick" class="modal-close">Close</button><div class="db-header"><div id="protocolQuickTitle">ASH VECTOR DATABASE</div><div>MENU PROTOCOL // v47</div></div><div id="protocolQuickBody" class="fracture-card"></div></div>`;
      document.body.appendChild(panel);
      $('closeProtocolQuick').onclick=()=>{ panel.classList.add('hidden'); document.body.classList.remove('menu-protocol-open'); };
    }
    $('protocolQuickTitle').textContent=title;
    $('protocolQuickBody').innerHTML=body;
    panel.classList.remove('hidden');
    document.body.classList.add('menu-protocol-open');
  }
  function routeMainMenuAction(id){
    const info=$('menuInfo');
    if(info){ info.textContent='Protocol opened. Press Esc or Close to return.'; info.classList.add('ok'); }
    const routes={
      continueBtn:()=>{ try{load();}catch(err){} startGame(false); },
      newGameBtn:()=>startGame(true),
      fractureIndexBtn:()=>openOverlay('fractureOverlay'),
      operatorFilesBtn:()=>openOverlay('operatorOverlay'),
      anomalyIndexBtn:()=>openOverlay('anomalyOverlay'),
      inventoryDbBtn:()=>openOverlay('inventoryOverlay'),
      progressionBtn:()=>openOverlay('progressionOverlay'),
      missionMenuBtn:()=>openOverlay('missionOverlay'),
      configBtn:()=>openOverlay('configOverlay'),
      menuFullscreenBtn:()=>toggleFullscreenMode()
    };
    if(routes[id]){ routes[id](); return true; }
    menuProtocolFallback('ASH VECTOR DATABASE', `<h2>${id}</h2><p>Protocol route missing. This fallback confirms the button is clickable.</p>`);
    return true;
  }

  function bind(){
    document.addEventListener('click', e=>{
      const btn=e.target.closest && e.target.closest('#mainMenu button, #launchStart');
      if(!btn || $('mainMenu').classList.contains('hidden')) return;
      e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
      routeMainMenuAction(btn.id || 'newGameBtn');
    }, true);
    $('enterBtn').onclick=()=>{requestNativeFullscreen(); showMenu();}; document.addEventListener('keydown',e=>{
      if(storyActive && ['Enter',' ','Escape'].includes(e.key)){ e.preventDefault(); if(e.key==='Escape') finishStory(); else advanceStory(); return; }
      const gameIsOpen = !$('app').classList.contains('hidden');
      const overlayOpen = Array.from(document.querySelectorAll('.overlay')).some(o=>!o.classList.contains('hidden'));
      // v44: hard launch fallback. If the main menu is visible, Enter or Space always starts gameplay.
      if((e.key==='Enter'||e.key===' ') && !$('mainMenu').classList.contains('hidden')){ e.preventDefault(); startGame(true); return; }
      if(e.key==='Enter' && bootDone && !$('bootScreen').classList.contains('hidden')){ e.preventDefault(); showMenu(); return; }
      if(e.key==='F9'){ e.preventDefault(); openOverlay('playtestOverlay'); return; }
      if(battle && !$('battleOverlay').classList.contains('hidden')){
        const tag = (e.target && e.target.tagName || '').toLowerCase();
        const typingTarget = ['input','textarea','select'].includes(tag) || (e.target && e.target.isContentEditable);
        const key = String(e.key || '').toLowerCase();
        if(!typingTarget){
          if(['1','2','3','4'].includes(key)){ e.preventDefault(); playerAttack(Number(key)-1); return; }
          if(key==='5' || key==='u'){ e.preventDefault(); useOverdriveBattle(); return; }
          if(key==='r'){ e.preventDefault(); useVectorCellBattle(); return; }
          if(key==='g'){ e.preventDefault(); guardBattle(); return; }
        }
      }
      if(e.key==='Escape' && overlayOpen){ e.preventDefault(); closeOverlays(); return; }
      if((e.key==='f'||e.key==='F') && gameIsOpen){ e.preventDefault(); toggleFullscreenMode(); return; }
      if(gameIsOpen && !overlayOpen){
        const tag = (e.target && e.target.tagName || '').toLowerCase();
        const typingTarget = ['input','textarea','select'].includes(tag) || (e.target && e.target.isContentEditable);
        const key = String(e.key || '').toLowerCase();
        const code = String(e.code || '').toLowerCase();
        const moveKey = {
          arrowup:[0,-1], arrowdown:[0,1], arrowleft:[-1,0], arrowright:[1,0],
          w:[0,-1], keyw:[0,-1], s:[0,1], keys:[0,1], a:[-1,0], keya:[-1,0], d:[1,0], keyd:[1,0]
        };
        const move = !typingTarget && (moveKey[key] || moveKey[code]);
        if(move){
          e.preventDefault();
          e.stopPropagation();
          const [mx,my]=move;
          tryMove(mx,my);
          return;
        }
        if(key==='e'){ e.preventDefault(); interactNearbyNpc(); return; }
        if(key==='n'){ e.preventDefault(); showObjectivePing(); return; }
        if(key==='m'){ e.preventDefault(); toggleSideHud(); return; }
        if(key==='i'){ e.preventDefault(); openOverlay('inventoryOverlay'); return; }
        if(key==='v'){ e.preventDefault(); openOverlay('anomalyOverlay'); return; }
        if(key==='o'){ e.preventDefault(); openOverlay('operatorOverlay'); return; }
        if(key==='p'){ e.preventDefault(); openOverlay('progressionOverlay'); return; }
        if(key==='b'){ e.preventDefault(); openOverlay('missionOverlay'); return; }
        if(key==='h'){ e.preventDefault(); toggleFullscreenHelp(); return; }
        if(key==='q'){ e.preventDefault(); useMedPatch(); return; }
        if(key==='r'){ e.preventDefault(); useVectorCell(); return; }
      }
      if(e.key==='Escape' && document.body.classList.contains('fullscreen-mode')){ e.preventDefault(); document.body.classList.remove('fullscreen-mode'); if(document.fullscreenElement && document.exitFullscreen){ document.exitFullscreen().catch(()=>{}); } showFullscreenHint('Fullscreen mode off'); renderAll(); return; }
    }, {passive:false});
    $('newGameBtn').onclick=(e)=>{e.preventDefault(); startGame(true);}; $('continueBtn').onclick=()=>{try{load();}catch(err){} startGame(false)};
    // v44: if CSS/content gets clipped, clicking the main menu card outside a protocol button also starts.
    $('mainMenu').addEventListener('dblclick',()=>startGame(true)); $('menuBtn').onclick=showMenu; $('saveBtn').onclick=save; $('loadBtn').onclick=load; $('resetBtn').onclick=()=>{localStorage.removeItem('ashVectorSave'); state=newGameState(); renderAll(); renderSaveHub(); toast('Archive purged.');};
    if($('fullscreenBtn')) $('fullscreenBtn').onclick=toggleFullscreenMode; if($('menuFullscreenBtn')) $('menuFullscreenBtn').onclick=toggleFullscreenMode;
    $('operatorFilesBtn').onclick=()=>openOverlay('operatorOverlay'); $('anomalyIndexBtn').onclick=()=>openOverlay('anomalyOverlay'); $('fractureIndexBtn').onclick=()=>openOverlay('fractureOverlay'); $('inventoryDbBtn').onclick=()=>openOverlay('inventoryOverlay'); $('progressionBtn').onclick=()=>openOverlay('progressionOverlay'); $('progressionTopBtn').onclick=()=>openOverlay('progressionOverlay'); $('missionMenuBtn').onclick=()=>openOverlay('missionOverlay'); $('missionBtn').onclick=()=>openOverlay('missionOverlay'); $('configBtn').onclick=()=>openOverlay('configOverlay'); $('playtestBtn').onclick=()=>openOverlay('playtestOverlay');
    ['operatorFilesBtn','anomalyIndexBtn','fractureIndexBtn','inventoryDbBtn','progressionBtn','missionMenuBtn','configBtn'].forEach(id=>{ const btn=$(id); if(btn) btn.addEventListener('click',(e)=>{ e.preventDefault(); e.stopPropagation(); const info=$('menuInfo'); if(info){ info.textContent='Protocol opened. Press Esc or Close to return.'; info.classList.add('ok'); } }); });
    ['closeOperatorDb','closeAnomalyDb','closeFractureDb','closeInventoryDb','closeProgression','closeMission','closePlaytest','closeConfig'].forEach(id=>$(id) && ($(id).onclick=closeOverlays));
    bindMobileMoveButtons(); setupMobilePlayability();
    canvas.addEventListener('click', handleCanvasNpcClick);
    $('settingCrt').onchange=e=>{state.settings.crt=e.target.checked;applySettings();queueAutosave();}; $('settingMotion').onchange=e=>{state.settings.reducedMotion=e.target.checked;applySettings();queueAutosave();}; $('settingLargeText').onchange=e=>{state.settings.largeText=e.target.checked;applySettings();queueAutosave();};
    $('qaHeal').onclick=()=>{state.player.hp=combatStatBlock().maxHp;state.player.ep=combatStatBlock().maxEp||state.player.maxEp;renderAll();}; $('qaCredits').onclick=()=>{addCredits(100);renderAll();}; $('qaClearAnomalies').onclick=()=>{state.flags.anomaliesCleared=3;state.flags.bossUnlocked=true;renderAll();}; $('qaBossReady').onclick=()=>{state.flags.bossUnlocked=true;renderAll();}; $('qaCompleteChapter').onclick=()=>{state.flags.chapterComplete=true;renderAll();}; $('qaResetRun').onclick=()=>{state=newGameState();renderAll();}; $('qaPath').onclick=()=>toast('Route: Terminal → 3 Anomalies → Door → Boss → Exit'); $('qaLoadStage') && ($('qaLoadStage').onclick=()=>qaLoadStage($('qaStageSelect')?.value || currentStageKey())); $('qaUnlockStages') && ($('qaUnlockStages').onclick=qaUnlockAllStages);
  }
  window.AV={useMedPatch, useVectorCell, useVectorCellBattle, useOverdriveBattle, openOverlay, startGame, showMenu, closeOverlays, routeMainMenuAction, renderAll, save, load, AudioManager, setupMobilePlayability, showStory, showChapterClearPanel, buyUpgrade, restoreCheckpoint, loadStage, qaLoadStage, qaUnlockAllStages, processRespawns, researchSummary, equipItem, unequipSlot, buyShopItem, craftRecipe, syncVyra, claimContract, rerollContract, interactNearbyNpc, talkToNpc, claimFermilatQuest, sideQuestStatusText, objectiveTarget, showObjectivePing, saveToSlot, loadFromSlot, deleteSaveSlot, exportSaveCode, importSaveCode, importSaveCodeFromText, renderSaveHub, renderAudioMixer, setAudioSetting, testSfxSetting, testMusicSetting};
  // v48: expose bulletproof direct menu helpers for GitHub Pages testing.
  window.AV_MENU={
    start:()=>startGame(true),
    continue:()=>{try{load();}catch(err){} startGame(false);},
    open:(id)=>openOverlay(id),
    fullscreen:()=>toggleFullscreenMode()
  };
  loadImages(); bind(); applySettings(); boot(); startAutosave(); setTimeout(()=>{ if(!$('bootScreen').classList.contains('hidden') && $('bootLogo').classList.contains('hidden')){ $('bootLogo').classList.remove('hidden'); bootDone=true; } }, 4500); renderAll();
})();
