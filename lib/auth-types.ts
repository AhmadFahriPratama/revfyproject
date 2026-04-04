export type SessionRole = "student" | "admin";
export type SessionPlan = "free" | "pro" | "elite";

export type Session = {
  username: string;
  displayName: string;
  role: SessionRole;
  plan: SessionPlan;
  focus: string;
  streak: number;
};
