import "server-only";

import { getDatabase } from "@/infrastructure/database/client";
import type {
  Showcase,
  ShowcaseSaveInput,
  ShowcaseSlot,
} from "@/modules/showcase/domain";

interface ShowcaseRow {
  title: string;
}

interface ShowcaseSlotRow {
  id: number;
  label: string;
  position: number;
  work_id: number | null;
  work_title: string | null;
  cover_url: string | null;
}

export async function getShowcaseRecord(): Promise<Showcase> {
  const sql = getDatabase();
  const [showcaseRows, slotRows] = await Promise.all([
    sql`SELECT title FROM showcase WHERE id = 1`,
    sql`
      SELECT s.id, s.label, s.position, w.id AS work_id,
             w.title AS work_title, w.cover_url
      FROM showcase_slots s
      LEFT JOIN works w ON w.id = s.work_id
      WHERE s.showcase_id = 1
      ORDER BY s.position ASC, s.id ASC
    `,
  ]);

  const title = (showcaseRows as ShowcaseRow[])[0]?.title ?? "我的喜欢作品一览";
  const slots = (slotRows as ShowcaseSlotRow[]).map(
    (row): ShowcaseSlot => ({
      id: row.id,
      label: row.label,
      position: row.position,
      work:
        row.work_id !== null && row.work_title !== null
          ? {
              id: row.work_id,
              title: row.work_title,
              coverUrl: row.cover_url,
            }
          : null,
    }),
  );

  return { title, slots };
}

export async function replaceShowcaseRecord(
  input: ShowcaseSaveInput,
): Promise<void> {
  const sql = getDatabase();

  await sql.transaction((transaction) => [
    transaction`
      UPDATE showcase
      SET title = ${input.title}, updated_at = now()
      WHERE id = 1
    `,
    transaction`DELETE FROM showcase_slots WHERE showcase_id = 1`,
    ...input.slots.map(
      (slot, position) => transaction`
        INSERT INTO showcase_slots (showcase_id, label, work_id, position)
        VALUES (1, ${slot.label}, ${slot.workId}, ${position})
      `,
    ),
  ]);
}
