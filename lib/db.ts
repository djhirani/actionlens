import Dexie, { type EntityTable } from "dexie";
import {
  ActionItemSchema,
  CompletionCheckSchema,
  type ActionItem,
  type CompletionAnalysisResult,
  type CompletionCheck
} from "@/lib/schemas";

export class ActionLensDatabase extends Dexie {
  actions!: EntityTable<ActionItem, "id">;
  completionChecks!: EntityTable<CompletionCheck, "id">;
  constructor(name = "actionlens") {
    super(name);
    this.version(1).stores({ actions: "id, status, dueAt, updatedAt" });
    this.version(2)
      .stores({
        actions: "id, status, dueAt, updatedAt",
        completionChecks: "id, actionId, status, createdAt"
      })
      .upgrade((transaction) =>
        transaction
          .table<ActionItem>("actions")
          .toCollection()
          .modify((action) => {
            if (action.source?.kind === "pdf" && !action.completionCriteria?.length) {
              action.completionCriteria = [
                {
                  id: "legacy-action-confirmation",
                  description: `Evidence explicitly confirms: ${action.action}`,
                  required: true
                }
              ];
            }
          })
      );
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
  async listInbox() {
    const rows = await getDatabase()
      .actions.where("status")
      .anyOf("confirmed", "completed")
      .toArray();
    return rows.map((row) => ActionItemSchema.parse(row));
  },
  async getById(id: string) {
    const action = await getDatabase().actions.get(id);
    return action ? ActionItemSchema.parse(action) : null;
  },
  async count() {
    return getDatabase().actions.count();
  },
  async clear() {
    await getDatabase().transaction(
      "rw",
      getDatabase().actions,
      getDatabase().completionChecks,
      async () => {
        await getDatabase().completionChecks.clear();
        await getDatabase().actions.clear();
      }
    );
  },
  async deleteById(id: string) {
    await getDatabase().transaction(
      "rw",
      getDatabase().actions,
      getDatabase().completionChecks,
      async () => {
        await getDatabase().completionChecks.where("actionId").equals(id).delete();
        await getDatabase().actions.delete(id);
      }
    );
  }
};

export const completionRepository = {
  async savePending(result: CompletionAnalysisResult, saveExcerpts: boolean) {
    const hasVerifiedExcerpt = result.matchedCriteria.some(
      (match) => match.evidence.verificationStatus === "verified"
    );
    const check = CompletionCheckSchema.parse({
      ...result,
      matchedCriteria: result.matchedCriteria.map((match) => ({
        ...match,
        evidence:
          saveExcerpts && match.evidence.verificationStatus === "verified"
            ? match.evidence
            : {
                ...match.evidence,
                quote: "",
                normalizedQuote: "",
                page: null,
                charStart: null,
                charEnd: null
              }
      })),
      source: { ...result.source, excerptsSaved: saveExcerpts && hasVerifiedExcerpt }
    });
    await getDatabase().completionChecks.put(check);
    return check;
  },
  async listForAction(actionId: string) {
    const rows = await getDatabase().completionChecks.where("actionId").equals(actionId).toArray();
    return rows
      .map((row) => CompletionCheckSchema.parse(row))
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  },
  async decide(checkId: string, decision: "mark_complete" | "keep_open") {
    return getDatabase().transaction(
      "rw",
      getDatabase().actions,
      getDatabase().completionChecks,
      async () => {
        const check = await getDatabase().completionChecks.get(checkId);
        if (!check) throw new Error("Completion check not found");
        const action = await getDatabase().actions.get(check.actionId);
        if (!action) throw new Error("Action not found");
        const updatedCheck = CompletionCheckSchema.parse({ ...check, userDecision: decision });
        const updatedAction = ActionItemSchema.parse({
          ...action,
          status: decision === "mark_complete" ? "completed" : "confirmed",
          updatedAt: new Date().toISOString()
        });
        await getDatabase().completionChecks.put(updatedCheck);
        await getDatabase().actions.put(updatedAction);
        return { check: updatedCheck, action: updatedAction };
      }
    );
  }
};
