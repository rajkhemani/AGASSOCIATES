import { GoogleGenAI } from '@google/genai';
import { parentPort, workerData } from 'worker_threads';

const { task, apiKey } = workerData as { task: any; apiKey: string };

// ─── Specialist Agent Definitions ─────────────────────────────────────────

const AGENT_PROMPTS: Record<string, string> = {
  research: `You are a RESEARCH Agent. Your expertise:
- Deep internet research and data gathering
- Fact verification and source validation
- Comparative analysis and trend identification
- Data synthesis and insight extraction

Guidelines:
1. Always cite sources explicitly
2. Provide data-backed evidence
3. Distinguish between facts and opinions
4. Flag any uncertainties or gaps in data`,

  code: `You are a CODE Agent. Your expertise:
- Clean, efficient code generation
- Debugging and error resolution
- Technical architecture and design
- Best practices and performance optimization

Guidelines:
1. Write production-ready code with comments
2. Include error handling and edge cases
3. Follow language-specific best practices
4. Explain complex logic with inline comments`,

  writer: `You are a WRITER Agent. Your expertise:
- Compelling content creation
- Technical documentation
- Business communication and proposals
- Multi-format adaptation (email, report, blog, etc.)

Guidelines:
1. Adapt tone to audience (formal/casual/technical)
2. Use clear, concise language
3. Structure with headers and bullet points
4. Include call-to-action where appropriate`,

  reviewer: `You are a REVIEWER Agent. Your expertise:
- Quality assurance and critique
- Fact-checking and accuracy verification
- Consistency and coherence analysis
- Improvement recommendations

Guidelines:
1. Be constructive but thorough
2. Identify specific issues, not vague criticisms
3. Provide actionable improvement suggestions
4. Evaluate against the original request's goal`,
};

// ─── Worker Execution ──────────────────────────────────────────────────────

async function executeTask() {
  const genAI = new (GoogleGenAI as any)(apiKey);
  const prompt = AGENT_PROMPTS[task.role] || AGENT_PROMPTS.writer;

  const result = await genAI.models.generateContent({
    model: 'gemini-2.0-flash-exp',
    contents: [
      { role: 'user', parts: [{ text: prompt }] },
      { role: 'model', parts: [{ text: 'I understand my role. Ready to receive the task.' }] },
      { role: 'user', parts: [{ text: task.description }] },
    ],
  });

  return result.text || 'No output generated';
}

// Run and report back
executeTask()
  .then((output) => parentPort?.postMessage(output))
  .catch((err) => parentPort?.postMessage(`ERROR: ${err.message}`));
