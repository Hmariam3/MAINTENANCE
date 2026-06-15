const prisma = require('../db');
const { ROLES } = require('../constants/roles');

// ─── SCHEDULES ────────────────────────────────────────────────────────────────

exports.getSchedules = async (req, res) => {
  try {
    const { user_id, role_id } = req.user;
    
    let whereClause = {};
    if (role_id === ROLES.TECHNICIAN) {
      whereClause.assigned_technician_id = user_id;
    }

    const schedules = await prisma.preventive_maintenance_schedules.findMany({
      where: whereClause,
      include: {
        branches: true,
        asset_categories: true,
        assets: true,
      },
      orderBy: { created_at: 'desc' }
    });

    res.json(schedules);
  } catch (error) {
    console.error('Error fetching PM schedules:', error);
    res.status(500).json({ error: 'Failed to fetch schedules.' });
  }
};

exports.createSchedule = async (req, res) => {
  try {
    const { user_id } = req.user;
    const {
      schedule_name,
      branch_id,
      category_id,
      asset_id,
      frequency_type,
      next_due_date,
      assigned_technician_id
    } = req.body;

    // Based on user feedback: "it's better if they specify particular asset after they select the branch"
    if (!asset_id) {
       return res.status(400).json({ error: 'Asset must be specified.' });
    }

    const asset = await prisma.assets.findUnique({
      where: { asset_id: parseInt(asset_id) }
    });

    const schedule = await prisma.preventive_maintenance_schedules.create({
      data: {
        schedule_name,
        branch_id: branch_id ? parseInt(branch_id) : null,
        category_id: category_id ? parseInt(category_id) : null,
        asset_id: asset_id ? parseInt(asset_id) : null,
        frequency_type,
        next_due_date: next_due_date ? new Date(next_due_date) : null,
        requester_user_id: user_id,
        assigned_technician_id: assigned_technician_id ? parseInt(assigned_technician_id) : user_id,
        brand: asset?.brand || null,
        model: asset?.model || null,
        serial_number: asset?.serial_number || null,
        tag_number: asset?.tag_number || null,
        ip_address: asset?.ip_address || null,
      }
    });

    res.status(201).json(schedule);
  } catch (error) {
    console.error('Error creating PM schedule:', error);
    res.status(500).json({ error: 'Failed to create schedule.' });
  }
};

// ─── LOGS / APPROVALS ─────────────────────────────────────────────────────────

exports.getLogs = async (req, res) => {
  try {
    const { user_id, role_id, branch_id } = req.user;
    
    let whereClause = {};
    
    // Supervisors see logs for their branch
    if (role_id === ROLES.SUPERVISOR) {
       whereClause = {
         preventive_maintenance_schedules: {
           branch_id: branch_id
         }
       };
    } else if (role_id === ROLES.TECHNICIAN) {
       // Technicians see logs they performed
       whereClause.performed_by_user_id = user_id;
    }

    const logs = await prisma.preventive_maintenance_logs.findMany({
      where: whereClause,
      include: {
        preventive_maintenance_schedules: {
           include: { branches: true, assets: true }
        },
        users_preventive_maintenance_logs_performed_by_user_idTousers: { select: { full_name: true } },
        users_preventive_maintenance_logs_supervisor_user_idTousers: { select: { full_name: true } }
      },
      orderBy: { performed_date: 'desc' }
    });

    res.json(logs);
  } catch (error) {
    console.error('Error fetching PM logs:', error);
    res.status(500).json({ error: 'Failed to fetch logs.' });
  }
};

exports.createLog = async (req, res) => {
  try {
    const { user_id } = req.user;
    const { schedule_id, notes, next_scheduled_date } = req.body;

    const log = await prisma.preventive_maintenance_logs.create({
      data: {
        schedule_id: parseInt(schedule_id),
        performed_by_user_id: user_id,
        notes,
        next_scheduled_date: next_scheduled_date ? new Date(next_scheduled_date) : null,
        status: "Pending Approval"
      }
    });

    res.status(201).json(log);
  } catch (error) {
    console.error('Error creating PM log:', error);
    res.status(500).json({ error: 'Failed to create log.' });
  }
};

exports.approveLog = async (req, res) => {
  try {
    const { user_id } = req.user;
    const { id } = req.params;
    const { status, supervisor_notes } = req.body; // status can be 'Approved' or 'Rejected'

    if (!['Approved', 'Rejected'].includes(status)) {
       return res.status(400).json({ error: 'Invalid status' });
    }

    const log = await prisma.preventive_maintenance_logs.update({
      where: { log_id: parseInt(id) },
      data: {
        status,
        supervisor_user_id: user_id,
        supervisor_approved_at: new Date(),
        supervisor_notes
      }
    });

    res.json(log);
  } catch (error) {
    console.error('Error approving PM log:', error);
    res.status(500).json({ error: 'Failed to update log approval.' });
  }
};
