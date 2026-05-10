window.WAFE_CLOUD = function (canvas, ctx, settings) {

    let clouds = [];

    function init() {
        clouds = [];
        for (let i = 0; i < settings.density; i++) {
            clouds.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                size: Math.random() * 5 + 2
            });
        }
    }

    init();

    function animate() {

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = "rgba(255,255,255,0.85)";

        clouds.forEach(c => {

            ctx.beginPath();
            ctx.arc(c.x, c.y, c.size * 5, 0, Math.PI * 2);
            ctx.fill();

            c.x += settings.speed * 0.5;

            if (c.x > canvas.width) {
                c.x = 0;
                c.y = Math.random() * canvas.height;
            }
        });

        requestAnimationFrame(animate);
    }

    animate();
};