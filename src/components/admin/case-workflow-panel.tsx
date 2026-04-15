"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { EmptyState, StateInline } from "@/components/ui/state-panel";
import { Table, TableContainer } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import type { CaseWorkspaceSnapshot } from "@/lib/services/case-service";
import type { SubmissionWorkspaceSnapshot } from "@/lib/services/submission-service";
import { caseStageLabels, caseStageValues, type CaseStage } from "@/types/case";
import {
  submissionPackageStatusLabels,
  submissionPackageStatusValues,
  supplementRequestStatusLabels,
  supplementRequestStatusValues,
  type SubmissionPackageStatus,
  type SupplementRequestStatus
} from "@/types/submission";

type CaseWorkflowPanelProps = {
  initialCaseWorkspace: CaseWorkspaceSnapshot | null;
};

function deadlineInputValue(
  workspace: CaseWorkspaceSnapshot | null,
  key: "dueDate" | "filingDeadline" | "supplementDeadline" | "stayExpirationDate" | "internalDeadline"
) {
  return workspace?.deadlines.find((deadline) => deadline.key === key)?.value?.slice(0, 10) ?? "";
}

export function CaseWorkflowPanel({ initialCaseWorkspace }: CaseWorkflowPanelProps) {
  const [caseWorkspace, setCaseWorkspace] = useState<CaseWorkspaceSnapshot | null>(initialCaseWorkspace);
  const [submissionWorkspace, setSubmissionWorkspace] = useState<SubmissionWorkspaceSnapshot | null>(null);
  const [message, setMessage] = useState("");
  const [tone, setTone] = useState<"default" | "success" | "error">("default");
  const [isPending, startTransition] = useTransition();
  const [stage, setStage] = useState<CaseStage>(
    initialCaseWorkspace?.currentStage ?? "CONTRACT_PREPARATION"
  );
  const [dueDate, setDueDate] = useState(deadlineInputValue(initialCaseWorkspace, "dueDate"));
  const [filingDeadline, setFilingDeadline] = useState(
    deadlineInputValue(initialCaseWorkspace, "filingDeadline")
  );
  const [supplementDeadline, setSupplementDeadline] = useState(
    deadlineInputValue(initialCaseWorkspace, "supplementDeadline")
  );
  const [stayExpirationDate, setStayExpirationDate] = useState(
    deadlineInputValue(initialCaseWorkspace, "stayExpirationDate")
  );
  const [internalDeadline, setInternalDeadline] = useState(
    deadlineInputValue(initialCaseWorkspace, "internalDeadline")
  );
  const [internalMemo, setInternalMemo] = useState(initialCaseWorkspace?.internalMemo ?? "");
  const [logNote, setLogNote] = useState("");
  const [newPackageLabel, setNewPackageLabel] = useState("");
  const [newPackageSubmittedTo, setNewPackageSubmittedTo] = useState("");
  const [newPackageNote, setNewPackageNote] = useState("");
  const [newPackageStatus, setNewPackageStatus] = useState<SubmissionPackageStatus>("DRAFT");
  const [selectedSubmissionDocumentIds, setSelectedSubmissionDocumentIds] = useState<string[]>([]);
  const [supplementSubmissionPackageId, setSupplementSubmissionPackageId] = useState("");
  const [supplementDueDate, setSupplementDueDate] = useState("");
  const [supplementRequestedBy, setSupplementRequestedBy] = useState("");
  const [supplementSummary, setSupplementSummary] = useState("");
  const [supplementNote, setSupplementNote] = useState("");
  const [selectedSupplementDocumentIds, setSelectedSupplementDocumentIds] = useState<string[]>([]);

  useEffect(() => {
    if (!caseWorkspace?.id) {
      setSubmissionWorkspace(null);
      return;
    }

    let cancelled = false;
    const loadSubmissionWorkspace = async () => {
      try {
        const response = await fetch(`/api/admin/cases/${caseWorkspace.id}/submission-workspace`);
        const payload = await response.json();
        if (!cancelled && response.ok) {
          setSubmissionWorkspace(payload.submissionWorkspace);
        }
      } catch {
        if (!cancelled) {
          setSubmissionWorkspace(null);
        }
      }
    };

    void loadSubmissionWorkspace();
    return () => {
      cancelled = true;
    };
  }, [caseWorkspace?.id]);

  useEffect(() => {
    if (!caseWorkspace) return;
    setStage(caseWorkspace.currentStage as CaseStage);
    setDueDate(deadlineInputValue(caseWorkspace, "dueDate"));
    setFilingDeadline(deadlineInputValue(caseWorkspace, "filingDeadline"));
    setSupplementDeadline(deadlineInputValue(caseWorkspace, "supplementDeadline"));
    setStayExpirationDate(deadlineInputValue(caseWorkspace, "stayExpirationDate"));
    setInternalDeadline(deadlineInputValue(caseWorkspace, "internalDeadline"));
    setInternalMemo(caseWorkspace.internalMemo ?? "");
  }, [caseWorkspace]);

  if (!caseWorkspace) {
    return (
      <Card className="p-6">
        <h3 className="ui-section-title">사건 진행현황</h3>
        <EmptyState
          title="생성된 사건이 없습니다."
          description="견적 수락(ACCEPTED) 또는 계약 초안 생성 후 사건 레코드가 생성됩니다."
          className="mt-4"
        />
      </Card>
    );
  }

  const missingText =
    caseWorkspace.documentSummary.missingCount > 0
      ? caseWorkspace.documentSummary.missingDocuments.join(", ")
      : "필수서류 누락 없음";

  function setFeedback(nextMessage: string, nextTone: "default" | "success" | "error") {
    setMessage(nextMessage);
    setTone(nextTone);
  }

  async function refreshSubmissionWorkspace(caseId: string) {
    const response = await fetch(`/api/admin/cases/${caseId}/submission-workspace`);
    const payload = await response.json();
    if (response.ok) {
      setSubmissionWorkspace(payload.submissionWorkspace);
    }
  }

  async function handleUpdateStage() {
    if (!caseWorkspace) return;
    const currentCaseId = caseWorkspace.id;

    startTransition(async () => {
      const response = await fetch(`/api/admin/cases/${currentCaseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stage,
          dueDate,
          filingDeadline,
          supplementDeadline,
          stayExpirationDate,
          internalDeadline,
          internalMemo,
          logNote
        })
      });

      const payload = await response.json();
      if (!response.ok) {
        setFeedback(payload.error ?? "사건 상태를 저장하지 못했습니다.", "error");
        return;
      }

      setCaseWorkspace(payload.caseWorkspace);
      await refreshSubmissionWorkspace(currentCaseId);
      setLogNote("");
      setFeedback("사건 상태를 업데이트했습니다.", "success");
    });
  }

  async function handleUpdateDocument(itemId: string, isReceived: boolean, note: string) {
    if (!caseWorkspace) return;
    const currentCaseId = caseWorkspace.id;

    startTransition(async () => {
      try {
        const response = await fetch(`/api/admin/cases/${currentCaseId}/documents/${itemId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isReceived, note })
        });
        const payload = await response.json();

        if (!response.ok) {
          setFeedback(payload.error ?? "문서 상태를 저장하지 못했습니다.", "error");
          return;
        }

        setCaseWorkspace(payload.caseWorkspace);
        await refreshSubmissionWorkspace(currentCaseId);
        setFeedback("문서 상태를 업데이트했습니다.", "success");
      } catch {
        setFeedback("문서 상태 저장 중 오류가 발생했습니다.", "error");
      }
    });
  }

  async function handleUploadDocumentFile(itemId: string, file: File, note: string) {
    if (!caseWorkspace) return;
    const currentCaseId = caseWorkspace.id;

    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append("file", file);
        if (note.trim()) {
          formData.append("note", note.trim());
        }

        const response = await fetch(`/api/admin/cases/${currentCaseId}/documents/${itemId}/files`, {
          method: "POST",
          body: formData
        });
        const payload = await response.json();

        if (!response.ok) {
          setFeedback(payload.error ?? "파일을 업로드하지 못했습니다.", "error");
          return;
        }

        setCaseWorkspace(payload.caseWorkspace);
        await refreshSubmissionWorkspace(currentCaseId);
        setFeedback("파일을 업로드했습니다. 최신본으로 반영되었습니다.", "success");
      } catch {
        setFeedback("파일 업로드 중 오류가 발생했습니다.", "error");
      }
    });
  }

  async function handleSetCurrentFile(itemId: string, fileId: string) {
    if (!caseWorkspace) return;
    const currentCaseId = caseWorkspace.id;

    startTransition(async () => {
      try {
        const response = await fetch(
          `/api/admin/cases/${currentCaseId}/documents/${itemId}/files/${fileId}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ mode: "setCurrent" })
          }
        );
        const payload = await response.json();

        if (!response.ok) {
          setFeedback(payload.error ?? "최신본 지정에 실패했습니다.", "error");
          return;
        }

        setCaseWorkspace(payload.caseWorkspace);
        await refreshSubmissionWorkspace(currentCaseId);
        setFeedback("최신본을 변경했습니다.", "success");
      } catch {
        setFeedback("최신본 지정 중 오류가 발생했습니다.", "error");
      }
    });
  }

  async function handleUpdateFileNote(itemId: string, fileId: string, note: string) {
    if (!caseWorkspace) return;
    const currentCaseId = caseWorkspace.id;

    startTransition(async () => {
      try {
        const response = await fetch(
          `/api/admin/cases/${currentCaseId}/documents/${itemId}/files/${fileId}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ mode: "updateNote", note })
          }
        );
        const payload = await response.json();

        if (!response.ok) {
          setFeedback(payload.error ?? "파일 메모 저장에 실패했습니다.", "error");
          return;
        }

        setCaseWorkspace(payload.caseWorkspace);
        await refreshSubmissionWorkspace(currentCaseId);
        setFeedback("파일 메모를 저장했습니다.", "success");
      } catch {
        setFeedback("파일 메모 저장 중 오류가 발생했습니다.", "error");
      }
    });
  }

  async function handleDeleteFile(itemId: string, fileId: string) {
    if (!caseWorkspace) return;
    const currentCaseId = caseWorkspace.id;

    startTransition(async () => {
      try {
        const response = await fetch(
          `/api/admin/cases/${currentCaseId}/documents/${itemId}/files/${fileId}`,
          {
            method: "DELETE"
          }
        );
        const payload = await response.json();

        if (!response.ok) {
          setFeedback(payload.error ?? "파일 삭제에 실패했습니다.", "error");
          return;
        }

        setCaseWorkspace(payload.caseWorkspace);
        await refreshSubmissionWorkspace(currentCaseId);
        setFeedback("파일을 삭제했습니다.", "success");
      } catch {
        setFeedback("파일 삭제 중 오류가 발생했습니다.", "error");
      }
    });
  }

  async function handleCreateSubmissionPackage() {
    if (!caseWorkspace) return;
    const currentCaseId = caseWorkspace.id;

    startTransition(async () => {
      try {
        const response = await fetch(`/api/admin/cases/${currentCaseId}/submissions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            packageLabel: newPackageLabel,
            submittedTo: newPackageSubmittedTo,
            note: newPackageNote,
            status: newPackageStatus,
            selectedDocumentItemIds: selectedSubmissionDocumentIds
          })
        });
        const payload = await response.json();
        if (!response.ok) {
          setFeedback(payload.error ?? "제출 패키지 생성에 실패했습니다.", "error");
          return;
        }

        setSubmissionWorkspace(payload.submissionWorkspace);
        setNewPackageLabel("");
        setNewPackageSubmittedTo("");
        setNewPackageNote("");
        setNewPackageStatus("DRAFT");
        setSelectedSubmissionDocumentIds([]);
        setFeedback("제출 패키지를 생성했습니다.", "success");
      } catch {
        setFeedback("제출 패키지 생성 중 오류가 발생했습니다.", "error");
      }
    });
  }

  async function handleUpdateSubmissionPackage(
    packageId: string,
    input: {
      status?: SubmissionPackageStatus;
      packageLabel?: string;
      submittedTo?: string;
      submittedAt?: string;
      note?: string;
    }
  ) {
    if (!caseWorkspace) return;
    const currentCaseId = caseWorkspace.id;

    startTransition(async () => {
      try {
        const response = await fetch(
          `/api/admin/cases/${currentCaseId}/submissions/${packageId}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(input)
          }
        );
        const payload = await response.json();
        if (!response.ok) {
          setFeedback(payload.error ?? "제출 패키지 상태 저장에 실패했습니다.", "error");
          return;
        }

        setSubmissionWorkspace(payload.submissionWorkspace);
        await refreshSubmissionWorkspace(currentCaseId);
        setFeedback("제출 패키지 상태를 업데이트했습니다.", "success");
      } catch {
        setFeedback("제출 패키지 업데이트 중 오류가 발생했습니다.", "error");
      }
    });
  }

  async function handleCreateSupplementRequest() {
    if (!caseWorkspace) return;
    const currentCaseId = caseWorkspace.id;

    if (!supplementSummary.trim()) {
      setFeedback("보완 요청 요약을 입력해 주세요.", "error");
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch(`/api/admin/cases/${currentCaseId}/supplements`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            submissionPackageId: supplementSubmissionPackageId || undefined,
            dueDate: supplementDueDate,
            requestedBy: supplementRequestedBy,
            summary: supplementSummary,
            note: supplementNote,
            relatedDocumentItemIds: selectedSupplementDocumentIds
          })
        });
        const payload = await response.json();
        if (!response.ok) {
          setFeedback(payload.error ?? "보완 요청 등록에 실패했습니다.", "error");
          return;
        }

        setSubmissionWorkspace(payload.submissionWorkspace);
        await refreshSubmissionWorkspace(currentCaseId);
        setSupplementSubmissionPackageId("");
        setSupplementDueDate("");
        setSupplementRequestedBy("");
        setSupplementSummary("");
        setSupplementNote("");
        setSelectedSupplementDocumentIds([]);
        setFeedback("보완 요청을 등록했습니다.", "success");
      } catch {
        setFeedback("보완 요청 등록 중 오류가 발생했습니다.", "error");
      }
    });
  }

  async function handleUpdateSupplementRequest(
    supplementId: string,
    input: {
      status?: SupplementRequestStatus;
      dueDate?: string;
      summary?: string;
      note?: string;
    }
  ) {
    if (!caseWorkspace) return;
    const currentCaseId = caseWorkspace.id;

    startTransition(async () => {
      try {
        const response = await fetch(
          `/api/admin/cases/${currentCaseId}/supplements/${supplementId}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(input)
          }
        );
        const payload = await response.json();
        if (!response.ok) {
          setFeedback(payload.error ?? "보완 요청 업데이트에 실패했습니다.", "error");
          return;
        }

        setSubmissionWorkspace(payload.submissionWorkspace);
        await refreshSubmissionWorkspace(currentCaseId);
        setFeedback("보완 요청을 업데이트했습니다.", "success");
      } catch {
        setFeedback("보완 요청 업데이트 중 오류가 발생했습니다.", "error");
      }
    });
  }

  async function copyText(label: string, value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setFeedback(`${label} 문구를 복사했습니다.`, "success");
    } catch {
      setFeedback("클립보드 복사에 실패했습니다.", "error");
    }
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="ui-section-title">사건 진행현황</h3>
        <div className="ui-section-copy mt-4 grid gap-3 sm:grid-cols-2">
          <p>사건번호: {caseWorkspace.caseNumber}</p>
          <p>필수서류 수령: {caseWorkspace.documentSummary.receivedRequiredCount}/{caseWorkspace.documentSummary.requiredCount}</p>
          <p className="sm:col-span-2">누락 문서: {missingText}</p>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {caseWorkspace.deadlines.map((deadline) => (
            <Card key={deadline.key} muted className="ui-stat-card p-3 text-xs">
              <p className="font-semibold text-text-strong">{deadline.label}</p>
              <p className="mt-1 text-text-muted">
                {deadline.value ? new Date(deadline.value).toLocaleDateString("ko-KR") : "미설정"}
              </p>
              <p
                className={
                  deadline.status === "OVERDUE"
                    ? "mt-1 font-semibold text-danger"
                    : deadline.status === "DUE_SOON"
                      ? "mt-1 font-semibold text-warning"
                      : "mt-1 text-text-muted"
                }
              >
                {formatDeadlineStatus(deadline.status, deadline.daysRemaining)}
              </p>
            </Card>
          ))}
        </div>
        <div className="mt-5">
          <FieldGroup>
            <Field label="진행 단계">
              <Select value={stage} onChange={(event) => setStage(event.target.value as CaseStage)}>
                {caseStageValues.map((value) => (
                  <option key={value} value={value}>
                    {caseStageLabels[value]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="예정일">
              <Input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
            </Field>
            <Field label="제출 마감">
              <Input
                type="date"
                value={filingDeadline}
                onChange={(event) => setFilingDeadline(event.target.value)}
              />
            </Field>
            <Field label="보완 마감">
              <Input
                type="date"
                value={supplementDeadline}
                onChange={(event) => setSupplementDeadline(event.target.value)}
              />
            </Field>
            <Field label="체류 만료일">
              <Input
                type="date"
                value={stayExpirationDate}
                onChange={(event) => setStayExpirationDate(event.target.value)}
              />
            </Field>
            <Field label="내부 마감">
              <Input
                type="date"
                value={internalDeadline}
                onChange={(event) => setInternalDeadline(event.target.value)}
              />
            </Field>
            <Field label="내부 메모">
              <Textarea
                rows={3}
                value={internalMemo}
                onChange={(event) => setInternalMemo(event.target.value)}
              />
            </Field>
            <Field label="상태 변경 메모">
              <Input
                value={logNote}
                onChange={(event) => setLogNote(event.target.value)}
                placeholder="예: 1차 검토 완료 후 제출 대기"
              />
            </Field>
          </FieldGroup>
          <div className="mt-4">
            <Button onClick={handleUpdateStage} disabled={isPending}>
              {isPending ? "저장 중..." : "진행상태 저장"}
            </Button>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="ui-section-title">서류 체크리스트</h3>
        <TableContainer className="mt-4">
          <Table>
            <thead>
              <tr>
                <th>필수</th>
                <th>서류명</th>
                <th>수령</th>
                <th>메모</th>
                <th>첨부파일</th>
              </tr>
            </thead>
            <tbody>
              {caseWorkspace.documents.map((item) => (
                <CaseDocumentRow
                  key={item.id}
                  caseId={caseWorkspace.id}
                  item={item}
                  onSave={handleUpdateDocument}
                  onUploadFile={handleUploadDocumentFile}
                  onSetCurrentFile={handleSetCurrentFile}
                  onUpdateFileNote={handleUpdateFileNote}
                  onDeleteFile={handleDeleteFile}
                  disabled={isPending}
                />
              ))}
            </tbody>
          </Table>
        </TableContainer>
      </Card>

      <Card className="p-6">
        <h3 className="ui-section-title">제출 패키지 관리</h3>
        {!submissionWorkspace ? (
          <p className="ui-section-copy mt-4">제출 패키지 데이터를 불러오는 중입니다.</p>
        ) : (
          <div className="mt-4 space-y-4">
            <Card muted className="ui-stat-card p-4">
              <p className="text-sm text-text-muted">
                필수 수령 현황: {submissionWorkspace.checklist.receivedRequiredCount}/
                {submissionWorkspace.checklist.requiredCount}
              </p>
              <p className="mt-1 text-sm text-text-muted">
                누락 문서:{" "}
                {submissionWorkspace.checklist.missingDocuments.length > 0
                  ? submissionWorkspace.checklist.missingDocuments.join(", ")
                  : "없음"}
              </p>
            </Card>

            <Card muted className="ui-stat-card p-4">
              <p className="text-sm font-semibold text-text-strong">새 제출 패키지 생성</p>
              <FieldGroup className="mt-3">
                <Field label="패키지 라벨">
                  <Input
                    value={newPackageLabel}
                    onChange={(event) => setNewPackageLabel(event.target.value)}
                    placeholder="예: 1차 제출본"
                  />
                </Field>
                <Field label="제출처">
                  <Input
                    value={newPackageSubmittedTo}
                    onChange={(event) => setNewPackageSubmittedTo(event.target.value)}
                    placeholder="예: 서울출입국청"
                  />
                </Field>
                <Field label="상태">
                  <Select
                    value={newPackageStatus}
                    onChange={(event) => setNewPackageStatus(event.target.value as SubmissionPackageStatus)}
                  >
                    {submissionPackageStatusValues.map((status) => (
                      <option key={status} value={status}>
                        {submissionPackageStatusLabels[status]}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="메모">
                  <Textarea
                    rows={2}
                    value={newPackageNote}
                    onChange={(event) => setNewPackageNote(event.target.value)}
                  />
                </Field>
              </FieldGroup>
              <div className="mt-3 grid gap-2 md:grid-cols-2">
                {submissionWorkspace.checklist.submittableDocuments.map((doc) => {
                  const checked = selectedSubmissionDocumentIds.includes(doc.caseDocumentItemId);
                  return (
                    <label
                      key={doc.caseDocumentItemId}
                      className="flex items-start gap-2 rounded-md border border-line bg-surface p-2 text-xs"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(event) => {
                          setSelectedSubmissionDocumentIds((current) =>
                            event.target.checked
                              ? [...current, doc.caseDocumentItemId]
                              : current.filter((id) => id !== doc.caseDocumentItemId)
                          );
                        }}
                        className="mt-0.5 h-4 w-4"
                      />
                      <span>
                        {doc.label} ({doc.currentFilename}, v{doc.currentVersionNumber})
                      </span>
                    </label>
                  );
                })}
              </div>
              <div className="mt-3">
                <Button onClick={handleCreateSubmissionPackage} disabled={isPending}>
                  {isPending ? "처리 중..." : "제출 패키지 생성"}
                </Button>
              </div>
            </Card>

            <div className="space-y-3">
              {submissionWorkspace.submissionPackages.length === 0 ? (
                <EmptyState
                  title="생성된 제출 패키지가 없습니다."
                  description="최신본 파일을 선택해 제출 패키지를 먼저 생성해 주세요."
                />
              ) : (
                submissionWorkspace.submissionPackages.map((pkg) => (
                  <SubmissionPackageCard
                    key={pkg.id}
                    pkg={pkg}
                    disabled={isPending}
                    onSave={handleUpdateSubmissionPackage}
                  />
                ))
              )}
            </div>
          </div>
        )}
      </Card>

      <Card className="p-6">
        <h3 className="ui-section-title">보완 요청 관리</h3>
        {!submissionWorkspace ? (
          <p className="ui-section-copy mt-4">보완 요청 데이터를 불러오는 중입니다.</p>
        ) : (
          <div className="mt-4 space-y-4">
            <Card muted className="ui-stat-card p-4">
              <p className="text-sm font-semibold text-text-strong">보완 요청 등록</p>
              <FieldGroup className="mt-3">
                <Field label="연결 제출 패키지">
                  <Select
                    value={supplementSubmissionPackageId}
                    onChange={(event) => setSupplementSubmissionPackageId(event.target.value)}
                  >
                    <option value="">선택 안 함</option>
                    {submissionWorkspace.submissionPackages.map((pkg) => (
                      <option key={pkg.id} value={pkg.id}>
                        {pkg.packageNumber} ({submissionPackageStatusLabels[pkg.status]})
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="보완 마감일">
                  <Input
                    type="date"
                    value={supplementDueDate}
                    onChange={(event) => setSupplementDueDate(event.target.value)}
                  />
                </Field>
                <Field label="요청기관/담당">
                  <Input
                    value={supplementRequestedBy}
                    onChange={(event) => setSupplementRequestedBy(event.target.value)}
                    placeholder="예: 출입국청 심사관"
                  />
                </Field>
                <Field label="요청 요약">
                  <Input
                    value={supplementSummary}
                    onChange={(event) => setSupplementSummary(event.target.value)}
                    placeholder="예: 체류목적 입증자료 추가 제출"
                  />
                </Field>
                <Field label="메모">
                  <Textarea
                    rows={2}
                    value={supplementNote}
                    onChange={(event) => setSupplementNote(event.target.value)}
                  />
                </Field>
              </FieldGroup>
              <div className="mt-3 grid gap-2 md:grid-cols-2">
                {caseWorkspace.documents.map((doc) => {
                  const checked = selectedSupplementDocumentIds.includes(doc.id);
                  return (
                    <label
                      key={doc.id}
                      className="flex items-start gap-2 rounded-md border border-line bg-surface p-2 text-xs"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(event) => {
                          setSelectedSupplementDocumentIds((current) =>
                            event.target.checked
                              ? [...current, doc.id]
                              : current.filter((id) => id !== doc.id)
                          );
                        }}
                        className="mt-0.5 h-4 w-4"
                      />
                      <span>{doc.label}</span>
                    </label>
                  );
                })}
              </div>
              <div className="mt-3">
                <Button onClick={handleCreateSupplementRequest} disabled={isPending}>
                  {isPending ? "처리 중..." : "보완 요청 등록"}
                </Button>
              </div>
            </Card>

            <div className="space-y-3">
              {submissionWorkspace.supplementRequests.length === 0 ? (
                <EmptyState title="등록된 보완 요청이 없습니다." description="필요 시 보완 요청을 등록해 주세요." />
              ) : (
                submissionWorkspace.supplementRequests.map((request) => (
                  <SupplementRequestCard
                    key={request.id}
                    request={request}
                    disabled={isPending}
                    onSave={handleUpdateSupplementRequest}
                  />
                ))
              )}
            </div>
          </div>
        )}
      </Card>

      <Card className="p-6">
        <h3 className="ui-section-title">고객 안내문 초안 (KO)</h3>
        <div className="mt-4 space-y-4">
          <MessageCard
            title="계약 후 서류 제출 안내"
            text={caseWorkspace.messageDrafts.contractDocumentGuideKo}
            onCopy={() => copyText("계약 후 서류 제출 안내", caseWorkspace.messageDrafts.contractDocumentGuideKo)}
          />
          <MessageCard
            title="누락 서류 재요청 안내"
            text={caseWorkspace.messageDrafts.missingDocumentsRequestKo}
            onCopy={() => copyText("누락 서류 재요청 안내", caseWorkspace.messageDrafts.missingDocumentsRequestKo)}
          />
          <MessageCard
            title="진행현황 변경 안내"
            text={caseWorkspace.messageDrafts.statusUpdateKo}
            onCopy={() => copyText("진행현황 변경 안내", caseWorkspace.messageDrafts.statusUpdateKo)}
          />
          <MessageCard
            title="보완 요청 안내"
            text={caseWorkspace.messageDrafts.supplementRequestKo}
            onCopy={() => copyText("보완 요청 안내", caseWorkspace.messageDrafts.supplementRequestKo)}
          />
          {submissionWorkspace ? (
            <>
              <MessageCard
                title="제출 완료 안내"
                text={submissionWorkspace.messageDrafts.submissionCompletedKo}
                onCopy={() =>
                  copyText("제출 완료 안내", submissionWorkspace.messageDrafts.submissionCompletedKo)
                }
              />
              <MessageCard
                title="보완 요청 수신 안내"
                text={submissionWorkspace.messageDrafts.supplementReceivedKo}
                onCopy={() =>
                  copyText("보완 요청 수신 안내", submissionWorkspace.messageDrafts.supplementReceivedKo)
                }
              />
              <MessageCard
                title="보완 서류 재요청 안내"
                text={submissionWorkspace.messageDrafts.supplementResubmissionKo}
                onCopy={() =>
                  copyText(
                    "보완 서류 재요청 안내",
                    submissionWorkspace.messageDrafts.supplementResubmissionKo
                  )
                }
              />
              <MessageCard
                title="기한 임박 내부 알림"
                text={submissionWorkspace.messageDrafts.deadlineAlertInternalKo}
                onCopy={() =>
                  copyText(
                    "기한 임박 내부 알림",
                    submissionWorkspace.messageDrafts.deadlineAlertInternalKo
                  )
                }
              />
            </>
          ) : null}
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="ui-section-title">최근 진행 이력</h3>
        {caseWorkspace.stageLogs.length === 0 ? (
          <EmptyState title="진행 이력이 없습니다." description="상태 저장 시 이력이 생성됩니다." className="mt-4" />
        ) : (
          <div className="mt-4 space-y-2">
            {caseWorkspace.stageLogs.map((log) => (
              <Card key={log.id} muted className="ui-stat-card p-4 text-sm text-text">
                <p>
                  {log.fromStage ? caseStageLabels[log.fromStage as CaseStage] : "초기"} →{" "}
                  {caseStageLabels[log.toStage as CaseStage]}
                </p>
                <p className="mt-1 text-xs text-text-muted">{new Date(log.createdAt).toLocaleString("ko-KR")}</p>
                {log.note ? <p className="mt-2 text-text-muted">{log.note}</p> : null}
              </Card>
            ))}
          </div>
        )}
      </Card>

      {message ? <StateInline tone={tone}>{message}</StateInline> : null}
    </div>
  );
}

function CaseDocumentRow({
  caseId,
  item,
  onSave,
  onUploadFile,
  onSetCurrentFile,
  onUpdateFileNote,
  onDeleteFile,
  disabled
}: {
  caseId: string;
  item: CaseWorkspaceSnapshot["documents"][number];
  onSave: (id: string, isReceived: boolean, note: string) => Promise<void>;
  onUploadFile: (id: string, file: File, note: string) => Promise<void>;
  onSetCurrentFile: (id: string, fileId: string) => Promise<void>;
  onUpdateFileNote: (id: string, fileId: string, note: string) => Promise<void>;
  onDeleteFile: (id: string, fileId: string) => Promise<void>;
  disabled: boolean;
}) {
  const [isReceived, setIsReceived] = useState(item.isReceived);
  const [note, setNote] = useState(item.note ?? "");
  const [uploadNote, setUploadNote] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setIsReceived(item.isReceived);
    setNote(item.note ?? "");
  }, [item.isReceived, item.note]);

  function clearSelectedFile() {
    setUploadFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  return (
    <tr>
      <td>{item.isRequired ? "필수" : "선택"}</td>
      <td>
        <p className="font-medium text-text-strong">{item.label}</p>
        <p className="mt-1 text-xs text-text-muted">{item.documentType}</p>
      </td>
      <td>
        <label className="flex items-center gap-2 text-sm text-text">
          <input
            type="checkbox"
            checked={isReceived}
            onChange={(event) => setIsReceived(event.target.checked)}
            className="h-4 w-4"
          />
          {isReceived ? "수령" : "미수령"}
        </label>
        <p className="mt-2 text-xs text-text-muted">
          파일 {item.fileCount}건 {item.hasCurrentFile ? "(최신본 있음)" : "(최신본 없음)"}
        </p>
      </td>
      <td>
        <div className="flex gap-2">
          <Input
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="메모"
          />
          <Button
            variant="secondary"
            size="sm"
            disabled={disabled}
            onClick={() => onSave(item.id, isReceived, note)}
          >
            저장
          </Button>
        </div>
      </td>
      <td className="min-w-80">
        <div className="space-y-3">
          <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
            <input
              ref={fileInputRef}
              type="file"
              className="ui-input"
              onChange={(event) => setUploadFile(event.target.files?.[0] ?? null)}
            />
            <Button
              variant="secondary"
              size="sm"
              disabled={disabled || !uploadFile}
              onClick={async () => {
                if (!uploadFile) return;
                await onUploadFile(item.id, uploadFile, uploadNote);
                clearSelectedFile();
                setUploadNote("");
              }}
            >
              업로드
            </Button>
          </div>
          <Input
            value={uploadNote}
            onChange={(event) => setUploadNote(event.target.value)}
            placeholder="업로드 메모 (선택)"
          />

          {item.files.length === 0 ? (
            <p className="text-xs text-text-muted">업로드된 파일이 없습니다.</p>
          ) : (
            <div className="space-y-2">
              {item.files.map((file) => (
                <Card key={file.id} muted className="ui-stat-card p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-text-strong">
                      {file.originalFilename} (v{file.versionNumber})
                    </p>
                    {file.isCurrentVersion ? (
                      <span className="rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-[11px] font-semibold text-sky-700">
                        최신본
                      </span>
                    ) : (
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={disabled}
                        onClick={() => onSetCurrentFile(item.id, file.id)}
                      >
                        최신본 지정
                      </Button>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-text-muted">
                    {formatFileSize(file.size)} · 업로드 {new Date(file.uploadedAt).toLocaleString("ko-KR")}
                  </p>
                  <p className="mt-1 text-xs text-text-muted">메모: {file.note || "-"}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <a
                      href={`/api/admin/cases/${caseId}/documents/${item.id}/files/${file.id}/download`}
                      target="_blank"
                      rel="noreferrer"
                      className="ui-toolbar-button"
                    >
                      다운로드
                    </a>
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={disabled}
                      onClick={async () => {
                        const next = window.prompt("파일 메모를 입력해 주세요.", file.note ?? "");
                        if (next === null) return;
                        await onUpdateFileNote(item.id, file.id, next);
                      }}
                    >
                      메모 저장
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={disabled}
                      onClick={async () => {
                        if (!window.confirm("이 파일을 삭제하시겠습니까?")) return;
                        await onDeleteFile(item.id, file.id);
                      }}
                    >
                      삭제
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </td>
    </tr>
  );
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

function formatDeadlineStatus(
  status: "NONE" | "OK" | "DUE_SOON" | "OVERDUE",
  daysRemaining: number | null
) {
  if (status === "NONE") return "기한 미설정";
  if (status === "OVERDUE") return `기한 경과 (${Math.abs(daysRemaining ?? 0)}일)`;
  if (status === "DUE_SOON") return `기한 임박 (${daysRemaining ?? 0}일 남음)`;
  return daysRemaining === null ? "정상" : `${daysRemaining}일 남음`;
}

function SubmissionPackageCard({
  pkg,
  disabled,
  onSave
}: {
  pkg: SubmissionWorkspaceSnapshot["submissionPackages"][number];
  disabled: boolean;
  onSave: (
    packageId: string,
    input: {
      status?: SubmissionPackageStatus;
      packageLabel?: string;
      submittedTo?: string;
      submittedAt?: string;
      note?: string;
    }
  ) => Promise<void>;
}) {
  const [status, setStatus] = useState<SubmissionPackageStatus>(pkg.status);
  const [packageLabel, setPackageLabel] = useState(pkg.packageLabel ?? "");
  const [submittedTo, setSubmittedTo] = useState(pkg.submittedTo ?? "");
  const [submittedAt, setSubmittedAt] = useState(pkg.submittedAt ? pkg.submittedAt.slice(0, 10) : "");
  const [note, setNote] = useState(pkg.note ?? "");

  useEffect(() => {
    setStatus(pkg.status);
    setPackageLabel(pkg.packageLabel ?? "");
    setSubmittedTo(pkg.submittedTo ?? "");
    setSubmittedAt(pkg.submittedAt ? pkg.submittedAt.slice(0, 10) : "");
    setNote(pkg.note ?? "");
  }, [pkg]);

  return (
    <Card muted className="ui-stat-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-text-strong">{pkg.packageNumber}</p>
        <p className="text-xs text-text-muted">
          {new Date(pkg.createdAt).toLocaleString("ko-KR")} 생성
        </p>
      </div>
      <div className="mt-3 grid gap-2 md:grid-cols-2">
        <Field label="상태">
          <Select value={status} onChange={(event) => setStatus(event.target.value as SubmissionPackageStatus)}>
            {submissionPackageStatusValues.map((value) => (
              <option key={value} value={value}>
                {submissionPackageStatusLabels[value]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="라벨">
          <Input value={packageLabel} onChange={(event) => setPackageLabel(event.target.value)} />
        </Field>
        <Field label="제출처">
          <Input value={submittedTo} onChange={(event) => setSubmittedTo(event.target.value)} />
        </Field>
        <Field label="제출일">
          <Input type="date" value={submittedAt} onChange={(event) => setSubmittedAt(event.target.value)} />
        </Field>
      </div>
      <Field label="메모" className="mt-2">
        <Textarea rows={2} value={note} onChange={(event) => setNote(event.target.value)} />
      </Field>
      <div className="mt-2 text-xs text-text-muted">
        포함 문서: {pkg.items.map((item) => `${item.labelSnapshot}(v${item.versionNumberSnapshot})`).join(", ") || "-"}
      </div>
      <div className="mt-3">
        <Button
          variant="secondary"
          size="sm"
          disabled={disabled}
          onClick={() => onSave(pkg.id, { status, packageLabel, submittedTo, submittedAt, note })}
        >
          저장
        </Button>
      </div>
    </Card>
  );
}

function SupplementRequestCard({
  request,
  disabled,
  onSave
}: {
  request: SubmissionWorkspaceSnapshot["supplementRequests"][number];
  disabled: boolean;
  onSave: (
    requestId: string,
    input: {
      status?: SupplementRequestStatus;
      dueDate?: string;
      summary?: string;
      note?: string;
    }
  ) => Promise<void>;
}) {
  const [status, setStatus] = useState<SupplementRequestStatus>(request.status);
  const [dueDate, setDueDate] = useState(request.dueDate ? request.dueDate.slice(0, 10) : "");
  const [summary, setSummary] = useState(request.summary);
  const [note, setNote] = useState(request.note ?? "");

  useEffect(() => {
    setStatus(request.status);
    setDueDate(request.dueDate ? request.dueDate.slice(0, 10) : "");
    setSummary(request.summary);
    setNote(request.note ?? "");
  }, [request]);

  return (
    <Card muted className="ui-stat-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-text-strong">{request.summary}</p>
        <p className="text-xs text-text-muted">
          {new Date(request.requestedAt).toLocaleString("ko-KR")}
        </p>
      </div>
      <p className="mt-1 text-xs text-text-muted">
        연결 패키지: {request.submissionPackageNumber ?? "-"}
      </p>
      <div className="mt-3 grid gap-2 md:grid-cols-2">
        <Field label="상태">
          <Select value={status} onChange={(event) => setStatus(event.target.value as SupplementRequestStatus)}>
            {supplementRequestStatusValues.map((value) => (
              <option key={value} value={value}>
                {supplementRequestStatusLabels[value]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="보완 마감일">
          <Input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
        </Field>
      </div>
      <Field label="요약" className="mt-2">
        <Input value={summary} onChange={(event) => setSummary(event.target.value)} />
      </Field>
      <Field label="메모" className="mt-2">
        <Textarea rows={2} value={note} onChange={(event) => setNote(event.target.value)} />
      </Field>
      <div className="mt-2 text-xs text-text-muted">
        관련 문서: {request.relatedItems.map((item) => item.labelSnapshot).join(", ") || "-"}
      </div>
      <div className="mt-3">
        <Button
          variant="secondary"
          size="sm"
          disabled={disabled}
          onClick={() => onSave(request.id, { status, dueDate, summary, note })}
        >
          저장
        </Button>
      </div>
    </Card>
  );
}

function MessageCard({
  title,
  text,
  onCopy
}: {
  title: string;
  text: string;
  onCopy: () => Promise<void>;
}) {
  return (
    <Card muted className="ui-stat-card p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-text-strong">{title}</p>
        <Button size="sm" variant="secondary" className="ui-toolbar-button" onClick={onCopy}>
          복사
        </Button>
      </div>
      <pre className="mt-3 whitespace-pre-wrap text-sm text-text">{text}</pre>
    </Card>
  );
}
