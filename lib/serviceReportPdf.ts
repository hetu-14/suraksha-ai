type ServiceReport = {
  appointmentId: string;
  service: string;
  date: string;
  engineer: string;
  findings: string;
};

// Keep the report generation client-only so the PDF dependency is not part of the server bundle.
export async function downloadServiceReportPdf(report: ServiceReport) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();
  const margin = 42;
  const navy: [number, number, number] = [15, 42, 75];
  const green: [number, number, number] = [22, 163, 74];
  const ink: [number, number, number] = [30, 41, 59];
  const slate: [number, number, number] = [100, 116, 139];

  doc.setFillColor(...navy);
  doc.rect(0, 0, width, 8, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(...navy);
  doc.text("TORRENT", margin, 52);
  const wordWidth = doc.getTextWidth("TORRENT");
  doc.setTextColor(...green);
  doc.text("GAS", margin + wordWidth + 6, 52);

  doc.setTextColor(...ink);
  doc.setFontSize(16);
  doc.text("DIGITAL SERVICE REPORT", width - margin, 48, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...slate);
  doc.text(`Report ID: ${report.appointmentId}`, width - margin, 63, { align: "right" });

  doc.setDrawColor(203, 213, 225);
  doc.line(margin, 84, width - margin, 84);
  doc.setFontSize(9);
  doc.setTextColor(...slate);
  doc.text("SERVICE", margin, 110);
  doc.text("VISIT DATE", width / 2, 110);
  doc.text("ENGINEER", margin, 162);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...ink);
  doc.text(report.service, margin, 128);
  doc.text(report.date, width / 2, 128);
  doc.text(report.engineer, margin, 180);

  doc.setFillColor(240, 253, 244);
  doc.roundedRect(margin, 208, width - margin * 2, 138, 8, 8, "F");
  doc.setFontSize(10);
  doc.setTextColor(...green);
  doc.text("INSPECTION FINDINGS", margin + 18, 235);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.setTextColor(...ink);
  const findings = doc.splitTextToSize(report.findings, width - margin * 2 - 36);
  doc.text(findings, margin + 18, 260);

  doc.setFontSize(10);
  doc.setTextColor(...slate);
  doc.text("Safety reminder", margin, 390);
  doc.setFontSize(11);
  doc.setTextColor(...ink);
  doc.text("If you smell gas, close the isolation valve, open windows, and call 1906 immediately.", margin, 410);
  doc.setDrawColor(203, 213, 225);
  doc.line(margin, height - 58, width - margin, height - 58);
  doc.setFontSize(8);
  doc.setTextColor(...slate);
  doc.text("Torrent Gas · Piped Natural Gas · Customer service record", margin, height - 38);
  doc.text("This is a computer-generated service report.", width - margin, height - 38, { align: "right" });
  doc.save(`TorrentGas_${report.appointmentId}_service-report.pdf`);
}
