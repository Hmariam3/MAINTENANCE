const prisma = require('../db');
const { ROLES, STATUS, STATUS_UPDATE_ALLOWED, CATEGORY_DETAIL_TYPE } = require('../constants/roles');

// ─── Shared include — all related tables ────────────────────────────────────
const REQUEST_INCLUDE = {
  request_statuses: { select: { status_name: true } },
  priority_levels: { select: { priority_name: true } },
  assets: {
    select: {
      asset_number: true, tag_number: true, brand: true,
      model: true, serial_number: true, ip_address: true
    }
  },
  asset_categories: { select: { category_name: true } },
  branches: { select: { branch_name: true } },
  users_maintenance_requests_requester_user_idTousers: { select: { user_id: true, full_name: true, email: true } },
  users_maintenance_requests_supervisor_user_idTousers: { select: { user_id: true, full_name: true } },
  users_maintenance_requests_assigned_technician_idTousers: { select: { user_id: true, full_name: true } },
  users_maintenance_requests_assigned_by_user_idTousers: { select: { user_id: true, full_name: true } },
  // Category-specific maintenance detail tables
  electrical_maintenance_details: true,
  generator_maintenance_details: true,
  hardware_maintenance_details: true,
  // Sub-flow tables
  request_on_hold_details: {
    include: {
      on_hold_reasons: { select: { reason_text: true } },
      responsible_party_types: { select: { party_name: true } },
      users: { select: { full_name: true } },
    },
    orderBy: { hold_start_date: 'desc' },
  },
  request_disposal_details: {
    include: {
      users_request_disposal_details_checked_by_user_idTousers: { select: { full_name: true } },
      users_request_disposal_details_approved_by_user_idTousers: { select: { full_name: true } },
    },
    orderBy: { disposal_id: 'desc' },
  },
  request_resolution_details: {
    include: { users: { select: { full_name: true } } },
  },
};

// ─── Format flat response ───────────────────────────────────────────────────
function formatRequest(r) {
  return {
    request_id: r.request_id,
    request_code: r.request_code,
    problem_description: r.problem_description,
    request_date: r.request_date,
    due_date: r.due_date,
    completion_date: r.completion_date,
    district: r.district,
    status_id: r.status_id,
    status_name: r.request_statuses?.status_name,
    priority_id: r.priority_id,
    priority_name: r.priority_levels?.priority_name,
    branch_name: r.branches?.branch_name,
    category_id: r.category_id,
    category_name: r.asset_categories?.category_name,
    asset_id: r.asset_id,
    asset_tag: r.assets?.tag_number,
    asset_brand: r.assets?.brand,
    asset_model: r.assets?.model,
    asset_serial: r.assets?.serial_number,
    asset_ip: r.assets?.ip_address,
    requester_user_id: r.requester_user_id,
    requester_name: r.users_maintenance_requests_requester_user_idTousers?.full_name,
    requester_email: r.users_maintenance_requests_requester_user_idTousers?.email,
    supervisor_user_id: r.supervisor_user_id,
    supervisor_name: r.users_maintenance_requests_supervisor_user_idTousers?.full_name,
    supervisor_approved_at: r.supervisor_approved_at,
    assigned_technician_id: r.assigned_technician_id,
    assigned_technician_name: r.users_maintenance_requests_assigned_technician_idTousers?.full_name,
    assigned_by_user_id: r.assigned_by_user_id,
    assigned_by_name: r.users_maintenance_requests_assigned_by_user_idTousers?.full_name,
    assigned_at: r.assigned_at,
    user_approved_closure_at: r.user_approved_closure_at,
    user_approved_by_id: r.user_approved_by_id,
    created_at: r.created_at,
    updated_at: r.updated_at,
    // Detail tables
    hardware_details: r.hardware_maintenance_details || null,
    generator_details: r.generator_maintenance_details || null,
    electrical_details: r.electrical_maintenance_details || null,
    on_hold_details: r.request_on_hold_details || [],
    disposal_details: r.request_disposal_details || [],
    resolution_details: r.request_resolution_details || null,
  };
}

// ─── Helper: create category-specific detail record inside a transaction ─────
async function createTypeDetail(tx, requestId, categoryId, typeDetails) {
  const detailType = CATEGORY_DETAIL_TYPE[categoryId];
  if (!detailType || !typeDetails) return;

  if (detailType === 'hardware') {
    await tx.hardware_maintenance_details.create({
      data: {
        request_id: requestId,
        hardware_type: typeDetails.hardware_type || null,
        brand: typeDetails.brand || null,
        model: typeDetails.model || null,
        serial_number: typeDetails.serial_number || null,
        tag_number: typeDetails.tag_number || null,
        quantity: typeDetails.quantity ? parseInt(typeDetails.quantity) : 1,
        ip_address: typeDetails.ip_address || null,
      },
    });
  } else if (detailType === 'generator') {
    await tx.generator_maintenance_details.create({
      data: {
        request_id: requestId,
        generator_category: typeDetails.generator_category || null,
        brand: typeDetails.brand || null,
        model: typeDetails.model || null,
        engine_serial_number: typeDetails.engine_serial_number || null,
        engine_model: typeDetails.engine_model || null,
        tag_number: typeDetails.tag_number || null,
        engine_running_hours: typeDetails.engine_running_hours
          ? parseFloat(typeDetails.engine_running_hours)
          : null,
      },
    });
  } else if (detailType === 'electrical') {
    await tx.electrical_maintenance_details.create({
      data: {
        request_id: requestId,
        maintenance_type: typeDetails.maintenance_type || null,
        sub_category: typeDetails.sub_category || null,
        quantity: typeDetails.quantity ? parseInt(typeDetails.quantity) : 1,
        serial_number: typeDetails.serial_number || null,
        model: typeDetails.model || null,
        tag_number: typeDetails.tag_number || null,
      },
    });
  }
}

// ════════════════════════════════════════════════════════════════════════════
// CRUD
// ════════════════════════════════════════════════════════════════════════════

// ─── GET ALL (role-filtered) ────────────────────────────────────────────────
exports.getRequests = async (req, res) => {
  try {
    const { role_id, user_id, branch_id } = req.user;
    let where = {};

    switch (role_id) {
      case ROLES.REQUESTER: where.requester_user_id = user_id; break;
      case ROLES.SUPERVISOR: where.branch_id = branch_id; break;
      case ROLES.TECHNICIAN: where.assigned_technician_id = user_id; break;
    }

    const requests = await prisma.maintenance_requests.findMany({
      where,
      include: REQUEST_INCLUDE,
      orderBy: { request_date: 'desc' },
      take: 300,
    });

    res.json(requests.map(formatRequest));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error fetching requests' });
  }
};

// ─── GET SINGLE ─────────────────────────────────────────────────────────────
exports.getRequestById = async (req, res) => {
  try {
    const request = await prisma.maintenance_requests.findUnique({
      where: { request_id: parseInt(req.params.id) },
      include: REQUEST_INCLUDE,
    });
    if (!request) return res.status(404).json({ error: 'Request not found' });
    res.json(formatRequest(request));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// ─── CREATE (with optional category-specific type_details) ──────────────────
exports.createRequest = async (req, res) => {
  const {
    requester_user_id, branch_id, district, due_date,
    category_id, asset_id, priority_id, problem_description,
    type_details,
  } = req.body;

  try {
    if (!requester_user_id || !branch_id || !category_id || !priority_id || !problem_description) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const catId = parseInt(category_id);

    const newRequest = await prisma.$transaction(async (tx) => {
      const created = await tx.maintenance_requests.create({
        data: {
          requester_user_id: parseInt(requester_user_id),
          branch_id: parseInt(branch_id),
          district: district || null,
          due_date: due_date ? new Date(due_date) : null,
          category_id: catId,
          asset_id: asset_id ? parseInt(asset_id) : null,
          priority_id: parseInt(priority_id),
          problem_description,
          status_id: STATUS.OPEN,
        },
      });

      // Create category-specific detail record if type_details provided
      await createTypeDetail(tx, created.request_id, catId, type_details);

      return created;
    });

    res.status(201).json(newRequest);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error while creating request' });
  }
};

// ════════════════════════════════════════════════════════════════════════════
// WORKFLOW ACTIONS
// ════════════════════════════════════════════════════════════════════════════

// ─── APPROVE (Supervisor / Manager / Director) ───────────────────────────────
exports.approveRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id } = req.user;

    const request = await prisma.maintenance_requests.findUnique({ where: { request_id: parseInt(id) } });
    if (!request) return res.status(404).json({ error: 'Request not found' });
    if (request.supervisor_approved_at) return res.status(400).json({ error: 'Already approved' });
    if (request.status_id !== STATUS.OPEN) return res.status(400).json({ error: 'Only Open requests can be approved' });

    await prisma.maintenance_requests.update({
      where: { request_id: parseInt(id) },
      data: { supervisor_user_id: user_id, supervisor_approved_at: new Date() },
    });
    res.json({ message: 'Request approved successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// ─── APPROVE CLOSURE (Supervisor / Manager / Director) ────────────────────────
exports.approveClosure = async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id } = req.user;

    const request = await prisma.maintenance_requests.findUnique({ where: { request_id: parseInt(id) } });
    if (!request) return res.status(404).json({ error: 'Request not found' });
    if (request.status_id !== STATUS.COMPLETED) return res.status(400).json({ error: 'Only Completed requests can be closed' });
    if (request.user_approved_closure_at) return res.status(400).json({ error: 'Already closed' });

    await prisma.maintenance_requests.update({
      where: { request_id: parseInt(id) },
      data: { user_approved_by_id: user_id, user_approved_closure_at: new Date() },
    });
    res.json({ message: 'Closure approved successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// ─── ASSIGN TECHNICIAN (Helpdesk / Manager / Director) ──────────────────────
exports.assignRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { technician_id } = req.body;
    const { user_id } = req.user;

    if (!technician_id) return res.status(400).json({ error: 'technician_id is required' });

    const request = await prisma.maintenance_requests.findUnique({ where: { request_id: parseInt(id) } });
    if (!request) return res.status(404).json({ error: 'Request not found' });
    if (!request.supervisor_approved_at) return res.status(400).json({ error: 'Request must be approved by a Supervisor first' });
    if ([STATUS.COMPLETED, STATUS.DISPOSAL].includes(request.status_id)) {
      return res.status(400).json({ error: 'Cannot reassign a completed or disposal request' });
    }

    const tech = await prisma.users.findUnique({ where: { user_id: parseInt(technician_id) }, select: { role_id: true, is_active: true } });
    if (!tech || !tech.is_active) return res.status(400).json({ error: 'Technician not found or inactive' });
    if (tech.role_id !== ROLES.TECHNICIAN) return res.status(400).json({ error: 'Selected user is not a Technician' });

    await prisma.maintenance_requests.update({
      where: { request_id: parseInt(id) },
      data: {
        assigned_technician_id: parseInt(technician_id),
        assigned_by_user_id: user_id,
        assigned_at: new Date(),
        status_id: STATUS.ASSIGNED,
      },
    });
    res.json({ message: 'Request assigned successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// ─── UPDATE STATUS → In Progress or Completed (with resolution) ─────────────
exports.updateRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status_id, resolution_details } = req.body;
    const { user_id, role_id } = req.user;
    const newStatusId = parseInt(status_id);

    if (!STATUS_UPDATE_ALLOWED.includes(newStatusId)) {
      return res.status(400).json({
        error: 'Use POST /hold for On Hold, POST /disposal for Disposal. This endpoint only accepts In Progress(3) or Completed(5).',
      });
    }

    const request = await prisma.maintenance_requests.findUnique({ where: { request_id: parseInt(id) } });
    if (!request) return res.status(404).json({ error: 'Request not found' });

    if (role_id === ROLES.TECHNICIAN && request.assigned_technician_id !== user_id) {
      return res.status(403).json({ error: 'You can only update requests assigned to you' });
    }

    if (newStatusId === STATUS.COMPLETED && !resolution_details?.resolution_summary) {
      return res.status(400).json({ error: 'resolution_summary is required when marking as Completed' });
    }

    await prisma.$transaction(async (tx) => {
      const updateData = { status_id: newStatusId };
      if (newStatusId === STATUS.COMPLETED) updateData.completion_date = new Date();

      await tx.maintenance_requests.update({ where: { request_id: parseInt(id) }, data: updateData });

      if (newStatusId === STATUS.COMPLETED && resolution_details) {
        const existing = await tx.request_resolution_details.findUnique({ where: { request_id: parseInt(id) } });
        if (!existing) {
          await tx.request_resolution_details.create({
            data: {
              request_id: parseInt(id),
              resolution_summary: resolution_details.resolution_summary,
              hardware_type: resolution_details.hardware_type || null,
              serial_number: resolution_details.serial_number || null,
              tag_number: resolution_details.tag_number || null,
              cost_saved: resolution_details.cost_saved ? parseFloat(resolution_details.cost_saved) : 0,
              resolved_by_user_id: user_id,
              completion_date: new Date(),
            },
          });
        }
      }
    });

    res.json({ message: 'Status updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// ════════════════════════════════════════════════════════════════════════════
// ON HOLD SUB-FLOW
// ════════════════════════════════════════════════════════════════════════════

// ─── PUT ON HOLD ─────────────────────────────────────────────────────────────
exports.holdRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason_id, responsible_party_id, expected_resume_date, remarks } = req.body;
    const { user_id } = req.user;

    if (!reason_id) return res.status(400).json({ error: 'reason_id is required' });

    const request = await prisma.maintenance_requests.findUnique({ where: { request_id: parseInt(id) } });
    if (!request) return res.status(404).json({ error: 'Request not found' });
    if (![STATUS.ASSIGNED, STATUS.IN_PROGRESS].includes(request.status_id)) {
      return res.status(400).json({ error: 'Request must be Assigned or In Progress to put on hold' });
    }

    await prisma.$transaction([
      prisma.request_on_hold_details.create({
        data: {
          request_id: parseInt(id),
          reason_id: parseInt(reason_id),
          responsible_party_id: responsible_party_id ? parseInt(responsible_party_id) : null,
          expected_resume_date: expected_resume_date ? new Date(expected_resume_date) : null,
          remarks: remarks || null,
          recorded_by_user_id: user_id,
        },
      }),
      prisma.maintenance_requests.update({
        where: { request_id: parseInt(id) },
        data: { status_id: STATUS.ON_HOLD },
      }),
    ]);

    res.json({ message: 'Request put on hold successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// ─── RESUME FROM ON HOLD ─────────────────────────────────────────────────────
exports.resumeRequest = async (req, res) => {
  try {
    const { id } = req.params;

    const request = await prisma.maintenance_requests.findUnique({ where: { request_id: parseInt(id) } });
    if (!request) return res.status(404).json({ error: 'Request not found' });
    if (request.status_id !== STATUS.ON_HOLD) return res.status(400).json({ error: 'Request is not currently on hold' });

    // Close the latest open hold record
    const latestHold = await prisma.request_on_hold_details.findFirst({
      where: { request_id: parseInt(id), actual_resume_date: null },
      orderBy: { hold_start_date: 'desc' },
    });

    const ops = [
      prisma.maintenance_requests.update({
        where: { request_id: parseInt(id) },
        data: { status_id: STATUS.IN_PROGRESS },
      }),
    ];
    if (latestHold) {
      ops.unshift(
        prisma.request_on_hold_details.update({
          where: { on_hold_id: latestHold.on_hold_id },
          data: { actual_resume_date: new Date() },
        })
      );
    }

    await prisma.$transaction(ops);
    res.json({ message: 'Request resumed successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// ════════════════════════════════════════════════════════════════════════════
// DISPOSAL SUB-FLOW
// ════════════════════════════════════════════════════════════════════════════

// ─── REQUEST DISPOSAL ────────────────────────────────────────────────────────
exports.disposalRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason_for_disposal, asset_condition, recommendation } = req.body;
    const { user_id } = req.user;

    if (!reason_for_disposal) return res.status(400).json({ error: 'reason_for_disposal is required' });

    const request = await prisma.maintenance_requests.findUnique({ where: { request_id: parseInt(id) } });
    if (!request) return res.status(404).json({ error: 'Request not found' });
    if (!request.asset_id) return res.status(400).json({ error: 'This request has no asset — disposal requires an asset' });
    if ([STATUS.COMPLETED, STATUS.DISPOSAL].includes(request.status_id)) {
      return res.status(400).json({ error: 'Request is already completed or in disposal' });
    }

    await prisma.$transaction([
      prisma.request_disposal_details.create({
        data: {
          request_id: parseInt(id),
          asset_id: request.asset_id,
          reason_for_disposal,
          asset_condition: asset_condition || null,
          recommendation: recommendation || null,
          checked_by_user_id: user_id,
        },
      }),
      prisma.maintenance_requests.update({
        where: { request_id: parseInt(id) },
        data: { status_id: STATUS.DISPOSAL },
      }),
    ]);

    res.json({ message: 'Disposal request submitted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// ─── APPROVE DISPOSAL (Manager / Director) ───────────────────────────────────
exports.approveDisposal = async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id } = req.user;

    const request = await prisma.maintenance_requests.findUnique({ where: { request_id: parseInt(id) } });
    if (!request) return res.status(404).json({ error: 'Request not found' });
    if (request.status_id !== STATUS.DISPOSAL) return res.status(400).json({ error: 'Request is not in Disposal status' });

    const disposal = await prisma.request_disposal_details.findFirst({
      where: { request_id: parseInt(id), approved_by_user_id: null },
      orderBy: { disposal_id: 'desc' },
    });
    if (!disposal) return res.status(400).json({ error: 'No pending disposal record found or already approved' });

    await prisma.request_disposal_details.update({
      where: { disposal_id: disposal.disposal_id },
      data: { disposal_date: new Date(), approved_by_user_id: user_id, approved_at: new Date() },
    });

    res.json({ message: 'Disposal approved successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};
