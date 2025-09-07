export const env = (key: string) => {
  const v = import.meta.env[key];
  if (!v) throw new Error(`Missing env: ${key}`);
  return v as string;
};

