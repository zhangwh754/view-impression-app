import type { MediaType } from "@/modules/catalog/domain";

export const SHOWCASE_MAX_SLOTS = 40;
export const SHOWCASE_MAX_TITLE_LENGTH = 60;
export const SHOWCASE_MAX_LABEL_LENGTH = 24;

export interface ShowcaseWorkSummary {
  id: number;
  title: string;
  coverUrl: string | null;
}

export interface ShowcaseWorkOption extends ShowcaseWorkSummary {
  originalTitle: string | null;
  type: MediaType;
  year: string | null;
  myRating: number | null;
  updatedAt: string;
  genres: string[];
}

export interface ShowcaseSlot {
  id: number;
  label: string;
  position: number;
  work: ShowcaseWorkSummary | null;
}

export interface Showcase {
  title: string;
  slots: ShowcaseSlot[];
}

export interface ShowcaseSaveInput {
  title: string;
  slots: Array<{
    label: string;
    workId: number | null;
  }>;
}
