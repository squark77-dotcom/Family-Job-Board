import { randomBytes } from "node:crypto";
import { getAuth } from "@clerk/express";
import {
  AwardBonusBody,
  AwardBonusResponse,
  ClaimJobParams,
  ClaimJobResponse,
  CompleteJobParams,
  CompleteJobResponse,
  CreateChildBody,
  CreateChildResponse,
  CreateFamilyBody,
  CreateFamilyResponse,
  CreateJobBody,
  CreateJobResponse,
  DeleteJobParams,
  GetCurrentUserResponse,
  GetDashboardResponse,
  GetPointsQueryParams,
  GetPointsResponse,
  JoinFamilyBody,
  JoinFamilyResponse,
  ListChildrenResponse,
  ListJobsQueryParams,
  ListJobsResponse,
  ListReviewsResponse,
  ReviewJobBody,
  ReviewJobParams,
  ReviewJobResponse,
  StartJobParams,
  StartJobResponse,
  SubmitJobParams,
  SubmitJobResponse,
  UpdateChildBody,
  UpdateChildParams,
  UpdateChildResponse,
  UpdateFamilyBody,
  UpdateFamilyResponse,
  UpdateJobBody,
  UpdateJobParams,
  UpdateJobResponse,
} from "@workspace/api-zod";
import {
  childrenTable,
  db,
  familiesTable,
  jobEventsTable,
  jobsTable,
  pointsTransactionsTable,
  submissionsTable,
  usersTable,
  type ChildRecord,
  type JobRecord,
  type UserRecord,
} from "@workspace/db";
import { and, desc, eq, isNull } from "drizzle-orm";
import { Router, type IRouter, type Request } from "express";

const router: IRouter = Router();

type Context = {
  user: UserRecord;
  child: ChildRecord | null;
};

async function getContext(req: Request): Promise<Context | null> {
  const auth = getAuth(req);
  const claimedUserId = auth?.sessionClaims?.userId;
  const clerkUserId =
    typeof claimedUserId === "string" ? claimedUserId : auth?.userId;
  if (typeof clerkUserId !== "string" || !clerkUserId) return null;

  let [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.clerkUserId, clerkUserId))
    .limit(1);

  if (!user) {
    [user] = await db
      .insert(usersTable)
      .values({ clerkUserId, name: "Family member", role: "parent" })
      .returning();
  }

  const [child] =
    user.role === "child"
      ? await db
          .select()
          .from(childrenTable)
          .where(eq(childrenTable.userId, user.id))
          .limit(1)
      : [];

  return { user, child: child ?? null };
}

function requireFamily(context: Context | null): context is Context & {
  user: UserRecord & { familyId: string };
} {
  return Boolean(context?.user.familyId);
}

function iso(value: Date | null): string | null {
  return value ? value.toISOString() : null;
}

async function childSummaries(familyId: string) {
  const [children, jobs, points] = await Promise.all([
    db.select().from(childrenTable).where(eq(childrenTable.familyId, familyId)),
    db.select().from(jobsTable).where(eq(jobsTable.familyId, familyId)),
    db
      .select()
      .from(pointsTransactionsTable)
      .where(eq(pointsTransactionsTable.familyId, familyId)),
  ]);

  return children.map((child) => {
    const childPoints = points.filter((point) => point.childId === child.id);
    const completed = jobs.filter(
      (job) =>
        job.status === "completed" &&
        (job.assignedChildId === child.id || job.claimedByChildId === child.id),
    );
    return {
      id: child.id,
      name: child.name,
      avatar: child.avatar,
      active: child.active,
      linked: Boolean(child.userId),
      totalPoints: childPoints.reduce((sum, point) => sum + point.points, 0),
      assignedCompleted: completed.filter((job) => job.type === "assigned").length,
      voluntaryCompleted: completed.filter((job) => job.type === "board").length,
      bonusPoints: childPoints
        .filter((point) => point.type === "initiative_bonus")
        .reduce((sum, point) => sum + point.points, 0),
    };
  });
}

async function familyResponse(familyId: string) {
  const [family] = await db
    .select()
    .from(familiesTable)
    .where(eq(familiesTable.id, familyId))
    .limit(1);
  if (!family) return null;
  return {
    id: family.id,
    name: family.name,
    parentId: family.parentUserId,
    joinCode: family.joinCode,
    createdAt: family.createdAt.toISOString(),
    children: await childSummaries(family.id),
  };
}

async function mapJobs(rows: JobRecord[]) {
  const childIds = new Set(
    rows.flatMap((job) =>
      [job.assignedChildId, job.claimedByChildId].filter(
        (id): id is string => Boolean(id),
      ),
    ),
  );
  const children = childIds.size
    ? await db.select().from(childrenTable)
    : [];
  const names = new Map(children.map((child) => [child.id, child.name]));
  return rows.map((job) => ({
    id: job.id,
    familyId: job.familyId,
    title: job.title,
    description: job.description,
    points: job.points,
    type: job.type,
    assignedChildId: job.assignedChildId,
    assignedChildName: job.assignedChildId
      ? names.get(job.assignedChildId) ?? null
      : null,
    claimedByChildId: job.claimedByChildId,
    claimedByChildName: job.claimedByChildId
      ? names.get(job.claimedByChildId) ?? null
      : null,
    status: job.status,
    dueDate: iso(job.dueDate),
    estimatedMinutes: job.estimatedMinutes,
    createdAt: job.createdAt.toISOString(),
    updatedAt: job.updatedAt.toISOString(),
    completedAt: iso(job.completedAt),
  }));
}

async function mapJob(job: JobRecord) {
  return (await mapJobs([job]))[0];
}

router.get("/me", async (req, res): Promise<void> => {
  const context = await getContext(req);
  if (!context) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  const family = context.user.familyId
    ? await familyResponse(context.user.familyId)
    : undefined;
  res.json(
    GetCurrentUserResponse.parse({
      user: {
        id: context.user.id,
        name: context.child?.name ?? context.user.name,
        role: context.user.role,
        familyId: context.user.familyId,
        avatar: context.child?.avatar ?? context.user.avatar,
        active: context.child?.active ?? context.user.active,
      },
      ...(family ? { family } : {}),
    }),
  );
});

router.post("/family", async (req, res): Promise<void> => {
  const context = await getContext(req);
  if (!context) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  if (context.user.familyId) {
    res.status(409).json({ error: "This account already belongs to a family" });
    return;
  }
  const body = CreateFamilyBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  const family = await db.transaction(async (tx) => {
    const [created] = await tx
      .insert(familiesTable)
      .values({
        name: body.data.name,
        parentUserId: context.user.id,
        joinCode: randomBytes(4).toString("hex").toUpperCase(),
      })
      .returning();
    await tx.insert(childrenTable).values(
      body.data.children.map((child) => ({
        familyId: created.id,
        name: child.name,
        avatar: child.avatar ?? null,
      })),
    );
    await tx
      .update(usersTable)
      .set({
        familyId: created.id,
        role: "parent",
        name: body.data.name,
      })
      .where(eq(usersTable.id, context.user.id));
    return created;
  });
  res.status(201).json(CreateFamilyResponse.parse(await familyResponse(family.id)));
});

router.patch("/family", async (req, res): Promise<void> => {
  const context = await getContext(req);
  if (!requireFamily(context)) {
    res.status(context ? 403 : 401).json({ error: "Parent access required" });
    return;
  }
  if (context.user.role !== "parent") {
    res.status(403).json({ error: "Parent access required" });
    return;
  }
  const body = UpdateFamilyBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  await db
    .update(familiesTable)
    .set(body.data)
    .where(eq(familiesTable.id, context.user.familyId));
  res.json(
    UpdateFamilyResponse.parse(await familyResponse(context.user.familyId)),
  );
});

router.post("/family/join", async (req, res): Promise<void> => {
  const context = await getContext(req);
  if (!context) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  if (context.user.familyId) {
    res.status(409).json({ error: "This account already belongs to a family" });
    return;
  }
  const body = JoinFamilyBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  const [family] = await db
    .select()
    .from(familiesTable)
    .where(eq(familiesTable.joinCode, body.data.joinCode.toUpperCase()))
    .limit(1);
  if (!family) {
    res.status(400).json({ error: "Family code not found" });
    return;
  }
  const linked = await db.transaction(async (tx) => {
    const [child] = await tx
      .update(childrenTable)
      .set({ userId: context.user.id })
      .where(
        and(
          eq(childrenTable.id, body.data.childId),
          eq(childrenTable.familyId, family.id),
          isNull(childrenTable.userId),
        ),
      )
      .returning();
    if (!child) return null;
    await tx
      .update(usersTable)
      .set({
        familyId: family.id,
        role: "child",
        name: child.name,
        avatar: child.avatar,
      })
      .where(eq(usersTable.id, context.user.id));
    return child;
  });
  if (!linked) {
    res.status(409).json({ error: "That child profile is already linked" });
    return;
  }
  res.json(
    JoinFamilyResponse.parse({
      user: {
        id: context.user.id,
        name: linked.name,
        role: "child",
        familyId: family.id,
        avatar: linked.avatar,
        active: linked.active,
      },
      family: await familyResponse(family.id),
    }),
  );
});

router.get("/family/children", async (req, res): Promise<void> => {
  const context = await getContext(req);
  if (!requireFamily(context)) {
    res.status(context ? 403 : 401).json({ error: "Family setup required" });
    return;
  }
  res.json(
    ListChildrenResponse.parse(await childSummaries(context.user.familyId)),
  );
});

router.post("/family/children", async (req, res): Promise<void> => {
  const context = await getContext(req);
  if (!requireFamily(context) || context.user.role !== "parent") {
    res.status(context ? 403 : 401).json({ error: "Parent access required" });
    return;
  }
  const body = CreateChildBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  const current = await db
    .select()
    .from(childrenTable)
    .where(eq(childrenTable.familyId, context.user.familyId));
  if (current.length >= 3) {
    res.status(400).json({ error: "V1 supports up to three children" });
    return;
  }
  const [child] = await db
    .insert(childrenTable)
    .values({
      familyId: context.user.familyId,
      name: body.data.name,
      avatar: body.data.avatar ?? null,
    })
    .returning();
  res.status(201).json(
    CreateChildResponse.parse({
      id: child.id,
      name: child.name,
      avatar: child.avatar,
      active: child.active,
      linked: false,
      totalPoints: 0,
      assignedCompleted: 0,
      voluntaryCompleted: 0,
      bonusPoints: 0,
    }),
  );
});

router.patch("/family/children/:childId", async (req, res): Promise<void> => {
  const context = await getContext(req);
  if (!requireFamily(context) || context.user.role !== "parent") {
    res.status(context ? 403 : 401).json({ error: "Parent access required" });
    return;
  }
  const params = UpdateChildParams.safeParse(req.params);
  const body = UpdateChildBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: "Invalid child update" });
    return;
  }
  const [child] = await db
    .update(childrenTable)
    .set(body.data)
    .where(
      and(
        eq(childrenTable.id, params.data.childId),
        eq(childrenTable.familyId, context.user.familyId),
      ),
    )
    .returning();
  if (!child) {
    res.status(404).json({ error: "Child not found" });
    return;
  }
  const summary = (await childSummaries(context.user.familyId)).find(
    (item) => item.id === child.id,
  );
  res.json(UpdateChildResponse.parse(summary));
});

router.get("/jobs", async (req, res): Promise<void> => {
  const context = await getContext(req);
  if (!requireFamily(context)) {
    res.status(context ? 403 : 401).json({ error: "Family setup required" });
    return;
  }
  const query = ListJobsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }
  let jobs = await db
    .select()
    .from(jobsTable)
    .where(eq(jobsTable.familyId, context.user.familyId))
    .orderBy(desc(jobsTable.createdAt));
  if (context.user.role === "child" && context.child) {
    jobs = jobs.filter(
      (job) =>
        (job.type === "board" &&
          job.status === "to_do" &&
          !job.claimedByChildId) ||
        job.assignedChildId === context.child?.id ||
        job.claimedByChildId === context.child?.id,
    );
  }
  if (query.data.type) jobs = jobs.filter((job) => job.type === query.data.type);
  if (query.data.status)
    jobs = jobs.filter((job) => job.status === query.data.status);
  if (query.data.childId)
    jobs = jobs.filter(
      (job) =>
        job.assignedChildId === query.data.childId ||
        job.claimedByChildId === query.data.childId,
    );
  res.json(ListJobsResponse.parse(await mapJobs(jobs)));
});

router.post("/jobs", async (req, res): Promise<void> => {
  const context = await getContext(req);
  if (!requireFamily(context) || context.user.role !== "parent") {
    res.status(context ? 403 : 401).json({ error: "Parent access required" });
    return;
  }
  const body = CreateJobBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  if (body.data.type === "assigned" && !body.data.assignedChildId) {
    res.status(400).json({ error: "Assigned jobs need a child" });
    return;
  }
  const [job] = await db
    .insert(jobsTable)
    .values({
      ...body.data,
      familyId: context.user.familyId,
      createdByUserId: context.user.id,
      assignedChildId:
        body.data.type === "assigned" ? body.data.assignedChildId : null,
      description: body.data.description ?? null,
      dueDate: body.data.dueDate ? new Date(body.data.dueDate) : null,
      estimatedMinutes: body.data.estimatedMinutes ?? null,
    })
    .returning();
  await db.insert(jobEventsTable).values({
    jobId: job.id,
    actorUserId: context.user.id,
    eventType: "created",
    toStatus: job.status,
  });
  res.status(201).json(CreateJobResponse.parse(await mapJob(job)));
});

router.patch("/jobs/:jobId", async (req, res): Promise<void> => {
  const context = await getContext(req);
  if (!requireFamily(context) || context.user.role !== "parent") {
    res.status(context ? 403 : 401).json({ error: "Parent access required" });
    return;
  }
  const params = UpdateJobParams.safeParse(req.params);
  const body = UpdateJobBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: "Invalid job update" });
    return;
  }
  const update = {
    ...body.data,
    dueDate:
      body.data.dueDate === undefined
        ? undefined
        : body.data.dueDate
          ? new Date(body.data.dueDate)
          : null,
  };
  const [job] = await db
    .update(jobsTable)
    .set(update)
    .where(
      and(
        eq(jobsTable.id, params.data.jobId),
        eq(jobsTable.familyId, context.user.familyId),
      ),
    )
    .returning();
  if (!job) {
    res.status(404).json({ error: "Job not found" });
    return;
  }
  res.json(UpdateJobResponse.parse(await mapJob(job)));
});

router.delete("/jobs/:jobId", async (req, res): Promise<void> => {
  const context = await getContext(req);
  if (!requireFamily(context) || context.user.role !== "parent") {
    res.status(context ? 403 : 401).json({ error: "Parent access required" });
    return;
  }
  const params = DeleteJobParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [job] = await db
    .delete(jobsTable)
    .where(
      and(
        eq(jobsTable.id, params.data.jobId),
        eq(jobsTable.familyId, context.user.familyId),
      ),
    )
    .returning();
  if (!job) {
    res.status(404).json({ error: "Job not found" });
    return;
  }
  res.sendStatus(204);
});

router.post("/jobs/:jobId/claim", async (req, res): Promise<void> => {
  const context = await getContext(req);
  if (
    !requireFamily(context) ||
    context.user.role !== "child" ||
    !context.child
  ) {
    res.status(context ? 403 : 401).json({ error: "Child access required" });
    return;
  }
  const params = ClaimJobParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [job] = await db
    .update(jobsTable)
    .set({ claimedByChildId: context.child.id, status: "claimed" })
    .where(
      and(
        eq(jobsTable.id, params.data.jobId),
        eq(jobsTable.familyId, context.user.familyId),
        eq(jobsTable.type, "board"),
        eq(jobsTable.status, "to_do"),
        isNull(jobsTable.claimedByChildId),
      ),
    )
    .returning();
  if (!job) {
    res.status(409).json({ error: "This job has already been claimed" });
    return;
  }
  await db.insert(jobEventsTable).values({
    jobId: job.id,
    actorUserId: context.user.id,
    eventType: "claimed",
    fromStatus: "to_do",
    toStatus: "claimed",
  });
  res.json(ClaimJobResponse.parse(await mapJob(job)));
});

async function ownedJob(
  context: Context & { user: UserRecord & { familyId: string } },
  jobId: string,
) {
  if (context.user.role !== "child" || !context.child) return null;
  const [job] = await db
    .select()
    .from(jobsTable)
    .where(
      and(
        eq(jobsTable.id, jobId),
        eq(jobsTable.familyId, context.user.familyId),
      ),
    )
    .limit(1);
  if (
    !job ||
    (job.assignedChildId !== context.child.id &&
      job.claimedByChildId !== context.child.id)
  )
    return null;
  return job;
}

router.post("/jobs/:jobId/start", async (req, res): Promise<void> => {
  const context = await getContext(req);
  const params = StartJobParams.safeParse(req.params);
  if (!requireFamily(context) || !params.success) {
    res.status(context ? 403 : 401).json({ error: "Child access required" });
    return;
  }
  const current = await ownedJob(context, params.data.jobId);
  if (!current || !["to_do", "claimed", "changes_requested"].includes(current.status)) {
    res.status(403).json({ error: "This job cannot be started" });
    return;
  }
  const [job] = await db
    .update(jobsTable)
    .set({ status: "in_progress", completedAt: null })
    .where(eq(jobsTable.id, current.id))
    .returning();
  res.json(StartJobResponse.parse(await mapJob(job)));
});

router.post("/jobs/:jobId/complete", async (req, res): Promise<void> => {
  const context = await getContext(req);
  const params = CompleteJobParams.safeParse(req.params);
  if (!requireFamily(context) || !params.success) {
    res.status(context ? 403 : 401).json({ error: "Child access required" });
    return;
  }
  const current = await ownedJob(context, params.data.jobId);
  if (!current || current.status !== "in_progress") {
    res.status(403).json({ error: "Start this job before signing it off" });
    return;
  }
  const [job] = await db
    .update(jobsTable)
    .set({ completedAt: new Date() })
    .where(eq(jobsTable.id, current.id))
    .returning();
  await db.insert(jobEventsTable).values({
    jobId: job.id,
    actorUserId: context.user.id,
    eventType: "signed_off",
    fromStatus: "in_progress",
    toStatus: "in_progress",
  });
  res.json(CompleteJobResponse.parse(await mapJob(job)));
});

router.post("/jobs/:jobId/submit", async (req, res): Promise<void> => {
  const context = await getContext(req);
  const params = SubmitJobParams.safeParse(req.params);
  if (!requireFamily(context) || !params.success || !context?.child) {
    res.status(context ? 403 : 401).json({ error: "Child access required" });
    return;
  }
  const current = await ownedJob(context, params.data.jobId);
  if (!current?.completedAt) {
    res.status(403).json({ error: "Sign off the completed job first" });
    return;
  }
  const submission = await db.transaction(async (tx) => {
    const [created] = await tx
      .insert(submissionsTable)
      .values({ jobId: current.id, childId: context.child!.id })
      .returning();
    await tx
      .update(jobsTable)
      .set({ status: "ready_for_review" })
      .where(eq(jobsTable.id, current.id));
    await tx.insert(jobEventsTable).values({
      jobId: current.id,
      actorUserId: context.user.id,
      eventType: "submitted",
      fromStatus: current.status,
      toStatus: "ready_for_review",
    });
    return created;
  });
  res.json(
    SubmitJobResponse.parse({
      id: submission.id,
      jobId: current.id,
      childId: context.child.id,
      childName: context.child.name,
      jobTitle: current.title,
      submittedAt: submission.submittedAt.toISOString(),
      status: "ready_for_review",
      parentResponse: null,
      reviewedAt: null,
      reviewedBy: null,
      reviewAction: null,
    }),
  );
});

router.get("/reviews", async (req, res): Promise<void> => {
  const context = await getContext(req);
  if (!requireFamily(context) || context.user.role !== "parent") {
    res.status(context ? 403 : 401).json({ error: "Parent access required" });
    return;
  }
  const submissions = await db
    .select({
      submission: submissionsTable,
      job: jobsTable,
      child: childrenTable,
    })
    .from(submissionsTable)
    .innerJoin(jobsTable, eq(submissionsTable.jobId, jobsTable.id))
    .innerJoin(childrenTable, eq(submissionsTable.childId, childrenTable.id))
    .where(eq(jobsTable.familyId, context.user.familyId))
    .orderBy(desc(submissionsTable.submittedAt));
  res.json(
    ListReviewsResponse.parse(
      submissions.map(({ submission, job, child }) => ({
        id: submission.id,
        jobId: job.id,
        childId: child.id,
        childName: child.name,
        jobTitle: job.title,
        submittedAt: submission.submittedAt.toISOString(),
        status: submission.status,
        parentResponse: submission.parentResponse,
        reviewedAt: iso(submission.reviewedAt),
        reviewedBy: submission.reviewedBy,
        reviewAction: submission.reviewAction,
      })),
    ),
  );
});

router.post("/jobs/:jobId/review", async (req, res): Promise<void> => {
  const context = await getContext(req);
  if (!requireFamily(context) || context.user.role !== "parent") {
    res.status(context ? 403 : 401).json({ error: "Parent access required" });
    return;
  }
  const params = ReviewJobParams.safeParse(req.params);
  const body = ReviewJobBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: "Invalid review" });
    return;
  }
  if (body.data.action === "request_changes" && !body.data.reason?.trim()) {
    res.status(400).json({ error: "Please explain what needs changing" });
    return;
  }
  const result = await db.transaction(async (tx) => {
    const [job] = await tx
      .select()
      .from(jobsTable)
      .where(
        and(
          eq(jobsTable.id, params.data.jobId),
          eq(jobsTable.familyId, context.user.familyId),
        ),
      )
      .for("update")
      .limit(1);
    if (!job || job.status !== "ready_for_review") return null;
    const [submission] = await tx
      .select()
      .from(submissionsTable)
      .where(
        and(
          eq(submissionsTable.jobId, job.id),
          eq(submissionsTable.status, "ready_for_review"),
        ),
      )
      .orderBy(desc(submissionsTable.submittedAt))
      .limit(1);
    if (!submission) return null;
    const nextStatus =
      body.data.action === "approve"
        ? "completed"
        : body.data.action === "request_changes"
          ? "changes_requested"
          : job.type === "board"
            ? "to_do"
            : "to_do";
    const [updated] = await tx
      .update(jobsTable)
      .set({
        status: nextStatus,
        completedAt: body.data.action === "approve" ? job.completedAt : null,
        claimedByChildId:
          body.data.action === "reject" && job.type === "board"
            ? null
            : job.claimedByChildId,
      })
      .where(eq(jobsTable.id, job.id))
      .returning();
    await tx
      .update(submissionsTable)
      .set({
        status: nextStatus,
        parentResponse: body.data.reason ?? null,
        reviewedAt: new Date(),
        reviewedBy: context.user.id,
        reviewAction: body.data.action,
      })
      .where(eq(submissionsTable.id, submission.id));
    if (body.data.action === "approve") {
      await tx
        .insert(pointsTransactionsTable)
        .values({
          familyId: job.familyId,
          childId: submission.childId,
          points: job.points,
          type: job.type === "assigned" ? "assigned_job" : "voluntary_job",
          jobId: job.id,
          reason: job.title,
        })
        .onConflictDoNothing({ target: pointsTransactionsTable.jobId });
    }
    await tx.insert(jobEventsTable).values({
      jobId: job.id,
      actorUserId: context.user.id,
      eventType: body.data.action,
      fromStatus: job.status,
      toStatus: nextStatus,
      note: body.data.reason ?? null,
    });
    return updated;
  });
  if (!result) {
    res.status(400).json({ error: "This job is no longer awaiting review" });
    return;
  }
  res.json(ReviewJobResponse.parse(await mapJob(result)));
});

router.get("/points", async (req, res): Promise<void> => {
  const context = await getContext(req);
  if (!requireFamily(context)) {
    res.status(context ? 403 : 401).json({ error: "Family setup required" });
    return;
  }
  const query = GetPointsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }
  const allChildren = await childSummaries(context.user.familyId);
  const allowedChildId =
    context.user.role === "child" ? context.child?.id : query.data.childId;
  const rows = await db
    .select({
      point: pointsTransactionsTable,
      child: childrenTable,
    })
    .from(pointsTransactionsTable)
    .innerJoin(childrenTable, eq(pointsTransactionsTable.childId, childrenTable.id))
    .where(eq(pointsTransactionsTable.familyId, context.user.familyId))
    .orderBy(desc(pointsTransactionsTable.createdAt));
  const filtered = allowedChildId
    ? rows.filter(({ point }) => point.childId === allowedChildId)
    : rows;
  res.json(
    GetPointsResponse.parse({
      totalPoints: filtered.reduce((sum, { point }) => sum + point.points, 0),
      transactions: filtered.map(({ point, child }) => ({
        id: point.id,
        familyId: point.familyId,
        childId: point.childId,
        childName: child.name,
        points: point.points,
        type: point.type,
        jobId: point.jobId,
        reason: point.reason,
        createdAt: point.createdAt.toISOString(),
      })),
      byChild:
        context.user.role === "child"
          ? allChildren.filter((child) => child.id === context.child?.id)
          : allChildren,
    }),
  );
});

router.post("/points/bonus", async (req, res): Promise<void> => {
  const context = await getContext(req);
  if (!requireFamily(context) || context.user.role !== "parent") {
    res.status(context ? 403 : 401).json({ error: "Parent access required" });
    return;
  }
  const body = AwardBonusBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  const [child] = await db
    .select()
    .from(childrenTable)
    .where(
      and(
        eq(childrenTable.id, body.data.childId),
        eq(childrenTable.familyId, context.user.familyId),
      ),
    )
    .limit(1);
  if (!child) {
    res.status(400).json({ error: "Child not found" });
    return;
  }
  const [point] = await db
    .insert(pointsTransactionsTable)
    .values({
      familyId: context.user.familyId,
      childId: child.id,
      points: body.data.points,
      type: "initiative_bonus",
      reason: body.data.reason,
    })
    .returning();
  res.status(201).json(
    AwardBonusResponse.parse({
      id: point.id,
      familyId: point.familyId,
      childId: child.id,
      childName: child.name,
      points: point.points,
      type: point.type,
      jobId: null,
      reason: point.reason,
      createdAt: point.createdAt.toISOString(),
    }),
  );
});

router.get("/dashboard", async (req, res): Promise<void> => {
  const context = await getContext(req);
  if (!requireFamily(context)) {
    res.status(context ? 403 : 401).json({ error: "Family setup required" });
    return;
  }
  let jobs = await db
    .select()
    .from(jobsTable)
    .where(eq(jobsTable.familyId, context.user.familyId))
    .orderBy(desc(jobsTable.updatedAt));
  if (context.user.role === "child" && context.child) {
    jobs = jobs.filter(
      (job) =>
        job.assignedChildId === context.child?.id ||
        job.claimedByChildId === context.child?.id,
    );
  }
  res.json(
    GetDashboardResponse.parse({
      today: {
        completed: jobs.filter((job) => job.status === "completed").length,
        outstanding: jobs.filter((job) =>
          ["to_do", "claimed", "in_progress"].includes(job.status),
        ).length,
        awaitingReview: jobs.filter(
          (job) => job.status === "ready_for_review",
        ).length,
        changesRequested: jobs.filter(
          (job) => job.status === "changes_requested",
        ).length,
      },
      children:
        context.user.role === "parent"
          ? await childSummaries(context.user.familyId)
          : (await childSummaries(context.user.familyId)).filter(
              (child) => child.id === context.child?.id,
            ),
      recentJobs: await mapJobs(jobs.slice(0, 6)),
    }),
  );
});

export default router;