import axios from "axios";

const client = axios.create({
  baseURL: "http://localhost:8000"
});

export const setAuthToken = (token) => {
  if (token) {
    client.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete client.defaults.headers.common.Authorization;
  }
};

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("app_token");
      localStorage.removeItem("app_email");
      localStorage.removeItem("recent_scan_data");
      window.location.reload();
    }
    return Promise.reject(error);
  }
);

export default client;
