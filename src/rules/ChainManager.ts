import { Board } from '@/board/Board';
import { ScoreData, ClearGroup, DIR_VECTORS } from '@/types';
import { findClearableGroups, findHappyOneCandidates } from './MatchRule';
import { getTopFace } from '@/dice/Dice';

const CLEAR_ANIMATION_SPEED = 0.0016; // ~10秒で沈む

/**
 * 後乗せコンボの猶予ウィンドウ: アニメ速度に依存せず約500ms固定
 * 30フレーム × CLEAR_ANIMATION_SPEED = clearProgress 換算値
 */
const COMBO_GRACE_THRESHOLD = 30 * CLEAR_ANIMATION_SPEED; // ≈500ms

/** スコア計算のベースポイント */
const BASE_POINTS: Record<number, number> = {
  1: 200, // Happy One ボーナス
  2: 100,
  3: 150,
  4: 200,
  5: 300,
  6: 500,
};

/**
 * 連鎖・コンボ管理
 */
export class ChainManager {
  private board: Board;
  score: ScoreData;
  private currentClearGroups: ClearGroup[] = [];
  private onClear: ((groups: ClearGroup[]) => void) | null = null;
  private onChain: ((chainCount: number) => void) | null = null;
  private isClearing = false;

  constructor(board: Board) {
    this.board = board;
    this.score = this.createInitialScore();
  }

  private createInitialScore(): ScoreData {
    return {
      score: 0,
      combo: 0,
      chainCount: 0,
      maxCombo: 0,
      totalCleared: 0,
    };
  }

  /** スコアをリセット */
  resetScore(): void {
    this.score = this.createInitialScore();
    this.currentClearGroups = [];
    this.isClearing = false;
  }

  /** コールバック設定 */
  setCallbacks(
    onClear: (groups: ClearGroup[]) => void,
    onChain: (chainCount: number) => void,
  ): void {
    this.onClear = onClear;
    this.onChain = onChain;
  }

  /** 消去チェックを実行 */
  checkAndStartClearing(): boolean {
    const groups = findClearableGroups(this.board);
    if (groups.length === 0) {
      // 消去がなければコンボリセット
      if (!this.isClearing) {
        this.score.combo = 0;
      }
      return false;
    }

    this.startClearing(groups);
    return true;
  }

  /** 消去開始 */
  private startClearing(groups: ClearGroup[]): void {
    this.currentClearGroups = groups;
    this.isClearing = true;

    // 連鎖カウント
    this.score.chainCount++;
    this.score.combo += groups.length;
    if (this.score.combo > this.score.maxCombo) {
      this.score.maxCombo = this.score.combo;
    }

    // サイコロを消去状態にする
    for (const group of groups) {
      for (const id of group.diceIds) {
        const dice = this.board.getDiceById(id);
        if (dice) {
          dice.clearing = true;
          dice.clearProgress = 0;
        }
      }
    }

    // スコア計算
    for (const group of groups) {
      const basePoints = BASE_POINTS[group.faceValue] || 100;
      const chainMultiplier = this.score.chainCount;
      const groupBonus = group.diceIds.length > group.faceValue ? (group.diceIds.length - group.faceValue) * 50 : 0;
      this.score.score += (basePoints * group.diceIds.length + groupBonus) * chainMultiplier;
      this.score.totalCleared += group.diceIds.length;
    }

    this.onClear?.(groups);
    if (this.score.chainCount > 1) {
      this.onChain?.(this.score.chainCount);
    }
  }

  /**
   * 後乗せコンボ: 猶予ウィンドウ内の消去グループに隣接する
   * 同じ出目のサイコロを巻き込んで一緒に消す
   */
  private checkLateJoiners(): void {
    // clearProgress が猶予ウィンドウ内の消去中サイコロだけを対象にする
    const graceDice = this.board.getAllDice().filter(
      d => d.clearing && d.clearProgress < COMBO_GRACE_THRESHOLD,
    );
    if (graceDice.length === 0) return;

    const joined = new Set<number>(); // 今回のフレームで追加したIDの重複防止

    for (const clearing of graceDice) {
      const faceValue = getTopFace(clearing);

      for (const dv of Object.values(DIR_VECTORS)) {
        const neighborPos = {
          x: clearing.pos.x + dv.x,
          z: clearing.pos.z + dv.z,
        };
        const neighbor = this.board.getDiceAt(neighborPos);
        if (!neighbor) continue;
        if (neighbor.clearing) continue;       // すでに消去中
        if (neighbor.moving) continue;         // 移動完了を待つ
        if (joined.has(neighbor.id)) continue; // 今フレームで追加済み

        if (getTopFace(neighbor) === faceValue) {
          // 後乗せコンボ成立 — 消去グループへ追加
          neighbor.clearing = true;
          neighbor.clearProgress = 0;
          joined.add(neighbor.id);

          // スコア加算
          const basePoints = BASE_POINTS[faceValue] || 100;
          this.score.score += basePoints * Math.max(1, this.score.chainCount);
          this.score.totalCleared++;
          this.score.combo++;
          if (this.score.combo > this.score.maxCombo) {
            this.score.maxCombo = this.score.combo;
          }

          this.onClear?.([{
            diceIds: [neighbor.id],
            faceValue,
            isHappyOne: false,
          }]);
        }
      }
    }
  }

  /** 消去アニメーション更新 */
  update(): boolean {
    if (!this.isClearing) return false;

    // 後乗せコンボチェック（進行度更新より前に実行）
    this.checkLateJoiners();

    let allDone = true;
    const clearingDice = this.board.getAllDice().filter(d => d.clearing);

    for (const dice of clearingDice) {
      dice.clearProgress += CLEAR_ANIMATION_SPEED;
      if (dice.clearProgress < 1) {
        allDone = false;
      }
    }

    // Happy One チェック（消去中に隣接する1を検出）
    const happyOnes = findHappyOneCandidates(this.board);
    if (happyOnes.length > 0) {
      for (const group of happyOnes) {
        for (const id of group.diceIds) {
          const dice = this.board.getDiceById(id);
          if (dice && !dice.clearing) {
            dice.clearing = true;
            dice.clearProgress = 0;
            allDone = false;

            // Happy One スコア
            const basePoints = BASE_POINTS[1];
            this.score.score += basePoints * this.score.chainCount;
            this.score.totalCleared++;
          }
        }
      }
      this.onClear?.(happyOnes);
    }

    if (allDone) {
      // 消去完了 → サイコロを盤面から除去
      for (const dice of clearingDice) {
        if (dice.clearProgress >= 1) {
          this.board.removeDice(dice.id);
        }
      }

      this.isClearing = false;

      // 連鎖チェック: 消去後に新しい消去条件が成立するか
      const newGroups = findClearableGroups(this.board);
      if (newGroups.length > 0) {
        this.startClearing(newGroups);
        return true;
      }

      // 連鎖終了
      this.score.chainCount = 0;
      return false;
    }

    return true; // まだ消去中
  }

  /** 消去中かどうか */
  getIsClearing(): boolean {
    return this.isClearing;
  }
}
