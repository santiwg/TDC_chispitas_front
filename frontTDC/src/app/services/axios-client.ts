import axios, { AxiosInstance } from 'axios';
// COMENTO HASTA DECIDIR SI USAMOS O NO AUTENTICACION
// import { config } from '../config/config';

class AxiosClient {
  private axiosInstance: AxiosInstance;

  // COMENTO HASTA DECIDIR SI USAMOS O NO AUTENTICACION
  // private clearAuthAndRedirect(): void {
  //   localStorage.removeItem('access_token');
  //   localStorage.removeItem('refresh_token');
  //   window.location.href = '/login';
  // }

  constructor() {
    this.axiosInstance = axios.create({
      timeout: 20000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // COMENTO HASTA DECIDIR SI USAMOS O NO AUTENTICACION
    // Request interceptor: agrega el token Bearer si existe
    // this.axiosInstance.interceptors.request.use(
    //   (config) => {
    //     const token = localStorage.getItem('access_token');
    //     if (token) {
    //       config.headers.Authorization = `Bearer ${token}`;
    //     }
    //     return config;
    //   },
    //   (error) => {
    //     return Promise.reject(error);
    //   }
    // );

    // COMENTO HASTA DECIDIR SI USAMOS O NO AUTENTICACION
    // Response interceptor: refresca el token cuando la API responde 401
    // this.axiosInstance.interceptors.response.use(
    //   (response) => {
    //     return response;
    //   },
    //   async (error) => {
    //     const originalRequest = error.config as any;
    //     const status = error.response?.status;
    //
    //     if (status === 401 && !originalRequest._retry) {
    //       originalRequest._retry = true;
    //
    //       const refreshToken = localStorage.getItem('refresh_token');
    //       if (!refreshToken) {
    //         this.clearAuthAndRedirect();
    //         return Promise.reject(error);
    //       }
    //
    //       try {
    //         // Intenta obtener nuevo token usando axios directo (sin interceptores)
    //         const response = await axios.get(`${config.urls.users}/refresh-token`, {
    //           headers: {
    //             'refresh-token': refreshToken,
    //           },
    //         });
    //
    //         const newAccessToken = response.data.accessToken;
    //         localStorage.setItem('access_token', newAccessToken);
    //
    //         // Actualiza el header y reintenta la request original
    //         originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
    //         return this.axiosInstance(originalRequest);
    //       } catch (refreshError: any) {
    //         this.clearAuthAndRedirect();
    //         return Promise.reject(refreshError);
    //       }
    //     }
    //
    //     return Promise.reject(error);
    //   }
    // );
  }

  public getInstance(): AxiosInstance {
    return this.axiosInstance;
  }
}

export const axiosClient = new AxiosClient().getInstance();