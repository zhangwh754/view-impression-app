"use server";

import { isOwner } from "@/auth";
import type { ShowcaseSaveInput } from "@/modules/showcase/domain";
import {
  saveShowcase,
  ShowcaseValidationError,
} from "@/modules/showcase/service";
import { revalidatePath } from "next/cache";

export interface SaveShowcaseState {
  ok: boolean;
  message: string;
}

export async function saveShowcaseAction(
  input: ShowcaseSaveInput,
): Promise<SaveShowcaseState> {
  if (!(await isOwner())) {
    return { ok: false, message: "未授权，无法保存。" };
  }

  try {
    await saveShowcase(input);
    revalidatePath("/showcase");
    return { ok: true, message: "已保存。" };
  } catch (error) {
    if (error instanceof ShowcaseValidationError) {
      return { ok: false, message: error.message };
    }
    console.error("Failed to save showcase", error);
    return { ok: false, message: "保存失败，请稍后重试。" };
  }
}
