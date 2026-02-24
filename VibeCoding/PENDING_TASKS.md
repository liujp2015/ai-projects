# 单词复习功能 - 已完成任务清单

## ✅ 1. 前端 UI 集成 (文档详情页)
- **文件**: `frontend/src/app/documents/[id]/page.tsx`
- **已完成任务**:
    - ✅ 在"对照"标签页顶部插入"复习进度"显示模块（显示今日待复习、学习中、已掌握数量）。
    - ✅ 集成"导入到复习"按钮，点击后调用 `handleImportReviewCards` 并自动刷新摘要。
    - ✅ 添加"开始刷词"跳转按钮，链接至 `/documents/[id]/review-cards`。
- **当前状态**: 所有功能已实现并集成到页面中。

## ✅ 2. 刷词页面优化 (移动端适配与交互)
- **文件**: `frontend/src/app/documents/[id]/review-cards/page.tsx`
- **已完成任务**:
    - ✅ **剩余数展示**: 在顶部导航实时显示本批次还剩多少个单词（`剩余 {Math.max(cards.length - currentIndex - 1, 0)}`）。
    - ✅ **一键刷新**: 已添加刷新图标按钮，允许手动触发 `loadCards` 重新拉取待复习列表。
    - ✅ **移动端适配**:
        - 已适配 iPhone 底部安全区（`pb-[calc(1rem+env(safe-area-inset-bottom))]`），防止操作按钮贴底或被遮挡。
        - 已调整卡片最小高度（`min-h-[400px] sm:min-h-[450px]`），确保在小屏幕上不出现垂直滚动条。
        - 已优化按钮尺寸和点击热区（响应式 padding 和字体大小）。

## ✅ 3. 导出原形功能
- **文件**: `frontend/src/app/documents/[id]/page.tsx`
- **已完成任务**:
    - ✅ 添加"导出原形"按钮，调用 `exportDocumentLemmas` API。
    - ✅ 实现文件下载功能，将文档的所有 lemma（原形）导出为 `.txt` 文件。

## ✅ 4. 词汇对照表增强
- **文件**: `frontend/src/app/documents/[id]/page.tsx`
- **已完成任务**:
    - ✅ 在词汇对照表中添加"Lemma"列，显示单词的原形。
    - ✅ 优先使用后端返回的 `alignedWordPairs` 数据（包含 lemma），兼容旧数据格式。
    - ✅ 在词汇对照表中添加"词性"列，显示 noun/verb/adjective/adverb（名词/动词/形容词/副词）。
    - ✅ 导入或同步时自动将 ExtractedWord 的词性同步到 AlignedWordPair，用于刷词时按词性筛选。

## ✅ 5. 词性分类逻辑说明
- **词性来源**：词性来自「提取词性」功能，由 AI 从句子中提取。
- **分类依据**：按**单词在句子中的用法**分类，而非词典原形词性。
  - 例如："developing" 在 "developing countries" 中可能标为形容词（adjective），在 "I am developing" 中可能标为动词（verb）。
  - 同一单词在不同句子中可能被标为不同词性，取决于其在该句中的语法角色。
- **数据流**：提取词性 → ExtractedWord → 导入 → 同步到 AlignedWordPair → 词汇对照表显示 + 刷词按词性筛选。

## 📋 功能闭环验证建议
- 建议测试以下场景：
    - 验证"提取词性"后，点"导入"能正确进入 `ReviewCard` 表。
    - 测试"认识"和"忘记了"按钮对 `stage` 和 `nextReviewAt` 的修改是否符合艾宾浩斯逻辑（+1天, +2天, +4天...）。
    - 确保 `MASTERED` 状态的单词不再出现在复习队列中。

---
*注：所有前端功能已实现完成，后端逻辑已就绪，数据库表 `ReviewCard` 已建立。*
