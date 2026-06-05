const prisma = require('../db');

exports.getRequests = async (req, res) => {
  try {
    const requests = await prisma.maintenance_requests.findMany({
      include: {
        request_statuses: { select: { status_name: true } },
        priority_levels: { select: { priority_name: true } }
      },
      orderBy: { request_date: 'desc' },
      take: 100
    });
    
    // Map data to match frontend expectation
    const formatted = requests.map(r => ({
      request_id: r.request_id,
      request_code: r.request_code,
      problem_description: r.problem_description,
      request_date: r.request_date,
      status_name: r.request_statuses?.status_name,
      priority_name: r.priority_levels?.priority_name
    }));
    
    res.json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.createRequest = async (req, res) => {
  const { 
    requester_user_id, branch_id, district, due_date, 
    category_id, asset_id, priority_id, problem_description 
  } = req.body;

  try {
    if (!requester_user_id || !branch_id || !category_id || !priority_id || !problem_description) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const request = await prisma.maintenance_requests.create({
      data: {
        requester_user_id: parseInt(requester_user_id),
        branch_id: parseInt(branch_id),
        district: district || null,
        due_date: due_date ? new Date(due_date) : null,
        category_id: parseInt(category_id),
        asset_id: asset_id ? parseInt(asset_id) : null,
        priority_id: parseInt(priority_id),
        problem_description,
        status_id: 1 // Default to Open
      }
    });
    res.status(201).json(request);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error while creating request' });
  }
};
