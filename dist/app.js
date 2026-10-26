'use strict';
(async () => {
    const api = window.TBS;
    function startupErrorDescription(error) {
        try {
            return error !== null &&
                (typeof error === 'object' || typeof error === 'function') &&
                'message' in error
                ? String(error.message)
                : String(error);
        }
        catch {
            return 'Не удалось получить описание ошибки';
        }
    }
    function reportError(error) {
        console.error(error);
        let message;
        try {
            message =
                error !== null &&
                    (typeof error === 'object' || typeof error === 'function') &&
                    'message' in error
                    ? String(error.message)
                    : String(error);
        }
        catch {
            // Keep the original value in the console even if its getters/coercion fail.
            message = 'Не удалось получить описание ошибки';
        }
        const toast = document.getElementById('toast');
        if (toast) {
            toast.textContent = 'Ошибка запуска 3D: ' + message;
            toast.classList.add('show');
        }
        const startButton = document.getElementById('startBtn');
        if (startButton)
            startButton.disabled = true;
    }
    addEventListener('error', (event) => reportError(event.error || new Error(event.message)));
    try {
        const dom = api.createDom(document);
        if (!window.THREE) {
            dom.getElement('overlayCopy').textContent =
                'Не удалось загрузить локальную библиотеку 3D. Проверьте, что папка assets находится рядом с index.html.';
            dom.getElement('startBtn').disabled = true;
            return;
        }
        const T = window.THREE;
        T.ColorManagement.legacyMode = false;
        const state = api.domain.createState();
        const presentation = api.createPresentationState(state);
        // No renderer exists during decoding; page departure must not start a late world.
        let surfacePageClosed = false;
        const leaveSurfacePreparation = () => {
            surfacePageClosed = true;
        };
        addEventListener('pagehide', leaveSurfacePreparation, { once: true });
        let preparedSurfaces;
        try {
            preparedSurfaces = await api.prepareVisualSurfaces(window.TBS_VISUAL_SURFACES);
        }
        catch (error) {
            if (surfacePageClosed)
                return;
            throw error;
        }
        finally {
            removeEventListener('pagehide', leaveSurfacePreparation);
        }
        if (surfacePageClosed)
            return;
        const world = api.buildWorld({
            T,
            canvas: dom.canvas,
            config: api.domain.config,
            preparedSurfaces,
        });
        const subscriptions = api.createSessionListeners();
        let game;
        try {
            game = api.buildGame({ state, presentation, world, dom, listen: subscriptions.listen });
        }
        catch (error) {
            subscriptions.close();
            throw error;
        }
        const { runtime, session } = game;
        world.renderer.__sessionListeners = subscriptions.snapshot;
        const startupAbort = new AbortController();
        const closeCore = api.installStartupEnvironmentCleanup(world, runtime);
        const canvas = world.renderer.domElement;
        let contextFailure = null;
        let closePromise;
        const closeEnvironment = () => {
            if (closePromise)
                return closePromise;
            subscriptions.close();
            runtime.stop();
            dom.getElement('startBtn').disabled = true;
            const drain = world.renderer.__startupDrain;
            closePromise = (drain?.promise ?? Promise.resolve({ kind: 'ready' })).then((outcome) => {
                const permission = world.renderer.__startupClaimTeardown(outcome);
                if (permission === 'context-lost') {
                    onContextLoss();
                    // The native context already invalidated its objects. Never query/delete old handles.
                    world.renderer.__discardLostGeneration();
                    world.renderer.__cleanupResult = { done: true, invalidated: true };
                }
                else if (permission === 'live') {
                    closeCore();
                    world.renderer.__cleanupResult = { done: true, invalidated: false };
                }
                canvas.removeEventListener('webglcontextlost', onContextLoss);
                delete world.renderer.__startupPasses;
                delete world.renderer.__startupDispose;
                delete world.renderer.__startupClose;
                if (startupAbort.signal.aborted &&
                    outcome.error &&
                    outcome.error !== startupAbort.signal.reason)
                    console.error('Preparation error after cancellation (original abort preserved)', outcome.error);
                return world.renderer.__cleanupResult;
            }, (error) => {
                world.renderer.__cleanupResult = {
                    done: false,
                    blocked: true,
                    error: startupErrorDescription(error),
                };
                dom.getElement('overlayCopy').textContent = 'GPU cleanup is blocked. Reload with F5.';
                reportError(error);
                throw error;
            });
            world.renderer.__startupCleanup = closePromise;
            closePromise.catch((error) => {
                if (!world.renderer.__cleanupResult?.blocked) {
                    world.renderer.__cleanupResult = {
                        done: false,
                        blocked: true,
                        error: startupErrorDescription(error),
                    };
                    dom.getElement('overlayCopy').textContent = 'GPU cleanup is blocked. Reload with F5.';
                    reportError(error);
                }
                console.error('Asynchronous cleanup failed; pending owner retained', error);
            });
            return closePromise;
        };
        function onContextLoss(event) {
            if (event)
                event.preventDefault();
            if (contextFailure)
                return;
            contextFailure = new Error('Графический контекст потерян. Перезапустите страницу клавишей F5 или кнопкой обновления браузера.');
            world.renderer.__startupInvalidateContext();
            world.renderer.__discardLostGeneration();
            startupAbort.abort(contextFailure);
            try {
                closeEnvironment();
            }
            catch (cleanupError) {
                console.error('Cleanup error (context loss preserved)', cleanupError);
            }
            reportError(contextFailure);
            dom.getElement('overlayCopy').textContent = contextFailure.message;
            dom.getElement('overlay').classList.remove('hidden');
        }
        world.renderer.__startupClose = closeEnvironment;
        canvas.addEventListener('webglcontextlost', onContextLoss);
        const cancel = () => startupAbort.abort(new Error('Page left during preparation'));
        addEventListener('pagehide', cancel, { once: true });
        try {
            const passes = world.renderer.__startupPasses;
            if (!passes)
                throw new Error('Graphics preparation passes are unavailable');
            await world.renderer.compileAsyncPasses(passes(), { signal: startupAbort.signal });
            // A resolved result is not permission to start a closed/lost generation.
            if (world.renderer.getContext().isContextLost())
                onContextLoss();
            if (startupAbort.signal.aborted)
                throw startupAbort.signal.reason;
        }
        catch (error) {
            if (world.renderer.getContext().isContextLost())
                onContextLoss();
            try {
                closeEnvironment();
            }
            catch (cleanupError) {
                console.error('Cleanup error (original preparation error preserved)', cleanupError);
            }
            if (contextFailure !== null)
                return;
            throw error;
        }
        finally {
            // Safe consumes these references synchronously; its owner retains only programs while draining.
            delete world.renderer.__compileOnlyEnvMaps;
            removeEventListener('pagehide', cancel);
        }
        runtime.start();
        if (new URLSearchParams(location.search).has('play'))
            session.start();
    }
    catch (error) {
        reportError(error);
    }
})();
