// API Configuration utility
const getApiUrl = () => {
  const url = process.env.REACT_APP_API_URL || 'http://localhost:3000';
  console.log('DEBUG: getApiUrl returning:', url);
  return url;
};

const getUploadUrl = () => {
  return process.env.REACT_APP_UPLOAD_BASE_URL || process.env.REACT_APP_API_URL || 'http://localhost:3000';
};

const getImageUrl = (filename) => {
  const baseUrl = getApiUrl();
  console.log(`DEBUG: getImageUrl - baseUrl: ${baseUrl}`);
  
  // For production, ensure we use the correct API endpoint
  let finalUrl;
  if (baseUrl.includes('vlsiforum.sumedhait.com')) {
    // Production - force the correct API URL
    finalUrl = `http://vlsiforum.sumedhait.com/api/queries/images/${filename}`;
  } else {
    // Local development
    const apiUrl = baseUrl.includes('/api') ? baseUrl : `${baseUrl}/api`;
    finalUrl = `${apiUrl}/queries/images/${filename}`;
  }
  
  console.log(`DEBUG: getImageUrl - final URL: ${finalUrl}`);
  return finalUrl;
};

export { getApiUrl, getUploadUrl, getImageUrl };
