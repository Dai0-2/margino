# Margino brand update — 1.0.19

Margino is the new display name of PaperFlow. This is an update to the existing Chrome Web Store item, not a new extension.

## Preserved identifiers

- Chrome item: `dffiahjmpkmellmjijffpcofoahbccoc`
- Manifest public key and OAuth client/scopes
- Native Messaging host: `com.paperflow.ai`
- Native binary/install locations, credential services, database names and storage keys
- Google Drive folder: `PaperFlow`
- Existing `paperflow-native-host-*.zip` download filenames

No data migration, sign-out, or Native Host reinstall is required for the brand change.

## 发布步骤

1. 在现有 Chrome 商店商品中上传 `paperflow-ai-v1.0.19-chrome-web-store.zip`；不要创建新商品。
2. 包中的名称为 Margino，更新商品说明、图标、官网及隐私政策链接。
3. 官网： https://dai0-2.github.io/margino/
4. 隐私政策： https://dai0-2.github.io/margino/privacy.html
5. 支持： https://github.com/Dai0-2/margino/issues
6. 保存草稿并提请审核；审核发布前，线上用户仍会看到 PaperFlow。

Google OAuth 同意屏幕的应用展示名可在 Google Auth Platform → 品牌塑造中改为 Margino。保留现有 OAuth Client ID 和 Chrome 商品 ID。

## Suggested store description

Margino (formerly PaperFlow) is a browser-native research workspace for reading, annotating, discussing, and organizing academic papers.

Read where you find papers. Think where you read them.

Read local and online PDFs, highlight passages, add comments, and keep notes and conversations connected to each paper. Organize your library with nested collections, tags, and search.

Optional AI features support ChatGPT subscriptions through the local Native Host and OpenAI-compatible APIs such as Gemini, Qwen, Kimi, DeepSeek, and other compatible providers. API mode does not require the Native Host.

Your library is stored locally. Optional Google Drive synchronization uses your own Google account. Existing PaperFlow users keep their library, annotations, and sign-in when upgrading to Margino.

新版官网与 README 使用 `website/showcase` 的确定性演示画面；它们用于说明交互，不代表性能测试或用户实际同步记录。旧截图和视频作为历史资产保留，不再作为首页主图。

商店宣传素材位于交付目录的 `store-assets/`：三张 `1280×800` 截图、`440×280` 小型宣传图和 `1400×560` 顶部宣传图，均为无透明通道的 JPEG。商店图标为单独的 `margino-icon-128.png`。
