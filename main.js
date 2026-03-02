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

    // Modal Logic
    const modal = document.getElementById('bookingModal');
    const openBtns = document.querySelectorAll('.header-cta, .btn-waitlist, .btn-white');
    const closeBtn = document.getElementById('closeModal');
    const bookingForm = document.getElementById('bookingForm');
    const dateInput = document.getElementById('appointmentDate');

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

    closeBtn.addEventListener('click', closeModal);

    // Close on outside click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });

    // Form Submission
    bookingForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const btn = bookingForm.querySelector('.form-submit');
        btn.textContent = 'Enviando...';

        // Simulate API call
        setTimeout(() => {
            btn.textContent = '¡Solicitud Enviada!';
            btn.style.background = '#00ff00';
            btn.style.color = '#000';

            setTimeout(() => {
                closeModal();
                btn.textContent = 'Enviar Solicitud';
                btn.style.background = '#fff';
                bookingForm.reset();
            }, 2000);
        }, 1500);
    });

    const track = document.querySelector('.slider-track');
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
        // Only trigger on left mouse button or touch
        if (e.pointerType === 'mouse' && e.button !== 0) return;

        isDown = true;
        track.setPointerCapture(e.pointerId);
        track.style.animationPlayState = 'paused';
        startX = e.clientX; // Switch to clientX
        dragOffset = getTranslateX();
        track.style.transition = 'none';
        track.classList.remove('syncing');

        // Disable text selection during drag
        document.body.style.userSelect = 'none';
    };

    const handlePointerUp = (e) => {
        if (!isDown) return;
        isDown = false;
        track.releasePointerCapture(e.pointerId);
        document.body.style.userSelect = '';

        const trackWidth = track.offsetWidth / 2;
        let currentX = getTranslateX();

        // Normalize position to [-trackWidth, 0] for seamless wrap
        while (currentX > 0) currentX -= trackWidth;
        while (currentX < -trackWidth) currentX += trackWidth;

        const progress = Math.abs(currentX / trackWidth);
        const newDelay = -(progress * duration);

        // Snap animation state
        track.style.transform = '';
        track.style.animationDelay = `${newDelay}ms`;

        // Ensure the restart is clean
        requestAnimationFrame(() => {
            track.style.animationPlayState = 'running';
        });
    };

    const handlePointerMove = (e) => {
        if (!isDown) return;

        const x = e.clientX; // Switch to clientX
        const walk = (x - startX);
        const newTransform = dragOffset + walk;

        const trackWidth = track.offsetWidth / 2;
        let finalTransform = newTransform;

        // Wrap logic during drag
        while (finalTransform > 0) finalTransform -= trackWidth;
        while (finalTransform < -trackWidth) finalTransform += trackWidth;

        track.style.transform = `translate3d(${finalTransform}px, 0, 0)`;
    };

    // Unified Pointer Events
    track.addEventListener('pointerdown', handlePointerDown);
    track.addEventListener('pointermove', handlePointerMove);
    track.addEventListener('pointerup', handlePointerUp);
    track.addEventListener('pointercancel', handlePointerUp);

    track.querySelectorAll('.feature-card').forEach(card => {
        const img = card.querySelector('img');
        if (img) img.setAttribute('draggable', 'false');

        card.addEventListener('click', (e) => {
            if (startX && Math.abs(startX - e.pageX) > 5) {
                e.preventDefault();
                e.stopPropagation();
            }
        }, true);
    });

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

        teamNext.addEventListener('click', () => {
            currentTeamIndex = (currentTeamIndex + 1) % 4;
            updateTeamCarousel();
        });

        teamPrev.addEventListener('click', () => {
            currentTeamIndex = (currentTeamIndex - 1 + 4) % 4;
            updateTeamCarousel();
        });

        // Optional: Auto-rotation
        let teamAutoRotate = setInterval(() => {
            currentTeamIndex = (currentTeamIndex + 1) % 4;
            updateTeamCarousel();
        }, 5000);

        // Pause on hover
        const teamSection = document.querySelector('.team-section');
        teamSection.addEventListener('mouseenter', () => clearInterval(teamAutoRotate));
        teamSection.addEventListener('mouseleave', () => {
            teamAutoRotate = setInterval(() => {
                currentTeamIndex = (currentTeamIndex + 1) % totalTeamItems;
                updateTeamCarousel();
            }, 5000);
        });
    }
});
