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
    const targetTop = target.getBoundingClientRect().top + window.pageYOffset - getHeaderOffset()
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

/*==================== NAVIGATION LINK ACTIONS ====================*/
navLinks.forEach(link => {
    link.addEventListener('click', event => {
        const targetId = link.getAttribute('href')
        const target = document.querySelector(targetId)

        if (!target) return

        event.preventDefault()
        setMenuState(false)
        setActiveLink(target.id)
        scrollToSection(target)
    })
})

/*==================== SCROLL SECTIONS ACTIVE LINK ====================*/
let ticking = false

function updateActiveSection() {
    const activationPoint = window.scrollY + getHeaderOffset() + Math.min(window.innerHeight * .28, 220)
    let activeSectionId = sections[0] ? sections[0].id : null

    sections.forEach(section => {
        if (activationPoint >= section.offsetTop) {
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
    updateActiveSection()
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
