# Design references: AI agent / AI chat mobile apps

Research for the visual redesign of TomatoRemote (SwiftUI iPhone app remote-controlling a Mac AI agent).
Surfaces in scope: chat transcript (user bubbles + Markdown assistant answers), tool-call cards, streaming/live status strip, composer dock, welcome/empty state.
Every source below was actually fetched on 2026-11-19. Patterns are distilled from what each page states, mapped to implementable SwiftUI decisions.

---

## 1. [OpenAI — Introducing ChatGPT agent](https://openai.com/index/introducing-chatgpt-agent)

Official launch post for ChatGPT's agentic mode (July 2025). Describes the agent UX contract: narration, interruption, permission, takeover, completion notifications.

- **Live on-screen narration, not a static spinner.** OpenAI: "an on-screen narration provides visibility into exactly what ChatGPT is doing." Implement the status strip as a verb-first line that updates per agent step ("Reading your calendar…", "Running tests…"), never a frozen "Working…".
- **Mode selection lives in the composer.** Agent mode is activated "through the tools dropdown from the composer… at any point in any conversation." Put the agent/chat mode toggle in a composer-dock accessory menu, not a separate settings screen.
- **Interrupt and steer without losing progress.** Users can message mid-task and the agent "picks up where it left off… without losing previous progress." Keep the composer enabled while the agent runs; show queued/steering messages inline in the transcript.
- **Pause / progress-summary / stop-with-partial-results.** For long runs users can "pause it, ask it for a progress summary, or stop it entirely and receive partial results." Add a Stop control plus a "Summarize progress" action to the running state; on stop, render whatever was produced instead of an empty error.
- **Explicit confirmation before consequential actions.** The agent "requests permission before taking actions of consequence" (purchases, sending email). Waiting-for-approval must be a distinct, blocking card state with Approve/Deny — visually louder than informational tool cards.
- **Watch Mode for critical tasks.** Some actions "require your active oversight." Consider a foreground-required banner state for high-risk approvals rather than a dismissible notification.
- **Completion push notification.** "If you have the ChatGPT app on your phone, it will send you a notification when it's done." Notify on task completion when the app is backgrounded; deep-link back into the transcript.
- **Takeover as a distinct visual state.** Login steps hand control to the user ("takeover mode") with private input. Model this as a clearly bordered "You're in control" state in the status strip, then resume the agent state afterward.

## 2. [Anthropic — Claude Code on the web](https://www.anthropic.com/news/claude-code-on-the-web)

Official announcement of delegated cloud coding sessions, including the iOS app preview. Establishes the session-list + steering + summary model.

- **Session list as a first-class surface.** "Run multiple tasks in parallel across different repositories from a single interface." Each task is a row with its own live state — the home screen is a list of runs, not just a chat inbox.
- **Real-time progress tracking per session.** "Each session runs in its own isolated environment with real-time progress tracking." Give every session row a status indicator (running/done/failed) that updates live.
- **Steering is a core interaction.** "You can actively steer Claude to adjust course as it's working through tasks." The transcript must accept user input during a run; style steering messages as normal user bubbles so the timeline reads naturally.
- **End with a clear change summary.** "Automatic PR creation and clear change summaries." Close each run with a compact summary card (what changed, outcome, link to detail) rather than leaving only raw tool logs as the final impression.
- **Mobile parity with desktop.** Claude Code shipped in the iOS app as part of the same preview — the same transcript/steering model is expected to work at phone width; design the transcript single-column first.
- **Isolation is communicated, not hidden.** Sandboxed execution with network restrictions is surfaced in the product story; show the execution environment (which Mac / which repo) in the session header so users know where actions happen.

## 3. [Claude — Claude Code desktop redesign](https://claude.com/resources/articles/claude-code-desktop-redesign)

Anthropic's redesign write-up for the desktop app. The single best source for tool-activity disclosure levels and session management.

- **Three-level tool-call disclosure: Verbose / Normal / Summary.** "Three view modes… let you dial the interface from full transparency into Claude's tool calls to just the results." Implement a transcript density setting: Verbose = every tool card expanded; Normal = completed steps collapsed into one expandable summary row ("Ran 6 tools · 2m 14s"); Summary = results only. Default to Normal on iPhone.
- **Filter sessions by status.** The sidebar filters "by status, project, or environment." Use a consistent status-pill taxonomy (running / needs approval / done / failed) shared between session rows and tool cards.
- **Auto-archive finished work.** "When a session's PR merges or closes, it archives itself so the sidebar stays focused on what's live." Move completed runs out of the default list automatically; keep an Archived view.
- **Side chat that reads but doesn't steer.** "Side chats pull context from the main thread, but don't add anything back." Offer a lightweight "ask about this run" sheet that never injects messages into the running task — separates questioning from steering.
- **Usage/context at a glance.** "A new usage button shows both your context window and session usage at a glance." A small gauge/button in the header for context consumption fits a remote-agent app with long sessions.
- **Stream as generated.** The app "now streams responses as Claude generates them" — token-by-token rendering is table stakes; never wait for completion to show text.
- **Results get their own pane.** Terminal, diff viewer, and preview are separate draggable panes beside chat. On iPhone, open large tool output (diffs, logs, files) in a sheet instead of inline transcript walls.

## 4. [Claude Code docs — Cloud sessions](https://code.claude.com/docs/en/claude-code-on-the-web)

Official docs for the web/mobile cloud-session UI. Concrete card, checklist, and recovery patterns.

- **Provisioning as a live checklist.** "The CLI shows a live checklist of setup steps, such as cloning the repository and running your setup script." Render reconnecting/setup as an expandable checklist row per step (pending → running → done) under the status strip.
- **Queue input while not ready.** "It queues messages you type during provisioning and sends them once the session is ready." Keep the composer active during reconnect; mark the message queued and deliver on reconnect — never dead-end the input.
- **Quantified summary card that taps into detail.** "The Changes card… shows the lines added and removed, such as `+42 -18`. Click the line counts… to open the diff view." Tool-card template: name + one-line args + compact result metric (duration, ±lines, exit code); tap opens full output.
- **Non-blocking suggestion cards.** Plugin suggestion cards carry an Add button but "you don't have to respond, and Claude carries on with the task either way." Visually distinguish optional cards (dismissable, muted) from blocking approval cards (accent border, requires answer).
- **Per-message rewind.** "Rewind to here" exists on transcript messages. Add a long-press/context action to retry or branch from any user message.
- **Permission mode is visible and changeable mid-run.** A mode dropdown is available "both when you create the task and while the session runs." Show the current approval policy (ask / auto-accept) in the session header or composer accessory.
- **Failed sends restore the prompt.** On failure, "your prompt is back in the box you sent it from," with a plain notice (connection lost / server error) and retry. Never lose typed input on a network failure.
- **Honest resume after expiry.** Reopening restores conversation history but explicitly names which background commands/subagents stopped and asks to rerun them. After a reconnect, show "history restored; these tasks stopped" rather than pretending nothing changed.

## 5. [Claude Code docs — Remote Control](https://code.claude.com/docs/en/remote-control)

Official docs for controlling a local Mac/PC Claude Code session from the Claude iOS app — the exact product category of TomatoRemote. The richest source for connection-state and approval UX.

- **Online state = icon + green status dot.** "Remote Control sessions show a computer icon with a green status dot when online." Use a Mac glyph + colored dot in the session row and header: green online, amber reconnecting, gray offline.
- **Disconnected copy must be honest about uncertainty.** "'Remote Control disconnected' or a 'Can't reach' message… Neither message tells you whether Claude or a subagent you were watching is still working." The reconnecting strip should say the agent may still be running on the Mac; don't imply failure or success you can't know.
- **Auto-reconnect silently when possible.** "Claude Code reconnects automatically when your machine comes back online." Reconnect in the background; only surface UI when reconnection fails or needs user action.
- **Approvals persist; informational dialogs expire.** "Claude Code keeps permission prompts and AskUserQuestion questions open until you answer them," while other forwarded dialogs close after five minutes with a no-action default. Two card behaviors: blocking approval cards never time out; informational cards can auto-dismiss with a stated default.
- **Presence-aware notifications.** Push arrives "when a long-running task finishes or when Claude needs a decision," and is skipped "while you are typing in or focused on the connected terminal." Notify only for completion and decisions; suppress while the user is actively watching the session.
- **Background work is visible and stoppable from the phone.** "The device shows any subagents and workflows the session already has running… Stop one of them from the device." List running subagents/tools as rows with individual stop controls, synced from the Mac.
- **System events render inline.** During compaction, "connected devices show the progress and then where the conversation was compacted." Show system events (compaction, clear, reconnect) as subtle inline transcript markers, not hidden state.
- **Partial attachment failure is annotated inline.** If a file can't download, the message still delivers with a note like "[1 of 3 attachments did not arrive]." Annotate degraded delivery in the bubble instead of failing the whole send.

## 6. [Google — Gemini 3 brings upgraded smarts and new capabilities to the Gemini app](https://blog.google/products-and-platforms/products/gemini/gemini-3-gemini-app)

Official Google post on the Gemini app redesign, generative interfaces, and Gemini Agent.

- **Model/mode selector in the prompt bar.** "Simply select 'Thinking' from the model selector" in the prompt bar. Put model/thinking-mode choice as a chip/menu inside the composer dock.
- **Structured answers as modules, not text walls.** Visual layout produces "an immersive, magazine-style view complete with photos and modules"; shopping results render "product listings, comparison tables and prices." The assistant Markdown renderer should support card/table/image blocks for structured content, not only paragraphs.
- **Artifacts live in a dedicated collection.** The new "My Stuff" folder gathers "images, videos and reports you've created." Give tool-produced files/artifacts a browsable collection outside the transcript.
- **Agent confirmations + takeover.** Gemini Agent "is designed to seek confirmation before critical actions like making purchases or sending messages, and you can take over anytime." Same approval-card contract as OpenAI: consequential actions pause for explicit confirmation.
- **Welcome state optimized for starting.** The redesign makes it "easier to start chats" — a clean, modern look with the composer as the hero. Empty state = prominent composer + a few starter suggestions, minimal chrome.
- **Concise, well-formatted answers as the default.** Gemini 3 responses are "more helpful, better formatted and more concise." Treat formatting quality (headings, lists, tables, brevity) as a product requirement of the answer renderer, not a model accident.

## 7. [Apple HIG — Generative AI](https://developer.apple.com/design/human-interface-guidelines/generative-ai)

Apple's official guidance for generative-AI features. Directly prescribes status copy, controls near output, and empty-state suggestions.

- **Specific, reassuring generation feedback.** "Instead of 'Processing…', say 'Finding substitutions for ingredients' or 'Summarizing key themes from your notes.'" Map every status-strip state to concrete verb-phrase copy describing the actual operation (thinking / running <tool> / writing / waiting for approval / reconnecting to <Mac>).
- **Refine/revert controls near generated content.** "Surfacing controls like Edit, Undo, Retry, or Adjust near generated content preserves people's agency." Attach Retry/Stop/Edit actions to the assistant message or tool card they act on, and visibly acknowledge when a correction takes effect.
- **Curated suggestions for open-ended inputs.** "For open-ended features like a search bar or generation prompt, consider offering curated suggestions that make it easy to get started." Welcome state: diverse predefined example prompts that hint at what the remote agent can do.
- **Plain-language errors with a next step.** "If something goes wrong, describe what happened in plain language and offer a clear next step." Failed tool cards and reconnect failures get one sentence of cause + one action button (Retry / Reconnect), never a raw error code alone.
- **Confirm irreversible actions.** "Generally, ask for confirmation before performing a significant action on someone's behalf"; avoid automating destructive actions. Gate destructive tool calls behind the approval card.
- **Unobtrusive output feedback.** "Simple thumbs-up and thumbs-down buttons… in a clear location that doesn't interrupt the experience." Optional per-message rating in the message action row, never a modal.
- **Clearly identify AI content.** "Clearly identify when and where you use AI." Keep assistant output visually labeled as agent-generated (avatar/label or consistent full-width treatment), distinct from user text.
- **Design for latency explicitly.** "Design a loading experience or generate in the background while a person uses another part of the app." Show an immediate loading state on send and keep the rest of the app usable during long runs.

## 8. [Apple HIG — Loading](https://developer.apple.com/design/human-interface-guidelines/loading)

Apple's loading-pattern page: placeholders, background work, determinate vs indeterminate.

- **Show something immediately.** "Consider showing placeholder text, graphics, or animations as content loads, replacing these elements as content becomes available." Insert a placeholder assistant row the moment a message is sent; replace it in place with streaming text — no blank transcript gap, no layout jump.
- **Never block the app on loading.** "Let people do other things in your app or game while they wait." History browsing, session switching, and settings stay interactive while the agent runs or reconnects.
- **Determinate only when duration is known.** "Use a determinate progress indicator when you know how long loading will take… indeterminate… when you don't." Thinking and open-ended tool runs get a spinner; a known plan of N steps gets "step 3 of 7" progress.
- **Make long waits useful.** "If loading takes an unavoidably long time, give people something interesting to view." During long reconnects show last-known session state or helpful context, not a bare full-screen spinner.

## 9. [Apple HIG — Progress indicators](https://developer.apple.com/design/human-interface-guidelines/progress-indicators)

Apple's component-level rules for spinners and progress bars — the spec sheet for the status strip and tool-card states.

- **One consistent status location.** "Display a progress indicator in a consistent location." The live strip owns a single fixed slot (e.g., above the composer) across all states; only its content changes, so users always know where to look.
- **Keep indicators moving; stationary reads as stalled.** "People tend to associate a stationary indicator with a stalled process." If a tool run stalls, switch to explicit stalled/reconnecting feedback instead of leaving a frozen spinner.
- **Succinct, accurate labels — avoid vague terms.** "Avoid vague terms like loading or authenticating." Label the strip "Running: git status" rather than "Loading…"; but "avoid labeling a spinning progress indicator" when it stands alone next to a control.
- **Spinner for background/constrained spaces.** "Prefer an activity indicator (spinner)… when space is constrained… next to a specific control." Tool-card running state = small inline `ProgressView`; done = checkmark; failed = warning glyph — no big bars inside cards.
- **Cancel when safe; Pause + Cancel when interruption costs work.** "If people can interrupt a process without causing negative side effects, include a Cancel button"; add Pause when stopping loses progress, and confirm when cancel discards work.
- **Switch indeterminate → determinate, never spinner → bar.** When a run's step count becomes known, upgrade to determinate progress; "don't switch from the circular style to the bar style" in the same slot.
- **Even out progress pacing.** "Showing 90 percent completion in five seconds and the last 10 percent in 5 minutes… can even feel deceptive." Smooth step-based progress rather than lumpy fake percentages.

## 10. [Nielsen Norman Group — Less Chat, More Answer: Site AI Chatbots Need to Get to the Point](https://www.nngroup.com/articles/less-chat-more-answer/)

NN/g usability study (April 2026) of AI chat responses. Evidence-backed rules for transcript typography, streaming, and answer structure.

- **Tight, scannable Markdown typography.** "Keep sentences short and paragraphs to no more than 2–3 sentences"; use "lists, bold text, headers, and white space." In a narrow chat viewport "even a small paragraph can look like a wall of text" — tune the assistant renderer's paragraph spacing, list indentation, and heading scale for iPhone width.
- **Streaming dense text overwhelms.** A participant watching a long streamed answer: "The pouring in of information kind of made me feel overwhelmed." Stream calmly: keep formatting stable while tokens arrive, avoid aggressive auto-scroll jumps, and keep long answers structurally scannable from the first tokens.
- **Truncated pyramid: answer first, detail on demand.** "Give only the essential answer first, then offer relevant followup prompts so users can pull additional detail on demand." Render the direct answer up top; put extended detail behind expandable sections or follow-up chips (progressive disclosure inside the transcript).
- **Suggested follow-up chips.** Detail belongs "behind a suggested followup prompt that interested users can click on." After an answer, offer 2–3 tappable follow-ups that fill the composer.
- **State inability in the first sentence.** When a bot can't help, "do not pad the gap"; users stopped reading after the first sentence. Failure/limitation messages: one plain sentence of what can't be done, then the alternative action — no apology paragraphs.
- **No filler or sycophancy.** Users praised answers "without any, like, 'great question!'". Strip pleasantries from assistant copy and from welcome-state copy; model short task prompts in examples.
- **Clarify sparingly, one targeted question.** "Clarification questions should be used sparingly"; a quick relevant question beats a wrong long answer. When the agent must ask, ask one specific thing (see the AskUserQuestion card pattern below).

## 11. [Nielsen Norman Group — The Most Exciting Development in GenUI: Buttons and Checkboxes](https://www.nngroup.com/articles/genui-buttons-and-checkboxes/)

NN/g (March 2026) on interactive elements inside AI chat — the blueprint for approval/clarification cards and composer context chips.

- **Structured option cards beat free-text questions.** Claude's AskUserQuestion presents "single-select multiple-choice options" with a write-in; Perplexity's numbered text questions were "error-prone" and "cognitively taxing." Waiting-for-approval/clarification states should render tappable option buttons, not a paragraph asking the user to type answers.
- **One question per card, with progress and a cap.** Claude shows "question one of four" and limits itself to four questions max, "each question on its own page." Approval/clarification flows: one decision per card, "2 of 4" label, hard cap on consecutive questions.
- **Always provide an escape hatch.** The widget includes "a 'Something else' write-in option" and "a Skip button." Every structured question card needs a free-text fallback and a skip/dismiss path.
- **Selections become chips above the composer.** In Google AI Mode, checked results "appeared as chips in a bar above the chat input — ready to reference in followup questions without retyping." Add a context-chip bar to the composer dock for selected items/files/options.
- **Fixed templates, not arbitrary generated layouts.** NN/g praises "tightly controlled guard rails around an AI-generated design" (a predesigned module the model populates). Build a small set of fixed SwiftUI card templates (approval, question, suggestion, result) the agent fills in — never free-form generated UI.
- **Checkboxes for batch selection on multi-item results.** Selectable rows let users "directly select specific options, rather than typing them out." Tool results listing multiple items (files, sessions, PRs) can offer multi-select that feeds the composer chips.

## 12. [Mobbin — AI Chat UI pattern gallery (web)](https://mobbin.com/explore/web/screens/ai-chat-ui)

Mobbin's curated gallery of AI-chat screens (ChatGPT, Claude, Gemini, Perplexity, Mistral, Grok, Airtable, Emergent, others). Evidence here is the pattern taxonomy Mobbin tags each screen with; full screenshots sit behind signup.

- **Status dot is a catalogued element in this category.** Gemini and Emergent chat screens are tagged with the "Status Dot" UI element — validating a small colored dot (not text alone) for connection/session state in the header and session rows.
- **Empty states pair with suggestions and banners.** Screens tagged "Empty State" (Emergent, Gemini, Grok, Vapi, Fireflies) co-occur with "Suggestions & Similar Items," "Chip," and "Banner" tags — the category convention for welcome screens is greeting + starter-prompt chips + optional info banner, not a blank canvas.
- **Loading indicators live inside panels/drawers.** Airtable's AI chat screens tag "Loading Indicator" + "Drawer" + "Loading" — secondary panels (tool output, details) carry their own loading states independent of the main transcript.
- **Per-message toolbar with rating.** Airtable screens tag "Rating Control" + "Toolbar" on chat detail — assistant messages carry an action toolbar (copy, rate) rather than global actions.
- **Copy/duplicate is a first-class transcript flow.** Mistral and Grok screens are tagged with "Copying & Duplicating" flows — long-press/tap copy on assistant Markdown (and code blocks) is an expected baseline.
- **Dividers as an alternative to bubbles.** Mistral and Grok screens tag "Divider" in chat detail — some shipped AI chats separate turns with whitespace/dividers and full-width text instead of bubbles; a legitimate restraint option for the assistant side of the transcript.

---

## All URLs successfully fetched

- https://openai.com/index/introducing-chatgpt-agent
- https://www.anthropic.com/news/claude-code-on-the-web
- https://claude.com/resources/articles/claude-code-desktop-redesign
- https://code.claude.com/docs/en/claude-code-on-the-web
- https://code.claude.com/docs/en/remote-control
- https://blog.google/products-and-platforms/products/gemini/gemini-3-gemini-app
- https://developer.apple.com/design/human-interface-guidelines/generative-ai
- https://developer.apple.com/design/human-interface-guidelines/loading
- https://developer.apple.com/design/human-interface-guidelines/progress-indicators
- https://www.nngroup.com/articles/less-chat-more-answer/
- https://www.nngroup.com/articles/genui-buttons-and-checkboxes/
- https://mobbin.com/explore/web/screens/ai-chat-ui

## Fetches that failed (not cited as sources)

- https://www.perplexity.ai/hub/blog/getting-started-with-perplexity — timed out on three attempts; no Perplexity first-party page could be read. (Perplexity's text-list clarification UX is instead documented secondhand in the NN/g GenUI article above.)
- https://www.perplexity.ai/hub/blog/introducing-perplexity-assistant — HTTP 404.
- https://pair.withgoogle.com/guidebook/chapter/feedback-controls — redirected to the Guidebook overview (no chapter content); https://pair.withgoogle.com/chapter/feedback-controls/ timed out twice. Google PAIR chapter-level patterns therefore not included; the official Gemini app post covers Google's shipped patterns instead.
- https://uxdesign.cc/where-should-ai-sit-in-your-ui-1710a258390e — timed out.
- https://www.anthropic.com/news/claude-code-desktop-redesign — HTTP 404 (article moved to claude.com; fetched successfully at the new URL listed above).
