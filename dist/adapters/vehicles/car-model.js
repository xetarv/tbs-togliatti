'use strict';
window.TBS.createCarModels = function ({ T, box, dark, mat, cyanMat, detailBar, orangeMat, whiteMat, markTexture, makeTexture, trimMat, signTexture, createFastback, meshData, scene, wedge, tireMat, unitBox, }) {
    let allocations = null;
    const ownedModels = new WeakMap();
    function own(resource) {
        allocations?.add(resource);
        return resource;
    }
    // A local constructor boundary records allocations even before they are attached.
    // Proxy preserves the native constructor/newTarget and does not wrap shared inputs.
    function tracked(constructor) {
        return new Proxy(constructor, {
            construct(target, args, newTarget) {
                const resource = Reflect.construct(target, args, newTarget);
                return own(resource);
            },
        });
    }
    const trafficT = {
        ...T,
        BufferGeometry: tracked(T.BufferGeometry),
        ExtrudeGeometry: tracked(T.ExtrudeGeometry),
        CylinderGeometry: tracked(T.CylinderGeometry),
        TorusGeometry: tracked(T.TorusGeometry),
        SphereGeometry: tracked(T.SphereGeometry),
        PlaneGeometry: tracked(T.PlaneGeometry),
        CircleGeometry: tracked(T.CircleGeometry),
        MeshPhysicalMaterial: tracked(T.MeshPhysicalMaterial),
        MeshBasicMaterial: tracked(T.MeshBasicMaterial),
        InstancedMesh: tracked(T.InstancedMesh),
    };
    const trafficMat = (...args) => own(mat(...args));
    const trafficTexture = (...args) => own(makeTexture(...args));
    const trafficSign = (...args) => own(signTexture(...args));
    const trafficBar = (...args) => {
        const mesh = detailBar(...args);
        own(mesh.geometry);
        return mesh;
    };
    const trafficWedge = (...args) => {
        const mesh = wedge(...args);
        own(mesh.geometry);
        return mesh;
    };
    function release(resources) {
        const list = [...resources].reverse();
        resources.clear();
        const errors = [];
        for (const resource of list) {
            try {
                resource.dispose();
            }
            catch (error) {
                errors.push(error);
            }
        }
        if (errors.length)
            throw new AggregateError(errors, 'Traffic resource disposal failed');
    }
    const { coachwork, glazedQuad } = window.TBS.createTrafficCarGeometry({ T: trafficT });
    const { createPassengerShell } = window.TBS.createPassengerBodyBuilder({
        T: trafficT,
        box,
        dark,
        mat: trafficMat,
        coachwork,
        cyanMat,
        glazedQuad,
        detailBar: trafficBar,
        orangeMat,
        whiteMat,
        markTexture,
        makeTexture: trafficTexture,
    });
    const { createCommercialBody } = window.TBS.createCommercialBodyBuilder({
        T: trafficT,
        mat: trafficMat,
        box,
        dark,
        coachwork,
        glazedQuad,
        detailBar: trafficBar,
        orangeMat,
        trimMat,
        markTexture,
        signTexture: trafficSign,
    });
    const vehicleShadowTexture = makeTexture((c, w, h) => {
        const gradient = c.createRadialGradient(w / 2, h / 2, w * 0.12, w / 2, h / 2, w * 0.5);
        gradient.addColorStop(0, 'rgba(0,0,0,.75)');
        gradient.addColorStop(0.55, 'rgba(0,0,0,.48)');
        gradient.addColorStop(1, 'rgba(0,0,0,0)');
        c.fillStyle = gradient;
        c.fillRect(0, 0, w, h);
    }, 128, 128);
    function buildPassengerModel(group, paint, variant) {
        createPassengerShell(group, paint, variant);
        box(group, 0, 0.78, -2.875, 1.3, 0.13, 0.045, dark);
    }
    function buildCommercialModel(group, paint, variant) {
        coachwork(group, 2.65, 5.15, 0.63, 0.65, paint);
        trafficWedge(group, 2.76, -2.82, -1.1, 0.67, 1.02, 1.61, paint);
        trafficWedge(group, 2.76, 1.05, 2.78, 0.67, 1.63, 1.04, paint);
        box(group, 0, 0.55, 0, 2.33, 0.22, 4.98, dark);
        createCommercialBody(group, paint, variant);
        box(group, 0, 1.11, -2.82, 2.38, 0.22, 0.1, dark);
        box(group, 0, 1.01, 2.81, 2.35, 0.22, 0.1, dark);
    }
    const trafficModels = {
        compact: {
            buildBody: (group, paint) => buildPassengerModel(group, paint, 'compact'),
            passenger: true,
            scale: 0.9,
            proportions: { z: 0.87, y: 1.06 },
        },
        sedan: {
            buildBody: (group, paint) => buildPassengerModel(group, paint, 'sedan'),
            passenger: true,
            scale: 1,
        },
        van: {
            buildBody: (group, paint) => buildCommercialModel(group, paint, 'van'),
            passenger: false,
            scale: 1,
        },
        shuttle: {
            buildBody: (group, paint) => buildCommercialModel(group, paint, 'shuttle'),
            passenger: false,
            scale: 1,
        },
    };
    function createHeroCar() {
        return createFastback({
            meshData,
            T,
            scene,
            logo: markTexture,
            makeTexture,
            shadowTexture: vehicleShadowTexture,
        });
    }
    function createTrafficCar(color, variant = 'sedan') {
        if (allocations)
            throw new Error('Reentrant traffic model construction');
        const resources = new Set();
        allocations = resources;
        let group;
        try {
            group = new T.Group();
            const body = new trafficT.MeshPhysicalMaterial({
                color,
                metalness: 0.65,
                roughness: 0.24,
                clearcoat: 1,
                clearcoatRoughness: 0.12,
                envMapIntensity: 1.3,
            });
            // Keep the former sedan-like fallback for untyped callers, excluding prototype keys.
            const model = Object.hasOwn(trafficModels, variant)
                ? trafficModels[variant]
                : trafficModels.sedan;
            const passenger = model.passenger;
            model.buildBody(group, body);
            const { wheels } = window.TBS.buildTrafficCarWheels({
                T: trafficT,
                group,
                tireMat,
                trimMat,
                body,
                box,
                whiteMat,
            });
            const { brakeMaterial, reverseMaterial } = window.TBS.buildTrafficCarLights({
                T: trafficT,
                passenger,
                box,
                group,
                cyanMat,
                orangeMat,
            });
            const { shadow } = window.TBS.buildTrafficCarShadow({
                T: trafficT,
                vehicleShadowTexture,
                group,
            });
            group.userData.wheels = wheels;
            group.userData.brakeMaterial = brakeMaterial;
            group.userData.reverseMaterial = reverseMaterial;
            window.TBS.buildTrafficCarSuspension({ T: trafficT, group, shadow, wheels, unitBox });
            group.userData.variant = variant;
            group.userData.paint = body;
            const scale = model.scale;
            group.scale.setScalar(scale);
            if (model.proportions) {
                group.scale.z *= model.proportions.z;
                group.scale.y *= model.proportions.y;
            }
            group.userData.wheelRadius = 0.5 * scale;
            scene.add(group);
            ownedModels.set(group, resources);
            // Existing branch-specific builders and assignments have now populated the completed data.
            return group;
        }
        catch (error) {
            if (group)
                scene.remove(group);
            const cleanupFailures = [];
            try {
                release(resources);
            }
            catch (cleanupError) {
                cleanupFailures.push(cleanupError);
            }
            if (cleanupFailures.length)
                throw new AggregateError([error, ...cleanupFailures], 'Traffic model construction failed', {
                    cause: error,
                });
            throw error;
        }
        finally {
            allocations = null;
        }
    }
    function disposeTrafficCar(car) {
        const resources = ownedModels.get(car);
        if (!resources)
            return false;
        ownedModels.delete(car);
        car.removeFromParent();
        release(resources);
        return true;
    }
    function animateVehicle(mesh, speed, steer, braking, dt) {
        if (mesh.userData.steeringWheel)
            mesh.userData.steeringWheel.rotation.z = -steer * 0.65;
        for (const wheel of mesh.userData.wheels) {
            wheel.rolling.rotation.x =
                (wheel.rolling.rotation.x - (speed * dt) / mesh.userData.wheelRadius) % (Math.PI * 2);
            const angle = wheel.front ? -steer * 0.38 : 0;
            wheel.steering.rotation.y += (angle - wheel.steering.rotation.y) * (1 - Math.exp(-dt * 12));
        }
        mesh.userData.brakeMaterial.color.setHex(braking ? 0xff3822 : 0x8c160d);
        mesh.userData.reverseMaterial.color.setHex(speed < -0.2 ? 0xe8f5ff : 0x29313b);
    }
    return { createHeroCar, createTrafficCar, disposeTrafficCar, animateVehicle };
};
