import type { Area, AreaId } from '../types.ts';

// Khớp với bảng public.areas được seed trong migration.
export const AREAS: Area[] = [
  { id: 'school', name: 'School' },
  { id: 'ielts', name: 'IELTS' },
  { id: 'math_hsg', name: 'Math HSG' },
  { id: 'review', name: 'Review' },
  { id: 'coding', name: 'Coding' },
];

export const AREA_IDS: AreaId[] = AREAS.map((a) => a.id);

export function areaName(id: AreaId): string {
  return AREAS.find((a) => a.id === id)?.name ?? id;
}
