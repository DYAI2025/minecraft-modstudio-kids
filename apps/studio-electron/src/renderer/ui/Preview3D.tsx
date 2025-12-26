import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { useProject } from '../state/ProjectContext';
import { Block, Item } from '@kidmodstudio/core-model';
import { TextureGenerator } from '../utils/TextureGenerator';

export function Preview3D() {
  const mountRef = useRef<HTMLInputElement>(null);
  const { state, ui } = useProject();

  // Scene Refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);

  // Init Scene
  useEffect(() => {
    if (!mountRef.current) return;

    // SCENE
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#334155'); // Match card bg
    sceneRef.current = scene;

    // CAMERA
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
    camera.position.z = 2.5; 
    camera.position.y = 1.0;
    cameraRef.current = camera; 

    // RENDERER
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(300, 300); // Fixed size for MVP
    renderer.setPixelRatio(window.devicePixelRatio);
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // CONTROLS
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 2.0;
    controlsRef.current = controls;

    // LIGHTS
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(2, 2, 2);
    scene.add(dirLight);

    // GRID
    const gridHelper = new THREE.GridHelper(10, 10, 0x888888, 0x444444);
    gridHelper.position.y = -0.5;
    scene.add(gridHelper);

    // ANIM LOOP
    const animate = () => {
      requestAnimationFrame(animate);
      if (controlsRef.current) controlsRef.current.update();
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
      controls.dispose();
    };
  }, []);

  // UPDATE MESH EFFECT
  useEffect(() => {
    if (!sceneRef.current || !ui.activeId || !ui.activeType) {
        if (meshRef.current) meshRef.current.visible = false;
        return;
    }

    const activeObj = state.project[`${ui.activeType}s`][ui.activeId];
    if (!activeObj) return;

    if (meshRef.current) {
        if (meshRef.current) meshRef.current.visible = true; 
        sceneRef.current.remove(meshRef.current);
        if (meshRef.current.geometry) meshRef.current.geometry.dispose();
        if (Array.isArray(meshRef.current.material)) {
            meshRef.current.material.forEach(m => m.dispose());
        } else {
            (meshRef.current.material as THREE.Material).dispose();
        }
        meshRef.current = null;
    }

    let geometry: THREE.BufferGeometry;
    let material: THREE.Material;

    if (ui.activeType === 'block') {
        const block = activeObj as Block;
        geometry = new THREE.BoxGeometry(1, 1, 1);
        
        // Generate texture
        const dataUrl = TextureGenerator.generate(block.texture.value, (block as any).texture?.value || 'rock'); 
        const loader = new THREE.TextureLoader();
        const map = loader.load(dataUrl);
        map.magFilter = THREE.NearestFilter; 

        material = new THREE.MeshStandardMaterial({ 
            map: map,
            transparent: block.properties.transparent,
            opacity: block.properties.transparent ? 0.6 : 1.0,
            emissive: block.properties.luminance > 0 ? 0xffffff : 0x000000,
            emissiveIntensity: block.properties.luminance / 15,
            emissiveMap: block.properties.luminance > 0 ? map : null
        });
    } else {
        const item = activeObj as Item;
        geometry = new THREE.PlaneGeometry(0.8, 0.8);
        
        const dataUrl = TextureGenerator.generate(item.texture.value, (item as any).texture?.value || 'rock');
        const loader = new THREE.TextureLoader();
        const map = loader.load(dataUrl);
        map.magFilter = THREE.NearestFilter; 

        material = new THREE.MeshStandardMaterial({ 
            map: map,
            side: THREE.DoubleSide,
            transparent: true,
            alphaTest: 0.5
        });
    }

    const mesh = new THREE.Mesh(geometry, material);
    sceneRef.current.add(mesh);
    meshRef.current = mesh;

  }, [ui.activeId, ui.activeType, state.project]); 

  return <div ref={mountRef} style={{ width: '100%', height: '100%', borderRadius: 'inherit', overflow: 'hidden' }} />;
}
