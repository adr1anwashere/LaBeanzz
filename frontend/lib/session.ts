import type { Session } from "next-auth";

/**
 * Extended session shape carrying our app-specific fields.
 * We store these in the JWT callback and read them back in the session callback.
 */
export interface AppSession extends Session {
  appToken?: string;
  user: Session["user"] & {
    id?: string;
    role?: string | null;
  };
}
