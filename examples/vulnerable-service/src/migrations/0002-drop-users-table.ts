import type { Knex } from "knex";

// Destructive and irreversible: no down() and no safety justification.
export async function up(knex: Knex): Promise<void> {
  await knex.schema.dropTable("users");
}
