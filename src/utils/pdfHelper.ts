import { Invoice, Customer } from '../types';

export function convertNumberToRupeesInWords(amount: number): string {
  const fraction = Math.round((amount % 1) * 100);
  let fractionPart = "";
  if (fraction > 0) {
    fractionPart = " and " + convertNumberToWords(fraction) + " Paise";
  }

  const wholeNumber = Math.floor(amount);
  let wholePart = convertNumberToWords(wholeNumber);
  
  if (wholePart === "Zero") {
    wholePart = "Zero Rupees";
  } else {
    wholePart = wholePart + " Rupees";
  }
  
  return wholePart + fractionPart + " Only";
}

function convertNumberToWords(num: number): string {
  if (num === 0) return "Zero";
  const ones = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
    "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"
  ];
  const tens = [
    "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"
  ];

  const helper = (n: number): string => {
    let str = "";
    if (n >= 100) {
      str += ones[Math.floor(n / 100)] + " Hundred ";
      n %= 100;
    }
    if (n >= 20) {
      str += tens[Math.floor(n / 10)] + " ";
      n %= 10;
    }
    if (n > 0) {
      str += ones[n] + " ";
    }
    return str.trim();
  };

  let word = "";
  if (Math.floor(num / 10000000) > 0) {
    word += helper(Math.floor(num / 10000000)) + " Crore ";
    num %= 10000000;
  }
  if (Math.floor(num / 100000) > 0) {
    word += helper(Math.floor(num / 100000)) + " Lakh ";
    num %= 100000;
  }
  if (Math.floor(num / 1000) > 0) {
    word += helper(Math.floor(num / 1000)) + " Thousand ";
    num %= 1000;
  }
  if (num > 0) {
    word += helper(num);
  }
  return word.trim();
}

const loadHtml2Pdf = (): Promise<any> => {
  return new Promise((resolve, reject) => {
    if ((window as any).html2pdf) {
      resolve((window as any).html2pdf);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
    script.onload = () => {
      if ((window as any).html2pdf) {
        resolve((window as any).html2pdf);
      } else {
        reject(new Error('html2pdf object not found on window after script load'));
      }
    };
    script.onerror = () => {
      reject(new Error('Failed to load html2pdf.js script from CDN'));
    };
    document.body.appendChild(script);
  });
};

export async function generateInvoicePdfBase64(invoice: Invoice, company: any, customer: Customer | undefined): Promise<string> {
  const html2pdf = await loadHtml2Pdf();

  const logoChar = (company.trade_name || 'BH').substring(0, 2).toUpperCase();
  const sellerCompanyName = company.legal_name || company.trade_name || 'Seller';
  const sellerSubtitle = company.business_subtitle || '';
  const sellerGstin = company.gstin || '';
  const sellerMobile = company.company_phone || company.phone || '';
  const sellerEmail = company.company_email || '';

  const sellerAddressHtml = (company.addresses || []).slice(0, 2).map((addr: any, idx: number) => {
    return `<div style="font-size: 10px; color: #64748b; margin-top: ${idx === 0 ? '3px' : '0px'}; line-height: 1.25;">${addr.type} : ${addr.line1}, ${addr.city} - ${addr.pincode}</div>`;
  }).join('');

  const sellerPrimaryState = company?.addresses?.[0]?.state || '';
  
  const buyerShippingState = invoice.shipToAddress?.state || customer?.state || invoice.state || '';
  const isSameState = sellerPrimaryState.toLowerCase().trim() === buyerShippingState.toLowerCase().trim();
  const saleType = isSameState ? 'State' : 'Inter State';

  const buyerPrimaryAddress = customer?.addresses?.find((a: any) => a.isPrimary) || customer?.addresses?.[0];
  const buyerAddressStr = buyerPrimaryAddress 
    ? `${buyerPrimaryAddress.line1}, ${buyerPrimaryAddress.city} - ${buyerPrimaryAddress.pincode}` 
    : (customer?.address || 'Address not registered');
  const buyerState = buyerPrimaryAddress?.state || customer?.state || invoice.state || '';
  const buyerStateCode = buyerPrimaryAddress?.stateCode || (customer?.gstin ? customer.gstin.substring(0, 2) : '');
  const buyerGstin = customer?.gstin || '';

  const showConsignee = !!invoice.shipToAddress;
  const consigneeName = showConsignee ? customer?.companyName : '';
  const consigneeAddressStr = showConsignee && invoice.shipToAddress
    ? `${invoice.shipToAddress.line1}, ${invoice.shipToAddress.city} - ${invoice.shipToAddress.pincode}`
    : '';
  const consigneeState = showConsignee && invoice.shipToAddress ? invoice.shipToAddress.state : '';
  const consigneeStateCode = showConsignee && invoice.shipToAddress ? invoice.shipToAddress.stateCode : '';
  const consigneeGstin = showConsignee && invoice.shipToAddress ? invoice.shipToAddress.gstin : '';

  const subtotalVal = (invoice.items || []).reduce((acc, i) => acc + (i.quantity * i.rate), 0);
  const cgstVal = isSameState ? Number((subtotalVal * 0.09).toFixed(2)) : 0;
  const sgstVal = isSameState ? Number((subtotalVal * 0.09).toFixed(2)) : 0;
  const igstVal = !isSameState ? Number((subtotalVal * 0.18).toFixed(2)) : 0;
  const totalAmountVal = subtotalVal + cgstVal + sgstVal + igstVal;
  const amountInWords = convertNumberToRupeesInWords(totalAmountVal);

  const itemsRowsHtml = (invoice.items || []).map((item, idx) => {
    const activeParams = item.parameters
      ? Object.keys(item.parameters).filter(k => item.parameters[k] !== undefined && item.parameters[k] !== '')
      : [];
    const paramStr = activeParams.length > 0
      ? ' (' + activeParams.map(k => `${item.parameters[k]} ${k}`).join(' ') + ')'
      : '';
    const fullDesc = item.name + paramStr;
    const itemAmount = item.quantity * item.rate;

    return `
      <tr>
        <td style="border-right: 1px solid #cbd5e1; border-bottom: 1px solid #cbd5e1; padding: 6px; text-align: center; font-size: 10px; font-family: monospace; color: #94a3b8;">${idx + 1}</td>
        <td style="border-right: 1px solid #cbd5e1; border-bottom: 1px solid #cbd5e1; padding: 6px; font-size: 10px; text-align: left; font-weight: 600; color: #0f172a;">${fullDesc}</td>
        <td style="border-right: 1px solid #cbd5e1; border-bottom: 1px solid #cbd5e1; padding: 6px; font-size: 10px; text-align: center; font-family: monospace; color: #334155;">${item.hsnCode || 'N/A'}</td>
        <td style="border-right: 1px solid #cbd5e1; border-bottom: 1px solid #cbd5e1; padding: 6px; font-size: 10px; text-align: right; font-family: monospace; font-weight: 500; color: #0f172a;">${Number(item.quantity).toFixed(2)}</td>
        <td style="border-right: 1px solid #cbd5e1; border-bottom: 1px solid #cbd5e1; padding: 6px; font-size: 10px; text-align: center; color: #64748b;">${item.unit}</td>
        <td style="border-right: 1px solid #cbd5e1; border-bottom: 1px solid #cbd5e1; padding: 6px; font-size: 10px; text-align: right; font-family: monospace; color: #334155;">${Number(item.rate).toFixed(2)}</td>
        <td style="border-bottom: 1px solid #cbd5e1; padding: 6px; font-size: 10px; text-align: right; font-family: monospace; font-weight: 500; color: #0f172a;">${Number(itemAmount).toFixed(2)}</td>
      </tr>
    `;
  }).join('');

  // 3 different values of receipt_type merged in one PDF
  const receiptTypes = ["Original for Recipient", "Duplicate for Transporter", "Triplicate for Supplier"];

  const pagesHtml = receiptTypes.map((receiptType, pageIdx) => {
    return `
      <div class="invoice-container page-break" style="${pageIdx < 2 ? 'page-break-after: always;' : ''}">
        <div class="invoice-border-wrap">
          <!-- Header Title -->
          <div class="text-center border-bottom" style="font-size: 10px; padding: 6px 0; letter-spacing: 2px; font-weight: 300; color: #64748b; text-transform: uppercase;">
            Tax Invoice
          </div>

        <!-- Seller Information and Logo -->
        <div class="row border-bottom" style="padding: 12px 16px;">
          <div style="display: flex; align-items: center; width: 100%;">
            <div style="width: 150px; display: flex; align-items: center; justify-content: flex-start; flex-shrink: 0;">
              ${company.logo ? `
                <img src="${company.logo}" alt="Company Logo" style="max-height: 70px; max-width: 150px; width: auto; height: auto; object-fit: contain; display: block;" />
              ` : `
                <div class="logo-box" style="margin-right: 0;">
                  ${logoChar}
                </div>
              `}
            </div>
            <div style="flex-grow: 1; text-align: center; padding: 0 10px;">
              <div style="font-size: 18px; font-weight: 800; letter-spacing: -0.2px; color: #0f172a; text-transform: uppercase; line-height: 1.15;">${sellerCompanyName}</div>
              <div style="font-size: 8px; font-weight: 500; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; margin-top: 4px; line-height: 1.3;">${sellerSubtitle}</div>
              ${sellerAddressHtml}
              <div class="bold" style="font-size: 10px; font-family: 'JetBrains Mono', monospace; color: #1e293b; margin-top: 5px; letter-spacing: 0.5px;">GSTIN : ${sellerGstin}</div>
            </div>
            <div style="width: 150px; flex-shrink: 0;"></div>
          </div>
        </div>

        <!-- Contact details, sale type -->
        <div class="row border-bottom" style="font-size: 11px; color: #475569;">
          <div class="col-6 border-right" style="padding: 6px 10px; display: flex; flex-direction: column; justify-content: center;">
            <div><span style="color: #94a3b8; font-weight: 500;">Mobile :</span> <span style="font-family: 'JetBrains Mono', monospace; color: #334155;">${sellerMobile}</span></div>
            <div style="margin-top: 2px;"><span style="color: #94a3b8; font-weight: 500;">E-mail :</span> <span style="color: #334155;">${sellerEmail}</span></div>
          </div>
          <div class="col-6" style="padding: 6px 10px; display: flex; flex-direction: column; justify-content: space-between;">
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #94a3b8; font-weight: 500;">Sale Type :</span>
              <span style="font-family: 'JetBrains Mono', monospace; color: #334155;">${saleType}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-top: 2px;">
              <span style="color: #94a3b8; font-weight: 500;">Receipt Type :</span>
              <span style="font-weight: 600; color: #334155;">${receiptType}</span>
            </div>
          </div>
        </div>

        <!-- Invoice Details Grid -->
        <table style="width: 100%; border-collapse: collapse; table-layout: fixed; border-bottom: 1px solid #cbd5e1; font-size: 10px; color: #334155;">
          <tr style="border-bottom: 1px solid #cbd5e1;">
            <td style="width: 30%; border-right: 1px solid #cbd5e1; padding: 5px 8px; font-weight: 600; color: #475569; text-transform: uppercase; letter-spacing: 0.5px;">
              Invoice No. : <span style="font-family: 'JetBrains Mono', monospace; font-weight: 600; color: #0f172a; margin-left: 6px;">${invoice.invoiceNumber}</span>
            </td>
            <td style="width: 20%; border-right: 1px solid #cbd5e1; padding: 5px 8px; font-weight: 600; color: #475569; text-transform: uppercase; letter-spacing: 0.5px;">
              Date : <span style="font-family: 'JetBrains Mono', monospace; color: #0f172a; margin-left: 6px;">${invoice.date}</span>
            </td>
            <td style="width: 25%; border-right: 1px solid #cbd5e1; padding: 5px 8px; vertical-align: top;">
              <div style="color: #64748b; font-size: 8px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">e-Way Bill No</div>
              <div style="font-family: 'JetBrains Mono', monospace; font-weight: 600; color: #0f172a; margin-top: 2px;">${invoice.ewayBillNo || ''}</div>
            </td>
            <td style="width: 25%; padding: 5px 8px; vertical-align: top;">
              <div style="color: #64748b; font-size: 8px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Delivery Note</div>
              <div style="color: #334155; font-weight: 600; margin-top: 2px;">${invoice.deliveryNote || ''}</div>
            </td>
          </tr>
          <tr style="border-bottom: 1px solid #cbd5e1;">
            <td style="border-right: 1px solid #cbd5e1; padding: 5px 8px; font-weight: 600; color: #475569; text-transform: uppercase; letter-spacing: 0.5px;">
              Reference No. : <span style="font-family: 'JetBrains Mono', monospace; font-weight: 600; color: #0f172a; margin-left: 6px;">${invoice.referenceNumber || ''}</span>
            </td>
            <td style="border-right: 1px solid #cbd5e1; padding: 5px 8px; font-weight: 600; color: #475569; text-transform: uppercase; letter-spacing: 0.5px;">
              Date : <span style="font-family: 'JetBrains Mono', monospace; color: #0f172a; margin-left: 6px;">${invoice.referenceDate || ''}</span>
            </td>
            <td colspan="2" style="padding: 5px 8px; vertical-align: top;">
              <div style="color: #64748b; font-size: 8px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Mode/ Terms of payment</div>
              <div style="color: #334155; font-weight: 600; margin-top: 2px;">${invoice.paymentMode || ''}</div>
            </td>
          </tr>
          <tr style="border-bottom: 1px solid #cbd5e1;">
            <td style="border-right: 1px solid #cbd5e1; padding: 5px 8px; vertical-align: top;">
              <div style="color: #64748b; font-size: 8px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Dispatch Doc No</div>
              <div style="color: #334155; font-weight: 600; margin-top: 2px;">${invoice.dispatchDocNo || ''}</div>
            </td>
            <td style="border-right: 1px solid #cbd5e1; padding: 5px 8px; vertical-align: top;">
              <div style="color: #64748b; font-size: 8px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Through</div>
              <div style="color: #334155; font-weight: 600; margin-top: 2px;">${invoice.dispatchThrough || ''}</div>
            </td>
            <td colspan="2" style="padding: 5px 8px; vertical-align: top;">
              <div style="color: #64748b; font-size: 8px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Destination</div>
              <div style="color: #334155; font-weight: 600; margin-top: 2px;">${invoice.destination || ''}</div>
            </td>
          </tr>
          <tr>
            <td colspan="5" style="padding: 6px 8px; vertical-align: top;">
              <div style="color: #64748b; font-size: 8px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Terms of Delivery</div>
              <div style="color: #334155; margin-top: 4px; font-size: 10px; line-height: 1.4; white-space: pre-wrap;">${invoice.termsOfDelivery || ''}</div>
            </td>
          </tr>
        </table>

        <!-- Billed to & Shipped to -->
        <div class="row border-bottom">
          <div class="col-6 border-right">
            <div class="details-title">BILLED TO</div>
            <div class="details-content">
              <div>
                <div class="bold" style="font-size: 12px; margin-bottom: 4px; color: #0f172a;">${invoice.customerName}</div>
                <div style="white-space: pre-wrap; line-height: 1.5; color: #475569;">${buyerAddressStr}</div>
                <div style="margin-top: 8px; border-top: 1px solid #f1f5f9; padding-top: 6px;">
                  <div style="color: #64748b;">
                    <span>State :</span> <span style="color: #334155; font-weight: 500;">${buyerState}</span> &nbsp;&nbsp; 
                    <span>Code :</span> <span style="font-family: 'JetBrains Mono', monospace; color: #334155; font-weight: 500;">${buyerStateCode}</span>
                  </div>
                  <div style="margin-top: 3px; font-family: 'JetBrains Mono', monospace; color: #0f172a;" class="bold">GSTIN / UIN : ${buyerGstin}</div>
                </div>
              </div>
            </div>
          </div>
          <div class="col-6">
            <div class="details-title">SHIPPED TO</div>
            <div class="details-content">
              ${showConsignee ? `
                <div>
                  <div class="bold" style="font-size: 12px; margin-bottom: 4px; color: #0f172a;">${consigneeName}</div>
                  <div style="white-space: pre-wrap; line-height: 1.5; color: #475569;">${consigneeAddressStr}</div>
                  <div style="margin-top: 8px; border-top: 1px solid #f1f5f9; padding-top: 6px;">
                    <div style="color: #64748b;">
                      <span>State :</span> <span style="color: #334155; font-weight: 500;">${consigneeState}</span> &nbsp;&nbsp; 
                      <span>Code :</span> <span style="font-family: 'JetBrains Mono', monospace; color: #334155; font-weight: 500;">${consigneeStateCode}</span>
                    </div>
                    <div style="margin-top: 3px; font-family: 'JetBrains Mono', monospace; color: #0f172a;" class="bold">GSTIN / UIN : ${consigneeGstin}</div>
                  </div>
                </div>
              ` : `
                <div style="display: flex; align-items: center; justify-content: center; height: 100%; min-height: 85px; color: #94a3b8; font-style: italic; font-weight: 500; text-align: center;">
                  Consignee details same as billing (Details of Recipient)
                </div>
              `}
            </div>
          </div>
        </div>

        <!-- Products Table -->
        <table class="items-table">
          <thead>
            <tr>
              <th width="6%">Sl.No</th>
              <th width="48%">Description of Goods</th>
              <th width="10%">HSN Code</th>
              <th width="10%">Qnty</th>
              <th width="8%">Unit</th>
              <th width="8%">Rate</th>
              <th width="10%">Taxable Amount</th>
            </tr>
          </thead>
          <tbody style="color: #334155;">
            ${itemsRowsHtml}
          </tbody>
        </table>

        <!-- Table Totals, Tax Breakdowns -->
        <div class="row border-bottom">
          <!-- Left side -->
          <div class="border-right" style="width: 65%; display: flex; flex-direction: column; justify-content: space-between;">
            <!-- Amount in Words -->
            <div style="padding: 10px; border-bottom: 1px solid #cbd5e1; font-size: 11px; min-height: 45px;">
              <div class="bold" style="color: #94a3b8; text-transform: uppercase; font-size: 9px; letter-spacing: 1px; margin-bottom: 3px;">Amount in Words :</div>
              <div class="bold" style="font-size: 12px; color: #1e293b; line-height: 1.2;">${amountInWords}</div>
            </div>
            
            <!-- Bank Details -->
            <div style="padding: 10px; font-size: 11px;">
              <div class="bold" style="color: #94a3b8; font-size: 9px; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 6px;">BANK DETAILS</div>
              <table style="width: 100%; border-collapse: collapse; font-size: 11px; color: #475569;">
                <tr>
                  <td width="20%" style="color: #94a3b8; padding: 2px 0;">Bank Name</td>
                  <td width="30%" style="font-weight: 500; color: #1e293b; padding: 2px 0;">${company.bank_name || ''}</td>
                  <td width="15%" style="color: #94a3b8; padding: 2px 0; text-align: right; padding-right: 8px;">Branch</td>
                  <td width="35%" style="color: #334155; padding: 2px 0;">${company.branch || ''}</td>
                </tr>
                <tr>
                  <td style="color: #94a3b8; padding: 2px 0;">Account No</td>
                  <td style="font-family: 'JetBrains Mono', monospace; font-weight: 500; color: #1e293b; padding: 2px 0;">${company.account_number || ''}</td>
                  <td style="color: #94a3b8; padding: 2px 0; text-align: right; padding-right: 8px;">IFS Code</td>
                  <td style="font-family: 'JetBrains Mono', monospace; font-weight: 600; color: #1e293b; padding: 2px 0;">${company.ifsc_code || ''}</td>
                </tr>
              </table>
            </div>
          </div>

          <!-- Right side (Tax sums) -->
          <div style="width: 35%; font-size: 11px; color: #475569;">
            <div style="display: flex; justify-content: space-between; padding: 8px 12px; border-bottom: 1px solid #f1f5f9;">
              <span style="color: #94a3b8; font-weight: 500;">Sub Total</span>
              <span style="font-family: 'JetBrains Mono', monospace; font-weight: 500; color: #1e293b;">${subtotalVal.toFixed(2)}</span>
            </div>
            
            ${isSameState ? `
              <div style="display: flex; justify-content: space-between; padding: 6px 12px; border-bottom: 1px solid #f1f5f9; font-size: 10.5px;">
                <span style="color: #94a3b8; font-weight: 500;">CGST @ 9%</span>
                <span style="font-family: 'JetBrains Mono', monospace; color: #334155;">${cgstVal.toFixed(2)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; padding: 6px 12px; border-bottom: 1px solid #f1f5f9; font-size: 10.5px;">
                <span style="color: #94a3b8; font-weight: 500;">SGST @ 9%</span>
                <span style="font-family: 'JetBrains Mono', monospace; color: #334155;">${sgstVal.toFixed(2)}</span>
              </div>
            ` : `
              <div style="display: flex; justify-content: space-between; padding: 6px 12px; border-bottom: 1px solid #f1f5f9; font-size: 10.5px;">
                <span style="color: #94a3b8; font-weight: 500;">IGST @ 18%</span>
                <span style="font-family: 'JetBrains Mono', monospace; color: #334155;">${igstVal.toFixed(2)}</span>
              </div>
            `}

            <div style="display: flex; justify-content: space-between; padding: 10px 12px; font-size: 12px; background-color: #f8fafc;" class="bold">
              <span style="color: #0f172a;">Total Inv Amount :</span>
              <span style="font-family: 'JetBrains Mono', monospace; color: #0f172a;">₹${totalAmountVal.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <!-- Terms & Signature footer -->
        <div class="row" style="font-size: 10px;">
          <!-- Terms and Conditions -->
          <div class="border-right" style="width: 65%; padding: 10px; min-height: 85px; display: flex; flex-direction: column; justify-content: space-between;">
            <div>
              <div class="bold" style="color: #94a3b8; font-size: 9px; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 6px;">Terms & Conditions :</div>
              <ol style="margin: 0; padding-left: 0; list-style-type: none; color: #64748b; font-size: 10px; line-height: 1.5;">
                <li style="margin-bottom: 4px; display: flex; gap: 4px;"><span style="font-family: monospace; color: #94a3b8;">1.</span> <span>Interest will be charged @28% P.A. If not Paid on due date </span></li>
                <li style="margin-bottom: 4px; display: flex; gap: 4px;"><span style="font-family: monospace; color: #94a3b8;">2.</span> <span>All disputes are subject to Howrah Jurisdiction only</span></li>
                <li style="margin-bottom: 4px; display: flex; gap: 4px;"><span style="font-family: monospace; color: #94a3b8;">3.</span> <span>Please pay by A/C. Payee Cheque only</span></li>
              </ol>
            </div>
          </div>

          <!-- Signature block -->
          <div style="width: 35%; display: flex; flex-direction: column; justify-content: space-between; padding: 10px; text-align: center; min-height: 85px;">
            <div class="text-right" style="font-size: 9px; font-style: italic; margin-bottom: -5px; color: #94a3b8; font-family: monospace;">E. & O. E.</div>
            <div class="bold" style="font-size: 10px; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px;">For ${sellerCompanyName}</div>
            <div style="margin: 15px 0 5px 0; font-size: 9px; color: #94a3b8; font-family: monospace;"></div>
            <div class="bold" style="font-size: 9px; border-top: 1px dashed #cbd5e1; padding-top: 6px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px;">Authorized Signatory</div>
          </div>
        </div>
      </div>
    </div>
    `;
  }).join('');

  const fullHtmlContent = `
    <style>
      .invoice-container {
        width: 210mm;
        height: 295mm;
        padding: 10mm;
        box-sizing: border-box;
        page-break-after: always;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        background-color: #ffffff;
      }
      .invoice-border-wrap {
        border: 1px solid #cbd5e1;
        height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        box-sizing: border-box;
      }
      .invoice-container:last-child {
        page-break-after: avoid !important;
      }
      .text-center { text-align: center; }
      .text-right { text-align: right; }
      .bold { font-weight: 600; }
      
      .row {
        display: flex;
        width: 100%;
      }
      .col-6 {
        width: 50%;
        box-sizing: border-box;
      }
      .border-bottom { border-bottom: 1px solid #cbd5e1; }
      .border-right { border-right: 1px solid #cbd5e1; }
      
      .header-table {
        width: 100%;
        border-collapse: collapse;
      }
      .header-table td {
        padding: 5px 8px;
        font-size: 11px;
        vertical-align: middle;
      }
      
      .items-table {
        width: 100%;
        border-collapse: collapse;
        flex-grow: 1;
      }
      .items-table th {
        border-bottom: 1px solid #cbd5e1;
        border-right: 1px solid #cbd5e1;
        padding: 8px;
        font-size: 9px;
        text-transform: uppercase;
        font-weight: 600;
        color: #64748b;
        letter-spacing: 0.5px;
        background-color: #f8fafc;
      }
      .items-table th:last-child {
        border-right: none;
      }
      .items-table td {
        font-size: 10px;
        padding: 6px 8px;
        vertical-align: top;
      }
      
      .details-title {
        font-size: 9px;
        font-weight: 700;
        text-align: center;
        border-bottom: 1px solid #cbd5e1;
        padding: 4px 0;
        color: #64748b;
        letter-spacing: 1px;
        background-color: #f8fafc;
      }
      .details-content {
        padding: 10px;
        font-size: 11px;
        min-height: 85px;
      }
      
      .logo-box {
        background-color: #0f172a;
        color: #ffffff;
        border-radius: 50%;
        width: 54px;
        height: 54px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 22px;
        font-weight: 600;
        font-family: 'JetBrains Mono', monospace;
      }
    </style>
    <div style="background-color: #ffffff; width: 210mm; margin: 0 auto; box-sizing: border-box;">
      ${pagesHtml}
    </div>
  `;

  // Create a hidden wrapper div in the document flow with zero height/overflow hidden
  const renderDiv = document.createElement('div');
  renderDiv.style.height = '0px';
  renderDiv.style.overflow = 'hidden';
  renderDiv.style.position = 'absolute';
  renderDiv.style.top = '0';
  renderDiv.style.left = '0';

  const contentWrapper = document.createElement('div');
  contentWrapper.style.width = '210mm';
  contentWrapper.style.background = '#ffffff';
  contentWrapper.innerHTML = fullHtmlContent;

  renderDiv.appendChild(contentWrapper);
  document.body.appendChild(renderDiv);

  const opt = {
    margin: 0,
    filename: `${invoice.invoiceNumber}_${invoice.customerName}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    pagebreak: { mode: ['css', 'legacy'] }
  };

  return new Promise((resolve, reject) => {
    html2pdf()
      .set(opt)
      .from(contentWrapper)
      .toPdf()
      .output('blob')
      .then((pdfBlob: any) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (document.body.contains(renderDiv)) {
            document.body.removeChild(renderDiv);
          }
          resolve(reader.result as string);
        };
        reader.onerror = (err) => {
          if (document.body.contains(renderDiv)) {
            document.body.removeChild(renderDiv);
          }
          reject(err);
        };
        reader.readAsDataURL(pdfBlob);
      })
      .catch((err: any) => {
        if (document.body.contains(renderDiv)) {
          document.body.removeChild(renderDiv);
        }
        reject(err);
      });
  });
}
