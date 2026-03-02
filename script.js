document.addEventListener("DOMContentLoaded", () => {
    /* -------------------------------------
       1. Scroll to Top Logic (index.html)
       ------------------------------------- */
    const scrollTopBtn = document.getElementById("scrollTopBtn");

    if (scrollTopBtn) {
        window.addEventListener("scroll", () => {
            // Show button when scrolled down 200px
            if (window.scrollY > 200) {
                scrollTopBtn.style.display = "block";
            } else {
                scrollTopBtn.style.display = "none";
            }
        });

        // Khung hình mịn với JavaScript có khả năng huỷ chu kỳ vòng lặp khi chạm đích
        scrollTopBtn.addEventListener("click", (e) => {
            e.preventDefault();
            const scrollToTop = () => {
                const c = document.documentElement.scrollTop || document.body.scrollTop;
                if (c > 0) {
                    window.requestAnimationFrame(scrollToTop);
                    // Dùng -1 để đảm bảo c sẽ đạt 0, tránh lỗi số đuôi thập phân mắc kẹt vòng lặp (gây giật)
                    window.scrollTo(0, c - c / 8 - 1);
                }
            };
            scrollToTop();
        });
    }

    /* -------------------------------------
       2. Login / Signup Form Switch 
       ------------------------------------- */
    const loginSection = document.getElementById("loginSection");
    const signupSection = document.getElementById("signupSection");
    const showSignupBtn = document.getElementById("showSignup");
    const showLoginBtn = document.getElementById("showLogin");

    if (loginSection && signupSection && showSignupBtn && showLoginBtn) {
        // Show Signup, hide Login
        showSignupBtn.addEventListener("click", (e) => {
            e.preventDefault();
            loginSection.classList.add("d-none");
            signupSection.classList.remove("d-none");
            signupSection.classList.add("fade-in");
        });

        // Show Login, hide Signup
        showLoginBtn.addEventListener("click", (e) => {
            e.preventDefault();
            signupSection.classList.add("d-none");
            loginSection.classList.remove("d-none");
            loginSection.classList.add("fade-in");
        });
    }

    /* -------------------------------------
       3. Form Submission Handling
       ------------------------------------- */
    const loginForm = document.getElementById("loginForm");
    const signupForm = document.getElementById("signupForm");

    if (signupForm) {
        signupForm.addEventListener("submit", (e) => {
            e.preventDefault(); // Prevent actual form submission
            alert("You registered successfully!");
            // Optionally switch to login after signup
            showLoginBtn.click();
            signupForm.reset();
        });
    }

    if (loginForm) {
        loginForm.addEventListener("submit", (e) => {
            e.preventDefault(); // Prevent actual form submission
            alert("Welcome to home page!");
            // Redirect to homepage
            window.location.href = "index.html";
        });
    }
});
