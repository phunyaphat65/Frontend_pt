// storage.js
export const KS = {
  USERS: 'pt_users',
  SEEKERS: 'pt_job_seekers',
  SHOPS: 'pt_shops',
  JOBS: 'pt_jobs',
  APPS: 'pt_applications',
  REVIEWS: 'pt_reviews'
};

export function load(key) {
  try { return JSON.parse(localStorage.getItem(key) || '[]'); }
  catch(e) { return []; }
}

export function save(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

export function uid(prefix='id') {
  return prefix + '_' + Math.random().toString(36).slice(2, 9);
}

export function removeById(key, idField, id) {
  const arr = load(key).filter(x => x[idField] !== id);
  save(key, arr);
}
