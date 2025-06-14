self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
});

self.addEventListener('fetch', (event) => {
  return;
});