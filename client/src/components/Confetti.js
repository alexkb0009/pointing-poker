import React from "react";
import Particles from "react-particles";
import { loadConfettiPreset } from "tsparticles-preset-confetti";

let loadedConfetti = false;

const particlesInit = (engine) => {
    if (loadedConfetti) return;
    loadConfettiPreset(engine);
    loadedConfetti = true;
};

const particlesLoaded = () => {};

export const Confetti = React.memo(() => {
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
