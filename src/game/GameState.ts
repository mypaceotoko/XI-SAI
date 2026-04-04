import { GamePhase } from '@/types';

/**
 * ゲーム状態管理
 */
export class GameState {
  phase: GamePhase = 'title';
  private listeners: ((phase: GamePhase) => void)[] = [];

  /** 状態遷移 */
  transition(newPhase: GamePhase): void {
    const oldPhase = this.phase;
    this.phase = newPhase;
    for (const listener of this.listeners) {
      listener(newPhase);
    }
  }

  /** リスナー登録 */
  onTransition(cb: (phase: GamePhase) => void): void {
    this.listeners.push(cb);
  }

  /** プレイ中か */
  isPlaying(): boolean {
    return this.phase === 'playing' || this.phase === 'clearing' || this.phase === 'chain';
  }

  /** プレイヤーが操作可能か */
  canPlayerAct(): boolean {
    return this.phase === 'playing';
  }
}
