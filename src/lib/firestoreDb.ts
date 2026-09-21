import { firestore } from './firebase';
import {
  collection,
  doc,
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
} as const;

export const LEGACY_LOCAL_STORAGE_KEYS = {
  teachers: ['qstss_v3_teachers', 'qstss_v5_teachers', 'teachers', 'qstss_teachers'],
  evaluations: ['qstss_v3_evaluations', 'qstss_v19_evaluations', 'evaluations', 'qstss_evaluations'],
  modelLessonSchedules: ['qstss_v1_model_lesson_schedules', 'model_lesson_schedules'],
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
} as const;

type CollectionName = typeof COLLECTIONS[keyof typeof COLLECTIONS];

// In-memory cache to reduce Firestore reads
const cache: Record<string, { data: any[]; timestamp: number }> = {};
const CACHE_TTL = 5000; // 5 seconds cache

function getCached(collectionName: string): any[] | null {
  const entry = cache[collectionName];
  if (entry && Date.now() - entry.timestamp < CACHE_TTL) {
    return entry.data;
  }
  return null;
}

function setCache(collectionName: string, data: any[]) {
  cache[collectionName] = { data, timestamp: Date.now() };
}

export function invalidateCache(collectionName?: string) {
  if (collectionName) {
    delete cache[collectionName];
  } else {
    Object.keys(cache).forEach(k => delete cache[k]);
  }
}

/**
 * Get all documents from a Firestore collection
 */
export async function getCollection<T>(collectionName: CollectionName): Promise<T[]> {
  // Check cache first
  const cached = getCached(collectionName);
  if (cached) return cached as T[];

  try {
    const q = query(collection(firestore, collectionName));
    const snapshot = await getDocs(q);
    const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as T[];

    // Auto-migration: check if Firestore is empty and we have old localStorage data
    if (data.length === 0 && typeof window !== 'undefined') {
      const oldKeys = LEGACY_LOCAL_STORAGE_KEYS[collectionName as keyof typeof LEGACY_LOCAL_STORAGE_KEYS];
      if (oldKeys) {
        for (const oldKey of oldKeys) {
          const localVal = localStorage.getItem(oldKey);
          if (localVal) {
            try {
              const parsed = JSON.parse(localVal);
              if (Array.isArray(parsed) && parsed.length > 0) {
                console.log(`[Migration] Found local data for ${collectionName} under key ${oldKey}. Migrating to Firestore...`);
                await saveCollection(collectionName, parsed);
                setCache(collectionName, parsed);
                return parsed as T[];
              }
            } catch (e) {
              console.error(`[Migration] Error parsing localStorage data for ${oldKey}:`, e);
            }
          }
        }
      }
    }

    setCache(collectionName, data);
    return data;
  } catch (error) {
    console.error(`Error reading collection ${collectionName}:`, error);
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

export async function saveCollection<T extends { id?: string }>(
  collectionName: CollectionName,
  data: T[]
): Promise<void> {
  try {
    // Get existing docs
    const existing = await getDocs(collection(firestore, collectionName));
    const existingDocs = existing.docs;
    
    // 1. Delete ONLY docs that are no longer in the new dataset
    const newDocIds = new Set(data.map(item => item.id).filter(Boolean));
    const toDelete = existingDocs.filter(d => !newDocIds.has(d.id));

    for (let i = 0; i < toDelete.length; i += 400) {
      const chunk = toDelete.slice(i, i + 400);
      const deleteBatch = writeBatch(firestore);
      chunk.forEach(d => deleteBatch.delete(d.ref));
      await deleteBatch.commit();
    }
    
    // 2. Add or update all docs in safe batches of 400
    for (let i = 0; i < data.length; i += 400) {
      const chunk = data.slice(i, i + 400);
      const addBatch = writeBatch(firestore);
      chunk.forEach(item => {
        const docId = item.id || doc(collection(firestore, collectionName)).id;
        const ref = doc(firestore, collectionName, docId);
        const sanitized = sanitizeForFirestore(item);
        addBatch.set(ref, { ...sanitized, id: docId } as any, { merge: true });
      });
      await addBatch.commit();
    }
    
    // Update cache
    setCache(collectionName, data);

    // Sync to localStorage backup for instant reliability
    if (typeof window !== 'undefined') {
      const oldKeys = LEGACY_LOCAL_STORAGE_KEYS[collectionName as keyof typeof LEGACY_LOCAL_STORAGE_KEYS];
      if (oldKeys && oldKeys[0]) {
        try {
          localStorage.setItem(oldKeys[0], JSON.stringify(data));
        } catch (e) {
          // ignore quota
        }
      }
    }
  } catch (error) {
    console.error(`Error saving collection ${collectionName}:`, error);
    throw error;
  }
}

/**
 * Add or update a single document in a collection
 */
export async function saveDocument<T extends { id?: string }>(
  collectionName: CollectionName,
  item: T
): Promise<string> {
  try {
    const docId = item.id || doc(collection(firestore, collectionName)).id;
    const ref = doc(firestore, collectionName, docId);
    const sanitized = sanitizeForFirestore(item);
    await setDoc(ref, { ...sanitized, id: docId } as any);
    invalidateCache(collectionName);
    return docId;
  } catch (error) {
    console.error(`Error saving document in ${collectionName}:`, error);
    throw error;
  }
}

/**
 * Delete a single document from a collection
 */
export async function deleteDocument(
  collectionName: CollectionName,
  docId: string
): Promise<void> {
  try {
    const ref = doc(firestore, collectionName, docId);
    await deleteDoc(ref);
    invalidateCache(collectionName);
  } catch (error) {
    console.error(`Error deleting document from ${collectionName}:`, error);
    throw error;
  }
}

/**
 * Seed a collection with initial data if it's empty
 */
export async function seedIfEmpty<T extends { id?: string }>(
  collectionName: CollectionName,
  seedData: T[]
): Promise<T[]> {
  try {
    const existing = await getCollection<T>(collectionName);
    if (existing.length === 0 && seedData.length > 0) {
      console.log(`Seeding ${collectionName} with ${seedData.length} records...`);
      try {
        await saveCollection(collectionName, seedData);
      } catch (saveError) {
        console.error(`Failed to save seeded collection ${collectionName}, falling back to memory seed:`, saveError);
      }
      return seedData;
    }
    return existing;
  } catch (error) {
    console.error(`Error during seedIfEmpty for ${collectionName}:`, error);
    return seedData;
  }
}
