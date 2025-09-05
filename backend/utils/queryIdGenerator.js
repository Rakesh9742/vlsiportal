const db = require('../config/database');

/**
 * Generate custom query ID in format: s{studentId}{domainAbbrev}{counter}
 * Example: s1pd001, s2dv002, etc.
 * 
 * @param {number} studentId - The student's ID
 * @param {string} domainName - The domain name (e.g., 'Physical Design')
 * @returns {Promise<string>} - The generated custom query ID
 */
async function generateCustomQueryId(studentId, domainName) {
  try {
    // Map domain names to abbreviations
    const domainAbbreviations = {
      'Specification': 'SP',
      'Architecture': 'AR',
      'Design': 'DS',
      'Design Verification': 'DV',
      'Physical Design': 'PD',
      'DFT': 'DF',
      'Analog Layout': 'AL',
      'Analog Design': 'AD'
    };

    // Get domain abbreviation
    const domainAbbrev = domainAbbreviations[domainName] || 'GN'; // 'GN' for general if not found

    // Get the count of existing queries for this student in this domain
    const [countResult] = await db.execute(`
      SELECT COUNT(*) as count 
      FROM queries q
      JOIN users u ON q.student_id = u.id
      JOIN domains d ON u.domain_id = d.id
      WHERE q.student_id = ? AND d.name = ?
    `, [studentId, domainName]);

    const count = countResult[0].count;
    const nextNumber = count + 1;

    // Format the counter with leading zeros (3 digits)
    const formattedCounter = nextNumber.toString().padStart(3, '0');

    // Generate the custom query ID
    const customQueryId = `S${studentId}${domainAbbrev}${formattedCounter}`;

    return customQueryId;
  } catch (error) {
    console.error('Error generating custom query ID:', error);
    throw error;
  }
}

/**
 * Check if a custom query ID already exists
 * @param {string} customQueryId - The custom query ID to check
 * @returns {Promise<boolean>} - True if exists, false otherwise
 */
async function customQueryIdExists(customQueryId) {
  try {
    const [result] = await db.execute(
      'SELECT COUNT(*) as count FROM queries WHERE custom_query_id = ?',
      [customQueryId]
    );
    return result[0].count > 0;
  } catch (error) {
    console.error('Error checking custom query ID existence:', error);
    throw error;
  }
}

/**
 * Generate a unique custom query ID (with retry logic in case of conflicts)
 * @param {number} studentId - The student's ID
 * @param {string} domainName - The domain name
 * @returns {Promise<string>} - The generated unique custom query ID
 */
async function generateUniqueCustomQueryId(studentId, domainName) {
  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    const customQueryId = await generateCustomQueryId(studentId, domainName);
    const exists = await customQueryIdExists(customQueryId);
    
    if (!exists) {
      return customQueryId;
    }
    
    attempts++;
    // If there's a conflict, wait a bit and try again
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  throw new Error('Failed to generate unique custom query ID after multiple attempts');
}

module.exports = {
  generateCustomQueryId,
  customQueryIdExists,
  generateUniqueCustomQueryId
};