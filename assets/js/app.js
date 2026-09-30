/**
 * ConverterArquivos - UI Controller and App Logic
 */

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const dropzone = document.getElementById('dropzone');
  const fileInput = document.getElementById('fileInput');
  const fileActiveSection = document.getElementById('fileActiveSection');
  const initialUploadSection = document.getElementById('initialUploadSection');
  const btnRemoveFile = document.getElementById('btnRemoveFile');

  // Format Selection Elements
  const formatSelectionSection = document.getElementById('formatSelectionSection');
  const detectedTypeIcon = document.getElementById('detectedTypeIcon');
  const detectedFilename = document.getElementById('detectedFilename');
  const detectedSpecs = document.getElementById('detectedSpecs');
  const btnCancelFormatSelection = document.getElementById('btnCancelFormatSelection');
  const formatSearchInput = document.getElementById('formatSearchInput');
  const formatGrid = document.getElementById('formatGrid');

  // Video Info Elements
  const videoThumbMini = document.getElementById('videoThumbMini');
  const videoFilename = document.getElementById('videoFilename');
  const videoSpecs = document.getElementById('videoSpecs');
  const previewVideo = document.getElementById('previewVideo');

  // Trimmer Inputs
  const trimStartInput = document.getElementById('trimStartInput');
  const trimEndInput = document.getElementById('trimEndInput');
  const videoTotalDurationText = document.getElementById('videoTotalDurationText');

  // Mode Selection Elements
  const modeTabs = document.querySelectorAll('.mode-tab');
  const advancedSettingsPanel = document.getElementById('advancedSettingsPanel');

  // Advanced Mode Inputs
  const resolutionPreset = document.getElementById('resolutionPreset');
  const customDimGroup = document.getElementById('customDimGroup');
  const customWidthInput = document.getElementById('customWidthInput');
  const customHeightInput = document.getElementById('customHeightInput');
  const fpsSlider = document.getElementById('fpsSlider');
  const fpsValueBadge = document.getElementById('fpsValueBadge');
  const colorsSelect = document.getElementById('colorsSelect');
  const ditherSelect = document.getElementById('ditherSelect');
  const speedSelect = document.getElementById('speedSelect');
  const targetSizeInput = document.getElementById('targetSizeInput');

  // Action Elements
  const btnConvert = document.getElementById('btnConvert');
  const processingSection = document.getElementById('processingSection');
  const processingStep = document.getElementById('processingStep');
  const progressBarFill = document.getElementById('progressBarFill');
  const progressPercent = document.getElementById('progressPercent');
  const converterCard = document.getElementById('converterCard');

  // Result Elements
  const resultSection = document.getElementById('resultSection');
  const resultGifImg = document.getElementById('resultGifImg');
  const origFileSizeBadge = document.getElementById('origFileSizeBadge');
  const origDimensionsBadge = document.getElementById('origDimensionsBadge');
  const gifFileSizeBadge = document.getElementById('gifFileSizeBadge');
  const savingsBadge = document.getElementById('savingsBadge');
  const btnDownloadGif = document.getElementById('btnDownloadGif');
  const btnCopyGif = document.getElementById('btnCopyGif');
  const btnNewConversion = document.getElementById('btnNewConversion');


  // State
  let currentFile = null;
  let currentVideoDuration = 0;
  let currentVideoWidth = 0;
  let currentVideoHeight = 0;
  let currentMode = 'auto'; // 'basic', 'auto', 'advanced'
  let currentGifBlob = null;
  let currentGifUrl = null;


  // =========================================================================
  // Drag & Drop / File Selection
  // =========================================================================
  dropzone.addEventListener('click', () => fileInput.click());

  ['dragenter', 'dragover'].forEach(eventName => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.add('drag-over');
    });
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.remove('drag-over');
    });
  });

  dropzone.addEventListener('drop', (e) => {
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileSelection(files[0]);
    }
  });

  fileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelection(e.target.files[0]);
    }
  });

  btnRemoveFile.addEventListener('click', resetFileState);

  const FORMAT_MAP = {
    image: ['png', 'jpeg', 'webp', 'gif', 'pdf'],
    video: ['gif', 'mp4', 'webm', 'mp3', 'wav'],
    audio: ['mp3', 'wav', 'ogg']
  };

  let targetFormat = null;
  let currentFileType = null;

  function handleFileSelection(file) {
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/') && !file.type.startsWith('audio/')) {
      showToast('Por favor, selecione uma imagem, vídeo ou áudio válido.', 'error');
      return;
    }

    currentFile = file;
    currentFileType = file.type.split('/')[0];
    
    detectedFilename.textContent = file.name;
    detectedFilename.title = file.name;
    detectedSpecs.innerHTML = `<span>📦 ${formatBytes(file.size)}</span>`;
    
    let icon = '📄';
    if (currentFileType === 'video') icon = '🎬';
    else if (currentFileType === 'image') icon = '🖼️';
    else if (currentFileType === 'audio') icon = '🎵';
    detectedTypeIcon.textContent = icon;

    initialUploadSection.style.display = 'none';
    formatSelectionSection.classList.add('active');
    
    renderFormatGrid(FORMAT_MAP[currentFileType]);
  }

  btnCancelFormatSelection.addEventListener('click', () => {
    formatSelectionSection.classList.remove('active');
    resetFileState();
  });

  formatSearchInput.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase().trim();
    const formats = FORMAT_MAP[currentFileType] || [];
    const filtered = formats.filter(f => f.includes(term));
    renderFormatGrid(filtered);
  });

  function renderFormatGrid(formats) {
    formatGrid.innerHTML = '';
    if (!formats || formats.length === 0) {
      formatGrid.innerHTML = `
        <div style="grid-column: 1 / -1; padding: 24px; color: var(--text-muted); font-size: 0.95rem;">
          🔍 Nenhum formato compatível encontrado para "${formatSearchInput.value}".
        </div>
      `;
      return;
    }
    formats.forEach(fmt => {
      const btn = document.createElement('button');
      btn.className = 'format-btn';
      btn.innerHTML = `<span style="font-size: 1.5rem;">${getFormatIcon(fmt)}</span><span class="format-type">${fmt}</span>`;
      btn.onclick = () => selectTargetFormat(fmt);
      formatGrid.appendChild(btn);
    });
  }

  function getFormatIcon(fmt) {
    if (['png', 'jpeg', 'webp'].includes(fmt)) return '🖼️';
    if (['mp3', 'wav', 'ogg'].includes(fmt)) return '🎵';
    if (['mp4', 'webm'].includes(fmt)) return '🎬';
    if (fmt === 'gif') return '🎞️';
    if (fmt === 'pdf') return '📕';
    return '📄';
  }

  function selectTargetFormat(fmt) {
    targetFormat = fmt;
    formatSelectionSection.classList.remove('active');
    fileActiveSection.classList.add('active');
    
    // Update conversion button text dynamically
    btnConvert.innerHTML = `
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
      </svg>
      Converter para ${fmt.toUpperCase()} Agora
    `;

    const modesContainer = document.querySelector('.modes-container');
    const trimmerBar = document.querySelector('.trimmer-bar');

    const fileUrl = URL.createObjectURL(currentFile);
    videoFilename.textContent = currentFile.name;
    videoFilename.title = currentFile.name;

    if (currentFileType === 'video' || currentFileType === 'audio') {
      previewVideo.style.display = 'block';
      if (modesContainer) modesContainer.style.display = 'block';
      if (trimmerBar) trimmerBar.style.display = 'block';
      previewVideo.src = fileUrl;
      previewVideo.onloadedmetadata = () => {
        currentVideoDuration = previewVideo.duration;
        currentVideoWidth = previewVideo.videoWidth || 0;
        currentVideoHeight = previewVideo.videoHeight || 0;

        videoSpecs.innerHTML = `
          <span>📦 ${formatBytes(currentFile.size)}</span>
          ${currentVideoWidth ? `<span>📐 ${currentVideoWidth}x${currentVideoHeight}</span>` : ''}
          <span>⏱️ ${formatTime(currentVideoDuration)}</span>
        `;
        videoTotalDurationText.textContent = `Duração: ${formatTime(currentVideoDuration)}`;

        trimStartInput.value = '0';
        trimStartInput.max = currentVideoDuration.toFixed(1);
        trimEndInput.value = currentVideoDuration.toFixed(1);
        trimEndInput.max = currentVideoDuration.toFixed(1);

        if (currentFileType === 'video') {
          captureVideoThumbnail(previewVideo, (thumbUrl) => {
            videoThumbMini.src = thumbUrl;
          });
        }
      };
    } else if (currentFileType === 'image') {
      previewVideo.style.display = 'none';
      if (trimmerBar) trimmerBar.style.display = 'none';
      // For images, only show modes container if target is GIF
      if (modesContainer) {
        modesContainer.style.display = (fmt === 'gif') ? 'block' : 'none';
      }
      if (advancedSettingsPanel) {
        advancedSettingsPanel.classList.remove('active');
      }

      const img = new Image();
      img.onload = () => {
        currentVideoWidth = img.width;
        currentVideoHeight = img.height;
        videoSpecs.innerHTML = `
          <span>📦 ${formatBytes(currentFile.size)}</span>
          <span>📐 ${currentVideoWidth}x${currentVideoHeight}</span>
        `;
        videoThumbMini.src = fileUrl;
      };
      img.src = fileUrl;
    }
  }

  function resetFileState() {
    currentFile = null;
    currentFileType = null;
    targetFormat = null;
    previewVideo.src = '';
    fileInput.value = '';
    formatSearchInput.value = '';
    fileActiveSection.classList.remove('active');
    initialUploadSection.style.display = 'block';
    resultSection.classList.remove('active');
    processingSection.classList.remove('active');

    const modesContainer = document.querySelector('.modes-container');
    if (modesContainer) modesContainer.style.display = 'block';
    const trimmerBar = document.querySelector('.trimmer-bar');
    if (trimmerBar) trimmerBar.style.display = 'block';
    btnConvert.innerHTML = `
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
      </svg>
      Converter Arquivo Agora
    `;
  }

  // =========================================================================
  // Video Trimmer Controls
  // =========================================================================
  trimStartInput.addEventListener('input', () => {
    let startVal = parseFloat(trimStartInput.value) || 0;
    let endVal = parseFloat(trimEndInput.value) || currentVideoDuration;

    if (startVal < 0) startVal = 0;
    if (startVal >= endVal) {
      startVal = Math.max(0, endVal - 0.5);
      trimStartInput.value = startVal.toFixed(1);
    }

    previewVideo.currentTime = startVal;
  });

  trimEndInput.addEventListener('input', () => {
    let startVal = parseFloat(trimStartInput.value) || 0;
    let endVal = parseFloat(trimEndInput.value) || currentVideoDuration;

    if (endVal > currentVideoDuration) endVal = currentVideoDuration;
    if (endVal <= startVal) {
      endVal = Math.min(currentVideoDuration, startVal + 0.5);
      trimEndInput.value = endVal.toFixed(1);
    }

    previewVideo.currentTime = endVal;
  });

  // =========================================================================
  // Mode Selection Tabs
  // =========================================================================
  modeTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      modeTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentMode = tab.dataset.mode;

      if (currentMode === 'advanced') {
        advancedSettingsPanel.classList.add('active');
      } else {
        advancedSettingsPanel.classList.remove('active');
      }
    });
  });

  // Advanced Mode Inputs
  fpsSlider.addEventListener('input', () => {
    fpsValueBadge.textContent = `${fpsSlider.value} FPS`;
  });

  resolutionPreset.addEventListener('change', () => {
    if (resolutionPreset.value === 'custom') {
      customDimGroup.style.display = 'flex';
      customWidthInput.value = currentVideoWidth || 640;
      customHeightInput.value = currentVideoHeight || 360;
    } else {
      customDimGroup.style.display = 'none';
    }
  });

  // =========================================================================
  // Conversion Process
  // =========================================================================
  btnConvert.addEventListener('click', async () => {
    if (!currentFile) {
      showToast('Nenhum arquivo selecionado.', 'error');
      return;
    }

    // Collect options
    const startTime = parseFloat(trimStartInput.value) || 0;
    const endTime = parseFloat(trimEndInput.value) || currentVideoDuration;

    const options = {
      targetFormat: targetFormat || 'gif',
      mode: currentMode,
      startTime: startTime,
      endTime: endTime,
      videoDuration: currentVideoDuration,
      videoWidth: currentVideoWidth,
      videoHeight: currentVideoHeight,
      // Advanced settings
      fps: parseInt(fpsSlider.value) || 15,
      colors: parseInt(colorsSelect.value) || 128,
      dither: ditherSelect.value,
      speed: parseFloat(speedSelect.value) || 1.0,
      resolutionPreset: resolutionPreset.value,
      customWidth: resolutionPreset.value === 'custom' ? parseInt(customWidthInput.value) : null,
      customHeight: resolutionPreset.value === 'custom' ? parseInt(customHeightInput.value) : null,
      targetSizeMB: targetSizeInput.value ? parseFloat(targetSizeInput.value) : null
    };

    // UI state for processing
    fileActiveSection.classList.remove('active');
    processingSection.classList.add('active');
    btnConvert.disabled = true;
    progressBarFill.style.width = '0%';
    progressPercent.textContent = '0%';
    const formatLabel = (targetFormat || 'arquivo').toUpperCase();
    processingStep.textContent = `Iniciando conversor para ${formatLabel}...`;

    try {
      const result = await window.gifConverter.convert(currentFile, options, (percent, statusText) => {
        progressBarFill.style.width = `${percent}%`;
        progressPercent.textContent = `${percent}%`;
        processingStep.textContent = statusText;
      });

      currentGifBlob = result.blob;
      currentGifUrl = result.url;

      // Show Result
      showConversionResult(result);
      showToast(`${formatLabel} gerado com sucesso!`, 'success');
    } catch (err) {
      console.error(err);
      showToast('Erro ao processar arquivo: ' + (err.message || 'Falha na conversão'), 'error');
      fileActiveSection.classList.add('active');
    } finally {
      processingSection.classList.remove('active');
      btnConvert.disabled = false;
    }
  });

  function showConversionResult(result) {
    const formatName = (targetFormat || 'arquivo').toUpperCase();
    const resultSuccessTitle = document.getElementById('resultSuccessTitle');
    if (resultSuccessTitle) {
      resultSuccessTitle.textContent = `${formatName} Criado com Sucesso!`;
    }
    const resultCardTitle = document.getElementById('resultCardTitle');
    if (resultCardTitle) {
      resultCardTitle.textContent = `${getFormatIcon(targetFormat)} ${formatName} Convertido`;
    }
    const resultFormatBadge = document.getElementById('resultFormatBadge');
    if (resultFormatBadge) {
      resultFormatBadge.textContent = formatName;
    }
    const btnDownloadText = document.getElementById('btnDownloadText');
    if (btnDownloadText) {
      btnDownloadText.textContent = `Baixar ${formatName} Agora`;
    }
    const btnCopyText = document.getElementById('btnCopyText');
    if (btnCopyText) {
      btnCopyText.textContent = (targetFormat === 'pdf') ? 'Abrir PDF' : 'Copiar';
    }

    origFileSizeBadge.textContent = formatBytes(currentFile.size);
    origDimensionsBadge.textContent = (currentVideoWidth && currentVideoHeight) 
      ? `${currentVideoWidth}x${currentVideoHeight}` 
      : 'N/A';
    gifFileSizeBadge.textContent = formatBytes(result.size);

    // Calculate savings
    const savings = Math.round(((currentFile.size - result.size) / currentFile.size) * 100);
    if (savings > 0) {
      savingsBadge.textContent = `-${savings}% menor`;
      savingsBadge.style.display = 'inline-block';
    } else {
      savingsBadge.style.display = 'none';
    }

    // Configure result media preview
    const resultMediaWrap = document.getElementById('resultMediaWrap');
    if (resultMediaWrap) {
      if (targetFormat === 'pdf') {
        resultMediaWrap.innerHTML = `
          <div style="text-align: center; color: var(--text-dim); padding: 24px; display: flex; flex-direction: column; align-items: center; gap: 12px;">
            <span style="font-size: 3.5rem;">📕</span>
            <span style="font-size: 1rem; font-weight: 700; color: var(--text-main); word-break: break-all;">${result.name}</span>
            <span style="font-size: 0.82rem; color: var(--success); font-weight: 600;">✓ Documento PDF Gerado com Alta Qualidade</span>
            <a href="${result.url}" target="_blank" class="btn-select" style="padding: 8px 18px; font-size: 0.85rem; text-decoration: none; margin-top: 4px;">
              👁️ Visualizar PDF no Navegador
            </a>
          </div>
        `;
      } else if (['png', 'jpeg', 'webp', 'gif'].includes(targetFormat)) {
        resultMediaWrap.innerHTML = `<img id="resultGifImg" src="${result.url}" alt="Resultado">`;
      } else if (['mp4', 'webm'].includes(targetFormat)) {
        resultMediaWrap.innerHTML = `<video controls playsinline src="${result.url}" style="max-width: 100%; max-height: 340px;"></video>`;
      } else if (['mp3', 'wav', 'ogg'].includes(targetFormat)) {
        resultMediaWrap.innerHTML = `
          <div style="padding: 24px; text-align: center; width: 100%;">
            <span style="font-size: 3rem;">🎵</span>
            <p style="margin: 12px 0; font-weight: 700; color: var(--text-main);">${result.name}</p>
            <audio controls src="${result.url}" style="width: 90%; max-width: 320px;"></audio>
          </div>
        `;
      }
    }

    // Configure original file media preview
    const origMediaWrap = document.getElementById('origMediaWrap');
    if (origMediaWrap) {
      if (currentFileType === 'image') {
        origMediaWrap.innerHTML = `<img src="${URL.createObjectURL(currentFile)}" alt="Original" style="max-width: 100%; max-height: 340px; object-fit: contain;">`;
      } else if (currentFileType === 'video') {
        origMediaWrap.innerHTML = `<video muted controls playsinline src="${URL.createObjectURL(currentFile)}" style="max-width: 100%; max-height: 340px;"></video>`;
      } else {
        origMediaWrap.innerHTML = `
          <div style="text-align: center; color: var(--text-dim); padding: 20px;">
            <span style="font-size: 3rem;">📁</span>
            <p style="margin-top: 8px; font-weight: 600;">${currentFile.name}</p>
          </div>
        `;
      }
    }

    // Configure download button
    btnDownloadGif.href = result.url;
    btnDownloadGif.download = result.name;

    resultSection.classList.add('active');
    resultSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  // Copy or Open Result
  btnCopyGif.addEventListener('click', async () => {
    if (!currentGifBlob) return;
    try {
      if (targetFormat === 'pdf') {
        window.open(currentGifUrl, '_blank');
        showToast('PDF aberto para visualização!', 'info');
        return;
      }
      if (navigator.clipboard && window.ClipboardItem && currentGifBlob.type.startsWith('image/')) {
        await navigator.clipboard.write([
          new ClipboardItem({ [currentGifBlob.type]: currentGifBlob })
        ]);
        showToast('Imagem copiada para a área de transferência!', 'success');
      } else {
        throw new Error('ClipboardItem não suportado');
      }
    } catch (e) {
      // Fallback: open in new tab
      window.open(currentGifUrl, '_blank');
      showToast('Arquivo aberto em nova guia!', 'success');
    }
  });

  // Convert Another File
  btnNewConversion.addEventListener('click', () => {
    resetFileState();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });


  // =========================================================================
  // Helper Functions
  // =========================================================================
  function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  function formatTime(seconds) {
    const s = Math.floor(seconds % 60);
    const m = Math.floor((seconds / 60) % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}s`;
  }

  function captureVideoThumbnail(videoElement, callback) {
    const canvas = document.createElement('canvas');
    canvas.width = 120;
    canvas.height = 120;
    const ctx = canvas.getContext('2d');
    try {
      ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
      callback(canvas.toDataURL('image/jpeg', 0.8));
    } catch (e) {
      callback('');
    }
  }

  function showToast(message, type = 'info') {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span>${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</span> <span>${message}</span>`;
    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 50);
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }
});
