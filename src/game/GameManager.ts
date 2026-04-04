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
  width: 7,
  depth: 7,
  initialDiceCount: 12,
  newDiceInterval: 300, // 約5秒ごと(60fpsで)
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
  }

  /** Three.js 初期化 */
  private initThree(): void {
    // レンダラー
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setClearColor(0x0a0a1a);
    this.appEl.appendChild(this.renderer.domElement);

    // シーン
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog(0x0a0a1a, 15, 25);

    // カメラ（見下ろし寄りの3D感ある角度）
    this.camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      100,
    );
    this.updateCameraPosition();

    // ライティング
    const ambientLight = new THREE.AmbientLight(0x334455, 0.8);
    this.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(5, 10, 5);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.set(1024, 1024);
    dirLight.shadow.camera.left = -10;
    dirLight.shadow.camera.right = 10;
    dirLight.shadow.camera.top = 10;
    dirLight.shadow.camera.bottom = -10;
    this.scene.add(dirLight);

    const pointLight = new THREE.PointLight(0x4488ff, 0.5, 20);
    pointLight.position.set(-3, 5, -3);
    this.scene.add(pointLight);

    // リサイズ対応
    window.addEventListener('resize', () => this.onResize());
  }

  private updateCameraPosition(): void {
    const cx = (BOARD_CONFIG.width - 1) / 2;
    const cz = (BOARD_CONFIG.depth - 1) / 2;
    this.camera.position.set(cx, 10, cz + 8);
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
        if (!this.player.isIdle()) return;
        this.handleMove(action.direction);
        break;
      case 'restart':
        this.restartGame();
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
    const targetDice = this.getTargetDice(direction);
    const moved = this.player.move(direction);

    if (moved) {
      if (targetDice) {
        this.audioManager.playPush();
        // 押したサイコロのテクスチャ更新
        this.boardRenderer.refreshDiceMaterial(targetDice);
      } else {
        this.audioManager.playMove();
      }
    }
  }

  /** 移動先のサイコロを取得 */
  private getTargetDice(direction: Direction) {
    const dv = { north: { x: 0, z: -1 }, south: { x: 0, z: 1 }, east: { x: 1, z: 0 }, west: { x: -1, z: 0 } }[direction];
    const targetPos = { x: this.player.data.pos.x + dv.x, z: this.player.data.pos.z + dv.z };
    return this.board.getDiceAt(targetPos);
  }

  /** ゲーム開始 */
  private startGame(): void {
    this.menu.hide();
    this.initGameObjects();
    this.gameState.transition('playing');
    this.startGameLoop();
  }

  /** ゲームリスタート */
  private restartGame(): void {
    this.menu.hide();
    this.cleanup();
    this.initGameObjects();
    this.gameState.transition('playing');
    this.startGameLoop();
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

    // ボード作成
    this.board = new Board(BOARD_CONFIG);
    this.board.init();

    // プレイヤー作成（盤面中央付近の空きマスに配置）
    const startPos = this.findEmptyPos();
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

  /** 空いているポジションを探す */
  private findEmptyPos() {
    const cx = Math.floor(BOARD_CONFIG.width / 2);
    const cz = Math.floor(BOARD_CONFIG.depth / 2);

    // 中央から近い順に空きマスを探す
    for (let r = 0; r < Math.max(BOARD_CONFIG.width, BOARD_CONFIG.depth); r++) {
      for (let dx = -r; dx <= r; dx++) {
        for (let dz = -r; dz <= r; dz++) {
          const pos = { x: cx + dx, z: cz + dz };
          if (this.board.isInBounds(pos) && this.board.isEmpty(pos)) {
            return pos;
          }
        }
      }
    }
    return { x: cx, z: cz };
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

  /** ゲームループ開始 */
  private startGameLoop(): void {
    const loop = () => {
      this.animationId = requestAnimationFrame(loop);
      this.update();
      this.render();
    };
    loop();
  }

  /** フレーム更新 */
  private update(): void {
    if (this.gameState.phase === 'paused') return;

    if (!this.gameState.isPlaying()) return;

    // プレイヤー更新
    this.player.update();

    // ボード更新（新サイコロ追加など）
    const newDice = this.board.update();
    if (newDice) {
      this.boardRenderer.addDiceMesh(newDice);
    }

    // 消去チェック
    if (this.chainManager.getIsClearing()) {
      // 消去アニメーション中
      const stillClearing = this.chainManager.update();
      if (!stillClearing) {
        // 消去完了 → Meshを同期
        this.boardRenderer.syncAllDice();
        this.gameState.transition('playing');
      }
    } else if (this.player.isIdle()) {
      // プレイヤーが止まった時に消去チェック
      const started = this.chainManager.checkAndStartClearing();
      if (started) {
        this.gameState.transition('clearing');
      }
    }

    // スコア更新
    this.hud.updateScore(this.chainManager.score);

    // ゲームオーバーチェック
    if (this.board.isBoardFull() && !this.chainManager.getIsClearing()) {
      this.gameOver();
    }

    // 描画更新
    this.boardRenderer.update();
    this.playerRenderer.update(this.player.data);
  }

  /** 描画 */
  private render(): void {
    this.renderer.render(this.scene, this.camera);
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
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    if (this.boardRenderer) this.boardRenderer.dispose();
    if (this.playerRenderer) this.playerRenderer.dispose();
  }
}
