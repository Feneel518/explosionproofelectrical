import fs from 'node:fs/promises';
import path from 'node:path';
import * as THREE from 'three';
import { STLLoader } from 'three/addons/loaders/STLLoader.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { mergeVertices, mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// Run: node scripts/prepare-wellglass.mjs <directory containing the three STLs>
// Source files are read only. No decimation, smoothing or shape changes are applied.
const source = process.argv[2];
if (!source) throw new Error('Supply the directory containing the original STL files.');
globalThis.FileReader = class {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then(result => { this.result = result; this.onloadend?.(); });
  }
};
const scene = new THREE.Scene();
const loader = new STLLoader();
const scale = 4.1 / 225;
const parts = [
  { name: 'body', file: '45w well glass body for RPT.stl', y: 0, travel: 0, color: '#788a96' },
  { name: 'cover', file: 'WELL GLASS 45W- COVER.stl', y: 1.232, travel: 0.9, color: '#9aaab4' },
  // Seat the ring's Z=16.8 shoulder on the body's Z=-83 inner flange.
  // The upper sleeve enters the housing instead of hanging below its face.
  { name: 'ring', file: 'WELL GLASS 45W- RING.stl', y: -0.697, travel: -0.65, color: '#7d929f' },
];
const report = [];
function addDrawing(group, geometry, name) {
  const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geometry, 24), new THREE.MeshBasicMaterial({color:'#003566'}));
  edges.name = name + '-drawing';
  edges.userData.drawing = true;
  group.add(edges);
}
for (const part of parts) {
  const bytes = await fs.readFile(path.join(source, part.file));
  const original = loader.parse(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
  original.computeBoundingBox();
  const bounds = original.boundingBox.clone();
  const center = bounds.getCenter(new THREE.Vector3());
  // The body's rear flange is cropped, so its bounding-box midpoint is not
  // the axis of the circular neck. Its neck is centred at source X/Y = 0.
  if (part.name === 'body') center.set(0, 0, center.z);
  // STL normals describe flat triangle faces. Reconstruct those in the shader,
  // allowing shared positions to be indexed without changing any triangles.
  original.deleteAttribute('normal');
  const geometry = mergeVertices(original, 1e-6);
  geometry.translate(-center.x, -center.y, -center.z);
  geometry.rotateX(part.name === 'cover' ? Math.PI / 2 : -Math.PI / 2);
  geometry.scale(scale, scale, scale);
  const group = new THREE.Group();
  group.name = part.name;
  group.position.y = part.y;
  group.userData = { showcaseTravel: part.travel, sourceFile: part.file };
  const material = new THREE.MeshStandardMaterial({color: part.color, metalness: 0.65, roughness: 0.34, flatShading:true});
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = part.name + '-surface';
  mesh.userData.stlSurface = true;
  group.add(mesh);
  addDrawing(group, geometry, part.name);
  scene.add(group);
  report.push({part:part.name, sourceFile:part.file, sourceBytes:bytes.length, triangles:original.attributes.position.count/3, vertices:geometry.attributes.position.count, originalBounds:bounds});
}
const glassGroup = new THREE.Group();
glassGroup.name = 'glass'; glassGroup.userData.showcaseTravel = -1.15;
// Fuller, deeper bell following the finished-product reference. Its open lip
// enters the ring; the rounded end sits just inside the guard's terminal hoop.
// Compact bell, anchored at its lip so the ring fit stays intact.
const profile = [[0,-3.43],[.20,-3.42],[.43,-3.36],[.69,-3.22],[.93,-3.01],[1.12,-2.73],[1.25,-2.38],[1.30,-1.99],[1.30,-1.52],[1.29,-.96]].map(([x,y])=>new THREE.Vector2(x,-.96+(y+.96)*.60));
const glassGeometry = new THREE.LatheGeometry(profile,64);
const glass = new THREE.Mesh(glassGeometry,new THREE.MeshStandardMaterial({color:'#95bdd2',metalness:0,roughness:.16,transparent:true,opacity:.35,depthWrite:false,side:THREE.DoubleSide}));
glass.name = 'dome-glass'; glass.userData.addedVisual = true;
glassGroup.add(glass); addDrawing(glassGroup,glassGeometry,'glass'); scene.add(glassGroup);
const guardGroup = new THREE.Group(); guardGroup.name='guard'; guardGroup.userData.showcaseTravel=-1.8;
const guardPieces=[];
// Shorten the guard around the new dome while preserving mounting positions
// and round wire cross-sections. Leave clearance beyond the glass tip.
const guardY = (y) => -.92 + (y + .92) * .65;
for(const [radius,tube,y] of [[1.43,.038,-.98],[1.43,.038,-1.70],[1.34,.038,-2.52],[.58,.038,-3.50]]){
  const g=new THREE.TorusGeometry(radius,tube,8,64);g.rotateX(Math.PI/2);g.translate(0,guardY(y),0);guardPieces.push(g);
}
for(let i=0;i<3;i++){
  const angle=i*Math.PI*2/3;
  const p=(r,y)=>new THREE.Vector3(Math.sin(angle)*r,guardY(y),Math.cos(angle)*r);
  const curve=new THREE.CatmullRomCurve3([p(1.43,-.92),p(1.43,-1.70),p(1.34,-2.52),p(1.06,-3.15),p(.58,-3.50)]);
  guardPieces.push(new THREE.TubeGeometry(curve,32,.038,8,false));
}
const guardGeometry=mergeGeometries(guardPieces);guardPieces.forEach(g=>g.dispose());
const guard=new THREE.Mesh(guardGeometry,new THREE.MeshStandardMaterial({color:'#b7c1c7',metalness:.18,roughness:.4}));
guard.name='wire-guard';guard.userData.addedVisual=true;guardGroup.add(guard);addDrawing(guardGroup,guardGeometry,'guard');scene.add(guardGroup);
scene.userData.presentation = 'Original STL geometry with inferred assembly placement. Dome glass and wire guard are added visual approximations.';
const binary = await new GLTFExporter().parseAsync(scene, {binary:true});
const output = path.resolve('public/models');
await fs.mkdir(output, {recursive:true});
await fs.writeFile(path.join(output,'exec-wellglass-45w.glb'), Buffer.from(binary));
await fs.writeFile(path.join(output,'exec-wellglass-45w.json'), JSON.stringify({presentation:scene.userData.presentation,bytes:binary.byteLength,parts:report},null,2)+'\n');
console.log(JSON.stringify({bytes:binary.byteLength,parts:report},null,2));
