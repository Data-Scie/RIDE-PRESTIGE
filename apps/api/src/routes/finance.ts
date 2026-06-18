import { Router, Request, Response } from 'express';
import PDFDocument from 'pdfkit';
import { authenticate, requireRole } from '../middleware/auth';
import { prisma } from '../lib/db';

const router = Router();
router.use(authenticate, requireRole('admin', 'ops'));

function dateFilter(dateFrom?: string, dateTo?: string) {
  if (!dateFrom && !dateTo) return {};
  return {
    ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
    ...(dateTo ? { lte: new Date(`${dateTo}T23:59:59.999Z`) } : {}),
  };
}

function toCsv(rows: Record<string, unknown>[]): string {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown) => {
    const s = v === null || v === undefined ? '' : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers.join(','), ...rows.map(row => headers.map(h => escape(row[h])).join(','))].join('\n');
}

function sendPdfTable(res: Response, title: string, rows: Record<string, unknown>[]) {
  const doc = new PDFDocument({ margin: 40, size: 'A4' });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${title.replace(/\s+/g, '-').toLowerCase()}.pdf"`);
  doc.pipe(res);
  doc.fontSize(16).text(title, { underline: true });
  doc.moveDown();
  if (!rows.length) {
    doc.fontSize(10).text('No records found for the selected filters.');
  } else {
    const headers = Object.keys(rows[0]);
    doc.fontSize(8);
    doc.text(headers.join('  |  '));
    doc.moveDown(0.5);
    for (const row of rows) {
      doc.text(headers.map(h => String(row[h] ?? '')).join('  |  '));
    }
  }
  doc.end();
}

function respondExport(req: Request, res: Response, title: string, rows: Record<string, unknown>[]) {
  const format = (req.query.format as string) ?? 'json';
  if (format === 'csv') {
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${title.replace(/\s+/g, '-').toLowerCase()}.csv"`);
    res.send(toCsv(rows));
    return true;
  }
  if (format === 'pdf') {
    sendPdfTable(res, title, rows);
    return true;
  }
  return false;
}

// ─── Revenue summary ────────────────────────────────────────────────────────

router.get('/revenue', async (_req: Request, res: Response) => {
  try {
    const now = new Date();
    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(dayStart.getTime() - dayStart.getDay() * 86400000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const yearStart = new Date(now.getFullYear(), 0, 1);

    const completedWhere = (gte: Date) => ({ status: 'completed', completedAt: { gte } });
    const [daily, weekly, monthly, annual, allTime, commissionAllTime] = await Promise.all([
      prisma.job.aggregate({ _sum: { fareAmount: true }, where: completedWhere(dayStart) }),
      prisma.job.aggregate({ _sum: { fareAmount: true }, where: completedWhere(weekStart) }),
      prisma.job.aggregate({ _sum: { fareAmount: true }, where: completedWhere(monthStart) }),
      prisma.job.aggregate({ _sum: { fareAmount: true }, where: completedWhere(yearStart) }),
      prisma.job.aggregate({ _sum: { fareAmount: true }, where: { status: 'completed' } }),
      prisma.job.aggregate({ _sum: { commissionAmount: true }, where: { status: 'completed' } }),
    ]);
    const round = (n: number | null) => parseFloat((n ?? 0).toFixed(2));
    res.json({
      success: true,
      data: {
        dailyRevenue: round(daily._sum.fareAmount),
        weeklyRevenue: round(weekly._sum.fareAmount),
        monthlyRevenue: round(monthly._sum.fareAmount),
        annualRevenue: round(annual._sum.fareAmount),
        totalRevenue: round(allTime._sum.fareAmount),
        totalRpCommission: round(commissionAllTime._sum.commissionAmount),
      },
    });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

// ─── Booking payments ───────────────────────────────────────────────────────

router.get('/payments', async (req: Request, res: Response) => {
  try {
    const { status, customerId, dateFrom, dateTo, page = '1', limit = '50', format } = req.query as Record<string, string>;
    const where = {
      ...(status ? { status } : {}),
      ...(customerId ? { customerId } : {}),
      ...(dateFrom || dateTo ? { createdAt: dateFilter(dateFrom, dateTo) } : {}),
    };
    const rows = await prisma.payment.findMany({ where, orderBy: { createdAt: 'desc' } });
    if (format && respondExport(req, res, 'Booking Payments', rows.map(r => ({
      reference: r.bookingRef, customer: r.customerName, amount: r.amount, method: r.method, status: r.status, paidAt: r.paidAt?.toISOString() ?? '',
    })))) return;
    const p = parseInt(page); const l = parseInt(limit);
    const total = rows.length;
    res.json({ success: true, data: rows.slice((p - 1) * l, p * l), total, page: p, pages: Math.ceil(total / l) });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

// ─── Affiliate & driver earnings ────────────────────────────────────────────

router.get('/earnings', async (req: Request, res: Response) => {
  try {
    const { entityType, entityId, status, dateFrom, dateTo, format } = req.query as Record<string, string>;
    const where = {
      ...(entityType ? { entityType } : {}),
      ...(entityId ? { entityId } : {}),
      ...(status ? { status } : {}),
      ...(dateFrom || dateTo ? { date: dateFilter(dateFrom, dateTo) } : {}),
    };
    const entries = await prisma.earningEntry.findMany({ where, orderBy: { date: 'desc' } });
    const affiliateIds = [...new Set(entries.filter(e => e.entityType === 'affiliate').map(e => e.entityId))];
    const driverIds = [...new Set(entries.filter(e => e.entityType === 'driver').map(e => e.entityId))];
    const [affiliates, drivers] = await Promise.all([
      prisma.affiliate.findMany({ where: { id: { in: affiliateIds } }, select: { id: true, companyName: true } }),
      prisma.driver.findMany({ where: { id: { in: driverIds } }, select: { id: true, fullName: true } }),
    ]);
    const nameById = new Map<string, string>([
      ...affiliates.map((a): [string, string] => [a.id, a.companyName]),
      ...drivers.map((d): [string, string] => [d.id, d.fullName]),
    ]);
    const shaped = entries.map(e => ({ ...e, entityName: nameById.get(e.entityId) ?? e.entityId }));
    if (format && respondExport(req, res, 'Earnings', shaped.map(e => ({
      bookingRef: e.bookingRef, entityType: e.entityType, entityName: e.entityName, gross: e.grossAmount, commission: e.commissionDeducted, net: e.netAmount, status: e.status, date: e.date.toISOString(),
    })))) return;
    res.json({ success: true, data: shaped, total: shaped.length });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

// ─── Company financials ─────────────────────────────────────────────────────

router.get('/company', async (_req: Request, res: Response) => {
  try {
    const [commissionAgg, revenueAgg, payoutAgg] = await Promise.all([
      prisma.job.aggregate({ _sum: { commissionAmount: true }, where: { status: 'completed' } }),
      prisma.job.aggregate({ _sum: { fareAmount: true }, where: { status: 'completed' } }),
      prisma.earningEntry.aggregate({ _sum: { netAmount: true } }),
    ]);
    const round = (n: number | null) => parseFloat((n ?? 0).toFixed(2));
    const operationalRevenue = round(revenueAgg._sum.fareAmount) - round(payoutAgg._sum.netAmount);
    res.json({
      success: true,
      data: {
        rpCommission: round(commissionAgg._sum.commissionAmount),
        grossTurnover: round(revenueAgg._sum.fareAmount),
        totalPayouts: round(payoutAgg._sum.netAmount),
        operationalRevenue: parseFloat(operationalRevenue.toFixed(2)),
      },
    });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

export default router;
