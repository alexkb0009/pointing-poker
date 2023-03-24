import React from "react";
import Particles from "react-particles";
import { loadConfettiPreset } from "tsparticles-preset-confetti";

const particlesInit = (engine) => {
    return loadConfettiPreset(engine);
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
