import type { CustomToolDef } from "@/store/useOS";
import type { ToolResult, ToolContext } from "./types";
import { runJs } from "./exec";

/** Build a ToolResult from a custom tool code execution. */
export async function runCustomTool(
  def: CustomToolDef,
  args: Record<string, unknown>,
  ctx: ToolContext,
): Promise<ToolResult> {
  const wrapped = `
const args = ${JSON.stringify(args)};
const ctx = ${JSON.stringify(ctx)};
${def.code}
`;
  const res = await runJs(wrapped);
  if (!res.ok) {
    return { ok: false, summary: `Custom tool "${def.name}" failed`, data: { error: res.error } };
  }
  try {
    const parsed = JSON.parse(res.output || "{}");
    return {
      ok: true,
      summary: parsed.summary || `Custom tool "${def.name}" ran`,
      data: parsed.data ?? parsed,
    };
  } catch {
    return {
      ok: true,
      summary: res.output?.slice(0, 80) || `Custom tool "${def.name}" ran`,
      data: { output: res.output },
    };
  }
}

/** Merge custom tools into a tools record. */
export function mergeCustomTools(
  base: Record<string, { name: string; description: string; run: (args: Record<string, unknown>, ctx: ToolContext) => Promise<ToolResult> }>,
  customDefs: CustomToolDef[],
): Record<string, { name: string; description: string; run: (args: Record<string, unknown>, ctx: ToolContext) => Promise<ToolResult> }> {
  const merged = { ...base };
  for (const def of customDefs) {
    if (!def.enabled || !def.name) continue;
    merged[def.name] = {
      name: def.name,
      description: def.description || "Custom tool",
      run: (args: Record<string, unknown>, ctx: ToolContext) => runCustomTool(def, args, ctx),
    };
  }
  return merged;
}
