import { expect, beforeAll, describe, afterAll, it } from "vitest";
import { execSync } from "node:child_process";
import request from "supertest";
import { app } from "../src/app";
import { afterEach } from "node:test";

describe("Users routes", () => {
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

  it("should be able to create a new user", async () => {
    await request(app.server)
      .post("/user")
      .send({
        name: "New user name",
        surname: "New user surname",
      })
      .expect(201);
  });

  it("should be able to get user", async () => {
    // Criar um novo usuário
    const createUserResponse = await request(app.server).post("/user").send({
      name: "New user name",
      surname: "New user surname",
    });

    // Capturar os cookies da resposta (sessão, autenticação, etc.)
    const cookies = createUserResponse.headers["set-cookie"];
    console.log(cookies); // Verificar se os cookies foram corretamente definidos

    // Fazer a requisição GET para obter o usuário
    const getUserResponse = await request(app.server)
      .get("/user") // Certifique-se que esse é o endpoint correto para obter o usuário
      .set("Cookie", cookies) // Passar os cookies
      .expect(200); // Esperar que o status HTTP seja 200 (OK)

    // Validar os dados retornados
    expect(getUserResponse.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "New user name",
          surname: "New user surname",
        }),
      ])
    );
  });
});
