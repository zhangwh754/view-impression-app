"use client";

import { saveShowcaseAction } from "@/app/showcase/actions";
import { MEDIA_TYPE_LABELS, type MediaType } from "@/modules/catalog/domain";
import {
  SHOWCASE_MAX_LABEL_LENGTH,
  SHOWCASE_MAX_SLOTS,
  SHOWCASE_MAX_TITLE_LENGTH,
  type Showcase,
  type ShowcaseWorkOption,
  type ShowcaseWorkSummary,
} from "@/modules/showcase/domain";
import { toPng } from "html-to-image";
import Image from "next/image";
import Link from "next/link";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";

interface DraftSlot {
  key: string;
  label: string;
  work: ShowcaseWorkSummary | ShowcaseWorkOption | null;
}

interface Feedback {
  ok: boolean;
  message: string;
}

const TRANSPARENT_PIXEL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADElEQVR42mNk+M/wHwAF/gL+Avm7AAAAAElFTkSuQmCC";

function PosterImage({
  work,
  sizes,
}: {
  work: ShowcaseWorkSummary;
  sizes: string;
}) {
  const [failed, setFailed] = useState(false);

  if (!work.coverUrl || failed) {
    return (
      <div className="flex h-full items-center justify-center bg-stone-200 px-4 text-center text-sm text-stone-500">
        无封面
      </div>
    );
  }

  return (
    <Image
      src={work.coverUrl}
      alt={work.title}
      fill
      sizes={sizes}
      loading="eager"
      className="object-cover"
      onError={() => setFailed(true)}
    />
  );
}

function ShowcaseCard({
  slot,
  owner,
  index,
  total,
  onPick,
  onLabelChange,
  onMove,
  onDelete,
}: {
  slot: DraftSlot;
  owner: boolean;
  index: number;
  total: number;
  onPick: () => void;
  onLabelChange: (label: string) => void;
  onMove: (direction: -1 | 1) => void;
  onDelete: () => void;
}) {
  const poster = (
    <div className="relative aspect-[2/3] overflow-hidden rounded-xl bg-stone-200">
      {slot.work ? (
        <PosterImage
          key={`${slot.key}-${slot.work.coverUrl ?? "none"}`}
          work={slot.work}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 240px"
        />
      ) : (
        <div className="flex h-full flex-col items-center justify-center gap-3 border-2 border-dashed border-stone-300 bg-stone-100 px-4 text-center text-stone-500">
          <span className="text-3xl leading-none">+</span>
          <span className="text-sm">点击选择作品</span>
        </div>
      )}
    </div>
  );

  return (
    <article className="rounded-2xl border border-stone-200 bg-white p-3 shadow-sm">
      {owner ? (
        <>
          <div className="mb-3 flex items-center gap-1">
            <input
              value={slot.label}
              maxLength={SHOWCASE_MAX_LABEL_LENGTH}
              aria-label={`第 ${index + 1} 个分类名`}
              onChange={(event) => onLabelChange(event.target.value)}
              className="min-w-0 flex-1 rounded-md border border-stone-200 bg-stone-50 px-2 py-1.5 text-sm font-semibold text-stone-800 outline-none focus:border-stone-500"
            />
            <button
              type="button"
              disabled={index === 0}
              onClick={() => onMove(-1)}
              title="向前移动"
              aria-label={`向前移动${slot.label}`}
              className="rounded-md px-2 py-1.5 text-stone-500 hover:bg-stone-100 disabled:opacity-25"
            >
              ←
            </button>
            <button
              type="button"
              disabled={index === total - 1}
              onClick={() => onMove(1)}
              title="向后移动"
              aria-label={`向后移动${slot.label}`}
              className="rounded-md px-2 py-1.5 text-stone-500 hover:bg-stone-100 disabled:opacity-25"
            >
              →
            </button>
            <button
              type="button"
              onClick={onDelete}
              title="删除分类"
              aria-label={`删除${slot.label}`}
              className="rounded-md px-2 py-1.5 text-red-500 hover:bg-red-50"
            >
              ×
            </button>
          </div>
          <button
            type="button"
            onClick={onPick}
            className="block w-full text-left outline-none focus-visible:ring-2 focus-visible:ring-stone-500 focus-visible:ring-offset-2"
          >
            {poster}
            <p className="mt-3 truncate text-sm font-medium text-stone-900">
              {slot.work?.title ?? "待选择"}
            </p>
          </button>
        </>
      ) : slot.work ? (
        <Link
          href={`/work/${slot.work.id}`}
          className="block outline-none focus-visible:ring-2 focus-visible:ring-stone-500 focus-visible:ring-offset-2"
        >
          <p className="mb-3 text-sm font-semibold text-stone-700">
            {slot.label}
          </p>
          {poster}
          <p className="mt-3 truncate text-sm font-medium text-stone-900">
            {slot.work.title}
          </p>
        </Link>
      ) : null}
    </article>
  );
}

function ExportCanvas({
  title,
  slots,
  canvasRef,
}: {
  title: string;
  slots: DraftSlot[];
  canvasRef: React.RefObject<HTMLDivElement | null>;
}) {
  const filledSlots = slots.filter((slot) => slot.work !== null);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed left-[-10000px] top-0"
    >
      <div
        ref={canvasRef}
        style={{
          width: 800,
          background: "#f3eee3",
          color: "#201f1b",
          padding: "54px 44px 48px",
          fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
        }}
      >
        <div
          style={{
            borderTop: "5px solid #201f1b",
            borderBottom: "1px solid #8f887b",
            padding: "25px 0 22px",
            marginBottom: 30,
          }}
        >
          <div style={{ fontSize: 42, fontWeight: 800, lineHeight: 1.15 }}>
            {title.trim() || "我的喜欢作品一览"}
          </div>
          <div
            style={{
              marginTop: 11,
              color: "#746e63",
              fontSize: 13,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
            }}
          >
            FAVORITE WORKS COLLECTION
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
            gap: "26px 16px",
          }}
        >
          {filledSlots.map((slot) => (
            <div key={slot.key} style={{ minWidth: 0 }}>
              <div
                style={{
                  display: "inline-block",
                  maxWidth: "100%",
                  marginBottom: 8,
                  border: "1px solid #332f29",
                  padding: "4px 8px",
                  fontSize: 12,
                  fontWeight: 700,
                  lineHeight: 1.2,
                }}
              >
                {slot.label}
              </div>
              <div
                style={{
                  position: "relative",
                  width: "100%",
                  aspectRatio: "2 / 3",
                  overflow: "hidden",
                  background: "#ddd5c7",
                }}
              >
                {slot.work && (
                  <PosterImage
                    key={`export-${slot.key}-${slot.work.coverUrl ?? "none"}`}
                    work={slot.work}
                    sizes="178px"
                  />
                )}
              </div>
              <div
                style={{
                  marginTop: 9,
                  minHeight: 38,
                  fontSize: 15,
                  fontWeight: 700,
                  lineHeight: 1.25,
                  overflowWrap: "anywhere",
                }}
              >
                {slot.work?.title}
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            marginTop: 38,
            borderTop: "1px solid #8f887b",
            paddingTop: 13,
            color: "#746e63",
            fontSize: 12,
            letterSpacing: "0.08em",
          }}
        >
          {filledSlots.length} PICKS · PERSONAL ARCHIVE
        </div>
      </div>
    </div>
  );
}

function safeFilename(value: string): string {
  return (
    value
      .trim()
      .replace(/[<>:"/\\|?*\u0000-\u001F]/g, "-")
      .replace(/\s+/g, " ")
      .slice(0, 50) || "我的喜欢作品一览"
  );
}

async function waitForImages(node: HTMLElement): Promise<void> {
  const images = Array.from(node.querySelectorAll("img"));
  await Promise.all(
    images.map(async (image) => {
      if (image.complete) {
        try {
          await image.decode();
        } catch {
          // Failed posters are replaced visually by the component fallback.
        }
        return;
      }
      await new Promise<void>((resolve) => {
        image.addEventListener("load", () => resolve(), { once: true });
        image.addEventListener("error", () => resolve(), { once: true });
      });
    }),
  );
}

export default function ShowcaseEditor({
  initialShowcase,
  availableWorks,
  owner,
}: {
  initialShowcase: Showcase;
  availableWorks: ShowcaseWorkOption[];
  owner: boolean;
}) {
  const nextKey = useRef(0);
  const exportRef = useRef<HTMLDivElement>(null);
  const [title, setTitle] = useState(initialShowcase.title);
  const [slots, setSlots] = useState<DraftSlot[]>(() =>
    initialShowcase.slots.map((slot) => ({
      key: `saved-${slot.id}`,
      label: slot.label,
      work: slot.work,
    })),
  );
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<MediaType | "">("");
  const [dirty, setDirty] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [exporting, setExporting] = useState(false);
  const [isSaving, startSaving] = useTransition();

  const shownSlots = owner ? slots : slots.filter((slot) => slot.work !== null);
  const filledSlots = slots.filter((slot) => slot.work !== null);
  const selectedSlot = slots.find((slot) => slot.key === selectedKey) ?? null;

  const filteredWorks = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("zh-CN");
    return availableWorks.filter((work) => {
      const matchesType = !typeFilter || work.type === typeFilter;
      const matchesQuery =
        !normalizedQuery ||
        work.title.toLocaleLowerCase("zh-CN").includes(normalizedQuery) ||
        work.originalTitle
          ?.toLocaleLowerCase("zh-CN")
          .includes(normalizedQuery);
      return matchesType && matchesQuery;
    });
  }, [availableWorks, query, typeFilter]);

  useEffect(() => {
    if (!selectedKey) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelectedKey(null);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [selectedKey]);

  function markDirty() {
    setDirty(true);
    setFeedback(null);
  }

  function changeSlot(key: string, update: (slot: DraftSlot) => DraftSlot) {
    setSlots((current) =>
      current.map((slot) => (slot.key === key ? update(slot) : slot)),
    );
    markDirty();
  }

  function moveSlot(index: number, direction: -1 | 1) {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= slots.length) return;
    setSlots((current) => {
      const next = [...current];
      [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
      return next;
    });
    markDirty();
  }

  function openPicker(key: string) {
    setSelectedKey(key);
    setQuery("");
    setTypeFilter("");
  }

  function save() {
    const emptyLabel = slots.some((slot) => !slot.label.trim());
    if (!title.trim()) {
      setFeedback({ ok: false, message: "请填写主标题。" });
      return;
    }
    if (emptyLabel) {
      setFeedback({ ok: false, message: "分类名不能为空。" });
      return;
    }

    startSaving(async () => {
      const result = await saveShowcaseAction({
        title,
        slots: slots.map((slot) => ({
          label: slot.label,
          workId: slot.work?.id ?? null,
        })),
      });
      setFeedback(result);
      if (result.ok) setDirty(false);
    });
  }

  async function downloadPng() {
    if (!exportRef.current || filledSlots.length === 0) return;
    setExporting(true);
    setFeedback(null);
    try {
      await document.fonts?.ready;
      await waitForImages(exportRef.current);
      const dataUrl = await toPng(exportRef.current, {
        backgroundColor: "#f3eee3",
        cacheBust: true,
        imagePlaceholder: TRANSPARENT_PIXEL,
        pixelRatio: 2,
        skipFonts: true,
      });
      const link = document.createElement("a");
      link.download = `${safeFilename(title)}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error("Failed to export showcase", error);
      setFeedback({
        ok: false,
        message: "PNG 生成失败，请确认封面加载完成后重试。",
      });
    } finally {
      setExporting(false);
    }
  }

  return (
    <>
      <section className="rounded-3xl bg-[#f3eee3] px-4 py-6 text-stone-900 sm:px-7 sm:py-8">
        <div className="mb-8 flex flex-col gap-5 border-y border-stone-400 py-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0 flex-1">
            {owner ? (
              <input
                value={title}
                maxLength={SHOWCASE_MAX_TITLE_LENGTH}
                aria-label="榜单主标题"
                onChange={(event) => {
                  setTitle(event.target.value);
                  markDirty();
                }}
                className="w-full border-0 border-b border-transparent bg-transparent px-0 py-1 text-3xl font-black tracking-tight outline-none transition hover:border-stone-400 focus:border-stone-900 sm:text-4xl"
              />
            ) : (
              <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
                {title}
              </h1>
            )}
            <p className="mt-2 text-xs tracking-[0.22em] text-stone-500">
              FAVORITE WORKS COLLECTION
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {owner && (
              <button
                type="button"
                onClick={save}
                disabled={isSaving || !dirty}
                className="rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-45"
              >
                {isSaving ? "保存中…" : dirty ? "保存更改" : "已保存"}
              </button>
            )}
            <button
              type="button"
              onClick={downloadPng}
              disabled={exporting || filledSlots.length === 0}
              className="rounded-lg border border-stone-400 bg-white/60 px-4 py-2 text-sm font-medium transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-45"
            >
              {exporting ? "生成中…" : "下载 PNG"}
            </button>
          </div>
        </div>

        {feedback && (
          <p
            role="status"
            className={`mb-5 rounded-lg px-4 py-3 text-sm ${
              feedback.ok
                ? "bg-emerald-100 text-emerald-800"
                : "bg-red-100 text-red-700"
            }`}
          >
            {feedback.message}
          </p>
        )}

        {shownSlots.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {shownSlots.map((slot, index) => (
              <ShowcaseCard
                key={slot.key}
                slot={slot}
                owner={owner}
                index={index}
                total={slots.length}
                onPick={() => openPicker(slot.key)}
                onLabelChange={(label) =>
                  changeSlot(slot.key, (current) => ({ ...current, label }))
                }
                onMove={(direction) => moveSlot(index, direction)}
                onDelete={() => {
                  setSlots((current) =>
                    current.filter((currentSlot) => currentSlot.key !== slot.key),
                  );
                  markDirty();
                }}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-stone-400 py-20 text-center text-stone-500">
            {owner ? "还没有分类，先添加一个吧。" : "还没有已填写的作品。"}
          </div>
        )}

        {owner && (
          <button
            type="button"
            disabled={slots.length >= SHOWCASE_MAX_SLOTS}
            onClick={() => {
              nextKey.current += 1;
              setSlots((current) => [
                ...current,
                {
                  key: `new-${nextKey.current}`,
                  label: "新分类",
                  work: null,
                },
              ]);
              markDirty();
            }}
            className="mt-5 w-full rounded-xl border border-dashed border-stone-400 py-3 text-sm font-medium text-stone-600 transition hover:border-stone-700 hover:text-stone-900 disabled:cursor-not-allowed disabled:opacity-45"
          >
            {slots.length >= SHOWCASE_MAX_SLOTS
              ? `最多 ${SHOWCASE_MAX_SLOTS} 个分类`
              : "+ 添加分类"}
          </button>
        )}
      </section>

      <ExportCanvas title={title} slots={slots} canvasRef={exportRef} />

      {owner && selectedSlot && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 p-0 sm:items-center sm:p-6"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelectedKey(null);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="work-picker-title"
            className="flex max-h-[90vh] w-full max-w-3xl flex-col rounded-t-2xl bg-white shadow-2xl dark:bg-zinc-950 sm:rounded-2xl"
          >
            <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
              <div>
                <h2 id="work-picker-title" className="font-semibold">
                  为「{selectedSlot.label}」选择作品
                </h2>
                <p className="mt-1 text-xs text-zinc-500">
                  可以在多个分类中选择同一部作品
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedKey(null)}
                aria-label="关闭作品选择"
                className="rounded-lg px-3 py-2 text-xl text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                ×
              </button>
            </div>

            <div className="flex flex-col gap-3 border-b border-zinc-200 p-4 dark:border-zinc-800 sm:flex-row">
              <input
                autoFocus
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="搜索作品名或原名…"
                className="min-w-0 flex-1 rounded-lg border border-zinc-300 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-400 dark:border-zinc-700"
              />
              <select
                value={typeFilter}
                onChange={(event) =>
                  setTypeFilter(event.target.value as MediaType | "")
                }
                aria-label="按作品类型筛选"
                className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-400 dark:border-zinc-700 dark:bg-zinc-950"
              >
                <option value="">全部类型</option>
                {(Object.keys(MEDIA_TYPE_LABELS) as MediaType[]).map((type) => (
                  <option key={type} value={type}>
                    {MEDIA_TYPE_LABELS[type]}
                  </option>
                ))}
              </select>
              {selectedSlot.work && (
                <button
                  type="button"
                  onClick={() => {
                    changeSlot(selectedSlot.key, (current) => ({
                      ...current,
                      work: null,
                    }));
                    setSelectedKey(null);
                  }}
                  className="rounded-lg border border-red-200 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950"
                >
                  清空当前作品
                </button>
              )}
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              <p className="mb-3 text-xs text-zinc-500">
                {filteredWorks.length} 部作品 · 按个人评分和更新时间排序
              </p>
              {filteredWorks.length > 0 ? (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {filteredWorks.map((work) => (
                    <button
                      key={work.id}
                      type="button"
                      onClick={() => {
                        changeSlot(selectedSlot.key, (current) => ({
                          ...current,
                          work,
                        }));
                        setSelectedKey(null);
                      }}
                      className={`flex items-center gap-3 rounded-xl border p-2 text-left transition hover:border-zinc-500 ${
                        selectedSlot.work?.id === work.id
                          ? "border-zinc-900 bg-zinc-50 dark:border-zinc-100 dark:bg-zinc-900"
                          : "border-zinc-200 dark:border-zinc-800"
                      }`}
                    >
                      <div className="relative h-20 w-14 shrink-0 overflow-hidden rounded-md bg-zinc-100 dark:bg-zinc-800">
                        <PosterImage
                          key={`picker-${work.id}-${work.coverUrl ?? "none"}`}
                          work={work}
                          sizes="56px"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 text-sm font-medium">
                          {work.title}
                        </p>
                        <p className="mt-1 text-xs text-zinc-500">
                          {MEDIA_TYPE_LABELS[work.type]}
                          {work.year ? ` · ${work.year}` : ""}
                          {work.myRating !== null
                            ? ` · ★ ${work.myRating}`
                            : " · 未评分"}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="py-16 text-center text-sm text-zinc-500">
                  没有找到匹配的观影记录。
                </p>
              )}
            </div>
          </section>
        </div>
      )}
    </>
  );
}
