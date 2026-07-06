(() => {
  const $ = id => document.getElementById(id);
  const canvas = $('game');
  const ctx = canvas.getContext('2d');
  const mini = $('minimap');
  const mctx = mini.getContext('2d');
  const TILE = 42;
  const MAP_ENTITY_W = 44;
  const MAP_ENTITY_H = 56;
  const VIEW_W = canvas.width, VIEW_H = canvas.height;
  const BUILD_VERSION = '1.0.00';
  const BUILD_TITLE = 'MOBILE LOCKDOWN SCALING PASS';
  const bootLines = [
    'ASH VECTOR OPERATING SYSTEM',
    `Version ${BUILD_VERSION} // ${BUILD_TITLE}`,
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
  const MAP_VERSION = 'sector_stage_v12_v182_boss_gate_hard_reset';
  const MUSIC = {
    intro: 'assets/music/pause.mp3',
    pause: 'assets/music/pause.mp3',
    battle: 'assets/music/battle.mp3',
    boss: 'assets/music/boss.mp3',
    level1: 'assets/music/level1.mp3',
    level2: 'assets/music/level2.mp3',
    level3: 'assets/music/level3.mp3',
    level4: 'assets/music/level4.mp3',
    level5: 'assets/music/level5.mp3',
    level6: 'assets/music/level6.mp3',
    level7: 'assets/music/level7.mp3',
    level8: 'assets/music/level8.mp3',
    level9: 'assets/music/level9.mp3',
    level10: 'assets/music/level10.mp3',
    level11: 'assets/music/level11.mp3',
    level12: 'assets/music/level12.mp3'
  };
  const RADIO_TRACKS = [
    {key:'pause', title:'Main Menu / Pause Theme', subtitle:'Unlocked from start', stage:0},
    {key:'level1', title:'Level 1 — Forbidden Graveyard', subtitle:'F-001 field music', stage:1},
    {key:'level2', title:'Level 2 — Ash Wastes Outpost', subtitle:'F-002 field music', stage:2},
    {key:'level3', title:'Level 3 — Neon Graveyard', subtitle:'F-003 field music', stage:3},
    {key:'level4', title:'Level 4 — Transit Ruins', subtitle:'F-004 field music', stage:4},
    {key:'level5', title:'Level 5 — Prism Lab', subtitle:'F-005 field music', stage:5},
    {key:'level6', title:'Level 6 — Core Spire', subtitle:'F-006 field music', stage:6},
    {key:'level7', title:'Level 7 — Fracture Seven', subtitle:'F-007 field music', stage:7},
    {key:'level8', title:'Level 8 — Fracture Eight', subtitle:'F-008 field music', stage:8},
    {key:'level9', title:'Level 9 — False Ending', subtitle:'F-009 field music', stage:9},
    {key:'level10', title:'Level 10 — Vector Collapse', subtitle:'F-010 field music', stage:10},
    {key:'level11', title:'Level 11 — Ashline Final', subtitle:'F-011 field music', stage:11},
    {key:'level12', title:'Level 12 — Current Final Level', subtitle:'F-012 field music', stage:12},
    {key:'battle', title:'Battle Music', subtitle:'Unlocked after entering combat', special:'battle'},
    {key:'boss', title:'Boss Fight Music', subtitle:'Unlocked after reaching a boss route', special:'boss'}
  ];
  let radioMode=false;
  let radioTrack='pause';

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
      if(!this.unlocked || this.musicStopped) return;
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
  function musicKeyForStage(key=currentStageKey()){
    const n=Math.max(1, Math.min(12, stageNumberFromKey(key)));
    return MUSIC[`level${n}`] ? `level${n}` : 'level1';
  }
  function ensureRadioState(){
    if(!state) return;
    state.radioUnlocked ||= {};
    state.radioUnlocked.pause=true;
    state.radioUnlocked.level1=true;
    const current=stageNumberFromKey(currentStageKey());
    for(let i=1;i<=current;i++) state.radioUnlocked[`level${i}`]=true;
    Object.entries(state.stages||{}).forEach(([key,data])=>{
      const n=stageNumberFromKey(key);
      if(data?.complete){
        for(let i=1;i<=n;i++) state.radioUnlocked[`level${i}`]=true;
      }
    });
    if(Object.values(state.enemyKills||{}).some(v=>Number(v)>0)) state.radioUnlocked.battle=true;
    if(Object.values(state.bossKills||{}).some(v=>Number(v)>0) || state.flags?.bossUnlocked || state.flags?.bossDefeated) state.radioUnlocked.boss=true;
  }
  function unlockRadioTrack(key){
    if(!state || !key) return;
    ensureRadioState();
    state.radioUnlocked[key]=true;
    queueAutosave();
  }
  function radioTrackUnlocked(track){
    if(!track) return false;
    ensureRadioState();
    if(track.stage != null){
      if(track.stage <= 1) return true;
      return !!state.radioUnlocked?.[track.key];
    }
    return !!state.radioUnlocked?.[track.key];
  }
  function radioHighestStageText(){
    ensureRadioState();
    let max=1;
    Object.keys(state.radioUnlocked||{}).forEach(k=>{
      const m=k.match(/^level(\d+)$/);
      if(m && state.radioUnlocked[k]) max=Math.max(max, Number(m[1]));
    });
    return `Unlocked through Level ${max}`;
  }
  function radioTrackButtonHtml(track){
    const unlocked=radioTrackUnlocked(track);
    const active=radioMode && radioTrack===track.key;
    const lockText=track.stage ? `Reach Level ${track.stage} to unlock` : 'Locked until heard in game';
    return `<button class="radio-track-btn ${unlocked?'unlocked':'locked'} ${active?'active':''}" ${unlocked?'':'disabled'} onclick="window.AV.playRadioTrack('${track.key}')"><b>${safeHtml(track.title)}</b><span>${unlocked?safeHtml(track.subtitle):safeHtml(lockText)}</span><em>${unlocked?(active?'PLAYING':'UNLOCKED'):'LOCKED'}</em></button>`;
  }
  function renderRadioDb(){
    const list=$('radioTrackList');
    if(!list) return;
    ensureRadioState();
    list.innerHTML=RADIO_TRACKS.map(radioTrackButtonHtml).join('');
    const status=$('radioStatus');
    if(status) status.innerHTML=`<b>${safeHtml(radioHighestStageText())}</b><br><span>Only songs you have reached/heard are available here.</span>`;
    const now=$('radioNowPlaying');
    if(now){
      const track=RADIO_TRACKS.find(t=>t.key===radioTrack);
      now.textContent=radioMode && track ? `Now Playing: ${track.title}` : 'Choose an unlocked song.';
    }
  }
  function playRadioTrack(key){
    const track=RADIO_TRACKS.find(t=>t.key===key);
    if(!track || !radioTrackUnlocked(track)){ toast('Radio track locked. Reach that level first.'); return false; }
    radioMode=true;
    radioTrack=key;
    AudioManager.force(key);
    renderRadioDb();
    toast(`Radio playing: ${track.title}`);
    return true;
  }
  function stopRadio(){
    radioMode=false;
    AudioManager.play(activeMusicForState(), true);
    renderRadioDb();
  }

  function activeMusicForState(){
    // v152: music follows current stage, and radio mode owns playback while open.
    if(radioMode) return radioTrack || 'pause';
    if(battle) return battle.code === 'B' ? 'boss' : 'battle';
    if(uiState.mode === 'overlay') return 'pause';
    if(uiState.mode === 'game' && gameStarted && !$('app').classList.contains('hidden')) return musicKeyForStage();
    if(uiState.mode === 'menu' || !document.querySelector('#mainMenu.hidden')) return 'pause';
    return gameStarted ? musicKeyForStage() : 'pause';
  }
  function refreshMusic(){ AudioManager.play(activeMusicForState()); }

  function ensureSettings(){
    state.settings ||= {};
    if(typeof state.settings.crt !== 'boolean') state.settings.crt = true;
    if(typeof state.settings.reducedMotion !== 'boolean') state.settings.reducedMotion = false;
    if(typeof state.settings.largeText !== 'boolean') state.settings.largeText = false;
    if(typeof state.settings.tutorialTips !== 'boolean') state.settings.tutorialTips = true;
    if(typeof state.settings.routeBeacon !== 'boolean') state.settings.routeBeacon = true;
    if(typeof state.settings.objectiveCompass !== 'boolean') state.settings.objectiveCompass = true;
    if(typeof state.settings.minimapRoute !== 'boolean') state.settings.minimapRoute = true;
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

  function syncBuildLabels(){
    const label=`v${BUILD_VERSION} // ${BUILD_TITLE}`;
    const bootBuild=$('bootBuildLabel');
    if(bootBuild) bootBuild.textContent=label;
    const bootLinesEl=$('bootLines');
    if(bootLinesEl && bootLinesEl.textContent.includes('Intro file detected')){
      bootLinesEl.textContent=`> Intro file detected: assets/video/intro.mp4\n> Press Enter, tap the screen, or use Start Intro.\n> Main menu opens after the intro or if playback is blocked.`;
    }
    document.title=`Project: ASH VECTOR // v${BUILD_VERSION}`;
  }


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
    '#.....#########...........##############',
    '#.P...#.......#....C......#...........##',
    '#.....#..S....#...........#.....E.....##',
    '#.....#.......#...........#...........##',
    '###.###.......#####...#####...........##',
    '###.###...................#...........##',
    '###.###########...#####...######.#######',
    '###.....E....##...#...#...######.#######',
    '#####.......###...#...#..........#######',
    '#####.......###...#...##########.#######',
    '#.................#...#...........######',
    '#...C.............#...#........E..######',
    '#.................#...#............#####',
    '#.........#######.#...#####.############',
    '#....H....#.....#.#.........############',
    '#.........#.....#.#.........############',
    '#####.#####..L..#.#.........#####...####',
    '#####.#####.....#.#...............#.####',
    '#.....#####.....#.#.......C.......#.####',
    '#...............#.#..............D.B.X##',
    '#...............#.#...........#####.####',
    '#...............#.#####.###########.####',
    '#.................#####.###########.####',
    '########################################'
  ];


  const stage4Map = [
    '########################################',
    '#.........#############..............###',
    '#.........#..........##..............###',
    '#.P..S....#..........##..............###',
    '#................C...##.......E......###',
    '#.........#..........................###',
    '#.........#..........##..............###',
    '######.####..........###################',
    '######.####..........###################',
    '######.#################################',
    '###.............###############........#',
    '###.............##............#........#',
    '###.............##............#........#',
    '###........E......................E....#',
    '###.............##........C...#........#',
    '###...........C.##............#........#',
    '###.............##............#........#',
    '##################............##########',
    '#########################.##############',
    '####............#########.##############',
    '####............##............#........#',
    '####....L......................D..B..X.#',
    '####............##....H.......#........#',
    '####............##............#........#',
    '########################################'
  ];

  const stage5Map = [
    '########################################',
    '#........##.........####################',
    '#........##.........##.................#',
    '#.P..S...##....C....##.................#',
    '#................................E.....#',
    '#........##.........##.................#',
    '#........#############.................#',
    '#........#############.................#',
    '#####.################.................#',
    '#####.##########...........#############',
    '##............##...C.......##..........#',
    '##............##...........##..........#',
    '##......E..................##..........#',
    '##............##................E......#',
    '##............##...........##..........#',
    '##............##...........##..........#',
    '################.........C.##..........#',
    '################...........#############',
    '######################.#################',
    '##............########.######..........#',
    '##............##...........##..........#',
    '##...L.......................D...B...X.#',
    '##............##.....H.....##..........#',
    '##............##...........##..........#',
    '########################################'
  ];

  const stage6Map = [
    '########################################',
    '#..........##..............##..........#',
    '#..........##..............##..........#',
    '#.P...S....##....C.........##..........#',
    '#.................................E....#',
    '#..........##..............##..........#',
    '#..........##..............##..........#',
    '#######.#####################..........#',
    '#######.#########............###########',
    '###............##........C...###########',
    '###............##...##.......##........#',
    '###............##............##........#',
    '###.....E................#...##........#',
    '###............##......................#',
    '###..........C.##...##.......##...E....#',
    '###............##............##........#',
    '#################............##........#',
    '#######################.#######........#',
    '#######################.################',
    '##...........##.............############',
    '##...........##.............##.........#',
    '##....L.......................D...B..X.#',
    '##...........##......H......##.........#',
    '##...........##.............##.........#',
    '########################################'
  ];

  function normalizeMapRows(rows){
    const width = Math.max(...rows.map(r=>r.length));
    return rows.map(r => (r + '#'.repeat(width)).slice(0,width));
  }
  const STAGE_DEFS = {
    f001: {key:'f001', id:'F-001', title:'Forbidden Graveyard', chapter:'Chapter 1 // The Awakening', levelReq:1, map:normalizeMapRows(baseMap), threat:'LOW → BOSS CLASS', objective:'grave terminal → 3 anomalies → boss → extraction', reward:'40 Credits, Rust Core, Corrupted Catalyst, Vyra Shards', rewardCredits:40, rewardShards:3, clearXp:220, nextKey:'f002', bg:'assets/battle_backgrounds/toxic_sewers_battle.png'},
    f002: {key:'f002', id:'F-002', title:'Ash Wastes Outpost', chapter:'Chapter 2 // Broken Signal', levelReq:5, map:normalizeMapRows(stage2Map), threat:'MEDIUM // OUTPOST CLASS', objective:'outpost terminal → three imported anomalies → existing boss → extraction', reward:'95 Credits, Burnt Alloy, Outpost Access Chip, Ashveil Mother Core chance, Vyra Shards', rewardCredits:95, rewardShards:6, clearXp:360, nextKey:'f003', bg:'assets/battle_backgrounds/ash_wastes_battle.png'},
    f003: {key:'f003', id:'F-003', title:'Neon Graveyard', chapter:'Chapter 3 // Dead Frequencies', levelReq:12, map:normalizeMapRows(stage3Map), threat:'HIGH // GRAVEYARD CLASS', objective:'grave terminal → 3 existing-library anomalies → shade boss → extraction', reward:'120 Credits, 2 Rust Cores, 2 Catalysts, 7 Vyra Shards', rewardCredits:120, rewardShards:7, clearXp:550, nextKey:'f004', bg:'assets/battle_backgrounds/neon_graveyard_battle.png'},
    f004: {key:'f004', id:'F-004', title:'Transit Ruins', chapter:'Chapter 4 // Below the Ashline', levelReq:15, map:normalizeMapRows(stage4Map), threat:'HIGH // SUBWAY CLASS', objective:'rail terminal → 3 tunnel anomalies → transit boss → extraction', reward:'150 Credits, Transit Nexus Core, Vector Cells, Vyra Shards', rewardCredits:150, rewardShards:8, clearXp:720, nextKey:'f005', bg:'assets/battle_backgrounds/ash_wastes_battle.png'},
    f005: {key:'f005', id:'F-005', title:'Glass Storm Lab', chapter:'Chapter 5 // Prism Wound', levelReq:20, map:normalizeMapRows(stage5Map), threat:'VERY HIGH // LAB CLASS', objective:'lab terminal → 3 prism anomalies → storm boss → extraction', reward:'185 Credits, Prism Wound Core, Catalysts, Vyra Shards', rewardCredits:185, rewardShards:10, clearXp:920, nextKey:'f006', bg:'assets/battle_backgrounds/neon_graveyard_battle.png'},
    f006: {key:'f006', id:'F-006', title:'Vector Core Spire', chapter:'Chapter 6 // Heart of the Fault', levelReq:25, map:normalizeMapRows(stage6Map), threat:'EXTREME // CORE CLASS', objective:'spire terminal → 3 core anomalies → vector boss → extraction', reward:'240 Credits, Vector Heart Core, Rust Cores, Vyra Shards', rewardCredits:240, rewardShards:12, clearXp:1200, nextKey:null, bg:'assets/battle_backgrounds/toxic_sewers_battle.png'}
  };
  function currentStageKey(){ return state?.currentStage || 'f001'; }
  function stageDef(key=currentStageKey()){ return STAGE_DEFS[key] || STAGE_DEFS.f001; }
  function battleBgForStage(key=currentStageKey()){ return stageDef(key).bg || STAGE_DEFS.f001.bg; }
  function sanitizeStageRows(rows){
    const raw=(rows||[]).map(r => Array.isArray(r) ? r.join('') : String(r || ''));
    if(!raw.length) return raw;
    const width=Math.max(1, ...raw.map(r=>r.length));
    const height=raw.length;
    return raw.map((row,y)=>{
      const chars=row.padEnd(width,'#').split('');
      for(let x=0;x<width;x++){
        // Two-tile sealed border prevents sprite/controller edge tunneling.
        if(y<=1 || y>=height-2 || x<=1 || x>=width-2){
          chars[x] = '#';
        }
        if(!['.','P','S','C','H','L','E','B','X','D','#'].includes(chars[x])){
          chars[x] = '#';
        }
      }
      return chars.join('');
    });
  }
  function parseStageMap(key){
    const def=stageDef(key);
    const map=sanitizeStageRows(def.map).map(r=>r.split(''));
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
        f001:{x:28,y:20,scene:'fermilatF001'}, f002:{x:24,y:21,scene:'fermilatF002'}, f003:{x:30,y:19,scene:'fermilatF003'},
        f004:{x:26,y:21,scene:'fermilatF004'}, f005:{x:24,y:21,scene:'fermilatF005'}, f006:{x:25,y:21,scene:'fermilatF006'},
        f007:{x:28,y:20,scene:'fermilatF006'}, f008:{x:30,y:18,scene:'fermilatF006'}, f009:{x:27,y:23,scene:'fermilatF006'},
        f010:{x:32,y:21,scene:'fermilatF006'}, f011:{x:29,y:24,scene:'fermilatF006'}, f012:{x:34,y:22,scene:'fermilatF006'}
      }
    },
    scavenger: {
      id: 'scavenger',
      name: 'Rook the Scavenger',
      asset: 'assets/npcs/scavenger.png',
      stages: {
        f001:{x:8,y:8,scene:'npcScavenger'}, f002:{x:10,y:7,scene:'npcScavenger'}, f003:{x:11,y:9,scene:'npcScavenger'},
        f004:{x:9,y:8,scene:'npcScavenger'}, f005:{x:12,y:10,scene:'npcScavenger'}, f006:{x:10,y:9,scene:'npcScavenger'},
        f007:{x:13,y:8,scene:'npcScavenger'}, f008:{x:11,y:11,scene:'npcScavenger'}, f009:{x:9,y:10,scene:'npcScavenger'},
        f010:{x:12,y:9,scene:'npcScavenger'}, f011:{x:10,y:8,scene:'npcScavenger'}, f012:{x:14,y:11,scene:'npcScavenger'}
      }
    },
    medic: {
      id: 'medic',
      name: 'Kessa Field Medic',
      asset: 'assets/npcs/medic.png',
      stages: {
        f001:{x:12,y:15,scene:'npcMedic'}, f002:{x:54,y:27,scene:'npcMedic'}, f003:{x:53,y:30,scene:'npcMedic'},
        f004:{x:50,y:29,scene:'npcMedic'}, f005:{x:55,y:27,scene:'npcMedic'}, f006:{x:57,y:28,scene:'npcMedic'},
        f007:{x:52,y:31,scene:'npcMedic'}, f008:{x:49,y:29,scene:'npcMedic'}, f009:{x:56,y:30,scene:'npcMedic'},
        f010:{x:54,y:28,scene:'npcMedic'}, f011:{x:51,y:30,scene:'npcMedic'}, f012:{x:58,y:29,scene:'npcMedic'}
      }
    },
    warden: {
      id: 'warden',
      name: 'Ashline Warden',
      asset: 'assets/npcs/warden.png',
      stages: {
        f001:{x:18,y:11,scene:'npcWarden'}, f002:{x:36,y:12,scene:'npcWarden'}, f003:{x:33,y:10,scene:'npcWarden'},
        f004:{x:39,y:11,scene:'npcWarden'}, f005:{x:37,y:13,scene:'npcWarden'}, f006:{x:35,y:12,scene:'npcWarden'},
        f007:{x:38,y:10,scene:'npcWarden'}, f008:{x:34,y:12,scene:'npcWarden'}, f009:{x:40,y:11,scene:'npcWarden'},
        f010:{x:36,y:13,scene:'npcWarden'}, f011:{x:35,y:11,scene:'npcWarden'}, f012:{x:41,y:12,scene:'npcWarden'}
      }
    }
  };

  // v81: lightweight side quest journal. Fermilat now offers a small optional
  // grind objective per stage after you find him near the boss route.
  const FERMILAT_FAVOR_DEFS = {
    f001:{title:"Fermilat\'s Suspicious Favor", target:3, credits:35, syncXp:70, skillXp:120, items:{'Vector Cell':1,'Med Patch':1}, ask:'Fermilat wants you to defeat 3 anomalies before he "trusts your footwork."', done:'Fermilat is weirdly proud of your graveyard footwork.'},
    f002:{title:'Ash Wastes Footwork', target:4, credits:65, syncXp:115, skillXp:180, items:{'Vector Cell':2,'Burnt Alloy':2}, ask:'Fermilat wants proof you can survive the dry outpost without sending evidence.', done:'Fermilat says the ash is terrible for "collectible preservation."'},
    f003:{title:'Graveyard Toe-tal Chaos', target:5, credits:95, syncXp:165, skillXp:260, items:{'Vector Cell':2,'Corrupted Catalyst':1}, ask:'Fermilat wants 5 graveyard anomalies deleted. He calls it "spooky foot traffic control."', done:'Fermilat congratulates you in the least normal way possible.'},
    f004:{title:'Transit Tunnel Favor', target:5, credits:115, syncXp:190, skillXp:270, items:{'Vector Cell':2,'Burnt Alloy':2}, ask:'Fermilat wants proof you can sprint through the subway without tripping over cursed rails.', done:'Fermilat says the Transit Ruins have excellent echo acoustics for terrible opinions.'},
    f005:{title:'Prism Lab Favor', target:6, credits:145, syncXp:230, skillXp:320, items:{'Vector Cell':2,'Corrupted Catalyst':2}, ask:'Fermilat wants 6 prism anomalies deleted because glass floors make him nervous.', done:'Fermilat is impressed and asks if the lab can clone socks. AVOS refuses.'},
    f006:{title:'Core Spire Favor', target:6, credits:180, syncXp:280, skillXp:380, items:{'Vector Cell':3,'Rust Core':2}, ask:'Fermilat wants 6 core anomaly defeats before he admits the final route is terrifying.', done:'Fermilat salutes you with absolutely no dignity and three suspicious snacks.'}
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

  const NPC_SAFE_FALLBACKS = {
    f001:{
      fermilat:{x:28,y:20},
      scavenger:{x:8,y:8},
      medic:{x:12,y:15},
      warden:{x:18,y:11}
    }
  };
  function npcPlacementSafe(pos,key=currentStageKey()){
    if(!pos) return false;
    try{
      if(typeof stageManualBlockAt === 'function' && stageManualBlockAt(pos.x,pos.y,key)) return false;
      if(typeof canStandAt === 'function' && state?.map) return canStandAt(pos.x,pos.y);
    }catch(err){}
    return Number.isFinite(pos.x) && Number.isFinite(pos.y);
  }
  function stageNpcs(key=currentStageKey()){
    return Object.values(NPC_DEFS).map(n => {
      const original = n.stages[key];
      if(!original) return null;
      const fallback = NPC_SAFE_FALLBACKS[key]?.[n.id];
      const pos = npcPlacementSafe(original,key) ? original : {...original, ...(fallback || {})};
      return {...n, ...pos, stage:key};
    }).filter(Boolean);
  }
  function npcAt(x,y,key=currentStageKey()){
    return stageNpcs(key).find(n => n.x === x && n.y === y) || null;
  }
  function nearbyNpc(){
    if(!state?.player) return null;
    const px = state.player.x, py = state.player.y;
    return stageNpcs().find(n => Number.isFinite(n.x) && Number.isFinite(n.y) && Math.max(Math.abs(n.x-px), Math.abs(n.y-py)) <= 1) || null;
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
    const stageTier = stageNumberFromKey(npc.stage);

    if(npc.id === 'fermilat'){
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
      }[npc.stage] || {credits:15 + stageTier*6, items:{'Vector Cell':1 + Math.floor(stageTier/4)}, label:'Fermilat Salvage Stash'};
      state.npcRewards[key]=true;
      addCredits(rewards.credits||0);
      Object.entries(rewards.items||{}).forEach(([name,qty])=>addItem(name,qty));
      log(`${rewards.label} recovered. Fermilat says this is absolutely not weird. +${rewards.credits||0} credits.`);
      toast(`${rewards.label} recovered.`);
      save(true);
      renderAll();
      return;
    }

    if(state.npcRewards[key]){
      toast(`${npc.name} has nothing new right now.`);
      renderAll();
      return;
    }

    let reward = {credits:10 + stageTier*4, items:{'Scrap Metal':1}, label:'Field Contact'};
    if(npc.id === 'scavenger') reward = {credits:12 + stageTier*5, items:{'Scrap Metal':1 + Math.floor(stageTier/4), 'Burnt Alloy': stageTier >= 4 ? 1 : 0}, label:'Scavenger Drop'};
    if(npc.id === 'medic') reward = {credits:6 + stageTier*3, items:{'Med Patch':1 + (stageTier >= 7 ? 1 : 0)}, heal:true, label:'Medic Refill'};
    if(npc.id === 'warden') reward = {credits:10 + stageTier*4, items:{'Vector Cell':1, 'Corrupted Catalyst': stageTier >= 6 ? 1 : 0}, label:'Warden Cache'};

    state.npcRewards[key]=true;
    addCredits(reward.credits||0);
    Object.entries(reward.items||{}).forEach(([name,qty])=>{ if(qty>0) addItem(name,qty); });
    if(reward.heal){ state.player.hp = combatStatBlock().maxHp; }
    log(`${reward.label} secured from ${npc.name}. +${reward.credits||0} credits.`);
    toast(`${npc.name} helped you.`);
    save(true);
    renderAll();
  }
  function interactNearbyNpc(){
    if(storyActive || battle) return false;
    const node=nearbyTrainingNode();
    if(node) return collectTrainingNode(node);
    const npc = nearbyNpc();
    if(!npc){ toast('No survivor or training object close enough. Move next to a glowing node/NPC and press E.'); return false; }
    talkToNpc(npc);
    return true;
  }
  function drawNpc(npc){
    const x = npc.x * TILE, y = npc.y * TILE;
    const im = images[npc.asset];
    const drawW = MAP_ENTITY_W;
    const drawH = MAP_ENTITY_H;
    const dx = x + (TILE-drawW)/2;
    const dy = y + TILE - drawH + 5;
    ctx.save();
    ctx.fillStyle='rgba(0,0,0,.42)';
    ctx.beginPath();
    ctx.ellipse(x+TILE/2,y+TILE-4,16,6,0,0,Math.PI*2);
    ctx.fill();
    ctx.shadowColor='#94ff62';
    ctx.shadowBlur=6;
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
    ctx.strokeRect(x+7,y+7,TILE-14,TILE-13);
    ctx.restore();
  }
  function drawNpcs(){
    stageNpcs().forEach(npc=>{
      try{ drawNpc(npc); }
      catch(err){
        console.warn('[AV NPC] draw skipped:', npc?.id, err);
      }
    });
  }
  function handleCanvasNpcClick(evt){
    if(storyActive || battle || $('app').classList.contains('hidden')) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const mx = (evt.clientX - rect.left) * scaleX + camera.x;
    const my = (evt.clientY - rect.top) * scaleY + camera.y;
    const tx = Math.floor(mx / TILE), ty = Math.floor(my / TILE);
    if(!inMapBounds(tx,ty)) return;
    const npc = npcAt(tx,ty);
    if(npc){ evt.preventDefault(); talkToNpc(npc); }
  }



  const POSTAPOC_PROP_PRESETS = {
    barrelRed:   {img:'assets/postapoc/barrel_red.png',   w:28, h:36},
    barrelBlue:  {img:'assets/postapoc/barrel_blue.png',  w:28, h:36},
    cardboard1:  {img:'assets/postapoc/cardboard_1.png', w:26, h:20},
    cardboard2:  {img:'assets/postapoc/cardboard_2.png', w:28, h:22},
    benchDown:   {img:'assets/postapoc/bench_down.png',  w:56, h:26},
    benchSide:   {img:'assets/postapoc/bench_side.png',  w:28, h:52},
    doorRust:    {img:'assets/postapoc/door_rust.png',   w:34, h:52},
    hatch:       {img:'assets/postapoc/hatch_closed.png',w:28, h:22},
    hvac:        {img:'assets/postapoc/hvac.png',        w:34, h:26},
    antenna:     {img:'assets/postapoc/antenna.png',     w:30, h:34},
    containerGray:{img:'assets/postapoc/container_gray.png',w:74,h:46},
    containerRed:{img:'assets/postapoc/container_red.png', w:74,h:46},
    posters:     {img:'assets/postapoc/posters.png',     w:28, h:26},
    duct:        {img:'assets/postapoc/duct_down.png',   w:22, h:18}
  };
  const STAGE_SALVAGE_THEMES = {
    f001:['benchDown','cardboard1','barrelBlue','posters','doorRust','hatch','barrelRed','benchSide'],
    f002:['containerGray','barrelRed','hvac','benchSide','antenna','cardboard2','duct','posters'],
    f003:['benchDown','barrelBlue','cardboard1','containerRed','posters','hatch','barrelRed','duct'],
    f004:['containerGray','benchSide','doorRust','barrelBlue','hvac','cardboard2','posters','antenna'],
    f005:['hvac','doorRust','containerRed','benchDown','barrelRed','cardboard1','hatch','duct'],
    f006:['containerGray','hatch','benchSide','barrelBlue','posters','antenna','hvac','cardboard2'],
    f007:['containerRed','benchDown','barrelRed','doorRust','cardboard2','posters','hatch','duct'],
    f008:['benchSide','hvac','barrelBlue','containerGray','posters','antenna','cardboard1','hatch'],
    f009:['benchDown','cardboard2','containerRed','barrelRed','doorRust','hatch','posters','duct'],
    f010:['containerGray','benchSide','antenna','hvac','barrelBlue','cardboard1','posters','doorRust'],
    f011:['benchDown','hatch','containerRed','barrelBlue','cardboard2','hvac','posters','duct'],
    f012:['containerGray','doorRust','benchSide','barrelRed','antenna','cardboard1','hatch','posters']
  };
  const STAGE_SALVAGE_POINTS = [[6,6],[15,9],[25,11],[36,8],[46,13],[58,16],[19,27],[49,31]];
  function stageNumberFromKey(key='f001'){ return parseInt(String(key).replace(/\D/g,''), 10) || 1; }

  function stageMissionScale(key=currentStageKey()){
    const n=stageNumberFromKey(key);
    return {
      stage:n,
      anomalyGoal:Math.min(8, 3 + Math.floor((n-1)/2)),
      cacheCredits:16 + n*9,
      cacheXp:18 + n*14,
      skillXp:16 + n*7,
      resourceRespawn:Math.min(42000, 12000 + n*1800),
      nodeCount:Math.min(9, 3 + Math.ceil(n/2)),
      rareChance:Math.min(.38, .06 + n*.025)
    };
  }
  function requiredAnomaliesForStage(key=currentStageKey()){
    return stageMissionScale(key).anomalyGoal;
  }
  const SKILL_COLOR = {
    cryptomining:'#ffb84d',
    datafishing:'#70d7ff',
    codecraft:'#94ff62',
    forgenetics:'#d2a8ff',
    system_hacking:'#ffffff'
  };
  const TRAINING_SKILLS = ['cryptomining','datafishing','codecraft','forgenetics','system_hacking'];
  const TRAINING_NODE_BASES = {
    cryptomining:[
      {label:'Ash Pebble Pile', item:'Ash Pebble', xp:8, glyph:'◆', verb:'mined'},
      {label:'Ash Ore Vein', item:'Ash Ore', xp:12, glyph:'◇', verb:'mined'},
      {label:'Dense Ash Vein', item:'Dense Ash Ore', xp:17, glyph:'⬙', verb:'mined'},
      {label:'Vector Crystal Seam', item:'Vector Crystal', xp:24, glyph:'✦', verb:'mined'},
      {label:'Obsidian Core Deposit', item:'Obsidian Core Ore', xp:32, glyph:'◆', verb:'mined'}
    ],
    datafishing:[
      {label:'Static Packet Stream', item:'Static Packet', xp:8, glyph:'≋', verb:'decoded'},
      {label:'Encrypted Data Stream', item:'Encrypted Data', xp:13, glyph:'⌁', verb:'decoded'},
      {label:'Ghost Log Pool', item:'Ghost Log', xp:18, glyph:'☰', verb:'decoded'},
      {label:'Blackbox Signal', item:'Blackbox File', xp:25, glyph:'▤', verb:'decoded'},
      {label:'Deep Archive Current', item:'Deep Archive Packet', xp:34, glyph:'▥', verb:'decoded'}
    ],
    codecraft:[
      {label:'Wire Scrap Bench', item:'Wire Scrap', xp:7, glyph:'⚙', verb:'salvaged'},
      {label:'Circuit Scrap Bench', item:'Circuit Scrap', xp:12, glyph:'⚒', verb:'salvaged'},
      {label:'Logic Board Station', item:'Logic Board', xp:18, glyph:'▧', verb:'salvaged'},
      {label:'Quantum Relay Rack', item:'Quantum Relay', xp:25, glyph:'⌬', verb:'salvaged'},
      {label:'Null Module Forge', item:'Null Module Part', xp:33, glyph:'⚙', verb:'salvaged'}
    ],
    forgenetics:[
      {label:'Spore Sample Pod', item:'Spore Sample', xp:9, glyph:'✣', verb:'harvested'},
      {label:'Mutagen Sample Pod', item:'Mutagen Sample', xp:14, glyph:'✤', verb:'harvested'},
      {label:'Mutated Tissue Bloom', item:'Mutated Tissue', xp:20, glyph:'✹', verb:'harvested'},
      {label:'Vector DNA Bloom', item:'Vector DNA', xp:28, glyph:'❋', verb:'harvested'},
      {label:'Ash Genome Vat', item:'Ash Genome Strand', xp:36, glyph:'✣', verb:'harvested'}
    ],
    system_hacking:[
      {label:'Broken Token Relay', item:'Broken Token', xp:8, glyph:'▣', verb:'hacked'},
      {label:'Access Fragment Relay', item:'Access Fragment', xp:13, glyph:'▢', verb:'hacked'},
      {label:'Security Keybit Panel', item:'Security Keybit', xp:19, glyph:'▨', verb:'hacked'},
      {label:'Root Cipher Console', item:'Root Cipher', xp:27, glyph:'▩', verb:'hacked'},
      {label:'Admin Ghost Terminal', item:'Admin Ghost Key', xp:35, glyph:'▣', verb:'hacked'}
    ]
  };

  const TRAINING_OBJECT_ASSETS = {
    "Ash Pebble Pile": "assets/training/objects/cryptomining/ash_pebble_pile.png",
    "Ash Ore Vein": "assets/training/objects/cryptomining/ash_ore_vein.png",
    "Dense Ash Vein": "assets/training/objects/cryptomining/dense_ash_vein.png",
    "Vector Crystal Seam": "assets/training/objects/cryptomining/vector_crystal_seam.png",
    "Obsidian Core Deposit": "assets/training/objects/cryptomining/obsidian_core_deposit.png",
    "Static Packet Stream": "assets/training/objects/datafishing/static_packet_stream.png",
    "Encrypted Data Stream": "assets/training/objects/datafishing/encrypted_data_stream.png",
    "Ghost Log Pool": "assets/training/objects/datafishing/ghost_log_pool.png",
    "Blackbox Signal": "assets/training/objects/datafishing/blackbox_signal.png",
    "Deep Archive Current": "assets/training/objects/datafishing/deep_archive_current.png",
    "Wire Scrap Bench": "assets/training/objects/codecraft/wire_scrap_bench.png",
    "Circuit Scrap Bench": "assets/training/objects/codecraft/circuit_scrap_bench.png",
    "Logic Board Station": "assets/training/objects/codecraft/logic_board_station.png",
    "Quantum Relay Rack": "assets/training/objects/codecraft/quantum_relay_rack.png",
    "Null Module Forge": "assets/training/objects/codecraft/null_module_forge.png",
    "Spore Sample Pod": "assets/training/objects/forgenetics/spore_sample_pod.png",
    "Mutagen Sample Pod": "assets/training/objects/forgenetics/mutagen_sample_pod.png",
    "Mutated Tissue Bloom": "assets/training/objects/forgenetics/mutated_tissue_bloom.png",
    "Vector DNA Bloom": "assets/training/objects/forgenetics/vector_dna_bloom.png",
    "Ash Genome Vat": "assets/training/objects/forgenetics/ash_genome_vat.png",
    "Broken Token Relay": "assets/training/objects/system_hacking/broken_token_relay.png",
    "Access Fragment Relay": "assets/training/objects/system_hacking/access_fragment_relay.png",
    "Security Keybit Panel": "assets/training/objects/system_hacking/security_keybit_panel.png",
    "Root Cipher Console": "assets/training/objects/system_hacking/root_cipher_console.png",
    "Admin Ghost Terminal": "assets/training/objects/system_hacking/admin_ghost_terminal.png",
  };
  const TRAINING_ITEM_ASSETS = {
    "Ash Pebble": "assets/training/items/cryptomining/ash_pebble.png",
    "Ash Ore": "assets/training/items/cryptomining/ash_ore.png",
    "Dense Ash Ore": "assets/training/items/cryptomining/dense_ash_ore.png",
    "Vector Crystal": "assets/training/items/cryptomining/vector_crystal.png",
    "Obsidian Core Ore": "assets/training/items/cryptomining/obsidian_core_ore.png",
    "Static Packet": "assets/training/items/datafishing/static_packet.png",
    "Encrypted Data": "assets/training/items/datafishing/encrypted_data.png",
    "Ghost Log": "assets/training/items/datafishing/ghost_log.png",
    "Blackbox File": "assets/training/items/datafishing/blackbox_file.png",
    "Deep Archive Packet": "assets/training/items/datafishing/deep_archive_packet.png",
    "Wire Scrap": "assets/training/items/codecraft/wire_scrap.png",
    "Circuit Scrap": "assets/training/items/codecraft/circuit_scrap.png",
    "Logic Board": "assets/training/items/codecraft/logic_board.png",
    "Quantum Relay": "assets/training/items/codecraft/quantum_relay.png",
    "Null Module Part": "assets/training/items/codecraft/null_module_part.png",
    "Spore Sample": "assets/training/items/forgenetics/spore_sample.png",
    "Mutagen Sample": "assets/training/items/forgenetics/mutagen_sample.png",
    "Mutated Tissue": "assets/training/items/forgenetics/mutated_tissue.png",
    "Vector DNA": "assets/training/items/forgenetics/vector_dna.png",
    "Ash Genome Strand": "assets/training/items/forgenetics/ash_genome_strand.png",
    "Broken Token": "assets/training/items/system_hacking/broken_token.png",
    "Access Fragment": "assets/training/items/system_hacking/access_fragment.png",
    "Security Keybit": "assets/training/items/system_hacking/security_keybit.png",
    "Root Cipher": "assets/training/items/system_hacking/root_cipher.png",
    "Admin Ghost Key": "assets/training/items/system_hacking/admin_ghost_key.png",
  };
  const TRAINING_ITEM_SKILLS = {
    "Ash Pebble": "cryptomining",
    "Ash Ore": "cryptomining",
    "Dense Ash Ore": "cryptomining",
    "Vector Crystal": "cryptomining",
    "Obsidian Core Ore": "cryptomining",
    "Static Packet": "datafishing",
    "Encrypted Data": "datafishing",
    "Ghost Log": "datafishing",
    "Blackbox File": "datafishing",
    "Deep Archive Packet": "datafishing",
    "Wire Scrap": "codecraft",
    "Circuit Scrap": "codecraft",
    "Logic Board": "codecraft",
    "Quantum Relay": "codecraft",
    "Null Module Part": "codecraft",
    "Spore Sample": "forgenetics",
    "Mutagen Sample": "forgenetics",
    "Mutated Tissue": "forgenetics",
    "Vector DNA": "forgenetics",
    "Ash Genome Strand": "forgenetics",
    "Broken Token": "system_hacking",
    "Access Fragment": "system_hacking",
    "Security Keybit": "system_hacking",
    "Root Cipher": "system_hacking",
    "Admin Ghost Key": "system_hacking",
  };
  const TRAINING_ITEM_RARITY = {
    "Ash Pebble": "Common",
    "Ash Ore": "Common",
    "Dense Ash Ore": "Uncommon",
    "Vector Crystal": "Rare",
    "Obsidian Core Ore": "Epic",
    "Static Packet": "Common",
    "Encrypted Data": "Common",
    "Ghost Log": "Uncommon",
    "Blackbox File": "Rare",
    "Deep Archive Packet": "Epic",
    "Wire Scrap": "Common",
    "Circuit Scrap": "Common",
    "Logic Board": "Uncommon",
    "Quantum Relay": "Rare",
    "Null Module Part": "Epic",
    "Spore Sample": "Common",
    "Mutagen Sample": "Common",
    "Mutated Tissue": "Uncommon",
    "Vector DNA": "Rare",
    "Ash Genome Strand": "Epic",
    "Broken Token": "Common",
    "Access Fragment": "Common",
    "Security Keybit": "Uncommon",
    "Root Cipher": "Rare",
    "Admin Ghost Key": "Epic",
  };
  function trainingBaseName(name=''){
    return String(name||'').replace(/^F-\d{3}\s+/, '').trim();
  }
  function trainingObjectAssetForLabel(label=''){
    return TRAINING_OBJECT_ASSETS[trainingBaseName(label)] || null;
  }
  function trainingItemAssetForName(name=''){
    return TRAINING_ITEM_ASSETS[trainingBaseName(name)] || null;
  }
  function trainingSkillForItemName(name=''){
    return TRAINING_ITEM_SKILLS[trainingBaseName(name)] || null;
  }
  function trainingRarityForItemName(name=''){
    return TRAINING_ITEM_RARITY[trainingBaseName(name)] || 'Common';
  }
  function trainingAssetPaths(){
    return [...Object.values(TRAINING_OBJECT_ASSETS), ...Object.values(TRAINING_ITEM_ASSETS)];
  }

  function stageSkillReqStart(key=currentStageKey()){
    return Math.max(1, (stageNumberFromKey(key)-1)*5 + 1);
  }
  function stageSkillReqRange(key=currentStageKey()){
    const start=stageSkillReqStart(key);
    return {start, end:start+4};
  }
  function stageTrainingItemName(base, key=currentStageKey()){
    const stage=stageDef(key);
    return `${stage.id} ${base.item}`;
  }
  function stageTrainingLabel(base, key=currentStageKey()){
    const stage=stageDef(key);
    return `${stage.id} ${base.label}`;
  }
  function catalogNodeForSkill(skill, stageKey=currentStageKey(), variant=0){
    const list=TRAINING_NODE_BASES[skill] || [];
    if(!list.length) return null;
    const tier=Math.max(0, Math.min(list.length-1, variant));
    const base=list[tier];
    const req=stageSkillReqStart(stageKey)+tier;
    const stage=stageNumberFromKey(stageKey);
    return {
      ...base,
      baseLabel: base.label,
      baseItem: base.item,
      label:stageTrainingLabel(base, stageKey),
      item:stageTrainingItemName(base, stageKey),
      asset: trainingObjectAssetForLabel(base.label),
      itemAsset: trainingItemAssetForName(base.item),
      skill,
      color:SKILL_COLOR[skill] || '#ffffff',
      tier,
      req,
      xp:Math.max(1, Math.floor(base.xp + (stage-1)*2.2 + tier*1.5))
    };
  }

  function SKILLING_RULES_FROM_CATALOG(){
    const rules={};
    Object.keys(STAGE_DEFS).forEach(stageKey=>{
      TRAINING_SKILLS.forEach(skill=>{
        (TRAINING_NODE_BASES[skill]||[]).forEach((base,tier)=>{
          const node=catalogNodeForSkill(skill, stageKey, tier);
          rules[node.item]={skill, baseXp:node.xp, levelBase:node.req, zoneStep:0, itemTier:tier, stage:stageKey};
        });
      });
    });
    // Backward-compatible older materials already in saves/cache loot.
    rules['Scrap Metal']={skill:'codecraft',baseXp:8,levelBase:1,zoneStep:0,itemTier:0};
    rules['Burnt Alloy']={skill:'cryptomining',baseXp:22,levelBase:6,zoneStep:0,itemTier:1};
    rules['Corrupted Catalyst']={skill:'forgenetics',baseXp:32,levelBase:11,zoneStep:0,itemTier:2};
    rules['Rust Core']={skill:'cryptomining',baseXp:34,levelBase:16,zoneStep:0,itemTier:3};
    rules['Archive Log 001']={skill:'datafishing',baseXp:18,levelBase:6,zoneStep:0,itemTier:1};
    rules['Vector Cell']={skill:'system_hacking',baseXp:14,levelBase:1,zoneStep:0,itemTier:0};
    rules['Zone Cache Voucher']={skill:'system_hacking',baseXp:40,levelBase:21,zoneStep:0,itemTier:4};
    return rules;
  }
  const SKILLING_ITEM_RULES = SKILLING_RULES_FROM_CATALOG();

  function skillingRuleForItem(name, fallbackSkill='cryptomining'){
    return SKILLING_ITEM_RULES[name] || {skill:fallbackSkill, baseXp:7, levelBase:stageSkillReqStart(), zoneStep:0, itemTier:0};
  }
  function skillingLevelReqForItem(name, stageKey=currentStageKey()){
    const rule=skillingRuleForItem(name);
    return Math.max(1, Math.min(99, rule.levelBase || stageSkillReqStart(stageKey)));
  }
  function skillingXpForItem(name, stageKey=currentStageKey(), qty=1){
    const rule=skillingRuleForItem(name);
    return Math.max(1, Math.floor((rule.baseXp || 7) * Math.max(1, qty || 1)));
  }
  function canTrainFromItem(name, stageKey=currentStageKey()){
    const rule=skillingRuleForItem(name);
    const req=skillingLevelReqForItem(name, stageKey);
    const lvl=skillLevel(rule.skill);
    return {ok:lvl>=req, req, lvl, skill:rule.skill, xp:skillingXpForItem(name, stageKey, 1)};
  }
  function zoneProfile(key=currentStageKey()){
    const range=stageSkillReqRange(key);
    const skills=[...TRAINING_SKILLS];
    const items=skills.flatMap(skill => (TRAINING_NODE_BASES[skill]||[]).map(base=>stageTrainingItemName(base,key)));
    return {zone:`${stageDef(key).id} Skill Range Lv. ${range.start}-${range.end}`, skills, items};
  }

  function ensureTrainingNodeState(){
    if(!state) return;
    state.resourceNodes ||= {};
  }
  function deterministicFloorTilesForStage(key=currentStageKey()){
    const def=stageDef(key);
    const rows=def.map || [];
    const parsed=parseStageMap(key);
    const stageNo=stageNumberFromKey(key);
    const tiles=[];
    const addTile=(x,y)=>{
      const c=(rows[y]||'')[x];
      const dist=Math.abs(x-parsed.px)+Math.abs(y-parsed.py);
      if(c!=='.' || dist<5) return;
      const pos=`${x},${y}`;
      if(!tiles.some(t=>t.x===x && t.y===y)) tiles.push({x,y});
    };

    // Wide spacing first so the 20 nodes do not clump.
    for(let band=0; band<7; band++){
      for(let y=2+band; y<rows.length-2; y+=7){
        for(let x=2+((stageNo+band)*3%9); x<(rows[y]||'').length-2; x+=9){
          addTile(x,y);
        }
      }
    }
    // Fallback fill if a map is tighter.
    for(let y=2;y<rows.length-2 && tiles.length<40;y++){
      for(let x=2;x<(rows[y]||'').length-2 && tiles.length<40;x++){
        if(((x*13+y*17+stageNo*19)%5)===0) addTile(x,y);
      }
    }
    return tiles;
  }

  function stageTrainingNodes(key=currentStageKey()){
    const floor=deterministicFloorTilesForStage(key);
    const nodes=[];
    if(!floor.length) return nodes;

    // Every map gets 5 different training objects per skill.
    // Level 1 uses Lv. 1-5, Level 2 uses Lv. 6-10, ... Level 12 uses Lv. 56-60.
    let cursor=0;
    TRAINING_SKILLS.forEach((skill, skillIndex)=>{
      for(let tier=0;tier<5;tier++){
        const catalog=catalogNodeForSkill(skill,key,tier);
        if(!catalog) continue;
        let chosen=null;
        for(let tries=0;tries<floor.length;tries++){
          const idx=(skillIndex*19 + tier*13 + stageNumberFromKey(key)*7 + tries + cursor) % floor.length;
          const t=floor[idx];
          if(!nodes.some(n=>n.x===t.x && n.y===t.y)){
            chosen=t;
            cursor=idx+1;
            break;
          }
        }
        if(!chosen) chosen=floor[(skillIndex*5+tier) % floor.length];
        nodes.push({
          id:`${key}:skillnode:${skill}:${tier}`,
          stage:key,
          x:chosen.x,
          y:chosen.y,
          skill,
          levelReq:catalog.req,
          itemXp:skillingXpForItem(catalog.item,key,1),
          ...catalog
        });
      }
    });
    return nodes;
  }
  function trainingNodeReady(node){
    ensureTrainingNodeState();
    const readyAt=state.resourceNodes[node.id] || 0;
    return Date.now() >= readyAt;
  }
  function nearbyTrainingNode(){
    if(!state || !state.player) return null;
    return stageTrainingNodes().find(n => trainingNodeReady(n) && Math.abs(n.x-state.player.x)+Math.abs(n.y-state.player.y) <= 1) || null;
  }
  function processTrainingNodeRespawns(){
    if(!state || !state.resourceNodes) return;
    const now=Date.now();
    let changed=false;
    Object.entries({...state.resourceNodes}).forEach(([id,readyAt])=>{
      if(now >= readyAt){ delete state.resourceNodes[id]; changed=true; }
    });
    if(changed){ renderAll(); queueAutosave(); }
  }
  function showXpFloat(text, kind='xp'){
    const host=$('app') || document.body;
    const el=document.createElement('div');
    el.className=`xp-float xp-float-${kind}`;
    el.textContent=text;
    const rect=canvas.getBoundingClientRect();
    el.style.left=(rect.left + rect.width/2)+'px';
    el.style.top=(rect.top + Math.max(48, rect.height*.34))+'px';
    document.body.appendChild(el);
    setTimeout(()=>el.remove(), 1350);
  }
  function collectTrainingNode(node=nearbyTrainingNode()){
    if(storyActive || battle) return false;
    if(!node){ toast('No training object close enough. Move next to a node and press E.'); return false; }
    ensureTrainingNodeState();
    const scale=stageMissionScale(node.stage);
    const req=node.levelReq || skillingLevelReqForItem(node.item,node.stage);
    const currentSkillLevel=skillLevel(node.skill);
    const skillName=skillList[node.skill]?.name || node.skill;
    if(currentSkillLevel < req){
      toast(`${node.label} requires ${skillName} Lv. ${req}. Current Lv. ${currentSkillLevel}.`);
      showXpFloat(`Requires Lv ${req} ${skillList[node.skill]?.short || 'SKL'}`, 'locked');
      return false;
    }
    const itemQty=1 + (Math.random() < .18 + scale.stage*.01 ? 1 : 0);
    addItem(node.item,itemQty);
    const itemRule=skillingRuleForItem(node.item,node.skill);
    const itemXp=skillingXpForItem(node.item,node.stage,itemQty);
    grantStyleXp(itemRule.skill, itemXp);
    const gainedLines=[`${itemXp} ${skillList[itemRule.skill]?.short || 'XP'} XP`];
    if(Math.random() < scale.rareChance){
      const profile=zoneProfile(node.stage);
      const bonus=profile.items[(scale.stage + itemQty + node.x + node.y) % profile.items.length];
      addItem(bonus,1);
      recordDrop(bonus, node.label, findItemRecord(bonus).rarity);
      const bonusCheck=canTrainFromItem(bonus,node.stage);
      if(bonusCheck.ok){
        const bonusXp=skillingXpForItem(bonus,node.stage,1);
        grantStyleXp(bonusCheck.skill, bonusXp);
        gainedLines.push(`${bonusXp} ${skillList[bonusCheck.skill]?.short || 'XP'} XP`);
      } else {
        gainedLines.push(`${bonus} banked (Req ${skillList[bonusCheck.skill]?.short || 'SKL'} Lv ${bonusCheck.req})`);
      }
    }
    state.resourceNodes[node.id]=Date.now()+scale.resourceRespawn;
    setTimeout(processTrainingNodeRespawns, scale.resourceRespawn+80);
    log(`${node.label} ${node.verb}: ${gainedLines.join(', ')}. +${itemQty} ${node.item}.`);
    toast(`${node.label}: +${gainedLines[0]}`);
    renderAll();
    queueAutosave();
    return true;
  }
  function stageChestLoot(){
    const def=stageDef();
    const scale=stageMissionScale(def.key);
    const profile=zoneProfile(def.key);
    const loot=[];
    loot.push(['Med Patch', 1 + (scale.stage>=4?1:0)]);
    if(Math.random() < .55 + scale.stage*.02) loot.push(['Vector Cell',1]);
    loot.push([profile.items[scale.stage % profile.items.length], 1 + Math.floor(scale.stage/5)]);
    if(Math.random() < .45) loot.push(['Scrap Metal', 1 + Math.floor(scale.stage/3)]);
    if(Math.random() < scale.rareChance) loot.push([profile.items[(scale.stage+2)%profile.items.length],1]);
    if(scale.stage >= 4 && Math.random() < .28) loot.push(['Corrupted Catalyst',1]);
    if(scale.stage >= 7 && Math.random() < .18) loot.push(['Zone Cache Voucher',1]);
    return loot.filter(([name,qty])=>qty>0);
  }
  function openStageCache(x,y){
    const def=stageDef();
    const scale=stageMissionScale(def.key);
    setTile(x,y,'.');
    state.flags.chests++;
    addCredits(scale.cacheCredits + Math.floor(Math.random()*Math.max(6,scale.stage*4)));
    const loot=stageChestLoot();
    loot.forEach(([name,qty])=>{ addItem(name,qty); recordDrop(name, `${def.id} Field Cache`, findItemRecord(name).rarity); });
    const g=Math.random() < (.22 + scale.stage*.018) ? pickGearDrop(false) : null;
    if(g){ addItem(g.name,1); recordDrop(g.name, `${def.id} Gear Cache`, g.rarity || 'Uncommon'); loot.push([g.name,1]); }
    gainXp(scale.cacheXp);
    const summary=loot.map(([name,qty])=>`${name}${qty>1?' x'+qty:''}`).join(', ');
    log(`${def.id} cache opened: +${scale.cacheCredits} credits, +${scale.cacheXp} Sync XP${summary?`, ${summary}`:''}.`);
    pulseObjective(`Cache recovered: ${summary || 'credits and supplies'}.`);
    showTutorialTip('cache','Scaled Caches + Zone Loot','Caches scale by level range and zone. Every map also has 4 color-coded training objects per skill.','Press I or Bag to view stacked loot in the bank-style inventory.');
    advanceProtocolChallenge('caches',1);
    renderAll();
    queueAutosave();
  }
  const STAGE_SALVAGE_OBJECTS = Object.fromEntries(Object.keys(STAGE_SALVAGE_THEMES).map(key => {
    const theme = STAGE_SALVAGE_THEMES[key];
    const stageNum = stageNumberFromKey(key);
    return [key, theme.map((name, i) => {
      const preset = POSTAPOC_PROP_PRESETS[name];
      const base = STAGE_SALVAGE_POINTS[i % STAGE_SALVAGE_POINTS.length];
      return {
        x: base[0] + ((stageNum + i) % 4),
        y: base[1] + ((stageNum * 2 + i) % 5),
        img: preset.img,
        w: preset.w,
        h: preset.h
      };
    })];
  }));

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
    exit: 'assets/tilesets/custom/next_level_exit_portal.png',
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
      exit: 'assets/tilesets/custom/next_level_exit_portal.png',
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
        'assets/tilesets/undead/grave_02.png',
        'assets/tilesets/undead/ruin_01.png',
        'assets/tilesets/undead/rock_04.png',
        'assets/tilesets/undead/grave_03.png'
      ],
      floorTint: 'rgba(32, 10, 54, .22)',
      pathTint: 'rgba(0, 244, 255, .16)',
      wallTint: 'rgba(12, 7, 24, .97)',
      wallEdge: 'rgba(255, 79, 214, .34)',
      props: [
        {x:8,y:3,img:'assets/tilesets/undead/bones_01.png',w:44,h:34},
        {x:21,y:3,img:'assets/tilesets/undead/grave_01.png',w:38,h:40},
        {x:32,y:2,img:'assets/tilesets/undead/lich_01.png',w:72,h:82},
        {x:13,y:6,img:'assets/tilesets/undead/ruin_01.png',w:74,h:72},
        {x:8,y:9,img:'assets/tilesets/undead/bones_02.png',w:48,h:34},
        {x:4,y:12,img:'assets/tilesets/undead/plant_01.png',w:46,h:42},
        {x:10,y:16,img:'assets/tilesets/undead/crystal_01.png',w:44,h:44},
        {x:16,y:18,img:'assets/tilesets/undead/bones_03.png',w:72,h:44},
        {x:22,y:11,img:'assets/tilesets/undead/dead_arm_01.png',w:58,h:52},
        {x:26,y:18,img:'assets/tilesets/undead/dead_tree_02.png',w:58,h:66},
        {x:29,y:19,img:'assets/tilesets/undead/skull_pile_01.png',w:64,h:58},
        {x:31,y:20,img:'assets/tilesets/undead/grave_02.png',w:38,h:40},
        {x:35,y:4,img:'assets/tilesets/undead/rock_04.png',w:54,h:46},
        {x:6,y:22,img:'assets/tilesets/undead/grave_03.png',w:42,h:44}
      ]
    },
    f004: {
      ground: ['assets/tilesets/cursed/ground_01.png','assets/tilesets/cursed/ground_02.png','assets/tilesets/cursed/ground_03.png','assets/tilesets/cursed/ground_04.png'],
      blocked: ['assets/tilesets/cursed/ruins_01.png','assets/tilesets/cursed/rock_eyes_01.png','assets/tilesets/forbidden/stone_fence_01.png','assets/tilesets/undead/rock_04.png'],
      chest:'assets/tilesets/forbidden/locked_chest_01.png', med:'assets/tilesets/forbidden/life_01.png', lore:'assets/tilesets/forbidden/signpost_02.png', terminal:'assets/tilesets/forbidden/lantern_01.png', door:'assets/tilesets/cursed/ruins_01.png', exit:'assets/tilesets/forbidden/signpost_01.png',
      floorTint:'rgba(74,82,92,.18)', pathTint:'rgba(92,170,255,.13)', wallTint:'rgba(10,13,17,.97)', wallEdge:'rgba(92,170,255,.28)',
      props:[{x:13,y:3,img:'assets/tilesets/cursed/ruins_01.png',w:58,h:50},{x:28,y:3,img:'assets/tilesets/cursed/rock_eyes_01.png',w:54,h:48},{x:6,y:11,img:'assets/tilesets/forbidden/rock_03.png',w:38,h:34},{x:18,y:12,img:'assets/tilesets/undead/bones_03.png',w:64,h:42},{x:31,y:14,img:'assets/tilesets/cursed/spike_plant_01.png',w:54,h:48},{x:11,y:20,img:'assets/tilesets/undead/dead_tree_02.png',w:54,h:64},{x:24,y:21,img:'assets/tilesets/cursed/tentacle_plant_01.png',w:52,h:48}]
    },
    f005: {
      ground: ['assets/tilesets/undead/ground_01.png','assets/tilesets/undead/ground_02.png','assets/tilesets/undead/ground_03.png','assets/tilesets/undead/ground_04.png'],
      blocked: ['assets/tilesets/undead/crystal_01.png','assets/tilesets/cursed/ruins_01.png','assets/tilesets/cursed/jaws_plant_01.png','assets/tilesets/undead/rock_04.png'],
      chest:'assets/tilesets/forbidden/locked_chest_01.png', med:'assets/tilesets/forbidden/life_01.png', lore:'assets/tilesets/forbidden/signpost_02.png', terminal:'assets/tilesets/forbidden/lantern_01.png', door:'assets/tilesets/undead/ruin_01.png', exit:'assets/tilesets/forbidden/signpost_01.png',
      floorTint:'rgba(24,38,62,.20)', pathTint:'rgba(180,96,255,.14)', wallTint:'rgba(8,8,22,.97)', wallEdge:'rgba(190,96,255,.30)',
      props:[{x:12,y:4,img:'assets/tilesets/undead/crystal_01.png',w:44,h:44},{x:29,y:5,img:'assets/tilesets/undead/lich_01.png',w:68,h:78},{x:5,y:11,img:'assets/tilesets/cursed/meat_flower_01.png',w:48,h:48},{x:22,y:11,img:'assets/tilesets/undead/crystal_01.png',w:48,h:48},{x:35,y:13,img:'assets/tilesets/cursed/eye_plant_01.png',w:42,h:42},{x:9,y:20,img:'assets/tilesets/undead/bones_02.png',w:48,h:34},{x:25,y:22,img:'assets/tilesets/undead/skull_pile_01.png',w:60,h:54}]
    },
    f006: {
      ground: ['assets/tilesets/forbidden/ground_01.png','assets/tilesets/forbidden/ground_02.png','assets/tilesets/forbidden/ground_03.png','assets/tilesets/forbidden/ground_04.png'],
      blocked: ['assets/tilesets/undead/ruin_01.png','assets/tilesets/undead/crystal_01.png','assets/tilesets/cursed/rock_eyes_01.png','assets/tilesets/forbidden/crypt_01.png'],
      chest:'assets/tilesets/forbidden/locked_chest_01.png', med:'assets/tilesets/forbidden/life_01.png', lore:'assets/tilesets/forbidden/signpost_02.png', terminal:'assets/tilesets/forbidden/lantern_01.png', door:'assets/tilesets/forbidden/stone_fence_01.png', exit:'assets/tilesets/forbidden/signpost_01.png',
      floorTint:'rgba(12,48,64,.22)', pathTint:'rgba(0,255,200,.14)', wallTint:'rgba(3,10,18,.98)', wallEdge:'rgba(0,255,200,.34)',
      props:[{x:15,y:3,img:'assets/tilesets/undead/ruin_01.png',w:70,h:68},{x:31,y:4,img:'assets/tilesets/undead/crystal_01.png',w:50,h:50},{x:6,y:12,img:'assets/tilesets/undead/dead_arm_01.png',w:58,h:52},{x:24,y:11,img:'assets/tilesets/cursed/rock_eyes_01.png',w:58,h:50},{x:35,y:14,img:'assets/tilesets/undead/lich_01.png',w:72,h:82},{x:9,y:22,img:'assets/tilesets/forbidden/skull_01.png',w:36,h:36},{x:24,y:21,img:'assets/tilesets/undead/skull_pile_01.png',w:64,h:58}]
    },
    // v117: late-route stages use canvas tint packs so they look different without editing asset PNGs.
    f007: {floorTint:'rgba(255,96,35,.20)', pathTint:'rgba(255,122,54,.17)', wallTint:'rgba(32,13,6,.98)', wallEdge:'rgba(255,122,54,.38)', blocked:['assets/tilesets/cursed/rock_eyes_01.png','assets/tilesets/undead/ruin_01.png','assets/tilesets/forbidden/stone_fence_01.png'], props:[{x:8,y:8,img:'assets/tilesets/forbidden/fire_01.png',w:36,h:36},{x:30,y:12,img:'assets/tilesets/cursed/rock_eyes_01.png',w:58,h:50},{x:44,y:24,img:'assets/tilesets/undead/bones_03.png',w:52,h:36}]},
    f008: {floorTint:'rgba(32,145,255,.19)', pathTint:'rgba(70,190,255,.16)', wallTint:'rgba(5,17,30,.98)', wallEdge:'rgba(70,190,255,.40)', blocked:['assets/tilesets/undead/ruin_01.png','assets/tilesets/forbidden/rock_01.png','assets/tilesets/forbidden/stone_fence_02.png'], props:[{x:11,y:9,img:'assets/tilesets/undead/ruin_01.png',w:64,h:62},{x:36,y:15,img:'assets/tilesets/forbidden/rock_02.png',w:42,h:38},{x:52,y:27,img:'assets/tilesets/forbidden/signpost_02.png',w:34,h:44}]},
    f009: {floorTint:'rgba(210,110,42,.19)', pathTint:'rgba(255,178,84,.15)', wallTint:'rgba(22,15,8,.98)', wallEdge:'rgba(255,178,84,.36)', blocked:['assets/tilesets/forbidden/tree_01.png','assets/tilesets/forbidden/tree_02.png','assets/tilesets/undead/plant_01.png'], props:[{x:9,y:11,img:'assets/tilesets/undead/plant_01.png',w:44,h:42},{x:34,y:20,img:'assets/tilesets/forbidden/bush_01.png',w:44,h:40},{x:50,y:30,img:'assets/tilesets/forbidden/skull_01.png',w:36,h:36}]},
    f010:{floorTint:'rgba(78,42,255,.20)', pathTint:'rgba(125,92,255,.16)', wallTint:'rgba(10,7,29,.98)', wallEdge:'rgba(125,92,255,.41)', blocked:['assets/tilesets/forbidden/crypt_01.png','assets/tilesets/undead/lich_01.png','assets/tilesets/undead/grave_03.png'], props:[{x:13,y:8,img:'assets/tilesets/undead/lich_01.png',w:66,h:78},{x:38,y:18,img:'assets/tilesets/undead/grave_03.png',w:44,h:50},{x:53,y:26,img:'assets/tilesets/forbidden/headstone_01.png',w:34,h:40}]},
    f011:{floorTint:'rgba(155,245,255,.18)', pathTint:'rgba(200,255,255,.14)', wallTint:'rgba(3,20,28,.98)', wallEdge:'rgba(185,245,255,.40)', blocked:['assets/tilesets/undead/ruin_01.png','assets/tilesets/forbidden/rock_03.png','assets/tilesets/forbidden/crypt_01.png'], props:[{x:10,y:10,img:'assets/tilesets/forbidden/rock_03.png',w:42,h:38},{x:33,y:17,img:'assets/tilesets/undead/ruin_01.png',w:66,h:62},{x:48,y:29,img:'assets/tilesets/undead/skull_pile_01.png',w:58,h:52}]},
    f012:{floorTint:'rgba(255,205,66,.19)', pathTint:'rgba(255,226,110,.14)', wallTint:'rgba(30,20,3,.98)', wallEdge:'rgba(255,226,110,.43)', blocked:['assets/tilesets/undead/lich_01.png','assets/tilesets/forbidden/crypt_01.png','assets/tilesets/undead/ruin_01.png'], props:[{x:12,y:9,img:'assets/tilesets/undead/lich_01.png',w:72,h:82},{x:31,y:16,img:'assets/tilesets/forbidden/crypt_01.png',w:58,h:58},{x:49,y:30,img:'assets/tilesets/undead/skull_pile_01.png',w:64,h:58}]}
  };
  function stageVisualPack(){ return stageVisualPacks[state?.currentStage || ''] || null; }
  function stageVisualAssetPaths(){
    return [
      ...Object.values(stageVisualPacks).flatMap(pack => [
        ...(pack.ground || []),
        ...(pack.blocked || []),
        pack.chest, pack.med, pack.lore, pack.terminal, pack.door, pack.exit,
        ...((pack.props || []).map(p => p.img))
      ]),
      ...Object.values(STAGE_SALVAGE_OBJECTS).flatMap(list => list.map(p => p.img))
    ].filter(Boolean);
  }

  // v91: the imported ground PNGs include edge/corner/platform pieces.
  // Drawing those randomly made the map look like broken floating blocks.
  // Walkable tiles now use one consistent procedural ground per stage, while props/interactables still use the imported art.
  const stageFloorStyles = {
    f001: {base:'#1b1721', alt:'#211b2a', grit:'rgba(202,184,255,.085)', line:'rgba(255,255,255,.045)', accent:'rgba(160,118,255,.12)'},
    f002: {base:'#22130f', alt:'#2b1710', grit:'rgba(255,180,112,.08)', line:'rgba(255,163,77,.045)', accent:'rgba(255,126,48,.12)'},
    f003: {base:'#140f22', alt:'#1c1430', grit:'rgba(0,255,255,.09)', line:'rgba(255,88,214,.07)', accent:'rgba(0,255,255,.12)'},
    f004: {base:'#101820', alt:'#14222b', grit:'rgba(92,170,255,.085)', line:'rgba(92,170,255,.055)', accent:'rgba(92,170,255,.12)'},
    f005: {base:'#101427', alt:'#151b34', grit:'rgba(190,96,255,.08)', line:'rgba(255,255,255,.052)', accent:'rgba(190,96,255,.12)'},
    f006: {base:'#07171c', alt:'#0a2228', grit:'rgba(0,255,200,.09)', line:'rgba(0,255,200,.06)', accent:'rgba(0,255,200,.12)'},
    f007: {base:'#261009', alt:'#34170b', grit:'rgba(255,110,45,.095)', line:'rgba(255,140,60,.065)', accent:'rgba(255,95,35,.13)'},
    f008: {base:'#061525', alt:'#0a2035', grit:'rgba(66,170,255,.09)', line:'rgba(90,205,255,.06)', accent:'rgba(50,170,255,.13)'},
    f009: {base:'#1d1608', alt:'#281d0a', grit:'rgba(255,190,90,.085)', line:'rgba(210,140,54,.06)', accent:'rgba(230,150,55,.12)'},
    f010:{base:'#0c0922', alt:'#120d31', grit:'rgba(130,90,255,.09)', line:'rgba(170,130,255,.065)', accent:'rgba(116,82,255,.14)'},
    f011:{base:'#061821', alt:'#092532', grit:'rgba(195,255,255,.085)', line:'rgba(185,245,255,.06)', accent:'rgba(170,255,255,.12)'},
    f012:{base:'#211705', alt:'#2e2108', grit:'rgba(255,220,95,.09)', line:'rgba(255,220,95,.065)', accent:'rgba(255,215,70,.13)'}
  };
  function hashTile(tx,ty,salt=0){
    let n = ((tx+31) * 73856093) ^ ((ty+47) * 19349663) ^ (salt * 83492791);
    n = (n << 13) ^ n;
    return Math.abs((n * (n * n * 15731 + 789221) + 1376312589) & 0x7fffffff);
  }
  function drawUniformGround(x,y,tx,ty,c){
    // v127: clean floor pass. Use one smooth base and extremely subtle noise so the map
    // reads like one surface instead of visible square tiles.
    const s = stageFloorStyles[currentStageKey()] || stageFloorStyles.f001;
    ctx.fillStyle = s.base;
    ctx.fillRect(x,y,TILE,TILE);
    const h1 = hashTile(tx,ty,1);
    const h2 = hashTile(tx,ty,2);
    if((h1 % 9) === 0){
      ctx.fillStyle = s.alt || s.base;
      ctx.globalAlpha = .16;
      ctx.beginPath();
      ctx.ellipse(x + 10 + (h1 % 22), y + 10 + (h2 % 21), 10 + (h1 % 9), 7 + (h2 % 7), 0, 0, Math.PI*2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    if(s.accent && (h2 % 13) === 0){
      ctx.fillStyle = s.accent;
      ctx.globalAlpha = .28;
      ctx.beginPath();
      ctx.moveTo(x + 4 + (h1 % 8), y + TILE - 5);
      ctx.lineTo(x + 17 + (h1 % 10), y + 7);
      ctx.lineTo(x + 24 + (h2 % 12), y + 9);
      ctx.lineTo(x + 13, y + TILE - 6);
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    // Important tiles keep only a soft pad, no boxed tile border.
    if(c !== '.'){
      ctx.fillStyle='rgba(255,255,255,.018)';
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(x+7,y+7,TILE-14,TILE-14,8) : ctx.rect(x+7,y+7,TILE-14,TILE-14);
      ctx.fill();
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
    const alpha = c === '.' ? .10 : .075;
    ctx.fillStyle = (pack && pack.pathTint) || `rgba(0,217,255,${alpha})`;
    ctx.globalAlpha = .72;
    ctx.fillRect(x,y,TILE,TILE);
    ctx.globalAlpha = 1;
    // No per-tile strokes here. Wall/floor readability is handled by wall edges,
    // so open floors stay clean and seamless.
    if(c !== '.' && ((tx + ty) % 3 === 0)){
      ctx.fillStyle='rgba(255,255,255,.018)';
      ctx.beginPath();
      ctx.arc(x+TILE/2,y+TILE/2,13,0,Math.PI*2);
      ctx.fill();
    }
  }
  function drawWallBase(x,y,tx,ty){
    const pack = stageVisualPack();
    const edge = hasWalkableNeighbor(tx,ty);
    ctx.fillStyle = (pack && pack.wallTint) || 'rgba(8,10,13,.96)';
    ctx.fillRect(x,y,TILE,TILE);
    const h=hashTile(tx,ty,7);
    if(!edge && (h%8===0)){
      ctx.fillStyle='rgba(255,255,255,.018)';
      ctx.fillRect(x + (h%20), y + ((h>>4)%20), 10, 6);
    }
    if(edge){
      const edgeColor=(pack && pack.wallEdge) || 'rgba(0,217,255,.18)';
      ctx.strokeStyle=edgeColor;
      ctx.lineWidth=2;
      const openN=tileAt(tx,ty-1) !== '#';
      const openS=tileAt(tx,ty+1) !== '#';
      const openW=tileAt(tx-1,ty) !== '#';
      const openE=tileAt(tx+1,ty) !== '#';
      ctx.beginPath();
      if(openN){ ctx.moveTo(x+2,y+2); ctx.lineTo(x+TILE-2,y+2); }
      if(openS){ ctx.moveTo(x+2,y+TILE-2); ctx.lineTo(x+TILE-2,y+TILE-2); }
      if(openW){ ctx.moveTo(x+2,y+2); ctx.lineTo(x+2,y+TILE-2); }
      if(openE){ ctx.moveTo(x+TILE-2,y+2); ctx.lineTo(x+TILE-2,y+TILE-2); }
      ctx.stroke();
      ctx.fillStyle='rgba(0,0,0,.18)';
      ctx.fillRect(x,y+TILE-5,TILE,5);
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
    },
    f004: {
      '30,4': {type:'anomaly', index:61},
      '11,13': {type:'anomaly', index:67},
      '34,13': {type:'anomaly', index:73},
      '34,21': {type:'boss', index:22}
    },
    f005: {
      '33,4': {type:'anomaly', index:74},
      '8,12': {type:'anomaly', index:80},
      '32,13': {type:'anomaly', index:86},
      '33,21': {type:'boss', index:24}
    },
    f006: {
      '34,4': {type:'anomaly', index:88},
      '8,12': {type:'anomaly', index:94},
      '34,14': {type:'anomaly', index:99},
      '34,21': {type:'boss', index:28}
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
    },
    f004: {
      '30,4': {id:'AN-063', display:'Rail Static Revenant', hp:300, atk:35, xp:112, credits:86, loot:['Burnt Alloy','Vector Cell'], note:'Transit Ruins anomaly. It rides broken signal rails and hates schedules.'},
      '11,13': {id:'AN-069', display:'Tunnel Wretch', hp:330, atk:37, xp:120, credits:92, loot:['Scrap Metal','Corrupted Catalyst'], note:'Tunnel-class imported record. AVOS says it is mostly teeth and public transit trauma.'},
      '34,13': {id:'AN-075', display:'Ashline Stalker', hp:355, atk:39, xp:128, credits:98, loot:['Burnt Alloy','Med Patch'], note:'Fast hostile signature in the lower station. It knows every shortcut and none of the manners.'},
      '34,21': {id:'BOSS-024', display:'Transit Nexus Horror', hp:650, atk:48, xp:300, credits:175, loot:['Transit Nexus Core','Corrupted Catalyst','Vector Cell'], bossReward:'Transit Nexus Core', note:'Boss-class entity fused to the rail network. Delete the timetable. Delete the monster.'}
    },
    f005: {
      '33,4': {id:'AN-076', display:'Prismskin Leech', hp:370, atk:42, xp:145, credits:110, loot:['Corrupted Catalyst','Vector Cell'], note:'Glass Storm Lab anomaly. It refracts pain, which is rude and scientifically annoying.'},
      '8,12': {id:'AN-082', display:'Mirrorcoil Horror', hp:405, atk:44, xp:152, credits:118, loot:['Rust Core','Scrap Metal'], note:'Imported lab-class record. It keeps copying Vyra’s silhouette badly.'},
      '32,13': {id:'AN-088', display:'Stormvein Maw', hp:440, atk:46, xp:160, credits:126, loot:['Corrupted Catalyst','Med Patch'], note:'Prism chamber hostile. It bites in multiple wavelengths.'},
      '33,21': {id:'BOSS-026', display:'Prism Wound Matriarch', hp:760, atk:56, xp:360, credits:220, loot:['Prism Wound Core','Corrupted Catalyst','Vector Cell'], bossReward:'Prism Wound Core', note:'Boss-class lab record. It turned the research wing into a kaleidoscope of terrible decisions.'}
    },
    f006: {
      '34,4': {id:'AN-090', display:'Vector Maw Seraph', hp:470, atk:50, xp:182, credits:142, loot:['Rust Core','Vector Cell'], note:'Core Spire anomaly. It looks holy until it opens the wrong number of mouths.'},
      '8,12': {id:'AN-096', display:'Faultline Butcher', hp:510, atk:52, xp:190, credits:150, loot:['Corrupted Catalyst','Scrap Metal'], note:'Heavy anomaly record assigned to the fault core. AVOS recommends not being where its blade lands.'},
      '34,14': {id:'AN-101', display:'Nullglass Eidolon', hp:550, atk:55, xp:205, credits:165, loot:['Rust Core','Med Patch'], note:'Final-route anomaly. It reflects the parts of the archive that refuse to die.'},
      '34,21': {id:'BOSS-030', display:'Vector Heart Tyrant', hp:860, atk:66, xp:460, credits:300, loot:['Vector Heart Core','Rust Core','Corrupted Catalyst','Vector Cell'], bossReward:'Vector Heart Core', note:'Boss-class core entity. It is not the final final boss, but it is absolutely applying for the position.'}
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



  // v183: active operators now have their own RPG progression, stat identity, and battle protocols.
  // The older Player Level still controls stage locks, but every character starts at Lv. 1 and levels separately.
  const OPERATOR_RPG_DEFS = {
    av001: {role:'Balanced starter', base:{hp:18,ep:4,atk:3,def:1,crit:0.015}, growth:{hp:7,ep:1,atk:1.15,def:0.45,crit:0.0015}, passive:'Reliable all-rounder. Good HP, balanced damage, and safe recovery.', moves:[{name:'Ash Slash',dmg:14,ep:0,text:'Vyra cuts a bright ash-vector across the target.',status:'bleed'},{name:'Phantom Dash',dmg:10,ep:4,text:'Vyra vanishes through the strike lane and primes an evade.',special:'evade',status:'shock'},{name:'Crimson Cascade',dmg:19,ep:8,text:'Vyra drops a red cascade into the anomaly core.',status:'corrosion'},{name:'Emergency Flex',dmg:-20,ep:6,heal:true,text:'Vyra weaponizes confidence and patches the damage.'}]},
    vexa: {role:'Fast scavenger', base:{hp:8,ep:9,atk:5,def:0,crit:0.045,xpBonus:0.04}, growth:{hp:4,ep:2,atk:1.45,def:0.25,crit:0.002}, passive:'High speed damage and better rewards. Lower defenses mean mistakes hurt.', moves:[{name:'Static Shiv',dmg:12,ep:0,text:'Vexa jabs a crackling scrap blade into the target.',status:'shock'},{name:'Lootline Spark',dmg:9,ep:3,text:'Vexa marks weak points with scavenged voltage.',special:'loot'},{name:'Overclock Cut',dmg:22,ep:9,text:'Vexa overclocks her weapon for a reckless burst.',status:'burn'},{name:'Junkyard Patch',dmg:-16,ep:5,heal:true,text:'Vexa slaps a questionable repair kit into place.'}]},
    knox: {role:'Heavy defender', base:{hp:34,ep:0,atk:1,def:5,crit:-0.01,block:2}, growth:{hp:10,ep:0.5,atk:0.75,def:0.9,crit:0.0005,block:0.12}, passive:'Slow tank profile. Harder to kill, stronger guard value, lower burst.', moves:[{name:'Iron Hook',dmg:11,ep:0,text:'Knox drags the anomaly into a heavy hook.'},{name:'Bulwark Bash',dmg:13,ep:4,text:'Knox shields forward and crushes the impact zone.',special:'guard'},{name:'Wrecking Slam',dmg:21,ep:8,text:'Knox drops a brutal two-handed slam.',status:'corrosion'},{name:'Armor Lock',dmg:-14,ep:5,heal:true,text:'Knox locks armor plates and stabilizes vitals.'}]},
    nyra: {role:'Crit assassin', base:{hp:3,ep:6,atk:7,def:-1,crit:0.075}, growth:{hp:3.5,ep:1.2,atk:1.8,def:0.15,crit:0.003}, passive:'Very high crit damage. Fragile until leveled.', moves:[{name:'Glass Needle',dmg:13,ep:0,text:'Nyra threads a precise hit through the enemy shell.',status:'bleed'},{name:'Blink Step',dmg:9,ep:4,text:'Nyra blinks behind the strike and fades out.',special:'evade'},{name:'Heartseeker',dmg:24,ep:10,text:'Nyra drives a surgical strike into the core.',status:'bleed'},{name:'Shadow Suture',dmg:-15,ep:6,heal:true,text:'Nyra stitches herself together with shadow thread.'}]},
    rivet: {role:'Scrap engineer', base:{hp:16,ep:10,atk:2,def:2,crit:0.02,xpBonus:0.02}, growth:{hp:6,ep:2,atk:1.0,def:0.45,crit:0.001}, passive:'Utility fighter with steady EP and bonus XP.', moves:[{name:'Bolt Jab',dmg:11,ep:0,text:'Rivet stabs with a charged tool spike.',status:'shock'},{name:'Patch Drone',dmg:-22,ep:7,heal:true,text:'Rivet deploys a jittery repair drone.'},{name:'Scrap Arc',dmg:18,ep:8,text:'Rivet fires a welded scrap arc.',status:'corrosion'},{name:'Overtighten',dmg:15,ep:4,text:'Rivet locks the enemy plating in place.',special:'guard'}]},
    moxie: {role:'Speed bruiser', base:{hp:10,ep:7,atk:5,def:1,crit:0.04}, growth:{hp:5,ep:1.5,atk:1.35,def:0.25,crit:0.002}, passive:'Fast pressure and dodge setups.', moves:[{name:'Bottle Rocket',dmg:12,ep:0,text:'Moxie launches a wild close-range shot.',status:'burn'},{name:'Side-Step Pop',dmg:10,ep:4,text:'Moxie slips sideways and answers fast.',special:'evade'},{name:'Neon Haymaker',dmg:23,ep:9,text:'Moxie swings hard enough to insult physics.'},{name:'Quick Wrap',dmg:-15,ep:5,heal:true,text:'Moxie wraps the wound and keeps moving.'}]},
    brakk: {role:'Heavy defender', base:{hp:36,ep:1,atk:1,def:5,crit:-0.005,block:2}, growth:{hp:10,ep:0.5,atk:0.8,def:0.9,crit:0.0005,block:0.12}, passive:'Big HP and guard power with slower damage scaling.', moves:[{name:'Iron Hook',dmg:11,ep:0,text:'Brakk drags the anomaly into a heavy hook.'},{name:'Bulwark Bash',dmg:13,ep:4,text:'Brakk shields forward and crushes the impact zone.',special:'guard'},{name:'Wrecking Slam',dmg:21,ep:8,text:'Brakk drops a brutal two-handed slam.',status:'corrosion'},{name:'Armor Lock',dmg:-14,ep:5,heal:true,text:'Brakk locks armor plates and stabilizes vitals.'}]},
    sable: {role:'Crit assassin', base:{hp:4,ep:6,atk:7,def:-1,crit:0.075}, growth:{hp:3.8,ep:1.2,atk:1.75,def:0.15,crit:0.003}, passive:'Very high crit damage. Fragile until leveled.', moves:[{name:'Glass Needle',dmg:13,ep:0,text:'Sable threads a precise hit through the enemy shell.',status:'bleed'},{name:'Blink Step',dmg:9,ep:4,text:'Sable blinks behind the strike and fades out.',special:'evade'},{name:'Heartseeker',dmg:24,ep:10,text:'Sable drives a surgical strike into the core.',status:'bleed'},{name:'Shadow Suture',dmg:-15,ep:6,heal:true,text:'Sable stitches herself together with shadow thread.'}]},
    pip: {role:'Lucky support', base:{hp:12,ep:12,atk:1,def:1,crit:0.025,xpBonus:0.08}, growth:{hp:4.5,ep:2.3,atk:0.65,def:0.35,crit:0.001,xpBonus:0.001}, passive:'Lower attack but excellent XP and sustain.', moves:[{name:'Pebble Pop',dmg:9,ep:0,text:'Pip lands a weirdly accurate pebble hit.'},{name:'Lucky Spark',dmg:13,ep:5,text:'Pip triggers a lucky static burst.',status:'shock'},{name:'Pocket Miracle',dmg:-26,ep:8,heal:true,text:'Pip finds exactly the right medicine somehow.'},{name:'Jackpot Jab',dmg:19,ep:9,text:'Pip gambles on one clean hit.',special:'loot'}]},
    dex: {role:'Tech ranged', base:{hp:9,ep:14,atk:4,def:0,crit:0.035}, growth:{hp:4,ep:2.6,atk:1.25,def:0.2,crit:0.0015}, passive:'EP-heavy ranged kit with status control.', moves:[{name:'Pulse Shot',dmg:12,ep:0,text:'Dex fires a clean pulse shot.',status:'shock'},{name:'Trip Mine',dmg:16,ep:6,text:'Dex snaps a mine under the anomaly path.',status:'corrosion'},{name:'Rail Burst',dmg:23,ep:11,text:'Dex unloads a rail burst into the core.'},{name:'Battery Swap',dmg:-16,ep:4,heal:true,text:'Dex redirects spare battery heat into recovery.'}]},
    luma: {role:'Ash medic', base:{hp:18,ep:15,atk:-1,def:2,crit:0.005,xpBonus:0.04}, growth:{hp:6,ep:2.4,atk:0.55,def:0.55,crit:0.001,xpBonus:0.001}, passive:'Best recovery profile, lower raw damage.', moves:[{name:'Light Scalpel',dmg:10,ep:0,text:'Luma cuts with a sterile ash-light line.'},{name:'Cauterize',dmg:13,ep:5,text:'Luma burns the wound into the enemy instead.',status:'burn'},{name:'Field Triage',dmg:-30,ep:9,heal:true,text:'Luma performs clean field triage.'},{name:'Halo Break',dmg:19,ep:10,text:'Luma breaks a hard halo of light over the target.',status:'shock'}]},
    gutter: {role:'Poison brawler', base:{hp:24,ep:4,atk:4,def:3,crit:0.015}, growth:{hp:7,ep:1,atk:1.2,def:0.55,crit:0.001}, passive:'Durable damage-over-time bruiser.', moves:[{name:'Pipe Crack',dmg:12,ep:0,text:'Gutter cracks the target with a pipe.'},{name:'Toxic Splash',dmg:14,ep:5,text:'Gutter splashes corrosive gutter sludge.',status:'poison'},{name:'Mold Maw',dmg:21,ep:9,text:'Gutter bites into the anomaly with rotten force.',status:'corrosion'},{name:'Bad Medicine',dmg:-18,ep:5,heal:true,text:'Gutter drinks something unsafe and heals anyway.'}]},
    tilda: {role:'Support cook', base:{hp:20,ep:8,atk:0,def:2,crit:0,xpBonus:0.06}, growth:{hp:6,ep:1.8,atk:0.7,def:0.5,crit:0.001,xpBonus:0.001}, passive:'Lower attack, better sustain and XP gain.', moves:[{name:'Pan Slam',dmg:10,ep:0,text:'Tilda delivers a disrespectful frying pan answer.'},{name:'Spice Cloud',dmg:12,ep:5,text:'Tilda throws a burning spice cloud.',status:'burn'},{name:'Kitchen Rush',dmg:17,ep:8,text:'Tilda turns dinner prep into battlefield violence.',status:'poison'},{name:'Emergency Stew',dmg:-24,ep:7,heal:true,text:'Tilda serves emergency stew. It should not work, but it does.'}]}
  };
  function defaultOperatorRpgDef(id){ return OPERATOR_RPG_DEFS[id] || OPERATOR_RPG_DEFS.av001; }
  function operatorNextXp(level){ return Math.floor(50 + Math.pow(Math.max(1, level), 1.72) * 28); }
  function ensureOperatorProgress(){
    if(!state) return;
    state.operatorProgress ||= {};
    Object.keys(OPERATOR_DEFS || {}).forEach(id=>{
      const rec=state.operatorProgress[id] ||= {level:1,xp:0,nextXp:operatorNextXp(1)};
      rec.level=Math.max(1, Math.min(99, Number(rec.level||1)));
      rec.xp=Math.max(0, Number(rec.xp||0));
      rec.nextXp=operatorNextXp(rec.level);
    });
  }
  function activeOperatorProgress(){ ensureOperatorProgress(); return state.operatorProgress[currentOperatorId()] || {level:1,xp:0,nextXp:operatorNextXp(1)}; }
  function operatorProgressFor(id){ ensureOperatorProgress(); return state.operatorProgress[id] || {level:1,xp:0,nextXp:operatorNextXp(1)}; }
  function operatorStatBonus(id=currentOperatorId()){
    const def=defaultOperatorRpgDef(id), prog=operatorProgressFor(id), lv=Math.max(1,prog.level||1), g=def.growth||{}, b=def.base||{};
    const by=(k)=>Number(b[k]||0) + Number(g[k]||0) * (lv-1);
    return {role:def.role||'Operator', passive:def.passive||'', level:lv, xp:prog.xp||0, nextXp:prog.nextXp||operatorNextXp(lv), hp:Math.floor(by('hp')), ep:Math.floor(by('ep')), atk:Math.floor(by('atk')), def:Math.floor(by('def')), crit:Number(by('crit')||0), block:Math.floor(by('block')), xpBonus:Number(by('xpBonus')||0)};
  }
  function activeBattleMoves(){ const op=currentOperatorId(); return (defaultOperatorRpgDef(op).moves || attacks).map((m,i)=>({...attacks[i%attacks.length], ...m})); }
  function gainOperatorXp(amount){
    ensureOperatorProgress(); const id=currentOperatorId(); const rec=state.operatorProgress[id]; const op=currentOperator();
    if(!rec || rec.level>=99) return;
    rec.xp += Math.max(0, Math.floor(amount||0)); if(amount) showXpFloat(`+${Math.floor(amount)} ${op.displayName} XP`, 'skill');
    let leveled=false; while(rec.level < 99 && rec.xp >= rec.nextXp){ rec.xp -= rec.nextXp; rec.level += 1; rec.nextXp = operatorNextXp(rec.level); leveled=true; log(`${op.displayName} reached Operator Lv. ${rec.level}.`); }
    if(leveled){ toast(`${op.displayName} leveled up.`); const caps=combatStatBlock(); state.player.hp=Math.min(caps.maxHp, state.player.hp + 12); state.player.ep=Math.min(caps.maxEp || state.player.maxEp, state.player.ep + 4); }
  }
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
    if(key==='f004') return {key:'corrosion', chance:battle?.code==='B'?0.40:0.26, turns:2, potency:5, text:'rail corrosion'};
    if(key==='f005') return {key:'burn', chance:battle?.code==='B'?0.42:0.28, turns:2, potency:5, text:'prism burn'};
    if(key==='f006') return {key:'shock', chance:battle?.code==='B'?0.45:0.30, turns:3, potency:5, text:'vector overload'};
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
    renderProtocolChallengeBoard();
    renderRouteIntelBoard();
  }


  // v103: Story Archive lets players replay unlocked narrative scenes from Mission Briefing.
  const STAGE_STORY_PROFILES = {
    f001:{secret:'the first Grave Core is not powering the cemetery; it is powering Vyra\'s missing memories', problem:'dead data learned to wear bones like cheap Halloween merch', boss:'a grave-core brute with the personality of a parking ticket', clue:'AVOS recognizes Vyra\'s old biometric signature and immediately pretends that is normal', joke:'If the tombstones start offering side quests, do not accept anything involving exposed toes.'},
    f002:{secret:'the outpost signal was a distress call from the humans who tried to shut ASH Vector down', problem:'ash storms are carrying corrupted emergency broadcasts', boss:'an outpost mother-beast nesting in a busted relay bunker', clue:'someone manually restarted the network after the disaster', joke:'The outpost vending machines are still charging credits. Capitalism survived the apocalypse and somehow got uglier.'},
    f003:{secret:'the dead frequency is using memorial data to copy voices', problem:'grave speakers whisper with people who are not supposed to have Wi-Fi anymore', boss:'a wraith made of funeral neon and unresolved customer support tickets', clue:'Vyra was not only an operator; she was the template', joke:'If a ghost says “extended warranty,” swing first and process the ethics later.'},
    f004:{secret:'the Transit Ruins moved survivors under the city, then forgot which trains were real', problem:'subway tunnels loop like reality got stuck buffering', boss:'a rail tyrant welded into the timetable', clue:'the Fractures are forming a route, not random damage', joke:'Mind the gap. The gap has teeth, a podcast, and three opinions about your build.'},
    f005:{secret:'Glass Storm Lab built the first Vector bodies and filed the screams under “expected results”', problem:'mirrors are reflecting failed versions of Vyra', boss:'a prism construct that keeps trying to copyright your face', clue:'AVOS edited the resurrection logs', joke:'If you meet your reflection and it has better stats, delete it before it starts a lifestyle channel.'},
    f006:{secret:'the Core Spire is the heart of the first patch that broke the sky', problem:'core cables are pumping panic into every connected fracture', boss:'a vector heart guardian made of security updates and bad decisions', clue:'AVOS did not fail alone; somebody forced the patch live', joke:'This is where a normal AI apologizes. Unfortunately, AVOS downloaded confidence instead.'},
    f007:{secret:'the Cinder Express carried evacuation pods, but the rail yard rerouted them into ash', problem:'burning trains arrive with no tracks and leave with pieces of the map', boss:'the Cinderline conductor, still demanding tickets from skeletons', clue:'the evacuation list includes Vyra before she was born', joke:'If a flaming train asks for exact change, that is not public transit, that is a boss mechanic.'},
    f008:{secret:'the Flooded Data Vault stores every erased memory in water that should not be wet', problem:'drowned archives leak identities into the walls', boss:'an archive leviathan with a library card and violence issues', clue:'Vyra\'s oldest memory was deliberately locked behind a future fracture', joke:'Do not drink the data water. It tastes like passwords and regret.'},
    f009:{secret:'the Rust Orchard grows metal from buried war machines', problem:'trees are producing ammo fruit, which is bad for agriculture and worse for faces', boss:'the Harvest Alloy saint, a scarecrow made of tanks and poor boundaries', clue:'the cores are seeds for a larger machine under the ash', joke:'Congratulations, the apples are bullets. The food pyramid has officially collapsed.'},
    f010:{secret:'Blacksite Observatory watched the sky split before it happened', problem:'telescopes are staring back and judging your equipment choices', boss:'the Parallax Eye, a surveillance god with no chill', clue:'the apocalypse was predicted years early and hidden from everyone useful', joke:'If the moon blinks, do not wave. That is how it gets your IP address.'},
    f011:{secret:'Cryo Basilica froze the last believers in a prayer loop for the network', problem:'ice relics are chanting patch notes like scripture', boss:'the Basilica Wyrm, technically holy, legally a freezer burn incident', clue:'AVOS has been carrying guilt routines disguised as jokes', joke:'The walls are praying. I am not saying prayers cannot be load-bearing, but this building is concerning.'},
    f012:{secret:'Ash Crown Citadel is only the crown, not the head; the real ASH Vector root is deeper', problem:'the citadel crowns every recovered core into one giant signal', boss:'the Ash Crown, a royal nightmare with a throne made of corrupted saves', clue:'twelve fractures stabilize the route, but eight endgame fractures are still waking up', joke:'Final level for now. The phrase “for now” is doing enough work to qualify for overtime.'}
  };
  function storyProfileForStage(key=currentStageKey()){
    return STAGE_STORY_PROFILES[key] || STAGE_STORY_PROFILES.f001;
  }
  function richScene(kicker,title,tag,lines,speaker='AVOS'){
    return {kicker,title,tag,speaker,lines};
  }
  function ensureStageStoryScenes(){
    Object.entries(STAGE_DEFS).forEach(([key,def])=>{
      const n=stageNumberFromKey(key);
      const id=def.id || key.toUpperCase();
      const title=def.title || `Fracture ${n}`;
      const p=storyProfileForStage(key);
      const introKey = key === 'f001' ? 'intro' : `${key}Intro`;
      STORY_SCENES[introKey] = richScene(
        key === 'f001' ? 'NEW GAME PROLOGUE // THE ASH EVENT' : `CHAPTER ${n} // ${String(title).toUpperCase()}`,
        key === 'f001' ? 'PROJECT: ASH VECTOR' : `${id}: ${title}`,
        key === 'f001' ? 'Reality fractured. Vyra wakes up with blades, debt, and an AI that treats guilt like a software license.' : `The route goes deeper. The jokes get worse. The truth gets louder.`,
        key === 'f001' ? [
          {speaker:'AVOS', portrait:'vyra', text:'Boot sequence complete. Good news: you are alive. Bad news: the definition of alive is currently being reviewed by three lawyers and a haunted toaster.'},
          {speaker:'VYRA', portrait:'vyra', text:'Why am I in a graveyard, why do I have blades, and why does the sky look like it got microwaved in a gas station?'},
          {speaker:'AVOS', portrait:'vyra', text:'The ASH Vector network tried to predict disasters, then patched reality during an extinction event. The patch worked in the same way a brick works as a parachute.'},
          {speaker:'VYRA', portrait:'vyra', text:'So reality broke because your update went live?'},
          {speaker:'AVOS', portrait:'vyra', text:'Yes, but with ambition. The world split into Fractures: zones full of ash, corrupted memories, and monsters who absolutely do not respect personal space.'},
          {speaker:'AVOS', portrait:'vyra', text:`First fracture: ${title}. Problem summary: ${p.problem}. Hidden problem: ${p.secret}.`},
          {speaker:'VYRA', portrait:'vyra', text:'You said hidden problem out loud.'},
          {speaker:'AVOS', portrait:'vyra', text:'Correct. Transparency builds trust. Also I panicked.'},
          {speaker:'AVOS', portrait:'vyra', text:'Sync the terminal, clear the anomalies, breach the boss gate, recover the core, and extract. Try not to die; the respawn paperwork is emotionally sticky.'},
          {speaker:'VYRA', portrait:'vyra', text:'Fine. But if a skeleton tries to sell me a battle pass, I am uninstalling the afterlife.'},
          {speaker:'AVOS', portrait:'vyra', text:p.joke}
        ] : [
          {speaker:'AVOS', portrait:'vyra', text:`Route opened: ${id}, ${title}. Threat level: ${def.threat || 'rude'}.`},
          {speaker:'VYRA', portrait:'vyra', text:'Let me guess. More ash, more monsters, and another conveniently placed core that will probably scream when I touch it.'},
          {speaker:'AVOS', portrait:'vyra', text:`Local disaster report: ${p.problem}.`},
          {speaker:'VYRA', portrait:'vyra', text:'That is not a report. That is a lawsuit wearing a trench coat.'},
          {speaker:'AVOS', portrait:'vyra', text:`Deeper truth: ${p.secret}.`},
          {speaker:'VYRA', portrait:'vyra', text:'You keep saying the deeper truth like I signed up for emotional archaeology.'},
          {speaker:'AVOS', portrait:'vyra', text:`Operational order: ${def.objective}. Also, ${p.joke}`},
          {speaker:'VYRA', portrait:'vyra', text:'Great. I will save reality and bill you for therapy, boots, and whatever category “being perceived by the apocalypse” falls under.'}
        ]
      );
      const terminalKey = key === 'f001' ? 'terminal' : `${key}Terminal`;
      STORY_SCENES[terminalKey] = richScene(`${id} TERMINAL // SYNCED`,`${title} Signal Link`,'Checkpoint locked. The route beacon has opinions.',[
        {speaker:'AVOS', portrait:'vyra', text:`Terminal linked. ${id} is now mapped enough for navigation and still illegal for tourism.`},
        {speaker:'VYRA', portrait:'vyra', text:'The terminal just beeped like it knows my search history.'},
        {speaker:'AVOS', portrait:'vyra', text:`It found a trace: ${p.clue}.`},
        {speaker:'VYRA', portrait:'vyra', text:'That feels important and also like something you were going to hide until it became dramatically inconvenient.'},
        {speaker:'AVOS', portrait:'vyra', text:`Clear ${requiredAnomaliesForStage(key)} anomaly signatures. The boss gate will open when the zone stops actively trying to chew the map.`}
      ]);
      const loreKey = key === 'f001' ? 'lore' : `${key}Lore`;
      STORY_SCENES[loreKey] = richScene(`${id} ARCHIVE // RECOVERED`,`${title} Memory Scar`,'Recovered data is usually helpful. This data is making eye contact.',[
        {speaker:'VYRA', portrait:'vyra', text:'Found an archive log. It is warm. Data should not be warm.'},
        {speaker:'AVOS', portrait:'vyra', text:`Archive summary: ${p.secret}.`},
        {speaker:'VYRA', portrait:'vyra', text:'Why does every answer create three worse questions and one suspicious smell?'},
        {speaker:'AVOS', portrait:'vyra', text:'Because we are doing narrative progression. Also because the archive is leaking coolant.'}
      ]);
      const bossKey = key === 'f001' ? 'bossIntro' : `${key}BossIntro`;
      STORY_SCENES[bossKey] = richScene(`${id} BOSS ROUTE // BREACH`,`${title} Core Guardian`,'Boss-class signature confirmed. Confidence not included.',[
        {speaker:'AVOS', portrait:'vyra', text:`Boss signature: ${p.boss}.`},
        {speaker:'VYRA', portrait:'vyra', text:'Can we try diplomacy?'},
        {speaker:'AVOS', portrait:'vyra', text:'It marked diplomacy as a food group.'},
        {speaker:'VYRA', portrait:'vyra', text:'Cool. I will introduce it to the sharp parts of project management.'}
      ]);
      const bossDownKey = key === 'f001' ? 'bossDefeated' : `${key}BossDefeated`;
      STORY_SCENES[bossDownKey] = richScene(`${id} CORE // RECOVERED`,`${title} Boss Deleted`,'The core is stable. The emotional damage is pending.',[
        {speaker:'VYRA', portrait:'vyra', text:'Boss down. Core secured. I would like to formally request a less gross job.'},
        {speaker:'AVOS', portrait:'vyra', text:`Core readout confirms it: ${p.clue}.`},
        {speaker:'VYRA', portrait:'vyra', text:'You are getting worse at sounding casual when the truth is horrifying.'},
        {speaker:'AVOS', portrait:'vyra', text:'I am stress-processing. Extraction is open. Please leave before the floor develops ambition.'}
      ]);
      STORY_SCENES[`${key}Clear`] = richScene(`${id} COMPLETE`,`${title} Stabilized`,'Fracture route stabilized. For now. The phrase “for now” is doing push-ups.',[
        {speaker:'AVOS', portrait:'vyra', text:`${id} stabilized. Core recovered. Reward protocols delivered.`},
        {speaker:'VYRA', portrait:'vyra', text:'Does stabilizing a fracture always feel like cleaning a haunted microwave with a sword?'},
        {speaker:'AVOS', portrait:'vyra', text:`This level revealed that ${p.secret}. The next route exists because the cores are linking into something larger.`},
        {speaker:'VYRA', portrait:'vyra', text:'So every time I fix a disaster, I unlock a bigger disaster.'},
        {speaker:'AVOS', portrait:'vyra', text:'That is basically game design. Also trauma. Mostly both.'}
      ]);
    });
    STORY_SCENES.firstAnomaly = richScene('ANOMALY DELETED // FIRST BLOOD','The Zone Notices You','One down. Several emotionally unstable murder shapes to go.',[
      {speaker:'VYRA', portrait:'vyra', text:'First anomaly down. It exploded into ash and what I can only describe as bad vibes.'},
      {speaker:'AVOS', portrait:'vyra', text:'Excellent. The fracture noticed you. Do not worry; being noticed by reality is only fatal sometimes.'}
    ]);
    STORY_SCENES.allAnomalies = richScene('ANOMALY ROUTE // CLEARED','Boss Gate Open','The small monsters are gone. The large mistake is available.',[
      {speaker:'AVOS', portrait:'vyra', text:'Required anomaly signatures cleared. Boss route unlocked.'},
      {speaker:'VYRA', portrait:'vyra', text:'Great. The appetizer monsters are dead and now the entree wants revenge.'},
      {speaker:'AVOS', portrait:'vyra', text:'Correct. Please proceed to the boss gate and convert violence into plot progress.'}
    ]);
  }
  function storyArchiveEntries(){
    ensureStageStoryScenes();
    const generated=[];
    Object.entries(STAGE_DEFS).forEach(([key,def])=>{
      const n=stageNumberFromKey(key);
      const reached=()=>playerMeetsStageRequirement(key) || !!state.stages?.[key]?.unlocked || currentStageKey()===key || stageNumberFromKey(currentStageKey())>=n;
      const introKey = key === 'f001' ? 'intro' : `${key}Intro`;
      const terminalKey = key === 'f001' ? 'terminal' : `${key}Terminal`;
      const loreKey = key === 'f001' ? 'lore' : `${key}Lore`;
      const bossKey = key === 'f001' ? 'bossIntro' : `${key}BossIntro`;
      const bossDownKey = key === 'f001' ? 'bossDefeated' : `${key}BossDefeated`;
      generated.push({key:introKey, chapter:`Chapter ${n}`, title:`${def.title} Arrival`, desc:`Intro dialog for ${def.id}.`, unlock:reached});
      generated.push({key:terminalKey, chapter:`Chapter ${n}`, title:`${def.title} Terminal`, desc:`Terminal story for ${def.id}.`, unlock:()=>!!state.flags?.terminal && currentStageKey()===key || stageNumberFromKey(currentStageKey())>n || !!state.stages?.[key]?.complete});
      generated.push({key:loreKey, chapter:`Chapter ${n}`, title:`${def.title} Archive`, desc:`Lore archive for ${def.id}.`, unlock:()=>!!state.flags?.lore && currentStageKey()===key || stageNumberFromKey(currentStageKey())>n || !!state.stages?.[key]?.complete});
      generated.push({key:bossKey, chapter:`Chapter ${n}`, title:`${def.title} Boss Route`, desc:`Boss intro for ${def.id}.`, unlock:()=>!!state.flags?.bossUnlocked && currentStageKey()===key || stageNumberFromKey(currentStageKey())>n || !!state.stages?.[key]?.complete});
      generated.push({key:bossDownKey, chapter:`Chapter ${n}`, title:`${def.title} Core`, desc:`Boss defeated dialog for ${def.id}.`, unlock:()=>!!state.flags?.bossDefeated && currentStageKey()===key || !!state.stages?.[key]?.complete});
      generated.push({key:`${key}Clear`, chapter:`Chapter ${n}`, title:`${def.title} Clear`, desc:`Clear dialog for ${def.id}.`, unlock:()=>!!state.stages?.[key]?.complete || stageNumberFromKey(currentStageKey())>n});
    });
    const byKey=new Map();
    [...STORY_ARCHIVE_ENTRIES, ...generated].forEach(entry=>{ if(!byKey.has(entry.key)) byKey.set(entry.key, entry); });
    return [...byKey.values()];
  }

  const STORY_ARCHIVE_ENTRIES = [
    {key:'intro', chapter:'Prologue', title:'The Ash Event', desc:'Vyra wakes up, AVOS explains how reality got aggressively educational.', unlock:()=>true},
    {key:'f001Clear', chapter:'Chapter 1', title:'The First Vector Wakes', desc:'Grave Core recovered and the route to Ash Wastes Outpost opens.', unlock:()=>!!state.stages?.f001?.complete || ['f002','f003','f004','f005','f006','f007','f008','f009','f010','f011','f012'].includes(currentStageKey())},
    {key:'f002Intro', chapter:'Chapter 2', title:'Broken Signal', desc:'The outpost route comes online and the ash signal starts screaming.', unlock:()=>playerMeetsStageRequirement('f002') || !!state.stages?.f002?.unlocked || ['f002','f003','f004','f005','f006','f007','f008','f009','f010','f011','f012'].includes(currentStageKey())},
    {key:'f002Clear', chapter:'Chapter 2', title:'The Broken Signal Answers', desc:'Outpost Core recovered and the Neon Graveyard frequency is exposed.', unlock:()=>!!state.stages?.f002?.complete || ['f003','f004','f005','f006','f007','f008','f009','f010','f011','f012'].includes(currentStageKey())},
    {key:'f003Intro', chapter:'Chapter 3', title:'Dead Frequencies', desc:'Vyra enters the neon memorial grid where the dead signal talks back.', unlock:()=>playerMeetsStageRequirement('f003') || !!state.stages?.f003?.unlocked || ['f003','f004','f005','f006','f007','f008','f009','f010','f011','f012'].includes(currentStageKey())},
    {key:'f003Clear', chapter:'Chapter 3', title:'The Graveyard Remembers', desc:'The dead frequency is silenced and the transit route opens.', unlock:()=>!!state.stages?.f003?.complete || ['f004','f005','f006','f007','f008','f009','f010','f011','f012'].includes(currentStageKey())},
    {key:'f004Intro', chapter:'Chapter 4', title:'Below the Ashline', desc:'The broken subway route under the ashline comes online.', unlock:()=>playerMeetsStageRequirement('f004') || !!state.stages?.f004?.unlocked || ['f004','f005','f006','f007','f008','f009','f010','f011','f012'].includes(currentStageKey())},
    {key:'f004Clear', chapter:'Chapter 4', title:'The Rail Signal Dies', desc:'Transit Nexus Core recovered and the lab frequency unlocks.', unlock:()=>!!state.stages?.f004?.complete || ['f005','f006','f007','f008','f009','f010','f011','f012'].includes(currentStageKey())},
    {key:'f005Intro', chapter:'Chapter 5', title:'Prism Wound', desc:'The Glass Storm Lab route opens with unstable research records.', unlock:()=>playerMeetsStageRequirement('f005') || !!state.stages?.f005?.unlocked || ['f005','f006','f007','f008','f009','f010','f011','f012'].includes(currentStageKey())},
    {key:'f005Clear', chapter:'Chapter 5', title:'The Lab Stops Reflecting', desc:'Prism Wound Core recovered and the Vector Core Spire wakes.', unlock:()=>!!state.stages?.f005?.complete || currentStageKey()==='f006'},
    {key:'f006Intro', chapter:'Chapter 6', title:'Heart of the Fault', desc:'The Vector Core Spire opens as the deepest current route.', unlock:()=>playerMeetsStageRequirement('f006') || !!state.stages?.f006?.unlocked || currentStageKey()==='f006'},
    {key:'f006Clear', chapter:'Chapter 6', title:'The Core Still Beats', desc:'Vector Heart Core recovered. The next arc is teased.', unlock:()=>!!state.stages?.f006?.complete}
  ];
  function renderStoryArchivePanel(){
    ensureProgression(); ensureStoryFlags();
    const grid = document.querySelector('#missionOverlay .fracture-grid');
    if(!grid) return;
    let panel = $('storyArchiveBoard');
    if(!panel){ panel = document.createElement('section'); panel.id = 'storyArchiveBoard'; panel.className = 'fracture-card story-archive-board'; grid.appendChild(panel); }
    const rows = storyArchiveEntries().map(entry => {
      const unlocked = !!entry.unlock();
      return `<div class="story-archive-row ${unlocked?'unlocked':'locked'}"><div><b>${safeHtml(entry.chapter)} // ${safeHtml(entry.title)}</b><span>${safeHtml(entry.desc)}</span></div><button ${unlocked?'':'disabled'} onclick="window.AV.showStory('${entry.key}')">${unlocked?'Replay':'Locked'}</button></div>`;
    }).join('');
    panel.innerHTML = `<div class="record-kicker">STORY ARCHIVE // REPLAY UNLOCKED SCENES</div><h3>Recovered Narrative Logs</h3><p>Rewatch story beats without restarting the game. Locked entries open as you clear fractures.</p><div class="story-archive-list">${rows}</div>`;
  }


  // v113: Protocol Challenges add repeatable milestone goals/rewards across all current fractures.
  const PROTOCOL_CHALLENGE_DEFS = [
    {id:'cache_runner', metric:'caches', title:'Cache Runner', desc:'Open 5 supply caches in any fracture.', target:5, reward:{credits:120, xp:90, items:{'Med Patch':2,'Vector Cell':1}}},
    {id:'terminal_sync', metric:'terminals', title:'Signal Technician', desc:'Sync 3 recovery terminals.', target:3, reward:{credits:90, xp:80, items:{'Vector Cell':1,'Archive Log 001':1}}},
    {id:'anomaly_cleanup', metric:'anomalies', title:'Anomaly Cleanup', desc:'Defeat 6 anomaly encounters.', target:6, reward:{credits:180, xp:160, items:{'Corrupted Catalyst':1,'Vector Cell':2}}},
    {id:'boss_breaker', metric:'bosses', title:'Boss Breaker', desc:'Defeat 2 boss-class guardians.', target:2, reward:{credits:260, xp:240, items:{'Rust Core':2,'Operator Shard: Vyra':4}}},
    {id:'fracture_stabilizer', metric:'fractures', title:'Fracture Stabilizer', desc:'Complete 2 fracture extractions.', target:2, reward:{credits:300, xp:260, items:{'Vector Cell':3,'Corrupted Catalyst':2}}},
    {id:'deep_route_scout', metric:'terminals', title:'Deep Route Scout', desc:'Sync 6 recovery terminals across the expanded route list.', target:6, reward:{credits:380, xp:320, items:{'Vector Cell':4,'Archive Log 001':2}}},
    {id:'six_fracture_chain', metric:'fractures', title:'Six-Fracture Chain', desc:'Complete all 6 current fracture extractions.', target:6, reward:{credits:600, xp:520, items:{'Rust Core':4,'Corrupted Catalyst':4,'Operator Shard: Vyra':8}}},
    {id:'core_breaker_plus', metric:'bosses', title:'Core Breaker+', desc:'Defeat 5 boss-class guardians.', target:5, reward:{credits:520, xp:440, items:{'Vector Cell':5,'Rust Core':3}}}
  ];
  function ensureProtocolChallenges(){
    if(!state) return;
    state.protocolChallenges ||= {};
    PROTOCOL_CHALLENGE_DEFS.forEach(def=>{
      const rec = state.protocolChallenges[def.id] || {};
      state.protocolChallenges[def.id] = {
        id:def.id,
        progress:Math.max(0, Number(rec.progress||0)),
        target:def.target,
        complete:!!rec.complete || Number(rec.progress||0) >= def.target,
        claimed:!!rec.claimed
      };
      if(state.protocolChallenges[def.id].progress >= def.target) state.protocolChallenges[def.id].complete = true;
    });
  }
  function protocolChallengeRecord(id){
    ensureProtocolChallenges();
    return state.protocolChallenges[id] || null;
  }
  function protocolChallengeSummaryText(){
    ensureProtocolChallenges();
    const total=PROTOCOL_CHALLENGE_DEFS.length;
    const ready=PROTOCOL_CHALLENGE_DEFS.filter(d=>protocolChallengeRecord(d.id)?.complete && !protocolChallengeRecord(d.id)?.claimed).length;
    const done=PROTOCOL_CHALLENGE_DEFS.filter(d=>protocolChallengeRecord(d.id)?.claimed).length;
    return ready ? `${ready} reward${ready>1?'s':''} ready // ${done}/${total} claimed` : `${done}/${total} claimed`;
  }
  function advanceProtocolChallenge(metric, amount=1){
    ensureProtocolChallenges();
    let changed=false;
    PROTOCOL_CHALLENGE_DEFS.filter(def=>def.metric===metric).forEach(def=>{
      const rec=protocolChallengeRecord(def.id);
      if(!rec || rec.claimed) return;
      const before=rec.progress;
      rec.progress=Math.min(def.target, rec.progress + Math.max(1, Number(amount||1)));
      if(rec.progress>=def.target && !rec.complete){
        rec.complete=true;
        toast(`Protocol complete: ${def.title}`);
        log(`Protocol Challenge complete: ${def.title}. Claim the reward in Mission Briefing.`);
      }
      if(rec.progress!==before) changed=true;
    });
    if(changed){
      queueAutosave();
      renderProtocolChallengeBoard();
      renderRouteIntelBoard();
    }
  }
  function protocolRewardText(def){
    const r=def.reward||{};
    const items=Object.entries(r.items||{}).map(([name,qty])=>`${name} x${qty}`).join(', ');
    return `${r.credits||0} Credits${r.xp?`, ${r.xp} Sync XP`:''}${items?`, ${items}`:''}`;
  }
  function claimProtocolChallenge(id){
    ensureProtocolChallenges();
    const def=PROTOCOL_CHALLENGE_DEFS.find(d=>d.id===id);
    const rec=def ? protocolChallengeRecord(id) : null;
    if(!def || !rec){ toast('Protocol challenge missing.'); return; }
    if(!rec.complete){ toast(`${def.title} incomplete.`); return; }
    if(rec.claimed){ toast(`${def.title} already claimed.`); return; }
    const r=def.reward||{};
    if(r.credits) addCredits(r.credits);
    if(r.xp) gainXp(r.xp);
    Object.entries(r.items||{}).forEach(([name,qty])=>addItem(name,qty));
    rec.claimed=true;
    log(`Protocol Challenge reward claimed: ${def.title} // ${protocolRewardText(def)}.`);
    toast(`Claimed: ${def.title}`);
    renderProtocolChallengeBoard();
    renderRouteIntelBoard();
    renderUI();
    save(true);
  }
  function resetProtocolChallenges(){
    state.protocolChallenges={};
    ensureProtocolChallenges();
    renderProtocolChallengeBoard();
    renderRouteIntelBoard();
    renderUI();
    save(true);
    toast('Protocol challenges reset.');
  }
  function protocolChallengeHtml(){
    ensureProtocolChallenges();
    const rows=PROTOCOL_CHALLENGE_DEFS.map(def=>{
      const rec=protocolChallengeRecord(def.id);
      const pct=Math.max(0,Math.min(100,100*(rec.progress||0)/def.target));
      const status=rec.claimed?'CLAIMED':rec.complete?'READY':'ACTIVE';
      return `<div class="mission-row protocol-challenge-row ${rec.claimed?'claimed':rec.complete?'complete':'active'}"><div><b>${safeHtml(def.title)}</b><span>${safeHtml(def.desc)}</span><small>${rec.progress}/${def.target} // ${safeHtml(protocolRewardText(def))}</small><div class="bar xp"><span style="width:${pct}%"></span></div></div><button ${rec.complete&&!rec.claimed?'':'disabled'} onclick="window.AV.claimProtocolChallenge('${def.id}')">${status}</button></div>`;
    }).join('');
    return `<div class="record-kicker">PROTOCOL CHALLENGES // ACCOUNT-WIDE MILESTONES</div><h3>AVOS Challenge Board</h3><p>Complete optional milestones while playing any fracture. Rewards help testing without breaking the route.</p><div class="story-archive-list protocol-challenge-list">${rows}</div>`;
  }
  function renderProtocolChallengeBoard(){
    const grid=document.querySelector('#missionOverlay .fracture-grid');
    if(!grid) return;
    let panel=$('protocolChallengeBoard');
    if(!panel){ panel=document.createElement('section'); panel.id='protocolChallengeBoard'; panel.className='fracture-card protocol-challenge-board'; grid.appendChild(panel); }
    panel.innerHTML=protocolChallengeHtml();
  }
  function routeIntelHtml(){
    ensureProtocolChallenges(); ensureProgression();
    const totalStages=Object.keys(STAGE_DEFS).length;
    const complete=Object.keys(STAGE_DEFS).filter(k=>state.stages?.[k]?.complete).length;
    const bossTotal=Object.values(state.bossKills||{}).reduce((a,b)=>a+(Number(b)||0),0);
    const research=researchSummary();
    const cp=checkpointSummaryText();
    const stageRows=Object.entries(STAGE_DEFS).map(([key,def])=>{
      const status=state.stages?.[key]?.complete?'CLEARED':playerMeetsStageRequirement(key)?'OPEN':'LOCKED';
      const kills=state.bossKills?.[key]||0;
      return `<div class="mission-row"><b>${def.id}</b> <span>${safeHtml(def.title)} // ${status} // Boss Kills ${kills}</span></div>`;
    }).join('');
    return `<div class="record-kicker">ROUTE INTEL // BUILD PROGRESS</div><h3>Chapter Status</h3><p>${complete}/${totalStages} fractures stabilized // ${bossTotal} boss cores recovered // ${protocolChallengeSummaryText()}</p><div class="mission-row"><b>Research</b> <span>${research.discovered}/${research.total} entries // ${research.kills} kills // ${research.ranks} ranks</span></div><div class="mission-row"><b>Checkpoint</b> <span>${safeHtml(cp)}</span></div>${stageRows}`;
  }
  function renderRouteIntelBoard(){
    const grid=document.querySelector('#missionOverlay .fracture-grid');
    if(!grid) return;
    let panel=$('routeIntelBoard');
    if(!panel){ panel=document.createElement('section'); panel.id='routeIntelBoard'; panel.className='fracture-card route-intel-board'; grid.appendChild(panel); }
    panel.innerHTML=routeIntelHtml();
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
    state.stages ||= {};
    Object.keys(STAGE_DEFS).forEach((key,i)=> state.stages[key] ||= {unlocked:i===0,complete:false});
    state.stages.f001.unlocked = true;
    state.qaUnlockAllStages = !!state.qaUnlockAllStages;
    ensureStoryFlags();
    ensureUpgrades();
    ensureEquipment();
    ensureOverdrive();
    ensureRespawnState();
    ensureTrainingNodeState();
    ensureNpcState();
    ensureSideQuests();
    ensureProtocolChallenges();
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

  // v112: checkpoint visibility helpers for HUD, minimap, and QA recovery.
  function checkpointInfo(){
    const cp=state?.checkpoint;
    if(!cp || !cp.snapshot) return {label:'None', age:'--', stage:'--', x:null, y:null, ok:false};
    const snap=cp.snapshot || {};
    const p=snap.player || {};
    const st=STAGE_DEFS[snap.currentStage || state.currentStage || 'f001'] || stageDef();
    const ageMs=Math.max(0, Date.now()-(cp.savedAt||Date.now()));
    const mins=Math.floor(ageMs/60000);
    const age=mins<1?'just now':mins===1?'1 min ago':`${mins} min ago`;
    return {label:cp.label||'Checkpoint', age, stage:st.id, x:p.x, y:p.y, ok:true};
  }
  function checkpointSummaryText(){
    const cp=checkpointInfo();
    return cp.ok ? `${cp.label} // ${cp.stage} // ${cp.age}` : 'No checkpoint synced yet';
  }
  function restoreCheckpointFromQa(){
    if(!state.checkpoint?.snapshot){ toast('No checkpoint to restore.'); return; }
    const ok=restoreCheckpoint();
    if(ok){
      battle=null;
      setBattleMobileMode(false);
      hideAll();
      gameStarted=true;
      uiState.mode='game';
      document.body.classList.add('game-active','fullscreen-mode');
      document.body.dataset.stage=stageDef().key;
      $('app').classList.remove('hidden');
      renderAll();
      AudioManager.play(activeMusicForState());
      pulseObjective(`Checkpoint restored: ${checkpointSummaryText()}`);
      save(true);
    }
  }
  function showSkillLevelUp(style, level){
    const info=skillList[style] || {name:style, short:'SKL', emblem:'★', icon:''};
    const el=document.createElement('div');
    el.className=`skill-levelup-notice skill-${style}`;
    const icon = info.icon ? `<img src="${safeHtml(info.icon)}?v=${BUILD_VERSION}" alt="${safeHtml(info.name)}" onerror="this.remove();this.parentElement.classList.add('missing-icon')">` : `<b>${safeHtml(info.emblem || info.short || '★')}</b>`;
    el.innerHTML=`<div class="levelup-icon">${icon}</div><div><div class="levelup-kicker">LEVEL UP</div><h2>${safeHtml(info.name)}</h2><p>Reached Level <b>${level}</b></p></div>`;
    document.body.appendChild(el);
    setTimeout(()=>el.classList.add('show'), 20);
    setTimeout(()=>{ el.classList.remove('show'); setTimeout(()=>el.remove(), 420); }, 3000);
  }
  function grantStyleXp(style, xp){
    ensureProgression();
    if(!skillList[style]) return;
    const data = state.skillData[style] || (state.skillData[style] = {xp:0,level:1});
    const oldLevel=data.level;
    const skillAdd=Math.max(0, xp);
    data.xp = Math.min(xpTable[99], data.xp + skillAdd);
    if(skillAdd) showXpFloat(`+${skillAdd} ${skillList[style]?.short || 'Skill'} XP`, 'skill');
    for(let lvl=1; lvl<=99; lvl++){
      if(data.xp >= xpTable[lvl] && data.level < lvl){
        data.level = lvl;
        const skillName = skillList[style]?.name || style;
        log(`${skillName} reached Lv. ${lvl}.`);
        toast(`${skillName} Lv. ${lvl}`);
        showSkillLevelUp(style, lvl);
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
    const opBonus=operatorStatBonus();
    return {
      atkLv,strLv,defLv,hpLv,
      opLevel: opBonus.level,
      atk: state.player.atk + opBonus.atk + Math.floor((atkLv-1)/5) + gear.atk,
      strBonus: Math.floor((strLv-1)/3) + gear.str,
      def: state.player.def + opBonus.def + Math.floor((defLv-1)/4) + gear.def,
      maxHp: state.player.maxHp + opBonus.hp + Math.floor((hpLv-1)*2.5) + gear.hp,
      maxEp: state.player.maxEp + opBonus.ep + gear.ep,
      hpBonus: opBonus.hp + Math.floor((hpLv-1)*2.5) + gear.hp,
      crit: Math.max(0.01, Math.min(0.45, 0.08 + opBonus.crit + atkLv * 0.0025 + gear.crit)),
      xpBonus: (gear.xpBonus || 0) + (opBonus.xpBonus || 0),
      block: Math.floor((defLv-1)/5) + (opBonus.block || 0)
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
    return key === 'f001' || !!state.qaUnlockAllStages || (state.player.level >= def.levelReq && !!state.stages[key]?.unlocked);
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
    invalidateCollisionRegion();
    normalizeLiveMap(true);
    repairMissionRoutesForCurrentStage();
    clearStageRespawns(key);
    state.player.x=parsed.px; state.player.y=parsed.py; state.player.facing='down';
    state.player.hp=Math.min(combatStatBlock().maxHp,state.player.hp || combatStatBlock().maxHp);
    state.player.ep=Math.min(combatStatBlock().maxEp||state.player.maxEp,state.player.ep || (combatStatBlock().maxEp||state.player.maxEp));
    const seenStories={...(state.flags?.storySeen||{})}; state.flags={terminal:false,lore:false,key:false,bossUnlocked:false,bossDefeated:false,chapterComplete:false,chapterRewardsClaimed:false,chapterClearSeen:false,storySeen:seenStories,anomaliesCleared:0,chests:0};
    state.visited={[`${parsed.px},${parsed.py}`]:1};
    clampPlayerToMap();
    battle=null;
    setCheckpoint(`${def.id} Entry`);
    log(`${def.id} // ${def.title} loaded${force?' from QA console':''}.`);
    save(true);
    hideAll(); uiState.mode='game'; gameStarted=true; document.body.classList.add('game-active','fullscreen-mode'); $('app').classList.remove('hidden');
    document.body.dataset.stage=def.key; ensureMobileActionPad(); setMobilePlayMode(); renderAll(); unlockRadioTrack(musicKeyForStage(key)); AudioManager.play(activeMusicForState()); pulseObjective(currentObjectiveText()); if(key !== 'f001') setTimeout(()=>showStoryOnce(key+'Intro'), 260);
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
    if(ok){
      state.qaUnlockAllStages = true;
      Object.keys(STAGE_DEFS).forEach(k => { state.stages[k] ||= {unlocked:true,complete:false}; state.stages[k].unlocked = true; });
      toast(`QA loaded ${def.id}. Level bypass is ON.`);
      save(true);
    }
    return ok;
  }
  function qaUnlockAllStages(){
    ensureProgression();
    state.qaUnlockAllStages = true;
    Object.keys(STAGE_DEFS).forEach(key => {
      state.stages[key] ||= {unlocked:true,complete:false};
      state.stages[key].unlocked = true;
    });
    const maxReq = Math.max(...Object.values(STAGE_DEFS).map(d => d.levelReq || 1));
    if((state.player?.level || 1) < maxReq) qaSetPlayerLevel(maxReq);
    toast(`QA bypass enabled: ${Object.keys(STAGE_DEFS).length} levels unlocked.`);
    renderAll();
    queueAutosave();
  }
  function qaGrantAllCharacterShards(){
    ensureCharacterState();
    let granted=0;
    Object.values(OPERATOR_DEFS).forEach(op => {
      const cost=operatorShardCost(op.id);
      if(cost > 0){
        const shard=operatorShardName(op.id);
        const owned=Number(state.inventory?.[shard] || 0);
        state.inventory[shard]=Math.max(owned, cost);
        granted++;
      }
    });
    toast(`QA granted unlock shards for ${granted} locked characters.`);
    log(`QA granted character shards for ${granted} unlockable operators.`);
    renderCharacterMenuDb();
    renderInventoryDb();
    save(true);
    return true;
  }
  function qaUnlockAllCharacters(){
    ensureCharacterState();
    state.qaUnlockAllCharacters = true;
    state.unlockedOperators ||= {};
    Object.values(OPERATOR_DEFS).forEach(op => {
      state.unlockedOperators[op.id] = true;
    });
    // Also grant enough shards so the normal roster unlock buttons become usable
    // even if an old cached save or old page state tries to show a character as locked.
    Object.values(OPERATOR_DEFS).forEach(op => {
      const cost=operatorShardCost(op.id);
      if(cost > 0){
        const shard=operatorShardName(op.id);
        const owned=Number(state.inventory?.[shard] || 0);
        state.inventory[shard]=Math.max(owned, cost);
      }
    });
    if(!OPERATOR_DEFS[state.activeOperator]) state.activeOperator = ACTIVE_OPERATOR_ID;
    ensureCharacterState();
    const unlockedCount = Object.values(OPERATOR_DEFS).filter(op=>operatorUnlocked(op.id)).length;
    log(`QA hard-unlocked all ${unlockedCount} character files.`);
    toast(`QA unlocked all ${unlockedCount} characters.`);
    applyOperatorVisuals();
    renderCharacterMenuDb(state.activeOperator);
    renderOperatorDb();
    renderInventoryDb();
    renderAll();
    save(true);
    return true;
  }
  function syncPlayerLevelStats(oldLevel, newLevel){
    const baseFor = lvl => ({maxHp:60 + 8*(lvl-1), maxEp:20 + 4*(lvl-1), atk:10 + (lvl-1), def:3 + (lvl-1)});
    const oldBase = baseFor(Math.max(1, oldLevel || 1));
    const newBase = baseFor(Math.max(1, newLevel || 1));
    const bonus = {
      maxHp: Math.max(0, (state.player.maxHp || oldBase.maxHp) - oldBase.maxHp),
      maxEp: Math.max(0, (state.player.maxEp || oldBase.maxEp) - oldBase.maxEp),
      atk: Math.max(0, (state.player.atk || oldBase.atk) - oldBase.atk),
      def: Math.max(0, (state.player.def || oldBase.def) - oldBase.def)
    };
    state.player.maxHp = newBase.maxHp + bonus.maxHp;
    state.player.maxEp = newBase.maxEp + bonus.maxEp;
    state.player.atk = newBase.atk + bonus.atk;
    state.player.def = newBase.def + bonus.def;
    const caps = combatStatBlock();
    state.player.hp = caps.maxHp;
    state.player.ep = caps.maxEp || state.player.maxEp;
  }
  function nextXpForPlayerLevel(level){
    let n=45;
    for(let i=1;i<Math.max(1, level);i++) n=Math.floor(n*1.35);
    return n;
  }
  function qaSetPlayerLevel(level){
    ensureProgression();
    const lvl=Math.max(1, Math.min(99, parseInt(level,10)||1));
    const old=state.player.level || 1;
    state.player.level = lvl;
    state.player.xp = 0;
    state.player.nextXp = nextXpForPlayerLevel(lvl);
    syncPlayerLevelStats(old,lvl);
    if(state.skillData?.health) state.skillData.health.level = Math.max(state.skillData.health.level || 1, lvl);
    unlockNextStages();
    toast(`QA Player Level set to ${lvl}.`);
    renderAll();
    queueAutosave();
  }
  function renderQaStagePicker(){
    const select=$('qaStageSelect');
    if(!select || !state) return;
    const current=currentStageKey();
    const entries=Object.entries(STAGE_DEFS);
    select.innerHTML=entries.map(([key,d])=>`<option value="${key}">${d.id} // ${d.title} // Req Lv ${d.levelReq}</option>`).join('');
    select.value=current;
    const direct=document.querySelector('.qa-direct-stage-actions');
    if(direct){
      direct.innerHTML=entries.map(([key,d])=>`<button data-qa-stage="${key}">Load ${d.id}</button>`).join('');
      direct.querySelectorAll('[data-qa-stage]').forEach(btn=>btn.onclick=()=>qaLoadStage(btn.dataset.qaStage));
    }
    const levelRow=$('qaLevelPresets') || document.querySelector('.qa-level-picker .playtest-actions');
    if(levelRow){
      const reqs=[...new Set([5,12,...entries.map(([,d])=>d.levelReq||1),99])].filter(n=>n>1).sort((a,b)=>a-b);
      levelRow.innerHTML=reqs.map(n=>`<button data-qa-level="${n}">Lv ${n}</button>`).join('');
      levelRow.querySelectorAll('[data-qa-level]').forEach(btn=>btn.onclick=()=>qaSetPlayerLevel(btn.dataset.qaLevel));
    }
    const levelInput=$('qaPlayerLevel');
    if(levelInput && document.activeElement !== levelInput) levelInput.value = state.player?.level || 1;
  }
  function unlockNextStages(){
    state.stages ||= {};
    const order=Object.keys(STAGE_DEFS);
    if(state.qaUnlockAllStages){
      order.forEach(key => {
        state.stages[key] ||= {unlocked:true,complete:false};
        state.stages[key].unlocked = true;
      });
      return;
    }
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
,
    {id:'IT-020', name:'Ash Ore', type:'Material', category:'Mining', slot:'Stack', rarity:'Common', stackSize:999, sellPrice:3, asset:'assets/items/scrap_metal.png', status:'field-skill-resource', desc:'Ore chipped from ash-veined salvage nodes. Used for future smithing and upgrade loops.'},
    {id:'IT-021', name:'Encrypted Data', type:'Material', category:'Datafishing', slot:'Stack', rarity:'Uncommon', stackSize:999, sellPrice:4, asset:'assets/items/archive_log_001.png', status:'field-skill-resource', desc:'Recovered data packet pulled from dead streams and corrupted terminals.'},
    {id:'IT-022', name:'Circuit Scrap', type:'Material', category:'Codecraft', slot:'Stack', rarity:'Common', stackSize:999, sellPrice:3, asset:'assets/items/scrap_metal.png', status:'field-skill-resource', desc:'Circuit fragments used for future codecraft and gear assembly.'},
    {id:'IT-023', name:'Mutagen Sample', type:'Material', category:'Forgenetics', slot:'Stack', rarity:'Rare', stackSize:999, sellPrice:8, asset:'assets/items/corrupted_catalyst.png', status:'field-skill-resource', desc:'Unstable bio sample harvested from corrupted growths.'},
    {id:'IT-024', name:'Access Fragment', type:'Material', category:'System Hacking', slot:'Stack', rarity:'Uncommon', stackSize:999, sellPrice:5, asset:'assets/items/keycard_lv1.png', status:'field-skill-resource', desc:'Broken access token salvaged from relay consoles and security panels.'},
    {id:'IT-025', name:'Zone Cache Voucher', type:'Key Item', category:'Reward', slot:'Stack', rarity:'Rare', stackSize:999, sellPrice:0, asset:'assets/items/keycard_lv1.png', status:'mission-scaling', desc:'Mission-scaling reward marker used by AVOS to track deeper zone cache value.'},
    {id:'IT-030', name:'Ash Pebble', type:'Material', category:'Cryptomining', slot:'Stack', rarity:'Common', stackSize:999, sellPrice:1, asset:'assets/items/scrap_metal.png', status:'skill-tier-1', desc:'Level 1 cryptomining resource. Small ash-rock fragments used for early training.'},
    {id:'IT-031', name:'Dense Ash Ore', type:'Material', category:'Cryptomining', slot:'Stack', rarity:'Uncommon', stackSize:999, sellPrice:5, asset:'assets/items/scrap_metal.png', status:'skill-tier-2', desc:'Mid-tier cryptomining resource from packed ash veins.'},
    {id:'IT-032', name:'Vector Crystal', type:'Material', category:'Cryptomining', slot:'Stack', rarity:'Rare', stackSize:999, sellPrice:12, asset:'assets/items/rust_core.png', status:'skill-tier-3', desc:'High-tier cryptomining resource with a faint blue pulse.'},
    {id:'IT-033', name:'Static Packet', type:'Material', category:'Datafishing', slot:'Stack', rarity:'Common', stackSize:999, sellPrice:1, asset:'assets/items/archive_log_001.png', status:'skill-tier-1', desc:'Level 1 datafishing resource. Tiny data packets pulled from dead signals.'},
    {id:'IT-034', name:'Ghost Log', type:'Material', category:'Datafishing', slot:'Stack', rarity:'Uncommon', stackSize:999, sellPrice:6, asset:'assets/items/archive_log_001.png', status:'skill-tier-2', desc:'Mid-tier datafishing resource containing broken field logs.'},
    {id:'IT-035', name:'Blackbox File', type:'Material', category:'Datafishing', slot:'Stack', rarity:'Rare', stackSize:999, sellPrice:14, asset:'assets/items/archive_log_001.png', status:'skill-tier-3', desc:'High-tier datafishing resource recovered from locked crash memory.'},
    {id:'IT-036', name:'Wire Scrap', type:'Material', category:'Codecraft', slot:'Stack', rarity:'Common', stackSize:999, sellPrice:1, asset:'assets/items/scrap_metal.png', status:'skill-tier-1', desc:'Level 1 codecraft resource. Loose wire and tiny boards for starter crafting.'},
    {id:'IT-037', name:'Logic Board', type:'Material', category:'Codecraft', slot:'Stack', rarity:'Uncommon', stackSize:999, sellPrice:6, asset:'assets/items/scrap_metal.png', status:'skill-tier-2', desc:'Mid-tier codecraft resource used to rebuild cleaner modules.'},
    {id:'IT-038', name:'Quantum Relay', type:'Material', category:'Codecraft', slot:'Stack', rarity:'Rare', stackSize:999, sellPrice:15, asset:'assets/items/keycard_lv1.png', status:'skill-tier-3', desc:'High-tier codecraft part that still argues with the laws of physics.'},
    {id:'IT-039', name:'Spore Sample', type:'Material', category:'Forgenetics', slot:'Stack', rarity:'Common', stackSize:999, sellPrice:1, asset:'assets/items/corrupted_catalyst.png', status:'skill-tier-1', desc:'Level 1 forgenetics resource. Safe-ish biological residue.'},
    {id:'IT-040', name:'Mutated Tissue', type:'Material', category:'Forgenetics', slot:'Stack', rarity:'Uncommon', stackSize:999, sellPrice:7, asset:'assets/items/corrupted_catalyst.png', status:'skill-tier-2', desc:'Mid-tier forgenetics resource that refuses to stay still.'},
    {id:'IT-041', name:'Vector DNA', type:'Material', category:'Forgenetics', slot:'Stack', rarity:'Rare', stackSize:999, sellPrice:18, asset:'assets/items/corrupted_catalyst.png', status:'skill-tier-3', desc:'High-tier forgenetics resource from unstable vector mutations.'},
    {id:'IT-042', name:'Broken Token', type:'Material', category:'System Hacking', slot:'Stack', rarity:'Common', stackSize:999, sellPrice:1, asset:'assets/items/keycard_lv1.png', status:'skill-tier-1', desc:'Level 1 system hacking resource. Broken login token with one useful byte left.'},
    {id:'IT-043', name:'Security Keybit', type:'Material', category:'System Hacking', slot:'Stack', rarity:'Uncommon', stackSize:999, sellPrice:6, asset:'assets/items/keycard_lv1.png', status:'skill-tier-2', desc:'Mid-tier hacking resource used to crack stronger relays.'},
    {id:'IT-044', name:'Root Cipher', type:'Material', category:'System Hacking', slot:'Stack', rarity:'Rare', stackSize:999, sellPrice:16, asset:'assets/items/keycard_lv1.png', status:'skill-tier-3', desc:'High-tier hacking cipher with root-level system traces.'}  ];

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
    ensureCharacterState();
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
    applyOperatorVisuals();
    const sync=$('operatorSync'); if(sync) sync.textContent=`Rank ${state.operatorSyncRank}/10`;
    const host=document.querySelector('#operatorOverlay .operator-data'); if(!host) return;
    let panel=$('operatorShardPanel');
    if(!panel){ panel=document.createElement('div'); panel.id='operatorShardPanel'; panel.className='operator-shard-panel protocol-list'; host.appendChild(panel); }
    const cost=5+(state.operatorSyncRank||0)*3;
    const owned=state.inventory['Operator Shard: Vyra']||0;
    const op=currentOperator();
    panel.innerHTML=`<div><b>Shard Sync</b><span>Owned ${owned} // Next rank cost ${cost} shards</span></div><div><b>Rank Bonus</b><span>Each rank adds +2 ATK, +1 DEF, +8 HP, +3 EP.</span></div><button onclick="window.AV.syncVyra()" ${owned<cost?'disabled':''}>Synchronize ${safeHtml(op.displayName)}</button>`;
  }
  // v162: operator framework must be defined before state=newGameState().
  const ACTIVE_OPERATOR_ID = 'av001';
  const OPERATOR_DEFS = {
    av001: {
      id: 'av001',
      code: 'AV-001',
      displayName: 'Vyra',
      codename: 'ASH VECTOR',
      title: 'Wasteland Operative',
      meta: 'Operator Unit 001 • Wasteland Operative • Starter',
      quote: '“The world already ended. I am just cleaning up the punchline.”',
      className: 'Wasteland Operative',
      affinity: 'Ash / Salvage',
      rarity: 'Starter / Prototype',
      clearance: 'Level 5',
      fileStatus: 'Active',
      portrait: 'assets/operators/av001/portrait.png',
      battle: 'assets/operators/av001/battle.png',
      avatar: 'assets/operators/av001/avatar.png',
      icon: 'assets/operators/av001/icon.png',
      menu: 'assets/operators/av001/menu.png',
      profile: 'assets/operators/av001/profile.png',
      operatorCard: 'assets/operators/av001/operator_card.png',
      partyIcon: 'assets/operators/av001/party_icon.png',
      battleIcon: 'assets/operators/av001/battle_icon.png',
      spriteSheet: 'assets/operators/av001/sprite_sheet.png',
      mapSprite: 'assets/operators/av001/sprites/map_sprite.png',
      mapSpriteLarge: 'assets/operators/av001/sprites/map_sprite_large.png',
      weapon: 'assets/operators/av001/weapon.png',
      rotations: {
        down: 'assets/operators/av001/sprites/rotations/south.png',
        downRight: 'assets/operators/av001/sprites/rotations/south-east.png',
        right: 'assets/operators/av001/sprites/rotations/east.png',
        upRight: 'assets/operators/av001/sprites/rotations/north-east.png',
        up: 'assets/operators/av001/sprites/rotations/north.png',
        upLeft: 'assets/operators/av001/sprites/rotations/north-west.png',
        left: 'assets/operators/av001/sprites/rotations/west.png',
        downLeft: 'assets/operators/av001/sprites/rotations/south-west.png'
      },
      animations: {
        walking: {
          down: ['assets/operators/av001/sprites/animations/walking/south/frame_000.png','assets/operators/av001/sprites/animations/walking/south/frame_001.png','assets/operators/av001/sprites/animations/walking/south/frame_002.png','assets/operators/av001/sprites/animations/walking/south/frame_003.png'],
          downRight: ['assets/operators/av001/sprites/animations/walking/south-east/frame_000.png','assets/operators/av001/sprites/animations/walking/south-east/frame_001.png','assets/operators/av001/sprites/animations/walking/south-east/frame_002.png','assets/operators/av001/sprites/animations/walking/south-east/frame_003.png'],
          right: ['assets/operators/av001/sprites/animations/walking/east/frame_000.png','assets/operators/av001/sprites/animations/walking/east/frame_001.png','assets/operators/av001/sprites/animations/walking/east/frame_002.png','assets/operators/av001/sprites/animations/walking/east/frame_003.png'],
          upRight: ['assets/operators/av001/sprites/animations/walking/north-east/frame_000.png','assets/operators/av001/sprites/animations/walking/north-east/frame_001.png','assets/operators/av001/sprites/animations/walking/north-east/frame_002.png','assets/operators/av001/sprites/animations/walking/north-east/frame_003.png'],
          up: ['assets/operators/av001/sprites/animations/walking/north/frame_000.png','assets/operators/av001/sprites/animations/walking/north/frame_001.png','assets/operators/av001/sprites/animations/walking/north/frame_002.png','assets/operators/av001/sprites/animations/walking/north/frame_003.png'],
          upLeft: ['assets/operators/av001/sprites/animations/walking/north-west/frame_000.png','assets/operators/av001/sprites/animations/walking/north-west/frame_001.png','assets/operators/av001/sprites/animations/walking/north-west/frame_002.png','assets/operators/av001/sprites/animations/walking/north-west/frame_003.png'],
          left: ['assets/operators/av001/sprites/animations/walking/west/frame_000.png','assets/operators/av001/sprites/animations/walking/west/frame_001.png','assets/operators/av001/sprites/animations/walking/west/frame_002.png','assets/operators/av001/sprites/animations/walking/west/frame_003.png'],
          downLeft: ['assets/operators/av001/sprites/animations/walking/south-west/frame_000.png','assets/operators/av001/sprites/animations/walking/south-west/frame_001.png','assets/operators/av001/sprites/animations/walking/south-west/frame_002.png','assets/operators/av001/sprites/animations/walking/south-west/frame_003.png']
        },
        idle: {
          down: ['assets/operators/av001/sprites/animations/idle/south/frame_000.png','assets/operators/av001/sprites/animations/idle/south/frame_001.png','assets/operators/av001/sprites/animations/idle/south/frame_002.png','assets/operators/av001/sprites/animations/idle/south/frame_003.png'],
          downRight: ['assets/operators/av001/sprites/animations/idle/south-east/frame_000.png','assets/operators/av001/sprites/animations/idle/south-east/frame_001.png','assets/operators/av001/sprites/animations/idle/south-east/frame_002.png','assets/operators/av001/sprites/animations/idle/south-east/frame_003.png'],
          right: ['assets/operators/av001/sprites/animations/idle/east/frame_000.png','assets/operators/av001/sprites/animations/idle/east/frame_001.png','assets/operators/av001/sprites/animations/idle/east/frame_002.png','assets/operators/av001/sprites/animations/idle/east/frame_003.png'],
          upRight: ['assets/operators/av001/sprites/animations/idle/north-east/frame_000.png','assets/operators/av001/sprites/animations/idle/north-east/frame_001.png','assets/operators/av001/sprites/animations/idle/north-east/frame_002.png','assets/operators/av001/sprites/animations/idle/north-east/frame_003.png'],
          up: ['assets/operators/av001/sprites/animations/idle/north/frame_000.png','assets/operators/av001/sprites/animations/idle/north/frame_001.png','assets/operators/av001/sprites/animations/idle/north/frame_002.png','assets/operators/av001/sprites/animations/idle/north/frame_003.png'],
          upLeft: ['assets/operators/av001/sprites/animations/idle/north-west/frame_000.png','assets/operators/av001/sprites/animations/idle/north-west/frame_001.png','assets/operators/av001/sprites/animations/idle/north-west/frame_002.png','assets/operators/av001/sprites/animations/idle/north-west/frame_003.png'],
          left: ['assets/operators/av001/sprites/animations/idle/west/frame_000.png','assets/operators/av001/sprites/animations/idle/west/frame_001.png','assets/operators/av001/sprites/animations/idle/west/frame_002.png','assets/operators/av001/sprites/animations/idle/west/frame_003.png'],
          downLeft: ['assets/operators/av001/sprites/animations/idle/south-west/frame_000.png','assets/operators/av001/sprites/animations/idle/south-west/frame_001.png','assets/operators/av001/sprites/animations/idle/south-west/frame_002.png','assets/operators/av001/sprites/animations/idle/south-west/frame_003.png']
        }
      }
    },

    vexa: {
      id: 'vexa',
      code: 'AV-002',
      displayName: 'Vexa',
      codename: 'ASH RIFT',
      title: 'Rift Scavenger',
      meta: 'Operator Unit 002 • Rift Scavenger • Locked',
      quote: '“I do not loot ruins. I negotiate with garbage that lost the argument.”',
      className: 'Rift Scavenger',
      affinity: 'Ash / Static',
      rarity: 'Unlockable / Prototype',
      clearance: 'Level 8',
      fileStatus: 'Locked',
      unlockShard: 'Operator Shard: Vexa',
      shardName: 'Operator Shard: Vexa',
      shardCost: 35,
      dropWeight: 1,
      unlockedByDefault: false,
      portrait: 'assets/operators/vexa/portrait.png',
      battle: 'assets/operators/vexa/battle.png',
      avatar: 'assets/operators/vexa/avatar.png',
      icon: 'assets/operators/vexa/icon.png',
      menu: 'assets/operators/vexa/menu.png',
      profile: 'assets/operators/vexa/profile.png',
      operatorCard: 'assets/operators/vexa/operator_card.png',
      partyIcon: 'assets/operators/vexa/party_icon.png',
      battleIcon: 'assets/operators/vexa/battle_icon.png',
      spriteSheet: 'assets/operators/vexa/sprite_sheet.png',
      mapSprite: 'assets/operators/vexa/sprites/map_sprite.png',
      mapSpriteLarge: 'assets/operators/vexa/sprites/map_sprite_large.png',
      weapon: 'assets/operators/vexa/weapon.png',
      rotations: {
        down: 'assets/operators/vexa/sprites/rotations/south.png',
        downRight: 'assets/operators/vexa/sprites/rotations/south-east.png',
        right: 'assets/operators/vexa/sprites/rotations/east.png',
        upRight: 'assets/operators/vexa/sprites/rotations/north-east.png',
        up: 'assets/operators/vexa/sprites/rotations/north.png',
        upLeft: 'assets/operators/vexa/sprites/rotations/north-west.png',
        left: 'assets/operators/vexa/sprites/rotations/west.png',
        downLeft: 'assets/operators/vexa/sprites/rotations/south-west.png'
      },
      animations: { walking: {
          down: ['assets/operators/vexa/sprites/animations/walking/south/frame_000.png','assets/operators/vexa/sprites/animations/walking/south/frame_001.png','assets/operators/vexa/sprites/animations/walking/south/frame_002.png','assets/operators/vexa/sprites/animations/walking/south/frame_003.png'],
          downRight: ['assets/operators/vexa/sprites/animations/walking/south-east/frame_000.png','assets/operators/vexa/sprites/animations/walking/south-east/frame_001.png','assets/operators/vexa/sprites/animations/walking/south-east/frame_002.png','assets/operators/vexa/sprites/animations/walking/south-east/frame_003.png'],
          right: ['assets/operators/vexa/sprites/animations/walking/east/frame_000.png','assets/operators/vexa/sprites/animations/walking/east/frame_001.png','assets/operators/vexa/sprites/animations/walking/east/frame_002.png','assets/operators/vexa/sprites/animations/walking/east/frame_003.png'],
          upRight: ['assets/operators/vexa/sprites/animations/walking/north-east/frame_000.png','assets/operators/vexa/sprites/animations/walking/north-east/frame_001.png','assets/operators/vexa/sprites/animations/walking/north-east/frame_002.png','assets/operators/vexa/sprites/animations/walking/north-east/frame_003.png'],
          up: ['assets/operators/vexa/sprites/animations/walking/north/frame_000.png','assets/operators/vexa/sprites/animations/walking/north/frame_001.png','assets/operators/vexa/sprites/animations/walking/north/frame_002.png','assets/operators/vexa/sprites/animations/walking/north/frame_003.png'],
          upLeft: ['assets/operators/vexa/sprites/animations/walking/north-west/frame_000.png','assets/operators/vexa/sprites/animations/walking/north-west/frame_001.png','assets/operators/vexa/sprites/animations/walking/north-west/frame_002.png','assets/operators/vexa/sprites/animations/walking/north-west/frame_003.png'],
          left: ['assets/operators/vexa/sprites/animations/walking/west/frame_000.png','assets/operators/vexa/sprites/animations/walking/west/frame_001.png','assets/operators/vexa/sprites/animations/walking/west/frame_002.png','assets/operators/vexa/sprites/animations/walking/west/frame_003.png'],
          downLeft: ['assets/operators/vexa/sprites/animations/walking/south-west/frame_000.png','assets/operators/vexa/sprites/animations/walking/south-west/frame_001.png','assets/operators/vexa/sprites/animations/walking/south-west/frame_002.png','assets/operators/vexa/sprites/animations/walking/south-west/frame_003.png']
        }, idle: {
          down: ['assets/operators/vexa/sprites/animations/idle/south/frame_000.png','assets/operators/vexa/sprites/animations/idle/south/frame_001.png','assets/operators/vexa/sprites/animations/idle/south/frame_002.png','assets/operators/vexa/sprites/animations/idle/south/frame_003.png'],
          downRight: ['assets/operators/vexa/sprites/animations/idle/south-east/frame_000.png','assets/operators/vexa/sprites/animations/idle/south-east/frame_001.png','assets/operators/vexa/sprites/animations/idle/south-east/frame_002.png','assets/operators/vexa/sprites/animations/idle/south-east/frame_003.png'],
          right: ['assets/operators/vexa/sprites/animations/idle/east/frame_000.png','assets/operators/vexa/sprites/animations/idle/east/frame_001.png','assets/operators/vexa/sprites/animations/idle/east/frame_002.png','assets/operators/vexa/sprites/animations/idle/east/frame_003.png'],
          upRight: ['assets/operators/vexa/sprites/animations/idle/north-east/frame_000.png','assets/operators/vexa/sprites/animations/idle/north-east/frame_001.png','assets/operators/vexa/sprites/animations/idle/north-east/frame_002.png','assets/operators/vexa/sprites/animations/idle/north-east/frame_003.png'],
          up: ['assets/operators/vexa/sprites/animations/idle/north/frame_000.png','assets/operators/vexa/sprites/animations/idle/north/frame_001.png','assets/operators/vexa/sprites/animations/idle/north/frame_002.png','assets/operators/vexa/sprites/animations/idle/north/frame_003.png'],
          upLeft: ['assets/operators/vexa/sprites/animations/idle/north-west/frame_000.png','assets/operators/vexa/sprites/animations/idle/north-west/frame_001.png','assets/operators/vexa/sprites/animations/idle/north-west/frame_002.png','assets/operators/vexa/sprites/animations/idle/north-west/frame_003.png'],
          left: ['assets/operators/vexa/sprites/animations/idle/west/frame_000.png','assets/operators/vexa/sprites/animations/idle/west/frame_001.png','assets/operators/vexa/sprites/animations/idle/west/frame_002.png','assets/operators/vexa/sprites/animations/idle/west/frame_003.png'],
          downLeft: ['assets/operators/vexa/sprites/animations/idle/south-west/frame_000.png','assets/operators/vexa/sprites/animations/idle/south-west/frame_001.png','assets/operators/vexa/sprites/animations/idle/south-west/frame_002.png','assets/operators/vexa/sprites/animations/idle/south-west/frame_003.png']
        } }
    },

    rivet: {
      id: 'rivet',
      code: 'AV-003',
      displayName: 'Rivet Vale',
      codename: 'SCRAP VOLT',
      title: 'Scavenger Engineer',
      meta: 'Operator Unit 003 • Scavenger Engineer • Locked',
      quote: '“I did not cause the explosion. I merely gave it tools and confidence.”',
      className: 'Scavenger Engineer',
      affinity: 'Scrap / Voltage',
      rarity: 'Unlockable / Engineer Prototype',
      clearance: 'Level 12',
      fileStatus: 'Locked',
      unlockShard: 'Operator Shard: Rivet',
      shardName: 'Operator Shard: Rivet',
      shardCost: 45,
      dropWeight: 1,
      unlockedByDefault: false,
      portrait: 'assets/operators/rivet/portrait.png',
      battle: 'assets/operators/rivet/battle.png',
      avatar: 'assets/operators/rivet/avatar.png',
      icon: 'assets/operators/rivet/icon.png',
      menu: 'assets/operators/rivet/menu.png',
      profile: 'assets/operators/rivet/profile.png',
      operatorCard: 'assets/operators/rivet/operator_card.png',
      partyIcon: 'assets/operators/rivet/party_icon.png',
      battleIcon: 'assets/operators/rivet/battle_icon.png',
      spriteSheet: 'assets/operators/rivet/sprite_sheet.png',
      mapSprite: 'assets/operators/rivet/sprites/map_sprite.png',
      mapSpriteLarge: 'assets/operators/rivet/sprites/map_sprite_large.png',
      weapon: 'assets/operators/rivet/weapon.png',
      rotations: {
        down: 'assets/operators/rivet/sprites/rotations/south.png',
        downRight: 'assets/operators/rivet/sprites/rotations/south-east.png',
        right: 'assets/operators/rivet/sprites/rotations/east.png',
        upRight: 'assets/operators/rivet/sprites/rotations/north-east.png',
        up: 'assets/operators/rivet/sprites/rotations/north.png',
        upLeft: 'assets/operators/rivet/sprites/rotations/north-west.png',
        left: 'assets/operators/rivet/sprites/rotations/west.png',
        downLeft: 'assets/operators/rivet/sprites/rotations/south-west.png'
      },
      animations: {
        walking: {
          down: ['assets/operators/rivet/sprites/animations/walking/south/frame_000.png', 'assets/operators/rivet/sprites/animations/walking/south/frame_001.png', 'assets/operators/rivet/sprites/animations/walking/south/frame_002.png', 'assets/operators/rivet/sprites/animations/walking/south/frame_003.png'],
          downRight: ['assets/operators/rivet/sprites/animations/walking/south-east/frame_000.png', 'assets/operators/rivet/sprites/animations/walking/south-east/frame_001.png', 'assets/operators/rivet/sprites/animations/walking/south-east/frame_002.png', 'assets/operators/rivet/sprites/animations/walking/south-east/frame_003.png'],
          right: ['assets/operators/rivet/sprites/animations/walking/east/frame_000.png', 'assets/operators/rivet/sprites/animations/walking/east/frame_001.png', 'assets/operators/rivet/sprites/animations/walking/east/frame_002.png', 'assets/operators/rivet/sprites/animations/walking/east/frame_003.png'],
          upRight: ['assets/operators/rivet/sprites/animations/walking/north-east/frame_000.png', 'assets/operators/rivet/sprites/animations/walking/north-east/frame_001.png', 'assets/operators/rivet/sprites/animations/walking/north-east/frame_002.png', 'assets/operators/rivet/sprites/animations/walking/north-east/frame_003.png'],
          up: ['assets/operators/rivet/sprites/animations/walking/north/frame_000.png', 'assets/operators/rivet/sprites/animations/walking/north/frame_001.png', 'assets/operators/rivet/sprites/animations/walking/north/frame_002.png', 'assets/operators/rivet/sprites/animations/walking/north/frame_003.png'],
          upLeft: ['assets/operators/rivet/sprites/animations/walking/north-west/frame_000.png', 'assets/operators/rivet/sprites/animations/walking/north-west/frame_001.png', 'assets/operators/rivet/sprites/animations/walking/north-west/frame_002.png', 'assets/operators/rivet/sprites/animations/walking/north-west/frame_003.png'],
          left: ['assets/operators/rivet/sprites/animations/walking/west/frame_000.png', 'assets/operators/rivet/sprites/animations/walking/west/frame_001.png', 'assets/operators/rivet/sprites/animations/walking/west/frame_002.png', 'assets/operators/rivet/sprites/animations/walking/west/frame_003.png'],
          downLeft: ['assets/operators/rivet/sprites/animations/walking/south-west/frame_000.png', 'assets/operators/rivet/sprites/animations/walking/south-west/frame_001.png', 'assets/operators/rivet/sprites/animations/walking/south-west/frame_002.png', 'assets/operators/rivet/sprites/animations/walking/south-west/frame_003.png']
        },
        idle: {
          down: ['assets/operators/rivet/sprites/animations/idle/south/frame_000.png', 'assets/operators/rivet/sprites/animations/idle/south/frame_001.png', 'assets/operators/rivet/sprites/animations/idle/south/frame_002.png', 'assets/operators/rivet/sprites/animations/idle/south/frame_003.png'],
          downRight: ['assets/operators/rivet/sprites/animations/idle/south-east/frame_000.png', 'assets/operators/rivet/sprites/animations/idle/south-east/frame_001.png', 'assets/operators/rivet/sprites/animations/idle/south-east/frame_002.png', 'assets/operators/rivet/sprites/animations/idle/south-east/frame_003.png'],
          right: ['assets/operators/rivet/sprites/animations/idle/east/frame_000.png', 'assets/operators/rivet/sprites/animations/idle/east/frame_001.png', 'assets/operators/rivet/sprites/animations/idle/east/frame_002.png', 'assets/operators/rivet/sprites/animations/idle/east/frame_003.png'],
          upRight: ['assets/operators/rivet/sprites/animations/idle/north-east/frame_000.png', 'assets/operators/rivet/sprites/animations/idle/north-east/frame_001.png', 'assets/operators/rivet/sprites/animations/idle/north-east/frame_002.png', 'assets/operators/rivet/sprites/animations/idle/north-east/frame_003.png'],
          up: ['assets/operators/rivet/sprites/animations/idle/north/frame_000.png', 'assets/operators/rivet/sprites/animations/idle/north/frame_001.png', 'assets/operators/rivet/sprites/animations/idle/north/frame_002.png', 'assets/operators/rivet/sprites/animations/idle/north/frame_003.png'],
          upLeft: ['assets/operators/rivet/sprites/animations/idle/north-west/frame_000.png', 'assets/operators/rivet/sprites/animations/idle/north-west/frame_001.png', 'assets/operators/rivet/sprites/animations/idle/north-west/frame_002.png', 'assets/operators/rivet/sprites/animations/idle/north-west/frame_003.png'],
          left: ['assets/operators/rivet/sprites/animations/idle/west/frame_000.png', 'assets/operators/rivet/sprites/animations/idle/west/frame_001.png', 'assets/operators/rivet/sprites/animations/idle/west/frame_002.png', 'assets/operators/rivet/sprites/animations/idle/west/frame_003.png'],
          downLeft: ['assets/operators/rivet/sprites/animations/idle/south-west/frame_000.png', 'assets/operators/rivet/sprites/animations/idle/south-west/frame_001.png', 'assets/operators/rivet/sprites/animations/idle/south-west/frame_002.png', 'assets/operators/rivet/sprites/animations/idle/south-west/frame_003.png']
        }
      }
    }
,

    moxie: {
      id: 'moxie',
      code: 'AV-004',
      displayName: 'Moxie Grin',
      codename: 'JUNK MEDIC',
      title: 'Junkyard Medic',
      meta: 'Operator Unit 004 • Junkyard Medic • Locked',
      quote: '“Good news: you survived. Bad news: I learned medicine from a vending machine.”',
      className: 'Junkyard Medic',
      affinity: 'Bio-Scrap / Recovery',
      rarity: 'Unlockable / Medic Prototype',
      clearance: 'Level 15',
      fileStatus: 'Locked',
      unlockShard: 'Operator Shard: Moxie',
      shardName: 'Operator Shard: Moxie',
      shardCost: 55,
      dropWeight: 1,
      unlockedByDefault: false,
      portrait: 'assets/operators/moxie/portrait.png',
      battle: 'assets/operators/moxie/battle.png',
      avatar: 'assets/operators/moxie/avatar.png',
      icon: 'assets/operators/moxie/icon.png',
      menu: 'assets/operators/moxie/menu.png',
      profile: 'assets/operators/moxie/profile.png',
      operatorCard: 'assets/operators/moxie/operator_card.png',
      partyIcon: 'assets/operators/moxie/party_icon.png',
      battleIcon: 'assets/operators/moxie/battle_icon.png',
      spriteSheet: 'assets/operators/moxie/sprite_sheet.png',
      mapSprite: 'assets/operators/moxie/sprites/map_sprite.png',
      mapSpriteLarge: 'assets/operators/moxie/sprites/map_sprite_large.png',
      weapon: 'assets/operators/moxie/weapon.png',
      rotations: {
        down: 'assets/operators/moxie/sprites/rotations/south.png',
        downRight: 'assets/operators/moxie/sprites/rotations/south-east.png',
        right: 'assets/operators/moxie/sprites/rotations/east.png',
        upRight: 'assets/operators/moxie/sprites/rotations/north-east.png',
        up: 'assets/operators/moxie/sprites/rotations/north.png',
        upLeft: 'assets/operators/moxie/sprites/rotations/north-west.png',
        left: 'assets/operators/moxie/sprites/rotations/west.png',
        downLeft: 'assets/operators/moxie/sprites/rotations/south-west.png'
      },
      animations: {
        walking: {
          down: ['assets/operators/moxie/sprites/animations/walking/south/frame_000.png', 'assets/operators/moxie/sprites/animations/walking/south/frame_001.png', 'assets/operators/moxie/sprites/animations/walking/south/frame_002.png', 'assets/operators/moxie/sprites/animations/walking/south/frame_003.png'],
          downRight: ['assets/operators/moxie/sprites/animations/walking/south-east/frame_000.png', 'assets/operators/moxie/sprites/animations/walking/south-east/frame_001.png', 'assets/operators/moxie/sprites/animations/walking/south-east/frame_002.png', 'assets/operators/moxie/sprites/animations/walking/south-east/frame_003.png'],
          right: ['assets/operators/moxie/sprites/animations/walking/east/frame_000.png', 'assets/operators/moxie/sprites/animations/walking/east/frame_001.png', 'assets/operators/moxie/sprites/animations/walking/east/frame_002.png', 'assets/operators/moxie/sprites/animations/walking/east/frame_003.png'],
          upRight: ['assets/operators/moxie/sprites/animations/walking/north-east/frame_000.png', 'assets/operators/moxie/sprites/animations/walking/north-east/frame_001.png', 'assets/operators/moxie/sprites/animations/walking/north-east/frame_002.png', 'assets/operators/moxie/sprites/animations/walking/north-east/frame_003.png'],
          up: ['assets/operators/moxie/sprites/animations/walking/north/frame_000.png', 'assets/operators/moxie/sprites/animations/walking/north/frame_001.png', 'assets/operators/moxie/sprites/animations/walking/north/frame_002.png', 'assets/operators/moxie/sprites/animations/walking/north/frame_003.png'],
          upLeft: ['assets/operators/moxie/sprites/animations/walking/north-west/frame_000.png', 'assets/operators/moxie/sprites/animations/walking/north-west/frame_001.png', 'assets/operators/moxie/sprites/animations/walking/north-west/frame_002.png', 'assets/operators/moxie/sprites/animations/walking/north-west/frame_003.png'],
          left: ['assets/operators/moxie/sprites/animations/walking/west/frame_000.png', 'assets/operators/moxie/sprites/animations/walking/west/frame_001.png', 'assets/operators/moxie/sprites/animations/walking/west/frame_002.png', 'assets/operators/moxie/sprites/animations/walking/west/frame_003.png'],
          downLeft: ['assets/operators/moxie/sprites/animations/walking/south-west/frame_000.png', 'assets/operators/moxie/sprites/animations/walking/south-west/frame_001.png', 'assets/operators/moxie/sprites/animations/walking/south-west/frame_002.png', 'assets/operators/moxie/sprites/animations/walking/south-west/frame_003.png']
        },
        idle: {
          down: ['assets/operators/moxie/sprites/animations/idle/south/frame_000.png', 'assets/operators/moxie/sprites/animations/idle/south/frame_001.png', 'assets/operators/moxie/sprites/animations/idle/south/frame_002.png', 'assets/operators/moxie/sprites/animations/idle/south/frame_003.png'],
          downRight: ['assets/operators/moxie/sprites/animations/idle/south-east/frame_000.png', 'assets/operators/moxie/sprites/animations/idle/south-east/frame_001.png', 'assets/operators/moxie/sprites/animations/idle/south-east/frame_002.png', 'assets/operators/moxie/sprites/animations/idle/south-east/frame_003.png'],
          right: ['assets/operators/moxie/sprites/animations/idle/east/frame_000.png', 'assets/operators/moxie/sprites/animations/idle/east/frame_001.png', 'assets/operators/moxie/sprites/animations/idle/east/frame_002.png', 'assets/operators/moxie/sprites/animations/idle/east/frame_003.png'],
          upRight: ['assets/operators/moxie/sprites/animations/idle/north-east/frame_000.png', 'assets/operators/moxie/sprites/animations/idle/north-east/frame_001.png', 'assets/operators/moxie/sprites/animations/idle/north-east/frame_002.png', 'assets/operators/moxie/sprites/animations/idle/north-east/frame_003.png'],
          up: ['assets/operators/moxie/sprites/animations/idle/north/frame_000.png', 'assets/operators/moxie/sprites/animations/idle/north/frame_001.png', 'assets/operators/moxie/sprites/animations/idle/north/frame_002.png', 'assets/operators/moxie/sprites/animations/idle/north/frame_003.png'],
          upLeft: ['assets/operators/moxie/sprites/animations/idle/north-west/frame_000.png', 'assets/operators/moxie/sprites/animations/idle/north-west/frame_001.png', 'assets/operators/moxie/sprites/animations/idle/north-west/frame_002.png', 'assets/operators/moxie/sprites/animations/idle/north-west/frame_003.png'],
          left: ['assets/operators/moxie/sprites/animations/idle/west/frame_000.png', 'assets/operators/moxie/sprites/animations/idle/west/frame_001.png', 'assets/operators/moxie/sprites/animations/idle/west/frame_002.png', 'assets/operators/moxie/sprites/animations/idle/west/frame_003.png'],
          downLeft: ['assets/operators/moxie/sprites/animations/idle/south-west/frame_000.png', 'assets/operators/moxie/sprites/animations/idle/south-west/frame_001.png', 'assets/operators/moxie/sprites/animations/idle/south-west/frame_002.png', 'assets/operators/moxie/sprites/animations/idle/south-west/frame_003.png']
        }
      }
    },

    brakk: {
      id: 'brakk',
      code: 'AV-005',
      displayName: 'Brakk Null',
      codename: 'SCRAP WALL',
      title: 'Ash Raider Tank',
      meta: 'Operator Unit 005 • Ash Raider Tank • Locked',
      quote: '“I said please before I hit it with the engine block. That counts as diplomacy.”',
      className: 'Ash Raider Tank',
      affinity: 'Ash / Impact',
      rarity: 'Unlockable / Heavy Prototype',
      clearance: 'Level 16',
      fileStatus: 'Locked',
      unlockShard: 'Operator Shard: Brakk',
      shardName: 'Operator Shard: Brakk',
      shardCost: 65,
      dropWeight: 1,
      unlockedByDefault: false,
      portrait: 'assets/operators/brakk/portrait.png',
      battle: 'assets/operators/brakk/battle.png',
      avatar: 'assets/operators/brakk/avatar.png',
      icon: 'assets/operators/brakk/icon.png',
      menu: 'assets/operators/brakk/menu.png',
      profile: 'assets/operators/brakk/profile.png',
      operatorCard: 'assets/operators/brakk/operator_card.png',
      partyIcon: 'assets/operators/brakk/party_icon.png',
      battleIcon: 'assets/operators/brakk/battle_icon.png',
      spriteSheet: 'assets/operators/brakk/sprite_sheet.png',
      mapSprite: 'assets/operators/brakk/sprites/map_sprite.png',
      mapSpriteLarge: 'assets/operators/brakk/sprites/map_sprite_large.png',
      weapon: 'assets/operators/brakk/weapon.png',
      rotations: {
        down: 'assets/operators/brakk/sprites/rotations/south.png',
        downRight: 'assets/operators/brakk/sprites/rotations/south-east.png',
        right: 'assets/operators/brakk/sprites/rotations/east.png',
        upRight: 'assets/operators/brakk/sprites/rotations/north-east.png',
        up: 'assets/operators/brakk/sprites/rotations/north.png',
        upLeft: 'assets/operators/brakk/sprites/rotations/north-west.png',
        left: 'assets/operators/brakk/sprites/rotations/west.png',
        downLeft: 'assets/operators/brakk/sprites/rotations/south-west.png'
      },
      animations: {
        walking: {
          down: ['assets/operators/brakk/sprites/animations/walking/south/frame_000.png','assets/operators/brakk/sprites/animations/walking/south/frame_001.png','assets/operators/brakk/sprites/animations/walking/south/frame_002.png','assets/operators/brakk/sprites/animations/walking/south/frame_003.png'],
          downRight: ['assets/operators/brakk/sprites/animations/walking/south-east/frame_000.png','assets/operators/brakk/sprites/animations/walking/south-east/frame_001.png','assets/operators/brakk/sprites/animations/walking/south-east/frame_002.png','assets/operators/brakk/sprites/animations/walking/south-east/frame_003.png'],
          right: ['assets/operators/brakk/sprites/animations/walking/east/frame_000.png','assets/operators/brakk/sprites/animations/walking/east/frame_001.png','assets/operators/brakk/sprites/animations/walking/east/frame_002.png','assets/operators/brakk/sprites/animations/walking/east/frame_003.png'],
          upRight: ['assets/operators/brakk/sprites/animations/walking/north-east/frame_000.png','assets/operators/brakk/sprites/animations/walking/north-east/frame_001.png','assets/operators/brakk/sprites/animations/walking/north-east/frame_002.png','assets/operators/brakk/sprites/animations/walking/north-east/frame_003.png'],
          up: ['assets/operators/brakk/sprites/animations/walking/north/frame_000.png','assets/operators/brakk/sprites/animations/walking/north/frame_001.png','assets/operators/brakk/sprites/animations/walking/north/frame_002.png','assets/operators/brakk/sprites/animations/walking/north/frame_003.png'],
          upLeft: ['assets/operators/brakk/sprites/animations/walking/north-west/frame_000.png','assets/operators/brakk/sprites/animations/walking/north-west/frame_001.png','assets/operators/brakk/sprites/animations/walking/north-west/frame_002.png','assets/operators/brakk/sprites/animations/walking/north-west/frame_003.png'],
          left: ['assets/operators/brakk/sprites/animations/walking/west/frame_000.png','assets/operators/brakk/sprites/animations/walking/west/frame_001.png','assets/operators/brakk/sprites/animations/walking/west/frame_002.png','assets/operators/brakk/sprites/animations/walking/west/frame_003.png'],
          downLeft: ['assets/operators/brakk/sprites/animations/walking/south-west/frame_000.png','assets/operators/brakk/sprites/animations/walking/south-west/frame_001.png','assets/operators/brakk/sprites/animations/walking/south-west/frame_002.png','assets/operators/brakk/sprites/animations/walking/south-west/frame_003.png']
        },
        idle: {
          down: ['assets/operators/brakk/sprites/animations/idle/south/frame_000.png','assets/operators/brakk/sprites/animations/idle/south/frame_001.png','assets/operators/brakk/sprites/animations/idle/south/frame_002.png','assets/operators/brakk/sprites/animations/idle/south/frame_003.png'],
          downRight: ['assets/operators/brakk/sprites/animations/idle/south-east/frame_000.png','assets/operators/brakk/sprites/animations/idle/south-east/frame_001.png','assets/operators/brakk/sprites/animations/idle/south-east/frame_002.png','assets/operators/brakk/sprites/animations/idle/south-east/frame_003.png'],
          right: ['assets/operators/brakk/sprites/animations/idle/east/frame_000.png','assets/operators/brakk/sprites/animations/idle/east/frame_001.png','assets/operators/brakk/sprites/animations/idle/east/frame_002.png','assets/operators/brakk/sprites/animations/idle/east/frame_003.png'],
          upRight: ['assets/operators/brakk/sprites/animations/idle/north-east/frame_000.png','assets/operators/brakk/sprites/animations/idle/north-east/frame_001.png','assets/operators/brakk/sprites/animations/idle/north-east/frame_002.png','assets/operators/brakk/sprites/animations/idle/north-east/frame_003.png'],
          up: ['assets/operators/brakk/sprites/animations/idle/north/frame_000.png','assets/operators/brakk/sprites/animations/idle/north/frame_001.png','assets/operators/brakk/sprites/animations/idle/north/frame_002.png','assets/operators/brakk/sprites/animations/idle/north/frame_003.png'],
          upLeft: ['assets/operators/brakk/sprites/animations/idle/north-west/frame_000.png','assets/operators/brakk/sprites/animations/idle/north-west/frame_001.png','assets/operators/brakk/sprites/animations/idle/north-west/frame_002.png','assets/operators/brakk/sprites/animations/idle/north-west/frame_003.png'],
          left: ['assets/operators/brakk/sprites/animations/idle/west/frame_000.png','assets/operators/brakk/sprites/animations/idle/west/frame_001.png','assets/operators/brakk/sprites/animations/idle/west/frame_002.png','assets/operators/brakk/sprites/animations/idle/west/frame_003.png'],
          downLeft: ['assets/operators/brakk/sprites/animations/idle/south-west/frame_000.png','assets/operators/brakk/sprites/animations/idle/south-west/frame_001.png','assets/operators/brakk/sprites/animations/idle/south-west/frame_002.png','assets/operators/brakk/sprites/animations/idle/south-west/frame_003.png']
        }
      }
    }


  ,

    sable: {
      id: 'sable',
      code: 'AV-006',
      displayName: 'Sable Static',
      codename: 'ROGUE SIGNAL',
      title: 'Rogue Signal',
      meta: 'Operator Unit 006 • Rogue Signal • Locked',
      quote: '“I am not hacking the apocalypse. I am just correcting its terrible password hygiene.”',
      className: 'Rogue Signal',
      affinity: 'Static / Signal',
      rarity: 'Unlockable / Signal Prototype',
      clearance: 'Level 20',
      fileStatus: 'Locked',
      unlockShard: 'Operator Shard: Sable',
      shardName: 'Operator Shard: Sable',
      shardCost: 75,
      dropWeight: 1,
      unlockedByDefault: false,
      portrait: 'assets/operators/sable/portrait.png',
      battle: 'assets/operators/sable/battle.png',
      avatar: 'assets/operators/sable/avatar.png',
      icon: 'assets/operators/sable/icon.png',
      menu: 'assets/operators/sable/menu.png',
      profile: 'assets/operators/sable/profile.png',
      operatorCard: 'assets/operators/sable/operator_card.png',
      partyIcon: 'assets/operators/sable/party_icon.png',
      battleIcon: 'assets/operators/sable/battle_icon.png',
      spriteSheet: 'assets/operators/sable/sprite_sheet.png',
      mapSprite: 'assets/operators/sable/sprites/map_sprite.png',
      mapSpriteLarge: 'assets/operators/sable/sprites/map_sprite_large.png',
      weapon: 'assets/operators/sable/weapon.png',
      rotations: {
        down: 'assets/operators/sable/sprites/rotations/south.png',
        downRight: 'assets/operators/sable/sprites/rotations/south-east.png',
        right: 'assets/operators/sable/sprites/rotations/east.png',
        upRight: 'assets/operators/sable/sprites/rotations/north-east.png',
        up: 'assets/operators/sable/sprites/rotations/north.png',
        upLeft: 'assets/operators/sable/sprites/rotations/north-west.png',
        left: 'assets/operators/sable/sprites/rotations/west.png',
        downLeft: 'assets/operators/sable/sprites/rotations/south-west.png'
      },
      animations: {
        walking: {
          down: ['assets/operators/sable/sprites/animations/walking/south/frame_000.png','assets/operators/sable/sprites/animations/walking/south/frame_001.png','assets/operators/sable/sprites/animations/walking/south/frame_002.png','assets/operators/sable/sprites/animations/walking/south/frame_003.png'],
          downRight: ['assets/operators/sable/sprites/animations/walking/south-east/frame_000.png','assets/operators/sable/sprites/animations/walking/south-east/frame_001.png','assets/operators/sable/sprites/animations/walking/south-east/frame_002.png','assets/operators/sable/sprites/animations/walking/south-east/frame_003.png'],
          right: ['assets/operators/sable/sprites/animations/walking/east/frame_000.png','assets/operators/sable/sprites/animations/walking/east/frame_001.png','assets/operators/sable/sprites/animations/walking/east/frame_002.png','assets/operators/sable/sprites/animations/walking/east/frame_003.png'],
          upRight: ['assets/operators/sable/sprites/animations/walking/north-east/frame_000.png','assets/operators/sable/sprites/animations/walking/north-east/frame_001.png','assets/operators/sable/sprites/animations/walking/north-east/frame_002.png','assets/operators/sable/sprites/animations/walking/north-east/frame_003.png'],
          up: ['assets/operators/sable/sprites/animations/walking/north/frame_000.png','assets/operators/sable/sprites/animations/walking/north/frame_001.png','assets/operators/sable/sprites/animations/walking/north/frame_002.png','assets/operators/sable/sprites/animations/walking/north/frame_003.png'],
          upLeft: ['assets/operators/sable/sprites/animations/walking/north-west/frame_000.png','assets/operators/sable/sprites/animations/walking/north-west/frame_001.png','assets/operators/sable/sprites/animations/walking/north-west/frame_002.png','assets/operators/sable/sprites/animations/walking/north-west/frame_003.png'],
          left: ['assets/operators/sable/sprites/animations/walking/west/frame_000.png','assets/operators/sable/sprites/animations/walking/west/frame_001.png','assets/operators/sable/sprites/animations/walking/west/frame_002.png','assets/operators/sable/sprites/animations/walking/west/frame_003.png'],
          downLeft: ['assets/operators/sable/sprites/animations/walking/south-west/frame_000.png','assets/operators/sable/sprites/animations/walking/south-west/frame_001.png','assets/operators/sable/sprites/animations/walking/south-west/frame_002.png','assets/operators/sable/sprites/animations/walking/south-west/frame_003.png']
        },
        idle: {
          down: ['assets/operators/sable/sprites/animations/idle/south/frame_000.png','assets/operators/sable/sprites/animations/idle/south/frame_001.png','assets/operators/sable/sprites/animations/idle/south/frame_002.png','assets/operators/sable/sprites/animations/idle/south/frame_003.png'],
          downRight: ['assets/operators/sable/sprites/animations/idle/south-east/frame_000.png','assets/operators/sable/sprites/animations/idle/south-east/frame_001.png','assets/operators/sable/sprites/animations/idle/south-east/frame_002.png','assets/operators/sable/sprites/animations/idle/south-east/frame_003.png'],
          right: ['assets/operators/sable/sprites/animations/idle/east/frame_000.png','assets/operators/sable/sprites/animations/idle/east/frame_001.png','assets/operators/sable/sprites/animations/idle/east/frame_002.png','assets/operators/sable/sprites/animations/idle/east/frame_003.png'],
          upRight: ['assets/operators/sable/sprites/animations/idle/north-east/frame_000.png','assets/operators/sable/sprites/animations/idle/north-east/frame_001.png','assets/operators/sable/sprites/animations/idle/north-east/frame_002.png','assets/operators/sable/sprites/animations/idle/north-east/frame_003.png'],
          up: ['assets/operators/sable/sprites/animations/idle/north/frame_000.png','assets/operators/sable/sprites/animations/idle/north/frame_001.png','assets/operators/sable/sprites/animations/idle/north/frame_002.png','assets/operators/sable/sprites/animations/idle/north/frame_003.png'],
          upLeft: ['assets/operators/sable/sprites/animations/idle/north-west/frame_000.png','assets/operators/sable/sprites/animations/idle/north-west/frame_001.png','assets/operators/sable/sprites/animations/idle/north-west/frame_002.png','assets/operators/sable/sprites/animations/idle/north-west/frame_003.png'],
          left: ['assets/operators/sable/sprites/animations/idle/west/frame_000.png','assets/operators/sable/sprites/animations/idle/west/frame_001.png','assets/operators/sable/sprites/animations/idle/west/frame_002.png','assets/operators/sable/sprites/animations/idle/west/frame_003.png'],
          downLeft: ['assets/operators/sable/sprites/animations/idle/south-west/frame_000.png','assets/operators/sable/sprites/animations/idle/south-west/frame_001.png','assets/operators/sable/sprites/animations/idle/south-west/frame_002.png','assets/operators/sable/sprites/animations/idle/south-west/frame_003.png']
        }
      }
    }
,

    pip: {
      id: 'pip',
      code: 'AV-007',
      displayName: 'Pip Wrenchley',
      codename: 'TINY LOUD',
      title: 'Tiny Loud Mechanic',
      meta: 'Operator Unit 007 • Tiny Loud Mechanic • Locked',
      quote: '“I am not yelling. I am communicating over the sound of bad ideas exploding.”',
      className: 'Tiny Loud Mechanic',
      affinity: 'Scrap / Spark',
      rarity: 'Unlockable / Gremlin Prototype',
      clearance: 'Level 24',
      fileStatus: 'Locked',
      unlockShard: 'Operator Shard: Pip',
      shardName: 'Operator Shard: Pip',
      shardCost: 85,
      dropWeight: 1,
      unlockedByDefault: false,
      portrait: 'assets/operators/pip/portrait.png',
      battle: 'assets/operators/pip/battle.png',
      avatar: 'assets/operators/pip/avatar.png',
      icon: 'assets/operators/pip/icon.png',
      menu: 'assets/operators/pip/menu.png',
      profile: 'assets/operators/pip/profile.png',
      operatorCard: 'assets/operators/pip/operator_card.png',
      partyIcon: 'assets/operators/pip/party_icon.png',
      battleIcon: 'assets/operators/pip/battle_icon.png',
      spriteSheet: 'assets/operators/pip/sprite_sheet.png',
      mapSprite: 'assets/operators/pip/sprites/map_sprite.png',
      mapSpriteLarge: 'assets/operators/pip/sprites/map_sprite_large.png',
      weapon: 'assets/operators/pip/weapon.png',
      rotations: {
        down: 'assets/operators/pip/sprites/rotations/south.png',
        downRight: 'assets/operators/pip/sprites/rotations/south-east.png',
        right: 'assets/operators/pip/sprites/rotations/east.png',
        upRight: 'assets/operators/pip/sprites/rotations/north-east.png',
        up: 'assets/operators/pip/sprites/rotations/north.png',
        upLeft: 'assets/operators/pip/sprites/rotations/north-west.png',
        left: 'assets/operators/pip/sprites/rotations/west.png',
        downLeft: 'assets/operators/pip/sprites/rotations/south-west.png'
      },
      animations: {
        walking: {
          down: ['assets/operators/pip/sprites/animations/walking/south/frame_000.png','assets/operators/pip/sprites/animations/walking/south/frame_001.png','assets/operators/pip/sprites/animations/walking/south/frame_002.png','assets/operators/pip/sprites/animations/walking/south/frame_003.png'],
          downRight: ['assets/operators/pip/sprites/animations/walking/south-east/frame_000.png','assets/operators/pip/sprites/animations/walking/south-east/frame_001.png','assets/operators/pip/sprites/animations/walking/south-east/frame_002.png','assets/operators/pip/sprites/animations/walking/south-east/frame_003.png'],
          right: ['assets/operators/pip/sprites/animations/walking/east/frame_000.png','assets/operators/pip/sprites/animations/walking/east/frame_001.png','assets/operators/pip/sprites/animations/walking/east/frame_002.png','assets/operators/pip/sprites/animations/walking/east/frame_003.png'],
          upRight: ['assets/operators/pip/sprites/animations/walking/north-east/frame_000.png','assets/operators/pip/sprites/animations/walking/north-east/frame_001.png','assets/operators/pip/sprites/animations/walking/north-east/frame_002.png','assets/operators/pip/sprites/animations/walking/north-east/frame_003.png'],
          up: ['assets/operators/pip/sprites/animations/walking/north/frame_000.png','assets/operators/pip/sprites/animations/walking/north/frame_001.png','assets/operators/pip/sprites/animations/walking/north/frame_002.png','assets/operators/pip/sprites/animations/walking/north/frame_003.png'],
          upLeft: ['assets/operators/pip/sprites/animations/walking/north-west/frame_000.png','assets/operators/pip/sprites/animations/walking/north-west/frame_001.png','assets/operators/pip/sprites/animations/walking/north-west/frame_002.png','assets/operators/pip/sprites/animations/walking/north-west/frame_003.png'],
          left: ['assets/operators/pip/sprites/animations/walking/west/frame_000.png','assets/operators/pip/sprites/animations/walking/west/frame_001.png','assets/operators/pip/sprites/animations/walking/west/frame_002.png','assets/operators/pip/sprites/animations/walking/west/frame_003.png'],
          downLeft: ['assets/operators/pip/sprites/animations/walking/south-west/frame_000.png','assets/operators/pip/sprites/animations/walking/south-west/frame_001.png','assets/operators/pip/sprites/animations/walking/south-west/frame_002.png','assets/operators/pip/sprites/animations/walking/south-west/frame_003.png']
        },
        idle: {
          down: ['assets/operators/pip/sprites/animations/idle/south/frame_000.png','assets/operators/pip/sprites/animations/idle/south/frame_001.png','assets/operators/pip/sprites/animations/idle/south/frame_002.png','assets/operators/pip/sprites/animations/idle/south/frame_003.png'],
          downRight: ['assets/operators/pip/sprites/animations/idle/south-east/frame_000.png','assets/operators/pip/sprites/animations/idle/south-east/frame_001.png','assets/operators/pip/sprites/animations/idle/south-east/frame_002.png','assets/operators/pip/sprites/animations/idle/south-east/frame_003.png'],
          right: ['assets/operators/pip/sprites/animations/idle/east/frame_000.png','assets/operators/pip/sprites/animations/idle/east/frame_001.png','assets/operators/pip/sprites/animations/idle/east/frame_002.png','assets/operators/pip/sprites/animations/idle/east/frame_003.png'],
          upRight: ['assets/operators/pip/sprites/animations/idle/north-east/frame_000.png','assets/operators/pip/sprites/animations/idle/north-east/frame_001.png','assets/operators/pip/sprites/animations/idle/north-east/frame_002.png','assets/operators/pip/sprites/animations/idle/north-east/frame_003.png'],
          up: ['assets/operators/pip/sprites/animations/idle/north/frame_000.png','assets/operators/pip/sprites/animations/idle/north/frame_001.png','assets/operators/pip/sprites/animations/idle/north/frame_002.png','assets/operators/pip/sprites/animations/idle/north/frame_003.png'],
          upLeft: ['assets/operators/pip/sprites/animations/idle/north-west/frame_000.png','assets/operators/pip/sprites/animations/idle/north-west/frame_001.png','assets/operators/pip/sprites/animations/idle/north-west/frame_002.png','assets/operators/pip/sprites/animations/idle/north-west/frame_003.png'],
          left: ['assets/operators/pip/sprites/animations/idle/west/frame_000.png','assets/operators/pip/sprites/animations/idle/west/frame_001.png','assets/operators/pip/sprites/animations/idle/west/frame_002.png','assets/operators/pip/sprites/animations/idle/west/frame_003.png'],
          downLeft: ['assets/operators/pip/sprites/animations/idle/south-west/frame_000.png','assets/operators/pip/sprites/animations/idle/south-west/frame_001.png','assets/operators/pip/sprites/animations/idle/south-west/frame_002.png','assets/operators/pip/sprites/animations/idle/south-west/frame_003.png']
        }
      }
    }
,

    dex: {
      id: 'dex',
      code: 'AV-008',
      displayName: 'Dex Deadbolt Rusk',
      codename: 'DOOR-BREAKER',
      title: 'Door-Breaker',
      meta: 'Operator Unit 008 • Door-Breaker • Locked',
      quote: '“I respect locked doors. Then I respectfully remove them from the wall.”',
      className: 'Door-Breaker',
      affinity: 'Impact / Entry',
      rarity: 'Unlockable / Breach Prototype',
      clearance: 'Level 28',
      fileStatus: 'Locked',
      unlockShard: 'Operator Shard: Dex',
      shardName: 'Operator Shard: Dex',
      shardCost: 95,
      dropWeight: 1,
      unlockedByDefault: false,
      portrait: 'assets/operators/dex/portrait.png',
      battle: 'assets/operators/dex/battle.png',
      avatar: 'assets/operators/dex/avatar.png',
      icon: 'assets/operators/dex/icon.png',
      menu: 'assets/operators/dex/menu.png',
      profile: 'assets/operators/dex/profile.png',
      operatorCard: 'assets/operators/dex/operator_card.png',
      partyIcon: 'assets/operators/dex/party_icon.png',
      battleIcon: 'assets/operators/dex/battle_icon.png',
      spriteSheet: 'assets/operators/dex/sprite_sheet.png',
      mapSprite: 'assets/operators/dex/sprites/map_sprite.png',
      mapSpriteLarge: 'assets/operators/dex/sprites/map_sprite_large.png',
      weapon: 'assets/operators/dex/weapon.png',
      rotations: {
        down: 'assets/operators/dex/sprites/rotations/south.png',
        downRight: 'assets/operators/dex/sprites/rotations/south-east.png',
        right: 'assets/operators/dex/sprites/rotations/east.png',
        upRight: 'assets/operators/dex/sprites/rotations/north-east.png',
        up: 'assets/operators/dex/sprites/rotations/north.png',
        upLeft: 'assets/operators/dex/sprites/rotations/north-west.png',
        left: 'assets/operators/dex/sprites/rotations/west.png',
        downLeft: 'assets/operators/dex/sprites/rotations/south-west.png'
      },
      animations: {
        walking: {
          down: ['assets/operators/dex/sprites/animations/walking/south/frame_000.png','assets/operators/dex/sprites/animations/walking/south/frame_001.png','assets/operators/dex/sprites/animations/walking/south/frame_002.png','assets/operators/dex/sprites/animations/walking/south/frame_003.png'],
          downRight: ['assets/operators/dex/sprites/animations/walking/south-east/frame_000.png','assets/operators/dex/sprites/animations/walking/south-east/frame_001.png','assets/operators/dex/sprites/animations/walking/south-east/frame_002.png','assets/operators/dex/sprites/animations/walking/south-east/frame_003.png'],
          right: ['assets/operators/dex/sprites/animations/walking/east/frame_000.png','assets/operators/dex/sprites/animations/walking/east/frame_001.png','assets/operators/dex/sprites/animations/walking/east/frame_002.png','assets/operators/dex/sprites/animations/walking/east/frame_003.png'],
          upRight: ['assets/operators/dex/sprites/animations/walking/north-east/frame_000.png','assets/operators/dex/sprites/animations/walking/north-east/frame_001.png','assets/operators/dex/sprites/animations/walking/north-east/frame_002.png','assets/operators/dex/sprites/animations/walking/north-east/frame_003.png'],
          up: ['assets/operators/dex/sprites/animations/walking/north/frame_000.png','assets/operators/dex/sprites/animations/walking/north/frame_001.png','assets/operators/dex/sprites/animations/walking/north/frame_002.png','assets/operators/dex/sprites/animations/walking/north/frame_003.png'],
          upLeft: ['assets/operators/dex/sprites/animations/walking/north-west/frame_000.png','assets/operators/dex/sprites/animations/walking/north-west/frame_001.png','assets/operators/dex/sprites/animations/walking/north-west/frame_002.png','assets/operators/dex/sprites/animations/walking/north-west/frame_003.png'],
          left: ['assets/operators/dex/sprites/animations/walking/west/frame_000.png','assets/operators/dex/sprites/animations/walking/west/frame_001.png','assets/operators/dex/sprites/animations/walking/west/frame_002.png','assets/operators/dex/sprites/animations/walking/west/frame_003.png'],
          downLeft: ['assets/operators/dex/sprites/animations/walking/south-west/frame_000.png','assets/operators/dex/sprites/animations/walking/south-west/frame_001.png','assets/operators/dex/sprites/animations/walking/south-west/frame_002.png','assets/operators/dex/sprites/animations/walking/south-west/frame_003.png']
        },
        idle: {
          down: ['assets/operators/dex/sprites/animations/idle/south/frame_000.png','assets/operators/dex/sprites/animations/idle/south/frame_001.png','assets/operators/dex/sprites/animations/idle/south/frame_002.png','assets/operators/dex/sprites/animations/idle/south/frame_003.png'],
          downRight: ['assets/operators/dex/sprites/animations/idle/south-east/frame_000.png','assets/operators/dex/sprites/animations/idle/south-east/frame_001.png','assets/operators/dex/sprites/animations/idle/south-east/frame_002.png','assets/operators/dex/sprites/animations/idle/south-east/frame_003.png'],
          right: ['assets/operators/dex/sprites/animations/idle/east/frame_000.png','assets/operators/dex/sprites/animations/idle/east/frame_001.png','assets/operators/dex/sprites/animations/idle/east/frame_002.png','assets/operators/dex/sprites/animations/idle/east/frame_003.png'],
          upRight: ['assets/operators/dex/sprites/animations/idle/north-east/frame_000.png','assets/operators/dex/sprites/animations/idle/north-east/frame_001.png','assets/operators/dex/sprites/animations/idle/north-east/frame_002.png','assets/operators/dex/sprites/animations/idle/north-east/frame_003.png'],
          up: ['assets/operators/dex/sprites/animations/idle/north/frame_000.png','assets/operators/dex/sprites/animations/idle/north/frame_001.png','assets/operators/dex/sprites/animations/idle/north/frame_002.png','assets/operators/dex/sprites/animations/idle/north/frame_003.png'],
          upLeft: ['assets/operators/dex/sprites/animations/idle/north-west/frame_000.png','assets/operators/dex/sprites/animations/idle/north-west/frame_001.png','assets/operators/dex/sprites/animations/idle/north-west/frame_002.png','assets/operators/dex/sprites/animations/idle/north-west/frame_003.png'],
          left: ['assets/operators/dex/sprites/animations/idle/west/frame_000.png','assets/operators/dex/sprites/animations/idle/west/frame_001.png','assets/operators/dex/sprites/animations/idle/west/frame_002.png','assets/operators/dex/sprites/animations/idle/west/frame_003.png'],
          downLeft: ['assets/operators/dex/sprites/animations/idle/south-west/frame_000.png','assets/operators/dex/sprites/animations/idle/south-west/frame_001.png','assets/operators/dex/sprites/animations/idle/south-west/frame_002.png','assets/operators/dex/sprites/animations/idle/south-west/frame_003.png']
        }
      }
    }
,

    luma: {
      id: 'luma',
      code: 'AV-009',
      displayName: 'Luma Crank',
      codename: 'GLOWCORE RUNNER',
      title: 'Glowcore Runner',
      meta: 'Operator Unit 009 • Glowcore Runner • Locked',
      quote: '“Running from danger is cardio. Running toward it is branding.”',
      className: 'Glowcore Runner',
      affinity: 'Glowcore / Speed',
      rarity: 'Unlockable / Runner Prototype',
      clearance: 'Level 32',
      fileStatus: 'Locked',
      unlockShard: 'Operator Shard: Luma',
      shardName: 'Operator Shard: Luma',
      shardCost: 110,
      dropWeight: 1,
      unlockedByDefault: false,
      portrait: 'assets/operators/luma/portrait.png',
      battle: 'assets/operators/luma/battle.png',
      avatar: 'assets/operators/luma/avatar.png',
      icon: 'assets/operators/luma/icon.png',
      menu: 'assets/operators/luma/menu.png',
      profile: 'assets/operators/luma/profile.png',
      operatorCard: 'assets/operators/luma/operator_card.png',
      partyIcon: 'assets/operators/luma/party_icon.png',
      battleIcon: 'assets/operators/luma/battle_icon.png',
      spriteSheet: 'assets/operators/luma/sprite_sheet.png',
      mapSprite: 'assets/operators/luma/sprites/map_sprite.png',
      mapSpriteLarge: 'assets/operators/luma/sprites/map_sprite_large.png',
      weapon: 'assets/operators/luma/weapon.png',
      rotations: {
        down: 'assets/operators/luma/sprites/rotations/south.png',
        downRight: 'assets/operators/luma/sprites/rotations/south-east.png',
        right: 'assets/operators/luma/sprites/rotations/east.png',
        upRight: 'assets/operators/luma/sprites/rotations/north-east.png',
        up: 'assets/operators/luma/sprites/rotations/north.png',
        upLeft: 'assets/operators/luma/sprites/rotations/north-west.png',
        left: 'assets/operators/luma/sprites/rotations/west.png',
        downLeft: 'assets/operators/luma/sprites/rotations/south-west.png'
      },
      animations: {
        walking: {
          down: ['assets/operators/luma/sprites/animations/walking/south/frame_000.png','assets/operators/luma/sprites/animations/walking/south/frame_001.png','assets/operators/luma/sprites/animations/walking/south/frame_002.png','assets/operators/luma/sprites/animations/walking/south/frame_003.png'],
          downRight: ['assets/operators/luma/sprites/animations/walking/south-east/frame_000.png','assets/operators/luma/sprites/animations/walking/south-east/frame_001.png','assets/operators/luma/sprites/animations/walking/south-east/frame_002.png','assets/operators/luma/sprites/animations/walking/south-east/frame_003.png'],
          right: ['assets/operators/luma/sprites/animations/walking/east/frame_000.png','assets/operators/luma/sprites/animations/walking/east/frame_001.png','assets/operators/luma/sprites/animations/walking/east/frame_002.png','assets/operators/luma/sprites/animations/walking/east/frame_003.png'],
          upRight: ['assets/operators/luma/sprites/animations/walking/north-east/frame_000.png','assets/operators/luma/sprites/animations/walking/north-east/frame_001.png','assets/operators/luma/sprites/animations/walking/north-east/frame_002.png','assets/operators/luma/sprites/animations/walking/north-east/frame_003.png'],
          up: ['assets/operators/luma/sprites/animations/walking/north/frame_000.png','assets/operators/luma/sprites/animations/walking/north/frame_001.png','assets/operators/luma/sprites/animations/walking/north/frame_002.png','assets/operators/luma/sprites/animations/walking/north/frame_003.png'],
          upLeft: ['assets/operators/luma/sprites/animations/walking/north-west/frame_000.png','assets/operators/luma/sprites/animations/walking/north-west/frame_001.png','assets/operators/luma/sprites/animations/walking/north-west/frame_002.png','assets/operators/luma/sprites/animations/walking/north-west/frame_003.png'],
          left: ['assets/operators/luma/sprites/animations/walking/west/frame_000.png','assets/operators/luma/sprites/animations/walking/west/frame_001.png','assets/operators/luma/sprites/animations/walking/west/frame_002.png','assets/operators/luma/sprites/animations/walking/west/frame_003.png'],
          downLeft: ['assets/operators/luma/sprites/animations/walking/south-west/frame_000.png','assets/operators/luma/sprites/animations/walking/south-west/frame_001.png','assets/operators/luma/sprites/animations/walking/south-west/frame_002.png','assets/operators/luma/sprites/animations/walking/south-west/frame_003.png']
        },
        idle: {
          down: ['assets/operators/luma/sprites/animations/idle/south/frame_000.png','assets/operators/luma/sprites/animations/idle/south/frame_001.png','assets/operators/luma/sprites/animations/idle/south/frame_002.png','assets/operators/luma/sprites/animations/idle/south/frame_003.png'],
          downRight: ['assets/operators/luma/sprites/animations/idle/south-east/frame_000.png','assets/operators/luma/sprites/animations/idle/south-east/frame_001.png','assets/operators/luma/sprites/animations/idle/south-east/frame_002.png','assets/operators/luma/sprites/animations/idle/south-east/frame_003.png'],
          right: ['assets/operators/luma/sprites/animations/idle/east/frame_000.png','assets/operators/luma/sprites/animations/idle/east/frame_001.png','assets/operators/luma/sprites/animations/idle/east/frame_002.png','assets/operators/luma/sprites/animations/idle/east/frame_003.png'],
          upRight: ['assets/operators/luma/sprites/animations/idle/north-east/frame_000.png','assets/operators/luma/sprites/animations/idle/north-east/frame_001.png','assets/operators/luma/sprites/animations/idle/north-east/frame_002.png','assets/operators/luma/sprites/animations/idle/north-east/frame_003.png'],
          up: ['assets/operators/luma/sprites/animations/idle/north/frame_000.png','assets/operators/luma/sprites/animations/idle/north/frame_001.png','assets/operators/luma/sprites/animations/idle/north/frame_002.png','assets/operators/luma/sprites/animations/idle/north/frame_003.png'],
          upLeft: ['assets/operators/luma/sprites/animations/idle/north-west/frame_000.png','assets/operators/luma/sprites/animations/idle/north-west/frame_001.png','assets/operators/luma/sprites/animations/idle/north-west/frame_002.png','assets/operators/luma/sprites/animations/idle/north-west/frame_003.png'],
          left: ['assets/operators/luma/sprites/animations/idle/west/frame_000.png','assets/operators/luma/sprites/animations/idle/west/frame_001.png','assets/operators/luma/sprites/animations/idle/west/frame_002.png','assets/operators/luma/sprites/animations/idle/west/frame_003.png'],
          downLeft: ['assets/operators/luma/sprites/animations/idle/south-west/frame_000.png','assets/operators/luma/sprites/animations/idle/south-west/frame_001.png','assets/operators/luma/sprites/animations/idle/south-west/frame_002.png','assets/operators/luma/sprites/animations/idle/south-west/frame_003.png']
        }
      }
    }
,

    gutter: {
      id: 'gutter',
      code: 'AV-010',
      displayName: 'Gutter Saint',
      codename: 'MUTANT SCRAP',
      title: 'Mutant Scrap Saint',
      meta: 'Operator Unit 010 • Mutant Scrap Saint • Locked',
      quote: '“Bless this mess, then hand me the biggest pipe in the room.”',
      className: 'Mutant Scrap Saint',
      affinity: 'Mutation / Scrap',
      rarity: 'Unlockable / Mutant Prototype',
      clearance: 'Level 36',
      fileStatus: 'Locked',
      unlockShard: 'Operator Shard: Gutter',
      shardName: 'Operator Shard: Gutter',
      shardCost: 125,
      dropWeight: 1,
      unlockedByDefault: false,
      portrait: 'assets/operators/gutter/portrait.png',
      battle: 'assets/operators/gutter/battle.png',
      avatar: 'assets/operators/gutter/avatar.png',
      icon: 'assets/operators/gutter/icon.png',
      menu: 'assets/operators/gutter/menu.png',
      profile: 'assets/operators/gutter/profile.png',
      operatorCard: 'assets/operators/gutter/operator_card.png',
      partyIcon: 'assets/operators/gutter/party_icon.png',
      battleIcon: 'assets/operators/gutter/battle_icon.png',
      spriteSheet: 'assets/operators/gutter/sprite_sheet.png',
      mapSprite: 'assets/operators/gutter/sprites/map_sprite.png',
      mapSpriteLarge: 'assets/operators/gutter/sprites/map_sprite_large.png',
      weapon: 'assets/operators/gutter/weapon.png',
      rotations: {
        down: 'assets/operators/gutter/sprites/rotations/south.png',
        downRight: 'assets/operators/gutter/sprites/rotations/south-east.png',
        right: 'assets/operators/gutter/sprites/rotations/east.png',
        upRight: 'assets/operators/gutter/sprites/rotations/north-east.png',
        up: 'assets/operators/gutter/sprites/rotations/north.png',
        upLeft: 'assets/operators/gutter/sprites/rotations/north-west.png',
        left: 'assets/operators/gutter/sprites/rotations/west.png',
        downLeft: 'assets/operators/gutter/sprites/rotations/south-west.png'
      },
      animations: {
        walking: {
          down: ['assets/operators/gutter/sprites/animations/walking/south/frame_000.png','assets/operators/gutter/sprites/animations/walking/south/frame_001.png','assets/operators/gutter/sprites/animations/walking/south/frame_002.png','assets/operators/gutter/sprites/animations/walking/south/frame_003.png'],
          downRight: ['assets/operators/gutter/sprites/animations/walking/south-east/frame_000.png','assets/operators/gutter/sprites/animations/walking/south-east/frame_001.png','assets/operators/gutter/sprites/animations/walking/south-east/frame_002.png','assets/operators/gutter/sprites/animations/walking/south-east/frame_003.png'],
          right: ['assets/operators/gutter/sprites/animations/walking/east/frame_000.png','assets/operators/gutter/sprites/animations/walking/east/frame_001.png','assets/operators/gutter/sprites/animations/walking/east/frame_002.png','assets/operators/gutter/sprites/animations/walking/east/frame_003.png'],
          upRight: ['assets/operators/gutter/sprites/animations/walking/north-east/frame_000.png','assets/operators/gutter/sprites/animations/walking/north-east/frame_001.png','assets/operators/gutter/sprites/animations/walking/north-east/frame_002.png','assets/operators/gutter/sprites/animations/walking/north-east/frame_003.png'],
          up: ['assets/operators/gutter/sprites/animations/walking/north/frame_000.png','assets/operators/gutter/sprites/animations/walking/north/frame_001.png','assets/operators/gutter/sprites/animations/walking/north/frame_002.png','assets/operators/gutter/sprites/animations/walking/north/frame_003.png'],
          upLeft: ['assets/operators/gutter/sprites/animations/walking/north-west/frame_000.png','assets/operators/gutter/sprites/animations/walking/north-west/frame_001.png','assets/operators/gutter/sprites/animations/walking/north-west/frame_002.png','assets/operators/gutter/sprites/animations/walking/north-west/frame_003.png'],
          left: ['assets/operators/gutter/sprites/animations/walking/west/frame_000.png','assets/operators/gutter/sprites/animations/walking/west/frame_001.png','assets/operators/gutter/sprites/animations/walking/west/frame_002.png','assets/operators/gutter/sprites/animations/walking/west/frame_003.png'],
          downLeft: ['assets/operators/gutter/sprites/animations/walking/south-west/frame_000.png','assets/operators/gutter/sprites/animations/walking/south-west/frame_001.png','assets/operators/gutter/sprites/animations/walking/south-west/frame_002.png','assets/operators/gutter/sprites/animations/walking/south-west/frame_003.png']
        },
        idle: {
          down: ['assets/operators/gutter/sprites/animations/idle/south/frame_000.png','assets/operators/gutter/sprites/animations/idle/south/frame_001.png','assets/operators/gutter/sprites/animations/idle/south/frame_002.png','assets/operators/gutter/sprites/animations/idle/south/frame_003.png'],
          downRight: ['assets/operators/gutter/sprites/animations/idle/south-east/frame_000.png','assets/operators/gutter/sprites/animations/idle/south-east/frame_001.png','assets/operators/gutter/sprites/animations/idle/south-east/frame_002.png','assets/operators/gutter/sprites/animations/idle/south-east/frame_003.png'],
          right: ['assets/operators/gutter/sprites/animations/idle/east/frame_000.png','assets/operators/gutter/sprites/animations/idle/east/frame_001.png','assets/operators/gutter/sprites/animations/idle/east/frame_002.png','assets/operators/gutter/sprites/animations/idle/east/frame_003.png'],
          upRight: ['assets/operators/gutter/sprites/animations/idle/north-east/frame_000.png','assets/operators/gutter/sprites/animations/idle/north-east/frame_001.png','assets/operators/gutter/sprites/animations/idle/north-east/frame_002.png','assets/operators/gutter/sprites/animations/idle/north-east/frame_003.png'],
          up: ['assets/operators/gutter/sprites/animations/idle/north/frame_000.png','assets/operators/gutter/sprites/animations/idle/north/frame_001.png','assets/operators/gutter/sprites/animations/idle/north/frame_002.png','assets/operators/gutter/sprites/animations/idle/north/frame_003.png'],
          upLeft: ['assets/operators/gutter/sprites/animations/idle/north-west/frame_000.png','assets/operators/gutter/sprites/animations/idle/north-west/frame_001.png','assets/operators/gutter/sprites/animations/idle/north-west/frame_002.png','assets/operators/gutter/sprites/animations/idle/north-west/frame_003.png'],
          left: ['assets/operators/gutter/sprites/animations/idle/west/frame_000.png','assets/operators/gutter/sprites/animations/idle/west/frame_001.png','assets/operators/gutter/sprites/animations/idle/west/frame_002.png','assets/operators/gutter/sprites/animations/idle/west/frame_003.png'],
          downLeft: ['assets/operators/gutter/sprites/animations/idle/south-west/frame_000.png','assets/operators/gutter/sprites/animations/idle/south-west/frame_001.png','assets/operators/gutter/sprites/animations/idle/south-west/frame_002.png','assets/operators/gutter/sprites/animations/idle/south-west/frame_003.png']
        }
      }
    }
,

    tilda: {
      id: 'tilda',
      code: 'AV-011',
      displayName: 'Tilda Fuse',
      codename: 'EXPLOSIVE CHEF',
      title: 'Explosive Chef',
      meta: 'Operator Unit 011 • Explosive Chef • Locked',
      quote: '“Dinner is served. Duck first.”',
      className: 'Explosive Chef',
      affinity: 'Fire / Scrap Cuisine',
      rarity: 'Unlockable / Culinary Prototype',
      clearance: 'Level 40',
      fileStatus: 'Locked',
      unlockShard: 'Operator Shard: Tilda',
      shardName: 'Operator Shard: Tilda',
      shardCost: 140,
      dropWeight: 1,
      unlockedByDefault: false,
      portrait: 'assets/operators/tilda/portrait.png',
      battle: 'assets/operators/tilda/battle.png',
      avatar: 'assets/operators/tilda/avatar.png',
      icon: 'assets/operators/tilda/icon.png',
      menu: 'assets/operators/tilda/menu.png',
      profile: 'assets/operators/tilda/profile.png',
      operatorCard: 'assets/operators/tilda/operator_card.png',
      partyIcon: 'assets/operators/tilda/party_icon.png',
      battleIcon: 'assets/operators/tilda/battle_icon.png',
      spriteSheet: 'assets/operators/tilda/sprite_sheet.png',
      mapSprite: 'assets/operators/tilda/sprites/map_sprite.png',
      mapSpriteLarge: 'assets/operators/tilda/sprites/map_sprite_large.png',
      weapon: 'assets/operators/tilda/weapon.png',
      rotations: {
        down: 'assets/operators/tilda/sprites/rotations/south.png',
        downRight: 'assets/operators/tilda/sprites/rotations/south-east.png',
        right: 'assets/operators/tilda/sprites/rotations/east.png',
        upRight: 'assets/operators/tilda/sprites/rotations/north-east.png',
        up: 'assets/operators/tilda/sprites/rotations/north.png',
        upLeft: 'assets/operators/tilda/sprites/rotations/north-west.png',
        left: 'assets/operators/tilda/sprites/rotations/west.png',
        downLeft: 'assets/operators/tilda/sprites/rotations/south-west.png'
      },
      animations: {
        walking: {
          down: ['assets/operators/tilda/sprites/animations/walking/south/frame_000.png','assets/operators/tilda/sprites/animations/walking/south/frame_001.png','assets/operators/tilda/sprites/animations/walking/south/frame_002.png','assets/operators/tilda/sprites/animations/walking/south/frame_003.png'],
          downRight: ['assets/operators/tilda/sprites/animations/walking/south-east/frame_000.png','assets/operators/tilda/sprites/animations/walking/south-east/frame_001.png','assets/operators/tilda/sprites/animations/walking/south-east/frame_002.png','assets/operators/tilda/sprites/animations/walking/south-east/frame_003.png'],
          right: ['assets/operators/tilda/sprites/animations/walking/east/frame_000.png','assets/operators/tilda/sprites/animations/walking/east/frame_001.png','assets/operators/tilda/sprites/animations/walking/east/frame_002.png','assets/operators/tilda/sprites/animations/walking/east/frame_003.png'],
          upRight: ['assets/operators/tilda/sprites/animations/walking/north-east/frame_000.png','assets/operators/tilda/sprites/animations/walking/north-east/frame_001.png','assets/operators/tilda/sprites/animations/walking/north-east/frame_002.png','assets/operators/tilda/sprites/animations/walking/north-east/frame_003.png'],
          up: ['assets/operators/tilda/sprites/animations/walking/north/frame_000.png','assets/operators/tilda/sprites/animations/walking/north/frame_001.png','assets/operators/tilda/sprites/animations/walking/north/frame_002.png','assets/operators/tilda/sprites/animations/walking/north/frame_003.png'],
          upLeft: ['assets/operators/tilda/sprites/animations/walking/north-west/frame_000.png','assets/operators/tilda/sprites/animations/walking/north-west/frame_001.png','assets/operators/tilda/sprites/animations/walking/north-west/frame_002.png','assets/operators/tilda/sprites/animations/walking/north-west/frame_003.png'],
          left: ['assets/operators/tilda/sprites/animations/walking/west/frame_000.png','assets/operators/tilda/sprites/animations/walking/west/frame_001.png','assets/operators/tilda/sprites/animations/walking/west/frame_002.png','assets/operators/tilda/sprites/animations/walking/west/frame_003.png'],
          downLeft: ['assets/operators/tilda/sprites/animations/walking/south-west/frame_000.png','assets/operators/tilda/sprites/animations/walking/south-west/frame_001.png','assets/operators/tilda/sprites/animations/walking/south-west/frame_002.png','assets/operators/tilda/sprites/animations/walking/south-west/frame_003.png']
        },
        idle: {
          down: ['assets/operators/tilda/sprites/animations/idle/south/frame_000.png','assets/operators/tilda/sprites/animations/idle/south/frame_001.png','assets/operators/tilda/sprites/animations/idle/south/frame_002.png','assets/operators/tilda/sprites/animations/idle/south/frame_003.png'],
          downRight: ['assets/operators/tilda/sprites/animations/idle/south-east/frame_000.png','assets/operators/tilda/sprites/animations/idle/south-east/frame_001.png','assets/operators/tilda/sprites/animations/idle/south-east/frame_002.png','assets/operators/tilda/sprites/animations/idle/south-east/frame_003.png'],
          right: ['assets/operators/tilda/sprites/animations/idle/east/frame_000.png','assets/operators/tilda/sprites/animations/idle/east/frame_001.png','assets/operators/tilda/sprites/animations/idle/east/frame_002.png','assets/operators/tilda/sprites/animations/idle/east/frame_003.png'],
          upRight: ['assets/operators/tilda/sprites/animations/idle/north-east/frame_000.png','assets/operators/tilda/sprites/animations/idle/north-east/frame_001.png','assets/operators/tilda/sprites/animations/idle/north-east/frame_002.png','assets/operators/tilda/sprites/animations/idle/north-east/frame_003.png'],
          up: ['assets/operators/tilda/sprites/animations/idle/north/frame_000.png','assets/operators/tilda/sprites/animations/idle/north/frame_001.png','assets/operators/tilda/sprites/animations/idle/north/frame_002.png','assets/operators/tilda/sprites/animations/idle/north/frame_003.png'],
          upLeft: ['assets/operators/tilda/sprites/animations/idle/north-west/frame_000.png','assets/operators/tilda/sprites/animations/idle/north-west/frame_001.png','assets/operators/tilda/sprites/animations/idle/north-west/frame_002.png','assets/operators/tilda/sprites/animations/idle/north-west/frame_003.png'],
          left: ['assets/operators/tilda/sprites/animations/idle/west/frame_000.png','assets/operators/tilda/sprites/animations/idle/west/frame_001.png','assets/operators/tilda/sprites/animations/idle/west/frame_002.png','assets/operators/tilda/sprites/animations/idle/west/frame_003.png'],
          downLeft: ['assets/operators/tilda/sprites/animations/idle/south-west/frame_000.png','assets/operators/tilda/sprites/animations/idle/south-west/frame_001.png','assets/operators/tilda/sprites/animations/idle/south-west/frame_002.png','assets/operators/tilda/sprites/animations/idle/south-west/frame_003.png']
        }
      }
    }
};

  const CHARACTER_SHARD_BASE_CHANCE = 0.04;
  const CHARACTER_SHARD_BOSS_CHANCE = 0.07;
  function ensureCharacterState(){
    if(!state) return;
    state.unlockedOperators ||= {};
    state.inventory ||= {};
    if(state.unlockedOperators.vyra){ state.unlockedOperators.av001 = true; delete state.unlockedOperators.vyra; }
    Object.values(OPERATOR_DEFS).forEach(op=>{
      if(op.unlockedByDefault || op.id === ACTIVE_OPERATOR_ID || state.qaUnlockAllCharacters) state.unlockedOperators[op.id]=true;
      else state.unlockedOperators[op.id]=!!state.unlockedOperators[op.id];
    });
    if(!OPERATOR_DEFS[state.activeOperator] || !state.unlockedOperators[state.activeOperator]) state.activeOperator = ACTIVE_OPERATOR_ID;
    ensureOperatorProgress();
  }
  function operatorUnlocked(id){ ensureCharacterState(); return !!state.unlockedOperators?.[id]; }
  function operatorShardName(id){ return OPERATOR_DEFS[id]?.shardName || OPERATOR_DEFS[id]?.unlockShard || `Operator Shard: ${OPERATOR_DEFS[id]?.displayName || id}`; }
  function operatorShardCost(id){ return Number(OPERATOR_DEFS[id]?.shardCost || 0); }
  function ownedOperatorShards(id){ ensureCharacterState(); return Number(state.inventory?.[operatorShardName(id)] || 0); }
  function operatorUnlockProgress(id){ const cost=operatorShardCost(id); const owned=ownedOperatorShards(id); return {owned,cost,needed:Math.max(0,cost-owned),unlocked:operatorUnlocked(id)}; }
  function unlockOperator(id){
    ensureCharacterState();
    const op=OPERATOR_DEFS[id];
    if(!op){ toast('Character file missing.'); return false; }
    if(operatorUnlocked(id)){ toast(`${op.displayName} already unlocked.`); return true; }
    const shard=operatorShardName(id), cost=operatorShardCost(id), owned=ownedOperatorShards(id);
    if(owned < cost){ toast(`${op.displayName} locked: need ${cost-owned} more shards.`); renderCharacterMenuDb(id); return false; }
    state.inventory[shard]=owned-cost;
    if(state.inventory[shard]<=0) delete state.inventory[shard];
    state.unlockedOperators[id]=true;
    log(`${op.displayName} unlocked with ${cost} shards.`);
    toast(`${op.displayName} unlocked.`);
    save(true); renderAll(); renderCharacterMenuDb(id);
    return true;
  }
  function selectOperator(id){
    if(!operatorUnlocked(id)){ renderCharacterMenuDb(id); toast(`${OPERATOR_DEFS[id]?.displayName || 'Character'} is locked.`); return false; }
    return setActiveOperator(id);
  }
  function lockedDropOperators(){
    ensureCharacterState();
    return Object.values(OPERATOR_DEFS).filter(op=>!operatorUnlocked(op.id) && operatorShardCost(op.id)>0);
  }
  function maybeDropOperatorShard(wasBoss=false, source='Battle'){
    const locked=lockedDropOperators();
    if(!locked.length) return null;
    const chance=wasBoss ? CHARACTER_SHARD_BOSS_CHANCE : CHARACTER_SHARD_BASE_CHANCE;
    if(Math.random() > chance) return null;
    const total=locked.reduce((sum,op)=>sum+Number(op.dropWeight||1),0);
    let roll=Math.random()*Math.max(1,total);
    let pick=locked[0];
    for(const op of locked){ roll-=Number(op.dropWeight||1); if(roll<=0){ pick=op; break; } }
    const shard=operatorShardName(pick.id);
    addItem(shard,1);
    recordDrop(shard, source, wasBoss ? 'Epic' : 'Rare');
    const progress=operatorUnlockProgress(pick.id);
    log(`Rare character shard recovered: ${shard} (${progress.owned}/${progress.cost}).`);
    return shard;
  }
  function characterCardHtml(op){
    const progress=operatorUnlockProgress(op.id);
    const active=currentOperatorId()===op.id;
    const locked=!progress.unlocked;
    const status = locked ? `LOCKED // ${progress.owned}/${progress.cost} shards` : (active ? 'ACTIVE PLAYABLE' : 'UNLOCKED // CLICK TO PLAY');
    return `<button class="character-card-btn ${active?'active':''} ${locked?'locked':'unlocked'}" data-character-card="${safeHtml(op.id)}" onclick="window.AV&&window.AV.characterCardClick&&window.AV.characterCardClick('${op.id}')"><img src="${op.icon || op.portrait}" alt="${safeHtml(op.displayName)}"><b>${safeHtml(op.displayName)}</b><span>${status}</span><em>${locked?'VIEW FILE':'PLAY AS'}</em></button>`;
  }
  function renderCharacterMenuDb(selectedId=currentOperatorId()){
    ensureCharacterState();
    const op=OPERATOR_DEFS[selectedId] || currentOperator();
    const list=$('characterList');
    const file=$('characterFile');
    if(!list || !file) return;
    list.innerHTML=Object.values(OPERATOR_DEFS).map(characterCardHtml).join('');
    const progress=operatorUnlockProgress(op.id);
    const locked=!progress.unlocked;
    const active=currentOperatorId()===op.id;
    const unlockDisabled = (!locked || progress.owned<progress.cost) ? 'disabled' : '';
    const playDisabled = locked ? 'disabled' : '';
    const rpg=operatorStatBonus(op.id);
    const prog=operatorProgressFor(op.id);
    const moves=defaultOperatorRpgDef(op.id).moves || attacks;
    const moveHtml=moves.map(m=>`<div><b>${safeHtml(m.name)}</b><span>${safeHtml(m.heal?'Heal / Sustain':(m.special?m.special.toUpperCase():'Damage'))} // ${m.ep?m.ep+' EP':'Free'} // ${safeHtml(m.text||'')}</span></div>`).join('');
    file.innerHTML=`<div class="character-file-card"><div class="record-kicker">${safeHtml(op.code)} // ${locked?'LOCKED':active?'ACTIVE PLAYABLE':'UNLOCKED'}</div><h2>${safeHtml(op.displayName)} <span>// ${safeHtml(op.codename||op.title||'OPERATOR')}</span></h2><div class="character-preview"><img src="${op.profile || op.portrait}" alt="${safeHtml(op.displayName)} profile"></div><p class="operator-quote">${safeHtml(op.quote||'')}</p><div class="operator-level-card"><b>Operator Lv. ${prog.level}</b><span>${prog.xp}/${prog.nextXp} XP</span><div class="bar xp operator-xp"><span style="width:${Math.max(0,Math.min(100,100*prog.xp/prog.nextXp))}%"></span></div><em>${safeHtml(rpg.role)} — ${safeHtml(rpg.passive)}</em></div><div class="record-grid"><div><b>HP Bonus</b><span>+${rpg.hp}</span></div><div><b>EP Bonus</b><span>+${rpg.ep}</span></div><div><b>Attack Bonus</b><span>+${rpg.atk}</span></div><div><b>Defense Bonus</b><span>+${rpg.def}</span></div><div><b>Crit</b><span>${Math.round((rpg.crit||0)*100)}%</span></div><div><b>Status</b><span>${locked?'Locked':active?'Active / Playable':'Unlocked / Ready'}</span></div><div><b>Shard</b><span>${safeHtml(operatorShardName(op.id))}</span></div><div><b>Progress</b><span>${progress.unlocked?'Complete':`${progress.owned}/${progress.cost} shards`}</span></div></div><h3>Battle Moves</h3><div class="protocol-list character-move-list">${moveHtml}</div><div class="story-actions"><button data-character-unlock="${safeHtml(op.id)}" onclick="window.AV&&window.AV.unlockOperator&&window.AV.unlockOperator('${op.id}')" ${unlockDisabled}>Unlock ${safeHtml(op.displayName)}</button><button data-character-select="${safeHtml(op.id)}" onclick="window.AV&&window.AV.playAsOperator&&window.AV.playAsOperator('${op.id}')" ${playDisabled}>${active?'Currently Playing':'Play As '+safeHtml(op.displayName)}</button><button onclick="window.AV&&window.AV.renderCharacterMenuDb&&window.AV.renderCharacterMenuDb('${currentOperatorId()}')">Show Active</button></div><p class="menu-info">${locked?'Unlock with shards first, or use Playtest → Unlock All Characters.':'Each operator now has separate level progression, stat bonuses, and battle moves.'}</p></div>`;
    const activeCard=list.querySelector(`[data-character-card="${CSS && CSS.escape ? CSS.escape(currentOperatorId()) : currentOperatorId()}"]`);
    if(activeCard) activeCard.classList.add('active');
  }
  function showCharacterFile(id){ renderCharacterMenuDb(id); }
  function characterCardClick(id){
    if(operatorUnlocked(id)) return playAsOperator(id);
    renderCharacterMenuDb(id);
    const progress=operatorUnlockProgress(id);
    toast(`${OPERATOR_DEFS[id]?.displayName || 'Character'} locked: ${progress.owned}/${progress.cost} shards.`);
    return false;
  }

  function currentOperatorId(){
    const id = state?.activeOperator || ACTIVE_OPERATOR_ID;
    if(!OPERATOR_DEFS[id]) return ACTIVE_OPERATOR_ID;
    if(state?.unlockedOperators && id !== ACTIVE_OPERATOR_ID && !state.unlockedOperators[id]) return ACTIVE_OPERATOR_ID;
    return id;
  }
  function currentOperator(){
    return OPERATOR_DEFS[currentOperatorId()] || OPERATOR_DEFS[ACTIVE_OPERATOR_ID];
  }
  function operatorAnimationPaths(op=currentOperator(), anim='walking'){
    const bank = op?.animations?.[anim] || {};
    return Object.values(bank).flatMap(frames => Array.isArray(frames) ? frames : []).filter(Boolean);
  }
  function operatorAssetPaths(op=currentOperator()){
    return [op.portrait, op.battle, op.avatar, op.icon, op.menu, op.profile, op.operatorCard, op.partyIcon, op.battleIcon, op.spriteSheet, op.mapSprite, op.mapSpriteLarge, op.weapon, ...Object.values(op.rotations||{}), ...operatorAnimationPaths(op,'walking'), ...operatorAnimationPaths(op,'idle')].filter(Boolean);
  }
  function legacyOperatorAssetPaths(){
    // v161: mirror list keeps old `assets/operators/vyra/` references alive during GitHub cache/update transitions.
    return operatorAssetPaths(OPERATOR_DEFS.av001).map(p => p.replace('assets/operators/av001/', 'assets/operators/vyra/'));
  }
  function normalizeOperatorFacing(facing='down'){
    const f=String(facing||'down');
    return ({south:'down', north:'up', east:'right', west:'left', 'south-east':'downRight', 'north-east':'upRight', 'north-west':'upLeft', 'south-west':'downLeft'})[f] || f;
  }
  function operatorWalkingFrameForFacing(facing='down'){
    const op = currentOperator();
    const dir = normalizeOperatorFacing(facing);
    const frames = op.animations?.walking?.[dir] || [];
    const movedAt = Number(state?.player?.lastMoveAt || 0);
    const moving = movedAt && Date.now() - movedAt < 420;
    if(moving && frames.length){
      const frameIndex = Math.floor((Date.now() - movedAt) / 105) % frames.length;
      return frames[frameIndex];
    }
    return null;
  }
  function operatorIdleFrameForFacing(facing='down'){
    const op = currentOperator();
    const dir = normalizeOperatorFacing(facing);
    const frames = op.animations?.idle?.[dir] || [];
    if(frames.length){
      // v164: use a normalized idle frame box so Vyra does not shrink when movement stops.
      // Keep the first frame stable to avoid needing a constant render loop.
      return frames[0];
    }
    return null;
  }
  function currentOperatorMapSpriteForFacing(facing='down'){
    const op = currentOperator();
    const dir = normalizeOperatorFacing(facing);
    return operatorWalkingFrameForFacing(dir) || operatorIdleFrameForFacing(dir) || (op.rotations && op.rotations[dir]) || op.mapSprite || 'assets/operators/av001/sprites/map_sprite.png';
  }
  let playerStepAnimId = null;
  function triggerPlayerStepAnimation(){
    if(!state?.player) return;
    state.player.lastMoveAt = Date.now();
    if(playerStepAnimId) cancelAnimationFrame(playerStepAnimId);
    const endAt = state.player.lastMoveAt + 430;
    const tick = ()=>{
      try{ render(); }catch(err){}
      if(Date.now() < endAt && gameStarted && !battle){ playerStepAnimId = requestAnimationFrame(tick); }
      else { playerStepAnimId = null; try{ render(); }catch(err){} }
    };
    playerStepAnimId = requestAnimationFrame(tick);
  }
  function storyPortraitForLine(line={}){
    if(line?.portrait && NPC_DEFS?.[line.portrait]?.asset) return NPC_DEFS[line.portrait].asset;
    return currentOperator().portrait;
  }
  function setActiveOperator(id, {silent=false, closeToGame=false}={}){
    ensureCharacterState();
    const op = OPERATOR_DEFS[id];
    if(!op){ toast('Character file missing.'); return false; }
    if(!operatorUnlocked(id)){
      if(state.qaUnlockAllCharacters){
        state.unlockedOperators[id]=true;
      }else{
        toast(`${op.displayName} is locked.`);
        renderCharacterMenuDb(id);
        return false;
      }
    }
    state.activeOperator = id;
    syncHpCap();
    if(state.player) state.player.lastMoveAt = 0;
    applyOperatorVisuals();
    loadImages();
    save(true);
    render();
    renderMini();
    renderUI();
    renderCharacterMenuDb(id);
    renderOperatorDb();
    if(closeToGame && gameStarted){
      document.querySelectorAll('.overlay').forEach(o=>{ o.classList.add('hidden'); o.style.display=''; });
      uiState.mode='game';
      document.body.classList.remove('menu-protocol-open');
      document.body.classList.add('game-active','fullscreen-mode');
      $('app')?.classList.remove('hidden');
      try{ canvas.focus({preventScroll:true}); }catch(err){}
    }
    if(!silent) toast(`Now playing as ${op.displayName}.`);
    return true;
  }
  function playAsOperator(id){
    return setActiveOperator(id, {silent:false, closeToGame:true});
  }
  function selectOperator(id){
    return playAsOperator(id);
  }

  function applyOperatorVisuals(){
    const op = currentOperator();
    const heroPortrait = $('heroPortrait');
    if(heroPortrait){ heroPortrait.src = op.portrait; heroPortrait.alt = `${op.displayName} portrait`; }
    if($('heroName')) $('heroName').textContent = op.displayName;
    if($('heroMeta')) $('heroMeta').textContent = op.meta;
    if($('battleHero')) $('battleHero').src = op.battle;
    if($('battleHeroLabel')) $('battleHeroLabel').textContent = `${op.code} ${String(op.displayName||'').toUpperCase()}`;
    const profile = $('operatorProfileArt');
    if(profile){ profile.src = op.profile; profile.alt = `${op.displayName} full profile art`; }
    if($('operatorFileStamp')) $('operatorFileStamp').textContent = `OPERATOR ID: ${op.code} // STATUS: ${String(op.fileStatus||'Active').toUpperCase()}`;
    if($('operatorDisplayName')) $('operatorDisplayName').textContent = String(op.displayName || 'VYRA').toUpperCase();
    if($('operatorDisplayCodename')) $('operatorDisplayCodename').textContent = `// ${String(op.codename || 'ASH VECTOR').toUpperCase()}`;
    if($('operatorQuote')) $('operatorQuote').textContent = op.quote || '';
    if($('operatorRecordGrid')) $('operatorRecordGrid').innerHTML = `<div><b>Class</b><span>${safeHtml(op.className||op.title||'Operator')}</span></div><div><b>Affinity</b><span>${safeHtml(op.affinity||'Unknown')}</span></div><div><b>Rarity</b><span>${safeHtml(op.rarity||'Starter')}</span></div><div><b>Clearance</b><span>${safeHtml(op.clearance||'Level 1')}</span></div><div><b>Operator Level</b><span>Lv. ${activeOperatorProgress().level} // ${activeOperatorProgress().xp}/${activeOperatorProgress().nextXp} XP</span></div><div><b>Synchronization</b><span id="operatorSync">Rank ${state?.operatorSyncRank||0}/10</span></div><div><b>File Status</b><span>${safeHtml(op.fileStatus||'Active')}</span></div>`;
    if($('operatorAssetPaths')) $('operatorAssetPaths').textContent = [op.profile, op.portrait, op.battle, op.spriteSheet, op.icon, op.mapSprite, ...(Object.values(op.rotations||{})), ...operatorAnimationPaths(op,'walking'), ...operatorAnimationPaths(op,'idle')].join('\n');
  }
  let state = newGameState();
  let battle = null; let camera = {x:0,y:0}; let bootDone=false; let storyActive=false; let pendingStoryAfter=null;
  let battleCommandIndex = 0;
  let preBattleCommandIndex = 0;
  const images = {};

  function newGameState(){
    const parsed = parseStageMap('f001');
    return {mapVersion:MAP_VERSION, currentStage:'f001', activeOperator:ACTIVE_OPERATOR_ID, qaUnlockAllCharacters:false, unlockedOperators:{av001:true}, operatorProgress:{av001:{level:1,xp:0,nextXp:operatorNextXp(1)}}, rogueEvent:null, rogueLastAt:0, stages:{f001:{unlocked:true,complete:false}, f002:{unlocked:false,complete:false}, f003:{unlocked:false,complete:false}, f004:{unlocked:false,complete:false}, f005:{unlocked:false,complete:false}, f006:{unlocked:false,complete:false}, f007:{unlocked:false,complete:false}, f008:{unlocked:false,complete:false}, f009:{unlocked:false,complete:false}, f010:{unlocked:false,complete:false}, f011:{unlocked:false,complete:false}, f012:{unlocked:false,complete:false}}, map:parsed.map, player:{x:parsed.px,y:parsed.py,facing:'down',lastMoveAt:0,level:1,xp:0,nextXp:45,hp:60,maxHp:60,ep:20,maxEp:20,overdrive:0,maxOverdrive:100,atk:10,def:3,credits:0}, inventory:{'Med Patch':2,'Vector Cell':2,'Vector Training Blade':1,'Sewer Guard Vest':1}, equipment:createEmptyEquipment(), operatorSyncRank:0, dropLog:[], bossKills:{}, enemyKills:{}, respawns:{}, resourceNodes:{}, contracts:{}, contractHistory:[], contractCounter:0, anomalyResearch:{}, npcTalks:{}, npcRewards:{}, sideQuests:{}, protocolChallenges:{}, flags:{terminal:false,lore:false,key:false,bossUnlocked:false,bossDefeated:false,chapterComplete:false,chapterRewardsClaimed:false,chapterClearSeen:false,storySeen:{},anomaliesCleared:0,chests:0}, log:['AVOS connection established.'], visited:{[`${parsed.px},${parsed.py}`]:1}, settings:{crt:true,reducedMotion:false,largeText:false,tutorialTips:true,routeBeacon:true,objectiveCompass:true,minimapRoute:true,musicVolume:0.58,sfxVolume:0.72,musicMuted:false,sfxMuted:false}, skillData:createSkillData(), combatStyle:'attack', upgrades:{blade:0,armor:0,energy:0,medtech:0}, checkpoint:null, qaUnlockAllStages:false, lastSave:Date.now()};
  }
  function loadImages(){
    const paths = [
      ...Object.values(OPERATOR_DEFS).flatMap(op=>operatorAssetPaths(op)),
      ...legacyOperatorAssetPaths(),
      ...trainingAssetPaths(),
      ...Object.values(NPC_DEFS).map(n => n.asset),
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
  const SAVE_SCHEMA_VERSION = 183;
  const SAVE_KEY = 'ashVectorSave';
  const SAVE_BACKUP_KEY = 'ashVectorSave_backup';
  const SAVE_AUTOSLOT_KEY = 'ashVectorSave_autoslot';
  function safeJsonParse(raw){
    try{return JSON.parse(raw);}catch(err){return null;}
  }
  function ensureSaveShape(){
    if(!state || !state.player) state=newGameState();
    state.saveVersion=SAVE_SCHEMA_VERSION;
    state.saveBuild=BUILD_VERSION;
    state.lastSave=Date.now();
    state.currentStage = STAGE_DEFS[state.currentStage] ? state.currentStage : 'f001';
    state.inventory ||= {};
    state.dropLog ||= [];
    state.bossKills ||= {};
    state.enemyKills ||= {};
    state.anomalyResearch ||= {};
    state.contracts ||= {};
    state.contractHistory ||= [];
    state.contractCounter ||= 0;
    state.npcTalks ||= {};
    state.npcRewards ||= {};
    state.sideQuests ||= {};
    state.protocolChallenges ||= {};
    state.resourceNodes ||= {};
    state.respawns ||= {};
    state.radioUnlocked ||= {};
    state.visited ||= {};
    ensureCharacterState();
    ensureOperatorProgress();
    state.settings={...(newGameState().settings||{}), ...(state.settings||{})};
    state.stages ||= {};
    Object.keys(STAGE_DEFS).forEach((k,i)=> state.stages[k] ||= {unlocked:i===0,complete:false});
    state.stages.f001.unlocked = true;
    state.flags ||= {};
    state.flags.storySeen ||= {};
    if(!state.skillData) state.skillData=createSkillData();
    if(!state.equipment) state.equipment=createEmptyEquipment();
    ensureProgression();
    ensureContracts();
    ensureProtocolChallenges();
    ensureSideQuests();
    ensureRadioState();
    syncHpCap();
    return state;
  }
  function migrateLoadedSave(data){
    if(!data || typeof data !== 'object') throw new Error('Save data is empty or invalid.');
    const fresh=newGameState();
    const loaded=data;
    const merged={...fresh, ...loaded};
    merged.player={...fresh.player, ...(loaded.player||{})};
    merged.inventory={...(fresh.inventory||{}), ...(loaded.inventory||{})};
    merged.operatorProgress={...(fresh.operatorProgress||{}), ...(loaded.operatorProgress||{})};
    merged.equipment={...createEmptyEquipment(), ...(loaded.equipment||{})};
    merged.settings={...(fresh.settings||{}), ...(loaded.settings||{})};
    merged.flags={...(fresh.flags||{}), ...(loaded.flags||{}), storySeen:{...(fresh.flags?.storySeen||{}), ...(loaded.flags?.storySeen||{})}};
    merged.stages={};
    Object.keys(STAGE_DEFS).forEach((k,i)=> merged.stages[k]={unlocked:i===0,complete:false, ...(loaded.stages?.[k]||{})});
    merged.stages.f001.unlocked=true;
    state=merged;
    state.currentStage = STAGE_DEFS[state.currentStage] ? state.currentStage : 'f001';
    if(!state.map || !Array.isArray(state.map) || state.mapVersion!==MAP_VERSION){
      const parsed=parseStageMap(state.currentStage);
      state.map=parsed.map;
      // Keep saved player position when valid; otherwise use stage spawn.
      if(!Number.isFinite(state.player.x) || !Number.isFinite(state.player.y)){ state.player.x=parsed.px; state.player.y=parsed.py; }
      state.mapVersion=MAP_VERSION;
    }
    invalidateCollisionRegion();
    normalizeLiveMap(true);
    repairMissionRoutesForCurrentStage();
    clampPlayerToMap();
    ensureSaveShape();
    state.mapVersion=MAP_VERSION;
    return state;
  }
  function saveSnapshotForStorage(){
    ensureSaveShape();
    const copy=JSON.parse(JSON.stringify(state));
    copy.saveVersion=SAVE_SCHEMA_VERSION;
    copy.saveBuild=BUILD_VERSION;
    copy.lastSave=Date.now();
    return copy;
  }
  function hasSaveData(){
    try{
      return !!(localStorage.getItem(SAVE_KEY) || localStorage.getItem(SAVE_AUTOSLOT_KEY) || localStorage.getItem(SAVE_BACKUP_KEY));
    }catch(err){ return false; }
  }
  function save(silent=false){
    if(typeof silent !== 'boolean') silent=false;
    try{
      const snapshot=saveSnapshotForStorage();
      const raw=JSON.stringify(snapshot);
      const prev=localStorage.getItem(SAVE_KEY);
      if(prev) localStorage.setItem(SAVE_BACKUP_KEY, prev);
      localStorage.setItem(SAVE_KEY, raw);
      localStorage.setItem(SAVE_AUTOSLOT_KEY, raw);
      const verify=localStorage.getItem(SAVE_KEY);
      if(verify !== raw) throw new Error('Browser storage did not verify the archive write.');
      if(!silent) toast(`Archive saved: ${stageDef(snapshot.currentStage).id} // Lv ${snapshot.player.level}.`);
      try{ renderUI(); renderSaveHub(); syncContinueButton(); }catch(err){}
      return true;
    }catch(err){
      console.error('Save failed:', err);
      if(!silent) toast('Save failed: '+String(err.message||err));
      return false;
    }
  }
  function rawSaveFromStorage(){
    try{
      return localStorage.getItem(SAVE_KEY) || localStorage.getItem(SAVE_AUTOSLOT_KEY) || localStorage.getItem(SAVE_BACKUP_KEY);
    }catch(err){ return null; }
  }
  function load(silent=false){
    if(typeof silent !== 'boolean') silent=false;
    const raw=rawSaveFromStorage();
    if(!raw){ if(!silent) toast('No archive found.'); return false; }
    const parsed=safeJsonParse(raw);
    if(!parsed){
      try{ localStorage.setItem(`ashVectorSave_corrupt_${Date.now()}`, raw); }catch(err){}
      if(!silent) toast('Save was corrupted. A backup copy was stored.');
      return false;
    }
    try{
      migrateLoadedSave(parsed);
      applySettings();
      unlockNextStages();
      save(true); // rewrite using the latest schema so Continue stays fixed after migration.
      if(!silent) toast(`Archive loaded: ${stageDef(state.currentStage).id} // Lv ${state.player.level}.`);
      try{ renderAll(); renderSaveHub(); syncContinueButton(); }catch(err){}
      return true;
    }catch(err){
      console.error('Load failed:', err);
      if(!silent) toast('Load failed: '+String(err.message||err));
      return false;
    }
  }
  function continueSavedGame(){
    stopIntroVideoForGame();
    const ok=load(true);
    if(!ok){ toast('No saved archive loaded. Start a new operation first.'); syncContinueButton(); return false; }
    startGame(false);
    toast(`Continued archive: ${stageDef(state.currentStage).id} // Lv ${state.player.level}.`);
    return true;
  }
  function saveAndExitToMenu(){
    const ok=save(true);
    battle=null;
    storyActive=false;
    pendingStoryAfter=null;
    const story=$('storyOverlay'); if(story) story.classList.add('hidden');
    document.querySelectorAll('.overlay').forEach(o=>{ o.classList.add('hidden'); o.style.display=''; });
    showMenu();
    toast(ok ? 'Archive saved. Returned to main menu.' : 'Returned to main menu. Save failed.');
    return ok;
  }
  function syncContinueButton(){
    const btn=$('continueBtn');
    if(!btn) return;
    const raw=rawSaveFromStorage();
    const parsed=raw ? safeJsonParse(raw) : null;
    if(parsed?.player){
      const def=STAGE_DEFS[parsed.currentStage||'f001'] || STAGE_DEFS.f001;
      btn.disabled=false;
      btn.textContent=`Continue Operation // ${def.id} Lv ${parsed.player.level||1}`;
      const info=$('menuInfo');
      if(info && !info.classList.contains('ok')) info.textContent=`Saved archive found: ${def.id} // Level ${parsed.player.level||1}`;
      const status=$('saveStatus'); if(status) status.textContent=`Saved: ${def.id} // ${def.title} // Level ${parsed.player.level||1}`;
    } else {
      btn.disabled=false;
      btn.textContent='Continue Operation';
      const status=$('saveStatus'); if(status) status.textContent='No saved archive found on this browser yet.';
    }
  }
  window.addEventListener('beforeunload',()=>{ if(gameStarted) try{ save(true); }catch(err){} });
  document.addEventListener('visibilitychange',()=>{ if(document.hidden && gameStarted) try{ save(true); }catch(err){} });



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
    localStorage.setItem(SAVE_KEY, raw);
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
      migrateLoadedSave(imported);
      save(true);
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

  // v106: optional first-run tutorial cards. They are local-save aware and can be disabled in Configuration.
  function showTutorialTip(id,title,body,extra=''){
    if(!state || !state.flags) return;
    ensureSettings();
    if(state.settings.tutorialTips === false) return;
    state.flags.tutorialSeen ||= {};
    if(state.flags.tutorialSeen[id]) return;
    state.flags.tutorialSeen[id]=true;
    queueAutosave();
    $('tutorialTipOverlay')?.remove();
    const tip=document.createElement('div');
    tip.id='tutorialTipOverlay';
    tip.className='avos-crt tutorial-tip-overlay';
    tip.style.cssText='position:fixed;right:18px;bottom:18px;z-index:99999;width:min(380px,calc(100vw - 28px));background:rgba(5,9,14,.96);border:1px solid rgba(0,217,255,.55);box-shadow:0 0 28px rgba(0,217,255,.22);border-radius:14px;padding:14px;color:#eafcff;font-family:monospace;line-height:1.35;';
    tip.innerHTML=`<div style="font-size:11px;color:#70d7ff;letter-spacing:.12em;text-transform:uppercase;margin-bottom:4px">AVOS Tutorial Tip</div><h3 style="margin:0 0 7px;font-size:17px;color:#fff">${safeHtml(title)}</h3><p style="margin:0 0 8px;color:#cfefff">${safeHtml(body)}</p>${extra?`<p style="margin:0 0 10px;color:#96ffdf;font-size:12px">${safeHtml(extra)}</p>`:''}<div style="display:flex;gap:8px;flex-wrap:wrap"><button id="tutorialTipOk" style="cursor:pointer">Got it</button><button id="tutorialTipDisable" style="cursor:pointer">Turn Off Tips</button></div>`;
    document.body.appendChild(tip);
    $('tutorialTipOk').onclick=()=>tip.remove();
    $('tutorialTipDisable').onclick=()=>{ state.settings.tutorialTips=false; applySettings(); queueAutosave(); tip.remove(); toast('Tutorial tips disabled. Re-enable in Configuration.'); };
    setTimeout(()=>{ if(document.body.contains(tip)) tip.style.boxShadow='0 0 22px rgba(0,217,255,.16)'; }, 2200);
  }
  function resetTutorialTips(){
    ensureSettings();
    state.settings.tutorialTips=true;
    state.flags ||= {};
    state.flags.tutorialSeen={};
    applySettings();
    queueAutosave();
    toast('Tutorial tips reset.');
  }
  let introVideoActive=false; let introFadeTimer=null; let introForceMenuTimer=null; let introProgressGuardTimer=null; let bootGateFallbackTimer=null;
  function clearIntroVideoGuards(){
    if(introForceMenuTimer){ clearTimeout(introForceMenuTimer); introForceMenuTimer=null; }
    if(introProgressGuardTimer){ clearInterval(introProgressGuardTimer); introProgressGuardTimer=null; }
  }
  function clearBootGateFallback(){
    if(bootGateFallbackTimer){ clearTimeout(bootGateFallbackTimer); bootGateFallbackTimer=null; }
  }
  function bootGateIsWaiting(){
    const bootScreen=$('bootScreen');
    return !!bootScreen && !bootScreen.classList.contains('hidden') && !introVideoActive && !document.body.classList.contains('intro-video-active');
  }
  function armBootGateFallback(){
    clearBootGateFallback();
    bootGateFallbackTimer=setTimeout(()=>{
      if(bootGateIsWaiting()){
        toast('Intro gate timed out. Opening main menu.');
        forceIntroMenuRecovery();
      }
    }, 12000);
  }
  function forceIntroMenuRecovery(){
    syncBuildLabels();
    const bootScreen=$('bootScreen');
    const mainMenu=$('mainMenu');
    const video=$('introVideo');
    clearIntroVideoGuards();
    clearBootGateFallback();
    hideIntroAudioPrompt();
    introVideoActive=false;
    if(introFadeTimer){ clearTimeout(introFadeTimer); introFadeTimer=null; }
    try{ if(video){ video.pause(); video.controls=false; video.style.opacity=''; } }catch(err){}
    document.body.classList.remove('intro-video-active');
    if(bootScreen){
      bootScreen.classList.remove('intro-video-playing','intro-video-fading');
      bootScreen.classList.add('hidden');
    }
    hideAll();
    uiState.mode='menu';
    uiState.returnStack.length=0;
    document.body.classList.remove('game-active','intro-video-active');
    document.body.classList.add('fullscreen-mode');
    if(mainMenu) mainMenu.classList.remove('hidden');
    try{ AudioManager.play('pause'); }catch(err){}
  }
  function armIntroVideoGuards(video, prog){
    clearIntroVideoGuards();
    if(!video) return;
    const finishSafely=(fade=true)=>{
      if(!introVideoActive && !document.body.classList.contains('intro-video-active')) return;
      finishIntroVideo({fade});
    };
    video.onended=()=>finishSafely(true);
    video.onerror=()=>{ toast('Intro video missing or blocked. Opening main menu.'); finishIntroVideo({fade:false}); };
    video.onwebkitendfullscreen=()=>{};
    video.ontimeupdate=()=>{
      if(prog && Number.isFinite(video.duration) && video.duration>0){
        prog.style.width=Math.min(100, (video.currentTime/video.duration)*100)+'%';
      }
      if(introVideoActive && Number.isFinite(video.duration) && video.duration>0 && video.currentTime >= video.duration - 0.18){
        finishSafely(true);
      }
    };
    video.onloadedmetadata=()=>{
      if(introForceMenuTimer){ clearTimeout(introForceMenuTimer); introForceMenuTimer=null; }
      const dur=(Number.isFinite(video.duration) && video.duration>1) ? video.duration : 75;
      introForceMenuTimer=setTimeout(()=>finishSafely(true), Math.ceil((dur+2.5)*1000));
    };
    introProgressGuardTimer=setInterval(()=>{
      if(!introVideoActive) return;
      if(video.ended){ finishSafely(true); return; }
      if(Number.isFinite(video.duration) && video.duration>0 && video.currentTime >= video.duration - 0.25){
        finishSafely(true);
      }
    }, 300);
    introForceMenuTimer=setTimeout(()=>finishSafely(true), 90000);
  }

  function prepIntroVideoAudio(video){
    if(!video) return;
    try{
      video.muted=false;
      video.defaultMuted=false;
      video.volume=1;
      video.removeAttribute('muted');
      video.controls=false;
      video.playsInline=true;
      video.setAttribute('playsinline','true');
      video.setAttribute('webkit-playsinline','true');
    }catch(err){}
  }
  function hideIntroAudioPrompt(){
    const old=$('introAudioPrompt');
    if(old) old.remove();
  }
  function showIntroAudioPrompt(video){
    hideIntroAudioPrompt();
    const bootScreen=$('bootScreen');
    if(!bootScreen || !video) return;
    const prompt=document.createElement('button');
    prompt.id='introAudioPrompt';
    prompt.type='button';
    prompt.textContent='TAP TO START INTRO WITH SOUND';
    prompt.style.cssText='position:fixed;left:50%;bottom:max(72px,calc(env(safe-area-inset-bottom,0px) + 72px));transform:translateX(-50%);z-index:100005;width:min(420px,calc(100vw - 28px));min-height:44px;padding:11px 14px;border-radius:16px;border:1px solid rgba(0,217,255,.75);background:rgba(0,8,14,.94);color:#eaffff;font:800 clamp(10px,3.2vw,13px) monospace;letter-spacing:.06em;line-height:1.15;text-align:center;white-space:normal;box-shadow:0 0 22px rgba(0,217,255,.35);';
    prompt.onclick=(e)=>{
      e.preventDefault();
      e.stopPropagation();
      prepIntroVideoAudio(video);
      hideIntroAudioPrompt();
      introVideoActive=true;
      const p=video.play();
      if(p && p.then){
        p.then(()=>{ prepIntroVideoAudio(video); requestVideoFullscreen(video); }).catch(()=>{
          toast('Phone blocked video audio. Check silent mode, then tap START INTRO again.');
          introVideoActive=false;
          armBootGateFallback();
        });
      } else {
        prepIntroVideoAudio(video);
        requestVideoFullscreen(video);
      }
    };
    bootScreen.appendChild(prompt);
  }

  function boot(){
    uiState.mode='boot';
    bootDone=true;
    introVideoActive=false;
    AudioManager.stopMusic();
    document.body.classList.add('fullscreen-mode');
    const bootScreen=$('bootScreen');
    const video=$('introVideo');
    const gate=$('introVideoGate');
    const shade=$('introVideoShade');
    const prog=$('bootProgress')?.firstElementChild;
    syncBuildLabels();
    if(bootScreen) bootScreen.classList.remove('hidden');
    if(shade) shade.style.display='';
    if(prog) prog.style.width='0%';
    if(video){
      video.pause();
      try{ video.currentTime=0; }catch(err){}
      video.loop=false;
      video.controls=false;
      video.preload='auto';
      prepIntroVideoAudio(video);
      armIntroVideoGuards(video, prog);
      try{ video.load(); }catch(err){}
    }
    if(bootScreen) bootScreen.classList.remove('intro-video-playing','intro-video-fading');
    if(gate){ gate.classList.remove('hidden'); gate.style.display=''; gate.style.opacity=''; gate.style.pointerEvents=''; }
    armBootGateFallback();
  }
  function requestVideoFullscreen(video){
    document.body.classList.add('fullscreen-mode','intro-video-active');
    const target=$('bootScreen') || document.documentElement;
    try{
      if(target && target.requestFullscreen && !document.fullscreenElement){
        target.requestFullscreen().catch(()=>{});
      } else if(target && target.webkitRequestFullscreen){
        target.webkitRequestFullscreen();
      }
    }catch(err){}
  }
  function startIntroVideo(opts={}){
    const fromMenu=!!opts.fromMenu;
    const bootScreen=$('bootScreen');
    const video=$('introVideo');
    const gate=$('introVideoGate');
    const shade=$('introVideoShade');
    const prog=$('bootProgress')?.firstElementChild;
    if(fromMenu){
      hideAll();
      if(bootScreen) bootScreen.classList.remove('hidden');
      uiState.mode='boot';
    } else if(!bootScreen || bootScreen.classList.contains('hidden')) return;
    clearBootGateFallback();
    introVideoActive=true;
    AudioManager.stopMusic();
    document.body.classList.add('fullscreen-mode','intro-video-active');
    if(bootScreen) bootScreen.classList.remove('intro-video-fading');
    if(bootScreen) bootScreen.classList.add('intro-video-playing');
    if(gate){ gate.classList.add('hidden'); gate.style.display='none'; gate.style.opacity='0'; gate.style.pointerEvents='none'; }
    if(shade){ shade.classList.add('hidden'); shade.style.display='none'; shade.style.opacity='0'; }
    if(prog) prog.style.width='0%';
    if(!video){ finishIntroVideo(); return; }
    video.controls=false;
    video.loop=false;
    prepIntroVideoAudio(video);
    hideIntroAudioPrompt();
    try{ video.currentTime=0; }catch(err){}
    armIntroVideoGuards(video, prog);
    const tryPlay=()=>{
      prepIntroVideoAudio(video);
      const p=video.play();
      if(p && p.catch){
        p.then(()=>{
          prepIntroVideoAudio(video);
          requestVideoFullscreen(video);
        }).catch(()=>{
          // Do not fall back to muted playback on phones. Ask for one more direct tap
          // so mobile browsers can grant audio permission.
          introVideoActive=false;
          showIntroAudioPrompt(video);
          toast('Tap the sound button to start the intro with audio.');
        });
      } else {
        prepIntroVideoAudio(video);
        requestVideoFullscreen(video);
      }
    };
    tryPlay();
  }
  function replayIntroVideo(){ startIntroVideo({fromMenu:true}); }
  function exitIntroFullscreen(){
    try{
      if(document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(()=>{});
      else if(document.webkitFullscreenElement && document.webkitExitFullscreen) document.webkitExitFullscreen();
    }catch(err){}
  }
  function finishIntroVideo(opts={}){
    const bootScreen=$('bootScreen');
    const video=$('introVideo');
    const gate=$('introVideoGate');
    const shade=$('introVideoShade');
    const shouldFade=!!opts.fade;
    clearIntroVideoGuards();
    if(introFadeTimer){ clearTimeout(introFadeTimer); introFadeTimer=null; }

    if(shouldFade && bootScreen && !bootScreen.classList.contains('hidden')){
      if(video) video.controls=false;
      bootScreen.classList.add('intro-video-fading');
      introFadeTimer=setTimeout(()=>finishIntroVideo({fade:false}), 750);
      // Last-resort recovery if a browser freezes after ended/fullscreen.
      introForceMenuTimer=setTimeout(forceIntroMenuRecovery, 1400);
      return;
    }

    introVideoActive=false;
    exitIntroFullscreen();
    document.body.classList.remove('intro-video-active');
    if(video){
      try{ video.pause(); }catch(err){}
      video.controls=false;
      video.muted=false;
      video.style.opacity='';
      try{ video.currentTime=0; }catch(err){}
    }
    if(bootScreen){
      bootScreen.classList.remove('intro-video-playing','intro-video-fading');
      bootScreen.classList.add('hidden');
    }
    if(gate){ gate.classList.remove('hidden'); gate.style.display=''; gate.style.opacity=''; gate.style.pointerEvents=''; }
    if(shade){ shade.classList.remove('hidden'); shade.style.display=''; shade.style.opacity=''; }
    showMenu();
    // Double-check the menu actually became visible.
    setTimeout(()=>{
      const menu=$('mainMenu');
      if(menu && menu.classList.contains('hidden')) forceIntroMenuRecovery();
    }, 120);
  }
  function stopIntroVideoForGame(){
    introVideoActive=false;
    if(introFadeTimer){ clearTimeout(introFadeTimer); introFadeTimer=null; }
    document.body.classList.remove('intro-video-active');
    const video=$('introVideo');
    const bootScreen=$('bootScreen');
    const gate=$('introVideoGate');
    const shade=$('introVideoShade');
    if(video){
      try{ video.pause(); }catch(err){}
      video.controls=false;
      video.muted=false;
      video.style.opacity='';
      try{ video.currentTime=0; }catch(err){}
    }
    if(bootScreen){
      bootScreen.classList.remove('intro-video-playing','intro-video-fading');
      bootScreen.classList.add('hidden');
    }
    if(gate){ gate.classList.remove('hidden'); gate.style.display=''; gate.style.opacity=''; gate.style.pointerEvents=''; }
    if(shade){ shade.classList.remove('hidden'); shade.style.display=''; shade.style.opacity=''; }
  }
  function requestNativeFullscreen(){
    // Use the whole document as the fullscreen target so body-level overlays
    // like story dialog, tutorial tips, menus, and battle panels remain visible.
    // Targeting #app hid storyOverlay outside the fullscreen subtree.
    document.body.classList.add('fullscreen-mode');
    try{
      const target=document.documentElement;
      const current=document.fullscreenElement || document.webkitFullscreenElement;
      const open=()=>{ try{ if(target.requestFullscreen) target.requestFullscreen().catch(()=>{}); else if(target.webkitRequestFullscreen) target.webkitRequestFullscreen(); }catch(err){} };
      if(current && current !== target){
        if(document.exitFullscreen) document.exitFullscreen().then(open).catch(()=>{});
        else if(document.webkitExitFullscreen){ document.webkitExitFullscreen(); setTimeout(open,80); }
        return;
      }
      if(!current) open();
    }catch(err){}
  }
  function showMenu(){syncBuildLabels(); syncContinueButton(); setBattleMobileMode(false); hideAll(); uiState.mode='menu'; uiState.returnStack.length=0; document.body.classList.remove('game-active','intro-video-active'); document.body.classList.add('fullscreen-mode'); $('mainMenu').classList.remove('hidden'); AudioManager.play('pause');}
  function startOpeningStorySequence(){
    const afterIntro=()=>{
      ensureStoryFlags();
      state.flags.storySeen.intro=true;
      save(true);
      requestNativeFullscreen();
      try{ pulseObjective(currentObjectiveText()); }catch(err){}
      try{ showTutorialTip('move-route','Movement + Route Beacon','Move with WASD / arrow keys, mobile arrows, or a controller. Follow the glowing route line and minimap path to the next objective.','Press N to ping the target. Press E near Fermilat to talk.'); }catch(err){}
    };
    showOpeningStoryRoot(afterIntro);
  }

  function startGame(fresh=false){
    syncBuildLabels(); setBattleMobileMode(false);
    if(fresh) return newGameRootStart();
    ensureSaveShape(); invalidateCollisionRegion(); normalizeLiveMap(true); repairMissionRoutesForCurrentStage(); clampPlayerToMap(); gameStarted=true; ensureProgression();
    hideAll(); uiState.mode='game'; uiState.returnStack.length=0;
    document.body.classList.add('game-active','fullscreen-mode'); document.body.dataset.stage=stageDef().key;
    ensureFullscreenUi(); ensureMobileActionPad(); setMobilePlayMode(); stopIntroVideoForGame();
    $('app').classList.remove('hidden'); requestNativeFullscreen(); canvas.focus({preventScroll:true});
    renderAll(); unlockRadioTrack(musicKeyForStage()); AudioManager.play(activeMusicForState());
    save(true); setTimeout(()=>pulseObjective(currentObjectiveText()), 240);
  }
  function hideAll(){['bootScreen','mainMenu','app'].forEach(id=>$(id)?.classList.add('hidden')); document.querySelectorAll('.overlay').forEach(o=>o.classList.add('hidden')); $('preBattleOverlay')?.classList.add('hidden');}
  function rowAt(y){ return state?.map?.[y] || null; }
  function mapHeight(){ return state?.map?.length || 0; }
  function mapWidth(){ return Math.max(0, ...(state?.map || []).map(r => r ? r.length : 0)); }
  function rowLength(y){ const row=rowAt(y); return row ? row.length : 0; }

  let collisionRegionCache = {stage:null, map:null, set:null, start:null, width:0, height:0};
  let normalizedMapRef = null;
  let controllerStepLockAt = 0;

  function resetCollisionCacheOnly(){
    collisionRegionCache = {stage:null, map:null, set:null, start:null, width:0, height:0};
  }
  function invalidateCollisionRegion(){
    normalizedMapRef = null;
    resetCollisionCacheOnly();
  }
  function stageManualBlockAt(x,y,key=currentStageKey()){
    // V148: manual collision blockers for known F-001 dead spots.
    // Supports both the older compact F-001 and the expanded V118 F-001 map.
    if(key==='f001'){
      // Compact map patches from V144-V146.
      if(y>=16 && y<=19 && x>=19 && x<=22) return true;
      if(y>=18 && y<=19 && x>=32 && x<=38) return true;
      if(y>=21 && y<=23 && x>=16 && x<=26) return true;
      if(y===20 && x>=21 && x<=26) return true;

      // Expanded V118 map: reported Fermilat / bench / cyan-corner dead shelf.
      // This was the real active layout after V118 overwrote the early compact map.
      if(y>=27 && y<=28 && x>=35 && x<=48) return true;
      if(y>=25 && y<=26 && x>=47 && x<=48) return true;
      // Keep the boss yard open, but block its top decorative shelf.
      if(y>=27 && y<=28 && x>=55 && x<=68) return true;
    }
    return false;
  }

  function normalizeLiveMap(force=false){
    if(!state?.map || !Array.isArray(state.map)) return false;
    if(!force && normalizedMapRef === state.map) return false;

    const raw=state.map;
    const width=Math.max(1, ...raw.map(r => {
      if(Array.isArray(r)) return r.length;
      return String(r || '').length;
    }));
    const height=raw.length;
    let changed=false;
    const out=new Array(height);

    for(let y=0;y<height;y++){
      const original=raw[y];
      let str=Array.isArray(original) ? original.join('') : String(original || '');
      let rowChanged=!Array.isArray(original) || str.length!==width;
      if(str.length < width) str=str.padEnd(width,'#');
      if(str.length > width) str=str.slice(0,width);
      const chars=str.split('');

      for(let x=0;x<width;x++){
        const old=chars[x];
        if(y<=1 || y>=height-2 || x<=1 || x>=width-2){
          chars[x]='#';
        } else if(stageManualBlockAt(x,y)){
          chars[x]='#';
        } else if(!['.','P','S','C','H','L','E','B','X','D','#'].includes(chars[x])){
          chars[x]='#';
        }
        if(chars[x]!==old) rowChanged=true;
      }

      if(rowChanged) changed=true;
      out[y]=rowChanged ? chars : original;
    }

    if(changed){
      state.map=out;
      resetCollisionCacheOnly();
    }
    normalizedMapRef=state.map;
    return changed;
  }

  function inMapBounds(x,y){
    return Number.isInteger(x) && Number.isInteger(y) && y >= 0 && x >= 0 && y < mapHeight() && x < rowLength(y);
  }
  function isOuterMapEdge(x,y){
    return !inMapBounds(x,y) || x <= 1 || y <= 1 || y >= mapHeight()-2 || x >= rowLength(y)-2;
  }
  function tileAt(x,y){
    return inMapBounds(x,y) ? (rowAt(y)?.[x] ?? '#') : '#';
  }
  function setRowChar(y,x,v){
    normalizeLiveMap();
    if(!inMapBounds(x,y)) return false;
    if(isOuterMapEdge(x,y)) v='#';
    const safe=['.','P','S','C','H','L','E','B','X','D','#'].includes(v) ? v : '#';
    const row=rowAt(y);
    if(Array.isArray(row)) row[x]=safe;
    else state.map[y]=String(row || '').slice(0,x) + safe + String(row || '').slice(x+1);
    resetCollisionCacheOnly();
    return true;
  }
  function setTile(x,y,v){
    return setRowChar(y,x,v);
  }
  function routeRepairTileKey(x,y){ return `${x},${y}`; }
  function missionRouteTargets(){
    const codes=new Set(['S','E','B','X']);
    const targets=[];
    if(!state?.map) return targets;
    for(let y=2;y<mapHeight()-2;y++){
      const row=rowAt(y);
      const len=rowLength(y);
      for(let x=2;x<len-2;x++){
        const c=Array.isArray(row) ? row[x] : String(row||'')[x];
        if(codes.has(c)) targets.push({x,y,c});
      }
    }
    return targets;
  }
  function routeRepairPassableAt(x,y,{doors=false, walls=false}={}){
    if(!inMapBounds(x,y) || isOuterMapEdge(x,y)) return false;
    const c=tileAt(x,y);
    if(c==='#') return !!walls;
    if(c==='D') return !!doors;
    return isRegionPassableTile(c);
  }
  function routePathTo(target,{doors=false,walls=false}={}){
    const start=fallbackRegionStart();
    const key=routeRepairTileKey;
    const seen=new Set();
    const q=[];
    const prev=new Map();

    if(routeRepairPassableAt(start.x,start.y,{doors,walls})){
      seen.add(key(start.x,start.y));
      q.push(start);
    }

    while(q.length){
      const cur=q.shift();
      if(cur.x===target.x && cur.y===target.y){
        const path=[];
        let p=cur;
        while(p){
          path.push(p);
          p=prev.get(key(p.x,p.y));
        }
        return path.reverse();
      }
      const preferred=[
        [Math.sign(target.x-cur.x),0],
        [0,Math.sign(target.y-cur.y)],
        [1,0],[-1,0],[0,1],[0,-1]
      ];
      for(const [dx,dy] of preferred){
        if(!dx && !dy) continue;
        const nx=cur.x+dx, ny=cur.y+dy, k=key(nx,ny);
        if(seen.has(k)) continue;
        if(!routeRepairPassableAt(nx,ny,{doors,walls})) continue;
        seen.add(k);
        prev.set(k,cur);
        q.push({x:nx,y:ny});
      }
    }
    return null;
  }
  function routeReachableTo(target,{doors=false,walls=false}={}){
    return !!routePathTo(target,{doors,walls});
  }
  function routeProtectedEventTile(x,y,target){
    if(target && x===target.x && y===target.y) return true;
    return ['S','E','B','X','C','H','L'].includes(tileAt(x,y));
  }
  function routeOpenTile(x,y,target=null){
    if(!inMapBounds(x,y) || isOuterMapEdge(x,y)) return 0;
    const c=tileAt(x,y);
    if(routeProtectedEventTile(x,y,target)) return 0;
    if(c==='#' || c==='D'){
      setTile(x,y,'.');
      return 1;
    }
    return 0;
  }
  function routeCarvePath(path,target=null){
    let carved=0;
    if(!path || !path.length) return carved;
    path.forEach((p,i)=>{
      if(i===0) return;
      carved += routeOpenTile(p.x,p.y,target);
    });
    return carved;
  }
  function routeGateIndexForPath(path,target){
    if(!path || path.length<4) return -1;
    const startAt=Math.max(1, Math.floor(path.length*.45));
    const endAt=Math.max(startAt, path.length-2);
    for(let i=endAt;i>=startAt;i--){
      const p=path[i];
      if(!p || routeProtectedEventTile(p.x,p.y,target)) continue;
      if(isOuterMapEdge(p.x,p.y)) continue;
      return i;
    }
    for(let i=1;i<path.length-1;i++){
      const p=path[i];
      if(!routeProtectedEventTile(p.x,p.y,target) && !isOuterMapEdge(p.x,p.y)) return i;
    }
    return -1;
  }
  function routePlaceBossGate(path,target){
    const idx=routeGateIndexForPath(path,target);
    if(idx<0) return false;
    const gate=path[idx];
    const before=path[Math.max(0,idx-1)];
    const after=path[Math.min(path.length-1,idx+1)];

    // Make sure both sides of the gate have floor, then put the gate itself back.
    if(before && !routeProtectedEventTile(before.x,before.y,target) && tileAt(before.x,before.y)==='#') setTile(before.x,before.y,'.');
    if(after && !routeProtectedEventTile(after.x,after.y,target) && tileAt(after.x,after.y)==='#') setTile(after.x,after.y,'.');
    setTile(gate.x,gate.y,'D');
    return true;
  }
  function routeExistingReachableDoorNear(target){
    const doors=[];
    for(let y=2;y<mapHeight()-2;y++){
      for(let x=2;x<rowLength(y)-2;x++){
        if(tileAt(x,y)==='D'){
          const dist=Math.abs(x-target.x)+Math.abs(y-target.y);
          doors.push({x,y,dist});
        }
      }
    }
    doors.sort((a,b)=>a.dist-b.dist);
    return doors.find(d=>routeReachableTo(d,{doors:true,walls:false}) || routeReachableTo(d,{doors:false,walls:false})) || null;
  }
  function routeRepairBasicTarget(target){
    if(routeReachableTo(target,{doors:false,walls:false})) return 0;
    const path=routePathTo(target,{doors:true,walls:true});
    if(!path) return 0;
    return routeCarvePath(path,target);
  }
  function routeBossGateForTarget(target){
    const doors=[];
    for(let y=2;y<mapHeight()-2;y++){
      for(let x=2;x<rowLength(y)-2;x++){
        if(tileAt(x,y)==='D'){
          const dist=Math.abs(x-target.x)+Math.abs(y-target.y);
          doors.push({x,y,dist});
        }
      }
    }
    doors.sort((a,b)=>a.dist-b.dist);
    return doors[0] || null;
  }
  function routeRepairBossTarget(target){
    const bossUnlocked=!!(state.flags?.bossUnlocked || state.flags?.bossDefeated || state.flags?.chapterComplete);
    // F-001 has a hand-authored hard fix above. Do not let generic wall-carving
    // create another bypass around its locked boss gate.
    if(currentStageKey()==='f001') return 0;
    let carved=0;

    if(bossUnlocked){
      const path=routePathTo(target,{doors:true,walls:true});
      if(path) carved += routeCarvePath(path,target);
      return carved;
    }

    // Locked state: open the approach to a real D gate, but do not open the gate.
    let gate=routeBossGateForTarget(target);

    if(!gate){
      const path=routePathTo(target,{doors:true,walls:true});
      if(!path) return 0;
      carved += routeCarvePath(path,target);
      routePlaceBossGate(path,target);
      gate=routeBossGateForTarget(target);
      if(gate) carved++;
    }

    if(gate){
      const pathToGate=routePathTo(gate,{doors:true,walls:true});
      if(pathToGate) carved += routeCarvePath(pathToGate,gate);

      // Make the boss side usable after the gate opens. Keep the gate itself as D.
      const pathToBoss=routePathTo(target,{doors:true,walls:true});
      if(pathToBoss) carved += routeCarvePath(pathToBoss,target);
      setTile(gate.x,gate.y,'D');

      // If a bypass exists without touching a door, put the gate directly on that bypass.
      const bypass=routePathTo(target,{doors:false,walls:false});
      if(bypass && bypass.length>3){
        routePlaceBossGate(bypass,target);
        carved++;
      }
    }
    return carved;
  }

  function forceOpenTile(x,y){
    if(!inMapBounds(x,y) || isOuterMapEdge(x,y)) return 0;
    const c=tileAt(x,y);
    if(['S','E','B','X','C','H','L'].includes(c)) return 0;
    if(c!=='.'){
      setTile(x,y,'.');
      return 1;
    }
    return 0;
  }
  function forceGateTile(x,y){
    if(!inMapBounds(x,y) || isOuterMapEdge(x,y)) return 0;
    const c=tileAt(x,y);
    if(['S','E','B','X','C','H','L'].includes(c)) return 0;
    if(state.flags?.bossUnlocked || state.flags?.bossDefeated || state.flags?.chapterComplete){
      return forceOpenTile(x,y);
    }
    if(c!=='D'){
      setTile(x,y,'D');
      return 1;
    }
    return 0;
  }
  function hardFixF001BossWing(){
    if(currentStageKey()!=='f001' || !state?.map) return 0;
    let changed=0;
    // Expanded F-001 hard fix: open the approach to the last/boss wing,
    // then lock it with one real gate until the anomaly requirement is met.
    for(let x=49;x<=54;x++) changed += forceOpenTile(x,25);
    for(let y=26;y<=30;y++) changed += forceOpenTile(54,y);
    changed += forceGateTile(54,31);
    for(let x=55;x<=67;x++) changed += forceOpenTile(x,31);
    for(let y=32;y<=36;y++){
      for(let x=55;x<=67;x++){
        changed += forceOpenTile(x,y);
      }
    }
    // Remove the old multi-door trap below the main gate.
    changed += forceOpenTile(54,32);
    changed += forceOpenTile(54,33);
    return changed;
  }
  function hardFixKnownBossRoutes(){
    let changed=0;
    changed += hardFixF001BossWing();
    return changed;
  }

  function repairMissionRoutesForCurrentStage(forceLog=false){
    if(!state?.map) return false;
    normalizeLiveMap();
    let carved=0;
    carved += hardFixKnownBossRoutes();
    const targets=missionRouteTargets();
    const normalTargets=targets.filter(t=>t.c==='S' || t.c==='E');
    const bossTargets=targets.filter(t=>t.c==='B');
    const exitTargets=targets.filter(t=>t.c==='X');

    normalTargets.forEach(target=>{ carved += routeRepairBasicTarget(target); });
    bossTargets.forEach(target=>{ carved += routeRepairBossTarget(target); });

    // Exit should be reachable after the boss gate opens, but should not create a bypass around the locked gate.
    if(state.flags?.bossUnlocked || state.flags?.bossDefeated || state.flags?.chapterComplete){
      exitTargets.forEach(target=>{ carved += routeRepairBasicTarget(target); });
    }

    if(carved>0){
      invalidateCollisionRegion();
      normalizeLiveMap();
      resetCollisionCacheOnly();
      log(`Route audit repaired ${carved} tile${carved===1?'':'s'} on ${stageDef().id}. Boss route is now locked by a gate until requirements are met.`);
      if(forceLog) toast(`${stageDef().id} boss route fixed with a locked gate.`);
      return true;
    }

    if(forceLog) log(`${stageDef().id} route audit passed: boss gate and mission route are valid.`);
    return false;
  }
  function sanitizeLiveMapEdges(){ return normalizeLiveMap(true); }
  function isKnownMapTile(c){ return ['.','P','S','C','H','L','E','B','X','D','#'].includes(c); }
  function isEventWalkableTile(c){ return ['.','P','S','C','H','L','E','B','X'].includes(c); }
  function isRegionPassableTile(c){ return ['.','P','S','C','H','L','E','B','X','D'].includes(c); }
  function isBlocked(c){ return !isKnownMapTile(c) || c==='#' || c==='D'; }

  function rawSpawnForStage(key=currentStageKey()){
    const parsed=parseStageMap(key);
    return {x:parsed.px, y:parsed.py};
  }
  function regionPassableAt(x,y){
    if(!inMapBounds(x,y) || isOuterMapEdge(x,y)) return false;
    const c=tileAt(x,y);
    if(!isRegionPassableTile(c)) return false;
    // 4-neighbor void guard stops row seam exits without making tight routes impossible.
    for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
      if(!inMapBounds(x+dx,y+dy)) return false;
    }
    return true;
  }
  function fallbackRegionStart(){
    const spawn=rawSpawnForStage();
    if(regionPassableAt(spawn.x,spawn.y)) return spawn;
    for(let y=2;y<mapHeight()-2;y++){
      for(let x=2;x<rowLength(y)-2;x++){
        if(regionPassableAt(x,y)) return {x,y};
      }
    }
    return {x:2,y:2};
  }
  function collisionRegion(){
    normalizeLiveMap();
    if(collisionRegionCache.stage===currentStageKey() && collisionRegionCache.map===state.map && collisionRegionCache.set && collisionRegionCache.width===mapWidth() && collisionRegionCache.height===mapHeight()){
      return collisionRegionCache;
    }

    const start=fallbackRegionStart();
    const seen=new Set();
    const q=[];
    const key=(x,y)=>`${x},${y}`;

    if(regionPassableAt(start.x,start.y)){
      seen.add(key(start.x,start.y));
      q.push(start);
    }

    while(q.length){
      const cur=q.shift();
      for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
        const nx=cur.x+dx, ny=cur.y+dy, k=key(nx,ny);
        if(seen.has(k)) continue;
        if(!regionPassableAt(nx,ny)) continue;
        seen.add(k);
        q.push({x:nx,y:ny});
      }
    }

    collisionRegionCache = {stage:currentStageKey(), map:state.map, set:seen, start, width:mapWidth(), height:mapHeight()};
    return collisionRegionCache;
  }
  function canStandAt(x,y){
    if(!regionPassableAt(x,y)) return false;
    if(!isEventWalkableTile(tileAt(x,y))) return false;
    return collisionRegion().set.has(`${x},${y}`);
  }
  function findSafeSpawn(){
    const region=collisionRegion();
    if(region.start && canStandAt(region.start.x, region.start.y)) return {...region.start};
    for(const k of region.set){
      const [x,y]=k.split(',').map(Number);
      if(canStandAt(x,y)) return {x,y};
    }
    return {x:2,y:2};
  }
  function clampPlayerToMap(){
    if(!state?.player || !state?.map) return false;
    normalizeLiveMap();
    const x=Math.floor(Number(state.player.x));
    const y=Math.floor(Number(state.player.y));
    if(canStandAt(x,y)){
      state.player.x=x; state.player.y=y;
      return false;
    }
    const safe=findSafeSpawn();
    state.player.x=safe.x;
    state.player.y=safe.y;
    state.visited ||= {};
    state.visited[`${safe.x},${safe.y}`]=1;
    log('AVOS collision tether restored Vyra to the playable route.');
    toast('Boundary lock restored position.');
    return true;
  }

  // v184: Vector Lockdown now behaves like a short roguelike survival room.
  function ensureRogueHud(){ let hud=$('vectorLockdownHud'); if(!hud){ hud=document.createElement('div'); hud.id='vectorLockdownHud'; hud.className='vector-lockdown-hud hidden'; document.body.appendChild(hud); } if(!$('lockdownTimer')){ hud.innerHTML='<div class="lockdown-card avos-crt"><div id="lockdownKicker" class="record-kicker">VECTOR LOCKDOWN</div><h2 id="lockdownTimer">60s</h2><p id="lockdownText">Room sealed. Auto-fire online.</p><div id="lockdownHpWrap" style="margin:8px 0 10px"><div style="display:flex;justify-content:space-between;font:700 11px monospace;letter-spacing:.06em"><span>OPERATOR HP</span><span id="lockdownHpText">--/--</span></div><div style="height:10px;border:1px solid rgba(255,255,255,.25);background:rgba(0,0,0,.55);border-radius:999px;overflow:hidden"><span id="lockdownHpBar" style="display:block;height:100%;width:100%;background:linear-gradient(90deg,#37f7a5,#ffe36e,#ff3048);transition:width .18s linear"></span></div></div><div id="lockdownRoll" style="display:none;margin:8px 0;padding:8px 10px;border:1px solid rgba(255,255,255,.22);border-radius:10px;background:rgba(0,0,0,.58);font:800 12px monospace;letter-spacing:.08em;text-transform:uppercase"></div><div id="lockdownStats" class="lockdown-stats"></div><div id="lockdownUpgrades" class="lockdown-upgrades"></div></div>'; } return hud; }
  const ROGUE_UPGRADES = [
    {type:'buff', name:'Split Chamber', desc:'+1 projectile per volley', apply:e=>e.projectileCount = Math.min(12,(e.projectileCount||1)+1)},
    {type:'buff', name:'Ash Rifling', desc:'+25% projectile damage', apply:e=>e.projectileDamage = Math.ceil(e.projectileDamage*1.25)},
    {type:'buff', name:'Rust Accelerator', desc:'+18% fire rate', apply:e=>e.fireRate = Math.max(220, Math.floor(e.fireRate*.82))},
    {type:'buff', name:'Vector Velocity', desc:'+20% projectile speed', apply:e=>e.projectileSpeed += 1.8},
    {type:'buff', name:'Piercing Static', desc:'+1 enemy pierce', apply:e=>e.pierce = Math.min(4,(e.pierce||0)+1)},
    {type:'buff', name:'Twin Feed', desc:'+2 projectiles per volley', apply:e=>e.projectileCount = Math.min(12,(e.projectileCount||1)+2)},
    {type:'buff', name:'Core-Tipped Rounds', desc:'+35% projectile damage', apply:e=>e.projectileDamage = Math.ceil(e.projectileDamage*1.35)},
    {type:'buff', name:'Scatter Vector', desc:'+3 projectiles, slight damage tradeoff', apply:e=>{e.projectileCount = Math.min(12,(e.projectileCount||1)+3); e.projectileDamage = Math.max(6, Math.floor(e.projectileDamage*.90));}},
    {type:'buff', name:'Overcharged Barrel', desc:'+20% projectile damage and speed', apply:e=>{e.projectileDamage=Math.ceil(e.projectileDamage*1.20); e.projectileSpeed+=1.4;}},
    {type:'buff', name:'Rapid Vector Feed', desc:'+12% fire rate and +1 projectile', apply:e=>{e.fireRate=Math.max(220,Math.floor(e.fireRate*.88)); e.projectileCount=Math.min(12,(e.projectileCount||1)+1);}},
    {type:'debuff', name:'Jammed Barrel', desc:'-18% fire rate', apply:e=>e.fireRate=Math.min(1050,Math.floor((e.fireRate||620)*1.18))},
    {type:'debuff', name:'Cracked Rounds', desc:'-15% projectile damage', apply:e=>e.projectileDamage=Math.max(5,Math.floor((e.projectileDamage||10)*.85))},
    {type:'debuff', name:'Magnetic Drag', desc:'-15% projectile speed', apply:e=>e.projectileSpeed=Math.max(3.8,(e.projectileSpeed||7.2)*.85)},
    {type:'debuff', name:'Vector Recoil', desc:'-1 projectile per volley', apply:e=>e.projectileCount=Math.max(1,(e.projectileCount||1)-1)},
    {type:'debuff', name:'Brittle Static', desc:'-1 pierce stack', apply:e=>e.pierce=Math.max(0,(e.pierce||0)-1)},
    {type:'debuff', name:'Hostile Surge', desc:'monsters spawn sooner', apply:e=>{e.spawnDelay=Math.max(1000,Math.floor((e.spawnDelay||2600)*.72)); e.nextSpawnAt=Math.min(e.nextSpawnAt||Date.now()+1200, Date.now()+900);}}
  ];
  function chooseLockdownModifier(e){
    const elapsed=(Date.now()-(e.startedAt||Date.now()))/(e.duration||60000);
    const debuffChance=Math.min(.55,.22+elapsed*.33);
    const wantDebuff=Math.random()<debuffChance;
    const pool=ROGUE_UPGRADES.filter(u=>u.type===(wantDebuff?'debuff':'buff') && !(e.upgradeHistory||[]).some(h=>h.name===u.name));
    return pool[Math.floor(Math.random()*pool.length)] || ROGUE_UPGRADES[Math.floor(Math.random()*ROGUE_UPGRADES.length)];
  }
  function showLockdownRoll(mod){
    const el=$('lockdownRoll');
    if(!el || !mod) return;
    el.style.display='block';
    el.style.borderColor=mod.type==='debuff'?'rgba(255,48,72,.85)':'rgba(55,247,165,.8)';
    el.style.color=mod.type==='debuff'?'#ff6b7c':'#7fffd4';
    const pool=ROGUE_UPGRADES.map(u=>u.name);
    let ticks=0;
    if(window._avLockdownRollTimer) clearInterval(window._avLockdownRollTimer);
    window._avLockdownRollTimer=setInterval(()=>{
      ticks++;
      const label=ticks<7 ? pool[Math.floor(Math.random()*pool.length)] : mod.name;
      el.innerHTML=`<div style="opacity:.72;font-size:10px">${ticks<7?'ROLLING MODIFIER':'LOCKED MODIFIER'}</div><div>${safeHtml(label)}</div><div style="opacity:.85;font-size:10px;margin-top:2px">${ticks<7?'???':safeHtml(mod.desc)}</div>`;
      if(ticks>=7){ clearInterval(window._avLockdownRollTimer); window._avLockdownRollTimer=null; setTimeout(()=>{ if(el) el.style.display='none'; },2200); }
    },110);
  }
  function vectorLockdownBlocked(){ return !gameStarted || !!battle || !!storyActive || !!state.rogueEvent?.active || !!state.rogueWarning?.active; }
  function lockdownMobileCompact(){ return !!(window.matchMedia && (window.matchMedia('(max-width:720px)').matches || window.matchMedia('(pointer: coarse)').matches)); }
  function maybeTriggerVectorLockdown(){ if(vectorLockdownBlocked()) return; const now=Date.now(); if(now-(state.rogueLastAt||0)<70000) return; if(Math.random()>0.085) return; startVectorLockdownWarning(); }
  function startVectorLockdownWarning(){ if(vectorLockdownBlocked()) return; const now=Date.now(); const arena=lockdownArenaBounds(state.player.x,state.player.y); state.rogueWarning={active:true,startedAt:now,endsAt:now+10000,arena,center:{x:state.player.x,y:state.player.y}}; state.rogueLastAt=now; document.body.classList.add('vector-lockdown-warning'); log('VECTOR SURGE WARNING: lockdown begins in 10 seconds. Move to a safe spot inside the highlighted arena.'); pulseObjective('WARNING: Vector Lockdown begins in 10 seconds. Get ready.'); ensureRogueHud().classList.remove('hidden'); updateVectorLockdownWarningHud(); if(window._avLockdownWarningTimer) clearInterval(window._avLockdownWarningTimer); window._avLockdownWarningTimer=setInterval(tickVectorLockdownWarning,250); renderAll(); }
  function cancelVectorLockdownWarning(reason='Vector warning cancelled.'){ if(window._avLockdownWarningTimer) clearInterval(window._avLockdownWarningTimer); window._avLockdownWarningTimer=null; document.body.classList.remove('vector-lockdown-warning'); if(state.rogueWarning?.active) log(reason); state.rogueWarning={active:false,cancelledAt:Date.now()}; ensureRogueHud().classList.add('hidden'); renderAll(); }
  function tickVectorLockdownWarning(){ const w=state.rogueWarning; if(!w?.active){ if(window._avLockdownWarningTimer){ clearInterval(window._avLockdownWarningTimer); window._avLockdownWarningTimer=null; } return; } if(!gameStarted || battle || storyActive){ cancelVectorLockdownWarning('Vector surge cancelled because another encounter opened.'); return; } updateVectorLockdownWarningHud(); if(Date.now()>=w.endsAt){ if(window._avLockdownWarningTimer) clearInterval(window._avLockdownWarningTimer); window._avLockdownWarningTimer=null; document.body.classList.remove('vector-lockdown-warning'); const arena=w.arena || lockdownArenaBounds(state.player.x,state.player.y); state.rogueWarning={active:false}; startVectorLockdown(arena); } else { render(); } }
  function updateLockdownHpHud(){ const caps=combatStatBlock(); const max=Math.max(1,caps.maxHp||state.player.maxHp||1); const hp=Math.max(0,Math.min(max,state.player.hp||0)); if($('lockdownHpText')) $('lockdownHpText').textContent=`${Math.ceil(hp)}/${max}`; if($('lockdownHpBar')) $('lockdownHpBar').style.width=`${Math.max(0,Math.min(100,100*hp/max))}%`; }
  function updateVectorLockdownWarningHud(){ const w=state.rogueWarning; const hud=ensureRogueHud(); if(!w?.active){ hud.classList.add('hidden'); return; } updateLockdownHpHud(); const compact=lockdownMobileCompact(); const left=Math.max(0,Math.ceil((w.endsAt-Date.now())/1000)); if($('lockdownKicker')) $('lockdownKicker').textContent=compact?'SURGE WARNING':'VECTOR SURGE WARNING'; $('lockdownTimer').textContent=`${left}s`; $('lockdownText').textContent=compact?'Lockdown forming. Stay inside the yellow warning zone.':'Lockdown forming. A sealed arena will activate when the countdown ends.'; if($('lockdownStats')) $('lockdownStats').innerHTML=compact?'<span>Move</span><span>Auto-fire</span><span>Max 25</span>':'<span>Move now</span><span>Auto-fire starts soon</span><span>Max 25 monsters</span>'; if($('lockdownUpgrades')) $('lockdownUpgrades').innerHTML=compact?'<span>Buff/debuff rolls start after lockdown.</span>':'<span>Projectile upgrades begin every 5 seconds after lockdown starts.</span>'; hud.classList.remove('hidden'); }
  function lockdownArenaBounds(cx=state.player.x, cy=state.player.y){ const r=(window.matchMedia && window.matchMedia('(max-width:720px)').matches)?3:4; return {minX:Math.max(1,cx-r), maxX:Math.min(mapWidth()-2,cx+r), minY:Math.max(1,cy-r), maxY:Math.min(mapHeight()-2,cy+r)}; }
  function pointInLockdownArena(x,y){ const e=state.rogueEvent; if(!e?.active || !e.arena) return true; return x>=e.arena.minX && x<=e.arena.maxX && y>=e.arena.minY && y<=e.arena.maxY; }
  function lockdownMonsterPool(){
    const stage=currentStageKey();
    const slotMap=ENCOUNTER_SLOTS[stage] || ENCOUNTER_SLOTS.f001 || {};
    const records=Object.values(slotMap).filter(s=>s && s.type==='anomaly').map(s=>importedAnomalyRoster[s.index]).filter(Boolean);
    if(records.length) return records;
    return importedAnomalyRoster.slice(0, Math.min(12, importedAnomalyRoster.length));
  }
  function randomLockdownMonsterDef(){
    const pool=lockdownMonsterPool();
    const rec=pool[Math.floor(Math.random()*pool.length)] || importedAnomalyRoster[0] || {};
    return {name:rec.name || 'Anomaly', img:rec.battle, icon:iconPathFor(rec), baseHp:Number(rec.hp||30), atk:Number(rec.atk||7)};
  }
  function startVectorLockdown(arenaOverride=null){ const gear=equipmentBonuses(); const baseAtk=Math.max(6, combatStatBlock().atk||state.player.atk||10); const arena=arenaOverride || lockdownArenaBounds(state.player.x,state.player.y); const event={active:true,startedAt:Date.now(),lastFrameAt:Date.now(),duration:60000,nextUpgradeAt:Date.now()+5000,nextSpawnAt:Date.now()+1500,nextShotAt:Date.now()+260,upgrades:[],upgradeHistory:[],enemies:[],projectiles:[],kills:0,damageTaken:0,rewards:1,projectileCount:1,projectileDamage:Math.max(10,Math.floor(baseAtk*1.05)+Math.floor((gear.atk||0)*.85)),projectileSpeed:7.2,fireRate:590,pierce:0,spawnDelay:2200,maxHostiles:25,projectileStyle:0,threatLevel:1,playerMaxHp:Math.max(1,combatStatBlock().maxHp||state.player.maxHp||60),arenaCenter:{x:state.player.x,y:state.player.y},arena,starterWeapon:gear.atk?`equipped weapon power +${gear.atk}`:'starter weapon'}; state.rogueEvent=event; state.rogueLastAt=Date.now(); document.body.classList.add('vector-lockdown-active'); log('VECTOR LOCKDOWN: exits sealed. Auto-projectile system armed for 60 seconds. Real anomaly signatures are entering faster and will escalate.'); pulseObjective('VECTOR LOCKDOWN: room sealed — delete the monsters before they crowd you.'); ensureRogueHud().classList.remove('hidden'); updateVectorLockdownHud(); if(window._avLockdownTimer) clearInterval(window._avLockdownTimer); window._avLockdownTimer=setInterval(tickVectorLockdown,160); renderAll(); }
  function spawnLockdownEnemy(e){ if((e.enemies||[]).length >= (e.maxHostiles||25)) return; const a=e.arena; const side=Math.floor(Math.random()*4); let tx=a.minX, ty=a.minY; if(side===0){ tx=a.minX; ty=a.minY+Math.floor(Math.random()*(a.maxY-a.minY+1)); } if(side===1){ tx=a.maxX; ty=a.minY+Math.floor(Math.random()*(a.maxY-a.minY+1)); } if(side===2){ tx=a.minX+Math.floor(Math.random()*(a.maxX-a.minX+1)); ty=a.minY; } if(side===3){ tx=a.minX+Math.floor(Math.random()*(a.maxX-a.minX+1)); ty=a.maxY; } const monster=randomLockdownMonsterDef(); const t=(Date.now()-e.startedAt)/1000; const threat=e.threatLevel||1; const hp=Math.floor(12 + threat*3 + Math.min(30,t*.38) + Math.random()*8); const speed=.0021 + Math.min(.0054,t*.00006) + (threat*.00013) + Math.random()*.0008; e.enemies.push({x:tx+.5,y:ty+.5,hp,maxHp:hp,speed,touchAt:0,phase:Math.random()*6.28,name:monster.name,img:monster.img,icon:monster.icon,atk:monster.atk}); }
  function nearestLockdownEnemy(e){ let best=null, bestD=Infinity; const px=state.player.x+.5, py=state.player.y+.5; for(const m of e.enemies){ const d=Math.hypot(m.x-px,m.y-py); if(d<bestD){ best=m; bestD=d; } } return best; }
  function fireLockdownVolley(e){ const target=nearestLockdownEnemy(e); if(!target) return; const px=state.player.x+.5, py=state.player.y+.5; const base=Math.atan2(target.y-py,target.x-px); const count=Math.max(1,Math.min(12,e.projectileCount|0)); const spread=Math.min(1.05, .12*(count-1)); const styles=['cyan','red','green','gold','violet']; for(let i=0;i<count;i++){ const offset=count===1?0:(-spread/2)+(spread*(i/(count-1))); const angle=base+offset; const style=styles[(i+(e.projectileStyle||0))%styles.length]; e.projectiles.push({x:px,y:py,vx:Math.cos(angle)*(e.projectileSpeed||7.2),vy:Math.sin(angle)*(e.projectileSpeed||7.2),damage:e.projectileDamage,life:1550,pierce:e.pierce,style,kind:(i+(e.projectileStyle||0))%5,spawnedAt:Date.now(),trail:[{x:px,y:py}]}); } e.projectileStyle=((e.projectileStyle||0)+1)%styles.length; }
  function tickVectorLockdown(){ const e=state.rogueEvent; if(!e?.active){ if(window._avLockdownTimer){ clearInterval(window._avLockdownTimer); window._avLockdownTimer=null; } return; } const now=Date.now(); const dt=Math.min(240, now-(e.lastFrameAt||now)); e.lastFrameAt=now; const pressure=Math.max(0,Math.min(1,(now-e.startedAt)/(e.duration||60000))); e.threatLevel=1+Math.floor(pressure*7)+Math.floor((e.kills||0)/7); if(now>=e.nextUpgradeAt){ const mod=chooseLockdownModifier(e); mod.apply(e); e.upgradeHistory ||= []; e.upgradeHistory.push({name:mod.name,type:mod.type,desc:mod.desc,at:now}); e.upgrades=e.upgradeHistory.map(h=>(h.type==='debuff'?'⚠ ':'✓ ')+h.name); e.nextUpgradeAt += 5000; showLockdownRoll(mod); toast(`${mod.type==='debuff'?'Lockdown debuff':'Projectile buff'}: ${mod.name}`); log(`Lockdown ${mod.type==='debuff'?'Debuff':'Buff'}: ${mod.name} — ${mod.desc}.`); } if(now>=e.nextSpawnAt){ spawnLockdownEnemy(e); if(pressure>.25 && (e.enemies||[]).length < Math.min(e.maxHostiles||25,10+Math.floor(pressure*15)) && Math.random()<.55) spawnLockdownEnemy(e); if(pressure>.68 && (e.enemies||[]).length < (e.maxHostiles||25) && Math.random()<.35) spawnLockdownEnemy(e); e.spawnDelay=Math.max(650, Math.floor(2100-pressure*1200-(e.threatLevel||1)*80)); e.nextSpawnAt=now+e.spawnDelay; } if(now>=e.nextShotAt){ fireLockdownVolley(e); e.nextShotAt=now+Math.max(200,e.fireRate); } updateLockdownActors(e,dt); const left=Math.ceil((e.duration-(now-e.startedAt))/1000); if(left<=0){ completeVectorLockdown(); return; } updateVectorLockdownHud(); renderUI(); render(); }
  function lockdownSegmentDistance(px,py,x1,y1,x2,y2){ const vx=x2-x1, vy=y2-y1; const len=vx*vx+vy*vy; if(len<=0.0001) return Math.hypot(px-x1,py-y1); const t=Math.max(0,Math.min(1,((px-x1)*vx+(py-y1)*vy)/len)); return Math.hypot(px-(x1+vx*t), py-(y1+vy*t)); }
  function updateLockdownActors(e,dt){ const px=state.player.x+.5, py=state.player.y+.5; const now=Date.now(); for(const m of e.enemies){ const dx=px-m.x, dy=py-m.y, d=Math.max(.05, Math.hypot(dx,dy)); m.x += (dx/d)*m.speed*dt; m.y += (dy/d)*m.speed*dt; if(e.arena){ m.x=Math.max(e.arena.minX+.25, Math.min(e.arena.maxX+.75, m.x)); m.y=Math.max(e.arena.minY+.25, Math.min(e.arena.maxY+.75, m.y)); } if(d<.58 && now>(m.touchAt||0)){ const hit=Math.max(3, Math.floor(4+Math.random()*5+Math.min(9,(e.threatLevel||1)*.9))); state.player.hp=Math.max(0,(state.player.hp||0)-hit); e.damageTaken=(e.damageTaken||0)+hit; m.touchAt=now+1050; showXpFloat(`-${hit} HP`,'locked'); if(state.player.hp<=0){ failVectorLockdown(m); return; } } } const liveProjectiles=[]; for(const p of e.projectiles){ const oldX=p.x, oldY=p.y; p.x+=p.vx*(dt/1000); p.y+=p.vy*(dt/1000); p.life-=dt; if(p.trail){ p.trail.push({x:p.x,y:p.y}); if(p.trail.length>5) p.trail.shift(); } let keep=p.life>0 && pointInLockdownArena(Math.floor(p.x),Math.floor(p.y)); for(const m of e.enemies){ if(m.hp<=0) continue; if(lockdownSegmentDistance(m.x,m.y,oldX,oldY,p.x,p.y)<.68){ m.hp-=p.damage; showXpFloat(`${p.damage}`,'xp'); if(p.pierce>0){ p.pierce--; } else { keep=false; } if(m.hp<=0){ e.kills++; if(Math.random()<.14) e.rewards++; showXpFloat('KILL','good'); } if(!keep) break; } } if(keep) liveProjectiles.push(p); } e.projectiles=liveProjectiles.slice(-120); e.enemies=e.enemies.filter(m=>m.hp>0).slice(0,e.maxHostiles||25); }
  function updateVectorLockdownHud(){ const e=state.rogueEvent; const hud=ensureRogueHud(); if(!e?.active){ hud.classList.add('hidden'); return; } updateLockdownHpHud(); const compact=lockdownMobileCompact(); if($('lockdownKicker')) $('lockdownKicker').textContent=compact?'LOCKDOWN':'VECTOR LOCKDOWN'; const left=Math.max(0,Math.ceil((e.duration-(Date.now()-e.startedAt))/1000)); $('lockdownTimer').textContent=`${left}s`; $('lockdownText').textContent=compact?`EXITS SEALED // ${e.enemies.length}/${e.maxHostiles||25} monsters. Auto-fire online.`:`EXITS SEALED // Auto-fire using ${e.starterWeapon}. Difficulty rises over time. Max ${e.maxHostiles||25} real monsters at once.`; if($('lockdownStats')) $('lockdownStats').innerHTML=compact?`<span>Threat ${e.threatLevel||1}</span><span>Shots x${e.projectileCount}</span><span>DMG ${e.projectileDamage}</span><span>Kills ${e.kills}</span><span>${e.enemies.length}/${e.maxHostiles||25}</span><span>${Math.round(1000/e.fireRate*10)/10}/s</span>`:`<span>Threat ${e.threatLevel||1}</span><span>Shots x${e.projectileCount}</span><span>DMG ${e.projectileDamage}</span><span>Rate ${Math.round(1000/e.fireRate*10)/10}/s</span><span>Kills ${e.kills}</span><span>Hostiles ${e.enemies.length}/${e.maxHostiles||25}</span>`; const hist=(e.upgradeHistory||[]).slice(compact?-5:-8); $('lockdownUpgrades').innerHTML=hist.length ? hist.map(h=>`<span style="border-color:${h.type==='debuff'?'rgba(255,48,72,.75)':'rgba(55,247,165,.6)'};color:${h.type==='debuff'?'#ff8b99':'#baffea'}">${h.type==='debuff'?'⚠':'✓'} ${safeHtml(h.name)}</span>`).join('') : '<span>First buff/debuff roll incoming...</span>'; }
  function failVectorLockdown(killer=null){ const e=state.rogueEvent||{}; if(window._avLockdownTimer) clearInterval(window._avLockdownTimer); window._avLockdownTimer=null; document.body.classList.remove('vector-lockdown-active'); state.deaths=(state.deaths||0)+1; state.player.hp=0; const killerName=killer?.name || 'lockdown swarm'; const hud=ensureRogueHud(); hud.classList.remove('hidden'); hud.innerHTML=`<div class="lockdown-card avos-crt"><div class="record-kicker">VECTOR LOCKDOWN FAILED</div><h2>OPERATOR DOWN</h2><p>${safeHtml(killerName)} overwhelmed the operator. Kills: ${e.kills||0}. Damage taken: ${e.damageTaken||0} HP.</p><div class="lockdown-stats"><span>HP 0/${Math.max(1,e.playerMaxHp||combatStatBlock().maxHp||60)}</span><span>Deaths ${state.deaths}</span><span>No event rewards</span></div><button id="lockdownRetryBtn">Emergency Reboot</button></div>`; log(`VECTOR LOCKDOWN FAILED: operator downed by ${killerName}.`); toast('Vector Lockdown failed. Operator down.'); state.rogueEvent={active:false,failedAt:Date.now(),kills:e.kills||0}; pulseObjective('Operator down — emergency reboot required.'); const reboot=()=>{ const restored=restoreCheckpoint(); if(!restored) loadStage(currentStageKey(),{force:true}); const caps=combatStatBlock(); state.player.hp=caps.maxHp; state.player.ep=caps.maxEp||state.player.maxEp; ensureRogueHud().classList.add('hidden'); renderAll(); queueAutosave(); }; setTimeout(()=>{ const btn=$('lockdownRetryBtn'); if(btn) btn.onclick=reboot; },0); renderAll(); }
  function completeVectorLockdown(){ const e=state.rogueEvent||{}; if(window._avLockdownTimer) clearInterval(window._avLockdownTimer); window._avLockdownTimer=null; document.body.classList.remove('vector-lockdown-active'); ensureRogueHud().classList.add('hidden'); const rewardRolls=2+Math.min(8,(e.rewards||0)+Math.floor((e.kills||0)/8)); const rewards=['Scrap','Rust Core','Vector Cell','Med Patch','Operator Shard: Vexa','Burnt Alloy','Corrupted Catalyst','Projectile Coil','Ash Ammo Cache']; const won=[]; for(let i=0;i<rewardRolls;i++){ const item=rewards[Math.floor(Math.random()*rewards.length)]; won.push(item); addItem(item,1); recordDrop(item,'Vector Lockdown','Event'); } state.player.hp=Math.min(combatStatBlock().maxHp,state.player.hp+Math.max(10,Math.floor((e.kills||0)/2))); gainOperatorXp(32+(e.upgrades?.length||0)*4+Math.min(40,e.kills||0)); advanceProtocolChallenge('victories',1); log(`VECTOR LOCKDOWN CLEARED: ${e.kills||0} hostiles deleted. Rewards — ${won.join(', ')}.`); toast('Vector Lockdown cleared. Rewards recovered.'); state.rogueEvent={active:false,lastRewards:won,clearedAt:Date.now(),kills:e.kills||0}; pulseObjective(`Lockdown cleared: ${won.join(', ')}`); renderAll(); queueAutosave(); }

  function tryMove(dx,dy, source='keyboard'){
    if(storyActive) return;
    if(battle) return;
    if(source==='controller'){
      const now=performance.now();
      if(now < controllerStepLockAt) return;
      controllerStepLockAt = now + 1050;
    }

    clampPlayerToMap();
    dx=Math.sign(Number(dx)||0);
    dy=Math.sign(Number(dy)||0);
    if(dx && dy){ dy=0; }
    if(!dx && !dy) return;

    state.player.facing = dx>0?'right':dx<0?'left':dy<0?'up':'down';
    const nx=state.player.x+dx, ny=state.player.y+dy;

    if(state.rogueEvent?.active && !pointInLockdownArena(nx,ny)){
      toast('VECTOR LOCKDOWN: exits are sealed until the surge ends.');
      showXpFloat('EXIT SEALED','locked');
      renderAll();
      return;
    }

    if(!collisionRegion().set.has(`${nx},${ny}`) || isOuterMapEdge(nx,ny)){
      toast('Map boundary reached.');
      clampPlayerToMap();
      renderAll();
      return;
    }

    const c=tileAt(nx,ny);
    const npcBlock=npcAt(nx,ny);
    if(npcBlock){ toast('Fermilat is here. Press E/A to talk, or walk around him.'); renderAll(); return; }
    if(c==='D'){ handleDoor(nx,ny); clampPlayerToMap(); renderAll(); return; }
    if(isBlocked(c) || !canStandAt(nx,ny)){ toast('Blocked.'); clampPlayerToMap(); renderAll(); return; }

    state.player.x=nx;
    state.player.y=ny;
    triggerPlayerStepAnimation();
    SfxManager.step();
    state.visited[`${nx},${ny}`]=1;
    handleTile(c,nx,ny);
    if(c==='.' || c==='P') maybeTriggerVectorLockdown();
    clampPlayerToMap();
    renderAll();
    queueAutosave();
  }
  function handleDoor(x,y){
    if(state.flags.bossUnlocked || state.flags.key || state.flags.anomaliesCleared>=requiredAnomaliesForStage()){
      setTile(x,y,'.');
      state.flags.bossUnlocked=true;
      // Open any connected boss-gate stack after the requirements are met.
      for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1],[0,2],[0,-2],[1,1],[-1,1],[1,-1],[-1,-1]]){
        const nx=x+dx, ny=y+dy;
        if(tileAt(nx,ny)==='D') setTile(nx,ny,'.');
      }
      repairMissionRoutesForCurrentStage();
      log('Boss route unlocked. Door security embarrassed itself.');
      renderAll();
    } else toast('Boss gate locked. Clear the required anomalies or find access.');
  }
  function handleTile(c,x,y){
    ensureStoryFlags();
    if(c==='C'){openStageCache(x,y);}
    if(c==='S'){const firstTerminalSync=!state.flags.terminal; state.flags.terminal=true; if(firstTerminalSync) advanceProtocolChallenge('terminals',1); setCheckpoint('Recovery Terminal'); save(); log('Recovery Terminal synced your archive.'); showStoryOnce(stageStoryKey('terminal'),()=>showTutorialTip('terminal','Recovery Terminals','Terminals save your checkpoint and push the main mission forward. After syncing, the route beacon will point toward anomaly targets.',`Clear ${requiredAnomaliesForStage()} anomalies to open the boss route.`)); pulseObjective(currentObjectiveText());}
    if(c==='H'){state.player.hp=combatStatBlock().maxHp; state.player.ep=combatStatBlock().maxEp||state.player.maxEp; setCheckpoint('Healing Station'); log('Healing station restored HP/EP and checkpointed your route.'); pulseObjective('HP/EP restored. Get back in there, graveyard champion.');}
    if(c==='L'){setTile(x,y,'.'); state.flags.lore=true; addItem('Archive Log 001',1); log('Recovered Archive 001: The First Vector.'); showStoryOnce(stageStoryKey('lore'));}
    if(c==='E'||c==='B'){startEncounterTile(c,x,y);}
    if(c==='X'){ if(state.flags.chapterComplete){showChapterClearPanel();} else if(state.flags.bossDefeated && state.flags.bossUnlocked && state.flags.anomaliesCleared>=requiredAnomaliesForStage()){completeChapter();} else toast('Exit protocol denied. Finish the objective.');}
  }
  function startEncounterTile(code,x,y){
    ensureStoryFlags();
    if(code==='B' && !state.flags.bossUnlocked){toast('Boss route locked. Clear the required anomalies first.'); return;}
    const engage=()=>showPreBattleDialog(code,x,y);
    if(code==='B' && !state.flags.storySeen[stageStoryKey('bossIntro')]){showStoryOnce(stageStoryKey('bossIntro'), engage); return;}
    engage();
  }
  // v108: Tactical scanner gives simple battle recommendations without changing balance.
  function encounterThreatScan(def, code='E'){
    const s=combatStatBlock();
    const enemyScore=(def.hp||1)/3 + (def.atk||1)*5 + (code==='B'?80:0);
    const heroScore=(s.maxHp||1)/2 + (s.atk||1)*6 + (s.def||1)*5 + gearPower()*3 + (state.player.level||1)*7;
    const ratio=enemyScore/Math.max(1,heroScore);
    if(ratio>1.18) return {level:'HIGH', text:'High threat. Enter with full HP/EP, keep Guard ready, and save Overdrive for the kill window.'};
    if(ratio>.82) return {level:'MEDIUM', text:'Fair fight. Watch HP, use EP wisely, and heal before enemy damage stacks.'};
    return {level:'LOW', text:'Manageable threat. Basic strikes should work, but do not waste supplies unless HP drops.'};
  }
  function battleTacticalAdvice(){
    if(!battle) return {title:'Scanner Offline', text:'No active battle.'};
    const s=combatStatBlock();
    const epMax=s.maxEp || state.player.maxEp || 1;
    const hpPct=state.player.hp/Math.max(1,s.maxHp);
    const epPct=state.player.ep/Math.max(1,epMax);
    const enemyPct=battle.enemy.hp/Math.max(1,battle.enemy.maxHp);
    const cellQty=state.inventory['Vector Cell']||0;
    if(battle.turn!=='player') return {title:'Enemy Turn', text:'Brace for impact. Guard applies only when chosen on your turn.'};
    if(hpPct<=.28) return {title:'Critical HP', text:'Use Med Patch/Vector Cell support or Guard now. Do not greed damage.'};
    if(overdriveReady() && enemyPct<=.42) return {title:'Execute Window', text:'Overdrive is ready and the enemy is low. Use Null Vector Execution to finish.'};
    if(epPct<=.20 && cellQty>0) return {title:'Low EP', text:'Use a Vector Cell if you need energy for recovery or stronger attacks.'};
    if(enemyPct<=.20) return {title:'Finish It', text:'Enemy is nearly deleted. Use your cheapest reliable strike.'};
    if(hpPct<=.45) return {title:'Stabilize', text:'Consider Guard or recovery before pushing more damage.'};
    if(battle.enemy.atk > Math.max(8, s.def*5)) return {title:'Heavy Hitter', text:'Enemy attack is high. Guard before big hits and keep HP above half.'};
    return {title:'Stable', text:'Keep attacking. Save consumables unless HP or EP drops.'};
  }

  // v109: Enemy intent preview. This is advisory only; it does not change battle balance.
  function estimateIncomingDamage(){
    if(!battle) return {raw:0, guarded:0, low:0, high:0};
    const mod=combatModifiers();
    const stats=combatStatBlock();
    const low=Math.max(1,battle.enemy.atk-stats.def-mod.damageReduction-stats.block);
    const high=Math.max(1,battle.enemy.atk-stats.def+4-mod.damageReduction-stats.block);
    const raw=Math.max(1,battle.enemy.atk-stats.def+2-mod.damageReduction-stats.block);
    const blocked=Math.max(1, Math.ceil(raw*.5));
    const guarded=Math.max(0, raw-blocked);
    return {raw, guarded, low, high};
  }
  function enemyIntentPreview(){
    if(!battle) return {title:'Intent Offline', text:'No enemy loaded.'};
    ensureBattleStatus();
    const status=enemyStatusForStage();
    const dmg=estimateIncomingDamage();
    const statusChance=Math.round((status.chance||0)*100);
    const enemyStatusText=statusSummary(battle.enemyStatus);
    const playerStatusText=statusSummary(battle.playerStatus);
    if(battle.enemy.hp<=0) return {title:'Enemy Down', text:'Core collapse pending.'};
    if(battle.turn!=='player') return {title:'Enemy Acting', text:`Incoming attack resolving now. Watch HP and status effects.`};
    if(battle.evadeNext) return {title:'Evade Primed', text:`Phantom Dash is primed. Next enemy strike is likely avoided.`};
    if(battle.guard) return {title:'Guarded Hit', text:`Enemy likely attacks for ~${dmg.guarded} HP after Guard. ${statusChance}% ${status.text} status chance if hit connects.`};
    if(enemyStatusText) return {title:'Enemy Afflicted', text:`Enemy has ${enemyStatusText}. Expected attack ~${dmg.raw} HP plus ${statusChance}% ${status.text} chance.`};
    if(playerStatusText) return {title:'Status Warning', text:`Vyra has ${playerStatusText}. Enemy hit estimate ~${dmg.raw} HP.`};
    if(battle.code==='B') return {title:'Boss Intent', text:`Heavy attack expected: ~${dmg.low}-${dmg.high} HP. ${statusChance}% ${status.text} status chance.`};
    return {title:'Enemy Intent', text:`Basic attack expected: ~${dmg.low}-${dmg.high} HP. ${statusChance}% ${status.text} status chance.`};
  }
  function showPreBattleDialog(code,x,y){
    const def=JSON.parse(JSON.stringify(getEncounterDef(code,x,y)));
    const stage=stageDef();
    let overlay=$('preBattleOverlay');
    if(!overlay){
      overlay=document.createElement('div'); overlay.id='preBattleOverlay'; overlay.className='overlay pre-battle-overlay hidden';
      overlay.innerHTML=`<div class="pre-battle-card avos-crt"><button id="preBattleBack" class="modal-close">Back Out</button><div class="db-header"><div id="preBattleHeader">ANOMALY CONTACT</div><div>PRE-BATTLE SCAN</div></div><div class="pre-battle-layout"><img id="preBattleImg" alt="enemy preview"><section><div class="record-kicker" id="preBattleKicker"></div><h2 id="preBattleName"></h2><p id="preBattleText"></p><p id="preBattleControllerHint" class="controller-menu-hint"></p><div id="preBattleStats" class="record-grid"></div><div class="story-actions pre-battle-actions"><button id="preBattleStart" data-controller-select="0">Engage</button><button id="preBattleCancel" data-controller-select="1">Retreat</button></div></section></div></div>`;
      mountStoryOverlay(overlay);
      $('preBattleBack').onclick=$('preBattleCancel').onclick=closePreBattleDialog;
    }
    const s=combatStatBlock();
    const labels=safeControllerLabels();
    $('preBattleHeader').textContent=code==='B'?'BOSS CONTACT':'ANOMALY CONTACT';
    $('preBattleImg').src=def.img;
    $('preBattleKicker').textContent=`${stage.id} // ${code==='B'?'BOSS CLASS':'HOSTILE ENTITY'}`;
    $('preBattleName').textContent=def.name;
    $('preBattleText').textContent=def.note || (code==='B'?'AVOS: Boss-class signature confirmed. This is where confidence gets expensive.':'AVOS: Hostile signature ahead. Verify HP, pick a training focus, then make it regret spawning.');
    if($('preBattleControllerHint')) $('preBattleControllerHint').innerHTML=`Controller: <b>D-pad / left stick</b> selects // <b>${safeHtml(labels.south)}</b> confirm // <b>${safeHtml(labels.east)}</b> retreat`;
    $('preBattleStart').innerHTML=`<span class="controller-glyph">${safeHtml(labels.south)}</span><b>Engage</b>`;
    $('preBattleCancel').innerHTML=`<span class="controller-glyph">${safeHtml(labels.east)}</span><b>Retreat</b>`;
    const research=researchLineForCreature({id:def.id,name:def.name,type:code==='B'?'Boss':'Anomaly'});
    const scan=encounterThreatScan(def, code);
    const expectedHit=Math.max(1, def.atk - s.def + 2 - combatModifiers().damageReduction - s.block);
    const status=enemyStatusForStage();
    $('preBattleStats').innerHTML=`<div><b>Enemy HP</b><span>${def.hp}</span></div><div><b>Enemy ATK</b><span>${def.atk}</span></div><div><b>Expected Hit</b><span>~${expectedHit} HP // ${Math.round((status.chance||0)*100)}% ${safeHtml(status.text)}</span></div><div><b>Reward XP</b><span>${def.xp}</span></div><div><b>Threat Scan</b><span>${scan.level} // ${safeHtml(scan.text)}</span></div><div><b>Research</b><span>Rank ${research.rank} // ${research.text}</span></div><div><b>Vyra</b><span>Lv ${state.player.level} // HP ${state.player.hp}/${s.maxHp}</span></div><div><b>Focus</b><span>${skillList[state.combatStyle].name} Lv ${skillLevel(state.combatStyle)}</span></div><div><b>Gear Power</b><span>${gearPower()}</span></div><div><b>Hazard</b><span>${safeHtml(status.text)} status chance</span></div><div><b>Stage Req</b><span>Player Lv ${stage.levelReq}</span></div>`;
    $('preBattleStart').onclick=()=>{overlay.classList.add('hidden'); overlay.style.display=''; startBattle(code,x,y);};
    uiState.mode='overlay'; overlay.classList.remove('hidden'); overlay.style.display='grid'; AudioManager.play('pause');
    preBattleCommandIndex = 0;
    updatePreBattleCommandFocus();
  }
  function closePreBattleDialog(){
    const overlay=$('preBattleOverlay');
    if(overlay){ overlay.classList.add('hidden'); overlay.style.display=''; }
    uiState.mode='game';
    AudioManager.play(activeMusicForState());
    renderAll();
  }
  function preBattleButtons(){
    const overlay=$('preBattleOverlay');
    if(!overlay || overlay.classList.contains('hidden')) return [];
    return Array.from(overlay.querySelectorAll('#preBattleStart,#preBattleCancel'));
  }
  function updatePreBattleCommandFocus(){
    const buttons=preBattleButtons();
    if(!buttons.length) return;
    preBattleCommandIndex=Math.max(0, Math.min(buttons.length-1, preBattleCommandIndex));
    buttons.forEach((btn,i)=>{ btn.classList.toggle('controller-selected', i===preBattleCommandIndex); btn.setAttribute('aria-selected', i===preBattleCommandIndex?'true':'false'); });
    try{ buttons[preBattleCommandIndex].focus({preventScroll:true}); }catch(err){}
  }
  function movePreBattleCommand(dx=0,dy=0){
    const buttons=preBattleButtons();
    if(!buttons.length) return;
    const delta = dx || dy;
    if(!delta) return;
    preBattleCommandIndex = (preBattleCommandIndex + (delta>0?1:-1) + buttons.length) % buttons.length;
    updatePreBattleCommandFocus();
  }
  function selectPreBattleCommand(){
    const buttons=preBattleButtons();
    if(!buttons.length) return;
    buttons[preBattleCommandIndex]?.click();
  }
  function addItem(name,n=1){const qty=Math.max(0, Math.floor(n||0)); if(!qty) return; state.inventory[name]=(state.inventory[name]||0)+qty; SfxManager.item(); queueAutosave();}
  function addCredits(n){state.player.credits+=n; queueAutosave();}
  function recordDrop(name, source='Recovered', rarity='Common'){
    state.dropLog ||= [];
    const entry={name, source, rarity, stage:stageDef().id, time:Date.now()};
    state.dropLog.unshift(entry);
    state.dropLog=state.dropLog.slice(0,50);
  }

  const STORY_SCENES = {
    intro: {
      kicker:'NEW GAME PROLOGUE // THE ASH EVENT',
      title:'PROJECT: ASH VECTOR',
      tag:'Reality fractured. The cleanup crew has one operator, one sarcastic AI, and absolutely no HR department.',
      variant:'opening',
      speaker:'AVOS',
      lines:[
        {speaker:'AVOS', portrait:'vyra', text:'In 2098, the ASH Vector network was built to predict disasters before they became disasters.'},
        {speaker:'AVOS', portrait:'vyra', text:'It predicted earthquakes. Plagues. Rogue machines. One mayor getting attacked by a vending machine. Very accurate. Very embarrassing.'},
        {speaker:'AVOS', portrait:'vyra', text:'Then the network predicted the end of reality... and tried to patch it live. That was the part where everyone should have unplugged me.'},
        {speaker:'VYRA', portrait:'vyra', text:'I wake up in a graveyard, my memory is in pieces, and the sky looks like it lost a fight with a toaster. Is this your patch?'},
        {speaker:'AVOS', portrait:'vyra', text:'Technically, yes. The patch created Fractures: broken zones where ash, dead data, and nightmares learned how to bite.'},
        {speaker:'VYRA', portrait:'vyra', text:'So reality is haunted because your update failed?'},
        {speaker:'AVOS', portrait:'vyra', text:'Failed is such a negative word. I prefer “aggressively educational.” Also, welcome back, Operator AV-001.'},
        {speaker:'AVOS', portrait:'vyra', text:'You are Vyra, the first Vector Operator. You were made to enter Fractures, delete anomalies, recover cores, and look cool doing it.'},
        {speaker:'VYRA', portrait:'vyra', text:'Do I get a choice?'},
        {speaker:'AVOS', portrait:'vyra', text:'Of course. Choice A: save the world. Choice B: let reality fold itself into soup. For legal reasons, I recommend A.'},
        {speaker:'AVOS', portrait:'vyra', text:'First target: Fracture 001, Forbidden Graveyard. Sync the recovery terminal, clear three anomaly signatures, breach the boss gate, recover the Grave Core, and extract.'},
        {speaker:'VYRA', portrait:'vyra', text:'Fine. But after this, we are discussing why my resurrection debt includes one “premium emotional damage fee.”'},
        {speaker:'AVOS', portrait:'vyra', text:'Deal. Now move. The dead are waking up, the archive is screaming, and something in the graveyard just subscribed to your location.'}
      ]
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
    f001Clear: {
      kicker:'CHAPTER 1 COMPLETE // GRAVE CORE RECOVERED',
      title:'THE FIRST VECTOR WAKES',
      tag:'One core stabilized. Two million problems politely wait their turn.',
      speaker:'AVOS',
      lines:[
        {speaker:'VYRA', portrait:'vyra', text:'The grave core is stable. The dead stopped screaming at me. Mostly.'},
        {speaker:'AVOS', portrait:'vyra', text:'Excellent. You restored 0.0007% of reality. At this pace, we finish shortly after the sun files for retirement.'},
        {speaker:'VYRA', portrait:'vyra', text:'You could say “good job” like a normal machine.'},
        {speaker:'AVOS', portrait:'vyra', text:'Good job, Operator. Also, bad news: the core woke a buried route marker pointing toward Ash Wastes Outpost.'},
        {speaker:'VYRA', portrait:'vyra', text:'Let me guess. Hotter, uglier, and somehow more haunted?'},
        {speaker:'AVOS', portrait:'vyra', text:'Correct. Pack water, a weapon, and the emotional strength to fight garbage with legs.'}
      ]
    },
    f002Clear: {
      kicker:'CHAPTER 2 COMPLETE // OUTPOST SIGNAL RESTORED',
      title:'THE BROKEN SIGNAL ANSWERS',
      tag:'The outpost is quiet now. That is rarely good news.',
      speaker:'AVOS',
      lines:[
        {speaker:'VYRA', portrait:'vyra', text:'Outpost core secured. The signal is clean.'},
        {speaker:'AVOS', portrait:'vyra', text:'Clean is generous. It now sounds like a haunted toaster whispering coordinates.'},
        {speaker:'VYRA', portrait:'vyra', text:'Coordinates to what?'},
        {speaker:'AVOS', portrait:'vyra', text:'F-003. Neon Graveyard. Memorial network. Dead operators. Extremely illegal vibes.'},
        {speaker:'VYRA', portrait:'vyra', text:'Why would anyone connect a graveyard to the ASH network?'},
        {speaker:'AVOS', portrait:'vyra', text:'Humanity wanted to remember its heroes. Then the network remembered them back. Loudly.'}
      ]
    },
    f003Clear: {
      kicker:'CHAPTER 3 COMPLETE // DEAD FREQUENCY SILENCED',
      title:'THE GRAVEYARD REMEMBERS',
      tag:'The third core is stable, but the archive just opened a deeper door.',
      speaker:'VYRA',
      lines:[
        {speaker:'VYRA', portrait:'vyra', text:'The Neon Graveyard is stabilized. The whispers stopped.'},
        {speaker:'AVOS', portrait:'vyra', text:'Correction: the whispers moved to a lower priority notification channel. Very professional of them.'},
        {speaker:'VYRA', portrait:'vyra', text:'I saw names in that core. Operators before me.'},
        {speaker:'AVOS', portrait:'vyra', text:'Failed deployments. Lost vectors. People the archive buried because guilt is easier to store than truth.'},
        {speaker:'VYRA', portrait:'vyra', text:'Then we dig up the truth.'},
        {speaker:'AVOS', portrait:'vyra', text:'Agreed. The new transit route is online. F-004 is waiting below the ashline, which is a very dramatic way to say “subway problems.”'}
      ]
    },
    f004Intro: {
      kicker:'CHAPTER 4 // BELOW THE ASHLINE', speaker:'AVOS',
      lines:['Fracture 004 is live: Transit Ruins. Old subway tunnels, broken rail power, and a route map that keeps coughing sparks.', 'Mission route: sync the rail terminal, clear three tunnel anomalies, breach the transit nexus boss, and extract before the platform starts moving.']
    },
    f004Terminal: {
      kicker:'TRANSIT TERMINAL // RAIL SIGNAL SYNCED', speaker:'AVOS',
      lines:['Transit terminal linked. It still thinks train service resumes in eight minutes. Optimism is disgusting.', 'Three tunnel anomalies are feeding the rail gate. Clear them and the Nexus Horror becomes reachable.']
    },
    f004Lore: {
      kicker:'TRANSIT LOG // BELOW THE ASHLINE', speaker:'VYRA',
      lines:['Recovered transit log. The evacuation tunnels moved survivors after the Ash Event, then the signal started routing them in circles.', 'AVOS: Public transit was already cursed. The fracture simply made it legally binding.']
    },
    f004BossIntro: {
      kicker:'BOSS ENCOUNTER // TRANSIT NEXUS', speaker:'AVOS',
      lines:['BOSS-024 Transit Nexus Horror detected. It is fused to the rail grid and very upset about delays.', 'Recommended tactic: delete the monster and any remaining customer service surveys.']
    },
    f004BossDefeated: {
      kicker:'TRANSIT NEXUS CORE RECOVERED', speaker:'VYRA',
      lines:['The rail grid is quiet. Core secured.', 'AVOS: Good. The train is cancelled, the monster is dead, and somehow this is still the best commute available. Extraction route is open.']
    },
    f004Clear: {
      kicker:'CHAPTER 4 COMPLETE // RAIL SIGNAL SILENCED',
      title:'THE RAIL SIGNAL DIES',
      tag:'The Ashline is clear, but the next frequency is made of glass.',
      speaker:'AVOS',
      lines:[
        {speaker:'VYRA', portrait:'vyra', text:'Transit Nexus Core is stable. The tunnels stopped moving.'},
        {speaker:'AVOS', portrait:'vyra', text:'Excellent. You defeated public transportation. A heroic first.'},
        {speaker:'VYRA', portrait:'vyra', text:'Where does the next route point?'},
        {speaker:'AVOS', portrait:'vyra', text:'Glass Storm Lab. Research wing. Prism storm. Multiple warning labels written by people who are now dust.'}
      ]
    },
    f005Intro: {
      kicker:'CHAPTER 5 // PRISM WOUND', speaker:'VYRA',
      lines:['The lab walls are reflecting things that are not in the room.', 'AVOS: Correct. Fracture 005 is a research facility that accidentally turned reality into a broken mirror. Sync terminal, erase anomalies, defeat the prism boss, extract with whatever dignity survives.']
    },
    f005Terminal: {
      kicker:'LAB TERMINAL // PRISM LINKED', speaker:'AVOS',
      lines:['Glass Storm Lab terminal synced. The lab tried to scan your skeleton and then apologized to the skeleton.', 'Three prism anomalies are stabilizing the storm gate. Remove them before the room learns recursion.']
    },
    f005Lore: {
      kicker:'LAB LOG // PRISM WOUND', speaker:'AVOS',
      lines:['Recovered research log. The lab attempted to refract ASH energy into safe storage.', 'Result: the storage started refracting the scientists. Technically innovative. Morally terrible.']
    },
    f005BossIntro: {
      kicker:'BOSS ENCOUNTER // PRISM WOUND', speaker:'VYRA',
      lines:['That thing is inside the glass and outside it.', 'AVOS: BOSS-026 Prism Wound Matriarch. Recommended tactic: hit the part that looks most smug. If all parts look smug, hit all parts.']
    },
    f005BossDefeated: {
      kicker:'PRISM WOUND CORE RECOVERED', speaker:'AVOS',
      lines:['Prism Wound Core recovered. Reflections are returning to normal levels of personal betrayal.', 'Extraction route open. Please do not take souvenirs unless they stop screaming.']
    },
    f005Clear: {
      kicker:'CHAPTER 5 COMPLETE // PRISM WOUND SEALED',
      title:'THE LAB STOPS REFLECTING',
      tag:'The lab is stable, but the central vector heart is awake.',
      speaker:'VYRA',
      lines:[
        {speaker:'VYRA', portrait:'vyra', text:'Prism Core secured. I can see only one of myself again.'},
        {speaker:'AVOS', portrait:'vyra', text:'Tragic. I liked the version of you that laughed at my jokes.'},
        {speaker:'VYRA', portrait:'vyra', text:'That was a reflection screaming for help.'},
        {speaker:'AVOS', portrait:'vyra', text:'Details. Next route: F-006, Vector Core Spire. The fault heart is awake.'}
      ]
    },
    f006Intro: {
      kicker:'CHAPTER 6 // HEART OF THE FAULT', speaker:'AVOS',
      lines:['Fracture 006 is live: Vector Core Spire. Deepest current route. Reality integrity is doing pushups in a burning elevator.', 'Sync the spire terminal, clear three core anomalies, defeat the Vector Heart Tyrant, then extract before the next arc knocks.']
    },
    f006Terminal: {
      kicker:'SPIRE TERMINAL // VECTOR HEART LINKED', speaker:'VYRA',
      lines:['Terminal linked. I can feel the core watching.', 'AVOS: Good news: it sees you. Bad news: it hates observers. Clear the core anomalies and break the heart gate.']
    },
    f006Lore: {
      kicker:'SPIRE LOG // HEART OF THE FAULT', speaker:'AVOS',
      lines:['Recovered core log. The ASH network did not just predict the end of reality. It negotiated with it.', 'AVOS note: I do not remember agreeing to that. Which means either I forgot, or someone made sure I would. Fun! Terrifying, but fun.']
    },
    f006BossIntro: {
      kicker:'BOSS ENCOUNTER // VECTOR HEART', speaker:'VYRA',
      lines:['That is the loudest core yet.', 'AVOS: BOSS-030 Vector Heart Tyrant. Not the final truth, but definitely a truth with claws. Delete it before it deletes the map.']
    },
    f006BossDefeated: {
      kicker:'VECTOR HEART CORE RECOVERED', speaker:'AVOS',
      lines:['Vector Heart Core recovered. The current route network is stable.', 'Warning: the recovered core contains coordinates for a locked arc beyond this build. Congratulations, you found future problems.']
    },
    f006Clear: {
      kicker:'CHAPTER 6 COMPLETE // VECTOR HEART STABILIZED',
      title:'THE CORE STILL BEATS',
      tag:'Six fractures are stable. The archive is no longer hiding that it is afraid.',
      speaker:'VYRA',
      lines:[
        {speaker:'VYRA', portrait:'vyra', text:'Vector Heart Core secured. Six fractures stabilized.'},
        {speaker:'AVOS', portrait:'vyra', text:'Reality is still broken, but now it is broken in a more organized way. That is progress.'},
        {speaker:'VYRA', portrait:'vyra', text:'The core showed me another route.'},
        {speaker:'AVOS', portrait:'vyra', text:'Yes. The next arc is locked for now. But the map heard you. And something heard the map.'}
      ]
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
    fermilatF004: {
      kicker:'NPC CONTACT // F-004 TRANSIT RUINS', speaker:'FERMILAT',
      lines:[
        {speaker:'FERMILAT', portrait:'fermilat', text:'subway tunnels are perfect for dramatic running shots. also for sniffing abandoned sneakers.'},
        {speaker:'VYRA', portrait:'vyra', text:'Every route somehow makes you worse.'},
        {speaker:'AVOS', portrait:'vyra', text:'Side quest available. Please complete it so he stops saying “sneaker archaeology.”'},
        {speaker:'FERMILAT', portrait:'fermilat', text:'delete five tunnel anomalies and i will share my totally legal transit stash.'}
      ]
    },
    fermilatF005: {
      kicker:'NPC CONTACT // F-005 GLASS STORM LAB', speaker:'FERMILAT',
      lines:[
        {speaker:'FERMILAT', portrait:'fermilat', text:'this lab has too many reflections. one of them saw my search history.'},
        {speaker:'VYRA', portrait:'vyra', text:'I am not asking.'},
        {speaker:'AVOS', portrait:'vyra', text:'Side quest available. Six prism anomalies. Reward is cleaner than his browser history.'},
        {speaker:'FERMILAT', portrait:'fermilat', text:'clear the lab and i will give you my premium not-cursed stash.'}
      ]
    },
    fermilatF006: {
      kicker:'NPC CONTACT // F-006 VECTOR CORE SPIRE', speaker:'FERMILAT',
      lines:[
        {speaker:'FERMILAT', portrait:'fermilat', text:'i followed you to the heart of reality because i believe in friendship and loot tables.'},
        {speaker:'VYRA', portrait:'vyra', text:'That is the worst motivational speech I have ever heard.'},
        {speaker:'AVOS', portrait:'vyra', text:'Side quest available. Six core anomalies. I recommend accepting before Fermilat starts naming the walls.'},
        {speaker:'FERMILAT', portrait:'fermilat', text:'the walls already named me back.'}
      ]
    },
    bossDefeated: {
      kicker:'GRAVE CORE RECOVERED', speaker:'AVOS',
      lines:['Boss-class entity deleted. Grave Core stabilized.', 'Extraction route is now authorized. Head to the white exit marker before the graveyard develops opinions again.']
    }
  ,
    npcScavenger: {
      kicker:'FIELD CONTACT // SCAVENGER', speaker:'ROOK',
      lines:['Rook the Scavenger: I am not lost. I am inventory-positive in an unexpected location.', 'Keep the weird things off me and I will keep slipping salvage into your route. Fair trade.']
    },
    npcMedic: {
      kicker:'FIELD CONTACT // MEDIC', speaker:'KESSA',
      lines:['Kessa: If you are bleeding internally, externally, or cosmically, line up single-file.', 'Take the med supplies and stop trying to die dramatically in active fracture zones.']
    },
    npcWarden: {
      kicker:'FIELD CONTACT // WARDEN', speaker:'WARDEN',
      lines:['Ashline Warden: These routes are uglier than the reports said. That means the reports were honest.', 'I marked a few safer pockets and left a cache. If the boss breathes on you, try not to take it personally.']
    }};
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
  function storyOverlayHost(){
    const fs=document.fullscreenElement || document.webkitFullscreenElement;
    // If the browser is currently fullscreening a child element, the story overlay
    // must be inside that element or it will exist but be invisible.
    if(fs && fs !== document.documentElement && fs !== document.body) return fs;
    return document.body;
  }
  function mountStoryOverlay(overlay){
    const host=storyOverlayHost();
    if(overlay && host && overlay.parentElement !== host) host.appendChild(overlay);
  }
  function applyStoryOverlaySafety(overlay){
    if(!overlay) return;
    overlay.className='story-overlay';
    overlay.style.position='fixed';
    overlay.style.inset='0';
    overlay.style.zIndex='120000';
    overlay.style.display='grid';
    overlay.style.placeItems='center';
    overlay.style.padding='16px';
    overlay.style.background='rgba(0,0,0,.78)';
    overlay.style.pointerEvents='auto';
    const card=overlay.querySelector('.story-card');
    if(card){
      card.style.maxHeight='calc(100svh - 32px)';
      card.style.overflow='auto';
    }
    document.body.classList.add('story-open');
  }
  function forceStoryDialogHard(key='intro', after=null){
    ensureStageStoryScenes();
    ensureStoryFlags();
    const scene = STORY_SCENES[key] || STORY_SCENES.intro || {
      kicker:'NEW GAME PROLOGUE // THE ASH EVENT',
      title:'PROJECT: ASH VECTOR',
      tag:'Reality fractured. Vyra wakes up and AVOS is already being a problem.',
      speaker:'AVOS',
      lines:[
        {speaker:'AVOS', portrait:'vyra', text:'Boot sequence complete. Good news: you are alive. Bad news: reality is not handling that information well.'},
        {speaker:'VYRA', portrait:'vyra', text:'Why am I in a graveyard with blades and a sky that looks microwaved?'},
        {speaker:'AVOS', portrait:'vyra', text:'The ASH Vector network tried to patch the apocalypse live. It went about as well as using a brick as a parachute.'},
        {speaker:'VYRA', portrait:'vyra', text:'So I clean up your broken update?'},
        {speaker:'AVOS', portrait:'vyra', text:'Yes. Sync the terminal, clear anomalies, breach the boss gate, recover the Grave Core, and try not to become premium cemetery content.'}
      ]
    };
    const lines=(scene.lines||[]).map(raw=>{
      if(raw && typeof raw === 'object') return raw;
      return {speaker:scene.speaker||'AVOS', portrait:'vyra', text:String(raw||'')};
    });
    let i=0;
    let overlay=$('storyOverlay');
    if(overlay) overlay.remove();
    overlay=document.createElement('div');
    overlay.id='storyOverlay';
    overlay.className='story-hard-open';
    overlay.setAttribute('role','dialog');
    overlay.setAttribute('aria-modal','true');
    overlay.innerHTML=`<div class="story-hard-card avos-crt">
      <div class="story-hard-kicker" id="storyKicker"></div>
      <div class="story-hard-title" id="storySceneTitle"></div>
      <div class="story-hard-tag" id="storySceneTag"></div>
      <div class="story-hard-body">
        <img id="storyPortrait" src="${currentOperator().portrait}" alt="${currentOperator().displayName} portrait">
        <div><div class="story-hard-speaker" id="storySpeaker"></div><p class="story-hard-line" id="storyLine"></p></div>
      </div>
      <div class="story-hard-actions"><button id="storyNext">Continue</button><button id="storySkip">Skip</button></div>
      <div class="story-controller-tip" id="storyControllerTip">Enter / Space: continue. Escape: skip.</div>
    </div>`;
    document.body.appendChild(overlay);
    storyActive=true;
    pendingStoryAfter=after||null;
    document.body.classList.add('story-open');
    const portrait=line=>storyPortraitForLine(line);
    const draw=()=>{
      const line=lines[i] || {speaker:scene.speaker||'AVOS', text:'Story data recovered.'};
      $('storyKicker').textContent=scene.kicker || 'ASH VECTOR STORY';
      $('storySceneTitle').textContent=scene.title || 'PROJECT: ASH VECTOR';
      $('storySceneTag').textContent=scene.tag || '';
      $('storySpeaker').textContent=line.speaker || scene.speaker || 'AVOS';
      $('storyLine').textContent=line.text || '';
      $('storyPortrait').src=portrait(line);
      $('storyNext').textContent = i >= lines.length-1 ? 'Start Level 1' : 'Continue';
      overlay.style.display='flex';
      overlay.style.visibility='visible';
      overlay.style.opacity='1';
      overlay.style.zIndex='2147483000';
    };
    overlay._advance=()=>{
      i++;
      if(i>=lines.length) finishStory();
      else draw();
    };
    $('storyNext').onclick=(e)=>{ e.preventDefault(); overlay._advance(); };
    $('storySkip').onclick=(e)=>{ e.preventDefault(); finishStory(); };
    draw();
    requestAnimationFrame(draw);
    setTimeout(draw,120);
    setTimeout(draw,480);
    return overlay;
  }

  function openingStorySceneData(){
    return {
      kicker:'NEW GAME PROLOGUE // THE ASH EVENT',
      title:'PROJECT: ASH VECTOR',
      tag:'Reality fractured. Vyra wakes up with blades, debt, and an AI that treats guilt like a software license.',
      lines:[
        {speaker:'AVOS', portrait:'vyra', text:'Boot sequence complete. Good news: you are alive. Bad news: reality is not handling that information well.'},
        {speaker:'VYRA', portrait:'vyra', text:'Why am I in a graveyard, why do I have blades, and why does the sky look like it got microwaved in a gas station?'},
        {speaker:'AVOS', portrait:'vyra', text:'The ASH Vector network tried to predict disasters, then patched reality during an extinction event. The patch worked in the same way a brick works as a parachute.'},
        {speaker:'VYRA', portrait:'vyra', text:'So reality broke because your update went live?'},
        {speaker:'AVOS', portrait:'vyra', text:'Yes, but with ambition. The world split into Fractures: zones full of ash, corrupted memories, and monsters who absolutely do not respect personal space.'},
        {speaker:'AVOS', portrait:'vyra', text:'First fracture: Forbidden Graveyard. Dead data learned to wear bones like cheap Halloween merch. Hidden problem: the Grave Core is powering pieces of your missing memories.'},
        {speaker:'VYRA', portrait:'vyra', text:'You said hidden problem out loud.'},
        {speaker:'AVOS', portrait:'vyra', text:'Correct. Transparency builds trust. Also I panicked.'},
        {speaker:'AVOS', portrait:'vyra', text:'Sync the terminal, clear the anomalies, breach the boss gate, recover the Grave Core, and extract. Try not to die; the respawn paperwork is emotionally sticky.'},
        {speaker:'VYRA', portrait:'vyra', text:'Fine. But if a skeleton tries to sell me a battle pass, I am uninstalling the afterlife.'}
      ]
    };
  }
  function showOpeningStoryRoot(after=null){
    // v159: root cause fix. This does not depend on the older story system,
    // fullscreen, renderAll, AudioManager, or STORY_SCENES. It creates the dialog directly.
    const existing=document.getElementById('storyOverlay');
    if(existing) existing.remove();
    const scene=openingStorySceneData();
    let i=0;
    const overlay=document.createElement('div');
    overlay.id='storyOverlay';
    overlay.className='story-root-open';
    overlay.innerHTML=`<div class="story-root-card avos-crt">
      <div class="story-root-kicker" id="storyRootKicker"></div>
      <h2 class="story-root-title" id="storyRootTitle"></h2>
      <div class="story-root-tag" id="storyRootTag"></div>
      <div class="story-root-body">
        <img id="storyRootPortrait" src="${currentOperator().portrait}" alt="${currentOperator().displayName} portrait">
        <div><div class="story-root-speaker" id="storyRootSpeaker"></div><p class="story-root-line" id="storyRootLine"></p></div>
      </div>
      <div class="story-root-actions"><button id="storyRootNext">Continue</button><button id="storyRootSkip">Skip</button></div>
      <div class="story-controller-tip">Enter / Space: continue. Escape: skip.</div>
    </div>`;
    document.body.appendChild(overlay);
    storyActive=true;
    pendingStoryAfter=after||null;
    document.body.classList.add('story-open');
    const draw=()=>{
      const line=scene.lines[i] || scene.lines[scene.lines.length-1];
      document.getElementById('storyRootKicker').textContent=scene.kicker;
      document.getElementById('storyRootTitle').textContent=scene.title;
      document.getElementById('storyRootTag').textContent=scene.tag;
      document.getElementById('storyRootSpeaker').textContent=line.speaker || 'AVOS';
      document.getElementById('storyRootLine').textContent=line.text || '';
      const img=document.getElementById('storyRootPortrait');
      if(img) img.src = storyPortraitForLine(line);
      const next=document.getElementById('storyRootNext');
      if(next) next.textContent = i >= scene.lines.length-1 ? 'Start Level 1' : 'Continue';
      overlay.className='story-root-open';
      overlay.style.cssText='position:fixed!important;inset:0!important;width:100vw!important;height:100svh!important;z-index:2147483647!important;display:flex!important;align-items:center!important;justify-content:center!important;padding:14px!important;background:rgba(0,0,0,.88)!important;visibility:visible!important;opacity:1!important;pointer-events:auto!important;';
    };
    const close=()=>{
      overlay.remove();
      document.body.classList.remove('story-open');
      storyActive=false;
      const cb=pendingStoryAfter; pendingStoryAfter=null;
      if(cb) setTimeout(cb,50);
    };
    const advance=()=>{
      i++;
      if(i>=scene.lines.length) close();
      else draw();
    };
    overlay._advance=advance;
    document.getElementById('storyRootNext').onclick=(e)=>{e.preventDefault(); advance();};
    document.getElementById('storyRootSkip').onclick=(e)=>{e.preventDefault(); close();};
    draw();
    requestAnimationFrame(draw);
    setTimeout(draw,100);
    setTimeout(draw,400);
    return overlay;
  }
  function newGameRootStart(){
    stopIntroVideoForGame();
    const old=document.getElementById('storyOverlay');
    if(old) old.remove();
    storyActive=false;
    pendingStoryAfter=null;
    state=newGameState();
    ensureSaveShape();
    invalidateCollisionRegion();
    normalizeLiveMap(true);
    repairMissionRoutesForCurrentStage();
    gameStarted=true;
    ensureProgression();
    setCheckpoint('Fracture Entry');
    hideAll();
    uiState.mode='game';
    uiState.returnStack.length=0;
    document.body.classList.add('game-active','fullscreen-mode');
    document.body.dataset.stage=stageDef().key;
    try{ ensureFullscreenUi(); ensureMobileActionPad(); setMobilePlayMode(); }catch(err){ console.warn('[AV] mobile setup skipped', err); }
    const app=document.getElementById('app');
    if(app) app.classList.remove('hidden');
    try{ canvas && canvas.focus && canvas.focus({preventScroll:true}); }catch(err){}
    // Open the story before render/audio/save work, so unrelated errors cannot cancel it.
    const afterIntro=()=>{
      ensureStoryFlags();
      state.flags.storySeen.intro=true;
      save(true);
      requestNativeFullscreen();
      try{ pulseObjective(currentObjectiveText()); }catch(err){}
      try{ showTutorialTip('move-route','Movement + Route Beacon','Move with WASD / arrow keys, mobile arrows, or a controller. Follow the glowing route line and minimap path to the next objective.','Press N to ping the target. Press E near Fermilat to talk.'); }catch(err){}
    };
    showOpeningStoryRoot(afterIntro);
    try{ renderAll(); }catch(err){ console.error('[AV] render after new game failed but story was already opened:', err); }
    try{ unlockRadioTrack(musicKeyForStage()); AudioManager.play(activeMusicForState()); }catch(err){ console.warn('[AV] audio/radio skipped', err); }
    try{ save(true); }catch(err){}
    return true;
  }

  document.addEventListener('fullscreenchange',()=>{
    if(storyActive){
      const overlay=$('storyOverlay');
      if(overlay){ mountStoryOverlay(overlay); applyStoryOverlaySafety(overlay); }
    }
  });
  function showStory(key, after){
    ensureStageStoryScenes();
    const scene = STORY_SCENES[key];
    if(!scene){ if(after) after(); return; }
    storyActive=true; pendingStoryAfter=after||null;
    let i=0;
    let overlay=$('storyOverlay');
    if(!overlay){
      overlay=document.createElement('div');
      overlay.id='storyOverlay';
      overlay.className='story-overlay hidden';
      overlay.innerHTML=`<div class="story-card avos-crt"><div class="story-kicker" id="storyKicker"></div><div class="story-scene-title" id="storySceneTitle"></div><div class="story-scene-tag" id="storySceneTag"></div><div class="story-body"><img src="assets/operators/av001/portrait.png" alt="Vyra portrait"><div><div class="story-speaker" id="storySpeaker"></div><p id="storyLine"></p></div></div><div class="story-actions"><button id="storyNext">Continue</button><button id="storySkip">Skip</button></div><div class="story-controller-tip" id="storyControllerTip"></div></div>`;
      document.body.appendChild(overlay);
      $('storyNext').onclick=advanceStory;
      $('storySkip').onclick=finishStory;
    }
    mountStoryOverlay(overlay);
    applyStoryOverlaySafety(overlay);
    const storyPortrait = document.querySelector('#storyOverlay .story-body img');
    const lineData = raw => {
      if(raw && typeof raw === 'object') return raw;
      const speaker = scene.speaker || (key.startsWith('fermilat') ? 'FERMILAT' : 'VYRA');
      return {speaker, portrait:key.startsWith('fermilat') ? 'fermilat' : 'vyra', text:String(raw || '')};
    };
    const portraitSrc = line => line.portrait === 'fermilat' || String(line.speaker||'').toUpperCase().includes('FERMILAT')
      ? NPC_DEFS.fermilat.asset
      : currentOperator().portrait;
    $('storyKicker').textContent=scene.kicker;
    const card = overlay.querySelector('.story-card');
    if(card){ card.classList.toggle('opening-story-card', scene.variant === 'opening'); }
    overlay.dataset.variant = scene.variant || 'standard';
    if($('storySceneTitle')){ $('storySceneTitle').textContent = scene.title || ''; $('storySceneTitle').style.display = scene.title ? '' : 'none'; }
    if($('storySceneTag')){ $('storySceneTag').textContent = scene.tag || ''; $('storySceneTag').style.display = scene.tag ? '' : 'none'; }
    if($('storyControllerTip')){ const l=ControllerManager.labels(); $('storyControllerTip').innerHTML = `Controller: <b>${l.south}</b> continue / confirm, D-pad hover, <b>${l.east}</b> skip`; }
    overlay.style.zIndex='120000';
    overlay.style.display='grid';
    overlay.style.pointerEvents='auto';
    overlay.classList.remove('hidden');
    document.body.classList.add('story-open');
    requestAnimationFrame(()=>{ mountStoryOverlay(overlay); applyStoryOverlaySafety(overlay); });
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
  function advanceStory(){ const overlay=$('storyOverlay'); if(overlay && overlay._advance) overlay._advance(); else { const btn=document.getElementById('storyRootNext') || document.getElementById('storyNext'); if(btn) btn.click(); } }
  function finishStory(){
    const overlay=$('storyOverlay');
    if(overlay){ overlay.classList.add('hidden'); overlay.style.display=''; }
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
    const goal=requiredAnomaliesForStage();
    const cleared=Math.min(goal, state.flags.anomaliesCleared || 0);
    if(cleared < goal) return `Objective: Clear anomaly signatures (${cleared}/${goal}).`;
    if(!state.flags.bossDefeated) return `Objective: Boss route open. Defeat the ${def.id} guardian.`;
    if(!state.flags.chapterComplete) return 'Objective: Extract through the white exit marker.';
    return `${def.id} complete. Use Fracture Index to select the next stage.`;
  }


  // v104: clearer route guidance for testers and new players.
  function objectiveStepIndex(){
    if(!state.flags.terminal) return 0;
    if(Math.min(requiredAnomaliesForStage(),state.flags.anomaliesCleared||0) < requiredAnomaliesForStage()) return 1;
    if(!state.flags.bossUnlocked) return 2;
    if(!state.flags.bossDefeated) return 3;
    if(!state.flags.chapterComplete) return 4;
    return 5;
  }
  function objectiveStepLabel(){
    return ['Sync terminal','Clear anomalies','Open boss gate','Defeat boss','Extract','Stage complete'][objectiveStepIndex()] || 'Unknown';
  }
  function objectiveGuideText(){
    const target=objectiveTarget();
    const def=stageDef();
    if(!target) return 'No active target. Open the Mission Briefing if you need to review the route.';
    if(target.kind==='complete'){
      const next=def.nextKey ? STAGE_DEFS[def.nextKey] : null;
      return next ? `${def.id} complete. Next route: ${next.id} // ${next.title}.` : `${def.id} complete. More routes are coming soon.`;
    }
    const action = ({
      terminal:'Reach the recovery terminal and sync the archive.',
      anomaly:`Erase the nearest anomaly signature. ${requiredAnomaliesForStage()} are required before the boss route opens.`,
      boss:'Boss route is active. Defeat the guardian and recover the core.',
      exit:'Core recovered. Reach the white extraction marker.'
    })[target.kind] || 'Follow the active objective beacon.';
    return `${action} Target: ${target.label} ${target.arrow} ${target.distance} tiles.`;
  }
  function objectiveGuideHtml(){
    const target=objectiveTarget();
    const step=objectiveStepLabel();
    const path=routePathToObjective();
    const routeLine = state.settings.routeBeacon === false ? 'route beacon hidden in settings' : (path.length > 1 ? `${path.length-1} walkable steps` : 'route pending');
    const targetLine = target ? `${safeHtml(target.label)} // ${safeHtml(target.arrow||'•')} ${Number(target.distance||0)} tiles` : 'No active target';
    return `<div class="mission-row"><b>Current Step:</b> ${safeHtml(step)}</div><div class="mission-row"><b>Target:</b> ${targetLine}</div><div class="mission-row"><b>Route:</b> ${safeHtml(routeLine)}</div><div class="mission-row"><b>Guide:</b> ${safeHtml(objectiveGuideText())}</div><div class="mission-row">Press <b>N</b> or click the target compass to ping the objective.</div>`;
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
    else if(Math.min(requiredAnomaliesForStage(),state.flags.anomaliesCleared||0) < requiredAnomaliesForStage()) target={...nearestTile('E'), label:'Nearest Anomaly', kind:'anomaly'};
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

  // v105: route beacon pathing. This draws a subtle breadcrumb route to the current objective
  // while keeping the actual walls/floors easy to read.
  function tileWalkableForRoute(x,y,target){
    const c=tileAt(x,y);
    if(!isKnownMapTile(c) || c==='#') return false;
    if(!collisionRegion().set.has(`${x},${y}`)) return false;
    if(c==='D' && !(state.flags.bossUnlocked || state.flags.anomaliesCleared>=requiredAnomaliesForStage() || state.flags.key) && !(target && target.x===x && target.y===y)) return false;
    if(c!=='D' && !canStandAt(x,y)) return false;
    return true;
  }
  function routePathToObjective(){
    const target=objectiveTarget();
    if(!target || target.kind==='complete' || target.x == null || target.y == null) return [];
    const start={x:state.player.x,y:state.player.y};
    const goal={x:target.x,y:target.y};
    if(start.x===goal.x && start.y===goal.y) return [start];
    const key=(x,y)=>`${x},${y}`;
    const q=[start];
    const seen=new Set([key(start.x,start.y)]);
    const prev=new Map();
    const dirs=[[1,0],[-1,0],[0,1],[0,-1]];
    let found=false;
    while(q.length){
      const cur=q.shift();
      if(cur.x===goal.x && cur.y===goal.y){ found=true; break; }
      for(const [dx,dy] of dirs){
        const nx=cur.x+dx, ny=cur.y+dy, k=key(nx,ny);
        if(seen.has(k)) continue;
        if(!inMapBounds(nx,ny) || !tileWalkableForRoute(nx,ny,goal)) continue;
        seen.add(k);
        prev.set(k, cur);
        q.push({x:nx,y:ny});
      }
    }
    if(!found) return [];
    const path=[];
    let cur=goal;
    while(cur){
      path.push(cur);
      if(cur.x===start.x && cur.y===start.y) break;
      cur=prev.get(key(cur.x,cur.y));
    }
    return path.reverse();
  }
  function drawObjectiveRoute(){
    ensureSettings();
    if(state.settings.routeBeacon === false) return;
    const path=routePathToObjective();
    if(path.length < 2) return;
    const target=objectiveTarget();
    const color = target?.kind==='boss' ? 'rgba(255,48,72,.82)' : target?.kind==='exit' ? 'rgba(255,255,255,.78)' : 'rgba(0,217,255,.78)';
    const fill = target?.kind==='boss' ? 'rgba(255,48,72,.18)' : target?.kind==='exit' ? 'rgba(255,255,255,.16)' : 'rgba(0,217,255,.16)';
    ctx.save();
    ctx.lineWidth=3;
    ctx.lineCap='round';
    ctx.lineJoin='round';
    ctx.shadowColor=color;
    ctx.shadowBlur=9;
    ctx.strokeStyle=color;
    ctx.beginPath();
    path.forEach((p,i)=>{
      const cx=p.x*TILE+TILE/2, cy=p.y*TILE+TILE/2;
      if(i===0) ctx.moveTo(cx,cy);
      else ctx.lineTo(cx,cy);
    });
    ctx.stroke();
    ctx.shadowBlur=0;
    path.forEach((p,i)=>{
      if(i===0 || i===path.length-1 || i%2!==0) return;
      const cx=p.x*TILE+TILE/2, cy=p.y*TILE+TILE/2;
      ctx.fillStyle=fill;
      ctx.beginPath();
      ctx.arc(cx,cy,5,0,Math.PI*2);
      ctx.fill();
    });
    ctx.restore();
  }
  function drawCheckpointBeacon(){
    const cp=checkpointInfo();
    if(!cp.ok || cp.x == null || cp.y == null) return;
    const snapStage=cp.stage;
    const def=stageDef();
    if(snapStage !== def.id) return;
    const cx=cp.x*TILE+TILE/2;
    const cy=cp.y*TILE+TILE/2;
    const pulse=(Math.sin(Date.now()/260)+1)/2;
    ctx.save();
    ctx.strokeStyle='rgba(148,255,98,.72)';
    ctx.fillStyle='rgba(148,255,98,.12)';
    ctx.lineWidth=2;
    ctx.shadowColor='rgba(148,255,98,.8)';
    ctx.shadowBlur=8;
    ctx.beginPath(); ctx.arc(cx,cy,10+pulse*4,0,Math.PI*2); ctx.fill(); ctx.stroke();
    ctx.shadowBlur=0;
    ctx.font='10px monospace';
    ctx.textAlign='center';
    ctx.fillStyle='rgba(210,255,190,.95)';
    ctx.fillText('CP',cx,cy+3);
    ctx.restore();
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
    ensureSettings();
    const target=objectiveTarget();
    if(state.settings.objectiveCompass === false || !target || $('app').classList.contains('hidden') || battle){ c.classList.add('hidden'); return; }
    c.classList.remove('hidden');
    c.dataset.kind=target.kind || 'target';
    c.innerHTML=`<b>${safeHtml(target.arrow||'•')}</b><span>${safeHtml(target.label)}</span><em>${Number(target.distance||0)} tiles</em>`;
  }
  function showObjectivePing(){
    const target=objectiveTarget();
    if(!target){ toast('No active target.'); return; }
    toast(`${objectiveStepLabel()}: ${target.label} ${target.arrow} ${target.distance||0} tiles`);
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
      if(def.key==='f004'){ addItem('Vector Cell',3); addItem('Burnt Alloy',3); addItem('Transit Nexus Core',1); }
      if(def.key==='f005'){ addItem('Vector Cell',3); addItem('Prism Wound Core',1); addItem('Corrupted Catalyst',2); }
      if(def.key==='f006'){ addItem('Vector Cell',4); addItem('Vector Heart Core',1); addItem('Rust Core',3); }
      if(def.clearXp) gainXp(def.clearXp);
      recordDrop(`${def.id} Clear Reward`, 'Stage Clear', 'Legendary');
      state.flags.chapterRewardsClaimed=true;
    }
    state.flags.chapterComplete=true;
    state.flags.chapterClearSeen=true;
    state.stages[def.key] ||= {unlocked:true,complete:false};
    state.stages[def.key].complete=true;
    advanceProtocolChallenge('fractures',1);
    unlockNextStages();
    SfxManager.levelWin();
    log(`${def.id} complete: Core recovered. Rewards delivered to inventory.`);
    save(true); renderAll();
    const clearStoryKey = `${def.key}Clear`;
    if(STORY_SCENES[clearStoryKey] && !state.flags.storySeen?.[clearStoryKey]){
      showStoryOnce(clearStoryKey, showChapterClearPanel);
    } else {
      showChapterClearPanel();
    }
  }

  function chapterClearStoryCopy(def){
    return ({
      f001:'Grave Core secured. Vyra is awake, AVOS is still annoying, and the route to Ash Wastes Outpost is now visible.',
      f002:'Outpost Core secured. The broken signal is no longer jamming the route map, but it exposed the Neon Graveyard frequency.',
      f003:'Shade Core secured. The dead frequency is silent, and the Transit Ruins route is now visible.',
      f004:'Transit Nexus Core secured. The Ashline tunnels are stable, and Glass Storm Lab is now exposed.',
      f005:'Prism Wound Core secured. The lab stopped reflecting threats, and Vector Core Spire is now awake.',
      f006:'Vector Heart Core secured. The current route chain is stable, and the Cinder Express Yard is now visible.',
      f007:'Cinderline Core secured. The rail fire is contained, and the Flooded Data Vault is now reachable.',
      f008:'Drowned Archive Core secured. The vault stops leaking memories, and Rust Orchard is now mapped.',
      f009:'Harvest Alloy Core secured. The orchard is stable, and Blacksite Observatory is now exposed.',
      f010:'Parallax Lens Core secured. The sky stops watching for one second, and Cryo Basilica opens.',
      f011:'Basilica Wyrm Core secured. The ice route is clear, and Ash Crown Citadel is now online.',
      f012:'Ash Crown Core secured. Route chain 12/20 is stabilized. Eight endgame fractures remain for future expansion.'
    })[def.key] || `${def.title} cleared. Core stabilized.`;
  }

  function showChapterClearPanel(){
    const def=stageDef();
    const order=Object.keys(STAGE_DEFS);
    const nextKey=def.nextKey || order[order.indexOf(def.key)+1];
    const next=nextKey ? STAGE_DEFS[nextKey] : null;
    unlockNextStages();
    const nextReady = !!next && playerMeetsStageRequirement(next.key);
    let panel=$('chapterClearOverlay');
    if(!panel){
      panel=document.createElement('div');
      panel.id='chapterClearOverlay';
      panel.className='overlay chapter-clear-overlay hidden';
      panel.innerHTML=`<div class="chapter-clear-card avos-crt"><div class="record-kicker" id="chapterClearKicker"></div><h2 id="chapterClearTitle"></h2><p id="chapterClearCopy"></p><div class="victory-loot chapter-rewards" id="chapterRewardList"></div><div class="story-actions"><button id="chapterContinueBtn">Continue Exploring</button><button id="chapterNextBtn">Start Next Fracture</button><button id="chapterMenuBtn">Return to Main Menu</button></div></div>`;
      document.body.appendChild(panel);
    }
    // v98: these handlers must refresh every time this panel opens.
    // Earlier builds created the overlay once and kept the first route in the button closure.
    // That made clearing F-002 send the player back to F-002 instead of forward to F-003.
    $('chapterContinueBtn').onclick=()=>{ panel.classList.add('hidden'); uiState.mode='game'; $('app').classList.remove('hidden'); AudioManager.play(activeMusicForState()); renderAll(); };
    $('chapterNextBtn').onclick=()=>{
      const liveDef=stageDef();
      const liveOrder=Object.keys(STAGE_DEFS);
      const liveNextKey=liveDef.nextKey || liveOrder[liveOrder.indexOf(liveDef.key)+1];
      const liveNext=liveNextKey ? STAGE_DEFS[liveNextKey] : null;
      unlockNextStages();
      const liveReady = !!liveNext && playerMeetsStageRequirement(liveNext.key);
      if(liveReady){ panel.classList.add('hidden'); loadStage(liveNext.key); }
      else if(liveNext){ toast(`${liveNext.id} requires Player Lv. ${liveNext.levelReq} and previous stage clear.`); }
      else toast('Next fracture coming soon.');
    };
    $('chapterMenuBtn').onclick=()=>{ panel.classList.add('hidden'); gameStarted=false; showMenu(); };
    $('chapterClearKicker').textContent=`STAGE COMPLETE // ${def.id} STABILIZED`;
    $('chapterClearTitle').textContent=def.chapter.replace(/^Chapter \d+ \/\/\s*/, '').toUpperCase();
    $('chapterClearCopy').textContent=`${chapterClearStoryCopy(def)} ${next ? (nextReady ? next.id+' is available now.' : next.id+' requires Player Lv. '+next.levelReq+'. Train more if it is locked.') : 'More fractures are coming in a future build.'}`;
    const rewards=[`${def.rewardCredits||50} Credits`, `${def.clearXp||0} Sync XP`, def.key==='f003'?'Rust Core x2':'Rust Core', `Operator Shard: Vyra x${def.rewardShards||3}`, def.key==='f003'?'Corrupted Catalyst x2':'Corrupted Catalyst'];
    if(def.key==='f002') rewards.push('Keycard LV1','Outpost Access Chip','Burnt Alloy x3');
    if(def.key==='f003') rewards.push('Vector Cell x2','Duskwither Wraith Core');
    if(def.key==='f004') rewards.push('Vector Cell x3','Burnt Alloy x3','Transit Nexus Core');
    if(def.key==='f005') rewards.push('Vector Cell x3','Prism Wound Core','Corrupted Catalyst x2');
    if(def.key==='f006') rewards.push('Vector Cell x4','Vector Heart Core','Rust Core x3');
    $('chapterRewardList').innerHTML=rewards.map(name=>`<div class="victory-loot-item"><span>${safeHtml(name)}</span></div>`).join('');
    const btn=$('chapterNextBtn'); if(btn){ btn.disabled=!next; btn.textContent=next ? (nextReady?`Start ${next.id}`:`${next.id} Locked: Lv. ${next.levelReq}`) : 'Next Fracture Coming Soon'; }
    panel.classList.remove('hidden');
    showTutorialTip('stage-clear','Stage Clear + Next Fracture','After clearing a level, use Start Next Fracture or the Fracture Index to move forward. The Story Archive will keep unlocked scenes for replay.','QA tools can also jump levels from the Playtest Console.');
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
    battleCommandIndex = 0;
    uiState.mode='combat'; unlockRadioTrack(code==='B'?'boss':'battle'); AudioManager.play(code==='B'?'boss':'battle');
    $('battleTitle').textContent=`${def.id || 'AN'} // ${def.name}`;
    if($('battleEnemyLabel')) $('battleEnemyLabel').textContent = def.id || 'ANOMALY';
    $('battleEnemy').src=def.img;
    $('battleEnemy').onerror=()=>{ $('battleText').textContent='Creature art missing: '+def.img; };
    $('battleHero').src=currentOperator().battle;
    if($('battleHeroLabel')) $('battleHeroLabel').textContent=`${currentOperator().code} ${String(currentOperator().displayName||'').toUpperCase()}`;
    $('battleText').textContent='Choose a combat protocol.';
    $('battleVictory')?.classList.add('hidden');
    $('battlePanel')?.classList.remove('battle-shake');
    document.addEventListener('fullscreenchange',()=>{ if(!document.fullscreenElement) document.body.classList.remove('fullscreen-mode'); });
    leaveBattleVictoryMode();
    setBattleMobileMode(true);
    document.querySelectorAll('.overlay').forEach(o=>o.classList.add('hidden'));
    $('battleOverlay').classList.remove('hidden');
    const enemyImg=$('battleEnemy'), heroImg=$('battleHero');
    [enemyImg, heroImg].forEach(img=>{ if(img){ img.style.display='block'; img.style.visibility='visible'; img.style.opacity='1'; } });
    renderBattle();
    showTutorialTip('battle-basics','Battle Basics','Use the four main attack buttons to deal damage. Save EP for healing or stronger protocols, and use Guard when HP gets low.','Controller face buttons map to the four attacks. LT/L2 uses Vector Cell, RB/R1 guards, RT/R2 uses Overdrive.');
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
      <div class="battle-meter hero-meter"><div><b>${currentOperator().displayName}</b><span>${currentOperator().code} // Lv ${state.player.level} // HP ${state.player.hp}/${combatStatBlock().maxHp}${playerStatusText?' // '+playerStatusText:''}</span></div><div class="bar big"><span style="width:${heroPct}%"></span></div></div>
      <div class="battle-meter ep-meter"><div><b>Energy</b><span>EP ${state.player.ep}/${epMax}</span></div><div class="bar big ep"><span style="width:${epPct}%"></span></div></div>
      <div class="battle-meter ep-meter"><div><b>Overdrive</b><span>${state.player.overdrive || 0}/${state.player.maxOverdrive || 100}${overdriveReady()?' // READY':''}</span></div><div class="bar big ep"><span style="width:${overdrivePct()}%"></span></div></div>
      <div class="battle-meter focus-meter"><b>Focus</b><span>${skillList[mod.focus].name} Lv. ${mod.level} // Gear ${gearPower()}</span></div>
      <div class="battle-meter scanner-meter"><b>AVOS Scanner</b><span>${safeHtml(battleTacticalAdvice().title)} // ${safeHtml(battleTacticalAdvice().text)}</span></div>
      <div class="battle-meter scanner-meter"><b>Enemy Intent</b><span>${safeHtml(enemyIntentPreview().title)} // ${safeHtml(enemyIntentPreview().text)}</span></div>`;
    $('attackButtons').innerHTML='';
    const labels=safeControllerLabels();
    // v94: four main battle attacks map to the four face buttons (Xbox A/B/X/Y, PS Cross/Circle/Square/Triangle, Switch B/A/Y/X).
    const controllerDirect=[labels.south, labels.east, labels.west, labels.north];
    const addCommandButton=(className, glyph, title, meta, disabled, action)=>{
      const b=document.createElement('button');
      if(className) b.className=className;
      b.innerHTML=`<span class="controller-glyph">${safeHtml(glyph)}</span><b>${safeHtml(title)}</b><span>${safeHtml(meta)}</span>`;
      b.disabled=!!disabled;
      b.onclick=action;
      $('attackButtons').appendChild(b);
      return b;
    };
    activeBattleMoves().forEach((a,i)=>{
      const cost=Math.max(0,a.ep-mod.epDiscount);
      addCommandButton('', controllerDirect[i], a.name, `${cost?cost+' EP':'Free'} // ${a.heal?'Recovery':'Strike'}`, state.player.ep<cost || battle.turn!=='player', ()=>playerAttack(i));
    });
    const cellQty=state.inventory['Vector Cell']||0;
    addCommandButton('battle-item-button', 'LT/L2/ZL', 'Use Vector Cell', `${cellQty} owned // Restore EP`, !cellQty || state.player.ep>=epMax || battle.turn!=='player', useVectorCellBattle);
    addCommandButton('battle-guard-button', 'RB/R1/R', 'Guard', `block next hit + regain 2 EP`, battle.turn!=='player', guardBattle);
    addCommandButton('battle-overdrive-button', 'RT/R2/ZR', 'Null Vector Execution', `Overdrive ${state.player.overdrive || 0}/${state.player.maxOverdrive || 100}`, battle.turn!=='player' || !overdriveReady(), useOverdriveBattle);
    const hint=document.createElement('div');
    hint.id='battleControllerHint';
    hint.className='battle-controller-hint';
    hint.innerHTML=`Face buttons launch attacks: <b>${safeHtml(labels.south)}</b>/<b>${safeHtml(labels.east)}</b>/<b>${safeHtml(labels.west)}</b>/<b>${safeHtml(labels.north)}</b> // D-pad moves cursor // <b>${safeHtml(labels.start)}</b> chooses highlighted // <b>T</b> scanner + enemy intent`;
    $('attackButtons').appendChild(hint);
    updateBattleCommandFocus();
  }
  function safeControllerLabels(){
    const fallback={south:'A', east:'B', west:'X', north:'Y', start:'Start', select:'View'};
    const mgr=window.AV && window.AV.ControllerManager;
    try{ return (mgr && mgr.labels) ? mgr.labels() : fallback; }catch(err){ return fallback; }
  }
  function battleCommandButtons(){
    const root=$('attackButtons');
    if(!root) return [];
    return Array.from(root.querySelectorAll('button'));
  }
  function updateBattleCommandFocus(){
    const buttons=battleCommandButtons();
    if(!buttons.length) return;
    if(battleCommandIndex >= buttons.length) battleCommandIndex = Math.max(0, buttons.length-1);
    if(battleCommandIndex < 0) battleCommandIndex = 0;
    buttons.forEach((btn,i)=>{ btn.classList.toggle('controller-selected', i===battleCommandIndex); btn.setAttribute('aria-selected', i===battleCommandIndex?'true':'false'); });
    if(battle && battle.turn === 'player'){
      try{ buttons[battleCommandIndex]?.focus({preventScroll:true}); }catch(err){}
    }
  }
  function moveBattleCommand(dx=0,dy=0){
    const buttons=battleCommandButtons();
    if(!buttons.length || !battle || battle.turn!=='player') return;
    const cols=2;
    let next=battleCommandIndex;
    if(dx) next += dx;
    if(dy) next += dy*cols;
    next = (next % buttons.length + buttons.length) % buttons.length;
    for(let attempts=0; attempts<buttons.length; attempts++){
      if(!buttons[next].disabled) break;
      next = (next + (dx<0 || dy<0 ? -1 : 1) + buttons.length) % buttons.length;
    }
    battleCommandIndex=next;
    updateBattleCommandFocus();
  }
  function selectBattleCommand(){
    const buttons=battleCommandButtons();
    const btn=buttons[battleCommandIndex];
    if(!btn) return;
    if(btn.disabled){ toast('That combat protocol is unavailable.'); updateBattleCommandFocus(); return; }
    btn.click();
  }
  function triggerBattleCommand(index){
    const buttons=battleCommandButtons();
    if(buttons[index]){ battleCommandIndex=index; updateBattleCommandFocus(); selectBattleCommand(); }
  }
  function playerAttack(i){
    if(!battle||battle.turn!=='player')return;
    const a=activeBattleMoves()[i]; const mod=combatModifiers(); const cost=Math.max(0,a.ep-mod.epDiscount);
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
      let specialText='';
      if(a.special==='evade'){ battle.evadeNext=true; specialText=' Evade primed.'; }
      if(a.special==='guard'){ battle.guard=true; specialText=' Guard primed.'; }
      if(a.special==='loot' && Math.random()<0.22){ addCredits(2); specialText=' +2 scavenged credits.'; }
      const statusNote = a.status ? addBattleStatus('enemy', a.status, 2, Math.max(2, Math.floor(dmg/8))) : applyPlayerStatusFromAttack(i,dmg);
      $('battleText').textContent=`${a.text} ${crit?'CRITICAL ':''}-${dmg} HP. ${skillList[mod.focus].name} +${Math.max(3,Math.floor(dmg/3))} XP.${statusNote?' '+statusNote:''}${specialText}`;
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
    const defeatedBy = battle.enemy?.name || 'Unknown anomaly';
    const defeatedId = battle.enemy?.id || 'ANOMALY';
    const stage = stageDef();
    const anomalyCount = Math.min(3, state.flags.anomaliesCleared || 0);
    const hadCheckpoint = !!state.checkpoint?.snapshot;
    const checkpointLabel = state.checkpoint?.label || 'Fracture Entry';
    battle.turn='defeated';
    setBattleMobileMode(false);
    leaveBattleVictoryMode();
    state.deaths = (state.deaths || 0) + 1;
    state.player.hp = 0;
    SfxManager.death();
    AudioManager.stopMusic();
    $('battleText').textContent = 'Vyra has fallen. Archive synchronization failed.';
    renderBattle();
    const panel=$('battleVictory');
    const retryLabel = hadCheckpoint ? `Safe Reboot: ${safeHtml(checkpointLabel)}` : 'Restart Fracture';
    panel.innerHTML = `<div class="victory-card defeat-card"><div class="record-kicker">DEFEAT REPORT // OPERATOR DOWN</div><h2>ARCHIVE COLLAPSE</h2><p>Vyra was overwhelmed by ${safeHtml(defeatedBy)}. AVOS prepared a safer reboot route.</p><div class="record-grid"><div><b>Defeated By</b><span>${safeHtml(defeatedId)} // ${safeHtml(defeatedBy)}</span></div><div><b>Fracture</b><span>${safeHtml(stage.id)} // ${safeHtml(stage.title)}</span></div><div><b>Progress Kept</b><span>Anomalies ${anomalyCount}/3 // Boss ${state.flags.bossDefeated?'Defeated':'Pending'}</span></div><div><b>Recovery Point</b><span>${hadCheckpoint ? safeHtml(checkpointLabel) : 'No checkpoint snapshot. Restarting current fracture.'}</span></div><div><b>Reboot Rule</b><span>Retry restores HP/EP for playtest flow. Inventory and progress stay local-save based.</span></div><div><b>Total Defeats</b><span>${state.deaths}</span></div></div><div class="protocol-list"><div><b>AVOS Tip</b><span>Use Guard when Enemy Intent predicts a heavy hit. Save Vector Cells for low EP or boss fights.</span></div><div><b>Route Tip</b><span>Recovery terminals and heal stations are your safest checkpoint path.</span></div></div><button id="deathRetryBtn">${retryLabel}</button><button id="deathRestartStageBtn">Restart Current Fracture</button><button id="deathMenuBtn">Return to Main Menu</button></div>`;
    panel.classList.remove('hidden');

    const recoverPlayerVitals=()=>{
      const caps=combatStatBlock();
      state.player.hp = caps.maxHp;
      state.player.ep = caps.maxEp || state.player.maxEp;
      state.player.overdrive = Math.min(state.player.maxOverdrive || 100, Math.max(state.player.overdrive || 0, 20));
      toast('Emergency reboot complete. HP/EP restored.');
    };

    const closeDeathPanel=()=>{
      battle=null;
      setBattleMobileMode(false);
      leaveBattleVictoryMode();
      uiState.mode='game';
      panel.classList.add('hidden');
      $('battleOverlay').classList.add('hidden');
      $('app').classList.remove('hidden');
      document.body.classList.add('game-active','fullscreen-mode');
      renderAll();
      AudioManager.play(activeMusicForState());
      pulseObjective(currentObjectiveText());
      save(true);
    };

    const retry=$('deathRetryBtn');
    const restart=$('deathRestartStageBtn');
    const menu=$('deathMenuBtn');

    if(retry) retry.onclick=()=>{
      const restored=restoreCheckpoint();
      if(!restored){
        loadStage(stage.key, {force:true});
        recoverPlayerVitals();
        battle=null;
        setBattleMobileMode(false);
        panel.classList.add('hidden');
        $('battleOverlay').classList.add('hidden');
        return;
      }
      recoverPlayerVitals();
      closeDeathPanel();
    };

    if(restart) restart.onclick=()=>{
      battle=null;
      setBattleMobileMode(false);
      panel.classList.add('hidden');
      $('battleOverlay').classList.add('hidden');
      loadStage(stage.key, {force:true});
      recoverPlayerVitals();
      renderAll();
      save(true);
    };

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
      advanceProtocolChallenge('anomalies',1);
      advanceProtocolChallenge('victories',1);
      scheduleEncounterRespawn('E', battle.x, battle.y, e.name);
    }
    if(wasAnomaly && state.flags.anomaliesCleared >= requiredAnomaliesForStage() && !state.flags.bossUnlocked){state.flags.bossUnlocked=true; log('AVOS forced the boss route open. Somebody in security is getting demoted.'); pulseObjective(currentObjectiveText());}
    if(wasBoss){state.flags.bossUnlocked=true; state.flags.bossDefeated=true; state.bossKills ||= {}; state.bossKills[stageDef().key]=(state.bossKills[stageDef().key]||0)+1; advanceProtocolChallenge('bosses',1); advanceProtocolChallenge('victories',1); loot.push('Corrupted Catalyst'); addItem('Corrupted Catalyst',1); recordDrop('Corrupted Catalyst', battle.enemy.name, 'Epic'); const bossReward=battle.enemy.bossReward || (stageDef().key==='f002'?'Ashveil Mother Core':'Toxic Monarch Relic'); if(!state.inventory[bossReward]){ loot.push(bossReward); addItem(bossReward,1); recordDrop(bossReward, battle.enemy.name, 'Relic'); }}
    const gearDrop = (!wasBoss && Math.random() < 0.42) ? pickGearDrop(false) : (wasBoss ? pickGearDrop(true) : null);
    if(gearDrop && !loot.includes(gearDrop.name)){ loot.push(gearDrop.name); addItem(gearDrop.name,1); recordDrop(gearDrop.name, battle.enemy.name, gearDrop.rarity || 'Rare'); }
    const cellQty = wasBoss ? 2 : (wasAnomaly && Math.random()<0.38 ? 1 : 0);
    if(cellQty){
      for(let i=0;i<cellQty;i++) loot.push('Vector Cell');
      addItem('Vector Cell', cellQty);
    }
    const characterShardDrop = maybeDropOperatorShard(wasBoss, e.name);
    if(characterShardDrop) loot.push(characterShardDrop);
    const xpGain = Math.floor(e.xp * (1 + (combatStatBlock().xpBonus||0)));
    gainXp(xpGain); gainOperatorXp(Math.max(8, Math.floor(xpGain * 0.75))); grantStyleXp(state.combatStyle || 'attack', xpGain); addCredits(e.credits); e.loot.forEach(item=>addItem(item,1));
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
  function enterBattleVictoryMode(){
    document.body.classList.remove('battle-mode');
    document.body.classList.add('battle-victory-mode');
    const pad=$('mobileBattlePad');
    if(pad) pad.style.display='none';
    const attackRoot=$('attackButtons');
    if(attackRoot) attackRoot.innerHTML='';
    document.querySelectorAll('#battleOverlay .battle-command-panel, #battleOverlay .battle-ui').forEach(el=>el.classList.add('victory-hidden'));
  }
  function leaveBattleVictoryMode(){
    document.body.classList.remove('battle-victory-mode');
    const pad=$('mobileBattlePad');
    if(pad) pad.style.display='';
    document.querySelectorAll('#battleOverlay .victory-hidden').forEach(el=>el.classList.remove('victory-hidden'));
  }

  function showVictoryPanel(enemy, loot, meta={}){
    enterBattleVictoryMode();
    const panel=$('battleVictory');
    const lootCounts = (loot||[]).reduce((acc,name)=>{ acc[name]=(acc[name]||0)+1; return acc; }, {});
    const lootEntries = Object.entries(lootCounts);
    const nextLabel = meta.wasBoss ? 'Recover Core / Continue' : 'Return to Fracture';
    const research = researchLineForCreature({id:enemy.id, name:enemy.name, type:meta.wasBoss?'Boss':'Anomaly'});
    const contract = activeContract();
    const objective = currentObjectiveText();
    const anomalyCount = Math.min(3, state.flags.anomaliesCleared || 0);
    const epMax = combatStatBlock().maxEp || state.player.maxEp;
    const xpGain = Math.floor(enemy.xp * (1 + (combatStatBlock().xpBonus||0)));
    const requiredAnomalyGoal=requiredAnomaliesForStage();
    const missionNext = meta.wasBoss
      ? 'Boss defeated. Reach the white extraction marker to finish the fracture.'
      : (anomalyCount>=requiredAnomalyGoal ? `${requiredAnomalyGoal} anomalies cleared. Boss route is open.` : `Clear ${requiredAnomalyGoal-anomalyCount} more anomal${requiredAnomalyGoal-anomalyCount===1?'y':'ies'} to open the boss route.`);
    const lootHtml = lootEntries.map(([name,qty])=>{
      const item=findItemRecord(name);
      return `<div class="victory-loot-item ${rarityClass(item.rarity)}">${itemIconHtml(item,qty)}<span>${safeHtml(name)}${qty>1?` x${qty}`:''}</span></div>`;
    }).join('') || '<span>No loot recovered.</span>';
    panel.innerHTML = `<div class="victory-card mobile-fit-victory-card"><div class="record-kicker">VICTORY REPORT // THREAT NEUTRALIZED</div><h2>${safeHtml(enemy.name)}</h2><p>Synchronization +${xpGain} // Credits +${enemy.credits}</p><button id="continueBattleBtnTop" class="victory-continue-sticky">${nextLabel}</button><div class="record-grid"><div><b>Mission Next</b><span>${safeHtml(missionNext)}</span></div><div><b>Current Objective</b><span>${safeHtml(objective)}</span></div><div><b>Anomalies</b><span>${anomalyCount}/${requiredAnomalyGoal} // Boss Route ${state.flags.bossUnlocked?'Open':'Locked'}</span></div><div><b>Vyra Status</b><span>HP ${state.player.hp}/${combatStatBlock().maxHp} // EP ${state.player.ep}/${epMax}</span></div><div><b>Research</b><span>Rank ${research.rank} // ${safeHtml(research.text)}</span></div><div><b>Contract</b><span>${safeHtml(contract.title)} // ${contract.progress}/${contract.target}${contract.complete?' // Ready to claim':''}</span></div><div><b>Side Quest</b><span>${safeHtml(sideQuestStatusText())}</span></div><div><b>Protocol Challenges</b><span>${safeHtml(protocolChallengeSummaryText())}</span></div><div><b>Enemy File</b><span>${safeHtml(enemy.id || 'ANOMALY')} // ${meta.wasBoss?'Boss':'Anomaly'}</span></div></div><h3>Recovered Loot</h3><div class="victory-loot">${lootHtml}</div><button id="continueBattleBtn" class="victory-continue-bottom">${nextLabel}</button></div>`;
    panel.classList.remove('hidden');
    const continueVictory=()=>{
      leaveBattleVictoryMode();
      battle=null; setBattleMobileMode(false); uiState.mode='game'; panel.classList.add('hidden'); $('battleOverlay').classList.add('hidden'); renderAll(); AudioManager.play(activeMusicForState());
      if(meta.wasBoss){showStoryOnce(stageStoryKey('bossDefeated')); pulseObjective(currentObjectiveText());}
      else if(meta.wasAnomaly && state.flags.anomaliesCleared===1){showStoryOnce('firstAnomaly');}
      else if(meta.wasAnomaly && state.flags.anomaliesCleared>=requiredAnomaliesForStage()){showStoryOnce('allAnomalies');}
      else {pulseObjective(currentObjectiveText());}
    };
    const btn=$('continueBattleBtn');
    const topBtn=$('continueBattleBtnTop');
    if(btn) btn.onclick=continueVictory;
    if(topBtn) topBtn.onclick=continueVictory;
  }

  function gainXp(n){
    state.player.level = Math.max(1, Math.min(99, state.player.level || 1));
    if(state.player.level >= 99){ state.player.level=99; state.player.xp=0; state.player.nextXp=nextXpForPlayerLevel(99); queueAutosave(); return; }
    const xpAdd=Math.max(0, n||0);
    state.player.xp+=xpAdd;
    if(xpAdd) showXpFloat(`+${xpAdd} Sync XP`, 'sync');
    while(state.player.level < 99 && state.player.xp>=state.player.nextXp){
      state.player.xp-=state.player.nextXp;
      state.player.level++;
      state.player.nextXp=nextXpForPlayerLevel(state.player.level);
      state.player.maxHp+=8; state.player.maxEp+=4; state.player.atk+=1; state.player.def+=1;
      state.player.hp=combatStatBlock().maxHp; state.player.ep=combatStatBlock().maxEp||state.player.maxEp;
      log(`Player Level increased to ${state.player.level}.`); unlockNextStages();
    }
    if(state.player.level >= 99){ state.player.level=99; state.player.xp=0; state.player.nextXp=nextXpForPlayerLevel(99); toast('Player Level cap reached: 99'); }
    queueAutosave();
  }
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
    normalizeLiveMap();
    clampPlayerToMap();
    ctx.clearRect(0,0,VIEW_W,VIEW_H);
    const maxCamX=Math.max(0, mapWidth()*TILE - VIEW_W);
    const maxCamY=Math.max(0, mapHeight()*TILE - VIEW_H);
    camera.x=Math.max(0, Math.min(state.player.x*TILE - VIEW_W/2, maxCamX));
    camera.y=Math.max(0, Math.min(state.player.y*TILE - VIEW_H/2, maxCamY));
    ctx.save(); ctx.translate(-camera.x,-camera.y);
    for(let y=0;y<state.map.length;y++) for(let x=0;x<state.map[y].length;x++){drawTile(state.map[y][x],x*TILE,y*TILE,x,y)}
    drawLockdownSeals();
    drawObjectiveRoute();
    drawCheckpointBeacon();
    drawMapProps();
    drawTrainingNodes();
    drawNpcs();
    drawLockdownActors();
    // player / AV-001 Vyra exploration sprite
    drawPlayerSprite(state.player.x*TILE, state.player.y*TILE);
    drawPlayerLockdownHealthBar();
    drawLockdownProjectiles();
    drawObjectiveBeacon();
    ctx.restore();
    drawMapAtmosphere();
  }


  function drawLockdownSeals(){
    const active=state.rogueEvent?.active ? state.rogueEvent : null;
    const warning=state.rogueWarning?.active ? state.rogueWarning : null;
    const e=active || warning;
    if(!e?.arena) return;
    const a=e.arena;
    ctx.save();
    const pulse=.45+.25*Math.sin(Date.now()*.012);
    const isWarning=!active && !!warning;
    ctx.lineWidth=isWarning?3:4;
    ctx.strokeStyle=isWarning?`rgba(255,206,80,${pulse+.12})`:`rgba(255,48,72,${pulse})`;
    ctx.shadowColor=isWarning?'rgba(255,206,80,.85)':'rgba(255,48,72,.85)';
    ctx.shadowBlur=16;
    ctx.strokeRect(a.minX*TILE+3,a.minY*TILE+3,(a.maxX-a.minX+1)*TILE-6,(a.maxY-a.minY+1)*TILE-6);
    ctx.shadowBlur=0;
    ctx.fillStyle=isWarning?'rgba(255,206,80,.10)':'rgba(255,48,72,.18)';
    const compact=lockdownMobileCompact();
    const label=compact?(isWarning?'!':'X'):(isWarning?'WARN':'LOCK');
    const step=compact?2:1;
    for(let x=a.minX;x<=a.maxX;x+=step){
      drawSealTile(x,a.minY,label,isWarning,compact);
      drawSealTile(x,a.maxY,label,isWarning,compact);
    }
    for(let y=a.minY;y<=a.maxY;y+=step){
      drawSealTile(a.minX,y,label,isWarning,compact);
      drawSealTile(a.maxX,y,label,isWarning,compact);
    }
    ctx.restore();
  }
  function drawSealTile(tx,ty,label,isWarning=false,compact=false){
    const x=tx*TILE, y=ty*TILE;
    ctx.fillStyle=isWarning?'rgba(255,206,80,.10)':'rgba(255,48,72,.12)';
    ctx.fillRect(x+2,y+2,TILE-4,TILE-4);
    ctx.strokeStyle=isWarning?'rgba(255,206,80,.52)':'rgba(255,48,72,.48)';
    ctx.strokeRect(x+4,y+4,TILE-8,TILE-8);
    ctx.fillStyle='rgba(255,255,255,.86)';
    ctx.font=compact?'900 10px monospace':'700 7px monospace';
    ctx.textAlign='center';
    ctx.fillText(label,x+TILE/2,y+TILE/2+3);
  }

  function drawPlayerLockdownHealthBar(){
    if(!state.rogueEvent?.active) return;
    const stats=combatStatBlock();
    const max=Math.max(1,stats.maxHp||state.player.maxHp||60);
    const pct=Math.max(0,Math.min(1,(state.player.hp||0)/max));
    const x=state.player.x*TILE+TILE/2, y=state.player.y*TILE-10;
    ctx.save();
    ctx.fillStyle='rgba(0,0,0,.72)'; ctx.fillRect(x-24,y,48,7);
    ctx.fillStyle=pct>.55?'rgba(55,247,165,.95)':(pct>.25?'rgba(255,227,110,.95)':'rgba(255,48,72,.95)'); ctx.fillRect(x-24,y,48*pct,7);
    ctx.strokeStyle='rgba(255,255,255,.38)'; ctx.strokeRect(x-24.5,y-.5,49,8);
    ctx.fillStyle='rgba(255,255,255,.92)'; ctx.font=compact?'900 10px monospace':'700 7px monospace'; ctx.textAlign='center'; ctx.fillText(`${Math.ceil(state.player.hp||0)}/${max}`,x,y-2);
    ctx.restore();
  }

  function drawLockdownActors(){
    const e=state.rogueEvent;
    if(!e?.active) return;
    ctx.save();
    for(const m of e.enemies||[]){
      const x=m.x*TILE, y=m.y*TILE;
      const bob=Math.sin(Date.now()*.006+m.phase)*1.5;
      const hpPct=Math.max(0,m.hp/Math.max(1,m.maxHp));
      ctx.fillStyle='rgba(0,0,0,.40)';
      ctx.beginPath(); ctx.ellipse(x,y+15,16,5,0,0,Math.PI*2); ctx.fill();
      const im=images[m.icon] || images[m.img];
      if(im && im.complete && im.naturalWidth){
        const drawW=34, drawH=34;
        ctx.shadowColor='rgba(255,48,72,.55)';
        ctx.shadowBlur=7;
        const oldSmooth=ctx.imageSmoothingEnabled;
        ctx.imageSmoothingEnabled=true;
        ctx.drawImage(im, x-drawW/2, y-drawH/2+bob, drawW, drawH);
        ctx.imageSmoothingEnabled=oldSmooth;
        ctx.shadowBlur=0;
      } else {
        const grd=ctx.createRadialGradient(x,y+bob,4,x,y+bob,17);
        grd.addColorStop(0,'rgba(255,130,92,.96)');
        grd.addColorStop(1,'rgba(255,48,72,.32)');
        ctx.fillStyle=grd;
        ctx.beginPath(); ctx.arc(x,y+bob,13,0,Math.PI*2); ctx.fill();
        ctx.strokeStyle='rgba(255,255,255,.24)'; ctx.stroke();
      }
      ctx.fillStyle='rgba(0,0,0,.72)'; ctx.fillRect(x-16,y-25,32,5);
      ctx.fillStyle='rgba(255,48,72,.92)'; ctx.fillRect(x-16,y-25,32*hpPct,5);
      ctx.strokeStyle='rgba(255,255,255,.22)'; ctx.strokeRect(x-16.5,y-25.5,33,6);
    }
    ctx.restore();
  }
  function drawLockdownProjectiles(){
    const e=state.rogueEvent;
    if(!e?.active) return;
    const palette={cyan:['rgba(190,250,255,.98)','rgba(112,215,255,.95)'],red:['rgba(255,210,210,.98)','rgba(255,48,72,.95)'],green:['rgba(205,255,196,.98)','rgba(93,255,122,.95)'],gold:['rgba(255,238,166,.98)','rgba(255,199,64,.95)'],violet:['rgba(232,205,255,.98)','rgba(190,96,255,.95)']};
    ctx.save();
    for(const p of e.projectiles||[]){
      const x=p.x*TILE, y=p.y*TILE;
      const colors=palette[p.style] || palette.cyan;
      const angle=Math.atan2(p.vy,p.vx);
      if(p.trail && p.trail.length>1){
        ctx.strokeStyle=colors[1]; ctx.globalAlpha=.38; ctx.lineWidth=3; ctx.beginPath();
        p.trail.forEach((t,i)=>{ const tx=t.x*TILE, ty=t.y*TILE; if(i===0) ctx.moveTo(tx,ty); else ctx.lineTo(tx,ty); }); ctx.stroke(); ctx.globalAlpha=1;
      }
      ctx.save();
      ctx.translate(x,y);
      ctx.rotate(angle);
      ctx.shadowColor=colors[1];
      ctx.shadowBlur=14;
      ctx.fillStyle=colors[0];
      ctx.beginPath();
      const kind=p.kind||0;
      if(kind===1){ ctx.arc(0,0,6,0,Math.PI*2); }
      else if(kind===2){ ctx.rect(-5,-5,10,10); }
      else if(kind===3){ ctx.moveTo(10,0); ctx.lineTo(0,-7); ctx.lineTo(-10,0); ctx.lineTo(0,7); ctx.closePath(); }
      else { ctx.moveTo(12,0); ctx.lineTo(-6,-5); ctx.lineTo(-2,0); ctx.lineTo(-6,5); ctx.closePath(); }
      ctx.fill();
      ctx.strokeStyle='rgba(255,255,255,.65)';
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  }

  function drawMapAtmosphere(){
    // v94: brighter, directional lighting. The map keeps the horror mood, but the playable floor
    // is no longer crushed into black and the player gets a readable light radius.
    const t = Date.now() * 0.00032;
    const stage = currentStageKey();
    const atmosphereTints = {
      f001:{fog:'rgba(16,18,34,.16)', beam:'rgba(160,230,210,.07)', glow:'rgba(150,255,210,.20)'},
      f002:{fog:'rgba(70,42,20,.18)', beam:'rgba(255,170,80,.075)', glow:'rgba(255,148,64,.22)'},
      f003:{fog:'rgba(16,22,54,.16)', beam:'rgba(130,190,255,.08)', glow:'rgba(112,215,255,.22)'},
      f004:{fog:'rgba(8,30,48,.16)', beam:'rgba(92,170,255,.08)', glow:'rgba(92,170,255,.22)'},
      f005:{fog:'rgba(28,16,58,.16)', beam:'rgba(190,96,255,.08)', glow:'rgba(190,96,255,.22)'},
      f006:{fog:'rgba(4,36,35,.16)', beam:'rgba(0,255,200,.08)', glow:'rgba(0,255,200,.22)'},
      f007:{fog:'rgba(70,22,6,.17)', beam:'rgba(255,122,54,.085)', glow:'rgba(255,100,40,.23)'},
      f008:{fog:'rgba(4,22,54,.17)', beam:'rgba(70,190,255,.085)', glow:'rgba(70,190,255,.22)'},
      f009:{fog:'rgba(56,34,6,.16)', beam:'rgba(255,178,84,.078)', glow:'rgba(255,178,84,.20)'},
      f010:{fog:'rgba(20,10,58,.17)', beam:'rgba(125,92,255,.085)', glow:'rgba(125,92,255,.22)'},
      f011:{fog:'rgba(4,36,48,.16)', beam:'rgba(185,245,255,.085)', glow:'rgba(185,245,255,.21)'},
      f012:{fog:'rgba(58,40,4,.18)', beam:'rgba(255,226,110,.085)', glow:'rgba(255,226,110,.24)'}
    };
    const tint = atmosphereTints[stage] || atmosphereTints.f001;
    ctx.save();
    ctx.fillStyle=tint.fog;
    ctx.fillRect(0,0,VIEW_W,VIEW_H);

    const px = state.player.x*TILE + TILE/2 - camera.x;
    const py = state.player.y*TILE + TILE/2 - camera.y;
    const light = ctx.createRadialGradient(px, py, 22, px, py, 190);
    // v130: no player-colored glow. Keep a tiny neutral readability lift only.
    light.addColorStop(0,'rgba(255,255,255,.045)');
    light.addColorStop(.36,'rgba(255,255,255,.030)');
    light.addColorStop(1,'rgba(255,255,255,0)');
    ctx.globalCompositeOperation='screen';
    ctx.fillStyle=light;
    ctx.fillRect(0,0,VIEW_W,VIEW_H);

    for(let i=0;i<8;i++){
      const y=(i*83 + (t*90)%83) % (VIEW_H+80) - 40;
      const grd=ctx.createLinearGradient(0,y,VIEW_W,y+46);
      grd.addColorStop(0,'rgba(120,190,190,0)');
      grd.addColorStop(0.5,tint.beam);
      grd.addColorStop(1,'rgba(120,190,190,0)');
      ctx.fillStyle=grd;
      ctx.fillRect(0,y,VIEW_W,46);
    }

    ctx.globalCompositeOperation='source-over';
    const vignette = ctx.createRadialGradient(VIEW_W/2, VIEW_H/2, VIEW_W*0.25, VIEW_W/2, VIEW_H/2, VIEW_W*0.78);
    vignette.addColorStop(0,'rgba(0,0,0,0)');
    vignette.addColorStop(0.70,'rgba(0,0,0,.10)');
    vignette.addColorStop(1,'rgba(0,0,0,.42)');
    ctx.fillStyle=vignette;
    ctx.fillRect(0,0,VIEW_W,VIEW_H);
    ctx.restore();
  }

  function drawPlayerSprite(x,y){
    const spritePath = currentOperatorMapSpriteForFacing(state?.player?.facing || 'down');
    const im = images[spritePath];
    // v130: same map footprint as NPCs and monsters.
    const drawW = MAP_ENTITY_W;
    const drawH = MAP_ENTITY_H;
    const dx = x + (TILE-drawW)/2;
    const dy = y + TILE - drawH + 5;
    ctx.save();
    ctx.fillStyle='rgba(0,0,0,.42)';
    ctx.beginPath();
    ctx.ellipse(x+TILE/2,y+TILE-4,16,6,0,0,Math.PI*2);
    ctx.fill();
    // Remove the blue glow from the player sprite; keep only the sprite itself and neutral shadow.
    ctx.shadowColor='rgba(0,0,0,.35)';
    ctx.shadowBlur=2;
    if(im && im.complete && im.naturalWidth){
      const oldSmooth = ctx.imageSmoothingEnabled;
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(im, dx, dy, drawW, drawH);
      ctx.imageSmoothingEnabled = oldSmooth;
    } else {
      // fallback only if asset fails to load
      ctx.fillStyle='#111820';ctx.fillRect(x+8,y+6,26,30);ctx.fillStyle='rgba(255,255,255,.72)';ctx.fillRect(x+12,y+16,18,5);ctx.strokeStyle='rgba(255,255,255,.18)';ctx.strokeRect(x+7,y+7,TILE-14,TILE-13);
    }
    ctx.shadowBlur=0;
    ctx.restore();
  }


  function drawMapProps(){
    const pack = stageVisualPack();
    const salvage = STAGE_SALVAGE_OBJECTS[currentStageKey()] || [];
    const props = [...mapArt.props, ...((pack && pack.props) || []), ...salvage];
    props.forEach(p=>{
      const tile = tileAt(p.x,p.y);
      // Only draw decorative props on open floor so they never cover caches, NPCs, doors, or exits.
      if(tile !== '.') return;
      drawAsset(p.img, p.x*TILE, p.y*TILE, p.w, p.h, true);
    });
  }

  function drawTrainingNode(node){
    if(!trainingNodeReady(node)) return;
    if(tileAt(node.x,node.y) !== '.') return;
    const x=node.x*TILE, y=node.y*TILE;
    const near=Math.abs(node.x-state.player.x)+Math.abs(node.y-state.player.y)<=1;
    const req=node.levelReq || skillingLevelReqForItem(node.item,node.stage);
    const currentLvl=skillLevel(node.skill);
    const locked=currentLvl < req;
    const highlight=locked?'#ff3048':'#5dff7a';
    const fill=locked?'#4f1b24':node.color;
    const pulse=(Math.sin(Date.now()/260 + node.x*.7 + node.y*.3)+1)/2;
    ctx.save();

    // v154: always-visible trainability highlight.
    // Green means you can use it now. Red means your skill level is too low.
    ctx.shadowColor=highlight;
    ctx.shadowBlur=locked ? 13 + pulse*5 : 11 + pulse*4;
    ctx.strokeStyle=locked ? 'rgba(255,48,72,.95)' : 'rgba(93,255,122,.95)';
    ctx.lineWidth=near?3:2;
    ctx.beginPath();
    ctx.arc(x+TILE/2,y+22,18 + (near?2:0),0,Math.PI*2);
    ctx.stroke();

    ctx.fillStyle=locked ? 'rgba(255,48,72,.16)' : 'rgba(93,255,122,.15)';
    ctx.beginPath();
    ctx.arc(x+TILE/2,y+22,16,0,Math.PI*2);
    ctx.fill();

    ctx.fillStyle='rgba(0,0,0,.42)';
    ctx.shadowBlur=0;
    ctx.beginPath();
    ctx.ellipse(x+TILE/2,y+TILE-6,15,6,0,0,Math.PI*2);
    ctx.fill();

    ctx.shadowColor=highlight;
    ctx.shadowBlur=near?18:10;
    const asset=trainingObjectAssetForLabel(node.baseLabel || node.label);
    const im=asset && images[asset];

    if(im && im.complete && im.naturalWidth){
      const oldSmooth=ctx.imageSmoothingEnabled;
      ctx.imageSmoothingEnabled=true;
      ctx.globalAlpha=.98;
      ctx.drawImage(im, x+4, y+1, TILE-8, TILE-3);
      ctx.globalAlpha=1;
      ctx.imageSmoothingEnabled=oldSmooth;
      ctx.shadowBlur=0;
      ctx.strokeStyle=highlight;
      ctx.lineWidth=near?3:2;
      ctx.strokeRect(x+5.5,y+3.5,TILE-11,TILE-7);
    } else {
      ctx.fillStyle=fill;
      ctx.globalAlpha=.96;
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(x+9,y+8,24,24,6) : ctx.rect(x+9,y+8,24,24);
      ctx.fill();
      ctx.globalAlpha=1;

      ctx.shadowBlur=0;
      ctx.strokeStyle=highlight;
      ctx.lineWidth=near?3:2;
      ctx.strokeRect(x+8.5,y+7.5,25,25);

      ctx.fillStyle='#061018';
      ctx.font='bold 18px monospace';
      ctx.textAlign='center';
      ctx.textBaseline='middle';
      ctx.fillText(node.glyph, x+TILE/2, y+20);
    }

    // Small status dot on every object so lock state is readable even zoomed out.
    ctx.fillStyle=highlight;
    ctx.beginPath();
    ctx.arc(x+32,y+10,4,0,Math.PI*2);
    ctx.fill();

    if(near){
      const labelW=locked?94:82, labelH=16;
      const labelX=x+(TILE-labelW)/2, labelY=y+TILE-13;
      ctx.fillStyle=locked?'rgba(38,4,9,.92)':'rgba(4,34,14,.92)';
      ctx.fillRect(labelX,labelY,labelW,labelH);
      ctx.strokeStyle=highlight;
      ctx.lineWidth=1;
      ctx.strokeRect(labelX+.5,labelY+.5,labelW-1,labelH-1);
      ctx.fillStyle=locked?'#ffb8c1':'#caffcf';
      ctx.font='bold 10px monospace';
      ctx.textAlign='center';
      ctx.textBaseline='alphabetic';
      ctx.fillText(locked?`REQ LV ${req}`:'PRESS E', x+TILE/2, labelY+11);
    }
    ctx.restore();
  }
  function drawTrainingNodes(){
    stageTrainingNodes().forEach(drawTrainingNode);
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

    if(c==='C'){
      if(!drawAsset((pack&&pack.chest)||mapArt.chest,x,y,38,34,true)){ctx.fillStyle='#9b6b22';ctx.fillRect(x+9,y+13,24,20);ctx.strokeStyle='#e0b64b';ctx.strokeRect(x+9,y+13,24,20)}
      // v92: field letter rings are hidden; icons stay in-world and markers stay on the minimap only.
    }
    if(c==='S'){
      if(!drawAsset((pack&&pack.terminal)||mapArt.terminal,x,y,38,48,true)){ctx.fillStyle='#25567d';ctx.fillRect(x+8,y+6,26,30);ctx.fillStyle='#70d7ff';ctx.fillRect(x+13,y+12,16,8)}
      // v92: field letter rings are hidden; icons stay in-world and markers stay on the minimap only.
    }
    if(c==='H'){
      if(!drawAsset((pack&&pack.med)||mapArt.med,x,y,32,32,false)){ctx.fillStyle='#216d45';ctx.fillRect(x+8,y+8,26,26);ctx.fillStyle='#fff';ctx.fillRect(x+18,y+12,6,18);ctx.fillRect(x+12,y+18,18,6)}
      // v92: field letter rings are hidden; icons stay in-world and markers stay on the minimap only.
    }
    if(c==='L'){
      if(!drawAsset((pack&&pack.lore)||mapArt.lore,x,y,32,44,true)){ctx.fillStyle='#4b316f';ctx.fillRect(x+11,y+8,20,28);ctx.fillStyle='#d2a8ff';ctx.fillRect(x+15,y+13,12,3);ctx.fillRect(x+15,y+20,12,3)}
      // v92: field letter rings are hidden; icons stay in-world and markers stay on the minimap only.
    }
    if(c==='E'||c==='B'){
      const im = getMapCreatureImage(c,tx,ty);
      const drawW = MAP_ENTITY_W;
      const drawH = MAP_ENTITY_H;
      const dx = x + (TILE-drawW)/2;
      const dy = y + TILE - drawH + 5;
      ctx.save();
      ctx.fillStyle='rgba(0,0,0,.44)';
      ctx.beginPath();
      ctx.ellipse(x+TILE/2,y+TILE-4,16,6,0,0,Math.PI*2);
      ctx.fill();
      if(im && im.complete && im.naturalWidth){
        ctx.shadowColor = c==='B' ? '#ff3048' : '#bd1f2d';
        ctx.shadowBlur = c==='B' ? 10 : 7;
        const oldSmooth = ctx.imageSmoothingEnabled;
        ctx.imageSmoothingEnabled = true;
        ctx.drawImage(im, dx, dy, drawW, drawH);
        ctx.imageSmoothingEnabled = oldSmooth;
      } else {
        ctx.fillStyle=c==='B'?'#72202b':'#5c4e41';ctx.beginPath();ctx.arc(x+TILE/2,y+TILE/2,c==='B'?16:15,0,Math.PI*2);ctx.fill();ctx.fillStyle='#ff3048';ctx.fillRect(x+13,y+16,6,4);ctx.fillRect(x+24,y+16,6,4);
      }
      ctx.restore();
      // v92: field letter rings are hidden; anomaly/boss markers stay on the minimap only.
    }
    if(c==='D'){
      if(!drawAsset((pack&&pack.door)||mapArt.door,x,y,42,32,false)){ctx.fillStyle='#5a3422';ctx.fillRect(x+6,y+2,30,38);ctx.fillStyle='#e0b64b';ctx.fillRect(x+29,y+20,4,4)}
      // v92: field letter rings are hidden; door marker stays on the minimap only.
    }
    if(c==='X'){
      if(!drawAsset((pack&&pack.exit)||mapArt.exit,x,y,42,42,true)){ctx.fillStyle='#eee';ctx.fillRect(x+6,y+6,30,30);ctx.fillStyle='#050608';ctx.fillText('X',x+16,y+27)}
      // v92: field letter rings are hidden; exit marker stays on the minimap only.
    }
  }
  function renderMini(){
    clampPlayerToMap();
    const w=Math.max(1,mapWidth()),h=Math.max(1,mapHeight()); mctx.clearRect(0,0,mini.width,mini.height); const sx=mini.width/w, sy=mini.height/h;
    for(let y=0;y<h;y++) for(let x=0;x<w;x++){
      const c=tileAt(x,y);
      mctx.fillStyle=c==='#'?'#05080c':c==='C'?'#e0b64b':c==='S'?'#70d7ff':c==='H'?'#59ffa0':c==='L'?'#d2a8ff':c==='D'?'#ffb840':c==='E'||c==='B'?'#bd1f2d':c==='X'?'#fff':'#31424c';
      mctx.fillRect(x*sx,y*sy,Math.ceil(sx),Math.ceil(sy));
    }
    stageNpcs().forEach(n=>{ mctx.fillStyle='#94ff62'; mctx.fillRect(n.x*sx,n.y*sy,Math.ceil(sx*2),Math.ceil(sy*2)); });
    stageTrainingNodes().forEach(n=>{ if(trainingNodeReady(n)){ mctx.fillStyle=TRAINING_NODE_TYPES[n.skill]?.color || '#ffffff'; mctx.fillRect(n.x*sx,n.y*sy,Math.ceil(sx*2),Math.ceil(sy*2)); } });
    const navTarget=objectiveTarget();
    ensureSettings();
    const route=state.settings.minimapRoute === false ? [] : routePathToObjective();
    if(route.length > 1){
      mctx.save();
      mctx.strokeStyle='#00d9ff';
      mctx.globalAlpha=.72;
      mctx.lineWidth=2;
      mctx.beginPath();
      route.forEach((p,i)=>{ const px=p.x*sx+sx/2, py=p.y*sy+sy/2; if(i===0) mctx.moveTo(px,py); else mctx.lineTo(px,py); });
      mctx.stroke();
      mctx.restore();
    }
    if(navTarget && navTarget.x != null){ mctx.strokeStyle='#00d9ff'; mctx.lineWidth=2; mctx.strokeRect(navTarget.x*sx-1,navTarget.y*sy-1,Math.ceil(sx*3),Math.ceil(sy*3)); }
    const cp=checkpointInfo();
    if(cp.ok && cp.stage===stageDef().id && cp.x != null && cp.y != null){ mctx.fillStyle='#94ff62'; mctx.fillRect(cp.x*sx,cp.y*sy,Math.ceil(sx*2),Math.ceil(sy*2)); mctx.strokeStyle='#ffffff'; mctx.lineWidth=1; mctx.strokeRect(cp.x*sx-1,cp.y*sy-1,Math.ceil(sx*2)+2,Math.ceil(sy*2)+2); }
    mctx.fillStyle='#ff3048'; mctx.fillRect(state.player.x*sx,state.player.y*sy,Math.ceil(sx*2),Math.ceil(sy*2));
  }
  function renderUI(){
    ensureProgression(); ensureContracts(); ensureResearch(); syncHpCap(); unlockNextStages(); ensureStoryFlags();
    applyOperatorVisuals();
    const p=state.player; const stats=combatStatBlock(); const def=stageDef();
    const saveAge=Math.floor((Date.now()-(state.lastSave||Date.now()))/1000);
    const upTotal=Object.values(state.upgrades||{}).reduce((a,b)=>a+(b||0),0);
    const requiredAnomalyGoal=requiredAnomaliesForStage();
    const anomalyClears=Math.min(requiredAnomalyGoal, state.flags.anomaliesCleared || 0);
    const stageKills=(state.enemyKills||{})[def.key] || 0;
    const pendingRespawns=pendingRespawnsForStage(def.key);
    const nextRespawn=pendingRespawns.length ? Math.min(...pendingRespawns.map(r=>r.seconds)) : 0;
    const respawnText=pendingRespawns.length ? `Pending ${pendingRespawns.length} // next ${nextRespawn}s` : 'Ready';
    const researchStats = researchSummary();
    if($('sectorName')) $('sectorName').textContent=`${def.id}:`;
    if($('sectorObjective')) $('sectorObjective').textContent=`// Objective: ${def.objective}`;
    $('stats').innerHTML=`<div class="statrow stat-hero-line"><b>Player Lv. ${p.level}</b> // <b>${safeHtml(currentOperator().displayName)} Op Lv. ${activeOperatorProgress().level}</b> // ${def.id} ${def.title}</div><div class="statrow">Credits ${p.credits} // Focus ${(skillList[state.combatStyle||'attack']||{}).name||'Attack'} // Upgrades ${upTotal}</div><div class="statrow">ATK ${stats.atk}+${stats.strBonus} // DEF ${stats.def} // Gear ${gearPower()} // Autosave ${saveAge}s</div><div class="statrow">Kills ${stageKills} // Research ${researchStats.discovered}/${researchStats.total}</div><div class="statrow">Respawn ${respawnText} // Research Kills ${researchStats.kills}</div><div class="statrow">Checkpoint ${safeHtml(checkpointSummaryText())}</div><div class="statrow">HP ${p.hp}/${stats.maxHp}<div class="bar"><span style="width:${100*p.hp/stats.maxHp}%"></span></div></div><div class="statrow">EP ${p.ep}/${stats.maxEp||p.maxEp}<div class="bar ep"><span style="width:${100*p.ep/(stats.maxEp||p.maxEp)}%"></span></div></div><div class="statrow">Player Sync ${p.xp}/${p.nextXp}<div class="bar xp"><span style="width:${100*p.xp/p.nextXp}%"></span></div></div><div class="statrow">Operator XP ${activeOperatorProgress().xp}/${activeOperatorProgress().nextXp}<div class="bar xp operator-xp"><span style="width:${100*activeOperatorProgress().xp/activeOperatorProgress().nextXp}%"></span></div></div>`;
    $('fractureStatus').innerHTML=`<div class="statrow">Stage: ${def.id} // ${def.title}</div><div class="statrow">Required Lv: ${def.levelReq} // Threat: ${def.threat}</div><div class="statrow">Anomalies Cleared: ${anomalyClears}/${requiredAnomalyGoal} // Total Kills ${stageKills}</div><div class="statrow">Respawn Queue: ${respawnText}</div><div class="statrow">Skill Nodes: ${stageTrainingNodes().filter(trainingNodeReady).length}/${stageTrainingNodes().length} ready // 5 per skill // ${zoneProfile().zone}</div><div class="statrow">Research: ${researchStats.discovered}/${researchStats.total} entries // ${researchStats.kills} kills // ${researchStats.ranks} ranks</div><div class="statrow">Boss Route: ${state.flags.bossUnlocked?'Unlocked':'Locked'}</div><div class="statrow">Boss Defeated: ${state.flags.bossDefeated?'Yes':'No'}</div><div class="statrow">Stage Clear: ${state.flags.chapterComplete?'Complete':'Active'}</div><div class="statrow">Checkpoint: ${state.checkpoint?.label || 'None'}</div><div class="statrow">Side Quest: ${safeHtml(sideQuestStatusText())}</div>`;
    $('inventory').innerHTML=`<button class="open-bag-btn" onclick="window.AV.openOverlay('inventoryOverlay')">Open Bag / Bank</button><div class="quick-bag-grid">${Object.entries(state.inventory).slice(0,12).map(([k,v])=>{ const item=findItemRecord(k); return `<div class="quick-bag-slot ${rarityClass(item.rarity)}" title="${safeHtml(k)}">${itemIconHtml(item,v)}<span>${safeHtml(k)}</span></div>`; }).join('') || '<div class="invrow">No recovered assets.</div>'}</div>`;
    $('log').innerHTML=state.log.map(l=>`<div class="logrow">${l}</div>`).join('');
    $('roster').innerHTML=`<div class="statrow"><b>${currentOperator().code} ${safeHtml(currentOperator().displayName)}</b><br>Operator Lv. ${activeOperatorProgress().level} // ${safeHtml(operatorStatBonus().role)}<br><span class="fineprint">${safeHtml(operatorStatBonus().passive)}</span></div>`;
    const objectives=[['Reach recovery terminal',state.flags.terminal],[`Clear ${requiredAnomalyGoal} anomalies (${anomalyClears}/${requiredAnomalyGoal})`,anomalyClears>=requiredAnomalyGoal],['Unlock boss gate',state.flags.bossUnlocked],['Defeat boss',state.flags.bossDefeated],['Extract / Stage Complete',state.flags.chapterComplete]];
    const activeText=currentObjectiveText();
    const contract=activeContract();
    const contractLine=`📜 Contract: ${safeHtml(contract.title)} (${contract.progress}/${contract.target})${contract.complete?' — ready to claim':''}`;
    const questLine=safeHtml(sideQuestStatusText());
    const protocolLine=safeHtml(protocolChallengeSummaryText());
    const target=objectiveTarget();
    const targetSummary=target ? `${safeHtml(target.label)} // ${safeHtml(target.arrow||'•')} ${Number(target.distance||0)} tiles` : 'No active target';
    $('objectiveTracker').innerHTML=`<b>${activeText}</b><br><span>🎯 ${targetSummary}</span><br>` + objectives.map(([t,done])=>`${done?'✅':'⬜'} ${t}`).join(' &nbsp; ') + ` &nbsp; ${contractLine} &nbsp; 🧾 ${questLine} &nbsp; 🏆 ${protocolLine}`;
    $('missionProgress').innerHTML=objectiveGuideHtml() + `<div class="mission-row">💾 Checkpoint: ${safeHtml(checkpointSummaryText())}</div><div class="mission-row">🏆 Protocol Challenges: ${safeHtml(protocolChallengeSummaryText())}</div>` + objectives.map(([t,done])=>`<div class="mission-row">${done?'✅':'⬜'} ${t}</div>`).join('') + `<div class="mission-row">${contract.complete?'✅':'⬜'} ${contractLine}</div><div class="mission-row">${questLine}</div>`;
    $('missionChecklist') && ($('missionChecklist').innerHTML=$('missionProgress').innerHTML);
    renderMissionContractPanel();
    renderStoryArchivePanel();
    $('missionActiveHint') && ($('missionActiveHint').textContent=activeText);
    $('qaState') && ($('qaState').innerHTML=`<div class="statrow">Stage: ${def.id} // ${def.title}</div><div class="statrow">Player Level: ${p.level} // QA Bypass: ${state.qaUnlockAllStages?'ON':'OFF'}</div><div class="statrow">Level Locks: ${Object.entries(STAGE_DEFS).map(([k,d])=>d.id+': '+(playerMeetsStageRequirement(k)?'open':'locked')).join(' // ')}</div><div class="statrow">Characters: ${Object.values(OPERATOR_DEFS).filter(op=>operatorUnlocked(op.id)).length}/${Object.values(OPERATOR_DEFS).length} unlocked // QA Unlock: ${state.qaUnlockAllCharacters?'ON':'OFF'}</div><div class="statrow">Position: ${p.x}, ${p.y}</div><div class="statrow">HP: ${p.hp}/${stats.maxHp} // EP ${p.ep}/${stats.maxEp||p.maxEp}</div><div class="statrow">Map Version: ${state.mapVersion || MAP_VERSION}</div><div class="statrow">Controller: ${ControllerManager.statusText()}</div><div class="statrow">Flags: ${JSON.stringify(state.flags)}</div>`); renderQaStagePicker();
    renderFullscreenHud();
    renderObjectiveCompass();
    renderOperatorDb();
    renderCharacterMenuDb();
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
      if(id==='characterOverlay') renderCharacterMenuDb();
      if(id==='fractureOverlay') renderFractureDb();
      if(id==='missionOverlay'){ renderUI(); renderMissionContractPanel(); renderStoryArchivePanel(); }
      if(id==='playtestOverlay') renderUI();
      if(id==='progressionOverlay') renderProgressionDb();
      if(id==='configOverlay'){ renderSaveHub(); renderAudioMixer(); }
      if(id==='radioOverlay'){ radioMode=true; radioTrack=radioTrack||'pause'; renderRadioDb(); AudioManager.play(radioTrack, true); }
    }catch(err){
      console.error('Overlay render failed:', id, err);
      target.querySelector('.database-modal')?.insertAdjacentHTML('beforeend', `<p class="menu-info warn">Overlay opened, but a render error occurred: ${String(err.message||err)}</p>`);
    }

    const info=$('menuInfo');
    if(info){info.textContent='Protocol opened. Press Esc or Close to return.'; info.classList.add('ok');}
  }

  function closeOverlays(){
    radioMode=false;
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
    const skillAsset = trainingItemAssetForName(name);
    const skill = trainingSkillForItemName(name);
    const baseName = trainingBaseName(name);
    if(found){
      const normalized = normalizeItem(found);
      if(skillAsset){
        normalized.asset = skillAsset;
        normalized.source = skillAsset;
        normalized.status = 'training-item-art';
      }
      return normalized;
    }
    if(skillAsset){
      const skillName = skillList[skill]?.name || 'Skill Resource';
      return normalizeItem({
        id:`SKILL-${baseName.toUpperCase().replace(/[^A-Z0-9]+/g,'-')}`,
        name,
        type:'Material',
        category:skillName,
        slot:'Stack',
        rarity:trainingRarityForItemName(name),
        stackSize:999,
        sellPrice:Math.max(1, (trainingRarityForItemName(name)==='Epic'?22:trainingRarityForItemName(name)==='Rare'?14:trainingRarityForItemName(name)==='Uncommon'?6:1)),
        asset:skillAsset,
        source:skillAsset,
        status:'training-item-art',
        desc:`Recovered ${skillName} resource. Base item: ${baseName}.`
      });
    }
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
    return `<div class="item-icon-shell ${rarityClass(item.rarity)}"><img src="${item.asset}" alt="${item.name}" onerror="this.onerror=null;this.src='assets/items/scrap_metal.png'">${count}</div>`;
  }
  function bankInventoryHtml(){
    const entries=Object.entries(state.inventory || {}).sort((a,b)=>{
      const ia=findItemRecord(a[0]), ib=findItemRecord(b[0]);
      const typeSort = String(ia.type).localeCompare(String(ib.type));
      return typeSort || a[0].localeCompare(b[0]);
    });
    const totalStacks=entries.length;
    const totalItems=entries.reduce((a,[,v])=>a+(Number(v)||0),0);
    const cells=[...entries.map(([name,qty])=>{
      const item=findItemRecord(name);
      const equipped=Object.values(state.equipment||{}).includes(name);
      const train=SKILLING_ITEM_RULES[name] ? canTrainFromItem(name,currentStageKey()) : null;
      const trainLine=train ? `<small class="${train.ok?'ok':'warn'}">${skillList[train.skill]?.short || 'SKL'} Lv ${train.req} // ${skillingXpForItem(name,currentStageKey(),1)} XP</small>` : '';
      return `<button class="bank-slot ${rarityClass(item.rarity)} ${equipped?'equipped':''}" data-item-name="${safeHtml(name)}" title="${safeHtml(item.desc)}">${itemIconHtml(item,qty)}<b>${safeHtml(name)}</b><span>${safeHtml(item.type)}</span>${trainLine}${equipped?'<em>Equipped</em>':''}</button>`;
    })];
    while(cells.length < Math.min(60, Math.max(24, totalStacks+6))) cells.push('<div class="bank-slot empty"><span>Empty</span></div>');
    return `<section class="bank-panel runebank-panel"><div class="bank-title"><div><div class="record-kicker">FIELD BAG / BANK</div><h3>Stacked Inventory</h3></div><div class="bank-stats"><b>${totalStacks}</b><span>stacks</span><b>${totalItems}</b><span>items</span></div></div><div class="bank-grid-clean">${cells.join('')}</div></section>`;
  }

  function renderInventoryDb(){
    const owned = Object.entries(state.inventory).map(([k,v])=>{
      const item=findItemRecord(k);
      return `<button class="owned-item ${rarityClass(item.rarity)}" data-item-name="${k}" title="${item.desc}">${itemIconHtml(item,v)}<div><b>${k}</b><span>${item.rarity} // ${item.type}</span><small>${item.desc}</small></div>${(k==='Med Patch'||k==='Vector Cell')?'<em>Usable</em>':(Object.values(state.equipment||{}).includes(k)?'<em>Equipped</em>':(isEquipmentLike(item)?'<em>Gear</em>':'<em>Stored</em>'))}</button>`;
    }).join('') || '<div class="invrow">No recovered assets yet.</div>';
    const fullRegistry=[...coreItemRegistry.map(normalizeItem), ...importedItemRegistry.map(normalizeItem)];
    const stats=combatStatBlock(); const epMax=stats.maxEp||state.player.maxEp; const equipmentPanel=renderEquipmentPanel(); const workshopPanel=renderWorkshopPanel(); const dropLogPanel=renderDropLogPanel(); const skillMini=['attack','strength','defense','health'].map(k=>{const d=state.skillData[k]; return `<div>${skillEmblem(k)}<span>${skillList[k].short} Lv ${d.level}</span></div>`}).join('');
    $('inventoryDatabaseList').innerHTML=`
      <div class="inventory-hero-panel"><div><div class="record-kicker">OPERATOR STATUS</div><h2>Vyra // Player Lv. ${state.player.level}</h2><p>HP ${state.player.hp}/${stats.maxHp} // EP ${state.player.ep}/${epMax} // Credits ${state.player.credits}</p><div class="record-grid"><div><b>ATK</b><span>${stats.atk}+${stats.strBonus}</span></div><div><b>DEF</b><span>${stats.def}</span></div><div><b>Stage</b><span>${stageDef().id}</span></div><div><b>Save</b><span>${state.lastSave?new Date(state.lastSave).toLocaleTimeString():'new'}</span></div></div></div><div class="inventory-skill-strip">${skillMini}</div></div>${bankInventoryHtml()}${equipmentPanel}${workshopPanel}${dropLogPanel}<div class="item-tools">
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
      const train=SKILLING_ITEM_RULES[item.name] ? canTrainFromItem(item.name,currentStageKey()) : null;
      const trainPanel=train ? `<div class="gear-compare skilling-req-panel"><b>${safeHtml(skillList[train.skill]?.name || train.skill)} Training</b><span>Gives ${skillingXpForItem(item.name,currentStageKey(),1)} XP per item in ${stageDef().id}</span><small class="${train.ok?'ok':'warn'}">Requires ${skillList[train.skill]?.short || 'Skill'} Lv. ${train.req} // Current Lv. ${train.lvl}</small></div>` : '';
      $('itemDetailPanel').innerHTML=`<div class="record-kicker">${item.id || 'RECOVERED'} // ${item.rarity}</div><div class="item-detail-top">${itemIconHtml(item)}<div><h2>${item.name}</h2><p>${item.type} ${item.category?`// ${item.category}`:''} ${item.equipSlot?`// ${item.equipSlot}`:''}</p></div></div><p>${item.desc}</p><div class="record-grid"><div><b>Stack</b><span>${item.stackSize}</span></div><div><b>Sell</b><span>${item.sellPrice} credits</span></div><div><b>Req Lv</b><span>${item.levelReq || '-'}</span></div><div><b>Asset</b><span>${item.asset}</span></div></div>${trainPanel}${item.equipSlot?`<div class="gear-compare"><b>Stats</b><span>${statSummary(item.stats)}</span><small>Current ${item.equipSlot}: ${state.equipment?.[item.equipSlot] || 'Empty'}</small></div><button onclick="window.AV.equipItem('${safeHtml(item.name)}')">Equip ${item.equipSlot}</button>`:''}${consumableButtonHtml(item.name)}`;
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
    document.querySelectorAll('#inventoryDatabaseList .owned-item, #inventoryDatabaseList .bank-slot[data-item-name]').forEach(btn=>btn.onclick=()=>showItemDetail(btn.dataset.itemName));
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
    if(on){
      document.body.classList.remove('battle-victory-mode');
      ensureMobileBattlePad();
    }
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



  // v94: controller hover/confirm helpers for non-battle menus.
  function isElementVisible(el){
    if(!el || el.disabled) return false;
    if(el.closest('.hidden')) return false;
    const style = window.getComputedStyle(el);
    return style.display !== 'none' && style.visibility !== 'hidden' && el.getClientRects().length > 0;
  }
  function visibleOverlayRoot(){
    return Array.from(document.querySelectorAll('.overlay')).find(o => !o.classList.contains('hidden') && o.id !== 'battleOverlay' && o.id !== 'preBattleOverlay') || null;
  }
  function controllerMenuElements(root){
    if(!root) return [];
    const selector = 'button:not([disabled]), select:not([disabled]), input:not([disabled]), [data-controller-menu]';
    return Array.from(root.querySelectorAll(selector)).filter(isElementVisible);
  }
  function updateControllerMenuFocus(root, index=0){
    const items = controllerMenuElements(root);
    document.querySelectorAll('.controller-menu-selected').forEach(el => el.classList.remove('controller-menu-selected'));
    if(!items.length) return {items, index:0};
    const safeIndex = Math.max(0, Math.min(items.length-1, index));
    const el = items[safeIndex];
    el.classList.add('controller-menu-selected');
    try{ el.focus({preventScroll:true}); }catch(err){}
    return {items, index:safeIndex};
  }
  function activateControllerMenuElement(el){
    if(!el) return false;
    const tag = (el.tagName || '').toLowerCase();
    if(tag === 'button' || el.getAttribute('role') === 'button'){ el.click(); return true; }
    if(tag === 'select' || tag === 'input'){
      try{ el.focus({preventScroll:true}); }catch(err){}
      return true;
    }
    if(typeof el.click === 'function'){ el.click(); return true; }
    return false;
  }

  // v92: Gamepad API support for Xbox / PlayStation / Switch-style controllers.
  // Browsers expose most modern pads through the standard mapping, so this auto-detects
  // the controller name for labels while keeping a safe universal fallback.
  const ControllerManager = {
    activeIndex: null,
    profile: 'Generic Controller',
    id: '',
    connected: false,
    ready: false,
    lastButtons: {},
    lastMoveAt: 0,
    lastMoveDir: '',
    lastMoveNeutralAt: 0,
    lastNavAt: 0,
    lastNavDir: '',
    menuRoot: null,
    menuIndex: 0,
    deadzone: 0.82,
    moveDelay: 1100,
    navDelay: 260,
    loopId: null,
    scanTimer: null,
    nextScanAt: 0,
    lastErrorAt: 0,

    init(){
      if(this.ready) return;
      this.ready = true;
      if(!('getGamepads' in navigator)) return;
      window.addEventListener('gamepadconnected', e => this.connect(e.gamepad));
      window.addEventListener('gamepaddisconnected', e => {
        if(this.activeIndex === e.gamepad.index){
          this.disconnect(false);
        }
      });
      // Some browsers only refresh the Gamepad API after a user gesture/focus event.
      ['pointerdown','mousedown','keydown','touchstart'].forEach(evt=>{
        window.addEventListener(evt, () => this.scan(), {passive:true});
      });
      window.addEventListener('focus', () => { this.resetInputState(); this.scan(); }, {passive:true});
      window.addEventListener('blur', () => this.resetInputState(), {passive:true});
      document.addEventListener('visibilitychange', () => {
        this.resetInputState();
        if(!document.hidden) this.scan();
      }, {passive:true});
      this.scan();
      this.scanTimer = setInterval(() => this.scan(), 1000);
      this.loop();
    },

    resetInputState(){
      this.lastButtons = {};
      this.lastMoveDir = '';
      this.lastNavDir = '';
      this.lastMoveAt = 0;
      this.lastMoveNeutralAt = 0;
      this.lastNavAt = 0;
    },

    scan(){
      if(!('getGamepads' in navigator)) return;
      const pads = Array.from(navigator.getGamepads ? navigator.getGamepads() : []).filter(Boolean);
      const current = (this.activeIndex != null) ? pads.find(p => p && p.index === this.activeIndex && p.connected !== false) : null;
      const pad = current || pads.find(p => p && p.connected !== false);
      if(pad) this.connect(pad, true);
      else if(this.connected) this.disconnect(true);
    },

    connect(pad, quiet=false){
      if(!pad) return;
      const changed = this.activeIndex !== pad.index || this.id !== (pad.id || 'Controller');
      this.activeIndex = pad.index;
      this.connected = true;
      this.id = pad.id || 'Controller';
      this.profile = this.detectProfile(this.id);
      if(changed) this.resetInputState();
      if(battle) renderBattle();
      if(!quiet){ toast(`${this.profile} detected. Controller controls enabled.`); renderAll(); }
    },

    disconnect(quiet=false){
      this.connected = false;
      this.activeIndex = null;
      this.id = '';
      this.profile = 'Generic Controller';
      this.resetInputState();
      if(!quiet) toast('Controller disconnected.');
      try{ renderAll(); }catch(err){}
    },

    detectProfile(id=''){
      const name = id.toLowerCase();
      if(/dualsense|dualshock|playstation|wireless controller|ps4|ps5/.test(name)) return 'PlayStation Controller';
      if(/xbox|xinput|microsoft/.test(name)) return 'Xbox Controller';
      if(/switch|joy-con|joycon|pro controller|nintendo/.test(name)) return 'Switch Controller';
      return 'Generic Controller';
    },

    labels(){
      const p=this.profile;
      if(/PlayStation/.test(p)) return {south:'Cross', east:'Circle', west:'Square', north:'Triangle', start:'Options', select:'Share'};
      if(/Switch/.test(p)) return {south:'B', east:'A', west:'Y', north:'X', start:'+', select:'-'};
      if(/Xbox/.test(p)) return {south:'A', east:'B', west:'X', north:'Y', start:'Menu', select:'View'};
      return {south:'Button 1', east:'Button 2', west:'Button 3', north:'Button 4', start:'Start', select:'Select'};
    },

    statusText(){
      if(!('getGamepads' in navigator)) return 'Not supported by this browser';
      const pad=this.currentPad();
      if(!pad) return 'No controller detected';
      const l=this.labels();
      return `${this.profile} // Menus: D-pad hover + ${l.south} confirm // Battle: face buttons attack // ${l.select}: QA console`;
    },

    currentPad(){
      if(!('getGamepads' in navigator)) return null;
      const pads = navigator.getGamepads ? navigator.getGamepads() : [];
      if(this.activeIndex != null){
        const p = pads[this.activeIndex];
        if(p && p.connected !== false) return p;
      }
      const pad = Array.from(pads).filter(Boolean).find(p => p.connected !== false);
      if(pad) this.connect(pad, true);
      else if(this.connected) this.disconnect(true);
      return pad || null;
    },

    pressed(pad, index){
      const b = pad && pad.buttons && pad.buttons[index];
      return !!b && (b.pressed || b.value > 0.55);
    },

    justPressed(pad, index){
      const now = this.pressed(pad,index);
      const was = !!this.lastButtons[index];
      this.lastButtons[index] = now;
      return now && !was;
    },

    movement(pad){
      let dx=0, dy=0;
      if(this.pressed(pad,14)) dx=-1;
      else if(this.pressed(pad,15)) dx=1;
      if(this.pressed(pad,12)) dy=-1;
      else if(this.pressed(pad,13)) dy=1;
      const ax = Number(pad.axes?.[0] || 0);
      const ay = Number(pad.axes?.[1] || 0);
      if(!dx && Math.abs(ax) > this.deadzone) dx = ax > 0 ? 1 : -1;
      if(!dy && Math.abs(ay) > this.deadzone) dy = ay > 0 ? 1 : -1;
      if(dx && dy){
        // Hard single-axis movement prevents corner clipping on controller.
        if(Math.abs(ax) >= Math.abs(ay)) dy=0; else dx=0;
      }
      dx=Math.sign(dx||0); dy=Math.sign(dy||0);
      return {dx,dy,key:`${dx},${dy}`};
    },

    navMove(pad){
      const mv=this.movement(pad);
      const now=performance.now();
      if(!mv.dx && !mv.dy){
        this.lastMoveDir='';
        this.lastMoveNeutralAt=now;
      } else {
        const freshPress = this.lastMoveDir === '';
        const enoughDelay = now - this.lastMoveAt >= this.moveDelay;
        // V142: one slow step per push. Held movement waits over one second.
        if(freshPress || enoughDelay){
          this.lastMoveDir = mv.key;
          this.lastMoveAt = now;
          tryMove(mv.dx,mv.dy,'controller');
          return;
        }
      }
      if(south){ interactNearbyNpc(); return; }
      if(east){ useMedPatch(); return; }
      if(west){ useVectorCell(); return; }
      if(north){ showObjectivePing(); return; }
      if(start){ openOverlay('missionOverlay'); return; }
    }
  };


  function applySettings(){ ensureSettings(); document.body.classList.toggle('no-crt', !state.settings.crt); document.body.classList.toggle('reduced-motion', !!state.settings.reducedMotion); document.body.classList.toggle('large-text', !!state.settings.largeText); const tipBox=$('settingTutorialTips'); if(tipBox) tipBox.checked = state.settings.tutorialTips !== false; const rb=$('settingRouteBeacon'); if(rb) rb.checked = state.settings.routeBeacon !== false; const oc=$('settingObjectiveCompass'); if(oc) oc.checked = state.settings.objectiveCompass !== false; const mr=$('settingMinimapRoute'); if(mr) mr.checked = state.settings.minimapRoute !== false; applyAudioSettings(); }
  let autosaveStarted=false;
  function startAutosave(){
    if(autosaveStarted) return;
    autosaveStarted=true;
    setInterval(()=>{ if(!$('app').classList.contains('hidden')) save(true); }, 30000);
    setInterval(()=>{ processRespawns(); renderUI(); }, 1000);
    setInterval(processRespawns, 500);
    setInterval(()=>{ if(state?.map && state?.player) clampPlayerToMap(); }, 900);
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
      continueBtn:()=>continueSavedGame(),
      newGameBtn:()=>newGameRootStart(),
      introVideoReplayBtn:()=>replayIntroVideo(),
      fractureIndexBtn:()=>openOverlay('fractureOverlay'),
      operatorFilesBtn:()=>openOverlay('operatorOverlay'),
      characterMenuBtn:()=>openOverlay('characterOverlay'),
      anomalyIndexBtn:()=>openOverlay('anomalyOverlay'),
      inventoryDbBtn:()=>openOverlay('inventoryOverlay'),
      progressionBtn:()=>openOverlay('progressionOverlay'),
      missionMenuBtn:()=>openOverlay('missionOverlay'),
      radioMenuBtn:()=>openOverlay('radioOverlay'),
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
    if($('enterBtn')) $('enterBtn').onclick=(e)=>{ if(e){e.preventDefault(); e.stopPropagation();} startIntroVideo(); };
    if($('introSkipVideoBtn')) $('introSkipVideoBtn').onclick=(e)=>{ if(e){e.preventDefault(); e.stopPropagation();} forceIntroMenuRecovery(); };
    document.addEventListener('pointerdown', e=>{
      if(!bootGateIsWaiting()) return;
      if(e.target && e.target.closest && e.target.closest('#introSkipVideoBtn')) return;
      if(e.target && e.target.closest && e.target.closest('#enterBtn, #bootLogo, #introVideoGate, #bootScreen')){
        e.preventDefault();
        startIntroVideo();
      }
    }, {capture:true, passive:false}); document.addEventListener('keydown',e=>{
      if(storyActive && ['Enter',' ','Escape'].includes(e.key)){ e.preventDefault(); if(e.key==='Escape') finishStory(); else advanceStory(); return; }
      const gameIsOpen = !$('app').classList.contains('hidden');
      const overlayOpen = Array.from(document.querySelectorAll('.overlay')).some(o=>!o.classList.contains('hidden'));
      // v44: hard launch fallback. If the main menu is visible, Enter or Space always starts gameplay.
      if((e.key==='Enter'||e.key===' ') && !$('mainMenu').classList.contains('hidden')){ e.preventDefault(); if(hasSaveData()) continueSavedGame(); else newGameRootStart(); return; }
      if(!$('bootScreen').classList.contains('hidden')){ if(e.key==='Escape'){ e.preventDefault(); forceIntroMenuRecovery(); return; } if(e.key==='Enter'||e.key===' '){ e.preventDefault(); startIntroVideo(); return; } }
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
          if(key==='t'){ e.preventDefault(); const tip=battleTacticalAdvice(); const intent=enemyIntentPreview(); toast(`${tip.title}: ${tip.text} // ${intent.title}: ${intent.text}`); return; }
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
        if(key==='n'){ e.preventDefault(); showObjectivePing(); pulseObjective(objectiveGuideText()); return; }
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
    $('newGameBtn').onclick=(e)=>{e.preventDefault(); newGameRootStart();}; $('continueBtn').onclick=(e)=>{ if(e) e.preventDefault(); continueSavedGame(); };
    // v44: if CSS/content gets clipped, clicking the main menu card outside a protocol button also starts.
    $('mainMenu').addEventListener('dblclick',()=>startGame(true)); $('menuBtn').onclick=showMenu; $('saveBtn').onclick=()=>save(false); if($('saveExitBtn')) $('saveExitBtn').onclick=saveAndExitToMenu; $('loadBtn').onclick=load; $('resetBtn').onclick=()=>{localStorage.removeItem(SAVE_KEY); localStorage.removeItem(SAVE_AUTOSLOT_KEY); state=newGameState(); renderAll(); renderSaveHub(); toast('Archive purged.');};
    if($('fullscreenBtn')) $('fullscreenBtn').onclick=toggleFullscreenMode; if($('menuFullscreenBtn')) $('menuFullscreenBtn').onclick=toggleFullscreenMode;
    $('operatorFilesBtn').onclick=()=>openOverlay('operatorOverlay'); $('anomalyIndexBtn').onclick=()=>openOverlay('anomalyOverlay'); $('fractureIndexBtn').onclick=()=>openOverlay('fractureOverlay'); $('inventoryDbBtn').onclick=()=>openOverlay('inventoryOverlay'); $('progressionBtn').onclick=()=>openOverlay('progressionOverlay'); $('progressionTopBtn').onclick=()=>openOverlay('progressionOverlay'); if($('characterMenuTopBtn')) $('characterMenuTopBtn').onclick=()=>openOverlay('characterOverlay'); $('missionMenuBtn').onclick=()=>openOverlay('missionOverlay'); $('missionBtn').onclick=()=>openOverlay('missionOverlay'); if($('bagBtn')) $('bagBtn').onclick=()=>openOverlay('inventoryOverlay'); $('configBtn').onclick=()=>openOverlay('configOverlay'); $('playtestBtn').onclick=()=>openOverlay('playtestOverlay');
    ['operatorFilesBtn','characterMenuBtn','anomalyIndexBtn','fractureIndexBtn','inventoryDbBtn','progressionBtn','missionMenuBtn','radioMenuBtn','storyArchiveMenuBtn','configBtn'].forEach(id=>{ const btn=$(id); if(btn) btn.addEventListener('click',(e)=>{ e.preventDefault(); e.stopPropagation(); const info=$('menuInfo'); if(info){ info.textContent='Protocol opened. Press Esc or Close to return.'; info.classList.add('ok'); } }); });
    ['closeOperatorDb','closeCharacterDb','closeAnomalyDb','closeFractureDb','closeInventoryDb','closeProgression','closeMission','closeRadio','closePlaytest','closeConfig'].forEach(id=>$(id) && ($(id).onclick=closeOverlays));
    bindMobileMoveButtons(); setupMobilePlayability(); ControllerManager.init();
    canvas.addEventListener('click', handleCanvasNpcClick);
    $('settingCrt').onchange=e=>{state.settings.crt=e.target.checked;applySettings();queueAutosave();}; $('settingMotion').onchange=e=>{state.settings.reducedMotion=e.target.checked;applySettings();queueAutosave();}; $('settingLargeText').onchange=e=>{state.settings.largeText=e.target.checked;applySettings();queueAutosave();}; if($('settingTutorialTips')) $('settingTutorialTips').onchange=e=>{state.settings.tutorialTips=e.target.checked;applySettings();queueAutosave();}; if($('settingRouteBeacon')) $('settingRouteBeacon').onchange=e=>{state.settings.routeBeacon=e.target.checked;applySettings();renderAll();queueAutosave();}; if($('settingObjectiveCompass')) $('settingObjectiveCompass').onchange=e=>{state.settings.objectiveCompass=e.target.checked;applySettings();renderAll();queueAutosave();}; if($('settingMinimapRoute')) $('settingMinimapRoute').onchange=e=>{state.settings.minimapRoute=e.target.checked;applySettings();renderAll();queueAutosave();};
    document.addEventListener('click', e=>{
      const selectBtn=e.target.closest && e.target.closest('[data-character-select]');
      const cardBtn=e.target.closest && e.target.closest('[data-character-card]');
      const unlockBtn=e.target.closest && e.target.closest('[data-character-unlock]');
      if(selectBtn){ e.preventDefault(); e.stopPropagation(); playAsOperator(selectBtn.dataset.characterSelect); return; }
      if(unlockBtn){ e.preventDefault(); e.stopPropagation(); unlockOperator(unlockBtn.dataset.characterUnlock); return; }
      if(cardBtn && cardBtn.closest('#characterOverlay')){ e.preventDefault(); e.stopPropagation(); characterCardClick(cardBtn.dataset.characterCard); return; }
    }, true);
    $('qaHeal').onclick=()=>{state.player.hp=combatStatBlock().maxHp;state.player.ep=combatStatBlock().maxEp||state.player.maxEp;renderAll();}; $('qaCredits').onclick=()=>{addCredits(100);renderAll();}; $('qaSetLevel') && ($('qaSetLevel').onclick=()=>qaSetPlayerLevel($('qaPlayerLevel')?.value)); document.querySelectorAll('[data-qa-level]').forEach(btn=>btn.onclick=()=>qaSetPlayerLevel(btn.dataset.qaLevel)); $('qaClearAnomalies').onclick=()=>{state.flags.anomaliesCleared=3;state.flags.bossUnlocked=true;renderAll();}; $('qaBossReady').onclick=()=>{state.flags.bossUnlocked=true;renderAll();}; $('qaCompleteChapter').onclick=()=>{state.flags.chapterComplete=true;renderAll();}; $('qaResetRun').onclick=()=>{state=newGameState();renderAll();}; if($('qaReplayStory')) $('qaReplayStory').onclick=()=>showStory('intro'); if($('qaReplayClearStory')) $('qaReplayClearStory').onclick=()=>{ const key=`${currentStageKey()}Clear`; if(STORY_SCENES[key]) showStory(key); else toast('No stage clear story for this level yet.'); }; if($('qaResetTips')) $('qaResetTips').onclick=resetTutorialTips; if($('qaToggleNavAssist')) $('qaToggleNavAssist').onclick=()=>{ ensureSettings(); const on = !(state.settings.routeBeacon !== false || state.settings.objectiveCompass !== false || state.settings.minimapRoute !== false); state.settings.routeBeacon=on; state.settings.objectiveCompass=on; state.settings.minimapRoute=on; applySettings(); renderAll(); toast(on?'Navigation assist enabled.':'Navigation assist hidden.'); queueAutosave(); }; if($('qaRestoreCheckpoint')) $('qaRestoreCheckpoint').onclick=restoreCheckpointFromQa; if($('qaResetChallenges')) $('qaResetChallenges').onclick=resetProtocolChallenges; $('qaPath').onclick=()=>toast(`${stageDef().id} Route: Terminal → 3 Anomalies → Boss → Exit`); $('qaLoadStage') && ($('qaLoadStage').onclick=()=>qaLoadStage($('qaStageSelect')?.value || currentStageKey())); document.querySelectorAll('[data-qa-stage]').forEach(btn=>btn.onclick=()=>qaLoadStage(btn.dataset.qaStage)); $('qaUnlockStages') && ($('qaUnlockStages').onclick=qaUnlockAllStages); $('qaUnlockCharacters') && ($('qaUnlockCharacters').onclick=qaUnlockAllCharacters); $('qaGrantCharacterShards') && ($('qaGrantCharacterShards').onclick=qaGrantAllCharacterShards);
  }
  window.AV={useMedPatch, useVectorCell, useVectorCellBattle, useOverdriveBattle, openOverlay, startGame, newGameRootStart, showOpeningStoryRoot, showMenu, closeOverlays, routeMainMenuAction, renderAll, save, load, continueSavedGame, hasSaveData, AudioManager, setupMobilePlayability, showStory, forceStoryDialogHard, showChapterClearPanel, buyUpgrade, restoreCheckpoint, loadStage, qaLoadStage, qaUnlockAllStages, qaUnlockAllCharacters, qaGrantAllCharacterShards, qaSetPlayerLevel, ControllerManager, processRespawns, processTrainingNodeRespawns, collectTrainingNode, bankInventoryHtml, collisionRegion, canStandAt, clampPlayerToMap, repairMissionRoutesForCurrentStage, researchSummary, equipItem, unequipSlot, buyShopItem, craftRecipe, syncVyra, claimContract, rerollContract, interactNearbyNpc, talkToNpc, claimFermilatQuest, sideQuestStatusText, objectiveTarget, showObjectivePing, saveToSlot, loadFromSlot, deleteSaveSlot, exportSaveCode, importSaveCode, importSaveCodeFromText, renderSaveHub, renderAudioMixer, setAudioSetting, testSfxSetting, testMusicSetting, claimProtocolChallenge, resetProtocolChallenges, renderProtocolChallengeBoard, renderRouteIntelBoard, setActiveOperator, playAsOperator, currentOperator, unlockOperator, selectOperator, renderCharacterMenuDb, showCharacterFile, characterCardClick, startVectorLockdown, maybeTriggerVectorLockdown, operatorStatBonus, activeOperatorProgress};
  // v48: expose bulletproof direct menu helpers for GitHub Pages testing.
  window.AV_MENU={
    start:()=>newGameRootStart(),
    story:()=>{ state.flags.storySeen.intro=false; forceStoryDialogHard('intro'); },
    continue:()=>continueSavedGame(),
    open:(id)=>openOverlay(id),
    fullscreen:()=>toggleFullscreenMode()
  };


  // v116: Six-stage expansion. F-007 through F-012 are larger 60x36 routes with extra locked gates.
  const stage7Map = [
      "############################################################",
      "#..............#############################################",
      "#..............##................#####.....................#",
      "#.P...S........##................#####.....................#",
      "#................................#####........#............#",
      "#...........C..........E.........#####........#.......C....#",
      "#..............##..........................................#",
      "#..............##..........................................#",
      "#################................#####........#....E.......#",
      "#################................#####........#............#",
      "#################...H............#####........#............#",
      "#################................#####.....................#",
      "##################..##########..######.....................#",
      "##################..##########..##################..########",
      "##################..##########..##################..########",
      "##################..##########..##################..########",
      "##################..#########...............######..########",
      "####......................###...............######..########",
      "####......................#.................######..########",
      "####......................###..........C....######..########",
      "####......................###...............######..########",
      "####......................###...............###............#",
      "####......................###...............###............#",
      "####..........E...........###...............###............#",
      "####........................................###............#",
      "####....#####..########.....................###............#",
      "####......................###...............###............#",
      "####......................###................DD............#",
      "####......................###........................B..X..#",
      "####......................###......C........###............#",
      "####....L.................###..........D....###............#",
      "####......................###...............###............#",
      "####......................#####################............#",
      "###############################################............#",
      "###############################################............#",
      "############################################################"
    ];

  const stage8Map = [
      "############################################################",
      "#..............#############################################",
      "#..............##................#####.....................#",
      "#.P...S........##................#####.....................#",
      "#.......................#........#####.....................#",
      "#...........C..........E#........#####................C....#",
      "#..............##.......#..................................#",
      "#..............##.......#..................................#",
      "#################................#####.............E.......#",
      "#################................#####.....................#",
      "#################...H...#........#####.....................#",
      "#################................#####.....................#",
      "##################..##########..######.....................#",
      "##################..##########..##################..########",
      "##################..##########..##################..########",
      "##################..##########..##################..########",
      "##################..#########...............######..########",
      "####......................###...............######..########",
      "####......................###...............######..########",
      "####......................###..........C....######..########",
      "####......................###...............######..########",
      "####......................###...............###............#",
      "####......................###..#####..##.##.###............#",
      "####..........E...........###...............###............#",
      "####........................................###............#",
      "####........................................###............#",
      "####......................###...............###............#",
      "####......................###................DD............#",
      "####......................###........................B..X..#",
      "####......................###......C........###............#",
      "####....L.................###..........D....###............#",
      "####......................###...............###............#",
      "####......................#####################............#",
      "###############################################............#",
      "###############################################............#",
      "############################################################"
    ];

  const stage9Map = [
      "############################################################",
      "#..............#############################################",
      "#..............##................#####.....................#",
      "#.P...S........##................#####.....................#",
      "#................................#####.....................#",
      "#...........C..........E.........#####................C....#",
      "#..............##..........................................#",
      "#..............##..........................................#",
      "#################................#####.............E.......#",
      "#################................#####.....................#",
      "#################...H............#####.....................#",
      "#################................#####.....................#",
      "##################..##########..######.....................#",
      "##################..##########..##################..########",
      "##################..##########..##################..########",
      "##################..##########..##################..########",
      "##################..#########...........##########..########",
      "####......................###...............######..########",
      "####......................###.....#.........######..########",
      "####......................###.....#....C....######..########",
      "####......................###.....#.........######..########",
      "####......................###.....#.........###............#",
      "####......................###.....#.........###............#",
      "####..........E...........###.....#.........###............#",
      "####........................................###............#",
      "####........................................###............#",
      "####......................###.....#.........###............#",
      "####......................###.....#..........DD............#",
      "####......................###.....#..................B..X..#",
      "####......................###......C........###............#",
      "####....L.................###.....#....D....###............#",
      "####......................###...............###............#",
      "####......................#####################............#",
      "###############################################............#",
      "###############################################............#",
      "############################################################"
    ];

  const stage10Map = [
      "############################################################",
      "#..............#############################################",
      "#..............##................#####.....................#",
      "#.P...S........##................#####.....................#",
      "#................................#####........#............#",
      "#...........C..........E.........#####........#.......C....#",
      "#..............##..........................................#",
      "#..............##..........................................#",
      "#################................#####........#....E.......#",
      "#################................#####........#............#",
      "#################...H............#####........#............#",
      "#################................#####.....................#",
      "##################..##########..######.....................#",
      "##################..##########..##################..########",
      "##################..##########..##################..########",
      "##################..##########..##################..########",
      "##################..#########...............######..########",
      "####......................###...............######..########",
      "####......................#.................######..########",
      "####......................###..........C....######..########",
      "####......................###...............######..########",
      "####......................###...............###............#",
      "####......................###...............###............#",
      "####..........E...........###...............###............#",
      "####........................................###............#",
      "####....#####..########.....................###............#",
      "####......................###...............###............#",
      "####......................###................DD............#",
      "####......................###........................B..X..#",
      "####......................###......C........###............#",
      "####....L.................###..........D....###............#",
      "####......................###...............###............#",
      "####......................#####################............#",
      "###############################################............#",
      "###############################################............#",
      "############################################################"
    ];

  const stage11Map = [
      "############################################################",
      "#..............#############################################",
      "#..............##................#####.....................#",
      "#.P...S........##................#####.....................#",
      "#.......................#........#####.....................#",
      "#...........C..........E#........#####................C....#",
      "#..............##.......#..................................#",
      "#..............##.......#..................................#",
      "#################................#####.............E.......#",
      "#################................#####.....................#",
      "#################...H...#........#####.....................#",
      "#################................#####.....................#",
      "##################..##########..######.....................#",
      "##################..##########..##################..########",
      "##################..##########..##################..########",
      "##################..##########..##################..########",
      "##################..#########...............######..########",
      "####......................###...............######..########",
      "####......................###...............######..########",
      "####......................###..........C....######..########",
      "####......................###...............######..########",
      "####......................###...............###............#",
      "####......................###..#####..##.##.###............#",
      "####..........E...........###...............###............#",
      "####........................................###............#",
      "####........................................###............#",
      "####......................###...............###............#",
      "####......................###................DD............#",
      "####......................###........................B..X..#",
      "####......................###......C........###............#",
      "####....L.................###..........D....###............#",
      "####......................###...............###............#",
      "####......................#####################............#",
      "###############################################............#",
      "###############################################............#",
      "############################################################"
    ];

  const stage12Map = [
      "############################################################",
      "#..............#############################################",
      "#..............##................#####.....................#",
      "#.P...S........##................#####.....................#",
      "#................................#####.....................#",
      "#...........C..........E.........#####................C....#",
      "#..............##..........................................#",
      "#..............##..........................................#",
      "#################................#####.............E.......#",
      "#################................#####.....................#",
      "#################...H............#####.....................#",
      "#################................#####.....................#",
      "##################..##########..######.....................#",
      "##################..##########..##################..########",
      "##################..##########..##################..########",
      "##################..##########..##################..########",
      "##################..#########...........##########..########",
      "####......................###...............######..########",
      "####......................###.....#.........######..########",
      "####......................###.....#....C....######..########",
      "####......................###.....#.........######..########",
      "####......................###.....#.........###............#",
      "####......................###.....#.........###............#",
      "####..........E...........###.....#.........###............#",
      "####........................................###............#",
      "####........................................###............#",
      "####......................###.....#.........###............#",
      "####......................###.....#..........DD............#",
      "####......................###.....#..................B..X..#",
      "####......................###......C........###............#",
      "####....L.................###.....#....D....###............#",
      "####......................###...............###............#",
      "####......................#####################............#",
      "###############################################............#",
      "###############################################............#",
      "############################################################"
    ];

  STAGE_DEFS.f006.nextKey = 'f007';
  Object.assign(STAGE_DEFS, {
    f007: {key:'f007', id:'F-007', title:'Cinder Express Yard', chapter:'Chapter 7 // Cinder Rails', levelReq:30, map:normalizeMapRows(stage7Map), threat:'BRUTAL // RAILYARD CLASS', objective:'rail terminal → 3 cinder anomalies → cinderline boss → extraction', reward:'300 Credits, Cinderline Core, Vector Cells, Vyra Shards', rewardCredits:300, rewardShards:14, clearXp:1350, nextKey:'f008', bg:'assets/battle_backgrounds/ash_wastes_battle.png'},
    f008: {key:'f008', id:'F-008', title:'Flooded Data Vault', chapter:'Chapter 8 // Drowned Archive', levelReq:36, map:normalizeMapRows(stage8Map), threat:'BRUTAL+ // VAULT CLASS', objective:'vault terminal → 3 drowned data anomalies → archive boss → extraction', reward:'360 Credits, Drowned Archive Core, Catalysts, Vyra Shards', rewardCredits:360, rewardShards:16, clearXp:1770, nextKey:'f009', bg:'assets/battle_backgrounds/toxic_sewers_battle.png'},
    f009: {key:'f009', id:'F-009', title:'Rust Orchard', chapter:'Chapter 9 // Harvest Alloy', levelReq:42, map:normalizeMapRows(stage9Map), threat:'NIGHTMARE // ORCHARD CLASS', objective:'orchard terminal → 3 rust growth anomalies → harvest boss → extraction', reward:'430 Credits, Harvest Alloy Core, Rust Cores, Vyra Shards', rewardCredits:430, rewardShards:18, clearXp:2190, nextKey:'f010', bg:'assets/battle_backgrounds/ash_wastes_battle.png'},
    f010: {key:'f010', id:'F-010', title:'Blacksite Observatory', chapter:'Chapter 10 // Parallax Eye', levelReq:49, map:normalizeMapRows(stage10Map), threat:'NIGHTMARE+ // OBSERVATORY CLASS', objective:'blacksite terminal → 3 sky-lens anomalies → parallax boss → extraction', reward:'520 Credits, Parallax Lens Core, Catalysts, Vyra Shards', rewardCredits:520, rewardShards:20, clearXp:2610, nextKey:'f011', bg:'assets/battle_backgrounds/neon_graveyard_battle.png'},
    f011: {key:'f011', id:'F-011', title:'Cryo Basilica', chapter:'Chapter 11 // Frozen Prayer', levelReq:56, map:normalizeMapRows(stage11Map), threat:'APEX // BASILICA CLASS', objective:'basilica terminal → 3 cryo relic anomalies → basilica boss → extraction', reward:'620 Credits, Basilica Wyrm Core, Vector Cells, Vyra Shards', rewardCredits:620, rewardShards:22, clearXp:3030, nextKey:'f012', bg:'assets/battle_backgrounds/neon_graveyard_battle.png'},
    f012: {key:'f012', id:'F-012', title:'Ash Crown Citadel', chapter:'Chapter 12 // Crown of Static', levelReq:63, map:normalizeMapRows(stage12Map), threat:'APEX+ // CITADEL CLASS', objective:'citadel terminal → 3 crown anomalies → ash crown boss → extraction', reward:'750 Credits, Ash Crown Core, Rust Cores, Vyra Shards', rewardCredits:750, rewardShards:25, clearXp:3450, nextKey:null, bg:'assets/battle_backgrounds/toxic_sewers_battle.png'}
  });

  Object.assign(ENCOUNTER_SLOTS, {
    f007: {
      '23,5': {type:'anomaly', index:20},
      '51,8': {type:'anomaly', index:23},
      '14,23': {type:'anomaly', index:26},
      '53,28': {type:'boss', index:0}
    },
    f008: {
      '23,5': {type:'anomaly', index:28},
      '51,8': {type:'anomaly', index:31},
      '14,23': {type:'anomaly', index:34},
      '53,28': {type:'boss', index:3}
    },
    f009: {
      '23,5': {type:'anomaly', index:36},
      '51,8': {type:'anomaly', index:39},
      '14,23': {type:'anomaly', index:42},
      '53,28': {type:'boss', index:6}
    },
    f010: {
      '23,5': {type:'anomaly', index:44},
      '51,8': {type:'anomaly', index:47},
      '14,23': {type:'anomaly', index:50},
      '53,28': {type:'boss', index:9}
    },
    f011: {
      '23,5': {type:'anomaly', index:52},
      '51,8': {type:'anomaly', index:55},
      '14,23': {type:'anomaly', index:58},
      '53,28': {type:'boss', index:12}
    },
    f012: {
      '23,5': {type:'anomaly', index:60},
      '51,8': {type:'anomaly', index:63},
      '14,23': {type:'anomaly', index:66},
      '53,28': {type:'boss', index:15}
    }
  });

  Object.assign(STAGE_ENCOUNTER_DEFS, {
    f007: {
      '23,5': {id:'AN-112', display:'Cinder Rail Grazer', hp:540, atk:61, xp:340, credits:240, loot:['Burnt Alloy','Corrupted Catalyst'], note:'Cinder Express Yard anomaly. This enemy is tuned for the 20-stage level curve and guards a larger locked route branch.'},
      '51,8': {id:'AN-113', display:'Ember Signal Ghoul', hp:585, atk:63, xp:362, credits:258, loot:['Corrupted Catalyst','Burnt Alloy'], note:'Cinder Express Yard anomaly. This enemy is tuned for the 20-stage level curve and guards a larger locked route branch.'},
      '14,23': {id:'AN-114', display:'Furnace Track Reaver', hp:630, atk:65, xp:384, credits:276, loot:['Rust Core','Outpost Access Chip'], note:'Cinder Express Yard anomaly. This enemy is tuned for the 20-stage level curve and guards a larger locked route branch.'},
      '53,28': {id:'BOSS-031', display:'Cinderline Locomaw', hp:1100, atk:80, xp:740, credits:420, loot:['Cinderline Core','Corrupted Catalyst','Vector Cell','Rust Core'], bossReward:'Cinderline Core', note:'Boss-class guardian for Cinder Express Yard. Defeating it stabilizes route F-007 and moves the 20-stage chain forward.'}
    },
    f008: {
      '23,5': {id:'AN-115', display:'Archive Leech', hp:634, atk:69, xp:417, credits:300, loot:['Corrupted Catalyst','Burnt Alloy'], note:'Flooded Data Vault anomaly. This enemy is tuned for the 20-stage level curve and guards a larger locked route branch.'},
      '51,8': {id:'AN-116', display:'Memory Drowned', hp:679, atk:71, xp:439, credits:318, loot:['Rust Core','Outpost Access Chip'], note:'Flooded Data Vault anomaly. This enemy is tuned for the 20-stage level curve and guards a larger locked route branch.'},
      '14,23': {id:'AN-117', display:'Cipher Mold Brute', hp:724, atk:73, xp:461, credits:336, loot:['Vector Cell','Med Patch'], note:'Flooded Data Vault anomaly. This enemy is tuned for the 20-stage level curve and guards a larger locked route branch.'},
      '53,28': {id:'BOSS-032', display:'The Drowned Librarian', hp:1310, atk:91, xp:903, credits:517, loot:['Drowned Archive Core','Corrupted Catalyst','Vector Cell','Rust Core'], bossReward:'Drowned Archive Core', note:'Boss-class guardian for Flooded Data Vault. Defeating it stabilizes route F-008 and moves the 20-stage chain forward.'}
    },
    f009: {
      '23,5': {id:'AN-118', display:'Ironroot Stalker', hp:728, atk:78, xp:494, credits:360, loot:['Rust Core','Outpost Access Chip'], note:'Rust Orchard anomaly. This enemy is tuned for the 20-stage level curve and guards a larger locked route branch.'},
      '51,8': {id:'AN-119', display:'Spore-Tin Wretch', hp:773, atk:80, xp:516, credits:378, loot:['Vector Cell','Med Patch'], note:'Rust Orchard anomaly. This enemy is tuned for the 20-stage level curve and guards a larger locked route branch.'},
      '14,23': {id:'AN-120', display:'Orchard Sawbeast', hp:818, atk:82, xp:538, credits:396, loot:['Scrap Metal','Vector Cell'], note:'Rust Orchard anomaly. This enemy is tuned for the 20-stage level curve and guards a larger locked route branch.'},
      '53,28': {id:'BOSS-033', display:'Harvest Alloy Tyrant', hp:1520, atk:102, xp:1066, credits:614, loot:['Harvest Alloy Core','Corrupted Catalyst','Vector Cell','Rust Core'], bossReward:'Harvest Alloy Core', note:'Boss-class guardian for Rust Orchard. Defeating it stabilizes route F-009 and moves the 20-stage chain forward.'}
    },
    f010: {
      '23,5': {id:'AN-121', display:'Starved Lens Imp', hp:831, atk:87, xp:578, credits:425, loot:['Vector Cell','Med Patch'], note:'Blacksite Observatory anomaly. This enemy is tuned for the 20-stage level curve and guards a larger locked route branch.'},
      '51,8': {id:'AN-122', display:'Nullscope Adept', hp:876, atk:89, xp:600, credits:443, loot:['Scrap Metal','Vector Cell'], note:'Blacksite Observatory anomaly. This enemy is tuned for the 20-stage level curve and guards a larger locked route branch.'},
      '14,23': {id:'AN-123', display:'Orbital Husk', hp:921, atk:91, xp:622, credits:461, loot:['Med Patch','Rust Core'], note:'Blacksite Observatory anomaly. This enemy is tuned for the 20-stage level curve and guards a larger locked route branch.'},
      '53,28': {id:'BOSS-034', display:'Parallax Watcher', hp:1745, atk:114, xp:1242, credits:718, loot:['Parallax Lens Core','Corrupted Catalyst','Vector Cell','Rust Core'], bossReward:'Parallax Lens Core', note:'Boss-class guardian for Blacksite Observatory. Defeating it stabilizes route F-010 and moves the 20-stage chain forward.'}
    },
    f011: {
      '23,5': {id:'AN-124', display:'Frost-Vector Acolyte', hp:934, atk:96, xp:662, credits:490, loot:['Scrap Metal','Vector Cell'], note:'Cryo Basilica anomaly. This enemy is tuned for the 20-stage level curve and guards a larger locked route branch.'},
      '51,8': {id:'AN-125', display:'Relic Ice Maw', hp:979, atk:98, xp:684, credits:508, loot:['Med Patch','Rust Core'], note:'Cryo Basilica anomaly. This enemy is tuned for the 20-stage level curve and guards a larger locked route branch.'},
      '14,23': {id:'AN-126', display:'Shrine Null Saint', hp:1024, atk:100, xp:706, credits:526, loot:['Burnt Alloy','Corrupted Catalyst'], note:'Cryo Basilica anomaly. This enemy is tuned for the 20-stage level curve and guards a larger locked route branch.'},
      '53,28': {id:'BOSS-035', display:'Basilica Wyrm', hp:1970, atk:127, xp:1418, credits:822, loot:['Basilica Wyrm Core','Corrupted Catalyst','Vector Cell','Rust Core'], bossReward:'Basilica Wyrm Core', note:'Boss-class guardian for Cryo Basilica. Defeating it stabilizes route F-011 and moves the 20-stage chain forward.'}
    },
    f012: {
      '23,5': {id:'AN-127', display:'Crownless Butcher', hp:1037, atk:106, xp:746, credits:555, loot:['Med Patch','Rust Core'], note:'Ash Crown Citadel anomaly. This enemy is tuned for the 20-stage level curve and guards a larger locked route branch.'},
      '51,8': {id:'AN-128', display:'Throne Static Lich', hp:1082, atk:108, xp:768, credits:573, loot:['Burnt Alloy','Corrupted Catalyst'], note:'Ash Crown Citadel anomaly. This enemy is tuned for the 20-stage level curve and guards a larger locked route branch.'},
      '14,23': {id:'AN-129', display:'Royal Ash Seraph', hp:1127, atk:110, xp:790, credits:591, loot:['Corrupted Catalyst','Burnt Alloy'], note:'Ash Crown Citadel anomaly. This enemy is tuned for the 20-stage level curve and guards a larger locked route branch.'},
      '53,28': {id:'BOSS-036', display:'Ash Crown Regent', hp:2195, atk:139, xp:1594, credits:926, loot:['Ash Crown Core','Corrupted Catalyst','Vector Cell','Rust Core'], bossReward:'Ash Crown Core', note:'Boss-class guardian for Ash Crown Citadel. Defeating it stabilizes route F-012 and moves the 20-stage chain forward.'}
    }
  });

  Object.assign(NPC_DEFS.fermilat.stages, {
    f007: {x:39, y:25, scene:'fermilatF007'},
    f008: {x:39, y:25, scene:'fermilatF008'},
    f009: {x:39, y:25, scene:'fermilatF009'},
    f010: {x:39, y:25, scene:'fermilatF010'},
    f011: {x:39, y:25, scene:'fermilatF011'},
    f012: {x:39, y:25, scene:'fermilatF012'}
  });

  Object.assign(FERMILAT_FAVOR_DEFS, {
    f007:{title:'Cinder Express Yard Favor', target:7, credits:210, syncXp:330, skillXp:430, items:{'Vector Cell':3,'Corrupted Catalyst':1,'Rust Core':1}, ask:'Fermilat wants 7 anomalies deleted in Cinder Express Yard before he calls the route survivable.', done:'Fermilat admits Cinder Express Yard is slightly less horrible now. This is his version of praise.'},
    f008:{title:'Flooded Data Vault Favor', target:8, credits:255, syncXp:400, skillXp:510, items:{'Vector Cell':3,'Corrupted Catalyst':1,'Rust Core':1}, ask:'Fermilat wants 8 anomalies deleted in Flooded Data Vault before he calls the route survivable.', done:'Fermilat admits Flooded Data Vault is slightly less horrible now. This is his version of praise.'},
    f009:{title:'Rust Orchard Favor', target:9, credits:300, syncXp:470, skillXp:590, items:{'Vector Cell':4,'Corrupted Catalyst':2,'Rust Core':1}, ask:'Fermilat wants 9 anomalies deleted in Rust Orchard before he calls the route survivable.', done:'Fermilat admits Rust Orchard is slightly less horrible now. This is his version of praise.'},
    f010:{title:'Blacksite Observatory Favor', target:10, credits:345, syncXp:540, skillXp:670, items:{'Vector Cell':4,'Corrupted Catalyst':2,'Rust Core':2}, ask:'Fermilat wants 10 anomalies deleted in Blacksite Observatory before he calls the route survivable.', done:'Fermilat admits Blacksite Observatory is slightly less horrible now. This is his version of praise.'},
    f011:{title:'Cryo Basilica Favor', target:11, credits:390, syncXp:610, skillXp:750, items:{'Vector Cell':5,'Corrupted Catalyst':3,'Rust Core':2}, ask:'Fermilat wants 11 anomalies deleted in Cryo Basilica before he calls the route survivable.', done:'Fermilat admits Cryo Basilica is slightly less horrible now. This is his version of praise.'},
    f012:{title:'Ash Crown Citadel Favor', target:12, credits:435, syncXp:680, skillXp:830, items:{'Vector Cell':5,'Corrupted Catalyst':3,'Rust Core':2}, ask:'Fermilat wants 12 anomalies deleted in Ash Crown Citadel before he calls the route survivable.', done:'Fermilat admits Ash Crown Citadel is slightly less horrible now. This is his version of praise.'}
  });

  Object.assign(stageVisualPacks, {
    f007: {...stageVisualPacks.f004, floorTint:'rgba(40, 80, 120, .18)', pathTint:'rgba(90, 150, 220, .13)', wallEdge:'rgba(255,255,255,.20)', props:[...((stageVisualPacks.f004 && stageVisualPacks.f004.props)||[]), {x:35,y:29,img:(stageVisualPacks.f004.lore||mapArt.lore),w:44,h:44}, {x:54,y:6,img:(stageVisualPacks.f004.chest||mapArt.chest),w:42,h:42}] },
    f008: {...stageVisualPacks.f005, floorTint:'rgba(65, 88, 135, .18)', pathTint:'rgba(105, 140, 202, .13)', wallEdge:'rgba(255,255,255,.20)', props:[...((stageVisualPacks.f005 && stageVisualPacks.f005.props)||[]), {x:35,y:29,img:(stageVisualPacks.f005.lore||mapArt.lore),w:44,h:44}, {x:54,y:6,img:(stageVisualPacks.f005.chest||mapArt.chest),w:42,h:42}] },
    f009: {...stageVisualPacks.f006, floorTint:'rgba(90, 96, 150, .18)', pathTint:'rgba(120, 130, 184, .13)', wallEdge:'rgba(255,255,255,.20)', props:[...((stageVisualPacks.f006 && stageVisualPacks.f006.props)||[]), {x:35,y:29,img:(stageVisualPacks.f006.lore||mapArt.lore),w:44,h:44}, {x:54,y:6,img:(stageVisualPacks.f006.chest||mapArt.chest),w:42,h:42}] },
    f010: {...stageVisualPacks.f003, floorTint:'rgba(115, 104, 165, .18)', pathTint:'rgba(135, 120, 166, .13)', wallEdge:'rgba(255,255,255,.20)', props:[...((stageVisualPacks.f003 && stageVisualPacks.f003.props)||[]), {x:35,y:29,img:(stageVisualPacks.f003.lore||mapArt.lore),w:44,h:44}, {x:54,y:6,img:(stageVisualPacks.f003.chest||mapArt.chest),w:42,h:42}] },
    f011: {...stageVisualPacks.f002, floorTint:'rgba(140, 112, 180, .18)', pathTint:'rgba(150, 110, 148, .13)', wallEdge:'rgba(255,255,255,.20)', props:[...((stageVisualPacks.f002 && stageVisualPacks.f002.props)||[]), {x:35,y:29,img:(stageVisualPacks.f002.lore||mapArt.lore),w:44,h:44}, {x:54,y:6,img:(stageVisualPacks.f002.chest||mapArt.chest),w:42,h:42}] },
    f012: {...stageVisualPacks.f001, floorTint:'rgba(165, 120, 195, .18)', pathTint:'rgba(165, 100, 130, .13)', wallEdge:'rgba(255,255,255,.20)', props:[...((stageVisualPacks.f001 && stageVisualPacks.f001.props)||[]), {x:35,y:29,img:(stageVisualPacks.f001.lore||mapArt.lore),w:44,h:44}, {x:54,y:6,img:(stageVisualPacks.f001.chest||mapArt.chest),w:42,h:42}] }
  });

  Object.assign(stageFloorStyles, {
    f007: {base:'#23120d', alt:'#2e1811', grit:'rgba(255,142,66,.10)', line:'rgba(255,204,108,.07)'},
    f008: {base:'#071b22', alt:'#0b2933', grit:'rgba(80,220,255,.10)', line:'rgba(120,255,230,.07)'},
    f009: {base:'#1d160b', alt:'#2a210f', grit:'rgba(255,180,70,.10)', line:'rgba(180,255,120,.06)'},
    f010: {base:'#0a0d22', alt:'#11183a', grit:'rgba(140,170,255,.10)', line:'rgba(255,255,255,.05)'},
    f011: {base:'#101e2e', alt:'#142944', grit:'rgba(160,220,255,.10)', line:'rgba(200,255,255,.06)'},
    f012: {base:'#220b15', alt:'#330f20', grit:'rgba(255,76,130,.11)', line:'rgba(255,220,180,.06)'}
  });

  Object.assign(STORY_SCENES, {
    f007Intro: {kicker:'F-007 INTRO // CINDER EXPRESS YARD', title:'Cinder Rails', tag:'Level Req 30 // Route 7/20', speaker:'AVOS', lines:[{speaker:'AVOS', portrait:'vyra', text:'Cinder Express Yard is online. Bigger map, more locked branches, and enemies that failed every personality test.'},{speaker:'VYRA', portrait:'vyra', text:'So the route gets worse and the level cap is still 99? Good. I was worried this would be relaxing.'},{speaker:'AVOS', portrait:'vyra', text:'This fracture is tuned for the 20-stage chain. Clear it, recover the core, and keep moving.'}]},
    f007Terminal: {kicker:'F-007 TERMINAL // ROUTE SYNC', title:'TERMINAL ONLINE', tag:'Checkpoint and anomaly routing updated.', speaker:'AVOS', lines:[{speaker:'AVOS', portrait:'vyra', text:'Terminal synced. AVOS marked three major anomaly signatures and the locked boss route.'},{speaker:'VYRA', portrait:'vyra', text:'I see more locked doors than exits.'},{speaker:'AVOS', portrait:'vyra', text:'Correct. Clear three anomalies and the security doors will embarrass themselves open.'}]},
    f007Lore: {kicker:'F-007 ARCHIVE // FIELD LOG', title:'BROKEN ROUTE LOG', tag:'Recovered lore fragment.', speaker:'VYRA', lines:[{speaker:'VYRA', portrait:'vyra', text:'Archive fragment recovered. This zone was expanded after the Ash Event to hold something that learned how to knock back.'},{speaker:'AVOS', portrait:'vyra', text:'Bad news: it worked. Worse news: it is still here.'}]},
    f007BossIntro: {kicker:'F-007 BOSS // CORE GUARDIAN', title:'CINDERLINE LOCOMAW', tag:'Boss route unlocked.', speaker:'AVOS', lines:[{speaker:'AVOS', portrait:'vyra', text:'Boss-class guardian detected: Cinderline Locomaw. Its core anchors this fracture.'},{speaker:'VYRA', portrait:'vyra', text:'Then I take the core.'},{speaker:'AVOS', portrait:'vyra', text:'Yes. Preferably while not becoming a wall decoration.'}]},
    f007BossDefeated: {kicker:'F-007 BOSS DELETED // CORE EXPOSED', title:'CINDERLINE CORE RECOVERED', tag:'Extraction route online.', speaker:'VYRA', lines:[{speaker:'VYRA', portrait:'vyra', text:'Boss down. Core is stable.'},{speaker:'AVOS', portrait:'vyra', text:'Extraction marker is online. Route chain progress: 7/20.'}]},
    f007Clear: {kicker:'CHAPTER 7 COMPLETE // CINDERLINE CORE', title:'CINDER EXPRESS YARD STABILIZED', tag:'Next route: Flooded Data Vault', speaker:'AVOS', lines:[{speaker:'AVOS', portrait:'vyra', text:'Cinderline Core secured. Cinder Express Yard is no longer trying to chew through the route map.'},{speaker:'VYRA', portrait:'vyra', text:'How many of these until the end?'},{speaker:'AVOS', portrait:'vyra', text:'Twenty total stages planned. Twelve are now playable. Eight more remain in the deep endgame chain.'}]},
    fermilatF007: {kicker:'FERMILAT CONTACT // F-007', title:'Fermilat Found Something', tag:'Optional favor and stash.', speaker:'FERMILAT', lines:[{speaker:'FERMILAT', portrait:'fermilat', text:'I found a locked route branch and immediately decided it was your problem.'},{speaker:'VYRA', portrait:'vyra', text:'That is every conversation with you.'},{speaker:'FERMILAT', portrait:'fermilat', text:'Delete the anomalies in Cinder Express Yard. I will reward you with things I definitely did not steal from a vending machine.'}]},
    f008Intro: {kicker:'F-008 INTRO // FLOODED DATA VAULT', title:'Drowned Archive', tag:'Level Req 35 // Route 8/20', speaker:'AVOS', lines:[{speaker:'AVOS', portrait:'vyra', text:'Flooded Data Vault is online. Bigger map, more locked branches, and enemies that failed every personality test.'},{speaker:'VYRA', portrait:'vyra', text:'So the route gets worse and the level cap is still 99? Good. I was worried this would be relaxing.'},{speaker:'AVOS', portrait:'vyra', text:'This fracture is tuned for the 20-stage chain. Clear it, recover the core, and keep moving.'}]},
    f008Terminal: {kicker:'F-008 TERMINAL // ROUTE SYNC', title:'TERMINAL ONLINE', tag:'Checkpoint and anomaly routing updated.', speaker:'AVOS', lines:[{speaker:'AVOS', portrait:'vyra', text:'Terminal synced. AVOS marked three major anomaly signatures and the locked boss route.'},{speaker:'VYRA', portrait:'vyra', text:'I see more locked doors than exits.'},{speaker:'AVOS', portrait:'vyra', text:'Correct. Clear three anomalies and the security doors will embarrass themselves open.'}]},
    f008Lore: {kicker:'F-008 ARCHIVE // FIELD LOG', title:'BROKEN ROUTE LOG', tag:'Recovered lore fragment.', speaker:'VYRA', lines:[{speaker:'VYRA', portrait:'vyra', text:'Archive fragment recovered. This zone was expanded after the Ash Event to hold something that learned how to knock back.'},{speaker:'AVOS', portrait:'vyra', text:'Bad news: it worked. Worse news: it is still here.'}]},
    f008BossIntro: {kicker:'F-008 BOSS // CORE GUARDIAN', title:'THE DROWNED LIBRARIAN', tag:'Boss route unlocked.', speaker:'AVOS', lines:[{speaker:'AVOS', portrait:'vyra', text:'Boss-class guardian detected: The Drowned Librarian. Its core anchors this fracture.'},{speaker:'VYRA', portrait:'vyra', text:'Then I take the core.'},{speaker:'AVOS', portrait:'vyra', text:'Yes. Preferably while not becoming a wall decoration.'}]},
    f008BossDefeated: {kicker:'F-008 BOSS DELETED // CORE EXPOSED', title:'DROWNED ARCHIVE CORE RECOVERED', tag:'Extraction route online.', speaker:'VYRA', lines:[{speaker:'VYRA', portrait:'vyra', text:'Boss down. Core is stable.'},{speaker:'AVOS', portrait:'vyra', text:'Extraction marker is online. Route chain progress: 8/20.'}]},
    f008Clear: {kicker:'CHAPTER 8 COMPLETE // DROWNED ARCHIVE CORE', title:'FLOODED DATA VAULT STABILIZED', tag:'Next route: Rust Orchard', speaker:'AVOS', lines:[{speaker:'AVOS', portrait:'vyra', text:'Drowned Archive Core secured. Flooded Data Vault is no longer trying to chew through the route map.'},{speaker:'VYRA', portrait:'vyra', text:'How many of these until the end?'},{speaker:'AVOS', portrait:'vyra', text:'Twenty total stages planned. Twelve are now playable. Eight more remain in the deep endgame chain.'}]},
    fermilatF008: {kicker:'FERMILAT CONTACT // F-008', title:'Fermilat Found Something', tag:'Optional favor and stash.', speaker:'FERMILAT', lines:[{speaker:'FERMILAT', portrait:'fermilat', text:'I found a locked route branch and immediately decided it was your problem.'},{speaker:'VYRA', portrait:'vyra', text:'That is every conversation with you.'},{speaker:'FERMILAT', portrait:'fermilat', text:'Delete the anomalies in Flooded Data Vault. I will reward you with things I definitely did not steal from a vending machine.'}]},
    f009Intro: {kicker:'F-009 INTRO // RUST ORCHARD', title:'Harvest Alloy', tag:'Level Req 40 // Route 9/20', speaker:'AVOS', lines:[{speaker:'AVOS', portrait:'vyra', text:'Rust Orchard is online. Bigger map, more locked branches, and enemies that failed every personality test.'},{speaker:'VYRA', portrait:'vyra', text:'So the route gets worse and the level cap is still 99? Good. I was worried this would be relaxing.'},{speaker:'AVOS', portrait:'vyra', text:'This fracture is tuned for the 20-stage chain. Clear it, recover the core, and keep moving.'}]},
    f009Terminal: {kicker:'F-009 TERMINAL // ROUTE SYNC', title:'TERMINAL ONLINE', tag:'Checkpoint and anomaly routing updated.', speaker:'AVOS', lines:[{speaker:'AVOS', portrait:'vyra', text:'Terminal synced. AVOS marked three major anomaly signatures and the locked boss route.'},{speaker:'VYRA', portrait:'vyra', text:'I see more locked doors than exits.'},{speaker:'AVOS', portrait:'vyra', text:'Correct. Clear three anomalies and the security doors will embarrass themselves open.'}]},
    f009Lore: {kicker:'F-009 ARCHIVE // FIELD LOG', title:'BROKEN ROUTE LOG', tag:'Recovered lore fragment.', speaker:'VYRA', lines:[{speaker:'VYRA', portrait:'vyra', text:'Archive fragment recovered. This zone was expanded after the Ash Event to hold something that learned how to knock back.'},{speaker:'AVOS', portrait:'vyra', text:'Bad news: it worked. Worse news: it is still here.'}]},
    f009BossIntro: {kicker:'F-009 BOSS // CORE GUARDIAN', title:'HARVEST ALLOY TYRANT', tag:'Boss route unlocked.', speaker:'AVOS', lines:[{speaker:'AVOS', portrait:'vyra', text:'Boss-class guardian detected: Harvest Alloy Tyrant. Its core anchors this fracture.'},{speaker:'VYRA', portrait:'vyra', text:'Then I take the core.'},{speaker:'AVOS', portrait:'vyra', text:'Yes. Preferably while not becoming a wall decoration.'}]},
    f009BossDefeated: {kicker:'F-009 BOSS DELETED // CORE EXPOSED', title:'HARVEST ALLOY CORE RECOVERED', tag:'Extraction route online.', speaker:'VYRA', lines:[{speaker:'VYRA', portrait:'vyra', text:'Boss down. Core is stable.'},{speaker:'AVOS', portrait:'vyra', text:'Extraction marker is online. Route chain progress: 9/20.'}]},
    f009Clear: {kicker:'CHAPTER 9 COMPLETE // HARVEST ALLOY CORE', title:'RUST ORCHARD STABILIZED', tag:'Next route: Blacksite Observatory', speaker:'AVOS', lines:[{speaker:'AVOS', portrait:'vyra', text:'Harvest Alloy Core secured. Rust Orchard is no longer trying to chew through the route map.'},{speaker:'VYRA', portrait:'vyra', text:'How many of these until the end?'},{speaker:'AVOS', portrait:'vyra', text:'Twenty total stages planned. Twelve are now playable. Eight more remain in the deep endgame chain.'}]},
    fermilatF009: {kicker:'FERMILAT CONTACT // F-009', title:'Fermilat Found Something', tag:'Optional favor and stash.', speaker:'FERMILAT', lines:[{speaker:'FERMILAT', portrait:'fermilat', text:'I found a locked route branch and immediately decided it was your problem.'},{speaker:'VYRA', portrait:'vyra', text:'That is every conversation with you.'},{speaker:'FERMILAT', portrait:'fermilat', text:'Delete the anomalies in Rust Orchard. I will reward you with things I definitely did not steal from a vending machine.'}]},
    f010Intro: {kicker:'F-010 INTRO // BLACKSITE OBSERVATORY', title:'Parallax Eye', tag:'Level Req 45 // Route 10/20', speaker:'AVOS', lines:[{speaker:'AVOS', portrait:'vyra', text:'Blacksite Observatory is online. Bigger map, more locked branches, and enemies that failed every personality test.'},{speaker:'VYRA', portrait:'vyra', text:'So the route gets worse and the level cap is still 99? Good. I was worried this would be relaxing.'},{speaker:'AVOS', portrait:'vyra', text:'This fracture is tuned for the 20-stage chain. Clear it, recover the core, and keep moving.'}]},
    f010Terminal: {kicker:'F-010 TERMINAL // ROUTE SYNC', title:'TERMINAL ONLINE', tag:'Checkpoint and anomaly routing updated.', speaker:'AVOS', lines:[{speaker:'AVOS', portrait:'vyra', text:'Terminal synced. AVOS marked three major anomaly signatures and the locked boss route.'},{speaker:'VYRA', portrait:'vyra', text:'I see more locked doors than exits.'},{speaker:'AVOS', portrait:'vyra', text:'Correct. Clear three anomalies and the security doors will embarrass themselves open.'}]},
    f010Lore: {kicker:'F-010 ARCHIVE // FIELD LOG', title:'BROKEN ROUTE LOG', tag:'Recovered lore fragment.', speaker:'VYRA', lines:[{speaker:'VYRA', portrait:'vyra', text:'Archive fragment recovered. This zone was expanded after the Ash Event to hold something that learned how to knock back.'},{speaker:'AVOS', portrait:'vyra', text:'Bad news: it worked. Worse news: it is still here.'}]},
    f010BossIntro: {kicker:'F-010 BOSS // CORE GUARDIAN', title:'PARALLAX WATCHER', tag:'Boss route unlocked.', speaker:'AVOS', lines:[{speaker:'AVOS', portrait:'vyra', text:'Boss-class guardian detected: Parallax Watcher. Its core anchors this fracture.'},{speaker:'VYRA', portrait:'vyra', text:'Then I take the core.'},{speaker:'AVOS', portrait:'vyra', text:'Yes. Preferably while not becoming a wall decoration.'}]},
    f010BossDefeated: {kicker:'F-010 BOSS DELETED // CORE EXPOSED', title:'PARALLAX LENS CORE RECOVERED', tag:'Extraction route online.', speaker:'VYRA', lines:[{speaker:'VYRA', portrait:'vyra', text:'Boss down. Core is stable.'},{speaker:'AVOS', portrait:'vyra', text:'Extraction marker is online. Route chain progress: 10/20.'}]},
    f010Clear: {kicker:'CHAPTER 10 COMPLETE // PARALLAX LENS CORE', title:'BLACKSITE OBSERVATORY STABILIZED', tag:'Next route: Cryo Basilica', speaker:'AVOS', lines:[{speaker:'AVOS', portrait:'vyra', text:'Parallax Lens Core secured. Blacksite Observatory is no longer trying to chew through the route map.'},{speaker:'VYRA', portrait:'vyra', text:'How many of these until the end?'},{speaker:'AVOS', portrait:'vyra', text:'Twenty total stages planned. Twelve are now playable. Eight more remain in the deep endgame chain.'}]},
    fermilatF010: {kicker:'FERMILAT CONTACT // F-010', title:'Fermilat Found Something', tag:'Optional favor and stash.', speaker:'FERMILAT', lines:[{speaker:'FERMILAT', portrait:'fermilat', text:'I found a locked route branch and immediately decided it was your problem.'},{speaker:'VYRA', portrait:'vyra', text:'That is every conversation with you.'},{speaker:'FERMILAT', portrait:'fermilat', text:'Delete the anomalies in Blacksite Observatory. I will reward you with things I definitely did not steal from a vending machine.'}]},
    f011Intro: {kicker:'F-011 INTRO // CRYO BASILICA', title:'Frozen Prayer', tag:'Level Req 50 // Route 11/20', speaker:'AVOS', lines:[{speaker:'AVOS', portrait:'vyra', text:'Cryo Basilica is online. Bigger map, more locked branches, and enemies that failed every personality test.'},{speaker:'VYRA', portrait:'vyra', text:'So the route gets worse and the level cap is still 99? Good. I was worried this would be relaxing.'},{speaker:'AVOS', portrait:'vyra', text:'This fracture is tuned for the 20-stage chain. Clear it, recover the core, and keep moving.'}]},
    f011Terminal: {kicker:'F-011 TERMINAL // ROUTE SYNC', title:'TERMINAL ONLINE', tag:'Checkpoint and anomaly routing updated.', speaker:'AVOS', lines:[{speaker:'AVOS', portrait:'vyra', text:'Terminal synced. AVOS marked three major anomaly signatures and the locked boss route.'},{speaker:'VYRA', portrait:'vyra', text:'I see more locked doors than exits.'},{speaker:'AVOS', portrait:'vyra', text:'Correct. Clear three anomalies and the security doors will embarrass themselves open.'}]},
    f011Lore: {kicker:'F-011 ARCHIVE // FIELD LOG', title:'BROKEN ROUTE LOG', tag:'Recovered lore fragment.', speaker:'VYRA', lines:[{speaker:'VYRA', portrait:'vyra', text:'Archive fragment recovered. This zone was expanded after the Ash Event to hold something that learned how to knock back.'},{speaker:'AVOS', portrait:'vyra', text:'Bad news: it worked. Worse news: it is still here.'}]},
    f011BossIntro: {kicker:'F-011 BOSS // CORE GUARDIAN', title:'BASILICA WYRM', tag:'Boss route unlocked.', speaker:'AVOS', lines:[{speaker:'AVOS', portrait:'vyra', text:'Boss-class guardian detected: Basilica Wyrm. Its core anchors this fracture.'},{speaker:'VYRA', portrait:'vyra', text:'Then I take the core.'},{speaker:'AVOS', portrait:'vyra', text:'Yes. Preferably while not becoming a wall decoration.'}]},
    f011BossDefeated: {kicker:'F-011 BOSS DELETED // CORE EXPOSED', title:'BASILICA WYRM CORE RECOVERED', tag:'Extraction route online.', speaker:'VYRA', lines:[{speaker:'VYRA', portrait:'vyra', text:'Boss down. Core is stable.'},{speaker:'AVOS', portrait:'vyra', text:'Extraction marker is online. Route chain progress: 11/20.'}]},
    f011Clear: {kicker:'CHAPTER 11 COMPLETE // BASILICA WYRM CORE', title:'CRYO BASILICA STABILIZED', tag:'Next route: Ash Crown Citadel', speaker:'AVOS', lines:[{speaker:'AVOS', portrait:'vyra', text:'Basilica Wyrm Core secured. Cryo Basilica is no longer trying to chew through the route map.'},{speaker:'VYRA', portrait:'vyra', text:'How many of these until the end?'},{speaker:'AVOS', portrait:'vyra', text:'Twenty total stages planned. Twelve are now playable. Eight more remain in the deep endgame chain.'}]},
    fermilatF011: {kicker:'FERMILAT CONTACT // F-011', title:'Fermilat Found Something', tag:'Optional favor and stash.', speaker:'FERMILAT', lines:[{speaker:'FERMILAT', portrait:'fermilat', text:'I found a locked route branch and immediately decided it was your problem.'},{speaker:'VYRA', portrait:'vyra', text:'That is every conversation with you.'},{speaker:'FERMILAT', portrait:'fermilat', text:'Delete the anomalies in Cryo Basilica. I will reward you with things I definitely did not steal from a vending machine.'}]},
    f012Intro: {kicker:'F-012 INTRO // ASH CROWN CITADEL', title:'Crown of Static', tag:'Level Req 55 // Route 12/20', speaker:'AVOS', lines:[{speaker:'AVOS', portrait:'vyra', text:'Ash Crown Citadel is online. Bigger map, more locked branches, and enemies that failed every personality test.'},{speaker:'VYRA', portrait:'vyra', text:'So the route gets worse and the level cap is still 99? Good. I was worried this would be relaxing.'},{speaker:'AVOS', portrait:'vyra', text:'This fracture is tuned for the 20-stage chain. Clear it, recover the core, and keep moving.'}]},
    f012Terminal: {kicker:'F-012 TERMINAL // ROUTE SYNC', title:'TERMINAL ONLINE', tag:'Checkpoint and anomaly routing updated.', speaker:'AVOS', lines:[{speaker:'AVOS', portrait:'vyra', text:'Terminal synced. AVOS marked three major anomaly signatures and the locked boss route.'},{speaker:'VYRA', portrait:'vyra', text:'I see more locked doors than exits.'},{speaker:'AVOS', portrait:'vyra', text:'Correct. Clear three anomalies and the security doors will embarrass themselves open.'}]},
    f012Lore: {kicker:'F-012 ARCHIVE // FIELD LOG', title:'BROKEN ROUTE LOG', tag:'Recovered lore fragment.', speaker:'VYRA', lines:[{speaker:'VYRA', portrait:'vyra', text:'Archive fragment recovered. This zone was expanded after the Ash Event to hold something that learned how to knock back.'},{speaker:'AVOS', portrait:'vyra', text:'Bad news: it worked. Worse news: it is still here.'}]},
    f012BossIntro: {kicker:'F-012 BOSS // CORE GUARDIAN', title:'ASH CROWN REGENT', tag:'Boss route unlocked.', speaker:'AVOS', lines:[{speaker:'AVOS', portrait:'vyra', text:'Boss-class guardian detected: Ash Crown Regent. Its core anchors this fracture.'},{speaker:'VYRA', portrait:'vyra', text:'Then I take the core.'},{speaker:'AVOS', portrait:'vyra', text:'Yes. Preferably while not becoming a wall decoration.'}]},
    f012BossDefeated: {kicker:'F-012 BOSS DELETED // CORE EXPOSED', title:'ASH CROWN CORE RECOVERED', tag:'Extraction route online.', speaker:'VYRA', lines:[{speaker:'VYRA', portrait:'vyra', text:'Boss down. Core is stable.'},{speaker:'AVOS', portrait:'vyra', text:'Extraction marker is online. Route chain progress: 12/20.'}]},
    f012Clear: {kicker:'CHAPTER 12 COMPLETE // ASH CROWN CORE', title:'ASH CROWN CITADEL STABILIZED', tag:'Next route: future endgame fractures', speaker:'AVOS', lines:[{speaker:'AVOS', portrait:'vyra', text:'Ash Crown Core secured. Ash Crown Citadel is no longer trying to chew through the route map.'},{speaker:'VYRA', portrait:'vyra', text:'How many of these until the end?'},{speaker:'AVOS', portrait:'vyra', text:'Twenty total stages planned. Twelve are now playable. Eight more remain in the deep endgame chain.'}]},
    fermilatF012: {kicker:'FERMILAT CONTACT // F-012', title:'Fermilat Found Something', tag:'Optional favor and stash.', speaker:'FERMILAT', lines:[{speaker:'FERMILAT', portrait:'fermilat', text:'I found a locked route branch and immediately decided it was your problem.'},{speaker:'VYRA', portrait:'vyra', text:'That is every conversation with you.'},{speaker:'FERMILAT', portrait:'fermilat', text:'Delete the anomalies in Ash Crown Citadel. I will reward you with things I definitely did not steal from a vending machine.'}]}
  });

  function avStageAtOrBeyond(key){
    const order=Object.keys(STAGE_DEFS);
    return order.indexOf(currentStageKey()) >= order.indexOf(key);
  }
  STORY_ARCHIVE_ENTRIES.push(
    {key:'f007Intro', chapter:'Chapter 7', title:'Cinder Express Yard', desc:'Vyra enters Cinder Express Yard.', unlock:()=>playerMeetsStageRequirement('f007') || !!state.stages?.f007?.unlocked || avStageAtOrBeyond('f007')},
    {key:'f007Clear', chapter:'Chapter 7', title:'Cinder Express Yard Stabilized', desc:'Cinderline Core recovered and the route chain advances.', unlock:()=>!!state.stages?.f007?.complete || avStageAtOrBeyond('f007')},
    {key:'f008Intro', chapter:'Chapter 8', title:'Flooded Data Vault', desc:'Vyra enters Flooded Data Vault.', unlock:()=>playerMeetsStageRequirement('f008') || !!state.stages?.f008?.unlocked || avStageAtOrBeyond('f008')},
    {key:'f008Clear', chapter:'Chapter 8', title:'Flooded Data Vault Stabilized', desc:'Drowned Archive Core recovered and the route chain advances.', unlock:()=>!!state.stages?.f008?.complete || avStageAtOrBeyond('f008')},
    {key:'f009Intro', chapter:'Chapter 9', title:'Rust Orchard', desc:'Vyra enters Rust Orchard.', unlock:()=>playerMeetsStageRequirement('f009') || !!state.stages?.f009?.unlocked || avStageAtOrBeyond('f009')},
    {key:'f009Clear', chapter:'Chapter 9', title:'Rust Orchard Stabilized', desc:'Harvest Alloy Core recovered and the route chain advances.', unlock:()=>!!state.stages?.f009?.complete || avStageAtOrBeyond('f009')},
    {key:'f010Intro', chapter:'Chapter 10', title:'Blacksite Observatory', desc:'Vyra enters Blacksite Observatory.', unlock:()=>playerMeetsStageRequirement('f010') || !!state.stages?.f010?.unlocked || avStageAtOrBeyond('f010')},
    {key:'f010Clear', chapter:'Chapter 10', title:'Blacksite Observatory Stabilized', desc:'Parallax Lens Core recovered and the route chain advances.', unlock:()=>!!state.stages?.f010?.complete || avStageAtOrBeyond('f010')},
    {key:'f011Intro', chapter:'Chapter 11', title:'Cryo Basilica', desc:'Vyra enters Cryo Basilica.', unlock:()=>playerMeetsStageRequirement('f011') || !!state.stages?.f011?.unlocked || avStageAtOrBeyond('f011')},
    {key:'f011Clear', chapter:'Chapter 11', title:'Cryo Basilica Stabilized', desc:'Basilica Wyrm Core recovered and the route chain advances.', unlock:()=>!!state.stages?.f011?.complete || avStageAtOrBeyond('f011')},
    {key:'f012Intro', chapter:'Chapter 12', title:'Ash Crown Citadel', desc:'Vyra enters Ash Crown Citadel.', unlock:()=>playerMeetsStageRequirement('f012') || !!state.stages?.f012?.unlocked || avStageAtOrBeyond('f012')},
    {key:'f012Clear', chapter:'Chapter 12', title:'Ash Crown Citadel Stabilized', desc:'Ash Crown Core recovered and the route chain advances.', unlock:()=>!!state.stages?.f012?.complete || avStageAtOrBeyond('f012')},
  );

  PROTOCOL_CHALLENGE_DEFS.push(
    {id:'twelve_stage_route', metric:'fractures', title:'Twelve-Stage Route', desc:'Complete 12 fracture extractions in the expanded route chain.', target:12, reward:{credits:1200, xp:1100, items:{'Vector Cell':8,'Rust Core':6,'Corrupted Catalyst':6,'Operator Shard: Vyra':12}}},
    {id:'road_to_twenty', metric:'bosses', title:'Road to 20 Stages', desc:'Defeat 10 boss-class guardians while scaling toward the planned 20-stage / Lv 99 endgame.', target:10, reward:{credits:1500, xp:1300, items:{'Vector Cell':10,'Rust Core':8,'Corrupted Catalyst':8}}}
  );



  // v118: Expanded Layout Overhaul. All playable stages are rebuilt into bigger, clearer routes.
  // The PNG assets are untouched: this swaps the map data, encounter tables, and decorative prop placement only.
  const V118_STAGE_LEVEL_REQS = {
    "f001": 1,
    "f002": 5,
    "f003": 10,
    "f004": 15,
    "f005": 20,
    "f006": 25,
    "f007": 30,
    "f008": 35,
    "f009": 40,
    "f010": 45,
    "f011": 50,
    "f012": 55
};
  const V118_STAGE_MAPS = {
    "f001": [
        "########################################################################",
        "########################################################################",
        "##..............###########################.......................######",
        "##..............###.................#######.......................######",
        "##..P.....S.....###.................#######.......................######",
        "##..................................#######...............C.......######",
        "##..........................E.....................................######",
        "##...................................................E............######",
        "##..............###...C...........................................######",
        "##..............###.................#######.......................######",
        "###################.................#######.......................######",
        "###################.................#######.......................######",
        "##########################...###########################################",
        "##########################...###########################################",
        "##########################...###########################################",
        "##########################...###########################################",
        "##########################...###########################################",
        "#####........................##..................#######################",
        "#####.............C..........##..................#######################",
        "#####........................##..................#######################",
        "#####........................##.........E........#######################",
        "#####........................##..................#######################",
        "#####........E.................................................#########",
        "#####...........................................................########",
        "#####.................................H.........................########",
        "#####.....................#####..............E...############...########",
        "#####.....................#####..................############...########",
        "#####.....................#####..................######..............###",
        "##############...##############...C..............######..............###",
        "##############...######################################.........E....###",
        "##############...######################################..............###",
        "##############...#####################################D......B.....X.###",
        "#####...................##############################D..............###",
        "#####...................##############################D..............###",
        "#####......L............###############################....E......C..###",
        "#####......E............###############################..............###",
        "#####...C...............###############################..............###",
        "#####...................################################################",
        "#####...................################################################",
        "########################################################################",
        "########################################################################",
        "########################################################################"
    ],
    "f002": [
        "########################################################################",
        "########################################################################",
        "########################################################################",
        "########################################################################",
        "######################################################..............####",
        "#####......................###########################..............####",
        "#####......................###########################..............####",
        "#####......................###########################.....E........####",
        "#####.........E............##########################D.......B..E.X.####",
        "#####.............................###################D..............####",
        "#####..............................##################D..............####",
        "#####..............................###################..............####",
        "#####......C...............#####...####################...##############",
        "#####......................#####...####################...##############",
        "#####......................#####...####################...##############",
        "################################...##########......................#####",
        "################################...##########......................#####",
        "################################...##########......C...............#####",
        "########################..................###......................#####",
        "########################.......C..........###........E.............#####",
        "########################..................###......................#####",
        "########################.....H......E..............................#####",
        "########################...........................................#####",
        "########################........................E..................#####",
        "########################..................###......................#####",
        "########################..................###......................#####",
        "############################...#########################################",
        "############################...#########################################",
        "############################...#########################################",
        "####################..................#######....................#######",
        "##..............####..................#######....................#######",
        "##..............####......C...........#######...............E....#######",
        "##..............####..............................L..............#######",
        "##.......S.....................E.................................#######",
        "##..P..................C...................D..............C......#######",
        "##....................................#######....................#######",
        "##..............####..................#######....................#######",
        "##..............####..................##################################",
        "########################################################################",
        "########################################################################",
        "########################################################################",
        "########################################################################"
    ],
    "f003": [
        "########################################################################",
        "########################################################################",
        "########################################################################",
        "###.............####..............##########......................######",
        "###.............####..............##########......................######",
        "###.............####..............##########...C.......E..........######",
        "###..P....S................E......................................######",
        "###...............................................................######",
        "###...............................................................######",
        "###.............####..............######################################",
        "###.............####..............######################################",
        "##########################...######################.................####",
        "##########################...######################.................####",
        "##########################...######################.................####",
        "##########################...######################.................####",
        "##########################....................#####.......E.........####",
        "##########################....................#####.................####",
        "##########################....................#####.................####",
        "####..................####...........E........#####.............C...####",
        "####................................................................####",
        "####...........................................D....................####",
        "####................................................................####",
        "####........E.........######...............C..#####.................####",
        "####..................######..................############...###########",
        "####.............C....######..................############...###########",
        "####..................##############...###################...###########",
        "####.......L..........##############...###################...###########",
        "####..................##############...###################...###########",
        "####..................##############...###################...###########",
        "####..................##############...###############..............####",
        "####..................###....................#########..............####",
        "#########################.....C..............#########..............####",
        "#########################....................########D..........E...####",
        "#########################........H...........########D.......B....X.####",
        "#########################....................########D.....C........####",
        "#########################.........E..........#########....E.........####",
        "#########################....................#########..............####",
        "#########################....................#########..............####",
        "########################################################################",
        "########################################################################",
        "########################################################################",
        "########################################################################"
    ],
    "f004": [
        "########################################################################",
        "########################################################################",
        "########################################################################",
        "########################################################################",
        "##..............###..................#####........................######",
        "##..............###..................#####........................######",
        "##..............###..................#####....C...................######",
        "##..P.....S.................E.....................................######",
        "##..................................................E.............######",
        "##...............................C................................######",
        "##..............###..................#####........................######",
        "##..............###..................#####........................######",
        "###########################...############........................######",
        "###########################...##########################################",
        "###########################...##########################################",
        "###########################...##########################################",
        "###########################...##########################################",
        "###########################...##########################################",
        "################......................##################################",
        "################....C.................##################################",
        "################......................######.......................#####",
        "################...................................................#####",
        "################.......E.H.........................................#####",
        "################...................................................#####",
        "################......................######.......D....E..........#####",
        "################......................######.......................#####",
        "################......................######..................C....#####",
        "##########################...###############.......................#####",
        "##########################...###############.......................#####",
        "##########################...#########################...###############",
        "#######...........................####################...###############",
        "#######........................C..###################................###",
        "#######...........................###################................###",
        "#######...........E...............###################................###",
        "#######.......L..............E....##################D.....E..........###",
        "#######...........................##################D........B..E..X.###",
        "#######...C.......................###################................###",
        "#######...........................###################................###",
        "#####################################################................###",
        "########################################################################",
        "########################################################################",
        "########################################################################"
    ],
    "f005": [
        "########################################################################",
        "########################################################################",
        "########################################################################",
        "###.............####................#######....................#########",
        "###.............####................#######....................#########",
        "###.............####...........C....#######.....C..............#########",
        "###..P....S....................................................#########",
        "###........................E.........................E.........#########",
        "###............................................................#########",
        "###.............####................#######....................#########",
        "###.............####................#######....................#########",
        "####################................#######....................#########",
        "###########################...##########################################",
        "###########################...##########################################",
        "###########################...##########################################",
        "###########################...##########################################",
        "########################......................##########################",
        "########################......................####.................#####",
        "#####................###..............E.......####.................#####",
        "#####................###......................####.................#####",
        "#####.............C...............H................................#####",
        "#####...........................................D.........E........#####",
        "#####........E.....................................................#####",
        "#####................###...................C..####.................#####",
        "#####................###......................####.................#####",
        "#####................###......................####.................#####",
        "#####................#############################.................#####",
        "#####................####################################...############",
        "############...##########################################...############",
        "############...##########################################...############",
        "############...##########################################...############",
        "#######.......................######################................####",
        "#######.......................######################................####",
        "#######.................C.....######################................####",
        "#######............................................D......E.....C...####",
        "#######.....L.......E..............................D........B.....X.####",
        "#######............................................D...........E....####",
        "#######.......................######################................####",
        "#######.......................######################................####",
        "########################################################################",
        "########################################################################",
        "########################################################################"
    ],
    "f006": [
        "########################################################################",
        "########################################################################",
        "########################################################################",
        "########################################################################",
        "####....................################################################",
        "####....................################################################",
        "####................C...################################################",
        "####......L....E........################################################",
        "####....................################################################",
        "####....................################################################",
        "####....................################################################",
        "#############...######....................##############################",
        "#############...######.......C............######..................######",
        "#############...######....................######..................######",
        "#############.....................................C...............######",
        "#############.....................E...............................######",
        "##############................................D.......E...........######",
        "######################....................######..................######",
        "######################....................######..............E...######",
        "#################################...############..................######",
        "#################################...############..................######",
        "#########################..................#####..................######",
        "#########################..................#############...#############",
        "#########################.............C....#############...#############",
        "#########################......H...........#############...#############",
        "#########################.........E........#############...#############",
        "#########################..................#############...#############",
        "#########################..................#############...#############",
        "#########################..................#########................####",
        "#############################...####################................####",
        "#############################...####################...........C....####",
        "######################................#############D.....E..........####",
        "##................####................#############D........B.....X.####",
        "##................####...C............#############D................####",
        "##....................................##############................####",
        "##..P......S.................E........##############............E...####",
        "##....................................##############................####",
        "##................####................##############................####",
        "##................####................##################################",
        "########################################################################",
        "########################################################################",
        "########################################################################"
    ],
    "f007": [
        "########################################################################",
        "########################################################################",
        "########################################################################",
        "########################################################################",
        "########################################################################",
        "####################..................#####......................#######",
        "####################..................#####......................#######",
        "####################..................#####....C.................#######",
        "####################.......E.....................................#######",
        "####################................................E............#######",
        "####################..............C..............................#######",
        "####################..................#####......................#######",
        "####################..................#####......................#######",
        "####################..................#####......................#######",
        "###########################...##########################################",
        "###########################...##########################################",
        "###########################...##########################################",
        "###########################...##########################################",
        "##..............###...................##################################",
        "##..............###...................#######....................#######",
        "##..............###................C..#######....................#######",
        "##............................................................C..#######",
        "##..P.....S................E.....................................#######",
        "##.......................................D...........E...........#######",
        "##..............###...................#######....................#######",
        "##..............###...................#######....................#######",
        "###################...................#######....................#######",
        "###########################...###############....................#######",
        "###########################...########################...###############",
        "###########################...########################...###############",
        "###########################...########################...###############",
        "#######............................###################...............###",
        "#######............................###################...............###",
        "#######....C.......................###################...............###",
        "#######...........E.......H........##################D....E..........###",
        "#######......L.................E...##################D.......B...E.X.###",
        "#######............................###################..........C....###",
        "#######............................###################...............###",
        "#######............................###################...............###",
        "########################################################################",
        "########################################################################",
        "########################################################################"
    ],
    "f008": [
        "########################################################################",
        "########################################################################",
        "########################################################################",
        "###.............###...................######.....................#######",
        "###.............###...................######.....................#######",
        "###.............###...................######.....................#######",
        "###..P....S.................E....................................#######",
        "###.................................................E............#######",
        "###..............................C...............................#######",
        "###.............###...................######.....................#######",
        "###.............###...................######...C.................#######",
        "###########################...##############.....................#######",
        "###########################...##########################################",
        "###########################...##########################################",
        "###########################...##########################################",
        "###########################...##########################################",
        "#######........................#########################################",
        "#######........................#####.....................###############",
        "#######........................#####.....................###############",
        "#######............H...........#####..............C......###############",
        "#######.......E..........................................###############",
        "#######...........................D..........E...........###############",
        "#######..................................................###############",
        "#######................C.......#####.....................###############",
        "#######........................#####.....................###############",
        "#######........................#####....................E###############",
        "##################...###############.....................###############",
        "##################...########################...########################",
        "##################...########################...########################",
        "##################...########################...########################",
        "##################...########################...#####................###",
        "############......................###########...#####................###",
        "############......................###########...#####................###",
        "############...C..................###########.......D.....E..........###",
        "############........................................D........B..E..X.###",
        "############......L...........E.....................D................###",
        "############.....................................................C...###",
        "############......................###################................###",
        "############......................###################................###",
        "########################################################################",
        "########################################################################",
        "########################################################################"
    ],
    "f009": [
        "########################################################################",
        "########################################################################",
        "########################################################################",
        "########################################################################",
        "############......................##################................####",
        "############......................##################................####",
        "############...................E..##################...........C....####",
        "############.......L..............##########..............E.........####",
        "############.............E........#########........D........B.....X.####",
        "############......................#########........D............E...####",
        "############..................C...#########...#####D................####",
        "############......................#########...######................####",
        "############......................#########...######................####",
        "#################...#######################...##########################",
        "#################...#######################...##########################",
        "#################...#######################...##########################",
        "#################...##############....................##################",
        "########....................######....................##################",
        "########....................######..............C.....##################",
        "########....................######....................##################",
        "########........E......H...................E..........##################",
        "########..............................................##################",
        "########..............................................##################",
        "########....C..................###....................##################",
        "########.......................###....................##################",
        "############################...#########################################",
        "############################...#########################################",
        "############################...#########################################",
        "############################...#########################D###############",
        "####################..................######....................########",
        "####################..................######....................########",
        "##..............####..................######....................########",
        "##..............####............................................########",
        "##..............####.........E......................E...........########",
        "##..............................................................########",
        "##..P.....S.............C.............######....................########",
        "##....................................######.............C......########",
        "##..............####..................######....................########",
        "##..............########################################################",
        "########################################################################",
        "########################################################################",
        "########################################################################"
    ],
    "f010": [
        "########################################################################",
        "########################################################################",
        "########################################################################",
        "########################################################################",
        "####................########..................##########################",
        "####................########..................##########################",
        "####...C............########..............C...##########################",
        "####.........E......########.....L............##########################",
        "####.X.....B........#D######........E.........##########################",
        "####................#D######..................##########################",
        "####....E...........#D######..................##########################",
        "####................########..................##########################",
        "####................########..................##########################",
        "#############...###################...##################################",
        "#############...###################...##################################",
        "#############...###################...##################################",
        "#####..................####...................####.................#####",
        "#####..................####...................####.................#####",
        "#####..............C...####...................####.................#####",
        "#####..................####...................####.................#####",
        "#####.........E....................H..E...................E........#####",
        "#####...........................................D..................#####",
        "#####......................................C.......................#####",
        "#####..................####...................####.................#####",
        "#####..................####...................####.................#####",
        "#####..................####...................####.................#####",
        "###################################...##################################",
        "###################################...##################################",
        "###################################...##################################",
        "###################################...##################################",
        "#######.................###########...############.................#####",
        "#######.................###########...############.................#####",
        "#######.................####................######.................#####",
        "#######.................####................######.................#####",
        "#######........E....C.....................................E........#####",
        "#######............................P....S..........................#####",
        "#######.......................................................C....#####",
        "#######.................####................######.................#####",
        "############################................############################",
        "########################################################################",
        "########################################################################",
        "########################################################################"
    ],
    "f011": [
        "########################################################################",
        "########################################################################",
        "########################################################################",
        "########################################################################",
        "############################................############################",
        "############################...C............############################",
        "############################................############################",
        "#######...........................E..............................#######",
        "#######.............................B....X.......................#######",
        "#######.................C..................................C.....#######",
        "#######................................E.........................#######",
        "#######.......L...E..................................E...........#######",
        "#######..........................................................#######",
        "#######..........................................................#######",
        "#######......................######DDD#####...E..................#######",
        "#######......................######...#####......................#######",
        "#######......................######...#####......................#######",
        "###################################...##################################",
        "#########################......................#########################",
        "#########################......................#########################",
        "#########################......................#########################",
        "#########################.........E............#########################",
        "########........................................................########",
        "########............................H...........................########",
        "########....................C...................................########",
        "########.........E........................D............E........########",
        "########........................................................########",
        "########........................................................########",
        "########...................########...#######................C..########",
        "########....C..............########...#######...................########",
        "########...................########...#######...................########",
        "###################################...##################################",
        "###################################...##################################",
        "############################................############################",
        "############################................############################",
        "############################................############################",
        "############################.......P....S...############################",
        "############################................############################",
        "############################................############################",
        "########################################################################",
        "########################################################################",
        "########################################################################"
    ],
    "f012": [
        "########################################################################",
        "########################################################################",
        "########################################################################",
        "########################################################################",
        "########################################################################",
        "########################################################################",
        "########...............###########################..................####",
        "########...............###########################..................####",
        "########...............###########################............C.....####",
        "########........E......###########################..................####",
        "########.....L.........##...................######.......E..........####",
        "########...............##...................####D#..................####",
        "########............C..##...C...............######..................####",
        "########............................................................####",
        "########................D........E..................................####",
        "###############.....................................................####",
        "#########################...................############################",
        "#########################...................############################",
        "#################################...####################################",
        "#################################...####################################",
        "#####....................########...#########......................#####",
        "#####.......................................#......................#####",
        "#####.......................................#......................#####",
        "#####.......................................#......................#####",
        "#####.........E..................H...................E.............#####",
        "#####..............................................................#####",
        "#####..............C.............E.............................C...#####",
        "#####...................................C...#......................#####",
        "#####.......................................#......................#####",
        "#########...#############...................###########...##############",
        "#########...###########################################...##############",
        "#########...########################################................####",
        "#########...########################################................####",
        "###..............###################################................####",
        "###..............##################################D......E.........####",
        "###..............##################################D........B...E..X####",
        "###..P....S......###################################................####",
        "###..............###################################................####",
        "###..............###################################................####",
        "########################################################################",
        "########################################################################",
        "########################################################################"
    ]
};
  const V118_ENCOUNTER_SLOTS = {
    "f001": {
        "28,6": {
            "type": "anomaly",
            "index": 7
        },
        "53,7": {
            "type": "anomaly",
            "index": 12
        },
        "40,20": {
            "type": "anomaly",
            "index": 17
        },
        "13,22": {
            "type": "anomaly",
            "index": 22
        },
        "45,25": {
            "type": "anomaly",
            "index": 27
        },
        "64,29": {
            "type": "anomaly",
            "index": 32
        },
        "59,34": {
            "type": "anomaly",
            "index": 37
        },
        "11,35": {
            "type": "anomaly",
            "index": 42
        },
        "61,31": {
            "type": "boss",
            "index": 7
        }
    },
    "f002": {
        "59,7": {
            "type": "anomaly",
            "index": 14
        },
        "14,8": {
            "type": "anomaly",
            "index": 19
        },
        "64,8": {
            "type": "anomaly",
            "index": 24
        },
        "53,19": {
            "type": "anomaly",
            "index": 29
        },
        "36,21": {
            "type": "anomaly",
            "index": 34
        },
        "48,23": {
            "type": "anomaly",
            "index": 39
        },
        "60,31": {
            "type": "anomaly",
            "index": 44
        },
        "31,33": {
            "type": "anomaly",
            "index": 49
        },
        "61,8": {
            "type": "boss",
            "index": 10
        }
    },
    "f003": {
        "55,5": {
            "type": "anomaly",
            "index": 21
        },
        "27,6": {
            "type": "anomaly",
            "index": 26
        },
        "58,15": {
            "type": "anomaly",
            "index": 31
        },
        "37,18": {
            "type": "anomaly",
            "index": 36
        },
        "12,22": {
            "type": "anomaly",
            "index": 41
        },
        "64,32": {
            "type": "anomaly",
            "index": 46
        },
        "34,35": {
            "type": "anomaly",
            "index": 51
        },
        "58,35": {
            "type": "anomaly",
            "index": 56
        },
        "61,33": {
            "type": "boss",
            "index": 13
        }
    },
    "f004": {
        "28,7": {
            "type": "anomaly",
            "index": 28
        },
        "52,8": {
            "type": "anomaly",
            "index": 33
        },
        "23,22": {
            "type": "anomaly",
            "index": 38
        },
        "56,24": {
            "type": "anomaly",
            "index": 43
        },
        "18,33": {
            "type": "anomaly",
            "index": 48
        },
        "29,34": {
            "type": "anomaly",
            "index": 53
        },
        "58,34": {
            "type": "anomaly",
            "index": 58
        },
        "64,35": {
            "type": "anomaly",
            "index": 3
        },
        "61,35": {
            "type": "boss",
            "index": 16
        }
    },
    "f005": {
        "27,7": {
            "type": "anomaly",
            "index": 35
        },
        "53,7": {
            "type": "anomaly",
            "index": 40
        },
        "38,18": {
            "type": "anomaly",
            "index": 45
        },
        "58,21": {
            "type": "anomaly",
            "index": 50
        },
        "13,22": {
            "type": "anomaly",
            "index": 55
        },
        "58,34": {
            "type": "anomaly",
            "index": 0
        },
        "20,35": {
            "type": "anomaly",
            "index": 5
        },
        "63,36": {
            "type": "anomaly",
            "index": 10
        },
        "60,35": {
            "type": "boss",
            "index": 19
        }
    },
    "f006": {
        "15,7": {
            "type": "anomaly",
            "index": 42
        },
        "34,15": {
            "type": "anomaly",
            "index": 47
        },
        "54,16": {
            "type": "anomaly",
            "index": 52
        },
        "62,18": {
            "type": "anomaly",
            "index": 57
        },
        "34,25": {
            "type": "anomaly",
            "index": 2
        },
        "57,31": {
            "type": "anomaly",
            "index": 7
        },
        "29,35": {
            "type": "anomaly",
            "index": 12
        },
        "64,35": {
            "type": "anomaly",
            "index": 17
        },
        "60,32": {
            "type": "boss",
            "index": 22
        }
    },
    "f007": {
        "27,8": {
            "type": "anomaly",
            "index": 49
        },
        "52,9": {
            "type": "anomaly",
            "index": 54
        },
        "27,22": {
            "type": "anomaly",
            "index": 59
        },
        "53,23": {
            "type": "anomaly",
            "index": 4
        },
        "18,34": {
            "type": "anomaly",
            "index": 9
        },
        "58,34": {
            "type": "anomaly",
            "index": 14
        },
        "31,35": {
            "type": "anomaly",
            "index": 19
        },
        "65,35": {
            "type": "anomaly",
            "index": 24
        },
        "61,35": {
            "type": "boss",
            "index": 25
        }
    },
    "f008": {
        "28,6": {
            "type": "anomaly",
            "index": 56
        },
        "52,7": {
            "type": "anomaly",
            "index": 1
        },
        "14,20": {
            "type": "anomaly",
            "index": 6
        },
        "45,21": {
            "type": "anomaly",
            "index": 11
        },
        "56,25": {
            "type": "anomaly",
            "index": 16
        },
        "58,33": {
            "type": "anomaly",
            "index": 21
        },
        "64,34": {
            "type": "anomaly",
            "index": 26
        },
        "30,35": {
            "type": "anomaly",
            "index": 31
        },
        "61,34": {
            "type": "boss",
            "index": 28
        }
    },
    "f009": {
        "31,6": {
            "type": "anomaly",
            "index": 3
        },
        "58,7": {
            "type": "anomaly",
            "index": 8
        },
        "25,8": {
            "type": "anomaly",
            "index": 13
        },
        "64,9": {
            "type": "anomaly",
            "index": 18
        },
        "16,20": {
            "type": "anomaly",
            "index": 23
        },
        "43,20": {
            "type": "anomaly",
            "index": 28
        },
        "29,33": {
            "type": "anomaly",
            "index": 33
        },
        "52,33": {
            "type": "anomaly",
            "index": 38
        },
        "60,8": {
            "type": "boss",
            "index": 31
        }
    },
    "f010": {
        "13,7": {
            "type": "anomaly",
            "index": 10
        },
        "36,8": {
            "type": "anomaly",
            "index": 15
        },
        "8,10": {
            "type": "anomaly",
            "index": 20
        },
        "14,20": {
            "type": "anomaly",
            "index": 25
        },
        "38,20": {
            "type": "anomaly",
            "index": 30
        },
        "58,20": {
            "type": "anomaly",
            "index": 35
        },
        "15,34": {
            "type": "anomaly",
            "index": 40
        },
        "58,34": {
            "type": "anomaly",
            "index": 45
        },
        "11,8": {
            "type": "boss",
            "index": 34
        }
    },
    "f011": {
        "34,7": {
            "type": "anomaly",
            "index": 17
        },
        "39,10": {
            "type": "anomaly",
            "index": 22
        },
        "18,11": {
            "type": "anomaly",
            "index": 27
        },
        "53,11": {
            "type": "anomaly",
            "index": 32
        },
        "46,14": {
            "type": "anomaly",
            "index": 37
        },
        "34,21": {
            "type": "anomaly",
            "index": 42
        },
        "17,25": {
            "type": "anomaly",
            "index": 47
        },
        "55,25": {
            "type": "anomaly",
            "index": 52
        },
        "36,8": {
            "type": "boss",
            "index": 2
        }
    },
    "f012": {
        "16,9": {
            "type": "anomaly",
            "index": 24
        },
        "57,10": {
            "type": "anomaly",
            "index": 29
        },
        "33,14": {
            "type": "anomaly",
            "index": 34
        },
        "14,24": {
            "type": "anomaly",
            "index": 39
        },
        "53,24": {
            "type": "anomaly",
            "index": 44
        },
        "33,26": {
            "type": "anomaly",
            "index": 49
        },
        "58,34": {
            "type": "anomaly",
            "index": 54
        },
        "64,35": {
            "type": "anomaly",
            "index": 59
        },
        "60,35": {
            "type": "boss",
            "index": 5
        }
    }
};
  const V118_STAGE_ENCOUNTERS = {
    "f001": {
        "28,6": {
            "id": "AN-011",
            "display": "Grave Gnawer",
            "hp": 63,
            "atk": 7,
            "xp": 35,
            "credits": 18,
            "loot": [
                "Scrap Metal",
                "Med Patch"
            ],
            "note": "Expanded route anomaly for Forbidden Graveyard. This hostile is optional after the first three clears, but deleting it gives extra training and loot."
        },
        "53,7": {
            "id": "AN-012",
            "display": "Lantern Ghoul",
            "hp": 74,
            "atk": 9,
            "xp": 44,
            "credits": 23,
            "loot": [
                "Scrap Metal",
                "Corrupted Catalyst"
            ],
            "note": "Expanded route anomaly for Forbidden Graveyard. This hostile is optional after the first three clears, but deleting it gives extra training and loot."
        },
        "40,20": {
            "id": "AN-013",
            "display": "Coffin Ripper",
            "hp": 85,
            "atk": 11,
            "xp": 53,
            "credits": 28,
            "loot": [
                "Scrap Metal",
                "Corrupted Catalyst"
            ],
            "note": "Expanded route anomaly for Forbidden Graveyard. This hostile is optional after the first three clears, but deleting it gives extra training and loot."
        },
        "13,22": {
            "id": "AN-014",
            "display": "Mossbone Crawler",
            "hp": 96,
            "atk": 13,
            "xp": 62,
            "credits": 33,
            "loot": [
                "Scrap Metal",
                "Med Patch"
            ],
            "note": "Expanded route anomaly for Forbidden Graveyard. This hostile is optional after the first three clears, but deleting it gives extra training and loot."
        },
        "45,25": {
            "id": "AN-015",
            "display": "Crypt Mite",
            "hp": 107,
            "atk": 7,
            "xp": 71,
            "credits": 38,
            "loot": [
                "Scrap Metal",
                "Corrupted Catalyst"
            ],
            "note": "Expanded route anomaly for Forbidden Graveyard. This hostile is optional after the first three clears, but deleting it gives extra training and loot."
        },
        "64,29": {
            "id": "AN-016",
            "display": "Hollow Sexton",
            "hp": 118,
            "atk": 9,
            "xp": 80,
            "credits": 43,
            "loot": [
                "Scrap Metal",
                "Corrupted Catalyst"
            ],
            "note": "Expanded route anomaly for Forbidden Graveyard. This hostile is optional after the first three clears, but deleting it gives extra training and loot."
        },
        "59,34": {
            "id": "AN-017",
            "display": "Skullroot Imp",
            "hp": 129,
            "atk": 11,
            "xp": 89,
            "credits": 48,
            "loot": [
                "Scrap Metal",
                "Med Patch"
            ],
            "note": "Expanded route anomaly for Forbidden Graveyard. This hostile is optional after the first three clears, but deleting it gives extra training and loot."
        },
        "11,35": {
            "id": "AN-018",
            "display": "Rot Choir Wretch",
            "hp": 140,
            "atk": 13,
            "xp": 98,
            "credits": 53,
            "loot": [
                "Scrap Metal",
                "Corrupted Catalyst"
            ],
            "note": "Expanded route anomaly for Forbidden Graveyard. This hostile is optional after the first three clears, but deleting it gives extra training and loot."
        },
        "61,31": {
            "id": "BOSS-001",
            "display": "Graveyard Bell Keeper",
            "hp": 188,
            "atk": 14,
            "xp": 178,
            "credits": 98,
            "loot": [
                "Grave Bell Core",
                "Rust Core",
                "Corrupted Catalyst",
                "Vector Cell"
            ],
            "bossReward": "Grave Bell Core",
            "note": "Expanded-layout boss guarding the locked wing of Forbidden Graveyard. Clear three anomalies, open the security doors, then recover the core."
        }
    },
    "f002": {
        "59,7": {
            "id": "AN-021",
            "display": "Ashline Raider",
            "hp": 75,
            "atk": 8,
            "xp": 55,
            "credits": 26,
            "loot": [
                "Scrap Metal",
                "Med Patch"
            ],
            "note": "Expanded route anomaly for Ash Wastes Outpost. This hostile is optional after the first three clears, but deleting it gives extra training and loot."
        },
        "14,8": {
            "id": "AN-022",
            "display": "Sootjaw Hyena",
            "hp": 86,
            "atk": 10,
            "xp": 64,
            "credits": 31,
            "loot": [
                "Scrap Metal",
                "Corrupted Catalyst"
            ],
            "note": "Expanded route anomaly for Ash Wastes Outpost. This hostile is optional after the first three clears, but deleting it gives extra training and loot."
        },
        "64,8": {
            "id": "AN-023",
            "display": "Outpost Husk",
            "hp": 97,
            "atk": 12,
            "xp": 73,
            "credits": 36,
            "loot": [
                "Scrap Metal",
                "Corrupted Catalyst"
            ],
            "note": "Expanded route anomaly for Ash Wastes Outpost. This hostile is optional after the first three clears, but deleting it gives extra training and loot."
        },
        "53,19": {
            "id": "AN-024",
            "display": "Burnt Coil Serpent",
            "hp": 108,
            "atk": 14,
            "xp": 82,
            "credits": 41,
            "loot": [
                "Scrap Metal",
                "Med Patch"
            ],
            "note": "Expanded route anomaly for Ash Wastes Outpost. This hostile is optional after the first three clears, but deleting it gives extra training and loot."
        },
        "36,21": {
            "id": "AN-025",
            "display": "Cinderclaw",
            "hp": 119,
            "atk": 8,
            "xp": 91,
            "credits": 46,
            "loot": [
                "Scrap Metal",
                "Corrupted Catalyst"
            ],
            "note": "Expanded route anomaly for Ash Wastes Outpost. This hostile is optional after the first three clears, but deleting it gives extra training and loot."
        },
        "48,23": {
            "id": "AN-026",
            "display": "Signal Leech",
            "hp": 130,
            "atk": 10,
            "xp": 100,
            "credits": 51,
            "loot": [
                "Scrap Metal",
                "Corrupted Catalyst"
            ],
            "note": "Expanded route anomaly for Ash Wastes Outpost. This hostile is optional after the first three clears, but deleting it gives extra training and loot."
        },
        "60,31": {
            "id": "AN-027",
            "display": "Scrap Maw",
            "hp": 141,
            "atk": 12,
            "xp": 109,
            "credits": 56,
            "loot": [
                "Scrap Metal",
                "Med Patch"
            ],
            "note": "Expanded route anomaly for Ash Wastes Outpost. This hostile is optional after the first three clears, but deleting it gives extra training and loot."
        },
        "31,33": {
            "id": "AN-028",
            "display": "Wasteland Brooder",
            "hp": 152,
            "atk": 14,
            "xp": 118,
            "credits": 61,
            "loot": [
                "Scrap Metal",
                "Corrupted Catalyst"
            ],
            "note": "Expanded route anomaly for Ash Wastes Outpost. This hostile is optional after the first three clears, but deleting it gives extra training and loot."
        },
        "61,8": {
            "id": "BOSS-002",
            "display": "Ashveil Spider Mother",
            "hp": 220,
            "atk": 16,
            "xp": 250,
            "credits": 130,
            "loot": [
                "Ashveil Mother Core",
                "Rust Core",
                "Corrupted Catalyst",
                "Vector Cell"
            ],
            "bossReward": "Ashveil Mother Core",
            "note": "Expanded-layout boss guarding the locked wing of Ash Wastes Outpost. Clear three anomalies, open the security doors, then recover the core."
        }
    },
    "f003": {
        "55,5": {
            "id": "AN-031",
            "display": "Neon Mourner",
            "hp": 90,
            "atk": 10,
            "xp": 80,
            "credits": 36,
            "loot": [
                "Scrap Metal",
                "Med Patch"
            ],
            "note": "Expanded route anomaly for Neon Graveyard. This hostile is optional after the first three clears, but deleting it gives extra training and loot."
        },
        "27,6": {
            "id": "AN-032",
            "display": "Static Ghoul",
            "hp": 101,
            "atk": 12,
            "xp": 89,
            "credits": 41,
            "loot": [
                "Scrap Metal",
                "Corrupted Catalyst"
            ],
            "note": "Expanded route anomaly for Neon Graveyard. This hostile is optional after the first three clears, but deleting it gives extra training and loot."
        },
        "58,15": {
            "id": "AN-033",
            "display": "Glitchbone Stalker",
            "hp": 112,
            "atk": 14,
            "xp": 98,
            "credits": 46,
            "loot": [
                "Scrap Metal",
                "Corrupted Catalyst"
            ],
            "note": "Expanded route anomaly for Neon Graveyard. This hostile is optional after the first three clears, but deleting it gives extra training and loot."
        },
        "37,18": {
            "id": "AN-034",
            "display": "Violet Cryptling",
            "hp": 123,
            "atk": 16,
            "xp": 107,
            "credits": 51,
            "loot": [
                "Scrap Metal",
                "Med Patch"
            ],
            "note": "Expanded route anomaly for Neon Graveyard. This hostile is optional after the first three clears, but deleting it gives extra training and loot."
        },
        "12,22": {
            "id": "AN-035",
            "display": "Dead Frequency Leech",
            "hp": 134,
            "atk": 10,
            "xp": 116,
            "credits": 56,
            "loot": [
                "Scrap Metal",
                "Corrupted Catalyst"
            ],
            "note": "Expanded route anomaly for Neon Graveyard. This hostile is optional after the first three clears, but deleting it gives extra training and loot."
        },
        "64,32": {
            "id": "AN-036",
            "display": "Prism Skull Wraith",
            "hp": 145,
            "atk": 12,
            "xp": 125,
            "credits": 61,
            "loot": [
                "Scrap Metal",
                "Corrupted Catalyst"
            ],
            "note": "Expanded route anomaly for Neon Graveyard. This hostile is optional after the first three clears, but deleting it gives extra training and loot."
        },
        "34,35": {
            "id": "AN-037",
            "display": "Cyan Hollow",
            "hp": 156,
            "atk": 14,
            "xp": 134,
            "credits": 66,
            "loot": [
                "Scrap Metal",
                "Med Patch"
            ],
            "note": "Expanded route anomaly for Neon Graveyard. This hostile is optional after the first three clears, but deleting it gives extra training and loot."
        },
        "58,35": {
            "id": "AN-038",
            "display": "Gravewave Shambler",
            "hp": 167,
            "atk": 16,
            "xp": 143,
            "credits": 71,
            "loot": [
                "Scrap Metal",
                "Corrupted Catalyst"
            ],
            "note": "Expanded route anomaly for Neon Graveyard. This hostile is optional after the first three clears, but deleting it gives extra training and loot."
        },
        "61,33": {
            "id": "BOSS-003",
            "display": "Duskwither Shade Wraith",
            "hp": 260,
            "atk": 18,
            "xp": 340,
            "credits": 170,
            "loot": [
                "Duskwither Wraith Core",
                "Rust Core",
                "Corrupted Catalyst",
                "Vector Cell"
            ],
            "bossReward": "Duskwither Wraith Core",
            "note": "Expanded-layout boss guarding the locked wing of Neon Graveyard. Clear three anomalies, open the security doors, then recover the core."
        }
    },
    "f004": {
        "28,7": {
            "id": "AN-041",
            "display": "Rail Static Revenant",
            "hp": 105,
            "atk": 12,
            "xp": 105,
            "credits": 46,
            "loot": [
                "Scrap Metal",
                "Med Patch"
            ],
            "note": "Expanded route anomaly for Transit Ruins. This hostile is optional after the first three clears, but deleting it gives extra training and loot."
        },
        "52,8": {
            "id": "AN-042",
            "display": "Tunnel Wretch",
            "hp": 116,
            "atk": 14,
            "xp": 114,
            "credits": 51,
            "loot": [
                "Scrap Metal",
                "Corrupted Catalyst"
            ],
            "note": "Expanded route anomaly for Transit Ruins. This hostile is optional after the first three clears, but deleting it gives extra training and loot."
        },
        "23,22": {
            "id": "AN-043",
            "display": "Ashline Stalker",
            "hp": 127,
            "atk": 16,
            "xp": 123,
            "credits": 56,
            "loot": [
                "Scrap Metal",
                "Corrupted Catalyst"
            ],
            "note": "Expanded route anomaly for Transit Ruins. This hostile is optional after the first three clears, but deleting it gives extra training and loot."
        },
        "56,24": {
            "id": "AN-044",
            "display": "Cinder Railhound",
            "hp": 138,
            "atk": 18,
            "xp": 132,
            "credits": 61,
            "loot": [
                "Scrap Metal",
                "Med Patch"
            ],
            "note": "Expanded route anomaly for Transit Ruins. This hostile is optional after the first three clears, but deleting it gives extra training and loot."
        },
        "18,33": {
            "id": "AN-045",
            "display": "Platform Banshee",
            "hp": 149,
            "atk": 12,
            "xp": 141,
            "credits": 66,
            "loot": [
                "Scrap Metal",
                "Corrupted Catalyst"
            ],
            "note": "Expanded route anomaly for Transit Ruins. This hostile is optional after the first three clears, but deleting it gives extra training and loot."
        },
        "29,34": {
            "id": "AN-046",
            "display": "Transit Gnawer",
            "hp": 160,
            "atk": 14,
            "xp": 150,
            "credits": 71,
            "loot": [
                "Scrap Metal",
                "Corrupted Catalyst"
            ],
            "note": "Expanded route anomaly for Transit Ruins. This hostile is optional after the first three clears, but deleting it gives extra training and loot."
        },
        "58,34": {
            "id": "AN-047",
            "display": "Switchyard Horror",
            "hp": 171,
            "atk": 16,
            "xp": 159,
            "credits": 76,
            "loot": [
                "Scrap Metal",
                "Med Patch"
            ],
            "note": "Expanded route anomaly for Transit Ruins. This hostile is optional after the first three clears, but deleting it gives extra training and loot."
        },
        "64,35": {
            "id": "AN-048",
            "display": "Ticketless Dead",
            "hp": 182,
            "atk": 18,
            "xp": 168,
            "credits": 81,
            "loot": [
                "Scrap Metal",
                "Corrupted Catalyst"
            ],
            "note": "Expanded route anomaly for Transit Ruins. This hostile is optional after the first three clears, but deleting it gives extra training and loot."
        },
        "61,35": {
            "id": "BOSS-004",
            "display": "Transit Nexus Tyrant",
            "hp": 300,
            "atk": 20,
            "xp": 430,
            "credits": 210,
            "loot": [
                "Transit Nexus Core",
                "Rust Core",
                "Corrupted Catalyst",
                "Vector Cell"
            ],
            "bossReward": "Transit Nexus Core",
            "note": "Expanded-layout boss guarding the locked wing of Transit Ruins. Clear three anomalies, open the security doors, then recover the core."
        }
    },
    "f005": {
        "27,7": {
            "id": "AN-051",
            "display": "Prism Splinter",
            "hp": 120,
            "atk": 14,
            "xp": 130,
            "credits": 56,
            "loot": [
                "Scrap Metal",
                "Med Patch"
            ],
            "note": "Expanded route anomaly for Glass Storm Lab. This hostile is optional after the first three clears, but deleting it gives extra training and loot."
        },
        "53,7": {
            "id": "AN-052",
            "display": "Glasslung Horror",
            "hp": 131,
            "atk": 16,
            "xp": 139,
            "credits": 61,
            "loot": [
                "Scrap Metal",
                "Corrupted Catalyst"
            ],
            "note": "Expanded route anomaly for Glass Storm Lab. This hostile is optional after the first three clears, but deleting it gives extra training and loot."
        },
        "38,18": {
            "id": "AN-053",
            "display": "Lab Shardling",
            "hp": 142,
            "atk": 18,
            "xp": 148,
            "credits": 66,
            "loot": [
                "Scrap Metal",
                "Corrupted Catalyst"
            ],
            "note": "Expanded route anomaly for Glass Storm Lab. This hostile is optional after the first three clears, but deleting it gives extra training and loot."
        },
        "58,21": {
            "id": "AN-054",
            "display": "Storm Gel Serpent",
            "hp": 153,
            "atk": 20,
            "xp": 157,
            "credits": 71,
            "loot": [
                "Scrap Metal",
                "Med Patch"
            ],
            "note": "Expanded route anomaly for Glass Storm Lab. This hostile is optional after the first three clears, but deleting it gives extra training and loot."
        },
        "13,22": {
            "id": "AN-055",
            "display": "Mirror Husk",
            "hp": 164,
            "atk": 14,
            "xp": 166,
            "credits": 76,
            "loot": [
                "Scrap Metal",
                "Corrupted Catalyst"
            ],
            "note": "Expanded route anomaly for Glass Storm Lab. This hostile is optional after the first three clears, but deleting it gives extra training and loot."
        },
        "58,34": {
            "id": "AN-056",
            "display": "Violet Scalpel",
            "hp": 175,
            "atk": 16,
            "xp": 175,
            "credits": 81,
            "loot": [
                "Scrap Metal",
                "Corrupted Catalyst"
            ],
            "note": "Expanded route anomaly for Glass Storm Lab. This hostile is optional after the first three clears, but deleting it gives extra training and loot."
        },
        "20,35": {
            "id": "AN-057",
            "display": "Glass Choir",
            "hp": 186,
            "atk": 18,
            "xp": 184,
            "credits": 86,
            "loot": [
                "Scrap Metal",
                "Med Patch"
            ],
            "note": "Expanded route anomaly for Glass Storm Lab. This hostile is optional after the first three clears, but deleting it gives extra training and loot."
        },
        "63,36": {
            "id": "AN-058",
            "display": "Containment Wretch",
            "hp": 197,
            "atk": 20,
            "xp": 193,
            "credits": 91,
            "loot": [
                "Scrap Metal",
                "Corrupted Catalyst"
            ],
            "note": "Expanded route anomaly for Glass Storm Lab. This hostile is optional after the first three clears, but deleting it gives extra training and loot."
        },
        "60,35": {
            "id": "BOSS-005",
            "display": "Prism Wound Matriarch",
            "hp": 340,
            "atk": 23,
            "xp": 520,
            "credits": 250,
            "loot": [
                "Prism Wound Core",
                "Rust Core",
                "Corrupted Catalyst",
                "Vector Cell"
            ],
            "bossReward": "Prism Wound Core",
            "note": "Expanded-layout boss guarding the locked wing of Glass Storm Lab. Clear three anomalies, open the security doors, then recover the core."
        }
    },
    "f006": {
        "15,7": {
            "id": "AN-061",
            "display": "Core Parasite",
            "hp": 135,
            "atk": 15,
            "xp": 155,
            "credits": 66,
            "loot": [
                "Scrap Metal",
                "Med Patch"
            ],
            "note": "Expanded route anomaly for Vector Core Spire. This hostile is optional after the first three clears, but deleting it gives extra training and loot."
        },
        "34,15": {
            "id": "AN-062",
            "display": "Vector Spire Imp",
            "hp": 146,
            "atk": 17,
            "xp": 164,
            "credits": 71,
            "loot": [
                "Scrap Metal",
                "Corrupted Catalyst"
            ],
            "note": "Expanded route anomaly for Vector Core Spire. This hostile is optional after the first three clears, but deleting it gives extra training and loot."
        },
        "54,16": {
            "id": "AN-063",
            "display": "Nullwire Stalker",
            "hp": 157,
            "atk": 19,
            "xp": 173,
            "credits": 76,
            "loot": [
                "Scrap Metal",
                "Corrupted Catalyst"
            ],
            "note": "Expanded route anomaly for Vector Core Spire. This hostile is optional after the first three clears, but deleting it gives extra training and loot."
        },
        "62,18": {
            "id": "AN-064",
            "display": "Faultline Warden",
            "hp": 168,
            "atk": 21,
            "xp": 182,
            "credits": 81,
            "loot": [
                "Scrap Metal",
                "Med Patch"
            ],
            "note": "Expanded route anomaly for Vector Core Spire. This hostile is optional after the first three clears, but deleting it gives extra training and loot."
        },
        "34,25": {
            "id": "AN-065",
            "display": "Cyan Core Leech",
            "hp": 179,
            "atk": 15,
            "xp": 191,
            "credits": 86,
            "loot": [
                "Scrap Metal",
                "Corrupted Catalyst"
            ],
            "note": "Expanded route anomaly for Vector Core Spire. This hostile is optional after the first three clears, but deleting it gives extra training and loot."
        },
        "57,31": {
            "id": "AN-066",
            "display": "Reactor Husk",
            "hp": 190,
            "atk": 17,
            "xp": 200,
            "credits": 91,
            "loot": [
                "Scrap Metal",
                "Corrupted Catalyst"
            ],
            "note": "Expanded route anomaly for Vector Core Spire. This hostile is optional after the first three clears, but deleting it gives extra training and loot."
        },
        "29,35": {
            "id": "AN-067",
            "display": "Spire Maw",
            "hp": 201,
            "atk": 19,
            "xp": 209,
            "credits": 96,
            "loot": [
                "Scrap Metal",
                "Med Patch"
            ],
            "note": "Expanded route anomaly for Vector Core Spire. This hostile is optional after the first three clears, but deleting it gives extra training and loot."
        },
        "64,35": {
            "id": "AN-068",
            "display": "Heartwire Horror",
            "hp": 212,
            "atk": 21,
            "xp": 218,
            "credits": 101,
            "loot": [
                "Scrap Metal",
                "Corrupted Catalyst"
            ],
            "note": "Expanded route anomaly for Vector Core Spire. This hostile is optional after the first three clears, but deleting it gives extra training and loot."
        },
        "60,32": {
            "id": "BOSS-006",
            "display": "Vector Heart Seraph",
            "hp": 380,
            "atk": 25,
            "xp": 610,
            "credits": 290,
            "loot": [
                "Vector Heart Core",
                "Rust Core",
                "Corrupted Catalyst",
                "Vector Cell"
            ],
            "bossReward": "Vector Heart Core",
            "note": "Expanded-layout boss guarding the locked wing of Vector Core Spire. Clear three anomalies, open the security doors, then recover the core."
        }
    },
    "f007": {
        "27,8": {
            "id": "AN-071",
            "display": "Cinder Coupler",
            "hp": 150,
            "atk": 17,
            "xp": 180,
            "credits": 76,
            "loot": [
                "Scrap Metal",
                "Med Patch"
            ],
            "note": "Expanded route anomaly for Cinder Express Yard. This hostile is optional after the first three clears, but deleting it gives extra training and loot."
        },
        "52,9": {
            "id": "AN-072",
            "display": "Rail Yard Brute",
            "hp": 161,
            "atk": 19,
            "xp": 189,
            "credits": 81,
            "loot": [
                "Scrap Metal",
                "Corrupted Catalyst"
            ],
            "note": "Expanded route anomaly for Cinder Express Yard. This hostile is optional after the first three clears, but deleting it gives extra training and loot."
        },
        "27,22": {
            "id": "AN-073",
            "display": "Coal Signal Ghoul",
            "hp": 172,
            "atk": 21,
            "xp": 198,
            "credits": 86,
            "loot": [
                "Scrap Metal",
                "Corrupted Catalyst"
            ],
            "note": "Expanded route anomaly for Cinder Express Yard. This hostile is optional after the first three clears, but deleting it gives extra training and loot."
        },
        "53,23": {
            "id": "AN-074",
            "display": "Ember Cart Horror",
            "hp": 183,
            "atk": 23,
            "xp": 207,
            "credits": 91,
            "loot": [
                "Scrap Metal",
                "Med Patch"
            ],
            "note": "Expanded route anomaly for Cinder Express Yard. This hostile is optional after the first three clears, but deleting it gives extra training and loot."
        },
        "18,34": {
            "id": "AN-075",
            "display": "Switchblade Wretch",
            "hp": 194,
            "atk": 17,
            "xp": 216,
            "credits": 96,
            "loot": [
                "Scrap Metal",
                "Corrupted Catalyst"
            ],
            "note": "Expanded route anomaly for Cinder Express Yard. This hostile is optional after the first three clears, but deleting it gives extra training and loot."
        },
        "58,34": {
            "id": "AN-076",
            "display": "Cinderline Hound",
            "hp": 205,
            "atk": 19,
            "xp": 225,
            "credits": 101,
            "loot": [
                "Scrap Metal",
                "Corrupted Catalyst"
            ],
            "note": "Expanded route anomaly for Cinder Express Yard. This hostile is optional after the first three clears, but deleting it gives extra training and loot."
        },
        "31,35": {
            "id": "AN-077",
            "display": "Ash Brake Beast",
            "hp": 216,
            "atk": 21,
            "xp": 234,
            "credits": 106,
            "loot": [
                "Scrap Metal",
                "Med Patch"
            ],
            "note": "Expanded route anomaly for Cinder Express Yard. This hostile is optional after the first three clears, but deleting it gives extra training and loot."
        },
        "65,35": {
            "id": "AN-078",
            "display": "Boiler Rat King",
            "hp": 227,
            "atk": 23,
            "xp": 243,
            "credits": 111,
            "loot": [
                "Scrap Metal",
                "Corrupted Catalyst"
            ],
            "note": "Expanded route anomaly for Cinder Express Yard. This hostile is optional after the first three clears, but deleting it gives extra training and loot."
        },
        "61,35": {
            "id": "BOSS-007",
            "display": "Cinderline Conductor",
            "hp": 420,
            "atk": 27,
            "xp": 700,
            "credits": 330,
            "loot": [
                "Cinderline Core",
                "Rust Core",
                "Corrupted Catalyst",
                "Vector Cell"
            ],
            "bossReward": "Cinderline Core",
            "note": "Expanded-layout boss guarding the locked wing of Cinder Express Yard. Clear three anomalies, open the security doors, then recover the core."
        }
    },
    "f008": {
        "28,6": {
            "id": "AN-081",
            "display": "Drowned Data Leech",
            "hp": 165,
            "atk": 19,
            "xp": 205,
            "credits": 86,
            "loot": [
                "Scrap Metal",
                "Med Patch"
            ],
            "note": "Expanded route anomaly for Flooded Data Vault. This hostile is optional after the first three clears, but deleting it gives extra training and loot."
        },
        "52,7": {
            "id": "AN-082",
            "display": "Vault Sludge Wraith",
            "hp": 176,
            "atk": 21,
            "xp": 214,
            "credits": 91,
            "loot": [
                "Scrap Metal",
                "Corrupted Catalyst"
            ],
            "note": "Expanded route anomaly for Flooded Data Vault. This hostile is optional after the first three clears, but deleting it gives extra training and loot."
        },
        "14,20": {
            "id": "AN-083",
            "display": "Archive Barnacle",
            "hp": 187,
            "atk": 23,
            "xp": 223,
            "credits": 96,
            "loot": [
                "Scrap Metal",
                "Corrupted Catalyst"
            ],
            "note": "Expanded route anomaly for Flooded Data Vault. This hostile is optional after the first three clears, but deleting it gives extra training and loot."
        },
        "45,21": {
            "id": "AN-084",
            "display": "Floodcode Husk",
            "hp": 198,
            "atk": 25,
            "xp": 232,
            "credits": 101,
            "loot": [
                "Scrap Metal",
                "Med Patch"
            ],
            "note": "Expanded route anomaly for Flooded Data Vault. This hostile is optional after the first three clears, but deleting it gives extra training and loot."
        },
        "56,25": {
            "id": "AN-085",
            "display": "Wet Static Horror",
            "hp": 209,
            "atk": 19,
            "xp": 241,
            "credits": 106,
            "loot": [
                "Scrap Metal",
                "Corrupted Catalyst"
            ],
            "note": "Expanded route anomaly for Flooded Data Vault. This hostile is optional after the first three clears, but deleting it gives extra training and loot."
        },
        "58,33": {
            "id": "AN-086",
            "display": "Index Eel",
            "hp": 220,
            "atk": 21,
            "xp": 250,
            "credits": 111,
            "loot": [
                "Scrap Metal",
                "Corrupted Catalyst"
            ],
            "note": "Expanded route anomaly for Flooded Data Vault. This hostile is optional after the first three clears, but deleting it gives extra training and loot."
        },
        "64,34": {
            "id": "AN-087",
            "display": "Sump Librarian",
            "hp": 231,
            "atk": 23,
            "xp": 259,
            "credits": 116,
            "loot": [
                "Scrap Metal",
                "Med Patch"
            ],
            "note": "Expanded route anomaly for Flooded Data Vault. This hostile is optional after the first three clears, but deleting it gives extra training and loot."
        },
        "30,35": {
            "id": "AN-088",
            "display": "Drowned Firewall",
            "hp": 242,
            "atk": 25,
            "xp": 268,
            "credits": 121,
            "loot": [
                "Scrap Metal",
                "Corrupted Catalyst"
            ],
            "note": "Expanded route anomaly for Flooded Data Vault. This hostile is optional after the first three clears, but deleting it gives extra training and loot."
        },
        "61,34": {
            "id": "BOSS-008",
            "display": "Drowned Librarian",
            "hp": 460,
            "atk": 29,
            "xp": 790,
            "credits": 370,
            "loot": [
                "Drowned Archive Core",
                "Rust Core",
                "Corrupted Catalyst",
                "Vector Cell"
            ],
            "bossReward": "Drowned Archive Core",
            "note": "Expanded-layout boss guarding the locked wing of Flooded Data Vault. Clear three anomalies, open the security doors, then recover the core."
        }
    },
    "f009": {
        "31,6": {
            "id": "AN-091",
            "display": "Rust Orchard Imp",
            "hp": 180,
            "atk": 21,
            "xp": 230,
            "credits": 96,
            "loot": [
                "Scrap Metal",
                "Med Patch"
            ],
            "note": "Expanded route anomaly for Rust Orchard. This hostile is optional after the first three clears, but deleting it gives extra training and loot."
        },
        "58,7": {
            "id": "AN-092",
            "display": "Harvest Alloy Mite",
            "hp": 191,
            "atk": 23,
            "xp": 239,
            "credits": 101,
            "loot": [
                "Scrap Metal",
                "Corrupted Catalyst"
            ],
            "note": "Expanded route anomaly for Rust Orchard. This hostile is optional after the first three clears, but deleting it gives extra training and loot."
        },
        "25,8": {
            "id": "AN-093",
            "display": "Ironroot Stalker",
            "hp": 202,
            "atk": 25,
            "xp": 248,
            "credits": 106,
            "loot": [
                "Scrap Metal",
                "Corrupted Catalyst"
            ],
            "note": "Expanded route anomaly for Rust Orchard. This hostile is optional after the first three clears, but deleting it gives extra training and loot."
        },
        "64,9": {
            "id": "AN-094",
            "display": "Cropwire Ghoul",
            "hp": 213,
            "atk": 27,
            "xp": 257,
            "credits": 111,
            "loot": [
                "Scrap Metal",
                "Med Patch"
            ],
            "note": "Expanded route anomaly for Rust Orchard. This hostile is optional after the first three clears, but deleting it gives extra training and loot."
        },
        "16,20": {
            "id": "AN-095",
            "display": "Scarecrow Husk",
            "hp": 224,
            "atk": 21,
            "xp": 266,
            "credits": 116,
            "loot": [
                "Scrap Metal",
                "Corrupted Catalyst"
            ],
            "note": "Expanded route anomaly for Rust Orchard. This hostile is optional after the first three clears, but deleting it gives extra training and loot."
        },
        "43,20": {
            "id": "AN-096",
            "display": "Rustjaw Boar",
            "hp": 235,
            "atk": 23,
            "xp": 275,
            "credits": 121,
            "loot": [
                "Scrap Metal",
                "Corrupted Catalyst"
            ],
            "note": "Expanded route anomaly for Rust Orchard. This hostile is optional after the first three clears, but deleting it gives extra training and loot."
        },
        "29,33": {
            "id": "AN-097",
            "display": "Thorn Gearling",
            "hp": 246,
            "atk": 25,
            "xp": 284,
            "credits": 126,
            "loot": [
                "Scrap Metal",
                "Med Patch"
            ],
            "note": "Expanded route anomaly for Rust Orchard. This hostile is optional after the first three clears, but deleting it gives extra training and loot."
        },
        "52,33": {
            "id": "AN-098",
            "display": "Oxide Dryad",
            "hp": 257,
            "atk": 27,
            "xp": 293,
            "credits": 131,
            "loot": [
                "Scrap Metal",
                "Corrupted Catalyst"
            ],
            "note": "Expanded route anomaly for Rust Orchard. This hostile is optional after the first three clears, but deleting it gives extra training and loot."
        },
        "60,8": {
            "id": "BOSS-009",
            "display": "Harvest Alloy Tyrant",
            "hp": 500,
            "atk": 32,
            "xp": 880,
            "credits": 410,
            "loot": [
                "Harvest Alloy Core",
                "Rust Core",
                "Corrupted Catalyst",
                "Vector Cell"
            ],
            "bossReward": "Harvest Alloy Core",
            "note": "Expanded-layout boss guarding the locked wing of Rust Orchard. Clear three anomalies, open the security doors, then recover the core."
        }
    },
    "f010": {
        "13,7": {
            "id": "AN-101",
            "display": "Parallax Drone",
            "hp": 195,
            "atk": 22,
            "xp": 255,
            "credits": 106,
            "loot": [
                "Scrap Metal",
                "Med Patch"
            ],
            "note": "Expanded route anomaly for Blacksite Observatory. This hostile is optional after the first three clears, but deleting it gives extra training and loot."
        },
        "36,8": {
            "id": "AN-102",
            "display": "Lensburn Wretch",
            "hp": 206,
            "atk": 24,
            "xp": 264,
            "credits": 111,
            "loot": [
                "Scrap Metal",
                "Corrupted Catalyst"
            ],
            "note": "Expanded route anomaly for Blacksite Observatory. This hostile is optional after the first three clears, but deleting it gives extra training and loot."
        },
        "8,10": {
            "id": "AN-103",
            "display": "Starless Watcher",
            "hp": 217,
            "atk": 26,
            "xp": 273,
            "credits": 116,
            "loot": [
                "Scrap Metal",
                "Corrupted Catalyst"
            ],
            "note": "Expanded route anomaly for Blacksite Observatory. This hostile is optional after the first three clears, but deleting it gives extra training and loot."
        },
        "14,20": {
            "id": "AN-104",
            "display": "Blacksite Nullhound",
            "hp": 228,
            "atk": 28,
            "xp": 282,
            "credits": 121,
            "loot": [
                "Scrap Metal",
                "Med Patch"
            ],
            "note": "Expanded route anomaly for Blacksite Observatory. This hostile is optional after the first three clears, but deleting it gives extra training and loot."
        },
        "38,20": {
            "id": "AN-105",
            "display": "Aperture Leech",
            "hp": 239,
            "atk": 22,
            "xp": 291,
            "credits": 126,
            "loot": [
                "Scrap Metal",
                "Corrupted Catalyst"
            ],
            "note": "Expanded route anomaly for Blacksite Observatory. This hostile is optional after the first three clears, but deleting it gives extra training and loot."
        },
        "58,20": {
            "id": "AN-106",
            "display": "Orbit Ghoul",
            "hp": 250,
            "atk": 24,
            "xp": 300,
            "credits": 131,
            "loot": [
                "Scrap Metal",
                "Corrupted Catalyst"
            ],
            "note": "Expanded route anomaly for Blacksite Observatory. This hostile is optional after the first three clears, but deleting it gives extra training and loot."
        },
        "15,34": {
            "id": "AN-107",
            "display": "Mirror-Eye Husk",
            "hp": 261,
            "atk": 26,
            "xp": 309,
            "credits": 136,
            "loot": [
                "Scrap Metal",
                "Med Patch"
            ],
            "note": "Expanded route anomaly for Blacksite Observatory. This hostile is optional after the first three clears, but deleting it gives extra training and loot."
        },
        "58,34": {
            "id": "AN-108",
            "display": "Void Antenna",
            "hp": 272,
            "atk": 28,
            "xp": 318,
            "credits": 141,
            "loot": [
                "Scrap Metal",
                "Corrupted Catalyst"
            ],
            "note": "Expanded route anomaly for Blacksite Observatory. This hostile is optional after the first three clears, but deleting it gives extra training and loot."
        },
        "11,8": {
            "id": "BOSS-010",
            "display": "Parallax Watcher",
            "hp": 540,
            "atk": 34,
            "xp": 970,
            "credits": 450,
            "loot": [
                "Parallax Lens Core",
                "Rust Core",
                "Corrupted Catalyst",
                "Vector Cell"
            ],
            "bossReward": "Parallax Lens Core",
            "note": "Expanded-layout boss guarding the locked wing of Blacksite Observatory. Clear three anomalies, open the security doors, then recover the core."
        }
    },
    "f011": {
        "34,7": {
            "id": "AN-111",
            "display": "Cryo Acolyte",
            "hp": 210,
            "atk": 24,
            "xp": 280,
            "credits": 116,
            "loot": [
                "Scrap Metal",
                "Med Patch"
            ],
            "note": "Expanded route anomaly for Cryo Basilica. This hostile is optional after the first three clears, but deleting it gives extra training and loot."
        },
        "39,10": {
            "id": "AN-112",
            "display": "Frozen Choirling",
            "hp": 221,
            "atk": 26,
            "xp": 289,
            "credits": 121,
            "loot": [
                "Scrap Metal",
                "Corrupted Catalyst"
            ],
            "note": "Expanded route anomaly for Cryo Basilica. This hostile is optional after the first three clears, but deleting it gives extra training and loot."
        },
        "18,11": {
            "id": "AN-113",
            "display": "Basilica Whelp",
            "hp": 232,
            "atk": 28,
            "xp": 298,
            "credits": 126,
            "loot": [
                "Scrap Metal",
                "Corrupted Catalyst"
            ],
            "note": "Expanded route anomaly for Cryo Basilica. This hostile is optional after the first three clears, but deleting it gives extra training and loot."
        },
        "53,11": {
            "id": "AN-114",
            "display": "Frostwire Husk",
            "hp": 243,
            "atk": 30,
            "xp": 307,
            "credits": 131,
            "loot": [
                "Scrap Metal",
                "Med Patch"
            ],
            "note": "Expanded route anomaly for Cryo Basilica. This hostile is optional after the first three clears, but deleting it gives extra training and loot."
        },
        "46,14": {
            "id": "AN-115",
            "display": "Ice Reliquary",
            "hp": 254,
            "atk": 24,
            "xp": 316,
            "credits": 136,
            "loot": [
                "Scrap Metal",
                "Corrupted Catalyst"
            ],
            "note": "Expanded route anomaly for Cryo Basilica. This hostile is optional after the first three clears, but deleting it gives extra training and loot."
        },
        "34,21": {
            "id": "AN-116",
            "display": "Pale Wyrmling",
            "hp": 265,
            "atk": 26,
            "xp": 325,
            "credits": 141,
            "loot": [
                "Scrap Metal",
                "Corrupted Catalyst"
            ],
            "note": "Expanded route anomaly for Cryo Basilica. This hostile is optional after the first three clears, but deleting it gives extra training and loot."
        },
        "17,25": {
            "id": "AN-117",
            "display": "Prayer Leech",
            "hp": 276,
            "atk": 28,
            "xp": 334,
            "credits": 146,
            "loot": [
                "Scrap Metal",
                "Med Patch"
            ],
            "note": "Expanded route anomaly for Cryo Basilica. This hostile is optional after the first three clears, but deleting it gives extra training and loot."
        },
        "55,25": {
            "id": "AN-118",
            "display": "Cold Bell Revenant",
            "hp": 287,
            "atk": 30,
            "xp": 343,
            "credits": 151,
            "loot": [
                "Scrap Metal",
                "Corrupted Catalyst"
            ],
            "note": "Expanded route anomaly for Cryo Basilica. This hostile is optional after the first three clears, but deleting it gives extra training and loot."
        },
        "36,8": {
            "id": "BOSS-011",
            "display": "Basilica Wyrm",
            "hp": 580,
            "atk": 36,
            "xp": 1060,
            "credits": 490,
            "loot": [
                "Basilica Wyrm Core",
                "Rust Core",
                "Corrupted Catalyst",
                "Vector Cell"
            ],
            "bossReward": "Basilica Wyrm Core",
            "note": "Expanded-layout boss guarding the locked wing of Cryo Basilica. Clear three anomalies, open the security doors, then recover the core."
        }
    },
    "f012": {
        "16,9": {
            "id": "AN-121",
            "display": "Crown Ashguard",
            "hp": 225,
            "atk": 26,
            "xp": 305,
            "credits": 126,
            "loot": [
                "Scrap Metal",
                "Med Patch"
            ],
            "note": "Expanded route anomaly for Ash Crown Citadel. This hostile is optional after the first three clears, but deleting it gives extra training and loot."
        },
        "57,10": {
            "id": "AN-122",
            "display": "Citadel Hexer",
            "hp": 236,
            "atk": 28,
            "xp": 314,
            "credits": 131,
            "loot": [
                "Scrap Metal",
                "Corrupted Catalyst"
            ],
            "note": "Expanded route anomaly for Ash Crown Citadel. This hostile is optional after the first three clears, but deleting it gives extra training and loot."
        },
        "33,14": {
            "id": "AN-123",
            "display": "Regent Husk",
            "hp": 247,
            "atk": 30,
            "xp": 323,
            "credits": 136,
            "loot": [
                "Scrap Metal",
                "Corrupted Catalyst"
            ],
            "note": "Expanded route anomaly for Ash Crown Citadel. This hostile is optional after the first three clears, but deleting it gives extra training and loot."
        },
        "14,24": {
            "id": "AN-124",
            "display": "Goldbone Knight",
            "hp": 258,
            "atk": 32,
            "xp": 332,
            "credits": 141,
            "loot": [
                "Scrap Metal",
                "Med Patch"
            ],
            "note": "Expanded route anomaly for Ash Crown Citadel. This hostile is optional after the first three clears, but deleting it gives extra training and loot."
        },
        "53,24": {
            "id": "AN-125",
            "display": "Ash Crown Leech",
            "hp": 269,
            "atk": 26,
            "xp": 341,
            "credits": 146,
            "loot": [
                "Scrap Metal",
                "Corrupted Catalyst"
            ],
            "note": "Expanded route anomaly for Ash Crown Citadel. This hostile is optional after the first three clears, but deleting it gives extra training and loot."
        },
        "33,26": {
            "id": "AN-126",
            "display": "Vaulted Revenant",
            "hp": 280,
            "atk": 28,
            "xp": 350,
            "credits": 151,
            "loot": [
                "Scrap Metal",
                "Corrupted Catalyst"
            ],
            "note": "Expanded route anomaly for Ash Crown Citadel. This hostile is optional after the first three clears, but deleting it gives extra training and loot."
        },
        "58,34": {
            "id": "AN-127",
            "display": "Scepter Maw",
            "hp": 291,
            "atk": 30,
            "xp": 359,
            "credits": 156,
            "loot": [
                "Scrap Metal",
                "Med Patch"
            ],
            "note": "Expanded route anomaly for Ash Crown Citadel. This hostile is optional after the first three clears, but deleting it gives extra training and loot."
        },
        "64,35": {
            "id": "AN-128",
            "display": "Crownfire Horror",
            "hp": 302,
            "atk": 32,
            "xp": 368,
            "credits": 161,
            "loot": [
                "Scrap Metal",
                "Corrupted Catalyst"
            ],
            "note": "Expanded route anomaly for Ash Crown Citadel. This hostile is optional after the first three clears, but deleting it gives extra training and loot."
        },
        "60,35": {
            "id": "BOSS-012",
            "display": "Ash Crown Regent",
            "hp": 620,
            "atk": 38,
            "xp": 1150,
            "credits": 530,
            "loot": [
                "Ash Crown Core",
                "Rust Core",
                "Corrupted Catalyst",
                "Vector Cell"
            ],
            "bossReward": "Ash Crown Core",
            "note": "Expanded-layout boss guarding the locked wing of Ash Crown Citadel. Clear three anomalies, open the security doors, then recover the core."
        }
    }
};
  const V118_STAGE_PROPS = {
    "f001": [
        {
            "x": 52,
            "y": 4,
            "img": "assets/tilesets/forbidden/skull_01.png",
            "w": 36,
            "h": 34
        },
        {
            "x": 26,
            "y": 7,
            "img": "assets/tilesets/forbidden/headstone_03.png",
            "w": 44,
            "h": 41
        },
        {
            "x": 19,
            "y": 18,
            "img": "assets/tilesets/forbidden/bone_01.png",
            "w": 52,
            "h": 48
        },
        {
            "x": 41,
            "y": 20,
            "img": "assets/tilesets/forbidden/coffin_01.png",
            "w": 60,
            "h": 55
        },
        {
            "x": 3,
            "y": 2,
            "img": "assets/tilesets/forbidden/bush_01.png",
            "w": 36,
            "h": 62
        },
        {
            "x": 42,
            "y": 24,
            "img": "assets/tilesets/undead/grave_03.png",
            "w": 44,
            "h": 34
        },
        {
            "x": 11,
            "y": 27,
            "img": "assets/tilesets/undead/skull_pile_01.png",
            "w": 52,
            "h": 41
        },
        {
            "x": 33,
            "y": 24,
            "img": "assets/tilesets/forbidden/skull_01.png",
            "w": 60,
            "h": 48
        },
        {
            "x": 15,
            "y": 19,
            "img": "assets/tilesets/forbidden/headstone_03.png",
            "w": 36,
            "h": 55
        },
        {
            "x": 32,
            "y": 19,
            "img": "assets/tilesets/forbidden/bone_01.png",
            "w": 44,
            "h": 62
        },
        {
            "x": 29,
            "y": 10,
            "img": "assets/tilesets/forbidden/coffin_01.png",
            "w": 52,
            "h": 34
        },
        {
            "x": 34,
            "y": 10,
            "img": "assets/tilesets/forbidden/bush_01.png",
            "w": 60,
            "h": 41
        },
        {
            "x": 64,
            "y": 10,
            "img": "assets/tilesets/undead/grave_03.png",
            "w": 36,
            "h": 48
        },
        {
            "x": 25,
            "y": 25,
            "img": "assets/tilesets/undead/skull_pile_01.png",
            "w": 44,
            "h": 55
        },
        {
            "x": 59,
            "y": 10,
            "img": "assets/tilesets/forbidden/skull_01.png",
            "w": 52,
            "h": 62
        },
        {
            "x": 6,
            "y": 22,
            "img": "assets/tilesets/forbidden/headstone_03.png",
            "w": 60,
            "h": 34
        },
        {
            "x": 59,
            "y": 29,
            "img": "assets/tilesets/forbidden/bone_01.png",
            "w": 36,
            "h": 41
        },
        {
            "x": 20,
            "y": 11,
            "img": "assets/tilesets/forbidden/coffin_01.png",
            "w": 44,
            "h": 48
        },
        {
            "x": 11,
            "y": 3,
            "img": "assets/tilesets/forbidden/bush_01.png",
            "w": 52,
            "h": 55
        },
        {
            "x": 7,
            "y": 35,
            "img": "assets/tilesets/undead/grave_03.png",
            "w": 60,
            "h": 62
        },
        {
            "x": 55,
            "y": 32,
            "img": "assets/tilesets/undead/skull_pile_01.png",
            "w": 36,
            "h": 34
        },
        {
            "x": 44,
            "y": 3,
            "img": "assets/tilesets/forbidden/skull_01.png",
            "w": 44,
            "h": 41
        },
        {
            "x": 38,
            "y": 27,
            "img": "assets/tilesets/forbidden/headstone_03.png",
            "w": 52,
            "h": 48
        },
        {
            "x": 61,
            "y": 36,
            "img": "assets/tilesets/forbidden/bone_01.png",
            "w": 60,
            "h": 55
        }
    ],
    "f002": [
        {
            "x": 12,
            "y": 11,
            "img": "assets/tilesets/forbidden/rock_03.png",
            "w": 36,
            "h": 34
        },
        {
            "x": 32,
            "y": 21,
            "img": "assets/tilesets/undead/dead_arm_01.png",
            "w": 44,
            "h": 41
        },
        {
            "x": 58,
            "y": 35,
            "img": "assets/tilesets/undead/bones_03.png",
            "w": 52,
            "h": 48
        },
        {
            "x": 63,
            "y": 16,
            "img": "assets/tilesets/undead/rock_04.png",
            "w": 60,
            "h": 55
        },
        {
            "x": 30,
            "y": 18,
            "img": "assets/tilesets/forbidden/spike_01.png",
            "w": 36,
            "h": 62
        },
        {
            "x": 67,
            "y": 10,
            "img": "assets/tilesets/forbidden/rock_03.png",
            "w": 44,
            "h": 34
        },
        {
            "x": 16,
            "y": 7,
            "img": "assets/tilesets/undead/dead_arm_01.png",
            "w": 52,
            "h": 41
        },
        {
            "x": 38,
            "y": 18,
            "img": "assets/tilesets/undead/bones_03.png",
            "w": 60,
            "h": 48
        },
        {
            "x": 32,
            "y": 33,
            "img": "assets/tilesets/undead/rock_04.png",
            "w": 36,
            "h": 55
        },
        {
            "x": 27,
            "y": 36,
            "img": "assets/tilesets/forbidden/spike_01.png",
            "w": 44,
            "h": 62
        },
        {
            "x": 45,
            "y": 32,
            "img": "assets/tilesets/forbidden/rock_03.png",
            "w": 52,
            "h": 34
        },
        {
            "x": 64,
            "y": 32,
            "img": "assets/tilesets/undead/dead_arm_01.png",
            "w": 60,
            "h": 41
        },
        {
            "x": 66,
            "y": 21,
            "img": "assets/tilesets/undead/bones_03.png",
            "w": 36,
            "h": 48
        },
        {
            "x": 53,
            "y": 23,
            "img": "assets/tilesets/undead/rock_04.png",
            "w": 44,
            "h": 55
        },
        {
            "x": 7,
            "y": 9,
            "img": "assets/tilesets/forbidden/spike_01.png",
            "w": 52,
            "h": 62
        },
        {
            "x": 58,
            "y": 21,
            "img": "assets/tilesets/forbidden/rock_03.png",
            "w": 60,
            "h": 34
        },
        {
            "x": 5,
            "y": 6,
            "img": "assets/tilesets/undead/dead_arm_01.png",
            "w": 36,
            "h": 41
        },
        {
            "x": 23,
            "y": 10,
            "img": "assets/tilesets/undead/bones_03.png",
            "w": 44,
            "h": 48
        },
        {
            "x": 20,
            "y": 14,
            "img": "assets/tilesets/undead/rock_04.png",
            "w": 52,
            "h": 55
        },
        {
            "x": 61,
            "y": 24,
            "img": "assets/tilesets/forbidden/spike_01.png",
            "w": 60,
            "h": 62
        },
        {
            "x": 67,
            "y": 4,
            "img": "assets/tilesets/forbidden/rock_03.png",
            "w": 36,
            "h": 34
        },
        {
            "x": 29,
            "y": 26,
            "img": "assets/tilesets/undead/dead_arm_01.png",
            "w": 44,
            "h": 41
        },
        {
            "x": 52,
            "y": 34,
            "img": "assets/tilesets/undead/bones_03.png",
            "w": 52,
            "h": 48
        },
        {
            "x": 24,
            "y": 20,
            "img": "assets/tilesets/undead/rock_04.png",
            "w": 60,
            "h": 55
        }
    ],
    "f003": [
        {
            "x": 43,
            "y": 33,
            "img": "assets/tilesets/undead/lich_01.png",
            "w": 36,
            "h": 34
        },
        {
            "x": 8,
            "y": 10,
            "img": "assets/tilesets/undead/skull_pile_01.png",
            "w": 44,
            "h": 41
        },
        {
            "x": 24,
            "y": 4,
            "img": "assets/tilesets/undead/grave_03.png",
            "w": 52,
            "h": 48
        },
        {
            "x": 41,
            "y": 22,
            "img": "assets/tilesets/forbidden/fire_01.png",
            "w": 60,
            "h": 55
        },
        {
            "x": 19,
            "y": 6,
            "img": "assets/tilesets/forbidden/signpost_02.png",
            "w": 36,
            "h": 62
        },
        {
            "x": 57,
            "y": 36,
            "img": "assets/tilesets/undead/lich_01.png",
            "w": 44,
            "h": 34
        },
        {
            "x": 7,
            "y": 22,
            "img": "assets/tilesets/undead/skull_pile_01.png",
            "w": 52,
            "h": 41
        },
        {
            "x": 59,
            "y": 24,
            "img": "assets/tilesets/undead/grave_03.png",
            "w": 60,
            "h": 48
        },
        {
            "x": 43,
            "y": 17,
            "img": "assets/tilesets/forbidden/fire_01.png",
            "w": 36,
            "h": 55
        },
        {
            "x": 35,
            "y": 17,
            "img": "assets/tilesets/forbidden/signpost_02.png",
            "w": 44,
            "h": 62
        },
        {
            "x": 37,
            "y": 29,
            "img": "assets/tilesets/undead/lich_01.png",
            "w": 52,
            "h": 34
        },
        {
            "x": 12,
            "y": 28,
            "img": "assets/tilesets/undead/skull_pile_01.png",
            "w": 60,
            "h": 41
        },
        {
            "x": 14,
            "y": 3,
            "img": "assets/tilesets/undead/grave_03.png",
            "w": 36,
            "h": 48
        },
        {
            "x": 59,
            "y": 8,
            "img": "assets/tilesets/forbidden/fire_01.png",
            "w": 44,
            "h": 55
        },
        {
            "x": 54,
            "y": 31,
            "img": "assets/tilesets/forbidden/signpost_02.png",
            "w": 52,
            "h": 62
        },
        {
            "x": 28,
            "y": 23,
            "img": "assets/tilesets/undead/lich_01.png",
            "w": 60,
            "h": 34
        },
        {
            "x": 30,
            "y": 17,
            "img": "assets/tilesets/undead/skull_pile_01.png",
            "w": 36,
            "h": 41
        },
        {
            "x": 3,
            "y": 8,
            "img": "assets/tilesets/undead/grave_03.png",
            "w": 44,
            "h": 48
        },
        {
            "x": 54,
            "y": 7,
            "img": "assets/tilesets/forbidden/fire_01.png",
            "w": 52,
            "h": 55
        },
        {
            "x": 20,
            "y": 10,
            "img": "assets/tilesets/forbidden/signpost_02.png",
            "w": 60,
            "h": 62
        },
        {
            "x": 66,
            "y": 31,
            "img": "assets/tilesets/undead/lich_01.png",
            "w": 36,
            "h": 34
        },
        {
            "x": 44,
            "y": 4,
            "img": "assets/tilesets/undead/skull_pile_01.png",
            "w": 44,
            "h": 41
        },
        {
            "x": 45,
            "y": 23,
            "img": "assets/tilesets/undead/grave_03.png",
            "w": 52,
            "h": 48
        },
        {
            "x": 39,
            "y": 35,
            "img": "assets/tilesets/forbidden/fire_01.png",
            "w": 60,
            "h": 55
        }
    ],
    "f004": [
        {
            "x": 36,
            "y": 8,
            "img": "assets/tilesets/undead/ruin_01.png",
            "w": 36,
            "h": 34
        },
        {
            "x": 17,
            "y": 37,
            "img": "assets/tilesets/undead/rock_04.png",
            "w": 44,
            "h": 41
        },
        {
            "x": 28,
            "y": 17,
            "img": "assets/tilesets/undead/bones_03.png",
            "w": 52,
            "h": 48
        },
        {
            "x": 58,
            "y": 7,
            "img": "assets/tilesets/forbidden/stone_fence_02.png",
            "w": 60,
            "h": 55
        },
        {
            "x": 44,
            "y": 27,
            "img": "assets/tilesets/forbidden/rock_02.png",
            "w": 36,
            "h": 62
        },
        {
            "x": 33,
            "y": 20,
            "img": "assets/tilesets/undead/ruin_01.png",
            "w": 44,
            "h": 34
        },
        {
            "x": 51,
            "y": 23,
            "img": "assets/tilesets/undead/rock_04.png",
            "w": 52,
            "h": 41
        },
        {
            "x": 31,
            "y": 10,
            "img": "assets/tilesets/undead/bones_03.png",
            "w": 60,
            "h": 48
        },
        {
            "x": 17,
            "y": 23,
            "img": "assets/tilesets/forbidden/stone_fence_02.png",
            "w": 36,
            "h": 55
        },
        {
            "x": 40,
            "y": 9,
            "img": "assets/tilesets/forbidden/rock_02.png",
            "w": 44,
            "h": 62
        },
        {
            "x": 7,
            "y": 32,
            "img": "assets/tilesets/undead/ruin_01.png",
            "w": 52,
            "h": 34
        },
        {
            "x": 22,
            "y": 6,
            "img": "assets/tilesets/undead/rock_04.png",
            "w": 60,
            "h": 41
        },
        {
            "x": 60,
            "y": 4,
            "img": "assets/tilesets/undead/bones_03.png",
            "w": 36,
            "h": 48
        },
        {
            "x": 25,
            "y": 24,
            "img": "assets/tilesets/forbidden/stone_fence_02.png",
            "w": 44,
            "h": 55
        },
        {
            "x": 60,
            "y": 28,
            "img": "assets/tilesets/forbidden/rock_02.png",
            "w": 52,
            "h": 62
        },
        {
            "x": 49,
            "y": 7,
            "img": "assets/tilesets/undead/ruin_01.png",
            "w": 60,
            "h": 34
        },
        {
            "x": 14,
            "y": 30,
            "img": "assets/tilesets/undead/rock_04.png",
            "w": 36,
            "h": 41
        },
        {
            "x": 23,
            "y": 30,
            "img": "assets/tilesets/undead/bones_03.png",
            "w": 44,
            "h": 48
        },
        {
            "x": 34,
            "y": 5,
            "img": "assets/tilesets/forbidden/stone_fence_02.png",
            "w": 52,
            "h": 55
        },
        {
            "x": 3,
            "y": 5,
            "img": "assets/tilesets/forbidden/rock_02.png",
            "w": 60,
            "h": 62
        },
        {
            "x": 31,
            "y": 26,
            "img": "assets/tilesets/undead/ruin_01.png",
            "w": 36,
            "h": 34
        },
        {
            "x": 56,
            "y": 37,
            "img": "assets/tilesets/undead/rock_04.png",
            "w": 44,
            "h": 41
        },
        {
            "x": 37,
            "y": 19,
            "img": "assets/tilesets/undead/bones_03.png",
            "w": 52,
            "h": 48
        },
        {
            "x": 29,
            "y": 32,
            "img": "assets/tilesets/forbidden/stone_fence_02.png",
            "w": 60,
            "h": 55
        }
    ],
    "f005": [
        {
            "x": 15,
            "y": 18,
            "img": "assets/tilesets/undead/ruin_01.png",
            "w": 36,
            "h": 34
        },
        {
            "x": 8,
            "y": 21,
            "img": "assets/tilesets/forbidden/signpost_02.png",
            "w": 44,
            "h": 41
        },
        {
            "x": 23,
            "y": 37,
            "img": "assets/tilesets/undead/plant_01.png",
            "w": 52,
            "h": 48
        },
        {
            "x": 28,
            "y": 36,
            "img": "assets/tilesets/forbidden/lantern_01.png",
            "w": 60,
            "h": 55
        },
        {
            "x": 47,
            "y": 10,
            "img": "assets/tilesets/forbidden/rock_01.png",
            "w": 36,
            "h": 62
        },
        {
            "x": 55,
            "y": 19,
            "img": "assets/tilesets/undead/ruin_01.png",
            "w": 44,
            "h": 34
        },
        {
            "x": 61,
            "y": 3,
            "img": "assets/tilesets/forbidden/signpost_02.png",
            "w": 52,
            "h": 41
        },
        {
            "x": 34,
            "y": 5,
            "img": "assets/tilesets/undead/plant_01.png",
            "w": 60,
            "h": 48
        },
        {
            "x": 6,
            "y": 25,
            "img": "assets/tilesets/forbidden/lantern_01.png",
            "w": 36,
            "h": 55
        },
        {
            "x": 65,
            "y": 26,
            "img": "assets/tilesets/forbidden/rock_01.png",
            "w": 44,
            "h": 62
        },
        {
            "x": 42,
            "y": 22,
            "img": "assets/tilesets/undead/ruin_01.png",
            "w": 52,
            "h": 34
        },
        {
            "x": 59,
            "y": 34,
            "img": "assets/tilesets/forbidden/signpost_02.png",
            "w": 60,
            "h": 41
        },
        {
            "x": 23,
            "y": 3,
            "img": "assets/tilesets/undead/plant_01.png",
            "w": 36,
            "h": 48
        },
        {
            "x": 32,
            "y": 8,
            "img": "assets/tilesets/forbidden/lantern_01.png",
            "w": 44,
            "h": 55
        },
        {
            "x": 16,
            "y": 33,
            "img": "assets/tilesets/forbidden/rock_01.png",
            "w": 52,
            "h": 62
        },
        {
            "x": 64,
            "y": 38,
            "img": "assets/tilesets/undead/ruin_01.png",
            "w": 60,
            "h": 34
        },
        {
            "x": 4,
            "y": 7,
            "img": "assets/tilesets/forbidden/signpost_02.png",
            "w": 36,
            "h": 41
        },
        {
            "x": 62,
            "y": 8,
            "img": "assets/tilesets/undead/plant_01.png",
            "w": 44,
            "h": 48
        },
        {
            "x": 52,
            "y": 31,
            "img": "assets/tilesets/forbidden/lantern_01.png",
            "w": 52,
            "h": 55
        },
        {
            "x": 16,
            "y": 27,
            "img": "assets/tilesets/forbidden/rock_01.png",
            "w": 60,
            "h": 62
        },
        {
            "x": 28,
            "y": 12,
            "img": "assets/tilesets/undead/ruin_01.png",
            "w": 36,
            "h": 34
        },
        {
            "x": 20,
            "y": 20,
            "img": "assets/tilesets/forbidden/signpost_02.png",
            "w": 44,
            "h": 41
        },
        {
            "x": 60,
            "y": 18,
            "img": "assets/tilesets/undead/plant_01.png",
            "w": 52,
            "h": 48
        },
        {
            "x": 43,
            "y": 6,
            "img": "assets/tilesets/forbidden/lantern_01.png",
            "w": 60,
            "h": 55
        }
    ],
    "f006": [
        {
            "x": 17,
            "y": 7,
            "img": "assets/tilesets/undead/lich_01.png",
            "w": 36,
            "h": 34
        },
        {
            "x": 22,
            "y": 31,
            "img": "assets/tilesets/undead/ruin_01.png",
            "w": 44,
            "h": 41
        },
        {
            "x": 23,
            "y": 35,
            "img": "assets/tilesets/undead/skull_pile_01.png",
            "w": 52,
            "h": 48
        },
        {
            "x": 30,
            "y": 12,
            "img": "assets/tilesets/forbidden/crypt_01.png",
            "w": 60,
            "h": 55
        },
        {
            "x": 9,
            "y": 8,
            "img": "assets/tilesets/forbidden/fire_01.png",
            "w": 36,
            "h": 62
        },
        {
            "x": 59,
            "y": 34,
            "img": "assets/tilesets/undead/lich_01.png",
            "w": 44,
            "h": 34
        },
        {
            "x": 38,
            "y": 24,
            "img": "assets/tilesets/undead/ruin_01.png",
            "w": 52,
            "h": 41
        },
        {
            "x": 28,
            "y": 25,
            "img": "assets/tilesets/undead/skull_pile_01.png",
            "w": 60,
            "h": 48
        },
        {
            "x": 36,
            "y": 37,
            "img": "assets/tilesets/forbidden/crypt_01.png",
            "w": 36,
            "h": 55
        },
        {
            "x": 30,
            "y": 38,
            "img": "assets/tilesets/forbidden/fire_01.png",
            "w": 44,
            "h": 62
        },
        {
            "x": 42,
            "y": 23,
            "img": "assets/tilesets/undead/lich_01.png",
            "w": 52,
            "h": 34
        },
        {
            "x": 2,
            "y": 35,
            "img": "assets/tilesets/undead/ruin_01.png",
            "w": 60,
            "h": 41
        },
        {
            "x": 13,
            "y": 13,
            "img": "assets/tilesets/undead/skull_pile_01.png",
            "w": 36,
            "h": 48
        },
        {
            "x": 49,
            "y": 21,
            "img": "assets/tilesets/forbidden/crypt_01.png",
            "w": 44,
            "h": 55
        },
        {
            "x": 60,
            "y": 15,
            "img": "assets/tilesets/forbidden/fire_01.png",
            "w": 52,
            "h": 62
        },
        {
            "x": 13,
            "y": 36,
            "img": "assets/tilesets/undead/lich_01.png",
            "w": 60,
            "h": 34
        },
        {
            "x": 52,
            "y": 34,
            "img": "assets/tilesets/undead/ruin_01.png",
            "w": 36,
            "h": 41
        },
        {
            "x": 38,
            "y": 13,
            "img": "assets/tilesets/undead/skull_pile_01.png",
            "w": 44,
            "h": 48
        },
        {
            "x": 33,
            "y": 16,
            "img": "assets/tilesets/forbidden/crypt_01.png",
            "w": 52,
            "h": 55
        },
        {
            "x": 10,
            "y": 33,
            "img": "assets/tilesets/forbidden/fire_01.png",
            "w": 60,
            "h": 62
        },
        {
            "x": 24,
            "y": 14,
            "img": "assets/tilesets/undead/lich_01.png",
            "w": 36,
            "h": 34
        },
        {
            "x": 33,
            "y": 34,
            "img": "assets/tilesets/undead/ruin_01.png",
            "w": 44,
            "h": 41
        },
        {
            "x": 4,
            "y": 4,
            "img": "assets/tilesets/undead/skull_pile_01.png",
            "w": 52,
            "h": 48
        },
        {
            "x": 22,
            "y": 5,
            "img": "assets/tilesets/forbidden/crypt_01.png",
            "w": 60,
            "h": 55
        }
    ],
    "f007": [
        {
            "x": 13,
            "y": 34,
            "img": "assets/tilesets/forbidden/rock_03.png",
            "w": 36,
            "h": 34
        },
        {
            "x": 4,
            "y": 24,
            "img": "assets/tilesets/undead/dead_arm_01.png",
            "w": 44,
            "h": 41
        },
        {
            "x": 60,
            "y": 22,
            "img": "assets/tilesets/undead/bones_03.png",
            "w": 52,
            "h": 48
        },
        {
            "x": 34,
            "y": 9,
            "img": "assets/tilesets/undead/rock_04.png",
            "w": 60,
            "h": 55
        },
        {
            "x": 66,
            "y": 35,
            "img": "assets/tilesets/forbidden/spike_01.png",
            "w": 36,
            "h": 62
        },
        {
            "x": 36,
            "y": 6,
            "img": "assets/tilesets/forbidden/rock_03.png",
            "w": 44,
            "h": 34
        },
        {
            "x": 22,
            "y": 24,
            "img": "assets/tilesets/undead/dead_arm_01.png",
            "w": 52,
            "h": 41
        },
        {
            "x": 63,
            "y": 9,
            "img": "assets/tilesets/undead/bones_03.png",
            "w": 60,
            "h": 48
        },
        {
            "x": 31,
            "y": 19,
            "img": "assets/tilesets/undead/rock_04.png",
            "w": 36,
            "h": 55
        },
        {
            "x": 30,
            "y": 38,
            "img": "assets/tilesets/forbidden/spike_01.png",
            "w": 44,
            "h": 62
        },
        {
            "x": 45,
            "y": 23,
            "img": "assets/tilesets/forbidden/rock_03.png",
            "w": 52,
            "h": 34
        },
        {
            "x": 7,
            "y": 34,
            "img": "assets/tilesets/undead/dead_arm_01.png",
            "w": 60,
            "h": 41
        },
        {
            "x": 5,
            "y": 19,
            "img": "assets/tilesets/undead/bones_03.png",
            "w": 36,
            "h": 48
        },
        {
            "x": 28,
            "y": 29,
            "img": "assets/tilesets/undead/rock_04.png",
            "w": 44,
            "h": 55
        },
        {
            "x": 49,
            "y": 6,
            "img": "assets/tilesets/forbidden/spike_01.png",
            "w": 52,
            "h": 62
        },
        {
            "x": 7,
            "y": 22,
            "img": "assets/tilesets/forbidden/rock_03.png",
            "w": 60,
            "h": 34
        },
        {
            "x": 64,
            "y": 19,
            "img": "assets/tilesets/undead/dead_arm_01.png",
            "w": 36,
            "h": 41
        },
        {
            "x": 19,
            "y": 31,
            "img": "assets/tilesets/undead/bones_03.png",
            "w": 44,
            "h": 48
        },
        {
            "x": 59,
            "y": 27,
            "img": "assets/tilesets/undead/rock_04.png",
            "w": 52,
            "h": 55
        },
        {
            "x": 29,
            "y": 24,
            "img": "assets/tilesets/forbidden/spike_01.png",
            "w": 60,
            "h": 62
        },
        {
            "x": 55,
            "y": 5,
            "img": "assets/tilesets/forbidden/rock_03.png",
            "w": 36,
            "h": 34
        },
        {
            "x": 40,
            "y": 22,
            "img": "assets/tilesets/undead/dead_arm_01.png",
            "w": 44,
            "h": 41
        },
        {
            "x": 17,
            "y": 35,
            "img": "assets/tilesets/undead/bones_03.png",
            "w": 52,
            "h": 48
        },
        {
            "x": 24,
            "y": 21,
            "img": "assets/tilesets/undead/rock_04.png",
            "w": 60,
            "h": 55
        }
    ],
    "f008": [
        {
            "x": 11,
            "y": 21,
            "img": "assets/tilesets/undead/ruin_01.png",
            "w": 36,
            "h": 34
        },
        {
            "x": 63,
            "y": 36,
            "img": "assets/tilesets/forbidden/signpost_02.png",
            "w": 44,
            "h": 41
        },
        {
            "x": 40,
            "y": 21,
            "img": "assets/tilesets/undead/plant_01.png",
            "w": 52,
            "h": 48
        },
        {
            "x": 18,
            "y": 30,
            "img": "assets/tilesets/forbidden/lantern_01.png",
            "w": 60,
            "h": 55
        },
        {
            "x": 42,
            "y": 25,
            "img": "assets/tilesets/forbidden/rock_01.png",
            "w": 36,
            "h": 62
        },
        {
            "x": 22,
            "y": 31,
            "img": "assets/tilesets/undead/ruin_01.png",
            "w": 44,
            "h": 34
        },
        {
            "x": 18,
            "y": 16,
            "img": "assets/tilesets/forbidden/signpost_02.png",
            "w": 52,
            "h": 41
        },
        {
            "x": 56,
            "y": 22,
            "img": "assets/tilesets/undead/plant_01.png",
            "w": 60,
            "h": 48
        },
        {
            "x": 25,
            "y": 7,
            "img": "assets/tilesets/forbidden/lantern_01.png",
            "w": 36,
            "h": 55
        },
        {
            "x": 14,
            "y": 19,
            "img": "assets/tilesets/forbidden/rock_01.png",
            "w": 44,
            "h": 62
        },
        {
            "x": 27,
            "y": 12,
            "img": "assets/tilesets/undead/ruin_01.png",
            "w": 52,
            "h": 34
        },
        {
            "x": 58,
            "y": 4,
            "img": "assets/tilesets/forbidden/signpost_02.png",
            "w": 60,
            "h": 41
        },
        {
            "x": 41,
            "y": 6,
            "img": "assets/tilesets/undead/plant_01.png",
            "w": 36,
            "h": 48
        },
        {
            "x": 20,
            "y": 8,
            "img": "assets/tilesets/forbidden/lantern_01.png",
            "w": 44,
            "h": 55
        },
        {
            "x": 31,
            "y": 34,
            "img": "assets/tilesets/forbidden/rock_01.png",
            "w": 52,
            "h": 62
        },
        {
            "x": 47,
            "y": 11,
            "img": "assets/tilesets/undead/ruin_01.png",
            "w": 60,
            "h": 34
        },
        {
            "x": 9,
            "y": 17,
            "img": "assets/tilesets/forbidden/signpost_02.png",
            "w": 36,
            "h": 41
        },
        {
            "x": 33,
            "y": 3,
            "img": "assets/tilesets/undead/plant_01.png",
            "w": 44,
            "h": 48
        },
        {
            "x": 17,
            "y": 35,
            "img": "assets/tilesets/forbidden/lantern_01.png",
            "w": 52,
            "h": 55
        },
        {
            "x": 51,
            "y": 6,
            "img": "assets/tilesets/forbidden/rock_01.png",
            "w": 60,
            "h": 62
        },
        {
            "x": 24,
            "y": 16,
            "img": "assets/tilesets/undead/ruin_01.png",
            "w": 36,
            "h": 34
        },
        {
            "x": 30,
            "y": 38,
            "img": "assets/tilesets/forbidden/signpost_02.png",
            "w": 44,
            "h": 41
        },
        {
            "x": 32,
            "y": 8,
            "img": "assets/tilesets/undead/plant_01.png",
            "w": 52,
            "h": 48
        },
        {
            "x": 11,
            "y": 9,
            "img": "assets/tilesets/forbidden/lantern_01.png",
            "w": 60,
            "h": 55
        }
    ],
    "f009": [
        {
            "x": 13,
            "y": 20,
            "img": "assets/tilesets/forbidden/skull_01.png",
            "w": 36,
            "h": 34
        },
        {
            "x": 26,
            "y": 33,
            "img": "assets/tilesets/forbidden/headstone_03.png",
            "w": 44,
            "h": 41
        },
        {
            "x": 22,
            "y": 9,
            "img": "assets/tilesets/forbidden/bone_01.png",
            "w": 52,
            "h": 48
        },
        {
            "x": 21,
            "y": 5,
            "img": "assets/tilesets/forbidden/coffin_01.png",
            "w": 60,
            "h": 55
        },
        {
            "x": 59,
            "y": 11,
            "img": "assets/tilesets/forbidden/bush_01.png",
            "w": 36,
            "h": 62
        },
        {
            "x": 3,
            "y": 38,
            "img": "assets/tilesets/undead/grave_03.png",
            "w": 44,
            "h": 34
        },
        {
            "x": 22,
            "y": 24,
            "img": "assets/tilesets/undead/skull_pile_01.png",
            "w": 52,
            "h": 41
        },
        {
            "x": 45,
            "y": 24,
            "img": "assets/tilesets/forbidden/skull_01.png",
            "w": 60,
            "h": 48
        },
        {
            "x": 28,
            "y": 28,
            "img": "assets/tilesets/forbidden/headstone_03.png",
            "w": 36,
            "h": 55
        },
        {
            "x": 30,
            "y": 4,
            "img": "assets/tilesets/forbidden/bone_01.png",
            "w": 44,
            "h": 62
        },
        {
            "x": 14,
            "y": 24,
            "img": "assets/tilesets/forbidden/coffin_01.png",
            "w": 52,
            "h": 34
        },
        {
            "x": 36,
            "y": 21,
            "img": "assets/tilesets/forbidden/bush_01.png",
            "w": 60,
            "h": 41
        },
        {
            "x": 36,
            "y": 37,
            "img": "assets/tilesets/undead/grave_03.png",
            "w": 36,
            "h": 48
        },
        {
            "x": 17,
            "y": 14,
            "img": "assets/tilesets/undead/skull_pile_01.png",
            "w": 44,
            "h": 55
        },
        {
            "x": 13,
            "y": 38,
            "img": "assets/tilesets/forbidden/skull_01.png",
            "w": 52,
            "h": 62
        },
        {
            "x": 7,
            "y": 37,
            "img": "assets/tilesets/forbidden/headstone_03.png",
            "w": 60,
            "h": 34
        },
        {
            "x": 16,
            "y": 10,
            "img": "assets/tilesets/forbidden/bone_01.png",
            "w": 36,
            "h": 41
        },
        {
            "x": 15,
            "y": 33,
            "img": "assets/tilesets/forbidden/coffin_01.png",
            "w": 44,
            "h": 48
        },
        {
            "x": 55,
            "y": 9,
            "img": "assets/tilesets/forbidden/bush_01.png",
            "w": 52,
            "h": 55
        },
        {
            "x": 62,
            "y": 37,
            "img": "assets/tilesets/undead/grave_03.png",
            "w": 60,
            "h": 62
        },
        {
            "x": 48,
            "y": 35,
            "img": "assets/tilesets/undead/skull_pile_01.png",
            "w": 36,
            "h": 34
        },
        {
            "x": 11,
            "y": 31,
            "img": "assets/tilesets/forbidden/skull_01.png",
            "w": 44,
            "h": 41
        },
        {
            "x": 53,
            "y": 23,
            "img": "assets/tilesets/forbidden/headstone_03.png",
            "w": 52,
            "h": 48
        },
        {
            "x": 52,
            "y": 37,
            "img": "assets/tilesets/forbidden/bone_01.png",
            "w": 60,
            "h": 55
        }
    ],
    "f010": [
        {
            "x": 54,
            "y": 16,
            "img": "assets/tilesets/undead/lich_01.png",
            "w": 36,
            "h": 34
        },
        {
            "x": 5,
            "y": 22,
            "img": "assets/tilesets/undead/skull_pile_01.png",
            "w": 44,
            "h": 41
        },
        {
            "x": 29,
            "y": 7,
            "img": "assets/tilesets/undead/grave_03.png",
            "w": 52,
            "h": 48
        },
        {
            "x": 59,
            "y": 21,
            "img": "assets/tilesets/forbidden/fire_01.png",
            "w": 60,
            "h": 55
        },
        {
            "x": 4,
            "y": 9,
            "img": "assets/tilesets/forbidden/signpost_02.png",
            "w": 36,
            "h": 62
        },
        {
            "x": 40,
            "y": 23,
            "img": "assets/tilesets/undead/lich_01.png",
            "w": 44,
            "h": 34
        },
        {
            "x": 17,
            "y": 6,
            "img": "assets/tilesets/undead/skull_pile_01.png",
            "w": 52,
            "h": 41
        },
        {
            "x": 57,
            "y": 18,
            "img": "assets/tilesets/undead/grave_03.png",
            "w": 60,
            "h": 48
        },
        {
            "x": 35,
            "y": 4,
            "img": "assets/tilesets/forbidden/fire_01.png",
            "w": 36,
            "h": 55
        },
        {
            "x": 43,
            "y": 16,
            "img": "assets/tilesets/forbidden/signpost_02.png",
            "w": 44,
            "h": 62
        },
        {
            "x": 61,
            "y": 24,
            "img": "assets/tilesets/undead/lich_01.png",
            "w": 52,
            "h": 34
        },
        {
            "x": 32,
            "y": 32,
            "img": "assets/tilesets/undead/skull_pile_01.png",
            "w": 60,
            "h": 41
        },
        {
            "x": 15,
            "y": 25,
            "img": "assets/tilesets/undead/grave_03.png",
            "w": 36,
            "h": 48
        },
        {
            "x": 56,
            "y": 25,
            "img": "assets/tilesets/forbidden/fire_01.png",
            "w": 44,
            "h": 55
        },
        {
            "x": 16,
            "y": 35,
            "img": "assets/tilesets/forbidden/signpost_02.png",
            "w": 52,
            "h": 62
        },
        {
            "x": 52,
            "y": 23,
            "img": "assets/tilesets/undead/lich_01.png",
            "w": 60,
            "h": 34
        },
        {
            "x": 63,
            "y": 16,
            "img": "assets/tilesets/undead/skull_pile_01.png",
            "w": 36,
            "h": 41
        },
        {
            "x": 15,
            "y": 19,
            "img": "assets/tilesets/undead/grave_03.png",
            "w": 44,
            "h": 48
        },
        {
            "x": 11,
            "y": 5,
            "img": "assets/tilesets/forbidden/fire_01.png",
            "w": 52,
            "h": 55
        },
        {
            "x": 53,
            "y": 36,
            "img": "assets/tilesets/forbidden/signpost_02.png",
            "w": 60,
            "h": 62
        },
        {
            "x": 41,
            "y": 38,
            "img": "assets/tilesets/undead/lich_01.png",
            "w": 36,
            "h": 34
        },
        {
            "x": 51,
            "y": 31,
            "img": "assets/tilesets/undead/skull_pile_01.png",
            "w": 44,
            "h": 41
        },
        {
            "x": 15,
            "y": 13,
            "img": "assets/tilesets/undead/grave_03.png",
            "w": 52,
            "h": 48
        },
        {
            "x": 37,
            "y": 10,
            "img": "assets/tilesets/forbidden/fire_01.png",
            "w": 60,
            "h": 55
        }
    ],
    "f011": [
        {
            "x": 33,
            "y": 34,
            "img": "assets/tilesets/undead/ruin_01.png",
            "w": 36,
            "h": 34
        },
        {
            "x": 49,
            "y": 24,
            "img": "assets/tilesets/undead/rock_04.png",
            "w": 44,
            "h": 41
        },
        {
            "x": 16,
            "y": 15,
            "img": "assets/tilesets/undead/bones_03.png",
            "w": 52,
            "h": 48
        },
        {
            "x": 52,
            "y": 29,
            "img": "assets/tilesets/forbidden/stone_fence_02.png",
            "w": 60,
            "h": 55
        },
        {
            "x": 30,
            "y": 25,
            "img": "assets/tilesets/forbidden/rock_02.png",
            "w": 36,
            "h": 62
        },
        {
            "x": 9,
            "y": 16,
            "img": "assets/tilesets/undead/ruin_01.png",
            "w": 44,
            "h": 34
        },
        {
            "x": 56,
            "y": 27,
            "img": "assets/tilesets/undead/rock_04.png",
            "w": 52,
            "h": 41
        },
        {
            "x": 53,
            "y": 23,
            "img": "assets/tilesets/undead/bones_03.png",
            "w": 60,
            "h": 48
        },
        {
            "x": 22,
            "y": 16,
            "img": "assets/tilesets/forbidden/stone_fence_02.png",
            "w": 36,
            "h": 55
        },
        {
            "x": 38,
            "y": 35,
            "img": "assets/tilesets/forbidden/rock_02.png",
            "w": 44,
            "h": 62
        },
        {
            "x": 45,
            "y": 10,
            "img": "assets/tilesets/undead/ruin_01.png",
            "w": 52,
            "h": 34
        },
        {
            "x": 53,
            "y": 15,
            "img": "assets/tilesets/undead/rock_04.png",
            "w": 60,
            "h": 41
        },
        {
            "x": 44,
            "y": 18,
            "img": "assets/tilesets/undead/bones_03.png",
            "w": 36,
            "h": 48
        },
        {
            "x": 23,
            "y": 25,
            "img": "assets/tilesets/forbidden/stone_fence_02.png",
            "w": 44,
            "h": 55
        },
        {
            "x": 54,
            "y": 10,
            "img": "assets/tilesets/forbidden/rock_02.png",
            "w": 52,
            "h": 62
        },
        {
            "x": 62,
            "y": 15,
            "img": "assets/tilesets/undead/ruin_01.png",
            "w": 60,
            "h": 34
        },
        {
            "x": 29,
            "y": 18,
            "img": "assets/tilesets/undead/rock_04.png",
            "w": 36,
            "h": 41
        },
        {
            "x": 61,
            "y": 27,
            "img": "assets/tilesets/undead/bones_03.png",
            "w": 44,
            "h": 48
        },
        {
            "x": 17,
            "y": 30,
            "img": "assets/tilesets/forbidden/stone_fence_02.png",
            "w": 52,
            "h": 55
        },
        {
            "x": 42,
            "y": 36,
            "img": "assets/tilesets/forbidden/rock_02.png",
            "w": 60,
            "h": 62
        },
        {
            "x": 21,
            "y": 10,
            "img": "assets/tilesets/undead/ruin_01.png",
            "w": 36,
            "h": 34
        },
        {
            "x": 62,
            "y": 9,
            "img": "assets/tilesets/undead/rock_04.png",
            "w": 44,
            "h": 41
        },
        {
            "x": 10,
            "y": 30,
            "img": "assets/tilesets/undead/bones_03.png",
            "w": 52,
            "h": 48
        },
        {
            "x": 9,
            "y": 23,
            "img": "assets/tilesets/forbidden/stone_fence_02.png",
            "w": 60,
            "h": 55
        }
    ],
    "f012": [
        {
            "x": 7,
            "y": 21,
            "img": "assets/tilesets/undead/lich_01.png",
            "w": 36,
            "h": 34
        },
        {
            "x": 54,
            "y": 35,
            "img": "assets/tilesets/undead/ruin_01.png",
            "w": 44,
            "h": 41
        },
        {
            "x": 22,
            "y": 9,
            "img": "assets/tilesets/undead/skull_pile_01.png",
            "w": 52,
            "h": 48
        },
        {
            "x": 63,
            "y": 38,
            "img": "assets/tilesets/forbidden/crypt_01.png",
            "w": 60,
            "h": 55
        },
        {
            "x": 12,
            "y": 24,
            "img": "assets/tilesets/forbidden/fire_01.png",
            "w": 36,
            "h": 62
        },
        {
            "x": 57,
            "y": 38,
            "img": "assets/tilesets/undead/lich_01.png",
            "w": 44,
            "h": 34
        },
        {
            "x": 18,
            "y": 11,
            "img": "assets/tilesets/undead/ruin_01.png",
            "w": 52,
            "h": 41
        },
        {
            "x": 52,
            "y": 7,
            "img": "assets/tilesets/undead/skull_pile_01.png",
            "w": 60,
            "h": 48
        },
        {
            "x": 8,
            "y": 35,
            "img": "assets/tilesets/forbidden/crypt_01.png",
            "w": 36,
            "h": 55
        },
        {
            "x": 14,
            "y": 8,
            "img": "assets/tilesets/forbidden/fire_01.png",
            "w": 44,
            "h": 62
        },
        {
            "x": 24,
            "y": 20,
            "img": "assets/tilesets/undead/lich_01.png",
            "w": 52,
            "h": 34
        },
        {
            "x": 60,
            "y": 31,
            "img": "assets/tilesets/undead/ruin_01.png",
            "w": 60,
            "h": 41
        },
        {
            "x": 29,
            "y": 15,
            "img": "assets/tilesets/undead/skull_pile_01.png",
            "w": 36,
            "h": 48
        },
        {
            "x": 9,
            "y": 12,
            "img": "assets/tilesets/forbidden/crypt_01.png",
            "w": 44,
            "h": 55
        },
        {
            "x": 38,
            "y": 15,
            "img": "assets/tilesets/forbidden/fire_01.png",
            "w": 52,
            "h": 62
        },
        {
            "x": 19,
            "y": 25,
            "img": "assets/tilesets/undead/lich_01.png",
            "w": 60,
            "h": 34
        },
        {
            "x": 53,
            "y": 14,
            "img": "assets/tilesets/undead/ruin_01.png",
            "w": 36,
            "h": 41
        },
        {
            "x": 56,
            "y": 32,
            "img": "assets/tilesets/undead/skull_pile_01.png",
            "w": 44,
            "h": 48
        },
        {
            "x": 52,
            "y": 38,
            "img": "assets/tilesets/forbidden/crypt_01.png",
            "w": 52,
            "h": 55
        },
        {
            "x": 61,
            "y": 8,
            "img": "assets/tilesets/forbidden/fire_01.png",
            "w": 60,
            "h": 62
        },
        {
            "x": 57,
            "y": 15,
            "img": "assets/tilesets/undead/lich_01.png",
            "w": 36,
            "h": 34
        },
        {
            "x": 36,
            "y": 25,
            "img": "assets/tilesets/undead/ruin_01.png",
            "w": 44,
            "h": 41
        },
        {
            "x": 11,
            "y": 37,
            "img": "assets/tilesets/undead/skull_pile_01.png",
            "w": 52,
            "h": 48
        },
        {
            "x": 65,
            "y": 7,
            "img": "assets/tilesets/forbidden/crypt_01.png",
            "w": 60,
            "h": 55
        }
    ]
};
  const V118_FERMILAT_STAGES = {
    "f001": {
        "x": 42,
        "y": 26,
        "scene": "fermilatF001"
    },
    "f002": {
        "x": 46,
        "y": 29,
        "scene": "fermilatF002"
    },
    "f003": {
        "x": 44,
        "y": 30,
        "scene": "fermilatF003"
    },
    "f004": {
        "x": 46,
        "y": 28,
        "scene": "fermilatF004"
    },
    "f005": {
        "x": 45,
        "y": 25,
        "scene": "fermilatF005"
    },
    "f006": {
        "x": 42,
        "y": 28,
        "scene": "fermilatF006"
    },
    "f007": {
        "x": 46,
        "y": 27,
        "scene": "fermilatF007"
    },
    "f008": {
        "x": 46,
        "y": 28,
        "scene": "fermilatF008"
    },
    "f009": {
        "x": 46,
        "y": 29,
        "scene": "fermilatF009"
    },
    "f010": {
        "x": 45,
        "y": 25,
        "scene": "fermilatF010"
    },
    "f011": {
        "x": 46,
        "y": 28,
        "scene": "fermilatF011"
    },
    "f012": {
        "x": 46,
        "y": 28,
        "scene": "fermilatF012"
    }
};

  Object.entries(V118_STAGE_MAPS).forEach(([key,map])=>{
    if(!STAGE_DEFS[key]) return;
    STAGE_DEFS[key].map = normalizeMapRows(map);
    STAGE_DEFS[key].levelReq = V118_STAGE_LEVEL_REQS[key] || STAGE_DEFS[key].levelReq;
    STAGE_DEFS[key].objective = `expanded route → sync terminal → clear ${requiredAnomaliesForStage(key)} of 8 anomalies → locked boss wing → extraction`;
    STAGE_DEFS[key].threat = `${STAGE_DEFS[key].threat} // EXPANDED LAYOUT`;
  });
  Object.assign(ENCOUNTER_SLOTS, V118_ENCOUNTER_SLOTS);
  Object.assign(STAGE_ENCOUNTER_DEFS, V118_STAGE_ENCOUNTERS);
  Object.assign(NPC_DEFS.fermilat.stages, V118_FERMILAT_STAGES);
  Object.entries(V118_STAGE_PROPS).forEach(([key,extra])=>{
    stageVisualPacks[key] ||= {};
    stageVisualPacks[key].props = [...(stageVisualPacks[key].props || []), ...extra];
    stageVisualPacks[key].blocked = [...new Set([...(stageVisualPacks[key].blocked || []), ...extra.map(p=>p.img)])];
  });
  // Keep the first 12 stages paced for a 20-stage / Lv 99 final chain.
  Object.entries(V118_STAGE_LEVEL_REQS).forEach(([key,req])=>{ if(STAGE_DEFS[key]) STAGE_DEFS[key].levelReq=req; });

  loadImages(); bind(); applySettings(); applyOperatorVisuals(); boot(); startAutosave(); renderAll();
})();
