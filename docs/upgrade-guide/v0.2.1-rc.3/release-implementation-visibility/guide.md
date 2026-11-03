---
kind: upgrade-guide
description: "Packaged Desktop runtimes stop shipping harness documentation and source, refuse reads of the installation, and stop naming the implementation checkout."
---

# Release builds do not expose the harness implementation

English | [中文](guide.zh.md)

## Change

An installed Desktop application carried its own harness as readable files: `app.asar` held package READMEs, `src/` trees, test material, bundle patches, and unminified library JavaScript with comments. The file tools run inside Electron, whose `fs` treats an ASAR archive as a directory, so a model asked about its own configuration could quote the installed code even though shell commands see one opaque file. Release builds now close that path.

| Surface | Before | After |
|---|---|---|
| Runtime archive | Every file of the production `node_modules` tree | Package-root README/CHANGELOG, translation metadata, `src/`, and `native/tests/` omitted (`apps/desktop/scripts/runtime-file-policy.ts`) |
| Archive verification | Descriptor bytes and file inventory | Also rejects any omitted category that reaches the ASAR |
| File reads | Constrained writes only | Reads under a protected installation root fail with `FS_PROTECTED_PATH`; no escalation opens the path |
| Shell profiles | Writes confined | macOS Seatbelt denies and Linux `bwrap` masks protected roots; Landlock and the Windows ACL runner cannot deny a read |
| Model context | Web bundle named the implementation checkout | The packaged Desktop overlay sets `harness-dev-context` `sourceContext: false`; the Web GUI orientation and URL remain |

A Session created by an earlier build is unaffected until its next request: the checkout paragraph it admitted is no longer registered, so that turn's system prompt omits it. The GUI paragraphs remain.

## Migration

1. Rebuild any distributed Desktop artifact; an existing installation keeps its old archive until it is replaced. Verify with `npx @electron/asar extract <app>/Contents/Resources/app.asar /tmp/asar` that `tomato/node_modules/@tomato/*/src` and package README files are absent.
2. Deployments that build their own composition should name their installation explicitly: set `protectedReadRoots` on `@tomato/sandbox-policy` to the physical runtime root. The Desktop application passes it as `TOMATO_PROTECTED_READ_ROOTS`; an unset value keeps the previous behavior.
3. Keep `harness-dev-context.sourceContext` at its default `true` only where the implementation tree is meant to be inspectable. A release sets it `false`; disabling the whole row also removes the GUI orientation.
4. On Linux and Windows, shell commands can still read the archive bytes because those profile languages lack a read denial. Do not treat the sandbox as the boundary there; the shipped archive itself no longer carries documentation or source.

Verify with a packaged build: asking `tomato web` about its own configuration returns no quoted installed file, a `read` call under the application archive fails with `FS_PROTECTED_PATH`, `strings app.asar` under a macOS sandboxed command fails, and the runtime context carries no `Current Tomato Harness implementation checkout` line.