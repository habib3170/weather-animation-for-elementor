(function ($) {
    'use strict';

    var previousWeather = {};

    /* =====================================================
     * WEATHER ANIMATION CONTROLLER
     * ===================================================== */
    var WeatherAnimation = {

        instances: {},

        init: function () {
            elementorFrontend.hooks.addAction('frontend/element_ready/section',   WeatherAnimation.initWidget);
            elementorFrontend.hooks.addAction('frontend/element_ready/container', WeatherAnimation.initWidget);
        },

        initWidget: function ($scope) {

            var sectionId = $scope.data('id');
            if (!sectionId) return;

            var element = document.querySelector('.elementor-element-' + sectionId);
            if (!element) return;

            element.classList.remove('wafe-wrapper');

            var settings = {};

            if (window.elementorFrontend && window.elementorFrontend.isEditMode()) {

                if (!window.elementor || !window.elementor.elements || !window.elementor.elements.models) return;

                var args = {};

                $.each(window.elementor.elements.models, function (i, el) {
                    if (sectionId === el.id) {
                        args = el.attributes && el.attributes.settings && el.attributes.settings.attributes
                            ? el.attributes.settings.attributes : {};
                    } else if (el.id === $scope.closest('.elementor-top-section').data('id')) {
                        $.each(el.attributes.elements.models, function (i, col) {
                            $.each(col.attributes.elements.models, function (i, subSec) {
                                if (subSec.attributes && subSec.attributes.settings && subSec.attributes.settings.attributes) {
                                    args = subSec.attributes.settings.attributes;
                                }
                            });
                        });
                    }
                });

                settings.switch            = args.wafe_enable            || '';
                settings.type              = args.wafe_type              || 'rain';
                settings.density           = args.wafe_density           || 50;
                settings.speed             = args.wafe_speed             || 1;
                settings.bg_color          = args.wafe_bg_color          || '';
                settings.mouse_effect      = args.wafe_mouse_effect      || '';
                settings.mouse_effect_type = args.wafe_mouse_effect_type || 'repel';

            } else {
                var data = $scope.data('wafe') || {};

                settings.switch            = data.wafe_enable       || '';
                settings.type              = data.type              || 'rain';
                settings.density           = data.density           || 50;
                settings.speed             = data.speed             || 1;
                settings.bg_color          = data.bg_color          || '';
                settings.mouse_effect      = data.mouse_effect      || '';
                settings.mouse_effect_type = data.mouse_effect_type || 'repel';
            }

            var sectionKey = 'wafe-' + sectionId;

            if (settings.switch === true || settings.switch === 'true' || settings.switch === 'yes') {

                if (!previousWeather.hasOwnProperty(sectionKey)) {
                    previousWeather[sectionKey] = settings;
                }

                if (JSON.stringify(previousWeather[sectionKey]) !== JSON.stringify(settings)) {
                    if (WeatherAnimation.instances[sectionKey]) {
                        WeatherAnimation.instances[sectionKey].destroy();
                        delete WeatherAnimation.instances[sectionKey];
                    }
                    previousWeather[sectionKey] = settings;
                }

                if (!WeatherAnimation.instances[sectionKey]) {
                    element.classList.add('wafe-wrapper');
                    WeatherAnimation.instances[sectionKey] = new WeatherAnimator(element, settings);
                }

            } else {

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


    /* =====================================================
     * WeatherAnimator — MAIN CLASS
     * ===================================================== */
    function WeatherAnimator(element, settings) {

        this.element  = element;
        this.settings = settings;
        this.canvas   = null;
        this.ctx      = null;

        this.rainState  = null;
        this.snowState  = null;
        this.cloudState = null;
        this.sunnyState = null;

        this._stars = [];

        this.animationId = null;

        this.mouse = { x: null, y: null, radius: 220 };

        this.mouseMoveHandler  = this.handleMouseMove.bind(this);
        this.mouseLeaveHandler = this.handleMouseLeave.bind(this);
        this.resizeHandler     = this.resize.bind(this);

        this.setup();
    }

    WeatherAnimator.prototype = {

        /* ─────────────────────────────────────────────────
         * SETUP
         * ───────────────────────────────────────────────── */
        setup: function () {

            var oldCanvas = this.element.querySelector('.wafe-canvas');
            if (oldCanvas) oldCanvas.remove();

            this.canvas           = document.createElement('canvas');
            this.canvas.className = 'wafe-canvas';

            Object.assign(this.element.style, { position: 'relative', overflow: 'hidden' });
            if (this.settings.bg_color) this.element.style.backgroundColor = this.settings.bg_color;

            Object.assign(this.canvas.style, {
                position:      'absolute',
                top:           '0',
                left:          '0',
                width:         '100%',
                height:        '100%',
                pointerEvents: 'none',
                zIndex:        '0'
            });

            this.element.prepend(this.canvas);
            this.ctx = this.canvas.getContext('2d');

            this.resize();
            this.initActiveModule();
            this.animate();

            window.addEventListener('resize', this.resizeHandler);
            this.element.addEventListener('mousemove',  this.mouseMoveHandler);
            this.element.addEventListener('mouseleave', this.mouseLeaveHandler);
        },

        /* ─────────────────────────────────────────────────
         * RESIZE
         * ───────────────────────────────────────────────── */
        resize: function () {
            if (!this.canvas) return;
            var rect = this.element.getBoundingClientRect();
            if (!rect.width || !rect.height) return;
            this.canvas.width  = rect.width;
            this.canvas.height = rect.height;
            this.initActiveModule();
        },

        /* ─────────────────────────────────────────────────
         * INIT ACTIVE MODULE
         * ───────────────────────────────────────────────── */
        initActiveModule: function () {
            this.rainState  = null;
            this.snowState  = null;
            this.cloudState = null;
            this.sunnyState = null;

            var type = this.settings.type || 'rain';

            switch (type) {
                case 'rain':  this.rainState  = this.initRain();  break;
                case 'snow':  this.snowState  = this.initSnow();  break;
                case 'cloud': this.cloudState = this.initCloud(); break;
                case 'sunny': this.sunnyState = this.initSunny(); break;
            }
        },

        /* =================================================
         * SHARED — SKY GRADIENT
         * ================================================= */
        drawSkyGradient: function (h) {
            var ctx = this.ctx, W = this.canvas.width, H = this.canvas.height;

            if (this.settings.bg_color) {
                ctx.fillStyle = this.settings.bg_color;
                ctx.fillRect(0, 0, W, H);
                return;
            }

            var g = ctx.createLinearGradient(0, 0, 0, H);

            if      (h >= 5  && h < 7)  { g.addColorStop(0, '#1a1a3a'); g.addColorStop(0.4, '#8B3A62'); g.addColorStop(0.7, '#E8833A'); g.addColorStop(1, '#F5C842'); }
            else if (h >= 7  && h < 9)  { g.addColorStop(0, '#5BA4D8'); g.addColorStop(0.5, '#8DC6F0'); g.addColorStop(1, '#FAE8A0'); }
            else if (h >= 9  && h < 17) { g.addColorStop(0, '#1B6FBF'); g.addColorStop(0.5, '#4CA3E0'); g.addColorStop(1, '#87CEEB'); }
            else if (h >= 17 && h < 19) { g.addColorStop(0, '#3a1c55'); g.addColorStop(0.35, '#C05320'); g.addColorStop(0.65, '#E87B2A'); g.addColorStop(1, '#FAD15A'); }
            else if (h >= 19 && h < 21) { g.addColorStop(0, '#0d0d2b'); g.addColorStop(0.4, '#2c1b55'); g.addColorStop(0.7, '#8B3A62'); g.addColorStop(1, '#C26030'); }
            else                         { g.addColorStop(0, '#05051A'); g.addColorStop(0.6, '#0d0d2b'); g.addColorStop(1, '#1a1440'); }

            ctx.fillStyle = g;
            ctx.fillRect(0, 0, W, H);
        },

        /* =================================================
         * SHARED — STARS
         * ================================================= */
        initStarsShared: function () {
            var W = this.canvas.width, H = this.canvas.height;
            this._stars = [];
            for (var i = 0; i < 120; i++) {
                this._stars.push({
                    x:     Math.random() * W,
                    y:     Math.random() * H * 0.75,
                    r:     Math.random() * 1.5 + 0.3,
                    phase: Math.random() * Math.PI * 2,
                    speed: Math.random() * 0.025 + 0.008,
                    big:   Math.random() < 0.07
                });
            }
        },

        drawStars: function (h) {
            var alpha = 0;
            if      (h < 4)  alpha = 1;
            else if (h < 6)  alpha = 1 - (h - 4) / 2;
            else if (h >= 21) alpha = 1;
            else if (h > 20) alpha = h - 20;
            if (alpha <= 0 || !this._stars.length) return;

            var ctx = this.ctx, t = Date.now() * 0.001;
            this._stars.forEach(function (s) {
                var tw = 0.4 + Math.sin(s.phase + t * s.speed) * 0.6;
                ctx.save();
                ctx.globalAlpha = alpha * tw;
                if (s.big) {
                    ctx.fillStyle = '#fff';
                    for (var a = 0; a < 4; a++) {
                        ctx.save();
                        ctx.translate(s.x, s.y);
                        ctx.rotate(a * Math.PI / 4 + t * 0.1);
                        ctx.fillRect(-0.5, -s.r * 3, 1, s.r * 3);
                        ctx.restore();
                    }
                    ctx.beginPath();
                    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
                    ctx.fillStyle = '#ffffee';
                    ctx.fill();
                } else {
                    ctx.beginPath();
                    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
                    ctx.fillStyle = '#ddeeff';
                    ctx.fill();
                }
                ctx.restore();
            });
        },

        /* =================================================
         * SHARED — REALISTIC SUN
         * ================================================= */
        drawRealisticSun: function (h) {
            if (h < 5 || h >= 20) return;
            var ctx  = this.ctx;
            var W    = this.canvas.width, H = this.canvas.height;
            var prog = Math.max(0, Math.min(1, (h - 5) / 15));
            var sx   = prog * W;
            var sy   = H * 0.85 - Math.sin(prog * Math.PI) * H * 0.65;
            var elev = Math.sin(prog * Math.PI);
            var r    = 36;
            var rise = (h >= 5 && h < 9) || (h >= 17 && h < 20);

            /* Corona */
            var corona = ctx.createRadialGradient(sx, sy, r * 0.5, sx, sy, r * 4.5);
            corona.addColorStop(0,   rise ? 'rgba(255,200,80,0.55)'  : 'rgba(255,240,160,0.6)');
            corona.addColorStop(0.4, rise ? 'rgba(255,120,40,0.3)'   : 'rgba(255,220,80,0.25)');
            corona.addColorStop(1,   'rgba(255,210,60,0)');
            ctx.beginPath(); ctx.arc(sx, sy, r * 4.5, 0, Math.PI * 2);
            ctx.fillStyle = corona; ctx.fill();

            /* Outer glow */
            var glow = ctx.createRadialGradient(sx, sy, r * 0.8, sx, sy, r * 2.2);
            glow.addColorStop(0, 'rgba(255,230,100,0.7)');
            glow.addColorStop(1, 'rgba(255,210,60,0)');
            ctx.beginPath(); ctx.arc(sx, sy, r * 2.2, 0, Math.PI * 2);
            ctx.fillStyle = glow; ctx.fill();

            /* Disc */
            var disc = ctx.createRadialGradient(sx - r * 0.25, sy - r * 0.25, r * 0.1, sx, sy, r);
            disc.addColorStop(0,   '#FFFDE0');
            disc.addColorStop(0.5, rise ? '#FFB347' : '#FFE040');
            disc.addColorStop(1,   rise ? '#FF7720' : '#FFCC00');
            ctx.beginPath(); ctx.arc(sx, sy, r, 0, Math.PI * 2);
            ctx.fillStyle = disc; ctx.fill();

            /* Rotating rays */
            ctx.save();
            ctx.translate(sx, sy);
            ctx.rotate(Date.now() * 0.0003);
            var rayAlpha = elev > 0.2 ? 0.7 : elev * 3.5;
            ctx.strokeStyle = 'rgba(255,230,80,' + rayAlpha + ')';
            for (var i = 0; i < 16; i++) {
                var inn = r + 8, out = r + 18 + (i % 2) * 8;
                ctx.lineWidth = i % 2 === 0 ? 2 : 1;
                ctx.beginPath();
                ctx.moveTo(Math.cos(i * Math.PI / 8) * inn, Math.sin(i * Math.PI / 8) * inn);
                ctx.lineTo(Math.cos(i * Math.PI / 8) * out, Math.sin(i * Math.PI / 8) * out);
                ctx.stroke();
            }
            ctx.restore();

            /* Horizon haze at sunrise/sunset */
            if (rise) {
                var haze = ctx.createRadialGradient(sx, H, 10, sx, H, W * 0.8);
                haze.addColorStop(0, 'rgba(255,140,60,0.35)');
                haze.addColorStop(1, 'rgba(255,100,40,0)');
                ctx.fillStyle = haze;
                ctx.fillRect(0, 0, W, H);
            }
        },

        /* =================================================
         * SHARED — REALISTIC MOON
         * ================================================= */
        drawRealisticMoon: function (h) {
            var isNight = h < 5 || h >= 21;
            if (!isNight) return;

            var ctx  = this.ctx;
            var W    = this.canvas.width, H = this.canvas.height;
            var prog = h < 5 ? (h + 4) / 9 : (h - 21) / 9;
            var mx   = W * 0.2 + prog * W * 0.6;
            var my   = H * 0.65 - Math.sin(prog * Math.PI) * H * 0.5;
            var r    = 30;

            /* Glow */
            var mg = ctx.createRadialGradient(mx, my, r * 0.5, mx, my, r * 3.5);
            mg.addColorStop(0, 'rgba(200,215,255,0.3)');
            mg.addColorStop(1, 'rgba(180,200,255,0)');
            ctx.beginPath(); ctx.arc(mx, my, r * 3.5, 0, Math.PI * 2);
            ctx.fillStyle = mg; ctx.fill();

            /* Disc */
            var md = ctx.createRadialGradient(mx - r * 0.3, my - r * 0.3, r * 0.05, mx, my, r);
            md.addColorStop(0,   '#F0F4FF');
            md.addColorStop(0.4, '#D8E4FF');
            md.addColorStop(1,   '#B0C4DE');
            ctx.beginPath(); ctx.arc(mx, my, r, 0, Math.PI * 2);
            ctx.fillStyle = md; ctx.fill();

            /* Crescent shadow */
            ctx.save();
            ctx.beginPath(); ctx.arc(mx, my, r, 0, Math.PI * 2); ctx.clip();
            var sd = ctx.createRadialGradient(mx + r * 0.5, my - r * 0.15, r * 0.1, mx + r * 0.5, my - r * 0.15, r * 1.1);
            sd.addColorStop(0,    'rgba(10,15,40,0.95)');
            sd.addColorStop(0.55, 'rgba(10,15,40,0.85)');
            sd.addColorStop(0.75, 'rgba(10,15,40,0.4)');
            sd.addColorStop(1,    'rgba(10,15,40,0)');
            ctx.fillStyle = sd;
            ctx.fillRect(mx - r, my - r, r * 2, r * 2);
            ctx.restore();

            /* Craters */
            var craters = [{ dx: -8, dy: 4, cr: 4 }, { dx: 8, dy: -8, cr: 3 }, { dx: -2, dy: -12, cr: 2 }, { dx: 12, dy: 8, cr: 2.5 }];
            craters.forEach(function (c) {
                ctx.beginPath(); ctx.arc(mx + c.dx, my + c.dy, c.cr, 0, Math.PI * 2);
                ctx.fillStyle   = 'rgba(160,175,200,0.25)'; ctx.fill();
                ctx.strokeStyle = 'rgba(140,155,185,0.35)'; ctx.lineWidth = 0.5; ctx.stroke();
            });
        },

        /* =================================================
         * SHARED — GROUND HAZE
         * ================================================= */
        drawGroundHaze: function (h) {
            var ctx = this.ctx, W = this.canvas.width, H = this.canvas.height;
            var col = h >= 7 && h < 17
                ? 'rgba(180,210,240,0.22)'
                : h >= 17 && h < 20
                    ? 'rgba(200,130,80,0.22)'
                    : 'rgba(30,35,70,0.22)';
            var g = ctx.createLinearGradient(0, H * 0.65, 0, H);
            g.addColorStop(0, 'rgba(0,0,0,0)');
            g.addColorStop(1, col);
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, W, H);
        },

        /* =================================================
         * RAIN MODULE
         * ================================================= */
        initRain: function () {
            var state   = { particles: [] };
            var density = parseInt(this.settings.density) || 50;
            var speed   = parseFloat(this.settings.speed) || 2;
            var W = this.canvas.width, H = this.canvas.height;
            for (var i = 0; i < density; i++) state.particles.push(this.createRainParticle(W, H, speed));
            return state;
        },

        createRainParticle: function (W, H, speed) {
            speed = speed || parseFloat(this.settings.speed) || 2;
            return {
                x:       Math.random() * W,
                y:       Math.random() * H,
                length:  Math.random() * 15 + 10,
                width:   Math.random() * 1  + 1,
                angle:   Math.PI / 18,
                speed:   speed + Math.random() * speed,
                opacity: Math.random() * 0.5 + 0.5
            };
        },

        updateRain: function () {
            if (!this.rainState) return;
            var self  = this;
            var speed = parseFloat(this.settings.speed) || 2;
            var W = this.canvas.width, H = this.canvas.height;

            this.rainState.particles.forEach(function (p, i) {
                p.y += p.speed * 2;
                p.x += Math.sin(p.angle) * p.speed * 0.5;
                self.applyMouseEffect(p);
                if (p.y > H + 20) {
                    self.rainState.particles[i] = self.createRainParticle(W, H, speed);
                    self.rainState.particles[i].y = -20;
                }
            });
        },

        drawRain: function () {
            if (!this.rainState) return;
            var ctx = this.ctx;
            this.rainState.particles.forEach(function (p) {
                ctx.save();
                ctx.strokeStyle = 'rgba(174,194,224,' + p.opacity + ')';
                ctx.lineWidth   = p.width;
                ctx.beginPath();
                ctx.moveTo(p.x, p.y);
                ctx.lineTo(p.x + Math.sin(p.angle) * p.length, p.y + p.length);
                ctx.stroke();
                ctx.restore();
            });
        },

        /* =================================================
         * SNOW MODULE
         * ================================================= */
        initSnow: function () {
            var state   = { particles: [] };
            var density = parseInt(this.settings.density) || 50;
            var speed   = parseFloat(this.settings.speed) || 2;
            var W = this.canvas.width, H = this.canvas.height;
            for (var i = 0; i < density; i++) state.particles.push(this.createSnowParticle(W, H, speed));
            return state;
        },

        createSnowParticle: function (W, H, speed) {
            speed = speed || parseFloat(this.settings.speed) || 2;
            return {
                x:       Math.random() * W,
                y:       Math.random() * H,
                radius:  Math.random() * 3 + 2,
                drift:   Math.random() * 0.5 - 0.25,
                speed:   speed * 0.5 + Math.random() * speed * 0.5,
                opacity: Math.random() * 0.5 + 0.5
            };
        },

        updateSnow: function () {
            if (!this.snowState) return;
            var self  = this;
            var speed = parseFloat(this.settings.speed) || 2;
            var W = this.canvas.width, H = this.canvas.height;

            this.snowState.particles.forEach(function (p, i) {
                p.y     += p.speed;
                p.x     += p.drift;
                p.drift += (Math.random() - 0.5) * 0.1;
                p.drift  = Math.max(-1, Math.min(1, p.drift));
                self.applyMouseEffect(p);
                if (p.y > H + 20) {
                    self.snowState.particles[i] = self.createSnowParticle(W, H, speed);
                    self.snowState.particles[i].y = -20;
                }
            });
        },

        drawSnow: function () {
            if (!this.snowState) return;
            var ctx = this.ctx;
            this.snowState.particles.forEach(function (p) {
                ctx.save();
                ctx.fillStyle = 'rgba(255,255,255,' + p.opacity + ')';
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            });
        },

        /* =================================================
         * CLOUD MODULE  (layered realistic + day/night)
         * ================================================= */
        initCloud: function () {
            var state   = { clouds: [], birds: [] };
            var density = parseInt(this.settings.density) || 14;
            var W = this.canvas.width, H = this.canvas.height;

            this.initStarsShared();

            for (var i = 0; i < density; i++) state.clouds.push(this.createCloudParticle(W, H, false));
            for (var j = 0; j < 5; j++)       state.birds.push(this.createBird(W, H));
            return state;
        },

        createCloudParticle: function (W, H, fromRight) {
            var speed = parseFloat(this.settings.speed) || 1;
            var layer = Math.random() < 0.35 ? 'high' : Math.random() < 0.5 ? 'mid' : 'low';
            var w     = 90  + Math.random() * 160;
            var h2    = 35  + Math.random() * 40;
            var x     = fromRight ? W + w : Math.random() * (W + w * 2) - w;
            var y     = layer === 'high' ? Math.random() * H * 0.2 + 20
                      : layer === 'mid'  ? H * 0.15 + Math.random() * H * 0.25
                      :                    H * 0.35 + Math.random() * H * 0.2;
            var spd   = speed * 0.18 * (layer === 'high' ? 1.5 : layer === 'mid' ? 1.0 : 0.6) * (0.7 + Math.random() * 0.6);
            return {
                x: x, y: y, w: w, h: h2,
                speed: spd, layer: layer,
                opacity:  layer === 'high' ? 0.4 + Math.random() * 0.25 : 0.65 + Math.random() * 0.3,
                numBumps: 3 + Math.floor(Math.random() * 4)
            };
        },

        createBird: function (W, H) {
            return {
                x:       Math.random() * W,
                y:       50 + Math.random() * 80,
                speed:   0.4 + Math.random() * 0.5,
                wing:    Math.random() * Math.PI * 2,
                size:    4 + Math.random() * 4,
                opacity: 0.5 + Math.random() * 0.4
            };
        },

        updateCloud: function () {
            if (!this.cloudState) return;
            var self    = this;
            var density = parseInt(this.settings.density) || 14;
            var speed   = parseFloat(this.settings.speed) || 1;
            var W = this.canvas.width, H = this.canvas.height;

            /* Move clouds + mouse effect */
            this.cloudState.clouds.forEach(function (c) {
                c.x += c.speed;

                if (self.settings.mouse_effect === 'yes' && self.mouse.x !== null) {
                    var cx   = c.x + c.w / 2;
                    var cy   = c.y + c.h / 2;
                    var dx   = self.mouse.x - cx;
                    var dy   = self.mouse.y - cy;
                    var dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < self.mouse.radius) {
                        var force = (self.mouse.radius - dist) / self.mouse.radius;
                        var angle = Math.atan2(dy, dx);
                        if (self.settings.mouse_effect_type === 'attract') {
                            c.x += Math.cos(angle) * force * 1.5;
                            c.y += Math.sin(angle) * force * 1.5;
                        } else {
                            c.x -= Math.cos(angle) * force * 4;
                            c.y -= Math.sin(angle) * force * 2;
                        }
                    }
                }
            });

            /* Recycle off-screen clouds */
            this.cloudState.clouds = this.cloudState.clouds.filter(function (c) { return c.x < W + c.w + 10; });
            while (this.cloudState.clouds.length < density) this.cloudState.clouds.push(self.createCloudParticle(W, H, true));

            /* Birds */
            this.cloudState.birds.forEach(function (b) {
                b.x    += b.speed * speed * 0.5;
                b.wing += 0.08;
                if (b.x > W + 40) b.x = -40;
            });
        },

        drawCloud: function () {
            if (!this.cloudState) return;
            var self = this;
            var h    = new Date().getHours();
            var ctx  = this.ctx;
            var W    = this.canvas.width, H = this.canvas.height;

            /* Sky + celestial bodies */
            this.drawSkyGradient(h);
            this.drawStars(h);
            this.drawRealisticSun(h);
            this.drawRealisticMoon(h);

            /* Ground haze */
            this.drawGroundHaze(h);

            /* Clouds — high → mid → low (painter's order) */
            ['high', 'mid', 'low'].forEach(function (layer) {
                self.cloudState.clouds
                    .filter(function (c) { return c.layer === layer; })
                    .forEach(function (c) { self.drawOneCloud(c, h); });
            });

            /* Birds (daytime only) */
            var birdAlpha = h >= 7 && h <= 9   ? (h - 7) / 2
                          : h >= 16 && h <= 18  ? (18 - h) / 2
                          : h > 9  && h < 16    ? 1 : 0;
            if (birdAlpha > 0) {
                this.cloudState.birds.forEach(function (b) {
                    var ww = Math.sin(b.wing) * b.size * 0.5;
                    ctx.save();
                    ctx.globalAlpha  = b.opacity * birdAlpha;
                    ctx.strokeStyle  = 'rgba(40,40,60,0.7)';
                    ctx.lineWidth    = 1.2;
                    ctx.beginPath();
                    ctx.moveTo(b.x - b.size, b.y - ww);
                    ctx.quadraticCurveTo(b.x, b.y, b.x + b.size, b.y - ww);
                    ctx.stroke();
                    ctx.restore();
                });
            }
        },

        /* Single cloud shape */
        drawOneCloud: function (c, h) {
            var ctx  = this.ctx;
            var col, col2;

            if      (h >= 6  && h < 9)  { col = c.layer === 'high' ? 'rgba(255,210,200,@)' : 'rgba(255,225,210,@)'; col2 = 'rgba(220,180,160,@)'; }
            else if (h >= 9  && h < 17) { col = c.layer === 'high' ? 'rgba(255,255,255,@)' : 'rgba(240,245,255,@)'; col2 = 'rgba(210,220,235,@)'; }
            else if (h >= 17 && h < 20) { col = c.layer === 'high' ? 'rgba(255,180,120,@)' : 'rgba(255,170,140,@)'; col2 = 'rgba(200,120,80,@)';  }
            else                         { col = c.layer === 'high' ? 'rgba(70,80,110,@)'   : 'rgba(50,60,90,@)';   col2 = 'rgba(35,42,70,@)';    }

            var bumps = [];
            for (var i = 0; i < c.numBumps; i++) {
                var bx  = c.x + i * (c.w / c.numBumps) * 0.85 + (c.w / c.numBumps) * 0.1;
                var mid = Math.floor(c.numBumps / 2);
                var by  = c.y + (i === 0 || i === c.numBumps - 1 ? c.h * 0.25
                              :  i === 1 || i === c.numBumps - 2  ? c.h * 0.1 : 0);
                var br  = (c.w / c.numBumps) * 0.5 * (i === mid ? 1.3 : 0.9);
                bumps.push({ x: bx, y: by, r: br });
            }

            /* Shadow base */
            ctx.fillStyle = col2.replace('@', c.opacity * 0.55);
            ctx.fillRect(c.x, c.y + c.h * 0.45, c.w, c.h * 0.55);

            /* Cloud body */
            ctx.fillStyle = col.replace('@', c.opacity);
            ctx.beginPath();
            bumps.forEach(function (b, i) {
                if (i === 0) ctx.moveTo(b.x, b.y);
                ctx.arc(b.x, b.y, b.r, Math.PI, 0);
            });
            var last = bumps[bumps.length - 1];
            ctx.arc(last.x + last.r, c.y + c.h * 0.65, c.h * 0.35, -Math.PI / 2, Math.PI / 2);
            ctx.lineTo(c.x, c.y + c.h);
            ctx.arc(c.x, c.y + c.h * 0.65, c.h * 0.35, Math.PI / 2, -Math.PI / 2);
            ctx.closePath();
            ctx.fill();

            /* Top highlight */
            var hl = ctx.createLinearGradient(c.x, c.y - 20, c.x, c.y + c.h * 0.5);
            hl.addColorStop(0, h >= 6 && h < 20 ? 'rgba(255,255,255,0.45)' : 'rgba(120,140,200,0.2)');
            hl.addColorStop(1, 'rgba(255,255,255,0)');
            ctx.fillStyle = hl;
            ctx.beginPath();
            bumps.forEach(function (b, i) {
                if (i === 0) ctx.moveTo(b.x, b.y);
                ctx.arc(b.x, b.y, b.r, Math.PI, 0);
            });
            ctx.lineTo(c.x, c.y + c.h * 0.45);
            ctx.closePath();
            ctx.fill();
        },

        /* =================================================
         * SUNNY MODULE  (sparkles + realistic sun/moon)
         * ================================================= */
        initSunny: function () {
            var state   = { particles: [] };
            var density = parseInt(this.settings.density) || 50;
            var W = this.canvas.width, H = this.canvas.height;

            this.initStarsShared();

            for (var i = 0; i < density; i++) state.particles.push(this.createSunnyParticle(W, H));
            return state;
        },

        createSunnyParticle: function (W, H) {
            var x = Math.random() * W, y = Math.random() * H;
            return {
                x: x, y: y, baseX: x, baseY: y,
                radius:       Math.random() * 2 + 0.5,
                twinkleSpeed: Math.random() * 0.04 + 0.01,
                twinklePhase: Math.random() * Math.PI * 2,
                opacity:      Math.random() * 0.5 + 0.3,
                speed:        0
            };
        },

        updateSunny: function () {
            if (!this.sunnyState) return;
            var self = this;
            this.sunnyState.particles.forEach(function (p) {
                p.twinklePhase += p.twinkleSpeed;
                p.opacity       = 0.3 + Math.abs(Math.sin(p.twinklePhase)) * 0.7;
                p.x += (p.baseX - p.x) * 0.03;
                p.y += (p.baseY - p.y) * 0.03;
                self.applyMouseEffect(p);
            });
        },

        drawSunny: function () {
            if (!this.sunnyState) return;
            var h   = new Date().getHours();
            var ctx = this.ctx;
            var W   = this.canvas.width, H = this.canvas.height;
            var isDay = h >= 6 && h < 20;

            this.drawSkyGradient(h);
            this.drawStars(h);
            this.drawRealisticSun(h);
            this.drawRealisticMoon(h);

            /* Sparkles — daytime only */
            if (isDay) {
                this.sunnyState.particles.forEach(function (p) {
                    var op = Math.abs(Math.sin(p.twinklePhase)) * 0.6;
                    if (op < 0.02) return;
                    ctx.save();
                    ctx.globalAlpha = op;
                    ctx.fillStyle   = 'rgba(255,240,120,' + op + ')';
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                });
            }

            this.drawGroundHaze(h);
        },

        /* =================================================
         * MOUSE EFFECT  (shared — for rain / snow / sunny)
         * ================================================= */
        applyMouseEffect: function (p) {
            if (this.settings.mouse_effect !== 'yes') return;
            if (this.mouse.x === null || this.mouse.y === null) return;

            var dx       = this.mouse.x - p.x;
            var dy       = this.mouse.y - p.y;
            var distance = Math.sqrt(dx * dx + dy * dy);

            if (distance >= this.mouse.radius) return;

            var force = (this.mouse.radius - distance) / this.mouse.radius;
            var angle = Math.atan2(dy, dx);

            if (this.settings.mouse_effect_type === 'attract') {
                p.x += Math.cos(angle) * force * 2;
                p.y += Math.sin(angle) * force * 2;
            } else {
                p.x -= Math.cos(angle) * force * 5;
                p.y -= Math.sin(angle) * force * 5;
            }
        },

        /* =================================================
         * ANIMATION LOOP
         * ================================================= */
        animate: function () {
            if (!this.ctx || !this.canvas) return;

            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

            var type = this.settings.type || 'rain';

            switch (type) {
                case 'rain':
                    this.updateRain();
                    this.drawRain();
                    break;
                case 'snow':
                    this.updateSnow();
                    this.drawSnow();
                    break;
                case 'cloud':
                    this.updateCloud();
                    this.drawCloud();
                    break;
                case 'sunny':
                    this.updateSunny();
                    this.drawSunny();
                    break;
            }

            this.animationId = requestAnimationFrame(this.animate.bind(this));
        },

        /* =================================================
         * EVENT HANDLERS
         * ================================================= */
        handleMouseMove: function (e) {
            var rect     = this.canvas.getBoundingClientRect();
            this.mouse.x = e.clientX - rect.left;
            this.mouse.y = e.clientY - rect.top;
        },

        handleMouseLeave: function () {
            this.mouse.x = null;
            this.mouse.y = null;
        },

        /* =================================================
         * DESTROY
         * ================================================= */
        destroy: function () {
            if (this.animationId) cancelAnimationFrame(this.animationId);

            window.removeEventListener('resize',      this.resizeHandler);
            this.element.removeEventListener('mousemove',  this.mouseMoveHandler);
            this.element.removeEventListener('mouseleave', this.mouseLeaveHandler);

            if (this.canvas && this.canvas.parentNode) this.canvas.remove();

            if (this.settings.bg_color) this.element.style.backgroundColor = '';

            this.rainState  = null;
            this.snowState  = null;
            this.cloudState = null;
            this.sunnyState = null;
            this._stars     = [];
        }
    };

    /* =====================================================
     * BOOTSTRAP
     * ===================================================== */
    $(window).on('elementor/frontend/init', WeatherAnimation.init);

    $(window).on('load', function () {
        $('.wafe-wrapper').each(function () {
            var element = this;
            var data    = $(this).data('wafe') || {};
            if (data && !WeatherAnimation.instances[element]) {
                WeatherAnimation.instances[element] = new WeatherAnimator(element, data);
            }
        });
    });

})(jQuery);