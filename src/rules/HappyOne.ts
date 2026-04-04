/**
 * Happy One 演出管理
 * 1の目が特殊消去された時の演出情報
 */

export interface HappyOneEvent {
  diceId: number;
  x: number;
  z: number;
  timestamp: number;
}

export class HappyOneTracker {
  private events: HappyOneEvent[] = [];
  private maxAge = 2000; // 2秒間表示

  /** Happy One イベントを記録 */
  addEvent(diceId: number, x: number, z: number): void {
    this.events.push({
      diceId,
      x,
      z,
      timestamp: Date.now(),
    });
  }

  /** 有効なイベントを取得 */
  getActiveEvents(): HappyOneEvent[] {
    const now = Date.now();
    this.events = this.events.filter(e => now - e.timestamp < this.maxAge);
    return this.events;
  }

  /** リセット */
  clear(): void {
    this.events = [];
  }
}
