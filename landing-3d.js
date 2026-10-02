/**
 * StudyMate AI — 3D Front Page & Cinematic Gateway
 * Featuring:
 * 1. Vertices that morph into Study Icons & Badges (Calculus, Neural Nets, Quantum, Circuits, PDF Notes)
 * 2. Floating Holographic Engineering Image Panels (AI, Physics, Circuit boards)
 * 3. FPlus-inspired 3D Neural Constellation Web & Undulating Data Streams
 */

(function () {
    let scene, camera, renderer;
    let mainClusterGroup, bgClusterGroup;
    let mainNodesMesh, mainLinesMesh;
    let bgNodesMesh, bgLinesMesh;
    let streamMesh, bokehMesh;
    let particleTexture, bokehTexture;
    let animationFrameId = null;
    let isWarping = false;
    let isAppActive = false;
    let clock;

    // Mouse tracking & smooth inertia
    let mouseX = 0, mouseY = 0;
    let targetRotationX = 0, targetRotationY = 0;
    let currentRotationX = 0, currentRotationY = 0;
    let mouse3DX = 0, mouse3DY = 0;
    let windowHalfX = window.innerWidth / 2;
    let windowHalfY = window.innerHeight / 2;

    // Constellation Config (Optimized for 60fps locked performance)
    const MAIN_NODE_COUNT = 115;
    const MAIN_MAX_DIST = 32;
    const MAIN_MAX_DIST_SQ = MAIN_MAX_DIST * MAIN_MAX_DIST;
    const mainNodes = [];
    let mainLinePositions, mainLineColors;

    // Background cluster config
    const BG_NODE_COUNT = 35;
    const BG_MAX_DIST = 38;
    const BG_MAX_DIST_SQ = BG_MAX_DIST * BG_MAX_DIST;
    const bgNodes = [];
    let bgLinePositions, bgLineColors;

    // Stream config
    const STREAM_COUNT = 180;
    const streamNodes = [];

    const landingContainer = document.getElementById("landingPage");
    const canvas = document.getElementById("threeCanvas");
    const enterBtn = document.getElementById("enterAppBtn");
    const launchDirectBtn = document.getElementById("launchDirectBtn");
    const heroCard = document.querySelector(".landing-hero");
    const mainContainer = document.querySelector(".container");

    // Helper: Create soft radial glow particle (Pure Monochrome)
    function createGlowSprite(isBokeh) {
        const c = document.createElement('canvas');
        const size = isBokeh ? 128 : 64;
        c.width = size;
        c.height = size;
        const ctx = c.getContext('2d');
        const center = size / 2;

        const gradient = ctx.createRadialGradient(center, center, 0, center, center, center);
        if (isBokeh) {
            gradient.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
            gradient.addColorStop(0.3, 'rgba(220, 220, 220, 0.45)');
            gradient.addColorStop(0.7, 'rgba(160, 160, 160, 0.12)');
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        } else {
            gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
            gradient.addColorStop(0.25, 'rgba(240, 240, 240, 0.92)');
            gradient.addColorStop(0.6, 'rgba(180, 180, 180, 0.38)');
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        }

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, size, size);
        return new THREE.CanvasTexture(c);
    }



    function initThree() {
        if (!canvas || !landingContainer) return;
        clock = new THREE.Clock();

        const isDark = document.documentElement.getAttribute("data-theme") !== "light";

        // 1. Scene setup with rich atmosphere (Noir #080808 / Studio White #fafafa)
        scene = new THREE.Scene();
        scene.fog = new THREE.FogExp2(isDark ? 0x080808 : 0xfafafa, 0.0018);

        // 2. Camera setup
        camera = new THREE.PerspectiveCamera(48, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.set(0, 0, 125);

        // 3. Renderer setup — High performance cap on devicePixelRatio to prevent GPU fillrate choking
        renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            antialias: true,
            alpha: true,
            powerPreference: "high-performance"
        });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setClearColor(isDark ? 0x080808 : 0xfafafa, 1);

        particleTexture = createGlowSprite(false);
        bokehTexture = createGlowSprite(true);

        const isMobile = window.innerWidth < 900;

        // 4. Main 3D Neural Constellation Cluster
        mainClusterGroup = new THREE.Group();
        mainClusterGroup.position.set(isMobile ? 0 : 40, 0, 0);
        scene.add(mainClusterGroup);

        const mainNodeGeo = new THREE.BufferGeometry();
        const mainNodePositions = new Float32Array(MAIN_NODE_COUNT * 3);
        const mainNodeColors = new Float32Array(MAIN_NODE_COUNT * 3);

        for (let i = 0; i < MAIN_NODE_COUNT; i++) {
            const radius = 25 + Math.random() * 26;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos((Math.random() * 2) - 1);

            const x = radius * 1.35 * Math.sin(phi) * Math.cos(theta);
            const y = radius * 0.98 * Math.sin(phi) * Math.sin(theta);
            const z = radius * 1.15 * Math.cos(phi);

            mainNodePositions[i * 3] = x;
            mainNodePositions[i * 3 + 1] = y;
            mainNodePositions[i * 3 + 2] = z;

            const isHighlight = Math.random() > 0.85;
            mainNodes.push({
                x: x, y: y, z: z,
                vx: (Math.random() - 0.5) * 0.12,
                vy: (Math.random() - 0.5) * 0.12,
                vz: (Math.random() - 0.5) * 0.12,
                radius: radius,
                isHighlight: isHighlight
            });

            // Pure monochrome star node shades
            const val = isDark 
                ? (isHighlight ? 1.0 : 0.82) 
                : (isHighlight ? 0.12 : 0.38);
            mainNodeColors[i * 3] = val;
            mainNodeColors[i * 3 + 1] = val;
            mainNodeColors[i * 3 + 2] = val;
        }

        mainNodeGeo.setAttribute('position', new THREE.BufferAttribute(mainNodePositions, 3));
        mainNodeGeo.setAttribute('color', new THREE.BufferAttribute(mainNodeColors, 3));

        const mainNodeMat = new THREE.PointsMaterial({
            size: 3.8,
            map: particleTexture,
            transparent: true,
            opacity: isDark ? 0.96 : 0.85,
            vertexColors: true,
            blending: isDark ? THREE.AdditiveBlending : THREE.NormalBlending,
            depthWrite: false
        });
        mainNodesMesh = new THREE.Points(mainNodeGeo, mainNodeMat);
        mainClusterGroup.add(mainNodesMesh);

        // Lines for main cluster
        const maxMainLines = (MAIN_NODE_COUNT * (MAIN_NODE_COUNT - 1)) / 2;
        mainLinePositions = new Float32Array(maxMainLines * 6);
        mainLineColors = new Float32Array(maxMainLines * 6);

        const mainLineGeo = new THREE.BufferGeometry();
        mainLineGeo.setAttribute('position', new THREE.BufferAttribute(mainLinePositions, 3).setUsage(THREE.DynamicDrawUsage));
        mainLineGeo.setAttribute('color', new THREE.BufferAttribute(mainLineColors, 3).setUsage(THREE.DynamicDrawUsage));

        const mainLineMat = new THREE.LineBasicMaterial({
            vertexColors: true,
            transparent: true,
            opacity: isDark ? 0.48 : 0.38,
            blending: isDark ? THREE.AdditiveBlending : THREE.NormalBlending,
            depthWrite: false
        });
        mainLinesMesh = new THREE.LineSegments(mainLineGeo, mainLineMat);
        mainClusterGroup.add(mainLinesMesh);



        // 7. Secondary Deep Background Constellation
        bgClusterGroup = new THREE.Group();
        bgClusterGroup.position.set(isMobile ? 0 : -35, 12, -70);
        scene.add(bgClusterGroup);

        const bgNodeGeo = new THREE.BufferGeometry();
        const bgNodePositions = new Float32Array(BG_NODE_COUNT * 3);
        const bgNodeColors = new Float32Array(BG_NODE_COUNT * 3);

        for (let i = 0; i < BG_NODE_COUNT; i++) {
            const radius = 22 + Math.random() * 20;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos((Math.random() * 2) - 1);

            const x = radius * Math.sin(phi) * Math.cos(theta);
            const y = radius * Math.sin(phi) * Math.sin(theta);
            const z = radius * Math.cos(phi);

            bgNodePositions[i * 3] = x;
            bgNodePositions[i * 3 + 1] = y;
            bgNodePositions[i * 3 + 2] = z;

            bgNodes.push({
                x: x, y: y, z: z,
                vx: (Math.random() - 0.5) * 0.08,
                vy: (Math.random() - 0.5) * 0.08,
                vz: (Math.random() - 0.5) * 0.08,
                radius: radius
            });

            const bgVal = isDark ? 0.6 : 0.35;
            bgNodeColors[i * 3] = bgVal;
            bgNodeColors[i * 3 + 1] = bgVal;
            bgNodeColors[i * 3 + 2] = bgVal;
        }

        bgNodeGeo.setAttribute('position', new THREE.BufferAttribute(bgNodePositions, 3));
        bgNodeGeo.setAttribute('color', new THREE.BufferAttribute(bgNodeColors, 3));

        const bgNodeMat = new THREE.PointsMaterial({
            size: 2.2,
            map: particleTexture,
            transparent: true,
            opacity: isDark ? 0.45 : 0.28,
            vertexColors: true,
            blending: isDark ? THREE.AdditiveBlending : THREE.NormalBlending,
            depthWrite: false
        });
        bgNodesMesh = new THREE.Points(bgNodeGeo, bgNodeMat);
        bgClusterGroup.add(bgNodesMesh);

        const maxBgLines = (BG_NODE_COUNT * (BG_NODE_COUNT - 1)) / 2;
        bgLinePositions = new Float32Array(maxBgLines * 6);
        bgLineColors = new Float32Array(maxBgLines * 6);

        const bgLineGeo = new THREE.BufferGeometry();
        bgLineGeo.setAttribute('position', new THREE.BufferAttribute(bgLinePositions, 3).setUsage(THREE.DynamicDrawUsage));
        bgLineGeo.setAttribute('color', new THREE.BufferAttribute(bgLineColors, 3).setUsage(THREE.DynamicDrawUsage));

        const bgLineMat = new THREE.LineBasicMaterial({
            vertexColors: true,
            transparent: true,
            opacity: isDark ? 0.24 : 0.18,
            blending: isDark ? THREE.AdditiveBlending : THREE.NormalBlending,
            depthWrite: false
        });
        bgLinesMesh = new THREE.LineSegments(bgLineGeo, bgLineMat);
        bgClusterGroup.add(bgLinesMesh);

        // 8. Horizontal Data Strata Streams
        const streamGeo = new THREE.BufferGeometry();
        const streamPositions = new Float32Array(STREAM_COUNT * 3);
        const streamColors = new Float32Array(STREAM_COUNT * 3);

        for (let i = 0; i < STREAM_COUNT; i++) {
            const x = (Math.random() - 0.5) * 350;
            const row = Math.floor(Math.random() * 16) - 8;
            const y = row * 15 + (Math.random() - 0.5) * 6;
            const z = (Math.random() - 0.5) * 180 - 20;

            streamPositions[i * 3] = x;
            streamPositions[i * 3 + 1] = y;
            streamPositions[i * 3 + 2] = z;

            streamNodes.push({
                x: x, y: y, z: z,
                baseY: y,
                speed: 0.08 + Math.random() * 0.24,
                waveFreq: 0.025 + Math.random() * 0.02
            });

            const rnd = Math.random();
            let c;
            if (rnd > 0.8) {
                c = isDark ? 1.0 : 0.15;
            } else if (rnd > 0.35) {
                c = isDark ? 0.68 : 0.42;
            } else {
                c = isDark ? 0.88 : 0.25;
            }
            streamColors[i * 3] = c;
            streamColors[i * 3 + 1] = c;
            streamColors[i * 3 + 2] = c;
        }

        streamGeo.setAttribute('position', new THREE.BufferAttribute(streamPositions, 3));
        streamGeo.setAttribute('color', new THREE.BufferAttribute(streamColors, 3));

        const streamMat = new THREE.PointsMaterial({
            size: 2.2,
            map: particleTexture,
            transparent: true,
            opacity: isDark ? 0.62 : 0.38,
            vertexColors: true,
            blending: isDark ? THREE.AdditiveBlending : THREE.NormalBlending,
            depthWrite: false
        });
        streamMesh = new THREE.Points(streamGeo, streamMat);
        scene.add(streamMesh);

        // 9. Foreground Bokeh Orbs
        const bokehGeo = new THREE.BufferGeometry();
        const bokehPositions = new Float32Array(40 * 3);

        for (let i = 0; i < 40; i++) {
            bokehPositions[i * 3] = (Math.random() - 0.5) * 260;
            bokehPositions[i * 3 + 1] = (Math.random() - 0.5) * 170;
            bokehPositions[i * 3 + 2] = Math.random() * 60 + 35;
        }

        bokehGeo.setAttribute('position', new THREE.BufferAttribute(bokehPositions, 3));
        const bokehMat = new THREE.PointsMaterial({
            size: 15.0,
            map: bokehTexture,
            transparent: true,
            opacity: isDark ? 0.25 : 0.14,
            color: isDark ? 0xffffff : 0x333333,
            blending: isDark ? THREE.AdditiveBlending : THREE.NormalBlending,
            depthWrite: false
        });
        bokehMesh = new THREE.Points(bokehGeo, bokehMat);
        scene.add(bokehMesh);

        // 10. Event listeners
        window.addEventListener("resize", onWindowResize);
        document.addEventListener("mousemove", onDocumentMouseMove);
        document.addEventListener("keydown", onDocumentKeyDown);

        if (enterBtn) {
            enterBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                enterApp();
            });
        }
        if (launchDirectBtn) {
            launchDirectBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                enterApp();
            });
        }

        // Start render loop
        animate();
    }

    function onWindowResize() {
        if (!renderer || !camera) return;
        windowHalfX = window.innerWidth / 2;
        windowHalfY = window.innerHeight / 2;
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);

        const isMobile = window.innerWidth < 900;
        if (mainClusterGroup) {
            mainClusterGroup.position.x = isMobile ? 0 : 40;
        }
        if (bgClusterGroup) {
            bgClusterGroup.position.x = isMobile ? 0 : -35;
        }
    }

    function onDocumentMouseMove(event) {
        windowHalfX = window.innerWidth / 2;
        windowHalfY = window.innerHeight / 2;
        mouseX = (event.clientX - windowHalfX) * 0.001;
        mouseY = (event.clientY - windowHalfY) * 0.001;

        mouse3DX = ((event.clientX / window.innerWidth) * 2 - 1) * 70 - (mainClusterGroup ? mainClusterGroup.position.x : 0);
        mouse3DY = -((event.clientY / window.innerHeight) * 2 - 1) * 50;
    }

    function onDocumentKeyDown(event) {
        if (!isAppActive && (event.key === "Enter" || event.key === " ")) {
            event.preventDefault();
            enterApp();
        }
    }

    function updateTheme(theme) {
        if (!scene || !renderer) return;
        const isDark = theme !== "light";
        scene.fog.color.setHex(isDark ? 0x080808 : 0xfafafa);
        renderer.setClearColor(isDark ? 0x080808 : 0xfafafa, 1);

        const blending = isDark ? THREE.AdditiveBlending : THREE.NormalBlending;

        if (mainNodesMesh) {
            mainNodesMesh.material.opacity = isDark ? 0.96 : 0.85;
            mainNodesMesh.material.blending = blending;
            const colors = mainNodesMesh.geometry.attributes.color.array;
            for (let i = 0; i < MAIN_NODE_COUNT; i++) {
                const node = mainNodes[i];
                const val = isDark 
                    ? (node.isHighlight ? 1.0 : 0.82) 
                    : (node.isHighlight ? 0.12 : 0.38);
                colors[i * 3] = val;
                colors[i * 3 + 1] = val;
                colors[i * 3 + 2] = val;
            }
            mainNodesMesh.geometry.attributes.color.needsUpdate = true;
        }
        if (mainLinesMesh) {
            mainLinesMesh.material.opacity = isDark ? 0.48 : 0.38;
            mainLinesMesh.material.blending = blending;
        }
        if (bgNodesMesh) {
            bgNodesMesh.material.opacity = isDark ? 0.45 : 0.28;
            bgNodesMesh.material.blending = blending;
            const colors = bgNodesMesh.geometry.attributes.color.array;
            const bgVal = isDark ? 0.6 : 0.35;
            for (let i = 0; i < BG_NODE_COUNT; i++) {
                colors[i * 3] = bgVal;
                colors[i * 3 + 1] = bgVal;
                colors[i * 3 + 2] = bgVal;
            }
            bgNodesMesh.geometry.attributes.color.needsUpdate = true;
        }
        if (bgLinesMesh) {
            bgLinesMesh.material.opacity = isDark ? 0.24 : 0.18;
            bgLinesMesh.material.blending = blending;
        }
        if (streamMesh) {
            streamMesh.material.opacity = isDark ? 0.62 : 0.38;
            streamMesh.material.blending = blending;
            const colors = streamMesh.geometry.attributes.color.array;
            for (let i = 0; i < STREAM_COUNT; i++) {
                const c = isDark ? 0.85 : 0.3;
                colors[i * 3] = c;
                colors[i * 3 + 1] = c;
                colors[i * 3 + 2] = c;
            }
            streamMesh.geometry.attributes.color.needsUpdate = true;
        }
        if (bokehMesh) {
            bokehMesh.material.opacity = isDark ? 0.25 : 0.14;
            bokehMesh.material.color.setHex(isDark ? 0xffffff : 0x333333);
            bokehMesh.material.blending = blending;
        }
    }

    let warpProgress = 0;

    function animate() {
        if (isAppActive) return;
        animationFrameId = requestAnimationFrame(animate);

        const delta = clock.getDelta();
        const time = clock.getElapsedTime();
        const isDark = document.documentElement.getAttribute("data-theme") !== "light";

        // Parallax inertia
        targetRotationY = mouseX * 0.75;
        targetRotationX = mouseY * 0.55;
        currentRotationX += (targetRotationX - currentRotationX) * 0.05;
        currentRotationY += (targetRotationY - currentRotationY) * 0.05;

        // 1. Animate Main Constellation Cluster
        if (mainClusterGroup) {
            mainClusterGroup.rotation.y = time * 0.055 + currentRotationY;
            mainClusterGroup.rotation.x = currentRotationX * 0.55;
            mainClusterGroup.position.y = Math.sin(time * 0.55) * 2.8;

            const posAttr = mainNodesMesh.geometry.attributes.position;
            let lineIdx = 0;

            for (let i = 0; i < MAIN_NODE_COUNT; i++) {
                const node = mainNodes[i];

                node.x += node.vx;
                node.y += node.vy;
                node.z += node.vz;

                // Interactive Cursor Magnetic Repulsion
                const distToMouse = Math.hypot(node.x - mouse3DX, node.y - mouse3DY);
                if (distToMouse < 28) {
                    const force = (1 - distToMouse / 28) * 0.45;
                    node.x += (node.x - mouse3DX) * force;
                    node.y += (node.y - mouse3DY) * force;
                }

                // Elastic boundary return
                const currentDist = Math.sqrt(node.x * node.x + node.y * node.y + node.z * node.z);
                if (currentDist > node.radius * 1.35) {
                    node.vx *= -0.92;
                    node.vy *= -0.92;
                    node.vz *= -0.92;
                }

                posAttr.setXYZ(i, node.x, node.y, node.z);

                // Compute filaments with fast early rejection bounding-box
                for (let j = i + 1; j < MAIN_NODE_COUNT; j++) {
                    const other = mainNodes[j];
                    const dx = node.x - other.x;
                    if (dx > MAIN_MAX_DIST || dx < -MAIN_MAX_DIST) continue;
                    const dy = node.y - other.y;
                    if (dy > MAIN_MAX_DIST || dy < -MAIN_MAX_DIST) continue;
                    const dz = node.z - other.z;
                    if (dz > MAIN_MAX_DIST || dz < -MAIN_MAX_DIST) continue;

                    const distSq = dx * dx + dy * dy + dz * dz;
                    if (distSq < MAIN_MAX_DIST_SQ) {
                        const dist = Math.sqrt(distSq);
                        const alpha = 1 - (dist / MAIN_MAX_DIST);

                        mainLinePositions[lineIdx * 3] = node.x;
                        mainLinePositions[lineIdx * 3 + 1] = node.y;
                        mainLinePositions[lineIdx * 3 + 2] = node.z;

                        mainLinePositions[(lineIdx + 1) * 3] = other.x;
                        mainLinePositions[(lineIdx + 1) * 3 + 1] = other.y;
                        mainLinePositions[(lineIdx + 1) * 3 + 2] = other.z;

                        const isHighlightLine = node.isHighlight || other.isHighlight;
                        const val = isDark 
                            ? (isHighlightLine ? 0.92 : 0.52) * alpha
                            : (isHighlightLine ? 0.18 : 0.45) * alpha;

                        mainLineColors[lineIdx * 3] = val;
                        mainLineColors[lineIdx * 3 + 1] = val;
                        mainLineColors[lineIdx * 3 + 2] = val;

                        mainLineColors[(lineIdx + 1) * 3] = val;
                        mainLineColors[(lineIdx + 1) * 3 + 1] = val;
                        mainLineColors[(lineIdx + 1) * 3 + 2] = val;

                        lineIdx += 2;
                    }
                }
            }

            posAttr.needsUpdate = true;
            mainLinesMesh.geometry.setDrawRange(0, lineIdx);
            mainLinesMesh.geometry.attributes.position.needsUpdate = true;
            mainLinesMesh.geometry.attributes.color.needsUpdate = true;
        }



        // 4. Animate Secondary Background Cluster
        if (bgClusterGroup) {
            bgClusterGroup.rotation.y = -time * 0.035 - currentRotationY * 0.5;
            bgClusterGroup.rotation.x = currentRotationX * 0.3;

            const bgPosAttr = bgNodesMesh.geometry.attributes.position;
            let bgLineIdx = 0;

            for (let i = 0; i < BG_NODE_COUNT; i++) {
                const node = bgNodes[i];
                node.x += node.vx;
                node.y += node.vy;
                node.z += node.vz;

                const currentDist = Math.sqrt(node.x * node.x + node.y * node.y + node.z * node.z);
                if (currentDist > node.radius * 1.3) {
                    node.vx *= -0.95;
                    node.vy *= -0.95;
                    node.vz *= -0.95;
                }

                bgPosAttr.setXYZ(i, node.x, node.y, node.z);

                for (let j = i + 1; j < BG_NODE_COUNT; j++) {
                    const other = bgNodes[j];
                    const dx = node.x - other.x;
                    if (dx > BG_MAX_DIST || dx < -BG_MAX_DIST) continue;
                    const dy = node.y - other.y;
                    if (dy > BG_MAX_DIST || dy < -MAIN_MAX_DIST) continue;
                    const dz = node.z - other.z;
                    if (dz > BG_MAX_DIST || dz < -BG_MAX_DIST) continue;

                    const distSq = dx * dx + dy * dy + dz * dz;
                    if (distSq < BG_MAX_DIST_SQ) {
                        const dist = Math.sqrt(distSq);
                        const alpha = (1 - dist / BG_MAX_DIST) * 0.65;

                        bgLinePositions[bgLineIdx * 3] = node.x;
                        bgLinePositions[bgLineIdx * 3 + 1] = node.y;
                        bgLinePositions[bgLineIdx * 3 + 2] = node.z;

                        bgLinePositions[(bgLineIdx + 1) * 3] = other.x;
                        bgLinePositions[(bgLineIdx + 1) * 3 + 1] = other.y;
                        bgLinePositions[(bgLineIdx + 1) * 3 + 2] = other.z;

                        const val = isDark ? 0.32 * alpha : 0.22 * alpha;
                        bgLineColors[bgLineIdx * 3] = val;
                        bgLineColors[bgLineIdx * 3 + 1] = val;
                        bgLineColors[bgLineIdx * 3 + 2] = val;

                        bgLineColors[(bgLineIdx + 1) * 3] = val;
                        bgLineColors[(bgLineIdx + 1) * 3 + 1] = val;
                        bgLineColors[(bgLineIdx + 1) * 3 + 2] = val;

                        bgLineIdx += 2;
                    }
                }
            }

            bgPosAttr.needsUpdate = true;
            bgLinesMesh.geometry.setDrawRange(0, bgLineIdx);
            bgLinesMesh.geometry.attributes.position.needsUpdate = true;
            bgLinesMesh.geometry.attributes.color.needsUpdate = true;
        }

        // 5. Horizontal Streams Undulating Waves
        if (streamMesh) {
            const streamPosAttr = streamMesh.geometry.attributes.position;
            for (let i = 0; i < STREAM_COUNT; i++) {
                const sn = streamNodes[i];
                sn.x += sn.speed * 0.35;
                if (sn.x > 175) sn.x = -175;

                const waveY = sn.baseY + Math.sin(time * 0.9 + sn.x * sn.waveFreq) * 2.5;
                streamPosAttr.setXYZ(i, sn.x, waveY, sn.z);
            }
            streamPosAttr.needsUpdate = true;
        }

        // 6. Foreground Bokeh Orbs
        if (bokehMesh) {
            bokehMesh.rotation.y = time * 0.012;
            bokehMesh.rotation.x = currentRotationX * 0.25;
        }

        // 7. Camera Parallax Response
        camera.position.x += ((mouseX * 24) - camera.position.x) * 0.038;
        camera.position.y += ((-mouseY * 20) - camera.position.y) * 0.038;
        camera.lookAt(0, 0, 0);

        // 8. Cinematic Warp Sequence on Launch
        if (isWarping) {
            warpProgress += delta * 2.3;
            camera.position.z -= Math.pow(warpProgress * 8, 2);
            if (mainClusterGroup) {
                mainClusterGroup.scale.multiplyScalar(1.025);
            }
            if (camera.position.z <= 12) {
                completeTransition();
            }
        }

        renderer.render(scene, camera);
    }

    function enterApp() {
        if (isWarping || isAppActive) return;
        isWarping = true;
        warpProgress = 0;

        landingContainer.classList.add("landing-warping");
        if (heroCard) {
            heroCard.style.pointerEvents = "none";
        }

        setTimeout(() => {
            completeTransition();
        }, 650);
    }

    function completeTransition() {
        isWarping = false;
        isAppActive = true;

        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }

        landingContainer.classList.add("landing-hidden");
        if (mainContainer) {
            mainContainer.classList.add("workspace-active");
        }
    }

    function exitToLanding() {
        isAppActive = false;
        isWarping = false;

        camera.position.set(0, 0, 125);
        if (mainClusterGroup) {
            mainClusterGroup.scale.set(1, 1, 1);
        }

        landingContainer.classList.remove("landing-hidden", "landing-warping");
        if (mainContainer) {
            mainContainer.classList.remove("workspace-active");
        }

        if (heroCard) {
            heroCard.style.pointerEvents = "auto";
        }

        if (!animationFrameId) {
            clock.start();
            animate();
        }
    }

    document.addEventListener("visibilitychange", () => {
        if (document.hidden) {
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
                animationFrameId = null;
            }
        } else if (!isAppActive && !animationFrameId) {
            clock.start();
            animate();
        }
    });

    window.StudyMate3D = {
        enter: enterApp,
        exit: exitToLanding,
        updateTheme: updateTheme
    };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initThree);
    } else {
        initThree();
    }
})();
