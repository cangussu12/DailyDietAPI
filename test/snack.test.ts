import { expect, beforeAll, describe, afterAll, it, afterEach } from "vitest";
import { execSync } from "node:child_process";
import request from "supertest";
import { app } from "../src/app";

describe("Metrics routes", () => {
  let userId: string;
  let sessionId: string;

  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(async () => {
    execSync("npm run knex migrate:rollback --all");
    execSync("npm run knex migrate:latest");
  });
  it("should return metrics for the authenticated user", async () => {
    // Cria um novo usuário
    const createUserResponse = await request(app.server)
      .post("/user")
      .send({
        name: "Test User",
        surname: "Test Surname",
      })
      .expect(201);

    const sessionId = createUserResponse.headers["set-cookie"][0];

    // Adiciona refeições
    await request(app.server)
      .post("/snack")
      .set("Cookie", sessionId)
      .send({
        name: "Meal 1",
        description: "Description for meal 1",
        date: "2024-10-03",
        time: "14:30:00",
        diet: true,
      })
      .expect(201);

    await request(app.server)
      .post("/snack")
      .set("Cookie", sessionId)
      .send({
        name: "Meal 2",
        description: "Description for meal 2",
        date: "2024-10-03",
        time: "14:30:00",
        diet: false,
      })
      .expect(201);

    const metricsResponse = await request(app.server)
      .get("/snack/metrics")
      .set("Cookie", sessionId)
      .expect(200);

    // Verifica se as métricas estão corretas
    expect(metricsResponse.body).toEqual({
      totalMeals: 2,
      mealsInDiet: 1,
      mealsOutOfDiet: 1,
      bestStreak: [
        {
          id: expect.any(String),
          name: "Meal 1",
          description: "Description for meal 1",
          diet: true,
        },
      ],
    });
  });
});
