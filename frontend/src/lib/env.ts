export const env = (key: string) => {
  const v = import.meta.env[key];
  if (!v) throw new Error(`Missing env: ${key}`);
  return v as string;
};

function joinPath(a: string, b: string) {
  const aa = a.endsWith("/") ? a.slice(0, -1) : a;
  const bb = b.startsWith("/") ? b : `/${b}`;
  return `${aa}${bb}`;
}

export const apiV1Base = () =>
  joinPath(env("VITE_BASE_URL"), env("VITE_API_V1"));
export const apiV2Base = () =>
  joinPath(env("VITE_BASE_URL"), env("VITE_API_V2"));
