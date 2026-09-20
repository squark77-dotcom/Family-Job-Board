import assert from "node:assert/strict";
import test from "node:test";
import {
  canClaimChildProfile,
  prepareChildJoin,
} from "../../artifacts/api-server/src/routes/family-job-board-join";
import { SETUP_CHOICES } from "../../artifacts/family-job-board/src/pages/setup-options";
import { SETUP_CHOICES as MOBILE_SETUP_CHOICES } from "../../artifacts/family-job-board-mobile/app/setup-options";

test("an unconfigured account is offered both onboarding paths", () => {
  assert.deepEqual(
    SETUP_CHOICES.map(({ mode }) => mode),
    ["create", "join"],
  );
  assert.equal(SETUP_CHOICES[0].title, "Create Family");
  assert.equal(SETUP_CHOICES[1].title, "I’m joining as a child");
  assert.deepEqual(
    MOBILE_SETUP_CHOICES.map(({ mode }) => mode),
    ["create", "join"],
  );
  assert.equal(MOBILE_SETUP_CHOICES[1].label, "Join as a child");
});

test("a parent-default account can join an unclaimed profile as a child", () => {
  const familyId = "family-1";
  const user = {
    id: "account-1",
    familyId: null,
    role: "parent",
    name: "Family member",
    avatar: null,
  };
  const child = {
    id: "child-1",
    familyId,
    name: "Alex",
    avatar: null,
    userId: null,
  };

  assert.deepEqual(prepareChildJoin(user, child, familyId), {
    user: {
      familyId,
      role: "child",
      name: "Alex",
      avatar: null,
    },
    child: {
      ...child,
      userId: user.id,
    },
  });
});

test("an already-linked child profile cannot be claimed twice", () => {
  assert.equal(
    canClaimChildProfile({
      accountFamilyId: null,
      childFamilyId: "family-1",
      requestedFamilyId: "family-1",
      childUserId: "another-user",
    }),
    false,
  );
});