window.WAFE_RAIN = function (canvas, ctx, settings) {

    let drops = [];

    function init() {
        drops = [];
        for (let i = 0; i < settings.density; i++) {
            drops.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height
            });
        }
    }

    init();

    function animate() {

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = "rgba(255,255,255,0.8)";

        drops.forEach(d => {

            ctx.fillRect(d.x, d.y, 2, 12);

            d.y += settings.speed * 4;

            if (d.y > canvas.height) {
                d.y = 0;
                d.x = Math.random() * canvas.width;
            }
        });

        requestAnimationFrame(animate);
    }

    animate();
};