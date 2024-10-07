import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("snack", (table) => {
    table.uuid("id").primary();
    table.text("name").notNullable();
    table.text("description").notNullable();
    table.text("date").notNullable();
    table.time("time").notNullable();
    table.boolean("diet").notNullable();
    table.uuid("user_id").references("id").inTable("users").onDelete("CASCADE"); // Relaciona com 'users'
    table.timestamp("created_at").defaultTo(knex.fn.now()).notNullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("snack");
}
