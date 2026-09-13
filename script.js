import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

/* =========================================================
   Hero: a small "infrastructure graph" floating in space —
   nodes + edges, the same shape as the dependency graphs
   AECHO reasons about. Drag to look around, auto-drifts on its own.
========================================================= */
(function heroScene(){
  const canvas = document.getElementById('hero-canvas');
  if(!canvas) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 0, 9);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  const group = new THREE.Group();
  scene.add(group);

  const COLORS = [0xff7a33, 0x4fd1c5, 0xe8ecef];

  // Node positions: scattered in a loose sphere
  const NODE_COUNT = 22;
  const nodes = [];
  for(let i = 0; i < NODE_COUNT; i++){
    const phi = Math.acos(-1 + (2 * i) / NODE_COUNT);
    const theta = Math.sqrt(NODE_COUNT * Math.PI) * phi;
    const r = 3.6 + Math.random() * 1.2;
    const pos = new THREE.Vector3(
      r * Math.cos(theta) * Math.sin(phi),
      r * Math.sin(theta) * Math.sin(phi) * 0.7,
      r * Math.cos(phi)
    );
    nodes.push(pos);

    const size = 0.05 + Math.random() * 0.05;
    const color = COLORS[i % COLORS.length];
    const geo = new THREE.IcosahedronGeometry(size, 0);
    const mat = new THREE.MeshBasicMaterial({ color, wireframe: Math.random() > 0.5 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(pos);
    group.add(mesh);
  }

  // Edges: connect each node to its nearest couple of neighbours
  const lineMat = new THREE.LineBasicMaterial({ color: 0x2a3542, transparent: true, opacity: 0.6 });
  nodes.forEach((p, i) => {
    const distances = nodes
      .map((q, j) => ({ j, d: i === j ? Infinity : p.distanceTo(q) }))
      .sort((a, b) => a.d - b.d)
      .slice(0, 2);
    distances.forEach(({ j }) => {
      const geo = new THREE.BufferGeometry().setFromPoints([p, nodes[j]]);
      group.add(new THREE.Line(geo, lineMat));
    });
  });

  // Pointer interaction: drag to rotate, gentle auto-drift otherwise
  let dragging = false;
  let lastX = 0, lastY = 0;
  let velX = 0.0009, velY = 0.0003;
  let targetVelX = velX, targetVelY = velY;
  let parallaxX = 0, parallaxY = 0;

  canvas.addEventListener('pointerdown', (e) => {
    dragging = true;
    lastX = e.clientX; lastY = e.clientY;
  });
  window.addEventListener('pointerup', () => { dragging = false; });
  window.addEventListener('pointermove', (e) => {
    if(dragging){
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      group.rotation.y += dx * 0.004;
      group.rotation.x += dy * 0.004;
      lastX = e.clientX; lastY = e.clientY;
    } else {
      const nx = (e.clientX / window.innerWidth) - 0.5;
      const ny = (e.clientY / window.innerHeight) - 0.5;
      parallaxX = nx * 0.4;
      parallaxY = ny * 0.25;
    }
  });

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  function animate(){
    requestAnimationFrame(animate);
    if(!dragging && !reduceMotion){
      group.rotation.y += targetVelX;
      group.rotation.x += targetVelY * Math.sin(Date.now() * 0.0002);
    }
    camera.position.x += (parallaxX - camera.position.x) * 0.02;
    camera.position.y += (-parallaxY - camera.position.y) * 0.02;
    camera.lookAt(0, 0, 0);
    renderer.render(scene, camera);
  }
  if(reduceMotion){
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
