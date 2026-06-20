import { NextResponse } from "next/server";
import { logger } from "@/lib/utils/logger";

export type ApiHandlerOptions<TBody> = {
  errorMessage?: string;
  logScope?: string;
  validate?: (body: TBody) => string | null;
};

export function withJsonHandler<TBody = unknown, TResponse = unknown>(
  handler: (body: TBody, req: Request) => Promise<TResponse>,
  options: ApiHandlerOptions<TBody> = {}
): (req: Request) => Promise<Response> {
  const errorMessage = options.errorMessage ?? "Internal server error";
  const logScope = options.logScope ?? "api";

  return async (req: Request): Promise<Response> => {
    let body: TBody;
    try {
      body = (await req.json()) as TBody;
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    if (options.validate) {
      const validationError = options.validate(body);
      if (validationError) {
        return NextResponse.json({ error: validationError }, { status: 400 });
      }
    }

    try {
      const result = await handler(body, req);
      if (result instanceof Response) return result;
      return NextResponse.json(result);
    } catch (err) {
      logger.error(`[${logScope}] handler error`, err);
      return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
  };
}
