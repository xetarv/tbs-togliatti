'use strict';
/** Terminal owner cleanup for one world, after its renderer drain permits retirement. */
window.TBS.installStartupEnvironmentCleanup = function (world, runtime) {
    const r = world.renderer;
    let closed = false;
    const close = () => {
        if (closed)
            return;
        closed = true;
        const errors = [];
        const attempt = (owner, dispose) => {
            try {
                dispose();
            }
            catch (error) {
                errors.push({ owner, error });
            }
        };
        attempt('runtime', () => runtime.stop());
        const instances = new Set();
        function isInstancedMesh(object) {
            return object.isInstancedMesh === true;
        }
        attempt('instance owners', () => {
            const passes = r.__startupPasses;
            if (!passes)
                throw new Error('Graphics preparation passes are unavailable');
            for (const pass of passes())
                pass.scene.traverse((o) => {
                    if (isInstancedMesh(o))
                        instances.add(o);
                });
        });
        attempt('graphics', () => {
            const dispose = r.__startupDispose;
            if (!dispose)
                throw new Error('Graphics owner disposal is unavailable');
            dispose();
        });
        const materials = new Set(), geometries = new Set(), textures = new Set(), shadows = new Set();
        // r149's native Texture discriminator is the boundary for arbitrary material/uniform values.
        const isTexture = (value) => value !== null &&
            typeof value === 'object' &&
            'isTexture' in value &&
            value.isTexture === true;
        const texture = (value) => {
            if (isTexture(value) && !value.isRenderTargetTexture)
                textures.add(value);
        };
        attempt('world owners', () => world.scene.traverse((o) => {
            if (o.shadow)
                shadows.add(o.shadow);
            if (o.geometry)
                geometries.add(o.geometry);
            if (o.material)
                for (const m of Array.isArray(o.material) ? o.material : [o.material])
                    materials.add(m);
        }));
        for (const m of materials) {
            for (const value of Object.values(m))
                texture(value);
            if (m.uniforms)
                for (const uniform of Object.values(m.uniforms)) {
                    if (Array.isArray(uniform.value))
                        uniform.value.forEach(texture);
                    else
                        texture(uniform.value);
                }
        }
        for (const facade of world.facadeMaterials)
            texture(facade);
        for (const instance of instances)
            attempt('instance', () => instance.dispose());
        for (const shadow of shadows)
            attempt('light shadow', () => shadow.dispose());
        for (const material of materials)
            attempt('world material', () => material.dispose());
        for (const geometry of geometries)
            attempt('world geometry', () => geometry.dispose());
        for (const map of textures)
            attempt('world texture', () => map.dispose());
        attempt('scene environment target', () => world.startupEnvironmentTarget.dispose());
        if (r.shadowMap.dispose)
            attempt('shadow map owner', () => r.shadowMap.dispose?.());
        attempt('renderer', () => r.dispose());
        delete r.__startupPasses;
        delete r.__startupDispose;
        delete r.__startupClose;
        if (errors.length)
            throw new AggregateError(errors.map((e) => e.error), 'Experimental environment cleanup failed: ' + errors.map((e) => e.owner).join(', '));
    };
    r.__startupClose = close;
    return close;
};
