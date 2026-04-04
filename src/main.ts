import { GameManager } from '@/game/GameManager';

// エントリポイント
const app = document.getElementById('app');
if (!app) throw new Error('App element not found');

new GameManager(app);
