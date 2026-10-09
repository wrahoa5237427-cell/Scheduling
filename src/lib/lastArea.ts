import type { AreaId } from '../types.ts';
import { AREA_IDS } from './areas.ts';

const KEY = 'lichhoc.lastArea';

export function readLastArea(): AreaId {
  try {
    const v = window.localStorage.getItem(KEY);
    if (v && (AREA_IDS as string[]).includes(v)) return v as AreaId;
  } catch {
    /* localStorage bị chặn: dùng mặc định */
  }
  return 'school';
}

export function rememberArea(id: AreaId): void {
  try {
    window.localStorage.setItem(KEY, id);
  } catch {
    /* bỏ qua */
  }
}
