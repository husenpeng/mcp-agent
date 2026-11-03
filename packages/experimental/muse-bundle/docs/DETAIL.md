Tell the agent something once, such as "write every creator email in a short, direct tone", and later sessions in the same workspace follow it. Tell it something about yourself, such as your role or the language you work in, and every later session knows it, in any workspace. During a long goal, the agent also sees which calls already failed, so it changes approach instead of repeating them. Separately, TOMATO summarizes the day's work and reminds you when tasks are still unfinished.

## How to use

- State a lasting preference, constraint, decision, or fact, and ask the agent to remember it. The agent saves it with the exact words you used: things about you go to your profile, and things about this project stay in the workspace.
- Ask about something you said in an earlier session, even in other words. The agent searches saved memories, including related wordings, before asking you again.
- Type `/memory` to list your profile and the memories of this workspace, or `/memory profile` for your profile alone. Use `/memory confirm <id>`, `/memory pin <id>`, `/memory unpin <id>`, and `/memory forget <id>` to manage them.
- Start a long task with `/goal <objective>`. When a call keeps failing the same way, the agent is reminded to change the arguments, ask you, or report the blocker.
- When today's recap is ready, a notice shows its headline or work-item count. Click it to open the **Daily recap** page in the right sidebar, where work items, open tasks, and contributing sessions are listed.
- When unfinished tasks remain, a notice names the first task. Click it to open the **Unfinished tasks** view; the Host rechecks periodically and shows at most one reminder per cooldown while tasks remain.

## Good to know

- When you are signed in, memories belong to your account; when you sign out, the agent can neither use nor save them until you sign in again. Without sign-in, they belong to this computer.
- Profile memories reach every new session. Workspace memories belong to the project directory of the session; sessions in another directory do not see them.
- A memory becomes active only when the agent quotes your words from the same turn. Otherwise it stays unconfirmed until you run `/memory confirm <id>`.
- Profile memories and pinned workspace memories reach new sessions without a search. Keep both short, because they add tokens to the first request of each turn when they change.
- A search that finds too few memories may send one short extra request to the model to find other wordings of your question.
- Delegated agents can search memories but cannot change them.
- Memories are stored on this computer under the TOMATO home. Deleting a memory removes it from storage; earlier session logs keep the text they already showed the agent.
- Do not ask the agent to remember passwords, keys, or contact details.
- The plugin never retries a call by itself, and it never starts a goal round. The goal's round limit still applies.
- Recaps and task analysis stay on this computer and under the signed-in account. They read only Sessions created in the last 7 days, use message text rather than tool output, and may miss work visible only in files or tool results.
- An accepted recap sends one auxiliary model request containing the day's message text. Without a usable model route, the recap lists the day's sessions without a narrative. The recap is not a memory record, so `/memory` does not list it.
- Notice dismissal and cooldowns are browser-local. Closing a notice does not delete the recap; the right-sidebar page keeps the latest one.
