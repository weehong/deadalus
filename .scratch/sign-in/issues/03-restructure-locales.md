# 03: Restructure locales to en-US and zh-CN

**What to build:** The console speaks English and Simplified Chinese. An Administrator whose
browser is set to Chinese sees Chinese; one set to any English variant sees English; and a
reader of Traditional Chinese is given English rather than being silently served the wrong
script.

The existing Spanish locale is removed and the English locale is re-coded as a regional
locale. Because the project both statically bundles its locale resources and derives its
translation-key typing from the English resource, the rename reaches the type layer as well as
the configuration.

Non-explicit locale matching is enabled so that bare and regional variants resolve to the
supported locales, with Traditional Chinese variants explicitly excluded from that matching.
The document's declared language is kept in sync with the active language, both for assistive
technology and so the correct CJK face is selected.

The existing boilerplate demo strings are not translated into Chinese; they are scheduled for
deletion and translating them would waste review attention.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] The application runs with the regional English locale as its default and fallback.
- [ ] A browser reporting Simplified Chinese resolves to the Chinese locale.
- [ ] A browser reporting a bare or regional English variant resolves to the English locale.
- [ ] A browser reporting a Traditional Chinese variant resolves to English, not Chinese.
- [ ] The document's declared language changes when the active language changes.
- [ ] The Spanish locale is gone and nothing references it.
- [ ] Translation-key typing still resolves; an unknown key is still a type error.
- [ ] Lint, type-check, unit tests and the existing end-to-end suite all pass.
