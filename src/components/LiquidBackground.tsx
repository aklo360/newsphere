"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform float uTime;
  uniform vec2 uMouse;
  uniform vec2 uResolution;
  varying vec2 vUv;

  // Simplex noise
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

  float snoise(vec3 v) {
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod289(i);
    vec4 p = permute(permute(permute(
      i.z + vec4(0.0, i1.z, i2.z, 1.0))
      + i.y + vec4(0.0, i1.y, i2.y, 1.0))
      + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }

  // Soft metaball/blob function
  float blob(vec2 uv, vec2 pos, float size) {
    float d = length(uv - pos);
    return smoothstep(size, size * 0.1, d);
  }

  void main() {
    vec2 uv = vUv;
    float aspect = uResolution.x / uResolution.y;
    vec2 uvAspect = vec2(uv.x * aspect, uv.y);
    
    // Mouse position with aspect correction
    vec2 mouse = uMouse * 0.5 + 0.5;
    mouse.x *= aspect;
    
    float time = uTime * 0.12;
    
    // Animated blob positions
    vec2 blob1Pos = vec2(
      0.3 * aspect + sin(time * 0.7) * 0.15 * aspect,
      0.4 + cos(time * 0.5) * 0.15
    );
    vec2 blob2Pos = vec2(
      0.7 * aspect + cos(time * 0.6) * 0.12 * aspect,
      0.6 + sin(time * 0.8) * 0.12
    );
    vec2 blob3Pos = vec2(
      0.5 * aspect + sin(time * 0.4 + 1.0) * 0.18 * aspect,
      0.3 + cos(time * 0.6 + 2.0) * 0.14
    );
    vec2 blob4Pos = vec2(
      0.6 * aspect + cos(time * 0.5 + 3.0) * 0.14 * aspect,
      0.7 + sin(time * 0.7 + 1.5) * 0.1
    );
    
    // Mouse interaction - blobs are attracted/repelled
    float mouseDist1 = length(blob1Pos - mouse);
    float mouseDist2 = length(blob2Pos - mouse);
    float mouseInfluence = smoothstep(0.4, 0.0, length(uvAspect - mouse)) * 0.08;
    
    // Create soft blobs
    float b1 = blob(uvAspect, blob1Pos, 0.35);
    float b2 = blob(uvAspect, blob2Pos, 0.28);
    float b3 = blob(uvAspect, blob3Pos, 0.32);
    float b4 = blob(uvAspect, blob4Pos, 0.25);
    
    // Mouse-following blob
    vec2 mouseBlob = mouse + vec2(
      sin(time * 2.0) * 0.02,
      cos(time * 2.0) * 0.02
    );
    float bMouse = blob(uvAspect, mouseBlob, 0.2) * 0.5;
    
    // Combine blobs with metaball-like blending
    float blobs = b1 * 0.6 + b2 * 0.5 + b3 * 0.55 + b4 * 0.45 + bMouse;
    blobs = smoothstep(0.2, 0.8, blobs);
    
    // Add noise for organic movement
    float noise = snoise(vec3(uv * 2.0, time * 0.5)) * 0.15;
    blobs += noise * blobs;
    
    // Base color - clean off-white
    vec3 bgColor = vec3(0.97, 0.97, 0.98);
    
    // Blob color - more visible grey
    vec3 blobColor = vec3(0.82, 0.84, 0.88);
    
    // Add subtle inner glow to blobs
    float glow = pow(blobs, 1.5) * 0.4;
    vec3 glowColor = vec3(0.88, 0.90, 0.94);
    
    // Mix colors - stronger blend
    vec3 color = mix(bgColor, blobColor, blobs * 0.85);
    color = mix(color, glowColor, glow);
    
    // Add mouse highlight
    color += vec3(mouseInfluence * 0.8);
    
    gl_FragColor = vec4(color, 1.0);
  }
`;

function LiquidPlane() {
  const meshRef = useRef<THREE.Mesh>(null);
  const { viewport, pointer, size } = useThree();

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uResolution: { value: new THREE.Vector2(1, 1) },
    }),
    []
  );

  useFrame((state) => {
    if (meshRef.current) {
      const material = meshRef.current.material as THREE.ShaderMaterial;
      material.uniforms.uTime.value = state.clock.elapsedTime;
      material.uniforms.uMouse.value.lerp(
        new THREE.Vector2(pointer.x, pointer.y),
        0.05
      );
      material.uniforms.uResolution.value.set(size.width, size.height);
    }
  });

  return (
    <mesh ref={meshRef} scale={[viewport.width, viewport.height, 1]}>
      <planeGeometry args={[1, 1, 1, 1]} />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
      />
    </mesh>
  );
}

export default function LiquidBackground() {
  return (
    <div className="fixed inset-0 -z-10">
      <Canvas camera={{ position: [0, 0, 1] }}>
        <LiquidPlane />
      </Canvas>
    </div>
  );
}
