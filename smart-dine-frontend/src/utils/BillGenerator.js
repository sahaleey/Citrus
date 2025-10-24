import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import dayjs from "dayjs";

/**
 * Generates a PDF bill for one or multiple orders.
 * @param {Array|Object} orders - Single order object or array of orders
 */
export const generateBillPDF = (orders) => {
  if (!orders || (Array.isArray(orders) && orders.length === 0)) {
    console.error("Failed to generate PDF: No orders provided.");
    return;
  }

  // Ensure we always have an array
  const orderArray = Array.isArray(orders) ? orders : [orders];
  const doc = new jsPDF();

  let startY = 20;

  orderArray.forEach((order, index) => {
    // --- Header ---
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("Citrus Restaurant", 105, startY, { align: "center" });

    // --- Subtitle ---
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text("Thank you for your order!", 105, startY + 8, { align: "center" });

    // --- Order Details ---
    doc.setFontSize(10);
    doc.text(`Table: ${order.tableId}`, 20, startY + 20);
    doc.text(`Order ID: ${order._id}`, 20, startY + 25);
    doc.text(
      `Date: ${dayjs(order.createdAt).format("DD/MM/YYYY h:mm A")}`,
      190,
      startY + 25,
      { align: "right" }
    );

    // --- Grand Total ---
    const grandTotal = (order.items || []).reduce(
      (sum, item) => sum + (item.price || 0) * (item.quantity || 0),
      0
    );

    // --- Items Table ---
    const tableColumn = ["Item", "Quantity", "Price", "Total"];
    const tableRows = (order.items || []).map((item) => [
      item.name || "-",
      item.quantity || 0,
      `₹${(item.price || 0).toFixed(2)}`,
      `₹${((item.price || 0) * (item.quantity || 0)).toFixed(2)}`,
    ]);

    // Add total row
    tableRows.push([
      {
        content: "Total Price",
        colSpan: 3,
        styles: { halign: "right", fontStyle: "bold" },
      },
      { content: `₹${grandTotal.toFixed(2)}`, styles: { fontStyle: "bold" } },
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: startY + 30,
      headStyles: {
        fillColor: [57, 156, 108],
        textColor: 255,
        fontStyle: "bold",
      },
      bodyStyles: { fontSize: 10 },
    });

    // --- Footer ---
    const finalY = doc.previousAutoTable
      ? doc.previousAutoTable.finalY + 10
      : startY + 70;
    doc.setFontSize(10);
    doc.text("Come back soon!", 105, doc.internal.pageSize.height - 10, {
      align: "center",
    });

    // Add page break if not last order
    if (index < orderArray.length - 1) {
      doc.addPage();
      startY = 20;
    }
  });

  // --- Save PDF ---
  const firstOrder = orderArray[0];
  doc.save(`bill-table-${firstOrder.tableId}-${firstOrder._id.slice(-4)}.pdf`);
};
