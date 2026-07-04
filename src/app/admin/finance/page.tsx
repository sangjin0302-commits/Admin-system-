import FinanceClient from "./finance-client";

export const dynamic = "force-dynamic";

export default function FinancePage() {
  const now = new Date();
  return <FinanceClient initialYear={now.getUTCFullYear()} initialMonth={now.getUTCMonth() + 1} />;
}
