const header = document.getElementById('header')
const navMenu = document.getElementById('nav-menu')
const navToggle = document.getElementById('nav-toggle')
const navClose = document.getElementById('nav-close')
const navLinks = document.querySelectorAll('.nav-link')
const sections = document.querySelectorAll('section[id]')
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
let scrollAnimationFrame
let rootScrollBehavior
let isProgrammaticScrollActive = false

const getHeaderOffset = () => (header ? header.getBoundingClientRect().height + 28 : 96)

function setRootScrollBehavior(value) {
    document.documentElement.style.scrollBehavior = value
}

function startProgrammaticScroll() {
    cancelAnimationFrame(scrollAnimationFrame)
    if (!isProgrammaticScrollActive) {
        rootScrollBehavior = document.documentElement.style.scrollBehavior
    }

    isProgrammaticScrollActive = true
    setRootScrollBehavior('auto')
}

function finishProgrammaticScroll() {
    setRootScrollBehavior(rootScrollBehavior || '')
    isProgrammaticScrollActive = false
}

function setMenuState(isOpen) {
    if (!navMenu || !navToggle) return

    navMenu.classList.toggle('show-menu', isOpen)
    navToggle.setAttribute('aria-expanded', String(isOpen))
    if (isOpen) {
        setTimeout(updateIndicators, 50)
    }
}

function handleKeyboardToggle(event, action) {
    if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        action()
    }
}

/*==================== SHOW / HIDE MENU ====================*/
if (navToggle) {
    navToggle.addEventListener('click', () => {
        setMenuState(!navMenu.classList.contains('show-menu'))
    })

    navToggle.addEventListener('keydown', event => {
        handleKeyboardToggle(event, () => setMenuState(!navMenu.classList.contains('show-menu')))
    })
}

if (navClose) {
    navClose.addEventListener('click', () => setMenuState(false))
    navClose.addEventListener('keydown', event => {
        handleKeyboardToggle(event, () => setMenuState(false))
    })
}

function setActiveLink(sectionId) {
    navLinks.forEach(link => {
        link.classList.toggle('active-link', link.getAttribute('href') === `#${sectionId}`)
    })
    updateIndicators()
}

function scrollToSection(target) {
    const targetTop = target.id === 'hero' ? 0 : Math.round(target.getBoundingClientRect().top + window.pageYOffset)
    const nextScrollY = Math.max(targetTop, 0)

    startProgrammaticScroll()

    if (prefersReducedMotion.matches) {
        window.scrollTo({ top: nextScrollY, behavior: 'auto' })
        finishProgrammaticScroll()
        return
    }

    const startScrollY = window.pageYOffset
    const distance = nextScrollY - startScrollY
    const duration = Math.min(560, Math.max(260, Math.abs(distance) * .22))
    const startedAt = performance.now()

    function animateScroll(now) {
        const progress = Math.min((now - startedAt) / duration, 1)
        const easedProgress = 1 - Math.pow(1 - progress, 3)

        window.scrollTo({ top: startScrollY + distance * easedProgress, behavior: 'auto' })

        if (progress < 1) {
            scrollAnimationFrame = requestAnimationFrame(animateScroll)
        } else {
            finishProgrammaticScroll()
        }
    }

    scrollAnimationFrame = requestAnimationFrame(animateScroll)
}

/*==================== NAVIGATION & ANCHOR LINK ACTIONS ====================*/
document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', event => {
        const targetId = link.getAttribute('href')
        if (!targetId || targetId === '#') return
        const target = document.querySelector(targetId)

        if (!target) return

        event.preventDefault()
        setMenuState(false)
        setActiveLink(target.id)
        scrollToSection(target)
    })
})

/*==================== SCROLL SECTIONS ACTIVE LINK & TIMELINE PROGRESS ====================*/
let ticking = false

/* Education Timeline Continuous Scroll-Driven Progress */
function updateEducationTimelineProgress() {
    const timeline = document.getElementById('education-timeline')
    const trackFill = document.getElementById('education-track-fill')
    if (!timeline || !trackFill) return

    const milestones = timeline.querySelectorAll('.education-milestone')
    if (!milestones.length) return

    const firstNode = milestones[0].querySelector('.education-milestone-node')
    const lastNode = milestones[milestones.length - 1].querySelector('.education-milestone-node')
    if (!firstNode || !lastNode) return

    const firstRect = firstNode.getBoundingClientRect()
    const lastRect = lastNode.getBoundingClientRect()
    const totalDistance = lastRect.top - firstRect.top

    if (totalDistance <= 0) return

    // Trigger line in viewport: ~62% down from viewport top
    const triggerY = window.innerHeight * 0.62
    const currentProgressPx = Math.min(Math.max(triggerY - firstRect.top, 0), totalDistance)
    const progressPercent = (currentProgressPx / totalDistance) * 100

    trackFill.style.height = `${progressPercent}%`

    // Activate milestone nodes reached by scroll progress
    milestones.forEach(milestone => {
        const node = milestone.querySelector('.education-milestone-node')
        if (!node) return
        const nodeRect = node.getBoundingClientRect()
        const isReached = triggerY >= nodeRect.top - 8
        milestone.classList.toggle('is-active', isReached)
    })
}

function updateActiveSection() {
    const scrollPosition = window.scrollY + 120
    let activeSectionId = sections[0] ? sections[0].id : null

    sections.forEach(section => {
        if (scrollPosition >= section.offsetTop) {
            activeSectionId = section.id
        }
    })

    if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 2 && sections.length) {
        activeSectionId = sections[sections.length - 1].id
    }

    if (activeSectionId) {
        setActiveLink(activeSectionId)
    }
}

function requestActiveSectionUpdate() {
    if (ticking) return

    window.requestAnimationFrame(() => {
        updateActiveSection()
        updateEducationTimelineProgress()
        ticking = false
    })

    ticking = true
}

window.addEventListener('scroll', requestActiveSectionUpdate)
window.addEventListener('resize', () => {
    requestActiveSectionUpdate()
    updateIndicators()
})
window.addEventListener('load', () => {
    requestActiveSectionUpdate()
    updateIndicators()
})

/*==================== COMPACT HEADER & LIQUID GLASS BACKDROP ====================*/
const navGlassBackdrop = document.getElementById('nav-glass-backdrop')

function scrollHeader() {
    if (!header) return

    const wasScrolled = header.classList.contains('scroll-header')
    const isScrolled = window.scrollY >= 64
    if (wasScrolled !== isScrolled) {
        header.classList.toggle('scroll-header', isScrolled)
        if (navGlassBackdrop) {
            navGlassBackdrop.classList.toggle('is-active', isScrolled)
        }
        setTimeout(updateIndicators, 60)
    }
}

window.addEventListener('scroll', scrollHeader)
window.addEventListener('load', scrollHeader)

/*==================== SLIDING ACTIVE INDICATORS ====================*/
const indicatorTop = document.getElementById('nav-indicator-top')
const indicatorPill = document.getElementById('nav-indicator-pill')
const navContainer = document.querySelector('.nav-container')
const navList = document.querySelector('.nav-list')

function updateIndicators() {
    const activeLink = document.querySelector('.nav-link.active-link')
    if (!activeLink || !navContainer || !navList) return

    const linkRect = activeLink.getBoundingClientRect()
    const containerRect = navContainer.getBoundingClientRect()
    const listRect = navList.getBoundingClientRect()

    if (indicatorTop) {
        const leftOffset = linkRect.left - containerRect.left
        indicatorTop.style.width = `${linkRect.width}px`
        indicatorTop.style.transform = `translateX(${leftOffset}px)`
    }

    if (indicatorPill) {
        const leftOffset = linkRect.left - listRect.left
        const topOffset = linkRect.top - listRect.top
        indicatorPill.style.width = `${linkRect.width}px`
        indicatorPill.style.height = `${linkRect.height}px`
        indicatorPill.style.transform = `translate(${leftOffset}px, ${topOffset}px)`
    }
}

// Observe resize/layout changes to update indicators dynamically (handles CSS transitions)
if (typeof ResizeObserver !== 'undefined' && navContainer && navList) {
    const resizeObserver = new ResizeObserver(() => {
        updateIndicators()
    })
    resizeObserver.observe(navContainer)
    resizeObserver.observe(navList)
}

/*==================== DARK / LIGHT THEME SYSTEM ====================*/
const themeButton = document.getElementById('theme-toggle')
const themeIcon = document.getElementById('theme-icon')
const darkThemeClass = 'dark-theme'
const iconSun = 'ri-sun-line'
const iconMoon = 'ri-moon-line'

// Retrieve user's previous preference (if any)
const selectedTheme = localStorage.getItem('selected-theme')

// Detect system preference
const systemPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches

// Current theme helper
const getCurrentTheme = () => document.body.classList.contains(darkThemeClass) ? 'dark' : 'light'

// Initialize Theme based on saved selection or system setting
if (selectedTheme === 'dark' || (!selectedTheme && systemPrefersDark)) {
    document.body.classList.add(darkThemeClass)
    if (themeIcon) {
        themeIcon.classList.remove(iconMoon)
        themeIcon.classList.add(iconSun)
    }
} else {
    document.body.classList.remove(darkThemeClass)
    if (themeIcon) {
        themeIcon.classList.remove(iconSun)
        themeIcon.classList.add(iconMoon)
    }
}

// Toggle Theme on Button Click
if (themeButton) {
    themeButton.addEventListener('click', () => {
        document.body.classList.toggle(darkThemeClass)
        const isDark = document.body.classList.contains(darkThemeClass)

        if (themeIcon) {
            themeIcon.classList.toggle(iconSun, isDark)
            themeIcon.classList.toggle(iconMoon, !isDark)
        }

        // Save preference to localStorage
        localStorage.setItem('selected-theme', getCurrentTheme())

        // Recalculate indicators after theme switch
        setTimeout(updateIndicators, 50)
    })
}

/*==================== SCROLL REVEAL ANIMATIONS ====================*/
const revealElements = document.querySelectorAll('.reveal-on-scroll')

if (prefersReducedMotion.matches) {
    // Immediately reveal all elements without animation if user prefers reduced motion
    revealElements.forEach(el => el.classList.add('is-revealed'))
} else if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-revealed')
            } else {
                // Reset animation state when element leaves the viewport
                entry.target.classList.remove('is-revealed')
            }
        })
    }, {
        root: null,
        rootMargin: '0px 0px -40px 0px',
        threshold: 0.15
    })

    revealElements.forEach(el => revealObserver.observe(el))
} else {
    revealElements.forEach(el => el.classList.add('is-revealed'))
}

/*==================== CERTIFICATIONS INTERACTIVE ENGINE ====================*/
const certificatesData = [
    {
        title: "Preparing Future IT Professionals Through Enterprise Networking, Cybersecurity And Security Operations Center (SOC) Exposure Seminar",
        issuer: "Ardent Networks Inc.",
        date: "Jan 2026",
        image: "assets/certification/previews/Preparing Future IT Professionals Through Enterprise Networking, Cybersecurity, and Security Operations Center (SOC) Exposure Seminar.pdf.png"
    },
    {
        title: "Machine Learning using Python",
        issuer: "Simplilearn",
        date: "Apr 2025",
        image: "assets/certification/previews/Machine Learning using Python.pdf.png"
    },
    {
        title: "Kwentuhang Cybersecurity: The Role of Artificial Intelligence in Predicting and Mitigating Cyber Threats",
        issuer: "PICSPro (Philippine Institute of Cybersecurity Professionals)",
        date: "Oct 2025",
        image: "assets/certification/previews/Kwentuhang Cybersecurity The Role of Artificial Intelligence in Predicting and Mitigating Cyber Threats.pdf.png"
    },
    {
        title: "10th National Research Conference on Information Technology Education",
        issuer: "Integrated Society of Information Technology Enthusiasts (SITE) Inc.",
        date: "May 2025",
        image: "assets/certification/previews/10th National Research Conference on Information Technology Education.jpg"
    },
    {
        title: "Kwentuhang Cybersecurity: Digital Privacy and Cyber Laws in the Philippines: Understanding Your Rights Under RA 10173 and RA 10175",
        issuer: "PICSPro (Philippine Institute of Cybersecurity Professionals)",
        date: "Mar 2025",
        image: "assets/certification/previews/Kwentuhang Cybersecurity Digital Privacy and Cyber Laws in the Philippines Understanding Your Rights Under RA 10173 and RA 10175.pdf.png"
    },
    {
        title: "Networking Foundations: Networking Basics",
        issuer: "LinkedIn",
        date: "Nov 2023",
        image: "assets/certification/previews/Networking Foundations Networking Basics.pdf.png"
    },
    {
        title: "Artificial Intelligence Foundations: Thinking Machines",
        issuer: "LinkedIn",
        date: "Nov 2023",
        image: "assets/certification/previews/Artificial Intelligence Foundations Thinking Machines.jpeg"
    },
    {
        title: "\"Data Analytics & How to become a Data Analyst and Creating a Video Presentation and \"Developing a Mobile Cross-Platform Application\"",
        issuer: "Polytechnic University of the Philippines",
        date: "Jan 2023",
        image: "assets/certification/previews/Data Analytics and Mobile App.png"
    },
    {
        title: "Digital Literacy Training: Introduction to Data Analytics",
        issuer: "Department of Information and Communications Technology - Philippines",
        date: "Jan 2023",
        image: "assets/certification/previews/Digital Literacy Training Introduction to Data Analytics.pdf.png"
    },
    {
        title: "Internet Media and Information Literacy Training",
        issuer: "Department of Information and Communications Technology - Philippines",
        date: "Jan 2023",
        image: "assets/certification/previews/Internet Media and Information Literacy Training.pdf.png"
    },
    {
        title: "16th EdukCircle International Convention On Engineering and Computer Technology",
        issuer: "The EdukCircle",
        date: "May 2024",
        image: "assets/certification/previews/16th EdukCircle International Convention On Engineering and Computer Technology.pdf.png"
    },
    {
        title: "Tech Career Skills: Effective Technical Communication",
        issuer: "LinkedIn",
        date: "Nov 2023",
        image: "assets/certification/previews/Tech Career Skills Effective Technical Communication.pdf.png"
    },
    {
        title: "Tech Career Skills: Communication for Developers",
        issuer: "LinkedIn",
        date: "Nov 2023",
        image: "assets/certification/previews/Tech Career Skills Communication for Developers.jpeg"
    },
    {
        title: "Python Quick Start",
        issuer: "LinkedIn",
        date: "Nov 2023",
        image: "assets/certification/previews/Python Quick Start.jpeg"
    },
    {
        title: "The Future of Work: The Necessary Skills of Your Future Workforce",
        issuer: "LinkedIn",
        date: "Nov 2023",
        image: "assets/certification/previews/The Future of Work The Necessary Skills of Your Future Workforce.pdf.png"
    },
    {
        title: "Develop Interpersonal Skills for Inclusive Workplaces",
        issuer: "LinkedIn",
        date: "Nov 2023",
        image: "assets/certification/previews/Develop Interpersonal Skills for Inclusive Workplaces.pdf.png"
    },
    {
        title: "Communication Skills for Modern Management",
        issuer: "LinkedIn",
        date: "Nov 2023",
        image: "assets/certification/previews/Communication Skills for Modern Management.pdf.png"
    },
    {
        title: "Communication Foundations (2018)",
        issuer: "LinkedIn",
        date: "Nov 2023",
        image: "assets/certification/previews/Communication Foundations (2018).pdf.png"
    },
    {
        title: "Business Writing Principles",
        issuer: "LinkedIn",
        date: "Nov 2023",
        image: "assets/certification/previews/Business Writing Principles.pdf.png"
    },
    {
        title: "Writing Formal Business Letters and Emails",
        issuer: "LinkedIn",
        date: "Nov 2023",
        image: "assets/certification/previews/Writing Formal Business Letters and Emails.pdf.png"
    },
    {
        title: "Tips for Writing Business Emails",
        issuer: "LinkedIn",
        date: "Nov 2023",
        image: "assets/certification/previews/Tips for Writing Business Emails.pdf.png"
    },
    {
        title: "Design a Compelling Presentation",
        issuer: "LinkedIn",
        date: "Nov 2023",
        image: "assets/certification/previews/Design a Compelling Presentation.pdf.png"
    },
    {
        title: "Video Writing: Using Humor to Communicate and Persuade",
        issuer: "LinkedIn",
        date: "Nov 2023",
        image: "assets/certification/previews/Video Writing Using Humor to Communicate and Persuade.pdf.png"
    },
    {
        title: "Skills for Inclusive Conversations",
        issuer: "LinkedIn",
        date: "Nov 2023",
        image: "assets/certification/previews/Skills for Inclusive Conversations.pdf.png"
    },
    {
        title: "Learning Premiere Pro (2019)",
        issuer: "LinkedIn",
        date: "Nov 2023",
        image: "assets/certification/previews/Learning Premiere Pro (2019).jpeg"
    },
    {
        title: "Introduction to Photography: Lightroom Classic CC and Photoshop",
        issuer: "LinkedIn",
        date: "Nov 2023",
        image: "assets/certification/previews/Introduction to Photography Lightroom Classic CC and Photoshop.jpeg"
    }
]

/* 1. Synchronized Pagination & View Engine */
const ITEMS_PER_PAGE = 6
const totalCertPages = Math.ceil(certificatesData.length / ITEMS_PER_PAGE)
let currentCertPage = 1

const certToggleList = document.getElementById('cert-toggle-list')
const certToggleGallery = document.getElementById('cert-toggle-gallery')
const certListView = document.getElementById('cert-list-view')
const certGalleryView = document.getElementById('cert-gallery-view')
const certListItems = document.querySelectorAll('.cert-list-item')
const certGalleryCards = document.querySelectorAll('.cert-gallery-card')
const certPrevPageBtn = document.getElementById('cert-prev-page')
const certNextPageBtn = document.getElementById('cert-next-page')
const certPageNumbersContainer = document.getElementById('cert-page-numbers')

function updateCertPagination(pageNumber) {
    currentCertPage = Math.max(1, Math.min(pageNumber, totalCertPages))

    const startIndex = (currentCertPage - 1) * ITEMS_PER_PAGE
    const endIndex = startIndex + ITEMS_PER_PAGE

    // Update List View Items
    certListItems.forEach((item, idx) => {
        if (idx >= startIndex && idx < endIndex) {
            item.classList.remove('hidden-cert-page')
            item.classList.add('is-revealed')
        } else {
            item.classList.add('hidden-cert-page')
        }
    })

    // Update Gallery View Cards
    certGalleryCards.forEach((card, idx) => {
        if (idx >= startIndex && idx < endIndex) {
            card.classList.remove('hidden-cert-page')
            card.classList.add('is-revealed')
        } else {
            card.classList.add('hidden-cert-page')
        }
    })

    // Update Prev / Next Button States
    if (certPrevPageBtn) {
        certPrevPageBtn.disabled = currentCertPage === 1
    }
    if (certNextPageBtn) {
        certNextPageBtn.disabled = currentCertPage === totalCertPages
    }

    // Update Active Page Number Pills
    if (certPageNumbersContainer) {
        const pageBtns = certPageNumbersContainer.querySelectorAll('.cert-page-num')
        pageBtns.forEach(btn => {
            const btnPage = parseInt(btn.getAttribute('data-page'), 10)
            btn.classList.toggle('active', btnPage === currentCertPage)
            btn.setAttribute('aria-current', btnPage === currentCertPage ? 'page' : 'false')
        })
    }
}

function initPaginationControls() {
    if (!certPageNumbersContainer) return

    certPageNumbersContainer.innerHTML = ''
    for (let p = 1; p <= totalCertPages; p++) {
        const pageBtn = document.createElement('button')
        pageBtn.type = 'button'
        pageBtn.className = `cert-page-num ${p === currentCertPage ? 'active' : ''}`
        pageBtn.setAttribute('data-page', String(p))
        pageBtn.setAttribute('aria-label', `Page ${p}`)
        if (p === currentCertPage) {
            pageBtn.setAttribute('aria-current', 'page')
        }
        pageBtn.textContent = p

        pageBtn.addEventListener('click', () => {
            updateCertPagination(p)
        })

        certPageNumbersContainer.appendChild(pageBtn)
    }

    if (certPrevPageBtn) {
        certPrevPageBtn.addEventListener('click', () => {
            if (currentCertPage > 1) {
                updateCertPagination(currentCertPage - 1)
            }
        })
    }

    if (certNextPageBtn) {
        certNextPageBtn.addEventListener('click', () => {
            if (currentCertPage < totalCertPages) {
                updateCertPagination(currentCertPage + 1)
            }
        })
    }

    // Initial render
    updateCertPagination(1)
}

function switchCertView(viewMode) {
    if (!certListView || !certGalleryView) return

    const isList = viewMode === 'list'

    if (certToggleList && certToggleGallery) {
        certToggleList.classList.toggle('active', isList)
        certToggleList.setAttribute('aria-selected', String(isList))
        certToggleGallery.classList.toggle('active', !isList)
        certToggleGallery.setAttribute('aria-selected', String(!isList))
    }

    if (isList) {
        certGalleryView.classList.remove('active')
        certGalleryView.hidden = true
        certListView.hidden = false
        setTimeout(() => certListView.classList.add('active'), 20)
    } else {
        certListView.classList.remove('active')
        certListView.hidden = true
        certGalleryView.hidden = false
        setTimeout(() => certGalleryView.classList.add('active'), 20)
    }

    // Keep page in sync & refresh visible items
    updateCertPagination(currentCertPage)
}

if (certToggleList) {
    certToggleList.addEventListener('click', () => switchCertView('list'))
}

if (certToggleGallery) {
    certToggleGallery.addEventListener('click', () => switchCertView('gallery'))
}

// Initialize pagination on load
initPaginationControls()

/* 2. Lightbox Modal Viewer */
const certModal = document.getElementById('cert-modal')
const certModalBackdrop = document.getElementById('cert-modal-backdrop')
const certModalClose = document.getElementById('cert-modal-close')
const certModalPrev = document.getElementById('cert-modal-prev')
const certModalNext = document.getElementById('cert-modal-next')
const certModalImg = document.getElementById('cert-modal-img')
const certModalTitle = document.getElementById('cert-modal-title')
const certModalIssuer = document.getElementById('cert-modal-issuer')
const certModalDate = document.getElementById('cert-modal-date')
const certModalCounter = document.getElementById('cert-modal-counter')

let activeCertIndex = 0

function renderModalCert(index) {
    if (index < 0 || index >= certificatesData.length) return
    activeCertIndex = index
    const cert = certificatesData[index]

    if (certModalImg) {
        certModalImg.style.opacity = '0'
        certModalImg.src = cert.image
        certModalImg.alt = cert.title
        certModalImg.onload = () => {
            certModalImg.style.opacity = '1'
        }
    }

    if (certModalTitle) certModalTitle.textContent = cert.title
    if (certModalIssuer) certModalIssuer.innerHTML = `<i class="ri-building-line"></i> ${cert.issuer}`
    if (certModalDate) certModalDate.innerHTML = `<i class="ri-calendar-line"></i> ${cert.date}`
    if (certModalCounter) certModalCounter.textContent = `${index + 1} of ${certificatesData.length}`
}

function openCertModal(index) {
    if (!certModal) return
    renderModalCert(index)
    certModal.classList.add('active')
    certModal.setAttribute('aria-hidden', 'false')
    document.body.classList.add('modal-open')
}

function closeCertModal() {
    if (!certModal) return
    certModal.classList.remove('active')
    certModal.setAttribute('aria-hidden', 'true')
    document.body.classList.remove('modal-open')
}

function showNextCert() {
    const nextIndex = (activeCertIndex + 1) % certificatesData.length
    renderModalCert(nextIndex)
}

function showPrevCert() {
    const prevIndex = (activeCertIndex - 1 + certificatesData.length) % certificatesData.length
    renderModalCert(prevIndex)
}

// Bind interactive click/keyboard open events on List and Gallery items
document.querySelectorAll('.cert-list-item, .cert-gallery-card').forEach(item => {
    item.addEventListener('click', () => {
        const index = parseInt(item.getAttribute('data-cert-index'), 10)
        if (!isNaN(index)) openCertModal(index)
    })

    item.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            const index = parseInt(item.getAttribute('data-cert-index'), 10)
            if (!isNaN(index)) openCertModal(index)
        }
    })
})

if (certModalClose) {
    certModalClose.addEventListener('click', closeCertModal)
}

if (certModalBackdrop) {
    certModalBackdrop.addEventListener('click', closeCertModal)
}

if (certModalNext) {
    certModalNext.addEventListener('click', (e) => {
        e.stopPropagation()
        showNextCert()
    })
}

if (certModalPrev) {
    certModalPrev.addEventListener('click', (e) => {
        e.stopPropagation()
        showPrevCert()
    })
}

// Keyboard controls for modal (Escape, ArrowLeft, ArrowRight)
window.addEventListener('keydown', event => {
    if (!certModal || !certModal.classList.contains('active')) return

    if (event.key === 'Escape') {
        closeCertModal()
    } else if (event.key === 'ArrowRight') {
        showNextCert()
    } else if (event.key === 'ArrowLeft') {
        showPrevCert()
    }
})

/*==================== KEY PROJECTS CAROUSEL & MODAL ENGINE ====================*/
const projectsData = [
    {
        title: "MATHtatag",
        category: "Capstone Project",
        year: "2025",
        badge: "Android Application",
        icon: "ri-calculator-line",
        gradClass: "project-grad-1",
        shortDescription: "An Android mathematics assessment system featuring Filipino text-to-speech, curriculum-aligned modules, automated scoring, and real-time student analytics.",
        fullDescription: "MATHtatag is an Android-based mathematics assessment and supplementary learning system engineered specifically for Filipino elementary learners. It incorporates native Filipino Text-to-Speech (TTS) technology to assist pupils in auditory word-problem comprehension, directly addressing language-barrier challenges in basic mathematics education. Aligned with DepEd MATATAG curriculum standards, it equips teachers with automated diagnostic scoring, question-level analytics, and granular progress monitoring.",
        media: [
            {
                type: "video",
                label: "Video Demo",
                badge: "Interactive Video Walkthrough",
                icon: "ri-play-circle-line",
                caption: "Complete Walkthrough: System Architecture, Filipino Text-to-Speech Narration & Assessment Engine"
            },
            {
                type: "screenshot",
                label: "Assessment UI",
                badge: "Student Assessment Screen",
                icon: "ri-macbook-line",
                caption: "Interactive Pupil Interface with Synchronized Audio Word-Problem Narration"
            },
            {
                type: "screenshot",
                label: "Diagnostic Scoring",
                badge: "Automated Diagnostic Engine",
                icon: "ri-pie-chart-line",
                caption: "Step-by-Step Scoring Breakdown with Automated Diagnostic Solution Analysis"
            },
            {
                type: "screenshot",
                label: "Teacher Analytics",
                badge: "Educator Dashboard",
                icon: "ri-dashboard-3-line",
                caption: "Comprehensive Performance Analytics Highlighting Curriculum Learning Gaps"
            }
        ],
        features: [
            { icon: "ri-volume-up-line", text: "Integrated Filipino Text-to-Speech engine for natural auditory math problem narration." },
            { icon: "ri-file-list-3-line", text: "Curriculum-aligned quiz modules tailored to Department of Education competencies." },
            { icon: "ri-line-chart-line", text: "Real-time educator analytics dashboard tracking student mastery and learning gaps." },
            { icon: "ri-checkbox-circle-line", text: "Instant automated scoring with step-by-step diagnostic solution breakdowns." },
            { icon: "ri-wifi-off-line", text: "Offline-first local database caching for schools with limited internet connectivity." }
        ],
        tags: ["Android SDK", "Java / Kotlin", "Text-to-Speech API", "SQLite Database", "Material Design 3", "DepEd MATATAG"],
        links: [
            { label: "View Capstone Blueprint", icon: "ri-file-text-line", url: "#", primary: true },
            { label: "System Flowchart", icon: "ri-node-tree", url: "#", primary: false }
        ]
    },
    {
        title: "FuelWatchPH",
        category: "Web & Mobile Application",
        year: "2025",
        badge: "Fuel Tracker & Analytics",
        icon: "ri-gas-station-line",
        gradClass: "project-grad-2",
        shortDescription: "A nationwide fuel price tracker and analytics platform providing real-time pump price updates, station locators, and price trend forecasting.",
        fullDescription: "FuelWatchPH is a nationwide fuel price transparency and geospatial tracking platform that empowers motorists, logistics fleets, and daily commuters to optimize their refueling expenses. By synthesizing crowdsourced reports with verified fuel distributor data, FuelWatchPH offers interactive station navigation, historical price trend modeling, and predictive notifications before national fuel price adjustments take effect.",
        media: [
            {
                type: "video",
                label: "Live Map Demo",
                badge: "Interactive Map Walkthrough",
                icon: "ri-play-circle-line",
                caption: "Geospatial Station Navigation, Real-Time Fuel Prices & Route Refueling Calculator"
            },
            {
                type: "screenshot",
                label: "Price Trends",
                badge: "Historical Analytics",
                icon: "ri-line-chart-line",
                caption: "Predictive Fuel Price Trend Analytics with Regulatory Price Movement Alerts"
            },
            {
                type: "screenshot",
                label: "Station Locator",
                badge: "Station Finder UI",
                icon: "ri-map-pin-range-line",
                caption: "Multi-Brand Gas Station Comparative Pricing & Fuel Grade Filter Interface"
            },
            {
                type: "screenshot",
                label: "Cost Calculator",
                badge: "Savings Calculator",
                icon: "ri-calculator-line",
                caption: "Vehicle Fuel Efficiency Profile & Commute Refueling Cost Optimization"
            }
        ],
        features: [
            { icon: "ri-map-pin-2-line", text: "Interactive map locator highlighting nearest gas stations with live pump prices." },
            { icon: "ri-pulse-line", text: "Historical price trend graphs and predictive forecasting for upcoming price movements." },
            { icon: "ri-calculator-line", text: "Route refueling cost estimation calculator based on vehicle fuel efficiency." },
            { icon: "ri-notification-3-line", text: "Automated price hike / rollback alerts sent directly to registered users." },
            { icon: "ri-shield-check-line", text: "Community verification system with badge scoring to ensure price report accuracy." }
        ],
        tags: ["ReactJS", "Leaflet Maps API", "Node.js", "RESTful API", "Chart.js", "Tailwind CSS"],
        links: [
            { label: "Live Web App", icon: "ri-external-link-line", url: "#", primary: true },
            { label: "API Reference", icon: "ri-code-s-slash-line", url: "#", primary: false }
        ]
    },
    {
        title: "Barangay ID Application System",
        category: "System Development",
        year: "2025",
        badge: "Administrative Portal",
        icon: "ri-id-card-line",
        gradClass: "project-grad-3",
        shortDescription: "A database-driven administrative system providing centralized resident registration, appointment scheduling, secure digital ID generation, and role-based access.",
        fullDescription: "A full-scale administrative governance platform developed to digitize and accelerate resident identification processes for local barangay councils. The system consolidates demographic profiling, civil document submission, digital photo capture, and automated cryptographic QR-coded ID card generation into an intuitive, secure portal compliant with RA 10173 (Philippine Data Privacy Act).",
        media: [
            {
                type: "video",
                label: "System Demo",
                badge: "Administrative Walkthrough",
                icon: "ri-play-circle-line",
                caption: "Resident Profiling, Cryptographic QR Generation & Instant Verification Flow"
            },
            {
                type: "screenshot",
                label: "Resident Portal",
                badge: "Civil Registration UI",
                icon: "ri-user-add-line",
                caption: "Demographic Entry, Document Clearance Submission & Photo Capture Portal"
            },
            {
                type: "screenshot",
                label: "ID Card Preview",
                badge: "Card Layout Generator",
                icon: "ri-id-card-fill",
                caption: "Automated High-Resolution Print-Ready ID Card Output with Anti-Forgery QR"
            },
            {
                type: "screenshot",
                label: "Admin Dashboard",
                badge: "Queue & Clearance Center",
                icon: "ri-dashboard-2-line",
                caption: "Role-Based Access Dashboard Managing Issuance Appointments & Census Data"
            }
        ],
        features: [
            { icon: "ri-qr-code-line", text: "Automated QR-coded resident ID card generation with cryptographic anti-tampering verification." },
            { icon: "ri-calendar-check-line", text: "Online appointment booking and queue monitoring for physical document pickup." },
            { icon: "ri-admin-line", text: "Multi-tier Role-Based Access Control (RBAC) separating administrative privileges." },
            { icon: "ri-database-2-line", text: "Centralized resident census database with exportable statistical reports." },
            { icon: "ri-lock-2-line", text: "Encrypted data storage and activity audit logging for strict privacy compliance." }
        ],
        tags: ["PHP", "MySQL", "JavaScript (ES6+)", "Bootstrap 5", "QR Engine", "Data Privacy (RA 10173)"],
        links: [
            { label: "Admin Portal Demo", icon: "ri-dashboard-line", url: "#", primary: true },
            { label: "Architecture Blueprint", icon: "ri-git-repository-line", url: "#", primary: false }
        ]
    },
    {
        title: "Juan Camohaguin",
        category: "Community Platform",
        year: "2024",
        badge: "Android Mobile App",
        icon: "ri-community-line",
        gradClass: "project-grad-4",
        shortDescription: "An Android community platform delivering real-time emergency alert broadcasts, local government announcements, and municipal resident appointment coordination.",
        fullDescription: "Juan Camohaguin is a community empowerment mobile application created to strengthen civil protection and direct municipal engagement for the residents of Barangay Camohaguin. The platform ensures rapid emergency dissemination during typhoons and calamities, provides instant hotlines for first responders, and streamlines resident appointment requests with local council officials.",
        media: [
            {
                type: "video",
                label: "App Walkthrough",
                badge: "Emergency Flow Walkthrough",
                icon: "ri-play-circle-line",
                caption: "Disaster Alert Broadcasting, Incident Reporting & Emergency Hotline Direct Dial"
            },
            {
                type: "screenshot",
                label: "Alert Center",
                badge: "Disaster Notification UI",
                icon: "ri-alarm-warning-line",
                caption: "High-Priority Typhoon Advisory Screen with Evacuation Center Locator"
            },
            {
                type: "screenshot",
                label: "Hotline Directory",
                badge: "First Responder Direct Dial",
                icon: "ri-phone-line",
                caption: "One-Touch Emergency Directory Linking Police, Fire, Rescue & Medical Teams"
            },
            {
                type: "screenshot",
                label: "Notice Board",
                badge: "Community Bulletin",
                icon: "ri-article-line",
                caption: "Digital Barangay Announcements, Public Ordinances & Health Drive Schedules"
            }
        ],
        features: [
            { icon: "ri-broadcast-line", text: "High-priority push notification broadcast system for typhoon and disaster alerts." },
            { icon: "ri-phone-fill", text: "One-tap emergency hotline directory linking to police, fire, and medical teams." },
            { icon: "ri-map-pin-user-line", text: "Resident incident reporting portal with GPS geolocation tagging and image uploads." },
            { icon: "ri-newspaper-line", text: "Digital municipal notice board for announcements, ordinances, and community drives." },
            { icon: "ri-calendar-event-line", text: "Scheduled appointment coordination for barangay clearances and hearings." }
        ],
        tags: ["Android SDK", "Firebase FCM", "Java", "Google Maps API", "Cloud Firestore"],
        links: [
            { label: "Community Guide", icon: "ri-article-line", url: "#", primary: true },
            { label: "Source Code", icon: "ri-github-line", url: "#", primary: false }
        ]
    },
    {
        title: "Isla Serenidad",
        category: "Hospitality & Tourism",
        year: "2024",
        badge: "Resort Web Platform",
        icon: "ri-hotel-bed-line",
        gradClass: "project-grad-5",
        shortDescription: "A luxury island resort booking and experiential tourism portal featuring interactive villa tours, reservation workflows, and guest concierge services.",
        fullDescription: "Isla Serenidad is a modern hospitality web platform built to showcase the pristine beauty, private villas, and eco-luxury amenities of an exclusive tropical sanctuary. Incorporating modern glassmorphism aesthetics and immersive micro-animations, the site delivers a high-conversion booking journey with real-time rate calculations, virtual villa previews, and custom tour scheduling.",
        media: [
            {
                type: "video",
                label: "Resort Tour",
                badge: "Interactive Villa Walkthrough",
                icon: "ri-play-circle-line",
                caption: "Immersive Virtual Villa Walkthrough & Seamless Reservation Booking Flow"
            },
            {
                type: "screenshot",
                label: "Villas Gallery",
                badge: "Eco-Luxury Suites Showcase",
                icon: "ri-hotel-line",
                caption: "Interactive High-Definition Suite Gallery with Panoramic Amenity Previews"
            },
            {
                type: "screenshot",
                label: "Reservation Desk",
                badge: "Booking & Rate Engine",
                icon: "ri-calendar-check-line",
                caption: "Dynamic Date Range Availability Calendar with Real-Time Currency Conversion"
            },
            {
                type: "screenshot",
                label: "Island Concierge",
                badge: "Excursion Planner",
                icon: "ri-compass-3-line",
                caption: "Custom Marine Sanctuary Excursion & Private Dining Coordination Desk"
            }
        ],
        features: [
            { icon: "ri-image-line", text: "High-definition interactive villa showcase with 360-degree visual walkthroughs." },
            { icon: "ri-calendar-todo-line", text: "Integrated reservation calendar with dynamic date-range pricing calculations." },
            { icon: "ri-compass-3-line", text: "Island experience and excursion planner (island hopping, scuba diving, private dining)." },
            { icon: "ri-customer-service-2-line", text: "Digital guest concierge request module for personalized transport and dining." },
            { icon: "ri-smartphone-line", text: "Fully responsive, cross-platform glassmorphic UI optimized for touch ergonomics." }
        ],
        tags: ["HTML5", "CSS3 Glassmorphism", "JavaScript (ES6+)", "Swiper API", "Responsive Web Design"],
        links: [
            { label: "Live Resort Portal", icon: "ri-external-link-line", url: "#", primary: true },
            { label: "UI/UX Case Study", icon: "ri-palette-line", url: "#", primary: false }
        ]
    },
    {
        title: "Wikipedia UI",
        category: "Modern Web Concept",
        year: "2024",
        badge: "Reader-First Concept",
        icon: "ri-book-read-line",
        gradClass: "project-grad-6",
        shortDescription: "A modernized, reader-first redesign of Wikipedia featuring enhanced typography, dark/light reading modes, instant preview cards, and distraction-free layout.",
        fullDescription: "A conceptual redesign of the Wikipedia desktop and tablet reading interface focusing on elevated typographic hierarchy, visual minimalism, and frictionless knowledge retrieval. The interface removes cluttered navigational sidebars in favor of a collapsible floating table of contents, contextual hover previews for citations, and tailored typography presets designed for prolonged reading comfort.",
        media: [
            {
                type: "video",
                label: "Concept Demo",
                badge: "Interactive Reading Walkthrough",
                icon: "ri-play-circle-line",
                caption: "Fluid Typography Scaling, Distraction-Free Reading Mode & Dynamic TOC Spy"
            },
            {
                type: "screenshot",
                label: "Article Layout",
                badge: "Typographic Layout UI",
                icon: "ri-article-line",
                caption: "Harmonious Typographic Proportions with Focus Reading Line Length"
            },
            {
                type: "screenshot",
                label: "Citation Previews",
                badge: "Instant Hover Cards",
                icon: "ri-file-search-line",
                caption: "Contextual Citation Cards Revealing Source References Without Page Reloads"
            },
            {
                type: "screenshot",
                label: "Theme Switcher",
                badge: "OLED & Sepia Reading Palettes",
                icon: "ri-contrast-2-line",
                caption: "High-Contrast OLED True Black, Warm Sepia Book & Modern Editorial Light Themes"
            }
        ],
        features: [
            { icon: "ri-text", text: "Refined typographic scaling with customizable font sizes, line heights, and serifs." },
            { icon: "ri-list-check", text: "Sticky floating table of contents with dynamic active-section scroll spy highlighting." },
            { icon: "ri-file-search-line", text: "Instant interactive hover cards for internal links, references, and citations." },
            { icon: "ri-contrast-2-line", text: "Custom theme switcher supporting OLED True Black, Sepia Book, and Modern Light." },
            { icon: "ri-keyboard-line", text: "Rapid keyboard shortcut navigation for search, section jumping, and citation viewing." }
        ],
        tags: ["Vanilla JavaScript", "CSS Custom Properties", "Modern Typography", "Accessible HTML5"],
        links: [
            { label: "Interactive Prototype", icon: "ri-eye-line", url: "#", primary: true },
            { label: "Design System Specs", icon: "ri-layout-masonry-line", url: "#", primary: false }
        ]
    },
    {
        title: "Drudge Report UI",
        category: "Editorial Redesign",
        year: "2024",
        badge: "Editorial Redesign",
        icon: "ri-newspaper-line",
        gradClass: "project-grad-7",
        shortDescription: "A contemporary news aggregation interface reimagining rapid headline scanning with real-time ticker streams, category filtering, and clean responsive columns.",
        fullDescription: "A contemporary editorial redesign of iconic headline aggregation platforms. It retains the raw information density, instant visual scanning, and speed demanded by power readers, while modernizing the aesthetic with responsive multi-column layouts, live breaking news ticker feeds, category filter tabs, and high-contrast dark mode reading palettes.",
        media: [
            {
                type: "video",
                label: "Editorial Demo",
                badge: "News Aggregator Walkthrough",
                icon: "ri-play-circle-line",
                caption: "High-Speed Headline Skimming, Live Breaking News Ticker & Multi-Column Layout"
            },
            {
                type: "screenshot",
                label: "3-Column Grid",
                badge: "High-Density Grid UI",
                icon: "ri-layout-column-line",
                caption: "Ultra-Fast 3-Column Responsive Headline Grid Built for Rapid Scanning"
            },
            {
                type: "screenshot",
                label: "Topic Filters",
                badge: "Instant Categorization",
                icon: "ri-filter-3-line",
                caption: "Zero-Latency Client-Side Topic Filters (Politics, Markets, Technology, World)"
            },
            {
                type: "screenshot",
                label: "Ticker Stream",
                badge: "Real-Time Ticker",
                icon: "ri-rss-line",
                caption: "Automated Background RSS Stream Delivering Breaking Headline Alerts"
            }
        ],
        features: [
            { icon: "ri-layout-column-line", text: "High-density 3-column responsive layout optimized for rapid headline skimming." },
            { icon: "ri-rss-line", text: "Live breaking news ticker with automated background feed updating." },
            { icon: "ri-filter-3-line", text: "Instant category filtering (Top News, Politics, Technology, Markets, World)." },
            { icon: "ri-speed-line", text: "Zero-dependency lightweight code delivering sub-second page rendering." },
            { icon: "ri-moon-clear-line", text: "High-contrast Dark Mode and Classic Editorial Light Mode." }
        ],
        tags: ["HTML5", "CSS Grid & Flexbox", "JavaScript (ES6+)", "RSS Parser", "Performance Optimization"],
        links: [
            { label: "Live News Prototype", icon: "ri-external-link-line", url: "#", primary: true },
            { label: "Design Rationale", icon: "ri-book-open-line", url: "#", primary: false }
        ]
    }
]

/* Carousel Controller */
let currentProjectSlide = 0
let activeProjectModalIndex = 0
let activeModalMediaIndex = 0

const projectsCarouselTrack = document.getElementById('projects-carousel-track')
const projectsCarouselPrev = document.getElementById('projects-carousel-prev')
const projectsCarouselNext = document.getElementById('projects-carousel-next')
const projectsGlassEdgeLeft = document.getElementById('projects-glass-edge-left')
const projectsGlassEdgeRight = document.getElementById('projects-glass-edge-right')

const projectsModal = document.getElementById('projects-modal')
const projectsModalBackdrop = document.getElementById('projects-modal-backdrop')
const projectsModalClose = document.getElementById('projects-modal-close')
const projectsModalPrev = document.getElementById('projects-modal-prev')
const projectsModalNext = document.getElementById('projects-modal-next')
const projectsModalContent = document.getElementById('projects-modal-content')

const mediaLightbox = document.getElementById('media-lightbox')
const mediaLightboxBackdrop = document.getElementById('media-lightbox-backdrop')
const mediaLightboxClose = document.getElementById('media-lightbox-close')
const mediaLightboxContent = document.getElementById('media-lightbox-content')

function getVisibleCardsCount() {
    const width = window.innerWidth
    if (width > 968) return 3
    if (width > 600) return 2
    return 1
}

function getMaxProjectSlide() {
    const visibleCards = getVisibleCardsCount()
    return Math.max(0, projectsData.length - visibleCards)
}

function updateProjectsCarousel() {
    if (!projectsCarouselTrack) return

    const maxSlide = getMaxProjectSlide()
    currentProjectSlide = Math.max(0, Math.min(currentProjectSlide, maxSlide))

    const firstCard = projectsCarouselTrack.querySelector('.projects-card')
    if (firstCard) {
        const cardRect = firstCard.getBoundingClientRect()
        const computedStyle = window.getComputedStyle(projectsCarouselTrack)
        const gap = parseFloat(computedStyle.gap) || 24
        
        const isDesktop = window.innerWidth > 968
        const peekAmount = isDesktop ? 56 : (window.innerWidth > 600 ? 40 : 36)
        
        let peekOffset = 0
        if (currentProjectSlide === 0) {
            peekOffset = 0
        } else if (currentProjectSlide === maxSlide) {
            peekOffset = peekAmount
        } else {
            peekOffset = peekAmount / 2
        }

        const translatePx = currentProjectSlide * (cardRect.width + gap) - peekOffset
        projectsCarouselTrack.style.transform = `translateX(-${Math.max(0, translatePx)}px)`
    }

    // Dynamic show/hide of navigation buttons & liquid glass edge overlays
    const shouldHidePrev = currentProjectSlide <= 0
    const shouldHideNext = currentProjectSlide >= maxSlide

    if (projectsGlassEdgeLeft) {
        projectsGlassEdgeLeft.classList.toggle('is-hidden', shouldHidePrev)
    }

    if (projectsGlassEdgeRight) {
        projectsGlassEdgeRight.classList.toggle('is-hidden', shouldHideNext)
    }
}

function slideProjectsPrev() {
    if (currentProjectSlide > 0) {
        currentProjectSlide--
        updateProjectsCarousel()
    }
}

function slideProjectsNext() {
    const maxSlide = getMaxProjectSlide()
    if (currentProjectSlide < maxSlide) {
        currentProjectSlide++
        updateProjectsCarousel()
    }
}

if (projectsCarouselPrev) {
    projectsCarouselPrev.addEventListener('click', (e) => {
        e.stopPropagation()
        slideProjectsPrev()
    })
}

if (projectsCarouselNext) {
    projectsCarouselNext.addEventListener('click', (e) => {
        e.stopPropagation()
        slideProjectsNext()
    })
}

// Touch swipe gesture support for projects carousel
if (projectsCarouselTrack) {
    let touchStartX = 0
    let touchEndX = 0

    projectsCarouselTrack.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX
    }, { passive: true })

    projectsCarouselTrack.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX
        const diff = touchStartX - touchEndX
        if (Math.abs(diff) > 40) {
            if (diff > 0) {
                slideProjectsNext()
            } else {
                slideProjectsPrev()
            }
        }
    }, { passive: true })
}

// Window resize handler for carousel & modal gallery
window.addEventListener('resize', () => {
    updateProjectsCarousel()
    updateModalMediaGallery()
})

/*==================== EXPANDED MEDIA LIGHTBOX ENGINE ====================*/
function openMediaLightbox(projectIndex, mediaIndex) {
    const project = projectsData[projectIndex]
    if (!project || !mediaLightbox || !mediaLightboxContent) return

    const mediaItems = project.media && project.media.length > 0 ? project.media : [
        {
            type: "screenshot",
            badge: project.badge,
            icon: project.icon,
            caption: project.shortDescription
        }
    ]
    const mediaItem = mediaItems[mediaIndex] || mediaItems[0]

    mediaLightboxContent.innerHTML = `
        <div class="lightbox-showcase-view ${project.gradClass}">
            <div class="modal-media-glow" style="width: 320px; height: 320px; filter: blur(80px); opacity: 0.35;"></div>
            <i class="${mediaItem.icon || project.icon} lightbox-media-icon"></i>
            <span class="media-type-pill" style="position: relative; top: 0; left: 0; margin-bottom: 0.5rem;">
                <i class="${mediaItem.type === 'video' ? 'ri-video-line' : 'ri-image-line'}"></i>
                ${mediaItem.type === 'video' ? 'Expanded Video Demo Presentation' : (mediaItem.badge || 'High-Resolution Project Preview')}
            </span>
        </div>
        <div class="lightbox-caption-box">
            <h4 class="lightbox-title">${project.title} — ${mediaItem.label || mediaItem.badge}</h4>
            <p class="lightbox-desc">${mediaItem.caption || project.fullDescription}</p>
        </div>
    `

    mediaLightbox.classList.add('active')
    mediaLightbox.setAttribute('aria-hidden', 'false')
}

function closeMediaLightbox() {
    if (!mediaLightbox) return
    mediaLightbox.classList.remove('active')
    mediaLightbox.setAttribute('aria-hidden', 'true')
}

if (mediaLightboxClose) {
    mediaLightboxClose.addEventListener('click', closeMediaLightbox)
}

if (mediaLightboxBackdrop) {
    mediaLightboxBackdrop.addEventListener('click', closeMediaLightbox)
}

/*==================== PROJECT DETAILS MODAL ENGINE ====================*/
let visualModalSlide = 1

function positionModalTrack(slideIndex, animated = true) {
    if (!projectsModalContent) return
    const viewport = projectsModalContent.querySelector('#modal-gallery-viewport')
    const track = projectsModalContent.querySelector('#modal-gallery-track')
    const slides = projectsModalContent.querySelectorAll('.modal-media-card')
    if (!viewport || !track || !slides.length) return

    const targetSlide = slides[slideIndex] || slides[1] || slides[0]
    if (targetSlide) {
        const slideLeft = targetSlide.offsetLeft
        const slideWidth = targetSlide.offsetWidth
        const viewportWidth = viewport.offsetWidth
        const translateX = (slideLeft + (slideWidth / 2)) - (viewportWidth / 2)

        if (!animated) {
            track.style.transition = 'none'
            track.style.transform = `translateX(-${translateX}px)`
            track.offsetHeight // Force reflow
            track.style.transition = 'transform 0.4s cubic-bezier(0.25, 1, 0.5, 1)'
        } else {
            track.style.transition = 'transform 0.4s cubic-bezier(0.25, 1, 0.5, 1)'
            track.style.transform = `translateX(-${translateX}px)`
        }
    }
}

function syncModalMediaUI() {
    if (!projectsModalContent) return
    const slides = projectsModalContent.querySelectorAll('.modal-media-card')
    const dots = projectsModalContent.querySelectorAll('.modal-media-dot')

    // Mark active slide matching visual or logical index
    slides.forEach((slide) => {
        const sIdx = parseInt(slide.getAttribute('data-slide-index'), 10)
        const mIdx = parseInt(slide.getAttribute('data-media-index'), 10)
        const isActive = sIdx === visualModalSlide || (mIdx === activeModalMediaIndex && sIdx === activeModalMediaIndex + 1)
        slide.classList.toggle('active', isActive)
        slide.setAttribute('aria-selected', isActive ? 'true' : 'false')
        slide.setAttribute('tabindex', isActive ? '0' : '-1')
    })

    // Dot navigation strictly follows authoritative activeModalMediaIndex
    dots.forEach((dot, idx) => {
        const isActive = idx === activeModalMediaIndex
        dot.classList.toggle('active', isActive)
        dot.setAttribute('aria-current', isActive ? 'true' : 'false')
        dot.setAttribute('aria-selected', isActive ? 'true' : 'false')
    })
}

function setModalActiveMedia(newLogicalIndex, direction = 0) {
    if (!projectsModalContent) return
    const project = projectsData[activeProjectModalIndex]
    if (!project) return

    const mediaItems = project.media && project.media.length > 0 ? project.media : [
        {
            type: "screenshot",
            label: "Overview",
            badge: project.badge,
            icon: project.icon,
            caption: project.shortDescription
        }
    ]

    const N = mediaItems.length
    if (N <= 1) {
        activeModalMediaIndex = 0
        visualModalSlide = 0
        positionModalTrack(0, true)
        syncModalMediaUI()
        return
    }

    // Cyclic logical index: [0, N-1]
    activeModalMediaIndex = (newLogicalIndex % N + N) % N

    // Determine visual slide position in cloned track
    if (direction === 1 && newLogicalIndex === N && visualModalSlide === N) {
        visualModalSlide = N + 1
    } else if (direction === -1 && newLogicalIndex === -1 && visualModalSlide === 1) {
        visualModalSlide = 0
    } else {
        visualModalSlide = activeModalMediaIndex + 1
    }

    positionModalTrack(visualModalSlide, true)
    syncModalMediaUI()
}

function handleModalTrackTransitionEnd() {
    if (!projectsModalContent) return
    const project = projectsData[activeProjectModalIndex]
    if (!project) return
    const mediaItems = project.media && project.media.length > 0 ? project.media : []
    const N = mediaItems.length
    if (N <= 1) return

    // Seamless instant reset for clones
    if (visualModalSlide === N + 1) {
        visualModalSlide = 1
        positionModalTrack(1, false)
        syncModalMediaUI()
    } else if (visualModalSlide === 0) {
        visualModalSlide = N
        positionModalTrack(N, false)
        syncModalMediaUI()
    }
}

function updateModalMediaGallery() {
    positionModalTrack(visualModalSlide, false)
    syncModalMediaUI()
}

function switchModalMediaSlide(mediaIndex) {
    setModalActiveMedia(mediaIndex, 0)
}

function renderProjectModal(index) {
    activeProjectModalIndex = (index + projectsData.length) % projectsData.length
    activeModalMediaIndex = 0
    visualModalSlide = 1
    const project = projectsData[activeProjectModalIndex]
    if (!project || !projectsModalContent) return

    const mediaItems = project.media && project.media.length > 0 ? project.media : [
        {
            type: "screenshot",
            label: "Overview",
            badge: project.badge,
            icon: project.icon,
            caption: project.shortDescription
        }
    ]

    const N = mediaItems.length

    // Build media cards with cyclic clones:
    // If N > 1: [Clone of Item N-1] + [Item 0..N-1] + [Clone of Item 0]
    let trackItems = []
    if (N > 1) {
        trackItems.push({ item: mediaItems[N - 1], logicalIndex: N - 1, slideIndex: 0, isClone: true })
        mediaItems.forEach((m, idx) => {
            trackItems.push({ item: m, logicalIndex: idx, slideIndex: idx + 1, isClone: false })
        })
        trackItems.push({ item: mediaItems[0], logicalIndex: 0, slideIndex: N + 1, isClone: true })
    } else {
        trackItems.push({ item: mediaItems[0], logicalIndex: 0, slideIndex: 0, isClone: false })
    }

    const mediaCardsHtml = trackItems.map((slot) => {
        const m = slot.item
        const isVideo = m.type === 'video' || slot.logicalIndex === 0
        const isPrimaryActive = slot.slideIndex === 1 || (N === 1 && slot.slideIndex === 0)
        return `
            <div class="modal-media-card ${isPrimaryActive ? 'active' : ''} ${project.gradClass}" data-slide-index="${slot.slideIndex}" data-media-index="${slot.logicalIndex}" tabindex="${isPrimaryActive ? '0' : '-1'}" role="button" aria-label="View ${m.label || m.badge}">
                <span class="media-type-pill">
                    <i class="${isVideo ? 'ri-video-line' : 'ri-image-line'}"></i>
                    ${isVideo ? 'Demo Video Presentation' : (m.badge || 'System Screenshot')}
                </span>
                <div class="modal-media-glow"></div>
                <div class="modal-media-card-inner">
                    <div class="media-action-trigger" data-media-index="${slot.logicalIndex}" aria-hidden="true">
                        <i class="${isVideo ? 'ri-play-fill' : 'ri-fullscreen-line'}"></i>
                    </div>
                    <p class="media-card-caption">${m.caption || project.title}</p>
                </div>
            </div>
        `
    }).join('')

    // Compact, Subtle Dot Navigation
    const mediaDotsHtml = N > 1 ? `
        <div class="modal-media-dots" id="modal-media-dots" role="tablist" aria-label="Media navigation">
            ${mediaItems.map((_, mIdx) => `
                <button type="button" class="modal-media-dot ${mIdx === 0 ? 'active' : ''}" data-media-index="${mIdx}" role="tab" aria-label="Go to media slide ${mIdx + 1}" aria-selected="${mIdx === 0 ? 'true' : 'false'}"></button>
            `).join('')}
        </div>
    ` : ''

    const featuresHtml = project.features.map(f => `
        <div class="modal-feature-item">
            <i class="${f.icon} modal-feature-icon"></i>
            <span class="modal-feature-text">${f.text}</span>
        </div>
    `).join('')

    const tagsHtml = project.tags.map(t => `
        <span class="modal-tag">${t}</span>
    `).join('')

    const primaryDocLink = (project.links && project.links.length > 0) ? project.links[0].url : '#'

    projectsModalContent.innerHTML = `
        <!-- App Store-Inspired Header with View Full Documentation Action -->
        <div class="modal-product-header">
            <div class="modal-header-main">
                <div class="modal-header-icon-box">
                    <i class="${project.icon}"></i>
                </div>
                <div class="modal-header-text">
                    <h2 class="modal-header-title">${project.title}</h2>
                    <div class="modal-header-meta">
                        <span>${project.category}</span>
                        <span class="dot">•</span>
                        <span>${project.year}</span>
                        <span class="dot">•</span>
                        <span>${project.badge}</span>
                    </div>
                </div>
            </div>
            <a href="${primaryDocLink}" target="_blank" rel="noopener noreferrer" class="modal-doc-btn" aria-label="View Full Documentation for ${project.title}">
                <i class="ri-file-text-line"></i>
                <span>View Full Documentation</span>
            </a>
        </div>

        <!-- Cyclic Media Peeking Gallery Showcase -->
        <div class="modal-gallery-wrapper">
            <div class="modal-gallery-viewport" id="modal-gallery-viewport">
                ${N > 1 ? `
                    <button type="button" class="modal-gallery-arrow modal-gallery-arrow--prev" id="modal-gallery-prev" aria-label="Previous media" title="Previous media">
                        <i class="ri-arrow-left-s-line"></i>
                    </button>
                    <button type="button" class="modal-gallery-arrow modal-gallery-arrow--next" id="modal-gallery-next" aria-label="Next media" title="Next media">
                        <i class="ri-arrow-right-s-line"></i>
                    </button>
                ` : ''}
                <div class="modal-gallery-track" id="modal-gallery-track">
                    ${mediaCardsHtml}
                </div>
            </div>
            ${mediaDotsHtml}
        </div>

        <!-- Structured Project Overview -->
        <div class="modal-section">
            <h3 class="modal-section-title"><i class="ri-information-line"></i> About the Project</h3>
            <p class="modal-project-desc">${project.fullDescription}</p>
        </div>

        <!-- Key Features & Capabilities -->
        <div class="modal-section">
            <h3 class="modal-section-title"><i class="ri-sparkling-fill"></i> Key Features & Capabilities</h3>
            <div class="modal-features-grid">
                ${featuresHtml}
            </div>
        </div>

        <!-- Technologies & Architecture -->
        <div class="modal-section">
            <h3 class="modal-section-title"><i class="ri-stack-line"></i> Technologies & Architecture</h3>
            <div class="modal-tags-list">
                ${tagsHtml}
            </div>
        </div>
    `

    // Track transition end listener for infinite cyclic wrapping
    const modalTrack = projectsModalContent.querySelector('#modal-gallery-track')
    if (modalTrack) {
        modalTrack.addEventListener('transitionend', handleModalTrackTransitionEnd)
    }

    // Cyclic Internal Gallery Arrows
    const galleryPrev = projectsModalContent.querySelector('#modal-gallery-prev')
    const galleryNext = projectsModalContent.querySelector('#modal-gallery-next')
    if (galleryPrev) {
        galleryPrev.addEventListener('click', (e) => {
            e.stopPropagation()
            if (visualModalSlide === 1) {
                setModalActiveMedia(N - 1, -1)
            } else {
                setModalActiveMedia(activeModalMediaIndex - 1, -1)
            }
        })
    }
    if (galleryNext) {
        galleryNext.addEventListener('click', (e) => {
            e.stopPropagation()
            if (visualModalSlide === N) {
                setModalActiveMedia(0, 1)
            } else {
                setModalActiveMedia(activeModalMediaIndex + 1, 1)
            }
        })
    }

    // Dot Indicators
    const dotButtons = projectsModalContent.querySelectorAll('.modal-media-dot')
    dotButtons.forEach(dot => {
        dot.addEventListener('click', (e) => {
            e.stopPropagation()
            const mIdx = parseInt(dot.getAttribute('data-media-index'), 10)
            if (!isNaN(mIdx)) setModalActiveMedia(mIdx, 0)
        })
    })

    // Media Cards
    const mediaCards = projectsModalContent.querySelectorAll('.modal-media-card')
    mediaCards.forEach(card => {
        card.addEventListener('click', (e) => {
            const sIdx = parseInt(card.getAttribute('data-slide-index'), 10)
            const mIdx = parseInt(card.getAttribute('data-media-index'), 10)
            if (isNaN(mIdx)) return

            if (sIdx !== visualModalSlide) {
                setModalActiveMedia(mIdx, 0)
            } else {
                openMediaLightbox(activeProjectModalIndex, activeModalMediaIndex)
            }
        })

        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                const sIdx = parseInt(card.getAttribute('data-slide-index'), 10)
                const mIdx = parseInt(card.getAttribute('data-media-index'), 10)
                if (!isNaN(mIdx)) {
                    if (sIdx !== visualModalSlide) {
                        setModalActiveMedia(mIdx, 0)
                    } else {
                        openMediaLightbox(activeProjectModalIndex, activeModalMediaIndex)
                    }
                }
            }
        })
    })

    // Touch swipe support for modal gallery
    if (modalTrack) {
        let touchStartModalX = 0
        let touchEndModalX = 0
        modalTrack.addEventListener('touchstart', (e) => {
            touchStartModalX = e.changedTouches[0].screenX
        }, { passive: true })
        modalTrack.addEventListener('touchend', (e) => {
            touchEndModalX = e.changedTouches[0].screenX
            const diff = touchStartModalX - touchEndModalX
            if (Math.abs(diff) > 35) {
                if (diff > 0) {
                    if (visualModalSlide === N) {
                        setModalActiveMedia(0, 1)
                    } else {
                        setModalActiveMedia(activeModalMediaIndex + 1, 1)
                    }
                } else {
                    if (visualModalSlide === 1) {
                        setModalActiveMedia(N - 1, -1)
                    } else {
                        setModalActiveMedia(activeModalMediaIndex - 1, -1)
                    }
                }
            }
        }, { passive: true })
    }

    // Position initial slide (Slide 1: Demo Video) dead-center without animation
    requestAnimationFrame(() => {
        positionModalTrack(1, false)
        syncModalMediaUI()
    })
    setTimeout(() => {
        positionModalTrack(1, false)
        syncModalMediaUI()
    }, 60)
}

function openProjectModal(index) {
    if (!projectsModal) return
    activeProjectModalIndex = (index + projectsData.length) % projectsData.length
    activeModalMediaIndex = 0
    visualModalSlide = 1
    renderProjectModal(activeProjectModalIndex)
    projectsModal.classList.add('active')
    projectsModal.setAttribute('aria-hidden', 'false')
    document.body.style.overflow = 'hidden'
    requestAnimationFrame(() => {
        positionModalTrack(1, false)
        syncModalMediaUI()
    })
    setTimeout(() => {
        positionModalTrack(1, false)
        syncModalMediaUI()
    }, 60)
}

function closeProjectModal() {
    if (!projectsModal) return
    projectsModal.classList.remove('active')
    projectsModal.setAttribute('aria-hidden', 'true')
    document.body.style.overflow = ''
}

function showNextProjectModal() {
    activeModalMediaIndex = 0
    visualModalSlide = 1
    renderProjectModal(activeProjectModalIndex + 1)
    requestAnimationFrame(() => {
        positionModalTrack(1, false)
        syncModalMediaUI()
    })
}

function showPrevProjectModal() {
    activeModalMediaIndex = 0
    visualModalSlide = 1
    renderProjectModal(activeProjectModalIndex - 1)
    requestAnimationFrame(() => {
        positionModalTrack(1, false)
        syncModalMediaUI()
    })
}

// Bind cards click & View More button click
document.querySelectorAll('.projects-card').forEach(card => {
    card.addEventListener('click', (e) => {
        const index = parseInt(card.getAttribute('data-project-index'), 10)
        if (!isNaN(index)) {
            if (window.innerWidth <= 600 && !card.classList.contains('touch-active') && !e.target.closest('.projects-view-btn')) {
                document.querySelectorAll('.projects-card').forEach(c => c.classList.remove('touch-active'))
                card.classList.add('touch-active')
            } else {
                openProjectModal(index)
            }
        }
    })

    card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            const index = parseInt(card.getAttribute('data-project-index'), 10)
            if (!isNaN(index)) openProjectModal(index)
        }
    })
})

document.querySelectorAll('.projects-view-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.stopPropagation()
        const index = parseInt(btn.getAttribute('data-project-index'), 10)
        if (!isNaN(index)) openProjectModal(index)
    })
})

if (projectsModalClose) {
    projectsModalClose.addEventListener('click', closeProjectModal)
}

if (projectsModalBackdrop) {
    projectsModalBackdrop.addEventListener('click', closeProjectModal)
}

if (projectsModalPrev) {
    projectsModalPrev.addEventListener('click', (e) => {
        e.stopPropagation()
        showPrevProjectModal()
    })
}

if (projectsModalNext) {
    projectsModalNext.addEventListener('click', (e) => {
        e.stopPropagation()
        showNextProjectModal()
    })
}

// Keyboard controls for modal & lightbox (Escape, ArrowLeft, ArrowRight)
window.addEventListener('keydown', event => {
    if (mediaLightbox && mediaLightbox.classList.contains('active')) {
        if (event.key === 'Escape') {
            closeMediaLightbox()
            return
        }
    }

    if (projectsModal && projectsModal.classList.contains('active')) {
        if (event.key === 'Escape') {
            closeProjectModal()
        } else if (event.key === 'ArrowRight') {
            showNextProjectModal()
        } else if (event.key === 'ArrowLeft') {
            showPrevProjectModal()
        }
    }
})

// Initialize carousel on load
window.addEventListener('load', () => {
    updateProjectsCarousel()
})

// Initial call
updateProjectsCarousel()
