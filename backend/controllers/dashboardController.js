const prisma = require('../db');

exports.getDashboardMetrics = async (req, res) => {
  try {
    const total_requests = await prisma.maintenance_requests.count();
    const open_requests = await prisma.maintenance_requests.count({
      where: {
        request_statuses: {
          status_name: 'Open'
        }
      }
    });
    const total_assets = await prisma.assets.count();
    
    res.json({
      total_requests,
      open_requests,
      total_assets
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};
