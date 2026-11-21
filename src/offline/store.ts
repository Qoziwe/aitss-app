import { aiApi, lmsApi } from '@/api/endpoints';
import { isNetworkError } from '@/api/errors';
import type { DownloadedBundle, GradeBody, GradeResponse, HomeworkListResponse, TaskDetail } from '@/api/types';
import { KEYS, getItem, setItem } from '@/storage/storage';

// Offline lessons: topic bundles are saved on the device. Homework answers written
// without a connection wait in a queue and are sent when the student taps Sync.

export async function getBundles(): Promise<DownloadedBundle[]> {
  return getItem<DownloadedBundle[]>(KEYS.offlineBundles, []);
}

export async function downloadBundle(topicId: number): Promise<DownloadedBundle> {
  const bundle = await lmsApi.offlineBundle(topicId);
  const saved: DownloadedBundle = { ...bundle, downloaded_at: new Date().toISOString() };
  const all = (await getBundles()).filter((b) => b.topic.id !== topicId);
  await setItem(KEYS.offlineBundles, [saved, ...all]);
  return saved;
}

export async function removeBundle(topicId: number): Promise<void> {
  const all = (await getBundles()).filter((b) => b.topic.id !== topicId);
  await setItem(KEYS.offlineBundles, all);
}

export async function getQueue(): Promise<GradeBody[]> {
  return getItem<GradeBody[]>(KEYS.offlineQueue, []);
}

export async function enqueueSubmission(body: GradeBody): Promise<void> {
  const rest = (await getQueue()).filter((q) => q.task_id !== body.task_id);
  await setItem(KEYS.offlineQueue, [...rest, { ...body, completed_offline: true }]);
}

/** Send all waiting answers. Returns how many were accepted. */
export async function syncQueue(): Promise<{ synced: number }> {
  const queue = await getQueue();
  if (queue.length === 0) return { synced: 0 };
  const res = await lmsApi.offlineSync({ submissions: queue });
  await setItem(KEYS.offlineQueue, []);
  return { synced: res.synced };
}

/** Homework list from the server; falls back to saved lessons when there is no connection. */
export async function homeworkWithFallback(): Promise<HomeworkListResponse & { offline: boolean }> {
  try {
    const data = await lmsApi.homework();
    return { ...data, offline: false };
  } catch (e) {
    if (!isNetworkError(e)) throw e;
    const bundles = await getBundles();
    const queued = new Set((await getQueue()).map((q) => q.task_id));
    const todo: TaskDetail[] = bundles.flatMap((b) => b.tasks).filter((t) => !queued.has(t.id));
    return { todo, checked: [], offline: true };
  }
}

export type SubmitResult = { kind: 'graded'; result: GradeResponse } | { kind: 'queued' };

/** Submit for AI checking. With no connection the answers are saved and queued. */
export async function submitWithFallback(body: GradeBody): Promise<SubmitResult> {
  try {
    return { kind: 'graded', result: await aiApi.gradeHomework(body) };
  } catch (e) {
    if (!isNetworkError(e)) throw e;
    await enqueueSubmission(body);
    return { kind: 'queued' };
  }
}
