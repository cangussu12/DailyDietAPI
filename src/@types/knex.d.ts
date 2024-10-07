import { knex } from "knex";

declare module "knex/types/tables" {
  export interface Tables {
    users: {
      id: string;
      name: string;
      surname: string;
      created_at: string;
      session_id?: string;
    };

    snack: {
      id: string;
      name: string;
      description: string;
      created_at: string;
      date: string;
      time: string;
      diet: boolean;
      user_id: string;
    };
  }
}
