import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { knex } from "../database";
import { randomUUID } from "node:crypto";
import { checkSessionIdExists } from "../middlewares/check-session-id-exists";

export async function snackRoutes(app: FastifyInstance) {
  app.addHook("preHandler", async (request, reply) => {
    console.log(`[${request.method}] ${request.url}`);
  });

  interface Snack {
    id: string;
    name: string;
    diet: boolean;
    description: string;
  }

  app.get(
    "/metrics",
    {
      preHandler: [checkSessionIdExists],
    },
    async (request, reply) => {
      const { sessionId } = request.cookies;

      const user = await knex("users").where("session_id", sessionId).first();

      if (!user) {
        return reply.status(404).send({ error: "User not found" });
      }

      // Quantidade total de refeições registradas
      const totalMeals = await knex("snack")
        .where("user_id", user.id)
        .count({ count: "*" })
        .first();

      // Quantidade total de refeições dentro da dieta
      const mealsInDiet = await knex("snack")
        .where({ user_id: user.id, diet: true })
        .count({ count: "*" })
        .first();

      // Quantidade total de refeições fora da dieta
      const mealsOutOfDiet = await knex("snack")
        .where({ user_id: user.id, diet: false })
        .count({ count: "*" })
        .first();

      // Definir valores padrão caso os resultados sejam undefined
      const totalMealsCount = totalMeals?.count || 0;
      const mealsInDietCount = mealsInDiet?.count || 0;
      const mealsOutOfDietCount = mealsOutOfDiet?.count || 0;

      // Buscar todas as refeições e ordená-las por data
      const snacks: Snack[] = await knex("snack")
        .where({ user_id: user.id })
        .orderBy("date", "asc")
        .select("id", "name", "description", "diet");

      let currentStreak: Snack[] = [];
      let bestStreak: Snack[] = [];

      // Percorrer todas as refeições e encontrar a melhor sequência de dietas
      // biome-ignore lint/complexity/noForEach: <explanation>
      snacks.forEach((snack: Snack) => {
        if (snack.diet) {
          currentStreak.push({
            id: snack.id,
            name: snack.name,
            description: snack.description,
            diet: true, // Certificar que 'diet' é true para snacks na dieta
          });
        } else {
          if (currentStreak.length > bestStreak.length) {
            bestStreak = [...currentStreak];
          }
          currentStreak = [];
        }
      });

      if (currentStreak.length > bestStreak.length) {
        bestStreak = [...currentStreak];
      }

      // Retornar as métricas para o cliente
      return reply.status(200).send({
        totalMeals: totalMealsCount,
        mealsInDiet: mealsInDietCount,
        mealsOutOfDiet: mealsOutOfDietCount,
        bestStreak,
      });
    }
  );

  //editar usuario logado
  app.get(
    "/",
    {
      preHandler: [checkSessionIdExists],
    },
    async (request, reply) => {
      const { sessionId } = request.cookies;

      const user = await knex("users").where("session_id", sessionId).first();

      if (!user) {
        return reply.status(404).send({ error: "User not found" });
      }

      const snacks = await knex("snack").where({
        user_id: user.id, // Garante que o snack pertence ao usuário
      });

      if (snacks.length === 0) {
        return reply
          .status(404)
          .send({ error: "No snacks found for this user" });
      }

      return reply.status(200).send({ snacks });
    }
  );

  // visualizar refeição pelo id
  app.get(
    "/:id",
    {
      preHandler: [checkSessionIdExists],
    },
    async (request, reply) => {
      const { sessionId } = request.cookies;

      const getSnackParamsSchema = z.object({
        id: z.string().uuid(),
      });

      const { id } = getSnackParamsSchema.parse(request.params);

      const user = await knex("users").where("session_id", sessionId).first();

      if (!user) {
        return reply.status(404).send({ error: "User not found" });
      }

      const snacks = await knex("snack").where({
        id: id,
        user_id: user.id,
      });

      if (snacks.length === 0) {
        return reply
          .status(404)
          .send({ error: "No snacks found for this user" });
      }

      return reply.status(200).send({ snacks });
    }
  );

  //editar uma refeição pelo id
  app.put("/:id", async (request, reply) => {
    const updateSnackParamsSchema = z.object({
      id: z.string().uuid(),
    });

    const updateSnackBodySchema = z.object({
      name: z.string(),
      description: z.string(),
      date: z.string(),
      time: z.string(),
      diet: z.boolean(),
    });

    const { id } = updateSnackParamsSchema.parse(request.params);
    const { name, description, date, time, diet } = updateSnackBodySchema.parse(
      request.body
    );

    const { sessionId } = request.cookies;

    const user = await knex("users").where("session_id", sessionId).first();

    if (!user) {
      return reply.status(404).send({ error: "User not found" });
    }

    const snack = await knex("snack")
      .where({
        id: id,
        user_id: user.id,
      })
      .first();

    if (!snack) {
      return reply
        .status(404)
        .send({ error: "Snack not found or unauthorized" });
    }

    await knex("snack").where({ id: id, user_id: user.id }).update({
      name,
      description,
      date,
      time,
      diet,
    });

    return reply.status(204).send();
  });

  app.delete(
    "/:id",
    {
      preHandler: [checkSessionIdExists],
    },
    async (request, reply) => {
      const deleteSnackParamsSchema = z.object({
        id: z.string().uuid(),
      });

      const { id } = deleteSnackParamsSchema.parse(request.params);

      const { sessionId } = request.cookies;

      const user = await knex("users").where("session_id", sessionId).first();

      if (!user) {
        return reply.status(404).send({ error: "User not found" });
      }

      const snack = await knex("snack")
        .where({
          id: id,
          user_id: user.id,
        })
        .first();

      console.log("Snack:", snack);

      if (!snack) {
        return reply
          .status(404)
          .send({ error: "Snack not found or unauthorized" });
      }

      await knex("snack")
        .where({
          id: id,
          user_id: user.id,
        })
        .delete();

      return reply.status(204).send();
    }
  );

  app.post("/", async (request, reply) => {
    const createSnackBodySchema = z.object({
      name: z.string(),
      description: z.string(),
      date: z.string(),
      time: z.string(),
      diet: z.boolean(),
    });

    const { name, description, date, time, diet } = createSnackBodySchema.parse(
      request.body
    );

    const { sessionId } = request.cookies;

    const user = await knex("users").where("session_id", sessionId).first();

    if (!user) {
      return reply.status(404).send({ error: "User not found" });
    }

    await knex("snack").insert({
      id: randomUUID(),
      name,
      description,
      date,
      time,
      diet,
      user_id: user.id,
    });

    return reply.status(201).send();
  });
}
