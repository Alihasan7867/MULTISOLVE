import React, { useRef } from 'react';
import { X, Printer, Download, CheckCircle2, AlertCircle } from 'lucide-react';
import { Sale } from '../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface InvoiceViewModalProps {
  sale: Sale;
  onClose: () => void;
}

export const InvoiceViewModal: React.FC<InvoiceViewModalProps> = ({ sale, onClose }) => {
  const invoiceRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    const doc = new jsPDF();

    // Brand Header
    doc.setFillColor(23, 77, 64); // #174D40
    doc.rect(0, 0, 210, 30, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('MULTISOLVE TAX INVOICE', 14, 20);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Invoice No: ${sale.invoiceNumber}`, 145, 15);
    doc.text(`Date: ${new Date(sale.date).toLocaleDateString('en-IN')}`, 145, 22);

    // Bill To & Seller
    doc.setTextColor(23, 23, 23);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Billed To (Customer):', 14, 42);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(sale.customer.name, 14, 48);
    doc.text(`Phone: ${sale.customer.phone}`, 14, 54);
    if (sale.customer.gstin) doc.text(`GSTIN: ${sale.customer.gstin}`, 14, 60);
    if (sale.customer.address) doc.text(`Address: ${sale.customer.address}, ${sale.customer.city || ''}`, 14, 66);

    // Items Table
    const tableRows = sale.items.map((item, idx) => [
      idx + 1,
      item.product?.name || item.description || 'Item',
      item.product?.hsnCode || '8471',
      item.quantity,
      `₹${item.unitPrice.toLocaleString('en-IN')}`,
      `₹${item.discount.toLocaleString('en-IN')}`,
      `${item.taxRate}%`,
      `₹${item.totalAmount.toLocaleString('en-IN')}`,
    ]);

    autoTable(doc, {
      startY: 75,
      head: [['#', 'Item Description', 'HSN/SAC', 'Qty', 'Unit Price', 'Discount', 'GST %', 'Total Amount']],
      body: tableRows,
      headStyles: { fillColor: [23, 77, 64], textColor: 255 },
      theme: 'grid',
    });

    const finalY = (doc as any).lastAutoTable.finalY + 10;

    // Totals Box
    doc.setFontSize(10);
    doc.text(`Subtotal: ₹${sale.subtotal.toLocaleString('en-IN')}`, 130, finalY);
    doc.text(`Total Discount: ₹${sale.discount.toLocaleString('en-IN')}`, 130, finalY + 6);
    doc.text(`GST Amount: ₹${sale.taxAmount.toLocaleString('en-IN')}`, 130, finalY + 12);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(23, 77, 64);
    doc.text(`Grand Total: ₹${sale.grandTotal.toLocaleString('en-IN')}`, 130, finalY + 20);

    doc.setFontSize(9);
    doc.setTextColor(146, 146, 146);
    doc.text('Thank you for your business! This is a computer generated invoice by MULTISOLVE.', 14, finalY + 35);

    doc.save(`${sale.invoiceNumber}.pdf`);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-[#EAEAEA] relative my-8">
        {/* Actions bar (hidden during print) */}
        <div className="flex items-center justify-between pb-6 border-b border-[#EAEAEA] print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-[#171717]">Tax Invoice</span>
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                sale.paymentStatus === 'PAID'
                  ? 'bg-[#E8F8DE] text-[#174D40]'
                  : sale.paymentStatus === 'PARTIAL'
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-red-50 text-[#F87171]'
              }`}
            >
              {sale.paymentStatus}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#EAEAEA] text-xs font-semibold text-[#171717] hover:bg-[#F5F5F5] transition-colors"
            >
              <Printer size={15} /> Print
            </button>
            <button
              onClick={handleDownloadPdf}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#174D40] text-white text-xs font-semibold hover:bg-[#133E34] transition-colors"
            >
              <Download size={15} className="text-[#98E66B]" /> Download PDF
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-[#929292] hover:text-[#171717] hover:bg-[#F5F5F5]"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Printable Invoice Container */}
        <div ref={invoiceRef} className="py-6 space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#174D40] flex items-center justify-center text-[#98E66B] font-bold text-sm">
                  M
                </div>
                <span className="font-extrabold text-xl tracking-tight text-[#171717]">
                  MULTI<span className="text-[#174D40]">SOLVE</span>
                </span>
              </div>
              <p className="text-xs text-[#929292] mt-1">Unified Business Management Platform</p>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-2xl font-black text-[#174D40] tracking-tight">TAX INVOICE</span>
              <div className="text-xs text-[#929292] mt-1">
                <div><span className="font-semibold text-[#171717]">Invoice #:</span> {sale.invoiceNumber}</div>
                <div><span className="font-semibold text-[#171717]">Date:</span> {new Date(sale.date).toLocaleDateString('en-IN')}</div>
                <div><span className="font-semibold text-[#171717]">Payment Method:</span> {sale.paymentMethod}</div>
              </div>
            </div>
          </div>

          {/* Customer & Billing info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-[#F5F5F5] rounded-2xl text-xs">
            <div>
              <div className="font-bold text-[#171717] uppercase tracking-wider text-[11px] mb-1">
                Billed To (Customer)
              </div>
              <p className="font-semibold text-[#171717] text-sm">{sale.customer.name}</p>
              <p className="text-[#929292] mt-0.5">{sale.customer.phone}</p>
              {sale.customer.email && <p className="text-[#929292]">{sale.customer.email}</p>}
              {sale.customer.gstin && (
                <p className="text-[#174D40] font-semibold mt-1">GSTIN: {sale.customer.gstin}</p>
              )}
            </div>

            <div className="sm:text-right">
              <div className="font-bold text-[#171717] uppercase tracking-wider text-[11px] mb-1">
                Billing Details
              </div>
              <p className="text-[#929292]">Type: {sale.customer.customerType}</p>
              <p className="text-[#929292]">
                Place of Supply: {sale.isInterState ? 'Inter-State (IGST)' : 'Intra-State (CGST + SGST)'}
              </p>
              {sale.dueDate && (
                <p className="text-[#171717] font-medium mt-1">
                  Due Date: {new Date(sale.dueDate).toLocaleDateString('en-IN')}
                </p>
              )}
            </div>
          </div>

          {/* Line items table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#174D40] text-white">
                <tr>
                  <th className="p-3 rounded-l-xl">#</th>
                  <th className="p-3">Item & Description</th>
                  <th className="p-3 text-center">HSN</th>
                  <th className="p-3 text-center">Qty</th>
                  <th className="p-3 text-right">Price</th>
                  <th className="p-3 text-right">Discount</th>
                  <th className="p-3 text-right">Tax</th>
                  <th className="p-3 text-right rounded-r-xl">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAEAEA]">
                {sale.items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-[#F5F5F5]">
                    <td className="p-3 text-[#929292]">{idx + 1}</td>
                    <td className="p-3 font-semibold text-[#171717]">
                      {item.product?.name || item.description}
                    </td>
                    <td className="p-3 text-center text-[#929292]">{item.product?.hsnCode || '8471'}</td>
                    <td className="p-3 text-center font-bold">{item.quantity}</td>
                    <td className="p-3 text-right text-[#929292]">
                      ₹{item.unitPrice.toLocaleString('en-IN')}
                    </td>
                    <td className="p-3 text-right text-[#929292]">
                      ₹{item.discount.toLocaleString('en-IN')}
                    </td>
                    <td className="p-3 text-right text-[#929292]">
                      ₹{item.taxAmount.toLocaleString('en-IN')} ({item.taxRate}%)
                    </td>
                    <td className="p-3 text-right font-bold text-[#171717]">
                      ₹{item.totalAmount.toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Financial Totals */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pt-4 border-t border-[#EAEAEA]">
            <div className="text-xs text-[#929292] max-w-sm">
              <p className="font-semibold text-[#171717] mb-1">Notes & Terms:</p>
              <p>{sale.notes || 'Thank you for your business. Payment received with thanks.'}</p>
            </div>

            <div className="w-full sm:w-64 space-y-2 text-xs">
              <div className="flex justify-between text-[#929292]">
                <span>Subtotal:</span>
                <span className="font-semibold text-[#171717]">₹{sale.subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-[#929292]">
                <span>Total Discount:</span>
                <span className="font-semibold text-[#171717]">-₹{sale.discount.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-[#929292]">
                <span>GST Tax:</span>
                <span className="font-semibold text-[#171717]">₹{sale.taxAmount.toLocaleString('en-IN')}</span>
              </div>
              <div className="border-t border-[#EAEAEA] pt-2 flex justify-between text-base font-extrabold text-[#174D40]">
                <span>Grand Total:</span>
                <span>₹{sale.grandTotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-xs text-[#929292] pt-1">
                <span>Amount Paid:</span>
                <span className="font-semibold text-[#171717]">₹{sale.amountReceived.toLocaleString('en-IN')}</span>
              </div>
              {sale.remainingBalance > 0 && (
                <div className="flex justify-between text-xs font-bold text-[#F87171]">
                  <span>Balance Due:</span>
                  <span>₹{sale.remainingBalance.toLocaleString('en-IN')}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
