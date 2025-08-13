import React from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export default function DownloadPDFButton({ pages, roomId }) {
  const handleDownloadPDF = async () => {
    if (!pages || pages.length === 0) {
      alert("No whiteboard pages to export.");
      return;
    }
    const pdf = new jsPDF({ orientation: "landscape", unit: "px", format: "a4" });
    let added = 0;
    for (let i = 0; i < pages.length; i++) {
      const pageId = `${roomId}-page-${pages[i]}`;
      const canvas = document.querySelector(`#whiteboard-canvas-${pageId}`);
      if (!canvas || canvas.width === 0 || canvas.height === 0) continue;
      const imgData = await html2canvas(canvas).then(canvasEl => canvasEl.toDataURL("image/png"));
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      pdf.addImage(imgData, "PNG", 0, 0, pageWidth, pageHeight);
      if (added < pages.length - 1) pdf.addPage();
      added++;
    }
    if (added === 0) {
      alert("No whiteboard pages are loaded to export. Please visit each page before downloading.");
      return;
    }
    pdf.save("whiteboard.pdf");
  };

  return (
    <button
      className="px-3 py-1.5 rounded-full bg-gray-100 border border-gray-300 text-gray-700 font-semibold shadow-sm hover:bg-gray-200 transition-all text-xs focus:outline-none focus:ring-2 focus:ring-gray-200"
      onClick={handleDownloadPDF}
      title="Download all whiteboard pages as PDF"
    >
      Download
    </button>
  );
}
