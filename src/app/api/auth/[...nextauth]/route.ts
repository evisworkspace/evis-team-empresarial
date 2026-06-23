// Route Handler do Auth.js v5 — App Router.
// Runtime Node.js (A9: não usar edge — necessário para o PrismaAdapter).
import { handlers } from "@/lib/auth";

export const runtime = "nodejs";

export const { GET, POST } = handlers;
