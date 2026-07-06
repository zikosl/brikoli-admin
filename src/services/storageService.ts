import { apiFetch } from './apiClient';

interface UploadResponse {
  id: string;
  url: string;
}

const kindByPath: Record<string, string> = {
  services: 'SERVICE',
  profiles: 'PROFILE',
  requests: 'REQUEST',
  completion: 'COMPLETION',
};

export async function uploadImage(file: File, path: string) {
  const form = new FormData();
  form.append('files', file);

  const uploads = await apiFetch<UploadResponse[]>(`/uploads?kind=${kindByPath[path] ?? 'SERVICE'}`, {
    method: 'POST',
    body: form,
  });

  return uploads[0]?.url ?? '';
}
