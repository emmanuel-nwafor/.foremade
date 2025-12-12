import { getAuth } from 'firebase/auth';

export const fetchWithAuth = async (url, options = {}) => {
  const userData = JSON.parse(localStorage.getItem('userData')) || {};
  const auth = getAuth();
  const user = auth.currentUser;
  const email = user ? user.email : userData.email || '';
  const headers = {
    ...options.headers,
    'x-user-email': email,
  };
  const response = await fetch(url, { ...options, headers });
  console.log('Fetch response status:', response.status); // Debug log
  console.log('Fetch headers sent:', headers); // Debug log
  return response;
};