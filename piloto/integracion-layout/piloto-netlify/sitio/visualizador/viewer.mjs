import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.169.0/examples/jsm/controls/OrbitControls.js';
import { parseDesign } from './model.mjs';

const $ = (selector) => document.querySelector(selector);
const sceneHost = $('#scene');
const fmt = (value) => value.toLocaleString('es-AR', { maximumFractionDigits: 2 });

let model = null;
let category = '';
let selected = -1;
let style = 'premium';
let explode = 0;
let loadToken = 0;
let raf = 0;
let presentationViews = [];
let activePresentationView = '';
let cameraTween = null;
let tour = { running: false, index: 0, timer: 0 };

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance', preserveDrawingBuffer: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setSize(sceneHost.clientWidth, sceneHost.clientHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.domElement.tabIndex = 0;
renderer.domElement.setAttribute('aria-label', 'Vista 3D del diseño. Arrastrá para orbitar, dos dedos para desplazar y pinch o rueda para acercar.');
sceneHost.append(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x10100f);
scene.fog = new THREE.Fog(0x10100f, 22, 68);

const camera = new THREE.PerspectiveCamera(45, 1, 0.02, 240);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.07;
controls.screenSpacePanning = true;
controls.maxPolarAngle = Math.PI * 0.92;
controls.minDistance = 1.5;
controls.maxDistance = 100;

const root = new THREE.Group();
const dimensionLayer = new THREE.Group();
const ghostLayer = new THREE.Group();
scene.add(root, dimensionLayer, ghostLayer);

const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(160, 160),
  new THREE.ShadowMaterial({ color: 0x000000, opacity: 0.23 })
);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

const grid = new THREE.GridHelper(80, 80, 0xe30613, 0x4a4a45);
grid.material.transparent = true;
grid.material.opacity = 0.16;
scene.add(grid);

const hemi = new THREE.HemisphereLight(0xffffff, 0x3a332c, 2.2);
scene.add(hemi);

const key = new THREE.DirectionalLight(0xffffff, 3.4);
key.position.set(-10, 16, 8);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
key.shadow.camera.near = 0.5;
key.shadow.camera.far = 80;
key.shadow.camera.left = -26;
key.shadow.camera.right = 26;
key.shadow.camera.top = 26;
key.shadow.camera.bottom = -26;
scene.add(key);

const rim = new THREE.PointLight(0xe30613, 28, 36);
rim.position.set(12, 7, -10);
scene.add(rim);

const materials = {
  wood: new THREE.MeshStandardMaterial({ color: 0x65432c, metalness: 0, roughness: 0.88, side: THREE.DoubleSide }),
  imported: new THREE.MeshStandardMaterial({ color: 0xe8b76b, metalness: 0.15, roughness: 0.7 }),
  tube: new THREE.MeshStandardMaterial({ color: 0xbfc3b8, metalness: 0.88, roughness: 0.2 }),
  tubeTechnical: new THREE.MeshStandardMaterial({ color: 0x2b2b29, metalness: 0.25, roughness: 0.58 }),
  brace: new THREE.MeshStandardMaterial({ color: 0x9aa092, metalness: 0.78, roughness: 0.24 }),
  platform: new THREE.MeshStandardMaterial({ color: 0x737b6e, metalness: 0.62, roughness: 0.28 }),
  platformTop: new THREE.MeshStandardMaterial({ color: 0xa6ac9e, metalness: 0.52, roughness: 0.34 }),
  head: new THREE.MeshStandardMaterial({ color: 0x2f322e, metalness: 0.72, roughness: 0.3 }),
  rail: new THREE.MeshStandardMaterial({ color: 0xcbd2c2, metalness: 0.82, roughness: 0.21 }),
  rosette: new THREE.MeshStandardMaterial({ color: 0x30342f, metalness: 0.8, roughness: 0.22 }),
  edge: new THREE.MeshStandardMaterial({ color: 0x41463f, metalness: 0.78, roughness: 0.26 }),
  profile: new THREE.MeshStandardMaterial({ color: 0x555b52, metalness: 0.74, roughness: 0.24 }),
  trussChord: new THREE.MeshStandardMaterial({ color: 0xb8bdb2, metalness: 0.84, roughness: 0.21 }),
  selected: new THREE.MeshStandardMaterial({ color: 0xe30613, metalness: 0.62, roughness: 0.2, emissive: 0x3c0004, emissiveIntensity: 0.28 }),
  ghost: new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.08, depthWrite: false }),
  dimension: new THREE.LineBasicMaterial({ color: 0xe30613, transparent: true, opacity: 0.9 }),
};

const geometries = {
  rosette: new THREE.TorusGeometry(0.061, 0.006, 8, 24),
  tubeCap: new THREE.CylinderGeometry(1, 1, 0.012, 18),
  wedge: new THREE.BoxGeometry(0.12, 0.055, 0.065),
  platformRib: new THREE.BoxGeometry(0.018, 0.016, 1),
};

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const pieceMeshes = new Map();

function lineMesh(a, b, radius, primitive) {
  const start = new THREE.Vector3(a[0], a[1], a[2]);
  const end = new THREE.Vector3(b[0], b[1], b[2]);
  const mid = start.clone().add(end).multiplyScalar(0.5);
  const dir = end.clone().sub(start);
  const length = dir.length();
  if (!length) return null;
  const radial = primitive.kind === 'rosette' || primitive.kind === 'grating' ? 8 : 18;
  const geometry = new THREE.CylinderGeometry(Math.max(radius, 0.003), Math.max(radius, 0.003), length, radial, 1);
  const mesh = new THREE.Mesh(geometry, chooseMaterial(primitive));
  mesh.position.copy(mid);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
  mesh.castShadow = primitive.kind !== 'grating';
  mesh.receiveShadow = true;
  enrichLine(mesh, length, radius, primitive);
  return mesh;
}

function enrichLine(mesh, length, radius, primitive) {
  const item = model.items[primitive.index];
  if (primitive.kind === 'rosette') {
    mesh.material = materials.rosette;
    return;
  }
  if (primitive.kind === 'grating') {
    mesh.material = materials.edge;
    return;
  }
  if (primitive.kind === 'imported' || primitive.kind === 'envelope') return;
  if (primitive.kind === 'head') {
    mesh.material = materials.head;
    return;
  }
  if (item.category === 'vertical') {
    const total = Math.max(0, Number(item.raw.largo) || length);
    for (let y = -length / 2; y <= length / 2 + 0.001; y += 0.5) addRosette(mesh, y);
    addTubeCap(mesh, -length / 2, radius);
    addTubeCap(mesh, length / 2, radius);
    if (total > 2.5) addSleeve(mesh, 0, radius);
  } else if (item.category === 'horizontalO' || item.category === 'barandilla') {
    addTubeCap(mesh, -length / 2, radius);
    addTubeCap(mesh, length / 2, radius);
    addWedge(mesh, -length / 2 + 0.055, -1);
    addWedge(mesh, length / 2 - 0.055, 1);
  } else if (item.category === 'diagonal' || item.category === 'diagonalPlanta') {
    addTubeCap(mesh, -length / 2, radius);
    addTubeCap(mesh, length / 2, radius);
  }
}

function addRosette(parent, y) {
  const rosette = new THREE.Mesh(geometries.rosette, materials.rosette);
  rosette.userData.detailMaterial = materials.rosette;
  rosette.rotation.x = Math.PI / 2;
  rosette.position.y = y;
  rosette.castShadow = true;
  rosette.receiveShadow = true;
  parent.add(rosette);
}

function addTubeCap(parent, y, radius) {
  const cap = new THREE.Mesh(geometries.tubeCap, materials.head);
  cap.userData.detailMaterial = materials.head;
  cap.scale.set(Math.max(radius * 1.35, 0.02), 1, Math.max(radius * 1.35, 0.02));
  cap.position.y = y;
  cap.castShadow = true;
  parent.add(cap);
}

function addSleeve(parent, y, radius) {
  const sleeve = new THREE.Mesh(
    new THREE.CylinderGeometry(radius * 1.38, radius * 1.38, 0.14, 18),
    materials.head
  );
  sleeve.userData.detailMaterial = materials.head;
  sleeve.position.y = y;
  sleeve.castShadow = true;
  parent.add(sleeve);
}

function addWedge(parent, y, direction) {
  const wedge = new THREE.Mesh(geometries.wedge, materials.head);
  wedge.userData.detailMaterial = materials.head;
  wedge.position.y = y;
  wedge.position.x = 0.018 * direction;
  wedge.castShadow = true;
  wedge.receiveShadow = true;
  parent.add(wedge);
}

function faceMesh(points, primitive) {
  if (points.length < 3) return null;
  const shape = points.map((p) => new THREE.Vector3(p[0], p[1], p[2]));
  const center = shape.reduce((sum, value) => sum.add(value), new THREE.Vector3()).multiplyScalar(1 / shape.length);
  const vertices = [];
  for (let i = 1; i < shape.length - 1; i++) {
    vertices.push(
      shape[0].clone().sub(center),
      shape[i].clone().sub(center),
      shape[i + 1].clone().sub(center)
    );
  }
  const geometry = new THREE.BufferGeometry().setFromPoints(vertices);
  geometry.setIndex(vertices.map((_, i) => i));
  geometry.computeVertexNormals();
  const mesh = new THREE.Mesh(geometry, primitive.kind === 'plate' ? faceMaterial(points) : chooseMaterial(primitive));
  mesh.position.copy(center);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  enrichFace(mesh, points, primitive);
  return mesh;
}

function faceMaterial(points) {
  const normal = new THREE.Vector3()
    .crossVectors(
      new THREE.Vector3().subVectors(new THREE.Vector3(...points[1]), new THREE.Vector3(...points[0])),
      new THREE.Vector3().subVectors(new THREE.Vector3(...points[2]), new THREE.Vector3(...points[0]))
    )
    .normalize();
  return Math.abs(normal.y) > 0.7 ? materials.platformTop : materials.platform;
}

function enrichFace(mesh, points, primitive) {
  const item = model.items[primitive.index];
  if (item.category !== 'plataforma') return;
  const xs = points.map((point) => point[0]);
  const zs = points.map((point) => point[2]);
  const ys = points.map((point) => point[1]);
  const width = Math.max(...zs) - Math.min(...zs);
  const length = Math.max(...xs) - Math.min(...xs);
  if (width < 0.05 || length < 0.05) return;
  const topY = Math.max(...ys);
  const centerX = (Math.max(...xs) + Math.min(...xs)) / 2;
  const centerZ = (Math.max(...zs) + Math.min(...zs)) / 2;
  if (Math.abs(mesh.position.y - topY) > 0.04) return;
  for (let x = Math.min(...xs) + 0.16; x < Math.max(...xs) - 0.05; x += 0.16) {
    const rib = new THREE.Mesh(geometries.platformRib, materials.edge);
    rib.userData.detailMaterial = materials.edge;
    rib.scale.z = width;
    rib.position.set(x - centerX, 0.012, centerZ - mesh.position.z);
    rib.castShadow = false;
    mesh.add(rib);
  }
}

function chooseMaterial(primitive) {
  if (primitive.kind === 'wood' && style !== 'technical') return materials.wood;
  if (style === 'technical') return materials.tubeTechnical;
  if (primitive.kind === 'imported' || primitive.kind === 'envelope') return materials.imported;
  if (primitive.kind === 'head') return materials.head;
  if (primitive.kind === 'rail') return materials.rail;
  if (primitive.kind === 'rosette') return materials.rosette;
  if (primitive.kind === 'grating') return materials.edge;
  if (primitive.kind === 'brace') return materials.brace;
  return materials.tube;
}

function setMeshState(mesh, primitive) {
  const item = model.items[primitive.index];
  const visibleByCategory = !category || item.category === category;
  mesh.visible = visibleByCategory;
  if (!visibleByCategory) return;
  setObjectMaterial(mesh, primitive.index === selected ? materials.selected : chooseMaterial(primitive));
  mesh.userData.baseOpacity = selected < 0 || primitive.index === selected ? 1 : 0.2;
  if (primitive.index !== selected) {
    setObjectOpacity(mesh, mesh.userData.baseOpacity);
  }
  const source = primitive.type === 'face' ? primitive.pts[0] : primitive.source ?? primitive.a;
  const direction = new THREE.Vector3(
    source[0] - model.center[0],
    0,
    source[2] - model.center[2]
  );
  if (direction.length() > 0.001) direction.normalize().multiplyScalar(explode);
  mesh.position.add(direction);
}

function setObjectMaterial(object, material) {
  const isSelected = material === materials.selected;
  object.traverse((child) => {
    if (child.isMesh) child.material = isSelected ? material : (child.userData.detailMaterial ?? material);
  });
}

function setObjectOpacity(object, opacity) {
  object.traverse((child) => {
    if (!child.isMesh) return;
    child.material = child.material.clone();
    child.material.transparent = true;
    child.material.opacity = opacity;
  });
}

function resetRoot() {
  root.clear();
  dimensionLayer.clear();
  ghostLayer.clear();
  pieceMeshes.clear();
}

function buildScene() {
  resetRoot();
  if (!model) return;
  model.primitives.forEach((primitive) => {
    const mesh = primitive.type === 'face'
      ? faceMesh(primitive.pts, primitive)
      : lineMesh(primitive.a, primitive.b, primitive.r, primitive);
    if (!mesh) return;
    mesh.userData.index = primitive.index;
    mesh.userData.primitive = primitive;
    root.add(mesh);
    if (!pieceMeshes.has(primitive.index)) pieceMeshes.set(primitive.index, []);
    pieceMeshes.get(primitive.index).push(mesh);
  });
  addPieceSpecificGeometry();
  buildDimensions();
  applyVisualState();
  frameModel();
}

function applyVisualState() {
  if (!model) return;
  root.children.forEach((mesh) => {
    const primitive = mesh.userData.primitive;
    const original = primitive.type === 'detail'
      ? { meshPosition: primitive.position, meshQuaternion: primitive.quaternion }
      : primitive.type === 'face'
      ? centroid(primitive.pts)
      : midpoint(primitive.a, primitive.b);
    mesh.position.copy(original.meshPosition);
    mesh.quaternion.copy(original.meshQuaternion ?? new THREE.Quaternion());
    setMeshState(mesh, primitive);
  });
  document.body.classList.toggle('technical', style === 'technical');
  scene.background.set(style === 'technical' ? 0xf5f5f2 : 0x10100f);
  scene.fog.color.copy(scene.background);
  floor.visible = style !== 'technical';
  grid.material.opacity = style === 'technical' ? 0.13 : 0.16;
  requestRender();
}

function addPieceSpecificGeometry() {
  for (const item of model.items) {
    if (!item.rendered || item.representation) continue;
    const p = item.raw;
    if (item.category === 'plataforma') addPlatformDetails(item);
    if (item.category === 'vigaPuente' || item.category === 'horizontalU') addUProfile(item);
    if (item.category === 'vigaIPN') addIProfile(item);
    if (item.category === 'celosia' || item.category === 'truss') addSpatialTruss(item);
  }
}

function addPlatformDetails(item) {
  const p = item.raw;
  const length = Number(p.largo);
  const width = Number(p.anchoPlat);
  if (!Number.isFinite(length) || !Number.isFinite(width)) return;
  const height = 0.075;
  const railSize = 0.035;
  addOrientedBox(item, length, railSize, railSize, { y: height + 0.012, cross: -width / 2 + railSize / 2, material: materials.edge });
  addOrientedBox(item, length, railSize, railSize, { y: height + 0.012, cross: width / 2 - railSize / 2, material: materials.edge });
  for (let cross = -width / 2 + 0.11; cross < width / 2 - 0.06; cross += 0.11) {
    addOrientedBox(item, length, 0.012, 0.01, { y: height + 0.026, cross, material: materials.platformTop });
  }
}

function addUProfile(item) {
  const p = item.raw;
  const length = Number(p.largo);
  if (!Number.isFinite(length)) return;
  const height = item.category === 'vigaPuente' ? 0.18 : 0.12;
  const width = item.category === 'vigaPuente' ? 0.16 : 0.11;
  const wall = 0.026;
  addOrientedBox(item, length, wall, width, { y: height, material: materials.profile });
  addOrientedBox(item, length, height, wall, { y: height / 2, cross: -width / 2 + wall / 2, material: materials.profile });
  addOrientedBox(item, length, height, wall, { y: height / 2, cross: width / 2 - wall / 2, material: materials.profile });
  addProfileEnd(item, 0, height, width);
  addProfileEnd(item, length, height, width);
}

function addIProfile(item) {
  const p = item.raw;
  const length = Number(p.largo);
  if (!Number.isFinite(length)) return;
  const height = 0.22;
  const flange = 0.16;
  const wall = 0.028;
  addOrientedBox(item, length, wall, flange, { y: 0.02, material: materials.profile });
  addOrientedBox(item, length, wall, flange, { y: height, material: materials.profile });
  addOrientedBox(item, length, height, wall, { y: height / 2, material: materials.profile });
  addProfileEnd(item, 0, height, flange);
  addProfileEnd(item, length, height, flange);
}

function addSpatialTruss(item) {
  const p = item.raw;
  const length = Number(p.largo);
  if (!Number.isFinite(length)) return;
  const height = Number.isFinite(Number(p.alto)) ? Number(p.alto) : 0.5;
  const depth = 0.34;
  const radius = 0.018;
  for (const cross of [-depth / 2, depth / 2]) {
    addDetailTube(item, pointOnPiece(p, 0, 0, cross), pointOnPiece(p, length, 0, cross), radius, materials.trussChord);
    addDetailTube(item, pointOnPiece(p, 0, height, cross), pointOnPiece(p, length, height, cross), radius, materials.trussChord);
  }
  const panels = Math.max(3, Math.round(length / 0.52));
  for (let index = 0; index <= panels; index++) {
    const u = index * length / panels;
    addDetailTube(item, pointOnPiece(p, u, 0, -depth / 2), pointOnPiece(p, u, height, depth / 2), 0.011, materials.brace);
    addDetailTube(item, pointOnPiece(p, u, height, -depth / 2), pointOnPiece(p, u, 0, depth / 2), 0.011, materials.brace);
  }
  for (let index = 0; index < panels; index++) {
    const a = index * length / panels;
    const b = (index + 1) * length / panels;
    addDetailTube(item, pointOnPiece(p, a, index % 2 ? height : 0, -depth / 2), pointOnPiece(p, b, index % 2 ? 0 : height, -depth / 2), 0.011, materials.brace);
    addDetailTube(item, pointOnPiece(p, a, index % 2 ? 0 : height, depth / 2), pointOnPiece(p, b, index % 2 ? height : 0, depth / 2), 0.011, materials.brace);
  }
}

function addProfileEnd(item, u, height, width) {
  addOrientedBox(item, 0.045, height, width, { u: u - 0.0225, y: height / 2, material: materials.head });
}

function addOrientedBox(item, length, height, width, options = {}) {
  const p = item.raw;
  const u = Number(options.u ?? 0);
  const y = Number(options.y ?? 0);
  const cross = Number(options.cross ?? 0);
  const material = options.material ?? materials.profile;
  const geometry = p.orientacion === 'z'
    ? new THREE.BoxGeometry(width, height, length)
    : new THREE.BoxGeometry(length, height, width);
  const mesh = new THREE.Mesh(geometry, material);
  const center = pointOnPiece(p, u + length / 2, y, cross);
  mesh.position.set(center[0], center[1], center[2]);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  addDetailObject(item, mesh, pointOnPiece(p, u, 0, cross), material);
}

function addDetailTube(item, a, b, radius, material) {
  const start = new THREE.Vector3(...a);
  const end = new THREE.Vector3(...b);
  const dir = end.clone().sub(start);
  const length = dir.length();
  if (!length) return;
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, length, 14, 1), material);
  mesh.position.copy(start.clone().add(end).multiplyScalar(0.5));
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  addDetailObject(item, mesh, a, material);
}

function addDetailObject(item, object, source, material) {
  object.userData.detailMaterial = material;
  object.userData.index = item.index;
  object.userData.primitive = {
    type: 'detail',
    index: item.index,
    source,
    position: object.position.clone(),
    quaternion: object.quaternion.clone(),
  };
  root.add(object);
  if (!pieceMeshes.has(item.index)) pieceMeshes.set(item.index, []);
  pieceMeshes.get(item.index).push(object);
}

function pointOnPiece(piece, u = 0, y = 0, cross = 0) {
  const x = Number(piece.x) || 0;
  const baseY = Number(piece.y) || 0;
  const z = Number(piece.z) || 0;
  return piece.orientacion === 'z'
    ? [x + cross, baseY + y, z + u]
    : [x + u, baseY + y, z + cross];
}

function midpoint(a, b) {
  const start = new THREE.Vector3(a[0], a[1], a[2]);
  const end = new THREE.Vector3(b[0], b[1], b[2]);
  const mid = start.clone().add(end).multiplyScalar(0.5);
  const dir = end.clone().sub(start);
  const quat = new THREE.Quaternion();
  if (dir.length()) quat.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
  return { meshPosition: mid, meshQuaternion: quat };
}

function centroid(points) {
  const point = points.reduce((sum, value) => sum.add(new THREE.Vector3(value[0], value[1], value[2])), new THREE.Vector3()).multiplyScalar(1 / points.length);
  return { meshPosition: point };
}

function buildDimensions() {
  const [minX, minY, minZ] = model.min;
  const [maxX, maxY, maxZ] = model.max;
  floor.position.y = minY - 0.02;
  grid.position.y = minY - 0.015;
  const y = minY + 0.02;
  const linePoints = [
    [minX, y, minZ],
    [maxX, y, minZ],
    [maxX, y, maxZ],
    [minX, y, maxZ],
    [minX, y, minZ],
  ].map((p) => new THREE.Vector3(...p));
  const geometry = new THREE.BufferGeometry().setFromPoints(linePoints);
  dimensionLayer.add(new THREE.Line(geometry, materials.dimension));

  const box = new THREE.Box3(
    new THREE.Vector3(minX, minY, minZ),
    new THREE.Vector3(maxX, maxY, maxZ)
  );
  const helper = new THREE.Box3Helper(box, 0xe30613);
  helper.material.transparent = true;
  helper.material.opacity = 0.22;
  dimensionLayer.add(helper);
}

function frameModel(mode = 'iso') {
  if (!model) return;
  const pose = poseForMode(mode);
  setCameraPose(pose);
  requestRender();
}

function poseForMode(mode = 'iso') {
  const size = new THREE.Vector3(
    model.max[0] - model.min[0],
    model.max[1] - model.min[1],
    model.max[2] - model.min[2]
  );
  const center = new THREE.Vector3(...model.center);
  const span = Math.max(size.x, size.y, size.z, 1);
  const positions = {
    iso: [center.x + span * 0.85, center.y + span * 0.55, center.z + span * 1.05],
    front: [center.x, center.y + size.y * 0.34, center.z + span * 1.35],
    top: [center.x, center.y + span * 1.45, center.z + 0.001],
    side: [center.x + span * 1.35, center.y + size.y * 0.34, center.z],
  };
  const [x, y, z] = positions[mode] ?? positions.iso;
  return { position: [x, y, z], target: [center.x, center.y, center.z], mode };
}

function setCameraPose(pose) {
  const [x, y, z] = pose.position;
  const [tx, ty, tz] = pose.target;
  const span = model
    ? Math.max(model.max[0] - model.min[0], model.max[1] - model.min[1], model.max[2] - model.min[2], 1)
    : 20;
  camera.position.set(x, y, z);
  camera.near = Math.max(span / 500, 0.01);
  camera.far = span * 12;
  camera.updateProjectionMatrix();
  controls.target.set(tx, ty, tz);
  controls.update();
}

function requestRender() {
  if (!raf) raf = requestAnimationFrame(render);
}

function render() {
  raf = 0;
  updateCameraTween();
  controls.update();
  renderer.render(scene, camera);
  if (controls.enableDamping) requestRender();
}

function updateCameraTween() {
  if (!cameraTween) return;
  const elapsed = performance.now() - cameraTween.startedAt;
  const t = Math.min(elapsed / cameraTween.duration, 1);
  const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  camera.position.lerpVectors(cameraTween.fromPosition, cameraTween.toPosition, eased);
  controls.target.lerpVectors(cameraTween.fromTarget, cameraTween.toTarget, eased);
  if (t >= 1) cameraTween = null;
}

function animateCameraTo(view, duration = 900, interruptTour = true) {
  if (interruptTour) stopTour(false);
  activePresentationView = view.name;
  cameraTween = {
    fromPosition: camera.position.clone(),
    fromTarget: controls.target.clone(),
    toPosition: new THREE.Vector3(...view.position),
    toTarget: new THREE.Vector3(...view.target),
    startedAt: performance.now(),
    duration,
  };
  if (view.style) {
    style = view.style;
    document.querySelectorAll('[data-style]').forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.style === style)));
  }
  if (typeof view.explode === 'number') {
    explode = view.explode;
    $('#explode').value = String(explode);
  }
  category = view.category ?? '';
  $('#category').value = category;
  selected = view.selected ?? -1;
  $('#selection').hidden = selected < 0;
  rebuildList();
  applyVisualState();
  renderPresentationViews();
  setPresentationStatus(`Vista activa: ${view.name}`);
}

function setupPresentationViews() {
  if (!model) return;
  presentationViews = [...defaultPresentationViews(), ...loadCustomViews()];
  activePresentationView = 'General';
  renderPresentationViews();
  setPresentationStatus(`${presentationViews.length} vistas listas para presentar.`);
}

function defaultPresentationViews() {
  return [
    { name: 'General', ...poseForMode('iso'), style: 'premium', explode: 0 },
    { name: 'Frente técnico', ...poseForMode('front'), style: 'technical', explode: 0 },
    { name: 'Planta comercial', ...poseForMode('top'), style: 'premium', explode: 0.45 },
    { name: 'Lateral', ...poseForMode('side'), style: 'technical', explode: 0 },
  ];
}

function viewFromCamera(name) {
  return {
    name,
    position: camera.position.toArray(),
    target: controls.target.toArray(),
    style,
    explode,
    category,
    selected,
    custom: true,
  };
}

function storageKey() {
  return `masalto-layout:presentacion:${model?.name ?? 'sin-diseno'}`;
}

function loadCustomViews() {
  try {
    const raw = localStorage.getItem(storageKey());
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list.filter(isSavedView) : [];
  } catch {
    return [];
  }
}

function saveCustomViews(views) {
  try {
    localStorage.setItem(storageKey(), JSON.stringify(views.filter((view) => view.custom)));
  } catch {
    setPresentationStatus('No se pudo guardar la vista en este navegador.');
  }
}

function isSavedView(view) {
  return view
    && typeof view.name === 'string'
    && Array.isArray(view.position)
    && view.position.length === 3
    && Array.isArray(view.target)
    && view.target.length === 3;
}

function renderPresentationViews() {
  const host = $('#saved-views');
  if (!host) return;
  host.replaceChildren(...presentationViews.map((view) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.setAttribute('aria-pressed', String(view.name === activePresentationView));
    const name = document.createElement('span');
    const type = document.createElement('span');
    name.textContent = view.name;
    type.textContent = view.custom ? 'Guardada' : 'Base';
    button.append(name, type);
    button.onclick = () => animateCameraTo(view);
    return button;
  }));
}

function setPresentationStatus(text) {
  const status = $('#presentation-status');
  if (status) status.textContent = text;
}

function toggleTour() {
  if (!model || !presentationViews.length) return;
  if (tour.running) {
    stopTour();
    return;
  }
  tour.running = true;
  tour.index = 0;
  $('#tour').textContent = 'Pausar';
  setPresentationStatus('Recorrido automático activo.');
  runTourStep();
}

function runTourStep() {
  if (!tour.running || !presentationViews.length) return;
  const view = presentationViews[tour.index % presentationViews.length];
  tour.index += 1;
  animateCameraTo(view, 1100, false);
  tour.timer = window.setTimeout(runTourStep, 3300);
}

function stopTour(updateStatus = true) {
  if (tour.timer) window.clearTimeout(tour.timer);
  tour.running = false;
  tour.timer = 0;
  const button = $('#tour');
  if (button) button.textContent = 'Recorrido';
  if (updateStatus) setPresentationStatus('Recorrido detenido.');
}

function saveCurrentView() {
  if (!model) return;
  const customCount = presentationViews.filter((view) => view.custom).length + 1;
  const view = viewFromCamera(`Vista ${customCount}`);
  presentationViews.push(view);
  activePresentationView = view.name;
  saveCustomViews(presentationViews);
  renderPresentationViews();
  setPresentationStatus(`Vista guardada: ${view.name}`);
}

function resetPresentationViews() {
  if (!model) return;
  try {
    localStorage.removeItem(storageKey());
  } catch {
    setPresentationStatus('No se pudo borrar el guardado local.');
  }
  setupPresentationViews();
}

function capturePng() {
  if (!model) return;
  renderer.render(scene, camera);
  const slug = model.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'masalto-layout';
  const filename = `${slug}-visualizador-masalto-layout.png`;
  const saveUrl = (url) => {
    const link = document.createElement('a');
    link.download = filename;
    link.href = url;
    link.click();
    setPresentationStatus('Captura PNG generada desde la vista actual.');
  };
  if (typeof renderer.domElement.toBlob === 'function') {
    renderer.domElement.toBlob((blob) => {
      if (!blob) {
        setPresentationStatus('La captura no está disponible en este navegador.');
        return;
      }
      const url = URL.createObjectURL(blob);
      saveUrl(url);
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    }, 'image/png');
    return;
  }
  if (typeof renderer.domElement.toDataURL === 'function') {
    saveUrl(renderer.domElement.toDataURL('image/png'));
    return;
  }
  setPresentationStatus('La captura no está disponible en este navegador.');
}

async function togglePresentationMode() {
  const entering = !document.body.classList.contains('presenting');
  document.body.classList.toggle('presenting', entering);
  $('#present').textContent = entering ? 'Salir' : 'Pantalla';
  try {
    if (entering && document.fullscreenElement !== $('#drop') && $('#drop').requestFullscreen) {
      await $('#drop').requestFullscreen();
    } else if (!entering && document.fullscreenElement) {
      await document.exitFullscreen();
    }
  } catch {
    setPresentationStatus(entering ? 'Modo presentación activo.' : 'Modo presentación cerrado.');
  }
  window.setTimeout(resize, 80);
}

document.addEventListener('fullscreenchange', () => {
  if (!document.fullscreenElement && document.body.classList.contains('presenting')) {
    document.body.classList.remove('presenting');
    $('#present').textContent = 'Pantalla';
    window.setTimeout(resize, 80);
  }
});

function resize() {
  const { clientWidth, clientHeight } = sceneHost;
  renderer.setSize(clientWidth, clientHeight);
  camera.aspect = clientWidth / Math.max(clientHeight, 1);
  camera.updateProjectionMatrix();
  requestRender();
}

new ResizeObserver(resize).observe(sceneHost);
controls.addEventListener('change', requestRender);

function fail(error) {
  $('#error').textContent = error.message || String(error);
  $('#error').hidden = false;
}

function load(text, source) {
  const next = parseDesign(text);
  model = next;
  selected = -1;
  category = '';
  explode = 0;
  $('#explode').value = '0';
  $('#error').hidden = true;
  $('#empty').hidden = !!model.primitives.length;
  $('#name').textContent = model.name;
  $('#source').textContent = source;
  $('#count').textContent = `${model.items.filter((item) => item.rendered).length} / ${model.items.length} representadas`;
  const simplified = model.items.filter(item => item.representation).length;
  $('#coverage').textContent = simplified ? `${simplified} piezas especiales en esquema: contorno guardado o envolvente dimensional, sin detalle de fabricación.` : '';
  $('#summary').textContent = model.weight === null ? 'Peso incompleto en el archivo' : `${fmt(model.weight)} kg declarados en el archivo`;
  $('#dimensions').textContent = model.primitives.length
    ? `${model.max.map((value, index) => fmt(value - model.min[index])).join(' x ')} m (X · Y · Z)`
    : 'Sin geometría representable';
  $('#category').replaceChildren(
    new Option('Todas', ''),
    ...[...new Set(model.items.map((item) => item.category))].sort().map((itemCategory) => new Option(itemCategory, itemCategory))
  );
  $('#issues').replaceChildren(...model.issues.map((issue) => {
    const li = document.createElement('li');
    li.textContent = issue;
    return li;
  }));
  $('#warning-count').textContent = model.issues.length ? `${model.issues.length} observaciones de representación` : 'Alcance de esta prueba';
  $('#warnings').open = !!model.issues.length;
  $('#selection').hidden = true;
  rebuildList();
  buildScene();
  setupPresentationViews();
}

function rebuildList() {
  if (!model) return;
  const groups = new Map();
  for (const item of model.items) {
    if (category && item.category !== category) continue;
    const key = `${item.category}|${item.ref}|${item.name}`;
    if (!groups.has(key)) groups.set(key, { item, count: 0 });
    groups.get(key).count++;
  }
  $('#list').replaceChildren(...[...groups.values()].map(({ item, count }) => {
    const button = document.createElement('button');
    button.className = item.rendered ? '' : 'unsupported';
    button.setAttribute('aria-pressed', String(selected === item.index));
    const name = document.createElement('span');
    const quantity = document.createElement('span');
    name.textContent = item.name + (item.representation ? ' (esquema)' : item.rendered ? '' : ' (sin vista)');
    quantity.textContent = count;
    button.append(name, quantity);
    button.onclick = () => select(item.index);
    return button;
  }));
}

function select(index) {
  selected = index;
  $('#selection').hidden = index < 0;
  if (index >= 0) {
    const item = model.items[index];
    $('#detail').textContent = `${item.name} · Ref. ${item.ref}. ${item.rendered ? 'Seleccionada en rojo.' : 'Esta pieza no está representada.'} Selección individual.`;
  }
  rebuildList();
  applyVisualState();
}

function pick(event) {
  if (!model) return;
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const hit = raycaster.intersectObjects(root.children, false).find((entry) => entry.object.visible);
  select(hit ? hit.object.userData.index : -1);
}

renderer.domElement.addEventListener('dblclick', pick);

$('#clear').onclick = () => select(-1);
$('#category').onchange = (event) => {
  category = event.target.value;
  selected = -1;
  $('#selection').hidden = true;
  applyVisualState();
  rebuildList();
};

async function openFile(file) {
  if (!file) return;
  const token = ++loadToken;
  try {
    if (file.size > 15 * 1024 * 1024) throw Error('El archivo supera 15 MB.');
    const text = await file.text();
    if (token === loadToken) load(text, `Archivo local: ${file.name}`);
  } catch (error) {
    if (token === loadToken) fail(error);
  } finally {
    $('#file').value = '';
  }
}

$('#file').onchange = (event) => openFile(event.target.files[0]);
async function openExample(path) {
  const token = ++loadToken;
  try {
    const response = await fetch(path);
    if (!response.ok) throw Error('No se pudo abrir el ejemplo.');
    const text = await response.text();
    if (token === loadToken) load(text, 'Ejemplo guardado del proyecto · No es una obra validada');
  } catch (error) {
    if (token === loadToken) fail(error);
  }
};

$('#example').onclick = () => openExample('./ejemplo.masalto.json');
$('#special-example').onclick = () => openExample('./ejemplo-especiales.masalto.json');

$('#drop').ondragover = (event) => {
  event.preventDefault();
  $('#drop').classList.add('over');
};
$('#drop').ondragleave = () => $('#drop').classList.remove('over');
$('#drop').ondrop = (event) => {
  event.preventDefault();
  $('#drop').classList.remove('over');
  openFile(event.dataTransfer.files[0]);
};

for (const button of document.querySelectorAll('[data-view]')) {
  button.onclick = () => {
    stopTour(false);
    document.querySelectorAll('[data-view]').forEach((viewButton) => viewButton.setAttribute('aria-pressed', String(viewButton === button)));
    frameModel(button.dataset.view);
  };
}

for (const button of document.querySelectorAll('[data-style]')) {
  button.onclick = () => {
    stopTour(false);
    style = button.dataset.style;
    document.querySelectorAll('[data-style]').forEach((styleButton) => styleButton.setAttribute('aria-pressed', String(styleButton === button)));
    applyVisualState();
  };
}

$('#fit').onclick = () => {
  stopTour(false);
  const pressed = [...document.querySelectorAll('[data-view]')].find((button) => button.getAttribute('aria-pressed') === 'true');
  frameModel(pressed?.dataset.view ?? 'iso');
};
$('#explode').oninput = (event) => {
  stopTour(false);
  explode = Number(event.target.value);
  applyVisualState();
};
$('#focus').onclick = () => {
  stopTour(false);
  if (!model || selected < 0 || !pieceMeshes.has(selected)) return;
  const box = new THREE.Box3();
  pieceMeshes.get(selected).forEach((mesh) => box.expandByObject(mesh));
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const span = Math.max(size.x, size.y, size.z, 0.8);
  controls.target.copy(center);
  camera.position.copy(center.clone().add(new THREE.Vector3(span * 1.8, span * 1.1, span * 1.8)));
  controls.update();
  requestRender();
};
$('#tour').onclick = toggleTour;
$('#capture').onclick = capturePng;
$('#present').onclick = togglePresentationMode;
$('#save-view').onclick = saveCurrentView;
$('#reset-views').onclick = resetPresentationViews;

window.addEventListener('keydown', (event) => {
  if (event.key === 'Home') {
    event.preventDefault();
    $('#fit').click();
  }
});

resize();
const transferId = new URLSearchParams(location.hash.slice(1)).get('proyecto');
if (transferId) {
  try {
    const text = sessionStorage.getItem(`masalto:visor:${transferId}`);
    if (!text) throw Error('No se encontró el diseño. Volvé a Layout y pulsá Ver en 3D, o abrí el archivo guardado.');
    load(text, 'Desde Layout · Vista del momento de apertura. Para actualizarla, volvé a pulsar Ver en 3D.');
    const back = document.createElement('button');
    back.textContent = 'Volver a Layout';
    back.onclick = () => { window.close(); };
    back.title = 'Cerrar esta vista y continuar en la pestaña del editor';
    document.querySelector('header').append(back);
  } catch (error) { fail(error); }
} else {
  if (new URLSearchParams(location.search).get('ejemplo') === 'especiales') $('#special-example').click();
  else $('#example').click();
}
