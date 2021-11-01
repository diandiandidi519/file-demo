import axios from "axios";
const axiosInstance = axios.create({
  baseURL: "http://localhost:3001/upload",
  timeout: 60000,
});
export default axiosInstance;
