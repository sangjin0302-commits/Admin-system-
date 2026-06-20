import { randomUUID } from "crypto";

export type ComputerTaskStep = {
  action: string;
  timestamp: Date;
};

export type ComputerTaskStatus = "pending" | "running" | "completed" | "failed";

export type ComputerTask = {
  id: string;
  title: string;
  instruction: string;
  status: ComputerTaskStatus;
  createdAt: Date;
  completedAt?: Date;
  result?: string;
  steps: ComputerTaskStep[];
};

const taskStore = new Map<string, ComputerTask>();

export function createTask(title: string, instruction: string): ComputerTask {
  const task: ComputerTask = {
    id: randomUUID(),
    title,
    instruction,
    status: "pending",
    createdAt: new Date(),
    steps: [],
  };
  taskStore.set(task.id, task);
  return task;
}

export function getTasks(): ComputerTask[] {
  return Array.from(taskStore.values()).sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
  );
}

export function getTaskById(id: string): ComputerTask | null {
  return taskStore.get(id) ?? null;
}

export async function executeTask(taskId: string): Promise<ComputerTask> {
  const task = taskStore.get(taskId);
  if (!task) {
    throw new Error(`Task not found: ${taskId}`);
  }

  task.status = "running";
  task.steps = [];

  const apiKey = process.env.ANTHROPIC_API_KEY;

  try {
    if (apiKey) {
      await runWithClaude(task, apiKey);
    } else {
      await runMock(task);
    }
    task.status = "completed";
    task.completedAt = new Date();
  } catch (err) {
    task.status = "failed";
    task.completedAt = new Date();
    task.result = err instanceof Error ? err.message : "Unknown error";
  }

  return task;
}

async function runMock(task: ComputerTask): Promise<void> {
  const baseSteps = [
    `navigate: 브라우저를 열고 대상 페이지로 이동 (instruction: ${task.instruction.slice(0, 60)})`,
    "screenshot: 현재 페이지 상태 캡처",
    "fill_form: 입력 필드에 데이터 작성",
    "click: 제출 버튼 클릭",
    "wait: 응답 대기",
    "screenshot: 결과 페이지 캡처",
    "extract: 결과 텍스트 추출",
  ];
  for (const action of baseSteps) {
    task.steps.push({ action, timestamp: new Date() });
    await new Promise((r) => setTimeout(r, 50));
  }
  task.result = `[모의 실행] 작업 "${task.title}" 완료. 총 ${baseSteps.length}단계 수행. ANTHROPIC_API_KEY를 설정하면 실제 Computer Use 에이전트가 실행됩니다.`;
}

async function runWithClaude(task: ComputerTask, apiKey: string): Promise<void> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      tools: [
        {
          type: "custom",
          name: "computer",
          description:
            "Simulated computer tool that can navigate, click, type, screenshot.",
          input_schema: {
            type: "object",
            properties: {
              action: {
                type: "string",
                enum: ["navigate", "click", "type", "screenshot", "extract"],
              },
              target: { type: "string" },
            },
            required: ["action"],
          },
        },
      ],
      messages: [
        {
          role: "user",
          content: `You are a computer-use agent. Plan and execute this task step by step using the computer tool. Task: ${task.title}\n\nInstruction: ${task.instruction}`,
        },
      ],
    }),
  });

  if (!res.ok) {
    throw new Error(`Anthropic API error: ${res.status}`);
  }

  const data = await res.json();
  const blocks: Array<{ type: string; name?: string; input?: unknown; text?: string }> =
    data.content ?? [];

  for (const block of blocks) {
    if (block.type === "tool_use") {
      task.steps.push({
        action: `${block.name}: ${JSON.stringify(block.input)}`,
        timestamp: new Date(),
      });
    } else if (block.type === "text" && block.text) {
      task.result = block.text;
    }
  }

  if (!task.result) {
    task.result = `작업 완료. ${task.steps.length}단계 실행됨.`;
  }
}
