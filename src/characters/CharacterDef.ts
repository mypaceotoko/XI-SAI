/** キャラクターID */
export type CharacterId = 'ball' | 'insect' | 'tank' | 'bird' | 'mypace';

/** キャラクター定義 */
export interface CharacterDef {
  id: CharacterId;
  name: string;
  description: string;
  isNew?: boolean;
  isHidden?: boolean;
}

export const CHARACTER_LIST: readonly CharacterDef[] = [
  { id: 'ball',   name: 'レッドボール',   description: 'スタンダードな基本キャラ' },
  { id: 'insect', name: 'グリーンアイ',   description: '謎の一つ目昆虫型キャラ' },
  { id: 'tank',   name: 'タンクヘッド',   description: '戦車に乗ったむちむちキャラ' },
  { id: 'bird',   name: 'バードレイザー', description: '高速・アグレッシブな鳥型キャラ', isNew: true },
  { id: 'mypace', name: 'マイペース男',   description: 'このゲームの制作者', isHidden: true },
] as const;

const CHAR_LS_KEY = 'xi_sai_character';

export function loadCharacter(): CharacterId {
  const saved = localStorage.getItem(CHAR_LS_KEY);
  if (saved === 'ball' || saved === 'insect' || saved === 'tank' || saved === 'bird' || saved === 'mypace') return saved;
  return 'ball';
}

export function saveCharacter(id: CharacterId): void {
  localStorage.setItem(CHAR_LS_KEY, id);
}
