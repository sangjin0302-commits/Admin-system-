export type ChatMessage = {
  id: string;
  caseId: string;
  authorEmail: string;
  authorName: string;
  message: string;
  createdAt: Date;
  mentions: string[];
};

const chatStore = new Map<string, ChatMessage[]>();

function generateId(): string {
  return `msg_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function extractMentions(text: string): string[] {
  const re = /@([a-zA-Z0-9_.-]+)/g;
  const out: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    out.push(m[1]);
  }
  return out;
}

export function postMessage(
  caseId: string,
  authorEmail: string,
  authorName: string,
  message: string
): ChatMessage {
  const msg: ChatMessage = {
    id: generateId(),
    caseId,
    authorEmail,
    authorName,
    message,
    createdAt: new Date(),
    mentions: extractMentions(message),
  };
  const arr = chatStore.get(caseId) ?? [];
  arr.push(msg);
  chatStore.set(caseId, arr);
  return msg;
}

export function getMessages(caseId: string, limit?: number): ChatMessage[] {
  const arr = chatStore.get(caseId) ?? [];
  if (limit && arr.length > limit) {
    return arr.slice(arr.length - limit);
  }
  return [...arr];
}

export function getUnreadCount(caseId: string, since: Date): number {
  const arr = chatStore.get(caseId) ?? [];
  return arr.filter((m) => m.createdAt > since).length;
}

export function listActiveCases(): { caseId: string; lastMessage: ChatMessage; total: number }[] {
  const out: { caseId: string; lastMessage: ChatMessage; total: number }[] = [];
  for (const [caseId, arr] of chatStore.entries()) {
    if (arr.length === 0) continue;
    out.push({ caseId, lastMessage: arr[arr.length - 1], total: arr.length });
  }
  return out.sort(
    (a, b) => b.lastMessage.createdAt.getTime() - a.lastMessage.createdAt.getTime()
  );
}
