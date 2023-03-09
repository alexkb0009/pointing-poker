import React from "react";
import Particles from "react-particles";
import { loadConfettiPreset } from "tsparticles-preset-confetti";

export const Confetti = React.memo(({ enabled }) => {
    const particlesInit = (engine) => {
        return loadConfettiPreset(engine);
    };
    const particlesLoaded = () => {};
    if (!enabled) {
        return null;
    }
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
