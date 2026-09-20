export type JoinEligibility = {
  accountFamilyId: string | null;
  childFamilyId: string;
  requestedFamilyId: string;
  childUserId: string | null;
};

/**
 * A family join is the explicit opt-in that turns a legacy parent-default
 * account into a child account. The child profile must still be unclaimed and
 * must belong to the family identified by the join code.
 */
export function canClaimChildProfile({
  accountFamilyId,
  childFamilyId,
  requestedFamilyId,
  childUserId,
}: JoinEligibility): boolean {
  return (
    accountFamilyId === null &&
    childFamilyId === requestedFamilyId &&
    childUserId === null
  );
}

export type JoinUser = {
  id: string;
  familyId: string | null;
  role: string;
  name: string;
  avatar: string | null;
};

export type JoinChild = {
  id: string;
  familyId: string;
  userId: string | null;
  name: string;
  avatar: string | null;
};

export function prepareChildJoin(
  user: JoinUser,
  child: JoinChild,
  familyId: string,
) {
  if (
    !canClaimChildProfile({
      accountFamilyId: user.familyId,
      childFamilyId: child.familyId,
      requestedFamilyId: familyId,
      childUserId: child.userId,
    })
  ) {
    return null;
  }

  return {
    user: {
      familyId,
      role: "child" as const,
      name: child.name,
      avatar: child.avatar,
    },
    child: {
      ...child,
      userId: user.id,
    },
  };
}