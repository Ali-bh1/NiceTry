/* eslint-disable react/no-unknown-property */
import * as THREE from 'three';
import { useRef, useState, useEffect, memo } from 'react';
import { Canvas, createPortal, useFrame, useThree } from '@react-three/fiber';
import {
  useFBO,
  useGLTF,
  MeshTransmissionMaterial,
  Text,
  Preload,
} from '@react-three/drei';
import { easing } from 'maath';

/**
 * FluidGlass — Three.js glass lens effect that follows the cursor.
 *
 * Uses MeshTransmissionMaterial over an FBO scene containing styled 3D text.
 * The glass lens refracts/distorts the text content behind it with chromatic
 * aberration and IOR effects.
 *
 * The canvas background matches the landing page dark color (#0d0b0f).
 *
 * Supports "lens", "bar", and "cube" modes via GLB model geometry.
 *
 * @see https://www.reactbits.dev/components/fluid-glass
 */
export default function FluidGlass({
  mode = 'lens',
  lensProps = {},
  barProps = {},
  cubeProps = {},
}) {
  return (
    <div className="fluid-glass-canvas-wrap">
      <Canvas
        camera={{ position: [0, 0, 20], fov: 15 }}
        gl={{ alpha: true, antialias: true }}
        style={{ pointerEvents: 'auto' }}
      >
        <LensScene
          mode={mode}
          lensProps={lensProps}
          barProps={barProps}
          cubeProps={cubeProps}
        />
        <Preload />
      </Canvas>
    </div>
  );
}

/**
 * Inner scene — separated so Canvas context is available.
 */
function LensScene({ mode, lensProps, barProps, cubeProps }) {
  const Wrapper = mode === 'bar' ? Bar : mode === 'cube' ? CubeMode : Lens;
  const rawOverrides = mode === 'bar' ? barProps : mode === 'cube' ? cubeProps : lensProps;

  const { navItems, ...modeProps } = {
    navItems: [],
    ...rawOverrides,
  };

  return (
    <Wrapper modeProps={modeProps}>
      {/* Content rendered inside the FBO — refracted by the glass */}
      <HeroContent />
    </Wrapper>
  );
}

/**
 * ModeWrapper — core glass mesh logic from ReactBits.
 *
 * Loads a GLB model, renders children into an off-screen FBO,
 * then displays both the background plane (FBO texture) and
 * the glass mesh with MeshTransmissionMaterial that refracts it.
 */
const ModeWrapper = memo(function ModeWrapper({
  children,
  glb,
  geometryKey,
  lockToBottom = false,
  followPointer = true,
  modeProps = {},
  ...props
}) {
  const ref = useRef();
  const { nodes } = useGLTF(glb);
  const buffer = useFBO();
  const { viewport: vp } = useThree();
  const [scene] = useState(() => new THREE.Scene());
  const geoWidthRef = useRef(1);

  useEffect(() => {
    const geo = nodes[geometryKey]?.geometry;
    if (!geo) return;
    geo.computeBoundingBox();
    geoWidthRef.current = geo.boundingBox.max.x - geo.boundingBox.min.x || 1;
  }, [nodes, geometryKey]);

  useFrame((state, delta) => {
    const { gl, viewport, pointer, camera } = state;
    const v = viewport.getCurrentViewport(camera, [0, 0, 15]);

    const destX = followPointer ? (pointer.x * v.width) / 2 : 0;
    const destY = lockToBottom
      ? -v.height / 2 + 0.2
      : followPointer
        ? (pointer.y * v.height) / 2
        : 0;
    easing.damp3(ref.current.position, [destX, destY, 15], 0.15, delta);

    if (modeProps.scale == null) {
      const maxWorld = v.width * 0.9;
      const desired = maxWorld / geoWidthRef.current;
      ref.current.scale.setScalar(Math.min(0.15, desired));
    }

    gl.setRenderTarget(buffer);
    gl.setClearColor(0x0a0a0a, 0.7);
    gl.render(scene, camera);
    gl.setRenderTarget(null);

    /* Main canvas transparent so RippleGrid shows through */
    gl.setClearColor(0x000000, 0);
  });

  const { scale, ior, thickness, anisotropy, chromaticAberration, ...extraMat } = modeProps;

  return (
    <>
      {createPortal(children, scene)}
      <mesh scale={[vp.width, vp.height, 1]}>
        <planeGeometry />
        <meshBasicMaterial map={buffer.texture} transparent opacity={0.78} />
      </mesh>
      <mesh
        ref={ref}
        scale={scale ?? 0.25}
        rotation-x={Math.PI / 2}
        geometry={nodes[geometryKey]?.geometry}
        {...props}
      >
        <MeshTransmissionMaterial
          buffer={buffer.texture}
          ior={ior ?? 1.15}
          thickness={thickness ?? 2}
          anisotropy={anisotropy ?? 0.01}
          chromaticAberration={chromaticAberration ?? 0.05}
          {...extraMat}
        />
      </mesh>
    </>
  );
});

/* ═══════════════════════════════════════════════════
   MODE WRAPPERS
   ═══════════════════════════════════════════════════ */

function Lens({ modeProps, ...p }) {
  return (
    <ModeWrapper
      glb="/assets/3d/lens.glb"
      geometryKey="Cylinder"
      followPointer
      modeProps={modeProps}
      {...p}
    />
  );
}

function CubeMode({ modeProps, ...p }) {
  return (
    <ModeWrapper
      glb="/assets/3d/cube.glb"
      geometryKey="Cube"
      followPointer
      modeProps={modeProps}
      {...p}
    />
  );
}

function Bar({ modeProps = {}, ...p }) {
  const defaultMat = {
    transmission: 1,
    roughness: 0,
    thickness: 10,
    ior: 1.15,
    color: '#ffffff',
    attenuationColor: '#ffffff',
    attenuationDistance: 0.25,
  };

  return (
    <ModeWrapper
      glb="/assets/3d/bar.glb"
      geometryKey="Cube"
      lockToBottom
      followPointer={false}
      modeProps={{ ...defaultMat, ...modeProps }}
      {...p}
    />
  );
}

/* ═══════════════════════════════════════════════════
   HERO CONTENT — rendered inside the 3D FBO scene
   Styled to match NiceTry landing page branding
   ═══════════════════════════════════════════════════ */

function HeroContent() {
  const [device, setDevice] = useState(getDevice());

  useEffect(() => {
    const onResize = () => setDevice(getDevice());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const isM = device === 'mobile';
  const isT = device === 'tablet';
  const titleSize = isM ? 0.1 : isT ? 0.16 : 0.22;
  const subSize = titleSize * 0.45;
  const tagSize = titleSize * 0.28;

  return (
    <group>
      {/* Tagline */}
      <Text
        position={[0, 0.55, 12]}
        fontSize={tagSize}
        letterSpacing={0.15}
        color="#888888"
        anchorX="center"
        anchorY="middle"
      >
        7-LAYER DETECTION · 97% ACCURACY
      </Text>

      {/* Main title lines */}
      <Text
        position={[0, 0.32, 12]}
        fontSize={titleSize}
        letterSpacing={0.06}
        color="#f0f0f0"
        anchorX="center"
        anchorY="middle"
        font="/fonts/Orbitron-Bold.ttf"
      >
        THE LAST LINE
      </Text>

      <Text
        position={[0, 0.07, 12]}
        fontSize={titleSize}
        letterSpacing={0.06}
        color="#f0f0f0"
        anchorX="center"
        anchorY="middle"
        font="/fonts/Orbitron-Bold.ttf"
      >
        BETWEEN YOU AND
      </Text>

      <Text
        position={[0, -0.18, 12]}
        fontSize={titleSize}
        letterSpacing={0.06}
        color="#ff5500"
        anchorX="center"
        anchorY="middle"
        font="/fonts/Orbitron-Bold.ttf"
        fontStyle="italic"
      >
        THE THREAT.
      </Text>

      {/* Subtitle */}
      <Text
        position={[0, -0.48, 12]}
        fontSize={subSize}
        letterSpacing={0.02}
        color="#888888"
        anchorX="center"
        anchorY="middle"
        maxWidth={3}
        textAlign="center"
      >
        {`NiceTry doesn't just flag URLs — it investigates them.\nMulti-layer threat analysis in real time.`}
      </Text>
    </group>
  );
}

function getDevice() {
  const w = typeof window !== 'undefined' ? window.innerWidth : 1024;
  return w <= 639 ? 'mobile' : w <= 1023 ? 'tablet' : 'desktop';
}
