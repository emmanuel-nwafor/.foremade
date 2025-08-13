export const fetchWithAuth = async (url, options = {}) => {
  const userData = JSON.parse(localStorage.getItem('userData')) || {};
  const headers = {
    ...options.headers,
    'x-user-email': userData.email || '',
  };
  return fetch(url, { ...options, headers });
};