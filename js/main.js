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
                type: "youtube",
                src: "https://www.youtube.com/embed/VIDEO_ID",
                title: "Live Map Demo",
                badge: "Interactive Map Walkthrough",
                icon: "ri-youtube-line",
                caption: "Geospatial Station Navigation, Real-Time Fuel Prices & Route Refueling Calculator"
            },
            {
                type: "image",
                src: "",
                title: "Price Trends",
                badge: "Historical Analytics",
                icon: "ri-line-chart-line",
                caption: "Predictive Fuel Price Trend Analytics with Regulatory Price Movement Alerts"
            },
            {
                type: "image",
                src: "",
                title: "Station Locator",
                badge: "Station Finder UI",
                icon: "ri-map-pin-range-line",
                caption: "Multi-Brand Gas Station Comparative Pricing & Fuel Grade Filter Interface"
            },
            {
                type: "image",
                src: "",
                title: "Cost Calculator",
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
        documents: [],
        links: [
            { label: "Live Web App ↗", icon: "ri-external-link-line", url: "#", primary: true },
            { label: "API Reference ↗", icon: "ri-code-s-slash-line", url: "#", primary: false }
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
                type: "youtube",
                src: "https://www.youtube.com/embed/VIDEO_ID",
                title: "System Demo",
                badge: "Administrative Walkthrough",
                icon: "ri-youtube-line",
                caption: "Resident Profiling, Cryptographic QR Generation & Instant Verification Flow"
            },
            {
                type: "image",
                src: "",
                title: "Resident Portal",
                badge: "Civil Registration UI",
                icon: "ri-user-add-line",
                caption: "Demographic Entry, Document Clearance Submission & Photo Capture Portal"
            },
            {
                type: "image",
                src: "",
                title: "ID Card Preview",
                badge: "Card Layout Generator",
                icon: "ri-id-card-fill",
                caption: "Automated High-Resolution Print-Ready ID Card Output with Anti-Forgery QR"
            },
            {
                type: "image",
                src: "",
                title: "Admin Dashboard",
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
        documents: [
            {
                type: "document",
                title: "System Architecture Blueprint",
                label: "View Architecture Blueprint ↗",
                icon: "ri-file-pdf-2-line",
                url: "EXTERNAL_DOCUMENT_URL",
                primary: false
            }
        ],
        links: [
            { label: "Admin Portal Demo ↗", icon: "ri-dashboard-line", url: "#", primary: true }
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
                type: "youtube",
                src: "https://www.youtube.com/embed/VIDEO_ID",
                title: "App Walkthrough",
                badge: "Emergency Flow Walkthrough",
                icon: "ri-youtube-line",
                caption: "Disaster Alert Broadcasting, Incident Reporting & Emergency Hotline Direct Dial"
            },
            {
                type: "image",
                src: "",
                title: "Alert Center",
                badge: "Disaster Notification UI",
                icon: "ri-alarm-warning-line",
                caption: "High-Priority Typhoon Advisory Screen with Evacuation Center Locator"
            },
            {
                type: "image",
                src: "",
                title: "Hotline Directory",
                badge: "First Responder Direct Dial",
                icon: "ri-phone-line",
                caption: "One-Touch Emergency Directory Linking Police, Fire, Rescue & Medical Teams"
            },
            {
                type: "image",
                src: "",
                title: "Notice Board",
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
        documents: [
            {
                type: "document",
                title: "Community Deployment Guide",
                label: "View Community Guide ↗",
                icon: "ri-file-list-3-line",
                url: "EXTERNAL_DOCUMENT_URL",
                primary: true
            }
        ],
        links: [
            { label: "Source Code ↗", icon: "ri-github-line", url: "#", primary: false }
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
                type: "youtube",
                src: "https://www.youtube.com/embed/VIDEO_ID",
                title: "Resort Tour",
                badge: "Interactive Villa Walkthrough",
                icon: "ri-youtube-line",
                caption: "Immersive Virtual Villa Walkthrough & Seamless Reservation Booking Flow"
            },
            {
                type: "image",
                src: "",
                title: "Villas Gallery",
                badge: "Eco-Luxury Suites Showcase",
                icon: "ri-hotel-line",
                caption: "Interactive High-Definition Suite Gallery with Panoramic Amenity Previews"
            },
            {
                type: "image",
                src: "",
                title: "Reservation Desk",
                badge: "Booking & Rate Engine",
                icon: "ri-calendar-check-line",
                caption: "Dynamic Date Range Availability Calendar with Real-Time Currency Conversion"
            },
            {
                type: "image",
                src: "",
                title: "Island Concierge",
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
        documents: [
            {
                type: "document",
                title: "UI/UX Case Study Documentation",
                label: "View UI/UX Case Study ↗",
                icon: "ri-palette-line",
                url: "EXTERNAL_DOCUMENT_URL",
                primary: false
            }
        ],
        links: [
            { label: "Live Resort Portal ↗", icon: "ri-external-link-line", url: "#", primary: true }
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
                type: "youtube",
                src: "https://www.youtube.com/embed/VIDEO_ID",
                title: "Concept Demo",
                badge: "Interactive Reading Walkthrough",
                icon: "ri-youtube-line",
                caption: "Fluid Typography Scaling, Distraction-Free Reading Mode & Dynamic TOC Spy"
            },
            {
                type: "image",
                src: "",
                title: "Article Layout",
                badge: "Typographic Layout UI",
                icon: "ri-article-line",
                caption: "Harmonious Typographic Proportions with Focus Reading Line Length"
            },
            {
                type: "image",
                src: "",
                title: "Citation Previews",
                badge: "Instant Hover Cards",
                icon: "ri-file-search-line",
                caption: "Contextual Citation Cards Revealing Source References Without Page Reloads"
            },
            {
                type: "image",
                src: "",
                title: "Theme Switcher",
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
        documents: [
            {
                type: "document",
                title: "Design System Specifications",
                label: "View Design System Specs ↗",
                icon: "ri-layout-masonry-line",
                url: "EXTERNAL_DOCUMENT_URL",
                primary: false
            }
        ],
        links: [
            { label: "Interactive Prototype ↗", icon: "ri-eye-line", url: "#", primary: true }
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
                type: "youtube",
                src: "https://www.youtube.com/embed/VIDEO_ID",
                title: "Editorial Demo",
                badge: "News Aggregator Walkthrough",
                icon: "ri-youtube-line",
                caption: "High-Speed Headline Skimming, Live Breaking News Ticker & Multi-Column Layout"
            },
            {
                type: "image",
                src: "",
                title: "3-Column Grid",
                badge: "High-Density Grid UI",
                icon: "ri-layout-column-line",
                caption: "Ultra-Fast 3-Column Responsive Headline Grid Built for Rapid Scanning"
            },
            {
                type: "image",
                src: "",
                title: "Topic Filters",
                badge: "Instant Categorization",
                icon: "ri-filter-3-line",
                caption: "Zero-Latency Client-Side Topic Filters (Politics, Markets, Technology, World)"
            },
            {
                type: "image",
                src: "",
                title: "Ticker Stream",
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
        documents: [
            {
                type: "document",
                title: "Design Rationale & Performance Report",
                label: "View Design Rationale ↗",
                icon: "ri-book-open-line",
                url: "EXTERNAL_DOCUMENT_URL",
                primary: false
            }
        ],
        links: [
            { label: "Live News Prototype ↗", icon: "ri-external-link-line", url: "#", primary: true }
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
                playPromise.catch(() => {})
            }
        } catch (e) {}
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
