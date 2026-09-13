import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

/* =========================================================
   Hero: a small drivable world. A low-poly car on an island,
   five floating markers ringing the edge — one per section.
   Drive up to a marker and press E (or tap Open) to jump there.
   Everything here is primitive geometry — no external models.
========================================================= */
(function heroScene(){
  const canvas = document.getElementById('hero-canvas');
  const labelHost = document.getElementById('hero-labels');
  const heroCopy = document.getElementById('hero-copy');
  const skipBtn = document.getElementById('skip-drive');
  const zonePrompt = document.getElementById('zone-prompt');
  const zonePromptLabel = document.getElementById('zone-prompt-label');
  const zonePromptBtn = document.getElementById('zone-prompt-btn');
  const touchControls = document.getElementById('touch-controls');
  if(!canvas) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
  if(isCoarsePointer && touchControls) touchControls.hidden = false;

  const MARKERS = [
    { id: 'about',   label: 'About',    color: 0xe8ecef },
    { id: 'stack',   label: 'Stack',    color: 0x4fd1c5 },
    { id: 'work',    label: 'Work',     color: 0xff7a33 },
    { id: 'build',   label: 'AECHO',    color: 0x4fd1c5 },
    { id: 'contact', label: 'Contact',  color: 0xff7a33 },
  ];
  const WORLD_RADIUS = 40;
  const MARKER_RADIUS = 24;
  const PROXIMITY = 6.5;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x0d1117, 30, 70);

  const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 200);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  // Lighting: one soft key light, one cool fill
  scene.add(new THREE.HemisphereLight(0x2a3542, 0x0d1117, 1.1));
  const key = new THREE.DirectionalLight(0xffffff, 0.6);
  key.position.set(12, 18, 8);
  scene.add(key);

  // Ground island
  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(WORLD_RADIUS + 3, 48),
    new THREE.MeshStandardMaterial({ color: 0x121820, roughness: 1 })
  );
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);

  const grid = new THREE.GridHelper(WORLD_RADIUS * 2, 40, 0x2a3542, 0x1a222c);
  grid.position.y = 0.01;
  scene.add(grid);

  // Car: primitive shapes only
  const car = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0xff7a33, roughness: 0.4, metalness: 0.1 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.5, 2.6), bodyMat);
  body.position.y = 0.55;
  car.add(body);
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.5, 1.3), new THREE.MeshStandardMaterial({ color: 0xe8ecef, roughness: 0.5 }));
  cabin.position.set(0, 1.02, -0.1);
  car.add(cabin);
  const wheelGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.3, 14);
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x0d1117, roughness: 0.9 });
  const wheelPositions = [[-0.85, 0.32, 0.9], [0.85, 0.32, 0.9], [-0.85, 0.32, -0.9], [0.85, 0.32, -0.9]];
  wheelPositions.forEach(([x, y, z]) => {
    const wheel = new THREE.Mesh(wheelGeo, wheelMat);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(x, y, z);
    car.add(wheel);
  });
  car.position.set(0, 0, 14);
  scene.add(car);

  // Markers: one floating shape per section, arranged in a ring
  const markerMeshes = MARKERS.map((m, i) => {
    const angle = (i / MARKERS.length) * Math.PI * 2;
    const x = Math.sin(angle) * MARKER_RADIUS;
    const z = Math.cos(angle) * MARKER_RADIUS;
    const geo = new THREE.IcosahedronGeometry(1.1, 0);
    const mat = new THREE.MeshStandardMaterial({ color: m.color, wireframe: true });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, 2.2, z);
    mesh.userData.phase = Math.random() * Math.PI * 2;
    mesh.userData.baseY = 2.2;
    scene.add(mesh);

    const div = document.createElement('div');
    div.className = 'hero-label';
    div.textContent = m.label;
    labelHost.appendChild(div);

    return { def: m, mesh, div, x, z };
  });

  // Controls: keyboard + touch share the same key state
  const keys = { up: false, down: false, left: false, right: false };
  const KEY_MAP = {
    ArrowUp: 'up', KeyW: 'up',
    ArrowDown: 'down', KeyS: 'down',
    ArrowLeft: 'left', KeyA: 'left',
    ArrowRight: 'right', KeyD: 'right',
  };
  let hasMoved = false;
  function markMoved(){
    if(hasMoved) return;
    hasMoved = true;
    heroCopy?.classList.add('faded');
  }

  window.addEventListener('keydown', (e) => {
    if(KEY_MAP[e.code]){ keys[KEY_MAP[e.code]] = true; markMoved(); }
    if(e.code === 'KeyE' && currentZone) scrollToSection(currentZone);
  });
  window.addEventListener('keyup', (e) => {
    if(KEY_MAP[e.code]) keys[KEY_MAP[e.code]] = false;
  });

  if(touchControls){
    touchControls.querySelectorAll('button[data-key]').forEach((btn) => {
      const k = btn.dataset.key;
      const on = (e) => { e.preventDefault(); keys[k] = true; markMoved(); };
      const off = (e) => { e.preventDefault(); keys[k] = false; };
      btn.addEventListener('pointerdown', on);
      btn.addEventListener('pointerup', off);
      btn.addEventListener('pointerleave', off);
      btn.addEventListener('pointercancel', off);
    });
  }

  function scrollToSection(id){
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  }
  skipBtn?.addEventListener('click', () => scrollToSection('about'));
  zonePromptBtn?.addEventListener('click', () => { if(currentZone) scrollToSection(currentZone); });

  // Car physics — simple, framerate-independent kinematic model
  let speed = 0;
  let heading = Math.PI; // face toward the ring, away from the camera start
  const MAX_SPEED = 13;
  const ACCEL = 20;
  const BRAKE = 32;
  const FRICTION = 11;
  const TURN_SPEED = 2.3;
  let currentZone = null;

  const cameraTarget = new THREE.Vector3();
  const desiredCamPos = new THREE.Vector3();

  const clock = new THREE.Clock();

  function updateCar(dt){
    const forwardInput = (keys.up ? 1 : 0) - (keys.down ? 1 : 0);
    const turnInput = (keys.left ? 1 : 0) - (keys.right ? 1 : 0);

    if(forwardInput !== 0){
      speed += forwardInput * ACCEL * dt;
    } else if(speed !== 0){
      const drop = FRICTION * dt;
      speed = Math.abs(speed) <= drop ? 0 : speed - Math.sign(speed) * drop;
    }
    speed = Math.max(Math.min(speed, MAX_SPEED), -MAX_SPEED * 0.45);

    if(turnInput !== 0 && speed !== 0){
      const turnAmount = turnInput * TURN_SPEED * dt * Math.min(Math.abs(speed) / (MAX_SPEED * 0.4), 1) * Math.sign(speed);
      heading += turnAmount;
    }
    car.rotation.y = heading;

    const forward = new THREE.Vector3(Math.sin(heading), 0, Math.cos(heading));
    car.position.addScaledVector(forward, speed * dt);

    const distFromCenter = Math.hypot(car.position.x, car.position.z);
    if(distFromCenter > WORLD_RADIUS){
      const scale = WORLD_RADIUS / distFromCenter;
      car.position.x *= scale;
      car.position.z *= scale;
      speed *= 0.6;
    }

    // wheel spin for a sense of motion
    car.children.forEach((child) => {
      if(child.geometry?.type === 'CylinderGeometry') child.rotation.x -= speed * dt * 1.4;
    });
  }

  function updateCamera(dt){
    const forward = new THREE.Vector3(Math.sin(heading), 0, Math.cos(heading));
    desiredCamPos.copy(car.position)
      .addScaledVector(forward, -9)
      .add(new THREE.Vector3(0, 4.6, 0));
    const t = 1 - Math.pow(0.001, dt);
    camera.position.lerp(desiredCamPos, t);
    cameraTarget.copy(car.position).add(new THREE.Vector3(0, 1.1, 0));
    camera.lookAt(cameraTarget);
  }

  function updateMarkersAndLabels(time){
    let nearestId = null;
    let nearestDist = Infinity;

    markerMeshes.forEach(({ def, mesh, div }) => {
      mesh.position.y = mesh.userData.baseY + Math.sin(time * 0.0012 + mesh.userData.phase) * 0.4;
      mesh.rotation.y += 0.006;

      const ndc = mesh.position.clone().project(camera);
      const behind = ndc.z > 1;
      div.style.left = `${(ndc.x * 0.5 + 0.5) * window.innerWidth}px`;
      div.style.top = `${(-ndc.y * 0.5 + 0.5) * window.innerHeight}px`;
      div.style.opacity = behind ? '0' : '1';

      const dist = Math.hypot(car.position.x - mesh.position.x, car.position.z - mesh.position.z);
      if(dist < PROXIMITY && dist < nearestDist){
        nearestDist = dist;
        nearestId = def.id;
      }
    });

    if(nearestId !== currentZone){
      currentZone = nearestId;
      if(currentZone && zonePrompt && zonePromptLabel){
        const def = MARKERS.find((m) => m.id === currentZone);
        zonePromptLabel.textContent = def.label;
        zonePrompt.hidden = false;
      } else if(zonePrompt){
        zonePrompt.hidden = true;
      }
    }
  }

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  camera.position.set(0, 4.6, 23);
  camera.lookAt(0, 1, 14);

  function animate(){
    requestAnimationFrame(animate);
    const dt = Math.min(clock.getDelta(), 0.05);
    updateCar(dt);
    updateCamera(dt);
    updateMarkersAndLabels(performance.now());
    renderer.render(scene, camera);
  }

  if(reduceMotion){
    updateMarkersAndLabels(0);
    renderer.render(scene, camera);
  } else {
    animate();
  }
})();

/* =========================================================
   Small dependency-graph sketch next to the AECHO write-up —
   same visual language as the hero, at rest.
========================================================= */
(function buildGraph(){
  const host = document.getElementById('build-graph');
  if(!host) return;

  const canvas = document.createElement('canvas');
  host.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let w, h, dpr;
  function size(){
    dpr = Math.min(window.devicePixelRatio, 2);
    w = host.clientWidth; h = host.clientHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  size();
  window.addEventListener('resize', size);

  const points = Array.from({ length: 9 }, () => ({
    x: Math.random(), y: Math.random(),
    phase: Math.random() * Math.PI * 2,
  }));
  const edges = [[0,1],[0,2],[1,3],[2,3],[3,4],[4,5],[3,6],[6,7],[7,8],[5,8]];

  function draw(t){
    ctx.clearRect(0, 0, w, h);
    const pos = points.map(p => ({
      x: p.x * w,
      y: p.y * h + Math.sin(t * 0.0006 + p.phase) * 4,
    }));

    ctx.strokeStyle = 'rgba(79,209,197,0.25)';
    ctx.lineWidth = 1;
    edges.forEach(([a,b]) => {
      ctx.beginPath();
      ctx.moveTo(pos[a].x, pos[a].y);
      ctx.lineTo(pos[b].x, pos[b].y);
      ctx.stroke();
    });

    pos.forEach((p, i) => {
      const pulse = (Math.sin(t * 0.001 + i) + 1) / 2;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2.5 + pulse * 1.5, 0, Math.PI * 2);
      ctx.fillStyle = i % 3 === 0 ? '#FF7A33' : '#4FD1C5';
      ctx.fill();
    });

    if(!reduceMotion) requestAnimationFrame(draw);
  }
  requestAnimationFrame(draw);
})();

/* =========================================================
   Nav: highlight the section currently in view
========================================================= */
(function navHighlight(){
  const links = document.querySelectorAll('.nav-links a');
  if(!links.length) return;
  const sections = Array.from(links)
    .map(a => document.getElementById(a.dataset.section))
    .filter(Boolean);

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const link = document.querySelector(`.nav-links a[data-section="${entry.target.id}"]`);
      if(!link) return;
      if(entry.isIntersecting) link.classList.add('active');
      else link.classList.remove('active');
    });
  }, { rootMargin: '-45% 0px -45% 0px' });

  sections.forEach(s => observer.observe(s));
})();

/* =========================================================
   Footer: live Bangalore time
========================================================= */
(function localClock(){
  const el = document.getElementById('local-time');
  if(!el) return;
  function tick(){
    const now = new Date().toLocaleTimeString('en-IN', {
      timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit',
    });
    el.textContent = `${now} in Bangalore`;
  }
  tick();
  setInterval(tick, 30000);
})();
