import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { getPlatformDefaults } from "@/lib/config/platform-defaults";
import { getAdminDb } from "@/lib/firebase/admin";
import type {
  AssignmentType,
  CsvImportPreview,
  CsvImportPreviewRow,
  ExamAccessCodeRecord,
  ExamAssignmentRecord,
  ExamAssignmentSummary,
  StudentGroupRecord,
  StudentRecord,
} from "@/lib/types/exam-management";
import { timestampToIso } from "../format/date-utils";

function sanitizeId(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[.#$/\[\]\s]+/g, "_");
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function parseCsvLine(line: string) {
  const values: string[] = [];
  let current = "";
  let insideQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];

    if (char === '"') {
      if (insideQuotes && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else {
        insideQuotes = !insideQuotes;
      }
      continue;
    }

    if (char === "," && !insideQuotes) {
      values.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current.trim());
  return values;
}

function parseCsvRows(csvText: string) {
  const lines = csvText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return [];
  }

  const [headerLine, ...dataLines] = lines;
  const headers = parseCsvLine(headerLine).map((header) =>
    header.trim().toLowerCase(),
  );

  const emailIndex = headers.findIndex((header) => header === "email");
  const nameIndex = headers.findIndex(
    (header) => header === "name" || header === "full name",
  );

  if (emailIndex === -1) {
    throw new Error("The CSV file must include an email column.");
  }

  return dataLines.map((line) => {
    const columns = parseCsvLine(line);
    return {
      email: normalizeEmail(columns[emailIndex] ?? ""),
      name: (nameIndex >= 0 ? columns[nameIndex] : "")?.trim() ?? "",
    };
  });
}

function serializeStudentRecord(data: Record<string, unknown>): StudentRecord {
  return {
    uid: typeof data.uid === "string" ? data.uid : undefined,
    email: String(data.email ?? ""),
    name: String(data.name ?? ""),
    status: data.status === "active" ? "active" : "inactive",
    createdAt: timestampToIso(data.createdAt),
    updatedAt: timestampToIso(data.updatedAt),
  };
}

function serializeStudentGroupRecord(
  id: string,
  data: Record<string, unknown>,
): StudentGroupRecord {
  return {
    id,
    name: String(data.name ?? ""),
    description: String(data.description ?? ""),
    memberEmails: Array.isArray(data.memberEmails)
      ? data.memberEmails.map((value) => String(value))
      : [],
    memberUids: Array.isArray(data.memberUids)
      ? data.memberUids.map((value) => String(value))
      : [],
    createdBy: String(data.createdBy ?? ""),
    createdAt: timestampToIso(data.createdAt),
    updatedAt: timestampToIso(data.updatedAt),
  };
}

function serializeExamAssignmentRecord(
  id: string,
  data: Record<string, unknown>,
): ExamAssignmentRecord {
  return {
    id,
    examId: String(data.examId ?? ""),
    assignmentType:
      data.assignmentType === "access_code"
        ? "access_code"
        : data.assignmentType === "group"
          ? "group"
          : "csv_import",
    assignmentSources: Array.isArray(data.assignmentSources)
      ? data.assignmentSources.map((value) => value as AssignmentType)
      : undefined,
    studentGroupId:
      typeof data.studentGroupId === "string" ? data.studentGroupId : undefined,
    studentGroupIds: Array.isArray(data.studentGroupIds)
      ? data.studentGroupIds.map((value) => String(value))
      : undefined,
    studentUid:
      typeof data.studentUid === "string" ? data.studentUid : undefined,
    studentEmail:
      typeof data.studentEmail === "string" ? data.studentEmail : undefined,
    accessCodeId:
      typeof data.accessCodeId === "string" ? data.accessCodeId : undefined,
    assignedBy:
      typeof data.assignedBy === "string" ? data.assignedBy : undefined,
    assignedAt: timestampToIso(data.assignedAt),
    status:
      data.status === "redeemed"
        ? "redeemed"
        : data.status === "revoked"
          ? "revoked"
          : "assigned",
  };
}

function serializeExamAccessCodeRecord(
  id: string,
  data: Record<string, unknown>,
): ExamAccessCodeRecord {
  return {
    id,
    code: String(data.code ?? ""),
    examId: String(data.examId ?? ""),
    status:
      data.status === "disabled"
        ? "disabled"
        : data.status === "expired"
          ? "expired"
          : "active",
    maxUses: Number(data.maxUses ?? 1),
    usedCount: Number(data.usedCount ?? 0),
    expiresAt: timestampToIso(data.expiresAt),
    createdBy: String(data.createdBy ?? ""),
    createdAt: timestampToIso(data.createdAt),
  };
}

async function listExamAssignments(examId: string) {
  const snapshot = await getAdminDb()
    .collection("examAssignments")
    .where("examId", "==", examId)
    .get();

  return snapshot.docs.map((document) =>
    serializeExamAssignmentRecord(document.id, document.data()),
  );
}

async function getStudentsByEmails(emails: string[]) {
  if (emails.length === 0) {
    return new Map<string, { id: string; record: StudentRecord }>();
  }

  const uniqueEmails = Array.from(new Set(emails.map(normalizeEmail)));
  const chunks: string[][] = [];

  for (let index = 0; index < uniqueEmails.length; index += 10) {
    chunks.push(uniqueEmails.slice(index, index + 10));
  }

  const map = new Map<string, { id: string; record: StudentRecord }>();

  for (const chunk of chunks) {
    const snapshot = await getAdminDb()
      .collection("users")
      .where("email", "in", chunk)
      .get();

    snapshot.docs.forEach((document) => {
      const record = serializeStudentRecord(document.data());
      map.set(normalizeEmail(record.email), { id: document.id, record });
    });
  }

  return map;
}

export async function listStudentGroups() {
  const snapshot = await getAdminDb()
    .collection("studentGroups")
    .orderBy("createdAt", "desc")
    .get();

  return snapshot.docs.map((document) =>
    serializeStudentGroupRecord(document.id, document.data()),
  );
}

export async function createStudentGroupRecord({
  createdBy,
  payload,
}: {
  createdBy: string;
  payload: {
    name: string;
    description?: string;
    memberEmails: string[];
  };
}) {
  const normalizedEmails = Array.from(
    new Set(payload.memberEmails.map(normalizeEmail).filter(Boolean)),
  );
  const documentReference = getAdminDb().collection("studentGroups").doc();

  await documentReference.set({
    name: payload.name.trim(),
    description: payload.description?.trim() ?? "",
    memberEmails: normalizedEmails,
    memberUids: [],
    createdBy,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  const snapshot = await documentReference.get();
  return serializeStudentGroupRecord(snapshot.id, snapshot.data() ?? {});
}

export async function updateStudentGroupRecord({
  groupId,
  payload,
}: {
  groupId: string;
  payload: {
    name: string;
    description?: string;
    memberEmails: string[];
  };
}) {
  const normalizedEmails = Array.from(
    new Set(payload.memberEmails.map(normalizeEmail).filter(Boolean)),
  );
  const documentReference = getAdminDb()
    .collection("studentGroups")
    .doc(groupId);
  const snapshot = await documentReference.get();

  if (!snapshot.exists) {
    throw new Error("The selected candidate group could not be found.");
  }

  await documentReference.set(
    {
      name: payload.name.trim(),
      description: payload.description?.trim() ?? "",
      memberEmails: normalizedEmails,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  const updatedSnapshot = await documentReference.get();
  return serializeStudentGroupRecord(
    updatedSnapshot.id,
    updatedSnapshot.data() ?? {},
  );
}

export async function previewExamAssignmentImport({
  examId,
  csvText,
}: {
  examId: string;
  csvText: string;
}) {
  const parsedRows = parseCsvRows(csvText);
  const currentAssignments = await listExamAssignments(examId);
  const assignedEmails = new Set(
    currentAssignments
      .map((assignment) => assignment.studentEmail)
      .filter(Boolean)
      .map((email) => normalizeEmail(email!)),
  );
  const studentMap = await getStudentsByEmails(
    parsedRows.map((row) => row.email),
  );
  const seen = new Set<string>();
  const rows: CsvImportPreviewRow[] = parsedRows.map((row) => {
    if (!row.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) {
      return {
        email: row.email,
        name: row.name,
        status: "invalid",
      };
    }

    if (seen.has(row.email)) {
      return {
        email: row.email,
        name: row.name,
        status: "duplicate_in_file",
      };
    }

    seen.add(row.email);

    if (assignedEmails.has(row.email)) {
      return {
        email: row.email,
        name: row.name,
        status: "already_assigned",
      };
    }

    if (studentMap.has(row.email)) {
      return {
        email: row.email,
        name: row.name,
        status: "existing_roster",
      };
    }

    return {
      email: row.email,
      name: row.name,
      status: "new_roster",
    };
  });

  const summary: CsvImportPreview = {
    rows,
    validRows: rows.filter((row) =>
      ["existing_roster", "new_roster"].includes(row.status),
    ).length,
    duplicateRows: rows.filter((row) => row.status === "duplicate_in_file")
      .length,
    alreadyAssignedRows: rows.filter((row) => row.status === "already_assigned")
      .length,
    newRosterRows: rows.filter((row) => row.status === "new_roster").length,
    existingRosterRows: rows.filter((row) => row.status === "existing_roster")
      .length,
    invalidRows: rows.filter((row) => row.status === "invalid").length,
  };

  return summary;
}

export async function importExamAssignmentsFromCsv({
  examId,
  createdBy,
  csvText,
}: {
  examId: string;
  createdBy: string;
  csvText: string;
}) {
  const preview = await previewExamAssignmentImport({ examId, csvText });
  const validRows = preview.rows.filter((row) =>
    ["existing_roster", "new_roster"].includes(row.status),
  );
  const emails = validRows.map((row) => row.email);
  const studentMap = await getStudentsByEmails(emails);
  const currentAssignments = await listExamAssignments(examId);
  const assignmentMap = new Map(
    currentAssignments
      .filter((assignment) => assignment.studentEmail)
      .map((assignment) => [
        normalizeEmail(assignment.studentEmail!),
        assignment,
      ]),
  );
  const batch = getAdminDb().batch();

  for (const row of validRows) {
    const existingStudent = studentMap.get(row.email);
    const studentReference = getAdminDb()
      .collection("users")
      .doc(existingStudent?.id ?? `email__${sanitizeId(row.email)}`);

    if (!existingStudent) {
      batch.set(
        studentReference,
        {
          email: row.email,
          name: row.name,
          role: "student",
          status: "inactive",
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
    } else if (row.name && row.name !== existingStudent.record.name) {
      batch.set(
        studentReference,
        {
          name: row.name,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
    }

    const existingAssignment = assignmentMap.get(row.email);
    const assignmentReference = getAdminDb()
      .collection("examAssignments")
      .doc(`${examId}__${sanitizeId(row.email)}`);

    const existingSources = new Set<AssignmentType>(
      existingAssignment?.assignmentSources ??
        ([existingAssignment?.assignmentType].filter(
          Boolean,
        ) as AssignmentType[]),
    );
    existingSources.add("csv_import");

    batch.set(
      assignmentReference,
      {
        examId,
        assignmentType:
          existingAssignment?.assignmentType === "group"
            ? "group"
            : "csv_import",
        assignmentSources: Array.from(existingSources),
        studentEmail: row.email,
        studentUid: existingStudent?.record.uid ?? null,
        assignedBy: createdBy,
        assignedAt: existingAssignment?.assignedAt
          ? Timestamp.fromDate(new Date(existingAssignment.assignedAt))
          : FieldValue.serverTimestamp(),
        status: existingAssignment?.status ?? "assigned",
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
  }

  await batch.commit();
  return getExamAssignmentSummary(examId);
}

export async function attachStudentGroupsToExam({
  examId,
  createdBy,
  groupIds,
}: {
  examId: string;
  createdBy: string;
  groupIds: string[];
}) {
  const groups = await Promise.all(
    groupIds.map(async (groupId) => {
      const snapshot = await getAdminDb()
        .collection("studentGroups")
        .doc(groupId)
        .get();
      if (!snapshot.exists) {
        throw new Error("One of the selected groups could not be found.");
      }
      return serializeStudentGroupRecord(snapshot.id, snapshot.data() ?? {});
    }),
  );

  const currentAssignments = await listExamAssignments(examId);
  const assignmentMap = new Map(
    currentAssignments
      .filter((assignment) => assignment.studentEmail)
      .map((assignment) => [
        normalizeEmail(assignment.studentEmail!),
        assignment,
      ]),
  );
  const studentMap = await getStudentsByEmails(
    groups.flatMap((group) => group.memberEmails),
  );
  const batch = getAdminDb().batch();

  for (const group of groups) {
    for (const email of group.memberEmails.map(normalizeEmail)) {
      if (!email) {
        continue;
      }

      const existingAssignment = assignmentMap.get(email);
      const nextGroupIds = new Set<string>([
        ...(existingAssignment?.studentGroupIds ?? []),
        ...(existingAssignment?.studentGroupId
          ? [existingAssignment.studentGroupId]
          : []),
        group.id,
      ]);
      const nextSources = new Set<AssignmentType>(
        existingAssignment?.assignmentSources ??
          ([existingAssignment?.assignmentType].filter(
            Boolean,
          ) as AssignmentType[]),
      );
      nextSources.add("group");

      const assignmentReference = getAdminDb()
        .collection("examAssignments")
        .doc(`${examId}__${sanitizeId(email)}`);

      batch.set(
        assignmentReference,
        {
          examId,
          assignmentType: "group",
          assignmentSources: Array.from(nextSources),
          studentEmail: email,
          studentUid: studentMap.get(email)?.record.uid ?? null,
          studentGroupId: group.id,
          studentGroupIds: Array.from(nextGroupIds),
          assignedBy: createdBy,
          assignedAt: existingAssignment?.assignedAt
            ? Timestamp.fromDate(new Date(existingAssignment.assignedAt))
            : FieldValue.serverTimestamp(),
          status: existingAssignment?.status ?? "assigned",
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
    }
  }

  await batch.commit();
  return getExamAssignmentSummary(examId);
}

const ACCESS_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateSharedExamCode() {
  return Array.from({ length: 6 }, () =>
    ACCESS_CODE_ALPHABET.charAt(
      Math.floor(Math.random() * ACCESS_CODE_ALPHABET.length),
    ),
  ).join("");
}

async function generateUniqueSharedExamCode() {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const code = generateSharedExamCode();
    const existingCodeSnapshot = await getAdminDb()
      .collection("examAccessCodes")
      .where("code", "==", code)
      .limit(1)
      .get();

    if (existingCodeSnapshot.empty) {
      return code;
    }
  }

  throw new Error("Could not generate a unique exam access code.");
}

export async function createOrReplaceSharedExamAccessCode({
  examId,
  createdBy,
  maxUses,
  expiresInDays,
}: {
  examId: string;
  createdBy: string;
  maxUses: number;
  expiresInDays?: number;
}) {
  const defaults = await getPlatformDefaults();
  const documentReference = getAdminDb()
    .collection("examAccessCodes")
    .doc(examId);
  const expiresAt = expiresInDays
    ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
    : defaults.defaultAccessCodeExpiryDays
      ? new Date(
          Date.now() +
            defaults.defaultAccessCodeExpiryDays * 24 * 60 * 60 * 1000,
        )
      : null;
  const currentSnapshot = await documentReference.get();

  if (currentSnapshot.exists) {
    await documentReference.set(
      {
        status: "active",
        maxUses,
        expiresAt: expiresAt ? Timestamp.fromDate(expiresAt) : null,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    const snapshot = await documentReference.get();
    return serializeExamAccessCodeRecord(snapshot.id, snapshot.data() ?? {});
  }

  await documentReference.set({
    code: await generateUniqueSharedExamCode(),
    examId,
    status: "active",
    maxUses,
    usedCount: 0,
    expiresAt: expiresAt ? Timestamp.fromDate(expiresAt) : null,
    createdBy,
    createdAt: FieldValue.serverTimestamp(),
  });

  const snapshot = await documentReference.get();
  return serializeExamAccessCodeRecord(snapshot.id, snapshot.data() ?? {});
}

export async function getSharedExamAccessCode(examId: string) {
  const snapshot = await getAdminDb()
    .collection("examAccessCodes")
    .doc(examId)
    .get();

  if (!snapshot.exists) {
    return null;
  }

  return serializeExamAccessCodeRecord(snapshot.id, snapshot.data() ?? {});
}

export async function getExamAssignmentSummary(
  examId: string,
): Promise<ExamAssignmentSummary> {
  const [assignments, sharedAccessCodeSnapshot] = await Promise.all([
    listExamAssignments(examId),
    getAdminDb().collection("examAccessCodes").doc(examId).get(),
  ]);

  const sharedAccessCode = sharedAccessCodeSnapshot.exists
    ? serializeExamAccessCodeRecord(
        sharedAccessCodeSnapshot.id,
        sharedAccessCodeSnapshot.data() ?? {},
      )
    : null;

  const importedCandidateCount = assignments.filter((assignment) =>
    (assignment.assignmentSources ?? [assignment.assignmentType]).includes(
      "csv_import",
    ),
  ).length;

  const selectedGroupIds = Array.from(
    new Set(
      assignments.flatMap((assignment) => [
        ...(assignment.studentGroupIds ?? []),
        ...(assignment.studentGroupId ? [assignment.studentGroupId] : []),
      ]),
    ),
  );

  const selectedGroupNames = selectedGroupIds.length
    ? (
        await Promise.all(
          selectedGroupIds.map(async (groupId) => {
            const snapshot = await getAdminDb()
              .collection("studentGroups")
              .doc(groupId)
              .get();
            return snapshot.exists
              ? String(snapshot.data()?.name ?? "Saved group")
              : "Saved group";
          }),
        )
      ).filter(Boolean)
    : [];

  const totalReachableCandidates = new Set(
    assignments
      .map((assignment) => assignment.studentEmail)
      .filter(Boolean)
      .map((email) => normalizeEmail(email!)),
  ).size;

  return {
    examId,
    importedCandidateCount,
    selectedGroupCount: selectedGroupIds.length,
    totalReachableCandidates,
    hasSharedAccessCode: Boolean(sharedAccessCode),
    selectedGroupIds,
    selectedGroupNames,
    sharedAccessCode,
    isStepComplete:
      importedCandidateCount > 0 ||
      selectedGroupIds.length > 0 ||
      Boolean(sharedAccessCode),
  };
}
