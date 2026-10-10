/**
 * P5 Studio Paint - Aplikasi Menggambar & Transformasi Grafis Interaktif
 * Dibuat menggunakan library p5.js, HTML5, CSS3, dan Vanilla JavaScript.
 * 
 * Fitur:
 * 1. Load Image: Unggah dari perangkat, drag & drop, atau URL.
 * 2. Bentuk Primitif p5.js: Line, Rect, Ellipse, Triangle, Quad, Point, Kuas (Freehand).
 * 3. Kustomisasi Warna Datar: Fill, Stroke, Stroke Weight, Preset Palet.
 * 4. Transformasi Geometri Objek: Translation (X, Y), Rotation (sudut), Scaling (skala).
 * 5. Undo / Redo, Ekspor Gambar (PNG, JPG), Manajemen Lapisan.
 */

// =============================================================================
// STATE APLIKASI
// =============================================================================
const AppState = {
  // Kanvas
  canvasWidth: 850,
  canvasHeight: 550,
  bgColor: '#ffffff',

  // Mode alat aktif: 'select' | 'brush' | 'line' | 'rect' | 'ellipse' | 'triangle' | 'quad' | 'point'
  currentTool: 'select',

  // Properti Gaya / Warna Datar
  fillEnabled: true,
  fillColor: '#38bdf8',
  strokeEnabled: true,
  strokeColor: '#0f172a',
  strokeWeight: 3,

  // Daftar objek di kanvas (vektor / gambar)
  objects: [],
  selectedId: null,

  // Status Interaksi Mouse
  isInteracting: false,
  interactionMode: null, // 'draw' | 'translate' | 'rotate' | 'scale'
  dragStart: { x: 0, y: 0 },
  initialObjState: null,
  activeHandle: null,

  // Gambar bebas sementara saat mode brush atau preview bentuk
  currentDraft: null,

  // Riwayat Undo / Redo
  history: [],
  historyIndex: -1,
  maxHistory: 30
};

let nextObjectId = 1;

// =============================================================================
// P5.JS LIFECYCLE FUNCTIONS
// =============================================================================

function setup() {
  const container = document.getElementById('canvas-container');
  const canvas = createCanvas(AppState.canvasWidth, AppState.canvasHeight);
  canvas.parent('canvas-container');

  // Mencegah klik kanan default di kanvas
  canvas.elt.oncontextmenu = (e) => e.preventDefault();

  // Inisialisasi UI Event Listeners
  initUIEventListeners();

  // Simpan riwayat awal kanvas kosong
  saveHistoryState();
  updateStatusCoordinates(0, 0);
  updateObjectsCountUI();
}

function draw() {
  // Bersihkan latar belakang kanvas
  background(AppState.bgColor);

  // 1. Gambar semua objek yang ada di kanvas
  for (let i = 0; i < AppState.objects.length; i++) {
    const obj = AppState.objects[i];
    renderObject(obj);
  }

  // 2. Gambar preview bentuk saat sedang menggambar baru
  if (AppState.interactionMode === 'draw' && AppState.currentDraft) {
    renderDraftPreview(AppState.currentDraft);
  }

  // 3. Gambar Bounding Box & Transform Handles jika ada objek terpilih
  const selectedObj = getSelectedObject();
  if (selectedObj && AppState.currentTool === 'select') {
    renderTransformGizmo(selectedObj);
  }
}

// =============================================================================
// RENDERING OBJEK DENGAN TRANSFORMASI (p5.js Matrix)
// =============================================================================

/**
 * Merender objek dengan menerapkan transformasi geometri p5.js:
 * translate(x, y) -> rotate(rad) -> scale(s)
 */
function renderObject(obj) {
  push();

  // Menerapkan Transformasi Geometri (Translation, Rotation, Scaling)
  translate(obj.x, obj.y);
  rotate(obj.rotation);
  scale(obj.scale);

  // Atur Warna Datar (Flat Color)
  if (obj.fillEnabled && obj.type !== 'line' && obj.type !== 'point') {
    fill(obj.fillColor);
  } else {
    noFill();
  }

  if (obj.strokeEnabled) {
    stroke(obj.strokeColor);
    strokeWeight(obj.strokeWeight / Math.max(0.2, obj.scale)); // Sesuaikan bobot garis
    strokeCap(ROUND);
    strokeJoin(ROUND);
  } else {
    noStroke();
  }

  // Render sesuai jenis bentuk primitif p5.js
  switch (obj.type) {
    case 'rect':
      rectMode(CENTER);
      rect(0, 0, obj.width, obj.height, obj.borderRadius || 0);
      break;

    case 'ellipse':
      ellipseMode(CENTER);
      ellipse(0, 0, obj.width, obj.height);
      break;

    case 'line':
      line(-obj.width / 2, -obj.height / 2, obj.width / 2, obj.height / 2);
      break;

    case 'triangle':
      // Segitiga terpusat di origin (0, 0)
      triangle(
        0, -obj.height / 2,
        -obj.width / 2, obj.height / 2,
        obj.width / 2, obj.height / 2
      );
      break;

    case 'quad':
      // Segiempat / Quad primitif p5.js
      quad(
        -obj.width / 2, -obj.height / 2 + obj.height * 0.1,
        obj.width / 2, -obj.height / 2,
        obj.width / 2 - obj.width * 0.1, obj.height / 2,
        -obj.width / 2, obj.height / 2 - obj.height * 0.1
      );
      break;

    case 'point':
      stroke(obj.strokeColor);
      strokeWeight(Math.max(obj.strokeWeight * 2, 6) / Math.max(0.2, obj.scale));
      point(0, 0);
      break;

    case 'brush':
      // Garis kuas bebas (freehand path)
      if (obj.points && obj.points.length > 1) {
        noFill();
        beginShape();
        for (let pt of obj.points) {
          vertex(pt.x, pt.y);
        }
        endShape();
      }
      break;

    case 'image':
      if (obj.img) {
        imageMode(CENTER);
        image(obj.img, 0, 0, obj.width, obj.height);
      }
      break;
  }

  pop();
}

/**
 * Render visual preview saat pengguna sedang menarik mouse untuk menggambar
 */
function renderDraftPreview(draft) {
  push();
  if (draft.fillEnabled && draft.type !== 'line' && draft.type !== 'point') {
    fill(draft.fillColor);
  } else {
    noFill();
  }

  if (draft.strokeEnabled) {
    stroke(draft.strokeColor);
    strokeWeight(draft.strokeWeight);
    strokeCap(ROUND);
    strokeJoin(ROUND);
  } else {
    noStroke();
  }

  const { startX, startY, currentX, currentY, type } = draft;
  const w = currentX - startX;
  const h = currentY - startY;

  switch (type) {
    case 'rect':
      rectMode(CORNER);
      rect(startX, startY, w, h);
      break;

    case 'ellipse':
      ellipseMode(CENTER);
      ellipse(startX + w / 2, startY + h / 2, Math.abs(w), Math.abs(h));
      break;

    case 'line':
      line(startX, startY, currentX, currentY);
      break;

    case 'triangle':
      triangle(
        startX + w / 2, startY,
        startX, startY + h,
        startX + w, startY + h
      );
      break;

    case 'quad':
      quad(
        startX, startY + h * 0.1,
        startX + w, startY,
        startX + w * 0.9, startY + h,
        startX, startY + h * 0.9
      );
      break;

    case 'point':
      stroke(draft.strokeColor);
      strokeWeight(Math.max(draft.strokeWeight * 2, 6));
      point(startX, startY);
      break;

    case 'brush':
      if (draft.points && draft.points.length > 1) {
        noFill();
        beginShape();
        for (let pt of draft.points) {
          vertex(pt.x, pt.y);
        }
        endShape();
      }
      break;
  }
  pop();
}

/**
 * Merender Bounding Box dan Handle Transformasi (Gizmo)
 */
function renderTransformGizmo(obj) {
  push();
  translate(obj.x, obj.y);
  rotate(obj.rotation);

  const hw = (obj.width * obj.scale) / 2;
  const hh = (obj.height * obj.scale) / 2;
  const padding = 6;
  const boxW = (hw + padding) * 2;
  const boxH = (hh + padding) * 2;

  // 1. Kotak Bounding Box
  noFill();
  stroke('#38bdf8');
  strokeWeight(1.5);
  drawingContext.setLineDash([4, 4]); // Garis putus-putus modern
  rectMode(CENTER);
  rect(0, 0, boxW, boxH);
  drawingContext.setLineDash([]); // Reset dash

  // 2. Garis penghubung tuas rotasi
  stroke('#38bdf8');
  strokeWeight(1.5);
  line(0, -(hh + padding), 0, -(hh + padding + 22));

  // 3. Handle Rotasi (Lingkaran di bagian atas)
  fill('#0284c7');
  stroke('#ffffff');
  strokeWeight(2);
  ellipse(0, -(hh + padding + 22), 12, 12);

  // 4. Handle Skala pada 4 Sudut (Corner Scale Handles)
  fill('#ffffff');
  stroke('#0284c7');
  strokeWeight(2);
  rectMode(CENTER);
  const handleSize = 9;

  // Top-Left, Top-Right, Bottom-Right, Bottom-Left
  rect(-(hw + padding), -(hh + padding), handleSize, handleSize, 2);
  rect(hw + padding, -(hh + padding), handleSize, handleSize, 2);
  rect(hw + padding, hh + padding, handleSize, handleSize, 2);
  rect(-(hw + padding), hh + padding, handleSize, handleSize, 2);

  // 5. Titik Pusat (Origin center cross)
  stroke('#38bdf8');
  strokeWeight(1);
  line(-4, 0, 4, 0);
  line(0, -4, 0, 4);

  pop();
}

// =============================================================================
// INTERAKSI MOUSE (p5.js Events)
// =============================================================================

function mousePressed() {
  // Hanya proses jika klik berada di dalam area kanvas
  if (mouseX < 0 || mouseX > width || mouseY < 0 || mouseY > height) {
    return;
  }

  // JIKA DALAM MODE SELECT
  if (AppState.currentTool === 'select') {
    const selectedObj = getSelectedObject();

    // 1. Cek apakah mengklik handle pada objek yang sedang terpilih
    if (selectedObj) {
      const handleHit = testGizmoHandleHit(selectedObj, mouseX, mouseY);
      if (handleHit) {
        AppState.isInteracting = true;
        AppState.interactionMode = handleHit.type; // 'rotate' atau 'scale'
        AppState.activeHandle = handleHit.handle;
        AppState.dragStart = { x: mouseX, y: mouseY };
        AppState.initialObjState = cloneSingleObject(selectedObj);
        return;
      }
    }

    // 2. Cek apakah mengklik objek di kanvas (dari lapisan paling atas ke bawah)
    let clickedObj = null;
    for (let i = AppState.objects.length - 1; i >= 0; i--) {
      if (isPointInsideObject(AppState.objects[i], mouseX, mouseY)) {
        clickedObj = AppState.objects[i];
        break;
      }
    }

    if (clickedObj) {
      selectObject(clickedObj.id);
      AppState.isInteracting = true;
      AppState.interactionMode = 'translate';
      AppState.dragStart = { x: mouseX, y: mouseY };
      AppState.initialObjState = cloneSingleObject(clickedObj);
    } else {
      // Klik di ruang kosong kanvas -> batalkan seleksi
      deselectAll();
    }
    return;
  }

  // JIKA DALAM MODE MENGGAMBAR BENTUK / BRUSH
  AppState.isInteracting = true;
  AppState.interactionMode = 'draw';
  AppState.dragStart = { x: mouseX, y: mouseY };

  if (AppState.currentTool === 'brush') {
    AppState.currentDraft = {
      type: 'brush',
      fillEnabled: false,
      fillColor: AppState.fillColor,
      strokeEnabled: true,
      strokeColor: AppState.strokeColor,
      strokeWeight: AppState.strokeWeight,
      points: [{ x: mouseX, y: mouseY }]
    };
  } else {
    AppState.currentDraft = {
      type: AppState.currentTool,
      startX: mouseX,
      startY: mouseY,
      currentX: mouseX,
      currentY: mouseY,
      fillEnabled: AppState.fillEnabled,
      fillColor: AppState.fillColor,
      strokeEnabled: AppState.strokeEnabled,
      strokeColor: AppState.strokeColor,
      strokeWeight: AppState.strokeWeight
    };
  }
}

function mouseDragged() {
  if (!AppState.isInteracting) return;

  const selectedObj = getSelectedObject();

  // 1. TRANSFORMASI: TRANSLATION (Pergeseran Posisi)
  if (AppState.interactionMode === 'translate' && selectedObj) {
    const dx = mouseX - AppState.dragStart.x;
    const dy = mouseY - AppState.dragStart.y;

    selectedObj.x = Math.round(AppState.initialObjState.x + dx);
    selectedObj.y = Math.round(AppState.initialObjState.y + dy);

    updateTransformUI(selectedObj);
    return;
  }

  // 2. TRANSFORMASI: ROTATION (Rotasi Sudut)
  if (AppState.interactionMode === 'rotate' && selectedObj) {
    // Sudut dari titik pusat objek ke posisi mouse saat ini
    const angleToMouse = Math.atan2(mouseY - selectedObj.y, mouseX - selectedObj.x);
    // Tambah 90 derajat (Math.PI / 2) karena handle berada di puncak (atas) objek
    let newAngle = angleToMouse + Math.PI / 2;

    // Normalisasi rentang sudut
    while (newAngle > Math.PI) newAngle -= Math.PI * 2;
    while (newAngle < -Math.PI) newAngle += Math.PI * 2;

    selectedObj.rotation = newAngle;
    updateTransformUI(selectedObj);
    return;
  }

  // 3. TRANSFORMASI: SCALING (Pengubahan Ukuran)
  if (AppState.interactionMode === 'scale' && selectedObj) {
    const initDist = dist(
      AppState.initialObjState.x,
      AppState.initialObjState.y,
      AppState.dragStart.x,
      AppState.dragStart.y
    );
    const currDist = dist(
      selectedObj.x,
      selectedObj.y,
      mouseX,
      mouseY
    );

    if (initDist > 0) {
      const scaleMultiplier = currDist / initDist;
      let newScale = AppState.initialObjState.scale * scaleMultiplier;
      // Batasi skala wajar 0.1x hingga 5.0x
      newScale = Math.max(0.1, Math.min(5.0, newScale));
      selectedObj.scale = parseFloat(newScale.toFixed(2));
      updateTransformUI(selectedObj);
    }
    return;
  }

  // 4. MENGGAMBAR BENTUK / BRUSH
  if (AppState.interactionMode === 'draw' && AppState.currentDraft) {
    if (AppState.currentDraft.type === 'brush') {
      AppState.currentDraft.points.push({ x: mouseX, y: mouseY });
    } else {
      AppState.currentDraft.currentX = mouseX;
      AppState.currentDraft.currentY = mouseY;
    }
  }
}

function mouseReleased() {
  if (!AppState.isInteracting) return;

  // Jika sedang menyelesaikan transformasi (translate, rotate, scale)
  if (['translate', 'rotate', 'scale'].includes(AppState.interactionMode)) {
    const selectedObj = getSelectedObject();
    if (selectedObj && AppState.initialObjState) {
      // Cek apakah ada perubahan nyata
      if (
        selectedObj.x !== AppState.initialObjState.x ||
        selectedObj.y !== AppState.initialObjState.y ||
        selectedObj.rotation !== AppState.initialObjState.rotation ||
        selectedObj.scale !== AppState.initialObjState.scale
      ) {
        saveHistoryState();
      }
    }
  }

  // Jika sedang menyelesaikan pembuatan bentuk baru
  if (AppState.interactionMode === 'draw' && AppState.currentDraft) {
    finalizeDraftObject(AppState.currentDraft);
    AppState.currentDraft = null;
  }

  AppState.isInteracting = false;
  AppState.interactionMode = null;
  AppState.activeHandle = null;
  AppState.initialObjState = null;
}

function mouseMoved() {
  updateStatusCoordinates(Math.round(mouseX), Math.round(mouseY));
}

// =============================================================================
// PEMBUATAN OBJEK DARI DRAFT KE DAFTAR KANVAS
// =============================================================================

function finalizeDraftObject(draft) {
  let newObj = null;

  if (draft.type === 'brush') {
    if (!draft.points || draft.points.length < 2) return;

    // Hitung bounding box dari kuas untuk menentukan titik tengah
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (let p of draft.points) {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    }

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const w = Math.max(20, maxX - minX);
    const h = Math.max(20, maxY - minY);

    // Titik-titik disimpan relatif terhadap origin center (0, 0)
    const relativePoints = draft.points.map(p => ({
      x: p.x - centerX,
      y: p.y - centerY
    }));

    newObj = {
      id: nextObjectId++,
      type: 'brush',
      x: Math.round(centerX),
      y: Math.round(centerY),
      width: Math.round(w),
      height: Math.round(h),
      rotation: 0,
      scale: 1.0,
      points: relativePoints,
      fillEnabled: false,
      fillColor: draft.fillColor,
      strokeEnabled: true,
      strokeColor: draft.strokeColor,
      strokeWeight: draft.strokeWeight
    };
  } else if (draft.type === 'point') {
    newObj = {
      id: nextObjectId++,
      type: 'point',
      x: Math.round(draft.startX),
      y: Math.round(draft.startY),
      width: 16,
      height: 16,
      rotation: 0,
      scale: 1.0,
      fillEnabled: false,
      fillColor: draft.fillColor,
      strokeEnabled: true,
      strokeColor: draft.strokeColor,
      strokeWeight: draft.strokeWeight
    };
  } else {
    // Bentuk geometri primitif (rect, ellipse, line, triangle, quad)
    const x1 = draft.startX;
    const y1 = draft.startY;
    const x2 = draft.currentX;
    const y2 = draft.currentY;

    const w = Math.abs(x2 - x1);
    const h = Math.abs(y2 - y1);

    // Mencegah pembuatan objek jika ukuran klik terlalu kecil (< 5px)
    if (w < 5 && h < 5) return;

    const centerX = (x1 + x2) / 2;
    const centerY = (y1 + y2) / 2;

    newObj = {
      id: nextObjectId++,
      type: draft.type,
      x: Math.round(centerX),
      y: Math.round(centerY),
      width: Math.round(Math.max(w, 15)),
      height: Math.round(Math.max(h, 15)),
      rotation: 0,
      scale: 1.0,
      fillEnabled: draft.fillEnabled,
      fillColor: draft.fillColor,
      strokeEnabled: draft.strokeEnabled,
      strokeColor: draft.strokeColor,
      strokeWeight: draft.strokeWeight
    };
  }

  if (newObj) {
    AppState.objects.push(newObj);
    saveHistoryState();
    updateObjectsCountUI();

    // Otomatis pilih objek baru dan alihkan ke mode select agar langsung bisa ditransformasi
    selectObject(newObj.id);
    setTool('select');
  }
}

// =============================================================================
// HIT TESTING & LOGIKA MATEMATIKA TRANSFORMASI
// =============================================================================

/**
 * Memeriksa apakah suatu titik koordinat (px, py) berada di dalam objek
 * dengan memperhitungkan posisi (x, y), rotasi sudut, dan skala objek.
 */
function isPointInsideObject(obj, px, py) {
  // 1. Translasi titik mouse ke koordinat lokal objek
  const dx = px - obj.x;
  const dy = py - obj.y;

  // 2. Rotasi terbalik (-rotation)
  const cosA = Math.cos(-obj.rotation);
  const sinA = Math.sin(-obj.rotation);
  const localX = dx * cosA - dy * sinA;
  const localY = dx * sinA + dy * cosA;

  // 3. Batas objek dengan skala
  const halfW = (obj.width * obj.scale) / 2 + 8; // Margin toleransi klik
  const halfH = (obj.height * obj.scale) / 2 + 8;

  return Math.abs(localX) <= halfW && Math.abs(localY) <= halfH;
}

/**
 * Memeriksa apakah mouse mengklik handle gizmo (rotasi atau skala pada sudut)
 */
function testGizmoHandleHit(obj, mx, my) {
  // Hitung posisi lokal handle relatif terhadap origin objek
  const hw = (obj.width * obj.scale) / 2;
  const hh = (obj.height * obj.scale) / 2;
  const padding = 6;
  const hitRadius = 12;

  // Handle Rotasi (Puncak atas)
  const rotWorld = localToWorld(0, -(hh + padding + 22), obj.x, obj.y, obj.rotation);
  if (dist(mx, my, rotWorld.x, rotWorld.y) <= hitRadius) {
    return { type: 'rotate', handle: 'rot' };
  }

  // Handle Skala pada 4 Sudut
  const corners = [
    { name: 'tl', lx: -(hw + padding), ly: -(hh + padding) },
    { name: 'tr', lx: hw + padding, ly: -(hh + padding) },
    { name: 'br', lx: hw + padding, ly: hh + padding },
    { name: 'bl', lx: -(hw + padding), ly: hh + padding }
  ];

  for (let c of corners) {
    const worldPt = localToWorld(c.lx, c.ly, obj.x, obj.y, obj.rotation);
    if (dist(mx, my, worldPt.x, worldPt.y) <= hitRadius) {
      return { type: 'scale', handle: c.name };
    }
  }

  return null;
}

/**
 * Konversi koordinat lokal objek ke koordinat kanvas dunia (World Coordinates)
 */
function localToWorld(lx, ly, ox, oy, angle) {
  const cosA = Math.cos(angle);
  const sinA = Math.sin(angle);
  return {
    x: ox + (lx * cosA - ly * sinA),
    y: oy + (lx * sinA + ly * cosA)
  };
}

// =============================================================================
// FITUR 1: LOAD IMAGE (Unggah Gambar dari Perangkat / URL)
// =============================================================================

/**
 * Menambahkan objek gambar ke dalam kanvas p5.js
 */
function addImageToCanvas(p5Img, imageName = 'Gambar') {
  // Hitung skala awal agar gambar pas dan proporsional di dalam kanvas
  let w = p5Img.width;
  let h = p5Img.height;
  const maxW = AppState.canvasWidth * 0.6;
  const maxH = AppState.canvasHeight * 0.6;

  if (w > maxW || h > maxH) {
    const ratio = Math.min(maxW / w, maxH / h);
    w = Math.round(w * ratio);
    h = Math.round(h * ratio);
  }

  const newObj = {
    id: nextObjectId++,
    type: 'image',
    name: imageName,
    img: p5Img,
    x: Math.round(AppState.canvasWidth / 2),
    y: Math.round(AppState.canvasHeight / 2),
    width: w,
    height: h,
    rotation: 0,
    scale: 1.0,
    fillEnabled: false,
    strokeEnabled: false,
    strokeColor: '#000000',
    strokeWeight: 0
  };

  AppState.objects.push(newObj);
  saveHistoryState();
  updateObjectsCountUI();

  // Otomatis pilih gambar dan aktifkan mode select
  selectObject(newObj.id);
  setTool('select');
}

/**
 * Muat file gambar dari FileReader
 */
function handleFileSelect(file) {
  if (!file || !file.type.startsWith('image/')) {
    alert('Harap pilih file gambar yang valid (PNG, JPG, SVG, WebP, dll).');
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    loadImage(e.target.result, (loadedP5Img) => {
      addImageToCanvas(loadedP5Img, file.name);
    }, (err) => {
      console.error('Gagal memuat gambar:', err);
      alert('Terjadi kesalahan saat memuat file gambar.');
    });
  };
  reader.readAsDataURL(file);
}

// =============================================================================
// MANAJEMEN OBJEK & SELEKSI
// =============================================================================

function getSelectedObject() {
  if (!AppState.selectedId) return null;
  return AppState.objects.find(o => o.id === AppState.selectedId) || null;
}

function selectObject(id) {
  AppState.selectedId = id;
  const obj = getSelectedObject();
  if (obj) {
    // Sinkronkan panel warna dengan properti objek yang dipilih
    syncColorPickersWithObject(obj);
    updateTransformUI(obj);
    enableTransformPanel(true, obj.type);
  }
}

function deselectAll() {
  AppState.selectedId = null;
  enableTransformPanel(false);
}

function syncColorPickersWithObject(obj) {
  if (obj.type !== 'image') {
    document.getElementById('chk-fill-enable').checked = obj.fillEnabled;
    document.getElementById('picker-fill').value = obj.fillColor;
    document.getElementById('hex-fill').value = obj.fillColor;

    document.getElementById('chk-stroke-enable').checked = obj.strokeEnabled;
    document.getElementById('picker-stroke').value = obj.strokeColor;
    document.getElementById('hex-stroke').value = obj.strokeColor;

    document.getElementById('range-stroke-weight').value = obj.strokeWeight;
    document.getElementById('val-stroke-weight').textContent = `${obj.strokeWeight} px`;

    AppState.fillEnabled = obj.fillEnabled;
    AppState.fillColor = obj.fillColor;
    AppState.strokeEnabled = obj.strokeEnabled;
    AppState.strokeColor = obj.strokeColor;
    AppState.strokeWeight = obj.strokeWeight;
  }
}

// =============================================================================
// FITUR 3: TRANSFORMASI OBJEK VIA UI & GIZMO
// =============================================================================

function updateTransformUI(obj) {
  if (!obj) return;

  // 1. Translation
  document.getElementById('input-pos-x').value = Math.round(obj.x);
  document.getElementById('input-pos-y').value = Math.round(obj.y);

  // 2. Rotation (Derajat)
  const deg = Math.round((obj.rotation * 180) / Math.PI);
  document.getElementById('range-rotation').value = deg;
  document.getElementById('input-rotation').value = deg;
  document.getElementById('val-rotation').textContent = `${deg}°`;

  // 3. Scaling
  const scaleVal = parseFloat(obj.scale.toFixed(2));
  document.getElementById('range-scale').value = scaleVal;
  document.getElementById('input-scale').value = scaleVal;
  document.getElementById('val-scale').textContent = `${scaleVal.toFixed(1)}× (${Math.round(scaleVal * 100)}%)`;
}

function enableTransformPanel(enabled, objType = 'Tidak Ada') {
  const ids = [
    'input-pos-x', 'input-pos-y', 'btn-center-obj',
    'range-rotation', 'input-rotation', 'btn-rot-ccw', 'btn-rot-reset', 'btn-rot-cw',
    'range-scale', 'input-scale', 'btn-scale-half', 'btn-scale-reset', 'btn-scale-double',
    'btn-bring-front', 'btn-send-back', 'btn-duplicate-obj', 'btn-delete-obj'
  ];

  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.disabled = !enabled;
  });

  const typeBadge = document.getElementById('selected-object-type');
  if (enabled) {
    typeBadge.textContent = objType.toUpperCase();
    typeBadge.style.display = 'inline-block';
  } else {
    typeBadge.textContent = 'Tidak Ada Objek';
  }
}

// =============================================================================
// RIWAYAT UNDO / REDO
// =============================================================================

function saveHistoryState() {
  // Potong riwayat setelah indeks saat ini jika pernah undo sebelumnya
  if (AppState.historyIndex < AppState.history.length - 1) {
    AppState.history = AppState.history.slice(0, AppState.historyIndex + 1);
  }

  // Buat snapshot dari array objek
  const snapshot = AppState.objects.map(obj => cloneSingleObject(obj));
  AppState.history.push(snapshot);

  if (AppState.history.length > AppState.maxHistory) {
    AppState.history.shift();
  } else {
    AppState.historyIndex++;
  }

  updateUndoRedoUI();
}

function undo() {
  if (AppState.historyIndex > 0) {
    AppState.historyIndex--;
    restoreSnapshot(AppState.history[AppState.historyIndex]);
    updateUndoRedoUI();
  }
}

function redo() {
  if (AppState.historyIndex < AppState.history.length - 1) {
    AppState.historyIndex++;
    restoreSnapshot(AppState.history[AppState.historyIndex]);
    updateUndoRedoUI();
  }
}

function restoreSnapshot(snapshot) {
  AppState.objects = snapshot.map(obj => cloneSingleObject(obj));
  // Periksa apakah objek terpilih masih ada
  if (!AppState.objects.some(o => o.id === AppState.selectedId)) {
    deselectAll();
  } else {
    const obj = getSelectedObject();
    if (obj) updateTransformUI(obj);
  }
  updateObjectsCountUI();
}

function updateUndoRedoUI() {
  const btnUndo = document.getElementById('btn-undo');
  const btnRedo = document.getElementById('btn-redo');

  if (btnUndo) btnUndo.disabled = AppState.historyIndex <= 0;
  if (btnRedo) btnRedo.disabled = AppState.historyIndex >= AppState.history.length - 1;
}

function cloneSingleObject(obj) {
  const clone = { ...obj };
  if (obj.points) {
    clone.points = obj.points.map(p => ({ ...p }));
  }
  return clone;
}

// =============================================================================
// INISIALISASI UI EVENT LISTENERS
// =============================================================================

function initUIEventListeners() {
  // 1. Tool Selection (Left Sidebar)
  const toolButtons = document.querySelectorAll('.tool-btn');
  toolButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const tool = btn.dataset.tool;
      setTool(tool);
    });
  });

  // 2. Load Image: File Input & Dropzone
  const btnTriggerUpload = document.getElementById('btn-trigger-upload');
  const imageFileInput = document.getElementById('image-file-input');
  const uploadDropzone = document.getElementById('upload-dropzone');

  if (btnTriggerUpload && imageFileInput) {
    btnTriggerUpload.addEventListener('click', () => imageFileInput.click());
    imageFileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        handleFileSelect(e.target.files[0]);
        e.target.value = ''; // Reset input
      }
    });
  }

  // Drag and Drop Gambar ke Upload Box & Viewport
  ['dragenter', 'dragover'].forEach(eventName => {
    document.addEventListener(eventName, (e) => {
      e.preventDefault();
      if (uploadDropzone) uploadDropzone.classList.add('dragover');
    }, false);
  });

  ['dragleave', 'drop'].forEach(eventName => {
    document.addEventListener(eventName, (e) => {
      e.preventDefault();
      if (uploadDropzone) uploadDropzone.classList.remove('dragover');
    }, false);
  });

  document.addEventListener('drop', (e) => {
    e.preventDefault();
    if (e.dataTransfer && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  });

  // Load Image via URL
  const btnLoadUrl = document.getElementById('btn-load-url');
  const inputUrl = document.getElementById('image-url-input');
  if (btnLoadUrl && inputUrl) {
    btnLoadUrl.addEventListener('click', () => {
      const url = inputUrl.value.trim();
      if (url) {
        loadImage(url, (loadedImg) => {
          addImageToCanvas(loadedImg, 'URL Image');
          inputUrl.value = '';
        }, (err) => {
          alert('Gagal memuat gambar dari URL. Pastikan URL dapat diakses (CORS diizinkan).');
        });
      }
    });
  }

  // 3. Warna & Gaya (Fill, Stroke, Weight)
  const chkFill = document.getElementById('chk-fill-enable');
  const pickerFill = document.getElementById('picker-fill');
  const hexFill = document.getElementById('hex-fill');

  chkFill.addEventListener('change', (e) => {
    AppState.fillEnabled = e.target.checked;
    const selected = getSelectedObject();
    if (selected && selected.type !== 'line' && selected.type !== 'point') {
      selected.fillEnabled = e.target.checked;
      saveHistoryState();
    }
  });

  const onFillChange = (val) => {
    AppState.fillColor = val;
    pickerFill.value = val;
    hexFill.value = val;
    const selected = getSelectedObject();
    if (selected && selected.type !== 'image') {
      selected.fillColor = val;
      selected.fillEnabled = true;
      chkFill.checked = true;
      saveHistoryState();
    }
  };

  pickerFill.addEventListener('input', (e) => onFillChange(e.target.value));
  hexFill.addEventListener('change', (e) => {
    if (/^#[0-9A-F]{6}$/i.test(e.target.value)) {
      onFillChange(e.target.value);
    }
  });

  // Stroke
  const chkStroke = document.getElementById('chk-stroke-enable');
  const pickerStroke = document.getElementById('picker-stroke');
  const hexStroke = document.getElementById('hex-stroke');
  const rangeWeight = document.getElementById('range-stroke-weight');
  const valWeight = document.getElementById('val-stroke-weight');

  chkStroke.addEventListener('change', (e) => {
    AppState.strokeEnabled = e.target.checked;
    const selected = getSelectedObject();
    if (selected) {
      selected.strokeEnabled = e.target.checked;
      saveHistoryState();
    }
  });

  const onStrokeChange = (val) => {
    AppState.strokeColor = val;
    pickerStroke.value = val;
    hexStroke.value = val;
    const selected = getSelectedObject();
    if (selected) {
      selected.strokeColor = val;
      selected.strokeEnabled = true;
      chkStroke.checked = true;
      saveHistoryState();
    }
  };

  pickerStroke.addEventListener('input', (e) => onStrokeChange(e.target.value));
  hexStroke.addEventListener('change', (e) => {
    if (/^#[0-9A-F]{6}$/i.test(e.target.value)) {
      onStrokeChange(e.target.value);
    }
  });

  rangeWeight.addEventListener('input', (e) => {
    const val = parseInt(e.target.value);
    AppState.strokeWeight = val;
    valWeight.textContent = `${val} px`;
    const selected = getSelectedObject();
    if (selected) {
      selected.strokeWeight = val;
    }
  });

  rangeWeight.addEventListener('change', () => {
    if (getSelectedObject()) saveHistoryState();
  });

  // Quick Palette Swatches
  const swatches = document.querySelectorAll('.palette-swatch');
  swatches.forEach(swatch => {
    swatch.addEventListener('click', () => {
      const color = swatch.dataset.color;
      onFillChange(color);
    });
  });

  // 4. Panel Transformasi (Translation, Rotation, Scaling)
  const inputPosX = document.getElementById('input-pos-x');
  const inputPosY = document.getElementById('input-pos-y');
  const btnCenterObj = document.getElementById('btn-center-obj');

  inputPosX.addEventListener('change', (e) => {
    const selected = getSelectedObject();
    if (selected) {
      selected.x = parseInt(e.target.value) || 0;
      saveHistoryState();
    }
  });

  inputPosY.addEventListener('change', (e) => {
    const selected = getSelectedObject();
    if (selected) {
      selected.y = parseInt(e.target.value) || 0;
      saveHistoryState();
    }
  });

  btnCenterObj.addEventListener('click', () => {
    const selected = getSelectedObject();
    if (selected) {
      selected.x = Math.round(width / 2);
      selected.y = Math.round(height / 2);
      updateTransformUI(selected);
      saveHistoryState();
    }
  });

  // Rotasi
  const rangeRot = document.getElementById('range-rotation');
  const inputRot = document.getElementById('input-rotation');
  const btnRotCCW = document.getElementById('btn-rot-ccw');
  const btnRotReset = document.getElementById('btn-rot-reset');
  const btnRotCW = document.getElementById('btn-rot-cw');

  const setObjRotationDeg = (deg) => {
    const selected = getSelectedObject();
    if (selected) {
      selected.rotation = (deg * Math.PI) / 180;
      updateTransformUI(selected);
      saveHistoryState();
    }
  };

  rangeRot.addEventListener('input', (e) => {
    const selected = getSelectedObject();
    if (selected) {
      const deg = parseInt(e.target.value);
      selected.rotation = (deg * Math.PI) / 180;
      document.getElementById('val-rotation').textContent = `${deg}°`;
      document.getElementById('input-rotation').value = deg;
    }
  });
  rangeRot.addEventListener('change', () => saveHistoryState());

  inputRot.addEventListener('change', (e) => {
    setObjRotationDeg(parseInt(e.target.value) || 0);
  });

  btnRotCCW.addEventListener('click', () => {
    const selected = getSelectedObject();
    if (selected) {
      const curDeg = Math.round((selected.rotation * 180) / Math.PI);
      setObjRotationDeg(curDeg - 90);
    }
  });

  btnRotCW.addEventListener('click', () => {
    const selected = getSelectedObject();
    if (selected) {
      const curDeg = Math.round((selected.rotation * 180) / Math.PI);
      setObjRotationDeg(curDeg + 90);
    }
  });

  btnRotReset.addEventListener('click', () => setObjRotationDeg(0));

  // Skala
  const rangeScale = document.getElementById('range-scale');
  const inputScale = document.getElementById('input-scale');
  const btnScaleHalf = document.getElementById('btn-scale-half');
  const btnScaleReset = document.getElementById('btn-scale-reset');
  const btnScaleDouble = document.getElementById('btn-scale-double');

  const setObjScale = (sc) => {
    const selected = getSelectedObject();
    if (selected) {
      selected.scale = parseFloat(Math.max(0.1, Math.min(5.0, sc)).toFixed(2));
      updateTransformUI(selected);
      saveHistoryState();
    }
  };

  rangeScale.addEventListener('input', (e) => {
    const selected = getSelectedObject();
    if (selected) {
      const sc = parseFloat(e.target.value);
      selected.scale = sc;
      document.getElementById('val-scale').textContent = `${sc.toFixed(1)}× (${Math.round(sc * 100)}%)`;
      document.getElementById('input-scale').value = sc;
    }
  });
  rangeScale.addEventListener('change', () => saveHistoryState());

  inputScale.addEventListener('change', (e) => {
    setObjScale(parseFloat(e.target.value) || 1.0);
  });

  btnScaleHalf.addEventListener('click', () => setObjScale(0.5));
  btnScaleReset.addEventListener('click', () => setObjScale(1.0));
  btnScaleDouble.addEventListener('click', () => setObjScale(2.0));

  // 5. Manajemen Objek (Urutan Lapisan, Duplikasi, Hapus)
  const btnBringFront = document.getElementById('btn-bring-front');
  const btnSendBack = document.getElementById('btn-send-back');
  const btnDuplicate = document.getElementById('btn-duplicate-obj');
  const btnDelete = document.getElementById('btn-delete-obj');

  btnBringFront.addEventListener('click', () => {
    const index = AppState.objects.findIndex(o => o.id === AppState.selectedId);
    if (index !== -1 && index < AppState.objects.length - 1) {
      const [item] = AppState.objects.splice(index, 1);
      AppState.objects.push(item);
      saveHistoryState();
    }
  });

  btnSendBack.addEventListener('click', () => {
    const index = AppState.objects.findIndex(o => o.id === AppState.selectedId);
    if (index > 0) {
      const [item] = AppState.objects.splice(index, 1);
      AppState.objects.unshift(item);
      saveHistoryState();
    }
  });

  btnDuplicate.addEventListener('click', duplicateSelectedObject);
  btnDelete.addEventListener('click', deleteSelectedObject);

  // 6. Header Actions (Undo, Redo, Clear, Export)
  document.getElementById('btn-undo').addEventListener('click', undo);
  document.getElementById('btn-redo').addEventListener('click', redo);
  document.getElementById('btn-clear').addEventListener('click', () => {
    if (AppState.objects.length === 0) return;
    if (confirm('Apakah Anda yakin ingin menghapus semua objek di kanvas?')) {
      AppState.objects = [];
      deselectAll();
      saveHistoryState();
      updateObjectsCountUI();
    }
  });

  document.getElementById('btn-export-png').addEventListener('click', () => {
    deselectAll();
    setTimeout(() => {
      saveCanvas(`p5-studio-artwork-${Date.now()}`, 'png');
    }, 50);
  });

  document.getElementById('btn-export-jpg').addEventListener('click', () => {
    deselectAll();
    setTimeout(() => {
      saveCanvas(`p5-studio-artwork-${Date.now()}`, 'jpg');
    }, 50);
  });

  // 7. Pengaturan Ukuran Kanvas
  const btnResize = document.getElementById('btn-resize-canvas');
  const inputW = document.getElementById('canvas-width-input');
  const inputH = document.getElementById('canvas-height-input');

  const resizeCanvasHandler = (w, h) => {
    AppState.canvasWidth = w;
    AppState.canvasHeight = h;
    inputW.value = w;
    inputH.value = h;
    resizeCanvas(w, h);
  };

  btnResize.addEventListener('click', () => {
    const w = parseInt(inputW.value) || 850;
    const h = parseInt(inputH.value) || 550;
    resizeCanvasHandler(w, h);
  });

  const presetPills = document.querySelectorAll('.preset-pill');
  presetPills.forEach(pill => {
    pill.addEventListener('click', () => {
      const w = parseInt(pill.dataset.w);
      const h = parseInt(pill.dataset.h);
      resizeCanvasHandler(w, h);
    });
  });

  // Background Kanvas
  const pickerCanvasBg = document.getElementById('picker-canvas-bg');
  const hexCanvasBg = document.getElementById('hex-canvas-bg');
  const onCanvasBgChange = (val) => {
    AppState.bgColor = val;
    pickerCanvasBg.value = val;
    hexCanvasBg.value = val;
  };
  pickerCanvasBg.addEventListener('input', (e) => onCanvasBgChange(e.target.value));
  hexCanvasBg.addEventListener('change', (e) => {
    if (/^#[0-9A-F]{6}$/i.test(e.target.value)) {
      onCanvasBgChange(e.target.value);
    }
  });

  // 8. Keyboard Shortcuts
  window.addEventListener('keydown', (e) => {
    // Abaikan shortcut jika sedang mengetik di input text/number
    if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;

    if (e.key === 'v' || e.key === 'V') setTool('select');
    if (e.key === 'b' || e.key === 'B') setTool('brush');

    // Delete / Backspace
    if (e.key === 'Delete' || e.key === 'Backspace') {
      deleteSelectedObject();
    }

    // Ctrl + Z (Undo), Ctrl + Y (Redo)
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'z' || e.key === 'Z') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      } else if (e.key === 'y' || e.key === 'Y') {
        e.preventDefault();
        redo();
      } else if (e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        duplicateSelectedObject();
      }
    }
  });
}

function setTool(toolName) {
  AppState.currentTool = toolName;

  // Perbarui UI tombol aktif
  const toolButtons = document.querySelectorAll('.tool-btn');
  toolButtons.forEach(btn => {
    if (btn.dataset.tool === toolName) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // Update cursor kanvas
  const container = document.getElementById('canvas-container');
  if (toolName === 'select') {
    container.classList.add('tool-select');
  } else {
    container.classList.remove('tool-select');
    deselectAll();
  }

  // Update status bar
  const toolNamesId = {
    'select': 'Seleksi (Pilih Objek)',
    'brush': 'Kuas Bebas (Freehand)',
    'line': 'Garis (Line)',
    'rect': 'Persegi (Rectangle)',
    'ellipse': 'Lingkaran (Ellipse)',
    'triangle': 'Segitiga (Triangle)',
    'quad': 'Segiempat (Quad)',
    'point': 'Titik (Point)'
  };
  document.getElementById('status-mode').innerHTML = `Mode: <strong>${toolNamesId[toolName] || toolName}</strong>`;
}

function deleteSelectedObject() {
  if (!AppState.selectedId) return;
  AppState.objects = AppState.objects.filter(o => o.id !== AppState.selectedId);
  deselectAll();
  saveHistoryState();
  updateObjectsCountUI();
}

function duplicateSelectedObject() {
  const selected = getSelectedObject();
  if (!selected) return;

  const duplicate = cloneSingleObject(selected);
  duplicate.id = nextObjectId++;
  duplicate.x += 25; // Geser sedikit agar tampak terduplikasi
  duplicate.y += 25;

  AppState.objects.push(duplicate);
  saveHistoryState();
  updateObjectsCountUI();
  selectObject(duplicate.id);
}

function updateStatusCoordinates(x, y) {
  const el = document.getElementById('status-coords');
  if (el) el.textContent = `X: ${x}, Y: ${y}`;
}

function updateObjectsCountUI() {
  const el = document.getElementById('status-objects-count');
  if (el) el.textContent = `${AppState.objects.length} Objek`;
}
