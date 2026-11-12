import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import {
  formatCurrency,
  formatDateMarathi,
  formatMonthMarathi,
  getEntryTypeMeta,
  getPaymentModeLabel,
} from '../data/defaults';
import type {
  CropSummary,
  CustomerLedgerRow,
  PartyLedgerSummary,
  Voucher,
} from '../types/farm';
import type { DaySummaryRow, MonthSummaryRow } from './storage';

function flattenVouchersForExcel(vouchers: Voucher[]) {
  const rows: Record<string, string | number>[] = [];
  for (const v of vouchers) {
    const isExp = v.entryType === 'खर्च';
    const isInc = v.entryType === 'उत्पन्न';
    const isParty = !isExp && !isInc;
    if (v.items.length === 0) {
      rows.push({
        'व्हाउचर क्र.': v.voucherNo,
        'दिनांक': formatDateMarathi(v.date),
        'पीक': v.crop,
        'पार्टीचे नाव': v.partyName || '-',
        'व्यवहार माध्यम': v.paymentMode,
        'UPI / चेक संदर्भ': v.paymentRef || '',
        'नोंद प्रकार': v.entryType,
        'पेमेंट / जमा': v.settlementType,
        'अ.क्र.': 1,
        'तपशील': '-',
        'प्रकार / श्रेणी': '-',
        'प्रमाण': '',
        'दर (₹)': '',
        'खर्च (₹)': isExp ? v.totalAmount : 0,
        'उत्पन्न (₹)': isInc ? v.totalAmount : 0,
        'पार्टी देणे-घेणे (₹)': isParty ? v.totalAmount : 0,
      });
    } else {
      for (const item of v.items) {
        rows.push({
          'व्हाउचर क्र.': v.voucherNo,
          'दिनांक': formatDateMarathi(v.date),
          'पीक': v.crop,
          'पार्टीचे नाव': v.partyName || '-',
          'व्यवहार माध्यम': v.paymentMode,
          'UPI / चेक संदर्भ': v.paymentRef || '',
          'नोंद प्रकार': v.entryType,
          'पेमेंट / जमा': v.settlementType,
          'अ.क्र.': item.srNo,
          'तपशील': item.particular,
          'प्रकार / श्रेणी': item.category,
          'प्रमाण': item.qty ? Number(item.qty) : '',
          'दर (₹)': item.rate ? Number(item.rate) : '',
          'खर्च (₹)': isExp ? item.amount : 0,
          'उत्पन्न (₹)': isInc ? item.amount : 0,
          'पार्टी देणे-घेणे (₹)': isParty ? item.amount : 0,
        });
      }
    }
  }
  return rows;
}

export function exportVoucherListExcel(vouchers: Voucher[]) {
  const wb = XLSX.utils.book_new();
  const rows = flattenVouchersForExcel(vouchers);

  const totalExp = vouchers
    .filter((v) => v.entryType === 'खर्च')
    .reduce((s, v) => s + v.totalAmount, 0);
  const totalInc = vouchers
    .filter((v) => v.entryType === 'उत्पन्न')
    .reduce((s, v) => s + v.totalAmount, 0);
  const totalParty = vouchers
    .filter((v) => v.entryType === 'पैसे दिले' || v.entryType === 'पैसे घेतले')
    .reduce((s, v) => s + v.totalAmount, 0);

  rows.push({
    'व्हाउचर क्र.': '',
    'दिनांक': '',
    'पीक': 'एकूण बेरीज',
    'पार्टीचे नाव': '',
    'व्यवहार माध्यम': '',
    'UPI / चेक संदर्भ': '',
    'नोंद प्रकार': '',
    'पेमेंट / जमा': '',
    'अ.क्र.': '',
    'तपशील': '',
    'प्रकार / श्रेणी': '',
    'प्रमाण': '',
    'दर (₹)': '',
    'खर्च (₹)': totalExp,
    'उत्पन्न (₹)': totalInc,
    'पार्टी देणे-घेणे (₹)': totalParty,
  });

  const ws = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, 'व्हाउचर यादी');
  XLSX.writeFile(wb, `व्हाउचर_यादी_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

export function exportCropReportExcel(
  summaries: CropSummary[],
  vouchers: Voucher[],
  selectedCrop?: string
) {
  const wb = XLSX.utils.book_new();

  const summaryRows = summaries.map((s) => ({
    'पीक': s.crop,
    'व्हाउचर संख्या': s.voucherCount,
    'खत (₹)': s.categoryExpenses['खत'] || 0,
    'ट्रॅक्टर (₹)': s.categoryExpenses['ट्रॅक्टर'] || 0,
    'कीटकनाशक (₹)': s.categoryExpenses['कीटकनाशक'] || 0,
    'मजुरी (₹)': s.categoryExpenses['मजुरी'] || 0,
    'इतर खर्च (₹)': Object.entries(s.categoryExpenses)
      .filter(([k]) => !['खत', 'ट्रॅक्टर', 'कीटकनाशक', 'मजुरी'].includes(k))
      .reduce((acc, [, val]) => acc + val, 0),
    'एकूण खर्च (₹)': s.totalExpense,
    'एकूण उत्पन्न (₹)': s.totalIncome,
    'नफा / तोटा (₹)': s.profitLoss,
    'स्थिती': s.profitLoss >= 0 ? 'नफा' : 'तोटा',
  }));

  const totalExp = summaries.reduce((a, b) => a + b.totalExpense, 0);
  const totalInc = summaries.reduce((a, b) => a + b.totalIncome, 0);
  const totalPL = totalInc - totalExp;
  summaryRows.push({
    'पीक': 'एकूण बेरीज',
    'व्हाउचर संख्या': summaries.reduce((a, b) => a + b.voucherCount, 0),
    'खत (₹)': summaries.reduce((a, b) => a + (b.categoryExpenses['खत'] || 0), 0),
    'ट्रॅक्टर (₹)': summaries.reduce((a, b) => a + (b.categoryExpenses['ट्रॅक्टर'] || 0), 0),
    'कीटकनाशक (₹)': summaries.reduce((a, b) => a + (b.categoryExpenses['कीटकनाशक'] || 0), 0),
    'मजुरी (₹)': summaries.reduce((a, b) => a + (b.categoryExpenses['मजुरी'] || 0), 0),
    'इतर खर्च (₹)': summaries.reduce(
      (a, b) =>
        a +
        Object.entries(b.categoryExpenses)
          .filter(([k]) => !['खत', 'ट्रॅक्टर', 'कीटकनाशक', 'मजुरी'].includes(k))
          .reduce((acc, [, val]) => acc + val, 0),
      0
    ),
    'एकूण खर्च (₹)': totalExp,
    'एकूण उत्पन्न (₹)': totalInc,
    'नफा / तोटा (₹)': totalPL,
    'स्थिती': totalPL >= 0 ? 'नफा' : 'तोटा',
  });

  const ws1 = XLSX.utils.json_to_sheet(summaryRows);
  XLSX.utils.book_append_sheet(wb, ws1, 'पीक निहाय नफा-तोटा');

  const filteredVouchers =
    selectedCrop && selectedCrop !== 'सर्व'
      ? vouchers.filter((v) => v.crop === selectedCrop)
      : vouchers;
  const ws2 = XLSX.utils.json_to_sheet(flattenVouchersForExcel(filteredVouchers));
  XLSX.utils.book_append_sheet(wb, ws2, 'सविस्तर नोंदी');

  const suffix = selectedCrop && selectedCrop !== 'सर्व' ? `_${selectedCrop}` : '';
  XLSX.writeFile(wb, `कृषी_पीक_अहवाल${suffix}.xlsx`);
}

export function exportDayWiseExcel(rows: DaySummaryRow[], vouchers: Voucher[], label: string) {
  const wb = XLSX.utils.book_new();
  const sheetRows = rows.map((r) => ({
    'दिनांक': formatDateMarathi(r.date),
    'व्हाउचर संख्या': r.voucherCount,
    'एकूण खर्च (₹)': r.expense,
    'एकूण उत्पन्न (₹)': r.income,
    'निव्वळ नफा / तोटा (₹)': r.net,
  }));
  const ws1 = XLSX.utils.json_to_sheet(sheetRows);
  XLSX.utils.book_append_sheet(wb, ws1, 'दिवसनिहाय सारांश');

  const ws2 = XLSX.utils.json_to_sheet(flattenVouchersForExcel(vouchers));
  XLSX.utils.book_append_sheet(wb, ws2, 'तपशीलवार व्हाउचर');

  XLSX.writeFile(wb, `दिवसनिहाय_अहवाल_${label}.xlsx`);
}

export function exportMonthWiseExcel(rows: MonthSummaryRow[], vouchers: Voucher[], label: string) {
  const wb = XLSX.utils.book_new();
  const sheetRows = rows.map((r) => ({
    'महिना': formatMonthMarathi(r.monthKey),
    'व्हाउचर संख्या': r.voucherCount,
    'एकूण खर्च (₹)': r.expense,
    'एकूण उत्पन्न (₹)': r.income,
    'निव्वळ नफा / तोटा (₹)': r.net,
    'स्थिती': r.net >= 0 ? 'नफा' : 'तोटा',
  }));
  const ws1 = XLSX.utils.json_to_sheet(sheetRows);
  XLSX.utils.book_append_sheet(wb, ws1, 'महिन्यानिहाय सारांश');

  const ws2 = XLSX.utils.json_to_sheet(flattenVouchersForExcel(vouchers));
  XLSX.utils.book_append_sheet(wb, ws2, 'तपशीलवार व्हाउचर');

  XLSX.writeFile(wb, `महिन्यानिहाय_अहवाल_${label}.xlsx`);
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function renderHtmlToPdf(htmlContent: string, fileName: string): Promise<void> {
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-10000px';
  container.style.top = '0';
  container.style.width = '794px';
  container.style.background = '#ffffff';
  container.style.color = '#1c1917';
  container.style.padding = '28px 32px';
  container.style.fontFamily = '"Noto Sans Devanagari", "Nirmala UI", Mangal, sans-serif';
  container.innerHTML = htmlContent;
  document.body.appendChild(container);

  try {
    if (document.fonts && document.fonts.ready) {
      await document.fonts.ready;
    }
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pdfWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pdfHeight;

    while (heightLeft > 0) {
      position -= pdfHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;
    }

    pdf.save(fileName);
  } finally {
    document.body.removeChild(container);
  }
}

const CELL_BORDER = 'border:1px solid #78716c;';

function buildVoucherDetailTableHtml(vouchers: Voucher[]): string {
  const totalExp = vouchers
    .filter((v) => v.entryType === 'खर्च')
    .reduce((s, v) => s + v.totalAmount, 0);
  const totalInc = vouchers
    .filter((v) => v.entryType === 'उत्पन्न')
    .reduce((s, v) => s + v.totalAmount, 0);

  const rowsHtml = vouchers
    .slice(0, 80)
    .map((v) => {
      const isExp = v.entryType === 'खर्च';
      const isInc = v.entryType === 'उत्पन्न';
      const meta = getEntryTypeMeta(v.entryType);
      const refHtml = v.paymentRef ? `<br/><span style="color:#57534e;font-size:9.5px;">${escapeHtml(v.paymentRef)}</span>` : '';
      return `
      <tr>
        <td style="padding:6px 7px;${CELL_BORDER}">#${v.voucherNo}</td>
        <td style="padding:6px 7px;${CELL_BORDER}white-space:nowrap;">${formatDateMarathi(v.date)}</td>
        <td style="padding:6px 7px;${CELL_BORDER}font-weight:600;">${escapeHtml(v.crop)}</td>
        <td style="padding:6px 7px;${CELL_BORDER}">${escapeHtml(v.partyName || '-')}</td>
        <td style="padding:6px 7px;${CELL_BORDER}">${escapeHtml(meta.shortLabel)} • ${escapeHtml(v.paymentMode)}${refHtml}</td>
        <td style="padding:6px 7px;${CELL_BORDER}">${escapeHtml(
          v.items.map((i) => `${i.particular} (${i.category})`).join(', ')
        )}</td>
        <td style="padding:6px 7px;${CELL_BORDER}text-align:right;font-weight:700;color:#b91c1c;white-space:nowrap;">
          ${isExp ? formatCurrency(v.totalAmount) : '-'}
        </td>
        <td style="padding:6px 7px;${CELL_BORDER}text-align:right;font-weight:700;color:${isInc ? '#15803d' : meta.pdfColor};white-space:nowrap;">
          ${isInc ? formatCurrency(v.totalAmount) : !isExp ? `${escapeHtml(meta.shortLabel)}: ${formatCurrency(v.totalAmount)}` : '-'}
        </td>
      </tr>`;
    })
    .join('');

  return `
    <table style="width:100%;border-collapse:collapse;font-size:10.5px;">
      <thead>
        <tr style="background:#e7e5e4;color:#1c1917;">
          <th style="padding:7px 7px;${CELL_BORDER}text-align:left;">क्र.</th>
          <th style="padding:7px 7px;${CELL_BORDER}text-align:left;">दिनांक</th>
          <th style="padding:7px 7px;${CELL_BORDER}text-align:left;">पीक</th>
          <th style="padding:7px 7px;${CELL_BORDER}text-align:left;">पार्टीचे नाव</th>
          <th style="padding:7px 7px;${CELL_BORDER}text-align:left;">व्यवहार</th>
          <th style="padding:7px 7px;${CELL_BORDER}text-align:left;">तपशील व प्रकार</th>
          <th style="padding:7px 7px;${CELL_BORDER}text-align:right;color:#991b1b;">खर्च (₹)</th>
          <th style="padding:7px 7px;${CELL_BORDER}text-align:right;color:#166534;">उत्पन्न (₹)</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
        <tr style="background:#f5f5f4;font-weight:800;">
          <td colspan="6" style="padding:7px 8px;${CELL_BORDER}text-align:right;">एकूण बेरीज:</td>
          <td style="padding:7px 8px;${CELL_BORDER}text-align:right;color:#b91c1c;">${formatCurrency(totalExp)}</td>
          <td style="padding:7px 8px;${CELL_BORDER}text-align:right;color:#15803d;">${formatCurrency(totalInc)}</td>
        </tr>
      </tbody>
    </table>
  `;
}

export async function exportSingleVoucherPdf(voucher: Voucher): Promise<void> {
  const isExp = voucher.entryType === 'खर्च';
  const isInc = voucher.entryType === 'उत्पन्न';
  const isParty = !isExp && !isInc;
  const meta = getEntryTypeMeta(voucher.entryType);
  const showQtyRateInPdf = !isParty || voucher.items.some((i) => i.qty || i.rate);
  const rowsToShow = [...voucher.items];
  const minRows = isParty ? 1 : 4;
  while (rowsToShow.length < minRows) {
    rowsToShow.push({
      id: `empty-${rowsToShow.length}`,
      srNo: rowsToShow.length + 1,
      particular: '',
      category: '',
      qty: '',
      rate: '',
      amount: 0,
    });
  }

  const rowsHtml = rowsToShow
    .map(
      (it) => `
      <tr>
        <td style="padding:8px;${CELL_BORDER}text-align:center;font-weight:600;">${it.srNo}</td>
        <td style="padding:8px;${CELL_BORDER}">${escapeHtml(it.particular || '')}</td>
        <td style="padding:8px;${CELL_BORDER}">${escapeHtml(it.category || '')}</td>
        ${
          showQtyRateInPdf
            ? `<td style="padding:8px;${CELL_BORDER}text-align:right;">${escapeHtml(it.qty || '')}</td>
               <td style="padding:8px;${CELL_BORDER}text-align:right;">${it.rate ? formatCurrency(Number(it.rate)) : ''}</td>`
            : ''
        }
        ${
          isParty
            ? `<td style="padding:8px;${CELL_BORDER}text-align:right;font-weight:700;color:${meta.pdfColor};">
                ${it.amount > 0 ? formatCurrency(it.amount) : ''}
              </td>`
            : `<td style="padding:8px;${CELL_BORDER}text-align:right;font-weight:700;color:#b91c1c;">
                ${isExp && it.amount > 0 ? formatCurrency(it.amount) : ''}
              </td>
              <td style="padding:8px;${CELL_BORDER}text-align:right;font-weight:700;color:#15803d;">
                ${isInc && it.amount > 0 ? formatCurrency(it.amount) : ''}
              </td>`
        }
      </tr>`
    )
    .join('');

  const html = `
    <div style="border:2px solid #44403c;padding:20px;border-radius:8px;">
      <div style="border-bottom:2px solid #15803d;padding-bottom:10px;margin-bottom:14px;display:flex;justify-content:space-between;align-items:center;">
        <div>
          <h1 style="margin:0;font-size:22px;color:#14532d;font-weight:800;">शिंगोटे शंकर — कृषी हिशोब (व्हाउचर पावती)</h1>
          <p style="margin:2px 0 0;font-size:12px;color:#57534e;">शेती खर्च, उत्पन्न व पार्टी व्यवहार नोंदणी व्हाउचर</p>
        </div>
        <div style="text-align:right;font-size:13px;">
          <div><strong>व्हाउचर क्र.:</strong> #${voucher.voucherNo}</div>
          <div><strong>दिनांक:</strong> ${formatDateMarathi(voucher.date)}</div>
        </div>
      </div>

      <table style="width:100%;border-collapse:collapse;font-size:12.5px;margin-bottom:14px;">
        <tbody>
          <tr>
            <td style="padding:7px 10px;${CELL_BORDER}background:#fafaf9;width:50%;">
              <strong>पेमेंट माध्यम:</strong> ${escapeHtml(getPaymentModeLabel(voucher.paymentMode))}${
                voucher.paymentRef ? ` — ${escapeHtml(voucher.paymentRef)}` : ''
              }
            </td>
            <td style="padding:7px 10px;${CELL_BORDER}background:#fafaf9;width:50%;">
              <strong>नोंद प्रकार:</strong>
              <span style="font-weight:800;color:${meta.pdfColor};">
                ${escapeHtml(meta.label)}
              </span>
            </td>
          </tr>
          <tr>
            <td style="padding:7px 10px;${CELL_BORDER}">
              <strong>पेमेंट / जमा:</strong> ${voucher.settlementType} (${voucher.settlementType === 'पेमेंट' ? 'Payment' : 'Received'})
            </td>
            <td style="padding:7px 10px;${CELL_BORDER}">
              <strong>पीक / खाते:</strong> ${escapeHtml(voucher.crop)}
            </td>
          </tr>
          <tr>
            <td colspan="2" style="padding:7px 10px;${CELL_BORDER}">
              <strong>पार्टीचे नाव (Party / मजूर):</strong> ${escapeHtml(voucher.partyName || '-')}
            </td>
          </tr>
        </tbody>
      </table>

      <table style="width:100%;border-collapse:collapse;font-size:12px;margin-bottom:14px;">
        <thead>
          <tr style="background:#e7e5e4;color:#1c1917;">
            <th style="padding:8px;${CELL_BORDER}width:48px;text-align:center;">अ.क्र.</th>
            <th style="padding:8px;${CELL_BORDER}text-align:left;">तपशील</th>
            <th style="padding:8px;${CELL_BORDER}text-align:left;">प्रकार</th>
            ${
              showQtyRateInPdf
                ? `<th style="padding:8px;${CELL_BORDER}text-align:right;width:70px;">नग/प्रमाण</th>
                   <th style="padding:8px;${CELL_BORDER}text-align:right;width:85px;">दर (₹)</th>`
                : ''
            }
            ${
              isParty
                ? `<th style="padding:8px;${CELL_BORDER}text-align:right;width:120px;color:${meta.pdfColor};">${escapeHtml(meta.shortLabel)} (₹)</th>`
                : `<th style="padding:8px;${CELL_BORDER}text-align:right;width:100px;color:#991b1b;">खर्च (₹)</th>
                   <th style="padding:8px;${CELL_BORDER}text-align:right;width:100px;color:#166534;">उत्पन्न (₹)</th>`
            }
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
          <tr style="background:#f5f5f4;font-weight:800;font-size:13px;">
            <td colspan="${showQtyRateInPdf ? 5 : 3}" style="padding:9px 10px;${CELL_BORDER}text-align:right;">एकूण रक्कम:</td>
            ${
              isParty
                ? `<td style="padding:9px 10px;${CELL_BORDER}text-align:right;color:${meta.pdfColor};">
                    ${formatCurrency(voucher.totalAmount)}
                  </td>`
                : `<td style="padding:9px 10px;${CELL_BORDER}text-align:right;color:#b91c1c;">
                    ${isExp ? formatCurrency(voucher.totalAmount) : '-'}
                  </td>
                  <td style="padding:9px 10px;${CELL_BORDER}text-align:right;color:#15803d;">
                    ${isInc ? formatCurrency(voucher.totalAmount) : '-'}
                  </td>`
            }
          </tr>
        </tbody>
      </table>

      ${
        voucher.notes
          ? `<div style="margin-bottom:18px;font-size:12px;padding:8px 10px;${CELL_BORDER}background:#fafaf9;"><strong>टीप:</strong> ${escapeHtml(voucher.notes)}</div>`
          : ''
      }

      <div style="display:flex;justify-content:space-between;margin-top:36px;padding-top:10px;font-size:12px;">
        <div style="text-align:center;width:180px;border-top:1px solid #57534e;padding-top:6px;">पार्टीची सही</div>
        <div style="text-align:center;width:180px;border-top:1px solid #57534e;padding-top:6px;">शेतकरी / मालक सही</div>
      </div>
    </div>
  `;

  await renderHtmlToPdf(html, `व्हाउचर_${voucher.voucherNo}_${voucher.crop}.pdf`);
}

export async function exportVoucherListPdf(
  vouchers: Voucher[],
  filterDescription: string
): Promise<void> {
  const totalExp = vouchers
    .filter((v) => v.entryType === 'खर्च')
    .reduce((s, v) => s + v.totalAmount, 0);
  const totalInc = vouchers
    .filter((v) => v.entryType === 'उत्पन्न')
    .reduce((s, v) => s + v.totalAmount, 0);
  const net = totalInc - totalExp;

  const html = `
    <div style="border-bottom:3px solid #15803d;padding-bottom:10px;margin-bottom:16px;">
      <h1 style="margin:0;font-size:21px;color:#14532d;font-weight:800;">शिंगोटे शंकर — कृषी हिशोब (व्हाउचर नोंदवही अहवाल)</h1>
      <p style="margin:4px 0 0;font-size:12px;color:#57534e;">फिल्टर: ${escapeHtml(filterDescription)} | दिनांक: ${formatDateMarathi(new Date().toISOString().slice(0, 10))}</p>
    </div>

    <div style="display:flex;gap:12px;margin-bottom:16px;">
      <div style="flex:1;background:#fef2f2;border:1px solid #fca5a5;border-radius:6px;padding:10px 12px;">
        <div style="font-size:11px;color:#991b1b;">एकूण खर्च</div>
        <div style="font-size:17px;font-weight:800;color:#b91c1c;">${formatCurrency(totalExp)}</div>
      </div>
      <div style="flex:1;background:#f0fdf4;border:1px solid #86efac;border-radius:6px;padding:10px 12px;">
        <div style="font-size:11px;color:#166534;">एकूण उत्पन्न</div>
        <div style="font-size:17px;font-weight:800;color:#15803d;">${formatCurrency(totalInc)}</div>
      </div>
      <div style="flex:1;background:#f5f5f4;border:1px solid #a8a29e;border-radius:6px;padding:10px 12px;">
        <div style="font-size:11px;color:#44403c;">निव्वळ ${net >= 0 ? 'नफा' : 'तोटा'}</div>
        <div style="font-size:17px;font-weight:800;color:${net >= 0 ? '#15803d' : '#b91c1c'};">${formatCurrency(Math.abs(net))}</div>
      </div>
    </div>

    ${buildVoucherDetailTableHtml(vouchers)}
  `;

  await renderHtmlToPdf(html, `व्हाउचर_यादी_अहवाल.pdf`);
}

export async function exportCropReportPdf(
  summaries: CropSummary[],
  vouchers: Voucher[],
  selectedCrop?: string
): Promise<void> {
  const totalExp = summaries.reduce((a, b) => a + b.totalExpense, 0);
  const totalInc = summaries.reduce((a, b) => a + b.totalIncome, 0);
  const totalPL = totalInc - totalExp;
  const titleCrop =
    selectedCrop && selectedCrop !== 'सर्व' ? ` (${escapeHtml(selectedCrop)})` : ' (सर्व पिके)';

  const summaryRowsHtml = summaries
    .map(
      (s) => `
      <tr>
        <td style="padding:7px 8px;${CELL_BORDER}font-weight:600;">${escapeHtml(s.crop)}</td>
        <td style="padding:7px 8px;${CELL_BORDER}text-align:right;">${formatCurrency(s.categoryExpenses['खत'] || 0)}</td>
        <td style="padding:7px 8px;${CELL_BORDER}text-align:right;">${formatCurrency(s.categoryExpenses['ट्रॅक्टर'] || 0)}</td>
        <td style="padding:7px 8px;${CELL_BORDER}text-align:right;">${formatCurrency(s.categoryExpenses['कीटकनाशक'] || 0)}</td>
        <td style="padding:7px 8px;${CELL_BORDER}text-align:right;">${formatCurrency(s.categoryExpenses['मजुरी'] || 0)}</td>
        <td style="padding:7px 8px;${CELL_BORDER}text-align:right;color:#b91c1c;font-weight:700;">${formatCurrency(s.totalExpense)}</td>
        <td style="padding:7px 8px;${CELL_BORDER}text-align:right;color:#15803d;font-weight:700;">${formatCurrency(s.totalIncome)}</td>
        <td style="padding:7px 8px;${CELL_BORDER}text-align:right;font-weight:700;color:${s.profitLoss >= 0 ? '#15803d' : '#b91c1c'};">
          ${formatCurrency(Math.abs(s.profitLoss))} (${s.profitLoss >= 0 ? 'नफा' : 'तोटा'})
        </td>
      </tr>`
    )
    .join('');

  const filteredVouchers =
    selectedCrop && selectedCrop !== 'सर्व'
      ? vouchers.filter((v) => v.crop === selectedCrop)
      : vouchers;

  const html = `
    <div style="border-bottom:3px solid #15803d;padding-bottom:10px;margin-bottom:16px;">
      <h1 style="margin:0;font-size:21px;color:#14532d;font-weight:800;">शिंगोटे शंकर — कृषी हिशोब (पीक निहाय अहवाल${titleCrop})</h1>
      <p style="margin:4px 0 0;font-size:12px;color:#57534e;">अहवाल दिनांक: ${formatDateMarathi(new Date().toISOString().slice(0, 10))}</p>
    </div>

    <div style="display:flex;gap:12px;margin-bottom:18px;">
      <div style="flex:1;background:#fef2f2;border:1px solid #fca5a5;border-radius:6px;padding:10px 12px;">
        <div style="font-size:11px;color:#991b1b;">एकूण खर्च</div>
        <div style="font-size:18px;font-weight:800;color:#b91c1c;">${formatCurrency(totalExp)}</div>
      </div>
      <div style="flex:1;background:#f0fdf4;border:1px solid #86efac;border-radius:6px;padding:10px 12px;">
        <div style="font-size:11px;color:#166534;">एकूण उत्पन्न</div>
        <div style="font-size:18px;font-weight:800;color:#15803d;">${formatCurrency(totalInc)}</div>
      </div>
      <div style="flex:1;background:${totalPL >= 0 ? '#ecfdf5' : '#fff1f2'};border:1px solid #a8a29e;border-radius:6px;padding:10px 12px;">
        <div style="font-size:11px;color:#44403c;">निव्वळ ${totalPL >= 0 ? 'नफा' : 'तोटा'}</div>
        <div style="font-size:18px;font-weight:800;color:${totalPL >= 0 ? '#15803d' : '#b91c1c'};">${formatCurrency(Math.abs(totalPL))}</div>
      </div>
    </div>

    <h2 style="font-size:14px;color:#1c1917;margin:0 0 8px;">१. पीक निहाय खर्च, उत्पन्न व नफा-तोटा तक्ता</h2>
    <table style="width:100%;border-collapse:collapse;font-size:11px;margin-bottom:20px;">
      <thead>
        <tr style="background:#e7e5e4;color:#1c1917;">
          <th style="padding:7px 8px;${CELL_BORDER}text-align:left;">पीक</th>
          <th style="padding:7px 8px;${CELL_BORDER}text-align:right;">खत</th>
          <th style="padding:7px 8px;${CELL_BORDER}text-align:right;">ट्रॅक्टर</th>
          <th style="padding:7px 8px;${CELL_BORDER}text-align:right;">कीटकनाशक</th>
          <th style="padding:7px 8px;${CELL_BORDER}text-align:right;">मजुरी</th>
          <th style="padding:7px 8px;${CELL_BORDER}text-align:right;color:#991b1b;">एकूण खर्च</th>
          <th style="padding:7px 8px;${CELL_BORDER}text-align:right;color:#166534;">एकूण उत्पन्न</th>
          <th style="padding:7px 8px;${CELL_BORDER}text-align:right;">नफा / तोटा</th>
        </tr>
      </thead>
      <tbody>
        ${summaryRowsHtml}
        <tr style="background:#f5f5f4;font-weight:800;">
          <td colspan="5" style="padding:7px 8px;${CELL_BORDER}text-align:right;">एकूण बेरीज:</td>
          <td style="padding:7px 8px;${CELL_BORDER}text-align:right;color:#b91c1c;">${formatCurrency(totalExp)}</td>
          <td style="padding:7px 8px;${CELL_BORDER}text-align:right;color:#15803d;">${formatCurrency(totalInc)}</td>
          <td style="padding:7px 8px;${CELL_BORDER}text-align:right;color:${totalPL >= 0 ? '#15803d' : '#b91c1c'};">
            ${formatCurrency(Math.abs(totalPL))} (${totalPL >= 0 ? 'नफा' : 'तोटा'})
          </td>
        </tr>
      </tbody>
    </table>

    <h2 style="font-size:14px;color:#1c1917;margin:0 0 8px;">२. सविस्तर व्हाउचर तपशील (खर्च व उत्पन्न स्वतंत्र रकान्यात)</h2>
    ${buildVoucherDetailTableHtml(filteredVouchers)}
  `;

  const suffix = selectedCrop && selectedCrop !== 'सर्व' ? `_${selectedCrop}` : '';
  await renderHtmlToPdf(html, `कृषी_पीक_अहवाल${suffix}.pdf`);
}

export async function exportDateReportPdf(
  mode: 'day' | 'month',
  rows: Array<{ label: string; count: number; expense: number; income: number; net: number }>,
  vouchers: Voucher[],
  filterLabel: string
): Promise<void> {
  const totalExp = rows.reduce((a, b) => a + b.expense, 0);
  const totalInc = rows.reduce((a, b) => a + b.income, 0);
  const totalNet = totalInc - totalExp;
  const heading =
    mode === 'day' ? 'दिवसनिहाय खर्च व उत्पन्न अहवाल' : 'महिन्यानिहाय खर्च व उत्पन्न अहवाल';

  const summaryHtml = rows
    .map(
      (r) => `
      <tr>
        <td style="padding:7px 8px;${CELL_BORDER}font-weight:600;">${escapeHtml(r.label)}</td>
        <td style="padding:7px 8px;${CELL_BORDER}text-align:center;">${r.count}</td>
        <td style="padding:7px 8px;${CELL_BORDER}text-align:right;color:#b91c1c;font-weight:700;">${formatCurrency(r.expense)}</td>
        <td style="padding:7px 8px;${CELL_BORDER}text-align:right;color:#15803d;font-weight:700;">${formatCurrency(r.income)}</td>
        <td style="padding:7px 8px;${CELL_BORDER}text-align:right;font-weight:700;color:${r.net >= 0 ? '#15803d' : '#b91c1c'};">
          ${formatCurrency(Math.abs(r.net))} (${r.net >= 0 ? 'नफा' : 'तोटा'})
        </td>
      </tr>`
    )
    .join('');

  const html = `
    <div style="border-bottom:3px solid #15803d;padding-bottom:10px;margin-bottom:16px;">
      <h1 style="margin:0;font-size:21px;color:#14532d;font-weight:800;">शिंगोटे शंकर — कृषी हिशोब (${heading})</h1>
      <p style="margin:4px 0 0;font-size:12px;color:#57534e;">कालावधी: ${escapeHtml(filterLabel)} | अहवाल दिनांक: ${formatDateMarathi(new Date().toISOString().slice(0, 10))}</p>
    </div>

    <div style="display:flex;gap:12px;margin-bottom:18px;">
      <div style="flex:1;background:#fef2f2;border:1px solid #fca5a5;border-radius:6px;padding:10px 12px;">
        <div style="font-size:11px;color:#991b1b;">एकूण खर्च</div>
        <div style="font-size:18px;font-weight:800;color:#b91c1c;">${formatCurrency(totalExp)}</div>
      </div>
      <div style="flex:1;background:#f0fdf4;border:1px solid #86efac;border-radius:6px;padding:10px 12px;">
        <div style="font-size:11px;color:#166534;">एकूण उत्पन्न</div>
        <div style="font-size:18px;font-weight:800;color:#15803d;">${formatCurrency(totalInc)}</div>
      </div>
      <div style="flex:1;background:${totalNet >= 0 ? '#ecfdf5' : '#fff1f2'};border:1px solid #a8a29e;border-radius:6px;padding:10px 12px;">
        <div style="font-size:11px;color:#44403c;">निव्वळ ${totalNet >= 0 ? 'नफा' : 'तोटा'}</div>
        <div style="font-size:18px;font-weight:800;color:${totalNet >= 0 ? '#15803d' : '#b91c1c'};">${formatCurrency(Math.abs(totalNet))}</div>
      </div>
    </div>

    <table style="width:100%;border-collapse:collapse;font-size:11px;margin-bottom:20px;">
      <thead>
        <tr style="background:#e7e5e4;">
          <th style="padding:7px 8px;${CELL_BORDER}text-align:left;">${mode === 'day' ? 'दिनांक' : 'महिना'}</th>
          <th style="padding:7px 8px;${CELL_BORDER}text-align:center;">व्हाउचर</th>
          <th style="padding:7px 8px;${CELL_BORDER}text-align:right;color:#991b1b;">एकूण खर्च</th>
          <th style="padding:7px 8px;${CELL_BORDER}text-align:right;color:#166534;">एकूण उत्पन्न</th>
          <th style="padding:7px 8px;${CELL_BORDER}text-align:right;">निव्वळ नफा / तोटा</th>
        </tr>
      </thead>
      <tbody>
        ${summaryHtml}
        <tr style="background:#f5f5f4;font-weight:800;">
          <td colspan="2" style="padding:7px 8px;${CELL_BORDER}text-align:right;">एकूण बेरीज:</td>
          <td style="padding:7px 8px;${CELL_BORDER}text-align:right;color:#b91c1c;">${formatCurrency(totalExp)}</td>
          <td style="padding:7px 8px;${CELL_BORDER}text-align:right;color:#15803d;">${formatCurrency(totalInc)}</td>
          <td style="padding:7px 8px;${CELL_BORDER}text-align:right;color:${totalNet >= 0 ? '#15803d' : '#b91c1c'};">
            ${formatCurrency(Math.abs(totalNet))} (${totalNet >= 0 ? 'नफा' : 'तोटा'})
          </td>
        </tr>
      </tbody>
    </table>

    <h2 style="font-size:14px;margin:0 0 8px;">सविस्तर व्हाउचर यादी (खर्च व उत्पन्न स्वतंत्र रकान्यात)</h2>
    ${buildVoucherDetailTableHtml(vouchers)}
  `;

  const filePrefix = mode === 'day' ? 'दिवसनिहाय_अहवाल' : 'महिन्यानिहाय_अहवाल';
  await renderHtmlToPdf(html, `${filePrefix}.pdf`);
}

function formatBalanceText(bal: number): string {
  if (bal > 0) return `देणे बाकी: ${formatCurrency(bal)}`;
  if (bal < 0) return `येणे बाकी: ${formatCurrency(Math.abs(bal))}`;
  return 'हिशोब पूर्ण (₹0)';
}

export function exportCustomerLedgerExcel(
  summary: PartyLedgerSummary,
  rows: CustomerLedgerRow[]
) {
  const wb = XLSX.utils.book_new();
  const sheetRows = rows.map(({ voucher: v, runningBalance }) => ({
    'व्हाउचर क्र.': `#${v.voucherNo}`,
    'दिनांक': formatDateMarathi(v.date),
    'नोंद प्रकार': v.entryType,
    'माध्यम': v.paymentMode,
    'UPI / चेक संदर्भ': v.paymentRef || '',
    'पीक / खाते': v.crop,
    'तपशील': v.items
      .map((i) => `${i.particular} (${i.category})${i.qty && i.rate ? ` [${i.qty}×${i.rate}]` : ''}`)
      .join(', '),
    'टीप': v.notes || '',
    'रक्कम (₹)': v.totalAmount,
    'शिल्लक स्थिती': formatBalanceText(runningBalance),
  }));

  const ws1 = XLSX.utils.json_to_sheet(sheetRows);
  XLSX.utils.book_append_sheet(wb, ws1, 'खातेवही तपशील');
  const safeName = summary.partyName.replace(/[\\/:*?"<>|]/g, '_');
  XLSX.writeFile(wb, `खातेवही_${safeName}.xlsx`);
}

export async function exportCustomerLedgerPdf(
  summary: PartyLedgerSummary,
  rows: CustomerLedgerRow[]
): Promise<void> {
  const rowsHtml = rows
    .map(({ voucher: v, runningBalance }) => {
      const meta = getEntryTypeMeta(v.entryType);
      const refHtml = v.paymentRef
        ? `<br/><span style="font-size:9.5px;color:#57534e;">${escapeHtml(v.paymentRef)}</span>`
        : '';
      const balColor =
        runningBalance > 0 ? '#b91c1c' : runningBalance < 0 ? '#15803d' : '#44403c';
      return `
      <tr>
        <td style="padding:6px 7px;${CELL_BORDER}">#${v.voucherNo}</td>
        <td style="padding:6px 7px;${CELL_BORDER}white-space:nowrap;">${formatDateMarathi(v.date)}</td>
        <td style="padding:6px 7px;${CELL_BORDER}font-weight:700;color:${meta.pdfColor};">${escapeHtml(meta.shortLabel)}</td>
        <td style="padding:6px 7px;${CELL_BORDER}">${escapeHtml(v.paymentMode)}${refHtml}</td>
        <td style="padding:6px 7px;${CELL_BORDER}">${escapeHtml(
          v.items.map((i) => `${i.particular} (${i.category})`).join(', ')
        )}${v.notes ? `<br/><span style="font-size:9.5px;color:#57534e;">टीप: ${escapeHtml(v.notes)}</span>` : ''}</td>
        <td style="padding:6px 7px;${CELL_BORDER}text-align:right;font-weight:700;color:${meta.pdfColor};white-space:nowrap;">
          ${formatCurrency(v.totalAmount)}
        </td>
        <td style="padding:6px 7px;${CELL_BORDER}text-align:right;font-weight:700;color:${balColor};white-space:nowrap;">
          ${escapeHtml(formatBalanceText(runningBalance))}
        </td>
      </tr>`;
    })
    .join('');

  const netColor =
    summary.netBalance > 0 ? '#b91c1c' : summary.netBalance < 0 ? '#15803d' : '#44403c';

  const html = `
    <div style="border-bottom:3px solid #15803d;padding-bottom:10px;margin-bottom:14px;">
      <h1 style="margin:0;font-size:21px;color:#14532d;font-weight:800;">शिंगोटे शंकर — कृषी हिशोब (ग्राहक / पार्टी खातेवही)</h1>
      <p style="margin:4px 0 0;font-size:13px;color:#1c1917;"><strong>पार्टी / ग्राहक:</strong> ${escapeHtml(summary.partyName)} | <strong>दिनांक:</strong> ${formatDateMarathi(new Date().toISOString().slice(0, 10))}</p>
    </div>

    <div style="display:flex;gap:10px;margin-bottom:16px;">
      <div style="flex:1;background:#fef2f2;border:1px solid #fca5a5;border-radius:6px;padding:8px 10px;">
        <div style="font-size:10.5px;color:#991b1b;">उधार खरेदी</div>
        <div style="font-size:15px;font-weight:800;color:#b91c1c;">${formatCurrency(summary.creditExpense)}</div>
      </div>
      <div style="flex:1;background:#fffbeb;border:1px solid #fcd34d;border-radius:6px;padding:8px 10px;">
        <div style="font-size:10.5px;color:#92400e;">दिलेले पैसे</div>
        <div style="font-size:15px;font-weight:800;color:#b45309;">${formatCurrency(summary.paidOut)}</div>
      </div>
      <div style="flex:1;background:#f0fdf4;border:1px solid #86efac;border-radius:6px;padding:8px 10px;">
        <div style="font-size:10.5px;color:#166534;">उधार विक्री</div>
        <div style="font-size:15px;font-weight:800;color:#15803d;">${formatCurrency(summary.creditIncome)}</div>
      </div>
      <div style="flex:1;background:#f0f9ff;border:1px solid #7dd3fc;border-radius:6px;padding:8px 10px;">
        <div style="font-size:10.5px;color:#075985;">घेतलेले पैसे</div>
        <div style="font-size:15px;font-weight:800;color:#0369a1;">${formatCurrency(summary.receivedIn)}</div>
      </div>
      <div style="flex:1.2;background:#f5f5f4;border:1px solid #a8a29e;border-radius:6px;padding:8px 10px;">
        <div style="font-size:10.5px;color:#44403c;">सद्य शिल्लक स्थिती</div>
        <div style="font-size:15px;font-weight:800;color:${netColor};">${escapeHtml(formatBalanceText(summary.netBalance))}</div>
      </div>
    </div>

    <table style="width:100%;border-collapse:collapse;font-size:10.5px;">
      <thead>
        <tr style="background:#e7e5e4;color:#1c1917;">
          <th style="padding:7px;${CELL_BORDER}text-align:left;">क्र.</th>
          <th style="padding:7px;${CELL_BORDER}text-align:left;">दिनांक</th>
          <th style="padding:7px;${CELL_BORDER}text-align:left;">प्रकार</th>
          <th style="padding:7px;${CELL_BORDER}text-align:left;">माध्यम</th>
          <th style="padding:7px;${CELL_BORDER}text-align:left;">तपशील</th>
          <th style="padding:7px;${CELL_BORDER}text-align:right;">रक्कम (₹)</th>
          <th style="padding:7px;${CELL_BORDER}text-align:right;">चालू बाकी</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>
  `;

  const safeName = summary.partyName.replace(/[\\/:*?"<>|]/g, '_');
  await renderHtmlToPdf(html, `खातेवही_${safeName}.pdf`);
}
