document.addEventListener('DOMContentLoaded', () => {
    // --- Scroll Reveal Logic ---
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

    // --- Force Play Videos (Safari fix for autoplay) ---
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

    // --- Nav dropdowns (tap / coarse pointer; desktop uses CSS hover + focus-within) ---
    const navDropdownWraps = document.querySelectorAll('.nav-dropdown-wrap');
    const prefersNavFineHover =
        typeof window.matchMedia !== 'undefined' &&
        window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    const closeAllNavDropdowns = () => {
        navDropdownWraps.forEach((wrap) => {
            wrap.classList.remove('is-open');
            const b = wrap.querySelector('.nav-trigger');
            if (b) b.setAttribute('aria-expanded', 'false');
        });
    };

    if (navDropdownWraps.length && !prefersNavFineHover) {
        navDropdownWraps.forEach((wrap) => {
            const btn = wrap.querySelector('.nav-trigger');
            if (!btn) return;
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const wasOpen = wrap.classList.contains('is-open');
                closeAllNavDropdowns();
                if (!wasOpen) {
                    wrap.classList.add('is-open');
                    btn.setAttribute('aria-expanded', 'true');
                }
            });
        });
        document.addEventListener('click', closeAllNavDropdowns);
        navDropdownWraps.forEach((wrap) => {
            wrap.addEventListener('click', (e) => e.stopPropagation());
        });
        document.querySelectorAll('.nav-submenu a').forEach((link) => {
            link.addEventListener('click', () => closeAllNavDropdowns());
        });
    }

    document.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape') return;
        closeAllNavDropdowns();
    });

    // --- Header nav: barra más oscura sobre fondos claros (no hero / contacto / footer) ---
    const headerEl = document.querySelector('header');
    const heroEl = document.querySelector('.hero-wrapper');
    const contactEl = document.querySelector('#contacto');
    const footerEl = document.querySelector('.main-footer');

    let navThemeRaF = false;
    const updateHeaderNavTheme = () => {
        if (!headerEl || !heroEl) return;
        const headerBottom = headerEl.getBoundingClientRect().bottom;
        const heroBottom = heroEl.getBoundingClientRect().bottom;
        const pastHero = heroBottom < headerBottom + 28;

        let inContact = false;
        if (contactEl) {
            const cr = contactEl.getBoundingClientRect();
            inContact = cr.bottom > 0 && cr.top < window.innerHeight;
        }

        let inFooter = false;
        if (footerEl) {
            const fr = footerEl.getBoundingClientRect();
            inFooter = fr.bottom > 0 && fr.top < window.innerHeight;
        }

        const overLightBg = pastHero && !inContact && !inFooter;
        headerEl.classList.toggle('header--over-light', overLightBg);
    };

    const scheduleNavTheme = () => {
        if (navThemeRaF) return;
        navThemeRaF = true;
        requestAnimationFrame(() => {
            navThemeRaF = false;
            updateHeaderNavTheme();
        });
    };

    window.addEventListener('scroll', scheduleNavTheme, { passive: true });
    window.addEventListener('resize', scheduleNavTheme);
    updateHeaderNavTheme();

    // --- Booking Modal Logic ---
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
                document.body.style.overflow = 'hidden';
            });
        });

        const closeModal = () => {
            modal.classList.remove('active');
            document.body.style.overflow = '';
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
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const btn = form.querySelector('.form-submit-btn');
                const originalText = btn ? btn.textContent : 'ENVIAR';

                if (btn) {
                    btn.textContent = 'Enviando...';
                    btn.disabled = true;
                    btn.style.opacity = '0.7';
                }

                // Collect data
                const formData = new FormData(form);
                const action = form.getAttribute('action');

                try {
                    const response = await fetch(action, {
                        method: 'POST',
                        body: formData,
                        headers: {
                            'Accept': 'application/json'
                        }
                    });

                    if (response.ok) {
                        if (btn) {
                            btn.textContent = '¡Mensaje Enviado!';
                            btn.style.background = '#00ff7f';
                            btn.style.color = '#000';
                        }
                        form.reset();
                    } else {
                        throw new Error('Error en el servidor');
                    }
                } catch (error) {
                    if (btn) {
                        btn.textContent = 'Error al enviar';
                        btn.style.background = '#ff4444';
                    }
                } finally {
                    setTimeout(() => {
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
                    }, 2500);
                }
            });
        });
    }

    // --- Treatment cards: flip + detailed copy ---
    const TREATMENT_DETAILS = {
        '1': {
            title: 'Implantología',
            lead: 'Sustituimos piezas ausentes con implantes de titanio biocompatible integrados en el hueso maxilar o mandibular.',
            bullets: [
                'Planificación digital y cirugía guiada cuando el caso lo permite',
                'Opciones de carga diferida o inmediata según diagnóstico',
                'Seguimiento de la osteointegración y hábitos de higiene',
                'Coronas atornilladas, puentes o prótesis sobre implantes',
            ],
        },
        '2': {
            title: 'Estética dental',
            lead: 'Armamos una sonrisa coherente con tu rostro: color, forma, proporción y simetría.',
            bullets: [
                'Blanqueamiento supervisado en consulta',
                'Carillas de composite o cerámica y diseño de sonrisa',
                'Recontorneados y cierres de espacios estéticos',
                'Planes conservadores siempre que sea posible',
            ],
        },
        '3': {
            title: 'Ortodoncia',
            lead: 'Alineamos dientes y corregimos la mordida con la técnica más adecuada a tu edad y estilo de vida.',
            bullets: [
                'Alineadores transparentes o brackets estéticos/metálicos',
                'Control de hábitos y referencias a ATM cuando procede',
                'Seguimiento activaciones y higiene interdental',
                'Fase de retención para mantener el resultado',
            ],
        },
        '4': {
            title: 'Odontopediatría',
            lead: 'Prevención y tratamiento adaptados a niños y adolescentes, con un enfoque tranquilo y pedagógico.',
            bullets: [
                'Revisiones periódicas y educación en higiene',
                'Selladores, fluoraciones y manejo de caries incipientes',
                'Primera visita para habituar y reducir ansiedad',
                'Derivación ortodoncia temprana si hace falta',
            ],
        },
        '5': {
            title: 'Rehabilitación oral',
            lead: 'Recuperamos función y estética cuando hay piezas muy deterioradas o ausentes.',
            bullets: [
                'Coronas y puentes sobre diente natural o implante',
                'Prótesis removibles, sobredentaduras y rehabilitaciones mixtas',
                'Planes por fases según urgencia y presupuesto',
                'Oclusión estable y comodidad al masticar',
            ],
        },
        '6': {
            title: 'Bruxismo',
            lead: 'Protegemos el esmalte y aliviamos tensión muscular y articular relacionada con el rechinar o apretar.',
            bullets: [
                'Férulas de descarga personalizadas',
                'Exploración de articulación temporomandibular',
                'Consejos de higiene del sueño y estrés',
                'Revisiones para ajustar la férula con el tiempo',
            ],
        },
        '7': {
            title: 'Endodoncia',
            lead: 'Conservamos la pieza natural tratando la pulpa infectada o irritada y sellando conductos con precisión.',
            bullets: [
                'Tratamiento de conductos con protocolos actuales',
                'Reconstrucción del muñón antes de corona si se precisa',
                'Alternativa a la extracción cuando el pronóstico es favorable',
                'Control clínico y radiográfico de la cicatrización',
            ],
        },
        '8': {
            title: 'Periodoncia',
            lead: 'Cuidamos encías y soporte óseo alrededor de los dientes para frenar la enfermedad periodontal.',
            bullets: [
                'Raspados, alisados radiculares y limpiezas de mantenimiento',
                'Instrucciones de higiene interdental personalizadas',
                'Seguimiento según la respuesta al tratamiento',
                'Coordinación con tu médico si hay factores sistémicos',
            ],
        },
        '9': {
            title: 'Ácido hialurónico',
            lead: 'Mejoramos volumen e hidratación perioral con material reabsorbible, en armonía con tu sonrisa.',
            bullets: [
                'Valoración estética facial y dental conjunta',
                'Protocolos con finos incrementos para resultados naturales',
                'Seguimiento post-tratamiento y recomendaciones',
                'Opciones reversibles y bien toleradas',
            ],
        },
    };

    const initTreatmentFlipCards = () => {
        document.querySelectorAll('#tratamientos .feature-card[data-treatment]').forEach((card) => {
            const id = card.dataset.treatment;
            const t = TREATMENT_DETAILS[id];
            if (!t || card.querySelector('.feature-card-inner')) return;

            const front = document.createElement('div');
            front.className = 'feature-card-face feature-card-front';
            const inner = document.createElement('div');
            inner.className = 'feature-card-inner';
            while (card.firstChild) front.appendChild(card.firstChild);

            const back = document.createElement('div');
            back.className = 'feature-card-face feature-card-back';
            const listItems = t.bullets.map((b) => `<li>${b}</li>`).join('');
            back.innerHTML = `
                <div class="card-back-content">
                    <h3>${t.title}</h3>
                    <p class="card-back-lead">${t.lead}</p>
                    <ul class="card-back-list">${listItems}</ul>
                    <p class="card-back-hint">Quita el cursor o el foco de la tarjeta para volver</p>
                </div>`;

            inner.appendChild(front);
            inner.appendChild(back);
            card.appendChild(inner);

            card.setAttribute('role', 'button');
            card.setAttribute('tabindex', '0');
            card.setAttribute('aria-expanded', 'false');
            card.setAttribute('aria-label', `${t.title}: pasa el cursor para ver más información`);
        });
    };

    initTreatmentFlipCards();

    // --- Treatment Slider Logic ---
    const track = document.querySelector('.slider-track');

    if (track) {
        let isDown = false;
        let startX;
        let dragOffset = 0;
        const duration = 80000;
        const prefersFineHover =
            typeof window.matchMedia !== 'undefined' &&
            window.matchMedia('(hover: hover) and (pointer: fine)').matches;

        const getTranslateX = () => {
            const style = window.getComputedStyle(track);
            const matrix = new DOMMatrix(style.transform);
            return matrix.e;
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
            /* Do not set pointer-events: none here — it prevents click from firing on cards after tap/click. */
        };

        const handlePointerUp = (e) => {
            if (!isDown) return;
            isDown = false;
            track.releasePointerCapture(e.pointerId);

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

        track.querySelectorAll('.feature-card').forEach((card) => {
            const img = card.querySelector('img');
            if (img) img.setAttribute('draggable', 'false');

            const setFlipped = (on) => {
                card.classList.toggle('is-flipped', on);
                card.setAttribute('aria-expanded', on ? 'true' : 'false');
            };

            if (prefersFineHover) {
                card.addEventListener('mouseenter', () => setFlipped(true));
                card.addEventListener('mouseleave', () => setFlipped(false));
                card.addEventListener('focusin', () => setFlipped(true));
                card.addEventListener('focusout', (e) => {
                    if (!card.contains(e.relatedTarget)) setFlipped(false);
                });
            } else {
                card.addEventListener('click', (e) => {
                    e.stopPropagation();
                    setFlipped(!card.classList.contains('is-flipped'));
                });
            }
        });
    }

    // --- 3D Team Carousel Logic ---
    const teamCarousel = document.querySelector('.carousel-3d');
    const teamItems = document.querySelectorAll('.carousel-item');
    const teamPrev = document.querySelector('.carousel-prev');
    const teamNext = document.querySelector('.carousel-next');
    const teamIndicators = document.querySelectorAll('.carousel-indicator span');

    if (teamCarousel && teamItems.length > 0) {
        let currentTeamIndex = 0;
        const totalTeamSlots = 6;
        const translateZ = 350;

        const updateTeamCarousel = () => {
            let rotation = 0;
            if (currentTeamIndex === 0) rotation = 0;
            if (currentTeamIndex === 1) rotation = -60;
            if (currentTeamIndex === 2) rotation = -120;
            if (currentTeamIndex === 3) rotation = 60;

            teamCarousel.style.transform = `rotateY(${rotation}deg)`;

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

        let teamAutoRotate = setInterval(() => {
            currentTeamIndex = (currentTeamIndex + 1) % 4;
            updateTeamCarousel();
        }, 5000);

        const teamSection = document.querySelector('.team-section');
        if (teamSection) {
            teamSection.addEventListener('mouseenter', () => clearInterval(teamAutoRotate));
            teamSection.addEventListener('mouseleave', () => {
                teamAutoRotate = setInterval(() => {
                    currentTeamIndex = (currentTeamIndex + 1) % 4;
                    updateTeamCarousel();
                }, 5000);
            });
        }
    }

    // --- Legal Notifications & Modal Logic ---
    const banner = document.getElementById('sn-box');
    const btnAccept = document.getElementById('sn-accept');
    const btnSettings = document.getElementById('sn-settings');
    const openCookiesLink = document.getElementById('open-cookies');
    const legalModal = document.getElementById('legalModal');
    const closeLegalBtn = document.getElementById('closeLegalModal');
    const saveLegalBtn = document.getElementById('save-sn-config');

    const STORAGE_KEY = 'alfaro-legal-v3';

    function hideBanner() {
        localStorage.setItem(STORAGE_KEY, 'true');
        if (banner) banner.classList.remove('active');
        if (legalModal) legalModal.classList.remove('active');
    }

    if (banner) {
        if (!localStorage.getItem(STORAGE_KEY)) {
            setTimeout(() => {
                banner.classList.add('active');
            }, 1000);
        }

        if (btnAccept) btnAccept.addEventListener('click', hideBanner);

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

    // Global triggers for legal modal (from footer or forms)
    document.querySelectorAll('[data-open-legal]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetTab = link.getAttribute('data-tab');
            if (legalModal) {
                legalModal.classList.add('active');
                if (targetTab) {
                    const tabBtn = document.querySelector(`.legal-tab[data-target="${targetTab}"]`);
                    if (tabBtn) tabBtn.click();
                }
            }
        });
    });

    // Legal Modal Tabs
    const tabs = document.querySelectorAll('.legal-tab');
    const sections = document.querySelectorAll('.legal-section');

    function activateTab(tabBtn) {
        if (!tabBtn) return;
        const target = tabBtn.getAttribute('data-target');

        tabs.forEach(t => {
            t.style.background = 'transparent';
            t.classList.remove('active');
        });
        tabBtn.style.background = '#fff';
        tabBtn.classList.add('active');

        sections.forEach(s => s.style.display = 'none');
        const targetSect = document.getElementById(target);
        if (targetSect) targetSect.style.display = 'block';
    }

    tabs.forEach(tab => {
        tab.addEventListener('click', () => activateTab(tab));
    });

    // Internal links within legal text
    document.querySelectorAll('.switch-legal-tab').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const target = link.getAttribute('data-target');
            const tabBtn = document.querySelector(`.legal-tab[data-target="${target}"]`);
            if (tabBtn) activateTab(tabBtn);
        });
    });

    // --- Technology Showcase Logic ---
    const techNavItems = document.querySelectorAll('.tech-nav-item');
    const techImages = document.querySelectorAll('.tech-visual-media img');
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

    function resetTechInterval() {
        clearInterval(techAutoPlay);
        techAutoPlay = setInterval(() => {
            let nextIdx = (currentTechIndex + 1) % techNavItems.length;
            showTech(nextIdx);
        }, 4000);
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
});
