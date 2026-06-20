const NOTION_VERSION = "2022-06-28";

export function isNotionSyncEnabled() {
  return process.env.NOTION_SYNC_ENABLED === "true";
}

export function getNotionToken() {
  const token = process.env.NOTION_TOKEN?.trim();
  return isNotionSyncEnabled() && token ? token : null;
}

export function getCaseDatabaseId() {
  return process.env.NOTION_CASE_DATABASE_ID?.trim() || null;
}

export function getConsultationDatabaseId() {
  return process.env.NOTION_CONSULTATION_DATABASE_ID?.trim() || null;
}

export function getReferenceArchiveDatabaseId() {
  return process.env.NOTION_REFERENCE_ARCHIVE_DATABASE_ID?.trim() || null;
}

export function getReferenceWebsiteDatabaseId() {
  return process.env.NOTION_REFERENCE_WEBSITE_DATABASE_ID?.trim() || null;
}

export async function notionRequest(path: string, init: RequestInit, token: string) {
  const response = await fetch(`https://api.notion.com/v1${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Notion-Version": NOTION_VERSION,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Notion request failed (${response.status}): ${text}`);
  }

  return response.json();
}

export function buildRichText(content: string) {
  return [
    {
      type: "text",
      text: { content: content.slice(0, 1900) },
    },
  ];
}

export function buildDateProperty(value?: string | null) {
  if (!value) {
    return undefined;
  }

  return {
    date: {
      start: value.slice(0, 10),
    },
  };
}

export function compactProperties(properties: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(properties).filter(([, value]) => value !== undefined));
}

export function buildAdminReferenceUrl(inquiryId: string) {
  const appUrl = process.env.ADMIN_APP_URL?.trim();
  if (!appUrl) return null;
  return `${appUrl.replace(/\/$/, "")}/admin/inquiries/${inquiryId}`;
}

export function buildSharedPageTitle(contactName: string, inquiryTitle: string) {
  return `${contactName} - ${inquiryTitle}`.slice(0, 120);
}

export async function findExistingPageIdByTitle(databaseId: string, title: string, token: string) {
  const payload = (await notionRequest(`/databases/${databaseId}/query`, {
    method: "POST",
    body: JSON.stringify({
      filter: {
        property: "이름",
        title: { equals: title },
      },
      page_size: 1,
    }),
  }, token)) as { results?: Array<{ id: string }> };

  return payload.results?.[0]?.id ?? null;
}

export async function findExistingPageIdByUrl(databaseId: string, propertyName: string, value: string, token: string) {
  const payload = (await notionRequest(`/databases/${databaseId}/query`, {
    method: "POST",
    body: JSON.stringify({
      filter: {
        property: propertyName,
        url: { equals: value },
      },
      page_size: 1,
    }),
  }, token)) as { results?: Array<{ id: string }> };

  return payload.results?.[0]?.id ?? null;
}

export async function listChildBlockIds(blockId: string, token: string) {
  const payload = (await notionRequest(`/blocks/${blockId}/children?page_size=100`, {
    method: "GET",
  }, token)) as { results?: Array<{ id: string }> };

  return payload.results?.map((result) => result.id) ?? [];
}

export async function archiveChildBlocks(blockId: string, token: string) {
  const childIds = await listChildBlockIds(blockId, token);

  if (childIds.length === 0) {
    return;
  }

  await Promise.all(
    childIds.map((childId) =>
      notionRequest(`/blocks/${childId}`, {
        method: "PATCH",
        body: JSON.stringify({ archived: true }),
      }, token)
    )
  );
}

export async function upsertPage(input: {
  databaseId: string;
  token: string;
  title: string;
  fallbackUrl?: { propertyName: string; value: string | null };
  properties: Record<string, unknown>;
  children: object[];
}) {
  const existingByUrl =
    input.fallbackUrl?.value
      ? await findExistingPageIdByUrl(input.databaseId, input.fallbackUrl.propertyName, input.fallbackUrl.value, input.token)
      : null;
  const existingPageId = existingByUrl ?? (await findExistingPageIdByTitle(input.databaseId, input.title, input.token));

  if (!existingPageId) {
    const created = (await notionRequest("/pages", {
      method: "POST",
      body: JSON.stringify({
        parent: { type: "database_id", database_id: input.databaseId },
        properties: input.properties,
        children: input.children,
      }),
    }, input.token)) as { id: string };

    return { status: "created" as const, pageId: created.id };
  }

  await notionRequest(`/pages/${existingPageId}`, {
    method: "PATCH",
    body: JSON.stringify({ properties: input.properties }),
  }, input.token);

  await archiveChildBlocks(existingPageId, input.token);

  await notionRequest(`/blocks/${existingPageId}/children`, {
    method: "PATCH",
    body: JSON.stringify({ children: input.children }),
  }, input.token);

  return { status: "updated" as const, pageId: existingPageId };
}
