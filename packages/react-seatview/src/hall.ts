import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { RectAreaLightUniformsLib } from "three/examples/jsm/lights/RectAreaLightUniformsLib.js";
import { buildSeats } from "./seats";
import type { Seat } from "./types";

const SCREEN_Z = 0;
const SCREEN_W = 22;
const SCREEN_H = 10;
const SCREEN_Y = 6.15;

type Fly = {
  fromP: THREE.Vector3;
  ctrlP: THREE.Vector3;
  toP: THREE.Vector3;
  fromL: THREE.Vector3;
  ctrlL: THREE.Vector3;
  toL: THREE.Vector3;
  t: number;
  done?: () => void;
};

type Chair = THREE.Group & { userData: { parts: THREE.Mesh[]; person?: THREE.Object3D; seat: Seat } };

export class Hall {
  readonly seats: Seat[];
  selected: Seat;
  mode: "map" | "flying" | "seat" = "map";
  soundOn = false;

  private readonly canvas: HTMLCanvasElement;
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene: THREE.Scene;
  private readonly camera: THREE.PerspectiveCamera;
  private readonly look = new THREE.Vector3(0, 2.3, SCREEN_Z);
  private readonly video: HTMLVideoElement;
  private readonly texture: THREE.VideoTexture;
  private readonly chairs = new Map<string, Chair>();
  private readonly clock = new THREE.Clock();
  private readonly reduce: boolean;
  private readonly observer: ResizeObserver;
  private fly: Fly | null = null;
  private yaw = 0;
  private pitch = 0;
  private pointerX = 0;
  private pointerY = 0;
  private frame = 0;
  private alive = true;
  private readonly onDown: (event: PointerEvent) => void;
  private readonly onMove: (event: PointerEvent) => void;

  constructor(canvas: HTMLCanvasElement, options: { trailer: string; man: string; woman: string; seat: string }) {
    this.canvas = canvas;
    this.seats = buildSeats();
    this.selected = this.seats.find((seat) => seat.id === "B4") ?? this.seats[0];
    this.reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);
    this.scene.fog = new THREE.Fog(0x000000, 30, 52);
    this.camera = new THREE.PerspectiveCamera(52, 1, 0.08, 100);

    this.scene.add(new THREE.AmbientLight(0x16110f, 0.2));
    RectAreaLightUniformsLib.init();
    const screenGlow = new THREE.RectAreaLight(0xfff4ea, 14, SCREEN_W, SCREEN_H);
    screenGlow.position.set(0, SCREEN_Y, 0.55);
    screenGlow.lookAt(0, 1.6, 18);
    this.scene.add(screenGlow);

    const shell = new THREE.MeshStandardMaterial({ color: 0x070605, roughness: 1 });
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(48, 40), shell);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.02;
    const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(48, 40), new THREE.MeshBasicMaterial({ color: 0x000000 }));
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = 14.5;
    const mask = new THREE.Mesh(new THREE.PlaneGeometry(52, 24), new THREE.MeshBasicMaterial({ color: 0x000000 }));
    mask.position.set(0, 7.2, SCREEN_Z - 0.45);
    const backWall = new THREE.Mesh(new THREE.PlaneGeometry(48, 14), new THREE.MeshBasicMaterial({ color: 0x000000 }));
    backWall.position.set(0, 5, 28);
    this.scene.add(floor, ceiling, mask, backWall);

    this.video = document.createElement("video");
    this.video.loop = true;
    this.video.muted = true;
    this.video.playsInline = true;
    this.video.preload = "auto";
    this.video.setAttribute("playsinline", "");
    this.video.style.cssText = "position:fixed;width:1px;height:1px;opacity:0;pointer-events:none";
    document.body.append(this.video);
    this.setTrailer(options.trailer);
    this.texture = new THREE.VideoTexture(this.video);
    this.texture.colorSpace = THREE.SRGBColorSpace;
    const crop = (16 / 9) / (SCREEN_W / SCREEN_H);
    this.texture.repeat.set(1, crop);
    this.texture.offset.set(0, (1 - crop) / 2);
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(SCREEN_W, SCREEN_H), new THREE.MeshBasicMaterial({ map: this.texture }));
    screen.position.set(0, SCREEN_Y, SCREEN_Z);
    const bezel = new THREE.Mesh(
      new THREE.PlaneGeometry(SCREEN_W + 0.55, SCREEN_H + 0.5),
      new THREE.MeshBasicMaterial({ color: 0x050505 }),
    );
    bezel.position.set(0, SCREEN_Y, SCREEN_Z - 0.06);
    this.scene.add(bezel, screen);

    this.seats.forEach((seat) => {
      const mesh = new THREE.Group() as Chair;
      mesh.position.set(seat.x, seat.y, seat.z);
      mesh.userData.parts = [];
      mesh.userData.seat = seat;
      this.chairs.set(seat.id, mesh);
      this.scene.add(mesh);
    });
    const seatLoader = new GLTFLoader();
    seatLoader.load(new URL(options.seat, window.location.href).href, (gltf) => {
      if (!this.alive) return;
      const template = placeSeat(gltf.scene);
      const meshes: THREE.Mesh[] = [];
      template.traverse((obj) => {
        const mesh = obj as THREE.Mesh;
        if (mesh.isMesh) meshes.push(mesh);
      });
      const source = meshes[0]?.material;
      const base = (Array.isArray(source) ? source[0] : source) as THREE.MeshStandardMaterial | undefined;
      if (base) {
        this.paintMaterials = {
          red: tintSeat(base, 0xffffff),
          rose: tintSeat(base, 0xf0b4bc),
          dim: tintSeat(base, 0x6e6e6e),
          mint: tintSeat(base, 0xb6ffd0, 0x16a34a, 0.35),
        };
      }
      this.seats.forEach((seat) => {
        const group = this.chairs.get(seat.id);
        if (!group) return;
        const clone = template.clone(true);
        const parts: THREE.Mesh[] = [];
        clone.traverse((obj) => {
          const mesh = obj as THREE.Mesh;
          if (mesh.isMesh) parts.push(mesh);
        });
        group.userData.parts = parts;
        group.add(clone);
        this.paint(seat, seat.id === this.selected.id);
      });
    });

    const audience: { man?: THREE.Object3D; woman?: THREE.Object3D } = {};
    const seatAudience = () => {
      const man = audience.man;
      const woman = audience.woman;
      if (!man || !woman) return;
      this.seats.forEach((seat) => {
        const mesh = this.chairs.get(seat.id);
        if (!seat.taken || !mesh || mesh.userData.person) return;
        const source = (seat.r + seat.n) % 2 === 0 ? woman : man;
        const person = source.clone(true);
        const yaw = ((seat.r * 12 + seat.n) % 5 - 2) * 0.04;
        person.rotation.x = Math.PI / 2;
        person.scale.setScalar(0.0084);
        const holder = new THREE.Group();
        holder.rotation.y = Math.PI + yaw;
        holder.position.set(0, 0.02, 0.02);
        holder.add(person);
        mesh.add(holder);
        mesh.userData.person = holder;
      });
    };
    const loader = new GLTFLoader();
    (["man", "woman"] as const).forEach((name) => {
      loader.load(new URL(options[name], window.location.href).href, (gltf) => {
        if (!this.alive) return;
        prepareAudience(gltf.scene);
        audience[name] = gltf.scene;
        seatAudience();
      });
    });

    this.onDown = (event) => {
      if (this.mode !== "seat") return;
      this.canvas.setPointerCapture(event.pointerId);
      this.pointerX = event.clientX;
      this.pointerY = event.clientY;
    };
    this.onMove = (event) => {
      if (this.mode !== "seat" || !this.canvas.hasPointerCapture(event.pointerId)) return;
      this.yaw += (event.clientX - this.pointerX) * 0.0022;
      this.pitch += (event.clientY - this.pointerY) * 0.0014;
      this.yaw = Math.max(-0.45, Math.min(0.45, this.yaw));
      this.pitch = Math.max(-0.2, Math.min(0.22, this.pitch));
      this.pointerX = event.clientX;
      this.pointerY = event.clientY;
    };
    canvas.addEventListener("pointerdown", this.onDown);
    canvas.addEventListener("pointermove", this.onMove);

    this.observer = new ResizeObserver(() => this.resize());
    this.observer.observe(canvas);
    this.resize();
    const start = this.viewOf(this.selected);
    this.camera.position.set(start.eye.x, start.eye.y + 8, start.eye.z + 6);
    this.look.copy(start.target);
    this.tick();
  }

  private paintMaterials?: Record<"red" | "rose" | "dim" | "mint", THREE.Material>;

  private viewOf(seat: Seat) {
    const eye = new THREE.Vector3(seat.x, seat.y + 1.05, seat.z - 0.02);
    const target = new THREE.Vector3(seat.x * 0.42, eye.y + 0.55, SCREEN_Z);
    return { eye, target };
  }

  private paint(seat: Seat, on: boolean) {
    const mesh = this.chairs.get(seat.id);
    if (!mesh || !this.paintMaterials) return;
    const material = on ? this.paintMaterials.mint : seat.taken ? this.paintMaterials.dim : seat.recliner ? this.paintMaterials.rose : this.paintMaterials.red;
    mesh.userData.parts.forEach((part) => {
      part.material = material;
    });
  }

  choose(id: string): Seat | null {
    const next = this.seats.find((seat) => seat.id === id && !seat.taken);
    if (!next || this.mode !== "map") return null;
    this.paint(this.selected, false);
    this.selected = next;
    this.paint(this.selected, true);
    return next;
  }

  setTrailer(url: string) {
    const next = new URL(url, window.location.href).href;
    if (this.video.src !== next) {
      this.video.pause();
      this.video.src = next;
      this.video.load();
    }
  }

  play() {
    this.video.muted = !this.soundOn;
    const pending = this.video.play();
    if (pending) pending.catch(() => {});
  }

  pause() {
    this.video.pause();
  }

  setSound(on: boolean) {
    this.soundOn = on;
    this.play();
  }

  enter(done?: () => void) {
    if (this.mode !== "map") return;
    this.mode = "flying";
    const path = this.flight(this.selected);
    this.camera.position.copy(path.overhead);
    this.look.copy(path.overheadLook);
    this.yaw = 0;
    this.pitch = 0;
    this.beginFly(path.overhead, path.ctrl, path.info.eye, path.overheadLook, path.ctrlLook, path.info.target, () => {
      this.mode = "seat";
      if (done) done();
    });
  }

  leave(done?: () => void) {
    if (this.mode === "map") return;
    this.mode = "flying";
    const path = this.flight(this.selected);
    this.beginFly(this.camera.position.clone(), path.ctrl, path.overhead, this.look.clone(), path.ctrlLook, path.overheadLook, () => {
      this.mode = "map";
      if (done) done();
    });
  }

  dispose() {
    this.alive = false;
    cancelAnimationFrame(this.frame);
    this.observer.disconnect();
    this.canvas.removeEventListener("pointerdown", this.onDown);
    this.canvas.removeEventListener("pointermove", this.onMove);
    this.video.pause();
    this.video.remove();
    this.texture.dispose();
    this.renderer.dispose();
    this.renderer.forceContextLoss();
  }

  private flight(seat: Seat) {
    const info = this.viewOf(seat);
    return {
      info,
      overhead: new THREE.Vector3(seat.x * 0.88, seat.y + 7.6, seat.z + 0.35),
      overheadLook: new THREE.Vector3(seat.x * 0.82, 0.25, seat.z - 2.8),
      ctrl: new THREE.Vector3(seat.x * 0.78, seat.y + 4.6, seat.z + 0.15),
      ctrlLook: new THREE.Vector3(seat.x * 0.74, 1.6, Math.max(2.4, seat.z - 7)),
    };
  }

  private beginFly(
    fromP: THREE.Vector3,
    ctrlP: THREE.Vector3,
    toP: THREE.Vector3,
    fromL: THREE.Vector3,
    ctrlL: THREE.Vector3,
    toL: THREE.Vector3,
    done?: () => void,
  ) {
    if (this.reduce) {
      this.camera.position.copy(toP);
      this.look.copy(toL);
      if (done) done();
      return;
    }
    this.fly = { fromP, ctrlP, toP, fromL, ctrlL, toL, t: 0, done };
  }

  private resize() {
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    if (!w || !h) return;
    const nextFov = h > w ? 64 : 52;
    if (this.camera.fov !== nextFov) this.camera.fov = nextFov;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h, false);
  }

  private tick = () => {
    if (!this.alive) return;
    const dt = this.clock.getDelta();
    if (this.fly) {
      this.fly.t = Math.min(1, this.fly.t + dt / 1.15);
      const e = 1 - Math.pow(1 - this.fly.t, 3);
      this.camera.position.copy(quad(this.fly.fromP, this.fly.ctrlP, this.fly.toP, e));
      this.look.copy(quad(this.fly.fromL, this.fly.ctrlL, this.fly.toL, e));
      if (this.fly.t >= 1) {
        const done = this.fly.done;
        this.fly = null;
        if (done) done();
      }
    }
    const info = this.viewOf(this.selected);
    const aim = (this.mode === "seat" && !this.fly ? info.target : this.look).clone();
    if (this.mode === "seat" && !this.fly) {
      aim.x += this.yaw * 2.4;
      aim.y += this.pitch * -1.6;
    }
    this.camera.lookAt(aim);
    this.renderer.render(this.scene, this.camera);
    this.frame = requestAnimationFrame(this.tick);
  };
}

function tintSeat(source: THREE.MeshStandardMaterial, color: number, emissive = 0x000000, intensity = 0) {
  const material = source.clone();
  material.color.setHex(color);
  material.emissive.setHex(emissive);
  material.emissiveIntensity = intensity;
  return material;
}

function placeSeat(root: THREE.Object3D) {
  const holder = new THREE.Group();
  root.rotation.y = Math.PI;
  holder.add(root);
  holder.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(holder);
  const center = box.getCenter(new THREE.Vector3());
  holder.position.set(-center.x, -box.min.y, -center.z);
  return holder;
}

function prepareAudience(root: THREE.Object3D) {
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (!mesh.isMesh) return;
    mesh.frustumCulled = false;
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    materials.forEach((material) => {
      if (!material) return;
      material.side = THREE.DoubleSide;
      if (material.transparent) {
        material.alphaTest = 0.45;
        material.transparent = false;
        material.depthWrite = true;
      }
    });
  });
}

function quad(a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3, t: number) {
  const u = 1 - t;
  return new THREE.Vector3(
    u * u * a.x + 2 * u * t * b.x + t * t * c.x,
    u * u * a.y + 2 * u * t * b.y + t * t * c.y,
    u * u * a.z + 2 * u * t * b.z + t * t * c.z,
  );
}
