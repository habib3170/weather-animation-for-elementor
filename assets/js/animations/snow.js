window.WAFE_SNOW = function (canvas, ctx, settings) {

    let flakes = [];

    function init() {
        flakes = [];
        for (let i = 0; i < settings.density; i++) {
            flakes.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                size: Math.random() * 3 + 1
            });
        }
    }

    init();

    function animate() {

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = "#fff";

        flakes.forEach(f => {

            ctx.beginPath();
            ctx.arc(f.x, f.y, f.size, 0, Math.PI * 2);
            ctx.fill();

            f.y += settings.speed;
            f.x += Math.sin(f.y * 0.01) * 1;

            if (f.y > canvas.height) {
                f.y = 0;
                f.x = Math.random() * canvas.width;
            }
        });

        requestAnimationFrame(animate);
    }

    animate();
};