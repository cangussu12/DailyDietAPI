import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { knex } from "../database";
import { randomUUID } from "node:crypto";
import { checkSessionIdExists } from "../middlewares/check-session-id-exists";

export async function userRoutes(app: FastifyInstance) {
  app.addHook("preHandler", async (request, reply) => {
    console.log(`[${request.method}] ${request.url}`);
  });

  app.get(
    "/",
    {
      preHandler: [checkSessionIdExists],
    },
    async (response, reply) => {
      const user = await knex("users").select();

      return reply.status(200).send(user);
    }
  );

  app.post("/", async (request, reply) => {
    const createUserBodySchema = z.object({
      name: z.string(),
      surname: z.string(),
    });

    const { name, surname } = createUserBodySchema.parse(request.body);

    let sessionId = request.cookies.sessionId;

    if (!sessionId) {
      sessionId = randomUUID();

      reply.cookie("sessionId", sessionId, {
        path: "/",
        maxAge: 60 * 60 * 24 * 7, //7 days
      });
    }

    await knex("users").insert({
      id: randomUUID(),
      name,
      surname,
      session_id: sessionId,
    });

    return reply.status(201).send();
  });

  app.delete(
    "/:id",
    {
      preHandler: [checkSessionIdExists],
    },
    async (request, reply) => {
      const deleteUserParamsSchema = z.object({
        id: z.string().uuid(),
      });

      const { id } = deleteUserParamsSchema.parse(request.params);

      const user = await knex("users")
        .where({
          id: id,
        })
        .first();

      await knex("users")
        .where({
          id: id,
        })
        .delete();

      return reply.status(204).send();
    }
  );
}
