import * as THREE from 'three';
import { BoardConfig, Direction, ClearGroup, GameMode } from '@/types';
import { Board } from '@/board/Board';
import { BoardRenderer } from '@/board/BoardRenderer';
import { Player } from '@/player/Player';
import { PlayerRenderer } from '@/player/PlayerRenderer';
import { ChainManager } from '@/rules/ChainManager';
import { HappyOneTracker } from '@/rules/HappyOne';
import { GameState } from './GameState';
import { InputManager, InputAction } from '@/input/InputManager';
import { HUD } from '@/ui/HUD';
import { Menu } from '@/ui/Menu';
import { VirtualPad } from '@/ui/VirtualPad';
import { AudioManager } from '@/audio/AudioManager';
import { resetDiceIdCounter } from '@/dice/Dice';
import { CharacterId, loadCharacter, saveCharacter } from '@/characters/CharacterDef';
import { generateCharacterPreviews } from '@/characters/CharacterPreview';

const BOARD_CONFIG: BoardConfig = {
  width: 8,
  depth: 8,
  initialEmptyCount: 6,
  newDiceInterval: 360,
};

/** タイムアタックの制限時間（秒） */
const TIME_ATTACK_SECONDS = 60;

/** コンボチャレンジのターゲットチェーン数 */
const COMBO_TARGET = 10;

/** ハイスコアの localStorage キー */
const HS_KEY: Record<GameMode, string> = {
  endless:    'xi_sai_hs_endless',
  timeattack: 'xi_sai_hs_timeattack',
  combo:      'xi_sai_hs_combo',
};

/**
 * ゲーム全体の管理
 */
export class GameManager {
  // Three.js
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;

  // ゲームロジック
  private board!: Board;
  private player!: Player;
  private chainManager!: ChainManager;
  private happyOneTracker: HappyOneTracker;
  private gameState: GameState;

  // レンダラー
  private boardRenderer!: BoardRenderer;
  private playerRenderer!: PlayerRenderer;

  // UI
  private hud!: HUD;
  private menu!: Menu;
  private virtualPad!: VirtualPad;

  // 入力・音声
  private inputManager: InputManager;
  private audioManager: AudioManager;

  // DOM
  private appEl: HTMLElement;
  private animationId = 0;
  private zoomBtnEl!: HTMLElement;
  private bgmBtnEl!: HTMLElement;
  private seBtnEl!: HTMLElement;

  // ズームレベル: 0=遠景(全体), 1=近景(寄り)
  private zoomLevel = 0;

  // 消去後のチェック遅延
  private pendingClearCheck = false;
  private clearCheckDelay = 0;

  // ── ゲームモード関連 ──────────────────────────────────────────

  private currentMode: GameMode = 'endless';

  /** タイムアタック: 残り時間（ms） */
  private timeRemaining = 0;
  private lastFrameTime = 0;

  /** BGM: 最初のユーザー操作後に一度だけ開始 */
  private bgmStarted = false;

  // ── キャラクター ─────────────────────────────────────────────

  private selectedCharacter: CharacterId = loadCharacter();

  // ─────────────────────────────────────────────────────────────

  constructor(appEl: HTMLElement) {
    this.appEl = appEl;
    this.gameState = new GameState();
    this.happyOneTracker = new HappyOneTracker();
    this.inputManager = new InputManager();
    this.audioManager = new AudioManager();

    this.initThree();
    this.initUI();
    this.initInput();
    this.initBGMUnlock();

    // タイトル画面表示
    this.menu.showTitle();

    this.startRenderLoop();
  }

  // ── 初期化 ──────────────────────────────────────────────────

  private getCanvasSize(): { w: number; h: number } {
    const isPortrait = window.innerWidth < window.innerHeight && window.innerWidth <= 768;
    const padReserve = isPortrait ? 240 : 0;
    return { w: window.innerWidth, h: window.innerHeight - padReserve };
  }

  private initThree(): void {
    let lastTouchStart = 0;
    const { w, h } = this.getCanvasSize();
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setSize(w, h);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setClearColor(0x080810);
    this.appEl.appendChild(this.renderer.domElement);

    const canvas = this.renderer.domElement;
    canvas.addEventListener('touchstart', (e: TouchEvent) => e.preventDefault(), { passive: false });
    canvas.addEventListener('touchend',   (e: TouchEvent) => e.preventDefault(), { passive: false });

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x080810, 0.04);

    this.camera = new THREE.PerspectiveCamera(40, w / h, 0.1, 100);
    this.updateCameraPosition();

    const ambientLight = new THREE.AmbientLight(0x8899aa, 2.2);
    this.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xfff4e0, 2.8);
    dirLight.position.set(8, 12, 6);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.set(2048, 2048);
    dirLight.shadow.camera.left   = -12;
    dirLight.shadow.camera.right  =  12;
    dirLight.shadow.camera.top    =  12;
    dirLight.shadow.camera.bottom = -12;
    this.scene.add(dirLight);

    const backLight = new THREE.DirectionalLight(0x6699cc, 0.9);
    backLight.position.set(-5, 8, -5);
    this.scene.add(backLight);

    window.addEventListener('resize', () => this.onResize());

    // ピンチ・ダブルタップズーム防止
    const prevent = (e: Event) => e.preventDefault();
    document.addEventListener('gesturestart',  prevent, { passive: false });
    document.addEventListener('gesturechange', prevent, { passive: false });
    document.addEventListener('gestureend',    prevent, { passive: false });

    document.addEventListener('touchstart', (e: TouchEvent) => {
      if (e.touches.length > 1) { e.preventDefault(); return; }
      const now = Date.now();
      if (now - lastTouchStart < 300) e.preventDefault();
      lastTouchStart = now;
    }, { passive: false });
    document.addEventListener('touchmove', (e: TouchEvent) => {
      if (e.touches.length > 1) e.preventDefault();
    }, { passive: false });
  }

  private updateCameraPosition(): void {
    const cx = (BOARD_CONFIG.width - 1) / 2;
    const cz = (BOARD_CONFIG.depth - 1) / 2;
    const isPortrait = window.innerWidth < window.innerHeight && window.innerWidth <= 768;

    if (this.zoomLevel === 1) {
      this.camera.fov = isPortrait ? 38 : 30;
      this.camera.position.set(cx + 4, 9, cz + 8);
    } else {
      this.camera.fov = isPortrait ? 52 : 40;
      this.camera.position.set(
        isPortrait ? cx + 5 : cx + 6,
        isPortrait ? 14     : 11,
        isPortrait ? cz + 12 : cz + 10,
      );
    }
    this.camera.updateProjectionMatrix();
    this.camera.lookAt(cx, 0, cz);
  }

  /** UI初期化 */
  private initUI(): void {
    this.hud  = new HUD(this.appEl);
    this.menu = new Menu(this.appEl);
    this.virtualPad = new VirtualPad(this.appEl);

    this.menu.setCallbacks(
      (mode: GameMode) => this.startGame(mode),
      () => this.restartGame(),
      () => this.resumeGame(),
      () => this.loadHighScores(),
      () => this.showCharacterSelect(() => this.menu.showModeSelect(this.loadHighScores())),
      () => this.showCharacterSelect(() => this.menu.showModeSelect(this.loadHighScores())),
    );

    this.initTopButtons();
  }

  /** 右上のボタン群（ズーム・BGM・SE） */
  private initTopButtons(): void {
    const style = document.createElement('style');
    style.textContent = `
      #top-btns {
        position: absolute;
        top: 6px;
        right: 8px;
        z-index: 20;
        display: flex;
        gap: 4px;
        align-items: center;
      }
      .top-btn {
        background: rgba(0,0,0,0.45);
        border: 1px solid rgba(255,255,255,0.2);
        border-radius: 8px;
        color: #fff;
        font-size: 13px;
        padding: 4px 9px;
        cursor: pointer;
        touch-action: none;
        -webkit-tap-highlight-color: transparent;
        user-select: none;
        line-height: 1.4;
      }
      .top-btn:active { background: rgba(0,170,119,0.4); }
    `;
    this.appEl.appendChild(style);

    const wrap = document.createElement('div');
    wrap.id = 'top-btns';

    this.bgmBtnEl = document.createElement('button');
    this.bgmBtnEl.className = 'top-btn';
    this.bgmBtnEl.textContent = '🎵';
    this.bgmBtnEl.setAttribute('aria-label', 'BGM ON/OFF');

    this.seBtnEl = document.createElement('button');
    this.seBtnEl.className = 'top-btn';
    this.seBtnEl.textContent = '🔊';
    this.seBtnEl.setAttribute('aria-label', 'SE ON/OFF');

    this.zoomBtnEl = document.createElement('button');
    this.zoomBtnEl.className = 'top-btn';
    this.zoomBtnEl.id = 'zoom-btn';
    this.zoomBtnEl.textContent = '🔍+';
    this.zoomBtnEl.setAttribute('aria-label', 'ズーム切替');

    wrap.appendChild(this.bgmBtnEl);
    wrap.appendChild(this.seBtnEl);
    wrap.appendChild(this.zoomBtnEl);
    this.appEl.appendChild(wrap);

    // BGM ボタン
    const toggleBGM = () => {
      const muted = this.audioManager.toggleBGMMute();
      this.bgmBtnEl.textContent = muted ? '🔇' : '🎵';
    };
    this.bgmBtnEl.addEventListener('touchend', (e) => { e.preventDefault(); toggleBGM(); }, { passive: false });
    this.bgmBtnEl.addEventListener('click', toggleBGM);

    // SE ボタン
    const toggleSE = () => {
      const muted = this.audioManager.toggleSEMute();
      this.seBtnEl.textContent = muted ? '🔕' : '🔊';
    };
    this.seBtnEl.addEventListener('touchend', (e) => { e.preventDefault(); toggleSE(); }, { passive: false });
    this.seBtnEl.addEventListener('click', toggleSE);

    // ズームボタン
    const resetBrowserZoom = () => {
      const meta = document.querySelector('meta[name="viewport"]') as HTMLMetaElement | null;
      if (!meta) return;
      meta.content = 'width=device-width, initial-scale=1, maximum-scale=2, user-scalable=yes';
      requestAnimationFrame(() => {
        meta.content = 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no';
      });
    };
    const toggleZoom = () => {
      this.zoomLevel = this.zoomLevel === 0 ? 1 : 0;
      this.zoomBtnEl.textContent = this.zoomLevel === 1 ? '🔍−' : '🔍+';
      this.updateCameraPosition();
      resetBrowserZoom();
    };
    this.zoomBtnEl.addEventListener('touchend', (e) => { e.preventDefault(); toggleZoom(); }, { passive: false });
    this.zoomBtnEl.addEventListener('click', toggleZoom);
  }

  /** 最初のユーザー操作で BGM を開始（iOS autoplay 対策） */
  private initBGMUnlock(): void {
    const unlock = () => {
      this.audioManager.resumeContext();
      if (!this.bgmStarted) {
        this.bgmStarted = true;
        this.audioManager.startBGM();
      }
    };
    document.addEventListener('touchstart', unlock, { once: true });
    document.addEventListener('click',      unlock, { once: true });
  }

  /** 入力初期化 */
  private initInput(): void {
    this.inputManager.setCallback((action: InputAction) => {
      this.handleInput(action);
    });

    this.virtualPad.setCallback((input: Direction | 'descend') => {
      if (input === 'descend') {
        this.handleInput({ type: 'descend' });
      } else {
        this.handleInput({ type: 'move', direction: input });
      }
    });
  }

  // ── 入力処理 ───────────────────────────────────────────────

  private handleInput(action: InputAction): void {
    switch (action.type) {
      case 'move':
        if (!this.gameState.canPlayerAct()) return;
        if (!this.player || !this.player.isIdle()) return;
        this.handleMove(action.direction);
        break;
      case 'descend':
        if (!this.gameState.canPlayerAct()) return;
        if (!this.player || !this.player.isIdle()) return;
        if (this.player.descend()) this.audioManager.playMove();
        break;
      case 'restart':
        if (this.gameState.isPlaying() || this.gameState.phase === 'gameover') {
          this.restartGame();
        }
        break;
      case 'pause':
        if (this.gameState.phase === 'playing' || this.gameState.phase === 'clearing') {
          this.pauseGame();
        } else if (this.gameState.phase === 'paused') {
          this.resumeGame();
        }
        break;
    }
  }

  private handleMove(direction: Direction): void {
    const moveType = this.player.move(direction);
    if (!moveType) return;

    switch (moveType) {
      case 'ride_roll':
        this.audioManager.playPush();
        if (this.player.data.ridingDiceId !== null) {
          const dice = this.board.getDiceById(this.player.data.ridingDiceId);
          if (dice) this.boardRenderer.refreshDiceMaterial(dice);
        }
        this.pendingClearCheck = true;
        this.clearCheckDelay = 10;
        break;
      case 'climb':
      case 'descend':
      case 'walk':
        this.audioManager.playMove();
        break;
    }
  }

  // ── ゲーム状態遷移 ─────────────────────────────────────────

  /** キャラクター選択画面を表示し、確定後に onConfirm を呼ぶ */
  private showCharacterSelect(onConfirm: () => void): void {
    const previews = generateCharacterPreviews();
    this.menu.showCharacterSelect(
      this.selectedCharacter,
      previews,
      (id: CharacterId) => {
        this.selectedCharacter = id;
        saveCharacter(id);
        // インゲームのキャラクターが既に存在する場合は切り替え
        if (this.playerRenderer) this.playerRenderer.setCharacter(id);
        onConfirm();
      },
      () => this.menu.showTitle(),
    );
  }

  private startGame(mode: GameMode): void {
    this.currentMode = mode;
    this.cleanup();
    this.menu.hide();
    this.initGameObjects();
    this.initModeState();
    this.gameState.transition('playing');
  }

  private restartGame(): void {
    this.cleanup();
    this.menu.hide();
    this.initGameObjects();
    this.initModeState();
    this.gameState.transition('playing');
  }

  /** モード固有の初期化 */
  private initModeState(): void {
    this.hud.showMode(this.currentMode);

    if (this.currentMode === 'timeattack') {
      this.timeRemaining = TIME_ATTACK_SECONDS * 1000;
      this.lastFrameTime = performance.now();
      this.hud.showTimer(TIME_ATTACK_SECONDS, TIME_ATTACK_SECONDS);
    } else {
      this.hud.hideTimer();
    }
  }

  private pauseGame(): void {
    this.gameState.transition('paused');
    this.menu.showPause();
  }

  private resumeGame(): void {
    this.menu.hide();
    if (this.currentMode === 'timeattack') {
      this.lastFrameTime = performance.now(); // 再開時刻リセット（ポーズ中の経過をカウントしない）
    }
    this.gameState.transition('playing');
  }

  // ── ゲームオブジェクト初期化 ─────────────────────────────

  private initGameObjects(): void {
    resetDiceIdCounter();
    this.happyOneTracker.clear();
    this.pendingClearCheck = false;

    this.board = new Board(BOARD_CONFIG);
    const emptyPositions = this.board.init();

    const cx = Math.floor(BOARD_CONFIG.width / 2);
    const cz = Math.floor(BOARD_CONFIG.depth / 2);
    let startPos = emptyPositions[0] || { x: cx, z: cz };
    let bestDist = Infinity;
    for (const pos of emptyPositions) {
      const dist = Math.abs(pos.x - cx) + Math.abs(pos.z - cz);
      if (dist < bestDist) { bestDist = dist; startPos = pos; }
    }

    this.player = new Player(this.board, startPos);

    this.chainManager = new ChainManager(this.board);
    this.chainManager.setCallbacks(
      (groups: ClearGroup[]) => this.onClearStart(groups),
      (chainCount: number)   => this.onChain(chainCount),
    );

    this.boardRenderer = new BoardRenderer(this.scene, this.board);
    this.boardRenderer.init();
    this.playerRenderer = new PlayerRenderer(this.scene, this.selectedCharacter);

    this.hud.updateScore(this.chainManager.score);
  }

  // ── コールバック ──────────────────────────────────────────

  private onClearStart(groups: ClearGroup[]): void {
    let hasHappyOne = false;
    for (const g of groups) {
      if (g.isHappyOne) {
        hasHappyOne = true;
        for (const id of g.diceIds) {
          const dice = this.board.getDiceById(id);
          if (dice) this.happyOneTracker.addEvent(id, dice.pos.x, dice.pos.z);
        }
      }
    }

    if (hasHappyOne) {
      this.hud.showNotification('HAPPY ONE!');
      this.audioManager.playHappyOne();
    } else {
      this.audioManager.playClear(this.chainManager.score.chainCount);
    }

    // コンボ数が多いときは大きく表示
    const combo = this.chainManager.score.combo;
    if (combo >= 3) {
      setTimeout(() => {
        this.hud.showNotification(`${combo} COMBO!`, true);
      }, 300);
    }
  }

  private onChain(chainCount: number): void {
    this.hud.showNotification(`${chainCount} CHAIN!`, chainCount >= 3);
    this.audioManager.playCombo(chainCount);

    // コンボチャレンジ: ターゲット達成チェック
    if (this.currentMode === 'combo' && chainCount >= COMBO_TARGET) {
      this.gameClear();
    }
  }

  // ── 描画・更新ループ ──────────────────────────────────────

  private startRenderLoop(): void {
    const loop = () => {
      this.animationId = requestAnimationFrame(loop);
      this.update();
      this.renderer.render(this.scene, this.camera);
    };
    loop();
  }

  private update(): void {
    if (this.gameState.phase === 'paused') return;
    if (!this.gameState.isPlaying()) return;
    if (!this.board || !this.player) return;

    // ── タイムアタック タイマー ────────────────────────────
    if (this.currentMode === 'timeattack') {
      const now = performance.now();
      const delta = now - this.lastFrameTime;
      this.lastFrameTime = now;
      this.timeRemaining -= delta;

      const secLeft = Math.max(0, this.timeRemaining / 1000);
      this.hud.showTimer(secLeft, TIME_ATTACK_SECONDS);

      if (this.timeRemaining <= 0) {
        this.gameOver(); // 時間切れ
        return;
      }
    }

    // ── プレイヤー更新 ─────────────────────────────────────
    this.player.update();

    // ── ボード更新（新サイコロ追加） ───────────────────────
    const newDice = this.board.update(this.player.data.pos);
    if (newDice) this.boardRenderer.addDiceMesh(newDice);

    // ── 消去チェック遅延 ───────────────────────────────────
    if (this.pendingClearCheck && this.player.isIdle()) {
      this.clearCheckDelay--;
      if (this.clearCheckDelay <= 0) {
        this.pendingClearCheck = false;
        const started = this.chainManager.checkAndStartClearing();
        if (started) this.gameState.transition('clearing');
      }
    }

    // ── 消去アニメーション ─────────────────────────────────
    if (this.chainManager.getIsClearing()) {
      const stillClearing = this.chainManager.update();
      if (!stillClearing) {
        this.boardRenderer.syncAllDice();
        this.player.syncRidingState();
        this.gameState.transition('playing');

        // ゲームクリア判定: 全サイコロが消えた
        if (this.isBoardEmpty()) {
          this.gameClear();
          return;
        }
      }
    }

    // ── スコア更新 ─────────────────────────────────────────
    this.hud.updateScore(this.chainManager.score);

    // ── ゲームオーバー判定 ─────────────────────────────────
    if (!this.chainManager.getIsClearing() && this.board.isGameOver(this.player.data.pos)) {
      if (this.isPlayerStuck()) {
        this.gameOver();
        return;
      }
    }

    // ── 描画更新 ───────────────────────────────────────────
    this.boardRenderer.update();
    this.playerRenderer.update(this.player.data);
  }

  // ── 終了処理 ──────────────────────────────────────────────

  /** 全サイコロ（clearing含む）が盤面から消えたか */
  private isBoardEmpty(): boolean {
    return this.board.getAllDice().length === 0;
  }

  private isPlayerStuck(): boolean {
    const pos = this.player.data.pos;
    const dirs: Direction[] = ['north', 'south', 'east', 'west'];
    const dv: Record<Direction, { x: number; z: number }> = {
      north: { x: 0, z: -1 }, south: { x: 0, z: 1 },
      east:  { x: 1, z: 0 },  west:  { x: -1, z: 0 },
    };
    for (const dir of dirs) {
      const tp = { x: pos.x + dv[dir].x, z: pos.z + dv[dir].z };
      if (!this.board.isInBounds(tp)) continue;
      const dice = this.board.getDiceAt(tp);
      if (!dice || dice.clearing) return false;
      if (this.player.data.level === 'on_dice' && this.player.data.ridingDiceId !== null) return false;
      return false; // 地面からサイコロに登れる
    }
    return true;
  }

  private gameOver(): void {
    this.gameState.transition('gameover');
    this.audioManager.playGameOver();
    const { score, maxCombo, totalCleared } = this.chainManager.score;
    const isHS = this.saveHighScore(score);
    this.menu.showGameOver(score, maxCombo, totalCleared, isHS);
  }

  private gameClear(): void {
    this.gameState.transition('gameover');
    this.audioManager.playGameClear();
    const { score, maxCombo, totalCleared } = this.chainManager.score;
    const isHS = this.saveHighScore(score);
    this.menu.showGameClear(score, maxCombo, totalCleared, isHS);
  }

  // ── ハイスコア ────────────────────────────────────────────

  private loadHighScores() {
    const load = (key: string) => parseInt(localStorage.getItem(key) ?? '0', 10);
    return {
      endless:    load(HS_KEY.endless),
      timeattack: load(HS_KEY.timeattack),
      combo:      load(HS_KEY.combo),
    };
  }

  /** スコアを保存し、新記録なら true を返す */
  private saveHighScore(score: number): boolean {
    const key = HS_KEY[this.currentMode];
    const prev = parseInt(localStorage.getItem(key) ?? '0', 10);
    if (score > prev) {
      localStorage.setItem(key, score.toString());
      return true;
    }
    return false;
  }

  // ── モード選択画面へのハイスコア連携 ──────────────────────

  /** Menu.showModeSelect にハイスコアを渡すよう onStart コールバック前に呼ぶ */
  private showModeSelectWithScores(): void {
    this.menu.showModeSelect(this.loadHighScores());
  }

  // ── リサイズ ──────────────────────────────────────────────

  private onResize(): void {
    const { w, h } = this.getCanvasSize();
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    this.updateCameraPosition();
  }

  private cleanup(): void {
    if (this.boardRenderer) this.boardRenderer.dispose();
    if (this.playerRenderer) this.playerRenderer.dispose();
  }
}
