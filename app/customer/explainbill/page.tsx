import BillsView from "@/components/BillsView";
import { getCustomersWithBills, usingLiveDb } from "@/lib/bills";

export const dynamic = "force-dynamic";

export default async function ExplainBillPage() {
  const customers = await getCustomersWithBills();
  return <BillsView customers={customers} live={usingLiveDb} />;
}
