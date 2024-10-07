import fastify from "fastify";
import cookie from "@fastify/cookie";

import { userRoutes } from "./routes/users";
import { snackRoutes } from "./routes/snack";

export const app = fastify();

app.register(cookie);

app.register(snackRoutes, {
  prefix: "snack",
});

app.register(userRoutes, {
  prefix: "user",
});
