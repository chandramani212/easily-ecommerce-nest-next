export const IS_DEMO = process.env.NEXT_PUBLIC_DEMO === "1";

export const DEMO_USER = {
  id: "demo-admin",
  email: "admin@shopease.demo",
  name: "Demo Admin",
  role: "ADMIN" as const,
};
