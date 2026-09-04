import type { ArgumentMetadata, PipeTransform } from "@nestjs/common";
import type { ZodSchema } from "zod";
import { ValidationError } from "../errors/app-error";

/**
 * Validates a controller handler argument against a Zod schema and returns the
 * *parsed* (possibly transformed) value. On failure it throws a `ValidationError`
 * (HTTP 422) with the field-level `details` from Zod, matching the contract
 * envelope `{ error: { code: "VALIDATION_ERROR", details } }`.
 *
 * Attach via `@Body(new ZodValidationPipe(createUserSchema))`.
 */
export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: ZodSchema<unknown>) {}

  transform(value: unknown, _metadata: ArgumentMetadata): unknown {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      }));
      throw new ValidationError("dados inválidos", details);
    }
    return result.data;
  }
}
