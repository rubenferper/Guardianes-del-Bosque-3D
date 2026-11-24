import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';

const game = document.querySelector('#game');
const loading = document.querySelector('#loading');
const actionLabel = document.querySelector('#action');
const statusLabel = document.querySelector('#status');
const message = document.querySelector('#message');

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xa9c4d0);
scene.fog = new THREE.Fog(0xaab5ad, 24, 82);

const camera = new THREE.PerspectiveCamera(55, game.clientWidth / game.clientHeight, 0.1, 150);
camera.position.set(0, 4.25, 10.5);

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(game.clientWidth, game.clientHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.18;
renderer.shadowMap.autoUpdate = true;
game.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 1.25, 4);
controls.enableDamping = true;
controls.minDistance = 3.2;
controls.maxDistance = 16;
controls.maxPolarAngle = Math.PI * 0.47;
controls.enablePan = false;

// Iluminación ambiental, sol y luces cálidas decorativas.
scene.add(new THREE.HemisphereLight(0xd9ecff, 0x35432c, 1.9));
const sun = new THREE.DirectionalLight(0xfff0d7, 4.2);
sun.position.set(-8, 14, 7);
sun.castShadow = true;
sun.shadow.mapSize.set(3072, 3072);
sun.shadow.bias = -0.00015;
sun.shadow.normalBias = 0.025;
sun.shadow.radius = 4;
sun.shadow.camera.left = -22; sun.shadow.camera.right = 22;
sun.shadow.camera.top = 22; sun.shadow.camera.bottom = -22;
scene.add(sun);
const campLight = new THREE.PointLight(0xffb45e, 35, 12, 2);
campLight.position.set(4, 2.3, -3);
scene.add(campLight);

// Iluminación ambiental HDRI de bosque (si hay conexión); el cielo procedural queda como respaldo.
new RGBELoader().load('https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/forest_slope_1k.hdr', (hdr) => {
  hdr.mapping = THREE.EquirectangularReflectionMapping;
  scene.environment = hdr;
  scene.background = hdr;                 // Panorama realista visible en 360 grados.
  scene.environmentIntensity = 0.65;
  scene.backgroundIntensity = 0.9;
  scene.backgroundBlurriness = 0.03;
  loading.textContent = 'Cargando iluminación del bosque…';
}, undefined, () => {
  console.info('HDRI no disponible: se utiliza el cielo de respaldo.');
  scene.background = new THREE.Color(0x9bb5c1);
});

// El fondo panorámico HDRI se muestra como cielo 360° cuando termina de cargar.

// Textura procedural del piso (canvas), no utiliza JPG.
function makeGroundTexture() {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 1024;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#526b3e'; ctx.fillRect(0,0,1024,1024);
  for (let i=0;i<42000;i++) {
    const x=Math.random()*1024, y=Math.random()*1024, s=Math.random()*3.2+0.4;
    ctx.fillStyle = Math.random()>.52 ? 'rgba(190,181,117,.22)' : 'rgba(18,43,25,.24)';
    ctx.beginPath(); ctx.ellipse(x,y,s,s*(.35+Math.random()),Math.random(),0,Math.PI*2); ctx.fill();
  }
  // Pequeñas manchas de tierra para romper la repetición visual del césped.
  for(let i=0;i<90;i++){
    const x=Math.random()*1024,y=Math.random()*1024;
    const g=ctx.createRadialGradient(x,y,2,x,y,12+Math.random()*25);
    g.addColorStop(0,'rgba(94,72,43,.24)');g.addColorStop(1,'rgba(94,72,43,0)');
    ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,35,0,Math.PI*2);ctx.fill();
  }
  const tex = new THREE.CanvasTexture(c); tex.wrapS=tex.wrapT=THREE.RepeatWrapping; tex.repeat.set(5,5);
  tex.colorSpace=THREE.SRGBColorSpace; tex.anisotropy=renderer.capabilities.getMaxAnisotropy(); return tex;
}
const ground = new THREE.Mesh(new THREE.PlaneGeometry(44,44,1,1), new THREE.MeshStandardMaterial({map:makeGroundTexture(), color:0xd0d5b2, roughness:0.96}));
ground.rotation.x=-Math.PI/2; ground.receiveShadow=true; scene.add(ground);
const trailMat=new THREE.MeshStandardMaterial({color:0x786044,roughness:1});
const trail=new THREE.Mesh(new THREE.PlaneGeometry(4.2,30),trailMat);trail.rotation.x=-Math.PI/2;trail.position.set(0,.012,2);trail.receiveShadow=true;scene.add(trail);

// Límites visibles del terreno.
const boundaryMat = new THREE.MeshStandardMaterial({color:0x314b35, roughness:.9});
function wall(x,z,w,d) {
  const m=new THREE.Mesh(new THREE.BoxGeometry(w,1.25,d), boundaryMat);
  m.position.set(x,.62,z); m.castShadow=true; m.receiveShadow=true; scene.add(m);
}
const obstacles=[];
wall(0,-21,42,1); wall(0,21,42,1); wall(-21,0,1,42); wall(21,0,1,42);

// Vegetación de bosque: troncos irregulares, ramas, copas en capas y arbustos.
const trunkMat=new THREE.MeshStandardMaterial({color:0x59402b,roughness:1});
const barkMat=new THREE.MeshStandardMaterial({color:0x765438,roughness:1});
const leafMats=[0x244a2c,0x315f36,0x477b43,0x638b4c].map(c=>new THREE.MeshStandardMaterial({color:c,roughness:0.94}));
function tree(x,z,s=1) {
  const g=new THREE.Group(); g.position.set(x,0,z); g.scale.setScalar(s);
  const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.22,.38,3.8,10,5),trunkMat);
  trunk.position.y=1.9; trunk.castShadow=true; g.add(trunk);
  for(let b=0;b<4;b++){
    const branch=new THREE.Mesh(new THREE.CylinderGeometry(.07,.13,1.45,7),barkMat);
    branch.position.set((b%2?1:-1)*.48,2.25+b*.24,0.02);
    branch.rotation.z=(b%2?1:-1)*.72; branch.castShadow=true;g.add(branch);
  }
  for(let i=0;i<10;i++){
    const crown=new THREE.Mesh(new THREE.IcosahedronGeometry(.9+Math.random()*.55,2),leafMats[i%leafMats.length]);
    const a=i/10*Math.PI*2, r=.45+Math.random()*.55;
    crown.position.set(Math.cos(a)*r,3.2+Math.random()*1.8,Math.sin(a)*r);
    crown.scale.set(1,1.15,.95);crown.castShadow=true;g.add(crown);
  }
  scene.add(g);
}
function shrub(x,z,s=1){
  const g=new THREE.Group();g.position.set(x,.15,z);g.scale.setScalar(s);
  for(let i=0;i<7;i++){
    const m=new THREE.Mesh(new THREE.IcosahedronGeometry(.28+Math.random()*.18,1),leafMats[i%leafMats.length]);
    m.position.set((Math.random()-.5)*.8,Math.random()*.45,(Math.random()-.5)*.8);m.castShadow=true;g.add(m);
  }
  scene.add(g);
}
[[-15,-14],[-11,14],[15,14],[15,-14],[-17,2],[17,1],[-8,-18],[9,18],[-19,-8],[19,9],[-13,8],[12,-17],[-18,17],[18,-17]].forEach(([x,z],i)=>tree(x,z,.82+(i%4)*.13));
for(let i=0;i<38;i++){
  const a=Math.random()*Math.PI*2,r=10+Math.random()*9;
  shrub(Math.cos(a)*r,Math.sin(a)*r,.7+Math.random()*.8);
}
// Hierba en pequeños grupos para dar profundidad al primer plano.
const grassMat=new THREE.MeshStandardMaterial({color:0x78934e,side:THREE.DoubleSide,roughness:1});
for(let i=0;i<520;i++){
  const x=(Math.random()-.5)*39,z=(Math.random()-.5)*39;
  const blade=new THREE.Mesh(new THREE.ConeGeometry(.035,.32,4),grassMat);
  blade.position.set(x,.16,z);blade.rotation.z=(Math.random()-.5)*.35;blade.castShadow=false;scene.add(blade);
}

// Personaje humanoide 3D con modelo GLB y clips de animación reales.
const character=new THREE.Group(); scene.add(character); character.position.set(0,0,4);
let mixer=null, animationActions={}, activeAction=null, characterModel=null, danceBones=[], fallbackCreated=false;
const gltfLoader=new GLTFLoader();
function makeFallbackCharacter(){
  if(fallbackCreated)return;
  fallbackCreated=true;
  const mat=new THREE.MeshStandardMaterial({color:0x315d70,roughness:.8});
  const skinFallback=new THREE.MeshStandardMaterial({color:0xb87955,roughness:.85});
  const body=new THREE.Mesh(new THREE.CapsuleGeometry(.34,.72,6,12),mat);body.position.y=1.05;body.castShadow=true;character.add(body);
  const head=new THREE.Mesh(new THREE.SphereGeometry(.25,24,18),skinFallback);head.position.y=1.82;head.castShadow=true;character.add(head);
  const hairFallback=new THREE.Mesh(new THREE.SphereGeometry(.26,20,12,0,Math.PI*2,0,Math.PI*.55),new THREE.MeshStandardMaterial({color:0x211b18}));hairFallback.position.y=1.91;character.add(hairFallback);
  const legMat=new THREE.MeshStandardMaterial({color:0x263448});
  for(const x of [-.16,.16]){const leg=new THREE.Mesh(new THREE.CapsuleGeometry(.13,.62,5,10),legMat);leg.position.set(x,.36,0);leg.castShadow=true;character.add(leg);}
}
function selectClip(names){
  for(const n of names){const key=Object.keys(animationActions).find(k=>k.toLowerCase().includes(n.toLowerCase()));if(key)return animationActions[key];}
  return null;
}
function playCharacterAction(){
  if(!mixer)return;
  let next;
  if(mode==='dance') next=selectClip(['dance','idle','stand']);
  else if(!moving) next=selectClip(['idle','stand']);
  else if(mode==='run') next=selectClip(['run']);
  else next=selectClip(['walk']);
  if(!next) next=Object.values(animationActions)[0];
  if(next && next!==activeAction){
    next.reset().fadeIn(0.25).play();
    if(activeAction) activeAction.fadeOut(0.25);
    activeAction=next;
  }
}
gltfLoader.load('https://threejs.org/examples/models/gltf/Soldier.glb',gltf=>{
  characterModel=gltf.scene;
  characterModel.scale.setScalar(1.0);
  characterModel.position.y=0;
  characterModel.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;if(o.material){o.material.roughness=Math.max(o.material.roughness??.7,.58);}}});
  character.add(characterModel);
  characterModel.traverse(o=>{if(o.isBone && /(arm|spine|shoulder)/i.test(o.name)) danceBones.push({bone:o,base:o.rotation.clone(),phase:Math.random()*Math.PI*2});});
  mixer=new THREE.AnimationMixer(characterModel);
  for(const clip of gltf.animations)animationActions[clip.name]=mixer.clipAction(clip);
  playCharacterAction();
  loading.style.display='none';
},undefined,error=>{
  console.warn('No se pudo cargar el modelo humano; se activa el modelo alternativo.',error);
  makeFallbackCharacter();loading.style.display='none';
});
// Respaldo: si el servidor del modelo tarda demasiado, la escena no se queda bloqueada.
setTimeout(()=>{
  if(!characterModel && !fallbackCreated){
    console.warn('Tiempo de espera del modelo agotado; se usa el personaje alternativo.');
    makeFallbackCharacter();
    loading.style.display='none';
  }
},10000);
const shadowDisc=new THREE.Mesh(new THREE.CircleGeometry(.48,32),new THREE.MeshBasicMaterial({color:0x10180f,transparent:true,opacity:.22}));
shadowDisc.rotation.x=-Math.PI/2;shadowDisc.position.y=.025;character.add(shadowDisc);

// Props con movimiento y colisiones: rocas, troncos y una pelota pateable.
const propMat=new THREE.MeshStandardMaterial({color:0x77796f,roughness:1});
const woodMat=new THREE.MeshStandardMaterial({color:0x79563a,roughness:1});
const ballMat=new THREE.MeshStandardMaterial({color:0xd88c37,roughness:.5});
const props=[];
function addProp(mesh,x,z,r,kind='solid') {
  mesh.position.set(x,mesh.geometry.parameters?.radius ? mesh.geometry.parameters.radius*.8 : .5,z);
  mesh.castShadow=true; mesh.receiveShadow=true; scene.add(mesh);
  const p={mesh,x,z,r,kind,velocity:new THREE.Vector3(),phase:Math.random()*6}; props.push(p);
  obstacles.push({mesh,radius:r,solid:kind==='solid',prop:p});
}
for(const [x,z,r] of [[-5,1,.75],[5,3,.85],[-7,-5,.65],[7,-6,.8],[1,-9,.7]]) {
  const rock=new THREE.Mesh(new THREE.DodecahedronGeometry(r,0),propMat);
  rock.scale.set(1.25,.8,1); addProp(rock,x,z,r,'solid');
}
const log=new THREE.Mesh(new THREE.CylinderGeometry(.38,.38,2.6,12),woodMat);
log.rotation.z=Math.PI/2; addProp(log,-3,-5,1.25,'solid');
const ball=new THREE.Mesh(new THREE.SphereGeometry(.48,20,16),ballMat);
addProp(ball,3,-1,.48,'ball');

// Faroles con luz puntual.
function lamp(x,z) {
  const pole=new THREE.Mesh(new THREE.CylinderGeometry(.07,.1,3,8),new THREE.MeshStandardMaterial({color:0x3a4038}));
  pole.position.set(x,1.5,z); pole.castShadow=true; scene.add(pole);
  const bulb=new THREE.Mesh(new THREE.SphereGeometry(.18,12,10),new THREE.MeshStandardMaterial({color:0xffd18a,emissive:0xff9d36,emissiveIntensity:1.5}));
  bulb.position.set(x,3.05,z); scene.add(bulb);
  const light=new THREE.PointLight(0xffb66a,22,9,2); light.position.set(x,3,z); scene.add(light);
}
lamp(4,-3); lamp(-4,5);

// Estado de movimiento.
const keys={};
let mode='walk', moving=false, jumpVelocity=0, grounded=true, paused=false;
let elapsed=0, messageTimer=0;
const speed={walk:3.4,run:6.0,dance:0};
const worldLimit=19.4;
function notify(text){ message.textContent=text; message.classList.add('visible'); messageTimer=2.2; }
function setMode(next){
  if(mode===next)return;
  mode=next;
  actionLabel.textContent=({walk:'Caminar',run:'Correr',dance:'Bailar'})[mode];
  playCharacterAction();
  statusLabel.textContent=mode==='dance'?'Bailando':(moving?'En movimiento':'Explorando');
  notify('Secuencia: '+actionLabel.textContent);
}
function setMoving(value){
  if(moving===value)return;
  moving=value;
  statusLabel.textContent=paused?'En pausa':(mode==='dance'?'Bailando':(moving?'En movimiento':'Explorando'));
  playCharacterAction();
}

window.addEventListener('keydown',e=>{
  const k=e.key.toLowerCase();
  if([' ','arrowup','arrowdown','arrowleft','arrowright'].includes(k)) e.preventDefault();
  if(k==='1')setMode('walk');
  if(k==='2')setMode('run');
  if(k==='3')setMode('dance');
  if((k==='q'||k==='e') && !e.repeat) character.rotation.y += k==='q'?Math.PI/2:-Math.PI/2;
  if(k===' ' && grounded && !paused && !e.repeat){jumpVelocity=6.5;grounded=false;notify('¡Salto!');}
  if(k==='escape' && !e.repeat){
    paused=!paused;
    if(paused){Object.keys(keys).forEach(key=>keys[key]=false);setMoving(false);}
    statusLabel.textContent=paused?'En pausa':(mode==='dance'?'Bailando':'Explorando');
  }
  if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'].includes(k)){
    keys[k]=true;
    if(!paused)setMoving(true);
  }
});
window.addEventListener('keyup',e=>{
  const k=e.key.toLowerCase(); keys[k]=false;
  const active=['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'].some(key=>keys[key]);
  if(!active)setMoving(false);
});
window.addEventListener('blur',()=>{
  Object.keys(keys).forEach(k=>keys[k]=false);
  setMoving(false);
});

// Colisión aproximada circular contra rocas, troncos y límites del escenario.
function collides(x,z) {
  if(Math.abs(x)>worldLimit || Math.abs(z)>worldLimit)return true;
  for(const o of obstacles){
    if(!o.solid) continue;
    const p=o.prop;
    const ox=p?p.mesh.position.x:o.mesh.position.x;
    const oz=p?p.mesh.position.z:o.mesh.position.z;
    const rr=(p?p.r:o.radius)+0.52;
    if(Math.hypot(x-ox,z-oz)<rr)return true;
  }
  return false;
}
const worldUp=new THREE.Vector3(0,1,0);
const cameraForward=new THREE.Vector3();
const cameraRight=new THREE.Vector3();
const moveDirection=new THREE.Vector3();
function moveCharacter(dt) {
  if(paused)return;
  const forwardInput=(keys.w||keys.arrowup?1:0)-(keys.s||keys.arrowdown?1:0);
  const sideInput=(keys.d||keys.arrowright?1:0)-(keys.a||keys.arrowleft?1:0);
  const hasInput=forwardInput!==0||sideInput!==0;

  if(hasInput){
    // WASD relativo a la orientación actual de la cámara: el personaje siempre camina hacia donde mira la cámara.
    camera.getWorldDirection(cameraForward);
    cameraForward.y=0; cameraForward.normalize();
    cameraRight.crossVectors(cameraForward,worldUp).normalize();
    moveDirection.copy(cameraForward).multiplyScalar(forwardInput)
      .addScaledVector(cameraRight,sideInput).normalize();

    const velocity=(mode==='run'?speed.run:speed.walk)*dt;
    const nx=THREE.MathUtils.clamp(character.position.x+moveDirection.x*velocity,-worldLimit,worldLimit);
    const nz=THREE.MathUtils.clamp(character.position.z+moveDirection.z*velocity,-worldLimit,worldLimit);
    // Resolver X y Z por separado permite deslizarse junto a los obstáculos.
    if(!collides(nx,character.position.z))character.position.x=nx;
    if(!collides(character.position.x,nz))character.position.z=nz;

    // El modelo humano mira hacia +Z; este ángulo alinea su torso con el vector de avance.
    character.rotation.y=Math.atan2(moveDirection.x,moveDirection.z);
    if(!moving)setMoving(true);
  } else if(moving){
    setMoving(false);
  }

  if(jumpVelocity!==0||!grounded){
    character.position.y+=jumpVelocity*dt;
    jumpVelocity-=17*dt;
    if(character.position.y<=0){character.position.y=0;jumpVelocity=0;grounded=true;}
  }
}

// Las animaciones del modelo se mezclan suavemente. El baile se añade a los huesos superiores.
function animateCharacter(t,dt) {
  if(mixer)mixer.update(dt);
  if(mode==='dance' && characterModel){
    for(const item of danceBones){
      const n=item.bone.name.toLowerCase();
      if(n.includes('arm') || n.includes('shoulder')){
        item.bone.rotation.z=item.base.z+Math.sin(t*4.8+item.phase)*0.62;
        item.bone.rotation.x=item.base.x+Math.sin(t*3.2+item.phase)*0.24;
      } else if(n.includes('spine') || n.includes('chest')){
        item.bone.rotation.y=item.base.y+Math.sin(t*2.4+item.phase)*0.12;
      }
    }
  } else if(danceBones.length){
    for(const item of danceBones)item.bone.rotation.copy(item.base);
  }
}

// La pelota se desplaza al recibir una patada/colisión; los demás objetos permanecen sólidos.
function updateProps(dt,t) {
  for(const p of props){
    if(p.kind==='ball'){
      p.mesh.position.x+=p.velocity.x*dt; p.mesh.position.z+=p.velocity.z*dt;
      p.velocity.multiplyScalar(Math.pow(.94,dt*60));
      if(Math.hypot(p.velocity.x,p.velocity.z)<.08){p.velocity.set(0,0,0);}
      p.mesh.position.y=.48+Math.abs(Math.sin(t*5))*Math.min(.12,p.velocity.length()*.025);
      if(Math.abs(p.mesh.position.x)>19||Math.abs(p.mesh.position.z)>19){p.velocity.multiplyScalar(-.7);}
      const d=Math.hypot(character.position.x-p.mesh.position.x,character.position.z-p.mesh.position.z);
      if(d<.92 && moving){
        const dir=new THREE.Vector3(p.mesh.position.x-character.position.x,0,p.mesh.position.z-character.position.z).normalize();
        p.velocity.add(dir.multiplyScalar(mode==='run'?7:4));
        notify('¡Pelota pateada!');
      }
    }
  }
}
const desiredTarget=new THREE.Vector3();
function updateCamera(){
  desiredTarget.set(character.position.x,1.25+character.position.y,character.position.z);
  const delta=desiredTarget.sub(controls.target);
  controls.target.addScaledVector(delta,0.16);
  camera.position.addScaledVector(delta,0.16);
}

// Bucle principal.
const clock=new THREE.Clock();
function animate(){
  requestAnimationFrame(animate);
  const dt=Math.min(clock.getDelta(),.04); elapsed+=dt;
  if(!paused){moveCharacter(dt);updateProps(dt,elapsed);animateCharacter(elapsed,dt);}
  updateCamera(); controls.update();
  if(messageTimer>0){messageTimer-=dt;if(messageTimer<=0)message.classList.remove('visible');}
  renderer.render(scene,camera);
}
animate();
document.querySelector('#count').textContent=String(props.length+8+14+38);

window.addEventListener('resize',()=>{
  const w=game.clientWidth,h=game.clientHeight;
  camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h);
});
