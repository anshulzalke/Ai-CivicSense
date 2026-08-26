import React from "react";
import ReactDOM from "react-dom/client";
import { QRCodeCanvas } from "qrcode.react";
import { jsPDF } from "jspdf";
import { getImageUrl } from "./api";

/**
 * Generates an off-screen QR Code Data URL from text
 */
async function generateQRCodeDataUrl(text) {
  return new Promise((resolve) => {
    try {
      const div = document.createElement("div");
      div.style.position = "fixed";
      div.style.left = "-9999px";
      div.style.top = "-9999px";
      document.body.appendChild(div);

      const root = ReactDOM.createRoot(div);
      root.render(
        React.createElement(QRCodeCanvas, {
          value: text || "CVX-PORTAL",
          size: 200,
          level: "H",
          includeMargin: true,
        })
      );


      setTimeout(() => {
        try {
          const canvas = div.querySelector("canvas");
          const dataUrl = canvas ? canvas.toDataURL("image/png") : null;
          root.unmount();
          if (div.parentNode) document.body.removeChild(div);
          resolve(dataUrl);
        } catch {
          resolve(null);
        }
      }, 60);
    } catch {
      resolve(null);
    }
  });
}

/**
 * Loads an image URL into a base64 Data URL for jsPDF embedding
 */
async function loadImageDataUrl(url) {
  if (!url) return null;
  const fullUrl = getImageUrl(url);
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = fullUrl;
  });
}

/**
 * Generates and downloads the Official Grievance Acknowledgement PDF Receipt
 */
export async function downloadPDFReceipt(complaint, citizenUser = null) {
  if (!complaint) return;

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;

  // Colors
  const deepNavy = [22, 35, 61]; // #16233D
  const gold = [232, 163, 61]; // #E8A33D
  const lightPaper = [247, 245, 239]; // #F7F5EF
  const slateText = [91, 100, 114]; // #5B6472
  const borderGray = [220, 226, 237]; // #DCE2ED
  const mossGreen = [76, 122, 94]; // #4C7A5E

  // 1. Top Decorative Government Header Bar
  doc.setFillColor(...deepNavy);
  doc.rect(0, 0, pageWidth, 28, "F");

  doc.setFillColor(...gold);
  doc.rect(0, 28, pageWidth, 2, "F");

  // Header Title
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("PUNE MUNICIPAL GRIEVANCE REDRESSAL SYSTEM", margin, 12);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(232, 163, 61);
  doc.text("AI CivicSense · Open Governance Portal (PMC · PCMC · PMRDA)", margin, 18);

  const issuedDate = new Date().toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "medium",
    timeStyle: "short",
  });

  doc.setFontSize(7.5);
  doc.setTextColor(200, 210, 225);
  doc.text(`Official Slip Issued: ${issuedDate} IST`, margin, 24);

  // 2. Receipt Banner / Document Header
  let y = 38;

  doc.setFillColor(...lightPaper);
  doc.roundedRect(margin, y, contentWidth, 38, 3, 3, "F");
  doc.setDrawColor(...borderGray);
  doc.roundedRect(margin, y, contentWidth, 38, 3, 3, "D");

  // Generate and embed QR Code
  const qrUrl = `https://civicsense.pune.gov.in/track?token=${complaint.token}`;
  const qrDataUrl = await generateQRCodeDataUrl(qrUrl);
  if (qrDataUrl) {
    doc.addImage(qrDataUrl, "PNG", margin + 4, y + 4, 30, 30);
  }

  // Token & Grievance ID Block
  const textX = margin + 38;
  doc.setTextColor(...deepNavy);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("OFFICIAL GRIEVANCE TOKEN ID", textX, y + 9);

  doc.setFontSize(16);
  doc.setTextColor(...deepNavy);
  doc.text(complaint.token || "CVX-2026-000000", textX, y + 17);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...slateText);
  doc.text("Category:", textX, y + 24);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...deepNavy);
  doc.text((complaint.category || "General").toUpperCase(), textX + 16, y + 24);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(...slateText);
  doc.text("Severity:", textX + 55, y + 24);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...deepNavy);
  doc.text(`Level ${complaint.severity || 3} / 5`, textX + 70, y + 24);

  // Status & SLA Badges on the right
  const statusX = margin + contentWidth - 48;
  doc.setFillColor(...deepNavy);
  doc.roundedRect(statusX, y + 6, 42, 11, 2, 2, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.text(
    (complaint.status || "SUBMITTED").replace(/_/g, " ").toUpperCase(),
    statusX + 21,
    y + 13.5,
    { align: "center" }
  );

  doc.setFillColor(254, 243, 199);
  doc.roundedRect(statusX, y + 20, 42, 11, 2, 2, "F");
  doc.setTextColor(146, 64, 14);
  doc.setFontSize(7);
  doc.text("48-HOUR SLA WINDOW", statusX + 21, y + 27, { align: "center" });

  y += 46;

  // 3. Citizen & Jurisdiction Information Table
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...deepNavy);
  doc.text("1. CITIZEN & JURISDICTION DETAILS", margin, y);
  y += 4;

  const rowHeight = 8.5;
  const col1 = margin;
  const col2 = margin + 55;
  const col3 = margin + 110;
  const col4 = margin + 155;

  const citizenName = citizenUser?.name || "Registered Pune Citizen";
  const citizenGovId = citizenUser?.govId || citizenUser?.gov_id || "GOV-VERIFIED-AUTH";
  const citizenWard = citizenUser?.ward || "Wagholi / Pune District";
  const lat = Number(complaint.lat || 18.5204).toFixed(5);
  const lng = Number(complaint.lng || 73.8567).toFixed(5);

  const citizenData = [
    [
      { label: "Complainant Name", val: citizenName },
      { label: "Govt ID (Masked)", val: citizenGovId },
    ],
    [
      { label: "Ward / Locality", val: citizenWard },
      { label: "GPS Coordinates", val: `${lat}° N, ${lng}° E` },
    ],
    [
      { label: "Municipal Authority", val: "PMC / PMRDA Pune District" },
      { label: "Filing Timestamp", val: issuedDate },
    ],
  ];

  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(...borderGray);
  doc.roundedRect(margin, y, contentWidth, citizenData.length * rowHeight + 4, 2, 2, "FD");

  citizenData.forEach((row, rIdx) => {
    const curY = y + 6 + rIdx * rowHeight;
    // Item 1
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...slateText);
    doc.text(row[0].label + ":", col1 + 4, curY);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...deepNavy);
    doc.text(row[0].val, col2, curY);

    // Item 2
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...slateText);
    doc.text(row[1].label + ":", col3, curY);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...deepNavy);
    doc.text(row[1].val, col4, curY);
  });

  y += citizenData.length * rowHeight + 10;

  // 4. Grievance Description & Evidence Section
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...deepNavy);
  doc.text("2. GRIEVANCE PARTICULARS & PHOTO EVIDENCE", margin, y);
  y += 4;

  const descBoxHeight = 55;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(...borderGray);
  doc.roundedRect(margin, y, contentWidth, descBoxHeight, 2, 2, "FD");

  // Grievance Title & Description
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...deepNavy);
  doc.text(complaint.title || "Civic Grievance Report", margin + 4, y + 7);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...slateText);
  const descLines = doc.splitTextToSize(
    complaint.description || "No additional description was provided at the time of submission.",
    contentWidth - 65
  );
  doc.text(descLines, margin + 4, y + 14);

  // Evidence Thumbnail Box on Right
  const imgBoxX = margin + contentWidth - 54;
  const imgBoxY = y + 4;
  const imgBoxW = 50;
  const imgBoxH = 46;

  doc.setDrawColor(...borderGray);
  doc.setFillColor(...lightPaper);
  doc.roundedRect(imgBoxX, imgBoxY, imgBoxW, imgBoxH, 2, 2, "FD");

  const evidenceImg = complaint.imageUrl || complaint.image_url || complaint.image;
  const imgDataUrl = await loadImageDataUrl(evidenceImg);

  if (imgDataUrl) {
    try {
      doc.addImage(imgDataUrl, "JPEG", imgBoxX + 2, imgBoxY + 2, imgBoxW - 4, imgBoxH - 12);
    } catch {
      doc.setFontSize(7);
      doc.setTextColor(...slateText);
      doc.text("Evidence Photo", imgBoxX + imgBoxW / 2, imgBoxY + 20, { align: "center" });
    }
  } else {
    doc.setFontSize(7);
    doc.setTextColor(...slateText);
    doc.text("Evidence Image", imgBoxX + imgBoxW / 2, imgBoxY + 20, { align: "center" });
    doc.text("Attached to Portal", imgBoxX + imgBoxW / 2, imgBoxY + 25, { align: "center" });
  }

  // Watermark on evidence
  doc.setFillColor(...deepNavy);
  doc.rect(imgBoxX + 2, imgBoxY + imgBoxH - 8, imgBoxW - 4, 6, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(5.5);
  doc.setFont("helvetica", "bold");
  doc.text("AI VERIFIED EVIDENCE", imgBoxX + imgBoxW / 2, imgBoxY + imgBoxH - 4, {
    align: "center",
  });

  y += descBoxHeight + 8;

  // 5. Automated SLA & Escalation Rules
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...deepNavy);
  doc.text("3. MUNICIPAL 48-HOUR SERVICE LEVEL AGREEMENT (SLA)", margin, y);
  y += 4;

  const slaBoxHeight = 36;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(...borderGray);
  doc.roundedRect(margin, y, contentWidth, slaBoxHeight, 2, 2, "FD");

  const slaRules = [
    "• Level 1: Field inspection crew and junior engineer assigned immediately upon filing.",
    "• Level 2: Auto-escalation to Zonal Executive Engineer if unresolved within 48 hours.",
    "• Level 3: Auto-escalation to Additional Municipal Commissioner after 96 hours.",
    "• Citizen Reward: +25 Civic Coins awarded upon successful resolution confirmation.",
  ];

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...slateText);
  slaRules.forEach((rule, idx) => {
    doc.text(rule, margin + 4, y + 7 + idx * 7);
  });

  y += slaBoxHeight + 8;

  // 6. Official Digital Signature Stamp & Helpline Footer
  doc.setDrawColor(...borderGray);
  doc.line(margin, pageHeight - 32, margin + contentWidth, pageHeight - 32);

  // Digital Sign Stamp on Right
  doc.setDrawColor(...mossGreen);
  doc.setLineWidth(0.6);
  doc.roundedRect(margin + contentWidth - 46, pageHeight - 29, 46, 18, 2, 2, "D");
  doc.setTextColor(...mossGreen);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  doc.text("PMC DIGITAL SIGNATURE", margin + contentWidth - 23, pageHeight - 24, {
    align: "center",
  });
  doc.setFontSize(5.5);
  doc.setFont("helvetica", "normal");
  doc.text("VERIFIED & AUTHENTICATED", margin + contentWidth - 23, pageHeight - 19, {
    align: "center",
  });
  doc.text(issuedDate.split(",")[0], margin + contentWidth - 23, pageHeight - 14, {
    align: "center",
  });

  // Footer Details on Left
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...deepNavy);
  doc.text("Pune Municipal Corporation · Citizen Support Helpline: 1800-103-0222", margin, pageHeight - 24);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(...slateText);
  doc.text(
    "This is a computer-generated digital receipt issued under Maharashtra Public Services Guarantee Act.",
    margin,
    pageHeight - 19
  );
  doc.text(
    "Track live grievance status anytime at: https://civicsense.pune.gov.in using your Token ID.",
    margin,
    pageHeight - 14
  );

  // Save the document
  const fileName = `CivicSense-Receipt-${complaint.token || "Acknowledgement"}.pdf`;
  doc.save(fileName);
}
