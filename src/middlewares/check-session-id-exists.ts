// biome-ignore lint/style/useImportType: <explanation>
import { FastifyReply, FastifyRequest } from "fastify";
import fastifyCookie from "@fastify/cookie";

export async function checkSessionIdExists(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const sessionId = request.cookies.sessionId;

  if (!sessionId) {
    return reply.status(401).send({
      error: "Unauthorized",
    });
  }
}
