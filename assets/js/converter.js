class UniversalConverter {
  constructor() {
    this.ffmpeg = null;
  }

  /**
   * Main conversion router
   */
  async convert(file, options = {}, onProgress = () => {}) {
    const targetFormat = options.targetFormat || 'gif';
    const sourceFileType = file.type.split('/')[0]; // 'image', 'video', 'audio'

    if (sourceFileType === 'image') {
      if (targetFormat === 'pdf') {
        return this.convertImageToPdf(file, options, onProgress);
      }
      return this.convertImage(file, targetFormat, onProgress);
    } else if (sourceFileType === 'video' && targetFormat === 'gif') {
      return this.convertVideoToGif(file, options, onProgress);
    } else {
      return this.convertWithFFmpeg(file, targetFormat, onProgress);
    }
  }

  /**
   * Image to PDF Conversion using jsPDF
   */
  async convertImageToPdf(file, options = {}, onProgress = () => {}) {
    onProgress(15, 'Carregando dados da imagem...');

    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        const imgData = e.target.result;
        const img = new Image();

        img.onload = () => {
          try {
            onProgress(45, 'Iniciando motor jsPDF...');
            const jsPDFConstructor = (window.jspdf && window.jspdf.jsPDF) || window.jsPDF;

            if (!jsPDFConstructor) {
              return reject(new Error('Biblioteca jsPDF não foi encontrada.'));
            }

            const width = img.naturalWidth || img.width;
            const height = img.naturalHeight || img.height;
            const orientation = width > height ? 'landscape' : 'portrait';

            onProgress(70, 'Gerando documento PDF...');
            const pdf = new jsPDFConstructor({
              orientation: orientation,
              unit: 'px',
              format: [width, height],
              hotfixes: ['px_scaling']
            });

            // Convert format / draw to canvas to guarantee compatible format
            let format = 'JPEG';
            let finalDataUrl = imgData;

            if (!file.type.includes('jpeg') && !file.type.includes('jpg')) {
              const canvas = document.createElement('canvas');
              canvas.width = width;
              canvas.height = height;
              const ctx = canvas.getContext('2d');
              ctx.drawImage(img, 0, 0);
              finalDataUrl = canvas.toDataURL('image/png');
              format = 'PNG';
            }

            pdf.addImage(finalDataUrl, format, 0, 0, width, height);

            onProgress(90, 'Finalizando arquivo PDF...');
            const pdfBlob = pdf.output('blob');
            const pdfUrl = URL.createObjectURL(pdfBlob);
            const baseName = file.name ? file.name.substring(0, file.name.lastIndexOf('.')) : 'documento';

            onProgress(100, 'PDF gerado com sucesso!');
            resolve({
              blob: pdfBlob,
              url: pdfUrl,
              size: pdfBlob.size,
              name: `${baseName || 'documento'}.pdf`,
              format: 'pdf',
              previewUrl: finalDataUrl
            });
          } catch (err) {
            reject(new Error('Erro na geração do PDF: ' + err.message));
          }
        };

        img.onerror = () => reject(new Error('Falha ao decodificar a imagem para PDF.'));
        img.src = imgData;
      };

      reader.onerror = () => reject(new Error('Falha ao ler arquivo local.'));
      reader.readAsDataURL(file);
    });
  }

  /**
   * Image to Image Conversion using HTML5 Canvas
   */
  async convertImage(file, targetFormat, onProgress = () => {}) {
    onProgress(20, 'Lendo imagem local...');

    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        onProgress(50, 'Desenhando imagem no Canvas...');
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;

        const ctx = canvas.getContext('2d');
        if (targetFormat === 'jpeg') {
          // Fill white background for JPEG transparency handling
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        ctx.drawImage(img, 0, 0);

        onProgress(80, 'Gerando novo arquivo...');
        
        let mimeType = `image/${targetFormat}`;
        if (targetFormat === 'jpeg') mimeType = 'image/jpeg';
        if (targetFormat === 'png') mimeType = 'image/png';
        if (targetFormat === 'webp') mimeType = 'image/webp';
        if (targetFormat === 'gif') mimeType = 'image/gif';

        canvas.toBlob((blob) => {
          URL.revokeObjectURL(url);
          if (blob) {
            onProgress(100, 'Imagem convertida com sucesso!');
            resolve({
              blob: blob,
              url: URL.createObjectURL(blob),
              size: blob.size,
              name: file.name.substring(0, file.name.lastIndexOf('.')) + '.' + targetFormat
            });
          } else {
            reject(new Error('Falha ao exportar imagem convertida.'));
          }
        }, mimeType, 0.92);
      };

      img.onerror = (err) => {
        URL.revokeObjectURL(url);
        reject(new Error('Erro ao carregar a imagem selecionada.'));
      };

      img.src = url;
    });
  }

  /**
   * Video to GIF Conversion (Using gifshot)
   */
  async convertVideoToGif(file, options = {}, onProgress = () => {}) {
    onProgress(5, 'Iniciando leitura do vídeo local...');

    return new Promise((resolve, reject) => {
      if (typeof gifshot === 'undefined') {
        return reject(new Error('A biblioteca Gifshot não foi carregada.'));
      }

      const videoUrl = URL.createObjectURL(file);
      const startTime = parseFloat(options.startTime) || 0;
      const endTime = parseFloat(options.endTime) || options.videoDuration || 5;
      const clipDuration = Math.max(0.5, endTime - startTime);

      let fps = 12;
      let width = 480;
      let height = 360;

      const mode = options.mode || 'auto';

      if (mode === 'basic') {
        fps = 15;
        width = Math.min(640, options.videoWidth || 640);
      } else if (mode === 'auto') {
        fps = 12;
        width = Math.min(480, options.videoWidth || 480);
      } else if (mode === 'advanced') {
        fps = parseInt(options.fps) || 12;
        if (options.customWidth > 0) {
          width = options.customWidth;
        } else if (options.resolutionPreset === '1080p') width = 1080;
        else if (options.resolutionPreset === '720p') width = 720;
        else if (options.resolutionPreset === '480p') width = 480;
        else if (options.resolutionPreset === '360p') width = 360;
        else width = Math.min(640, options.videoWidth || 640);
      }

      if (options.videoWidth && options.videoHeight) {
        const aspect = options.videoHeight / options.videoWidth;
        height = Math.round(width * aspect);
      }

      onProgress(15, 'Extraindo quadros do vídeo...');

      gifshot.createGIF({
        video: [videoUrl],
        gifWidth: width,
        gifHeight: height,
        videoStart: startTime,
        videoDuration: clipDuration,
        numFrames: Math.round(clipDuration * fps),
        sampleInterval: 10,
        numWorkers: 2,
        progressCallback: (captureProgress) => {
          const p = Math.min(95, Math.max(15, Math.round(captureProgress * 100)));
          onProgress(p, `Processando quadros (${p}%)...`);
        }
      }, (obj) => {
        URL.revokeObjectURL(videoUrl);

        if (!obj.error) {
          const base64Data = obj.image;
          const gifBlob = this.base64ToBlob(base64Data, 'image/gif');
          onProgress(100, 'GIF gerado com sucesso!');

          resolve({
            blob: gifBlob,
            url: URL.createObjectURL(gifBlob),
            size: gifBlob.size,
            name: file.name ? file.name.replace(/\.[^/.]+$/, "") + '.gif' : 'animacao.gif'
          });
        } else {
          reject(new Error('Erro na geração do GIF: ' + obj.errorMsg));
        }
      });
    });
  }

  /**
   * FFmpeg Conversion for Video/Audio
   */
  async convertWithFFmpeg(file, targetFormat, onProgress = () => {}) {
    onProgress(10, 'Carregando módulo FFmpeg WebAssembly...');

    if (typeof FFmpegWASM === 'undefined' && typeof FFmpeg === 'undefined') {
      throw new Error('Biblioteca FFmpeg não está disponível.');
    }

    try {
      if (!this.ffmpeg) {
        const { FFmpeg } = window.FFmpegWASM || window.FFmpeg || {};
        this.ffmpeg = new FFmpeg();
      }

      const ffmpeg = this.ffmpeg;

      ffmpeg.on('progress', ({ progress }) => {
        const p = Math.min(95, Math.max(10, Math.round(progress * 100)));
        onProgress(p, `Convertendo mídia (${p}%)...`);
      });

      if (!ffmpeg.loaded) {
        await ffmpeg.load({
          coreURL: 'assets/js/ffmpeg/ffmpeg-core.js',
          wasmURL: 'assets/js/ffmpeg/ffmpeg-core.wasm'
        });
      }

      onProgress(30, 'Lendo arquivo de entrada...');
      const inputName = 'input_' + Date.now() + '_' + file.name;
      const outputName = 'output_' + Date.now() + '.' + targetFormat;

      const fileData = await file.arrayBuffer();
      await ffmpeg.writeFile(inputName, new Uint8Array(fileData));

      onProgress(40, 'Executando conversão via FFmpeg...');
      await ffmpeg.exec(['-i', inputName, outputName]);

      onProgress(90, 'Lendo arquivo convertido...');
      const data = await ffmpeg.readFile(outputName);

      // Clean up files in virtual FS
      await ffmpeg.deleteFile(inputName);
      await ffmpeg.deleteFile(outputName);

      let mimeType = 'application/octet-stream';
      if (targetFormat === 'mp3') mimeType = 'audio/mp3';
      if (targetFormat === 'wav') mimeType = 'audio/wav';
      if (targetFormat === 'ogg') mimeType = 'audio/ogg';
      if (targetFormat === 'mp4') mimeType = 'video/mp4';
      if (targetFormat === 'webm') mimeType = 'video/webm';

      const blob = new Blob([data.buffer], { type: mimeType });
      onProgress(100, 'Conversão concluída!');

      return {
        blob: blob,
        url: URL.createObjectURL(blob),
        size: blob.size,
        name: file.name.substring(0, file.name.lastIndexOf('.')) + '.' + targetFormat
      };
    } catch (err) {
      console.error(err);
      throw new Error('Erro na conversão com FFmpeg: ' + err.message);
    }
  }

  base64ToBlob(base64, mimeType = 'image/gif') {
    const byteString = atob(base64.split(',')[1]);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mimeType });
  }
}

window.gifConverter = new UniversalConverter();
window.universalConverter = window.gifConverter;

