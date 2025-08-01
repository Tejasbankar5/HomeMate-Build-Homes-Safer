const db = require('../config/db');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Helper function to format date
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// Get all accepted contracts for a provider
exports.getAcceptedContracts = async (req, res) => {
  try {
    const { email } = req.body;

    // Validate email
    if (!email) {
      return res.status(400).json({ 
        success: false,
        message: 'Provider email is required'
      });
    }

    // First get provider ID from email
    const providerQuery = `
      SELECT id FROM service_providers_authdata WHERE email = ?
    `;
    const [providerResults] = await db.query(providerQuery, [email]);
    
    if (providerResults.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Service provider not found' 
      });
    }

    const providerId = providerResults[0].id;

    // Get all accepted contracts for this provider
    const contractsQuery = `
      SELECT 
  qd.quotation_id,
  qd.request_id,
  qd.provider_id,
  qd.client_id,
  qd.labor_cost,
  qd.material_cost,
  qd.other_cost,
  qd.total_cost,
  qd.start_date,
  qd.completion_date,
  qd.status,
  qd.quotation_document_url,
  qd.terms_accepted,
  qd.revision_notes,
  qd.client_signature,
  qd.contract_status,
  cd.email AS client_email,
  cd.phoneNumber AS client_phone,
  sr.request_type,
  spa.business_name AS provider_name,
  spa.address AS provider_address,
  sp.email AS provider_email,
  sp.phone_number AS provider_phone
FROM quotation_details qd
LEFT JOIN service_providers_authdata sp ON qd.provider_id = sp.id
LEFT JOIN service_provider_profiles spa ON qd.provider_id = spa.service_provider_id
LEFT JOIN service_requests sr ON qd.request_id = sr.id
LEFT JOIN clientsdata cd ON qd.client_id = cd.id
WHERE qd.provider_id = ? AND qd.status = 'accepted' 
ORDER BY qd.start_date DESC;
    `;

    const [contracts] = await db.query(contractsQuery, [providerId]);

    // Format contract data
    const formattedContracts = contracts.map(contract => ({
      ...contract,
      labor_cost: parseFloat(contract.labor_cost),
      material_cost: parseFloat(contract.material_cost),
      other_cost: parseFloat(contract.other_cost),
      total_cost: parseFloat(contract.total_cost),
      start_date: formatDate(contract.start_date),
      completion_date: formatDate(contract.completion_date),
      client_name: contract.client_email.split('@')[0] // Simple name extraction
    }));

    res.json({
      success: true,
      contracts: formattedContracts
    });

  } catch (error) {
    console.error('Error fetching accepted contracts:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error while fetching contracts',
      error: error.message 
    });
  }
};

// Generate and save digital contract
exports.generateDigitalContract = async (req, res) => {
  try {
    const { quotation_id, signature, provider_id, client_id } = req.body;

    // Validate required fields
    if (!quotation_id || !provider_id || !client_id) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields (quotation_id, provider_id, client_id)'
      });
    }

    // Get contract details
    const contractQuery = `
     SELECT 
  qd.*,
  cd.email AS client_email,
  cd.phoneNumber AS client_phone,
  spa.business_name AS provider_name,
  spa.address AS provider_address,
  sp.email AS provider_email,
  sp.phone_number AS provider_phone,
  sr.request_type
FROM quotation_details qd
LEFT JOIN service_providers_authdata sp ON qd.provider_id = sp.id
LEFT JOIN service_provider_profiles spa ON qd.provider_id = spa.service_provider_id
LEFT JOIN service_requests sr ON qd.request_id = sr.id
LEFT JOIN clientsdata cd ON qd.client_id = cd.id
WHERE qd.quotation_id = ?

    `;

    const [contractResults] = await db.query(contractQuery, [quotation_id]);
    
    if (contractResults.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Contract not found' 
      });
    }

    const contract = contractResults[0];

    // Generate PDF contract
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const fileName = `contract_${quotation_id}_${Date.now()}.pdf`;
    const contractsDir = path.join(__dirname, '../contracts');
    const filePath = path.join(contractsDir, fileName);
    
    // Ensure contracts directory exists
    if (!fs.existsSync(contractsDir)) {
      fs.mkdirSync(contractsDir, { recursive: true });
    }

    // Create a write stream
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // Contract Header
    doc.fontSize(20).text('SERVICE CONTRACT AGREEMENT', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Contract #${quotation_id}`, { align: 'center' });
    doc.moveDown(2);

    // Parties Section
    doc.fontSize(14).text('PARTIES TO THIS AGREEMENT', { underline: true });
    doc.moveDown();
    
    // Provider Information
    doc.font('Helvetica-Bold').text('Service Provider:');
    doc.font('Helvetica').text(contract.provider_name);
    doc.text(`Email: ${contract.provider_email}`);
    doc.text(`Phone: ${contract.provider_phone}`);
    doc.text(`Address: ${contract.provider_address}`);
    doc.moveDown();
    
    // Client Information
    doc.font('Helvetica-Bold').text('Client:');
    doc.font('Helvetica').text(contract.client_email);
    doc.text(`Phone: ${contract.client_phone}`);
    doc.moveDown(2);

    // Service Details
    doc.fontSize(14).text('SERVICE DETAILS', { underline: true });
    doc.moveDown();
    
    doc.font('Helvetica-Bold').text('Service Type:');
    doc.font('Helvetica').text(contract.request_type);
    doc.moveDown();
    
    doc.font('Helvetica-Bold').text('Description:');
    doc.font('Helvetica').text(contract.service_description || 'Not specified');
    doc.moveDown();
    
    doc.font('Helvetica-Bold').text('Start Date:');
    doc.font('Helvetica').text(formatDate(contract.start_date));
    doc.moveDown();
    
    doc.font('Helvetica-Bold').text('Completion Date:');
    doc.font('Helvetica').text(formatDate(contract.completion_date));
    doc.moveDown(2);

    // Financial Terms
    doc.fontSize(14).text('FINANCIAL TERMS', { underline: true });
    doc.moveDown();
    
    doc.font('Helvetica-Bold').text('Cost Breakdown:');
    doc.font('Helvetica').text(`- Labor Cost: rs${parseFloat(contract.labor_cost).toFixed(2)}`);
    doc.text(`- Material Cost: rs${parseFloat(contract.material_cost).toFixed(2)}`);
    doc.text(`- Other Costs: rs${parseFloat(contract.other_cost).toFixed(2)}`);
    doc.moveDown();
    
    doc.fontSize(16).text(
      `Total Contract Amount: rs ${parseFloat(contract.total_cost).toFixed(2)}`, 
      { align: 'right' }
    );
    doc.moveDown(2);

    // Payment Milestones
    doc.fontSize(14).text('PAYMENT MILESTONES', { underline: true });
    doc.moveDown();
    
    const milestones = [
      `1. 30% upfront payment upon signing (rs${(contract.total_cost * 0.3).toFixed(2)})`,
      `2. 40% after project midpoint (rs${(contract.total_cost * 0.4).toFixed(2)})`,
      `3. 30% upon completion and client approval (rs${(contract.total_cost * 0.3).toFixed(2)})`
    ];
    
    milestones.forEach(milestone => doc.text(milestone));
    doc.moveDown(2);

    // Terms and Conditions
    doc.fontSize(14).text('TERMS & CONDITIONS', { underline: true });
    doc.moveDown();
    
    const terms = [
      '1. The contractor agrees to complete the work as specified in this agreement.',
      '2. The client agrees to make payments according to the payment milestones.',
      '3. Any changes to the scope of work must be agreed in writing by both parties.',
      '4. The contractor will provide regular progress updates to the client.',
      '5. The client agrees to provide timely feedback and necessary access to complete the work.',
      '6. Either party may terminate this agreement with 14 days written notice.',
      '7. Disputes will be resolved through mutual discussion first, then mediation if necessary.',
      '8. The contractor maintains liability for workmanship for 1 year post-completion.',
      '9. Late payments will incur a 1.5% monthly interest charge.',
      '10. Both parties agree to act in good faith throughout the contract duration.'
    ];
    
    terms.forEach(term => doc.text(term));
    doc.moveDown(2);

    // Signatures Section
    doc.fontSize(14).text('SIGNATURES', { underline: true });
    doc.moveDown();
    
    // Client Signature
    doc.text('CLIENT SIGNATURE:');
    doc.moveDown();
    doc.text('_________________________________________');
    doc.moveDown();
    doc.text('Date: _______________');
    doc.moveDown(2);
    
    // Provider Signature
    doc.text('SERVICE PROVIDER SIGNATURE:');
    doc.moveDown();
    
    // Add the digital signature if provided
    if (signature) {
      try {
        // Create temp directory if it doesn't exist
        const tempDir = path.join(__dirname, '../temp');
        if (!fs.existsSync(tempDir)) {
          fs.mkdirSync(tempDir, { recursive: true });
        }
        
        // Save signature image temporarily
        const signatureBuffer = Buffer.from(signature.split(',')[1], 'base64');
        const signaturePath = path.join(tempDir, `signature_${quotation_id}.png`);
        fs.writeFileSync(signaturePath, signatureBuffer);
        
        // Add signature to PDF
        doc.image(signaturePath, {
          fit: [200, 80],
          align: 'left'
        });
        
        // Clean up temp file
        fs.unlinkSync(signaturePath);
      } catch (signatureError) {
        console.error('Error processing signature:', signatureError);
        doc.text('_________________________________________');
      }
    } else {
      doc.text('_________________________________________');
    }
    
    doc.moveDown();
    doc.text(`Date: ${formatDate(new Date())}`);
    
    // Finalize PDF
    doc.end();

    // Wait for PDF to be fully written
    await new Promise((resolve) => {
      stream.on('finish', resolve);
    });

    // Update database with contract path and status
    const updateQuery = `
      UPDATE quotation_details 
      SET 
        contract_url = ?, 
        contract_status = 'signed', 
        terms_accepted = TRUE,
        signed_at = NOW()
      WHERE quotation_id = ?
    `;
    await db.query(updateQuery, [fileName, quotation_id]);

    res.json({
      success: true,
      message: 'Contract generated and signed successfully',
      contract_path: fileName,
      download_url: `/api/contracts/download/${fileName}`
    });

  } catch (error) {
    console.error('Error generating contract:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error while generating contract',
      error: error.message 
    });
  }
};

// Download contract file
exports.downloadContract = async (req, res) => {
  try {
    const { filename } = req.params;
    
    // Validate filename
    if (!filename || !filename.endsWith('.pdf')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid filename'
      });
    }

    const filePath = path.join(__dirname, '../contracts', filename);
    
    if (fs.existsSync(filePath)) {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      
      // Stream the file
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
      
      // Handle stream errors
      fileStream.on('error', (err) => {
        console.error('Error streaming contract file:', err);
        res.status(500).json({
          success: false,
          message: 'Error streaming contract file'
        });
      });
    } else {
      res.status(404).json({ 
        success: false,
        message: 'Contract file not found' 
      });
    }
  } catch (error) {
    console.error('Error downloading contract:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error while downloading contract',
      error: error.message 
    });
  }
};

// Helper endpoint to check contract status
exports.checkContractStatus = async (req, res) => {
  try {
    const { quotation_id } = req.params;

    const query = `
      SELECT status, contract_url 
      FROM quotation_details 
      WHERE quotation_id = ?
    `;
    const [results] = await db.query(query, [quotation_id]);

    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Contract not found'
      });
    }

    res.json({
      success: true,
      status: results[0].status,
      contract_url: results[0].contract_url
    });

  } catch (error) {
    console.error('Error checking contract status:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while checking contract status',
      error: error.message
    });
  }
};