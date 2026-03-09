# 英语段落写作导师系统设计文档（基于当前项目）v0.7

## 文档信息

- 版本：v0.7
- 状态：可落地设计稿（支持研发拆分）
- 适用项目：`VibeCoding`（NestJS + Next.js + Prisma + PostgreSQL）
- 目标：实现“范文逻辑拆解 -> 新主题迁移 -> 分步苏格拉底引导写作”

---

## 1. 项目背景与目标

### 1.1 背景

当前项目已具备以下能力：

1. **后端模块化基础（NestJS）**：已有 `document`、`conversation`、`exercise`、`review`、`sentence-builder`、`ai` 模块。
2. **模型调用与结构化解析能力**：`ai/ocr.service.ts` 已实现“JSON 输出 + 字段校验 + 重试”完整链路。
3. **前端应用基础（Next.js App Router）**：已有多业务页面与 API 代理路由模式。
4. **数据持久化能力（Prisma + PostgreSQL）**：已有文档、句对、对话、练习等数据实体。

因此该功能可采用“**增量扩展**”，不需重构主架构。

### 1.2 业务目标

构建智能英语段落写作导师系统，核心价值：

- 抽象范文“逻辑骨架”（PEEL）
- 将逻辑迁移到新主题写作
- 用中文步骤化提问提升表达能力
- 避免“代写”，强调“启发式教学”

### 1.3 MVP 边界

MVP 仅覆盖：

- 单段英文范文
- PEEL 四类逻辑单元
- 单会话逐步引导
- 支持会话恢复

MVP 不覆盖：

- 多段文章评分
- 多人协作写作
- 复杂权限体系

---

## 2. 需求拆解（PRD）

### 2.1 核心功能

1. **范文分析模块**
   - 输入英文段落
   - 输出逻辑单元 + 文本范围（offset）
   - 前端可视化高亮

2. **逻辑提炼模块**
   - 将范文转换成“可复用逻辑蓝图”
   - 每个步骤附带中文“写作意图解释”

3. **教学引导模块**
   - 根据当前步骤生成中文苏格拉底问题
   - 先中文思考，再英文表达

4. **分步反馈模块**
   - 审核用户输入是否满足当前逻辑目标
   - 提供启发提示而非直接答案

### 2.2 用户旅程

1. 用户输入范文
2. AI 拆解并高亮逻辑
3. 用户输入新主题
4. AI 按步骤引导（Point -> Evidence -> Explanation -> Link）
5. 用户完成新段落并获得结构总结

### 2.3 成功指标（MVP）

- 逻辑拆解 JSON 可用率 >= 95%
- 会话完成率 >= 60%
- 平均引导轮次 4~8
- 会话恢复成功率 >= 99%

---

## 3. 技术架构设计（TDD）

### 3.1 分层架构

- **前端（Head）**：Next.js + TipTap + Tailwind
- **后端（Brain）**：NestJS + LangGraph 编排 + Prisma
- **模型层（LLM）**：Qwen/GPT/Claude（通过统一适配层）
- **数据层**：PostgreSQL（会话与步骤持久化）

### 3.2 复用与新增策略

#### 复用

- `ai` 模块的 JSON 解析、重试、日志机制
- 现有 App Router API 代理模式
- Prisma 迁移与索引策略

#### 新增

- 后端 `writing` 模块
- LangGraph 状态机编排层
- 前端 `writing-tutor` 页面与 TipTap 自定义 Mark

---

## 4. 后端详细设计

### 4.1 模块目录建议

```text
backend/src/writing/
  writing.module.ts
  writing.controller.ts
  writing.service.ts
  dto/
    analyze.dto.ts
    start-session.dto.ts
    next-step.dto.ts
  graph/
    writing.state.ts
    writing.graph.ts
    nodes/
      analyze.node.ts
      guidance.node.ts
      review.node.ts
  prompts/
    analyze.prompt.ts
    guidance.prompt.ts
    review.prompt.ts
  schemas/
    logic-map.schema.ts
```

### 4.2 状态定义

```ts
interface WritingState {
  sessionId: string;
  originalText: string;
  logicMap: LogicUnit[];
  blueprint: BlueprintNode[];
  currentStepIndex: number;
  newTheme: string;
  userDraftLines: string[];
  latestUserInput?: string;
  latestReview?: {
    pass: boolean;
    score: number;
    feedbackZh: string;
    hints?: string[];
  };
  nextPrompt?: string;
  done: boolean;
}
```

### 4.3 LangGraph 节点设计

1. **AnalyzeNode**
   - 输入：`originalText`
   - 输出：`logicMap + blueprint`
   - 使用结构化 JSON 输出

2. **GuidanceNode**
   - 输入：`currentStepIndex + blueprint + newTheme + latestReview`
   - 输出：`nextPrompt`（中文启发）

3. **ReviewNode**
   - 输入：`latestUserInput + 当前逻辑节点`
   - 输出：`pass/score/feedback/hints`

4. **AdvanceNode（可选）**
   - pass 则推进步骤
   - 最后一步完成时 `done=true`

### 4.4 状态流转

```text
INIT -> ANALYZED -> GUIDING(step n) -> REVIEWING ->
  [pass] GUIDING(step n+1)
  [fail] GUIDING(step n)
GUIDING(last) -> COMPLETED
```

### 4.5 API 设计

#### `POST /writing/analyze`

输入范文，返回逻辑单元与蓝图。

#### `POST /writing/start-session`

初始化会话，返回 `sessionId`、`currentStepIndex`、`nextPrompt`。

#### `POST /writing/next-step`

提交用户当前回答，返回反馈与下一步引导（支持 JSON / SSE）。

#### `GET /writing/session/:id`

恢复会话快照（包括步骤、历史输入与最新提示）。

---

## 5. 数据模型设计（Prisma）

> 以下为新增模型建议，便于与当前 `schema.prisma` 并存。

### 5.1 WritingSession

- `id: String @id @default(uuid())`
- `originalText: String @db.Text`
- `newTheme: String`
- `status: String` (`INIT | IN_PROGRESS | COMPLETED | ABANDONED`)
- `currentStepIndex: Int @default(0)`
- `logicMapJson: Json`
- `blueprintJson: Json`
- `finalDraft: String? @db.Text`
- `createdAt, updatedAt`

索引：
- `@@index([status])`
- `@@index([createdAt])`

### 5.2 WritingStepAttempt

- `id: String @id @default(uuid())`
- `sessionId: String`
- `stepIndex: Int`
- `logicType: String`
- `userInputZh: String? @db.Text`
- `userInputEn: String? @db.Text`
- `reviewPass: Boolean`
- `reviewScore: Float?`
- `reviewFeedback: String @db.Text`
- `createdAt: DateTime @default(now())`

索引：
- `@@index([sessionId, stepIndex])`
- `@@index([sessionId, createdAt])`

---

## 6. 前端详细设计（Next.js + TipTap）

### 6.1 页面结构

新增路由：

- `frontend/src/app/writing-tutor/page.tsx`（入口）
- `frontend/src/app/writing-tutor/[sessionId]/page.tsx`（会话页）

### 6.2 组件划分

- `WritingEditor`：显示范文与逻辑高亮
- `LogicLegend`：逻辑类型图例
- `StepProgress`：流程进度
- `FloatingTeacher`：当前中文引导
- `ThemeInputPanel`：新主题输入

### 6.3 TipTap 扩展设计

自定义 Mark：`logicHighlight`

属性建议：
- `data-logic-type`: `point/evidence/explanation/link`
- `data-step-index`: 当前步骤索引

颜色规范：
- Point：蓝色
- Evidence：绿色
- Explanation：橙色
- Link：紫色

### 6.4 实时反馈（SSE）

后端事件建议：
- `guidance_token`
- `review_result`
- `step_advanced`
- `session_completed`

前端行为：
- 逐 token 打字机渲染
- 中断/重连可恢复到最近 step

---

## 7. Prompt 与输出约束

### 7.1 Analyze Prompt

目标：将段落拆为 PEEL，并返回 offset。

强约束：
- 只允许 JSON
- type 必须为 `Point | Evidence | Explanation | Link`
- `start/end` 必须在原文范围内

### 7.2 Guidance Prompt

目标：生成中文启发问题。

强约束：
- 禁止直接给完整英文答案
- 先问思路，再给连接词建议

### 7.3 Review Prompt

目标：判断当前输入是否满足逻辑目的。

输出字段：
- `pass: boolean`
- `score: number (0-1)`
- `feedbackZh: string`
- `hints: string[]`

---

## 8. 错误处理与可靠性

### 8.1 JSON 校验与重试

参考当前 OCR 服务实践：

1. 首次校验失败 -> 返回原因并自动重试一次
2. 再失败 -> 返回业务错误码并记录原始响应
3. 错误码示例：
   - `WRITING_ANALYZE_SCHEMA_INVALID`
   - `WRITING_SESSION_NOT_FOUND`
   - `WRITING_STEP_OUT_OF_RANGE`
   - `WRITING_MODEL_TIMEOUT`

### 8.2 并发一致性

- `next-step` 时以数据库 `currentStepIndex` 为准
- 必要时在事务中校验 step 防止重复推进

### 8.3 超时与降级

- 模型超时：提示稍后重试，保持会话状态
- SSE 异常：降级为普通 JSON 响应

---

## 9. 安全与合规

- 输入长度限制（防滥用）
- DTO + schema 双层校验
- 错误返回脱敏
- 关键路径日志记录（sessionId + step + traceId）

---

## 10. 开发里程碑

### 阶段 1（MVP 基础）

- 新增 `writing` 模块
- 完成 `/writing/analyze`
- 前端静态高亮展示

### 阶段 2（状态机引导）

- 接入 LangGraph
- 完成 `start-session / next-step / get-session`
- 落库会话与步骤历史

### 阶段 3（体验优化）

- SSE 流式输出
- TipTap 浮动教师面板
- 引导文案与评分策略迭代

---

## 11. 验收标准

### 功能验收

- 能将范文分解成可解释逻辑单元
- 能引导用户完成完整 PEEL 迁移写作
- 支持刷新后会话恢复

### 技术验收

- 新增 Prisma 迁移成功
- 四个核心接口可用且带 DTO 校验
- 关键流程可观测（日志完整）

### 体验验收

- 高亮逻辑与图例一致
- AI 反馈具启发性，不直接代写
- SSE 体验流畅

---

## 12. 落地任务清单

1. 后端：创建 `writing` 模块与 DTO
2. 后端：定义 `WritingState` 与 schema 校验
3. 后端：新增 Prisma 模型并迁移
4. 后端：实现 4 个核心 API
5. 前端：新增 `writing-tutor` 页面
6. 前端：集成 TipTap 与逻辑高亮扩展
7. 前端：实现教师面板、步骤进度、SSE 客户端
8. 联调：完成端到端用户旅程

---

## 13. 总结

该设计与当前项目兼容性高、增量改造成本低。核心新增仅集中在：

- 后端 `writing + LangGraph` 编排层
- 前端 `TipTap` 逻辑高亮与引导交互
- Prisma 写作会话模型

建议按“**先分析可视化 -> 再状态机教学 -> 最后流式体验**”三阶段推进，能够快速上线可用 MVP 并持续优化教学效果。
