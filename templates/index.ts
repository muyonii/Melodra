import type { Template } from '../src/types/poster';
import { albumWallTemplate } from './album-wall';
import { editorialVinylTemplate } from './editorial-vinyl';
import { glassPlayerTemplate } from './glass-player';
import { minimalCoverTemplate } from './minimal-cover';
import { minimalSleeveTemplate } from './minimal-sleeve';
import { mixtapeTemplate } from './mixtape';
import { receiptTemplate } from './receipt';
import { tracklistTemplate } from './tracklist';
import { vinylTemplate } from './vinyl';

export const templates: Template[] = [
  glassPlayerTemplate,
  minimalCoverTemplate,
  vinylTemplate,
  receiptTemplate,
  editorialVinylTemplate,
  minimalSleeveTemplate,
  tracklistTemplate,
  albumWallTemplate,
  mixtapeTemplate,
];

export function getTemplateById(id: string): Template {
  return templates.find((t) => t.id === id) ?? templates[0];
}
