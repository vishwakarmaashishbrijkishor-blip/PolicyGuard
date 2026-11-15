import { describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../../src/app";

describe("admin users routes", () => {
  it("lists users for admins", async () => {
    const response = await request(app).get("/admin/users").set("x-role", "admin");
    expect(response.status).toBe(200);
  });

  it("rejects unauthenticated requests", async () => {
    const response = await request(app).get("/admin/users");
    expect(response.status).toBe(401);
  });

  it("rejects unauthenticated user creation", async () => {
    const response = await request(app).post("/admin/users").send({ id: "1", name: "Ada" });
    expect(response.status).toBe(401);
  });
});
