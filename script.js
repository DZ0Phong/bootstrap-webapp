document.addEventListener("DOMContentLoaded", () => {
    const scrollTopBtn = document.getElementById("scrollTopBtn");

    if (scrollTopBtn) {
        window.addEventListener("scroll", () => {
            scrollTopBtn.style.display = window.scrollY > 200 ? "block" : "none";
        });

        scrollTopBtn.addEventListener("click", (event) => {
            event.preventDefault();

            const scrollToTop = () => {
                const currentScroll = document.documentElement.scrollTop || document.body.scrollTop;

                if (currentScroll > 0) {
                    window.requestAnimationFrame(scrollToTop);
                    window.scrollTo(0, currentScroll - currentScroll / 8 - 1);
                }
            };

            scrollToTop();
        });
    }

    const loginSection = document.getElementById("loginSection");
    const signupSection = document.getElementById("signupSection");
    const showSignupBtn = document.getElementById("showSignup");
    const showLoginBtn = document.getElementById("showLogin");

    if (loginSection && signupSection && showSignupBtn && showLoginBtn) {
        showSignupBtn.addEventListener("click", (event) => {
            event.preventDefault();
            loginSection.classList.add("d-none");
            signupSection.classList.remove("d-none");
            signupSection.classList.add("fade-in");
        });

        showLoginBtn.addEventListener("click", (event) => {
            event.preventDefault();
            signupSection.classList.add("d-none");
            loginSection.classList.remove("d-none");
            loginSection.classList.add("fade-in");
        });
    }

    const loginForm = document.getElementById("loginForm");
    const signupForm = document.getElementById("signupForm");

    if (signupForm) {
        signupForm.addEventListener("submit", (event) => {
            event.preventDefault();
            alert("You registered successfully!");
            showLoginBtn.click();
            signupForm.reset();
        });
    }

    if (loginForm) {
        loginForm.addEventListener("submit", (event) => {
            event.preventDefault();
            alert("Welcome to home page!");
            window.location.href = "task1-home.html";
        });
    }
});
