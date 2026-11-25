const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');
let images = [];
let recordedBlob = null;
let previewTimer = null;

document.getElementById('images').addEventListener('change', async (e) => {
  images = [];
  for (const file of e.target.files) {
    const img = new Image();
    img.src = URL.createObjectURL(file);
    await new Promise((res) => { img.onload = res; });
    images.push(img);
  }
  statusEl.textContent = images.length ? `${images.length} image(s) loaded.` : 'No images yet.';
  drawSlide(0, 0);
});

function drawSlide(index, progress) {
  const title = document.getElementById('title').value;
  const subtitle = document.getElementById('subtitle').value;
  const bg = document.getElementById('bg').value;
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const img = images[index];
  if (img) {
    const scale = Math.max(canvas.width / img.width, canvas.height / img.height);
    const w = img.width * scale, h = img.height * scale;
    ctx.globalAlpha = 0.4 + 0.6 * progress;
    ctx.drawImage(img, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
    ctx.globalAlpha = 1;
  }
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.fillRect(0, canvas.height - 170, canvas.width, 170);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 64px system-ui, sans-serif';
  ctx.fillText(title, 60, canvas.height - 80);
  ctx.font = '32px system-ui, sans-serif';
  ctx.fillText(subtitle, 60, canvas.height - 30);
}

function playPreview(onDone) {
  if (!images.length) { statusEl.textContent = 'Please upload at least 1 image first.'; return; }
  const perImage = Number(document.getElementById('duration').value) || 3;
  const start = performance.now();
  const total = perImage * images.length * 1000;
  clearInterval(previewTimer);
  previewTimer = setInterval(() => {
    const elapsed = performance.now() - start;
    if (elapsed >= total) { clearInterval(previewTimer); if (onDone) onDone(); return; }
    const idx = Math.floor(elapsed / (perImage * 1000));
    const progress = (elapsed % (perImage * 1000)) / (perImage * 1000);
    drawSlide(idx, progress);
  }, 50);
}

document.getElementById('previewBtn').addEventListener('click', () => {
  statusEl.textContent = 'Playing preview…';
  playPreview(() => { statusEl.textContent = 'Preview finished.'; });
});

document.getElementById('recordBtn').addEventListener('click', () => {
  if (!images.length) { statusEl.textContent = 'Please upload at least 1 image first.'; return; }
  const stream = canvas.captureStream(30);
  const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
  const chunks = [];
  recorder.ondataavailable = (e) => chunks.push(e.data);
  recorder.onstop = () => {
    recordedBlob = new Blob(chunks, { type: 'video/webm' });
    document.getElementById('downloadBtn').disabled = false;
    statusEl.textContent = 'Video recorded. Click Download video.';
  };
  recorder.start();
  statusEl.textContent = 'Recording…';
  playPreview(() => recorder.stop());
});

document.getElementById('downloadBtn').addEventListener('click', () => {
  if (!recordedBlob) return;
  const a = document.createElement('a');
  a.href = URL.createObjectURL(recordedBlob);
  a.download = 'video-creator.webm';
  a.click();
});

drawSlide(0, 1);
