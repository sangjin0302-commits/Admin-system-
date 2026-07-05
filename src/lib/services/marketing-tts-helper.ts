/**
 * 공용 TTS 헬퍼: OpenAI TTS 로 mp3 를 생성하여 public/generated/{feature}/{id}.mp3 로 저장.
 * OPENAI_API_KEY 미설정 시 null 반환. 각 마케팅 서비스에서 재사용한다.
 */

import { logger } from "@/lib/utils/logger";
import { promises as fs } from "fs";
import path from "path";

const OPENAI_TTS_URL = "https://api.openai.com/v1/audio/speech";
const DEFAULT_MODEL = process.env.OPENAI_TTS_MODEL?.trim() || "tts-1";
const DEFAULT_VOICE = process.env.OPENAI_TTS_VOICE?.trim() || "alloy";

export async function synthesizeMp3(input: {
  feature: string;
  id: string;
  text: string;
  voice?: string;
  model?: string;
}): Promise<{ audioUrl: string | null; filePath: string | null }> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return { audioUrl: null, filePath: null };
  try {
    const res = await fetch(OPENAI_TTS_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: input.model ?? DEFAULT_MODEL,
        voice: input.voice ?? DEFAULT_VOICE,
        input: input.text.slice(0, 4000),
        response_format: "mp3",
      }),
    });
    if (!res.ok) {
      logger.warn("[tts] OpenAI 실패", { status: res.status, feature: input.feature });
      return { audioUrl: null, filePath: null };
    }
    const buf = Buffer.from(await res.arrayBuffer());
    const dir = path.join(process.cwd(), "public", "generated", input.feature);
    await fs.mkdir(dir, { recursive: true });
    const file = path.join(dir, `${input.id}.mp3`);
    await fs.writeFile(file, buf);
    return {
      audioUrl: `/generated/${input.feature}/${input.id}.mp3`,
      filePath: file,
    };
  } catch (err) {
    logger.warn("[tts] 예외", err);
    return { audioUrl: null, filePath: null };
  }
}

/** SVG → public/generated/{feature}/{id}/{index}.svg 로 저장. 결과 배열 반환. */
export async function saveSlideSvgs(input: {
  feature: string;
  id: string;
  svgs: string[];
}): Promise<string[]> {
  const dir = path.join(process.cwd(), "public", "generated", input.feature, input.id);
  await fs.mkdir(dir, { recursive: true });
  const urls: string[] = [];
  for (let i = 0; i < input.svgs.length; i++) {
    const file = path.join(dir, `${i}.svg`);
    await fs.writeFile(file, input.svgs[i], "utf8");
    urls.push(`/generated/${input.feature}/${input.id}/${i}.svg`);
  }
  return urls;
}

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const HAIKU_MODEL = "claude-haiku-4-5-20251001";

/** Haiku 호출 공용 헬퍼. 실패 시 null. */
export async function callHaiku(input: {
  system: string;
  user: string;
  maxTokens?: number;
}): Promise<string | null> {
  const key = process.env.ANTHROPIC_API_KEY?.trim();
  if (!key) return null;
  try {
    const res = await fetch(ANTHROPIC_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: HAIKU_MODEL,
        max_tokens: input.maxTokens ?? 1500,
        system: input.system,
        messages: [{ role: "user", content: input.user }],
      }),
    });
    if (!res.ok) {
      logger.warn("[haiku] error", res.status);
      return null;
    }
    const data = await res.json();
    const text = data?.content?.[0]?.text?.trim();
    return typeof text === "string" ? text : null;
  } catch (err) {
    logger.warn("[haiku] 예외", err);
    return null;
  }
}
