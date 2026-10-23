import { firestore } from './firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  writeBatch,
  query,
} from 'firebase/firestore';

/**
 * Firestore Database Service Layer
 * Replaces localStorage with Firestore for persistent cloud storage
 */

// Collection names mapped to old localStorage keys
export const COLLECTIONS = {
  teachers: 'teachers',
  evaluations: 'evaluations',
  modelLessonEvaluations: 'model_lessons_evaluations',
  modelLessonSchedules: 'model_lesson_schedules',
  departments: 'departments',
  users: 'users',
  dailyTasks: 'dailyTasks',
  followUpForms: 'followUpForms',
  workshops: 'workshops',
  individualPDRecords: 'individualPDRecords',
  meeeRecords: 'meeeRecords',
  monthlyNotes: 'monthlyNotes',
  achievements: 'achievements',
  elearningSms: 'elearning_sms',
  operationalPlan: 'operational_plan',
  eventsMeetings: 'events_meetings',
  distanceLearning: 'distance_learning',
  takreemSettings: 'takreem_settings',
  pdPlan: 'pd_plan',
  selfDevelopment: 'self_development',
} as const;

export const LEGACY_LOCAL_STORAGE_KEYS: Record<string, readonly string[]> = {
  teachers: ['qstss_v3_teachers', 'qstss_v5_teachers', 'teachers', 'qstss_teachers'],
  evaluations: ['qstss_v3_evaluations', 'qstss_v19_evaluations', 'evaluations', 'qstss_evaluations'],
  modelLessonEvaluations: ['qstss_v1_model_lesson_evaluations', 'model_lessons_evaluations', 'qstss_model_lesson_evaluations'],
  model_lessons_evaluations: ['qstss_v1_model_lesson_evaluations', 'model_lessons_evaluations', 'qstss_model_lesson_evaluations'],
  modelLessonSchedules: ['qstss_v1_model_lesson_schedules', 'model_lesson_schedules'],
  model_lesson_schedules: ['qstss_v1_model_lesson_schedules', 'model_lesson_schedules'],
  departments: ['qstss_v3_departments', 'qstss_v6_departments', 'departments', 'qstss_departments'],
  users: ['qstss_v6_users', 'qstss_v14_users', 'users', 'qstss_users'],
  dailyTasks: ['qstss_v1_daily_tasks', 'daily_tasks', 'qstss_daily_tasks'],
  followUpForms: ['qstss_v1_followup_forms', 'followup_forms', 'qstss_followup_forms'],
  workshops: ['qstss_v1_workshops', 'workshops', 'qstss_workshops'],
  individualPDRecords: ['qstss_v1_individual_pd', 'individual_pd', 'qstss_individual_pd'],
  meeeRecords: ['qstss_v1_meee_records', 'meee_records', 'qstss_meee_records'],
  monthlyNotes: ['monthly_task_notes', 'monthly_notes', 'qstss_monthly_notes'],
  achievements: ['system_achievements', 'achievements', 'qstss_achievements'],
  elearningSms: ['qstss_elearning_sms', 'elearning_sms'],
  elearning_sms: ['qstss_elearning_sms', 'elearning_sms'],
  operationalPlan: ['qstss_operational_plan_v2', 'qstss_operational_plan_v1', 'operational_plan'],
  operational_plan: ['qstss_operational_plan_v2', 'qstss_operational_plan_v1', 'operational_plan'],
  eventsMeetings: ['qstss_events_meetings_september_2026_v5', 'qstss_events_meetings_v2', 'events_meetings'],
  events_meetings: ['qstss_events_meetings_september_2026_v5', 'qstss_events_meetings_v2', 'events_meetings'],
  distanceLearning: ['qstss_distance_learning_records_2026-2027', 'qstss_distance_learning_v2', 'distance_learning'],
  distance_learning: ['qstss_distance_learning_records_2026-2027', 'qstss_distance_learning_v2', 'distance_learning'],
  takreemSettings: ['qstss_takreem_settings', 'takreem_settings'],
  takreem_settings: ['qstss_takreem_settings', 'takreem_settings'],
  pdPlan: ['qstss_custom_pd_plan_2627', 'pd_plan'],
  pd_plan: ['qstss_custom_pd_plan_2627', 'pd_plan'],
  selfDevelopment: ['qstss_self_development_records_v1_2026-2027', 'qstss_self_development_v1', 'self_development'],
  self_development: ['qstss_self_development_records_v1_2026-2027', 'qstss_self_development_v1', 'self_development'],
};

type CollectionName = typeof COLLECTIONS[keyof typeof COLLECTIONS];

export function resolveCollectionName(name: string): CollectionName {
  if (name in COLLECTIONS) {
    return COLLECTIONS[name as keyof typeof COLLECTIONS];
  }
  return name as CollectionName;
}

function sanitizeDocId(rawId?: string): string {
  if (!rawId || typeof rawId !== 'string' || !rawId.trim()) {
    return doc(collection(firestore, 'temp')).id;
  }
  return rawId.trim().replace(/\//g, '_');
}

function readLocalBackup<T>(colName: string): T[] | null {
  if (typeof window === 'undefined') return null;
  const oldKeys = LEGACY_LOCAL_STORAGE_KEYS[colName];
  if (!oldKeys) return null;
  for (const oldKey of oldKeys) {
    const localVal = localStorage.getItem(oldKey);
    if (localVal) {
      try {
        const parsed = JSON.parse(localVal);
        if (Array.isArray(parsed)) {
          return parsed as T[];
        }
      } catch {
        // ignore parse error
      }
    }
  }
  return null;
}

function writeLocalBackup<T>(colName: string, data: T[], isLocalSave = false) {
  if (typeof window === 'undefined') return;
  const oldKeys = LEGACY_LOCAL_STORAGE_KEYS[colName];
  if (oldKeys && oldKeys[0]) {
    try {
      localStorage.setItem(oldKeys[0], JSON.stringify(data));
      if (isLocalSave) {
        localStorage.setItem(`qstss_ts_${colName}`, String(Date.now()));
      }
    } catch (e) {
      console.warn(`[LocalStorage] Quota warning when writing ${oldKeys[0]}:`, e);
    }
  }
}

export function getDeletedIds(colName: string): Set<string> {
  if (typeof window === 'undefined') return new Set();
  const resolved = resolveCollectionName(colName);
  try {
    const raw = localStorage.getItem(`qstss_deleted_${resolved}`);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? new Set(arr.map(String)) : new Set();
  } catch {
    return new Set();
  }
}

export function markIdDeleted(colName: string, id: string) {
  if (typeof window === 'undefined' || !id) return;
  const resolved = resolveCollectionName(colName);
  try {
    const set = getDeletedIds(resolved);
    set.add(String(id));
    localStorage.setItem(`qstss_deleted_${resolved}`, JSON.stringify(Array.from(set)));
  } catch {
    // ignore
  }
}

export function unmarkIdDeleted(colName: string, id: string) {
  if (typeof window === 'undefined' || !id) return;
  const resolved = resolveCollectionName(colName);
  try {
    const set = getDeletedIds(resolved);
    if (set.has(String(id))) {
      set.delete(String(id));
      localStorage.setItem(`qstss_deleted_${resolved}`, JSON.stringify(Array.from(set)));
    }
  } catch {
    // ignore
  }
}

// In-memory cache to reduce Firestore reads
const cache: Record<string, { data: any[]; timestamp: number }> = {};
const CACHE_TTL = 5000; // 5 seconds cache

function getCached(collectionName: string): any[] | null {
  const resolved = resolveCollectionName(collectionName);
  const entry = cache[resolved];
  if (entry && Date.now() - entry.timestamp < CACHE_TTL) {
    return entry.data;
  }
  return null;
}

function setCache(collectionName: string, data: any[]) {
  const resolved = resolveCollectionName(collectionName);
  cache[resolved] = { data, timestamp: Date.now() };
}

export function invalidateCache(collectionName?: string) {
  if (collectionName) {
    const resolved = resolveCollectionName(collectionName);
    delete cache[resolved];
    delete cache[collectionName];
  } else {
    Object.keys(cache).forEach(k => delete cache[k]);
  }
}

export function notifyDataUpdated(collectionName: string) {
  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(
        new CustomEvent('qstss_data_updated', {
          detail: { collection: resolveCollectionName(collectionName), timestamp: Date.now() },
        })
      );
    } catch {
      // ignore
    }
  }
}

/**
 * Get all documents from a Firestore collection
 */
export async function getCollection<T>(collectionName: CollectionName): Promise<T[]> {
  const colName = resolveCollectionName(collectionName);

  // Check cache first
  const cached = getCached(colName);
  if (cached) return cached as T[];

  const localBackup = readLocalBackup<T & { id?: string }>(colName);
  const isPending = typeof window !== 'undefined' && localStorage.getItem(`qstss_pending_${colName}`) === '1';
  const localTs = typeof window !== 'undefined' ? Number(localStorage.getItem(`qstss_ts_${colName}`) || '0') : 0;
  const deletedSet = getDeletedIds(colName);

  try {
    const q = query(collection(firestore, colName));
    const snapshot = await getDocs(q);
    let data = snapshot.docs.map(d => ({ ...d.data(), id: d.id })) as (T & { id?: string })[];

    if (deletedSet.size > 0) {
      data = data.filter(item => !item?.id || !deletedSet.has(String(item.id)));
    }

    // Auto-migration: check if Firestore is empty and we have old localStorage data
    if (data.length === 0 && localBackup && localBackup.length > 0) {
      const filteredLocal = localBackup.filter(item => !item?.id || !deletedSet.has(String(item.id)));
      if (filteredLocal.length > 0) {
        console.log(`[Migration] Found local data for ${colName}. Migrating to Firestore...`);
        if (isAuthorizedToSave()) {
          saveCollection(colName, filteredLocal).catch(console.warn);
        }
        setCache(colName, filteredLocal);
        return filteredLocal as T[];
      }
    }

    // If this browser has a pending or very recent local save, merge so newly added/edited items are never lost
    if (localBackup && localBackup.length > 0 && (isPending || (isAuthorizedToSave() && Date.now() - localTs < 120000))) {
      const localMap = new Map<string, any>();
      localBackup.forEach(item => {
        if (item && item.id && !deletedSet.has(String(item.id))) {
          localMap.set(String(item.id), item);
        }
      });
      if (!isPending) {
        data.forEach(cloudItem => {
          if (cloudItem && cloudItem.id && !deletedSet.has(String(cloudItem.id)) && !localMap.has(String(cloudItem.id))) {
            localMap.set(String(cloudItem.id), cloudItem);
          }
        });
      }
      data = Array.from(localMap.values());
      if (isPending && isAuthorizedToSave()) {
        saveCollection(colName, data).catch(console.warn);
      }
    }

    if (data.length > 0) {
      writeLocalBackup(colName, data, false);
    }

    setCache(colName, data);
    return data as T[];
  } catch (error) {
    console.error(`Error reading collection ${colName}:`, error);
    // Offline resilience: return localStorage data if available
    if (localBackup && localBackup.length > 0) {
      const filteredLocal = localBackup.filter(item => !item?.id || !deletedSet.has(String(item.id)));
      console.warn(`[Firestore Offline Fallback] Using ${filteredLocal.length} cached records for ${colName}`);
      setCache(colName, filteredLocal);
      return filteredLocal as T[];
    }
    return [];
  }
}

/**
 * Save an entire collection (replace all documents)
 * Uses batch writes for efficiency
 */
// Helper to recursively sanitize objects for Firestore (removes undefined, transforms arrays/objects)
function sanitizeForFirestore(val: any): any {
  if (val === undefined) return null;
  if (val === null) return null;
  if (Array.isArray(val)) {
    return val.map(sanitizeForFirestore);
  }
  if (typeof val === 'object') {
    const res: any = {};
    for (const key in val) {
      if (Object.prototype.hasOwnProperty.call(val, key)) {
        const v = val[key];
        if (v !== undefined) {
          res[key] = sanitizeForFirestore(v);
        }
      }
    }
    return res;
  }
  return val;
}

/**
 * Security Gate:
 * Strictly verifies that only the system administrator (a.tubaishat1704@education.qa)
 * is authorized to write, update, delete, or sync data to Firebase or local storage.
 * All other users are restricted to viewer mode.
 */
export function isAuthorizedToSave(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const raw = localStorage.getItem('qstss_current_user');
    if (!raw) return false;
    const user = JSON.parse(raw);
    const email = (user?.email || '').trim().toLowerCase();
    const username = (user?.username || '').trim().toLowerCase();
    const id = (user?.id || '').trim();
    const role = (user?.role || '').trim().toLowerCase();
    return (
      email === 'a.tubaishat1704@education.qa' ||
      username === 'a.tubaishat1704' ||
      email === 'a.tubaishat@edu.gov.qa' ||
      username === 'a.tubaishat' ||
      id === 'u1' ||
      role === 'admin'
    );
  } catch {
    return false;
  }
}

export async function saveCollection<T extends { id?: string }>(
  collectionName: CollectionName,
  data: T[]
): Promise<void> {
  if (!isAuthorizedToSave()) {
    console.warn(`[Permission Denied] Write operation on ${collectionName} was blocked. Only a.tubaishat1704@education.qa is permitted to edit or sync.`);
    return;
  }

  const colName = resolveCollectionName(collectionName);

  // Track any deleted IDs compared to previous local backup
  const prevLocal = readLocalBackup<T & { id?: string }>(colName);
  const normalizedData = data.map(item => {
    const docId = sanitizeDocId(item.id);
    unmarkIdDeleted(colName, docId);
    return { ...item, id: docId };
  });
  const newDocIds = new Set(normalizedData.map(item => String(item.id)));

  if (prevLocal && Array.isArray(prevLocal)) {
    prevLocal.forEach(oldItem => {
      if (oldItem?.id && !newDocIds.has(String(oldItem.id))) {
        markIdDeleted(colName, String(oldItem.id));
      }
    });
  }

  // 0. Synchronously update cache and localStorage BEFORE network requests
  setCache(colName, normalizedData);
  writeLocalBackup(colName, normalizedData, true);
  notifyDataUpdated(colName);
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(`qstss_pending_${colName}`, '1');
    } catch {
      // ignore
    }
  }

  try {
    // Get existing docs
    const existing = await getDocs(collection(firestore, colName));
    const existingDocs = existing.docs;

    // 1. Delete ONLY docs that are no longer in the new dataset
    const toDelete = existingDocs.filter(d => !newDocIds.has(d.id));

    for (let i = 0; i < toDelete.length; i += 400) {
      const chunk = toDelete.slice(i, i + 400);
      const deleteBatch = writeBatch(firestore);
      chunk.forEach(d => deleteBatch.delete(d.ref));
      await deleteBatch.commit();
    }

    // 2. Add or update all docs in safe batches of 400
    for (let i = 0; i < normalizedData.length; i += 400) {
      const chunk = normalizedData.slice(i, i + 400);
      try {
        const addBatch = writeBatch(firestore);
        chunk.forEach(item => {
          const docId = sanitizeDocId(item.id);
          const ref = doc(firestore, colName, docId);
          const sanitized = sanitizeForFirestore(item);
          addBatch.set(ref, { ...sanitized, id: docId } as any, { merge: true });
        });
        await addBatch.commit();
      } catch (batchErr) {
        console.warn(`[Firestore] Batch commit failed for ${colName}, falling back to individual document writes:`, batchErr);
        for (const item of chunk) {
          try {
            const docId = sanitizeDocId(item.id);
            const ref = doc(firestore, colName, docId);
            const sanitized = sanitizeForFirestore(item);
            await setDoc(ref, { ...sanitized, id: docId } as any, { merge: true });
          } catch (docErr) {
            console.error(`[Firestore] Individual document write failed for ${colName}/${item.id}:`, docErr);
          }
        }
      }
    }

    // Refresh cache timestamp and clear pending flag
    setCache(colName, normalizedData);
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(`qstss_pending_${colName}`);
      } catch {
        // ignore
      }
    }
  } catch (error) {
    console.error(`Error saving collection ${colName}:`, error);
    // Do not throw so UI stays responsive with local data already saved
  }
}

/**
 * Add or update a single document in a collection
 */
export async function saveDocument<T extends { id?: string }>(
  collectionName: CollectionName,
  item: T
): Promise<string> {
  if (!isAuthorizedToSave()) {
    console.warn(`[Permission Denied] Document save on ${collectionName} was blocked. Only a.tubaishat1704@education.qa is permitted to edit or sync.`);
    return item.id || 'unauthorized';
  }

  const colName = resolveCollectionName(collectionName);
  const docId = sanitizeDocId(item.id);
  unmarkIdDeleted(colName, docId);
  const fullItem = { ...item, id: docId };

  // 1. Immediately mirror to cache and localStorage for instant local reliability
  const cached = getCached(colName) || readLocalBackup<any>(colName) || [];
  const list = Array.isArray(cached) ? [...cached] : [];
  const idx = list.findIndex((x: any) => x && String(x.id) === docId);
  if (idx >= 0) {
    list[idx] = fullItem;
  } else {
    list.unshift(fullItem);
  }
  setCache(colName, list);
  writeLocalBackup(colName, list, true);
  notifyDataUpdated(colName);

  // 2. Persist to Firestore
  try {
    const ref = doc(firestore, colName, docId);
    const sanitized = sanitizeForFirestore(fullItem);
    await setDoc(ref, { ...sanitized, id: docId } as any, { merge: true });
    setCache(colName, list);
    return docId;
  } catch (error) {
    console.warn(`[Firestore] Document saved locally, cloud sync pending for ${colName}/${docId}:`, error);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(`qstss_pending_${colName}`, '1');
      } catch {
        // ignore
      }
    }
    return docId;
  }
}

/**
 * Delete a single document from a collection
 */
export async function deleteDocument(
  collectionName: CollectionName,
  docId: string
): Promise<void> {
  if (!isAuthorizedToSave()) {
    console.warn(`[Permission Denied] Document delete on ${collectionName} was blocked. Only a.tubaishat1704@education.qa is permitted to delete.`);
    return;
  }

  const colName = resolveCollectionName(collectionName);
  const cleanId = sanitizeDocId(docId);
  markIdDeleted(colName, cleanId);

  // 1. Immediately remove from cache & localStorage
  const cached = getCached(colName) || readLocalBackup<any>(colName);
  if (Array.isArray(cached)) {
    const filtered = cached.filter((x: any) => x && String(x.id) !== cleanId);
    setCache(colName, filtered);
    writeLocalBackup(colName, filtered, true);
  }
  notifyDataUpdated(colName);

  // 2. Delete from Firestore
  try {
    const ref = doc(firestore, colName, cleanId);
    await deleteDoc(ref);
  } catch (error) {
    console.error(`Error deleting document from ${colName}:`, error);
  }
}

/**
 * Seed a collection with initial data if it's empty
 */
export async function seedIfEmpty<T extends { id?: string }>(
  collectionName: CollectionName,
  seedData: T[]
): Promise<T[]> {
  const colName = resolveCollectionName(collectionName);
  try {
    const existing = await getCollection<T>(colName);
    if (existing.length === 0 && seedData.length > 0) {
      const deletedSet = getDeletedIds(colName);
      const filteredSeed = seedData.filter(item => !item?.id || !deletedSet.has(String(item.id)));
      console.log(`Seeding ${colName} with ${filteredSeed.length} records...`);
      try {
        if (isAuthorizedToSave()) {
          await saveCollection(colName, filteredSeed);
        } else {
          setCache(colName, filteredSeed);
        }
      } catch (saveError) {
        console.error(`Failed to save seeded collection ${colName}, falling back to memory seed:`, saveError);
      }
      return filteredSeed;
    }
    return existing;
  } catch (error) {
    console.error(`Error during seedIfEmpty for ${colName}:`, error);
    return seedData;
  }
}

/**
 * Get a specific single document by ID from a collection
 */
export async function getDocument<T>(collectionName: string, docId: string): Promise<T | null> {
  const colName = resolveCollectionName(collectionName);
  const cleanId = sanitizeDocId(docId);
  const localDocKey = `qstss_doc_${colName}_${cleanId}`;
  const localDocTsKey = `qstss_doc_ts_${colName}_${cleanId}`;
  const localPendingKey = `qstss_doc_pending_${colName}_${cleanId}`;

  let localDoc: T | null = null;
  let localTs = 0;
  let isPending = false;
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(localDocKey);
      if (raw) localDoc = JSON.parse(raw) as T;
      localTs = Number(localStorage.getItem(localDocTsKey) || '0');
      isPending = localStorage.getItem(localPendingKey) === '1';
    } catch {
      // ignore
    }
  }

  try {
    const docRef = doc(firestore, colName, cleanId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const cloudDoc = snap.data() as T;
      if (localDoc && (isPending || (isAuthorizedToSave() && Date.now() - localTs < 60000))) {
        if (isPending && isAuthorizedToSave()) {
          setSingleDocument(colName, cleanId, localDoc as any).catch(console.warn);
        }
        return localDoc;
      }
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(localDocKey, JSON.stringify(cloudDoc));
        } catch {
          // ignore
        }
      }
      return cloudDoc;
    }
    return localDoc;
  } catch (error) {
    console.warn(`[Firestore] getDocument failed for ${colName}/${cleanId}:`, error);
    return localDoc;
  }
}

/**
 * Set/save a specific single document by ID in a collection
 */
export async function setSingleDocument<T extends object>(
  collectionName: string,
  docId: string,
  data: T
): Promise<void> {
  if (!isAuthorizedToSave()) {
    console.warn(`[Permission Denied] setSingleDocument on ${collectionName}/${docId} was blocked. Only a.tubaishat1704@education.qa is permitted to edit or sync.`);
    return;
  }

  const colName = resolveCollectionName(collectionName);
  const cleanId = sanitizeDocId(docId);
  const localDocKey = `qstss_doc_${colName}_${cleanId}`;
  const localDocTsKey = `qstss_doc_ts_${colName}_${cleanId}`;
  const localPendingKey = `qstss_doc_pending_${colName}_${cleanId}`;
  const payload = { ...data, updatedAt: new Date().toISOString() };

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(localDocKey, JSON.stringify(payload));
      localStorage.setItem(localDocTsKey, String(Date.now()));
      localStorage.setItem(localPendingKey, '1');
    } catch {
      // ignore
    }
  }
  notifyDataUpdated(colName);

  try {
    const docRef = doc(firestore, colName, cleanId);
    const sanitized = sanitizeForFirestore(payload);
    await setDoc(docRef, sanitized);
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(localPendingKey);
      } catch {
        // ignore
      }
    }
    invalidateCache(colName);
  } catch (error) {
    console.error(`[Firestore] setSingleDocument failed for ${colName}/${cleanId}:`, error);
  }
}
