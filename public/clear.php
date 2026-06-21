<?php
// Clear cache helper — NMV Lottery
// Visit: https://nmvapp.com/clear.php  → unregisters SW + clears all caches → redirects to app
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('Expires: Thu, 01 Jan 1970 00:00:00 GMT');
?><!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>NMV Lottery – Limpiando cache...</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:system-ui,sans-serif;background:#0D9488;color:#fff;min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:20px}
  .card{background:rgba(255,255,255,0.15);border-radius:16px;padding:32px 40px;max-width:360px;width:100%}
  h1{font-size:22px;font-weight:800;margin-bottom:8px}
  p{font-size:14px;opacity:0.9;margin-bottom:20px}
  .step{font-size:13px;background:rgba(0,0,0,0.2);border-radius:8px;padding:8px 14px;margin:6px 0;text-align:left}
  .step.done{opacity:0.6}
  .step.active{background:rgba(255,255,255,0.25)}
  #status{font-size:16px;font-weight:700;margin-top:20px}
  .spinner{width:32px;height:32px;border:3px solid rgba(255,255,255,0.3);border-top-color:#fff;border-radius:50%;animation:spin 0.8s linear infinite;margin:16px auto}
  @keyframes spin{to{transform:rotate(360deg)}}
</style>
</head>
<body>
<div class="card">
  <h1>🔄 NMV Lottery</h1>
  <p>Limpiando caché y actualizando a la versión más reciente...</p>
  <div class="step active" id="s1">1. Eliminando Service Workers...</div>
  <div class="step" id="s2">2. Borrando caches del navegador...</div>
  <div class="step" id="s3">3. Redirigiendo a la app...</div>
  <div class="spinner" id="spin"></div>
  <div id="status">Trabajando...</div>
</div>
<script>
(async function() {
  function mark(id, done) {
    const el = document.getElementById(id);
    if (el) { el.classList.remove('active'); if (done) el.classList.add('done'); }
    const next = document.getElementById('s' + (parseInt(id.slice(1)) + 1));
    if (next) next.classList.add('active');
  }

  // Step 1 – Unregister all service workers
  document.getElementById('status').textContent = 'Eliminando Service Workers...';
  if ('serviceWorker' in navigator) {
    const regs = await navigator.serviceWorker.getRegistrations();
    for (const reg of regs) {
      await reg.unregister();
    }
  }
  mark('s1', true);
  await new Promise(r => setTimeout(r, 400));

  // Step 2 – Delete all caches
  document.getElementById('status').textContent = 'Borrando caches...';
  if ('caches' in window) {
    const keys = await caches.keys();
    for (const key of keys) {
      await caches.delete(key);
    }
  }
  mark('s2', true);
  await new Promise(r => setTimeout(r, 400));

  // Step 3 – Hard redirect
  document.getElementById('status').textContent = '¡Listo! Abriendo app actualizada...';
  document.getElementById('spin').style.display = 'none';
  mark('s3', false);
  await new Promise(r => setTimeout(r, 600));

  // Force reload with cache bust
  const ts = Date.now();
  window.location.replace('/?v=' + ts);
})();
</script>
</body>
</html>
