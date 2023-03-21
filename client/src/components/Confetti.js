import React, { useEffect, useState } from "react";

let Particles = null;
let loadConfettiPreset = null;

export const Confetti = React.memo(() => {
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        (async () => {
            if (Particles && loadConfettiPreset) {
                setMounted(true);
                return;
            }
            [{ default: Particles }, { loadConfettiPreset }] = await Promise.all([
                import(
                    /* webpackChunkName: "particles-base" */
                    /* webpackPreload: true */
                    "react-particles/cjs/Particles"
                ),
                import(
                    /* webpackChunkName: "particles-confetti" */
                    /* webpackPreload: true */
                    "tsparticles-preset-confetti/cjs/index"
                ),
            ]);
            setMounted(true);
        })();
    }, []);

    if (!mounted) {
        return null;
    }

    const particlesInit = (engine) => {
        return loadConfettiPreset(engine);
    };

    const particlesLoaded = () => {};

    return (
        <Particles
            id="fireworks-container"
            init={particlesInit}
            loaded={particlesLoaded}
            options={{
                preset: "confetti",
            }}
        />
    );
});
