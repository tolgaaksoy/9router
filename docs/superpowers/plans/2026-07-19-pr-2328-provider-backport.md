# PR #2328 Provider Backport Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Backport Qoder CN and Zed Hosted Models from upstream PR #2328 into the current local 9Router 0.5.35 branch while preserving newer master behavior.

**Architecture:** Integrate the PR in two independently testable slices. Qoder CN extends the existing Qoder implementation with CN-specific registry and gateway behavior; Zed adds isolated auth, executor, registry, and model-discovery modules that connect through the current generic OAuth and provider APIs. Shared files are resolved against current master, and generated baselines are rebuilt from the final registry.

**Tech Stack:** Next.js 16, JavaScript ES modules, Vitest, provider registry modules, OAuth/device flows, OpenAI-compatible SSE translation.

---

## File and Commit Map

- Qoder CN reference commits: `663c8edf`, `24e7d191`, `fc31f9c`.
- Zed reference commits: `7582d5c4`, `67b45c6e`, `36c3fcfc`, `e4385435`.
- New provider modules: `open-sse/providers/registry/qoder-cn.js`, `open-sse/providers/registry/zed.js`.
- New runtime modules: `open-sse/executors/zed.js`, `open-sse/shared/zedAuth.js`.
- Shared integration points: provider registry, executor registry, generic OAuth route, OAuth providers/services, provider model API, provider detail UI, callback page, usage dispatch, and provider baselines.
- New focused tests: `tests/unit/pr2328-registry.test.js`, `tests/unit/zed.test.js`.

### Task 1: Establish Failing Provider-Registry Tests

**Files:**
- Create: `tests/unit/pr2328-registry.test.js`

- [ ] **Step 1: Add a registry test that requires both new providers**

```js
import { describe, expect, it } from "vitest";
import REGISTRY from "../../open-sse/providers/registry/index.js";
import { hasSpecializedExecutor } from "../../open-sse/executors/index.js";

const byId = Object.fromEntries(REGISTRY.map((provider) => [provider.id, provider]));

describe("PR #2328 provider registration", () => {
  it("registers Qoder CN as a separate regional provider", () => {
    expect(byId["qoder-cn"]).toMatchObject({
      id: "qoder-cn",
      alias: "qdc",
      category: "free",
    });
    expect(byId["qoder-cn"].alias).not.toBe(byId.qoder.alias);
  });

  it("registers Zed with an executor and OAuth support", () => {
    expect(byId.zed).toMatchObject({
      id: "zed",
      category: "oauth",
      authType: "oauth",
    });
    expect(byId.zed.authModes).toContain("oauth");
    expect(hasSpecializedExecutor("zed")).toBe(true);
  });
});
```

- [ ] **Step 2: Run the test and verify RED**

Run:

```bash
rtk npx vitest run tests/unit/pr2328-registry.test.js
```

Expected: FAIL because `qoder-cn`, `zed`, and the Zed executor are not registered.

- [ ] **Step 3: Commit the failing test**

```bash
rtk git add tests/unit/pr2328-registry.test.js
rtk git commit -m "test: define PR 2328 provider registry contract"
```

### Task 2: Backport Qoder CN

**Files:**
- Create: `open-sse/providers/registry/qoder-cn.js`
- Create: `public/providers/qoder-cn.png`
- Modify: `open-sse/executors/index.js`
- Modify: `open-sse/executors/qoder.js`
- Modify: `open-sse/providers/registry/index.js`
- Modify: `open-sse/services/qoderModels.js`
- Modify: `open-sse/services/usage.js`
- Modify: `open-sse/services/usage/misc.js`
- Modify: `open-sse/shared/qoder/constants.js`
- Modify: `src/app/(dashboard)/dashboard/providers/[id]/page.js`
- Modify: `src/app/(dashboard)/dashboard/usage/components/ProviderLimits/ProviderLimitCard.js`
- Modify: `src/app/(dashboard)/dashboard/usage/components/ProviderLimits/utils.js`
- Modify: `src/app/api/oauth/[provider]/[action]/route.js`
- Modify: `src/app/api/providers/[id]/models/route.js`
- Modify: `src/app/api/providers/[id]/test/testUtils.js`
- Modify: `src/app/api/v1/models/route.js`
- Modify: `src/lib/oauth/constants/oauth.js`
- Modify: `src/lib/oauth/providers.js`
- Modify: `src/lib/oauth/services/qoder.js`
- Modify: `src/shared/components/OAuthModal.js`
- Modify: `tests/unit/qoder.test.js`
- Modify: `tests/unit/usage-dispatch.test.js`

- [ ] **Step 1: Apply the three Qoder CN reference commits without committing**

```bash
rtk git cherry-pick -n 663c8edf0ee71a95de3a07a57db458fc480f9913
rtk git cherry-pick -n 24e7d1912523fe9d697f397ac4975667a9143b77
rtk git cherry-pick -n fc31f9c328bb8d6a81af7af2ce349478b0204ff7
```

Expected: shared-file conflicts on the first commit. Resolve them by keeping current master structure and adding only `qoder-cn` branches, constants, registry entries, model handling, usage dispatch, and UI labels from the reference commits.

- [ ] **Step 2: Resolve the static provider registry against the current generated layout**

Preserve the current generated import order and add the `qoder-cn` import and array entry exactly once. Verify the final registry contains all current providers plus Qoder CN.

```bash
rtk rg -n 'qoder-cn' open-sse/providers/registry/index.js
rtk node -e 'import("./open-sse/providers/registry/index.js").then(({default:r})=>{if(r.filter(p=>p.id==="qoder-cn").length!==1)process.exit(1);console.log(r.length)})'
```

Expected: one import and one array entry for `qoder-cn`; no existing provider removed.

- [ ] **Step 3: Run Qoder-focused tests and verify GREEN for Qoder CN**

```bash
rtk npx vitest run tests/unit/qoder.test.js tests/unit/usage-dispatch.test.js tests/unit/pr2328-registry.test.js
```

Expected: Qoder tests pass; registry test may still fail only for the not-yet-added Zed assertions.

- [ ] **Step 4: Commit Qoder CN**

```bash
rtk git add open-sse src public/providers/qoder-cn.png tests/unit/qoder.test.js tests/unit/usage-dispatch.test.js
rtk git commit -m "feat: backport Qoder CN provider"
```

### Task 3: Establish Failing Zed Runtime Tests

**Files:**
- Create: `tests/unit/zed.test.js`

- [ ] **Step 1: Add focused Zed URL, header, and model tests**

```js
import { describe, expect, it } from "vitest";
import ZedExecutor from "../../open-sse/executors/zed.js";
import { parseZedModels } from "../../open-sse/shared/zedAuth.js";

describe("Zed provider", () => {
  it("builds the hosted-model chat endpoint", () => {
    const executor = new ZedExecutor({ accessToken: "token" });
    expect(executor.buildUrl("claude-sonnet", true)).toMatch(/^https:\/\//);
    expect(executor.buildUrl("claude-sonnet", true)).toContain("chat");
  });

  it("uses bearer authentication", () => {
    const executor = new ZedExecutor({ accessToken: "token" });
    expect(executor.buildHeaders()).toMatchObject({
      Authorization: "Bearer token",
      "Content-Type": "application/json",
    });
  });

  it("normalizes dynamic model responses", () => {
    expect(parseZedModels({ models: [{ id: "model-a", name: "Model A" }] })).toEqual([
      expect.objectContaining({ id: "model-a" }),
    ]);
  });
});
```

- [ ] **Step 2: Run the test and verify RED**

```bash
rtk npx vitest run tests/unit/zed.test.js
```

Expected: FAIL because the Zed executor and auth helpers do not exist.

- [ ] **Step 3: Commit the failing test**

```bash
rtk git add tests/unit/zed.test.js
rtk git commit -m "test: define Zed provider runtime contract"
```

### Task 4: Backport Zed Hosted Models

**Files:**
- Create: `open-sse/executors/zed.js`
- Create: `open-sse/providers/registry/zed.js`
- Create: `open-sse/shared/zedAuth.js`
- Create: `public/providers/zed.png`
- Modify: `open-sse/executors/index.js`
- Modify: `open-sse/providers/registry/index.js`
- Modify: `src/app/(dashboard)/dashboard/providers/[id]/page.js`
- Modify: `src/app/api/oauth/[provider]/[action]/route.js`
- Modify: `src/app/api/providers/[id]/models/route.js`
- Modify: `src/app/api/providers/[id]/test/testUtils.js`
- Modify: `src/app/callback/page.js`
- Modify: `src/lib/oauth/constants/oauth.js`
- Modify: `src/lib/oauth/providers.js`
- Modify: `src/lib/oauth/utils/server.js`
- Modify: `src/shared/components/OAuthModal.js`

- [ ] **Step 1: Apply the four Zed reference commits without committing**

```bash
rtk git cherry-pick -n 7582d5c4d15242f853ab2d60357cd7e4485a8776
rtk git cherry-pick -n 67b45c6edf8b8f1bb8c2aa8bb2b787bddbc73654
rtk git cherry-pick -n 36c3fcfcfe1fce60a9412cb0e6a9ae9e8779d4e3
rtk git cherry-pick -n e438543526b06f7f94227870f90a5668ca89ed6c
```

Expected: conflicts in shared registry, OAuth, model API, UI, and test-helper files. Keep current generic OAuth abstractions and add Zed-specific cases and imports only.

- [ ] **Step 2: Adapt Zed modules to the current executor and OAuth interfaces**

Required contracts:

- `open-sse/executors/index.js` exports `zed` without removing existing executors.
- `open-sse/providers/registry/zed.js` declares OAuth capability, dynamic models, and the Zed executor.
- `src/app/api/oauth/[provider]/[action]/route.js` delegates Zed authorization and exchange through the current response format.
- `src/app/api/providers/[id]/models/route.js` returns normalized Zed models through the current model response wrapper.
- `src/lib/oauth/utils/server.js` caches Zed token exchange results without weakening callback validation.
- `src/shared/components/OAuthModal.js` presents the Zed GitHub sign-in guidance while preserving other providers.

- [ ] **Step 3: Resolve the provider registry and regenerate current-format baselines**

```bash
rtk node -e 'import("./open-sse/providers/registry/index.js").then(({default:r})=>{for(const id of ["qoder-cn","zed"]){if(r.filter(p=>p.id===id).length!==1)process.exit(1)}console.log(r.length)})'
rtk node tests/__baseline__/verify-alias.mjs --snapshot
rtk node tests/__baseline__/snapshot-providers.mjs
rtk node tests/__baseline__/verify-alias.mjs
rtk node tests/__baseline__/verify-providers.mjs
```

Expected: `qoder-cn` and `zed` are present exactly once; unrelated provider identities remain unchanged.

- [ ] **Step 4: Run focused tests and verify GREEN**

```bash
rtk npx vitest run tests/unit/pr2328-registry.test.js tests/unit/zed.test.js tests/unit/qoder.test.js tests/unit/usage-dispatch.test.js
```

Expected: all focused tests pass.

- [ ] **Step 5: Commit Zed support**

```bash
rtk git add open-sse src public/providers/zed.png tests
rtk git commit -m "feat: backport Zed hosted models provider"
```

### Task 5: Full Verification and Local Review Handoff

**Files:**
- Verify all changed files.
- Do not modify the deployed Dokploy compose.

- [ ] **Step 1: Run syntax, focused tests, CLI packaging, and production build**

```bash
rtk node --check open-sse/executors/zed.js
rtk node --check open-sse/providers/registry/zed.js
rtk node --check open-sse/shared/zedAuth.js
rtk npx vitest run tests/unit/pr2328-registry.test.js tests/unit/zed.test.js tests/unit/qoder.test.js tests/unit/usage-dispatch.test.js
rtk node tests/__baseline__/verify-alias.mjs
rtk npm run cli:pack
rtk npm run build
rtk git diff --check HEAD~2..HEAD
```

Expected: all commands exit zero. The known unrelated golden snapshot mismatches are not rewritten.

- [ ] **Step 2: Review the final change set**

```bash
rtk git status --short
rtk git diff --stat master...HEAD
rtk git log --oneline master..HEAD
```

Expected: clean worktree and intentional commits for design, plan, failing contracts, Qoder CN, and Zed.

- [ ] **Step 3: Merge into the local checkout only after verification**

Stop the local review process on port 20128, fast-forward or merge `feature/pr-2328-backport` into the local checkout's `master`, rebuild, and restart the local standalone server on `127.0.0.1:20128`.

- [ ] **Step 4: Verify the local review instance**

```bash
rtk curl -sS -o /dev/null -w '%{http_code}\n' http://127.0.0.1:20128/api/health
rtk curl -sS -o /dev/null -w '%{http_code}\n' http://127.0.0.1:20128/dashboard/providers
```

Expected: both return `200`, and the provider dashboard exposes Qoder CN and Zed.
