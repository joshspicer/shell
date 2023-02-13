import axios from 'axios';

let baseURL;
if (process.env.NX_CODESPACE_NAME) {
  baseURL = `https://${process.env.NX_CODESPACE_NAME}-8889.${process.env.NX_GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}/`;
} else if (process.env.NODE_ENV === 'test') {
  baseURL = `http://testing.testing.testing`;
} else {
  baseURL = window.location.origin;
}

export const axiosInstance = axios.create({
  baseURL,
});
