# Dependency audit follow-up

**Status:** needs-triage

Found before Projects implementation on baseline `aa20a0f`, 2026-09-11. `pnpm audit --json` exits 1 with 15 advisories (8 moderate, 5 high, 2 critical). These predate the approved feature; dependency remediation is separate work. The upload dependencies must not introduce additional advisories.

| Package | Severity | Advisory |
| --- | --- | --- |
| esbuild | moderate | [esbuild enables any website to send any requests to the development server and read the response](https://github.com/advisories/GHSA-67mh-4wv8-2f99) |
| vite | moderate | [Vite Vulnerable to Path Traversal in Optimized Deps `.map` Handling](https://github.com/advisories/GHSA-4w7w-66w2-5vf9) |
| vite | high | [Vite: `server.fs.deny` bypassed with queries](https://github.com/advisories/GHSA-v2wj-q39q-566r) |
| vite | high | [Vite Vulnerable to Arbitrary File Read via Vite Dev Server WebSocket](https://github.com/advisories/GHSA-p9ff-h696-f583) |
| uuid | moderate | [uuid: Missing buffer bounds check in v3/v5/v6 when buf is provided](https://github.com/advisories/GHSA-w5hq-g745-h8pq) |
| vite | moderate | [launch-editor: NTLMv2 hash disclosure via UNC path handling on Windows](https://github.com/advisories/GHSA-v6wh-96g9-6wx3) |
| vite | high | [vite: `server.fs.deny` bypass on Windows alternate paths](https://github.com/advisories/GHSA-fx2h-pf6j-xcff) |
| vitest | critical | [When Vitest UI server is listening, arbitrary file can be read and executed](https://github.com/advisories/GHSA-5xrq-8626-4rwp) |
| deepmerge-ts | high | [DeepmergeTS has stack exhaustion when merging recursive object graphs](https://github.com/advisories/GHSA-ggr8-5vv4-36mx) |
| vitest | moderate | [Vitest: Path Traversal / Arbitrary File Read via @vitest/mocker Redirect Mock](https://github.com/advisories/GHSA-82fw-gwwq-j7x9) |
| @vitest/mocker | moderate | [Vitest: Path Traversal / Arbitrary File Read via @vitest/mocker Redirect Mock](https://github.com/advisories/GHSA-82fw-gwwq-j7x9) |
