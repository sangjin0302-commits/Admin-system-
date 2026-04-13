export function generateSubmissionPackageNumber(caseNumber: string, sequence: number) {
  const safeSequence = Math.max(1, sequence);
  return `${caseNumber}-SUB-${String(safeSequence).padStart(3, "0")}`;
}
