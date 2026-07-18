import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { actionRepository, getDatabase, resetDatabaseForTests } from "@/lib/db";
import { actionFixture } from "./helpers";

describe("IndexedDB action repository", () => {
  beforeEach(async () => {
    resetDatabaseForTests();
    await getDatabase().delete();
    resetDatabaseForTests();
  });
  afterEach(async () => {
    await getDatabase().delete();
    resetDatabaseForTests();
  });
  it("saves and lists only an explicitly confirmed action", async () => {
    const saved = await actionRepository.saveConfirmed(actionFixture());
    expect(saved.status).toBe("confirmed");
    expect(await actionRepository.listConfirmed()).toHaveLength(1);
  });
  it("does not persist a discarded draft", async () => {
    const discarded = actionFixture({ status: "discarded" });
    expect(discarded.status).toBe("discarded");
    expect(await actionRepository.count()).toBe(0);
  });
});
