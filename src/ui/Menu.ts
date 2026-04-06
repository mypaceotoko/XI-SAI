import { GameMode } from '@/types';
import { CharacterId, CHARACTER_LIST } from '@/characters/CharacterDef';

/** ハイスコアレコード（モードごと） */
export interface HighScores {
  endless:    number;
  timeattack: number;
  combo:      number;
}

/**
 * メニュー画面（タイトル、キャラ選択、モード選択、ゲームオーバー、クリア、ポーズ）
 */
export class Menu {
  private container: HTMLElement;
  private onStart:           ((mode: GameMode) => void)  | null = null;
  private onRestart:         (() => void)                | null = null;
  private onResume:          (() => void)                | null = null;
  private getHighScores:     (() => HighScores)          | null = null;
  private onTitleStart:      (() => void)                | null = null;
  private onChangeCharacter: (() => void)                | null = null;

  constructor(parentEl: HTMLElement) {
    this.container = document.createElement('div');
    this.container.id = 'menu-overlay';
    this.container.innerHTML = `
      <style>
        #menu-overlay {
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: rgba(0, 0, 0, 0.78);
          backdrop-filter: blur(10px);
          z-index: 100;
          opacity: 0;
          transition: opacity 0.3s;
          pointer-events: none;
          overflow-y: auto;
        }
        #menu-overlay.visible { opacity: 1; pointer-events: auto; }

        .menu-title {
          font-size: 48px;
          font-weight: 900;
          background: linear-gradient(135deg, #00ffaa, #44aaff);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 6px;
          text-align: center;
        }
        .menu-subtitle {
          font-size: 15px;
          color: #888;
          margin-bottom: 28px;
          text-align: center;
        }
        .menu-content { text-align: center; padding: 0 16px 12px; }

        /* スコア表示 */
        .menu-score-big {
          font-size: 28px;
          color: #ffdd44;
          font-weight: 900;
          margin-bottom: 4px;
        }
        .menu-score-sub {
          font-size: 14px;
          color: #888;
          margin-bottom: 6px;
        }
        .menu-hs {
          font-size: 13px;
          color: #44ffaa;
          margin-bottom: 20px;
        }
        .menu-hs span { color: #fff; font-weight: bold; }

        /* ボタン */
        .menu-btn {
          display: inline-block;
          margin: 6px;
          padding: 12px 28px;
          font-size: 17px;
          font-weight: bold;
          color: #fff;
          background: linear-gradient(135deg, #00aa77, #0077aa);
          border: none;
          border-radius: 10px;
          cursor: pointer;
          transition: transform 0.1s, box-shadow 0.2s;
          touch-action: none;
          -webkit-tap-highlight-color: transparent;
          user-select: none;
        }
        .menu-btn:hover  { transform: scale(1.05); box-shadow: 0 0 20px rgba(0,170,119,0.5); }
        .menu-btn:active { transform: scale(0.95); }

        /* モード選択カード */
        .mode-grid {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-bottom: 12px;
          width: 100%;
          max-width: 320px;
        }
        .mode-card {
          background: rgba(255,255,255,0.07);
          border: 1px solid rgba(255,255,255,0.15);
          border-radius: 12px;
          padding: 12px 16px;
          cursor: pointer;
          text-align: left;
          transition: background 0.15s, border-color 0.15s, transform 0.1s;
          touch-action: none;
          -webkit-tap-highlight-color: transparent;
          user-select: none;
        }
        .mode-card:hover  { background: rgba(0,255,170,0.12); border-color: rgba(0,255,170,0.4); }
        .mode-card:active { transform: scale(0.97); }
        .mode-card-title  { font-size: 16px; font-weight: 800; color: #fff; margin-bottom: 3px; }
        .mode-card-desc   { font-size: 12px; color: #aaa; line-height: 1.4; }
        .mode-card-hs     { font-size: 11px; color: #44ffaa; margin-top: 4px; }
        .mode-card-hs span { color: #fff; font-weight: bold; }

        /* キャラクター選択 */
        .char-grid {
          display: flex;
          gap: 10px;
          margin-bottom: 16px;
          justify-content: center;
          flex-wrap: wrap;
          max-width: 400px;
        }
        .char-card {
          background: rgba(255,255,255,0.07);
          border: 2px solid rgba(255,255,255,0.15);
          border-radius: 14px;
          padding: 10px 8px 8px;
          cursor: pointer;
          text-align: center;
          transition: background 0.15s, border-color 0.15s, transform 0.1s, box-shadow 0.15s;
          touch-action: none;
          -webkit-tap-highlight-color: transparent;
          user-select: none;
          width: 108px;
          flex-shrink: 0;
        }
        .char-card:hover  { background: rgba(0,255,170,0.08); }
        .char-card:active { transform: scale(0.96); }
        .char-card.selected {
          border-color: rgba(0,255,170,0.75);
          background: rgba(0,255,170,0.13);
          box-shadow: 0 0 14px rgba(0,255,170,0.35);
        }
        .char-preview {
          width: 90px;
          height: 90px;
          border-radius: 10px;
          display: block;
          margin: 0 auto 6px;
          background: rgba(255,255,255,0.04);
        }
        .char-name { font-size: 12px; font-weight: 800; color: #fff; margin-bottom: 3px; }
        .char-desc { font-size: 10px; color: #aaa; line-height: 1.35; }

        /* クリア時タイトル */
        .menu-title-clear {
          font-size: 52px;
          font-weight: 900;
          background: linear-gradient(135deg, #ffdd44, #ff8844);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 6px;
          animation: clear-bounce 0.6s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
        }
        @keyframes clear-bounce {
          0%, 100% { transform: scale(1); }
          30%  { transform: scale(1.2); }
          50%  { transform: scale(0.95); }
          70%  { transform: scale(1.05); }
        }

        .menu-controls {
          margin-top: 20px;
          font-size: 12px;
          color: #555;
          line-height: 1.8;
        }
        .menu-controls kbd {
          background: rgba(255,255,255,0.1);
          padding: 1px 6px;
          border-radius: 4px;
          border: 1px solid rgba(255,255,255,0.2);
          font-family: monospace;
        }

        @media (max-width: 600px) {
          .menu-title  { font-size: 36px; }
          .menu-btn    { padding: 10px 22px; font-size: 15px; }
          .mode-grid   { max-width: 280px; }
          .menu-title-clear { font-size: 40px; }
          .char-card   { width: 90px; padding: 8px 6px 6px; }
          .char-preview { width: 74px; height: 74px; }
          .char-name   { font-size: 11px; }
        }
        @media (max-width: 380px) {
          .char-grid   { gap: 7px; }
          .char-card   { width: 80px; }
          .char-preview { width: 66px; height: 66px; }
        }
      </style>
      <div class="menu-content" id="menu-content"></div>
    `;
    parentEl.appendChild(this.container);
  }

  // ── コールバック設定 ──────────────────────────────────────────

  setCallbacks(
    onStart:           (mode: GameMode) => void,
    onRestart:         () => void,
    onResume:          () => void,
    getHighScores:     () => HighScores,
    onTitleStart:      () => void,
    onChangeCharacter: () => void,
  ): void {
    this.onStart           = onStart;
    this.onRestart         = onRestart;
    this.onResume          = onResume;
    this.getHighScores     = getHighScores;
    this.onTitleStart      = onTitleStart;
    this.onChangeCharacter = onChangeCharacter;
  }

  // ── 内部ユーティリティ ────────────────────────────────────────

  private content(): HTMLElement {
    return this.container.querySelector('#menu-content')!;
  }

  private bindBtn(selector: string, handler: () => void): void {
    const btn = this.container.querySelector(selector);
    if (!btn) return;
    btn.addEventListener('touchend', (e) => {
      e.preventDefault();
      handler();
    }, { passive: false } as EventListenerOptions);
    btn.addEventListener('click', handler);
  }

  private hsText(score: number): string {
    return score > 0 ? `BEST <span>${score.toLocaleString()}</span>` : 'BEST —';
  }

  // ── 画面定義 ──────────────────────────────────────────────────

  /** タイトル画面 */
  showTitle(): void {
    this.content().innerHTML = `
      <div class="menu-title">XI-SAI</div>
      <div class="menu-subtitle">3D Dice Puzzle Game</div>
      <button class="menu-btn" id="btn-start">START</button>
      <div class="menu-controls">
        <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> / 矢印キー 移動&nbsp;&nbsp;
        <kbd>Z</kbd> 降りる<br>
        <kbd>R</kbd> Restart&nbsp;&nbsp;<kbd>Esc</kbd> Pause
      </div>
    `;
    this.bindBtn('#btn-start', () => this.onTitleStart?.());
    this.show();
  }

  /** キャラクター選択画面 */
  showCharacterSelect(
    currentId: CharacterId,
    previews: Record<CharacterId, string>,
    onConfirm: (id: CharacterId) => void,
    onBack?: () => void,
  ): void {
    let selected: CharacterId = currentId;

    const cardHtml = CHARACTER_LIST.map(c => `
      <div class="char-card${c.id === currentId ? ' selected' : ''}" data-charid="${c.id}" id="char-${c.id}">
        <img class="char-preview" src="${previews[c.id]}" alt="${c.name}">
        <div class="char-name">${c.name}</div>
        <div class="char-desc">${c.description}</div>
      </div>
    `).join('');

    this.content().innerHTML = `
      <div class="menu-title" style="font-size:28px;margin-bottom:14px;">キャラクター選択</div>
      <div class="char-grid">${cardHtml}</div>
      <button class="menu-btn" id="btn-confirm-char" style="font-size:15px;padding:11px 26px;">
        このキャラでプレイ ▶
      </button>
      ${onBack ? '<button class="menu-btn" id="btn-back" style="background:rgba(60,60,60,0.7);font-size:13px;padding:8px 18px;">← BACK</button>' : ''}
    `;

    // カード選択
    this.container.querySelectorAll('.char-card').forEach(card => {
      const charId = card.getAttribute('data-charid') as CharacterId;
      const selectCard = () => {
        selected = charId;
        this.container.querySelectorAll('.char-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
      };
      card.addEventListener('touchend', (e) => { e.preventDefault(); selectCard(); }, { passive: false } as EventListenerOptions);
      card.addEventListener('click', selectCard);
    });

    this.bindBtn('#btn-confirm-char', () => onConfirm(selected));
    if (onBack) this.bindBtn('#btn-back', onBack);

    this.show();
  }

  /** モード選択画面 */
  showModeSelect(hs?: HighScores): void {
    const scores = hs ?? { endless: 0, timeattack: 0, combo: 0 };
    this.content().innerHTML = `
      <div class="menu-title" style="font-size:32px;margin-bottom:16px;">SELECT MODE</div>
      <div class="mode-grid">
        <div class="mode-card" id="mode-endless">
          <div class="mode-card-title">⬛ ENDLESS</div>
          <div class="mode-card-desc">制限なし。盤面が埋まるまで遊ぶ。</div>
          <div class="mode-card-hs">${this.hsText(scores.endless)}</div>
        </div>
        <div class="mode-card" id="mode-timeattack">
          <div class="mode-card-title">⏱ TIME ATTACK</div>
          <div class="mode-card-desc">60秒間でハイスコアを目指せ！</div>
          <div class="mode-card-hs">${this.hsText(scores.timeattack)}</div>
        </div>
        <div class="mode-card" id="mode-combo">
          <div class="mode-card-title">🔥 COMBO CHALLENGE</div>
          <div class="mode-card-desc">10コンボ達成でクリア！コンボが途切れないように。</div>
          <div class="mode-card-hs">${this.hsText(scores.combo)}</div>
        </div>
      </div>
      <button class="menu-btn" id="btn-back" style="background:rgba(80,80,80,0.7);font-size:14px;padding:8px 20px;">← BACK</button>
    `;
    this.bindBtn('#mode-endless',    () => this.onStart?.('endless'));
    this.bindBtn('#mode-timeattack', () => this.onStart?.('timeattack'));
    this.bindBtn('#mode-combo',      () => this.onStart?.('combo'));
    this.bindBtn('#btn-back', () => this.onTitleStart?.());
    this.show();
  }

  /** ゲームオーバー画面 */
  showGameOver(score: number, maxCombo: number, totalCleared: number, isHighScore = false): void {
    this.content().innerHTML = `
      <div class="menu-title" style="font-size:38px;background:linear-gradient(135deg,#ff4444,#aa2222);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;">GAME OVER</div>
      <div class="menu-score-big">${score.toLocaleString()}</div>
      <div class="menu-score-sub">MAX COMBO ${maxCombo} &nbsp;|&nbsp; CLEARED ${totalCleared}</div>
      ${isHighScore ? '<div class="menu-hs" style="color:#ffdd44;font-size:15px;animation:clear-bounce 0.6s both;">🏆 NEW HIGH SCORE!</div>' : ''}
      <button class="menu-btn" id="btn-retry">RETRY</button>
      <button class="menu-btn" id="btn-mode" style="background:rgba(60,60,100,0.8);font-size:14px;padding:8px 20px;">MODE SELECT</button>
      <button class="menu-btn" id="btn-change-char" style="background:rgba(40,80,60,0.8);font-size:14px;padding:8px 20px;">キャラ変更</button>
    `;
    this.bindBtn('#btn-retry',       () => this.onRestart?.());
    this.bindBtn('#btn-mode',        () => this.showModeSelect(this.getHighScores?.()));
    this.bindBtn('#btn-change-char', () => this.onChangeCharacter?.());
    this.show();
  }

  /** ゲームクリア画面 */
  showGameClear(score: number, maxCombo: number, totalCleared: number, isHighScore = false): void {
    this.content().innerHTML = `
      <div class="menu-title-clear">CLEAR!!</div>
      <div class="menu-score-big" style="color:#ffdd44;">${score.toLocaleString()}</div>
      <div class="menu-score-sub">MAX COMBO ${maxCombo} &nbsp;|&nbsp; CLEARED ${totalCleared}</div>
      ${isHighScore ? '<div class="menu-hs" style="color:#ffdd44;font-size:15px;">🏆 NEW HIGH SCORE!</div>' : ''}
      <button class="menu-btn" id="btn-retry" style="background:linear-gradient(135deg,#ffaa00,#ff6600);">PLAY AGAIN</button>
      <button class="menu-btn" id="btn-mode" style="background:rgba(60,60,100,0.8);font-size:14px;padding:8px 20px;">MODE SELECT</button>
      <button class="menu-btn" id="btn-change-char" style="background:rgba(40,80,60,0.8);font-size:14px;padding:8px 20px;">キャラ変更</button>
    `;
    this.bindBtn('#btn-retry',       () => this.onRestart?.());
    this.bindBtn('#btn-mode',        () => this.showModeSelect(this.getHighScores?.()));
    this.bindBtn('#btn-change-char', () => this.onChangeCharacter?.());
    this.show();
  }

  /** ポーズ画面 */
  showPause(): void {
    this.content().innerHTML = `
      <div class="menu-title" style="font-size:36px;">PAUSED</div>
      <button class="menu-btn" id="btn-resume">RESUME</button>
      <button class="menu-btn" id="btn-restart">RESTART</button>
    `;
    this.bindBtn('#btn-resume',  () => this.onResume?.());
    this.bindBtn('#btn-restart', () => this.onRestart?.());
    this.show();
  }

  show():    void { this.container.classList.add('visible'); }
  hide():    void { this.container.classList.remove('visible'); }
  dispose(): void { this.container.remove(); }
}
