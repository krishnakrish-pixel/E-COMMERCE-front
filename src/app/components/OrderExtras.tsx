import React, { useState } from 'react';
import { Clock, RotateCcw, CheckCircle2, XCircle, CircleDot } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { useOrders, Order } from '../context/OrderContext';

const RETURN_DAYS = 7;

/** Real history of the order: every status change with its time (replaces the old made-up transit log). */
export function OrderTimeline({ order }: { order: Order }) {
  const events = order.history && order.history.length > 0
    ? order.history
    : [{ status: 'pending', note: 'Order placed', createdAt: order.createdAt }];
  const colour = (s: string) =>
    s === 'cancelled' ? 'text-red-500' : s === 'delivered' ? 'text-emerald-600' : 'text-[#1b5d4e]';

  return (
    <Card className="rounded-2xl border border-gray-100 shadow-xs bg-white">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <Clock className="h-5 w-5 text-[#1b5d4e]" />
          Order Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ol className="relative border-l-2 border-gray-100 ml-2 space-y-5">
          {[...events].reverse().map((e, i) => (
            <li key={i} className="ml-5">
              <span className={`absolute -left-[9px] bg-white ${colour(e.status)}`}>
                <CircleDot className="h-4 w-4" />
              </span>
              <p className="text-sm font-semibold text-gray-900">{e.note}</p>
              <p className="text-xs text-gray-500">{format(new Date(e.createdAt), 'MMM d, yyyy · h:mm a')}</p>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}

/** Return request for the customer (delivered orders, 7 days) and the outcome once the store decides. */
export function ReturnSection({ order, isOwner }: { order: Order; isOwner: boolean }) {
  const { requestReturn } = useOrders();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [sending, setSending] = useState(false);

  const deliveredAt = (order.history || [])
    .filter((h) => h.status === 'delivered' && h.note === 'Delivered')
    .map((h) => new Date(h.createdAt).getTime())
    .pop() ?? new Date(order.updatedAt).getTime();
  const daysLeft = Math.ceil((deliveredAt + RETURN_DAYS * 86400000 - Date.now()) / 86400000);
  const canRequest = isOwner && order.status === 'delivered' && !order.returnStatus && daysLeft > 0;

  if (!order.returnStatus && !canRequest) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (reason.trim().length < 5) return toast.error('Please tell us why (at least 5 characters)');
    setSending(true);
    const ok = await requestReturn(order.id, reason);
    setSending(false);
    if (ok) {
      toast.success('Return request sent');
      setOpen(false);
      setReason('');
    }
  };

  const status = order.returnStatus;
  return (
    <Card className="rounded-2xl border border-gray-100 shadow-xs bg-white">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <RotateCcw className="h-5 w-5 text-[#1b5d4e]" />
          Returns
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {status ? (
          <>
            <div className="flex items-center gap-2">
              {status === 'requested' && <Badge className="bg-amber-100 text-amber-800 border-none">Return requested</Badge>}
              {status === 'approved' && <Badge className="bg-emerald-100 text-emerald-800 border-none gap-1"><CheckCircle2 className="h-3 w-3" /> Return approved</Badge>}
              {status === 'rejected' && <Badge className="bg-red-100 text-red-700 border-none gap-1"><XCircle className="h-3 w-3" /> Return declined</Badge>}
            </div>
            {order.returnReason && <p className="text-sm text-gray-600">Reason: {order.returnReason}</p>}
            {status === 'requested' && <p className="text-xs text-gray-500">The store will review your request soon.</p>}
            {status === 'approved' && <p className="text-xs text-gray-500">Your refund of ₹{order.total.toFixed(2)} has been initiated.</p>}
          </>
        ) : !open ? (
          <>
            <p className="text-sm text-gray-600">
              Not happy with your order? You can request a return for {daysLeft} more {daysLeft === 1 ? 'day' : 'days'}.
            </p>
            <Button variant="outline" className="rounded-xl" onClick={() => setOpen(true)}>Request a return</Button>
          </>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <Textarea value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} placeholder="Why are you returning this order?" required />
            <div className="flex gap-2">
              <Button type="submit" disabled={sending} className="rounded-xl bg-[#1b5d4e] hover:bg-[#14473b] text-white">{sending ? 'Sending...' : 'Send request'}</Button>
              <Button type="button" variant="outline" className="rounded-xl" onClick={() => setOpen(false)}>Cancel</Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
