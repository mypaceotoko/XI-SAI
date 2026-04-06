/** キャラクターID */
export type CharacterId = 'ball' | 'insect' | 'tank';

/** キャラクター定義 */
export interface CharacterDef {
  id: CharacterId;
  name: string;
  description: string;
}

export const CHARACTER_LIST: readonly CharacterDef[] = [
  { id: 'ball',   name: 'レッドボール', description: 'スタンダードな基本キャラ' },
  { id: 'insect', name: 'グリーンアイ', description: '謎の一つ目昆虫型キャラ' },
  { id: 'tank',   name: 'タンクヘッド', description: '戦車に乗ったむちむちキャラ' },
] as const;

const CHAR_LS_KEY = 'xi_sai_character';

export function loadCharacter(): CharacterId {
  const saved = localStorage.getItem(CHAR_LS_KEY);
  if (saved === 'ball' || saved === 'insect' || saved === 'tank') return saved;
  return 'ball';
}

export function saveCharacter(id: CharacterId): void {
  localStorage.setItem(CHAR_LS_KEY, id);
}
