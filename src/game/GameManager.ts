import * as THREE from 'three';
import { BoardConfig, Direction, ClearGroup } from '@/types';
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

const BOARD_CONFIG: BoardConfig = {
  width: 8,
  depth: 8,
  initialEmptyCount: 6,     // 最初の空きマス数
  newDiceInterval: 360,      // 約6秒ごと(60fpsで)
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

  // 消去後のチェック遅延
  private pendingClearCheck = false;
  private clearCheckDelay = 0;

  constructor(appEl: HTMLElement) {
    this.appEl = appEl;
    this.gameState = new GameState();
    this.happyOneTracker = new HappyOneTracker();
    this.inputManager = new InputManager();
    this.audioManager = new AudioManager();

    this.initThree();
    this.initUI();
    this.initInput();

    // タイトル画面表示
    this.menu.showTitle();

    // 背景だけ描画するループ
    this.startRenderLoop();
  }

  /** Three.js 初期化 */
  private initThree(): void {
    let lastTouchEnd = 0;
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setClearColor(0x080810);
    this.appEl.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x080810, 0.04);

    // カメラ（XIのような斜め見下ろしアングル）
    this.camera = new THREE.PerspectiveCamera(
      40,
      window.innerWidth / window.innerHeight,
      0.1,
      100,
    );
    this.updateCameraPosition();

    // ライティング
    const ambientLight = new THREE.AmbientLight(0x445566, 1.0);
    this.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffeedd, 1.5);
    dirLight.position.set(8, 12, 6);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.set(2048, 2048);
    dirLight.shadow.camera.left = -12;
    dirLight.shadow.camera.right = 12;
    dirLight.shadow.camera.top = 12;
    dirLight.shadow.camera.bottom = -12;
    this.scene.add(dirLight);

    // バックライト
    const backLight = new THREE.DirectionalLight(0x4466aa, 0.4);
    backLight.position.set(-5, 8, -5);
    this.scene.add(backLight);

    // リサイズ対応
    window.addEventListener('resize', () => this.onResize());

    // モバイルのピンチズームを完全に防止
    const preventZoom = (e: Event) => e.preventDefault();
    // Safari iOS のジェスチャーイベント
    document.addEventListener('gesturestart', preventZoom, { passive: false });
    document.addEventListener('gesturechange', preventZoom, { passive: false });
    document.addEventListener('gestureend', preventZoom, { passive: false });
    // マルチタッチ (Android / 標準ブラウザ)
    document.addEventListener('touchmove', (e: TouchEvent) => {
      if (e.touches.length > 1) e.preventDefault();
    }, { passive: false });
    // ダブルタップによるズームをリセット (ズーム済みの場合に強制的に戻す)
    document.addEventListener('touchend', (e: TouchEvent) => {
      const now = Date.now();
      if (now - lastTouchEnd < 300) e.preventDefault();
      lastTouchEnd = now;
    }, { passive: false });
  }

  private updateCameraPosition(): void {
    const cx = (BOARD_CONFIG.width - 1) / 2;
    const cz = (BOARD_CONFIG.depth - 1) / 2;
    // XIのような斜め上からの視点
    this.camera.position.set(cx + 6, 11, cz + 10);
    this.camera.lookAt(cx, 0, cz);
  }

  /** UI初期化 */
  private initUI(): void {
    this.hud = new HUD(this.appEl);
    this.menu = new Menu(this.appEl);
    this.virtualPad = new VirtualPad(this.appEl);

    this.menu.setCallbacks(
      () => this.startGame(),
      () => this.restartGame(),
      () => this.resumeGame(),
    );
  }

  /** 入力初期化 */
  private initInput(): void {
    this.inputManager.setCallback((action: InputAction) => {
      this.handleInput(action);
    });

    this.virtualPad.setCallback((direction: Direction) => {
      this.handleInput({ type: 'move', direction });
    });
  }

  /** 入力処理 */
  private handleInput(action: InputAction): void {
    switch (action.type) {
      case 'move':
        if (!this.gameState.canPlayerAct()) return;
        if (!this.player || !this.player.isIdle()) return;
        this.handleMove(action.direction);
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

  /** 移動処理 */
  private handleMove(direction: Direction): void {
    const moveType = this.player.move(direction);

    if (moveType) {
      switch (moveType) {
        case 'ride_roll':
          this.audioManager.playPush();
          // 転がしたサイコロのテクスチャ更新
          if (this.player.data.ridingDiceId !== null) {
            const dice = this.board.getDiceById(this.player.data.ridingDiceId);
            if (dice) {
              this.boardRenderer.refreshDiceMaterial(dice);
            }
          }
          // 転がした後に消去チェックを予約
          this.pendingClearCheck = true;
          this.clearCheckDelay = 10;
          break;
        case 'climb':
        case 'descend':
          this.audioManager.playMove();
          break;
        case 'walk':
          this.audioManager.playMove();
          break;
      }
    }
  }

  /** ゲーム開始 */
  private startGame(): void {
    this.menu.hide();
    this.initGameObjects();
    this.gameState.transition('playing');
  }

  /** ゲームリスタート */
  private restartGame(): void {
    this.menu.hide();
    this.cleanup();
    this.initGameObjects();
    this.gameState.transition('playing');
  }

  /** ポーズ */
  private pauseGame(): void {
    this.gameState.transition('paused');
    this.menu.showPause();
  }

  /** 再開 */
  private resumeGame(): void {
    this.menu.hide();
    this.gameState.transition('playing');
  }

  /** ゲームオブジェクト初期化 */
  private initGameObjects(): void {
    resetDiceIdCounter();
    this.happyOneTracker.clear();
    this.pendingClearCheck = false;

    // ボード作成（サイコロで埋まった盤面）
    this.board = new Board(BOARD_CONFIG);
    const emptyPositions = this.board.init();

    // プレイヤーを空きマスの中央寄りに配置
    const cx = Math.floor(BOARD_CONFIG.width / 2);
    const cz = Math.floor(BOARD_CONFIG.depth / 2);
    let startPos = emptyPositions[0] || { x: cx, z: cz };

    // 中央に最も近い空きマスを選ぶ
    let bestDist = Infinity;
    for (const pos of emptyPositions) {
      const dist = Math.abs(pos.x - cx) + Math.abs(pos.z - cz);
      if (dist < bestDist) {
        bestDist = dist;
        startPos = pos;
      }
    }

    this.player = new Player(this.board, startPos);

    // チェーンマネージャー
    this.chainManager = new ChainManager(this.board);
    this.chainManager.setCallbacks(
      (groups: ClearGroup[]) => this.onClearStart(groups),
      (chainCount: number) => this.onChain(chainCount),
    );

    // レンダラー
    this.boardRenderer = new BoardRenderer(this.scene, this.board);
    this.boardRenderer.init();
    this.playerRenderer = new PlayerRenderer(this.scene);

    // HUD初期化
    this.hud.updateScore(this.chainManager.score);
  }

  /** 消去開始コールバック */
  private onClearStart(groups: ClearGroup[]): void {
    let hasHappyOne = false;
    for (const g of groups) {
      if (g.isHappyOne) {
        hasHappyOne = true;
        for (const id of g.diceIds) {
          const dice = this.board.getDiceById(id);
          if (dice) {
            this.happyOneTracker.addEvent(id, dice.pos.x, dice.pos.z);
          }
        }
      }
    }

    if (hasHappyOne) {
      this.hud.showNotification('HAPPY ONE!', true);
      this.audioManager.playHappyOne();
    } else {
      this.audioManager.playClear(this.chainManager.score.chainCount);
    }
  }

  /** 連鎖コールバック */
  private onChain(chainCount: number): void {
    this.hud.showNotification(`${chainCount} CHAIN!`);
    this.audioManager.playCombo(chainCount);
  }

  /** 描画ループ（常時動作） */
  private startRenderLoop(): void {
    const loop = () => {
      this.animationId = requestAnimationFrame(loop);
      this.update();
      this.renderer.render(this.scene, this.camera);
    };
    loop();
  }

  /** フレーム更新 */
  private update(): void {
    if (this.gameState.phase === 'paused') return;
    if (!this.gameState.isPlaying()) return;
    if (!this.board || !this.player) return;

    // プレイヤー更新
    this.player.update();

    // ボード更新（新サイコロ追加など）
    const newDice = this.board.update(this.player.data.pos);
    if (newDice) {
      this.boardRenderer.addDiceMesh(newDice);
    }

    // 消去チェック遅延処理
    if (this.pendingClearCheck && this.player.isIdle()) {
      this.clearCheckDelay--;
      if (this.clearCheckDelay <= 0) {
        this.pendingClearCheck = false;
        const started = this.chainManager.checkAndStartClearing();
        if (started) {
          this.gameState.transition('clearing');
        }
      }
    }

    // 消去アニメーション処理
    if (this.chainManager.getIsClearing()) {
      const stillClearing = this.chainManager.update();
      if (!stillClearing) {
        // 消去完了 → Meshを同期
        this.boardRenderer.syncAllDice();
        // プレイヤーの乗り状態を再チェック（乗っていたサイコロが消えた場合）
        this.player.syncRidingState();
        this.gameState.transition('playing');
      }
    }

    // スコア更新
    this.hud.updateScore(this.chainManager.score);

    // ゲームオーバーチェック
    if (!this.chainManager.getIsClearing() && this.board.isGameOver(this.player.data.pos)) {
      // プレイヤーが動けるか最終チェック
      if (this.isPlayerStuck()) {
        this.gameOver();
      }
    }

    // 描画更新
    this.boardRenderer.update();
    this.playerRenderer.update(this.player.data);
  }

  /** プレイヤーが完全に動けないかチェック */
  private isPlayerStuck(): boolean {
    const pos = this.player.data.pos;
    const directions: Direction[] = ['north', 'south', 'east', 'west'];

    for (const dir of directions) {
      const dv = { north: { x: 0, z: -1 }, south: { x: 0, z: 1 }, east: { x: 1, z: 0 }, west: { x: -1, z: 0 } }[dir];
      const targetPos = { x: pos.x + dv.x, z: pos.z + dv.z };

      if (!this.board.isInBounds(targetPos)) continue;

      const diceAtTarget = this.board.getDiceAt(targetPos);

      if (!diceAtTarget) {
        // 空きマスがある→移動可能
        return false;
      }

      if (this.player.data.level === 'on_dice' || this.player.data.level === 'ground') {
        // サイコロの上にいる場合: 隣のサイコロに乗り移れる
        // または隣のサイコロを転がせるか（さらにその先が空き）
        if (this.player.data.level === 'on_dice' && this.player.data.ridingDiceId !== null) {
          // 乗っているサイコロの先が空いていれば転がせる
          // ただし乗り移りは常にOK
          return false; // 隣にサイコロがあれば乗り移れる
        }
        return false; // 地面からサイコロに登れる
      }
    }

    return true; // どの方向にも移動できない
  }

  /** ゲームオーバー */
  private gameOver(): void {
    this.gameState.transition('gameover');
    this.audioManager.playGameOver();
    const { score, maxCombo, totalCleared } = this.chainManager.score;
    this.menu.showGameOver(score, maxCombo, totalCleared);
  }

  /** リサイズ処理 */
  private onResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  /** クリーンアップ */
  private cleanup(): void {
    if (this.boardRenderer) this.boardRenderer.dispose();
    if (this.playerRenderer) this.playerRenderer.dispose();
  }
}
