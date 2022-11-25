import * as D from "io-ts/Decoder";

type StringMinLengthBrand<N extends number> = {
  readonly StringMinLength: unique symbol;
  readonly MinLength: N;
};
type StringMinLength<N extends number> = string & StringMinLengthBrand<N>;

export const stringMinLength = <N extends number>(minLength: N) =>
  D.fromRefinement(
    (s: string): s is StringMinLength<N> => s.length >= minLength,
    `StringMinLength${minLength}`
  );

type StringMaxLengthBrand<N extends number> = {
  readonly StringMaxLength: unique symbol;
  readonly MaxLength: N;
};
type StringMaxLength<N extends number> = string & StringMaxLengthBrand<N>;

export const stringMaxLength = <N extends number>(maxLength: N) =>
  D.fromRefinement(
    (s: string): s is StringMaxLength<N> => s.length <= maxLength,
    `StringMaxLength${maxLength}`
  );
