import React, { useEffect, useState, lazy } from "react";
import Particles from "react-particles";
import { loadConfettiPreset } from "tsparticles-preset-confetti";

export const Confetti = React.memo(() => {
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
