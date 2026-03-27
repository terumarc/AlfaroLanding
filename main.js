document.addEventListener('DOMContentLoaded', () => {
    // Scroll Reveal Logic
    const revealElements = document.querySelectorAll('.reveal-on-scroll');

    const revealOnScroll = () => {
        revealElements.forEach(el => {
            const rect = el.getBoundingClientRect();
            if (rect.top < window.innerHeight - 100) {
                el.classList.add('visible');
            }
        });
    };

    window.addEventListener('scroll', revealOnScroll);
    revealOnScroll(); // Initial check

    // Force Play Videos (Safari fix for autoplay)
    const forcePlayVideos = () => {
        const videos = document.querySelectorAll('video');
        videos.forEach(video => {
            video.muted = true;
            video.defaultMuted = true;
            video.setAttribute('muted', '');
            video.setAttribute('playsinline', '');

            const playVideo = () => {
                video.load();
                const playPromise = video.play();
                if (playPromise !== undefined) {
                    playPromise.catch(() => {
                        // Autoplay was prevented
                        const playOnInteraction = () => {
                            video.play();
                            document.removeEventListener('click', playOnInteraction);
                            document.removeEventListener('touchstart', playOnInteraction);
                        };
                        document.addEventListener('click', playOnInteraction);
                        document.addEventListener('touchstart', playOnInteraction);
                    });
                }
            };

            playVideo();
        });
    };

    forcePlayVideos();
    window.addEventListener('load', forcePlayVideos);

    // Modal Logic
    const modal = document.getElementById('bookingModal');
    const openBtns = document.querySelectorAll('.header-cta, .btn-waitlist, .btn-white');
    const closeBtn = document.getElementById('closeModal');
    const bookingForm = document.getElementById('bookingForm');
    const dateInput = document.getElementById('appointmentDate');

    if (modal) {
        // Set min date to today
        const today = new Date().toISOString().split('T')[0];
        if (dateInput) dateInput.setAttribute('min', today);

        openBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                modal.classList.add('active');
                document.body.style.overflow = 'hidden'; // Prevent scrolling when modal is open
            });
        });

        const closeModal = () => {
            modal.classList.remove('active');
            document.body.style.overflow = ''; // Restore scrolling
        };

        if (closeBtn) closeBtn.addEventListener('click', closeModal);

        // Close on outside click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });

        // Unified Contact Form Logic (Modal + Footer)
        const allContactForms = document.querySelectorAll('.cta-contact-form');

        allContactForms.forEach(form => {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                const btn = form.querySelector('.form-submit-btn');
                const originalText = btn ? btn.textContent : 'ENVIAR';

                if (btn) {
                    btn.textContent = 'Enviando...';
                    btn.disabled = true;
                    btn.style.opacity = '0.7';
                }

                // Simulate API call
                setTimeout(() => {
                    if (btn) {
                        btn.textContent = '¡Mensaje Enviado!';
                        btn.style.background = '#00ff7f';
                        btn.style.color = '#000';
                    }

                    setTimeout(() => {
                        const modal = document.getElementById('bookingModal');
                        if (modal && modal.classList.contains('active')) {
                            modal.classList.remove('active');
                            document.body.style.overflow = '';
                        }

                        if (btn) {
                            btn.textContent = originalText;
                            btn.style.background = '';
                            btn.style.color = '';
                            btn.disabled = false;
                            btn.style.opacity = '1';
                        }
                        form.reset();
                    }, 2000);
                }, 1500);
            });
        });
    }

    const track = document.querySelector('.slider-track');

    if (track) {
        let isDown = false;
        let startX;
        let dragOffset = 0;
        const duration = 80000; // Sync with CSS 80s

        const getTranslateX = () => {
            const style = window.getComputedStyle(track);
            const matrix = new DOMMatrix(style.transform);
            return matrix.e; // Use 'e' for translateX in DOMMatrix
        };

        const handlePointerDown = (e) => {
            if (e.pointerType === 'mouse' && e.button !== 0) return;

            isDown = true;
            track.setPointerCapture(e.pointerId);

            const currentTransform = getTranslateX();
            track.style.animation = 'none';
            track.style.transform = `translate3d(${currentTransform}px, 0, 0)`;

            startX = e.clientX;
            dragOffset = currentTransform;
            track.style.transition = 'none';
            track.classList.remove('syncing');

            document.body.style.userSelect = 'none';
            track.style.pointerEvents = 'none';
            track.querySelectorAll('.feature-card').forEach(card => card.style.pointerEvents = 'none');
        };

        const handlePointerUp = (e) => {
            if (!isDown) return;
            isDown = false;
            track.releasePointerCapture(e.pointerId);
            track.style.pointerEvents = '';
            track.querySelectorAll('.feature-card').forEach(card => card.style.pointerEvents = '');

            const trackWidth = track.offsetWidth / 2;
            let currentX = getTranslateX();

            while (currentX > 0) currentX -= trackWidth;
            while (currentX < -trackWidth) currentX += trackWidth;

            const progress = Math.abs(currentX / trackWidth);
            const newDelay = -(progress * duration);

            track.style.transform = '';
            track.style.animation = `ticker ${duration}ms linear infinite`;
            track.style.animationDelay = `${newDelay}ms`;
            track.style.animationPlayState = 'running';
        };

        const handlePointerMove = (e) => {
            if (!isDown) return;

            const x = e.clientX;
            const walk = (x - startX);
            const newTransform = dragOffset + walk;

            const trackWidth = track.offsetWidth / 2;
            let finalTransform = newTransform;

            while (finalTransform > 0) finalTransform -= trackWidth;
            while (finalTransform < -trackWidth) finalTransform += trackWidth;

            track.style.transform = `translate3d(${finalTransform}px, 0, 0)`;
        };

        track.addEventListener('pointerdown', handlePointerDown);
        track.addEventListener('pointermove', handlePointerMove);
        track.addEventListener('pointerup', handlePointerUp);
        track.addEventListener('pointercancel', handlePointerUp);

        track.querySelectorAll('.feature-card').forEach(card => {
            const img = card.querySelector('img');
            if (img) img.setAttribute('draggable', 'false');

            card.addEventListener('click', (e) => {
                if (isDown || (startX && Math.abs(startX - e.clientX) > 5)) {
                    e.preventDefault();
                    e.stopPropagation();
                }
            }, true);
        });
    }

    // 3D Team Carousel Logic
    const teamCarousel = document.querySelector('.carousel-3d');
    const teamItems = document.querySelectorAll('.carousel-item');
    const teamPrev = document.querySelector('.carousel-prev');
    const teamNext = document.querySelector('.carousel-next');
    const teamIndicators = document.querySelectorAll('.carousel-indicator span');

    if (teamCarousel && teamItems.length > 0) {
        let currentTeamIndex = 0;
        const totalTeamSlots = 6; // Fixed 6 slots for better visibility
        const rotateAngle = 60; // 360 / 6

        const updateTeamCarousel = () => {
            // We map the 4 items to slots: 0, 1, 2, 5 (300deg)
            // But with JS we can just rotate the whole container.
            // Items are already placed at 0, 60, 120, 300 in CSS.
            // We want the current index to be at the front (0deg).

            // Map index to the slot rotation
            let rotation = 0;
            if (currentTeamIndex === 0) rotation = 0;
            if (currentTeamIndex === 1) rotation = -60;
            if (currentTeamIndex === 2) rotation = -120;
            if (currentTeamIndex === 3) rotation = 60; // Slot 300deg comes to front at +60deg rotation

            teamCarousel.style.transform = `rotateY(${rotation}deg)`;

            // Update indicators
            teamIndicators.forEach((ind, i) => {
                ind.classList.toggle('active', i === currentTeamIndex);
            });
        };

        if (teamNext) {
            teamNext.addEventListener('click', () => {
                currentTeamIndex = (currentTeamIndex + 1) % 4;
                updateTeamCarousel();
            });
        }

        if (teamPrev) {
            teamPrev.addEventListener('click', () => {
                currentTeamIndex = (currentTeamIndex - 1 + 4) % 4;
                updateTeamCarousel();
            });
        }

        // Optional: Auto-rotation
        let teamAutoRotate = setInterval(() => {
            currentTeamIndex = (currentTeamIndex + 1) % 4;
            updateTeamCarousel();
        }, 5000);

        // Pause on hover
        const teamSection = document.querySelector('.team-section');
        if (teamSection) {
            teamSection.addEventListener('mouseenter', () => clearInterval(teamAutoRotate));
            teamSection.addEventListener('mouseleave', () => {
                teamAutoRotate = setInterval(() => {
                    currentTeamIndex = (currentTeamIndex + 1) % totalTeamSlots;
                    updateTeamCarousel();
                }, 5000);
            });
        }
    }
});

// --- System Notification Logic (Guaranteed Execution) ---
(function () {
    console.log("Alfaro Notification Script: Loaded");
    // alert("Script Alfaro Cargado"); // Debug Alert
    const banner = document.getElementById('sn-box');
    const btnAccept = document.getElementById('sn-accept');
    const btnSettings = document.getElementById('sn-settings');
    const openCookiesLink = document.getElementById('open-cookies');
    const legalModal = document.getElementById('legalModal');
    const closeLegalBtn = document.getElementById('closeLegalModal');
    const saveLegalBtn = document.getElementById('save-sn-config');

    const STORAGE_KEY = 'alfaro-legal-v2';
    // localStorage.removeItem(STORAGE_KEY); // Uncomment this to reset for user testing if they can't see it once

    function hideBanner() {
        localStorage.setItem(STORAGE_KEY, 'true');
        if (banner) banner.classList.remove('active');
        if (legalModal) legalModal.classList.remove('active');
    }

    if (banner) {
        if (!localStorage.getItem(STORAGE_KEY)) {
            banner.classList.add('active');
        } else {
            banner.classList.remove('active');
        }

        if (btnAccept) {
            btnAccept.addEventListener('click', hideBanner);
        }

        if (btnSettings) {
            btnSettings.addEventListener('click', () => {
                if (legalModal) legalModal.classList.add('active');
            });
        }
    }

    if (openCookiesLink) {
        openCookiesLink.addEventListener('click', (e) => {
            e.preventDefault();
            if (legalModal) legalModal.classList.add('active');
        });
    }

    if (closeLegalBtn) {
        closeLegalBtn.addEventListener('click', () => {
            if (legalModal) legalModal.classList.remove('active');
        });
    }

    if (saveLegalBtn) {
        saveLegalBtn.addEventListener('click', hideBanner);
    }

    // Global trigger for legal modal from footer or other links
    document.querySelectorAll('[data-open-legal]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetTab = link.getAttribute('data-tab');
            if (legalModal) {
                legalModal.classList.add('active');
                // Auto switch tab if target specified
                if (targetTab) {
                    const tabBtn = document.querySelector(`.legal-tab[data-target="${targetTab}"]`);
                    if (tabBtn) tabBtn.click();
                }
            }
        });
    });

    // Modal Tabs Logic
    const tabs = document.querySelectorAll('.legal-tab');
    const sections = document.querySelectorAll('.legal-section');

    function activateTab(tabBtn) {
        if (!tabBtn) return;
        const target = tabBtn.getAttribute('data-target');

        // Update tabs state
        tabs.forEach(t => {
            t.style.background = 'transparent';
            t.classList.remove('active');
        });
        tabBtn.style.background = '#fff';
        tabBtn.classList.add('active');

        // Update content visibility
        sections.forEach(s => s.style.display = 'none');
        const targetSect = document.getElementById(target);
        if (targetSect) targetSect.style.display = 'block';
    }

    tabs.forEach(tab => {
        tab.addEventListener('click', () => activateTab(tab));
    });

    // Handle internal links within legal text to switch tabs
    document.querySelectorAll('.switch-legal-tab').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const target = link.getAttribute('data-target');
            const tabBtn = document.querySelector(`.legal-tab[data-target="${target}"]`);
            if (tabBtn) activateTab(tabBtn);
        });
    });

    // Technology Carousel Logic
    const techNavItems = document.querySelectorAll('.tech-nav-item');
    const techImages = document.querySelectorAll('.tech-visual img');
    const techTitle = document.getElementById('tech-title');
    const techDesc = document.getElementById('tech-desc');
    let currentTechIndex = 0;
    let techAutoPlay;

    const titles = [
        "TAC 3D",
        "Ortopantomografía",
        "Telerradiografía",
        "Osstell",
        "Philips ZOOM"
    ];

    const descriptions = [
        "La tomografía axial computarizada dental (TAC) es un tipo especial de equipo de rayos X con el que obtenemos impresiones precisas de la anatomía bucal. Las reconstrucciones maxilares en 3D que hace posible esta tecnología nos ayudan enormemente a planificar las intervenciones con gran precisión.",
        "La ortopantomografía reproduce con exactitud el interior de la cavidad oral. Se trata de una técnica radiológica que recrea de forma detallada todas las estructuras óseas faciales en una misma imagen para un diagnóstico global inmediato.",
        "Fundamental en tratamientos de ortodoncia, la telerradiografía permite la medición de los ángulos y proporciones de la estructura facial ósea para recrear con exactitud su relación y planificar el movimiento dental.",
        "Un sistema no invasivo que indica el momento exacto en el que un implante dental está listo para la carga. Permite tratamientos más predecibles y evalúa la osteointegración sin poner en riesgo la cicatrización.",
        "Tecnología LED que permite blanquear la sonrisa de forma segura y eficaz. El fosfato de calcio amorfo (ACP) protege el esmalte mientras se consiguen resultados rápidos y una menor sensibilidad dental."
    ];

    function showTech(index) {
        if (!techNavItems[index]) return;
        techNavItems.forEach(item => item.classList.remove('active'));
        techImages.forEach(img => img.classList.remove('active'));

        techNavItems[index].classList.add('active');
        techImages[index].classList.add('active');

        if (techTitle) techTitle.textContent = titles[index];

        if (techDesc) {
            techDesc.style.opacity = '0';
            setTimeout(() => {
                techDesc.textContent = descriptions[index];
                techDesc.style.opacity = '1';
            }, 300);
        }
        currentTechIndex = index;
    }

    if (techNavItems.length > 0) {
        techNavItems.forEach((item, idx) => {
            item.addEventListener('click', () => {
                showTech(idx);
                resetTechInterval();
            });
        });

        techAutoPlay = setInterval(() => {
            let nextIdx = (currentTechIndex + 1) % techNavItems.length;
            showTech(nextIdx);
        }, 4000);
    }

    function resetTechInterval() {
        clearInterval(techAutoPlay);
        techAutoPlay = setInterval(() => {
            let nextIdx = (currentTechIndex + 1) % techNavItems.length;
            showTech(nextIdx);
        }, 4000);
    }
})();

