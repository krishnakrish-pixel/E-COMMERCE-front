import type { Order } from '../context/OrderContext';

const esc = (v: unknown) =>
  String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));

const money = (n: number) => `₹${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const PAYMENT: Record<string, string> = { card: 'Credit / Debit Card', upi: 'UPI', cod: 'Cash on Delivery' };

/** Opens a clean invoice in a new tab and starts the browser's print dialog (choose "Save as PDF" to keep a copy). */
export function printInvoice(order: Order): boolean {
  const w = window.open('', '_blank');
  if (!w) return false;                       // pop-up blocked

  const rows = order.items
    .map(
      (i) => `<tr><td>${esc(i.name)}</td><td class="r">${i.quantity}</td><td class="r">${money(i.price)}</td><td class="r">${money(i.price * i.quantity)}</td></tr>`
    )
    .join('');
  const a = order.shippingAddress;
  const discount = Number(order.discount ?? 0);

  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Invoice #${esc(order.orderNumber)}</title>
<style>
 body{font-family:Arial,Helvetica,sans-serif;color:#111;margin:40px;max-width:760px}
 h1{margin:0;color:#1b5d4e} .muted{color:#666;font-size:13px}
 table{width:100%;border-collapse:collapse;margin-top:24px} th,td{padding:10px 8px;border-bottom:1px solid #e5e5e5;text-align:left;font-size:14px}
 th{background:#f5f5f4;font-size:12px;text-transform:uppercase;letter-spacing:.04em} .r{text-align:right}
 .tot td{border:none;padding:4px 8px} .grand td{font-weight:bold;font-size:16px;border-top:2px solid #111;padding-top:10px}
 .head{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px}
 @media print{body{margin:16px}}
</style></head><body>
 <div class="head">
  <div><h1>ShopHub</h1><div class="muted">Tax invoice</div></div>
  <div class="r"><strong>Invoice #${esc(order.orderNumber)}</strong><div class="muted">${esc(new Date(order.createdAt).toLocaleString('en-IN'))}</div>
  <div class="muted">Status: ${esc(order.status)}</div></div>
 </div>
 <div><strong>Ship to</strong><div class="muted">${esc(a.firstName)} ${esc(a.lastName)}<br>${esc(a.address)}<br>${esc(a.city)} ${esc(a.zipCode)}<br>${esc(a.country)}</div></div>
 <div style="margin-top:12px" class="muted">Payment: ${esc(PAYMENT[order.paymentMethod || 'card'] || order.paymentMethod)}${order.trackingNumber ? ` &nbsp;|&nbsp; Tracking: ${esc(order.trackingNumber)}` : ''}</div>
 <table><thead><tr><th>Item</th><th class="r">Qty</th><th class="r">Price</th><th class="r">Amount</th></tr></thead><tbody>${rows}</tbody></table>
 <table class="tot" style="width:320px;margin-left:auto"><tbody>
  <tr><td>Subtotal</td><td class="r">${money(order.subtotal)}</td></tr>
  ${discount > 0 ? `<tr><td>Discount${order.couponCode ? ` (${esc(order.couponCode)})` : ''}</td><td class="r">-${money(discount)}</td></tr>` : ''}
  <tr><td>Shipping</td><td class="r">${order.shipping === 0 ? 'Free' : money(order.shipping)}</td></tr>
  <tr><td>Tax (10%)</td><td class="r">${money(order.tax)}</td></tr>
  <tr class="grand"><td>Total</td><td class="r">${money(order.total)}</td></tr>
 </tbody></table>
 <p class="muted" style="margin-top:40px">Thank you for shopping with ShopHub.</p>
 <script>window.onload=function(){setTimeout(function(){window.print()},250)}</script>
</body></html>`);
  w.document.close();
  return true;
}
