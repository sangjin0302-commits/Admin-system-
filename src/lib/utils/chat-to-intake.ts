export function extractIntakeFromChat(messages: Array<{ role: string; content: string }>): {
  summary: string;
  category: string;
} {
  const userMessages = messages
    .filter(m => m.role === "user")
    .map(m => m.content)
    .slice(-3)
    .join("\n");

  const summary = userMessages.slice(0, 500);

  // Simple keyword matching for category
  const categoryMap: Record<string, string[]> = {
    visa: ["비자", "D-8", "D-10", "F-2", "E-7", "체류", "visa", "입국"],
    appeal: ["행정심판", "취소소송", "이의신청", "거부처분"],
    corporate: ["법인", "설립", "사업자", "회사"],
    license: ["인허가", "허가", "면허", "등록"],
    contract: ["계약", "사실조사", "번역", "공증"],
  };

  let category = "";
  for (const [cat, keywords] of Object.entries(categoryMap)) {
    if (keywords.some(kw => summary.includes(kw))) {
      category = cat;
      break;
    }
  }

  return { summary, category };
}
