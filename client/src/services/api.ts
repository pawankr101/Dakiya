
export interface ApiOptions {
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    body?: string | Blob | ArrayBuffer | FormData | ReadableStream
    headers?: Record<string, string>
    queryParams?: Record<string, string>
    timeout?: number
}

export interface Api {
    get<T = unknown>(apiUrl: string, options: ApiOptions): Promise<T>
    post<T = unknown>(apiUrl: string, payload: unknown, options: ApiOptions): Promise<T>
    put<T = unknown>(apiUrl: string, payload: unknown, options: ApiOptions): Promise<T>
    patch<T = unknown>(apiUrl: string, payload: unknown, options: ApiOptions): Promise<T>
    delete<T = unknown>(apiUrl: string, options: ApiOptions): Promise<T>
}


const request = async <T = unknown>(apiUrl: string, options: ApiOptions): Promise<T> => {

}
const options: RequestInit = {}
