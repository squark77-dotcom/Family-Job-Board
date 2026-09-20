---
name: Expo native notifications
description: Native push notification dependency and build requirements for the mobile artifact.
---

The mobile app uses Expo push notifications through the native `expo-notifications` module. Adding or changing this module requires a fresh EAS/TestFlight build; Expo Go or an older installed binary will not contain the native module.

**Why:** Push registration runs only on a physical native build with notification permissions and an EAS project ID; a JavaScript bundle update alone cannot add the native capability.

**How to apply:** Keep the app config plugin and package version aligned, set the EAS project ID in the build environment, and prompt only signed-in child accounts before registering their Expo token.