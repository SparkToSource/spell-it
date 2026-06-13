/* Should not be imported as a module to prevent light theme flicker */
class Theme {
  static THEME_KEY = "theme";

  applyTheme(){
    const savedTheme = localStorage.getItem(Theme.THEME_KEY);

    if (savedTheme === "dark" || (!savedTheme && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
      document.documentElement.setAttribute("data-theme", "dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
  }

  setTheme(theme) {
    localStorage.setItem(Theme.THEME_KEY, theme);
    this.applyTheme();
  }

  getTheme() {
    const systemScheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    return localStorage.getItem(Theme.THEME_KEY) ?? systemScheme;
  }

  delete() {
    localStorage.removeItem(Theme.THEME_KEY);
  }
}

const theme = new Theme();
theme.applyTheme();
