const prisma = require('../db');

exports.getDashboardMetrics = async (req, res) => {
  try {
    // Basic Counts
    const total_requests = await prisma.maintenance_requests.count();
    
    // Status metrics
    const request_statuses = await prisma.request_statuses.findMany({
      include: {
        _count: {
          select: { maintenance_requests: true }
        }
      }
    });

    const requests_by_status = request_statuses.map(s => ({
      name: s.status_name,
      value: s._count.maintenance_requests
    }));

    const open_requests = requests_by_status.find(s => s.name === 'Open')?.value || 0;
    const in_progress_requests = requests_by_status.find(s => s.name === 'In Progress')?.value || 0;

    // Priority metrics
    const priority_levels = await prisma.priority_levels.findMany({
      include: {
        _count: {
          select: { maintenance_requests: true }
        }
      }
    });

    const requests_by_priority = priority_levels.map(p => ({
      name: p.priority_name,
      value: p._count.maintenance_requests
    }));

    // Recent requests
    const recent_requests = await prisma.maintenance_requests.findMany({
      take: 5,
      orderBy: { created_at: 'desc' },
      include: {
        request_statuses: { select: { status_name: true } },
        priority_levels: { select: { priority_name: true } },
        users_maintenance_requests_requester_user_idTousers: { select: { full_name: true } },
        branches: { select: { branch_name: true } },
        assets: { select: { tag_number: true } }
      }
    });

    // PM metrics
    const total_pm_schedules = await prisma.preventive_maintenance_schedules.count();
    const pending_pm_approvals = await prisma.preventive_maintenance_logs.count({
      where: { status: 'Pending Approval' }
    });

    // Asset metrics
    const total_assets = await prisma.assets.count();
    
    res.json({
      kpis: {
        total_requests,
        open_requests,
        in_progress_requests,
        total_assets,
        total_pm_schedules,
        pending_pm_approvals
      },
      requests_by_status,
      requests_by_priority,
      recent_requests
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};
