export type ActionState = { error: string | null };
export const initialActionState: ActionState = { error: null };

export type GuestSignupState = {
  ok: boolean;
  error?: string;
  username?: string;
};
export const initialGuestSignupState: GuestSignupState = { ok: false };
