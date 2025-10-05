export type ValueOf<T> = T[keyof T];

export function getEnumKeyByEnumValue<
  T extends Record<string, string | number>
>(myEnum: T, enumValue: ValueOf<T> | string): keyof T | undefined {
  const keys = Object.keys(myEnum).filter((x) => myEnum[x] === enumValue);
  return keys.length > 0 ? keys[0] : undefined;
}
