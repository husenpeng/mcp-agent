# Agent Note: Folder-style pickers for robot resources

Status: implemented

English | [中文](2026-11-06-robot-resource-pickers.zh.md)

## Problem

The advanced specification editor offered skills, MCP servers, and Workspace roots through the same inline menu. A skill row named the skill but hid the folder it came from, an MCP row named a server with no indication that the deployment owned it, and a Workspace root was a path stored as a chip with a free-entry box. The three fields were also treated alike even though they are not: a Workspace root is a filesystem path, a skill is a name backed by a source folder, and an MCP server is a deployment-configured name with no folder in the robot specification.

## Decision

Only a Workspace root is a true path. A skill option now carries its source folder in the optional `RobotCapabilityOption.path` (the directory of the skill's instruction file), a Workspace option repeats its directory there, and an MCP server omits the field because its configuration, including a stdio server's `cwd`, lives in the deployment.

Skills, MCP servers, and Workspace roots open a modal `ResourcePicker` instead of a menu. Skill rows show their source folder; MCP rows name the configured servers and state that the deployment owns the working directory; Workspace rows show their absolute path. Other list fields keep the inline menu. Free entry remains on every field.

The Workspace picker adds **Browse folders…**, which opens a `FolderPicker` over `uiWorkspace.listDirectory`. That service uses the browse backend's listing primitive; when the deployment serves the native directory-picker capability instead, the listing rejection is the signal to call `uiWorkspace.pickDirectory()` and use the OS chooser. Superseded scans abort through an `AbortController`, and one open edge starts one scan so a StrictMode setup cannot open a second chooser.

## Alternatives considered

**Give all three fields a filesystem browser.** Skills and MCP servers are stored as names, not paths. A chosen folder cannot be written into the specification, and an MCP server has no folder to choose; changing that would require new specification fields and runtime semantics, not a picker.

**Reuse the workspace directory-flow slots.** The browse and native picker packages fill two holes owned by the workspace browser and hero picker. They expose no factory or service for another feature, so reusing them from the robot editor would require a new cross-package slot contract. Calling the existing `uiWorkspace` directory methods keeps one owner and no new slot.

**Always open the OS chooser.** `uiWorkspace.pickDirectory()` is the native backend's verb; remote and in-process deployments serve the browse capability and would have no picker. Trying the listing first also selects the right surface without a client-side capability probe.

## Consequences

- `RobotCapabilityOption.path` is an additive wire field. Existing readers ignore it; the Host omits it for values that exist only as names.
- MCP working directories remain deployment configuration. The picker states that rather than implying a per-robot directory.
- The folder picker lists, navigates, and reveals hidden folders; creating a folder remains the workspace browser's job and is deferred here.
- Tests cover the resource picker, the folder picker's browse and native paths, superseded settlements, the editor wiring, and the extended capability projection; the package READMEs and the robot subsystem page describe the modal pickers.