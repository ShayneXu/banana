const form = document.querySelector('#generator-form');
const tokenInput = document.querySelector('#access-token');
const promptInput = document.querySelector('#prompt');
const aspectRatioInput = document.querySelector('#aspect-ratio');
const imageSizeInput = document.querySelector('#image-size');
const submitButton = document.querySelector('#submit-button');
const statusText = document.querySelector('#status');
const apiOriginText = document.querySelector('#api-origin');
const imageFrame = document.querySelector('#image-frame');
const downloadLink = document.querySelector('#download-link');
const counter = document.querySelector('#counter');

const runtimeConfig = window.GEMINI_IMAGE_APP_CONFIG || {};
const apiBaseUrl = String(runtimeConfig.apiBaseUrl || '').replace(/\/$/, '');
const generateEndpoint = `${apiBaseUrl}/api/generate-image`;

const savedToken = window.localStorage.getItem('gemini-image-access-token');
if (savedToken) {
  tokenInput.value = savedToken;
}

apiOriginText.textContent = apiBaseUrl
  ? `API: ${apiBaseUrl}`
  : 'API: 当前站点后端';

function setStatus(message, type = 'neutral') {
  statusText.textContent = message;
  statusText.dataset.type = type;
}

function setBusy(isBusy) {
  submitButton.disabled = isBusy;
  submitButton.textContent = isBusy ? '生成中...' : '生成图片';
}

function updateCounter() {
  counter.textContent = `${promptInput.value.length} / ${promptInput.maxLength}`;
}

function resetDownload() {
  downloadLink.removeAttribute('href');
  downloadLink.setAttribute('aria-disabled', 'true');
}

function showImage(imageBase64, mimeType) {
  const imageUrl = `data:${mimeType};base64,${imageBase64}`;
  imageFrame.innerHTML = '';

  const image = document.createElement('img');
  image.src = imageUrl;
  image.alt = 'Gemini 生成的图片';
  image.loading = 'eager';
  imageFrame.append(image);

  const extension = mimeType.includes('jpeg') ? 'jpg' : 'png';
  downloadLink.href = imageUrl;
  downloadLink.download = `gemini-image-${Date.now()}.${extension}`;
  downloadLink.setAttribute('aria-disabled', 'false');
}

promptInput.addEventListener('input', updateCounter);
updateCounter();

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const accessToken = tokenInput.value.trim();
  const prompt = promptInput.value.trim();

  if (!accessToken) {
    setStatus('请输入访问口令。', 'error');
    tokenInput.focus();
    return;
  }

  if (!prompt) {
    setStatus('请输入文生图提示词。', 'error');
    promptInput.focus();
    return;
  }

  window.localStorage.setItem('gemini-image-access-token', accessToken);
  setBusy(true);
  resetDownload();
  setStatus('正在请求 Gemini 生成图片...', 'neutral');

  try {
    const params = new URLSearchParams({
      accessToken,
      prompt,
      aspectRatio: aspectRatioInput.value,
      imageSize: imageSizeInput.value
    });

    const response = await fetch(`${generateEndpoint}?${params.toString()}`);

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(payload.error || '生成失败，请稍后再试。');
    }

    showImage(payload.imageBase64, payload.mimeType || 'image/png');
    setStatus('生成完成。', 'success');
  } catch (error) {
    setStatus(error.message || '生成失败，请稍后再试。', 'error');
  } finally {
    setBusy(false);
  }
});
