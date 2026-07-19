# PR #2328 Provider Backport Design

## Goal

Backport Qoder CN and Zed Hosted Models from upstream PR #2328 into the local 9Router 0.5.35 checkout without replacing newer provider, OAuth, routing, or model-discovery behavior already present on `master`.

## Scope

The backport includes:

- Qoder CN registry metadata, gateway routing, model discovery, usage dispatch, icon, and focused tests.
- Zed registry metadata, OAuth authentication, token exchange and caching, model discovery, request execution, UI connection flow, icon, and focused tests.
- Current-format provider and alias baseline updates.

The backport excludes:

- Unrelated upstream refactors or snapshot rewrites.
- Changes to the running local review instance until the isolated branch builds and passes its acceptance gates.
- Changes to the deployed Dokploy instance.

## Approach

The seven upstream commits will be treated as reference patches rather than cherry-picked as a single merge. Qoder CN will be integrated first because it has the smaller surface area and can be verified independently. Zed will follow as a separate integration, adapted to the current provider registry, dynamic OAuth route, server OAuth utilities, provider detail UI, and model APIs.

New provider modules and assets can be copied substantially from the PR. Shared files must be merged semantically so current 0.5.35 behavior remains the source of truth. Generated provider baselines will be regenerated from the resulting registry instead of accepting the PR's older baseline wholesale.

## Components

### Qoder CN

- Add `qoder-cn` to the registry with a distinct provider identity and display metadata.
- Extend Qoder constants and executor routing so CN algorithm endpoints use the required gateway.
- Add model and usage dispatch support without changing the existing global Qoder provider.
- Add the provider icon and focused regression coverage.

### Zed Hosted Models

- Add the Zed provider registry and executor.
- Add GitHub-based OAuth/device authorization and Zed token exchange/cache helpers.
- Route Zed authorization through the current generic OAuth API and callback page.
- Add dynamic model discovery and provider tests through current API helpers.
- Expose the provider in the current dashboard connection flow and quota UI.

## Conflict Resolution Rules

1. Preserve current `master` behavior in shared files unless PR #2328 adds a provider-specific branch.
2. Prefer registry-driven integration over hard-coded provider lists when current code supports it.
3. Keep Qoder CN and Zed logic isolated in provider-specific modules where possible.
4. Do not overwrite current version headers, unrelated endpoint corrections, or current provider baselines with older PR data.
5. Resolve tests by asserting provider behavior, not by blindly accepting broad snapshot changes.

## Verification

Each provider is implemented test-first. A focused test must fail before its production integration is added, then pass after the minimal change.

Acceptance gates:

- Qoder and Zed registry entries resolve with expected aliases and auth modes.
- Qoder CN routes algorithm traffic through its gateway and retains ordinary Qoder behavior.
- Zed OAuth configuration, token exchange helpers, executor URL/header behavior, and model parsing pass focused tests.
- Provider and alias baseline generators succeed.
- Existing Qoder and usage-dispatch tests remain green.
- `npm run build` succeeds.
- `npm run cli:pack` succeeds.
- `git diff --check` reports no whitespace errors.

The existing golden translator suite has five documented baseline mismatches before this work. They are not acceptance failures unless the backport introduces additional mismatches or changes those unrelated snapshots.

## Rollout

The completed branch remains isolated until all gates pass. After verification, the branch can be merged into the main local checkout and the local review process restarted on port 20128. Server deployment remains a separate explicit action.
