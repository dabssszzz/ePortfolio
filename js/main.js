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

/*==================== COMPACT HEADER ====================*/
function scrollHeader() {
    if (!header) return

    const wasScrolled = header.classList.contains('scroll-header')
    const isScrolled = window.scrollY >= 64
    if (wasScrolled !== isScrolled) {
        header.classList.toggle('scroll-header', isScrolled)
        setTimeout(updateIndicators, 60)
    }
}

window.addEventListener('scroll', scrollHeader)
window.addEventListener('load', scrollHeader)

/*==================== SHOW SCROLL UP ====================*/
function scrollUp() {
    const scrollUpBtn = document.getElementById('scroll-up')
    if (!scrollUpBtn) return
    if (window.scrollY >= 560) {
        scrollUpBtn.classList.add('show-scroll')
    } else {
        scrollUpBtn.classList.remove('show-scroll')
    }
}
window.addEventListener('scroll', scrollUp)

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
