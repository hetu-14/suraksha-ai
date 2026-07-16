import { Bill, Customer } from "./types";
import { inr } from "./billExplain";

// Clean customer-facing bill PDF — Torrent Gas branding, no AI analysis.
// jsPDF is imported dynamically so it never lands in the server bundle.

async function loadLogo(): Promise<string | null> {
  try {
    const res = await fetch("/torrent-gas-logo.png");
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const r = new FileReader();
      r.onloadend = () => resolve(r.result as string);
      r.onerror = () => resolve(null);
      r.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export async function downloadBillPdf(customer: Customer, bill: Bill) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 42;

  const navy: [number, number, number] = [22, 53, 126];
  const green: [number, number, number] = [90, 168, 50];
  const ink: [number, number, number] = [30, 41, 59];
  const slate: [number, number, number] = [110, 123, 145];

  // Top accent
  doc.setFillColor(...navy);
  doc.rect(0, 0, W, 6, "F");

  // Logo (or themed wordmark fallback)
  const logo = await loadLogo();
  if (logo) {
    doc.addImage(logo, "PNG", M, 30, 90, 31); // 164x56 aspect
  } else {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.setTextColor(...navy);
    doc.text("TORRENT", M, 55);
    const tw = doc.getTextWidth("TORRENT");
    doc.setTextColor(...green);
    doc.text("GAS", M + tw + 6, 55);
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(...ink);
  doc.text("GAS BILL", W - M, 46, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...slate);
  doc.text("PNG Tax Invoice", W - M, 60, { align: "right" });
  doc.text(`Invoice: ${invoiceNo(customer, bill)}`, W - M, 72, { align: "right" });

  let y = 92;
  doc.setDrawColor(...navy);
  doc.setLineWidth(0.6);
  doc.line(M, y, W - M, y);

  // Billed-to / connection
  y += 22;
  doc.setFontSize(8);
  doc.setTextColor(...slate);
  doc.text("BILLED TO", M, y);
  doc.text("CONNECTION DETAILS", W / 2, y);
  y += 15;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...ink);
  doc.text(customer.name, M, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...slate);
  doc.text(`A/C: ${customer.accountNo}`, M, y + 14);
  doc.text(customer.area, M, y + 27, { maxWidth: W / 2 - M - 10 });

  doc.text(`Meter no: ${customer.meterNo ?? "-"}`, W / 2, y);
  doc.text(`Category: ${cap(customer.type)}`, W / 2, y + 14);
  doc.text(`Billing cycle: ${bill.cycleLabel}`, W / 2, y + 27);
  doc.text(
    `Period: ${fmtDate(bill.periodStart)} to ${fmtDate(bill.periodEnd)}`,
    W / 2,
    y + 40
  );

  // Meter reading summary
  y += 66;
  doc.setFillColor(244, 247, 251);
  doc.roundedRect(M, y, W - 2 * M, 34, 4, 4, "F");
  doc.setFontSize(8);
  doc.setTextColor(...slate);
  const cols = [M + 14, M + (W - 2 * M) * 0.32, M + (W - 2 * M) * 0.6, M + (W - 2 * M) * 0.82];
  ["OPENING", "CLOSING", "CONSUMPTION", "RATE"].forEach((h, i) => doc.text(h, cols[i], y + 13));
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...ink);
  doc.text(`${bill.openingReading}`, cols[0], y + 27);
  doc.text(`${bill.closingReading}`, cols[1], y + 27);
  doc.text(`${bill.unitsScm} SCM`, cols[2], y + 27);
  doc.text(`${inr(bill.ratePerScm)}/SCM`, cols[3], y + 27);
  doc.setFont("helvetica", "normal");

  // Charges table
  y += 54;
  doc.setFillColor(...navy);
  doc.rect(M, y, W - 2 * M, 24, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.text("DESCRIPTION", M + 12, y + 16);
  doc.text("AMOUNT", W - M - 12, y + 16, { align: "right" });
  y += 24;

  const rows: [string, string][] = [
    [`Gas consumption charge (${bill.unitsScm} SCM @ ${inr(bill.ratePerScm)}/SCM)`, inr(bill.gasCharge)],
    ["Fixed / service charge", inr(bill.fixedCharge)],
  ];
  if (bill.tax) rows.push(["Taxes & duties", inr(bill.tax)]);
  if (bill.arrears) rows.push(["Arrears carried forward", inr(bill.arrears)]);
  if (bill.lateFee) rows.push(["Late payment fee", inr(bill.lateFee)]);

  doc.setTextColor(...ink);
  doc.setFontSize(10);
  rows.forEach(([label, amt]) => {
    y += 24;
    doc.text(label, M + 12, y);
    doc.text(amt, W - M - 12, y, { align: "right" });
    doc.setDrawColor(235, 240, 246);
    doc.line(M, y + 8, W - M, y + 8);
  });

  // Total band
  y += 28;
  doc.setFillColor(...green);
  doc.rect(M, y, W - 2 * M, 32, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("TOTAL PAYABLE", M + 12, y + 21);
  doc.text(inr(bill.amount), W - M - 12, y + 21, { align: "right" });

  // Status / due
  y += 48;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(...ink);
  if (bill.status === "paid") {
    doc.text(`Status: PAID${bill.paidOn ? ` on ${fmtDate(bill.paidOn)}` : ""}`, M, y);
  } else {
    doc.text(`Status: ${bill.status.toUpperCase()}`, M, y);
    if (bill.dueDate) doc.text(`Due date: ${fmtDate(bill.dueDate)}`, W - M, y, { align: "right" });
  }

  // Footer
  doc.setDrawColor(...navy);
  doc.line(M, H - 58, W - M, H - 58);
  doc.setFontSize(8);
  doc.setTextColor(...slate);
  doc.text("Torrent Gas · Piped Natural Gas", M, H - 42);
  doc.text("Customer care: 1906 (24x7 emergency)", M, H - 30);
  doc.text("This is a computer-generated invoice.", W - M, H - 30, { align: "right" });

  doc.save(`TorrentGas_${customer.accountNo}_${bill.cycleLabel.replace(/[^\w]+/g, "_")}.pdf`);
}

function invoiceNo(c: Customer, b: Bill) {
  return `${c.accountNo}/${b.periodEnd.slice(0, 7).replace("-", "")}`;
}
function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}
