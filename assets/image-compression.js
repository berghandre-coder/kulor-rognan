/* Browser-side product image compression. Produces WebP near 130 KB when
 * image complexity allows, while keeping a practical maximum resolution. */
(function (global) {
    "use strict";

    function canvasBlob(canvas, type, quality) {
        return new Promise(function (resolve, reject) {
            canvas.toBlob(function (blob) {
                if (blob) resolve(blob);
                else reject(new Error("Nettleseren klarte ikke å komprimere bildet."));
            }, type, quality);
        });
    }

    function loadImage(file) {
        if (global.createImageBitmap) return global.createImageBitmap(file);
        return new Promise(function (resolve, reject) {
            var image = new Image();
            var url = URL.createObjectURL(file);
            image.onload = function () {
                URL.revokeObjectURL(url);
                resolve(image);
            };
            image.onerror = function () {
                URL.revokeObjectURL(url);
                reject(new Error("Kunne ikke lese bildefilen."));
            };
            image.src = url;
        });
    }

    function compressImage(file, options) {
        var settings = Object.assign({
            targetBytes: 130 * 1024,
            maxDimension: 1600,
            minDimension: 720,
            minQuality: 0.42
        }, options || {});

        if (!file || !/^image\/(?:jpeg|png|webp|avif)$/i.test(file.type)) {
            return Promise.reject(new Error("Velg et JPEG-, PNG-, WebP- eller AVIF-bilde."));
        }
        if (file.size > 15 * 1024 * 1024) {
            return Promise.reject(new Error("Originalbildet kan ikke være større enn 15 MB."));
        }

        return loadImage(file).then(async function (image) {
            var sourceWidth = image.width;
            var sourceHeight = image.height;
            var scale = Math.min(1, settings.maxDimension / Math.max(sourceWidth, sourceHeight));
            var width = Math.max(1, Math.round(sourceWidth * scale));
            var height = Math.max(1, Math.round(sourceHeight * scale));
            var bestBlob = null;

            for (var resizePass = 0; resizePass < 4; resizePass += 1) {
                var canvas = document.createElement("canvas");
                canvas.width = width;
                canvas.height = height;
                var context = canvas.getContext("2d", { alpha: false });
                context.fillStyle = "#ffffff";
                context.fillRect(0, 0, width, height);
                context.drawImage(image, 0, 0, width, height);

                for (var quality = 0.86; quality >= settings.minQuality; quality -= 0.07) {
                    var blob = await canvasBlob(canvas, "image/webp", quality);
                    bestBlob = blob;
                    if (blob.size <= settings.targetBytes) {
                        if (image.close) image.close();
                        return { blob: blob, width: width, height: height, originalBytes: file.size };
                    }
                }

                if (Math.max(width, height) <= settings.minDimension) break;
                width = Math.max(1, Math.round(width * 0.82));
                height = Math.max(1, Math.round(height * 0.82));
            }

            if (image.close) image.close();
            return { blob: bestBlob, width: width, height: height, originalBytes: file.size };
        });
    }

    global.ImageCompression = { compressImage: compressImage };
})(window);
