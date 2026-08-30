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
        year: "2025–2026",
        badge: "Android Application",
        icon: "ri-calculator-line",
        logo: "assets/projects/MATHtatag/MATHtatag Logo.jpeg",
        cardImage: "assets/projects/MATHtatag/MATHtatag Logo.jpeg",
        gradClass: "project-grad-1",
        shortDescription: "An Android mathematics assessment system featuring Filipino text-to-speech, curriculum-aligned modules, automated scoring, and real-time student analytics.",
        overview: "MATHtatag is a mobile-based learning and assessment application designed to support Grade 1 Mathematics under the MATATAG Curriculum. It combines interactive activities, Filipino Text-to-Speech, automated assessment, and performance monitoring to support learners, teachers, and parents.",
        fullDescription: "MATHtatag is a mobile-based learning and assessment application designed to support Grade 1 Mathematics under the MATATAG Curriculum. It combines interactive activities, Filipino Text-to-Speech, automated assessment, and performance monitoring to support learners, teachers, and parents.",
        problem: "Grade 1 learners faced difficulties understanding written mathematics instructions, while teachers and parents had limited access to timely assessment feedback and learner performance monitoring.",
        solution: "Developed MATHtatag as a centralized Android application that combines curriculum-aligned mathematics activities, Filipino Text-to-Speech, automated assessment, and performance monitoring.",
        role: {
            title: "Front-End / UI Designer • QA Tester • Documentation & Researcher",
            responsibilities: [
                "Designed and refined child-friendly interfaces for Grade 1 learners.",
                "Helped develop simple, accessible, and visually clear user interfaces.",
                "Tested application features and reported errors during development.",
                "Contributed to project documentation and research.",
                "Helped verify learning content and assessment items against Grade 1 Mathematics requirements."
            ]
        },
        media: [
            {
                type: "youtube",
                src: "https://www.youtube.com/embed/fsHzSBErxN4",
                title: "MATHtatag System Demonstration",
                badge: "Interactive Video Walkthrough",
                icon: "ri-youtube-line",
                caption: "Complete Walkthrough: System Architecture, Filipino Text-to-Speech Narration & Assessment Engine"
            },
            {
                type: "image",
                src: "assets/projects/MATHtatag/MATHtatag pic1.jpg",
                title: "Interactive Math UI",
                badge: "Student Assessment Screen",
                icon: "ri-macbook-line",
                caption: "Interactive Pupil Interface with Synchronized Audio Word-Problem Narration"
            },
            {
                type: "image",
                src: "assets/projects/MATHtatag/MATHtatag pic2.jpg",
                title: "Diagnostic Scoring",
                badge: "Automated Diagnostic Engine",
                icon: "ri-pie-chart-line",
                caption: "Step-by-Step Scoring Breakdown with Automated Diagnostic Solution Analysis"
            },
            {
                type: "image",
                src: "assets/projects/MATHtatag/MATHtatag pic3.jpg",
                title: "Teacher Analytics",
                badge: "Educator Dashboard",
                icon: "ri-dashboard-3-line",
                caption: "Comprehensive Performance Analytics Highlighting Curriculum Learning Gaps"
            },
            {
                type: "image",
                src: "assets/projects/MATHtatag/MATHtatag pic4.jpg",
                title: "Learning Module Interface",
                badge: "Mathematics Activity Screen",
                icon: "ri-book-read-line",
                caption: "Curriculum-Aligned Learning Module & Exercise Flow"
            },
            {
                type: "image",
                src: "assets/projects/MATHtatag/MATHtatag pic5.jpg",
                title: "Student Progress Summary",
                badge: "Evaluation Summary Screen",
                icon: "ri-award-line",
                caption: "Automated Evaluation Summary & Real-Time Performance Feedback"
            }
        ],
        features: [
            {
                title: "Interactive Mathematics Activities",
                text: "Matching, multiple choice, reordering, and other digital exercises.",
                icon: "ri-gamepad-line"
            },
            {
                title: "Filipino Text-to-Speech",
                text: "Reads questions and instructions aloud for young learners.",
                icon: "ri-volume-up-line"
            },
            {
                title: "Teacher Exercise Management",
                text: "Create, edit, and assign curriculum-aligned activities.",
                icon: "ri-file-edit-line"
            },
            {
                title: "Performance Dashboards",
                text: "Monitor learner progress, scores, and performance.",
                icon: "ri-dashboard-3-line"
            },
            {
                title: "Automated Assessment",
                text: "Records responses, calculates results, and provides immediate feedback.",
                icon: "ri-checkbox-circle-line"
            }
        ],
        techCategories: [
            { label: "Mobile", stack: "React Native • Expo • TypeScript" },
            { label: "Backend", stack: "Firebase • Firebase Realtime Database" },
            { label: "Services", stack: "ElevenLabs API • Firebase Authentication • Firebase Storage" },
            { label: "Tools", stack: "Git • GitHub • VS Code" }
        ],
        tags: ["React Native", "Expo", "TypeScript", "Firebase", "ElevenLabs API", "DepEd MATATAG"],
        results: {
            metrics: [
                { value: "63.22% → 95.89%", label: "Mean Percentage Score improvement" },
                { value: "42 / 45 learners", label: "Reached the 16–20 posttest score range" },
                { value: "4.63 / 5", label: "Overall ISO 25010 evaluation" }
            ],
            context: "Evaluated with Grade 1 learners and teacher/parent respondents, with the study reporting improved mathematics performance and strong software-quality ratings."
        },
        documents: [
            {
                type: "document",
                title: "MATHtatag Capstone Manuscript",
                label: "View Full Documentation ↗",
                icon: "ri-file-pdf-2-line",
                url: "https://drive.google.com/file/d/1ofy3oWCiZWdFyIqNK07GCzWWGpshf9uw/view?usp=share_link",
                primary: true
            }
        ],
        links: []
    },
    {
        title: "FuelWatch PH",
        category: "Technopreneurship Project",
        year: "2025",
        badge: "Web Application",
        icon: "ri-gas-station-line",
        logo: "assets/projects/FuelWatch PH/fuelwatch ph logo2.png",
        cardImage: "assets/projects/FuelWatch PH/fuelwatch ph logo2.png",
        gradClass: "project-grad-2",
        shortDescription: "A community-driven web platform that helps users find nearby fuel stations, compare reported fuel prices, view price history, save preferred stations, and contribute fuel price updates.",
        overview: "FuelWatch PH is a community-driven web platform that helps users find nearby fuel stations, compare reported fuel prices, view price history, save preferred stations, and contribute fuel price updates. The platform combines location-aware discovery with community reporting and administrative review to make fuel information more accessible and organized.",
        fullDescription: "FuelWatch PH is a community-driven web platform that helps users find nearby fuel stations, compare reported fuel prices, view price history, save preferred stations, and contribute fuel price updates. The platform combines location-aware discovery with community reporting and administrative review to make fuel information more accessible and organized.",
        problem: "Fuel price information is often scattered, difficult to compare, and potentially outdated, making it harder for users to find convenient and cost-effective refueling options.",
        solution: "Developed a mobile-first web platform that brings fuel station discovery, price comparison, historical pricing, community reporting, and administrative review together in one system.",
        role: {
            title: "UI/UX Expert • Frontend Developer • Documentation • Research • Testing Support",
            responsibilities: [
                "Designed user interfaces and user experiences for a clear, accessible, mobile-first experience.",
                "Developed frontend interfaces and responsive UI components.",
                "Translated project requirements into functional user-facing interfaces.",
                "Contributed to project documentation and research.",
                "Supported testing, quality checking, and issue identification throughout development."
            ]
        },
        media: [
            {
                type: "youtube",
                src: "https://www.youtube.com/embed/GaaAmfDXkaQ",
                title: "FuelWatch PH Demonstration",
                badge: "Interactive Video Walkthrough",
                icon: "ri-youtube-line",
                caption: "Interactive Walkthrough: Map-Based Station Discovery, Price Comparison & Community Reporting"
            },
            {
                type: "image",
                src: "assets/projects/FuelWatch PH/FUELWATCH HOMEPAGE.png",
                title: "FuelWatch Homepage",
                badge: "Homepage UI",
                icon: "ri-home-4-line",
                caption: "Mobile-First Homepage with Real-Time Fuel Highlights & Nearby Station Locator"
            },
            {
                type: "image",
                src: "assets/projects/FuelWatch PH/FUELWATCH MAPS PAGE.png",
                title: "Station Maps & Locator",
                badge: "Interactive Maps UI",
                icon: "ri-map-pin-range-line",
                caption: "Interactive Geospatial Station Map with Live Pump Prices & Station Navigation"
            },
            {
                type: "image",
                src: "assets/projects/FuelWatch PH/FUELWATCH COMPARE PRICES PAGE.png",
                title: "Compare Fuel Prices",
                badge: "Price Comparison UI",
                icon: "ri-scales-3-line",
                caption: "Side-by-Side Fuel Grade & Station Comparative Pricing Table"
            },
            {
                type: "image",
                src: "assets/projects/FuelWatch PH/FUELWATCH PRICE HISTORY PAGE.png",
                title: "Price History & Trends",
                badge: "Historical Trends UI",
                icon: "ri-line-chart-line",
                caption: "Historical Fuel Price Trends, Fluctuations & Regulatory Movement Analytics"
            }
        ],
        features: [
            {
                title: "Nearby Station Discovery",
                text: "Find fuel stations using map-based and location-aware features.",
                icon: "ri-map-pin-range-line"
            },
            {
                title: "Fuel Price Comparison",
                text: "Compare reported prices across different stations.",
                icon: "ri-scales-3-line"
            },
            {
                title: "Price Reporting",
                text: "Allow users to contribute updated fuel price information.",
                icon: "ri-edit-line"
            },
            {
                title: "Price History",
                text: "View historical fuel price information.",
                icon: "ri-line-chart-line"
            },
            {
                title: "Community Verification",
                text: "Support data reliability through user contributions, verification, and administrative moderation.",
                icon: "ri-shield-check-line"
            }
        ],
        techCategories: [
            { label: "Frontend", stack: "React • Vite • Tailwind CSS • TypeScript" },
            { label: "Backend", stack: "FastAPI • Uvicorn" },
            { label: "Database / Services", stack: "Supabase • PostgreSQL" },
            { label: "Tools", stack: "React-Leaflet • Leaflet • Git • GitHub • Figma" }
        ],
        tags: ["React", "Vite", "Tailwind CSS", "TypeScript", "FastAPI", "Uvicorn", "Supabase", "PostgreSQL", "React-Leaflet", "Leaflet", "Git", "GitHub", "Figma"],
        results: {
            highlights: [
                "Mobile-first platform designed for convenient access across devices.",
                "Community-powered fuel data supported by verification and moderation workflows.",
                "Integrated fuel intelligence combining station discovery, price comparison, and price history.",
                "Designed to support time-saving, informed, and potentially cost-effective refueling decisions."
            ]
        },
        documents: [
            {
                type: "document",
                title: "FuelWatch PH Full Documentation",
                label: "View Full Documentation ↗",
                icon: "ri-file-pdf-2-line",
                url: "https://drive.google.com/file/d/1SprToTg7Vy869XpCzG8CM9_O9LEd_Wpk/view?usp=sharing",
                primary: true
            }
        ],
        links: []
    },
    {
        title: "Barangay ID Application System",
        category: "Database Administration Project",
        year: "2025",
        badge: "Desktop Application",
        icon: "ri-id-card-line",
        logo: "assets/projects/Barangay ID Application System/BARANGAY ID LOGO.png",
        cardImage: "assets/projects/Barangay ID Application System/BARANGAY ID LOGO.png",
        gradClass: "project-grad-3",
        shortDescription: "A database-driven desktop application designed to simplify the management of resident records, appointments, and Barangay IDs. It centralizes information in a relational database while providing interfaces for registration, appointment management, application tracking, and ID generation.",
        overview: "The Barangay ID Application System is a database-driven desktop application designed to simplify the management of resident records, appointments, and Barangay IDs. It centralizes information in a relational database while providing interfaces for registration, appointment management, application tracking, and ID generation.",
        fullDescription: "The Barangay ID Application System is a database-driven desktop application designed to simplify the management of resident records, appointments, and Barangay IDs. It centralizes information in a relational database while providing interfaces for registration, appointment management, application tracking, and ID generation.",
        problem: "Manual record-keeping and fragmented resident information can make Barangay ID applications, appointment management, and record retrieval time-consuming and inefficient.",
        solution: "Developed a centralized database-driven desktop application that manages resident records, appointments, application statuses, and Barangay ID information through an integrated system.",
        role: {
            title: "Database Administrator & Application Developer",
            responsibilities: [
                "Designed the relational database structure and table relationships.",
                "Developed SQL DDL and stored procedures for database operations.",
                "Implemented CRUD, search, and record-retrieval functionality.",
                "Developed C# Windows Forms interfaces for resident and administrative workflows.",
                "Integrated database operations with the application's user interface."
            ]
        },
        media: [
            {
                type: "image",
                src: "assets/projects/Barangay ID Application System/BARANGAY ID MAIN PAGE.png",
                title: "Main Dashboard",
                badge: "Main Interface",
                icon: "ri-window-line",
                caption: "Centralized Desktop Interface for Barangay Resident & Application Operations"
            },
            {
                type: "image",
                src: "assets/projects/Barangay ID Application System/BARANGAY ID CARD.png",
                title: "Barangay ID Preview",
                badge: "ID Card Generator",
                icon: "ri-id-card-line",
                caption: "Automated Barangay Resident ID Card Generation & Print Layout Preview"
            },
            {
                type: "image",
                src: "assets/projects/Barangay ID Application System/BARANGAY ID 3.png",
                title: "Resident Records & Registration",
                badge: "Resident Registration",
                icon: "ri-user-settings-line",
                caption: "Resident Demographic Profile Entry & Stored Procedure Database Search"
            },
            {
                type: "image",
                src: "assets/projects/Barangay ID Application System/BARANGAY ID 4.png",
                title: "Appointment & Status Tracking",
                badge: "Status & Scheduling",
                icon: "ri-calendar-check-line",
                caption: "Appointment Management & Real-Time Application Tracking Workflows"
            }
        ],
        features: [
            {
                title: "Resident Information Management",
                text: "Centralized resident records and demographic information.",
                icon: "ri-folder-user-line"
            },
            {
                title: "Appointment Scheduling",
                text: "Book and manage Barangay ID appointments.",
                icon: "ri-calendar-check-line"
            },
            {
                title: "Application Status Tracking",
                text: "Check application status using a confirmation code.",
                icon: "ri-search-eye-line"
            },
            {
                title: "Barangay ID Management",
                text: "Generate, view, and print Barangay ID records.",
                icon: "ri-id-card-line"
            },
            {
                title: "Administrative Dashboard",
                text: "Manage residents, appointments, and ID records.",
                icon: "ri-dashboard-2-line"
            }
        ],
        techCategories: [
            { label: "Database", stack: "Microsoft SQL Server • SSMS • SQL" },
            { label: "Application", stack: "C# • Windows Forms • Visual Studio" },
            { label: "Database Development", stack: "Relational Database Design • Stored Procedures • CRUD Operations" }
        ],
        tags: ["Microsoft SQL Server", "SSMS", "SQL", "C#", "Windows Forms", "Visual Studio", "Database Design", "Stored Procedures", "CRUD Operations"],
        results: {
            highlights: [
                "Relational Database: Structured resident, appointment, and Barangay ID information with defined relationships.",
                "SQL Operations: Implemented stored procedures for CRUD, search, retrieval, and application-status operations.",
                "Integrated Application: Connected database functionality with a working C# Windows Forms interface for end-to-end record management."
            ]
        },
        documents: [
            {
                type: "document",
                title: "Barangay ID Application System Documentation",
                label: "View Full Documentation ↗",
                icon: "ri-file-pdf-2-line",
                url: "https://drive.google.com/file/d/1iE35ymcBcPKQxIxjbi07fW71xNJHqC_1/view?usp=sharing",
                primary: true
            }
        ],
        links: []
    },
    {
        title: "One Camohaguin",
        category: "Special Project",
        year: "2025",
        badge: "Android Application",
        icon: "ri-community-line",
        logo: "assets/projects/One Camohaguin/ONE CAMOHAGUIN LOGO.png",
        cardImage: "assets/projects/One Camohaguin/ONE CAMOHAGUIN LOGO.png",
        gradClass: "project-grad-4",
        shortDescription: "An all-in-one community app designed to improve emergency response, barangay communication, and appointment services in Barangay Camohaguin, Gumaca, Quezon.",
        overview: "One Camohaguin is an Android-based community application designed to centralize emergency services, communication, announcements, and appointment scheduling for Barangay Camohaguin. The project explores how digital technology can improve information dissemination, community coordination, and access to essential barangay services.",
        fullDescription: "One Camohaguin is an Android-based community application designed to centralize emergency services, communication, announcements, and appointment scheduling for Barangay Camohaguin. The project explores how digital technology can improve information dissemination, community coordination, and access to essential barangay services.",
        problem: "Fragmented emergency services, limited communication channels, and manual appointment processes made it difficult for residents and barangay officials to coordinate efficiently and access important information.",
        solution: "Developed an Android-based community platform that centralizes emergency services, communication, announcements, and appointment scheduling in one accessible application.",
        role: {
            title: "UI/UX Designer • Frontend Developer • QA Tester • Researcher",
            responsibilities: [
                "Designed user interfaces and user flows focused on clarity, accessibility, and ease of use for community services.",
                "Developed and refined the frontend interfaces of the Android application.",
                "Conducted quality assurance testing to identify interface and functional issues and support overall application reliability.",
                "Contributed to research, requirements analysis, project documentation, and evaluation of the proposed community solution."
            ]
        },
        media: [
            {
                type: "youtube",
                src: "https://www.youtube.com/embed/I44GoewGKQY",
                title: "One Camohaguin Demonstration",
                badge: "Interactive Video Walkthrough",
                icon: "ri-youtube-line",
                caption: "Interactive Walkthrough: Emergency Broadcasts, Incident Reporting & Appointment Coordination"
            },
            {
                type: "image",
                src: "assets/projects/One Camohaguin/One Camohaguin User 1.png",
                title: "Resident Interface Overview",
                badge: "User Interface",
                icon: "ri-smartphone-line",
                caption: "Resident Mobile Portal for Emergency Hotlines, Community Updates & Public Services"
            },
            {
                type: "image",
                src: "assets/projects/One Camohaguin/One Camohaguin User 2.png",
                title: "Services & Appointment Flow",
                badge: "User Interface",
                icon: "ri-calendar-event-line",
                caption: "Barangay Appointment Booking & Direct Official Grievance Reporting Interface"
            },
            {
                type: "image",
                src: "assets/projects/One Camohaguin/One Camohaguin Admin.png",
                title: "Admin Management Console",
                badge: "Admin Interface",
                icon: "ri-admin-line",
                caption: "Barangay Official Control Console for Incident Response & Announcement Broadcasts"
            }
        ],
        features: [
            {
                title: "Emergency Services & Alerts",
                text: "Access emergency information, contacts, and service points.",
                icon: "ri-alarm-warning-line"
            },
            {
                title: "Barangay Communication",
                text: "Communicate with officials, report grievances, and receive updates.",
                icon: "ri-message-3-line"
            },
            {
                title: "Appointment Scheduling",
                text: "Schedule essential services through a streamlined digital process.",
                icon: "ri-calendar-event-line"
            },
            {
                title: "Announcements & Updates",
                text: "Receive important barangay information through a centralized platform.",
                icon: "ri-notification-3-line"
            }
        ],
        techCategories: [
            { label: "Platform", stack: "Android" },
            { label: "Programming", stack: "Java" },
            { label: "Development", stack: "Sketchware" },
            { label: "Approach", stack: "Prototyping" }
        ],
        tags: ["Android", "Java", "Sketchware", "Prototyping", "Community App", "Emergency Response"],
        results: {
            highlights: [
                "Improved Communication: Supported easier communication between residents and barangay officials.",
                "Accessible Emergency Information: Provided centralized emergency contacts and service information.",
                "Streamlined Appointments: Made appointment scheduling more convenient and time-saving.",
                "Positive User Reception: Residents and officials generally viewed the application as useful, accessible, and user-friendly."
            ]
        },
        documents: [
            {
                type: "document",
                title: "One Camohaguin Full Documentation",
                label: "View Full Documentation ↗",
                icon: "ri-file-pdf-2-line",
                url: "https://drive.google.com/file/d/1EfWFzYGm1cZsUJ1Y7RQJTaI3-wLRaYU7/view?usp=sharing",
                primary: true
            }
        ],
        links: []
    },
    {
        title: "Isla Serenidad Beach Resort Reservation System",
        category: "Object-Oriented Programming Project",
        year: "2025",
        badge: "Reservation System",
        icon: "ri-hotel-bed-line",
        logo: "assets/projects/Isla Serenidad/ISLA SERENIDAD LOGO.png",
        cardImage: "assets/projects/Isla Serenidad/ISLA SERENIDAD LOGO.png",
        gradClass: "project-grad-5",
        shortDescription: "A reservation platform designed to provide guests with a smooth booking experience, from account registration and date selection through room selection, stay customization, payment, and confirmation.",
        overview: "Isla Serenidad Beach Resort Reservation System is a reservation platform designed to provide guests with a smooth booking experience from account registration through payment and confirmation. The system allows guests to select dates, browse room packages, customize their stay with additional rooms, extras, and amenities, review their reservation, and complete the payment process. The project also supports resort-side reservation management and room-availability management.",
        fullDescription: "Isla Serenidad Beach Resort Reservation System is a reservation platform designed to provide guests with a smooth booking experience from account registration through payment and confirmation. The system allows guests to select dates, browse room packages, customize their stay with additional rooms, extras, and amenities, review their reservation, and complete the payment process. The project also supports resort-side reservation management and room-availability management.",
        problem: "Fragmented reservation processes can make booking, room selection, customization, and payment less convenient while increasing administrative workload and the possibility of booking errors. Guests may also have difficulty accessing clear information about room options, available dates, amenities, and payment choices.",
        solution: "Developed an integrated reservation system that guides guests through the complete booking workflow: Login → Dates → Room Selection → Customization → Review → Payment → Confirmation. The system combines guest-facing reservation features with resort-side reservation management to make the overall booking process more organized and efficient.",
        role: {
            title: "OOP Application Developer • UI/UX Designer",
            responsibilities: [
                "Designed the reservation interface and overall booking workflow.",
                "Developed user-facing screens for login, registration, room selection, customization, payment, and confirmation.",
                "Implemented the reservation workflow using object-oriented programming concepts.",
                "Designed the system's database structure and entity relationships.",
                "Integrated the booking workflow across room selection, amenities, reservation review, and payment stages."
            ]
        },
        media: [
            {
                type: "youtube",
                src: "https://www.youtube.com/embed/k7sNDFvdl9I",
                title: "Isla Serenidad Demonstration",
                badge: "Interactive Video Walkthrough",
                icon: "ri-youtube-line",
                caption: "Interactive Walkthrough: Complete Booking Workflow, Stay Customization & Reservation Flow"
            },
            {
                type: "image",
                src: "assets/projects/Isla Serenidad/ISLA SERENIDAD HOMEPAGE.png",
                title: "Resort Homepage",
                badge: "Homepage Interface",
                icon: "ri-home-4-line",
                caption: "Resort Portal Showcase with Package Previews & Direct Date Selection"
            },
            {
                type: "image",
                src: "assets/projects/Isla Serenidad/ISLA SERENIDAD BOOKING.png",
                title: "Room Selection & Customization",
                badge: "Booking Interface",
                icon: "ri-hotel-bed-line",
                caption: "Interactive Villa & Suite Selection with Stay Amenities and Add-on Customization"
            },
            {
                type: "image",
                src: "assets/projects/Isla Serenidad/ISLA SERENIDAD COMPLETE BOOKING.png",
                title: "Reservation Confirmation & Payment",
                badge: "Payment Interface",
                icon: "ri-checkbox-circle-line",
                caption: "Final Reservation Review, Breakdown Summary & Secure Checkout Confirmation"
            }
        ],
        features: [
            {
                title: "Account Registration & Login",
                text: "Allows guests to create accounts and securely access the reservation system.",
                icon: "ri-user-add-line"
            },
            {
                title: "Date & Room Selection",
                text: "Allows guests to select their desired dates and browse available room packages.",
                icon: "ri-calendar-check-line"
            },
            {
                title: "Stay Customization",
                text: "Allows guests to customize their reservation by selecting rooms, extras, and amenities.",
                icon: "ri-settings-4-line"
            },
            {
                title: "Booking Review & Payment",
                text: "Allows guests to review their reservation details before proceeding through the payment process.",
                icon: "ri-bank-card-line"
            },
            {
                title: "Reservation Management",
                text: "Supports resort-side management of bookings and room availability.",
                icon: "ri-dashboard-3-line"
            }
        ],
        techCategories: [
            { label: "Programming", stack: "Java" },
            { label: "Database", stack: "MySQL • MySQL Workbench" },
            { label: "Development", stack: "Object-Oriented Programming • Relational Database Design" }
        ],
        tags: ["Java", "MySQL", "MySQL Workbench", "Object-Oriented Programming", "Relational Database Design"],
        results: {
            highlights: [
                "Complete Booking Flow: Login → Dates → Room → Customization → Review → Payment → Confirmation",
                "Personalized Reservations: Integrated room selection with additional amenities and extras to allow guests to customize their stay.",
                "Database-Driven Design: Structured reservation information using relational database entities and relationships.",
                "Integrated Reservation Experience: Combined guest-facing booking functionality with resort-side reservation management."
            ]
        },
        documents: [
            {
                type: "document",
                title: "Isla Serenidad Full Documentation",
                label: "View Full Documentation ↗",
                icon: "ri-file-pdf-2-line",
                url: "https://drive.google.com/file/d/1xhWhtzll9v0GJbCW9IkaYR3mk1PSTHti/view?usp=sharing",
                primary: true
            }
        ],
        links: []
    },
    {
        title: "User-Centric Redesign: Improving the Interface of Wikipedia",
        category: "Academic Activity",
        year: "2025",
        badge: "UI/UX Redesign",
        icon: "ri-book-read-line",
        logo: "assets/projects/Wikipedia/Wikipedia-logo-v2.svg.png",
        cardImage: "assets/projects/Wikipedia/Wikipedia-logo-v2.svg.png",
        gradClass: "project-grad-6",
        shortDescription: "An individual HCI project exploring the redesign of Wikipedia's user interface through a user-centered approach to improve navigation, readability, and content organization.",
        overview: "This individual HCI project explores the redesign of Wikipedia's user interface through a user-centered approach. The redesign focuses on improving navigation, information hierarchy, readability, and content organization while maintaining Wikipedia's core purpose as an accessible knowledge platform.",
        fullDescription: "This individual HCI project explores the redesign of Wikipedia's user interface through a user-centered approach. The redesign focuses on improving navigation, information hierarchy, readability, and content organization while maintaining Wikipedia's core purpose as an accessible knowledge platform.",
        problem: "Wikipedia's information-dense interface can make navigation, content discovery, and reading difficult, especially when users need to quickly locate specific information.",
        solution: "Redesigned Wikipedia's interface using user-centered HCI principles to create clearer navigation, stronger visual hierarchy, improved readability, and a more focused reading experience.",
        role: {
            title: "UI/UX Designer • HCI Researcher",
            responsibilities: [
                "Analyzed the existing interface to identify usability and visual-design opportunities.",
                "Applied HCI and user-centered design principles to guide the redesign.",
                "Designed the layout, navigation, typography, spacing, and visual hierarchy.",
                "Created and refined the redesigned interface based on identified usability concerns.",
                "Documented and presented the design rationale behind the proposed improvements."
            ]
        },
        media: [
            {
                type: "youtube",
                src: "https://youtu.be/eCemex4eJ7c",
                title: "Wikipedia Redesign Demonstration",
                badge: "Interactive Video Walkthrough",
                icon: "ri-youtube-line",
                caption: "Interactive Walkthrough: Information Hierarchy, Streamlined Navigation & Focus Reading UI"
            },
            {
                type: "image",
                src: "assets/projects/Wikipedia/Wikipedia UI Homepage.png",
                title: "Wikipedia Redesigned Homepage",
                badge: "Homepage UI",
                icon: "ri-home-4-line",
                caption: "User-Centered Homepage Design with Simplified Knowledge Discovery & Search"
            },
            {
                type: "image",
                src: "assets/projects/Wikipedia/Wikipedia UI Bob Ross page.png",
                title: "Article Reading Interface (Bob Ross)",
                badge: "Article Reading UI",
                icon: "ri-article-line",
                caption: "Enhanced Article Typography, Floating Navigation & Distraction-Free Layout"
            }
        ],
        features: [
            {
                title: "Improved Visual Hierarchy",
                text: "Organized content and navigation to make important information easier to identify.",
                icon: "ri-layout-top-line"
            },
            {
                title: "Clearer Navigation",
                text: "Refined page organization to support easier movement through content.",
                icon: "ri-compass-3-line"
            },
            {
                title: "Enhanced Readability",
                text: "Improved typography, spacing, and content structure for more comfortable reading.",
                icon: "ri-font-size"
            },
            {
                title: "Focused Content Layout",
                text: "Reduced visual clutter and strengthened separation between primary and supporting content.",
                icon: "ri-focus-3-line"
            },
            {
                title: "Modernized Interface",
                text: "Introduced a cleaner visual system while preserving Wikipedia's information-focused purpose.",
                icon: "ri-sparkling-line"
            }
        ],
        techCategories: [
            { label: "Design", stack: "UI/UX Design • User-Centered Design • HCI Principles" },
            { label: "Prototyping", stack: "High-Fidelity Interface Design • Wireframing • Prototyping" },
            { label: "Tools", stack: "Canva" }
        ],
        tags: ["UI/UX Design", "User-Centered Design", "HCI Principles", "High-Fidelity Interface Design", "Wireframing", "Prototyping", "Canva"],
        results: {
            highlights: [
                "User-Centered Design: Applied HCI principles to guide interface and interaction decisions.",
                "Clearer Information Hierarchy: Improved the organization and presentation of navigation and content.",
                "Refined Reading Experience: Created a cleaner, more focused interface for consuming Wikipedia content."
            ]
        },
        documents: [],
        links: []
    },
    {
        title: "Usability and Aesthetics: The Drudge Report Redesign",
        category: "Academic Activity",
        year: "2025",
        badge: "UI/UX Redesign",
        icon: "ri-newspaper-line",
        logo: "assets/projects/Drudge Report/Drudge Report Logo.png",
        cardImage: "assets/projects/Drudge Report/Drudge Report Logo.png",
        gradClass: "project-grad-7",
        shortDescription: "An individual HCI project examining the usability and visual design of the Drudge Report and proposing a redesigned interface for a clearer, more organized experience.",
        overview: "This individual HCI project examines the usability and visual design of the Drudge Report and proposes a redesigned interface that provides a clearer, more organized, and visually engaging experience. The redesign applies HCI and UI/UX principles to improve information hierarchy, navigation, readability, and content presentation while retaining the site's core news-focused purpose.",
        fullDescription: "This individual HCI project examines the usability and visual design of the Drudge Report and proposes a redesigned interface that provides a clearer, more organized, and visually engaging experience. The redesign applies HCI and UI/UX principles to improve information hierarchy, navigation, readability, and content presentation while retaining the site's core news-focused purpose.",
        problem: "The dense, text-heavy interface made content difficult to scan and navigate, while its limited visual hierarchy and dated presentation created opportunities for improved usability and aesthetics.",
        solution: "Redesigned the interface with clearer information hierarchy, improved content organization, stronger readability, and a more modern visual presentation.",
        role: {
            title: "UI/UX Designer • HCI Researcher",
            responsibilities: [
                "Analyzed the existing interface to identify usability and aesthetic issues.",
                "Applied HCI and user-centered design principles to guide improvements.",
                "Redesigned the layout, navigation, typography, spacing, and visual hierarchy.",
                "Organized news content into a clearer and more structured interface.",
                "Documented and presented the design rationale behind the redesign."
            ]
        },
        media: [
            {
                type: "youtube",
                src: "https://www.youtube.com/embed/gaKEaG9Ug1k",
                title: "Drudge Report Redesign Demonstration",
                badge: "Interactive Video Walkthrough",
                icon: "ri-youtube-line",
                caption: "Interactive Walkthrough: Information Hierarchy, News Organization & Contemporary Editorial Layout"
            },
            {
                type: "image",
                src: "assets/projects/Drudge Report/drudge report pic.jpeg",
                title: "Drudge Report Redesigned Interface",
                badge: "Editorial UI",
                icon: "ri-newspaper-line",
                caption: "Modernized Editorial Presentation with Enhanced Readability & Visual Hierarchy"
            }
        ],
        features: [
            {
                title: "Improved Information Hierarchy",
                text: "Created clearer visual relationships between headlines, categories, and supporting content.",
                icon: "ri-layout-top-line"
            },
            {
                title: "Organized News Layout",
                text: "Restructured the dense collection of news links into a clearer page layout.",
                icon: "ri-layout-masonry-line"
            },
            {
                title: "Enhanced Readability",
                text: "Improved typography, spacing, alignment, and content grouping.",
                icon: "ri-font-size"
            },
            {
                title: "Modernized Visual Design",
                text: "Introduced a cleaner and more contemporary visual presentation.",
                icon: "ri-sparkling-line"
            },
            {
                title: "Improved Navigation",
                text: "Organized content and navigation patterns for easier browsing.",
                icon: "ri-compass-3-line"
            }
        ],
        techCategories: [
            { label: "Design", stack: "UI/UX Design • HCI Principles • User-Centered Design" },
            { label: "Prototyping", stack: "Wireframing • High-Fidelity Interface Design • Prototyping" },
            { label: "Tools", stack: "Canva" }
        ],
        tags: ["UI/UX Design", "HCI Principles", "User-Centered Design", "Wireframing", "High-Fidelity Interface Design", "Prototyping", "Canva"],
        results: {
            highlights: [
                "Clearer Information Hierarchy: Improved the organization and visual prominence of news content.",
                "Better Scannability: Created a more structured layout for quickly browsing headlines and information.",
                "Modernized Interface: Transformed the visually dense presentation into a cleaner and more structured experience."
            ]
        },
        documents: [],
        links: [
            {
                label: "View Design ↗",
                icon: "ri-external-link-line",
                url: "https://engelbertmorales.my.canva.site/drudge-report",
                primary: true
            }
        ]
    },
    {
        title: "BayaniHealth Connect",
        category: "Academic Activity",
        year: "2025",
        badge: "UI/UX Design",
        icon: "ri-heart-pulse-line",
        logo: "assets/projects/BayaniHealth Connect/BayaniHealth Connect.png",
        cardImage: "assets/projects/BayaniHealth Connect/BayaniHealth Connect.png",
        gradClass: "project-grad-1",
        shortDescription: "A user-centered digital healthcare interface focused on improving accessibility, information hierarchy, and service navigation for community health services.",
        overview: "BayaniHealth Connect is an individual HCI project focused on designing a more accessible and user-friendly digital experience for community healthcare services. The redesigned interface organizes essential health information and service interactions into a clearer structure, emphasizing usability, accessibility, visual hierarchy, and ease of navigation.",
        fullDescription: "BayaniHealth Connect is an individual HCI project focused on designing a more accessible and user-friendly digital experience for community healthcare services. The redesigned interface organizes essential health information and service interactions into a clearer structure, emphasizing usability, accessibility, visual hierarchy, and ease of navigation.",
        problem: "Unclear information organization and complex interactions can make community healthcare services difficult to navigate, especially when users need to quickly find important health information or services.",
        solution: "Designed a user-centered healthcare interface with clearer navigation, stronger information hierarchy, and more accessible interactions for community health services.",
        role: {
            title: "UI/UX Designer • HCI Researcher",
            responsibilities: [
                "Analyzed the healthcare-service experience to identify usability and accessibility opportunities.",
                "Applied HCI and user-centered design principles to guide interface decisions.",
                "Designed the interface structure, navigation, visual hierarchy, typography, spacing, and interaction patterns.",
                "Organized healthcare information and services to make important content easier to find and understand.",
                "Refined and documented the design based on usability and user-experience objectives."
            ]
        },
        media: [
            {
                type: "image",
                src: "assets/projects/BayaniHealth Connect/BAYANIHEALTH 1.jpg",
                title: "BayaniHealth Connect — Screen 1",
                badge: "Healthcare UI",
                icon: "ri-heart-pulse-line",
                caption: "Accessible Community Health Portal — Service Overview & Navigation"
            },
            {
                type: "image",
                src: "assets/projects/BayaniHealth Connect/BAYANIHEALTH 2.jpg",
                title: "BayaniHealth Connect — Screen 2",
                badge: "Healthcare UI",
                icon: "ri-heart-pulse-line",
                caption: "Clear Health Information & Preventive Care Services"
            },
            {
                type: "image",
                src: "assets/projects/BayaniHealth Connect/BAYANIHEALTH 3.jpg",
                title: "BayaniHealth Connect — Screen 3",
                badge: "Healthcare UI",
                icon: "ri-heart-pulse-line",
                caption: "Service Directory & Community Health Programs"
            },
            {
                type: "image",
                src: "assets/projects/BayaniHealth Connect/BAYANIHEALTH 4.jpg",
                title: "BayaniHealth Connect — Screen 4",
                badge: "Healthcare UI",
                icon: "ri-heart-pulse-line",
                caption: "Appointment Booking & Consultation Scheduling"
            },
            {
                type: "image",
                src: "assets/projects/BayaniHealth Connect/BAYANIHEALTH 5.jpg",
                title: "BayaniHealth Connect — Screen 5",
                badge: "Healthcare UI",
                icon: "ri-heart-pulse-line",
                caption: "Health Resource Library & Guidelines"
            },
            {
                type: "image",
                src: "assets/projects/BayaniHealth Connect/BAYANIHEALTH 6.jpg",
                title: "BayaniHealth Connect — Screen 6",
                badge: "Healthcare UI",
                icon: "ri-heart-pulse-line",
                caption: "Emergency Assistance & Health Center Directory"
            }
        ],
        features: [
            {
                title: "Accessible Health Information",
                text: "Organizes important healthcare information into clear and understandable sections.",
                icon: "ri-health-book-line"
            },
            {
                title: "Service-Focused Navigation",
                text: "Provides clearer pathways to relevant healthcare services and information.",
                icon: "ri-compass-3-line"
            },
            {
                title: "Appointment & Service Interactions",
                text: "Presents service-related actions through an organized interface.",
                icon: "ri-calendar-check-line"
            },
            {
                title: "Clear Information Hierarchy",
                text: "Prioritizes important content and actions for easier scanning.",
                icon: "ri-layout-top-line"
            },
            {
                title: "Accessible & User-Friendly Interface",
                text: "Uses readable typography, spacing, grouping, and consistent interface patterns.",
                icon: "ri-user-heart-line"
            }
        ],
        techCategories: [
            { label: "Design", stack: "UI/UX Design • HCI Principles • User-Centered Design" },
            { label: "Prototyping", stack: "Wireframing • High-Fidelity Interface Design • Prototyping" },
            { label: "Tools", stack: "Canva" }
        ],
        tags: ["UI/UX Design", "HCI Principles", "User-Centered Design", "Wireframing", "High-Fidelity Interface Design", "Prototyping", "Canva"],
        results: {
            highlights: [
                "User-Centered Healthcare Design: Applied HCI principles to address usability and accessibility needs.",
                "Clearer Health Information: Improved the organization and hierarchy of healthcare content and services.",
                "Accessible User Experience: Created a more readable, structured, and approachable interface for community health services."
            ]
        },
        documents: [],
        links: []
    },
    {
        title: "ArtSphere",
        category: "Academic Activity",
        year: "2025",
        badge: "UI/UX Design",
        icon: "ri-palette-line",
        logo: "assets/projects/ArtSphere/ArtSphere.png",
        cardImage: "assets/projects/ArtSphere/ArtSphere.png",
        gradClass: "project-grad-2",
        shortDescription: "A visually focused digital art showcase interface emphasizing aesthetic presentation, visual hierarchy, and intuitive artwork exploration.",
        overview: "ArtSphere is an individual academic project centered on creating a visually engaging interface for presenting and exploring artwork. The design emphasizes visual presentation, content organization, navigation, and an aesthetic experience that complements the artistic subject matter.",
        fullDescription: "ArtSphere is an individual academic project centered on creating a visually engaging interface for presenting and exploring artwork. The design emphasizes visual presentation, content organization, navigation, and an aesthetic experience that complements the artistic subject matter.",
        problem: "Poor content organization and weak visual hierarchy can make digital art interfaces feel cluttered and reduce the visual impact of the artwork they present.",
        solution: "Created a visually focused art interface that combines clear content organization, strong visual hierarchy, and an aesthetic layout to create a more engaging artwork-browsing experience.",
        role: {
            title: "UI/UX Designer • Visual Designer",
            responsibilities: [
                "Designed the overall ArtSphere interface and visual direction.",
                "Organized artwork, navigation, and supporting content into a cohesive layout.",
                "Applied visual hierarchy, composition, spacing, typography, and consistency principles.",
                "Refined the interface to balance artwork presentation with usability.",
                "Developed the visual design and interaction structure represented in the prototype."
            ]
        },
        media: [
            {
                type: "image",
                src: "assets/projects/ArtSphere/ArtSphere Homepage.png",
                title: "ArtSphere Homepage",
                badge: "Gallery Homepage UI",
                icon: "ri-palette-line",
                caption: "Aesthetic Art Showcase — Featured Exhibition & Visual Discovery"
            },
            {
                type: "image",
                src: "assets/projects/ArtSphere/ArtSphere Visual Arts.png",
                title: "Visual Arts Gallery",
                badge: "Visual Arts UI",
                icon: "ri-brush-line",
                caption: "Visual Arts Exhibition — Paintings, Digital Art & Sculptures"
            },
            {
                type: "image",
                src: "assets/projects/ArtSphere/ArtSphere Performing Arts.png",
                title: "Performing Arts Showcase",
                badge: "Performing Arts UI",
                icon: "ri-music-2-line",
                caption: "Performing Arts Showcase — Theatre, Dance & Musical Productions"
            },
            {
                type: "image",
                src: "assets/projects/ArtSphere/ArtSphere Literary Arts.png",
                title: "Literary Arts Collection",
                badge: "Literary Arts UI",
                icon: "ri-book-open-line",
                caption: "Literary Arts Collection — Poetry, Prose & Creative Writing"
            }
        ],
        features: [
            {
                title: "Artwork-Focused Presentation",
                text: "Gives artwork strong visual prominence.",
                icon: "ri-palette-line"
            },
            {
                title: "Organized Content Layout",
                text: "Structures artwork and supporting information into clear sections.",
                icon: "ri-layout-masonry-line"
            },
            {
                title: "Visual Navigation",
                text: "Provides intuitive navigation through the art-focused experience.",
                icon: "ri-compass-3-line"
            },
            {
                title: "Consistent Visual System",
                text: "Maintains cohesive typography, spacing, alignment, and interface elements.",
                icon: "ri-layout-top-line"
            },
            {
                title: "Immersive Aesthetic",
                text: "Combines visual composition and interface styling for an art-focused experience.",
                icon: "ri-sparkling-line"
            }
        ],
        techCategories: [
            { label: "Design", stack: "UI/UX Design • Visual Design • User-Centered Design" },
            { label: "Interface", stack: "Visual Hierarchy • Layout Composition • Typography • Prototyping" },
            { label: "Tool", stack: "Canva" }
        ],
        tags: ["UI/UX Design", "Visual Design", "User-Centered Design", "Visual Hierarchy", "Layout Composition", "Typography", "Prototyping", "Canva"],
        results: {
            highlights: [
                "Art-Centered Experience: Designed the interface to give artwork strong visual prominence.",
                "Cohesive Visual System: Created consistent layouts, typography, spacing, and interface elements.",
                "Balanced UX & Aesthetics: Combined visual presentation with clear organization and navigation."
            ]
        },
        documents: [],
        links: [
            {
                label: "View Design ↗",
                icon: "ri-external-link-line",
                url: "https://engelbertmorales.my.canva.site/artsphere",
                primary: true
            }
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
const projectsModalContent = document.getElementById('projects-modal-content')

const mediaLightbox = document.getElementById('media-lightbox')
const mediaLightboxBackdrop = document.getElementById('media-lightbox-backdrop')
const mediaLightboxClose = document.getElementById('media-lightbox-close')
const mediaLightboxPrev = document.getElementById('media-lightbox-prev')
const mediaLightboxNext = document.getElementById('media-lightbox-next')
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

// Window resize handler for carousels
window.addEventListener('resize', () => {
    updateProjectsCarousel()
    if (projectsModal && projectsModal.classList.contains('active')) {
        positionModalTrack(false)
    }
})

/*==================== EXPANDED MEDIA LIGHTBOX ENGINE ====================*/
let currentLightboxMediaIndex = 0

function getYouTubeVideoId(url) {
    if (!url || typeof url !== 'string') return null
    const trimmed = url.trim()
    if (!trimmed || trimmed === 'VIDEO_ID' || trimmed.includes('/embed/VIDEO_ID')) return null

    // Check embed URL: https://www.youtube.com/embed/VIDEO_ID
    const embedMatch = trimmed.match(/(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/i)
    if (embedMatch) return embedMatch[1]

    // Check watch URL: https://www.youtube.com/watch?v=VIDEO_ID
    const watchMatch = trimmed.match(/(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/i)
    if (watchMatch) return watchMatch[1]

    // Check short URL: https://youtu.be/VIDEO_ID
    const shortMatch = trimmed.match(/(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/i)
    if (shortMatch) return shortMatch[1]

    // Check direct ID: 11 characters alphanumeric/dashes
    if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed

    return null
}

function renderLightboxContent() {
    const project = projectsData[activeProjectModalIndex]
    if (!project || !mediaLightboxContent) return

    const mediaItems = (project.media && Array.isArray(project.media) && project.media.length > 0)
        ? project.media
        : []

    const N = mediaItems.length
    if (N === 0) {
        mediaLightboxContent.innerHTML = `
            <div class="lightbox-showcase-view ${project.gradClass}">
                <div class="modal-media-glow" style="width: 320px; height: 320px; filter: blur(80px); opacity: 0.35;"></div>
                <i class="${project.icon || 'ri-folder-image-line'} lightbox-media-icon"></i>
            </div>
        `
        if (mediaLightboxPrev) mediaLightboxPrev.style.display = 'none'
        if (mediaLightboxNext) mediaLightboxNext.style.display = 'none'
        return
    }

    currentLightboxMediaIndex = (currentLightboxMediaIndex % N + N) % N
    const mediaItem = mediaItems[currentLightboxMediaIndex] || mediaItems[0]
    const isYouTube = mediaItem.type === 'youtube'
    const isVideo = isYouTube || mediaItem.type === 'video'
    const ytVideoId = isYouTube ? getYouTubeVideoId(mediaItem.src) : null
    const hasRealSrc = Boolean(mediaItem.src && mediaItem.src.trim() !== '')
    const mediaTitle = mediaItem.title || mediaItem.label || mediaItem.badge || (isVideo ? 'Project Demonstration' : 'Screenshot Preview')

    // Dynamic Lightbox Media: Render actual YouTube embed / video / image if src is provided
    let showcaseMediaHtml = ''
    if (isYouTube) {
        if (ytVideoId) {
            showcaseMediaHtml = `
                <div class="lightbox-youtube-container">
                    <iframe
                        src="https://www.youtube.com/embed/${ytVideoId}?autoplay=1&rel=0&modestbranding=1"
                        title="${mediaTitle}"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowfullscreen
                    ></iframe>
                </div>
            `
        } else {
            showcaseMediaHtml = `
                <div class="modal-media-glow" style="width: 320px; height: 320px; filter: blur(80px); opacity: 0.35;"></div>
                <i class="ri-youtube-line lightbox-media-icon" style="font-size: 4.5rem; color: #ff0033; opacity: 0.9;"></i>
                <span class="modal-media-pill" style="position: relative; top: 0; left: 0; margin-top: 1rem;">
                    <i class="ri-youtube-line"></i>
                    YouTube Demo Coming Soon
                </span>
            `
        }
    } else if (hasRealSrc) {
        if (mediaItem.type === 'video') {
            showcaseMediaHtml = `
                <video class="lightbox-real-video" src="${mediaItem.src}" poster="${mediaItem.poster || ''}" controls playsinline autoplay></video>
            `
        } else {
            showcaseMediaHtml = `
                <img class="lightbox-real-img" src="${mediaItem.src}" alt="${mediaTitle}" />
            `
        }
    } else {
        showcaseMediaHtml = `
            <div class="modal-media-glow" style="width: 320px; height: 320px; filter: blur(80px); opacity: 0.35;"></div>
            <i class="${mediaItem.icon || project.icon || 'ri-image-line'} lightbox-media-icon"></i>
        `
    }

    mediaLightboxContent.innerHTML = `
        <div class="lightbox-showcase-view ${project.gradClass}">
            ${showcaseMediaHtml}
        </div>
    `

    if (mediaLightboxPrev) {
        mediaLightboxPrev.style.display = N > 1 ? 'flex' : 'none'
    }
    if (mediaLightboxNext) {
        mediaLightboxNext.style.display = N > 1 ? 'flex' : 'none'
    }
}

function pauseAllVideos() {
    document.querySelectorAll('video').forEach(v => {
        try {
            if (!v.paused) v.pause()
        } catch (err) {
            // ignore
        }
    })
}

function syncModalVideos() {
    if (!projectsModalContent) return
    const videos = projectsModalContent.querySelectorAll('video.modal-card-media-bg')
    videos.forEach(v => {
        try {
            v.muted = true
            const playPromise = v.play()
            if (playPromise !== undefined) {
                playPromise.catch(() => { })
            }
        } catch (e) { }
    })
}

function openMediaLightbox(projectIndex, mediaIndex) {
    activeProjectModalIndex = (projectIndex + projectsData.length) % projectsData.length
    currentLightboxMediaIndex = mediaIndex || 0
    renderLightboxContent()

    if (mediaLightbox) {
        mediaLightbox.classList.add('active')
        mediaLightbox.setAttribute('aria-hidden', 'false')
    }
}

function closeMediaLightbox() {
    if (!mediaLightbox) return
    pauseAllVideos()
    if (mediaLightboxContent) mediaLightboxContent.innerHTML = ''
    mediaLightbox.classList.remove('active')
    mediaLightbox.setAttribute('aria-hidden', 'true')
}

function showNextLightboxMedia() {
    pauseAllVideos()
    const project = projectsData[activeProjectModalIndex]
    if (!project || !project.media || project.media.length <= 1) return
    currentLightboxMediaIndex = (currentLightboxMediaIndex + 1) % project.media.length
    renderLightboxContent()
}

function showPrevLightboxMedia() {
    pauseAllVideos()
    const project = projectsData[activeProjectModalIndex]
    if (!project || !project.media || project.media.length <= 1) return
    currentLightboxMediaIndex = (currentLightboxMediaIndex - 1 + project.media.length) % project.media.length
    renderLightboxContent()
}

if (mediaLightboxClose) {
    mediaLightboxClose.addEventListener('click', closeMediaLightbox)
}

if (mediaLightboxBackdrop) {
    mediaLightboxBackdrop.addEventListener('click', closeMediaLightbox)
}

if (mediaLightboxPrev) {
    mediaLightboxPrev.addEventListener('click', (e) => {
        e.stopPropagation()
        showPrevLightboxMedia()
    })
}

if (mediaLightboxNext) {
    mediaLightboxNext.addEventListener('click', (e) => {
        e.stopPropagation()
        showNextLightboxMedia()
    })
}

/*==================== PROJECT DETAILS MODAL & APP STORE-STYLE CAROUSEL ENGINE ====================*/
let modalMediaPage = 0

function getModalMediaConfig() {
    if (!projectsModalContent) return { cardWidth: 0, gap: 15, peek: 52, totalPages: 1, isMobile: false, trackWidth: 0, viewportWidth: 0 }
    const project = projectsData[activeProjectModalIndex]
    const N = (project && project.media && Array.isArray(project.media)) ? project.media.length : 0
    const viewport = projectsModalContent.querySelector('#modal-gallery-viewport')
    const track = projectsModalContent.querySelector('#modal-gallery-track')
    const firstCard = projectsModalContent.querySelector('.modal-media-card')
    const isMobile = window.innerWidth <= 680
    const itemsPerPage = isMobile ? 1 : 2
    const totalPages = Math.max(1, Math.ceil(N / itemsPerPage))

    if (!viewport || !firstCard || !track) {
        return { cardWidth: 0, gap: 15, peek: isMobile ? 40 : 52, totalPages, isMobile, trackWidth: 0, viewportWidth: 0 }
    }

    const computedTrack = window.getComputedStyle(track)
    const gap = parseFloat(computedTrack.gap) || (isMobile ? 10.4 : 15.2)
    const cardWidth = firstCard.offsetWidth
    const peek = isMobile ? 40 : 52
    return { cardWidth, gap, peek, totalPages, isMobile, viewportWidth: viewport.offsetWidth, trackWidth: track.scrollWidth }
}

function updateModalNavControls() {
    if (!projectsModalContent) return
    const prevBtn = projectsModalContent.querySelector('#modal-gallery-prev')
    const nextBtn = projectsModalContent.querySelector('#modal-gallery-next')
    const config = getModalMediaConfig()
    const { totalPages } = config

    if (prevBtn) {
        const isDisabled = modalMediaPage <= 0 || totalPages <= 1
        prevBtn.classList.toggle('is-disabled', isDisabled)
        prevBtn.setAttribute('aria-disabled', isDisabled ? 'true' : 'false')
        prevBtn.tabIndex = isDisabled ? -1 : 0
    }
    if (nextBtn) {
        const isDisabled = modalMediaPage >= totalPages - 1 || totalPages <= 1
        nextBtn.classList.toggle('is-disabled', isDisabled)
        nextBtn.setAttribute('aria-disabled', isDisabled ? 'true' : 'false')
        nextBtn.tabIndex = isDisabled ? -1 : 0
    }
}

function positionModalTrack(animated = true) {
    if (!projectsModalContent) return
    const track = projectsModalContent.querySelector('#modal-gallery-track')
    if (!track) return

    const config = getModalMediaConfig()
    const { cardWidth, gap, peek, totalPages, isMobile, trackWidth, viewportWidth } = config
    modalMediaPage = Math.max(0, Math.min(modalMediaPage, totalPages - 1))

    let translateX = 0
    if (totalPages <= 1 || cardWidth <= 0) {
        translateX = 0
    } else if (modalMediaPage === 0) {
        // Page 1: Media 1 & 2 primary (flush left), Media 3 peeks on right
        translateX = 0
    } else if (modalMediaPage === totalPages - 1) {
        // Final Page: Last media pair flush right, previous media peeks on left
        translateX = Math.max(0, trackWidth - viewportWidth)
    } else {
        // Middle Page: Previous media peeks on left, 2 primary media items centered, next media peeks on right
        const pageFirstCardIndex = isMobile ? modalMediaPage : modalMediaPage * 2
        translateX = pageFirstCardIndex * (cardWidth + gap) - (peek / 2)
    }

    if (!animated) {
        track.style.transition = 'none'
        track.style.transform = `translateX(-${translateX}px)`
        track.offsetHeight // Force reflow
        track.style.transition = 'transform 0.4s cubic-bezier(0.25, 1, 0.5, 1)'
    } else {
        track.style.transition = 'transform 0.4s cubic-bezier(0.25, 1, 0.5, 1)'
        track.style.transform = `translateX(-${translateX}px)`
    }

    updateModalNavControls()
}

function navigateModalPage(direction) {
    const config = getModalMediaConfig()
    const { totalPages } = config
    if (totalPages <= 1) return

    const targetPage = Math.max(0, Math.min(modalMediaPage + direction, totalPages - 1))
    if (targetPage !== modalMediaPage) {
        modalMediaPage = targetPage
        positionModalTrack(true)
        syncModalVideos()
    }
}

function renderProjectModal(index) {
    activeProjectModalIndex = (index + projectsData.length) % projectsData.length
    modalMediaPage = 0

    const project = projectsData[activeProjectModalIndex]
    if (!project || !projectsModalContent) return

    const mediaItems = (project.media && Array.isArray(project.media) && project.media.length > 0) ? project.media : []
    const N = mediaItems.length

    // Data-driven cards: Automatically renders real image/YouTube thumbnail if `src` is populated, otherwise renders clean reserved placeholder
    const mediaCardsHtml = mediaItems.map((m, idx) => {
        const isYouTube = m.type === 'youtube'
        const isVideo = isYouTube || m.type === 'video'
        const ytVideoId = isYouTube ? getYouTubeVideoId(m.src) : null
        const hasRealMedia = isYouTube ? Boolean(ytVideoId) : Boolean(m.src && m.src.trim() !== '')
        const mediaTitle = m.title || m.label || m.badge || (isVideo ? 'Demo Video' : 'System Preview')

        if (isVideo) {
            let bgThumbnail = ''
            if (isYouTube && ytVideoId) {
                bgThumbnail = `https://img.youtube.com/vi/${ytVideoId}/hqdefault.jpg`
            } else if (m.poster) {
                bgThumbnail = m.poster
            }

            const videoBgHtml = bgThumbnail ? `
                <img class="modal-card-media-bg" src="${bgThumbnail}" alt="${mediaTitle}" loading="lazy" />
                <div class="modal-card-media-overlay"></div>
            ` : (m.src && !isYouTube ? `
                <video class="modal-card-media-bg" src="${m.src}" poster="${m.poster || ''}" preload="auto" playsinline muted loop autoplay></video>
                <div class="modal-card-media-overlay"></div>
            ` : '')

            return `
                <div class="modal-media-card modal-media-card--video ${project.gradClass}" data-media-index="${idx}" tabindex="0" role="button" aria-label="View ${mediaTitle}">
                    ${videoBgHtml}
                    <span class="modal-media-pill">
                        <i class="${isYouTube ? 'ri-youtube-line' : 'ri-video-line'}"></i>
                        Demo Video
                    </span>
                    ${!bgThumbnail && (!m.src || isYouTube) ? '<div class="modal-media-glow"></div>' : ''}
                    <div class="modal-media-card-inner">
                        <div class="modal-media-trigger" aria-hidden="true">
                            <i class="ri-play-fill"></i>
                        </div>
                    </div>
                </div>
            `
        } else {
            // Clean Image card: No category pill, no caption, no fullscreen overlay
            const imgBgHtml = hasRealMedia
                ? `<img class="modal-card-media-bg" src="${m.src}" alt="${mediaTitle}" loading="lazy" />`
                : `<div class="modal-media-glow"></div><i class="${m.icon || project.icon || 'ri-image-line'} lightbox-media-icon" style="font-size: 3.5rem; opacity: 0.7; margin: 0;"></i>`
            return `
                <div class="modal-media-card modal-media-card--image ${project.gradClass}" data-media-index="${idx}" tabindex="0" role="button" aria-label="View Screenshot ${idx}">
                    ${imgBgHtml}
                </div>
            `
        }
    }).join('')

    // Gallery container: Adapts cleanly if 0 media, 1-2 media, or 3+ media
    let galleryHtml = ''
    if (N === 0) {
        galleryHtml = `
            <div class="modal-empty-gallery">
                <i class="ri-folder-image-line modal-empty-icon"></i>
                <h4 class="modal-empty-title">Project media coming soon</h4>
                <p class="modal-empty-desc">Video walkthroughs and high-resolution interface previews will be available here.</p>
            </div>
        `
    } else {
        const isMobile = window.innerWidth <= 680
        const totalPages = Math.max(1, Math.ceil(N / (isMobile ? 1 : 2)))
        const showNav = totalPages > 1

        galleryHtml = `
            <div class="modal-gallery-wrapper">
                <div class="modal-gallery-viewport" id="modal-gallery-viewport">
                    ${showNav ? `
                        <button type="button" class="modal-gallery-nav modal-gallery-prev is-disabled" id="modal-gallery-prev" aria-label="Previous media page" title="Previous Page">
                            <i class="ri-arrow-left-s-line"></i>
                        </button>
                    ` : ''}
                    <div class="modal-gallery-track" id="modal-gallery-track">
                        ${mediaCardsHtml}
                    </div>
                    ${showNav ? `
                        <button type="button" class="modal-gallery-nav modal-gallery-next" id="modal-gallery-next" aria-label="Next media page" title="Next Page">
                            <i class="ri-arrow-right-s-line"></i>
                        </button>
                    ` : ''}
                </div>
            </div>
        `
    }

    // Problem & Solution Section (if present)
    const problemSolutionHtml = (project.problem || project.solution) ? `
        <div class="modal-problem-solution-grid">
            ${project.problem ? `
                <div class="modal-callout-card modal-callout-card--problem">
                    <div class="modal-callout-header">
                        <i class="ri-error-warning-line"></i>
                        <span>Problem</span>
                    </div>
                    <p class="modal-callout-text">${project.problem}</p>
                </div>
            ` : ''}
            ${project.solution ? `
                <div class="modal-callout-card modal-callout-card--solution">
                    <div class="modal-callout-header">
                        <i class="ri-lightbulb-line"></i>
                        <span>Solution</span>
                    </div>
                    <p class="modal-callout-text">${project.solution}</p>
                </div>
            ` : ''}
        </div>
    ` : ''

    // My Role Section (if present)
    const roleHtml = project.role ? `
        <div class="modal-section">
            <h3 class="modal-section-title"><i class="ri-user-star-line"></i> My Role</h3>
            <div class="modal-role-card">
                ${project.role.title ? `<div class="modal-role-title-badge">${project.role.title}</div>` : ''}
                ${(project.role.responsibilities && project.role.responsibilities.length > 0) ? `
                    <ul class="modal-role-bullets">
                        ${project.role.responsibilities.map(r => `<li>${r}</li>`).join('')}
                    </ul>
                ` : ''}
            </div>
        </div>
    ` : ''

    // Key Features Section
    const featuresHtml = (project.features && project.features.length > 0) ? project.features.map(f => {
        if (f.title) {
            return `
                <div class="modal-feature-item">
                    <i class="${f.icon || 'ri-checkbox-circle-line'} modal-feature-icon"></i>
                    <div class="modal-feature-content">
                        <strong class="modal-feature-title">${f.title}</strong>
                        <p class="modal-feature-desc">${f.text || f.desc || ''}</p>
                    </div>
                </div>
            `
        }
        return `
            <div class="modal-feature-item">
                <i class="${f.icon || 'ri-checkbox-circle-line'} modal-feature-icon"></i>
                <span class="modal-feature-text">${f.text}</span>
            </div>
        `
    }).join('') : ''

    // Technologies Section (categorized or tags)
    let techHtml = ''
    if (project.techCategories && project.techCategories.length > 0) {
        techHtml = `
            <div class="modal-tech-groups">
                ${project.techCategories.map(tc => `
                    <div class="modal-tech-group">
                        <span class="modal-tech-group-title">${tc.label}</span>
                        <span class="modal-tech-group-tags">${tc.stack}</span>
                    </div>
                `).join('')}
            </div>
        `
    } else if (project.tags && project.tags.length > 0) {
        techHtml = `
            <div class="modal-tags-list">
                ${project.tags.map(t => `<span class="modal-tag">${t}</span>`).join('')}
            </div>
        `
    }

    // Results / Highlights Section (if present)
    const resultsHtml = project.results ? `
        <div class="modal-section">
            <h3 class="modal-section-title"><i class="ri-trophy-line"></i> Results / Highlights</h3>
            <div class="modal-results-container">
                ${(project.results.metrics && project.results.metrics.length > 0) ? `
                    <div class="modal-results-grid">
                        ${project.results.metrics.map(m => `
                            <div class="modal-metric-card">
                                <span class="modal-metric-value">${m.value}</span>
                                <span class="modal-metric-label">${m.label}</span>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
                ${(project.results.highlights && project.results.highlights.length > 0) ? `
                    <div class="modal-highlights-card">
                        <ul class="modal-highlights-bullets">
                            ${project.results.highlights.map(h => {
        const colonIdx = h.indexOf(':')
        if (colonIdx > -1) {
            const title = h.substring(0, colonIdx)
            const desc = h.substring(colonIdx + 1)
            return `<li><strong>${title}:</strong>${desc}</li>`
        }
        return `<li>${h}</li>`
    }).join('')}
                        </ul>
                    </div>
                ` : ''}
                ${project.results.context ? `<p class="modal-results-context">${project.results.context}</p>` : ''}
            </div>
        </div>
    ` : ''

    // Documentation & Resources Section (External Drive Documents & Project Links)
    const allDocItems = [
        ...(project.documents || []),
        ...(project.links || [])
    ]

    const docSectionHtml = (allDocItems.length > 0) ? `
        <!-- Attachments & Documentation Section -->
        <div class="modal-doc-section">
            <h3 class="modal-section-title"><i class="ri-attachment-2"></i> Documentation & Resources</h3>
            <div class="modal-doc-grid">
                ${allDocItems.map(item => `
                    <a href="${item.url}" target="_blank" rel="noopener noreferrer" class="modal-doc-card ${item.primary ? 'modal-doc-card--primary' : ''}" aria-label="${item.label || item.title} for ${project.title}">
                        <i class="${item.icon || (item.type === 'document' ? 'ri-file-pdf-2-line' : 'ri-external-link-line')}"></i>
                        <span>${item.label || item.title || 'View Document ↗'}</span>
                    </a>
                `).join('')}
            </div>
        </div>
    ` : ''

    projectsModalContent.innerHTML = `
        <!-- App Store-Inspired Header with Category / Project Type Badge -->
        <div class="modal-product-header">
            <div class="modal-header-main">
                <div class="modal-header-icon-box">
                    ${project.logo ? `<img src="${project.logo}" alt="${project.title} Logo" class="modal-header-logo-img" />` : `<i class="${project.icon}"></i>`}
                </div>
                <div class="modal-header-text">
                    <h2 class="modal-header-title">${project.title}</h2>
                    <div class="modal-header-meta">
                        <span>${project.category}</span>
                        <span class="dot">•</span>
                        <span>${project.year}</span>
                    </div>
                </div>
            </div>
            <div class="modal-type-badge">
                <i class="ri-apps-line"></i>
                <span>${project.badge}</span>
            </div>
        </div>

        ${galleryHtml}

        <!-- Structured Project Overview -->
        <div class="modal-section">
            <h3 class="modal-section-title"><i class="ri-information-line"></i> Project Overview</h3>
            <p class="modal-project-desc">${project.overview || project.fullDescription}</p>
        </div>

        ${problemSolutionHtml}

        ${roleHtml}

        <!-- Key Features & Capabilities -->
        <div class="modal-section">
            <h3 class="modal-section-title"><i class="ri-sparkling-fill"></i> Key Features</h3>
            <div class="modal-features-grid">
                ${featuresHtml}
            </div>
        </div>

        <!-- Technologies & Architecture -->
        <div class="modal-section">
            <h3 class="modal-section-title"><i class="ri-stack-line"></i> Technologies</h3>
            ${techHtml}
        </div>

        ${resultsHtml}

        ${docSectionHtml}
    `

    // Minimal Outer-Edge Previous / Next Arrows
    const modalPrev = projectsModalContent.querySelector('#modal-gallery-prev')
    const modalNext = projectsModalContent.querySelector('#modal-gallery-next')
    if (modalPrev) {
        modalPrev.addEventListener('click', (e) => {
            e.stopPropagation()
            navigateModalPage(-1)
        })
    }
    if (modalNext) {
        modalNext.addEventListener('click', (e) => {
            e.stopPropagation()
            navigateModalPage(1)
        })
    }

    // Click & Keydown Listeners for Media Cards (Open Lightbox)
    const mediaCards = projectsModalContent.querySelectorAll('.modal-media-card')
    mediaCards.forEach(card => {
        card.addEventListener('click', () => {
            const mIdx = parseInt(card.getAttribute('data-media-index'), 10)
            if (!isNaN(mIdx)) openMediaLightbox(activeProjectModalIndex, mIdx)
        })

        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                const mIdx = parseInt(card.getAttribute('data-media-index'), 10)
                if (!isNaN(mIdx)) openMediaLightbox(activeProjectModalIndex, mIdx)
            }
        })
    })

    // Touch swipe support for modal gallery (distinguishing horizontal swipe from vertical scrolling)
    const modalViewport = projectsModalContent.querySelector('#modal-gallery-viewport')
    if (modalViewport) {
        let touchStartModalX = 0
        let touchStartModalY = 0
        modalViewport.addEventListener('touchstart', (e) => {
            touchStartModalX = e.changedTouches[0].screenX
            touchStartModalY = e.changedTouches[0].screenY
        }, { passive: true })
        modalViewport.addEventListener('touchend', (e) => {
            const touchEndModalX = e.changedTouches[0].screenX
            const touchEndModalY = e.changedTouches[0].screenY
            const diffX = touchStartModalX - touchEndModalX
            const diffY = touchStartModalY - touchEndModalY
            if (Math.abs(diffX) > 35 && Math.abs(diffX) > Math.abs(diffY) * 1.3) {
                if (diffX > 0) {
                    navigateModalPage(1)
                } else {
                    navigateModalPage(-1)
                }
            }
        }, { passive: true })
    }

    // Initial position & video autoplay
    requestAnimationFrame(() => {
        positionModalTrack(false)
        syncModalVideos()
    })
    setTimeout(() => {
        positionModalTrack(false)
        syncModalVideos()
    }, 60)
}

function openProjectModal(index) {
    if (!projectsModal) return
    activeProjectModalIndex = (index + projectsData.length) % projectsData.length
    renderProjectModal(activeProjectModalIndex)
    projectsModal.classList.add('active')
    projectsModal.setAttribute('aria-hidden', 'false')
    document.body.style.overflow = 'hidden'

    requestAnimationFrame(() => {
        positionModalTrack(false)
        syncModalVideos()
    })
    setTimeout(() => {
        positionModalTrack(false)
        syncModalVideos()
    }, 60)
}

function closeProjectModal() {
    if (!projectsModal) return
    pauseAllVideos()
    projectsModal.classList.remove('active')
    projectsModal.setAttribute('aria-hidden', 'true')
    document.body.style.overflow = ''
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

// Keyboard controls for modal & lightbox (Escape, ArrowLeft, ArrowRight)
window.addEventListener('keydown', event => {
    if (mediaLightbox && mediaLightbox.classList.contains('active')) {
        if (event.key === 'Escape') {
            closeMediaLightbox()
            return
        } else if (event.key === 'ArrowRight') {
            showNextLightboxMedia()
            return
        } else if (event.key === 'ArrowLeft') {
            showPrevLightboxMedia()
            return
        }
    }

    if (projectsModal && projectsModal.classList.contains('active')) {
        if (event.key === 'Escape') {
            closeProjectModal()
        } else if (event.key === 'ArrowRight') {
            navigateModalPage(1)
        } else if (event.key === 'ArrowLeft') {
            navigateModalPage(-1)
        }
    }
})

// Initialize carousel on load
window.addEventListener('load', () => {
    updateProjectsCarousel()
})

// Initial call
updateProjectsCarousel()

/*==================== INTERNSHIP FEEDBACK SHUFFLE DECK ====================*/
function initFeedbackDeck() {
    const deck = document.getElementById('feedback-deck')
    if (!deck) return

    const cards = Array.from(deck.querySelectorAll('.feedback-card'))
    if (cards.length === 0) return

    let currentOrder = [0, 1, 2, 3]
    let isAnimating = false

    function renderDeckPositions() {
        cards.forEach((card, originalIndex) => {
            const pos = currentOrder.indexOf(originalIndex)
            card.setAttribute('data-card-pos', pos)
            if (pos === 0) {
                card.setAttribute('tabindex', '0')
                card.setAttribute('aria-hidden', 'false')
            } else {
                card.setAttribute('tabindex', '-1')
                card.setAttribute('aria-hidden', 'true')
            }
        })
    }

    function advanceDeck() {
        if (isAnimating) return
        isAnimating = true

        const activeCardOriginalIndex = currentOrder[0]
        const activeCard = cards[activeCardOriginalIndex]
        
        activeCard.classList.add('is-shuffling')

        setTimeout(() => {
            // Rotate order: shift top card to bottom of deck (1 -> 2 -> 3 -> 0)
            const topCard = currentOrder.shift()
            currentOrder.push(topCard)

            activeCard.classList.remove('is-shuffling')
            renderDeckPositions()

            setTimeout(() => {
                isAnimating = false
            }, 300)
        }, 180)
    }

    deck.addEventListener('click', (e) => {
        const clickedCard = e.target.closest('.feedback-card')
        if (clickedCard && clickedCard.getAttribute('data-card-pos') === '0') {
            advanceDeck()
        }
    })

    deck.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            const activeCard = document.activeElement ? document.activeElement.closest('.feedback-card') : null
            if (activeCard && activeCard.getAttribute('data-card-pos') === '0') {
                e.preventDefault()
                advanceDeck()
            }
        }
    })

    renderDeckPositions()
}

// Initialize feedback deck
initFeedbackDeck()
