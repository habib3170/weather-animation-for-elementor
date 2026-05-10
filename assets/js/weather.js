(function ($) {
    'use strict';

    var previousWeather = {};

    var WeatherAnimation = {

        instances: {},

        init: function () {

            elementorFrontend.hooks.addAction(
                'frontend/element_ready/section',
                WeatherAnimation.initWidget
            );

            elementorFrontend.hooks.addAction(
                'frontend/element_ready/container',
                WeatherAnimation.initWidget
            );
        },

        initWidget: function ($scope) {

            var sectionId = $scope.data('id');

            if (!sectionId) {
                return;
            }

            var target = '.elementor-element-' + sectionId;
            var element = document.querySelector(target);

            if (!element) {
                return;
            }

            // পুরনো wrapper remove
            element.classList.remove('wafe-wrapper');

            var settings = {};

            /* ─────────────────────────────────
             * EDITOR MODE
             * ───────────────────────────────── */
            if (
                window.elementorFrontend &&
                window.elementorFrontend.isEditMode()
            ) {

                if (
                    !window.elementor ||
                    !window.elementor.elements ||
                    !window.elementor.elements.models
                ) {
                    return;
                }

                var editorElements = window.elementor.elements;
                var args = {};

                $.each(editorElements.models, function (i, el) {

                    // Direct Section / Container
                    if (sectionId === el.id) {

                        if (
                            el.attributes &&
                            el.attributes.settings &&
                            el.attributes.settings.attributes
                        ) {
                            args = el.attributes.settings.attributes;
                        }
                    }

                    // Nested Container Support
                    else if (
                        el.id === $scope.closest('.elementor-top-section').data('id')
                    ) {

                        if (
                            el.attributes &&
                            el.attributes.elements &&
                            el.attributes.elements.models
                        ) {

                            $.each(el.attributes.elements.models, function (i, col) {

                                if (
                                    col.attributes &&
                                    col.attributes.elements &&
                                    col.attributes.elements.models
                                ) {

                                    $.each(col.attributes.elements.models, function (i, subSec) {

                                        if (
                                            subSec.attributes &&
                                            subSec.attributes.settings &&
                                            subSec.attributes.settings.attributes
                                        ) {
                                            args = subSec.attributes.settings.attributes;
                                        }

                                    });
                                }
                            });
                        }
                    }
                });

                settings.switch   = args.wafe_enable || '';
                settings.type     = args.wafe_type || 'rain';
                settings.density  = args.wafe_density || 50;
                settings.speed    = args.wafe_speed || 1;
                settings.bg_color = args.wafe_bg_color || '';
                settings.mouse_effect = args.wafe_mouse_effect || '';
                settings.mouse_effect_type = args.wafe_mouse_effect_type || 'repel';
            }

            /* ─────────────────────────────────
             * FRONTEND MODE
             * ───────────────────────────────── */
            else {
                var data = $scope.data('wafe') || {};

                settings.switch   = data.wafe_enable || '';
                settings.type     = data.type || 'rain';
                settings.density  = data.density || 50;
                settings.speed    = data.speed || 1;
                settings.bg_color = data.bg_color || '';
                settings.mouse_effect = data.mouse_effect || '';
                settings.mouse_effect_type = data.mouse_effect_type || 'repel';
            }

            if ( settings.switch === true || settings.switch === 'true' || settings.switch === 'yes') {

                var sectionKey = 'wafe-' + sectionId;

                if (!previousWeather.hasOwnProperty(sectionKey)) {
                    previousWeather[sectionKey] = settings;
                }

                if (
                    JSON.stringify(previousWeather[sectionKey]) !==
                    JSON.stringify(settings)
                ) {

                    if (WeatherAnimation.instances[sectionKey]) {

                        WeatherAnimation.instances[sectionKey].destroy();

                        delete WeatherAnimation.instances[sectionKey];
                    }

                    previousWeather[sectionKey] = settings;
                }

                if (!WeatherAnimation.instances[sectionKey]) {

                    element.classList.add('wafe-wrapper');

                    WeatherAnimation.instances[sectionKey] =
                        new WeatherAnimator(element, settings);
                }
            } else {

                var sectionKey = 'wafe-' + sectionId;

                if (WeatherAnimation.instances[sectionKey]) {

                    WeatherAnimation.instances[sectionKey].destroy();

                    delete WeatherAnimation.instances[sectionKey];
                }

                delete previousWeather[sectionKey];

                element.classList.remove('wafe-wrapper');
                element.style.backgroundColor = '';
            }
        }
    };

    /* ─────────────────────────────────────────
     * Weather Animator Class
     * ───────────────────────────────────────── */
    function WeatherAnimator(element, settings) {

        this.element = element;
        this.settings = settings;

        this.canvas = null;
        this.ctx = null;

        this.particles = [];
        this.animationId = null;

        this.mouse = { x: null, y: null, radius: 220 };
        this.mouseMoveHandler = this.handleMouseMove.bind(this);
        this.mouseLeaveHandler = this.handleMouseLeave.bind(this);

        this.resizeHandler = this.resize.bind(this);

        // this.sun = {
        //     x: 120,
        //     y: 120,
        //     radius: 45,
        //     glow: 70
        // };

        this.sun = {
            x: 120,
            y: 120,
            radius: 45,
            glow: 70,
            visible: true
        };

        this.moon = {
            x: 200,
            y: 120,
            radius: 35,
            glow: 60,
            visible: false
        };

        
        this.setup();
    }

    WeatherAnimator.prototype = {

        setup: function () {

            // old canvas remove
            var oldCanvas = this.element.querySelector('.wafe-canvas');

            if (oldCanvas) {
                oldCanvas.remove();
            }

            // Canvas create
            this.canvas = document.createElement('canvas');
            this.canvas.className = 'wafe-canvas';

            // Wrapper styles
            this.element.style.position = 'relative';
            this.element.style.overflow = 'hidden';

            // Background color
            if (this.settings.bg_color) {
                this.element.style.backgroundColor =
                    this.settings.bg_color;
            }

            // Canvas styles
            this.canvas.style.position = 'absolute';
            this.canvas.style.top = '0';
            this.canvas.style.left = '0';
            this.canvas.style.width = '100%';
            this.canvas.style.height = '100%';
            this.canvas.style.pointerEvents = 'none';
            this.canvas.style.zIndex = '1';

            // Add canvas
            this.element.prepend(this.canvas);

            // Context
            this.ctx = this.canvas.getContext('2d');

            // Resize
            this.resize();

            // Create particles
            this.createParticles();

            // Start animation
            this.animate();

            // Resize event
            window.addEventListener(
                'resize',
                this.resizeHandler
            );

            // Mouse events
            this.element.addEventListener(
                'mousemove',
                this.mouseMoveHandler
            );

            this.element.addEventListener(
                'mouseleave',
                this.mouseLeaveHandler
            );
        },

        resize: function () {

            if (!this.canvas) {
                return;
            }

            var rect = this.element.getBoundingClientRect();

            if (!rect.width || !rect.height) {
                return;
            }

            this.canvas.width = rect.width;
            this.canvas.height = rect.height;

            if (this.sun) { 
                this.sun.x = this.canvas.width - 120; 
                this.sun.y = 120; 
            }

            this.particles = [];

            this.createParticles();
        },

        createParticles: function () {

            var density =
                parseInt(this.settings.density) || 50;

            for (var i = 0; i < density; i++) {
                this.particles.push(this.createParticle());
            }
        },

        createParticle: function () {

            var type =
                this.settings.type || 'rain';

            var speed =
                parseFloat(this.settings.speed) || 2;

            var startX = Math.random() * this.canvas.width;
            var startY = Math.random() * this.canvas.height;

            var particle = {

                x: startX,
                y: startY,

                // Original position save
                baseX: startX,
                baseY: startY,

                speed: speed + Math.random() * speed,

                opacity: Math.random() * 0.5 + 0.5
            };

            switch (type) {

                case 'rain':

                    particle.length =
                        Math.random() * 15 + 10;

                    particle.width =
                        Math.random() * 1 + 1;

                    particle.angle =
                        Math.PI / 18;

                    break;

                case 'snow':

                    particle.radius =
                        Math.random() * 3 + 2;

                    particle.drift =
                        Math.random() * 0.5 - 0.25;

                    particle.speed =
                        speed * 0.5 +
                        Math.random() * speed * 0.5;

                    break;

                case 'cloud':

                    particle.width =
                        Math.random() * 80 + 60;

                    particle.height =
                        Math.random() * 30 + 20;

                    particle.speed =
                        speed * 0.3 +
                        Math.random() * speed * 0.2;

                    particle.y =
                        Math.random() *
                        (this.canvas.height * 0.5);

                    particle.opacity =
                        Math.random() * 0.3 + 0.3;

                    break;

                case 'sunny':

                    particle.radius =
                        Math.random() * 2 + 1;

                    particle.twinkleSpeed =
                        Math.random() * 0.05 + 0.02;

                    particle.twinklePhase =
                        Math.random() * Math.PI * 2;

                    particle.speed = 0;

                    break;
            }

            return particle;
        },

        animate: function () {

            if (!this.ctx || !this.canvas) {
                return;
            }

            this.ctx.clearRect(
                0,
                0,
                this.canvas.width,
                this.canvas.height
            );

            var type = this.settings.type || 'rain';

            var self = this;

            // Draw sun first
            if (type === 'sunny') {

                this.updateSunPosition();

                if (this.sun.visible) {
                    this.drawSun();
                }

                if (this.moon.visible) {
                    this.drawMoon();
                }
            }

            this.particles.forEach(function ( particle, index ) {

                self.updateParticle(
                    particle,
                    type
                );

                self.drawParticle(
                    particle,
                    type
                );

                if (
                    self.isOffScreen(
                        particle,
                        type
                    )
                ) {

                    self.particles[index] =
                        self.createParticle();

                    if (
                        type === 'rain' ||
                        type === 'snow' ||
                        type === 'cloud'
                    ) {
                        self.particles[index].y = -20;
                    }
                }
            });

            this.animationId =
                requestAnimationFrame(
                    this.animate.bind(this)
                );
        },

        updateParticle: function ( particle, type) {

            switch (type) {

                case 'rain':

                    particle.y += particle.speed * 2;

                    particle.x += Math.sin(particle.angle) * particle.speed * 0.5;

                    break;

                case 'snow':

                    particle.y += particle.speed;

                    particle.x += particle.drift;

                    particle.drift += (Math.random() - 0.5) * 0.1;

                    particle.drift = Math.max( -1, Math.min(1, particle.drift) );

                    break;

                case 'cloud':

                    particle.x += particle.speed;

                    break;

                case 'sunny':

                    particle.twinklePhase += particle.twinkleSpeed;

                    particle.opacity = 0.3 + Math.abs( Math.sin( particle.twinklePhase ) ) * 0.7;

                    particle.speed = 0;

                    // Smooth return to original position
                    particle.x += (particle.baseX - particle.x) * 0.03;

                    particle.y += (particle.baseY - particle.y) * 0.03;

                    break;
            }

            // Mouse interaction
            if ( this.settings.mouse_effect === 'yes' && this.mouse.x !== null && this.mouse.y !== null ) {

                var dx =
                    this.mouse.x - particle.x;

                var dy =
                    this.mouse.y - particle.y;

                var distance =
                    Math.sqrt(dx * dx + dy * dy);

                if (distance < this.mouse.radius) {

                    var force =
                        (this.mouse.radius - distance) /
                        this.mouse.radius;

                    var angle =
                        Math.atan2(dy, dx);

                    // Move Away
                    if (
                        this.settings.mouse_effect_type ===
                        'repel'
                    ) {

                        particle.x -=
                            Math.cos(angle) *
                            force * 5;

                        particle.y -=
                            Math.sin(angle) *
                            force * 5;
                    }

                    // Come Near
                    else if (
                        this.settings.mouse_effect_type ===
                        'attract'
                    ) {

                        particle.x +=
                            Math.cos(angle) *
                            force * 2;

                        particle.y +=
                            Math.sin(angle) *
                            force * 2;
                    }
                }
            }
        },

        drawParticle: function ( particle, type ) {

            this.ctx.save();

            switch (type) {

                case 'rain':

                    this.ctx.strokeStyle =
                        'rgba(174,194,224,' +
                        particle.opacity +
                        ')';

                    this.ctx.lineWidth =
                        particle.width;

                    this.ctx.beginPath();

                    this.ctx.moveTo(
                        particle.x,
                        particle.y
                    );

                    this.ctx.lineTo(
                        particle.x +
                        Math.sin(
                            particle.angle
                        ) *
                        particle.length,

                        particle.y +
                        particle.length
                    );

                    this.ctx.stroke();

                    break;

                case 'snow':

                    this.ctx.fillStyle =
                        'rgba(255,255,255,' +
                        particle.opacity +
                        ')';

                    this.ctx.beginPath();

                    this.ctx.arc(
                        particle.x,
                        particle.y,
                        particle.radius,
                        0,
                        Math.PI * 2
                    );

                    this.ctx.fill();

                    break;

                case 'cloud':

                    this.drawCloud(particle);

                    break;

                case 'sunny':

                    this.ctx.fillStyle =
                        'rgba(255,223,128,' +
                        particle.opacity +
                        ')';

                    this.ctx.beginPath();

                    this.ctx.arc(
                        particle.x,
                        particle.y,
                        particle.radius,
                        0,
                        Math.PI * 2
                    );

                    this.ctx.fill();

                    break;
            }

            this.ctx.restore();
        },

        drawCloud: function (particle) {

            this.ctx.fillStyle = 'rgba(255,255,255,' + particle.opacity + ')';

            var x = particle.x;
            var y = particle.y;
            var w = particle.width;
            var h = particle.height;

            this.ctx.beginPath();

            this.ctx.arc(
                x + w * 0.2,
                y + h * 0.5,
                h * 0.5,
                0,
                Math.PI * 2
            );

            this.ctx.arc(
                x + w * 0.5,
                y + h * 0.3,
                h * 0.6,
                0,
                Math.PI * 2
            );

            this.ctx.arc(
                x + w * 0.75,
                y + h * 0.5,
                h * 0.5,
                0,
                Math.PI * 2
            );

            this.ctx.fill();
        },

        updateSunPosition: function () {

            if (!this.sun || !this.canvas) {
                return;
            }

            var hour = new Date().getHours();

            // Morning
            if (hour >= 5 && hour < 11) {
                this.moon.visible = false;
                this.sun.visible = true;

                this.sun.x =
                    this.canvas.width * 0.1;

                this.sun.y = 100;
            }

            // Noon
            else if (hour >= 11 && hour < 15) {

                this.sun.visible = true;
                this.moon.visible = false;

                this.sun.x = this.canvas.width * 0.5;

                this.sun.y = 80;
            }

            // Evening
            else if (hour >= 15 && hour < 18) {

                this.sun.visible = true;
                this.moon.visible = false;

                this.sun.x = this.canvas.width * 0.9;

                this.sun.y = 100;
            }

            // Night
            else {

                this.sun.visible = false;

                this.moon.visible = true;

                this.moon.x =
                    this.canvas.width * 0.7;

                this.moon.y = 90;
            }
        },

        drawSun: function () {

            var ctx = this.ctx;
            var sun = this.sun;

            // Glow
            var gradient = ctx.createRadialGradient(
                sun.x,
                sun.y,
                sun.radius * 0.5,

                sun.x,
                sun.y,
                sun.glow
            );

            gradient.addColorStop(
                0,
                'rgba(255,220,120,0.9)'
            );

            gradient.addColorStop(
                1,
                'rgba(255,220,120,0)'
            );

            ctx.beginPath();

            ctx.fillStyle = gradient;

            ctx.arc(
                sun.x,
                sun.y,
                sun.glow,
                0,
                Math.PI * 2
            );

            ctx.fill();

            // Sun body
            ctx.beginPath();

            ctx.fillStyle = '#FFD54A';

            ctx.arc(
                sun.x,
                sun.y,
                sun.radius,
                0,
                Math.PI * 2
            );

            ctx.fill();

            // Rays
            ctx.save();

            ctx.translate(sun.x, sun.y);

            ctx.strokeStyle =
                'rgba(255,220,120,0.8)';

            ctx.lineWidth = 3;

            var rayCount = 12;

            var time = Date.now() * 0.001;

            ctx.rotate(time * 0.2);

            for (var i = 0; i < rayCount; i++) {

                ctx.beginPath();

                ctx.moveTo(
                    sun.radius + 10,
                    0
                );

                ctx.lineTo(
                    sun.radius + 25,
                    0
                );

                ctx.stroke();

                ctx.rotate(
                    (Math.PI * 2) / rayCount
                );
            }

            ctx.restore();
        },

        drawMoon: function () {

            var ctx = this.ctx;
            var moon = this.moon;

            ctx.save();

            // Glow
            var gradient = ctx.createRadialGradient(
                moon.x,
                moon.y,
                moon.radius * 0.3,
                moon.x,
                moon.y,
                moon.glow
            );

            gradient.addColorStop(0, 'rgba(220,230,255,0.9)');
            gradient.addColorStop(1, 'rgba(220,230,255,0)');

            ctx.beginPath();
            ctx.fillStyle = gradient;

            ctx.arc(
                moon.x,
                moon.y,
                moon.glow,
                0,
                Math.PI * 2
            );

            ctx.fill();

            // Moon body
            ctx.beginPath();

            ctx.fillStyle = '#E6F0FF';

            ctx.arc(
                moon.x,
                moon.y,
                moon.radius,
                0,
                Math.PI * 2
            );

            ctx.fill();

            // Crescent effect (shadow cut)
            ctx.globalCompositeOperation = "destination-out";

            ctx.beginPath();

            ctx.arc(
                moon.x + 10,
                moon.y - 5,
                moon.radius,
                0,
                Math.PI * 2
            );

            ctx.fill();

            ctx.restore();
        },

        isOffScreen: function ( particle,  type ) {

            switch (type) {

                case 'rain':
                case 'snow':

                    return (
                        particle.y >
                        this.canvas.height + 20
                    );

                case 'cloud':

                    return (
                        particle.x >
                        this.canvas.width +
                        particle.width
                    );

                default:

                    return false;
            }
        },

        handleMouseMove: function (e) {

            var rect = this.canvas.getBoundingClientRect();

            this.mouse.x = e.clientX - rect.left;

            this.mouse.y = e.clientY - rect.top;
        },

        handleMouseLeave: function () {

            this.mouse.x = null;
            this.mouse.y = null;
        },

        destroy: function () {

            if (this.animationId) {
                cancelAnimationFrame(
                    this.animationId
                );
            }

            window.removeEventListener(
                'resize',
                this.resizeHandler
            );

            this.element.removeEventListener(
                'mousemove',
                this.mouseMoveHandler
            );

            this.element.removeEventListener(
                'mouseleave',
                this.mouseLeaveHandler
            );

            if (
                this.canvas &&
                this.canvas.parentNode
            ) {
                this.canvas.remove();
            }

            this.particles = [];
        }
    };

    

    /* ─────────────────────────────────────────
     * Elementor Frontend Init
     * ───────────────────────────────────────── */
    $(window).on(
        'elementor/frontend/init',
        WeatherAnimation.init
    );

    /* ─────────────────────────────────────────
     * Fallback Direct Init
     * ───────────────────────────────────────── */
    $(window).on('load', function () {

        $('.wafe-wrapper').each(function () {

            var element = this;

            var data =
                $(this).data('wafe') || {};

            if (
                data &&
                !WeatherAnimation.instances[element]
            ) {

                WeatherAnimation.instances[element] =
                    new WeatherAnimator(
                        element,
                        data
                    );
            }
        });
    });

})(jQuery);