Tell the agent something once, such as "write every creator email in a short, direct tone", and later sessions in the same workspace follow it. During a long goal, the agent also sees which calls already failed, so it changes approach instead of repeating them.

## How to use

- State a lasting preference, constraint, decision, or fact, and ask the agent to remember it. The agent saves it with the exact words you used.
- Ask about something you said in an earlier session. The agent searches saved memories before asking you again.
- Type `/memory` to list the memories of this workspace. Use `/memory confirm <id>`, `/memory pin <id>`, `/memory unpin <id>`, and `/memory forget <id>` to manage them.
- Start a long task with `/goal <objective>`. When a call keeps failing the same way, the agent is reminded to change the arguments, ask you, or report the blocker.

## Good to know

- Memories belong to the project directory of the session. Sessions in another directory do not see them.
- A memory becomes active only when the agent quotes your words from the same turn. Otherwise it stays unconfirmed until you run `/memory confirm <id>`.
- Pinned memories reach every new session in the workspace without a search. Keep the pinned list short, because it adds tokens to the first request of each turn when it changes.
- Delegated agents can search memories but cannot change them.
- Memories are stored on this computer under the TOMATO home. Deleting a memory removes it from storage; earlier session logs keep the text they already showed the agent.
- Do not ask the agent to remember passwords, keys, or contact details.
- The plugin never retries a call by itself, and it never starts a goal round. The goal's round limit still applies.
