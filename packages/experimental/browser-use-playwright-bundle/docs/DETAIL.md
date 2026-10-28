# Playwright browser

Turning this bundle on installs the Playwright MCP provider and gives each new session its own isolated Chromium. The provider starts headless; sessions created after activation share the connection across their turns until the provider is disabled or the application restarts.

The first launch needs a Chromium build that the bundled Playwright version recognizes. Run `npx playwright install chromium` once, or start the provider with `executablePath` pointing at an existing Chromium or Chrome executable through a profile patch.

Browser profiles, cookies, and pages live only in the running session. Resuming a session after a restart starts fresh browser state. Only one browser-use provider may be active in a profile; see the package README for attach mode, visible-browser settings, and the system prompt constraint on browser tool names.
