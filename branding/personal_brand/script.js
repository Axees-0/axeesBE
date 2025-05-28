// Elegant animations and interactions
document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const container = document.querySelector('.container');
    const heading = document.querySelector('h1');
    const navLinks = document.querySelectorAll('nav a');
    const sections = document.querySelectorAll('.section');
    const imageContainer = document.querySelector('.image-container');
    const profileImage = document.querySelector('.image-container img');
    
    // Check for mobile
    let isMobile = window.innerWidth <= 768;
    
    // Handle viewport resize
    window.addEventListener('resize', () => {
        isMobile = window.innerWidth <= 768;
        
        // Reset transforms on resize
        if (profileImage) {
            imageContainer.style.transform = 'none';
            profileImage.style.transform = 'none';
        }
    });
    
    // Create initial animations
    const animateIn = () => {
        // Animate landing page elements
        container.style.opacity = 1;
        
        setTimeout(() => {
            heading.style.opacity = 1;
            heading.style.transform = 'translateY(0)';
        }, 300);
        
        // Animate nav items one by one
        navLinks.forEach((link, index) => {
            setTimeout(() => {
                link.style.opacity = 1;
                link.style.transform = 'translateY(0)';
            }, 600 + (index * 100));
        });
    };
    
    // Set initial states
    container.style.opacity = 0;
    container.style.transition = 'opacity 1s ease';
    
    heading.style.opacity = 0;
    heading.style.transform = 'translateY(20px)';
    heading.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
    
    navLinks.forEach(link => {
        link.style.opacity = 0;
        link.style.transform = 'translateY(10px)';
        link.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    });
    
    // Set up sections
    sections.forEach(section => {
        section.style.transition = 'opacity 0.8s ease';
        section.style.opacity = 0.4;
    });
    
    // Text reveal effect for visible sections
    const createTextReveal = (section) => {
        if (!section) return;
        
        const elements = section.querySelectorAll('p, li');
        elements.forEach(el => {
            if (!el.classList.contains('revealed')) {
                el.classList.add('revealed');
            }
        });
    };
    
    // Smooth scrolling for navigation links
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop,
                    behavior: 'smooth'
                });
                
                // Add active class to clicked link
                navLinks.forEach(item => item.classList.remove('active'));
                this.classList.add('active');
            }
        });
    });
    
    // Intersection Observer for section visibility
    const observeSection = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = 1;
                entry.target.classList.add('visible');
                createTextReveal(entry.target);
                
                // Highlight corresponding nav item
                const id = entry.target.getAttribute('id');
                navLinks.forEach(item => {
                    if (item.getAttribute('href') === `#${id}`) {
                        item.classList.add('active');
                    } else {
                        item.classList.remove('active');
                    }
                });
            } else {
                entry.target.style.opacity = 0.4;
                entry.target.classList.remove('visible');
            }
        });
    }, { threshold: 0.3 });
    
    // Observe sections
    sections.forEach(section => {
        observeSection.observe(section);
    });
    
    // Image hover effect (desktop only)
    if (!isMobile && profileImage) {
        imageContainer.addEventListener('mousemove', (e) => {
            const rect = imageContainer.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width - 0.5;
            const y = (e.clientY - rect.top) / rect.height - 0.5;
            
            // Just subtle tilt without resizing
            imageContainer.style.transform = `perspective(1000px) rotateY(${x * 2}deg) rotateX(${y * -2}deg)`;
        });
        
        imageContainer.addEventListener('mouseleave', () => {
            imageContainer.style.transform = 'perspective(1000px) rotateY(0) rotateX(0)';
        });
    }
    
    // Start animations
    setTimeout(animateIn, 200);
    
    // Previous Ventures Panel functionality
    const previousVenturesToggle = document.getElementById('previous-ventures-toggle');
    const venturesPanel = document.getElementById('ventures-panel');
    const panelOverlay = document.getElementById('panel-overlay');
    const panelClose = document.getElementById('panel-close');
    
    // Open panel
    if (previousVenturesToggle) {
        previousVenturesToggle.addEventListener('click', (e) => {
            e.preventDefault();
            venturesPanel.classList.add('active');
            panelOverlay.classList.add('active');
            document.body.style.overflow = 'hidden'; // Prevent body scroll when panel is open
        });
    }
    
    // Close panel function
    const closePanel = () => {
        venturesPanel.classList.remove('active');
        panelOverlay.classList.remove('active');
        document.body.style.overflow = ''; // Restore body scroll
    };
    
    // Close button
    if (panelClose) {
        panelClose.addEventListener('click', closePanel);
    }
    
    // Close on overlay click
    if (panelOverlay) {
        panelOverlay.addEventListener('click', closePanel);
    }
    
    // Close on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && venturesPanel.classList.contains('active')) {
            closePanel();
        }
    });
    
    // Scroll to dismiss functionality
    if (venturesPanel) {
        let isAtBottom = false;
        let startScrollTop = 0;
        let isDismissing = false;
        let hasReachedBottom = false;
        const scrollHint = document.querySelector('.scroll-dismiss-hint');
        
        // Check if panel is scrolled to bottom
        const checkIfAtBottom = () => {
            const scrollHeight = venturesPanel.scrollHeight;
            const clientHeight = venturesPanel.clientHeight;
            const scrollTop = venturesPanel.scrollTop;
            const maxScroll = scrollHeight - clientHeight;
            
            // Consider "at bottom" if within 5px of the bottom
            return scrollTop >= maxScroll - 5;
        };
        
        // Handle scroll events
        venturesPanel.addEventListener('scroll', () => {
            const currentScrollTop = venturesPanel.scrollTop;
            const scrollDelta = currentScrollTop - startScrollTop;
            
            // Update bottom status
            const wasAtBottom = isAtBottom;
            isAtBottom = checkIfAtBottom();
            
            // If we just reached the bottom, record the scroll position
            if (isAtBottom && !wasAtBottom) {
                startScrollTop = currentScrollTop;
                hasReachedBottom = true;
                // Hide the hint after reaching bottom
                if (scrollHint) {
                    scrollHint.style.opacity = '0';
                    scrollHint.style.transform = 'translateY(20px)';
                }
            }
            
            // If at bottom and scrolling down (overscroll attempt)
            if (isAtBottom && scrollDelta > 0 && !isDismissing) {
                // Calculate overscroll amount (how much past the bottom we've "scrolled")
                const overscrollAmount = scrollDelta;
                
                // Start moving the panel out based on overscroll
                const translateAmount = Math.min(overscrollAmount * 3, venturesPanel.offsetWidth);
                venturesPanel.style.transform = `translateX(${translateAmount}px)`;
                venturesPanel.style.transition = 'none';
                
                // If scrolled enough (more than 100px past bottom), trigger dismiss
                if (overscrollAmount > 100) {
                    isDismissing = true;
                    venturesPanel.style.transition = 'transform 0.3s ease-out';
                    venturesPanel.style.transform = `translateX(${venturesPanel.offsetWidth}px)`;
                    
                    setTimeout(() => {
                        closePanel();
                        venturesPanel.style.transform = '';
                        isDismissing = false;
                        isAtBottom = false;
                    }, 300);
                }
            } else if (!isAtBottom && !isDismissing) {
                // Reset transform when not at bottom
                venturesPanel.style.transform = '';
                venturesPanel.style.transition = 'transform 0.2s ease-out';
            }
        });
        
        // Handle wheel events for smoother overscroll detection
        venturesPanel.addEventListener('wheel', (e) => {
            if (isAtBottom && e.deltaY > 0 && !isDismissing) {
                // Prevent default scrolling when at bottom and scrolling down
                e.preventDefault();
                
                // Simulate overscroll by manually adjusting scroll position
                const currentScroll = venturesPanel.scrollTop;
                const maxScroll = venturesPanel.scrollHeight - venturesPanel.clientHeight;
                
                // Add a small amount to scroll to trigger our overscroll logic
                venturesPanel.scrollTop = maxScroll + (e.deltaY * 0.5);
            }
        }, { passive: false });
        
        // Reset on mouse/touch release
        const handleRelease = () => {
            if (!isDismissing && venturesPanel.style.transform && venturesPanel.style.transform !== 'none' && venturesPanel.style.transform !== '') {
                const currentTransform = venturesPanel.style.transform;
                const translateX = parseInt(currentTransform.match(/translateX\((\d+)px\)/)?.[1] || '0');
                
                // If not pushed far enough, spring back
                if (translateX < venturesPanel.offsetWidth * 0.3) {
                    venturesPanel.style.transition = 'transform 0.3s ease-out';
                    venturesPanel.style.transform = '';
                    
                    // Reset scroll position to actual bottom
                    setTimeout(() => {
                        const maxScroll = venturesPanel.scrollHeight - venturesPanel.clientHeight;
                        venturesPanel.scrollTop = maxScroll;
                        startScrollTop = maxScroll;
                    }, 50);
                }
            }
        };
        
        venturesPanel.addEventListener('mouseup', handleRelease);
        venturesPanel.addEventListener('mouseleave', handleRelease);
        venturesPanel.addEventListener('touchend', handleRelease);
        
        // Reset state when panel opens
        const originalOpen = previousVenturesToggle.addEventListener;
        previousVenturesToggle.addEventListener('click', (e) => {
            // Reset all dismiss-related state when opening
            setTimeout(() => {
                isAtBottom = false;
                startScrollTop = 0;
                isDismissing = false;
                hasReachedBottom = false;
                venturesPanel.style.transform = '';
                // Show hint again
                if (scrollHint) {
                    scrollHint.style.opacity = '';
                    scrollHint.style.transform = '';
                }
            }, 100);
        });
    }
    
    // Sarcasm Mode
    const sarcasmToggle = document.getElementById('sarcasm-toggle');
    const profileImg = document.getElementById('profile-image');
    const aboutDescription = document.getElementById('about-description');
    const venturesContent = document.getElementById('ventures-content');
    const contactHeading = document.getElementById('contact-heading');
    let sarcasmMode = false;
    
    // Sarcasm content
    const sarcasmContent = {
        aboutHTML: `
            <p style="margin-bottom: 1.5rem;">Oh, just your typical guy with an insatiable appetite for life's deeper mysteries. I create systems that think, trade, and from time to time question their own existence—not unlike me during 'mandatory' social outings.</p>
            <p>📊 Money - Because the stakes in poker stopped feeling high enough.</p>
            <p>🧬 Molecules – Predicting your choices before you make them.</p>
            <p>🤖 Mind – Helping machines to solve problems humans caused in the first&nbsp;place</p>
        `,
        venturesHTML: `
            <li><a href="https://vespera.us" target="_blank">Vespera</a> – Algorithms that whisper sweet alpha into your portfolio's&nbsp;ear.</li>
            <li><a href="https://xenodex.us" target="_blank">Xenodex&nbsp;Sciences</a> – Quietly reverse-engineering evolution. Pay no attention behind the&nbsp;curtain.</li>
        `
    };
    
    // Get email suffix element
    const emailSuffix = document.querySelector('.email-suffix');
    
    // Store original content
    const originalContent = {
        aboutHTML: aboutDescription.innerHTML,
        venturesHTML: venturesContent.innerHTML,
        profileSrc: profileImg.src
    };
    
    // Sarcastic messages for returning to normal mode
    const sarcasmMessages = [
        "Still Here? Try a dose of sarcasm.", //Default Message
        "Still curious? That makes one of us.", //Second Message (says the same thing but slightly different)
        "Seriously? You're still here? I admire your dedication to procrastination.", //Suprise
        "You realize Netflix exists, right? Much more plot development there.", //Deflect
        "I'm flattered but also starting to get slightly concerned.", //Acknowledgment
        "I bet you read terms and conditions too.", //Friendly Insult
        "This is just getting awkward. Should we exchange numbers?", //Flirty
        "At this point we're basically best friends.", //Acceptance
        "[This message has been removed due to excessive visitor dedication]", //Meta
    ];
    
    let messageIndex = 0;
    let sarcasmActivated = false;
    
    // Two-phase sarcasm mode
    if (sarcasmToggle) {
        sarcasmToggle.addEventListener('click', (e) => {
            e.preventDefault();
            
            if (!sarcasmActivated) {
                // Phase 1: First click - activate sarcasm mode and scroll to about
                sarcasmActivated = true;
                document.body.classList.add('sarcasm-mode');
                profileImg.src = 'profile_photos/portrait_4.png';
                aboutDescription.innerHTML = sarcasmContent.aboutHTML;
                venturesContent.innerHTML = sarcasmContent.venturesHTML;
                emailSuffix.style.display = 'inline';
                
                // Show first message and scroll to about section
                messageIndex = 1; // Move to second message for next click
                sarcasmToggle.textContent = sarcasmMessages[messageIndex];
                
                const aboutSection = document.getElementById('about');
                if (aboutSection) {
                    aboutSection.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
                
                // Reinitialize text reveal for new content
                createTextReveal(document.getElementById('about'));
                createTextReveal(document.getElementById('ventures'));
            } else {
                // Phase 2: Stay in sarcasm mode, just cycle through messages with magical fade effect
                // Start fade out (like Marauder's Map)
                sarcasmToggle.classList.add('fading-out');
                
                // Wait for complete fade out, then change text and fade back in
                setTimeout(() => {
                    if (messageIndex === sarcasmMessages.length - 1) {
                        // Final click - open email
                        const subject = encodeURIComponent("I even clicked the broken message...");
                        const body = encodeURIComponent(
                            "Michael,\n\n" +
                            "I just endured your website's increasingly pointed observations about my life choices, " +
                            "and somehow ended up here.\n\n" +
                            "Clearly, I'm either:\n" +
                            "a) Genuinely fascinated by your work\n" +
                            "b) The world's most thorough procrastinator\n" +
                            "c) Actually looking for that Netflix alternative you mentioned\n\n" +
                            "Truth is,\n\n\n\n\n" +
                            "Sincerely,\n"+
                            "The person your mom warned you about"
                        );

                        window.location.href = `mailto:michael@michaelabdo.com?subject=${subject}&body=${body}`;
                        
                        // Reset entire page to normal mode AFTER email is triggered
                        setTimeout(() => {
                            // Revert to normal mode
                            document.body.classList.remove('sarcasm-mode');
                            profileImg.src = originalContent.profileSrc;
                            aboutDescription.innerHTML = originalContent.aboutHTML;
                            venturesContent.innerHTML = originalContent.venturesHTML;
                            emailSuffix.style.display = 'none';
                            
                            // Reset for next visitor
                            messageIndex = 0;
                            sarcasmActivated = false;
                            sarcasmToggle.textContent = sarcasmMessages[0];
                            sarcasmToggle.classList.remove('fading-out');
                            
                            // Reinitialize text reveal for original content
                            createTextReveal(document.getElementById('about'));
                            createTextReveal(document.getElementById('ventures'));
                        }, 1000);
                    } else {
                        // Advance to next message, stay in sarcasm mode
                        messageIndex++;
                        const nextMessage = sarcasmMessages[messageIndex];
                        
                        // Capture current height to prevent layout shift
                        const currentHeight = sarcasmToggle.offsetHeight;
                        sarcasmToggle.style.minHeight = currentHeight + 'px';
                        
                        // Clear text and remove fade out
                        sarcasmToggle.textContent = '';
                        sarcasmToggle.classList.remove('fading-out');
                        
                        // Start elegant text stream after a brief pause
                        setTimeout(() => {
                            // Split message into words for graceful appearance
                            const words = nextMessage.split(' ');
                            sarcasmToggle.innerHTML = '';
                            
                            words.forEach((word, index) => {
                                const span = document.createElement('span');
                                span.textContent = word;
                                span.style.animationDelay = `${index * 50}ms`;
                                sarcasmToggle.appendChild(span);
                                
                                // Add space after each word except the last
                                if (index < words.length - 1) {
                                    const space = document.createTextNode(' ');
                                    sarcasmToggle.appendChild(space);
                                }
                            });
                            
                            // Remove min-height after animation completes
                            setTimeout(() => {
                                sarcasmToggle.style.minHeight = '';
                            }, 600 + (words.length * 50));
                        }, 200); // Reduced pause before text appears
                    }
                }, 800); // Wait for complete fade out (1.2s)
            }
        });
    }
});