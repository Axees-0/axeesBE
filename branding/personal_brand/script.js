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
            <p style="margin-bottom: 1.5rem;">Oh, just your typical guy obsessively curious about the world and our place in it. I build systems that think, trade, and occasionally question their own existence—not unlike me during mandatory social outings.</p>
            <p>📊 Quantitative Finance - Because poker got boring.</p>
            <p>🧬 Behavioral Genetics - Mapping personality from genes.</p>
            <p>🤖 Computational Intelligence - Teaching machines to solve problems humans caused in the first place</p>
        `,
        venturesHTML: `
            <li><a href="https://vespera.us" target="_blank">Vespera</a> - Trading so reliable, it almost feels unfair... almost.</li>
            <li><a href="https://xenodex.us" target="_blank">Xenodex Sciences</a> - Where behavioral genetics meets AI and quietly redefines what it means to be human (don't look here).</li>
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
        "Still Here? Try a dose of sarcasm", //Default Message
        "Still curious? That makes one of us", //Second Message (says the same thing but slightly different)
        "Seriously? You're still here? I admire your dedication to procrastination", //Suprise
        "You realize Netflix exists, right? Much more plot development there", //Deflect
        "I'm flattered but also starting to get slightly concerned", //Acknowledgment
        "I bet you read terms and conditions too", //Friendly Insult
        "This is just getting awkward. Should we exchange numbers?", //Flirty
        "At this point we're basically best friends", //Acceptance
        "[This message has been removed due to excessive visitor dedication]", //Meta
    ];
    
    let messageIndex = 0;
    let firstSarcasmClick = true;
    
    // Toggle sarcasm mode
    if (sarcasmToggle) {
        sarcasmToggle.addEventListener('click', (e) => {
            e.preventDefault();
            sarcasmMode = !sarcasmMode;
            
            if (sarcasmMode) {
                // Enable sarcasm mode
                document.body.classList.add('sarcasm-mode');
                profileImg.src = 'profile_photos/portrait_4.png';
                aboutDescription.innerHTML = sarcasmContent.aboutHTML;
                venturesContent.innerHTML = sarcasmContent.venturesHTML;
                emailSuffix.style.display = 'inline';
                sarcasmToggle.textContent = 'Back to boring mode';
                
                // Only scroll to about section on first click
                if (firstSarcasmClick) {
                    const aboutSection = document.getElementById('about');
                    if (aboutSection) {
                        aboutSection.scrollIntoView({
                            behavior: 'smooth',
                            block: 'start'
                        });
                    }
                    firstSarcasmClick = false;
                }
                // Otherwise stay at the bottom where the button is
                
                // Reinitialize text reveal for new content
                createTextReveal(document.getElementById('about'));
                createTextReveal(document.getElementById('ventures'));
            } else {
                // Check if we've reached the final message
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
                      "Truth is,\n\n" +

                      "- The person your mom warned you about"
                  );

                    window.location.href = `mailto:michael@michaelabdo.com?subject=${subject}&body=${body}`;
                    
                    // Reset for next visitor
                    messageIndex = 0;
                    sarcasmToggle.textContent = sarcasmMessages[0];
                } else {
                    // Disable sarcasm mode
                    document.body.classList.remove('sarcasm-mode');
                    profileImg.src = originalContent.profileSrc;
                    aboutDescription.innerHTML = originalContent.aboutHTML;
                    venturesContent.innerHTML = originalContent.venturesHTML;
                    emailSuffix.style.display = 'none';
                    
                    // Cycle through sarcasm messages
                    messageIndex = (messageIndex + 1) % sarcasmMessages.length;
                    sarcasmToggle.textContent = sarcasmMessages[messageIndex];
                    
                    // Reinitialize text reveal for original content
                    createTextReveal(document.getElementById('about'));
                    createTextReveal(document.getElementById('ventures'));
                }
            }
        });
    }
});