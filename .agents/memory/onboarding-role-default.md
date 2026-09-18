---
name: Neutral onboarding role choice
description: New family-board accounts use a legacy parent storage default, so no-family state must remain an explicit onboarding choice.
---

Treat an authenticated account with no family as unconfigured, not as a confirmed parent. The stored parent default exists for compatibility, while onboarding must explicitly choose family creation or child-profile linking; the join transaction is the recovery path for parent-default accounts.

**Why:** Inferring onboarding from the legacy role default caused child signups to be routed into parent setup and made existing accounts appear incorrectly classified.

**How to apply:** Any future web or mobile setup UI should show both paths before a family exists, and any server-side join flow must be able to reclassify a no-family parent-default account as a child only after validating the family code and unclaimed child profile.