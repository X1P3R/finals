export type ExportableNote = {
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
};

export type ExportNotePayload = {
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
};

export function toExportPayload(note: ExportableNote): ExportNotePayload {
  return {
    title: note.title,
    content: note.content,
    createdAt: note.createdAt.toISOString(),
    updatedAt: note.updatedAt.toISOString(),
  };
}

export function dateStamp(date = new Date()): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}

type RawImportNote = {
  title?: unknown;
  content?: unknown;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type NormalizedImportNote = {
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
};

function parseOptionalDate(value: unknown): Date | null {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  if (typeof value !== "string") {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
}

export function normalizeImportPayload(payload: unknown, maxItems: number): NormalizedImportNote[] {
  const rawItems = Array.isArray(payload) ? payload : [payload];

  if (rawItems.length === 0) {
    throw new Error("Payload must contain at least one note.");
  }

  if (rawItems.length > maxItems) {
    throw new Error(`Too many notes in one import. Maximum is ${maxItems}.`);
  }

  return rawItems.map((item, index) => {
    if (typeof item !== "object" || item === null) {
      throw new Error(`Invalid note at index ${index}.`);
    }

    const note = item as RawImportNote;
    const rawTitle = typeof note.title === "string" ? note.title.trim() : "";
    if (!rawTitle) {
      throw new Error(`Title is required at index ${index}.`);
    }

    const content = typeof note.content === "string" ? note.content : "";
    const now = new Date();
    const createdAt = parseOptionalDate(note.createdAt) ?? now;
    const updatedAt = parseOptionalDate(note.updatedAt) ?? createdAt;

    return {
      title: rawTitle,
      content,
      createdAt,
      updatedAt,
    };
  });
}
