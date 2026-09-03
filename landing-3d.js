/**
 * StudyMate AI — 3D Front Page & Cinematic Gateway
 * Featuring:
 * 1. Vertices that morph into Study Icons & Badges (Calculus, Neural Nets, Quantum, Circuits, PDF Notes)
 * 2. Floating Holographic Engineering Image Panels (AI, Physics, Circuit boards)
 * 3. FPlus-inspired 3D Neural Constellation Web & Undulating Data Streams
 */

(function () {
    let scene, camera, renderer;
    let mainClusterGroup, bgClusterGroup, cardsGroup, studyBadgesGroup;
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

    // Constellation Config
    const MAIN_NODE_COUNT = 210;
    const MAIN_MAX_DIST = 32;
    const mainNodes = [];
    let mainLinePositions, mainLineColors;

    // Background cluster config
    const BG_NODE_COUNT = 70;
    const BG_MAX_DIST = 38;
    const bgNodes = [];
    let bgLinePositions, bgLineColors;

    // Stream config
    const STREAM_COUNT = 1000;
    const streamNodes = [];

    // Study concepts for morphing vertices
    const STUDY_CONCEPTS = [
        { icon: "🧠", title: "NEURAL NETWORKS", tag: "AI Model" },
        { icon: "📐", title: "CALCULUS ∫dx", tag: "Math" },
        { icon: "⚛️", title: "QUANTUM LOGIC", tag: "Physics" },
        { icon: "⚡", title: "CIRCUIT DESIGN", tag: "Electronics" },
        { icon: "📚", title: "PDF KNOWLEDGE", tag: "Semantic Note" },
        { icon: "🎓", title: "ACTIVE RECALL", tag: "Exam Arena" },
        { icon: "📊", title: "ALGORITHMS", tag: "Data Struct" },
        { icon: "🧪", title: "THERMODYNAMICS", tag: "Engineering" }
    ];
    const studyBadgeSprites = [];

    // Floating Holographic Image Cards config (Anchored in right-hand 3D field)
    const IMAGE_CARDS_DATA = [
        {
            url: "assests/card_neural.jpg",
            title: "NEURAL ARCHITECTURE",
            desc: "Deep Matrix Multipliers & Backpropagation",
            pos: { x: 40, y: 16, z: 15 },
            rot: { x: -0.06, y: -0.22, z: 0.03 },
            size: { w: 25, h: 18.75 }
        },
        {
            url: "assests/card_math.jpg",
            title: "SCHRÖDINGER CALCULUS",
            desc: "Quantum Wave Probability Manifolds",
            pos: { x: 58, y: -8, z: -5 },
            rot: { x: 0.08, y: -0.32, z: -0.04 },
            size: { w: 24, h: 18 }
        },
        {
            url: "assests/card_circuit.jpg",
            title: "QUANTUM CORE AX-1",
            desc: "Signal Integrity & Microchip Pinouts",
            pos: { x: 34, y: -22, z: 18 },
            rot: { x: 0.12, y: 0.10, z: -0.04 },
            size: { w: 23, h: 17.25 }
        }
    ];
    const floatingCardMeshes = [];

    const landingContainer = document.getElementById("landingPage");
    const canvas = document.getElementById("threeCanvas");
    const enterBtn = document.getElementById("enterAppBtn");
    const launchDirectBtn = document.getElementById("launchDirectBtn");
    const heroCard = document.querySelector(".landing-hero");
    const mainContainer = document.querySelector(".container");

    // Helper: Create soft radial glow particle
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
            gradient.addColorStop(0.25, 'rgba(120, 210, 255, 0.5)');
            gradient.addColorStop(0.65, 'rgba(60, 160, 240, 0.12)');
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        } else {
            gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
            gradient.addColorStop(0.2, 'rgba(235, 248, 255, 0.92)');
            gradient.addColorStop(0.5, 'rgba(110, 205, 255, 0.42)');
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        }

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, size, size);
        return new THREE.CanvasTexture(c);
    }

    // Helper: Create dynamic 2D study concept billboard badge
    function createStudyBadgeTexture(concept) {
        const c = document.createElement('canvas');
        c.width = 380;
        c.height = 110;
        const ctx = c.getContext('2d');

        // Draw rounded translucent glass pill
        ctx.fillStyle = 'rgba(6, 17, 28, 0.88)';
        ctx.strokeStyle = 'rgba(112, 214, 255, 0.65)';
        ctx.lineWidth = 3;

        const r = 24;
        const x = 5, y = 5, w = c.width - 10, h = c.height - 10;
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Accent glow bar
        ctx.fillStyle = '#ffbe0b';
        ctx.beginPath();
        ctx.arc(x + 28, y + h / 2, 7, 0, Math.PI * 2);
        ctx.fill();

        // Icon
        ctx.font = '36px "Outfit", sans-serif';
        ctx.fillText(concept.icon, x + 48, y + 60);

        // Title
        ctx.fillStyle = '#f0f9ff';
        ctx.font = 'bold 24px "Outfit", sans-serif';
        ctx.fillText(concept.title, x + 98, y + 48);

        // Tag
        ctx.fillStyle = '#67e8f9';
        ctx.font = '15px "JetBrains Mono", monospace';
        ctx.fillText(concept.tag.toUpperCase(), x + 100, y + 74);

        const tex = new THREE.CanvasTexture(c);
        tex.minFilter = THREE.LinearFilter;
        return tex;
    }

    function initThree() {
        if (!canvas || !landingContainer) return;
        clock = new THREE.Clock();

        const isDark = document.documentElement.getAttribute("data-theme") !== "light";

        // 1. Scene setup with rich atmosphere
        scene = new THREE.Scene();
        scene.fog = new THREE.FogExp2(isDark ? 0x040b13 : 0xeaf2f8, 0.0018);

        // 2. Camera setup
        camera = new THREE.PerspectiveCamera(48, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.set(0, 0, 125);

        // 3. Renderer setup
        renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            antialias: true,
            alpha: true,
            powerPreference: "high-performance"
        });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setClearColor(isDark ? 0x040b13 : 0xeaf2f8, 1);

        particleTexture = createGlowSprite(false);
        bokehTexture = createGlowSprite(true);

        const isMobile = window.innerWidth < 900;

        // 4. Main 3D Neural Constellation Cluster
        mainClusterGroup = new THREE.Group();
        mainClusterGroup.position.set(isMobile ? 0 : 36, 0, 0);
        scene.add(mainClusterGroup);

        studyBadgesGroup = new THREE.Group();
        mainClusterGroup.add(studyBadgesGroup);

        cardsGroup = new THREE.Group();
        mainClusterGroup.add(cardsGroup);

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

            const isGold = Math.random() > 0.85;
            mainNodes.push({
                x: x, y: y, z: z,
                vx: (Math.random() - 0.5) * 0.12,
                vy: (Math.random() - 0.5) * 0.12,
                vz: (Math.random() - 0.5) * 0.12,
                radius: radius,
                isGold: isGold,
                badgeIndex: -1
            });

            if (isGold) {
                mainNodeColors[i * 3] = 1.0;
                mainNodeColors[i * 3 + 1] = 0.78;
                mainNodeColors[i * 3 + 2] = 0.25;
            } else {
                mainNodeColors[i * 3] = 0.88;
                mainNodeColors[i * 3 + 1] = 0.96;
                mainNodeColors[i * 3 + 2] = 1.0;
            }
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

        // 5. Create Study Concept Badges on Anchor Vertices
        STUDY_CONCEPTS.forEach((concept, idx) => {
            const anchorNodeIdx = Math.floor((idx + 1) * (MAIN_NODE_COUNT / (STUDY_CONCEPTS.length + 1)));
            mainNodes[anchorNodeIdx].badgeIndex = idx;

            const badgeTex = createStudyBadgeTexture(concept);
            const badgeMat = new THREE.SpriteMaterial({
                map: badgeTex,
                transparent: true,
                opacity: 0.9,
                depthWrite: false,
                blending: isDark ? THREE.AdditiveBlending : THREE.NormalBlending
            });
            const sprite = new THREE.Sprite(badgeMat);
            sprite.scale.set(13, 3.8, 1);
            sprite.position.set(mainNodes[anchorNodeIdx].x, mainNodes[anchorNodeIdx].y + 2.5, mainNodes[anchorNodeIdx].z);
            studyBadgesGroup.add(sprite);

            studyBadgeSprites.push({
                sprite: sprite,
                nodeIdx: anchorNodeIdx,
                baseScale: { w: 13, h: 3.8 },
                phase: idx * 0.7
            });
        });

        // 6. Floating Holographic Engineering Image Cards (Random study image panels)
        const textureLoader = new THREE.TextureLoader();
        IMAGE_CARDS_DATA.forEach((cardData, idx) => {
            textureLoader.load(cardData.url, (loadedTexture) => {
                loadedTexture.generateMipmaps = true;
                loadedTexture.minFilter = THREE.LinearMipmapLinearFilter;

                const cardPlaneGeo = new THREE.PlaneGeometry(cardData.size.w, cardData.size.h);

                // Front image plane
                const cardMat = new THREE.MeshBasicMaterial({
                    map: loadedTexture,
                    transparent: true,
                    opacity: isDark ? 0.88 : 0.78,
                    side: THREE.DoubleSide
                });
                const cardMesh = new THREE.Mesh(cardPlaneGeo, cardMat);
                cardMesh.position.set(cardData.pos.x, cardData.pos.y, cardData.pos.z);
                cardMesh.rotation.set(cardData.rot.x, cardData.rot.y, cardData.rot.z);

                // Wireframe glowing cyan border around the glass card
                const borderGeo = new THREE.EdgesGeometry(cardPlaneGeo);
                const borderMat = new THREE.LineBasicMaterial({
                    color: isDark ? 0x70d6ff : 0x0284c7,
                    transparent: true,
                    opacity: 0.65,
                    blending: isDark ? THREE.AdditiveBlending : THREE.NormalBlending
                });
                const borderLines = new THREE.LineSegments(borderGeo, borderMat);
                cardMesh.add(borderLines);

                // Label tag above the card
                const labelCanvas = document.createElement('canvas');
                labelCanvas.width = 300;
                labelCanvas.height = 60;
                const lCtx = labelCanvas.getContext('2d');
                lCtx.fillStyle = 'rgba(6, 17, 28, 0.85)';
                lCtx.fillRect(0, 0, 300, 60);
                lCtx.strokeStyle = 'rgba(112, 214, 255, 0.5)';
                lCtx.strokeRect(0, 0, 300, 60);
                lCtx.fillStyle = '#67e8f9';
                lCtx.font = 'bold 20px "Outfit", sans-serif';
                lCtx.fillText(cardData.title, 14, 28);
                lCtx.fillStyle = '#94a3b8';
                lCtx.font = '12px "JetBrains Mono", monospace';
                lCtx.fillText(cardData.desc, 14, 48);

                const labelTex = new THREE.CanvasTexture(labelCanvas);
                const labelMat = new THREE.SpriteMaterial({
                    map: labelTex,
                    transparent: true,
                    opacity: 0.95
                });
                const labelSprite = new THREE.Sprite(labelMat);
                labelSprite.scale.set(cardData.size.w * 0.9, 4.5, 1);
                labelSprite.position.set(0, cardData.size.h / 2 + 3.2, 0.2);
                cardMesh.add(labelSprite);

                cardsGroup.add(cardMesh);

                floatingCardMeshes.push({
                    mesh: cardMesh,
                    basePos: { ...cardData.pos },
                    baseRot: { ...cardData.rot },
                    speed: 0.6 + idx * 0.25,
                    phase: idx * 1.5
                });
            });
        });

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

            bgNodeColors[i * 3] = 0.55;
            bgNodeColors[i * 3 + 1] = 0.75;
            bgNodeColors[i * 3 + 2] = 0.95;
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
            if (rnd > 0.88) {
                streamColors[i * 3] = 1.0;
                streamColors[i * 3 + 1] = 0.82;
                streamColors[i * 3 + 2] = 0.35;
            } else if (rnd > 0.35) {
                streamColors[i * 3] = 0.45;
                streamColors[i * 3 + 1] = 0.78;
                streamColors[i * 3 + 2] = 0.98;
            } else {
                streamColors[i * 3] = 0.9;
                streamColors[i * 3 + 1] = 0.95;
                streamColors[i * 3 + 2] = 1.0;
            }
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
            opacity: isDark ? 0.32 : 0.18,
            color: isDark ? 0x90d5ff : 0x2266aa,
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
            mainClusterGroup.position.x = isMobile ? 0 : 36;
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
        scene.fog.color.setHex(isDark ? 0x040b13 : 0xeaf2f8);
        renderer.setClearColor(isDark ? 0x040b13 : 0xeaf2f8, 1);

        const blending = isDark ? THREE.AdditiveBlending : THREE.NormalBlending;

        if (mainNodesMesh) {
            mainNodesMesh.material.opacity = isDark ? 0.96 : 0.85;
            mainNodesMesh.material.blending = blending;
        }
        if (mainLinesMesh) {
            mainLinesMesh.material.opacity = isDark ? 0.48 : 0.38;
            mainLinesMesh.material.blending = blending;
        }
        if (bgNodesMesh) {
            bgNodesMesh.material.opacity = isDark ? 0.45 : 0.28;
            bgNodesMesh.material.blending = blending;
        }
        if (bgLinesMesh) {
            bgLinesMesh.material.opacity = isDark ? 0.24 : 0.18;
            bgLinesMesh.material.blending = blending;
        }
        if (streamMesh) {
            streamMesh.material.opacity = isDark ? 0.62 : 0.38;
            streamMesh.material.blending = blending;
        }
        if (bokehMesh) {
            bokehMesh.material.opacity = isDark ? 0.32 : 0.18;
            bokehMesh.material.color.setHex(isDark ? 0x90d5ff : 0x2266aa);
        }
    }

    let warpProgress = 0;

    function animate() {
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

                // Compute filaments
                for (let j = i + 1; j < MAIN_NODE_COUNT; j++) {
                    const other = mainNodes[j];
                    const dx = node.x - other.x;
                    const dy = node.y - other.y;
                    const dz = node.z - other.z;
                    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

                    if (dist < MAIN_MAX_DIST) {
                        const alpha = 1 - (dist / MAIN_MAX_DIST);

                        mainLinePositions[lineIdx * 3] = node.x;
                        mainLinePositions[lineIdx * 3 + 1] = node.y;
                        mainLinePositions[lineIdx * 3 + 2] = node.z;

                        mainLinePositions[(lineIdx + 1) * 3] = other.x;
                        mainLinePositions[(lineIdx + 1) * 3 + 1] = other.y;
                        mainLinePositions[(lineIdx + 1) * 3 + 2] = other.z;

                        const isGoldLine = node.isGold || other.isGold;
                        const r = isGoldLine ? 0.95 * alpha : (isDark ? 0.42 * alpha : 0.12 * alpha);
                        const g = isGoldLine ? 0.82 * alpha : (isDark ? 0.78 * alpha : 0.28 * alpha);
                        const b = isGoldLine ? 0.45 * alpha : (isDark ? 0.98 * alpha : 0.45 * alpha);

                        mainLineColors[lineIdx * 3] = r;
                        mainLineColors[lineIdx * 3 + 1] = g;
                        mainLineColors[lineIdx * 3 + 2] = b;

                        mainLineColors[(lineIdx + 1) * 3] = r;
                        mainLineColors[(lineIdx + 1) * 3 + 1] = g;
                        mainLineColors[(lineIdx + 1) * 3 + 2] = b;

                        lineIdx += 2;
                    }
                }
            }

            posAttr.needsUpdate = true;
            mainLinesMesh.geometry.setDrawRange(0, lineIdx);
            mainLinesMesh.geometry.attributes.position.needsUpdate = true;
            mainLinesMesh.geometry.attributes.color.needsUpdate = true;
        }

        // 2. Animate Study Concept Badges (Morphing vertices)
        studyBadgeSprites.forEach(item => {
            const node = mainNodes[item.nodeIdx];
            if (node) {
                item.sprite.position.set(node.x, node.y + 2.2, node.z);

                // Gentle breathing pulse
                const pulse = 1 + Math.sin(time * 2.2 + item.phase) * 0.08;
                item.sprite.scale.set(item.baseScale.w * pulse, item.baseScale.h * pulse, 1);
            }
        });

        // 3. Animate Floating Holographic Engineering Cards
        floatingCardMeshes.forEach(item => {
            const m = item.mesh;
            // Float gently with sine wave
            m.position.y = item.basePos.y + Math.sin(time * item.speed + item.phase) * 3.5;
            m.position.x = item.basePos.x + Math.cos(time * item.speed * 0.7 + item.phase) * 2.0;

            // Parallax 3D tilt
            m.rotation.x = item.baseRot.x + currentRotationX * 0.4;
            m.rotation.y = item.baseRot.y + currentRotationY * 0.6;
        });

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
                    const dist = Math.hypot(node.x - other.x, node.y - other.y, node.z - other.z);
                    if (dist < BG_MAX_DIST) {
                        const alpha = (1 - dist / BG_MAX_DIST) * 0.65;

                        bgLinePositions[bgLineIdx * 3] = node.x;
                        bgLinePositions[bgLineIdx * 3 + 1] = node.y;
                        bgLinePositions[bgLineIdx * 3 + 2] = node.z;

                        bgLinePositions[(bgLineIdx + 1) * 3] = other.x;
                        bgLinePositions[(bgLineIdx + 1) * 3 + 1] = other.y;
                        bgLinePositions[(bgLineIdx + 1) * 3 + 2] = other.z;

                        const val = isDark ? 0.35 * alpha : 0.15 * alpha;
                        bgLineColors[bgLineIdx * 3] = val * 0.7;
                        bgLineColors[bgLineIdx * 3 + 1] = val;
                        bgLineColors[bgLineIdx * 3 + 2] = val * 1.3;

                        bgLineColors[(bgLineIdx + 1) * 3] = val * 0.7;
                        bgLineColors[(bgLineIdx + 1) * 3 + 1] = val;
                        bgLineColors[(bgLineIdx + 1) * 3 + 2] = val * 1.3;

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

        landingContainer.classList.add("landing-hidden");
        if (mainContainer) {
            mainContainer.classList.add("workspace-active");
        }

        setTimeout(() => {
            if (isAppActive && animationFrameId) {
                cancelAnimationFrame(animationFrameId);
                animationFrameId = null;
            }
        }, 700);
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
