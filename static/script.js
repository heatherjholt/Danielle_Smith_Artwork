document.addEventListener("DOMContentLoaded", () => {
    const thumbs = Array.from(document.querySelectorAll(".artwork-thumb"));
    const lightbox = document.getElementById("lightbox");
    const lightboxImg = document.getElementById("lightbox-image");
    const titlebox = document.getElementById("lightbox-title");
    const btnClose = document.getElementById("lightbox-close");
    const btnPrev = document.getElementById("lightbox-prev");
    const btnNext = document.getElementById("lightbox-next");

    let currentIndex = 0;
    let touchStartX = 0;

    if (!thumbs.length) return;

    function showImage(index) {
        currentIndex = index;
        const img = thumbs[currentIndex].querySelector("img");
        lightboxImg.src = img.src;
        lightboxImg.alt = img.alt || "";
    }

    function showImage(index) {
    currentIndex = index;

    const thumb = thumbs[currentIndex];
    const img = thumb.querySelector("img");

    lightboxImg.src = img.src; 
    lightboxImg.alt = img.alt || ""; 

    //title from data-title in html 
    const title = thumb.getAttribute("data-title");
    titlebox.textContent = title || "";
    }

    //open, close, next in lightbox
    function openLightbox(index) {
        showImage(index);
        lightbox.classList.add("open");
        document.body.style.overflow = "hidden";
    }

    function closeLightbox() {
        lightbox.classList.remove("open");
        document.body.style.overflow = "";
    }

    function nextImage(delta) {
        const total = thumbs.length;
        currentIndex = (currentIndex + delta + total) % total;
        showImage(currentIndex);
    }

    //click thumbnails
    thumbs.forEach((thumb, i) => {
        thumb.addEventListener("click", () => openLightbox(i));
    });

    //arrows and close button
    btnPrev.addEventListener("click", () => nextImage(-1));
    btnNext.addEventListener("click", () => nextImage(1));
    btnClose.addEventListener("click", closeLightbox);

    //outside click to close
    lightbox.addEventListener("click", (e) => {
        if (e.target === lightbox) {
            closeLightbox();
        }
    });

    //keyboard navigation
    document.addEventListener("keydown", (e) => {
        if (!lightbox.classList.contains("open")) return;

        if (e.key === "Escape") closeLightbox();
        if (e.key === "ArrowRight") nextImage(1);
        if (e.key === "ArrowLeft") nextImage(-1);
    });


    //swipe for mobile, plz work

    lightbox.addEventListener(
        "touchstart",
        (e) => {
            if (e.touches.length === 1) {
                touchStartX = e.touches[0].clientX;
            }
        },
        { passive: true }
    );

    lightbox.addEventListener(
        "touchend",
        (e) => {
            const dx = e.changedTouches[0].clientX - touchStartX;
            if (Math.abs(dx) > 50) {
                if (dx < 0) {
                    nextImage(1);   // swipe left for next
                } else {
                    nextImage(-1);  // swipe right for previous
                }
            }
        },
        { passive: true }
    );
});

// drag and drop
document.addEventListener("DOMContentLoaded", () => {
  const dropzone = document.getElementById("dropzone");
  const fileInput = document.getElementById("artFile");
  const dropText = document.getElementById("dropText");
  const uploadBtn = document.getElementById("uploadBtn");
  const previewImg = document.getElementById("previewImg");

  if (!dropzone || !fileInput || !dropText || !uploadBtn || !previewImg) return;

  let previewUrl = null;

  const setPreview = (file) => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = null;

    if (!file) {
      previewImg.style.display = "none";
      previewImg.removeAttribute("src");
      return;
    }

    previewUrl = URL.createObjectURL(file);
    previewImg.src = previewUrl;
    previewImg.style.display = "block";
  };

  const updateUI = () => {
    const f = fileInput.files && fileInput.files[0];

    dropText.textContent = f
      ? `Selected: ${f.name}`
      : "Drag & drop an image here, or click to open File Explorer.";

    uploadBtn.disabled = !f;

    setPreview(f);
  };

  //starts with no file selected and upload greyed out
  updateUI();

  dropzone.addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", updateUI);

  dropzone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropzone.classList.add("dragover");
  });

  dropzone.addEventListener("dragleave", () => {
    dropzone.classList.remove("dragover");
  });

  dropzone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropzone.classList.remove("dragover");

    const file = e.dataTransfer.files && e.dataTransfer.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please drop an image file.");
      return;
    }

    const dt = new DataTransfer();
    dt.items.add(file);
    fileInput.files = dt.files;

    updateUI();
  });

  // clean up preview URL when page is reloaded or closed 
  window.addEventListener("beforeunload", () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  });
});

//flash messages for error or success
document.addEventListener("DOMContentLoaded", () => {
  const flash = document.getElementById("flashContainer");
  if (!flash) return;

  //hide after 5 seconds
  const timer = setTimeout(() => {
    flash.remove();
  }, 5000);

  //click off
  document.addEventListener("click", () => {
    clearTimeout(timer);
    flash.remove();
  }, { once: true });
});