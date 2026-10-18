export async function getOfficialLogoPngDataUrl(): Promise<string | null> {
  if (typeof window === 'undefined') return null;

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        // Maintain exact original SVG aspect ratio (2048 x 692)
        canvas.width = 1024;
        canvas.height = 346;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/png'));
          return;
        }
      } catch (e) {
        console.warn('Error converting official logo SVG to canvas PNG:', e);
      }
      resolve(null);
    };

    img.onerror = () => {
      resolve(null);
    };

    img.src = '/assets/logo.svg';
  });
}
