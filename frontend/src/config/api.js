// API Configuration utility
const getApiUrl = () => {
  return process.env.REACT_APP_API_URL || 'http://localhost:3000';
};

const getUploadUrl = () => {
  return process.env.REACT_APP_UPLOAD_BASE_URL || process.env.REACT_APP_API_URL || 'http://localhost:3000';
};

const getImageUrl = (filename) => {
  return `${getUploadUrl()}/uploads/${filename}`;
};

export { getApiUrl, getUploadUrl, getImageUrl };
