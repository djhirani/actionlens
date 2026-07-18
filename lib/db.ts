import Dexie, { type EntityTable } from "dexie";
import { ActionItemSchema, type ActionItem } from "@/lib/schemas";

export class ActionLensDatabase extends Dexie {
  actions!: EntityTable<ActionItem, "id">;
  constructor(name = "actionlens") {
    super(name);
    this.version(1).stores({ actions: "id, status, dueAt, updatedAt" });
  }
}

let database: ActionLensDatabase | undefined;
export function getDatabase() {
  database ??= new ActionLensDatabase();
  return database;
}
export function resetDatabaseForTests() {
  database = undefined;
}

export const actionRepository = {
  async saveConfirmed(action: ActionItem) {
    const confirmed = ActionItemSchema.parse({
      ...action,
      status: "confirmed",
      updatedAt: new Date().toISOString()
    });
    await getDatabase().actions.put(confirmed);
    return confirmed;
  },
  async listConfirmed() {
    const rows = await getDatabase().actions.where("status").equals("confirmed").toArray();
    return rows
      .map((row) => ActionItemSchema.parse(row))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  },
  async count() {
    return getDatabase().actions.count();
  },
  async clear() {
    await getDatabase().actions.clear();
  }
};
