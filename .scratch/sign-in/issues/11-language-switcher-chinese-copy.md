# 11: Language switcher and Chinese sign-in copy

**What to build:** An Administrator on a shared or misconfigured machine can put the sign-in
screen into their own language, and a Chinese-reading Administrator can sign in in Chinese.

The sign-in screen is the one place where a wrong-language visitor is genuinely stuck: they
cannot reach any account setting until they are through it, and no server-side preference can
apply before they are known. So a discreet switcher sits at the foot of the form column,
offering English and Simplified Chinese, and the choice persists where the language detector
reads it first — so it survives to the next visit.

The sign-in copy is authored in Simplified Chinese: labels, placeholders, headings, button
text, validation messages, error messages and the access-request line. The translation is
machine-produced and must be **flagged for review** in the locale file rather than presented as
finished. The boilerplate demo strings are deliberately left in English; they are scheduled for
deletion.

**Blocked by:** 03, 08

**Status:** ready-for-agent

- [ ] The sign-in screen shows a language control offering English and Simplified Chinese.
- [ ] Selecting Chinese re-renders the whole screen in Chinese without a page reload.
- [ ] The choice persists across a reload and a new visit.
- [ ] The document's declared language changes with the selection.
- [ ] Every string on the sign-in screen has a Chinese translation, including validation and
      error messages — no raw keys and no English fallthrough.
- [ ] The Chinese translations are marked as needing review in the locale file.
- [ ] The boilerplate demo strings remain untranslated.
- [ ] Chinese text renders in a system CJK face and the layout does not break under it.
- [ ] The switcher is keyboard-operable with a visible focus indicator, and has a story and
      tests.
- [ ] Lint, type-check, unit tests and the existing end-to-end suite all pass.
