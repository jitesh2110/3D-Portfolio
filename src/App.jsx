import React, { useEffect, useRef, useCallback, useState } from 'react';
import * as THREE from 'https://unpkg.com/three@0.159.0/build/three.module.js';
import { GLTFLoader } from 'https://unpkg.com/three@0.159.0/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'https://unpkg.com/three@0.159.0/examples/jsm/controls/OrbitControls.js';
import * as TWEEN from 'https://cdnjs.cloudflare.com/ajax/libs/tween.js/21.0.0/tween.esm.min.js';
import "./App.css"
import PortfolioPopup from './PortfolioPopup';

const App = () => {
    const sceneRef = useRef(null);
    const cameraRef = useRef(null);
    const rendererRef = useRef(null);
    const planeRef = useRef(null);
    const controlsRef = useRef(null);
    const clockRef = useRef(null);
    const snowfallMixerRef = useRef(null);
    const isDayRef = useRef(true);
    const starFieldRef = useRef(null);
    const billboard1Ref = useRef(null);
    const billboard2Ref = useRef(null);
    const billboard3Ref = useRef(null);
    const audioPenguinRef = useRef(null);
    const penguinMixerRef = useRef(null);
    const raycasterRef = useRef(new THREE.Raycaster());
    const pointerRef = useRef(new THREE.Vector2());
    const signboardMeshesRef = useRef([]);
    const soundRef = useRef(null);
    const audioStartedRef = useRef(false);
    const hoveredSignRef = useRef(null);


    const [showPortfolioPopup, setShowPortfolioPopup] = useState(false);
    const portfolioButtonRef = useRef(null);
    const show2DFolioRef = useRef(false);
    const [show2DFolioButton, setShow2DFolioButton] = useState(false);

    const [isLoading, setIsLoading] = useState(true);
    const [isReady, setIsReady] = useState(false);
    const [hasStarted, setHasStarted] = useState(false);

    const START_CAMERA_POSITION = new THREE.Vector3(-130, 35, 210);
    const START_CONTROLS_TARGET = new THREE.Vector3(0, 0, 0);
    const MAX_SCENE_DISTANCE = 45;
    const MIN_SCENE_DISTANCE = 10;
    const floorClippingPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0.1);
    const DAY_COLOR = new THREE.Color(0x4682B4);
    const NIGHT_COLOR = new THREE.Color(0x0a101f);
    const DOME_RADIUS = 50;
    const LAMP_LIGHT_COLOR = 0xffa500;

    const MODEL_PATH = './road.glb';
    const BILLBOARD_PATH_ABOUTME = './billboard1.glb';
    const BILLBOARD_PATH_PROJECTS = './billboard3.glb';
    const BILLBOARD_PATH_SKILLS = './billboard2.glb';
    const SIGNBOARD_PATH = './Signboard.glb';
    const SNOWFALL_PATH = './snowfall.glb';
    const SNOWTREE1_PATH = './snowtree1.glb';
    const SNOWTREE2_PATH = './snowtree2.glb';
    const AUDIO_PENGUIN_PATH = './audio_penguin.glb';

    const canvasRef = useRef(null);
    const toggleButtonRef = useRef(null);
    const backButtonRef = useRef(null);

    const loadModel = async (path) => {
        const loader = new GLTFLoader();
        try {
            const gltf = await loader.loadAsync(path);
            return gltf;
        } catch (error) {
            console.error(`Model loading failed for path: ${path}`);
            throw new Error(`Model loading failed for path: ${path}`);
        }
    };

    const startScene = () => {
        setHasStarted(true);

        animate();

        if (soundRef.current && !audioStartedRef.current) {
            const context = THREE.AudioContext.getContext();
            if (context.state === 'suspended') {
                context.resume();
            }
            soundRef.current.play();
            audioStartedRef.current = true;
        }
    };


    const togglePortfolioPopup = () => {
        setShowPortfolioPopup(!showPortfolioPopup);
    }

    const onMouseMove = useCallback((event) => {
        pointerRef.current.x = (event.clientX / window.innerWidth) * 2 - 1;
        pointerRef.current.y = - (event.clientY / window.innerHeight) * 2 + 1;
    }, []);

    const open2DFolio = () => {
        window.open('https://your-2d-portfolio-url.com', '_blank');
    };

    const setupEmissiveMaterials = (billboard, isNight = false) => {
        const DAY_EMISSIVE = 0x444444;  
        const NIGHT_EMISSIVE = 0x88aaff; 
        const EMISSIVE_INTENSITY = isNight ? 2.0 : 0.3;

        billboard.traverse((child) => {
            if (child.name === 'Object_4') {
                const materials = Array.isArray(child.material) ? child.material : [child.material];

                materials.forEach(material => {
                    if (!child.name.includes('text') && !child.name.includes('Text')) {
                        material.emissive = new THREE.Color(isNight ? NIGHT_EMISSIVE : DAY_EMISSIVE);
                        material.emissiveIntensity = EMISSIVE_INTENSITY;
                        material.emissiveMap = material.map || material.emissiveMap;
                        material.needsUpdate = true;
                    }
                });
            }
        });
    };

    const handleHover = () => {
        if (!cameraRef.current || signboardMeshesRef.current.length === 0) return;

        raycasterRef.current.setFromCamera(pointerRef.current, cameraRef.current);
        const intersects = raycasterRef.current.intersectObjects(signboardMeshesRef.current, true);

        if (intersects.length > 0) {
            const obj = intersects[0].object;

            if (hoveredSignRef.current !== obj) {
                if (hoveredSignRef.current) {
                    new TWEEN.Tween(hoveredSignRef.current.scale)
                        .to({ x: 1, y: 1, z: 1 }, 200)
                        .easing(TWEEN.Easing.Quadratic.Out)
                        .start();
                }
                hoveredSignRef.current = obj;
                new TWEEN.Tween(obj.scale)
                    .to({ x: 1.2, y: 1.2, z: 1.2 }, 300)
                    .easing(TWEEN.Easing.Back.Out)
                    .start();
                document.body.style.cursor = 'pointer';
            }
        } else {

            if (hoveredSignRef.current) {
                new TWEEN.Tween(hoveredSignRef.current.scale)
                    .to({ x: 1, y: 1, z: 1 }, 200)
                    .easing(TWEEN.Easing.Quadratic.Out)
                    .start();
                hoveredSignRef.current = null;
                document.body.style.cursor = 'default';
            }
        }
    };

    const togglePenguinAudio = () => {
        if (!soundRef.current) {
            console.warn("Audio not loaded yet");
            return;
        }

        if (soundRef.current.isPlaying) {
            soundRef.current.pause();
            console.log("🔇 BGM Paused (Penguin clicked)");
        } else {
            soundRef.current.play();
            console.log("🔊 BGM Playing (Penguin clicked)");
        }
    };


    const setupAudio = (camera) => {

        const listener = new THREE.AudioListener();
        camera.add(listener);

        const sound = new THREE.Audio(listener);

        const audioLoader = new THREE.AudioLoader();
        audioLoader.load('./bgsound.mp3', (buffer) => {
            sound.setBuffer(buffer);
            sound.setLoop(true);
            sound.setVolume(0.3); 
            soundRef.current = sound;
        });
    };

    const createRadialFadeTexture = () => {
        const size = 512;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const context = canvas.getContext('2d');

        const center = size / 2;
        const gradient = context.createRadialGradient(center, center, 0, center, center, center);
        gradient.addColorStop(0.7, 'white');
        gradient.addColorStop(1.0, 'black');
        context.fillStyle = gradient;
        context.fillRect(0, 0, size, size);
        const texture = new THREE.CanvasTexture(canvas);
        return texture;
    };

    const enableClipping = (model) => {
        model.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = false;
                child.receiveShadow = false;

                const materials = Array.isArray(child.material) ? child.material : [child.material];
                materials.forEach(material => {
                    material.clippingPlanes = [floorClippingPlane];
                    material.needsUpdate = true;
                });
            }
        });
    };

    const addStars = () => {
        if (starFieldRef.current) return;

        const starsGeometry = new THREE.BufferGeometry();
        const starsCount = 2000;
        const positions = [];

        for (let i = 0; i < starsCount; i++) {
            const x = THREE.MathUtils.randFloatSpread(200);
            const y = THREE.MathUtils.randFloatSpread(200);
            const z = THREE.MathUtils.randFloatSpread(200);

            if (y > 10 && (x * x + y * y + z * z) > (DOME_RADIUS * DOME_RADIUS)) {
                positions.push(x, y, z);
            }
        }

        starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));

        const starsMaterial = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.5,
            sizeAttenuation: true,
            transparent: true,
            opacity: 0.8
        });

        starFieldRef.current = new THREE.Points(starsGeometry, starsMaterial);
        starFieldRef.current.name = 'StarField';
        sceneRef.current.add(starFieldRef.current);
    };

    const attachPointLightsToLamps = (model) => {
        const LAMP_COLOR = 0xffc385;
        const SPOT_INTENSITY = 500;
        const SPOT_DISTANCE = 100;
        const SPOT_ANGLE = Math.PI / 2;
        const SPOT_PENUMBRA = 1;
        const LIGHT_OFFSET_Y = 7;
        const LIGHT_OFFSET_Z = 6;

        sceneRef.current.userData.lampLights = [];

        model.traverse((child) => {
            if (child.name.startsWith("Cone") && child.children.length >= 2) {
                const bulb = child.children[1];

                const spotLight = new THREE.SpotLight(
                    LAMP_COLOR,
                    SPOT_INTENSITY,
                    SPOT_DISTANCE,
                    SPOT_ANGLE,
                    SPOT_PENUMBRA
                );

                spotLight.position.set(0, LIGHT_OFFSET_Y, LIGHT_OFFSET_Z);

                const target = new THREE.Object3D();
                target.position.set(0, -10, 5);

                spotLight.target = target;
                bulb.add(spotLight);
                bulb.add(target);

                spotLight.castShadow = false;

                const glow = new THREE.Mesh(
                    new THREE.SphereGeometry(0.15, 8, 8),
                    new THREE.MeshBasicMaterial({
                        color: LAMP_LIGHT_COLOR,
                        transparent: true,
                        opacity: 0.9
                    })
                );
                glow.position.copy(spotLight.position);

                bulb.add(glow);

                sceneRef.current.userData.lampLights.push(spotLight);
                glow.material.userData.isLampEmitter = false;
            }
        });
    };

    const setupDayEnvironment = () => {
        sceneRef.current.background = DAY_COLOR;
        sceneRef.current.fog = new THREE.Fog(DAY_COLOR, 20, 100);

        const ambientLight = sceneRef.current.getObjectByName('AmbientLight');
        ambientLight.intensity = 1.5;

        const directionalLight = sceneRef.current.getObjectByName('DirectionalLight');
        directionalLight.color.set(0xffeedd);
        directionalLight.intensity = 1.0;
        directionalLight.position.set(0, 20, 10);

        if (starFieldRef.current) {
            starFieldRef.current.visible = false;
        }

        [billboard1Ref.current, billboard2Ref.current, billboard3Ref.current].forEach(billboard => {
            if (billboard) setupEmissiveMaterials(billboard, false);
        });

        if (sceneRef.current.userData.lampLights) {
            sceneRef.current.userData.lampLights.forEach(light => {
                light.visible = false;
            });
        }

        if (toggleButtonRef.current) {
            toggleButtonRef.current.textContent = 'NIGHT';
        }
        isDayRef.current = true;
        console.log('Switched to Day - Emissive materials updated');
    };

    const setupNightEnvironment = () => {
        sceneRef.current.background = NIGHT_COLOR;
        sceneRef.current.fog = new THREE.Fog(NIGHT_COLOR, 30, 120);

        const ambientLight = sceneRef.current.getObjectByName('AmbientLight');
        ambientLight.intensity = 0.5;

        const directionalLight = sceneRef.current.getObjectByName('DirectionalLight');
        directionalLight.color.set(0xaabbff);
        directionalLight.intensity = 0.2;
        directionalLight.position.set(10, 30, 20);

        if (!starFieldRef.current) {
            addStars();
        }
        starFieldRef.current.visible = true;

        [billboard1Ref.current, billboard2Ref.current, billboard3Ref.current].forEach(billboard => {
            if (billboard) setupEmissiveMaterials(billboard, true);
        });

        if (sceneRef.current.userData.lampLights) {
            sceneRef.current.userData.lampLights.forEach(light => {
                light.visible = true;
            });
        }

        if (toggleButtonRef.current) {
            toggleButtonRef.current.textContent = 'DAY';
        }
        isDayRef.current = false;
        console.log('Switched to Night - Emissive materials updated');
    };


    const toggleEnvironment = () => {
        if (isDayRef.current) {
            setupNightEnvironment();
        } else {
            setupDayEnvironment();
        }
    };

    const onDocumentClick = useCallback((event) => {
       
        if (!audioStartedRef.current && soundRef.current) {
            const context = THREE.AudioContext.getContext();
            if (context.state === 'suspended') {
                context.resume();
            }
            soundRef.current.play();
            audioStartedRef.current = true;
            console.log("Audio started by user gesture");
        }

        if (!controlsRef.current?.enabled) return;

        pointerRef.current.x = (event.clientX / window.innerWidth) * 2 - 1;
        pointerRef.current.y = - (event.clientY / window.innerHeight) * 2 + 1;

        raycasterRef.current.setFromCamera(pointerRef.current, cameraRef.current);
        const intersects = raycasterRef.current.intersectObjects(signboardMeshesRef.current, true);

        if (intersects.length > 0) {
            event.stopPropagation();
            const clickedObj = intersects[0].object;

            if (clickedObj.userData.isPenguin || clickedObj.userData.isClickCollider) {
                console.log("🐧 PENGUIN AREA CLICKED! Toggling audio...");
                togglePenguinAudio();
                return;
            }

            if (clickedObj.userData.targetBillboard) {
                moveCameraToBillboard(clickedObj.userData.targetBillboard);
            }
            else if (clickedObj.userData.externalUrl) {
                const url = clickedObj.userData.externalUrl;
                if (clickedObj.userData.isDownload) {
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = 'Jitesh_Deshmukh_Resume.pdf';
                    link.click();
                } else {
                    window.open(url, '_blank');
                }
            }
        }
    }, []);


    const moveCameraToBillboard = (targetBillboard) => {
        const EYE_LEVEL_OFFSET = 4.0;
        const NEW_ZOOM_DISTANCE = 3;

        const targetPosition = targetBillboard.position.clone();
        targetPosition.y = EYE_LEVEL_OFFSET;

        const viewingDirection = new THREE.Vector3();
        targetBillboard.getWorldDirection(viewingDirection);

        const QUARTER_TURN = -Math.PI / 2;

        const correctionQuaternion = new THREE.Quaternion().setFromAxisAngle(
            new THREE.Vector3(0, 1, 0),
            QUARTER_TURN
        );

        viewingDirection.applyQuaternion(correctionQuaternion);
        viewingDirection.negate().normalize().multiplyScalar(NEW_ZOOM_DISTANCE);

        const newCameraPosition = targetPosition.clone().add(viewingDirection);
        newCameraPosition.y = EYE_LEVEL_OFFSET;

        controlsRef.current.enabled = false;

        new TWEEN.Tween(cameraRef.current.position)
            .to({ x: newCameraPosition.x, y: newCameraPosition.y, z: newCameraPosition.z }, 1000)
            .easing(TWEEN.Easing.Quadratic.InOut)
            .start();

        new TWEEN.Tween(controlsRef.current.target)
            .to({ x: targetPosition.x, y: targetPosition.y, z: targetPosition.z }, 1000)
            .easing(TWEEN.Easing.Quadratic.InOut)
            .onUpdate(() => {
                controlsRef.current.update();
            })
            .onComplete(() => {
                controlsRef.current.minDistance = 4;
                controlsRef.current.maxDistance = 5;
                controlsRef.current.maxPolarAngle = Math.PI / 1.9;
                controlsRef.current.enabled = true;

                if (backButtonRef.current) {
                    backButtonRef.current.style.display = 'block';
                }

                setShow2DFolioButton(true);


                console.log("Entered Billboard Focus Mode.");
            })
            .start();
    };

    const returnToStartScene = () => {
        if (backButtonRef.current) {
            backButtonRef.current.style.display = 'none';
        }

        controlsRef.current.enabled = false;

        new TWEEN.Tween(cameraRef.current.position)
            .to(START_CAMERA_POSITION, 1200)
            .easing(TWEEN.Easing.Quadratic.InOut)
            .start();

        new TWEEN.Tween(controlsRef.current.target)
            .to(START_CONTROLS_TARGET, 1200)
            .easing(TWEEN.Easing.Quadratic.InOut)
            .onUpdate(() => {
                controlsRef.current.update();
            })
            .onComplete(() => {

                setShow2DFolioButton(false);
                setShowPortfolioPopup(false);

                controlsRef.current.minDistance = MIN_SCENE_DISTANCE;
                controlsRef.current.maxDistance = MAX_SCENE_DISTANCE;
                cameraRef.current.position.copy(START_CAMERA_POSITION);
                controlsRef.current.target.copy(START_CONTROLS_TARGET);

                controlsRef.current.maxPolarAngle = Math.PI / 2.1;
                controlsRef.current.enabled = true;
                console.log("Returned to main scene.");
            })
            .start();
    };

    const onWindowResize = () => {
        if (cameraRef.current && rendererRef.current) {
            cameraRef.current.aspect = window.innerWidth / window.innerHeight;
            cameraRef.current.updateProjectionMatrix();
            rendererRef.current.setSize(window.innerWidth, window.innerHeight);
        }
    };

    const animate = () => {
        requestAnimationFrame(animate);
        handleHover();
        const delta = clockRef.current.getDelta();

        if (snowfallMixerRef.current?.update) {
            snowfallMixerRef.current.update(delta);
        }

        if (penguinMixerRef.current?.update) {
            penguinMixerRef.current.update(delta);
        }

        TWEEN.update();

        if (controlsRef.current) {
            controlsRef.current.update();
        }
        if (rendererRef.current && sceneRef.current && cameraRef.current) {
            rendererRef.current.render(sceneRef.current, cameraRef.current);
        }
    };


    const init = async () => {
        // 1. Scene setup
        sceneRef.current = new THREE.Scene();
        sceneRef.current.userData.lampLights = [];

        // 2. Camera setup
        const aspectRatio = window.innerWidth / window.innerHeight;
        cameraRef.current = new THREE.PerspectiveCamera(75, aspectRatio, 0.1, 1000);
        cameraRef.current.position.copy(START_CAMERA_POSITION);

        // audio setup
        setupAudio(cameraRef.current);

        // 3. Renderer setup
        const canvas = canvasRef.current;
        rendererRef.current = new THREE.WebGLRenderer({
            canvas,
            antialias: true
        });
        rendererRef.current.setSize(window.innerWidth, window.innerHeight);
        rendererRef.current.setPixelRatio(
            Math.min(window.devicePixelRatio, 1.5)
        );

        rendererRef.current.toneMapping = THREE.ACESFilmicToneMapping;
        rendererRef.current.toneMappingExposure = 1.0;
        rendererRef.current.shadowMap.enabled = false;
        rendererRef.current.clippingPlanes = [];
        rendererRef.current.localClippingEnabled = true;

        // 4. Clock setup
        clockRef.current = new THREE.Clock();

        // 5. Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 1);
        ambientLight.name = 'AmbientLight';
        sceneRef.current.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffeedd, 1);
        directionalLight.position.set(0, 20, 10);
        directionalLight.castShadow = false;
        directionalLight.name = 'DirectionalLight';
        sceneRef.current.add(directionalLight);

        // 6. Create the central plane
        const geometry = new THREE.PlaneGeometry(200, 200);
        const fadeTexture = createRadialFadeTexture();

        const material = new THREE.MeshBasicMaterial({
            color: 0xbfdbf7,
            transparent: true,
            alphaMap: fadeTexture,
            side: THREE.DoubleSide
        });

        planeRef.current = new THREE.Mesh(geometry, material);
        planeRef.current.rotation.x = -Math.PI / 2;
        planeRef.current.position.set(0, 0, 0);
        planeRef.current.receiveShadow = false;
        sceneRef.current.add(planeRef.current);

        // 7. Initialize OrbitControls
        controlsRef.current = new OrbitControls(cameraRef.current, rendererRef.current.domElement);
        controlsRef.current.target.copy(START_CONTROLS_TARGET);
        controlsRef.current.enableDamping = true;
        controlsRef.current.dampingFactor = 0.05;
        controlsRef.current.minDistance = MIN_SCENE_DISTANCE;
        controlsRef.current.maxDistance = MAX_SCENE_DISTANCE;
        controlsRef.current.maxPolarAngle = Math.PI / 2.1;

        // 8. Load Models 
        const roadGLTF = await loadModel(MODEL_PATH);
        const road = roadGLTF.scene;
        road.scale.set(1, 1, 1);
        road.position.set(0, 0.1, 0);
        enableClipping(road);
        sceneRef.current.add(road);

        attachPointLightsToLamps(road);

        const BILLBOARD_SCALE = 0.5;

        const billboard_aboutme = await loadModel(BILLBOARD_PATH_ABOUTME);
        billboard1Ref.current = billboard_aboutme.scene;
        billboard1Ref.current.scale.set(BILLBOARD_SCALE, BILLBOARD_SCALE, BILLBOARD_SCALE);
        billboard1Ref.current.position.set(5, 0.1, 20);
        billboard1Ref.current.rotation.y = -Math.PI / 1.2;
        setupEmissiveMaterials(billboard1Ref.current, false);

        const billboard_projects = await loadModel(BILLBOARD_PATH_PROJECTS);
        billboard2Ref.current = billboard_projects.scene;
        billboard2Ref.current.scale.set(BILLBOARD_SCALE, BILLBOARD_SCALE, BILLBOARD_SCALE);
        billboard2Ref.current.position.set(-7, 0.1, -6);
        billboard2Ref.current.rotation.y = Math.PI / 0.65;
        setupEmissiveMaterials(billboard2Ref.current, false);

        const billboard_skills = await loadModel(BILLBOARD_PATH_SKILLS);
        billboard3Ref.current = billboard_skills.scene;
        billboard3Ref.current.scale.set(BILLBOARD_SCALE, BILLBOARD_SCALE, BILLBOARD_SCALE);
        billboard3Ref.current.position.set(18, 0.1, -30);
        billboard3Ref.current.rotation.y = Math.PI / 0.85;
        setupEmissiveMaterials(billboard3Ref.current, false);

        [billboard1Ref.current, billboard2Ref.current, billboard3Ref.current].forEach(billboard => {
            enableClipping(billboard);
            sceneRef.current.add(billboard);
        });

        const signboardGLTF = await loadModel(SIGNBOARD_PATH);
        const signboard = signboardGLTF.scene;
        signboard.scale.set(1.3, 1.3, 1.3);
        signboard.position.set(-15, 0.1, 34);
        signboard.rotation.y = -0.55;
        enableClipping(signboard);
        sceneRef.current.add(signboard);

        const externalLinks = {
            'Linkedin': 'https://www.linkedin.com/in/jitesh-deshmukh-4a6252334/',
            'Git': 'https://github.com/jitesh2110',
            'Insta': 'https://www.instagram.com/jitesh_7200/',
            'Resume': './resume.pdf'
        };

        signboard.traverse((child) => {
            if (child.isMesh) {
                const meshName = child.name;

                let targetBillboard = null;
                if (meshName === 'Aboutme') targetBillboard = billboard1Ref.current;
                if (meshName === 'Projects') targetBillboard = billboard2Ref.current;
                if (meshName === 'Skills') targetBillboard = billboard3Ref.current;

                if (targetBillboard) {
                    child.userData.targetBillboard = targetBillboard;
                    signboardMeshesRef.current.push(child);
                }

                if (externalLinks[meshName]) {
                    child.userData.externalUrl = externalLinks[meshName];
                    child.userData.isDownload = (meshName === 'Resume');
                    signboardMeshesRef.current.push(child);
                }
            }
        });

        const SNOWTREE_SCALE = 0.8;
        const snowTree1GLTF = await loadModel(SNOWTREE1_PATH);
        const snowTree1 = snowTree1GLTF.scene;
        snowTree1.scale.set(SNOWTREE_SCALE, SNOWTREE_SCALE, SNOWTREE_SCALE);
        snowTree1.position.set(-30, 0.1, 0);
        snowTree1.rotation.y = Math.PI / 4;
        enableClipping(snowTree1);
        sceneRef.current.add(snowTree1);

        const snowTree2GLTF = await loadModel(SNOWTREE2_PATH);
        const snowTree2 = snowTree2GLTF.scene;
        snowTree2.scale.set(SNOWTREE_SCALE * 1.2, SNOWTREE_SCALE * 1.2, SNOWTREE_SCALE * 1.2);
        snowTree2.position.set(50, -6, -10);
        snowTree2.rotation.y = -Math.PI / 3;
        enableClipping(snowTree2);
        sceneRef.current.add(snowTree2);

        const audioPenguinGLTF = await loadModel(AUDIO_PENGUIN_PATH);
        const audioPenguin = audioPenguinGLTF.scene;
        audioPenguinRef.current = audioPenguin;
        audioPenguin.scale.set(0.005, 0.005, 0.005); 
        audioPenguin.position.set(-25, 0.1, 20); 
        audioPenguin.rotation.y = -Math.PI / 6; 
        enableClipping(audioPenguin);
        sceneRef.current.add(audioPenguin);

        const clickBox = new THREE.Mesh(
            new THREE.BoxGeometry(1.8, 1.8, 1.8), 
            new THREE.MeshBasicMaterial({
                transparent: true,
                opacity: 0, 
                visible: false 
            })
        );
        clickBox.position.copy(audioPenguin.position);
        clickBox.position.y += 1; 
        clickBox.userData.isPenguin = true;
        clickBox.userData.isClickCollider = true;
        signboardMeshesRef.current.push(clickBox);
        sceneRef.current.add(clickBox);

        if (audioPenguinGLTF.animations && audioPenguinGLTF.animations.length > 0) {
            penguinMixerRef.current = new THREE.AnimationMixer(audioPenguinRef.current);
            const action = penguinMixerRef.current.clipAction(audioPenguinGLTF.animations[0]);
            action.loop = THREE.LoopRepeat;
            action.play();
            console.log("Penguin animation started!"); 
        } else {
            console.warn("No animations found in penguin model");
        }

        audioPenguin.traverse((child) => {
            if (child.isMesh) {
                child.userData.isPenguin = true; 
                signboardMeshesRef.current.push(child); 
            }
        });

        const snowfallGLTF = await loadModel(SNOWFALL_PATH);
        const snowfall = snowfallGLTF.scene;
        snowfall.scale.set(8, 8, 8);
        snowfall.position.set(0, 0.3, 0);
        sceneRef.current.add(snowfall);


        if (snowfallGLTF.animations && snowfallGLTF.animations.length) {
            snowfallMixerRef.current = new THREE.AnimationMixer(snowfall);
            const clip = snowfallGLTF.animations[0];
            const action = snowfallMixerRef.current.clipAction(clip);
            action.loop = THREE.LoopRepeat;
            action.play();
        }

        setupDayEnvironment();

        window.addEventListener('resize', onWindowResize, false);
        window.addEventListener('click', onDocumentClick);

        setIsLoading(false);
        setIsReady(true);

    };

    useEffect(() => {
        init();
        window.addEventListener('mousemove', onMouseMove); 

        return () => {

            window.removeEventListener('mousemove', onMouseMove); 
            window.removeEventListener('resize', onWindowResize);
            window.removeEventListener('click', onDocumentClick);

        };
    }, []);

    return (
        <>
            {isLoading && (
                <div className="cyber-loader">
                    <div className="loader-spinner"></div>
                    <div className="system-text">SYSTEM BOOT</div>
                </div>
            )}

            {!isLoading && isReady && !hasStarted && (
                <div className="cyber-loader">
                    <div className="loader-spinner"></div>
                    <div className="system-text">3D WORLD READY</div>
                    <button className="cyber-btn" onClick={startScene}>
                        ENTER SCENE
                    </button>
                </div>
            )}

            {/* =================UI BUTTONS ================= */}
            {hasStarted && (
                <>
                    <div className="return-btn-pos">
                        <button
                            ref={backButtonRef}
                            className="cyber-btn"
                            id="back-button"
                            onClick={returnToStartScene}
                            style={{ display: 'none' }}
                        >
                            RETURN
                        </button>
                    </div>

                    <div className="hud-panel">
                        <button
                            ref={toggleButtonRef}
                            className="cyber-btn secondary"
                            id="toggle-button"
                            onClick={toggleEnvironment}
                        > NIGHT MODE
                        </button>
                    </div>

                    {show2DFolioButton && (
                        <button
                            id="portfolio-button"
                            className="cyber-btn"
                            onClick={() => setShowPortfolioPopup(true)}
                        >
                            2DFOLIO
                        </button>
                    )}

                    <PortfolioPopup
                        isOpen={showPortfolioPopup}
                        onClose={() => setShowPortfolioPopup(false)}
                    />
                </>
            )}

            <canvas
                ref={canvasRef}
                style={{
                    display: hasStarted ? 'block' : 'none'
                }}
            />

            <style jsx>{`
      @keyframes popupEntrance {
        0% {
          opacity: 0;
          transform: translate(-50%, -50%) scale(0.7) rotateY(-90deg);
        }
        100% {
          opacity: 1;
          transform: translate(-50%, -50%) scale(1) rotateY(0deg);
        }
      }
    `}</style>
        </>);
};

export default App;
