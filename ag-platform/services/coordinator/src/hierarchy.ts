import { GoogleGenAI } from '@google/genai';
import { Worker } from 'worker_threads';
import { join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

// ─── Types ─────────────────────────────────────────────────────────────────

export type AgentRole = 'coordinator' | 'research' | 'code' | 'writer' | 'reviewer';

export interface AgentTask {
  id: string;
  role: AgentRole;
  description: string;
  priority: 1 | 2 | 3 | 4 | 5;
  dependencies: string[];
  context?: Record<string, string>;
}

export interface AgentResult {
  taskId: string;
  role: AgentRole;
  status: 'pending' | 'running' | 'completed' | 'failed';
  output?: string;
  error?: string;
  duration?: number;
  startedAt?: number;
  completedAt?: number;
}

export interface OrchestrationPlan {
  objective: string;
  strategy: string;
  tasks: AgentTask[];
  parallelGroups: string[][];  // Task IDs that can run in parallel
}

// ─── Hierarchy ──────────────────────────────────────────────────────────────

/**
 * LAYER 1: COORDINATOR
 * Top-level orchestrator. Receives user request, decomposes into tasks,
 * assigns to specialist agents, and manages the workflow.
 */
export class CoordinatorAgent {
  private genAI: GoogleGenAI;
  private model: string;

  constructor(apiKey: string) {
    this.genAI = new GoogleGenAI({ apiKey });
    this.model = 'gemini-2.0-flash-exp';  // Use flash for speed
  }

  /**
   * Step 1: Decompose user request into structured plan
   */
  async plan(userRequest: string): Promise<OrchestrationPlan> {
    const prompt = `You are the Coordinator Agent — the top-level orchestrator of a multi-agent AI system.

Your job: Analyze the user's request and create a structured execution plan.

## Rules
1. Break the request into discrete sub-tasks
2. Assign each task to a specialist:
   - research: Information gathering, data analysis, fact verification
   - code: Programming, debugging, technical implementation
   - writer: Content creation, documentation, communication
   - reviewer: Quality assurance, fact-checking, critique
3. Identify dependencies (what must complete before what)
4. Group tasks that can run in parallel

## Output Format
Return ONLY valid JSON, no markdown:

{
  "objective": "One-line summary of the goal",
  "strategy": "Brief explanation of the approach",
  "tasks": [
    {
      "id": "task-1",
      "role": "research|code|writer|reviewer",
      "description": "Detailed task instructions",
      "priority": 1-5,
      "dependencies": ["task-id"]
    }
  ],
  "parallelGroups": [
    ["task-1", "task-2"],
    ["task-3"]
  ]
}

## User Request
${userRequest}`;

    const result = await this.genAI.models.generateContent({
      model: this.model,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });

    const text = result.text?.trim() || '';
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('Coordinator failed to produce valid plan');

    const plan = JSON.parse(match[0]) as OrchestrationPlan;
    return plan;
  }

  /**
   * Step 4: Synthesize results from all agents into final response
   */
  async synthesize(objective: string, results: AgentResult[]): Promise<string> {
    const completed = results.filter(r => r.status === 'completed');
    const failed = results.filter(r => r.status === 'failed');

    const context = completed.map(r =>
      `### ${r.role.toUpperCase()} OUTPUT
Task: ${r.taskId}
${r.output}`
    ).join('\n\n');

    const prompt = `You are the Coordinator Agent — synthesizing results from specialist agents.

## Original Objective
${objective}

## Specialist Agent Results
${context}

${failed.length > 0 ? `\n## Failed Tasks\n${failed.map(f => `- ${f.taskId}: ${f.error}`).join('\n')}` : ''}

## Instructions
1. Synthesize all outputs into a coherent, actionable response
2. Maintain the original objective as the focus
3. Highlight key findings and recommendations
4. Format for readability
5. If tasks failed, acknowledge gaps and suggest next steps

## Final Response`;

    const result = await this.genAI.models.generateContent({
      model: this.model,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });

    return result.text || 'No response generated';
  }
}

/**
 * LAYER 2: SPECIALIST AGENTS
 * Middle layer — individual specialist workers with domain expertise
 */
export class SpecialistAgentPool {
  private genAI: GoogleGenAI;

  constructor(apiKey: string) {
    this.genAI = new GoogleGenAI({ apiKey });
  }

  /**
   * Execute a single task in an isolated worker thread
   */
  async execute(task: AgentTask): Promise<AgentResult> {
    const startTime = Date.now();

    try {
      const output = await this.runInWorker(task);

      return {
        taskId: task.id,
        role: task.role,
        status: 'completed',
        output,
        duration: Date.now() - startTime,
        startedAt: startTime,
        completedAt: Date.now(),
      };
    } catch (error) {
      return {
        taskId: task.id,
        role: task.role,
        status: 'failed',
        error: String(error),
        duration: Date.now() - startTime,
        startedAt: startTime,
        completedAt: Date.now(),
      };
    }
  }

  private async runInWorker(task: AgentTask): Promise<string> {
    return new Promise((resolve, reject) => {
      const worker = new Worker(join(__dirname, 'worker.js'), {
        workerData: { task, apiKey: this.getApiKey() },
      });

      const timeout = setTimeout(() => {
        worker.terminate();
        reject(new Error('Worker timeout after 5 minutes'));
      }, 300000);

      worker.on('message', (result: string) => {
        clearTimeout(timeout);
        resolve(result);
      });

      worker.on('error', (err) => {
        clearTimeout(timeout);
        reject(err);
      });

      worker.on('exit', (code) => {
        if (code !== 0) {
          clearTimeout(timeout);
          reject(new Error(`Worker exited with code ${code}`));
        }
      });
    });
  }

  private getApiKey(): string {
    return process.env.GEMINI_API_KEY || '';
  }
}

/**
 * LAYER 3: RESULT AGGREGATOR
 * Bottom layer — validates and formats final output
 */
export class ResultAggregator {
  async aggregate(results: AgentResult[], plan: OrchestrationPlan): Promise<string> {
    // Check for failures
    const failed = results.filter(r => r.status === 'failed');

    let report = `# Execution Report\n\n`;
    report += `**Objective:** ${plan.objective}\n`;
    report += `**Strategy:** ${plan.strategy}\n\n`;

    // Group by status
    const completed = results.filter(r => r.status === 'completed');

    report += `## Summary\n`;
    report += `- ✅ Completed: ${completed.length}/${results.length}\n`;
    report += `- ❌ Failed: ${failed.length}/${results.length}\n`;
    report += `- ⏱️ Total Duration: ${results.reduce((acc, r) => acc + (r.duration || 0), 0)}ms\n\n`;

    // Agent outputs
    for (const result of completed) {
      report += `### ${result.role.toUpperCase()} (${result.taskId})\n`;
      report += `${result.output}\n\n`;
    }

    if (failed.length > 0) {
      report += `## Failed Tasks\n`;
      for (const f of failed) {
        report += `- **${f.taskId}** (${f.role}): ${f.error}\n`;
      }
    }

    return report;
  }
}

/**
 * Main orchestration engine
 * Connects all layers and manages the flow
 */
export class HierarchicalCoordinator {
  private coordinator: CoordinatorAgent;
  private pool: SpecialistAgentPool;
  private aggregator: ResultAggregator;

  constructor(apiKey: string) {
    this.coordinator = new CoordinatorAgent(apiKey);
    this.pool = new SpecialistAgentPool(apiKey);
    this.aggregator = new ResultAggregator();
  }

  /**
   * Execute a user request through the full hierarchy
   *
   * Flow:
   * 1. COORDINATOR: Plan decomposition
   * 2. SPECIALISTS: Parallel execution by dependency groups
   * 3. AGGREGATOR: Result compilation
   * 4. COORDINATOR: Final synthesis
   */
  async execute(userRequest: string): Promise<{ finalAnswer: string; report: string; results: AgentResult[] }> {
    const startTime = Date.now();

    // ─── Step 1: COORDINATOR plans ────────────────────────────
    const plan = await this.coordinator.plan(userRequest);
    const results: AgentResult[] = [];

    // ─── Step 2: Execute in dependency order ─────────────────
    for (const group of plan.parallelGroups) {
      // All tasks in a group can run in parallel
      const taskGroup = plan.tasks.filter(t => group.includes(t.id));
      const groupResults = await Promise.all(
        taskGroup.map(t => this.pool.execute(t))
      );
      results.push(...groupResults);
    }

    // ─── Step 3: AGGREGATOR compiles ──────────────────────────
    const report = await this.aggregator.aggregate(results, plan);

    // ─── Step 4: COORDINATOR synthesizes ────────────────────────
    const finalAnswer = await this.coordinator.synthesize(plan.objective, results);

    return { finalAnswer, report, results };
  }
}
