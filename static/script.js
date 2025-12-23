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
    document.getElementById("lightbox-medium").textContent =
    thumb.dataset.medium ? `MEDIUM: ${thumb.dataset.medium}` : "";

    document.getElementById("lightbox-description").textContent =
    thumb.dataset.description || "";
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

  //TESTING mobile photo/camera upload
const takeBtn = document.getElementById("takePhotoBtn");
const chooseBtn = document.getElementById("choosePhotoBtn");
const cameraInput = document.getElementById("cameraFile");

if (takeBtn && chooseBtn && cameraInput) {
  takeBtn.addEventListener("click", () => {
    cameraInput.disabled = false;
    fileInput.disabled = true; 
    cameraInput.value = "";
    cameraInput.click();
  });

  chooseBtn.addEventListener("click", () => {
    fileInput.disabled = false;
    cameraInput.disabled = true;
    fileInput.value = "";
    fileInput.click();
  });

  cameraInput.addEventListener("change", () => {
    const f = cameraInput.files && cameraInput.files[0];
    setPreview(f);
    uploadBtn.disabled = !f;
  });
}



  //starts with no file selected and upload greyed out
  updateUI();

//   dropzone.addEventListener("click", () => fileInput.click());
dropzone.addEventListener("click", () => {
  if (window.matchMedia("(pointer: coarse)").matches) return;
  fileInput.click();
});
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

//reorder and editing
document.addEventListener("DOMContentLoaded", () => {
  const list = document.getElementById("manageList");
  if (!list || typeof Sortable === "undefined") return;

  new Sortable(list, {
    animation: 160,
    handle: ".drag-handle",
    draggable: ".manage-item",
    ghostClass: "is-ghost",
    chosenClass: "is-chosen",
    dragClass: "is-dragging",
    forceFallback: true,
    fallbackTolerance: 5,
    onEnd: async () => {
      const order = Array.from(list.querySelectorAll(".manage-item"))
        .map(el => el.dataset.id);

      try {
        const res = await fetch("/admin/art/reorder", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order }),
        });
        if (!res.ok) throw new Error("Bad response");
      } catch (e) {
        console.error(e);
        alert("Could not save new order.");
      }
    }
  });
});

//modal for editing
document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("artModal");
  if (!modal) return;

  const closeBtn = document.getElementById("modalClose");
  const editForm = document.getElementById("editForm");

  const titleInput = document.getElementById("modalTitleInput");
  const mediumInput = document.getElementById("modalMediumInput");
  const descInput = document.getElementById("modalDescriptionInput");
  const fileInput = document.getElementById("modalFileInput");

  const previewImg = document.getElementById("modalPreviewImg");
  const deleteBtn = document.getElementById("deleteBtn");

  let currentId = null;
  let previewUrl = null;

  function openModal() {
    modal.classList.remove("hidden");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function closeModal() {
    modal.classList.add("hidden");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = null;

    if (fileInput) fileInput.value = "";
  }

  function setPreviewFromExisting(imageName) {
    if (!imageName) {
      previewImg.style.display = "none";
      previewImg.removeAttribute("src");
      return;
    }
    previewImg.src = `/static/artwork/${imageName}`;
    previewImg.style.display = "block";
  }

  function setPreviewFromFile(file) {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = null;

    if (!file) return;

    previewUrl = URL.createObjectURL(file);
    previewImg.src = previewUrl;
    previewImg.style.display = "block";
  }

  document.querySelectorAll(".edit-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      currentId = btn.dataset.id;

      titleInput.value = btn.dataset.title || "";
      mediumInput.value = btn.dataset.medium || "";
      descInput.value = btn.dataset.description || "";

      editForm.action = `/admin/art/${currentId}/update`;

      //thumbnail
      setPreviewFromExisting(btn.dataset.image);

      openModal();
    });
  });

  fileInput.addEventListener("change", () => {
    const f = fileInput.files && fileInput.files[0];
    if (f) setPreviewFromFile(f);
  });

  deleteBtn.addEventListener("click", () => {
    if (!currentId) return;

    const ok = confirm("Are you sure you want to delete this artwork?");
    if (!ok) return;

    const form = document.createElement("form");
    form.method = "POST";
    form.action = `/admin/art/${currentId}/delete`;
    document.body.appendChild(form);
    form.submit();
  });

  closeBtn.addEventListener("click", closeModal);

  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.classList.contains("hidden")) {
      closeModal();
    }
  });
});

//login enter button submits pw
document.addEventListener("DOMContentLoaded", () => {
  const pw = document.querySelector('input[name="password"]');
  if (!pw) return;

  pw.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      pw.form?.requestSubmit?.() || pw.form?.submit();
    }
  });
});

//character count for message box
document.addEventListener("DOMContentLoaded", () => {
  const ta = document.getElementById("message");
  const counter = document.getElementById("msgCount");
  if (!ta || !counter) return;

  const MAX = 255;

  //calculate newlines as well as chars
  function getEffectiveLength(value) {
    const newlineCount = (value.match(/\n/g) || []).length;
    return value.length + newlineCount;
  }

  function update() {
    let value = ta.value;
    let effectiveLength = getEffectiveLength(value);

    // Hard stop: trim excess
    while (effectiveLength > MAX) {
      value = value.slice(0, -1);
      effectiveLength = getEffectiveLength(value);
    }

    ta.value = value;
    counter.textContent = `${effectiveLength}/${MAX}`;
  }

  ta.addEventListener("input", update);
  update();
});
