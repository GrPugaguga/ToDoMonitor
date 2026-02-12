import { createHmac } from "crypto";
import { NextRequest } from "next/server";

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
}

interface AuthResult {
  telegramId: bigint;
  firstName: string;
  lastName?: string;
  username?: string;
}

function validateInitData(initData: string, botToken: string): boolean {
  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (!hash) return false;

  params.delete("hash");

  const dataCheckString = Array.from(params.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");

  const secretKey = createHmac("sha256", "WebAppData").update(botToken).digest();
  const computedHash = createHmac("sha256", secretKey)
    .update(dataCheckString)
    .digest("hex");

  if (computedHash !== hash) return false;

  const authDate = params.get("auth_date");
  if (authDate) {
    const now = Math.floor(Date.now() / 1000);
    if (now - parseInt(authDate) > 3600) return false;
  }

  return true;
}

function parseUserFromInitData(initData: string): TelegramUser | null {
  const params = new URLSearchParams(initData);
  const userStr = params.get("user");
  if (!userStr) return null;

  try {
    return JSON.parse(userStr) as TelegramUser;
  } catch {
    return null;
  }
}

export function authenticateRequest(req: NextRequest): AuthResult | null {
  if (process.env.SKIP_TG_VALIDATION === "true") {
    return {
      telegramId: BigInt(1),
      firstName: "Dev",
      username: "dev",
    };
  }

  const initData = req.headers.get("x-telegram-init-data");
  if (!initData) return null;

  const botToken = process.env.BOT_TOKEN;
  if (!botToken) return null;

  if (!validateInitData(initData, botToken)) return null;

  const user = parseUserFromInitData(initData);
  if (!user) return null;

  return {
    telegramId: BigInt(user.id),
    firstName: user.first_name,
    lastName: user.last_name,
    username: user.username,
  };
}
