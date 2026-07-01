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
    'Version 0.6.0 // CHAPTER FLOW',
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
  const BUILD_VERSION = '0.6.0';
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

    play(src, volume=this.volume){
      if(!src) return;
      AudioManager.unlock();
      try{
        const base = this.cache[src] || new Audio(`${src}?v=${BUILD_VERSION}`);
        const a = base.cloneNode(true);
        a.volume = Math.max(0, Math.min(1, volume));
        a.play().catch(()=>{});
      }catch(err){}
    },

    step(){
      const now = performance.now();
      if(now - this.lastStep < 115) return;
      this.lastStep = now;
      this.play(SFX.step, 0.45);
    },

    slash(){
      const pick = SFX.slashes[Math.floor(Math.random() * SFX.slashes.length)];
      this.play(pick, 0.82);
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

  // v53: Maze-first F-001 layout. Walls are collision first, art second.
  // This replaces the wide-open test field with corridors, rooms, gates, and side paths.
  const baseMap = [
    '########################################',
    '#P....................................##',
    '###.#.###.#.#......####.###.#####.###.##',
    '#.#.......##.....C....#.#.......#.#...##',
    '#.#...S..####......##.###.......###.#.##',
    '#.#.................#.#.#....E.##...#.##',
    '#.#.#.###.###.#.#.#.#.#.#.......#.###.##',
    '#...#.....#.#.###.#...#.#.#.#...#.....##',
    '#.#####.###.#.###.#####.#.#.#.###.###.##',
    '#.....#...C.#...#...#.#...#.#...#...#.##',
    '#####.###.#.###........####.###.#####.##',
    '#...#.#...#...#.........#...#.........##',
    '###.#......##.##...##...#.###.#######.##',
    '#...#..............E....#.#.........#.##',
    '#.###L#....##.##.......##.##......#.#.##',
    '#.............#...#...#...#...#C#.#.#.##',
    '#.###.#.#######.#####.#.##........#.#.##',
    '#...#.#.......#.....#...#.......#...#.##',
    '#####.###########.#.#####..######.###.##',
    '#...#.......#...#.#.........#....E..#.##',
    '#.#.#.#####H###.##########.##......##.##',
    '#.#...#...#...#.........#.D.#.......#.##',
    '#.#####.#.#############.#........B...X##',
    '#.......#.................#...#.......##',
    '########################################'
  ];

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

  const encounterSlots = {
    '29,5': {type:'anomaly', index:0},
    '19,13': {type:'anomaly', index:6},
    '33,19': {type:'anomaly', index:14},
    '33,22': {type:'boss', index:0}
  };

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
    const slot = encounterSlots[`${x},${y}`] || (code === 'B' ? {type:'boss', index:0} : {type:'anomaly', index:0});
    if(slot.type === 'boss'){
      const creature = importedBossRoster[slot.index] || importedBossRoster[0];
      return toBattleDef(creature, displayId('BOSS', slot.index), 'boss');
    }
    const creature = importedAnomalyRoster[slot.index] || importedAnomalyRoster[0];
    return toBattleDef(creature, displayId('AN', slot.index), 'anomaly');
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

  // Reused/adapted from Cryptic Idle Worlds: RuneScape-style XP table + skill matrix.
  const xpTable = Array(100).fill(0).map((_, level) => {
    let xp = 0;
    for (let i = 1; i < level; i++) xp += Math.floor(i + 300 * Math.pow(2, i / 7));
    return Math.floor(xp / 4);
  });
  const skillList = {
    attack: { name: 'Striker Protocol', glyph: '⚔', type: 'combat', bonus: 'Better base damage and crit chance.' },
    strength: { name: 'Force Module', glyph: '◆', type: 'combat', bonus: 'Higher melee damage scaling.' },
    defense: { name: 'Barrier Matrix', glyph: '⬟', type: 'combat', bonus: 'Reduces incoming damage.' },
    magic: { name: 'Neurohex', glyph: '✦', type: 'combat', bonus: 'Improves EP efficiency and protocol damage.' },
    ranged: { name: 'Synapsis Bowline', glyph: '⌁', type: 'combat', bonus: 'Improves dodge chance and precision.' },
    slayer: { name: 'Anomaly Hunting', glyph: '☠', type: 'noncombat', bonus: 'Tracks creature takedowns.' },
    cryptomining: { name: 'Cryptomining', glyph: '◈', type: 'noncombat', bonus: 'Future resource loop.' },
    datafishing: { name: 'Datafishing', glyph: '≈', type: 'noncombat', bonus: 'Future data recovery loop.' },
    codecraft: { name: 'Codecraft', glyph: '⌬', type: 'noncombat', bonus: 'Future crafting loop.' },
    forgenetics: { name: 'Forgentics', glyph: '✚', type: 'noncombat', bonus: 'Future bio-upgrade loop.' },
    system_hacking: { name: 'System Hacking', glyph: '⌁', type: 'noncombat', bonus: 'Future terminal loop.' }
  };
  function createSkillData(){
    const data = {};
    Object.keys(skillList).forEach(k => data[k] = { xp: 0, level: 1 });
    return data;
  }
  function ensureProgression(){
    if(!state.skillData) state.skillData = createSkillData();
    Object.keys(skillList).forEach(k => state.skillData[k] ||= {xp:0,level:1});
    state.combatStyle ||= 'attack';
    ensureStoryFlags();
  }
  function ensureStoryFlags(){
    state.flags ||= {};
    state.flags.storySeen ||= {};
    state.flags.bossDefeated ||= false;
    state.flags.chapterRewardsClaimed ||= false;
    state.flags.chapterClearSeen ||= false;
  }
  function grantStyleXp(style, xp){
    ensureProgression();
    const data = state.skillData[style] || (state.skillData[style] = {xp:0,level:1});
    data.xp += xp;
    for(let lvl=1; lvl<=99; lvl++){
      if(data.xp >= xpTable[lvl] && data.level < lvl){
        data.level = lvl;
        const skillName = skillList[style]?.name || style;
        log(`${skillName} reached Lv. ${lvl}.`);
        toast(`${skillName} Lv. ${lvl}`);
      }
    }
  }
  function stylePercent(k){
    ensureProgression();
    const d = state.skillData[k] || {xp:0,level:1};
    const next = xpTable[d.level + 1] || xpTable[99] || 1;
    const prev = xpTable[d.level] || 0;
    return Math.max(0, Math.min(100, ((d.xp - prev) / Math.max(1, next - prev)) * 100));
  }
  function setCombatStyle(k){ ensureProgression(); state.combatStyle = k; renderProgressionDb(); renderUI(); toast(`Training focus: ${skillList[k].name}`); }

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


  const coreItemRegistry = [
    {id:'IT-001', name:'Med Patch', type:'Consumable', category:'Medical', slot:'Quick Use', rarity:'Common', stackSize:99, sellPrice:8, asset:'assets/items/med_patch.png', source:'assets/source/items/med_patch.png', status:'production-icon', desc:'Emergency field patch. Restores 25 HP.'},
    {id:'IT-002', name:'Scrap Metal', type:'Material', category:'Crafting', slot:'Stack', rarity:'Common', stackSize:999, sellPrice:2, asset:'assets/items/scrap_metal.png', source:'assets/source/items/scrap_metal.png', status:'production-icon', desc:'Recovered industrial scrap used for upgrades.'},
    {id:'IT-003', name:'Corrupted Catalyst', type:'Material', category:'Catalyst', slot:'Stack', rarity:'Epic', stackSize:99, sellPrice:40, asset:'assets/items/corrupted_catalyst.png', source:'assets/source/items/corrupted_catalyst.png', status:'production-icon', desc:'Unstable upgrade material pulled from corrupted systems.'},
    {id:'IT-004', name:'Keycard LV1', type:'Key Item', category:'Access', slot:'Story', rarity:'Uncommon', stackSize:1, sellPrice:0, asset:'assets/items/keycard_lv1.png', source:'assets/source/items/keycard_lv1.png', status:'production-icon', desc:'Level-one access credential for sealed maintenance zones.'},
    {id:'IT-005', name:'Archive Log 001', type:'Archive', category:'Lore', slot:'Database', rarity:'Rare', stackSize:1, sellPrice:0, asset:'assets/items/archive_log_001.png', source:'assets/source/items/archive_log_001.png', status:'production-icon', desc:'Recovered classified AVOS archive fragment.'},
    {id:'IT-006', name:'Operator Shard: Vyra', type:'Shard', category:'Operator', slot:'Recruitment', rarity:'Legendary', stackSize:999, sellPrice:75, asset:'assets/items/operator_shard_vyra.png', source:'assets/source/items/operator_shard_vyra.png', status:'production-icon', desc:'A synchronization shard keyed to Operator AV-001.'},
    {id:'IT-007', name:'Rust Core', type:'Material', category:'Anomaly Core', slot:'Stack', rarity:'Rare', stackSize:99, sellPrice:25, asset:'assets/items/rust_core.png', source:'assets/source/items/rust_core.png', status:'production-icon', desc:'Dense anomaly core used in future crafting and operator growth.'}
  ];

  const importedItemRegistry = [{"id":"IT-1001","name":"Common Cape","type":"Equipment","category":"Armor","slot":"Cape","rarity":"Common","stackSize":1,"sellPrice":5,"asset":"assets/items/imported/armor/cape/common/it-1001_cape_common.png","status":"placeholder-art"},{"id":"IT-1002","name":"Epic Cape","type":"Equipment","category":"Armor","slot":"Cape","rarity":"Epic","stackSize":1,"sellPrice":40,"asset":"assets/items/imported/armor/cape/epic/it-1002_cape_epic.png","status":"placeholder-art"},{"id":"IT-1003","name":"Legendary Cape","type":"Equipment","category":"Armor","slot":"Cape","rarity":"Legendary","stackSize":1,"sellPrice":80,"asset":"assets/items/imported/armor/cape/legendary/it-1003_cape_legendary.png","status":"placeholder-art"},{"id":"IT-1004","name":"Mythic Cape","type":"Equipment","category":"Armor","slot":"Cape","rarity":"Mythic","stackSize":1,"sellPrice":160,"asset":"assets/items/imported/armor/cape/mythic/it-1004_cape_mythic.png","status":"placeholder-art"},{"id":"IT-1005","name":"Rare Cape","type":"Equipment","category":"Armor","slot":"Cape","rarity":"Rare","stackSize":1,"sellPrice":20,"asset":"assets/items/imported/armor/cape/rare/it-1005_cape_rare.png","status":"placeholder-art"},{"id":"IT-1006","name":"Uncommon Cape","type":"Equipment","category":"Armor","slot":"Cape","rarity":"Uncommon","stackSize":1,"sellPrice":10,"asset":"assets/items/imported/armor/cape/uncommon/it-1006_cape_uncommon.png","status":"placeholder-art"},{"id":"IT-1007","name":"Common Chest","type":"Equipment","category":"Armor","slot":"Chest","rarity":"Common","stackSize":1,"sellPrice":5,"asset":"assets/items/imported/armor/chest/common/it-1007_chest_common.png","status":"placeholder-art"},{"id":"IT-1008","name":"Epic Chest","type":"Equipment","category":"Armor","slot":"Chest","rarity":"Epic","stackSize":1,"sellPrice":40,"asset":"assets/items/imported/armor/chest/epic/it-1008_chest_epic.png","status":"placeholder-art"},{"id":"IT-1009","name":"Legendary Chest","type":"Equipment","category":"Armor","slot":"Chest","rarity":"Legendary","stackSize":1,"sellPrice":80,"asset":"assets/items/imported/armor/chest/legendary/it-1009_chest_legendary.png","status":"placeholder-art"},{"id":"IT-1010","name":"Mythic Chest","type":"Equipment","category":"Armor","slot":"Chest","rarity":"Mythic","stackSize":1,"sellPrice":160,"asset":"assets/items/imported/armor/chest/mythic/it-1010_chest_mythic.png","status":"placeholder-art"},{"id":"IT-1011","name":"Rare Chest","type":"Equipment","category":"Armor","slot":"Chest","rarity":"Rare","stackSize":1,"sellPrice":20,"asset":"assets/items/imported/armor/chest/rare/it-1011_chest_rare.png","status":"placeholder-art"},{"id":"IT-1012","name":"Uncommon Chest","type":"Equipment","category":"Armor","slot":"Chest","rarity":"Uncommon","stackSize":1,"sellPrice":10,"asset":"assets/items/imported/armor/chest/uncommon/it-1012_chest_uncommon.png","status":"placeholder-art"},{"id":"IT-1013","name":"Common Gloves","type":"Equipment","category":"Armor","slot":"Gloves","rarity":"Common","stackSize":1,"sellPrice":5,"asset":"assets/items/imported/armor/gloves/common/it-1013_gloves_common.png","status":"placeholder-art"},{"id":"IT-1014","name":"Epic Gloves","type":"Equipment","category":"Armor","slot":"Gloves","rarity":"Epic","stackSize":1,"sellPrice":40,"asset":"assets/items/imported/armor/gloves/epic/it-1014_gloves_epic.png","status":"placeholder-art"},{"id":"IT-1015","name":"Legendary Gloves","type":"Equipment","category":"Armor","slot":"Gloves","rarity":"Legendary","stackSize":1,"sellPrice":80,"asset":"assets/items/imported/armor/gloves/legendary/it-1015_gloves_legendary.png","status":"placeholder-art"},{"id":"IT-1016","name":"Mythic Gloves","type":"Equipment","category":"Armor","slot":"Gloves","rarity":"Mythic","stackSize":1,"sellPrice":160,"asset":"assets/items/imported/armor/gloves/mythic/it-1016_gloves_mythic.png","status":"placeholder-art"},{"id":"IT-1017","name":"Rare Gloves","type":"Equipment","category":"Armor","slot":"Gloves","rarity":"Rare","stackSize":1,"sellPrice":20,"asset":"assets/items/imported/armor/gloves/rare/it-1017_gloves_rare.png","status":"placeholder-art"},{"id":"IT-1018","name":"Uncommon Gloves","type":"Equipment","category":"Armor","slot":"Gloves","rarity":"Uncommon","stackSize":1,"sellPrice":10,"asset":"assets/items/imported/armor/gloves/uncommon/it-1018_gloves_uncommon.png","status":"placeholder-art"},{"id":"IT-1019","name":"Common Helm","type":"Equipment","category":"Armor","slot":"Helm","rarity":"Common","stackSize":1,"sellPrice":5,"asset":"assets/items/imported/armor/helm/common/it-1019_helm_common.png","status":"placeholder-art"},{"id":"IT-1020","name":"Epic Helm","type":"Equipment","category":"Armor","slot":"Helm","rarity":"Epic","stackSize":1,"sellPrice":40,"asset":"assets/items/imported/armor/helm/epic/it-1020_helm_epic.png","status":"placeholder-art"},{"id":"IT-1021","name":"Legendary Helm","type":"Equipment","category":"Armor","slot":"Helm","rarity":"Legendary","stackSize":1,"sellPrice":80,"asset":"assets/items/imported/armor/helm/legendary/it-1021_helm_legendary.png","status":"placeholder-art"},{"id":"IT-1022","name":"Mythic Helm","type":"Equipment","category":"Armor","slot":"Helm","rarity":"Mythic","stackSize":1,"sellPrice":160,"asset":"assets/items/imported/armor/helm/mythic/it-1022_helm_mythic.png","status":"placeholder-art"},{"id":"IT-1023","name":"Rare Helm","type":"Equipment","category":"Armor","slot":"Helm","rarity":"Rare","stackSize":1,"sellPrice":20,"asset":"assets/items/imported/armor/helm/rare/it-1023_helm_rare.png","status":"placeholder-art"},{"id":"IT-1024","name":"Uncommon Helm","type":"Equipment","category":"Armor","slot":"Helm","rarity":"Uncommon","stackSize":1,"sellPrice":10,"asset":"assets/items/imported/armor/helm/uncommon/it-1024_helm_uncommon.png","status":"placeholder-art"},{"id":"IT-1025","name":"Common Legs","type":"Equipment","category":"Armor","slot":"Legs","rarity":"Common","stackSize":1,"sellPrice":5,"asset":"assets/items/imported/armor/legs/common/it-1025_legs_common.png","status":"placeholder-art"},{"id":"IT-1026","name":"Epic Legs","type":"Equipment","category":"Armor","slot":"Legs","rarity":"Epic","stackSize":1,"sellPrice":40,"asset":"assets/items/imported/armor/legs/epic/it-1026_legs_epic.png","status":"placeholder-art"},{"id":"IT-1027","name":"Legendary Legs","type":"Equipment","category":"Armor","slot":"Legs","rarity":"Legendary","stackSize":1,"sellPrice":80,"asset":"assets/items/imported/armor/legs/legendary/it-1027_legs_legendary.png","status":"placeholder-art"},{"id":"IT-1028","name":"Mythic Legs","type":"Equipment","category":"Armor","slot":"Legs","rarity":"Mythic","stackSize":1,"sellPrice":160,"asset":"assets/items/imported/armor/legs/mythic/it-1028_legs_mythic.png","status":"placeholder-art"},{"id":"IT-1029","name":"Rare Legs","type":"Equipment","category":"Armor","slot":"Legs","rarity":"Rare","stackSize":1,"sellPrice":20,"asset":"assets/items/imported/armor/legs/rare/it-1029_legs_rare.png","status":"placeholder-art"},{"id":"IT-1030","name":"Uncommon Legs","type":"Equipment","category":"Armor","slot":"Legs","rarity":"Uncommon","stackSize":1,"sellPrice":10,"asset":"assets/items/imported/armor/legs/uncommon/it-1030_legs_uncommon.png","status":"placeholder-art"},{"id":"IT-1031","name":"Common Neckless","type":"Equipment","category":"Armor","slot":"Neckless","rarity":"Common","stackSize":1,"sellPrice":5,"asset":"assets/items/imported/armor/neckless/common/it-1031_neckless_common.png","status":"placeholder-art"},{"id":"IT-1032","name":"Epic Neckless","type":"Equipment","category":"Armor","slot":"Neckless","rarity":"Epic","stackSize":1,"sellPrice":40,"asset":"assets/items/imported/armor/neckless/epic/it-1032_neckless_epic.png","status":"placeholder-art"},{"id":"IT-1033","name":"Legendary Neckless","type":"Equipment","category":"Armor","slot":"Neckless","rarity":"Legendary","stackSize":1,"sellPrice":80,"asset":"assets/items/imported/armor/neckless/legendary/it-1033_neckless_legendary.png","status":"placeholder-art"},{"id":"IT-1034","name":"Mythic Neckless","type":"Equipment","category":"Armor","slot":"Neckless","rarity":"Mythic","stackSize":1,"sellPrice":160,"asset":"assets/items/imported/armor/neckless/mythic/it-1034_neckless_mythic.png","status":"placeholder-art"},{"id":"IT-1035","name":"Rare Neckless","type":"Equipment","category":"Armor","slot":"Neckless","rarity":"Rare","stackSize":1,"sellPrice":20,"asset":"assets/items/imported/armor/neckless/rare/it-1035_neckless_rare.png","status":"placeholder-art"},{"id":"IT-1036","name":"Uncommon Neckless","type":"Equipment","category":"Armor","slot":"Neckless","rarity":"Uncommon","stackSize":1,"sellPrice":10,"asset":"assets/items/imported/armor/neckless/uncommon/it-1036_neckless_uncommon.png","status":"placeholder-art"},{"id":"IT-1037","name":"Common Ring","type":"Equipment","category":"Armor","slot":"Ring","rarity":"Common","stackSize":1,"sellPrice":5,"asset":"assets/items/imported/armor/ring/common/it-1037_ring_common.png","status":"placeholder-art"},{"id":"IT-1038","name":"Epic Ring","type":"Equipment","category":"Armor","slot":"Ring","rarity":"Epic","stackSize":1,"sellPrice":40,"asset":"assets/items/imported/armor/ring/epic/it-1038_ring_epic.png","status":"placeholder-art"},{"id":"IT-1039","name":"Legendary Ring","type":"Equipment","category":"Armor","slot":"Ring","rarity":"Legendary","stackSize":1,"sellPrice":80,"asset":"assets/items/imported/armor/ring/legendary/it-1039_ring_legendary.png","status":"placeholder-art"},{"id":"IT-1040","name":"Mythic Ring","type":"Equipment","category":"Armor","slot":"Ring","rarity":"Mythic","stackSize":1,"sellPrice":160,"asset":"assets/items/imported/armor/ring/mythic/it-1040_ring_mythic.png","status":"placeholder-art"},{"id":"IT-1041","name":"Rare Ring","type":"Equipment","category":"Armor","slot":"Ring","rarity":"Rare","stackSize":1,"sellPrice":20,"asset":"assets/items/imported/armor/ring/rare/it-1041_ring_rare.png","status":"placeholder-art"},{"id":"IT-1042","name":"Uncommon Ring","type":"Equipment","category":"Armor","slot":"Ring","rarity":"Uncommon","stackSize":1,"sellPrice":10,"asset":"assets/items/imported/armor/ring/uncommon/it-1042_ring_uncommon.png","status":"placeholder-art"},{"id":"IT-1043","name":"Bread","type":"Consumable","category":"Consumables","slot":"Consumables","rarity":"Common","stackSize":999,"sellPrice":5,"asset":"assets/items/imported/consumables/consumables/common/it-1043_bread.png","status":"production-art"},{"id":"IT-1044","name":"Ashthorn Dagger","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Common","stackSize":1,"sellPrice":5,"asset":"assets/items/imported/weapons/weapons/common/it-1044_ashthorn_dagger.png","status":"production-art"},{"id":"IT-1045","name":"Blightweave Staff","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Common","stackSize":1,"sellPrice":5,"asset":"assets/items/imported/weapons/weapons/common/it-1045_blightweave_staff.png","status":"production-art"},{"id":"IT-1046","name":"Bloodrot Sword","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Common","stackSize":1,"sellPrice":5,"asset":"assets/items/imported/weapons/weapons/common/it-1046_bloodrot_sword.png","status":"production-art"},{"id":"IT-1047","name":"Cinderbite Dagger","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Common","stackSize":1,"sellPrice":5,"asset":"assets/items/imported/weapons/weapons/common/it-1047_cinderbite_dagger.png","status":"production-art"},{"id":"IT-1048","name":"Deathbloom Staff","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Common","stackSize":1,"sellPrice":5,"asset":"assets/items/imported/weapons/weapons/common/it-1048_deathbloom_staff.png","status":"production-art"},{"id":"IT-1049","name":"Duskbranch Staff","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Common","stackSize":1,"sellPrice":5,"asset":"assets/items/imported/weapons/weapons/common/it-1049_duskbranch_staff.png","status":"production-art"},{"id":"IT-1050","name":"Duskfang Blade","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Common","stackSize":1,"sellPrice":5,"asset":"assets/items/imported/weapons/weapons/common/it-1050_duskfang_blade.png","status":"production-art"},{"id":"IT-1051","name":"Embercrack Axe","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Common","stackSize":1,"sellPrice":5,"asset":"assets/items/imported/weapons/weapons/common/it-1051_embercrack_axe.png","status":"production-art"},{"id":"IT-1052","name":"Frostbite Blade","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Common","stackSize":1,"sellPrice":5,"asset":"assets/items/imported/weapons/weapons/common/it-1052_frostbite_blade.png","status":"production-art"},{"id":"IT-1053","name":"Gloomroot Bow","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Common","stackSize":1,"sellPrice":5,"asset":"assets/items/imported/weapons/weapons/common/it-1053_gloomroot_bow.png","status":"production-art"},{"id":"IT-1054","name":"Gloomspire Scepter","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Common","stackSize":1,"sellPrice":5,"asset":"assets/items/imported/weapons/weapons/common/it-1054_gloomspire_scepter.png","status":"production-art"},{"id":"IT-1055","name":"Gravemarrow Spear","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Common","stackSize":1,"sellPrice":5,"asset":"assets/items/imported/weapons/weapons/common/it-1055_gravemarrow_spear.png","status":"production-art"},{"id":"IT-1056","name":"Gravethorn Warblade","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Common","stackSize":1,"sellPrice":5,"asset":"assets/items/imported/weapons/weapons/common/it-1056_gravethorn_warblade.png","status":"production-art"},{"id":"IT-1057","name":"Marshfang Dagger","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Common","stackSize":1,"sellPrice":5,"asset":"assets/items/imported/weapons/weapons/common/it-1057_marshfang_dagger.png","status":"production-art"},{"id":"IT-1058","name":"Mirefang Spear","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Common","stackSize":1,"sellPrice":5,"asset":"assets/items/imported/weapons/weapons/common/it-1058_mirefang_spear.png","status":"production-art"},{"id":"IT-1059","name":"Mirewood Staff","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Common","stackSize":1,"sellPrice":5,"asset":"assets/items/imported/weapons/weapons/common/it-1059_mirewood_staff.png","status":"production-art"},{"id":"IT-1060","name":"Nightthorn Bow","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Common","stackSize":1,"sellPrice":5,"asset":"assets/items/imported/weapons/weapons/common/it-1060_nightthorn_bow.png","status":"production-art"},{"id":"IT-1061","name":"Plaguefang Claw","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Common","stackSize":1,"sellPrice":5,"asset":"assets/items/imported/weapons/weapons/common/it-1061_plaguefang_claw.png","status":"production-art"},{"id":"IT-1062","name":"Shardstone Mace","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Common","stackSize":1,"sellPrice":5,"asset":"assets/items/imported/weapons/weapons/common/it-1062_shardstone_mace.png","status":"production-art"},{"id":"IT-1063","name":"Smogcoil Whip","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Common","stackSize":1,"sellPrice":5,"asset":"assets/items/imported/weapons/weapons/common/it-1063_smogcoil_whip.png","status":"production-art"},{"id":"IT-1064","name":"Sootveil Blade","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Common","stackSize":1,"sellPrice":5,"asset":"assets/items/imported/weapons/weapons/common/it-1064_sootveil_blade.png","status":"production-art"},{"id":"IT-1065","name":"Soulshard Wand","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Common","stackSize":1,"sellPrice":5,"asset":"assets/items/imported/weapons/weapons/common/it-1065_soulshard_wand.png","status":"production-art"},{"id":"IT-1066","name":"Soulspike Dagger","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Common","stackSize":1,"sellPrice":5,"asset":"assets/items/imported/weapons/weapons/common/it-1066_soulspike_dagger.png","status":"production-art"},{"id":"IT-1067","name":"Thornrend Axe","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Common","stackSize":1,"sellPrice":5,"asset":"assets/items/imported/weapons/weapons/common/it-1067_thornrend_axe.png","status":"production-art"},{"id":"IT-1068","name":"Thornslicer Saber","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Common","stackSize":1,"sellPrice":5,"asset":"assets/items/imported/weapons/weapons/common/it-1068_thornslicer_saber.png","status":"production-art"},{"id":"IT-1069","name":"Bloodshard Warhammer","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Epic","stackSize":1,"sellPrice":40,"asset":"assets/items/imported/weapons/weapons/epic/it-1069_bloodshard_warhammer.png","status":"production-art"},{"id":"IT-1070","name":"Duskdrift Longbow","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Epic","stackSize":1,"sellPrice":40,"asset":"assets/items/imported/weapons/weapons/epic/it-1070_duskdrift_longbow.png","status":"production-art"},{"id":"IT-1071","name":"Duskspire Catalyst","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Epic","stackSize":1,"sellPrice":40,"asset":"assets/items/imported/weapons/weapons/epic/it-1071_duskspire_catalyst.png","status":"production-art"},{"id":"IT-1072","name":"Emberwrath Crossbow","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Epic","stackSize":1,"sellPrice":40,"asset":"assets/items/imported/weapons/weapons/epic/it-1072_emberwrath_crossbow.png","status":"production-art"},{"id":"IT-1073","name":"Gloomthorn Warblade","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Epic","stackSize":1,"sellPrice":40,"asset":"assets/items/imported/weapons/weapons/epic/it-1073_gloomthorn_warblade.png","status":"production-art"},{"id":"IT-1074","name":"Gravetide Pike","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Epic","stackSize":1,"sellPrice":40,"asset":"assets/items/imported/weapons/weapons/epic/it-1074_gravetide_pike.png","status":"production-art"},{"id":"IT-1075","name":"Mirethorn Greatblade","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Epic","stackSize":1,"sellPrice":40,"asset":"assets/items/imported/weapons/weapons/epic/it-1075_mirethorn_greatblade.png","status":"production-art"},{"id":"IT-1076","name":"Plaguewrought Glaive","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Epic","stackSize":1,"sellPrice":40,"asset":"assets/items/imported/weapons/weapons/epic/it-1076_plaguewrought_glaive.png","status":"production-art"},{"id":"IT-1077","name":"Shardrift Longspear","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Epic","stackSize":1,"sellPrice":40,"asset":"assets/items/imported/weapons/weapons/epic/it-1077_shardrift_longspear.png","status":"production-art"},{"id":"IT-1078","name":"Soulflare Bow","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Epic","stackSize":1,"sellPrice":40,"asset":"assets/items/imported/weapons/weapons/epic/it-1078_soulflare_bow.png","status":"production-art"},{"id":"IT-1079","name":"Soulreaver Scythe","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Epic","stackSize":1,"sellPrice":40,"asset":"assets/items/imported/weapons/weapons/epic/it-1079_soulreaver_scythe.png","status":"production-art"},{"id":"IT-1080","name":"Soulshatter Claws","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Epic","stackSize":1,"sellPrice":40,"asset":"assets/items/imported/weapons/weapons/epic/it-1080_soulshatter_claws.png","status":"production-art"},{"id":"IT-1081","name":"Venomspire Spear","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Epic","stackSize":1,"sellPrice":40,"asset":"assets/items/imported/weapons/weapons/epic/it-1081_venomspire_spear.png","status":"production-art"},{"id":"IT-1082","name":"Voidcarver Blade","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Epic","stackSize":1,"sellPrice":40,"asset":"assets/items/imported/weapons/weapons/epic/it-1082_voidcarver_blade.png","status":"production-art"},{"id":"IT-1083","name":"Wraithvine Staff","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Epic","stackSize":1,"sellPrice":40,"asset":"assets/items/imported/weapons/weapons/epic/it-1083_wraithvine_staff.png","status":"production-art"},{"id":"IT-1084","name":"Ashvenom Saber","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Legendary","stackSize":1,"sellPrice":80,"asset":"assets/items/imported/weapons/weapons/legendary/it-1084_ashvenom_saber.png","status":"production-art"},{"id":"IT-1085","name":"Bloodspire Blade","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Legendary","stackSize":1,"sellPrice":80,"asset":"assets/items/imported/weapons/weapons/legendary/it-1085_bloodspire_blade.png","status":"production-art"},{"id":"IT-1086","name":"Duskfang Scythe","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Legendary","stackSize":1,"sellPrice":80,"asset":"assets/items/imported/weapons/weapons/legendary/it-1086_duskfang_scythe.png","status":"production-art"},{"id":"IT-1087","name":"Duskthorn Pike","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Legendary","stackSize":1,"sellPrice":80,"asset":"assets/items/imported/weapons/weapons/legendary/it-1087_duskthorn_pike.png","status":"production-art"},{"id":"IT-1088","name":"Gravemarrow Halberd","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Legendary","stackSize":1,"sellPrice":80,"asset":"assets/items/imported/weapons/weapons/legendary/it-1088_gravemarrow_halberd.png","status":"production-art"},{"id":"IT-1089","name":"Soulforge Staff","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Legendary","stackSize":1,"sellPrice":80,"asset":"assets/items/imported/weapons/weapons/legendary/it-1089_soulforge_staff.png","status":"production-art"},{"id":"IT-1090","name":"Soulrend Longbow","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Legendary","stackSize":1,"sellPrice":80,"asset":"assets/items/imported/weapons/weapons/legendary/it-1090_soulrend_longbow.png","status":"production-art"},{"id":"IT-1091","name":"Voidheart Greataxe","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Legendary","stackSize":1,"sellPrice":80,"asset":"assets/items/imported/weapons/weapons/legendary/it-1091_voidheart_greataxe.png","status":"production-art"},{"id":"IT-1092","name":"Voidlash Crossbow","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Legendary","stackSize":1,"sellPrice":80,"asset":"assets/items/imported/weapons/weapons/legendary/it-1092_voidlash_crossbow.png","status":"production-art"},{"id":"IT-1093","name":"Wraithbound Blades","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Legendary","stackSize":1,"sellPrice":80,"asset":"assets/items/imported/weapons/weapons/legendary/it-1093_wraithbound_blades.png","status":"production-art"},{"id":"IT-1094","name":"Ashbreaker Pike","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Mythic","stackSize":1,"sellPrice":160,"asset":"assets/items/imported/weapons/weapons/mythic/it-1094_ashbreaker_pike.png","status":"production-art"},{"id":"IT-1095","name":"Duskveil Longbow","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Mythic","stackSize":1,"sellPrice":160,"asset":"assets/items/imported/weapons/weapons/mythic/it-1095_duskveil_longbow.png","status":"production-art"},{"id":"IT-1096","name":"Gravemind Scepter","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Mythic","stackSize":1,"sellPrice":160,"asset":"assets/items/imported/weapons/weapons/mythic/it-1096_gravemind_scepter.png","status":"production-art"},{"id":"IT-1097","name":"Shardking Blade","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Mythic","stackSize":1,"sellPrice":160,"asset":"assets/items/imported/weapons/weapons/mythic/it-1097_shardking_blade.png","status":"production-art"},{"id":"IT-1098","name":"Smolderthorn Glaive","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Mythic","stackSize":1,"sellPrice":160,"asset":"assets/items/imported/weapons/weapons/mythic/it-1098_smolderthorn_glaive.png","status":"production-art"},{"id":"IT-1099","name":"Soulreign Bow","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Mythic","stackSize":1,"sellPrice":160,"asset":"assets/items/imported/weapons/weapons/mythic/it-1099_soulreign_bow.png","status":"production-art"},{"id":"IT-1100","name":"Soulshatter Greatblade","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Mythic","stackSize":1,"sellPrice":160,"asset":"assets/items/imported/weapons/weapons/mythic/it-1100_soulshatter_greatblade.png","status":"production-art"},{"id":"IT-1101","name":"Voidborne Scythe","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Mythic","stackSize":1,"sellPrice":160,"asset":"assets/items/imported/weapons/weapons/mythic/it-1101_voidborne_scythe.png","status":"production-art"},{"id":"IT-1102","name":"Voidrend Warhammer","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Mythic","stackSize":1,"sellPrice":160,"asset":"assets/items/imported/weapons/weapons/mythic/it-1102_voidrend_warhammer.png","status":"production-art"},{"id":"IT-1103","name":"Wraithforged Twinblades","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Mythic","stackSize":1,"sellPrice":160,"asset":"assets/items/imported/weapons/weapons/mythic/it-1103_wraithforged_twinblades.png","status":"production-art"},{"id":"IT-1104","name":"Ashdrift Longspear","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Rare","stackSize":1,"sellPrice":20,"asset":"assets/items/imported/weapons/weapons/rare/it-1104_ashdrift_longspear.png","status":"production-art"},{"id":"IT-1105","name":"Ashgloom Warblade","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Rare","stackSize":1,"sellPrice":20,"asset":"assets/items/imported/weapons/weapons/rare/it-1105_ashgloom_warblade.png","status":"production-art"},{"id":"IT-1106","name":"Bloodcurse Wand","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Rare","stackSize":1,"sellPrice":20,"asset":"assets/items/imported/weapons/weapons/rare/it-1106_bloodcurse_wand.png","status":"production-art"},{"id":"IT-1107","name":"Bloodveil Greataxe","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Rare","stackSize":1,"sellPrice":20,"asset":"assets/items/imported/weapons/weapons/rare/it-1107_bloodveil_greataxe.png","status":"production-art"},{"id":"IT-1108","name":"Duskhowl Blade","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Rare","stackSize":1,"sellPrice":20,"asset":"assets/items/imported/weapons/weapons/rare/it-1108_duskhowl_blade.png","status":"production-art"},{"id":"IT-1109","name":"Duskshard Glaive","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Rare","stackSize":1,"sellPrice":20,"asset":"assets/items/imported/weapons/weapons/rare/it-1109_duskshard_glaive.png","status":"production-art"},{"id":"IT-1110","name":"Duskthorn Longbow","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Rare","stackSize":1,"sellPrice":20,"asset":"assets/items/imported/weapons/weapons/rare/it-1110_duskthorn_longbow.png","status":"production-art"},{"id":"IT-1111","name":"Embershard Crossbow","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Rare","stackSize":1,"sellPrice":20,"asset":"assets/items/imported/weapons/weapons/rare/it-1111_embershard_crossbow.png","status":"production-art"},{"id":"IT-1112","name":"Gravemist Scythe","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Rare","stackSize":1,"sellPrice":20,"asset":"assets/items/imported/weapons/weapons/rare/it-1112_gravemist_scythe.png","status":"production-art"},{"id":"IT-1113","name":"Gravethorn Cleaver","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Rare","stackSize":1,"sellPrice":20,"asset":"assets/items/imported/weapons/weapons/rare/it-1113_gravethorn_cleaver.png","status":"production-art"},{"id":"IT-1114","name":"Mirefang Longsword","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Rare","stackSize":1,"sellPrice":20,"asset":"assets/items/imported/weapons/weapons/rare/it-1114_mirefang_longsword.png","status":"production-art"},{"id":"IT-1115","name":"Rotfang Claws","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Rare","stackSize":1,"sellPrice":20,"asset":"assets/items/imported/weapons/weapons/rare/it-1115_rotfang_claws.png","status":"production-art"},{"id":"IT-1116","name":"Shatterspike Blade","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Rare","stackSize":1,"sellPrice":20,"asset":"assets/items/imported/weapons/weapons/rare/it-1116_shatterspike_blade.png","status":"production-art"},{"id":"IT-1117","name":"Soulbind Bow","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Rare","stackSize":1,"sellPrice":20,"asset":"assets/items/imported/weapons/weapons/rare/it-1117_soulbind_bow.png","status":"production-art"},{"id":"IT-1118","name":"Soulpiercer Longbow","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Rare","stackSize":1,"sellPrice":20,"asset":"assets/items/imported/weapons/weapons/rare/it-1118_soulpiercer_longbow.png","status":"production-art"},{"id":"IT-1119","name":"Soulshard Catalyst","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Rare","stackSize":1,"sellPrice":20,"asset":"assets/items/imported/weapons/weapons/rare/it-1119_soulshard_catalyst.png","status":"production-art"},{"id":"IT-1120","name":"Venomspire Pike","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Rare","stackSize":1,"sellPrice":20,"asset":"assets/items/imported/weapons/weapons/rare/it-1120_venomspire_pike.png","status":"production-art"},{"id":"IT-1121","name":"Venomthorn Saber","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Rare","stackSize":1,"sellPrice":20,"asset":"assets/items/imported/weapons/weapons/rare/it-1121_venomthorn_saber.png","status":"production-art"},{"id":"IT-1122","name":"Voidreaver Blade","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Rare","stackSize":1,"sellPrice":20,"asset":"assets/items/imported/weapons/weapons/rare/it-1122_voidreaver_blade.png","status":"production-art"},{"id":"IT-1123","name":"Wraithbone Staff","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Rare","stackSize":1,"sellPrice":20,"asset":"assets/items/imported/weapons/weapons/rare/it-1123_wraithbone_staff.png","status":"production-art"},{"id":"IT-1124","name":"Ashwrought Greataxe","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Uncommon","stackSize":1,"sellPrice":10,"asset":"assets/items/imported/weapons/weapons/uncommon/it-1124_ashwrought_greataxe.png","status":"production-art"},{"id":"IT-1125","name":"Blightthorn Bow","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Uncommon","stackSize":1,"sellPrice":10,"asset":"assets/items/imported/weapons/weapons/uncommon/it-1125_blightthorn_bow.png","status":"production-art"},{"id":"IT-1126","name":"Bloodthorn Longbow","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Uncommon","stackSize":1,"sellPrice":10,"asset":"assets/items/imported/weapons/weapons/uncommon/it-1126_bloodthorn_longbow.png","status":"production-art"},{"id":"IT-1127","name":"Cinderspine Crossbow","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Uncommon","stackSize":1,"sellPrice":10,"asset":"assets/items/imported/weapons/weapons/uncommon/it-1127_cinderspine_crossbow.png","status":"production-art"},{"id":"IT-1128","name":"Cryptvine Bow","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Uncommon","stackSize":1,"sellPrice":10,"asset":"assets/items/imported/weapons/weapons/uncommon/it-1128_cryptvine_bow.png","status":"production-art"},{"id":"IT-1129","name":"Duskchill Knife","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Uncommon","stackSize":1,"sellPrice":10,"asset":"assets/items/imported/weapons/weapons/uncommon/it-1129_duskchill_knife.png","status":"production-art"},{"id":"IT-1130","name":"Duskroot Wand","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Uncommon","stackSize":1,"sellPrice":10,"asset":"assets/items/imported/weapons/weapons/uncommon/it-1130_duskroot_wand.png","status":"production-art"},{"id":"IT-1131","name":"Duskveil Glaive","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Uncommon","stackSize":1,"sellPrice":10,"asset":"assets/items/imported/weapons/weapons/uncommon/it-1131_duskveil_glaive.png","status":"production-art"},{"id":"IT-1132","name":"Emberfang Dagger","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Uncommon","stackSize":1,"sellPrice":10,"asset":"assets/items/imported/weapons/weapons/uncommon/it-1132_emberfang_dagger.png","status":"production-art"},{"id":"IT-1133","name":"Gravemind Flail","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Uncommon","stackSize":1,"sellPrice":10,"asset":"assets/items/imported/weapons/weapons/uncommon/it-1133_gravemind_flail.png","status":"production-art"},{"id":"IT-1134","name":"Gravetide Mace","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Uncommon","stackSize":1,"sellPrice":10,"asset":"assets/items/imported/weapons/weapons/uncommon/it-1134_gravetide_mace.png","status":"production-art"},{"id":"IT-1135","name":"Marrowshard Blade","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Uncommon","stackSize":1,"sellPrice":10,"asset":"assets/items/imported/weapons/weapons/uncommon/it-1135_marrowshard_blade.png","status":"production-art"},{"id":"IT-1136","name":"Mirethorn Longbow","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Uncommon","stackSize":1,"sellPrice":10,"asset":"assets/items/imported/weapons/weapons/uncommon/it-1136_mirethorn_longbow.png","status":"production-art"},{"id":"IT-1137","name":"Mireweaver Staff","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Uncommon","stackSize":1,"sellPrice":10,"asset":"assets/items/imported/weapons/weapons/uncommon/it-1137_mireweaver_staff.png","status":"production-art"},{"id":"IT-1138","name":"Plaguebite Axe","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Uncommon","stackSize":1,"sellPrice":10,"asset":"assets/items/imported/weapons/weapons/uncommon/it-1138_plaguebite_axe.png","status":"production-art"},{"id":"IT-1139","name":"Shardfang Rapier","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Uncommon","stackSize":1,"sellPrice":10,"asset":"assets/items/imported/weapons/weapons/uncommon/it-1139_shardfang_rapier.png","status":"production-art"},{"id":"IT-1140","name":"Sootcrack Warhammer","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Uncommon","stackSize":1,"sellPrice":10,"asset":"assets/items/imported/weapons/weapons/uncommon/it-1140_sootcrack_warhammer.png","status":"production-art"},{"id":"IT-1141","name":"Thornpierce Lance","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Uncommon","stackSize":1,"sellPrice":10,"asset":"assets/items/imported/weapons/weapons/uncommon/it-1141_thornpierce_lance.png","status":"production-art"},{"id":"IT-1142","name":"Voidpiercer Spear","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Uncommon","stackSize":1,"sellPrice":10,"asset":"assets/items/imported/weapons/weapons/uncommon/it-1142_voidpiercer_spear.png","status":"production-art"},{"id":"IT-1143","name":"Voidwhisper Staff","type":"Weapon","category":"Weapons","slot":"Weapons","rarity":"Uncommon","stackSize":1,"sellPrice":10,"asset":"assets/items/imported/weapons/weapons/uncommon/it-1143_voidwhisper_staff.png","status":"production-art"}];

  let state = newGameState();
  let battle = null; let camera = {x:0,y:0}; let bootDone=false; let storyActive=false; let pendingStoryAfter=null;
  const images = {};
  function newGameState(){
    const map = baseMap.map(r => r.split(''));
    let px=1,py=1;
    map.forEach((row,y)=>row.forEach((c,x)=>{if(c==='P'){px=x;py=y;map[y][x]='.';}}));
    return {mapVersion:'sector01_v2', map, player:{x:px,y:py,facing:'down',level:1,xp:0,nextXp:45,hp:60,maxHp:60,ep:20,maxEp:20,atk:10,def:3,credits:0}, inventory:{'Med Patch':2}, flags:{terminal:false,lore:false,key:false,bossUnlocked:false,bossDefeated:false,chapterComplete:false,chapterRewardsClaimed:false,chapterClearSeen:false,storySeen:{},anomaliesCleared:0,chests:0}, log:['AVOS connection established.'], visited:{}, settings:{crt:true,reducedMotion:false,largeText:false}, skillData:createSkillData(), combatStyle:'attack', lastSave:Date.now()};
  }
  function loadImages(){
    const paths = [
      'assets/operators/av001/portrait.png',
      'assets/operators/av001/battle.png',
      'assets/operators/av001/sprites/map_sprite.png',
      ...mapArt.ground,
      ...mapArt.blocked,
      mapArt.chest, mapArt.med, mapArt.lore, mapArt.terminal, mapArt.door, mapArt.exit,
      ...mapArt.props.map(p => p.img),
      ...importedAnomalyRoster.slice(0,20).flatMap(c => [c.battle, iconPathFor(c)]),
      ...importedBossRoster.slice(0,10).flatMap(c => [c.battle, iconPathFor(c)])
    ];
    [...new Set(paths)].filter(Boolean).forEach(p=>{
      const im = new Image();
      im.onload = () => renderAll();
      im.onerror = () => console.warn('Missing creature asset:', p);
      im.src = p;
      images[p] = im;
    });
  }
  function save(silent=false){localStorage.setItem('ashVectorSave', JSON.stringify(state)); state.lastSave = Date.now(); if(!silent) toast('Archive saved.'); renderUI();}
  function load(){const s=localStorage.getItem('ashVectorSave'); if(s){state=JSON.parse(s); if(state.mapVersion !== 'sector01_v2'){ const keepSettings = state.settings || {}; state = newGameState(); state.settings = {...state.settings, ...keepSettings}; toast('Map updated. Starting new Sector 01 layout.'); } ensureProgression(); state.lastSave ||= Date.now(); toast('Archive loaded.'); applySettings(); renderAll();} else toast('No archive found.');}
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
  function startGame(fresh=false){if(fresh) state=newGameState(); gameStarted=true; ensureProgression(); hideAll(); uiState.mode='game'; uiState.returnStack.length=0; document.body.classList.add('game-active','fullscreen-mode'); ensureFullscreenUi(); requestNativeFullscreen(); $('app').classList.remove('hidden'); canvas.focus({preventScroll:true}); renderAll(); AudioManager.play('level1'); if(fresh) setTimeout(()=>showStoryOnce('intro'), 320); else setTimeout(()=>pulseObjective(currentObjectiveText()), 240);}
  function hideAll(){['bootScreen','mainMenu','app'].forEach(id=>$(id)?.classList.add('hidden')); document.querySelectorAll('.overlay').forEach(o=>o.classList.add('hidden'));}
  function tileAt(x,y){return state.map[y]?.[x] ?? '#';}
  function setTile(x,y,v){if(state.map[y]) state.map[y][x]=v;}
  function isBlocked(c){return c==='#' || c==='D';}
  function tryMove(dx,dy){if(storyActive) return; if(battle) return; state.player.facing = dx>0?'right':dx<0?'left':dy<0?'up':'down'; const nx=state.player.x+dx, ny=state.player.y+dy; const c=tileAt(nx,ny); if(isBlocked(c)){if(c==='D') handleDoor(nx,ny); else toast('Blocked.'); renderAll(); return;} state.player.x=nx; state.player.y=ny; SfxManager.step(); state.visited[`${nx},${ny}`]=1; handleTile(c,nx,ny); renderAll();}
  function handleDoor(x,y){ if(state.flags.bossUnlocked || state.flags.key || state.flags.anomaliesCleared>=3){setTile(x,y,'.'); state.flags.bossUnlocked=true; log('Boss route unlocked. Door security embarrassed itself.'); renderAll();} else toast('Boss gate locked. Clear 3 anomalies or find access.'); }
  function handleTile(c,x,y){
    ensureStoryFlags();
    if(c==='C'){setTile(x,y,'.'); state.flags.chests++; addItem('Med Patch',1); addCredits(20); log('Standard Cache opened: Med Patch + 20 credits.'); pulseObjective('Cache recovered. Keep moving toward the terminal and anomaly signatures.');}
    if(c==='S'){state.flags.terminal=true; save(); log('Recovery Terminal synced your archive.'); showStoryOnce('terminal'); pulseObjective(currentObjectiveText());}
    if(c==='H'){state.player.hp=state.player.maxHp; state.player.ep=state.player.maxEp; log('Healing station restored HP/EP.'); pulseObjective('HP/EP restored. Get back in there, sewer champion.');}
    if(c==='L'){setTile(x,y,'.'); state.flags.lore=true; addItem('Archive Log 001',1); log('Recovered Archive 001: The First Vector.'); showStoryOnce('lore');}
    if(c==='E'||c==='B'){startEncounterTile(c,x,y);}
    if(c==='X'){ if(state.flags.chapterComplete){showChapterClearPanel();} else if(state.flags.bossDefeated && state.flags.bossUnlocked && state.flags.anomaliesCleared>=3){completeChapter();} else toast('Exit protocol denied. Finish the objective.');}
  }
  function startEncounterTile(code,x,y){
    ensureStoryFlags();
    if(code==='B' && !state.flags.bossUnlocked){toast('Boss route locked. Clear three anomalies first.'); return;}
    if(code==='B' && !state.flags.storySeen.bossIntro){showStoryOnce('bossIntro', () => startBattle(code,x,y)); return;}
    startBattle(code,x,y);
  }
  function addItem(name,n=1){state.inventory[name]=(state.inventory[name]||0)+n; SfxManager.item();}
  function addCredits(n){state.player.credits+=n;}

  const STORY_SCENES = {
    intro: {
      kicker:'CHAPTER 1 // THE AWAKENING', speaker:'AVOS',
      lines:['Operator AV-001 online. Memory integrity is... disgusting.', 'Vyra, you are inside Fracture 001: Toxic Sewers. Find the recovery terminal before reality finishes buffering.', 'Mission route: sync terminal, clear three anomalies, breach the boss gate, extract the Toxic Core. Try not to die in sewage. It\'s bad branding.']
    },
    terminal: {
      kicker:'RECOVERY TERMINAL // SYNCED', speaker:'VYRA',
      lines:['Archive link restored. I remember blades. I remember fire. I do not remember signing up for a sewer tour.', 'AVOS: Great news. You are cleared for violence. Three anomaly signatures are locking the boss route. Remove them. Politely, with swords.']
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
      kicker:'BOSS ENCOUNTER // TOXIC CORE', speaker:'VYRA',
      lines:['That thing is carrying the Toxic Core.', 'AVOS: Correct. Recommended tactic: hit it until the health bar experiences a personal tragedy.']
    },
    bossDefeated: {
      kicker:'TOXIC CORE RECOVERED', speaker:'AVOS',
      lines:['Boss-class entity deleted. Toxic Core stabilized.', 'Extraction route is now authorized. Head to the white exit marker before the sewer develops opinions again.']
    }
  };
  function safeHtml(v){return String(v).replace(/[&<>"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]));}
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
    $('storyKicker').textContent=scene.kicker;
    $('storySpeaker').textContent=scene.speaker;
    overlay.classList.remove('hidden');
    document.body.classList.add('story-open');
    const draw=()=>{ $('storyLine').textContent=scene.lines[i] || ''; $('storyNext').textContent = i >= scene.lines.length-1 ? 'Close' : 'Continue'; };
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
    if(!state.flags.terminal) return 'Objective: Find and sync the recovery terminal.';
    if(state.flags.anomaliesCleared < 3) return `Objective: Clear anomaly signatures (${state.flags.anomaliesCleared}/3).`;
    if(!state.flags.bossDefeated) return 'Objective: Boss route open. Defeat the Toxic Core guardian.';
    if(!state.flags.chapterComplete) return 'Objective: Extract through the white exit marker.';
    return 'Chapter 1 complete. Free exploration available.';
  }
  function pulseObjective(msg){
    if(!msg) msg=currentObjectiveText();
    const tracker=$('objectiveTracker');
    if(tracker){ tracker.classList.remove('objective-pulse'); void tracker.offsetWidth; tracker.classList.add('objective-pulse'); }
    toast(msg);
  }
  function completeChapter(){
    ensureStoryFlags();
    if(!state.flags.chapterRewardsClaimed){
      addCredits(40); addItem('Rust Core',1); addItem('Operator Shard: Vyra',3); addItem('Corrupted Catalyst',1);
      state.flags.chapterRewardsClaimed=true;
    }
    state.flags.chapterComplete=true;
    state.flags.chapterClearSeen=true;
    SfxManager.levelWin();
    log('Chapter 1 complete: Toxic Core recovered. Rewards delivered to inventory.');
    save(true); renderAll(); showChapterClearPanel();
  }
  function showChapterClearPanel(){
    let panel=$('chapterClearOverlay');
    if(!panel){
      panel=document.createElement('div');
      panel.id='chapterClearOverlay';
      panel.className='overlay chapter-clear-overlay hidden';
      panel.innerHTML=`<div class="chapter-clear-card avos-crt"><div class="record-kicker">CHAPTER COMPLETE // F-001 STABILIZED</div><h2>THE AWAKENING</h2><p>Vyra recovered the Toxic Core and survived Fracture 001. Barely. The sewer is still judging everyone involved.</p><div class="victory-loot chapter-rewards" id="chapterRewardList"></div><div class="story-actions"><button id="chapterContinueBtn">Continue Exploring</button><button id="chapterMenuBtn">Return to Main Menu</button></div></div>`;
      document.body.appendChild(panel);
      $('chapterContinueBtn').onclick=()=>{ panel.classList.add('hidden'); uiState.mode='game'; $('app').classList.remove('hidden'); AudioManager.play(activeMusicForState()); renderAll(); };
      $('chapterMenuBtn').onclick=()=>{ panel.classList.add('hidden'); gameStarted=false; showMenu(); };
    }
    const rewards=['40 Credits','Rust Core','Operator Shard: Vyra x3','Corrupted Catalyst'];
    $('chapterRewardList').innerHTML=rewards.map(name=>`<div class="victory-loot-item"><span>${safeHtml(name)}</span></div>`).join('');
    panel.classList.remove('hidden');
  }

  function startBattle(code,x,y){
    const def=JSON.parse(JSON.stringify(getEncounterDef(code,x,y)));
    battle={code,x,y,enemy:def,turn:'player',guard:false};
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
    const heroPct = Math.max(0, Math.min(100, 100*state.player.hp/state.player.maxHp));
    const epPct = Math.max(0, Math.min(100, 100*state.player.ep/state.player.maxEp));
    $('battleHp').innerHTML=`
      <div class="battle-meter enemy-meter"><div><b>${battle.enemy.name}</b><span>${battle.enemy.id || 'ANOMALY'} // HP ${battle.enemy.hp}/${battle.enemy.maxHp}</span></div><div class="bar big"><span style="width:${enemyPct}%"></span></div></div>
      <div class="battle-meter hero-meter"><div><b>Vyra</b><span>AV-001 // HP ${state.player.hp}/${state.player.maxHp}</span></div><div class="bar big"><span style="width:${heroPct}%"></span></div></div>
      <div class="battle-meter ep-meter"><div><b>Energy</b><span>EP ${state.player.ep}/${state.player.maxEp}</span></div><div class="bar big ep"><span style="width:${epPct}%"></span></div></div>
      <div class="battle-meter focus-meter"><b>Focus</b><span>${skillList[mod.focus].name} Lv. ${mod.level}</span></div>`;
    $('attackButtons').innerHTML='';
    attacks.forEach((a,i)=>{
      let b=document.createElement('button');
      const cost=Math.max(0,a.ep-mod.epDiscount);
      b.innerHTML=`<b>${a.name}</b><span>${cost?cost+' EP':'Free'} // ${a.heal?'Recovery':'Strike'}</span>`;
      b.disabled=state.player.ep<cost;
      b.onclick=()=>playerAttack(i);
      $('attackButtons').appendChild(b);
    });
  }
  function playerAttack(i){
    if(!battle||battle.turn!=='player')return;
    const a=attacks[i]; const mod=combatModifiers(); const cost=Math.max(0,a.ep-mod.epDiscount);
    if(state.player.ep<cost){toast('Not enough EP.');return;}
    state.player.ep-=cost;
    if(a.heal){
      const heal = 18+Math.floor(mod.level/4);
      state.player.hp=Math.min(state.player.maxHp,state.player.hp+heal);
      $('battleText').textContent=a.text;
      showDamage('hero', `+${heal}`, 'heal');
      grantStyleXp(mod.focus, 3);
    } else {
      SfxManager.slash();
      let crit=Math.random()<(0.15+mod.critBonus);
      let dmg=Math.max(1,a.dmg+state.player.atk-3+mod.damageBonus+(crit?8+Math.floor(mod.level/5):0));
      battle.enemy.hp=Math.max(0,battle.enemy.hp-dmg);
      $('battleText').textContent=`${a.text} ${crit?'CRITICAL ':''}-${dmg} HP. ${skillList[mod.focus].name} +${Math.max(3,Math.floor(dmg/3))} XP.`;
      showDamage('enemy', `${crit?'CRIT ':''}-${dmg}`, crit?'crit':'hit');
      flashCombatant('battleEnemy');
      shakeBattle(crit ? 420 : 260);
      grantStyleXp(mod.focus, Math.max(3,Math.floor(dmg/3)));
    }
    renderBattle();
    if(battle.enemy.hp<=0){setTimeout(winBattle,420);} else {battle.turn='enemy'; setTimeout(enemyTurn,760);}
  }
  function enemyTurn(){
    if(!battle)return;
    const mod=combatModifiers();
    let dodge = Math.random()<(0.08+mod.dodgeBonus);
    let dmg = dodge?0:Math.max(1,battle.enemy.atk-state.player.def+Math.floor(Math.random()*5)-mod.damageReduction);
    if(dmg) state.player.hp=Math.max(0,state.player.hp-dmg);
    $('battleText').textContent = dodge ? 'Vyra dodged. The anomaly looked personally offended.' : `${battle.enemy.name} attacks. -${dmg} HP${mod.damageReduction?` (${mod.damageReduction} blocked)`:''}.`;
    if(dmg){ showDamage('hero', `-${dmg}`, 'hit'); flashCombatant('battleHero'); shakeBattle(220); grantStyleXp('defense', Math.max(1, Math.floor(dmg/2))); }
    else showDamage('hero', 'DODGE', 'dodge');
    if(state.player.hp<=0){
      handlePlayerDeath();
      return;
    }
    battle.turn='player'; renderBattle(); renderUI();
  }

  function handlePlayerDeath(){
    if(!battle) return;
    battle.turn='defeated';
    state.player.hp = 0;
    SfxManager.death();
    AudioManager.stopMusic();
    $('battleText').textContent = 'Vyra has fallen. Archive synchronization failed.';
    renderBattle();
    const panel=$('battleVictory');
    panel.innerHTML = `<div class="victory-card defeat-card"><div class="record-kicker">DEFEAT // OPERATOR DOWN</div><h2>ARCHIVE COLLAPSE</h2><p>Vyra was overwhelmed. The run has ended.</p><div class="protocol-list"><div><b>Status</b><span>HP reached 0. Developer mercy disabled in v0.5.8.</span></div><div><b>Recovery</b><span>Restart from the beginning of Fracture 001.</span></div></div><button id="deathRetryBtn">Retry Fracture</button><button id="deathMenuBtn">Return to Main Menu</button></div>`;
    panel.classList.remove('hidden');
    const retry=$('deathRetryBtn');
    const menu=$('deathMenuBtn');
    if(retry) retry.onclick=()=>{ battle=null; state=newGameState(); gameStarted=true; uiState.mode='game'; panel.classList.add('hidden'); $('battleOverlay').classList.add('hidden'); $('app').classList.remove('hidden'); renderAll(); AudioManager.play(activeMusicForState()); };
    if(menu) menu.onclick=()=>{ battle=null; panel.classList.add('hidden'); $('battleOverlay').classList.add('hidden'); gameStarted=false; showMenu(); };
  }

  function winBattle(){
    if(!battle) return;
    SfxManager.battleWin();
    const e=battle.enemy;
    const loot=[...e.loot];
    setTile(battle.x,battle.y,'.');
    const wasBoss = battle.code === 'B';
    const wasAnomaly = battle.code === 'E';
    state.flags.anomaliesCleared += wasAnomaly?1:0;
    if(wasAnomaly && state.flags.anomaliesCleared >= 3 && !state.flags.bossUnlocked){state.flags.bossUnlocked=true; log('AVOS forced the boss route open. Somebody in security is getting demoted.'); pulseObjective(currentObjectiveText());}
    if(wasBoss){state.flags.bossUnlocked=true; state.flags.bossDefeated=true; loot.push('Corrupted Catalyst'); addItem('Corrupted Catalyst',1);}
    gainXp(e.xp); grantStyleXp(state.combatStyle || 'attack', e.xp); addCredits(e.credits); e.loot.forEach(item=>addItem(item,1));
    log(`Victory: ${e.name}. +${e.xp} Sync, +${e.credits} credits, loot recovered.`);
    showVictoryPanel(e, loot, {wasBoss, wasAnomaly});
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
    const nextLabel = meta.wasBoss ? 'Recover Toxic Core' : 'Return to Fracture';
    panel.innerHTML = `<div class="victory-card"><div class="record-kicker">VICTORY // THREAT NEUTRALIZED</div><h2>${enemy.name}</h2><p>Synchronization +${enemy.xp} // Credits +${enemy.credits}</p><div class="victory-loot">${uniqueLoot.map(name=>{const item=findItemRecord(name); return `<div class="victory-loot-item ${rarityClass(item.rarity)}">${itemIconHtml(item,1)}<span>${name}</span></div>`}).join('') || '<span>No loot recovered.</span>'}</div><button id="continueBattleBtn">${nextLabel}</button></div>`;
    panel.classList.remove('hidden');
    const btn=$('continueBattleBtn');
    if(btn) btn.onclick=()=>{
      battle=null; uiState.mode='game'; panel.classList.add('hidden'); $('battleOverlay').classList.add('hidden'); renderAll(); AudioManager.play(activeMusicForState());
      if(meta.wasBoss){showStoryOnce('bossDefeated'); pulseObjective(currentObjectiveText());}
      else if(meta.wasAnomaly && state.flags.anomaliesCleared===1){showStoryOnce('firstAnomaly');}
      else if(meta.wasAnomaly && state.flags.anomaliesCleared>=3){showStoryOnce('allAnomalies');}
      else {pulseObjective(currentObjectiveText());}
    };
  }

  function gainXp(n){ state.player.xp+=n; while(state.player.xp>=state.player.nextXp){state.player.xp-=state.player.nextXp; state.player.level++; state.player.nextXp=Math.floor(state.player.nextXp*1.35); state.player.maxHp+=10; state.player.maxEp+=4; state.player.atk+=2; state.player.def+=1; state.player.hp=state.player.maxHp; state.player.ep=state.player.maxEp; log(`Synchronization increased. Level ${state.player.level}.`);} }
  function useMedPatch(){ if((state.inventory['Med Patch']||0)<=0){toast('No Med Patch available.');return;} if(state.player.hp>=state.player.maxHp){toast('HP already full.');return;} state.inventory['Med Patch']--; state.player.hp=Math.min(state.player.maxHp,state.player.hp+25); log('Used Med Patch. +25 HP.'); renderAll(); }
  function render(){
    ctx.clearRect(0,0,VIEW_W,VIEW_H); camera.x=Math.max(0, Math.min(state.player.x*TILE - VIEW_W/2, state.map[0].length*TILE - VIEW_W)); camera.y=Math.max(0, Math.min(state.player.y*TILE - VIEW_H/2, state.map.length*TILE - VIEW_H));
    ctx.save(); ctx.translate(-camera.x,-camera.y);
    for(let y=0;y<state.map.length;y++) for(let x=0;x<state.map[y].length;x++){drawTile(state.map[y][x],x*TILE,y*TILE,x,y)}
    drawMapProps();
    // player / AV-001 Vyra exploration sprite
    drawPlayerSprite(state.player.x*TILE, state.player.y*TILE);
    ctx.restore();
    drawMapAtmosphere();
  }

  function drawMapAtmosphere(){
    // v53: global fog/tint pass. Keeps bright imported tiles but makes F-001 feel toxic.
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
    mapArt.props.forEach(p=>{
      const tile = tileAt(p.x,p.y);
      if(tile === '#' || tile === 'E' || tile === 'B') return;
      drawAsset(p.img, p.x*TILE, p.y*TILE, p.w, p.h, true);
    });
  }

  function drawTile(c,x,y,tx,ty){
    const g = pickAsset(mapArt.ground,tx,ty);
    if(!drawAsset(g,x,y,TILE+1,TILE+1,false)){
      const floor=((tx+ty)%2)?'#263421':'#304028'; ctx.fillStyle=floor; ctx.fillRect(x,y,TILE,TILE);
    }
    ctx.strokeStyle='rgba(0,0,0,.16)'; ctx.strokeRect(x,y,TILE,TILE);
    if(c==='#'){
      const block = pickAsset(mapArt.blocked,tx,ty);
      const big = block.includes('tree');
      drawAsset(block,x,y,big?70:44,big?82:38,true) || (ctx.fillStyle='rgba(60,70,50,.55)',ctx.beginPath(),ctx.arc(x+TILE/2,y+TILE/2,16,0,Math.PI*2),ctx.fill());
    }
    if(c==='C'){
      if(!drawAsset(mapArt.chest,x,y,46,38,true)){ctx.fillStyle='#9b6b22';ctx.fillRect(x+9,y+13,24,20);ctx.strokeStyle='#e0b64b';ctx.strokeRect(x+9,y+13,24,20)}
    }
    if(c==='S'){
      if(!drawAsset(mapArt.terminal,x,y,46,64,true)){ctx.fillStyle='#25567d';ctx.fillRect(x+8,y+6,26,30);ctx.fillStyle='#70d7ff';ctx.fillRect(x+13,y+12,16,8)}
      ctx.fillStyle='rgba(112,215,255,.85)'; ctx.fillRect(x+15,y+31,12,3);
    }
    if(c==='H'){
      if(!drawAsset(mapArt.med,x,y,34,34,false)){ctx.fillStyle='#216d45';ctx.fillRect(x+8,y+8,26,26);ctx.fillStyle='#fff';ctx.fillRect(x+18,y+12,6,18);ctx.fillRect(x+12,y+18,18,6)}
    }
    if(c==='L'){
      if(!drawAsset(mapArt.lore,x,y,34,52,true)){ctx.fillStyle='#4b316f';ctx.fillRect(x+11,y+8,20,28);ctx.fillStyle='#d2a8ff';ctx.fillRect(x+15,y+13,12,3);ctx.fillRect(x+15,y+20,12,3)}
    }
    if(c==='E'||c==='B'){
      const im = getMapCreatureImage(c,tx,ty);
      if(im && im.complete && im.naturalWidth){
        ctx.save();
        ctx.shadowColor = c==='B' ? '#ff3048' : '#bd1f2d';
        ctx.shadowBlur = c==='B' ? 16 : 10;
        ctx.drawImage(im, x+4, y+4, TILE-8, TILE-8);
        ctx.restore();
        ctx.strokeStyle = c==='B' ? '#ff3048' : '#bd1f2d';
        ctx.lineWidth = 2;
        ctx.strokeRect(x+3,y+3,TILE-6,TILE-6);
      } else {
        ctx.fillStyle=c==='B'?'#72202b':'#5c4e41';ctx.beginPath();ctx.arc(x+21,y+21,c==='B'?18:14,0,Math.PI*2);ctx.fill();ctx.fillStyle='#ff3048';ctx.fillRect(x+13,y+16,6,4);ctx.fillRect(x+24,y+16,6,4);
      }
    }
    if(c==='D'){
      if(!drawAsset(mapArt.door,x,y,52,24,false)){ctx.fillStyle='#5a3422';ctx.fillRect(x+6,y+2,30,38);ctx.fillStyle='#e0b64b';ctx.fillRect(x+29,y+20,4,4)}
    }
    if(c==='X'){
      if(!drawAsset(mapArt.exit,x,y,34,54,true)){ctx.fillStyle='#eee';ctx.fillRect(x+6,y+6,30,30);ctx.fillStyle='#050608';ctx.fillText('X',x+16,y+27)}
    }
  }
  function renderMini(){
    const w=state.map[0].length,h=state.map.length; mctx.clearRect(0,0,mini.width,mini.height); const sx=mini.width/w, sy=mini.height/h;
    for(let y=0;y<h;y++) for(let x=0;x<w;x++){const c=tileAt(x,y); mctx.fillStyle=c==='#'?'#111':c==='C'?'#e0b64b':c==='E'||c==='B'?'#bd1f2d':c==='X'?'#fff':'#303842'; mctx.fillRect(x*sx,y*sy,Math.ceil(sx),Math.ceil(sy));}
    mctx.fillStyle='#ff3048'; mctx.fillRect(state.player.x*sx,state.player.y*sy,Math.ceil(sx*2),Math.ceil(sy*2));
  }
  function renderUI(){ const p=state.player; const saveAge=Math.floor((Date.now()-(state.lastSave||Date.now()))/1000); $('stats').innerHTML=`<div class="statrow">Level ${p.level} // Credits ${p.credits}</div><div class="statrow">Focus ${(skillList[state.combatStyle||'attack']||{}).name||'Striker Protocol'} // Autosave ${saveAge}s</div><div class="statrow">HP ${p.hp}/${p.maxHp}<div class="bar"><span style="width:${100*p.hp/p.maxHp}%"></span></div></div><div class="statrow">EP ${p.ep}/${p.maxEp}<div class="bar ep"><span style="width:${100*p.ep/p.maxEp}%"></span></div></div><div class="statrow">Sync ${p.xp}/${p.nextXp}<div class="bar xp"><span style="width:${100*p.xp/p.nextXp}%"></span></div></div>`;
    ensureStoryFlags();
    $('fractureStatus').innerHTML=`<div class="statrow">Anomalies Cleared: ${state.flags.anomaliesCleared}/3</div><div class="statrow">Boss Route: ${state.flags.bossUnlocked?'Unlocked':'Locked'}</div><div class="statrow">Boss Defeated: ${state.flags.bossDefeated?'Yes':'No'}</div><div class="statrow">Chapter: ${state.flags.chapterComplete?'Complete':'Active'}</div>`;
    $('inventory').innerHTML=Object.entries(state.inventory).map(([k,v])=>{
      const item=findItemRecord(k);
      return `<div class="invrow invrow-polished ${rarityClass(item.rarity)}" title="${item.desc}">${itemIconHtml(item,v)}<div><b>${k}</b><small>${item.rarity} // ${item.type}</small></div>${k==='Med Patch'?'<button onclick="window.AV.useMedPatch()">Use</button>':''}</div>`;
    }).join('')||'<div class="invrow">No recovered assets.</div>';
    $('log').innerHTML=state.log.map(l=>`<div class="logrow">${l}</div>`).join('');
    $('roster').innerHTML='<div class="statrow"><b>AV-001 Vyra</b><br>Active Operator</div>';
    const objectives=[['Reach recovery terminal',state.flags.terminal],['Clear 3 anomalies',state.flags.anomaliesCleared>=3],['Unlock boss gate',state.flags.bossUnlocked],['Defeat boss',state.flags.bossDefeated],['Extract / Chapter Complete',state.flags.chapterComplete]];
    const activeText=currentObjectiveText();
    $('objectiveTracker').innerHTML=`<b>${activeText}</b><br>` + objectives.map(([t,done])=>`${done?'✅':'⬜'} ${t}`).join(' &nbsp; ');
    $('missionProgress').innerHTML=objectives.map(([t,done])=>`<div class="mission-row">${done?'✅':'⬜'} ${t}</div>`).join('');
    $('missionChecklist') && ($('missionChecklist').innerHTML=$('missionProgress').innerHTML);
    $('missionActiveHint') && ($('missionActiveHint').textContent=activeText);
    $('qaState') && ($('qaState').innerHTML=`<div class="statrow">Position: ${p.x}, ${p.y}</div><div class="statrow">HP: ${p.hp}/${p.maxHp}</div><div class="statrow">Flags: ${JSON.stringify(state.flags)}</div>`);
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
      if(id==='missionOverlay') renderUI();
      if(id==='playtestOverlay') renderUI();
      if(id==='progressionOverlay') renderProgressionDb();
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
    const img = d.battle;
    const icon = d.icon || iconPathFor(d);
    $('anomalyFile').innerHTML=`<div class="creature-card-file"><div class="record-kicker">${d.id} // ${d.type||'Anomaly'}</div><h2>${d.name}</h2><div class="creature-preview"><img src="${img}" alt="${d.name}" onerror="this.onerror=null;this.src='${icon}'"></div><div class="record-grid"><div><b>HP</b><span>${d.hp}</span></div><div><b>ATK</b><span>${d.atk}</span></div><div><b>Credits</b><span>${d.credits}</span></div><div><b>Loot</b><span>${(d.loot||[]).join(', ')}</span></div></div><div class="protocol-list"><div><b>Battle Asset</b><span>${img}</span></div><div><b>Icon Asset</b><span>${icon}</span></div><div><b>Pipeline Status</b><span>Imported creature library // active in Fracture encounters.</span></div></div><p class="fineprint">This creature is loaded from the imported monster/boss library and can be assigned to any Fracture encounter tile.</p></div>`;
  }
  function renderAnomalyDb(){
    const all = getCreatureLibrary();
    $('anomalyList').innerHTML=`<div class="creature-tools"><input id="creatureSearch" placeholder="Search anomalies / bosses..."><select id="creatureFilter"><option value="all">All records</option><option value="Anomaly">Anomalies</option><option value="Boss">Bosses</option><option value="Chapter 1">Chapter 1</option></select><div class="creature-count"></div></div><div id="creatureListButtons" class="creature-list-buttons"></div>`;
    const drawList=()=>{
      const q=($('creatureSearch').value||'').toLowerCase();
      const f=$('creatureFilter').value;
      const filtered=all.filter(d=>(f==='all'||d.type===f) && (`${d.id} ${d.name}`.toLowerCase().includes(q)));
      document.querySelector('#anomalyList .creature-count').textContent=`${filtered.length} / ${all.length} records`;
      $('creatureListButtons').innerHTML=filtered.slice(0,160).map((d,i)=>`<button data-id="${d.id}"><span>${d.id}</span><b>${d.name}</b></button>`).join('') || '<p class="menu-info">No matching records.</p>';
      document.querySelectorAll('#creatureListButtons button').forEach(b=>b.onclick=()=>showCreatureFile(all.find(d=>d.id===b.dataset.id)));
      if(filtered[0]) showCreatureFile(filtered[0]);
    };
    $('creatureSearch').oninput=drawList; $('creatureFilter').onchange=drawList; drawList();
  }

  function renderProgressionDb(){
    ensureProgression();
    const styleKeys = Object.keys(skillList).filter(k => skillList[k].type === 'combat');
    if($('combatStylePicker')) $('combatStylePicker').innerHTML = styleKeys.map(k => {
      const active = state.combatStyle === k ? ' active' : '';
      return `<button class="style-card${active}" data-style="${k}"><span class="skill-glyph">${skillList[k].glyph}</span><span>${skillList[k].name}</span></button>`;
    }).join('');
    document.querySelectorAll('#combatStylePicker [data-style]').forEach(b => b.onclick = () => setCombatStyle(b.dataset.style));
    const rows = Object.entries(skillList).map(([k,info]) => {
      const d = state.skillData[k] || {xp:0,level:1};
      const pct = stylePercent(k);
      return `<div class="skill-row ${info.type}"><span class="skill-glyph">${info.glyph}</span><div><b>${info.name}</b><span>${info.type.toUpperCase()} // Lv. ${d.level} // XP ${d.xp.toLocaleString()} // ${info.bonus}</span><div class="bar xp"><span style="width:${pct}%"></span></div></div></div>`;
    }).join('');
    if($('progressionList')) $('progressionList').innerHTML = rows;
  }

  function findItemRecord(name){
    const found = coreItemRegistry.find(i=>i.name===name) || importedItemRegistry.find(i=>i.name===name);
    if(found) return normalizeItem(found);
    return normalizeItem({name, asset:'assets/items/scrap_metal.png', rarity:'Common', type:'Recovered Asset', description:'Recovered item registered by AVOS.'});
  }
  function normalizeItem(item){
    return {
      ...item,
      type: item.type || item.category || 'Item',
      rarity: item.rarity || rarityFromCategory(item.category),
      desc: item.desc || item.description || item.effect?.description || 'No field notes available.',
      stackSize: item.stackSize || item.stack || (item.type === 'Equipment' ? 1 : 999),
      sellPrice: item.sellPrice || item.value || 0
    };
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
      return `<button class="owned-item ${rarityClass(item.rarity)}" data-item-name="${k}" title="${item.desc}">${itemIconHtml(item,v)}<div><b>${k}</b><span>${item.rarity} // ${item.type}</span><small>${item.desc}</small></div>${k==='Med Patch'?'<em>Usable</em>':'<em>Stored</em>'}</button>`;
    }).join('') || '<div class="invrow">No recovered assets yet.</div>';
    const fullRegistry=[...coreItemRegistry.map(normalizeItem), ...importedItemRegistry.map(normalizeItem)];
    $('inventoryDatabaseList').innerHTML=`
      <div class="item-tools">
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
      $('itemDetailPanel').innerHTML=`<div class="record-kicker">${item.id || 'RECOVERED'} // ${item.rarity}</div><div class="item-detail-top">${itemIconHtml(item)}<div><h2>${item.name}</h2><p>${item.type} ${item.category?`// ${item.category}`:''} ${item.slot?`// ${item.slot}`:''}</p></div></div><p>${item.desc}</p><div class="record-grid"><div><b>Stack</b><span>${item.stackSize}</span></div><div><b>Sell</b><span>${item.sellPrice} credits</span></div><div><b>Status</b><span>${item.status || 'active'}</span></div><div><b>Asset</b><span>${item.asset}</span></div></div>${item.name==='Med Patch'?'<button onclick="window.AV.useMedPatch()">Use Med Patch</button>':''}`;
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
        <button data-hot="db"><b>D</b>Anomalies</button>
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
    if(!document.getElementById('fsSidehud')){
      const h=document.createElement('div');
      h.id='fsSidehud';
      h.className='fullscreen-sidehud hidden';
      h.innerHTML=`<h3>Field HUD</h3><div id="fsHudStats" class="fs-mini-section"></div><canvas id="fsMinimap" width="300" height="120" class="minimap"></canvas><div class="mini-hint">M hides this panel. I opens inventory. D opens database.</div>`;
      document.body.appendChild(h);
    }
    if(!document.getElementById('fsHelp')){
      const help=document.createElement('div');
      help.id='fsHelp';
      help.className='fullscreen-help hidden';
      help.innerHTML=`<b>ASH VECTOR HOTKEYS</b><br><kbd>Arrow Keys</kbd> Move <kbd>M</kbd> Map/HUD <kbd>I</kbd> Inventory <kbd>D</kbd> Anomaly Database <kbd>O</kbd> Operator <kbd>P</kbd> Progress <kbd>B</kbd> Mission <kbd>F</kbd> Fullscreen <kbd>Esc</kbd> Close panels`;
      document.body.appendChild(help);
    }
  }
  function toggleSideHud(){ ensureFullscreenUi(); const el=$('fsSidehud'); el.classList.toggle('hidden'); renderFullscreenHud(); }
  function toggleFullscreenHelp(){ ensureFullscreenUi(); $('fsHelp').classList.toggle('hidden'); }
  function renderFullscreenHud(){
    const hud=$('fsSidehud'); if(!hud || hud.classList.contains('hidden')) return;
    const p=state.player;
    $('fsHudStats').innerHTML=`
      <div class="fs-row"><b>Vyra</b><br>Lv ${p.level} // Credits ${p.credits}</div>
      <div class="fs-row">HP ${p.hp}/${p.maxHp}<div class="bar"><span style="width:${100*p.hp/p.maxHp}%"></span></div></div>
      <div class="fs-row">EP ${p.ep}/${p.maxEp}<div class="bar ep"><span style="width:${100*p.ep/p.maxEp}%"></span></div></div>
      <div class="fs-row">Anomalies Cleared: ${state.flags.anomaliesCleared}/3<br>Boss Route: ${state.flags.bossUnlocked?'Unlocked':'Locked'}</div>`;
    const c=$('fsMinimap'); if(!c) return;
    const x=c.getContext('2d'); const w=c.width,h=c.height; x.clearRect(0,0,w,h); const rows=state.map.length, cols=state.map[0].length; const sx=w/cols, sy=h/rows;
    for(let y=0;y<rows;y++)for(let xx=0;xx<cols;xx++){const t=tileAt(xx,y); x.fillStyle=t==='#'?'#303944':t==='C'?'#c49328':t==='E'||t==='B'?'#9d1b2a':t==='X'?'#fff':'#10151b'; x.fillRect(xx*sx,y*sy,Math.max(1,sx),Math.max(1,sy));}
    x.fillStyle='#ff3048'; x.fillRect(state.player.x*sx,state.player.y*sy,Math.max(3,sx*2),Math.max(3,sy*2));
  }
  function applySettings(){ document.body.classList.toggle('no-crt', !state.settings.crt); document.body.classList.toggle('reduced-motion', !!state.settings.reducedMotion); document.body.classList.toggle('large-text', !!state.settings.largeText); }
  function startAutosave(){ setInterval(()=>{ if(!$('app').classList.contains('hidden')) save(true); }, 30000); setInterval(()=>renderUI(), 1000); }

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
      if(e.key==='Escape' && overlayOpen){ e.preventDefault(); closeOverlays(); return; }
      if((e.key==='f'||e.key==='F') && gameIsOpen){ e.preventDefault(); toggleFullscreenMode(); return; }
      if(gameIsOpen && !overlayOpen){
        const k=e.key.toLowerCase();
        if(k==='m'){ e.preventDefault(); toggleSideHud(); return; }
        if(k==='i'){ e.preventDefault(); openOverlay('inventoryOverlay'); return; }
        if(k==='d'){ e.preventDefault(); openOverlay('anomalyOverlay'); return; }
        if(k==='o'){ e.preventDefault(); openOverlay('operatorOverlay'); return; }
        if(k==='p'){ e.preventDefault(); openOverlay('progressionOverlay'); return; }
        if(k==='b'){ e.preventDefault(); openOverlay('missionOverlay'); return; }
        if(k==='h'){ e.preventDefault(); toggleFullscreenHelp(); return; }
      }
      if(e.key==='Escape' && document.body.classList.contains('fullscreen-mode')){ e.preventDefault(); document.body.classList.remove('fullscreen-mode'); if(document.fullscreenElement && document.exitFullscreen){ document.exitFullscreen().catch(()=>{}); } showFullscreenHint('Fullscreen mode off'); renderAll(); return; }
      if(gameIsOpen && !overlayOpen && ['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key)){
        e.preventDefault();
        if(e.key==='ArrowUp')tryMove(0,-1);
        if(e.key==='ArrowDown')tryMove(0,1);
        if(e.key==='ArrowLeft')tryMove(-1,0);
        if(e.key==='ArrowRight')tryMove(1,0);
      }
    }, {passive:false});
    $('newGameBtn').onclick=(e)=>{e.preventDefault(); startGame(true);}; $('continueBtn').onclick=()=>{try{load();}catch(err){} startGame(false)};
    // v44: if CSS/content gets clipped, clicking the main menu card outside a protocol button also starts.
    $('mainMenu').addEventListener('dblclick',()=>startGame(true)); $('menuBtn').onclick=showMenu; $('saveBtn').onclick=save; $('loadBtn').onclick=load; $('resetBtn').onclick=()=>{localStorage.removeItem('ashVectorSave'); state=newGameState(); renderAll(); toast('Archive purged.');};
    if($('fullscreenBtn')) $('fullscreenBtn').onclick=toggleFullscreenMode; if($('menuFullscreenBtn')) $('menuFullscreenBtn').onclick=toggleFullscreenMode;
    $('operatorFilesBtn').onclick=()=>openOverlay('operatorOverlay'); $('anomalyIndexBtn').onclick=()=>openOverlay('anomalyOverlay'); $('fractureIndexBtn').onclick=()=>openOverlay('fractureOverlay'); $('inventoryDbBtn').onclick=()=>openOverlay('inventoryOverlay'); $('progressionBtn').onclick=()=>openOverlay('progressionOverlay'); $('progressionTopBtn').onclick=()=>openOverlay('progressionOverlay'); $('missionMenuBtn').onclick=()=>openOverlay('missionOverlay'); $('missionBtn').onclick=()=>openOverlay('missionOverlay'); $('configBtn').onclick=()=>openOverlay('configOverlay'); $('playtestBtn').onclick=()=>openOverlay('playtestOverlay');
    ['operatorFilesBtn','anomalyIndexBtn','fractureIndexBtn','inventoryDbBtn','progressionBtn','missionMenuBtn','configBtn'].forEach(id=>{ const btn=$(id); if(btn) btn.addEventListener('click',(e)=>{ e.preventDefault(); e.stopPropagation(); const info=$('menuInfo'); if(info){ info.textContent='Protocol opened. Press Esc or Close to return.'; info.classList.add('ok'); } }); });
    ['closeOperatorDb','closeAnomalyDb','closeFractureDb','closeInventoryDb','closeProgression','closeMission','closePlaytest','closeConfig'].forEach(id=>$(id) && ($(id).onclick=closeOverlays));
    document.querySelectorAll('[data-move]').forEach(b=>b.onclick=()=>({up:()=>tryMove(0,-1),down:()=>tryMove(0,1),left:()=>tryMove(-1,0),right:()=>tryMove(1,0)}[b.dataset.move]()));
    $('settingCrt').onchange=e=>{state.settings.crt=e.target.checked;applySettings()}; $('settingMotion').onchange=e=>{state.settings.reducedMotion=e.target.checked;applySettings()}; $('settingLargeText').onchange=e=>{state.settings.largeText=e.target.checked;applySettings()};
    $('qaHeal').onclick=()=>{state.player.hp=state.player.maxHp;state.player.ep=state.player.maxEp;renderAll();}; $('qaCredits').onclick=()=>{addCredits(100);renderAll();}; $('qaClearAnomalies').onclick=()=>{state.flags.anomaliesCleared=3;state.flags.bossUnlocked=true;renderAll();}; $('qaBossReady').onclick=()=>{state.flags.bossUnlocked=true;renderAll();}; $('qaCompleteChapter').onclick=()=>{state.flags.chapterComplete=true;renderAll();}; $('qaResetRun').onclick=()=>{state=newGameState();renderAll();}; $('qaPath').onclick=()=>toast('Route: Terminal → 3 Anomalies → Door → Boss → Exit');
  }
  window.AV={useMedPatch, openOverlay, startGame, showMenu, closeOverlays, routeMainMenuAction, renderAll, save, load, AudioManager, showStory, showChapterClearPanel};
  // v48: expose bulletproof direct menu helpers for GitHub Pages testing.
  window.AV_MENU={
    start:()=>startGame(true),
    continue:()=>{try{load();}catch(err){} startGame(false);},
    open:(id)=>openOverlay(id),
    fullscreen:()=>toggleFullscreenMode()
  };
  loadImages(); bind(); applySettings(); boot(); setTimeout(()=>{ if(!$('bootScreen').classList.contains('hidden') && $('bootLogo').classList.contains('hidden')){ $('bootLogo').classList.remove('hidden'); bootDone=true; } }, 4500); renderAll();
})();
