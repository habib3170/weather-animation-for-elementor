window.WAFE_SUNNY = function (canvas, ctx, settings) {

    function animate() {

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const time = Date.now() * 0.0015;

        const cx = canvas.width / 2;
        const cy = canvas.height * 0.25;

        const shift = Math.sin(time * 0.3) * 20;

        const sky = ctx.createLinearGradient(0, 0, 0, canvas.height);
        sky.addColorStop(0, `rgba(${255 + shift}, 235, 160, 0.45)`);
        sky.addColorStop(0.5, "rgba(200, 240, 255, 0.15)");
        sky.addColorStop(1, "rgba(120, 180, 255, 0.15)");

        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const glow = 70 + Math.sin(time * 2) * 10;

        const sunGradient = ctx.createRadialGradient(cx, cy, 10, cx, cy, glow);
        sunGradient.addColorStop(0, "rgba(255, 230, 120, 0.95)");
        sunGradient.addColorStop(1, "rgba(255, 200, 0, 0)");

        ctx.beginPath();
        ctx.fillStyle = sunGradient;
        ctx.arc(cx, cy, glow, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.arc(cx, cy, 30, 0, Math.PI * 2);
        ctx.fillStyle = "#faeb7c";
        ctx.fill();

        requestAnimationFrame(animate);
    }

    animate();
};