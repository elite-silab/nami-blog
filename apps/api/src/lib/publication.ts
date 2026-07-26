export type PublicationResult = { status: "live" | "not_needed" };
export const publicContentChanged = (): PublicationResult => ({ status: "live" });
export const noPublicContentChange = (): PublicationResult => ({ status: "not_needed" });
