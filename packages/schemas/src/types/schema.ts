import type { Static, TSchema } from "typebox";

export interface Schema<S extends string = string> {
  id: S;
  raw: TSchema // compiled typebox schema
  isValid: (data: unknown) => boolean;
  validate: (data: unknown) => { valid: boolean; errors?: Error[] };
  deserialize: <R extends Static<TSchema>>(json: string) => R;
  serialize: <R extends Static<TSchema>>(data: R) => string;
}
