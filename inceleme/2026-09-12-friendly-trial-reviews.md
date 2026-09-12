# Friendly trial reviews and optional ratings

- Added a keyboard-accessible 1–10 overall-experience rating, with no preselected score and a clear-rating action.
- Kept task completion separate: It worked / It didn’t work / Not sure yet. A high rating does not change the outcome or bypass checklist requirements.
- Added clearer notes guidance, character feedback, saved-state confirmation and specific reasons when saving is unavailable.
- Split device-local saving from optional wallet publication. Public network fields, permanent recording, test-network fees, and private file contents are explained before publication. Hashes are in expandable technical details.
- Ratings survive local save/restore, appear in shortlist/export and verified evidence, and are included in the evidence hash. Existing unscored receipts retain their original hashes. Ratings are not standalone readable onchain fields and are not part of the AI history totals.
- 41 Node tests passed, including rating boundaries, old receipt compatibility and tampered-score rejection. ESLint, TypeScript and production build passed.
- Browser checked score selection, clear rating, note counter, independent result selection, optional sharing disclosure and unavailable-provider save guard. No review was published and no wallet transaction was requested during testing.
