const { uploadToDrive } = require('../utils/googleDrive');
const db = require('../config/db');
const fs = require('fs');

const submitQuotation = async (req, res) => {
  try {
    const {
      requestId,
      providerEmail,
      laborCost,
      materialCost,
      otherCost,
      totalCost,
      startDate,
      completionDate,
      termsAccepted
    } = req.body;

    // Validate required fields
    if (
      !requestId || !providerEmail || !laborCost || !materialCost || !totalCost ||
      !startDate || !completionDate || termsAccepted !== 'true'
    ) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Quotation file is required' });
    }

    // Upload file to Google Drive
    const filePath = req.file.path;
    const driveResponse = await uploadToDrive(filePath, req.file.originalname, 'application/pdf');
    const driveFileLink = `https://drive.google.com/uc?id=${driveResponse.id}`;

    // Remove local file after upload
    fs.unlinkSync(filePath);

    // Get provider ID from providerEmail
    const [providerRows] = await db.execute(
      'SELECT id FROM service_providers_authdata WHERE email = ?',
      [providerEmail]
    );

    if (providerRows.length === 0) {
      return res.status(404).json({ message: 'Provider not found' });
    }

    const providerId = providerRows[0].id;

    // Get client ID using request_id
    const [requestRows] = await db.execute(
      'SELECT client_id FROM service_requests WHERE id = ?',
      [requestId]
    );

    if (requestRows.length === 0) {
      return res.status(404).json({ message: 'Request not found' });
    }

    const clientId = requestRows[0].client_id;

    // Handle optional fields
    const processedOtherCost = otherCost ? parseFloat(otherCost) : 0.00;

    // Insert into quotation_details (AUTO_INCREMENT quotation_id is excluded)
    const [result] = await db.execute(
      `INSERT INTO quotation_details
       (request_id, provider_id, client_id, labor_cost, material_cost, other_cost, total_cost, start_date, completion_date, quotation_document_url, terms_accepted)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        requestId,
        providerId,
        clientId,
        parseFloat(laborCost),
        parseFloat(materialCost),
        processedOtherCost,
        parseFloat(totalCost),
        startDate,
        completionDate,
        driveFileLink,
        true
      ]
    );

    const insertedQuotationId = result.insertId;

    res.status(200).json({ message: 'Quotation submitted successfully', quotationId: insertedQuotationId });

  } catch (err) {
    console.error('Error submitting quotation:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  submitQuotation
};
